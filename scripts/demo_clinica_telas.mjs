// Demonstração por link (demo/clinica/, DEC-125): fotos e conferências de todas as telas no celular (360, 390 e 430 px),
// no iPad e no computador, com o workflow 43 SIMULADO (nada sai para a internet; dados inventados). Confere em cada
// tela: nenhuma rolagem para o lado, alvos de toque de 44 px, contraste do texto (4,5:1; texto grande 3:1), nenhum
// "null"/"undefined" na tela e nenhum erro no console. Confere também os caminhos: marcar e enviar o escopo, "Quero
// conversar", pergunta no chat (vai no lote de eventos), link inativo, fora do ar e sem código.
// Uso (precisa do Playwright): node scripts/demo_clinica_telas.mjs [pasta das fotos]   ·   sem fotos: node scripts/demo_clinica_telas.mjs - sem-fotos
import fs from 'node:fs';
import { abrirNavegador, servirSite } from './central_simulado.mjs';
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demonstracao';
const OUT = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : 'fotos-demo', FOTOS = process.argv[3] !== 'sem-fotos';
if (FOTOS) fs.mkdirSync(OUT, { recursive: true });
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } return c; };
const ATIVO = 'ACDEFGHJKMNPQRTU', INATIVO = 'VWXY3479ACDEFGHJ', FORA = 'KMNPQRTUVWXY3479';
const DADOS = { clinica: 'Instituto Bem Estar Integrado', tratamento: 'Dra.', medico: 'Helena Prado', especialidade: 'Endocrinologia', cidade: 'Curitiba', cor: 'petroleo',
  escopo: { 7: { e: 'quero', n: '' }, 36: { e: 'duvida', n: 'Funciona no Android?' } }, escopo_enviado_em: null };

// Workflow 43 simulado: guarda cada pedido em "pedidos".
function simular(pedidos) {
  return async route => {
    let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch {}
    pedidos.push({ ...b, _cab: route.request().headers() });
    const r = o => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
    if (b.codigo === INATIVO) return r({ ok: false, inativo: true });
    if (b.codigo === FORA) return r({ ok: false, motivo: 'indisponivel' });
    if (b.tipo === 'abrir') return r({ ok: true, dados: DADOS });
    if (b.tipo === 'eventos') return r({ ok: true, gravados: (b.eventos || []).length });
    return r({ ok: true, ...(b.enviar ? { enviado: true } : {}) });
  };
}
function medir() {
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden]'); };
  const pequenos = [...document.querySelectorAll('button, input:not([type=hidden]):not([type=checkbox]), select, textarea, a[href], [role=switch]')].filter(vis).filter(e => {
    if (e.matches('a') && e.closest('p')) return false;   // link dentro do texto
    const b = e.getBoundingClientRect(), extra = getComputedStyle(e, '::before').content !== 'none' && (e.matches('.item, .chave')) ? 16 : 0;
    return b.height + extra < 43.5 || (e.matches('button, [role=switch]') && b.width + extra < 43.5);
  }).map(e => (e.getAttribute('aria-label') || e.textContent.trim() || e.tagName).slice(0, 24) + ` (${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)})`);
  const cor = s => { const m = (s.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number), k = s.startsWith('color(') ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m[3] == null ? 1 : m[3] }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const fundo = e => { const camadas = []; for (let x = e; x; x = x.parentElement) { const c = cor(getComputedStyle(x).backgroundColor); if (c.a > 0) { camadas.push(c); if (c.a >= 1) break; } }
    let b = { r: 255, g: 255, b: 255 }; for (const c of camadas.reverse()) b = { r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a) }; return b; };
  const baixos = [];
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e) || e.closest('svg') || e.disabled) continue;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(e), t = cor(cs.color), f = fundo(e), tt = { r: t.r * t.a + f.r * (1 - t.a), g: t.g * t.a + f.g * (1 - t.a), b: t.b * t.a + f.b * (1 - t.a) };
    const L1 = lum(tt), L2 = lum(f), razao = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05), px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    if (razao < (grande ? 3 : 4.5)) baixos.push(`${e.textContent.trim().slice(0, 24)} ${razao.toFixed(2)}`);
  }
  return { pequenos: [...new Set(pequenos)].slice(0, 8), baixos: [...new Set(baixos)].slice(0, 8), rolagem: document.documentElement.scrollWidth > window.innerWidth + 1,
    lixo: document.body.innerText.match(/\b(null|undefined|NaN|\[object Object\])\b/g) || [] };
}

const TELAS = [['', 'entrada'], ['app/', 'app (boas-vindas)'], ['app/', 'app início', 'tela=inicio'], ['app/', 'app registrar', 'tela=registrar'], ['app/', 'app refeição', 'tela=refeicao'],
  ['app/', 'app picadinha', 'tela=picadinha'], ['app/', 'app evolução', 'tela=evolucao'], ['app/', 'app mais', 'tela=mais'], ['app/', 'app assistente', 'tela=assistente'], ['app/', 'app chat', 'tela=chat-equipe'],
  ['app/', 'app lembretes', 'tela=lembretes'], ['app/', 'app buscar', 'tela=buscar'], ['app/', 'app foto', 'tela=foto'], ['app/', 'app sono', 'tela=sono'], ['central/', 'central'], ['central/', 'central alertas', 'tela=alertas'], ['central/', 'central ficha', 'tela=ficha'], ['central/', 'central metas', 'tela=metas'],
  ['central/', 'central picadinha', 'tela=picadinha'], ['central/', 'central avisos', 'tela=avisos'], ['central/', 'central funções', 'tela=funcoes'], ['escopo/', 'escopo'], ['escopo/', 'escopo item 23', 'item=23']];
const APARELHOS = [['celular360', { width: 360, height: 740 }, true], ['celular390', { width: 390, height: 844 }, true], ['celular430', { width: 430, height: 932 }, true],
  ['ipad', { width: 820, height: 1180 }, true], ['computador', { width: 1440, height: 900 }, false]];

const site = await servirSite(); const browser = await abrirNavegador();
let fotos = 0;
for (const [nomeAp, vp, toque] of APARELHOS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: nomeAp.startsWith('celular'), hasTouch: toque });
  const page = await ctx.newPage(); const erros = [], pedidos = [];
  page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.route(N8N, simular(pedidos));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
  let n = 0;
  for (const [cam, nome, extra] of TELAS) {
    n++;
    await page.goto(`${site.base}/demo/clinica/${cam}#${ATIVO}${extra ? '&' + extra : ''}`);
    await page.waitForFunction(() => !document.querySelector('.carregando') && document.querySelector('#raiz h1, #raiz h2'), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(150);
    const med = await page.evaluate(medir), onde = `${nomeAp} ${nome}`;
    ok(!med.rolagem, `${onde}: rolagem para o lado`);
    ok(!med.pequenos.length, `${onde}: alvo de toque pequeno: ${JSON.stringify(med.pequenos)}`);
    ok(!med.baixos.length, `${onde}: contraste baixo: ${JSON.stringify(med.baixos)}`);
    ok(!med.lixo.length, `${onde}: texto quebrado: ${med.lixo.join(', ')}`);
    ok(await page.locator('#raiz').innerText().then(t => t.includes('Instituto Bem Estar Integrado')), `${onde}: o nome da clínica não aparece`);
    if (FOTOS) {
      const alto = Math.max(vp.height, await page.evaluate(() => document.documentElement.scrollHeight));
      await page.setViewportSize({ width: vp.width, height: Math.min(alto, 6000) }); await page.waitForTimeout(100);
      await page.screenshot({ path: `${OUT}/${nomeAp}_${String(n).padStart(2, '0')}_${nome.replace(/[^a-z0-9]+/gi, '-')}.png` }); fotos++;
      await page.setViewportSize(vp);
    }
  }
  // Nenhum pedido leva o código no endereço; todos levam o x-rxsync-origem (menos o sendBeacon, que não tem cabeçalho).
  ok(pedidos.every(p => p.codigo === ATIVO || p.tipo === 'eventos'), `${nomeAp}: pedido sem o código no corpo`);
  ok(pedidos.filter(p => p.tipo === 'abrir').every(p => p._cab['x-rxsync-origem'] === 'rxsync-site-2026' && /^[0-9a-f]{20}$/.test(p.aparelho) && /^[0-9a-f]{20}$/.test(p.sessao)), `${nomeAp}: abrir sem origem, aparelho ou sessão`);
  ok(!erros.length, `${nomeAp}: erro no console: ${erros.join(' | ')}`);
  await ctx.close();
}

// Caminhos, no celular de 390 px.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const pedidos = [], erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.route(N8N, simular(pedidos));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().startsWith(N8N) ? r.fallback() : r.abort());
  const espera = async (fn, ms = 4000) => { for (let i = 0; i < ms / 50; i++) { const x = fn(); if (x) return x; await page.waitForTimeout(50); } return null; };
  // Aviso de privacidade no 1º acesso, "Entendi" some com ele.
  await page.goto(`${site.base}/demo/clinica/#${ATIVO}`); await page.waitForSelector('.portas');
  ok(await page.locator('.faixa').count() === 1 && /180 dias/.test(await page.locator('.faixa').innerText()), 'privacidade: a faixa aparece no 1º acesso, com os 180 dias');
  await page.getByRole('button', { name: 'Entendi' }).click();
  await page.reload(); await page.waitForSelector('.portas');
  ok(await page.locator('.faixa').count() === 0, 'privacidade: depois do "Entendi", a faixa não volta');
  // Quero conversar: só avisa (sem WhatsApp, sem telefone) e mostra "Pronto, o Jean vai te chamar".
  await page.getByRole('button', { name: 'Quero conversar' }).first().click();
  await page.fill('#recado', 'Pode me chamar à tarde'); await page.getByRole('button', { name: 'Enviar' }).click();
  const conv = await espera(() => pedidos.find(p => p.tipo === 'conversar'));
  ok(conv && conv.texto === 'Pode me chamar à tarde', 'conversar: o recado vai no pedido');
  await page.waitForSelector('text=Pronto, o Jean vai te chamar.');
  ok(!/wa\.me|whatsapp:\/\/|tel:/.test(await page.content()), 'conversar: nenhum link de WhatsApp nem telefone na página');
  // Escopo: marcar "Quero" no item 23 grava em 1,5 s; "Enviar para a RXSync" manda tudo.
  await page.goto(`${site.base}/demo/clinica/escopo/#${ATIVO}`); await page.waitForSelector('#item-23');
  await page.locator('#item-23').getByRole('button', { name: 'Quero' }).click();
  const marc = await espera(() => pedidos.find(p => p.tipo === 'escopo' && !p.enviar), 4000);
  ok(marc && marc.escolhas && marc.escolhas['23'] && marc.escolhas['23'].e === 'quero', `escopo: a escolha do item 23 vai sozinha (${JSON.stringify(marc && marc.escolhas)})`);
  ok(/2 quero/.test(await page.locator('.contagem').innerText()), 'escopo: a contagem sobe para 2 quero');
  await page.getByRole('button', { name: 'Enviar para a RXSync' }).first().click();
  const env = await espera(() => pedidos.find(p => p.tipo === 'escopo' && p.enviar));
  ok(env && env.escolhas['7'].e === 'quero' && env.escolhas['36'].n === 'Funciona no Android?' && env.escolhas['23'].e === 'quero', 'escopo: o envio leva todas as escolhas (as do servidor e a nova)');
  await page.waitForSelector('text=Escopo enviado');
  // Ver na tela: leva ao app com o item destacado.
  await page.goto(`${site.base}/demo/clinica/app/#${ATIVO}&tela=picadinha&item=25`); await page.waitForSelector('.item.destaque');
  ok(await page.locator('.item.destaque').getAttribute('data-item') === '25', 'ver na tela: o item 25 fica destacado no app');
  // Marcador: abre o balão com o item e o "Ver no escopo".
  await page.locator('.item[data-item="23"]').click();
  ok(/Picadinha/.test(await page.locator('.janela').innerText()) && await page.locator('.janela a', { hasText: 'Ver no escopo' }).getAttribute('href') === `../escopo/#${ATIVO}&item=23`, 'marcador: o balão leva ao item no escopo');
  await page.keyboard.press('Escape');
  // Pergunta no chat do assistente: vai no lote de eventos (a cada 10 s), com o chat e o texto; o resto da tela não.
  await page.goto(`${site.base}/demo/clinica/app/#${ATIVO}&tela=assistente`); await page.waitForSelector('#msg-ia');
  await page.fill('#msg-ia', 'Posso tomar café?'); await page.getByRole('button', { name: 'Enviar' }).click();
  await page.waitForSelector('text=Pela orientação da sua equipe');
  const ev = await espera(() => pedidos.find(p => p.tipo === 'eventos' && (p.eventos || []).some(e => e.acao === 'pergunta')), 12000);
  const perg = ev && ev.eventos.find(e => e.acao === 'pergunta');
  ok(perg && perg.detalhe.chat === 'ia' && perg.detalhe.texto === 'Posso tomar café?' && perg.pagina === 'app' && perg.tela === 'assistente', `chat: a pergunta vai no lote de eventos (${JSON.stringify(perg)})`);
  ok(ev && ev.eventos.some(e => e.acao === 'abriu-tela') && ev.eventos.every(e => /^[a-z][a-z0-9-]{1,30}$/.test(e.acao) && ['entrada', 'app', 'central', 'escopo'].includes(e.pagina)), 'eventos: formato que o servidor aceita');
  // Estados: inativo, fora do ar e sem código.
  await page.goto(`${site.base}/demo/clinica/app/#${INATIVO}`); await page.waitForSelector('text=Este link não está mais ativo');
  ok(await page.locator('a', { hasText: 'Pedir uma demonstração' }).getAttribute('href') === '../../../#contato', 'inativo: "Pedir uma demonstração" leva ao formulário do site');
  await page.goto(`${site.base}/demo/clinica/#${FORA}`); await page.waitForSelector('text=A demonstração está fora do ar por alguns minutos. Tente de novo daqui a pouco.');
  ok(true, 'fora do ar: mensagem amigável');
  await page.goto(`${site.base}/demo/clinica/`); await page.waitForSelector('text=Pedir uma demonstração');
  ok(await page.locator('h1').innerText() === 'Demonstração do app de acompanhamento', 'sem código: o convite');
  await page.goto(`${site.base}/demo/clinica/central/`); await page.waitForURL(/\/demo\/clinica\/$/);
  ok(true, 'sem código fora da entrada: volta para a entrada');
  // Rodada de melhoria: nenhum beco sem saída. Cada botão mostra um resultado simulado, e tudo fica na memória da página.
  const telaApp = async (tela) => { await page.goto(`${site.base}/demo/clinica/app/#${ATIVO}&tela=${tela}`); await page.waitForSelector('#conteudo h2, #conteudo h1'); };
  const textoMain = () => page.locator('#conteudo').innerText();
  const nPedidos = () => pedidos.filter(p => p.tipo !== 'eventos' && p.tipo !== 'abrir').length;
  const antesPedidos = nPedidos();
  // Buscar alimento → detalhe → porção → "Registrar": volta para Refeição com o total, e a meta do dia sobe.
  await telaApp('inicio');
  const kcalAntes = await page.locator('.meta', { hasText: 'Calorias' }).innerText();
  await page.getByRole('button', { name: 'Registrar refeição' }).click();
  await page.getByRole('button', { name: 'Buscar alimento' }).click();
  await page.fill('#busca-alimento', 'frango');
  ok(await page.locator('#conteudo .linha-app').count() === 1, 'buscar: "frango" acha 1 alimento');
  await page.locator('#conteudo .linha-app', { hasText: 'Peito de frango' }).click();
  await page.getByRole('radio', { name: '2' }).click();
  ok(/318 kcal/.test(await textoMain()) && /64 g/.test(await textoMain()), 'alimento: 2 porções dobram os nutrientes (318 kcal, 64 g de proteína)');
  await page.getByRole('button', { name: /^Registrar no / }).click();
  ok(/Peito de frango grelhado/.test(await textoMain()) && /Total: 1\.178 kcal/.test(await textoMain()), 'registrar: o alimento entra na lista de hoje e o total sobe');
  await page.getByRole('button', { name: 'Início' }).click();
  const kcalDepois = await page.locator('.meta', { hasText: 'Calorias' }).innerText();
  ok(kcalAntes !== kcalDepois && /1\.178 de 1\.600/.test(kcalDepois), `início: a meta de calorias sobe (${kcalAntes} → ${kcalDepois})`);
  // Foto do prato: lê em 1 s e mostra os alimentos para confirmar.
  await page.getByRole('button', { name: 'Registrar refeição' }).click();
  await page.getByRole('button', { name: 'Foto do prato' }).click();
  await page.getByRole('button', { name: 'Tirar a foto' }).click();
  await page.waitForSelector('text=Encontrei no prato', { timeout: 3000 });
  ok(await page.locator('#conteudo .marcar').count() === 4, 'foto: 4 alimentos identificados para confirmar');
  await page.locator('#conteudo .marcar', { hasText: 'Salada' }).locator('input').uncheck();
  await page.getByRole('button', { name: 'Registrar 3 alimentos' }).click();
  ok(/Feijão carioca/.test(await textoMain()), 'foto: os alimentos confirmados entram na lista');
  // Código de barras: lê e abre o detalhe do produto.
  await page.getByRole('button', { name: 'Código de barras' }).click();
  await page.getByRole('button', { name: 'Ler o código' }).click();
  await page.waitForSelector('text=Iogurte natural integral', { timeout: 3000 });
  ok(await page.getByRole('button', { name: /^Registrar no / }).count() === 1, 'código: abre o detalhe com "Registrar"');
  // Registros simples: confirmam, somam pontos e aparecem na lista.
  await telaApp('inicio');
  const pontos = async () => Number((await page.locator('.grande-num').first().innerText()).split(' ')[0]);
  const p0 = await pontos();
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await page.locator('#conteudo .linha-app', { hasText: 'Sono' }).click();
  await page.getByRole('button', { name: 'Registrar', exact: true }).last().click();
  ok(/Escolha uma opção/.test(await textoMain()), 'sono: sem escolher, pede a escolha');
  await page.getByRole('radio', { name: '7 a 8h' }).click(); await page.getByRole('radio', { name: 'Bem', exact: true }).click();
  await page.locator('#conteudo').getByRole('button', { name: 'Registrar', exact: true }).click();
  ok(/7 a 8h · Bem/.test(await page.locator('#conteudo .linha-app', { hasText: 'Sono' }).innerText()), 'sono: aparece na lista de Registrar');
  await page.getByRole('button', { name: 'Início' }).click();
  ok(await pontos() === p0 + 5, `sono: +5 pontos na tela inicial (${p0} → ${await pontos()})`);
  // Água: soma e atualiza.
  await page.locator('#conteudo').getByRole('button', { name: 'Água' }).click();
  await page.getByRole('button', { name: '1 garrafa (2 copos)' }).click();
  ok(/6 de 8 copos/.test(await textoMain()), 'água: 1 garrafa soma 2 copos');
  // Picadinha: sem número de dose; campos travados; mapa do corpo; registrar muda o último local.
  await telaApp('picadinha');
  const pic = await textoMain();
  ok(/Medicamento cadastrado pela equipe/.test(pic) && (pic.match(/Preenchido pela equipe/g) || []).length === 3, 'picadinha: medicamento e os 3 campos "Preenchido pela equipe"');
  ok(!/\d+(,\d+)?\s*(mg|ml|mL|UI|mcg)\b/.test(pic), 'picadinha: nenhum número de dose');
  ok(await page.locator('svg.corpo .local.sugerido').count() === 1 && await page.locator('svg.corpo .local.ultimo').count() === 1, 'rodízio: o mapa marca o último local e o sugerido');
  ok(await page.getByRole('radio', { name: 'Abdômen direito' }).isDisabled(), 'rodízio: o último local não pode ser escolhido de novo');
  await page.getByRole('radio', { name: 'Enjoo forte' }).click();
  await page.getByRole('button', { name: 'Registrar aplicação' }).click();
  await page.waitForSelector('text=A enfermagem da clínica recebeu um aviso');
  await page.keyboard.press('Escape');
  ok(/Última: abdômen esquerdo/.test(await textoMain()) && /Sexta que vem/.test(await textoMain()), 'picadinha: o local e a próxima aplicação mudam');
  // O que não dá para simular: uma frase explica o app de verdade.
  await telaApp('exames'); await page.getByRole('button', { name: 'Escolher arquivo' }).click();
  ok(/No app de verdade, abre os arquivos do celular/.test(await textoMain()), 'exames: explica o que acontece no app de verdade');
  await telaApp('meus-dados'); await page.getByRole('button', { name: 'Baixar meus dados' }).click();
  ok(/No app de verdade, você recebe um arquivo/.test(await textoMain()), 'meus dados: explica o que acontece no app de verdade');
  await telaApp('consultas'); await page.getByRole('button', { name: 'Confirmar presença' }).click();
  ok(/Presença confirmada/.test(await textoMain()), 'consultas: confirmar presença');
  // Central: Enviar ao app, Cadastrar prescrição, Conferir, Enviar recado.
  const telaCentral = async (tela) => { await page.goto(`${site.base}/demo/clinica/central/#${ATIVO}&tela=${tela}`); await page.waitForSelector('#conteudo h2'); };
  await telaCentral('metas'); await page.selectOption('#metas-paciente', '3'); await page.fill('#m-kcal', '1500');
  await page.getByRole('button', { name: 'Enviar ao app' }).click();
  ok(/Enviado ao app de Beatriz Lima/.test(await textoMain()), 'central metas: "Enviado ao app de Beatriz Lima"');
  await telaCentral('picadinha');
  await page.getByRole('button', { name: 'Conferir a prescrição de Beatriz Lima' }).click();
  ok(await page.getByRole('button', { name: /^Conferir a prescrição/ }).count() === 0, 'central picadinha: conferir muda para "Conferida"');
  await page.selectOption('#presc-paciente', 'Carlos Souza'); await page.getByRole('button', { name: 'Cadastrar prescrição' }).click();
  ok(await page.getByRole('button', { name: 'Conferir a prescrição de Carlos Souza' }).count() === 1, 'central picadinha: a prescrição nova aparece "esperando a conferência"');
  ok(!/\d+(,\d+)?\s*(mg|ml|mL|UI|mcg)\b/.test(await textoMain()), 'central picadinha: nenhum número de dose');
  await telaCentral('avisos'); await page.getByRole('radio', { name: 'Um grupo' }).click(); await page.getByRole('button', { name: 'Enviar recado' }).click();
  ok(/Grupo "Adaptação"/.test(await page.locator('#conteudo .cartao', { hasText: 'Recados enviados' }).innerText()), 'central avisos: o recado aparece em "Recados enviados"');
  // Tudo na memória: nenhum pedido novo ao servidor além do registro de uso; e nenhum "nada é guardado".
  ok(nPedidos() === antesPedidos, `memória: nenhum pedido ao servidor além de abrir e eventos (${nPedidos() - antesPedidos} a mais)`);
  ok(!/nada é guardado/i.test(await page.content()), 'nenhum "nada é guardado"');
  ok(!erros.length, 'caminhos: erro no console: ' + erros.join(' | '));
  await ctx.close();
}
await browser.close(); site.fechar();
console.log(`${fotos} fotos. ` + (falhas ? falhas + ' falha(s).' : 'Tudo certo: celular de 360 a 430 px, iPad e computador; caminhos do escopo, conversar, chat, inativo e fora do ar.'));
process.exit(falhas ? 1 : 0);
