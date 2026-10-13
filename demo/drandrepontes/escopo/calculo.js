/* Conta do escopo (usada pela página do escopo e pelo resumo em PDF). Dados: dados.js (sem preço).
   Por subprojeto (Projeto 1, ERP, CRM, CDX e App): itens incluídos, tirados e em dúvida, e o prazo em semanas.
   Lote com algum item tirado continua no prazo; lote com todos os itens tirados sai do prazo.
   Itens obrigatórios (lotes obrigatórios e o 172) não podem ser tirados. Itens em dúvida contam como incluídos.
   Valores: só quando o usuário vê preços (AG.precos(): Dr. André sempre, Admin com os preços liberados, Convidado nunca).
   Nenhum valor está escrito neste código; eles vêm do precos.js.
   Tirar um item desconta o preço dele do lote, do subprojeto e do total, na hora; a mensalidade do subprojeto só conta
   se algum item dele estiver incluído; desconto por faixa e à vista recalculados; Projeto 1 à parte, fora do desconto.
   As marcações ficam só no aparelho (localStorage), na chave da versão do escopo. */
(function () {
  'use strict';
  var D = window.ESCOPO;
  var CHAVE = window.AG.chaveEscopo();
  var ITEM = {}; D.itens.forEach(function (i) { ITEM[i.n] = i; });
  var ORDEM_SUB = ['P1', 'ERP', 'CRM', 'CDX', 'APP'];
  // Padrão: todas as caixinhas marcadas e todos os itens em "incluir".
  function padrao() { var st = {}, mc = {}; D.itens.forEach(function (i) { st[i.n] = 'incluir'; mc[i.n] = true; }); return { marcados: mc, status: st, notas: {} }; }
  function ler() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { /* sem armazenamento */ }
    if (!s || !s.marcados) return padrao();
    // item obrigatório nunca fica "tirar" (vale também para marcações antigas)
    Object.keys(s.status || {}).forEach(function (n) { if (s.status[n] === 'tirar' && ITEM[n] && ITEM[n].obrigatorio) s.status[n] = 'incluir'; });
    return s;
  }
  // 1,5 semana · 7 semanas (plural a partir de 2)
  function semanas(n) { return String(n).replace('.', ',') + (n >= 2 ? ' semanas' : ' semana'); }
  function num(n) { return String(n).replace('.', ','); }
  function itensDe(ids) { return D.itens.filter(function (i) { return ids.indexOf(i.lote) >= 0; }); }
  function situacao(ids, M) {
    var l = itensDe(ids), t = l.filter(function (i) { return M.status[i.n] === 'tirar'; }).length;
    return { total: l.length, tirados: t, duvida: l.filter(function (i) { return M.status[i.n] === 'duvida'; }).length, fora: l.length > 0 && t === l.length, parcial: t > 0 && t < l.length };
  }
  // Por subprojeto: itens, lotes e semanas (cheias e com o que foi tirado).
  function conta(M) {
    var subs = {}, recalc = [], duvidas = 0, tirados = 0;
    ORDEM_SUB.forEach(function (s) { subs[s] = { sub: s, nome: (D.subprojetos[s] || {}).nome || s, total: 0, incluidos: 0, tirados: 0, duvidas: 0, semanas: 0, semanasCheias: 0, lotes: 0, lotesFora: 0, recalc: [] }; });
    D.lotes.forEach(function (l) {
      var s = subs[l.sub], x = situacao([l.id], M); if (!s) return;
      s.total += x.total; s.tirados += x.tirados; s.incluidos += x.total - x.tirados; s.duvidas += x.duvida; s.lotes++;
      s.semanasCheias += l.semanas || 0;
      if (x.fora) s.lotesFora++; else s.semanas += l.semanas || 0;
      if (x.parcial) { s.recalc.push(l.nome); recalc.push(l.nome); }
      duvidas += x.duvida; tirados += x.tirados;
    });
    ORDEM_SUB.forEach(function (k) { var s = subs[k]; s.ativo = s.incluidos > 0; s.semanas = Math.round(s.semanas * 10) / 10; s.semanasCheias = Math.round(s.semanasCheias * 10) / 10; });
    var c = cronograma(subs);
    var r = { subs: subs, ordem: ORDEM_SUB, recalc: recalc, duvidas: duvidas, tirados: tirados, incluidos: D.itens.length - tirados, etapas: c.etapas, semanasTotal: c.total, semanasCheias: c.cheias };
    var P = window.AG.precos(); if (P) r.valores = valores(M, P, subs);
    return r;
  }
  // ---------- valores (só com os preços abertos) ----------
  function centavos(v) { return Math.round(v * 100) / 100; }
  function faixa(P, imp) { for (var k = 0; k < P.faixas.length; k++) { var f = P.faixas[k]; if (f.ate === null || imp <= f.ate) return f.desconto; } return 0; }
  // Implantação, desconto, à vista e mensalidade de um conjunto de valores (Projetos 2 e 3), com o Projeto 1 à parte.
  function fechar(P, imp, cheio, mensal) {
    var d = faixa(P, imp), comDesconto = centavos(imp * (1 - d)), avista = Math.round(comDesconto * P.avista);
    return { implantacao: imp, cheio: cheio, desconto: d, comDesconto: comDesconto, avista: avista, mensal: mensal,
      p1: P.p1, comP1: centavos(comDesconto + P.p1.implantacao), avistaComP1: avista + P.p1.implantacao, mensalComP1: mensal + P.p1.mensal };
  }
  function valores(M, P, subs) {
    var lotes = {}, imp = 0, cheio = 0, mensal = 0, porSub = {};
    D.lotes.forEach(function (l) {
      if (l.projeto === 1) return;
      var atual = 0; D.itens.forEach(function (i) { if (i.lote === l.id && M.status[i.n] !== 'tirar') atual += P.itens[i.n] || 0; });
      lotes[l.id] = { atual: atual, cheio: P.lotes[l.id] };
      var s = porSub[l.sub] = porSub[l.sub] || { atual: 0, cheio: 0, mensal: 0 }; s.atual += atual; s.cheio += P.lotes[l.id];
    });
    Object.keys(porSub).forEach(function (k) { var s = porSub[k]; s.mensal = subs[k] && subs[k].ativo ? P.mensal[k] : 0; imp += s.atual; cheio += s.cheio; mensal += s.mensal; });
    var r = fechar(P, imp, cheio, mensal); r.lotes = lotes; r.subs = porSub; return r;
  }
  // Pacote com subprojetos inteiros (para conferir a tabela de pacotes).
  function pacote(P, lista) {
    var imp = 0, mensal = 0;
    D.lotes.forEach(function (l) { if (lista.indexOf(l.sub) >= 0) imp += P.lotes[l.id]; });
    lista.forEach(function (k) { mensal += P.mensal[k]; });
    return fechar(P, imp, imp, mensal);
  }
  // Etapas em sequência (cada uma entrega um subprojeto inteiro); o Projeto 1 é ativado na semana 1, em paralelo.
  // Subprojeto sem nenhum lote incluído sai do cronograma, e as etapas seguintes sobem.
  function cronograma(subs) {
    var ini = 1, fim = 0, cheias = 0, etapas = [];
    (D.etapas || []).slice().sort(function (a, b) { return a.etapa - b.etapa; }).forEach(function (e) {
      var s = subs[e.sub]; if (!s) return;
      if (e.sub === 'P1') { etapas.push({ etapa: e.etapa, sub: e.sub, nome: s.nome, prazo: 'semana 1, em paralelo', semanas: 0, obs: e.obs, ativo: true }); return; }
      cheias += s.semanasCheias;
      if (!s.semanas) { etapas.push({ etapa: e.etapa, sub: e.sub, nome: s.nome, prazo: 'fora (nenhum lote incluído)', semanas: 0, obs: e.obs, ativo: false }); return; }
      fim = Math.round((ini + s.semanas - 1) * 10) / 10;
      etapas.push({ etapa: e.etapa, sub: e.sub, nome: s.nome, ini: ini, fim: fim, prazo: 'semanas ' + num(ini) + ' a ' + num(fim), semanas: s.semanas, obs: e.obs, ativo: true });
      ini = Math.round((fim + 1) * 10) / 10;
    });
    return { etapas: etapas, total: fim, cheias: Math.round(cheias * 10) / 10 };
  }
  window.CALCULO = { CHAVE: CHAVE, ORDEM_SUB: ORDEM_SUB, padrao: padrao, ler: ler, semanas: semanas, num: num, situacao: situacao, conta: conta, pacote: pacote, reais: window.AG.reais };
})();
