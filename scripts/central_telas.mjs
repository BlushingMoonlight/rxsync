// Central RXSync: fotos de TODAS as telas nos 4 tamanhos (celular, iPad em pé, iPad deitado, computador) e nos 2 temas
// (claro e escuro), com o servidor SIMULADO (scripts/central_simulado.mjs: nada sai para a internet, dados inventados).
// Confere em cada tela: nenhum ícone maior que 48 px, nenhum texto espremido, nenhuma rolagem para o lado, botões e
// campos com pelo menos 44 px, nenhum "null" ou "undefined" escrito na tela (links do caminho, 32 px), contraste do texto (4,5:1; texto grande 3:1) e nenhum erro no console.
// Uso (precisa do Playwright): node scripts/central_telas.mjs [pasta das fotos]   ·   sem fotos: node scripts/central_telas.mjs - sem-fotos
import fs from 'node:fs';
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS } from './central_simulado.mjs';
const OUT = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : 'fotos-central', FOTOS = process.argv[3] !== 'sem-fotos';
if (FOTOS) fs.mkdirSync(OUT, { recursive: true });
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } return c; };
const FICHA = 'Clínica Sorriso Odontologia Integrada';
const TELAS = [['hoje', 'Hoje'], ['clientes', 'Clientes'], ['clientes/CLI-001', FICHA], ['clientes/CLI-001/cobranca', FICHA], ['clientes/CLI-001/recursos', FICHA],
  ['clientes/CLI-001/cadastro', FICHA, 'protegidos'], ['clientes/CLI-001/historico', FICHA], ['financeiro', 'Financeiro'], ['sistema', 'Saúde do sistema'], ['crescimento', 'Crescimento'],
  ['crescimento/90', 'Crescimento'], ['uso', 'Uso e limites'], ['avisos', 'Avisos'], ['agregados', 'Agregados de pacientes'], ['seguranca', 'Segurança'], ['seguranca/registro', 'Segurança'],
  ['api', 'API (Enterprise)'], ['ajustes', 'Ajustes da Central'], ['mais', 'Mais'], ['clientes/CLI-001/cobranca', FICHA, 'janela']];
const APARELHOS = [['celular', { width: 390, height: 844 }, true], ['ipad_em_pe', { width: 820, height: 1180 }, true], ['ipad_deitado', { width: 1180, height: 820 }, true], ['computador', { width: 1440, height: 900 }, false]];
const TEMAS = ['claro', 'escuro'];

// Medidas feitas dentro da página.
function medir() {
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden]'); };
  const raiz = document.querySelector('#camada .janela') || document;
  const grandes = [...document.querySelectorAll('svg')].filter(vis).map(s => { const r = s.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), c: s.getAttribute('class') }; })
    .filter(x => !/grafico/.test(x.c || '') && (x.w > 48 || x.h > 48));
  // Texto espremido: um bloco de texto estreito (menos de 120 px) que ficou com mais de 3 linhas.
  const espremidos = [...raiz.querySelectorAll('li > *, .cresce, dd, dt, .btn, .etq, h1, h2, h3')].filter(vis).filter(e => {
    const r = e.getBoundingClientRect(), lh = parseFloat(getComputedStyle(e).lineHeight) || 20; return e.textContent.trim().length > 3 && r.width < 120 && r.height > lh * 3.2 && !e.querySelector('svg, table, input'); })
    .map(e => e.textContent.trim().slice(0, 30) + ' (' + Math.round(e.getBoundingClientRect().width) + ' px)');
  // Alvos de toque: 44 px (botões, campos, interruptores); 32 px nos links do caminho; links dentro do texto ficam de fora.
  const pequenos = [...raiz.querySelectorAll('button, input:not([type=hidden]), select, textarea, a[href], [role=switch]')].filter(vis).filter(e => {
    if (e.closest('#camada') === null && document.querySelector('#camada .janela')) return false;
    const b = e.getBoundingClientRect(), extra = e.matches('.toggle') && getComputedStyle(e, '::before').content !== 'none' ? 12 : 0; // o interruptor tem área de toque em volta (::before)
    const r = { width: b.width + extra, height: b.height + extra };
    if (e.matches('a') && e.closest('p, .aviso, .ajuda, .t2')) return false;
    const min = e.closest('.migalhas') ? 32 : 44;
    return r.height < min - 0.5 || (e.matches('button, [role=switch]') && r.width < min - 0.5);
  }).map(e => (e.getAttribute('aria-label') || e.textContent.trim() || e.tagName).slice(0, 24) + ` (${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)})`);
  // Contraste: cada texto visível contra o fundo de verdade (sobe até achar uma cor de fundo sólida).
  // A cor vem como rgb(0-255) ou, quando a CSS usa color-mix, como color(srgb 0-1).
  const cor = s => { const m = (s.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number), k = s.startsWith('color(') ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m[3] == null ? 1 : m[3] }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const fundo = e => { const camadas = []; for (let x = e; x; x = x.parentElement) { const c = cor(getComputedStyle(x).backgroundColor); if (c.a > 0) { camadas.push(c); if (c.a >= 1) break; } }
    let b = { r: 255, g: 255, b: 255 }; for (const c of camadas.reverse()) b = { r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a) }; return b; };
  const baixos = [];
  for (const e of raiz.querySelectorAll('#app *, #camada *, #entrada *')) {
    if (!vis(e) || e.closest('svg') || e.closest('.esq')) continue;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(e); if (e.disabled || e.closest('[disabled]')) continue;
    const t = cor(cs.color), f = fundo(e); const tt = { r: t.r * t.a + f.r * (1 - t.a), g: t.g * t.a + f.g * (1 - t.a), b: t.b * t.a + f.b * (1 - t.a) };
    const L1 = lum(tt), L2 = lum(f), razao = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    if (razao < (grande ? 3 : 4.5)) baixos.push(`${e.textContent.trim().slice(0, 24)} ${razao.toFixed(2)}`);
  }
  const lixo = (document.body.innerText.match(/\b(null|undefined|NaN|\[object Object\])\b/g) || []);
  return { lixo, grandes, espremidos, pequenos: [...new Set(pequenos)].slice(0, 8), baixos: [...new Set(baixos)].slice(0, 8), rolagem: document.documentElement.scrollWidth > window.innerWidth + 1 };
}

const site = await servirSite(); const browser = await abrirNavegador();
let fotos = 0;
for (const tema of TEMAS) for (const [nomeAp, vp, toque] of APARELHOS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: nomeAp === 'celular', hasTouch: toque, colorScheme: tema === 'claro' ? 'light' : 'dark' });
  const page = await ctx.newPage(); const erros = [];
  page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  const pre = `${nomeAp}_${tema}`;
  await entrar(page, site.base, CHAVES_LIGADAS(), []);
  let n = 0;
  for (const [rota, titulo, extra] of TELAS) {
    n++;
    if (rota === 'mais' && nomeAp !== 'celular') continue;
    await page.evaluate(() => { const j = document.querySelector('#camada .janela'); if (j) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    await page.evaluate(r => { location.hash = r; }, rota);
    await page.waitForFunction(t => document.title.startsWith(t) && !document.querySelector('#conteudo .esq'), titulo, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(200);
    if (extra === 'protegidos') { await page.getByRole('button', { name: 'Mostrar os dados protegidos' }).click(); await page.waitForSelector('[data-sensivel]'); }
    if (extra === 'janela') { await page.getByRole('button', { name: 'Trocar o plano' }).first().click(); await page.waitForSelector('#camada .janela'); await page.waitForTimeout(250); }
    await page.evaluate(() => document.querySelectorAll('#conteudo details').forEach(d => { d.open = true; }));
    const med = await page.evaluate(medir);
    const titOk = await page.evaluate(t => document.title.startsWith(t), titulo);
    const onde = `${pre} ${rota}${extra ? ' (' + extra + ')' : ''}`;
    ok(titOk, `${onde}: a tela não abriu (título "${await page.title()}")`);
    ok(!med.grandes.length, `${onde}: ícone maior que 48 px: ${JSON.stringify(med.grandes)}`);
    ok(!med.espremidos.length, `${onde}: texto espremido: ${JSON.stringify(med.espremidos)}`);
    ok(!med.lixo.length, `${onde}: texto quebrado na tela: ${med.lixo.join(', ')}`);
    ok(!med.rolagem, `${onde}: rolagem para o lado`);
    ok(!med.pequenos.length, `${onde}: alvo de toque pequeno: ${JSON.stringify(med.pequenos)}`);
    ok(!med.baixos.length, `${onde}: contraste baixo: ${JSON.stringify(med.baixos)}`);
    if (FOTOS) {
      // Foto da página inteira: a janela do navegador cresce até a altura da página (assim a barra de baixo e o menu
      // lateral ficam no lugar certo, em vez de aparecerem no meio da foto). A janela de confirmação sai do tamanho da tela.
      const alto = extra === 'janela' ? vp.height : Math.max(vp.height, await page.evaluate(() => document.documentElement.scrollHeight));
      if (alto !== vp.height) { await page.setViewportSize({ width: vp.width, height: alto }); await page.waitForTimeout(150); }
      await page.screenshot({ path: `${OUT}/${pre}_${String(n).padStart(2, '0')}_${rota.replace(/\//g, '-')}${extra ? '_' + extra : ''}.png` }); fotos++;
      if (alto !== vp.height) await page.setViewportSize(vp);
    }
  }
  ok(!erros.length, `${pre}: erro no console: ${erros.join(' | ')}`);
  await ctx.close();
}
await browser.close(); site.fechar();
console.log(`${fotos} fotos. ` + (falhas ? falhas + ' falha(s).' : 'Tudo certo: ícones até 48 px, nada espremido, sem rolagem para o lado, alvos de toque e contraste.'));
process.exit(falhas ? 1 : 0);
