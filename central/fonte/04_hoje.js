// ---------------------------------------------------------------- avisos (tipos) e a tela Hoje
const TIPOS = {
  cadastro_teste: 'Teste novo (7 dias)', contratacao_nova: 'Contratação nova', mini_teste_comecou: 'Mini teste começou', mini_teste_terminou: 'Mini teste terminou',
  pedido_demonstracao: 'Pedido de demonstração', pedido_demonstracao_nao_gravado: 'Pedido de demonstração NÃO guardado',
  onboarding_enviado: 'Link de onboarding enviado', onboarding_concluido: 'Onboarding concluído', no_ar: 'Clínica no ar', teste_ambiente_criado: 'Ambiente de teste criado',
  teste_fim_proximo: 'Teste chegando ao fim', teste_encerrado: 'Teste encerrado', teste_virou_contrato: 'Teste virou contrato', pago_na_implantacao: 'Pago na implantação', teste_parado: 'Teste parado',
  aviso_equipe_nao_chegou: 'Aviso à equipe da clínica NÃO chegou', franquia_100: 'Franquia atingida', franquia_80: '80% da franquia', integracao_agenda: 'Problema na agenda externa',
  assistente_dono_falhou: 'Assistente do dono falhou', whatsapp_caiu: 'WhatsApp desconectado', whatsapp_voltou: 'WhatsApp reconectado', aviso_evento_nao_entregue: 'Aviso de evento não entregue',
  mini_teste_teto: 'Mini teste no teto', copia_n8n_parada: 'Cópia do n8n parada',
  cobranca_criada: 'Cobrança criada', cobranca_faltam_dados: 'Cobrança: faltam dados', cobranca_incompleta: 'Cobrança pela metade', pagamento_confirmado: 'Pagamento confirmado',
  mensalidade_recebida: 'Mensalidade recebida', taxa_recebida: 'Taxa de implantação recebida', atraso_na_implantacao: 'Atraso (ainda em implantação)', pagamento_atrasado: 'Pagamento atrasado',
  pagamento_nao_identificado: 'Pagamento não identificado', nota_fiscal_erro: 'Erro na nota fiscal', reativado_apos_atraso: 'Pagou o atraso', valor_divergente: 'Valor diferente do esperado',
  aviso_suspensao: 'Aviso de suspensão', suspenso: 'Suspenso', reativado: 'Reativado', atraso_30_dias: '30 dias sem pagamento', contrato_encerrado: 'Contrato encerrado',
  valor_atualizado: 'Valor atualizado', resumo_do_dia: 'Resumo do dia', troca_de_plano: 'Troca de plano', teste_encerrado_pelo_cliente: 'Teste encerrado pelo cliente',
  pedido_cancelamento: 'Pedido de cancelamento', cancelamento_agendado: 'Cancelamento agendado', cancelamento_desfeito: 'Desistiu do cancelamento', teste_quer_pagar: 'Teste quer pagar', pedido_assinatura: 'Pedido sobre a assinatura',
  ajuda_agenda: 'Pedido de ajuda com a agenda', email_recebido: 'E-mail recebido', painel_movimento: 'Movimento no painel',
  exclusao_amanha: 'Dados serão apagados amanhã', exclusao_falhou: 'Falha ao apagar dados', dados_apagados: 'Dados apagados', outro: 'Outro aviso',
  prosp_numero_caiu: 'Prospecção: número caiu', prosp_numero_conectado: 'Prospecção: número conectado', prosp_token_aceito: 'Prospecção: token aceito',
  prosp_token_recusado: 'Prospecção: token recusado', prosp_busca: 'Prospecção: busca', prosp_conjunto_pausado: 'Prospecção: conjunto pausado', prosp_regra: 'Prospecção: regra automática',
  prosp_saiu: 'Prospecção: pediu para sair', prosp_interesse: 'Prospecção: mostrou interesse', prosp_quer_contratar: 'Prospecção: quer contratar', prosp_recusou: 'Prospecção: recusou',
  prosp_respondeu: 'Prospecção: respondeu', prosp_cliente: 'Prospecção: virou cliente', prosp_cadastro: 'Prospecção: fez o cadastro', prosp_com_voce: 'Prospecção: conversa com você',
  prosp_resumo_do_dia: 'Prospecção: resumo do dia',
  demo_aberta: 'Demonstração aberta', demo_conversar: 'Demonstração: quer conversar', demo_escopo: 'Demonstração: escopo enviado'
};
const CATEGORIAS = ['vendas', 'clientes', 'financeiro', 'alertas', 'suporte', 'painel', 'sistema'];
const rotuloTipo = t => TIPOS[t] || t || 'Aviso';
const irCliente = (id, aba) => ir('clientes/' + encodeURIComponent(id) + (aba ? '/' + aba : ''));
function listaAvisos(avisos, comClinica) {
  if (!avisos || !avisos.length) return vazio('Nenhum aviso.', 'avisos');
  return el('ul', { class: 'lista' }, avisos.map(a => el('li', {}, el('div', { class: 'linha' },
    el('div', { class: 'cresce' }, el('div', { class: 't1', text: rotuloTipo(a.tipo) }), el('div', { class: 't2', text: fmtHora(a.recebido_em) + (comClinica && a.cliente_id ? ' · ' + (a.nome || a.cliente_id) : '') })),
    el('div', { class: 'direita' }, etq(a.categoria || '—', '', true))))));
}
const nomeCli = x => x.nome || x.cliente_id || '—';

TELAS.hoje = async c => {
  topo('Hoje', [['Hoje']]);
  const [r, rd] = await Promise.all([chamar('inicio'), ligada('tela_dinheiro') ? chamar('dinheiro') : Promise.resolve(null)]);
  if (falhou(c, r, 'Hoje')) return;
  const d = r.dados, p = d.pendencias || {}, n = d.numeros || {}, f = d.funil_30d || { totais: {}, por_dia: [] };
  // "Precisa da sua atenção": crítico → atenção → informação; cada item leva à tela que resolve.
  const pend = [];
  const add = (prior, t, s, rota) => pend.push({ prior, t, s, rota });
  for (const w of p.whatsapp_fora || []) add('critico', 'WhatsApp desconectado', `${nomeCli(w)} · desde ${fmtHora(w.desde)}`, 'clientes/' + encodeURIComponent(w.cliente_id));
  if (p.falhas_24h) add('critico', `${pl(p.falhas_24h, 'falha', 'falhas')} de workflow em 24 horas`, 'Ver em Saúde do sistema', 'sistema');
  for (const x of p.suspensos || []) add('critico', 'Clínica suspensa', nomeCli(x), 'clientes/' + encodeURIComponent(x.cliente_id) + '/cobranca');
  for (const x of p.aviso_atraso || []) add('atencao', 'Aviso de atraso enviado', nomeCli(x), 'clientes/' + encodeURIComponent(x.cliente_id) + '/cobranca');
  for (const x of p.cancelamentos_agendados || []) add('atencao', 'Cancelamento em ' + fmtData(x.em), nomeCli(x), 'clientes/' + encodeURIComponent(x.cliente_id));
  for (const x of p.onboarding_vencido || []) add('atencao', 'Onboarding vencido', nomeCli(x), 'clientes/' + encodeURIComponent(x.cliente_id) + '/cadastro');
  for (const x of p.franquia_80 || []) add('atencao', `${fmtNum(x.usadas)} de ${fmtNum(x.franquia)} mensagens`, nomeCli(x), 'clientes/' + encodeURIComponent(x.cliente_id) + '/recursos');
  if (p.integracoes_com_erro) add('atencao', `${pl(p.integracoes_com_erro, 'integração', 'integrações')} de agenda com erro`, 'Ver em Saúde do sistema', 'sistema');
  if (p.avisos_eventos_desistidos_7d) add('atencao', `${pl(p.avisos_eventos_desistidos_7d, 'aviso de eventos não entregue', 'avisos de eventos não entregues')}`, 'Últimos 7 dias', 'sistema');
  const limite = somaDias(hojeISO(), 3);
  for (const x of (rd && rd.ok ? rd.dados.testes : []) || []) if (x.fim_teste && x.fim_teste <= limite) add('atencao', 'Teste termina em ' + fmtData(x.fim_teste), nomeCli(x), 'clientes/' + encodeURIComponent(x.cliente_id) + '/cobranca');
  if (p.pedidos_demonstracao_7d) add('info', `${pl(p.pedidos_demonstracao_7d, 'pedido', 'pedidos')} de demonstração`, 'Últimos 7 dias', 'crescimento');
  est.contadores.hoje = pend.filter(x => x.prior !== 'info').length || 0;
  est.contadores.sistema = (p.whatsapp_fora || []).length + (p.falhas_24h ? 1 : 0) + (p.integracoes_com_erro ? 1 : 0);
  montarNav();
  const nomePrior = { critico: 'Crítico', atencao: 'Atenção', info: 'Informação' };
  const agora = new Date();
  trocar(c, 
    cabecalho('Hoje', agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }), n.asaas_ambiente === 'sandbox' ? etq('Asaas no sandbox', 'atencao') : null),
    el('div', { class: 'pilha' },
      el('div', { class: 'grade-2' },
        cartao('Precisa da sua atenção', etq(pend.length ? pend.length + (pend.length === 1 ? ' item' : ' itens') : 'tudo em dia', pend.length ? '' : 'ok', !!pend.length),
          pend.length ? el('ul', { class: 'lista' }, pend.slice(0, 10).map(x => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => ir(x.rota) },
            el('span', { class: 'prior ' + x.prior, 'aria-hidden': 'true' }), el('div', { class: 'cresce' }, el('div', { class: 't1' }, el('span', { class: 'sr', text: nomePrior[x.prior] + ': ' }), x.t), el('div', { class: 't2', text: x.s })), icone('seta')))))
            : vazio('Nada pendente agora.', 'ok')),
        cartao('Agora', null, corpo(dados([['Mensagens hoje', fmtNum(n.mensagens_hoje)], ['Falhas hoje', fmtNum(n.falhas_hoje)], ['Avisos hoje', fmtNum(n.avisos_hoje)],
          ['Em implantação', fmtNum(n.em_implantacao)], ['Pedidos de demonstração (30 dias)', fmtNum(f.totais.pedidos_demonstracao)]])))),
      el('div', { class: 'kpis' }, kpi('Receita do mês', fmtReal(n.receita_mensal), 'anual à vista conta 1/12'), kpi('Pagantes no ar', fmtNum(n.pagantes_no_ar)),
        kpi('Em teste', fmtNum(n.em_teste)), kpi('Em implantação', fmtNum(n.em_implantacao))),
      el('div', { class: 'grade-2' },
        cartao('Funil · 30 dias', null, corpo(grafBarras((f.por_dia || []).map(x => ({ r: diaCurto(x.dia), v: (x.pedidos || 0) + (x.mini_testes || 0) + (x.cadastros || 0) })), 'Pedidos, mini testes e cadastros por dia'),
          el('div', { class: 'mt' }, dados([['Mini testes', fmtNum(f.totais.mini_testes) + ' (' + fmtNum(f.totais.mini_testes_com_consulta) + ' marcaram consulta)'], ['Cadastros (teste / contrato)', fmtNum(f.totais.cadastros_teste) + ' / ' + fmtNum(f.totais.cadastros_contratacao)], ['Foram ao ar', fmtNum(f.totais.go_lives)]])))),
        cartao('Últimos avisos', btn('Ver todos', () => ir('avisos'), 'fant'), listaAvisos((d.ultimos_avisos || []).slice(0, 6), true)))));
};
