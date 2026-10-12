/* AG Melhor Versão · código comum do app, do painel e da página de entrada (prévia com dados de exemplo).
   - Estilo: vem do endereço (?e=clean-claro | clean-escuro | couro | cyber). Sem ele, Clean claro.
     Trocar o estilo muda só o endereço (sem recarregar), então a tela (#tela) continua a mesma.
   - Selo "Prévia · dados de exemplo", botão de troca de estilo, logo em SVG e ícones. */
(function () {
  'use strict';
  var ESTILOS = [
    { id: 'clean-claro', nome: 'Clean claro' },
    { id: 'clean-escuro', nome: 'Clean escuro' },
    { id: 'couro', nome: 'Couro' },
    { id: 'cyber', nome: 'Cyber' }
  ];
  var ids = ESTILOS.map(function (e) { return e.id; });
  var html = document.documentElement;

  function lerEstilo() {
    var p = new URLSearchParams(location.search).get('e');
    if (p === 'clean') p = 'clean-claro';
    return ids.indexOf(p) >= 0 ? p : (ids.indexOf(html.dataset.estilo) >= 0 ? html.dataset.estilo : 'clean-claro');
  }
  function aplicarEstilo(id, gravar) {
    html.dataset.estilo = id;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(html).getPropertyValue('--fundo').trim() || '#f4f1ea';
    if (gravar) {
      var u = new URL(location.href);
      u.searchParams.set('e', id);
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      // links internos levam o estilo junto
      document.querySelectorAll('a[data-leva-estilo]').forEach(function (a) {
        var l = new URL(a.getAttribute('href'), location.href); l.searchParams.set('e', id); a.href = l.pathname + l.search + l.hash;
      });
    }
    document.querySelectorAll('.troca-menu button[data-estilo]').forEach(function (b) {
      b.setAttribute('aria-checked', b.dataset.estilo === id ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('estilo', { detail: id }));
  }
  aplicarEstilo(lerEstilo(), false);

  // ---------- Logo "AG · MELHOR VERSÃO" ----------
  // Monograma: anel aberto, "A" de traço fino e "G" que abraça o "A". As cores vêm do estilo (--logo-1, --logo-2, --logo-txt).
  function logo(opc) {
    opc = opc || {};
    var t = opc.tamanho || 64, texto = opc.texto !== false;
    var svg =
      '<svg width="' + t + '" height="' + t + '" viewBox="0 0 120 120" role="img" aria-label="AG Melhor Versão">' +
      '<circle cx="60" cy="60" r="55" fill="none" stroke="var(--logo-2)" stroke-width="2" stroke-dasharray="300 46" stroke-dashoffset="-20" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M26 86 L47 30 L68 86" fill="none" stroke="var(--logo-1)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M34.5 66 H59.5" fill="none" stroke="var(--logo-1)" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M96.5 40.5 A25 25 0 1 0 98 70 L98 60 H82" fill="none" stroke="var(--logo-2)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    if (!texto) return '<span class="logo">' + svg + '</span>';
    var f = Math.max(8, Math.round(t * 0.15));
    return '<span class="logo">' + svg +
      '<span style="font:600 ' + f + 'px/1 var(--fonte);letter-spacing:.28em;margin-right:-.28em;white-space:nowrap">MELHOR VERSÃO</span></span>';
  }

  // ---------- Ícones (traço fino, cor herdada) ----------
  var P = {
    inicio: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
    evolucao: '<path d="M4 19h16"/><path d="M5 15l4-4 3.5 2.5L19 7"/><path d="M15 7h4v4"/>',
    seringa: '<path d="M14.5 4.5l5 5"/><path d="M17 7l-9.5 9.5-3 .5.5-3L14.5 4.5"/><path d="M10 9l2 2M8 11l2 2"/><path d="M4.5 19.5 3 21"/>',
    equipe: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.2c2.3.2 3.9 1.8 4.4 4.3"/>',
    perfil: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.9 3.6-6 7-6s6.2 2.1 7 6"/>',
    fogo: '<path d="M12 21c3.9 0 6.5-2.6 6.5-6.3 0-3.6-2.6-5.8-4.2-8.7-.4 2-1.5 3.2-2.7 3.9C11.8 7 10.6 4.6 8.4 3c.3 3.2-2.9 5.7-2.9 10.2C5.5 18 8.3 21 12 21z"/>',
    proteina: '<path d="M7 17c-2-2-2-5 .5-7.5S13 6 15 4l5 5c-2 2-3 5.5-5.5 7.5S9 19 7 17z"/><path d="M7 17l-3 3"/><circle cx="4" cy="20" r="1"/>',
    agua: '<path d="M12 3.5c3 3.8 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.7 6-10.5z"/><path d="M9 14.5a3 3 0 0 0 3 3"/>',
    sono: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    atividade: '<path d="M3 12h4l2.5-5 4 10 2.5-5H21"/>',
    humor: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    calendario: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    chat: '<path d="M5 18.5V7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v6a2.5 2.5 0 0 1-2.5 2.5H9z"/>',
    ia: '<path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
    alerta: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17h.01"/>',
    balanca: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 10a5 5 0 0 1 7 0"/><path d="M12 10.5l1.5-1.5"/>',
    documento: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5"/>',
    sino: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    estilo: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" stroke="none"/>',
    pacientes: '<circle cx="10" cy="8" r="3.2"/><path d="M4 19.5c.6-3.4 3-5.5 6-5.5 1.5 0 2.8.5 3.9 1.4"/><path d="M16 14v6M13 17h6"/>',
    funil: '<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>',
    estetoscopio: '<path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5V15a4.5 4.5 0 0 0 9 0v-1.5"/><circle cx="19" cy="11.5" r="2"/>',
    moeda: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.1-.6-2.6-1.6M12 6.5V8M12 16v1.5"/>',
    engrenagem: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
    whatsapp: '<path d="M5 19l1-3.5A7.5 7.5 0 1 1 9 18.6z"/><path d="M9.5 9.5c.3 1.8 2.2 3.7 4 4l1-1 1.5.8-.5 1.4c-3 .2-6.6-3.4-6.5-6.4l1.4-.5.8 1.5z"/>',
    escudo: '<path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.5-7 9-4.1-1.5-7-4.7-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    seta: '<path d="M9 5l7 7-7 7"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
    trofeu: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v3M9 20h6M10 16h4v4h-4z"/>',
    prato: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
    barras: '<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/>',
    fome: '<path d="M7 3.5v7a2 2 0 0 0 4 0v-7M9 3.5V21"/><path d="M16.5 21V3.5c-2 1.5-3 4-3 7 0 1.5 1 2.5 3 2.5"/>',
    intestino: '<path d="M8 4h8a3 3 0 0 1 0 6H9a2.5 2.5 0 0 0 0 5h6a2.5 2.5 0 0 1 0 5H8"/>',
    copo: '<path d="M7 4h10l-1.2 15.2a1 1 0 0 1-1 .8H9.2a1 1 0 0 1-1-.8z"/><path d="M7.5 9h9"/>',
    cigarro: '<rect x="3" y="13" width="15" height="4" rx="1"/><path d="M14 13v4M20.5 13v4M18.5 10c0-2 2-2 2-4"/>',
    pilula: '<rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.7 8.8l4.6 6.4"/>',
    ciclo: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"/><circle cx="12" cy="12" r="2"/>',
    termometro: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
    fita: '<path d="M3.5 8.5h17v7h-17z"/><path d="M7 8.5v3M10.5 8.5v4M14 8.5v3M17.5 8.5v4"/>',
    revista: '<path d="M5 4.5h11.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M8.5 8.5h6.5M8.5 12h6.5M8.5 15.5h4"/>',
    cartao: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h4"/>',
    cadeado: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
    enviar: '<path d="M4.5 12 20 4.5 15 20l-3-6.5z"/><path d="M12 13.5 20 4.5"/>',
    telefone: '<path d="M6 4h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C10 19 5 14 4.5 5.6A1.5 1.5 0 0 1 6 4z"/>',
    globo: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z"/>',
    insta: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>',
    olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    letra: '<path d="M4 19 9 5l5 14M5.8 14h6.4"/><path d="M15 19l3-8 3 8M15.9 16.5h4.2"/>',
    relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    comunidade: '<circle cx="6.5" cy="9" r="2.3"/><circle cx="17.5" cy="9" r="2.3"/><circle cx="12" cy="7" r="2.6"/><path d="M3 17.5c.4-2.3 1.8-3.7 3.5-3.7M21 17.5c-.4-2.3-1.8-3.7-3.5-3.7M7.5 18c.5-3 2.3-4.8 4.5-4.8s4 1.8 4.5 4.8"/>'
  };
  function ic(nome, classe) {
    return '<svg class="ic ' + (classe || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[nome] || P.mais) + '</svg>';
  }
  function bolha(nome, cor) {
    return '<span class="ic-bolha" style="--cor:' + (cor || 'var(--primaria)') + '">' + ic(nome) + '</span>';
  }

  // ---------- Anel de progresso ----------
  function anel(opc) {
    var t = opc.tamanho || 120, e = opc.espessura || 10, r = (t - e) / 2, c = 2 * Math.PI * r;
    var v = Math.max(0, Math.min(1, opc.valor || 0));
    return '<div class="anel" style="width:' + t + 'px;height:' + t + 'px;--cor:' + (opc.cor || 'var(--primaria)') + '">' +
      '<svg width="' + t + '" height="' + t + '"><circle class="trilho" cx="' + t / 2 + '" cy="' + t / 2 + '" r="' + r + '" fill="none" stroke-width="' + e + '"/>' +
      '<circle class="valor" cx="' + t / 2 + '" cy="' + t / 2 + '" r="' + r + '" fill="none" stroke-width="' + e + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - v)).toFixed(2) + '"/></svg>' +
      '<div class="centro">' + (opc.centro || '') + '</div></div>';
  }

  // ---------- Marcadores de item do escopo ----------
  // item(107) · item([124, 125]) · novo() · juridico() · proposta()
  function item(n) {
    var l = [].concat(n);
    return '<span class="item" title="Item do escopo">item ' + l.join(' · ') + '</span>';
  }
  function novo(t) { return '<span class="item item-novo" title="Fora do escopo atual: ganha número depois da reunião">novo' + (t ? ' · ' + t : '') + '</span>'; }
  function juridico(t) { return '<span class="item item-juridico">' + (t || 'Versão completa · depende do parecer jurídico') + '</span>'; }
  function proposta() { return '<span class="item item-proposta">proposta</span>'; }


  // ---------- Balão de chat flutuante (app e painel) ----------
  // AG.balao({ dentro, titulo, sub, itens, saudacao, sugestoes, responder(texto) -> [resposta, nota] })
  // O texto digitado é sempre escapado antes de aparecer. As respostas são prontas (simuladas).
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function balao(o) {
    var dentro = o.dentro || document.body, msgs = [['ela', o.saudacao, '']];
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'balao-botao'; b.setAttribute('aria-label', 'Abrir o chat: ' + o.titulo);
    b.innerHTML = ic('ia');
    var pnl = document.createElement('section');
    pnl.className = 'balao-painel'; pnl.setAttribute('aria-label', o.titulo);
    dentro.appendChild(b); dentro.appendChild(pnl);
    function desenhar() {
      pnl.innerHTML = '<header class="balao-cab"><span class="ic-bolha" style="--cor:var(--primaria);width:36px;height:36px;border-radius:12px">' + ic('ia') + '</span>' +
        '<div style="flex:1;min-width:0"><b>' + o.titulo + '</b><div class="fraco" style="font-size:11.5px">' + (o.sub || '') + '</div></div>' +
        '<button type="button" class="balao-fechar" aria-label="Fechar">✕</button></header>' +
        '<div class="itens" style="padding:0 14px 8px">' + (o.itens || '') + '</div>' +
        '<div class="balao-msgs chat">' + msgs.map(function (m) { return '<div class="msg ' + m[0] + '">' + m[1] + (m[2] ? '<small>' + m[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
        '<div class="opcoes balao-sug">' + (o.sugestoes || []).map(function (t) { return '<button type="button" data-sug="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        '<form class="digitar balao-form"><input class="campo" placeholder="Escreva aqui" autocomplete="off" aria-label="Mensagem"><button class="botao" type="submit" aria-label="Enviar">' + ic('enviar') + '</button></form>';
      var l = pnl.querySelector('.balao-msgs'); l.scrollTop = l.scrollHeight;
    }
    function enviar(t) {
      t = String(t || '').trim(); if (!t) return;
      msgs.push(['eu', esc(t), '']); desenhar();
      setTimeout(function () { var r = o.responder(t); msgs.push(['ela', r[0], r[1] || '']); desenhar(); var c = pnl.querySelector('input'); if (c) c.focus(); }, 600);
    }
    b.addEventListener('click', function () { var abre = !pnl.classList.contains('aberto'); pnl.classList.toggle('aberto', abre); b.classList.toggle('aberto', abre); if (abre) { desenhar(); } });
    pnl.addEventListener('click', function (ev) {
      if (ev.target.closest('.balao-fechar')) { pnl.classList.remove('aberto'); b.classList.remove('aberto'); return; }
      var s = ev.target.closest('[data-sug]'); if (s) enviar(s.textContent);
    });
    pnl.addEventListener('submit', function (ev) { ev.preventDefault(); var c = pnl.querySelector('input'); enviar(c.value); });
    return { enviar: enviar };
  }

  // ---------- Selo e botão de troca ----------
  function montarSelo() {
    if (document.querySelector('.selo-previa') || html.dataset.semSelo !== undefined) return;
    var s = document.createElement('div');
    s.className = 'selo-previa'; s.textContent = 'Prévia · dados de exemplo';
    document.body.appendChild(s);
  }
  function montarTroca() {
    if (document.querySelector('.troca')) return;
    var d = document.createElement('div');
    d.className = 'troca';
    d.innerHTML = '<button class="troca-botao" type="button" aria-label="Trocar o estilo" aria-haspopup="true">' + ic('estilo') + '</button>' +
      '<div class="troca-menu" role="menu"><span class="rotulo">Estilo</span>' +
      ESTILOS.map(function (e) {
        return '<button type="button" role="menuitemradio" data-estilo="' + e.id + '" aria-checked="' + (html.dataset.estilo === e.id) + '"><span class="amostra amostra-' + e.id + '"></span>' + e.nome + '</button>';
      }).join('') + '</div>';
    document.body.appendChild(d);
    d.querySelector('.troca-botao').addEventListener('click', function (ev) { ev.stopPropagation(); d.classList.toggle('aberta'); });
    d.querySelectorAll('.troca-menu button[data-estilo]').forEach(function (b) {
      b.addEventListener('click', function () { aplicarEstilo(b.dataset.estilo, true); d.classList.remove('aberta'); });
    });
    document.addEventListener('click', function (ev) { if (!d.contains(ev.target)) d.classList.remove('aberta'); });
  }
  function iniciar() {
    montarSelo(); montarTroca();
    aplicarEstilo(html.dataset.estilo, false);
    // links internos já saem com o estilo atual
    var id = html.dataset.estilo;
    document.querySelectorAll('a[data-leva-estilo]').forEach(function (a) {
      var l = new URL(a.getAttribute('href'), location.href); l.searchParams.set('e', id); a.href = l.pathname + l.search + l.hash;
    });
  }
  // Links marcados com data-leva-estilo levam o estilo atual, mesmo os criados depois pelo JS.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[data-leva-estilo]'); if (!a) return;
    var l = new URL(a.getAttribute('href'), location.href); l.searchParams.set('e', html.dataset.estilo); a.href = l.pathname + l.search + l.hash;
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  window.AG = { ESTILOS: ESTILOS, balao: balao, esc: esc, logo: logo, ic: ic, bolha: bolha, anel: anel, item: item, novo: novo, juridico: juridico, proposta: proposta, estilo: function () { return html.dataset.estilo; }, aplicarEstilo: aplicarEstilo };
})();
