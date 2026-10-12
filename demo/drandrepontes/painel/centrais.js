/* Central do paciente (item 191) e Central do médico (itens 165, 166, 167, 192 a 195), mais o quadro da Visão do dia.
   Dados de exemplo fictícios; tudo funciona só na memória (recarregar volta ao começo).
   Regras fixas: a IA não diagnostica, não prescreve e não calcula dose; a ficha e os documentos saem em RASCUNHO
   e só valem depois que o médico revisa e assina; a interpretação dos exames é sempre do médico;
   as anotações da psicologia (172) só aparecem para a psicóloga; texto digitado é sempre escapado. */
(function () {
  'use strict';
  var P = window.PAINEL, A = P.A, T = P.TELAS, QUEM = P.QUEM;
  var cartao = P.cartao, titulo = P.titulo, cab = P.cab, lista = P.lista, lin = P.lin, esc = P.esc;
  function nome(id) { return P.pac(id).nome; }
  function primeiro(id) { return nome(id).split(' ')[0]; }
  function iniciais(id) { return nome(id).split(' ').map(function (x) { return x[0]; }).join(''); }
  function botao(texto, acao, v, claro, extra) { return '<button type="button" class="botao' + (claro ? ' botao-claro' : '') + '" data-c="' + acao + '" data-v="' + (v == null ? '' : v) + '"' + (extra || '') + '>' + texto + '</button>'; }
  function quebra(t) { return esc(t).replace(/\n/g, '<br>'); }

  // ---------- dados de exemplo ----------
  // Telefones fictícios, só com dígitos (o final é o número do ID).
  function fone(id) { return '119000000' + id.replace(/\D/g, '').slice(-2).padStart(2, '0'); }
  function foneBonito(d) { return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7); }
  // Estado do app: [conectado?, texto do último acesso, dias sem abrir]
  var APP = {
    'P-DEMO7': [1, 'hoje, {h:-82}', 0], 'P-DEMO5': [1, 'hoje, {h:-100}', 0], 'P-DEMO9': [0, 'convite enviado ontem; ainda não entrou', 0], 'P-DEMO4': [1, '{d:-5}, 21:14', 5],
    'P-DEMO2': [1, 'ontem, 21:10', 1], 'P-DEMO3': [1, 'hoje, {h:-145}', 0], 'P-DEMO6': [0, 'sem app (novo contato)', 0], 'P-DEMO8': [1, '{d:-41}, 10:02', 41],
    'P-DEMO1': [0, 'desconectou em {d:-212}', 0], 'P-DEM10': [0, 'sem app (novo contato)', 0], 'P-DEM11': [0, 'convite enviado em {d:-7}; ainda não entrou', 0], 'P-DEM12': [1, 'ontem, 22:30', 1]
  };
  var TIPOS = {
    consulta: ['Consultas', 'estetoscopio', 'var(--c1)'], app: ['Registros do app', 'evolucao', 'var(--c2)'], balanca: ['Balança', 'balanca', 'var(--c3)'],
    exame: ['Exames', 'documento', 'var(--c4)'], conversa: ['Conversas', 'chat', 'var(--c5)'], pagamento: ['Pagamentos', 'moeda', 'var(--c6)'], aplicacao: ['Aplicações', 'seringa', 'var(--info)'],
    interacao: ['Ligações e orçamentos', 'telefone', 'var(--c2)']
  };
  var PSICO = { 'P-DEMO3': '{d:-2}', 'P-DEM12': '{d:0}' };

  // Linha do tempo: [data, hora, tipo, texto, detalhe], da mais nova para a mais antiga. Montada uma vez por paciente.
  var LINHA = {};
  function linha(id) {
    if (LINHA[id]) return LINHA[id];
    var p = P.pac(id), l;
    if (id === 'P-DEMO7') l = [
      ['{d:0}', '{h:-3}', 'conversa', 'Pediu pelo WhatsApp para remarcar a aplicação', 'respondida pela IA · item 1'],
      ['{d:0}', '{h:-82}', 'app', 'Café da manhã registrado: 320 kcal, 22 g de proteína; 400 mL de água', 'registro do app'],
      ['{d:0}', '{h:-110}', 'balanca', 'Bioimpedância: 78,6 kg · 35,4% de gordura', 'entrou sozinha pela balança'],
      ['{d:-1}', '22:10', 'app', 'Humor "bem" · sono 6h50 · 2,4 L de água', 'registro do app'],
      ['{d:-4}', '13:20', 'app', 'Sintoma: enjoo leve', 'sem alerta (leve)'],
      ['{d:-4}', '08:15', 'aplicacao', 'Aplicação registrada · abdômen, lado esquerdo', 'instrução conferida pela enfermagem'],
      ['{d:-8}', '19:02', 'exame', 'Hemograma enviado pelo app', 'anexado ao ID'],
      ['{d:-12}', '10:11', 'pagamento', 'Mensalidade de {m:0} paga · Pix · R$ 650', 'baixa automática'],
      ['{d:-21}', '10:00', 'consulta', 'Retorno com o Dr. André', 'ficha v4 assinada'],
      ['{d:-21}', '09:45', 'balanca', 'Bioimpedância: 80,2 kg · 36,9% de gordura', ''],
      ['{d:-28}', '14:00', 'consulta', 'Nutrição com o Felipe', 'plano alimentar enviado ao app'],
      ['{d:-42}', '09:00', 'consulta', 'Primeira consulta com o Dr. André', 'ficha v3'],
      ['{d:-44}', '11:00', 'interacao', 'Ligação: confirmou a primeira consulta', 'Elenice'],
      ['{d:-46}', '18:40', 'conversa', 'Primeiro contato pelo WhatsApp', 'ID P-DEMO7 criado pela IA']];
    else if (p.status === 'Novo contato') l = [
      ['{d:0}', '{h:-68}', 'conversa', 'Perguntou o preço da primeira consulta', 'respondida pela IA com os preços cadastrados'],
      ['{d:0}', '{h:-70}', 'conversa', 'Primeiro contato pelo WhatsApp', 'ID ' + id + ' criado pela IA']];
    else if (p.status === 'Agendado') l = [
      ['{d:-1}', '17:30', 'conversa', 'Respondeu a pré-consulta', 'resumo pronto para o médico'],
      ['{d:-2}', '10:05', 'pagamento', 'Sinal da primeira consulta pago · cartão', ''],
      ['{d:-3}', '16:22', 'consulta', 'Primeira consulta marcada pela IA', p.prof],
      ['{d:-3}', '16:15', 'conversa', 'Primeiro contato pelo WhatsApp', 'ID ' + id + ' criado pela IA']];
    else {
      l = [
        [p.ultimo, '10:00', 'consulta', 'Consulta com ' + p.prof, p.status === 'Retorno vencido' ? 'retorno vencido' : 'realizada'],
        [p.ultimo, '09:40', 'balanca', 'Bioimpedância: ' + p.peso + ' kg', 'variação ' + p.var],
        ['{d:-12}', '09:30', 'pagamento', id === 'P-DEMO3' ? 'Mensalidade de {m:0} em aberto · venceu {d:-8}' : 'Mensalidade de {m:0} paga · Pix', id === 'P-DEMO3' ? 'lembrete enviado' : 'baixa automática'],
        ['{d:-15}', '08:00', 'aplicacao', 'Aplicação registrada no app', 'instrução conferida pela enfermagem'],
        ['{d:-59}', '11:00', 'exame', 'Exames de rotina anexados', 'enviados pelo app']];
      if (APP[id][0] && APP[id][2] < 3) l.unshift([APP[id][1].split(',')[0].replace('hoje', '{d:0}').replace('ontem', '{d:-1}'), (APP[id][1].split(', ')[1] || '08:00'), 'app', 'Registros do dia: refeições, água e humor', 'registro do app']);
      if (id === 'P-DEMO5') l.unshift(['{d:0}', '{h:-98}', 'app', 'Sintoma: náusea forte, 2 dias depois da aplicação', 'enfermagem avisada às {h:-98}']);
      if (id === 'P-DEM12') l.unshift(['{d:-1}', '20:05', 'balanca', 'Peso no app: 90,7 kg (−2,4 kg em 7 dias)', 'alerta para o médico']);
    }
    if (id === 'P-DEMO6') l.unshift(['{d:0}', '{h:-50}', 'interacao', 'Orçamento do acompanhamento de 3 meses enviado', 'Emanuele']);
    if (PSICO[id]) l.splice(1, 0, [PSICO[id], '11:00', 'consulta', 'Psicologia com a Maria Clara', 'psicologia']);
    return (LINHA[id] = l);
  }
  function alertas(id) {
    var p = P.pac(id), a = [];
    if (p.alerta) a.push([p.alerta, 'var(--perigo)']);
    if (APP[id][0] && APP[id][2] >= 3) a.push(['Não abre o app há ' + APP[id][2] + ' dias', 'var(--alerta)']);
    if (!APP[id][0] && /convite/.test(APP[id][1])) a.push(['Ainda não entrou no app', 'var(--info)']);
    if (id === 'P-DEMO3') a.push(['Pagamento de {m:0} em aberto', 'var(--alerta)']);
    return a;
  }

  // Exames: valores por data. Faixa = referência impressa no laudo do laboratório (só para comparar; não interpreta).
  var EXAMES = [
    { nome: 'Glicemia de jejum', un: 'mg/dL', min: 70, max: 99 }, { nome: 'Hemoglobina glicada', un: '%', min: 4, max: 5.6 },
    { nome: 'Colesterol LDL', un: 'mg/dL', min: 0, max: 130 }, { nome: 'Triglicerídeos', un: 'mg/dL', min: 0, max: 150 },
    { nome: 'TSH', un: 'mUI/L', min: 0.4, max: 4 }, { nome: 'Ferritina', un: 'ng/mL', min: 15, max: 150 }, { nome: 'Vitamina D', un: 'ng/mL', min: 20, max: 60 }];
  var HIST = {
    'P-DEMO9': [['{a:-215}', [104, 5.9, 142, 188, 2.1, 22, 18]]],
    'P-DEMO7': [['{a:-407}', [112, 6.1, 151, 210, 2.6, 48, 24]], ['{a:-212}', [101, 5.8, 138, 172, 2.4, 52, 27]]]
  };
  // O arquivo novo (exemplo) que a IA lê: "exame_dd-mm.pdf" (data do exame: 8 dias atrás).
  function arquivoExame() { return 'exame_' + A.datas.dm(A.datas.somaDias(A.datas.hoje(), -8)).replace('/', '-'); }
  var NOVO = { 'P-DEMO9': [99, 5.7, 135, 160, 2.3, 12, 16], 'P-DEMO7': [94, 5.5, 126, 141, 2.2, 55, 31] };
  function hist(id) {
    if (!HIST[id]) { var b = 90 + id.charCodeAt(id.length - 1) % 15; HIST[id] = [['{a:-176}', [b + 6, 5.6, 128, 150, 2.0, 60, 25]]]; }
    return HIST[id];
  }
  function novoDe(id) { if (!NOVO[id]) { var h = hist(id)[0][1]; NOVO[id] = h.map(function (v, i) { return i === 1 || i === 4 ? Math.round((v - .1) * 10) / 10 : Math.round(v * .95); }); } return NOVO[id]; }
  function num(v) { return String(v).replace('.', ','); }
  function fora(e, v) { return v < e.min || v > e.max; }

  // ---------- estado ----------
  var C = {
    pac: 'P-DEMO7', filtro: '', enviadas: {},
    cons: { pac: 'P-DEMO9', etapa: 'pronto', n: 0, seg: 0, pausa: false, campos: null, revisei: false, versao: 0 },
    ex: { etapa: 'inicio', sel: 0, nota: {} },
    doc: { modelo: 'pedido', texto: {}, revisei: false, assinado: {} },
    rec: { texto: '', emitida: null }, sintese: false
  };
  var timer = null;

  // ---------- busca (nome, ID ou telefone) ----------
  function buscar(q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return [];
    var dig = q.replace(/\D/g, '');
    return P.PACIENTES.filter(function (p) {
      return p.nome.toLowerCase().indexOf(q) >= 0 || p.id.toLowerCase().indexOf(q) >= 0 || (dig.length >= 3 && fone(p.id).indexOf(dig) >= 0);
    }).slice(0, 6);
  }
  function resultados(q) {
    var r = buscar(q);
    if (!String(q || '').trim()) return '';
    if (!r.length) return '<div class="resultado fraco">Nenhum paciente com "' + esc(q) + '".</div>';
    return r.map(function (p) {
      return '<button type="button" class="resultado" data-c="abrir-pac" data-v="' + p.id + '"><b>' + p.nome + '</b> <span class="idp">' + p.id + '</span><span class="fraco">' + foneBonito(fone(p.id)) + ' · ' + p.status + '</span></button>';
    }).join('');
  }
  function caixaBusca(idRes, valor) {
    return '<div class="busca-viva"><span class="busca">' + A.ic('pacientes') + '<input type="search" class="busca-campo" data-busca="' + idRes + '" value="' + esc(valor || '') + '" placeholder="Nome, ID ou telefone" autocomplete="off" aria-label="Buscar paciente por nome, ID ou telefone"></span>' +
      '<div class="resultados" id="' + idRes + '">' + resultados(valor) + '</div></div>';
  }

  // ---------- Central do paciente (191) ----------
  T['central-paciente'] = function () {
    var p = P.pac(C.pac), app = APP[p.id], al = alertas(p.id);
    var itens = linha(p.id).filter(function (x) { return !C.filtro || x[2] === C.filtro; });
    return cab('Central do paciente', 'Tudo de um paciente num lugar só, pelo ID: do WhatsApp ao app, da agenda ao financeiro.', A.item(191)) +
      cartao(caixaBusca('res-central', C.busca) + '<p class="nota" style="margin-top:6px">Experimente: "Carlos", "P-DEMO3" ou "0012" (final do telefone).</p>') +
      '<div class="grade">' +
        cartao('<div class="linha-ic"><span class="pessoa" style="background:var(--c3);width:52px;height:52px;font-size:17px">' + iniciais(p.id) + '</span>' +
          '<div class="meio"><h2 style="font-size:20px">' + p.nome + '</h2><div class="fraco" style="font-size:12.5px"><span class="idp">' + p.id + '</span> · ' + p.idade + ' anos · ' + foneBonito(fone(p.id)) + '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + P.st(p.status) + '<span class="chip">' + p.fase + '</span><span class="chip">' + p.prof + '</span></div>' + (P.crm ? P.crm.chips(p.id) : '') + '</div></div>' +
          '<div class="estado-app"><span class="ponto" style="background:' + (app[0] ? 'var(--ok)' : 'var(--texto-3)') + '"></span><div><b>' + (app[0] ? 'App conectado' : 'App não conectado') + '</b><div class="fraco" style="font-size:12.5px">Último acesso: ' + app[1] + '</div></div></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao(A.ic('chat') + 'Mandar mensagem', 'msg', p.id) + botao(A.ic('telefone') + 'Registrar interação', 'interacao', p.id, true) +
          (QUEM === 'andre' ? botao(A.ic('estetoscopio') + 'Iniciar consulta', 'iniciar', p.id, true) : '') +
          '<a class="botao botao-claro" href="#ficha" data-acao="abrir-ficha" data-v="' + p.id + '" style="text-decoration:none">Abrir ficha</a></div>', 's7') +
        cartao(titulo('Alertas', A.item([135, 129])) + (al.length ? al.map(function (a) {
          return '<div class="alerta-lin" style="--cor:' + a[1] + '">' + A.bolha('alerta', a[1]) + '<div><b>' + a[0] + '</b></div></div>';
        }).join('') : '<p class="mudo" style="font-size:13.5px">Nenhum alerta para este paciente.</p>'), 's5') +
      '</div>' +
      cartao(titulo('Linha do tempo', A.item([191, 183, 134, 72, 136, 89, 124])) +
        '<div class="abas-tela" style="margin-bottom:12px"><button type="button" data-c="filtro" data-v="" class="' + (C.filtro ? '' : 'ativo') + '">Tudo</button>' +
          Object.keys(TIPOS).map(function (k) { return '<button type="button" data-c="filtro" data-v="' + k + '" class="' + (C.filtro === k ? 'ativo' : '') + '">' + TIPOS[k][0] + '</button>'; }).join('') + '</div>' +
        (itens.length ? '<ol class="linha-tempo">' + itens.map(function (x) {
          var t = TIPOS[x[2]], texto = x[3], det = x[4];
          if (det === 'psicologia') { det = ''; texto += QUEM === 'mariaclara' ? '<div class="mudo" style="font-size:12.5px">Anotações no <a href="#mc-prontuario">prontuário de psicologia</a> (só você vê).</div>' : '<div class="fraco" style="font-size:12.5px">' + A.ic('cadeado') + ' Sessão realizada · conteúdo restrito à psicóloga ' + A.item(172) + '</div>'; }
          return '<li>' + A.bolha(t[1], t[2]) + '<div class="meio"><b>' + texto + '</b>' + (det ? '<div class="fraco" style="font-size:12.5px">' + det + '</div>' : '') + '</div><span class="num fraco quando">' + x[0] + ' · ' + x[1] + '</span></li>';
        }).join('') + '</ol>' : '<p class="mudo">Nada deste tipo ainda.</p>')) +
      '<p class="nota">Dados de exemplo. A mensagem da equipe vai ao paciente entre aspas e sem alteração.</p>';
  };

  // ---------- Central do médico ----------
  var ABAS = [['central', 'Consulta'], ['central-exames', 'Exames'], ['central-documentos', 'Documentos'], ['central-receita', 'Receita'], ['central-assistente', 'Pré-consulta e assistente']];
  function cabMedico(aba, sub, itens) {
    var c = C.cons, p = P.pac(c.pac), hoje = P.E.eventos.filter(function (e) { return e.pac === p.nome && e.dia === P.REF; })[0];
    return cab('Central do médico', sub, itens) +
      '<div class="abas-tela">' + ABAS.map(function (a) { return '<a href="#' + a[0] + '" class="' + (a[0] === aba ? 'ativo' : '') + '">' + a[1] + '</a>'; }).join('') + '</div>' +
      cartao('<div class="linha-ic"><span class="pessoa" style="background:var(--c3);width:46px;height:46px">' + iniciais(p.id) + '</span><div class="meio"><h3 style="font-size:18px">' + p.nome + '</h3>' +
        '<div class="fraco" style="font-size:12.5px">' + p.id + ' · ' + p.idade + ' anos · ' + (hoje ? hoje.tipo + ' · ' + P.HORAS[hoje.slot] : p.fase) + '</div></div>' +
        '<select class="campo" data-c-mudar="pac-cons" style="max-width:260px" aria-label="Paciente da consulta"' + (c.etapa === 'gravando' ? ' disabled' : '') + '>' + P.PACIENTES.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + x.nome + ' · ' + x.id + '</option>'; }).join('') + '</select>' +
        '<a class="botao botao-claro" href="#central-paciente" data-c="abrir-pac" data-v="' + p.id + '" style="text-decoration:none">Central do paciente</a></div>');
  }

  // Falas simuladas (aparecem uma a uma, como se fosse ao vivo).
  function falas(id) {
    var n = primeiro(id);
    if (id === 'P-DEMO9') return [['Dr. André', 'Larissa, o que te trouxe aqui hoje?'], ['Paciente', 'Quero perder uns 12 quilos. Já tentei várias dietas e sempre volto a ganhar.'],
      ['Dr. André', 'Há quanto tempo você vem tentando?'], ['Paciente', 'Uns cinco anos. Perco seis, sete quilos e depois volta tudo.'], ['Dr. André', 'Usa algum remédio todos os dias?'],
      ['Paciente', 'Só o anticoncepcional.'], ['Dr. André', 'Alguma cirurgia ou internação?'], ['Paciente', 'Não, nenhuma.'], ['Dr. André', 'E o sono, a fome à noite?'],
      ['Paciente', 'Durmo umas seis horas. À noite me dá mais fome, principalmente quando estou ansiosa.'], ['Dr. André', 'Vamos começar pelos exames, a bioimpedância e um plano com o Felipe. Te vejo de novo em 30 dias.']];
    return [['Dr. André', n + ', como foram essas semanas?'], ['Paciente', 'Bem. Perdi um pouco de peso, mas tive enjoo depois de uma aplicação.'], ['Dr. André', 'O enjoo durou quanto tempo?'],
      ['Paciente', 'Um dia, mais ou menos. Depois passou.'], ['Dr. André', 'E a alimentação? Está conseguindo registrar no app?'], ['Paciente', 'Na maioria dos dias, sim. No fim de semana fica mais difícil.'],
      ['Dr. André', 'Vamos manter o acompanhamento com o Felipe e conversar de novo no retorno.']];
  }
  function rascunho(id) {
    if (id === 'P-DEMO9') return {
      anamnese: 'Primeira consulta. Objetivo: perder cerca de 12 kg. Tentativas de dieta há cerca de 5 anos, com reganho de peso (efeito sanfona). Usa anticoncepcional. Nega cirurgias e internações. Sono de cerca de 6 h. Relata mais fome à noite, associada à ansiedade.',
      evolucao: 'Peso informado na pré-consulta: 84 kg. Bioimpedância de hoje a anexar.',
      conduta: 'Conforme falado na consulta: pedir exames, fazer a bioimpedância, encaminhar à nutrição (Felipe) e retorno em 30 dias.\nMedicação: a preencher pelo médico (a IA não prescreve).' };
    var p = P.pac(id);
    return {
      anamnese: 'Retorno. Paciente em ' + p.fase.toLowerCase() + '. Relata enjoo depois de uma aplicação, com duração de cerca de 1 dia. Registra a alimentação no app na maioria dos dias; mais difícil no fim de semana.',
      evolucao: 'Peso atual: ' + p.peso + ' kg (' + p.var + ' desde o início). Adesão ao app: ' + p.adesao + '% dos dias.',
      conduta: 'Conforme falado na consulta: manter o acompanhamento com a nutrição e conversar de novo no retorno.\nMedicação: a preencher pelo médico (a IA não prescreve).' };
  }
  function mmss(s) { s = Math.floor(s); return (s < 600 ? '0' : '') + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  function tique() {
    var c = C.cons; if (c.etapa !== 'gravando' || c.pausa) return;
    c.seg += 9; if (c.n < falas(c.pac).length) c.n++;
    if (location.hash === '#central') P.render(true);
  }
  function parar() { if (timer) { clearInterval(timer); timer = null; } }

  T['central'] = function () {
    var c = C.cons, p = P.pac(c.pac), f = falas(c.pac), corpo;
    if (c.etapa === 'pronto') corpo = cartao(titulo('Iniciar consulta', A.item([165, 194])) +
      '<p class="mudo" style="font-size:14px">A consulta é gravada só com o aceite do paciente. A transcrição aparece enquanto vocês conversam e, no fim, a IA preenche a ficha em <b>rascunho</b> (anamnese, evolução e conduta) para você revisar, editar e assinar.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao(A.ic('estetoscopio') + 'Iniciar consulta', 'cons-iniciar') + '<a class="botao botao-claro" href="#central-assistente" style="text-decoration:none">Ver a pré-consulta antes</a></div>');
    else if (c.etapa === 'aceite') corpo = cartao(titulo('Aceite do paciente', A.item(165)) +
      '<div class="alerta-lin" style="--cor:var(--info)">' + A.bolha('cadeado', 'var(--info)') + '<div><b>Leia para ' + primeiro(p.id) + ':</b><p class="mudo" style="font-size:13.5px;margin-top:4px">"Posso gravar a nossa conversa? O áudio vira texto só para a sua ficha aqui na clínica, e você pode pedir para parar a qualquer momento."</p></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao('Paciente aceitou · começar a gravar', 'cons-aceitou') + botao('Seguir sem gravar', 'cons-sem', '', true) + '</div>' +
      '<p class="nota" style="margin-top:8px">O aceite fica registrado na linha do tempo do paciente, com data e hora.</p>');
    else if (c.etapa === 'gravando') corpo = cartao(titulo('Transcrição ao vivo', A.item(165) + '<span class="item">ligada ao ' + p.id + '</span>') +
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div class="gravando"' + (c.pausa ? ' style="color:var(--texto-3)"' : '') + '><i' + (c.pausa ? ' style="animation:none;background:var(--texto-3)"' : '') + '></i>' + (c.pausa ? 'Em pausa' : 'Gravando') + ' · <span class="num">' + mmss(c.seg) + '</span></div><span class="fraco" style="font-size:12.5px">transcrição simulada</span></div>' +
      '<div class="transcricao viva" id="transcricao-viva" style="margin-top:10px">' + f.slice(0, c.n).map(function (x, i) { return '<p' + (i === c.n - 1 && !c.pausa ? ' class="nova"' : '') + '><b>' + x[0] + ':</b> ' + x[1] + '</p>'; }).join('') + (c.n < f.length && !c.pausa ? '<p class="fraco digitando">ouvindo…</p>' : '') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao(c.pausa ? 'Continuar' : 'Pausar', 'cons-pausa', '', true) + botao('Encerrar e preencher a ficha', 'cons-fim') + '</div>');
    else if (c.etapa === 'gerando') corpo = cartao('<div class="gravando" style="color:var(--info)"><i style="background:var(--info)"></i>A IA está preenchendo a ficha em rascunho…</div>');
    else if (c.etapa === 'rascunho') corpo = cartao(titulo('Ficha em rascunho', '<span class="selo-rascunho">RASCUNHO</span>' + A.item([165, 63, 194])) +
      '<p class="mudo" style="font-size:13.5px">' + (c.n ? 'Escrita pela IA a partir da transcrição.' : 'Consulta sem gravação: preencha você mesmo.') + ' Revise e edite à vontade. Nada vai para a ficha sem a sua assinatura.</p>' +
      [['anamnese', 'Anamnese'], ['evolucao', 'Evolução'], ['conduta', 'Conduta']].map(function (x) {
        return '<label style="display:block;margin-top:12px"><span class="rotulo">' + x[1] + '</span><textarea class="campo campo-ficha" data-c-campo="' + x[0] + '">' + esc(c.campos[x[0]]) + '</textarea></label>';
      }).join('') +
      '<label class="confirma"><input type="checkbox" data-c-mudar="revisei"' + (c.revisei ? ' checked' : '') + '> Revisei e o texto está correto</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' + botao(A.ic('cadeado') + 'Assinar e salvar na ficha', 'cons-assinar', '', false, c.revisei ? '' : ' disabled') + botao('Descartar rascunho', 'cons-descartar', '', true) + '</div>' +
      '<p class="nota" style="margin-top:8px">Assinatura com certificado ICP-Brasil ' + A.item(194) + ': depende de certificado digital e integração externa. Aqui, simulada.</p>');
    else corpo = cartao(titulo('Ficha assinada', '<span class="status st-ok">assinada</span>' + A.item([194, 65])) +
      '<p class="mudo" style="font-size:13.5px">Salva na ficha de ' + p.nome + ' como versão nova (v' + c.versao + '), assinada pelo Dr. André em {d:0}. A versão anterior continua guardada.</p>' +
      lista([['Anamnese', c.campos.anamnese], ['Evolução', c.campos.evolucao], ['Conduta', c.campos.conduta]].map(function (x) { return lin('', '<span class="rotulo">' + x[0] + '</span><div style="margin-top:2px">' + quebra(x[1]) + '</div>'); })) +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><a class="botao" href="#central-documentos" style="text-decoration:none">' + A.ic('documento') + 'Documentos da consulta</a><a class="botao botao-claro" href="#central-receita" style="text-decoration:none">Receita</a>' + botao('Nova consulta', 'cons-nova', '', true) + '</div>');
    var apoio = c.etapa === 'gravando' || c.etapa === 'rascunho'
      ? cartao(titulo('Pré-consulta', A.item(71)) + '<p class="mudo" style="font-size:13.5px">' + preConsulta(p.id) + '</p>', 's4') : '';
    return cabMedico('central', 'Consulta com aceite, gravação, transcrição ao vivo e ficha em rascunho para você revisar e assinar.', A.item([165, 194])) +
      (apoio ? '<div class="grade"><div class="s8">' + corpo + '</div>' + apoio + '</div>' : corpo) +
      '<p class="nota">A IA organiza o que foi dito. Não diagnostica, não prescreve e não calcula dose.</p>';
  };
  function preConsulta(id) {
    if (id === 'P-DEMO9') return 'Objetivo: perder 12 kg. Sem cirurgias. Usa anticoncepcional. Peso informado: 84 kg. Fome maior à noite. <span class="fraco">(respondida pela paciente no WhatsApp)</span>';
    var p = P.pac(id);
    return 'Desde a última consulta: peso ' + p.peso + ' kg (' + p.var + '), adesão ao app de ' + p.adesao + '%' + (p.alerta ? '; atenção: ' + p.alerta.toLowerCase() : '') + '. <span class="fraco">(resumo simulado dos registros)</span>';
  }

  // Exames (192): leitura do arquivo, tabela para conferir, anexo ao ID e gráfico por exame.
  function grafico(id, i) {
    var e = EXAMES[i], h = hist(id), pts = h.map(function (x) { return [x[0], x[1][i]]; });
    var vals = pts.map(function (x) { return x[1]; }).concat([e.max, e.min || e.max * .5]);
    var lo = Math.min.apply(null, vals) * .9, hi = Math.max.apply(null, vals) * 1.08, W = 520, H = 190, M = 34;
    function y(v) { return H - 26 - (v - lo) / (hi - lo) * (H - 46); }
    function x(k) { return pts.length === 1 ? W / 2 : M + k * (W - 2 * M) / (pts.length - 1); }
    var faixa = '<rect x="0" y="' + y(e.max) + '" width="' + W + '" height="' + Math.max(0, y(Math.max(e.min, lo)) - y(e.max)) + '" class="faixa"/>';
    return '<svg class="grafico" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolução de ' + e.nome + '">' + faixa +
      '<polyline points="' + pts.map(function (p, k) { return x(k) + ',' + y(p[1]); }).join(' ') + '"/>' +
      pts.map(function (p, k) { return '<circle cx="' + x(k) + '" cy="' + y(p[1]) + '" r="5"/><text x="' + x(k) + '" y="' + (y(p[1]) - 10) + '" text-anchor="middle" class="v">' + num(p[1]) + '</text><text x="' + x(k) + '" y="' + (H - 6) + '" text-anchor="middle">' + p[0] + '</text>'; }).join('') + '</svg>' +
      '<p class="nota">Faixa sombreada: referência impressa no laudo (' + (e.min ? num(e.min) + ' a ' : 'até ') + num(e.max) + ' ' + e.un + '). A interpretação é do médico.</p>';
  }
  T['central-exames'] = function () {
    var id = C.cons.pac, x = C.ex, h = hist(id), nv = novoDe(id), corpo;
    var envio = cartao(titulo('Enviar PDF ou foto do exame', A.item([192, 166])) +
      '<p class="mudo" style="font-size:13.5px">A IA lê o arquivo e passa os valores para uma tabela. Você confere com o documento antes de anexar ao ID ' + id + '.</p>' +
      (x.etapa === 'inicio' ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao(A.ic('documento') + 'Enviar PDF (exemplo)', 'ex-ler', 'pdf') + botao(A.ic('camera') + 'Tirar foto do exame (exemplo)', 'ex-ler', 'foto', true) + '</div>' : '') +
      (x.etapa === 'lendo' ? '<div class="gravando" style="color:var(--info);margin-top:12px"><i style="background:var(--info)"></i>A IA está lendo ' + arquivoExame() + '.' + (x.tipo === 'foto' ? 'jpg' : 'pdf') + '…</div>' : '') +
      (x.etapa === 'conferir' ? '<div class="rolar-x" style="margin-top:12px"><table class="tabela-larga"><tr><th>Exame</th><th>Valor lido</th><th>Unidade</th><th>Referência do laudo</th></tr>' +
        EXAMES.map(function (e, i) { return '<tr><td>' + e.nome + '</td><td class="num"><b>' + num(nv[i]) + '</b></td><td>' + e.un + '</td><td class="num">' + (e.min ? num(e.min) + ' a ' : 'até ') + num(e.max) + (fora(e, nv[i]) ? ' <span class="status st-al">fora da faixa do laudo</span>' : '') + '</td></tr>'; }).join('') + '</table></div>' +
        '<p class="nota" style="margin-top:6px">Lido de ' + arquivoExame() + '.' + (x.tipo === 'foto' ? 'jpg' : 'pdf') + ' · data do exame: {a:-8} · confira com o documento.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + botao('Conferi · anexar ao ' + id, 'ex-anexar') + botao('Descartar', 'ex-descartar', '', true) + '</div>' : '') +
      (x.etapa === 'anexado' ? '<div class="alerta-lin" style="--cor:var(--ok);margin-top:12px">' + A.bolha('documento', 'var(--ok)') + '<div><b>Exame de {a:-8} anexado ao ' + id + '</b><div class="fraco" style="font-size:12.5px">aparece na tabela, no gráfico e na linha do tempo do paciente</div></div></div>' : ''));
    corpo = cartao(titulo('Exames de ' + nome(id), A.item(192)) +
      '<div class="rolar-x"><table class="tabela-larga"><tr><th>Exame</th>' + h.map(function (d) { return '<th class="num">' + d[0] + '</th>'; }).join('') + '<th>Unidade</th></tr>' +
      EXAMES.map(function (e, i) { return '<tr class="clicavel" data-c="ex-sel" data-v="' + i + '"' + (i === x.sel ? ' style="background:var(--superficie-2)"' : '') + '><td><b>' + e.nome + '</b></td>' + h.map(function (d) { return '<td class="num">' + num(d[1][i]) + (fora(e, d[1][i]) ? ' <span class="ponto" style="background:var(--alerta)" title="fora da faixa do laudo"></span>' : '') + '</td>'; }).join('') + '<td>' + e.un + '</td></tr>'; }).join('') + '</table></div>' +
      '<p class="nota" style="margin-top:6px">Toque num exame para ver a evolução. <span class="ponto" style="background:var(--alerta)"></span> fora da faixa impressa no laudo.</p>');
    var graf = cartao(titulo('Evolução · ' + EXAMES[x.sel].nome, A.item(192)) +
      '<div class="abas-tela" style="margin-bottom:10px">' + EXAMES.map(function (e, i) { return '<button type="button" data-c="ex-sel" data-v="' + i + '" class="' + (i === x.sel ? 'ativo' : '') + '">' + e.nome + '</button>'; }).join('') + '</div>' + grafico(id, x.sel));
    var interp = cartao(titulo('Interpretação do médico', A.item(192)) +
      '<p class="mudo" style="font-size:13.5px">A IA só lê e organiza os valores. O que eles significam é você quem escreve.</p>' +
      '<textarea class="campo" data-c-campo="ex-nota" placeholder="Sua interpretação (vai para a ficha)" style="margin-top:8px">' + esc(x.nota[id] || '') + '</textarea>' +
      '<div style="margin-top:8px">' + botao('Salvar na ficha', 'ex-nota') + '</div>');
    return cabMedico('central-exames', 'A IA lê o exame e organiza os valores; a interpretação é sempre do médico.', A.item([192, 166])) +
      '<div class="grade"><div class="s6" style="display:grid;gap:16px;align-content:start">' + envio + interp + '</div><div class="s6" style="display:grid;gap:16px;align-content:start">' + graf + corpo + '</div></div>';
  };

  // Documentos (193) com assinatura (194).
  var MODELOS = { pedido: 'Pedido de exame', atestado: 'Atestado de comparecimento', orientacoes: 'Orientações' };
  function textoModelo(m, id) {
    var p = P.pac(id), cabec = 'Clínica Evoluir · Dr. André Pontes Gonçalves · CRM 000000 (exemplo)\nPaciente: ' + p.nome + ' · ' + p.id + ' · ' + p.idade + ' anos\nData: {a:0}\n\n';
    if (m === 'pedido') return cabec + 'Solicito os exames abaixo (modelo da clínica para ' + (p.status === 'Agendado' ? 'primeira consulta' : 'acompanhamento') + '):\n- Hemograma completo\n- Glicemia de jejum\n- Hemoglobina glicada\n- Colesterol total e frações\n- Triglicerídeos\n- TSH\n- Ferritina\n- Vitamina D\n\nJejum conforme orientação do laboratório.';
    if (m === 'atestado') return cabec + 'Atesto, para os devidos fins, que ' + p.nome + ' esteve em consulta nesta clínica em {a:0}, das 09:00 às 10:00.';
    return cabec + 'Orientações combinadas na consulta:\n- Registrar as refeições, a água e o humor no app todos os dias.\n- Fazer os exames pedidos e enviar o resultado pelo app.\n- Consulta de nutrição com o Felipe na próxima semana.\n- Em caso de sintoma forte, avisar pelo app ou pelo WhatsApp da clínica.';
  }
  T['central-documentos'] = function () {
    var id = C.cons.pac, d = C.doc, k = d.modelo + ':' + id;
    if (d.texto[k] == null) d.texto[k] = textoModelo(d.modelo, id);
    var ass = d.assinado[k];
    return cabMedico('central-documentos', 'Modelos da clínica preenchidos com os dados do paciente, para você revisar, editar e assinar.', A.item([193, 194])) +
      '<div class="grade">' +
        cartao(titulo('Modelo', A.item(193)) + '<div class="lista">' + Object.keys(MODELOS).map(function (m) {
          return lin(A.bolha('documento', m === d.modelo ? 'var(--primaria)' : 'var(--c4)'), '<b>' + MODELOS[m] + '</b>' + (d.assinado[m + ':' + id] ? '<div class="fraco" style="font-size:12px">assinado</div>' : ''), botao(m === d.modelo ? 'Aberto' : 'Abrir', 'doc-modelo', m, m !== d.modelo));
        }).join('') + '</div><p class="nota" style="margin-top:8px">A clínica cadastra os próprios modelos. Os dados do paciente entram sozinhos pelo ID.</p>', 's4') +
        cartao(titulo(MODELOS[d.modelo], (ass ? '<span class="status st-ok">assinado</span>' : '<span class="selo-rascunho">RASCUNHO</span>') + A.item([193, 194])) +
          (ass ? '<div class="documento">' + quebra(d.texto[k]) + '<p class="fraco" style="margin-top:12px">Assinado digitalmente por Dr. André Pontes Gonçalves em {a:0} (simulado).</p></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao(A.ic('download') + 'Gerar PDF', 'aviso', 'PDF de exemplo gerado com a marca da clínica.') + botao(A.ic('chat') + 'Enviar pelo app', 'aviso', 'Documento enviado ao app de ' + nome(id) + ' (simulado).', true) + botao(A.ic('whatsapp') + 'Enviar pelo WhatsApp', 'aviso', 'Documento enviado pelo WhatsApp (simulado).', true) + '</div>'
          : '<textarea class="campo campo-doc" data-c-campo="doc">' + esc(d.texto[k]) + '</textarea>' +
            '<label class="confirma"><input type="checkbox" data-c-mudar="doc-revisei"' + (d.revisei ? ' checked' : '') + '> Revisei o documento</label>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' + botao(A.ic('cadeado') + 'Assinar', 'doc-assinar', '', false, d.revisei ? '' : ' disabled') + botao('Voltar ao modelo', 'doc-refazer', '', true) + '</div>') +
          '<p class="nota" style="margin-top:8px">Assinatura com certificado ICP-Brasil ' + A.item(194) + ': depende de certificado digital e integração externa.</p>', 's8') +
      '</div>';
  };

  // Receita digital (195): quem escreve é o médico; a IA não sugere remédio nem dose.
  T['central-receita'] = function () {
    var id = C.cons.pac, r = C.rec;
    return cabMedico('central-receita', 'Receita escrita e assinada pelo médico no próprio sistema.', A.item([195, 194])) +
      '<div class="grade">' +
        cartao(titulo('Receita', A.item([195, 194])) +
          (r.emitida === id ? '<div class="alerta-lin" style="--cor:var(--ok)">' + A.bolha('documento', 'var(--ok)') + '<div><b>Receita emitida e assinada (simulado)</b><div class="fraco" style="font-size:12.5px">Chega ao app de ' + nome(id) + '. A instrução de aplicação só aparece na picadinha depois da conferência da enfermagem ' + A.item(125) + '.</div></div></div>' +
              '<div class="documento" style="margin-top:12px">' + quebra(r.texto) + '</div>' + '<div style="margin-top:12px">' + botao('Nova receita', 'rec-nova', '', true) + '</div>'
            : '<p class="mudo" style="font-size:13.5px">O campo começa vazio: a IA não sugere remédio, dose nem frequência.</p>' +
              '<textarea class="campo campo-doc" data-c-campo="rec" placeholder="Escreva a receita" style="margin-top:8px">' + esc(r.texto) + '</textarea>' +
              '<div style="margin-top:8px">' + botao(A.ic('cadeado') + 'Assinar e emitir', 'rec-emitir') + '</div>'), 's8') +
        cartao(titulo('Como funciona', A.item(195)) + '<div class="lista">' +
          lin(A.bolha('perfil', 'var(--c1)'), 'Quem prescreve é sempre o médico.') +
          lin(A.bolha('cadeado', 'var(--c3)'), 'Assinatura com certificado ICP-Brasil ' + A.item(194) + '.') +
          lin(A.bolha('link', 'var(--c4)'), 'Depende de integração com uma plataforma de receita certificada.') +
          lin(A.bolha('seringa', 'var(--info)'), 'A enfermagem confere antes de aparecer no app ' + A.item(125) + '.') + '</div>', 's4') +
      '</div>';
  };

  // Pré-consulta, síntese de arquivos e assistente (71, 166, 167).
  T['central-assistente'] = function () {
    var id = C.cons.pac;
    return cabMedico('central-assistente', 'O que o paciente respondeu antes, o resumo dos arquivos e o que o assistente organizou para você.', A.item([71, 166, 167])) +
      '<div class="grade">' +
        cartao(titulo('Pré-consulta', A.item([71, 30])) + '<p style="font-size:14px">' + preConsulta(id) + '</p>', 's6') +
        cartao(titulo('Arquivo com síntese da IA', A.item(166)) +
          '<p class="mudo" style="font-size:13.5px">Laudo ou relatório de outro profissional: a IA resume o que está escrito; a interpretação é do médico.</p>' +
          (C.sintese ? '<div class="alerta-lin" style="--cor:var(--info);margin-top:10px">' + A.bolha('documento', 'var(--info)') + '<div><b>relatorio_nutricao.pdf · síntese</b><p class="mudo" style="font-size:13px">Relatório de {d:-11} de outro serviço. Descreve plano de 1.500 kcal seguido por 3 meses e perda de 3 kg no período. <span class="fraco">(simulado; confira no documento)</span></p></div></div>'
            : '<div style="margin-top:10px">' + botao(A.ic('documento') + 'Enviar arquivo (exemplo)', 'sintese', '', true) + '</div>'), 's6') +
        cartao(titulo('Assistente clínico', A.item(167) + A.juridico('depende do parecer jurídico')) +
          '<p class="mudo" style="font-size:13.5px">Organiza a informação para o médico decidir. Não diagnostica e não prescreve.</p>' + lista([
            lin(A.bolha('ia', 'var(--c4)'), 'Pré-consulta sem informação de pressão arterial: medir hoje.'),
            lin(A.bolha('ia', 'var(--c4)'), 'Exames: ' + EXAMES.filter(function (e, i) { return fora(e, hist(id)[hist(id).length - 1][1][i]); }).map(function (e) { return e.nome.toLowerCase(); }).join(', ') + ' fora da faixa impressa no laudo mais recente.'),
            lin(A.bolha('ia', 'var(--c4)'), 'Protocolo da clínica para ' + (P.pac(id).status === 'Agendado' ? 'primeira consulta: pedir bioimpedância e marcar nutrição.' : 'retorno: conferir a adesão ao app e a evolução do peso.'))]), 's12') +
      '</div>';
  };

  // ---------- quadro da Visão do dia (Dr. André) ----------
  P.linhaPaciente = linha;
  P.quadroCentral = function () {
    var prox = P.E.eventos.filter(function (e) { return e.prof === 'Dr. André' && e.dia >= P.REF; }).sort(function (a, b) { return a.dia - b.dia || a.slot - b.slot; }).slice(0, 4);
    return cartao('<div class="quadro-cab"><div><span class="rotulo">Central do paciente</span><h2 style="font-size:20px">Encontre qualquer paciente</h2></div><div class="itens">' + A.item([191, 165]) + '</div></div>' +
      '<div class="quadro-corpo"><div>' + caixaBusca('res-home', '') + '<p class="nota" style="margin-top:6px">Por nome, ID ou telefone. Abre a linha do tempo completa.</p></div>' +
      '<div><span class="rotulo">Próximos pacientes</span><div class="lista">' + prox.map(function (e) {
        var p = P.PACIENTES.filter(function (x) { return x.nome === e.pac; })[0];
        return '<div class="lin"><span class="hora num">' + P.HORAS[e.slot] + '</span><div class="meio"><button type="button" class="link-pac" data-c="abrir-pac" data-v="' + p.id + '"><b>' + p.nome + '</b></button> <span class="idp">' + p.id + '</span><div class="fraco">' + (e.dia === P.REF ? P.rotuloRef() : P.DIAS[e.dia]) + ' · ' + e.tipo + '</div></div>' +
          botao(A.ic('estetoscopio') + 'Iniciar consulta', 'iniciar', p.id, e.dia !== P.REF, ' style="height:34px;padding:0 12px;font-size:12.5px"') + '</div>';
      }).join('') + '</div></div></div>', 'quadro-central');
  };

  // ---------- ações ----------
  function abrir(hash) { if (location.hash === hash) P.render(false); else location.hash = hash; }
  function mensagem(id) {
    var app = APP[id][0], f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">Mensagem para ' + nome(id) + '</h2>' +
      '<div class="opcoes"><label class="chip"><input type="radio" name="canal" value="app"' + (app ? ' checked' : ' disabled') + '> Pelo app' + (app ? '' : ' (não conectado)') + '</label><label class="chip"><input type="radio" name="canal" value="whatsapp"' + (app ? '' : ' checked') + '> Pelo WhatsApp</label></div>' +
      (P.crm ? P.crm.seletorModelo(id) : '') +
      '<label><span class="rotulo">Mensagem</span><textarea class="campo" name="t" placeholder="Escreva a mensagem"></textarea></label>' +
      '<p class="nota">Vai ao paciente entre aspas e sem alteração, com o nome de quem enviou.</p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">Enviar</button></div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), t = String(d.get('t') || '').trim(); if (!t) return;
      var canal = d.get('canal') === 'app' ? 'pelo app' : 'pelo WhatsApp', quem = P.EQUIPE[QUEM].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André');
      linha(id).unshift(['{d:0}', 'agora', 'conversa', 'Mensagem ' + canal + ': "' + esc(t.slice(0, 400)) + '"', 'enviada por ' + quem]);
      f.remove(); C.filtro = ''; P.render(true); P.avisoCurto('Enviada ' + canal + ', entre aspas e sem alteração.');
    });
    f.querySelector('textarea').focus();
  }
  // Item 183: ligação, orçamento ou anotação entram na mesma linha do tempo.
  function interacao(id) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">Registrar interação · ' + nome(id) + '</h2>' +
      '<label><span class="rotulo">Tipo</span><select class="campo" name="tipo"><option>Ligação</option><option>Orçamento enviado</option><option>Anotação</option></select></label>' +
      '<label><span class="rotulo">O que aconteceu</span><textarea class="campo" name="t" placeholder="Ex.: ligou para saber do preço do acompanhamento"></textarea></label>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">Registrar</button></div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), t = String(d.get('t') || '').trim(); if (!t) return;
      linha(id).unshift(['{d:0}', 'agora', 'interacao', esc(d.get('tipo')) + ': ' + esc(t.slice(0, 300)), P.EQUIPE[QUEM].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André')]);
      f.remove(); C.filtro = ''; P.render(true); P.avisoCurto('Interação registrada na linha do tempo.');
    });
    f.querySelector('textarea').focus();
  }
  function iniciar(id) {
    parar(); C.cons = { pac: id, etapa: 'aceite', n: 0, seg: 0, pausa: false, campos: null, revisei: false, versao: 0 };
    C.ex.etapa = 'inicio'; C.doc.revisei = false; abrir('#central');
  }
  var AC = {
    'abrir-pac': function (v) { C.pac = v; C.filtro = ''; C.busca = ''; abrir('#central-paciente'); },
    'filtro': function (v) { C.filtro = v; P.render(true); },
    'msg': function (v) { mensagem(v); },
    'interacao': function (v) { interacao(v); },
    'iniciar': iniciar,
    'cons-iniciar': function () { iniciar(C.cons.pac); },
    'cons-aceitou': function () {
      var c = C.cons; c.etapa = 'gravando'; linha(c.pac).unshift(['{d:0}', 'agora', 'consulta', 'Aceite para gravar a consulta registrado', 'Dr. André']);
      parar(); timer = setInterval(tique, 1400); P.render(true);
    },
    'cons-sem': function () { var c = C.cons; c.etapa = 'rascunho'; c.campos = { anamnese: '', evolucao: '', conduta: '' }; P.render(true); },
    'cons-pausa': function () { C.cons.pausa = !C.cons.pausa; P.render(true); },
    'cons-fim': function () {
      var c = C.cons; parar(); c.etapa = 'gerando'; P.render(true);
      setTimeout(function () { c.etapa = 'rascunho'; c.n = Math.max(c.n, 1); c.campos = rascunho(c.pac); if (/^#central$/.test(location.hash)) P.render(true); }, 900);
    },
    'cons-assinar': function () {
      var c = C.cons; if (!c.revisei) return; c.etapa = 'assinada'; c.versao = 5;
      linha(c.pac).unshift(['{d:0}', 'agora', 'consulta', 'Consulta com o Dr. André · ficha assinada', 'nova versão da ficha (v5)']);
      P.render(true); P.avisoCurto('Ficha assinada e salva. A versão anterior continua guardada.');
    },
    'cons-descartar': function () { C.cons.etapa = 'pronto'; C.cons.campos = null; C.cons.revisei = false; P.render(true); },
    'cons-nova': function () { C.cons.etapa = 'pronto'; C.cons.revisei = false; P.render(true); },
    'ex-ler': function (v) {
      C.ex.etapa = 'lendo'; C.ex.tipo = v; P.render(true);
      setTimeout(function () { C.ex.etapa = 'conferir'; if (location.hash === '#central-exames') P.render(true); }, 1100);
    },
    'ex-anexar': function () {
      var id = C.cons.pac, h = hist(id);
      if (h[h.length - 1][0] !== '{a:-8}') h.push(['{a:-8}', novoDe(id).slice()]);
      linha(id).unshift(['{d:0}', 'agora', 'exame', 'Exame de {d:-8} lido pela IA e anexado', 'valores conferidos pelo Dr. André']);
      C.ex.etapa = 'anexado'; P.render(true); P.avisoCurto('Anexado ao ' + id + '. O gráfico já mostra o ponto novo.');
    },
    'ex-descartar': function () { C.ex.etapa = 'inicio'; P.render(true); },
    'ex-sel': function (v) { C.ex.sel = +v; P.render(true); },
    'ex-nota': function () {
      var id = C.cons.pac, t = String(C.ex.nota[id] || '').trim(); if (!t) { P.avisoCurto('Escreva a interpretação antes de salvar.'); return; }
      linha(id).unshift(['{d:0}', 'agora', 'exame', 'Interpretação do Dr. André salva na ficha', '"' + esc(t.slice(0, 160)) + (t.length > 160 ? '…' : '') + '"']);
      P.avisoCurto('Interpretação salva na ficha de ' + nome(id) + '.');
    },
    'doc-modelo': function (v) { C.doc.modelo = v; C.doc.revisei = false; P.render(true); },
    'doc-refazer': function () { delete C.doc.texto[C.doc.modelo + ':' + C.cons.pac]; C.doc.revisei = false; P.render(true); },
    'doc-assinar': function () {
      var d = C.doc, id = C.cons.pac; if (!d.revisei) return; d.assinado[d.modelo + ':' + id] = true; d.revisei = false;
      linha(id).unshift(['{d:0}', 'agora', 'exame', MODELOS[d.modelo] + ' assinado', 'Dr. André']);
      P.render(true); P.avisoCurto(MODELOS[d.modelo] + ' assinado (simulado).');
    },
    'rec-emitir': function () {
      var r = C.rec; if (!String(r.texto).trim()) { P.avisoCurto('Escreva a receita antes de assinar.'); return; }
      r.emitida = C.cons.pac; linha(r.emitida).unshift(['{d:0}', 'agora', 'consulta', 'Receita emitida e assinada pelo Dr. André', 'chega ao app depois da conferência da enfermagem']);
      P.render(true);
    },
    'rec-nova': function () { C.rec = { texto: '', emitida: null }; P.render(true); },
    'sintese': function () { C.sintese = true; P.render(true); },
    'aviso': function (v) { P.avisoCurto(v); }
  };
  P.abrirPaciente = AC['abrir-pac'];
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-c]'); if (!el || !AC[el.dataset.c] || el.disabled) return;
    ev.preventDefault(); AC[el.dataset.c](el.dataset.v, el);
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.busca) { var r = document.getElementById(t.dataset.busca); if (r) r.innerHTML = resultados(t.value); if (t.dataset.busca === 'res-central') C.busca = t.value; return; }
    var k = t.dataset.cCampo; if (!k) return;
    if (k === 'ex-nota') C.ex.nota[C.cons.pac] = t.value;
    else if (k === 'doc') C.doc.texto[C.doc.modelo + ':' + C.cons.pac] = t.value;
    else if (k === 'rec') C.rec.texto = t.value;
    else if (C.cons.campos) C.cons.campos[k] = t.value;
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' || !ev.target.dataset || !ev.target.dataset.busca) return;
    var r = buscar(ev.target.value); if (r.length) AC['abrir-pac'](r[0].id);
  });
  document.addEventListener('change', function (ev) {
    var m = ev.target.dataset && ev.target.dataset.cMudar; if (!m) return;
    if (m === 'pac-cons') { parar(); C.cons = { pac: ev.target.value, etapa: 'pronto', n: 0, seg: 0, pausa: false, campos: null, revisei: false, versao: 0 }; C.ex.etapa = 'inicio'; C.doc.revisei = false; if (C.rec.emitida !== ev.target.value) C.rec = { texto: '', emitida: null }; }
    if (m === 'revisei') C.cons.revisei = ev.target.checked;
    if (m === 'doc-revisei') C.doc.revisei = ev.target.checked;
    P.render(true);
  });
})();
