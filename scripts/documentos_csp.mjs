// Documentos do site (a Política de Privacidade e os Termos de Uso), com a regra de segurança (CSP) ligada e nada saindo
// para a internet: cada um abre com a regra, ela bloqueia de verdade (um script escrito depois não roda), nada do
// documento é bloqueado e a versão e a data aparecem no topo.
// Uso (precisa do Playwright): node scripts/documentos_csp.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, regraDa, provarBloqueio, conferidor } from './csp_teste.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const DOCUMENTOS = [['privacidade.html', /Versão 2026-10-v19<\/strong> · Vigente a partir de 24 de outubro de 2026/]];
const site = await servirSite(); const browser = await abrirNavegador();
const { page, erros } = await contextoCsp(browser, { viewport: { width: 390, height: 844 } });
for (const [arq, versao] of DOCUMENTOS) {
  await page.goto(site.base + '/' + arq);
  await page.waitForLoadState('networkidle');
  ok(/default-src 'none'/.test(await regraDa(page)) && await provarBloqueio(page), `${arq}: a regra está na página e bloqueia de verdade`);
  ok(versao.test(await page.content()), `${arq}: a versão e a data no topo`);
  await semBloqueio(page, arq);
}
ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: os documentos abrem com a regra de segurança, sem nenhum bloqueio.');
process.exit(falhas() ? 1 : 0);
