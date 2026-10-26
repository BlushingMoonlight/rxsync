// contratar.html: quando os Termos mudam depois que a página abriu, o cadastro (workflow 20) responde 409 com a
// mensagem; a página mostra essa mensagem, não grava nada como sucesso e devolve os botões. Um erro qualquer continua
// com a mensagem de sempre. n8n SIMULADO aqui (nada sai para a internet; dados inventados).
// Uso (precisa do Playwright): node scripts/contratar_termos_mudaram.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, conferidor } from './csp_teste.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const MSG = 'Os Termos mudaram. Recarregue a página para ver a versão nova.';
const estado = { resposta: { __status: 409, ok: false, mensagem: MSG } };
const site = await servirSite(); const browser = await abrirNavegador();
const { page, erros, chamadas } = await contextoCsp(browser, { responder: (caminho, b) => caminho === 'cadastro' && b._evento === 'aceite' ? estado.resposta : { ok: true } });
await page.goto(site.base + '/contratar.html?plano=essencial&ciclo=mensal');
await page.evaluate(() => { const p = (id, v) => { document.getElementById(id).value = v; }; p('nome', 'Maria Teste'); p('email', 'maria@exemplo.test'); p('whatsapp', '41999990000'); mostrar(5); });
await page.check('#aceiteTermos'); await page.check('#aceiteDpa');
await page.click('#btnTeste');
await page.locator('#erroAceite:not(.hidden)').waitFor();
const aceite = chamadas.find(c => c.corpo._evento === 'aceite');
ok(aceite && aceite.corpo.versao_termos === '2026-10-v7', 'o cadastro vai com a versão 2026-10-v7');
ok(await page.textContent('#erroAceite') === MSG, '409: a página mostra a mensagem do servidor (' + await page.textContent('#erroAceite') + ')');
ok(await page.locator('#sucesso.hidden').count() === 1 && !(await page.isDisabled('#btnTeste')), 'não mostra o sucesso e devolve os botões');
estado.resposta = { __status: 500, ok: false };
await page.click('#btnTeste');
await page.waitForFunction(m => document.getElementById('erroAceite').textContent !== m, MSG);
ok(/^Não consegui registrar agora/.test(await page.textContent('#erroAceite')), 'outro erro: a mensagem de sempre');
await semBloqueio(page, 'com a regra de segurança ligada');
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: quando os Termos mudam, a contratação mostra a mensagem do servidor.');
process.exit(falhas() ? 1 : 0);
