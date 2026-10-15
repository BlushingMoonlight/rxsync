// Central RXSync: servidor SIMULADO para os testes (scripts/central_telas.mjs e scripts/central_acoes.mjs).
// Nada sai para a internet: o site é servido em 127.0.0.1 e o n8n é respondido aqui, com dados inventados.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/central';
export async function abrirNavegador() {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
  return chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
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
  'editar_situacao', 'editar_links'];
export const cli = (id, nome, plano, status, extra) => ({ cliente_id: id, nome, plano, status, ativo: status === 'Ativo', modalidade: 'contratado', mensagens_mes: 1800, franquia: 5000, whatsapp: 'open', interna: false, ...extra });
export const ficha = () => ({ cliente_id: 'CLI-001', nome: 'Clínica Sorriso Odontologia Integrada', razao_social: 'Sorriso Ltda', representante: 'Ana', email: 'ana@exemplo.com', telefone: '48999990001',
  plano: 'Essencial', status: 'Ativo', modalidade: 'teste', ativo: true, interna: false, valor_mensal: 299, valor_setup: 999, ciclo: 'mensal', forma_pagamento: 'boleto', aceite: '2026-10-01',
  versao_termos: '2026-10-v3', go_live: '2026-10-05', fim_teste: '2026-10-20', onboarding: 'concluido', ultimo_pagamento: null, origem: 'site', sistema_gestao: 'Clinicorp', cidade: 'Florianópolis/SC',
  limites: { franquia_mensagens: '', limitar_franquia: '', dono_limite_dia: '', relac_limite_dia: '' }, funcoes: { fila: 'SIM', documentos: '', lembretes: 'SIM', agendamento: 'SIM' }, franquia: 5000,
  mensagens_mes: 1200, uso_30d: dias(30, (d, i) => ({ dia: d, recebidas: 10 + i, enviadas: 12 + i })), medicos_ativos: 2, whatsapp: { estado: 'open', desde: '2026-10-05T10:00:00Z' },
  integracao: { plataforma: 'reservio', ativo: true, ultimo_erro: '' }, chaves_api_ativas: 0, avisos_eventos: { ativo: true, servidor: 'api.exemplo.com' },
  ultimos_avisos: [{ recebido_em: '2026-10-15T10:00:00Z', categoria: 'clientes', tipo: 'no_ar' }], pode_reenviar_onboarding: true, suspensao_motivo: '',
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
export const DADOS = {
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
    pedidos: [{ criado_em: '2026-10-15T10:00:00Z', nome: 'Maria Teste', clinica: 'Clínica Exemplo', email: 'maria@exemplo.com', telefone: '48999990000', sistema_atual: 'planilha', plano_interesse: 'gestao' }] } },
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
  teste_estender: 3, link_painel_novo: 3, chave_api_revogar: 3, cobranca_teste_definir: 3 };
export const CHAVES_LIGADAS = () => ({ ...Object.fromEntries(CHAVES.map(k => [k, 'SIM'])), asaas_ambiente: 'sandbox', cobranca_teste_cliente: '' });
export const SENSIVEL = { ok: true, dados: { cliente_id: 'CLI-001', nome: 'Clínica Sorriso Odontologia Integrada', empresa: { razao_social: 'Sorriso Ltda', cnpj: '11222333000181', representante_nome: 'Ana Souza', representante_cpf: '11122233344', email: 'ana@exemplo.com', telefone: '48999990001' },
  aceite: { data_aceite: '01/10/2026, 10:00:00', versao_termos: '2026-10-v3', ip_aceite: '10.0.0.9', aceite_dpa: 'SIM' }, copia_do_aceite: null } };
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
    if (b.acao === 'config') return r({ ok: true, chaves: Object.entries(chaves).map(([chave, valor]) => ({ chave, valor, descricao: 'Descrição da chave ' + chave, fase: 4, so_por_sql: chave === 'cobranca_teste_cliente' || chave === 'asaas_ambiente' })),
      sessao: {}, niveis: { acoes: NIVEIS, regras: {} } });
    if (b.acao === 'ligar_chave') { const antes = chaves[b.dados.chave]; chaves[b.dados.chave] = b.dados.valor; return r({ ok: true, antes, depois: b.dados.valor }); }
    if (b.acao === 'cliente') return r({ ok: true, cliente: ficha() });
    if (b.acao === 'cliente_sensivel') return r(SENSIVEL);
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
