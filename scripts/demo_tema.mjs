// Demonstração por link (demo/clinica/, DEC-125): o botão do tema diz a verdade com o aparelho em modo escuro (pente fino
// da camada 3, I-12). A entrada, a central, o escopo e o manual ficam claros com o aparelho escuro (o escuro só pela escolha
// da pessoa, comum/ancora.css); antes, o botão dizia "Usar o tema claro" numa página clara, e o primeiro toque não mudava
// nada. Com o n8n SIMULADO aqui (nada sai para a internet; dados inventados):
//   1. aparelho escuro, página clara: o botão diz "Usar o tema escuro";
//   2. um toque deixa a página escura e o botão passa a dizer "Usar o tema claro".
// Uso (precisa do Playwright): node scripts/demo_tema.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demonstracao';
const CODIGO = 'ACDEFGHJKMNPQRTU';
const DADOS = { clinica: 'Clínica Tema Teste', tratamento: 'Dra.', medico: 'Helena Prado', especialidade: 'Endocrinologia', cidade: 'Curitiba', cor: 'azul', escopo: {} };
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: 'dark' });
await ctx.addInitScript(() => { try { localStorage.setItem('demo_aviso_visto', '1'); } catch (e) {} });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, dados: DADOS }) });
});
const erros = [];
for (const pagina of ['', 'escopo/', 'manual/']) {
  const p = await ctx.newPage(); p.setDefaultTimeout(10000); p.on('pageerror', e => erros.push(String(e)));
  await p.goto(site.base + '/demo/clinica/' + pagina + '#' + CODIGO);
  const botao = p.locator('.faixa-demo .botao-tema').first();
  await botao.waitFor();
  const fundo = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const claro = c => /^rgb\((2[3-5]\d), (2[3-5]\d), (2[3-5]\d)\)$/.test(c);
  const nome = pagina || 'entrada';
  ok(claro(await fundo()) && await botao.getAttribute('aria-label') === 'Usar o tema escuro', nome + ': aparelho escuro, página clara, e o botão diz "Usar o tema escuro"');
  await botao.click(); await p.waitForTimeout(400);
  ok(!claro(await fundo()) && await p.locator('.faixa-demo .botao-tema').first().getAttribute('aria-label') === 'Usar o tema claro', nome + ': um toque deixa a página escura e o botão diz "Usar o tema claro"');
  await p.close();
}
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await ctx.close(); await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: o botão do tema da demonstração com o aparelho em modo escuro.');
process.exit(falhas ? 1 : 0);
