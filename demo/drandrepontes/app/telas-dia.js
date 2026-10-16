/* App do paciente · Início e "Meu dia": alimentação, plano alimentar, revistas, hidratação, sono, humor e atividade física.
   Cada tela segue o print de referência correspondente, com os marcadores de item do escopo. */
(function () {
  'use strict';
  var P = window.APP, A = P.A, E = P.E, T = P.TELAS, br = P.br;
  var LIMITES = { sonoH: [0, 14, 1], sonoM: [0, 55, 5], evac: [0, 10, 1], ativMin: [5, 240, 5], volume: [50, 2000, 50], qtd: [1, 60, 1], peso: [30, 250, 0.1], aguaOutra: [50, 2000, 50] };
  P.ACOES.passo = function (el, v, k) { var l = LIMITES[k] || [0, 999, 1]; E.num[k] = Math.round(Math.min(l[1], Math.max(l[0], E.num[k] + Number(v) * l[2])) * 10) / 10; P.render(true); };
  P.ACOES.setnum = function (el, v, k) { E.num[k] = Number(v); P.render(true); };

  function litros(ml) { return br(ml / 1000, 1); }
  function totalAgua() { return E.agua.reduce(function (s, x) { return s + x[3]; }, 0); }
  function minAtiv() { return E.atividades.reduce(function (s, x) { return s + x[2]; }, 0); }
  // Próxima aplicação na clínica (exemplo): a próxima terça, 14:30.
  function proxPicadinha(curto) { var t = A.datas.trocar('{x:p2}').split(', ')[1]; return A.datas.trocar('{Wl:p2}') + '-feira, ' + (curto ? A.datas.trocar('{d:p2}') : t); }
  P.proxPicadinha = proxPicadinha;
  function cartaoReg(href, ilu, titulo, linha2, linha3, itens) {
    return '<div class="cartao-ilu vertical">' + A.ilu(ilu, 66) + '<div class="meio"><h3>' + titulo + '</h3>' + (linha2 ? '<div class="valor">' + linha2 + '</div>' : '') + (linha3 ? '<div class="fraco" style="font-size:11.5px;line-height:1.2">' + linha3 + '</div>' : '') +
      '<a class="mini-botao" href="#' + href + '">' + A.ic('mais') + 'Registrar</a>' + (itens ? '<div>' + itens + '</div>' : '') + '</div></div>';
  }

  // ===== Início =====
  T.inicio = function () {
    var DT = A.datas, h = DT.hoje(), seg = DT.somaDias(h, -((h.getDay() + 6) % 7));
    var dias = [0, 1, 2, 3, 4, 5, 6].map(function (i) { var d = DT.somaDias(seg, i), k = DT.diasEntre(h, d); return '<span class="d' + (k < 0 ? ' feito' : '') + (k === 0 ? ' hoje' : '') + '" title="' + DT.semLongo(d) + '">' + DT.semCurto(d).charAt(0).toUpperCase() + '</span>'; }).join('');
    var humor = ['Estou muito mal', 'Estou mal', 'Neutro', 'Estou bem', 'Estou muito bem'][E.humor];
    return P.topoApp('') +
      '<div class="ola"><div><h1 class="titulo-pagina">Olá, ' + P.PACIENTE.nome + '</h1><p class="como">Como você está hoje?</p><p class="data">{X:0}</p></div>' +
        '<a class="botao-redondo" href="#avisos" aria-label="Avisos">' + A.ic('sino') + '<i></i></a><a class="botao-redondo" href="#perfil" aria-label="Meu perfil">' + A.ic('perfil') + '</a></div>' +
      '<div class="semana-mini">' + dias + '<span style="margin-left:4px">Sua semana</span>' + A.item(101) + '<span class="etiqueta verde">72 pontos hoje</span>' + A.item(102) + '</div>' +

      '<div class="grade-2">' +
        '<a class="cartao-ilu atalho" href="#plano">' + A.ilu('prancheta-prato', 58) + '<div class="meio"><h3>Meu plano alimentar</h3><span class="mudo">Seu cardápio personalizado</span>' + A.item(113) + '</div>' + A.ic('seta') + '</a>' +
        '<a class="cartao-ilu atalho" href="#revistas">' + A.ilu('livros', 58) + '<div class="meio"><h3>Revistas da clínica</h3><span class="mudo">Conteúdos para você</span>' + A.item(133) + '</div>' + A.ic('seta') + '</a>' +
      '</div>' +

      '<div class="secao-cab"><h2>Meu dia</h2>' + A.item([103, 104]) + '</div>' +
      '<div class="cartao-ilu quebra">' + A.ilu('prato-dia', 76) + '<div class="meio"><h3 style="font-size:19px">Alimentação</h3><span class="mudo" style="font-size:15px">' + br(E.kcal) + ' kcal hoje</span>' + '<div>' + A.item([106, 107, 108]) + '</div></div>' +
        '<div class="botoes-3"><a class="mini-botao claro" href="#alimentacao" data-acao="aviso" data-msg="Foto simulada: a IA encontrou arroz, feijão, frango e salada. Confira antes de salvar.">' + A.ic('camera') + 'Foto do prato</a>' +
        '<a class="mini-botao claro" href="#alimento">' + A.ic('barras') + 'Código de barras</a><a class="mini-botao claro" href="#alimentacao">' + A.ic('lapis') + 'Manual</a></div></div>' +
      '<div class="grade-2">' +
        cartaoReg('agua', 'copo-gota', 'Hidratação', litros(P.E.agua.reduce(function (s, x) { return s + x[3]; }, 0)) + ' de ' + litros(E.metaAgua) + ' L', 'Meta definida pela equipe', A.item(114)) +
        cartaoReg('sono', 'lua', 'Sono', E.num.sonoH + 'h' + (E.num.sonoM < 10 ? '0' : '') + E.num.sonoM, '', A.item(115)) +
        cartaoReg('humor', 'rosto-' + E.humor, 'Humor', humor, '', A.item(117)) +
        cartaoReg('atividade', 'tenis-corrida', 'Atividade física', minAtiv() + ' min', '', A.item(116)) +
      '</div>' +
      '<a class="cartao-ilu" href="#alimentacao">' + A.ilu('prato-proteina', 84) + '<div class="meio"><h3>Proteínas</h3><div style="font-size:22px;font-weight:700">' + E.prot + ' de ' + E.metaProt + ' g</div>' +
        '<div class="progresso"><i style="width:' + Math.min(100, Math.round(E.prot / E.metaProt * 100)) + '%"></i></div><span class="fraco" style="font-size:12px">Calculado a partir das refeições ' + A.item(112) + '</span></div></a>' +

      '<div class="secao-cab"><h2>Outros registros</h2>' + A.item([150, 151, 152]) + '</div>' +
      '<div class="grade-2">' + cartaoReg('fome', 'estomago', 'Fome e saciedade') + cartaoReg('intestino', 'intestino', 'Intestino') + cartaoReg('alcool', 'taca-branco', 'Álcool') + cartaoReg('substancias', 'tabaco', 'Tabaco e outras substâncias') + '</div>' +
      '<a class="cartao-ilu" href="#medicamentos">' + A.ilu('medicamentos', 62) + '<div class="meio"><h3>Meus medicamentos</h3><span class="mudo" style="font-size:12.5px">Uso diário, vitaminas e aplicações na clínica</span><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="mini-botao claro">Ver medicamentos ' + A.ic('seta') + '</span>' + A.item([153, 90]) + '</div></div></a>' +

      '<div class="cartao-ilu destaque">' + A.ilu('seringa', 92) + '<div class="meio"><h3 style="font-size:19px">Minha picadinha</h3><span class="fraco" style="font-size:12px">Agendado pela equipe</span>' +
        '<div style="font-size:17px;font-weight:600">' + proxPicadinha(true) + ' · 14:30</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap"><a class="mini-botao verde" href="#picadinha">Ver acompanhamento ' + A.ic('seta') + '</a><a class="mini-botao claro" href="#picadinha">Registrar aplicação ' + A.ic('seta') + '</a></div>' +
        '<div>' + A.item([124, 125, 126, 127]) + '</div></div></div>' +

      '<div class="secao-cab" style="display:block"><h2>Minha evolução</h2><p class="subtitulo" style="margin-top:0">Desde a primeira avaliação ' + A.item([119, 120]) + '</p></div>' +
      '<div class="grade-2">' +
        '<a class="cartao-ilu evo" href="#evolucao">' + A.ilu('musculo', 54) + '<div class="meio"><b class="grande">+1,2 kg</b><span class="mudo">Músculo ganho</span></div></a>' +
        '<a class="cartao-ilu evo" href="#evolucao">' + A.ilu('gordura', 54) + '<div class="meio"><b class="grande">−6,4 kg</b><span class="mudo">Gordura perdida</span></div></a>' +
        '<a class="cartao-ilu evo" href="#evolucao">' + A.ilu('corpo', 50) + '<div class="meio"><b>Gordura visceral</b><span class="mini-botao claro">Ver resultado ' + A.ic('seta') + '</span></div></a>' +
        '<a class="cartao-ilu evo" href="#evolucao">' + A.ilu('gota-mais', 50) + '<div class="meio"><b>Água corporal</b><span class="mini-botao claro">Ver resultado ' + A.ic('seta') + '</span></div></a>' +
      '</div>' +
      '<div class="cartao rodape-evolucao"><div>Peso atual<b>' + br(E.num.peso, 1) + ' kg</b></div><span class="sep"></span><div>Cintura<b>89 cm</b></div><a href="#evolucao">Ver evolução completa ' + A.ic('seta') + '</a></div>' +

      '<div class="secao-cab"><h2>Mais no app</h2></div>' +
      '<div class="lista-menu cartao" style="padding:4px 16px">' +
        P.linMenu('consultas', 'calendario', 'var(--c3)', 'Minhas consultas', 'próxima: ' + E.consulta, A.item(130), 'calendario') +
        P.linMenu('ia', 'ia', 'var(--c4)', 'Assistente da AG Melhor Versão', 'IA · não substitui a equipe', A.item([143, 144])) +
        P.linMenu('sintomas', 'termometro', 'var(--c6)', 'Como me senti', 'depois da aplicação', A.item([128, 129])) +
        P.linMenu('ciclo', 'ciclo', 'var(--c6)', 'Ciclo menstrual', 'quando se aplica a você', A.item(154)) +
        P.linMenu('comunidade', 'comunidade', 'var(--c1)', 'Comunidade', 'desafios do grupo', A.item([139, 140])) +
        P.linMenu('perfil', 'perfil', 'var(--c2)', 'Meu perfil', 'metas, lembretes, privacidade', A.item(100), 'avatar') +
      '</div>' +
      '<div style="display:grid;gap:8px;justify-items:center;padding:6px 0 4px">' +
        '<div class="lojas"><span class="chip">' + A.item(141) + ' App Store · em breve</span><span class="chip">' + A.item(142) + ' Google Play · em breve</span></div>' +
        '<div class="fraco" style="font-size:11.5px;text-align:center">Hoje: instalável na tela inicial ' + A.item(94) + ' · barra de baixo ' + A.item(104) + '</div>' +
      '</div>';
  };

  // ===== Alimentação =====
  var REFEICOES = [['prato-cafe', 'Café da manhã', '08:00', 'Pão, ovos e café', 350, 18], ['prato-almoco', 'Almoço', '12:30', 'Arroz, feijão, frango e salada', 650, 35], ['tigela', 'Lanche da tarde', '16:00', 'Iogurte e fruta', 250, 12]];
  T.alimentacao = function () {
    return P.cab('alimentacao', 'Minha alimentação', 'Registre suas refeições de um jeito simples.', A.item([106, 107, 108, 112])) +
      P.dataCartao('cal') +
      '<div class="grade-2">' +
        '<div class="cartao-ilu">' + A.ilu('fogo', 56) + '<div class="meio"><b>Calorias</b><div style="font-size:21px;font-weight:800;letter-spacing:-.02em;white-space:nowrap">' + br(E.kcal) + ' kcal</div><span class="mudo">Consumidas hoje</span></div></div>' +
        '<div class="cartao-ilu">' + A.ilu('prato-proteina', 56) + '<div class="meio"><b>Proteínas</b><div style="font-size:19px;font-weight:800;white-space:nowrap">' + E.prot + ' de ' + E.metaProt + ' g</div><div class="progresso" style="height:9px"><i style="width:' + Math.round(E.prot / E.metaProt * 100) + '%"></i></div><span class="fraco" style="font-size:11px">Calculadas pelas refeições ' + A.item(112) + '</span></div></div>' +
      '</div>' +
      '<h2 class="titulo-secao">Adicionar refeição</h2>' +
      '<div class="opcoes-cartao" style="--n:3">' +
        '<button type="button" data-acao="aviso" data-msg="Foto simulada: a IA encontrou arroz, feijão, frango e salada. Confira antes de salvar.">' + A.ilu('camera', 64) + '<b>Foto do prato</b><span class="mudo" style="font-size:12px">Fotografe sua refeição</span>' + A.item(107) + '</button>' +
        '<button type="button" data-acao="ir" data-v="alimento">' + A.ilu('codigo-barras', 64) + '<b>Código de barras</b><span class="mudo" style="font-size:12px">Escaneie um produto</span>' + A.item(108) + '</button>' +
        '<button type="button" data-acao="ir" data-v="alimento">' + A.ilu('lapis', 64) + '<b>Manual</b><span class="mudo" style="font-size:12px">Busque alimentos e porções</span>' + A.item(106) + '</button>' +
      '</div>' + P.aviso('Confira os alimentos e as porções antes de salvar.', 'caixa') +
      '<h2 class="titulo-secao">Refeições de hoje</h2>' +
      REFEICOES.map(function (r) {
        return '<div class="cartao-ilu">' + A.ilu(r[0], 74) + '<div class="meio"><h3>' + r[1] + '</h3><span>' + r[2] + '</span><span class="mudo">' + r[3] + '</span></div>' +
          '<div style="display:grid;gap:5px;justify-items:start"><span class="etiqueta">' + A.ic('fogo') + '<b>' + r[4] + ' kcal</b></span><span class="etiqueta">' + A.ic('proteina') + '<b>' + r[5] + ' g</b>&nbsp;de proteína</span></div>' +
          '<button type="button" data-acao="aviso" data-msg="Editar ou apagar a refeição (exemplo)." aria-label="Mais opções" style="font-size:22px;padding:0 4px;color:var(--texto-2)">⋮</button></div>';
      }).join('') + P.aviso('Valores estimados · você pode ajustar.', 'caixa') +
      '<a class="cartao-ilu destaque" href="#plano">' + A.ilu('prancheta', 64) + '<div class="meio"><h3 style="font-size:19px">Meu plano alimentar</h3><span class="mudo">Consulte as orientações do seu nutricionista</span>' + A.item(113) + '</div><span class="mini-botao verde">Ver meu plano ' + A.ic('seta') + '</span></a>' + P.ficha();
  };
  P.ACOES.ir = function (el, v) { location.hash = '#' + v; };

  // ===== Plano alimentar =====
  var PLANO = [
    ['prato-cafe', 'Café da manhã', '07:00 – 09:00', [['Pão integral', '2 fatias'], ['Ovos', '2 unidades'], ['Mamão', '1 fatia']], 'Pão integral ↔ tapioca pequena · ovos ↔ queijo branco'],
    ['prato-almoco', 'Almoço', '12:00 – 14:00', [['Arroz cozido', '100 g'], ['Feijão', '1 concha pequena'], ['Frango grelhado', '120 g'], ['Salada', 'conforme orientação']], 'Frango ↔ peixe ou carne magra · arroz ↔ batata-doce'],
    ['tigela', 'Lanche da tarde', '15:00 – 17:00', [['Iogurte natural', '1 pote'], ['Fruta', '1 porção']], 'Iogurte ↔ 1 fruta + queijo branco'],
    ['prato-proteina', 'Jantar', '19:00 – 21:00', [['Frango ou ovos', '120 g ou 2 unidades'], ['Legumes', 'à vontade'], ['Salada', 'conforme orientação']], 'Frango ↔ omelete · legumes ↔ sopa de legumes'],
    ['prato-pouco', 'Ceia', 'Se prevista no seu plano', [['Chá sem açúcar', '1 xícara'], ['Castanhas', '3 unidades']], 'Castanhas ↔ 1 iogurte pequeno']
  ];
  T.plano = function () {
    return P.cab('plano', 'Meu plano alimentar', 'Seu cardápio personalizado.', A.item(113)) +
      '<div class="cartao" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + A.ilu('avatar', 56) + '<div style="flex:1;min-width:110px"><b style="font-size:18px">Felipe</b><div class="mudo">Nutricionista</div><div class="fraco" style="font-size:12px">Preparado para ' + P.PACIENTE.nome + '</div></div>' +
        '<div class="fraco" style="font-size:11.5px;display:flex;gap:6px;align-items:center">' + A.ic('calendario') + '<span>Atualizado em<br><b style="color:var(--texto)">{a:-5}</b></span></div>' +
        '<button type="button" class="botao botao-contorno" data-acao="aviso" data-msg="PDF do plano alimentar baixado (exemplo).">' + A.ic('download') + 'Baixar plano em PDF</button></div>' +
      PLANO.map(function (r, i) {
        var ab = E.aberto['pl-' + i], sub = E.aberto['sub-' + i];
        return '<section class="bloco acordeao"><button type="button" class="cab-acordeao" data-acao="abre" data-k="pl-' + i + '" aria-expanded="' + !!ab + '">' + A.ilu(r[0], 70) +
          '<span class="meio"><b style="font-size:20px;font-weight:750">' + r[1] + '</b><br><span class="mudo">' + r[2] + '</span>' + (ab ? '' : '<br><span class="fraco" style="font-size:12.5px">Toque para ver alimentos e porções.</span>') + '</span>' + A.ic(ab ? 'cima' : 'baixo') + '</button>' +
          (ab ? '<div class="caixa-tabela" style="box-shadow:none">' + r[3].map(function (x) { return '<div class="lin-rx" style="padding:7px 12px"><span class="meio"><b style="font-weight:600">' + x[0] + '</b></span><span class="mudo">• ' + x[1] + '</span></div>'; }).join('') + '</div>' +
            '<button type="button" class="botao-contato bege" data-acao="abre" data-k="sub-' + i + '" style="height:40px;background:var(--verde-claro)">' + A.ic('ciclo') + '<span>Ver substituições</span>' + A.ic(sub ? 'cima' : 'seta') + '</button>' +
            (sub ? '<p class="mudo" style="font-size:13.5px;padding:0 4px">' + r[4] + '</p>' : '') : '') + '</section>';
      }).join('') +
      '<section class="bloco verde"><div class="linha-ic">' + A.ilu('prancheta', 60) + '<div class="meio"><h3 style="font-size:19px">Orientações do Felipe</h3><p class="mudo" style="font-size:13px">As porções e substituições seguem o seu plano individual.</p></div></div>' +
        '<ul style="margin:0;padding-left:20px;font-size:13.5px;display:grid;gap:4px"><li>Confira as opções de troca de cada refeição.</li><li>Registre o que você comeu em Minha alimentação.</li></ul>' +
        P.contato('Solicitar contato com Felipe', 'Nutrição') + '</section>';
  };

  // ===== Revistas =====
  var REV = [['revista-nutri', 'Dicas nutricionais', 'Alimentação e hábitos no dia a dia'], ['revista-psico', 'Dicas psicológicas', 'Emoções, comportamento e autocuidado'], ['revista-medica', 'Dicas médicas', 'Saúde e orientações para sua jornada']];
  var ARTIGOS = [
    [['Proteína no café da manhã: por que ajuda na saciedade', 'Felipe · 4 min'], ['Omelete de forno com legumes', 'Felipe · vídeo 3 min'], ['Como montar o prato do almoço', 'Felipe · 5 min']],
    [['Fome emocional: como perceber e o que fazer', 'Maria Clara · 6 min'], ['Pequenas metas, grandes mudanças', 'Maria Clara · 4 min']],
    [['O que esperar nas primeiras semanas de tratamento', 'Dr. André · 5 min'], ['Sono e emagrecimento: o que a ciência diz', 'Dr. André · 6 min']]
  ];
  T.revistas = function () {
    return P.cab('revistas', 'Revistas da clínica', 'Conteúdos para cuidar de você', A.item(133)) +
      REV.map(function (r, i) {
        return '<div class="cartao-ilu" style="padding:16px">' + A.ilu(r[0], 116) + '<div class="meio" style="gap:8px"><h3 style="font-size:23px;font-weight:800">' + r[1] + '</h3><span class="mudo" style="font-size:15px">' + r[2] + '</span>' +
          '<button type="button" class="mini-botao" data-acao="revcat" data-v="' + i + '" style="height:42px;justify-content:space-between;font-size:15px">Explorar revistas ' + A.ic('seta') + '</button></div></div>';
      }).join('') +
      '<div class="cartao-ilu">' + A.ilu('livro-aberto', 56) + '<span class="mudo" style="border-left:1px solid var(--linha);padding-left:12px">Escolha uma categoria para ver as edições disponíveis.</span></div>';
  };
  P.ACOES.revcat = function (el, v) { E.revCat = Number(v); location.hash = '#revista'; };
  T.revista = function () {
    var r = REV[E.revCat] || REV[0];
    return P.cab('revista', r[1], r[2], A.item(133)) + ARTIGOS[E.revCat].map(function (x) {
      return '<a class="cartao-ilu" href="#" data-acao="aviso" data-msg="Abre a edição (conteúdo de exemplo).">' + A.ilu(r[0], 60) + '<div class="meio"><h3>' + x[0] + '</h3><span class="fraco" style="font-size:12.5px">' + x[1] + '</span></div>' + A.ic('seta') + '</a>';
    }).join('');
  };

  // ===== Hidratação =====
  var COPOS = [['copo', 'Copo de água', 200], ['copo-grande', 'Copo grande', 300], ['garrafinha', 'Garrafinha', 500], ['copo-doutor', 'Copo do Doutor', 1200]];
  T.agua = function () {
    var tot = totalAgua(), p = Math.min(1, tot / E.metaAgua), falta = Math.max(0, E.metaAgua - tot);
    return P.cab('agua', 'Minha hidratação', 'Um toque para registrar sua água.', A.item([114, 132])) + P.dataCartao(true) +
      '<section class="bloco verde"><div class="total-dia">' + A.ilu('copo-gota', 110) + '<div style="flex:1;display:grid;gap:6px"><div class="grande">' + litros(tot) + ' <small>de ' + litros(E.metaAgua) + ' L</small></div>' +
        '<span class="mudo" style="font-size:14px">Meta diária definida pela equipe</span><div style="display:flex;align-items:center;gap:8px"><div class="progresso" style="flex:1"><i style="width:' + Math.round(p * 100) + '%"></i></div><span class="fraco" style="font-size:12px">' + br(p * 100, 1) + '%</span></div>' +
        '<span style="font-size:13.5px">' + (falta ? 'Faltam ' + litros(falta) + ' L para sua meta.' : 'Meta do dia alcançada!') + '</span></div></div></section>' +
      '<div><h2 class="titulo-secao" style="font-size:26px">Quanto você bebeu?</h2><p class="subtitulo" style="font-size:15px;margin-top:0">Toque na opção para somar ao total do dia.</p></div>' +
      '<div class="grade-2">' + COPOS.map(function (c) {
        return '<button type="button" class="cartao-ilu" style="padding:10px 8px;gap:6px" data-acao="agua" data-v="' + c[2] + '" data-k="' + c[0] + '" data-t="' + c[1] + '" style="text-align:left">' + A.ilu(c[0], 62) + '<span class="meio"><span style="font-size:13.5px;line-height:1.2">' + c[1] + '</span><b style="font-size:18px;white-space:nowrap">+' + br(c[2]) + ' ml</b></span>' +
          '<span style="width:30px;height:30px;border-radius:50%;background:var(--primaria);background-image:var(--botao-fundo);color:var(--sobre-primaria);display:grid;place-items:center;flex:none">' + A.ic('mais') + '</span></button>';
      }).join('') + '</div>' +
      (E.aberto.outraAgua ? '<section class="bloco"><h3>Outra quantidade</h3>' + P.passo('aguaOutra', br(E.num.aguaOutra || 100) + ' ml') +
        '<button class="botao" type="button" data-acao="agua" data-v="' + (E.num.aguaOutra || 100) + '" data-k="copo" data-t="Água">Adicionar</button></section>'
        : '<button type="button" class="botao botao-contorno" style="width:100%;height:48px;font-size:16px" data-acao="abre" data-k="outraAgua">' + A.ic('mais') + 'Adicionar outra quantidade</button>') +
      '<p class="fraco" style="text-align:center;font-size:12.5px">Registre a quantidade que você realmente bebeu.</p>' +
      '<h2 class="titulo-secao">Registros de hoje</h2>' +
      '<div class="lista-reg colada">' + E.agua.map(function (x, i) {
        return '<div class="reg">' + A.ilu(x[1], 30) + '<span class="mudo" style="min-width:42px">' + x[0] + '</span><span class="fraco">•</span><span class="meio">' + x[2] + '</span><b>+' + br(x[3]) + ' ml</b><button type="button" class="lixo" style="color:var(--texto-2)" data-acao="del" data-k="agua" data-v="' + i + '" aria-label="Apagar">' + A.ic('lixo') + '</button></div>';
      }).join('') + '</div>' +
      (E.agua.length ? '<button type="button" class="link-centro" data-acao="desfazer-agua">' + A.ic('desfazer', 'fraco').replace('class="ic', 'style="display:inline;width:16px;height:16px;vertical-align:-3px" class="ic') + ' Desfazer último registro</button>' : '') +
      '<div class="lista-menu cartao" style="padding:4px 16px"><div class="lin-menu">' + A.bolha('relogio', 'var(--c3)') + '<span class="meio"><b>Lembrete de água</b><small>a cada 2 horas, das 8h às 20h</small></span>' + A.item(132) + '<button type="button" class="chave on" data-acao="chave" aria-label="Ligar ou desligar"></button></div></div>' + P.ficha();
  };
  P.ACOES.agua = function (el, v, k) { E.agua.push([P.hora(), k, el.dataset.t, Number(v)]); E.aberto.outraAgua = false; P.render(true); P.avisoCurto('+' + br(Number(v)) + ' ml registrados.'); };
  P.ACOES['desfazer-agua'] = function () { var x = E.agua.pop(); P.render(true); if (x) P.avisoCurto('Desfeito: ' + x[2] + ' (' + br(x[3]) + ' ml).'); };

  // ===== Sono =====
  T.sono = function () {
    var DT = A.datas, ontem = DT.somaDias(DT.hoje(), -1), hoje = DT.hoje();
    var noite = 'Noite de ' + ontem.getDate() + (ontem.getMonth() === hoje.getMonth() ? '' : ' de ' + DT.mes(ontem)) + ' para ' + hoje.getDate() + ' de ' + DT.mes(hoje);
    var acordou = P.escolhido('acordou', 1);
    return P.cab('sono', 'Meu sono', 'Como foi sua noite?', A.item([115, 162])) + P.dataCartao(false, noite) +
      '<section class="bloco"><div style="display:flex;gap:10px;align-items:center">' + A.ilu('lua', 96) + '<div style="flex:1;display:grid;gap:4px"><b>Horas dormidas</b><div style="font-size:36px;font-weight:800;letter-spacing:-.03em;line-height:1;white-space:nowrap">' + E.num.sonoH + ' h ' + E.num.sonoM + ' min</div></div></div>' +
        '<div class="duas-col"><div style="display:grid;gap:4px;font-size:12px;text-align:center" class="mudo">Horas' + P.passo('sonoH', E.num.sonoH, 'Horas') + '</div><div style="display:grid;gap:4px;font-size:12px;text-align:center" class="mudo">Minutos' + P.passo('sonoM', E.num.sonoM, 'Minutos') + '</div></div>' +
        '<p class="fraco" style="font-size:12px">Pode vir sozinho do Apple Saúde ou do Google ' + A.item(162) + '</p></section>' +
      '<section class="bloco"><h3>Você acordou durante a noite?</h3>' + P.pil('acordou', ['Não', 'Sim'], 1) +
        (acordou === 1 ? '<span style="color:var(--texto-2);font-size:14px">Quantas vezes?</span>' + P.pil('vezes', ['1 vez', '2 vezes', '3 ou mais'], 0) : '') + '</section>' +
      '<section class="bloco"><h3>Como você acordou?</h3>' + P.cartoes('acordar', [['cansado', 'Cansado(a)'], ['rosto-2', 'Mais ou menos'], ['rosto-3', 'Disposto(a)']], 2, 3, 58) + '</section>' +
      '<section class="bloco"><h3>Sentiu que o sono foi reparador?</h3>' + P.pil('reparador', ['Não', 'Em parte', 'Sim'], 2) + '</section>' +
      P.obs('Quer acrescentar algo?', 'Conte como foi sua noite...') + P.salvar('Salvar meu sono', 'Sono registrado. Boa noite de descanso!') +
      '<h2 class="titulo-secao">Últimas noites</h2><div class="lista-reg colada">' +
        P.regLink('lua', '{d:-3}', '7 h', '#', 'Registro de {d:-3} (exemplo).') + P.regLink('lua', '{d:-2}', '6 h 30 min', '#', 'Registro de {d:-2} (exemplo).') + '</div>' + P.ficha();
  };

  // ===== Humor =====
  var EMOCOES = [['sol', 'Alegria'], ['folha', 'Tranquilidade'], ['ondas', 'Ansiedade'], ['nuvem', 'Tristeza'], ['raio', 'Irritação'], ['lua', 'Cansaço']];
  var HUMORES = ['Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem'];
  T.humor = function () {
    var m = E.multi.emocoes || [];
    return P.cab('humor', 'Meu humor', 'Como você está se sentindo hoje?', A.item(117)) + P.dataCartao(false) +
      '<section class="bloco"><h3>Como está seu humor agora?</h3><div class="opcoes-cartao humor-rostos" style="grid-template-columns:repeat(6,minmax(0,1fr))">' +
        HUMORES.map(function (t, i) { return '<button type="button" data-acao="humor" data-v="' + i + '" class="' + (E.humor === i ? 'sel' : '') + '" aria-pressed="' + (E.humor === i) + '" style="grid-column:' + (i === 3 ? '2 / span 2' : 'span 2') + '">' + A.ilu('rosto-' + i, 62) + '<span>' + t + '</span></button>'; }).join('') + '</div></section>' +
      '<section class="bloco"><div><h3>Quais emoções estão presentes?</h3><p class="mudo" style="font-size:13.5px">Você pode marcar mais de uma.</p></div><div class="pilulas" style="--n:3">' +
        EMOCOES.map(function (e, i) { var s = m.indexOf(i) >= 0; return '<button type="button" data-acao="multi" data-k="emocoes" data-v="' + i + '" class="' + (s ? 'sel' : '') + '" aria-pressed="' + s + '" style="display:flex;align-items:center;justify-content:center;gap:6px">' + A.ic(e[0]) + e[1] + '</button>'; }).join('') + '</div></section>' +
      '<section class="bloco"><div class="linha-pergunta"><h3>Quer contar um pouco sobre seu dia?</h3><span class="selo-bege">Opcional</span></div><textarea class="campo" placeholder="O que influenciou como você se sentiu?"></textarea>' +
        '<p class="mudo" style="font-size:12.5px">Compartilhe apenas o que se sentir à vontade para registrar.</p></section>' +
      P.salvar('Salvar meu humor', 'Humor registrado. Se a nota pedir atenção, a Maria Clara (psicóloga) é avisada.') +
      '<h2 class="titulo-secao">Meu histórico</h2><div class="lista-reg colada">' + P.regLink('rosto-2', '{d:-2}', 'Neutro', '#', 'Registro de {d:-2} (exemplo).') + P.regLink('rosto-3', '{d:-1}', 'Bem', '#', 'Registro de {d:-1} (exemplo).') + P.regLink('rosto-' + E.humor, '{d:0}', HUMORES[E.humor], '#', 'Registro de hoje (exemplo).') + '</div>' +
      P.contato('Solicitar contato com Maria Clara', 'Psicologia', 'bege') + P.ficha();
  };
  P.ACOES.humor = function (el, v) { E.humor = Number(v); P.render(true); };

  // ===== Atividade física =====
  var ATIV = [['tenis', 'Caminhada'], ['tenis-corrida', 'Corrida'], ['haltere', 'Musculação'], ['bicicleta', 'Bicicleta'], ['oculos', 'Natação'], ['pessoa-ativa', 'Outra atividade']];
  var INTENS = ['Leve', 'Moderada', 'Intensa'];
  T.atividade = function () {
    var a = ATIV[P.escolhido('ativ', 0)];
    return P.cab('atividade', 'Minha atividade física', 'Registre cada atividade do seu dia.', A.item([116, 162])) + P.dataCartao(false) +
      '<section class="bloco"><div style="display:flex;align-items:center;gap:12px">' + A.ilu('tenis', 110) + '<div style="border-left:1px solid var(--linha);padding-left:16px;display:grid;gap:2px"><span style="font-size:15px">Tempo registrado hoje</span>' +
        '<b style="font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1">' + minAtiv() + ' min</b><span class="mudo">' + E.atividades.length + (E.atividades.length === 1 ? ' atividade' : ' atividades') + '</span></div></div>' +
        '<p class="fraco" style="font-size:12px">Passos de hoje: 6.420 (Apple Saúde) ' + A.item(162) + '</p></section>' +
      '<h2 class="titulo-secao">Qual atividade você fez?</h2>' + P.cartoes('ativ', ATIV, 0, 3, 66) +
      '<section class="bloco form-cartao"><div class="topo-form">' + A.ilu(a[0], 48) + '<b>' + a[1] + '</b><span class="selo-bege">Novo registro</span></div>' +
        '<span>Duração</span><div style="display:grid;grid-template-columns:1.3fr 1fr;gap:8px;align-items:center">' + P.passo('ativMin', E.num.ativMin + ' min', 'Duração') +
        '<div class="chips-linha" style="--n:4">' + [15, 30, 45, 60].map(function (n) { return '<button type="button" data-acao="setnum" data-k="ativMin" data-v="' + n + '" class="' + (E.num.ativMin === n ? 'sel' : '') + '">' + n + '</button>'; }).join('') + '</div></div>' +
        '<span>Intensidade percebida</span>' + P.pil('intens', INTENS, 1) + '<p class="fraco" style="font-size:12px">Escolha como foi o esforço para você.</p>' +
        P.botaoVerde('Adicionar atividade', 'add-ativ') + '</section>' +
      '<h2 class="titulo-secao">Atividades de hoje</h2><div class="lista-reg">' + E.atividades.map(function (x, i) {
        return P.reg(x[0], x[1], x[2] + ' min &nbsp;<span class="etiqueta verde">' + x[3] + '</span>', '', ['atividades', i]);
      }).join('') + '</div>' + P.aviso('Você pode registrar mais de uma atividade no mesmo dia.') + P.obs('Observações', 'Quer acrescentar algo?') + P.ficha();
  };
  P.ACOES['add-ativ'] = function () {
    var a = ATIV[P.escolhido('ativ', 0)];
    E.atividades.push([a[0], a[1], E.num.ativMin, INTENS[P.escolhido('intens', 1)]]); P.render(true); P.avisoCurto(a[1] + ' · ' + E.num.ativMin + ' min registrados.');
  };
})();
