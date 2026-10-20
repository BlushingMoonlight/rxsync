// Painel (autoedicao.html): testa pela tela a equipe, o "Baixar meus dados" e o "Cancelar e excluir a conta"
// (rxsync-sistema DEC-114 e DEC-115), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. dono: Conta mostra Equipe e Baixar meus dados; a Equipe lista e convida (equipe_convidar no 29); Baixar a agenda
//      pede as páginas até tem_mais = false e baixa um CSV com todas as linhas (e sem fórmula de planilha);
//      "Cancelar e excluir a conta" só pede o link (conta_exclusao_pedir no 29), nunca o assinatura_cancelar do 24;
//   2. equipe (papel = equipe no abrir): Plano e pagamento, Equipe, Baixar meus dados e o Reconectar não aparecem; os
//      campos de contato e do assistente de gestão ficam travados, com o aviso.
// Uso (precisa do Playwright): node scripts/painel_equipe.mjs
import fs from 'node:fs';
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { papel: 'dono' };
const AGENDA = n => Array.from({ length: n }, (_, i) => ({ codigo: i + 1, inicio: '2026-11-01 10:00', fim: '2026-11-01 10:30', situacao: 'confirmado', paciente: i === 0 ? '=HIPERLINK("x")' : 'Paciente ' + (i + 1), telefone: '41999990000' }));
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, papel: estado.papel, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo', email: 'dono@clinica-a.test' }, somenteLeitura: { plano: 'Essencial' },
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'].map(k => [k, false])), limite_catalogo: 500 };
  if (caminho === 'autoedicao' && b.acao === 'assinatura_ver') return { ok: true, assinatura: { situacao: 'em_dia', plano_chave: 'essencial', plano_nome: 'Essencial', forma: 'mensal', valor: '299', abertas: [], pagas: [] } };
  if (caminho === 'painel-entrada' && b.acao === 'termos_estado') return { ok: true, pendente: false, papel: estado.papel };
  if (caminho === 'painel-entrada' && b.acao === 'equipe_listar') return { ok: true, limite: 3, pessoas: [
    { id: 1, email: 'dono@clinica-a.test', papel: 'dono', situacao: 'ativa' }, { id: 3, email: 'sec@clinica-a.test', papel: 'equipe', situacao: 'convite', convite_ate: '27/10/2026' }] };
  if (caminho === 'painel-entrada' && b.acao === 'equipe_convidar') return { ok: true, mensagem: 'Convite enviado para ' + b.dados.email + '. Ele vale 7 dias.' };
  if (caminho === 'painel-entrada' && b.acao === 'dados_exportar') return b.dados.pagina === 0 ? { ok: true, parte: 'agenda', pagina: 0, linhas: AGENDA(2000), tem_mais: true } : { ok: true, parte: 'agenda', pagina: 1, linhas: AGENDA(3), tem_mais: false };
  if (caminho === 'painel-entrada' && b.acao === 'conta_exclusao_pedir') return { ok: true, mensagem: 'Mandamos um link para d•••@clinica-a.test.' };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false };
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, acceptDownloads: true });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const erros = [];
const abrir = async rota => { const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(site.base + '/autoedicao.html#' + rota); await p.locator('#app').waitFor(); return p; };

// 1. dono
let page = await abrir('conta');
ok(await page.locator('#listaConta').getByText('Equipe', { exact: true }).isVisible(), 'dono: Conta mostra Equipe');
ok(await page.locator('#listaConta').getByText('Baixar meus dados').isVisible(), 'dono: Conta mostra Baixar meus dados');
await page.goto(site.base + '/autoedicao.html#conta/equipe');
await page.locator('#equipeLista').getByText('sec@clinica-a.test').waitFor();
ok(await page.locator('#equipeLista').getByText('Convite enviado, vale até 27/10/2026').isVisible(), 'Equipe: lista o dono e o convite em aberto');
await page.fill('#equipeEmail', 'Recepcao@Clinica-A.test'); await page.click('#btnEquipeConvidar');
await page.waitForTimeout(300);
const conv = chamadas.filter(c => c.acao === 'equipe_convidar').pop();
ok(conv && conv.caminho === 'painel-entrada' && conv.dados.email === 'recepcao@clinica-a.test' && conv.sessao === SESSAO, 'Convidar: vai ao 29 com a sessão e o e-mail em minúsculas');
await page.goto(site.base + '/autoedicao.html#conta/dados');
const [download] = await Promise.all([page.waitForEvent('download'), page.click('#btnBaixarAgenda')]);
const bruto = fs.readFileSync(await download.path());
const csv = bruto.toString('utf8');
const linhasCsv = csv.trim().split('\r\n');
ok(chamadas.filter(c => c.acao === 'dados_exportar').map(c => c.dados.pagina).join() === '0,1', 'Baixar a agenda: pede a página 0 e a 1 (até tem_mais = false)');
ok(bruto.slice(0, 3).toString('hex') === 'efbbbf', 'CSV com a marca UTF-8 no começo (acentos certos no Excel)');
ok(linhasCsv.length === 2004 && /^Código,Início/.test(linhasCsv[0]), 'CSV com o cabeçalho e as 2.003 consultas');   // o trim() tira a marca
ok(linhasCsv[1].includes(`"'=HIPERLINK(""x"")"`), 'CSV: valor que começa com = vira texto (a planilha não executa)');
ok(/^rxsync-agenda-\d{4}-\d{2}-\d{2}\.csv$/.test(download.suggestedFilename()), 'nome do arquivo: rxsync-agenda-AAAA-MM-DD.csv');
await page.goto(site.base + '/autoedicao.html#conta/assinatura');
await page.getByRole('button', { name: 'Cancelar e excluir a conta' }).click();
await page.waitForTimeout(300);
ok(chamadas.some(c => c.acao === 'conta_exclusao_pedir' && c.caminho === 'painel-entrada') && !chamadas.some(c => c.acao === 'assinatura_cancelar'), 'Cancelar e excluir: pede o link ao 29; nunca o assinatura_cancelar');
await page.close();

// 2. equipe
estado.papel = 'equipe';
page = await abrir('conta');
for (const t of ['Plano e pagamento', 'Equipe', 'Baixar meus dados']) ok(await page.locator('#listaConta').getByText(t, { exact: true }).isHidden(), `equipe: "${t}" não aparece`);
await page.goto(site.base + '/autoedicao.html#conta/contato');
ok(await page.locator('#campo_email').isDisabled() && await page.getByText('Só o dono da conta muda o e-mail').isVisible(), 'equipe: o e-mail da conta fica travado, com o aviso');
await page.goto(site.base + '/autoedicao.html#conta/whatsapp');
ok(await page.locator('#btnReconectar').isHidden(), 'equipe: o Reconectar não aparece');
ok(await page.locator('#campo_dono_whatsapp').isDisabled(), 'equipe: os números autorizados ficam travados');

ok(!erros.length, 'sem erro de JavaScript na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
