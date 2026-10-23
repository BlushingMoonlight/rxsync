// Painel (autoedicao.html): testa pela tela o fim do contrato, com o n8n SIMULADO aqui
// (nada sai para a internet):
//   1. dono, contrato encerrado (termos_estado com so_baixar): a tela só tem "Baixar meus dados" e "Sair"; o 24 nunca é
//      chamado; a agenda baixa pelo 29 (dados_exportar) com a sessão; "Sair" encerra a sessão e volta para a entrada;
//   2. equipe, contrato encerrado: só o aviso "Só o dono…" e o "Sair";
//   3. contrato ativo (sem so_baixar): o painel abre normal, com uma pergunta só ao termos_estado.
// No navegador, nada novo: só 'painel_sessao' (sessionStorage), como antes.
// Uso (precisa do Playwright): node scripts/painel_fim_contrato.mjs
import fs from 'node:fs';
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const chamadas = []; const estado = { papel: 'dono', fim: true };
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'painel-entrada' && b.acao === 'termos_estado') return estado.fim
    ? { ok: true, pendente: false, so_baixar: true, papel: estado.papel, mensagem: 'O contrato terminou.' }
    : { ok: true, pendente: false, papel: estado.papel, versao: '2026-10-v6' };
  if (caminho === 'painel-entrada' && b.acao === 'dados_exportar') return { ok: true, parte: b.dados.parte, pagina: 0, tem_mais: false,
    linhas: [{ codigo: 1, inicio: '2026-11-01 10:00', paciente: 'Paciente Um', telefone: '41999990000' }] };
  if (caminho === 'painel-entrada' && b.acao === 'sair') return { ok: true, sair: true };
  if (caminho === 'autoedicao' && b.acao === 'abrir') return estado.fim ? { ok: false, entrar: true, mensagem: 'Sua entrada no painel venceu.' }
    : { ok: true, papel: estado.papel, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: 'Essencial' }, recursos: {}, limite_catalogo: 500 };
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];
async function contexto() {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript(s => { try { if (!sessionStorage.getItem('painel_saiu')) sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request();
    if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
  });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e)));
  return { ctx, p };
}

// 1. dono
let { ctx, p } = await contexto();
await p.goto(site.base + '/autoedicao.html');
await p.locator('#fimContrato').waitFor();
ok(await p.locator('#btnFimAgenda').isVisible() && await p.locator('#btnFimPacientes').isVisible(), 'dono: a tela do fim do contrato mostra os dois botões de baixar');
ok(await p.locator('#app').isHidden() && await p.locator('#entrada').isHidden(), 'dono: nem o painel nem a entrada aparecem');
ok(!chamadas.some(c => c.caminho === 'autoedicao'), 'o 24 nunca é chamado no fim do contrato');
const [download] = await Promise.all([p.waitForEvent('download'), p.click('#btnFimAgenda')]);
const csv = fs.readFileSync(await download.path()).toString('utf8');
const exp = chamadas.filter(c => c.acao === 'dados_exportar').pop();
ok(exp && exp.caminho === 'painel-entrada' && exp.sessao === SESSAO && exp.dados.parte === 'agenda', 'Baixar a agenda: vai ao 29 com a sessão');
ok(csv.includes('Paciente Um') && csv.charCodeAt(0) === 0xfeff, 'Baixar a agenda: o CSV tem a linha (com o BOM para os acentos)');
ok(/Pronto: 1 linha/.test(await p.locator('#fimMsg').textContent()), 'Baixar a agenda: a mensagem diz quantas linhas');
const guardado = await p.evaluate(() => ({ s: Object.keys(sessionStorage), l: Object.keys(localStorage) }));
ok(guardado.s.every(k => k === 'painel_sessao') && guardado.l.length === 0, 'nada novo guardado no navegador');
await p.evaluate(() => sessionStorage.setItem('painel_saiu', '1'));
await p.click('#btnFimSair');
await p.locator('#entrada').waitFor();
ok(chamadas.some(c => c.acao === 'sair' && c.sessao === SESSAO), 'Sair: encerra a sessão no 29 e volta para a entrada');
await ctx.close();

// 2. equipe
estado.papel = 'equipe'; chamadas.length = 0;
({ ctx, p } = await contexto());
await p.goto(site.base + '/autoedicao.html');
await p.locator('#fimContrato').waitFor();
ok(await p.locator('#fimEquipe').isVisible() && await p.locator('#btnFimAgenda').isHidden(), 'equipe: só o aviso "Só o dono…", sem os botões de baixar');
ok(await p.locator('#btnFimSair').isVisible(), 'equipe: o Sair aparece');
await ctx.close();

// 3. contrato ativo
estado.papel = 'dono'; estado.fim = false; chamadas.length = 0;
({ ctx, p } = await contexto());
await p.goto(site.base + '/autoedicao.html');
await p.locator('#app').waitFor();
ok(await p.locator('#fimContrato').isHidden(), 'contrato ativo: o painel abre normal');
await p.waitForTimeout(300);
ok(chamadas.filter(c => c.acao === 'termos_estado').length === 1, 'contrato ativo: uma pergunta só ao termos_estado');
await ctx.close();

ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? falhas + ' falha(s).' : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
