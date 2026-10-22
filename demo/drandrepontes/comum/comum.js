/* AG Melhor Versão · código comum do app, do painel e da página de entrada (prévia com dados de exemplo).
   - Estilo: vem do endereço (?e=clean-claro | clean-escuro | couro | cyber). Sem ele, AG claro (id clean-claro; o AG escuro é o clean-escuro).
     Trocar o estilo muda só o endereço (sem recarregar), então a tela (#tela) continua a mesma.
   - Selo "Prévia · dados de exemplo", botão de troca de estilo, logo em SVG e ícones. */
(function () {
  'use strict';
  var ESTILOS = [
    { id: 'clean-claro', nome: 'AG claro' },
    { id: 'clean-escuro', nome: 'AG escuro' },
    { id: 'couro', nome: 'Couro' },
    { id: 'cyber', nome: 'Cyber' }
  ];
  var ids = ESTILOS.map(function (e) { return e.id; });
  var html = document.documentElement;

  // ---------- Quem está usando, aparelho e sessão (Datalog) ----------
  // A home pede para escolher: Admin (Jean), Dr. André ou Convidado. As senhas só identificam quem usa (ficam no código
  // público); a proteção dos dados é a chave do banco. Prévias dentro da home (iframe) não pedem usuário nem registram nada.
  // Preços da proposta (escopo/precos.js, arquivo público: é uma cortina visual, não uma proteção):
  //   - Admin: começam escondidos sempre que entra; "Preços: escondidos / liberados" na home e no escopo (vale para a demo
  //     toda neste aparelho);
  //   - Dr. André: sempre aparecem;
  //   - Convidado: nunca aparecem ("sob consulta").
  // O app do paciente e as páginas com data-sem-precos nunca mostram preço.
  var CHAVE_USUARIO = 'ag-usuario-2', CHAVE_PRECOS = 'ag-precos-admin', USUARIOS = { admin: ['Admin (Jean)', 'admin'], andre: ['Dr. André', 'andre'], convidado: ['Convidado', 'convidado'] };
  try { localStorage.removeItem('ag-usuario'); localStorage.removeItem('ag-precos-liberados'); sessionStorage.removeItem('ag-precos-abertos'); } catch (e) { /* chaves antigas (preços cifrados) não valem mais */ }
  var dentroDeQuadro = (function () { try { return window.top !== window; } catch (e) { return true; } })();
  // A página do datalog não registra nada (só lê).
  function lerArmazenado(onde, k) { try { return window[onde].getItem(k) || ''; } catch (e) { return ''; } }
  function gravarArmazenado(onde, k, v) { try { if (v == null) window[onde].removeItem(k); else window[onde].setItem(k, v); } catch (e) { /* aparelho sem armazenamento */ } }
  function novoCodigo() { var s = ''; for (var i = 0; i < 4; i++) s += Math.random().toString(16).slice(2, 10).padEnd(8, '0'); return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20, 32); }
  var memoria = {};
  function codigo(onde, k) { var v = lerArmazenado(onde, k) || memoria[k]; if (!v) { v = novoCodigo(); gravarArmazenado(onde, k, v); memoria[k] = v; } return v; }
  function usuario() { var u = lerArmazenado('localStorage', CHAVE_USUARIO) || memoria.usuario || ''; return USUARIOS[u] ? u : ''; }
  // Entrar como Admin sempre começa com os preços escondidos.
  function marcarUsuario(id) { memoria.usuario = id; gravarArmazenado('localStorage', CHAVE_USUARIO, id); fecharPrecos(); log('entrou', { usuario: id }); }
  function escolherUsuario(id, senha) {
    if (!USUARIOS[id] || senha !== USUARIOS[id][1]) return false;
    marcarUsuario(id); return true;
  }
  // Devolve uma promessa (a home espera uma), true se a senha confere.
  function entrar(id, senha) { return Promise.resolve(escolherUsuario(id, senha)); }
  // Admin: preços liberados neste aparelho? (o padrão é escondido)
  function precosLiberados() { return usuario() === 'admin' && (lerArmazenado('localStorage', CHAVE_PRECOS) || memoria.precos) === 'liberados'; }
  function liberarPrecos(sim) {
    if (usuario() !== 'admin') return;
    memoria.precos = sim ? 'liberados' : ''; gravarArmazenado('localStorage', CHAVE_PRECOS, sim ? 'liberados' : null);
    log(sim ? 'precos-liberados' : 'precos-escondidos', { onde: PAGINA }); enviarLog(false);
  }
  // Preços visíveis nesta tela, pela regra do usuário. null quando não aparecem.
  function precos() {
    var P = window.PRECOS_DEMO, u = usuario();
    if (!P || html.dataset.contexto === 'app' || PAGINA === 'app' || html.dataset.semPrecos !== undefined) return null;
    return u === 'andre' || (u === 'admin' && precosLiberados()) ? P : null;
  }
  function fecharPrecos() { memoria.precos = ''; gravarArmazenado('localStorage', CHAVE_PRECOS, null); }
  function reais(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function trocarUsuario() { log('saiu-usuario', {}); enviarLog(true); memoria.usuario = ''; fecharPrecos(); gravarArmazenado('localStorage', CHAVE_USUARIO, null); }
  // Trocou o usuário ou os preços em outra aba: o escopo e o resumo se refazem com a regra nova, na hora
  // (os balões do painel já leem a regra quando abrem).
  window.addEventListener('storage', function (ev) {
    if ((ev.key === CHAVE_USUARIO || ev.key === CHAVE_PRECOS) && PAGINA === 'escopo' && !dentroDeQuadro) location.reload();
  });
  // Marcações do escopo neste aparelho (a mesma chave do escopo e do resumo em PDF).
  function chaveEscopo() { var D = window.ESCOPO; return 'ag-escopo-reuniao-v' + (D ? D.versao : '') + '-tudo-marcado'; }
  // Raiz da demonstração (…/demo/drandrepontes/) e a página atual (home, app, painel, escopo, questionario, fluxo, datalog).
  var RAIZ = (function () { var p = location.pathname, i = p.indexOf('/drandrepontes/'); return i >= 0 ? p.slice(0, i + 15) : p.replace(/[^/]*$/, ''); })();
  var PAGINA = (function () { var r = location.pathname.slice(RAIZ.length).split('/')[0]; return r === '' || r === 'index.html' ? 'home' : r; })();
  var semRegistro = dentroDeQuadro || PAGINA === 'datalog';
  // Sem usuário escolhido, toda página da demonstração manda para a home e volta ao destino depois da escolha.
  if (!dentroDeQuadro && PAGINA !== 'home' && PAGINA !== 'datalog' && !usuario()) {
    location.replace(RAIZ + '?volta=' + encodeURIComponent(location.pathname + location.search + location.hash));
  }
  // Destino de volta só dentro da demonstração.
  function destinoVolta() { var v = new URLSearchParams(location.search).get('volta') || ''; return v.indexOf(RAIZ) === 0 && v.indexOf('//') < 0 ? v : ''; }

  // ---------- Registro de uso (vai para o datalog da RXSync) ----------
  // Em lotes a cada 10 s e ao sair da página (sendBeacon). Se falhar, a demonstração segue normal, sem erro na tela.
  var URL_LOG = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demo-log';
  var fila = [], telaAberta = '', telaDesde = Date.now(), paginaDesde = Date.now();
  function telaAtual() { return (location.hash || '').slice(1).split('?')[0] || (PAGINA === 'home' ? '' : 'inicio'); }
  function log(acao, detalhe, tela) {
    if (semRegistro || !usuario()) return;
    fila.push({ t: Date.now(), pagina: PAGINA, tela: tela == null ? telaAtual() : tela, acao: String(acao).slice(0, 60), detalhe: detalhe || {} });
    if (fila.length > 500) fila = fila.slice(-500);
    if (fila.length >= 50) enviarLog(false);
  }
  function corpoLog(eventos) { return JSON.stringify({ usuario: usuario(), aparelho: codigo('localStorage', 'ag-aparelho'), sessao: codigo('sessionStorage', 'ag-sessao'), eventos: eventos }); }
  function enviarLog(saindo) {
    if (semRegistro || !fila.length) return;
    var lote = fila.splice(0, 50), corpo = corpoLog(lote);
    try {
      if (saindo && navigator.sendBeacon) { if (!navigator.sendBeacon(URL_LOG, corpo)) fila = lote.concat(fila); }
      else if (window.fetch) fetch(URL_LOG, { method: 'POST', body: corpo, keepalive: corpo.length < 60000, mode: 'cors', credentials: 'omit' })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json().catch(function () { return {}; }); })
        // O servidor responde { ok: false, motivo } (rxsync-sistema DEC-135, W-03): com falha interna, o lote volta para a
        // fila e vai de novo na próxima rodada; com limite ou formato, tentar de novo não adianta, e o lote é descartado.
        .then(function (j) { if (j && j.ok === false && (!j.motivo || j.motivo === 'interno')) fila = lote.concat(fila).slice(-500); })
        .catch(function () { fila = lote.concat(fila).slice(-500); });
    } catch (e) { fila = lote.concat(fila).slice(-500); }
    if (saindo && fila.length) enviarLog(true);
  }
  function fecharTela() { if (telaAberta !== null) log('saiu-tela', { seg: Math.round((Date.now() - telaDesde) / 1000) }, telaAberta); }
  function abrirTela() { telaAberta = telaAtual(); telaDesde = Date.now(); log('abriu-tela', {}, telaAberta); }
  if (!semRegistro) {
    log('abriu-pagina', { endereco: location.pathname.slice(RAIZ.length) + location.search, largura: window.innerWidth });
    abrirTela();
    window.addEventListener('hashchange', function () { fecharTela(); abrirTela(); });
    setInterval(function () { enviarLog(false); }, 10000);
    var saiu = false;
    window.addEventListener('pagehide', function () { if (saiu) return; saiu = true; fecharTela(); log('saiu-pagina', { seg: Math.round((Date.now() - paginaDesde) / 1000) }); enviarLog(true); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') enviarLog(true); else saiu = false; });
    // Toques em botões, links e marcadores (texto do botão, sem nada do que foi digitado).
    document.addEventListener('click', function (ev) {
      var el = ev.target.closest && ev.target.closest('button, a, [role="button"], .item, input[type="checkbox"], input[type="radio"], summary, [data-acao], [data-c], [data-r], [data-e], [data-f]');
      if (!el) return;
      var d = { texto: (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
      ['acao', 'c', 'r', 'e', 'f', 'v', 'itens', 'marca', 'st'].forEach(function (k) { if (el.dataset && el.dataset[k]) d[k] = String(el.dataset[k]).slice(0, 80); });
      if (el.tagName === 'A' && el.getAttribute('href')) d.link = el.getAttribute('href').slice(0, 120);
      if (el.type === 'checkbox' || el.type === 'radio') d.marcado = !!el.checked;
      log(el.classList.contains('item') ? 'tocou-marcador' : 'tocou', d);
    }, true);
  }

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
  // O logo da AG Melhor Versão (comum/marca/): quadrado verde-oliva de cantos arredondados, "AG" e "MELHOR VERSÃO" em creme.
  // O texto "MELHOR VERSÃO" já está no desenho; a opção texto fica só por compatibilidade.
  function logo(opc) {
    opc = opc || {};
    var t = opc.tamanho || 64, arq = t > 96 ? 'logo-512.png' : 'logo-192.png';
    return '<span class="logo"><img src="' + RAIZ + 'comum/marca/' + arq + '" width="' + t + '" height="' + t + '" alt="AG Melhor Versão" decoding="async"></span>';
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
    sol: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
    folha: '<path d="M5 19c0-8 5-14 15-14 0 9-6 14-15 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
    ondas: '<path d="M3.5 9.5c2-2 4-2 6 0s4 2 6 0 4-2 5 0M3.5 15c2-2 4-2 6 0s4 2 6 0 4-2 5 0"/>',
    nuvem: '<path d="M7 18.5h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 10a4.3 4.3 0 0 0 0 8.5z"/>',
    raio: '<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',
    lua: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    casa: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
    clinica: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M9 6V4h6v2M12 9.5v6M9 12.5h6"/>',
    abdome: '<path d="M7 4c1 4 1 7-1 10-1 3 0 6 6 6s7-3 6-6c-2-3-2-6-1-10"/><path d="M8.5 14c2 1.5 5 1.5 7 0"/>',
    coxa: '<path d="M9 3c-1 5-1 9 1 13l1 5h3l-.5-5c1-4 1.5-8 1.5-13"/>',
    braco: '<path d="M5 20c1-5 3-8 6-9l3-1c2-.5 2-3 0-3.5L11 6M11 11c3 1 6 3 8 7"/>',
    balao: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4h0A2 2 0 0 1 4 14z"/>',
    bolhas: '<path d="M3.5 13V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7l-3.5 3z"/><path d="M18 9h1a1.5 1.5 0 0 1 1.5 1.5V19l-3-2.5H11a1.5 1.5 0 0 1-1.5-1.5v-1"/>',
    pessoas: '<circle cx="12" cy="7.5" r="2.6"/><circle cx="5.5" cy="9.5" r="2"/><circle cx="18.5" cy="9.5" r="2"/><path d="M7.5 19c.4-3.3 2.2-5.3 4.5-5.3s4.1 2 4.5 5.3M2.5 18c.3-2.3 1.4-3.6 3-3.8M21.5 18c-.3-2.3-1.4-3.6-3-3.8"/>',
    lapis: '<path d="M14.5 5.5l4 4L9 19H5v-4z"/><path d="M12.5 7.5l4 4"/>',
    lixo: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 10.5v6M14 10.5v6"/>',
    voltar: '<path d="M15 5l-7 7 7 7"/>',
    baixo: '<path d="M6 9l6 6 6-6"/>',
    cima: '<path d="M6 15l6-6 6 6"/>',
    facebook: '<path d="M14 21v-8h3l.5-3.5H14V7.6c0-1 .3-1.7 1.8-1.7h1.8V2.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v2.4H8V13h2.7v8"/>',
    fone: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.5"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.5"/>',
    local: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    desfazer: '<path d="M9 7 4.5 11.5 9 16"/><path d="M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-3"/>',
    frasco: '<rect x="8" y="3.5" width="8" height="3" rx="1"/><path d="M8.5 6.5h7v13a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M8.5 11h7"/>',
    caixa: '<path d="M4 8l8-4.5L20 8v8.5L12 21l-8-4.5z"/><path d="M4 8l8 4.5L20 8M12 12.5V21"/>',
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
  // item(107) · item([124, 125]) · novo() · juridico() · proposta() · sempre()
  // Marcadores clicáveis: tocar abre um balão curto com o significado e o item do escopo ("Ver no escopo").
  function item(n) {
    var l = [].concat(n);
    return '<span class="item" role="button" tabindex="0" data-itens="' + l.join(',') + '" title="Item do escopo">item ' + l.join(' · ') + '</span>';
  }
  function novo(t) { return '<span class="item item-novo" role="button" tabindex="0" data-marca="novo">novo' + (t ? ' · ' + t : '') + '</span>'; }
  function juridico(t) { return '<span class="item item-juridico" role="button" tabindex="0" data-marca="juridico">' + (t || 'depende do parecer jurídico') + '</span>'; }
  function proposta() { return '<span class="item item-proposta" role="button" tabindex="0" data-marca="proposta">proposta</span>'; }
  function sempre() { return '<span class="item item-sempre" role="button" tabindex="0" data-marca="sempre">🔒 sempre ligado</span>'; }

  var MARCAS = {
    item: 'Número do item no escopo do projeto. Cada função da proposta tem um número fixo, para conferir na reunião.',
    novo: 'Item que ainda não tinha número no escopo e entra como proposta.',
    proposta: 'Item em proposta: sugestão da RXSync além do pedido original, com conteúdo a combinar com a equipe.',
    juridico: 'Só entra no ar depois do parecer do advogado e da classificação de risco (Resolução CFM 2.454/2026). A IA nunca diagnostica, nunca prescreve e nunca fala de dose.',
    sempre: 'Sempre ligado: por segurança, exigência legal ou estrutura do sistema, não tem botão de desligar.'
  };
  // Os balões mostram o lote, o subprojeto e as marcas. O preço do item só aparece para o Admin com os preços abertos
  // (nunca no app do paciente).
  function nomeSub(l) { var D = window.ESCOPO, s = D && D.subprojetos && D.subprojetos[l.sub]; return s ? s.nome.replace(/^[A-Z]+ · /, '') : ''; }
  // ---------- Itens tirados no escopo: aparecem apagados na demonstração (com "fora do projeto") ----------
  function tirados() {
    var D = window.ESCOPO, o = {}; if (!D) return o;
    // Item obrigatório nunca fica "tirado", mesmo com uma marcação antiga salva no aparelho.
    var obrig = {}; D.itens.forEach(function (i) { if (i.obrigatorio) obrig[i.n] = 1; });
    try { var m = JSON.parse(localStorage.getItem(chaveEscopo()) || 'null'); if (m && m.status) Object.keys(m.status).forEach(function (n) { if (m.status[n] === 'tirar' && !obrig[n]) o[n] = 1; }); } catch (e) { /* sem armazenamento */ }
    return o;
  }
  function marcarDesligados(raiz, t) {
    if (PAGINA === 'escopo' || !raiz || raiz.nodeType !== 1) return;
    t = t || tirados(); if (!Object.keys(t).length) return;
    var lista = (raiz.matches('.item[data-itens]') ? [raiz] : []).concat([].slice.call(raiz.querySelectorAll('.item[data-itens]')));
    lista.forEach(function (el) {
      var ns = el.dataset.itens.split(',').filter(Boolean);
      if (!ns.length || el.classList.contains('item-fora') || !ns.every(function (n) { return t[n]; })) return;
      el.classList.add('item-fora'); el.setAttribute('title', 'Tirado no escopo: fora do projeto'); el.appendChild(document.createTextNode(' · fora do projeto'));
      var bloco = el.closest('.lin, tr, li, .ficha-cartao, .alerta-lin, .lin-menu, .cartao, .atalho');
      if (bloco) bloco.classList.add('desligado');
    });
  }
  function textoItem(n) {
    var D = window.ESCOPO; if (!D) return '<p>Item ' + n + ' do escopo.</p>';
    var i = D.itens.filter(function (x) { return x.n === n; })[0]; if (!i) return '<p>Item ' + n + ' do escopo.</p>';
    var l = D.lotes.filter(function (x) { return x.id === i.lote; })[0] || {};
    var noApp = html.dataset.contexto === 'app'; // no app, nada de custo de IA (a IA é cobrada só da clínica)
    return '<div class="explica-item"><b>' + n + ' · ' + esc(i.nome) + '</b><p>' + esc(i.desc) + '</p>' +
      (tirados()[n] ? '<p class="aviso-fora">Tirado no escopo: aparece apagado nesta demonstração. Para religar, toque em "Ver no escopo" e marque "Incluir".</p>' : '') + '<small>' + esc(l.nome || '') + (nomeSub(l) && l.sub !== 'P1' ? ' · ' + esc(nomeSub(l)) : '') +
      (!noApp && precos() && precos().itens[n] ? ' · ' + reais(precos().itens[n]) : '') + (i.obrigatorio ? ' · obrigatório' : '') + (l.proposta ? ' · proposta' : '') + (i.terceiros ? ' · depende de terceiros' : '') +
      (i.sempre ? ' · 🔒 sempre ligado' : '') + (!noApp && i.consumo ? ' · 💲 IA cobrada da clínica pelo uso' : '') + '</small></div>';
  }
  function fecharExplica() { var e = document.querySelector('.explica-fundo'); if (e) e.remove(); }
  function abrirExplica(el) {
    fecharExplica();
    var nums = (el.dataset.itens || '').split(',').filter(Boolean).map(Number), marca = el.dataset.marca || (nums.length ? 'item' : '');
    if (!marca && el.classList.contains('item-juridico')) marca = 'juridico';
    var f = document.createElement('div'); f.className = 'explica-fundo';
    var escopo = (html.dataset.raiz || '../') + 'escopo/';
    f.innerHTML = '<div class="explica" role="dialog" aria-label="O que significa">' +
      '<div class="explica-cab"><span class="rotulo">O que significa</span><button type="button" class="explica-fechar" aria-label="Fechar">✕</button></div>' +
      '<p>' + MARCAS[marca || 'item'] + '</p>' + nums.map(textoItem).join('') +
      '<div class="explica-acoes">' + nums.map(function (n) {
        return '<a class="botao" href="' + escopo + '#item-' + n + '" target="_blank" rel="noopener" data-leva-estilo>Ver no escopo' + (nums.length > 1 ? ' · ' + n : '') + '</a>';
      }).join('') + (nums.length ? '' : '<a class="botao botao-claro" href="' + escopo + '" target="_blank" rel="noopener" data-leva-estilo>Abrir o escopo</a>') + '</div></div>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.closest('.explica-fechar')) fecharExplica(); });
  }
  // Pega o toque antes dos outros cliques (o marcador pode estar dentro de um cartão que é link).
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('.item[data-itens], .item[data-marca], .item-juridico');
    if (!el || el.closest('.explica')) return;
    ev.preventDefault(); ev.stopPropagation(); abrirExplica(el);
  }, true);
  window.addEventListener('hashchange', fecharExplica);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') fecharExplica();
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('.item[data-itens], .item[data-marca]')) { ev.preventDefault(); abrirExplica(ev.target); }
  });


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
      log('pergunta', { chat: String(o.titulo || 'chat').slice(0, 60), texto: t.slice(0, 500) });
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
      b.addEventListener('click', function () { aplicarEstilo(b.dataset.estilo, true); log('estilo', { estilo: b.dataset.estilo }); d.classList.remove('aberta'); });
    });
    document.addEventListener('click', function (ev) { if (!d.contains(ev.target)) d.classList.remove('aberta'); });
  }
  // "‹ Demo": volta para a home da demonstração (só nas páginas que dizem onde ela fica, em data-voltar).
  function montarVoltar() {
    if (!html.dataset.voltar || document.querySelector('.volta-demo')) return;
    var a = document.createElement('a'); a.className = 'volta-demo'; a.href = html.dataset.voltar; a.setAttribute('data-leva-estilo', '');
    a.setAttribute('aria-label', 'Voltar para o início da demonstração'); a.textContent = '‹ Demo';
    document.body.appendChild(a);
  }
  // ---------- datas reais (hoje, semana, feriados) ----------
  // Os dados de exemplo são relativos a hoje. Nos textos, marcas {formato:deslocamento} viram a data real:
  //   {d:-3} 10/10 · {a:+30} 12/11/2026 · {ws:+1} qua · {Ws:+1} Qua · {wl:+1} quarta · {Wl:+1} Quarta
  //   {x:0} terça, 13 de outubro · {X:0} Terça, 13 de outubro · {r:-3} há 3 dias · {R:0} Hoje
  //   {h:-45} hora de 45 minutos atrás · {m:0} outubro · {M:-1} Setembro · {y:0} 2026
  //   "u" conta dias úteis (sem fim de semana e feriado): {Ws:u+2} = dia da semana do 2º dia útil depois de hoje.
  //   "p" é a próxima ocorrência de um dia da semana: {d:p4} = data da próxima quinta.
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var SEM_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var SEM_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function agora() { return new Date(); }
  function meiaNoite(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function hoje() { return meiaNoite(agora()); }
  function somaDias(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function diasEntre(a, b) { return Math.round((meiaNoite(b) - meiaNoite(a)) / 864e5); }
  // Páscoa (algoritmo de Meeus) para a Sexta-feira Santa.
  function pascoa(ano) {
    var a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }
  var cacheFeriados = {};
  // Feriados nacionais (Lei 662/1949 e seguintes, incluindo 20/11 desde 2024).
  function feriados(ano) {
    if (cacheFeriados[ano]) return cacheFeriados[ano];
    var l = [[1, 1, 'Confraternização Universal'], [4, 21, 'Tiradentes'], [5, 1, 'Dia do Trabalho'], [9, 7, 'Independência'], [10, 12, 'Nossa Senhora Aparecida'],
      [11, 2, 'Finados'], [11, 15, 'Proclamação da República'], [11, 20, 'Consciência Negra'], [12, 25, 'Natal']].map(function (x) { return { data: new Date(ano, x[0] - 1, x[1]), nome: x[2] }; });
    l.push({ data: somaDias(pascoa(ano), -2), nome: 'Sexta-feira Santa' });
    return (cacheFeriados[ano] = l.sort(function (a, b) { return a.data - b.data; }));
  }
  function feriado(d) { var f = feriados(d.getFullYear()).filter(function (x) { return diasEntre(x.data, d) === 0; })[0]; return f ? f.nome : ''; }
  function util(d) { var w = d.getDay(); return w > 0 && w < 6 && !feriado(d); }
  function somaUteis(d, n) { var x = meiaNoite(d), passo = n < 0 ? -1 : 1, k = Math.abs(n); while (k > 0) { x = somaDias(x, passo); if (util(x)) k--; } return x; }
  function proximoFeriado(d) {
    d = meiaNoite(d || agora());
    var l = feriados(d.getFullYear()).concat(feriados(d.getFullYear() + 1)).filter(function (x) { return x.data >= d; });
    return l[0];
  }
  // Semana mostrada na agenda: a do dia de referência (hoje, se for dia útil; senão, o próximo dia útil).
  function semana() {
    var h = hoje(), ref = util(h) ? h : somaUteis(h, 1), seg = somaDias(ref, 1 - ref.getDay());
    var dias = [0, 1, 2, 3, 4].map(function (i) { return somaDias(seg, i); });
    return { dias: dias, ref: ref.getDay() - 1, hoje: dias.map(Number).indexOf(+h), refData: ref };
  }
  function dm(d) { return dois(d.getDate()) + '/' + dois(d.getMonth() + 1); }
  function dma(d) { return dm(d) + '/' + d.getFullYear(); }
  function hm(d) { return dois(d.getHours()) + ':' + dois(d.getMinutes()); }
  function extenso(d) { return SEM_LONGO[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function relativo(n) { return n === 0 ? 'hoje' : n === -1 ? 'ontem' : n === 1 ? 'amanhã' : n < 0 ? 'há ' + -n + ' dias' : 'daqui a ' + n + ' dias'; }
  // Deslocamento: número de dias (+2), "u" + dias úteis (u+2) ou "p" + dia da semana (p4 = próxima quinta, a partir de amanhã).
  function dataDe(off) {
    var c = off.charAt(0);
    if (c === 'u') return somaUteis(hoje(), +off.slice(1));
    if (c === 'p') { var x = somaDias(hoje(), 1); while (x.getDay() !== +off.slice(1)) x = somaDias(x, 1); return x; }
    return somaDias(hoje(), +off);
  }
  var FORMATOS = {
    d: function (o) { return dm(dataDe(o)); }, a: function (o) { return dma(dataDe(o)); },
    ws: function (o) { return SEM_CURTO[dataDe(o).getDay()]; }, Ws: function (o) { return cap(SEM_CURTO[dataDe(o).getDay()]); },
    wl: function (o) { return SEM_LONGO[dataDe(o).getDay()]; }, Wl: function (o) { return cap(SEM_LONGO[dataDe(o).getDay()]); },
    x: function (o) { return extenso(dataDe(o)); }, X: function (o) { return cap(extenso(dataDe(o))); },
    r: function (o) { return relativo(diasEntre(hoje(), dataDe(o))); }, R: function (o) { return cap(relativo(diasEntre(hoje(), dataDe(o)))); },
    h: function (o) { return hm(new Date(agora().getTime() + (+o) * 6e4)); },
    m: function (o) { var x = agora(); return MESES[(x.getMonth() + (+o) % 12 + 12) % 12]; }, M: function (o) { return cap(FORMATOS.m(o)); },
    y: function (o) { return String(agora().getFullYear() + (+o)); }
  };
  var MARCA = /\{(d|a|ws|Ws|wl|Wl|x|X|r|R|h|m|M|y):([up]?[+-]?\d+)\}/g;
  function trocar(t) { return String(t).indexOf('{') < 0 ? t : String(t).replace(MARCA, function (s, f, o) { return FORMATOS[f](o); }); }
  // Troca as marcas em tudo o que aparece na página (telas, janelas, avisos e balões), antes de desenhar.
  // O value de <option> fica como está: é chave de dado, não texto.
  var ATRIBUTOS = ['value', 'title', 'placeholder', 'aria-label', 'data-v', 'data-msg'];
  function trocarEm(no) {
    if (no.nodeType === 3) { if (no.nodeValue.indexOf('{') >= 0) { var n = trocar(no.nodeValue); if (n !== no.nodeValue) no.nodeValue = n; } return; }
    if (no.nodeType !== 1) return;
    var w = document.createTreeWalker(no, 5, null), x = no;
    while (x) {
      if (x.nodeType === 3) { if (x.nodeValue.indexOf('{') >= 0) { var v = trocar(x.nodeValue); if (v !== x.nodeValue) x.nodeValue = v; } }
      else ATRIBUTOS.forEach(function (a) { if (a === 'value' && x.tagName === 'OPTION') return; var at = x.getAttribute(a); if (at && at.indexOf('{') >= 0) { var t = trocar(at); if (t !== at) x.setAttribute(a, t); } });
      x = w.nextNode();
    }
  }
  new MutationObserver(function (lista) {
    var t = null;
    lista.forEach(function (m) {
      if (m.type === 'childList') m.addedNodes.forEach(function (no) { trocarEm(no); if (no.nodeType === 1) marcarDesligados(no, t || (t = tirados())); });
      else if (m.type === 'characterData') trocarEm(m.target);
      else if (m.type === 'attributes' && !(m.attributeName === 'value' && m.target.tagName === 'OPTION')) { var v = m.target.getAttribute(m.attributeName); if (v && v.indexOf('{') >= 0) { var t = trocar(v); if (t !== v) m.target.setAttribute(m.attributeName, t); } }
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  var DATAS = {
    agora: agora, hoje: hoje, somaDias: somaDias, somaUteis: somaUteis, diasEntre: diasEntre, util: util, feriado: feriado, feriados: feriados, proximoFeriado: proximoFeriado,
    semana: semana, dm: dm, dma: dma, hm: hm, extenso: extenso, relativo: relativo, cap: cap, trocar: trocar,
    semCurto: function (d) { return SEM_CURTO[d.getDay()]; }, semLongo: function (d) { return SEM_LONGO[d.getDay()]; }, mes: function (d) { return MESES[d.getMonth()]; },
    // "há N min" a partir de agora, em HH:MM
    horaAntes: function (min) { return hm(new Date(agora().getTime() - min * 6e4)); }
  };

  // Aviso curto de privacidade na entrada (rxsync-sistema DEC-134, #99), uma vez por aparelho. A marca guardada no
  // navegador ('ag-aviso-privacidade' = '1') diz só que o aviso já foi visto: nenhum dado pessoal.
  var CHAVE_AVISO = 'ag-aviso-privacidade';
  function montarAvisoPrivacidade() {
    if (PAGINA !== 'home' || dentroDeQuadro || lerArmazenado('localStorage', CHAVE_AVISO) || memoria.aviso || document.getElementById('aviso-privacidade')) return;
    var a = document.createElement('div');
    a.id = 'aviso-privacidade'; a.setAttribute('role', 'region'); a.setAttribute('aria-label', 'Aviso de privacidade');
    a.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;padding:14px 16px;border-radius:14px;'
      + 'background:#14171c;color:#f5f5f4;font:14px/1.5 system-ui,-apple-system,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.25)';
    var p = document.createElement('p'); p.style.margin = '0 0 10px';
    p.appendChild(document.createTextNode('Esta demonstração registra como ela é usada (telas abertas e toques) para a RXSync preparar a conversa sobre o projeto. O endereço IP fica só resumido, e o registro é apagado 90 dias depois do último uso. '));
    var l = document.createElement('a'); l.href = '/privacidade.html'; l.target = '_blank'; l.rel = 'noopener'; l.textContent = 'Política de Privacidade'; l.style.color = '#7dd3c0';
    p.appendChild(l); p.appendChild(document.createTextNode('.'));
    var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Entendi';
    b.style.cssText = 'min-height:44px;padding:0 18px;border:0;border-radius:10px;background:#f5f5f4;color:#14171c;font:600 15px system-ui,-apple-system,sans-serif;cursor:pointer';
    b.addEventListener('click', function () { memoria.aviso = '1'; gravarArmazenado('localStorage', CHAVE_AVISO, '1'); a.remove(); });
    a.appendChild(p); a.appendChild(b); document.body.appendChild(a);
  }

  function iniciar() {
    if (!document.body) return; // página sendo trocada (sem usuário, indo para a escolha)
    trocarEm(document.body); marcarDesligados(document.body);
    montarSelo(); montarTroca(); montarVoltar(); montarAvisoPrivacidade();
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

  window.AG = { datas: DATAS, log: log, enviarLog: enviarLog, usuario: usuario, USUARIOS: USUARIOS, escolherUsuario: escolherUsuario, entrar: entrar, precos: precos, precosLiberados: precosLiberados, liberarPrecos: liberarPrecos, fecharPrecos: fecharPrecos, reais: reais, chaveEscopo: chaveEscopo, trocarUsuario: trocarUsuario, destinoVolta: destinoVolta, raiz: RAIZ, pagina: PAGINA, aparelho: function () { return codigo('localStorage', 'ag-aparelho'); }, sessao: function () { return codigo('sessionStorage', 'ag-sessao'); }, ESTILOS: ESTILOS, balao: balao, esc: esc, logo: logo, ic: ic, bolha: bolha, anel: anel, item: item, novo: novo, juridico: juridico, proposta: proposta, sempre: sempre, nomeSub: nomeSub, estilo: function () { return html.dataset.estilo; }, aplicarEstilo: aplicarEstilo };
})();
