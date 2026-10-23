// Painel (autoedicao.html): testa pela tela a entrada nova (DEC-097), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. sem sessão: e-mail + senha → código → o painel abre com a sessão no cabeçalho x-rxsync-painel, sem token;
//   2. "Lembrar este aparelho": a lembrança fica no aparelho e, numa aba nova, o painel abre sem senha (retomar);
//   3. Sair: encerra a sessão, esquece o aparelho e volta para a entrada;
//   4. link antigo (?t=): o painel abre com a faixa "Crie sua senha"; criar a senha pede os Termos v6 e tira o ?t=;
//   5. Conta › WhatsApp › Reconectar: o código aparece na tela e some quando conecta;
//   6. sessão vencida (resposta "entrar"): volta para a entrada com o aviso;
//   7. Termos atualizados (rxsync-sistema DEC-113): o painel pergunta (termos_estado) e mostra a faixa; aceitar pede a caixa.
// No navegador, só 'painel_sessao' (sessionStorage) e 'painel_lembranca' (localStorage).
// Uso (precisa do Playwright): node scripts/painel_entrada.mjs
import { abrirNavegador, servirSite, qrDeMentira } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64), LEMBRANCA = 'c'.repeat(64), LEMBRANCA2 = 'd'.repeat(64), TOKEN = 'PnlAabcdefghijkmnopqrstuvwxy';
const chamadas = []; const estado = { vencida: false, conectarVoltas: 0, termosPendente: false };
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', token: b.token || '', dados: b.dados || {} });
  if (caminho === 'painel-entrada') {
    const d = b.dados || {};
    if (b.acao === 'entrar') return d.senha === 'senha-certa-123' ? { ok: true, desafio: 'e'.repeat(48), mensagem: 'Mandamos um código para d•••@clinica.test.' } : { ok: false, mensagem: 'E-mail, senha ou código não conferem.' };
    if (b.acao === 'entrar_codigo') return d.codigo === '123456' ? { ok: true, sessao: SESSAO, lembranca: d.lembrar ? LEMBRANCA : null } : { ok: false, mensagem: 'E-mail, senha ou código não conferem.' };
    if (b.acao === 'retomar') return d.lembranca === LEMBRANCA ? { ok: true, sessao: SESSAO, lembranca: LEMBRANCA2 } : { ok: false, esquecer: true, mensagem: 'Entre com o e-mail e a senha.' };
    if (b.acao === 'senha_pedir_link') return { ok: true, desafio: 'f'.repeat(48), primeira: true, mensagem: 'Mandamos um código para o e-mail do cadastro (n•••@clinica.test).' };
    if (b.acao === 'senha_nova') return d.aceite_termos === true && d.versao_termos === '2026-10-v6' ? { ok: true, sessao: SESSAO, primeira: true, lembranca: null } : { ok: false, termos: true, mensagem: 'Marque os Termos.' };
    if (b.acao === 'termos_estado') return estado.termosPendente ? { ok: true, pendente: true, versao: '2026-10-v6', clientes_desde_texto: '20 de novembro de 2026' } : { ok: true, pendente: false, versao: '2026-10-v6' };
    if (b.acao === 'termos_aceitar') { estado.termosPendente = false; return d.aceite_termos === true && d.versao_termos === '2026-10-v6' ? { ok: true, pendente: false } : { ok: false, mensagem: 'Marque.' }; }
    return { ok: true, sair: b.acao === 'sair' };
  }
  if (caminho === 'conectar') {
    if (b.acao === 'qr') return { ok: true, status: 'pendente', qr: qrDeMentira() };
    return ++estado.conectarVoltas >= 2 ? { ok: true, status: 'conectado' } : { ok: true, status: 'pendente', qr: qrDeMentira() };
  }
  if (estado.vencida) return { ok: false, entrar: true, mensagem: 'Sua entrada no painel venceu.' };
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: 'Essencial', numero_whatsapp: '5548999990000' },
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'].map(k => [k, false])), limite_catalogo: 500 };
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const erros = [];
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
// Cada passo espera uma condição (a tela mudar ou o pedido chegar ao servidor simulado), nunca um tempo fixo; o LIMITE
// é só o teto de cada espera, para um computador ocupado não virar falha.
const LIMITE = 30000;
const chegou = async f => { for (const fim = Date.now() + LIMITE; Date.now() < fim; await new Promise(r => setTimeout(r, 50))) if (chamadas.some(f)) return true; return false; };
const nova = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(LIMITE); p.on('pageerror', e => erros.push(String(e))); return p; };
const guardado = p => p.evaluate(() => ({ local: Object.keys(localStorage), sessao: Object.keys(sessionStorage) }));
const PAINEL = site.base + '/autoedicao.html';

// 1. e-mail + senha + código, lembrando o aparelho
let page = await nova();
await page.goto(PAINEL);
await page.locator('#entrada').waitFor();
ok(await page.locator('#entEntrar').isVisible(), 'sem sessão: abre a entrada (e-mail e senha)');
await page.fill('#entEmail', 'dono@clinica.test'); await page.fill('#entSenha', 'senha-errada-0'); await page.click('#entEntrar button[type=submit]');
await page.getByText('não conferem').waitFor();
ok(true, 'senha errada: "não conferem"');
await page.fill('#entSenha', 'senha-certa-123'); await page.check('#entLembrar'); await page.click('#entEntrar button[type=submit]');
await page.locator('#entCodigo').waitFor({ state: 'visible' });
await page.fill('#entCod', '123456'); await page.click('#entCodigo button[type=submit]');
await page.locator('#app').waitFor({ state: 'visible' });
const abrir1 = chamadas.filter(c => c.acao === 'abrir').pop();
ok(abrir1 && abrir1.sessao === SESSAO && abrir1.token === '', 'o painel abre com a sessão no cabeçalho, sem token');
ok(await chegou(c => c.acao === 'lembranca_usada' && c.dados.lembranca === LEMBRANCA), 'a página confirma que guardou a lembrança');
let g = await guardado(page);
ok(g.local.join() === 'painel_lembranca' && g.sessao.join() === 'painel_sessao', 'no navegador, só a lembrança e a sessão: ' + JSON.stringify(g));
ok(await page.locator('#faixaSenha').isHidden(), 'com sessão, sem a faixa "Crie sua senha"');
const semSessao = chamadas.filter(c => c.caminho !== 'painel-entrada' && c.sessao !== SESSAO);
ok(!semSessao.length, 'todos os pedidos do painel levam a sessão' + (semSessao.length ? ': ' + semSessao.map(c => c.caminho + ' ' + c.acao).join(', ') : ''));

// 5. Reconectar com o código na tela
await page.evaluate(() => { location.hash = 'conta/whatsapp'; });
await page.click('#btnReconectar');
await page.locator('#zapQrImg').waitFor({ state: 'visible' });
ok(true, 'Reconectar: o código aparece na própria tela');
await page.getByText('WhatsApp conectado').waitFor();
ok(await page.locator('#zapQrImg').isHidden() && chamadas.some(c => c.caminho === 'conectar' && c.acao === 'status' && c.sessao === SESSAO), 'Reconectar: confere a situação pela sessão e o código some ao conectar');
await page.close();

// 2. aba nova: o aparelho lembrado entra sem senha
page = await nova();
await page.goto(PAINEL);
await page.locator('#app').waitFor({ state: 'visible' });
ok(await chegou(c => c.acao === 'retomar' && c.dados.lembranca === LEMBRANCA), 'aparelho lembrado: entra sem senha (retomar)');
ok(await page.evaluate(() => localStorage.getItem('painel_lembranca')) === LEMBRANCA2, 'a lembrança muda a cada uso');

// 3. Sair
await page.evaluate(() => { location.hash = 'conta'; });
await page.click('#btnSair');
await page.locator('#entrada').waitFor({ state: 'visible' });
g = await guardado(page);
ok(await chegou(c => c.acao === 'sair' && c.dados.esquecer === true) && !g.local.length && !g.sessao.length, 'Sair: encerra a sessão, esquece o aparelho e volta para a entrada');
await page.close();

// 4. link antigo: faixa "Crie sua senha"
page = await nova();
await page.goto(PAINEL + '?t=' + TOKEN);
await page.locator('#faixaSenha').waitFor({ state: 'visible' });
const abrir2 = chamadas.filter(c => c.acao === 'abrir').pop();
ok(abrir2.token === TOKEN && abrir2.sessao === '', 'link antigo: o painel abre pelo token, com a faixa "Crie sua senha"');
await page.evaluate(() => { location.hash = 'conta/whatsapp'; });
await page.click('#btnReconectar');
await page.getByText('crie sua senha primeiro').waitFor();
ok(!chamadas.some(c => c.caminho === 'conectar' && c.token === TOKEN && c.acao === 'qr'), 'link antigo: o Reconectar pede para criar a senha antes (não pede o código)');
await page.evaluate(() => { location.hash = 'hoje'; });
await page.click('#btnFaixaSenha');
await page.locator('#entNova').waitFor({ state: 'visible' });
ok(await page.locator('#entTermosRot').isVisible(), 'criar a senha: pede o aceite dos Termos v6');
await page.fill('#entCodNova', '654321'); await page.fill('#entSenhaNova', 'uma-senha-boa-1'); await page.fill('#entSenhaNova2', 'uma-senha-boa-1');
await page.click('#entNova button[type=submit]');
await page.getByText('Marque que leu e aceita').waitFor();
ok(!chamadas.some(c => c.acao === 'senha_nova'), 'sem marcar os Termos, nem manda');
await page.check('#entTermos'); await page.click('#entNova button[type=submit]');
await page.waitForURL(u => !u.search.includes('t='));
await page.locator('#app').waitFor({ state: 'visible' });
const sn = chamadas.find(c => c.acao === 'senha_nova');
ok(sn && sn.dados.aceite_termos === true && sn.dados.versao_termos === '2026-10-v6' && !('_ua' in sn.dados), 'senha criada com o aceite dos Termos v6; o endereço perde o ?t=');
ok(chamadas.filter(c => c.acao === 'abrir').pop().sessao === SESSAO, 'depois de criar a senha, o painel abre pela sessão');

// 7. Termos atualizados
estado.termosPendente = true;
await page.reload();
await page.locator('#faixaTermos').waitFor({ state: 'visible' });
ok(chamadas.some(c => c.acao === 'termos_estado' && c.sessao === SESSAO), 'Termos atualizados: o painel pergunta com a sessão e mostra a faixa');
await page.click('#btnTermosAceitar');
await page.getByText('Marque que leu e aceita os Termos').waitFor();
ok(!chamadas.some(c => c.acao === 'termos_aceitar'), 'sem marcar a caixa, não manda o aceite');
await page.check('#termosOk'); await page.click('#btnTermosAceitar');
await page.locator('#faixaTermos').waitFor({ state: 'hidden' });
const ta = chamadas.find(c => c.acao === 'termos_aceitar');
ok(ta && ta.sessao === SESSAO && ta.dados.versao_termos === '2026-10-v6' && ta.dados.aceite_termos === true, 'aceite da v6 mandado com a sessão; a faixa some');
await page.reload(); await page.locator('#app').waitFor({ state: 'visible' }); await page.waitForLoadState('networkidle');
ok(await page.locator('#faixaTermos').isHidden(), 'depois do aceite, a faixa não volta');

// 6. sessão vencida
estado.vencida = true;
await page.reload();
await page.locator('#entrada').waitFor({ state: 'visible' });
await page.getByText('Sua entrada venceu').waitFor();
ok(!(await guardado(page)).sessao.length, 'sessão vencida: volta para a entrada com o aviso');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: entrada com e-mail, senha e código, aparelho lembrado, sair, link antigo, Reconectar, Termos atualizados e sessão vencida.');
process.exit(falhas ? 1 : 0);
