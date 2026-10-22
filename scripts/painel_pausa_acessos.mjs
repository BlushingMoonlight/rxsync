// Painel (autoedicao.html): testa pela tela o "Pausar a assistente" e os "Acessos recentes" (rxsync-sistema DEC-136,
// #183 e #184), com o n8n SIMULADO aqui (nada sai para a internet):
//   1. dono, assistente atendendo: Assistente mostra "Pausar a assistente"; pausar pede confirmação, vai ao 29 com a
//      sessão, a faixa "Assistente pausada" aparece no alto de todas as telas com "Retomar"; retomar tira a faixa;
//   2. pausa feita pela RXSync: a faixa aparece sem "Retomar" e o cartão diz que só a RXSync desfaz;
//   3. equipe: pausa e retoma também; não vê "Acessos recentes" em Conta;
//   4. dono: Conta › Acessos recentes lista o que o 29 devolve (sem IP), pela sessão;
//   5. link antigo (?t=, sem sessão): o cartão pede para criar a senha e nada vai ao 29.
// Uso (precisa do Playwright): node scripts/painel_pausa_acessos.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64), TOKEN = 'PnlAabcdefghijkmnopqrstuvwxy';
const chamadas = []; const estado = { papel: 'dono', ativo: true, peloPainel: false };
const situacao = () => ({ ok: true, ativo: estado.ativo, pausada_pelo_painel: estado.peloPainel, pausada_em: estado.peloPainel ? '2026-10-23 09:15' : null, status: 'Ativo',
  pode_pausar: estado.ativo, pode_retomar: !estado.ativo && estado.peloPainel });
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'indicadores') return { ok: true, data: { atual: { conversas: 10, agendadas_ia: 4, agendadas_manual: 2 },
    serie: [{ dia: '2026-10-20', ia: 2, manual: 1, conversas: 5 }, { dia: '2026-10-21', ia: 2, manual: 1, conversas: 5 }] } };
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, papel: estado.papel, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: 'Essencial' },
    recursos: {}, limite_catalogo: 500, conta: { situacao: 'ativo', no_ar: true } };
  if (caminho === 'painel-entrada') {
    if (b.acao === 'termos_estado') return { ok: true, pendente: false, papel: estado.papel };
    if (b.acao === 'assistente_estado') return situacao();
    if (b.acao === 'assistente_pausar') { estado.ativo = false; estado.peloPainel = true; return { ...situacao(), mensagem: 'Assistente pausada.' }; }
    if (b.acao === 'assistente_retomar') { estado.ativo = true; estado.peloPainel = false; return { ...situacao(), mensagem: 'A assistente voltou a atender.' }; }
    if (b.acao === 'acessos_recentes') return estado.papel === 'dono'
      ? { ok: true, acessos: [{ quando: '2026-10-23T12:15:00Z', evento: 'assistente_pausada', o_que: 'Pausou a assistente', quem: 'equipe · s•••@clinica-a.test', aparelho: 'iPad · Safari' },
          { quando: '2026-10-23T12:00:00Z', evento: 'entrada', o_que: 'Entrou', quem: 'dono · d•••@clinica-a.test', aparelho: 'iPhone · Safari' }] }
      : { ok: false, mensagem: 'Só o dono da conta pode fazer isso.' };
  }
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];
async function abrir(rota, comSessao = true) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  if (comSessao) await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request();
    if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
  });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => erros.push(String(e)));
  const dialogos = []; p.on('dialog', d => { dialogos.push(d.message()); d.accept(); });
  await p.goto(site.base + '/autoedicao.html' + (comSessao ? '' : '?t=' + TOKEN) + '#' + rota); await p.locator('#app').waitFor();
  return { ctx, p, dialogos };
}

// 1. dono pausa e retoma
let { ctx, p, dialogos } = await abrir('assistente');
await p.locator('#btnPausa').waitFor();
ok(await p.locator('#btnPausa').textContent() === 'Pausar a assistente', 'dono: Assistente mostra "Pausar a assistente"');
ok(await p.locator('#faixaPausa').isHidden(), 'atendendo: sem a faixa');
await p.click('#btnPausa');
await p.locator('#faixaPausa').waitFor();
const pz = chamadas.filter(c => c.acao === 'assistente_pausar').pop();
ok(dialogos.some(d => /mensalidade continua/.test(d)), 'pausar: pede confirmação e diz que a mensalidade continua');
ok(pz && pz.caminho === 'painel-entrada' && pz.sessao === SESSAO, 'pausar: vai ao 29 com a sessão');
ok(/23\/10 às 09:15/.test(await p.locator('#faixaPausaTxt').textContent()) && await p.locator('#btnFaixaRetomar').isVisible(), 'pausada pelo painel: a faixa diz desde quando e tem "Retomar"');
ok(await p.locator('[data-estado-curto]').first().textContent() === 'Assistente pausada', 'o topo diz "Assistente pausada"');
await p.goto(site.base + '/autoedicao.html#agenda');
ok(await p.locator('#faixaPausa').isVisible(), 'a faixa aparece também em outra tela (Agenda)');
await p.click('#btnFaixaRetomar');
await p.locator('#faixaPausa').waitFor({ state: 'hidden' });
ok(chamadas.some(c => c.acao === 'assistente_retomar' && c.sessao === SESSAO), 'Retomar pela faixa: vai ao 29 e a faixa some');
await ctx.close();

// 2. pausa da RXSync
estado.ativo = false; estado.peloPainel = false;
({ ctx, p } = await abrir('assistente'));
await p.locator('#faixaPausa').waitFor();
ok(await p.locator('#btnFaixaRetomar').isHidden() && await p.locator('#btnPausa').isHidden(), 'pausa da RXSync: sem "Retomar" no painel');
ok(/Pausada pela RXSync/.test(await p.locator('#pausaTxt').textContent()), 'pausa da RXSync: o cartão diz que só a RXSync desfaz');
await ctx.close();

// 3. equipe
estado.ativo = true; estado.papel = 'equipe';
({ ctx, p } = await abrir('assistente'));
await p.locator('#btnPausa').waitFor();
await p.click('#btnPausa'); await p.locator('#faixaPausa').waitFor();
ok(true, 'equipe: pausa pelo painel');
await p.goto(site.base + '/autoedicao.html#conta');
ok(await p.locator('#listaConta').getByText('Acessos recentes').isHidden(), 'equipe: Conta não mostra "Acessos recentes"');
await ctx.close();

// 4. dono: Acessos recentes
estado.papel = 'dono'; estado.ativo = true; estado.peloPainel = false;
({ ctx, p } = await abrir('conta'));
ok(await p.locator('#listaConta').getByText('Acessos recentes').isVisible(), 'dono: Conta mostra "Acessos recentes"');
await p.goto(site.base + '/autoedicao.html#conta/acessos');
await p.locator('#acessosLista').getByText('Pausou a assistente').waitFor();
const lista = await p.locator('#acessosLista').textContent();
ok(/equipe · s•••@clinica-a\.test/.test(lista) && /iPad · Safari/.test(lista), 'Acessos recentes: o quê, quem e o aparelho');
ok(!/\d+\.\d+\.\d+\.\d+/.test(lista), 'Acessos recentes: sem IP');
ok(chamadas.some(c => c.acao === 'acessos_recentes' && c.sessao === SESSAO), 'Acessos recentes: vai ao 29 com a sessão');
// Resultados: o Chart.js vem do próprio site (rxsync-sistema#104); qualquer endereço de fora é bloqueado neste teste.
const libs = []; p.on('request', q => { if (/chart/i.test(q.url())) libs.push(q.url()); });
await p.goto(site.base + '/autoedicao.html#resultados');
await p.waitForFunction(() => !!window.Chart, null, { timeout: 8000 }).catch(() => {});
ok(await p.evaluate(() => !!window.Chart) && libs.length && libs.every(u => u.startsWith(site.base + '/assets/vendor/')), 'Resultados: o Chart.js carrega do próprio site (' + libs.join(', ') + ')');
await ctx.close();

// 5. link antigo, sem sessão
const antes = chamadas.length;
({ ctx, p } = await abrir('assistente', false));
await p.waitForTimeout(300);
ok(/crie sua senha/i.test(await p.locator('#pausaTxt').textContent()) && await p.locator('#btnPausa').isHidden(), 'link antigo: o cartão pede para criar a senha');
ok(!chamadas.slice(antes).some(c => /^assistente_/.test(c.acao)), 'link antigo: nada de pausa vai ao 29');
await ctx.close();

ok(!erros.length, 'sem erro de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? falhas + ' falha(s).' : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
