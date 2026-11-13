// Painel: testa pela tela o que ficou da troca (rxsync-sistema DEC-156, entrega 3), com o n8n SIMULADO aqui (nada sai para
// a internet):
//   1. a página do painel de antes saiu (rxsync-sistema DEC-213): o endereço dela dá "não encontrada", e a página 404 do
//      site leva a "Entrar no painel da clínica"; um ?t= no endereço do painel não abre nada nem vai ao servidor;
//   2. a identidade do painel: o manifest (nome RXSync, branco) e os ícones carregam, sem bloqueio da regra de segurança;
//   3. Conta › O que mudou no painel lista onde ficou cada coisa, e a busca acha pelo nome.
// Uso (precisa do Playwright): node scripts/painel_troca.mjs
import fs from 'node:fs';
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

// 1. a página de antes saiu
const velha = '/autoedicao' + '.html';
const r404 = await page.request.get(site.base + velha);
ok(!fs.existsSync('.' + velha) && r404.status() === 404, 'a página do painel de antes não existe mais (404)');
await page.goto(site.base + '/404.html');
ok(await page.getByRole('link', { name: 'Entrar no painel da clínica' }).getAttribute('href') === '/painel/', 'a página "não encontrada" do site leva a "Entrar no painel da clínica"');
faltando.length = 0;
await juntarBloqueios();
await page.goto(site.base + '/painel/?t=' + TOKEN + '#agenda');
await page.locator('#entrada').waitFor({ state: 'visible' });
ok(await page.locator('#app').isHidden() && !/link/i.test(await page.locator('#entMsg').textContent()), 'um ?t= no endereço do painel: a entrada normal, sem aviso');
ok(!chamadas.some(c => c.token || c.acao === 'abrir'), 'o token não vai ao servidor e o painel não abre sem a sessão');
await page.evaluate(() => { try { sessionStorage.setItem('painel_sessao', 'a'.repeat(64)); } catch (e) {} });
await juntarBloqueios();
await page.goto(site.base + '/painel/#conta/dados'); await page.reload(); await page.locator('#app').waitFor({ state: 'visible' });
ok(await page.locator('section[data-tela="conta/dados"]').isVisible() && !chamadas.some(c => c.token), 'com a sessão, o painel abre no # pedido, sem mandar token');

// 2. identidade
const id = await page.evaluate(async () => {
  const mf = document.querySelector('link[rel="manifest"]').href, m = await (await fetch(mf)).json();
  const carrega = src => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); i.src = src; });
  return { m, tema: document.querySelector('meta[name="theme-color"]').content, icone: await carrega(document.querySelector('link[rel="icon"]').href),
    toque: await carrega(document.querySelector('link[rel="apple-touch-icon"]').href), mf512: await carrega(m.icons.find(i => i.sizes === '512x512').src) };
});
ok(id.m.name === 'RXSync' && id.m.theme_color === '#FFFFFF' && id.m.background_color === '#FFFFFF' && id.tema === '#FFFFFF', 'manifest próprio: "RXSync", branco, e theme-color branco');
ok(id.icone === 32 && id.toque === 180 && id.mf512 === 512, 'os ícones carregam nos tamanhos certos (32, 180 e 512 px)');

// 3. O que mudou
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
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: a página de antes saiu, o painel só abre pela sessão e tem a identidade dele.');
process.exit(falhas ? 1 : 0);
