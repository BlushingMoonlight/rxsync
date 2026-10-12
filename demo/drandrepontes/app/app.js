/* App do paciente · um único código; cada tela é uma função em TELAS e abre por #tela (ex.: #inicio).
   Dados de exemplo fictícios. A IA é simulada (respostas prontas), nunca diagnostica nem prescreve,
   e o app nunca calcula dose: só mostra o que a clínica conferiu. */
(function () {
  'use strict';
  var A = window.AG;
  var PACIENTE = { nome: 'Marina', completo: 'Marina Lopes', id: 'P-DEMO7', fase: 'Fase 2 · Perda de peso' };

  var ABAS = [
    { id: 'inicio', nome: 'Início', ic: 'inicio' },
    { id: 'evolucao', nome: 'Evolução', ic: 'evolucao' },
    { id: 'picadinha', nome: 'Picadinha', ic: 'seringa' },
    { id: 'equipe', nome: 'Equipe', ic: 'equipe' },
    { id: 'perfil', nome: 'Perfil', ic: 'perfil' }
  ];

  function cartao(conteudo, classe) { return '<section class="cartao ' + (classe || '') + '">' + conteudo + '</section>'; }

  function mini(o) {
    return cartao(
      '<div class="linha1">' + A.bolha(o.ic, o.cor) + '</div>' +
      '<div><div class="valor num">' + o.valor + '<small>' + o.unidade + '</small></div>' +
      '<div class="nome">' + o.nome + '</div>' + (o.selo ? '<div style="margin-top:6px">' + o.selo + '</div>' : '') + '</div>' +
      '<div class="barra" style="--cor:' + o.cor + '"><i style="width:' + Math.round(o.p * 100) + '%"></i></div>', 'mini');
  }

  var TELAS = {
    inicio: function () {
      // a semana de exemplo começa na segunda, 12/10; hoje é terça, 13/10
      var dias = [['seg', 12, 1], ['ter', 13, 0, 1], ['qua', 14], ['qui', 15], ['sex', 16], ['sáb', 17], ['dom', 18]];
      return '' +
        '<header class="topo topo-couro com-textura">' + A.logo({ tamanho: 40, texto: false }) +
          '<div class="saudacao"><div class="mudo" style="font-size:13px">Terça, 13 de outubro</div><h1>Olá, ' + PACIENTE.nome + '</h1></div>' +
          '<button class="sino" type="button" aria-label="Avisos">' + A.ic('sino') + '<i></i></button>' +
        '</header>' +

        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<span class="chip"><span class="ponto" style="background:var(--ok)"></span>' + PACIENTE.fase + '</span>' + A.novo('fase do acompanhamento') +
        '</div>' +

        '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="rotulo">Sua semana</span>' + A.item(101) + '</div>' +
        '<div class="semana">' + dias.map(function (d) {
          return '<button class="dia' + (d[2] ? ' feito' : '') + (d[3] ? ' hoje' : '') + '" type="button"><small>' + d[0] + '</small><b>' + d[1] + '</b><i></i></button>';
        }).join('') + '</div></div>' +

        cartao('<div class="score">' +
          A.anel({ tamanho: 104, espessura: 10, valor: .72, centro: '<div><div class="num-grande num">72</div><div class="rotulo" style="font-size:9.5px">pontos</div></div>' }) +
          '<div style="flex:1;display:grid;gap:6px"><span class="rotulo">Score do dia</span>' +
          '<h2 style="font-size:19px">Faltam 3 registros para fechar o dia</h2>' +
          '<p class="mudo" style="font-size:13px">Almoço, água da tarde e humor.</p>' + '<div>' + A.item(102) + '</div></div></div>', 'cartao-destaque') +

        '<div style="display:flex;justify-content:space-between;align-items:center"><span class="rotulo">Hoje</span>' + A.item(103) + '</div>' +
        '<div class="resumo">' +
          mini({ ic: 'fogo', cor: 'var(--c2)', valor: '1.240', unidade: ' / 1.600 kcal', nome: 'Calorias', p: .78 }) +
          mini({ ic: 'proteina', cor: 'var(--c1)', valor: '82', unidade: ' / 110 g', nome: 'Proteínas', p: .75 }) +
          mini({ ic: 'agua', cor: 'var(--c3)', valor: '1,6', unidade: ' / 2,5 L', nome: 'Água', p: .64 }) +
          mini({ ic: 'sono', cor: 'var(--c4)', valor: '7h10', unidade: '', nome: 'Sono', p: .9, selo: A.novo('Apple Saúde') }) +
          mini({ ic: 'atividade', cor: 'var(--c5)', valor: '6.420', unidade: ' passos', nome: 'Atividade', p: .64, selo: A.novo('Apple Saúde') }) +
          mini({ ic: 'humor', cor: 'var(--c6)', valor: '—', unidade: '', nome: 'Humor · registrar', p: 0 }) +
        '</div>' +

        cartao('<div class="cartao-titulo"><div class="linha-ic">' + A.bolha('ia', 'var(--primaria)') + '<div class="meio"><h3>Assistente da clínica</h3><div class="fraco" style="font-size:12px">IA · não substitui a equipe</div></div></div></div>' +
          '<div class="ia-balao">Marina, você ainda não registrou o almoço. Quer mandar uma foto do prato? Leva 10 segundos.</div>' +
          '<div class="acoes" style="margin-top:10px"><button class="botao" type="button">' + A.ic('camera') + 'Foto do prato</button><button class="botao botao-claro" type="button">Mais tarde</button></div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap">' +
            '<div class="canal" role="group" aria-label="Canal da assistente"><button type="button" class="ativo">App</button><button type="button">WhatsApp</button></div>' +
            '<div class="itens">' + A.novo('IA ativa') + A.juridico('depende do parecer jurídico') + '</div></div>') +

        cartao('<div class="linha-ic">' + A.bolha('seringa', 'var(--c1)') +
          '<div class="meio"><span class="rotulo">Próxima picadinha</span><h3>Quinta, 15/10 · 08:00</h3>' +
          '<div class="mudo" style="font-size:12.5px">Instrução conferida pela clínica. O app não calcula dose.</div></div>' + A.ic('seta', 'fraco') + '</div>' +
          '<div style="margin-top:10px">' + A.item([124, 125, 126]) + '</div>') +

        cartao('<div class="linha-ic">' + A.bolha('calendario', 'var(--c3)') +
          '<div class="meio"><span class="rotulo">Próxima consulta</span><h3>Terça, 20/10 · 09:30</h3>' +
          '<div class="mudo" style="font-size:12.5px">Retorno com o Dr. André · presencial</div></div>' + A.ic('seta', 'fraco') + '</div>' +
          '<div style="margin-top:10px">' + A.item(130) + '</div>') +

        cartao('<div class="cartao-titulo"><h3>Comunidade</h3><div class="itens">' + A.item(139) + '<span class="item">versão completa</span></div></div>' +
          '<div style="display:grid;gap:12px">' +
          '<div class="linha-ic"><span class="avatar" style="background:var(--c1)">LS</span><div class="meio"><b>Lu S.</b> <span class="mudo">completou 14 dias seguidos registrando</span></div></div>' +
          '<div class="linha-ic"><span class="avatar" style="background:var(--c2)">RP</span><div class="meio"><b>Rafa P.</b> <span class="mudo">entrou no desafio "10 mil passos"</span></div></div>' +
          '</div><p class="fraco" style="font-size:12px;margin-top:10px">Com apelido e sem dados de saúde sem autorização.</p>') +

        '<div style="display:grid;gap:8px;justify-items:center;padding:6px 0 4px">' +
          '<div class="lojas"><span class="chip">' + A.item(141) + ' App Store · em breve</span><span class="chip">' + A.item(142) + ' Google Play · em breve</span></div>' +
          '<div class="fraco" style="font-size:11.5px">Hoje: instalável na tela inicial ' + A.item(94) + ' · barra de baixo ' + A.item(104) + '</div>' +
        '</div>';
    }
  };

  function emBreve(id) {
    var a = ABAS.filter(function (x) { return x.id === id; })[0];
    return '<div class="em-breve">' + A.bolha(a ? a.ic : 'mais') + '<h2>' + (a ? a.nome : 'Tela') + '</h2>' +
      '<p class="mudo">Esta tela entra no próximo PR (app completo).</p></div>';
  }

  function render() {
    var id = (location.hash || '#inicio').slice(1) || 'inicio';
    var el = document.getElementById('tela');
    el.innerHTML = TELAS[id] ? TELAS[id]() : emBreve(id);
    el.className = 'tela entra';
    document.querySelectorAll('.aba').forEach(function (b) { b.classList.toggle('ativa', b.dataset.tela === id); });
    document.getElementById('rolagem').scrollTop = 0;
  }

  function montar() {
    document.getElementById('abas').innerHTML = ABAS.map(function (a) {
      return '<a class="aba" href="#' + a.id + '" data-tela="' + a.id + '">' + A.ic(a.ic) + a.nome + '</a>';
    }).join('');
    window.addEventListener('hashchange', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
