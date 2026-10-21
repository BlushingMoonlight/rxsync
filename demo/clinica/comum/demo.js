// Demonstração por link (DEC-125): o que as 4 páginas (entrada, app, central e escopo) dividem.
// - o código vem depois do # (rxsync.com.br/demo/clinica/#CODIGO): não vai para o servidor do site nem para o Google;
// - o servidor (workflow 43) devolve só o que aparece na tela: clínica, Dr./Dra., médico, especialidade, cidade, cor e o
//   escopo marcado. Nada disso fica guardado no aparelho;
// - o uso (telas, toques, perguntas nos chats) vai em lotes; nada do que é digitado nos campos de exemplo é enviado,
//   só as perguntas dos chats e o recado do "Quero conversar";
// - os pacientes são de mentira; o app não calcula dose e nenhuma resposta diagnostica ou prescreve.
(function () {
  'use strict';
  const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demonstracao';
  const ORIGEM = 'rxsync-site-2026';
  const ALFABETO = /^[ACDEFGHJKMNPQRTUVWXY3479]{16}$/;

  // ---------------------------------------------------------------- utilidades
  function el(tag, props, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = String(v);
      else if (k === 'value') e.value = String(v);
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const f of filhos.flat(Infinity)) if (f != null && f !== false) e.append(f instanceof Node ? f : document.createTextNode(String(f)));
    return e;
  }
  const trocar = (pai, ...filhos) => pai.replaceChildren(...filhos.flat(Infinity).filter(f => f != null && f !== false));
  const iniciais = n => String(n || '?').split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || String(n || '?').slice(0, 2).toUpperCase();
  const sorteio = () => { const b = new Uint8Array(10); crypto.getRandomValues(b); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); };
  const ler = (onde, k) => { try { return window[onde].getItem(k); } catch (e) { return null; } };
  const gravar = (onde, k, v) => { try { window[onde].setItem(k, v); } catch (e) { /* aba privada: segue sem guardar */ } };

  // ---------------------------------------------------------------- o código e as partes do endereço (#CODIGO&ver=…&tela=…&item=…)
  const partes = location.hash.replace(/^#/, '').split('&');
  const codigo = String(partes[0] || '').toUpperCase();
  const extra = Object.fromEntries(partes.slice(1).map(p => p.split('=')).filter(p => p.length === 2).map(([k, v]) => [k, decodeURIComponent(v)]));
  const temCodigo = ALFABETO.test(codigo);
  // O código e a tela vêm do # na abertura: se o # mudar (outro link colado na mesma aba), abre de novo.
  addEventListener('hashchange', () => location.reload());
  // Aparelho: um código aleatório guardado no navegador (só ele); aba: outro, só nesta aba.
  let aparelho = ler('localStorage', 'demo_aparelho');
  if (!/^[0-9a-f]{20}$/.test(aparelho || '')) { aparelho = sorteio(); gravar('localStorage', 'demo_aparelho', aparelho); }
  let sessao = ler('sessionStorage', 'demo_sessao');
  if (!/^[0-9a-f]{20}$/.test(sessao || '')) { sessao = sorteio(); gravar('sessionStorage', 'demo_sessao', sessao); }

  const est = { pagina: '', dados: null, ver: false, fila: [], tela: '', telaDesde: 0, embed: extra.embed === '1', quieto: extra.embed === '1' };

  // Tema: segue o aparelho; a troca manual vale só nesta aba (sessionStorage).
  const temaGuardado = ler('sessionStorage', 'demo_tema');
  if (temaGuardado === 'claro' || temaGuardado === 'escuro') document.documentElement.dataset.tema = temaGuardado;
  const escuro = () => document.documentElement.dataset.tema === 'escuro' || (document.documentElement.dataset.tema !== 'claro' && matchMedia('(prefers-color-scheme: dark)').matches);
  function trocarTema() {
    const novo = escuro() ? 'claro' : 'escuro';
    transicao(() => { document.documentElement.dataset.tema = novo; document.querySelectorAll('.botao-tema').forEach(desenharBotaoTema); });
    gravar('sessionStorage', 'demo_tema', novo);
  }
  function desenharBotaoTema(b) {
    const e = escuro();
    b.setAttribute('aria-label', e ? 'Usar o tema claro' : 'Usar o tema escuro');
    b.replaceChildren(window.DEMO_ICONE(e ? 'sol' : 'lua'));
  }
  const botaoTema = () => { const b = el('button', { type: 'button', class: 'botao-tema', onclick: trocarTema }); desenharBotaoTema(b); return b; };

  // Movimento: troca de tela com a View Transitions API (sem ela, ou com "reduzir movimento", a troca é direta).
  const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function transicao(fn) {
    if (!document.startViewTransition || semMovimento() || document.visibilityState !== 'visible') { fn(); return; }
    try { document.startViewTransition(fn); } catch (e) { fn(); }
  }

  // O que a pessoa já viu nesta aba (a entrada mostra "App ✓ · Central ✓ · Escopo —"); só na memória da aba.
  const vistos = () => { try { return JSON.parse(ler('sessionStorage', 'demo_visto') || '{}') || {}; } catch (e) { return {}; } };
  function marcarVisto(pagina) { const v = vistos(); if (v[pagina]) return; v[pagina] = 1; gravar('sessionStorage', 'demo_visto', JSON.stringify(v)); }

  // Endereço de outra página da demonstração, levando o código (e o "ver como o médico vê", se for o caso).
  const raizDemo = () => est.pagina === 'entrada' ? '' : '../';
  const raizSite = () => est.pagina === 'entrada' ? '../../' : '../../../';
  function link(pagina, mais) {
    const base = pagina === 'entrada' ? (raizDemo() || './') : raizDemo() + pagina + '/';
    const p = [codigo];
    if (extra.ver) p.push('ver=' + encodeURIComponent(extra.ver));
    for (const [k, v] of Object.entries(mais || {})) p.push(k + '=' + encodeURIComponent(v));
    return base + '#' + p.join('&');
  }

  // ---------------------------------------------------------------- servidor (workflow 43)
  async function pedir(corpo) {
    try {
      const r = await fetch(N8N, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-rxsync-origem': ORIGEM }, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
        body: JSON.stringify({ codigo, aparelho, sessao, ...(extra.ver ? { ver: extra.ver } : {}), ...corpo }) });
      return await r.json();
    } catch (e) { return { ok: false, motivo: 'indisponivel' }; }
  }
  // Fila de eventos: um lote a cada 10 segundos e, ao sair da página, pelo sendBeacon (chega como texto, sem cabeçalho).
  function evento(acao, detalhe, tela) {
    if (!est.dados || est.ver || est.quieto) return;
    est.fila.push({ pagina: est.pagina, tela: tela == null ? est.tela : tela, acao, t: String(Date.now()), ...(detalhe ? { detalhe } : {}) });
    if (est.fila.length >= 50) enviarFila();
  }
  function enviarFila(saindo) {
    if (!est.fila.length) return;
    const lote = est.fila.splice(0, 50);
    const corpo = JSON.stringify({ tipo: 'eventos', codigo, aparelho, sessao, eventos: lote });
    if (saindo && navigator.sendBeacon) { navigator.sendBeacon(N8N, new Blob([corpo], { type: 'text/plain' })); return; }
    pedir({ tipo: 'eventos', eventos: lote });
  }
  setInterval(() => enviarFila(), 10000);
  const fechar = () => { telaSair(); enviarFila(true); };
  addEventListener('pagehide', fechar);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') fechar(); });

  // Telas: "abriu-tela" e, ao trocar, "saiu-tela" com os segundos.
  function tela(nome) {
    nome = String(nome || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    if (nome === est.tela) return;
    telaSair();
    est.tela = nome; est.telaDesde = Date.now();
    evento('abriu-tela', null, nome);
  }
  function telaSair() {
    if (!est.tela || !est.telaDesde) return;
    const s = Math.round((Date.now() - est.telaDesde) / 1000);
    if (s > 0) evento('saiu-tela', { s: Math.min(s, 3600) }, est.tela);
    est.telaDesde = 0;
  }
  // Toques: botões e links (o texto do botão, nunca o que foi digitado).
  document.addEventListener('click', e => {
    const b = e.target.closest('button, a, [role="tab"]');
    if (!b || b.dataset.semRegistro !== undefined) return;
    const alvo = (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (alvo) evento(b.classList.contains('item') ? 'tocou-item' : 'tocou', { alvo });
  }, true);

  // ---------------------------------------------------------------- mensagens rápidas e janelas
  function rapida(texto) {
    document.querySelectorAll('.rapida').forEach(x => x.remove());
    const r = el('div', { class: 'rapida', role: 'status', text: texto }); document.body.append(r);
    setTimeout(() => r.remove(), 3500);
  }
  // Folha: sobe de baixo no celular; no iPad e no computador, no meio ou ao lado (lateral: true).
  // op: { titulo, conteudo: [nós], lateral, dentro (elemento onde a folha abre; padrão: a página), aoFechar, foco }
  // Devolve { fechar, corpo, titulo(texto), voltar(fn|null) } para trocar o conteúdo sem fechar.
  function folha(op) {
    const origem = document.activeElement;
    const veu = el('div', { class: 'veu' + (op.lateral ? ' lateral' : '') });
    const h = el('h2', { id: 'folha-titulo-' + Date.now(), text: op.titulo });
    const btVoltar = el('button', { class: 'botao sec quadrado pilula', type: 'button', 'aria-label': 'Voltar', hidden: true }, window.DEMO_ICONE('voltar'));
    const corpo = el('div', { class: 'corpo-folha' }, op.conteudo || []);
    const caixa = el('div', { class: 'folha janela', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': h.id },
      el('div', { class: 'pegador', 'aria-hidden': 'true' }),
      el('div', { class: 'cab-folha' }, btVoltar, h, el('button', { class: 'botao sec quadrado pilula', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, window.DEMO_ICONE('fechar'))), corpo);
    let aberta = true;
    const tecla = e => { if (e.key === 'Escape') fechar(); };
    function fechar(depois) {
      if (!aberta) return; aberta = false;
      document.removeEventListener('keydown', tecla);
      const fim = () => { veu.remove(); if (origem && origem.isConnected) origem.focus({ preventScroll: true }); if (op.aoFechar) op.aoFechar(); if (depois) depois(); };
      if (semMovimento() || !caixa.animate) return fim();
      const lado = op.lateral && innerWidth >= 768, meio = !op.lateral && innerWidth >= 768;
      caixa.animate([{ transform: 'none', opacity: 1 }, { transform: lado ? 'translateX(105%)' : meio ? 'translateY(16px) scale(.98)' : 'translateY(100%)', opacity: meio ? 0 : 1 }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      veu.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).onfinish = fim;
    }
    veu.append(caixa); veu.addEventListener('click', e => { if (e.target === veu) fechar(); });
    (op.dentro || document.body).append(veu); document.addEventListener('keydown', tecla);
    const focar = () => setTimeout(() => { const p = op.foco ? caixa.querySelector(op.foco) : (caixa.querySelector('.corpo-folha textarea, .corpo-folha input, .corpo-folha .botao:not(.sec)') || caixa.querySelector('button:not([hidden])')); if (p) p.focus({ preventScroll: true }); }, 40);
    focar();
    return {
      fechar, corpo, caixa,
      trocar(titulo, conteudo, voltarFn) {
        h.textContent = titulo; corpo.replaceChildren(...[].concat(conteudo).flat(Infinity).filter(Boolean)); corpo.scrollTop = 0;
        btVoltar.hidden = !voltarFn; btVoltar.onclick = voltarFn || null; focar();
      }
    };
  }
  function janela(titulo, ...conteudo) { return folha({ titulo, conteudo }).fechar; }

  // Confirmação visível (~0,5 s parada) depois de registrar: "✓ Registrado".
  function confirmar(texto, sub) {
    document.querySelectorAll('.confirma').forEach(x => x.remove());
    const c = el('div', { class: 'confirma', role: 'status' }, el('div', { class: 'vidro' }, el('span', { class: 'circulo' }, window.DEMO_ICONE('check')), el('strong', { text: texto || 'Registrado' }),
      sub ? el('span', { class: 'peq mudo', text: sub }) : null));
    document.body.append(c); setTimeout(() => c.remove(), semMovimento() ? 1200 : 950);
  }

  // ---------------------------------------------------------------- marcadores "item N" (o item do escopo)
  function item(n) {
    const i = (window.DEMO_ITENS || []).find(x => x.n === n);
    return el('button', { type: 'button', class: 'item', 'aria-label': 'Item ' + n + (i ? ': ' + i.t : '') + ' do escopo', 'data-item': n, onclick: () => balao(n) }, 'item ' + n);
  }
  function balao(n) {
    const i = (window.DEMO_ITENS || []).find(x => x.n === n) || { t: 'Item ' + n, d: '' };
    const f = janela('Item ' + n + ' · ' + i.t, el('p', { class: 'mudo', text: i.d }),
      el('div', { class: 'botoes' }, el('a', { class: 'botao', href: link('escopo', { item: n }) }, 'Ver no escopo'), el('button', { class: 'botao sec', type: 'button', onclick: () => f() }, 'Continuar aqui')));
  }
  // Destaca o marcador quando a página abre com &item=N (vindo do "Ver na tela" do escopo).
  function destacar() {
    if (!extra.item) return;
    const m = document.querySelector('.item[data-item="' + Number(extra.item) + '"]');
    if (m) { m.classList.add('destaque'); m.scrollIntoView({ block: 'center' }); }
  }

  // ---------------------------------------------------------------- "Quero conversar": só avisa o Jean (sem WhatsApp, sem telefone)
  function conversar() {
    if (est.ver) { rapida('Modo "ver como o médico vê": nada é enviado.'); return; }
    const texto = el('textarea', { class: 'entrada', id: 'recado', maxlength: '500', rows: '3', placeholder: 'Ex.: pode me chamar à tarde.' });
    const erro = el('p', { class: 'peq', role: 'alert' });
    let fecharJ;
    const enviar = async b => {
      b.disabled = true; erro.textContent = '';
      const r = await pedir({ tipo: 'conversar', texto: texto.value.trim() });
      b.disabled = false;
      if (!r.ok) { erro.textContent = mensagemErro(r); return; }
      fecharJ();
      janela('Pronto', el('p', { text: 'Pronto, o Jean vai te chamar.' }), el('p', { class: 'mudo peq', text: 'Ele fala com você pelo contato que vocês já usam.' }));
    };
    fecharJ = janela('Quero conversar', el('p', { class: 'mudo', text: 'O Jean, da RXSync, recebe o seu pedido e te chama. Se quiser, deixe um recado.' }),
      el('label', { class: 'campo', for: 'recado' }, el('span', { text: 'Recado (opcional)' }), texto),
      el('p', { class: 'mudo peq', text: 'Não escreva dados de pacientes.' }), erro,
      el('div', { class: 'botoes' }, el('button', { class: 'botao', type: 'button', onclick: e => enviar(e.currentTarget) }, 'Enviar')));
  }
  const botaoConversar = cls => el('button', { type: 'button', class: 'botao ' + (cls || ''), onclick: conversar }, 'Quero conversar');

  // ---------------------------------------------------------------- aviso de privacidade (1º acesso neste aparelho; não bloqueia)
  function faixaPrivacidade() {
    if (ler('localStorage', 'demo_aviso_visto') === '1' || est.ver || est.embed) return;
    const f = el('div', { class: 'faixa vidro', role: 'region', 'aria-label': 'Aviso de privacidade' },
      el('p', {}, 'Esta demonstração registra como ela é usada (telas, toques e o que você marcar) para a RXSync preparar a conversa com você. Os pacientes são de mentira. Os registros são apagados 180 dias depois do último acesso. ',
        el('a', { href: raizSite() + 'privacidade.html#demonstracao' }, 'Privacidade')),
      el('button', { class: 'botao', type: 'button', onclick: () => { gravar('localStorage', 'demo_aviso_visto', '1'); f.remove(); } }, 'Entendi'));
    document.body.append(f);
  }

  // ---------------------------------------------------------------- estados: sem código, inativo, limite, fora do ar
  function mensagemErro(r) {
    if (r && r.motivo === 'indisponivel') return 'A demonstração está fora do ar por alguns minutos. Tente de novo daqui a pouco.';
    if (r && r.limite) return 'Muitas tentativas deste aparelho. Tente de novo daqui a pouco.';
    return 'Não consegui enviar. Tente de novo daqui a pouco.';
  }
  function telaEstado(raiz, titulo, texto, botoes) {
    document.title = titulo + ' · Demonstração RXSync';
    trocar(raiz, el('div', { class: 'estado' }, el('div', { class: 'caixa' }, el('h1', { text: titulo }), el('p', { class: 'mudo', text: texto }), el('div', { class: 'botoes' }, botoes))));
  }
  const pedirDemo = () => el('a', { class: 'botao', href: raizSite() + '#contato' }, 'Pedir uma demonstração');

  // ---------------------------------------------------------------- começo de cada página
  // opcoes: { pagina: 'entrada' | 'app' | 'central' | 'escopo', raiz, montar(dados) }
  async function iniciar(op) {
    est.pagina = op.pagina;
    const raiz = op.raiz;
    if (!temCodigo) {
      // Sem código: na entrada, o convite; nas outras páginas, volta para a entrada.
      if (op.pagina !== 'entrada') { location.replace('../'); return; }
      telaEstado(raiz, 'Demonstração do app de acompanhamento', 'Esta página abre com o link que a RXSync manda para cada clínica. Quer ver o app do paciente e a central do médico com o nome da sua clínica?', [pedirDemo()]);
      return;
    }
    trocar(raiz, el('div', { class: 'estado' }, el('div', { class: 'esqueleto', role: 'status', 'aria-label': 'Carregando' }, el('i', { class: 'curto' }), el('i'), el('i', { class: 'alto' }), el('i'), el('i', { class: 'curto' }))));
    // Dentro da entrada (o celular de verdade na tela, &embed=1): usa o que a entrada já recebeu, sem abrir de novo.
    // Os toques só contam depois que a pessoa mexe no celular.
    let pai = null;
    try { if (est.embed && window.parent !== window && window.parent.DEMO && window.parent.DEMO.dados) pai = window.parent.DEMO; } catch (e) { pai = null; }
    if (est.embed) {
      document.documentElement.classList.add('embutido');
      const acordar = () => { if (!est.quieto) return; est.quieto = false; marcarVisto(op.pagina); const t = est.tela; est.tela = ''; tela(t); };
      addEventListener('pointerdown', acordar, { once: true, capture: true }); addEventListener('keydown', acordar, { once: true, capture: true });
    }
    const r = pai ? { ok: true, dados: pai.dados, ver: pai.ver } : await pedir({ tipo: 'abrir', largura: String(Math.round(innerWidth)) });
    if (!r.ok) {
      if (r.inativo) return telaEstado(raiz, 'Este link não está mais ativo', 'A demonstração deste link foi encerrada. Se quiser ver de novo, peça uma demonstração.', [pedirDemo()]);
      return telaEstado(raiz, r.limite ? 'Muitas tentativas' : 'Fora do ar por alguns minutos', mensagemErro(r),
        [el('button', { class: 'botao', type: 'button', onclick: () => location.reload() }, 'Tentar de novo')]);
    }
    est.dados = r.dados || {}; est.ver = !!r.ver;
    document.documentElement.dataset.cor = est.dados.cor || 'verde';
    if (op.pagina !== 'entrada' && !est.embed) marcarVisto(op.pagina);
    op.montar(est.dados);
    faixaPrivacidade();
    destacar();
  }
  // Topo de cada página: as iniciais na cor e o nome da clínica.
  // Topo de cada página (vidro): as iniciais na cor, o nome da clínica, o tema e o que a página pedir (mais).
  function topo(sub, voltar, mais) {
    const d = est.dados || {};
    if (est.embed) return null;
    const t = el('header', { class: 'topo vidro' }, el('div', { class: 'dentro' },
      voltar ? el('a', { class: 'voltar', href: link(voltar), 'aria-label': 'Voltar para a entrada' }, window.DEMO_ICONE('voltar')) : null,
      el('div', { class: 'selo', 'aria-hidden': 'true', text: iniciais(d.clinica) }),
      el('div', { class: 'cresce' }, el('div', { class: 'nome', text: d.clinica || '' }), el('div', { class: 'sub', text: sub })),
      est.ver ? el('span', { class: 'etq atencao', text: 'como o médico vê · sem registro' }) : null, mais || null, botaoTema()));
    return t;
  }
  const nomeMedico = () => { const d = est.dados || {}; return (d.tratamento || '') + ' ' + (d.medico || ''); };

  window.DEMO = { raizSite, el, trocar, iniciar, topo, link, evento, tela, item, balao, rapida, janela, folha, confirmar, transicao, semMovimento, conversar, botaoConversar, botaoTema,
    pedir, mensagemErro, nomeMedico, iniciais, vistos, escuro,
    get dados() { return est.dados; }, get ver() { return est.ver; }, get embed() { return est.embed; }, extra };
})();
