// contratar.html: testa pela tela a contratação inteira, com o n8n SIMULADO aqui (nada sai para a internet). Só dados
// inventados: o CPF 000.000.001-91 e o CNPJ 11.222.333/0001-81 são números de exemplo (passam na conferência, não são
// de ninguém), e o código de origem é de mentira.
//   1. o plano e o ciclo vêm do endereço; o código de origem (?ref=PX-…) fica guardado na aba e avisa o clique uma vez;
//   2. com o aceite de cookies, o que vai ao Google Analytics não tem o ref (nem na página nem na anterior), mas tem o
//      plano e o ciclo;
//   3. cada etapa confere os campos (nome, e-mail, WhatsApp, CNPJ, CPF) antes de seguir;
//   4. a etapa 1 registra o contato e a etapa 3 só manda com os dois aceites; o cadastro vai com o plano, o ciclo, os
//      documentos só com dígitos, a versão dos Termos e a origem da prospecção;
//   5. "Voltar aos planos" leva o código para a página inicial, que também não o manda ao Google;
//   6. a regra de segurança (CSP) está ligada e bloqueia de verdade; em todas as etapas, com o CEP e o CNPJ (BrasilAPI
//      simulada), os Termos dentro da página e o Google Analytics (simulado) depois do aceite, nenhum bloqueio.
// Uso (precisa do Playwright): node scripts/contratar_fluxo.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, bloqueios, regraDa, provarBloqueio } from './csp_teste.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const REF = 'PX-AC3D7';
const site = await servirSite(); const browser = await abrirNavegador();
// A BrasilAPI simulada: o CEP 80000-000 e o CNPJ de exemplo.
const outras = url => url.startsWith('https://brasilapi.com.br/api/cep/v2/80000000') ? { status: 200, contentType: 'application/json', body: JSON.stringify({ street: 'Rua do CEP', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' }) }
  : url.startsWith('https://brasilapi.com.br/api/cnpj/v1/11222333000181') ? { status: 200, contentType: 'application/json', body: JSON.stringify({ razao_social: 'Clínica Teste Ltda' }) } : null;
const { ctx, chamadas: pedidos } = await contextoCsp(browser, { outras, responder: caminho => caminho === 'cadastro' ? { ok: true, cliente_id: 'RX-TESTE-0001' } : { ok: true },
  antes: { fn: () => { try { localStorage.setItem('rx_cookies', 'sim'); } catch (e) {} } } });
for (const p of ctx.pages()) await p.close();
const comBloqueio = [];
const anotar = async (p, onde) => { const b = await bloqueios(p); if (b.length) comBloqueio.push(onde + ': ' + b.join(' | ')); };
const nova = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(30000); p.on('pageerror', e => erros.push(String(e))); return p; };
const erros = [];
const chegou = async f => { for (const fim = Date.now() + 30000; Date.now() < fim; await new Promise(r => setTimeout(r, 50))) if (pedidos.some(f)) return pedidos.find(f); return null; };
// O que a página entregou ao Google Analytics (o script do Google não carrega aqui: só a fila de comandos).
const configGA = p => p.evaluate(() => (Array.from(window.dataLayer || []).map(a => Array.from(a)).find(a => a[0] === 'config') || [])[2] || null);
const marcado = (p, sel) => p.locator(sel).evaluate(b => b.className.includes('bg-primary-900'));

// 1 e 2. Plano, ciclo, código de origem e Google Analytics
let page = await nova();
await page.goto(site.base + `/contratar.html?plano=gestao&ciclo=anual&ref=${REF}`);
ok(await marcado(page, '[data-plano="gestao"]') && await marcado(page, '[data-ciclo="anual"]') && !(await marcado(page, '[data-plano="essencial"]')), 'o plano (Gestão) e o ciclo (anual) vêm do endereço');
ok(await page.evaluate(() => sessionStorage.getItem('rx_ref')) === REF, 'o código de origem fica guardado na aba (só o código)');
const clique = await chegou(p => p.caminho === 'prospeccao-clique');
ok(clique && clique.corpo.ref === REF && clique.origem === 'rxsync-site-2026', 'o clique da prospecção é avisado, só com o código');
ok(/default-src 'none'/.test(await regraDa(page)) && /frame-src 'self'/.test(await regraDa(page)) && await provarBloqueio(page), 'a regra de segurança está na página (com os Termos dentro) e bloqueia de verdade');
await page.waitForFunction(() => (window.dataLayer || []).some(a => a[0] === 'config'));
await page.waitForFunction(() => window.__gaCarregou === true);
ok(true, 'com o aceite, o script do Google (simulado) carrega');
let ga = await configGA(page);
ok(ga && !/ref=|PX-/.test(JSON.stringify(ga)) && /plano=gestao/.test(ga.page_location) && /ciclo=anual/.test(ga.page_location), 'Google Analytics: o endereço vai sem o ref, com o plano e o ciclo (' + (ga && ga.page_location || '').replace(site.base, '') + ')');

// 3. Etapa 1: os campos são conferidos antes de seguir
await page.locator('section[data-etapa="1"] .proximo').click();
ok(await page.locator('.msg-erro.on').count() >= 3 && await page.locator('section[data-etapa="1"]').evaluate(s => s.classList.contains('ativa')), 'etapa 1 vazia: mostra os erros e não segue');
await page.fill('#nome', 'Maria Teste Silva'); await page.fill('#clinica', 'Clínica Teste'); await page.fill('#email', 'maria@exemplo.test'); await page.fill('#whatsapp', '41999990000');
await page.locator('section[data-etapa="1"] .proximo').click();
await page.locator('section[data-etapa="2"].ativa').waitFor();
const lead = await chegou(p => p.caminho === 'cadastro' && p.corpo._evento === 'lead');
ok(lead && lead.corpo.plano === 'Gestao' && lead.corpo._ciclo === 'anual' && lead.corpo.telefone === '41999990000' && lead.corpo._origem === 'prospeccao ' + REF, 'etapa 1: o contato é registrado com o plano, o ciclo, o telefone só com dígitos e a origem da prospecção');

// Etapa 2: CNPJ e CPF conferidos
let buscou = false;
const etapa2 = async (cnpj, cpf) => {
  for (const [id, v] of [['cnpj', cnpj], ['razao', 'Clínica Teste Ltda'], ['cep', '80000-000'], ['cpf', cpf]]) await page.fill('#' + id, v);
  if (!buscou) { await page.locator('#blocoEndereco:not(.hidden)').waitFor(); buscou = await page.inputValue('#logradouro') === 'Rua do CEP'; ok(buscou, 'o CEP busca o endereço (BrasilAPI simulada)'); }
  await page.evaluate(() => { document.getElementById('blocoEndereco').className = 'space-y-4'; });
  for (const [id, v] of [['logradouro', 'Rua de Teste'], ['numero', '10'], ['bairro', 'Centro'], ['cidade', 'Curitiba'], ['uf', 'PR']]) await page.fill('#' + id, v);
  await page.locator('section[data-etapa="2"] .proximo').click();
};
await etapa2('11.222.333/0001-80', '000.000.001-90');
ok(await page.locator('#cnpj.erro').count() === 1 && await page.locator('#cpf.erro').count() === 1 && await page.locator('section[data-etapa="2"].ativa').count() === 1, 'etapa 2: CNPJ e CPF com dígito errado são recusados');
await etapa2('11.222.333/0001-81', '000.000.001-91');
await page.locator('section[data-etapa="3"].ativa').waitFor();
ok(true, 'etapa 2: com CNPJ e CPF válidos, segue para os Termos');
await page.frameLocator('#frameTermos').locator('[data-cli="rep"]').filter({ hasText: 'Maria Teste Silva' }).waitFor({ state: 'attached' });
ok(true, 'os Termos aparecem dentro da página, com os dados de quem contrata');
await anotar(page, 'etapas 1 a 3');

// 4. Etapa 3: só manda com os dois aceites
await page.click('#btnTeste');
await page.locator('#erroAceite:not(.hidden)').waitFor();
ok(!pedidos.some(p => p.corpo._evento === 'aceite'), 'sem os aceites, mostra o aviso e não manda nada');
await page.check('#aceiteTermos'); await page.check('#aceiteDpa'); await page.click('#btnTeste');
await page.locator('#sucesso:not(.hidden)').waitFor();
const aceite = await chegou(p => p.caminho === 'cadastro' && p.corpo._evento === 'aceite');
ok(aceite && aceite.corpo.modalidade === 'teste' && aceite.corpo.cliente_id === 'RX-TESTE-0001' && aceite.corpo.plano === 'Gestao' && aceite.corpo._ciclo === 'anual',
  'teste grátis: o cadastro vai com o plano, o ciclo e o código do contato da etapa 1');
ok(aceite && aceite.corpo.cnpj === '11222333000181' && aceite.corpo.representante_cpf === '00000000191' && aceite.corpo.telefone === '41999990000', 'CNPJ, CPF e telefone vão só com dígitos');
ok(aceite && aceite.corpo.versao_termos === '2026-10-v6' && aceite.corpo.aceite_dpa === 'SIM' && aceite.corpo._origem === 'prospeccao ' + REF && aceite.origem === 'rxsync-site-2026', 'com a versão dos Termos, o aceite do acordo de dados e a origem da prospecção');
ok(await page.locator('#sucessoTitulo').textContent() === 'Teste grátis registrado', 'a tela de sucesso do teste grátis aparece');
await anotar(page, 'aceite e sucesso');

// 5. Na mesma aba: o código guardado continua valendo, e "Voltar aos planos" o leva à página inicial, que também não o
// manda ao Google (nem no endereço da página anterior, que tinha o ref).
const cliques = pedidos.filter(p => p.caminho === 'prospeccao-clique').length;
await page.goto(site.base + '/contratar.html?plano=essencial&ciclo=mensal');
ok(await page.getAttribute('#voltarPlanos', 'href') === `/?ref=${REF}#precos`, 'voltando sem o ref no endereço, o código guardado na aba continua valendo');
await page.goto(site.base + `/contratar.html?plano=essencial&ciclo=mensal&ref=${REF}`);
await page.click('#voltarPlanos');
await page.waitForURL(u => u.pathname === '/');
await page.waitForFunction(() => (window.dataLayer || []).some(a => a[0] === 'config'));
ga = await configGA(page);
ok(ga && !/ref=|PX-/.test(JSON.stringify(ga)) && /contratar\.html\?plano=essencial&ciclo=mensal$/.test(ga.page_referrer), 'página inicial: nem o endereço nem o da página anterior levam o ref ao Google (' + (ga && ga.page_referrer || '').replace(site.base, '') + ')');
ok(await page.evaluate(() => document.referrer.includes('ref=')), '(a página anterior tinha mesmo o ref no endereço)');
ok(pedidos.filter(p => p.caminho === 'prospeccao-clique').length === cliques, 'o clique da prospecção não é avisado de novo');
await anotar(page, 'página inicial');
ok(!comBloqueio.length, 'com a regra ligada, nenhum bloqueio em toda a contratação' + (comBloqueio.length ? ': ' + comBloqueio.join(' · ') : ''));
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: contratação pela tela, com o ref guardado e fora do Google Analytics.');
process.exit(falhas ? 1 : 0);
