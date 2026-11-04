// Aviso de cookies e chat sob demanda (rxsync-sistema DEC-112; Consent Mode básico e a chegada pelo anúncio, DEC-191).
// - Google Analytics: só carrega depois de "Aceitar". Sem escolha, ou com "Só os necessários", o gtag() da página não faz
//   nada (os eventos são descartados) e nenhum cookie do Google é gravado. A escolha fica no aparelho (localStorage
//   'rx_cookies': 'sim' ou 'nao'); window.rxCookies.reabrir() mostra o aviso de novo ("Preferências de cookies").
// - Chat da RXSync (Chatwoot): não carrega sozinho. Um botão leve carrega o chat quando a pessoa toca nele (o toque é o
//   pedido do chat) ou quando a página abre com ?suporte=1 (link de suporte). window.rxChat.abrir() faz o mesmo.
// Na tag <script>: data-ga-sem-query manda ao Google o endereço sem a query (o onboarding tem o token no ?t=);
// data-sem-ga é para página sem Google Analytics (só o chat); data-chat-fora abre o chat numa aba nova, na página inicial
// (as páginas com a regra de segurança estrita não deixam os estilos que o chat põe na página). Em todas as páginas, o
// código de origem (?ref=) e o token do onboarding (?t=) nunca vão ao Google, nem no endereço da página nem no da página
// anterior; o resto da query (plano, ciclo) continua.
(function () {
  var GA_ID = 'G-G5ZS8DRHNM';
  var CHAT_URL = 'https://app.rxsync.com.br';
  var CHAT_TOKEN = 'umo8eLwQSe9QsAzdQAMKAQVu';
  var tag = document.currentScript || {};
  var temGA = !(tag.hasAttribute && tag.hasAttribute('data-sem-ga'));
  var semQuery = !!(tag.hasAttribute && tag.hasAttribute('data-ga-sem-query'));
  var chatFora = !!(tag.hasAttribute && tag.hasAttribute('data-chat-fora'));

  // ---------- chegada pelo anúncio (rxsync-sistema DEC-190) ----------
  // Ao abrir a página com o gclid ou as utm_*, guarda na aba (sessionStorage, como o rx_ref): o endereço de chegada, para o
  // Google ler na primeira página vista depois do "Aceitar" (quem aceita na página seguinte não perde a campanha), e a
  // origem curta ("utm_source / utm_medium / utm_campaign" ou "google / cpc"), que a contratação manda ao workflow 20.
  // Nada disso vai a lugar nenhum sem o "Aceitar", menos a origem curta na contratação (sem o gclid nem o endereço).
  function lerAba(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function gravarAba(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* aba privada */ } }
  (function guardarChegada() {
    var q; try { q = new URL(location.href).searchParams; } catch (e) { return; }
    var gclid = q.get('gclid'), fonte = q.get('utm_source'), meio = q.get('utm_medium'), camp = q.get('utm_campaign');
    if (!gclid && !fonte && !meio && !camp) return;
    var limpa = function (v) { return String(v || '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 38); };
    var partes = fonte || meio || camp ? [limpa(fonte) || '(sem fonte)', limpa(meio) || '(sem meio)', limpa(camp)] : ['google', 'cpc'];
    var origem = partes.filter(Boolean).join(' / ').replace(/[()]/g, '').slice(0, 120);
    gravarAba('rx_chegada', semRef(location.href));
    gravarAba('rx_origem_campanha', origem);
  })();
  window.rxOrigemCampanha = function () { var o = lerAba('rx_origem_campanha') || ''; return /^[a-z0-9_.\/ -]{2,120}$/.test(o) ? o : ''; };

  // ---------- Google Analytics ----------
  var gaLigado = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { if (gaLigado) window.dataLayer.push(arguments); };

  function ler() { try { return localStorage.getItem('rx_cookies'); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem('rx_cookies', v); } catch (e) { /* aba privada: vale só nesta página */ } }

  // Endereço sem o ?ref= e o ?t= (e sem o #): o que sobra da query fica na mesma ordem.
  function semRef(u) {
    if (!u) return '';
    try {
      var url = new URL(u);
      url.searchParams.delete('ref'); url.searchParams.delete('t'); url.hash = '';
      return url.toString();
    } catch (e) { return ''; }
  }

  function ligarGA() {
    if (gaLigado || !temGA) return;
    gaLigado = true;
    // Consent Mode básico (rxsync-sistema DEC-191): o Google só carrega depois do "Aceitar" (como antes) e recebe o
    // consentimento junto: negado por padrão; o "Aceitar" libera só o necessário para medir as visitas e as conversões
    // dos anúncios (analytics_storage, ad_storage e ad_user_data). ad_personalization fica SEMPRE negado: sem anúncio
    // personalizado nem remarketing (Política, seção 9). Sem "Aceitar", nada vai ao Google.
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'granted' });
    window.gtag('js', new Date());
    // A primeira página vista depois do "Aceitar" leva o endereço de chegada (com o gclid e as UTMs), uma vez por aba.
    var chegada = lerAba('rx_chegada');
    if (chegada && !semQuery) gravarAba('rx_chegada', '');
    window.gtag('config', GA_ID, semQuery ? { page_location: location.origin + location.pathname, page_path: location.pathname, page_referrer: semRef(document.referrer) }
      : { page_location: chegada || semRef(location.href), page_referrer: semRef(document.referrer) });
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
    p.appendChild(document.createTextNode('Usamos cookies do Google Analytics e do Google Ads para medir as visitas e os anúncios, só se você aceitar. Veja a '));
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
  var chatEstado = 'parado', abrirQuandoPronto = false, botao = null, dica = null;
  function fecharDica() { if (dica) { dica.remove(); dica = null; } }
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
  // Mais rápido sem gravar nada no aparelho (rxsync-sistema #225, item 11): com a página parada, o script do chat é só
  // baixado para o cache do navegador (sem rodar e sem cookie); o chat começa a carregar no toque (pointerdown).
  function adiantar() {
    if (chatFora || chatEstado !== 'parado' || (navigator.connection && navigator.connection.saveData)) return;
    try { fetch(CHAT_URL + '/packs/js/sdk.js', { mode: 'no-cors', credentials: 'omit' }).catch(function () {}); } catch (e) { /* sem fetch */ }
  }
  window.addEventListener('chatwoot:ready', function () {
    chatEstado = 'pronto';
    if (botao) { botao.remove(); botao = null; }   // o chat mostra o próprio botão (o mesmo desenho e a mesma cor)
    fecharDica();
    if (abrirQuandoPronto && window.$chatwoot) window.$chatwoot.toggle('open');
  });
  function criarBotao() {
    botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'rxc-chat';
    botao.setAttribute('aria-label', 'Conversar com a RXSync no chat');
    // O mesmo desenho do botão do Chatwoot (64 px, redondo, o balão cheio), para não mudar depois de abrir e fechar.
    botao.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.48 3 2 6.94 2 11.8c0 2.6 1.29 4.93 3.33 6.54L4.5 21.5l3.73-1.86c1.17.38 2.44.58 3.77.58 5.52 0 10-3.94 10-8.8S17.52 3 12 3Z"/></svg><i class="rxc-ponto" aria-hidden="true"></i>';
    botao.addEventListener('pointerdown', function () { if (!chatFora) carregarChat(false); });
    botao.addEventListener('click', function () { if (typeof window.gtag === 'function') window.gtag('event', 'abrir_chat'); fecharDica(); carregarChat(true); });
    document.body.appendChild(botao);
    // Uma vez por visita, depois de 12 s, um balão curto ao lado do botão; some sozinho em 6 s ou ao tocar.
    var jaViu = false; try { jaViu = sessionStorage.getItem('rx_chat_dica') === '1'; } catch (e) { /* aba privada */ }
    if (!jaViu) setTimeout(function () {
      if (!botao || document.querySelector('.rxc-aviso')) return;
      dica = document.createElement('button'); dica.type = 'button'; dica.className = 'rxc-dica'; dica.textContent = 'Dúvidas? Fale com a gente';
      dica.addEventListener('click', function () { fecharDica(); carregarChat(true); });
      document.body.appendChild(dica);
      try { sessionStorage.setItem('rx_chat_dica', '1'); } catch (e) { /* aba privada */ }
      setTimeout(fecharDica, 6000);
    }, 12000);
  }

  window.rxCookies = { reabrir: function () { fecharAviso(); mostrarAviso(); } };
  // "Preferências de cookies" (data-cookies) em qualquer página com este script: o rodapé da página do painel e o da página do
  // anúncio usam só isto (rxsync-sistema DEC-200). Chamar duas vezes dá no mesmo (fecha e mostra o aviso de novo).
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-cookies]')) window.rxCookies.reabrir(); });
  window.rxChat = { abrir: function () { carregarChat(true); } };

  function iniciar() {
    var escolha = ler();
    if (escolha === 'sim') ligarGA();
    else if (escolha !== 'nao') mostrarAviso();
    criarBotao();
    if ('requestIdleCallback' in window) window.requestIdleCallback(adiantar, { timeout: 8000 }); else setTimeout(adiantar, 4000);
    if (!chatFora && /[?&]suporte=1\b/.test(location.search)) carregarChat(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
