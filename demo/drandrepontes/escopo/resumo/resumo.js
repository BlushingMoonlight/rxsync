/* Resumo do escopo para imprimir ou salvar em PDF, montado a partir das marcações do escopo neste aparelho.
   Capa com a logo, a data real e o índice; subprojetos e lotes incluídos; itens tirados; prazos por etapa (a partir da
   assinatura, com o recesso de fim de ano como pausa), o gráfico de semanas e os marcos de cada etapa (o que funciona e o
   que ainda falta). Valores só para quem vê preços (Dr. André; Admin com os preços liberados): implantação, desconto, à vista,
   mensalidade, Projeto 1 à parte, valor de cada lote e de cada item, e o gráfico de implantação por subprojeto.
   Com um pacote sugerido aplicado (Pacote V1 · pós-reunião): o nome na capa e no resumo, o motivo de cada item tirado
   pelo pacote e um aviso sobre os marcos (eles descrevem o projeto com tudo incluído). */
(function () {
  'use strict';
  var A = window.AG, D = window.ESCOPO, C = window.CALCULO, M = C.ler(), esc = A.esc, DT = A.datas, semanas = C.semanas, num = C.num;
  var PA = C.pacoteAplicado(M), c = C.conta(M), agora = DT.agora(), V = c.valores || null, P = V && A.precos(), reais = A.reais;
  function valor(atual, cheio) { return atual === cheio ? reais(cheio) : reais(atual) + ' de ' + reais(cheio); }
  var tirados = D.itens.filter(function (i) { return M.status[i.n] === 'tirar'; });
  function itensLote(id) { return D.itens.filter(function (i) { return i.lote === id; }); }
  function incluidos(id) { return itensLote(id).filter(function (i) { return M.status[i.n] !== 'tirar'; }); }
  function nomeLote(id) { return (D.lotes.filter(function (l) { return l.id === id; })[0] || {}).nome || ''; }

  // Cronograma em barras (SVG, sem biblioteca): cada etapa de "início" a "fim", em semanas; o recesso numa linha própria.
  function gantt(etapas, total, rec) {
    var lista = etapas.filter(function (e) { return e.ativo; }), h = 34, W = 640, rot = 150, k = (W - rot - 150) / Math.max(1, total);
    var linhas = lista.map(function (e) {
      var x = rot + (e.sub === 'P1' ? 0 : (e.ini - 1) * k), w = Math.max(3, (e.sub === 'P1' ? 1 : e.fim - e.ini + 1) * k);
      return [esc('Etapa ' + e.etapa + ' · ' + (e.sub === 'P1' ? 'Projeto 1' : e.sub === 'APP' ? 'App' : e.sub)), x, w, 'p' + e.etapa, esc(e.prazo)];
    });
    if (rec) linhas.push(['Recesso', rot + (rec.ini - 1) * k, Math.max(3, rec.semanas * k), 'rec', esc(rec.prazo)]);
    return '<svg class="grafico" viewBox="0 0 ' + W + ' ' + (linhas.length * h + 8) + '" role="img" aria-label="Semanas de cada etapa">' + linhas.map(function (l, n) {
      var y = n * h + 4;
      return '<text x="0" y="' + (y + 20) + '" class="r">' + l[0] + '</text><rect x="' + l[1].toFixed(1) + '" y="' + (y + 6) + '" width="' + l[2].toFixed(1) + '" height="20" rx="4" class="b ' + l[3] + '"/>' +
        '<text x="' + (l[1] + l[2] + 8).toFixed(1) + '" y="' + (y + 20) + '" class="v">' + l[4] + '</text>';
    }).join('') + '</svg>';
  }
  function secao(n, titulo, corpo) { return '<section class="secao" id="s' + n + '"><h2><span class="num">' + n + '</span> ' + esc(titulo) + '</h2>' + corpo + '</section>'; }
  function lotesDoSub(sub) {
    return D.lotes.filter(function (l) { return l.sub === sub; }).map(function (l) {
      var inc = incluidos(l.id), tot = itensLote(l.id).length;
      if (!inc.length) return '';
      var s = C.situacao([l.id], M);
      var marcas = [V && V.lotes[l.id] ? valor(V.lotes[l.id].atual, V.lotes[l.id].cheio) : '', l.antigo ? 'antes ' + l.antigo : '', l.projeto === 1 ? 'no plano' : semanas(l.semanas), l.obrigatorio ? 'obrigatório' : '', l.proposta ? 'proposta' : '', l.terceiros ? 'terceiros' : ''].filter(Boolean).join(' · ');
      return '<div class="lote"><div class="lote-cab"><b>' + esc(l.nome) + '</b><span>' + esc(marcas) + (s.parcial ? ' · <em>' + s.tirados + ' de ' + s.total + ' itens tirados</em>' : '') + '</span></div>' +
        '<p class="fraco">' + inc.length + ' de ' + tot + ' itens: ' + inc.map(function (i) { return i.n + ' ' + esc(i.nome) + (P && P.itens[i.n] ? ' (' + reais(P.itens[i.n]) + ')' : ''); }).join(' · ') + '</p></div>';
    }).join('');
  }
  function linhaSub(s) {
    var v = V && V.subs[s.sub];
    return s.incluidos + ' de ' + s.total + ' itens · ' + (s.sub === 'P1' ? 'ativação na semana 1, em paralelo' : s.semanas ? semanas(s.semanas) : 'fora do prazo') +
      (!V ? '' : s.sub === 'P1' ? ' · ' + reais(V.p1.implantacao) + ' + ' + reais(V.p1.mensal) + ' por mês' : v ? ' · ' + valor(v.atual, v.cheio) + (v.mensal ? ' + ' + reais(v.mensal) + ' por mês' : '') : '');
  }
  // Barras horizontais em SVG (sem biblioteca): implantação por subprojeto.
  function barras(lista) {
    var max = Math.max.apply(null, lista.map(function (x) { return x[1]; })) || 1, h = 34, W = 640, rot = 150;
    return '<svg class="grafico" viewBox="0 0 ' + W + ' ' + (lista.length * h + 8) + '" role="img" aria-label="Implantação por subprojeto">' + lista.map(function (x, k) {
      var w = Math.max(2, (x[1] / max) * (W - rot - 130)), y = k * h + 4;
      return '<text x="0" y="' + (y + 20) + '" class="r">' + esc(x[0]) + '</text><rect x="' + rot + '" y="' + (y + 6) + '" width="' + w.toFixed(1) + '" height="20" rx="4" class="b p' + (k + 1) + '"/>' +
        '<text x="' + (rot + w + 8).toFixed(1) + '" y="' + (y + 20) + '" class="v">' + esc(reais(x[1])) + '</text>';
    }).join('') + '</svg>';
  }
  function valoresHTML() {
    if (!V) return '';
    return '<h3>Valores</h3><div class="resumo"><div><span class="rotulo">Implantação · Projetos 2 e 3</span><b class="grande">' + reais(V.comDesconto) + '</b><small>' + reais(V.implantacao) + ' − ' + Math.round(V.desconto * 100) + '% de desconto pelo valor</small></div>' +
      '<div><span class="rotulo">Mensalidade</span><b class="grande">' + reais(V.mensal) + '</b><small>Projetos 2 e 3 + IA por consumo</small></div></div>' +
      '<ul><li><b>À vista em dinheiro ou cripto:</b> ' + reais(V.avista) + '</li>' +
      '<li><b>Projeto 1:</b> ' + reais(V.p1.implantacao) + ' + ' + reais(V.p1.mensal) + ' por mês, fora do desconto</li>' +
      '<li><b>Com o Projeto 1:</b> ' + reais(V.comP1) + ' com desconto · ' + reais(V.avistaComP1) + ' à vista · ' + reais(V.mensalComP1) + ' por mês + IA por consumo</li>' +
      (V.implantacao !== V.cheio ? '<li>Com tudo incluído, a implantação seria ' + reais(V.cheio) + '. O preço de cada item tirado já foi descontado.</li>' : '') + '</ul>' +
      '<h3>Implantação por subprojeto</h3>' + barras(['ERP', 'CRM', 'CDX', 'APP'].filter(function (k) { return V.subs[k] && V.subs[k].atual; }).map(function (k) { return [c.subs[k].nome.replace(/ · .*$/, ''), V.subs[k].atual]; }));
  }
  var dataExt = DT.cap(DT.extenso(agora)) + ' de ' + agora.getFullYear();
  var SECOES = c.ordem.map(function (k) { var sp = D.subprojetos[k]; return [k, k === 'P1' ? D.projetos[1] : 'Projeto ' + sp.projeto + ' · ' + sp.nome]; });
  var indice = ['Resumo'].concat(SECOES.map(function (x) { return x[1]; }), ['Itens tirados', 'Prazos e marcos por etapa']);

  var h = '<section class="capa">' + A.logo({ tamanho: 120 }) +
    '<h1>Resumo do escopo</h1><p class="sub">AG Melhor Versão · Doutor André Pontes Gonçalves</p>' +
    '<p class="data">' + dataExt + ' · escopo versão ' + esc(D.versao) + '</p>' +
    '<ol class="indice">' + indice.map(function (t, i) { return '<li><a href="#s' + (i + 1) + '">' + esc(t) + '</a></li>'; }).join('') + '</ol>' +
    (PA ? '<p class="pacote-capa">' + esc(C.textoPacote(PA)) + '</p>' : '') +
    '<p class="fraco nota-capa">Montado a partir das marcações feitas no escopo deste aparelho.' + (V ? '' : ' Valores sob consulta.') + '</p></section>';

  h += secao(1, 'Resumo',
    '<div class="resumo"><div><span class="rotulo">Itens incluídos</span><b class="grande">' + c.incluidos + ' de ' + D.itens.length + '</b><small>' + tirados.length + ' tirado(s) · ' + c.duvidas + ' em dúvida</small></div>' +
    '<div><span class="rotulo">Prazo · a partir da assinatura</span><b class="grande">' + (c.semanasTotal ? semanas(c.semanasTotal) : '—') + '</b><small>' + (c.recesso ? 'com 2 semanas de recesso de fim de ano · ' : '') + (c.semanasTotal !== c.semanasCheias ? 'de ' + semanas(c.semanasCheias) + ' com tudo incluído' : 'com tudo incluído') + '</small></div></div>' +
    '<ul>' + (PA ? '<li><b>Pacote aplicado:</b> ' + esc(C.textoPacote(PA)) + '; ' + PA.tirados + ' itens tirados pelo pacote, com o motivo de cada um em "Itens tirados".</li>' : '') +
    c.ordem.map(function (k) { var s = c.subs[k]; return '<li><b>' + esc(s.nome) + ':</b> ' + linhaSub(s) + '</li>'; }).join('') +
    (c.recalc.length ? '<li><b>Lotes com itens tirados:</b> ' + c.recalc.map(esc).join(', ') + ' (continuam no prazo' + (V ? '; o preço dos itens tirados já foi descontado' : '') + ')</li>' : '') + '</ul>' + valoresHTML());
  SECOES.forEach(function (x, n) {
    var sp = D.subprojetos[x[0]], s = c.subs[x[0]];
    h += secao(n + 2, x[1], '<p>' + esc(sp.desc) + ' <b>' + linhaSub(s) + '.</b></p>' + (lotesDoSub(x[0]) || '<p class="mudo">Nenhum lote incluído.</p>'));
  });
  var nT = SECOES.length + 2;
  h += secao(nT, 'Itens tirados', tirados.length ? '<ul class="tirados">' + tirados.map(function (i) { return '<li><b>' + i.n + '</b> ' + esc(i.nome) + ' <span class="fraco">(' + esc(nomeLote(i.lote)) + ')</span>' + (PA && PA.motivo[i.n] ? '<br><span class="motivo">Fora do ' + esc(PA.curto) + ': ' + esc(PA.motivo[i.n]) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="mudo">Nenhum item tirado.</p>');
  // Linhas da tabela de prazos, com o recesso logo depois da etapa em que cai (ou antes da etapa seguinte).
  function linhasPrazo() {
    var r = c.recesso, l = [];
    c.etapas.forEach(function (e) {
      var linhaRec = r ? '<tr class="recesso"><td>—</td><td>Recesso de fim de ano</td><td>' + esc(r.prazo) + '</td><td>Pausa ' + (r.dentro != null ? 'dentro da etapa ' + r.dentro : 'antes da etapa ' + r.antes) + ' (21/12 a 01/01 no exemplo)</td></tr>' : '';
      if (r && r.antes === e.etapa) l.push(linhaRec);
      l.push('<tr><td>' + e.etapa + '</td><td>' + esc(e.nome) + '</td><td>' + esc(e.prazo) + '</td><td>' + esc(e.obs || '') + '</td></tr>');
      if (r && r.dentro === e.etapa) l.push(linhaRec);
    });
    return l.join('');
  }
  function marcos() {
    return '<table class="prazos marcos"><tr><th>Etapa</th><th>Funcionando ao fim da etapa</th><th>Ainda falta</th></tr>' + c.etapas.map(function (e) {
      return '<tr><td>' + e.etapa + ' · ' + esc(e.sub === 'P1' ? 'Projeto 1' : e.sub === 'APP' ? 'App' : e.sub) + '</td>' +
        (e.ativo ? '<td>' + esc(DT.cap(e.marco)) + '</td><td>' + esc(DT.cap(e.falta)) + '</td>' : '<td colspan="2" class="fraco">Fora do projeto (nenhum lote incluído).</td>') + '</tr>';
    }).join('') + '</table>';
  }
  h += secao(nT + 1, 'Prazos e marcos por etapa',
    '<p>Cada etapa entrega um subprojeto inteiro, nesta ordem: ERP, CDX, CRM e App. As semanas contam a partir da assinatura. Tirar lotes encurta o prazo. Prazo final: <b>' + (c.semanasTotal ? semanas(c.semanasTotal) : '—') + '</b>' + (c.semanasTotal ? ', cerca de ' + num(Math.round(c.semanasTotal / 4.345 * 2) / 2) + ' meses' : '') + (c.recesso ? ', com 2 semanas de recesso de fim de ano' : '') + '.</p>' +
    '<p class="fraco">Exemplo: assinando até 16/10/2026, o início é em 19/10/2026 e o recesso vai de 21/12 a 01/01.</p>' +
    '<table class="prazos"><tr><th>Etapa</th><th>Subprojeto</th><th>Semanas</th><th>Observação</th></tr>' + linhasPrazo() + '</table>' +
    '<h3>Semanas de cada etapa</h3>' + gantt(c.etapas, c.semanasTotal || 1, c.recesso) +
    '<h3>Marcos de cada etapa</h3><p class="fraco">O que a clínica vê funcionando ao fim de cada etapa, com tudo incluído, e o que ainda falta porque chega numa etapa seguinte.</p>' +
    (PA ? '<p class="aviso-marcos">' + esc(C.avisoMarcos(PA)) + '</p>' : '') + marcos() +
    '<p class="fraco">Prazos que não dependem da RXSync (certificado, plataforma de receita, lojas e API da balança) podem atrasar o lote ligado a eles. Nesse caso, a etapa é entregue sem esse lote, e ele entra depois, sem cobrança extra.</p>');
  h += '<p class="rodape fraco">Gerado em ' + DT.dma(agora) + ' às ' + DT.hm(agora) + '. Escopo sujeito a confirmação.</p>';
  document.getElementById('doc').innerHTML = h;
  A.log('resumo-pdf-aberto', { tirados: tirados.length, semanas: c.semanasTotal, precos: !!V, pacote: M.pacote || '' });
  document.getElementById('imprimir').addEventListener('click', function () { A.log('resumo-pdf-imprimir', {}); A.enviarLog(true); window.print(); });
})();
