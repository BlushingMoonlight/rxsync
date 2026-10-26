// Painel: testa pela tela a troca (rxsync-sistema DEC-156, entrega 3), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. o painel antigo (autoedicao.html) leva para /painel/ com o mesmo ?t= e o mesmo #, e os dois # que mudaram de nome
//      (agenda/integracao e pacientes/editar) chegam ao lugar novo;
//   2. o link antigo com ?t= abre o painel novo pelo token, com a faixa "Crie sua senha";
//   3. a identidade do painel: o manifest (nome RXSync, branco) e os ícones carregam, sem bloqueio da regra de segurança;
//   4. Conta › O que mudou no painel lista onde ficou cada coisa, e a busca acha pelo nome antigo.
// Uso (precisa do Playwright): node scripts/painel_troca.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const TOKEN = 'PnlAabcdefghijkmnopqrstuvwxy';
const chamadas = [];
function responder(caminho, h, b) {
  chamadas.push({ caminho, acao: b.acao, token: b.token || '' });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Troca', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: 'Essencial' }, recursos: {}, limite_catalogo: 500 };
  if (caminho === 'painel-entrada') return { ok: true, pendente: false };
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const bloqueios = [], faltando = [], erros = [];
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url().slice(N8N.length), q.headers(), b)) });
});
const page = await ctx.newPage(); page.setDefaultTimeout(15000);
page.on('pageerror', e => erros.push(String(e)));
await ctx.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { (window.__bloqueios = window.__bloqueios || []).push(e.violatedDirective + ' ' + e.blockedURI); }); });
const juntarBloqueios = async () => { bloqueios.push(...(await page.evaluate(() => window.__bloqueios || []))); };
page.on('response', r => { if (r.url().startsWith(site.base) && r.status() >= 400) faltando.push(r.status() + ' ' + r.url().slice(site.base.length)); });

// 1 e 2. passagem do painel antigo
const passa = async (de, para) => { if (page.url().startsWith(site.base)) await juntarBloqueios(); await page.goto(site.base + de); await page.waitForURL(u => u.pathname === '/painel/'); await page.locator('#app').waitFor({ state: 'visible' }); const u = new URL(page.url()); return u.pathname + u.search + u.hash === para; };
ok(await passa('/autoedicao.html?t=' + TOKEN + '#agenda/integracao', '/painel/?t=' + TOKEN + '#agenda/horarios/integracao'), 'autoedicao.html?t=…#agenda/integracao leva a /painel/?t=…#agenda/horarios/integracao');
ok(chamadas.some(c => c.acao === 'abrir' && c.token === TOKEN) && await page.locator('#faixaSenha').isVisible(), 'o link antigo abre o painel novo pelo token, com a faixa "Crie sua senha"');
ok(await page.locator('section[data-tela="agenda/horarios/integracao"]').isVisible(), 'e cai em Agenda › Horários › Integração e planilhas');
ok(await passa('/autoedicao.html?t=' + TOKEN + '#pacientes/editar', '/painel/?t=' + TOKEN + '#pacientes'), '#pacientes/editar leva a #pacientes');
ok(await passa('/autoedicao.html?t=' + TOKEN + '#conta/dados', '/painel/?t=' + TOKEN + '#conta/dados'), 'os outros # continuam iguais (#conta/dados)');

// 3. identidade
const id = await page.evaluate(async () => {
  const mf = document.querySelector('link[rel="manifest"]').href, m = await (await fetch(mf)).json();
  const carrega = src => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); i.src = src; });
  return { m, tema: document.querySelector('meta[name="theme-color"]').content, icone: await carrega(document.querySelector('link[rel="icon"]').href),
    toque: await carrega(document.querySelector('link[rel="apple-touch-icon"]').href), mf512: await carrega(m.icons.find(i => i.sizes === '512x512').src) };
});
ok(id.m.name === 'RXSync' && id.m.theme_color === '#FFFFFF' && id.m.background_color === '#FFFFFF' && id.tema === '#FFFFFF', 'manifest próprio: "RXSync", branco, e theme-color branco');
ok(id.icone === 32 && id.toque === 180 && id.mf512 === 512, 'os ícones carregam nos tamanhos certos (32, 180 e 512 px)');

// 4. O que mudou
await page.evaluate(() => { location.hash = 'conta/mudou'; });
await page.locator('#mudouLista').waitFor();
ok(await page.locator('#mudouLista').getByText('Antes: Agenda › Integração').isVisible() && await page.locator('#mudouLista .linha').count() >= 10, 'Conta › O que mudou no painel: onde ficou cada coisa');
await page.locator('#mudouLista .linha', { hasText: 'Antes: Funções da assistente' }).click();
await page.locator('section[data-tela="assistente/funcoes"]').waitFor({ state: 'visible' });
ok(await page.evaluate(() => location.hash) === '#assistente/funcoes', 'cada linha abre o lugar novo (Funções da assistente → O que ela faz)');
await page.click('#btnBusca'); await page.fill('#buscaTexto', 'mudou');
ok(await page.locator('.busca-res').getByText('O que mudou no painel').isVisible(), 'a busca acha "O que mudou no painel"');

await juntarBloqueios();
ok(!bloqueios.length, 'nenhum bloqueio da regra de segurança' + (bloqueios.length ? ': ' + bloqueios.join(' | ') : ''));
ok(!faltando.length, 'nenhum arquivo do site faltando' + (faltando.length ? ': ' + faltando.join(', ') : ''));
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: a troca leva os links antigos ao painel novo, com a identidade do painel.');
process.exit(falhas ? 1 : 0);
