// Central RXSync: testa pela tela o "Lembrar este aparelho" (DEC-109, no lugar do Face ID) e o prompt da prospecção, com
// o servidor SIMULADO (scripts/central_simulado.mjs):
//   1. a entrada é e-mail + senha + código; depois do código, o aparelho já fica lembrado, sem pergunta;
//   2. fechando e abrindo o app de novo, a Central entra direto (retomar), guarda a lembrança NOVA e avisa
//      (lembranca_usada); lembrança que o servidor não aceita é esquecida e volta a pedir senha + código;
//   3. Segurança mostra os aparelhos lembrados, sem nada de Face ID; "Sair" esquece este aparelho;
//   4. o nível 3 que pede a senha de novo abre a janela da senha e repete a ação uma vez;
//   5. Marketing: "Ver prompt completo" mostra as regras fixas travadas; "Testar conversa" mostra a resposta e "seria barrada".
// No localStorage, só a aparência e a lembrança; no sessionStorage, só a sessão.
// Uso (precisa do Playwright): node scripts/central_lembrar.mjs
import { abrirNavegador, servirSite, servidor, N8N, CHAVES_LIGADAS } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const L1 = '1'.repeat(64), L2 = '2'.repeat(64), L3 = '3'.repeat(64);
const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
const page = await ctx.newPage(); page.setDefaultTimeout(8000); const erros = [];
page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
let nivel3 = 0, aceitar = L1;
const chamadas = [];
const respostas = {
  entrar_codigo: { ok: true, sessao: 'a'.repeat(64), lembranca: L1 },
  retomar: d => d.lembranca === aceitar ? { ok: true, sessao: 'b'.repeat(64), lembranca: aceitar === L1 ? L2 : L3 } : { ok: false, esquecer: true, mensagem: 'Entre com a senha e o código.' },
  sessoes: { ok: true, dados: { sessoes: [{ id: 7, navegador: 'Mac · Chrome', ip: '10.0.0.1', criada_em: '2026-10-18T10:00:00Z', ultimo_uso_em: '2026-10-18T10:05:00Z', esta: true }],
    senha_trocada_em: '2026-10-17T10:00:00Z', aparelhos: [{ id: 3, nome: 'Mac · Chrome', criado_em: '2026-10-18T10:00:00Z', ultimo_uso_em: '2026-10-18T10:05:00Z', vence_em: '2026-11-17T10:05:00Z', ultimo_ip: '10.0.0.1', ultimo_nav: 'Mac · Chrome' }], aparelho_esta: 3 } },
  senha_reconfirmar: d => d.senha === 'senha-de-teste-123' ? { ok: true } : { ok: false, mensagem: 'E-mail, senha ou código não conferem.' },
  link_painel_novo: d => { nivel3++; return d._repetido ? { ok: true, mensagem: 'Pronto: o link vai para o e-mail do cadastro.' } : { ok: false, nivel: 3, pedir_senha: true, mensagem: 'Para esta confirmação, digite a senha de novo (a última foi há mais de 12 horas).' }; },
  prosp_prompt_ver: d => ({ ok: true, editavel: { texto: (d.rascunho && d.rascunho.ia && d.rascunho.ia.prompt_texto) || 'Você é a assistente virtual da RXSync…', origem: (d.rascunho && d.rascunho.ia && d.rascunho.ia.prompt_texto) ? 'campanha' : 'montado' },
    montado: 'Você é a assistente virtual da RXSync (montado).', fixas: 'REGRAS QUE NUNCA MUDAM:\n- Você é uma assistente virtual…', completo: 'tudo', contato_modelo: 'Dados do contato: negócio "[negócio]"…',
    modelo: 'gpt-x', max_tokens: 400, memoria: 20, aviso: '"Nunca diga", "Escrita" e o tamanho vêm dos campos da campanha.' }),
  prosp_simular: d => ({ ok: true, texto: 'Fica R$ 99 para você.', marca: 'INTERESSE', barrada: 'preco', origem: 'montado', _hist: d.historico })
};
await page.route(N8N, servidor(CHAVES_LIGADAS(), chamadas, respostas));
await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
const guardado = () => page.evaluate(() => ({ local: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])), sessao: Object.keys(sessionStorage) }));
await page.goto(site.base + '/central/');

// 1. senha + código: lembra sem perguntar
ok(await page.getByRole('button', { name: /Face ID/ }).count() === 0, 'a entrada não tem nada de Face ID');
await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
await page.fill('input.codigo', '123456'); await page.click('button[type=submit]'); await page.waitForSelector('#conteudo h1');
let g = await guardado();
ok(g.local.central_lembranca === L1 && chamadas.some(c => c.acao === 'lembranca_usada' && c.dados.lembranca === L1) && !(await page.locator('#camada [role=dialog]').count()),
  'depois do código, o aparelho fica lembrado sem perguntar (e avisa lembranca_usada)');
// 2. fechar e abrir o app: entra direto, com a lembrança nova
await page.evaluate(() => sessionStorage.clear()); await page.reload(); await page.waitForSelector('#conteudo h1');
g = await guardado();
ok(chamadas.some(c => c.acao === 'retomar' && c.dados.lembranca === L1) && g.local.central_lembranca === L2 && chamadas.some(c => c.acao === 'lembranca_usada' && c.dados.lembranca === L2),
  'abrindo de novo, entra direto (retomar) e guarda a lembrança nova');
ok(Object.keys(g.local).every(k => ['central_aparencia', 'central_lembranca'].includes(k)) && g.sessao.every(k => k === 'central_sessao'), 'no navegador, só a aparência, a lembrança e a sessão: ' + JSON.stringify(Object.keys(g.local)));
// 3. Segurança
await page.evaluate(() => { location.hash = 'seguranca'; });
await page.getByText('Aparelhos lembrados').first().waitFor();
ok((await page.locator('#conteudo').innerText()).includes('Mac · Chrome (este aparelho)') && !/Face ID/.test(await page.locator('#conteudo').innerText()), 'Segurança lista os aparelhos lembrados, sem Face ID');
// 4. nível 3 com a senha de novo
await page.evaluate(() => { location.hash = 'clientes/CLI-001'; });
await page.locator('#conteudo').getByRole('button', { name: 'Ações', exact: true }).first().click();
await page.locator('#camada .menu-acoes button', { hasText: 'Gerar um link novo do painel' }).first().click();
await page.locator('#c-nome-clinica').fill('Clínica Sorriso Odontologia Integrada'); await page.getByRole('button', { name: 'Gerar o link novo' }).click();
await page.locator('#c-senha-de-novo').fill('senha-de-teste-123'); await page.getByRole('button', { name: 'Continuar' }).click();
await page.waitForFunction(() => /o link vai para o e-mail/.test(document.getElementById('rapida').textContent || ''));
ok(nivel3 === 2 && chamadas.some(c => c.acao === 'senha_reconfirmar'), 'nível 3: pediu a senha, conferiu e repetiu a ação uma vez');
// 5. prompt da campanha
await page.evaluate(() => { location.hash = 'prospeccao/campanha/CMP-0001'; });
await page.getByRole('button', { name: 'Ver prompt completo' }).click();
await page.getByText('Regras que nunca mudam').first().waitFor();
ok(await page.locator('#camada .p-prompt.travado').count() >= 1, 'Ver prompt: as regras fixas aparecem travadas');
await page.locator('#camada .pe').getByRole('button', { name: 'Fechar' }).click();
await page.getByRole('button', { name: 'Testar conversa' }).click();
await page.locator('#t-msg').fill('Quanto custa?'); await page.getByRole('button', { name: 'Mandar' }).click();
await page.getByText('seria barrada: preço fora dos oficiais').waitFor();
const sim = chamadas.find(c => c.acao === 'prosp_simular');
ok(sim && sim.dados.campanha_id === 'CMP-0001' && sim.dados.historico.length === 1 && sim.dados.historico[0].role === 'user', 'Testar conversa: manda a campanha e a conversa, e mostra "seria barrada"');
await page.locator('#camada .pe').getByRole('button', { name: 'Fechar' }).click().catch(() => {});
// 6. lembrança recusada pelo servidor: esquece e pede senha + código
aceitar = 'nenhuma';
await page.evaluate(() => sessionStorage.clear()); await page.reload();
await page.locator('input[type=password]').waitFor();
g = await guardado();
ok(!g.local.central_lembranca && /senha e o código/.test(await page.locator('#entrada').innerText()), 'lembrança recusada: a página esquece e pede senha + código');
// 7. Sair esquece este aparelho
aceitar = L1;
await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
await page.fill('input.codigo', '123456'); await page.click('button[type=submit]'); await page.waitForSelector('#conteudo h1');
await page.evaluate(() => { location.hash = 'mais'; });
await page.locator('#conteudo button.linha', { hasText: 'Sair' }).first().click();
await page.locator('input[type=password]').waitFor();
g = await guardado();
const sair = chamadas.filter(c => c.acao === 'sair').pop();
ok(sair && sair.dados.esquecer === true && sair.dados.lembranca === L1 && !g.local.central_lembranca, 'Sair: manda esquecer este aparelho e apaga a lembrança');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: aparelho lembrado (lembrar, entrar direto, girar, esquecer, sair), nível 3 com a senha e o prompt da prospecção.');
process.exit(falhas ? 1 : 0);
