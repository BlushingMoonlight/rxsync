// Demonstração do projeto Enterprise (demo/drandrepontes/): testa, com o n8n SIMULADO aqui (nada sai para a internet),
//   1. o registro de uso (rxsync-sistema DEC-135, W-03): com { ok: false, motivo: 'interno' } o lote volta para a fila e
//      vai de novo; com { ok: false, motivo: 'limite' } o lote é descartado (tentar de novo não adianta);
//   2. o aviso curto de privacidade na entrada (DEC-134, #99): aparece uma vez por aparelho; "Entendi" guarda só a marca
//      'ag-aviso-privacidade' = '1' (nenhum dado pessoal) e ele não volta.
// Uso (precisa do Playwright): node scripts/demo_registro.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const LOG = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demo-log';
const envios = []; let resposta = { ok: true, gravados: 1 };

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { try { if (!localStorage.getItem('ag-usuario-2')) localStorage.setItem('ag-usuario-2', 'convidado'); } catch (e) {} });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(LOG)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  envios.push((b.eventos || []).map(e => e.acao));
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(resposta) });
});
const p = await ctx.newPage(); p.setDefaultTimeout(8000); const erros = []; p.on('pageerror', e => erros.push(String(e)));
await p.goto(site.base + '/demo/drandrepontes/');
await p.waitForFunction(() => window.AG && window.AG.log);

// 1. registro
const mandar = async acao => { const n = envios.length; await p.evaluate(a => { window.AG.log(a, {}); window.AG.enviarLog(false); }, acao);
  for (let i = 0; i < 40 && envios.length === n; i++) await p.waitForTimeout(50); await p.waitForTimeout(150); };
const vezes = acao => envios.filter(l => l.includes(acao)).length;
resposta = { ok: false, motivo: 'interno' };
await mandar('teste-interno');
resposta = { ok: true, gravados: 1 };
await p.evaluate(() => window.AG.enviarLog(false)); await p.waitForTimeout(400);
ok(vezes('teste-interno') === 2, 'falha interna: o lote volta para a fila e vai de novo (' + vezes('teste-interno') + ' envios)');
resposta = { ok: false, motivo: 'limite' };
await mandar('teste-limite');
resposta = { ok: true, gravados: 1 };
await p.evaluate(() => { window.AG.log('depois-do-limite', {}); window.AG.enviarLog(false); }); await p.waitForTimeout(400);
ok(vezes('teste-limite') === 1 && vezes('depois-do-limite') === 1, 'limite: o lote é descartado e o próximo segue sozinho');

// 2. aviso curto
const aviso = p.locator('#aviso-privacidade');
ok(await aviso.isVisible() && /90 dias depois do último uso/.test(await aviso.innerText()), 'aviso: aparece na entrada, com o prazo de 90 dias');
ok(await aviso.locator('a[href="/privacidade.html"]').count() === 1, 'aviso: leva à Política de Privacidade');
await aviso.getByRole('button', { name: 'Entendi' }).click();
ok(await aviso.count() === 0, 'aviso: "Entendi" fecha');
ok(await p.evaluate(() => localStorage.getItem('ag-aviso-privacidade')) === '1', 'aviso: a marca guardada é só "1" (nenhum dado pessoal)');
await p.reload(); await p.waitForFunction(() => window.AG && window.AG.log); await p.waitForTimeout(200);
ok(await p.locator('#aviso-privacidade').count() === 0, 'aviso: não volta no mesmo aparelho');

ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? falhas + ' falha(s).' : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
