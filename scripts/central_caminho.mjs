// Central RXSync: o caminho no alto de cada seção (as migalhas, no iPad e no computador) começa pelo grupo do menu em que
// a seção está (rxsync-sistema DEC-191: Operação, Vendas, Análise e Sistema), nunca por um nome de grupo que não existe
// mais ("Marketing", "Administração") nem por outro grupo (pente fino da camada 3, I-08). Seção sem grupo no caminho
// (Hoje, Clientes) passa. Com o servidor SIMULADO (scripts/central_simulado.mjs: nada sai para a internet).
// Uso (precisa do Playwright): node scripts/central_caminho.mjs
import fs from 'node:fs';
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage(); page.setDefaultTimeout(15000);
const erros = []; page.on('pageerror', e => erros.push(String(e)));
await entrar(page, site.base, CHAVES_LIGADAS(), [], {});
// As seções e os grupos, lidos da fonte (central/fonte/03_casca.js, SECOES).
const casca = fs.readFileSync('central/fonte/03_casca.js', 'utf8');
const secoes = [...casca.matchAll(/\{ id: '([a-z]+)', nome: '([^']+)'[^}]*?grupo: '([^']+)'/g)].map(m => ({ id: m[1], nome: m[2], grupo: m[3] }));
ok(secoes.length >= 14, 'as seções do menu (' + secoes.length + ')');
const grupos = new Set(secoes.map(s => s.grupo));
for (const s of secoes) {
  await page.evaluate(id => { location.hash = id; }, s.id);
  await page.waitForFunction(id => (location.hash === '#' + id) && document.querySelector('#topo .migalhas li'), s.id);
  await page.waitForTimeout(150);
  const itens = (await page.locator('#topo .migalhas li').allTextContents()).map(t => t.trim());
  const primeiro = itens.length > 1 ? itens[0] : '';
  ok(!primeiro || primeiro === s.grupo || primeiro === s.nome, `${s.nome}: o caminho começa por "${primeiro || s.nome}"` + (primeiro && primeiro !== s.grupo && primeiro !== s.nome ? ` (no menu, o grupo é "${s.grupo}"${grupos.has(primeiro) ? '' : '; "' + primeiro + '" não é grupo do menu'})` : ''));
}
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await ctx.close(); await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: o caminho de cada seção começa pelo grupo do menu.');
process.exit(falhas ? 1 : 0);
