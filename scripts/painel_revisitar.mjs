// Revisitar (rxsync-sistema, defeito de 28/10): passa por todas as telas do painel, sai para Hoje, volta e confere que o
// conteúdo aparece em todas as vezes, em 820 e 1180 px (iPad em pé e deitado). Roda duas vezes: com as listas do servidor
// como listas e como o workflow 24 publicado no #221 as mandava por engano (a lista virava um objeto: {"0": …, "1": …}),
// que deixava Agenda › Horários vazia ao voltar. Nenhuma tela pode ficar só com o título; a tela que falhar tem de mostrar
// "Não consegui abrir esta tela." (a rede de segurança do rotear). Com o n8n SIMULADO; NAVEGADOR=webkit roda no Safari.
// Uso (precisa do Playwright): node scripts/painel_revisitar.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { abrirNavegador, servirSite, entrar as entrarCentral, CHAVES_LIGADAS } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SO = process.argv.slice(2).find(a => ['painel', 'central', 'demo'].includes(a));
const GRAVAR = process.argv.includes('--gravar');
const LARGURAS = process.env.ALCANCE_LARGURA ? [Number(process.env.ALCANCE_LARGURA)] : [360, 820, 1280];
// A Central é a mais demorada (cada seção espera os dados). No Safari (NAVEGADOR=webkit, a segunda rodada do GitHub),
// ela roda só em 820 px; no Chrome, nas três larguras.
const LARGURAS_CENTRAL = process.env.ALCANCE_LARGURA || process.env.NAVEGADOR !== 'webkit' ? LARGURAS : [820];
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const agora = Date.now(), h = n => new Date(agora + n * 3600000).toISOString();
// As telas de cada app, lidas das fontes (o código da página fica fechado numa função e não é visto daqui):
const ler = pasta => fs.readdirSync(path.join(RAIZ, pasta)).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(RAIZ, pasta, f), 'utf8')).join('\n');
const FONTE_PAINEL = ler('painel/fonte');
const ROTAS_PAINEL = (() => {
  const r = new Set([...FONTE_PAINEL.matchAll(/\btela\('([^']+)'/g)].map(m => m[1]).filter(x => !x.endsWith('/')));
  const g = FONTE_PAINEL.slice(FONTE_PAINEL.indexOf('const GRUPOS_IA'), FONTE_PAINEL.indexOf('const CAMPOS_DA'));
  for (const m of g.matchAll(/\['([a-z_]+)', '/g)) r.add('assistente/' + m[1]);
  return [...r];
})();
// A rota de um endereço, como o painel decide (rotaAtual): o começo mais longo que é uma tela.
// A tela de cima de cada tela, como no diagrama (painel-novo.md, seção 9): Resultados sai de Hoje; Organizar, de
// Pacientes; Possíveis duplicados e as importações de pacientes, de Organizar; o resto, do começo da rota.
const paiPainel = r => {
  if (r === 'resultados') return 'hoje';
  if (['pacientes/duplicados', 'pacientes/importar', 'pacientes/importacoes'].includes(r)) return 'pacientes/organizar';
  const p = r.split('/'); return p.length > 1 ? p.slice(0, -1).join('/') : 'hoje';
};
const rotaPainel = hash => { const partes = String(hash).replace(/^#/, '').split('/'); for (let n = partes.length; n > 0; n--) { const k = partes.slice(0, n).join('/'); if (ROTAS_PAINEL.includes(k)) return k; } return null; };


// ---------------------------------------------------------------- painel: o n8n simulado (o mesmo jeito do painel_p1.mjs)
const RECURSOS = ['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'];
const AGENDA = [
  { id: 1, nome_paciente: 'Maria Souza', telefone_paciente: '48999990001', servico: 'Consulta', inicio: h(2), fim: h(2.5), status: 'confirmado', visto: false, criado_por: 'ia' },
  { id: 2, nome_paciente: 'João Lima', telefone_paciente: '48999990002', servico: 'Retorno', inicio: h(4), fim: h(4.5), status: 'confirmado', visto: true, pago_em: h(-1) }];
const PAC = { paciente_id: 'PAC-0001', nome: 'Maria Souza', telefone: '48999990001', criado_em: h(-200) };
function responderPainel(caminho, b) {
  if (caminho === 'painel-entrada') {
    if (b.acao === 'assistente_estado') return { ok: true, ativo: true, status: 'Ativo', pode_pausar: true };
    if (b.acao === 'equipe_listar') return { ok: true, limite: 3, pessoas: [{ id: 1, email: 'dono@clinica.test', papel: 'dono', situacao: 'ativa' }] };
    if (b.acao === 'acessos_recentes') return { ok: true, acessos: [{ quando: h(-2), o_que: 'Entrou', quem: 'dono · d•••@clinica.test', aparelho: 'iPad · Safari' }] };
    return { ok: true, pendente: false, versao: '2026-10-v7' };
  }
  if (caminho === 'autoedicao') {
    if (b.acao === 'abrir') return { ok: true, papel: 'dono', editaveis: { nome_exibicao: 'Clínica Sorriso', fuso_horario: 'America/Sao_Paulo', lembrete_ativo: 'SIM', assistente_dono_ativa: 'SIM', func_pagamento_link: 'SIM', func_reservio: 'SIM' },
      somenteLeitura: { plano: 'Gestão Inteligente', numero_whatsapp: '5548999990000', razao_social: 'Sorriso Ltda' }, recursos: Object.fromEntries(RECURSOS.map(k => [k, true])), limite_catalogo: 2000, conta: { situacao: 'ativo', no_ar: true } };
    if (b.acao === 'agenda_listar') return { ok: true, data: AGENDA };
    if (b.acao === 'agenda_grade_listar') return { ok: true, data: [1, 2, 3, 4, 5].map(d => ({ dia: d, inicio: '08:00', fim: '18:00' })) };
    if (b.acao === 'agenda_medicos_listar') return { ok: true, data: { modo_medicos: false, funcoes_padrao: { agendamento: true }, medicos: [{ id: 1, nome: 'Dra. Ana', ativo: true, funcoes: {}, tipos: [], grade: [] }] } };
    if (b.acao === 'indicadores') return { ok: true, data: { atual: { conversas: 120, agendadas_ia: 30, agendadas_manual: 10 }, anterior: { conversas: 100, agendadas_ia: 20, agendadas_manual: 12 } } };
    if (b.acao === 'paciente_listar') return { ok: true, data: { ok: true, pacientes: [PAC], total: 1 } };
    if (b.acao === 'paciente_ver') return { ok: true, data: { ok: true, paciente: PAC, consultas_futuras: [], consultas_passadas: [], possiveis_duplicados: [] } };
    if (b.acao === 'paciente_duplicados') return { ok: true, data: { ok: true, grupos: [] } };
    if (b.acao === 'paciente_importacoes') return { ok: true, data: { ok: true, importacoes: [] } };
    if (b.acao === 'assinatura_ver') return { ok: true, assinatura: { situacao: 'em_dia', plano_chave: 'gestao', plano: 'Gestão Inteligente', forma: 'mensal', valor: '599', abertas: [], pagas: [] } };
    if (b.acao === 'faq_listar') return { ok: true, data: { ok: true, itens: [] } };
    if (b.acao === 'agenda_chamados') return { ok: true, data: { ok: true, chamados: [] } };
    return { ok: true, data: [] };
  }
  if (caminho === 'pagamento-clinica') return { ok: true, situacao: { conectado: false } };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false, plataformas: { reservio: 'Reservio' } };
  return { ok: true, conectado: false };
}

const OBJETO = process.argv.includes('--objeto');
const site = await servirSite(); const browser = await abrirNavegador();
for (const formato of OBJETO ? ['objeto'] : ['lista', 'objeto']) for (const largura of [820, 1180]) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, hasTouch: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('painel_sessao', 'a'.repeat(64)); } catch (e) {} });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request();
    if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch (e) {}
    const resp = responderPainel(q.url().slice(N8N.length), b);
    if (formato === 'objeto' && Array.isArray(resp.data) && String(b.acao || '').startsWith('agenda_')) resp.data = Object.assign({}, resp.data);
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(resp) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(site.base + '/painel/#hoje'); await page.locator('#app').waitFor({ state: 'visible' }); await page.waitForTimeout(500);
  // O que a tela mostra além do cabeçalho (voltar, título, frase): o tamanho do texto do resto e se a rede de segurança apareceu.
  const conteudo = rota => page.evaluate(r => {
    const s = [...document.querySelectorAll('#telas > section')].find(x => !x.hidden && x.dataset.tela === r) || [...document.querySelectorAll('#telas > section')].filter(x => !x.hidden).pop();
    if (!s) return { n: 0, falhou: false };
    const c = s.cloneNode(true); c.querySelectorAll('.voltar, .cab-tela, .subtitulo, .tela-falhou').forEach(x => x.remove());
    return { n: c.textContent.replace(/\s+/g, '').length + c.querySelectorAll('input, select, textarea, button').length, falhou: !!s.querySelector('.tela-falhou') };
  }, rota);
  const vazias = [], falhas2 = [];
  for (const rota of ROTAS_PAINEL.filter(r => r !== 'hoje')) {
    await page.evaluate(x => { location.hash = x; }, rota); await page.waitForTimeout(450);
    const a = await conteudo(rota);
    await page.evaluate(() => { location.hash = 'hoje'; }); await page.waitForTimeout(250);
    await page.evaluate(x => { location.hash = x; }, rota); await page.waitForTimeout(450);
    const b2 = await conteudo(rota);
    await page.goBack(); await page.waitForTimeout(200); await page.goForward(); await page.waitForTimeout(450);
    const c2 = await conteudo(rota);
    for (const [vez, x] of [['1ª', a], ['volta', b2], ['voltar do navegador', c2]]) {
      if (x.falhou) falhas2.push(`${rota} (${vez})`); else if (x.n < 5) vazias.push(`${rota} (${vez})`);
    }
  }
  // Agenda › Horários, o caso visto pelo Jean: os 7 itens toda vez, também depois de passar pelas subtelas e pelo menu.
  const itens = async () => page.locator('[data-tela="agenda/horarios"] #horIndice .linha').count();
  const contagens = [];
  for (const passo of ['agenda/horarios', 'agenda/horarios/feriados', 'agenda/horarios', 'pacientes', 'agenda/horarios', 'conta', 'agenda/horarios', 'agenda', 'agenda/horarios']) {
    await page.evaluate(x => { location.hash = x; }, passo); await page.waitForTimeout(500);
    if (passo === 'agenda/horarios') contagens.push(await itens());
  }
  ok(!vazias.length, `${formato}, ${largura} px: nenhuma tela fica só com o título, na 1ª vez, ao voltar e no voltar do navegador` + (vazias.length ? ': ' + vazias.join(', ') : ''));
  ok(!falhas2.length, `${formato}, ${largura} px: nenhuma tela cai na rede de segurança` + (falhas2.length ? ': ' + falhas2.join(', ') : ''));
  ok(contagens.every(n => n === 7), `${formato}, ${largura} px: Agenda › Horários mostra os 7 itens toda vez (${contagens.join(', ')})`);
  ok(!erros.length, `${formato}, ${largura} px: nenhum erro de JavaScript` + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
