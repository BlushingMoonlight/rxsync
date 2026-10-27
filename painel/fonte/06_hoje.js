// ---------------------------------------------------------------- Hoje (molde A): está tudo bem e o que eu faço agora?
// Ordem: estado da conta · primeiros passos (só no começo) · precisa de você · consultas de hoje · amanhã · os 3 números do mês.
// Usa só o que o servidor já manda: agenda_listar, agenda_documentos, agenda_chamados (S3), assistente_estado, termos_estado, indicadores e abrir.
const HOJE = { docs7: null, naoPagas: null, ind: null, chamados: null, semGestaoFechado: false };
tela('hoje', {
  montar: () => [el('div', { class: 'cab-tela' }, el('h1', { text: 'Hoje' }), el('span', { class: 'mudo peq', id: 'hojeData' })), el('div', { id: 'hojeCorpo' })],
  entrar: () => { hojeCarregar(); hojeRender(); }
});
function hojeCarregar() {
  // S3 (rxsync-sistema sql/067): quem pediu uma pessoa ou teve urgência nas últimas 48 horas e ainda não foi resolvido.
  d24('agenda_chamados').then(rows => { HOJE.chamados = Array.isArray(rows) ? rows : []; hojeRender(); }).catch(() => {});
  if (!sem('documentos')) d24('agenda_documentos').then(rows => { const lim = Date.now() - 7 * 86400000; HOJE.docs7 = (rows || []).filter(d => new Date(d.recebido_em).getTime() > lim).length; hojeRender(); }).catch(() => {});
  if (ligado('func_pagamento_link')) d24('agenda_listar', { nao_pagas: true }).then(rows => { HOJE.naoPagas = rows || []; hojeRender(); }).catch(() => {});
  // Os números do mês chegam depois: o "indicadores" consulta o Chatwoot e demora.
  if (!HOJE.ind) d24('indicadores', { dias: 30 }).then(r => { HOJE.ind = r || {}; hojeRender(); }).catch(() => { HOJE.ind = { erro: true }; hojeRender(); });
}
function hojeRender() {
  const box = $('hojeCorpo'); if (!box) return;
  $('hojeData').textContent = fmtD(hojeLocal(), { weekday: 'long', day: 'numeric', month: 'long' });
  const hoje = chave(hojeLocal()), amanha = chave(somaDias(hojeLocal(), 1));
  const ativos = (AG.dados || []).filter(agAtiva);
  const lista = ativos.filter(a => chaveIso(a.inicio) === hoje).sort((x, y) => new Date(x.inicio) - new Date(y.inicio));
  const nAmanha = ativos.filter(a => a.servico !== 'BLOQUEIO' && chaveIso(a.inicio) === amanha).length;
  const e = estadoAssistente();
  const blocos = [];
  // estado da conta (teste grátis, falta conectar, teste encerrado, suspensa) e o cancelamento agendado
  if (e.cartao) blocos.push(el('div', { class: 'cartao pad bloco', id: 'hojeEstado' }, el('p', { class: 'tit-bloco' }, el('span', { class: 'ponto ' + e.ponto }), e.t1), el('p', { class: 'mudo', text: e.t2 }),
    e.acao && (ehDono() || e.acao[1] !== 'conta/assinatura') ? el('div', { class: 'pilha' }, btn(e.acao[0], () => ir(e.acao[1]), 'pri')) : null));
  if (CONTA.cancelar_em) blocos.push(aviso('atencao', 'Cancelamento agendado para ' + CONTA.cancelar_em + '. Até lá tudo funciona normalmente. ', ehDono() ? el('button', { class: 'link', type: 'button', 'data-ir': 'conta/assinatura', text: 'Desistir do cancelamento' }) : null));
  // primeiros passos: cada um marcado pelo que o servidor já manda; some quando tudo estiver feito
  const passos = [['WhatsApp conectado', CONTA.no_ar !== false && CONTA.situacao !== 'teste_aguardando', 'conta/whatsapp'],
    ['Mande "oi" do seu celular para o WhatsApp da clínica e veja a assistente responder', !!(HOJE.ind && HOJE.ind.atual && HOJE.ind.atual.conversas > 0), null],
    ['Horários de atendimento conferidos', (GRADE.dados || []).length > 0 || MED.modo, 'agenda/horarios/grade'],
    ['Lembretes de consulta ligados', lembretesLigados(), 'assistente/automaticas']];
  if (passos.some(p => !p[1]) && (CONTA.situacao === 'em_teste' || CONTA.situacao === 'teste_aguardando' || CONTA.no_ar === false || (HOJE.ind && HOJE.ind.atual && !HOJE.ind.atual.conversas)))
    blocos.push(el('div', { class: 'bloco passos-ini', id: 'hojePassos' }, el('h2', { text: 'Primeiros passos' }), el('div', { class: 'lista' }, passos.map(([t, feito, rota]) =>
      el(rota && !feito ? 'button' : 'div', { class: 'linha', type: rota && !feito ? 'button' : null, 'data-ir': rota && !feito ? rota : null },
        el('span', { class: 'ic' + (feito ? ' feito' : '') }, icone(feito ? 'ok' : 'relogio')), el('span', { class: 'tx' }, el('span', { class: 't1', text: t }), el('span', { class: 't2', text: feito ? 'Feito' : 'A fazer' })),
        rota && !feito ? el('span', { class: 'seta' }, icone('seta')) : null)))));
  // precisa de você: as não vistas, as não pagas e os documentos
  const novos = agGrupos().novos.length, np = (HOJE.naoPagas || []).length;
  const precisa = (HOJE.chamados || []).map(chamadoLinha);
  if (novos) precisa.push(el('button', { class: 'linha', type: 'button', onclick: () => { AG.filtro = 'novos'; AG.visao = 'lista'; ir('agenda'); } }, el('span', { class: 'ic' }, icone('agenda')),
    el('span', { class: 'tx' }, el('span', { class: 't1', text: novos === 1 ? '1 consulta nova para ver' : novos + ' consultas novas para ver' }), el('span', { class: 't2', text: 'Marcadas desde a última vez que alguém olhou' })), el('span', { class: 'seta' }, icone('seta'))));
  if (ligado('func_pagamento_link') && np) precisa.push(el('button', { class: 'linha', type: 'button', onclick: () => { AG.filtro = 'naopagas'; AG.visao = 'lista'; agNaoPagasCarregar(); ir('agenda'); } }, el('span', { class: 'ic' }, icone('dinheiro')),
    el('span', { class: 'tx' }, el('span', { class: 't1', text: np === 1 ? '1 consulta não paga' : np + ' consultas não pagas' }), el('span', { class: 't2', text: 'Confirmadas sem pagamento marcado' })), el('span', { class: 'seta' }, icone('seta'))));
  if (HOJE.docs7) precisa.push(linhaLink(HOJE.docs7 === 1 ? '1 documento recebido' : HOJE.docs7 + ' documentos recebidos', 'De pacientes, nos últimos 7 dias', 'agenda/documentos', 'documento'));
  const colPrincipal = [el('div', { class: 'bloco', id: 'hojeAtencao' }, el('h2', { text: 'Precisa de você' }), precisa.length ? el('div', { class: 'lista' }, precisa) : el('div', { class: 'cartao' }, vazio(null, 'Nada pendente agora.'))),
    el('div', { class: 'bloco' }, el('h2', { class: 'tit-bloco' }, 'Consultas de hoje', el('span', { class: 'extra num', id: 'hojeTotal', text: lista.filter(a => a.servico !== 'BLOQUEIO').length ? pl(lista.filter(a => a.servico !== 'BLOQUEIO').length, 'consulta', 'consultas') : '' })),
      el('div', { id: 'hojeLinha' }, AG.carregou ? (lista.length ? el('div', { class: 'lista' }, lista.map(a => consultaLinha(a, { hora: true }))) : el('div', { class: 'cartao' }, vazio('Nenhuma consulta hoje', 'Quando a assistente ou a equipe marcar, a consulta aparece aqui.', btn('Nova consulta', () => { ir('agenda'); setTimeout(() => consultaNova(), 50); }, 'sec', 'soma')))) : el('div', { class: 'cartao' }, esqueleto())),
      el('p', { class: 'mudo peq pilha', id: 'hojeAmanha', text: nAmanha ? 'Amanhã: ' + nAmanha + (nAmanha === 1 ? ' consulta marcada.' : ' consultas marcadas.') : '' }))];
  const ind = HOJE.ind, a = ind && ind.atual;
  const numeros = el('div', { class: 'bloco', id: 'hojeNumeros' }, el('h2', { text: 'Últimos 30 dias' }), !ind ? el('div', { class: 'cartao' }, esqueleto()) : ind.erro ? el('div', { class: 'cartao' }, vazio(null, 'Os números não carregaram agora.')) :
    el('div', { class: 'numeros' }, indicador('Conversas', fmtNum(a.conversas), 'pessoas que falaram com a assistente'), indicador('Marcadas pela assistente', fmtNum(a.agendadas_ia), 'consultas sem trabalho da equipe'),
      indicador('Confirmaram presença', a.com_lembrete ? a.presenca_confirmada + ' de ' + a.com_lembrete : '—', 'responderam ao lembrete')),
    el('div', { class: 'pilha' }, btn('Ver resultados', () => ir('resultados'), 'sec', 'grafico')));
  const colLado = [numeros, sem('assistente_dono') && !HOJE.semGestaoFechado && ehDono() ? el('div', { class: 'cartao pad bloco' }, el('p', { class: 'tit-bloco' }, el('span', { class: 'selo-plano', text: 'Gestão' }), 'Assistente de gestão'),
    el('p', { class: 'mudo', text: 'Pergunte sobre a agenda e peça mudanças pelo painel ou pelo seu WhatsApp, sem abrir o painel. Faz parte do plano Gestão Inteligente.' }),
    el('div', { class: 'linha-botoes pilha' }, btn('Conhecer o plano', () => ir('conta/assinatura'), 'sec'), btn('Fechar', () => { HOJE.semGestaoFechado = true; hojeRender(); }, 'fant'))) : null];
  trocar(box, blocos, el('div', { class: 'ini-colunas' }, el('div', {}, colPrincipal), el('div', {}, colLado)));
}
// Um chamado de "Precisa de você" (S3): urgência ou pediu uma pessoa, o motivo, há quanto tempo, quando a assistente volta, "Abrir no WhatsApp" e "Resolvido".
function chamadoLinha(ch) {
  let d = String(ch.telefone || '').replace(/\D/g, ''); if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
  const min = Math.max(0, Math.round((Date.now() - new Date(ch.criado_em).getTime()) / 60000));
  const ha = min < 1 ? 'agora' : min < 60 ? 'há ' + pl(min, 'minuto', 'minutos') : min < 1440 ? 'há ' + pl(Math.round(min / 60), 'hora', 'horas') : 'há ' + pl(Math.round(min / 1440), 'dia', 'dias');
  const quem = ch.nome_paciente || pacTel(d) || 'Paciente';
  // P4 (sql/074): a hora em que a assistente volta a responder a conversa (vazio = ela não parou). Quando a equipe responde
  // o paciente, o chamado sai sozinho.
  let volta = '';
  if ('volta_em' in ch) {
    const v = ch.volta_em ? new Date(ch.volta_em).getTime() : null, dia = ch.volta_em ? chaveIso(ch.volta_em) : '';
    volta = v == null ? 'a assistente continua respondendo' : v <= Date.now() ? 'a assistente já voltou a responder'
      : 'a assistente volta a responder ' + (dia === chave(hojeLocal()) ? '' : dia === chave(somaDias(hojeLocal(), 1)) ? 'amanhã ' : 'em ' + dia.slice(8, 10) + '/' + dia.slice(5, 7) + ' ') + 'às ' + hhmm(minDia(ch.volta_em));
  }
  const resolver = btn('Resolvido', ev => {
    ev.currentTarget.disabled = true;
    d24('agenda_chamado_resolver', { id: ch.id }).then(r => {
      if (r && r.ok) { HOJE.chamados = (HOJE.chamados || []).filter(x => x.id !== ch.id); rapida('Marcado como resolvido.'); hojeRender(); }
      else { rapida('Não consegui marcar agora. Tente de novo.'); hojeCarregar(); }
    }).catch(() => rapida('Não consegui marcar agora. Tente de novo.'));
  }, 'sec', 'ok');
  return el('div', { class: 'linha chamado' + (ch.urgente ? ' urgente' : '') }, el('span', { class: 'ic' }, icone(ch.urgente ? 'alerta' : 'chat')),
    el('div', { class: 'tx' }, el('span', { class: 't1' }, ch.urgente ? etq('Urgência', 'perigo', 'alerta') : null, (ch.urgente ? ' ' : 'Pediu para falar com alguém: ') + quem),
      el('span', { class: 't2', text: [ch.motivo, ha, ch.aviso_enviado === false ? 'o aviso no WhatsApp de avisos não chegou' : '', volta].filter(Boolean).join(' · ') }),
      el('div', { class: 'linha-botoes' }, d ? el('a', { class: 'btn sec', href: zap(d), target: '_blank', rel: 'noopener' }, icone('zap', 'p'), 'Abrir no WhatsApp') : null, resolver)));
}
function indicador(rot, val, fonte, varia) {
  return el('div', { class: 'indicador' }, el('div', { class: 'rot', text: rot }), el('div', { class: 'val num', text: val }), varia ? el('div', { class: 'var ' + (varia.bom === true ? 'bom' : varia.bom === false ? 'ruim' : ''), text: varia.txt }) : null,
    fonte ? el('div', { class: 'fonte', text: fonte }) : null);
}

// ---------------------------------------------------------------- Resultados (molde G): período, números, gráficos e avaliações
const RES = { dias: 30, graficos: [] };
tela('resultados', {
  montar: () => [cabTela('Resultados', { voltar: ['hoje', 'Hoje'], sub: 'O que a assistente fez pela clínica.' }),
    el('div', { class: 'controles' }, el('div', { class: 'seg', role: 'group', 'aria-label': 'Período', id: 'resPeriodo' }, [7, 30, 90].map(d => el('button', { type: 'button', 'data-dias': d, text: d + ' dias',
      onclick: () => { RES.dias = d; resultadosCarregar(); } })))),
    el('div', { id: 'resCorpo' }, el('div', { class: 'cartao' }, esqueleto()))],
  entrar: () => resultadosCarregar()
});
let chartPromessa = null;
function carregarChart() {
  if (window.Chart) return Promise.resolve();
  if (!chartPromessa) chartPromessa = new Promise((ok, falha) => {
    const sc = document.createElement('script'); sc.src = '/assets/vendor/chart-4.4.1.umd.js';   // no próprio site (rxsync-sistema#104)
    sc.onload = ok; sc.onerror = () => { chartPromessa = null; falha(); }; document.head.append(sc);
  });
  return chartPromessa;
}
function resDelta(atual, anterior, menorMelhor) {
  if (atual == null || anterior == null) return null;
  if (anterior === 0) return atual > 0 ? { txt: 'novo no período', bom: !menorMelhor } : null;
  const p = Math.round(((atual - anterior) / anterior) * 100);
  if (p === 0) return { txt: 'igual ao período anterior', bom: null };
  return { txt: (p > 0 ? '▲ +' : '▼ −') + Math.abs(p) + '% sobre o período anterior', bom: menorMelhor ? p < 0 : p > 0 };
}
const resTempo = seg => seg == null ? '—' : seg < 90 ? Math.round(seg) + ' s' : seg < 5400 ? Math.round(seg / 60) + ' min' : String(Math.round(seg / 360) / 10).replace('.', ',') + ' h';
const RES_NIVEIS = [[0, 'Começando'], [10, 'Bronze'], [50, 'Prata'], [150, 'Ouro'], [500, 'Platina'], [1000, 'Diamante']];
function resultadosCarregar() {
  document.querySelectorAll('#resPeriodo button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.dias === RES.dias)));
  const box = $('resCorpo'); trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  d24('indicadores', { dias: RES.dias }).then(r => {
    const a = r.atual || r, p = r.anterior || null, ant = k => p ? p[k] : null;
    const pct = (x, y) => y ? Math.round((x / y) * 100) : null;
    const nums = [indicador('Conversas', fmtNum(a.conversas), a.conversas == null ? 'indisponível no momento' : 'pessoas que falaram com a assistente', resDelta(a.conversas, ant('conversas'))),
      indicador('Marcadas pela assistente', fmtNum(a.agendadas_ia), 'consultas sem trabalho da equipe', resDelta(a.agendadas_ia, ant('agendadas_ia'))),
      indicador('Marcadas pela equipe', fmtNum(a.agendadas_manual), 'lançadas no painel', resDelta(a.agendadas_manual, ant('agendadas_manual'))),
      indicador('Taxa de agendamento', a.taxa_agendamento == null ? '—' : String(a.taxa_agendamento).replace('.', ',') + '%', 'consultas da assistente ÷ conversas', resDelta(a.taxa_agendamento, ant('taxa_agendamento'))),
      indicador('Tempo da 1ª resposta', resTempo(a.tempo_resposta_seg), 'média no período', resDelta(a.tempo_resposta_seg, ant('tempo_resposta_seg'), true)),
      indicador('Confirmaram presença', a.com_lembrete ? a.presenca_confirmada + ' de ' + a.com_lembrete : '—', 'consultas que receberam lembrete', resDelta(pct(a.presenca_confirmada, a.com_lembrete), p ? pct(p.presenca_confirmada, p.com_lembrete) : null)),
      indicador('Cancelamentos', fmtNum(a.canceladas), 'consultas canceladas no período', resDelta(a.canceladas, ant('canceladas'), true))];
    if (r.tem_fila !== false && a.fila_entradas != null) nums.push(indicador('Entraram na lista de espera', fmtNum(a.fila_entradas), '', resDelta(a.fila_entradas, ant('fila_entradas'))),
      indicador('Vagas repostas', fmtNum(a.vagas_repostas), 'cancelamentos preenchidos pela lista', resDelta(a.vagas_repostas, ant('vagas_repostas'))));
    if (r.pesquisa && r.pesquisa.enviadas) { const ps = r.pesquisa; nums.push(indicador('Nota média dos pacientes', ps.media == null ? '—' : String(ps.media).replace('.', ',') + ' / 10', ps.respondidas + ' de ' + ps.enviadas + ' responderam à pesquisa'),
      indicador('NPS', ps.nps == null ? '—' : String(ps.nps), '% de notas 9 e 10 menos % de notas 0 a 6'), indicador('Notas baixas (0 a 6)', fmtNum(ps.detratores), 'a equipe foi avisada na hora')); }
    const blocos = [el('div', { class: 'bloco' }, el('div', { class: 'numeros' }, nums), p ? el('p', { class: 'legenda pilha', text: 'As variações comparam com o período anterior, do mesmo tamanho.' }) : null)];
    if (r.totais) blocos.push(resTotais(r.totais));
    if (r.uso) blocos.push(resUso(r.uso));
    if (r.serie) blocos.push(el('div', { class: 'bloco' }, el('h2', { text: 'Consultas marcadas por dia' }), el('div', { class: 'cartao pad' }, el('div', { class: 'grafico-caixa' }, el('canvas', { id: 'grDias', role: 'img', 'aria-label': resDescreverSerie(r.serie) })), el('p', { class: 'legenda pilha', text: resDescreverSerie(r.serie) }))),
      el('div', { class: 'duas-ipad' }, resCartaoGrafico('Quem marcou', 'grOrigem'), resCartaoGrafico('Presença nas consultas com lembrete', 'grPresenca')),
      el('div', { class: 'duas-ipad' }, resCartaoGrafico('Dias mais procurados', 'grSemana'), resCartaoGrafico('Horários mais procurados', 'grHora')));
    if (r.totais) blocos.push(resConquistas(r));
    blocos.push(el('div', { id: 'resAvaliacoes' }));
    trocar(box, blocos);
    resAvaliacoes();
    if (r.serie) resGraficos(r);
  }).catch(() => trocar(box, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'Os resultados não carregaram agora.', btn('Tentar de novo', resultadosCarregar, 'sec')))));
}
const resCartaoGrafico = (t, id) => el('div', { class: 'bloco' }, el('h2', { text: t }), el('div', { class: 'cartao pad' }, el('div', { class: 'grafico-caixa baixo' }, el('canvas', { id, role: 'img', 'aria-label': t }))));
function resDescreverSerie(s) { const ia = s.reduce((n, x) => n + (x.ia || 0), 0), eq = s.reduce((n, x) => n + (x.manual || 0), 0); return 'No período: ' + pl(ia, 'consulta marcada', 'consultas marcadas') + ' pela assistente e ' + eq + ' pela equipe.'; }
function resTotais(t) {
  const total = t.ia || 0; let nivel = RES_NIVEIS[0], prox = null;
  RES_NIVEIS.forEach((n, i) => { if (total >= n[0]) { nivel = n; prox = RES_NIVEIS[i + 1] || null; } });
  const horas = Math.round((total * 5) / 60);
  return el('div', { class: 'bloco' }, el('h2', { text: 'Desde o início' }), el('div', { class: 'cartao pad' },
    el('p', {}, el('span', { class: 'num tit-bloco', text: fmtNum(total) + (total === 1 ? ' consulta marcada pela assistente' : ' consultas marcadas pela assistente') })),
    el('p', { class: 'mudo peq', text: '≈ ' + fmtNum(horas) + ' h de recepção poupadas (estimativa de 5 minutos por consulta)' + (t.desde ? ' · desde ' + t.desde.split('-').reverse().join('/') : '') }),
    el('p', { class: 'pilha' }, etq('Nível ' + nivel[1], 'marca'), prox ? el('span', { class: 'mudo peq', text: ' Faltam ' + fmtNum(prox[0] - total) + ' para o nível ' + prox[1] + '.' }) : el('span', { class: 'mudo peq', text: ' Nível máximo.' })),
    prox ? el('div', { class: 'uso-barra', role: 'img', 'aria-label': 'Progresso até o próximo nível' }, largura(el('i'), ((total - nivel[0]) / (prox[0] - nivel[0])) * 100)) : null));
}
function resUso(u) {
  const fr = u.franquia || 5000, pct = Math.round((u.mes / fr) * 100);
  let nota = 'Conta as mensagens trocadas entre a assistente e os pacientes: as que ela recebe e as que envia, incluindo lembretes e avisos de vaga.';
  if (pct >= 100) nota = (u.limitada ? 'A franquia do mês acabou e a assistente está pausada até o próximo mês. Fale com a gente para ampliar. ' : 'Você passou da franquia do mês. Vamos falar com você para ajustar o plano, sem cobrança surpresa. ') + nota;
  else if (pct >= 80) nota = 'Você já usou mais de 80% da franquia do mês. ' + nota;
  return el('div', { class: 'bloco' }, el('h2', { text: 'Mensagens neste mês' }), el('div', { class: 'cartao pad' },
    el('p', {}, el('span', { class: 'num tit-bloco', text: pct + '%' }), el('span', { class: 'mudo', text: ' · ' + fmtNum(u.mes) + ' de ' + fmtNum(fr) + ' da franquia do plano' })),
    el('div', { class: 'uso-barra', role: 'img', 'aria-label': pct + '% da franquia' }, largura(el('i'), pct)),
    el('dl', { class: 'dados pilha' }, [['Hoje', u.hoje], ['Neste ano', u.ano], ['Desde o início', u.total]].map(([k, v]) => [el('dt', { text: k }), el('dd', { class: 'num', text: fmtNum(v) })])),
    el('p', { class: 'dica', text: nota }), u.dono_hoje ? el('p', { class: 'dica', text: 'Assistente de gestão: ' + fmtNum(u.dono_hoje) + ' de ' + fmtNum(u.dono_limite || 60) + ' perguntas hoje (não entram na franquia).' }) : null,
    u.desde ? el('p', { class: 'legenda', text: 'Contagem desde ' + u.desde.split('-').reverse().join('/') + '. O mês vira no dia 1º.' }) : null));
}
function resConquistas(r) {
  const t = r.totais || {}, a = r.atual || r, taxaPres = a.com_lembrete ? a.presenca_confirmada / a.com_lembrete : 0;
  const lista = [['Primeira consulta marcada pela assistente', t.ia, 1], ['10 consultas marcadas pela assistente', t.ia, 10], ['100 consultas marcadas pela assistente', t.ia, 100], ['1.000 consultas marcadas pela assistente', t.ia, 1000],
    ['50 presenças confirmadas pelos pacientes', t.presenca, 50], ['Resposta rápida: 1ª resposta em até 1 minuto no período', null, null, a.tempo_resposta_seg != null && a.tempo_resposta_seg <= 60],
    ['Agenda que converte: 30% ou mais das conversas viram consulta no período', null, null, a.taxa_agendamento != null && a.taxa_agendamento >= 30],
    ['Presença em alta: 80% ou mais confirmaram no período (mín. 5 lembretes)', null, null, a.com_lembrete >= 5 && taxaPres >= 0.8]];
  if (r.tem_fila) lista.push(['Primeira vaga reposta pela lista de espera', t.vagas, 1], ['10 vagas repostas pela lista de espera', t.vagas, 10]);
  const feitas = lista.filter(x => x[3] != null ? x[3] : (x[1] || 0) >= x[2]).length;
  return el('div', { class: 'bloco' }, el('h2', { class: 'tit-bloco' }, 'Conquistas', el('span', { class: 'extra', text: feitas + ' de ' + lista.length })), el('div', { class: 'lista' }, lista.map(x => {
    const ok = x[3] != null ? x[3] : (x[1] || 0) >= x[2];
    return el('div', { class: 'linha' }, el('span', { class: 'ic' }, icone(ok ? 'ok' : 'relogio')), el('span', { class: 'tx' }, el('span', { class: 't1', text: x[0] }),
      el('span', { class: 't2', text: ok ? 'Conquistada' : x[2] ? fmtNum(x[1] || 0) + ' de ' + fmtNum(x[2]) : 'Ainda não neste período' })));
  })));
}
function resGraficos(r) {
  carregarChart().then(() => {
    RES.graficos.forEach(g => g.destroy()); RES.graficos = [];
    const css = getComputedStyle(document.documentElement), MARCA = css.getPropertyValue('--primaria').trim(), CINZA = css.getPropertyValue('--toggle-off').trim(),
      TEXTO2 = css.getPropertyValue('--texto-2').trim(), BORDA = css.getPropertyValue('--borda').trim();
    window.Chart.defaults.font.family = 'Inter, -apple-system, sans-serif'; window.Chart.defaults.font.size = 12; window.Chart.defaults.color = TEXTO2;
    const base = { responsive: true, maintainAspectRatio: false, animation: { duration: 200 }, plugins: { legend: { display: false } } };
    const eixos = { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: BORDA } } };
    const rot = r.serie.map(s => { const p = s.dia.split('-'); return p[2] + '/' + p[1]; });
    RES.graficos.push(new window.Chart($('grDias'), { type: 'bar', data: { labels: rot, datasets: [{ label: 'Pela assistente', data: r.serie.map(s => s.ia), backgroundColor: MARCA, stack: 'a' }, { label: 'Pela equipe', data: r.serie.map(s => s.manual), backgroundColor: CINZA, stack: 'a' }] },
      options: { ...base, plugins: { legend: { display: true, position: 'bottom' } }, scales: { x: { ...eixos.x, stacked: true }, y: { ...eixos.y, stacked: true } } } }));
    const a = r.atual || r, barras = (id, rotulos, dados, cores) => RES.graficos.push(new window.Chart($(id), { type: 'bar', data: { labels: rotulos, datasets: [{ data: dados, backgroundColor: cores }] }, options: { ...base, indexAxis: 'y', scales: { x: eixos.y, y: eixos.x } } }));
    barras('grOrigem', ['Pela assistente', 'Pela equipe'], [a.agendadas_ia || 0, a.agendadas_manual || 0], [MARCA, CINZA]);
    barras('grPresenca', ['Confirmaram', 'Não confirmaram'], [a.presenca_confirmada || 0, Math.max(0, (a.com_lembrete || 0) - (a.presenca_confirmada || 0))], [MARCA, CINZA]);
    const ordem = [1, 2, 3, 4, 5, 6, 0], NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const semana = ordem.map(i => (r.semana || [])[i] || 0), maxS = Math.max(...semana);
    RES.graficos.push(new window.Chart($('grSemana'), { type: 'bar', data: { labels: ordem.map(i => NOMES[i]), datasets: [{ data: semana, backgroundColor: semana.map(v => v && v === maxS ? MARCA : CINZA) }] }, options: { ...base, scales: eixos } }));
    const hrs = r.hora || []; let ini = 24, fim = -1; hrs.forEach((v, i) => { if (v > 0) { ini = Math.min(ini, i); fim = Math.max(fim, i); } }); if (fim < 0) { ini = 8; fim = 18; }
    const faixa = []; for (let h = ini; h <= fim; h++) faixa.push(h);
    const hv = faixa.map(h => hrs[h] || 0), maxH = Math.max(...hv);
    RES.graficos.push(new window.Chart($('grHora'), { type: 'bar', data: { labels: faixa.map(h => String(h).padStart(2, '0') + 'h'), datasets: [{ data: hv, backgroundColor: hv.map(v => v && v === maxH ? MARCA : CINZA) }] }, options: { ...base, scales: eixos } }));
  }).catch(() => {});
}
// Avaliações da pesquisa de satisfação: as 20 mais recentes, com o código do paciente e as notas anteriores dele.
function resAvaliacoes() {
  const box = $('resAvaliacoes'); if (!box) return;
  if (sem('pesquisa')) { trocar(box); return; }
  d24('agenda_avaliacoes').then(rows => {
    rows = (rows || []).slice(0, 20);
    if (!rows.length) { trocar(box); return; }
    const dia = d => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    trocar(box, el('div', { class: 'bloco' }, el('h2', { text: 'Avaliações dos pacientes' }), el('p', { class: 'subtitulo', text: 'As 20 mais recentes. O código ao lado do nome é o do paciente, o mesmo da agenda.' }),
      el('div', { class: 'lista' }, rows.map(a => el('div', { class: 'linha' }, el('span', { class: 'tx' },
        el('span', { class: 't1' }, etq(a.pesquisa_nota + '/10', a.pesquisa_nota <= 6 ? 'perigo' : a.pesquisa_nota >= 9 ? 'ok' : ''), ' ' + (a.nome_paciente || 'Paciente') + (a.paciente_id ? ' (' + a.paciente_id + ')' : '') + ' · ' + dia(a.pesquisa_respondida_em)),
        a.pesquisa_comentario ? el('span', { class: 't2', text: '“' + a.pesquisa_comentario + '”' }) : null,
        (a.anteriores || []).length ? el('span', { class: 't2', text: 'Notas anteriores: ' + a.anteriores.map(x => x.nota + ' (' + dia(x.respondida_em) + ')').join(', ') }) : null))))));
  }).catch(() => trocar(box));
}
