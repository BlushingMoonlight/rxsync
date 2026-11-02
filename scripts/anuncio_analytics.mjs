// A página do anúncio e o Google Analytics (rxsync-sistema DEC-190 e DEC-191), com o Google SIMULADO (nada sai):
//   1. sem o "Aceitar", nada vai ao Google; a origem do anúncio fica só na aba;
//   2. com o "Aceitar", o Consent Mode básico vem antes de tudo (negado por padrão, liberado pela escolha) e a primeira
//      página vista leva o endereço de chegada (com o gclid e as UTMs), uma vez por aba;
//   3. a origem curta ("google / cpc / campanha") fica na aba, sem o gclid, e a contratação a usa;
//   4. o contratar manda o begin_checkout (com o valor do plano e BRL) uma vez, ao sair do passo 1;
//   5. a página do anúncio tem noindex, uma chamada principal e a regra de segurança ligada, sem bloqueio.
// Uso (precisa do Playwright): node scripts/anuncio_analytics.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, bloqueios, regraDa } from './csp_teste.mjs';
let falhas = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) falhas++; return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const CHEGADA = '/assistente-whatsapp-clinica/?gclid=TESTE123&utm_source=Google&utm_medium=cpc&utm_campaign=Clinicas%20SP';
const fila = p => p.evaluate(() => Array.from(window.dataLayer || []).map(a => Array.from(a)));

// 1. Sem o "Aceitar"
let { ctx } = await contextoCsp(browser, {});
let page = ctx.pages()[0];
await page.goto(site.base + CHEGADA); await page.waitForTimeout(500);
ok((await fila(page)).length === 0, 'sem o "Aceitar": nada na fila do Google');
ok(await page.evaluate(() => sessionStorage.getItem('rx_origem_campanha')) === 'google / cpc / clinicas-sp', 'a origem curta fica na aba: "google / cpc / clinicas-sp"');
ok(!/TESTE123/.test(await page.evaluate(() => sessionStorage.getItem('rx_origem_campanha'))), 'a origem curta não leva o gclid');
ok(await page.locator('meta[name="robots"][content^="noindex"]').count() === 1, 'a página do anúncio tem noindex');
ok(await page.locator('main a.chamada').first().textContent() === 'Testar 7 dias grátis, sem cartão', 'a chamada principal: "Testar 7 dias grátis, sem cartão"');
ok(/default-src 'none'/.test(await regraDa(page)) && !(await bloqueios(page)).length, 'a regra de segurança está ligada e nada é bloqueado');
// 2. O "Aceitar" na página seguinte: o Google lê o endereço de chegada
await page.goto(site.base + '/contratar.html?plano=gestao&ciclo=mensal&origem=anuncio');
await page.getByRole('button', { name: 'Aceitar' }).click();
await page.waitForFunction(() => (window.dataLayer || []).some(a => a[0] === 'config'));
let f = await fila(page);
const iDef = f.findIndex(a => a[0] === 'consent' && a[1] === 'default'), iUpd = f.findIndex(a => a[0] === 'consent' && a[1] === 'update'), iCfg = f.findIndex(a => a[0] === 'config');
ok(iDef >= 0 && iUpd > iDef && iCfg > iUpd && f[iDef][2].ad_storage === 'denied' && f[iDef][2].analytics_storage === 'denied' && f[iUpd][2].analytics_storage === 'granted',
  'Consent Mode básico: negado por padrão, liberado pelo "Aceitar", antes do config');
ok(/gclid=TESTE123/.test(f[iCfg][2].page_location) && /utm_campaign=Clinicas/.test(f[iCfg][2].page_location), 'a primeira página vista depois do "Aceitar" leva o endereço de chegada (gclid e UTMs)');
ok(await page.evaluate(() => typeof ORIGEM_CAMPANHA !== 'undefined' && ORIGEM_CAMPANHA) === 'google / cpc / clinicas-sp', 'o contratar usa a origem da campanha guardada na aba');
await page.locator('section[data-etapa="1"] .proximo').click(); f = await fila(page);
const bc = f.filter(a => a[0] === 'event' && a[1] === 'begin_checkout');
ok(bc.length === 1 && bc[0][2].currency === 'BRL' && bc[0][2].value === 599, 'begin_checkout uma vez, com o valor do plano (599) e BRL');
await page.reload(); await page.waitForFunction(() => (window.dataLayer || []).some(a => a[0] === 'config'));
f = await fila(page);
ok(!/gclid/.test(f.find(a => a[0] === 'config')[2].page_location), 'o endereço de chegada vale uma vez por aba');
await ctx.close(); await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: a página do anúncio, o Consent Mode básico, a chegada pelo anúncio e o begin_checkout.');
process.exit(falhas ? 1 : 0);
