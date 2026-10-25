// Painel (painel/, DEC-156): testa pela tela a aba Pacientes, com o n8n SIMULADO aqui (nada sai para a internet; pacientes
// inventados):
//   1. a lista e a busca (que espera a segunda letra);
//   2. a ficha, com os possíveis duplicados, e juntar dois cadastros (com a confirmação);
//   3. "Não quer receber avisos" (com a confirmação) e voltar a enviar só com a frase exata;
//   4. excluir a pedido do paciente: recusado com consulta futura; depois, excluído e fora da lista;
//   5. a tela de possíveis duplicados;
//   6. como equipe, a aba funciona igual (com a sessão; quem decide o que pode é o servidor);
//   7. sem o recurso "pacientes" no plano, aparece o convite e nada é pedido ao servidor.
// Uso (precisa do Playwright): node scripts/painel_pacientes.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const FRASE = 'O paciente pediu para voltar a receber os avisos';
const dia = n => new Date(Date.now() + n * 86400000).toISOString();
const chamadas = []; const estado = { papel: 'dono', recurso: true, pacientes: [] };
function reiniciar() {
  estado.pacientes = [
    { paciente_id: 'PAC-0001', nome: 'Ana Silva Teste', telefone: '41999990001', email: 'ana@exemplo.test', conversou_em: dia(-5), criado_em: dia(-90), origem: 'painel', ultima_consulta: dia(-20) },
    { paciente_id: 'PAC-0002', nome: 'Ana Silva Teste', telefone: '41999990001', conversou_em: null, criado_em: dia(-10), origem: 'planilha', importado_em: dia(-10) },
    { paciente_id: 'PAC-0003', nome: 'Bruno Teste', telefone: '41988880002', conversou_em: dia(-2), criado_em: dia(-60), origem: 'painel', proxima_consulta: dia(3) }];
}
const achar = id => estado.pacientes.find(p => p.paciente_id === id);
const sem_acento = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function banco(acao, d) {
  if (acao === 'paciente_listar') {
    const b = sem_acento(d.busca || ''), l = estado.pacientes.filter(p => !b || sem_acento(p.nome).includes(b) || p.telefone.endsWith(b) || p.paciente_id.toLowerCase() === b);
    return { ok: true, total: l.length, pacientes: l };
  }
  if (acao === 'paciente_ver') {
    const p = achar(d.paciente_id); if (!p) return { ok: false, erro: 'nao_encontrado' };
    return { ok: true, paciente: p, ultima_consulta: p.ultima_consulta || null, total_passadas: 1,
      consultas_futuras: p.proxima_consulta ? [{ inicio: p.proxima_consulta, servico: 'Retorno', status: 'confirmado' }] : [],
      consultas_passadas: [{ inicio: dia(-20), servico: 'Avaliação', status: 'realizado', criado_por: 'ia' }],
      possiveis_duplicados: estado.pacientes.filter(q => q !== p && q.nome === p.nome).map(q => ({ ...q, mesmo_telefone: q.telefone === p.telefone })) };
  }
  if (acao === 'paciente_juntar') { estado.pacientes = estado.pacientes.filter(p => p.paciente_id !== d.sai); return { ok: true, consultas: 1, telefone_descartado: false }; }
  if (acao === 'paciente_nao_contatar') {
    if (!d.marcar && d.frase !== FRASE) return { ok: false, erro: 'frase' };
    achar(d.paciente_id).nao_contatar_em = d.marcar ? dia(0) : null; return { ok: true, pacientes: 1 };
  }
  if (acao === 'paciente_excluir') {
    const p = achar(d.paciente_id);
    if (p.proxima_consulta) return { ok: false, erro: 'consulta_futura', consultas_futuras: 1 };
    estado.pacientes = estado.pacientes.filter(q => q !== p); return { ok: true, consultas_anonimizadas: 1 };
  }
  if (acao === 'paciente_duplicados') {
    const g = {}; estado.pacientes.forEach(p => (g[p.nome] = g[p.nome] || []).push(p));
    return { ok: true, grupos: Object.entries(g).filter(([, l]) => l.length > 1).map(([nome, l]) => ({ nome, mesmo_telefone: new Set(l.map(p => p.telefone)).size === 1, pacientes: l })) };
  }
  return null;
}
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'painel-entrada') return b.acao === 'termos_estado' ? { ok: true, pendente: false, papel: estado.papel } : { ok: true };
  if (caminho !== 'autoedicao') return { ok: true, data: [] };
  if (b.acao === 'abrir') return { ok: true, papel: estado.papel, editaveis: { nome_exibicao: 'Clínica Teste Pacientes', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: estado.recurso ? 'Gestão Inteligente' : 'Essencial' },
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono'].map(k => [k, false]).concat([['pacientes', estado.recurso]])), limite_catalogo: 500 };
  const r = banco(b.acao, b.dados || {});
  return r ? { ok: true, data: r } : { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const erros = [];
async function abrir() {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request();
    if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
  });
  const page = await ctx.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', e => erros.push(String(e)));
  page.on('dialog', d => d.accept());   // as confirmações ("Juntar…?", "Marcar…?", "Excluir…?")
  await page.goto(site.base + '/painel/#pacientes');
  await page.locator('#app').waitFor({ state: 'visible' });
  return { ctx, page };
}
const nomes = page => page.locator('#pacLista .linha .t1').allTextContents();
const ultima = acao => chamadas.filter(c => c.acao === acao).pop();

// 1. Lista e busca
reiniciar();
let { ctx, page } = await abrir();
await page.locator('#pacLista .linha').first().waitFor();
ok((await nomes(page)).length === 3 && /3 pacientes/.test(await page.locator('#pacTotal').textContent()), 'a lista mostra os 3 pacientes e o total');
ok(await page.locator('#pacLista .etq', { hasText: 'Sem conversa' }).count() === 1 && await page.locator('#pacLista .etq', { hasText: 'Importado' }).count() === 1, 'a lista marca quem não conversou e quem veio da planilha');
const antes = chamadas.filter(c => c.acao === 'paciente_listar').length;
await page.fill('#pacBusca', 'b');
await page.waitForTimeout(600);   // a busca espera 350 ms parada; com uma letra só, não pede nada
ok(chamadas.filter(c => c.acao === 'paciente_listar').length === antes, 'busca com uma letra só: não pede nada (espera a segunda)');
await page.fill('#pacBusca', 'Bruno');
await page.waitForFunction(() => document.querySelectorAll('#pacLista .linha').length === 1);
ok(ultima('paciente_listar').dados.busca === 'Bruno' && (await nomes(page)).join() === 'Bruno Teste' && ultima('paciente_listar').sessao === SESSAO, 'busca "Bruno": pede ao servidor com a sessão e mostra só ele');
await page.fill('#pacBusca', '');

// 2. Ficha e juntar duplicados
await page.evaluate(() => { location.hash = 'pacientes/ficha/PAC-0001'; });
await page.locator('#pacFicha h2.titulo', { hasText: 'Ana Silva Teste' }).waitFor();
ok(/\(41\) 99999-0001/.test(await page.locator('#pacFicha').textContent()), 'ficha: nome, telefone formatado e os dados do cadastro');
ok(await page.locator('#pacDupFicha').count() === 1, 'ficha: mostra o possível duplicado (mesmo nome)');
await page.locator('#pacDupFicha .linha', { hasText: 'Ana Silva Teste' }).click();
await page.locator('#pacJuntar .pc-escolha').first().waitFor();
ok(await page.locator('#pacJuntar .pc-escolha').count() === 2 && await page.locator('#pacJuntar .aviso.atencao').isHidden(), 'juntar: escolhe quem fica; com o mesmo telefone, sem o aviso de telefone diferente');
await page.click('#pacJuntarOk'); await page.click('#confOk');
await page.getByText('Cadastros juntados.').waitFor();
ok(ultima('paciente_juntar') && ultima('paciente_juntar').dados.fica === 'PAC-0001' && ultima('paciente_juntar').dados.sai === 'PAC-0002', 'juntar: confirmado, fica o PAC-0001 e sai o PAC-0002');

// 3. Não contatar e voltar a enviar
await page.locator('#pacFicha button', { hasText: 'Não quer receber avisos' }).click(); await page.click('#confOk');
await page.getByText('Marcado: não recebe mais avisos').waitFor();
ok(ultima('paciente_nao_contatar').dados.marcar === true, '"Não quer receber avisos": marcado depois da confirmação');
ok(await page.locator('#pacFicha .aviso.perigo', { hasText: 'Pediu para não receber avisos' }).count() === 1, 'a ficha mostra que o paciente não quer avisos');
await page.locator('#pacFicha button', { hasText: 'Voltar a enviar avisos' }).click();
const voltar = page.locator('#confOk');
await page.fill('#confFrase', 'quero voltar');
ok(await voltar.isDisabled(), 'voltar a enviar: com a frase errada, o botão fica desligado');
await page.fill('#confFrase', FRASE);
await voltar.click();
await page.getByText('Pronto: volta a receber os avisos').waitFor();
ok(ultima('paciente_nao_contatar').dados.marcar === false && ultima('paciente_nao_contatar').dados.frase === FRASE, 'voltar a enviar: só com a frase exata');

// 4. Excluir
await page.evaluate(() => { location.hash = 'pacientes/ficha/PAC-0003'; });
await page.locator('#pacFicha h2.titulo', { hasText: 'Bruno Teste' }).waitFor();
await page.locator('#pacFicha button', { hasText: 'Excluir' }).click();
await page.fill('#confFrase', 'Bruno Teste'); await page.click('#confOk');
await page.getByText('Cancele na Agenda antes de excluir').waitFor();
ok(!!achar('PAC-0003'), 'excluir com consulta futura: recusado, com o aviso para cancelar na Agenda');
await page.evaluate(() => { location.hash = 'pacientes/ficha/PAC-0001'; });
await page.locator('#pacFicha h2.titulo', { hasText: 'Ana Silva Teste' }).waitFor();
await page.locator('#pacFicha button', { hasText: 'Excluir' }).click();
await page.fill('#confFrase', 'Ana Silva Teste'); await page.click('#confOk');
await page.waitForFunction(() => location.hash === '#pacientes');
await page.waitForFunction(() => document.querySelectorAll('#pacLista .linha').length === 1);
ok(ultima('paciente_excluir').dados.confirmar === true && (await nomes(page)).join() === 'Bruno Teste', 'excluir: confirmado, o paciente sai da lista');

// 5. Possíveis duplicados (tela)
reiniciar();
await page.evaluate(() => { location.hash = 'pacientes/duplicados'; });
await page.locator('#pacDup .pc-painel').first().waitFor();
ok(await page.locator('#pacDup .pc-painel').count() === 1 && await page.locator('#pacDup button', { hasText: 'Juntar estes dois' }).count() === 1, 'duplicados: um grupo, com "Juntar estes dois"');
await ctx.close();

// 6. Como equipe
estado.papel = 'equipe'; reiniciar();
({ ctx, page } = await abrir());
await page.locator('#pacLista .linha').first().waitFor();
await page.evaluate(() => { location.hash = 'pacientes/ficha/PAC-0003'; });
await page.locator('#pacFicha h2.titulo', { hasText: 'Bruno Teste' }).waitFor();
ok((await nomes(page)).length === 3 && ultima('paciente_ver').sessao === SESSAO, 'equipe: a lista e a ficha abrem, com a sessão');
await ctx.close();

// 7. Sem o recurso no plano
estado.papel = 'dono'; estado.recurso = false;
const pedidos = chamadas.filter(c => c.acao === 'paciente_listar').length;
({ ctx, page } = await abrir());
await page.locator('#pacUpsell').waitFor({ state: 'visible' });
ok(await page.locator('#pacConteudo').isHidden() && chamadas.filter(c => c.acao === 'paciente_listar').length === pedidos, 'sem o recurso: aparece o convite e a lista não é pedida');
await ctx.close();

ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: Pacientes pela tela (lista, busca, ficha, juntar, avisos, exclusão, duplicados, equipe e plano).');
process.exit(falhas ? 1 : 0);
