/* Conta do escopo (usada pela página do escopo e pelo orçamento em PDF). Dados: dados.js.
   Projeto 1 entra como desconto (não soma). Projetos 2 e 3 somam por lote: lote com algum item tirado mantém o preço
   ("a recalcular", sem desconto automático); lote com todos os itens tirados sai da soma; lote "preço a definir" fica
   fora da soma; a versão completa do app (A9 a A11) é um bloco único. Itens em dúvida contam na soma.
   As marcações ficam só no aparelho (localStorage), na chave da versão do escopo. */
(function () {
  'use strict';
  var D = window.ESCOPO;
  var CHAVE = 'ag-escopo-reuniao-v' + D.versao + '-padrao-incluir';
  // Valores fora do dados.js (do escopo oficial, "Visão geral"), com as decisões de 12/10/2026:
  // Projeto 1 como desconto e Projeto 3 sem mínimo.
  var P1 = { implantacao: 999, mensal: 599 };
  var MENSAL = { 2: 1500, 3: { porPaciente: 9 } };
  var BLOCO_VC = ['A9', 'A10', 'A11'], VC_VALOR = 20000;
  function padrao() { var st = {}; D.itens.forEach(function (i) { st[i.n] = 'incluir'; }); return { marcados: {}, status: st, notas: {} }; }
  function ler() { try { var s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (s && s.marcados) return s; } catch (e) { /* sem armazenamento */ } return padrao(); }
  function reais(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR'); }
  function valorLote(l) {
    if (l.proposta) return null;
    if (/incluído/i.test(l.preco)) return 0;
    var m = l.preco.match(/R\$ ?([\d.]+)/); return m ? +m[1].replace(/\./g, '') : null;
  }
  function itensDe(ids) { return D.itens.filter(function (i) { return ids.indexOf(i.lote) >= 0 && !i.fora; }); }
  function situacao(ids, M) {
    var l = itensDe(ids), t = l.filter(function (i) { return M.status[i.n] === 'tirar'; }).length;
    return { total: l.length, tirados: t, duvida: l.filter(function (i) { return M.status[i.n] === 'duvida'; }).length, fora: l.length > 0 && t === l.length, parcial: t > 0 && t < l.length };
  }
  // Implantação por lote, lotes a recalcular, lotes sem preço, itens em dúvida e quais projetos estão ativos.
  function conta(M) {
    var imp = 0, porProjeto = { 2: 0, 3: 0 }, lotes = [], recalc = [], semPreco = [], duvidas = 0, ativo = { 2: false, 3: false };
    D.lotes.forEach(function (l) {
      if (l.projeto === 1 || BLOCO_VC.indexOf(l.id) >= 0) return;
      var s = situacao([l.id], M); if (!s.fora) ativo[l.projeto] = true;
      if (s.fora) return;
      var v = valorLote(l);
      if (v === null) { semPreco.push(l.nome); return; }
      imp += v; porProjeto[l.projeto] += v; duvidas += s.duvida; lotes.push({ id: l.id, nome: l.nome, valor: v, projeto: l.projeto, recalcular: s.parcial });
      if (s.parcial) recalc.push(l.nome);
    });
    var vc = situacao(BLOCO_VC, M);
    if (!vc.fora) {
      imp += VC_VALOR; porProjeto[3] += VC_VALOR; ativo[3] = true; duvidas += vc.duvida;
      lotes.push({ id: 'VC', nome: 'Versão completa do app (A9 a A11)', valor: VC_VALOR, projeto: 3, recalcular: vc.parcial });
      if (vc.parcial) recalc.push('Versão completa do app (A9 a A11)');
    }
    return { imp: imp, porProjeto: porProjeto, lotes: lotes, recalc: recalc, semPreco: semPreco, duvidas: duvidas, ativo: ativo };
  }
  window.CALCULO = { CHAVE: CHAVE, P1: P1, MENSAL: MENSAL, BLOCO_VC: BLOCO_VC, VC_VALOR: VC_VALOR, padrao: padrao, ler: ler, reais: reais, valorLote: valorLote, situacao: situacao, conta: conta };
})();
