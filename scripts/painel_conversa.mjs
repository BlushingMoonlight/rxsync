// Painel (painel/, DEC-156): testa pela tela a conversa da consulta, só leitura (rxsync-sistema sql/077, S5), com o n8n
// SIMULADO aqui (nada sai para a internet):
//   1. a conversa só é pedida ao tocar em "Ver a conversa" (abrir a consulta não chama o Chatwoot); vai agenda_conversa só
//      com o id; o paciente de um lado, a assistente e a equipe do outro, com quem falou;
//   2. consulta sem conversa e falha do servidor: a frase certa, sem quebrar a tela.
// Uso (precisa do Playwright): node scripts/painel_conversa.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = [];
const dia = (n, h) => { const d = new Date(Date.now() + n * 86400000); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const CONSULTAS = [
  { id: 41, nome_paciente: 'Paula Lima', telefone_paciente: '41999991111', servico: 'Consulta', inicio: dia(1, 9), fim: dia(1, 10), status: 'confirmado', criado_por: 'ia', visto: true },
  { id: 42, nome_paciente: 'Rui Manual', telefone_paciente: '41988882222', servico: 'Consulta', inicio: dia(2, 9), fim: dia(2, 10), status: 'confirmado', criado_por: 'manual', visto: true },
  { id: 43, nome_paciente: 'Sara Falha', telefone_paciente: '41977773333', servico: 'Consulta', inicio: dia(3, 9), fim: dia(3, 10), status: 'confirmado', criado_por: 'ia', visto: true }];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, papel: 'equipe', recursos: { pacientes: true } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_listar') return { ok: true, data: CONSULTAS };
  if (caminho === 'autoedicao' && b.acao === 'agenda_conversa') {
    const id = String(b.dados.id);
    if (id === '42') return { ok: true, data: { ok: true, sem_conversa: true, mensagens: [] } };
    if (id === '43') return { ok: true, data: { ok: false, mensagem: 'Não consegui ler a conversa agora. Tente de novo em instantes.' } };
    return { ok: true, data: { ok: true, mensagens: [{ de: 'paciente', texto: 'Oi, quero marcar uma consulta', em: dia(-1, 10) }, { de: 'assistente', texto: 'Claro! Tenho quinta às 10h.', em: dia(-1, 10) }, { de: 'equipe', texto: 'Aqui é a Ana, da recepção.', em: dia(-1, 11) }] } };
  }
  if (caminho === 'autoedicao' && b.acao === 'agenda_medicos_listar') return { ok: true, data: { medicos: [] } };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false };
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
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
await page.goto(site.base + '/painel/#agenda'); await page.locator('#calViews').getByRole('button', { name: 'Lista' }).click();
await page.locator('#agLista').getByText('Paula Lima').first().waitFor();
const cartao = nome => page.locator('#agLista .linha', { hasText: nome }).first();
const folha = page.locator('#consultaFolha');

// 1. a conversa
await cartao('Paula Lima').locator('.linha-abrir').click();
await folha.getByRole('button', { name: 'Ver a conversa' }).waitFor();
ok(!chamadas.some(c => c.acao === 'agenda_conversa'), 'abrir a consulta não pede a conversa');
await folha.getByRole('button', { name: 'Ver a conversa' }).click();
await folha.locator('.conversa-linha li').first().waitFor();
const ch = chamadas.filter(c => c.acao === 'agenda_conversa').pop();
ok(ch && String(ch.dados.id) === '41' && Object.keys(ch.dados).join() === 'id' && ch.sessao === SESSAO, '"Ver a conversa": agenda_conversa só com o id, pela sessão');
const lis = folha.locator('.conversa-linha li');
ok(await lis.count() === 3, 'mostra as 3 mensagens');
ok((await lis.nth(0).getAttribute('class')) === 'entrou' && (await lis.nth(0).textContent()).startsWith('Paciente'), 'a do paciente fica de um lado, com "Paciente"');
ok((await lis.nth(1).getAttribute('class')) === 'saiu' && (await lis.nth(1).textContent()).startsWith('Assistente') && (await lis.nth(2).textContent()).startsWith('Equipe'), 'a da assistente e a da equipe ficam do outro lado, com quem falou');
ok((await folha.textContent()).includes('Só para ler'), 'diz que é só para ler');
await page.keyboard.press('Escape');

// 2. sem conversa e falha
await cartao('Rui Manual').locator('.linha-abrir').click();
await folha.getByRole('button', { name: 'Ver a conversa' }).click();
await folha.getByText('não veio de uma conversa com a assistente').waitFor();
ok(true, 'sem conversa: "Esta consulta não veio de uma conversa com a assistente."');
await page.keyboard.press('Escape');
await cartao('Sara Falha').locator('.linha-abrir').click();
await folha.getByRole('button', { name: 'Ver a conversa' }).click();
await folha.getByText('Não consegui ler a conversa agora').waitFor();
ok(true, 'falha: a frase do servidor aparece');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: a conversa da consulta, só leitura.');
process.exit(falhas ? 1 : 0);
