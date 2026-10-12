/* Resumo do escopo para imprimir ou salvar em PDF, montado a partir das marcações do escopo neste aparelho.
   Capa com a logo, a data real e o índice; subprojetos e lotes incluídos; itens tirados; prazos por etapa com o
   gráfico de semanas. Sem preços: os valores ficam na proposta da RXSync, à parte. */
(function () {
  'use strict';
  var A = window.AG, D = window.ESCOPO, C = window.CALCULO, M = C.ler(), esc = A.esc, DT = A.datas, semanas = C.semanas, num = C.num;
  var c = C.conta(M), agora = DT.agora();
  var tirados = D.itens.filter(function (i) { return M.status[i.n] === 'tirar'; });
  function itensLote(id) { return D.itens.filter(function (i) { return i.lote === id; }); }
  function incluidos(id) { return itensLote(id).filter(function (i) { return M.status[i.n] !== 'tirar'; }); }
  function nomeLote(id) { return (D.lotes.filter(function (l) { return l.id === id; })[0] || {}).nome || ''; }

  // Cronograma em barras (SVG, sem biblioteca): cada etapa de "início" a "fim", em semanas.
  function gantt(etapas, total) {
    var lista = etapas.filter(function (e) { return e.ativo; }), h = 34, W = 640, rot = 150, k = (W - rot - 150) / Math.max(1, total);
    return '<svg class="grafico" viewBox="0 0 ' + W + ' ' + (lista.length * h + 8) + '" role="img" aria-label="Semanas de cada etapa">' + lista.map(function (e, n) {
      var x = rot + (e.sub === 'P1' ? 0 : (e.ini - 1) * k), w = Math.max(3, (e.sub === 'P1' ? 1 : e.semanas) * k), y = n * h + 4;
      return '<text x="0" y="' + (y + 20) + '" class="r">' + esc('Etapa ' + e.etapa + ' · ' + (e.sub === 'P1' ? 'Projeto 1' : e.sub === 'APP' ? 'App' : e.sub)) + '</text><rect x="' + x.toFixed(1) + '" y="' + (y + 6) + '" width="' + w.toFixed(1) + '" height="20" rx="4" class="b ' + 'p' + e.etapa + '"/>' +
        '<text x="' + (x + w + 8).toFixed(1) + '" y="' + (y + 20) + '" class="v">' + esc(e.prazo) + '</text>';
    }).join('') + '</svg>';
  }
  function secao(n, titulo, corpo) { return '<section class="secao" id="s' + n + '"><h2><span class="num">' + n + '</span> ' + esc(titulo) + '</h2>' + corpo + '</section>'; }
  function lotesDoSub(sub) {
    return D.lotes.filter(function (l) { return l.sub === sub; }).map(function (l) {
      var inc = incluidos(l.id), tot = itensLote(l.id).length;
      if (!inc.length) return '';
      var s = C.situacao([l.id], M);
      var marcas = [l.antigo ? 'antes ' + l.antigo : '', l.projeto === 1 ? 'no plano' : semanas(l.semanas), l.obrigatorio ? 'obrigatório' : '', l.proposta ? 'proposta' : '', l.terceiros ? 'terceiros' : ''].filter(Boolean).join(' · ');
      return '<div class="lote"><div class="lote-cab"><b>' + esc(l.nome) + '</b><span>' + esc(marcas) + (s.parcial ? ' · <em>a recalcular</em>' : '') + '</span></div>' +
        '<p class="fraco">' + inc.length + ' de ' + tot + ' itens: ' + inc.map(function (i) { return i.n + ' ' + esc(i.nome); }).join(' · ') + '</p></div>';
    }).join('');
  }
  function linhaSub(s) { return s.incluidos + ' de ' + s.total + ' itens · ' + (s.sub === 'P1' ? 'ativação na semana 1, em paralelo' : s.semanas ? semanas(s.semanas) : 'fora do prazo'); }
  var dataExt = DT.cap(DT.extenso(agora)) + ' de ' + agora.getFullYear();
  var SECOES = c.ordem.map(function (k) { var sp = D.subprojetos[k]; return [k, k === 'P1' ? D.projetos[1] : 'Projeto ' + sp.projeto + ' · ' + sp.nome]; });
  var indice = ['Resumo'].concat(SECOES.map(function (x) { return x[1]; }), ['Itens tirados', 'Prazos por etapa']);

  var h = '<section class="capa">' + A.logo({ tamanho: 120 }) +
    '<h1>Resumo do escopo</h1><p class="sub">Clínica Evoluir · Dr. André Pontes Gonçalves</p>' +
    '<p class="data">' + dataExt + ' · escopo versão ' + esc(D.versao) + '</p>' +
    '<ol class="indice">' + indice.map(function (t, i) { return '<li><a href="#s' + (i + 1) + '">' + esc(t) + '</a></li>'; }).join('') + '</ol>' +
    '<p class="fraco nota-capa">Montado a partir das marcações feitas no escopo deste aparelho. Os valores ficam na proposta da RXSync, à parte.</p></section>';

  h += secao(1, 'Resumo',
    '<div class="resumo"><div><span class="rotulo">Itens incluídos</span><b class="grande">' + c.incluidos + ' de ' + D.itens.length + '</b><small>' + tirados.length + ' tirado(s) · ' + c.duvidas + ' em dúvida</small></div>' +
    '<div><span class="rotulo">Prazo</span><b class="grande">' + (c.semanasTotal ? semanas(c.semanasTotal) : '—') + '</b><small>' + (c.semanasTotal !== c.semanasCheias ? 'de ' + semanas(c.semanasCheias) + ' com tudo incluído' : 'com tudo incluído') + '</small></div></div>' +
    '<ul>' + c.ordem.map(function (k) { var s = c.subs[k]; return '<li><b>' + esc(s.nome) + ':</b> ' + linhaSub(s) + '</li>'; }).join('') +
    (c.recalc.length ? '<li><b>A recalcular:</b> ' + c.recalc.map(esc).join(', ') + ' (o lote continua inteiro no prazo)</li>' : '') + '</ul>');
  SECOES.forEach(function (x, n) {
    var sp = D.subprojetos[x[0]], s = c.subs[x[0]];
    h += secao(n + 2, x[1], '<p>' + esc(sp.desc) + ' <b>' + linhaSub(s) + '.</b></p>' + (lotesDoSub(x[0]) || '<p class="mudo">Nenhum lote incluído.</p>'));
  });
  var nT = SECOES.length + 2;
  h += secao(nT, 'Itens tirados', tirados.length ? '<ul class="tirados">' + tirados.map(function (i) { return '<li><b>' + i.n + '</b> ' + esc(i.nome) + ' <span class="fraco">(' + esc(nomeLote(i.lote)) + ')</span></li>'; }).join('') + '</ul>' : '<p class="mudo">Nenhum item tirado.</p>');
  h += secao(nT + 1, 'Prazos por etapa',
    '<p>Cada etapa entrega um subprojeto inteiro. Tirar lotes encurta o prazo. Prazo final: <b>' + (c.semanasTotal ? semanas(c.semanasTotal) : '—') + '</b>' + (c.semanasTotal ? ', cerca de ' + num(Math.round(c.semanasTotal / 4.345 * 2) / 2) + ' meses' : '') + '.</p>' +
    '<table class="prazos"><tr><th>Etapa</th><th>Subprojeto</th><th>Semanas</th><th>Observação</th></tr>' + c.etapas.map(function (e) {
      return '<tr><td>' + e.etapa + '</td><td>' + esc(e.nome) + '</td><td>' + esc(e.prazo) + '</td><td>' + esc(e.obs || '') + '</td></tr>';
    }).join('') + '</table>' +
    '<h3>Semanas de cada etapa</h3>' + gantt(c.etapas, c.semanasTotal || 1) +
    '<p class="fraco">Prazos que não dependem da RXSync (certificado, plataformas externas, lojas e pareceres jurídicos) podem deslocar as etapas ligadas a eles.</p>');
  h += '<p class="rodape fraco">Gerado em ' + DT.dma(agora) + ' às ' + DT.hm(agora) + '. Escopo sujeito a confirmação.</p>';
  document.getElementById('doc').innerHTML = h;
  A.log('resumo-pdf-aberto', { tirados: tirados.length, semanas: c.semanasTotal });
  document.getElementById('imprimir').addEventListener('click', function () { A.log('resumo-pdf-imprimir', {}); A.enviarLog(true); window.print(); });
})();
