// Central (rxsync-sistema #225, itens 26 a 28; DEC-179 e DEC-186): testa pela tela, com o n8n SIMULADO aqui:
//   1. a entrada pelo e-mail: "Código de entrada", o texto do servidor ("Mandei um código... e-mail de cadastro"), o código
//      de 6 dígitos vai só com números; nenhum "Usar um código de recuperação";
//   2. Avisos: o texto de cada aviso, o não lido em destaque, "Marcar todos como lidos" (avisos_lidos), "Apagar"
//      (aviso_apagar com o id) e "Mandar alerta de teste" (aviso_teste);
//   3. Mais › Segurança: sem o cartão do app autenticador; o cartão das notificações explica como instalar (no navegador);
//   4. Hoje: o cartão "Instale a Central no iPad", com "Agora não".
// Uso (precisa do Playwright): node scripts/central_avisos_app.mjs
import { abrirNavegador, servirSite, CHAVES_LIGADAS, servidor, N8N, DADOS } from './central_simulado.mjs';
// Os tipos que o workflow 02 grava e que a Central não sabia nomear (auditoria de 01/11/2026, FD-25): cada um tem rótulo.
const TIPOS_02 = ['deploy_recusado', 'github_recusado', 'deploy_sem_prova', 'limpeza_falhou', 'coleta_recusada', 'lembrete_nao_saiu', 'link_conexao_nao_saiu', 'reenvio_sem_ip', 'encerramento_adiado',
  'contrato_sem_pagamento', 'contrato_parado', 'valor_nao_atualizado', 'recancelado', 'recancelamento_falhou', 'pedido_asaas_falhou', 'conversas_falhou', 'conversas_enviadas', 'pago_em_dobro',
  'contatos_chatwoot_ficaram', 'contatos_antigos', 'taxa_recebida'];
const MAIS = Array.from({ length: 60 }, (_, i) => ({ id: 1000 + i, recebido_em: new Date(Date.now() - (3 + i) * 86400000).toISOString(), categoria: 'sistema', tipo: TIPOS_02[i % TIPOS_02.length], cliente_id: '', texto: 'Aviso antigo ' + (i + 1), lido: true }));
let falhas = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) falhas++; return c; };
const site = await servirSite(); const browser = await abrirNavegador();
const chamadas = [];
const respostas = {
  entrar: { ok: true, desafio: 'd', mensagem: 'Mandei um código de 6 dígitos para o e-mail de cadastro da Central. Ele vale 10 minutos.' },
  aviso_teste: { ok: true, mensagem: 'Alerta de teste enviado. Ele chega em Avisos, como notificação e por e-mail.' },
  avisos_ver: () => ({ ok: true, ...DADOS.avisos_ver, avisos: [...DADOS.avisos_ver.avisos, ...MAIS] }),
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
// 4. Hoje: instalar, no fim de Hoje (auditoria de 01/11/2026, FD-26); "Agora não" vale 30 dias neste aparelho (FD-02)
await page.getByText('Instale a Central', { exact: true }).waitFor();
ok(await page.evaluate(() => { const t = [...document.querySelectorAll('#conteudo h2, #conteudo h3, #conteudo .tit')].map(x => x.textContent.trim()); return t.indexOf('Instale a Central') > t.indexOf('Precisa da sua atenção') && t.indexOf('Precisa da sua atenção') >= 0; }),
  'Hoje: o cartão "Instale a Central" vem depois de "Precisa da sua atenção"');
await page.getByRole('button', { name: 'Agora não' }).click();
ok(!(await page.getByText('Instale a Central', { exact: true }).count()) && await page.evaluate(() => Number(localStorage.getItem('central_instalar_depois')) > 0), 'Hoje: "Agora não" tira o cartão e guarda a data (30 dias)');
await page.goto(site.base + '/central/#clientes'); await page.goto(site.base + '/central/'); await page.waitForSelector('#conteudo h1'); await page.waitForTimeout(400);
ok(!(await page.getByText('Instale a Central', { exact: true }).count()), 'Hoje: depois do "Agora não", o cartão não volta');
// 2. Avisos
await page.goto(site.base + '/central/#avisos'); await page.locator('.aviso-texto', { hasText: 'WhatsApp DESCONECTADO' }).waitFor();
ok(await page.locator('li.nao-lido').count() === 1 && await page.getByText('Central RXSync: entrada de iPad').count() === 1, 'Avisos: o texto de cada aviso, o não lido em destaque');
await page.getByRole('button', { name: 'Marcar todos como lidos' }).click();
await page.waitForTimeout(300); ok(chamadas.some(c => c.acao === 'avisos_lidos'), 'Avisos: "Marcar todos como lidos"');
await page.locator('li.nao-lido').getByRole('button', { name: 'Apagar' }).click();
await page.waitForTimeout(300); ok(chamadas.find(c => c.acao === 'aviso_apagar')?.dados.id === 7, 'Avisos: "Apagar" manda o id do aviso');
ok(await page.locator('h3.aviso-dia').count() >= 2, 'Avisos: agrupados por dia (FD-24)');
ok(await page.locator('.aviso-linha').count() === 50 && await page.getByRole('button', { name: 'Mostrar mais 50' }).count() === 1, 'Avisos: os 50 mais novos e "Mostrar mais 50"');
await page.getByRole('button', { name: 'Mostrar mais 50' }).click(); await page.waitForTimeout(400);
ok(await page.locator('.aviso-linha').count() > 50, 'Avisos: "Mostrar mais 50" mostra os seguintes');
ok(await page.evaluate(() => [...document.querySelectorAll('.aviso-linha .t1')].every(x => !/_/.test(x.textContent))), 'Avisos: nenhum aviso com o nome técnico do tipo (FD-25)');
ok(!(await page.getByRole('button', { name: 'Mandar alerta de teste' }).count()), 'Avisos: o "Mandar alerta de teste" não fica mais no fim da lista (FD-23)');
// 3. Segurança: sem o app autenticador
await page.goto(site.base + '/central/#seguranca'); await page.getByRole('heading', { name: 'Aparelhos conectados' }).waitFor();
ok(!(await page.getByText('app autenticador').count()) && !chamadas.some(c => /^totp_/.test(c.acao)), 'Segurança: sem o cartão do app autenticador (DEC-186)');
ok(await page.getByText('As notificações só funcionam com a Central instalada').count() === 1, 'Segurança: no navegador, as notificações explicam como instalar');
await page.getByRole('button', { name: 'Mandar alerta de teste' }).click();
await page.getByText('Alerta de teste enviado').waitFor(); ok(chamadas.some(c => c.acao === 'aviso_teste'), 'Segurança: "Mandar alerta de teste", junto das notificações (FD-23)');
ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros[0] : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: entrada pelo e-mail, central de avisos, Segurança e instalar.');
process.exit(falhas ? 1 : 0);
