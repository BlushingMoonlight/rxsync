// Central (rxsync-sistema #225, itens 26 a 28; DEC-179 e DEC-186): testa pela tela, com o n8n SIMULADO aqui:
//   1. a entrada pelo e-mail: "Código de entrada", o texto do servidor ("Mandei um código... e-mail de cadastro"), o código
//      de 6 dígitos vai só com números; nenhum "Usar um código de recuperação";
//   2. Avisos: o texto de cada aviso, o não lido em destaque, "Marcar todos como lidos" (avisos_lidos), "Apagar"
//      (aviso_apagar com o id) e "Mandar alerta de teste" (aviso_teste);
//   3. Mais › Segurança: sem o cartão do app autenticador; o cartão das notificações explica como instalar (no navegador);
//   4. Hoje: o cartão "Instale a Central no iPad", com "Agora não".
// Uso (precisa do Playwright): node scripts/central_avisos_app.mjs
import { abrirNavegador, servirSite, CHAVES_LIGADAS, servidor, N8N } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) falhas++; return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const chamadas = [];
const respostas = {
  entrar: { ok: true, desafio: 'd', mensagem: 'Mandei um código de 6 dígitos para o e-mail de cadastro da Central. Ele vale 10 minutos.' },
  aviso_teste: { ok: true, mensagem: 'Alerta de teste enviado. Ele chega em Avisos, como notificação e por e-mail.' },
};
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } }); const page = await ctx.newPage(); page.setDefaultTimeout(8000);
const erros = []; page.on('pageerror', e => erros.push(String(e)));
await page.route(N8N, servidor(CHAVES_LIGADAS(), chamadas, respostas));
await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
await page.goto(site.base + '/central/');
await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
// 1. entrada pelo e-mail
await page.getByRole('heading', { name: 'Código de entrada' }).waitFor();
ok(await page.getByText('Mandei um código de 6 dígitos para o e-mail de cadastro da Central.').isVisible() && !(await page.getByRole('button', { name: 'Usar um código de recuperação' }).count()), 'entrada: o código chega no e-mail de cadastro; sem código de recuperação');
await page.fill('input.codigo', '123456'); await page.click('button[type=submit]');
await page.waitForSelector('#conteudo h1');
ok(chamadas.find(c => c.acao === 'entrar_codigo')?.dados.codigo === '123456', 'entrada: o código de 6 dígitos vai ao servidor');
// 4. Hoje: instalar
ok(await page.getByText('Instale a Central no iPad').isVisible(), 'Hoje: o cartão "Instale a Central no iPad" aparece no navegador');
await page.getByRole('button', { name: 'Agora não' }).click();
ok(!(await page.getByText('Instale a Central no iPad').count()), 'Hoje: "Agora não" tira o cartão');
// 2. Avisos
await page.goto(site.base + '/central/#avisos'); await page.locator('.aviso-texto', { hasText: 'WhatsApp DESCONECTADO' }).waitFor();
ok(await page.locator('li.nao-lido').count() === 1 && await page.getByText('Central RXSync: entrada de iPad').count() === 1, 'Avisos: o texto de cada aviso, o não lido em destaque');
await page.getByRole('button', { name: 'Marcar todos como lidos' }).click();
await page.waitForTimeout(300); ok(chamadas.some(c => c.acao === 'avisos_lidos'), 'Avisos: "Marcar todos como lidos"');
await page.locator('li.nao-lido').getByRole('button', { name: 'Apagar' }).click();
await page.waitForTimeout(300); ok(chamadas.find(c => c.acao === 'aviso_apagar')?.dados.id === 7, 'Avisos: "Apagar" manda o id do aviso');
await page.getByRole('button', { name: 'Mandar alerta de teste' }).click();
await page.getByText('Alerta de teste enviado').waitFor(); ok(true, 'Avisos: "Mandar alerta de teste"');
// 3. Segurança: sem o app autenticador
await page.goto(site.base + '/central/#seguranca'); await page.getByRole('heading', { name: 'Aparelhos conectados' }).waitFor();
ok(!(await page.getByText('app autenticador').count()) && !chamadas.some(c => /^totp_/.test(c.acao)), 'Segurança: sem o cartão do app autenticador (DEC-186)');
ok(await page.getByText('As notificações só funcionam com a Central instalada').count() === 1, 'Segurança: no navegador, as notificações explicam como instalar');
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros[0] : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: entrada pelo e-mail, central de avisos, Segurança e instalar.');
process.exit(falhas ? 1 : 0);
