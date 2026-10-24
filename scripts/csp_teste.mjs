// O que os testes da regra de segurança (CSP) de cada página fazem igual: abrir a página com o n8n SIMULADO (nada sai
// para a internet; dados inventados), contar os bloqueios da regra e provar que ela bloqueia de verdade.
// Quem usa: os scripts/*_csp.mjs. Não é um teste (fica de fora do scripts/testes_tela.mjs).
import crypto from 'node:crypto';
export const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
// Chat simulado: faz o que o chat de verdade faz na página (carrega o script, abre a janela da conversa, põe um <style>
// e um style= no botão) e avisa que está pronto. O chat de verdade só se confere no aparelho.
const SDK_SIMULADO = `window.chatwootSDK = { run: function (o) {
  var st = document.createElement('style'); st.innerHTML = '.woot-widget-holder{position:fixed;bottom:0;right:0}'; document.body.appendChild(st);
  var f = document.createElement('iframe'); f.src = o.baseUrl + '/widget?website_token=' + o.websiteToken; f.className = 'woot-widget-holder'; document.body.appendChild(f);
  var b = document.createElement('button'); b.id = 'chat-simulado'; b.setAttribute('style', 'height: 64px !important'); document.body.appendChild(b);
  window.$chatwoot = { aberto: false, toggle: function () { this.aberto = true; } };
  window.dispatchEvent(new Event('chatwoot:ready'));
} };`;
// Google Analytics simulado: o script do Google manda a visita (fetch e imagem), como o de verdade.
const GTAG_SIMULADO = `window.__gaCarregou = true;
fetch('https://region1.google-analytics.com/g/collect?v=2', { method: 'POST', mode: 'no-cors' }).catch(function () {});
new Image().src = 'https://www.google-analytics.com/collect?v=1';`;

// Abre um contexto que registra cada bloqueio da regra (o navegador dispara "securitypolicyviolation") e responde o n8n
// com responder(caminho, corpo). outras(url) pode responder outros endereços simulados ({ status, contentType, body }).
export async function contextoCsp(browser, { responder = () => ({ ok: true }), outras = () => null, antes, viewport } = {}) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1024, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript(() => { window.__bloqueios = []; document.addEventListener('securitypolicyviolation', e => window.__bloqueios.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline'))); });
  if (antes) await ctx.addInitScript(antes.fn, antes.arg);
  const chamadas = [];
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request(), url = q.url();
    if (url.startsWith(N8N)) {
      if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
      chamadas.push({ caminho: url.slice(N8N.length), corpo: b });
      const resp = responder(url.slice(N8N.length), b);
      const status = resp && resp.__status ? resp.__status : 200;
      return r.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(resp) });
    }
    const outra = outras(url, q);
    if (outra) return r.fulfill({ headers: { 'access-control-allow-origin': '*' }, ...outra });
    if (url === 'https://app.rxsync.com.br/packs/js/sdk.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: SDK_SIMULADO });
    if (url.startsWith('https://app.rxsync.com.br/widget')) return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>chat</title><p>chat simulado</p>' });
    if (url.startsWith('https://www.googletagmanager.com/gtag/js')) return r.fulfill({ status: 200, contentType: 'text/javascript', body: GTAG_SIMULADO });
    if (/^https:\/\/([a-z0-9-]+\.)*google-analytics\.com\//.test(url)) return r.fulfill({ status: 204, body: '' });
    return r.abort();
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  const erros = []; page.on('pageerror', e => erros.push(String(e)));
  // O aviso do script da prova (provarBloqueio) não conta: ele é bloqueado de propósito.
  page.on('console', m => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text()) && !m.text().includes(PROVA_RESUMO)) erros.push(m.text()); });
  return { ctx, page, erros, chamadas };
}
export const bloqueios = page => page.evaluate(() => window.__bloqueios.splice(0));
export const regraDa = page => page.evaluate(() => (document.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || '');
const PROVA = 'window.__rodou = true';
const PROVA_RESUMO = crypto.createHash('sha256').update(PROVA, 'utf8').digest('base64');
// Prova que a regra bloqueia de verdade: um script escrito na página depois de aberta é recusado (e não roda).
export async function provarBloqueio(page) {
  await page.evaluate(t => { const s = document.createElement('script'); s.textContent = t; document.body.appendChild(s); }, PROVA);
  await page.waitForFunction(() => window.__bloqueios.some(b => /^script-src/.test(b)));
  const rodou = await page.evaluate(() => !!window.__rodou);
  await bloqueios(page);
  return !rodou;
}
// Um conferidor simples: ok(condição, mensagem) e o resumo no fim.
export function conferidor() {
  let falhas = 0;
  const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
  const semBloqueio = async (page, m) => { const b = await bloqueios(page); return ok(!b.length, m + ': nenhum bloqueio' + (b.length ? ': ' + b.join(' | ') : '')); };
  return { ok, semBloqueio, falhas: () => falhas };
}
