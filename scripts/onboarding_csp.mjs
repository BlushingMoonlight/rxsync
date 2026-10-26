// Página onboarding.html, com o n8n SIMULADO aqui (nada sai para a internet; um token e dados inventados) e a regra de
// segurança (CSP) ligada:
//   1. a regra está na página e bloqueia de verdade (um script escrito depois não roda);
//   2. o formulário inteiro: as 6 etapas, a grade de horários (ligar o sábado, mais um horário, remover), mais uma
//      pergunta, a aprovação do responsável técnico e o envio, com a tela do fim;
//   3. com o aceite de cookies, o Google Analytics (simulado) carrega e recebe o endereço sem a query (sem o token);
//   4. o botão do chat abre a página inicial com o chat numa aba nova;
//   5. o link que não abre mostra a mensagem do servidor, e o "Tentar de novo" recarrega;
//   em todos, nenhum bloqueio da regra.
// Uso (precisa do Playwright): node scripts/onboarding_csp.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
import { contextoCsp, regraDa, provarBloqueio, conferidor } from './csp_teste.mjs';
const { ok, semBloqueio, falhas } = conferidor();
const TOKEN = 'ef'.repeat(32);
const estado = { abre: true };
const responder = (caminho, b) => {
  if (caminho !== 'onboarding' || b.token !== TOKEN) return { ok: false, mensagem: 'Link inválido.' };
  if (!estado.abre) return { ok: false, mensagem: 'Este link venceu. Peça um novo à RXSync.' };
  if (b.acao === 'abrir') return { ok: true, nome_exibicao: 'Clínica Teste', representante_nome: 'Maria Teste', plano: 'Gestão Inteligente' };
  if (b.acao === 'salvar') return { ok: true, link_conectar: 'https://rxsync.com.br/conectar.html?t=' + 'ab'.repeat(32) };
  return { ok: false };
};
const site = await servirSite(); const browser = await abrirNavegador();
const URL_ = site.base + '/onboarding.html?t=' + TOKEN;
const { ctx, page, erros, chamadas } = await contextoCsp(browser, { responder, antes: { fn: () => { try { localStorage.setItem('rx_cookies', 'sim'); } catch (e) {} } } });
await page.goto(URL_);
await page.locator('#telaForm:not(.hidden)').waitFor();
ok(/default-src 'none'/.test(await regraDa(page)) && await provarBloqueio(page), 'a regra está na página e bloqueia de verdade');
await semBloqueio(page, 'abrir o formulário');

// 3. Google Analytics, sem a query
await page.waitForFunction(() => window.__gaCarregou === true);
const ga = await page.evaluate(() => (Array.from(window.dataLayer || []).map(a => Array.from(a)).find(a => a[0] === 'config') || [])[2] || null);
ok(ga && !JSON.stringify(ga).includes(TOKEN) && /\/onboarding\.html$/.test(ga.page_location), 'com o aceite, o Google Analytics (simulado) carrega e recebe o endereço sem o token (' + (ga && ga.page_location || '').replace(site.base, '') + ')');

// 2. O formulário inteiro
const etapa = n => page.locator(`section[data-etapa="${n}"].ativa`).first();
const proximo = async n => { await page.locator(`section[data-etapa="${n}"] .proximo`).click(); await etapa(n + 1).waitFor(); };
ok(await page.inputValue('#nome_exibicao') === 'Clínica Teste', 'etapa 1: o nome vem do servidor');
await proximo(1);
await page.fill('#servicos', 'Consulta de rotina'); await page.fill('#politica_precos', 'Consulta particular: R$ 350.');
await proximo(2);
await page.check('#ab_sab');
await page.locator('#bx_sab:not(.hidden)').waitFor();
await page.locator('#bx_sab button').last().click();
ok(await page.locator('#fx_sab .faixa').count() === 2, 'etapa 3: ligar o sábado e pôr mais um horário');
await page.locator('#fx_sab .faixa').last().locator('input.fx-de').fill('13:00');
await page.locator('#fx_sab .faixa').last().locator('input.fx-ate').fill('14:00');
await page.locator('#fx_sab .faixa').last().getByRole('button', { name: 'remover' }).click();
ok(await page.locator('#fx_sab .faixa').count() === 1, 'etapa 3: remover o horário a mais');
await semBloqueio(page, 'a grade de horários');
await proximo(3); await proximo(4);
await page.fill('#numero_whatsapp', '41999990000'); await page.fill('#resp_tecnico_nome', 'Dra. Teste'); await page.fill('#resp_tecnico_conselho', 'CRM/PR 00000');
await proximo(5);
const perguntas = await page.locator('#listaFaq > *').count();
await page.click('#btnAddFaq');
ok(await page.locator('#listaFaq > *').count() === perguntas + 1, 'etapa 6: "Adicionar pergunta" põe mais uma');
await proximo(6);   // Confira suas respostas (molde F)
ok(/Dra\. Teste/.test(await page.locator('#resumo').textContent()), 'etapa 7: Confira suas respostas mostra o que foi preenchido');
await page.click('#btnEnviar');
await page.locator('#erroDeclaracao.on').waitFor();
ok(!chamadas.some(c => c.corpo.acao === 'salvar'), 'sem a aprovação do responsável técnico, não envia');
await page.check('#declaracao_rt'); await page.click('#btnEnviar');
await page.locator('#telaOk:not(.hidden)').waitFor();
const salvo = chamadas.find(c => c.corpo.acao === 'salvar');
ok(salvo && salvo.corpo.dados.horarios.sab && salvo.corpo.dados.horarios.sab.length === 1 && salvo.corpo.dados.servicos === 'Consulta de rotina', 'o envio leva os campos e a grade (com o sábado)');
ok(/\/conectar\.html\?t=/.test(await page.getAttribute('#linkConectar', 'href')), 'a tela do fim mostra o link para conectar o WhatsApp');
await semBloqueio(page, 'as 6 etapas e o envio');

// 4. O chat abre numa aba nova
const [nova] = await Promise.all([ctx.waitForEvent('page'), page.click('.rxc-chat')]);
await nova.waitForLoadState('domcontentloaded').catch(() => {});
ok(/\/\?suporte=1$/.test(nova.url()), 'o botão do chat abre a página inicial com o chat numa aba nova');
await nova.close();
await semBloqueio(page, 'o botão do chat');

// 5. Link que não abre
estado.abre = false;
await page.goto(URL_);
await page.getByText('Este link venceu. Peça um novo à RXSync.').waitFor();
await semBloqueio(page, 'link vencido');
await Promise.all([page.waitForEvent('load'), page.click('#btnTentarDeNovo')]);
await page.getByText('Este link venceu. Peça um novo à RXSync.').waitFor();
ok(true, '"Tentar de novo" recarrega a página');
await semBloqueio(page, '"Tentar de novo"');
ok(!erros.length, 'sem erro de script nem aviso da regra no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas() ? `${falhas()} falha(s).` : 'Tudo certo: a regra de segurança do onboarding.html está ligada e nada do que a página usa é bloqueado.');
process.exit(falhas() ? 1 : 0);
