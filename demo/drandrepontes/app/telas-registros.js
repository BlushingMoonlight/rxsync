/* App do paciente · outros registros: fome e saciedade, intestino, álcool, tabaco e outras substâncias,
   medicamentos e picadinha. Regra fixa: o app nunca calcula dose. Dose, concentração e UI aparecem só como
   "Preenchida pela equipe" (a clínica cadastra no painel; o app não faz conta nenhuma). */
(function () {
  'use strict';
  var P = window.APP, A = P.A, E = P.E, T = P.TELAS, br = P.br;

  // ===== Fome e saciedade =====
  T.fome = function () {
    var muita = P.escolhido('fome1', 2) === 2;
    return P.cab('fome', 'Fome e saciedade', 'Conte como está sua fome e sua alimentação.', A.item(150)) + P.dataCartao(false) +
      '<section class="bloco"><div class="linha-ic">' + A.ilu('estomago', 92) + '<p class="meio" style="font-size:17px">Seu registro ajuda a equipe a acompanhar você.</p></div></section>' +
      '<section class="bloco"><h3>1. Como está sua fome ao longo do dia?</h3>' + P.pil('fome1', ['Controlada', 'Controlada em parte', 'Sinto muita fome'], 2, 'contorno') + '</section>' +
      (muita ? '<section class="bloco verde"><span class="etiqueta verde" style="justify-self:start">Perguntas adicionais conforme sua resposta</span><h3>Vamos entender quando a fome aumenta.</h3>' +
        '<span style="font-size:14.5px">Quando você percebe mais fome?</span>' + P.pil('fomeQuando', ['Ao longo de toda a semana', 'Nos dias próximos à próxima aplicação', 'Em outros momentos', 'Não sei dizer'], 1, 'lista') +
        '<span style="font-size:14.5px">Percebe alguma mudança emocional junto com o aumento da fome?</span>' + P.pil('fomeEmo', ['Sim', 'Não', 'Não sei'], 0, 'contorno') +
        (P.escolhido('fomeEmo', 0) === 0 ? '<span style="font-size:14.5px">O que você percebeu? <span class="fraco">(opcional)</span></span><textarea class="campo" style="height:52px" placeholder="Ex.: ansiedade, estresse, tristeza ou irritação"></textarea>' : '') +
        '<div class="linha-pergunta" style="margin-top:6px"><h3>Sobre seu ciclo menstrual</h3><span class="selo-bege">Quando se aplica a você</span></div>' +
        '<span style="font-size:14.5px">Em qual fase você está?</span>' + P.pil('fomeCiclo', ['Antes da menstruação', 'Menstruando', 'Outro momento do ciclo', 'Não menstruo', 'Não sei / prefiro não informar'], 0, 'lista') +
        '<span style="font-size:14.5px">Percebe mais fome nesse período?</span>' + P.pil('fomeCicloMais', ['Sim', 'Não', 'Não sei'], 2, 'contorno') + A.item(154) + '</section>' : '') +
      '<section class="bloco"><h3>2. Está conseguindo comer conforme as orientações?</h3>' + P.pil('fome2', ['Sim', 'Em parte', 'Não'], 1, 'contorno') +
        (P.escolhido('fome2', 1) ? '<span style="font-size:13.5px">O que está dificultando? <span class="fraco">(opcional)</span></span><textarea class="campo" style="height:52px" placeholder="Ex.: pouca fome, muita fome ou rotina corrida"></textarea>' : '') + '</section>' +
      '<section class="bloco"><h3>3. Quando sente fome e começa a comer, como fica satisfeito(a)?</h3><div class="pilulas lista">' +
        [['prato-pouco', 'Com pouca quantidade já fico satisfeito(a)'], ['prato-medio', 'Com uma quantidade habitual'], ['prato-grande', 'Consigo comer um grande volume antes de me sentir satisfeito(a)']].map(function (o, i) {
          var s = P.escolhido('fome3', 1) === i;
          return '<button type="button" data-acao="esc" data-g="fome3" data-v="' + i + '" class="' + (s ? 'sel' : '') + '" aria-pressed="' + s + '" style="display:flex;align-items:center;gap:12px;padding:4px 12px">' + A.ilu(o[0], 58) + '<span>' + o[1] + '</span></button>';
        }).join('') + '</div></section>' +
      '<section class="bloco"><h3>4. Mesmo satisfeito(a), sente vontade de continuar comendo?</h3>' + P.pil('fome4', ['Não', 'Às vezes', 'Sim'], 1, 'contorno') + '</section>' +
      P.obs('Quer acrescentar algo?', 'Conte como foi sua fome hoje...') + P.salvar() +
      '<h2 class="titulo-secao">Últimos registros</h2><div class="lista-reg colada">' + P.regLink('estomago', '{d:-1}', 'Fome controlada', '#', 'Registro de {d:-1} (exemplo).') + P.regLink('estomago', '{d:-2}', 'Controlada em parte', '#', 'Registro de {d:-2} (exemplo).') + '</div>' +
      P.contato('Solicitar contato com a equipe', 'Nutrição', 'bege') + P.ficha();
  };

  // ===== Intestino =====
  var FORMATOS = ['Bolinhas duras separadas', 'Alongadas, com caroços', 'Alongadas, com rachaduras', 'Alongadas, lisas e macias', 'Pedaços macios separados', 'Pastosas, sem formato definido', 'Líquidas'];
  T.intestino = function () {
    var sel = P.escolhido('formato', 3), evacuou = P.escolhido('evacuou', 1);
    function fmt(i) { var s = sel === i; return '<button type="button" data-acao="esc" data-g="formato" data-v="' + i + '" class="' + (s ? 'sel' : '') + '" aria-pressed="' + s + '">' + A.ilu('fezes-' + (i + 1), 58) + '<span style="font-size:12.5px">' + FORMATOS[i] + '</span></button>'; }
    return P.cab('intestino', 'Meu intestino', 'Como está o funcionamento do seu intestino?', A.item(151)) + P.dataCartao(false) +
      '<section class="bloco"><div class="linha-ic">' + A.ilu('intestino', 110) + '<p class="meio" style="font-size:18px">Acompanhe seu funcionamento intestinal.</p></div></section>' +
      '<section class="bloco"><h3>1. Com que frequência você tem evacuado?</h3>' + P.pil('freq', ['Mais de uma vez ao dia', 'Uma vez ao dia', 'A cada 2 dias', 'A cada 3 dias ou mais', 'Não sei dizer'], 1, 'pequenas', 5) + '</section>' +
      '<section class="bloco"><div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end"><div style="display:grid;gap:8px"><h3>2. Evacuou hoje?</h3>' + P.pil('evacuou', ['Não', 'Sim'], 1) + '</div>' +
        (evacuou ? '<div style="display:grid;gap:6px;justify-items:center"><span style="color:var(--texto-2);font-size:14px">Quantas vezes?</span>' + P.passo('evac', E.num.evac, 'Quantas vezes') + '</div>' : '') + '</div></section>' +
      '<section class="bloco"><h3>3. Qual formato e consistência mais se parecem com suas fezes?</h3>' +
        '<div class="opcoes-cartao" style="--n:4">' + [0, 1, 2, 3].map(fmt).join('') + '</div><div class="opcoes-cartao" style="--n:3">' + [4, 5, 6].map(fmt).join('') + '</div></section>' +
      '<section class="bloco"><h3>4. As fezes costumam boiar ou afundar?</h3>' + P.pil('boiar', ['Boiam', 'Afundam', 'Varia', 'Não observei'], 1) + '</section>' +
      '<section class="bloco"><h3>5. Percebe gordura ou aspecto oleoso nas fezes?</h3>' + P.pil('oleoso', ['Sim', 'Não', 'Não sei'], 1) + '</section>' +
      '<section class="bloco"><h3>6. Percebe gotas de óleo ou gordura na água do vaso?</h3>' + P.pil('oleo', ['Sim', 'Não', 'Não sei'], 1) + '</section>' +
      P.obs('Quer acrescentar algo?', 'Conte como têm sido suas evacuações...') + P.salvar() +
      P.aviso('Mais de 3 dias sem evacuar ou sangue nas fezes avisam a enfermagem.', 'caixa') +
      '<h2 class="titulo-secao">Últimos registros</h2><div class="lista-reg colada">' + P.regLink('intestino', '{d:-1}', '', '#', 'Registro de {d:-1} (exemplo).').replace('<span></span>', '<span class="fraco" style="margin-left:auto">Ver registro</span>') +
        P.regLink('intestino', '{d:-2}', '', '#', 'Registro de {d:-2} (exemplo).').replace('<span></span>', '<span class="fraco" style="margin-left:auto">Ver registro</span>') + '</div>' + P.ficha();
  };

  // ===== Consumo de álcool =====
  var BEBIDAS = [['cerveja', 'Cerveja', [200, 350, 473, 600], 350, 'lata'], ['vinho', 'Vinho', [150, 300, 450, 750], 150, 'taça'], ['espumante', 'Espumante', [120, 240, 360, 750], 120, 'taça'],
    ['destilado', 'Destilado', [30, 50, 100, 200], 50, 'dose'], ['drink', 'Drink', [200, 300, 400, 500], 300, 'copo'], ['garrafa', 'Outra bebida', [100, 200, 350, 500], 200, 'unidade']];
  T.alcool = function () {
    var consumiu = P.escolhido('consumiu', 1), b = BEBIDAS[P.escolhido('bebida', 0)];
    return P.cab('alcool', 'Consumo de álcool', 'Registre o tipo de bebida e quanto consumiu.', A.item(152)) + P.dataCartao(false) +
      '<section class="bloco"><div class="linha-pergunta"><h3>Consumiu bebida alcoólica hoje?</h3>' + P.pil('consumiu', ['Não', 'Sim'], 1, 'sim-nao') + '</div></section>' +
      (consumiu ? '<h2 class="titulo-secao">Qual bebida?</h2>' + P.cartoes('bebida', BEBIDAS.map(function (x) { return [x[0], x[1]]; }), 0, 3, 64) +
        '<section class="bloco form-cartao"><div class="topo-form">' + A.ilu(b[0], 48) + '<b>' + b[1] + '</b><span class="selo-bege">Novo registro</span></div>' +
          '<label class="campo-rot">Nome da bebida <span class="fraco">(opcional)</span><input class="campo" placeholder="Marca ou descrição (opcional)"></label>' +
          '<span style="font-size:14px;font-weight:550">Volume total consumido</span><div style="max-width:260px">' + P.passo('volume', br(E.num.volume) + ' ml', 'Volume') + '</div>' +
          '<div class="chips-linha" style="--n:4">' + b[2].map(function (n) { return '<button type="button" data-acao="setnum" data-k="volume" data-v="' + n + '" class="' + (E.num.volume === n ? 'sel' : '') + '">' + n + ' ml</button>'; }).join('') + '</div>' +
          '<div><button type="button" class="mais-link" data-acao="aviso" data-msg="Use o − e o + para informar outro volume.">Informar outro volume</button><p class="fraco" style="font-size:12px">Se bebeu mais de uma unidade, registre o volume total.</p></div>' +
          '<label class="campo-rot">Teor alcoólico, se souber <span class="fraco">(opcional)</span><input class="campo" placeholder="Ex.: 5%" inputmode="decimal"></label>' +
          P.botaoVerde('Adicionar bebida', 'add-bebida') + '</section>' +
        '<h2 class="titulo-secao">Bebidas registradas hoje</h2><div class="lista-reg">' + E.bebidas.map(function (x, i) {
          return P.reg(x[0], x[1], br(x[2]) + ' ml &nbsp;<span class="etiqueta">' + x[3] + '</span>', '', ['bebidas', i]);
        }).join('') + '</div>' + P.aviso('O volume de bebida não equivale à quantidade de álcool.') : '') +
      P.obs('Observações', 'Quer registrar alguma observação?') + P.salvar('Salvar registros do dia', 'Registros do dia salvos. Só a equipe que cuida de você vê.') +
      '<p class="fraco" style="font-size:12px;text-align:center">Sem julgamento: ajuda a equipe a cuidar melhor de você.</p>' + P.ficha();
  };
  P.ACOES['add-bebida'] = function () {
    var b = BEBIDAS[P.escolhido('bebida', 0)], v = E.num.volume, n = Math.round(v / b[3]);
    E.bebidas.push([b[0], b[1], v, n >= 1 && n * b[3] === v ? n + ' ' + b[4] + (n > 1 ? 's' : '') + ' de ' + b[3] + ' ml' : br(v) + ' ml']);
    P.render(true); P.avisoCurto(b[1] + ' · ' + br(v) + ' ml registrados.');
  };

  // ===== Tabaco e outras substâncias =====
  var TIPOS = [['cigarro', 'Tabaco', 'Cigarro'], ['vape', 'Cigarro eletrônico', 'Cigarro eletrônico'], ['prancheta-sub', 'Outras substâncias', '']];
  var UNIDADES = ['Unidades', 'Sessões', 'Tragadas', 'ml', 'g', 'Outra'];
  T.substancias = function () {
    var usou = P.escolhido('usou', 1), t = TIPOS[P.escolhido('tipoSub', 0)], u = P.escolhido('unidade', 0);
    return P.cab('substancias', 'Tabaco e outras substâncias', 'Registre o que usou e a quantidade.', A.item(152)) + P.dataCartao(false) +
      '<section class="bloco"><div class="linha-pergunta"><h3>Usou alguma dessas substâncias hoje?</h3>' + P.pil('usou', ['Não', 'Sim'], 1, 'sim-nao') + '</div></section>' +
      (usou ? P.cartoes('tipoSub', TIPOS.map(function (x) { return [x[0], x[1]]; }), 0, 3, 66) +
        '<section class="bloco form-cartao"><h3 style="font-size:22px">Novo registro</h3>' +
          '<label class="campo-rot">O que você usou?<input class="campo" value="' + t[2] + '" placeholder="Descreva o que usou"></label>' +
          '<div class="duas-col"><div class="campo-rot">Quantidade' + P.passo('qtd', E.num.qtd, 'Quantidade') + '</div><label class="campo-rot">Unidade<select class="campo" data-acao="unidade">' +
            UNIDADES.map(function (x, i) { return '<option' + (i === u ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div>' +
          '<p class="fraco" style="font-size:12px;color:var(--texto-2)">A unidade pode mudar conforme o item registrado.</p>' +
          '<span style="font-size:14px;font-weight:550">Unidades</span>' + P.pil('unidade', UNIDADES, 0, 'pequenas', 6) +
          '<button type="button" class="reg" data-acao="abre" data-k="detalhesSub" style="box-shadow:none">' + A.ic('documento') + '<span class="meio" style="text-align:left"><b>Detalhes adicionais <span class="fraco" style="font-weight:500">(opcional)</span></b><small>Marca, concentração ou observações</small></span>' + A.ic(E.aberto.detalhesSub ? 'cima' : 'baixo') + '</button>' +
          (E.aberto.detalhesSub ? '<textarea class="campo" style="height:56px" placeholder="Marca, concentração ou observações"></textarea>' : '') +
          '<label class="campo-rot">Horário <span class="fraco">(opcional)</span><div class="campo-ic forte">' + A.ic('relogio') + '<input value="16:00" inputmode="numeric" aria-label="Horário"></div></label>' +
          P.botaoVerde('Adicionar registro', 'add-sub') + '</section>' +
        P.aviso('Para cigarros eletrônicos, você pode registrar sessões ou tragadas, sem precisar adivinhar.', 'bege') +
        '<h2 class="titulo-secao">Registros de hoje</h2><div class="lista-reg">' + E.tabaco.map(function (x, i) { return P.reg(x[0], x[1], x[2] + ' • ' + x[3], '', ['tabaco', i]); }).join('') + '</div>' : '') +
      '<div class="bloco"><h3>Observações <span class="fraco">(opcional)</span></h3><textarea class="campo" placeholder="Quer acrescentar algo?"></textarea></div>' +
      P.salvar('Salvar registros do dia', 'Registros do dia salvos. Só a equipe que cuida de você vê.') +
      '<button type="button" class="link-centro" data-acao="whats" data-area="Atendimento">Solicitar contato com a equipe</button>' + P.ficha();
  };
  P.ACOES['add-sub'] = function () {
    var t = TIPOS[P.escolhido('tipoSub', 0)], u = UNIDADES[P.escolhido('unidade', 0)].toLowerCase(), q = E.num.qtd;
    var campo = document.querySelector('.form-cartao input.campo'), nome = (campo && campo.value.trim()) || t[1];
    E.tabaco.push([t[0], P.esc(nome).slice(0, 60), q + ' ' + (q === 1 ? u.replace(/s$/, '').replace(/õe$/, 'ão') : u), P.hora()]); P.render(true); P.avisoCurto('Registro adicionado.');
  };
  document.addEventListener('change', function (ev) { if (ev.target.matches && ev.target.matches('select[data-acao="unidade"]')) { E.esc.unidade = ev.target.selectedIndex; P.render(true); } });

  // ===== Meus medicamentos =====
  var VITAMINAS = ['Vitamina B12', 'Complexo B', 'Vitamina C', 'Vitamina D', 'Vitaminas ADEK', 'BCAA', 'E11'];
  T.medicamentos = function () {
    var novo = P.escolhido('medNovo', 0), abM = E.aberto.mounjaro;
    var rx = [['calendario', 'Dose prescrita (mg)'], ['frasco', 'Concentração (mg/ml)'], ['seringa', 'UI por aplicação'], ['caixa', 'Apresentação e dispositivo']];
    return P.cab('medicamentos', 'Meus medicamentos', 'Seu uso diário e o acompanhamento na clínica', A.item([153, 124, 125, 90])) +
      '<section class="bloco"><div style="display:flex;gap:10px;align-items:flex-start"><div style="flex:1;display:grid;gap:4px"><h3 style="font-size:20px">Medicamentos de uso diário</h3><p class="subtitulo" style="font-size:14.5px">Informe os medicamentos que você usa todos os dias</p></div>' + A.ilu('medicamentos', 92) + '</div>' +
        '<button type="button" class="botao salvar" style="justify-content:center;gap:10px" data-acao="abre" data-k="medDiario">' + A.ic('mais') + 'Adicionar medicamento</button>' +
        (E.aberto.medDiario ? '<div class="tres-col" style="font-size:12.5px"><label class="campo-rot">Nome do medicamento<div class="campo-ic">' + A.ic('pilula') + '<input placeholder="Nome"></div></label>' +
          '<label class="campo-rot">Dose e unidade<div class="campo-ic">' + A.ic('frasco') + '<input placeholder="Conforme sua prescrição"></div></label>' +
          '<label class="campo-rot">Frequência e horários<div class="campo-ic">' + A.ic('relogio') + '<input placeholder="Como você utiliza"></div></label></div>' +
          '<button type="button" class="botao" data-acao="aviso" data-msg="Medicamento enviado para a equipe conferir.">Salvar medicamento</button>' : '') +
        '<div class="lista-reg">' + [['Remédio de uso diário (exemplo)', 'café da manhã'], ['Vitamina D oral (exemplo)', 'almoço']].map(function (m) {
          return '<div class="reg" style="box-shadow:none">' + A.ilu('medicamentos', 34) + '<div class="meio"><b>' + m[0] + '</b><small>' + m[1] + ' · conforme sua prescrição</small></div><button type="button" class="mini-botao" data-acao="tomei">Tomei</button></div>';
        }).join('') + '</div><p class="fraco" style="font-size:12px">O app não sugere nem calcula dose: você registra o que já usa, e a equipe confere.</p></section>' +
      '<section class="bloco"><div class="linha-pergunta"><div style="flex:1"><h3>Começou algum medicamento novo?</h3><p class="subtitulo" style="font-size:14px;margin:0">Conte à equipe o que mudou.</p></div>' +
        '<div class="sim-nao">' + ['Sim', 'Não'].map(function (t, i) { return '<button type="button" class="radio-cartao' + (novo === i ? ' sel' : '') + '" data-acao="esc" data-g="medNovo" data-v="' + i + '">' + t + '</button>'; }).join('') + '</div></div>' +
        '<button type="button" class="botao botao-contorno" style="width:100%" data-acao="aviso" data-msg="Conte o nome e desde quando usa. A equipe confere e atualiza sua ficha.">' + A.ic('mais') + 'Informar medicamento novo</button></section>' +
      '<section class="bloco verde" style="gap:12px"><div><h3 style="font-size:20px">Medicamentos aplicados na clínica</h3><p class="subtitulo" style="font-size:14px;margin:0">Prescrição e programação atualizadas pela equipe.</p></div>' +
        '<div class="bloco acordeao" style="box-shadow:none"><button type="button" class="cab-acordeao" data-acao="abre" data-k="mounjaro" aria-expanded="' + !!abM + '">' + A.ilu('caneta', 70) + '<span class="meio"><b style="font-size:20px;font-weight:750">Mounjaro / tirzepatida</b><br><span class="fraco" style="font-size:12px">Exemplo · cadastrado pela clínica ' + A.item(124) + '</span></span>' + A.ic(abM ? 'cima' : 'baixo') + '</button>' +
        (abM ? '<b style="font-size:14px">Sua prescrição</b><div class="caixa-tabela" style="box-shadow:none;padding:4px 10px">' + rx.map(function (r) {
            return '<div class="lin-rx">' + A.ic(r[0]) + '<span class="meio">' + r[1] + '</span>' + P.cadeado(r[1].indexOf('UI') === 0 ? 'Preenchidas pela equipe' : r[1].indexOf('Apresentação') === 0 ? 'Informados pela equipe' : 'Preenchida pela equipe') + '</div>';
          }).join('') +
          '<div class="lin-rx" style="background:color-mix(in srgb,var(--dourado) 14%,transparent);margin:4px -10px -4px;padding:10px">' + A.ic('evolucao') + '<span class="meio"><span class="fraco" style="font-size:12px">Fase do acompanhamento</span><br><b>Desmame</b></span><span class="fraco" style="font-size:12.5px">Definida pelo médico ' + A.item(155) + '</span></div></div>' +
          '<b style="font-size:14px">Programação semanal</b><div class="caixa-tabela" style="box-shadow:none;padding:4px 10px">' + [1, 2, 3].map(function (n) { return '<div class="lin-rx">' + A.ic('calendario') + '<span class="meio">Semana ' + n + '</span>' + P.cadeado('UI conforme prescrição') + '</div>'; }).join('') + '</div>' +
          P.aviso('A redução, quando indicada, é programada pela equipe. O app não calcula dose. ' + A.item(125)) +
          '<a class="botao botao-contorno" href="#picadinha" style="width:100%;text-decoration:none">Ver minha programação ' + A.ic('seta') + '</a>' : '') + '</div>' +
        '<div class="bloco" style="box-shadow:none;gap:8px"><div class="linha-ic">' + A.ilu('seringa', 46) + '<div class="meio"><h3>Vitaminas e outros injetáveis</h3><p class="mudo" style="font-size:13px">Aplicações prescritas e registradas pela equipe. ' + A.item(90) + '</p></div></div>' +
          '<p style="font-size:13px">Aqui aparecem os itens prescritos para você.</p>' +
          VITAMINAS.map(function (v, i) {
            var k = i ? 'vit-' + i : 'b12', ab = E.aberto[k];
            return '<div class="caixa-tabela" style="box-shadow:none"><button type="button" class="reg" style="box-shadow:none;border:0;width:100%;text-align:left" data-acao="abre" data-k="' + k + '">' + A.ilu('frasco', 30) + '<b class="meio">' + v + '</b>' + A.ic(ab ? 'cima' : 'seta') + '</button>' +
              (ab ? '<div style="padding:0 12px 12px;display:grid;gap:10px"><div class="tres-col" style="font-size:12.5px">' +
                '<div style="display:grid;gap:4px">Dose e apresentação' + P.cadeado('Conforme prescrição') + '</div><div style="display:grid;gap:4px">Via de administração' + P.cadeado('Definida pela equipe') + '</div><div style="display:grid;gap:4px">Próxima aplicação' + P.cadeado('Quando agendada') + '</div></div>' +
                '<button type="button" class="botao botao-contorno" style="height:38px;font-size:13.5px" data-acao="aviso" data-msg="Histórico: aplicada na clínica em {d:-19} pela Eduarda (exemplo).">' + A.ic('documento') + 'Ver histórico de aplicações</button></div>' : '') + '</div>';
          }).join('') + '</div></section>' +
      '<section class="bloco"><div class="linha-pergunta"><div style="flex:1"><h3>Registrar medicamento utilizado</h3><p class="subtitulo" style="font-size:13.5px;margin:0">Informe o que você já tomou ou aplicou.</p></div>' +
        '<button type="button" class="botao botao-contorno" data-acao="aviso" data-msg="Registro enviado para a equipe conferir.">' + A.ic('mais') + 'Adicionar registro</button></div>' +
        '<b style="font-size:14px">Observações para a equipe <span class="fraco" style="font-weight:400">(opcional)</span></b><div class="campo-ic">' + A.ic('documento') + '<input placeholder="Escreva suas observações aqui..."></div></section>' +
      P.contato('Solicitar contato com a equipe', 'Enfermagem') +
      '<div class="lista-menu cartao" style="padding:4px 16px"><div class="lin-menu">' + A.bolha('relogio', 'var(--c3)') + '<span class="meio"><b>Lembrete dos remédios</b><small>na hora de cada um</small></span>' + A.item(160) + '<button type="button" class="chave on" data-acao="chave" aria-label="Ligar ou desligar"></button></div></div>' + P.ficha();
  };

  // ===== Minha picadinha =====
  T.picadinha = function () {
    var onde = P.escolhido('ondeAplic', 1), local = P.escolhido('localAplic', 0);
    return P.cab('picadinha', 'Minha picadinha', 'Sua programação e seus registros', A.item([124, 125, 126, 127])) +
      '<section class="bloco verde"><div style="display:flex;gap:10px;align-items:flex-start">' + A.ilu('seringa', 108) + '<div style="flex:1;display:grid;gap:4px"><b style="font-size:18px">Próxima aplicação na clínica</b><span class="mudo">' + P.proxPicadinha() + '</span>' +
        '<b style="font-size:42px;letter-spacing:-.03em;line-height:1">14:30</b><span class="etiqueta verde" style="justify-self:start;font-size:13px">' + A.ic('pessoas') + 'Agendado pela equipe</span><span style="display:flex;gap:6px;align-items:center;font-size:14px">' + A.ic('local') + 'AG Melhor Versão</span></div></div>' +
        '<button type="button" class="botao-contato" data-acao="whats" data-area="Agendamentos">' + A.ic('balao') + '<span>Falar sobre meu agendamento</span>' + A.ic('seta') + '</button></section>' +
      '<div class="lista-menu cartao" style="padding:4px 16px"><div class="lin-menu">' + A.ilu('caneta', 40) + '<span class="meio"><b>Sua aplicação</b><small>dose, UI e volume</small></span>' + P.cadeado() + '</div>' +
        '<div class="lin-menu">' + A.bolha('relogio', 'var(--c3)') + '<span class="meio"><b>Lembrete da aplicação</b><small>no dia e 1 hora antes</small></span>' + A.item(126) + '<button type="button" class="chave on" data-acao="chave" aria-label="Ligar ou desligar"></button></div></div>' +
      '<div><h2 class="titulo-secao" style="font-size:26px">Já realizou a aplicação?</h2><p class="subtitulo" style="font-size:15px;margin:0">Registre a aplicação que você já fez</p></div>' +
      '<section class="bloco"><div class="duas-col"><label class="campo-rot">Data da aplicação<div class="campo-ic forte">' + A.ic('calendario') + '<input value="{a:0}" aria-label="Data"></div></label>' +
          '<label class="campo-rot">Horário<div class="campo-ic forte">' + A.ic('relogio') + '<input value="18:00" inputmode="numeric" aria-label="Horário"></div></label></div>' +
        '<span style="font-weight:550">Onde foi realizada?</span><div class="duas-col">' + [['clinica', 'Na clínica'], ['casa', 'Fora da clínica']].map(function (o, i) {
          return '<button type="button" class="radio-cartao' + (onde === i ? ' sel' : '') + '" data-acao="esc" data-g="ondeAplic" data-v="' + i + '">' + A.ic(o[0]) + o[1] + '</button>'; }).join('') + '</div>' +
        '<div class="linha-pergunta"><span style="font-weight:550">Local no corpo</span><button type="button" class="fraco" style="font-size:13px;display:flex;gap:4px;align-items:center" data-acao="abre" data-k="mapa"><span class="aviso-info" style="font-size:13px">Ver locais de aplicação</span>' + A.ic('seta') + '</button></div>' +
        '<div class="tres-col">' + [['abdome', 'Abdome'], ['coxa', 'Coxa'], ['braco', 'Braço']].map(function (o, i) {
          return '<button type="button" class="radio-cartao' + (local === i ? ' sel' : '') + '" data-acao="esc" data-g="localAplic" data-v="' + i + '" style="padding:10px 8px;gap:6px">' + A.ic(o[0]) + o[1] + '</button>'; }).join('') + '</div>' +
        (E.aberto.mapa ? '<div>' + corpo() + '<p class="mudo" style="font-size:12.5px;text-align:center;margin-top:6px">Última: <b>abdome, lado esquerdo</b> ({d:-5}). Toque no local de hoje. ' + A.item(127) + '</p></div>' : '') +
        '<label class="campo-rot">Observações <span class="fraco">(opcional)</span><textarea class="campo" style="height:56px" placeholder="Como foi a aplicação?"></textarea></label>' +
        '<button type="button" class="botao salvar" style="justify-content:center" data-acao="aviso" data-msg="Aplicação registrada. Como você se sentiu? Conte em Como me senti.">Registrar aplicação realizada</button>' +
        '<p class="aviso-info" style="justify-content:center;text-align:center">Seu registro informa o que já foi realizado. A programação é definida pela equipe.</p></section>' +
      '<h2 class="titulo-secao">Histórico de aplicações</h2><div class="lista-reg">' +
        '<a class="reg" href="#" data-acao="aviso" data-msg="Aplicação de {d:-7}: na clínica, registrada pela Thaís (exemplo).">' + A.ilu('calendario', 40) + '<div class="meio"><b>{d:-7} • 14:30</b><small>Na clínica • Registrado pela equipe</small></div>' + A.ic('seta') + '</a>' +
        '<a class="reg" href="#" data-acao="aviso" data-msg="Aplicação de {d:-14}: fora da clínica, informada por você (exemplo).">' + A.ilu('calendario', 40) + '<div class="meio"><b>{d:-14} • 18:00</b><small>Fora da clínica • Informado por você</small></div>' + A.ic('seta') + '</a></div>' +
      '<div class="lista-menu cartao" style="padding:4px 16px">' + P.linMenu('sintomas', 'termometro', 'var(--c6)', 'Como me senti', 'náusea, enjoo, intestino…', A.item([128, 129])) + '</div>' +
      P.contato('Solicitar contato com a enfermagem', 'Enfermagem') + P.ficha();
  };
  // Mapa do corpo para o rodízio (frente): abdômen em 4 partes, coxas e braços.
  function corpo() {
    var L = [['ab-se', 92, 112, 'AB'], ['ab-sd', 128, 112, 'AB'], ['ab-ie', 92, 138, 'AB'], ['ab-id', 128, 138, 'AB'], ['cx-e', 94, 210, 'CX'], ['cx-d', 126, 210, 'CX'], ['br-e', 56, 110, 'BR'], ['br-d', 164, 110, 'BR']];
    var s = '<div class="corpo"><svg viewBox="0 0 220 300" role="img" aria-label="Mapa do corpo">' +
      '<path class="silhueta" d="M110 14c13 0 22 10 22 23s-9 24-22 24-22-11-22-24 9-23 22-23zM78 70h64c14 0 24 9 27 22l14 64c2 8-9 11-12 4l-16-52-2 54 4 16-8 98c-1 9-15 9-16 0l-8-86h-6l-8 86c-1 9-15 9-16 0l-8-98 4-16-2-54-16 52c-3 7-14 4-12-4l14-64c3-13 13-22 27-22z"/>';
    L.forEach(function (p) {
      var cls = p[0] === 'ab-se' ? ' ultimo' : (E.local === p[0] ? ' sel' : '');
      s += '<circle class="local' + cls + '" data-acao="local" data-v="' + p[0] + '" cx="' + p[1] + '" cy="' + p[2] + '" r="11"/><text x="' + p[1] + '" y="' + (p[2] + 3) + '" text-anchor="middle">' + p[3] + '</text>';
    });
    return s + '</svg></div><div style="display:flex;gap:14px;justify-content:center;font-size:12px" class="mudo"><span><span class="ponto" style="background:var(--acento)"></span> última</span><span><span class="ponto" style="background:var(--primaria)"></span> hoje</span></div>';
  }
})();
