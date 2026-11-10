// Painel (painel/, DEC-156): testa pela tela o cartão "Confirmar" e o "O que mudou" no chat do assistente de gestão
// (rxsync-sistema#203, S11), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. a resposta que pede a confirmação (confirmar) ganha "Confirmar" e "Não"; "Confirmar" manda "Sim, confirmo." como a
//      próxima mensagem, e os botões se desligam;
//   2. depois, o "O que mudou" lista o que o workflow 13 mudou, e só a agenda é recarregada (areas: agenda);
//   3. sem conexão, a mensagem volta para o campo;
//   4. quando o assistente muda um ajuste do painel (rxsync-sistema DEC-209; areas: ajustes), os campos são lidos de novo
//      e a tela mostra o valor novo;
//   5. depois do ajuste confirmado, Conta › Acessos recentes mostra a mudança como "pelo assistente de gestão" (o texto
//      que o servidor manda para o registro).
// Uso (precisa do Playwright): node scripts/painel_chat_confirmar.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; let semRede = false, duracao = '30';
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, mensagem: b.mensagem });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo', assistente_dono_ativa: 'SIM', dono_pode_editar: 'SIM', duracao_padrao_min: duracao }, papel: 'dono', recursos: { pacientes: true, assistente_dono: true } };
  if (caminho === 'assistente-dono') {
    if (/duração/.test(b.mensagem)) return { ok: true, resposta: 'Vai mudar *Duração da consulta*: de 30 para 45. Confirma?', confirmar: true, mudou: [], areas: [] };
    if (/^Sim, confirmo/.test(b.mensagem) && chamadas.some(c => /duração/.test(c.mensagem || ''))) { duracao = '45'; return { ok: true, resposta: 'Pronto, a duração da consulta agora é 45.', confirmar: false, mudou: ['Ajuste do painel alterado'], areas: ['ajustes'] }; }
    if (/^Sim, confirmo/.test(b.mensagem)) return { ok: true, resposta: 'Pronto! Marquei a Maria Souza na quarta às 14:00.', confirmar: false, mudou: ['Consulta marcada: Maria Souza, 28/10 às 14:00'], areas: ['agenda'] };
    return { ok: true, resposta: 'Vou marcar *Maria Souza* na quarta, 28/10, às 14:00. Confirma?', confirmar: true, mudou: [], areas: [] };
  }
  // O registro do painel: depois do ajuste confirmado, o servidor manda a linha "pelo assistente de gestão" (o mesmo texto da rx_painel_acessos).
  if (caminho === 'painel-entrada' && b.acao === 'acessos_recentes') return { ok: true, acessos: [
    ...(duracao === '45' ? [{ quando: new Date().toISOString(), evento: 'acao', o_que: 'Mudou: salvar (pelo assistente de gestão)', quem: 'dono · d•••@clinica-a.test', aparelho: 'iPad · Safari' }] : []),
    { quando: new Date(Date.now() - 3600000).toISOString(), evento: 'entrada', o_que: 'Entrou', quem: 'dono · d•••@clinica-a.test', aparelho: 'iPad · Safari' }] };
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
  if (semRede && q.url().endsWith('assistente-dono')) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const erros = [];
const page = await ctx.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/painel/#hoje'); await page.locator('#hojeCorpo').waitFor();
await page.click('#btnChat'); await page.locator('#chatTexto').waitFor();

// 1. o cartão "Confirmar"
await page.locator('#chatTexto').fill('Marca a Maria Souza quarta às 14h');
await page.click('#chatEnviar');
const cartao = page.locator('#chatMsgs .chat-cartao').last();
await cartao.getByRole('button', { name: 'Confirmar' }).waitFor();
ok(await cartao.getByRole('button', { name: 'Não' }).isVisible(), 'a resposta que pede a confirmação ganha "Confirmar" e "Não"');
const listasAntes = chamadas.filter(c => c.acao === 'agenda_listar').length;
await cartao.getByRole('button', { name: 'Confirmar' }).click();
await page.locator('#chatMsgs .chat-cartao', { hasText: 'O que mudou' }).waitFor();
const msgs = chamadas.filter(c => c.caminho === 'assistente-dono').map(c => c.mensagem);
ok(msgs.length === 2 && msgs[1] === 'Sim, confirmo.', '"Confirmar" manda "Sim, confirmo." como a próxima mensagem');
ok(await page.locator('#chatMsgs .chat-cartao button:not([disabled])').count() === 0, 'os botões do cartão se desligam');

// 2. o que mudou
const mudou = page.locator('#chatMsgs .chat-cartao', { hasText: 'O que mudou' });
ok((await mudou.textContent()).includes('Consulta marcada: Maria Souza, 28/10 às 14:00'), '"O que mudou" lista a consulta marcada');
await page.waitForTimeout(400);
ok(chamadas.filter(c => c.acao === 'agenda_listar').length > listasAntes, 'a agenda é recarregada (areas: agenda)');
// 3. sem conexão (pente fino da camada 3, I-05): a mensagem volta para o campo, para mandar de novo sem digitar tudo.
semRede = true;
await page.locator('#chatTexto').fill('Bloqueia sexta de manhã');
await page.locator('#chatEnviar').click();
await page.locator('#chatMsgs', { hasText: 'Sua mensagem não foi enviada' }).waitFor();
ok(await page.inputValue('#chatTexto') === 'Bloqueia sexta de manhã', 'sem conexão: o texto volta para o campo');
semRede = false;
await page.locator('#chatEnviar').click();
await page.waitForFunction(() => !document.querySelector('#chatEnviar').disabled);
ok(chamadas.filter(c => c.caminho === 'assistente-dono').pop().mensagem === 'Bloqueia sexta de manhã', 'com a conexão de volta, "Enviar" manda a mesma mensagem');
// 4. o assistente muda um ajuste do painel (DEC-209): a proposta, o "Confirmar" e os campos lidos de novo
await page.locator('#chatTexto').fill('Muda a duração da consulta para 45');
await page.locator('#chatEnviar').click();
await page.locator('#chatMsgs', { hasText: 'de 30 para 45' }).waitFor();
const cartao2 = page.locator('#chatMsgs .chat-cartao').last();
await cartao2.locator('button:not([disabled])', { hasText: 'Confirmar' }).waitFor();
ok((await page.locator('#chatMsgs').textContent()).includes('Vai mudar Duração da consulta: de 30 para 45. Confirma?'), 'a proposta do ajuste mostra o antes e o depois e pede a confirmação');
const abrirAntes = chamadas.filter(c => c.acao === 'abrir').length;
await cartao2.getByRole('button', { name: 'Confirmar' }).click();
await page.locator('#chatMsgs .chat-cartao', { hasText: 'Ajuste do painel alterado' }).waitFor();
await page.waitForTimeout(400);
ok(chamadas.filter(c => c.acao === 'abrir').length > abrirAntes, 'os ajustes são lidos de novo do servidor (areas: ajustes)');
await page.evaluate(() => { document.querySelector('#painelChat [aria-label="Fechar"]').click(); location.hash = 'agenda/horarios/regras'; });
await page.locator('#campo_duracao_padrao_min').waitFor();
ok(await page.inputValue('#campo_duracao_padrao_min') === '45', 'a tela do ajuste mostra o valor novo (45)');
// 5. o registro: Conta › Acessos recentes mostra o ajuste como "pelo assistente de gestão"
await page.evaluate(() => { location.hash = 'conta/acessos'; });
await page.locator('#acessosLista .linha').first().waitFor();
const linhas = await page.locator('#acessosLista .linha .t1').allTextContents();
ok(linhas[0] === 'Mudou: salvar (pelo assistente de gestão)', 'Conta › Acessos recentes mostra a mudança como "pelo assistente de gestão", no alto da lista');
ok((await page.locator('#acessosLista .linha').first().textContent()).includes('dono'), 'a linha diz quem confirmou (o dono) e o aparelho');
ok(linhas.filter(t => /pelo assistente de gestão/.test(t)).length === 1 && linhas.includes('Entrou'), 'as outras linhas do registro continuam como eram');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: o cartão "Confirmar" e o "O que mudou" no chat.');
process.exit(falhas ? 1 : 0);
