// Central RXSync: testa TODAS as ações pela tela, com o servidor SIMULADO (scripts/central_simulado.mjs).
// Para cada ação: abre o botão como o Jean faria, preenche, confirma e confere o que chegou ao "servidor":
//   - o nível (DEC-066): 1 = sem confirmação; 2 = confirmacao 'CONFIRMAR'; 3 = 'CONFIRMAR' + confirmacao_nome, com o
//     botão travado até o nome da clínica estar certo;
//   - os campos mandados (e que nada além do esperado foi junto).
// Confere também: interruptor de Ajustes num toque, com Desfazer; dados protegidos fora do armazenamento do navegador
// e escondidos quando a Central vai para o fundo; Desfazer do registro e da mensagem rápida.
// Uso (precisa do Playwright): node scripts/central_acoes.mjs
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS, NIVEIS, ficha } from './central_simulado.mjs';
let falhas = 0, feitos = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } return c; };
const NOME = 'Clínica Sorriso Odontologia Integrada';
const hoje = new Date().toISOString().slice(0, 10), daqui = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const site = await servirSite(); const browser = await abrirNavegador();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const page = await ctx.newPage(); page.setDefaultTimeout(6000); const erros = [];
page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
const chaves = CHAVES_LIGADAS(), chamadas = [];
let fichaExtra = {};
await entrar(page, site.base, chaves, chamadas, { cliente: () => ({ ok: true, cliente: { ...ficha(), ...fichaExtra } }) });

const janela = '#camada .janela';
const botao = (nome, onde = '#conteudo') => page.locator(onde).getByRole('button', { name: nome, exact: true }).first();
async function abrir(rota, extra) {
  fichaExtra = extra || {};
  await page.evaluate(() => { while (document.querySelector('#camada .janela')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  await page.evaluate(r => { location.hash = r + '?' + Math.random(); location.hash = r; }, rota);
  await page.waitForFunction(() => !document.querySelector('#conteudo .esq') && document.querySelector('#conteudo h1'));
  await page.waitForTimeout(120);
}
const menu = async item => { await botao('Ações').click(); await page.locator('#camada .menu-acoes button', { hasText: item }).first().click(); };
// Espera a chamada da ação e devolve os dados.
async function chamada(acao, desde) {
  for (let i = 0; i < 60; i++) { const c = chamadas.slice(desde).find(x => x.acao === acao); if (c) return c.dados; await page.waitForTimeout(50); }
  return null;
}
// Um caso: abre, preenche a janela (se houver), confirma e confere nível e campos.
async function caso({ acao, rota, extra, abrirCom, campos = {}, nome, espera = {}, nivel, antes }) {
  nivel = nivel || NIVEIS[acao];
  await abrir(rota, extra);
  if (antes) await antes();
  const desde = chamadas.length;
  await abrirCom();
  if (nivel > 1 || Object.keys(campos).length) {
    await page.waitForSelector(janela);
    ok((await page.locator(janela + ' .nivel').count() > 0) === (nivel > 1), `${acao}: a janela mostra o nível ${nivel}`);
    for (const [k, v] of Object.entries(campos)) {
      const i = page.locator(`${janela} #c-${k}`);
      if (await i.evaluate(e => e.tagName) === 'SELECT') await i.selectOption(v); else await i.fill(v);
    }
    const conf = page.locator(`${janela} button[type=submit]`);
    if (nivel === 3) {
      ok(await conf.isDisabled(), `${acao}: nível 3 começa com o botão travado`);
      await page.fill(`${janela} #c-nome-clinica`, 'nome errado');
      ok(await conf.isDisabled(), `${acao}: nome errado não destrava`);
      // Sem diferença de maiúsculas e acentos.
      await page.fill(`${janela} #c-nome-clinica`, nome.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
      ok(!(await conf.isDisabled()), `${acao}: o nome certo (sem acento, maiúsculo) destrava`);
    } else ok(await page.locator(`${janela} #c-nome-clinica`).count() === 0, `${acao}: nível ${nivel} não pede o nome`);
    await conf.click();
  } else ok(await page.locator(janela).count() === 0, `${acao}: nível 1 não abre janela de confirmação`);
  const d = await chamada(acao, desde);
  if (!ok(d, `${acao}: a ação não chegou ao servidor`)) return;
  feitos++;
  ok(nivel >= 2 ? d.confirmacao === 'CONFIRMAR' : d.confirmacao === undefined, `${acao}: confirmacao ${JSON.stringify(d.confirmacao)} no nível ${nivel}`);
  ok(nivel === 3 ? typeof d.confirmacao_nome === 'string' && d.confirmacao_nome.length > 0 : d.confirmacao_nome === undefined, `${acao}: confirmacao_nome ${JSON.stringify(d.confirmacao_nome)} no nível ${nivel}`);
  const resto = { ...d }; delete resto.confirmacao; delete resto.confirmacao_nome;
  ok(JSON.stringify(ordenar(resto)) === JSON.stringify(ordenar(espera)), `${acao}: campos enviados ${JSON.stringify(resto)}; esperado ${JSON.stringify(espera)}`);
  await page.waitForTimeout(150);
}
const ordenar = o => o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.keys(o).sort().map(k => [k, ordenar(o[k])])) : o;
const C = { cliente_id: 'CLI-001' }, M = 'motivo de teste';
const F = 'clientes/CLI-001';
// Formulário de grupo (details): abre, muda um campo, Salvar.
const grupo = (titulo, campo, valor) => async () => {
  const g = page.locator('#conteudo details.grupo', { has: page.locator('summary', { hasText: titulo }) }).first();
  await g.locator('summary').click(); const i = g.locator(`[id$="-${campo}"]`);
  if (await i.evaluate(e => e.tagName) === 'SELECT') await i.selectOption(valor); else await i.fill(valor);
  await g.getByRole('button', { name: 'Salvar' }).click();
};

const CASOS = [
  // Cobrança (nível 3, menos a foto)
  { acao: 'plano_trocar', rota: F + '/cobranca', abrirCom: () => botao('Trocar o plano').click(), campos: { plano: 'gestao', motivo: M }, nome: NOME, espera: { ...C, plano: 'gestao', valor: '', motivo: M, combinado: '' } },
  { acao: 'preco_especial', rota: F + '/cobranca', abrirCom: () => botao('Preço especial').click(), campos: { valor: '249,00', motivo: M, combinado: 'por WhatsApp' }, nome: NOME, espera: { ...C, valor: '249,00', motivo: M, combinado: 'por WhatsApp' } },
  { acao: 'cobranca_vencimento', rota: F + '/cobranca', abrirCom: () => botao('Mudar vencimento').click(), campos: { data: daqui(10), motivo: M }, nome: NOME, espera: { ...C, cobranca_id: 'pay_abc123', data: daqui(10), motivo: M } },
  { acao: 'pagamento_receber_dinheiro', rota: F + '/cobranca', abrirCom: () => botao('Recebi em dinheiro').click(), campos: { motivo: M }, nome: NOME, espera: { ...C, cobranca_id: 'pay_abc123', valor: '299', data: hoje, motivo: M } },
  { acao: 'asaas_foto_atualizar', rota: F + '/cobranca', abrirCom: () => botao('Atualizar a foto agora').click(), espera: C },
  { acao: 'cobranca_proxima_data', rota: F + '/cobranca', abrirCom: () => botao('Data da próxima cobrança').click(), campos: { data: daqui(20), motivo: M }, nome: NOME, espera: { ...C, data: daqui(20), motivo: M } },
  { acao: 'implantacao_isentar', rota: F + '/cobranca', abrirCom: () => botao('Isentar a implantação').click(), campos: { motivo: M, combinado: 'na reunião' }, nome: NOME, espera: { ...C, motivo: M, combinado: 'na reunião' } },
  { acao: 'teste_estender', rota: F + '/cobranca', abrirCom: () => botao('Estender o teste').click(), campos: { dias: '5', motivo: M }, nome: NOME, espera: { ...C, dias: '5', motivo: M, combinado: '' } },
  // Plano e recursos
  { acao: 'recurso_liberar', rota: F + '/recursos', abrirCom: () => botao('Liberar um recurso').click(), campos: { recurso: 'pesquisa', ate: daqui(30), motivo: M }, espera: { ...C, recurso: 'pesquisa', ate: daqui(30), motivo: M } },
  { acao: 'recurso_revogar', rota: F + '/recursos', abrirCom: () => botao('Revogar').click(), campos: { motivo: M }, espera: { ...C, id: 7, motivo: M } },
  { acao: 'cliente_editar_recursos', rota: F + '/recursos', abrirCom: grupo('Botões dos recursos', 'func_fila', 'NAO'), espera: { ...C, campos: { func_fila: 'NAO' } } },
  { acao: 'editar_limites', rota: F + '/recursos', abrirCom: grupo('Limites e franquia', 'franquia_mensagens', '8000'), espera: { ...C, campos: { franquia_mensagens: '8000' } } },
  { acao: 'editar_limites', nivel: 2, rota: F + '/recursos', abrirCom: grupo('Limites e franquia', 'limitar_franquia', 'SIM'), espera: { ...C, campos: { limitar_franquia: 'SIM' } } },
  { acao: 'franquia_aviso_registrar', rota: F + '/recursos', abrirCom: () => botao('Registrar que avisei a clínica').click(), espera: C },
  { acao: 'aviso_destino_definir', rota: F + '/recursos', antes: () => page.fill('#av-url', 'https://api.exemplo.com/avisos'), abrirCom: () => botao('Definir o endereço').click(), espera: { ...C, url: 'https://api.exemplo.com/avisos' } },
  { acao: 'aviso_destino_desligar', rota: F + '/recursos', abrirCom: () => botao('Desligar').click(), espera: C },
  // Cadastro
  { acao: 'cliente_editar_assistente', rota: F + '/cadastro', abrirCom: grupo('Assistente', 'servicos', 'Limpeza, clareamento e canal'), espera: { ...C, campos: { servicos: 'Limpeza, clareamento e canal' } } },
  { acao: 'cliente_editar_configuracoes', rota: F + '/cadastro', abrirCom: grupo('Configurações', 'fuso_horario', 'America/Manaus'), espera: { ...C, campos: { fuso_horario: 'America/Manaus' } } },
  { acao: 'reenviar_onboarding', rota: F + '/cadastro', abrirCom: () => botao('Reenviar o link de onboarding').click(), espera: C },
  { acao: 'cliente_editar_empresa', rota: F + '/cadastro', antes: async () => { await botao('Mostrar os dados protegidos').click(); await page.waitForSelector('[data-sensivel]'); },
    abrirCom: grupo('Editar os dados da empresa', 'razao_social', 'Sorriso Odontologia Ltda'), espera: { ...C, campos: { razao_social: 'Sorriso Odontologia Ltda' } } },
  // Menu "Ações" da ficha
  { acao: 'situacao_pausar', rota: F, abrirCom: () => menu('Pausar'), espera: C },
  { acao: 'situacao_retomar', rota: F, extra: { ativo: false }, abrirCom: () => menu('Retomar'), espera: C },
  { acao: 'situacao_reativar', rota: F, extra: { status: 'Suspenso' }, abrirCom: () => menu('Reativar'), espera: C },
  { acao: 'situacao_suspender', rota: F, abrirCom: () => menu('Suspender'), campos: { suspensao_motivo: 'inadimplencia', motivo: M }, nome: NOME, espera: { ...C, suspensao_motivo: 'inadimplencia', motivo: M } },
  { acao: 'cancelamento_agendar', rota: F, abrirCom: () => menu('Agendar o cancelamento'), campos: { data: daqui(15), motivo: M }, nome: NOME, espera: { ...C, data: daqui(15), motivo: M } },
  { acao: 'cancelamento_desfazer', rota: F, extra: { cancelar_em: daqui(15) }, abrirCom: () => menu('Desfazer o cancelamento'), espera: C },
  { acao: 'link_painel_reenviar', rota: F, abrirCom: () => menu('Reenviar o link do painel'), espera: C },
  { acao: 'link_conectar_reenviar', rota: F, abrirCom: () => menu('Reenviar o link de conexão'), espera: C },
  { acao: 'link_painel_novo', rota: F, abrirCom: () => menu('Gerar um link novo do painel'), nome: NOME, espera: C },
  { acao: 'cobranca_teste_definir', rota: F, abrirCom: () => menu('Usar como clínica de teste'), nome: NOME, espera: C },
  { acao: 'cobranca_teste_definir', nivel: 2, rota: F, antes: async () => { chaves.cobranca_teste_cliente = 'CLI-001'; await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(300); await abrir(F); },
    abrirCom: () => menu('Deixar de ser a clínica de teste'), espera: { cliente_id: '' } },
  // API (Enterprise)
  { acao: 'chave_api_limites', rota: 'api', abrirCom: () => botao('Limites').click(), campos: { limite_minuto: '120', limite_dia: '9000' }, espera: { id: 3, limite_minuto: '120', limite_dia: '9000' } },
  { acao: 'chave_api_revogar', rota: 'api', abrirCom: () => botao('Revogar').click(), nome: 'Derma Sul', espera: { id: 3 } },
  { acao: 'chave_api_criar', rota: 'api', abrirCom: () => botao('Criar chave').click(), campos: { cliente_id: 'CLI-004', nome: 'Painel novo' }, espera: { cliente_id: 'CLI-004', nome: 'Painel novo' } },
  // Segurança
  { acao: 'desfazer', rota: 'seguranca/registro', abrirCom: () => botao('Desfazer').click(), espera: { registro_id: 50 } },
  { acao: 'sair_todos', nivel: 2, rota: 'seguranca', abrirCom: () => botao('Sair de todos os aparelhos').click(), espera: {} }
];
for (const k of CASOS) {
  try { await caso(k); } catch (e) { ok(false, `${k.acao}: ${e.message.split('\n')[0]}`); }
  if (k.acao === 'cobranca_teste_definir' && k.nivel === 2) { chaves.cobranca_teste_cliente = ''; }
  if (k.acao === 'sair_todos') { await page.waitForSelector('#entrada:not([hidden])'); ok(await page.evaluate(() => !sessionStorage.getItem('central_sessao')), 'sair_todos: a sessão saiu do navegador'); }
}
// Toda ação com nível no servidor foi testada pela tela.
const testadas = new Set(CASOS.map(k => k.acao));
for (const a of Object.keys(NIVEIS)) ok(testadas.has(a), `${a}: ação sem teste pela tela`);

// Entra de novo para os testes que sobram.
await page.fill('input[type=email]', 'jean@exemplo.com'); await page.fill('input[type=password]', 'senha-de-teste-123'); await page.click('button[type=submit]');
await page.fill('input.codigo', '123456'); await page.click('button[type=submit]'); await page.waitForSelector('#conteudo h1');

// Ajustes: um toque desliga (sem janela, sem CONFIRMAR) e o Desfazer liga de novo.
{
  await abrir('ajustes'); const desde = chamadas.length;
  await page.getByRole('switch', { name: 'Avisos', exact: true }).click();
  const d = await chamada('ligar_chave', desde);
  ok(d && d.chave === 'tela_avisos' && d.valor === 'NAO' && d.confirmacao === undefined && Object.keys(d).length === 2, `ligar_chave: um toque manda só {chave, valor} (${JSON.stringify(d)})`);
  ok(await page.locator(janela).count() === 0, 'ligar_chave: sem janela de confirmação');
  ok(await page.locator('#lateral').getByRole('button', { name: 'Avisos' }).count() === 1, 'ligar_chave: a seção continua no menu (Avisos mostra a tela desligada)');
  const d2desde = chamadas.length; await page.locator('#rapida').getByRole('button', { name: 'Desfazer' }).click();
  const d2 = await chamada('ligar_chave', d2desde);
  ok(d2 && d2.chave === 'tela_avisos' && d2.valor === 'SIM', `ligar_chave: Desfazer liga de novo (${JSON.stringify(d2)})`);
  feitos += 2;
  // Aparência: só ela vai para o localStorage.
  await page.getByRole('radio', { name: 'Escura' }).click();
  ok(await page.evaluate(() => document.documentElement.dataset.tema === 'escuro' && localStorage.getItem('central_aparencia') === 'escuro' && localStorage.length === 1), 'aparência: escura guardada (só ela no localStorage)');
  await page.getByRole('radio', { name: 'Automática' }).click();
  ok(await page.evaluate(() => localStorage.length === 0 && !document.documentElement.dataset.tema), 'aparência: automática apaga a escolha');
}
// Mensagem rápida com Desfazer depois de uma edição de nível 1.
{
  await abrir(F + '/recursos'); await grupo('Limites e franquia', 'dono_limite_dia', '30')(); await page.waitForSelector('#rapida:not([hidden])');
  const desde = chamadas.length; await page.locator('#rapida').getByRole('button', { name: 'Desfazer' }).click();
  await page.waitForSelector(janela); await page.locator(`${janela} button[type=submit]`).click();
  const d = await chamada('desfazer', desde);
  ok(d && d.registro_id === 99 && d.confirmacao === 'CONFIRMAR', `desfazer pela mensagem rápida (${JSON.stringify(d)})`);
}
// Dados protegidos: nada no armazenamento do navegador nem no endereço; somem quando a Central vai para o fundo.
{
  await abrir(F + '/cadastro'); await botao('Mostrar os dados protegidos').click(); await page.waitForSelector('[data-sensivel]');
  ok(await page.locator('#conteudo').getByText('11222333000181').count() > 0, 'dados protegidos: aparecem na tela');
  const guardado = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + location.href + document.cookie);
  ok(!/11222333000181|11122233344|ana@exemplo/.test(guardado), 'dados protegidos: nada no localStorage, sessionStorage, cookie ou endereço');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok(await page.locator('[data-sensivel]').count() === 0 && await page.getByText('11222333000181').count() === 0, 'dados protegidos: somem quando a Central vai para o fundo');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); });
}
// Encerrar outra sessão: sem confirmação.
{
  await abrir('seguranca'); const desde = chamadas.length; await botao('Encerrar').click();
  const d = await chamada('encerrar_sessao', desde); ok(d && d.id === 2 && Object.keys(d).length === 1, `encerrar_sessao (${JSON.stringify(d)})`); feitos++;
}
// Nenhuma chamada saiu sem a origem certa: o simulado só responde ao n8n da Central (o resto é bloqueado).
ok(!erros.length, 'erro no console: ' + erros.join(' | '));
await browser.close(); site.fechar();
console.log(`${feitos} ações testadas pela tela. ` + (falhas ? falhas + ' falha(s).' : 'Tudo certo: nível e campos de cada ação, interruptores, Desfazer e dados protegidos.'));
process.exit(falhas ? 1 : 0);
