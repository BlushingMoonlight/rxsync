// ---------------------------------------------------------------- Assistente (molde D): o estado no topo, depois o que ela sabe, como ela fala e o que ela pode fazer
const GRUPOS_IA = [
  ['O que ela sabe', [['clinica', 'Sua clínica', 'clinica', 'Quem vocês são e o que fazem. É daqui que a assistente tira a maior parte das respostas.'],
    ['valores', 'Valores, convênios e regras', 'etiqueta', 'Preços, formas de pagamento, convênios e regras de agendamento.'],
    ['extras', 'Informações extras', 'notas', 'Avisos, campanhas, preparo de exames e tudo o que não coube nos outros itens.'],
    ['faq', 'Perguntas frequentes', 'pergunta', 'As perguntas e respostas que vocês mandaram no onboarding.']]],
  ['Como ela fala', [['conversa', 'Jeito de conversar', 'chat', 'Como a assistente cumprimenta, que tom usa e o que informa sobre horários.'],
    ['automaticas', 'Mensagens automáticas', 'sino', 'O que ela envia sozinha: lembretes, retomada de conversa, pesquisa de satisfação, retorno e convites.'],
    ['limites', 'Limites', 'proibido', 'Assuntos e palavras que ela evita, e números que ela não responde.']]],
  ['O que ela pode fazer', [['urgencia', 'Urgência e equipe', 'alerta', 'Quando a assistente chama uma pessoa da equipe e para quem ela avisa.'],
    ['funcoes', 'O que ela faz', 'brilho', 'Cada função com o estado e o lugar dela.']]]];
const CAMPOS_DA = g => CAMPOS.filter(c => c.grupo === g).map(c => c.key);
tela('assistente', {
  montar: () => [cabTela('Assistente', { sub: 'O que a assistente sabe e como ela atende seus pacientes no WhatsApp. As mudanças valem na hora.' }),
    el('div', { class: 'cartao pad bloco', id: 'cardPausa' }, el('p', { class: 'tit-bloco' }, el('span', { class: 'ponto', 'data-ponto': '' }), el('span', { 'data-estado-curto': '', text: '…' })),
      el('p', { class: 'mudo', id: 'pausaTxt', text: 'Carregando…' }), el('div', { class: 'linha-botoes pilha', id: 'iaAcoes' })),
    GRUPOS_IA.map(([titulo, itens]) => el('div', { class: 'bloco' }, el('h2', { text: titulo }), el('div', { class: 'lista' }, itens.map(([k, t, ic]) => linhaLink(t, null, 'assistente/' + k, ic)))))],
  entrar: () => { assistenteEstadoRender(); assistenteResumos(); }
});
function assistenteEstadoRender() {
  const txt = $('pausaTxt'), acoes = $('iaAcoes'); if (!txt) return;
  const e = estadoAssistente(), desde = pausaQuando(PAUSA && PAUSA.pausada_em);
  document.querySelectorAll('#cardPausa [data-ponto]').forEach(p => { p.className = 'ponto ' + e.ponto; });
  document.querySelectorAll('#cardPausa [data-estado-curto]').forEach(p => { p.textContent = e.curto; });
  let t = e.t2;
  if (!sessao) t = 'Para pausar pelo painel, crie sua senha (a faixa no alto da tela).';
  else if (!PAUSA) t = 'Não consegui ver a situação da assistente agora. Abra o painel de novo em instantes.';
  else if (PAUSA.pode_pausar) t = 'A assistente está atendendo. Pausar faz ela parar de responder os pacientes no WhatsApp: as mensagens continuam chegando para a equipe responder, e os lembretes e avisos automáticos também param. Dá para retomar aqui a qualquer momento.';
  else if (PAUSA.pode_retomar) t = 'Pausada pelo painel' + (desde ? ' desde ' + desde : '') + '. As mensagens chegam para a equipe responder.';
  else if (pausada()) t = 'Pausada pela RXSync. Para ela voltar, fale com a RXSync respondendo um e-mail nosso.';
  else if (CONTA.situacao === 'em_teste' || CONTA.situacao === 'teste_aguardando' || CONTA.situacao === 'teste_encerrado' || CONTA.no_ar === false) t = e.t2 + ' A pausa pelo painel vale quando a assistente está no ar com o plano contratado.';
  txt.textContent = t;
  const l = [];
  if (sessao && PAUSA && PAUSA.pode_pausar) l.push(el('button', { class: 'btn sec', type: 'button', id: 'btnPausa', text: 'Pausar a assistente', onclick: () => pausaAgir('assistente_pausar') }));
  else if (sessao && PAUSA && PAUSA.pode_retomar) l.push(el('button', { class: 'btn pri', type: 'button', id: 'btnPausa', text: 'Retomar a assistente', onclick: () => pausaAgir('assistente_retomar') }));
  else l.push(el('button', { class: 'btn sec', type: 'button', id: 'btnPausa', hidden: true, text: 'Pausar a assistente' }));
  if (TESTE.aberto) l.push(el('button', { class: 'btn pri', type: 'button', id: 'btnVoltarWhats', text: 'Voltar a atender no WhatsApp', onclick: () => voltarWhats() }));
  else l.push(el('button', { class: 'btn sec', type: 'button', id: 'btnTeste', onclick: () => testar(false) }, icone('frasco', 'p'), 'Testar a assistente'));
  trocar(acoes, l);
}
function assistenteResumos() {
  document.querySelectorAll('#telas [data-tela="assistente"] .linha').forEach(b => {
    const k = (b.getAttribute('data-ir') || '').split('/')[1], t2 = b.querySelector('.t2') || el('span', { class: 't2' });
    let txt = '';
    const cs = CAMPOS.filter(c => c.grupo === k && !['select', 'multi', 'switch'].includes(c.tipo) && !c.depende);
    if (k === 'automaticas') txt = lembretesLigados() ? 'Lembretes ' + String(VAL.lembrete_horarios && VAL.lembrete_horarios !== 'nao' ? VAL.lembrete_horarios : '24,2').split(',').map(x => x === 'M' ? 'na manhã do dia' : x + 'h antes').join(' e ') : 'Lembretes desligados';
    else if (k === 'funcoes') { const n = FUNCOES_LIGAVEIS.filter(([f]) => ligado(f)).length; txt = n + ' de ' + FUNCOES_LIGAVEIS.length + ' ligadas aqui'; }
    else if (k === 'faq') txt = 'Para mudar, fale com a RXSync';
    else if (cs.length) { const cheios = cs.filter(c => String(VAL[c.key] || '').trim()).length; txt = cheios === cs.length ? 'Completo' : cheios + ' de ' + cs.length + ' preenchidos'; }
    t2.textContent = txt; if (!t2.parentNode) b.querySelector('.tx').append(t2);
  });
}
AO_SALVAR.push(() => { if (TELAS.assistente && TELAS.assistente.sec) assistenteResumos(); });
// Pausar e retomar (DEC-136): dono e equipe, pelo 29, com a sessão. Pausar é o mesmo que a pausa da Central (cláusula 8.4).
function pausaCarregar() {
  if (!sessao) { assistenteEstadoRender(); estadoMostrar(); return; }
  c29('assistente_estado').then(r => { if (r && r.sair) { location.reload(); return; } PAUSA = r && r.ok ? r : null; estadoMostrar(); });
}
async function pausaAgir(acao) {
  if (acao === 'assistente_pausar' && !(await confirmar({ titulo: 'Pausar a assistente?', texto: ['Ela para de responder os pacientes até alguém tocar em "Retomar". As mensagens chegam para a equipe; lembretes e avisos automáticos param.', 'A mensalidade continua (cláusula 8.4 dos Termos).'], botao: 'Pausar' }))) return;
  const r = await c29(acao);
  if (r && (r.sair || r.so_baixar)) { location.reload(); return; }
  if (r && (r.ok || r.status !== undefined)) PAUSA = Object.assign({}, PAUSA || {}, r);
  rapida((r && r.mensagem) || 'Não consegui agora. Tente de novo.', { ms: 6000 });
  estadoMostrar();
}
// Testar a assistente: salva o que estiver pendente; com o WhatsApp no ar, pede a confirmação (tira a assistente do WhatsApp até "Voltar").
async function testar(confirmado) {
  if (!(await salvarPendentes())) { rapida('Não consegui salvar o que você escreveu. Tente de novo.'); return; }
  let r;
  try { r = await c23('testar', { confirmar: !!confirmado }); } catch (e) { rapida('Erro ao abrir o teste. Tente de novo.'); return; }
  if (r.ok && r.link) {
    TESTE.aberto = true; estadoMostrar();
    const f = folha('Testar a assistente', el('div', {}, el('p', { class: 'bloco', text: r.mensagem || 'Pronto! Também enviamos por e-mail.' }),
      el('a', { class: 'btn pri plena', href: r.link, target: '_blank', rel: 'noopener', id: 'testeLink' }, 'Conversar com a assistente'),
      el('p', { class: 'dica', text: 'Converse com ela como se fosse um paciente; as mensagens do teste não chegam a ninguém. Enquanto o teste estiver aberto, a assistente não responde no WhatsApp da clínica. Quando terminar, toque em "Voltar a atender no WhatsApp".' })),
      { pe: [btn('Voltar a atender no WhatsApp', () => { f.fechar(); voltarWhats(); }, 'sec'), btn('Fechar', () => f.fechar(), 'fant')] });
    return;
  }
  if (r.precisa_confirmar) {
    if (await confirmar({ titulo: 'Abrir o teste?', texto: ['Seu WhatsApp está conectado. Ao abrir o teste, a assistente para de responder no WhatsApp da clínica até você tocar em "Voltar a atender no WhatsApp".'], botao: 'Abrir o teste' })) testar(true);
    return;
  }
  rapida(r.mensagem || 'Não consegui gerar o teste.');
}
function voltarWhats() {
  c23('whatsapp').then(r => { if (r.ok) { TESTE.aberto = false; estadoMostrar(); } rapida(r.mensagem || (r.ok ? 'A assistente voltou a atender no WhatsApp.' : 'Não consegui voltar ao WhatsApp.')); })
    .catch(() => rapida('Erro de conexão. Tente de novo.'));
}
// ---------------------------------------------------------------- as páginas de cada assunto (molde E): salvo ao sair de cada campo
const VOLTA_IA = ['assistente', 'Assistente'];
const paginaIa = (k, titulo, sub, corpo) => tela('assistente/' + k, { montar: () => [cabTela(titulo, { voltar: VOLTA_IA, sub }), corpo(), el('p', { class: 'legenda pilha', text: 'Salvo ao sair de cada campo.' })], entrar: () => dependenciasAplicar() });
GRUPOS_IA.forEach(([, itens]) => itens.forEach(([k, t, , sub]) => { if (!['automaticas', 'limites', 'funcoes', 'faq'].includes(k)) paginaIa(k, t, sub, () => blocoCampos(CAMPOS_DA(k))); }));
paginaIa('limites', 'Limites', 'Assuntos e palavras que a assistente evita, e números que ela não responde.', () => [blocoCampos(['func_regras_linguagem']),
  el('div', { class: 'dependente pilha', 'data-depende': 'func_regras_linguagem' }, blocoCampos(['restricoes', 'nunca_dizer'])),
  el('h2', { class: 'tit-bloco pilha', text: 'Números que ela não responde' }), blocoCampos(['numeros_sem_ia'])]);
// Mensagens automáticas: lembretes num controle só (decisão 7: func_lembretes e os horários), retomada, pesquisa, retorno e convites.
const lembretesLigados = () => ligado('func_lembretes') && String(VAL.lembrete_horarios || '').trim() !== 'nao';
paginaIa('automaticas', 'Mensagens automáticas', 'O que a assistente envia sozinha aos pacientes.', () => {
  const { hid, sw } = chaveEl('lembretes', 'Lembretes de consulta', { semId: true, valor: lembretesLigados, aoMudar: async lig => {
    if (!(await salvarCampo('func_lembretes', lig ? 'SIM' : ''))) return false;
    if (lig && String(VAL.lembrete_horarios || '').trim() === 'nao') { if (!(await salvarCampo('lembrete_horarios', '24,2'))) return false; sincronizarCampo('lembrete_horarios'); }
    rapida(lig ? 'Ligado: lembretes de consulta.' : 'Desligado: lembretes de consulta.', { desfazer: () => salvarCampo('func_lembretes', lig ? '' : 'SIM').then(() => sincronizarCampo('lembretes')) });
    document.querySelectorAll('[data-lembretes]').forEach(x => x.classList.toggle('oculto', !lembretesLigados()));
    return true;
  } });
  hid.setAttribute('data-campo', 'lembretes');
  const horarios = el('div', { class: 'dependente' + (lembretesLigados() ? '' : ' oculto'), 'data-lembretes': '' }, campoEl('lembrete_horarios'));
  return [el('h2', { class: 'tit-bloco', text: 'Lembretes de consulta' }), el('div', { class: 'cartao campos bloco' }, el('div', { class: 'chave-linha', id: 'fld_lembretes' }, el('div', { class: 'tx' },
    el('div', { class: 't1' }, 'Lembretes de consulta', el('span', { class: 'estado-campo', 'data-estado-campo': 'func_lembretes' })), el('p', { class: 'dica', text: 'Mensagem antes da consulta, pedindo a confirmação de presença, para reduzir faltas.' })), sw, hid), horarios),
    el('h2', { class: 'tit-bloco', text: 'Retomar conversa parada' }), blocoCampos(['followup_horas']),
    el('h2', { class: 'tit-bloco pilha', text: 'Pesquisa de satisfação e avaliação no Google' }), blocoCampos(['pesquisa_ativa', 'pesquisa_horas', 'link_avaliacao_google'], { beneficio: 'Depois da consulta, a assistente pede uma nota e convida o paciente a avaliar a clínica no Google.' }),
    el('h2', { class: 'tit-bloco pilha', text: 'Retorno e convites' }), blocoCampos(['func_retorno', 'retorno_prazo_dias', 'func_reativacao', 'reativacao_dias', 'relac_limite_dia'], { beneficio: 'A assistente avisa quem passou do prazo de retorno e convida quem não volta há um tempo.' })];
});
// Perguntas frequentes: o lugar fica reservado; mudar pelo painel precisa do servidor (decisão 10, "Fora do escopo" do plano).
paginaIa('faq', 'Perguntas frequentes', 'As perguntas e respostas que vocês mandaram no onboarding continuam valendo para a assistente.', () => [
  el('div', { class: 'cartao pad' }, el('p', { text: 'Por enquanto, as perguntas frequentes não mudam pelo painel. Para trocar ou acrescentar uma, escreva para a RXSync e a equipe atualiza para você.' }),
    el('div', { class: 'pilha' }, el('a', { class: 'btn sec', href: 'mailto:contato@rxsync.com.br?subject=Perguntas%20frequentes%20da%20assistente', text: 'Escrever para contato@rxsync.com.br' })),
    el('p', { class: 'dica', text: 'Enquanto isso, o que mudar com frequência (avisos, preparo de exames, campanhas) pode ir em Informações extras.' }))]);
// O que ela faz (D): cada função com o estado; as sem nada para configurar ligam aqui, as outras levam à página delas.
const FUNCOES_LIGAVEIS = [['func_agendamento', 'Agendamento pela assistente'], ['func_briefing', 'Resumo do paciente'], ['func_tipo_visita', '1ª vez ou retorno no resumo'],
  ['func_reconhecer', 'Reconhecer quem volta'], ['func_documentos', 'Leitura de fotos e PDFs'], ['func_fila', 'Lista de espera']];
const FUNCOES_EM_OUTRO_LUGAR = [['Lembretes de consulta', () => lembretesLigados(), 'assistente/automaticas'], ['Avisar retorno vencido', () => ligado('func_retorno'), 'assistente/automaticas'],
  ['Convidar quem sumiu', () => ligado('func_reativacao'), 'assistente/automaticas'], ['Pesquisa de satisfação', () => ligado('pesquisa_ativa'), 'assistente/automaticas'],
  ['Regras de linguagem', () => ligado('func_regras_linguagem'), 'assistente/limites'], ['Não atender em feriados', () => feriadosLigados(), 'agenda/horarios/feriados'],
  ['Agenda por médico', () => ligado('func_medicos'), 'agenda/horarios/medicos'], ['Perguntas antes de agendar', () => ligado('func_preconsulta'), 'agenda/horarios/perguntas'],
  ['Agrupar pacientes', () => ligado('func_empilhamento'), 'agenda/horarios/regras'], ['Mandar o link de pagamento', () => ligado('func_pagamento_link'), 'agenda/horarios/pagamento'],
  ['Integração com o Reservio', () => ligado('func_reservio'), 'agenda/horarios/integracao/reservio'], ['Enviar link de agendamento', () => ligado('link_agendamento_ativo'), 'agenda/horarios/integracao/link']];
tela('assistente/funcoes', {
  montar: () => [cabTela('O que ela faz', { voltar: VOLTA_IA, sub: 'Ligue ou desligue cada recurso. O que estiver desligado, a assistente não faz.' }), blocoCampos(FUNCOES_LIGAVEIS.map(f => f[0])),
    el('h2', { class: 'tit-bloco pilha', text: 'Ligadas em outras páginas' }), el('div', { class: 'lista', id: 'funcOutras' })],
  entrar: () => trocar($('funcOutras'), FUNCOES_EM_OUTRO_LUGAR.map(([t, v, rota]) => linhaLink(t, null, rota, null, v() ? 'Ligada' : 'Desligada')))
});
