// Central RXSync: servidor SIMULADO para os testes (scripts/central_telas.mjs e scripts/central_acoes.mjs).
// Nada sai para a internet: o site é servido em 127.0.0.1 e o n8n é respondido aqui, com dados inventados.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import zlib from 'node:zlib'; import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/central';
// NAVEGADOR=webkit roda no motor do Safari (o do iPhone e do iPad); sem ele, no Chrome (rxsync-sistema DEC-156).
export async function abrirNavegador() {
  let pw;
  try { pw = await import('playwright'); } catch { pw = await import('/opt/node-tools/node_modules/playwright/index.mjs'); }
  if (process.env.NAVEGADOR === 'webkit') return pw.webkit.launch();
  return pw.chromium.launch().catch(() => pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
}
// Servidor local só com os arquivos do site (127.0.0.1).
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.PNG': 'image/png', '.webmanifest': 'application/manifest+json' };
export async function servirSite() {
  const srv = http.createServer((q, s) => { let f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(RAIZ)) { s.writeHead(403); return s.end(); } if (f.endsWith('/')) f += 'index.html';
    if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return { base: 'http://127.0.0.1:' + srv.address().port, fechar: () => srv.close() };
}

const dia = n => { const d = new Date(Date.now() - n * 86400000); return d.toISOString().slice(0, 10); };
const dias = (n, f) => Array.from({ length: n }, (_, i) => f(dia(n - 1 - i), i));
export const CHAVES = ['tela_inicio', 'tela_clientes', 'tela_dinheiro', 'tela_uso', 'tela_sistema', 'tela_avisos', 'tela_funil', 'tela_sessoes', 'tela_funil_completo', 'tela_sistema_github',
  'tela_registro', 'tela_chaves_api', 'tela_agregados_pacientes', 'editar_limites', 'editar_onboarding', 'editar_chaves_api', 'editar_avisos_eventos', 'tela_cliente_completa', 'tela_cliente_sensivel',
  'tela_cliente_asaas', 'editar_empresa', 'editar_assistente', 'editar_configuracoes', 'editar_recursos', 'liberar_recursos', 'editar_plano', 'editar_preco', 'editar_cobranca', 'editar_teste',
  'editar_situacao', 'editar_links', 'tela_prospeccao', 'editar_prospeccao', 'editar_numeros_prospeccao', 'prosp_busca', 'prosp_ia',
  'tela_demonstracoes', 'editar_demonstracoes', 'tela_assistente', 'tela_metricas'];
export const cli = (id, nome, plano, status, extra) => ({ cliente_id: id, nome, plano, status, ativo: status === 'Ativo', modalidade: 'contratado', mensagens_mes: 1800, franquia: 5000, whatsapp: 'open', interna: false, ...extra });
export const ficha = () => ({ cliente_id: 'CLI-001', nome: 'Clínica Sorriso Odontologia Integrada', razao_social: 'Sorriso Ltda', representante: 'Ana', email: 'ana@exemplo.com', telefone: '48999990001',
  plano: 'Essencial', status: 'Ativo', modalidade: 'teste', ativo: true, interna: false, valor_mensal: 299, valor_setup: 999, ciclo: 'mensal', forma_pagamento: 'boleto', aceite: '2026-10-01',
  versao_termos: '2026-10-v3', go_live: '2026-10-05', fim_teste: '2026-10-20', onboarding: 'concluido', ultimo_pagamento: null, origem: 'site', sistema_gestao: 'Clinicorp', cidade: 'Florianópolis/SC',
  limites: { franquia_mensagens: '', limitar_franquia: '', dono_limite_dia: '', relac_limite_dia: '' }, funcoes: { fila: 'SIM', documentos: '', lembretes: 'SIM', agendamento: 'SIM' }, franquia: 5000,
  mensagens_mes: 1200, uso_30d: dias(30, (d, i) => ({ dia: d, recebidas: 10 + i, enviadas: 12 + i })), medicos_ativos: 2, whatsapp: { estado: 'open', desde: '2026-10-05T10:00:00Z' },
  integracao: { plataforma: 'reservio', ativo: true, ultimo_erro: '' }, chaves_api_ativas: 0, avisos_eventos: { ativo: true, servidor: 'api.exemplo.com' },
  ultimos_avisos: [{ recebido_em: '2026-10-15T10:00:00Z', categoria: 'clientes', tipo: 'no_ar' }], pode_reenviar_onboarding: true, suspensao_motivo: '',
  pausa_painel: null, pedido_ajuda_agenda: '2026-10-27T13:30:00Z', conversas_envios: [{ pedido_em: '2026-10-22 10:00', situacao: 'enviado', enviado_em: '2026-10-22 10:12', mensagens: 1840, erro: null },
    { pedido_em: '2026-10-20 15:30', situacao: 'falhou', enviado_em: null, mensagens: null, erro: 'O e-mail do cadastro recusou o anexo.' }],
  completa: { campos: { nome_exibicao: 'Clínica Sorriso', servicos: 'Limpeza e clareamento', fuso_horario: 'America/Sao_Paulo', func_fila: 'SIM', pesquisa_ativa: '', franquia_mensagens: '', limitar_franquia: '',
      dono_limite_dia: '', relac_limite_dia: '', limite_info_extra: '', envio_limite_dia: '' },
    recursos: { documentos: false, fila: true, pesquisa: false, reconhecer: false, tipo_visita: false, empilhamento: false, preconsulta: false, medicos: false, relacionamento: false, assistente_dono: false, pacientes: false, info_extra: 500, liberados: ['fila'] },
    liberacoes: [{ id: 7, recurso: 'fila', motivo: 'piloto', ate: '2026-12-31', liberado_em: '2026-10-14T12:00:00Z', em_vigor: true }],
    liberaveis: ['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'],
    linha_do_tempo: [{ quando: '2026-10-14 09:00', o_que: 'Central: recurso_liberado' }, { quando: '2026-10-05', o_que: 'No ar (go-live)' }],
    combinados: [{ id: 1, tipo: 'extensao_teste', motivo: 'feriado', combinado: 'por WhatsApp', criado_em: '2026-10-10T12:00:00Z' }],
    pedidos_asaas: [{ id: 3, tipo: 'foto', status: 'feito', criado_em: '2026-10-15T11:00:00Z', feito_em: '2026-10-15T11:15:00Z', resposta: 'ok' }],
    situacao: { teste_dias_estendidos: 5, cobranca_teste: false },
    asaas: { tirada_em: '2026-10-15T11:10:00Z', cobrancas: [{ id: 'pay_abc123', status: 'PENDING', valor: 299, vencimento: '2026-11-05', forma: 'BOLETO', descricao: 'RXSync — Plano Essencial' }] } } });
// IA da Central (sql/061, DEC-145): o que o 04 devolve depois do 06 (texto já mascarado e as propostas, uma de cada nível).
const daquiMin = n => new Date(Date.now() + n * 60000).toISOString();
export const IA_RESPOSTA = () => ({ ok: true, tokens_entrada: 3200, tokens_saida: 140,
  texto: 'Pela tela Clientes, 12 clínicas estão no ar.\n- A Clínica Sorriso está em teste até 20/10.\n- O e-mail dela é a•••@exemplo.com e o telefone [número oculto].\nDeixei três propostas para você confirmar.',
  propostas: [
    { id: 11, acao: 'editar_limites', resumo: 'Subir a franquia da Clínica Sorriso para 6.000', nivel: 1, nome_nivel3: '', vence_em: daquiMin(30),
      antes: { clinica: 'Clínica Sorriso Odontologia Integrada', situacao: 'Ativo', plano: 'Essencial', ativo: true, campos: { franquia_mensagens: '' } }, depois: { campos: { franquia_mensagens: '6000' }, cliente_id: 'CLI-001' } },
    { id: 12, acao: 'situacao_pausar', resumo: 'Pausar a assistente da Clínica Vida a pedido', nivel: 2, nome_nivel3: '', vence_em: daquiMin(30),
      antes: { clinica: 'Clínica Vida', situacao: 'Ativo', plano: 'Gestao', ativo: true }, depois: { cliente_id: 'CLI-002' } },
    { id: 13, acao: 'teste_estender', resumo: 'Estender o teste da Clínica Sorriso em 7 dias', nivel: 3, nome_nivel3: 'Clínica Sorriso Odontologia Integrada', vence_em: daquiMin(30),
      antes: { clinica: 'Clínica Sorriso Odontologia Integrada', situacao: 'Ativo', plano: 'Essencial', ativo: true }, depois: { cliente_id: 'CLI-001', dias: 7, motivo: 'pedido da clínica' } }] });
export const DADOS = {
  metricas: { dados: { mrr: { total: 5388, mensal: 4190, anual_parcelado: 599, anual_a_vista_mes: 599, regra: 'Clínicas contratadas e no ar; o anual à vista entra dividido por 12.' },
    pagantes_no_ar: 12, ticket_medio: 449, cancelamentos_mes: { clinicas: 1, receita_perdida: 299, regra: 'Clínicas contratadas com o cancelamento neste mês (o valor é o que ainda está no cadastro).' },
    conversao_teste_90d: { testes: 9, viraram_contrato: 4, percentual: 44.4, regra: 'Testes grátis começados nos últimos 90 dias e quantos viraram contrato.' }, dias_ate_go_live_90d: 6.5,
    custo_ia_mes: { nome: 'Custo de IA (Central e prospecção)', central: { tokens_entrada: 182000, tokens_saida: 9400, reais: 1.42 }, prospeccao: { tokens_entrada: 940000, tokens_saida: 61000, reais: 8.13 },
      total_reais: 9.55, preco_preenchido: true, aviso: 'O atendimento das clínicas não entra: o banco só conta as mensagens, não os tokens.', mensagens_atendimento_mes: 24830 },
    uso_ia_central_mes: { perguntas: 37, propostas: 9, confirmadas: 6 } } },
  inicio: { dados: { pendencias: { whatsapp_fora: [{ cliente_id: 'CLI-002', nome: 'Clínica Vida', desde: '2026-10-15T08:00:00Z' }], suspensos: [{ cliente_id: 'CLI-003', nome: 'Odonto Mais' }], aviso_atraso: [],
      cancelamentos_agendados: [{ cliente_id: 'CLI-004', nome: 'Derma Sul', em: '2026-11-01' }], onboarding_vencido: [], franquia_80: [{ cliente_id: 'CLI-001', nome: 'Clínica Sorriso', usadas: 4100, franquia: 5000 }],
      falhas_24h: 2, integracoes_com_erro: 1, avisos_eventos_desistidos_7d: 0, pedidos_demonstracao_7d: 3 },
    numeros: { asaas_ambiente: 'sandbox', pagantes_no_ar: 12, receita_mensal: 5388, em_teste: 4, em_implantacao: 2, mensagens_hoje: 830, falhas_hoje: 1, avisos_hoje: 27 },
    funil_30d: { totais: { pedidos_demonstracao: 9, mini_testes: 41, mini_testes_com_consulta: 12, cadastros_teste: 7, cadastros_contratacao: 3, go_lives: 4 }, por_dia: dias(30, (d, i) => ({ dia: d, pedidos: i % 3, mini_testes: i % 5, cadastros: i % 2 })) },
    ultimos_avisos: [{ recebido_em: '2026-10-15T10:00:00Z', categoria: 'vendas', tipo: 'pedido_demonstracao', cliente_id: '' }, { recebido_em: '2026-10-15T09:00:00Z', categoria: 'financeiro', tipo: 'mensalidade_recebida', cliente_id: 'CLI-001', nome: 'Clínica Sorriso' }] } },
  clientes: { dados: { clientes: [cli('CLI-001', 'Clínica Sorriso Odontologia Integrada', 'Essencial', 'Ativo', { modalidade: 'teste' }), cli('CLI-002', 'Clínica Vida', 'Gestao', 'Ativo', { whatsapp: 'close' }),
    cli('CLI-003', 'Odonto Mais', 'Gestao', 'Suspenso'), cli('CLI-004', 'Derma Sul', 'Enterprise', 'Aguardando dados'), cli('RX-TESTE-INTERNA', 'Clínica interna', 'Gestao', 'Ativo', { interna: true })] } },
  dinheiro: { dados: { asaas_ambiente: 'sandbox', pagantes_no_ar: 12, receita_mensal: 5388, em_teste: 4, em_implantacao: 2, receita_12_meses: dias(12, (d, i) => ({ dia: d, receita_mensal: 300 * i })),
    pagantes: [{ cliente_id: 'CLI-002', nome: 'Clínica Vida', valor_no_mes: 599, plano: 'Gestao' }], testes: [{ cliente_id: 'CLI-001', nome: 'Clínica Sorriso', fim_teste: '2026-10-20' }],
    aviso_atraso: [], suspensos: [{ cliente_id: 'CLI-003', nome: 'Odonto Mais', desde: '2026-10-01' }], cancelamentos: [{ cliente_id: 'CLI-004', nome: 'Derma Sul', em: '2026-11-01' }] } },
  uso: { dados: { dia_do_mes: 15, dias_no_mes: 31, total_30d: dias(30, (d, i) => ({ dia: d, mensagens: 300 + i * 10 })), clinicas: [{ cliente_id: 'CLI-001', nome: 'Clínica Sorriso', mensagens_mes: 4100, franquia: 5000, franquia_padrao: true, plano: 'Essencial' },
    { cliente_id: 'CLI-002', nome: 'Clínica Vida', mensagens_mes: 5200, franquia: 5000, limitar_franquia: true, plano: 'Gestao' }] } },
  sistema: { dados: { ultimo_aviso_recebido: '2026-10-15T10:00:00Z', ultima_foto_indicadores: '2026-10-14T23:50:00Z', whatsapp: [{ cliente_id: 'CLI-002', nome: 'Clínica Vida', estado: 'close', desde: '2026-10-15T08:00:00Z', verificado_em: '2026-10-15T10:00:00Z' },
      { cliente_id: 'CLI-001', nome: 'Clínica Sorriso', estado: 'open', desde: '2026-10-05T10:00:00Z', verificado_em: '2026-10-15T10:00:00Z' }],
    falhas_por_workflow_7d: [{ workflow: '10 - Atendimento - IA de atendimento', falhas: 3, ultima: '2026-10-15T07:00:00Z' }], ultimas_falhas: [{ workflow: '10 - Atendimento - IA de atendimento', quando: '2026-10-15T07:00:00Z', no: 'Agente IA', execucao_id: '12345' }],
    integracoes: [{ cliente_id: 'CLI-001', nome: 'Clínica Sorriso', plataforma: 'reservio', ativo: true, ultima_sync: '2026-10-15T10:00:00Z', ultimo_erro: '' }], avisos_eventos: [{ cliente_id: 'CLI-004', pendentes: 0, enviados_7d: 40, desistidos_7d: 0 }],
    sql_aplicados: [{ arquivo: 'sql/029_central_clientes.sql', aplicado_em: '2026-10-15T12:00:00Z' }],
    github: { recebido_em: '2026-10-15T12:00:00Z', dados: { actions: [{ nome: 'Publicar no n8n', quando: '2026-10-15T12:00:00Z', evento: 'push', resultado: 'success' }], issues: { abertas: 14, por_prioridade: { P1: 1, P2: 5 }, p1: [{ numero: 66, titulo: 'Sair do sandbox do Asaas' }] }, prs_abertos: 1 } } } },
  avisos: { dados: { por_categoria_7d: { vendas: 9, financeiro: 14 }, avisos: [{ recebido_em: '2026-10-15T10:00:00Z', categoria: 'vendas', tipo: 'pedido_demonstracao' }, { recebido_em: '2026-10-15T09:00:00Z', categoria: 'financeiro', tipo: 'mensalidade_recebida', cliente_id: 'CLI-001', nome: 'Clínica Sorriso' }] } },
  funil: { dados: { totais: { pedidos_demonstracao: 9, mini_testes: 41, mini_testes_com_consulta: 12, cadastros_teste: 7, cadastros_contratacao: 3, go_lives: 4 }, por_dia: dias(30, (d, i) => ({ dia: d, pedidos: i % 3, mini_testes: i % 5, cadastros: i % 2 })),
    pedidos: [{ criado_em: '2026-10-15T10:00:00Z', nome: 'Maria Teste', clinica: 'Clínica Exemplo', email: 'maria@exemplo.com', telefone: '48999990000', sistema_atual: 'planilha', plano_interesse: 'gestao' }],
    // sql/059 (DEC-134): os mini testes saem do Telegram e ficam aqui
    mini_testes: [{ id: 'mt-1', criado_em: '2026-10-15T11:00:00Z', clinica: 'Clínica Exemplo', especialidade: 'Odontologia', profissionais: ['Dra. Ana'], telefone: '48999990002', origem: 'https://rxsync.com.br/',
      mensagens: 3, agendamento: { dia: '2026-10-20', hora: '10:00' }, conversa: [{ r: 'u', t: 'Quero marcar uma limpeza.' }, { r: 'a', t: 'Claro! Tenho terça às 10h. Pode ser?' }] },
      { id: 'mt-2', criado_em: '2026-10-14T09:00:00Z', clinica: 'Consultório Teste', especialidade: 'Dermatologia', profissionais: [], telefone: '48999990003', origem: '', mensagens: 0, agendamento: null, conversa: [] }] } },
  // sql/060 (DEC-136): ficha › Histórico do painel, com o IP e o e-mail
  cliente_painel_historico: { dados: { acessos: [{ quando: '2026-10-15T12:00:00Z', evento: 'assistente_pausada', o_que: 'Pausou a assistente', quem: 'equipe · s•••@exemplo.com', quem_email: 'sec@exemplo.com', aparelho: 'iPad · Safari', ip: '10.0.0.5' },
    { quando: '2026-10-15T09:00:00Z', evento: 'entrada', o_que: 'Entrou', quem: 'dono · a•••@exemplo.com', quem_email: 'ana@exemplo.com', aparelho: 'iPhone · Safari', ip: '10.0.0.4' }] } },
  funil_completo: { dados: { funil_90d: { totais: { pedidos_demonstracao: 20, mini_testes: 90, mini_testes_com_consulta: 30 }, por_dia: dias(90, (d, i) => ({ dia: d, pedidos: i % 3, mini_testes: i % 4, cadastros: i % 2 })) },
    testes_que_viraram_contrato: 5, dias_ate_go_live_media: 6.5, mini_teste_por_origem_90d: [{ origem: 'instagram', testes: 40, com_consulta: 12 }], mini_teste_por_especialidade_90d: { odontologia: 50, dermatologia: 20 },
    cadastros_por_origem: [{ origem: 'site', cadastros: 8 }], cadastros_parados: [{ cliente_id: 'CLI-004', nome: 'Derma Sul', status: 'Aguardando dados', dias: 20 }], onboarding_vencido: [], testes_encerrados_sem_contrato: 3 } },
  sessoes: { dados: { senha_trocada_em: '2026-10-15T09:00:00Z', sessoes: [{ id: 1, navegador: 'iPad · Safari', esta: true, criada_em: '2026-10-15T09:00:00Z', ip: '10.0.0.1', ultimo_uso_em: '2026-10-15T12:00:00Z' },
    { id: 2, navegador: 'Mac · Safari', esta: false, criada_em: '2026-10-14T09:00:00Z', ip: '10.0.0.2', ultimo_uso_em: '2026-10-14T12:00:00Z' }] } },
  registro: { dados: { registro: [{ id: 50, evento: 'edicao_limites', quando: '2026-10-15T12:00:00Z', navegador: 'iPad · Safari', ip: '10.0.0.1', detalhe: { cliente_id: 'CLI-001', antes: { franquia_mensagens: '' }, depois: { franquia_mensagens: '8000' } } },
    { id: 49, evento: 'entrada', quando: '2026-10-15T09:00:00Z', navegador: 'iPad · Safari', ip: '10.0.0.1', detalhe: {} }] } },
  chaves_api: { dados: { chaves_desconhecidas_7d: 2, chaves: [{ id: 3, prefixo: 'rx_ab12', nome: 'Painel Enterprise', nome_clinica: 'Derma Sul', cliente_id: 'CLI-004', criada_em: '2026-10-01', ultimo_uso_em: '2026-10-15T11:00:00Z', limite_minuto: 60, limite_dia: 5000, uso_7d: { consultar: 120 } }] } },
  agregados: { dados: { clinicas: [{ nome: 'Clínica Sorriso', pacientes: 320, consultas_30d_ia: 80, consultas_30d_equipe: 40, lista_espera_ativa: 3, documentos_30d: 0, preconsulta_30d: 0, pesquisa_nota_media_90d: 9.2, relacionamento_30d: 12 }] } }
};

// Níveis das ações (cópia do sql/030, rx_central_niveis): 1 = sem confirmação, 2 = CONFIRMAR, 3 = CONFIRMAR + nome da clínica.
export const NIVEIS = { cliente_editar_assistente: 1, cliente_editar_configuracoes: 1, cliente_editar_recursos: 1, editar_limites: 1, franquia_aviso_registrar: 1, chave_api_limites: 1, asaas_foto_atualizar: 1,
  situacao_pausar: 2, situacao_retomar: 2, situacao_reativar: 2, cancelamento_desfazer: 2, link_painel_reenviar: 2, link_conectar_reenviar: 2, reenviar_onboarding: 2, recurso_liberar: 2, recurso_revogar: 2,
  cliente_editar_empresa: 2, chave_api_criar: 2, aviso_destino_definir: 2, aviso_destino_desligar: 2, desfazer: 2,
  plano_trocar: 3, situacao_suspender: 3, cancelamento_agendar: 3, preco_especial: 3, cobranca_proxima_data: 3, cobranca_vencimento: 3, implantacao_isentar: 3, pagamento_receber_dinheiro: 3,
  teste_estender: 3, link_painel_novo: 3, chave_api_revogar: 3, cobranca_teste_definir: 3,
  // prospecção (sql/031, rx_central_niveis): prosp_ligar e prosp_regra_ligar mudam com o valor (rx_central_nivel)
  prosp_campanha_salvar: 1, prosp_conjunto_salvar: 1, prosp_anuncio_salvar: 1, prosp_duplicar: 1, prosp_regra_salvar: 1, prosp_regra_ligar: 1, prosp_anotar: 1, prosp_custos_salvar: 1,
  prosp_relatorio_salvar: 1, prosp_numero_situacao: 1, prosp_lead_aprovar: 1, prosp_lead_marcar: 1, prosp_lead_assumir: 1, prosp_ligar: 2, prosp_apagar_rascunho: 2, prosp_numero_criar: 2,
  prosp_numero_qr: 2, prosp_numero_desconectar: 2, prosp_numero_webhook: 2, prosp_numero_teto: 2, prosp_buscar_agora: 2, prosp_leads_aprovar_todos: 2, prosp_lead_nao_contatar: 2,
  prosp_lead_devolver: 2, prosp_exportar: 2, prosp_encerrar: 3, prosp_numero_apagar: 3,
  // públicos (sql/036): salvar em uso, pôr de volta em uso e pôr um público num conjunto ativo sobem de nível (rx_central_nivel)
  prosp_publico_salvar: 1, prosp_publico_renomear: 1, prosp_publico_duplicar: 1, prosp_publico_contato_marcar: 1, prosp_publico_buscar: 2, prosp_publico_contatos_lote: 2,
  prosp_publico_arquivar: 2, prosp_creditos_teto_salvar: 2,
  // sugestões da IA para o prompt (sql/043, DEC-098)
  prosp_sugerir: 2,
  // demonstrações por link (sql/056, DEC-125)
  dem_criar: 1, dem_desativar: 1, dem_reativar: 1, dem_ver: 1, dem_editar: 2, dem_apagar: 3,
  // histórico das conversas ao e-mail do cadastro (sql/059, DEC-131)
  conversas_enviar: 2 };
export const CHAVES_LIGADAS = () => ({ ...Object.fromEntries(CHAVES.map(k => [k, 'SIM'])), asaas_ambiente: 'sandbox', cobranca_teste_cliente: '', prosp_disparo: 'NAO', prosp_politica_v10: 'NAO', prosp_balanceamento: 'NAO', demo_links: 'NAO', demo_politica_v17: 'NAO', painel_link_antigo: 'SIM', assistente_politica: 'SIM' });
const SO_POR_SQL = ['cobranca_teste_cliente', 'asaas_ambiente', 'prosp_politica_v10', 'prosp_balanceamento', 'demo_politica_v17', 'assistente_politica'];
export const SENSIVEL = { ok: true, dados: { cliente_id: 'CLI-001', nome: 'Clínica Sorriso Odontologia Integrada', empresa: { razao_social: 'Sorriso Ltda', cnpj: '11222333000181', representante_nome: 'Ana Souza', representante_cpf: '11122233344', email: 'ana@exemplo.com', telefone: '48999990001' },
  aceite: { data_aceite: '01/10/2026, 10:00:00', versao_termos: '2026-10-v3', ip_aceite: '10.0.0.9', aceite_dpa: 'SIM' }, copia_do_aceite: null } };
// Sinal de vida do 52 e do 53 (sql/035, DEC-087). ESTADO.segurado = true: disparo ligado e o 52 parado (para as fotos e
// os testes da tela "disparo parado").
export const ESTADO = { segurado: false };
export const motorDe = () => ESTADO.segurado
  ? { vivo: false, sinal_52: '2026-10-16T11:05:00Z', sinal_53: '2026-10-16T06:40:00Z', disparo_ligado: true, segurado: true,
      parados: [{ workflow: '52', nome: 'Respostas e IA', desde: '2026-10-16T11:05:00Z', limite_minutos: 30 }], agora: '2026-10-16T14:00:00Z' }
  : { vivo: false, sinal_52: '2026-10-16T13:50:00Z', sinal_53: null, disparo_ligado: false, segurado: false,
      parados: [{ workflow: '53', nome: 'Rotinas e medição', desde: null, limite_minutos: 2880 }], agora: '2026-10-16T14:00:00Z' };
// Responde o n8n simulado. Guarda cada chamada em "chamadas" ({acao, dados}) para os testes conferirem.
export function servidor(chaves, chamadas = [], respostas = {}) {
  return async route => {
    const b = JSON.parse(route.request().postData() || '{}');
    chamadas.push({ acao: b.acao, dados: b.dados || {} });
    const r = o => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (respostas[b.acao]) return r(typeof respostas[b.acao] === 'function' ? respostas[b.acao](b.dados || {}) : respostas[b.acao]);
    if (b.acao === 'estado') return r({ ok: true, tem_senha: true });
    if (b.acao === 'entrar') return r({ ok: true, desafio: 'd', mensagem: 'Mandei o código no Telegram.' });
    if (b.acao === 'entrar_codigo') return r({ ok: true, sessao: 'a'.repeat(64) });
    if (b.acao === 'config') return r({ ok: true, chaves: Object.entries({ ...chaves, ...(ESTADO.segurado ? { prosp_disparo: 'SIM', prosp_politica_v10: 'SIM', prosp_balanceamento: 'SIM' } : {}) }).map(([chave, valor]) => ({ chave, valor, descricao: 'Descrição da chave ' + chave, fase: 4, so_por_sql: SO_POR_SQL.includes(chave) })),
      sessao: {}, niveis: { acoes: NIVEIS, regras: {} }, prosp_motor: motorDe() });
    if (b.acao === 'ligar_chave') { const antes = chaves[b.dados.chave]; chaves[b.dados.chave] = b.dados.valor; return r({ ok: true, antes, depois: b.dados.valor }); }
    if (b.acao === 'cliente') return r({ ok: true, cliente: ficha() });
    if (b.acao === 'cliente_sensivel') return r(SENSIVEL);
    if (b.acao === 'assistente_perguntar') return r(IA_RESPOSTA());
    if (b.acao === 'proposta_confirmar') return r({ ok: true, mensagem: 'Feito (simulado).', pode_desfazer: true, registro_id: 99 });
    if (b.acao === 'proposta_descartar') return r({ ok: true, mensagem: 'Proposta descartada.' });
    if (PROSP[b.acao]) return r(PROSP[b.acao](b.dados || {}));
    if (DEM[b.acao]) return r(DEM[b.acao](b.dados || {}));
    if (DADOS[b.acao]) return r({ ok: true, ...DADOS[b.acao] });
    if (NIVEIS[b.acao]) return r({ ok: true, mensagem: 'Feito (simulado).', pode_desfazer: NIVEIS[b.acao] === 1, registro_id: 99, chave: b.acao === 'chave_api_criar' ? 'rx_teste_' + 'x'.repeat(20) : undefined, segredo: b.acao === 'aviso_destino_definir' ? 'segredo-de-teste' : undefined });
    return r({ ok: true });
  };
}
// Liga o n8n simulado, bloqueia qualquer outro endereço de fora e entra (e-mail, senha e código).
export async function entrar(page, base, chaves, chamadas, respostas) {
  await page.route(N8N, servidor(chaves, chamadas, respostas));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
  await page.goto(base + '/central/');
  await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
  await page.fill('input.codigo', '123456'); await page.click('button[type=submit]'); await page.waitForSelector('#conteudo h1');
}

// ---------------------------------------------------------------- prospecção (sql/031 e sql/032): dados inventados
// QR de mentira: uma imagem PNG de verdade (33 × 33 módulos, 8 px cada), feita aqui, para a foto da janela do código.
function crc32(b) { let c, t = crc32.t || (crc32.t = Array.from({ length: 256 }, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }));
  let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; }
export function qrDeMentira() {
  const M = 33, E = 8, L = M * E; let semente = 7; const sorte = () => { semente = (semente * 1103515245 + 12345) >>> 0; return (semente >>> 16) & 1; };
  const mod = Array.from({ length: M }, () => Array.from({ length: M }, () => sorte()));
  const quadro = (x0, y0) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) mod[y0 + y][x0 + x] = (x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) ? 1 : 0; };
  quadro(0, 0); quadro(M - 7, 0); quadro(0, M - 7);
  const linhas = []; for (let y = 0; y < L; y++) { const l = Buffer.alloc(1 + L); for (let x = 0; x < L; x++) l[1 + x] = mod[Math.floor(y / E)][Math.floor(x / E)] ? 0 : 255; linhas.push(l); }
  const pedaco = (tipo, dados) => { const t = Buffer.from(tipo), tam = Buffer.alloc(4), crc = Buffer.alloc(4); tam.writeUInt32BE(dados.length); crc.writeUInt32BE(crc32(Buffer.concat([t, dados]))); return Buffer.concat([tam, t, dados, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(L, 0); ihdr.writeUInt32BE(L, 4); ihdr[8] = 8; ihdr[9] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pedaco('IHDR', ihdr), pedaco('IDAT', zlib.deflateSync(Buffer.concat(linhas))), pedaco('IEND', Buffer.alloc(0))]);
  return 'data:image/png;base64,' + png.toString('base64');
}
const TRAVAS = { teto_numero_dia: 40, teto_numero_hora: 10, aquecimento: [10, 20, 30, 40], janela_inicio: 8, janela_fim: 18, pausa_min_s: 120, lote_max: 3, tentativas_max: 3, frequencia_max: 3,
  intervalo_lead_dias_uteis: 2, followups_max: 2, outra_campanha_dias_min: 60, paginas_max: 6, mensagem_max: 600, ia_mensagens_max: 15, ia_hora_inicio_min: 7, ia_hora_fim_max: 21, resposta_max: 600, pare_regra_max: 8 };
export const CFG = {
  campanha: { marca: 'RXSync', produto: 'Assistente virtual que atende os pacientes no WhatsApp, marca consultas e lembra o paciente na véspera.', objetivo: 'positiva', link_agenda: '', orcamento_msgs_dia: 40,
    creditos_mes: 120, inicio: '', fim: '', limite_total: 2000, atribuicao_dias: 30, ia: { ligada: true, tom: 'próximo, curto, sem pressão', objetivo_texto: 'levar ao teste grátis pelo link', objecoes: ['Preço: lembre do teste grátis de 7 dias.'],
      nunca_dizer: ['que é uma pessoa', 'preço diferente da tabela oficial'], passar_para_voce: 'quando pedir uma pessoa ou orçamento', tamanho_max: 350, regras_escrita: ['sem travessão', 'no máximo três linhas'], max_mensagens: 8,
      hora_inicio: 8, hora_fim: 20, palavras_saida: ['sair', 'pare', 'parar', 'remover', 'descadastrar', 'não quero'], avisar: { fechou: true, interessado: true, pediu_voce: true, recusou: false, saiu: true } } },
  conjunto: { publicos: ['PB-0001'], exclusoes: { outra_campanha_dias: 90 },
    entrega: { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], janelas: [['09:00', '11:30'], ['14:00', '17:30']], fuso: 'America/Sao_Paulo', lote: 1, pausa_min_s: 180, pausa_max_s: 540, teto_dia: 20, ordem: 'pontuacao', tentativas: 2, intervalo_tentativa_dias: 1 },
    frequencia: { max_mensagens: 3, intervalo_dias_uteis: 2 }, aprendizado_min: 100 },
  publico: { busca: { termos: ['dentista', 'ortodontista'], lugares: ['Curitiba'], coordenadas: '', zoom: 14, idioma: 'pt-br', pais: 'br', paginas: 3, nota_min: 4, nota_max: 5, sem_nota: 'descartar', avaliacoes_min: 10,
      categorias_aceitas: [], categorias_excluidas: [], palavras_excluem: ['hospital', 'rede', 'franquia', 'UBS'], tem_site: 'tanto_faz', so_celular: true, aceitar_wame: true, so_aberto: true,
      repetir: { tipo: 'semanal', dia_semana: 'seg', hora: 8 }, creditos_busca: 10, nao_repetir_dias: 7 },
    qualificacao: { pesos: { nota: 40, avaliacoes: 25, categoria: 20, site: 10, origem: 5 }, pontos_min: 50, revisar_numero: 'whatsapp' },
    exclusoes: { redes_palavras: [], rede_min_enderecos: 3, concorrentes: ['Concorrente X'] }, fuso: 'America/Sao_Paulo', creditos_mes: 120, novos_entram: 'selecionados' },
  anuncio: { abordagem: 'Oi! Aqui é a assistente virtual da {marca}. Vi a {nome} no Google Maps e queria saber: vocês respondem os pacientes no WhatsApp à noite?', tamanho_max: 400,
    followups: [{ dias_uteis: 2, texto: 'Oi de novo! Posso mandar o link do teste grátis para a {nome}?' }], texto_saida: 'Se não quiser receber mensagens, responda SAIR.',
    texto_confirmacao: 'Pronto, não vou mais escrever para este número. Obrigada!', palavras_proibidas: [], prompt_proprio: '' } };
const N1 = { id: 1, instancia: 'prospec-01', nome: 'Prospecção 1', situacao: 'conectado', ligado: true, teto_hoje: 20, teto_dia: null, aquecimento_inicio: dia(10), verificado_em: '2026-10-15T12:00:00Z', token_aceito: true,
  token_testado_em: '2026-10-14T12:00:00Z', desde: '2026-10-05T10:00:00Z', conjuntos: [{ id: 'CJ-0001', nome: 'Dentistas Curitiba', situacao: 'ativo' }] };
const N2 = { id: 2, instancia: 'prospec-02', nome: 'Prospecção 2', situacao: 'aguardando_qr', ligado: false, teto_hoje: 0, teto_dia: null, aquecimento_inicio: null, verificado_em: null, token_aceito: null, conjuntos: [] };
const AN = (id, nome, situacao, extra) => ({ id, nome, situacao, versao: 1, pausa_motivo: '', ...extra });
const ARVORE = () => [{ id: 'CMP-0001', nome: 'Odonto Sul', situacao: 'ativa', versao: 3, atualizada_em: '2026-10-15T09:00:00Z', conjuntos: [
    { id: 'CJ-0001', nome: 'Dentistas Curitiba', situacao: 'ativo', versao: 2, pausa_motivo: '', numero: { id: 1, instancia: 'prospec-01', situacao: 'conectado' }, publicos: ['PB-0001'],
      anuncios: [AN('AN-0001', 'A · Pergunta do WhatsApp', 'ativo'), AN('AN-0002', 'B · Agenda cheia', 'ativo'), AN('AN-0003', 'C · Caso parecido', 'cortado', { pausa_motivo: 'regra 1: pare 7,5% > 5 depois de 40 envios' })] },
    { id: 'CJ-0002', nome: 'Ortodontistas Joinville', situacao: 'pausado', versao: 1, pausa_motivo: 'número prospec-02 desconectado', numero: { id: 2, instancia: 'prospec-02', situacao: 'aguardando_qr' }, publicos: [], anuncios: [AN('AN-0004', 'A · Primeira', 'rascunho')] }] },
  { id: 'CMP-0002', nome: 'Dermatologia (rascunho)', situacao: 'rascunho', versao: 1, atualizada_em: '2026-10-14T09:00:00Z', conjuntos: [] }];
const linhaRel = (chave, valor, n) => ({ chave, valor, numeros: { enviados: n, entregues: Math.round(n * .92), lidos: Math.round(n * .7), responderam: Math.round(n * .18), positivas: Math.round(n * .07), pediram_link: 3, abriram_link: 2,
  cadastros: 1, pagamentos: 0, sairam: 2, recusaram: 4, mensagens_ia: 40, tokens_entrada: 52000, tokens_saida: 6100 },
  taxas: { entrega: 92.0, leitura: 70.0, resposta: 18.0, resposta_margem: 5.4, positiva: 7.0, positiva_margem: 3.6, cadastro: 0.5, saida: 1.0, recusa: 2.0 },
  custos: { serpapi: 4.2, fixo: 30, ia: 1.1, total: 35.3, por_resposta: 1.02, por_positiva: 2.52, por_cadastro: 35.3 } });
const LEADS = [
  { id: 'PX-AAAAA', nome: 'Clínica Sorriso Batel', telefone_fim: '•••• 0001', cidade: 'Curitiba', bairro: 'Batel', nicho: 'dentista', nota: 4.8, avaliacoes: 120, categoria: 'Dentista', pontos: 82, situacao: 'positivo', campanha_id: 'CMP-0001', conjunto_id: 'CJ-0001', publico_id: 'PB-0001', anuncio_id: 'AN-0002', anuncio_versao: 1, numero: 'prospec-01', origem_telefone: 'maps', mensagens_enviadas: 1, ia_mensagens: 3, criado_em: '2026-10-10T12:00:00Z', ultimo_contato_em: '2026-10-15T11:00:00Z', apagar_em: '2027-04-13', cliente_id: '', numero_revisar: false,
    funil: { enviada: '2026-10-13T12:40:00Z', entregue: '2026-10-13T12:41:00Z', lida: '2026-10-13T13:00:00Z', respondeu: '2026-10-13T13:05:00Z', positiva: '2026-10-13T13:20:00Z' } },
  { id: 'PX-CCCCC', nome: 'Odonto Centro', telefone_fim: '•••• 0002', cidade: 'Curitiba', bairro: 'Centro', nicho: 'dentista', nota: 4.2, avaliacoes: 30, categoria: 'Dentista', pontos: 61, situacao: 'para_aprovar', campanha_id: 'CMP-0001', conjunto_id: 'CJ-0001', anuncio_id: null, numero: 'prospec-01', origem_telefone: 'wame', mensagens_enviadas: 0, ia_mensagens: 0, criado_em: '2026-10-15T10:00:00Z', apagar_em: '2027-01-13', cliente_id: '', numero_revisar: true, funil: {} },
  { id: 'PX-DDDDD', nome: 'Dente Feliz', telefone_fim: '•••• 0003', cidade: 'Curitiba', bairro: 'Água Verde', nicho: 'dentista', nota: 4.6, avaliacoes: 80, categoria: 'Dentista', pontos: 75, situacao: 'com_voce', campanha_id: 'CMP-0001', conjunto_id: 'CJ-0001', anuncio_id: 'AN-0001', numero: 'prospec-01', origem_telefone: 'maps', mensagens_enviadas: 1, ia_mensagens: 2, criado_em: '2026-10-09T12:00:00Z', assumido_em: '2026-10-15T10:00:00Z', apagar_em: '2027-04-13', cliente_id: '', numero_revisar: false,
    funil: { enviada: '2026-10-12T12:40:00Z', entregue: '2026-10-12T12:41:00Z', respondeu: '2026-10-12T14:00:00Z', pediu_link: '2026-10-12T14:10:00Z' } }];
const MSGS = [{ id: 1, direcao: 'saiu', autor: 'disparo', texto: 'Oi! Aqui é a assistente virtual da RXSync. Vi a Clínica Sorriso Batel no Google Maps e queria saber: vocês respondem os pacientes no WhatsApp à noite?\n\nSe não quiser receber mensagens, responda SAIR.', tipo: 'texto', situacao: 'enviada', criada_em: '2026-10-13T12:40:00Z', entregue_em: '2026-10-13T12:41:00Z', lida_em: '2026-10-13T13:00:00Z' },
  { id: 2, direcao: 'entrou', autor: 'lead', texto: 'Oi! Não, à noite fica sem resposta. Quanto custa?', tipo: 'texto', situacao: 'recebida', criada_em: '2026-10-13T13:05:00Z' },
  { id: 3, direcao: 'saiu', autor: 'ia', texto: 'O Essencial sai por R$ 299 por mês, e dá para testar 7 dias grátis. Quer o link?', tipo: 'texto', situacao: 'enviada', criada_em: '2026-10-13T13:06:00Z', entregue_em: '2026-10-13T13:06:30Z', prompt_id: 4 }];
const okD = dados => ({ ok: true, dados });
// Públicos (sql/036): a lista (prosp_publicos) e um público com os contatos (prosp_publico). Telefone só com os 4 últimos dígitos.
const NUMS = (tamanho, disponiveis, em_conjunto, tirados, bloqueados, expiram_7d, expira_em_dias) => ({ tamanho, disponiveis, em_conjunto, abordados: tamanho - disponiveis - em_conjunto - tirados - bloqueados, tirados, bloqueados, expiram_7d, expira_em_dias });
export const PUBS = () => [
  { id: 'PB-0001', nome: 'Dentistas Curitiba', situacao: 'ativo', versao: 2, atualizado_em: '2026-10-15T09:00:00Z', termos: ['dentista', 'ortodontista'], lugares: ['Curitiba'], fuso: 'America/Sao_Paulo', novos_entram: 'selecionados',
    numeros: NUMS(148, 96, 31, 9, 6, 4, 2), conjuntos: [{ id: 'CJ-0001', nome: 'Dentistas Curitiba', situacao: 'ativo', campanha_id: 'CMP-0001', ativo: true }], creditos: { gastos: 34, limite: 120 } },
  { id: 'PB-0002', nome: 'Ortodontia Joinville', situacao: 'ativo', versao: 1, atualizado_em: '2026-10-14T09:00:00Z', termos: ['ortodontista'], lugares: ['Joinville', 'São Bento do Sul'], fuso: 'America/Sao_Paulo', novos_entram: 'tirados',
    numeros: NUMS(40, 22, 0, 18, 0, 0, null), conjuntos: [], creditos: { gastos: 7, limite: 60 } },
  { id: 'PB-0003', nome: 'Dermatologia Manaus', situacao: 'ativo', versao: 1, atualizado_em: '2026-10-13T09:00:00Z', termos: ['dermatologista'], lugares: ['Manaus'], fuso: 'America/Manaus', novos_entram: 'selecionados',
    numeros: NUMS(0, 0, 0, 0, 0, 0, null), conjuntos: [], creditos: { gastos: 0, limite: 120 } },
  { id: 'PB-0004', nome: 'Teste antigo', situacao: 'arquivado', versao: 1, atualizado_em: '2026-10-01T09:00:00Z', termos: ['dentista'], lugares: ['Ponta Grossa'], fuso: 'America/Sao_Paulo', novos_entram: 'selecionados',
    numeros: NUMS(3, 3, 0, 0, 0, 0, null), conjuntos: [], creditos: { gastos: 0, limite: 120 } }];
const CT = (id, nome, bairro, nota, pontos, fim, situacao, selecionado, dias, extra) => ({ id, nome, telefone_fim: '•••• ' + fim, cidade: 'Curitiba', bairro, uf: 'PR', nicho: 'dentista', nota, avaliacoes: 60, categoria: 'Dentista', pontos,
  numero_revisar: false, origem_telefone: 'maps', encontrado_em: '2026-10-0' + (dias % 9 + 1) + 'T12:00:00Z', apagar_em: '2027-01-0' + (dias % 9 + 1), expira_em_dias: dias, selecionado, entrou_em: '2026-10-05T12:00:00Z', mudou_em: null, situacao, lead: null, ...extra });
export const CONTATOS = () => [
  CT(9101, 'Sorriso Batel', 'Batel', 4.7, 81, '2001', 'disponivel', true, 78),
  CT(9102, 'Clínica Tirada', 'Centro', 4.4, 65, '2002', 'tirado', false, 78),
  CT(9103, 'Odonto Água Verde', 'Água Verde', 4.6, 74, '2003', 'em_conjunto', true, 70, { lead: { id: 'PX-AAAAA', conjunto_id: 'CJ-0001', situacao: 'enviado', enviada_em: '2026-10-13T12:40:00Z' } }),
  CT(9104, 'Expira Logo', 'Portão', 4.2, 52, '2004', 'disponivel', true, 2),
  CT(9105, 'Pediu para Sair', 'Centro', 4.8, 90, '2005', 'nao_contatar', false, 60),
  CT(9106, 'Prefeitura de Curitiba', 'Centro', 4.0, 55, '2006', 'orgao_publico', false, 60),
  CT(9107, 'Salão Bela Vista', 'Centro', 4.5, 58, '2007', 'fora_da_saude', false, 60)];
export const CREDITOS_MES = { gastos: 41, teto: 300 };
const pubObj = id => PUBS().find(p => p.id === id);
export const PROSP = {
  // Revisar conversas (sql/043, DEC-098): resposta direta (sem "dados"), com as sugestões liberadas para o teste do botão.
  prosp_conversas: () => ({ ok: true, total: 1, pagina: 0, sugestoes_liberadas: true, versoes_prompt: [],
    conversas: [{ lead_id: 'PX-AAAAA', nome: 'Sorriso Batel', nicho: 'dentista', cidade: 'Curitiba', campanha_id: 'CMP-0001', conjunto_id: 'CJ-0001', anuncio_id: 'AN-0001', situacao: 'recusou',
      resultado: 'recusou', ultimo_contato_em: '2026-10-15T12:00:00Z', ia_mensagens: 0, passou_para_voce: false,
      mensagens: [{ direcao: 'saiu', autor: 'disparo', texto: 'Oi! Vi a Sorriso Batel no Maps.', quando: '2026-10-15T11:00:00Z', prompt_id: null }, { direcao: 'entrou', autor: 'lead', texto: 'Não, obrigado.', quando: '2026-10-15T12:00:00Z', prompt_id: null }] }] }),
  prosp_inicio: () => okD({ campanhas: ARVORE(), numeros: [N1, N2].map(({ id, instancia, nome, situacao, ligado, teto_hoje }) => ({ id, instancia, nome, situacao, ligado, teto_hoje })),
    chaves: ESTADO.segurado ? { prosp_busca: 'SIM', prosp_ia: 'SIM', prosp_disparo: 'SIM', prosp_politica_v10: 'SIM', prosp_balanceamento: 'SIM' }
      : { prosp_busca: 'SIM', prosp_ia: 'SIM', prosp_disparo: 'NAO', prosp_politica_v10: 'NAO', prosp_balanceamento: 'NAO' }, nao_contatar: 14, travas: TRAVAS,
    resultados: { ultimos_7_dias: [linhaRel('CMP-0001', '', 180)], para_aprovar: 6, com_voce: 1, na_fila: 40, avisos_na_fila: 3, disparo_liberado: false, motor: motorDe(),
      custos: { preco_credito_serpapi: { valor: 0.075, descricao: 'plano de 5.000 buscas' }, fixo_mensal: { valor: 60, descricao: 'chip' } } } }),
  prosp_objeto: d => { if (d.tipo === 'publico') { const p = pubObj(d.id); if (!d.id) return okD({ objeto: null, config: CFG.publico, versoes: [], travas: TRAVAS });
      return p ? okD({ objeto: { tipo: 'publico', id: p.id, nome: p.nome, situacao: p.situacao, versao: p.versao, pai: '' }, config: { ...CFG.publico, novos_entram: p.novos_entram, fuso: p.fuso }, travas: TRAVAS,
        versoes: Array.from({ length: p.versao }, (_, i) => ({ versao: p.versao - i, criada_em: '2026-10-1' + (4 - i) + 'T12:00:00Z', criada_por: 'iPad · Safari', motivo: i ? 'migração do conjunto CJ-0001 (sql/036)' : '' })) }) : { ok: false, mensagem: 'Não encontrei.' }; }
    const arv = ARVORE(), todos = arv.flatMap(c => [{ ...c, tipo: 'campanha', pai: '' }, ...c.conjuntos.flatMap(j => [{ ...j, tipo: 'conjunto', pai: c.id, numero_id: j.numero && j.numero.id }, ...j.anuncios.map(a => ({ ...a, tipo: 'anuncio', pai: j.id }))])]);
    const o = todos.find(x => x.id === d.id && x.tipo === d.tipo);
    if (!d.id) return okD({ objeto: null, config: CFG[d.tipo], versoes: [], travas: TRAVAS });
    return o ? okD({ objeto: { tipo: o.tipo, id: o.id, nome: o.nome, situacao: o.situacao, versao: o.versao, pai: o.pai, numero_id: o.numero_id, pausa_motivo: o.pausa_motivo || '' }, config: CFG[d.tipo], travas: TRAVAS,
      versoes: Array.from({ length: o.versao }, (_, i) => ({ versao: o.versao - i, criada_em: '2026-10-1' + (4 - i) + 'T12:00:00Z', criada_por: 'iPad · Safari', motivo: i ? '' : 'teto 20' })) }) : { ok: false, mensagem: 'Não encontrei.' }; },
  prosp_historico: d => okD({ versao: d.versao, mudancas: d.tipo === 'publico' ? [['busca.lugares', ['Curitiba'], ['Curitiba', 'São José dos Pinhais']]] : [['entrega.teto_dia', 15, 20], ['publicos', [], ['PB-0001']]] }),
  prosp_publicos: () => okD({ publicos: PUBS(), creditos_mes: CREDITOS_MES, busca_ligada: true, fusos: ['America/Sao_Paulo', 'America/Manaus'] }),
  prosp_publico: d => { const p = pubObj(d.id); if (!p) return { ok: false, mensagem: 'Público não encontrado.' };
    const cts = CONTATOS().filter(x => !d.filtro || x.situacao === d.filtro || (d.filtro === 'bloqueado' && ['nao_contatar', 'cliente', 'demonstracao', 'orgao_publico', 'fora_da_saude'].includes(x.situacao)) || (d.filtro === 'expirando' && x.expira_em_dias <= 7 && !x.lead));
    return okD({ objeto: { tipo: 'publico', id: p.id, nome: p.nome, situacao: p.situacao, versao: p.versao, pai: '' }, config: CFG.publico, travas: TRAVAS, versoes: [], numeros: p.numeros, conjuntos: p.conjuntos,
      em_uso: p.conjuntos.some(j => j.ativo), creditos: { ...p.creditos, total_gastos: CREDITOS_MES.gastos, teto: CREDITOS_MES.teto }, pagina: d.pagina || 1, contatos: p.id === 'PB-0001' ? cts : [],
      buscas: p.id === 'PB-0001' ? [{ id: 12, termo: 'dentista', lugar: 'Curitiba', paginas: 3, paginas_feitas: 2, creditos: 2, situacao: 'feita', pedida_por: 'agenda', pedida_em: '2026-10-13T11:00:00Z', feita_em: '2026-10-13T11:10:00Z',
        contagens: { achados: 40, novos: 12, de_outro_publico: 3, ja_no_publico: 5, outro_fuso: 1, fixo: 9 } }] : [] }); },
  prosp_publico_salvar: d => ({ ok: true, id: d.id || 'PB-0005', versao: 3, mudancas: [], mensagem: 'Salvo (versão 3).' }),
  prosp_publico_duplicar: () => ({ ok: true, id: 'PB-0005', mensagem: 'Cópia criada: PB-0005 (os contatos selecionados vão junto; nada foi buscado).' }),
  prosp_publico_buscar: () => ({ ok: true, pedidas: 1, puladas: 1, mensagem: '1 busca(s) na fila; o workflow 50 traz uma página a cada 5 minutos e acrescenta os contatos novos. 1 pulada(s) (feita há menos de "não repetir").' }),
  prosp_numeros: () => okD({ numeros: [N1, N2], travas: TRAVAS }),
  prosp_regras: () => okD({ regras: [{ id: 1, fixa: true, ligada: true, nivel: 'anuncio', alvo_id: '', metrica: 'pare', operador: '>', valor: 5, depois_de: 20, janela_dias: 0, acao: 'pausar', disparos_30d: 1 },
    { id: 3, fixa: true, ligada: true, nivel: 'numero', alvo_id: '', metrica: 'desconectado', operador: '>', valor: 0, depois_de: 0, janela_dias: 0, acao: 'pausar', disparos_30d: 0 },
    { id: 7, fixa: false, ligada: true, nivel: 'anuncio', alvo_id: '', metrica: 'recusa', operador: '>', valor: 15, depois_de: 50, janela_dias: 7, acao: 'avisar', disparos_30d: 2 }] }),
  prosp_leads: d => okD({ pagina: d.pagina || 1, total: 62, por_situacao: { para_aprovar: 6, na_fila: 40, enviado: 9, respondeu: 3, positivo: 2, com_voce: 1, saiu: 1 },
    leads: LEADS.filter(l => !d.situacao || l.situacao === d.situacao) }),
  prosp_lead: d => { const l = LEADS.find(x => x.id === d.id); return l ? okD({ lead: l, mensagens: l.id === 'PX-AAAAA' ? MSGS : [] }) : { ok: false, mensagem: 'Lead não encontrado.' }; },
  prosp_relatorio: d => okD({ de: dia(29), ate: dia(0), nivel: d.nivel || 'campanha', detalhar: d.detalhar || '',
    linhas: d.detalhar === 'hora' ? [linhaRel('AN-0001', '9', 60), linhaRel('AN-0001', '14', 40)] : d.nivel === 'publico' ? [linhaRel('PB-0001', '', 230), linhaRel('', '', 45)] : d.nivel === 'anuncio' ? [linhaRel('AN-0001', '', 120), linhaRel('AN-0002', '', 115), linhaRel('AN-0003', '', 40)] : [linhaRel('CMP-0001', '', 275)],
    vencedores: [{ conjunto_id: 'CJ-0001', objetivo: 'positiva', primeiro: 'AN-0002', segundo: 'AN-0001', taxa_primeiro: 9.6, taxa_segundo: 5.0, envios_primeiro: 115, envios_segundo: 120, p: 0.17, situacao: 'empate', faltam: 290 }],
    classificacao: { etapas: { conversou: 9, recusou: 4, interessado: 3, saiu: 2 }, objecoes: { preco: 5, ja_tem_secretaria: 3 }, motivos_recusa: { preco: 2, nao_precisa: 2 } },
    anotacoes: [{ dia: dia(3), texto: 'Liguei o anúncio B (agenda cheia).', campanha_id: 'CMP-0001' }], colunas_salvas: {}, publicos: Object.fromEntries(PUBS().map(p => [p.id, p.nome])) }),
  prosp_buscas: () => okD({ busca_ligada: true, creditos_mes: [{ publico_id: 'PB-0001', gastos: 34, limite: 120 }, { publico_id: 'PB-0002', gastos: 7, limite: 60 }], creditos_total: CREDITOS_MES,
    buscas: [{ id: 12, publico_id: 'PB-0001', conjunto_id: 'CJ-0001', versao: 2, termo: 'dentista', lugar: 'Curitiba', paginas: 3, paginas_feitas: 2, creditos: 2, situacao: 'feita', pedida_por: 'agenda', pedida_em: '2026-10-13T11:00:00Z', feita_em: '2026-10-13T11:10:00Z',
      contagens: { achados: 40, novos: 12, de_outro_publico: 3, ja_no_publico: 5, outro_fuso: 1, fixo: 9, cliente: 1, palavra: 4, nota: 6 } }, { id: 13, publico_id: 'PB-0001', conjunto_id: null, versao: 2, termo: 'ortodontista', lugar: 'Curitiba', paginas: 3, paginas_feitas: 0, creditos: 0, situacao: 'pedida', pedida_por: 'central iPad', pedida_em: '2026-10-15T11:00:00Z', contagens: {} }] }),
  prosp_numero_qr: d => ({ ok: true, numero: { id: d.id, instancia: d.id === 1 ? 'prospec-01' : 'prospec-02' }, situacao: 'aguardando_qr', qr: qrDeMentira() }),
  prosp_numero_criar: () => ({ ok: true, numero: { id: 3, instancia: 'prospec-03' }, mensagem: 'Número prospec-03 criado. Leia o código no celular.', situacao: 'aguardando_qr', qr: qrDeMentira() }),
  prosp_numero_situacao: () => ({ ok: true, numero: { id: 2, instancia: 'prospec-02' }, situacao: 'aguardando_qr' }),
  prosp_exportar: () => ({ ok: true, arquivo: 'leads-CJ-0001.csv', csv: 'codigo;nome;cidade\n"PX-AAAAA";"Clínica Sorriso Batel";"Curitiba"' }),
  prosp_campanha_salvar: d => ({ ok: true, id: d.id || 'CMP-0003', versao: 4, mudancas: [], mensagem: 'Salvo (versão 4).' }),
  prosp_conjunto_salvar: d => ({ ok: true, id: d.id || 'CJ-0003', versao: 3, mudancas: [], mensagem: 'Salvo (versão 3).' }),
  prosp_anuncio_salvar: d => ({ ok: true, id: d.id || 'AN-0005', versao: 2, mudancas: [], mensagem: 'Salvo (versão 2).' }),
  prosp_duplicar: d => ({ ok: true, id: d.tipo === 'campanha' ? 'CMP-0003' : d.tipo === 'conjunto' ? 'CJ-0003' : 'AN-0005', mensagem: 'Cópia criada em rascunho.' })
};
// ---------------------------------------------------------------- demonstrações por link (sql/056, DEC-125): dados inventados
const agoraMenos = h => new Date(Date.now() - h * 3600e3).toISOString();
const DEM_LINKS = () => [
  { id: 904, clinica: 'Instituto Bem Estar', tratamento: 'Dr.', medico: 'Marcos Lima', especialidade: 'Medicina do esporte', cidade: 'Recife', cor: 'petroleo', situacao: 'ativo_hoje', criada_em: agoraMenos(72),
    primeiro_acesso: agoraMenos(48), ultimo_acesso: agoraMenos(1), visitas: 3, valida_ate: dia(-10), lead_codigo: 'PX-ACDE3', escopo_enviado_em: agoraMenos(2), conversar_em: agoraMenos(1) },
  { id: 901, clinica: 'Clínica Vida Leve', tratamento: 'Dra.', medico: 'Helena Prado', especialidade: 'Endocrinologia', cidade: 'Curitiba', cor: 'verde', situacao: 'nunca_abriu', criada_em: agoraMenos(5),
    primeiro_acesso: null, ultimo_acesso: null, visitas: 0, valida_ate: dia(-60), lead_codigo: null, escopo_enviado_em: null, conversar_em: null },
  { id: 902, clinica: 'Clínica Desativada', tratamento: 'Dr.', medico: 'Paulo Reis', especialidade: 'Nutrologia', cidade: '', cor: 'vinho', situacao: 'desativado', criada_em: agoraMenos(400),
    primeiro_acesso: agoraMenos(390), ultimo_acesso: agoraMenos(380), visitas: 1, valida_ate: dia(-5), lead_codigo: null, escopo_enviado_em: null, conversar_em: null }];
const demLink = id => { const l = DEM_LINKS().find(x => String(x.id) === String(id)); if (!l) return null;
  const endereco = 'https://rxsync.com.br/demo/clinica/#' + (l.id === 904 ? 'CDEFGHJKMNPQRTUV' : 'ACDEFGHJKMNPQRTU');
  return { ...l, codigo: endereco.slice(-16), endereco, anotacao: l.id === 904 ? 'Conheci no congresso de Recife; quer começar em dezembro.' : '', mensagem_editada: false, desativada_em: l.situacao === 'desativado' ? agoraMenos(380) : null,
    tentou_inativo_em: l.situacao === 'desativado' ? agoraMenos(30) : null,
    mensagem: `Olá, ${l.tratamento} ${l.medico.split(' ')[0]}! Preparei uma demonstração do app de acompanhamento com a marca ${l.clinica}: o app que o paciente usa e a central onde ${l.tratamento === 'Dra.' ? 'a senhora' : 'o senhor'} acompanha cada um. É só tocar: ${endereco}` }; };
export const DEM = {
  dem_lista: d => { const todos = DEM_LINKS(); const f = d.filtro || 'todos';
    const links = todos.filter(l => f === 'todos' || (f === 'abriu' ? ['abriu', 'ativo_hoje'].includes(l.situacao) : f === 'inativos' ? ['desativado', 'vencido'].includes(l.situacao) : l.situacao === f));
    return { ok: true, total: links.length, pagina: d.pagina || 1, links, contagem: { todos: 3, nunca_abriu: 1, abriu: 1, ativo_hoje: 1, inativos: 1 } }; },
  dem_link: d => { const l = demLink(d.id); if (!l) return { ok: false, mensagem: 'Link não encontrado.' };
    const comUso = l.id === 904;
    return { ok: true, link: l, uso: comUso ? { segundos: 1460, aparelhos: { celular: 2, computador: 1 },
      telas: [{ pagina: 'app', tela: 'picadinha', vezes: 4, segundos: 380 }, { pagina: 'central', tela: 'pacientes', vezes: 2, segundos: 210 }, { pagina: 'escopo', tela: '', vezes: 1, segundos: 300 }],
      toques: [{ pagina: 'app', alvo: 'Registrar refeição', vezes: 6 }, { pagina: 'central', alvo: 'Ficha do paciente', vezes: 3 }],
      perguntas: [{ quando: agoraMenos(30), chat: 'ia', texto: 'Como funciona o lembrete da aplicação?' }, { quando: agoraMenos(29), chat: 'equipe', texto: 'A nutricionista consegue mandar o cardápio por aqui?' }],
      escopo: [{ item: 7, escolha: 'quero', nota: '', atualizado_em: agoraMenos(2) }, { item: 23, escolha: 'quero', nota: 'Essencial para nós', atualizado_em: agoraMenos(2) },
        { item: 36, escolha: 'duvida', nota: 'Funciona no Android?', atualizado_em: agoraMenos(2) }, { item: 35, escolha: 'nao_preciso', nota: '', atualizado_em: agoraMenos(2) }],
      envios: [{ id: 3, tipo: 'conversar', quando: agoraMenos(1), conteudo: { texto: 'Pode me chamar à tarde, depois das 15h.' } }, { id: 2, tipo: 'escopo', quando: agoraMenos(2), conteudo: { quero: 2, duvida: 1, nao_preciso: 1 } }],
      visitas: [{ id: 9003, inicio: agoraMenos(2), fim: agoraMenos(1.8), segundos: 720, eventos: 41, tipo_aparelho: 'celular', navegador: 'Safari', aparelho: 'bbbbbb' },
        { id: 9001, inicio: agoraMenos(48), fim: agoraMenos(47.9), segundos: 420, eventos: 18, tipo_aparelho: 'computador', navegador: 'Chrome', aparelho: '0a1b2c' }] }
      : { segundos: 0, aparelhos: {}, telas: [], toques: [], perguntas: [], escopo: [], envios: [], visitas: [] } }; },
  dem_visita: () => ({ ok: true, eventos: [{ quando: agoraMenos(48), pagina: 'entrada', tela: '', acao: 'entrou', detalhe: {} }, { quando: agoraMenos(47.99), pagina: 'app', tela: 'picadinha', acao: 'abriu-tela', detalhe: {} },
    { quando: agoraMenos(47.98), pagina: 'app', tela: 'picadinha', acao: 'tocou', detalhe: { alvo: 'item 23' } }, { quando: agoraMenos(47.95), pagina: 'app', tela: 'picadinha', acao: 'saiu-tela', detalhe: { s: 95 } }] }),
  dem_criar: () => ({ ok: true, id: 905, endereco: 'https://rxsync.com.br/demo/clinica/#KMNPQRTUVWXY3479', mensagem: 'Olá!' }),
  dem_editar: d => ({ ok: true, id: Number(d.id), endereco: 'https://rxsync.com.br/demo/clinica/#CDEFGHJKMNPQRTUV', mensagem: 'Olá!' }),
  dem_desativar: () => ({ ok: true, mensagem: 'Link desativado: quem abrir vê que ele não está mais ativo.' }),
  dem_reativar: () => ({ ok: true, mensagem: 'Link ativo de novo.' }),
  dem_ver: d => ({ ok: true, endereco: demLink(d.id).endereco + '&ver=' + 'd1'.repeat(16) }),
  dem_apagar: () => ({ ok: true, mensagem: 'Link e todo o registro dele apagados.' })
};
