/* Escopo interativo para a reunião com o Dr. André (prévia).
   Dados: dados.js (gerado a partir do escopo oficial) e telas.js ("ver na tela").
   Marcações (caixa, incluir · dúvida · tirar, anotações) ficam só neste aparelho (localStorage).
   Começa com todos os itens em "incluir"; "Limpar marcações" volta a esse padrão.
   Preços: Projeto 1 aparece riscado, como desconto (não entra na soma). Projetos 2 e 3 somam por lote:
   lote com algum item tirado mantém o preço e fica "a recalcular" (sem desconto automático); lote com todos
   os itens tirados sai da soma; lote "preço a definir" fica fora da soma; a versão completa do app (A9 a A11)
   é um bloco único. Itens em dúvida contam na soma, com aviso. Preços e total ficam ocultos até a senha. */
(function () {
  'use strict';
  var A = window.AG, D = window.ESCOPO, TELAS = window.TELAS_ITEM || {};
  var CHAVE = 'ag-escopo-reuniao-v' + D.versao + '-padrao-incluir';
  var ST_NOME = { incluir: 'Incluir', duvida: 'Dúvida', tirar: 'Tirar' };
  var LOTE = {}; D.lotes.forEach(function (l) { LOTE[l.id] = l; });
  var esc = A.esc;

  // ---------- marcações salvas só no aparelho ----------
  function padrao() { var st = {}; D.itens.forEach(function (i) { st[i.n] = 'incluir'; }); return { marcados: {}, status: st, notas: {} }; }
  var M = padrao();
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
    return t === 0 ? '' : t === l.length ? 'lote retirado · fora da soma' : 'a recalcular (' + t + ' de ' + l.length + ' itens retirados)';
  }

  // ---------- preços ----------
  // Valores fora do dados.js (do escopo oficial, "Visão geral"), com a decisão de 12/10/2026: o Projeto 1 entra como desconto.
  var P1 = { implantacao: 999, mensal: 599 };
  var MENSAL = { 2: 1500, 3: { porPaciente: 9 } };   // Projeto 3 sem mínimo (decisão de 12/10/2026)
  var BLOCO_VC = ['A9', 'A10', 'A11'], VC_VALOR = 20000;
  function reais(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR'); }
  function valorLote(l) {
    if (l.proposta) return null;
    if (/incluído/i.test(l.preco)) return 0;
    var m = l.preco.match(/R\$ ?([\d.]+)/); return m ? +m[1].replace(/\./g, '') : null;
  }
  function itensDe(ids) { return D.itens.filter(function (i) { return ids.indexOf(i.lote) >= 0 && !i.fora; }); }
  function situacao(ids) {
    var l = itensDe(ids), t = l.filter(function (i) { return M.status[i.n] === 'tirar'; }).length;
    return { total: l.length, tirados: t, duvida: l.filter(function (i) { return M.status[i.n] === 'duvida'; }).length, fora: l.length > 0 && t === l.length, parcial: t > 0 && t < l.length };
  }
  function conta() {
    var imp = 0, partes = [], recalc = [], semPreco = [], duvidas = 0, ativo = { 2: false, 3: false };
    D.lotes.forEach(function (l) {
      if (l.projeto === 1 || BLOCO_VC.indexOf(l.id) >= 0) return;
      var s = situacao([l.id]); if (!s.fora) ativo[l.projeto] = true;
      if (s.fora) return;
      var v = valorLote(l);
      if (v === null) { semPreco.push(l.nome); return; }
      imp += v; duvidas += s.duvida; if (s.parcial) recalc.push(l.nome);
    });
    var vc = situacao(BLOCO_VC);
    if (!vc.fora) { imp += VC_VALOR; ativo[3] = true; duvidas += vc.duvida; if (vc.parcial) recalc.push('Versão completa do app (A9 a A11)'); }
    return { imp: imp, recalc: recalc, semPreco: semPreco, duvidas: duvidas, ativo: ativo };
  }
  function precoChip(l) {
    if (l.projeto === 1) return '<span class="preco">no plano do Projeto 1</span>';
    if (l.proposta) return '<span class="preco proposta">Proposta · preço a definir</span>';
    if (!A.precoVisivel()) return '<span class="preco oculto">preço oculto</span>';
    if (BLOCO_VC.indexOf(l.id) >= 0) return '<span class="preco">versão completa · bloco de ' + reais(VC_VALOR) + '</span>';
    return '<span class="preco">' + esc(l.preco) + '</span>';
  }
  function totalHTML() {
    if (!A.precoVisivel()) return '<section class="cartao total-escopo"><h2>Total</h2><p class="mudo">Preços ocultos para a apresentação.</p><button type="button" class="botao" data-preco="mostrar">Mostrar preços</button></section>';
    var c = conta(), mens = [];
    if (c.ativo[2]) mens.push(['Projeto 2 · Gestão interna', reais(MENSAL[2]) + ' + IA por consumo']);
    if (c.ativo[3]) mens.push(['Projeto 3 · App', reais(MENSAL[3].porPaciente) + ' por paciente ativo + IA por consumo']);
    var mensal = [c.ativo[2] ? reais(MENSAL[2]) : '', c.ativo[3] ? reais(MENSAL[3].porPaciente) + ' por paciente ativo' : ''].filter(Boolean).join(' + ');
    return '<section class="cartao total-escopo"><div class="total-cab"><h2>Total</h2><button type="button" class="mini-botao" data-preco="ocultar">Ocultar preços</button></div>' +
      '<div class="total-grade">' +
        '<div><span class="rotulo">Implantação</span><div class="total-valor num">' + reais(c.imp) + '</div><small class="fraco">Projetos 2 e 3, lotes com preço</small></div>' +
        '<div><span class="rotulo">Mensalidade</span><div class="total-valor num">' + (mensal || '—') + '</div><small class="fraco">' + (mens.length ? 'por mês + IA por consumo' : 'nenhum projeto incluído') + '</small></div>' +
      '</div>' +
      (mens.length ? '<ul class="total-lista">' + mens.map(function (m) { return '<li><b>' + m[0] + ':</b> ' + m[1] + '</li>'; }).join('') + '</ul>' : '') +
      '<ul class="total-lista">' +
        '<li class="desconto"><b>Projeto 1 · Gestão Inteligente:</b> <s>' + reais(P1.implantacao) + ' de implantação</s> · <s>' + reais(P1.mensal) + ' por mês</s> <span class="selo-desconto">desconto</span></li>' +
        (c.recalc.length ? '<li><b>A recalcular (' + c.recalc.length + '):</b> ' + c.recalc.map(esc).join(', ') + '. O preço continua o mesmo até ser recalculado.</li>' : '') +
        (c.duvidas ? '<li><b>' + c.duvidas + ' item(ns) em dúvida</b> entram na soma.</li>' : '') +
        (c.semPreco.length ? '<li><b>Fora da soma (preço a definir):</b> ' + c.semPreco.map(esc).join(', ') + '.</li>' : '') +
      '</ul></section>';
  }
  function pedirSenha() {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">Mostrar preços</h2><p class="mudo" style="font-size:13.5px">Digite a senha. Os preços ficam visíveis só neste aparelho.</p>' +
      '<input class="campo" type="password" name="s" autocomplete="off" aria-label="Senha dos preços">' +
      '<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">Mostrar</button></div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!A.liberarPrecos(String(new FormData(ev.target).get('s') || ''))) { avisoCurto('Senha incorreta.'); return; }
      f.remove(); desenhar(); botaoPrecos(); avisoCurto('Preços visíveis neste aparelho.');
    });
    f.querySelector('input').focus();
  }
  function botaoPrecos() { $('precos').textContent = A.precoVisivel() ? 'Ocultar preços' : 'Mostrar preços'; }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-preco]'); if (!b) return;
    if (b.dataset.preco === 'mostrar') pedirSenha();
    else { A.ocultarPrecos(); desenhar(); botaoPrecos(); }
  });

  // ---------- desenho ----------
  function itemHTML(i) {
    var st = M.status[i.n] || '', nota = M.notas[i.n] || '', tela = TELAS[String(i.n)];
    return '<div class="item-esc' + (st ? ' st-' + st : '') + '" id="item-' + i.n + '" data-n="' + i.n + '">' +
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
      if (l.projeto !== proj) {
        proj = l.projeto;
        h += '<h2 class="titulo-projeto">' + D.projetos[proj] + '</h2>' + (proj === 1 && A.precoVisivel() ? '<p class="preco-projeto"><s>' + reais(P1.implantacao) + ' de implantação · ' + reais(P1.mensal) + ' por mês</s> <span class="selo-desconto">desconto</span> Marque à vontade: o preço do Projeto 1 não muda.</p>' : '');
      }
      var parc = l.projeto === 1 ? '' : loteParcial(l.id);
      h += '<section class="cartao lote"><div class="lote-cab"><h3>' + esc(l.nome) + '</h3><div style="display:flex;gap:6px;flex-wrap:wrap">' +
        precoChip(l) + (parc ? '<span class="recalcular">' + parc + '</span>' : '') + '</div></div>' +
        (l.nota ? '<p class="lote-nota">' + esc(l.nota) + '</p>' : '') + its.map(itemHTML).join('') + '</section>';
    });
    $('lista').innerHTML = h || '<div class="cartao vazio mudo">Nenhum item com esses filtros.</div>';
    $('total').innerHTML = totalHTML();
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
    return '- ' + i.n + ' · ' + i.nome + ' (' + l.nome.replace(/^Lote /, 'lote ') + (A.precoVisivel() ? ' · ' + A.precoLote(l) : '') + ')' + (nota ? '\n  Anotação: ' + nota.replace(/\n+/g, ' ') : '');
  }
  function resumo() {
    var grupo = function (t, f) { var l = D.itens.filter(f); return t + ' (' + l.length + ')\n' + (l.length ? l.map(linha).join('\n') : '- nenhum') + '\n'; };
    var rec = D.lotes.map(function (l) { var p = l.projeto === 1 ? '' : loteParcial(l.id); return p ? '- ' + l.nome + (A.precoVisivel() ? ' (' + l.preco + ')' : '') + ': ' + p : ''; }).filter(Boolean);
    var c = conta(), tot = A.precoVisivel() ? 'TOTAL\n- Implantação: ' + reais(c.imp) + ' (Projetos 2 e 3)\n' +
      (c.ativo[2] ? '- Mensalidade do Projeto 2: ' + reais(MENSAL[2]) + ' + IA por consumo\n' : '') + (c.ativo[3] ? '- Mensalidade do Projeto 3: ' + reais(MENSAL[3].porPaciente) + ' por paciente ativo + IA por consumo\n' : '') +
      '- Projeto 1: desconto (' + reais(P1.implantacao) + ' de implantação e ' + reais(P1.mensal) + ' por mês riscados)\n' + (c.duvidas ? '- ' + c.duvidas + ' item(ns) em dúvida entram na soma\n' : '') +
      (c.semPreco.length ? '- Fora da soma (preço a definir): ' + c.semPreco.join(', ') + '\n' : '') + '\n' : '';
    return 'Reunião com o Dr. André · Clínica Evoluir\nEscopo versão ' + D.versao + ' (' + D.atualizado + ')\n\n' +
      grupo('INCLUIR', function (i) { return M.status[i.n] === 'incluir'; }) + '\n' +
      grupo('DÚVIDAS', function (i) { return M.status[i.n] === 'duvida'; }) + '\n' +
      grupo('TIRAR', function (i) { return M.status[i.n] === 'tirar'; }) + '\n' +
      grupo('MARCADOS SEM DECISÃO', function (i) { return M.marcados[i.n] && !M.status[i.n]; }) + '\n' +
      grupo('ANOTAÇÕES EM ITENS SEM DECISÃO', function (i) { return (M.notas[i.n] || '').trim() && !M.status[i.n] && !M.marcados[i.n]; }) + '\n' +
      'LOTES A RECALCULAR (' + rec.length + ')\n' + (rec.length ? rec.join('\n') : '- nenhum') + '\n\n' + tot +
      (A.precoVisivel() ? 'Preços: como na proposta; itens em proposta com preço a definir. Nenhum valor foi recalculado.' : 'Preços ocultos neste aparelho.');
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
    if (!confirm('Voltar ao padrão (todos os itens em "incluir") e apagar as anotações deste aparelho?')) return;
    M = padrao(); notaAberta = {}; salvar(); desenhar();
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
  $('precos').addEventListener('click', function () { if (A.precoVisivel()) { A.ocultarPrecos(); desenhar(); botaoPrecos(); } else pedirSenha(); });
  botaoPrecos();
  desenhar();

  // escopo/#item-N (vindo do "Ver no escopo"): limpa os filtros, rola até o item e destaca.
  function irParaItem() {
    var m = (location.hash || '').match(/^#item-(\d+)$/); if (!m) return;
    $('busca').value = ''; $('f-projeto').value = ''; opcoesLote(); $('f-lote').value = ''; $('f-situacao').value = ''; desenhar();
    var el = document.getElementById('item-' + m[1]); if (!el) return;
    el.classList.remove('destaque'); void el.offsetWidth; el.classList.add('destaque');
    el.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('hashchange', irParaItem);
  irParaItem();
})();
