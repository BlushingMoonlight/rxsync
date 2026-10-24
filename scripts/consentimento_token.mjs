// assets/consentimento.js: o token do onboarding (?t=) e o código de origem (?ref=) nunca vão ao Google Analytics, nem
// no endereço da página anterior. Abre a página inicial vindo do onboarding.html?t=<token inventado>&ref=<código
// inventado>, com o aceite de cookies, e confere o que a página entregou ao Google (a fila de comandos, dataLayer).
// Nada sai para a internet. Uso (precisa do Playwright): node scripts/consentimento_token.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, conferidor } from './csp_teste.mjs';
const { ok, falhas } = conferidor();
const TOKEN = '12'.repeat(32), REF = 'PX-AC3D7';
const site = await servirSite(); const browser = await abrirNavegador();
const { page, erros } = await contextoCsp(browser, { responder: () => ({ ok: false, mensagem: 'Link inválido.' }), antes: { fn: () => { try { localStorage.setItem('rx_cookies', 'sim'); } catch (e) {} } } });
await page.goto(site.base + `/onboarding.html?t=${TOKEN}&ref=${REF}&plano=gestao`);
await page.getByText('Link inválido.').waitFor();
await page.evaluate(() => { const a = document.createElement('a'); a.href = '/'; a.id = 'irInicio'; a.textContent = 'início'; document.body.appendChild(a); });
await Promise.all([page.waitForURL(u => u.pathname === '/'), page.click('#irInicio')]);
await page.waitForFunction(() => (window.dataLayer || []).some(a => a[0] === 'config'));
ok(await page.evaluate(t => document.referrer.includes(t), TOKEN), '(a página anterior tinha mesmo o token no endereço)');
const ga = await page.evaluate(() => (Array.from(window.dataLayer || []).map(a => Array.from(a)).find(a => a[0] === 'config') || [])[2] || null);
const tudo = JSON.stringify(ga || {});
ok(ga && !tudo.includes(TOKEN) && !tudo.includes(REF) && !/[?&]t=/.test(ga.page_referrer), 'o endereço da página anterior vai ao Google sem o token e sem o ref (' + (ga && ga.page_referrer || '').replace(site.base, '') + ')');
ok(ga && /plano=gestao/.test(ga.page_referrer), 'o resto da query (o plano) continua');
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: nem o token do onboarding nem o código de origem vão ao Google Analytics.');
process.exit(falhas() ? 1 : 0);
