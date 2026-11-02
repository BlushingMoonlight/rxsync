// Painel (rxsync-sistema #225, item 23; DEC-178): o tour guiado, com o n8n SIMULADO aqui (nada sai para a internet):
//   1. na primeira vez em Hoje, o cartão do tour aparece (sem bloquear a tela) e aponta a área de cada passo;
//      "Continuar" passa para o próximo; "Ver depois" fecha e grava "depois";
//   2. na Agenda, aparece o tour da Agenda; as telas de cada tarefa (lembretes, equipe, o que ela sabe) têm a parada delas;
//      "Pular" grava que a pessoa não quer mais ("*": "pulado");
//   3. Conta › "Rever o tour" recomeça (tour_marcar "*" "rever") e o tour de Hoje aparece de novo;
//   4. sem o estado do tour vindo do servidor (servidor antigo), nada aparece.
// Uso (precisa do Playwright): node scripts/painel_tour.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) falhas++; return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const site = await servirSite(); const browser = await abrirNavegador();
async function abrir(comTour, conta) {
  const chamadas = []; let tour = {};
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('painel_sessao', 'a'.repeat(64)); } catch (e) {} });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request(); if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    const c = q.url().slice(N8N.length); chamadas.push({ c, acao: b.acao, dados: b.dados || {} });
    let o = { ok: true, data: [] };
    if (c === 'autoedicao' && b.acao === 'abrir') o = { ok: true, editaveis: { nome_exibicao: 'Clínica Tour' }, papel: 'dono', recursos: { pacientes: true }, conta: conta || { no_ar: true } };
    if (c === 'painel-entrada' && b.acao === 'tour_ler') o = comTour ? { ok: true, tour } : { ok: true };
    if (c === 'painel-entrada' && b.acao === 'tour_marcar') { const d = b.dados; tour = d.tela === '*' && d.estado === 'rever' ? {} : { ...tour, [d.tela]: d.estado }; o = { ok: true, tour }; }
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  await page.goto(site.base + '/painel/#hoje'); await page.locator('#hojeCorpo').waitFor();
  return { ctx, page, chamadas };
}
let { ctx, page, chamadas } = await abrir(true);
const cartao = page.locator('.tour-cartao');
await cartao.waitFor();
ok((await cartao.textContent()).includes('Tour · 1 de') && await page.locator('.tour-alvo').count() === 1, 'Hoje: o tour aparece na primeira vez e aponta a área');
ok(await page.locator('#btnBusca').isEnabled() && !(await page.locator('.tour-cartao[aria-modal="true"]').count()), 'o tour não bloqueia a tela');
await cartao.getByRole('button', { name: 'Continuar' }).click();
ok((await cartao.textContent()).includes('Tour · 2 de'), '"Continuar" passa para o próximo passo');
await cartao.getByRole('button', { name: 'Ver depois' }).click();
ok(!(await cartao.count()) && chamadas.some(x => x.acao === 'tour_marcar' && x.dados.tela === 'hoje' && x.dados.estado === 'depois'), '"Ver depois" fecha e grava "depois"');
await page.goto(site.base + '/painel/#agenda'); await page.waitForTimeout(300);
await page.locator('.tour-cartao').waitFor();
ok((await page.locator('.tour-cartao').textContent()).includes('Paciente ligou na recepção'), 'Agenda: o tour da Agenda (a tarefa: marcar quem ligou)');
await page.locator('.tour-cartao').getByRole('button', { name: 'Entendi' }).click();
// O tour por tarefa (DEC-191): cada tela da tarefa tem a sua parada, com o que fazer.
for (const [rota, texto] of [['assistente/automaticas', 'Ligue os lembretes'], ['conta/equipe', 'convide a secretária'], ['assistente', 'Tudo o que ela responde vem daqui']]) {
  await page.goto(site.base + '/painel/#' + rota); await page.waitForTimeout(300);
  await page.locator('.tour-cartao').waitFor();
  ok((await page.locator('.tour-cartao').textContent()).includes(texto), rota + ': a parada da tarefa (' + texto + ')');
  await page.locator('.tour-cartao').getByRole('button', { name: 'Entendi' }).click();
}
await page.goto(site.base + '/painel/#agenda/horarios/grade'); await page.waitForTimeout(300);
await page.locator('.tour-cartao').waitFor();
await page.locator('.tour-cartao').getByRole('button', { name: 'Pular' }).click();
ok(chamadas.some(x => x.acao === 'tour_marcar' && x.dados.tela === '*' && x.dados.estado === 'pulado'), '"Pular" grava que não quer mais o tour');
await page.goto(site.base + '/painel/#conta'); await page.locator('#btnReverTour').click();
await page.locator('.tour-cartao').waitFor();
ok(chamadas.some(x => x.acao === 'tour_marcar' && x.dados.estado === 'rever') && (await page.locator('.tour-cartao').textContent()).includes('Tour · 1 de'), 'Conta › "Rever o tour" recomeça em Hoje');
await ctx.close();
// Auditoria de 01/11/2026, FD-01: com o cartão de estado em Hoje (falta conectar), o tour não começa por cima dele na
// primeira vista; começa quando Hoje abre de novo.
({ ctx, page } = await abrir(true, { no_ar: false, situacao: 'teste_aguardando' }));
await page.locator('#hojeEstado').waitFor(); await page.waitForTimeout(1500);
ok(!(await page.locator('.tour-cartao').count()), 'Hoje com o cartão de estado: o tour não aparece na primeira vista');
await page.goto(page.url().replace(/#.*/, '#conta')); await page.waitForTimeout(300); await page.goto(page.url().replace(/#.*/, '#hoje'));
await page.locator('.tour-cartao').waitFor();
ok(true, 'Hoje aberto de novo: o tour começa');
await ctx.close();
({ ctx, page } = await abrir(false));
await page.waitForTimeout(1500);
ok(!(await page.locator('.tour-cartao').count()), 'sem o estado do tour vindo do servidor, nada aparece');
await ctx.close(); await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: o tour aparece, segue, fica para depois, pula e recomeça.');
process.exit(falhas ? 1 : 0);
