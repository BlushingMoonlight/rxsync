/* App do paciente · um único código; cada tela é uma função em TELAS e abre por #tela (ex.: #agua).
   Dados de exemplo fictícios. A IA é simulada (respostas prontas): nunca diagnostica nem prescreve,
   e o app nunca calcula dose (só mostra o que a clínica conferiu). */
(function () {
  'use strict';
  var A = window.AG;
  var PACIENTE = { nome: 'Marina', completo: 'Marina Lopes', id: 'P-DEMO7', fase: 'Fase 2 · Perda de peso' };
  var EQUIPE = [
    { nome: 'Dr. André Pontes Gonçalves', papel: 'Médico', ini: 'AG', cor: 'var(--c1)' },
    { nome: 'Thaís', papel: 'Enfermeira', ini: 'TH', cor: 'var(--c3)' },
    { nome: 'Eduarda', papel: 'Técnica de enfermagem', ini: 'ED', cor: 'var(--c4)' },
    { nome: 'Felipe', papel: 'Nutricionista', ini: 'FE', cor: 'var(--c2)' },
    { nome: 'Maria Clara', papel: 'Psicóloga', ini: 'MC', cor: 'var(--c6)' },
    { nome: 'Emanuele', papel: 'Administrativo e financeiro', ini: 'EM', cor: 'var(--c5)' },
    { nome: 'Elenice', papel: 'Concierge', ini: 'EL', cor: 'var(--c1)' }
  ];
  // Estado da demonstração (só na memória: recarregar volta ao começo).
  var E = { kcal: 1240, prot: 82, agua: 1600, humor: null, letra: false, porcao: 170, local: null, slot: null,
            consulta: '{Wl:u+5}, {d:u+5} · 09:30', chat: null, chatEquipe: null, check: [false, false, false] };

  var ABAS = [
    { id: 'inicio', nome: 'Início', ic: 'inicio' },
    { id: 'evolucao', nome: 'Evolução', ic: 'evolucao' },
    { id: 'picadinha', nome: 'Picadinha', ic: 'seringa' },
    { id: 'equipe', nome: 'Equipe', ic: 'equipe' },
    { id: 'perfil', nome: 'Perfil', ic: 'perfil' }
  ];
  // Cada tela interna diz de qual aba ela é (para a barra de baixo e o botão voltar).
  var PAI = {
    alimentacao: 'inicio', alimento: 'alimentacao', plano: 'alimentacao', agua: 'inicio', sono: 'inicio', humor: 'inicio',
    atividade: 'inicio', fome: 'inicio', intestino: 'inicio', substancias: 'inicio', medicamentos: 'inicio', sintomas: 'picadinha',
    ciclo: 'inicio', medidas: 'evolucao', ia: 'inicio', avisos: 'inicio', consultas: 'inicio', comunidade: 'inicio',
    conquistas: 'perfil', revistas: 'equipe', chat: 'equipe', fotos: 'evolucao', documentos: 'evolucao', corpo: 'perfil',
    metas: 'perfil', lembretes: 'perfil', integracoes: 'perfil', pagamentos: 'perfil', dados: 'perfil', acessibilidade: 'perfil',
    entrar: 'perfil', consentimento: 'perfil', tour: 'perfil'
  };
  var SEM_BARRA = { entrar: 1, consentimento: 1, tour: 1 };

  // ---------- peças ----------
  function cartao(c, classe) { return '<section class="cartao ' + (classe || '') + '">' + c + '</section>'; }
  function cab(titulo, itens, voltar) {
    return '<header class="cab"><a class="voltar sem-sublinhado" href="#' + (voltar || 'inicio') + '" aria-label="Voltar">' + A.ic('seta') + '</a><h1>' + titulo + '</h1></header>' +
      (itens ? '<div class="cab-itens">' + itens + '</div>' : '');
  }
  function sub(id, titulo, itens) { return cab(titulo, itens, PAI[id]); }
  function ficha() { return '<p class="nota-ficha">' + A.ic('documento') + 'Vai para a sua ficha na clínica ' + A.item(134) + '</p>'; }
  function linMenu(href, ic, cor, titulo, sub, itens) {
    return '<a class="lin-menu" href="#' + href + '">' + A.bolha(ic, cor) + '<span class="meio"><b>' + titulo + '</b><small>' + (sub || '') + '</small></span>' +
      (itens ? '<span class="itens">' + itens + '</span>' : '') + A.ic('seta', 'fraco') + '</a>';
  }
  function mini(o) {
    return '<a class="cartao mini sem-sublinhado" href="#' + o.href + '" style="color:inherit">' +
      '<div class="linha1">' + A.bolha(o.ic, o.cor) + '</div>' +
      '<div><div class="valor num">' + o.valor + '<small>' + o.unidade + '</small></div>' +
      '<div class="nome">' + o.nome + '</div>' + (o.selo ? '<div style="margin-top:6px">' + o.selo + '</div>' : '') + '</div>' +
      '<div class="barra" style="--cor:' + o.cor + '"><i style="width:' + Math.round(o.p * 100) + '%"></i></div></a>';
  }
  function escala(n, nomes, sel, acao, classe) {
    var h = '<div class="escala ' + (classe || '') + '" style="--n:' + n + '">';
    for (var i = 0; i < n; i++) h += '<button type="button" data-acao="' + acao + '" data-v="' + i + '" class="' + (sel === i ? 'sel' : '') + '">' + (nomes ? nomes[i] : i) + '</button>';
    return h + '</div>';
  }
  function opcoes(lista, acao, sel) {
    return '<div class="opcoes">' + lista.map(function (t, i) { return '<button type="button" data-acao="' + acao + '" data-v="' + i + '" class="' + ((sel || []).indexOf(i) >= 0 ? 'sel' : '') + '">' + t + '</button>'; }).join('') + '</div>';
  }
  function botaoSalvar(texto, msg) { return '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="' + (msg || 'Registrado. Obrigada!') + '">' + (texto || 'Salvar registro') + '</button>'; }
  function avatar(p, t) { return '<span class="avatar" style="background:' + p.cor + (t ? ';width:' + t + 'px;height:' + t + 'px' : '') + '">' + p.ini + '</span>'; }
  // Texto digitado pela pessoa: escapado antes de entrar no HTML.
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function br(n, d) { return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

  // Gráfico de linha de uma série só (o título diz o que é; sem legenda). Toque num ponto para ler o valor.
  function grafico(id, valores, rotulos, unidade, casas) {
    var w = 320, h = 150, pe = 22, pd = 10, pt = 14, pb = 22;
    var min = Math.min.apply(null, valores), max = Math.max.apply(null, valores), folga = (max - min) * 0.15 || 1;
    min -= folga; max += folga;
    var x = function (i) { return pe + i * (w - pe - pd) / (valores.length - 1); };
    var y = function (v) { return pt + (max - v) * (h - pt - pb) / (max - min); };
    var linha = valores.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var area = linha + ' L' + x(valores.length - 1).toFixed(1) + ' ' + (h - pb) + ' L' + pe + ' ' + (h - pb) + ' Z';
    var u = valores.length - 1;
    var s = '<div class="grafico" data-grafico="' + id + '" data-unidade="' + unidade + '" data-casas="' + (casas || 0) + '">' +
      '<div class="leitura"><span class="num" data-leitura>' + br(valores[u], casas) + '</span><span class="mudo" data-leitura-rot>' + unidade + ' · ' + rotulos[u] + '</span></div>' +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Gráfico">' +
      '<line class="eixo" x1="' + pe + '" x2="' + (w - pd) + '" y1="' + (h - pb) + '" y2="' + (h - pb) + '"/>' +
      '<path class="area" d="' + area + '"/><path class="serie" d="' + linha + '"/>';
    valores.forEach(function (v, i) {
      s += '<circle class="ponto' + (i === u ? ' sel' : '') + '" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="4"/>' +
        '<rect class="alvo" data-i="' + i + '" data-v="' + v + '" data-r="' + rotulos[i] + '" x="' + (x(i) - 14).toFixed(1) + '" y="0" width="28" height="' + h + '"/>';
      if (i === 0 || i === u || i === Math.floor(u / 2)) s += '<text x="' + x(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle">' + rotulos[i] + '</text>';
    });
    return s + '</svg></div>';
  }

  // ---------- telas ----------
  var TELAS = {
    // ===== Início =====
    inicio: function () {
      // Semana real (segunda a domingo), com hoje marcado e os dias anteriores registrados.
      var DT = A.datas, h = DT.hoje(), seg = DT.somaDias(h, -((h.getDay() + 6) % 7));
      var dias = [0, 1, 2, 3, 4, 5, 6].map(function (i) { var d = DT.somaDias(seg, i), k = DT.diasEntre(h, d); return [DT.semCurto(d), d.getDate(), k < 0 ? 1 : 0, k === 0 ? 1 : 0]; });
      var reg = [
        ['alimentacao', 'prato', 'var(--c2)', 'Alimentação'], ['agua', 'agua', 'var(--c3)', 'Água'], ['humor', 'humor', 'var(--c6)', 'Humor'],
        ['sono', 'sono', 'var(--c4)', 'Sono'], ['atividade', 'atividade', 'var(--c5)', 'Atividade'], ['fome', 'fome', 'var(--c2)', 'Fome e saciedade'],
        ['intestino', 'intestino', 'var(--c1)', 'Intestino'], ['sintomas', 'termometro', 'var(--c6)', 'Sintomas'], ['medicamentos', 'pilula', 'var(--c3)', 'Remédios'],
        ['substancias', 'copo', 'var(--c5)', 'Álcool e tabaco'], ['ciclo', 'ciclo', 'var(--c6)', 'Ciclo'], ['medidas', 'fita', 'var(--c1)', 'Peso e medidas']
      ];
      return '' +
        '<header class="topo topo-couro com-textura">' + A.logo({ tamanho: 40, texto: false }) +
          '<div class="saudacao"><div class="mudo" style="font-size:13px">{X:0}</div><h1>Olá, ' + PACIENTE.nome + '</h1></div>' +
          '<a class="sino sem-sublinhado" href="#avisos" aria-label="Avisos">' + A.ic('sino') + '<i></i></a>' +
        '</header>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="chip"><span class="ponto" style="background:var(--ok)"></span>' + PACIENTE.fase + '</span>' + A.item(155) + '</div>' +

        '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="rotulo">Sua semana</span>' + A.item(101) + '</div>' +
        '<div class="semana">' + dias.map(function (d) {
          return '<button class="dia' + (d[2] ? ' feito' : '') + (d[3] ? ' hoje' : '') + '" type="button"><small>' + d[0] + '</small><b>' + d[1] + '</b><i></i></button>';
        }).join('') + '</div></div>' +

        cartao('<div class="score">' +
          A.anel({ tamanho: 104, espessura: 10, valor: .72, centro: '<div><div class="num-grande num">72</div><div class="rotulo" style="font-size:9.5px">pontos</div></div>' }) +
          '<div style="flex:1;display:grid;gap:6px"><span class="rotulo">Score do dia</span>' +
          '<h2 style="font-size:19px">Faltam 3 registros para fechar o dia</h2>' +
          '<p class="mudo" style="font-size:13px">Almoço, água da tarde e humor.</p><div>' + A.item(102) + '</div></div></div>', 'cartao-destaque') +

        '<div style="display:flex;justify-content:space-between;align-items:center"><span class="rotulo">Hoje</span>' + A.item(103) + '</div>' +
        '<div class="resumo">' +
          mini({ href: 'alimentacao', ic: 'fogo', cor: 'var(--c2)', valor: br(E.kcal), unidade: ' / 1.600 kcal', nome: 'Calorias', p: E.kcal / 1600 }) +
          mini({ href: 'alimentacao', ic: 'proteina', cor: 'var(--c1)', valor: E.prot, unidade: ' / 110 g', nome: 'Proteínas', p: E.prot / 110 }) +
          mini({ href: 'agua', ic: 'agua', cor: 'var(--c3)', valor: br(E.agua / 1000, 1), unidade: ' / 2,5 L', nome: 'Água', p: E.agua / 2500 }) +
          mini({ href: 'sono', ic: 'sono', cor: 'var(--c4)', valor: '7h10', unidade: '', nome: 'Sono', p: .9, selo: A.item(162) }) +
          mini({ href: 'atividade', ic: 'atividade', cor: 'var(--c5)', valor: '6.420', unidade: ' passos', nome: 'Atividade', p: .64, selo: A.item(162) }) +
          mini({ href: 'humor', ic: 'humor', cor: 'var(--c6)', valor: E.humor == null ? '—' : ['Mal', 'Baixo', 'Ok', 'Bem', 'Ótimo'][E.humor], unidade: '', nome: 'Humor', p: E.humor == null ? 0 : (E.humor + 1) / 5 }) +
        '</div>' +

        cartao('<div class="cartao-titulo"><h3>Registrar</h3><span class="itens">' + A.item([150, 151, 152, 153, 154]) + '</span></div>' +
          '<div class="blocos">' + reg.map(function (r) { return '<a class="bloco" href="#' + r[0] + '">' + A.bolha(r[1], r[2]) + r[3] + '</a>'; }).join('') + '</div>') +

        cartao('<div class="cartao-titulo"><div class="linha-ic">' + A.bolha('ia', 'var(--primaria)') + '<div class="meio"><h3>Assistente da clínica</h3><div class="fraco" style="font-size:12px">IA · não substitui a equipe</div></div></div></div>' +
          '<div class="ia-balao">Marina, você ainda não registrou o almoço. Quer mandar uma foto do prato? Leva 10 segundos.</div>' +
          '<div class="acoes" style="margin-top:10px"><a class="botao sem-sublinhado" href="#alimentacao">' + A.ic('camera') + 'Foto do prato</a><a class="botao botao-claro sem-sublinhado" href="#ia">Conversar</a></div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap">' +
            '<div class="canal" role="group" aria-label="Canal da assistente"><button type="button" class="ativo" data-acao="canal">App</button><button type="button" data-acao="canal">WhatsApp</button></div>' +
            '<div class="itens">' + A.item([144, 163, 164]) + A.juridico('depende do parecer jurídico') + '</div></div>') +

        cartao('<a class="linha-ic sem-sublinhado" href="#picadinha" style="color:inherit">' + A.bolha('seringa', 'var(--c1)') +
          '<div class="meio"><span class="rotulo">Próxima picadinha</span><h3>{Wl:p4}, {d:p4} · 08:00</h3>' +
          '<div class="mudo" style="font-size:12.5px">Instrução conferida pela clínica. O app não calcula dose.</div></div>' + A.ic('seta', 'fraco') + '</a>' +
          '<div style="margin-top:10px">' + A.item([124, 125, 126]) + '</div>') +

        cartao('<a class="linha-ic sem-sublinhado" href="#consultas" style="color:inherit">' + A.bolha('calendario', 'var(--c3)') +
          '<div class="meio"><span class="rotulo">Próxima consulta</span><h3>' + E.consulta + '</h3>' +
          '<div class="mudo" style="font-size:12.5px">Retorno com o Dr. André · presencial</div></div>' + A.ic('seta', 'fraco') + '</a>' +
          '<div style="margin-top:10px">' + A.item(130) + '</div>') +

        cartao('<div class="cartao-titulo"><h3>Comunidade</h3><div class="itens">' + A.item([139, 140]) + '<span class="item">versão completa</span></div></div>' +
          '<div style="display:grid;gap:12px">' +
          '<div class="linha-ic"><span class="avatar" style="background:var(--c1)">LS</span><div class="meio"><b>Lu S.</b> <span class="mudo">completou 14 dias seguidos registrando</span></div></div>' +
          '<div class="linha-ic"><span class="avatar" style="background:var(--c2)">RP</span><div class="meio"><b>Rafa P.</b> <span class="mudo">entrou no desafio "10 mil passos"</span></div></div>' +
          '</div><a class="botao botao-claro sem-sublinhado" href="#comunidade" style="margin-top:12px;width:100%">Ver a comunidade</a>') +

        '<div style="display:grid;gap:8px;justify-items:center;padding:6px 0 4px">' +
          '<div class="lojas"><span class="chip">' + A.item(141) + ' App Store · em breve</span><span class="chip">' + A.item(142) + ' Google Play · em breve</span></div>' +
          '<div class="fraco" style="font-size:11.5px">Hoje: instalável na tela inicial ' + A.item(94) + ' · barra de baixo ' + A.item(104) + '</div>' +
        '</div>';
    },

    // ===== Alimentação =====
    alimentacao: function () {
      return sub('alimentacao', 'Alimentação', A.item([106, 107, 108, 112])) +
        cartao('<div class="cartao-titulo"><h3>Metas do Felipe (nutrição)</h3>' + A.item(112) + '</div>' +
          '<div style="display:grid;gap:12px">' +
          meta('Calorias', E.kcal, 1600, 'kcal', 'var(--c2)') + meta('Proteínas', E.prot, 110, 'g', 'var(--c1)') +
          meta('Carboidratos', 118, 160, 'g', 'var(--c3)') + meta('Fibras', 19, 25, 'g', 'var(--c5)') + '</div>') +
        '<div class="blocos" style="grid-template-columns:repeat(3,1fr)">' +
          '<a class="bloco" href="#alimento" data-acao="aviso" data-msg="Foto simulada: a IA encontrou arroz, feijão, frango e salada.">' + A.bolha('camera', 'var(--c2)') + 'Foto do prato ' + A.item(107) + '</a>' +
          '<a class="bloco" href="#alimento">' + A.bolha('barras', 'var(--c3)') + 'Código de barras ' + A.item(108) + '</a>' +
          '<a class="bloco" href="#alimento">' + A.bolha('mais', 'var(--c1)') + 'Buscar alimento ' + A.item(106) + '</a>' +
        '</div>' +
        cartao('<div class="cartao-titulo"><h3>Diário de hoje</h3><a href="#plano" class="item" style="text-decoration:none">ver plano · item 113</a></div>' +
          '<table class="tabela"><tr><td>Café · ovos mexidos, pão integral</td><td>380 kcal</td></tr><tr><td>Lanche · iogurte natural</td><td>110 kcal</td></tr>' +
          '<tr><td>Almoço · <span class="fraco">ainda não registrado</span></td><td>—</td></tr><tr><td>Jantar</td><td>—</td></tr></table>' +
          '<p class="fraco" style="font-size:12px;margin-top:8px">A foto do prato é lida pela IA ' + A.item(107) + '. O resultado sempre passa pela sua confirmação.</p>') + ficha();
    },
    alimento: function () {
      var g = E.porcao, f = g / 170;
      return sub('alimento', 'Iogurte natural integral', A.item([108, 109, 110, 111])) +
        cartao('<div class="linha-ic">' + A.bolha('barras', 'var(--c3)') + '<div class="meio"><b>Lido pelo código de barras</b><div class="fraco" style="font-size:12px">7890000000000 · produto de exemplo</div></div></div>') +
        cartao('<div class="cartao-titulo"><h3>O que tem</h3>' + A.item(109) + '</div>' +
          '<table class="tabela"><tr><td>Calorias</td><td>' + br(110 * f) + ' kcal</td></tr><tr><td>Proteínas</td><td>' + br(6.8 * f, 1) + ' g</td></tr>' +
          '<tr><td>Carboidratos</td><td>' + br(8.2 * f, 1) + ' g</td></tr><tr><td>Gorduras</td><td>' + br(5.4 * f, 1) + ' g</td></tr><tr><td>Fibras</td><td>0 g</td></tr></table>') +
        cartao('<div class="cartao-titulo"><h3>Quanto você comeu</h3>' + A.item(110) + '</div>' +
          opcoes(['Pote inteiro (170 g)', 'Meio pote', '100 g', '250 g'], 'porcao', [{ 170: 0, 85: 1, 100: 2, 250: 3 }[g]])) +
        '<button class="botao botao-cheio" type="button" data-acao="somar">Aceitar e somar ao dia</button>' +
        '<p class="nota-ficha">' + A.item(111) + ' Os valores entram no seu dia e no seu perfil.</p>';
    },
    plano: function () {
      var ref = [['Café da manhã', '2 ovos mexidos + 1 fatia de pão integral + café sem açúcar', 'Troca: iogurte natural + 2 col. de aveia'],
        ['Lanche', '1 fruta + 10 castanhas', 'Troca: 1 iogurte natural'], ['Almoço', 'Salada à vontade + 120 g de frango + 4 col. de arroz + 1 concha de feijão', 'Troca: peixe ou carne magra'],
        ['Lanche da tarde', 'Iogurte natural + 1 col. de chia', 'Troca: 1 fruta + queijo branco'], ['Jantar', 'Omelete de 2 ovos com legumes', 'Troca: sopa de legumes com frango']];
      return sub('plano', 'Plano alimentar', A.item(113)) +
        '<div class="chip" style="justify-self:start">' + A.ic('documento') + 'Montado pelo Felipe · válido até {d:+28}</div>' +
        ref.map(function (r) { return cartao('<span class="rotulo">' + r[0] + '</span><h3 style="font-size:15px;margin:6px 0 4px">' + r[1] + '</h3><p class="mudo" style="font-size:13px">' + r[2] + '</p>'); }).join('');
    },

    // ===== Hábitos =====
    agua: function () {
      return sub('agua', 'Água', A.item(114)) +
        cartao('<div style="display:grid;justify-items:center;gap:10px">' +
          A.anel({ tamanho: 170, espessura: 14, cor: 'var(--c3)', valor: E.agua / 2500, centro: '<div><div class="num" style="font-size:34px;font-weight:700">' + br(E.agua) + '</div><div class="fraco" style="font-size:12px">de 2.500 ml</div></div>' }) +
          '<div class="acoes" style="justify-content:center"><button class="botao" type="button" data-acao="agua" data-v="250">+ Copo 250 ml</button><button class="botao botao-claro" type="button" data-acao="agua" data-v="500">+ Garrafa 500 ml</button></div></div>') +
        cartao('<div class="cartao-titulo"><h3>Lembrete de água</h3>' + A.item(132) + '</div><div class="linha-ic"><div class="meio mudo" style="font-size:13.5px">A cada 2 horas, das 8h às 20h</div><span class="chave on"></span></div>') + ficha();
    },
    sono: function () {
      return sub('sono', 'Sono', A.item(115) + A.item(162)) +
        cartao('<span class="rotulo">Última noite</span><div class="num" style="font-size:40px;font-weight:700;margin:4px 0">7h10</div><p class="mudo">23:40 → 06:50 · veio do Apple Saúde</p>') +
        cartao('<div class="cartao-titulo"><h3>Como você dormiu?</h3></div>' + escala(5, ['😣', '😕', '😐', '🙂', '😴'], 3, 'marca', 'rosto')) +
        cartao('<div class="cartao-titulo"><h3>Horas por noite</h3></div>' + grafico('sono', [6.5, 7, 6.2, 7.4, 6.8, 7.5, 7.2], [-6, -5, -4, -3, -2, -1, 0].map(function (n) { return A.datas.semCurto(A.datas.somaDias(A.datas.hoje(), n)); }), 'h', 1)) + ficha();
    },
    humor: function () {
      return sub('humor', 'Humor', A.item(117)) +
        cartao('<div class="cartao-titulo"><h3>Como você se sente agora?</h3></div>' + escala(5, ['😞', '😕', '😐', '🙂', '😄'], E.humor, 'humor', 'rosto') +
          '<div style="display:flex;justify-content:space-between;margin-top:6px" class="fraco"><small>Mal</small><small>Ótimo</small></div>') +
        cartao('<div class="cartao-titulo"><h3>Quer contar algo?</h3><span class="fraco" style="font-size:12px">opcional</span></div><textarea class="campo" placeholder="Uma nota rápida sobre o seu dia"></textarea>') +
        botaoSalvar() + '<p class="fraco" style="font-size:12px;text-align:center">Se a nota pedir atenção, a Maria Clara (psicóloga) é avisada.</p>' + ficha();
    },
    atividade: function () {
      return sub('atividade', 'Atividade física', A.item(116) + A.item(162)) +
        cartao('<div class="cartao-titulo"><h3>Passos de hoje</h3><span class="chip" style="padding:4px 8px">' + A.ic('link') + 'Apple Saúde</span></div><div class="num" style="font-size:40px;font-weight:700">6.420</div><div class="barra" style="--cor:var(--c5);margin-top:8px"><i style="width:64%"></i></div><p class="fraco" style="font-size:12px;margin-top:6px">Meta: 10.000 passos</p>') +
        cartao('<div class="cartao-titulo"><h3>Registrar exercício</h3></div>' + opcoes(['Caminhada', 'Musculação', 'Corrida', 'Bicicleta', 'Pilates', 'Outro'], 'marca', [1]) +
          '<div style="margin-top:12px"><span class="rotulo">Duração</span>' + opcoes(['20 min', '30 min', '45 min', '1 h'], 'marca', [2]) + '</div>') + botaoSalvar() + ficha();
    },
    fome: function () {
      return sub('fome', 'Fome e saciedade', A.item(150)) +
        cartao('<div class="cartao-titulo"><h3>Fome antes de comer</h3></div>' + escala(6, ['0', '2', '4', '6', '8', '10'], 3, 'marca') + '<div style="display:flex;justify-content:space-between;margin-top:6px" class="fraco"><small>sem fome</small><small>muita fome</small></div>') +
        cartao('<div class="cartao-titulo"><h3>Saciedade depois</h3></div>' + escala(6, ['0', '2', '4', '6', '8', '10'], 4, 'marca') + '<div style="display:flex;justify-content:space-between;margin-top:6px" class="fraco"><small>ainda com fome</small><small>muito cheia</small></div>') +
        cartao('<div class="cartao-titulo"><h3>Qual refeição?</h3></div>' + opcoes(['Café', 'Lanche', 'Almoço', 'Lanche da tarde', 'Jantar', 'Beliscou'], 'marca', [2])) + botaoSalvar() + ficha();
    },
    intestino: function () {
      return sub('intestino', 'Intestino', A.item(151)) +
        cartao('<div class="cartao-titulo"><h3>Hoje</h3></div>' + opcoes(['Não evacuei', '1 vez', '2 vezes', '3 ou mais'], 'marca', [1])) +
        cartao('<div class="cartao-titulo"><h3>Como estava?</h3><span class="fraco" style="font-size:12px">escala de 1 a 7</span></div>' +
          escala(7, ['1', '2', '3', '4', '5', '6', '7'], 3, 'marca') + '<div style="display:flex;justify-content:space-between;margin-top:6px" class="fraco"><small>muito duro</small><small>líquido</small></div>') +
        cartao('<div class="cartao-titulo"><h3>Algo mais?</h3></div>' + opcoes(['Dor', 'Gases', 'Inchaço', 'Sangue', 'Nada'], 'marca', [4])) + botaoSalvar() +
        '<p class="fraco" style="font-size:12px;text-align:center">Mais de 3 dias sem evacuar ou sangue avisam a enfermagem.</p>' + ficha();
    },
    substancias: function () {
      return sub('substancias', 'Álcool, tabaco e outras', A.item(152)) +
        cartao('<div class="cartao-titulo"><h3>' + 'Álcool hoje' + '</h3>' + A.ic('copo', 'fraco') + '</div>' + opcoes(['Nada', '1 dose', '2 doses', '3 ou mais'], 'marca', [0])) +
        cartao('<div class="cartao-titulo"><h3>Tabaco ou cigarro eletrônico</h3>' + A.ic('cigarro', 'fraco') + '</div>' + opcoes(['Não uso', 'Menos de 5', '5 a 10', 'Mais de 10'], 'marca', [0])) +
        cartao('<div class="cartao-titulo"><h3>Outras substâncias</h3>' + A.ic('cadeado', 'fraco') + '</div><textarea class="campo" placeholder="Só a equipe que cuida de você vê"></textarea>') +
        botaoSalvar() + '<p class="fraco" style="font-size:12px;text-align:center">Sem julgamento: ajuda a equipe a cuidar melhor de você.</p>' + ficha();
    },
    medicamentos: function () {
      return sub('medicamentos', 'Remédios e vitaminas', A.item(153)) +
        cartao('<div class="cartao-titulo"><h3>Uso diário</h3><span class="fraco" style="font-size:12px">cadastrado pela clínica</span></div>' +
          '<div class="lista-menu" style="padding:0">' +
          tomar('Remédio de uso diário (exemplo)', '1 comprimido · café da manhã', true) + tomar('Vitamina D (exemplo)', '1 cápsula · almoço', false) + tomar('Ômega 3 (exemplo)', '1 cápsula · jantar', false) + '</div>') +
        cartao('<div class="cartao-titulo"><h3>Aplicados na clínica</h3><span class="itens">' + A.item(90) + '</span></div>' +
          '<table class="tabela"><tr><td>Complexo vitamínico (exemplo) · Thaís</td><td>{d:-5}</td></tr><tr><td>Vitamina B12 (exemplo) · Eduarda</td><td>{d:-19}</td></tr></table>') +
        cartao('<div class="cartao-titulo"><h3>Lembrete dos remédios</h3>' + A.item(132) + '</div><div class="linha-ic"><div class="meio mudo" style="font-size:13.5px">Na hora de cada um</div><span class="chave on"></span></div>') + ficha();
    },
    sintomas: function () {
      return sub('sintomas', 'Sintomas e efeitos', A.item([128, 129])) +
        cartao('<div class="cartao-titulo"><h3>O que você está sentindo?</h3></div>' + opcoes(['Náusea', 'Enjoo', 'Vômito', 'Intestino preso', 'Diarreia', 'Azia', 'Tontura', 'Dor no local', 'Cansaço'], 'marca', [0])) +
        cartao('<div class="cartao-titulo"><h3>Intensidade</h3></div>' + escala(3, ['Leve', 'Média', 'Forte'], 1, 'marca')) +
        cartao('<div class="linha-ic">' + A.bolha('alerta', 'var(--alerta)') + '<p class="meio" style="font-size:13.5px">Sintomas marcados pela clínica como importantes <b>avisam a enfermagem na hora</b> ' + A.item(129) + '.</p></div>') +
        '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="Registrado. A Thaís (enfermagem) foi avisada.">Registrar e avisar a equipe</button>' +
        '<p class="fraco" style="font-size:12px;text-align:center">O app não avalia sintomas. Em caso de urgência, ligue 192.</p>' + ficha();
    },
    ciclo: function () {
      var d = '';
      for (var i = 1; i <= 28; i++) d += '<span style="display:grid;place-items:center;height:30px;border-radius:9px;font-size:12px;font-weight:600;' + (i <= 5 ? 'background:color-mix(in srgb,var(--c6) 22%,transparent);color:var(--c6)' : (i >= 12 && i <= 16 ? 'background:color-mix(in srgb,var(--c3) 16%,transparent)' : 'background:var(--superficie-2)')) + (i === 9 ? ';outline:2px solid var(--primaria)' : '') + '">' + i + '</span>';
      return sub('ciclo', 'Ciclo menstrual', A.item(154)) +
        cartao('<span class="rotulo">Dia 9 do ciclo</span><h2 style="font-size:22px;margin:4px 0">Próxima menstruação em ~19 dias</h2><p class="mudo" style="font-size:13px">Estimativa a partir dos seus registros. Não é método contraceptivo.</p>') +
        cartao('<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">' + d + '</div>' +
          '<div style="display:flex;gap:14px;margin-top:10px;font-size:12px" class="mudo"><span><span class="ponto" style="background:var(--c6)"></span> menstruação</span><span><span class="ponto" style="background:var(--c3)"></span> período fértil estimado</span></div>') +
        cartao('<div class="cartao-titulo"><h3>Hoje</h3></div>' + opcoes(['Sem sintomas', 'Cólica', 'Inchaço', 'Mais fome', 'Irritação'], 'marca', [0])) + botaoSalvar() + ficha();
    },
    medidas: function () {
      return sub('medidas', 'Peso e medidas', A.item(118)) +
        cartao('<div class="cartao-titulo"><h3>Atualizar</h3><span class="fraco" style="font-size:12px">a cada 15 dias</span></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campoNum('Peso (kg)', '78,6') + campoNum('Cintura (cm)', '86') + campoNum('Quadril (cm)', '104') + campoNum('Braço (cm)', '31') + '</div>') +
        botaoSalvar('Salvar medidas') +
        cartao('<div class="linha-ic">' + A.bolha('balanca', 'var(--c1)') + '<div class="meio"><b>Balança da clínica</b><div class="fraco" style="font-size:12px">As medidas da Anovator entram sozinhas, separadas das suas.</div></div>' + A.item(119) + '</div>') + ficha();
    },

    // ===== IA, avisos, consultas, comunidade =====
    ia: function () {
      if (!E.chat) E.chat = [['ela', 'Oi, Marina! Sou a assistente da Clínica Evoluir. Respondo com base nas orientações do Dr. André e da equipe. Não faço diagnóstico nem mudo seu tratamento. Como posso ajudar?']];
      return sub('ia', 'Assistente da clínica', A.item([143, 144]) + A.item([163, 164]) + A.juridico()) +
        '<div class="canal" role="group" style="justify-self:start"><button type="button" class="ativo" data-acao="canal">No app</button><button type="button" data-acao="canal">No WhatsApp</button></div>' +
        '<div class="chat" id="chat">' + E.chat.map(function (m) { return '<div class="msg ' + m[0] + '">' + m[1] + (m[2] ? '<small>' + m[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
        '<div class="opcoes">' + ['Posso comer pão à noite?', 'Estou enjoada', 'Posso aumentar a dose?', 'Esqueci a picadinha'].map(function (t) { return '<button type="button" data-acao="perguntar" data-v="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
        '<div class="digitar"><input class="campo" id="pergunta" placeholder="Escreva sua dúvida" autocomplete="off"><button class="botao" type="button" data-acao="perguntar-campo" aria-label="Enviar">' + A.ic('enviar') + '</button></div>' +
        '<p class="fraco" style="font-size:11.5px;text-align:center">Respostas simuladas para a prévia. Tudo fica registrado na sua ficha ' + A.item(48) + '.</p>';
    },
    avisos: function () {
      var l = [['Dr. André', 'Lembrete: traga seus exames de sangue na consulta de {wl:u+5}, {d:u+5}.', 'hoje {h:-70}', 131], ['Clínica Evoluir', 'Nova receita no app: omelete de forno com legumes.', 'ontem', 133],
        ['Lembrete', 'Hora da água! Você está em 1,6 L de 2,5 L.', 'ontem 15:00', 132], ['Thaís (enfermagem)', '"Oi Marina, tudo bem depois da aplicação?"', '{ws:-4} 10:22', 60]];
      return sub('avisos', 'Avisos', A.item([131, 132])) + l.map(function (a) {
        return cartao('<div class="linha-ic">' + A.bolha(a[3] === 132 ? 'relogio' : 'sino', 'var(--c3)') + '<div class="meio"><b>' + a[0] + '</b> <span class="fraco" style="font-size:12px">' + a[2] + '</span><p class="mudo" style="font-size:13.5px">' + a[1] + '</p></div>' + A.item(a[3]) + '</div>');
      }).join('');
    },
    consultas: function () {
      var slots = ['{Ws:u+5}, {d:u+5} · 09:30', '{Ws:u+6}, {d:u+6} · 14:00', '{Ws:u+7}, {d:u+7} · 10:30', '{Ws:u+8}, {d:u+8} · 08:30'];
      return sub('consultas', 'Minhas consultas', A.item(130) + A.item(158)) +
        cartao('<span class="rotulo">Próxima</span><h2 style="font-size:21px;margin:4px 0">' + E.consulta + '</h2><p class="mudo">Retorno com o Dr. André · presencial · Clínica Evoluir</p>' +
          '<div class="acoes" style="margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="Presença confirmada. Até lá!">Confirmar presença</button><button class="botao botao-claro" type="button" data-acao="remarcar">Remarcar</button></div>' +
          '<div id="slots" class="' + (E.slot === 'abrir' ? '' : 'oculto') + '" style="margin-top:12px"><span class="rotulo">Horários livres do Dr. André</span>' +
          '<div class="opcoes" style="margin-top:6px">' + slots.map(function (s) { return '<button type="button" data-acao="slot" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div></div>') +
        cartao('<div class="cartao-titulo"><h3>Marcar outra</h3></div>' + opcoes(['Nutrição · Felipe', 'Psicologia · Maria Clara', 'Aplicação · enfermagem', 'Bioimpedância'], 'marca', []) +
          '<button class="botao botao-claro botao-cheio" type="button" style="margin-top:12px" data-acao="aviso" data-msg="Pedido enviado. A clínica confirma pelo WhatsApp.">Ver horários</button>') +
        cartao('<div class="cartao-titulo"><h3>Anteriores</h3></div><table class="tabela"><tr><td>Retorno · Dr. André</td><td>{d:-21}</td></tr><tr><td>Nutrição · Felipe</td><td>{d:-28}</td></tr><tr><td>Primeira consulta · Dr. André</td><td>{d:-42}</td></tr></table>');
    },
    comunidade: function () {
      return sub('comunidade', 'Comunidade', A.item([139, 140]) + '<span class="item">versão completa</span>') +
        cartao('<div class="cartao-titulo"><h3>Desafio do grupo: 10 mil passos</h3>' + A.item(140) + '</div><table class="tabela"><tr><td>1 · Rafa P.</td><td>61.200</td></tr><tr><td>2 · Lu S.</td><td>58.900</td></tr><tr><td>3 · Você</td><td>44.940</td></tr><tr><td>4 · Bia N.</td><td>39.010</td></tr></table>') +
        ['Lu S. completou 14 dias seguidos registrando', 'Rafa P. bateu a meta de proteína a semana toda', 'Bia N. ganhou o selo "Hidratada"'].map(function (t, i) {
          return cartao('<div class="linha-ic"><span class="avatar" style="background:var(--c' + (i + 1) + ')">' + t.slice(0, 1) + t.split(' ')[1].slice(0, 1) + '</span><div class="meio">' + t + '<div class="fraco" style="font-size:12px">❤ ' + (12 - i * 3) + ' · 💬 ' + (4 - i) + '</div></div></div>');
        }).join('') + '<p class="fraco" style="font-size:12px;text-align:center">Você aparece com apelido. Dados de saúde só com a sua autorização.</p>';
    },
    conquistas: function () {
      var s = [['Primeira semana', 1], ['Hidratada', 1], ['7 dias seguidos', 1], ['Proteína em dia', 0], ['30 dias', 0], ['−5 kg', 1]];
      return sub('conquistas', 'Metas e conquistas', A.item([137, 138]) + '<span class="item">versão completa</span>') +
        cartao('<div style="display:flex;align-items:center;gap:16px">' + A.anel({ tamanho: 86, espessura: 8, valor: 9 / 14, cor: 'var(--c2)', centro: '<div class="num" style="font-size:22px;font-weight:700">9</div>' }) +
          '<div><span class="rotulo">Sequência</span><h3>9 dias seguidos registrando</h3><p class="mudo" style="font-size:13px">Recorde: 14 dias</p></div></div>') +
        cartao('<div class="cartao-titulo"><h3>Metas da semana</h3>' + A.item(137) + '</div>' + meta('Registrar o almoço', 4, 7, 'dias', 'var(--c1)') + '<div style="height:10px"></div>' + meta('Caminhar 30 min', 3, 5, 'vezes', 'var(--c5)')) +
        '<div class="fotos">' + s.map(function (x) { return '<div class="foto" style="aspect-ratio:1;' + (x[1] ? '' : 'opacity:.45') + '">' + A.bolha('trofeu', x[1] ? 'var(--c2)' : 'var(--texto-3)') + '<span style="padding:0 6px">' + x[0] + '</span></div>'; }).join('') + '</div>';
    },

    // ===== Evolução =====
    evolucao: function () {
      return '<header class="cab" style="padding-right:40px"><h1 style="font-size:24px">Evolução</h1></header><div class="cab-itens">' + A.item([118, 119, 120, 123]) + '</div>' +
        cartao('<div class="cartao-titulo"><h3>Peso</h3><span class="chip" style="padding:4px 8px">−5,4 kg desde {d:-42}</span></div>' +
          grafico('peso', [84, 83.1, 82.4, 81.6, 80.9, 80.1, 79.4, 78.6], ['{d:-42}', '{d:-35}', '{d:-28}', '{d:-21}', '{d:-14}', '{d:-7}', '{d:-3}', '{d:0}'], 'kg', 1)) +
        cartao('<div class="cartao-titulo"><h3>Gordura corporal</h3>' + A.item(119) + '</div>' + grafico('gordura', [38.2, 37.5, 36.9, 36.1, 35.4], ['{d:-42}', '{d:-28}', '{d:-21}', '{d:-7}', '{d:0}'], '%', 1)) +
        cartao('<div class="cartao-titulo"><h3>Massa muscular</h3></div>' + grafico('massa', [26.8, 26.9, 27.1, 27.0, 27.3], ['{d:-42}', '{d:-28}', '{d:-21}', '{d:-7}', '{d:0}'], 'kg', 1)) +
        cartao('<div class="cartao-titulo"><h3>Última bioimpedância</h3><span class="chip" style="padding:4px 8px">medido na clínica</span></div>' +
          '<table class="tabela"><tr><td>Peso</td><td>78,6 kg</td></tr><tr><td>Gordura</td><td>35,4%</td></tr><tr><td>Massa muscular</td><td>27,3 kg</td></tr><tr><td>Água corporal</td><td>48,1%</td></tr><tr><td>Gordura visceral</td><td>9</td></tr></table>' +
          '<p class="fraco" style="font-size:12px;margin-top:8px">Balança Anovator · {d:0} · Eduarda ' + A.item(119) + '</p>') +
        '<div class="lista-menu cartao" style="padding:4px 16px">' +
          linMenu('medidas', 'fita', 'var(--c1)', 'Atualizar peso e medidas', 'você registra a cada 15 dias', A.item(118)) +
          linMenu('fotos', 'camera', 'var(--c4)', 'Fotos de progresso', 'privadas: só você e o médico', A.item(122)) +
          linMenu('documentos', 'documento', 'var(--c3)', 'Relatórios e exames', 'PDFs da ficha e seus exames', A.item([121, 136])) +
        '</div>' +
        '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="PDF de exemplo gerado: Minha evolução ({d:-42} a {d:0}).">' + A.ic('download') + 'Exportar minha evolução em PDF</button>' +
        '<p class="nota-ficha">' + A.item(123) + ' Para mostrar a outro profissional.</p>';
    },
    fotos: function () {
      return sub('fotos', 'Fotos de progresso', A.item(122)) +
        cartao('<div class="linha-ic">' + A.bolha('cadeado', 'var(--c4)') + '<p class="meio" style="font-size:13.5px">Privadas. Só você e o Dr. André veem. Ficam fora da galeria do celular.</p></div>') +
        '<div class="fotos">' + ['{d:-42} · frente', '{d:-42} · lado', '{d:-42} · costas', '{d:0} · frente', '{d:0} · lado', '+ Nova'].map(function (t) { return '<div class="foto">' + (t === '+ Nova' ? A.ic('camera') : A.ic('perfil')) + '<span>' + t + '</span></div>'; }).join('') + '</div>';
    },
    documentos: function () {
      return sub('documentos', 'Relatórios e exames', A.item([121, 136])) +
        cartao('<div class="cartao-titulo"><h3>Da clínica</h3>' + A.item(121) + '</div><div class="lista-menu" style="padding:0">' +
          doc('Ficha da consulta · {d:-21}', 'PDF com a balança anexada') + doc('Plano alimentar · Felipe', 'PDF · válido até {d:+28}') + doc('Receita · Dr. André', 'PDF assinado') + '</div>') +
        cartao('<div class="cartao-titulo"><h3>Meus exames</h3>' + A.item(136) + '</div><div class="lista-menu" style="padding:0">' + doc('Hemograma · {d:-8}', 'enviado por você') + '</div>' +
          '<div class="acoes" style="margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="Exame enviado para a sua ficha.">' + A.ic('camera') + 'Fotografar exame</button><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="PDF enviado para a sua ficha.">Enviar PDF</button></div>');
    },

    // ===== Picadinha =====
    picadinha: function () {
      return '<header class="cab" style="padding-right:40px"><h1 style="font-size:24px">Picadinha</h1></header><div class="cab-itens">' + A.item([124, 125, 126, 127, 128, 129]) + '</div>' +
        cartao('<span class="rotulo">Sua medicação</span><h2 style="font-size:20px;margin:4px 0 2px">Medicação semanal (exemplo)</h2><p class="mudo" style="font-size:13px">Prescrita pelo Dr. André · toda quinta, 08:00 ' + A.item(124) + '</p>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">' +
            '<div class="caixa-destaque"><span class="rotulo">Na seringa</span><div class="num" style="font-size:30px;font-weight:700">10 un.</div></div>' +
            '<div class="caixa-destaque"><span class="rotulo">Volume</span><div class="num" style="font-size:30px;font-weight:700">0,10 ml</div></div>' +
          '</div><p style="font-size:12.5px;margin-top:10px" class="mudo">' + A.ic('escudo') + ' Conferido pela Thaís em {d:-5}. <b>O app não calcula dose</b>: mostra só o que a clínica registrou. ' + A.item(125) + '</p>', 'cartao-destaque') +
        cartao('<div class="linha-ic">' + A.bolha('relogio', 'var(--c3)') + '<div class="meio"><b>Próxima: {wl:p4}, {d:p4} · 08:00</b><div class="fraco" style="font-size:12px">Lembrete na hora e 1 hora antes</div></div><span class="chave on"></span></div><div style="margin-top:8px">' + A.item(126) + '</div>') +
        cartao('<div class="cartao-titulo"><h3>Onde aplicar</h3>' + A.item(127) + '</div>' + corpo() +
          '<p class="mudo" style="font-size:12.5px;text-align:center;margin-top:6px">Última: <b>abdômen, lado esquerdo</b> ({d:-5}). Toque no local de hoje.</p>') +
        '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="Aplicação registrada. Como você se sentiu? Conte em Sintomas.">Registrar aplicação</button>' +
        '<div class="lista-menu cartao" style="padding:4px 16px">' + linMenu('sintomas', 'termometro', 'var(--c6)', 'Como se sentiu', 'náusea, enjoo, intestino…', A.item([128, 129])) + '</div>' +
        cartao('<div class="cartao-titulo"><h3>Histórico</h3></div><table class="tabela"><tr><td>{d:-5} · abdômen esq. · sem sintomas</td><td>10 un.</td></tr><tr><td>{d:-12} · abdômen dir. · enjoo leve</td><td>10 un.</td></tr><tr><td>{d:-19} · coxa esq. · sem sintomas</td><td>5 un.</td></tr></table>') + ficha();
    },

    // ===== Equipe =====
    equipe: function () {
      return '<header class="cab" style="padding-right:40px"><h1 style="font-size:24px">Equipe</h1></header><div class="cab-itens">' + A.item(156) + '</div>' +
        '<div class="lista-menu cartao" style="padding:4px 16px">' +
          linMenu('chat', 'chat', 'var(--primaria)', 'Falar com a equipe', 'a resposta chega citada, sem alteração', A.item(60)) +
          linMenu('ia', 'ia', 'var(--c4)', 'Assistente da clínica (IA)', 'dúvidas do dia a dia', A.item(143)) +
          linMenu('revistas', 'revista', 'var(--c2)', 'Revistas e conteúdo', 'nutrição, psicologia e medicina', A.item(133)) +
        '</div>' +
        EQUIPE.map(function (p) {
          return cartao('<div class="linha-ic">' + avatar(p, 44) + '<div class="meio"><b>' + p.nome + '</b><div class="fraco" style="font-size:12.5px">' + p.papel + '</div></div></div>' +
            '<div class="acoes" style="margin-top:10px"><a class="botao botao-claro sem-sublinhado" href="#chat">' + A.ic('chat') + 'Mensagem</a><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Abre o Instagram (exemplo).">' + A.ic('insta') + 'Instagram</button></div>');
        }).join('') +
        cartao('<div class="linha-ic">' + A.bolha('telefone', 'var(--c1)') + '<div class="meio"><b>Clínica Evoluir</b><div class="fraco" style="font-size:12.5px">WhatsApp, site e endereço (exemplo)</div></div>' + A.ic('globo', 'fraco') + '</div>');
    },
    chat: function () {
      if (!E.chatEquipe) E.chatEquipe = [['eu', 'Thaís, tive um pouco de enjoo ontem depois da aplicação. É normal?', '{ws:-4} 09:40'],
        ['ela', '<blockquote>Thaís, tive um pouco de enjoo ontem depois da aplicação. É normal?</blockquote>"Oi Marina! Pode acontecer nos primeiros dias. Coma devagar, em porções menores, e me avise se piorar ou se vomitar."<small>Thaís · enfermagem · enviado pela clínica, sem alteração</small>', 'seg 10:22']];
      return sub('chat', 'Equipe da clínica', A.item([58, 59, 60]) + A.item(157)) +
        '<p class="fraco" style="font-size:12px">A IA encaminha para a pessoa certa. A resposta chega citada, entre aspas e sem alteração.</p>' +
        '<div class="chat">' + E.chatEquipe.map(function (m) { return '<div class="msg ' + m[0] + '">' + m[1] + (m[0] === 'eu' && m[2] ? '<small>' + m[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
        '<div class="digitar"><input class="campo" id="msg-equipe" placeholder="Escreva para a equipe" autocomplete="off"><button class="botao" type="button" data-acao="enviar-equipe" aria-label="Enviar">' + A.ic('enviar') + '</button></div>';
    },
    revistas: function () {
      var r = [['Nutrição', 'Proteína no café da manhã: por que ajuda na saciedade', 'Felipe · 4 min', 'var(--c2)'], ['Psicologia', 'Fome emocional: como perceber e o que fazer', 'Maria Clara · 6 min', 'var(--c6)'],
        ['Medicina', 'O que esperar nas primeiras semanas de tratamento', 'Dr. André · 5 min', 'var(--c1)'], ['Receita', 'Omelete de forno com legumes', 'Felipe · vídeo 3 min', 'var(--c5)']];
      return sub('revistas', 'Revistas e conteúdo', A.item(133)) +
        '<div class="opcoes">' + ['Todas', 'Nutrição', 'Psicologia', 'Medicina', 'Receitas', 'Vídeos'].map(function (t, i) { return '<button type="button" data-acao="marca" class="' + (i ? '' : 'sel') + '">' + t + '</button>'; }).join('') + '</div>' +
        r.map(function (x) {
          return cartao('<div style="height:96px;border-radius:12px;margin:-4px -4px 12px;background:linear-gradient(135deg,color-mix(in srgb,' + x[3] + ' 30%,transparent),color-mix(in srgb,' + x[3] + ' 8%,transparent));display:grid;place-items:center">' + A.bolha('revista', x[3]) + '</div>' +
            '<span class="rotulo">' + x[0] + '</span><h3 style="font-size:16px;margin:4px 0">' + x[1] + '</h3><p class="fraco" style="font-size:12px">' + x[2] + '</p>');
        }).join('');
    },

    // ===== Perfil =====
    perfil: function () {
      return '<header class="cab" style="padding-right:40px"><h1 style="font-size:24px">Perfil</h1></header>' +
        cartao('<div class="linha-ic">' + '<span class="avatar" style="background:var(--primaria);color:var(--sobre-primaria);width:54px;height:54px;font-size:18px">ML</span>' +
          '<div class="meio"><h3 style="font-size:18px">' + PACIENTE.completo + '</h3><div class="fraco" style="font-size:12.5px">' + PACIENTE.id + ' · paciente desde {a:-42}</div><div style="margin-top:6px"><span class="chip" style="padding:4px 9px">' + PACIENTE.fase + '</span></div></div></div>' +
          '<p class="fraco" style="font-size:12px;margin-top:10px">' + A.ic('escudo') + ' Tudo sincronizado. O app funciona sem internet e envia quando o sinal volta ' + A.item(100) + '</p>') +
        grupo('Saúde', [
          ['corpo', 'perfil', 'var(--c1)', 'Perfil corporal', 'altura, biotipo, objetivo', A.item(96)],
          ['metas', 'trofeu', 'var(--c2)', 'Metas e hábitos da equipe', 'o que a clínica pediu para você', A.item(112) + A.item(161)],
          ['conquistas', 'trofeu', 'var(--c5)', 'Conquistas e sequência', '9 dias seguidos', A.item([137, 138])],
          ['documentos', 'documento', 'var(--c3)', 'Relatórios e exames', '', A.item([121, 136])],
          ['fotos', 'camera', 'var(--c4)', 'Fotos de progresso', 'privadas', A.item(122)]]) +
        grupo('App', [
          ['lembretes', 'relogio', 'var(--c3)', 'Lembretes', 'água, remédios, picadinha, registros', A.item(132) + A.item(160)],
          ['integracoes', 'link', 'var(--c1)', 'Apple Saúde, Google e balança', 'passos, sono e peso', A.item(162) + A.item(119)],
          ['acessibilidade', 'letra', 'var(--c4)', 'Letra grande e modo escuro', '', A.item(105)],
          ['pagamentos', 'cartao', 'var(--c5)', 'Pagamentos', 'Pix e cartão', A.item(159)]]) +
        grupo('Privacidade e conta', [
          ['dados', 'cadeado', 'var(--c6)', 'Meus dados (LGPD)', 'baixar ou pedir exclusão', A.item(98)],
          ['consentimento', 'escudo', 'var(--c1)', 'Termo de uso e aviso de IA', 'aceito em {a:-42}', A.item(97)],
          ['tour', 'ia', 'var(--c2)', 'Rever o tutorial', '', A.item(99)],
          ['entrar', 'link', 'var(--c3)', 'Como se entra no app', 'link mágico, sem senha', A.item([92, 93, 95])]]) +
        '<div style="display:grid;gap:8px;justify-items:center;padding:4px 0"><div class="lojas"><span class="chip">' + A.item(141) + ' App Store · em breve</span><span class="chip">' + A.item(142) + ' Google Play · em breve</span></div>' +
        '<div class="fraco" style="font-size:11.5px">Hoje: instale pelo Safari › Compartilhar › Adicionar à Tela de Início ' + A.item(94) + '</div></div>';
    },
    corpo: function () {
      return sub('corpo', 'Perfil corporal', A.item(96)) +
        cartao('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campoNum('Altura (cm)', '165') + campoNum('Peso inicial (kg)', '84,0') + campoNum('Cintura inicial (cm)', '94') + campoNum('Idade', '41') + '</div>') +
        cartao('<div class="cartao-titulo"><h3>Biotipo</h3></div>' + opcoes(['Ectomorfo', 'Mesomorfo', 'Endomorfo'], 'marca', [2])) +
        cartao('<div class="cartao-titulo"><h3>Objetivo</h3></div>' + opcoes(['Perder peso', 'Ganhar massa', 'Manter', 'Saúde em geral'], 'marca', [0])) +
        cartao('<div class="cartao-titulo"><h3>Fase do acompanhamento</h3>' + A.item(155) + '</div>' + opcoes(['1 · Início', '2 · Perda de peso', '3 · Desmame', '4 · Manutenção'], 'marca', [1]) +
          '<p class="fraco" style="font-size:12px;margin-top:8px">Definida pelo Dr. André. Muda o que o app pede e lembra.</p>') + botaoSalvar('Salvar');
    },
    metas: function () {
      return sub('metas', 'Metas e hábitos', A.item(112) + A.item(161)) +
        cartao('<div class="cartao-titulo"><h3>Metas do dia</h3>' + A.item(112) + '</div>' + meta('Calorias', E.kcal, 1600, 'kcal', 'var(--c2)') + '<div style="height:10px"></div>' + meta('Proteína', E.prot, 110, 'g', 'var(--c1)') + '<div style="height:10px"></div>' + meta('Água', E.agua, 2500, 'ml', 'var(--c3)')) +
        cartao('<div class="cartao-titulo"><h3>Hábitos pedidos pela equipe</h3></div><div class="lista-menu" style="padding:0">' +
          habito('Caminhar 30 min, 5 vezes por semana', 'Dr. André', true) + habito('Proteína em todas as refeições', 'Felipe', true) + habito('Respirar 5 min antes de dormir', 'Maria Clara', false) + habito('Dormir antes das 23h30', 'Dr. André', false) + '</div>');
    },
    lembretes: function () {
      var l = [['Água', 'a cada 2 h, das 8h às 20h', 1], ['Remédios', 'na hora de cada um', 1], ['Picadinha', 'quinta 07:00 e 08:00', 1], ['Registrar refeições', '12:30 e 20:00', 1], ['Humor', '21:00', 0], ['Consulta', '1 dia antes', 1]];
      return sub('lembretes', 'Lembretes', A.item(132) + A.item(160)) + cartao('<div class="lista-menu" style="padding:0">' + l.map(function (x) {
        return '<div class="lin-menu">' + A.bolha('relogio', 'var(--c3)') + '<span class="meio"><b>' + x[0] + '</b><small>' + x[1] + '</small></span><button type="button" class="chave' + (x[2] ? ' on' : '') + '" data-acao="chave" aria-label="Ligar ou desligar"></button></div>';
      }).join('') + '</div>');
    },
    integracoes: function () {
      return sub('integracoes', 'Apple Saúde, Google e balança', A.item(162) + A.item(119)) +
        cartao('<div class="lista-menu" style="padding:0">' +
          '<div class="lin-menu">' + A.bolha('atividade', 'var(--c6)') + '<span class="meio"><b>Apple Saúde</b><small>passos e sono · ligado</small></span><button type="button" class="chave on" data-acao="chave"></button></div>' +
          '<div class="lin-menu">' + A.bolha('globo', 'var(--c3)') + '<span class="meio"><b>Google (Health Connect)</b><small>para Android</small></span><button type="button" class="chave" data-acao="chave"></button></div>' +
          '<div class="lin-menu">' + A.bolha('balanca', 'var(--c1)') + '<span class="meio"><b>Balança Anovator da clínica</b><small>o peso entra sozinho a cada consulta</small></span>' + A.item(119) + '</div></div>') +
        '<p class="fraco" style="font-size:12px;text-align:center">Você escolhe o que compartilhar e pode desligar quando quiser.</p>';
    },
    acessibilidade: function () {
      var escuro = A.estilo() === 'clean-escuro';
      return sub('acessibilidade', 'Letra grande e modo escuro', A.item(105)) +
        cartao('<div class="lista-menu" style="padding:0">' +
          '<div class="lin-menu">' + A.bolha('letra', 'var(--c4)') + '<span class="meio"><b>Letra grande</b><small>aumenta o texto do app todo</small></span><button type="button" class="chave' + (E.letra ? ' on' : '') + '" data-acao="letra"></button></div>' +
          '<div class="lin-menu">' + A.bolha('sono', 'var(--c3)') + '<span class="meio"><b>Modo escuro</b><small>mais confortável à noite</small></span><button type="button" class="chave' + (escuro ? ' on' : '') + '" data-acao="escuro"></button></div></div>') +
        cartao('<span class="rotulo">Exemplo</span><p style="margin-top:6px">Olá, Marina! Este é o tamanho do texto com a opção escolhida.</p>');
    },
    pagamentos: function () {
      return sub('pagamentos', 'Pagamentos', A.item(159) + A.item(87)) +
        cartao('<span class="rotulo">Em aberto</span><h2 style="font-size:24px;margin:4px 0" class="num">R$ 650,00</h2><p class="mudo">Programa trimestral · parcela 2 de 3 · vence {d:+7} (valores de exemplo)</p>' +
          '<div class="acoes" style="margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="Pix copia e cola copiado (exemplo).">Pagar com Pix</button><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Abre o pagamento com cartão (exemplo).">' + A.ic('cartao') + 'Cartão</button></div>', 'cartao-destaque') +
        cartao('<div class="cartao-titulo"><h3>Pagos</h3></div><table class="tabela"><tr><td>Parcela 1 de 3 · Pix</td><td>R$ 650,00</td></tr><tr><td>Consulta inicial · cartão</td><td>R$ 450,00</td></tr></table>') +
        '<p class="fraco" style="font-size:12px;text-align:center">Recibos no e-mail. Dúvidas: Emanuele (financeiro).</p>';
    },
    dados: function () {
      return sub('dados', 'Meus dados (LGPD)', A.item(98)) +
        cartao('<p style="font-size:14px">Seus dados são seus. Você pode baixar uma cópia de tudo o que registrou ou pedir a exclusão da conta.</p>') +
        '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="Pedido registrado. O arquivo chega no seu e-mail (exemplo).">' + A.ic('download') + 'Baixar meus dados</button>' +
        '<button class="botao botao-claro botao-cheio" type="button" data-acao="aviso" data-msg="Pedido de exclusão enviado à clínica (exemplo).">Pedir exclusão da conta</button>' +
        '<p class="fraco" style="font-size:12px;text-align:center">Alguns dados da ficha a clínica precisa guardar por lei; nesse caso, ela explica o motivo e o prazo.</p>';
    },

    // ===== Primeiro acesso (sem barra de baixo) =====
    entrar: function () {
      return '<div class="entrar">' + A.logo({ tamanho: 96 }) +
        '<div><h1 style="font-size:24px">Bem-vinda à Clínica Evoluir</h1><p class="mudo" style="margin-top:6px">Sua conta foi criada quando você agendou. Não precisa de cadastro nem de senha.</p></div>' +
        '<div class="cartao" style="width:100%;text-align:left"><div class="linha-ic">' + A.bolha('whatsapp', 'var(--c1)') + '<div class="meio"><b>Link de acesso</b><div class="fraco" style="font-size:12.5px">enviado ao seu WhatsApp (11) 9····-··77</div></div></div></div>' +
        '<a class="botao sem-sublinhado" href="#consentimento">Entrar pelo link</a>' +
        '<button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Link enviado para o seu e-mail (exemplo).">Receber por e-mail</button>' +
        '<div class="itens" style="justify-content:center">' + A.item(92) + A.item(93) + A.item(95) + '</div></div>';
    },
    consentimento: function () {
      var c = E.check;
      return '<div class="entrar" style="text-align:left;justify-items:stretch">' + '<div class="passos"><i></i><i class="at"></i><i></i></div>' +
        '<h1 style="font-size:22px;text-align:center">Antes de começar</h1>' +
        '<div class="cartao" style="display:grid;gap:12px">' +
          '<button type="button" class="check' + (c[0] ? ' on' : '') + '" data-acao="check" data-v="0"><i></i><span>Li e aceito o <b>termo de uso</b> e a <b>política de privacidade</b> da Clínica Evoluir.</span></button>' +
          '<button type="button" class="check' + (c[1] ? ' on' : '') + '" data-acao="check" data-v="1"><i></i><span>Entendi que a assistente do app é uma <b>inteligência artificial</b>: ela não faz diagnóstico, não prescreve e chama a equipe quando precisa.</span></button>' +
          '<button type="button" class="check' + (c[2] ? ' on' : '') + '" data-acao="check" data-v="2"><i></i><span>Autorizo o uso dos meus registros pela equipe que cuida de mim.</span></button>' +
        '</div>' +
        '<a class="botao sem-sublinhado" href="#tour"' + (c[0] && c[1] && c[2] ? '' : ' style="opacity:.45;pointer-events:none"') + '>Aceitar e continuar</a>' +
        '<p class="fraco" style="font-size:12px;text-align:center">O aceite fica registrado com data e hora. ' + A.item(97) + '</p></div>';
    },
    tour: function () {
      return '<div class="entrar">' + '<div class="passos"><i></i><i></i><i class="at"></i></div>' +
        A.bolha('ia', 'var(--primaria)') + '<h1 style="font-size:22px">Seu acompanhamento num só lugar</h1>' +
        '<div class="cartao" style="display:grid;gap:12px;text-align:left;width:100%">' +
          '<div class="linha-ic">' + A.bolha('prato', 'var(--c2)') + '<span class="meio">Registre refeições com uma foto</span></div>' +
          '<div class="linha-ic">' + A.bolha('seringa', 'var(--c1)') + '<span class="meio">Veja a picadinha conferida pela clínica</span></div>' +
          '<div class="linha-ic">' + A.bolha('chat', 'var(--c3)') + '<span class="meio">Fale com a equipe e tire dúvidas</span></div>' +
          '<div class="linha-ic">' + A.bolha('evolucao', 'var(--c4)') + '<span class="meio">Acompanhe sua evolução</span></div>' +
        '</div><a class="botao sem-sublinhado" href="#inicio">Começar</a>' + '<div>' + A.item(99) + '</div></div>';
    }
  };

  // ---------- peças das telas ----------
  function meta(nome, v, alvo, u, cor) {
    return '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><b>' + nome + '</b><span class="num mudo">' + br(v) + ' / ' + br(alvo) + ' ' + u + '</span></div>' +
      '<div class="barra" style="--cor:' + cor + '"><i style="width:' + Math.min(100, Math.round(v / alvo * 100)) + '%"></i></div></div>';
  }
  function campoNum(rotulo, v) { return '<label style="display:grid;gap:4px"><span class="rotulo">' + rotulo + '</span><input class="campo num" inputmode="decimal" value="' + v + '"></label>'; }
  function tomar(nome, quando, feito) {
    return '<div class="lin-menu">' + A.bolha('pilula', 'var(--c3)') + '<span class="meio"><b>' + nome + '</b><small>' + quando + '</small></span><button type="button" class="chip" data-acao="tomei" style="' + (feito ? 'color:var(--ok)' : '') + '">' + (feito ? '✓ tomei' : 'tomei') + '</button></div>';
  }
  function habito(t, quem, feito) {
    return '<div class="lin-menu">' + A.bolha('trofeu', feito ? 'var(--ok)' : 'var(--texto-3)') + '<span class="meio"><b>' + t + '</b><small>pedido por ' + quem + '</small></span><button type="button" class="chave' + (feito ? ' on' : '') + '" data-acao="chave"></button></div>';
  }
  function doc(t, s) { return '<div class="lin-menu">' + A.bolha('documento', 'var(--c3)') + '<span class="meio"><b>' + t + '</b><small>' + s + '</small></span>' + A.ic('download', 'fraco') + '</div>'; }
  function grupo(t, l) {
    return '<div><span class="rotulo" style="display:block;margin:4px 4px 8px">' + t + '</span><div class="cartao lista-menu" style="padding:4px 16px">' +
      l.map(function (x) { return linMenu(x[0], x[1], x[2], x[3], x[4], x[5]); }).join('') + '</div></div>';
  }
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

  // ---------- IA simulada ----------
  // Respostas prontas. Nunca diagnostica, nunca fala de dose; quando é com a equipe, chama a equipe.
  function respostaIA(t) {
    t = t.toLowerCase();
    if (/dose|aument|diminu|unidade|quanto apli/.test(t)) return ['Não posso orientar sobre dose: isso é só com o Dr. André. Encaminhei sua pergunta para ele e para a enfermagem. A resposta chega aqui, citada e sem alteração.', 'equipe avisada · Thaís e Dr. André'];
    if (/enjo|náus|nause|vômit|vomit|dor|tontu|mal/.test(t)) return ['Sinto muito que você não esteja bem. Eu não avalio sintomas, mas registrei no seu diário e avisei a enfermagem (Thaís). Se piorar, tiver vômitos seguidos ou dor forte, procure atendimento ou ligue 192.', 'registrado na ficha · enfermagem avisada'];
    if (/esqueci|perdi|atras/.test(t)) return ['Obrigada por avisar. O que fazer depende da orientação da clínica, então chamei a enfermagem para te responder. Enquanto isso, não aplique uma dose extra por conta própria.', 'enfermagem avisada'];
    if (/pão|pao|comer|aliment|doce|jantar/.test(t)) return ['Pelo seu plano do Felipe, no jantar a sugestão é omelete com legumes ou sopa com frango. Pão à noite não está no plano; se quiser trocar, posso pedir ao Felipe uma substituição.', 'com base no plano alimentar'];
    return ['Anotei. Vou responder com base nas orientações da sua equipe. Se for algo que só a equipe pode responder, eu encaminho para a pessoa certa.', ''];
  }

  // ---------- ações ----------
  function avisoCurto(msg) {
    var ap = document.querySelector('.aparelho'), v = ap.querySelector('.aviso-curto');
    if (v) v.remove();
    v = document.createElement('div'); v.className = 'aviso-curto'; v.textContent = msg; ap.appendChild(v);
    clearTimeout(avisoCurto.t); avisoCurto.t = setTimeout(function () { v.remove(); }, 2600);
  }
  function perguntar(t) {
    if (!t) return;
    E.chat.push(['eu', esc(t)]);
    render(true);
    setTimeout(function () { var r = respostaIA(t); E.chat.push(['ela', r[0], r[1]]); render(true); rolarFim(); }, 700);
    rolarFim();
  }
  function rolarFim() { var r = document.getElementById('rolagem'); r.scrollTop = r.scrollHeight; }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]');
    if (!el) {
      var alvo = ev.target.closest('.grafico .alvo');
      if (alvo) {
        var g = alvo.closest('.grafico');
        g.querySelector('[data-leitura]').textContent = br(Number(alvo.dataset.v), Number(g.dataset.casas));
        g.querySelector('[data-leitura-rot]').textContent = g.dataset.unidade + ' · ' + alvo.dataset.r;
        g.querySelectorAll('.ponto').forEach(function (p, i) { p.classList.toggle('sel', String(i) === alvo.dataset.i); });
      }
      return;
    }
    var a = el.dataset.acao, v = el.dataset.v;
    if (a === 'aviso') { if (el.tagName !== 'A') ev.preventDefault(); avisoCurto(el.dataset.msg); return; }
    // escala: uma escolha só; opções: marca e desmarca
    if (a === 'marca') { var pai = el.parentNode; if (pai.classList.contains('escala')) pai.querySelectorAll('.sel').forEach(function (x) { if (x !== el) x.classList.remove('sel'); }); el.classList.toggle('sel'); return; }
    if (a === 'canal') { el.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('ativo', b === el); }); avisoCurto(el.textContent.indexOf('WhatsApp') >= 0 ? 'A assistente passa a falar com você pelo WhatsApp.' : 'A assistente fala com você por notificação e chat no app.'); return; }
    if (a === 'agua') { E.agua = Math.min(4000, E.agua + Number(v)); render(true); avisoCurto('+' + v + ' ml registrados.'); return; }
    if (a === 'humor') { E.humor = Number(v); render(true); return; }
    if (a === 'porcao') { E.porcao = [170, 85, 100, 250][Number(v)]; render(true); return; }
    if (a === 'somar') { var f = E.porcao / 170; E.kcal += Math.round(110 * f); E.prot += Math.round(6.8 * f); avisoCurto('Somado ao dia: +' + Math.round(110 * f) + ' kcal, +' + Math.round(6.8 * f) + ' g de proteína.'); location.hash = '#alimentacao'; return; }
    if (a === 'remarcar') { E.slot = E.slot === 'abrir' ? null : 'abrir'; render(true); return; }
    if (a === 'slot') { E.consulta = v.replace(/^(Seg|Ter|Qua|Qui|Sex),/, function (m, d) { return { Seg: 'Segunda', Ter: 'Terça', Qua: 'Quarta', Qui: 'Quinta', Sex: 'Sexta' }[d] + ','; }); E.slot = null; render(true); avisoCurto('Consulta remarcada para ' + v + '.'); return; }
    if (a === 'local') { E.local = v; render(true); avisoCurto('Local de hoje marcado.'); return; }
    if (a === 'chave') { el.classList.toggle('on'); return; }
    if (a === 'tomei') { el.textContent = '✓ tomei'; el.style.color = 'var(--ok)'; return; }
    if (a === 'letra') { E.letra = !E.letra; document.documentElement.dataset.letra = E.letra ? 'grande' : ''; render(true); return; }
    if (a === 'escuro') { A.aplicarEstilo(A.estilo() === 'clean-escuro' ? 'clean-claro' : 'clean-escuro', true); render(true); return; }
    if (a === 'check') { E.check[Number(v)] = !E.check[Number(v)]; render(true); return; }
    if (a === 'perguntar') { perguntar(v); return; }
    if (a === 'perguntar-campo') { var c = document.getElementById('pergunta'); perguntar(c.value.trim()); return; }
    if (a === 'enviar-equipe') {
      var m = document.getElementById('msg-equipe'), t = m.value.trim(); if (!t) return;
      E.chatEquipe.push(['eu', esc(t), 'agora']); render(true); rolarFim(); avisoCurto('Enviado. A IA encaminhou para a pessoa certa da equipe.'); return;
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    if (ev.target.id === 'pergunta') perguntar(ev.target.value.trim());
    if (ev.target.id === 'msg-equipe') document.querySelector('[data-acao="enviar-equipe"]').click();
  });

  function emBreve(id) { return cab('Tela não encontrada', '', 'inicio') + '<div class="em-breve"><p class="mudo">Esta tela não existe.</p><a class="botao sem-sublinhado" href="#inicio">Voltar ao início</a></div>'; }

  function render(manter) {
    var id = (location.hash || '#inicio').slice(1) || 'inicio';
    var el = document.getElementById('tela'), rol = document.getElementById('rolagem'), y = rol.scrollTop;
    var html = TELAS[id] ? TELAS[id]() : emBreve(id);
    el.innerHTML = html;
    el.className = 'tela' + (manter ? '' : ' entra');
    // aba acesa: a da própria tela ou a do primeiro "pai" que for aba
    var aba = id; while (PAI[aba] && ABAS.every(function (x) { return x.id !== aba; })) aba = PAI[aba];
    document.querySelectorAll('.aba').forEach(function (b) { b.classList.toggle('ativa', b.dataset.tela === aba); });
    document.body.classList.toggle('sem-barra', !!SEM_BARRA[id]);
    rol.scrollTop = manter ? y : 0;
  }

  function montar() {
    document.getElementById('abas').innerHTML = ABAS.map(function (a) {
      return '<a class="aba" href="#' + a.id + '" data-tela="' + a.id + '">' + A.ic(a.ic) + a.nome + '</a>';
    }).join('');
    // Balão da assistente em todas as telas (itens 143 e 163): mesmas respostas prontas e mesmas regras do #ia.
    A.balao({ dentro: document.querySelector('.aparelho'), titulo: 'Assistente da clínica', sub: 'IA · não substitui a equipe',
      itens: A.item([143, 163]) + A.juridico('depende do parecer jurídico'),
      saudacao: 'Oi, Marina! Respondo com base nas orientações do Dr. André e da equipe. Não faço diagnóstico, não prescrevo e não falo de dose.',
      sugestoes: ['Posso comer pão à noite?', 'Estou enjoada', 'Posso aumentar a dose?'], responder: respostaIA });
    window.addEventListener('hashchange', function () { render(false); });
    document.addEventListener('estilo', function () { if ((location.hash || '').slice(1) === 'acessibilidade') render(true); });
    render(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
