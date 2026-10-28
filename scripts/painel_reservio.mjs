// Painel (painel/, DEC-156): testa pela tela a integração com o Reservio do jeito novo (rxsync-sistema DEC-173, #220),
// com o n8n SIMULADO aqui (nada sai para a internet):
//   1. tela da integração: a clínica marca os serviços que a assistente oferece, com o "quando usar" e o convênio
//      (configurar manda a lista; some a escolha de "um serviço só"); a lista "Para fazer no Reservio" mostra quem fez a
//      mudança e "Já fiz" manda pendencia_resolver só com o número; token recusado: o aviso e "Conectar de novo" (R-08);
//   2. clínica de teste: "Conectar" só vai com a confirmação de que a conta é só de teste (R-12);
//   3. Nova consulta: o serviço do Reservio e os horários livres dele (com o profissional); o horário escolhido vai com o
//      serviço, o profissional e o encaixe (quem confere é o Reservio); a recusa do Reservio aparece com os horários livres;
//      o aviso "Lançada também no Reservio" aparece;
//   4. consulta que veio do Reservio: Remarcar e Cancelar aparecem (R-04, R-05) e o aviso "Cancele também no Reservio"
//      aparece depois de cancelar.
// Uso (precisa do Playwright): node scripts/painel_reservio.mjs   (NAVEGADOR=webkit roda no motor do Safari)
import { abrirNavegador, servirSite } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
const SESSAO = 'b'.repeat(64);
const chamadas = []; const E = { token_recusado: false, interna: false, recusar: false };
const dia = (n, h, m = 0) => { const d = new Date(Date.now() + n * 86400000); d.setHours(h, m, 0, 0); return d.toISOString(); };
const local = iso => { const d = new Date(iso), p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00-03:00`; };
const SERVICOS = [{ id: 's30', nome: 'Consulta online', duracao_min: 30 }, { id: 's40', nome: 'Primeira consulta presencial', duracao_min: 40 }, { id: 's55', nome: 'Consulta CarePlus', duracao_min: 55 }];
const status = () => ({ ok: true, conectado: !E.interna, plataforma: 'reservio', plataforma_nome: 'Reservio', plataformas: { reservio: 'Reservio' }, business_nome: 'Consultório Teste',
  servicos: SERVICOS, recursos: [{ id: 'r1', nome: 'Dra. Ana Lima' }, { id: 'r2', nome: 'Dr. Bruno Melo' }], recurso_id: '',
  servicos_ia: [{ id: 's30', quando_usar: 'consulta online, particular', convenio: false }], importar_horarios: false, status: E.token_recusado ? 'token_recusado' : 'ok',
  token_recusado: E.token_recusado, pedir_confirmacao_teste: E.interna, ultima_sync: new Date().toISOString(),
  pendencias: [{ id: 77, tipo: 'cancelar', nome: 'Carla Souza', inicio: dia(2, 9), quem: 'equipe', profissional: 'Dra. Ana Lima' }] });
const CONSULTAS = () => [
  { id: 31, nome_paciente: 'Rita Reservio', telefone_paciente: '41966664444', servico: 'Consulta online', inicio: dia(3, 9), fim: dia(3, 9, 30), status: 'confirmado', criado_por: 'manual', visto: true,
    origem_externa: 'reservio', externo_plataforma: 'reservio', externo_servico_id: 's30' }];
function responder(url, h, b) {
  const caminho = url.slice(N8N.length);
  chamadas.push({ caminho, acao: b.acao, sessao: h['x-rxsync-painel'] || '', dados: b.dados || {} });
  if (caminho === 'autoedicao' && b.acao === 'abrir') return { ok: true, editaveis: { nome_exibicao: 'Clínica Reservio', fuso_horario: 'America/Sao_Paulo', func_reservio: 'SIM' }, papel: 'equipe',
    recursos: Object.fromEntries(['documentos', 'fila', 'pesquisa', 'medicos', 'pacientes'].map(k => [k, k !== 'medicos'])) };
  if (caminho === 'autoedicao' && b.acao === 'agenda_listar') return { ok: true, data: CONSULTAS() };
  if (caminho === 'autoedicao' && b.acao === 'agenda_criar') return { ok: true, data: E.recusar
    ? { ok: false, erro: 'reservio', mensagem: 'O Reservio não tem Primeira consulta presencial livre nesse horário. A consulta não foi criada.', horarios_livres: [{ inicio: local(dia(1, 15)), fim: local(dia(1, 15, 40)), recurso_id: 'r1', profissional: 'Dra. Ana Lima' }] }
    : { ok: true, id: 99, aviso_reservio: 'Lançada também no Reservio: Primeira consulta presencial, com Dr. Bruno Melo.' } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_cancelar') return { ok: true, data: { ok: true, aviso_reservio: 'Cancele também no Reservio: Rita Reservio. A integração não consegue cancelar lá.' } };
  if (caminho === 'autoedicao' && b.acao === 'agenda_medicos_listar') return { ok: true, data: { medicos: [] } };
  if (caminho === 'integracao-agenda') {
    if (b.acao === 'horarios') return Object.assign(status(), { horarios_livres: [{ inicio: local(dia(1, 9, 10)), fim: local(dia(1, 9, 50)), recurso_id: 'r2', profissional: 'Dr. Bruno Melo' }] });
    if (b.acao === 'pendencia_resolver') return Object.assign(status(), { pendencias: [], mensagem: 'Pronto. Saiu da lista.' });
    if (b.acao === 'configurar') return Object.assign(status(), { servicos_ia: (b.dados || {}).servicos_ia || [], mensagem: 'Salvo.' });
    if (b.acao === 'conectar') return Object.assign(status(), { ok: false, mensagem: 'Conectei (teste).' });
    return status();
  }
  return { ok: true, data: [] };
}

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 820, height: 1000 }, hasTouch: true });
await ctx.addInitScript(s => { try { sessionStorage.setItem('painel_sessao', s); } catch (e) {} }, SESSAO);
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
  const q = r.request();
  if (!q.url().startsWith(N8N)) return r.abort();
  if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
  let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch {}
  return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url(), q.headers(), b)) });
});
const erros = [];
const page = await ctx.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => erros.push(String(e)));
const ultima = acao => chamadas.filter(c => c.acao === acao).pop();

// 1. tela da integração, só tocando: Agenda › Horários › Integração e planilhas › Reservio (R-13)
await page.goto(site.base + '/painel/#agenda');
await page.locator('.cab-tela').getByRole('button', { name: 'Horários' }).click();
await page.getByText('Integração e planilhas').first().click();
await page.locator('#intIndice').getByText('1 para fazer no Reservio').waitFor();
ok(true, 'a tela da integração abre só tocando, a partir da Agenda, e o índice mostra o que há para fazer no Reservio');
await page.locator('#intIndice').getByText('Reservio', { exact: true }).click();
await page.getByText('Serviços que a assistente oferece').waitFor();
ok(await page.getByText('Serviço usado quando a assistente marca').count() === 0, 'some a escolha de "um serviço só"');
const servico = nome => page.locator('#intBox .cartao', { hasText: nome }).first();
ok(await servico('Consulta online').locator('input[type=checkbox]').first().isChecked(), 'o serviço já marcado aparece marcado, com o "quando usar"');
await servico('Consulta CarePlus').locator('input[type=checkbox]').first().check();
await servico('Consulta CarePlus').locator('input[type=text]').fill('pacientes CarePlus');
await servico('Consulta CarePlus').locator('input[type=checkbox]').nth(1).check();
await page.getByRole('button', { name: 'Salvar' }).click();
await page.getByText('Salvo.').first().waitFor();
const cfg = ultima('configurar');
ok(cfg && JSON.stringify(cfg.dados.servicos_ia) === JSON.stringify([{ id: 's30', quando_usar: 'consulta online, particular', convenio: false }, { id: 's55', quando_usar: 'pacientes CarePlus', convenio: true }]),
  'configurar manda os serviços marcados, com o "quando usar" e o convênio');
ok(await page.getByText('Cancele: Carla Souza').count() === 1 && await page.getByText('feito por a equipe').count() === 1, 'a lista "Para fazer no Reservio" mostra a pendência e quem fez a mudança');
await page.getByRole('button', { name: 'Já fiz' }).click();
await page.getByText('Pronto. Saiu da lista.').waitFor();
const pr = ultima('pendencia_resolver');
ok(pr && pr.dados.id === '77' && Object.keys(pr.dados).join() === 'id', '"Já fiz" manda pendencia_resolver só com o número');
E.token_recusado = true;
await page.getByRole('button', { name: 'Sincronizar agora' }).click();
await page.getByText('O Reservio recusou o token. A integração parou').waitFor();
await page.getByRole('button', { name: 'Conectar de novo' }).click();
ok(await page.locator('#intToken').isVisible(), 'token recusado: o aviso aparece e "Conectar de novo" abre o formulário do token (R-08)');
E.token_recusado = false;

// 2. clínica de teste: a confirmação de que a conta é só de teste (R-12)
E.interna = true;
await page.evaluate(() => { location.hash = '#agenda'; }); await page.waitForTimeout(200);
await page.evaluate(() => { location.hash = '#agenda/horarios/integracao/reservio'; });
await page.locator('#intTeste').waitFor();
await page.fill('#intToken', 'token-de-teste-123');
const antes = chamadas.filter(c => c.acao === 'conectar').length;
await page.getByRole('button', { name: 'Conectar' }).click();
ok(chamadas.filter(c => c.acao === 'conectar').length === antes, 'sem a confirmação, "Conectar" não manda nada');
await page.check('#intTeste'); await page.getByRole('button', { name: 'Conectar' }).click();
await page.getByText('Conectei (teste).').waitFor();
ok(ultima('conectar').dados.teste_confirmado === true, 'com a confirmação, conectar vai com teste_confirmado');
E.interna = false;
await page.evaluate(() => { location.hash = '#agenda'; }); await page.waitForTimeout(200);
await page.evaluate(() => { location.hash = '#agenda/horarios/integracao/reservio'; });
await page.getByText('Serviços que a assistente oferece').waitFor();   // o estado da integração volta a "conectado"

// 3. Nova consulta com o Reservio
await page.evaluate(() => { location.hash = '#agenda'; });
await page.locator('#agLista, #calViews').first().waitFor();
await page.locator('.cab-tela').getByRole('button', { name: 'Nova consulta' }).first().click();
await page.locator('#agfRsv').waitFor();
await page.fill('#agfNome', 'Joana Pereira'); await page.fill('#agfTel', '41977776666');
await page.selectOption('#agfRsv', 's40');
await page.fill('#agfData', local(dia(1, 9)).slice(0, 10));
await page.getByRole('button', { name: 'Ver horários livres no Reservio' }).click();
await page.locator('#agfRsvLista').getByRole('button', { name: /09:10 · Dr\. Bruno Melo/ }).click();
ok(await page.inputValue('#agfHora') === '09:10' && await page.inputValue('#agfDur') === '40', 'o horário livre do Reservio preenche o horário e a duração do serviço (40 min)');
await page.click('#agfSalvar');
await page.locator('#toast', { hasText: 'Lançada também no Reservio' }).waitFor();
const cr = ultima('agenda_criar');
ok(cr && cr.dados.reservio_servico_id === 's40' && cr.dados.reservio_recurso_id === 'r2' && cr.dados.forcar === true, 'salvar manda o serviço e o profissional do Reservio (quem confere é o Reservio)');
E.recusar = true;
await page.locator('#toast', { hasText: 'Lançada' }).waitFor({ state: 'hidden', timeout: 15000 });
await page.locator('.cab-tela').getByRole('button', { name: 'Nova consulta' }).first().click();
await page.locator('#agfRsv').waitFor();
await page.fill('#agfNome', 'Joana Pereira'); await page.fill('#agfTel', '41977776666'); await page.selectOption('#agfRsv', 's40');
await page.click('#agfSalvar');
await page.getByText('O Reservio não tem Primeira consulta presencial livre').waitFor();
ok(await page.locator('#agfRsvLista').getByRole('button', { name: /15:00 · Dra\. Ana Lima/ }).count() === 1, 'a recusa do Reservio aparece com os horários livres dele');
await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Descartar' }).click(); E.recusar = false;

// 4. consulta que veio do Reservio
await page.locator('#calViews').getByRole('button', { name: 'Lista' }).click().catch(() => {});
await page.locator('#agLista .linha', { hasText: 'Rita Reservio' }).first().locator('.linha-abrir').click();
ok(await page.getByRole('button', { name: 'Remarcar' }).count() === 1 && await page.getByRole('button', { name: 'Cancelar consulta' }).count() === 1, 'a consulta do Reservio tem Remarcar e Cancelar (R-04, R-05)');
await page.getByRole('button', { name: 'Cancelar consulta' }).click(); await page.click('#confOk');
await page.locator('#toast', { hasText: 'Cancele também no Reservio' }).waitFor();
ok(true, 'depois de cancelar, aparece "Cancele também no Reservio"');

ok(!erros.length, 'nenhum erro de JavaScript na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo.');
process.exit(falhas ? 1 : 0);
