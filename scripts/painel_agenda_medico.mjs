// Painel (autoedicao.html): testa pela tela o botão "Agenda por médico" (DEC-103, rxsync-sistema#77), com o n8n
// SIMULADO aqui (nada sai para a internet):
//   1. Gestão: o botão aparece em Funções da assistente, desligado, e ligar manda func_medicos = SIM ao 24;
//   2. Agenda › Horários com médico cadastrado e o botão desligado: aviso "A agenda por médico está desligada", e a
//      grade da clínica continua à vista; ligado (o 24 devolve modo_medicos), o aviso verde do modo médicos;
//   3. Essencial: o botão aparece travado.
// Uso (precisa do Playwright): node scripts/painel_agenda_medico.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { gestao: true, botao: '' };
const RECURSOS = ['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, dados: b.dados || b });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Médicos', fuso_horario: 'America/Sao_Paulo', func_medicos: estado.botao },
    somenteLeitura: { plano: estado.gestao ? 'Gestão Inteligente' : 'Essencial' }, recursos: Object.fromEntries(RECURSOS.map(k => [k, estado.gestao])), limite_catalogo: 500 };
  if (caminho === 'autoedicao' && b.acao === 'salvar') { if ('func_medicos' in (b.dados || {})) estado.botao = b.dados.func_medicos; return { ok: true, mensagem: 'Salvo!' }; }
  if (caminho === 'autoedicao' && b.acao === 'agenda_medicos_listar') return { ok: true, data: { modo_medicos: estado.gestao && estado.botao === 'SIM', reservio_ativo: false,
    funcoes_padrao: { agendamento: true, paga_consultorio: false }, medicos: [{ id: 1, nome: 'Dra. Ana', ativo: true, funcoes: {}, tipos: [], grade: [] }] } };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false };
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const erros = [];
const abrir = async rota => { const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e)));
  await p.goto(site.base + '/autoedicao.html#' + rota); await p.waitForFunction(() => !document.getElementById('app').hidden); return p; };
const botao = p => p.locator('#campo_func_medicos').locator('xpath=..').getByRole('switch', { name: 'Agenda por médico' });

// 2a. Horários com médico e o botão desligado.
let page = await abrir('agenda/horarios');
await page.locator('#medBox').waitFor();
await page.waitForFunction(() => !document.getElementById('medDesligadoAviso').classList.contains('hidden'));
ok(await page.locator('#medDesligadoAviso').isVisible() && await page.locator('#gradeBox').isVisible() && await page.locator('#medModoAviso').isHidden(),
  'médico cadastrado com o botão desligado: aviso "agenda por médico está desligada" e a grade da clínica à vista');
// 1. Funções da assistente: o botão, desligado, liga e salva.
await page.goto(site.base + '/autoedicao.html#assistente/funcoes');
const sw = botao(page); await sw.waitFor();
ok(await sw.getAttribute('aria-checked') === 'false' && await sw.isEnabled(), 'Gestão: "Agenda por médico" em Funções da assistente, desligado');
await sw.click();
await page.waitForFunction(() => document.querySelector('#campo_func_medicos').value === 'SIM');
await page.waitForTimeout(400);
const salvo = chamadas.filter(c => c.acao === 'salvar').pop();
ok(salvo && salvo.dados.func_medicos === 'SIM', 'ligar manda func_medicos = SIM ao 24');
// 2b. Ligado: a agenda passa a ser por médico na hora.
await page.goto(site.base + '/autoedicao.html#agenda/horarios');
await page.waitForFunction(() => !document.getElementById('medModoAviso').classList.contains('hidden'));
ok(await page.locator('#medDesligadoAviso').isHidden() && await page.locator('#gradeBox').isHidden(), 'ligado: aviso verde do modo médicos, sem o aviso de desligado');
ok(/desligue “Agenda por médico” em Funções da assistente/.test(await page.locator('#medModoAviso').innerText()), 'o aviso verde diz como voltar a uma agenda só');
await page.close();
// 3. Essencial: travado.
estado.gestao = false; estado.botao = '';
page = await abrir('assistente/funcoes');
const sw2 = botao(page); await sw2.waitFor();
ok(await sw2.isDisabled(), 'Essencial: "Agenda por médico" travado');
ok(!erros.length, 'sem erro de JavaScript na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
