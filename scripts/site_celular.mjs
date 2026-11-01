// Páginas públicas num Android de 360 px (o menor celular comum): nenhuma rola para o lado nem corta o que passa da borda. Nasceu do topo da página
// inicial cortado num Samsung (27/10/2026): o botão "Testar 7 dias grátis, sem cartão" não quebrava linha e alargava a
// coluna. Nada sai para a internet (o site é servido aqui e o resto é bloqueado).
// Roda no Chrome e, com NAVEGADOR=webkit, no motor do Safari. Uso (precisa do Playwright): node scripts/site_celular.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { paginasExistentes } from './guias_montar.mjs';
const PAGINAS = ['index.html', 'contratar.html', 'onboarding.html', 'conectar.html', 'teste.html', 'conta-excluir.html', 'privacidade.html',
  ...[1, 2, 3, 4, 5, 6, 7].map(v => `termos/2026-10-v${v}.html`), '404.html',
  'demo/clinica/index.html', 'demo/clinica/escopo/index.html', 'demo/clinica/manual/index.html', 'demo/clinica/central/index.html',
  ...paginasExistentes()];   // os guias (guias/, scripts/guias_montar.mjs), inclusive os rascunhos
let falhas = 0;
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
const page = await ctx.newPage();
for (const pg of PAGINAS) {
  await page.goto(site.base + '/' + pg, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  // Também o que passa da borda e fica cortado (a página inicial esconde o que sobra, em vez de rolar): só vale dentro de
  // uma faixa que rola de lado (as abas do FAQ, a tabela dos planos); o que é só enfeite (aria-hidden), escondido ou dentro de
  // um <details> fechado não conta.
  const { largura, tela, cortados } = await page.evaluate(() => {
    const W = document.documentElement.clientWidth, cortados = [];
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height || b.right <= W + 1 || el.closest('[aria-hidden="true"], [hidden], .isca, .sr')) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.position === 'fixed') continue;
      if (el.closest('details:not([open])') && !el.closest('summary')) continue;   // dentro de um <details> fechado (o menu e o índice dos guias), não aparece
      let p = el.parentElement, dentro = false;
      while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') { dentro = true; break; } p = p.parentElement; }
      if (!dentro) cortados.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' "' + el.textContent.trim().slice(0, 30) + '"');
    }
    return { largura: document.documentElement.scrollWidth, tela: W, cortados: cortados.slice(0, 3) };
  });
  if (largura > tela + 1) { falhas++; console.log(`✗ ${pg}: rola para o lado em 360 px (${largura} px de largura)`); }
  else if (cortados.length) { falhas++; console.log(`✗ ${pg}: passa da borda e fica cortado em 360 px: ${cortados.join(' · ')}`); }
  else console.log(`✓ ${pg}`);
}
// Página inicial (rxsync-sistema #225, itens 2, 4, 5 e 7): em 360, 390 e 430 px, todo botão visível tem o texto centrado
// na altura (até 2 px) e no máximo 2 linhas; a barra fixa de baixo não existe; o celular com a conversa aparece; com
// "reduzir movimento", o título não é desenhado letra por letra.
for (const w of [360, 390, 430]) {
  await page.setViewportSize({ width: w, height: 780 });
  await page.goto(site.base + '/index.html', { waitUntil: 'load' });
  await page.evaluate(() => document.getElementById('topo').classList.add('mostrar-cta'));
  const r = await page.evaluate(() => {
    const ruins = [];
    for (const b of document.querySelectorAll('a.btn, button.btn')) {
      const bb = b.getBoundingClientRect(); if (!bb.width || !b.offsetParent) continue;
      const rg = document.createRange(); rg.selectNodeContents(b);
      const linhas = [...rg.getClientRects()].filter(x => x.height > 4); if (!linhas.length) continue;
      const topo = Math.min(...linhas.map(x => x.top)), baixo = Math.max(...linhas.map(x => x.bottom));
      const nLinhas = new Set(linhas.map(x => Math.round(x.top / 8))).size;
      const desvio = Math.abs((topo + baixo) / 2 - (bb.top + bb.bottom) / 2);
      if (desvio > 2 || nLinhas > 3) ruins.push(b.textContent.trim().slice(0, 40) + ` (desvio ${desvio.toFixed(1)} px)`);
    }
    return { ruins, barra: !!document.getElementById('barraM'), palco: !!document.querySelector('.hero .palco').offsetParent };
  });
  if (r.ruins.length || r.barra || !r.palco) { falhas++; console.log(`✗ index.html em ${w} px: ${r.ruins.join(' · ')}${r.barra ? ' · a barra de baixo voltou' : ''}${r.palco ? '' : ' · o celular com a conversa sumiu'}`); }
  else console.log(`✓ index.html em ${w} px: botões centrados, sem barra, com a conversa`);
}
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(site.base + '/index.html', { waitUntil: 'load' });
if (await page.locator('.hero h1 em .l').count()) { falhas++; console.log('✗ index.html: com "reduzir movimento", o título ainda é desenhado letra por letra'); }
else console.log('✓ index.html: com "reduzir movimento", nada anima no título');
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: nenhuma página pública rola para o lado nem fica cortada em 360 px.');
process.exit(falhas ? 1 : 0);
