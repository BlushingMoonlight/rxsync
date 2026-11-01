// Central (rxsync-sistema #225, itens 26 a 28; DEC-179 e DEC-180): testa pela tela, com o n8n SIMULADO aqui:
//   1. a entrada com o app autenticador ativado: "Código do app autenticador" e "Usar um código de recuperação" (aceita
//      XXXXX-XXXXX e manda só letras e números);
//   2. Avisos: o texto de cada aviso, o não lido em destaque, "Marcar todos como lidos" (avisos_lidos), "Apagar"
//      (aviso_apagar com o id) e "Mandar alerta de teste" (aviso_teste);
//   3. Mais › Segurança: "Ativar o app autenticador" pede a senha, mostra o link do app Senhas e a chave, confere o código
//      (totp_ativar) e mostra os 10 códigos de recuperação; o cartão das notificações explica como instalar (no navegador);
//   4. Hoje: o cartão "Instale a Central no iPad", com "Agora não".
// Uso (precisa do Playwright): node scripts/central_avisos_app.mjs
import { abrirNavegador, servirSite, CHAVES_LIGADAS, servidor, N8N } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) falhas++; return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const chamadas = [];
const CODIGOS = Array.from({ length: 10 }, (_, i) => 'ABCDE-' + String(10000 + i));
const respostas = {
  entrar: { ok: true, desafio: 'd', app: true, mensagem: 'Digite o código de 6 dígitos que o app autenticador (app Senhas) mostra agora.' },
  totp_iniciar: d => d.senha === 'senha-de-teste-123' ? { ok: true, segredo: 'JBSWY3DPEHPK3PXP', otpauth: 'otpauth://totp/RXSync%20Central:x?secret=JBSWY3DPEHPK3PXP&issuer=RXSync%20Central' } : { ok: false, mensagem: 'Senha errada.' },
  totp_ativar: d => d.codigo === '123456' ? { ok: true, ativo: true, codigos: CODIGOS, mensagem: 'App autenticador ativado. Daqui em diante, o código de entrada vem do app.' } : { ok: false, mensagem: 'Código errado.' },
  aviso_teste: { ok: true, mensagem: 'Alerta de teste enviado. Ele chega em Avisos, como notificação e por e-mail.' },
};
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } }); const page = await ctx.newPage(); page.setDefaultTimeout(8000);
const erros = []; page.on('pageerror', e => erros.push(String(e)));
await page.route(N8N, servidor(CHAVES_LIGADAS(), chamadas, respostas));
await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
await page.goto(site.base + '/central/');
await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
// 1. entrada com o app
await page.getByRole('heading', { name: 'Código do app autenticador' }).waitFor();
await page.getByRole('button', { name: 'Usar um código de recuperação' }).click();
await page.fill('input.codigo', 'abcde-12345'); await page.click('button[type=submit]');
await page.waitForSelector('#conteudo h1');
ok(chamadas.find(c => c.acao === 'entrar_codigo')?.dados.codigo === 'ABCDE12345', 'entrada: com o app, o código de recuperação (com traço) vai só com letras e números');
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
// 3. Segurança: app autenticador
await page.goto(site.base + '/central/#seguranca'); await page.getByRole('button', { name: 'Ativar o app autenticador' }).click();
await page.locator('#c-senha').fill('senha-de-teste-123'); await page.getByRole('button', { name: 'Continuar' }).click();
await page.getByRole('link', { name: 'Abrir no app Senhas' }).waitFor();
ok((await page.getByRole('link', { name: 'Abrir no app Senhas' }).getAttribute('href')).startsWith('otpauth://totp/') && await page.getByText('JBSWY3DPEHPK3PXP').count() === 1, 'Segurança: o link do app Senhas e a chave para digitar');
await page.getByRole('textbox', { name: 'Código de 6 dígitos do app' }).fill('123456'); await page.getByRole('button', { name: 'Confirmar' }).click();
await page.getByText('ABCDE-10009').waitFor();
ok(await page.locator('.codigos-rec li').count() === 10, 'Segurança: os 10 códigos de recuperação aparecem uma vez');
ok(await page.getByText('As notificações só funcionam com a Central instalada').count() === 1, 'Segurança: no navegador, as notificações explicam como instalar');
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros[0] : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: entrada com o app, central de avisos, app autenticador e instalar.');
process.exit(falhas ? 1 : 0);
