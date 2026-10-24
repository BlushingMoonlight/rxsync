// Página inicial (index.html), com o n8n, o chat e o Google Analytics SIMULADOS aqui (nada sai para a internet; dados
// inventados) e a regra de segurança (CSP) ligada:
//   1. a regra está na página e bloqueia de verdade (um script escrito depois não roda);
//   2. o aviso de cookies: "Aceitar" carrega o Google (simulado); "Preferências de cookies" mostra o aviso de novo;
//   3. os botões: o menu do celular, as abas e as respostas das Dúvidas, mensal e anual, "Falar com a equipe" e
//      "Peça uma demonstração" (levam ao formulário), o "Testar grátis" da calculadora e o "Começar" dos planos (levam
//      à contratação, com o plano e o ciclo);
//   4. o teste ao vivo (começar e mandar uma mensagem) e o formulário de demonstração;
//   5. o chat: abre ao toque (no botão e no "Pergunte no chat") e sozinho com ?suporte=1;
//   em todos, nenhum bloqueio da regra.
// Uso (precisa do Playwright): node scripts/index_csp.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, regraDa, provarBloqueio, conferidor } from './csp_teste.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const AGENDA = { dias: [{ id: 'd1', rotulo: 'Seg' }, { id: 'd2', rotulo: 'Ter' }], horas: ['09:00', '10:00'], ocupados: ['d1|09:00|0'] };
const responder = caminho => {
  if (caminho === 'mini-teste-iniciar') return { ok: true, sessao: 's'.repeat(32), restantes: 5, agenda: AGENDA, profissionais: ['Dra. Teste'], clinica: 'Clínica Teste', especialidade: 'Pediatria' };
  if (caminho === 'mini-teste-mensagem') return { ok: true, resposta: 'Olá! Posso ajudar a marcar uma consulta.', restantes: 4 };
  if (caminho === 'formulario-site') return { ok: true };
  return { ok: false };
};
const site = await servirSite(); const browser = await abrirNavegador();
const INICIO = site.base + '/';

// 1 e 2. A regra e o aviso de cookies
let { ctx, page, erros, chamadas } = await contextoCsp(browser, { responder, viewport: { width: 390, height: 844 } });
await page.goto(INICIO);
await page.locator('.rxc-aviso').waitFor();
const regra = await regraDa(page);
ok(/default-src 'none'/.test(regra) && !/script-src[^;]*unsafe/.test(regra) && await provarBloqueio(page), 'a regra está na página (scripts presos à lista) e bloqueia de verdade');
await semBloqueio(page, 'abrir a página (celular)');
await page.getByRole('button', { name: 'Aceitar' }).click();
await page.waitForFunction(() => window.__gaCarregou === true);
ok(true, '"Aceitar": o Google Analytics (simulado) carrega');
await page.locator('[data-cookies]').click();
await page.locator('.rxc-aviso').waitFor();
ok(true, '"Preferências de cookies" mostra o aviso de novo');
await page.getByRole('button', { name: 'Aceitar' }).click();
await semBloqueio(page, 'o aviso de cookies e o Google');

// 3. O menu do celular
await page.click('#mobile-menu-btn');
ok(await page.locator('#mobile-menu').evaluate(m => m.classList.contains('aberto')), 'o menu do celular abre');
await page.click('#mobile-menu-btn');
await semBloqueio(page, 'o menu do celular');
await ctx.close();

({ ctx, page, erros, chamadas } = await contextoCsp(browser, { responder, antes: { fn: () => { try { localStorage.setItem('rx_cookies', 'nao'); } catch (e) {} } } }));
await page.goto(INICIO);
// As Dúvidas: as abas e as respostas
await page.locator('#faq-tab-3').click();
ok(await page.locator('#faq-tab-3').getAttribute('aria-selected') === 'true' && await page.locator('#faq-panel-3').isVisible(), 'Dúvidas: a aba "Preço e contrato" abre');
const resposta = page.locator('#faq-panel-3 [data-faq]').first();
await resposta.click();
ok(await resposta.getAttribute('aria-expanded') === 'true', 'Dúvidas: a resposta abre ao toque');
await resposta.click();
ok(await resposta.getAttribute('aria-expanded') === 'false', 'Dúvidas: e fecha no segundo toque');
// Mensal e anual
await page.locator('button[data-ciclo="anual"]').click();
ok(await page.locator('button[data-ciclo="anual"]').getAttribute('aria-pressed') === 'true' && /ciclo=anual/.test(await page.locator('a[href^="/contratar.html"]').first().getAttribute('href')), 'Planos: "Anual" troca os preços e os links');
// Os botões do formulário
await page.locator('[data-form-plano="Enterprise"]').click();
await page.waitForFunction(() => document.getElementById('plano').value === 'Enterprise');
ok(true, '"Falar com a equipe" leva ao formulário com o plano Enterprise');
const antesUrl = page.url();
await page.locator('a[data-form-plano][data-parar]').click();
ok(page.url() === antesUrl, '"Peça uma demonstração" leva ao formulário sem mudar o endereço');
await semBloqueio(page, 'Dúvidas, planos e os botões do formulário');

// 4. O teste ao vivo
await page.selectOption('#mt_especialidade', { index: 1 });
await page.fill('#mt_clinica', 'Clínica Teste'); await page.fill('#mt_profissionais', 'Dra. Teste'); await page.fill('#mt_telefone', '41999990000');
await page.locator('#mtForm button[type="submit"], #mtBtn').first().click();
await page.locator('#mtTeste').waitFor({ state: 'visible' });
await page.fill('#mtTexto', 'Quero marcar uma consulta'); await page.click('#mtEnv');
await page.getByText('Olá! Posso ajudar a marcar uma consulta.').waitFor();
ok(chamadas.some(c => c.caminho === 'mini-teste-mensagem'), 'o teste ao vivo começa e responde (n8n simulado)');
await semBloqueio(page, 'o teste ao vivo');
// O formulário de demonstração
await page.fill('#nome', 'Maria Teste'); await page.fill('#clinica', 'Clínica Teste'); await page.fill('#email', 'maria@exemplo.test'); await page.fill('#telefone', '41999990000');
await page.locator('#btnFormDemo').click();
await page.getByText('Pedido recebido!').waitFor();
ok(chamadas.some(c => c.caminho === 'formulario-site' && c.corpo.email === 'maria@exemplo.test'), 'o formulário de demonstração envia (n8n simulado)');
await semBloqueio(page, 'o formulário de demonstração');

// 5. O chat: "Pergunte no chat"
await page.locator('[data-abre-chat]').click();
await page.waitForFunction(() => window.$chatwoot && window.$chatwoot.aberto);
ok(await page.locator('iframe.woot-widget-holder').count() === 1, '"Pergunte no chat": o chat (simulado) carrega e abre, com a janela da conversa');
await semBloqueio(page, 'o chat (janela, <style> e style= que ele põe na página)');

// 3 (fim). Os botões que levam à contratação
await page.locator('[data-contratar="gestao"]').click();
await page.waitForURL(u => u.pathname === '/contratar.html');
ok(/plano=gestao&ciclo=anual/.test(page.url()), '"Começar" do Gestão leva à contratação, com o plano e o ciclo escolhido (anual)');
await page.goto(INICIO);
await page.locator('[data-teste="essencial"][data-origem="calculadora"]').click();
await page.waitForURL(u => u.pathname === '/contratar.html');
ok(/plano=essencial/.test(page.url()), '"Testar grátis" da calculadora leva à contratação do Essencial');
await page.goto(INICIO);
await semBloqueio(page, 'os botões que levam à contratação');
await ctx.close();

// 5 (fim). O chat abre sozinho com ?suporte=1 (o link de suporte das outras páginas)
({ ctx, page, erros: erros } = await contextoCsp(browser, { responder }));
await page.goto(INICIO + '?suporte=1');
await page.waitForFunction(() => window.$chatwoot && window.$chatwoot.aberto);
ok(true, '?suporte=1: o chat abre sozinho');
await semBloqueio(page, '?suporte=1');
ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: a regra de segurança da página inicial está ligada e nada do que a página usa é bloqueado.');
process.exit(falhas() ? 1 : 0);
