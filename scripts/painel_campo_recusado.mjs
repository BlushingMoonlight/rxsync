// Painel (painel/, DEC-156): quando o servidor recusa salvar um campo de texto, o que a pessoa digitou continua no campo
// (pente fino da camada 3, I-02: antes, a mensagem "Não foi salvo" aparecia e o campo voltava ao texto antigo, apagando o
// que tinha sido escrito). Com o n8n SIMULADO aqui (nada sai para a internet; dados inventados):
//   1. o servidor recusa: aparece "Não foi salvo" e o texto digitado fica no campo;
//   2. o servidor aceita na segunda vez: "Salvo", com o mesmo texto.
// Uso (precisa do Playwright): node scripts/painel_campo_recusado.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'c'.repeat(64);
const estado = { recusar: true, salvos: [] };
function responder(caminho, b) {
  if (caminho === 'painel-entrada') return b.acao === 'termos_estado' ? { ok: true, pendente: false, papel: 'dono' } : { ok: true };
  if (caminho !== 'autoedicao') return { ok: true, data: [] };
  if (b.acao === 'abrir') return { ok: true, papel: 'dono', editaveis: { nome_exibicao: 'Clínica Antiga', descricao_curta: 'Texto antigo.', fuso_horario: 'America/Sao_Paulo' },
    somenteLeitura: { plano: 'Essencial' }, recursos: {}, limite_catalogo: 500, conta: { situacao: '', no_ar: true } };
  if (b.acao === 'salvar') { estado.salvos.push(b.dados || {}); return estado.recusar ? { ok: false, mensagem: 'O nome precisa ter até 80 letras.' } : { ok: true, mensagem: 'Salvo!' }; }
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url().slice(N8N.length), b)) });
});
const page = await ctx.newPage(); page.setDefaultTimeout(30000);
page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/painel/#assistente/clinica');
await page.locator('#campo_nome_exibicao').waitFor({ state: 'visible' });
ok(await page.inputValue('#campo_nome_exibicao') === 'Clínica Antiga', 'o campo abre com o valor do servidor');

// 1. Recusado
await page.fill('#campo_nome_exibicao', 'Clínica Nova Sorriso');
await page.locator('#campo_descricao_curta').focus();   // sair do campo salva
await page.locator('[data-estado-campo="nome_exibicao"].erro').first().waitFor();
ok(/Não foi salvo/.test(await page.locator('[data-estado-campo="nome_exibicao"]').first().textContent()), 'recusado: aparece "Não foi salvo", com o motivo do servidor');
ok(await page.inputValue('#campo_nome_exibicao') === 'Clínica Nova Sorriso', 'recusado: o texto digitado continua no campo (não volta ao antigo)');

// 2. Aceito na segunda vez
estado.recusar = false;
await page.locator('#campo_nome_exibicao').focus(); await page.type('#campo_nome_exibicao', '!');
await page.locator('#campo_descricao_curta').focus();
await page.locator('[data-estado-campo="nome_exibicao"].salvo').first().waitFor();
ok(estado.salvos.pop().nome_exibicao === 'Clínica Nova Sorriso!' && await page.inputValue('#campo_nome_exibicao') === 'Clínica Nova Sorriso!', 'aceito: salva o texto digitado e o campo fica com ele');

ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await ctx.close(); await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: campo recusado pelo servidor mantém o que foi digitado.');
process.exit(falhas ? 1 : 0);
