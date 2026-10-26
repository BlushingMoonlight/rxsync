// contratar.html: testa pela tela que os termos aparecem preenchidos com os dados de quem contrata, sem nenhum dado
// pessoal no endereço do quadro nem no do link "abrir em nova aba" (BlushingMoonlight/rxsync-sistema#69). Nada sai para a
// internet. Uso (precisa do Playwright): node scripts/contratar_termos.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const pedidos = [];
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
ctx.on('request', q => pedidos.push(q.url()));
const page = await ctx.newPage(); page.setDefaultTimeout(8000);
const erros = []; page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/contratar.html');
await page.evaluate(() => {
  const p = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  p('nome', 'Maria Teste'); p('cpf', '529.982.247-25'); p('razao', 'Clínica Teste Ltda'); p('cnpj', '11.222.333/0001-81');
  p('cep', '80000-000'); p('logradouro', 'Rua A'); p('numero', '10'); p('bairro', 'Centro'); p('cidade', 'Curitiba'); p('uf', 'PR');
  mostrar(4);   // a etapa dos termos (chama carregarTermos)
});
const frame = page.frameLocator('#frameTermos');
await frame.locator('[data-cli="rep"]').filter({ hasText: 'Maria Teste' }).waitFor({ state: 'attached' });
ok(true, 'o quadro dos termos aparece com os dados de quem contrata');
const src = await page.locator('#frameTermos').getAttribute('src');
const href = await page.locator('#linkTermos').getAttribute('href');
const termos = pedidos.filter(u => u.includes('/termos/'));
const vazou = [src, href, ...termos].filter(u => /Maria|529|982|Teste|Curitiba|\?/.test(decodeURIComponent(u || '')));
ok(!vazou.length, 'nenhum dado pessoal no endereço do quadro, do link ou dos pedidos dos termos' + (vazou.length ? ': ' + vazou.join(' | ') : ''));
const [aba] = await Promise.all([ctx.waitForEvent('page'), page.click('#linkTermos')]);
await aba.locator('[data-cli="rep"]').filter({ hasText: 'Maria Teste' }).waitFor({ state: 'attached' });
ok(!/\?/.test(aba.url()), '"abrir em nova aba": os termos aparecem preenchidos, sem dado no endereço (' + aba.url().replace(site.base, '') + ')');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: termos preenchidos sem dados pessoais no endereço.');
process.exit(falhas ? 1 : 0);
