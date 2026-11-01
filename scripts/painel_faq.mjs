// Painel (painel/, DEC-156): testa pela tela as perguntas frequentes em Assistente › O que ela sabe (rxsync-sistema
// sql/076, S2), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. a tela lista as perguntas da clínica (faq_listar), com a contagem "N de 20" e o aviso das perguntas antigas;
//   2. cada pergunta abre numa folha (auditoria de 01/11/2026, FD-14): mudar, remover (com confirmação) e adicionar mandam
//      faq_salvar com a lista inteira (com os ids das que já existiam); pergunta sem resposta não sai do aparelho; fechar
//      com mudança pergunta "Descartar?"; a recusa do servidor aparece na tela;
//   3. com 20 perguntas, "Adicionar pergunta" fica desligado; o índice do Assistente mostra a contagem.
// Uso (precisa do Playwright): node scripts/painel_faq.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { itens: [{ id: 11, pergunta: 'Atende convênio?', resposta: 'Sim, Unimed.' }, { id: 12, pergunta: 'Tem estacionamento?', resposta: 'Sim, na frente.' }], antigas: 1, recusar: false };
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, papel: 'equipe', recursos: { pacientes: true } };
  if (caminho === 'autoedicao' && b.acao === 'faq_listar') return { ok: true, data: { ok: true, itens: estado.itens, antigas: estado.antigas, limite: 20, limite_pergunta: 200, limite_resposta: 800 } };
  if (caminho === 'autoedicao' && b.acao === 'faq_salvar') {
    if (estado.recusar) return { ok: true, data: { ok: false, mensagem: 'A resposta tem até 800 letras.' } };
    estado.itens = b.dados.itens.map((x, i) => ({ id: x.id || 100 + i, pergunta: x.pergunta, resposta: x.resposta })); return { ok: true, data: { ok: true, itens: estado.itens.length } };
  }
  if (caminho === 'autoedicao' && b.acao === 'agenda_medicos_listar') return { ok: true, data: { medicos: [] } };
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
await page.goto(site.base + '/painel/#assistente/faq');
await page.locator('#faqCorpo').waitFor();

// 1. a lista (auditoria de 01/11/2026, FD-14: lista e folha, num arquivo à parte, painel/faq.js)
await page.locator('#faqLista .linha').first().waitFor();
ok(await page.locator('#faqLista .linha').count() === 2 && (await page.locator('#faqLista').textContent()).includes('Atende convênio?') && (await page.locator('#faqLista').textContent()).includes('Sim, na frente.'), 'lista as perguntas, cada uma com o começo da resposta');
ok((await page.locator('#faqCorpo').textContent()).includes('2 de 20 perguntas'), 'mostra "2 de 20 perguntas"');
ok((await page.locator('#faqCorpo').textContent()).includes('Há 1 pergunta antiga'), 'avisa a pergunta antiga que só a RXSync muda');
ok(await page.locator('#faqCorpo input, #faqCorpo textarea').count() === 0, 'a página não tem campos abertos: cada pergunta abre numa folha');
ok(await page.evaluate(() => !!document.querySelector('script[src="/painel/faq.js"]')), 'a página vem do arquivo à parte painel/faq.js');

// 2. mudar, remover, adicionar
await page.locator('#faqLista .linha').nth(0).click();
await page.locator('#faqFolha #faqR').fill('Sim, Unimed e Bradesco.');
await page.locator('#faqFolha').getByRole('button', { name: 'Salvar' }).click();
await page.locator('#toast', { hasText: 'Perguntas salvas' }).waitFor();
let ch = chamadas.filter(c => c.acao === 'faq_salvar').pop();
ok(ch && ch.sessao === SESSAO && JSON.stringify(ch.dados.itens) === JSON.stringify([{ id: 11, pergunta: 'Atende convênio?', resposta: 'Sim, Unimed e Bradesco.' }, { id: 12, pergunta: 'Tem estacionamento?', resposta: 'Sim, na frente.' }]),
  'mudar uma: faq_salvar com a lista inteira, a que mudou com o id');
ok(!(await page.locator('#faqFolha').count()), 'salvo, a folha fecha');
await page.locator('#faqLista .linha').nth(1).click();
await page.locator('#faqFolha').getByRole('button', { name: 'Remover esta pergunta' }).click();
await page.getByRole('button', { name: 'Remover', exact: true }).click();
await page.locator('#toast', { hasText: 'Perguntas salvas' }).waitFor();
ch = chamadas.filter(c => c.acao === 'faq_salvar').pop();
ok(ch && ch.dados.itens.length === 1 && ch.dados.itens[0].id === 11, 'remover (com confirmação): a lista vai sem a removida');
await page.locator('#faqLista .linha').first().waitFor();
await page.getByRole('button', { name: 'Adicionar pergunta' }).click();
await page.locator('#faqFolha #faqP').fill('Aceita cartão?');
const antes = chamadas.filter(c => c.acao === 'faq_salvar').length;
await page.locator('#faqFolha').getByRole('button', { name: 'Salvar' }).click();
await page.locator('#toast', { hasText: 'Toda pergunta precisa de uma resposta' }).waitFor();
ok(chamadas.filter(c => c.acao === 'faq_salvar').length === antes, 'pergunta sem resposta: nada vai ao servidor');
await page.locator('#faqFolha #faqR').fill('Sim, débito e crédito.');
await page.locator('#faqFolha').getByRole('button', { name: 'Salvar' }).click();
await page.locator('#toast', { hasText: 'Perguntas salvas' }).waitFor();
ch = chamadas.filter(c => c.acao === 'faq_salvar').pop();
ok(ch && JSON.stringify(ch.dados.itens) === JSON.stringify([{ id: 11, pergunta: 'Atende convênio?', resposta: 'Sim, Unimed e Bradesco.' }, { id: '', pergunta: 'Aceita cartão?', resposta: 'Sim, débito e crédito.' }]), 'adicionar: a nova vai sem id, no fim da lista');
await page.locator('#faqLista', { hasText: 'Aceita cartão?' }).waitFor();
ok(true, 'depois de salvar, a lista vem de novo do servidor');
// fechar a folha com mudança pergunta "Descartar?" (regra 6)
await page.locator('#faqLista .linha').first().click();
await page.locator('#faqFolha #faqR').fill('Mudança não salva');
await page.locator('#faqFolha').getByRole('button', { name: 'Fechar' }).click();
await page.getByText('Descartar as mudanças?').waitFor();
ok(true, 'fechar a folha com mudança pergunta "Descartar as mudanças?"');
await page.getByRole('button', { name: 'Descartar' }).click();
estado.recusar = true;
await page.locator('#faqLista .linha').first().click();
await page.locator('#faqFolha #faqR').fill('Outra resposta');
await page.locator('#faqFolha').getByRole('button', { name: 'Salvar' }).click();
await page.locator('#toast', { hasText: 'até 800 letras' }).waitFor();
ok(await page.locator('#faqFolha').count() === 1, 'a recusa do servidor aparece na tela e a folha continua aberta');

// 3. no limite
estado.recusar = false; estado.itens = Array.from({ length: 20 }, (_, i) => ({ id: 200 + i, pergunta: 'Pergunta ' + (i + 1), resposta: 'Resposta' }));
await page.goto(site.base + '/painel/#assistente'); await page.goto(site.base + '/painel/#assistente/faq');
await page.locator('#faqLista .linha').nth(19).waitFor();
ok(await page.getByRole('button', { name: 'Adicionar pergunta' }).isDisabled(), 'com 20 perguntas, "Adicionar pergunta" fica desligado');
await page.goto(site.base + '/painel/#assistente'); await page.waitForTimeout(400);
ok((await page.locator('#conteudo, main').first().textContent()).includes('20 perguntas'), 'o índice do Assistente mostra "20 perguntas"');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: as perguntas frequentes pelo painel.');
process.exit(falhas ? 1 : 0);
