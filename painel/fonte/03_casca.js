// ---------------------------------------------------------------- estado do painel
// VAL: os 74 campos como o servidor guardou. REC: o que vale para a clínica (recursos do "abrir", DEC-063). PAPEL: dono
// ou equipe (DEC-115). Plano, papel e permissão vêm do servidor; a tela nunca decide sozinha (quem recusa é o banco).
const VAL = {}, RO = {};
let REC = null, PAPEL = 'dono', CONTA = {}, PAUSA = null, TERMOS = null, LIMITE_CATALOGO = 500;
const TESTE = { aberto: false };
const sem = k => !!REC && REC[k] !== true;
const ehDono = () => PAPEL !== 'equipe';
const ligado = k => String(VAL[k] || '').trim().toUpperCase() === 'SIM';

// ---------------------------------------------------------------- telas e rotas (o endereço fica no #, para o voltar do celular)
// Cada tela é montada uma vez (montar) e atualizada a cada visita (entrar). Rota com parâmetro: pacientes/ficha/PAC-1.
const TELAS = {};
const tela = (rota, def) => { TELAS[rota] = { area: rota.split('/')[0], ...def }; };
const AREAS = [['hoje', 'Hoje', 'hoje'], ['agenda', 'Agenda', 'agenda'], ['pacientes', 'Pacientes', 'pacientes'], ['assistente', 'Assistente', 'assistente']];
const areasVisiveis = () => AREAS.filter(a => a[0] !== 'pacientes' || !sem('pacientes'));
function ir(rota) { if (location.hash === '#' + rota) rotear(); else location.hash = rota; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]');
  if (!b) return;
  e.preventDefault();
  if (b.closest('#painelChat')) chatFechar();
  if (b.closest('.veu')) while (JANELAS.length) JANELAS[JANELAS.length - 1]();
  ir(b.getAttribute('data-ir'));
});
function rotaAtual() {
  const partes = (location.hash || '#hoje').slice(1).split('/');
  for (let n = partes.length; n > 0; n--) { const k = partes.slice(0, n).join('/'); if (TELAS[k]) return { rota: k, param: partes.slice(n).join('/') }; }
  return { rota: 'hoje', param: '' };
}
// Molde D no iPad deitado e no computador: Conta e Assistente viram menu de assuntos à esquerda (a própria tela de
// entrada da área) e a página aberta à direita; na entrada da área, abre o primeiro assunto.
const MOLDE_D = { conta: () => ehDono() ? 'conta/assinatura' : 'conta/whatsapp', assistente: () => 'assistente/clinica' };
const LARGO = window.matchMedia('(min-width: 1024px)');
function montarTela(rota) {
  const t = TELAS[rota];
  if (!t.sec) { t.sec = el('section', { 'data-tela': rota }); if (t.montar) anexar(t.sec, t.montar(t.sec)); $('telas').append(t.sec); }
  return t;
}
function rotear() {
  if ($('app').hidden) return;
  const { rota, param } = rotaAtual(), t = TELAS[rota];
  document.body.dataset.area = t.area;
  document.querySelectorAll('[data-area]').forEach(b => { if (b.dataset.area === t.area) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const d = LARGO.matches && MOLDE_D[t.area] && TELAS[t.area] ? t.area : null;
  const rotaAberta = d && rota === d ? MOLDE_D[d]() : rota, aberta = montarTela(rotaAberta), raiz = d ? montarTela(d) : null;
  if (raiz) raiz.sec.classList.add('assuntos');
  document.body.classList.toggle('com-assuntos', !!d);
  document.querySelectorAll('#telas > section').forEach(s => { s.hidden = s !== aberta.sec && !(raiz && s === raiz.sec); });
  if (raiz) {
    if (raiz.entrar) raiz.entrar('', raiz.sec);
    raiz.sec.querySelectorAll('[data-ir]').forEach(b => { const sim = b.getAttribute('data-ir') === rotaAberta; b.classList.toggle('selecionada', sim); if (sim) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  if (aberta.entrar) aberta.entrar(rotaAberta === rota ? param : '', aberta.sec);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', rotear);
LARGO.addEventListener('change', () => rotear());
// Cabeçalho de tela: onde estou, a ação principal (fixa embaixo no celular, no alto no iPad) e o ⋯ do que é raro.
function cabTela(titulo, op) {
  op = op || {};
  return [op.voltar ? el('button', { class: 'voltar', type: 'button', 'data-ir': op.voltar[0] }, icone('voltar'), op.voltar[1]) : null,
    el('div', { class: 'cab-tela' }, el('h1', { text: titulo }), op.acao ? op.acao : null, op.mais ? maisMenu(op.mais) : null),
    op.sub ? el('p', { class: 'subtitulo', text: op.sub }) : null];
}
// ⋯ Mais: o que é raro, perto do que ele afeta, sempre com o mesmo ícone.
function maisMenu(itens) {
  return el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Mais', 'aria-haspopup': 'dialog', id: itens.id || null, onclick: () => {
    const f = folha('Mais', el('div', { class: 'lista' }, itens.lista.filter(Boolean).map(([t, ic, fn]) => el('button', { class: 'linha', type: 'button', onclick: () => { f.fechar(); fn(); } },
      el('span', { class: 'ic' }, icone(ic)), el('span', { class: 'tx' }, el('span', { class: 't1', text: t })))))); } }, icone('mais'));
}
// Ação principal da tela: botão no cabeçalho (iPad e computador) e fixo embaixo (celular).
function acaoPrincipal(texto, fn, ic, id) {
  return [el('button', { class: 'btn pri acao-tela', type: 'button', onclick: fn, id: id ? id + 'Topo' : null }, icone(ic || 'soma', 'p'), texto),
    el('button', { class: 'btn pri acao-fixa so-celular', type: 'button', onclick: fn, id: id || null }, icone(ic || 'soma', 'p'), texto)];
}

// ---------------------------------------------------------------- navegação: barra de baixo (celular), trilho (iPad em pé) e lateral
function montarNav() {
  const item = (a, comNome) => el('button', { type: 'button', 'data-area': a[0], onclick: () => ir(a[0]) }, icone(a[2]), el('span', { text: a[1] }),
    a[0] === 'agenda' ? el('span', { class: 'selo-cont', 'data-selo-agenda': '', hidden: true }) : null);
  trocar($('navBarra'), areasVisiveis().map(a => item(a)));
  trocar($('navTrilho'), areasVisiveis().map(a => item(a)), item(['conta', 'Conta', 'conta']));
  trocar($('navLateral'), areasVisiveis().map(a => item(a)));
  trocar($('navLateralPe'), item(['conta', 'Conta', 'conta']));
  trocar($('btnBusca'), icone('busca')); trocar($('btnChat'), icone('chat')); trocar($('btnConta'), icone('conta'));
  $('btnConta').setAttribute('data-area', 'conta');
  $('btnChat').hidden = sem('assistente_dono');
}
$('btnConta').addEventListener('click', () => ir('conta'));
$('btnBusca').addEventListener('click', () => buscaAbrir());
$('btnChat').addEventListener('click', () => chatAbrir());
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !$('app').hidden) { e.preventDefault(); buscaAbrir(); } });
// Teclado aberto no celular: esconde a barra de baixo e o botão fixo.
document.addEventListener('focusin', e => { if (e.target.matches('input, select, textarea')) document.body.classList.add('teclado'); });
document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement || !document.activeElement.matches('input, select, textarea')) document.body.classList.remove('teclado'); }, 50));

// ---------------------------------------------------------------- estado da assistente (no alto de todas as telas, tocável)
function pausada() { return !!(PAUSA && PAUSA.ativo === false && PAUSA.status === 'Ativo'); }
function pausaQuando(t) { const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/.exec(t || ''); return m ? m[3] + '/' + m[2] + ' às ' + m[4] : ''; }
function estadoAssistente() {
  const c = CONTA || {}, s = c.situacao;
  // DEC-166 (rxsync-sistema sql/068): o teste novo libera tudo do Gestão; o servidor diz em recursos.teste_gestao.
  const gestaoNoTeste = REC && REC.teste_gestao === true ? ' Durante o teste, tudo do plano Gestão está liberado.' : '';
  if (pausada()) return { ponto: 'off', curto: 'Assistente pausada', t1: 'A assistente está pausada', t2: 'As mensagens dos pacientes chegam para a equipe responder; lembretes e avisos automáticos também param.' };
  if (TESTE.aberto) return { ponto: 'alerta', curto: 'Atendendo só no teste', t1: 'Atendendo só no teste', t2: 'A assistente não está respondendo no WhatsApp da clínica enquanto o teste estiver aberto.' };
  if (s === 'em_teste') { const d = c.dias_restantes; return { ponto: 'on', curto: 'Em teste grátis', t1: 'Teste grátis: ' + (d === 0 ? 'termina hoje' : d === 1 ? 'termina amanhã' : d == null ? 'em andamento' : 'faltam ' + d + ' dias'), t2: 'A assistente está atendendo no WhatsApp da clínica.' + gestaoNoTeste, cartao: true, acao: ['Pagar', 'conta/assinatura'] }; }
  if (s === 'teste_aguardando') return { ponto: 'alerta', curto: 'Falta conectar o WhatsApp', t1: 'Falta conectar o WhatsApp', t2: 'Os 7 dias de teste só começam a contar quando a assistente entrar no ar.' + gestaoNoTeste, cartao: true, acao: ['Conectar', 'conta/whatsapp'] };
  if (s === 'teste_encerrado') return { ponto: 'off', curto: 'Assistente parada', t1: 'O teste terminou e a assistente está parada', t2: 'As mensagens chegam para a sua equipe. Seus dados ficam guardados por 15 dias.', cartao: true, acao: ['Pagar o teste agora', 'conta/assinatura'] };
  if (s === 'suspenso') return { ponto: 'off', curto: 'Assistente suspensa', t1: 'Assistente suspensa por falta de pagamento', t2: 'As mensagens chegam para a sua equipe. Ela volta sozinha assim que o pagamento cair.', acao: ['Pagar', 'conta/assinatura'] };
  if (c.no_ar === false) return { ponto: 'alerta', curto: 'Falta conectar o WhatsApp', t1: 'Falta conectar o WhatsApp', t2: 'A assistente começa a atender assim que o número for conectado.', cartao: true, acao: ['Conectar', 'conta/whatsapp'] };
  return { ponto: 'on', curto: 'Atendendo', t1: 'A assistente está atendendo', t2: 'Respondendo pacientes no WhatsApp da clínica, 24 horas por dia.' };
}
function estadoMostrar() {
  const e = estadoAssistente();
  document.querySelectorAll('[data-ponto]').forEach(p => { p.className = 'ponto ' + e.ponto; });
  document.querySelectorAll('[data-estado-curto]').forEach(p => { p.textContent = e.curto; });
  faixasAtualizar();
  if (TELAS.hoje && TELAS.hoje.sec && !TELAS.hoje.sec.hidden) hojeRender();
  if (TELAS.assistente && TELAS.assistente.sec) assistenteEstadoRender();
}
// Tocar no estado: o que está acontecendo, Pausar ou Retomar, Testar e (no teste) Voltar a atender.
$('btnEstadoIa').addEventListener('click', () => {
  const e = estadoAssistente();
  const corpo = el('div', {}, el('p', { class: 'tit-bloco', text: e.t1 }), el('p', { class: 'mudo', text: e.t2 }), el('div', { class: 'pilha' }, assistenteAcoes(() => f.fechar())));
  const f = folha('A assistente', corpo);
});
// Botões de Pausar/Retomar, Testar e Voltar a atender (o mesmo no estado do alto e no topo de Assistente).
function assistenteAcoes(depois) {
  const l = [];
  if (sessao && PAUSA && PAUSA.pode_pausar) l.push(btn('Pausar a assistente', () => { if (depois) depois(); pausaAgir('assistente_pausar'); }, 'sec plena', 'pausa'));
  if (sessao && PAUSA && PAUSA.pode_retomar) l.push(btn('Retomar a assistente', () => { if (depois) depois(); pausaAgir('assistente_retomar'); }, 'pri plena', 'play'));
  if (TESTE.aberto) l.push(btn('Voltar a atender no WhatsApp', () => { if (depois) depois(); voltarWhats(); }, 'pri plena', 'zap'));
  else l.push(btn('Testar a assistente', () => { if (depois) depois(); testar(false); }, 'sec plena', 'frasco'));
  if (location.hash.indexOf('#assistente') !== 0) l.push(btn('Abrir Assistente', () => { if (depois) depois(); ir('assistente'); }, 'fant plena'));
  return l;
}

// ---------------------------------------------------------------- faixas no alto (uma por vez)
// Ordem: sem conexão › suspensa › pausada › atendendo só no teste › Termos › crie sua senha.
function faixaEl(id, tom, ic) { let f = $(id); if (!f) { f = el('div', { id, class: 'faixa ' + (tom || ''), role: 'status', hidden: true }); $('faixas').append(f); } return f; }
function faixasAtualizar() {
  if (!$('faixas')) return;
  const fx = {
    faixaConexao: () => CONEXAO.caiu,
    faixaConta: () => (CONTA || {}).situacao === 'suspenso',
    faixaPausa: () => pausada(),
    faixaTeste: () => TESTE.aberto,
    faixaTermos: () => !!(TERMOS && TERMOS.mostrar),
    faixaSenha: () => !!token && !sessao
  };
  let mostrou = false;
  for (const [id, cond] of Object.entries(fx)) {
    const f = faixaEl(id, id === 'faixaConexao' || id === 'faixaConta' ? 'erro' : '');
    const vale = !mostrou && cond();
    if (vale) { mostrou = true; faixaMontar(id, f); }
    f.hidden = !vale;
  }
}
function faixaMontar(id, f) {
  if (id === 'faixaConexao') trocar(f, icone('alerta'), el('div', { class: 'txt' }, el('strong', { text: 'Sem conexão. ' }), 'O que você mudar agora não é salvo até a internet voltar.'),
    el('div', { class: 'acoes' }, btn('Tentar de novo', () => location.reload(), 'sec')));
  if (id === 'faixaConta') trocar(f, icone('alerta'), el('div', { class: 'txt' }, el('strong', { text: 'Assistente suspensa. ' }), 'As mensagens chegam para a equipe. Ela volta sozinha quando o pagamento cair.'),
    ehDono() ? el('div', { class: 'acoes' }, btn('Pagar', () => ir('conta/assinatura'), 'sec')) : null);
  if (id === 'faixaPausa') {
    const desde = pausaQuando(PAUSA && PAUSA.pausada_em);
    trocar(f, icone('pausa'), el('div', { class: 'txt', id: 'faixaPausaTxt' }, el('strong', { text: 'Assistente pausada. ' }), PAUSA && PAUSA.pode_retomar
      ? 'Ela não está respondendo os pacientes no WhatsApp' + (desde ? ' desde ' + desde : '') + '; as mensagens chegam para a equipe.'
      : 'Pausada pela RXSync: as mensagens chegam para a equipe. Para ela voltar, fale com a RXSync respondendo um e-mail nosso.'),
      el('div', { class: 'acoes' }, el('button', { class: 'btn pri', type: 'button', id: 'btnFaixaRetomar', hidden: !(PAUSA && PAUSA.pode_retomar), text: 'Retomar a assistente', onclick: () => pausaAgir('assistente_retomar') })));
  }
  if (id === 'faixaTeste') trocar(f, icone('frasco'), el('div', { class: 'txt' }, el('strong', { text: 'Atendendo só no teste. ' }), 'A assistente não está atendendo no WhatsApp da clínica.'),
    el('div', { class: 'acoes' }, btn('Voltar', () => voltarWhats(), 'pri')));
  if (id === 'faixaTermos') {
    const ok = el('input', { type: 'checkbox', id: 'termosOk' });
    trocar(f, icone('documento'), el('div', { class: 'txt', role: 'region', 'aria-label': 'Termos de Uso atualizados' }, el('strong', { text: 'Os Termos de Uso mudaram (versão ' + VERSAO_TERMOS + '). ' }),
      'Sai a promessa de backup diário (hoje a RXSync não mantém essa rotina), as medidas de segurança passam a ser descritas como funcionam hoje e o Resend passa a constar também como quem envia o histórico das conversas no fim do contrato e recebe os e-mails enviados à RXSync. Valem para a sua clínica a partir de ',
      el('span', { id: 'termosData', text: TERMOS.desde || '30 dias depois do aviso por e-mail' }), ', ou antes, se você aceitar agora. ', el('a', { href: '/termos/' + VERSAO_TERMOS + '.html', target: '_blank', rel: 'noopener', text: 'Ler os Termos' })),
      el('label', {}, ok, el('span', { text: 'Li e aceito os Termos de Uso, versão ' + VERSAO_TERMOS + '.' })),
      el('div', { class: 'acoes' }, el('button', { class: 'btn pri', type: 'button', id: 'btnTermosAceitar', text: 'Aceitar', onclick: e => termosAceitar(e.currentTarget) }),
        el('button', { class: 'btn sec', type: 'button', id: 'btnTermosDepois', text: 'Ver depois', onclick: () => { TERMOS.mostrar = false; faixasAtualizar(); } })));
  }
  if (id === 'faixaSenha') trocar(f, icone('cadeado'), el('div', { class: 'txt' }, el('strong', { text: 'Crie sua senha. ' }), 'O painel agora abre com o e-mail e a senha da clínica. Ao criar a senha, este link deixa de funcionar.'),
    el('div', { class: 'acoes' }, el('button', { class: 'btn pri', type: 'button', id: 'btnFaixaSenha', text: 'Criar minha senha', onclick: e => criarSenhaPeloLink(e.currentTarget) })));
}
// Termos atualizados (DEC-113): "Ver depois" só esconde nesta abertura; depois da vigência, o servidor grava o aceite tácito.
function termosConferir(ja) {
  (ja ? Promise.resolve(ja) : c29('termos_estado')).then(r => {
    if (!r || !r.ok || !r.pendente || r.versao !== VERSAO_TERMOS) return;
    TERMOS = { mostrar: true, desde: r.clientes_desde_texto || '' }; faixasAtualizar();
  });
}
function termosAceitar(b) {
  if (!$('termosOk').checked) { rapida('Marque que leu e aceita os Termos de Uso.'); $('termosOk').focus(); return; }
  b.disabled = true;
  c29('termos_aceitar', { aceite_termos: true, versao_termos: VERSAO_TERMOS }).then(r => {
    b.disabled = false;
    if (r && r.ok) { TERMOS = null; faixasAtualizar(); rapida('Pronto: aceite dos Termos registrado.'); }
    else rapida((r && r.mensagem) || 'Não consegui registrar agora. Tente de novo.');
  });
}

// ---------------------------------------------------------------- busca (lupa ou ⌘K): telas pelo nome e por sinônimos, pacientes e consultas carregadas
// Tocar num resultado abre a tela; a busca nunca executa uma ação.
const BUSCA_TELAS = [
  ['Hoje', 'hoje', 'início'], ['Resultados', 'resultados', 'números indicadores relatório avaliações nota'], ['Agenda', 'agenda', 'consultas calendário marcar remarcar cancelar'],
  ['Lista de espera', 'agenda/espera', 'espera fila'], ['Documentos recebidos', 'agenda/documentos', 'documentos fotos pdf exame receita carteirinha'],
  ['Agenda › Horários', 'agenda/horarios', 'ajustes da agenda configurar agenda'], ['Horários de atendimento', 'agenda/horarios/grade', 'grade dias horário atendimento'],
  ['Regras da agenda', 'agenda/horarios/regras', 'duração intervalo antecedência janela fuso agrupar empilhamento'], ['Médicos e tipos', 'agenda/horarios/medicos', 'médicos profissionais tipos de consulta agenda por médico'],
  ['Perguntas antes de agendar', 'agenda/horarios/perguntas', 'pré-consulta perguntas'], ['Feriados', 'agenda/horarios/feriados', 'feriado cidade facultativo'],
  ['Receber dos pacientes', 'agenda/horarios/pagamento', 'pagamento link de pagamento asaas cobrar valor da consulta'], ['Integração e planilhas', 'agenda/horarios/integracao', 'integração reservio importar agenda planilha link de agendamento'],
  ['Pacientes', 'pacientes', 'cadastro ficha'], ['Possíveis duplicados', 'pacientes/duplicados', 'juntar repetidos'], ['Importar pacientes', 'pacientes/importar', 'planilha csv'],
  ['Assistente', 'assistente', 'pausar testar ia'], ['Sua clínica', 'assistente/clinica', 'nome endereço serviços profissionais apresentação'], ['Jeito de conversar', 'assistente/conversa', 'saudação tom horário de funcionamento'],
  ['Valores, convênios e regras', 'assistente/valores', 'preço preços valores convênio pagamento formas de pagamento'], ['Urgência e equipe', 'assistente/urgencia', 'urgência emergência chamar equipe whatsapp de avisos'],
  ['Mensagens automáticas', 'assistente/automaticas', 'lembretes lembrete pesquisa retorno convidar quem sumiu avaliação google'], ['Limites', 'assistente/limites', 'palavras proibidas assuntos números sem ia'],
  ['Informações extras', 'assistente/extras', 'catálogo avisos campanhas'], ['O que ela faz', 'assistente/funcoes', 'funções da assistente recursos ligar desligar'],
  ['Conta', 'conta', 'perfil'], ['Plano e pagamento', 'conta/assinatura', 'assinatura plano mensalidade cobrança cancelar excluir conta'], ['WhatsApp da clínica', 'conta/whatsapp', 'reconectar número qr'],
  ['Assistente de gestão', 'conta/gestao', 'resumo do dia números autorizados'], ['Contato e responsável técnico', 'conta/contato', 'e-mail telefone responsável'],
  ['Equipe', 'conta/equipe', 'convidar secretária pessoas'], ['Acessos recentes', 'conta/acessos', 'histórico do painel'], ['Baixar meus dados', 'conta/dados', 'exportar csv planilha'],
  ['Dados do contrato', 'conta/contrato', 'cnpj razão social'], ['O que mudou no painel', 'conta/mudou', 'novidades visual novo onde ficou mudança painel antigo']];
function buscaAbrir() {
  const inp = el('input', { class: 'entrada', type: 'search', id: 'buscaTexto', placeholder: 'Buscar telas, pacientes e consultas', 'aria-label': 'Buscar', autocomplete: 'off', enterkeyhint: 'search' });
  const res = el('div', { class: 'busca-res', role: 'region', 'aria-live': 'polite' });
  const f = folha('Buscar', el('div', {}, inp, el('div', { class: 'pilha' }, res)), { foco: '#buscaTexto' });
  let seq = 0, tm = null;
  const linha = (t, sub, ic, fn) => el('button', { class: 'linha', type: 'button', onclick: () => { f.fechar(); fn(); } }, el('span', { class: 'ic' }, icone(ic)),
    el('span', { class: 'tx' }, el('span', { class: 't1', text: t }), sub ? el('span', { class: 't2', text: sub }) : null), el('span', { class: 'seta' }, icone('seta')));
  const desenhar = () => {
    const q = semAcento(inp.value);
    if (!q) { trocar(res, el('p', { class: 'mudo', text: 'Digite o nome de uma tela ("preço", "feriados"), de um paciente ou de quem tem consulta.' })); return; }
    const telas = BUSCA_TELAS.filter(([n, r, sin]) => (r !== 'pacientes' && !r.startsWith('pacientes/')) || !sem('pacientes')).filter(([n, r, sin]) => semAcento(n + ' ' + sin).includes(q)).slice(0, 8);
    const cons = (AG.dados || []).filter(a => a.servico !== 'BLOQUEIO' && semAcento(a.nome_paciente).includes(q)).slice(0, 5);
    const blocos = [];
    if (telas.length) blocos.push(el('p', { class: 'grupo-tit', text: 'Telas' }), el('div', { class: 'lista' }, telas.map(([n, r]) => linha(n, null, 'seta', () => ir(r)))));
    if (cons.length) blocos.push(el('p', { class: 'grupo-tit', text: 'Consultas' }), el('div', { class: 'lista' }, cons.map(a => linha(a.nome_paciente, fmt(a.inicio), 'agenda', () => { ir('agenda'); setTimeout(() => consultaAbrir(a), 50); }))));
    const pac = el('div');
    blocos.push(pac);
    trocar(res, blocos.length > 1 ? blocos : vazio('Nada encontrado', 'Tente outro nome ou só um pedaço dele.'));
    if (!sem('pacientes') && q.length >= 2) {
      const s = ++seq; clearTimeout(tm);
      tm = setTimeout(() => p24('paciente_listar', { busca: inp.value.trim(), filtro: 'todos', pagina: 0 }).then(d => {
        if (s !== seq || !d.ok || !(d.pacientes || []).length) return;
        trocar(pac, el('p', { class: 'grupo-tit', text: 'Pacientes' }), el('div', { class: 'lista' }, d.pacientes.slice(0, 6).map(p => linha(p.nome, pacTel(p.telefone), 'pacientes', () => ir('pacientes/ficha/' + p.paciente_id)))));
      }).catch(() => {}), 300);
    }
  };
  inp.addEventListener('input', desenhar); desenhar();
}
