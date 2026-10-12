/* Orçamento para imprimir ou salvar em PDF, montado a partir das marcações do escopo neste aparelho.
   Capa com a logo, a data real e o índice; projetos e lotes incluídos; itens tirados; gráficos de implantação e de
   mensalidade; Projeto 1 como desconto; prazos a definir. Os preços só aparecem se já foram liberados com a senha. */
(function () {
  'use strict';
  var A = window.AG, D = window.ESCOPO, C = window.CALCULO, M = C.ler(), esc = A.esc, reais = C.reais, DT = A.datas;
  var precos = A.precoVisivel(), c = C.conta(M), agora = DT.agora();
  var tirados = D.itens.filter(function (i) { return M.status[i.n] === 'tirar'; });
  var duvidas = D.itens.filter(function (i) { return M.status[i.n] === 'duvida'; });
  function itensLote(id) { return D.itens.filter(function (i) { return i.lote === id; }); }
  function incluidos(id) { return itensLote(id).filter(function (i) { return M.status[i.n] !== 'tirar' && !i.fora; }); }

  // Gráfico de barras horizontais em SVG (sem biblioteca).
  function barras(lista, fmt) {
    var max = Math.max.apply(null, lista.map(function (x) { return x[1]; })) || 1, h = 34, W = 640, rot = 210;
    return '<svg class="grafico" viewBox="0 0 ' + W + ' ' + (lista.length * h + 8) + '" role="img">' + lista.map(function (x, k) {
      var w = Math.max(2, (x[1] / max) * (W - rot - 120)), y = k * h + 4;
      return '<text x="0" y="' + (y + 20) + '" class="r">' + esc(x[0]) + '</text><rect x="' + rot + '" y="' + (y + 6) + '" width="' + w + '" height="20" rx="4" class="b' + (x[2] ? ' ' + x[2] : '') + '"/>' +
        '<text x="' + (rot + w + 8) + '" y="' + (y + 20) + '" class="v">' + fmt(x[1]) + '</text>';
    }).join('') + '</svg>';
  }
  function secao(n, titulo, corpo) { return '<section class="secao" id="s' + n + '"><h2><span class="num">' + n + '</span> ' + titulo + '</h2>' + corpo + '</section>'; }
  function lotesDoProjeto(p) {
    return D.lotes.filter(function (l) { return l.projeto === p; }).map(function (l) {
      var inc = incluidos(l.id), tot = itensLote(l.id).filter(function (i) { return !i.fora; }).length;
      if (!inc.length) return '';
      var s = C.situacao([l.id], M), vc = C.BLOCO_VC.indexOf(l.id) >= 0;
      var preco = p === 1 ? 'no plano' : l.proposta ? 'Proposta · preço a definir' : !precos ? '' : vc ? 'parte da versão completa' : l.preco;
      return '<div class="lote"><div class="lote-cab"><b>' + esc(l.nome) + '</b><span>' + esc(preco) + (s.parcial && p !== 1 ? ' · <em>a recalcular</em>' : '') + '</span></div>' +
        '<p class="fraco">' + inc.length + ' de ' + tot + ' itens: ' + inc.map(function (i) { return i.n + ' ' + esc(i.nome); }).join(' · ') + '</p></div>';
    }).join('');
  }
  var dataExt = DT.cap(DT.extenso(agora)) + ' de ' + agora.getFullYear();
  var mensal = [c.ativo[2] ? reais(C.MENSAL[2]) : '', c.ativo[3] ? reais(C.MENSAL[3].porPaciente) + ' por paciente ativo' : ''].filter(Boolean).join(' + ');
  var indice = ['Resumo', 'Projeto 1 · Gestão Inteligente', 'Projeto 2 · Gestão interna (CRM e ERP)', 'Projeto 3 · App do paciente', 'Itens tirados', 'Gráficos', 'Prazos'];

  var h = '<section class="capa">' + A.logo({ tamanho: 120 }) +
    '<h1>Orçamento</h1><p class="sub">Clínica Evoluir · Dr. André Pontes Gonçalves</p>' +
    '<p class="data">' + dataExt + ' · escopo versão ' + esc(D.versao) + '</p>' +
    '<ol class="indice">' + indice.map(function (t, i) { return '<li><a href="#s' + (i + 1) + '">' + t + '</a></li>'; }).join('') + '</ol>' +
    '<p class="fraco nota-capa">Montado a partir das marcações feitas no escopo deste aparelho.' + (precos ? '' : ' Preços ocultos: libere com a senha no escopo para incluí-los.') + '</p></section>';

  h += secao(1, 'Resumo', precos
    ? '<div class="resumo"><div><span class="rotulo">Implantação</span><b class="grande">' + reais(c.imp) + '</b><small>Projetos 2 e 3, lotes com preço</small></div>' +
      '<div><span class="rotulo">Mensalidade</span><b class="grande">' + (mensal || '—') + '</b><small>por mês + IA por consumo</small></div></div>' +
      '<ul><li><b>Projeto 1:</b> <s>' + reais(C.P1.implantacao) + ' de implantação</s> · <s>' + reais(C.P1.mensal) + ' por mês</s> · desconto</li>' +
      (c.recalc.length ? '<li><b>A recalcular:</b> ' + c.recalc.map(esc).join(', ') + ' (o preço continua o mesmo até ser recalculado)</li>' : '') +
      (c.duvidas ? '<li><b>' + c.duvidas + ' item(ns) em dúvida</b> entram na soma.</li>' : '') +
      (c.semPreco.length ? '<li><b>Preço a definir (fora da soma):</b> ' + c.semPreco.map(esc).join(', ') + '</li>' : '') + '</ul>'
    : '<p class="mudo">Preços ocultos neste aparelho. O resumo mostra só o que foi incluído e tirado.</p>' +
      '<ul><li>' + (D.itens.length - tirados.length) + ' itens incluídos, ' + tirados.length + ' tirados e ' + duvidas.length + ' em dúvida.</li><li>Projeto 1 entra como desconto.</li></ul>');
  h += secao(2, 'Projeto 1 · Gestão Inteligente', '<p>' + (precos ? '<s>' + reais(C.P1.implantacao) + ' de implantação</s> · <s>' + reais(C.P1.mensal) + ' por mês</s> · ' : '') + '<b>desconto</b>: entra sem cobrança à parte.</p>' + lotesDoProjeto(1));
  h += secao(3, 'Projeto 2 · Gestão interna (CRM e ERP)', (precos && c.ativo[2] ? '<p>Mensalidade: ' + reais(C.MENSAL[2]) + ' + IA por consumo.</p>' : '') + (lotesDoProjeto(2) || '<p class="mudo">Nenhum lote incluído.</p>'));
  h += secao(4, 'Projeto 3 · App do paciente', (precos && c.ativo[3] ? '<p>Mensalidade: ' + reais(C.MENSAL[3].porPaciente) + ' por paciente ativo + IA por consumo. A versão completa (A9 a A11) é um bloco único' + (precos ? ' de ' + reais(C.VC_VALOR) : '') + '.</p>' : '') + (lotesDoProjeto(3) || '<p class="mudo">Nenhum lote incluído.</p>'));
  h += secao(5, 'Itens tirados', tirados.length ? '<ul class="tirados">' + tirados.map(function (i) { return '<li><b>' + i.n + '</b> ' + esc(i.nome) + ' <span class="fraco">(' + esc((D.lotes.filter(function (l) { return l.id === i.lote; })[0] || {}).nome || '') + ')</span></li>'; }).join('') + '</ul>' : '<p class="mudo">Nenhum item tirado.</p>');
  if (precos) {
    var porLote = c.lotes.filter(function (l) { return l.valor > 0; }).map(function (l) { return [l.nome.replace(/^Lote /, ''), l.valor, l.recalcular ? 'recalc' : 'p' + l.projeto]; });
    var pac = [100, 200, 300, 500];
    var mens = pac.map(function (n) { return [n + ' pacientes ativos', (c.ativo[2] ? C.MENSAL[2] : 0) + (c.ativo[3] ? C.MENSAL[3].porPaciente * n : 0), 'p3']; });
    h += secao(6, 'Gráficos', '<h3>Implantação por projeto</h3>' + barras([['Projeto 2', c.porProjeto[2], 'p2'], ['Projeto 3', c.porProjeto[3], 'p3']], reais) +
      '<h3>Implantação por lote</h3>' + barras(porLote, reais) +
      '<h3>Mensalidade conforme o número de pacientes ativos</h3>' + barras(mens, reais) + '<p class="fraco">Mais IA por consumo, cobrada à parte pelo uso.</p>');
  } else h += secao(6, 'Gráficos', '<p class="mudo">Os gráficos de implantação e de mensalidade aparecem quando os preços estão liberados neste aparelho.</p>');
  h += secao(7, 'Prazos', '<table class="prazos"><tr><th>Projeto</th><th>Prazo</th></tr>' + ['Projeto 1 · Gestão Inteligente', 'Projeto 2 · Gestão interna', 'Projeto 3 · App do paciente'].map(function (p) { return '<tr><td>' + p + '</td><td>a definir</td></tr>'; }).join('') + '</table>');
  h += '<p class="rodape fraco">Gerado em ' + DT.dma(agora) + ' às ' + DT.hm(agora) + '. Proposta sujeita a confirmação.</p>';
  document.getElementById('doc').innerHTML = h;
  A.log('orcamento-aberto', { precos: precos, tirados: tirados.length });
  document.getElementById('imprimir').addEventListener('click', function () { A.log('orcamento-imprimir', {}); A.enviarLog(true); window.print(); });
})();
