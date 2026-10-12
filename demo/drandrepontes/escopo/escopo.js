/* Escopo interativo para a reunião com o Dr. André (prévia).
   Dados: dados.js (gerado a partir do escopo oficial) e telas.js ("ver na tela").
   Marcações (caixa, incluir · dúvida · tirar, anotações) ficam só neste aparelho (localStorage).
   Sem cálculo automático de preço: um lote com item retirado fica "a recalcular". */
(function () {
  'use strict';
  var A = window.AG, D = window.ESCOPO, TELAS = window.TELAS_ITEM || {};
  var CHAVE = 'ag-escopo-reuniao-v' + D.versao;
  var ST_NOME = { incluir: 'Incluir', duvida: 'Dúvida', tirar: 'Tirar' };
  var LOTE = {}; D.lotes.forEach(function (l) { LOTE[l.id] = l; });
  var esc = A.esc;

  // ---------- marcações salvas só no aparelho ----------
  var M = { marcados: {}, status: {}, notas: {} };
  try { var s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (s && s.marcados) M = s; } catch (e) { /* aparelho sem armazenamento: segue só na memória */ }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(M)); } catch (e) { /* idem */ } }
  var notaAberta = {};

  // ---------- filtros ----------
  var $ = function (id) { return document.getElementById(id); };
  document.getElementById('logo').innerHTML = A.logo({ tamanho: 54, texto: false });
  $('versao').textContent = 'Clínica Evoluir · escopo versão ' + D.versao + ' (' + D.atualizado + ') · ' + D.itens.length + ' itens';
  $('f-projeto').innerHTML = '<option value="">Todos os projetos</option>' + Object.keys(D.projetos).map(function (p) { return '<option value="' + p + '">' + D.projetos[p] + '</option>'; }).join('');
  function opcoesLote() {
    var p = $('f-projeto').value;
    $('f-lote').innerHTML = '<option value="">Todos os lotes</option>' + D.lotes.filter(function (l) { return !p || String(l.projeto) === p; }).map(function (l) { return '<option value="' + l.id + '">' + esc(l.nome) + '</option>'; }).join('');
  }
  opcoesLote();

  function passa(i) {
    var b = $('busca').value.trim().toLowerCase(), p = $('f-projeto').value, l = $('f-lote').value, st = $('f-situacao').value;
    if (p && String(LOTE[i.lote].projeto) !== p) return false;
    if (l && i.lote !== l) return false;
    if (b && !(String(i.n) === b || (i.n + ' ' + i.nome + ' ' + i.desc).toLowerCase().indexOf(b) >= 0)) return false;
    if (st === 'marcado' && !M.marcados[i.n]) return false;
    if (/^(incluir|duvida|tirar)$/.test(st) && M.status[i.n] !== st) return false;
    if (st === 'nota' && !(M.notas[i.n] || '').trim()) return false;
    if (st === 'sem' && (M.marcados[i.n] || M.status[i.n] || (M.notas[i.n] || '').trim())) return false;
    return true;
  }
  function loteParcial(id) {
    var l = D.itens.filter(function (i) { return i.lote === id && !i.fora; }), t = l.filter(function (i) { return M.status[i.n] === 'tirar'; }).length;
    return t === 0 ? '' : t === l.length ? 'lote retirado' : 'a recalcular (' + t + ' de ' + l.length + ' itens retirados)';
  }

  // ---------- desenho ----------
  function itemHTML(i) {
    var st = M.status[i.n] || '', nota = M.notas[i.n] || '', tela = TELAS[String(i.n)];
    return '<div class="item-esc' + (st ? ' st-' + st : '') + '" data-n="' + i.n + '">' +
      '<input type="checkbox" aria-label="Marcar o item ' + i.n + '"' + (M.marcados[i.n] ? ' checked' : '') + ' data-acao="marcar">' +
      '<div class="cab-item"><span class="num-item">' + i.n + '</span><span class="nome-item">' + esc(i.nome) + '</span><span class="selos">' +
        (i.sempre ? '<span class="item" title="Sempre ligado">🔒 sempre ligado</span>' : '') + (i.consumo ? '<span class="item" title="IA por consumo">💲 IA por consumo</span>' : '') +
        (i.juridico ? A.juridico('depende do parecer jurídico') : '') + (i.fora ? '<span class="item item-juridico">fora do Projeto 1</span>' : '') +
        (LOTE[i.lote].proposta ? '<span class="item item-proposta">proposta</span>' : '') + '</span></div>' +
      '<div class="desc">' + esc(i.desc) + '</div>' +
      '<div class="ferramentas"><span class="rapida" role="group" aria-label="Marcação rápida">' + ['incluir', 'duvida', 'tirar'].map(function (k) {
          return '<button type="button" data-acao="status" data-st="' + k + '" aria-pressed="' + (st === k) + '">' + ST_NOME[k] + '</button>';
        }).join('') + '</span>' +
        '<button type="button" class="mini-botao' + (nota.trim() ? ' tem-nota' : '') + '" data-acao="nota">' + (nota.trim() ? 'Anotação ✓' : 'Anotar') + '</button>' +
        (tela ? '<a class="mini-botao" href="../' + tela + '" target="_blank" rel="noopener" data-leva-estilo>Ver na tela ›</a>' : '') + '</div>' +
      (notaAberta[i.n] ? '<textarea class="campo" data-acao="texto-nota" placeholder="Anotação sobre o item ' + i.n + '"></textarea>' : '') +
      '</div>';
  }
  function desenhar() {
    var h = '', proj = 0, total = 0;
    D.lotes.forEach(function (l) {
      var its = D.itens.filter(function (i) { return i.lote === l.id && passa(i); }); if (!its.length) return;
      total += its.length;
      if (l.projeto !== proj) { proj = l.projeto; h += '<h2 class="titulo-projeto">' + D.projetos[proj] + '</h2>'; }
      var parc = loteParcial(l.id);
      h += '<section class="cartao lote"><div class="lote-cab"><h3>' + esc(l.nome) + '</h3><div style="display:flex;gap:6px;flex-wrap:wrap">' +
        '<span class="preco' + (l.proposta ? ' proposta' : '') + '">' + esc(l.preco) + '</span>' + (parc ? '<span class="recalcular">' + parc + '</span>' : '') + '</div></div>' +
        (l.nota ? '<p class="lote-nota">' + esc(l.nota) + '</p>' : '') + its.map(itemHTML).join('') + '</section>';
    });
    $('lista').innerHTML = h || '<div class="cartao vazio mudo">Nenhum item com esses filtros.</div>';
    // as anotações abertas recebem o texto pelo .value (nunca como HTML)
    document.querySelectorAll('textarea[data-acao="texto-nota"]').forEach(function (t) { t.value = M.notas[t.closest('.item-esc').dataset.n] || ''; });
    contador();
  }
  function contar(f) { return D.itens.filter(f).length; }
  function contador() {
    var c = [['Marcados', contar(function (i) { return M.marcados[i.n]; })], ['Incluir', contar(function (i) { return M.status[i.n] === 'incluir'; })],
      ['Dúvida', contar(function (i) { return M.status[i.n] === 'duvida'; })], ['Tirar', contar(function (i) { return M.status[i.n] === 'tirar'; })],
      ['Anotações', contar(function (i) { return (M.notas[i.n] || '').trim(); })]];
    $('contador').innerHTML = c.map(function (x) { return '<span><b>' + x[1] + '</b>' + x[0] + '</span>'; }).join('') + '<span class="fraco"><b>' + D.itens.length + '</b>itens</span>';
  }

  // ---------- resumo da reunião ----------
  function linha(i) {
    var l = LOTE[i.lote], nota = (M.notas[i.n] || '').trim();
    return '- ' + i.n + ' · ' + i.nome + ' (' + l.nome.replace(/^Lote /, 'lote ') + ' · ' + l.preco + ')' + (nota ? '\n  Anotação: ' + nota.replace(/\n+/g, ' ') : '');
  }
  function resumo() {
    var grupo = function (t, f) { var l = D.itens.filter(f); return t + ' (' + l.length + ')\n' + (l.length ? l.map(linha).join('\n') : '- nenhum') + '\n'; };
    var rec = D.lotes.map(function (l) { var p = loteParcial(l.id); return p ? '- ' + l.nome + ' (' + l.preco + '): ' + p : ''; }).filter(Boolean);
    return 'Reunião com o Dr. André · Clínica Evoluir\nEscopo versão ' + D.versao + ' (' + D.atualizado + ')\n\n' +
      grupo('INCLUIR', function (i) { return M.status[i.n] === 'incluir'; }) + '\n' +
      grupo('DÚVIDAS', function (i) { return M.status[i.n] === 'duvida'; }) + '\n' +
      grupo('TIRAR', function (i) { return M.status[i.n] === 'tirar'; }) + '\n' +
      grupo('MARCADOS SEM DECISÃO', function (i) { return M.marcados[i.n] && !M.status[i.n]; }) + '\n' +
      grupo('ANOTAÇÕES EM ITENS SEM DECISÃO', function (i) { return (M.notas[i.n] || '').trim() && !M.status[i.n] && !M.marcados[i.n]; }) + '\n' +
      'LOTES A RECALCULAR (' + rec.length + ')\n' + (rec.length ? rec.join('\n') : '- nenhum') + '\n\n' +
      'Preços: como na proposta; itens em proposta com preço a definir. Nenhum valor foi recalculado.';
  }
  function avisoCurto(m) { var v = document.querySelector('.aviso-curto'); if (v) v.remove(); v = document.createElement('div'); v.className = 'aviso-curto'; v.textContent = m; document.body.appendChild(v); setTimeout(function () { v.remove(); }, 2600); }
  function mostrarResumo(texto, copiou) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<div class="folha"><h2 style="font-size:20px">Resumo da reunião</h2><p class="mudo" style="font-size:13px">' + (copiou ? 'Copiado. Cole na conversa com o Claude.' : 'Toque no texto, selecione tudo e copie.') + '</p>' +
      '<textarea class="campo" readonly></textarea><div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="botao" data-fechar>Fechar</button></div></div>';
    document.body.appendChild(f);
    f.querySelector('textarea').value = texto;
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
  }
  $('copiar').addEventListener('click', function () {
    var t = resumo();
    function semAPI() {
      var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a);
      a.select(); a.setSelectionRange(0, t.length); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } a.remove();
      mostrarResumo(t, ok); if (ok) avisoCurto('Resumo copiado.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { avisoCurto('Resumo copiado.'); mostrarResumo(t, true); }, semAPI);
    else semAPI();
  });
  $('limpar').addEventListener('click', function () {
    if (!confirm('Apagar todas as marcações e anotações deste aparelho?')) return;
    M = { marcados: {}, status: {}, notas: {} }; notaAberta = {}; salvar(); desenhar();
  });

  // ---------- ações ----------
  $('lista').addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]'); if (!el) return;
    var n = +el.closest('.item-esc').dataset.n, a = el.dataset.acao;
    if (a === 'status') { M.status[n] = M.status[n] === el.dataset.st ? '' : el.dataset.st; if (!M.status[n]) delete M.status[n]; salvar(); desenhar(); }
    if (a === 'nota') { notaAberta[n] = !notaAberta[n]; desenhar(); var t = document.querySelector('.item-esc[data-n="' + n + '"] textarea'); if (t) t.focus(); }
  });
  $('lista').addEventListener('change', function (ev) {
    if (ev.target.dataset.acao !== 'marcar') return;
    var n = +ev.target.closest('.item-esc').dataset.n; if (ev.target.checked) M.marcados[n] = true; else delete M.marcados[n]; salvar(); contador();
  });
  $('lista').addEventListener('input', function (ev) {
    if (ev.target.dataset.acao !== 'texto-nota') return;
    var n = +ev.target.closest('.item-esc').dataset.n, v = ev.target.value; if (v.trim()) M.notas[n] = v.slice(0, 2000); else delete M.notas[n]; salvar(); contador();
    var b = ev.target.closest('.item-esc').querySelector('[data-acao="nota"]'); b.classList.toggle('tem-nota', !!v.trim()); b.textContent = v.trim() ? 'Anotação ✓' : 'Anotar';
  });
  ['busca', 'f-lote', 'f-situacao'].forEach(function (id) { $(id).addEventListener('input', desenhar); });
  $('f-projeto').addEventListener('input', function () { opcoesLote(); desenhar(); });
  desenhar();
})();
