// Painel (painel/, DEC-156): testa pela tela a regra de segurança da página (CSP), com o n8n SIMULADO aqui (nada sai para a
// internet; dados inventados). A regra está ligada e bloqueia de verdade (uma marca com style= é recusada); depois:
//   1. a entrada (sem sessão) e todas as telas e subtelas abrem sem nenhum bloqueio, inclusive o gráfico de Resultados;
//   2. Conta › WhatsApp › Reconectar: o QR (inventado, data:image/png) aparece;
//   3. os downloads feitos no aparelho (blob:) saem: Baixar meus dados (agenda e pacientes), a agenda em .ics e os CSV de
//      erros das importações da agenda e de pacientes, depois da prévia de cada uma.
// Uso (precisa do Playwright): node scripts/painel_csp.mjs
import { abrirNavegador, servirSite, qrDeMentira } from './central_simulado.mjs';
import { contextoCsp, bloqueios } from './csp_teste.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const dia = n => new Date(Date.now() + n * 86400000);
const CONSULTAS = [1, 2].map(i => ({ id: i, inicio: dia(i).toISOString(), fim: new Date(dia(i).getTime() + 1800000).toISOString(), nome_paciente: 'Paciente Teste ' + i,
  telefone_paciente: '4199999000' + i, servico: 'Avaliação', status: 'confirmado', visto: true, criado_por: i === 1 ? 'ia' : 'equipe' }));
const PACIENTES = [{ paciente_id: 'PAC-0001', nome: 'Paciente Teste Um', telefone: '41999990001', conversou_em: dia(-3).toISOString(), criado_em: dia(-30).toISOString(), origem: 'painel' }];
const AGENDA_CSV = 'Data;Hora;Paciente;Telefone;Serviço\n20/11/2027;09:00;Paciente Teste Um;41999990001;Avaliação\n32/11/2027;10:00;Data Errada;41999990002;Avaliação\n';
const PACIENTES_CSV = 'Nome;Telefone;E-mail\nPaciente Teste Dois;41999990003;dois@exemplo.test\nTelefone Errado;123;\n';
const serie = Array.from({ length: 7 }, (_, i) => ({ dia: dia(i - 7).toISOString().slice(0, 10), ia: i % 3, manual: 1 }));
function responder(url, b) {
  const caminho = url.slice(N8N.length), d = b.dados || {};
  if (caminho === 'painel-entrada') {
    if (b.acao === 'termos_estado') return { ok: true, pendente: false, papel: 'dono' };
    if (b.acao === 'dados_exportar') return { ok: true, linhas: d.parte === 'agenda' ? CONSULTAS : PACIENTES, tem_mais: false };
    if (b.acao === 'equipe_listar') return { ok: true, pessoas: [{ id: 1, email: 'dono@clinica.test', papel: 'dono', situacao: 'ativa' }] };
    if (b.acao === 'acessos_recentes') return { ok: true, acessos: [] };
    return { ok: true };
  }
  if (caminho === 'conectar') return { ok: true, status: 'pendente', qr: qrDeMentira() };
  if (caminho !== 'autoedicao') return { ok: true, data: [] };
  if (b.acao === 'abrir') return { ok: true, papel: 'dono', editaveis: { nome_exibicao: 'Clínica Teste CSP', fuso_horario: 'America/Sao_Paulo', email: 'dono@clinica.test' },
    somenteLeitura: { plano: 'Gestão Inteligente', numero_whatsapp: '5541999990000' }, limite_catalogo: 500,
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'].map(k => [k, true])) };
  if (b.acao === 'agenda_listar') return { ok: true, data: CONSULTAS };
  if (b.acao === 'indicadores') return { ok: true, data: { atual: { conversas: 12, agendadas_ia: 5, agendadas_manual: 3, taxa_agendamento: 41.7, com_lembrete: 6, presenca_confirmada: 4, canceladas: 1 },
    anterior: { conversas: 10, agendadas_ia: 4, agendadas_manual: 3, com_lembrete: 5, presenca_confirmada: 3, canceladas: 2 }, serie, semana: [0, 2, 3, 1, 2, 4, 0], hora: Array.from({ length: 24 }, (_, h) => (h >= 8 && h <= 18 ? h % 4 : 0)) } };
  if (b.acao === 'agenda_importar') { const n = (d.linhas || []).length; return { ok: true, data: { ok: true, novas: n, existentes: 0, repetidas: 0, conflitos: 0, erros: 0, canceladas: 0, futuras: n, pacientes_lembrete: n, lista_erros: [], lembretes_clinica: true, importacao_id: d.gravar ? 7 : null } }; }
  if (b.acao === 'paciente_listar') return { ok: true, data: { ok: true, total: PACIENTES.length, pacientes: PACIENTES } };
  if (b.acao === 'paciente_ver') return { ok: true, data: { ok: true, paciente: PACIENTES[0], consultas_futuras: [], consultas_passadas: [], total_passadas: 0, possiveis_duplicados: [] } };
  if (b.acao === 'paciente_importar') { const n = (d.linhas || []).length; return { ok: true, data: { ok: true, novos: n, existentes: 0, completados: 0, parecidos: 0, repetidas: 0, erros: 0, lista_erros: [] } }; }
  if (b.acao === 'paciente_duplicados') return { ok: true, data: { ok: true, grupos: [] } };
  if (b.acao === 'paciente_importacoes') return { ok: true, data: { ok: true, importacoes: [] } };
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
async function contexto(comSessao) {
  return contextoCsp(browser, { responder: (caminho, b) => responder(N8N + caminho, b), antes: comSessao ? { fn: s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, arg: SESSAO } : null });
}
const PAINEL = site.base + '/painel/';

// 0. A regra está na página e bloqueia de verdade.
let { ctx, page, erros } = await contexto(false);
await page.goto(PAINEL);
await page.locator('#entEntrar').waitFor();
const regra = await page.evaluate(() => (document.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || '');
ok(/default-src 'none'/.test(regra) && /script-src 'sha256-/.test(regra) && /img-src 'self' data:/.test(regra), 'a página tem a regra de segurança (CSP), com o resumo do script e as imagens data:');
await page.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<span style="color:red">x</span>'; document.body.appendChild(d); });
await page.waitForFunction(() => window.__bloqueios.length > 0);
ok((await bloqueios(page)).some(b => /^style-src/.test(b)), 'a regra bloqueia de verdade: uma marca com style= é recusada');
erros.length = 0;
// 1a. Entrada, sem sessão
await page.reload(); await page.locator('#entEntrar').waitFor(); await page.waitForLoadState('networkidle');
let b = await bloqueios(page);
ok(!b.length, 'entrada (sem sessão): nenhum bloqueio' + (b.length ? ': ' + b.join(' | ') : ''));
await ctx.close();

// 1b. Todas as telas, com a sessão
({ ctx, page, erros } = await contexto(true));
await page.goto(PAINEL + '#hoje');
await page.locator('#app').waitFor({ state: 'visible' });
const TELAS = ['hoje', 'resultados', 'agenda', 'agenda/espera', 'agenda/documentos', 'agenda/horarios', 'agenda/horarios/grade', 'agenda/horarios/regras', 'agenda/horarios/medicos',
  'agenda/horarios/perguntas', 'agenda/horarios/feriados', 'agenda/horarios/pagamento', 'agenda/horarios/integracao', 'agenda/horarios/integracao/link', 'agenda/horarios/integracao/reservio',
  'agenda/horarios/integracao/importar', 'agenda/horarios/integracao/importacoes', 'pacientes', 'pacientes/ficha/PAC-0001', 'pacientes/organizar', 'pacientes/importar',
  'pacientes/importacoes', 'pacientes/duplicados', 'assistente', 'assistente/clinica', 'assistente/conversa', 'assistente/valores', 'assistente/urgencia', 'assistente/automaticas',
  'assistente/limites', 'assistente/extras', 'assistente/faq', 'assistente/funcoes', 'conta', 'conta/contato', 'conta/assinatura', 'conta/contrato',
  'conta/gestao', 'conta/equipe', 'conta/dados', 'conta/acessos', 'conta/whatsapp'];
const comBloqueio = [];
for (const t of TELAS) {
  await page.evaluate(h => { location.hash = h; }, t);
  await page.locator(`section[data-tela="${t.replace(/\/PAC-.*$/, '')}"]`).waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle');
  if (t === 'resultados') await page.waitForFunction(() => window.Chart && window.Chart.getChart(document.getElementById('grDias')));
  b = await bloqueios(page); if (b.length) comBloqueio.push(t + ': ' + b.join(' | '));
}
ok(!comBloqueio.length, `as ${TELAS.length} telas e subtelas abrem sem nenhum bloqueio` + (comBloqueio.length ? ': ' + comBloqueio.join(' · ') : ''));
ok(await page.evaluate(() => !!window.Chart.getChart(document.getElementById('grDias'))), 'Resultados: o gráfico (arquivo do próprio site) desenha');

// 2. QR do WhatsApp (data:image/png)
await page.evaluate(() => { location.hash = 'conta/whatsapp'; });
await page.click('#btnReconectar');
await page.locator('#zapQrImg').waitFor({ state: 'visible' });
await page.waitForFunction(() => document.getElementById('zapQrImg').complete && document.getElementById('zapQrImg').naturalWidth > 0);
ok(/^data:image\/png;base64,/.test(await page.getAttribute('#zapQrImg', 'src')), 'Reconectar: o QR (data:image/png) aparece');
b = await bloqueios(page); ok(!b.length, 'QR: nenhum bloqueio' + (b.length ? ': ' + b.join(' | ') : ''));

// 3. Downloads feitos no aparelho (blob:)
async function baixa(nome, acao, padrao) {
  const [dl] = await Promise.all([page.waitForEvent('download'), acao()]);
  const bl = await bloqueios(page);
  ok(padrao.test(dl.suggestedFilename()) && !bl.length, `${nome}: o arquivo sai (${dl.suggestedFilename()}), sem bloqueio` + (bl.length ? ': ' + bl.join(' | ') : ''));
}
await page.evaluate(() => { location.hash = 'conta/dados'; }); await page.locator('#btnBaixarAgenda').waitFor({ state: 'visible' });
await baixa('Baixar meus dados › Agenda', () => page.click('#btnBaixarAgenda'), /^rxsync-agenda-.*\.csv$/);
await baixa('Baixar meus dados › Pacientes', () => page.click('#btnBaixarPacientes'), /^rxsync-pacientes-.*\.csv$/);
await page.evaluate(() => { location.hash = 'agenda'; }); await page.locator('#agMais').click();
await baixa('Agenda › Exportar (.ics)', () => page.getByRole('button', { name: /^Exportar/ }).click(), /^agenda-rxsync-.*\.ics$/);
await page.evaluate(() => { location.hash = 'agenda/horarios/integracao/importar'; });
await page.locator('#aiTela input[type=file]').waitFor({ state: 'attached' });
await page.setInputFiles('#aiTela input[type=file]', { name: 'agenda.csv', mimeType: 'text/csv', buffer: Buffer.from(AGENDA_CSV, 'utf8') });
await page.getByRole('button', { name: 'Ver a prévia' }).click();
await page.getByRole('button', { name: /Importar 1 consulta/ }).waitFor();
b = await bloqueios(page); ok(!b.length, 'importação da agenda: a prévia abre sem bloqueio' + (b.length ? ': ' + b.join(' | ') : ''));
await baixa('Importação da agenda › relatório de erros', () => page.getByRole('button', { name: 'Baixar o relatório de conflitos e erros (CSV)' }).click(), /^agenda-conflitos-e-erros\.csv$/);
await page.evaluate(() => { location.hash = 'pacientes/importar'; });
await page.locator('#impArquivo').waitFor({ state: 'attached' });
await page.setInputFiles('#impArquivo', { name: 'pacientes.csv', mimeType: 'text/csv', buffer: Buffer.from(PACIENTES_CSV, 'utf8') });
await page.getByRole('button', { name: 'Ver a prévia' }).click();
await page.getByRole('button', { name: 'Baixar as linhas com erro (CSV)' }).waitFor();
b = await bloqueios(page); ok(!b.length, 'importação de pacientes: a prévia abre sem bloqueio' + (b.length ? ': ' + b.join(' | ') : ''));
await baixa('Importação de pacientes › linhas com erro', () => page.getByRole('button', { name: 'Baixar as linhas com erro (CSV)' }).click(), /^linhas-com-erro-pacientes\.csv$/);

ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: a regra de segurança do painel está ligada e nada do que o painel usa é bloqueado.');
process.exit(falhas ? 1 : 0);
