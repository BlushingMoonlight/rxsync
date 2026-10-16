// Central RXSync (DEC-053 a DEC-068). Contrato: rxsync-sistema/docs/mapa/central.md; desenho: central-design.md.
// Tudo o que vem do servidor entra na página como TEXTO (textContent), nunca como HTML.
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/central';
const ORIGEM = 'rxsync-site-2026';

// A página não abre dentro de outra (o GitHub Pages não deixa mandar o cabeçalho que bloqueia isso).
if (window.top !== window.self) { document.body.textContent = 'A Central não abre dentro de outra página.'; try { window.top.location = window.location.href; } catch (e) {} throw new Error('moldura'); }

// ---------------------------------------------------------------- utilidades
const $ = id => document.getElementById(id);
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
// Ícones desenhados aqui (traço 1,8 numa grade de 24). Tamanho fixo pela classe "icone" (16, 20 ou 24 px).
const ICONES = {
  hoje: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z', clientes: 'M15.5 19v-1.2A3.8 3.8 0 0 0 11.7 14H7.3a3.8 3.8 0 0 0-3.8 3.8V19M9.5 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5M20.5 19v-1.2a3.8 3.8 0 0 0-2.8-3.6M15.5 4.2a3.25 3.25 0 0 1 0 6.1',
  financeiro: 'M3.5 7h17v10h-17zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2M7 7v10M17 7v10', sistema: 'M3.5 12h3.5l2.5-6.5 5 13 2.5-6.5h3.5',
  crescimento: 'M4 19h16M6 15l4-4 3 3 5-6M14 8h4v4', uso: 'M4 20V10M10 20V4M16 20v-7M22 20H2', avisos: 'M6.5 9a5.5 5.5 0 1 1 11 0c0 6 2.5 8 2.5 8h-16s2.5-2 2.5-8M10 20.5h4',
  agregados: 'M3 3v18h18M7 15l4-4 3 3 5-6', seguranca: 'M12 3.5 19 6v5.6c0 4.4-3 7.6-7 8.9-4-1.3-7-4.5-7-8.9V6z', api: 'M8 8 4 12l4 4M16 8l4 4-4 4M13.5 5.5l-3 13',
  ajustes: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M9 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5', mais: 'M5 12h.01M12 12h.01M19 12h.01',
  busca: 'M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6M20 20l-4.4-4.4', recolher: 'M15 6l-6 6 6 6', expandir: 'M9 6l6 6-6 6', voltar: 'M15 6l-6 6 6 6', seta: 'M9 6l6 6-6 6',
  alerta: 'M12 4 2.8 19.5h18.4zM12 10v4M12 17h.01', ok: 'M5 12.5l4.5 4.5L19 7.5', relogio: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 7.5V12l3 2', fechar: 'M6 6l12 12M18 6 6 18',
  sair: 'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4', lua: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  cadeado: 'M6.5 11h11v9h-11zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', usuario: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20a7 7 0 0 1 14 0', info: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 11v5M12 8h.01'
};
const icone = (n, tam) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'icone' + (tam ? ' ' + tam : '')); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', ICONES[n] || ''); s.append(p); return s; };
const fmtReal = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = v => (Number(v) || 0).toLocaleString('pt-BR');
const fmtData = v => { if (!v) return '—'; const d = new Date(String(v).length === 10 ? v + 'T12:00:00' : v); return isNaN(d) ? String(v) : d.toLocaleDateString('pt-BR'); };
const fmtHora = v => { if (!v) return '—'; const d = new Date(String(v).replace(' ', 'T')); return isNaN(d) ? String(v) : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const diaCurto = d => fmtData(d).slice(0, 5);
const semAcento = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const iniciais = n => String(n || '?').split(/\s+/).filter(w => w.length > 2 || /^\d/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || String(n || '?').slice(0, 2).toUpperCase();
const hojeISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const vazio = (t, ic) => el('div', { class: 'vazio' }, el('div', { class: 'icone-caixa' }, icone(ic || 'info')), el('p', { text: t || 'Nada por aqui.' }));
const esqueleto = () => el('div', { 'aria-busy': 'true', 'aria-label': 'Carregando' }, el('span', { class: 'esq' }), el('span', { class: 'esq l2' }), el('span', { class: 'esq l3' }));
const etq = (t, tom, semPonto) => el('span', { class: 'etq ' + (tom || '') + (semPonto ? ' sp' : ''), text: t });
const cartao = (titulo, extra, ...filhos) => el('section', { class: 'cartao' }, titulo ? el('div', { class: 'cab' }, el('h2', { text: titulo }), extra || null) : null, ...filhos);
const corpo = (...f) => el('div', { class: 'corpo' }, ...f);
// Põe filhos num elemento pulando os vazios (o append do navegador escreveria "null" na tela).
const anexar = (pai, ...filhos) => pai.append(...filhos.flat(Infinity).filter(f => f != null && f !== false));
const trocar = (pai, ...filhos) => pai.replaceChildren(...filhos.flat(Infinity).filter(f => f != null && f !== false));
const dados = pares => el('dl', { class: 'dados' }, pares.filter(Boolean).map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v == null || v === '' ? '—' : v })]));
const kpi = (rot, val, varia, extra) => el('div', { class: 'cartao kpi' }, el('div', { class: 'rot', text: rot }), el('div', { class: 'val num', text: val }), varia ? el('div', { class: 'var', text: varia }) : null, extra || null);
const btn = (texto, fn, cls, ic) => el('button', { class: 'btn ' + (cls || 'sec'), type: 'button', onclick: fn }, ic ? icone(ic, 'p') : null, texto);
function barraUso(usadas, franquia) { const p = franquia ? Math.min(100, Math.round(usadas / franquia * 100)) : 0; const b = el('div', { class: 'uso' + (p >= 100 ? ' cheio' : p >= 80 ? ' alto' : ''), role: 'img', 'aria-label': p + '% da franquia' }); const i = el('i'); i.style.width = p + '%'; b.append(i); return b; }
function grafBarras(pontos, rotulo) {
  const max = Math.max(1, ...pontos.map(p => p.v || 0));
  const g = el('div', { class: 'grafico', role: 'img', 'aria-label': rotulo + (pontos.length ? `: de ${fmtNum(pontos[0].v)} (${pontos[0].r}) a ${fmtNum(pontos[pontos.length - 1].v)} (${pontos[pontos.length - 1].r}); máximo ${fmtNum(max)}` : '') });
  for (const p of pontos) { const b = el('i', { title: `${p.r}: ${fmtNum(p.v)}` }); b.style.height = Math.max(2, Math.round((p.v || 0) / max * 100)) + '%'; g.append(b); }
  return el('div', {}, g, pontos.length ? el('div', { class: 'eixo', 'aria-hidden': 'true' }, el('span', { text: pontos[0].r }), el('span', { text: 'máx. ' + fmtNum(max) }), el('span', { text: pontos[pontos.length - 1].r })) : null);
}

// ---------------------------------------------------------------- estado, sessão e chamadas
// A sessão fica na memória e no sessionStorage desta aba (some ao fechar). Nunca no localStorage nem no endereço.
const est = { sessao: '', chaves: {}, niveis: { acoes: {} }, clientes: null, recolhida: false };
try { est.sessao = sessionStorage.getItem('central_sessao') || ''; } catch (e) {}
function guardarSessao(s) { est.sessao = s || ''; try { if (s) sessionStorage.setItem('central_sessao', s); else sessionStorage.removeItem('central_sessao'); } catch (e) {} }
const ua = navigator.userAgent;
const aparelho = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Linux';
const ehApp = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
async function chamar(acao, dados) {
  const cab = { 'Content-Type': 'application/json', 'x-rxsync-origem': ORIGEM, 'x-rxsync-aparelho': aparelho, 'x-rxsync-app': ehApp ? 'sim' : 'nao' };
  if (est.sessao) cab['x-rxsync-sessao'] = est.sessao;
  let r;
  try {
    const resp = await fetch(N8N, { method: 'POST', headers: cab, body: JSON.stringify({ acao, dados: dados || {} }), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
    r = await resp.json();
  } catch (e) { r = { ok: false, mensagem: 'Sem conexão com a Central. Confira a internet e tente de novo.' }; }
  r = r || { ok: false, mensagem: 'Resposta vazia.' };
  if (r.sair && acao !== 'sair' && acao !== 'sair_todos') { guardarSessao(''); entrada(r.mensagem); }
  return r;
}
const ligada = k => est.chaves[k] === 'SIM';
// Teclado aberto no celular: esconde a barra de baixo.
document.addEventListener('focusin', e => { if (e.target.matches('input, select, textarea')) document.body.classList.add('teclado'); });
document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement || !document.activeElement.matches('input, select, textarea')) document.body.classList.remove('teclado'); }, 50));

// ---------------------------------------------------------------- aparência (o único item no localStorage, DEC-068)
function aplicarAparencia(v) { if (v === 'claro' || v === 'escuro') document.documentElement.dataset.tema = v; else delete document.documentElement.dataset.tema; }
let aparencia = 'auto';
try { aparencia = localStorage.getItem('central_aparencia') || 'auto'; } catch (e) {}
aplicarAparencia(aparencia);
function guardarAparencia(v) { aparencia = v; aplicarAparencia(v); try { if (v === 'auto') localStorage.removeItem('central_aparencia'); else localStorage.setItem('central_aparencia', v); } catch (e) {} }

// ---------------------------------------------------------------- mensagem rápida (com "Desfazer")
function rapida(texto, desfazer) {
  const r = $('rapida');
  trocar(r, el('span', { text: texto }), desfazer ? el('button', { type: 'button', text: 'Desfazer', onclick: () => { r.hidden = true; desfazer(); } }) : null,
    el('button', { type: 'button', 'aria-label': 'Fechar', onclick: () => { r.hidden = true; } }, icone('fechar', 'p')));
  r.hidden = false; clearTimeout(rapida.t); rapida.t = setTimeout(() => { r.hidden = true; }, desfazer ? 6000 : 4500);
}

// ---------------------------------------------------------------- janela (folha no celular): foco preso, Esc fecha, foco volta
function janela(conteudo, opcoes) {
  const origem = document.activeElement;
  const camada = $('camada');
  const veu = el('div', { class: 'veu' + (opcoes && opcoes.cheia ? ' cheia' : '') });
  veu.append(conteudo);
  trocar(camada, veu);
  let aberta = true;
  const fechar = () => { if (!aberta) return; aberta = false; trocar(camada); document.removeEventListener('keydown', tecla); if (origem && origem.isConnected) origem.focus(); if (opcoes && opcoes.aoFechar) opcoes.aoFechar(); };
  const tecla = e => {
    if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
    if (e.key !== 'Tab') return;
    const foc = [...conteudo.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(x => !x.disabled && x.offsetParent !== null);
    if (!foc.length) return;
    if (e.shiftKey && document.activeElement === foc[0]) { e.preventDefault(); foc[foc.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === foc[foc.length - 1]) { e.preventDefault(); foc[0].focus(); }
  };
  document.addEventListener('keydown', tecla);
  veu.addEventListener('click', e => { if (e.target === veu) fechar(); });
  setTimeout(() => { const p = conteudo.querySelector('[data-foco], input:not([type=hidden]), select, textarea, button'); if (p) p.focus(); }, 30);
  return fechar;
}
function tabelaAntesDepois(linhas) {
  return el('table', { class: 'ad' }, el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: '' }), el('th', { scope: 'col', text: 'Agora' }), el('th', { scope: 'col', text: 'Depois' }))),
    el('tbody', {}, linhas.map(([r, a, d]) => el('tr', {}, el('th', { scope: 'row', text: r }), el('td', { text: a === '' || a == null ? '(vazio)' : a }), el('td', { class: 'depois', text: d === '' || d == null ? '(vazio)' : d })))));
}
function mostrarSegredo(titulo, valor, texto) {
  const fechar = janela(el('div', { class: 'janela', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo }, el('div', { class: 'alca' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { text: titulo }))),
    el('div', { class: 'corpo' }, el('p', { class: 'mudo', text: texto || 'Aparece só agora. Copie e guarde.' }), el('div', { class: 'segredo', text: valor })),
    el('div', { class: 'pe' }, btn('Já copiei', () => fechar(), 'sec'), btn('Copiar', async () => { try { await navigator.clipboard.writeText(valor); rapida('Copiado.'); } catch (e) { rapida('Não consegui copiar: selecione e copie à mão.'); } }, 'pri'))));
}

// ---------------------------------------------------------------- níveis de confirmação (DEC-066)
// A tabela vem do servidor (config.niveis). Nível 1: só Salvar. Nível 2: antes/depois + Confirmar. Nível 3: + nome da clínica.
function nivelDe(acao, d) {
  d = d || {};
  if (acao === 'editar_limites' && String((d.campos || {}).limitar_franquia || '').toUpperCase() === 'SIM') return 2;
  // Prospecção (sql/031, DEC-078): as mesmas regras de rx_central_nivel. Desligar ou pausar é um toque.
  if (acao === 'ligar_chave') return d.valor !== 'SIM' ? 1 : d.chave === 'prosp_disparo' ? 3 : /^prosp_(busca|ia)$/.test(d.chave) ? 2 : 1;
  if (acao === 'prosp_ligar') return d.valor === 'NAO' ? 1 : d.tipo === 'campanha' ? 3 : 2;
  if (acao === 'prosp_regra_ligar') return d.valor === 'NAO' ? 2 : 1;
  // Públicos (sql/036, DEC-088): tirar um contato é um toque (pôr de volta num público em uso: a página passa o nível 2).
  if (acao === 'prosp_publico_contato_marcar' && d.valor === 'NAO') return 1;
  if (acao === 'cobranca_teste_definir' && !d.cliente_id) return 2;
  if (acao === 'sair_todos') return 2;
  const n = Number((est.niveis.acoes || {})[acao]);
  return n >= 1 && n <= 3 ? n : 2; // ação sem nível conhecido: pede pelo menos o Confirmar
}
// Pede o que a ação precisa (campos, antes/depois, nome da clínica) e devolve os dados prontos para mandar, ou null.
// op: { titulo, texto, linhas, campos: [{k, rot, tipo, valor, opcoes, longo, obrig, minimo, erro, ajuda, min, max, ph}], nome, botao, perigo }
function pedirAcao(acao, d, op) {
  op = op || {};
  const nivel = op.nivel || nivelDe(acao, d); // op.nivel: a página sabe que a camada está ativa (o servidor confere de novo)
  const campos = op.campos || [];
  if (nivel === 1 && !campos.length) return Promise.resolve({ ...d }); // nível 1: o próprio Salvar já é a confirmação
  return new Promise(resolver => {
    const ins = {}; const erro = el('p', { class: 'erro', role: 'alert' });
    const corpoCampos = campos.map(f => {
      let i; const id = 'c-' + f.k;
      if (f.opcoes) i = el('select', { class: 'entrada', id }, f.opcoes.map(([v, t]) => el('option', { value: v, text: t, selected: String(f.valor == null ? '' : f.valor) === v })));
      else if (f.longo) i = el('textarea', { class: 'entrada', id, rows: '3', maxlength: String(f.max || 600), autocomplete: 'off', value: f.valor || '' });
      else i = el('input', { class: 'entrada', id, type: f.tipo || 'text', inputmode: f.inputmode, autocomplete: 'off', spellcheck: 'false', value: f.valor == null ? null : String(f.valor), min: f.min, max: f.max, placeholder: f.ph });
      ins[f.k] = i;
      return el('label', { class: 'campo', for: id }, el('span', { class: 'rot', text: f.rot }), i, f.ajuda ? el('span', { class: 'ajuda', text: f.ajuda }) : null);
    });
    const nomeIn = nivel === 3 ? el('input', { class: 'entrada', id: 'c-nome-clinica', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', 'aria-describedby': 'ajuda-nome' }) : null;
    const confirmar = el('button', { class: 'btn ' + (nivel === 3 || op.perigo ? 'perigo' : 'pri'), type: 'submit', text: op.botao || (nivel === 1 ? 'Salvar' : 'Confirmar') });
    if (nomeIn) { confirmar.disabled = true; nomeIn.addEventListener('input', () => { confirmar.disabled = semAcento(nomeIn.value) !== semAcento(op.nome); }); }
    let fechar;
    const enviar = e => {
      e.preventDefault(); erro.textContent = '';
      const v = { ...d };
      for (const f of campos) {
        v[f.k] = ins[f.k].value.trim();
        if (f.obrig && v[f.k].length < (f.minimo || 1)) { erro.textContent = f.erro || ('Preencha: ' + f.rot + '.'); ins[f.k].focus(); return; }
      }
      if (nomeIn) { if (semAcento(nomeIn.value) !== semAcento(op.nome)) { erro.textContent = 'Digite ' + (op.rotuloNome || 'o nome da clínica') + ' exatamente como aparece.'; nomeIn.focus(); return; } v.confirmacao_nome = nomeIn.value.trim(); }
      if (nivel >= 2) v.confirmacao = 'CONFIRMAR';
      resolver(v); fechar();
    };
    const rotNivel = nivel === 3 ? 'Nível 3 · ' + (op.rotuloNivel || 'irreversível ou dinheiro') : nivel === 2 ? 'Nível 2 · ' + (op.rotuloNivel || 'afeta a clínica') : null;
    const form = el('form', { class: 'janela', role: nivel === 3 ? 'alertdialog' : 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-acao', onsubmit: enviar },
      el('div', { class: 'alca', 'aria-hidden': 'true' }),
      el('div', { class: 'cab' }, rotNivel ? el('span', { class: 'icone-risco' + (nivel === 3 ? ' n3' : '') }, icone(nivel === 3 ? 'alerta' : 'info', 'g')) : null,
        el('div', { class: 'texto' }, rotNivel ? el('span', { class: 'nivel' + (nivel === 3 ? ' n3' : ''), text: rotNivel }) : null, el('h2', { id: 'tit-acao', text: op.titulo || 'Confirmar' })),
        el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => { fechar(); resolver(null); } }, icone('fechar'))),
      el('div', { class: 'corpo' }, op.texto ? el('p', { class: 'mudo', text: op.texto }) : null, op.linhas && op.linhas.length ? tabelaAntesDepois(op.linhas) : null, corpoCampos,
        nomeIn ? el('label', { class: 'campo', for: 'c-nome-clinica' }, el('span', { class: 'rot' }, 'Para confirmar, digite ' + (op.rotuloNome || 'o nome da clínica') + ': ', el('b', { text: op.nome })), nomeIn,
          el('span', { class: 'ajuda', id: 'ajuda-nome', text: 'Sem diferença de maiúsculas e acentos.' })) : null, erro),
      el('div', { class: 'pe' }, el('button', { class: 'btn sec', type: 'button', text: 'Cancelar', onclick: () => { fechar(); resolver(null); } }), confirmar));
    fechar = janela(form, { aoFechar: () => resolver(null) });
  });
}
// Manda a ação já confirmada. Mostra o resultado numa mensagem rápida (com "Desfazer" quando dá) e redesenha a tela.
async function fazer(acao, d, op) {
  const v = await pedirAcao(acao, d, op);
  if (!v) return null;
  const r = await chamar(acao, op && op.preparar ? op.preparar(v) : v);
  if (r.desligada) { rapida('Esta edição está desligada em Ajustes da Central (' + (r.chave || '') + ').'); return null; }
  // O servidor pediu um nível maior (ex.: a camada ficou ativa noutro aparelho): pergunta de novo, uma vez.
  if (!r.ok && r.nivel > (op && op.nivel || nivelDe(acao, d)) && !(op && op.repetido)) return fazer(acao, d, { ...op, nivel: r.nivel, repetido: true });
  if (!r.ok) { if (op && op.erro) op.erro(r); else rapida(r.mensagem || 'Não consegui.'); return null; }
  if (op && op.depois) op.depois(r); else await rotear();
  const texto = r.aviso_email || r.mensagem || (op && op.ok) || 'Pronto.';
  if (op && op.silencioso) return r; // a própria tela já mostra o resultado (ex.: o QR)
  rapida(texto, r.pode_desfazer && r.registro_id ? () => desfazer(r.registro_id) : null);
  return r;
}
async function desfazer(registroId) {
  await fazer('desfazer', { registro_id: registroId }, { titulo: 'Desfazer a edição', texto: 'Volta ao valor de antes. Fica no registro e avisa no Telegram.', ok: 'Desfeito.' });
}
