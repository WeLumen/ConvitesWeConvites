/* =========================================================
   Convite Kathllyn — comportamento
   Sem dependências. Todo texto digitado por convidados é
   inserido com textContent (nunca innerHTML).
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.CONVITE_CONFIG || {};
  var FUSO = "America/Sao_Paulo";
  var INICIO = new Date(CFG.inicioUTC || "2026-11-07T21:00:00Z");
  var DURACAO_H = Number(CFG.duracaoHorasCalendario) > 0 ? Number(CFG.duracaoHorasCalendario) : 4;
  var FIM = new Date(INICIO.getTime() + DURACAO_H * 3600 * 1000);
  var NOME = CFG.nome || "Kathllyn";
  var RUA = String(CFG.enderecoRua || "Rua Miguel Lopes, 36").trim();
  var COMPLEMENTO = String(CFG.enderecoComplemento || "").trim();
  var ENDERECO = COMPLEMENTO ? RUA + " – " + COMPLEMENTO : RUA;
  var WHATS = String(CFG.whatsappNumero || "").replace(/\D/g, "");
  var mqMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  var movimentoReduzido = mqMovimento.matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Aviso flutuante ---------- */
  var avisoTimer;
  function avisar(texto) {
    var el = $("#aviso-flutuante");
    if (!el) return;
    el.textContent = texto;
    el.classList.add("visivel");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { el.classList.remove("visivel"); }, 3200);
  }

  /* ---------- Armazenamento seguro (pode falhar em aba anônima) ---------- */
  var guardar = {
    ler: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    gravar: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignora */ } }
  };

  /* =========================================================
     ENDEREÇO + MAPA
     ========================================================= */
  $$("[data-endereco-rua]").forEach(function (el) { el.textContent = RUA; });
  $$("[data-endereco-complemento]").forEach(function (el) {
    if (COMPLEMENTO) { el.textContent = COMPLEMENTO; el.hidden = false; }
  });
  var botaoMapa = $("#botao-mapa");
  if (botaoMapa) botaoMapa.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ENDERECO);

  /* ---------- Foto opcional do churrasco ---------- */
  var imgChurrasco = String(CFG.imagemChurrasco || "").trim();
  var fundoFesta = $("#festa-fundo");
  if (imgChurrasco && fundoFesta && /^(https:\/\/|\.?\/?[\w\-\/]+\.(jpe?g|png|webp|avif)$)/i.test(imgChurrasco)) {
    var teste = new Image();
    teste.onload = function () {
      fundoFesta.style.backgroundImage = 'url("' + imgChurrasco.replace(/["\\]/g, "") + '")';
      fundoFesta.classList.add("com-foto");
    };
    teste.src = imgChurrasco;
  }

  /* =========================================================
     PARTÍCULAS (canvas leve, pausado fora da tela)
     ========================================================= */
  var paletas = {
    ouro: ["245, 240, 231", "230, 210, 166", "216, 188, 130"],
    brasa: ["230, 210, 166", "216, 188, 130", "214, 170, 120"]
  };
  function sprite(rgb) {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(" + rgb + ",1)");
    g.addColorStop(.18, "rgba(" + rgb + ",.85)");
    g.addColorStop(.45, "rgba(" + rgb + ",.22)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return c;
  }
  var animadores = {};
  function iniciarParticulas(id, opcoes) {
    var canvas = document.getElementById(id);
    if (!canvas || !canvas.getContext || movimentoReduzido) return;
    var ctx = canvas.getContext("2d");
    var cores = (paletas[opcoes.paleta] || paletas.ouro).map(sprite);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, lista = [], rodando = false, raf = 0, anterior = 0;

    function medir() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function nova(inicio) {
      var bokeh = Math.random() < (opcoes.bokeh || .25);
      return {
        x: Math.random() * w,
        y: inicio ? Math.random() * h : h + 20,
        t: bokeh ? 10 + Math.random() * 16 : 3 + Math.random() * 5,     // tamanho do brilho
        a: bokeh ? .08 + Math.random() * .12 : .35 + Math.random() * .5, // opacidade máxima
        vy: (opcoes.velocidade || .12) * (.5 + Math.random()),
        vx: (Math.random() - .5) * .08,
        fase: Math.random() * 6.28, ritmo: .004 + Math.random() * .01,
        cor: cores[(Math.random() * cores.length) | 0],
        estrela: !bokeh && Math.random() < .14
      };
    }
    function quadro(t) {
      var passo = anterior ? Math.min((t - anterior) / 16.7, 3) : 1; anterior = t;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        p.y -= p.vy * passo; p.x += p.vx * passo; p.fase += p.ritmo * passo;
        if (p.y < -30) { lista[i] = p = nova(false); }
        var brilho = p.a * (.45 + .55 * (Math.sin(p.fase) + 1) / 2);
        ctx.globalAlpha = brilho;
        ctx.drawImage(p.cor, p.x - p.t / 2, p.y - p.t / 2, p.t, p.t);
        if (p.estrela && brilho > .5) {
          ctx.globalAlpha = brilho * .5;
          ctx.drawImage(p.cor, p.x - p.t * 1.6, p.y - .5, p.t * 3.2, 1);
          ctx.drawImage(p.cor, p.x - .5, p.y - p.t * 1.6, 1, p.t * 3.2);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(quadro);
    }
    function ligar() { if (!rodando) { rodando = true; anterior = 0; raf = requestAnimationFrame(quadro); } }
    function desligar() { rodando = false; cancelAnimationFrame(raf); }

    medir();
    var total = Math.round((opcoes.densidade || 24) * Math.min(1.4, Math.max(.6, w / 900)));
    for (var i = 0; i < total; i++) lista.push(nova(true));
    var timerResize;
    window.addEventListener("resize", function () { clearTimeout(timerResize); timerResize = setTimeout(medir, 150); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? ligar() : desligar(); }).observe(canvas);
    } else ligar();
    animadores[id] = { desligar: desligar };
  }
  function pararParticulas(id) { if (animadores[id]) { animadores[id].desligar(); delete animadores[id]; } }


  /* =========================================================
     CÉU ESTRELADO DA ABERTURA
     Estrelas pequenas que cintilam, algumas estrelas douradas
     com brilho em cruz e poucas partículas que sobem devagar.
     Com "reduzir movimento", desenha um único quadro estático.
     ========================================================= */
  function iniciarCeu(id, areaLivre) {
    var canvas = document.getElementById(id);
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, estrelas = [], grandes = [], poeira = [], raf = 0, rodando = false, anterior = 0;
    var spriteOuro = sprite("216, 188, 130"), spriteBranco = sprite("245, 240, 231");
    var px = 0, py = 0, alvoX = 0, alvoY = 0;

    function livre(x, y) { // evita brilhos grandes atrás do texto
      var r = areaLivre && areaLivre.getBoundingClientRect();
      if (!r || !r.width) return true;
      return !(x > r.left - 30 && x < r.right + 30 && y > r.top - 20 && y < r.bottom + 20);
    }
    function criar() {
      var area = w * h;
      var total = Math.min(380, Math.round(area / (w < 600 ? 2600 : 4200)));
      estrelas = [];
      for (var i = 0; i < total; i++) {
        var z = Math.random();
        estrelas.push({
          x: Math.random() * w, y: Math.pow(Math.random(), 1.25) * h * .92, // mais densas no alto
          r: z < .82 ? .35 + Math.random() * .5 : .8 + Math.random() * .7,
          a: .25 + Math.random() * .6, fase: Math.random() * 6.28, ritmo: .006 + Math.random() * .02,
          quente: Math.random() < .35, prof: .2 + z * .8
        });
      }
      grandes = [];
      var alvo = w < 600 ? 5 : w < 1100 ? 7 : 9, tentativas = 0;
      while (grandes.length < alvo && tentativas++ < 300) {
        var gx = w * (.04 + Math.random() * .92), gy = h * (.04 + Math.random() * .7);
        if (!livre(gx, gy)) continue;
        grandes.push({ x: gx, y: gy, t: (w < 600 ? 10 : 13) + Math.random() * 14, fase: Math.random() * 6.28, ritmo: .006 + Math.random() * .008 });
      }
      poeira = [];
      var nPoeira = w < 600 ? 9 : 14;
      for (var k = 0; k < nPoeira; k++) poeira.push(novaPoeira(true));
    }
    function novaPoeira(inicio) {
      return { x: Math.random() * w, y: inicio ? Math.random() * h : h + 20, t: 3 + Math.random() * 6, a: .25 + Math.random() * .4,
               vy: .08 + Math.random() * .16, vx: (Math.random() - .5) * .06, fase: Math.random() * 6.28 };
    }
    function medir() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      criar();
    }
    function desenhar(passo) {
      ctx.clearRect(0, 0, w, h);
      px += (alvoX - px) * .04; py += (alvoY - py) * .04;
      var i, e, a;
      for (i = 0; i < estrelas.length; i++) {
        e = estrelas[i];
        e.fase += e.ritmo * passo;
        e.x -= .012 * e.prof * passo;                       // deriva quase imperceptível
        if (e.x < -2) e.x = w + 2;
        a = e.a * (.55 + .45 * Math.sin(e.fase));
        ctx.globalAlpha = a;
        ctx.fillStyle = e.quente ? "#E6D2A6" : "#F5F0E7";
        var sx = e.x + px * e.prof, sy = e.y + py * e.prof;
        if (e.r < .8) ctx.fillRect(sx, sy, e.r * 2, e.r * 2);
        else { ctx.beginPath(); ctx.arc(sx, sy, e.r, 0, 6.283); ctx.fill(); }
      }
      for (i = 0; i < grandes.length; i++) {
        var g = grandes[i];
        g.fase += g.ritmo * passo;
        var b = .55 + .45 * Math.sin(g.fase);
        var gx = g.x + px * 1.2, gy = g.y + py * 1.2, t = g.t * (.8 + .2 * b);
        ctx.globalAlpha = .9 * b;
        ctx.drawImage(spriteOuro, gx - t * .45, gy - t * .45, t * .9, t * .9);
        ctx.globalAlpha = .7 * b;
        ctx.drawImage(spriteBranco, gx - t * 1.6, gy - .6, t * 3.2, 1.2);   // brilho horizontal
        ctx.drawImage(spriteBranco, gx - .6, gy - t * 1.6, 1.2, t * 3.2);   // brilho vertical
        ctx.globalAlpha = b;
        ctx.drawImage(spriteBranco, gx - 2.5, gy - 2.5, 5, 5);
      }
      for (i = 0; i < poeira.length; i++) {
        var p = poeira[i];
        p.y -= p.vy * passo; p.x += p.vx * passo; p.fase += .01 * passo;
        if (p.y < -20) poeira[i] = p = novaPoeira(false);
        ctx.globalAlpha = p.a * (.5 + .5 * Math.sin(p.fase));
        ctx.drawImage(spriteOuro, p.x - p.t / 2, p.y - p.t / 2, p.t, p.t);
      }
      ctx.globalAlpha = 1;
    }
    function quadro(t) {
      var passo = anterior ? Math.min((t - anterior) / 16.7, 3) : 1; anterior = t;
      desenhar(passo);
      raf = requestAnimationFrame(quadro);
    }
    function ligar() { if (rodando || movimentoReduzido) return; rodando = true; anterior = 0; raf = requestAnimationFrame(quadro); }
    function desligar() { rodando = false; cancelAnimationFrame(raf); }

    medir();
    // espera as fontes para medir a área do texto antes de posicionar as estrelas maiores
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { criar(); if (movimentoReduzido) desenhar(0); });
    if (movimentoReduzido) desenhar(0); else ligar();
    var tmr;
    window.addEventListener("resize", function () { clearTimeout(tmr); tmr = setTimeout(function () { medir(); if (movimentoReduzido) desenhar(0); }, 150); });
    if (!movimentoReduzido && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", function (ev) { alvoX = (ev.clientX / w - .5) * -10; alvoY = (ev.clientY / h - .5) * -8; }, { passive: true });
    }
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && canvas.isConnected && !canvas.closest("[hidden]")) ligar(); else desligar(); });
    return { desligar: desligar };
  }
  var ceuAbertura = iniciarCeu("estrelas-abertura", document.querySelector(".abertura__conteudo"));
  iniciarParticulas("particulas-brasa", { paleta: "brasa", densidade: 22, bokeh: .2, velocidade: .32 });
  iniciarParticulas("particulas-final", { paleta: "ouro", densidade: 14, bokeh: .35, velocidade: .1 });

  /* =========================================================
     ABERTURA
     ========================================================= */
  var abertura = $("#abertura");
  var botaoAbrir = $("#abrir-convite");
  var banner = $(".banner");

  function abrirConvite() {
    if (!abertura || abertura.classList.contains("fechada")) return;
    abertura.classList.add("fechada");
    abertura.setAttribute("aria-hidden", "true");
    document.body.classList.remove("travado");
    if (banner) banner.classList.add("visivel");
    var main = $("#conteudo");
    if (main) main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    setTimeout(function () { abertura.hidden = true; if (ceuAbertura) ceuAbertura.desligar(); }, 1000);
  }
  if (abertura) {
    document.body.classList.add("travado");
    if (botaoAbrir) {
      botaoAbrir.addEventListener("click", abrirConvite);
      setTimeout(function () { abertura.focus({ preventScroll: true }); }, 60);
    }
    abertura.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); if (botaoAbrir) botaoAbrir.focus(); } // único elemento interativo da abertura
      if (e.key === "Escape") abrirConvite();
    });
  } else if (banner) banner.classList.add("visivel");

  /* =========================================================
     REVELAR AO ROLAR
     ========================================================= */
  if ("IntersectionObserver" in window && !movimentoReduzido) {
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visivel"); obs.unobserve(e.target); } });
    }, { threshold: .1, rootMargin: "0px 0px -30px 0px" });
    $$(".revelar").forEach(function (el) { obs.observe(el); });
  } else {
    $$(".revelar").forEach(function (el) { el.classList.add("visivel"); });
  }

  /* =========================================================
     CONTAGEM REGRESSIVA (07/11/2026 18h, São Paulo)
     ========================================================= */
  var nums = {};
  $$("[data-unidade]").forEach(function (el) { nums[el.getAttribute("data-unidade")] = el; });
  var blocoContagem = $("#contagem");
  var frase = $("#contagem-frase");
  var leitor = $("#contagem-leitor");
  var ultimaLeitura = null;
  function doisDig(n) { return n < 10 ? "0" + n : String(n); }
  function atualizarContagem() {
    var agora = Date.now();
    var resto = INICIO.getTime() - agora;
    if (resto <= 0) {
      if (blocoContagem) blocoContagem.classList.add("terminou");
      if (frase) {
        frase.hidden = false;
        frase.textContent = agora < FIM.getTime() ? "Chegou a hora! Te espero lá." : "Obrigada por fazer parte desta comemoração.";
      }
      return false;
    }
    var s = Math.floor(resto / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    if (nums.dias) nums.dias.textContent = String(d);
    if (nums.horas) nums.horas.textContent = doisDig(h);
    if (nums.minutos) nums.minutos.textContent = doisDig(m);
    if (nums.segundos) nums.segundos.textContent = doisDig(s);
    if (leitor && ultimaLeitura !== d + ":" + h) { ultimaLeitura = d + ":" + h; leitor.textContent = "Faltam " + d + " dias e " + h + " horas."; }
    return true;
  }
  if (atualizarContagem()) {
    var relogio = setInterval(function () { if (!atualizarContagem()) clearInterval(relogio); }, 1000);
  }

  /* =========================================================
     CALENDÁRIO (Google Agenda + .ics)
     ========================================================= */
  function formatoCal(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  var tituloEvento = "Aniversário da " + NOME + " · churrasco";
  var descricaoEvento = "Churrasco de aniversário da " + NOME + " — sábado, 07 de novembro de 2026, às 18h.\nConvite: " + location.href.split("#")[0];

  var linkGoogle = $("#calendario-google");
  if (linkGoogle) {
    linkGoogle.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(tituloEvento) +
      "&dates=" + formatoCal(INICIO) + "/" + formatoCal(FIM) +
      "&details=" + encodeURIComponent(descricaoEvento) +
      "&location=" + encodeURIComponent(ENDERECO) +
      "&ctz=" + encodeURIComponent(FUSO);
  }
  function escaparIcs(t) { return String(t).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1"); }
  function baixarIcs() {
    var linhas = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Convite Kathllyn//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:aniversario-kathllyn-20261107@convite",
      "DTSTAMP:" + formatoCal(new Date()),
      "DTSTART:" + formatoCal(INICIO),
      "DTEND:" + formatoCal(FIM),
      "SUMMARY:" + escaparIcs(tituloEvento),
      "DESCRIPTION:" + escaparIcs(descricaoEvento),
      "LOCATION:" + escaparIcs(ENDERECO),
      "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:" + escaparIcs(tituloEvento + " hoje às 18h"), "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ];
    var blob = new Blob([linhas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "aniversario-kathllyn.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    avisar("Arquivo do calendário baixado. Abra para salvar o evento.");
  }
  var botaoCal = $("#botao-calendario");
  var opcoesCal = $("#opcoes-calendario");
  function fecharMenuCal(devolverFoco) {
    if (!opcoesCal || opcoesCal.hidden) return;
    opcoesCal.hidden = true;
    botaoCal.setAttribute("aria-expanded", "false");
    if (devolverFoco) botaoCal.focus();
  }
  if (botaoCal && opcoesCal) {
    botaoCal.addEventListener("click", function () {
      var abrir = opcoesCal.hidden;
      opcoesCal.hidden = !abrir;
      botaoCal.setAttribute("aria-expanded", String(abrir));
      if (abrir) { var p = opcoesCal.querySelector("a,button"); if (p) p.focus(); }
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".menu-calendario")) fecharMenuCal(false); });
    opcoesCal.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); fecharMenuCal(true); } });
    if (linkGoogle) linkGoogle.addEventListener("click", function () { fecharMenuCal(false); });
    var botaoIcs = $("#calendario-ics");
    if (botaoIcs) botaoIcs.addEventListener("click", function () { baixarIcs(); fecharMenuCal(true); });
  }

  /* =========================================================
     CARROSSEL
     ========================================================= */
  var trilha = $("#carrossel-trilha");
  var slides = $$(".carrossel__slide");
  var pontosBox = $("#carrossel-pontos");
  var botaoPausa = $("#carrossel-pausa");
  var statusCarrossel = $("#carrossel-status");
  var indice = 0, pontos = [];
  var INTERVALO = 6000;
  var autoTimer = null, pausadoPeloUsuario = false, interagindo = false, carrosselVisivel = false, retomarTimer = null;

  function centroDe(slide) { return slide.offsetLeft + slide.offsetWidth / 2 - trilha.clientWidth / 2; }
  function irPara(i, origem) {
    if (!slides.length) return;
    i = (i + slides.length) % slides.length;
    trilha.scrollTo({ left: centroDe(slides[i]), behavior: movimentoReduzido ? "auto" : "smooth" });
    marcar(i, origem !== "auto");
  }
  function marcar(i, anunciar) {
    if (i === indice && slides[i].classList.contains("ativo")) return;
    indice = i;
    slides.forEach(function (s, k) {
      var ativo = k === i;
      s.classList.toggle("ativo", ativo);
      var btn = s.querySelector("button");
      if (btn) btn.tabIndex = ativo ? 0 : -1;
    });
    pontos.forEach(function (p, k) { p.setAttribute("aria-current", k === i ? "true" : "false"); });
    if (anunciar && statusCarrossel) statusCarrossel.textContent = "Foto " + (i + 1) + " de " + slides.length;
  }
  function detectarAtual() {
    var centro = trilha.scrollLeft + trilha.clientWidth / 2, melhor = 0, dist = Infinity;
    slides.forEach(function (s, k) {
      var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - centro);
      if (d < dist) { dist = d; melhor = k; }
    });
    marcar(melhor, false);
  }

  function autoPodeRodar() { return !movimentoReduzido && !pausadoPeloUsuario && !interagindo && carrosselVisivel && document.visibilityState === "visible" && (!lightbox || lightbox.hidden); }
  function agendarAuto() {
    clearTimeout(autoTimer);
    if (autoPodeRodar()) autoTimer = setTimeout(function () { if (autoPodeRodar()) irPara(indice + 1, "auto"); agendarAuto(); }, INTERVALO);
  }
  function pausarInteracao() { interagindo = true; clearTimeout(autoTimer); clearTimeout(retomarTimer); }
  function retomarDepois(ms) { clearTimeout(retomarTimer); retomarTimer = setTimeout(function () { interagindo = false; agendarAuto(); }, ms); }

  if (trilha && slides.length) {
    slides.forEach(function (s, k) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ir para a foto " + (k + 1));
      b.addEventListener("click", function () { irPara(k); });
      pontosBox.appendChild(b);
      pontos.push(b);
    });
    var inicial = Math.min(Math.max(parseInt(trilha.getAttribute("data-inicio"), 10) || 0, 0), slides.length - 1);
    marcar(inicial, false);
    trilha.style.scrollBehavior = "auto";
    trilha.scrollLeft = centroDe(slides[inicial]);
    requestAnimationFrame(function () { trilha.scrollLeft = centroDe(slides[inicial]); trilha.style.scrollBehavior = ""; });

    var rafScroll = 0;
    trilha.addEventListener("scroll", function () {
      cancelAnimationFrame(rafScroll);
      rafScroll = requestAnimationFrame(detectarAtual);
    }, { passive: true });

    $("#carrossel-ant").addEventListener("click", function () { irPara(indice - 1); });
    $("#carrossel-prox").addEventListener("click", function () { irPara(indice + 1); });

    var carrossel = $("#carrossel");
    carrossel.addEventListener("keydown", function (e) {
      if (e.target.closest(".carrossel__pontos")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); irPara(indice + 1); var b = slides[indice].querySelector("button"); if (b) b.focus({ preventScroll: true }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); irPara(indice - 1); var c = slides[indice].querySelector("button"); if (c) c.focus({ preventScroll: true }); }
    });

    // Pausa enquanto a pessoa interage (mouse em cima, foco, toque)
    carrossel.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") pausarInteracao(); });
    carrossel.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") retomarDepois(1500); });
    carrossel.addEventListener("focusin", pausarInteracao);
    carrossel.addEventListener("focusout", function (e) { if (!carrossel.contains(e.relatedTarget)) retomarDepois(2500); });
    trilha.addEventListener("touchstart", pausarInteracao, { passive: true });
    trilha.addEventListener("touchend", function () { retomarDepois(9000); }, { passive: true });

    if (!movimentoReduzido && botaoPausa) {
      botaoPausa.hidden = false;
      botaoPausa.addEventListener("click", function () {
        pausadoPeloUsuario = !pausadoPeloUsuario;
        botaoPausa.setAttribute("aria-pressed", String(pausadoPeloUsuario));
        $("#carrossel-pausa-rotulo").textContent = pausadoPeloUsuario ? "Retomar passagem automática" : "Pausar passagem automática";
        if (pausadoPeloUsuario) clearTimeout(autoTimer); else agendarAuto();
      });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { carrosselVisivel = e[0].isIntersecting; carrosselVisivel ? agendarAuto() : clearTimeout(autoTimer); }, { threshold: .45 }).observe(trilha);
    }
    document.addEventListener("visibilitychange", agendarAuto);
    window.addEventListener("resize", function () { trilha.scrollTo({ left: centroDe(slides[indice]), behavior: "auto" }); });
  }

  /* =========================================================
     LIGHTBOX (ampliação das fotos do carrossel)
     ========================================================= */
  var lightbox = $("#lightbox");
  var lbImg = $("#lightbox-img");
  var lbLegenda = $("#lightbox-legenda");
  var gatilhos = $$(".carrossel__foto");
  var fotos = gatilhos.map(function (b) { var im = b.querySelector("img"); return { src: im.getAttribute("src"), alt: im.getAttribute("alt") || "" }; });
  var atual = 0, focoAnterior = null;

  function mostrarFoto(i) {
    atual = (i + fotos.length) % fotos.length;
    lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
    lbImg.src = fotos[atual].src;
    lbImg.alt = fotos[atual].alt;
    lbLegenda.textContent = (atual + 1) + " de " + fotos.length;
  }
  function abrirLightbox(i) {
    focoAnterior = document.activeElement;
    clearTimeout(autoTimer);
    mostrarFoto(i);
    lightbox.hidden = false;
    document.body.classList.add("travado");
    $("#lightbox-fechar").focus();
  }
  function fecharLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("travado");
    if (trilha && atual !== indice) irPara(atual, "auto"); // o carrossel acompanha a última foto vista
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus({ preventScroll: true });
    agendarAuto();
  }
  if (lightbox && gatilhos.length) {
    gatilhos.forEach(function (b, i) {
      b.addEventListener("click", function () {
        if (i !== indice) { irPara(i); return; } // clicar numa foto lateral primeiro a centraliza
        abrirLightbox(i);
      });
    });
    $("#lightbox-fechar").addEventListener("click", fecharLightbox);
    $("#lightbox-ant").addEventListener("click", function () { mostrarFoto(atual - 1); });
    $("#lightbox-prox").addEventListener("click", function () { mostrarFoto(atual + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lightbox__figura")) fecharLightbox();
    });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") mostrarFoto(atual - 1);
      else if (e.key === "ArrowRight") mostrarFoto(atual + 1);
      else if (e.key === "Tab") {
        var focaveis = $$("button", lightbox);
        var idx = focaveis.indexOf(document.activeElement);
        e.preventDefault();
        var prox = e.shiftKey ? idx - 1 : idx + 1;
        focaveis[(prox + focaveis.length) % focaveis.length].focus();
      }
    });
    var tx = null, ty = null;
    lightbox.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) mostrarFoto(atual + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) fecharLightbox();
      tx = ty = null;
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (lightbox && !lightbox.hidden) fecharLightbox();
    else fecharMenuCal(true);
  });

  /* =========================================================
     UTILITÁRIOS DE FORMULÁRIO
     ========================================================= */
  function limparTexto(t) {
    return String(t || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  function definirErro(campo, idErro, msg) {
    var el = document.getElementById(idErro);
    if (el) el.textContent = msg || "";
    if (campo) campo.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function estado(el, tipo, msg) { el.className = "estado" + (tipo ? " " + tipo : ""); el.textContent = msg || ""; }
  function ligarContador(textarea, saida, max) {
    if (!textarea || !saida) return;
    function at() { var n = textarea.value.length; saida.textContent = n + "/" + max; saida.classList.toggle("no-limite", n >= max * .9); }
    textarea.addEventListener("input", at); at();
  }
  var RE_LINK = /(https?:\/\/|www\.)/i;
  function linkWhats(texto) { return (WHATS ? "https://wa.me/" + WHATS : "https://wa.me/") + "?text=" + encodeURIComponent(texto); }

  /* =========================================================
     CONFIRMAÇÃO DE PRESENÇA (WhatsApp)
     ========================================================= */
  var formRsvp = $("#form-rsvp");
  if (formRsvp) {
    var rNome = $("#rsvp-nome"), rPessoas = $("#rsvp-pessoas"), rMsg = $("#rsvp-msg");
    var rEstado = $("#rsvp-estado"), campoPessoas = $("#campo-pessoas");
    ligarContador(rMsg, $("#rsvp-msg-cont"), 300);
    $$('input[name="presenca"]', formRsvp).forEach(function (r) {
      r.addEventListener("change", function () { campoPessoas.hidden = formRsvp.presenca.value !== "sim"; });
    });
    $$(".contador button", formRsvp).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = parseInt(rPessoas.value, 10) || 1;
        rPessoas.value = Math.min(10, Math.max(1, v + Number(b.getAttribute("data-passo"))));
        definirErro(rPessoas, "rsvp-pessoas-erro", "");
      });
    });
    rNome.addEventListener("input", function () { definirErro(rNome, "rsvp-nome-erro", ""); });

    formRsvp.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = limparTexto(rNome.value);
      var vai = formRsvp.presenca.value === "sim";
      var pessoas = parseInt(rPessoas.value, 10);
      var msg = limparTexto(rMsg.value).slice(0, 300);
      var ok = true;
      if (nome.length < 2) { definirErro(rNome, "rsvp-nome-erro", "Escreva seu nome (pelo menos 2 letras)."); ok = false; }
      else definirErro(rNome, "rsvp-nome-erro", "");
      if (vai && (!pessoas || pessoas < 1 || pessoas > 10)) { definirErro(rPessoas, "rsvp-pessoas-erro", "Informe de 1 a 10 pessoas."); ok = false; }
      else definirErro(rPessoas, "rsvp-pessoas-erro", "");
      if (!ok) { estado(rEstado, "erro", "Confira os campos destacados."); (nome.length < 2 ? rNome : rPessoas).focus(); return; }

      var texto = vai
        ? "Oi, " + NOME + "! Aqui é " + nome + ". Confirmo presença no seu aniversário, dia 07/11 às 18h" + (pessoas > 1 ? " — seremos " + pessoas + " pessoas." : ".")
        : "Oi, " + NOME + "! Aqui é " + nome + ". Infelizmente não vou conseguir ir no dia 07/11, mas desejo uma comemoração incrível!";
      if (msg) texto += "\n\n" + msg;
      var url = linkWhats(texto);
      var janela = window.open(url, "_blank", "noopener");
      if (!janela) window.location.href = url;
      estado(rEstado, "sucesso", WHATS
        ? "Abrimos o WhatsApp com a mensagem pronta. É só tocar em enviar."
        : "Abrimos o WhatsApp com a mensagem pronta. Escolha a conversa da Kathllyn e toque em enviar.");
    });
  }

  /* =========================================================
     LIVRO DE RECADOS — Supabase (compartilhado de verdade)
     ========================================================= */
  var SB_URL = String(CFG.supabaseUrl || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, ""); // aceita a URL com ou sem /rest/v1
  var SB_CHAVE = String(CFG.supabaseChavePublica || "").trim();
  var SB_TABELA = String(CFG.supabaseTabela || "recados").trim();
  var LIMITE = Math.min(Math.max(Number(CFG.limiteRecados) || 60, 1), 200);
  var configurado = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(SB_URL) && SB_CHAVE.length > 20;
  function decodificarPapel(chave) {
    try { var p = chave.split(".")[1]; return p ? atob(p.replace(/-/g, "+").replace(/_/g, "/")) : ""; } catch (e) { return ""; }
  }
  // Proteção extra: se alguém colar a chave secreta por engano, ela não é usada.
  if (/^sb_secret_/i.test(SB_CHAVE) || /service_role/i.test(decodificarPapel(SB_CHAVE))) {
    configurado = false;
    console.error("[Convite] A chave colada em config.js é SECRETA. Remova-a imediatamente e use a chave pública (publishable/anon).");
  }
  function cabecalhos(extra) {
    var h = { apikey: SB_CHAVE, Accept: "application/json" };
    if (/^eyJ/.test(SB_CHAVE)) h.Authorization = "Bearer " + SB_CHAVE; // chave "anon" antiga (JWT)
    for (var k in extra) h[k] = extra[k];
    return h;
  }

  var lista = $("#mural-lista");
  var muralAviso = $("#mural-aviso");
  var formRecado = $("#form-recado");
  var botaoAtualizar = $("#recados-atualizar");
  var formatoData = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  function avisoMural(tipo, msg) { muralAviso.className = "mural__aviso" + (tipo ? " " + tipo : ""); muralAviso.textContent = msg || ""; }
  function esqueleto() {
    lista.textContent = "";
    for (var i = 0; i < 3; i++) { var li = document.createElement("li"); li.className = "recado recado--esqueleto"; li.setAttribute("aria-hidden", "true"); lista.appendChild(li); }
  }
  function desenharRecados(itens) {
    lista.textContent = "";
    if (!itens.length) {
      var vazio = document.createElement("li");
      vazio.className = "mural__vazio";
      vazio.textContent = "Ainda não há recados. Que tal escrever o primeiro?";
      lista.appendChild(vazio);
      return;
    }
    itens.forEach(function (r) {
      var li = document.createElement("li"); li.className = "recado";
      var p = document.createElement("p"); p.className = "recado__texto";
      p.textContent = String(r.mensagem || "");          // texto puro, nunca HTML
      var rod = document.createElement("div"); rod.className = "recado__rodape";
      var nome = document.createElement("span"); nome.className = "recado__nome";
      nome.textContent = String(r.nome || "");
      var data = document.createElement("time"); data.className = "recado__data";
      var d = new Date(r.criado_em);
      if (!isNaN(d)) { data.dateTime = d.toISOString(); data.textContent = formatoData.format(d); }
      rod.appendChild(nome); rod.appendChild(data);
      li.appendChild(p); li.appendChild(rod);
      lista.appendChild(li);
    });
  }

  var carregando = false, recarregarDepois = false, ultimaAssinatura = "";
  function comPrazo(url, opcoes, ms) { // evita que uma conexão ruim deixe o envio "pendurado"
    if (!window.AbortController) return fetch(url, opcoes);
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, ms || 15000);
    opcoes = opcoes || {}; opcoes.signal = ctl.signal;
    return fetch(url, opcoes).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }
  function carregarRecados(silencioso) {
    if (!configurado) return Promise.resolve();
    if (carregando) { recarregarDepois = true; return Promise.resolve(); } // uma nova leitura roda logo depois da atual
    carregando = true;
    lista.setAttribute("aria-busy", "true");
    if (!silencioso) esqueleto();
    var url = SB_URL + "/rest/v1/" + encodeURIComponent(SB_TABELA) + "?select=nome,mensagem,criado_em&order=criado_em.desc&limit=" + LIMITE;
    return comPrazo(url, { headers: cabecalhos(), cache: "no-store" }, 12000)
      .then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error("HTTP " + res.status + " " + t); });
        return res.json();
      })
      .then(function (dados) {
        if (!Array.isArray(dados)) throw new Error("Resposta inesperada");
        var assinatura = JSON.stringify(dados);
        if (assinatura !== ultimaAssinatura || !silencioso) { ultimaAssinatura = assinatura; desenharRecados(dados); }
        avisoMural("", "");
      })
      .catch(function (err) {
        console.warn("[Convite] Falha ao carregar recados:", err);
        if (!silencioso) { lista.textContent = ""; avisoMural("alerta", "Não foi possível carregar os recados agora. Verifique sua conexão e toque em Atualizar."); }
      })
      .then(function () {
        carregando = false; lista.setAttribute("aria-busy", "false");
        if (recarregarDepois) { recarregarDepois = false; carregarRecados(true); }
      });
  }
  function traduzirErroSupabase(status, corpo) {
    var txt = (corpo && (corpo.message || corpo.hint || corpo.details)) || "";
    if (/muitos_recados|rate|limite/i.test(txt) || status === 429) return "Muitos recados em pouco tempo. Aguarde um minutinho e tente de novo.";
    if (/recado_repetido|duplicate/i.test(txt)) return "Esse recado já foi publicado.";
    if (corpo && corpo.code === "23514") return "O recado não foi aceito. Confira o tamanho do nome e da mensagem e evite links.";
    if (status === 401 || status === 403 || (corpo && corpo.code === "42501")) return "O livro de recados está sem permissão de gravação. A anfitriã precisa revisar a configuração.";
    if (status === 404 || (corpo && corpo.code === "42P01")) return "O livro de recados não foi encontrado no servidor. A anfitriã precisa revisar a configuração.";
    return "Não foi possível publicar seu recado agora. Tente novamente em instantes.";
  }

  if (formRecado) {
    var cNome = $("#recado-nome"), cMsg = $("#recado-msg"), cSite = $("#recado-site");
    var botaoEnviar = $("#recado-enviar"), rEst = $("#recado-estado");
    var inicioInteracao = 0, enviandoRecado = false;
    ligarContador(cMsg, $("#recado-msg-cont"), 500);
    formRecado.addEventListener("focusin", function () { if (!inicioInteracao) inicioInteracao = Date.now(); });
    cNome.addEventListener("input", function () { definirErro(cNome, "recado-nome-erro", ""); });
    cMsg.addEventListener("input", function () { definirErro(cMsg, "recado-msg-erro", ""); });

    if (!configurado) {
      avisoMural("alerta", "O livro de recados ainda não foi conectado ao servidor, então os recados não podem ser publicados por enquanto. Se quiser, envie seu carinho pelo WhatsApp.");
      lista.textContent = "";
      var espera = document.createElement("li");
      espera.className = "mural__vazio";
      espera.textContent = "Os recados vão aparecer aqui assim que o livro estiver conectado.";
      lista.appendChild(espera);
      if (botaoAtualizar) botaoAtualizar.hidden = true;
    }

    formRecado.addEventListener("submit", function (e) {
      e.preventDefault();
      if (enviandoRecado) return; // ignora cliques repetidos e Enter enquanto o envio anterior não termina
      var nome = limparTexto(cNome.value);
      var msg = limparTexto(cMsg.value);
      var ok = true, primeiro = null;
      if (nome.length < 2 || nome.length > 60) { definirErro(cNome, "recado-nome-erro", "Use de 2 a 60 caracteres."); ok = false; primeiro = cNome; }
      else definirErro(cNome, "recado-nome-erro", "");
      if (msg.length < 3) { definirErro(cMsg, "recado-msg-erro", "Escreva uma mensagem (mínimo 3 caracteres)."); ok = false; primeiro = primeiro || cMsg; }
      else if (msg.length > 500) { definirErro(cMsg, "recado-msg-erro", "Máximo de 500 caracteres."); ok = false; primeiro = primeiro || cMsg; }
      else if (RE_LINK.test(msg) || RE_LINK.test(nome)) { definirErro(cMsg, "recado-msg-erro", "Por segurança, links não são permitidos nos recados."); ok = false; primeiro = primeiro || cMsg; }
      else definirErro(cMsg, "recado-msg-erro", "");
      if (!ok) { estado(rEst, "erro", "Confira os campos destacados."); primeiro.focus(); return; }

      // Anti-spam básico (o servidor também limita)
      if (cSite.value) { estado(rEst, "erro", "Não foi possível enviar."); return; }
      if (inicioInteracao && Date.now() - inicioInteracao < 2500) { estado(rEst, "erro", "Calma! Escreva com carinho e tente de novo em alguns segundos."); return; }
      var ultimo = Number(guardar.ler("convite-kathllyn-ultimo-recado") || 0);
      if (Date.now() - ultimo < 45000) { estado(rEst, "erro", "Você acabou de enviar um recado. Aguarde um pouquinho para enviar outro."); return; }

      if (!configurado) {
        estado(rEst, "erro", "Seu recado NÃO foi publicado: o livro de recados ainda não está conectado ao servidor. ");
        var link = document.createElement("a");
        link.target = "_blank"; link.rel = "noopener";
        link.href = linkWhats("Recado para a " + NOME + ":\n\n" + msg + "\n\n— " + nome);
        link.textContent = "Enviar pelo WhatsApp";
        rEst.appendChild(link);
        return;
      }

      enviandoRecado = true;
      botaoEnviar.disabled = true; botaoEnviar.classList.add("enviando"); formRecado.setAttribute("aria-busy", "true");
      $(".botao__texto", botaoEnviar).textContent = "Publicando…";
      estado(rEst, "info", "Enviando seu recado…");

      comPrazo(SB_URL + "/rest/v1/" + encodeURIComponent(SB_TABELA), {
        method: "POST",
        headers: cabecalhos({ "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify({ nome: nome, mensagem: msg })
      }, 15000)
        .then(function (res) {
          if (res.ok) return null;
          return res.json().catch(function () { return {}; }).then(function (c) { var er = new Error("falha"); er.status = res.status; er.corpo = c; throw er; });
        })
        .then(function () {
          guardar.gravar("convite-kathllyn-ultimo-recado", String(Date.now()));
          formRecado.reset();
          $("#recado-msg-cont").textContent = "0/500";
          inicioInteracao = 0;
          estado(rEst, "sucesso", "Recado publicado! Obrigada pelo carinho.");
          return carregarRecados(true);
        })
        .catch(function (err) {
          console.warn("[Convite] Falha ao publicar recado:", err.status, err.corpo || err);
          var motivo = err.status ? traduzirErroSupabase(err.status, err.corpo)
            : err.name === "AbortError" ? "A conexão demorou demais e o recado não foi publicado."
            : "Não conseguimos falar com o servidor e o recado não foi publicado.";
          estado(rEst, "erro", motivo + " Seu texto continua aqui — é só tentar de novo.");
        })
        .then(function () {
          enviandoRecado = false; formRecado.removeAttribute("aria-busy");
          botaoEnviar.disabled = false; botaoEnviar.classList.remove("enviando");
          $(".botao__texto", botaoEnviar).textContent = "Publicar recado";
        });
    });
  }

  if (configurado) {
    carregarRecados(false);
    if (botaoAtualizar) botaoAtualizar.addEventListener("click", function () { carregarRecados(false); });
    setInterval(function () { if (document.visibilityState === "visible") carregarRecados(true); }, 40000);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") carregarRecados(true); });
  }
})();
