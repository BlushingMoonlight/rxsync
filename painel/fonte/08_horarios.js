// ---------------------------------------------------------------- Agenda › Horários (molde D): os ajustes da agenda, uma página por assunto
// O nome "Agenda › Horários" continua porque o servidor o cita (workflows 12, 13 e 32).
const VOLTA_HOR = ['agenda/horarios', 'Horários'];
tela('agenda/horarios', {
  montar: () => [cabTela('Horários', { voltar: ['agenda', 'Agenda'], sub: 'Como a assistente marca as consultas: os dias e horários, as regras, os médicos, os feriados e como os pacientes pagam.' }),
    el('div', { id: 'horIndice' }),
    el('div', { class: 'bloco pilha' }, el('p', { class: 'mudo peq', text: 'Ficou alguma dúvida? A equipe da RXSync ajuda a deixar a agenda do jeito da clínica.' }),
      el('button', { class: 'btn sec plena', type: 'button', id: 'btnPedirAjudaAgendamento', text: 'Pedir ajuda para configurar', onclick: e => pedirAjuda(e.currentTarget) }),
      el('p', { class: 'mudo peq', id: 'msgPedirAjuda', 'aria-live': 'polite' }))],
  entrar: () => { horIndice(); gradeCarregar().then(horIndice); intStatus().then(horIndice); }
});
const INT = { status: null };
function horIndice() {
  const box = $('horIndice'); if (!box) return;
  const dias = new Set((GRADE.dados || []).map(g => g.dia)).size, med = MED.dados.filter(m => m.ativo).length;
  const st = INT.status || {};
  trocar(box, el('div', { class: 'lista bloco' },
    linhaLink('Horários de atendimento', MED.modo ? 'Cada médico tem os próprios horários' : (st.conectado && st.importar_horarios !== false && (st.horarios || []).length ? 'Vêm do ' + (st.plataforma_nome || 'Reservio') : dias ? pl(dias, 'dia', 'dias') + ' com atendimento' : 'Nenhum dia com atendimento'), 'agenda/horarios/grade', 'relogio'),
    linhaLink('Regras da agenda', 'Consulta de ' + duracaoPadrao() + ' min' + (VAL.buffer_min && VAL.buffer_min !== '0' ? ', intervalo de ' + VAL.buffer_min + ' min' : ''), 'agenda/horarios/regras', 'ajustes'),
    linhaLink('Médicos e tipos', sem('medicos') ? 'Plano Gestão' : (ligado('func_medicos') ? 'Agenda por médico ligada' : 'Agenda por médico desligada') + (med ? ' · ' + pl(med, 'médico', 'médicos') : ''), 'agenda/horarios/medicos', 'medico'),
    linhaLink('Perguntas antes de agendar', sem('preconsulta') ? 'Plano Gestão' : ligado('func_preconsulta') ? 'Ligada' : 'Desligada', 'agenda/horarios/perguntas', 'pergunta'),
    linhaLink('Feriados', feriadosLigados() ? 'Não atende em feriados' + (FER.cfg && FER.cfg.cidade ? ' · ' + FER.cfg.cidade + '/' + FER.cfg.uf : '') : 'Atende em feriados', 'agenda/horarios/feriados', 'agenda'),
    linhaLink('Receber dos pacientes', ligado('func_pagamento_link') ? 'Link de pagamento ligado' : 'Link de pagamento desligado', 'agenda/horarios/pagamento', 'dinheiro'),
    linhaLink('Integração e planilhas', st.conectado ? (st.plataforma_nome || 'Reservio') + ' conectado' : 'Reservio, link do seu sistema e importar a agenda', 'agenda/horarios/integracao', 'link')));
}
function pedirAjuda(b) {
  b.disabled = true;
  c24('salvar', { pedir_ajuda_agendamento: true }).then(r => { b.disabled = false; $('msgPedirAjuda').textContent = r.ok ? 'Pedido enviado! A equipe vai te procurar.' : (r.mensagem || 'Não consegui enviar.'); })
    .catch(() => { b.disabled = false; $('msgPedirAjuda').textContent = 'Erro ao enviar. Tente de novo.'; });
}

// ---------------------------------------------------------------- Horários de atendimento (E): a grade, um dia por linha, "Salvar" fixo embaixo
const DIAS_SEM = [[1, 'Segunda'], [2, 'Terça'], [3, 'Quarta'], [4, 'Quinta'], [5, 'Sexta'], [6, 'Sábado'], [0, 'Domingo']];
let gradeEdit = null;
function gradeCarregar() {
  return d24('agenda_grade_listar').then(rows => { GRADE.dados = rows || []; if (AG.visao !== 'lista') calRender(); })
    .catch(() => { GRADE.erro = true; });
}
tela('agenda/horarios/grade', {
  montar: () => [cabTela('Horários de atendimento', { voltar: VOLTA_HOR, sub: 'A assistente só oferece horários dentro destas faixas. Dia sem faixa é dia sem atendimento. Para folgas e imprevistos, use "Bloquear horário" na Agenda.' }),
    el('div', { id: 'gradeAvisos' }), el('div', { id: 'gradeBox' }), el('button', { class: 'btn pri acao-fixa plena', type: 'button', id: 'gradeSalvar', text: 'Salvar horários', onclick: gradeSalvar })],
  entrar: () => { gradeEdit = null; trocar($('gradeBox'), el('div', { class: 'cartao' }, esqueleto())); Promise.all([gradeCarregar(), intStatus(), medCarregar()]).then(gradeDesenharTela); }
});
function gradeDesenharTela() {
  const st = INT.status || {}, vem = st.conectado && st.importar_horarios !== false && (st.horarios || []).length;
  const av = [];
  if (MED.modo) av.push(aviso('', 'Sua clínica usa agenda por médico: cada médico tem os próprios horários, em ', el('button', { class: 'link', type: 'button', 'data-ir': 'agenda/horarios/medicos', text: 'Médicos e tipos' }), '. Os horários gerais da clínica ficam guardados aqui.'));
  if (vem) av.push(aviso('', 'Estes horários vêm do ' + (st.plataforma_nome || 'Reservio') + ' e se atualizam sozinhos. Para mudar, altere lá ou desligue essa opção em Integração e planilhas.'));
  trocar($('gradeAvisos'), av);
  if (!gradeEdit) gradeEdit = (GRADE.dados || []).map(g => ({ dia: g.dia, inicio: g.inicio, fim: g.fim }));
  const travar = !!vem;
  trocar($('gradeBox'), el('div', { class: 'cartao bloco', 'aria-disabled': travar ? 'true' : null }, gradeEditor(gradeEdit, () => gradeDesenharTela(), travar)));
  $('gradeSalvar').hidden = travar;
}
function gradeEditor(lista, redesenhar, travar) {
  return DIAS_SEM.map(([d, nome]) => {
    const faixas = lista.map((g, i) => [g, i]).filter(([g]) => g.dia === d);
    return el('div', { class: 'dia-grade' }, el('div', { class: 'topo-dia' }, el('strong', { text: nome }),
      travar ? null : el('button', { class: 'btn fant', type: 'button', 'aria-label': 'Adicionar faixa de ' + nome, onclick: () => { lista.push({ dia: d, inicio: '09:00', fim: '12:00' }); redesenhar(); } }, icone('soma', 'p'), 'Faixa')),
      faixas.length ? faixas.map(([g, i]) => el('div', { class: 'faixa-hora' },
        el('input', { class: 'entrada', type: 'time', value: g.inicio, disabled: travar, 'aria-label': nome + ': começo', onchange: e => { g.inicio = e.target.value; } }), el('span', { class: 'mudo', text: 'até' }),
        el('input', { class: 'entrada', type: 'time', value: g.fim, disabled: travar, 'aria-label': nome + ': fim', onchange: e => { g.fim = e.target.value; } }),
        travar ? null : el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Remover esta faixa de ' + nome, onclick: () => { lista.splice(i, 1); redesenhar(); } }, icone('fechar'))))
        : el('p', { class: 'mudo peq', text: 'Sem atendimento' }));
  });
}
function gradeSalvar() {
  const b = $('gradeSalvar'); b.disabled = true; b.textContent = 'Salvando…';
  d24('agenda_grade_salvar', { grade: gradeEdit }).then(res => {
    b.disabled = false; b.textContent = 'Salvar horários';
    if (res && res.ok) { rapida('Horários salvos.'); gradeEdit = null; gradeCarregar().then(gradeDesenharTela); }
    else rapida('Confira os horários: o fim precisa ser depois do começo, e as faixas de um mesmo dia não podem se sobrepor.', { ms: 8000 });
  }).catch(() => { b.disabled = false; b.textContent = 'Salvar horários'; rapida('Não foi salvo: sem conexão. Tente de novo.'); });
}

// ---------------------------------------------------------------- Regras da agenda (E): duração, intervalo, antecedência, janela, fuso e agrupar pacientes
tela('agenda/horarios/regras', {
  montar: () => [cabTela('Regras da agenda', { voltar: VOLTA_HOR, sub: 'Como a assistente calcula os horários livres. Salvo ao sair de cada campo.' }),
    blocoCampos(['duracao_padrao_min', 'buffer_min', 'antecedencia_minima_h', 'janela_agendamento_dias', 'fuso_horario']),
    el('h2', { class: 'tit-bloco pilha', text: 'Agrupar pacientes' }), blocoCampos(['func_empilhamento'], { beneficio: 'A assistente oferece primeiro os horários colados às consultas já marcadas, para a agenda não ficar picada.' })]
});

// ---------------------------------------------------------------- Médicos e tipos (D + C): a chave "Agenda por médico" no topo e a lista
function medCarregar() {
  if (sem('medicos')) return Promise.resolve();
  return d24('agenda_medicos_listar').then(r => {
    MED.dados = (r && r.medicos) || []; MED.padrao = (r && r.funcoes_padrao) || MED.padrao;
    const antes = MED.modo; MED.modo = !!(r && r.modo_medicos); MED.reservio = !!(r && r.reservio_ativo);
    medAvisos(); medLista(); if (MED.redesenhar) MED.redesenhar();   // a folha aberta mostra o que o servidor guardou
    if (AG.carregou) { agMostrar(); if (antes !== MED.modo) calCarregar(); }
  }).catch(() => { const l = $('medLista'); if (l) trocar(l, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'Os médicos não carregaram agora.'))); });
}
tela('agenda/horarios/medicos', {
  montar: () => sem('medicos') ? [cabTela('Médicos e tipos', { voltar: VOLTA_HOR }), blocoCampos(['func_medicos'], { beneficio: 'Cada médico com os próprios horários e tipos de consulta, e a assistente pergunta com qual médico o paciente quer consultar.' })]
    : [cabTela('Médicos e tipos', { voltar: VOLTA_HOR }), el('div', { id: 'medBox' }, blocoCampos(['func_medicos']),
      el('div', { class: 'pilha' }, aviso('ok', 'Sua clínica usa agenda por médico: cada médico tem os próprios horários, aqui embaixo. Os horários gerais da clínica ficam guardados. Para voltar a uma agenda só, desligue “Agenda por médico” no alto desta página.'),
        aviso('', 'A agenda por médico está desligada: a assistente usa os horários de atendimento da clínica. Para ela usar os médicos abaixo, ligue “Agenda por médico” no alto desta página.'),
        aviso('', 'A agenda por médico fica pausada enquanto a integração com o Reservio estiver ligada. Por enquanto, a assistente usa os horários de atendimento da clínica.')),
      el('h2', { class: 'tit-bloco pilha', text: 'Médicos' }), el('div', { id: 'medLista' }, el('div', { class: 'cartao' }, esqueleto())),
      el('div', { class: 'cartao pad bloco pilha' }, el('div', { class: 'campo form' }, el('label', { for: 'medNovoNome', text: 'Adicionar médico' }),
        el('input', { class: 'entrada', id: 'medNovoNome', type: 'text', maxlength: '80', placeholder: 'Nome do médico (ex.: Dra. Ana Souza)' })), btn('Adicionar', medAdicionar, 'sec plena', 'soma', { id: 'medNovoBtn' })))],
  entrar: (p, sec) => { const avs = sec.querySelectorAll('.pilha > .aviso'); if (avs.length === 3) { avs[0].id = 'medModoAviso'; avs[1].id = 'medDesligadoAviso'; avs[2].id = 'medPausaReservio'; } medAvisos(); medCarregar(); }
});
AO_SALVAR.push(k => { if (k === 'func_medicos') medCarregar(); });
function medAvisos() {
  if (!$('medModoAviso')) return;
  const ativos = MED.dados.filter(m => m.ativo).length;
  $('medModoAviso').hidden = !MED.modo;
  $('medPausaReservio').hidden = !(MED.reservio && ativos);
  $('medDesligadoAviso').hidden = !(!MED.modo && !MED.reservio && ativos);   // médicos cadastrados com a chave desligada (DEC-103)
}
function medLista() {
  const box = $('medLista'); if (!box) return;
  if (!MED.dados.length) { trocar(box, el('div', { class: 'cartao' }, vazio('Nenhum médico cadastrado', 'Sem médicos, a agenda é uma só para a clínica.'))); return; }
  trocar(box, el('div', { class: 'lista' }, MED.dados.map(m => el('button', { class: 'linha', type: 'button', onclick: () => medAbrir(m) }, el('span', { class: 'ic' }, icone('medico')),
    el('span', { class: 'tx' }, el('span', { class: 't1', text: m.nome }), el('span', { class: 't2', text: (m.consultas_futuras ? pl(m.consultas_futuras, 'consulta marcada', 'consultas marcadas') : 'Sem consultas marcadas') + ' · ' + ((m.grade || []).length ? pl((m.grade || []).length, 'faixa', 'faixas') + ' de horário' : 'sem horários') + ' · ' + pl((m.tipos || []).filter(t => t.ativo).length, 'tipo', 'tipos') }),
      m.ativo && !(m.grade || []).length ? el('span', { class: 'etqs' }, etq('Sem horários: a assistente não marca com este médico', 'atencao', 'alerta')) : null),
    !m.ativo ? etq('Removido', '') : null, el('span', { class: 'seta' }, icone('seta'))))));
}
async function medAcao(acao, dados, ok) {
  try { const r = await d24(acao, dados); if (r && r.ok) { if (ok) ok(r); await medCarregar(); } else rapida(r && r.mensagem ? r.mensagem : r && r.erro === 'limite' ? 'Limite atingido.' : 'Não consegui salvar. Confira os dados e tente de novo.'); return r; }
  catch (e) { rapida('Não foi salvo: sem conexão. Tente de novo.'); return null; }
}
async function medAdicionar() {
  const i = $('medNovoNome'), n = i.value.trim(); if (!n) { rapida('Escreva o nome do médico.'); i.focus(); return; }
  if (!MED.dados.some(m => m.ativo) && !(await confirmar({ titulo: 'Passar a agenda para "por médico"?', texto: ['Com o primeiro médico, cada médico tem os próprios horários (' + n + ' começa com uma cópia dos horários da clínica) e a assistente pergunta com qual médico o paciente quer consultar.',
    MED.reservio ? 'Enquanto a integração com o Reservio estiver ligada, isso fica pausado.' : null, 'Os horários gerais da clínica ficam guardados.'], botao: 'Adicionar' }))) return;
  medAcao('agenda_medico_salvar', { nome: n }, () => { i.value = ''; rapida('Médico adicionado.'); });
}
// Um médico (C): as chaves, os tipos de consulta, os horários, renomear e remover (no fim).
function medAbrir(m0) {
  const id = m0.id; let f;
  const montar = () => {
    const m = MED.dados.find(x => x.id === id) || m0;
    const fun = k => Object.prototype.hasOwnProperty.call(m.funcoes || {}, k) ? m.funcoes[k] : MED.padrao[k];
    const chaveMed = (k, t, dica, ligadoTxt, desligadoTxt) => {
      const { sw } = chaveEl('med_' + k, t, { semId: true, valor: () => !!fun(k), aoMudar: lig => medAcao('agenda_medico_funcao', { medico_id: m.id, funcao: k, ligado: lig }, () => rapida(lig ? ligadoTxt : desligadoTxt, { desfazer: () => medAcao('agenda_medico_funcao', { medico_id: m.id, funcao: k, ligado: !lig }) })).then(r => !!(r && r.ok)) });
      return el('div', { class: 'chave-linha' }, el('div', { class: 'tx' }, el('div', { class: 't1', text: t }), el('p', { class: 'dica', text: dica })), sw);
    };
    if (!m.ativo) return [el('p', { class: 'mudo', text: 'Removido: não recebe consultas novas. As que já estavam marcadas continuam.' }), el('div', { class: 'pilha' }, btn('Reativar', () => medAcao('agenda_medico_ativo', { id: m.id, ativo: true }, () => { rapida('Reativado.'); f.fechar(); }), 'pri plena'))];
    const gradeLista = (m.grade || []).map(g => ({ dia: g.dia, inicio: g.inicio, fim: g.fim }));
    const gradeBox = el('div', { class: 'cartao' });
    const desenharGrade = () => trocar(gradeBox, gradeEditor(gradeLista, desenharGrade, false));
    desenharGrade();
    return [el('div', { class: 'item-cab' }, el('span', { class: 'av', text: iniciais(m.nome) }), el('div', { class: 'tx' }, el('h2', { text: m.nome }), el('p', { class: 'mudo', text: m.consultas_futuras ? pl(m.consultas_futuras, 'consulta marcada', 'consultas marcadas') + ' daqui para a frente' : 'Sem consultas marcadas' }))),
      el('div', { class: 'cartao campos bloco' }, chaveMed('agendamento', 'A assistente marca com este médico', 'Desligado, só a equipe marca.', 'A assistente marca para ' + m.nome + '.', 'A assistente não marca mais para ' + m.nome + '.'),
        chaveMed('paga_consultorio', 'Paciente paga no consultório', 'Ligado, a assistente não manda o link de pagamento das consultas com este médico.', 'A assistente não manda link de pagamento para ' + m.nome + '.', 'A assistente manda o link de pagamento para ' + m.nome + '.')),
      el('h2', { class: 'tit-bloco', text: 'Tipos de consulta' }),
      el('p', { class: 'dica bloco', text: 'A assistente confirma o tipo com o paciente e usa a duração dele para oferecer os horários. Os horários começam de ' + duracaoPadrao() + ' em ' + duracaoPadrao() + ' minutos (a duração padrão da clínica). Com tipos cadastrados, toda consulta deste médico precisa de um tipo.' }),
      (m.tipos || []).length ? el('div', { class: 'lista bloco' }, m.tipos.map(t => el('button', { class: 'linha', type: 'button', onclick: () => t.ativo ? tipoForm(m, t) : medAcao('agenda_tipo_ativo', { id: t.id, ativo: true }, () => rapida('Tipo reativado.')) },
        el('span', { class: 'tx' }, el('span', { class: 't1', text: t.nome + (t.ativo ? '' : ' (removido)') }), el('span', { class: 't2', text: [t.duracao_min + ' min', t.prazo_retorno_dias ? 'retorno em até ' + t.prazo_retorno_dias + ' dias' : null, t.link_pagamento ? 'link de pagamento próprio' : null,
          t.valor ? 'R$ ' + Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : null].filter(Boolean).join(' · ') })), el('span', { class: 'valor', text: t.ativo ? 'Editar' : 'Reativar' }))))
        : el('p', { class: 'mudo bloco', text: 'Nenhum tipo cadastrado.' }),
      el('div', { class: 'bloco' }, btn('Tipo de consulta', () => tipoForm(m, null), 'sec', 'soma')),
      el('h2', { class: 'tit-bloco', text: 'Horários de ' + m.nome }), el('p', { class: 'dica bloco', text: 'Sem faixas, este médico fica sem atendimento: a assistente não marca consultas com ele.' }), gradeBox,
      el('div', { class: 'pilha' }, btn('Salvar horários de ' + m.nome, () => d24('agenda_grade_medico_salvar', { medico_id: m.id, grade: gradeLista }).then(r => {
        if (r && r.ok) { rapida('Horários salvos.'); medCarregar(); } else rapida((r && r.mensagem) || 'Confira os horários: o fim precisa ser depois do começo, e as faixas de um mesmo dia não podem se sobrepor.', { ms: 8000 });
      }).catch(() => rapida('Não foi salvo: sem conexão.')), 'pri plena')),
      el('div', { class: 'pilha' }, btn('Renomear', () => renomear(m), 'sec plena')),
      el('div', { class: 'perigo-zona' }, btn('Remover ' + m.nome, async () => {
        const ultimo = MED.dados.filter(x => x.ativo).length === 1;
        if (ultimo && !(await confirmar({ titulo: 'Remover o último médico?', texto: ['É o último médico ativo: a agenda volta a ser uma só, com os horários gerais da clínica (que estão guardados).', m.consultas_futuras ? (m.consultas_futuras === 1 ? 'A consulta marcada continua valendo.' : 'As ' + m.consultas_futuras + ' consultas marcadas continuam valendo.') : null], botao: 'Remover', perigo: true }))) return;
        medAcao('agenda_medico_ativo', { id: m.id, ativo: false }, r => { f.fechar(); rapida(r.consultas_futuras ? 'Removido. ' + pl(r.consultas_futuras, 'consulta futura continua', 'consultas futuras continuam') + ' valendo.' : 'Removido.', { desfazer: () => medAcao('agenda_medico_ativo', { id: m.id, ativo: true }) }); });
      }, 'perigo-sec plena'))];
  };
  const corpo = el('div', {}, montar());
  f = folha('Médico', corpo, { larga: true, aoFechar: () => { MED.redesenhar = null; } });
  MED.redesenhar = () => trocar(corpo, montar());
}
const iniciais = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '?').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase(); };
function renomear(m) {
  const i = el('input', { class: 'entrada', id: 'medNome', type: 'text', maxlength: '80', value: m.nome });
  const salvar = el('button', { class: 'btn pri', type: 'button', text: 'Salvar' });
  const f = folha('Renomear', el('div', { class: 'form' }, el('div', { class: 'campo' }, el('label', { for: 'medNome', text: 'Nome do médico' }), i)), { pe: [btn('Cancelar', () => f.fechar(), 'sec'), salvar] });
  salvar.addEventListener('click', () => { const n = i.value.trim(); if (!n) return; medAcao('agenda_medico_salvar', { id: m.id, nome: n }, () => { f.limpar(); f.fechar(); rapida('Nome salvo.'); if (MED.redesenhar) MED.redesenhar(); }); });
}
function tipoForm(m, t) {
  const campo = (rot, i) => el('div', { class: 'campo' }, el('label', { for: i.id, text: rot }), i);
  const nome = el('input', { class: 'entrada', id: 'tpNome', type: 'text', maxlength: '80', value: t ? t.nome : '' });
  const dur = el('input', { class: 'entrada', id: 'tpDur', type: 'number', min: '5', max: '480', inputmode: 'numeric', value: String(t ? t.duracao_min : duracaoPadrao()) });
  const pr = el('input', { class: 'entrada', id: 'tpRet', type: 'number', min: '1', max: '730', inputmode: 'numeric', value: t && t.prazo_retorno_dias ? String(t.prazo_retorno_dias) : '' });
  const lk = el('input', { class: 'entrada', id: 'tpLink', type: 'url', maxlength: '500', inputmode: 'url', placeholder: 'https://...', value: t && t.link_pagamento ? t.link_pagamento : '' });
  const vl = el('input', { class: 'entrada', id: 'tpValor', type: 'text', maxlength: '12', inputmode: 'decimal', placeholder: '350,00', value: t && t.valor ? String(t.valor).replace('.', ',') : '' });
  const erro = el('div', { 'aria-live': 'polite' });
  const salvar = el('button', { class: 'btn pri', type: 'button', text: 'Salvar' });
  const f = folha(t ? 'Editar tipo de consulta' : 'Novo tipo de consulta', el('div', { class: 'form' }, campo('Nome (ex.: Primeira consulta, Retorno)', nome), campo('Duração (minutos, de 5 a 480)', dur),
    campo('Prazo de retorno (dias; vazio se não tiver retorno)', pr), campo('Link de pagamento deste tipo (opcional; vazio = o link geral da clínica)', lk), campo('Valor deste tipo, para o Asaas (opcional; vazio = o valor padrão da clínica)', vl), erro,
    t ? el('div', { class: 'perigo-zona' }, btn('Remover este tipo', () => medAcao('agenda_tipo_ativo', { id: t.id, ativo: false }, () => { f.limpar(); f.fechar(); rapida('Tipo removido.', { desfazer: () => medAcao('agenda_tipo_ativo', { id: t.id, ativo: true }) }); if (MED.redesenhar) MED.redesenhar(); }), 'perigo-sec plena')) : null),
  { pe: [btn('Cancelar', () => f.fechar(), 'sec'), salvar] });
  salvar.addEventListener('click', () => {
    trocar(erro);
    const d = { nome: nome.value.trim(), duracao_min: parseInt(dur.value, 10), prazo_retorno_dias: pr.value.trim(), link_pagamento: lk.value.trim(), valor: vl.value.trim() };
    if (t) d.id = t.id; else d.medico_id = m.id;
    if (!d.nome || !(d.duracao_min >= 5 && d.duracao_min <= 480)) { trocar(erro, aviso('perigo', 'Confira o nome e a duração (de 5 a 480 minutos).')); return; }
    if (d.valor && !/^(R\$\s*)?\d{1,6}([.,]\d{1,2})?$/.test(d.valor)) { trocar(erro, aviso('perigo', 'O valor precisa ser um número, como 350 ou 350,00.')); return; }
    if (d.link_pagamento && !/^https:\/\/[^\s<>"']+\.[^\s<>"']+$/i.test(d.link_pagamento)) { trocar(erro, aviso('perigo', 'O link de pagamento precisa começar com https:// e ser um endereço completo.')); return; }
    medAcao('agenda_tipo_salvar', d, () => { f.limpar(); f.fechar(); rapida('Tipo de consulta salvo.'); if (MED.redesenhar) MED.redesenhar(); });
  });
}

// ---------------------------------------------------------------- Perguntas antes de agendar (E + C): a chave no topo e a lista
const PRE = { perguntas: [], ligado: false, limite_por_tipo: 10, limite_texto: 300 };
tela('agenda/horarios/perguntas', {
  montar: () => [cabTela('Perguntas antes de agendar', { voltar: VOLTA_HOR, sub: 'Perguntas que a assistente faz ao paciente antes de marcar a consulta. As gerais valem para toda consulta; as de um tipo, só para aquele tipo. Até 10 perguntas ativas por grupo, com até 300 caracteres. As respostas (até 500 caracteres) aparecem na consulta e são apagadas 90 dias depois dela.' }),
    blocoCampos(['func_preconsulta'], { beneficio: 'Antes de marcar, a assistente faz as perguntas que a clínica cadastrar, e as respostas aparecem na consulta.' }),
    sem('preconsulta') ? null : [el('div', { id: 'preBox' }, el('div', { id: 'preLista' })), el('div', { class: 'pilha' }, btn('Pergunta', () => preForm(null), 'sec plena', 'soma', { id: 'preNovoBtn' }))]],
  entrar: () => { if (!sem('preconsulta')) { medCarregar(); preCarregar(); } }
});
AO_SALVAR.push(k => { if (k === 'func_preconsulta' && !sem('preconsulta')) preCarregar(); });
function preCarregar() {
  return d24('agenda_preconsulta_listar').then(r => { if (!r || !r.ok) throw new Error(); Object.assign(PRE, r); preDesenhar(); })
    .catch(() => { const l = $('preLista'); if (l) trocar(l, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'As perguntas não carregaram agora.'))); });
}
const preTipos = () => { const l = []; MED.dados.forEach(m => { if (m.ativo) (m.tipos || []).forEach(t => { if (t.ativo) l.push({ id: t.id, nome: m.nome + ' · ' + t.nome }); }); }); return l; };
const preGrupoNome = p => p.tipo_consulta_id ? (p.medico_nome ? p.medico_nome + ' · ' : '') + (p.tipo_nome || 'Tipo de consulta') : 'Gerais (todas as consultas)';
function preDesenhar() {
  const box = $('preLista'); if (!box) return;
  const ps = PRE.perguntas || [];
  const grupos = [], por = {};
  ps.forEach(p => { const k = p.tipo_consulta_id ? String(p.tipo_consulta_id) : ''; if (!por[k]) { por[k] = { nome: preGrupoNome(p), itens: [] }; grupos.push(por[k]); } por[k].itens.push(p); });
  trocar(box, !ps.length ? el('div', { class: 'cartao bloco' }, vazio('Nenhuma pergunta cadastrada', PRE.ligado ? null : 'Você já pode cadastrar; a assistente só pergunta com a chave ligada.')) : grupos.map(g => el('div', { class: 'bloco' },
    el('h2', { class: 'tit-bloco' }, g.nome, el('span', { class: 'extra', text: g.itens.filter(p => p.ativo).length + ' de ' + PRE.limite_por_tipo })),
    el('div', { class: 'lista' }, g.itens.map(p => el('button', { class: 'linha', type: 'button', onclick: () => p.ativo ? preForm(p) : preAcao('agenda_pergunta_ativo', { id: p.id, ativo: true }, () => rapida('Pergunta reativada.')) },
      el('span', { class: 'tx' }, el('span', { class: 't1', text: p.texto }), el('span', { class: 'etqs' }, etq(p.obrigatoria ? 'Obrigatória' : 'Opcional', p.obrigatoria ? 'atencao' : ''), etq('Ordem ' + p.ordem, ''), !p.ativo ? etq('Removida', '') : null)),
      el('span', { class: 'valor', text: p.ativo ? 'Editar' : 'Reativar' })))))));
}
async function preAcao(acao, dados, ok) {
  try {
    const r = await d24(acao, dados);
    if (r && r.ok) { if (ok) ok(r); preCarregar(); return r; }
    const e = r && r.erro;
    rapida(r && r.mensagem ? r.mensagem : e === 'texto' ? 'Escreva a pergunta (até ' + PRE.limite_texto + ' caracteres).' : e === 'tipo' ? 'Esse tipo de consulta não está disponível. Escolha outro.'
      : e === 'limite' ? 'Esse grupo já tem ' + PRE.limite_por_tipo + ' perguntas ativas. Remova uma antes.' : e === 'nao_encontrada' ? 'Pergunta não encontrada. Recarregue a página.' : 'Não consegui salvar. Confira os dados e tente de novo.', { ms: 7000 });
    return r;
  } catch (e) { rapida('Não foi salvo: sem conexão.'); return null; }
}
function preForm(p) {
  const tx = el('textarea', { class: 'entrada', id: 'preTexto', rows: '3', maxlength: String(PRE.limite_texto) }); tx.value = p ? p.texto : '';
  const cont = el('div', { class: 'contagem' }); const conta = () => { cont.textContent = tx.value.length + ' de ' + PRE.limite_texto; }; tx.addEventListener('input', conta); conta();
  const tipos = preTipos();
  if (p && p.tipo_consulta_id && !tipos.some(t => String(t.id) === String(p.tipo_consulta_id))) tipos.unshift({ id: p.tipo_consulta_id, nome: preGrupoNome(p) + ' (removido)' });
  const sel = el('select', { class: 'entrada', id: 'preVale' }, el('option', { value: '', text: 'Todas as consultas (pergunta geral)' }), tipos.map(t => el('option', { value: String(t.id), text: t.nome })));
  sel.value = p && p.tipo_consulta_id ? String(p.tipo_consulta_id) : '';
  const ob = el('input', { type: 'checkbox', checked: !!(p && p.obrigatoria) });
  const od = el('input', { class: 'entrada', id: 'preOrdem', type: 'number', min: '0', max: '99', inputmode: 'numeric', value: p ? String(p.ordem) : '0' });
  const salvar = el('button', { class: 'btn pri', type: 'button', text: 'Salvar' });
  const f = folha(p ? 'Editar pergunta' : 'Nova pergunta', el('div', { class: 'form' },
    el('div', { class: 'campo' }, el('label', { for: 'preTexto', text: 'Pergunta' }), tx, cont),
    el('div', { class: 'campo' }, el('label', { for: 'preVale', text: 'Vale para' }), sel, !preTipos().length ? el('p', { class: 'dica', text: 'Para perguntas de um tipo de consulta, cadastre os tipos em cada médico, em Médicos e tipos.' }) : null),
    el('label', { class: 'marcar' }, ob, el('span', { text: 'Obrigatória: a consulta só é marcada com esta resposta.' })),
    el('div', { class: 'campo' }, el('label', { for: 'preOrdem', text: 'Ordem (de 0 a 99; a menor é perguntada primeiro)' }), od),
    p ? el('div', { class: 'perigo-zona' }, btn('Remover esta pergunta', () => preAcao('agenda_pergunta_ativo', { id: p.id, ativo: false }, () => { f.limpar(); f.fechar(); rapida('Pergunta removida. As respostas que já existem continuam na consulta.', { desfazer: () => preAcao('agenda_pergunta_ativo', { id: p.id, ativo: true }) }); }), 'perigo-sec plena')) : null),
  { pe: [btn('Cancelar', () => f.fechar(), 'sec'), salvar] });
  salvar.addEventListener('click', () => {
    const texto = tx.value.trim(), ordem = od.value.trim() === '' ? 0 : Number(od.value);
    if (!texto) { rapida('Escreva a pergunta.'); return; }
    if (!(Number.isInteger(ordem) && ordem >= 0 && ordem <= 99)) { rapida('A ordem vai de 0 a 99.'); return; }
    const d = { texto, tipo_consulta_id: sel.value, obrigatoria: ob.checked, ordem }; if (p) d.id = p.id;
    preAcao('agenda_pergunta_salvar', d, () => { f.limpar(); f.fechar(); rapida('Pergunta salva.'); });
  });
}

// ---------------------------------------------------------------- Feriados (E): um controle só na tela (decisão 7) e a cidade do atendimento
// Grava as duas chaves de hoje (func_feriados e o "Não atender" de Feriados); juntá-las no banco fica para o servidor.
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const FACULTATIVOS = [['carnaval', 'Carnaval (segunda e terça)'], ['cinzas', 'Quarta-feira de Cinzas'], ['quinta_santa', 'Quinta-feira Santa'], ['corpus_christi', 'Corpus Christi'], ['vespera_natal', 'Véspera de Natal (24/12)'], ['vespera_ano_novo', 'Véspera de Ano Novo (31/12)']];
const FER = { cfg: null, prox: [], municipios: {} };
const feriadosLigados = () => ligado('func_feriados') && (!FER.cfg || FER.cfg.ativo !== false);
function ferCidades(uf) {
  if (!uf) return Promise.resolve([]);
  if (FER.municipios[uf]) return Promise.resolve(FER.municipios[uf]);
  return fetch('/assets/municipios/' + uf + '.json').then(r => r.json()).then(l => { FER.municipios[uf] = l; return l; }).catch(() => []);
}
function ferCarregar() { return d24('agenda_feriados_ver').then(d => { FER.cfg = (d && d.config) || {}; FER.prox = (d && d.proximos) || []; }).catch(() => { FER.erro = true; }); }
tela('agenda/horarios/feriados', {
  montar: () => [cabTela('Feriados', { voltar: VOLTA_HOR, sub: 'A assistente não oferece horários em feriados nacionais, do seu estado e da sua cidade.' }), el('div', { id: 'ferBox' }, el('div', { class: 'cartao' }, esqueleto()))],
  entrar: () => ferCarregar().then(ferRender)
});
function ferDados(ativo) {
  const c = FER.cfg || {};
  return { ativo, uf: c.uf || '', codigo_ibge: c.codigo_ibge ? String(c.codigo_ibge) : '', cidade: c.cidade || '', facultativos: c.facultativos || [], atende_em: FER.prox.filter(x => x.atende).map(x => x.data) };
}
function ferRender() {
  const box = $('ferBox'); if (!box) return;
  if (FER.erro && !FER.cfg) { trocar(box, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'Os feriados não carregaram agora.'))); return; }
  const cfg = FER.cfg || {};
  const { sw } = chaveEl('feriados', 'Não atender em feriados', { semId: true, valor: feriadosLigados, aoMudar: async lig => {
    if (!(await salvarCampo('func_feriados', lig ? 'SIM' : ''))) return false;
    try { const r = await d24('agenda_feriados_salvar', ferDados(lig)); if (r && r.ok === false) return false; FER.cfg.ativo = lig; } catch (e) { return false; }
    rapida(lig ? 'Ligado: não atende em feriados.' : 'Desligado: atende em feriados.'); ferRender(); horIndice(); return true;
  } });
  const topo = el('div', { class: 'cartao campos bloco' }, el('div', { class: 'chave-linha' }, el('div', { class: 'tx' }, el('div', { class: 't1', text: 'Não atender em feriados' }), el('p', { class: 'dica', text: 'A agenda pula sozinha os feriados da cidade da clínica.' })), sw));
  if (!feriadosLigados()) { trocar(box, topo, el('p', { class: 'desligado-linha', text: 'Desligada: a assistente oferece horários também nos feriados.' })); return; }
  const sUf = el('select', { class: 'entrada', id: 'ferUf', 'aria-label': 'Estado' }, el('option', { value: '', text: 'Estado' }), UFS.map(u => el('option', { value: u, text: u })));
  sUf.value = cfg.uf || '';
  const dl = el('datalist', { id: 'ferListaCidades' });
  const cid = el('input', { class: 'entrada', id: 'ferCidade', type: 'text', placeholder: 'Cidade', value: cfg.cidade || '', autocomplete: 'off', list: 'ferListaCidades' });
  const encher = () => ferCidades(sUf.value).then(l => trocar(dl, l.map(m => el('option', { value: m[1] }))));
  sUf.addEventListener('change', () => { cid.value = ''; encher(); }); encher();
  const facs = {};
  const salvar = el('button', { class: 'btn pri plena', type: 'button', text: 'Salvar feriados', id: 'ferSalvar' });
  trocar(box, topo,
    el('h2', { class: 'tit-bloco', text: 'Cidade do atendimento' }), el('div', { class: 'cartao pad bloco' }, el('div', { class: 'tres-col' }, sUf, el('div', {}, cid)), dl,
      !cfg.codigo_ibge ? el('p', { class: 'dica', text: 'Sem a cidade, só os feriados nacionais são considerados.' }) : null),
    el('h2', { class: 'tit-bloco', text: 'Pontos facultativos em que a clínica também não atende' }), el('div', { class: 'cartao pad bloco opcoes' }, FACULTATIVOS.map(([k, t]) => {
      const cb = el('input', { type: 'checkbox', checked: (cfg.facultativos || []).includes(k) }); facs[k] = cb; return el('label', { class: 'marcar' }, cb, el('span', { text: t }));
    })),
    el('h2', { class: 'tit-bloco', text: 'Próximos feriados' }), el('p', { class: 'dica bloco', text: 'Marque "Atendo" se a clínica vai atender mesmo assim.' }),
    FER.prox.length ? el('div', { class: 'lista bloco' }, FER.prox.map(x => { const cb = el('input', { type: 'checkbox', checked: !!x.atende, onchange: () => { x.atende = cb.checked; } });
      return el('label', { class: 'linha' }, el('span', { class: 'tx' }, el('span', { class: 't1', text: new Date(x.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) }), el('span', { class: 't2', text: x.nome })),
        el('span', { class: 'marcar' }, cb, el('span', { text: 'Atendo' }))); })) : el('p', { class: 'mudo bloco', text: 'Nenhum feriado nos próximos 12 meses.' }),
    salvar);
  salvar.addEventListener('click', () => {
    const uf = sUf.value; let nome = cid.value.trim(), ibge = '';
    ferCidades(uf).then(l => {
      if (nome) { const achou = l.find(m => semAcento(m[1]) === semAcento(nome)); if (!achou) { rapida('Escolha a cidade da lista.'); cid.focus(); return; } ibge = String(achou[0]); nome = achou[1]; }
      if (nome && !uf) { rapida('Escolha o estado.'); return; }
      const dados = { ativo: true, uf, codigo_ibge: ibge, cidade: nome, facultativos: Object.keys(facs).filter(k => facs[k].checked), atende_em: FER.prox.filter(x => x.atende).map(x => x.data) };
      salvar.disabled = true; salvar.textContent = 'Salvando…';
      d24('agenda_feriados_salvar', dados).then(r => {
        salvar.disabled = false; salvar.textContent = 'Salvar feriados';
        if (r && r.ok === false) { rapida('Confira o estado e a cidade.'); return; }
        rapida('Feriados salvos.'); ferCarregar().then(ferRender);
      }).catch(() => { salvar.disabled = false; salvar.textContent = 'Salvar feriados'; rapida('Não foi salvo: sem conexão.'); });
    });
  });
}

// ---------------------------------------------------------------- Receber dos pacientes (E): o link, a frase e o valor, no lembrete, o Asaas da clínica
// O servidor cita "Agenda › Horários › Pagamento" (workflow 32): a busca acha por "pagamento".
tela('agenda/horarios/pagamento', {
  montar: () => [cabTela('Receber dos pacientes', { voltar: VOLTA_HOR, sub: 'Depois de marcar a consulta, a assistente manda ao paciente o link de pagamento da clínica. Nada é cancelado sozinho.' }),
    el('div', { id: 'pagQuemMarca' }), blocoCampos(['func_pagamento_link', 'pagamento_link', 'pagamento_texto', 'pagamento_valor_padrao', 'pagamento_no_lembrete']),
    el('div', { id: 'pagMedResumo' }), el('h2', { class: 'tit-bloco pilha', text: 'Asaas da clínica (opcional)' }), el('div', { id: 'asaasBox' }, el('div', { class: 'cartao' }, esqueleto()))],
  entrar: () => { dependenciasAplicar(); asaasCarregar(); pagResumo(); if (!sem('medicos')) medCarregar().then(pagResumo); }
});
function pagResumo() {
  const box = $('pagMedResumo'); if (!box) return;
  const pc = MED.dados.filter(m => m.ativo && medPagaConsultorio(m.id)).length, tv = MED.dados.reduce((n, m) => n + (m.tipos || []).filter(t => t.ativo && t.valor).length, 0);
  trocar(box, MED.modo ? el('div', { class: 'lista bloco pilha' }, linhaLink((pc === 1 ? '1 médico recebe' : pc + ' médicos recebem') + ' no consultório · ' + pl(tv, 'tipo', 'tipos') + ' com valor próprio', 'Cada tipo pode ter o próprio link e valor', 'agenda/horarios/medicos', 'medico')) : null);
}
function asaasCarregar() {
  const box = $('asaasBox'); if (!box) return;
  c32('situacao').then(r => asaasRender(r)).catch(() => trocar(box, aviso('perigo', 'Não consegui ver a situação do Asaas agora. Tente de novo em instantes.')));
}
function asaasRender(r) {
  const box = $('asaasBox'), sit = (r && r.situacao) || {};
  // Qual dos dois marca "Paga": pelo Asaas, sozinho; pelo link fixo, a equipe marca na consulta.
  const q = $('pagQuemMarca'); if (q) trocar(q, aviso('', sit.conectado ? 'Pelo Asaas da clínica: cada consulta com valor recebe um link próprio e fica paga sozinha quando o paciente paga.' : 'Pelo seu link fixo: a RXSync não confere esse pagamento; a equipe marca a consulta como paga na Agenda.'));
  if (sit.conectado) {
    trocar(box, el('div', { class: 'cartao pad' }, el('p', { class: 'etqs' }, etq('Conectado', 'ok', 'ok')), el('p', { text: (sit.conta_nome ? 'Conta ' + sit.conta_nome : 'Conta Asaas') + (sit.ambiente === 'sandbox' ? ' (conta de testes)' : '') + (sit.desde ? ', desde ' + new Date(sit.desde).toLocaleDateString('pt-BR') : '') + '.' }),
      el('p', { class: 'dica', text: pl(sit.links_abertos, 'link aberto', 'links abertos') + ' · ' + pl(sit.pagos_30_dias, 'pago', 'pagos') + ' nos últimos 30 dias.' }),
      sit.status === 'erro' && sit.ultimo_erro ? aviso('atencao', 'Último aviso do Asaas: ' + sit.ultimo_erro) : null,
      ehDono() ? el('div', { class: 'perigo-zona' }, btn('Desconectar o Asaas', async ev => {
        const b = ev.currentTarget;
        if (!(await confirmar({ titulo: 'Desconectar o Asaas?', texto: 'A chave é apagada da RXSync e os links abertos são desativados. As consultas voltam a receber o link fixo (se houver).', botao: 'Desconectar', perigo: true }))) return;
        b.disabled = true; c32('desconectar').then(x => { rapida((x && x.mensagem) || 'Pronto.'); asaasRender(x); }).catch(() => { b.disabled = false; rapida('Não consegui desconectar. Tente de novo.'); });
      }, 'perigo-sec plena')) : null));
    return;
  }
  if (!ehDono()) { trocar(box, el('div', { class: 'cartao pad' }, el('p', { class: 'mudo', text: 'Não conectado. Só o dono da conta conecta o Asaas da clínica.' }))); return; }
  trocar(box, el('div', { class: 'cartao pad' }, el('p', { class: 'mudo', text: 'Com a conta Asaas da clínica conectada, cada consulta com valor recebe um link de pagamento próprio e fica paga sozinha quando o paciente paga. O dinheiro cai direto na conta da clínica: a RXSync não recebe, não vê o saldo e não faz transferências.' }),
    el('div', { class: 'pilha' }, btn('Conectar o Asaas', asaasConectar, 'sec plena'))));
}
// Conectar o Asaas (molde F): a chave e o aceite dos Termos; a chave vai uma vez e nunca volta à tela.
function asaasConectar() {
  const ch = el('input', { class: 'entrada', type: 'password', id: 'asaasChave', autocomplete: 'off', maxlength: '300', placeholder: '$aact_prod_...' });
  const cb = el('input', { type: 'checkbox', id: 'asaasAceite' }), erro = el('div', { 'aria-live': 'polite' });
  const ok = el('button', { class: 'btn pri', type: 'button', text: 'Conectar' });
  const f = folha('Conectar o Asaas', el('div', { class: 'form' }, el('div', { class: 'campo' }, el('label', { for: 'asaasChave', text: 'Chave da API do Asaas' }),
    el('p', { class: 'dica', text: 'No Asaas: Integrações › Chaves de API. Começa com $aact_prod_ (ou $aact_hmlg_, na conta de testes). Depois de conectar, ela não aparece mais aqui.' }), ch),
    el('label', { class: 'marcar' }, cb, el('span', {}, 'Li e concordo com os ', el('a', { href: '/termos/' + VERSAO_TERMOS + '.html', target: '_blank', rel: 'noopener', text: 'Termos de Uso, versão ' + VERSAO_TERMOS }), ' (item 9.2 do Anexo II: a conta de pagamentos da clínica).')), erro),
  { pe: [btn('Cancelar', () => f.fechar(), 'sec'), ok] });
  ok.addEventListener('click', () => {
    trocar(erro); const k = ch.value.trim();
    if (!/^\$aact_(prod|hmlg)_\S{20,}$/.test(k)) { trocar(erro, aviso('perigo', 'Essa não parece uma chave da API do Asaas. Copie a chave inteira, com o $ do começo.')); return; }
    if (!cb.checked) { trocar(erro, aviso('perigo', 'Marque que leu e concorda com os Termos de Uso.')); return; }
    ok.disabled = true;
    c32('conectar', { chave: k, aceite_termos: true, versao_termos: VERSAO_TERMOS }).then(x => {
      ch.value = '';
      if (x && x.ok) { f.limpar(); f.fechar(); rapida(x.mensagem || 'Asaas conectado.'); asaasRender(x); } else { ok.disabled = false; trocar(erro, aviso('perigo', (x && x.mensagem) || 'Não consegui conectar.')); }
    }).catch(() => { ch.value = ''; ok.disabled = false; trocar(erro, aviso('perigo', 'Não consegui falar com o servidor. Tente de novo.')); });
  });
}

// ---------------------------------------------------------------- Integração e planilhas (D): Reservio, link do seu sistema, importar a agenda e as importações
// O servidor cita "Agenda › Integração" (workflow 12): a busca acha por "integração".
const VOLTA_INT = ['agenda/horarios/integracao', 'Integração e planilhas'];
function intStatus() { return c12('status').then(r => { INT.status = r || {}; return INT.status; }).catch(() => ({})); }
tela('agenda/horarios/integracao', {
  montar: () => [cabTela('Integração e planilhas', { voltar: VOLTA_HOR, sub: 'Ligue a agenda da RXSync à que a clínica já usa, mande o link do seu sistema ou traga as consultas de uma planilha.' }), el('div', { id: 'intIndice' })],
  entrar: () => { intIndice(); intStatus().then(intIndice); }
});
function intIndice() {
  const st = INT.status || {};
  trocar($('intIndice'), el('div', { class: 'lista' },
    linhaLink('Reservio', st.conectado ? (st.status === 'erro' ? 'Com problema' : 'Conectado') + (st.business_nome ? ' · ' + st.business_nome : '') : 'Não conectado', 'agenda/horarios/integracao/reservio', 'link'),
    linhaLink('Link de agendamento do seu sistema', ligado('link_agendamento_ativo') ? 'Ligado: a assistente manda o link em vez de marcar' : 'Desligado', 'agenda/horarios/integracao/link', 'link'),
    linhaLink('Importar a agenda de outro sistema', 'Planilha CSV, em 4 passos', 'agenda/horarios/integracao/importar', 'importar'),
    linhaLink('Importações da agenda', 'Ver e desfazer em até 7 dias', 'agenda/horarios/integracao/importacoes', 'notas')));
}
tela('agenda/horarios/integracao/link', {
  montar: () => [cabTela('Link de agendamento do seu sistema', { voltar: VOLTA_INT, sub: 'Para quem agenda por iClinic, Doctoralia, Feegow ou outro sistema com página de agendamento. Em vez de marcar, a assistente envia o link.' }),
    blocoCampos(['link_agendamento_ativo', 'link_agendamento'])],
  entrar: () => dependenciasAplicar()
});
tela('agenda/horarios/integracao/reservio', {
  montar: () => [cabTela('Reservio', { voltar: VOLTA_INT, sub: 'As consultas marcadas lá aparecem aqui e ocupam o horário, e as que a assistente marca vão para lá.' }), el('div', { id: 'intBox' }, el('div', { class: 'cartao' }, esqueleto()))],
  entrar: () => c12('status').then(r => intRender(r, null)).catch(() => trocar($('intBox'), aviso('perigo', 'Não consegui abrir a integração agora. Tente de novo em instantes.')))
});
function intHa(iso) {
  if (!iso) return 'ainda não aconteceu';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora há pouco'; if (min < 60) return 'há ' + min + ' min';
  const hr = Math.round(min / 60); return hr < 24 ? 'há ' + hr + ' h' : fmt(iso);
}
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function intHorariosResumo(faixas) { const por = {}; (faixas || []).forEach(f => { (por[f.dia] = por[f.dia] || []).push(f.inicio + '–' + f.fim); }); return [1, 2, 3, 4, 5, 6, 0].filter(d => por[d]).map(d => DIAS_CURTOS[d] + ' ' + por[d].join(', ')).join('; '); }
function intRender(r, ultimo) {
  const box = $('intBox'); r = r || {}; INT.status = r;
  const nomePlat = r.plataforma_nome || 'Reservio';
  const sel = (id, ops, v) => { const s = el('select', { class: 'entrada', id }, ops.map(([a, b]) => el('option', { value: a, text: b }))); s.value = v || ''; return s; };
  const campo = (rot, i, dica) => el('div', { class: 'campo' }, el('label', { for: i.id, text: rot }), i, dica ? el('p', { class: 'dica', text: dica }) : null);
  const msg = r.mensagem ? aviso(r.ok === false ? 'perigo' : 'ok', r.mensagem) : null;
  if (!r.conectado) {
    const plats = Object.keys(r.plataformas || { reservio: 'Reservio' }).map(k => [k, (r.plataformas || {})[k] || 'Reservio']);
    const sPlat = sel('intPlat', plats, (ultimo && ultimo.plataforma) || 'reservio');
    const tok = el('input', { class: 'entrada', id: 'intToken', type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'Cole aqui o token da API', value: ultimo && ultimo.token ? ultimo.token : null });
    let neg = null;
    if (r.escolher_negocio && r.escolher_negocio.length) neg = sel('intNeg', r.escolher_negocio.map(x => [x.id, x.nome || x.id]), '');
    else if (r.pedir_negocio) neg = el('input', { class: 'entrada', id: 'intNeg', type: 'text', placeholder: 'Ex.: b04965e6-a9bb-591f-8f8a-1adcb2c8dc39' });
    const bt = el('button', { class: 'btn pri plena', type: 'button', text: 'Conectar' });
    bt.addEventListener('click', () => {
      const dados = { plataforma: sPlat.value, token: tok.value.trim(), business_id: neg ? neg.value.trim() : '' };
      if (!dados.token) { tok.focus(); rapida('Cole o token da API.'); return; }
      bt.disabled = true; bt.textContent = 'Conectando…';
      c12('conectar', dados).then(x => intRender(x, x.ok ? null : dados)).catch(() => intRender({ ok: false, mensagem: 'Não consegui conectar agora. Tente de novo em instantes.', plataformas: r.plataformas }, dados));
    });
    trocar(box, msg, el('div', { class: 'cartao pad molde-f' }, el('p', { class: 'tit-bloco', text: 'Conectar a agenda que você já usa' }),
      campo('Plataforma', sPlat, 'Por enquanto, a integração funciona com o Reservio.'), campo('Token da API', tok, 'No Reservio, a API faz parte do plano Pro: peça o token ao suporte do Reservio e cole aqui. Ele fica guardado com criptografia e não aparece de novo.'),
      neg ? campo(r.escolher_negocio ? 'Negócio' : 'ID do negócio', neg, r.escolher_negocio ? 'Sua conta tem mais de um negócio. Escolha o desta clínica.' : 'O suporte do ' + nomePlat + ' informa junto com o token.') : null, bt));
    return;
  }
  const { sw } = chaveEl('func_reservio', 'Integração com o ' + nomePlat, { semId: false });
  const sServ = sel('intServ', [['', 'Escolha']].concat((r.servicos || []).map(x => [x.id, x.nome + (x.duracao_min ? ' (' + x.duracao_min + ' min)' : '')])), r.servico_id || '');
  const sRec = sel('intRec', [['', 'Todos os profissionais']].concat((r.recursos || []).map(x => [x.id, x.nome])), r.recurso_id || '');
  const cbH = el('input', { type: 'checkbox', checked: r.importar_horarios !== false });
  const salvar = el('button', { class: 'btn pri plena', type: 'button', text: 'Salvar' });
  salvar.addEventListener('click', () => {
    if (!sServ.value) { sServ.focus(); rapida('Escolha o serviço.'); return; }
    salvar.disabled = true; salvar.textContent = 'Salvando…';
    c12('configurar', { servico_id: sServ.value, recurso_id: sRec.value, importar_horarios: cbH.checked }).then(x => intRender(x)).catch(() => { rapida('Não consegui salvar.'); salvar.disabled = false; salvar.textContent = 'Salvar'; });
  });
  const ocupado = (b, t) => { b.disabled = true; b.textContent = t; };
  trocar(box, msg,
    el('div', { class: 'cartao campos bloco' }, el('div', { class: 'chave-linha' }, el('div', { class: 'tx' }, el('div', { class: 't1' }, nomePlat + (r.business_nome ? ' · ' + r.business_nome : ''), etq(r.status === 'erro' ? 'Com problema' : 'Conectado', r.status === 'erro' ? 'perigo' : 'ok', r.status === 'erro' ? 'alerta' : 'ok')),
      el('p', { class: 'dica', text: 'Última sincronização: ' + intHa(r.ultima_sync) + '. Ligada, mantém os horários em sincronia com a sua agenda no ' + nomePlat + '.' })), sw)),
    r.status === 'erro' && r.ultimo_erro ? aviso('perigo', r.ultimo_erro) : null,
    el('h2', { class: 'tit-bloco', text: 'Como a assistente usa o ' + nomePlat }),
    !r.servico_id ? aviso('atencao', 'Escolha o serviço para a assistente começar a lançar no ' + nomePlat + ' as consultas que ela marca.') : null,
    el('div', { class: 'cartao pad bloco form' }, campo('Serviço usado quando a assistente marca', sServ), campo('Profissional', sRec, 'As consultas desse profissional ocupam a agenda da RXSync, e é na agenda dele que a assistente marca.'),
      el('label', { class: 'marcar' }, cbH, el('span', { text: 'Usar os dias e horários de atendimento do ' + nomePlat })),
      el('p', { class: 'dica', text: r.importar_horarios !== false ? ((r.horarios || []).length ? 'Horários vindos do ' + nomePlat + ': ' + intHorariosResumo(r.horarios) + '. Atualizam sozinhos a cada 30 minutos.' : 'Os horários são lidos do ' + nomePlat + ' quando você salvar.') : 'Desligado: a assistente usa os Horários de atendimento da RXSync.' }),
      el('div', { class: 'pilha' }, salvar)),
    el('div', { class: 'linha-botoes bloco' }, btn('Sincronizar agora', ev => { ocupado(ev.currentTarget, 'Sincronizando…'); c12('sincronizar').then(x => intRender(x)).catch(() => { rapida('Não consegui sincronizar.'); intRender(r); }); }, 'sec'),
      btn('Atualizar a lista de serviços', ev => { ocupado(ev.currentTarget, 'Atualizando…'); c12('atualizar_opcoes').then(x => intRender(x)).catch(() => { rapida('Não consegui atualizar.'); intRender(r); }); }, 'sec')),
    el('div', { class: 'cartao pad bloco' }, el('p', { class: 'tit-bloco', text: 'Como funciona' }), [
      'A cada 2 minutos, as consultas do ' + nomePlat + ' aparecem aqui e ocupam o horário, para a assistente não oferecer horário já tomado.',
      'Quando a assistente marca uma consulta, ela confere se o horário está livre no ' + nomePlat + ' e lança lá. Se alguém tiver ocupado o horário no meio tempo, você recebe um aviso no WhatsApp de avisos.',
      'O ' + nomePlat + ' não permite cancelar pela integração. Quando o paciente cancela pelo WhatsApp, avisamos no WhatsApp de avisos para você cancelar lá.',
      r.importar_horarios !== false ? 'Os dias e horários de atendimento vêm do ' + nomePlat + '. Feriados seguem o que estiver em Agenda › Horários › Feriados. Folgas de um dia específico ainda não vêm de lá: use "Bloquear horário" na Agenda.' : 'Mantenha os Horários de atendimento iguais aos do ' + nomePlat + '.'
    ].map(t => el('p', { class: 'dica', text: t }))),
    el('div', { class: 'perigo-zona' }, btn('Desconectar do ' + nomePlat, async ev => {
      const b = ev.currentTarget;
      if (!(await confirmar({ titulo: 'Desconectar do ' + nomePlat + '?', texto: 'As consultas que vieram de lá saem da agenda da RXSync, e a assistente deixa de lançar consultas lá.', botao: 'Desconectar', perigo: true }))) return;
      ocupado(b, 'Desconectando…'); c12('desconectar').then(x => intRender(x)).catch(() => { rapida('Não consegui desconectar.'); intRender(r); });
    }, 'perigo-sec plena')));
}

// ---------------------------------------------------------------- planilhas (CSV) lidas no aparelho: as mesmas regras da importação de pacientes
function impSem(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_.]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function impDecodificar(buf) {
  const b = new Uint8Array(buf);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^﻿/, ''); }
  catch (e) { return new TextDecoder('windows-1252').decode(b); }   // o Excel no Windows salva assim
}
function impSeparador(texto) {
  const linha = texto.split(/\r\n|\n|\r/)[0] || '', conta = { ';': 0, ',': 0, '\t': 0 }; let dentro = false;
  for (const c of linha) { if (c === '"') dentro = !dentro; else if (!dentro && conta[c] !== undefined) conta[c]++; }
  return conta[';'] >= conta[','] && conta[';'] >= conta['\t'] && conta[';'] > 0 ? ';' : (conta['\t'] > conta[','] ? '\t' : ',');
}
function impCsv(texto, sep) {   // campo com separador ou quebra de linha dentro de aspas; "" = aspas
  const linhas = []; let campo = '', linha = [], dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentro) { if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else dentro = false; } else campo += c; }
    else if (c === '"') dentro = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && texto[i + 1] === '\n') i++; linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}
const impTel = t => String(t || '').replace(/\D/g, '');
function impTelOk(d) { const x = d.length >= 12 && d.slice(0, 2) === '55' ? d.slice(2) : d; return d.length <= 13 && x.length >= 10; }
function impLerArquivo(inp, msg, max, aoLer) {
  const f = inp.files && inp.files[0]; trocar(msg); if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const b = new Uint8Array(r.result), ext = (f.name.split('.').pop() || '').toLowerCase();
    if ((b[0] === 0x50 && b[1] === 0x4B) || ['xlsx', 'xls', 'numbers'].includes(ext)) { trocar(msg, aviso('atencao', 'Este arquivo é do Excel ou do Numbers, não um CSV. Abra no app Numbers e use ⋯ › Exportar › CSV.')); inp.value = ''; return; }
    const texto = impDecodificar(r.result), sep = impSeparador(texto), linhas = impCsv(texto, sep).filter((l, i) => i === 0 || l.some(x => String(x).trim()));
    if (linhas.length < 2) { trocar(msg, aviso('perigo', 'Não encontrei linhas nesse arquivo. A primeira linha precisa ter os títulos das colunas.')); inp.value = ''; return; }
    if (linhas.length - 1 > max) { trocar(msg, aviso('perigo', 'O arquivo tem mais de ' + max.toLocaleString('pt-BR') + ' linhas. Divida em arquivos menores.')); inp.value = ''; return; }
    aoLer(f, linhas.map(l => l), sep);
  };
  r.onerror = () => trocar(msg, aviso('perigo', 'Não consegui abrir esse arquivo. Tente de novo.'));
  r.readAsArrayBuffer(f);
}
function impBaixarCsv(cab, dados, erros, nome) {   // CSV gerado aqui, com as colunas originais e o motivo; fórmula de planilha vira texto
  const q = x => { x = String(x == null ? '' : x); if (/^[=+\-@]/.test(x)) x = "'" + x; return /[";\n\r]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  const linhas = [['linha', 'motivo'].concat(cab).map(q).join(';')];
  erros.forEach(e => linhas.push([e.linha, e.motivo].concat(dados[e.linha - 2] || []).map(q).join(';')));
  baixarArquivo('﻿' + linhas.join('\r\n'), 'text/csv;charset=utf-8', nome);
}
const passosF = (id, nomes, atual) => el('ol', { class: 'passos-f', id, 'aria-label': 'Etapas' }, nomes.map((n, i) => el('li', { class: i + 1 < atual ? 'feito' : i + 1 === atual ? 'agora' : '', 'aria-current': i + 1 === atual ? 'step' : null, text: n })));
const numeroGrande = (rot, n) => indicador(rot, Number(n || 0).toLocaleString('pt-BR'));

// ---------------------------------------------------------------- importar a agenda (molde F, DEC-093): só as colunas da lista fechada vão ao servidor, em lotes de 500
const AI_LOTE = 500, AI_MAX = 20000;
let AI = null;
const AI_CAMPOS = [{ k: 'data', rot: 'Data (ou data e hora)', obrig: true }, { k: 'hora', rot: 'Hora de início (se vier separada)' }, { k: 'fim', rot: 'Hora de término' }, { k: 'duracao', rot: 'Duração em minutos' },
  { k: 'nome', rot: 'Nome', obrig: true }, { k: 'sobrenome', rot: 'Sobrenome (se vier separado)' }, { k: 'telefone', rot: 'Telefone', obrig: true }, { k: 'servico', rot: 'Serviço' },
  { k: 'medico', rot: 'Profissional (médico)', med: true }, { k: 'tipo', rot: 'Tipo de consulta', med: true }, { k: 'codigo', rot: 'Código da reserva no outro sistema' },
  { k: 'situacao', rot: 'Situação (para achar as canceladas)' }, { k: 'pago', rot: 'Pago (sim/não)' }];
const AI_NOMES = { data: ['data', 'dia', 'date', 'data da consulta', 'data do agendamento', 'inicio', 'start', 'start date', 'data hora', 'data/hora', 'data e hora', 'date time'],
  hora: ['hora', 'horario', 'hora inicio', 'hora de inicio', 'time', 'start time'], fim: ['fim', 'termino', 'hora fim', 'hora de termino', 'end', 'end time'], duracao: ['duracao', 'duration', 'minutos', 'duracao min'],
  nome: ['nome', 'nome completo', 'paciente', 'cliente', 'nome do paciente', 'nome do cliente', 'name', 'client', 'client name', 'customer', 'first name'], sobrenome: ['sobrenome', 'last name', 'surname'],
  telefone: ['telefone', 'celular', 'whatsapp', 'fone', 'phone', 'phone number', 'mobile'], servico: ['servico', 'service', 'procedimento', 'evento', 'event'],
  medico: ['profissional', 'medico', 'medica', 'recurso', 'resource', 'staff', 'doctor'], tipo: ['tipo', 'tipo de consulta'], codigo: ['id', 'codigo', 'booking id', 'reserva', 'id da reserva', 'booking'],
  situacao: ['status', 'situacao', 'estado', 'state'], pago: ['pago', 'paga', 'pagamento', 'paid', 'payment status'] };
tela('agenda/horarios/integracao/importar', {
  montar: () => [cabTela('Importar a agenda', { voltar: VOLTA_INT, sub: 'Traga as consultas passadas, atuais e futuras de outro sistema (Reservio, iClinic, planilha própria), por um arquivo CSV. O arquivo é lido aqui no seu aparelho: só a data, a hora, o nome, o telefone, o serviço e as colunas que você escolher vão para a RXSync.' }),
    el('div', { class: 'molde-f', id: 'aiTela' })],
  entrar: () => { if (!AI) aiInicio(); }
});
function aiTela(passo) { const t = $('aiTela'); trocar(t, passosF('aiPassos', ['Arquivo', 'Colunas', 'Prévia', 'Pronto'], passo)); return t; }
function aiInicio() {
  AI = null; const t = aiTela(1), msg = el('div', { 'aria-live': 'polite' });
  const inp = el('input', { type: 'file', accept: '.csv,.txt,.xlsx,.xls,.numbers,text/csv,text/plain' });
  inp.addEventListener('change', () => impLerArquivo(inp, msg, AI_MAX, (fl, linhas) => {
    const cab = linhas[0].map(h => String(h).trim());
    AI = { arquivo: fl.name, cab, dados: linhas.slice(1), mapa: aiMapaAuto(cab), sistema: /reservio/i.test(fl.name) ? 'reservio' : 'outro', medMapa: {}, tipoMapa: {}, lembretes: false };
    aiColunas();
  }));
  anexar(t, el('label', { class: 'arquivo cartao' }, icone('importar', 'g'), el('strong', { text: 'Escolher o arquivo da agenda (CSV)' }), el('span', { class: 'mudo peq', text: 'No iPad e no iPhone, abre o app Arquivos.' }), inp, el('span', { class: 'btn pri', text: 'Escolher arquivo' })),
    el('div', { class: 'pilha' }, aviso('', 'Como exportar: no Reservio (ou no seu sistema), exporte as reservas ou a agenda. Se vier em Excel (.xlsx), abra no app Numbers e use ⋯ › Exportar › CSV.')), msg);
}
function aiMapaAuto(cab) {
  const mapa = {}, usados = {};
  AI_CAMPOS.forEach(f => {
    if (f.med && !MED.modo) { mapa[f.k] = -1; return; }
    const nomes = AI_NOMES[f.k] || [], i = cab.findIndex((h, j) => !usados[j] && nomes.includes(impSem(h)));
    mapa[f.k] = i; if (i >= 0) usados[i] = true;
  });
  return mapa;
}
// "AAAA-MM-DD", "DD/MM/AAAA" (com ou sem hora) e a hora em outra coluna ("9:00", "09h30"). Devolve "AAAA-MM-DD HH:MM" ou null.
function aiDataHora(dt, hr) {
  const v = String(dt || '').trim(); let a, me, d, h = null, mi = null, m;
  if ((m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})[:h](\d{2}))?/))) { a = +m[1]; me = +m[2]; d = +m[3]; if (m[4]) { h = +m[4]; mi = +m[5]; } }
  else if ((m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})(?:[ T,]+(\d{1,2})[:h](\d{2}))?/))) { d = +m[1]; me = +m[2]; a = +m[3]; if (m[3].length === 2) a += 2000; if (m[4]) { h = +m[4]; mi = +m[5]; } }
  else return null;
  const hv = String(hr || '').trim();
  if (hv) { const mh = hv.match(/^(\d{1,2})[:h](\d{2})/); if (!mh) return null; h = +mh[1]; mi = +mh[2]; }
  if (h === null) return null;
  const x = new Date(Date.UTC(a, me - 1, d));
  if (x.getUTCFullYear() !== a || x.getUTCMonth() !== me - 1 || x.getUTCDate() !== d || h > 23 || mi > 59) return null;
  const p = n => String(n).padStart(2, '0');
  return a + '-' + p(me) + '-' + p(d) + ' ' + p(h) + ':' + p(mi);
}
const aiCol = (r, k) => { const i = AI.mapa[k]; return i >= 0 ? String(r[i] == null ? '' : r[i]).trim() : ''; };
function aiColunas() {
  const t = aiTela(2), fora = el('p', { class: 'dica' }), extras = el('div'), erro = el('div', { 'aria-live': 'polite' });
  const sS = el('select', { class: 'entrada', id: 'aiSistema' }, el('option', { value: 'reservio', text: 'Reservio' }), el('option', { value: 'outro', text: 'Outro sistema ou planilha' }));
  sS.value = AI.sistema; sS.addEventListener('change', () => { AI.sistema = sS.value; });
  const aiExtras = () => {
    const usadas = AI_CAMPOS.map(f => AI.mapa[f.k]), nao = AI.cab.filter((h, i) => !usadas.includes(i));
    fora.textContent = nao.length ? 'Ficam só no aparelho (não são enviadas): ' + nao.join(', ') + '.' : '';
    const blocos = [];
    if (MED.modo && AI.mapa.medico >= 0) {   // cada nome do arquivo é ligado a um médico e a um tipo cadastrado aqui
      const nomes = [...new Set(AI.dados.map(r => aiCol(r, 'medico')).filter(Boolean))].slice(0, 50);
      blocos.push(el('h2', { class: 'tit-bloco pilha', text: 'Profissionais do arquivo' }), el('div', { class: 'cartao pad mapa-colunas' }, nomes.map(n => {
        const s = el('select', { class: 'entrada' }, el('option', { value: '', text: 'Sem médico' }), MED.dados.map(m => el('option', { value: String(m.id), text: m.nome + (m.ativo ? '' : ' (removido)') })));
        if (AI.medMapa[n] === undefined) { const achou = MED.dados.find(m => impSem(m.nome) === impSem(n)); AI.medMapa[n] = achou ? String(achou.id) : ''; }
        s.value = AI.medMapa[n]; s.addEventListener('change', () => { AI.medMapa[n] = s.value; });
        return el('label', {}, n, s);
      })));
    }
    if (MED.modo && AI.mapa.tipo >= 0) {
      const tipos = [...new Set(AI.dados.map(r => aiCol(r, 'tipo')).filter(Boolean))].slice(0, 50);
      blocos.push(el('h2', { class: 'tit-bloco pilha', text: 'Tipos de consulta do arquivo' }), el('div', { class: 'cartao pad mapa-colunas' }, tipos.map(n => {
        const s = el('select', { class: 'entrada' }, el('option', { value: '', text: 'Sem tipo' }), MED.dados.map(m => (m.tipos || []).map(tp => el('option', { value: String(tp.id), text: m.nome + ' · ' + tp.nome }))));
        if (AI.tipoMapa[n] === undefined) { let achou = null; MED.dados.forEach(m => (m.tipos || []).forEach(tp => { if (!achou && impSem(tp.nome) === impSem(n)) achou = tp; })); AI.tipoMapa[n] = achou ? String(achou.id) : ''; }
        s.value = AI.tipoMapa[n]; s.addEventListener('change', () => { AI.tipoMapa[n] = s.value; });
        return el('label', {}, n, s);
      })));
    }
    trocar(extras, blocos);
  };
  anexar(t, el('p', { class: 'mudo bloco', text: 'Arquivo ' + AI.arquivo + ': ' + pl(AI.dados.length, 'linha', 'linhas') + '. Confira de qual coluna vem cada informação.' }),
    el('div', { class: 'cartao pad mapa-colunas' }, AI_CAMPOS.filter(f => !f.med || MED.modo).map(f => {
      const s = el('select', { class: 'entrada', id: 'aiCol_' + f.k }, el('option', { value: '-1', text: f.obrig ? 'Escolha a coluna' : 'Não usar' }), AI.cab.map((h, i) => el('option', { value: String(i), text: h || 'Coluna ' + (i + 1) })));
      s.value = String(AI.mapa[f.k]); s.addEventListener('change', () => { AI.mapa[f.k] = +s.value; aiExtras(); });
      return el('label', { for: 'aiCol_' + f.k }, f.rot + (f.obrig ? ' *' : ''), s);
    })), fora,
    el('div', { class: 'campo form' }, el('label', { for: 'aiSistema', text: 'De qual sistema veio o arquivo?' }), sS), extras, erro,
    el('div', { class: 'pilha' }, btn('Ver a prévia', () => { trocar(erro); if (AI.mapa.data < 0 || AI.mapa.nome < 0 || AI.mapa.telefone < 0) { trocar(erro, aviso('perigo', 'Escolha as colunas da data, do nome e do telefone.')); return; } aiPrevia(); }, 'pri plena'),
      btn('Escolher outro arquivo', aiInicio, 'sec plena')));
  aiExtras();
}
function aiPreparar() {
  const validas = [], erros = [], vistos = {}; let rep = 0;
  const CANC = /cancel|desmarc|recusad|rejeit|declin/, PAGO = /^(sim|s|pago|paga|paid|yes|true|1|quitado)$/;
  AI.dados.forEach((r, i) => {
    const linha = i + 2;
    if (!r.some(x => String(x).trim())) return;
    const ini = aiDataHora(aiCol(r, 'data'), aiCol(r, 'hora'));
    const nome = (aiCol(r, 'nome') + ' ' + aiCol(r, 'sobrenome')).replace(/\s+/g, ' ').trim().slice(0, 120);
    const tel = impTel(aiCol(r, 'telefone')), fimTxt = aiCol(r, 'fim');
    let fim = '';
    if (fimTxt && ini) fim = /^\d{1,2}[:h]\d{2}/.test(fimTxt) ? aiDataHora(ini.slice(0, 10), fimTxt) : aiDataHora(fimTxt, '');
    const motivo = !ini ? 'data ou hora inválida' : !nome ? 'sem nome' : !impTelOk(tel) ? 'telefone sem DDD' : (fimTxt && !fim) ? 'hora de término inválida' : '';
    if (motivo) { erros.push({ linha, motivo }); return; }
    const k = ini + '|' + tel.slice(-8);
    if (vistos[k]) { rep++; return; } vistos[k] = true;
    const med = AI.mapa.medico >= 0 ? (AI.medMapa[aiCol(r, 'medico')] || '') : '', tipo = AI.mapa.tipo >= 0 ? (AI.tipoMapa[aiCol(r, 'tipo')] || '') : '';
    validas.push({ linha: String(linha), inicio: ini, fim: fim || '', duracao_min: aiCol(r, 'duracao').replace(/\D/g, '').slice(0, 3), nome, telefone: tel, servico: aiCol(r, 'servico').slice(0, 80),
      medico_id: med, tipo_id: tipo, codigo: aiCol(r, 'codigo').slice(0, 80), cancelada: CANC.test(impSem(aiCol(r, 'situacao'))), paga: PAGO.test(impSem(aiCol(r, 'pago'))) });
  });
  AI.validas = validas; AI.erros = erros; AI.repetidas = rep;
}
function aiLotes(gravar, aoAvancar) {
  const lotes = []; for (let i = 0; i < AI.validas.length; i += AI_LOTE) lotes.push(AI.validas.slice(i, i + AI_LOTE));
  let tot = { novas: 0, existentes: 0, repetidas: 0, conflitos: 0, erros: 0, canceladas: 0, futuras: 0, pacientes_lembrete: 0, lista_erros: [], lembretes_clinica: true };
  let k = gravar ? (AI.proximo || 0) : 0; if (gravar && AI.totGravacao) tot = AI.totGravacao;
  const um = () => {
    if (k >= lotes.length) return Promise.resolve(tot);
    aoAvancar(k, lotes.length);
    const d = { gravar, linhas: lotes[k], lembretes: AI.lembretes, sistema: AI.sistema }; if (gravar && AI.importacao_id) d.importacao_id = String(AI.importacao_id);
    return d24('agenda_importar', d).then(r => {
      if (!r || !r.ok) { const e = new Error('servidor'); e.r = r; throw e; }
      ['novas', 'existentes', 'repetidas', 'conflitos', 'erros', 'canceladas', 'futuras', 'pacientes_lembrete'].forEach(x => { tot[x] += r[x] || 0; });
      tot.lembretes_clinica = r.lembretes_clinica !== false; (r.lista_erros || []).forEach(x => tot.lista_erros.push(x));
      if (gravar) { AI.importacao_id = AI.importacao_id || r.importacao_id; AI.proximo = k + 1; AI.totGravacao = tot; }
      k++; return um();
    });
  };
  return lotes.length ? um() : Promise.resolve(tot);
}
const aiErrosTodos = tot => AI.erros.concat((tot.lista_erros || []).map(e => ({ linha: +e.linha, motivo: e.motivo }))).sort((a, b) => a.linha - b.linha);
function aiPrevia() {
  aiPreparar(); const t = aiTela(3), prog = el('p', { class: 'mudo', text: 'Conferindo…', 'aria-live': 'polite' }); anexar(t, prog);
  Promise.all([aiLotes(false, (k, n) => { prog.textContent = 'Conferindo o lote ' + (k + 1) + ' de ' + n + '…'; }), c12('status').catch(() => ({}))]).then(([tot, st]) => {
    const reservio = !!(st && st.conectado), t2 = aiTela(3); AI.prev = tot;
    const cb = el('input', { type: 'checkbox', checked: AI.lembretes }); cb.addEventListener('change', () => { AI.lembretes = cb.checked; });
    const erros = aiErrosTodos(tot);
    const gr = btn('Importar ' + pl(tot.novas, 'consulta', 'consultas'), async () => {
      if (!(await confirmar({ titulo: 'Importar ' + pl(tot.novas, 'consulta', 'consultas') + '?', texto: ['As consultas entram na agenda da RXSync.' + (AI.lembretes ? ' As futuras recebem lembrete.' : ' Sem lembrete das futuras.'), 'Dá para desfazer em até 7 dias, em Importações da agenda.'], botao: 'Importar ' + tot.novas }))) return;
      gr.disabled = true; aiGravar();
    }, 'pri plena', null, { disabled: !tot.novas });
    anexar(t2, el('div', { class: 'numeros bloco' }, [['vão entrar', tot.novas], ['já existiam', tot.existentes], ['repetidas', tot.repetidas + AI.repetidas], ['conflitos', tot.conflitos], ['com erro', tot.erros + AI.erros.length], ['canceladas (histórico)', tot.canceladas], ['futuras', tot.futuras]].map(([a, b]) => numeroGrande(a, b))),
      reservio && AI.mapa.codigo < 0 && tot.futuras ? aviso('atencao', 'O Reservio está conectado e o arquivo não tem a coluna do código da reserva. As consultas futuras entram assim mesmo, mas a mesma consulta pode aparecer duas vezes se for alterada lá depois.') : null,
      el('label', { class: 'marcar' }, cb, el('span', { text: 'Mandar lembrete das consultas futuras importadas (' + pl(tot.pacientes_lembrete, 'paciente receberia', 'pacientes receberiam') + ').' })),
      !tot.lembretes_clinica ? el('p', { class: 'dica', text: 'Os lembretes da clínica estão desligados agora: mesmo marcando, nenhum lembrete sai até você ligar em Assistente › Mensagens automáticas.' }) : null,
      el('div', { class: 'pilha' }, erros.length ? btn('Baixar o relatório de conflitos e erros (CSV)', () => impBaixarCsv(AI.cab, AI.dados, erros, 'agenda-conflitos-e-erros.csv'), 'sec plena') : null, gr, btn('Voltar às colunas', aiColunas, 'sec plena')));
  }).catch(() => { const t2 = aiTela(3); anexar(t2, aviso('perigo', 'Não consegui conferir o arquivo agora. Tente de novo.'), btn('Voltar às colunas', aiColunas, 'sec plena')); });
}
function aiGravar() {
  const t = aiTela(3), prog = el('p', { class: 'mudo', text: 'Importando…', 'aria-live': 'polite' }); anexar(t, prog);
  aiLotes(true, (k, n) => { prog.textContent = 'Importando o lote ' + (k + 1) + ' de ' + n + '…'; }).then(tot => {
    const t2 = aiTela(4), erros = aiErrosTodos(tot);
    anexar(t2, aviso('ok', pl(tot.novas, 'consulta importada', 'consultas importadas') + '. Dá para desfazer em até 7 dias, em Importações da agenda.'), el('div', { class: 'pilha' },
      erros.length ? btn('Baixar o relatório de conflitos e erros (CSV)', () => impBaixarCsv(AI.cab, AI.dados, erros, 'agenda-conflitos-e-erros.csv'), 'sec plena') : null,
      btn('Ver as importações', () => ir('agenda/horarios/integracao/importacoes'), 'pri plena'), btn('Importar outro arquivo', aiInicio, 'sec plena')));
    agCarregar();
  }).catch(() => { const t2 = aiTela(3); anexar(t2, aviso('perigo', 'A importação parou no meio. O que já entrou fica; toque para continuar de onde parou.'), el('div', { class: 'pilha' }, btn('Continuar', aiGravar, 'pri plena'))); });
}
tela('agenda/horarios/integracao/importacoes', {
  montar: () => [cabTela('Importações da agenda', { voltar: VOLTA_INT, sub: 'Dá para desfazer uma importação em até 7 dias.' }), el('div', { id: 'aiLista' })],
  entrar: () => aiListar()
});
function aiListar() {
  const box = $('aiLista'); if (!box) return;
  trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  d24('agenda_importacoes').then(lista => {
    if (!lista || !lista.length) { trocar(box, el('div', { class: 'cartao' }, vazio('Nenhuma importação ainda', null, btn('Importar a agenda', () => ir('agenda/horarios/integracao/importar'), 'sec')))); return; }
    trocar(box, el('div', { class: 'lista' }, lista.map(i => el('div', { class: 'linha' }, el('span', { class: 'tx' }, el('span', { class: 't1', text: new Date(i.criado_em).toLocaleString('pt-BR') + (i.desfeita_em ? ' · desfeita' : '') }),
      el('span', { class: 't2', text: i.novas + ' entraram · ' + i.existentes + ' já existiam · ' + i.conflitos + ' conflitos · ' + i.erros + ' com erro' + (i.lembretes ? ' · com lembrete' : ' · sem lembrete') }),
      i.pode_desfazer ? el('span', { class: 't2', text: 'Desfazer até ' + fmtDia(new Date(new Date(i.criado_em).getTime() + 7 * 86400000).toISOString()) }) : null),
    i.pode_desfazer ? btn('Desfazer', async () => {
      if (!(await confirmar({ titulo: 'Desfazer esta importação?', texto: 'Saem as consultas dela que ninguém mexeu depois, e os pacientes criados por ela que não têm outra consulta.', botao: 'Desfazer importação', perigo: true }))) return;
      d24('agenda_importacao_desfazer', { id: i.id }).then(r => { rapida(r && r.ok ? pl(r.removidas, 'consulta removida', 'consultas removidas') + (r.mantidas ? '; ' + r.mantidas + ' ficaram (foram mexidas depois)' : '') + '.' : 'O prazo de 7 dias já passou.', { ms: 7000 }); aiListar(); agCarregar(); })
        .catch(() => rapida('Não consegui desfazer. Tente de novo.'));
    }, 'perigo-sec') : null))));
  }).catch(() => trocar(box, aviso('perigo', 'Não consegui carregar as importações.')));
}
