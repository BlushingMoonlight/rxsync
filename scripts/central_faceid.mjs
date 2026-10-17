// Central RXSync: testa pela tela o Face ID (passkey) e o prompt da prospecção, com o servidor SIMULADO
// (scripts/central_simulado.mjs) e um autenticador VIRTUAL do Chromium (faz o papel do Face ID do iPad).
//   1. a entrada oferece "Entrar com Face ID" quando o servidor diz que dá; "Entrar com senha e código" continua;
//   2. depois do código, a Central oferece ativar; a passkey é criada com o rosto (userVerification) e vai ao servidor
//      só a chave pública;
//   3. saindo e voltando, "Entrar com Face ID" assina o desafio; a assinatura é conferida aqui como no servidor;
//   4. o nível 3 que pede a senha de novo abre a janela da senha e repete a ação uma vez;
//   5. Marketing: "Ver prompt completo" mostra as regras fixas travadas; "Testar conversa" mostra a resposta e "seria barrada".
// Nada vai para o localStorage além da aparência, nem para o sessionStorage além da sessão.
// Uso (precisa do Playwright): node scripts/central_faceid.mjs
import crypto from 'node:crypto';
import { abrirNavegador, servirSite, servidor, N8N, CHAVES_LIGADAS } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = t => Buffer.from(String(t).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const site = await servirSite(); const browser = await abrirNavegador();
const porta = new URL(site.base).port, ORIGEM = 'http://localhost:' + porta, RP = 'localhost';   // no teste, o domínio é localhost
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
const page = await ctx.newPage(); page.setDefaultTimeout(8000); const erros = [];
page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('WebAuthn.enable');
await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true } });

const desafios = new Set(); let chavePublica = null, credencial = null, nivel3 = 0;
const novoDesafio = () => { const d = b64u(crypto.randomBytes(32)); desafios.add(d); return d; };
// Confere como o nó "Conferir Face ID" do workflow 04 (tipo, endereço, domínio, presença, rosto e assinatura).
function conferir(d, tipo) {
  const cdj = deB64u(d.client_data), ad = deB64u(d.authenticator_data), cd = JSON.parse(cdj.toString('utf8'));
  if (cd.type !== tipo || cd.origin !== ORIGEM || !desafios.delete(cd.challenge)) return 'desafio/tipo/endereço';
  if (!ad.subarray(0, 32).equals(crypto.createHash('sha256').update(RP).digest())) return 'domínio';
  if ((ad[32] & 0x05) !== 0x05) return 'rosto';
  if (tipo === 'webauthn.get') {
    const chave = crypto.createPublicKey({ key: chavePublica, format: 'der', type: 'spki' });
    if (!crypto.verify('sha256', Buffer.concat([ad, crypto.createHash('sha256').update(cdj).digest()]), chave, deB64u(d.assinatura))) return 'assinatura';
  }
  return '';
}
const chamadas = [];
const respostas = {
  estado: { ok: true, tem_senha: true, face_id: true },
  aparelho_desafio: () => ({ ok: true, desafio: novoDesafio(), rp_id: RP, rp_nome: 'Central RXSync', usuario_id: b64u('central-teste'), usuario_nome: 'Central RXSync' }),
  aparelho_ativar: d => { const e = conferir(d, 'webauthn.create'); if (e) return { ok: false, mensagem: 'ativar: ' + e };
    chavePublica = deB64u(d.chave_publica); credencial = d.credencial_id; return { ok: true }; },
  retomar_desafio: () => ({ ok: true, desafio: novoDesafio(), rp_id: RP }),
  retomar: d => { if (d.credencial_id !== credencial) return { ok: false, mensagem: 'credencial errada' }; const e = conferir(d, 'webauthn.get');
    return e ? { ok: false, mensagem: 'retomar: ' + e } : { ok: true, sessao: 'b'.repeat(64) }; },
  senha_reconfirmar: d => d.senha === 'senha-de-teste-123' ? { ok: true } : { ok: false, mensagem: 'E-mail, senha ou código não conferem.' },
  link_painel_novo: d => { nivel3++; return d._repetido ? { ok: true, mensagem: 'Pronto: o link vai para o e-mail do cadastro.' } : { ok: false, nivel: 3, pedir_senha: true, mensagem: 'Para esta confirmação, digite a senha de novo (a última foi há mais de 12 horas).' }; },
  prosp_prompt_ver: d => ({ ok: true, editavel: { texto: (d.rascunho && d.rascunho.ia && d.rascunho.ia.prompt_texto) || 'Você é a assistente virtual da RXSync…', origem: (d.rascunho && d.rascunho.ia && d.rascunho.ia.prompt_texto) ? 'campanha' : 'montado' },
    montado: 'Você é a assistente virtual da RXSync (montado).', fixas: 'REGRAS QUE NUNCA MUDAM:\n- Você é uma assistente virtual…', completo: 'tudo', contato_modelo: 'Dados do contato: negócio "[negócio]"…',
    modelo: 'gpt-x', max_tokens: 400, memoria: 20, aviso: '"Nunca diga", "Escrita" e o tamanho vêm dos campos da campanha.' }),
  prosp_simular: d => ({ ok: true, texto: 'Fica R$ 99 para você.', marca: 'INTERESSE', barrada: 'preco', origem: 'montado', _hist: d.historico })
};
await page.route(N8N, servidor(CHAVES_LIGADAS(), chamadas, respostas));
await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
await page.goto(ORIGEM + '/central/');

// 1. entrada com Face ID e o caminho da senha
await page.getByRole('button', { name: 'Entrar com Face ID' }).waitFor();
ok(true, 'a entrada oferece "Entrar com Face ID"');
await page.getByRole('button', { name: 'Entrar com senha e código' }).click();
await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
await page.fill('input.codigo', '123456'); await page.click('button[type=submit]'); await page.waitForSelector('#conteudo h1');
// 2. ativar
await page.getByRole('button', { name: 'Ativar o Face ID' }).click();
await page.waitForFunction(() => /Face ID ativado/.test(document.getElementById('rapida').textContent || ''));
ok(!!chavePublica && !!credencial, 'ativar: a passkey foi criada e só a chave pública foi ao servidor');
const ativar = chamadas.find(c => c.acao === 'aparelho_ativar');
ok(ativar && !('assinatura' in ativar.dados) && Object.keys(ativar.dados).sort().join() === 'authenticator_data,chave_publica,client_data,credencial_id', 'ativar: só os 4 campos esperados');
// 3. sair e entrar pelo Face ID
await page.evaluate(() => sessionStorage.clear()); await page.reload();   // fechar e abrir o app de novo
await page.getByRole('button', { name: 'Entrar com Face ID' }).click();
await page.waitForSelector('#conteudo h1');
ok(chamadas.some(c => c.acao === 'retomar'), 'entrar pelo Face ID: a assinatura conferiu (como no servidor) e a Central abriu');
const guardado = await page.evaluate(() => ({ local: Object.keys(localStorage), sessao: Object.keys(sessionStorage) }));
ok(guardado.local.every(k => k === 'central_aparencia') && guardado.sessao.every(k => k === 'central_sessao'), 'nada do Face ID no navegador (só a aparência e a sessão): ' + JSON.stringify(guardado));
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
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: Face ID (ativar e entrar), nível 3 com a senha e o prompt da prospecção.');
process.exit(falhas ? 1 : 0);
