// Painel (painel/, DEC-156): "Excluir todas as canceladas (N)", na Agenda › Lista › Cancelados, apaga só as N consultas
// canceladas que a lista mostra (pente fino da camada 3, I-04: antes, o painel pedia agenda_excluir_cancelados, e o
// servidor apagava TODAS as canceladas da clínica, também as de outro médico, com o filtro de médico, e as de mais de 90
// dias, que a lista não mostra). Com o n8n SIMULADO aqui (nada sai para a internet; dados inventados):
//   1. a lista mostra 2 canceladas; o botão diz 2 e, confirmado, pede agenda_excluir de cada uma (e nunca a de todas);
//   2. a mensagem diz quantas saíram.
// Uso (precisa do Playwright): node scripts/painel_cancelados.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'd'.repeat(64);
const h = n => new Date(Date.now() + n * 3600000).toISOString();
const chamadas = [];
let AG = [
  { id: 11, nome_paciente: 'Carla Teste', telefone_paciente: '41999990011', servico: 'Consulta', inicio: h(26), fim: h(26.5), status: 'cancelado', visto: true },
  { id: 12, nome_paciente: 'Davi Teste', telefone_paciente: '41999990012', servico: 'Retorno', inicio: h(-30), fim: h(-29.5), status: 'cancelado', visto: true },
  { id: 13, nome_paciente: 'Elisa Teste', telefone_paciente: '41999990013', servico: 'Consulta', inicio: h(50), fim: h(50.5), status: 'agendado', visto: true }];
function responder(caminho, b) {
  chamadas.push({ caminho, acao: b.acao, dados: b.dados || {} });
  if (caminho === 'painel-entrada') return b.acao === 'termos_estado' ? { ok: true, pendente: false, papel: 'dono' } : { ok: true };
  if (caminho !== 'autoedicao') return { ok: true, data: [] };
  if (b.acao === 'abrir') return { ok: true, papel: 'dono', editaveis: { nome_exibicao: 'Clínica Canceladas', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: 'Essencial' }, recursos: {}, limite_catalogo: 500, conta: { situacao: '', no_ar: true } };
  if (b.acao === 'agenda_listar') return { ok: true, data: AG };
  if (b.acao === 'agenda_excluir') { const antes = AG.length; AG = AG.filter(a => !(a.id === Number((b.dados || {}).id) && a.status === 'cancelado')); return { ok: true, data: { ok: AG.length < antes, n: antes - AG.length } }; }
  if (b.acao === 'agenda_excluir_cancelados') return { ok: true, data: { ok: true, n: 7 } };   // o servidor apagaria todas (7, com as de fora da lista)
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url().slice(N8N.length), b)) });
});
const page = await ctx.newPage(); page.setDefaultTimeout(30000);
page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/painel/#agenda');
await page.locator('#calViews button[data-v="lista"]').click();
await page.locator('#agChips button', { hasText: 'Cancelados' }).click();
const botao = page.getByRole('button', { name: /Excluir todas as canceladas/ });
await botao.waitFor();
ok(/\(2\)/.test(await botao.textContent()), 'a lista mostra 2 canceladas e o botão diz 2');
await botao.click(); await page.click('#confOk');
await page.getByText(/2 consultas excluídas/).waitFor({ timeout: 10000 }).catch(() => {});
const exc = chamadas.filter(c => c.acao === 'agenda_excluir').map(c => Number(c.dados.id)).sort();
ok(!chamadas.some(c => c.acao === 'agenda_excluir_cancelados'), 'não pede ao servidor para apagar todas as canceladas da clínica');
ok(exc.join() === '11,12', 'pede para excluir só as 2 canceladas da lista (ids 11 e 12)');
ok(await page.getByText(/2 consultas excluídas/).count() > 0, 'a mensagem diz quantas saíram (2)');
ok(AG.some(a => a.id === 13), 'a consulta marcada (não cancelada) continua');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await ctx.close(); await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: "Excluir todas as canceladas" apaga só as que a lista mostra.');
process.exit(falhas ? 1 : 0);
