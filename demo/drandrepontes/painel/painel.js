/* Painel da clínica · um único código; cada tela é uma função em TELAS e abre por #tela (ex.: #dia).
   Dados de exemplo fictícios (pacientes inventados). A IA é simulada. */
(function () {
  'use strict';
  var A = window.AG;

  // Menu: as áreas ficam separadas, como no escopo (Base, CRM, ERP) + Atendimento RXSync + App + Central do médico.
  var MENU = [
    { grupo: 'Hoje', itens: [{ id: 'dia', nome: 'Visão do dia', ic: 'inicio' }] },
    { grupo: 'Atendimento RXSync', itens: [
      { id: 'atendimento', nome: 'Conversas da IA', ic: 'whatsapp' },
      { id: 'agenda-ia', nome: 'Agenda, fila e pré-consulta', ic: 'calendario' },
      { id: 'relacionamento', nome: 'Relacionamento', ic: 'sino' }] },
    { grupo: 'CRM', itens: [
      { id: 'pacientes', nome: 'Pacientes', ic: 'pacientes' },
      { id: 'funil', nome: 'Funil', ic: 'funil' },
      { id: 'casos', nome: 'Casos por área', ic: 'equipe' },
      { id: 'conversas', nome: 'Conversas', ic: 'chat' }] },
    { grupo: 'ERP', itens: [
      { id: 'agenda', nome: 'Agenda', ic: 'calendario' },
      { id: 'fichas', nome: 'Fichas e balança', ic: 'documento' },
      { id: 'financeiro', nome: 'Financeiro e estoque', ic: 'moeda' },
      { id: 'ia-equipe', nome: 'IA da equipe e manual', ic: 'ia' }] },
    { grupo: 'App do paciente', itens: [
      { id: 'app', nome: 'Conteúdo e prescrições', ic: 'seringa' }] },
    { grupo: 'Central do médico', itens: [
      { id: 'central', nome: 'Consulta e assistente', ic: 'estetoscopio' }] },
    { grupo: 'Profissionais', itens: [
      { id: 'profissionais', nome: 'Painel de cada um', ic: 'perfil' }] },
    { grupo: 'Base', itens: [
      { id: 'consumo', nome: 'Consumo de IA', ic: 'evolucao' },
      { id: 'config', nome: 'Configurações e acessos', ic: 'engrenagem' }] }
  ];

  function cartao(conteudo, classe) { return '<section class="cartao ' + (classe || '') + '">' + conteudo + '</section>'; }
  function titulo(t, itens) { return '<div class="cartao-titulo"><h3>' + t + '</h3><div class="itens">' + (itens || '') + '</div></div>'; }

  var AGENDA = [
    ['08:00', 'Beatriz Nogueira', 'P-DEMO2', 'Retorno · 30 min', 'Dr. André', 'st-ok', 'Confirmada'],
    ['08:30', 'Carlos Menezes', 'P-DEMO5', 'Bioimpedância', 'Eduarda', 'st-ok', 'Na clínica'],
    ['09:00', 'Helena Duarte', 'P-DEMO9', 'Primeira consulta · 60 min', 'Dr. André', 'st-in', 'Pré-consulta ok'],
    ['10:00', 'Rodrigo Alves', 'P-DEMO4', 'Nutrição · retorno', 'Felipe', 'st-al', 'Sem confirmar'],
    ['10:30', 'Marina Lopes', 'P-DEMO7', 'Aplicação na clínica', 'Thaís', 'st-ok', 'Confirmada'],
    ['11:00', 'Paula Freitas', 'P-DEMO3', 'Psicologia', 'Maria Clara', 'st-pe', 'Pagamento em aberto']
  ];

  var TELAS = {
    dia: function () {
      return '' +
        '<div class="cabeca"><div><div class="mudo" style="font-size:13px">Terça, 13 de outubro</div><h1>Visão do dia</h1></div>' +
          '<div class="direita"><div class="busca">' + A.ic('pacientes') + 'Buscar paciente, telefone ou ID</div>' +
          '<div class="eu"><span class="avatar">AG</span></div></div></div>' +

        '<div class="kpis">' +
          kpi('Consultas hoje', '14', '2 encaixes', 'sobe') +
          kpi('Faltas na semana', '3', '−2 vs. semana passada', 'sobe') +
          kpi('Ativos no app', '186', '+9 este mês', 'sobe') +
          kpi('Adesão média', '78%', 'registros na semana', '') +
          kpi('Perda média', '−6,4 kg', 'em 90 dias', 'sobe') +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:-8px">' + A.item(56) + '</div>' +

        '<div class="grade">' +
          cartao(titulo('Agenda de hoje', A.item([50, 51])) +
            '<div class="lista">' + AGENDA.map(function (a) {
              return '<div class="lin"><span class="hora num">' + a[0] + '</span><div class="meio"><b>' + a[1] + '</b> <span class="idp">' + a[2] + '</span>' +
                '<div class="fraco">' + a[3] + ' · ' + a[4] + '</div></div><span class="status ' + a[5] + '">' + a[6] + '</span></div>';
            }).join('') + '</div>', 's7') +

          cartao(titulo('Alertas', A.item([129, 135])) +
            '<div class="alerta-lin" style="--cor:var(--perigo)">' + A.bolha('alerta', 'var(--perigo)') + '<div><b>Carlos M. relatou náusea forte</b><div class="fraco" style="font-size:12.5px">2 dias depois da aplicação · enfermagem avisada às 07:42</div></div></div>' +
            '<div class="alerta-lin" style="--cor:var(--alerta)">' + A.bolha('evolucao', 'var(--alerta)') + '<div><b>Rodrigo A. parou de registrar</b><div class="fraco" style="font-size:12.5px">5 dias sem registro no app</div></div></div>' +
            '<div class="alerta-lin" style="--cor:var(--info)">' + A.bolha('seringa', 'var(--info)') + '<div><b>Estoque: 4 frascos</b> ' + A.item(91) + '<div class="fraco" style="font-size:12.5px">abaixo do mínimo de 6</div></div></div>', 's5') +

          cartao(titulo('Antes da próxima consulta', A.item(71)) +
            '<div class="linha-ic" style="display:flex;gap:12px;align-items:center">' + A.bolha('documento', 'var(--c3)') +
            '<div><b>Helena Duarte · 09:00</b> <span class="idp">P-DEMO9</span><div class="fraco" style="font-size:12.5px">Primeira consulta</div></div></div>' +
            '<p class="mudo" style="margin-top:12px;font-size:13.5px">Respondeu a pré-consulta: objetivo perder 12 kg, sem cirurgias, usa anticoncepcional. Peso informado 84 kg. <span class="fraco">(resumo simulado)</span></p>', 's4') +

          cartao(titulo('Casos abertos por área', A.item(62)) +
            '<div class="casos">' +
              caso('Nutrição', 3, '1 aguardando Felipe') + caso('Enfermagem', 2, '1 atrasado', 'var(--perigo)') +
              caso('Financeiro', 1, 'Emanuele') + caso('Médico', 1, 'Dr. André') +
            '</div>', 's4') +

          cartao(titulo('Atendimento pela IA hoje', A.item([1, 10])) +
            '<div style="display:flex;gap:24px;align-items:flex-end;flex-wrap:wrap">' +
              '<div><div class="num" style="font-size:34px;font-weight:700;line-height:1">37</div><div class="fraco" style="font-size:12.5px">conversas</div></div>' +
              '<div><div class="num" style="font-size:34px;font-weight:700;line-height:1">9</div><div class="fraco" style="font-size:12.5px">consultas marcadas</div></div>' +
              '<div><div class="num" style="font-size:34px;font-weight:700;line-height:1">4</div><div class="fraco" style="font-size:12.5px">passadas à equipe</div></div>' +
            '</div><div style="margin-top:14px">' + A.item(4) + ' ' + A.item(58) + '</div>', 's4') +

          cartao(titulo('Consumo de IA do mês', A.item([146, 147])) +
            '<div style="display:flex;align-items:center;gap:18px">' +
              A.anel({ tamanho: 92, espessura: 9, valor: .53, centro: '<div><div class="num" style="font-size:20px;font-weight:700">53%</div></div>' }) +
              '<div><div class="num" style="font-size:22px;font-weight:700">R$ 212,40</div><div class="fraco" style="font-size:12.5px">de um teto de R$ 400 · valores de exemplo</div>' +
              '<div class="mudo" style="font-size:12.5px;margin-top:6px">Aviso em 80% e 100%</div></div></div>', 's6 cartao-destaque') +

          cartao(titulo('Painel de cada profissional', A.novo() + A.proposta()) +
            '<p class="mudo" style="font-size:13.5px">André, Emanuele, Felipe, Maria Clara, Eduarda, Thaís e Elenice: cada um abre o painel no que importa para a sua função. Chega no PR do painel completo.</p>', 's6') +
        '</div>';
    }
  };
  function kpi(nome, valor, extra, cls) {
    return cartao('<span class="rotulo">' + nome + '</span><div class="valor num">' + valor + '</div><div class="var ' + cls + '">' + extra + '</div>', 'kpi');
  }
  function caso(nome, n, sub, cor) {
    return '<div class="caso"><span class="fraco" style="font-size:12px;font-weight:600">' + nome + '</span><span class="num" style="color:' + (cor || 'inherit') + '">' + n + '</span><span class="fraco" style="font-size:11.5px">' + sub + '</span></div>';
  }

  function emBreve(id) {
    var nome = id;
    MENU.forEach(function (g) { g.itens.forEach(function (i) { if (i.id === id) nome = i.nome; }); });
    return '<div class="cabeca"><h1>' + nome + '</h1></div>' +
      cartao('<div class="em-breve">' + A.bolha('mais') + '<h2>' + nome + '</h2><p class="mudo">Esta tela entra no PR do painel completo.</p></div>');
  }

  function render() {
    var id = (location.hash || '#dia').slice(1) || 'dia';
    var el = document.getElementById('tela');
    el.innerHTML = TELAS[id] ? TELAS[id]() : emBreve(id);
    el.className = 'principal entra';
    document.querySelectorAll('.menu a').forEach(function (a) { a.classList.toggle('ativo', a.dataset.tela === id); });
    document.querySelector('.casca').classList.remove('menu-aberto');
    window.scrollTo(0, 0);
  }

  function montar() {
    document.getElementById('menu').innerHTML =
      '<div class="marca">' + A.logo({ tamanho: 46, texto: false }) + '<div><b>Clínica Evoluir</b><small>Dr. André Pontes Gonçalves</small></div></div>' +
      MENU.map(function (g) {
        return '<nav class="grupo"><span>' + g.grupo + '</span>' + g.itens.map(function (i) {
          return '<a href="#' + i.id + '" data-tela="' + i.id + '">' + A.ic(i.ic) + i.nome + '</a>';
        }).join('') + '</nav>';
      }).join('');
    document.getElementById('abrir-menu').addEventListener('click', function () { document.querySelector('.casca').classList.add('menu-aberto'); });
    document.querySelector('.veu').addEventListener('click', function () { document.querySelector('.casca').classList.remove('menu-aberto'); });
    document.getElementById('abrir-menu').innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
    document.getElementById('marca-topo').innerHTML = A.logo({ tamanho: 34, texto: false });
    window.addEventListener('hashchange', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
