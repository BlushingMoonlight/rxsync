// contratar.html (rxsync-sistema #225, item 15): depois do "Pagar agora", a página continua perguntando ao n8n SIMULADO
// e, quando o pagamento é confirmado, mostra "Pagamento confirmado" e o botão "Configurar a assistente agora", com o link
// do formulário que o servidor devolveu (só com a chave de uso único da aba). Sem o link (outra aba), diz que o link chegou
// no e-mail. Nada sai para a internet.
// Uso (precisa do Playwright): node scripts/contratar_pagamento.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) falhas++; return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const site = await servirSite(); const browser = await abrirNavegador();
for (const comChave of [true, false]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pedidos = []; let n = 0;
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const u = r.request().url(); if (!u.startsWith(N8N)) return r.abort();
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    const b = JSON.parse(r.request().postData() || '{}'); pedidos.push({ caminho: u.slice(N8N.length), b });
    const resp = u.endsWith('link-pagamento') ? (++n < 3 ? { pronto: false, pago: true, link_onboarding: b.chave ? 'https://rxsync.com.br/onboarding.html?t=AbCdEfGh1234567890' : '' } : {}) : { ok: true };
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(resp) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  await page.goto(site.base + '/contratar.html?plano=gestao&ciclo=mensal');
  await page.evaluate(k => { if (k) sessionStorage.setItem('rx_contratacao_chave', 'a'.repeat(48)); document.getElementById('form').classList.add('hidden'); document.getElementById('sucesso').classList.remove('hidden'); esperarPagamento('RX-1', 'ana@exemplo.test', k ? 'a'.repeat(48) : ''); }, comChave);
  await page.getByRole('heading', { name: 'Pagamento confirmado' }).waitFor();
  const link = page.locator('#linkOnboarding');
  if (comChave) ok(await link.isVisible() && (await link.getAttribute('href')) === 'https://rxsync.com.br/onboarding.html?t=AbCdEfGh1234567890' && pedidos.some(p => p.b.chave === 'a'.repeat(48)), 'com a chave da aba: "Pagamento confirmado" e "Configurar a assistente agora" com o link do formulário');
  else ok(!(await link.isVisible()) && /chegou no seu e-mail/.test(await page.locator('#sucessoTexto').textContent()), 'sem a chave: "Pagamento confirmado" e o aviso de que o link chegou no e-mail');
  await ctx.close();
}
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: "Pagamento confirmado" e o formulário ali mesmo.');
process.exit(falhas ? 1 : 0);
