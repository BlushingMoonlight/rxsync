// Painel (painel/, DEC-156): testa pela tela a importação da agenda (DEC-093), já com a entrada nova (DEC-097), com o n8n
// SIMULADO aqui (nada sai para a internet):
//   1. o arquivo CSV é lido no aparelho e as colunas são reconhecidas;
//   2. a prévia e a gravação vão em lotes ao 24 (agenda_importar), com a sessão no cabeçalho e só as colunas da lista
//      fechada (a observação e o CPF do arquivo nunca saem do aparelho);
//   3. a lista de importações aparece com o "Desfazer".
// Uso (precisa do Playwright): node scripts/painel_importar_agenda.mjs
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'a'.repeat(64);
const CSV = 'Data;Hora;Paciente;Telefone;Serviço;Observação;CPF\n20/11/2026;09:00;Ana Souza;(41) 99999-1111;Limpeza;alergia a dipirona;111.222.333-44\n'
  + '21/11/2026;10:30;Bruno Lima;41988882222;Avaliação;;\n32/11/2026;10:00;Data Errada;41977773333;Avaliação;;\n';
const chamadas = [];
const LISTA = [{ id: 7, criado_em: new Date().toISOString(), novos: 2, existentes: 0, completados: 0, erros: 1, pode_desfazer: true, desfeita_em: null, sistema: 'outro', novas: 2 }];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Painel A', fuso_horario: 'America/Sao_Paulo' }, somenteLeitura: { plano: 'Essencial' },
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'].map(k => [k, false])), limite_catalogo: 500 };
  if (caminho === 'autoedicao' && b.acao === 'agenda_importar') {
    const n = (b.dados.linhas || []).length;
    return { ok: true, data: { ok: true, novas: n, existentes: 0, repetidas: 0, conflitos: 0, erros: 0, canceladas: 0, futuras: n, pacientes_lembrete: n, lista_erros: [], lembretes_clinica: true, importacao_id: b.dados.gravar ? 7 : null } };
  }
  if (caminho === 'autoedicao' && b.acao === 'agenda_importacoes') return { ok: true, data: chamadas.some(c => c.acao === 'agenda_importar' && c.dados.gravar) ? LISTA : [] };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false };
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const page = await ctx.newPage(); page.setDefaultTimeout(8000);
const erros = []; page.on('pageerror', e => erros.push(String(e)));
await page.goto(site.base + '/painel/#agenda/horarios/integracao/importar');
await page.locator('#aiTela input[type=file]').waitFor({ state: 'attached' });
await page.setInputFiles('#aiTela input[type=file]', { name: 'agenda.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV, 'utf8') });
await page.getByRole('button', { name: 'Ver a prévia' }).waitFor();
ok(await page.locator('#aiCol_data').inputValue() === '0' && await page.locator('#aiCol_nome').inputValue() === '2' && await page.locator('#aiCol_telefone').inputValue() === '3', 'as colunas da data, do nome e do telefone são reconhecidas');
ok(/Observação, CPF/.test(await page.locator('#aiTela').textContent()), 'a página diz quais colunas ficam só no aparelho');
await page.getByRole('button', { name: 'Ver a prévia' }).click();
await page.getByRole('button', { name: /Importar 2 consulta/ }).waitFor();
const previa = chamadas.find(c => c.acao === 'agenda_importar');
const chaves = previa ? Object.keys(previa.dados.linhas[0]).sort().join() : '';
ok(previa && previa.dados.gravar === false && previa.dados.linhas.length === 2 && previa.sessao === SESSAO, 'prévia: 2 linhas válidas (a de data errada fica no aparelho), com a sessão');
ok(chaves === 'cancelada,codigo,duracao_min,fim,inicio,linha,medico_id,nome,paga,servico,telefone,tipo_id' && !JSON.stringify(previa.dados).includes('dipirona') && !JSON.stringify(previa.dados).includes('111.222'),
  'só as colunas da lista fechada vão ao servidor (sem observação nem CPF)');
await page.getByRole('button', { name: /Importar 2 consulta/ }).click();
await page.click('#confOk');
await page.getByText(/consultas? importadas?/).waitFor();
ok(chamadas.some(c => c.acao === 'agenda_importar' && c.dados.gravar === true && c.sessao === SESSAO), 'gravação com a sessão');
await page.evaluate(() => { location.hash = 'agenda/horarios/integracao/importacoes'; });
await page.locator('#aiLista').getByRole('button', { name: 'Desfazer' }).waitFor();
ok(true, 'a importação aparece na lista com o "Desfazer"');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: importar a agenda pela tela, com a sessão e só as colunas da lista fechada.');
process.exit(falhas ? 1 : 0);
