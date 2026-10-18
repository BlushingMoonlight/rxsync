// Central RXSync: testa TODAS as ações pela tela, com o servidor SIMULADO (scripts/central_simulado.mjs).
// Para cada ação: abre o botão como o Jean faria, preenche, confirma e confere o que chegou ao "servidor":
//   - o nível (DEC-066): 1 = sem confirmação; 2 = confirmacao 'CONFIRMAR'; 3 = 'CONFIRMAR' + confirmacao_nome, com o
//     botão travado até o nome da clínica estar certo;
//   - os campos mandados (e que nada além do esperado foi junto).
// Confere também: interruptor de Ajustes num toque, com Desfazer; dados protegidos fora do armazenamento do navegador
// e escondidos quando a Central vai para o fundo; Desfazer do registro e da mensagem rápida.
// Uso (precisa do Playwright): node scripts/central_acoes.mjs
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS, NIVEIS, ficha, CFG, ESTADO } from './central_simulado.mjs';
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
const P = 'prospeccao', ABORD = 'Olá! Sou a assistente virtual da {marca}. Vi a {nome} no Google Maps: posso te contar como respondemos pacientes à noite?';
const chave = nome => page.locator('#conteudo').getByRole('switch', { name: nome, exact: true }).first();
const F = 'clientes/CLI-001';
// Abre um grupo (details) do editor da camada pelo título.
const abrirGrupo = titulo => page.locator('#conteudo details.grupo summary', { hasText: titulo }).first().click();
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
  // Prospecção (sql/031 e sql/032): camadas, números, leads, relatórios, buscas, regras e custos
  { acao: 'prosp_campanha_salvar', nivel: 2, rota: P + '/campanha/CMP-0001', antes: () => page.fill('#p-marca', 'RXSync Saúde'), abrirCom: () => botao('Salvar a versão nova').click(),
    espera: { id: 'CMP-0001', nome: 'Odonto Sul', config: { ...CFG.campanha, marca: 'RXSync Saúde' } } },
  { acao: 'prosp_conjunto_salvar', nivel: 3, rota: P + '/conjunto/CJ-0001', antes: () => page.selectOption('#p-numero', '2'), abrirCom: () => botao('Salvar a versão nova').click(), nome: 'Dentistas Curitiba',
    espera: { id: 'CJ-0001', nome: 'Dentistas Curitiba', config: CFG.conjunto, numero_id: '2' } },
  { acao: 'prosp_anuncio_salvar', rota: P + '/anuncio/novo/CJ-0001', antes: async () => { await page.fill('#p-nome', 'D · Teste'); await page.fill('#p-abordagem', ABORD); }, abrirCom: () => botao('Criar').click(),
    espera: { id: '', nome: 'D · Teste', config: { ...CFG.anuncio, abordagem: ABORD }, conjunto_id: 'CJ-0001' } },
  { acao: 'prosp_duplicar', rota: P + '/campanha/CMP-0001', abrirCom: () => botao('Duplicar').click(), espera: { tipo: 'campanha', id: 'CMP-0001' } },
  { acao: 'prosp_apagar_rascunho', rota: P + '/campanha/CMP-0002', abrirCom: () => botao('Apagar o rascunho').click(), espera: { tipo: 'campanha', id: 'CMP-0002' } },
  { acao: 'prosp_encerrar', rota: P + '/campanha/CMP-0001', abrirCom: () => botao('Encerrar').click(), nome: 'Odonto Sul', espera: { tipo: 'campanha', id: 'CMP-0001' } },
  { acao: 'prosp_ligar', nivel: 1, rota: P, abrirCom: () => chave('Pausar Odonto Sul').click(), espera: { tipo: 'campanha', id: 'CMP-0001', valor: 'NAO' } },
  { acao: 'prosp_ligar', nivel: 3, rota: P, abrirCom: () => chave('Ligar Dermatologia (rascunho)').click(), nome: 'Dermatologia (rascunho)', espera: { tipo: 'campanha', id: 'CMP-0002', valor: 'SIM' } },
  { acao: 'prosp_ligar', nivel: 2, rota: P, abrirCom: () => chave('Ligar Ortodontistas Joinville').click(), espera: { tipo: 'conjunto', id: 'CJ-0002', valor: 'SIM' } },
  { acao: 'prosp_ligar', nivel: 1, rota: P + '/numeros', abrirCom: () => chave('Pausar prospec-01').click(), espera: { tipo: 'numero', id: 1, valor: 'NAO' } },
  { acao: 'prosp_numero_criar', rota: P + '/numeros', abrirCom: () => botao('Novo número').click(), campos: { nome: 'Prospecção 3' }, espera: { nome: 'Prospecção 3' } },
  { acao: 'prosp_numero_qr', rota: P + '/numeros', abrirCom: () => botao('Mostrar o código').click(), espera: { id: 2 } },
  { acao: 'prosp_numero_situacao', rota: P + '/numeros', abrirCom: () => botao('Situação agora').click(), espera: { id: 1 } },
  { acao: 'prosp_numero_teto', rota: P + '/numeros', abrirCom: () => botao('Teto').click(), campos: { teto: '30' }, espera: { id: 1, teto: '30' } },
  { acao: 'prosp_numero_desconectar', rota: P + '/numeros', abrirCom: () => botao('Desconectar').click(), espera: { id: 1 } },
  { acao: 'prosp_numero_webhook', rota: P + '/numeros', abrirCom: () => botao('Webhook de novo').click(), espera: { id: 1 } },
  { acao: 'prosp_numero_apagar', rota: P + '/numeros', abrirCom: () => botao('Apagar').click(), nome: 'prospec-01', espera: { id: 1 } },
  { acao: 'prosp_exportar', rota: P + '/leads', abrirCom: () => botao('Exportar CSV').click(), espera: { conjunto_id: '', situacao: '' } },
  { acao: 'prosp_leads_aprovar_todos', rota: P + '/leads', antes: async () => { await page.selectOption('#conteudo select[aria-label="Conjunto"]', 'CJ-0001'); await page.waitForFunction(() => !document.querySelector('#conteudo .esq')); await page.waitForTimeout(200); },
    abrirCom: () => botao('Aprovar os 6 "para aprovar" deste conjunto').click(), espera: { conjunto_id: 'CJ-0001' } },
  { acao: 'prosp_lead_aprovar', rota: P + '/lead/PX-CCCCC', abrirCom: () => botao('Aprovar').click(), espera: { id: 'PX-CCCCC', valor: 'SIM' } },
  { acao: 'prosp_lead_assumir', rota: P + '/lead/PX-AAAAA', abrirCom: () => botao('Assumir a conversa').click(), espera: { id: 'PX-AAAAA' } },
  { acao: 'prosp_lead_devolver', rota: P + '/lead/PX-DDDDD', abrirCom: () => botao('Devolver à IA').click(), espera: { id: 'PX-DDDDD' } },
  { acao: 'prosp_lead_marcar', rota: P + '/lead/PX-AAAAA', abrirCom: () => botao('Marcar').click(), campos: { situacao: 'recusou' }, espera: { id: 'PX-AAAAA', situacao: 'recusou' } },
  { acao: 'prosp_lead_nao_contatar', rota: P + '/lead/PX-AAAAA', abrirCom: () => botao('Não contatar').click(), espera: { id: 'PX-AAAAA' } },
  { acao: 'prosp_anotar', rota: P + '/relatorios', abrirCom: () => botao('Anotar').click(), campos: { texto: 'Liguei o anúncio C' }, espera: { campanha_id: '', dia: hoje, texto: 'Liguei o anúncio C' } },
  { acao: 'prosp_relatorio_salvar', rota: P + '/relatorios', abrirCom: () => botao('Guardar como padrão').click(), espera: { nome: 'Padrão', config: { visao: 'desempenho' } } },
  { acao: 'prosp_buscar_agora', rota: P + '/buscas', abrirCom: () => botao('Buscar agora').click(), campos: { publico_id: 'PB-0002' }, espera: { publico_id: 'PB-0002' } },
  // Públicos (sql/036, DEC-088): o conjunto escolhe; o público guarda a busca e os contatos
  { acao: 'prosp_conjunto_salvar', nivel: 3, rota: P + '/conjunto/CJ-0001', antes: () => page.locator('#conteudo .p-pub[data-id="PB-0002"]').click(), abrirCom: () => botao('Salvar a versão nova').click(), nome: 'Dentistas Curitiba',
    espera: { id: 'CJ-0001', nome: 'Dentistas Curitiba', config: { ...CFG.conjunto, publicos: ['PB-0001', 'PB-0002'] }, numero_id: '1' } },
  { acao: 'prosp_conjunto_salvar', nivel: 1, rota: P + '/conjunto/novo/CMP-0002', antes: async () => { await page.fill('#p-nome', 'Joinville novo'); await page.locator('#conteudo .p-pub[data-id="PB-0002"]').click(); },
    abrirCom: () => botao('Criar').click(), espera: { id: '', nome: 'Joinville novo', config: { ...CFG.conjunto, publicos: ['PB-0001', 'PB-0002'] }, numero_id: '', campanha_id: 'CMP-0002' } },
  { acao: 'prosp_publico_salvar', nivel: 2, rota: P + '/publico/PB-0001/configuracao', antes: async () => { await abrirGrupo('Fuso, créditos e contatos novos'); await page.fill('#p-creditos_mes', '150'); }, abrirCom: () => botao('Salvar a versão nova').click(),
    espera: { id: 'PB-0001', nome: 'Dentistas Curitiba', config: { ...CFG.publico, creditos_mes: 150 } } },
  { acao: 'prosp_publico_salvar', rota: P + '/publico/novo', antes: async () => { await page.fill('#p-nome', 'Dentistas Londrina'); await page.fill('#p-busca-lugares', 'Londrina'); }, abrirCom: () => botao('Criar').click(),
    espera: { id: '', nome: 'Dentistas Londrina', config: { ...CFG.publico, busca: { ...CFG.publico.busca, lugares: ['Londrina'] } } } },
  { acao: 'prosp_publico_renomear', rota: P + '/publico/PB-0002/configuracao', antes: () => page.fill('#p-nome', 'Ortodontia Joinville e região'), abrirCom: () => botao('Salvar a versão nova').click(),
    espera: { id: 'PB-0002', nome: 'Ortodontia Joinville e região' } },
  { acao: 'prosp_publico_duplicar', rota: P + '/publico/PB-0001', abrirCom: () => botao('Duplicar').click(), espera: { id: 'PB-0001' } },
  { acao: 'prosp_publico_buscar', rota: P + '/publico/PB-0001', abrirCom: () => botao('Buscar de novo').click(), espera: { id: 'PB-0001' } },
  { acao: 'prosp_publico_contato_marcar', rota: P + '/publico/PB-0001', abrirCom: () => chave('Tirar Sorriso Batel').click(), espera: { id: 'PB-0001', contato_id: 9101, valor: 'NAO' } },
  { acao: 'prosp_publico_contato_marcar', nivel: 2, rota: P + '/publico/PB-0001', abrirCom: () => chave('Pôr de volta Clínica Tirada').click(), espera: { id: 'PB-0001', contato_id: 9102, valor: 'SIM' } },
  { acao: 'prosp_publico_contatos_lote', rota: P + '/publico/PB-0001', abrirCom: () => botao('Selecionar todos').click(), espera: { id: 'PB-0001', valor: 'SIM', todos: true } },
  { acao: 'prosp_publico_contatos_lote', rota: P + '/publico/PB-0001', abrirCom: () => botao('Tirar todos').click(), espera: { id: 'PB-0001', valor: 'NAO', todos: true } },
  { acao: 'prosp_publico_arquivar', rota: P + '/publico/PB-0002', abrirCom: () => botao('Arquivar').click(), espera: { id: 'PB-0002', valor: 'SIM' } },
  { acao: 'prosp_creditos_teto_salvar', rota: P + '/publicos', abrirCom: () => botao('Mudar o teto').click(), campos: { valor: '500' }, espera: { valor: '500' } },
  { acao: 'prosp_regra_salvar', rota: P + '/regras', abrirCom: () => botao('Nova regra').click(), campos: { valor: '20' },
    espera: { nivel: 'anuncio', alvo_id: '', metrica: 'recusa', operador: '>', valor: '20', depois_de: '30', janela_dias: '7', acao: 'avisar' } },
  { acao: 'prosp_regra_ligar', nivel: 2, rota: P + '/regras', abrirCom: () => chave('Desligar a regra 7').click(), espera: { id: 7, valor: 'NAO' } },
  { acao: 'prosp_custos_salvar', rota: P + '/custos', antes: () => page.fill('#cu-preco_mil_tokens_entrada', '0,02'), abrirCom: () => botao('Salvar').click(),
    espera: { itens: [{ tipo: 'preco_credito_serpapi', valor: '0.075', descricao: 'plano de 5.000 buscas' }, { tipo: 'preco_mil_tokens_entrada', valor: '0.02', descricao: '' }, { tipo: 'fixo_mensal', valor: '60', descricao: 'chip' }] } },
  // Sugerir melhorias (sql/043, DEC-098): nível 2, com a quantidade e o filtro da tela
  { acao: 'prosp_sugerir', rota: P + '/conversas', antes: async () => { await page.selectOption('#conteudo select[aria-label="Campanha"]', 'CMP-0001'); await botao('Sugerir melhorias').waitFor(); },
    abrirCom: () => botao('Sugerir melhorias').click(), campos: { quantidade: '10' },
    espera: { resultado: '', campanha_id: 'CMP-0001', conjunto_id: '', anuncio_id: '', prompt_id: '', dias: '30', pagina: 0, quantidade: '10' } },
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
// Públicos: a lista do público mostra o telefone só com os 4 últimos dígitos; o conjunto não escolhe público de outro fuso;
// Leads, Relatórios e Buscas filtram por público.
{
  await abrir(P + '/publico/PB-0001');
  const txt = await page.locator('#conteudo').innerText();
  ok(/•••• 2001/.test(txt) && !/\d{8,}/.test(txt.replace(/\s/g, '')), 'públicos: telefone só com os 4 últimos dígitos (nenhum número inteiro na tela)');
  await abrir(P + '/conjunto/CJ-0001');
  ok(await page.locator('#conteudo .p-pub[data-id="PB-0003"]').isDisabled() && !(await page.locator('#conteudo .p-pub[data-id="PB-0002"]').isDisabled()), 'conjunto: público de outro fuso (Manaus) não dá para escolher');
  ok(await page.locator('#conteudo .p-pub[data-id="PB-0004"]').count() === 0, 'conjunto: público arquivado não aparece para escolher');
  await abrirGrupo('Entrega'); await page.selectOption('#p-entrega-fuso', 'America/Manaus');
  ok(await page.locator('#conteudo .p-pub[data-id="PB-0003"]').isEnabled() && await page.locator('#conteudo .p-pub[data-id="PB-0002"]').isDisabled() && await page.locator('#conteudo .p-pub[data-id="PB-0001"]').isEnabled(),
    'conjunto: trocar o fuso da entrega troca os públicos que dá para escolher (o já escolhido fica, o servidor recusa)');
  const filtrou = async (rota, sel, valor, acao, campo) => { await abrir(rota); const desde = chamadas.length; await page.selectOption(sel, valor);
    for (let i = 0; i < 60; i++) { const c = chamadas.slice(desde).find(x => x.acao === acao); if (c) return c.dados[campo]; await page.waitForTimeout(50); } return null; };
  ok(await filtrou(P + '/leads', '#conteudo select[aria-label="Público"]', 'PB-0001', 'prosp_leads', 'publico_id') === 'PB-0001', 'leads: filtro por público');
  ok(await filtrou(P + '/buscas', '#conteudo select[aria-label="Público"]', 'PB-0002', 'prosp_buscas', 'publico_id') === 'PB-0002', 'buscas: filtro por público');
  await abrir(P + '/relatorios'); const desde = chamadas.length; await page.locator('#conteudo label', { hasText: 'Nível' }).locator('select').selectOption('publico');
  const d = await chamada('prosp_relatorio', desde);
  ok(d && d.nivel === 'publico', `relatórios: nível público (${JSON.stringify(d)})`);
  await page.waitForTimeout(200);
  ok(await page.locator('#conteudo table th[scope=row]', { hasText: 'Dentistas Curitiba' }).count() === 1 && await page.locator('#conteudo table th[scope=row]', { hasText: '(sem público)' }).count() === 1, 'relatórios: linha por público, com o nome');
  await page.locator('#conteudo label', { hasText: 'Nível' }).locator('select').selectOption('anuncio');
  feitos += 5;
}
// Prospecção: o QR só na tela. Aparece na janela; nada dele vai para o armazenamento do navegador ou o endereço; some ao
// fechar a janela e quando a Central vai para o fundo.
{
  const qrNaTela = async () => { await abrir(P + '/numeros'); await botao('Mostrar o código').click(); await page.waitForSelector(janela + ' button[type=submit]'); await page.locator(janela + ' button[type=submit]').click();
    await page.waitForSelector('#camada img.p-qr'); };
  await qrNaTela();
  ok(await page.evaluate(() => /^data:image\/png;base64,/.test(document.querySelector('#camada img.p-qr').src)), 'QR: aparece na janela');
  const guardado = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + location.href + document.cookie + history.length);
  ok(!/base64|iVBOR/.test(guardado), 'QR: nada no localStorage, sessionStorage, cookie ou endereço');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok(await page.locator('img.p-qr').count() === 0, 'QR: some ao fechar a janela');
  await qrNaTela();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(200);
  ok(await page.locator('img.p-qr').count() === 0, 'QR: some quando a Central vai para o fundo');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); });
  feitos++;
}
// Ajustes da prospecção: desligar a IA é um toque; ligar pede o nível 2; o disparo fica travado sem a Política v10 e o balanceamento.
{
  await abrir('ajustes'); let desde = chamadas.length;
  await page.getByRole('switch', { name: 'IA de resposta', exact: true }).click();
  let d = await chamada('ligar_chave', desde);
  ok(d && d.chave === 'prosp_ia' && d.valor === 'NAO' && d.confirmacao === undefined && await page.locator(janela).count() === 0, `prosp_ia: desligar num toque (${JSON.stringify(d)})`);
  await page.waitForTimeout(300); await abrir('ajustes'); desde = chamadas.length;
  await page.getByRole('switch', { name: 'IA de resposta', exact: true }).click();
  await page.waitForSelector(janela); await page.locator(janela + ' button[type=submit]').click();
  d = await chamada('ligar_chave', desde);
  ok(d && d.chave === 'prosp_ia' && d.valor === 'SIM' && d.confirmacao === 'CONFIRMAR', `prosp_ia: ligar pede o nível 2 (${JSON.stringify(d)})`);
  ok(await page.getByRole('switch', { name: 'Disparo de prospecção' }).count() === 0 && await page.locator('#conteudo').getByText('Travado até a Política v10').count() === 1, 'prosp_disparo: travado, sem interruptor');
  feitos += 2;
}
// Sinal de vida do 52 e do 53 (DEC-087): sem disparo, o cartão mostra quem rodou, sem aviso; com o disparo ligado e o 52
// parado, a tela inicial e os Ajustes dizem "Disparo parado: o workflow 52 … não roda desde …".
{
  const motor = () => page.locator('#conteudo .cartao', { has: page.getByRole('heading', { name: 'Sinal de vida' }) });
  ESTADO.segurado = false; await abrir('prospeccao');
  ok(await motor().count() === 1 && await motor().getByText('52 · Respostas e IA').count() === 1 && await motor().getByText('ainda não rodou').count() === 1, 'sinal de vida: o cartão mostra o 52 e o 53');
  ok(await page.locator('#conteudo [role=alert]', { hasText: 'Disparo parado' }).count() === 0, 'sinal de vida: sem disparo ligado, nenhum aviso de disparo parado');
  ESTADO.segurado = true; await abrir('prospeccao');
  const aviso = page.locator('#conteudo [role=alert]', { hasText: 'Disparo parado' });
  ok(await aviso.count() === 1 && /o workflow 52 \(Respostas e IA\) não roda desde \d{2}\/\d{2}/.test(await aviso.innerText()), 'sinal de vida: disparo parado na tela inicial, com o workflow e desde quando');
  ok(await page.locator('#conteudo .etq', { hasText: 'disparo parado' }).count() >= 1, 'sinal de vida: a etiqueta do disparo diz "disparo parado"');
  await abrir('ajustes');
  ok(await motor().count() === 1 && await page.locator('#conteudo [role=alert]', { hasText: 'Disparo parado: o workflow 52' }).count() === 1, 'sinal de vida: o mesmo aviso nos Ajustes, abaixo das chaves da prospecção');
  ESTADO.segurado = false;
  feitos += 3;
}
// Nenhuma chamada saiu sem a origem certa: o simulado só responde ao n8n da Central (o resto é bloqueado).
ok(!erros.length, 'erro no console: ' + erros.join(' | '));
await browser.close(); site.fechar();
console.log(`${feitos} ações testadas pela tela. ` + (falhas ? falhas + ' falha(s).' : 'Tudo certo: nível e campos de cada ação, interruptores, Desfazer e dados protegidos.'));
process.exit(falhas ? 1 : 0);
