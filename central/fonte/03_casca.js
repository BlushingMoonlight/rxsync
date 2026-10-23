// ---------------------------------------------------------------- casca: seções, menu, caminho, busca e rotas (DEC-068)
ICONES.atualizar = 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v5h-5';
const SECOES = [
  { id: 'hoje', nome: 'Hoje', ic: 'hoje', grupo: 'Operação', aba: 1 },
  { id: 'clientes', nome: 'Clientes', ic: 'clientes', grupo: 'Operação', aba: 1 },
  { id: 'financeiro', nome: 'Financeiro', ic: 'financeiro', grupo: 'Operação', aba: 1, chave: 'tela_dinheiro' },
  { id: 'sistema', nome: 'Saúde do sistema', curto: 'Sistema', ic: 'sistema', grupo: 'Operação', aba: 1, chave: 'tela_sistema' },
  { id: 'crescimento', nome: 'Crescimento', ic: 'crescimento', grupo: 'Análise', chave: 'tela_funil', desc: 'Funil, mini testes e pedidos de demonstração' },
  { id: 'metricas', nome: 'Métricas', ic: 'metricas', grupo: 'Análise', chave: 'tela_metricas', desc: 'MRR, ticket médio, conversão e custo de IA' },
  { id: 'uso', nome: 'Uso e limites', ic: 'uso', grupo: 'Análise', chave: 'tela_uso', desc: 'Mensagens × franquia por clínica' },
  { id: 'avisos', nome: 'Avisos', ic: 'avisos', grupo: 'Análise', chave: 'tela_avisos', desc: 'O que passou pelo Telegram, sem o texto' },
  { id: 'agregados', nome: 'Agregados de pacientes', ic: 'agregados', grupo: 'Análise', chave: 'tela_agregados_pacientes', escondeDesligada: true, desc: 'Contagens e médias por clínica' },
  { id: 'prospeccao', nome: 'Prospecção', ic: 'prospeccao', grupo: 'Marketing', chave: 'tela_prospeccao', desc: 'Campanhas, números de WhatsApp, leads e relatórios' },
  { id: 'demonstracoes', nome: 'Demonstrações', ic: 'demonstracao', grupo: 'Marketing', chave: 'tela_demonstracoes', desc: 'Links de demonstração por clínica e o que cada médico viu' },
  { id: 'seguranca', nome: 'Segurança', ic: 'seguranca', grupo: 'Administração', chave: 'tela_sessoes', desc: 'Aparelhos conectados e registro de 12 meses' },
  { id: 'api', nome: 'API (Enterprise)', ic: 'api', grupo: 'Administração', chave: 'tela_chaves_api', desc: 'Chaves e limites por clínica' },
  { id: 'ajustes', nome: 'Ajustes da Central', ic: 'ajustes', grupo: 'Administração', desc: 'Liga e desliga telas e edições, aparência' }
];
const visivel = s => !(s.escondeDesligada && !ligada(s.chave));
const TELAS = {};
est.contadores = {};
function ir(rota) { if (location.hash === '#' + rota) rotear(); else location.hash = rota; }
function secaoAtiva() { const a = (location.hash || '#hoje').slice(1).split('/')[0]; return a === 'mais' ? 'mais' : (SECOES.find(s => s.id === a) || { id: 'hoje' }).id; }
function montarNav() {
  const ativa = secaoAtiva(); const naAba = SECOES.some(s => s.aba && s.id === ativa);
  const cont = id => est.contadores[id] ? el('span', { class: 'contador', text: est.contadores[id], 'aria-label': est.contadores[id] + ' pendências' }) : null;
  const lat = $('lateral');
  trocar(lat, el('div', { class: 'cab' }, el('div', { class: 'marca', text: 'RX' }), el('div', { class: 'nome' }, 'Central RXSync', el('small', { text: 'Administração' })),
    el('button', { class: 'btn-ic', type: 'button', 'aria-label': est.recolhida ? 'Abrir o menu' : 'Recolher o menu', 'aria-expanded': String(!est.recolhida), onclick: () => { est.recolhida = !est.recolhida; $('app').classList.toggle('recolhida', est.recolhida); montarNav(); } }, icone(est.recolhida ? 'expandir' : 'recolher'))));
  let grupo = '';
  for (const s of SECOES.filter(visivel)) {
    if (s.grupo !== grupo) { grupo = s.grupo; lat.append(el('div', { class: 'grupo-nav', text: grupo })); }
    lat.append(el('button', { class: 'item-nav', type: 'button', 'aria-current': ativa === s.id ? 'page' : null, title: est.recolhida ? s.nome : null, 'aria-label': est.recolhida ? s.nome : null, onclick: () => ir(s.id) },
      icone(s.ic), el('span', { class: 'rotulo', text: s.nome }), cont(s.id)));
  }
  lat.append(el('div', { class: 'rodape' }, el('button', { class: 'item-nav', type: 'button', 'aria-label': est.recolhida ? 'Sair' : null, onclick: sair }, icone('sair'), el('span', { class: 'rotulo', text: 'Sair' }))));
  const principais = SECOES.filter(s => s.aba);
  trocar($('trilho'), el('div', { class: 'marca', text: 'RX', 'aria-hidden': 'true' }),
    ...principais.map(s => el('button', { type: 'button', 'aria-current': ativa === s.id ? 'page' : null, onclick: () => ir(s.id) }, icone(s.ic, 'g'), s.curto || s.nome, cont(s.id))),
    el('button', { type: 'button', 'aria-current': !naAba ? 'page' : null, onclick: () => ir('mais') }, icone('mais', 'g'), 'Mais'), el('div', { class: 'espaco' }),
    el('button', { type: 'button', onclick: sair }, icone('sair', 'g'), 'Sair'));
  trocar($('barra'), ...principais.map(s => el('button', { type: 'button', 'aria-current': ativa === s.id ? 'page' : null, onclick: () => ir(s.id) },
    el('span', { class: 'pilula' }, icone(s.ic)), s.curto || s.nome, cont(s.id))),
    el('button', { type: 'button', 'aria-current': !naAba ? 'page' : null, onclick: () => ir('mais') }, el('span', { class: 'pilula' }, icone('mais')), 'Mais'));
}
// Barra de cima: no celular, voltar + título; no iPad e no computador, o caminho e a busca.
function topo(titulo, caminho, voltar) {
  document.title = titulo + ' · Central RXSync';
  trocar($('topo'), 
    voltar ? el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Voltar', onclick: () => ir(voltar) }, icone('voltar')) : el('div', { class: 'marca marca-topo', text: 'RX', 'aria-hidden': 'true' }),
    el('div', { class: 'titulo', text: titulo }),
    el('nav', { class: 'migalhas', 'aria-label': 'Onde estou' }, el('ol', {}, caminho.map(([nome, rota], i) => el('li', {}, i ? icone('seta', 'p') : null,
      rota ? el('a', { href: '#' + rota, text: nome }) : el('span', { 'aria-current': 'page', text: nome }))))),
    el('button', { class: 'busca-campo', type: 'button', onclick: abrirBusca }, icone('busca', 'p'), 'Buscar clínica, código ou tela', el('kbd', { text: '⌘K' })),
    el('button', { class: 'btn-ic btn-busca', type: 'button', 'aria-label': 'Buscar clínica ou tela', onclick: abrirBusca }, icone('busca')),
    // IA da Central (DEC-145): o assistente ao lado, só com a chave tela_assistente ligada.
    ligada('tela_assistente') ? el('button', { class: 'btn-ic', id: 'btn-assistente', type: 'button', 'aria-label': 'Assistente', title: 'Assistente', 'aria-expanded': String(ia.aberto), 'aria-controls': 'assistente', onclick: alternarAssistente }, icone('assistente')) : null,
    el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Atualizar', title: 'Atualizar', onclick: () => { est.clientes = null; rotear(); } }, icone('atualizar')));
}
async function rotear() {
  if (!est.sessao) return;
  const [nome, ...resto] = (location.hash || '#hoje').slice(1).split('/').map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  const t = TELAS[nome] ? nome : 'hoje';
  montarNav();
  trocar($('camada'));
  const c = $('conteudo'); trocar(c, esqueleto());
  try { await TELAS[t](c, resto); } catch (e) { trocar(c, el('div', { class: 'aviso perigo', role: 'alert' }, icone('alerta'), el('div', {}, el('b', { text: 'Algo deu errado nesta tela. ' }), 'Toque em Atualizar para tentar de novo.'))); }
  c.focus({ preventScroll: true });
}
// Tela desligada ou com erro: mostra o motivo e o caminho para resolver.
function falhou(c, r, titulo) {
  if (r.desligada) { trocar(c, cabecalho(titulo || 'Tela desligada'), cartao(null, null, vazio('Esta tela está desligada (chave ' + (r.chave || '') + ').', 'ajustes'), el('div', { class: 'corpo acoes' }, btn('Abrir Ajustes da Central', () => ir('ajustes'), 'pri')))); return true; }
  if (!r.ok) { trocar(c, cabecalho(titulo || 'Não consegui carregar'), el('div', { class: 'aviso perigo', role: 'alert' }, icone('alerta'), el('div', { text: r.mensagem || 'Não consegui carregar.' })), el('div', { class: 'acoes mt' }, btn('Tentar de novo', () => rotear(), 'pri'))); return true; }
  return false;
}
const cabecalho = (titulo, sobre, ...acoes) => el('div', { class: 'cabecalho' }, el('div', { class: 'texto' }, sobre ? el('p', { class: 'sobretitulo', text: sobre }) : null, el('h1', { text: titulo })), acoes.length ? el('div', { class: 'acoes' }, acoes) : null);
window.addEventListener('hashchange', rotear);
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && est.sessao && !$('app').hidden) { e.preventDefault(); abrirBusca(); } });
// Ao voltar para a Central (iPad acordou), confere se a sessão ainda vale e atualiza as chaves.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && est.sessao && !$('app').hidden) carregarConfig(); });

// ---------------------------------------------------------------- busca global (clínicas e telas)
async function listaClientes() {
  if (est.clientes) return est.clientes;
  if (!ligada('tela_clientes')) return [];
  const r = await chamar('clientes');
  est.clientes = r.ok ? r.dados.clientes : [];
  return est.clientes;
}
function abrirBusca() {
  const inp = el('input', { type: 'search', placeholder: 'Clínica, código (CLI-…) ou tela', 'aria-label': 'Buscar', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'go', 'aria-controls': 'busca-res' });
  const res = el('div', { class: 'resultados', id: 'busca-res', role: 'listbox', 'aria-label': 'Resultados' });
  let itens = [], sel = 0, fechar;
  const telas = [...SECOES.filter(visivel).map(s => ({ nome: s.nome, desc: s.desc || '', rota: s.id, ic: s.ic })),
    { nome: 'Registro', desc: 'Entradas e edições (12 meses)', rota: 'seguranca/registro', ic: 'seguranca' }];
  const desenhar = clientes => {
    const q = semAcento(inp.value);
    const cl = (clientes || []).filter(x => !q || semAcento(x.nome + ' ' + x.cliente_id).includes(q)).slice(0, 8);
    const tl = telas.filter(t => q && semAcento(t.nome + ' ' + t.desc).includes(q)).slice(0, 5);
    itens = [...cl.map(x => ({ rota: 'clientes/' + encodeURIComponent(x.cliente_id), no: el('button', { class: 'linha cli', type: 'button', role: 'option', tabindex: '-1' },
      el('span', { class: 'avatar ' + tomStatus(x.status), text: iniciais(x.nome), 'aria-hidden': 'true' }), el('div', { class: 'cresce' }, el('div', { class: 't1', text: x.nome }), el('div', { class: 't2', text: x.cliente_id + ' · ' + (x.plano || '—') })), etq(x.status || '—', tomStatus(x.status))) })),
      ...tl.map(t => ({ rota: t.rota, no: el('button', { class: 'linha', type: 'button', role: 'option', tabindex: '-1' }, el('span', { class: 'icone-caixa' }, icone(t.ic)), el('div', { class: 'cresce' }, el('div', { class: 't1', text: t.nome }), el('div', { class: 't2', text: t.desc }))) }))];
    sel = 0;
    trocar(res, cl.length ? el('p', { class: 'menu-grupo', text: 'Clínicas' }) : null, ...itens.slice(0, cl.length).map(i => i.no),
      tl.length ? el('p', { class: 'menu-grupo', text: 'Telas' }) : null, ...itens.slice(cl.length).map(i => i.no),
      itens.length ? null : vazio(q ? 'Nada encontrado para "' + inp.value.trim() + '".' : 'Digite o nome ou o código da clínica.', 'busca'));
    itens.forEach((it, k) => { it.no.onclick = () => { fechar(); ir(it.rota); }; it.no.setAttribute('aria-selected', String(k === sel)); });
  };
  inp.addEventListener('keydown', e => {
    if (!itens.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : itens.length - 1)) % itens.length; itens.forEach((it, k) => it.no.setAttribute('aria-selected', String(k === sel))); itens[sel].no.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter') { e.preventDefault(); fechar(); ir(itens[sel].rota); }
  });
  fechar = janela(el('div', { class: 'paleta', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Buscar' },
    el('div', { class: 'busca' }, icone('busca'), inp, el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))), res), { cheia: true });
  inp.dataset.foco = '1';
  desenhar(est.clientes);
  listaClientes().then(l => { inp.oninput = () => desenhar(l); desenhar(l); });
}
// Situação da clínica: tom da etiqueta (cor + ponto + palavra, nunca só cor).
const tomStatus = s => { const t = String(s || ''); return /^(Ativo|Pago)$/.test(t) ? 'ok' : /Em teste/.test(t) ? 'info' : /Suspenso|Cancelado|apagados|encerrado/i.test(t) ? 'perigo' : 'atencao'; };
