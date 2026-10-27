// Painel (painel/, DEC-156): testa pela tela o S1 e o S3 da rxsync-sistema#203, com o n8n SIMULADO aqui (nada sai para a
// internet):
//   1. S1: com conta.atendendo_teste no "abrir", a faixa "Atendendo só no teste" aparece já ao abrir (sem tocar em
//      "Testar"); sem ele, não aparece;
//   2. S3: Hoje › Precisa de você mostra no alto quem pediu uma pessoa ou teve urgência (a urgência com o selo, o motivo,
//      "Abrir no WhatsApp" com o número certo; P4: a hora em que a assistente volta a responder, ou que ela continua
//      respondendo); "Resolvido" manda agenda_chamado_resolver só com o id e tira a linha;
//   3. a faixa do teste (DEC-166): com recursos.teste_gestao, diz que tudo do plano Gestão está liberado no teste.
// Uso (precisa do Playwright): node scripts/painel_precisam.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { teste: true, situacao: '', teste_gestao: false };
const agora = m => new Date(Date.now() - m * 60000).toISOString();
const CHAMADOS = [
  { id: 31, urgente: true, nome_paciente: 'Rosa Lima', telefone: '5541999990001', motivo: 'Dor forte no peito desde cedo', aviso_enviado: true, criado_em: agora(5), volta_em: agora(-115) },
  { id: 32, urgente: false, nome_paciente: '', telefone: '5541988880002', motivo: 'Quer falar sobre o convênio', aviso_enviado: false, criado_em: agora(90), volta_em: null }];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, papel: 'equipe',
    recursos: { pacientes: true, fila: true, documentos: true, teste_gestao: estado.teste_gestao }, conta: { no_ar: true, situacao: estado.situacao, dias_restantes: 4, atendendo_teste: estado.teste } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_chamados') return { ok: true, data: CHAMADOS };
  if (caminho === 'autoedicao' && b.acao === 'agenda_chamado_resolver') return { ok: true, data: { ok: true } };
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
const abrir = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e))); await p.goto(site.base + '/painel/#hoje'); await p.locator('#hojeCorpo').waitFor(); return p; };

// 1. S1
let page = await abrir();
await page.locator('#faixaTeste', { hasText: 'Atendendo só no teste' }).waitFor();
ok(true, 'S1: com atendendo_teste, a faixa "Atendendo só no teste" aparece já ao abrir');
await page.close(); estado.teste = false;
page = await abrir();
await page.locator('#hojeAtencao').waitFor();
ok(!(await page.locator('#faixaTeste').isVisible()), 'S1: sem atendendo_teste, a faixa não aparece');

// 2. S3
await page.locator('#hojeAtencao .linha.chamado').first().waitFor();
const linhas = page.locator('#hojeAtencao .linha.chamado');
ok(await linhas.count() === 2, 'S3: os 2 chamados aparecem em Precisa de você');
const l1 = linhas.nth(0), l2 = linhas.nth(1);
ok((await l1.textContent()).includes('Urgência') && (await l1.textContent()).includes('Rosa Lima') && (await l1.textContent()).includes('Dor forte no peito'), 'S3: a urgência vem primeiro, com o selo, o nome e o motivo');
ok((await l2.textContent()).includes('Pediu para falar com alguém: (41) 98888-0002') && (await l2.textContent()).includes('não chegou'), 'S3: sem nome, aparece o telefone; o aviso que não chegou é dito');
ok(/a assistente volta a responder (amanhã )?às \d\d:\d\d/.test(await l1.textContent()), 'P4: diz a hora em que a assistente volta a responder');
ok((await l2.textContent()).includes('a assistente continua respondendo'), 'P4: sem volta_em, diz que a assistente continua respondendo');
ok(await l1.locator('a', { hasText: 'Abrir no WhatsApp' }).getAttribute('href') === 'https://wa.me/5541999990001', 'S3: "Abrir no WhatsApp" com o número do paciente');
await l1.getByRole('button', { name: 'Resolvido' }).click();
await page.locator('#toast', { hasText: 'resolvido' }).waitFor();
const ch = chamadas.filter(c => c.acao === 'agenda_chamado_resolver').pop();
ok(ch && String(ch.dados.id) === '31' && Object.keys(ch.dados).join() === 'id' && ch.sessao === SESSAO, 'S3: "Resolvido" manda agenda_chamado_resolver só com o id, pela sessão');
ok(await page.locator('#hojeAtencao .linha.chamado').count() === 1, 'S3: a linha resolvida sai da lista');
// 3. A faixa do teste (DEC-166): no teste novo (recursos.teste_gestao), diz que tudo do Gestão está liberado; no teste antigo, não.
await page.close(); estado.situacao = 'em_teste'; estado.teste_gestao = true;
page = await abrir();
await page.locator('#hojeEstado').waitFor();
ok((await page.locator('#hojeEstado').textContent()).includes('Durante o teste, tudo do plano Gestão está liberado.'), 'teste novo: o cartão do teste diz que tudo do Gestão está liberado');
await page.close(); estado.teste_gestao = false;
page = await abrir();
await page.locator('#hojeEstado').waitFor();
ok(!(await page.locator('#hojeEstado').textContent()).includes('Gestão'), 'teste de antes do sql/068: o cartão não fala do Gestão');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: "Atendendo só no teste" ao abrir e "Precisa de você" com os chamados.');
process.exit(falhas ? 1 : 0);
