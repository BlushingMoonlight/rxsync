/* Conta do escopo (usada pela página do escopo e pelo resumo em PDF). Dados: dados.js.
   Sem preços: a demonstração mostra só itens, lotes e semanas. Os valores ficam na proposta, à parte.
   Por subprojeto (Projeto 1, ERP, CRM, CDX e App): itens incluídos, tirados e em dúvida, e o prazo em semanas.
   Lote com algum item tirado continua inteiro no prazo ("a recalcular"); lote com todos os itens tirados sai do prazo.
   Itens obrigatórios (lotes obrigatórios e o 172) não podem ser tirados. Itens em dúvida contam como incluídos.
   As marcações ficam só no aparelho (localStorage), na chave da versão do escopo. */
(function () {
  'use strict';
  var D = window.ESCOPO;
  var CHAVE = 'ag-escopo-reuniao-v' + D.versao + '-padrao-incluir';
  var ITEM = {}; D.itens.forEach(function (i) { ITEM[i.n] = i; });
  var ORDEM_SUB = ['P1', 'ERP', 'CRM', 'CDX', 'APP'];
  function padrao() { var st = {}; D.itens.forEach(function (i) { st[i.n] = 'incluir'; }); return { marcados: {}, status: st, notas: {} }; }
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
    return { subs: subs, ordem: ORDEM_SUB, recalc: recalc, duvidas: duvidas, tirados: tirados, incluidos: D.itens.length - tirados, etapas: c.etapas, semanasTotal: c.total, semanasCheias: c.cheias };
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
  window.CALCULO = { CHAVE: CHAVE, ORDEM_SUB: ORDEM_SUB, padrao: padrao, ler: ler, semanas: semanas, num: num, situacao: situacao, conta: conta };
})();
