// ---------------------------------------------------------------- Financeiro, Saúde do sistema e Análise (só leitura)
const linhaCli = (x, direita, aba) => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irCliente(x.cliente_id, aba) },
  el('div', { class: 'cresce t1', text: nomeCli(x) }), el('div', { class: 'direita' }, el('span', { class: 'mudo num', text: direita })), icone('seta')));
const listaCli = (arr, fn, aba, txtVazio) => arr && arr.length ? el('ul', { class: 'lista' }, arr.map(x => linhaCli(x, fn(x), aba))) : vazio(txtVazio || 'Nada por aqui.', 'clientes');

TELAS.financeiro = async c => {
  topo('Financeiro', [['Financeiro']]);
  const r = await chamar('dinheiro'); if (falhou(c, r, 'Financeiro')) return;
  const d = r.dados;
  trocar(c, cabecalho('Financeiro', 'receita, pagantes e atrasos', d.asaas_ambiente === 'sandbox' ? etq('Asaas no sandbox', 'atencao') : null),
    el('div', { class: 'pilha' },
      d.asaas_ambiente === 'sandbox' ? el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', { text: 'O Asaas está no ambiente de testes: os valores não são dinheiro real.' })) : null,
      el('div', { class: 'kpis' }, kpi('Receita do mês', fmtReal(d.receita_mensal), 'anual à vista conta 1/12'), kpi('Pagantes no ar', fmtNum(d.pagantes_no_ar)), kpi('Em teste', fmtNum(d.em_teste)), kpi('Em implantação', fmtNum(d.em_implantacao))),
      d.receita_12_meses && d.receita_12_meses.length ? cartao('Receita no fim de cada mês', null, corpo(grafBarras(d.receita_12_meses.map(x => ({ r: fmtData(x.dia).slice(3), v: Number(x.receita_mensal) || 0 })), 'Receita mensal'))) : null,
      el('div', { class: 'grade-2 iguais' },
        cartao('Pagantes', null, listaCli(d.pagantes, x => `${fmtReal(x.valor_no_mes)} · ${x.plano}`, 'cobranca')),
        cartao('Em teste', null, listaCli(d.testes, x => 'até ' + fmtData(x.fim_teste), 'cobranca', 'Nenhuma clínica em teste.'))),
      el('div', { class: 'grade-2 iguais' },
        cartao('Aviso de atraso enviado', null, listaCli(d.aviso_atraso, x => 'desde ' + fmtData(x.desde), 'cobranca', 'Nenhum atraso.'), corpo(el('p', { class: 'mudo peq', text: 'Dias e valor do atraso vêm do Asaas e aparecem no resumo diário do Telegram.' }))),
        cartao('Suspensas', null, listaCli(d.suspensos, x => 'desde ' + fmtData(x.desde), 'geral', 'Nenhuma clínica suspensa.'))),
      cartao('Cancelamentos agendados', null, listaCli(d.cancelamentos, x => fmtData(x.em), 'geral', 'Nenhum cancelamento agendado.'))));
};

TELAS.sistema = async c => {
  topo('Saúde do sistema', [['Saúde do sistema']]);
  const r = await chamar('sistema'); if (falhou(c, r, 'Saúde do sistema')) return;
  const d = r.dados, gh = d.github && d.github.dados;
  const fora = (d.whatsapp || []).filter(w => w.estado !== 'open'), falhas7 = (d.falhas_por_workflow_7d || []).reduce((s, x) => s + Number(x.falhas), 0);
  const integErro = (d.integracoes || []).filter(i => i.ultimo_erro).length;
  const problemas = fora.length + (falhas7 ? 1 : 0) + integErro;
  trocar(c, cabecalho('Saúde do sistema', 'workflows, WhatsApp e integrações'),
    el('div', { class: 'pilha' },
      el('div', { class: 'aviso ' + (problemas ? 'atencao' : 'ok'), role: 'status' }, icone(problemas ? 'alerta' : 'ok'), el('div', {}, el('b', { text: problemas ? problemas + ' ponto(s) para olhar. ' : 'Tudo funcionando. ' }),
        `WhatsApp fora: ${fora.length} · falhas em 7 dias: ${falhas7} · agendas com erro: ${integErro}`)),
      el('div', { class: 'kpis' }, kpi('Último aviso recebido', d.ultimo_aviso_recebido ? fmtHora(d.ultimo_aviso_recebido) : '—'), kpi('Última foto do dia', d.ultima_foto_indicadores ? fmtHora(d.ultima_foto_indicadores) : '—'),
        kpi('WhatsApp fora', fmtNum(fora.length)), kpi('Falhas em 7 dias', fmtNum(falhas7))),
      el('div', { class: 'grade-2 iguais' },
        cartao('Falhas por workflow (7 dias)', null, (d.falhas_por_workflow_7d || []).length ? el('ul', { class: 'lista' }, d.falhas_por_workflow_7d.map(x => el('li', {}, el('div', { class: 'linha' },
          el('div', { class: 'cresce' }, el('div', { class: 't1', text: x.workflow }), el('div', { class: 't2', text: 'última ' + fmtHora(x.ultima) })), el('div', { class: 'direita' }, etq(fmtNum(x.falhas), 'perigo', true)))))) : vazio('Nenhuma falha em 7 dias.', 'ok')),
        cartao('Últimas falhas', null, (d.ultimas_falhas || []).length ? el('ul', { class: 'lista' }, d.ultimas_falhas.map(x => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
          el('div', { class: 't1', text: x.workflow }), el('div', { class: 't2', text: `${fmtHora(x.quando)} · nó: ${x.no || '(gatilho)'}${x.execucao_id ? ' · execução ' + x.execucao_id : ''}` })))))) : vazio('Nenhuma.', 'ok'))),
      cartao('WhatsApp das clínicas no ar', null, (d.whatsapp || []).length ? el('ul', { class: 'lista' }, d.whatsapp.map(w => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irCliente(w.cliente_id) },
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: nomeCli(w) }), el('div', { class: 't2', text: `desde ${fmtHora(w.desde)} · conferido ${fmtHora(w.verificado_em)}` })),
        el('div', { class: 'direita' }, etq(w.estado === 'open' ? 'conectado' : 'desconectado', w.estado === 'open' ? 'ok' : 'perigo')))))) : vazio('O workflow 05 ainda não conferiu nenhum WhatsApp.', 'sistema')),
      el('div', { class: 'grade-2 iguais' },
        cartao('Agendas externas', null, (d.integracoes || []).length ? el('ul', { class: 'lista' }, d.integracoes.map(i => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
          el('div', { class: 't1', text: `${nomeCli(i)} · ${i.plataforma}` }), el('div', { class: 't2', text: `${i.ativo ? 'ligada' : 'desligada'} · última sincronização ${fmtHora(i.ultima_sync)}${i.ultimo_erro ? ' · erro: ' + i.ultimo_erro : ''}` })),
          el('div', { class: 'direita' }, etq(i.ultimo_erro ? 'erro' : 'ok', i.ultimo_erro ? 'perigo' : 'ok')))))) : vazio('Nenhuma agenda externa.', 'sistema')),
        cartao('Avisos de eventos (Enterprise)', null, (d.avisos_eventos || []).length ? el('ul', { class: 'lista' }, d.avisos_eventos.map(a => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
          el('div', { class: 't1', text: a.cliente_id }), el('div', { class: 't2', text: `${a.pendentes} pendentes · ${a.enviados_7d} enviados e ${a.desistidos_7d} desistidos em 7 dias` })))))) : vazio('Nenhum destino ligado.', 'api'))),
      el('div', { class: 'grade-2 iguais' },
        cartao('SQL aplicados', null, (d.sql_aplicados || []).length ? el('ul', { class: 'lista' }, d.sql_aplicados.map(s => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce t1', text: s.arquivo }), el('div', { class: 'direita' }, el('span', { class: 'mudo peq', text: fmtHora(s.aplicado_em) })))))) : vazio()),
        gh ? cartao('GitHub', el('span', { class: 'mudo peq', text: 'recebido ' + fmtHora(d.github.recebido_em) }),
          el('ul', { class: 'lista' }, (gh.actions || []).map(a => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: a.nome }), el('div', { class: 't2', text: fmtHora(a.quando) + ' · ' + a.evento })),
            el('div', { class: 'direita' }, etq(a.resultado === 'success' ? 'verde' : a.resultado || a.status, a.resultado === 'success' ? 'ok' : a.resultado ? 'perigo' : 'atencao')))))),
          corpo(dados([['Issues abertas', fmtNum((gh.issues || {}).abertas)], ...Object.entries((gh.issues || {}).por_prioridade || {}).sort().map(([k, v]) => [k, fmtNum(v)]), ['PRs abertos', fmtNum(gh.prs_abertos)]]),
            ((gh.issues || {}).p1 || []).length ? el('ul', { class: 'lista mt' }, gh.issues.p1.map(i => el('li', {}, el('div', { class: 'linha' }, etq('#' + i.numero, 'perigo', true), el('div', { class: 'cresce', text: i.titulo }))))) : null))
          : cartao('GitHub', null, vazio(ligada('tela_sistema_github') ? 'A Action "Central: dados do GitHub" ainda não mandou nada.' : 'Desligado em Ajustes (tela_sistema_github).', 'sistema')))));
};

TELAS.crescimento = async (c, [periodo]) => {
  const noventa = periodo === '90';
  topo('Crescimento', [['Análise'], ['Crescimento']]);
  const abas = el('div', { class: 'filtros', role: 'tablist', 'aria-label': 'Período' }, el('button', { type: 'button', role: 'tab', 'aria-pressed': String(!noventa), 'aria-selected': String(!noventa), onclick: () => ir('crescimento') }, '30 dias'),
    ligada('tela_funil_completo') ? el('button', { type: 'button', role: 'tab', 'aria-pressed': String(noventa), 'aria-selected': String(noventa), onclick: () => ir('crescimento/90') }, '90 dias') : null);
  if (noventa) {
    const r = await chamar('funil_completo'); if (falhou(c, r, 'Crescimento')) return;
    const d = r.dados, t = d.funil_90d.totais;
    const lst = (arr, fn) => arr && arr.length ? el('ul', { class: 'lista' }, arr.map(fn)) : vazio();
    trocar(c, cabecalho('Crescimento', 'funil de 90 dias'), el('div', { class: 'pilha' }, abas,
      el('div', { class: 'kpis' }, kpi('Pedidos', fmtNum(t.pedidos_demonstracao)), kpi('Mini testes', fmtNum(t.mini_testes), fmtNum(t.mini_testes_com_consulta) + ' marcaram consulta'),
        kpi('Testes que viraram contrato', fmtNum(d.testes_que_viraram_contrato), 'desde o começo'), kpi('Dias até o go-live', d.dias_ate_go_live_media == null ? '—' : String(d.dias_ate_go_live_media), 'média')),
      cartao('Por dia', null, corpo(grafBarras(d.funil_90d.por_dia.map(x => ({ r: diaCurto(x.dia), v: x.pedidos + x.mini_testes + x.cadastros })), 'Pedidos, mini testes e cadastros por dia'))),
      el('div', { class: 'grade-2 iguais' },
        cartao('Mini teste por origem', null, lst(d.mini_teste_por_origem_90d, x => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce t1', text: x.origem }), el('div', { class: 'direita' }, el('span', { class: 'mudo num', text: `${x.testes} testes · ${x.com_consulta} com consulta` })))))),
        cartao('Mini teste por especialidade', null, corpo(dados(Object.entries(d.mini_teste_por_especialidade_90d || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, fmtNum(v)]))))),
      el('div', { class: 'grade-2 iguais' },
        cartao('Cadastros por origem', null, lst(d.cadastros_por_origem, x => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce t1', text: x.origem }), el('div', { class: 'direita' }, el('span', { class: 'mudo num', text: fmtNum(x.cadastros) })))))),
        cartao('Cadastros parados (mais de 14 dias)', null, listaCli(d.cadastros_parados, x => `${x.status} · ${x.dias} dias`, 'geral', 'Nenhum cadastro parado.'))),
      cartao('Onboarding vencido', null, listaCli(d.onboarding_vencido, x => 'venceu ' + fmtData(x.venceu), 'cadastro', 'Nenhum onboarding vencido.')),
      el('p', { class: 'mudo peq', text: `Testes encerrados sem contrato: ${fmtNum(d.testes_encerrados_sem_contrato)}.` })));
    return;
  }
  const r = await chamar('funil'); if (falhou(c, r, 'Crescimento')) return;
  const d = r.dados, t = d.totais;
  const wa = tel => { const dig = String(tel || '').replace(/\D/g, ''); return dig ? 'https://wa.me/' + (dig.length <= 11 ? '55' + dig : dig) : null; };
  trocar(c, cabecalho('Crescimento', 'funil de 30 dias'), el('div', { class: 'pilha' }, abas,
    el('div', { class: 'kpis' }, kpi('Pedidos de demonstração', fmtNum(t.pedidos_demonstracao)), kpi('Mini testes', fmtNum(t.mini_testes), fmtNum(t.mini_testes_com_consulta) + ' marcaram consulta'),
      kpi('Cadastros (teste / contrato)', `${fmtNum(t.cadastros_teste)} / ${fmtNum(t.cadastros_contratacao)}`), kpi('Foram ao ar', fmtNum(t.go_lives))),
    cartao('Por dia', null, corpo(grafBarras(d.por_dia.map(x => ({ r: diaCurto(x.dia), v: x.pedidos + x.mini_testes + x.cadastros })), 'Pedidos, mini testes e cadastros por dia'))),
    cartao('Pedidos de demonstração', el('span', { class: 'mudo peq', text: 'guardados por 180 dias (Política v9)' }), d.pedidos.length ? el('ul', { class: 'lista' }, d.pedidos.map(p => el('li', {}, el('div', { class: 'linha' },
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${p.nome} · ${p.clinica}` }),
        el('div', { class: 't2', text: `${fmtHora(p.criado_em)} · ${p.email} · ${p.telefone}${p.sistema_atual ? ' · usa ' + p.sistema_atual : ''} · plano: ${p.plano_interesse || 'indeciso'}` })),
      wa(p.telefone) ? el('div', { class: 'direita' }, el('a', { class: 'btn sec', href: wa(p.telefone), target: '_blank', rel: 'noopener noreferrer', text: 'WhatsApp' })) : null)))) : vazio('Nenhum pedido nos últimos 180 dias.', 'crescimento')),
    // Mini testes do site (sql/059, DEC-134): os dados que antes iam ao Telegram ficam só aqui, por 90 dias.
    cartao('Mini testes do site', el('span', { class: 'mudo peq', text: 'os 50 mais novos · guardados por 90 dias' }), (d.mini_testes || []).length ? el('ul', { class: 'lista' }, d.mini_testes.map(m => el('li', {}, el('div', { class: 'linha' },
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: [m.clinica, m.especialidade].filter(Boolean).join(' · ') || 'Mini teste' }),
        el('div', { class: 't2', text: [fmtHora(m.criado_em), m.telefone, fmtNum(m.mensagens || 0) + ' mensagem(ns)', m.agendamento ? 'marcou consulta' : 'não marcou', m.origem ? 'origem: ' + m.origem : ''].filter(Boolean).join(' · ') }),
        Array.isArray(m.conversa) && m.conversa.length ? el('details', { class: 'mt' }, el('summary', { text: 'Ver a conversa' }),
          el('ul', { class: 'lista' }, m.conversa.map(t => el('li', {}, el('div', { class: 't2', text: (t.r === 'a' ? 'Assistente: ' : 'Pessoa: ') + String(t.t || '') }))))) : null),
      wa(m.telefone) ? el('div', { class: 'direita' }, el('a', { class: 'btn sec', href: wa(m.telefone), target: '_blank', rel: 'noopener noreferrer', text: 'WhatsApp' })) : null)))) : vazio('Nenhum mini teste nos últimos 90 dias.', 'crescimento'))));
};

TELAS.uso = async c => {
  topo('Uso e limites', [['Análise'], ['Uso e limites']]);
  const r = await chamar('uso'); if (falhou(c, r, 'Uso e limites')) return;
  const d = r.dados, frac = d.dia_do_mes / d.dias_no_mes;
  trocar(c, cabecalho('Uso e limites', `dia ${d.dia_do_mes} de ${d.dias_no_mes} · a projeção supõe o mesmo ritmo até o fim do mês`), el('div', { class: 'pilha' },
    cartao('Mensagens por dia (todas as clínicas, 30 dias)', null, corpo(grafBarras(d.total_30d.map(x => ({ r: diaCurto(x.dia), v: x.mensagens })), 'Mensagens por dia'))),
    cartao('Clínicas', null, d.clinicas.length ? el('ul', { class: 'lista' }, d.clinicas.map(x => {
      const proj = frac ? Math.round(x.mensagens_mes / frac) : 0;
      return el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irCliente(x.cliente_id, 'recursos') }, el('div', { class: 'cresce' },
        el('div', { class: 't1', text: x.nome }), el('div', { class: 't2 num', text: `${fmtNum(x.mensagens_mes)} de ${fmtNum(x.franquia)}${x.franquia_padrao ? ' (padrão)' : ''} · projeção ${fmtNum(proj)}${x.limitar_franquia ? ' · limita na franquia' : ''}` }),
        barraUso(x.mensagens_mes, x.franquia)), el('div', { class: 'direita' }, etq(x.plano || '—', 'info', true))));
    })) : vazio())));
};

TELAS.avisos = async (c, [cat]) => {
  topo('Avisos', [['Análise'], ['Avisos']]);
  cat = CATEGORIAS.includes(cat) ? cat : '';
  const r = await chamar('avisos', { categoria: cat }); if (falhou(c, r, 'Avisos')) return;
  const pc = r.dados.por_categoria_7d || {};
  trocar(c, cabecalho('Avisos', 'o que passou pelo Telegram, sem o texto'), el('div', { class: 'pilha' },
    el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Categoria' }, ['', ...CATEGORIAS].map(k => el('button', { type: 'button', 'aria-pressed': String(k === cat), onclick: () => ir('avisos' + (k ? '/' + k : '')) },
      k || 'todas', pc[k] ? el('span', { class: 'n', text: pc[k] }) : null))),
    el('p', { class: 'mudo peq', text: '7 dias: ' + (Object.entries(pc).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nenhum') }),
    cartao(null, null, listaAvisos(r.dados.avisos, true))));
};

TELAS.agregados = async c => {
  topo('Agregados de pacientes', [['Análise'], ['Agregados de pacientes']]);
  const r = await chamar('agregados'); if (falhou(c, r, 'Agregados de pacientes')) return;
  const cols = [['pacientes', 'Pacientes'], ['consultas_30d_ia', 'Consultas pela IA (30 d)'], ['consultas_30d_equipe', 'Pela equipe (30 d)'], ['lista_espera_ativa', 'Lista de espera'],
    ['documentos_30d', 'Documentos (30 d)'], ['preconsulta_30d', 'Perguntas antes de agendar (30 d)'], ['pesquisa_nota_media_90d', 'Nota média (90 d)'], ['relacionamento_30d', 'Relacionamento (30 d)']];
  trocar(c, cabecalho('Agregados de pacientes', 'só contagens e médias por clínica; nenhum dado de paciente'),
    cartao(null, null, el('div', { class: 'tabela-rolagem', tabindex: '0', 'aria-label': 'Tabela de agregados (role para o lado)' }, el('table', { class: 'dados-t' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: 'Clínica' }), cols.map(([, n]) => el('th', { scope: 'col', text: n })))),
      el('tbody', {}, r.dados.clinicas.map(x => el('tr', {}, el('th', { scope: 'row', text: x.nome }), cols.map(([k]) => el('td', { class: 'num', text: x[k] == null ? '—' : fmtNum(x[k]) })))))))));
};
