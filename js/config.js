/* ============================================================
   CONFIGURAÇÃO DO CONVITE — edite apenas este arquivo
   ============================================================
   Tudo o que ainda precisa ser confirmado está marcado com
   "PREENCHER". Nada aqui é segredo: este arquivo é público.
   NUNCA coloque aqui a chave "service_role" / "secret" do Supabase.
   ============================================================ */

window.CONVITE_CONFIG = {
  /* ---------- Evento ---------- */
  nome: "Kathllyn",

  // Data e hora no fuso de São Paulo (America/Sao_Paulo, UTC-03:00).
  // 07/11/2026 às 18h em São Paulo = 21h UTC.
  inicioUTC: "2026-11-07T21:00:00Z",

  // Duração usada SOMENTE no lembrete do calendário
  // (Google Agenda e arquivo .ics exigem horário de término).
  // O término não foi informado — ajuste se souber. PREENCHER (opcional)
  duracaoHorasCalendario: 4,

  /* ---------- Endereço ---------- */
  // Mantido exatamente como informado.
  enderecoRua: "Rua Miguel Lopes, 36",

  // Bairro, cidade e estado NÃO foram informados.
  // Preencha para o mapa encontrar o local certo, ex.: "Bairro, Cidade - UF".
  // PREENCHER
  enderecoComplemento: "",

  /* ---------- WhatsApp (confirmação de presença) ---------- */
  // Número da anfitriã no formato internacional, SÓ dígitos:
  // 55 + DDD + número. Ex.: "5511987654321". PREENCHER
  // Enquanto estiver vazio, o botão abre o WhatsApp para o convidado
  // escolher para quem enviar (compartilhamento genérico).
  whatsappNumero: "5511951241321",

  /* ---------- Foto da seção do churrasco (opcional) ---------- */
  // Caminho ou endereço de uma foto de churrasco (ex.: "fotos/churrasco.jpg").
  // Vazio = fundo ilustrado em tons de brasa, sem foto.
  imagemChurrasco: "",

  /* ---------- Livro de recados (Supabase) ---------- */
  // Supabase > Project Settings > API Keys / Data API.
  // URL do projeto, ex.: "https://abcdefghijklmno.supabase.co". PREENCHER
  supabaseUrl: "https://stfvzzrsfmwpqvjnwqns.supabase.co",

  // Chave PÚBLICA: "publishable key" (sb_publishable_...) ou a antiga "anon".
  // PREENCHER
  supabaseChavePublica: "sb_publishable_CfvaMc8lfp_wgDFUeZ3W6Q_eEKRbaEq",

  // Nome da tabela criada pelo arquivo supabase/schema.sql
  supabaseTabela: "recados",

  // Quantos recados mostrar
  limiteRecados: 60,
};
