// Painel da clínica (rxsync-sistema DEC-156). Contrato com o servidor: rxsync-sistema docs/mapa/painel.md e painel-novo.md
// (seção 12). Tudo o que vem do servidor entra na página como TEXTO (textContent), nunca como HTML.
const BASE = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const EP = { e24: BASE + 'autoedicao', e29: BASE + 'painel-entrada', e13: BASE + 'assistente-dono', e12: BASE + 'integracao-agenda', e23: BASE + 'conectar', e32: BASE + 'pagamento-clinica' };
const ORIGEM = 'rxsync-site-2026';
const VERSAO_TERMOS = '2026-10-v7';

// A página não abre dentro de outra.
if (window.top !== window.self) { document.body.textContent = 'O painel não abre dentro de outra página.'; throw new Error('moldura'); }

// ---------------------------------------------------------------- utilidades
const $ = id => document.getElementById(id);
function el(tag, props, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = String(v);
    else if (k === 'value') e.value = String(v);
    else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') e[k] = !!v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  anexar(e, filhos);
  return e;
}
const anexar = (pai, ...filhos) => { pai.append(...filhos.flat(Infinity).filter(f => f != null && f !== false).map(f => f instanceof Node ? f : document.createTextNode(String(f)))); return pai; };
const trocar = (pai, ...filhos) => { pai.replaceChildren(); return anexar(pai, ...filhos); };
// Ícones (Lucide, traço 1,75), desenhados aqui: nada de fora.
const ICONES = {
  hoje: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  agenda: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  pacientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  assistente: 'M12 8V4H8M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM2 14h2M20 14h2M15 13v2M9 13v2',
  conta: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  busca: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3', chat: 'M7.9 20A9 9 0 1 0 4 16.1L2 22z',
  seta: 'M9 6l6 6-6 6', voltar: 'M15 6l-6 6 6 6', fechar: 'M18 6 6 18M6 6l12 12', mais: 'M5 12h.01M12 12h.01M19 12h.01', soma: 'M12 5v14M5 12h14',
  ok: 'M20 6 9 17l-5-5', alerta: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 16v-4M12 8h.01', relogio: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',
  cadeado: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', baixar: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  zap: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  cartao: 'M2 5h20v14H2zM2 10h20', equipe: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87',
  brilho: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M17 5h4', escudo: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  documento: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5zM14 2v6h6M16 13H8M16 17H8', sair: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  grafico: 'M3 3v18h18M8 17v-6M13 17V7M18 17v-4', pausa: 'M10 4H6v16h4zM18 4h-4v16h4z', play: 'M6 3l14 9-14 9z', frasco: 'M10 2v7.3L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.3V2M8.5 2h7M7 16h10',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7', bloquear: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M4.9 4.9l14.2 14.2',
  sino: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0', clinica: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M10 9h4M12 7v4',
  etiqueta: 'M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l8.6-8.6a1 1 0 0 0 0-1.4zM7 7h.01', proibido: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M4.9 4.9l14.2 14.2',
  notas: 'M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5zM15 3v6h6', ajustes: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  importar: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', duplicados: 'M8 8h12v12H8zM4 16V4h12', medico: 'M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3M20 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  pergunta: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', dinheiro: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3', lua: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'
};
function icone(n, tam) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'icone' + (tam ? ' ' + tam : '')); s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.75'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', ICONES[n] || ''); s.append(p); return s;
}
const btn = (texto, fn, cls, ic, extra) => el('button', { class: 'btn ' + (cls || 'sec'), type: 'button', onclick: fn, ...(extra || {}) }, ic ? icone(ic, 'p') : null, texto);
const etq = (t, tom, ic) => el('span', { class: 'etq ' + (tom || '') }, ic ? icone(ic, 'p') : null, t);
const aviso = (tom, texto, ...extra) => el('div', { class: 'aviso ' + (tom || ''), role: tom === 'perigo' ? 'alert' : null }, icone(tom === 'ok' ? 'ok' : tom === 'perigo' || tom === 'atencao' ? 'alerta' : 'info'), el('div', { class: 'tx' }, texto, extra));
const vazio = (titulo, texto, acao) => el('div', { class: 'vazio' }, titulo ? el('strong', { text: titulo }) : null, texto || null, acao || null);
const esqueleto = () => el('div', { 'aria-busy': 'true', 'aria-label': 'Carregando' }, el('span', { class: 'esq' }), el('span', { class: 'esq l2' }), el('span', { class: 'esq l3' }));
const linhaLink = (titulo, sub, rota, ic, valor) => el('button', { class: 'linha', type: 'button', 'data-ir': rota }, ic ? el('span', { class: 'ic' }, icone(ic)) : null,
  el('span', { class: 'tx' }, el('span', { class: 't1', text: titulo }), sub ? el('span', { class: 't2', text: sub }) : null), valor != null ? el('span', { class: 'valor', text: valor }) : null, el('span', { class: 'seta' }, icone('seta')));
const fmtNum = v => v == null ? '—' : Number(v).toLocaleString('pt-BR');
const semAcento = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
// Larguras e posições calculadas vão pelo CSSOM (element.style), que a regra de segurança permite; nunca por style= no HTML.
const largura = (n, pct) => { n.style.width = Math.max(0, Math.min(100, pct)) + '%'; return n; };
function cresce(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 420) + 'px'; }
function zap(tel) { let n = String(tel || '').replace(/\D/g, ''); if (n.length <= 11) n = '55' + n; return 'https://wa.me/' + n; }
function baixarArquivo(conteudo, tipo, nome) {
  const a = el('a', { href: URL.createObjectURL(new Blob([conteudo], { type: tipo })), download: nome });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 30000);
}

// ---------------------------------------------------------------- sessão e chamadas ao servidor (DEC-097)
// No navegador, só a sessão ('painel_sessao', na aba) e a lembrança do aparelho ('painel_lembranca'). Nada mais.
const params = new URLSearchParams(location.search);
let token = params.get('t') || '';
function sessaoLer() { try { return sessionStorage.getItem('painel_sessao') || ''; } catch (e) { return ''; } }
function sessaoGuardar(v) { try { if (v) sessionStorage.setItem('painel_sessao', v); else sessionStorage.removeItem('painel_sessao'); } catch (e) {} }
function lembrancaLer() { try { return localStorage.getItem('painel_lembranca') || ''; } catch (e) { return ''; } }
function lembrancaGuardar(v) { try { if (v && /^[0-9a-f]{64}$/.test(v)) localStorage.setItem('painel_lembranca', v); else localStorage.removeItem('painel_lembranca'); } catch (e) {} }
let sessao = sessaoLer();
if (!/^[0-9a-f]{64}$/.test(sessao)) sessao = '';
if (sessao && token) { token = ''; try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
const ua = navigator.userAgent;
const APARELHO = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Linux';
const EH_APP = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
// Todo pedido leva a origem e, com a sessão, o cabeçalho x-rxsync-painel.
function cab(extra) {
  const h = { 'Content-Type': 'application/json', 'x-rxsync-origem': ORIGEM, ...(extra || {}) };
  if (sessao) h['x-rxsync-painel'] = sessao;
  return h;
}
const CONEXAO = { caiu: false };
let saindo = false;
// Um pedido ao n8n. Resposta com "entrar": a sessão venceu ou o link antigo parou: volta para a entrada.
async function pedir(url, corpo, extraCab) {
  let r;
  try {
    const resp = await fetch(url, { method: 'POST', headers: cab(extraCab), body: JSON.stringify(corpo), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
    r = await resp.json();
    if (CONEXAO.caiu) { CONEXAO.caiu = false; faixasAtualizar(); }
  } catch (e) {
    CONEXAO.caiu = true; faixasAtualizar();
    throw e;
  }
  if (r && r.entrar === true && url !== EP.e29 && !saindo) {
    saindo = true; sessaoGuardar('');
    try { history.replaceState(null, '', location.pathname + (token ? '#link' : '#venceu')); } catch (e) {}
    location.reload();
  }
  return r || {};
}
const c24 = (acao, dados) => pedir(EP.e24, { acao, token, dados: dados || {} });
// As ações da agenda e dos pacientes respondem { ok, data }: d24 devolve o data (ou falha).
const d24 = (acao, dados) => c24(acao, dados).then(r => { if (!r.ok) throw new Error('servidor'); return r.data; });
const p24 = (acao, dados) => c24(acao, dados).then(r => { if (!r || !r.ok || !r.data) throw new Error('servidor'); return r.data; });
const c29 = (acao, dados) => pedir(EP.e29, { acao, dados: dados || {} }, { 'x-rxsync-aparelho': APARELHO, 'x-rxsync-app': EH_APP ? 'sim' : 'nao' })
  .catch(() => ({ ok: false, mensagem: 'Sem conexão. Confira a internet e tente de novo.' }));
const c12 = (acao, dados) => pedir(EP.e12, { acao, token, dados: dados || {} });
const c32 = (acao, dados) => pedir(EP.e32, { acao, token, dados: dados || {} });
const c23 = (acao, extra) => pedir(EP.e23, { token, acao, ...(extra || {}) });
const c13 = (mensagem, historico) => pedir(EP.e13, { token, mensagem, historico });

// ---------------------------------------------------------------- mensagem rápida (6 s com "Desfazer"; senão 4 s)
function rapida(texto, op) {
  op = op || {};
  const r = $('toast');
  trocar(r, el('span', { text: texto }), op.desfazer ? el('button', { type: 'button', text: 'Desfazer', onclick: () => { r.hidden = true; op.desfazer(); } }) : null,
    el('button', { type: 'button', 'aria-label': 'Fechar', class: 'btn-ic', onclick: () => { r.hidden = true; } }, icone('fechar', 'p')));
  r.hidden = false; clearTimeout(rapida.t);
  rapida.t = setTimeout(() => { r.hidden = true; }, op.ms || (op.desfazer ? 6000 : 4500));
}

// ---------------------------------------------------------------- janela (folha no celular): foco preso, Esc fecha, foco volta
const JANELAS = [];
function janela(conteudo, op) {
  op = op || {};
  const origem = document.activeElement, camada = $('camada');
  const veu = el('div', { class: 'veu' }, conteudo);
  camada.append(veu);
  let aberta = true;
  const fechar = () => {
    if (!aberta) return; aberta = false; veu.remove(); document.removeEventListener('keydown', tecla, true);
    const i = JANELAS.indexOf(fechar); if (i >= 0) JANELAS.splice(i, 1);
    if (origem && origem.isConnected) origem.focus(); if (op.aoFechar) op.aoFechar();
  };
  const tecla = e => {
    if (veu !== camada.lastElementChild) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (op.pedirFechar) op.pedirFechar(); else fechar(); return; }
    if (e.key !== 'Tab') return;
    const foc = [...conteudo.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(x => !x.disabled && x.offsetParent !== null);
    if (!foc.length) return;
    if (e.shiftKey && document.activeElement === foc[0]) { e.preventDefault(); foc[foc.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === foc[foc.length - 1]) { e.preventDefault(); foc[0].focus(); }
  };
  document.addEventListener('keydown', tecla, true);
  JANELAS.push(fechar);
  veu.addEventListener('click', e => { if (e.target === veu) { if (op.pedirFechar) op.pedirFechar(); else fechar(); } });
  // o cursor vai já para o primeiro campo (ou para o "Cancelar"), e nunca sai de um campo que a pessoa já começou a usar
  if (!conteudo.contains(document.activeElement)) { const p = conteudo.querySelector(op.foco || '[data-foco], input:not([type=hidden]):not([type=checkbox]), select, textarea, .pe button'); if (p) p.focus(); }
  return fechar;
}
// Folha (molde H): Cancelar e título no topo, os campos, o botão de confirmar. Fechar com mudança pergunta "Descartar?".
function folha(titulo, corpo, op) {
  op = op || {};
  let sujo = false, fechar;
  const pedirFechar = async () => { if (sujo && !(await confirmar({ titulo: 'Descartar as mudanças?', texto: 'O que você escreveu nesta folha não foi salvo.', botao: 'Descartar', nivel: 2 }))) return; fechar(); };
  const pe = op.pe ? el('div', { class: 'pe' }, op.pe) : null;
  const j = el('div', { class: 'janela' + (op.larga ? ' larga' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo, id: op.id || null },
    el('div', { class: 'cab' }, el('h2', { text: titulo }), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: pedirFechar }, icone('fechar'))),
    el('div', { class: 'corpo' }, corpo), pe);
  j.addEventListener('input', () => { sujo = true; });
  fechar = janela(j, { pedirFechar, aoFechar: op.aoFechar, foco: op.foco });
  return { fechar, elemento: j, limpar: () => { sujo = false; } };
}
// Confirmação pelos níveis da Central (DEC-066). Nível 2: diz o que vai acontecer e tem o "Cancelar" com o foco.
// Nível 3: digitar a frase. Devolve true/false. "Confirmar" nunca fica no lugar do botão que abriu nem vem marcado.
function confirmar(op) {
  return new Promise(resolver => {
    let feito = false, fechar;
    const fim = v => { if (feito) return; feito = true; fechar(); resolver(v); };
    const frase = op.frase ? el('input', { class: 'entrada', id: 'confFrase', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false' }) : null;
    const ok = el('button', { class: 'btn ' + (op.perigo ? 'perigo' : 'pri'), type: 'button', text: op.botao || 'Confirmar', id: 'confOk', onclick: () => fim(true) });
    const norm = s => semAcento(s).replace(/[.!?]+$/, '');
    if (frase) { ok.disabled = true; frase.addEventListener('input', () => { ok.disabled = norm(frase.value) !== norm(op.frase); }); }
    const nivel = op.nivel || 2;
    const j = el('div', { class: 'janela', role: nivel >= 3 ? 'alertdialog' : 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'confTit', id: 'confJanela' },
      el('div', { class: 'cab' }, el('h2', { id: 'confTit', text: op.titulo || 'Confirmar' })),
      el('div', { class: 'corpo' }, (Array.isArray(op.texto) ? op.texto : [op.texto]).filter(Boolean).map(t => el('p', { class: 'mudo', text: t })),
        frase ? el('label', { class: 'campo', for: 'confFrase' }, el('span', { class: 'rot' }, 'Para confirmar, digite: ', el('b', { text: op.frase })), frase) : null),
      el('div', { class: 'pe' }, el('button', { class: 'btn sec', type: 'button', text: 'Cancelar', 'data-foco': frase ? null : '', onclick: () => fim(false) }), ok));
    fechar = janela(j, { aoFechar: () => { if (!feito) { feito = true; resolver(false); } }, foco: frase ? '#confFrase' : '[data-foco]' });
  });
}

// ---------------------------------------------------------------- fuso da clínica (padrão Brasília); datas "locais" lidas com getUTC*
let TZ = 'America/Sao_Paulo';
function partesTz(ms) {
  const o = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(ms)).forEach(p => { o[p.type] = p.value; });
  if (o.hour === '24') o.hour = '00';
  return o;
}
function fake(ms) { const p = partesTz(ms); return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)); }
function offsetMin(ms) { return Math.round((fake(ms).getTime() - Math.floor(ms / 1000) * 1000) / 60000); }
function offStr(min) { const sg = min < 0 ? '-' : '+', a = Math.abs(min), h = Math.floor(a / 60), m = a % 60; return sg + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
// "AAAA-MM-DDTHH:MM" (hora da clínica) → ISO 8601 com o deslocamento certo
function isoLocal(v) {
  const p = v.split(/[-T:]/).map(Number), t0 = Date.UTC(p[0], p[1] - 1, p[2], p[3] || 0, p[4] || 0);
  let off = offsetMin(t0); const off2 = offsetMin(t0 - off * 60000); if (off2 !== off) off = off2;
  return v + ':00' + offStr(off);
}
const paraInput = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 16).replace(' ', 'T');
const fmt = iso => new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtDia = iso => iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const fmtQuando = iso => new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
function hojeLocal() { const d = fake(Date.now()); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
const chave = d => d.toISOString().slice(0, 10);
const somaDias = (d, n) => new Date(d.getTime() + n * 86400000);
const iniSemana = d => somaDias(d, -((d.getUTCDay() + 6) % 7));
function minDia(iso) { const d = fake(new Date(iso).getTime()); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
const chaveIso = iso => chave(fake(new Date(iso).getTime()));
const hm = v => { const p = String(v).split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const fmtD = (d, o) => d.toLocaleDateString('pt-BR', { ...o, timeZone: 'UTC' });
