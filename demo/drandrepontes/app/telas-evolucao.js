/* App do paciente · Minha evolução, Registrar peso e Sua equipe de cuidado.
   Evolução: o paciente registra SÓ o peso. Medidas e composição corporal vêm da clínica ("Acompanhado pela equipe").
   Equipe: "Solicitar contato" e "Chamar no WhatsApp" levam ao WhatsApp da clínica, por área (nunca ao número pessoal). */
(function () {
  'use strict';
  var P = window.APP, A = P.A, E = P.E, T = P.TELAS, br = P.br;

  // Peso: as avaliações da clínica (balança) e o que a paciente registrou, identificados no histórico.
  var PESOS = [[-76, 83.8], [-62, 82.9], [-45, 81.2], [-31, 80.4], [-17, 79.5], [-5, 78.6]];
  var AVALIACAO = [['Altura', '162,9 cm'], ['Peso', '78,6 kg'], ['IMC', '29,6'], ['Gordura corporal', '36,4%'], ['Músculo', '35,1%'], ['Gordura subcutânea', '33,5%'], ['Índice de gordura visceral', '10'],
    ['Proteína corporal', '12,1%'], ['Água corporal', '46,6%'], ['Massa óssea', '3,8 kg'], ['Metabolismo basal', '1.448,7 kcal/dia'], ['Relação cintura/quadril', '0,85'], ['Idade corporal estimada', '48 anos']];
  var MEDIDAS = [['Cintura', '96 cm', '89 cm'], ['Quadril', '108 cm', '103 cm'], ['Coxa', '62 cm', '60 cm'], ['Braço', '33 cm', '31 cm'], ['Busto', '104 cm', '99 cm'], ['Panturrilha', '39 cm', '38 cm']];
  T.evolucao = function () {
    var per = E.periodo, lim = [-30, -90, -9999][per], pts = PESOS.filter(function (p) { return p[0] >= lim; });
    if (pts.length < 2) pts = PESOS.slice(-2);
    var res = [['musculo', 'Músculo ganho', '+1,2 kg'], ['gordura', 'Gordura perdida', '−6,4 kg'], ['corpo', 'Gordura visceral', 'Redução de 2 pontos'], ['gota-mais', 'Água corporal', '+3,0 pontos percentuais']];
    var todas = E.aberto.medidas;
    return P.topoApp('') + '<div class="titulo-bloco"><h1 class="titulo-pagina">Minha evolução</h1><p class="subtitulo">Sua jornada, além do peso</p></div><div class="cab-itens">' + A.item([118, 119, 120, 122, 123]) + '</div>' +
      '<div class="pilulas" style="--n:3;background:var(--bege);padding:4px;border-radius:14px">' + ['30 dias', '90 dias', 'Desde o início'].map(function (t, i) {
        return '<button type="button" data-acao="periodo" data-v="' + i + '" class="' + (per === i ? 'sel' : '') + '" aria-pressed="' + (per === i) + '">' + t + '</button>'; }).join('') + '</div>' +
      '<div><h2 class="titulo-secao" style="font-size:22px">Resultados do acompanhamento</h2><p class="fraco" style="font-size:12.5px">Atualizado pela equipe • {a:-5} ' + A.item(119) + '</p></div>' +
      '<div class="grade-2">' + res.map(function (r) {
        return '<div class="cartao resultado">' + A.ilu(r[0], 62) + '<div class="meio"><small>' + r[1] + '</small><b' + (r[2].length > 9 ? ' style="font-size:17px"' : '') + '>' + r[2] + '</b>' + P.rotEquipe() + '</div></div>';
      }).join('') + '</div><p class="fraco" style="text-align:center;font-size:12px">Resultados consolidados pela equipe</p>' +
      '<h2 class="titulo-secao">Histórico do peso</h2>' +
      P.cartao(P.grafico('peso', pts.map(function (p) { return p[1]; }), pts.map(function (p) { return A.datas.dm(A.datas.somaDias(A.datas.hoje(), p[0])); }), 'kg', 1, { min: 75, max: 90, ticks: [75, 80, 85, 90], valores: true, leitura: false }) +
        '<p class="fraco" style="font-size:12px;margin-top:6px">' + A.ic('balanca').replace('class="ic', 'style="display:inline;width:14px;height:14px;vertical-align:-2px" class="ic') + ' Balança da clínica e registros seus, identificados no histórico ' + A.item(120) + '</p>') +
      '<div><h2 class="titulo-secao">Minha avaliação completa</h2><p class="fraco" style="font-size:12.5px">Última avaliação: {a:-5} · medida na clínica</p></div>' +
      '<div class="caixa-tabela"><table class="tabela-ag">' + AVALIACAO.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="v">' + r[1] + '</td></tr>'; }).join('') +
        '<tr><td colspan="2" class="fim"><a href="#documentos">Ver relatório completo ' + A.ic('seta') + '</a></td></tr></table></div>' +
      '<div class="linha-pergunta"><h2 class="titulo-secao">Minhas medidas</h2>' + P.rotEquipe() + '</div>' +
      '<div class="caixa-tabela"><table class="tabela-ag"><tr><th>Medida</th><th>Inicial</th><th>Atual</th></tr>' + MEDIDAS.slice(0, todas ? 6 : 3).map(function (r) { return '<tr><td>' + r[0] + '</td><td class="v">' + r[1] + '</td><td class="v">' + r[2] + '</td></tr>'; }).join('') +
        '<tr><td colspan="3" class="fim"><a href="#" data-acao="abre" data-k="medidas">' + (todas ? 'Ver menos' : 'Ver todas as medidas') + ' ' + A.ic(todas ? 'cima' : 'seta') + '</a></td></tr></table></div>' +
      '<h2 class="titulo-secao">Fotos de acompanhamento</h2>' +
      '<div class="fotos duas"><a class="foto" href="#fotos">' + A.ilu('avatar', 54) + '<span>{d:-76} • Início</span></a><a class="foto" href="#fotos">' + A.ilu('avatar', 54) + '<span>{d:-5} • Atual</span></a></div>' +
      '<a class="botao botao-claro" href="#fotos" style="width:100%;text-decoration:none">' + A.ic('camera') + 'Adicionar foto</a>' +
      '<a class="botao salvar" href="#medidas" style="text-decoration:none">Registrar peso<span class="seta-fim">›</span></a>' +
      '<p class="fraco" style="text-align:center;font-size:12px;margin-top:-6px">Seus registros ficam identificados no histórico</p>' +
      '<div class="lista-menu cartao" style="padding:4px 16px">' + P.linMenu('documentos', 'documento', 'var(--c3)', 'Relatórios e exames', 'PDFs da ficha e seus exames', A.item([121, 136])) + '</div>' +
      '<button class="botao botao-contorno" style="width:100%" type="button" data-acao="aviso" data-msg="PDF de exemplo gerado: Minha evolução ({d:-76} a {d:0}).">' + A.ic('download') + 'Exportar minha evolução em PDF</button>' +
      '<p class="nota-ficha">' + A.item(123) + ' Para mostrar a outro profissional.</p>';
  };
  P.ACOES.periodo = function (el, v) { E.periodo = Number(v); P.render(true); };

  // Registrar peso: só o peso. Medidas e composição corporal são feitas na clínica.
  T.medidas = function () {
    return P.cab('medidas', 'Registrar peso', 'Seu peso de hoje, na sua balança.', A.item(118)) + P.dataCartao(false) +
      '<section class="bloco"><div class="linha-ic"><div class="meio" style="display:grid;gap:10px;justify-items:center"><b style="font-size:46px;letter-spacing:-.03em">' + br(E.num.peso, 1) + ' kg</b>' +
        '<div style="width:220px">' + P.passo('peso', br(E.num.peso, 1), 'Peso') + '</div></div></div></section>' +
      P.salvar('Salvar meu peso', 'Peso registrado. Ele aparece no histórico como "registrado por você".') +
      '<section class="bloco verde"><div class="linha-ic">' + A.ilu('corpo', 56) + '<p class="meio" style="font-size:14px">Medidas e composição corporal (gordura, músculo, água) são feitas na clínica e aparecem como <b>Acompanhado pela equipe</b>. ' + A.item(119) + '</p></div></section>' +
      '<p class="fraco" style="font-size:12px;text-align:center">A balança da clínica entra sozinha, separada do que você registra.</p>' + P.ficha();
  };

  // ===== Sua equipe de cuidado =====
  T.equipe = function () {
    var dr = P.EQUIPE[0], aberto = E.aberto.todaEquipe;
    return P.topoApp('') + '<div class="titulo-bloco"><h1 class="titulo-pagina">Sua equipe de cuidado</h1><p class="subtitulo">Pessoas que acompanham sua jornada</p></div><div class="cab-itens">' + A.item([156, 157]) + '</div>' +
      '<section class="cartao pessoa-cartao principal" style="background:color-mix(in srgb,var(--dourado) 8%,var(--superficie))">' + A.ilu('avatar', 92) + '<div class="meio"><b>' + dr.nome + '</b><span class="papel">' + dr.papel + '</span><span class="desc">' + dr.desc + '</span></div></section>' +
      '<section class="cartao pessoa-cartao principal" style="background:var(--verde-claro)">' + A.ilu('whatsapp', 92) + '<div class="meio" style="gap:4px"><b>Atendimento e agendamentos</b><span class="desc" style="font-size:14px">Consultas, horários e dúvidas sobre o atendimento</span>' +
        '<button type="button" class="botao" style="height:44px;justify-content:space-between;font-size:16px" data-acao="whats" data-area="Atendimento e agendamentos">Chamar no WhatsApp <span class="seta-fim" style="margin:0">›</span></button></div></section>' +
      '<h2 class="titulo-secao">Acompanhe o Doutor André</h2>' +
      '<div class="grade-2"><button type="button" class="cartao-ilu" data-acao="aviso" data-msg="Abre o Instagram do Dr. André (exemplo).">' + A.ilu('instagram', 48) + '<span class="meio">Instagram</span>' + A.ic('seta') + '</button>' +
        '<button type="button" class="cartao-ilu" data-acao="aviso" data-msg="Abre o Facebook do Dr. André (exemplo).">' + A.ilu('facebook', 48) + '<span class="meio">Facebook</span>' + A.ic('seta') + '</button></div>' +
      P.EQUIPE.slice(1).map(function (p) {
        return '<section class="cartao pessoa-cartao" style="background:color-mix(in srgb,var(--dourado) 6%,var(--superficie))">' + A.ilu('avatar', 76) + '<div class="meio"><b>' + p.nome + '</b><span class="papel">' + p.papel + '</span><span class="desc">' + p.desc + '</span></div>' +
          '<button type="button" class="mini-botao" data-acao="' + (p.conhecer ? 'aviso' : 'whats') + '" data-area="' + p.area + '"' + (p.conhecer ? ' data-msg="A Elenice recebe você na clínica: café, água e conforto durante a visita."' : '') + '>' + A.ic('balao') + (p.conhecer ? 'Conhecer' : 'Solicitar contato') + ' ' + A.ic('seta') + '</button></section>';
      }).join('') +
      '<section class="bloco acordeao" style="background:color-mix(in srgb,var(--verde-claro) 60%,var(--superficie))"><button type="button" class="cab-acordeao" data-acao="abre" data-k="todaEquipe" aria-expanded="' + !!aberto + '">' + A.ic('pessoas') +
        '<span class="meio"><b style="font-size:19px">Conheça toda a equipe</b><br><span style="color:var(--primaria);font-weight:600">Quem faz tudo acontecer</span></span>' + A.ic(aberto ? 'cima' : 'baixo') + '</button>' +
        (aberto ? '<div class="lista-reg">' + P.TODA_EQUIPE.map(function (t) { return '<div class="reg" style="box-shadow:none">' + A.ilu('avatar', 40) + '<div class="meio"><b>' + t[0] + '</b><small>' + t[1] + '</small></div></div>'; }).join('') + '</div>' : '') + '</section>' +
      '<div class="lista-menu cartao" style="padding:4px 16px">' +
        P.linMenu('chat', 'chat', 'var(--primaria)', 'Falar com a equipe no app', 'a resposta chega citada, sem alteração', A.item([60, 157])) +
        P.linMenu('ia', 'ia', 'var(--c4)', 'Assistente da AG Melhor Versão', 'dúvidas do dia a dia · IA', A.item(143)) +
      '</div><p class="fraco" style="font-size:12px;text-align:center">Os contatos levam ao WhatsApp da clínica, pela área. Nunca ao número pessoal de alguém da equipe.</p>';
  };
})();
