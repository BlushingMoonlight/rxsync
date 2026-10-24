// Aviso de cookies e chat sob demanda (rxsync-sistema DEC-112).
// - Google Analytics: só carrega depois de "Aceitar". Sem escolha, ou com "Só os necessários", o gtag() da página não faz
//   nada (os eventos são descartados) e nenhum cookie do Google é gravado. A escolha fica no aparelho (localStorage
//   'rx_cookies': 'sim' ou 'nao'); window.rxCookies.reabrir() mostra o aviso de novo ("Preferências de cookies").
// - Chat da RXSync (Chatwoot): não carrega sozinho. Um botão leve carrega o chat quando a pessoa toca nele (o toque é o
//   pedido do chat) ou quando a página abre com ?suporte=1 (link de suporte). window.rxChat.abrir() faz o mesmo.
// Na tag <script>: data-ga-sem-query manda ao Google o endereço sem a query (o onboarding tem o token no ?t=);
// data-sem-ga é para página sem Google Analytics (só o chat); data-chat-fora abre o chat numa aba nova, na página inicial
// (as páginas com a regra de segurança estrita não deixam os estilos que o chat põe na página). Em todas as páginas, o código de origem (?ref=) nunca vai
// ao Google, nem no endereço da página nem no da página anterior; o resto da query (plano, ciclo) continua.
(function () {
  var GA_ID = 'G-G5ZS8DRHNM';
  var CHAT_URL = 'https://app.rxsync.com.br';
  var CHAT_TOKEN = 'umo8eLwQSe9QsAzdQAMKAQVu';
  var tag = document.currentScript || {};
  var temGA = !(tag.hasAttribute && tag.hasAttribute('data-sem-ga'));
  var semQuery = !!(tag.hasAttribute && tag.hasAttribute('data-ga-sem-query'));
  var chatFora = !!(tag.hasAttribute && tag.hasAttribute('data-chat-fora'));

  // ---------- Google Analytics ----------
  var gaLigado = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { if (gaLigado) window.dataLayer.push(arguments); };

  function ler() { try { return localStorage.getItem('rx_cookies'); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem('rx_cookies', v); } catch (e) { /* aba privada: vale só nesta página */ } }

  // Endereço sem o ?ref= (e sem o #): o que sobra da query fica na mesma ordem.
  function semRef(u) {
    if (!u) return '';
    try {
      var url = new URL(u);
      url.searchParams.delete('ref'); url.hash = '';
      return url.toString();
    } catch (e) { return ''; }
  }

  function ligarGA() {
    if (gaLigado || !temGA) return;
    gaLigado = true;
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, semQuery ? { page_location: location.origin + location.pathname, page_path: location.pathname, page_referrer: semRef(document.referrer) }
      : { page_location: semRef(location.href), page_referrer: semRef(document.referrer) });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // ---------- estilos (os dois componentes): um arquivo do próprio site, que a regra de segurança das páginas deixa ----------
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/assets/css/consentimento.css';
  document.head.appendChild(css);

  // ---------- aviso de cookies ----------
  var aviso = null;
  function fecharAviso() { if (aviso) { aviso.remove(); aviso = null; } }
  function mostrarAviso() {
    if (!temGA || aviso) return;
    aviso = document.createElement('div');
    aviso.className = 'rxc-aviso';
    aviso.setAttribute('role', 'region');
    aviso.setAttribute('aria-label', 'Aviso de cookies');
    var p = document.createElement('p');
    p.appendChild(document.createTextNode('Usamos cookies do Google Analytics para medir as visitas, só se você aceitar. Veja a '));
    var a = document.createElement('a'); a.href = '/privacidade.html'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Política de Privacidade';
    p.appendChild(a); p.appendChild(document.createTextNode('.'));
    var acoes = document.createElement('div'); acoes.className = 'rxc-acoes';
    var sim = document.createElement('button'); sim.type = 'button'; sim.className = 'rxc-sim'; sim.textContent = 'Aceitar';
    var nao = document.createElement('button'); nao.type = 'button'; nao.className = 'rxc-nao'; nao.textContent = 'Só os necessários';
    sim.addEventListener('click', function () { gravar('sim'); fecharAviso(); ligarGA(); });
    nao.addEventListener('click', function () { gravar('nao'); fecharAviso(); if (gaLigado) location.reload(); });
    acoes.appendChild(sim); acoes.appendChild(nao);
    aviso.appendChild(p); aviso.appendChild(acoes);
    document.body.appendChild(aviso);
  }

  // ---------- chat sob demanda ----------
  var chatEstado = 'parado', abrirQuandoPronto = false, botao = null;
  function carregarChat(abrir) {
    if (chatFora) { if (abrir) window.open('/?suporte=1', '_blank', 'noopener'); return; }
    if (abrir) abrirQuandoPronto = true;
    if (chatEstado === 'pronto') { if (abrir && window.$chatwoot) window.$chatwoot.toggle('open'); return; }
    if (chatEstado === 'carregando') return;
    chatEstado = 'carregando';
    if (botao) botao.setAttribute('aria-busy', 'true');
    var s = document.createElement('script');
    s.async = true;
    s.src = CHAT_URL + '/packs/js/sdk.js';
    s.onload = function () { window.chatwootSDK.run({ websiteToken: CHAT_TOKEN, baseUrl: CHAT_URL }); };
    s.onerror = function () { chatEstado = 'parado'; if (botao) botao.removeAttribute('aria-busy'); };
    document.head.appendChild(s);
  }
  window.addEventListener('chatwoot:ready', function () {
    chatEstado = 'pronto';
    if (botao) { botao.remove(); botao = null; }   // o chat mostra o próprio botão
    if (abrirQuandoPronto && window.$chatwoot) window.$chatwoot.toggle('open');
  });
  function criarBotao() {
    botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'rxc-chat';
    botao.setAttribute('aria-label', 'Conversar com a RXSync no chat');
    botao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg><span>Fale com a gente</span>';
    botao.addEventListener('click', function () { if (typeof window.gtag === 'function') window.gtag('event', 'abrir_chat'); carregarChat(true); });
    document.body.appendChild(botao);
  }

  window.rxCookies = { reabrir: function () { fecharAviso(); mostrarAviso(); } };
  window.rxChat = { abrir: function () { carregarChat(true); } };

  function iniciar() {
    var escolha = ler();
    if (escolha === 'sim') ligarGA();
    else if (escolha !== 'nao') mostrarAviso();
    criarBotao();
    if (!chatFora && /[?&]suporte=1\b/.test(location.search)) carregarChat(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
