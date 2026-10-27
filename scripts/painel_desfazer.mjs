// Painel (painel/, DEC-156): testa pela tela desmarcar "vista" e desfazer o cancelamento (rxsync-sistema sql/066, S10 e
// S13), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. consulta vista: "Marcar como não vista" manda agenda_visto_desfazer só com o id, fecha a consulta e ela volta a
//      aparecer como "Nova";
//   2. consulta cancelada no futuro: "Desfazer o cancelamento" pede confirmação e manda agenda_cancelar_desfazer só com o
//      id; a recusa do servidor (horário ocupado) aparece na tela; a consulta cancelada que já passou ou veio do
//      Reservio não tem o botão.
// Uso (precisa do Playwright): node scripts/painel_desfazer.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { ocupado: false };
const dia = (n, h) => { const d = new Date(Date.now() + n * 86400000); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const CONSULTAS = () => [
  { id: 21, nome_paciente: 'Ana Souza', telefone_paciente: '41999991111', servico: 'Consulta', inicio: dia(1, 9), fim: dia(1, 10), status: 'confirmado', criado_por: 'manual', visto: true },
  { id: 22, nome_paciente: 'Bruno Lima', telefone_paciente: '41988882222', servico: 'Consulta', inicio: dia(2, 11), fim: dia(2, 12), status: 'cancelado', criado_por: 'ia', visto: true },
  { id: 23, nome_paciente: 'Carla Antiga', telefone_paciente: '41977773333', servico: 'Consulta', inicio: dia(-3, 9), fim: dia(-3, 10), status: 'cancelado', criado_por: 'ia', visto: true },
  { id: 24, nome_paciente: 'Davi Reservio', telefone_paciente: '41966664444', servico: 'Consulta', inicio: dia(3, 9), fim: dia(3, 10), status: 'cancelado', criado_por: 'manual', visto: true, origem_externa: 'reservio' }
];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, papel: 'equipe',
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'medicos', 'pacientes'].map(k => [k, k !== 'medicos'])) };
  if (caminho === 'autoedicao' && b.acao === 'agenda_listar') return { ok: true, data: CONSULTAS() };
  if (caminho === 'autoedicao' && b.acao === 'agenda_visto_desfazer') return { ok: true, data: { ok: true } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_cancelar_desfazer') return { ok: true, data: estado.ocupado
    ? { ok: false, motivo: 'ocupado', mensagem: 'O horário não está mais livre: já tem outra consulta ou um bloqueio nele.' } : { ok: true } };
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
await page.locator('#agLista').getByText('Ana Souza').first().waitFor();
const cartao = nome => page.locator('#agLista .linha', { hasText: nome }).first();
const filtro = { click: async () => {   // os chips (tela larga) ou a folha do filtro (celular)
  const chip = page.locator('#agChips button', { hasText: 'Cancelados' });
  if (await chip.isVisible()) return chip.click();
  await page.click('#agFiltroBtn'); await page.locator('.folha button.linha', { hasText: 'Cancelados' }).click();
} };

// 1. desmarcar "vista"
await cartao('Ana Souza').locator('.linha-abrir').click();
await page.getByRole('button', { name: 'Marcar como não vista' }).click();
await page.locator('#toast', { hasText: 'volta a aparecer como nova' }).waitFor();
let ch = chamadas.filter(c => c.acao === 'agenda_visto_desfazer').pop();
ok(ch && String(ch.dados.id) === '21' && Object.keys(ch.dados).join() === 'id' && ch.sessao === SESSAO, '"Marcar como não vista": agenda_visto_desfazer só com o id, pela sessão');
ok(await page.locator('#consultaFolha').count() === 0, 'a consulta fecha (abrir de novo marcaria como vista)');
ok(await cartao('Ana Souza').getByText('Nova').count() === 1, 'a consulta volta a aparecer como "Nova"');

// 2. desfazer o cancelamento
await filtro.click();
await cartao('Bruno Lima').locator('.linha-abrir').click();
await page.getByRole('button', { name: 'Desfazer o cancelamento' }).click();
ok(await page.locator('#confOk').isVisible(), 'pede confirmação antes (nível 2)');
await page.click('#confOk');
await page.locator('#toast', { hasText: 'Cancelamento desfeito' }).waitFor();
ch = chamadas.filter(c => c.acao === 'agenda_cancelar_desfazer').pop();
ok(ch && String(ch.dados.id) === '22' && Object.keys(ch.dados).join() === 'id', '"Desfazer o cancelamento": agenda_cancelar_desfazer só com o id');
estado.ocupado = true;
await filtro.click();
await cartao('Bruno Lima').locator('.linha-abrir').click();
await page.getByRole('button', { name: 'Desfazer o cancelamento' }).click(); await page.click('#confOk');
await page.locator('#toast', { hasText: 'não está mais livre' }).waitFor();
ok(true, 'a recusa do servidor (horário ocupado) aparece na tela');
await page.keyboard.press('Escape');
await cartao('Carla Antiga').locator('.linha-abrir').click();
ok(await page.getByRole('button', { name: 'Desfazer o cancelamento' }).count() === 0, 'cancelada que já passou: sem o botão');
await page.keyboard.press('Escape');
await cartao('Davi Reservio').locator('.linha-abrir').click();
ok(await page.getByRole('button', { name: 'Desfazer o cancelamento' }).count() === 0, 'cancelada que veio do Reservio: sem o botão');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: desmarcar "vista" e desfazer o cancelamento.');
process.exit(falhas ? 1 : 0);
