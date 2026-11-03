// A página do painel (/painel-da-clinica/, rxsync-sistema DEC-199), com tudo o que é de fora bloqueado (nada sai para a
// internet):
//   1. em 390, 820 e 1024 px: nada rola para o lado; o print da abertura carrega; no celular só a Hoje (a Agenda do iPad
//      nem é baixada), do iPad em diante a Agenda ao lado; todos os prints carregam ao rolar;
//   2. a regra de segurança (CSP) não bloqueia nada;
//   3. o chat do assistente de gestão: com "reduzir movimento", aparece inteiro na hora; sem, se escreve sozinho, a
//      confirmação é o toque no botão "Confirmar" (nunca uma mensagem digitada) e termina com o resumo da agenda;
//   4. os botões levam a origem do clique ao contratar (painel_pagina_topo e painel_pagina_final);
//   5. nenhum telefone completo na página, e a página inicial tem o link no rodapé;
//   6. o resumo da manhã do chat diz quantas consultas há e lista exatamente essas.
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
  ok(await p.evaluate(() => [...document.querySelectorAll('#chatGestao .passo')].every(e => getComputedStyle(e).opacity === '0')), 'o chat começa vazio enquanto não aparece na tela');
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
  ok(hrefs.length === 2 && hrefs.every(([o, h]) => h.includes('origem=' + o)) && hrefs.map(x => x[0]).join() === 'painel_pagina_topo,painel_pagina_final', 'os botões levam a origem do clique (painel_pagina_topo e painel_pagina_final)');
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
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
