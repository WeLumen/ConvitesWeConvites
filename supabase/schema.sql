-- =============================================================
-- Livro de recados do convite da Kathllyn — Supabase
-- Cole TUDO no Supabase > SQL Editor > New query > Run.
-- Pode rodar mais de uma vez sem problema (é idempotente).
-- =============================================================

-- 1) Tabela -----------------------------------------------------
create table if not exists public.recados (
  id         bigint generated always as identity primary key,
  nome       text        not null,
  mensagem   text        not null,
  criado_em  timestamptz not null default now(),
  aprovado   boolean     not null default true,   -- mude para false para esconder um recado
  ip_hash    text,                                -- só um "resumo" do IP para limitar spam; nunca é exibido

  constraint recados_nome_tamanho     check (char_length(btrim(nome)) between 2 and 60),
  constraint recados_mensagem_tamanho check (char_length(btrim(mensagem)) between 3 and 500),
  constraint recados_sem_links        check (nome !~* '(https?://|www\.)' and mensagem !~* '(https?://|www\.)')
);

create index if not exists recados_criado_em_idx on public.recados (criado_em desc);

-- 2) Segurança em nível de linha (RLS) --------------------------
alter table public.recados enable row level security;

drop policy if exists "convidados leem recados aprovados" on public.recados;
create policy "convidados leem recados aprovados"
  on public.recados for select
  to anon, authenticated
  using (aprovado = true);

drop policy if exists "convidados publicam recados" on public.recados;
create policy "convidados publicam recados"
  on public.recados for insert
  to anon, authenticated
  with check (aprovado = true);

-- Ninguém de fora pode editar ou apagar (não há policy de update/delete).

-- 3) Permissões por coluna --------------------------------------
-- O público só lê nome/mensagem/data e só escreve nome/mensagem.
-- (id, aprovado, ip_hash e criado_em ficam fora do alcance do navegador.)
revoke all on table public.recados from anon, authenticated;
grant select (nome, mensagem, criado_em) on table public.recados to anon, authenticated;
grant insert (nome, mensagem)            on table public.recados to anon, authenticated;

-- 4) Limpeza + anti-spam no servidor ----------------------------
create or replace function public.recados_antes_de_inserir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cabecalhos json;
  ip text;
begin
  -- normaliza espaços
  new.nome     := btrim(regexp_replace(new.nome, '\s+', ' ', 'g'));
  new.mensagem := btrim(regexp_replace(new.mensagem, '\n{3,}', E'\n\n', 'g'));
  new.criado_em := now();
  new.aprovado  := true;

  -- resumo (hash) do IP do visitante, quando disponível
  begin
    cabecalhos := current_setting('request.headers', true)::json;
  exception when others then
    cabecalhos := null;
  end;
  ip := coalesce(
          cabecalhos ->> 'cf-connecting-ip',
          split_part(coalesce(cabecalhos ->> 'x-forwarded-for', ''), ',', 1)
        );
  if ip is not null and ip <> '' then
    new.ip_hash := md5(ip || 'convite-kathllyn');
  end if;

  -- mesmo recado repetido em 10 minutos
  if exists (
    select 1 from public.recados r
    where r.criado_em > now() - interval '10 minutes'
      and lower(r.nome) = lower(new.nome)
      and lower(r.mensagem) = lower(new.mensagem)
  ) then
    raise exception 'recado_repetido' using errcode = 'P0001';
  end if;

  -- no máximo 3 recados por pessoa (IP) a cada 10 minutos
  if new.ip_hash is not null and (
    select count(*) from public.recados r
    where r.ip_hash = new.ip_hash and r.criado_em > now() - interval '10 minutes'
  ) >= 3 then
    raise exception 'muitos_recados' using errcode = 'P0001';
  end if;

  -- trava geral: no máximo 30 recados de todo mundo a cada 2 minutos
  if (
    select count(*) from public.recados r
    where r.criado_em > now() - interval '2 minutes'
  ) >= 30 then
    raise exception 'muitos_recados' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.recados_antes_de_inserir() from public, anon, authenticated;

drop trigger if exists recados_antes_de_inserir on public.recados;
create trigger recados_antes_de_inserir
  before insert on public.recados
  for each row execute function public.recados_antes_de_inserir();

-- =============================================================
-- MODERAÇÃO (rode no SQL Editor quando precisar)
-- Ver todos:      select id, nome, mensagem, criado_em, aprovado from public.recados order by criado_em desc;
-- Esconder um:    update public.recados set aprovado = false where id = 123;
-- Apagar um:      delete from public.recados where id = 123;
-- =============================================================
