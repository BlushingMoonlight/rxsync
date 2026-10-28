// Guias do site (guias/, montados pelo scripts/guias_montar.mjs): testa pela tela o guia de exemplo e, como se ele já
// estivesse publicado, a página Guias e o link "Guias" do site. Nada sai para a internet (o site é servido aqui).
//   1. o exemplo em 360, 390, 820 e 1280 px: nada rola para o lado nem fica cortado; no computador (1280), o índice à
//      esquerda, a leitura de até 680 px e o cartão "Teste na sua clínica" à direita; no celular, o índice recolhido no
//      topo e nenhuma barra fixa embaixo;
//   2. o índice do celular e o menu abrem e fecham (sem JavaScript: <details>);
//   3. a tabela rola só dentro da caixa;
//   4. a chamada leva a origem do clique (data-origem="guia-exemplo" e origem=guia_exemplo no endereço do contratar);
//   5. nenhum script roda na página (só os dados estruturados) e a regra de segurança não bloqueia nada;
//   6. prévia publicada: a página Guias (temas e cartões) e o "Guias" no menu e no rodapé da página inicial cabem em
//      360, 1024 e 1280 px.
// Roda no Chrome e, com NAVEGADOR=webkit, no motor do Safari. Uso (precisa do Playwright): node scripts/guias_telas.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { montar } from './guias_montar.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const previa = montar({ previa: true }).arquivos;
async function abrir(largura, rota, { publicada = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 800 }, deviceScaleFactor: 2, isMobile: largura < 700, hasTouch: largura < 1024 });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  if (publicada) await ctx.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html|guias\/(index\.html|[a-z0-9-]+\/(index\.html)?)?)?(\?.*)?$/, r => {
    const p = new URL(r.request().url()).pathname.replace(/^\//, '').replace(/(^|\/)$/, '$1index.html');
    return previa[p] ? r.fulfill({ status: 200, contentType: 'text/html', body: previa[p] }) : r.continue();
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(site.base + rota, { waitUntil: 'load' }); await page.waitForTimeout(250);
  return { ctx, page, erros };
}
// Nada rola para o lado nem passa da borda (o que está numa faixa que rola de lado, como a tabela, não conta).
const larguraOk = page => page.evaluate(() => {
  const W = document.documentElement.clientWidth, cortados = [];
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect(); if (!b.width || !b.height || b.right <= W + 1) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('[hidden], .sr, .pular')) continue;
    const fechado = el.closest('details:not([open])'); if (fechado && !el.closest('summary')) continue;   // o que está dentro de um <details> fechado não aparece
    let p = el.parentElement, dentro = false;
    while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') { dentro = true; break; } p = p.parentElement; }
    if (!dentro) cortados.push(el.tagName.toLowerCase() + '.' + (el.className || '') + ' "' + el.textContent.trim().slice(0, 30) + '"');
  }
  return { rola: document.documentElement.scrollWidth > W + 1, cortados: cortados.slice(0, 3) };
});
const visivel = (page, sel) => page.locator(sel).first().isVisible();

// 1. larguras
for (const w of [360, 390, 820, 1280]) {
  const { ctx, page, erros } = await abrir(w, '/guias/exemplo/');
  const l = await larguraOk(page);
  ok(!l.rola && !l.cortados.length, `${w} px: nada rola para o lado nem fica cortado` + (l.cortados.length ? ' (' + l.cortados.join(' · ') + ')' : ''));
  if (w >= 1200) {
    ok(await visivel(page, '.indice') && await visivel(page, '.lateral') && !(await visivel(page, '.indice-m')), `${w} px: índice à esquerda e "Teste na sua clínica" à direita; sem o índice recolhido`);
    const caixa = await page.locator('.leitura').boundingBox(), ind = await page.locator('.indice').boundingBox(), lat = await page.locator('.lateral').boundingBox();
    ok(caixa.width <= 681 && ind.x < caixa.x && lat.x > caixa.x + caixa.width - 1, `${w} px: a leitura tem até 680 px (${Math.round(caixa.width)}), entre o índice e o cartão`);
  } else {
    ok(await visivel(page, '.indice-m') && !(await visivel(page, '.indice')) && !(await visivel(page, '.lateral')), `${w} px: uma coluna, com o índice recolhido no topo`);
    ok(await page.evaluate(() => ![...document.querySelectorAll('body *')].some(e => { const cs = getComputedStyle(e); return (cs.position === 'fixed' || cs.position === 'sticky') && e.getBoundingClientRect().bottom >= innerHeight - 2 && e.getBoundingClientRect().height > 0; })), `${w} px: nenhuma barra fixa embaixo`);
  }
  const tamanhos = await page.evaluate(() => ({ h1: getComputedStyle(document.querySelector('h1')).fontSize, h2: getComputedStyle(document.querySelector('.leitura h2')).fontSize, corpo: getComputedStyle(document.querySelector('.leitura > p')).fontSize, linha: getComputedStyle(document.querySelector('.leitura > p')).lineHeight, fonteH1: getComputedStyle(document.querySelector('h1')).fontFamily, peso: getComputedStyle(document.querySelector('h1')).fontWeight }));
  const [h1, h2] = w < 768 ? ['30px', '24px'] : ['40px', '28px'];
  ok(tamanhos.h1 === h1 && tamanhos.h2 === h2 && tamanhos.corpo === '17px' && tamanhos.linha === '28px' && /Figtree/.test(tamanhos.fonteH1) && tamanhos.peso === '600', `${w} px: títulos em Figtree 600 de ${h1} e ${h2}, texto de 17 px com linha de 28`);
  ok(!erros.length, `${w} px: sem erro no console (nada bloqueado pela regra de segurança)` + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
}

// 2 a 5. no celular
{
  const { ctx, page } = await abrir(360, '/guias/exemplo/');
  const det = page.locator('details.indice-m');
  ok(!(await det.evaluate(d => d.open)) && !(await page.locator('.indice-m a').first().isVisible()), 'o índice do celular começa fechado');
  await det.locator('summary').click();
  ok(await det.evaluate(d => d.open) && await page.locator('.indice-m a').first().isVisible(), 'o índice do celular abre ao tocar');
  await page.locator('.indice-m a', { hasText: 'Perguntas frequentes' }).click(); await page.waitForTimeout(200);
  ok(await page.evaluate(() => location.hash === '#perguntas'), 'o item do índice leva à seção');
  await det.locator('summary').click();
  ok(!(await det.evaluate(d => d.open)), 'e fecha ao tocar de novo');
  const menu = page.locator('details.menu-m');
  await menu.locator('summary').click();
  ok(await page.locator('.menu-m-lista a', { hasText: 'Preços' }).isVisible(), 'o menu do celular abre (sem JavaScript)');
  const lm = await larguraOk(page);
  ok(!lm.rola && !lm.cortados.length, 'com o menu aberto, nada passa da borda' + (lm.cortados.length ? ' (' + lm.cortados.join(' · ') + ')' : ''));
  await menu.locator('summary').click();
  const tab = await page.locator('.p-tabela').evaluate(t => ({ rola: t.scrollWidth > t.clientWidth + 1, pagina: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 }));
  ok(tab.rola && tab.pagina, 'a tabela rola só dentro da caixa (a página não rola para o lado)');
  const ch = page.locator('.p-chamada a.btn');
  ok(await ch.getAttribute('data-origem') === 'guia-exemplo' && /[?&]origem=guia_exemplo$/.test(await ch.getAttribute('href')), 'a chamada leva a origem (data-origem="guia-exemplo" e origem=guia_exemplo)');
  ok(await page.evaluate(() => [...document.scripts].every(s => s.type === 'application/ld+json')), 'nenhum script na página, só os dados estruturados');
  await ch.click(); await page.waitForURL(/contratar\.html/);
  ok(new URL(page.url()).searchParams.get('origem') === 'guia_exemplo', 'tocar na chamada abre o contratar com a origem');
  await ctx.close();
}

// 6. prévia publicada: a página Guias e o "Guias" no site
for (const w of [360, 1024, 1280]) {
  const { ctx, page, erros } = await abrir(w, '/guias/', { publicada: true });
  const l = await larguraOk(page);
  ok(!l.rola && !l.cortados.length, `página Guias, ${w} px: nada rola para o lado nem fica cortado` + (l.cortados.length ? ' (' + l.cortados.join(' · ') + ')' : ''));
  ok(await page.locator('.temas a', { hasText: 'Atendimento' }).isVisible() && await page.locator('#atendimento .p-cartao').count() === 1, `página Guias, ${w} px: o tema como âncora e o cartão do guia`);
  ok(await page.locator('.p-chamada a.btn').getAttribute('data-origem') === 'guias', `página Guias, ${w} px: a chamada leva a origem "guias"`);
  ok(!erros.length, `página Guias, ${w} px: sem erro no console` + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
  const ini = await abrir(w, '/', { publicada: true });
  const li = await larguraOk(ini.page);
  // No computador, o "Guias" do menu aparece a partir de 1280 px (em 1024, o menu já ocupa a largura toda); no celular, no menu.
  const naNav = await ini.page.locator('.nav a', { hasText: 'Guias' }).isVisible(), noMenuM = await ini.page.locator('#mobile-menu a', { hasText: 'Guias' }).count() === 1;
  const topo = await ini.page.evaluate(() => { const w = document.querySelector('.topo .wrap'); return w.scrollWidth <= w.clientWidth + 1; });
  ok((w >= 1280 ? naNav : !naNav) && noMenuM && await ini.page.locator('.rodape a', { hasText: 'Guias' }).count() === 1 && !li.rola && topo,
    `página inicial, ${w} px: "Guias" ${w >= 1280 ? 'no menu' : 'no menu do celular'} e no rodapé, sem rolar para o lado e sem passar do topo`);
  await ini.ctx.close();
}
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: o molde dos guias, a página Guias e o link do site.');
process.exit(falhas ? 1 : 0);
