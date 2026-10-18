// Painel (autoedicao.html): testa pela tela o link de pagamento pedido pela equipe (DEC-099), com o n8n SIMULADO aqui
// (nada sai para a internet):
//   1. nova consulta: a opção "Enviar link de pagamento ao paciente" aparece desmarcada, some no BLOQUEIO e só vai ao
//      24 (agenda_criar com enviar_link) quando marcada; o aviso "não deu para enviar" aparece na tela;
//   2. consulta marcada: "Enviar link agora" (agenda_pagamento_enviar) só enquanto o link não foi e a consulta não está
//      paga; com o "Mandar o link de pagamento" desligado, nem a opção nem o botão aparecem.
// Uso (precisa do Playwright): node scripts/painel_link_pagamento.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { ligado: true, medicos: false };
const amanha = h => { const d = new Date(Date.now() + 86400000); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const CONSULTAS = () => [
  { id: 11, nome_paciente: 'Ana Souza', telefone_paciente: '41999991111', servico: 'Consulta', inicio: amanha(9), fim: amanha(10), status: 'confirmado', criado_por: 'manual', visto: true, pago_em: null, pagamento_link_enviado_em: null },
  { id: 12, nome_paciente: 'Bruno Lima', telefone_paciente: '41988882222', servico: 'Consulta', inicio: amanha(11), fim: amanha(12), status: 'confirmado', criado_por: 'manual', visto: true, pago_em: amanha(8), pago_origem: 'painel', pagamento_link_enviado_em: null }
];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo', func_pagamento_link: estado.ligado ? 'SIM' : 'NAO', pagamento_link: 'https://pague.exemplo.com/x' }, somenteLeitura: { plano: 'Essencial' },
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'].map(k => [k, k === 'medicos' && estado.medicos])), limite_catalogo: 500 };
  if (caminho === 'autoedicao' && b.acao === 'agenda_medicos_listar') return { ok: true, data: estado.medicos ? { modo_medicos: true, funcoes_padrao: { agendamento: true, paga_consultorio: false },
    medicos: [{ id: 1, nome: 'Dra. Ana', ativo: true, funcoes: {}, tipos: [] }, { id: 2, nome: 'Dr. Bruno', ativo: true, funcoes: { paga_consultorio: true }, tipos: [] }] } : { medicos: [] } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_listar') return { ok: true, data: CONSULTAS() };
  if (caminho === 'autoedicao' && b.acao === 'agenda_criar') return { ok: true, data: Object.assign({ ok: true, id: 99, erro: null }, b.dados.enviar_link ? { pagamento: { enviado: false, mensagem: 'Não deu para enviar o link: o paciente ainda não tem conversa no WhatsApp da clínica.' } } : {}) };
  if (caminho === 'autoedicao' && b.acao === 'agenda_pagamento_enviar') return { ok: true, data: { ok: true, id: b.dados.id, pagamento: { enviado: true, mensagem: 'Link de pagamento enviado ao paciente pelo WhatsApp.' } } };
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
const abrirPainel = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e))); p.on('dialog', d => d.accept());
  await p.goto(site.base + '/autoedicao.html#agenda'); await p.locator('#calViews').getByRole('button', { name: 'Lista' }).click();
  await p.locator('#agLista').getByText('Ana Souza').first().waitFor(); return p; };
const campo = (p, rotulo) => p.locator('#agForm label', { hasText: rotulo }).locator('xpath=following-sibling::input[1]');

// 1. nova consulta
let page = await abrirPainel();
await page.click('#agNovo');
const opcao = page.locator('#agEnviarLink');
ok(await opcao.isVisible() && !(await opcao.isChecked()), 'nova consulta: "Enviar link de pagamento ao paciente" aparece desmarcada');
await campo(page, 'Serviço').fill('BLOQUEIO');
ok(await opcao.isHidden(), 'no BLOQUEIO a opção some');
await campo(page, 'Serviço').fill('Consulta');
await campo(page, 'Nome do paciente').fill('Carla Dias'); await campo(page, 'Telefone com DDD').fill('41977773333');
await campo(page, 'Início').fill('2027-03-02T10:00'); await campo(page, 'Fim').fill('2027-03-02T10:30');
await page.getByRole('button', { name: 'Salvar' }).click();
await page.locator('#agForm').waitFor({ state: 'hidden' });
let criar = chamadas.filter(c => c.acao === 'agenda_criar').pop();
ok(criar && !('enviar_link' in criar.dados), 'desmarcada: o pedido vai sem enviar_link');
await page.click('#agNovo');
ok(!(await page.locator('#agEnviarLink').isChecked()), 'ao abrir de novo, a opção volta desmarcada');
await campo(page, 'Nome do paciente').fill('Carla Dias'); await campo(page, 'Telefone com DDD').fill('41977773333'); await campo(page, 'Serviço').fill('Consulta');
await campo(page, 'Início').fill('2027-03-02T11:00'); await campo(page, 'Fim').fill('2027-03-02T11:30');
await page.check('#agEnviarLink');
await page.getByRole('button', { name: 'Salvar' }).click();
await page.locator('#toast', { hasText: 'não tem conversa no WhatsApp' }).waitFor();
criar = chamadas.filter(c => c.acao === 'agenda_criar').pop();
ok(criar.dados.enviar_link === true && criar.sessao === SESSAO, 'marcada: agenda_criar com enviar_link, pela sessão');
ok(true, 'a tela avisa que não deu para enviar');

// 2. consulta marcada: "Enviar link agora"
await page.locator('#agLista').getByText('Ana Souza').first().waitFor();
const cartao = nome => page.locator('#agLista > *', { hasText: nome }).first();
await cartao('Ana Souza').getByRole('button', { name: 'Editar' }).click();
await page.getByRole('button', { name: 'Enviar link agora' }).click();
await page.locator('#toast', { hasText: 'Link de pagamento enviado' }).waitFor();
const env = chamadas.filter(c => c.acao === 'agenda_pagamento_enviar').pop();
ok(env && String(env.dados.id) === '11' && Object.keys(env.dados).join() === 'id', '"Enviar link agora": agenda_pagamento_enviar só com o id da consulta');
await cartao('Bruno Lima').getByRole('button', { name: 'Editar' }).click();
ok(await page.getByRole('button', { name: 'Enviar link agora' }).count() === 0, 'consulta paga: sem "Enviar link agora"');
await page.close();

// 3. botão da clínica desligado
estado.ligado = false;
page = await abrirPainel();
await page.click('#agNovo');
ok(await page.locator('#agEnviarLink').isHidden(), 'com o link de pagamento desligado, a opção não aparece');
await cartao('Ana Souza').getByRole('button', { name: 'Editar' }).click();
ok(await page.getByRole('button', { name: 'Enviar link agora' }).count() === 0, 'com o link de pagamento desligado, sem "Enviar link agora"');
await page.close();

// 4. modo médicos: médico que está como "paga no consultório" não tem a opção
estado.ligado = true; estado.medicos = true;
page = await abrirPainel();
await page.click('#agNovo');
const med = page.locator('#agForm select').first();
await med.selectOption('1');
ok(await page.locator('#agEnviarLink').isVisible(), 'modo médicos: com a Dra. Ana, a opção aparece');
await page.check('#agEnviarLink');
await med.selectOption('2');
ok(await page.locator('#agEnviarLink').isHidden() && !(await page.locator('#agEnviarLink').isChecked()), 'com o Dr. Bruno ("paga no consultório"), a opção some e desmarca');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: link de pagamento pedido pela equipe na nova consulta e no "Enviar link agora".');
process.exit(falhas ? 1 : 0);
