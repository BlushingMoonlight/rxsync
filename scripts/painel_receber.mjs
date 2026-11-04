// Painel (painel/): os ajustes da agenda e o receber dos pacientes (rxsync-sistema DEC-197), com o n8n SIMULADO aqui (nada sai para a
// internet; dados inventados):
//   1. o botão da Agenda é "Ajustes da agenda" e abre a página com esse título (antes "Horários");
//   2. Receber dos pacientes: a escolha "Meus links de pagamento" ou "Asaas da clínica" (o estado do Asaas); com os links,
//      nada do Asaas aparece (nem o valor padrão nem o valor do tipo); cada tipo de consulta aparece com o link dele ou
//      "usa o link geral" e abre o "Editar tipo de consulta" num toque; escolher o Asaas abre o "Conectar o Asaas"; com o
//      Asaas conectado, aparecem o bloco e os valores, e voltar aos links pede para desconectar (nível 2);
//   3. Conectar o Reservio: o token e o ID do negócio (opcional) desde o começo; "o token foi aceito, falta o negócio"
//      (token_ok) em tom neutro, nunca vermelho; o erro de verdade em vermelho; a clínica de teste continua com a
//      confirmação "só de teste" (R-12);
//   4. a lista de plataformas: Reservio, iClinic, Doctoralia, Feegow, Clinicorp e Outro; fora o Reservio, sem token nem
//      ID, e o botão "Link de agendamento do seu sistema"; sem o "Por enquanto, a integração funciona com o Reservio".
// Uso (precisa do Playwright): node scripts/painel_receber.mjs   (NAVEGADOR=webkit roda no motor do Safari)
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const E = { asaas: false, interna: false, conectar: null };
const chamadas = [];
const MEDICOS = () => ({ modo_medicos: true, funcoes_padrao: { paga_consultorio: false }, medicos: [{ id: 1, nome: 'Dra. Ana Teste', ativo: true, funcoes: {}, grade: [{ dia: 1, inicio: '08:00', fim: '12:00' }],
  tipos: [{ id: 5, nome: 'Primeira consulta', duracao_min: 40, ativo: true, link_pagamento: '', valor: null },
    { id: 6, nome: 'Retorno', duracao_min: 20, ativo: true, link_pagamento: 'https://pag.exemplo.com/retorno', valor: '200.00' }] }] });
const situacao = () => ({ ok: true, situacao: E.asaas ? { conectado: true, conta_nome: 'Clínica Teste', ambiente: 'sandbox', links_abertos: 1, pagos_30_dias: 2 } : { conectado: false } });
const status = () => ({ ok: true, conectado: false, plataformas: { reservio: 'Reservio' }, pedir_confirmacao_teste: E.interna });
function responder(caminho, b) {
  chamadas.push({ caminho, acao: b.acao, dados: b.dados || {} });
  if (caminho === 'autoedicao') {
    if (b.acao === 'abrir') return { ok: true, papel: 'dono', editaveis: { nome_exibicao: 'Clínica Ana Teste', fuso_horario: 'America/Sao_Paulo', func_pagamento_link: 'SIM', func_medicos: 'SIM', pagamento_link: 'https://pag.exemplo.com/geral', pagamento_valor_padrao: '300,00' },
      recursos: { medicos: true, pacientes: true } };
    if (b.acao === 'agenda_medicos_listar') return { ok: true, data: MEDICOS() };
    if (b.acao === 'agenda_tipo_salvar') return { ok: true, data: { ok: true } };
    return { ok: true, data: [] };
  }
  if (caminho === 'pagamento-clinica') { if (b.acao === 'desconectar') { E.asaas = false; return Object.assign(situacao(), { mensagem: 'Asaas desconectado.' }); } return situacao(); }
  if (caminho === 'integracao-agenda') return b.acao === 'conectar' ? Object.assign(status(), E.conectar) : status();
  return { ok: true, data: [] };
}
const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];
async function abrir(largura) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, hasTouch: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('painel_sessao', 'c'.repeat(64)); } catch (e) {} });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request(); if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url().slice(N8N.length), b)) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => erros.push(String(e)));
  return { ctx, page };
}
const visivel = async l => (await l.count()) > 0 && await l.first().isVisible();

// 1 e 2: só tocando, a partir da Agenda (celular)
let { ctx, page } = await abrir(390);
await page.goto(site.base + '/painel/#agenda'); await page.locator('#app').waitFor({ state: 'visible' });
const bAjustes = page.getByRole('button', { name: 'Ajustes da agenda', exact: true });
ok(await visivel(bAjustes), '1. a Agenda tem o botão "Ajustes da agenda"');
ok(!(await visivel(page.getByRole('button', { name: 'Horários', exact: true }))), '1. não há mais o botão "Horários"');
const larg = await page.evaluate(() => document.documentElement.scrollWidth);
ok(larg <= 390, '1. a 390 px a Agenda não rola para o lado (' + larg + ' px)');
await bAjustes.first().click();
await page.locator('section[data-tela="agenda/horarios"] h1').filter({ hasText: 'Ajustes da agenda' }).waitFor();
ok(true, '1. o botão abre a página "Ajustes da agenda"');
await page.getByRole('button', { name: /Receber dos pacientes/ }).click();
await page.locator('#pagModo').waitFor();
ok(await page.locator('#pagModo button[data-v="links"]').getAttribute('aria-pressed') === 'true', '2. sem o Asaas, a escolha é "Meus links de pagamento"');
ok(!(await visivel(page.locator('#pagAsaas'))) && !(await visivel(page.locator('#campo_pagamento_valor_padrao'))), '2. com os links, o Asaas e o valor padrão não aparecem');
await page.locator('#pagMedResumo .linha').first().waitFor();
const linhas = (await page.locator('#pagMedResumo .linha').allTextContents()).map(t => t.replace(/\s+/g, ' '));
ok(linhas.some(t => /Dra\. Ana Teste · Primeira consulta.*usa o link geral/.test(t)), '2. o tipo sem link diz "usa o link geral"');
ok(linhas.some(t => /Retorno.*pag\.exemplo\.com\/retorno/.test(t)), '2. o tipo com link mostra o link');
await page.locator('#pagMedResumo .linha', { hasText: 'Primeira consulta' }).click();
await page.locator('#tpLink').waitFor();
ok(!(await visivel(page.locator('#tpValor'))), '2. o "Editar tipo de consulta" abre num toque, sem o valor do Asaas');
await page.fill('#tpLink', 'https://pag.exemplo.com/primeira');
await page.getByRole('button', { name: 'Salvar', exact: true }).click();
await page.waitForTimeout(400);
const salvo = chamadas.filter(c => c.acao === 'agenda_tipo_salvar').pop();
ok(salvo && salvo.dados.id === 5 && salvo.dados.link_pagamento === 'https://pag.exemplo.com/primeira', '2. salvar manda o link do tipo (agenda_tipo_salvar)');
await page.locator('#pagModo button[data-v="asaas"]').click();
ok(await visivel(page.locator('#asaasChave')), '2. tocar em "Asaas da clínica" abre o "Conectar o Asaas"');
await ctx.close();

// 2: com o Asaas conectado (iPad)
E.asaas = true;
({ ctx, page } = await abrir(820));
await page.goto(site.base + '/painel/#agenda/horarios/pagamento'); await page.locator('#pagModo').waitFor();
await page.waitForFunction(() => document.querySelector('#pagModo button[data-v="asaas"]').getAttribute('aria-pressed') === 'true');
ok(await visivel(page.locator('#pagAsaas')) && await visivel(page.locator('#campo_pagamento_valor_padrao')), '2. com o Asaas, aparecem o bloco do Asaas e o valor da consulta');
await page.locator('#pagMedResumo .linha', { hasText: 'Retorno' }).waitFor();
ok(/R\$\s200,00 pelo Asaas/.test(await page.locator('#pagMedResumo .linha', { hasText: 'Retorno' }).textContent()), '2. com o Asaas, o tipo mostra o valor');
await page.locator('#pagMedResumo .linha', { hasText: 'Retorno' }).click();
ok(await visivel(page.locator('#tpValor')), '2. com o Asaas, o "Editar tipo de consulta" tem o valor do tipo');
await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
await page.locator('#pagModo button[data-v="links"]').click();
await page.locator('#confOk').waitFor();
ok(await page.locator('#confOk').textContent() === 'Desconectar', '2. voltar aos links pede para desconectar o Asaas (nível 2)');
await page.locator('#confOk').click();
await page.waitForFunction(() => document.querySelector('#pagModo button[data-v="links"]').getAttribute('aria-pressed') === 'true');
ok(chamadas.some(c => c.caminho === 'pagamento-clinica' && c.acao === 'desconectar') && !(await visivel(page.locator('#pagAsaas'))), '2. depois de confirmar, desconecta e volta aos links');
await ctx.close();

// 3 e 4: Conectar o Reservio e a lista de plataformas
for (const largura of [390, 1024]) {
  ({ ctx, page } = await abrir(largura));
  await page.goto(site.base + '/painel/#agenda/horarios/integracao/reservio'); await page.locator('#intToken').waitFor();
  ok(await visivel(page.locator('#intNeg')) && /ID do negócio \(opcional\)/.test(await page.locator('label[for="intNeg"]').textContent()), `3. ${largura} px: o token e o ID do negócio (opcional) desde o começo`);
  ok(!(await visivel(page.locator('#intTeste'))), `3. ${largura} px: a clínica de verdade não vê a confirmação "só de teste"`);
  ok(!(await page.locator('#intBox').textContent()).includes('Por enquanto'), `4. ${largura} px: sem o "Por enquanto, a integração funciona com o Reservio"`);
  const ops = await page.locator('#intPlat option').allTextContents();
  ok(['Reservio', 'iClinic', 'Doctoralia', 'Feegow', 'Clinicorp', 'Outro'].every(n => ops.includes(n)), `4. ${largura} px: a lista tem ${ops.join(', ')}`);
  await page.selectOption('#intPlat', 'iclinic');
  ok(!(await visivel(page.locator('#intToken'))) && !(await visivel(page.locator('#intNeg'))) && !(await visivel(page.getByRole('button', { name: 'Conectar', exact: true }))), `4. ${largura} px: o iClinic não pede token nem ID`);
  ok(/Com o iClinic, a assistente pode enviar aos pacientes o link de agendamento/.test(await page.locator('#intSemToken').textContent()), `4. ${largura} px: o texto diz o que a assistente pode fazer, sem prometer integração`);
  await page.locator('#intSemToken').getByRole('button', { name: 'Link de agendamento do seu sistema' }).click();
  await page.locator('section[data-tela="agenda/horarios/integracao/link"]').waitFor();
  ok(true, `4. ${largura} px: o botão leva a "Link de agendamento do seu sistema"`);
  await page.goBack(); await page.locator('#intPlat').waitFor();
  await page.selectOption('#intPlat', 'reservio');
  ok(await visivel(page.locator('#intToken')), `4. ${largura} px: voltando ao Reservio, o token aparece de novo`);
  E.conectar = { ok: false, token_ok: true, pedir_negocio: true, mensagem: 'O token funcionou, mas não consegui descobrir o negócio. Informe o ID do negócio no Reservio.' };
  await page.fill('#intToken', 'tok-de-teste-1234567890');
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await page.locator('#intBox .aviso').first().waitFor();
  const cls = await page.locator('#intBox .aviso').first().getAttribute('class');
  ok(!/perigo/.test(cls) && await page.locator('#intToken').inputValue() === 'tok-de-teste-1234567890', `3. ${largura} px: "token aceito, falta o ID" vem neutro (não vermelho), com o token ainda preenchido`);
  E.conectar = { ok: false, token_ok: true, escolher_negocio: [{ id: 'n1', nome: 'Consultório A' }, { id: 'n2', nome: 'Consultório B' }], mensagem: 'Sua conta tem mais de um negócio. Escolha qual a assistente vai usar.' };
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await page.locator('select#intNeg').waitFor();
  ok(!/perigo/.test(await page.locator('#intBox .aviso').first().getAttribute('class')) && (await page.locator('#intNeg option').count()) === 2, `3. ${largura} px: com mais de um negócio, a lista para escolher, em tom neutro`);
  E.conectar = { ok: false, mensagem: 'O Reservio recusou esse token. Confira se copiou inteiro.' };
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await page.waitForFunction(() => /recusou/.test(document.querySelector('#intBox .aviso') && document.querySelector('#intBox .aviso').textContent));
  ok(/perigo/.test(await page.locator('#intBox .aviso').first().getAttribute('class')), `3. ${largura} px: o erro de verdade continua vermelho`);
  await ctx.close();
}
// R-12 continua: a clínica de teste vê a confirmação
E.interna = true; E.conectar = null;
({ ctx, page } = await abrir(820));
await page.goto(site.base + '/painel/#agenda/horarios/integracao/reservio'); await page.locator('#intToken').waitFor();
ok(await visivel(page.locator('#intTeste')), '3. a clínica de teste continua com a confirmação "só de teste" (R-12)');
await ctx.close();
ok(!erros.length, 'nenhum erro de JavaScript na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
