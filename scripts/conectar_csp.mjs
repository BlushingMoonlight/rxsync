// Página conectar.html (conectar o WhatsApp), com o n8n SIMULADO aqui (nada sai para a internet; dados inventados) e a
// regra de segurança (CSP) ligada:
//   1. a regra está na página e bloqueia de verdade (um script escrito depois não roda);
//   2. o QR (inventado, data:image/png) aparece e o "Prefiro testar antes" mostra o link do ambiente de teste;
//   3. "conectado" e "link vencido" (a mensagem do servidor) aparecem;
//   4. o botão do chat abre a página inicial com o chat numa aba nova;
//   em todos, nenhum bloqueio da regra.
// Uso (precisa do Playwright): node scripts/conectar_csp.mjs
import { abrirNavegador, servirSite, qrDeMentira } from './central_simulado.mjs';
import { contextoCsp, regraDa, provarBloqueio, conferidor } from './csp_teste.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const TOKEN = 'cd'.repeat(32);
const estado = { status: 'pendente', vencido: false };
const responder = (caminho, b) => {
  if (caminho !== 'conectar') return { ok: false };
  if (estado.vencido) return { ok: false, mensagem: 'Este link venceu. Peça um novo à RXSync.' };
  if (b.acao === 'testar') return { ok: true, mensagem: 'Pronto!', link: 'https://rxsync.com.br/teste.html?token=teste' };
  return estado.status === 'conectado' ? { ok: true, status: 'conectado' } : { ok: true, status: 'pendente', qr: qrDeMentira() };
};
const site = await servirSite(); const browser = await abrirNavegador();
const URL_ = site.base + '/conectar.html?t=' + TOKEN;

let { ctx, page, erros } = await contextoCsp(browser, { responder, viewport: { width: 390, height: 844 } });
await page.goto(URL_);
await page.locator('#imgQr').waitFor({ state: 'visible' });
ok(/default-src 'none'/.test(await regraDa(page)) && /img-src 'self' data:/.test(await regraDa(page)) && await provarBloqueio(page), 'a regra está na página (com o QR em data:) e bloqueia de verdade');
await page.waitForFunction(() => document.getElementById('imgQr').complete && document.getElementById('imgQr').naturalWidth > 0);
ok(/^data:image\/png;base64,/.test(await page.getAttribute('#imgQr', 'src')), 'o QR (data:image/png) aparece');
ok(await page.locator('svg.lucide').count() > 0, 'os ícones (arquivo do próprio site) aparecem');
await semBloqueio(page, 'QR');
await page.click('#btnTestar'); await page.click('#btnConfirmarTestar');
await page.getByRole('link', { name: 'Abrir meu ambiente de teste' }).waitFor();
await semBloqueio(page, '"Prefiro testar antes" com o link do teste');
// O chat: abre a página inicial com ?suporte=1 numa aba nova.
const [nova] = await Promise.all([ctx.waitForEvent('page'), page.click('.rxc-chat')]);
await nova.waitForLoadState('domcontentloaded').catch(() => {});
ok(/\/\?suporte=1$/.test(nova.url()), 'o botão do chat abre a página inicial com o chat numa aba nova (' + nova.url().replace(site.base, '') + ')');
ok(await page.evaluate(() => !document.querySelector('script[src*="app.rxsync.com.br"]')), 'o chat não carrega nesta página');
await semBloqueio(page, 'o botão do chat');
estado.status = 'conectado';
await page.getByText('Conectado!').waitFor({ timeout: 10000 });
await semBloqueio(page, 'conectado (depois de esperar o QR)');
const errosAntes = erros.splice(0);
await ctx.close();

estado.vencido = true;
({ ctx, page, erros } = await contextoCsp(browser, { responder }));
erros.push(...errosAntes);
await page.goto(URL_);
await page.getByText('Este link venceu. Peça um novo à RXSync.').waitFor();
await semBloqueio(page, 'link vencido (a mensagem do servidor)');
ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: a regra de segurança do conectar.html está ligada e nada do que a página usa é bloqueado.');
process.exit(falhas() ? 1 : 0);
