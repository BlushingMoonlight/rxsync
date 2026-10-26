// Central RXSync: testa pela tela a IA da Central (assistente ao lado e propostas, DEC-145), Análise › Métricas (DEC-146)
// e a ficha com a pausa do painel e os envios das conversas (DEC-147), com o servidor SIMULADO
// (scripts/central_simulado.mjs: nada sai para a internet, dados inventados). Confere:
//   1. painel ao lado (1180 px) sem cobrir a tela, o aviso fixo, a pergunta e o histórico (até 6 falas);
//   2. texto da IA só como texto (um <img onerror> não roda), tópicos;
//   3. propostas: nível 1 = o toque em Confirmar; nível 2 = janela com CONFIRMAR; nível 3 = travado até o nome; Descartar;
//      vencida sem botão; Desfazer;
//   4. espera: a resposta que demora mostra "Pensando… pode levar até uns 4 minutos." com o campo travado; a que chega
//      aos 3 min 50 s ainda aparece; a que passa do limite (4 min 30 s) mostra "O assistente não respondeu agora. Tente de
//      novo." e destrava o campo (relógio da página adiantado pelo Playwright, sem esperar de verdade);
//   5. limites e assistente desligado; nada da conversa no armazenamento do navegador; "Nova conversa" e sair limpam;
//   6. celular: tela cheia; "Perguntar ao assistente" na ficha; Ajustes (nível 2, travado sem a política); Métricas; ficha.
// Uso (precisa do Playwright): node scripts/central_assistente.mjs
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS, IA_RESPOSTA, DADOS, ficha } from './central_simulado.mjs';
let falhas = 0, conferidos = 0; const ok = (c, m) => { conferidos++; if (!c) { console.log('✗ ' + m); falhas++; } return c; };
const NOME = 'Clínica Sorriso Odontologia Integrada';
const SEM_RESPOSTA = 'O assistente não respondeu agora. Tente de novo.';
const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];

async function sessao({ largura = 1180, altura = 820, chaves = CHAVES_LIGADAS(), respostas = {}, relogio = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: altura }, hasTouch: true });
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  if (relogio) await page.clock.install();
  page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
  const chamadas = [];
  await entrar(page, site.base, chaves, chamadas, respostas);
  return { ctx, page, chamadas, chaves };
}
const painel = page => page.locator('#assistente');
async function abrirPainel(page) { await page.locator('#btn-assistente').click(); await painel(page).locator('#ia-texto').waitFor(); }
async function perguntar(page, texto) { await page.fill('#ia-texto', texto); await page.click('#ia-enviar'); }
const esperarFala = (page, n) => page.waitForFunction(k => document.querySelectorAll('#ia-falas .ia-fala').length >= k, n);
const ultima = (chamadas, acao) => ([...chamadas].reverse().find(c => c.acao === acao) || {}).dados;
async function chamada(page, chamadas, acao, desde) {
  for (let i = 0; i < 60; i++) { const c = chamadas.slice(desde).find(x => x.acao === acao); if (c) return c.dados; await page.waitForTimeout(50); }
  return null;
}

// ---------- 1 a 3: painel, pergunta, texto e propostas (iPad deitado)
{
  const { ctx, page, chamadas } = await sessao({ respostas: { assistente_perguntar: d => /img/.test(d.texto)
    ? { ok: true, texto: 'Veja: <img src=x onerror="window.__xss=1"> e <b>negrito</b>', propostas: [] } : IA_RESPOSTA() } });
  ok(await page.locator('#btn-assistente').isVisible(), 'topo: o botão "Assistente" com a chave ligada');
  await abrirPainel(page);
  const caixa = await painel(page).boundingBox(), cont = await page.locator('#conteudo').boundingBox();
  ok(caixa && caixa.x >= 1180 - 381 && cont && cont.x + cont.width <= caixa.x + 1, 'iPad deitado: o painel fica à direita, sem cobrir a tela');
  ok(await page.locator('#app').evaluate(e => e.classList.contains('recolhida')), 'iPad deitado: o menu recolhe com o painel aberto');
  ok(/Usa a OpenAI\. Nunca recebe CPF, CNPJ, senhas, chaves, dados de pacientes/.test(await painel(page).locator('.ia-aviso').innerText()), 'o aviso fixo no alto do painel');
  await perguntar(page, 'Quantas clínicas estão no ar?');
  await esperarFala(page, 2);
  const p1 = ultima(chamadas, 'assistente_perguntar');
  ok(p1 && p1.texto === 'Quantas clínicas estão no ar?' && Array.isArray(p1.historico) && p1.historico.length === 0, 'perguntar: manda o texto e o histórico vazio');
  ok(await painel(page).locator('.ia-fala.assistente .ia-texto li').count() === 2, 'resposta: as linhas com "- " viram tópicos');
  ok(await painel(page).locator('.ia-proposta').count() === 3, 'resposta: as 3 propostas viram cartões');
  ok(/Franquia por mês/.test(await painel(page).locator('.ia-proposta').first().innerText()), 'proposta: o nome do campo em português na tabela Agora × Depois');
  // Histórico: a 2ª pergunta leva as 2 falas de antes.
  await perguntar(page, 'E quanto entra por mês?'); await esperarFala(page, 4);
  const p2 = ultima(chamadas, 'assistente_perguntar');
  ok(p2.historico.length === 2 && p2.historico[0].papel === 'jean' && p2.historico[1].papel === 'assistente', 'histórico: a 2ª pergunta leva as falas de antes (jean e assistente)');
  // Nível 1: o toque em Confirmar no cartão já é a confirmação (sem janela).
  const cartoes = painel(page).locator('.ia-fala.assistente').last().locator('.ia-proposta');
  let desde = chamadas.length;
  await cartoes.nth(0).getByRole('button', { name: 'Confirmar', exact: true }).click();
  let d = await chamada(page, chamadas, 'proposta_confirmar', desde);
  ok(d && d.proposta_id === '11' && !d.confirmacao && await page.locator('#camada .janela').count() === 0, 'nível 1: o toque em Confirmar manda a proposta, sem janela e sem CONFIRMAR');
  await page.waitForFunction(() => /confirmada/.test(document.querySelectorAll('#ia-falas .ia-fala.assistente')[1].querySelectorAll('.ia-proposta')[0].innerText));
  ok(await cartoes.nth(0).getByRole('button', { name: 'Desfazer' }).count() === 1, 'confirmada: o cartão mostra "confirmada" e "Desfazer"');
  // Nível 2: a janela com Agora × Depois e Confirmar.
  desde = chamadas.length;
  await cartoes.nth(1).getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.waitForSelector('#camada .janela');
  ok(/Nível 2/.test(await page.locator('#camada .janela .nivel').innerText()), 'nível 2: a janela mostra o nível');
  await page.click('#camada .janela button[type=submit]');
  d = await chamada(page, chamadas, 'proposta_confirmar', desde);
  ok(d && d.proposta_id === '12' && d.confirmacao === 'CONFIRMAR', 'nível 2: manda confirmacao CONFIRMAR');
  // Nível 3: travado até o nome certo.
  desde = chamadas.length;
  await cartoes.nth(2).getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.waitForSelector('#camada .janela #c-nome-clinica');
  const conf = page.locator('#camada .janela button[type=submit]');
  ok(await conf.isDisabled(), 'nível 3: o botão começa travado');
  await page.fill('#camada #c-nome-clinica', 'outra clínica'); ok(await conf.isDisabled(), 'nível 3: nome errado não destrava');
  await page.fill('#camada #c-nome-clinica', NOME.toUpperCase()); await conf.click();
  d = await chamada(page, chamadas, 'proposta_confirmar', desde);
  ok(d && d.proposta_id === '13' && d.confirmacao === 'CONFIRMAR' && d.confirmacao_nome === NOME.toUpperCase(), 'nível 3: manda CONFIRMAR e o nome');
  // Descartar (numa resposta nova).
  await perguntar(page, 'De novo'); await esperarFala(page, 6);
  desde = chamadas.length;
  const ult = painel(page).locator('.ia-fala.assistente').last().locator('.ia-proposta');
  await ult.nth(0).getByRole('button', { name: 'Descartar' }).click();
  d = await chamada(page, chamadas, 'proposta_descartar', desde);
  ok(d && d.proposta_id === '11', 'descartar: manda proposta_descartar');
  await page.waitForFunction(() => /descartada/.test(document.querySelectorAll('#ia-falas .ia-fala.assistente')[2].querySelector('.ia-proposta').innerText));
  ok(await ult.nth(0).getByRole('button', { name: 'Confirmar' }).count() === 0, 'descartada: sem Confirmar');
  // Texto da IA só como texto.
  await perguntar(page, 'teste img'); await esperarFala(page, 8);
  ok(await page.evaluate(() => window.__xss) === undefined && await painel(page).locator('img, b').count() === 0 && /<img src=x/.test(await painel(page).locator('.ia-fala.assistente').last().innerText()),
    'texto da IA: um <img onerror> aparece como texto e não roda');
  // Nada da conversa no navegador.
  const guardado = await page.evaluate(() => JSON.stringify({ s: Object.entries(sessionStorage), l: Object.entries(localStorage) }));
  ok(!/clínicas estão no ar|Pela tela Clientes|proposta/i.test(guardado), 'nada da conversa no sessionStorage nem no localStorage');
  // Nova conversa limpa; Escape fecha.
  await painel(page).getByRole('button', { name: 'Nova conversa' }).click();
  ok(await painel(page).locator('.ia-fala').count() === 0, '"Nova conversa" limpa a conversa');
  await page.keyboard.press('Escape');
  ok(await painel(page).isHidden() && !(await page.locator('#app').evaluate(e => e.classList.contains('recolhida'))), 'Escape fecha o painel e o menu volta como estava');
  await ctx.close();
}

// ---------- 3b: proposta vencida, limites, desligado e sair
{
  let resp = { ok: true, texto: 'Proposta antiga.', propostas: [{ id: 21, acao: 'editar_limites', resumo: 'Vencida', nivel: 1, vence_em: new Date(Date.now() - 60000).toISOString(), antes: {}, depois: { campos: { franquia_mensagens: '7000' } } }] };
  const { ctx, page } = await sessao({ respostas: { assistente_perguntar: () => resp } });
  await abrirPainel(page);
  await perguntar(page, 'x'); await esperarFala(page, 2);
  await page.waitForTimeout(1100);
  const c = painel(page).locator('.ia-proposta');
  ok(/vencida/.test(await c.innerText()) && await c.getByRole('button', { name: 'Confirmar' }).count() === 0, 'vencida (30 minutos): sem Confirmar');
  resp = { ok: false, limite: true, mensagem: 'Muitas perguntas seguidas: espere um minuto.' };
  await perguntar(page, 'y'); await esperarFala(page, 4);
  ok(/espere um minuto/.test(await painel(page).locator('.ia-fala.erro').last().innerText()), 'limite: a mensagem do servidor aparece');
  resp = { ok: false, desligada: true, chave: 'tela_assistente', mensagem: 'O assistente está desligado.' };
  await perguntar(page, 'z'); await esperarFala(page, 6);
  ok(/está desligado/.test(await painel(page).locator('.ia-fala.erro').last().innerText()) && !(await page.locator('#ia-texto').isDisabled()), 'desligado: a mensagem aparece e o campo destrava');
  // Sair: a conversa some.
  await page.evaluate(() => { location.hash = 'hoje'; });
  await page.locator('#lateral').getByRole('button', { name: 'Sair' }).click();
  await page.waitForSelector('input[type=email]');
  ok(await painel(page).isHidden() && await painel(page).locator('.ia-fala').count() === 0, 'sair: o painel fecha e a conversa some');
  await ctx.close();
}

// ---------- 4: a resposta que demora e a que passa do limite (relógio da página adiantado)
{
  let soltar; const pendente = () => new Promise(r => { soltar = r; });
  let espera = pendente();
  const { ctx, page } = await sessao({ relogio: true });
  // O 04 só responde quando o teste mandar (como o 06 fazendo as 4 rodadas).
  await page.route(/webhook\/central$/, async route => {
    const b = JSON.parse(route.request().postData() || '{}');
    if (b.acao !== 'assistente_perguntar') return route.fallback();
    const o = await espera;
    if (o === 'cortar') return route.abort('timedout').catch(() => {});
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) }).catch(() => {});
  });
  await abrirPainel(page);
  await perguntar(page, 'Uma pergunta que demora');
  await page.waitForSelector('#ia-pensando:not(:empty)');
  ok((await page.locator('#ia-pensando').innerText()).includes('Pensando… pode levar até uns 4 minutos.'), 'demora: "Pensando… pode levar até uns 4 minutos."');
  ok(await page.locator('#ia-texto').isDisabled() && await page.locator('#ia-enviar').isDisabled(), 'demora: o campo e o Enviar ficam travados');
  await page.clock.fastForward('03:50');
  ok(await page.locator('#ia-pensando').innerText().then(t => /Pensando/.test(t)) && await page.locator('.ia-fala.erro').count() === 0, 'demora: aos 3 min 50 s ainda espera (não corta antes)');
  soltar({ ok: true, texto: 'Resposta que veio aos 3 min 50 s.', propostas: [] });
  await page.getByText('Resposta que veio aos 3 min 50 s.').waitFor();
  ok(!(await page.locator('#ia-texto').isDisabled()) && await page.locator('#ia-pensando').innerText() === '', 'demora: a resposta de 3 min 50 s aparece e o campo destrava');
  // Passa do limite: aos 4 min 20 s ainda espera; depois de 4 min 30 s, "não respondeu" e o campo destrava.
  espera = pendente();
  await perguntar(page, 'Outra que não volta');
  await page.waitForSelector('#ia-pensando:not(:empty)');
  await page.clock.fastForward('04:20');
  ok(await page.locator('.ia-fala.erro').count() === 0 && await page.locator('#ia-texto').isDisabled(), 'limite: aos 4 min 20 s ainda espera');
  await page.clock.fastForward('00:15');
  await page.locator('.ia-fala.erro').waitFor();
  ok((await page.locator('.ia-fala.erro').innerText()).includes(SEM_RESPOSTA), 'limite: passou de 4 min 30 s, "O assistente não respondeu agora. Tente de novo."');
  ok(!(await page.locator('#ia-texto').isDisabled()) && !(await page.locator('#ia-enviar').isDisabled()) && await page.locator('#ia-pensando').innerText() === '', 'limite: o campo e o Enviar destravam');
  soltar({ ok: true, texto: 'tarde demais', propostas: [] });
  // Conexão cortada no meio (o Safari pode cortar antes): a mesma mensagem.
  espera = pendente();
  await perguntar(page, 'Uma que a conexão corta');
  await page.waitForSelector('#ia-pensando:not(:empty)');
  soltar('cortar');
  await page.waitForFunction(() => document.querySelectorAll('#ia-falas .ia-fala.erro').length === 2);
  ok((await page.locator('.ia-fala.erro').last().innerText()).includes(SEM_RESPOSTA), 'conexão cortada: a mesma mensagem de "não respondeu"');
  await ctx.close();
}

// ---------- 6: celular, ficha, Ajustes, Métricas
{
  const { ctx, page, chamadas } = await sessao({ largura: 390, altura: 844 });
  await abrirPainel(page);
  const caixa = await painel(page).boundingBox();
  ok(caixa && Math.round(caixa.x) === 0 && Math.round(caixa.width) === 390, 'celular: o assistente em tela cheia');
  // A conversa rola até a última proposta (o Confirmar dela dá para tocar).
  await perguntar(page, 'Quantas clínicas estão no ar?'); await esperarFala(page, 2);
  const desde = chamadas.length;
  await painel(page).locator('.ia-proposta').nth(2).getByRole('button', { name: 'Confirmar', exact: true }).click({ timeout: 4000 }).catch(() => {});
  ok(await page.locator('#camada .janela #c-nome-clinica').count() === 1, 'celular: a conversa rola e o Confirmar da última proposta abre a janela');
  await page.locator('#camada .janela').getByRole('button', { name: 'Cancelar' }).click();
  ok(!chamadas.slice(desde).some(c => c.acao === 'proposta_confirmar'), 'celular: Cancelar não manda a proposta');
  await painel(page).getByRole('button', { name: 'Fechar o assistente' }).click();
  ok(await painel(page).isHidden(), 'celular: "Fechar" volta para a tela');
  await ctx.close();
}
{
  let fichaExtra = {};
  const { ctx, page, chamadas, chaves } = await sessao({ respostas: { cliente: () => ({ ok: true, cliente: { ...ficha(), ...fichaExtra } }) } });
  await page.evaluate(() => { location.hash = 'clientes/CLI-001'; });
  await page.getByRole('button', { name: 'Perguntar ao assistente' }).click();
  ok(await page.inputValue('#ia-texto') === 'Sobre a CLI-001 (' + NOME + '): ', 'ficha: "Perguntar ao assistente" abre com o código e o nome da clínica');
  await page.keyboard.press('Escape');
  // Ficha: pausa feita pelo painel e envios das conversas.
  fichaExtra = { ativo: false, pausa_painel: { em: '2026-10-23 09:15', por: 'equipe' } };
  await page.evaluate(() => { location.hash = 'clientes/CLI-001/geral'; });
  await page.getByText('Assistente pausada pelo painel em').waitFor();
  ok(/23\/10.*09:15 \(equipe\)/.test(await page.locator('#conteudo .aviso', { hasText: 'pausada pelo painel' }).innerText()), 'ficha: a pausa do painel com a hora e o papel (sem e-mail)');
  await page.evaluate(() => { location.hash = 'clientes/CLI-001/historico'; });
  const env = page.locator('#conteudo .cartao', { has: page.getByRole('heading', { name: 'Envios das conversas' }) });
  await env.waitFor();
  ok(/enviado/.test(await env.innerText()) && /1\.840 mensagens/.test(await env.innerText()) && /falhou/.test(await env.innerText()) && /recusou o anexo/.test(await env.innerText()), 'ficha: os envios das conversas com a situação, as mensagens e o motivo');
  // Métricas.
  await page.evaluate(() => { location.hash = 'metricas'; });
  await page.getByRole('heading', { name: 'Custo de IA (Central e prospecção)' }).waitFor();
  const txt = await page.locator('#conteudo').innerText();
  ok(/MRR/.test(txt) && /Pagantes no ar/.test(txt) && /Ticket médio/.test(txt) && /Cancelamentos do mês/.test(txt) && /44,4%/.test(txt) && /6,5/.test(txt), 'Métricas: MRR, pagantes, ticket médio, cancelamentos, conversão e go-live');
  ok(/Mensagens do atendimento no mês/.test(txt) && /24\.830/.test(txt) && /O atendimento das clínicas não entra/.test(txt), 'Métricas: o custo de IA com as mensagens do atendimento ao lado e o aviso');
  ok(/Perguntas\s*37/.test(txt.replace(/\n/g, ' ')), 'Métricas: o uso do assistente');
  // Ajustes: grupo "IA da Central", ligar = nível 2; desligar = um toque.
  chaves.tela_assistente = 'NAO';
  await page.evaluate(() => { location.hash = 'ajustes'; });
  const sw = page.getByRole('switch', { name: 'Assistente (IA da Central)', exact: true });
  await sw.waitFor();
  ok(await page.locator('#conteudo .cartao', { has: page.getByRole('heading', { name: 'IA da Central' }) }).count() === 1, 'Ajustes: o grupo "IA da Central"');
  ok(await page.getByRole('switch', { name: 'Métricas', exact: true }).count() === 1, 'Ajustes: a chave "Métricas" com o nome legível');
  const desde = chamadas.length;
  await sw.click(); await page.waitForSelector('#camada .janela');
  ok(/Nível 2/.test(await page.locator('#camada .janela .nivel').innerText()) && /OpenAI/.test(await page.locator('#camada .janela').innerText()), 'Ajustes: ligar o assistente pede o nível 2, com o aviso da OpenAI');
  await page.click('#camada .janela button[type=submit]');
  const d = await chamada(page, chamadas, 'ligar_chave', desde);
  ok(d && d.chave === 'tela_assistente' && d.valor === 'SIM' && d.confirmacao === 'CONFIRMAR', 'Ajustes: liga com CONFIRMAR');
  await page.locator('#btn-assistente').waitFor();
  ok(true, 'Ajustes: ligado, o botão do assistente aparece no topo');
  await ctx.close();
}
{
  const ch = { ...CHAVES_LIGADAS(), tela_assistente: 'NAO', assistente_politica: 'NAO' };
  const { ctx, page } = await sessao({ chaves: ch, respostas: { metricas: { ok: true, dados: { ...DADOS.metricas.dados, custo_ia_mes: { ...DADOS.metricas.dados.custo_ia_mes, preco_preenchido: false } } } } });
  ok(await page.locator('#btn-assistente').count() === 0, 'chave desligada: sem o botão do assistente');
  await page.evaluate(() => { location.hash = 'ajustes'; });
  const linha = page.locator('#conteudo li', { hasText: 'Assistente (IA da Central)' });
  await linha.waitFor();
  ok(/Travado até a Política v18/.test(await linha.innerText()) && await linha.getByRole('switch').count() === 0, 'Ajustes: sem a assistente_politica, o assistente aparece travado');
  await page.evaluate(() => { location.hash = 'metricas'; });
  await page.getByText('Preencha o preço por mil tokens').waitFor();
  ok(await page.getByRole('link', { name: 'Abrir Custos' }).count() === 1, 'Métricas sem o preço: a nota do J-37 com o link para Custos');
  await ctx.close();
}

ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(`${conferidos} conferências. ` + (falhas ? falhas + ' falha(s).' : 'Tudo certo.'));
process.exit(falhas ? 1 : 0);
