// ---------------------------------------------------------------- Administração: Segurança, API, Ajustes e "Mais"
const NOMES_EVENTO = { entrada: 'Entrada', entrada_errada: 'Tentativa errada', bloqueio: 'Bloqueio', saida: 'Saída', saida_todos: 'Sair de todos', sessao_encerrada: 'Sessão encerrada',
  chave: 'Chave mudada', chaves_padrao: 'Chaves padrão (sql/030)', edicao_limites: 'Limites editados', reenvio_onboarding: 'Onboarding reenviado', chave_api_criada: 'Chave da API criada', chave_api_revogada: 'Chave da API revogada',
  avisos_eventos_destino: 'Avisos de eventos: endereço', avisos_eventos_desligados: 'Avisos de eventos desligados', desfeito: 'Edição desfeita', erro_interno: 'Erro interno',
  codigo_pedido: 'Código pedido no Telegram', codigo_perdido: 'Código perdido (5 erros)', codigo_nao_enviado: 'Código não saiu pelo Telegram', senha_criada: 'Senha criada', senha_trocada: 'Senha trocada', reinicio_por_sql: 'Reinício por SQL',
  viu_dados_sensiveis: 'Viu os dados protegidos', edicao_empresa: 'Empresa editada', edicao_assistente: 'Assistente editada', edicao_configuracoes: 'Configurações editadas', edicao_recursos: 'Botões dos recursos editados',
  aviso_limitacao_franquia: 'Aviso de limitação da franquia', recurso_liberado: 'Recurso liberado', recurso_revogado: 'Liberação revogada', plano_trocado: 'Plano trocado', preco_especial: 'Preço especial',
  cobranca_proxima_data: 'Próxima cobrança mudada', cobranca_vencimento: 'Vencimento mudado', implantacao_isentar: 'Implantação isenta', pagamento_receber_dinheiro: 'Recebido em dinheiro',
  teste_estendido: 'Teste estendido', situacao_suspender: 'Suspensa', situacao_reativar: 'Reativada', situacao_pausar: 'Assistente pausada', situacao_retomar: 'Assistente retomada',
  cancelamento_agendar: 'Cancelamento agendado', cancelamento_desfazer: 'Cancelamento desfeito', link_reenviado: 'Link reenviado', token_painel_novo: 'Link novo do painel',
  cobranca_teste_cliente: 'Clínica de teste da cobrança', chave_api_limites: 'Limites da chave da API',
  prosp_salvar: 'Prospecção: camada salva', prosp_duplicar: 'Prospecção: cópia', prosp_ligar: 'Prospecção: ligou ou pausou', prosp_encerrar: 'Prospecção: encerrada', prosp_apagar: 'Prospecção: rascunho apagado',
  prosp_numero: 'Prospecção: número de WhatsApp', prosp_regra: 'Prospecção: regra', prosp_custos: 'Prospecção: custos', prosp_lead: 'Prospecção: lead', prosp_buscar: 'Prospecção: busca pedida', prosp_exportar: 'Prospecção: exportação' };
const DESFAZIVEIS = ['edicao_limites', 'chave_api_criada', 'edicao_assistente', 'edicao_configuracoes', 'edicao_recursos', 'recurso_liberado'];
const resumoDetalhe = d => { if (!d || typeof d !== 'object') return ''; const p = []; if (d.cliente_id) p.push(d.cliente_id); if (d.chave) p.push(`${d.chave}: ${d.antes} → ${d.depois}`); if (d.motivo) p.push(d.motivo); if (d.como) p.push(d.como);
  if (d.finalidade) p.push(d.finalidade === 'senha' ? 'troca de senha' : 'entrada'); if (d.prefixo) p.push(d.prefixo + '…');
  if (d.antes && d.depois && typeof d.antes === 'object') p.push(Object.keys(d.depois).map(k => `${k}: ${d.antes[k] ?? '—'} → ${d.depois[k] ?? '—'}`).join(', ')); return p.join(' · '); };

TELAS.seguranca = async (c, [aba]) => {
  const registro = aba === 'registro';
  topo('Segurança', [['Administração'], ['Segurança', registro ? 'seguranca' : null], registro ? ['Registro'] : null].filter(Boolean));
  const abas = el('div', { class: 'filtros', role: 'tablist', 'aria-label': 'Segurança' }, el('button', { type: 'button', role: 'tab', 'aria-selected': String(!registro), 'aria-pressed': String(!registro), onclick: () => ir('seguranca') }, 'Aparelhos'),
    el('button', { type: 'button', role: 'tab', 'aria-selected': String(registro), 'aria-pressed': String(registro), onclick: () => ir('seguranca/registro') }, 'Registro'));
  if (registro) {
    const r = await chamar('registro'); if (falhou(c, r, 'Registro')) return;
    trocar(c, cabecalho('Segurança', 'registro de 12 meses'), el('div', { class: 'pilha' }, abas, cartao(null, null, r.dados.registro.length ? el('ul', { class: 'lista' }, r.dados.registro.map(x => el('li', {}, el('div', { class: 'linha' },
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: (NOMES_EVENTO[x.evento] || x.evento) + (x.desfeito_em ? ' (desfeita)' : '') }),
        el('div', { class: 't2', text: `${fmtHora(x.quando)} · ${x.navegador || '?'} · IP ${x.ip || '?'}${resumoDetalhe(x.detalhe) ? ' · ' + resumoDetalhe(x.detalhe) : ''}` })),
      DESFAZIVEIS.includes(x.evento) && !x.desfeito_em ? el('div', { class: 'direita' }, btn('Desfazer', () => desfazer(x.id))) : null)))) : vazio('Nada no registro.', 'seguranca'))));
    return;
  }
  const r = await chamar('sessoes'); if (falhou(c, r, 'Segurança')) return;
  const d = r.dados;
  trocar(c, cabecalho('Segurança', 'aparelhos conectados'), el('div', { class: 'pilha' }, abas,
    cartao('Aparelhos conectados', null, el('ul', { class: 'lista' }, d.sessoes.map(s => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
      el('div', { class: 't1', text: s.navegador + (s.esta ? ' (este aparelho)' : '') }), el('div', { class: 't2', text: `entrou ${fmtHora(s.criada_em)} · IP ${s.ip || '?'} · usada ${fmtHora(s.ultimo_uso_em)}` })),
      s.esta ? el('div', { class: 'direita' }, etq('este', 'ok')) : el('div', { class: 'direita' }, btn('Encerrar', async () => { const x = await chamar('encerrar_sessao', { id: s.id }); rapida(x.ok ? 'Sessão encerrada.' : (x.mensagem || 'Não consegui.')); rotear(); }, 'perigo-sec')))))),
      corpo(el('p', { class: 'mudo peq', text: `A sessão vale 8 horas, ou 30 minutos sem uso.${d.senha_trocada_em ? ' Senha criada ou trocada em ' + fmtHora(d.senha_trocada_em) + '.' : ''} Para trocar a senha, saia e toque em "Esqueci a senha".` }),
        btn('Sair de todos os aparelhos', async () => {
          const v = await pedirAcao('sair_todos', {}, { titulo: 'Sair de todos os aparelhos', texto: 'Todas as sessões, inclusive esta, terminam agora. Chega um aviso no Telegram.', botao: 'Sair de todos', perigo: true });
          if (!v) return; await chamar('sair_todos', v); guardarSessao(''); entrada('Você saiu de todos os aparelhos.');
        }, 'perigo-sec')))));
};

TELAS.api = async c => {
  topo('API (Enterprise)', [['Administração'], ['API (Enterprise)']]);
  const r = await chamar('chaves_api'); if (falhou(c, r, 'API (Enterprise)')) return;
  const d = r.dados, editar = ligada('editar_chaves_api');
  const lista = d.chaves.length ? el('ul', { class: 'lista' }, d.chaves.map(k => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' },
    el('div', { class: 't1', text: `${k.prefixo}… · ${k.nome || 'sem nome'} · ${k.nome_clinica || k.cliente_id}` }),
    el('div', { class: 't2', text: `criada ${fmtData(k.criada_em)} · último uso ${fmtHora(k.ultimo_uso_em)} · limites ${k.limite_minuto}/min e ${k.limite_dia}/dia · 7 dias: ${Object.entries(k.uso_7d || {}).map(([a, b]) => a + ' ' + b).join(', ') || 'sem uso'}` })),
    el('div', { class: 'direita' }, k.revogada_em ? etq('revogada', 'perigo') : etq('ativa', 'ok'),
      editar && !k.revogada_em ? btn('Limites', () => fazer('chave_api_limites', { id: k.id }, { titulo: 'Limites da chave ' + k.prefixo + '…', ok: 'Limites mudados.',
        campos: [{ k: 'limite_minuto', rot: 'Por minuto (1 a 600)', inputmode: 'numeric', valor: String(k.limite_minuto), obrig: true }, { k: 'limite_dia', rot: 'Por dia (1 a 100.000)', inputmode: 'numeric', valor: String(k.limite_dia), obrig: true }] })) : null,
      editar && !k.revogada_em ? btn('Revogar', () => fazer('chave_api_revogar', { id: k.id }, { titulo: 'Revogar a chave ' + k.prefixo + '…', nome: k.nome_clinica || k.cliente_id, botao: 'Revogar a chave', ok: 'Chave revogada.',
        texto: 'O sistema da clínica que usa esta chave para de funcionar na hora. Não dá para desfazer.' }), 'perigo-sec') : null))))) : vazio('Nenhuma chave.', 'api');
  const criar = () => fazer('chave_api_criar', {}, { titulo: 'Criar chave da API', texto: 'Só clínica Enterprise; no máximo 2 chaves ativas. A chave aparece uma vez só.',
    campos: [{ k: 'cliente_id', rot: 'Código da clínica', ph: 'CLI-…', obrig: true }, { k: 'nome', rot: 'Nome da chave', ph: 'ex.: Painel Enterprise', obrig: true }],
    depois: async x => { await rotear(); mostrarSegredo('Chave da API', x.chave, x.mensagem); } });
  trocar(c, cabecalho('API (Enterprise)', `chamadas com chave desconhecida em 7 dias: ${fmtNum(d.chaves_desconhecidas_7d)}`, editar ? btn('Criar chave', criar, 'pri') : null),
    cartao(null, null, lista), editar ? null : el('div', { class: 'mt' }, nota('Criar, mudar limites e revogar estão desligados (editar_chaves_api).', true)));
};

// ---------- Ajustes da Central: liga/desliga num toque (DEC-066), com "Desfazer"
const NOME_CHAVE = { tela_inicio: 'Hoje', tela_clientes: 'Clientes', tela_dinheiro: 'Financeiro', tela_uso: 'Uso e limites', tela_sistema: 'Saúde do sistema', tela_avisos: 'Avisos', tela_funil: 'Crescimento (30 dias)',
  tela_sessoes: 'Segurança (aparelhos)', tela_funil_completo: 'Crescimento (90 dias)', tela_sistema_github: 'GitHub em Saúde do sistema', tela_registro: 'Registro', tela_chaves_api: 'API (Enterprise)',
  tela_agregados_pacientes: 'Agregados de pacientes', tela_cliente_completa: 'Ficha completa', tela_cliente_sensivel: 'Dados protegidos', tela_cliente_asaas: 'Cobranças do Asaas na ficha',
  editar_limites: 'Limites e franquia', editar_onboarding: 'Reenviar onboarding', editar_chaves_api: 'Chaves da API', editar_avisos_eventos: 'Avisos de eventos', editar_empresa: 'Dados da empresa',
  editar_assistente: 'Assistente', editar_configuracoes: 'Configurações', editar_recursos: 'Botões dos recursos', liberar_recursos: 'Liberar recursos', editar_plano: 'Plano', editar_preco: 'Preço especial',
  editar_cobranca: 'Cobrança', editar_teste: 'Estender o teste', editar_situacao: 'Situação (suspender, pausar, cancelar)', editar_links: 'Links da clínica', cobranca_teste_cliente: 'Clínica de teste da cobrança', asaas_ambiente: 'Ambiente do Asaas',
  tela_prospeccao: 'Prospecção (telas)', editar_prospeccao: 'Prospecção: campanhas, leads e regras', editar_numeros_prospeccao: 'Prospecção: números de WhatsApp', prosp_busca: 'Busca no Google Maps',
  prosp_ia: 'IA de resposta', prosp_disparo: 'Disparo de prospecção', prosp_politica_v10: 'Política v10 publicada', prosp_balanceamento: 'Teste de balanceamento' };
const GRUPOS_CHAVE = [
  ['Telas', k => /^tela_/.test(k.chave) && k.chave !== 'tela_cliente_sensivel'],
  ['Dados protegidos', k => k.chave === 'tela_cliente_sensivel'],
  ['Edições de baixo risco', k => ['editar_assistente', 'editar_configuracoes', 'editar_recursos', 'editar_limites', 'editar_onboarding', 'editar_links', 'liberar_recursos'].includes(k.chave)],
  ['Dinheiro, situação e empresa', k => ['editar_plano', 'editar_preco', 'editar_cobranca', 'editar_teste', 'editar_situacao', 'editar_empresa'].includes(k.chave)],
  ['Enterprise', k => ['editar_chaves_api', 'editar_avisos_eventos'].includes(k.chave)],
  ['Prospecção', k => ['tela_prospeccao', 'editar_prospeccao', 'editar_numeros_prospeccao', 'prosp_busca', 'prosp_ia', 'prosp_disparo'].includes(k.chave)]];
// As chaves do motor da prospecção pedem nível para LIGAR (busca e IA: 2; disparo: 3, com o nome "Disparo de prospecção");
// desligar continua num toque (DEC-078).
async function mudarChave(chave, valor, desfazendo) {
  let d = { chave, valor };
  if (nivelDe('ligar_chave', d) > 1) {
    d = await pedirAcao('ligar_chave', d, { titulo: 'Ligar: ' + (NOME_CHAVE[chave] || chave), nome: 'Disparo de prospecção', rotuloNome: 'o nome da chave', rotuloNivel: 'manda ou gasta de verdade',
      linhas: [[NOME_CHAVE[chave] || chave, 'desligada', 'ligada']], botao: 'Ligar',
      texto: chave === 'prosp_disparo' ? 'Mensagens começam a sair para os leads dos conjuntos ativos, dentro das travas. Só funciona com a Política v10 publicada e o teste de balanceamento.'
        : chave === 'prosp_busca' ? 'As buscas dos conjuntos ativos começam a gastar créditos do SerpAPI.' : 'A IA passa a responder os leads das campanhas com a IA ligada.' });
    if (!d) { await rotear(); return; }
  }
  const r = await chamar('ligar_chave', d);
  if (!r.ok) { rapida(r.mensagem || 'Não consegui.'); await rotear(); return; }
  est.chaves[chave] = r.depois; montarNav();
  const nome = NOME_CHAVE[chave] || chave;
  rapida(nome + (r.depois === 'SIM' ? ' ligada.' : ' desligada.') + ' Aviso no Telegram.', desfazendo ? null : () => mudarChave(chave, r.antes, true).then(() => rotear()));
}
TELAS.ajustes = async c => {
  topo('Ajustes da Central', [['Administração'], ['Ajustes da Central']]);
  const r = await carregarConfig(); if (falhou(c, r, 'Ajustes da Central')) return;
  const todas = est.listaChaves;
  const usadas = new Set();
  const linhaChave = k => {
    usadas.add(k.chave);
    const nome = NOME_CHAVE[k.chave] || k.chave;
    // O disparo fica travado (sem interruptor) até as duas chaves que só um PR liga (DEC-072).
    if (k.chave === 'prosp_disparo' && k.valor !== 'SIM' && !(ligada('prosp_politica_v10') && ligada('prosp_balanceamento')))
      return el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: nome }), el('div', { class: 't2', text: 'Travado até a Política v10 publicada e o teste de balanceamento (chaves só por PR) · ' + k.chave })),
        el('div', { class: 'direita' }, etq('travado', 'atencao'))));
    const controle = k.so_por_sql || !['SIM', 'NAO'].includes(k.valor)
      ? etq((k.valor === 'SIM' ? 'ligada' : k.valor === 'NAO' ? 'desligada' : (k.valor || 'vazio')) + ' · só por PR', '', true)
      : el('button', { class: 'toggle', type: 'button', role: 'switch', 'aria-checked': String(k.valor === 'SIM'), 'aria-label': nome, onclick: e => { const t = e.currentTarget; const novo = t.getAttribute('aria-checked') === 'true' ? 'NAO' : 'SIM'; t.setAttribute('aria-checked', String(novo === 'SIM')); mudarChave(k.chave, novo); } });
    return el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: nome }), el('div', { class: 't2', text: (k.descricao || '') + ' · ' + k.chave })), el('div', { class: 'direita' }, controle)));
  };
  const blocos = GRUPOS_CHAVE.flatMap(([titulo, fn]) => { const ks = todas.filter(k => !k.so_por_sql && fn(k)); if (!ks.length) return [];
    const b = cartao(titulo, titulo.startsWith('Dinheiro') ? etq('ligue só depois do teste no sandbox', 'atencao', true) : null, el('ul', { class: 'lista' }, ks.map(linhaChave)));
    // Prospecção: o sinal de vida do 52 e do 53 logo abaixo das chaves (DEC-087).
    return titulo === 'Prospecção' ? [b, cartaoMotor(est.prospMotor)] : [b]; });
  const resto = todas.filter(k => !usadas.has(k.chave));
  const aparenciaSel = el('div', { class: 'filtros', role: 'radiogroup', 'aria-label': 'Aparência' }, [['auto', 'Automática'], ['claro', 'Clara'], ['escuro', 'Escura']].map(([v, t]) =>
    el('button', { type: 'button', role: 'radio', 'aria-checked': String(aparencia === v), 'aria-pressed': String(aparencia === v), onclick: () => { guardarAparencia(v); rotear(); } }, t)));
  trocar(c, cabecalho('Ajustes da Central', 'um toque liga ou desliga; cada mudança vai para o registro e para o Telegram, com "Desfazer"'),
    el('div', { class: 'pilha' }, ...blocos.filter(Boolean),
      resto.length ? cartao('Só por PR (SQL)', null, el('ul', { class: 'lista' }, resto.map(linhaChave))) : null,
      cartao('Aparência', null, corpo(el('p', { class: 'mudo peq', text: 'Automática segue o aparelho. A escolha fica só neste navegador.' }), aparenciaSel)),
      cartao('Sessão', null, corpo(el('div', { class: 'acoes' }, btn('Sair', sair, 'perigo-sec', 'sair'), btn('Aparelhos e registro', () => ir('seguranca'), 'sec', 'seguranca'))))));
};

TELAS.mais = async c => {
  topo('Mais', [['Mais']]);
  const item = s => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => ir(s.id) }, el('span', { class: 'icone-caixa' }, icone(s.ic)),
    el('div', { class: 'cresce' }, el('div', { class: 't1', text: s.nome }), el('div', { class: 't2', text: s.desc || '' })), icone('seta')));
  const grupo = g => SECOES.filter(s => s.grupo === g && visivel(s));
  trocar(c, cabecalho('Mais'),
    el('p', { class: 'menu-grupo', text: 'Análise' }), cartao(null, null, el('ul', { class: 'lista' }, grupo('Análise').map(item))),
    el('p', { class: 'menu-grupo', text: 'Marketing' }), cartao(null, null, el('ul', { class: 'lista' }, grupo('Marketing').map(item))),
    el('p', { class: 'menu-grupo', text: 'Administração' }), cartao(null, null, el('ul', { class: 'lista' }, grupo('Administração').map(item))),
    el('p', { class: 'menu-grupo', text: 'Conta' }), cartao(null, null, el('ul', { class: 'lista' },
      el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => ir('ajustes') }, el('span', { class: 'icone-caixa' }, icone('lua')), el('div', { class: 'cresce' }, el('div', { class: 't1', text: 'Aparência' }), el('div', { class: 't2', text: { auto: 'Automática (segue o aparelho)', claro: 'Clara', escuro: 'Escura' }[aparencia] })), icone('seta'))),
      el('li', {}, el('button', { class: 'linha', type: 'button', onclick: sair }, el('span', { class: 'icone-caixa' }, icone('sair')), el('div', { class: 'cresce' }, el('div', { class: 't1', text: 'Sair' }), el('div', { class: 't2', text: 'Encerra a sessão neste aparelho' })))))));
};
