// Painel (painel/, DEC-156): confere pela tela as regras da P1 (rxsync-sistema docs/mapa/painel-novo.md, seção 11), em
// todas as telas, com o n8n SIMULADO aqui (nada sai para a internet; dados inventados):
//   1. todo clicável com 44 px ou mais (o link no meio de um texto é a exceção da WCAG);
//   2. todo texto com 12 px ou mais e contraste de 4,5:1 contra o fundo de verdade (3:1 no texto grande);
//   3. sem rolagem para o lado em 360 px nem em 320 px (o mesmo que 200% de zoom num celular de 640 px);
//   4. o Tab mostra o anel de foco; com o celular em modo escuro, a página continua branca; com "Reduzir movimento",
//      nada anima.
// Roda no Chrome e, com NAVEGADOR=webkit, no motor do Safari. Uso (precisa do Playwright): node scripts/painel_p1.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const RECURSOS = ['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'];
const agora = Date.now(), h = n => new Date(agora + n * 3600000).toISOString();
const AG = [
  { id: 1, nome_paciente: 'Maria Souza', telefone_paciente: '48999990001', servico: 'Consulta', inicio: h(2), fim: h(2.5), status: 'agendado', visto: false, criado_por: 'ia' },
  { id: 2, nome_paciente: 'João Lima', telefone_paciente: '48999990002', servico: 'Retorno', inicio: h(4), fim: h(4.5), status: 'agendado', visto: true, pago_em: h(-1) },
  { id: 3, nome_paciente: 'Horário bloqueado', telefone_paciente: '-', servico: 'BLOQUEIO', inicio: h(30), fim: h(32), status: 'agendado', visto: true }];
const PAC = { paciente_id: 'PAC-0001', nome: 'Maria Souza', telefone: '48999990001', criado_em: h(-200) };
function responder(caminho, b) {
  if (caminho === 'painel-entrada') {
    if (b.acao === 'assistente_estado') return { ok: true, ativo: true, status: 'Ativo', pode_pausar: true };
    if (b.acao === 'equipe_listar') return { ok: true, limite: 3, pessoas: [{ id: 1, email: 'dono@clinica.test', papel: 'dono', situacao: 'ativa' }] };
    if (b.acao === 'acessos_recentes') return { ok: true, acessos: [{ quando: h(-2), o_que: 'Entrou', quem: 'dono · d•••@clinica.test', aparelho: 'iPad · Safari' }] };
    return { ok: true, pendente: false, versao: '2026-10-v7' };
  }
  if (caminho === 'autoedicao') {
    if (b.acao === 'abrir') return { ok: true, papel: 'dono', editaveis: { nome_exibicao: 'Clínica Sorriso', fuso_horario: 'America/Sao_Paulo', lembrete_ativo: 'SIM', assistente_dono_ativa: 'SIM', func_pagamento_link: 'SIM' },
      somenteLeitura: { plano: 'Gestão Inteligente', numero_whatsapp: '5548999990000', razao_social: 'Sorriso Ltda' }, recursos: Object.fromEntries(RECURSOS.map(k => [k, true])), limite_catalogo: 2000, conta: { situacao: 'ativo', no_ar: true } };
    if (b.acao === 'agenda_listar') return { ok: true, data: AG };
    if (b.acao === 'agenda_grade_listar') return { ok: true, data: [1, 2, 3, 4, 5].map(d => ({ dia: d, inicio: '08:00', fim: '18:00' })) };
    if (b.acao === 'agenda_medicos_listar') return { ok: true, data: { modo_medicos: false, funcoes_padrao: { agendamento: true }, medicos: [{ id: 1, nome: 'Dra. Ana', ativo: true, funcoes: {}, tipos: [], grade: [] }] } };
    if (b.acao === 'indicadores') return { ok: true, data: { atual: { conversas: 120, agendadas_ia: 30, agendadas_manual: 10 }, anterior: { conversas: 100, agendadas_ia: 20, agendadas_manual: 12 } } };
    if (b.acao === 'paciente_listar') return { ok: true, data: { ok: true, pacientes: [PAC], total: 1 } };
    if (b.acao === 'paciente_ver') return { ok: true, data: { ok: true, paciente: PAC, consultas_futuras: [], consultas_passadas: [], possiveis_duplicados: [] } };
    if (b.acao === 'paciente_duplicados') return { ok: true, data: { ok: true, grupos: [] } };
    if (b.acao === 'paciente_importacoes') return { ok: true, data: { ok: true, importacoes: [] } };
    if (b.acao === 'assinatura_ver') return { ok: true, assinatura: { situacao: 'em_dia', plano_chave: 'gestao', plano: 'Gestão Inteligente', forma: 'mensal', valor: '599', abertas: [], pagas: [] } };
    return { ok: true, data: [] };
  }
  if (caminho === 'pagamento-clinica') return { ok: true, situacao: { conectado: false } };
  return { ok: true, conectado: false };
}
const TELAS = ['hoje', 'resultados', 'agenda', 'agenda/espera', 'agenda/documentos', 'agenda/horarios', 'agenda/horarios/grade', 'agenda/horarios/regras', 'agenda/horarios/medicos',
  'agenda/horarios/perguntas', 'agenda/horarios/feriados', 'agenda/horarios/pagamento', 'agenda/horarios/integracao', 'agenda/horarios/integracao/link', 'agenda/horarios/integracao/reservio',
  'agenda/horarios/integracao/importar', 'agenda/horarios/integracao/importacoes', 'pacientes', 'pacientes/ficha/PAC-0001', 'pacientes/organizar', 'pacientes/duplicados', 'pacientes/importar',
  'pacientes/importacoes', 'assistente', 'assistente/clinica', 'assistente/conversa', 'assistente/valores', 'assistente/urgencia', 'assistente/automaticas', 'assistente/limites',
  'assistente/extras', 'assistente/faq', 'assistente/funcoes', 'conta', 'conta/assinatura', 'conta/whatsapp', 'conta/contato', 'conta/gestao', 'conta/contrato', 'conta/equipe',
  'conta/acessos', 'conta/dados', 'conta/mudou'];

const site = await servirSite(); const browser = await abrirNavegador();
async function abrir(op) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...(op || {}) });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('painel_sessao', 'a'.repeat(64)); } catch (e) {} });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request();
    if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url().slice(N8N.length), b)) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  await page.goto(site.base + '/painel/#hoje'); await page.locator('#app').waitFor({ state: 'visible' });
  return { ctx, page };
}
const ir = async (page, t) => { await page.evaluate(x => { location.hash = x; }, t); await page.locator(`section[data-tela="${t.replace(/\/PAC-.*$/, '')}"]`).waitFor({ state: 'visible' }); await page.waitForLoadState('networkidle'); await page.waitForTimeout(150); };
// O que a tela mede: alvos pequenos, textos pequenos e contraste baixo, de tudo o que está à vista (o que está escondido não conta).
const medir = () => {
  const visivel = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
  const nome = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '')) + ' "' + (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 30) + '"';
  const pequenos = [];
  for (const e of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=switch], [role=tab], summary')) {
    if (!visivel(e) || e.closest('[hidden]')) continue;
    // exceções da WCAG: o link no meio de uma frase e a caixa de marcar dentro de um rótulo grande
    if ((e.matches('a, button.link') && e.closest('p, .tx, .dica, .aviso')) || (e.matches('input[type=checkbox], input[type=radio]') && e.closest('label'))) continue;
    const alvo = e.closest('label') && e.matches('input') ? e.closest('label') : e;
    const r = alvo.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) pequenos.push(nome(e) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
  }
  const lum = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => { x = x / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const fundo = e => { for (let x = e; x; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; const a = b.match(/[\d.]+/g); if (a && (a.length < 4 || +a[3] > 0.5)) return b; } return 'rgb(255, 255, 255)'; };
  const letras = [], contraste = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (!n.textContent.trim()) continue;
    const e = n.parentElement; if (!e || !visivel(e) || e.closest('[hidden], svg, option, script, style')) continue;
    const c = getComputedStyle(e), px = parseFloat(c.fontSize);
    if (px < 11.5) letras.push(nome(e) + ' ' + px + 'px');
    if (e.closest(':disabled, [aria-disabled=true], .trava') ) continue;   // desativado: fora da regra de contraste (WCAG)
    const L1 = lum(c.color), L2 = lum(fundo(e)), cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const grande = px >= 24 || (px >= 18.6 && +c.fontWeight >= 600);
    if (cr < (grande ? 3 : 4.5) - 0.01) contraste.push(nome(e) + ' ' + cr.toFixed(2) + ':1');
  }
  return { pequenos: [...new Set(pequenos)], letras: [...new Set(letras)], contraste: [...new Set(contraste)], largura: document.documentElement.scrollWidth };
};

// 1 a 3. Todas as telas no celular (390 px), e a rolagem para o lado em 360 e 320 px.
let { ctx, page } = await abrir();
// 0. A régua funciona: um botão de 20 px e um texto de 10 px, claro demais, precisam ser achados.
await page.evaluate(() => { const b = document.createElement('button'); b.id = 'reguaBotao'; b.textContent = 'x'; b.className = 'regua'; const p = document.createElement('span'); p.id = 'reguaTexto'; p.textContent = 'texto'; document.getElementById('telas').append(b, p);
  b.style.cssText = 'all: unset; display: inline-block; width: 20px; height: 20px'; p.style.cssText = 'font-size: 10px; color: #DDDDDD'; });
const regua = await page.evaluate(medir);
ok(regua.pequenos.some(x => x.startsWith('#reguaBotao')) && regua.letras.some(x => x.startsWith('#reguaTexto')) && regua.contraste.some(x => x.startsWith('#reguaTexto')), 'a régua acha um botão pequeno, um texto pequeno e um contraste baixo de propósito');
await page.evaluate(() => { document.getElementById('reguaBotao').remove(); document.getElementById('reguaTexto').remove(); });
const achados = { pequenos: [], letras: [], contraste: [], lado: [] };
for (const t of TELAS) {
  await ir(page, t);
  const m = await page.evaluate(medir);
  for (const k of ['pequenos', 'letras', 'contraste']) achados[k].push(...m[k].map(x => t + ': ' + x));
}
for (const larg of [360, 320]) {
  await page.setViewportSize({ width: larg, height: 740 });
  for (const t of TELAS) { await ir(page, t); const l = await page.evaluate(() => document.documentElement.scrollWidth); if (l > larg) achados.lado.push(`${t} em ${larg} px: ${l} px`); }
}
const lista = l => l.length ? ':\n    ' + [...new Set(l)].slice(0, 40).join('\n    ') + (l.length > 40 ? `\n    … e mais ${l.length - 40}` : '') : '';
ok(!achados.pequenos.length, `${TELAS.length} telas: todo clicável com 44 px ou mais` + lista(achados.pequenos));
ok(!achados.letras.length, 'todo texto com 12 px ou mais' + lista(achados.letras));
ok(!achados.contraste.length, 'todo texto com contraste de 4,5:1 (3:1 no grande) contra o fundo de verdade' + lista(achados.contraste));
ok(!achados.lado.length, 'sem rolagem para o lado em 360 px nem em 320 px' + lista(achados.lado));

// 4. Tab: o anel de foco aparece.
// (No Safari, o Tab pula botões e links, a não ser que a pessoa ligue "Tab destaca cada item"; por isso a tela de campos.)
await page.setViewportSize({ width: 1024, height: 768 }); await ir(page, 'assistente/clinica');
await page.locator('section[data-tela="assistente/clinica"] h1').click();
let foco = { tag: 'BODY' };
for (let i = 0; i < 12 && foco.tag === 'BODY'; i++) {
  await page.keyboard.press('Tab');
  foco = await page.evaluate(() => { const e = document.activeElement, c = getComputedStyle(e); return { tag: e.tagName, contorno: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 2 }; });
}
ok(foco.tag !== 'BODY' && foco.contorno, 'Tab: o item com o foco ganha o anel (contorno de 2 px ou mais)');
await ctx.close();

// 5. Celular em modo escuro: a página continua branca (o escuro só pela escolha da pessoa).
({ ctx, page } = await abrir({ colorScheme: 'dark' }));
ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(255, 255, 255)', 'com o celular em modo escuro, a página continua branca');
await ctx.close();

// 6. "Reduzir movimento": nada anima.
({ ctx, page } = await abrir({ reducedMotion: 'reduce' }));
await ir(page, 'assistente/automaticas');
const anima = await page.evaluate(() => [...document.querySelectorAll('*')].flatMap(e => [getComputedStyle(e), getComputedStyle(e, '::before'), getComputedStyle(e, '::after')])
  .filter(c => c.transitionDuration.split(',').some(d => parseFloat(d) > 0.01) || (c.animationName !== 'none' && c.animationDuration.split(',').some(d => parseFloat(d) > 0.01))).length);
ok(anima === 0, 'com "Reduzir movimento", nada anima' + (anima ? ` (${anima} elementos animam)` : ''));
await ctx.close();

await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: as regras da P1 valem em todas as telas do painel.');
process.exit(falhas ? 1 : 0);
