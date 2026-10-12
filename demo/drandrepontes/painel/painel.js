/* Painel da clínica · um único código; cada tela é uma função em TELAS e abre por #tela (ex.: #agenda).
   Dados de exemplo fictícios (pacientes inventados). A IA é simulada (respostas prontas no código):
   não diagnostica, não prescreve e não calcula dose. Funcionam de verdade, só na memória:
   marcar e mover consulta (#agenda) e mover cartão no funil (#funil). */
(function () {
  'use strict';
  var A = window.AG;

  // ---------- menu: Base, CRM e ERP separados, mais Atendimento RXSync, App, Central do médico e Profissionais ----------
  var MENU = [
    { grupo: 'Hoje', itens: [
      { id: 'dia', nome: 'Visão do dia', ic: 'inicio' },
      { id: 'medico', nome: 'Visão do médico', ic: 'estetoscopio' }] },
    { grupo: 'Atendimento RXSync', itens: [
      { id: 'atendimento', nome: 'Conversas da IA', ic: 'whatsapp' },
      { id: 'agenda-ia', nome: 'Agenda da IA e pré-consulta', ic: 'calendario' },
      { id: 'relacionamento', nome: 'Relacionamento', ic: 'sino' },
      { id: 'api', nome: 'Ligação com o painel', ic: 'link' }] },
    { grupo: 'CRM', itens: [
      { id: 'pacientes', nome: 'Pacientes', ic: 'pacientes' },
      { id: 'funil', nome: 'Funil', ic: 'funil' },
      { id: 'casos', nome: 'Casos por área', ic: 'equipe' },
      { id: 'conversas', nome: 'Caixa de conversas', ic: 'chat' }] },
    { grupo: 'ERP', itens: [
      { id: 'agenda', nome: 'Agenda', ic: 'calendario' },
      { id: 'ficha', nome: 'Ficha e balança', ic: 'documento' },
      { id: 'financeiro', nome: 'Financeiro e estoque', ic: 'moeda' },
      { id: 'ia-equipe', nome: 'IA da equipe e manual', ic: 'ia' },
      { id: 'config', nome: 'Configurações', ic: 'engrenagem' }] },
    { grupo: 'App do paciente', itens: [
      { id: 'app', nome: 'Prescrições e conteúdo', ic: 'seringa' }] },
    { grupo: 'Central do médico', itens: [
      { id: 'central', nome: 'Consulta e assistente', ic: 'estetoscopio' }] },
    { grupo: 'Profissionais', itens: [
      { id: 'profissionais', nome: 'Painel de cada um', ic: 'perfil' }] },
    { grupo: 'Base', itens: [
      { id: 'consumo', nome: 'Consumo de IA', ic: 'evolucao' },
      { id: 'seguranca', nome: 'Segurança e dados', ic: 'escudo' }] }
  ];

  // ---------- dados de exemplo ----------
  var PACIENTES = [
    { id: 'P-DEMO7', nome: 'Marina Lopes', idade: 41, fase: 'Perda de peso', status: 'Em tratamento', prof: 'Dr. André', ultimo: '13/10', peso: '78,6', var: '−5,4 kg', adesao: 82, alerta: '' },
    { id: 'P-DEMO5', nome: 'Carlos Menezes', idade: 52, fase: 'Perda de peso', status: 'Em tratamento', prof: 'Dr. André', ultimo: '13/10', peso: '101,2', var: '−7,9 kg', adesao: 64, alerta: 'Náusea forte depois da aplicação' },
    { id: 'P-DEMO9', nome: 'Helena Duarte', idade: 36, fase: 'Início', status: 'Agendado', prof: 'Dr. André', ultimo: '—', peso: '84,0', var: '—', adesao: 0, alerta: '' },
    { id: 'P-DEMO4', nome: 'Rodrigo Alves', idade: 47, fase: 'Perda de peso', status: 'Em tratamento', prof: 'Felipe', ultimo: '08/10', peso: '93,4', var: '−3,1 kg', adesao: 21, alerta: '5 dias sem registrar' },
    { id: 'P-DEMO2', nome: 'Beatriz Nogueira', idade: 29, fase: 'Manutenção', status: 'Em tratamento', prof: 'Dr. André', ultimo: '12/10', peso: '61,8', var: '−9,2 kg', adesao: 91, alerta: '' },
    { id: 'P-DEMO3', nome: 'Paula Freitas', idade: 44, fase: 'Desmame', status: 'Em tratamento', prof: 'Maria Clara', ultimo: '11/10', peso: '70,3', var: '−11,5 kg', adesao: 74, alerta: 'Humor baixo 3 dias seguidos' },
    { id: 'P-DEMO6', nome: 'Juliana Prado', idade: 38, fase: '—', status: 'Novo contato', prof: '—', ultimo: '—', peso: '—', var: '—', adesao: 0, alerta: '' },
    { id: 'P-DEMO8', nome: 'Fernando Lima', idade: 55, fase: 'Manutenção', status: 'Retorno vencido', prof: 'Dr. André', ultimo: '02/08', peso: '88,0', var: '−6,0 kg', adesao: 12, alerta: 'Retorno vencido há 12 dias' },
    { id: 'P-DEMO1', nome: 'Ana Ribeiro', idade: 33, fase: 'Manutenção', status: 'Inativo', prof: 'Felipe', ultimo: '15/03', peso: '66,1', var: '−4,2 kg', adesao: 0, alerta: '' },
    { id: 'P-DEM10', nome: 'Lucas Teixeira', idade: 41, fase: '—', status: 'Novo contato', prof: '—', ultimo: '—', peso: '—', var: '—', adesao: 0, alerta: '' },
    { id: 'P-DEM11', nome: 'Sofia Martins', idade: 27, fase: 'Início', status: 'Agendado', prof: 'Felipe', ultimo: '—', peso: '72,5', var: '—', adesao: 0, alerta: '' },
    { id: 'P-DEM12', nome: 'Renata Costa', idade: 50, fase: 'Perda de peso', status: 'Em tratamento', prof: 'Dr. André', ultimo: '10/10', peso: '90,7', var: '−2,8 kg', adesao: 58, alerta: 'Perda de 2,4 kg em 7 dias' }
  ];
  var EQUIPE = {
    andre: { nome: 'Dr. André Pontes Gonçalves', papel: 'Médico', ini: 'AG', cor: 'var(--c1)' },
    emanuele: { nome: 'Emanuele', papel: 'Administrativo e financeiro', ini: 'EM', cor: 'var(--c5)' },
    felipe: { nome: 'Felipe', papel: 'Nutricionista', ini: 'FE', cor: 'var(--c2)' },
    mariaclara: { nome: 'Maria Clara', papel: 'Psicóloga', ini: 'MC', cor: 'var(--c6)' },
    eduarda: { nome: 'Eduarda', papel: 'Técnica de enfermagem', ini: 'ED', cor: 'var(--c4)' },
    thais: { nome: 'Thaís', papel: 'Enfermeira', ini: 'TH', cor: 'var(--c3)' },
    elenice: { nome: 'Elenice', papel: 'Concierge', ini: 'EL', cor: 'var(--c1)' }
  };
  var PROFS = [['Dr. André', 'var(--c1)'], ['Felipe', 'var(--c2)'], ['Maria Clara', 'var(--c6)'], ['Enfermagem', 'var(--c3)']];
  var TIPOS = ['Primeira consulta · 60 min', 'Retorno · 30 min', 'Nutrição', 'Psicologia', 'Aplicação na clínica', 'Bioimpedância'];
  var DIAS = ['Seg 12/10', 'Ter 13/10', 'Qua 14/10', 'Qui 15/10', 'Sex 16/10'];
  var HORAS = []; for (var h = 8; h < 18; h++) { HORAS.push((h < 10 ? '0' : '') + h + ':00'); HORAS.push((h < 10 ? '0' : '') + h + ':30'); }

  // Estado da demonstração (só na memória: recarregar volta ao começo).
  var E = {
    eventos: [
      { id: 1, dia: 1, slot: 0, pac: 'Beatriz Nogueira', tipo: 'Retorno · 30 min', prof: 'Dr. André' },
      { id: 2, dia: 1, slot: 1, pac: 'Carlos Menezes', tipo: 'Bioimpedância', prof: 'Enfermagem' },
      { id: 3, dia: 1, slot: 2, pac: 'Helena Duarte', tipo: 'Primeira consulta · 60 min', prof: 'Dr. André' },
      { id: 4, dia: 1, slot: 4, pac: 'Rodrigo Alves', tipo: 'Nutrição', prof: 'Felipe' },
      { id: 5, dia: 1, slot: 5, pac: 'Marina Lopes', tipo: 'Aplicação na clínica', prof: 'Enfermagem' },
      { id: 6, dia: 1, slot: 6, pac: 'Paula Freitas', tipo: 'Psicologia', prof: 'Maria Clara' },
      { id: 7, dia: 2, slot: 3, pac: 'Sofia Martins', tipo: 'Nutrição', prof: 'Felipe' },
      { id: 8, dia: 2, slot: 12, pac: 'Renata Costa', tipo: 'Retorno · 30 min', prof: 'Dr. André' },
      { id: 9, dia: 3, slot: 0, pac: 'Marina Lopes', tipo: 'Aplicação na clínica', prof: 'Enfermagem' },
      { id: 10, dia: 3, slot: 8, pac: 'Fernando Lima', tipo: 'Retorno · 30 min', prof: 'Dr. André' },
      { id: 11, dia: 4, slot: 2, pac: 'Juliana Prado', tipo: 'Primeira consulta · 60 min', prof: 'Dr. André' },
      { id: 12, dia: 4, slot: 14, pac: 'Paula Freitas', tipo: 'Psicologia', prof: 'Maria Clara' }
    ],
    proxId: 13, selEvento: null, filtroProf: '', selCartao: null, paciente: 'P-DEMO7', abaFicha: 'resumo',
    gravando: false, transcrita: false, pdf: false, chatEquipe: null, profAberto: 'andre'
  };
  var FUNIL = ['Novo contato', 'Agendado', 'Em tratamento', 'Retorno vencido', 'Inativo'];

  // ---------- peças ----------
  function cartao(c, classe) { return '<section class="cartao ' + (classe || '') + '">' + c + '</section>'; }
  function titulo(t, itens) { return '<div class="cartao-titulo"><h3>' + t + '</h3><div class="itens">' + (itens || '') + '</div></div>'; }
  function cab(t, sub, itens) {
    return '<div class="cabeca"><div><h1>' + t + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + (itens ? '<div class="itens">' + itens + '</div>' : '') + '</div></div>';
  }
  function pessoa(p, t) { return '<span class="pessoa" style="background:' + p.cor + (t ? ';width:' + t + 'px;height:' + t + 'px' : '') + '">' + p.ini + '</span>'; }
  function corProf(n) { for (var i = 0; i < PROFS.length; i++) if (PROFS[i][0] === n) return PROFS[i][1]; return 'var(--c4)'; }
  function pac(id) { return PACIENTES.filter(function (p) { return p.id === id; })[0] || PACIENTES[0]; }
  function pacPorNome(n) { return PACIENTES.filter(function (p) { return p.nome === n; })[0]; }
  function linkPac(p) { return '<a href="#ficha" data-acao="abrir-ficha" data-v="' + p.id + '" style="text-decoration:none;color:inherit"><b>' + p.nome + '</b></a> <span class="idp">' + p.id + '</span>'; }
  function st(t) { var m = { 'Em tratamento': 'st-ok', 'Agendado': 'st-in', 'Novo contato': 'st-in', 'Retorno vencido': 'st-al', 'Inativo': 'st-pe' }; return '<span class="status ' + (m[t] || 'st-in') + '">' + t + '</span>'; }
  function chave(on) { return '<button type="button" class="chave' + (on ? ' on' : '') + '" data-acao="chave" aria-label="Ligar ou desligar"></button>'; }
  function funcao(nome, sub, itens, on, trava) {
    return '<div class="lin"><div class="meio"><b>' + nome + '</b> ' + (itens || '') + '<small>' + (sub || '') + '</small></div>' + (trava ? '<span class="chip" style="padding:4px 9px">' + A.ic('cadeado') + 'sempre ligado</span>' : chave(on)) + '</div>';
  }
  function kpi(nome, valor, extra, cls) { return cartao('<span class="rotulo">' + nome + '</span><div class="valor num">' + valor + '</div><div class="var ' + (cls || '') + '">' + extra + '</div>', 'kpi'); }
  function caso(nome, n, sub, cor) { return '<div class="caso"><span class="fraco" style="font-size:12px;font-weight:600">' + nome + '</span><span class="num" style="color:' + (cor || 'inherit') + '">' + n + '</span><span class="fraco" style="font-size:11.5px">' + sub + '</span></div>'; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function lista(linhas) { return '<div class="lista">' + linhas.join('') + '</div>'; }
  function lin(a, b, c) { return '<div class="lin">' + (a || '') + '<div class="meio">' + b + '</div>' + (c || '') + '</div>'; }

  // ---------- telas ----------
  var TELAS = {
    // ===== Hoje =====
    dia: function () {
      var hoje = E.eventos.filter(function (e) { return e.dia === 1; }).sort(function (a, b) { return a.slot - b.slot; });
      return '' +
        '<div class="cabeca"><div><div class="mudo" style="font-size:13px">Terça, 13 de outubro</div><h1>Visão do dia</h1></div>' +
          '<div class="direita"><a class="busca" href="#pacientes" style="text-decoration:none">' + A.ic('pacientes') + 'Buscar paciente, telefone ou ID</a>' +
          '<div class="eu"><span class="avatar">AG</span></div></div></div>' +
        '<div class="kpis">' +
          kpi('Consultas hoje', hoje.length, '2 encaixes', 'sobe') + kpi('Faltas na semana', '3', '−2 vs. semana passada', 'sobe') +
          kpi('Ativos no app', '186', '+9 este mês', 'sobe') + kpi('Adesão média', '78%', 'registros na semana', '') + kpi('Perda média', '−6,4 kg', 'em 90 dias', 'sobe') +
        '</div><div style="display:flex;justify-content:flex-end;margin-top:-8px">' + A.item(56) + '</div>' +
        '<div class="grade">' +
          cartao(titulo('Agenda de hoje', A.item([50, 51]) + ' <a class="item" href="#agenda" style="text-decoration:none">abrir agenda</a>') +
            lista(hoje.map(function (e) {
              var p = pacPorNome(e.pac) || { id: '', nome: e.pac };
              return '<div class="lin"><span class="hora num">' + HORAS[e.slot] + '</span><div class="meio">' + linkPac(p) + '<div class="fraco">' + e.tipo + ' · ' + e.prof + '</div></div>' + (p.alerta ? '<span class="status st-al">alerta</span>' : '<span class="status st-ok">Confirmada</span>') + '</div>';
            })), 's7') +
          cartao(titulo('Alertas', A.item([129, 135])) +
            '<div class="alerta-lin" style="--cor:var(--perigo)">' + A.bolha('alerta', 'var(--perigo)') + '<div><b>Carlos M. relatou náusea forte</b><div class="fraco" style="font-size:12.5px">2 dias depois da aplicação · enfermagem avisada às 07:42</div></div></div>' +
            '<div class="alerta-lin" style="--cor:var(--alerta)">' + A.bolha('evolucao', 'var(--alerta)') + '<div><b>Rodrigo A. parou de registrar</b><div class="fraco" style="font-size:12.5px">5 dias sem registro no app</div></div></div>' +
            '<div class="alerta-lin" style="--cor:var(--info)">' + A.bolha('seringa', 'var(--info)') + '<div><b>Estoque: 4 frascos</b> ' + A.item(91) + '<div class="fraco" style="font-size:12.5px">abaixo do mínimo de 6</div></div></div>' +
            '<a class="botao botao-claro" href="#medico" style="margin-top:12px;width:100%;text-decoration:none">Visão do médico</a>', 's5') +
          cartao(titulo('Antes da próxima consulta', A.item(71)) +
            '<div class="linha-ic">' + A.bolha('documento', 'var(--c3)') + '<div><b>Helena Duarte · 09:00</b> <span class="idp">P-DEMO9</span><div class="fraco" style="font-size:12.5px">Primeira consulta</div></div></div>' +
            '<p class="mudo" style="margin-top:12px;font-size:13.5px">Respondeu a pré-consulta: objetivo perder 12 kg, sem cirurgias, usa anticoncepcional. Peso informado 84 kg. <span class="fraco">(resumo simulado)</span></p>', 's4') +
          cartao(titulo('Casos abertos por área', A.item(62)) + '<div class="casos">' + caso('Nutrição', 3, '1 aguardando Felipe') + caso('Enfermagem', 2, '1 atrasado', 'var(--perigo)') + caso('Financeiro', 1, 'Emanuele') + caso('Médico', 1, 'Dr. André') + '</div>', 's4') +
          cartao(titulo('Atendimento pela IA hoje', A.item([1, 10])) +
            '<div style="display:flex;gap:24px;align-items:flex-end;flex-wrap:wrap">' +
              '<div><div class="num" style="font-size:34px;font-weight:700;line-height:1">37</div><div class="fraco" style="font-size:12.5px">conversas</div></div>' +
              '<div><div class="num" style="font-size:34px;font-weight:700;line-height:1">9</div><div class="fraco" style="font-size:12.5px">consultas marcadas</div></div>' +
              '<div><div class="num" style="font-size:34px;font-weight:700;line-height:1">4</div><div class="fraco" style="font-size:12.5px">passadas à equipe</div></div>' +
            '</div><div style="margin-top:14px">' + A.item(4) + ' ' + A.item(58) + '</div>', 's4') +
          cartao(titulo('Consumo de IA do mês', A.item([146, 147])) +
            '<div style="display:flex;align-items:center;gap:18px">' + A.anel({ tamanho: 92, espessura: 9, valor: .53, centro: '<div class="num" style="font-size:20px;font-weight:700">53%</div>' }) +
              '<div><div class="num" style="font-size:22px;font-weight:700">R$ 212,40</div><div class="fraco" style="font-size:12.5px">de um teto de R$ 400 · valores de exemplo</div>' +
              '<a class="mudo" href="#consumo" style="font-size:12.5px;display:inline-block;margin-top:6px">ver por função</a></div></div>', 's6 cartao-destaque') +
          cartao(titulo('Painel de cada profissional', A.item(168) + A.proposta()) +
            '<p class="mudo" style="font-size:13.5px">Cada pessoa da equipe abre o painel no que importa para a sua função.</p>' +
            '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">' + Object.keys(EQUIPE).map(function (k) { return '<a href="#prof-' + k + '" title="' + EQUIPE[k].nome + '" style="text-decoration:none">' + pessoa(EQUIPE[k]) + '</a>'; }).join('') + '</div>', 's6') +
        '</div>';
    },

    // Item 135: lista de pacientes com o resumo da semana e os alertas.
    medico: function () {
      var com = PACIENTES.filter(function (p) { return p.status === 'Em tratamento' || p.status === 'Retorno vencido'; });
      return cab('Visão do médico', 'Pacientes em acompanhamento, com o resumo da semana e o que pede atenção.', A.item([135, 134])) +
        '<div class="abas-tela"><button class="ativo" type="button" data-acao="aba">Todos (' + com.length + ')</button><button type="button" data-acao="aba">Com alerta (' + com.filter(function (p) { return p.alerta; }).length + ')</button><button type="button" data-acao="aba">Sem registro há 3 dias</button></div>' +
        cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Fase</th><th>Peso</th><th>Variação</th><th>Adesão no app</th><th>Atenção</th></tr>' +
          com.map(function (p) {
            return '<tr class="clicavel" data-acao="abrir-ficha" data-v="' + p.id + '"><td><b>' + p.nome + '</b> <span class="idp">' + p.id + '</span></td><td>' + p.fase + '</td><td class="num">' + p.peso + ' kg</td><td class="num">' + p.var + '</td>' +
              '<td style="min-width:120px"><div class="barra" style="--cor:' + (p.adesao < 40 ? 'var(--alerta)' : 'var(--ok)') + '"><i style="width:' + p.adesao + '%"></i></div><span class="nota">' + p.adesao + '% dos dias</span></td>' +
              '<td>' + (p.alerta ? '<span class="status st-al">' + p.alerta + '</span>' : '<span class="fraco">—</span>') + '</td></tr>';
          }).join('') + '</table></div>') +
        '<p class="nota">Toque num paciente para abrir a ficha. A adesão vem dos registros do app (alimentação, hábitos, medidas e aplicações).</p>';
    },

    // ===== Atendimento RXSync (Projeto 1, itens 1 a 40) =====
    atendimento: function () {
      var conv = [['Juliana Prado', 'Quanto custa a primeira consulta?', 'IA respondeu com os preços cadastrados', 'st-ok', 'respondida'], ['Carlos Menezes', 'Estou muito enjoado desde ontem', 'Assunto sensível: passou para a enfermagem', 'st-al', 'com a equipe'],
        ['Helena Duarte', '(foto de um pedido de exame)', 'IA leu o pedido e anexou', 'st-ok', 'respondida'], ['Lucas Teixeira', 'Tem horário quinta de manhã?', 'IA ofereceu 3 horários e marcou', 'st-in', 'agendou'], ['Marina Lopes', 'Oi, é a Marina de novo', 'Reconheceu pelo telefone e chamou pelo nome', 'st-ok', 'respondida']];
      return cab('Conversas da IA', 'O atendimento por IA no WhatsApp da clínica (Gestão Inteligente da RXSync).', A.item([1, 2, 3, 10, 11, 15])) +
        '<div class="grade">' +
          cartao(titulo('Conversas de hoje', A.item([1, 3, 10, 15])) + lista(conv.map(function (c) {
            return lin('<span class="pessoa" style="background:var(--c3)">' + c[0].split(' ').map(function (x) { return x[0]; }).join('') + '</span>', '<b>' + c[0] + '</b><div class="mudo" style="font-size:13px">"' + c[1] + '"</div><div class="fraco" style="font-size:12px">' + c[2] + '</div>', '<span class="status ' + c[3] + '">' + c[4] + '</span>');
          })), 's7') +
          cartao(titulo('Como a IA responde', A.item([2, 11])) +
            '<div class="funcoes">' + funcao('Respostas sobre a clínica', 'preços, procedimentos, endereço e preparo, do que a clínica cadastrou', A.item(2), true, true) +
            funcao('Leitura de fotos e PDFs', 'pedidos de exame e receitas', A.item(3), true) +
            funcao('Regras de linguagem', 'palavras e assuntos que a IA nunca usa', A.item(11), true) +
            funcao('Passagem para um humano', 'assuntos sensíveis ou quando o paciente pede', A.item(10), true, true) +
            funcao('Reconhecer quem volta', 'pelo telefone, chama pelo nome', A.item(15), true) +
            funcao('Números da equipe', 'mensagens desses números nunca são tratadas como paciente', A.item(35), true) + '</div>', 's5') +
          cartao(titulo('Resumo para a equipe (briefing)', A.item([5, 17, 14])) +
            '<div class="alerta-lin" style="--cor:var(--info)">' + A.bolha('documento', 'var(--info)') + '<div><b>Lucas Teixeira · P-DEM10 · primeira consulta</b><p class="mudo" style="font-size:13px;margin-top:4px">Quer emagrecer 15 kg; tentou dieta sozinho; procura acompanhamento com medicação. Prefere manhãs. <span class="fraco">(resumo simulado)</span></p></div></div>' +
            '<p class="nota" style="margin-top:8px">Cada paciente ganha um ID no primeiro contato ' + A.item(14) + ' e o briefing diz se é primeira consulta ou retorno ' + A.item(17) + '.</p>', 's12') +
        '</div>';
    },
    'agenda-ia': function () {
      return cab('Agenda da IA e pré-consulta', 'Como a IA marca: horários, médicos, tipos, empilhamento, fila e perguntas antes de agendar.', A.item([4, 6, 7, 8, 9, 18, 22, 28])) +
        '<div class="grade">' +
          cartao(titulo('Agendamento', A.item([4, 6, 7, 8, 9])) + '<div class="funcoes">' +
            funcao('Agendamento direto', 'respeita antecedência e intervalos; nunca marca dois no mesmo horário', A.item(4), true) +
            funcao('Lembretes de consulta', 'mensagem automática antes da consulta', A.item(6), true) +
            funcao('Fila de espera', 'vaga cancelada é oferecida a quem está na lista · 3 aguardando', A.item(7), true) +
            funcao('Feriados por cidade', 'segunda, 12/10, bloqueada (feriado nacional)', A.item(8), true) +
            funcao('Integração com o Reservio', 'desligada nesta clínica', A.item(9), false) + '</div>', 's6') +
          cartao(titulo('Empilhamento', A.item([18, 19, 20, 21, 26])) + '<div class="funcoes">' +
            funcao('Agrupar pacientes', 'liga e desliga no calendário', A.item(18), true) +
            funcao('Horários colados primeiro', 'oferece primeiro os vizinhos dos já marcados', A.item(19), true) +
            funcao('Dias ocupados primeiro', 'evita abrir um período para uma só consulta', A.item(20), true) +
            funcao('Alternativas se o paciente recusar', 'a prioridade nunca impede o agendamento', A.item(21), true, true) +
            funcao('Empilhamento por médico', 'em cada agenda separadamente', A.item(26), true) + '</div>', 's6') +
          cartao(titulo('Médicos e tipos de consulta', A.item([22, 23, 24, 25])) +
            '<div class="rolar-x"><table class="tabela-larga"><tr><th>Médico</th><th>Consulta</th><th>Duração</th><th>Retorno em</th></tr>' +
            '<tr><td rowspan="2"><b>Dr. André</b></td><td>Primeira consulta</td><td>60 min</td><td>30 dias</td></tr><tr><td>Retorno</td><td>30 min</td><td>45 dias</td></tr>' +
            '<tr><td><b>Felipe</b></td><td>Nutrição</td><td>45 min</td><td>30 dias</td></tr><tr><td><b>Maria Clara</b></td><td>Psicologia</td><td>50 min</td><td>7 dias</td></tr></table></div>' +
            '<p class="nota" style="margin-top:8px">Cada um tem a própria grade ' + A.item(25) + '; a IA entende qual consulta o paciente precisa e confirma antes de marcar ' + A.item(24) + '.</p>' +
            '<p class="nota riscado" style="margin-top:6px">Reservio por médico</p><p class="nota">' + A.item(27) + ' fora do Projeto 1 (escopo versão 3, 11/10/2026): fica para quando um cliente pedir.</p>', 's6') +
          cartao(titulo('Pré-consulta', A.item([28, 29, 30])) +
            '<div class="lista">' + ['Qual é o seu objetivo com o tratamento?', 'Já fez alguma cirurgia?', 'Usa algum remédio todos os dias?', 'Qual é o seu peso hoje (aproximado)?'].map(function (q, i) { return lin('<span class="num fraco">' + (i + 1) + '</span>', q, i < 2 ? '<span class="status st-in">obrigatória</span>' : ''); }).join('') + '</div>' +
            '<p class="nota" style="margin-top:8px">Perguntas por tipo de consulta ' + A.item(28) + '; a IA pergunta antes de confirmar ' + A.item(29) + '; as respostas vão para a ficha e o briefing ' + A.item(30) + '.</p>', 's6') +
        '</div>';
    },
    relacionamento: function () {
      return cab('Relacionamento', 'Avisos que a clínica inicia, com limite diário e opção de o paciente sair (SAIR).', A.item([37, 38, 39, 40])) +
        '<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + kpi('Retornos avisados', '6', 'este mês', '') + kpi('Convites a quem sumiu', '4', '1 voltou', 'sobe') + kpi('Nota média', '9,1', 'pesquisa de satisfação', 'sobe') + kpi('Convites do Google', '23', 'enviados a todos', '') + '</div>' +
        '<div class="grade">' +
          cartao(titulo('Funções', A.item([37, 38, 39, 40])) + '<div class="funcoes">' +
            funcao('Retorno vencido', 'quando o prazo passa, a IA avisa e oferece horários', A.item(37), true) +
            funcao('Convidar quem sumiu', 'depois de 180 dias sem consulta', A.item(38), true) +
            funcao('Pesquisa de satisfação', 'nota e comentário pelo WhatsApp, ligados ao paciente', A.item(39), true) +
            funcao('Avaliação no Google', 'enviada a todos os atendidos, nunca só aos satisfeitos', A.item(40), true) + '</div>' +
            '<p class="nota" style="margin-top:8px">Limite de 30 avisos por dia. Quem responde SAIR não recebe mais.</p>', 's6') +
          cartao(titulo('Últimas avaliações', A.item(39)) + lista([
            lin('<span class="num" style="font-weight:700;font-size:20px">10</span>', '<b>Beatriz Nogueira</b> <span class="idp">P-DEMO2</span><div class="mudo" style="font-size:13px">"Equipe muito atenciosa."</div>'),
            lin('<span class="num" style="font-weight:700;font-size:20px">9</span>', '<b>Marina Lopes</b> <span class="idp">P-DEMO7</span>'),
            lin('<span class="num" style="font-weight:700;font-size:20px;color:var(--alerta)">6</span>', '<b>Rodrigo Alves</b> <span class="idp">P-DEMO4</span><div class="mudo" style="font-size:13px">"Esperei 25 minutos."</div>')]), 's6') +
        '</div>';
    },
    api: function () {
      return cab('Ligação com o painel', 'Como o painel da Clínica Evoluir conversa com o atendimento da RXSync. O painel nunca acessa o banco da RXSync, só esta ligação.', A.item([31, 32, 33, 34, 35, 36])) +
        '<div class="grade">' +
          cartao(titulo('Avisos de eventos', A.item(31)) + lista([
            lin('<span class="num fraco">09:12</span>', '<b>agendou</b> · Lucas Teixeira · quinta 10:30', '<span class="status st-ok">recebido</span>'),
            lin('<span class="num fraco">08:47</span>', '<b>encaminhado</b> · Carlos Menezes · enfermagem', '<span class="status st-ok">recebido</span>'),
            lin('<span class="num fraco">08:05</span>', '<b>remarcou</b> · Fernando Lima', '<span class="status st-ok">recebido</span>')]) +
            '<p class="nota" style="margin-top:8px">Cada aviso vem assinado; o painel confere a assinatura.</p>', 's6') +
          cartao(titulo('O que o painel usa', A.item([32, 33, 34, 35, 36])) + '<div class="funcoes">' +
            funcao('Envio de mensagens', 'o painel pede e a RXSync envia pelo WhatsApp da clínica', A.item(32), true) +
            funcao('Consulta de paciente', 'dados do paciente pelo ID', A.item(33), true, true) +
            funcao('Agenda e configurações', 'é o que permite o painel único', A.item(34), true, true) +
            funcao('Números da equipe', 'mensagens da equipe não passam pelo atendimento', A.item(35), true) +
            funcao('Chave de acesso', 'chave própria da clínica, guardada só embaralhada', A.item(36), true, true) + '</div>', 's6') +
          cartao(titulo('Já funciona hoje e continua', A.item([12, 13, 16])) +
            '<p class="mudo" style="font-size:13.5px">A autoedição da RXSync continua existindo ' + A.item(12) + '; aqui o mesmo ajuste é feito no painel. As correções de segurança ' + A.item(13) + ' valem para tudo. O histórico do paciente fica todo ligado ao ID ' + A.item(16) + ' (veja a ficha).</p>', 's12') +
        '</div>';
    },

    // ===== CRM =====
    pacientes: function () {
      return cab('Pacientes', 'Todos que já falaram com a clínica. Um ID por paciente, do WhatsApp ao app.', A.item([67, 68, 69, 14])) +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div class="busca" style="flex:1">' + A.ic('pacientes') + 'Buscar por nome, telefone ou ID</div>' +
        '<div class="abas-tela">' + ['Todos', 'Novo contato', 'Agendado', 'Em tratamento', 'Inativo'].map(function (t, i) { return '<button type="button" data-acao="aba" class="' + (i ? '' : 'ativo') + '">' + t + '</button>'; }).join('') + '</div></div>' +
        '<div style="text-align:right">' + A.item(69) + '</div>' +
        cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Idade</th><th>Status ' + A.item(68) + '</th><th>Profissional</th><th>Último contato</th><th>Pagamento</th></tr>' +
          PACIENTES.map(function (p) {
            return '<tr class="clicavel" data-acao="abrir-ficha" data-v="' + p.id + '"><td><b>' + p.nome + '</b> <span class="idp">' + p.id + '</span></td><td>' + p.idade + '</td><td>' + st(p.status) + '</td><td>' + p.prof + '</td><td class="num">' + p.ultimo + '</td><td>' + (p.id === 'P-DEMO3' ? '<span class="status st-pe">em aberto</span> ' + A.item(89) : '<span class="fraco">em dia</span>') + '</td></tr>';
          }).join('') + '</table></div>') + '<p class="nota">Lista de contatos com a data do último contato ' + A.item(67) + '. Toque para abrir a ficha.</p>';
    },
    funil: function () {
      return cab('Funil', 'Arraste o cartão para outra coluna (ou toque no cartão e depois na coluna).', A.item([68, 67])) +
        (E.selCartao ? '<div class="dica">' + A.ic('seta') + 'Toque na coluna de destino para mover ' + pac(E.selCartao).nome + '.</div>' : '') +
        '<div class="rolar-x"><div class="funil" id="funil">' + FUNIL.map(function (col) {
          var l = PACIENTES.filter(function (p) { return p.status === col; });
          return '<div class="coluna" data-coluna="' + col + '"><h3>' + col + '<span class="num fraco">' + l.length + '</span></h3>' +
            l.map(function (p) {
              return '<div class="ficha-cartao' + (E.selCartao === p.id ? ' sel' : '') + '" data-cartao="' + p.id + '"><b>' + p.nome + '</b><small>' + p.id + ' · ' + (p.prof === '—' ? 'sem profissional' : p.prof) + '</small>' +
                (p.alerta ? '<span class="status st-al" style="justify-self:start">' + p.alerta + '</span>' : '') + '</div>';
            }).join('') + '</div>';
        }).join('') + '</div></div>';
    },
    casos: function () {
      var c = [['Nutrição', 'Rodrigo Alves', 'P-DEMO4', 'Posso trocar o arroz por batata-doce?', 'Felipe', '18 min', 'st-in', 'aberto'], ['Enfermagem', 'Carlos Menezes', 'P-DEMO5', 'Náusea forte depois da aplicação', 'Thaís', '2 h 10', 'st-pe', 'atrasado · subiu para o Dr. André'],
        ['Financeiro', 'Paula Freitas', 'P-DEMO3', 'Segunda via do boleto', 'Emanuele', '35 min', 'st-in', 'aberto'], ['Médico', 'Renata Costa', 'P-DEM12', 'Perdi 2,4 kg em uma semana, é normal?', 'Dr. André', '1 h', 'st-al', 'aguardando'],
        ['Nutrição', 'Sofia Martins', 'P-DEM11', 'Plano para quem trabalha à noite', 'Felipe', '—', 'st-ok', 'respondido']];
      return cab('Casos por área', 'O que a IA não resolve vai para a pessoa certa, com o nome e o ID do paciente.', A.item([57, 58, 59, 60, 61, 62])) +
        '<div class="casos" style="grid-template-columns:repeat(4,1fr)">' + caso('Nutrição', 2, '1 respondido') + caso('Enfermagem', 1, '1 atrasado', 'var(--perigo)') + caso('Financeiro', 1, 'Emanuele') + caso('Médico', 1, 'Dr. André') + '</div>' +
        cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Área ' + A.item(57) + '</th><th>Paciente ' + A.item(59) + '</th><th>Pergunta</th><th>Com ' + A.item(58) + '</th><th>Tempo</th><th>Situação ' + A.item(61) + '</th></tr>' +
          c.map(function (x) { return '<tr><td>' + x[0] + '</td><td><b>' + x[1] + '</b> <span class="idp">' + x[2] + '</span></td><td class="mudo">"' + x[3] + '"</td><td>' + x[4] + '</td><td class="num">' + x[5] + '</td><td><span class="status ' + x[6] + '">' + x[7] + '</span></td></tr>'; }).join('') + '</table></div>') +
        cartao(titulo('Como a resposta chega ao paciente', A.item(60)) +
          '<div class="msg ela" style="max-width:520px"><blockquote>Posso trocar o arroz por batata-doce?</blockquote>"Pode sim, Rodrigo: 1 batata-doce média no lugar das 4 colheres de arroz."<small>Felipe · enviado pela clínica, entre aspas e sem alteração</small></div>' +
          '<p class="nota" style="margin-top:8px">A IA identifica a área ' + A.item(57) + ' (usa IA por consumo). Sem resposta no prazo, o caso sobe até o dono ' + A.item(61) + '.</p>');
    },
    conversas: function () {
      if (!E.chatEquipe) E.chatEquipe = [['ela', 'Oi, tudo bem? Queria saber se posso remarcar minha aplicação de quinta.', '09:58'], ['ia', 'Claro, Marina! Tenho quinta 10:30 ou sexta 08:00. Qual prefere?', '09:58']];
      return cab('Caixa de conversas', 'Todas as conversas da clínica dentro do painel. A equipe assume no lugar da IA e devolve quando terminar.', A.item([84, 85, 86])) +
        '<div class="duas">' +
          cartao(titulo('Conversas', A.item(84)) + lista([
            lin('<span class="pessoa" style="background:var(--c1)">ML</span>', '<b>Marina Lopes</b> <span class="idp">P-DEMO7</span><div class="fraco" style="font-size:12px">remarcar aplicação · IA atendendo</div>', '<span class="status st-in">IA</span>'),
            lin('<span class="pessoa" style="background:var(--c3)">CM</span>', '<b>Carlos Menezes</b> <span class="idp">P-DEMO5</span><div class="fraco" style="font-size:12px">náusea · Thaís assumiu</div>', '<span class="status st-al">equipe</span>'),
            lin('<span class="pessoa" style="background:var(--c2)">JP</span>', '<b>Juliana Prado</b> <span class="idp">P-DEMO6</span><div class="fraco" style="font-size:12px">preços · IA atendendo</div>', '<span class="status st-in">IA</span>')])) +
          cartao(titulo('Marina Lopes · P-DEMO7', A.item([85, 86])) +
            '<div class="chat" id="chat-caixa">' + E.chatEquipe.map(function (m) {
              return '<div class="msg ' + (m[0] === 'ela' ? 'ela' : 'eu') + '">' + m[1] + '<small>' + (m[0] === 'ia' ? 'IA' : m[0] === 'eq' ? 'Equipe' : 'Paciente') + ' · ' + m[2] + '</small></div>';
            }).join('') + '</div>' +
            '<div class="acoes" style="margin:12px 0;display:flex;gap:8px;flex-wrap:wrap"><button class="botao" type="button" data-acao="aviso" data-msg="Você assumiu a conversa. A IA fica em pausa.">Assumir</button><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Conversa devolvida para a IA.">Devolver à IA</button></div>' +
            '<div class="digitar"><input class="campo" id="msg-caixa" placeholder="Responder como equipe" autocomplete="off"><button class="botao" type="button" data-acao="enviar-caixa" aria-label="Enviar">' + A.ic('enviar') + '</button></div>' +
            '<p class="nota" style="margin-top:8px">A conversa fica na ficha do paciente ' + A.item(86) + '.</p>') +
        '</div>';
    },

    // ===== ERP =====
    agenda: function () {
      var evs = E.eventos.filter(function (e) { return !E.filtroProf || e.prof === E.filtroProf; });
      var cel = '<div></div>' + DIAS.map(function (d, i) { return '<div class="cab-dia">' + d + (i === 0 ? ' <span class="status st-pe" style="font-size:10px">feriado</span>' : '') + '</div>'; }).join('');
      HORAS.forEach(function (hh, s) {
        cel += '<div class="hora">' + hh + '</div>';
        for (var d = 0; d < 5; d++) {
          var ev = evs.filter(function (e) { return e.dia === d && e.slot === s; })[0];
          cel += '<div class="vaga' + (d === 0 ? ' bloq' : '') + '" data-dia="' + d + '" data-slot="' + s + '">' +
            (ev ? '<div class="evento' + (E.selEvento === ev.id ? ' sel' : '') + '" data-evento="' + ev.id + '" style="--cor:' + corProf(ev.prof) + '"><b>' + ev.pac + '</b><span>' + ev.tipo.split(' · ')[0] + ' · ' + ev.prof + '</span></div>' : '') + '</div>';
        }
      });
      return cab('Agenda', 'Semana de 12 a 16 de outubro. Toque num horário livre para marcar; arraste uma consulta (ou toque nela e depois no horário novo) para mover.', A.item([50, 51, 52, 79, 8])) +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">' +
          '<div class="abas-tela"><button type="button" data-acao="filtro" data-v="" class="' + (E.filtroProf ? '' : 'ativo') + '">Todos</button>' + PROFS.map(function (p) { return '<button type="button" data-acao="filtro" data-v="' + p[0] + '" class="' + (E.filtroProf === p[0] ? 'ativo' : '') + '"><span class="ponto" style="background:' + p[1] + ';margin-right:6px"></span>' + p[0] + '</button>'; }).join('') + '</div>' +
          '<div style="display:flex;gap:8px"><button class="botao botao-claro" type="button" data-acao="melhor">' + A.ic('ia') + 'Melhor horário ' + A.item(79) + '</button><button class="botao" type="button" data-acao="nova">' + A.ic('mais') + 'Marcar</button></div>' +
        '</div>' +
        (E.selEvento ? '<div class="dica">' + A.ic('seta') + 'Toque no horário novo para mover ' + E.eventos.filter(function (e) { return e.id === E.selEvento; })[0].pac + ' · <button type="button" data-acao="cancelar-sel" style="text-decoration:underline">cancelar</button></div>' : '') +
        '<div class="rolar-x"><div class="agenda-semana" id="agenda-semana">' + cel + '</div></div>' +
        '<p class="nota">Visão por semana e por médico ' + A.item(50) + '. A secretária marca, remarca e cancela na mesma agenda que a IA usa ' + A.item(51) + '. Segunda, 12/10, bloqueada pelo feriado ' + A.item(8) + '.</p>';
    },
    ficha: function () {
      var p = pac(E.paciente), aba = E.abaFicha;
      var abas = [['resumo', 'Resumo'], ['ficha', 'Ficha'], ['app', 'Registros do app'], ['consultas', 'Consultas'], ['exames', 'Exames'], ['conversas', 'Conversas'], ['balanca', 'Balança'], ['pdf', 'PDF da ficha']];
      var corpo = {
        resumo: function () {
          return '<div class="grade">' +
            cartao(titulo('Antes da consulta', A.item(71) + A.item(66)) + '<p style="font-size:14px">Desde a última consulta (22/09): <b>−1,6 kg</b>, adesão de ' + p.adesao + '%, 3 aplicações registradas, 1 enjoo leve (01/10), humor estável. Água abaixo da meta em 4 dias. <span class="fraco">(resumo simulado)</span></p>', 's8') +
            cartao(titulo('Situação', A.item([68, 89])) + '<div style="display:grid;gap:8px">' + st(p.status) + '<span class="chip">' + p.fase + '</span><span class="fraco" style="font-size:12.5px">Pagamento em dia</span></div>', 's4') +
            '</div>';
        },
        ficha: function () {
          return '<div class="grade">' + cartao(titulo('Campos da ficha', A.item([63, 64])) +
            '<div class="lista">' + [['Anamnese', 'Busca perda de peso; histórico de efeito sanfona; sem cirurgias.'], ['Histórico', 'Hipotireoidismo controlado (exemplo).'], ['Evolução', '22/09: boa adaptação; enjoo leve na 2ª semana.'], ['Conduta', 'Mantém o plano; retorno em 4 semanas.']].map(function (x) { return lin('', '<span class="rotulo">' + x[0] + '</span><div style="margin-top:2px">' + x[1] + '</div>'); }).join('') + '</div>' +
            '<p class="nota" style="margin-top:8px">O médico escolhe quais campos usa ' + A.item(64) + '. A ficha nasce sozinha pelo ID no primeiro contato ' + A.item(63) + '.</p>', 's8') +
            cartao(titulo('Versões', A.item(65)) + '<div class="lista">' + lin('', '<b>v4</b> · 22/09 · Dr. André') + lin('', '<b>v3</b> · 01/09 · Dr. André') + lin('', '<b>v2</b> · 01/09 · Elenice') + lin('', '<b>v1</b> · 28/08 · criada pela IA') + '</div><p class="nota" style="margin-top:8px">Nada é apagado.</p>', 's4') +
            cartao(titulo('Importação do histórico', A.item(70)) + '<p class="mudo" style="font-size:13.5px">Os dados do prontuário atual podem ser trazidos para cá, se a clínica quiser.</p>', 's12') + '</div>';
        },
        app: function () {
          return cartao(titulo('Registros do app (últimos 7 dias)', A.item(134)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Dia</th><th>Calorias</th><th>Proteína</th><th>Água</th><th>Sono</th><th>Humor</th><th>Sintomas</th></tr>' +
            [['13/10', '1.240', '82 g', '1,6 L', '7h10', '—', '—'], ['12/10', '1.580', '104 g', '2,4 L', '6h50', 'Bem', '—'], ['11/10', '1.420', '96 g', '2,1 L', '7h30', 'Ok', '—'], ['10/10', '1.690', '88 g', '1,8 L', '6h20', 'Bem', '—'], ['09/10', '1.350', '110 g', '2,6 L', '7h40', 'Ótimo', 'enjoo leve']].map(function (r) { return '<tr><td class="num">' + r.join('</td><td class="num">') + '</td></tr>'; }).join('') + '</table></div>');
        },
        consultas: function () {
          return cartao(titulo('Consultas', A.item([16, 130])) + '<div class="lista">' + lin('<span class="num">20/10</span>', '<b>Retorno · Dr. André</b>', '<span class="status st-in">marcada</span>') +
(['P-DEMO3', 'P-DEM12'].indexOf(p.id) >= 0 ? lin('<span class="num">11/10</span>', 'Psicologia · Maria Clara' + (QUEM === 'mariaclara' ? '<div class="mudo" style="font-size:12.5px">Anotações no <a href="#mc-prontuario">prontuário de psicologia</a> (só você vê).</div>' : '<div class="fraco" style="font-size:12.5px">' + A.ic('cadeado') + ' Sessão realizada · conteúdo restrito à psicóloga</div>'), A.item(172)) : '') + lin('<span class="num">22/09</span>', 'Retorno · Dr. André', '<span class="status st-ok">realizada</span>') + lin('<span class="num">15/09</span>', 'Nutrição · Felipe', '<span class="status st-ok">realizada</span>') + lin('<span class="num">01/09</span>', 'Primeira consulta · Dr. André', '<span class="status st-ok">realizada</span>') + '</div><p class="nota" style="margin-top:8px">Inclusive as importadas do Reservio, todas ligadas ao ID ' + A.item(16) + '.</p>');
        },
        exames: function () {
          return cartao(titulo('Exames e anexos', A.item([64, 136])) + '<div class="lista">' + lin(A.bolha('documento', 'var(--c3)'), '<b>Hemograma · 05/10</b><div class="fraco" style="font-size:12px">enviado pela paciente no app ' + A.item(136) + '</div>') + lin(A.bolha('documento', 'var(--c3)'), '<b>Pedido de exame · 28/08</b><div class="fraco" style="font-size:12px">lido pela IA no WhatsApp ' + A.item(3) + '</div>') + '</div>');
        },
        conversas: function () {
          return cartao(titulo('Conversas', A.item([86, 66])) + '<div class="lista">' + lin('<span class="num">09:58</span>', 'Pediu para remarcar a aplicação · IA') + lin('<span class="num">seg</span>', 'Enjoo depois da aplicação · <b>Thaís</b> respondeu (citado)') + lin('<span class="num">22/09</span>', 'Pré-consulta respondida') + '</div>');
        },
        balanca: function () {
          return '<div class="grade">' + cartao(titulo('Balança Anovator', A.item([72, 73])) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Data</th><th>Peso</th><th>Gordura</th><th>Músculo</th><th>Água</th><th>Visceral</th></tr>' +
            [['13/10', '78,6', '35,4%', '27,3', '48,1%', '9'], ['22/09', '80,2', '36,9%', '27,1', '47,6%', '10'], ['01/09', '84,0', '38,2%', '26,8', '47,0%', '11']].map(function (r) { return '<tr><td class="num">' + r.join('</td><td class="num">') + '</td></tr>'; }).join('') + '</table></div>' +
            '<p class="nota" style="margin-top:8px">Entra sem digitação ' + A.item(72) + '. Gráfico da evolução ' + A.item(73) + ': peso de 84,0 para 78,6 kg.</p>', 's12') + '</div>';
        },
        pdf: function () {
          return '<div class="grade">' + cartao(titulo('PDF da ficha', A.item([74, 75, 76])) +
            '<div class="funcoes">' + funcao('Anamnese e evolução', 'vai para a paciente', A.item(76), true) + funcao('Medidas da balança', 'anexadas pela API da Anovator', A.item(74), true) + funcao('Conduta', 'só no PDF do médico', A.item(76), false) + '</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="PDF de exemplo gerado com a marca da clínica.">' + A.ic('documento') + 'Gerar PDF</button><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="O PDF chega à paciente pelo WhatsApp depois da consulta (simulado).">' + A.ic('whatsapp') + 'Enviar pelo WhatsApp ' + A.item(75) + '</button></div>', 's12') + '</div>';
        }
      };
      return cab(p.nome, p.id + ' · ' + p.idade + ' anos · ' + p.fase + ' · ' + p.prof, A.item([63, 16, 134])) +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><select class="campo" style="max-width:280px" data-acao="trocar-paciente">' + PACIENTES.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + x.nome + ' · ' + x.id + '</option>'; }).join('') + '</select></div>' +
        '<div class="abas-tela">' + abas.map(function (a) { return '<button type="button" data-acao="aba-ficha" data-v="' + a[0] + '" class="' + (aba === a[0] ? 'ativo' : '') + '">' + a[1] + '</button>'; }).join('') + '</div>' + corpo[aba]();
    },
    financeiro: function () {
      return cab('Financeiro e estoque', 'Cobranças, lembretes, inadimplência, aplicações na clínica e frascos. Valores de exemplo.', A.item([87, 88, 89, 90, 91])) +
        '<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + kpi('Recebido no mês', 'R$ 48.250', '+12% vs. setembro', 'sobe') + kpi('A receber', 'R$ 9.100', '14 cobranças', '') + kpi('Em atraso', 'R$ 1.300', '2 pacientes', 'desce') + kpi('Frascos', '4', 'mínimo 6', 'desce') + '</div>' +
        '<div class="grade">' +
          cartao(titulo('Cobranças', A.item([87, 88])) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>O quê</th><th>Valor</th><th>Vence</th><th>Situação</th></tr>' +
            '<tr><td><b>Marina Lopes</b></td><td>Programa · 2/3</td><td class="num">R$ 650</td><td class="num">20/10</td><td><span class="status st-in">lembrete enviado</span></td></tr>' +
            '<tr><td><b>Paula Freitas</b></td><td>Psicologia</td><td class="num">R$ 650</td><td class="num">05/10</td><td><span class="status st-pe">em atraso</span></td></tr>' +
            '<tr><td><b>Fernando Lima</b></td><td>Retorno</td><td class="num">R$ 650</td><td class="num">28/09</td><td><span class="status st-pe">em atraso</span></td></tr>' +
            '<tr><td><b>Beatriz Nogueira</b></td><td>Programa · 3/3</td><td class="num">R$ 650</td><td class="num">10/10</td><td><span class="status st-ok">pago · Pix</span></td></tr></table></div>' +
            '<p class="nota" style="margin-top:8px">Link de Pix ou cartão pelo WhatsApp ' + A.item(87) + '; aviso antes e depois do vencimento ' + A.item(88) + '; quem está em aberto aparece também no CRM ' + A.item(89) + '.</p>', 's7') +
          cartao(titulo('Aplicações e estoque', A.item([90, 91])) + lista([
            lin('<span class="num">10:30</span>', '<b>Marina Lopes</b> · aplicação na clínica · Thaís', '<span class="status st-ok">registrada</span>'),
            lin('<span class="num">08:30</span>', '<b>Carlos Menezes</b> · complexo vitamínico · Eduarda', '<span class="status st-ok">registrada</span>')]) +
            '<div class="alerta-lin" style="--cor:var(--alerta);margin-top:10px">' + A.bolha('alerta', 'var(--alerta)') + '<div><b>Estoque baixo: 4 frascos</b><div class="fraco" style="font-size:12.5px">entrada: 20 em 01/10 · saída: 16</div></div></div>', 's5') +
        '</div>';
    },
    'ia-equipe': function () {
      if (!E.chatIA) E.chatIA = [['eu', 'Quem faltou esta semana?'], ['ela', 'Duas faltas: Fernando Lima (P-DEMO8) na segunda e Rodrigo Alves (P-DEMO4) na quarta. Quer que eu ofereça horários para eles?']];
      return cab('IA da equipe e manual', 'Uma IA para a equipe dentro do painel: pergunta, ação por pedido e ajuda de uso. Respostas simuladas.', A.item([77, 78, 79, 80, 81, 82, 83, 149])) +
        '<div class="duas">' +
          cartao(titulo('Chat da equipe', A.item([77, 78, 80])) +
            '<div class="chat" id="chat-ia">' + E.chatIA.map(function (m) { return '<div class="msg ' + m[0] + '">' + m[1] + '</div>'; }).join('') + '</div>' +
            '<div class="opcoes" style="margin:12px 0">' + ['Marca a Maria na quinta às 10h', 'Qual o melhor horário para a Sofia?', 'Como faço para gerar o PDF da ficha?'].map(function (t) { return '<button type="button" data-acao="pergunta-ia" data-v="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
            '<div class="digitar"><input class="campo" id="pergunta-ia" placeholder="Pergunte à IA da equipe" autocomplete="off"><button class="botao" type="button" data-acao="pergunta-ia-campo" aria-label="Enviar">' + A.ic('enviar') + '</button></div>') +
          '<div class="pilha">' +
            cartao(titulo('Manual de uso', A.item([81, 82])) + lista(['Como marcar e mover consultas', 'Como ler a Visão do médico', 'Como montar o plano alimentar', 'Como cadastrar a prescrição da picadinha'].map(function (t) { return lin(A.bolha('revista', 'var(--c2)'), t, A.ic('seta', 'fraco')); })) + '<p class="nota" style="margin-top:8px">Sempre atualizado a cada versão. Dúvidas de uso são respondidas pelo chat ' + A.item(82) + '.</p>') +
            cartao(titulo('Primeiro acesso e treinamento', A.item([83, 149])) + '<p class="mudo" style="font-size:13.5px">Tutorial curto na primeira entrada de cada pessoa ' + A.item(83) + '. Treinamento da equipe com o manual, incluído no Projeto 2 ' + A.item(149) + '.</p>' +
              '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">' + Object.keys(EQUIPE).map(function (k, i) { return '<span class="chip" style="padding:4px 9px">' + EQUIPE[k].nome.split(' ')[0] + (i < 5 ? ' ✓' : ' · pendente') + '</span>'; }).join('') + '</div>') +
          '</div></div>';
    },
    config: function () {
      return cab('Configurações', 'Tudo o que a IA e o app usam, ajustado aqui, sem a autoedição.', A.item([52, 53, 54, 55])) +
        '<div class="grade">' +
          cartao(titulo('Liga e desliga de tudo', A.item(54)) + '<div class="funcoes">' +
            funcao('IA marca consultas', 'por clínica e por médico', A.item(4), true) + funcao('IA encaminha para a equipe', '', A.item(58), true) +
            funcao('Responder sobre preços', '', A.item(2), true) + funcao('Picadinha no app', 'liga junto a instrução conferida', A.item([124, 125]), true) +
            funcao('Foto do prato (IA por consumo)', '', A.item(107), true) + funcao('Comunidade', 'versão completa', A.item(139), false) +
            funcao('Assistente de saúde do paciente', 'depende do parecer jurídico', A.item([143, 144]), false) + funcao('Registro de acessos', '', A.item(45), true, true) + '</div>', 's6') +
          '<div class="s6 pilha">' +
            cartao(titulo('Setores e equipe', A.item(53)) + lista(Object.keys(EQUIPE).map(function (k) { var p = EQUIPE[k]; return lin(pessoa(p), '<b>' + p.nome + '</b><div class="fraco" style="font-size:12px">' + p.papel + ' · WhatsApp cadastrado</div>'); }))) +
            cartao(titulo('Médicos, consultas, empilhamento e pré-consulta', A.item(52)) + '<p class="mudo" style="font-size:13.5px">Os mesmos ajustes da <a href="#agenda-ia">Agenda da IA</a>, agora no painel.</p>') +
            cartao(titulo('Informações da clínica', A.item(55)) + '<p class="mudo" style="font-size:13.5px">Preços, procedimentos e respostas que a IA usa. Ex.: "Primeira consulta: R$ 450 (exemplo)".</p>') +
          '</div></div>';
    },

    // ===== App do paciente (gestão pelo painel) =====
    app: function () {
      return cab('Prescrições e conteúdo do app', 'O que a equipe cadastra no painel e o paciente vê no app.', A.item([124, 125, 112, 113, 131, 133, 129, 92])) +
        '<div class="grade">' +
          cartao(titulo('Picadinha: prescrição', A.item([124, 125])) +
            '<div class="lista">' + lin('', '<span class="rotulo">Paciente</span><div><b>Marina Lopes</b> · P-DEMO7</div>') + lin('', '<span class="rotulo">Medicação</span><div>Medicação semanal (exemplo) · quinta 08:00</div>') +
            lin('', '<span class="rotulo">Instrução conferida</span><div class="num">10 unidades · 0,10 ml</div>', '<span class="status st-ok">conferida por Thaís</span>') + '</div>' +
            '<p class="nota" style="margin-top:8px">A clínica digita unidades e ml já conferidos. <b>O sistema não calcula dose.</b></p>', 's6') +
          cartao(titulo('Sintomas que avisam a enfermagem', A.item(129)) + '<div class="opcoes">' + ['Vômito', 'Náusea forte', 'Dor abdominal forte', 'Tontura', 'Sangue nas fezes'].map(function (t) { return '<button type="button" class="sel" data-acao="marca">' + t + '</button>'; }).join('') + ['Enjoo leve', 'Azia'].map(function (t) { return '<button type="button" data-acao="marca">' + t + '</button>'; }).join('') + '</div>', 's6') +
          cartao(titulo('Metas e plano alimentar', A.item([112, 113])) + '<p class="mudo" style="font-size:13.5px">Felipe define 1.600 kcal e 110 g de proteína por dia e monta o cardápio com substituições. O paciente vê no app ao lado do diário.</p>', 's6') +
          cartao(titulo('Avisos e conteúdo', A.item([131, 133])) +
            '<div class="opcoes" style="margin-bottom:10px"><button type="button" class="sel" data-acao="marca">Um paciente</button><button type="button" data-acao="marca">Um grupo</button><button type="button" data-acao="marca">Todos</button></div>' +
            '<textarea class="campo" placeholder="Ex.: traga seus exames na próxima consulta"></textarea>' +
            '<button class="botao" type="button" style="margin-top:10px" data-acao="aviso" data-msg="Aviso enviado aos pacientes escolhidos (simulado).">Enviar aviso</button>', 's6') +
          cartao(titulo('Pacientes no app', A.item([92, 93, 94, 95, 100])) + '<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kpi('Contas criadas', '214', 'ao agendar', '') + kpi('Ativos', '186', '87%', 'sobe') + kpi('Instalaram', '151', 'na tela inicial', '') + '</div>' +
            '<p class="nota" style="margin-top:8px">Conta automática ao agendar ' + A.item(92) + ', link mágico ' + A.item(93) + ', instalável ' + A.item(94) + ', com a marca da clínica ' + A.item(95) + ' e funciona sem internet ' + A.item(100) + '.</p>', 's12') +
        '</div>';
    },

    // ===== Central do médico (novo) =====
    central: function () {
      var p = pac('P-DEMO9');
      var falas = [['Dr. André', 'Helena, o que te trouxe aqui hoje?'], ['Paciente', 'Quero perder uns 12 quilos. Já tentei várias dietas e sempre volto a ganhar.'], ['Dr. André', 'Usa algum remédio todos os dias?'], ['Paciente', 'Só o anticoncepcional.'], ['Dr. André', 'Vamos começar pelos exames e um plano com o Felipe.']];
      return cab('Central do médico', 'Consulta de hoje com pré-consulta, transcrição, arquivos e assistente. Tudo ligado ao ID do paciente.', A.item([165, 166, 167]) + A.item(71)) +
        cartao('<div class="linha-ic">' + '<span class="pessoa" style="background:var(--c3);width:46px;height:46px">HD</span><div class="meio"><h3 style="font-size:18px">' + p.nome + '</h3><div class="fraco" style="font-size:12.5px">' + p.id + ' · primeira consulta · 09:00</div></div><a class="botao botao-claro" href="#ficha" data-acao="abrir-ficha" data-v="' + p.id + '" style="text-decoration:none">Abrir ficha</a></div>') +
        '<div class="grade">' +
          cartao(titulo('Pré-consulta', A.item([71, 30])) + lista([['Objetivo', 'Perder 12 kg'], ['Cirurgias', 'Nenhuma'], ['Remédios diários', 'Anticoncepcional'], ['Peso informado', '84 kg']].map(function (x) { return lin('', '<span class="rotulo">' + x[0] + '</span><div>' + x[1] + '</div>'); })), 's4') +
          cartao(titulo('Transcrição da consulta', A.item(165) + '<span class="item">ligada ao ' + p.id + '</span>') +
            (E.gravando ? '<div class="gravando"><i></i>Gravando · 04:12</div>' : '') +
            (E.transcrita || E.gravando ? '<div class="transcricao" style="margin-top:8px">' + falas.map(function (f) { return '<p><b>' + f[0] + ':</b> ' + f[1] + '</p>'; }).join('') + '</div>' : '<p class="mudo" style="font-size:13.5px">Com o aceite da paciente, o áudio vira texto e vai para a ficha dela.</p>') +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="botao" type="button" data-acao="gravar">' + (E.gravando ? 'Parar e transcrever' : 'Começar a gravar') + '</button>' +
            (E.transcrita ? '<button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Resumo da consulta salvo na ficha como rascunho, para o Dr. André revisar.">Salvar resumo na ficha</button>' : '') + '</div>' +
            (E.transcrita ? '<div class="alerta-lin" style="--cor:var(--info);margin-top:12px">' + A.bolha('ia', 'var(--info)') + '<div><b>Resumo (rascunho para revisão)</b><p class="mudo" style="font-size:13px">Primeira consulta. Objetivo: −12 kg. Histórico de efeito sanfona. Usa anticoncepcional. Plano: exames e encaminhamento à nutrição. <span class="fraco">(simulado)</span></p></div></div>' : ''), 's8') +
          cartao(titulo('Arquivo com síntese da IA', A.item(166) + A.item(66)) +
            '<p class="mudo" style="font-size:13.5px">Envie um PDF ou foto (exame, laudo, relatório de outro profissional). A IA resume o que está escrito; a interpretação é do médico.</p>' +
            '<button class="botao botao-claro" type="button" style="margin-top:10px" data-acao="pdf">' + A.ic('documento') + 'Enviar arquivo (exemplo)</button>' +
            (E.pdf ? '<div class="alerta-lin" style="--cor:var(--info);margin-top:12px">' + A.bolha('documento', 'var(--info)') + '<div><b>hemograma_helena.pdf · síntese</b><p class="mudo" style="font-size:13px">Exame de 05/10. 18 itens. Valores fora da referência do laboratório: ferritina (baixa) e vitamina D (baixa). Os demais dentro da referência. <span class="fraco">(simulado; confira no documento)</span></p></div></div>' : ''), 's6') +
          cartao(titulo('Assistente clínico', A.item(167) + A.juridico('depende do parecer jurídico')) +
            '<p class="mudo" style="font-size:13.5px">Organiza a informação para o médico decidir. Não diagnostica e não prescreve.</p>' + lista([
              lin(A.bolha('ia', 'var(--c4)'), 'Pré-consulta sem informação de pressão arterial: medir hoje.'),
              lin(A.bolha('ia', 'var(--c4)'), 'Exame com ferritina e vitamina D abaixo da referência do laboratório.'),
              lin(A.bolha('ia', 'var(--c4)'), 'Protocolo da clínica para primeira consulta: pedir bioimpedância e marcar nutrição.')]), 's6') +
        '</div>';
    },

    // ===== Profissionais (novo · proposta) =====
    profissionais: function () {
      return cab('Painel de cada profissional', 'Cada pessoa abre o painel no que importa para a sua função. É uma proposta para conversar com a equipe.', A.item(168) + A.proposta()) +
        '<div class="grade">' + Object.keys(EQUIPE).map(function (k) {
          var p = EQUIPE[k];
          return '<a class="cartao s4" href="#prof-' + k + '" style="text-decoration:none;color:inherit"><div class="linha-ic">' + pessoa(p, 44) + '<div class="meio"><b>' + p.nome + '</b><div class="fraco" style="font-size:12.5px">' + p.papel + '</div></div>' + A.ic('seta', 'fraco') + '</div>' +
            '<p class="mudo" style="font-size:13px;margin-top:10px">' + PROF[k].resumo + '</p></a>';
        }).join('') + '</div>';
    },

    // ===== Base =====
    consumo: function () {
      var f = [['Foto do prato (app)', 1840000, 61.2, 107], ['Resumo pré-consulta', 920000, 38.4, 71], ['Transcrição de consulta', 610000, 34.9, 165], ['Chat da equipe', 540000, 27.1, 77], ['Identificação do assunto', 410000, 18.6, 57], ['Síntese de arquivos', 300000, 16.3, 166], ['Dicas do assistente (app)', 220000, 15.9, 144]];
      var max = 61.2, tot = f.reduce(function (s, x) { return s + x[2]; }, 0);
      var meses = [['jun', 96], ['jul', 128], ['ago', 154], ['set', 188], ['out*', 212.4]];
      return cab('Consumo de IA', 'Medido por função, por profissional e por paciente. Cobrado pós-pago com a mensalidade. Valores de exemplo.', A.item([145, 146, 147, 148])) +
        '<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + kpi('Gasto em outubro', 'R$ ' + tot.toFixed(2).replace('.', ','), 'até dia 13', '') + kpi('Teto do mês', 'R$ 400', 'avisos em 80% e 100%', '') + kpi('Tokens no mês', '4,84 mi', 'entrada + saída', '') + kpi('Previsão', 'R$ 489', 'acima do teto', 'desce') + '</div>' +
        '<div class="grade">' +
          cartao(titulo('Custo por função em outubro', A.item([145, 146])) + '<div class="barras">' + f.map(function (x) {
            return '<div class="lin"><span>' + x[0] + (x[3] ? ' ' + A.item(x[3]) : '') + '</span><span class="trilho"><i style="width:' + Math.round(x[2] / max * 100) + '%"></i></span><span class="val">R$ ' + x[2].toFixed(2).replace('.', ',') + '</span></div>';
          }).join('') + '</div>', 's7') +
          cartao(titulo('Tokens por função', A.item(145)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Função</th><th>Tokens</th></tr>' + f.map(function (x) { return '<tr><td>' + x[0] + '</td><td class="num">' + x[1].toLocaleString('pt-BR') + '</td></tr>'; }).join('') + '</table></div>', 's5') +
          cartao(titulo('Por mês', A.item(146)) + '<div class="barras">' + meses.map(function (m) { return '<div class="lin"><span>' + m[0] + '</span><span class="trilho"><i style="width:' + Math.round(m[1] / 400 * 100) + '%;' + (m[0] === 'out*' ? '' : 'opacity:.55') + '"></i></span><span class="val">R$ ' + m[1].toFixed(2).replace('.', ',') + '</span></div>'; }).join('') + '</div><p class="nota" style="margin-top:8px">* outubro até o dia 13. A barra cheia é o teto de R$ 400.</p>', 's6') +
          cartao(titulo('Teto e avisos', A.item([147, 148])) + '<div class="funcoes">' + funcao('Avisar em 80% do teto', 'para Emanuele e Dr. André', A.item(147), true) + funcao('Avisar em 100%', '', A.item(147), true) + funcao('Ao atingir o teto, pausar as funções de IA cobradas à parte', 'desligado = continuam e entram na próxima fatura', A.item(147), false) + '</div>' +
            '<p class="nota" style="margin-top:8px">O consumo do mês é somado e cobrado junto da mensalidade, com o detalhe por função ' + A.item(148) + '.</p>', 's6') +
        '</div>';
    },
    seguranca: function () {
      var l = [[41, 'Servidor e banco dedicados', 'ambiente só da Clínica Evoluir'], [42, 'Backup diário', 'último: hoje 03:10 · ok'], [43, 'Login da equipe', 'link no e-mail, sem senha'], [44, 'Perfis de acesso', 'médico, secretária, nutrição, enfermagem, financeiro'],
        [45, 'Registro de acessos', 'quem abriu ou alterou, e quando'], [46, 'Monitoramento de erros', 'nenhum erro nas últimas 24 h'], [47, 'Ambiente de testes', 'cada mudança é testada antes'], [48, 'Registro das respostas da IA', 'para revisão e auditoria (CFM 2.454/2026)'], [49, 'Exportação total dos dados', 'os dados são da clínica']];
      return cab('Segurança e dados', 'A base que sustenta tudo. Sempre ligada.', A.item([41, 42, 43, 44, 45, 46, 47, 48, 49, 13])) +
        '<div class="grade">' +
          cartao('<div class="funcoes">' + l.map(function (x) { return funcao(x[1], x[2], A.item(x[0]), true, true); }).join('') + '</div>', 's6') +
          '<div class="s6 pilha">' +
            cartao(titulo('Registro de acessos (hoje)', A.item(45)) + lista([lin('<span class="num">09:14</span>', '<b>Dr. André</b> abriu a ficha de Helena Duarte'), lin('<span class="num">08:52</span>', '<b>Thaís</b> registrou aplicação de Marina Lopes'), lin('<span class="num">08:31</span>', '<b>Elenice</b> remarcou Fernando Lima'), lin('<span class="num">08:02</span>', '<b>Emanuele</b> exportou o financeiro de setembro')])) +
            cartao(titulo('Exportar tudo', A.item(49)) + '<button class="botao" type="button" data-acao="aviso" data-msg="Exportação de exemplo iniciada: o arquivo chega no e-mail do responsável.">' + A.ic('download') + 'Baixar todos os dados</button>') +
          '</div></div>';
    }
  };

  // ---------- painel de cada profissional (proposta, baseada nas rotinas de clínicas de emagrecimento) ----------
  var PROF = {
    andre: { resumo: 'Consultas do dia com pré-consulta, alertas clínicos, evolução de cada paciente e pendências.', blocos: [
      ['Consultas de hoje', 'agenda do Dr. André com o resumo pré-consulta de cada um', '6', 71], ['Alertas clínicos', 'sintoma forte, perda rápida de peso, retorno vencido', '3', 135],
      ['Receitas e laudos pendentes', 'documentos para assinar', '2', 0], ['Adesão da carteira', 'média de registros no app dos seus pacientes', '78%', 134], ['Transcrições a revisar', 'rascunhos da central do médico', '1', 0]] },
    emanuele: { resumo: 'Faturamento, contas a receber, inadimplência, consumo de IA e estoque em valor.', blocos: [
      ['Recebido no mês', 'Pix, cartão e boleto', 'R$ 48.250', 87], ['A receber em 7 dias', '9 cobranças com lembrete agendado', 'R$ 5.850', 88],
      ['Em atraso', 'pacientes com pagamento em aberto', '2', 89], ['Consumo de IA', 'do teto mensal', '53%', 146], ['Estoque em valor', 'frascos e materiais', 'R$ 3.120', 91]] },
    felipe: { resumo: 'Pacientes em nutrição, adesão ao diário, proteína média e quem parou de registrar.', blocos: [
      ['Em acompanhamento', 'pacientes com plano alimentar ativo', '42', 113], ['Registraram hoje', 'pelo menos uma refeição', '31', 106],
      ['Proteína média', 'da meta, na semana', '84%', 112], ['Sem registrar há 3 dias', 'para mandar uma mensagem', '5', 135], ['Planos a vencer', 'nos próximos 7 dias', '4', 113]] },
    mariaclara: { resumo: 'Humor da semana, notas que pedem atenção, fome emocional e sessões.', blocos: [
      ['Sessões hoje', 'presenciais e on-line', '4', 0], ['Humor baixo', '3 dias seguidos ou mais', '2', 117],
      ['Notas sinalizadas', 'notas de humor que pedem atenção', '1', 117], ['Fome emocional', 'fome alta fora das refeições', '3', 0], ['Questionários do mês', 'respondidos pelos pacientes (proposta: escalas validadas)', '12', 0]] },
    eduarda: { resumo: 'Aplicações e bioimpedâncias do dia, preparo de sala e frascos.', blocos: [
      ['Aplicações hoje', 'na clínica', '5', 90], ['Bioimpedâncias hoje', 'balança Anovator', '3', 72],
      ['Frascos', 'mínimo 6', '4', 91], ['Sinais vitais a medir', 'primeiras consultas', '2', 0], ['Materiais a repor', 'seringas e algodão', '2', 0]] },
    thais: { resumo: 'Alertas de sintomas, instruções a conferir, rodízio e casos de enfermagem.', blocos: [
      ['Alertas de sintomas', 'avisados pelo app', '2', 129], ['Instruções a conferir', 'prescrições novas da picadinha', '1', 125],
      ['Casos de enfermagem', 'abertos', '2', 62], ['Rodízio fora do padrão', 'mesmo local duas vezes', '1', 127], ['Aplicações da semana', 'registradas no app', '64', 124]] },
    elenice: { resumo: 'Chegadas do dia, confirmações, boas-vindas, encaixes e avaliações.', blocos: [
      ['Chegadas hoje', '2 já na clínica', '14', 50], ['Sem confirmar', 'para ligar ou mandar mensagem', '3', 6],
      ['Primeiras consultas', 'para dar boas-vindas', '2', 63], ['Fila de espera', 'para encaixes', '3', 7], ['Avaliações da semana', 'pesquisa e Google', '11', 39]] }
  };
  Object.keys(PROF).forEach(function (k) {
    TELAS['prof-' + k] = function () {
      var p = EQUIPE[k], d = PROF[k];
      return '<div class="cabeca"><div class="linha-ic">' + pessoa(p, 52) + '<div><h1>' + p.nome + '</h1><p class="sub">' + p.papel + ' · ' + d.resumo + '</p><div class="itens">' + A.item(168) + A.proposta() + '</div></div></div></div>' +
        '<div class="kpis">' + d.blocos.map(function (b) { return kpi(b[0], b[2], b[1], ''); }).join('') + '</div>' +
        '<div class="itens">' + d.blocos.map(function (b) { return b[3] ? A.item(b[3]) : ''; }).join('') + '</div>' +
        cartao(titulo('Por que estes números', A.proposta()) + '<p class="mudo" style="font-size:13.5px">Proposta a partir das rotinas mais comuns de cada função numa clínica de emagrecimento com acompanhamento multiprofissional. Na reunião, cada pessoa da equipe pode trocar, tirar ou incluir o que acompanha no dia a dia.</p>') +
        '<div class="abas-tela">' + Object.keys(EQUIPE).map(function (x) { return '<a href="#prof-' + x + '" class="' + (x === k ? 'ativo' : '') + '">' + EQUIPE[x].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André') + '</a>'; }).join('') + '</div>';
    };
  });

  // ---------- quem entrou (item 169): painel/?quem=andre|emanuele|felipe|mariaclara|eduarda|thais|elenice ----------
  // O Dr. André vê tudo. Cada outra pessoa vê o próprio painel e o que é da função dela.
  var QUEM = (function () { var q = new URLSearchParams(location.search).get('quem'); return Object.prototype.hasOwnProperty.call(EQUIPE, q) ? q : 'andre'; })();
  var MENU_FUNCAO = {
    emanuele: ['financeiro', 'pacientes', 'funil', 'casos', 'conversas', 'agenda', 'consumo', 'seguranca'],
    felipe: ['pacientes', 'agenda', 'ficha', 'app', 'casos', 'conversas'],
    mariaclara: ['pacientes', 'agenda', 'ficha', 'casos', 'conversas'],
    eduarda: ['agenda', 'ficha', 'financeiro', 'app', 'casos'],
    thais: ['medico', 'agenda', 'ficha', 'app', 'casos', 'conversas'],
    elenice: ['agenda', 'pacientes', 'funil', 'conversas', 'atendimento', 'agenda-ia', 'relacionamento']
  };
  function telaInicial() { return QUEM === 'andre' ? 'dia' : 'prof-' + QUEM; }

  // Respostas da IA da equipe conforme a função (item 170). Regras de segurança valem para todos:
  // não calcula nem sugere dose, não diagnostica, não prescreve.
  var IA_FUNCAO = {
    andre: { sug: ['Quem pede atenção hoje?', 'Resumo pré-consulta da Helena', 'Qual o diagnóstico do Carlos?'], r: [
      [/aten|alerta|hoje/, 'Três pacientes pedem atenção: Carlos Menezes (náusea forte depois da aplicação), Renata Costa (−2,4 kg em 7 dias) e Rodrigo Alves (5 dias sem registrar).'],
      [/helena|pré|pre-/, 'Helena Duarte (P-DEMO9), primeira consulta às 09:00: objetivo −12 kg, sem cirurgias, usa anticoncepcional, peso informado 84 kg.']] },
    emanuele: { sug: ['Quem está em atraso?', 'Quanto recebemos no mês?', 'Como está o consumo de IA?'], r: [
      [/atras|aberto|devend/, 'Dois pacientes em atraso: Paula Freitas (R$ 650, venceu 05/10) e Fernando Lima (R$ 650, venceu 28/09). Quer que eu mande o lembrete de pagamento (item 88)?'],
      [/receb|fatur|mês|mes/, 'Recebido em outubro até hoje: R$ 48.250 (+12% em relação a setembro). A receber nos próximos 7 dias: R$ 5.850.'],
      [/consumo|ia|token/, 'Consumo de IA em outubro: R$ 212,40, 53% do teto de R$ 400. Previsão para o mês: R$ 489, acima do teto (item 147).']] },
    felipe: { sug: ['Quem não registrou o almoço?', 'Adesão dos meus pacientes', 'Rascunho de plano de 1.600 kcal'], r: [
      [/almo|registr/, 'Hoje, 11 dos seus 42 pacientes ainda não registraram o almoço. Os 3 há mais tempo sem registro: Rodrigo Alves, Ana Ribeiro e Sofia Martins.'],
      [/ades|meta|prote/, 'Na semana, seus pacientes cumpriram em média 84% da meta de proteína e registraram em 73% dos dias.'],
      [/plano|kcal|card/, 'Rascunho pronto a partir do seu modelo de 1.600 kcal (5 refeições, com substituições). Ele só vai para o paciente depois que você revisar.']] },
    mariaclara: { sug: ['Quem está com humor baixo?', 'Resumo da semana da Paula', 'Sessões de hoje'], r: [
      [/humor|baixo/, 'Humor baixo por 3 dias ou mais: Paula Freitas (P-DEMO3) e Renata Costa (P-DEM12). Uma nota de humor da Paula foi sinalizada ontem.'],
      [/paula|semana|resumo/, 'Paula Freitas, semana: humor "baixo" em 3 dias, fome alta à noite em 4 dias, 2 registros de sono abaixo de 6 h. É um resumo dos registros; a avaliação é sua.'],
      [/sess/, 'Hoje: 11:00 Paula Freitas (presencial) e 16:00 Sofia Martins (on-line).']] },
    eduarda: { sug: ['Aplicações de hoje', 'Bioimpedâncias marcadas', 'Como está o estoque?'], r: [
      [/aplic/, 'Aplicações de hoje na clínica: 10:30 Marina Lopes e 14:00 Carlos Menezes. Instruções já conferidas pela Thaís.'],
      [/bio|balan/, 'Bioimpedâncias de hoje: 08:30 Carlos Menezes e 09:00 Helena Duarte (primeira consulta). Os dados entram sozinhos na ficha (item 72).'],
      [/estoq|frasc/, 'Estoque: 4 frascos, abaixo do mínimo de 6. Entrada de 20 em 01/10, saída de 16 (item 91).']] },
    thais: { sug: ['Alertas de sintomas de hoje', 'Prescrições a conferir', 'Posso aumentar a dose do Carlos?'], r: [
      [/alert|sintom/, 'Dois alertas: Carlos Menezes relatou náusea forte 2 dias depois da aplicação (07:42) e Renata Costa perdeu 2,4 kg em 7 dias.'],
      [/confer|prescri/, 'Uma prescrição nova para conferir: Helena Duarte, cadastrada pelo Dr. André às 09:40. Ela só aparece no app depois da sua conferência (item 125).']] },
    elenice: { sug: ['Quem não confirmou?', 'Tem encaixe hoje à tarde?', 'Quem está na fila de espera?'], r: [
      [/confirm/, 'Sem confirmar para amanhã: Rodrigo Alves (10:00), Sofia Martins (14:00) e Fernando Lima (16:30). Quer que eu mande a mensagem de confirmação?'],
      [/encaix|livre|tarde/, 'Hoje à tarde há horários livres às 13:30, 15:00 e 16:00 com o Dr. André. A fila de espera tem 3 pessoas.'],
      [/fila|espera/, 'Fila de espera: Lucas Teixeira (manhãs), Juliana Prado (qualquer horário) e Ana Ribeiro (sexta). A IA oferece a vaga quando alguém cancela (item 7).']] }
  };
  function respostaFuncao(t) {
    var x = t.toLowerCase();
    if (/dose|unidade|aument|diminu|\bml\b/.test(x)) return ['Não calculo nem sugiro dose. A dose é a prescrita pelo Dr. André e conferida pela enfermagem (item 125).', 'regra de segurança'];
    if (/diagn|doen|prescrev|receit/.test(x)) return ['Não faço diagnóstico nem prescrevo. Posso reunir os dados do paciente (registros, exames e pré-consulta) para quem vai decidir.', 'regra de segurança'];
    var l = IA_FUNCAO[QUEM].r;
    for (var i = 0; i < l.length; i++) if (l[i][0].test(x)) return [l[i][1], 'simulado · ' + EQUIPE[QUEM].papel];
    return ['Anotei. Respondo sobre o que é da sua função (' + EQUIPE[QUEM].papel.toLowerCase() + '): pacientes, agenda e tarefas. Também faço ações por pedido.', 'simulado'];
  }

  // ---------- respostas simuladas da IA da equipe ----------
  function respostaEquipe(t) {
    t = t.toLowerCase();
    if (/marca|agend/.test(t)) return 'Pronto (simulado): marquei Maria na quinta, 15/10, às 10:00, com o Dr. André. Mando a confirmação pelo WhatsApp?';
    if (/melhor hor/.test(t)) return 'Para a Sofia, o melhor é quarta, 14/10, às 09:00: fica colado na consulta das 08:30 e respeita o tipo "Nutrição". ';
    if (/pdf|ficha/.test(t)) return 'Abra a ficha do paciente › aba "PDF da ficha" › escolha as partes › "Gerar PDF". Quer que eu abra para você?';
    return 'Anotei. Posso responder sobre pacientes, agenda e setores, ou fazer uma ação por você.';
  }

  // ---------- arrastar (dedo ou mouse) ----------
  // Arrastar move; um toque sem arrastar seleciona (depois, tocar no destino também move).
  function arrastavel(raiz, seletor, seletorAlvo, aoSoltar, aoTocar) {
    var ini = null, el = null, fantasma = null, alvo = null;
    raiz.addEventListener('pointerdown', function (ev) {
      el = ev.target.closest(seletor); if (!el) return;
      ini = { x: ev.clientX, y: ev.clientY }; fantasma = null; alvo = null;
      el.setPointerCapture && el.setPointerCapture(ev.pointerId);
    });
    raiz.addEventListener('pointermove', function (ev) {
      if (!el || !ini) return;
      if (!fantasma && Math.abs(ev.clientX - ini.x) + Math.abs(ev.clientY - ini.y) < 8) return;
      if (!fantasma) { fantasma = el.cloneNode(true); fantasma.classList.add('fantasma'); fantasma.classList.remove('sel'); document.body.appendChild(fantasma); el.classList.add('arrastando'); }
      fantasma.style.left = (ev.clientX - 20) + 'px'; fantasma.style.top = (ev.clientY - 18) + 'px';
      fantasma.style.display = 'none';
      var sob = document.elementFromPoint(ev.clientX, ev.clientY); fantasma.style.display = '';
      var novo = sob && sob.closest(seletorAlvo);
      if (alvo !== novo) { if (alvo) alvo.classList.remove('destino'); alvo = novo; if (alvo) alvo.classList.add('destino'); }
    });
    function fim() {
      if (!el) return;
      if (fantasma) { fantasma.remove(); el.classList.remove('arrastando'); if (alvo) { alvo.classList.remove('destino'); aoSoltar(el, alvo); } }
      else aoTocar(el);
      el = null; ini = null; fantasma = null; alvo = null;
    }
    raiz.addEventListener('pointerup', fim);
    raiz.addEventListener('pointercancel', function () { if (fantasma) fantasma.remove(); if (el) el.classList.remove('arrastando'); el = null; fantasma = null; });
  }
  function moverEvento(id, dia, slot) {
    var ev = E.eventos.filter(function (e) { return e.id === id; })[0];
    if (dia === 0) { avisoCurto('Segunda, 12/10, é feriado: horário bloqueado.'); return; }
    if (E.eventos.some(function (e) { return e.dia === dia && e.slot === slot && e.id !== id; })) { avisoCurto('Esse horário já está ocupado.'); return; }
    ev.dia = dia; ev.slot = slot; E.selEvento = null; render(true);
    avisoCurto(ev.pac + ' movida para ' + DIAS[dia] + ' às ' + HORAS[slot] + '. O paciente recebe o aviso (simulado).');
  }
  function moverCartao(id, col) {
    var p = pac(id); if (p.status === col) { E.selCartao = null; render(true); return; }
    p.status = col; E.selCartao = null; render(true); avisoCurto(p.nome + ' agora está em "' + col + '".');
  }
  function ligarArrastar(id) {
    if (id === 'agenda') {
      var g = document.getElementById('agenda-semana');
      arrastavel(g, '.evento', '.vaga', function (el, vaga) { moverEvento(Number(el.dataset.evento), Number(vaga.dataset.dia), Number(vaga.dataset.slot)); },
        function (el) { var n = Number(el.dataset.evento); E.selEvento = E.selEvento === n ? null : n; render(true); });
    }
    if (id === 'funil') {
      var f = document.getElementById('funil');
      arrastavel(f, '.ficha-cartao', '.coluna', function (el, col) { moverCartao(el.dataset.cartao, col.dataset.coluna); },
        function (el) { E.selCartao = E.selCartao === el.dataset.cartao ? null : el.dataset.cartao; render(true); });
    }
  }

  // ---------- janela para marcar consulta ----------
  function janelaMarcar(dia, slot) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    var opDia = DIAS.map(function (d, i) { return i ? '<option value="' + i + '"' + (i === dia ? ' selected' : '') + '>' + d + '</option>' : ''; }).join('');
    var opHora = HORAS.map(function (h, i) { return '<option value="' + i + '"' + (i === slot ? ' selected' : '') + '>' + h + '</option>'; }).join('');
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">Marcar consulta</h2>' +
      '<label><span class="rotulo">Paciente</span><select class="campo" name="pac">' + PACIENTES.map(function (p) { return '<option>' + p.nome + '</option>'; }).join('') + '</select></label>' +
      '<label><span class="rotulo">Tipo</span><select class="campo" name="tipo">' + TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
      '<label><span class="rotulo">Profissional</span><select class="campo" name="prof">' + PROFS.map(function (p) { return '<option>' + p[0] + '</option>'; }).join('') + '</select></label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label><span class="rotulo">Dia</span><select class="campo" name="dia">' + opDia + '</select></label><label><span class="rotulo">Hora</span><select class="campo" name="slot">' + opHora + '</select></label></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">Marcar</button></div>' +
      '<p class="nota">' + A.item(51) + ' A mesma agenda que a IA usa.</p></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), di = Number(d.get('dia')), sl = Number(d.get('slot'));
      if (E.eventos.some(function (e) { return e.dia === di && e.slot === sl; })) { avisoCurto('Esse horário já está ocupado.'); return; }
      E.eventos.push({ id: E.proxId++, dia: di, slot: sl, pac: d.get('pac'), tipo: d.get('tipo'), prof: d.get('prof') });
      f.remove(); render(true); avisoCurto('Consulta marcada: ' + d.get('pac') + ', ' + DIAS[di] + ' às ' + HORAS[sl] + '.');
    });
  }

  // ---------- ações ----------
  function avisoCurto(msg) {
    var v = document.querySelector('.aviso-curto'); if (v) v.remove();
    v = document.createElement('div'); v.className = 'aviso-curto'; v.textContent = msg; document.body.appendChild(v);
    clearTimeout(avisoCurto.t); avisoCurto.t = setTimeout(function () { v.remove(); }, 2800);
  }
  function perguntaIA(t) {
    if (!t) return; E.chatIA.push(['eu', esc(t)]); render(true);
    setTimeout(function () { E.chatIA.push(['ela', respostaEquipe(t)]); render(true); }, 600);
  }
  document.addEventListener('click', function (ev) {
    var vaga = ev.target.closest('.vaga');
    if (vaga && !ev.target.closest('.evento')) {
      var d = Number(vaga.dataset.dia), s = Number(vaga.dataset.slot);
      if (E.selEvento) { moverEvento(E.selEvento, d, s); return; }
      if (d === 0) { avisoCurto('Segunda, 12/10, é feriado: horário bloqueado.'); return; }
      janelaMarcar(d, s); return;
    }
    var col = ev.target.closest('.coluna');
    if (col && E.selCartao && !ev.target.closest('.ficha-cartao')) { moverCartao(E.selCartao, col.dataset.coluna); return; }
    var el = ev.target.closest('[data-acao]'); if (!el) return;
    var a = el.dataset.acao, v = el.dataset.v;
    if (a === 'aviso') { avisoCurto(el.dataset.msg); return; }
    if (a === 'chave') { el.classList.toggle('on'); return; }
    if (a === 'marca') { el.classList.toggle('sel'); return; }
    if (a === 'aba') { el.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('ativo', b === el); }); return; }
    if (a === 'abrir-ficha') { ev.preventDefault(); E.paciente = v; E.abaFicha = 'resumo'; if (location.hash === '#ficha') render(false); else location.hash = '#ficha'; return; }
    if (a === 'aba-ficha') { E.abaFicha = v; render(true); return; }
    if (a === 'filtro') { E.filtroProf = v; E.selEvento = null; render(true); return; }
    if (a === 'nova') { janelaMarcar(1, 10); return; }
    if (a === 'melhor') { avisoCurto('Sugestão da IA (simulada): quarta, 14/10, às 08:30, colado na consulta das 09:00 (empilhamento).'); var x = document.querySelector('.vaga[data-dia="2"][data-slot="1"]'); if (x) x.classList.add('destino'); return; }
    if (a === 'cancelar-sel') { E.selEvento = null; render(true); return; }
    if (a === 'gravar') { if (E.gravando) { E.gravando = false; E.transcrita = true; } else { E.gravando = true; } render(true); return; }
    if (a === 'pdf') { E.pdf = true; render(true); return; }
    if (a === 'pergunta-ia') { perguntaIA(v); return; }
    if (a === 'pergunta-ia-campo') { var c = document.getElementById('pergunta-ia'); perguntaIA(c.value.trim()); return; }
    if (a === 'enviar-caixa') { var m = document.getElementById('msg-caixa'), t = m.value.trim(); if (!t) return; E.chatEquipe.push(['eq', '"' + esc(t) + '"', 'agora']); render(true); avisoCurto('Enviado pela clínica, entre aspas e sem alteração.'); return; }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.dataset && ev.target.dataset.acao === 'trocar-paciente') { E.paciente = ev.target.value; render(true); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    if (ev.target.id === 'pergunta-ia') perguntaIA(ev.target.value.trim());
    if (ev.target.id === 'msg-caixa') document.querySelector('[data-acao="enviar-caixa"]').click();
  });

  function emBreve(id) { return cab('Tela não encontrada', '') + cartao('<div class="em-breve"><p class="mudo">Esta tela não existe.</p><a class="botao" href="#dia" style="text-decoration:none">Voltar à Visão do dia</a></div>'); }

  function render(manter) {
    var id = (location.hash || '').slice(1) || telaInicial();
    var el = document.getElementById('tela'), y = window.scrollY;
    el.innerHTML = TELAS[id] ? TELAS[id]() : emBreve(id);
    el.className = 'principal' + (manter ? '' : ' entra');
    var menuId = id.indexOf('prof-') === 0 && id !== 'prof-' + QUEM ? 'profissionais' : id;
    document.querySelectorAll('.menu a').forEach(function (a) { a.classList.toggle('ativo', a.dataset.tela === menuId); });
    document.querySelector('.casca').classList.remove('menu-aberto');
    ligarArrastar(id);
    window.scrollTo(0, manter ? y : 0);
  }

  function montar() {
    document.getElementById('menu').innerHTML =
      '<div class="marca">' + A.logo({ tamanho: 46, texto: false }) + '<div><b>Clínica Evoluir</b><small>Dr. André Pontes Gonçalves</small></div></div>' +
      '<div class="quem">' + pessoa(EQUIPE[QUEM]) + '<div style="flex:1;min-width:0"><span class="rotulo">Entrou como</span><b>' + EQUIPE[QUEM].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André') + '</b>' +
        '<small>' + (QUEM === 'andre' ? 'vê tudo' : EQUIPE[QUEM].papel) + ' · <a href="../" data-leva-estilo>trocar</a></small></div>' + A.item(169) + '</div>' +
      (QUEM === 'andre' ? '' : '<nav class="grupo"><span>Meu painel</span>' + (PAINEL.meuMenu[QUEM] || [['prof-' + QUEM, 'Meu dia', 'inicio']]).map(function (i) {
        return '<a href="#' + i[0] + '" data-tela="' + i[0] + '">' + A.ic(i[2]) + i[1] + '</a>';
      }).join('') + '</nav>') +
      MENU.map(function (g) {
        var itens = QUEM === 'andre' ? g.itens : g.itens.filter(function (i) { return MENU_FUNCAO[QUEM].indexOf(i.id) >= 0; });
        if (!itens.length) return '';
        return '<nav class="grupo"><span>' + g.grupo + '</span>' + itens.map(function (i) {
          return '<a href="#' + i.id + '" data-tela="' + i.id + '">' + A.ic(i.ic) + i.nome + '</a>';
        }).join('') + '</nav>';
      }).join('');
    // Balão da IA da equipe em todas as telas (itens 77 e 170), conforme a função de quem entrou.
    A.balao({ titulo: 'IA da equipe', sub: 'responde para ' + EQUIPE[QUEM].papel.toLowerCase() + ' · respostas simuladas', itens: A.item([77, 170]),
      saudacao: 'Oi, ' + EQUIPE[QUEM].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André') + '! Pergunte sobre pacientes, agenda e tarefas da sua função. Não faço diagnóstico, não prescrevo e não calculo dose.',
      sugestoes: IA_FUNCAO[QUEM].sug, responder: respostaFuncao });
    document.getElementById('abrir-menu').addEventListener('click', function () { document.querySelector('.casca').classList.add('menu-aberto'); });
    document.querySelector('.veu').addEventListener('click', function () { document.querySelector('.casca').classList.remove('menu-aberto'); });
    document.getElementById('abrir-menu').innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
    document.getElementById('marca-topo').innerHTML = A.logo({ tamanho: 34, texto: false });
    window.addEventListener('hashchange', function () { E.selEvento = null; E.selCartao = null; render(false); });
    render(false);
  }
  // Peças comuns para o funcoes.js (telas de cada profissional, carregado depois deste arquivo).
  var PAINEL = window.PAINEL = {
    A: A, TELAS: TELAS, PROF: PROF, E: E, QUEM: QUEM, EQUIPE: EQUIPE, PACIENTES: PACIENTES, HORAS: HORAS, DIAS: DIAS, meuMenu: {},
    cartao: cartao, titulo: titulo, cab: cab, kpi: kpi, lista: lista, lin: lin, pessoa: pessoa, chave: chave, funcao: funcao, st: st, pac: pac, esc: esc,
    avisoCurto: function (m) { avisoCurto(m); }, render: function (m) { render(m); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
