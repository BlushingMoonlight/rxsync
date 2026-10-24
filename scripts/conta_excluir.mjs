// Página conta-excluir.html (rxsync-sistema DEC-114), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. abrir com o link mostra o que vai acontecer e NÃO confirma (só conta_exclusao_ver); o link sai do endereço;
//   2. "Confirmar o cancelamento" manda conta_exclusao_confirmar com o mesmo link e mostra o resultado;
//   3. link usado (ok: false) mostra a mensagem do servidor; link incompleto nem chama o servidor;
//   4. nada de fora além do n8n, nada guardado no navegador;
//   5. a regra de segurança (CSP) está ligada, bloqueia de verdade e não bloqueia nada do uso normal.
// Uso (precisa do Playwright): node scripts/conta_excluir.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { bloqueios, regraDa, provarBloqueio } from './csp_teste.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const LINK = 'ab'.repeat(32); const chamadas = []; const fora = [];
const estado = { usado: false };
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { window.__bloqueios = []; document.addEventListener('securitypolicyviolation', e => window.__bloqueios.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline'))); });
const comBloqueio = [];
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) { fora.push(q.url()); return r.abort(); }
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  const b = JSON.parse(q.postData() || '{}'); chamadas.push(b);
  let resp;
  if (estado.usado) resp = { ok: false, usado: true, mensagem: 'Este link já foi usado.' };
  else if (b.acao === 'conta_exclusao_ver') resp = { ok: true, clinica: 'Clínica Painel A', caso: 'mensal', texto: 'Aviso de 30 dias (cláusula 18.1).', fim: '19/11/2026', apagar: '04/12/2026', vale_ate: '21/10/2026 às 10:57' };
  else resp = { ok: true, caso: 'mensal', resultado: 'cancelar_em', mensagem: 'Cancelamento agendado para 19/11/2026. Enviamos a confirmação por e-mail.' };
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(resp) });
});
const erros = [];
let p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e)));
await p.goto(site.base + '/conta-excluir.html#' + LINK);
await p.getByText('Aviso de 30 dias').waitFor();
ok(chamadas.length === 1 && chamadas[0].acao === 'conta_exclusao_ver' && chamadas[0].dados.link === LINK, 'abrir: só conta_exclusao_ver, com o link');
ok(!p.url().includes(LINK), 'o link sai do endereço');
ok(await p.getByText('19/11/2026').isVisible() && await p.getByText('04/12/2026').isVisible(), 'mostra o fim do contrato e quando os dados são apagados');
await p.getByRole('button', { name: 'Confirmar o cancelamento' }).click();
await p.getByText('Cancelamento agendado para 19/11/2026').waitFor();
ok(chamadas.length === 2 && chamadas[1].acao === 'conta_exclusao_confirmar' && chamadas[1].dados.link === LINK, 'confirmar: conta_exclusao_confirmar com o mesmo link');
comBloqueio.push(...await bloqueios(p));
ok(/default-src 'none'/.test(await regraDa(p)) && await provarBloqueio(p), 'a regra de segurança está na página e bloqueia de verdade (um script escrito depois não roda)');
ok(await p.evaluate(() => localStorage.length + sessionStorage.length + document.cookie.length) === 0, 'nada guardado no navegador');
estado.usado = true;
p = await ctx.newPage(); p.on('pageerror', e => erros.push(String(e)));
await p.goto(site.base + '/conta-excluir.html#' + LINK);
ok(await p.getByText('Este link já foi usado.').isVisible(), 'link usado: a mensagem do servidor');
comBloqueio.push(...await bloqueios(p));
const antes = chamadas.length;
p = await ctx.newPage(); p.on('pageerror', e => erros.push(String(e)));
await p.goto(site.base + '/conta-excluir.html#123');
ok(await p.getByText('Este link não está completo').isVisible() && chamadas.length === antes, 'link incompleto: avisa sem chamar o servidor');
comBloqueio.push(...await bloqueios(p));
ok(!comBloqueio.length, 'os 3 casos com a regra ligada: nenhum bloqueio' + (comBloqueio.length ? ': ' + comBloqueio.join(' | ') : ''));
ok(!fora.length, 'nada de fora além do n8n' + (fora.length ? ': ' + fora.join(', ') : ''));
ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
