// Painel (painel/, DEC-156): testa pela tela o "Chegou" e "Faltou" e o motivo do cancelamento (rxsync-sistema sql/075,
// S4), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. consulta que já começou: "Chegou" e "Faltou"; "Faltou" manda agenda_comparecimento com o id e o valor, mostra o
//      selo "Faltou" e o botão para desmarcar; a consulta que ainda não começou não tem os botões;
//   2. cancelar: o motivo é opcional; sem escolher, vai só o id (como antes); com "Outro motivo", vai o motivo e o texto;
//      a consulta cancelada mostra o motivo;
//   3. Resultados: a taxa de faltas, com quantas consultas foram marcadas.
// Uso (precisa do Playwright): node scripts/painel_chegou_faltou.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = [];
const dia = (n, h) => { const d = new Date(Date.now() + n * 86400000); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const min = m => new Date(Date.now() + m * 60000).toISOString();
const CONSULTAS = () => [
  { id: 31, nome_paciente: 'Eva Agora', telefone_paciente: '41999991111', servico: 'Consulta', inicio: min(-10), fim: min(20), status: 'confirmado', criado_por: 'manual', visto: true, comparecimento: '' },
  { id: 32, nome_paciente: 'Ana Futura', telefone_paciente: '41988882222', servico: 'Consulta', inicio: dia(2, 11), fim: dia(2, 12), status: 'confirmado', criado_por: 'ia', visto: true, comparecimento: '' },
  { id: 33, nome_paciente: 'Bia Cancelada', telefone_paciente: '41977773333', servico: 'Consulta', inicio: dia(3, 9), fim: dia(3, 10), status: 'cancelado', criado_por: 'ia', visto: true, motivo_cancelamento: 'clinica', motivo_cancelamento_outro: '' }
];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, papel: 'equipe',
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'medicos', 'pacientes'].map(k => [k, k !== 'medicos'])) };
  if (caminho === 'autoedicao' && b.acao === 'agenda_listar') return { ok: true, data: CONSULTAS() };
  if (caminho === 'autoedicao' && ['agenda_comparecimento', 'agenda_cancelar'].includes(b.acao)) return { ok: true, data: { ok: true } };
  if (caminho === 'autoedicao' && b.acao === 'indicadores') return { ok: true, data: { atual: { conversas: 10, agendadas_ia: 2, agendadas_manual: 1, canceladas: 1, com_lembrete: 0, presenca_confirmada: 0, chegaram: 3, faltaram: 1, taxa_faltas: 25 },
    anterior: { conversas: 8, agendadas_ia: 1, agendadas_manual: 1, canceladas: 0, com_lembrete: 0, presenca_confirmada: 0, chegaram: 1, faltaram: 1, taxa_faltas: 50 } } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_medicos_listar') return { ok: true, data: { medicos: [] } };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false };
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const erros = [];
const page = await ctx.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/painel/#agenda'); await page.locator('#calViews').getByRole('button', { name: 'Lista' }).click();
await page.locator('#agLista').getByText('Eva Agora').first().waitFor();
const cartao = nome => page.locator('#agLista .linha', { hasText: nome }).first();
const folha = page.locator('#consultaFolha');

// 1. "Chegou" e "Faltou"
await cartao('Eva Agora').locator('.linha-abrir').click();
ok(await folha.getByRole('button', { name: 'Chegou', exact: true }).isVisible() && await folha.getByRole('button', { name: 'Faltou', exact: true }).isVisible(), 'consulta que já começou: "Chegou" e "Faltou"');
await folha.getByRole('button', { name: 'Faltou', exact: true }).click();
await page.locator('#toast', { hasText: 'Marcado: faltou' }).waitFor();
let ch = chamadas.filter(c => c.acao === 'agenda_comparecimento').pop();
ok(ch && String(ch.dados.id) === '31' && ch.dados.valor === 'faltou' && Object.keys(ch.dados).sort().join() === 'id,valor' && ch.sessao === SESSAO, '"Faltou": agenda_comparecimento com o id e o valor, pela sessão');
ok(await folha.locator('.etq', { hasText: 'Faltou' }).count() === 1 && await folha.getByRole('button', { name: 'Desmarcar "Faltou"' }).isVisible(), 'a consulta mostra "Faltou" e o botão para desmarcar');
await page.keyboard.press('Escape');
await cartao('Ana Futura').locator('.linha-abrir').click();
ok(await folha.getByRole('button', { name: 'Chegou', exact: true }).count() === 0, 'consulta que ainda não começou: sem "Chegou" e "Faltou"');

// 2. o motivo do cancelamento
await folha.getByRole('button', { name: 'Cancelar consulta' }).click();
ok(await page.locator('#cancMotivo').isVisible() && !(await page.locator('#cancOutro').isVisible()), 'cancelar: "Motivo (opcional)", sem o campo do "outro"');
await page.locator('#cancMotivo').selectOption('outro');
await page.locator('#cancOutro').fill('  Viajou  ');
await page.click('#confOk');
await page.locator('#toast', { hasText: 'Consulta cancelada' }).waitFor();
ch = chamadas.filter(c => c.acao === 'agenda_cancelar').pop();
ok(ch && String(ch.dados.id) === '32' && ch.dados.motivo === 'outro' && ch.dados.motivo_outro === 'Viajou', '"Outro motivo": vai o motivo e o texto');
await cartao('Eva Agora').locator('.linha-abrir').click();
await folha.getByRole('button', { name: 'Cancelar consulta' }).click(); await page.click('#confOk');
await page.locator('#toast', { hasText: 'Consulta cancelada' }).last().waitFor();
await page.waitForTimeout(300);
ch = chamadas.filter(c => c.acao === 'agenda_cancelar').pop();
ok(ch && String(ch.dados.id) === '31' && Object.keys(ch.dados).join() === 'id', 'sem escolher o motivo: vai só o id, como antes');
const chip = page.locator('#agChips button', { hasText: 'Cancelados' });
if (await chip.isVisible()) await chip.click(); else { await page.click('#agFiltroBtn'); await page.locator('.folha button.linha', { hasText: 'Cancelados' }).click(); }
await cartao('Bia Cancelada').locator('.linha-abrir').click();
ok((await folha.textContent()).includes('Motivo do cancelamento') && (await folha.textContent()).includes('A clínica precisou desmarcar'), 'a consulta cancelada mostra o motivo');
await page.keyboard.press('Escape');

// 3. Resultados
await page.goto(site.base + '/painel/#resultados');
const tf = page.locator('.indicador', { hasText: 'Taxa de faltas' });
await tf.waitFor();
ok((await tf.textContent()).includes('25%') && (await tf.textContent()).includes('1 de 4 consultas marcadas'), 'Resultados: taxa de faltas de 25%, 1 de 4 consultas marcadas');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: "Chegou", "Faltou", o motivo do cancelamento e a taxa de faltas.');
process.exit(falhas ? 1 : 0);
