// Alcance só tocando (rxsync-sistema #219): parte de Hoje no painel, do início na Central e da entrada da demonstração e
// chega, só tocando (nada de lupa, de endereço digitado nem de atalho do teclado), a cada tela e folha. Falha se alguma tela
// do painel (todas as rotas registradas em TELAS), alguma seção da Central ou alguma página da demonstração ficar de fora,
// se um botão levar a uma tela que não existe, ou se o "voltar" de uma tela não subir um nível. Em 360, 820 e 1280 px.
// Também grava a lista dos caminhos de toque ("Agenda › Horários › Feriados") em scripts/caminhos_validos.json, que o
// verificar_site.mjs e o verificar.mjs do rxsync-sistema usam para conferir os caminhos escritos nos textos.
// Com o n8n SIMULADO aqui (nada sai para a internet; dados inventados). Roda no Chrome e, com NAVEGADOR=webkit, no motor do
// Safari. Uso (precisa do Playwright): node scripts/painel_alcance.mjs [painel|central|demo] [--gravar]
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
// painel = toda tela('rota') e os assuntos do Assistente (GRUPOS_IA); Central = todo TELAS.nome.
const ler = pasta => fs.readdirSync(path.join(RAIZ, pasta)).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(RAIZ, pasta, f), 'utf8')).join('\n');
const FONTE_PAINEL = ler('painel/fonte'), FONTE_CENTRAL = ler('central/fonte');
const ROTAS_PAINEL = (() => {
  const r = new Set([...FONTE_PAINEL.matchAll(/\btela\('([^']+)'/g)].map(m => m[1]).filter(x => !x.endsWith('/')));
  const g = FONTE_PAINEL.slice(FONTE_PAINEL.indexOf('const GRUPOS_IA'), FONTE_PAINEL.indexOf('const CAMPOS_DA'));
  for (const m of g.matchAll(/\['([a-z_]+)', '/g)) r.add('assistente/' + m[1]);
  return [...r];
})();
const TELAS_CENTRAL = [...FONTE_CENTRAL.matchAll(/TELAS\.(\w+)\s*=/g)].map(m => m[1]);
// A rota de um endereço, como o painel decide (rotaAtual): o começo mais longo que é uma tela.
// A tela de cima de cada tela, como no diagrama (painel-novo.md, seção 9): Resultados sai de Hoje; Organizar, de
// Pacientes; Possíveis duplicados e as importações de pacientes, de Organizar; o resto, do começo da rota.
const paiPainel = r => {
  if (r === 'resultados') return 'hoje';
  if (['pacientes/duplicados', 'pacientes/importar', 'pacientes/importacoes'].includes(r)) return 'pacientes/organizar';
  const p = r.split('/'); return p.length > 1 ? p.slice(0, -1).join('/') : 'hoje';
};
const rotaPainel = hash => { const partes = String(hash).replace(/^#/, '').split('/'); for (let n = partes.length; n > 0; n--) { const k = partes.slice(0, n).join('/'); if (ROTAS_PAINEL.includes(k)) return k; } return null; };

// O que não se toca para explorar: sair, apagar, mandar, salvar, ligar e desligar, links para fora e a lupa (que não conta
// como caminho de toque). O resto é tocado, um de cada vez, a partir da tela de onde ele aparece.
const NAO_TOCAR = /^(sair|excluir|apagar|desconectar|cancelar a conta|cancelar e excluir|pausar|retomar|enviar|mandar|confirmar|remover|desfazer|reenviar|copiar|baixar|exportar|imprimir|atualizar|tentar de novo|descartar|resolvido|marcar|desmarcar|chegou|faltou|paga\b|não paga|ligar|desligar|sincronizar|conectar|salvar|recusar|aprovar|bloquear o|suspender|reativar|encerrar|gerar|criar|adicionar|incluir|convidar|trocar|mudar a senha|testar|já fiz|fechar|cancelar$|buscar|perguntar|limpar|juntar|importar$|escolher arquivo|abrir no whatsapp|ligar para|voltar ao whatsapp)/i;

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

// ---------------------------------------------------------------- o explorador: tocar, ver para onde foi, e repetir
// estado = a rota (hash). Volta a um estado já alcançado tocando pelo próprio endereço (isso não conta como caminho: só
// repõe o lugar de onde o toque sai). Cada toque é feito de novo a partir do estado limpo.
const visivelJs = `e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden') return false; } return !e.closest('[hidden], [inert]') }`;
// Os tocáveis à vista, na ordem do DOM: o nome (o título da linha, sem contadores nem a descrição), o grupo (o título do
// bloco onde a linha está, como "Assinatura e WhatsApp" na Conta), o destino (data-ir/data-area/#) e se é o "voltar".
async function tocaveis(page, dentroDe) {
  return page.evaluate(({ visivelSrc, dentroDe }) => {
    const visivel = eval(visivelSrc);
    const raiz = dentroDe ? [...document.querySelectorAll(dentroDe)].filter(visivel).pop() : document;
    if (!raiz) return [];
    const topo = !dentroDe && [...document.querySelectorAll('.janela[role=dialog], .janela[role=alertdialog]')].filter(visivel).pop();
    const lista = [...raiz.querySelectorAll('button, a[href], [role=tab], [role=option]')];
    const nomeDe = e => {
      const t1 = e.querySelector('.t1, .nome-linha'); if (t1 && t1.textContent.trim()) return t1.textContent;
      const c = e.cloneNode(true); c.querySelectorAll('.selo, .contador, [data-selo-agenda], .t2, .valor, .estado, svg, .sr').forEach(x => x.remove());
      return c.textContent.trim() || e.getAttribute('aria-label') || '';
    };
    const grupoDe = e => {
      for (let x = e; x && x !== document.body; x = x.parentElement) {
        for (let s = x.previousElementSibling; s; s = s.previousElementSibling) if (/^H[23]$/.test(s.tagName) || s.matches('.grupo-tit, .rotulo-grupo')) return s.textContent.trim();
        if (x.matches('section[data-tela], .janela, nav')) break;
      }
      return '';
    };
    // O chat do assistente de gestão (painel) e o da Central ficam de fora: os botões dele mandam perguntas.
    return lista.map((e, i) => ({ i, e })).filter(({ e }) => visivel(e) && !e.disabled && !e.matches('[role=switch]') && !(topo && !topo.contains(e)) && !e.closest('#painelChat, #chatCentral, .chat-lado'))
      .map(({ e, i }) => ({ i, rotulo: nomeDe(e).replace(/\s+/g, ' ').trim().slice(0, 80), grupo: grupoDe(e).replace(/\s+/g, ' ').slice(0, 60),
        ir: e.getAttribute('data-ir') || e.getAttribute('data-area') || ((e.getAttribute('href') || '').startsWith('#') ? e.getAttribute('href').slice(1) : null),
        fora: e.tagName === 'A' && !!e.getAttribute('href') && !e.getAttribute('href').startsWith('#') && !e.getAttribute('href').startsWith('/painel') && !e.getAttribute('href').startsWith('/central'),
        voltar: e.classList.contains('voltar') }));
  }, { visivelSrc: visivelJs, dentroDe });
}
async function janelaAberta(page) {
  return page.evaluate(visivelSrc => { const visivel = eval(visivelSrc); const j = [...document.querySelectorAll('.janela[role=dialog], .janela[role=alertdialog]')].filter(visivel).pop();
    if (!j) return null; const h = j.querySelector('h2, h1'); return (j.getAttribute('aria-label') || (h && h.textContent) || 'Janela').trim(); }, visivelJs);
}
const SEL = 'button, a[href], [role=tab], [role=option]';
async function tocar(page, i, naJanela) {
  await page.evaluate(({ SEL, i, naJanela }) => { const raiz = naJanela ? [...document.querySelectorAll('.janela[role=dialog]')].pop() : document; const e = raiz && [...raiz.querySelectorAll(SEL)][i]; if (e) e.click(); }, { SEL, i, naJanela });
  await page.waitForTimeout(220);
}
// Explora um app (busca em largura). Cada ligação achada (de uma tela para outra, ou para uma folha) vira uma aresta
// { de, para, rotulo, grupo, via } (via = o item do ⋯ ou da folha que levou). op: { inicio, rotaDe(page, hash?), repor(page, hash) }
async function explorar(page, op) {
  const arestas = [], alcancadas = new Set(), quebrados = [], voltas = [];
  const inicio = await op.rotaDe(page); alcancadas.add(inicio);
  const fila = [op.inicio], hashes = new Map([[inicio, op.inicio]]);
  const novo = (rota, hash) => { if (!alcancadas.has(rota)) { alcancadas.add(rota); hashes.set(rota, hash); fila.push(hash); } };
  const tocadosNaRota = new Set();
  while (fila.length) {
    const hash = fila.shift();
    await op.repor(page, hash);
    const rota = await op.rotaDe(page);
    for (const t of await tocaveis(page)) {
      if (process.env.ALCANCE_DEBUG2) console.log('  cand', rota, JSON.stringify(t));
      if (t.fora || !t.rotulo) continue;
      if (t.ir != null) {   // destino escrito (data-ir, data-area, #): um caminho de toque sem precisar tocar
        const destino = await op.rotaDe(page, t.ir);
        if (destino == null) { quebrados.push(`${rota}: "${t.rotulo}" leva a "${t.ir}", que não existe`); continue; }
        if (t.voltar) voltas.push({ de: rota, para: destino, rotulo: t.rotulo });
        else if (destino !== rota) arestas.push({ de: rota, para: destino, rotulo: t.rotulo, grupo: t.grupo });
        novo(destino, t.ir); continue;
      }
      if (NAO_TOCAR.test(t.rotulo)) continue;
      const chave = rota + '|' + t.rotulo; if (tocadosNaRota.has(chave)) continue; tocadosNaRota.add(chave);
      await op.repor(page, hash);
      const alvo = (await tocaveis(page)).find(x => x.rotulo === t.rotulo); if (!alvo) continue;
      await tocar(page, alvo.i);
      const depois = await op.rotaDe(page), jan = await janelaAberta(page), hashDepois = await page.evaluate(() => location.hash.slice(1));
      if (process.env.ALCANCE_DEBUG) console.log('  tocou', rota, '|', t.rotulo, '→', depois, jan || '');
      if (!jan) { if (depois != null && depois !== rota) { arestas.push({ de: rota, para: depois, rotulo: t.rotulo, grupo: t.grupo }); novo(depois, hashDepois); } continue; }
      arestas.push({ de: rota, para: 'folha: ' + jan, rotulo: t.rotulo, grupo: t.grupo });
      // Um nível dentro da janela (o ⋯ Mais e as folhas de escolha): o que cada item abre.
      const dentro = (await tocaveis(page, '.janela[role=dialog]')).filter(x => x.rotulo && !NAO_TOCAR.test(x.rotulo) && !/^(fechar|cancelar)$/i.test(x.rotulo));
      for (const d of dentro.slice(0, 12)) {
        if (d.ir != null) { const dest = await op.rotaDe(page, d.ir); if (dest == null) quebrados.push(`${rota} › ${t.rotulo}: "${d.rotulo}" leva a "${d.ir}", que não existe`);
          else { arestas.push({ de: rota, para: dest, rotulo: d.rotulo, via: t.rotulo }); novo(dest, d.ir); } continue; }
        await op.repor(page, hash);
        const p2 = (await tocaveis(page)).find(x => x.rotulo === t.rotulo); if (!p2) break;
        await tocar(page, p2.i);
        const d2 = (await tocaveis(page, '.janela[role=dialog]')).find(x => x.rotulo === d.rotulo); if (!d2) continue;
        await tocar(page, d2.i, true);
        const r3 = await op.rotaDe(page), j3 = await janelaAberta(page), h3 = await page.evaluate(() => location.hash.slice(1));
        if (r3 != null && r3 !== rota) { arestas.push({ de: rota, para: r3, rotulo: d.rotulo, via: t.rotulo }); novo(r3, h3); }
        else if (j3 && j3 !== jan) arestas.push({ de: rota, para: 'folha: ' + j3, rotulo: d.rotulo, via: t.rotulo });
      }
    }
  }
  return { arestas, alcancadas, quebrados, voltas };
}
// O caminho de toque de cada tela pelo diagrama: o caminho da tela de cima mais o nome do botão que leva dela até aqui
// (com o ⋯ quando o botão está no Mais). Devolve { rota: ['Agenda', 'Horários', 'Feriados'] } e os que faltam ligação.
function caminhosPeloDiagrama(rotas, arestas, pai, raizes, curto) {
  const cam = new Map(Object.entries(raizes)), semLigacao = [];
  const pendentes = rotas.filter(r => !cam.has(r));
  for (let volta = 0; volta < 8 && pendentes.length; volta++) {
    for (let k = pendentes.length - 1; k >= 0; k--) {
      const r = pendentes[k], p = pai(r); if (!cam.has(p)) continue;
      // curto (Central): entre os toques que levam à seção, o nome do menu (o mais curto), não o texto de um aviso do início
      const cands = arestas.filter(x => x.de === p && x.para === r).sort((x, y) => (!!x.via - !!y.via) || (curto ? x.rotulo.length - y.rotulo.length : 0));
      const a = cands[0];
      if (a) cam.set(r, cam.get(p) ? [...cam.get(p), ...(a.via ? [a.via] : []), a.rotulo] : null);
      else { semLigacao.push(`${r} (devia sair de ${p})`); cam.set(r, null); }
      pendentes.splice(k, 1);
    }
  }
  for (const r of pendentes) semLigacao.push(`${r} (devia sair de ${pai(r)})`);
  return { cam, semLigacao };
}
// Variantes com o título do grupo ("Conta › Assinatura e WhatsApp › Plano e pagamento"), que os textos às vezes usam.
function comGrupos(cam, arestas, pai) {
  const out = new Set();
  for (const [r, c] of cam) {
    if (!c || !c.length) continue;
    out.add(c.join(' › '));
    const a = arestas.find(x => x.de === pai(r) && x.para === r && x.grupo);
    if (a && cam.get(pai(r))) out.add([...cam.get(pai(r)), a.grupo, a.rotulo].join(' › '));
  }
  // As folhas e as ações do ⋯ Mais ("Agenda › Mais › Bloquear horário"): também são caminhos de toque.
  for (const a of arestas) if (String(a.para).startsWith('folha: ') && cam.get(a.de)) out.add([...cam.get(a.de), ...(a.via ? [a.via] : []), a.rotulo].join(' › '));
  return out;
}

const site = await servirSite(); const browser = await abrirNavegador();
const todosCaminhos = { painel: new Set(), central: new Set(), demo: new Set() };
const lista = l => l.length ? ':\n    ' + l.slice(0, 30).join('\n    ') + (l.length > 30 ? `\n    … e mais ${l.length - 30}` : '') : '';

// ---------------------------------------------------------------- 1. painel
if (!SO || SO === 'painel') for (const largura of LARGURAS) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: largura < 700 ? 800 : 900 }, isMobile: largura < 700, hasTouch: largura < 1024 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('painel_sessao', 'a'.repeat(64)); } catch (e) {} });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request();
    if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responderPainel(q.url().slice(N8N.length), b)) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(site.base + '/painel/#hoje'); await page.locator('#app').waitFor({ state: 'visible' }); await page.waitForTimeout(400);
  const rotas = ROTAS_PAINEL;
  const r = await explorar(page, {
    inicio: 'hoje',
    rotaDe: async (p, hash) => hash != null ? rotaPainel(hash) : (rotaPainel(await p.evaluate(() => location.hash.slice(1) || 'hoje')) || 'hoje'),
    repor: async (p, hash) => {
      // Fecha as janelas e o teclado (a barra de baixo e o botão fixo somem com o teclado aberto, como no celular).
      await p.keyboard.press('Escape').catch(() => {}); await p.keyboard.press('Escape').catch(() => {});
      await p.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); document.body.classList.remove('teclado'); });
      await p.evaluate(x => { if (location.hash !== '#' + x) location.hash = x; else window.dispatchEvent(new HashChangeEvent('hashchange')); }, hash);
      await p.waitForTimeout(260);
    },
  });
  const faltam = rotas.filter(x => !r.alcancadas.has(x));
  ok(!faltam.length, `painel, ${largura} px: ${rotas.length - faltam.length} de ${rotas.length} telas alcançadas só tocando a partir de Hoje` + lista(faltam));
  // Pelo diagrama (painel-novo.md, seção 9): cada tela sai da tela de cima com um toque (ou pelo ⋯ dela), e o voltar
  // de cada uma leva à tela de cima.
  const { cam, semLigacao } = caminhosPeloDiagrama(rotas, r.arestas, paiPainel, { hoje: ['Hoje'], agenda: ['Agenda'], pacientes: ['Pacientes'], assistente: ['Assistente'], conta: ['Conta'] });
  ok(!semLigacao.length, `painel, ${largura} px: cada tela abre com um toque a partir da tela de cima no diagrama` + lista(semLigacao));
  ok(!r.quebrados.length, `painel, ${largura} px: nenhum botão leva a uma tela que não existe` + lista(r.quebrados));
  const voltasRuins = r.voltas.filter(v => v.para !== paiPainel(v.de)).map(v => `${v.de}: o voltar "${v.rotulo}" leva a ${v.para} (devia ser ${paiPainel(v.de)})`);
  // Sem voltar, de propósito: as visões da Agenda (abas Lista de espera e Documentos, regra 5) e, no iPad deitado e no
  // computador, as páginas do Assistente e da Conta (o menu de assuntos fica ao lado, molde D).
  const semVoltar = rotas.filter(x => x.includes('/') && r.alcancadas.has(x) && !r.voltas.some(v => v.de === x) && !['agenda/espera', 'agenda/documentos'].includes(x)
    && !(largura >= 1024 && ['assistente', 'conta'].includes(x.split('/')[0]) && x.split('/').length === 2));
  ok(!voltasRuins.length && !semVoltar.length, `painel, ${largura} px: toda tela de segundo nível tem o voltar, e ele leva à tela de cima` + lista([...voltasRuins, ...semVoltar.map(x => x + ': sem voltar')]));
  const folhasEsperadas = ['Nova consulta', 'Bloquear horário', 'Mais'];
  const semFolha = folhasEsperadas.filter(f => !r.arestas.some(x => x.para === 'folha: ' + f));
  ok(!semFolha.length, `painel, ${largura} px: as folhas ${folhasEsperadas.join(', ')} abrem só tocando` + lista(semFolha));
  for (const c of comGrupos(cam, r.arestas, paiPainel)) todosCaminhos.painel.add(c);
  if (process.env.ALCANCE_MOSTRAR) console.log([...cam].map(([k, v]) => '  ' + k + ' ← ' + (v ? v.join(' › ') : '(sem ligação)')).join('\n'));
  await ctx.close();
}

// ---------------------------------------------------------------- 2. Central
if (!SO || SO === 'central') for (const largura of LARGURAS_CENTRAL) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: largura < 700 ? 800 : 900 }, isMobile: largura < 700, hasTouch: largura < 1024 });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await entrarCentral(page, site.base, CHAVES_LIGADAS(), []);
  await page.waitForTimeout(300);
  // "Mais" é a tela do celular e do iPad que reúne as seções que não cabem na barra; no computador, todas ficam no menu.
  const esperadas = [...TELAS_CENTRAL.filter(x => x !== 'mais' || largura < 1024), 'seguranca/registro', 'clientes/CLI-001'];
  const r = await explorar(page, {
    inicio: 'hoje',
    rotaDe: async (p, hash) => {
      const h = (hash != null ? hash : await p.evaluate(() => location.hash.slice(1) || 'hoje')).replace(/^#/, '');
      const [nome, sub] = h.split('/');
      if (!TELAS_CENTRAL.includes(nome)) return hash != null ? null : 'hoje';
      return sub && ['clientes', 'seguranca', 'prospeccao', 'demonstracoes'].includes(nome) ? nome + '/' + decodeURIComponent(sub) : nome;
    },
    repor: async (p, hash) => {
      await p.keyboard.press('Escape').catch(() => {});
      await p.evaluate(x => { if (location.hash !== '#' + x) location.hash = x; }, hash);
      await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(250);
    },
  });
  const faltam = esperadas.filter(x => !r.alcancadas.has(x));
  ok(!faltam.length, `Central, ${largura} px: ${esperadas.length - faltam.length} de ${esperadas.length} telas alcançadas só tocando a partir do início` + lista(faltam));
  ok(!r.quebrados.length, `Central, ${largura} px: nenhum botão leva a uma tela que não existe` + lista(r.quebrados));
  // A Central não tem diagrama de navegação próprio: cada seção sai do menu (lateral no computador, barra e "Mais" no
  // celular) e as abas e a ficha saem da própria seção.
  const paiCentral = x => x.includes('/') ? x.split('/')[0] : 'hoje';
  const raizesC = Object.fromEntries([['hoje', []]]);
  const { cam } = caminhosPeloDiagrama([...r.alcancadas].filter(x => x !== 'hoje'), r.arestas, x => (x.includes('/') ? x.split('/')[0] : (r.arestas.some(a => a.de === 'mais' && a.para === x) && !r.arestas.some(a => a.de === 'hoje' && a.para === x) ? 'mais' : 'hoje')), raizesC, true);
  for (const c of comGrupos(cam, r.arestas, paiCentral)) todosCaminhos.central.add(c);
  if (process.env.ALCANCE_MOSTRAR) console.log([...cam].map(([k, v]) => '  ' + k + ' ← ' + (v ? v.join(' › ') : '(sem ligação)')).join('\n'));
  await ctx.close();
}

// ---------------------------------------------------------------- 3. demonstração (várias páginas: entrada, central da demo, escopo e manual)
if (!SO || SO === 'demo') for (const largura of LARGURAS) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, isMobile: largura < 700, hasTouch: largura < 1024 });
  // A demonstração só abre com o código do link (DEC-125): o servidor dela é simulado, como no demo_clinica_telas.mjs.
  const N8N_DEMO = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demonstracao', CODIGO = 'ACDEFGHJKMNPQRTU';
  await ctx.route(N8N_DEMO, route => { let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(b.tipo === 'abrir'
      ? { ok: true, dados: { clinica: 'Clínica Teste', tratamento: 'Dra.', medico: 'Helena Prado', especialidade: 'Endocrinologia', cidade: 'Curitiba', cor: 'petroleo', escopo: {}, escopo_enviado_em: null } } : { ok: true }) }); });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N_DEMO) ? r.fallback() : r.abort());
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const paginas = new Map([['/demo/clinica/', []]]), fila = ['/demo/clinica/'];
  while (fila.length) {
    const p = fila.shift();
    await page.goto('about:blank'); await page.goto(site.base + p + '#' + CODIGO); await page.waitForTimeout(900);
    const links = await page.evaluate(visivelSrc => { const visivel = eval(visivelSrc); return [...document.querySelectorAll('a[href]')].filter(visivel).map(a => ({ rotulo: (a.getAttribute('aria-label') || a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), url: new URL(a.getAttribute('href'), location.href) }))
      .filter(x => x.url.origin === location.origin && x.url.pathname.startsWith('/demo/clinica/')).map(x => ({ rotulo: x.rotulo, caminho: x.url.pathname.replace(/index\.html$/, '') })); }, visivelJs);
    for (const l of links) if (!paginas.has(l.caminho)) { paginas.set(l.caminho, [...paginas.get(p), l.rotulo]); fila.push(l.caminho); }
  }
  const esperadas = ['/demo/clinica/', '/demo/clinica/app/', '/demo/clinica/central/', '/demo/clinica/escopo/', '/demo/clinica/manual/'];
  const faltam = esperadas.filter(x => !paginas.has(x));
  ok(!faltam.length, `demonstração, ${largura} px: ${esperadas.length - faltam.length} de ${esperadas.length} páginas alcançadas só tocando a partir da entrada` + lista(faltam));
  await ctx.close();
}

await browser.close(); site.fechar();
// Os caminhos de toque, para a conferência dos caminhos escritos (verificar_site.mjs e, no rxsync-sistema, verificar.mjs).
if (GRAVAR && !SO) {
  const arq = path.join(RAIZ, 'scripts', 'caminhos_validos.json');
  // Fora da lista: o estado da assistente ("Atendendo", que abre em toda tela) e os avisos do início da Central ("Informação: 3 …").
  const ruido = c => /(^| › )(Atendendo|Pausada|Em teste)( › |$)/.test(c) || /^[^›]*: \d/.test(c);
  const ordenar = s => [...s].filter(c => c && !c.includes('folha:') && !ruido(c)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  fs.writeFileSync(arq, JSON.stringify({ _sobre: 'Caminhos de toque do painel e da Central, gravados pelo scripts/painel_alcance.mjs --gravar (não edite à mão). O verificar_site.mjs e o verificar.mjs do rxsync-sistema conferem que todo "X › Y" escrito nos textos é um destes caminhos (ou o começo de um).', painel: ordenar(todosCaminhos.painel), central: ordenar(todosCaminhos.central) }, null, 1) + '\n');
  console.log('Gravado: scripts/caminhos_validos.json');
}
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: tudo alcançável só tocando.');
process.exit(falhas ? 1 : 0);
