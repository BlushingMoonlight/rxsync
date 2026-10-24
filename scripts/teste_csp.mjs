// Página teste.html (a cliente testa a assistente pelo chat), com o chat SIMULADO aqui (nada sai para a internet) e a
// regra de segurança (CSP) ligada:
//   1. a regra está na página e bloqueia de verdade (um script escrito depois não roda);
//   2. com o token, o chat carrega, o botão "Abrir a conversa" fica pronto e abre a conversa;
//   3. sem o token, avisa que o link está incompleto e não carrega o chat;
//   em todos, nenhum bloqueio da regra. O chat de verdade só se confere no aparelho.
// Uso (precisa do Playwright): node scripts/teste_csp.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, regraDa, provarBloqueio, conferidor } from './csp_teste.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const site = await servirSite(); const browser = await abrirNavegador();
let { ctx, page, erros } = await contextoCsp(browser, { viewport: { width: 390, height: 844 } });
await page.goto(site.base + '/teste.html?token=tokenDeTeste123');
await page.getByRole('button', { name: 'Abrir a conversa' }).waitFor();
ok(/default-src 'none'/.test(await regraDa(page)) && /frame-src https:\/\/app\.rxsync\.com\.br/.test(await regraDa(page)) && await provarBloqueio(page), 'a regra está na página (com a janela do chat) e bloqueia de verdade');
ok(await page.locator('iframe.woot-widget-holder').count() === 1, 'o chat (simulado) carrega, com a janela da conversa');
await page.getByRole('button', { name: 'Abrir a conversa' }).click();
ok(await page.evaluate(() => window.$chatwoot.aberto), '"Abrir a conversa" abre o chat');
await semBloqueio(page, 'com o token (o chat, o <style> e o style= que ele põe na página)');
const errosAntes = erros.splice(0);
await ctx.close();
({ ctx, page, erros } = await contextoCsp(browser));
erros.push(...errosAntes);
await page.goto(site.base + '/teste.html');
await page.getByText('Link incompleto. Abra o teste de novo pelo painel.').waitFor();
ok(await page.locator('iframe').count() === 0, 'sem o token: avisa e não carrega o chat');
await semBloqueio(page, 'sem o token');
ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: a regra de segurança do teste.html está ligada e nada do que a página usa é bloqueado.');
process.exit(falhas() ? 1 : 0);
