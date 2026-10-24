// Documentos do site (a Política de Privacidade e os Termos de Uso v1 a v7), com a regra de segurança (CSP) ligada e nada
// saindo para a internet: cada um abre com a regra, ela bloqueia de verdade (um script escrito depois não roda), nada do
// documento é bloqueado e a versão aparece no topo. Os Termos antigos (v1 a v6) são, letra por letra, o arquivo de antes,
// só com a linha da regra a mais; e os Termos aparecem dentro da contratação com os dados de quem contrata.
// Uso (precisa do Playwright): node scripts/documentos_csp.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import crypto from 'node:crypto'; import fs from 'node:fs';
import { contextoCsp, regraDa, provarBloqueio, conferidor } from './csp_teste.mjs';
import { META_CSP } from './csp.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const DOCUMENTOS = [['privacidade.html', /Versão 2026-10-v19<\/strong> · Vigente a partir de 24 de outubro de 2026/],
  ...[1, 2, 3, 4, 5, 6, 7].map(v => [`termos/2026-10-v${v}.html`, new RegExp(`Versão 2026-10-v${v}</strong>`)])];
// O resumo (SHA-256) de cada Termos antigo antes da regra: o arquivo sem a linha da regra tem de dar o mesmo resumo.
const ANTES = {
  '2026-10-v1': 'cd82f9d0e61096979e0b3b938dcccfa6e6369b5047b125e32be6eacc8f15e736',
  '2026-10-v2': '651475d5e13cf9c803409c36e7e71d0e13d4d4eb9c577869ed26ba332f5e4d63',
  '2026-10-v3': '79d2ae052f2cea3d6b5067cc9188f9dcb71b4aaf3179e6aefe7074d04027dcea',
  '2026-10-v4': 'cf72252fa7fcb8652f0dc5552a036b49a6d1ee1d66fafaf8d5c039c321411968',
  '2026-10-v5': '02cdf002fffbdffebe07bc1fd2401eaeb68140d7eeb09507dbb64a3551e0899a',
  '2026-10-v6': '08edc978c02b80457d5250b5159514a9f16f8b194dcc354a72312db892b25ad1',
};
for (const [v, h] of Object.entries(ANTES)) {
  const sem = fs.readFileSync(`termos/${v}.html`, 'utf8').replace(new RegExp(META_CSP.source + '\n'), '');
  ok(crypto.createHash('sha256').update(sem, 'utf8').digest('hex') === h, `Termos ${v}: letra por letra o arquivo de antes, só com a linha da regra a mais`);
}
const site = await servirSite(); const browser = await abrirNavegador();
const { page, erros } = await contextoCsp(browser, { viewport: { width: 390, height: 844 } });
for (const [arq, versao] of DOCUMENTOS) {
  await page.goto(site.base + '/' + arq);
  await page.waitForLoadState('networkidle');
  ok(/default-src 'none'/.test(await regraDa(page)) && await provarBloqueio(page), `${arq}: a regra está na página e bloqueia de verdade`);
  ok(versao.test(await page.content()), `${arq}: a versão e a data no topo`);
  await semBloqueio(page, arq);
}
// Os Termos v7 dentro da contratação, preenchidos com os dados de quem contrata (a página de fora preenche o quadro).
await page.goto(site.base + '/contratar.html');
await page.evaluate(() => { const p = (id, v) => { document.getElementById(id).value = v; }; p('nome', 'Maria Teste'); p('cpf', '529.982.247-25'); p('razao', 'Clínica Teste Ltda'); p('cnpj', '11.222.333/0001-81'); mostrar(3); });
await page.frameLocator('#frameTermos').locator('[data-cli="rep"]').filter({ hasText: 'Maria Teste' }).waitFor({ state: 'attached' });
ok(/2026-10-v7\.html$/.test(await page.locator('#frameTermos').getAttribute('src')), 'a contratação mostra os Termos v7 dentro da página, preenchidos');
await semBloqueio(page, 'os Termos v7 dentro da contratação');
ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: os documentos abrem com a regra de segurança, sem nenhum bloqueio.');
process.exit(falhas() ? 1 : 0);
