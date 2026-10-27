// Páginas públicas num Android de 360 px (o menor celular comum): nenhuma rola para o lado nem corta o que passa da borda. Nasceu do topo da página
// inicial cortado num Samsung (27/10/2026): o botão "Testar 7 dias grátis, sem cartão" não quebrava linha e alargava a
// coluna. Nada sai para a internet (o site é servido aqui e o resto é bloqueado).
// Roda no Chrome e, com NAVEGADOR=webkit, no motor do Safari. Uso (precisa do Playwright): node scripts/site_celular.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
const PAGINAS = ['index.html', 'contratar.html', 'onboarding.html', 'conectar.html', 'teste.html', 'conta-excluir.html', 'privacidade.html',
  ...[1, 2, 3, 4, 5, 6, 7].map(v => `termos/2026-10-v${v}.html`), '404.html',
  'demo/clinica/index.html', 'demo/clinica/escopo/index.html', 'demo/clinica/manual/index.html', 'demo/clinica/central/index.html'];
let falhas = 0;
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
const page = await ctx.newPage();
for (const pg of PAGINAS) {
  await page.goto(site.base + '/' + pg, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  // Também o que passa da borda e fica cortado (a página inicial esconde o que sobra, em vez de rolar): só vale dentro de
  // uma faixa que rola de lado (as abas do FAQ, a tabela dos planos); o que é só enfeite (aria-hidden) ou escondido não conta.
  const { largura, tela, cortados } = await page.evaluate(() => {
    const W = document.documentElement.clientWidth, cortados = [];
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height || b.right <= W + 1 || el.closest('[aria-hidden="true"], [hidden], .isca, .sr')) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.position === 'fixed') continue;
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
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: nenhuma página pública rola para o lado nem fica cortada em 360 px.');
process.exit(falhas ? 1 : 0);
