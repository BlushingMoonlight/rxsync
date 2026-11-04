// A página do painel (/painel-da-clinica/, rxsync-sistema DEC-199), com tudo o que é de fora bloqueado (nada sai para a
// internet):
//   1. em 390, 820 e 1024 px: nada rola para o lado; o print da abertura carrega; no celular só a Hoje (a Agenda do iPad
//      nem é baixada), do iPad em diante a Agenda ao lado; todos os prints carregam ao rolar;
//   2. a regra de segurança (CSP) não bloqueia nada;
//   3. o chat do assistente de gestão: com "reduzir movimento", aparece inteiro na hora; sem, se escreve sozinho, a
//      confirmação é o toque no botão "Confirmar" (nunca uma mensagem digitada) e termina com o resumo da agenda;
//   4. os botões levam a origem do clique ao contratar (painel_pagina_topo e painel_pagina_final);
//   5. nenhum telefone completo na página, e a página inicial tem o link no rodapé;
//   6. o resumo da manhã do chat diz quantas consultas há e lista exatamente essas;
//   7. o topo e o rodapé do site (DEC-200): o menu do celular abre sem script e tem "O painel da clínica"; o rodapé tem o link,
//      a Navegação, os Termos e a Política; "Preferências de cookies" reabre o aviso (aqui, no anúncio, no contratar e no onboarding);
//   8. o scroll_depth (25, 50, 75 e 90%) vai ao Google Analytics simulado depois do "Aceitar";
//   9. a seção "O painel da clínica" da página inicial (DEC-201): o print só ao chegar, o link e o scroll_depth de lá.
// Uso (precisa do Playwright): node scripts/painel_da_clinica.mjs   (NAVEGADOR=webkit roda no motor do Safari)
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const site = await servirSite(); const browser = await abrirNavegador();
async function abrir(w, reduzir) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 1000 }, reducedMotion: reduzir ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => { try { localStorage.setItem('rx_cookies', 'nao'); } catch (e) { /* nada */ } window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const p = await ctx.newPage(); p.setDefaultTimeout(10000);
  const baixados = []; p.on('requestfinished', q => baixados.push(q.url()));
  const erros = []; p.on('pageerror', e => erros.push(String(e)));
  await p.goto(site.base + '/painel-da-clinica/', { waitUntil: 'load' });
  return { ctx, p, baixados, erros };
}
for (const w of [390, 820, 1024]) {
  const { ctx, p, baixados, erros } = await abrir(w, true);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(larg <= w, `${w} px: nada rola para o lado (${larg} px)`);
  ok(await p.evaluate(() => { const i = document.querySelector('.heroi .cel'); return i.complete && i.naturalWidth > 0; }), `${w} px: o print da Hoje carrega na abertura`);
  const ipadVisivel = await p.locator('.heroi .ipad').isVisible();
  if (w < 820) ok(!ipadVisivel && !baixados.some(u => /agenda-ipad/.test(u)), `${w} px: só a Hoje na abertura (a Agenda do iPad nem é baixada)`);
  else ok(ipadVisivel, `${w} px: a Agenda do iPad aparece ao lado da Hoje`);
  // rola até o fim para os prints que carregam sob demanda
  for (let y = 0; y < 30; y++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(80); }
  await p.waitForTimeout(600);
  const quebrados = await p.evaluate(() => [...document.querySelectorAll('main img')].filter(i => i.offsetParent && !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')));
  ok(!quebrados.length, `${w} px: todos os prints visíveis carregam` + (quebrados.length ? ': ' + quebrados.join(', ') : ''));
  ok(!(await p.evaluate(() => window.__csp)).length, `${w} px: a regra de segurança não bloqueia nada`);
  ok(!erros.length, `${w} px: sem erro de script` + (erros.length ? ': ' + erros.join(' | ') : ''));
  if (w === 390) {
    const visiveis = await p.evaluate(() => [...document.querySelectorAll('#chatGestao .passo')].every(e => getComputedStyle(e).opacity === '1'));
    ok(visiveis, '390 px, "reduzir movimento": a conversa aparece inteira, sem animação');
  }
  await ctx.close();
}
// O chat se escrevendo sozinho
{
  const { ctx, p } = await abrir(390, false);
  const inicio = await p.evaluate(() => ({ ops: [...document.querySelectorAll('#chatGestao .passo')].map(e => getComputedStyle(e).opacity).join(''), vis: document.querySelectorAll('#chatGestao .vis').length, mm: matchMedia('(prefers-reduced-motion: reduce)').matches, anima: document.getElementById('chatGestao').className, topo: Math.round(document.getElementById('chatGestao').getBoundingClientRect().top), y: Math.round(scrollY) }));
  ok(/^0+$/.test(inicio.ops), 'o chat começa vazio enquanto não aparece na tela' + (/^0+$/.test(inicio.ops) ? '' : ' ' + JSON.stringify(inicio)));
  await p.locator('#chatGestao').scrollIntoViewIfNeeded();
  await p.waitForFunction(() => document.querySelector('#chatGestao [data-toque]').classList.contains('tocado'), null, { timeout: 15000 });
  ok(true, 'a confirmação é o toque em "Confirmar"');
  await p.waitForFunction(() => [...document.querySelectorAll('#chatGestao .passo')].every(e => e.classList.contains('vis')), null, { timeout: 20000 });
  const textos = await p.locator('#chatGestao').innerText();
  ok(!/sim, confirmo/i.test(textos), 'nenhuma mensagem digitada de confirmação ("Sim, confirmo")');
  ok(/O que mudou\s*Horário bloqueado: 06\/11 às 08:00/.test(textos) && /Bom dia! Agenda de hoje/.test(textos), 'o cartão "O que mudou" e o resumo da agenda aparecem no fim');
  ok(await p.getByText('Conversa ilustrativa.').isVisible(), 'a legenda "Conversa ilustrativa."');
  // O resumo da manhã diz "N consultas" e lista exatamente N (as mesmas do print da Hoje, da clínica inventada).
  const resumo = textos.slice(textos.indexOf('Bom dia! Agenda de hoje'));
  const n = +((resumo.match(/(\d+) consultas?/) || [])[1] || -1), linhas = (resumo.match(/^\d{2}:\d{2} – /gm) || []).length;
  ok(n === linhas, `o resumo da manhã diz ${n} consultas e lista ${linhas}`);
  // botões e telefones
  const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[data-origem]')].map(a => [a.dataset.origem, a.getAttribute('href')]));
  ok(hrefs.length === 3 && hrefs.every(([o, h]) => h.includes('origem=' + o)) && hrefs.map(x => x[0]).join() === 'painel_pagina_menu,painel_pagina_topo,painel_pagina_final', 'os botões levam a origem do clique (painel_pagina_menu, painel_pagina_topo e painel_pagina_final)');
  const corpo = await p.evaluate(() => document.body.innerText);
  ok(!/\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/.test(corpo), 'nenhum telefone completo no texto da página');
  await ctx.close();
}
{
  const { ctx, p } = await abrir(390, true);
  await p.goto(site.base + '/', { waitUntil: 'load' });
  ok(await p.locator('footer a[href="/painel-da-clinica/"]').count() === 1, 'a página inicial tem o link no rodapé');
  await ctx.close();
}
// 7. topo e rodapé do site
{
  const { ctx, p } = await abrir(390, true);
  await p.locator('details.menu-m > summary').click();
  ok(await p.locator('.menu-m-lista a[href="/painel-da-clinica/"]').isVisible(), 'o menu do celular abre e tem "O painel da clínica"');
  const rod = await p.locator('footer.rodape').innerText();
  ok(/O painel da clínica/.test(rod) && /Termos de Uso/.test(rod) && /Política de Privacidade/.test(rod) && /contato@rxsync\.com\.br/.test(rod) && /Guias/.test(rod), 'o rodapé do site completo, com "O painel da clínica"');
  for (const [url, nome] of [['/painel-da-clinica/', 'página do painel'], ['/assistente-whatsapp-clinica/', 'página do anúncio'], ['/contratar.html?plano=gestao&ciclo=mensal', 'contratar'], ['/onboarding.html', 'onboarding']]) {
    await p.goto(site.base + url, { waitUntil: 'load' });
    ok(!(await p.locator('.rxc-aviso').count()), `${nome}: com a escolha feita, o aviso de cookies não aparece`);
    await p.getByRole('button', { name: 'Preferências de cookies' }).click();
    ok(await p.locator('.rxc-aviso').isVisible(), `${nome}: "Preferências de cookies" mostra o aviso de novo`);
  }
  await ctx.close();
}
// 8. scroll_depth com o Google simulado (o "Aceitar" já dado; o script do Google é bloqueado, só a fila de comandos conta)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('rx_cookies', 'sim'); } catch (e) { /* nada */ } });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(site.base + '/painel-da-clinica/', { waitUntil: 'load' });
  for (let y = 0; y < 40; y++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(60); }
  await p.waitForTimeout(400);
  const marcos = await p.evaluate(() => (window.dataLayer || []).filter(a => a[0] === 'event' && a[1] === 'scroll_depth').map(a => a[2].value));
  ok(marcos.join() === '25,50,75,90', `scroll_depth vai ao Google depois do "Aceitar" (${marcos.join(', ') || 'nenhum'})`);
  await ctx.close();
}
// 9. A seção "O painel da clínica" (#gestao) da página inicial (DEC-201): em 390, 820 e 1280 px, o rótulo, o print da tela
//    Resultados só ao chegar na seção (a abertura não pesa mais), nada rola para o lado, sem o desenho de WhatsApp e sem o
//    "sempre pede"; o link "Ver o painel por dentro" dispara o click_cta; o scroll_depth da página inicial continua igual.
for (const w of [390, 820, 1280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 1000 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('rx_cookies', 'nao'); } catch (e) { /* nada */ } });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const p = await ctx.newPage(); const baixados = []; p.on('requestfinished', q => baixados.push(q.url()));
  await p.goto(site.base + '/', { waitUntil: 'networkidle' });
  ok(!baixados.some(u => u.includes('/assets/painel-da-clinica/')), `página inicial, ${w} px: o print do painel não é baixado na abertura`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth) <= w, `página inicial, ${w} px: nada rola para o lado`);
  await p.locator('#gestao').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  ok(await p.evaluate(() => { const i = document.querySelector('#gestao .print-painel img'); return !!i && i.complete && i.naturalWidth > 0; }), `página inicial, ${w} px: o print da tela Resultados carrega ao chegar na seção`);
  const sec = await p.locator('#gestao').innerText();
  ok(/^O painel da clínica/.test(sec.trim()) && !/sempre pede/.test(sec) && !(await p.locator('#gestao .zap-dono, #gestao .painel-mock').count()), `página inicial, ${w} px: o rótulo "O painel da clínica", sem o desenho de WhatsApp nem o "sempre pede"`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('rx_cookies', 'sim'); } catch (e) { /* nada */ } });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(site.base + '/', { waitUntil: 'load' });
  for (let y = 0; y < 60; y++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(50); }
  await p.waitForTimeout(400);
  const ev = () => p.evaluate(() => (window.dataLayer || []).filter(a => a[0] === 'event').map(a => [a[1], (a[2] || {}).event_label || (a[2] || {}).value]));
  const marcos = (await ev()).filter(e => e[0] === 'scroll_depth').map(e => e[1]);
  ok(marcos.join() === '25%,50%,75%,90%', `página inicial: o scroll_depth continua igual (${marcos.join(', ') || 'nenhum'})`);
  // o clique no link (a navegação é segurada aqui, para ler o que foi ao Google)
  await p.evaluate(() => document.querySelector('#gestao a[href="/painel-da-clinica/"]').addEventListener('click', e => e.preventDefault()));
  await p.locator('#gestao a[href="/painel-da-clinica/"]').click();
  ok((await ev()).some(e => e[0] === 'click_cta' && e[1] === 'painel_ver_por_dentro'), 'página inicial: "Ver o painel por dentro" manda o click_cta (painel_ver_por_dentro)');
  await ctx.close();
}
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
