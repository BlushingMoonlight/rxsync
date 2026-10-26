// Páginas públicas: testa pela tela a identidade (rxsync-sistema DEC-156, entrega 4), com o n8n SIMULADO (nada sai para a
// internet): em cada página, o favicon e o ícone da Tela de Início carregam, o theme-color é branco, a prévia de
// compartilhamento aponta para a imagem do site (1200×630) e nada é bloqueado pela regra de segurança. A 404 também.
// Entrega 5: a Central e a entrada, a central, o escopo e o manual da demonstração (a entrada com a prévia própria).
// Uso (precisa do Playwright): node scripts/site_identidade.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const PAGINAS = ['index.html', 'contratar.html', 'onboarding.html', 'conectar.html', 'teste.html', 'conta-excluir.html', 'privacidade.html', '404.html',
  ...[1, 2, 3, 4, 5, 6, 7].map(v => `termos/2026-10-v${v}.html`)];
const INTERNAS = ['central/', ...['', 'central/', 'escopo/', 'manual/'].map(f => 'demo/clinica/' + f)];
const PREVIA = { 'demo/clinica/': 'https://rxsync.com.br/demo/clinica/comum/previa.png' };
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().method() === 'OPTIONS'
  ? r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
  : r.request().url().includes('sslip.io') ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":false}' }) : r.abort());
await ctx.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { (window.__bloqueios = window.__bloqueios || []).push(e.violatedDirective + ' ' + e.blockedURI); }); });
const og = await (await fetch(site.base + '/assets/og-rxsync.png')).arrayBuffer();
const dv = new DataView(og); ok(dv.getUint32(16) === 1200 && dv.getUint32(20) === 630, 'a imagem da prévia (og-rxsync.png) tem 1200×630');
const dvd = new DataView(await (await fetch(site.base + '/demo/clinica/comum/previa.png')).arrayBuffer()); ok(dvd.getUint32(16) === 1200 && dvd.getUint32(20) === 630, 'a prévia da demonstração (previa.png) tem 1200×630');
const problemas = [];
for (const pg of [...PAGINAS, ...INTERNAS]) {
  const page = await ctx.newPage(); const faltando = [];
  page.on('response', r => { if (r.url().startsWith(site.base) && r.status() >= 400) faltando.push(r.status() + ' ' + r.url().slice(site.base.length)); });
  await page.goto(site.base + '/' + pg); await page.waitForLoadState('networkidle');
  const r = await page.evaluate(async () => {
    const carrega = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i.naturalWidth); i.onerror = () => ok(0); i.src = src; });
    const q = s => document.querySelector(s);
    return { icone: await carrega(q('link[rel="icon"]').href), toque: await carrega(q('link[rel="apple-touch-icon"]').href),
      tema: (q('meta[name="theme-color"]') || {}).content, og: (q('meta[property="og:image"]') || {}).content, bloqueios: window.__bloqueios || [] };
  });
  const fora = [];
  if (r.icone !== 32) fora.push('favicon de 32 px não carregou');
  if (r.toque !== 180) fora.push('ícone da Tela de Início de 180 px não carregou');
  if (r.tema !== '#FFFFFF') fora.push('theme-color ' + r.tema);
  if (PAGINAS.includes(pg) || PREVIA[pg]) { if (r.og !== (PREVIA[pg] || 'https://rxsync.com.br/assets/og-rxsync.png')) fora.push('og:image ' + r.og); }
  if (r.bloqueios.length) fora.push('bloqueado: ' + r.bloqueios.join(', '));
  if (faltando.length) fora.push('faltando: ' + faltando.join(', '));
  if (fora.length) problemas.push(pg + ': ' + fora.join('; '));
  await page.close();
}
ok(!problemas.length, `as ${PAGINAS.length} páginas públicas, a Central e as 4 da demonstração têm favicon, ícone da Tela de Início, theme-color branco e prévia, sem bloqueio` + (problemas.length ? ':\n    ' + problemas.join('\n    ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: a identidade está em todas as páginas públicas.');
process.exit(falhas ? 1 : 0);
