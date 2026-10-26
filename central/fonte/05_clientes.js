// ---------------------------------------------------------------- Clientes: lista e ficha (5 abas + Ações)
// Lista + ficha lado a lado a partir de 1024 px. Cada bloco de edição só aparece com a sua chave ligada; o servidor
// confere a chave e o nível de novo. Plano, cobrança e situação também valem para a clínica de teste da cobrança.
const COBRANCA_TESTE = ['editar_plano', 'editar_preco', 'editar_cobranca', 'editar_teste', 'editar_situacao', 'tela_cliente_asaas'];
const ehTesteCobranca = x => !!x && !!x.cliente_id && est.chaves.cobranca_teste_cliente === x.cliente_id;
const podeEm = x => k => ligada(k) || (ehTesteCobranca(x) && COBRANCA_TESTE.includes(k));
const RECURSOS_NOMES = { documentos: 'Leitura de fotos e PDFs', fila: 'Lista de espera', pesquisa: 'Pesquisa de satisfação e Google', reconhecer: 'Reconhecer quem volta',
  tipo_visita: '1ª vez ou retorno', empilhamento: 'Agrupar pacientes', preconsulta: 'Perguntas antes de agendar', medicos: 'Agenda por médico',
  relacionamento: 'Retorno, convite e "não contatar"', assistente_dono: 'Assistente de gestão', pacientes: 'Aba Pacientes' };
// Campos de cada grupo (os mesmos do servidor, rx_central_campos).
const GRUPOS = {
  assistente: ['nome_exibicao', 'descricao_curta', 'servicos', 'nao_oferecemos', 'profissionais', 'como_chegar', 'endereco_atendimento', 'horario_funcionamento',
    'horario_humano', 'formas_pagamento', 'convenios_parcerias', 'politica_agendamento', 'politica_precos', 'tom_de_voz', 'saudacao', 'restricoes', 'nunca_dizer',
    'gatilhos_escalonamento', 'gatilhos_urgencia', 'resposta_urgencia', 'mensagem_fora_horario', 'telefone_urgencia', 'whatsapp_alerta', 'catalogo_de_vendas',
    'resp_tecnico_nome', 'resp_tecnico_conselho', 'sistema_gestao', 'usuarios_painel', 'numero_reserva'],
  configuracoes: ['pausa_humano_horas', 'fuso_horario', 'duracao_padrao_min', 'antecedencia_minima_h', 'janela_agendamento_dias', 'buffer_min', 'numeros_sem_ia',
    'lembrete_horarios', 'followup_horas', 'link_privacidade', 'pesquisa_horas', 'pesquisa_nota_minima', 'link_avaliacao_google', 'dono_whatsapp', 'briefing_horario',
    'briefing_dias', 'link_agendamento', 'retorno_prazo_dias', 'reativacao_dias'],
  recursos: ['func_documentos', 'func_agendamento', 'func_briefing', 'func_lembretes', 'func_fila', 'func_feriados', 'func_reservio', 'func_regras_linguagem',
    'func_reconhecer', 'func_tipo_visita', 'func_empilhamento', 'func_medicos', 'func_preconsulta', 'func_retorno', 'func_reativacao', 'pesquisa_ativa',
    'assistente_dono_ativa', 'dono_pode_editar', 'link_agendamento_ativo'],
  limites: ['franquia_mensagens', 'limitar_franquia', 'dono_limite_dia', 'relac_limite_dia', 'limite_info_extra', 'envio_limite_dia'],
  empresa: ['razao_social', 'cnpj', '_tipo_pessoa', '_nome_fantasia', 'representante_nome', 'representante_cpf', 'endereco_faturamento', '_cep', '_logradouro',
    '_numero', '_complemento', '_bairro', '_cidade', '_uf', 'email', 'telefone']
};
const ROTULOS = { nome_exibicao: 'Nome da clínica', descricao_curta: 'Descrição curta', servicos: 'Serviços', nao_oferecemos: 'Não oferecemos', profissionais: 'Profissionais',
  como_chegar: 'Como chegar', endereco_atendimento: 'Endereço de atendimento', horario_funcionamento: 'Horário de funcionamento', horario_humano: 'Horário da equipe',
  formas_pagamento: 'Formas de pagamento', convenios_parcerias: 'Convênios e parcerias', politica_agendamento: 'Regras de agendamento', politica_precos: 'Preços',
  tom_de_voz: 'Tom de voz', saudacao: 'Saudação', restricoes: 'Restrições', nunca_dizer: 'Nunca dizer', gatilhos_escalonamento: 'Quando chamar a equipe',
  gatilhos_urgencia: 'Sinais de urgência', resposta_urgencia: 'Resposta de urgência', mensagem_fora_horario: 'Mensagem fora do horário', telefone_urgencia: 'Telefone de urgência',
  whatsapp_alerta: 'WhatsApp da equipe (alertas)', catalogo_de_vendas: 'Informações extras', resp_tecnico_nome: 'Responsável técnico', resp_tecnico_conselho: 'Conselho do responsável',
  sistema_gestao: 'Sistema de gestão', usuarios_painel: 'Usuários do painel', numero_reserva: 'Número reserva',
  pausa_humano_horas: 'Pausa quando a equipe responde', fuso_horario: 'Fuso horário', duracao_padrao_min: 'Duração da consulta (min)', antecedencia_minima_h: 'Antecedência mínima (h)',
  janela_agendamento_dias: 'Agenda aberta (dias)', buffer_min: 'Intervalo entre consultas (min)', numeros_sem_ia: 'Números sem IA', lembrete_horarios: 'Horários dos lembretes',
  followup_horas: 'Retomar conversa parada (h)', link_privacidade: 'Link da privacidade', pesquisa_horas: 'Pesquisa depois de (h)', pesquisa_nota_minima: 'Nota mínima para o Google',
  link_avaliacao_google: 'Link de avaliação no Google', dono_whatsapp: 'WhatsApp do dono', briefing_horario: 'Hora do resumo do dia', briefing_dias: 'Dias do resumo',
  link_agendamento: 'Link de agendamento', retorno_prazo_dias: 'Prazo de retorno (dias)', reativacao_dias: 'Convite para quem sumiu (dias)',
  func_documentos: 'Ler fotos e PDFs', func_agendamento: 'Agendamento direto', func_briefing: 'Briefing', func_lembretes: 'Lembretes', func_fila: 'Lista de espera',
  func_feriados: 'Feriados', func_reservio: 'Reservio', func_regras_linguagem: 'Regras de linguagem', func_reconhecer: 'Reconhecer quem volta', func_tipo_visita: '1ª vez ou retorno',
  func_empilhamento: 'Agrupar pacientes', func_medicos: 'Agenda por médico', func_preconsulta: 'Perguntas antes de agendar', func_retorno: 'Aviso de retorno', func_reativacao: 'Convite para quem sumiu',
  pesquisa_ativa: 'Pesquisa de satisfação', assistente_dono_ativa: 'Assistente de gestão', dono_pode_editar: 'Dono pode editar pelo WhatsApp', link_agendamento_ativo: 'Link de agendamento ligado',
  franquia_mensagens: 'Franquia por mês (mínimo 5.000)', limitar_franquia: 'Limitar na franquia', dono_limite_dia: 'Perguntas ao assistente por dia', relac_limite_dia: 'Avisos de relacionamento por dia',
  limite_info_extra: 'Tamanho das informações extras', envio_limite_dia: 'Envios por dia pela API',
  razao_social: 'Razão social', cnpj: 'CNPJ (só números)', _tipo_pessoa: 'Tipo (PJ ou PF)', _nome_fantasia: 'Nome fantasia', representante_nome: 'Representante',
  representante_cpf: 'CPF do representante (só números)', endereco_faturamento: 'Endereço de faturamento', _cep: 'CEP', _logradouro: 'Logradouro', _numero: 'Número',
  _complemento: 'Complemento', _bairro: 'Bairro', _cidade: 'Cidade', _uf: 'UF', email: 'E-mail', telefone: 'Telefone (só números)' };
const DICAS = { franquia_mensagens: 'vazio = 5.000', dono_limite_dia: 'vazio = 60', relac_limite_dia: 'vazio = 30', limite_info_extra: 'vazio = pelo plano', envio_limite_dia: 'vazio = 50/200' };
const LONGOS = new Set(['descricao_curta', 'servicos', 'nao_oferecemos', 'profissionais', 'como_chegar', 'endereco_atendimento', 'horario_funcionamento', 'formas_pagamento',
  'convenios_parcerias', 'politica_agendamento', 'politica_precos', 'tom_de_voz', 'saudacao', 'restricoes', 'nunca_dizer', 'gatilhos_escalonamento', 'gatilhos_urgencia',
  'resposta_urgencia', 'mensagem_fora_horario', 'catalogo_de_vendas', 'usuarios_painel', 'numeros_sem_ia', 'endereco_faturamento']);
const SIM_NAO = new Set([...GRUPOS.recursos, 'limitar_franquia']);
const STATUS_COB = { PENDING: ['em aberto', 'atencao'], OVERDUE: ['vencida', 'perigo'], RECEIVED: ['recebida', 'ok'], CONFIRMED: ['confirmada', 'ok'], RECEIVED_IN_CASH: ['recebida em dinheiro', 'ok'], REFUNDED: ['estornada', 'perigo'] };
const etqCob = s => { const [t, tom] = STATUS_COB[s] || [s || '—', '']; return etq(t, tom); };
const MOTIVO = { k: 'motivo', rot: 'Motivo (fica no registro)', longo: true, obrig: true, minimo: 5, erro: 'Escreva o motivo (5 letras ou mais).' };
const nota = (texto, rotaAjustes) => el('div', { class: 'aviso info' }, icone('info'), el('div', {}, texto, rotaAjustes ? [' ', el('a', { href: '#ajustes', text: 'Abrir Ajustes' })] : null));

// Formulário de um grupo: mostra os valores atuais e manda só o que mudou (nível 1 = Salvar; "limitar" = SIM sobe para 2).
function formGrupo(x, grupo, valores, acao, titulo, aberto) {
  const chaves = GRUPOS[grupo].filter(k => Object.prototype.hasOwnProperty.call(valores || {}, k));
  const ins = {};
  const campo = k => {
    const v = valores[k] == null ? '' : String(valores[k]); const id = 'g-' + grupo + '-' + k; let i;
    if (SIM_NAO.has(k)) i = el('select', { class: 'entrada', id }, ['', 'SIM', 'NAO'].map(o => el('option', { value: o, text: o || '(vazio)', selected: v.toUpperCase() === o })));
    else if (LONGOS.has(k)) i = el('textarea', { class: 'entrada', id, rows: '3', autocomplete: 'off', spellcheck: 'false', value: v });
    else i = el('input', { class: 'entrada', id, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'none', value: v || null, placeholder: DICAS[k] || null });
    ins[k] = i;
    return el('label', { class: 'campo' + (LONGOS.has(k) ? ' largo' : ''), for: id }, el('span', { class: 'rot', text: ROTULOS[k] || k }), i, DICAS[k] ? el('span', { class: 'ajuda', text: DICAS[k] }) : null);
  };
  const enviar = async e => {
    e.preventDefault();
    const mudou = {}, linhas = [];
    for (const k of chaves) { const novo = ins[k].value.trim(), velho = valores[k] == null ? '' : String(valores[k]); if (novo !== velho) { mudou[k] = novo; linhas.push([ROTULOS[k] || k, velho, novo]); } }
    if (!linhas.length) { rapida('Nada mudou.'); return; }
    await fazer(acao, { cliente_id: x.cliente_id, campos: mudou }, { titulo: titulo + ' · ' + x.nome, linhas, ok: 'Salvo.',
      texto: grupo === 'empresa' ? 'Antes da primeira edição, o servidor guarda a cópia fixa do aceite. Esta edição não tem "desfazer".' : 'Fica no registro e avisa no Telegram (só os nomes dos campos).' });
  };
  return el('details', { class: 'grupo', open: aberto || null }, el('summary', { text: titulo }),
    el('div', { class: 'corpo-grupo' }, el('form', { onsubmit: enviar }, el('div', { class: 'form-2' }, chaves.map(campo)), el('button', { class: 'btn pri', type: 'submit', text: 'Salvar' }))));
}

// ---------- lista
const FILTROS_CLI = [['todos', 'Todas', () => true], ['ar', 'No ar', x => x.ativo && x.modalidade === 'contratado'], ['teste', 'Em teste', x => x.ativo && x.modalidade === 'teste'],
  ['implantacao', 'Implantação', x => ['Pago', 'Aguardando dados', 'Em implantação', 'Aceite registrado'].includes(x.status)], ['suspensas', 'Suspensas', x => x.status === 'Suspenso'],
  ['fora', 'Saíram', x => /Cancelado|apagados|encerrado/i.test(x.status)]];
est.filtroCli = 'todos'; est.buscaCli = '';
function listaDeClientes(todos, selecionado) {
  const lista = el('ul', { class: 'lista' }); const filtros = el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Filtrar clínicas' });
  const busca = el('input', { class: 'entrada', type: 'search', placeholder: 'Filtrar por nome ou código', 'aria-label': 'Filtrar por nome ou código', autocomplete: 'off', enterkeyhint: 'search', value: est.buscaCli || null });
  const desenhar = () => {
    trocar(filtros, ...FILTROS_CLI.map(([k, n, fn]) => el('button', { type: 'button', 'aria-pressed': String(est.filtroCli === k), onclick: () => { est.filtroCli = k; desenhar(); } }, n, el('span', { class: 'n', text: todos.filter(fn).length }))));
    const fn = FILTROS_CLI.find(f => f[0] === est.filtroCli)[2], q = semAcento(busca.value);
    const vis = todos.filter(x => fn(x) && (!q || semAcento(x.nome + ' ' + x.cliente_id).includes(q)));
    trocar(lista, ...vis.map(x => el('li', {}, el('button', { class: 'linha cli', type: 'button', 'aria-current': selecionado === x.cliente_id ? 'true' : null, onclick: () => irCliente(x.cliente_id) },
      el('span', { class: 'avatar ' + tomStatus(x.status), text: iniciais(x.nome), 'aria-hidden': 'true' }),
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: x.nome }), el('div', { class: 't2', text: `${x.cliente_id} · ${x.plano || '—'} · ${fmtNum(x.mensagens_mes)} de ${fmtNum(x.franquia)}` + (x.whatsapp && x.whatsapp !== 'open' ? ' · WhatsApp fora' : '') }), barraUso(x.mensagens_mes, x.franquia)),
      el('div', { class: 'direita' }, x.interna ? etq('interna', '', true) : null, etq(x.status || '—', tomStatus(x.status)))))));
    if (!vis.length) trocar(lista, el('li', {}, vazio('Nenhuma clínica com esse filtro.', 'clientes')));
  };
  busca.oninput = () => { est.buscaCli = busca.value; desenhar(); };
  desenhar();
  return el('section', { class: 'cartao mestre', 'aria-label': 'Clínicas' }, el('div', { class: 'cab' }, el('div', { class: 'pilha' }, busca, filtros)), lista);
}
TELAS.clientes = async (c, [id, aba]) => {
  const largo = matchMedia('(min-width: 1024px)').matches;
  if (!id || largo) {
    topo('Clientes', id ? [['Clientes', 'clientes'], ['…']] : [['Clientes']]);
    if (!ligada('tela_clientes')) { if (falhou(c, { desligada: true, chave: 'tela_clientes' }, 'Clientes')) return; }
    const todos = await listaClientes();
    const cab = cabecalho('Clientes', `${fmtNum(todos.length)} clínicas · ${fmtNum(todos.filter(x => x.ativo && x.modalidade === 'contratado').length)} no ar`);
    if (!id) { trocar(c, cab, largo ? el('div', { class: 'mestre-detalhe' }, listaDeClientes(todos), cartao(null, null, vazio('Escolha uma clínica na lista para ver a ficha.', 'clientes'))) : listaDeClientes(todos)); return; }
    const detalhe = el('div', { class: 'pilha' }, esqueleto());
    trocar(c, cab, el('div', { class: 'mestre-detalhe' }, listaDeClientes(todos, id), detalhe));
    await ficha(detalhe, id, aba, true);
    return;
  }
  trocar(c, esqueleto());
  await ficha(c, id, aba, false);
};

// ---------- ficha
const ABAS = [['geral', 'Visão geral'], ['cobranca', 'Cobrança'], ['recursos', 'Plano e recursos'], ['cadastro', 'Cadastro'], ['historico', 'Histórico']];
async function ficha(alvo, id, aba, embutida) {
  const r = await chamar('cliente', { cliente_id: id });
  aba = ABAS.some(a => a[0] === aba) ? aba : 'geral';
  const nomeAba = ABAS.find(a => a[0] === aba)[1];
  if (r.desligada || !r.ok) { topo('Clínica', [['Clientes', 'clientes'], ['Clínica']], 'clientes'); falhou(alvo, r, 'Clínica'); return; }
  const x = r.cliente;
  topo(x.nome, [['Clientes', 'clientes'], [x.nome, 'clientes/' + encodeURIComponent(x.cliente_id)], [nomeAba]], embutida ? null : 'clientes');
  const pode = podeEm(x);
  const cab = cartao(null, null, corpo(
    el('div', { class: 'ficha-cab' }, el('span', { class: 'avatar ' + tomStatus(x.status), text: iniciais(x.nome), 'aria-hidden': 'true' }),
      el('div', { class: 'texto' }, el(embutida ? 'h2' : 'h1', { class: 'nome-ficha', text: x.nome }),
        el('div', { class: 'etqs' }, etq(x.status || '—', tomStatus(x.status)), etq(x.plano || '—', 'info', true), etq(x.cliente_id, '', true), x.interna ? etq('clínica interna', '', true) : null, ehTesteCobranca(x) ? etq('teste da cobrança', 'atencao') : null)),
      el('div', { class: 'acoes' }, ligada('tela_assistente') ? btn('Perguntar ao assistente', () => abrirAssistente('Sobre a ' + x.cliente_id + ' (' + x.nome + '): '), 'sec', 'assistente') : null,
        btn('Ações', () => menuAcoes(x), 'sec', 'mais'))),
    el('div', { class: 'abas', role: 'tablist', 'aria-label': 'Partes da ficha' }, ABAS.map(([k, n]) => el('button', { role: 'tab', type: 'button', 'aria-selected': String(aba === k), onclick: () => irCliente(x.cliente_id, k) }, n)))));
  const conteudo = el('div', { class: 'pilha', role: 'tabpanel', 'aria-label': nomeAba });
  trocar(alvo, el('div', { class: 'pilha ficha' }, cab, conteudo));
  const ABA = { geral: abaGeral, cobranca: abaCobranca, recursos: abaRecursos, cadastro: abaCadastro, historico: abaHistorico };
  ABA[aba](conteudo, x, pode);
}
function abaGeral(c, x) {
  const comp = x.completa || null;
  const avisos = [];
  if (ehTesteCobranca(x)) avisos.push(el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', {}, el('b', { text: 'Clínica de teste da cobrança. ' }), 'Plano, cobrança e situação mudam mesmo com as chaves desligadas.')));
  if (x.status === 'Suspenso') avisos.push(el('div', { class: 'aviso perigo' }, icone('alerta'), el('div', {}, el('b', { text: 'Suspensa' + (x.suspenso_em ? ' desde ' + fmtData(x.suspenso_em) : '') + '. ' }),
    x.suspensao_motivo === 'equipe' ? 'Pela equipe: só volta pela Central.' : 'Por inadimplência: volta sozinha quando pagar.')));
  if (x.aviso_atraso_em) avisos.push(el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', {}, el('b', { text: 'Aviso de atraso em ' + fmtData(x.aviso_atraso_em) + '. ' }), 'O 31 suspende no 10º dia de atraso (cláusula 11.7).')));
  if (x.cancelar_em) avisos.push(el('div', { class: 'aviso atencao' }, icone('relogio'), el('div', {}, el('b', { text: 'Cancelamento agendado para ' + fmtData(x.cancelar_em) + '.' }))));
  // Pausa feita pelo painel da clínica (sql/061, DEC-147): quando e o papel de quem pausou, nunca o nome nem o e-mail.
  if (x.pausa_painel && !x.ativo) avisos.push(el('div', { class: 'aviso atencao' }, icone('info'), el('div', {}, el('b', { text: 'Assistente pausada pelo painel em ' + fmtHora(x.pausa_painel.em) + ' (' + (x.pausa_painel.por === 'dono' ? 'dono' : x.pausa_painel.por === 'equipe' ? 'equipe' : 'quem pausou não está mais na equipe') + '). ' }),
    'A clínica retoma pelo painel; a Central também pode retomar em Ações.')));
  const passos = [['Aceite dos Termos', x.aceite ? fmtData(x.aceite) + ' · ' + (x.versao_termos || '') : 'ainda não', !!x.aceite],
    ['Onboarding', x.onboarding || '—', /conclu/i.test(String(x.onboarding || '')) || !!x.go_live], ['No ar', x.go_live ? fmtData(x.go_live) : 'ainda não', !!x.go_live],
    x.modalidade === 'teste' ? ['Fim do teste', fmtData(x.fim_teste), false] : ['Último pagamento', fmtData(x.ultimo_pagamento), !!x.ultimo_pagamento],
    x.cancelar_em ? ['Cancelamento', fmtData(x.cancelar_em), false] : null].filter(Boolean);
  const integ = x.integracao;
  anexar(c, 
    el('div', { class: 'kpis' }, kpi('Mensal', fmtReal(x.valor_mensal), x.ciclo ? 'ciclo ' + x.ciclo : null), kpi('Mensagens no mês', fmtNum(x.mensagens_mes) + ' / ' + fmtNum(x.franquia), null, barraUso(x.mensagens_mes, x.franquia)),
      kpi('WhatsApp', x.whatsapp ? (x.whatsapp.estado === 'open' ? 'conectado' : 'desconectado') : '—', x.whatsapp ? 'desde ' + fmtHora(x.whatsapp.desde) : 'não vigiado'),
      kpi(x.modalidade === 'teste' ? 'Fim do teste' : 'Último pagamento', fmtData(x.modalidade === 'teste' ? x.fim_teste : x.ultimo_pagamento))),
    ...avisos,
    el('div', { class: 'grade-2 iguais' },
      cartao('Caminho da clínica', null, corpo(el('div', { class: 'passos' }, passos.map(([t, s, feito], i) => el('div', { class: 'passo ' + (feito ? '' : i === passos.findIndex(p => !p[2]) ? 'agora' : 'depois') },
        el('span', { class: 'bola' }, icone(feito ? 'ok' : 'relogio', 'p')), el('div', {}, el('div', { class: 'forte', text: t }), el('div', { class: 'mudo peq', text: s }))))))),
      cartao('Uso do mês', null, corpo(x.uso_30d && x.uso_30d.length ? grafBarras(x.uso_30d.map(u => ({ r: diaCurto(u.dia), v: (u.recebidas || 0) + (u.enviadas || 0) })), 'Mensagens por dia (30 dias)') : vazio('Sem mensagens nos últimos 30 dias.', 'uso'),
        el('div', { class: 'mt' }, dados([['Franquia', x.limites && x.limites.franquia_mensagens ? fmtNum(x.limites.franquia_mensagens) : '5.000 (padrão)'], ['Limitar na franquia', (x.limites && x.limites.limitar_franquia) || 'NAO']]))))),
    cartao('Integrações', null, corpo(dados([['WhatsApp', x.whatsapp ? `${x.whatsapp.estado === 'open' ? 'conectado' : x.whatsapp.estado} (desde ${fmtHora(x.whatsapp.desde)})` : 'não vigiado'],
      ['Agenda externa', integ ? `${integ.plataforma} · ${integ.ativo ? 'ligada' : 'desligada'}${integ.ultimo_erro ? ' · erro: ' + integ.ultimo_erro : ''}` : '—'],
      ['Médicos ativos', fmtNum(x.medicos_ativos)], ['Chaves da API ativas', fmtNum(x.chaves_api_ativas)],
      ['Avisos de eventos', x.avisos_eventos ? `${x.avisos_eventos.ativo ? 'ligados' : 'desligados'} · ${x.avisos_eventos.servidor || ''}` : '—'], x.pacientes != null ? ['Pacientes cadastrados', fmtNum(x.pacientes)] : null]))),
    comp ? null : nota('A ficha completa (cobranças, recursos, histórico) está desligada.', true));
}

// ---------- Cobrança: plano e preço, foto do Asaas, teste, pedidos e combinados
function abaCobranca(c, x, pode) {
  const comp = x.completa || null, sit = (comp && comp.situacao) || {};
  if (x.interna) { anexar(c, nota('A clínica interna não tem cobrança (DEC-020).')); return; }
  const acoesPlano = [];
  if (pode('editar_plano')) acoesPlano.push(btn('Trocar o plano', () => {
    const atual = semAcento(x.plano).split(' ')[0];
    fazer('plano_trocar', { cliente_id: x.cliente_id }, { titulo: 'Trocar o plano de ' + x.nome, nome: x.nome, ok: 'Plano trocado.',
      texto: 'Essencial e Gestão: o valor oficial da tabela. Enterprise: o valor da proposta. A assinatura do Asaas muda pela fila (até 15 minutos) e a clínica recebe um e-mail.',
      campos: [{ k: 'plano', rot: 'Plano novo', opcoes: [['essencial', 'Essencial'], ['gestao', 'Gestão Inteligente'], ['enterprise', 'Enterprise']].filter(([k]) => k !== atual) },
        { k: 'valor', rot: 'Valor da proposta (só no Enterprise)', inputmode: 'decimal', ph: 'ex.: 1.490,00' }, MOTIVO, { k: 'combinado', rot: 'Como foi combinado com a clínica (obrigatório no Enterprise)', longo: true }] });
  }));
  if (pode('editar_preco')) acoesPlano.push(btn('Preço especial', () => fazer('preco_especial', { cliente_id: x.cliente_id }, { titulo: 'Preço especial para ' + x.nome, nome: x.nome, ok: 'Preço especial gravado.',
    texto: 'Fica em "Combinados" e a clínica recebe um e-mail. O Asaas muda pela fila.',
    campos: [{ k: 'valor', rot: 'Valor mensal novo', inputmode: 'decimal', obrig: true }, MOTIVO, { k: 'combinado', rot: 'Como foi combinado com a clínica', longo: true, obrig: true, minimo: 5, erro: 'Escreva como foi combinado (obrigatório).' }] })));
  anexar(c, cartao('Plano e preço', null, corpo(dados([['Plano', x.plano], ['Valor mensal', fmtReal(x.valor_mensal)], ['Implantação', fmtReal(x.valor_setup)], ['Ciclo', x.ciclo], ['Forma', x.forma_pagamento]]),
    acoesPlano.length ? el('div', { class: 'acoes mt' }, acoesPlano) : null)));
  // Cobranças (foto diária do Asaas; a Central só mexe em cobrança que está na foto).
  const verAsaas = pode('tela_cliente_asaas'), editar = pode('editar_cobranca');
  if (!comp) anexar(c, nota('Para ver as cobranças do Asaas, ligue a ficha completa (tela_cliente_completa, só leitura).', true));
  else if (verAsaas || editar) {
    const foto = comp.asaas, cobs = (foto && foto.cobrancas) || [];
    const lista = cobs.length ? el('ul', { class: 'lista' }, cobs.map(cb => el('li', {}, el('div', { class: 'linha' },
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: (cb.taxa ? 'Taxa de implantação' : (cb.descricao || 'Cobrança')) + ' · ' + fmtReal(cb.valor) }),
        el('div', { class: 't2', text: 'vence ' + fmtData(cb.vencimento) + (cb.pago_em ? ' · paga ' + fmtData(cb.pago_em) : '') + (cb.forma ? ' · ' + cb.forma : '') + ' · ' + cb.id })),
      el('div', { class: 'direita' }, etqCob(cb.status)),
      editar && ['PENDING', 'OVERDUE'].includes(cb.status) ? el('div', { class: 'acoes' },
        btn('Mudar vencimento', () => fazer('cobranca_vencimento', { cliente_id: x.cliente_id, cobranca_id: cb.id }, { titulo: 'Mudar o vencimento', nome: x.nome, linhas: [['Vencimento', fmtData(cb.vencimento), '(a escolher)']],
          campos: [{ k: 'data', rot: 'Novo vencimento', tipo: 'date', min: somaDias(hojeISO(), 1), max: somaDias(hojeISO(), 60), obrig: true }, MOTIVO] })),
        btn('Recebi em dinheiro', () => fazer('pagamento_receber_dinheiro', { cliente_id: x.cliente_id, cobranca_id: cb.id }, { titulo: 'Recebido em dinheiro', nome: x.nome,
          texto: 'O Asaas marca esta cobrança como recebida (pela fila). O 30 só marca "Pago" quando o aviso do Asaas chegar.',
          campos: [{ k: 'valor', rot: 'Valor recebido', inputmode: 'decimal', valor: String(cb.valor || '').replace('.', ',') }, { k: 'data', rot: 'Data do pagamento', tipo: 'date', valor: hojeISO(), max: hojeISO(), min: somaDias(hojeISO(), -60) }, MOTIVO] }))) : null))))
      : vazio(foto ? 'Nenhuma cobrança na foto.' : 'Ainda sem foto do Asaas (o 31 tira todo dia às 8h10).', 'financeiro');
    const acoes = [];
    if (verAsaas) acoes.push(btn('Atualizar a foto agora', () => fazer('asaas_foto_atualizar', { cliente_id: x.cliente_id }, { ok: 'A foto do Asaas é atualizada em até 15 minutos.' }), 'sec', 'atualizar'));
    if (editar) {
      acoes.push(btn('Data da próxima cobrança', () => fazer('cobranca_proxima_data', { cliente_id: x.cliente_id }, { titulo: 'Data da próxima cobrança', nome: x.nome,
        campos: [{ k: 'data', rot: 'Nova data', tipo: 'date', min: somaDias(hojeISO(), 1), max: somaDias(hojeISO(), 60), obrig: true }, MOTIVO] })));
      if (Number(x.valor_setup) > 0) acoes.push(btn('Isentar a implantação', () => fazer('implantacao_isentar', { cliente_id: x.cliente_id }, { titulo: 'Isentar a implantação de ' + x.nome, nome: x.nome,
        linhas: [['Implantação', fmtReal(x.valor_setup), fmtReal(0)]], texto: 'Se a taxa está em aberto no Asaas, ela é cancelada (pela fila). Taxa já paga: estorno fica fora da Central.',
        campos: [MOTIVO, { k: 'combinado', rot: 'Como foi combinado com a clínica', longo: true, obrig: true, minimo: 5, erro: 'Escreva como foi combinado.' }] }), 'perigo-sec'));
    }
    anexar(c, cartao('Cobranças no Asaas', foto ? el('span', { class: 'mudo peq', text: 'foto de ' + fmtHora(foto.tirada_em) }) : null, lista, acoes.length ? corpo(el('div', { class: 'acoes' }, acoes)) : null));
  }
  if (x.modalidade === 'teste' && pode('editar_teste')) {
    const usados = Number(sit.teste_dias_estendidos) || 0;
    anexar(c, cartao('Teste grátis', null, corpo(dados([['Fim do teste', fmtData(x.fim_teste)], comp ? ['Dias já estendidos', usados + ' de 30'] : null]),
      el('div', { class: 'acoes mt' }, btn('Estender o teste', () => fazer('teste_estender', { cliente_id: x.cliente_id }, { titulo: 'Estender o teste de ' + x.nome, nome: x.nome,
        texto: 'Até 30 dias a mais no total por clínica. Se o teste já acabou, a assistente volta a atender. Se a cobrança do fim do teste já existe, o vencimento vai junto.',
        campos: [{ k: 'dias', rot: 'Quantos dias a mais', inputmode: 'numeric', obrig: true, valor: '7' }, MOTIVO, { k: 'combinado', rot: 'Combinado com a clínica (se houver)', longo: true }] }))))));
  }
  if (comp) {
    const peds = comp.pedidos_asaas || [], comb = comp.combinados || [];
    anexar(c, el('div', { class: 'grade-2 iguais' },
      cartao('Pedidos ao Asaas', null, peds.length ? el('ul', { class: 'lista' }, peds.map(p => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
        el('div', { class: 't1', text: String(p.tipo || '').replace(/_/g, ' ') + ' · pedido ' + p.id }), el('div', { class: 't2', text: fmtHora(p.criado_em) + (p.feito_em ? ' → ' + fmtHora(p.feito_em) : '') + (p.resposta ? ' · ' + p.resposta : '') })),
        el('div', { class: 'direita' }, etq(p.status, p.status === 'feito' ? 'ok' : p.status === 'falhou' ? 'perigo' : 'atencao')))))) : vazio('Nenhum pedido ao Asaas.', 'financeiro')),
      cartao('Combinados com a clínica', null, comb.length ? el('ul', { class: 'lista' }, comb.map(k => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
        el('div', { class: 't1', text: String(k.tipo || '').replace(/_/g, ' ') + ' · ' + fmtHora(k.criado_em) }), el('div', { class: 't2', text: 'Motivo: ' + (k.motivo || '—') + (k.combinado ? ' · Combinado: ' + k.combinado : '') })))))) : vazio('Nenhum combinado.', 'info'))));
  }
  if (!ehTesteCobranca(x) && !['editar_plano', 'editar_preco', 'editar_cobranca', 'editar_teste'].some(ligada)) anexar(c, nota('As edições de dinheiro estão desligadas até o teste no sandbox.', true));
}

// ---------- Plano e recursos: rx_recursos, liberações, botões, limites, Enterprise
function abaRecursos(c, x) {
  const comp = x.completa || null;
  if (comp) {
    const rec = comp.recursos || {}, libs = (comp.liberacoes || []).filter(l => l.em_vigor), essencial = /^essencial/i.test(String(x.plano || '').trim());
    const acoes = [];
    if (ligada('liberar_recursos') && essencial) acoes.push(btn('Liberar um recurso', () => {
      const ops = (comp.liberaveis || []).filter(k => !rec[k]).map(k => [k, RECURSOS_NOMES[k] || k]);
      if (!ops.length) { rapida('Todos os recursos já estão liberados.'); return; }
      fazer('recurso_liberar', { cliente_id: x.cliente_id }, { titulo: 'Liberar recurso para ' + x.nome, ok: 'Recurso liberado.',
        texto: 'Os recursos do Enterprise (API, avisos de eventos, envio de mensagens) não se liberam: troque o plano. O botão do recurso continua valendo.',
        campos: [{ k: 'recurso', rot: 'Recurso', opcoes: ops }, { k: 'ate', rot: 'Até (vazio = sem data de fim)', tipo: 'date', min: somaDias(hojeISO(), 1) }, MOTIVO] });
    }, 'pri'));
    anexar(c, cartao('Recursos', null, el('ul', { class: 'lista' }, Object.keys(RECURSOS_NOMES).map(k => el('li', {}, el('div', { class: 'linha' },
      el('div', { class: 'cresce t1', text: RECURSOS_NOMES[k] }),
      el('div', { class: 'direita' }, etq(rec[k] ? (essencial && (rec.liberados || []).includes(k) ? 'liberado' : 'pelo plano') : 'não', rec[k] ? 'ok' : '')))))),
      corpo(el('p', { class: 'mudo peq', text: 'Informações extras: até ' + fmtNum(rec.info_extra) + ' letras.' }), acoes.length ? el('div', { class: 'acoes' }, acoes) : null)));
    if (libs.length) anexar(c, cartao('Liberações em vigor', null, el('ul', { class: 'lista' }, libs.map(l => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
      el('div', { class: 't1', text: RECURSOS_NOMES[l.recurso] || l.recurso }), el('div', { class: 't2', text: 'desde ' + fmtData(l.liberado_em) + (l.ate ? ' · até ' + fmtData(l.ate) : ' · sem data de fim') + ' · ' + (l.motivo || '') })),
      ligada('liberar_recursos') ? el('div', { class: 'direita' }, btn('Revogar', () => fazer('recurso_revogar', { cliente_id: x.cliente_id, id: l.id }, { titulo: 'Revogar ' + (RECURSOS_NOMES[l.recurso] || l.recurso), ok: 'Liberação revogada.', campos: [MOTIVO] }), 'perigo-sec')) : null))))));
  } else anexar(c, nota('Para ver os recursos e as liberações, ligue a ficha completa (tela_cliente_completa).', true));
  const grupos = [];
  if (comp && ligada('editar_recursos')) grupos.push(formGrupo(x, 'recursos', comp.campos, 'cliente_editar_recursos', 'Botões dos recursos'));
  if (ligada('editar_limites')) grupos.push(formGrupo(x, 'limites', comp ? comp.campos : x.limites, 'editar_limites', 'Limites e franquia'));
  if (grupos.length) anexar(c, cartao('Editar', null, ...grupos));
  if (ligada('editar_limites')) anexar(c, cartao('Limitar na franquia (cláusula 11.4)', null, corpo(el('p', { class: 'mudo', text: 'Só depois de 2 meses seguidos acima da franquia e de 15 dias do aviso à clínica.' }),
    btn('Registrar que avisei a clínica', () => fazer('franquia_aviso_registrar', { cliente_id: x.cliente_id }, { ok: 'Aviso registrado.' })))));
  if (!grupos.length && !['editar_recursos', 'editar_limites'].some(ligada)) anexar(c, nota('As edições de recursos e limites estão desligadas.', true));
  // Enterprise: avisos de eventos (o segredo aparece uma vez só).
  if (ligada('editar_avisos_eventos')) {
    const url = el('input', { class: 'entrada', id: 'av-url', type: 'url', inputmode: 'url', autocomplete: 'off', placeholder: 'https://…', spellcheck: 'false' });
    anexar(c, cartao('Avisos de eventos (Enterprise)', null, corpo(dados([['Agora', x.avisos_eventos ? `${x.avisos_eventos.ativo ? 'ligados' : 'desligados'} · ${x.avisos_eventos.servidor || ''}` : 'sem endereço']]),
      el('label', { class: 'campo mt', for: 'av-url' }, el('span', { class: 'rot', text: 'Endereço que recebe os avisos' }), url),
      el('div', { class: 'acoes' }, btn('Definir o endereço', () => {
        if (!/^https:\/\//.test(url.value.trim())) { rapida('Use um endereço https://.'); url.focus(); return; }
        fazer('aviso_destino_definir', { cliente_id: x.cliente_id, url: url.value.trim() }, { titulo: 'Avisos de eventos de ' + x.nome, texto: 'Gera um segredo novo; o antigo deixa de valer.',
          linhas: [['Servidor', x.avisos_eventos ? x.avisos_eventos.servidor : '—', (url.value.match(/^https:\/\/([^/]+)/) || [])[1] || url.value]],
          depois: async r => { await rotear(); mostrarSegredo('Segredo dos avisos de eventos', r.segredo, r.mensagem); } });
      }, 'pri'), x.avisos_eventos && x.avisos_eventos.ativo ? btn('Desligar', () => fazer('aviso_destino_desligar', { cliente_id: x.cliente_id }, { titulo: 'Desligar os avisos de eventos de ' + x.nome, linhas: [['Avisos', 'ligados', 'desligados']] }), 'perigo-sec') : null))));
  }
}

// ---------- Cadastro: contato, assistente, configurações, onboarding e Dados protegidos
function abaCadastro(c, x) {
  const comp = x.completa || null;
  anexar(c, cartao('Contato', null, corpo(dados([['Razão social', x.razao_social], ['Representante', x.representante], ['E-mail', x.email], ['Telefone', x.telefone], ['Cidade', x.cidade], ['Sistema de gestão', x.sistema_gestao], ['Origem', x.origem]]))));
  const grupos = [];
  if (comp && ligada('editar_assistente')) grupos.push(formGrupo(x, 'assistente', comp.campos, 'cliente_editar_assistente', 'Assistente (o que o onboarding grava)'));
  if (comp && ligada('editar_configuracoes')) grupos.push(formGrupo(x, 'configuracoes', comp.campos, 'cliente_editar_configuracoes', 'Configurações'));
  if (grupos.length) anexar(c, cartao('Editar', null, ...grupos));
  else anexar(c, nota(comp ? 'As edições da assistente e das configurações estão desligadas.' : 'Para editar, ligue a ficha completa e as edições em Ajustes.', true));
  anexar(c, cartao('Onboarding', null, corpo(dados([['Situação', x.onboarding], ['Vence', fmtData(x.onboarding_expira)]]),
    ligada('editar_onboarding') ? el('div', { class: 'acoes mt' }, x.pode_reenviar_onboarding
      ? btn('Reenviar o link de onboarding', () => fazer('reenviar_onboarding', { cliente_id: x.cliente_id }, { titulo: 'Reenviar o onboarding de ' + x.nome, linhas: [['Link atual', 'vale', 'deixa de valer']], texto: 'O workflow 21 manda o link novo por e-mail em até 10 minutos.' }))
      : el('p', { class: 'mudo peq', text: 'Só dá para reenviar quando a clínica está em "Aguardando dados".' })) : null)));
  // Dados protegidos (CPF, CNPJ, faturamento, aceite): só com a chave própria, carregados sob pedido, nunca guardados.
  if (ligada('tela_cliente_sensivel')) {
    const area = el('div', {});
    const mostrar = async () => {
      trocar(area, esqueleto());
      const r = await chamar('cliente_sensivel', { cliente_id: x.cliente_id });
      if (!r.ok) { trocar(area, el('div', { class: 'aviso perigo' }, icone('alerta'), el('div', { text: r.mensagem || 'Não consegui carregar.' }))); return; }
      const d = r.dados, e = d.empresa || {}, a = d.aceite || {}, cp = d.copia_do_aceite;
      trocar(area, el('div', { class: 'aviso atencao', 'data-sensivel': '1' }, icone('cadeado'), el('div', { text: 'Só nesta tela. Ao sair dela, ou quando a Central vai para o fundo, os dados somem da página. Ver estes dados fica no registro.' })),
        el('h3', { class: 'mt', text: 'Empresa' }), dados(GRUPOS.empresa.map(k => [ROTULOS[k] || k, e[k]])),
        el('h3', { class: 'mt', text: 'Registro do aceite (não editável)' }), dados([['Data do aceite', a.data_aceite], ['Versão dos termos', a.versao_termos], ['IP do aceite', a.ip_aceite], ['Acordo de tratamento (DPA)', a.aceite_dpa]]),
        el('h3', { class: 'mt', text: 'Cópia fixa do aceite' }), cp ? dados([['Guardada em', fmtHora(cp.copiado_em)], ['Razão social', cp.razao_social], ['CNPJ', cp.cnpj], ['Representante', cp.representante_nome], ['CPF', cp.representante_cpf], ['E-mail', cp.email], ['Telefone', cp.telefone], ['Data do aceite', cp.data_aceite], ['Versão', cp.versao_termos], ['IP', cp.ip_aceite]])
          : el('p', { class: 'mudo', text: 'Ainda sem cópia: ela é guardada antes da primeira edição dos dados da empresa.' }),
        ligada('editar_empresa') ? el('div', { class: 'mt' }, formGrupo({ cliente_id: d.cliente_id, nome: d.nome }, 'empresa', e, 'cliente_editar_empresa', 'Editar os dados da empresa')) : null,
        el('div', { class: 'acoes mt' }, btn('Esconder os dados protegidos', esconder, 'sec', 'cadeado')));
    };
    const esconder = () => trocar(area, el('div', { class: 'acoes' }, btn('Mostrar os dados protegidos', mostrar, 'sec', 'cadeado')));
    esconder();
    anexar(c, cartao('Dados protegidos', etq('CPF, CNPJ e faturamento', '', true), corpo(area)));
  }
}
// A Central foi para o fundo: tira da tela os dados protegidos (voltam com "Mostrar").
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  for (const a of document.querySelectorAll('[data-sensivel]')) { const area = a.parentElement; if (area) trocar(area, el('p', { class: 'mudo', text: 'Dados protegidos escondidos porque a Central saiu da tela. Toque em Atualizar para mostrar de novo.' })); }
});

// ---------- Histórico
const SIT_ENVIO = { na_fila: ['na fila', 'atencao'], montando: ['montando', 'info'], enviado: ['enviado', 'ok'], falhou: ['falhou', 'perigo'] };
function abaHistorico(c, x) {
  const comp = x.completa || null;
  const lt = (comp && comp.linha_do_tempo) || [];
  anexar(c, cartao('Linha do tempo', null, comp ? (lt.length ? el('ul', { class: 'lista' }, lt.map(t => {
    const o = String(t.o_que || ''); const txt = o.startsWith('Aviso: ') ? 'Aviso: ' + rotuloTipo(o.slice(7)) : o.startsWith('Central: ') ? 'Central: ' + (NOMES_EVENTO[o.slice(9)] || o.slice(9)) : o;
    return el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: txt }), el('div', { class: 't2', text: String(t.quando || '').length > 10 ? fmtHora(t.quando) : fmtData(t.quando) }))));
  })) : vazio('Nada na linha do tempo.', 'relogio')) : corpo(nota('Ligue a ficha completa para ver a linha do tempo.', true))),
  cartao('Últimos avisos desta clínica', null, listaAvisos(x.ultimos_avisos, false)),
  // Envios das conversas ao e-mail do cadastro (sql/059 e sql/061, DEC-131 e DEC-147): só a situação e a contagem.
  cartao('Envios das conversas', el('span', { class: 'mudo peq', text: 'os 5 mais recentes · o arquivo não passa pela Central' }), (x.conversas_envios || []).length
    ? el('ul', { class: 'lista' }, x.conversas_envios.map(e => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
      el('div', { class: 't1', text: 'Pedido em ' + fmtHora(e.pedido_em) }),
      el('div', { class: 't2', text: [e.enviado_em ? 'enviado em ' + fmtHora(e.enviado_em) : '', e.mensagens != null ? fmtNum(e.mensagens) + ' mensagem(ns)' : '', e.erro ? 'motivo: ' + e.erro : ''].filter(Boolean).join(' · ') || 'aguardando o workflow 31' })),
      el('div', { class: 'direita' }, etq(SIT_ENVIO[e.situacao] ? SIT_ENVIO[e.situacao][0] : (e.situacao || '—'), SIT_ENVIO[e.situacao] ? SIT_ENVIO[e.situacao][1] : '')))))) : vazio('Nenhum envio das conversas pedido.', 'relogio')));
  // Acessos recentes (sql/060, DEC-136, #184; antes "Histórico do painel", o nome do painel desde a entrega 5): quem entrou e o
  // que fez no painel da clínica, com o IP e o e-mail (o dono vê o mesmo em Conta › Acessos recentes, sem o IP). Só com a ficha completa ligada.
  if (!comp) return;
  const area = el('div', {}, corpo(el('p', { class: 'mudo', text: 'Carregando…' })));
  anexar(c, cartao('Acessos recentes', el('span', { class: 'mudo peq', text: 'os 100 mais recentes · 12 meses' }), area));
  chamar('cliente_painel_historico', { cliente_id: x.cliente_id }).then(r => {
    if (!r.ok) { trocar(area, corpo(nota(r.mensagem || 'Não consegui carregar os acessos recentes.', true))); return; }
    const l = (r.dados && r.dados.acessos) || [];
    trocar(area, l.length ? el('ul', { class: 'lista' }, l.map(a => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
      el('div', { class: 't1', text: a.o_que || a.evento || '' }),
      el('div', { class: 't2', text: [fmtHora(a.quando), a.quem_email ? (String(a.quem || '').split(' · ')[0] + ' · ' + a.quem_email) : a.quem, a.aparelho, a.ip ? 'IP ' + a.ip : ''].filter(Boolean).join(' · ') })))))) : vazio('Ninguém entrou no painel ainda.', 'relogio'));
  });
}

// ---------- menu Ações (situação, links, onboarding, teste da cobrança)
function menuAcoes(x) {
  const pode = podeEm(x), itens = [];
  const st = x.status, parada = ['Suspenso', 'Cancelado', 'Teste encerrado'].includes(st);
  const item = (t, s, fn, perigoso) => itens.push(el('li', {}, el('button', { type: 'button', class: perigoso ? 'perigoso' : null, onclick: () => { fechar(); fn(); } }, el('div', {}, t, el('span', { class: 't2', text: s })))));
  if (pode('editar_situacao')) {
    if (st === 'Suspenso') item('Reativar', 'A assistente volta a atender na hora.', () => fazer('situacao_reativar', { cliente_id: x.cliente_id }, { titulo: 'Reativar ' + x.nome, linhas: [['Situação', 'Suspenso', 'Ativo']], ok: 'Reativada.' }));
    if (x.ativo && !parada) item('Pausar a pedido da clínica', 'Cláusula 8.4: a assistente para; a mensalidade continua.', () => fazer('situacao_pausar', { cliente_id: x.cliente_id }, { titulo: 'Pausar a assistente de ' + x.nome, linhas: [['Assistente', 'atendendo', 'pausada']], ok: 'Pausada.' }));
    if (!x.ativo && !parada) item('Retomar o atendimento', 'A assistente volta a atender.', () => fazer('situacao_retomar', { cliente_id: x.cliente_id }, { titulo: 'Retomar a assistente de ' + x.nome, linhas: [['Assistente', 'pausada', 'atendendo']], ok: 'Retomada.' }));
    if (!parada) item('Suspender', 'Nível 3. Equipe: só volta pela Central. Inadimplência: volta ao pagar.', () => fazer('situacao_suspender', { cliente_id: x.cliente_id }, { titulo: 'Suspender ' + x.nome, nome: x.nome, botao: 'Suspender a clínica', ok: 'Suspensa.',
      texto: 'A assistente para de atender os pacientes desta clínica na hora. O aviso vai para o Telegram (sem dados pessoais).', linhas: [['Situação', st, 'Suspenso'], ['Assistente', x.ativo ? 'atendendo' : 'parada', 'parada']],
      campos: [{ k: 'suspensao_motivo', rot: 'Por quê?', opcoes: [['equipe', 'Decisão da equipe (só volta pela Central)'], ['inadimplencia', 'Inadimplência (volta sozinha ao pagar)']] }, MOTIVO] }), true);
    if (!x.cancelar_em && st !== 'Cancelado') item('Agendar o cancelamento', 'Nível 3. No dia, o 31 cancela a assinatura e desconecta o WhatsApp.', () => fazer('cancelamento_agendar', { cliente_id: x.cliente_id }, { titulo: 'Agendar o cancelamento de ' + x.nome, nome: x.nome, botao: 'Agendar o cancelamento', ok: 'Cancelamento agendado.',
      texto: 'A clínica recebe um e-mail agora.', campos: [{ k: 'data', rot: 'Data', tipo: 'date', min: somaDias(hojeISO(), 1), obrig: true }, MOTIVO] }), true);
    if (x.cancelar_em) item('Desfazer o cancelamento', 'A clínica recebe um e-mail.', () => fazer('cancelamento_desfazer', { cliente_id: x.cliente_id }, { titulo: 'Desfazer o cancelamento de ' + x.nome, linhas: [['Cancelamento', fmtData(x.cancelar_em), '(nenhum)']], ok: 'Cancelamento desfeito.' }));
  }
  if (ligada('editar_links')) {
    item('Reenviar o link do painel', 'Vai para o e-mail do cadastro; o link não aparece aqui.', () => fazer('link_painel_reenviar', { cliente_id: x.cliente_id }, { titulo: 'Reenviar o link do painel', texto: 'Vai para o e-mail do cadastro de ' + x.nome + '.' }));
    item('Reenviar o link de conexão', 'Para conectar o WhatsApp.', () => fazer('link_conectar_reenviar', { cliente_id: x.cliente_id }, { titulo: 'Reenviar o link de conexão do WhatsApp', texto: 'Vai para o e-mail do cadastro de ' + x.nome + '.' }));
    item('Gerar um link novo do painel', 'Nível 3. O link antigo para de funcionar.', () => fazer('link_painel_novo', { cliente_id: x.cliente_id }, { titulo: 'Gerar um link novo do painel', nome: x.nome, botao: 'Gerar o link novo',
      linhas: [['Link atual', 'vale', 'deixa de valer']], texto: 'Use se o link vazou. O novo vai para o e-mail do cadastro.' }), true);
  }
  // Histórico das conversas a pedido da clínica (sql/059, DEC-131, #67; cláusula 19.2): o 31 monta o CSV e manda direto
  // ao e-mail do cadastro. O arquivo não passa pela Central. Nível 2.
  if (st !== 'Dados apagados') item('Enviar as conversas ao e-mail do cadastro', 'Nível 2. Só a pedido da clínica; o arquivo não passa pela Central.', () => fazer('conversas_enviar', { cliente_id: x.cliente_id }, {
    titulo: 'Enviar as conversas de ' + x.nome, ok: 'Pedido na fila.',
    texto: 'Em até 15 minutos, o histórico das conversas (CSV, uma linha por mensagem, sem as notas internas) vai para o e-mail do cadastro' + (x.email ? ' (' + x.email + ')' : '') + '. O arquivo não passa pela Central, pelo banco nem pelo Telegram; o Telegram avisa quando sair ou se falhar.' }));
  if (ligada('editar_onboarding') && x.pode_reenviar_onboarding) item('Reenviar o onboarding', 'O workflow 21 manda o link novo em até 10 minutos.', () => fazer('reenviar_onboarding', { cliente_id: x.cliente_id }, { titulo: 'Reenviar o onboarding de ' + x.nome, linhas: [['Link atual', 'vale', 'deixa de valer']] }));
  if (est.chaves.asaas_ambiente === 'sandbox' && !x.interna) {
    if (ehTesteCobranca(x)) item('Deixar de ser a clínica de teste da cobrança', 'As edições de dinheiro voltam a depender das chaves.', async () => {
      const r = await fazer('cobranca_teste_definir', { cliente_id: '' }, { titulo: 'Limpar a clínica de teste da cobrança', linhas: [['Clínica de teste', x.cliente_id, '(nenhuma)']], ok: 'Clínica de teste limpa.', depois: async () => { await carregarConfig(); await rotear(); } });
      return r;
    });
    else item('Usar como clínica de teste da cobrança', 'Nível 3. Só uma clínica nova de teste, criada por você no contratar.html.', () => fazer('cobranca_teste_definir', { cliente_id: x.cliente_id }, { titulo: 'Clínica de teste da cobrança', nome: x.nome,
      texto: 'Nela, plano, cobrança e situação mudam mesmo com as chaves desligadas. O servidor recusa clínica que já pagou ou que é cliente de verdade. Chega um aviso no Telegram.', ok: 'Clínica de teste da cobrança definida.',
      depois: async () => { await carregarConfig(); await rotear(); } }), true);
  }
  const fechar = janela(el('div', { class: 'janela', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-menu' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-menu', text: 'Ações · ' + x.nome })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    itens.length ? el('ul', { class: 'menu-acoes' }, itens) : el('div', { class: 'corpo' }, nota('As ações de situação e links estão desligadas.', true), el('div', { class: 'acoes mt' }, btn('Fechar', () => fechar())))));
}
