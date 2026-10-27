// ---------------------------------------------------------------- Agenda (molde B; o calendário é uma variante da Lista)
// Uma fileira de controles antes da lista; "+ Nova consulta" fixo embaixo no celular; o raro no ⋯ (Bloquear horário,
// Exportar, Canceladas). A consulta abre numa folha (celular) ou ao lado da lista (iPad deitado e computador).
const AG = { dados: [], carregou: false, filtro: 'novos', naoPagas: null, visao: window.innerWidth < 768 ? 'dia' : 'semana', cal: [], calReq: 0, aberta: null };
const MED = { dados: [], modo: false, reservio: false, padrao: { agendamento: true }, filtro: '' };   // agenda por médico (modo_medicos vem do servidor)
const GRADE = { dados: [] };
let calRef = hojeLocal();
const agAtiva = a => a.status !== 'cancelado';
const ehBloqueio = a => String(a.servico || '').trim().toUpperCase() === 'BLOQUEIO';
const medFiltra = a => !MED.modo || !MED.filtro || !a.medico_id || String(a.medico_id) === MED.filtro;
function medNome(id) { const m = MED.dados.find(x => String(x.id) === String(id)); return m ? m.nome + (m.ativo ? '' : ' (removido)') : ''; }
function agGrupos(lista) {
  const agora = Date.now(), g = { novos: [], proximos: [], passados: [], cancelados: [] };
  (lista || AG.dados).forEach(a => {
    if (a.status === 'cancelado') { g.cancelados.push(a); return; }
    if (!a.visto && !ehBloqueio(a)) g.novos.push(a);
    if (new Date(a.fim).getTime() >= agora) g.proximos.push(a); else g.passados.push(a);
  });
  g.passados.reverse(); g.cancelados.reverse();
  return g;
}
function agCarregar() {
  return d24('agenda_listar').then(rows => {
    AG.dados = rows || []; AG.carregou = true;
    if (!agGrupos().novos.length && AG.filtro === 'novos') AG.filtro = 'proximos';
    agSelo(); agRender(); hojeRender();
    if (AG.visao !== 'lista' && !(AG.visao === 'dia' && estreito())) calCarregar();
  }).catch(() => { AG.carregou = true; const l = $('agLista'); if (l) trocar(l, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'A agenda não carregou agora.', btn('Tentar de novo', agCarregar, 'sec')))); });
}
function agSelo() { const n = agGrupos().novos.length; document.querySelectorAll('[data-selo-agenda]').forEach(x => { x.textContent = n > 99 ? '99+' : String(n); x.hidden = !n; }); }
const estreito = () => window.innerWidth < 768;
function agNaoPagasCarregar() {
  return d24('agenda_listar', { nao_pagas: true }).then(rows => { AG.naoPagas = rows || []; agRender(); })
    .catch(() => { AG.naoPagas = []; agRender(); rapida('Não consegui carregar as consultas não pagas.'); });
}
const agPagoTxt = a => a.pago_origem === 'remarcada' ? 'Paga (remarcada)' : a.pago_origem === 'asaas' ? 'Paga (Asaas)' : 'Paga';
const podePagar = a => !ehBloqueio(a) && (agAtiva(a) || a.pago_em);
// Link de pagamento pedido pela equipe (DEC-099): com o "Mandar o link" ligado e médico que não recebe no consultório.
function medPagaConsultorio(id) {
  const m = MED.dados.find(x => String(x.id) === String(id || ''));
  if (!MED.modo || !m) return false;
  return !!(Object.prototype.hasOwnProperty.call(m.funcoes || {}, 'paga_consultorio') ? m.funcoes.paga_consultorio : MED.padrao.paga_consultorio);
}
const podeLink = (medicoId, servico) => ligado('func_pagamento_link') && String(servico || '').trim().toUpperCase() !== 'BLOQUEIO' && !medPagaConsultorio(medicoId);

tela('agenda', {
  montar: () => [cabTela('Agenda', { acao: acaoPrincipal('Nova consulta', () => consultaNova(), 'soma', 'agNovo'), mais: { id: 'agMais', lista: [
    ['Bloquear horário', 'bloquear', () => bloquearForm()], ['Exportar para Google Agenda, Outlook ou iPhone', 'baixar', () => agExportar()],
    ['Ver as canceladas', 'proibido', () => { AG.visao = 'lista'; AG.filtro = 'cancelados'; agMostrar(); }]] } }),
    agAbas(''),
    // No celular, uma fileira só (molde B): a visão num seletor e, na Lista, o filtro num botão que abre uma folha.
    el('div', { class: 'controles' },
      el('select', { class: 'entrada so-cel', id: 'calVisao', 'aria-label': 'Visão', onchange: e => { AG.visao = e.target.value; agMostrar(); } },
        [['lista', 'Lista'], ['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']].map(([v, t]) => el('option', { value: v, text: t }))),
      el('button', { class: 'btn sec so-cel', type: 'button', id: 'agFiltroBtn', 'aria-haspopup': 'dialog', onclick: () => agFiltroFolha() }),
      el('div', { class: 'seg', role: 'group', 'aria-label': 'Visão', id: 'calViews' }, [['lista', 'Lista'], ['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']].map(([v, t]) =>
        el('button', { type: 'button', 'data-v': v, text: t, onclick: () => { AG.visao = v; agMostrar(); } }))),
      el('div', { class: 'data-nav', id: 'calNav' }, el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Anterior', id: 'calPrev', onclick: () => calMover(-1) }, icone('voltar')),
        el('button', { class: 'btn sec', type: 'button', id: 'calHoje', text: 'Hoje', onclick: () => { calRef = hojeLocal(); agMostrar(); } }),
        el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Próximo', id: 'calProx', onclick: () => calMover(1) }, icone('seta')), el('span', { class: 'titulo-data', id: 'calTitulo' })),
      el('select', { class: 'entrada cresce', id: 'agMedSel', 'aria-label': 'Médico', hidden: true, onchange: e => { MED.filtro = e.target.value; agMostrar(); } })),
    el('p', { class: 'titulo-cel', id: 'calTituloCel', 'aria-live': 'polite' }),   // no celular, a data fica embaixo da fileira
    el('div', { class: 'filtros', id: 'agChips', role: 'group', 'aria-label': 'Filtrar consultas' }),
    el('div', { class: 'lado-a-lado' }, el('div', {}, el('div', { id: 'agLista' }, el('div', { class: 'cartao' }, esqueleto())), el('div', { id: 'calBox', hidden: true })),
      el('div', { class: 'item-lado', id: 'agItem', hidden: true }))],
  entrar: () => { agMostrar(); if (!AG.carregou) agCarregar(); }
});
function agAbas(atual) {
  return el('div', { class: 'abas', role: 'tablist', 'aria-label': 'Agenda' }, [['', 'Consultas'], ['espera', 'Lista de espera'], ['documentos', 'Documentos']].map(([k, t]) =>
    el('button', { role: 'tab', type: 'button', 'aria-selected': String(atual === k), text: t, onclick: () => ir('agenda' + (k ? '/' + k : '')) })));
}
// Mostra a visão escolhida: a lista (com os filtros) ou o calendário (com a data). No celular, "Dia" é a lista do dia.
function agMostrar() {
  if (!$('calViews')) return;
  document.querySelectorAll('#calViews button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === AG.visao)));
  const lista = AG.visao === 'lista', diaLista = AG.visao === 'dia' && estreito();
  $('agChips').hidden = !lista; $('agFiltroBtn').hidden = !lista; $('calNav').hidden = lista; $('calTituloCel').hidden = lista; $('calVisao').value = AG.visao;
  $('agLista').hidden = !(lista || diaLista); $('calBox').hidden = lista || diaLista;
  const sel = $('agMedSel'), ativos = MED.dados.filter(m => m.ativo);
  if (!MED.modo || (MED.filtro && !ativos.some(m => String(m.id) === MED.filtro))) MED.filtro = '';
  trocar(sel, el('option', { value: '', text: 'Todos os médicos' }), ativos.map(m => el('option', { value: String(m.id), text: m.nome })));
  sel.value = MED.filtro; sel.hidden = !MED.modo;
  $('calTitulo').textContent = $('calTituloCel').textContent = calTitulo();
  agRender();
  if (!lista) calCarregar();
}
const AG_FIL = [['novos', 'Novos'], ['proximos', 'Próximos'], ['passados', 'Passados'], ['cancelados', 'Cancelados'], ['naopagas', 'Não pagas']];
// Filtro da Lista no celular: uma folha com as opções (e o médico, na agenda por médico); tocar aplica e fecha.
function agFiltroFolha() {
  const qtd = AG.contagem || (() => '');
  const opc = AG_FIL.map(([k, t]) => el('button', { class: 'linha' + (AG.filtro === k ? ' selecionada' : ''), type: 'button', 'aria-pressed': String(AG.filtro === k),
    onclick: () => { AG.filtro = k; if (k === 'naopagas') agNaoPagasCarregar(); f.fechar(); agRender(); } },
    el('span', { class: 'tx' }, el('span', { class: 't1', text: t + qtd(k) })), AG.filtro === k ? el('span', { class: 'seta' }, icone('ok')) : null));
  const ativos = MED.modo ? MED.dados.filter(m => m.ativo) : [];
  const med = ativos.length ? el('select', { class: 'entrada', id: 'agFiltroMed', 'aria-label': 'Médico', onchange: e => { MED.filtro = e.target.value; f.fechar(); agMostrar(); } },
    el('option', { value: '', text: 'Todos os médicos' }), ativos.map(m => el('option', { value: String(m.id), text: m.nome, selected: String(m.id) === MED.filtro }))) : null;
  const f = folha('Filtrar consultas', el('div', {}, el('div', { class: 'lista' }, opc), med ? el('div', { class: 'campo pilha' }, el('label', { for: 'agFiltroMed', text: 'Médico' }), med) : null));
}
function agRender() {
  const lista = $('agLista'); if (!lista || !AG.carregou) return;
  if (AG.visao === 'dia' && estreito()) return calCarregar();
  if (AG.visao !== 'lista') return;
  const g = agGrupos(AG.dados.filter(medFiltra)); g.naopagas = (AG.naoPagas || []).filter(medFiltra);
  const FIL = AG_FIL;
  const qtd = k => k === 'naopagas' && AG.naoPagas === null ? '' : ' (' + g[k].length + ')';
  const fil = FIL.find(([k]) => k === AG.filtro) || FIL[0], med = MED.filtro && medNome(MED.filtro);
  trocar($('agFiltroBtn'), el('span', { class: 'corta', text: 'Filtro: ' + fil[1] + qtd(fil[0]) + (med ? ' · ' + med : '') }), icone('seta', 'p'));
  AG.contagem = qtd;
  trocar($('agChips'), FIL.map(([k, t]) => el('button', { type: 'button', 'aria-pressed': String(AG.filtro === k), text: t + (k === 'naopagas' && AG.naoPagas === null ? '' : ' (' + g[k].length + ')'),
    onclick: () => { AG.filtro = k; if (k === 'naopagas') agNaoPagasCarregar(); agRender(); } })));
  const itens = g[AG.filtro] || [];
  const topo = [];
  if (AG.filtro === 'naopagas') topo.push(el('p', { class: 'mudo peq bloco', text: AG.naoPagas === null ? 'Carregando…' : 'Consultas confirmadas sem pagamento marcado, dos últimos 180 dias em diante. Marcar como paga é só um registro: nada é cancelado sozinho.' }));
  if (AG.filtro === 'cancelados' && itens.length) topo.push(el('div', { class: 'bloco' }, btn('Excluir todas as canceladas (' + itens.length + ')', async ev => {
    const b = ev.currentTarget;
    if (!(await confirmar({ titulo: itens.length === 1 ? 'Excluir a consulta cancelada?' : 'Excluir as ' + itens.length + ' consultas canceladas?', texto: 'Saem de vez da agenda. Não dá para desfazer.', botao: 'Excluir ' + itens.length, perigo: true }))) return;
    b.disabled = true;
    d24('agenda_excluir_cancelados').then(r => { rapida(pl(r && r.n ? r.n : 0, 'consulta excluída', 'consultas excluídas') + '.'); agCarregar(); }).catch(() => { b.disabled = false; rapida('Não consegui excluir. Tente de novo.'); });
  }, 'perigo-sec plena')));
  trocar(lista, topo, itens.length ? el('div', { class: 'lista' }, itens.map(a => consultaLinha(a))) : el('div', { class: 'cartao' }, vazio(null, AG.filtro === 'novos' ? 'Nenhuma consulta nova para ver.' : 'Nada por aqui.')));
}
// Uma consulta na lista: tocar abre; a única ação na linha é o selo "Paga / Não paga" (regra 7).
function consultaLinha(a, op) {
  op = op || {};
  const bloq = ehBloqueio(a), tags = [];
  if (!a.visto && agAtiva(a) && !bloq) tags.push(etq('Nova', 'marca'));
  if (a.status === 'cancelado') tags.push(etq('Cancelada', 'perigo', 'proibido'));
  else if (bloq) tags.push(etq('Bloqueio', '', 'bloquear'));
  else if (a.comparecimento) tags.push(agComparecimentoEtq(a));
  else if (a.presenca_confirmada) tags.push(etq('Confirmou presença', 'ok', 'ok'));
  if (a.origem_externa && tags.length < 3) tags.push(etq('Do ' + (a.origem_externa === 'reservio' ? 'Reservio' : a.origem_externa), ''));
  const mostrarPaga = !bloq && podePagar(a) && (a.pago_em || ligado('func_pagamento_link') || AG.filtro === 'naopagas');
  const selo = mostrarPaga ? el('button', { type: 'button', class: 'etq ' + (a.pago_em ? 'ok' : 'atencao'), 'aria-label': a.pago_em ? 'Paga. Tocar desmarca' : 'Não paga. Tocar marca como paga',
    onclick: e => { e.stopPropagation(); agPagar(a, !a.pago_em); } }, icone(a.pago_em ? 'ok' : 'dinheiro', 'p'), a.pago_em ? agPagoTxt(a) : 'Não paga') : null;
  const passou = new Date(a.fim).getTime() < Date.now();
  const sub = op.hora ? [a.servico && !bloq ? a.servico : null, a.medico_id && medNome(a.medico_id), bloq ? a.observacoes : (a.criado_por === 'ia' ? 'marcada pela assistente' : 'marcada pela equipe')].filter(Boolean).join(' · ')
    : [fmt(a.inicio) + ' – ' + fmt(a.fim).slice(-5), a.servico && !bloq ? a.servico : null, a.medico_id && medNome(a.medico_id)].filter(Boolean).join(' · ');
  return el('div', { class: 'linha' + (passou && op.hora ? ' passada' : ''), 'data-consulta': a.id },
    el('button', { class: 'linha-abrir', type: 'button', onclick: () => consultaAbrir(a) }, op.hora ? el('span', { class: 'hora num', text: hhmm(minDia(a.inicio)) }) : null,
      el('span', { class: 'tx' }, el('span', { class: 't1', text: bloq ? 'Horário bloqueado' : a.nome_paciente }), el('span', { class: 't2', text: sub }), tags.length ? el('span', { class: 'etqs' }, tags.slice(0, 3)) : null)),
    selo);
}
async function agPagar(a, pago) {
  try {
    const r = await d24('agenda_pago', { id: a.id, pago });
    if (!r || !r.ok) { rapida('Não encontrei essa consulta.'); return; }
    rapida(pago ? 'Marcada como paga.' : 'Pagamento desmarcado.', { desfazer: () => agPagar(a, !pago) });
    agCarregar(); if (AG.filtro === 'naopagas' || HOJE.naoPagas) agNaoPagasCarregar();
    a.pago_em = pago ? new Date().toISOString() : null; if (AG.aberta && AG.aberta.id === a.id) consultaAbrir(a, { semVisto: true });
  } catch (e) { rapida('Não consegui salvar. Tente de novo.'); }
}
// ---------------------------------------------------------------- a consulta (molde C): abrir já marca como vista (decisão 8)
function consultaAbrir(a, op) {
  op = op || {};
  AG.aberta = a;
  if (!a.visto && agAtiva(a) && !ehBloqueio(a) && !op.semVisto) { a.visto = true; d24('agenda_visto', { id: a.id }).then(() => { agSelo(); agRender(); hojeRender(); }).catch(() => {}); }
  const conteudo = consultaItem(a);
  const lado = $('agItem');
  if (window.innerWidth >= 1024 && lado && !lado.closest('section').hidden) { lado.hidden = false; trocar(lado, el('div', { class: 'cartao pad' }, conteudo)); return; }
  if (AG.folha) AG.folha.fechar();
  AG.folha = folha(ehBloqueio(a) ? 'Horário bloqueado' : 'Consulta', conteudo, { id: 'consultaFolha', aoFechar: () => { AG.folha = null; } });
}
function consultaFechar() { if (AG.folha) AG.folha.fechar(); const l = $('agItem'); if (l) { l.hidden = true; trocar(l); } AG.aberta = null; }
function consultaItem(a) {
  const bloq = ehBloqueio(a), ativa = agAtiva(a), externa = !!a.origem_externa, plat = a.origem_externa === 'reservio' ? 'Reservio' : a.origem_externa;
  const tags = [];
  if (a.status === 'cancelado') tags.push(etq('Cancelada', 'perigo', 'proibido'));
  else if (bloq) tags.push(etq('Bloqueio', '', 'bloquear'));
  else { if (a.comparecimento) tags.push(agComparecimentoEtq(a)); else if (a.presenca_confirmada) tags.push(etq('Confirmou presença', 'ok', 'ok')); if (a.pago_em) tags.push(etq(agPagoTxt(a), 'ok', 'ok')); else if (ligado('func_pagamento_link')) tags.push(etq('Não paga', 'atencao', 'dinheiro')); }
  const rapidas = [];
  if (podePagar(a)) rapidas.push(btn(a.pago_em ? 'Desmarcar paga' : 'Marcar como paga', () => agPagar(a, !a.pago_em), 'sec', a.pago_em ? 'fechar' : 'dinheiro'));
  if (ativa && !a.pago_em && !a.pagamento_link_enviado_em && podeLink(a.medico_id, a.servico)) rapidas.push(btn('Enviar link agora', ev => agEnviarLink(a, ev.currentTarget), 'sec', 'link'));
  if (ativa && !externa) rapidas.push(btn(bloq ? 'Editar' : 'Remarcar', () => consultaForm(a), 'sec', 'agenda'));
  // S10 e S13 (rxsync-sistema sql/066): desmarcar "vista" e desfazer o cancelamento (o servidor confere o horário livre).
  if (ativa && !bloq && a.visto) rapidas.push(btn('Marcar como não vista', () => agVistoDesfazer(a), 'sec', 'sino'));
  if (!ativa && !bloq && !externa && !a.no_externo && new Date(a.inicio).getTime() > Date.now()) rapidas.push(btn('Desfazer o cancelamento', () => agCancelarDesfazer(a), 'sec', 'voltar'));
  // S4 (rxsync-sistema sql/075): "Chegou" e "Faltou" só depois que a consulta começa; é um registro da clínica.
  if (ativa && !bloq && new Date(a.inicio).getTime() <= Date.now()) {
    if (a.comparecimento) rapidas.push(btn(a.comparecimento === 'chegou' ? 'Desmarcar "Chegou"' : 'Desmarcar "Faltou"', () => agComparecer(a, ''), 'sec', 'fechar'));
    else rapidas.push(btn('Chegou', () => agComparecer(a, 'chegou'), 'sec', 'ok'), btn('Faltou', () => agComparecer(a, 'faltou'), 'sec', 'proibido'));
  }
  const dadosL = [['Quando', fmtQuando(a.inicio) + ' até ' + fmt(a.fim).slice(-5)], bloq ? null : ['Serviço', a.servico], a.medico_id ? ['Médico', medNome(a.medico_id)] : null,
    bloq ? null : ['Telefone', pacTel(a.telefone_paciente)], bloq ? null : ['Marcada por', externa ? 'o ' + plat : a.criado_por === 'ia' ? 'a assistente' : 'a equipe'],
    a.pagamento_link_enviado_em ? ['Link de pagamento', 'enviado em ' + fmt(a.pagamento_link_enviado_em)] : null,
    a.status === 'cancelado' && !bloq && a.motivo_cancelamento ? ['Motivo do cancelamento', a.motivo_cancelamento === 'outro' ? (a.motivo_cancelamento_outro || 'Outro motivo') : (CANC_MOTIVOS.find(m => m[0] === a.motivo_cancelamento) || [])[1]] : null].filter(x => x && x[1]);
  return [el('div', { class: 'item-cab' }, el('div', { class: 'tx' }, el('h2', { text: bloq ? 'Horário bloqueado' : a.nome_paciente }), el('p', { class: 'mudo', text: fmtQuando(a.inicio) }), el('div', { class: 'etqs' }, tags))),
    rapidas.length ? el('div', { class: 'acoes-rapidas' }, rapidas) : null,
    externa && ativa ? aviso('', 'Veio do ' + plat + '. Para alterar ou cancelar, use o ' + plat + ': a mudança aparece aqui em até 2 minutos.') : null,
    el('div', { class: 'cartao bloco' }, el('dl', { class: 'dados' }, dadosL.map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]))),
    a.briefing ? el('div', { class: 'caixa-texto' }, el('p', { class: 'legenda', text: 'Resumo da conversa' }), el('p', { text: a.briefing })) : null,
    Array.isArray(a.preconsulta) && a.preconsulta.length ? el('div', { class: 'caixa-texto' }, el('p', { class: 'legenda', text: 'Respostas antes da consulta' }),
      a.preconsulta.map(q => el('p', { class: 'quebra' }, el('b', { text: (q.pergunta || '') + ' ' }), q.resposta || ''))) : null,
    a.observacoes ? el('div', { class: 'caixa-texto' }, el('p', { class: 'legenda', text: bloq ? 'Motivo' : 'Observações' }), el('p', { class: 'quebra', text: a.observacoes })) : null,
    !bloq ? el('a', { class: 'btn sec plena', href: zap(a.telefone_paciente), target: '_blank', rel: 'noopener' }, icone('zap', 'p'), 'Abrir a conversa no WhatsApp') : null,
    ativa && !externa ? el('div', { class: 'perigo-zona' }, btn(bloq ? 'Desbloquear o horário' : 'Cancelar consulta', () => agCancelar(a), 'perigo-sec plena')) : null,
    !ativa ? el('div', { class: 'perigo-zona' }, btn('Excluir de vez', () => agExcluir(a), 'perigo-sec plena')) : null];
}
async function agEnviarLink(a, botao) {
  if (!(await confirmar({ titulo: 'Enviar o link de pagamento?', texto: 'Vai agora para ' + a.nome_paciente + ' pelo WhatsApp da clínica, com o mesmo texto da assistente.', botao: 'Enviar link' }))) return;
  if (botao) botao.disabled = true;
  d24('agenda_pagamento_enviar', { id: a.id }).then(r => {
    const p = (r && r.pagamento) || { enviado: false, mensagem: 'Não encontrei essa consulta.' };
    rapida(p.mensagem, { ms: p.enviado ? 4500 : 9000 });
    if (p.enviado) { a.pagamento_link_enviado_em = new Date().toISOString(); consultaAbrir(a, { semVisto: true }); agCarregar(); } else if (botao) botao.disabled = false;
  }).catch(() => { if (botao) botao.disabled = false; rapida('Não consegui enviar. Tente de novo.'); });
}
// S4 (sql/075): o motivo do cancelamento, opcional (lista curta e "outro", até 100 letras).
const CANC_MOTIVOS = [['', 'Sem motivo'], ['paciente', 'O paciente pediu'], ['clinica', 'A clínica precisou desmarcar'], ['engano', 'Marcada por engano'], ['outro', 'Outro motivo']];
const agComparecimentoEtq = a => a.comparecimento === 'chegou' ? etq('Chegou', 'ok', 'ok') : etq('Faltou', 'atencao', 'proibido');
function agComparecer(a, valor) {
  const antes = a.comparecimento || '';
  d24('agenda_comparecimento', { id: a.id, valor }).then(r => {
    if (!(r && r.ok)) { rapida('Não consegui marcar.'); return; }
    a.comparecimento = valor;
    rapida(valor === 'chegou' ? 'Marcado: chegou.' : valor === 'faltou' ? 'Marcado: faltou.' : 'Marca desfeita.', { desfazer: () => agComparecer(a, antes) });
    if (AG.aberta && AG.aberta.id === a.id) consultaAbrir(a, { semVisto: true }); agRender();
  }).catch(() => rapida('Não consegui marcar.'));
}
async function agCancelar(a) {
  const bloq = ehBloqueio(a);
  const sel = bloq ? null : el('select', { class: 'entrada', id: 'cancMotivo' }, CANC_MOTIVOS.map(([v, t]) => el('option', { value: v, text: t })));
  const outro = bloq ? null : el('input', { class: 'entrada', id: 'cancOutro', maxlength: '100', autocomplete: 'off' });
  const caixaOutro = bloq ? null : el('label', { class: 'campo', for: 'cancOutro', hidden: true }, el('span', { class: 'rot', text: 'Qual?' }), outro);
  if (sel) sel.addEventListener('change', () => { caixaOutro.hidden = sel.value !== 'outro'; });
  const textos = bloq ? ['O horário volta a ficar livre na agenda.'] : ['A consulta de ' + a.nome_paciente + ' é cancelada e o horário vira vaga: se a lista de espera estiver ligada, a assistente oferece a vaga ao próximo da fila.'];
  if (a.no_externo) textos.push('Essa consulta também está no ' + (a.externo_plataforma === 'reservio' ? 'Reservio' : a.externo_plataforma) + ': cancele lá também.');
  if (!(await confirmar({ titulo: bloq ? 'Desbloquear o horário?' : 'Cancelar a consulta?', texto: textos, botao: bloq ? 'Desbloquear' : 'Cancelar consulta', perigo: true,
    extra: bloq ? null : [el('label', { class: 'campo', for: 'cancMotivo' }, el('span', { class: 'rot', text: 'Motivo (opcional)' }), sel), caixaOutro] }))) return;
  const motivo = sel && sel.value ? { motivo: sel.value, ...(sel.value === 'outro' ? { motivo_outro: outro.value.trim().slice(0, 100) } : {}) } : {};
  d24('agenda_cancelar', { id: a.id, ...motivo }).then(() => { rapida(bloq ? 'Horário desbloqueado.' : 'Consulta cancelada.'); consultaFechar(); agCarregar(); }).catch(() => rapida('Não consegui cancelar.'));
}
// Desmarcar "vista" (S10): a consulta volta a aparecer como nova em Hoje e no filtro Novos; fecha a consulta, porque abrir de
// novo marca como vista (decisão 8).
function agVistoDesfazer(a) {
  d24('agenda_visto_desfazer', { id: a.id }).then(r => {
    if (!(r && r.ok)) { rapida('Não consegui desmarcar.'); return; }
    a.visto = false; rapida('A consulta volta a aparecer como nova.'); consultaFechar(); agSelo(); agRender(); hojeRender();
  }).catch(() => rapida('Não consegui desmarcar.'));
}
// Desfazer o cancelamento (S13, nível 2): só com o horário livre e no futuro; a recusa vem do servidor com o motivo.
async function agCancelarDesfazer(a) {
  if (!(await confirmar({ titulo: 'Desfazer o cancelamento?', texto: ['A consulta de ' + a.nome_paciente + ' volta para ' + fmtQuando(a.inicio) + ', se o horário ainda estiver livre.', 'Nenhuma mensagem vai ao paciente. Se ele já sabia do cancelamento, avise pelo WhatsApp.'], botao: 'Desfazer o cancelamento' }))) return;
  d24('agenda_cancelar_desfazer', { id: a.id }).then(r => {
    if (r && r.ok) { rapida('Cancelamento desfeito: a consulta voltou.'); consultaFechar(); agCarregar(); }
    else rapida((r && r.mensagem) || 'Não consegui desfazer o cancelamento.', { ms: 9000 });
  }).catch(() => rapida('Não consegui desfazer o cancelamento.'));
}
async function agExcluir(a) {
  const futuro = new Date(a.inicio).getTime() > Date.now();
  if (!(await confirmar({ titulo: 'Excluir de vez?', texto: ['O horário cancelado de ' + a.nome_paciente + ' sai da agenda. Não dá para desfazer.', futuro ? 'O horário continua livre. Se a lista de espera ainda não ofereceu essa vaga, deixa de oferecer.' : null], botao: 'Excluir', perigo: true }))) return;
  d24('agenda_excluir', { id: a.id }).then(r => { rapida(r && r.ok ? 'Excluído.' : 'Não encontrei esse horário cancelado.'); consultaFechar(); agCarregar(); }).catch(() => rapida('Não consegui excluir.'));
}
// ---------------------------------------------------------------- nova consulta e remarcar (folha H): data, horário e duração (o fim é calculado)
const duracaoPadrao = () => { const v = parseInt(VAL.duracao_padrao_min, 10); return v > 0 ? v : 30; };
function consultaNova() { consultaForm(null); }
function consultaForm(a) {
  const bloq = a && ehBloqueio(a);
  const iniPadrao = a ? paraInput(a.inicio) : (AG.visao === 'dia' || AG.visao === 'semana' ? chave(calRef) : chave(hojeLocal())) + 'T09:00';
  const durA = a ? Math.max(5, Math.round((new Date(a.fim) - new Date(a.inicio)) / 60000)) : duracaoPadrao();
  const campo = (rot, i, dica) => el('div', { class: 'campo' }, el('label', { for: i.id, text: rot }), i, dica ? el('p', { class: 'dica', text: dica }) : null);
  const nome = el('input', { class: 'entrada', id: 'agfNome', type: 'text', maxlength: '120', value: a && !bloq ? a.nome_paciente : '', autocomplete: 'off', autocapitalize: 'words' });
  const tel = el('input', { class: 'entrada', id: 'agfTel', type: 'tel', inputmode: 'tel', maxlength: '30', value: a && !bloq ? a.telefone_paciente : '', autocomplete: 'off' });
  const serv = el('input', { class: 'entrada', id: 'agfServ', type: 'text', maxlength: '120', value: a ? a.servico : '' });
  const data = el('input', { class: 'entrada', id: 'agfData', type: 'date', value: iniPadrao.slice(0, 10) });
  const hora = el('input', { class: 'entrada', id: 'agfHora', type: 'time', value: iniPadrao.slice(11, 16) });
  const dur = el('input', { class: 'entrada', id: 'agfDur', type: 'number', inputmode: 'numeric', min: '5', max: '600', value: String(durA) });
  const obs = el('input', { class: 'entrada', id: 'agfObs', type: 'text', maxlength: '500', value: a ? a.observacoes : '' });
  const fimTxt = el('p', { class: 'dica', 'aria-live': 'polite' });
  const atualizarFim = () => { const m = parseInt(dur.value, 10); if (data.value && hora.value && m > 0) fimTxt.textContent = 'Termina às ' + hhmm((hm(hora.value) + m) % 1440) + '.'; else fimTxt.textContent = ''; };
  [hora, dur, data].forEach(i => i.addEventListener('input', atualizarFim));
  // Médico e tipo (Gestão): no modo médicos a consulta exige médico; "Sem médico" só vale para bloqueio.
  let medSel = null, tipoSel = null, tipoCampo = null;
  if (!sem('medicos') && (MED.dados.some(m => m.ativo) || (a && a.medico_id))) {
    medSel = el('select', { class: 'entrada', id: 'agfMed' }, el('option', { value: '', text: MED.modo ? 'Sem médico (só para bloqueio)' : 'Sem médico (vale para todos)' }),
      MED.dados.filter(m => m.ativo || (a && String(a.medico_id) === String(m.id))).map(m => el('option', { value: String(m.id), text: m.nome + (m.ativo ? '' : ' (removido)') })));
    medSel.value = a && a.medico_id ? String(a.medico_id) : (!a && MED.modo && MED.filtro ? MED.filtro : '');
    tipoSel = el('select', { class: 'entrada', id: 'agfTipo' });
    tipoCampo = campo('Tipo de consulta', tipoSel);
    const tipoAntigo = a && a.tipo_consulta_id ? String(a.tipo_consulta_id) : '';
    const tipoMontar = manter => {
      const m = MED.dados.find(x => String(x.id) === medSel.value);
      const lista = ((m && m.tipos) || []).filter(t => t.ativo || String(t.id) === tipoAntigo);
      trocar(tipoSel, el('option', { value: '', text: 'Escolha o tipo' }), lista.map(t => el('option', { value: String(t.id), 'data-dur': String(t.duracao_min), 'data-nome': t.nome, text: t.nome + ' · ' + t.duracao_min + ' min' + (t.ativo ? '' : ' (removido)') })));
      tipoSel.value = manter && lista.some(t => String(t.id) === manter) ? manter : '';
      tipoCampo.hidden = !lista.length;
    };
    tipoMontar(tipoAntigo);
    medSel.addEventListener('change', () => { tipoMontar(''); linkMostrar(); });
    tipoSel.addEventListener('change', () => { const o = tipoSel.options[tipoSel.selectedIndex]; if (o && o.value) { dur.value = o.getAttribute('data-dur'); atualizarFim(); if (!serv.value.trim()) serv.value = o.getAttribute('data-nome'); } });
  }
  // Link de pagamento (DEC-099): na nova consulta, a opção sempre desmarcada ao abrir.
  const linkCb = !a ? el('input', { type: 'checkbox', id: 'agEnviarLink' }) : null;
  const linkLbl = linkCb ? el('label', { class: 'marcar' }, linkCb, el('span', { text: 'Enviar link de pagamento ao paciente' })) : null;
  function linkMostrar() { if (!linkCb) return; const ok = podeLink(medSel && medSel.value, serv.value); linkLbl.hidden = !ok; if (!ok) linkCb.checked = false; }
  serv.addEventListener('input', linkMostrar); linkMostrar();
  // Permitir encaixe: aparece depois do erro "conflito" ou "fora da grade".
  const forca = el('input', { type: 'checkbox', id: 'agfEncaixe' }), forcaLbl = el('label', { class: 'marcar', hidden: true }, forca, el('span', { text: 'Permitir encaixe (mesmo fora da grade ou com horário ocupado)' }));
  const erro = el('div', { 'aria-live': 'polite' });
  const salvar = el('button', { class: 'btn pri', type: 'button', id: 'agfSalvar', text: 'Salvar' });
  const f = folha(a ? (bloq ? 'Editar bloqueio' : 'Remarcar') : 'Nova consulta', el('div', { class: 'form', id: 'agForm' },
    bloq ? null : campo('Nome do paciente', nome), bloq ? null : campo('Telefone com DDD', tel), bloq ? null : campo('Serviço', serv),
    medSel ? campo('Médico', medSel) : null, tipoCampo,
    el('div', { class: 'duas-col' }, campo('Data', data), campo('Horário', hora)), campo('Duração (minutos)', dur), fimTxt, campo(bloq ? 'Motivo' : 'Observações', obs),
    linkLbl, forcaLbl, erro), { pe: [btn('Cancelar', () => f.fechar(), 'sec'), salvar], foco: bloq ? '#agfData' : '#agfNome' });
  atualizarFim();
  salvar.addEventListener('click', async () => {
    trocar(erro);
    const m = parseInt(dur.value, 10);
    if (!data.value || !hora.value || !(m >= 5)) { trocar(erro, aviso('perigo', 'Confira a data, o horário e a duração.')); return; }
    const ini = isoLocal(data.value + 'T' + hora.value);
    const d = { nome_paciente: bloq ? a.nome_paciente : nome.value, telefone_paciente: bloq ? a.telefone_paciente : tel.value, servico: bloq ? 'BLOQUEIO' : serv.value, inicio: ini,
      fim: new Date(new Date(ini).getTime() + m * 60000).toISOString(), observacoes: obs.value, forcar: forca.checked || !!bloq };
    if (a) d.id = a.id;
    if (String(d.servico || '').trim().toUpperCase() === 'BLOQUEIO') d.servico = 'BLOQUEIO';
    if (medSel) d.medico_id = medSel.value;
    if (tipoSel) d.tipo_consulta_id = tipoCampo.hidden ? '' : tipoSel.value;
    if (linkCb && linkCb.checked && !linkLbl.hidden) d.enviar_link = true;
    if (MED.modo && medSel && !medSel.value && d.servico !== 'BLOQUEIO') { trocar(erro, aviso('perigo', 'Escolha o médico da consulta. "Sem médico" só vale para bloqueio.')); medSel.focus(); return; }
    if (MED.modo && tipoSel && !tipoCampo.hidden && !tipoSel.value && d.servico !== 'BLOQUEIO') { trocar(erro, aviso('perigo', 'Escolha o tipo de consulta.')); tipoSel.focus(); return; }
    salvar.disabled = true; salvar.textContent = 'Salvando…';
    try {
      const res = await d24(a ? 'agenda_editar' : 'agenda_criar', d);
      salvar.disabled = false; salvar.textContent = 'Salvar';
      if (res.ok) {
        f.limpar(); f.fechar();
        if (res.pagamento) rapida('Salvo. ' + res.pagamento.mensagem, { ms: res.pagamento.enviado ? 4500 : 9000 }); else rapida('Salvo.');
        if (a) consultaFechar();
        agCarregar(); if (medSel) medCarregar();
        return;
      }
      if (res.erro === 'conflito' || res.erro === 'fora_da_grade') forcaLbl.hidden = false;
      trocar(erro, aviso('perigo', res.erro === 'conflito' ? 'Já existe uma consulta nesse horário. Para marcar mesmo assim, marque "Permitir encaixe" e salve de novo.'
        : res.erro === 'fora_da_grade' ? 'Fora dos horários de atendimento. Para marcar mesmo assim, marque "Permitir encaixe" e salve de novo.'
          : res.erro === 'medico' ? 'Esse médico foi removido. Escolha outro médico ou "Sem médico".' : res.erro === 'tipo_obrigatorio' ? 'Escolha o tipo de consulta.'
            : res.erro === 'tipo' ? 'Esse tipo de consulta não vale para este médico. Escolha outro tipo.' : res.erro === 'plano' ? (res.mensagem || 'Recurso do plano Gestão Inteligente.') : 'Confira o nome, o telefone e o horário.'));
    } catch (e) { salvar.disabled = false; salvar.textContent = 'Salvar'; trocar(erro, aviso('perigo', 'Não foi salvo: sem conexão. Tente de novo.')); }
  });
}
// Bloquear horário (botão próprio): o mesmo agenda_criar, com o Serviço BLOQUEIO, como o assistente de gestão faz.
function bloquearForm() {
  const campo = (rot, i) => el('div', { class: 'campo' }, el('label', { for: i.id, text: rot }), i);
  const data = el('input', { class: 'entrada', id: 'blqData', type: 'date', value: chave(AG.visao === 'lista' ? hojeLocal() : calRef) });
  const de = el('input', { class: 'entrada', id: 'blqDe', type: 'time', value: '12:00' }), ate = el('input', { class: 'entrada', id: 'blqAte', type: 'time', value: '13:00' });
  const motivo = el('input', { class: 'entrada', id: 'blqMotivo', type: 'text', maxlength: '200', placeholder: 'Ex.: congresso, almoço, folga' });
  const medSel = MED.modo ? el('select', { class: 'entrada', id: 'blqMed' }, el('option', { value: '', text: 'Todos os médicos' }), MED.dados.filter(m => m.ativo).map(m => el('option', { value: String(m.id), text: m.nome }))) : null;
  if (medSel) medSel.value = MED.filtro || '';
  const erro = el('div', { 'aria-live': 'polite' });
  const salvar = el('button', { class: 'btn pri', type: 'button', text: 'Bloquear' });
  const f = folha('Bloquear horário', el('div', { class: 'form' }, el('p', { class: 'mudo', text: 'A assistente não oferece esse horário aos pacientes. As consultas que já estão marcadas nele continuam.' }),
    campo('Data', data), el('div', { class: 'duas-col' }, campo('Das', de), campo('Até', ate)), medSel ? campo('Médico', medSel) : null, campo('Motivo (opcional)', motivo), erro),
  { pe: [btn('Cancelar', () => f.fechar(), 'sec'), salvar], foco: '#blqData' });
  salvar.addEventListener('click', async () => {
    trocar(erro);
    if (!data.value || !de.value || !ate.value || hm(ate.value) <= hm(de.value)) { trocar(erro, aviso('perigo', 'Confira a data e os horários: o fim precisa ser depois do começo.')); return; }
    const d = { nome_paciente: 'Horário bloqueado', telefone_paciente: '-', servico: 'BLOQUEIO', inicio: isoLocal(data.value + 'T' + de.value), fim: isoLocal(data.value + 'T' + ate.value), observacoes: motivo.value.trim(), forcar: true };
    if (medSel) d.medico_id = medSel.value;
    salvar.disabled = true;
    try {
      const r = await d24('agenda_criar', d);
      salvar.disabled = false;
      if (r && r.ok) { f.limpar(); f.fechar(); rapida('Horário bloqueado.'); agCarregar(); return; }
      trocar(erro, aviso('perigo', (r && r.mensagem) || 'Não consegui bloquear. Confira os horários.'));
    } catch (e) { salvar.disabled = false; trocar(erro, aviso('perigo', 'Não foi salvo: sem conexão. Tente de novo.')); }
  });
}
// ---------------------------------------------------------------- exportar a agenda em .ics (Google Agenda, Outlook e iPhone)
function icsTxt(v) { return String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function icsHora(iso) { return new Date(iso).toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[-:]/g, ''); }
function icsDobra(linha) {   // linhas de no máximo 75 bytes; a continuação começa com espaço (RFC 5545)
  const enc = new TextEncoder(); let out = '', atual = '', n = 0;
  for (const ch of linha) { const b = enc.encode(ch).length; if (n + b > 75) { out += atual + '\r\n '; atual = ''; n = 1; } atual += ch; n += b; }
  return out + atual;
}
function agExportar() {
  const agora = Date.now(), semMs = d => new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');
  rapida('Gerando o arquivo…');
  d24('agenda_listar', { de: semMs(agora - 365 * 86400000), ate: semMs(agora + 730 * 86400000) }).then(rows => {
    const ativos = (rows || []).filter(agAtiva);
    if (!ativos.length) { rapida('Não há consultas para exportar.'); return; }
    const carimbo = icsHora(new Date().toISOString());
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RXSync//Agenda//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsTxt('Agenda ' + (VAL.nome_exibicao || 'RXSync')), 'X-WR-TIMEZONE:' + TZ];
    ativos.forEach(a => {
      const desc = ['Telefone: ' + (a.telefone_paciente || '-')]; if (a.servico) desc.push('Serviço: ' + a.servico); if (a.observacoes) desc.push('Obs.: ' + a.observacoes);
      desc.push(a.criado_por === 'ia' ? 'Marcado pela assistente RXSync' : 'Lançado pela equipe');
      L.push('BEGIN:VEVENT', 'UID:rxsync-' + a.id + '@rxsync.com.br', 'DTSTAMP:' + carimbo, 'DTSTART:' + icsHora(a.inicio), 'DTEND:' + icsHora(a.fim),
        'SUMMARY:' + icsTxt(a.nome_paciente + (a.servico ? ' · ' + a.servico : '')), 'DESCRIPTION:' + icsTxt(desc.join('\n')), 'STATUS:CONFIRMED', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    baixarArquivo(L.map(icsDobra).join('\r\n') + '\r\n', 'text/calendar;charset=utf-8', 'agenda-rxsync-' + new Date().toLocaleDateString('sv-SE', { timeZone: TZ }) + '.ics');
    rapida(pl(ativos.length, 'consulta exportada', 'consultas exportadas') + '. Abra o arquivo no Google Agenda, no Outlook ou no iPhone.');
  }).catch(() => rapida('Não consegui exportar agora. Tente de novo.'));
}
// ---------------------------------------------------------------- calendário: Dia, Semana e Mês (no fuso da clínica)
const PX = 52;
function calIntervalo() {
  if (AG.visao === 'dia') return { ini: calRef, n: 1 };
  if (AG.visao === 'semana') return { ini: iniSemana(calRef), n: 7 };
  return { ini: iniSemana(new Date(Date.UTC(calRef.getUTCFullYear(), calRef.getUTCMonth(), 1))), n: 42 };
}
function calTitulo() {
  if (AG.visao === 'dia') return fmtD(calRef, { weekday: 'long', day: '2-digit', month: 'long' });
  if (AG.visao === 'semana') { const i = iniSemana(calRef), f = somaDias(i, 6); return fmtD(i, { day: '2-digit', month: 'short' }) + ' – ' + fmtD(f, { day: '2-digit', month: 'short' }); }
  return fmtD(calRef, { month: 'long', year: 'numeric' });
}
function calMover(dir) {
  if (AG.visao === 'dia') calRef = somaDias(calRef, dir);
  else if (AG.visao === 'semana') calRef = somaDias(calRef, 7 * dir);
  else calRef = new Date(Date.UTC(calRef.getUTCFullYear(), calRef.getUTCMonth() + dir, 1));
  agMostrar();
}
function calCarregar() {
  if (AG.visao === 'lista' || !$('calBox')) return;
  const r = calIntervalo(), n = ++AG.calReq;
  $('calTitulo').textContent = $('calTituloCel').textContent = calTitulo();
  d24('agenda_listar', { de: isoLocal(chave(r.ini) + 'T00:00'), ate: isoLocal(chave(somaDias(r.ini, r.n)) + 'T00:00') }).then(rows => {
    if (n !== AG.calReq) return;
    AG.cal = (rows || []).filter(agAtiva).filter(medFiltra); calRender();
  }).catch(() => { if (n !== AG.calReq) return; trocar($('calBox'), el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'O calendário não carregou agora.', btn('Tentar de novo', calCarregar, 'sec')))); });
}
// Horários que sombreiam o calendário: os da clínica, ou (modo médicos) os do médico filtrado ou de todos os ativos.
function gradeVisivel() {
  if (!MED.modo) return GRADE.dados;
  let out = []; MED.dados.forEach(m => { if (m.ativo && (!MED.filtro || String(m.id) === MED.filtro)) out = out.concat(m.grade || []); });
  return out;
}
function calRender() {
  if (AG.visao === 'lista') return;
  if (AG.visao === 'dia' && estreito()) {   // celular: a lista do dia
    const l = AG.cal.filter(a => chaveIso(a.inicio) === chave(calRef)).sort((x, y) => new Date(x.inicio) - new Date(y.inicio));
    trocar($('agLista'), l.length ? el('div', { class: 'lista' }, l.map(a => consultaLinha(a, { hora: true })))
      : el('div', { class: 'cartao' }, vazio(null, 'Nenhuma consulta neste dia.', btn('Nova consulta', () => consultaNova(), 'sec', 'soma'))));
    return;
  }
  const box = $('calBox');
  if (AG.visao === 'mes') { trocar(box, calMes()); return; }
  const r = calIntervalo(), dias = []; for (let i = 0; i < r.n; i++) dias.push(somaDias(r.ini, i));
  trocar(box, calGrade(dias));
}
function calFaixas(lista) {   // consultas que se sobrepõem dividem a coluna
  let out = [], cl = [], fimCl = 0;
  const fechar = () => { let n = 0; cl.forEach(x => { n = Math.max(n, x.lane + 1); }); cl.forEach(x => { x.n = n; }); out = out.concat(cl); cl = []; };
  lista.forEach(a => {
    const s = minDia(a.inicio), e = s + Math.max(15, Math.round((new Date(a.fim) - new Date(a.inicio)) / 60000));
    if (cl.length && s >= fimCl) fechar();
    const usados = {}; cl.forEach(x => { if (x.e > s) usados[x.lane] = true; });
    let l = 0; while (usados[l]) l++;
    cl.push({ a, lane: l, s, e }); fimCl = cl.length === 1 ? e : Math.max(fimCl, e);
  });
  if (cl.length) fechar(); return out;
}
function calGrade(dias) {
  let ini = 8 * 60, fim = 18 * 60, achou = false; const keys = dias.map(chave), hoje = chave(hojeLocal()), gv = gradeVisivel();
  gv.forEach(g => { const a = hm(g.inicio), b = hm(g.fim); if (!achou) { ini = a; fim = b; achou = true; } ini = Math.min(ini, a); fim = Math.max(fim, b); });
  AG.cal.forEach(a => { if (!keys.includes(chaveIso(a.inicio))) return; const s = minDia(a.inicio); ini = Math.min(ini, s); fim = Math.max(fim, Math.min(1440, s + 30)); });
  ini = Math.floor(ini / 60) * 60; fim = Math.ceil(fim / 60) * 60; if (fim <= ini) fim = ini + 60;
  const alt = (fim - ini) / 60 * PX, px = m => ((m - ini) / 60 * PX) + 'px';
  const cab = el('div', { class: 'cal-cab' }, el('span', { class: 'h' }), dias.map(d => el('button', { type: 'button', class: chave(d) === hoje ? 'hoje' : '', text: fmtD(d, { weekday: 'short', day: '2-digit' }),
    onclick: () => { if (dias.length > 1) { AG.visao = 'dia'; calRef = d; agMostrar(); } } })));
  const horas = el('div', { class: 'cal-horas' }); horas.style.height = alt + 'px';
  for (let m = ini; m < fim; m += 60) { const s = el('span', { text: hhmm(m) }); s.style.top = ((m - ini) / 60 * PX + 2) + 'px'; horas.append(s); }
  const corpo = el('div', { class: 'cal-corpo' }, horas, dias.map(d => {
    const col = el('div', { class: 'cal-col' }); col.style.height = alt + 'px';
    if (!gv.length) col.classList.add('livre-tudo');
    gv.filter(g => g.dia === d.getUTCDay()).forEach(g => { const b = el('div', { class: 'livre' }); b.style.top = px(hm(g.inicio)); b.style.height = ((hm(g.fim) - hm(g.inicio)) / 60 * PX) + 'px'; col.append(b); });
    for (let m = ini; m < fim; m += 60) { const ln = el('div', { class: 'lh' }); ln.style.top = px(m); col.append(ln); }
    calFaixas(AG.cal.filter(a => chaveIso(a.inicio) === chave(d)).sort((x, y) => new Date(x.inicio) - new Date(y.inicio))).forEach(x => {
      const a = x.a, bq = ehBloqueio(a);
      const b = el('button', { type: 'button', class: 'cal-ev' + (bq ? ' bloq' : a.criado_por === 'ia' ? '' : ' equipe'), onclick: () => consultaAbrir(a) },
        el('b', { text: hhmm(x.s) + ' ' + (bq ? 'Bloqueado' : a.nome_paciente) }), a.servico && !bq ? el('span', { text: a.servico }) : null);
      b.style.top = px(Math.max(x.s, ini)); b.style.height = Math.max((Math.min(x.e, fim) - Math.max(x.s, ini)) / 60 * PX - 2, 22) + 'px';
      b.style.left = (x.lane / x.n * 100) + '%'; b.style.width = (100 / x.n - 1) + '%';
      col.append(b);
    });
    return col;
  }));
  const cal = el('div', { class: 'cal' }, cab, corpo);
  if (dias.length > 1) { cab.style.minWidth = '640px'; corpo.style.minWidth = '640px'; }
  return cal;
}
function calMes() {
  const r = calIntervalo(), mes = calRef.getUTCMonth(), hoje = chave(hojeLocal()), porDia = {}, gv = gradeVisivel();
  const semanas = somaDias(r.ini, 35).getUTCMonth() === mes ? 6 : 5;
  AG.cal.forEach(a => { const k = chaveIso(a.inicio); (porDia[k] = porDia[k] || []).push(a); });
  const g = el('div', { class: 'cal-mes' }, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(n => el('div', { class: 'dsem', text: n })));
  for (let i = 0; i < semanas * 7; i++) {
    const d = somaDias(r.ini, i), k = chave(d), lista = (porDia[k] || []).sort((x, y) => new Date(x.inicio) - new Date(y.inicio));
    const fora = d.getUTCMonth() !== mes, semGrade = gv.length && !gv.some(x => x.dia === d.getUTCDay());
    g.append(el('button', { type: 'button', class: (fora ? 'fora' : semGrade ? 'sem-grade' : ''), 'aria-label': fmtD(d, { day: 'numeric', month: 'long' }) + ': ' + pl(lista.length, 'consulta', 'consultas'),
      onclick: () => { AG.visao = 'dia'; calRef = d; agMostrar(); } }, el('span', { class: 'dnum' + (k === hoje ? ' hoje' : ''), text: String(d.getUTCDate()) }),
      estreito() ? (lista.length ? el('span', { class: 'qtd', text: String(lista.length) }) : null)
        : [lista.slice(0, 3).map(a => el('span', { class: 'ev', text: hhmm(minDia(a.inicio)) + ' ' + (ehBloqueio(a) ? 'Bloqueado' : a.nome_paciente) })), lista.length > 3 ? el('span', { class: 'ev mudo', text: '+' + (lista.length - 3) + ' mais' }) : null]));
  }
  return el('div', { class: 'cal' }, g);
}
// ---------------------------------------------------------------- Agenda › Lista de espera e Documentos (visões da Agenda)
tela('agenda/espera', {
  montar: () => [cabTela('Agenda', { acao: acaoPrincipal('Nova consulta', () => consultaNova(), 'soma') }), agAbas('espera'),
    el('p', { class: 'subtitulo', text: 'Quem pediu para ser avisado quando abrir um horário. Quando uma consulta é cancelada, a assistente oferece a vaga a uma pessoa por vez, na ordem da lista; quem tem médico preferido só recebe vaga daquele médico.' }),
    el('div', { id: 'filaLista' })],
  entrar: () => filaCarregar()
});
function filaCarregar() {
  const box = $('filaLista');
  if (sem('fila')) { trocar(box, travaPlano('Quando alguém cancela, a assistente oferece o horário a quem está na lista de espera.')); return; }
  if (!ligado('func_fila')) { trocar(box, aviso('', 'A lista de espera está desligada: a assistente não oferece vagas. ', el('button', { class: 'link', type: 'button', 'data-ir': 'assistente/funcoes', text: 'Ligar em Assistente › O que ela faz' }))); return; }
  trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  d24('agenda_fila').then(rows => {
    if (!rows || !rows.length) { trocar(box, el('div', { class: 'cartao' }, vazio('Ninguém na lista de espera agora.', 'Quando um paciente pedir para ser avisado de uma vaga, ele aparece aqui.'))); return; }
    trocar(box, el('div', { class: 'lista' }, rows.map((x, i) => {
      const oferecida = x.status === 'oferecida';
      const info = [x.servico ? 'Consulta: ' + x.servico : null, x.preferencia ? 'Preferência: ' + x.preferencia : null, x.medico_preferido ? 'Médico: ' + x.medico_preferido : MED.modo ? 'Médico: tanto faz' : null,
        oferecida && x.vaga_inicio ? 'Vaga oferecida: ' + fmt(x.vaga_inicio) + (x.vaga_medico ? ' · ' + x.vaga_medico : '') + (x.vaga_tipo ? ' · ' + x.vaga_tipo : '') : null].filter(Boolean);
      return el('div', { class: 'linha' }, el('span', { class: 'ic num', text: String(i + 1) }), el('span', { class: 'tx' }, el('span', { class: 't1', text: x.nome || 'Paciente' }),
        el('span', { class: 't2', text: 'Na lista desde ' + fmt(x.criado_em) }), info.map(t => el('span', { class: 't2', text: t }))), etq(oferecida ? 'Vaga oferecida' : 'Aguardando', oferecida ? 'atencao' : ''));
    })));
  }).catch(() => trocar(box, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'A lista não carregou agora.', btn('Tentar de novo', filaCarregar, 'sec')))));
}
const DOC_TIPOS = { pedido_exame: 'Pedido de exame', resultado_exame: 'Resultado de exame', receita: 'Receita', atestado_laudo: 'Atestado ou laudo', carteirinha_convenio: 'Carteirinha do convênio', documento_identidade: 'Documento de identidade', comprovante_pagamento: 'Comprovante de pagamento', guia_autorizacao: 'Guia de autorização', outro: 'Outro', ilegivel: 'Não deu para ler' };
const DOC_ROT = { nome_paciente: 'Paciente', data_nascimento: 'Nascimento', cpf: 'CPF', data_documento: 'Data do documento', convenio: 'Convênio', plano_convenio: 'Plano', numero_carteirinha: 'Carteirinha', validade: 'Validade', profissional: 'Profissional', registro_profissional: 'Registro', procedimentos_solicitados: 'Solicitado', numero_guia: 'Guia', valor_pago: 'Valor' };
tela('agenda/documentos', {
  montar: () => [cabTela('Agenda', { acao: acaoPrincipal('Nova consulta', () => consultaNova(), 'soma') }), agAbas('documentos'),
    el('p', { class: 'subtitulo', text: 'Fotos e PDFs que os pacientes mandam no WhatsApp: pedido de exame, carteirinha, guia, documento. A assistente anota só os dados administrativos e não interpreta conteúdo clínico. Confira sempre no arquivo original.' }),
    el('div', { id: 'docLista' })],
  entrar: () => docCarregar()
});
function docCarregar() {
  const box = $('docLista');
  if (sem('documentos')) { trocar(box, travaPlano('A assistente lê as fotos e os PDFs que o paciente manda e anota os dados administrativos. No seu plano, ela avisa o paciente que a equipe vai ver o arquivo.')); return; }
  trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  d24('agenda_documentos').then(rows => {
    if (!rows || !rows.length) { trocar(box, el('div', { class: 'cartao' }, vazio('Nenhum documento recebido ainda.', 'Quando um paciente mandar uma foto ou um PDF, ele aparece aqui.'))); return; }
    trocar(box, rows.map(x => el('div', { class: 'cartao pad bloco' },
      el('div', { class: 'item-cab' }, el('div', { class: 'tx' }, el('p', { class: 'tit-bloco', text: (x.dados && x.dados.nome_paciente) || x.nome_contato || 'Paciente' }),
        el('p', { class: 'mudo peq', text: fmt(x.recebido_em) + (x.telefone ? ' · ' + pacTel(x.telefone) : '') })), etq(DOC_TIPOS[x.tipo] || 'Documento', 'marca')),
      x.resumo ? el('p', { class: 'peq', text: x.resumo }) : null,
      el('dl', { class: 'dados pilha' }, Object.keys(DOC_ROT).filter(k => { const v = x.dados && x.dados[k]; return v && !(Array.isArray(v) && !v.length); })
        .map(k => [el('dt', { text: DOC_ROT[k] }), el('dd', { text: Array.isArray(x.dados[k]) ? x.dados[k].join(', ') : x.dados[k] })])),
      el('div', { class: 'linha-botoes pilha' }, x.arquivo_url ? el('a', { class: 'btn sec', href: x.arquivo_url, target: '_blank', rel: 'noopener', text: 'Abrir arquivo' }) : null,
        x.telefone ? el('a', { class: 'btn sec', href: zap(x.telefone), target: '_blank', rel: 'noopener', text: 'WhatsApp' }) : null,
        btn('Excluir', async () => {
          if (!(await confirmar({ titulo: 'Excluir este registro?', texto: 'O arquivo original continua na conversa do WhatsApp.', botao: 'Excluir', perigo: true }))) return;
          d24('agenda_documento_excluir', { id: x.id }).then(() => { rapida('Excluído.'); docCarregar(); }).catch(() => rapida('Não consegui excluir.'));
        }, 'perigo-sec')))));
  }).catch(() => trocar(box, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'Os documentos não carregaram agora.', btn('Tentar de novo', docCarregar, 'sec')))));
}
