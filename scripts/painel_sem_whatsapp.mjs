// Painel (painel/, DEC-156): testa pela tela os itens 22 e 24 da rxsync-sistema#225, com o n8n SIMULADO aqui (nada sai
// para a internet):
//   1. a clínica que nunca conectou o WhatsApp vê em Hoje "Falta conectar o WhatsApp" com "Conectar" e "Testar a
//      assistente"; testar abre o teste sem a faixa "Atendendo só no teste" e sem "Voltar"; o cartão passa a dizer
//      "Testar de novo"; o 23 responde sem_whatsapp ao "Voltar" e nada quebra;
//   2. o chat do assistente de gestão mostra *x* e **x** como negrito, lista com "• " e nenhum asterisco solto.
// Uso (precisa do Playwright): node scripts/painel_sem_whatsapp.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = [];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Nova', fuso_horario: 'America/Sao_Paulo', assistente_dono_ativa: 'SIM' }, papel: 'dono',
    recursos: { pacientes: true, assistente_dono: true }, conta: { no_ar: false, situacao: 'teste_aguardando', atendendo_teste: false } };
  if (caminho === 'conectar' && b.acao === 'testar') return { ok: true, link: 'https://rxsync.com.br/teste.html?token=abc', mensagem: 'Pronto! Também enviamos por e-mail.' };
  if (caminho === 'conectar' && b.acao === 'whatsapp') return { ok: true, sem_whatsapp: true, mensagem: 'Teste encerrado. A assistente começa a atender quando você conectar o WhatsApp.' };
  if (caminho === 'assistente-dono') return { ok: true, resposta: '## Hoje\n**Amanhã:** 3 consultas\n* 9h – Ana\nObservação *solta', confirmar: false, mudou: [], areas: [] };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false };
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const erros = [];
const page = await ctx.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/painel/#hoje'); await page.locator('#hojeCorpo').waitFor();

// 1. nunca conectou
const cartao = page.locator('#hojeEstado');
await cartao.waitFor();
ok((await cartao.textContent()).includes('Falta conectar o WhatsApp'), 'Hoje: "Falta conectar o WhatsApp"');
ok(await cartao.getByRole('button', { name: 'Conectar' }).count() === 1 && await cartao.getByRole('button', { name: 'Testar a assistente' }).count() === 1, 'Hoje: "Conectar" (principal) e "Testar a assistente"');
await cartao.getByRole('button', { name: 'Testar a assistente' }).click();
const folha = page.getByRole('dialog');
await folha.getByText('Ela começa a atender os pacientes quando você conectar o WhatsApp.').waitFor();
ok(await folha.getByRole('button', { name: 'Conectar o WhatsApp' }).count() === 1 && await folha.getByText('Voltar a atender no WhatsApp').count() === 0, 'o teste antes de conectar não fala em "Voltar"; oferece "Conectar o WhatsApp"');
ok(chamadas.some(c => c.caminho === 'conectar' && c.acao === 'testar'), 'testar foi pedido ao 23');
await folha.locator('button.fant', { hasText: 'Fechar' }).click();
await page.waitForTimeout(300);
ok(!(await page.locator('#faixaTeste').isVisible()), 'sem a faixa "Atendendo só no teste"');
ok(await page.locator('#hojeEstado').getByRole('button', { name: 'Testar de novo' }).count() === 1, 'o cartão passa a dizer "Testar de novo"');
ok(!/Atendendo só no teste/.test(await page.locator('[data-estado-curto]').first().textContent()), 'o estado do alto não diz "Atendendo só no teste"');

// 2. o chat sem asteriscos
await page.click('#btnChat'); await page.locator('#chatTexto').waitFor();
await page.locator('#chatTexto').fill('Como está amanhã?'); await page.click('#chatEnviar');
const bal = page.locator('#chatMsgs .balao:not(.eu)').last();
await bal.getByText('9h – Ana').waitFor();
const html = { html: await bal.innerHTML(), txt: await bal.textContent() };
ok(/<strong>Amanhã:<\/strong>/.test(html.html) && html.txt.includes('• 9h – Ana') && !html.txt.includes('*') && !html.txt.includes('#'), 'chat: **x** vira negrito, lista com "• ", nenhum asterisco nem # solto');
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros[0] : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: antes de conectar, testar não quebra Hoje; o chat sem asteriscos.');
process.exit(falhas ? 1 : 0);
