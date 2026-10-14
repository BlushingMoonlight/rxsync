/* Escopo interativo para a reunião com o Dr. André (prévia).
   Dados: dados.js (gerado a partir do escopo oficial) e telas.js ("ver na tela").
   Marcações (caixa, incluir · dúvida · tirar, anotações) ficam só neste aparelho (localStorage).
   Começa com todas as caixinhas marcadas e todos os itens em "incluir"; "Limpar marcações" volta a esse padrão.
   A página mostra os itens, os lotes (código novo e o antigo ao lado), o prazo em semanas por subprojeto
   (Projeto 1, ERP, CRM, CDX e App) e o cronograma, a partir da assinatura, com o recesso de fim de ano como pausa
   (a conta fica no calculo.js). Lote com todos os itens tirados sai do prazo. Itens obrigatórios
   (lotes obrigatórios e o 172) não têm "Tirar".
   Preços (AG.precos()): Dr. André sempre vê; Admin só com os preços liberados (botão "Esconder/Liberar preços" aqui e
   na home); Convidado nunca ("sob consulta"). Com preços, cada item mostra o seu preço, e cada lote e subprojeto mostra o
   valor atual (sem o que foi tirado) e o cheio; o total recalcula na hora. */
(function () {
  'use strict';
  var A = window.AG, D = window.ESCOPO, TELAS = window.TELAS_ITEM || {};
  var CHAVE = window.CALCULO.CHAVE;
  var ST_NOME = { incluir: 'Incluir', duvida: 'Dúvida', tirar: 'Tirar' };
  var LOTE = {}; D.lotes.forEach(function (l) { LOTE[l.id] = l; });
  var esc = A.esc;

  // ---------- marcações salvas só no aparelho ----------
  var padrao = window.CALCULO.padrao, M = window.CALCULO.ler();
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(M)); } catch (e) { /* idem */ } }
  var notaAberta = {};

  // ---------- filtros ----------
  var $ = function (id) { return document.getElementById(id); };
  document.getElementById('logo').innerHTML = A.logo({ tamanho: 54, texto: false });
  $('versao').textContent = 'Clínica Evoluir · escopo versão ' + D.versao + ' (' + D.atualizado + ') · ' + D.itens.length + ' itens';
  // Filtro por projeto e subprojeto (Projeto 2: ERP, CRM e CDX).
  $('f-projeto').innerHTML = '<option value="">Todos os projetos</option>' + window.CALCULO.ORDEM_SUB.map(function (k) {
    var sp = D.subprojetos[k]; return '<option value="' + k + '">' + esc(k === 'P1' ? D.projetos[1] : 'Projeto ' + sp.projeto + ' · ' + sp.nome) + '</option>';
  }).join('');
  function opcoesLote() {
    var p = $('f-projeto').value;
    $('f-lote').innerHTML = '<option value="">Todos os lotes</option>' + D.lotes.filter(function (l) { return !p || l.sub === p; }).map(function (l) { return '<option value="' + l.id + '">' + esc(l.nome) + '</option>'; }).join('');
  }
  opcoesLote();

  function passa(i) {
    var b = $('busca').value.trim().toLowerCase(), p = $('f-projeto').value, l = $('f-lote').value, st = $('f-situacao').value;
    if (p && LOTE[i.lote].sub !== p) return false;
    if (l && i.lote !== l) return false;
    if (b && !(String(i.n) === b || (i.n + ' ' + i.nome + ' ' + i.desc).toLowerCase().indexOf(b) >= 0)) return false;
    if (st === 'marcado' && !M.marcados[i.n]) return false;
    if (/^(incluir|duvida|tirar)$/.test(st) && M.status[i.n] !== st) return false;
    if (st === 'nota' && !(M.notas[i.n] || '').trim()) return false;
    if (st === 'sem' && (M.marcados[i.n] || M.status[i.n] || (M.notas[i.n] || '').trim())) return false;
    return true;
  }
  function loteParcial(id) {
    var l = D.itens.filter(function (i) { return i.lote === id; }), t = l.filter(function (i) { return M.status[i.n] === 'tirar'; }).length;
    return t === 0 ? '' : t === l.length ? 'lote retirado · fora do prazo' : t + ' de ' + l.length + ' itens tirados';
  }

  // ---------- itens e prazo (a conta fica no calculo.js, usada também pelo resumo em PDF) ----------
  var C = window.CALCULO, semanas = C.semanas, reais = A.reais, V = null; // V: valores (só para quem vê preços)
  function conta() { return C.conta(M); }
  function valor(atual, cheio) { return atual === cheio ? reais(cheio) : reais(atual) + ' de ' + reais(cheio); }
  function chipsLote(l) {
    if (l.projeto === 1) return '<span class="preco">no plano · obrigatório</span>';
    return (V && V.lotes[l.id] ? '<span class="preco">' + valor(V.lotes[l.id].atual, V.lotes[l.id].cheio) + '</span>' : '') +
      '<span class="preco">' + semanas(l.semanas) + '</span>' + (l.obrigatorio ? '<span class="preco">obrigatório</span>' : '') +
      (l.proposta ? '<span class="preco proposta">proposta</span>' : '') + (l.terceiros ? '<span class="preco proposta">terceiros</span>' : '');
  }
  function linhaSub(s) {
    var v = V && (s.sub === 'P1' ? { p1: V.p1 } : V.subs[s.sub]);
    return s.incluidos + ' de ' + s.total + ' itens · ' + (s.sub === 'P1' ? 'ativação na semana 1, em paralelo' : s.semanas ? semanas(s.semanas) + (s.semanas !== s.semanasCheias ? ' (de ' + semanas(s.semanasCheias) + ')' : '') : 'fora do prazo') +
      (!v ? '' : s.sub === 'P1' ? ' · ' + reais(V.p1.implantacao) + ' + ' + reais(V.p1.mensal) + ' por mês (fora do desconto)' : ' · ' + valor(v.atual, v.cheio) + ' · ' + (v.mensal ? reais(v.mensal) + ' por mês' : 'sem mensalidade'));
  }
  function valoresHTML() {
    if (!V) return '';
    return '<div class="total-grade">' +
        '<div><span class="rotulo">Implantação · Projetos 2 e 3</span><div class="total-valor num">' + reais(V.comDesconto) + '</div><small class="fraco">' + reais(V.implantacao) + (V.implantacao !== V.cheio ? ' (de ' + reais(V.cheio) + ' com tudo)' : '') + ' − ' + Math.round(V.desconto * 100) + '% de desconto pelo valor</small></div>' +
        '<div><span class="rotulo">Mensalidade</span><div class="total-valor num">' + reais(V.mensal) + '</div><small class="fraco">Projetos 2 e 3 + IA por consumo</small></div>' +
      '</div>' +
      '<ul class="total-lista">' +
        '<li><b>À vista em dinheiro ou cripto:</b> ' + reais(V.avista) + '</li>' +
        '<li><b>Projeto 1 · Plano Gestão Inteligente RXSync:</b> ' + reais(V.p1.implantacao) + ' + ' + reais(V.p1.mensal) + ' por mês, fora do desconto</li>' +
        '<li><b>Com o Projeto 1:</b> ' + reais(V.comP1) + ' com desconto · ' + reais(V.avistaComP1) + ' à vista em dinheiro ou cripto · ' + reais(V.mensalComP1) + ' por mês + IA por consumo</li>' +
      '</ul>';
  }
  function totalHTML() {
    var c = conta();
    return '<section class="cartao total-escopo"><div class="total-cab"><h2>' + (V ? 'Valores, itens e prazo' : 'Itens e prazo') + '</h2></div>' + valoresHTML() +
      '<div class="total-grade">' +
        '<div><span class="rotulo">Itens incluídos</span><div class="total-valor num">' + c.incluidos + ' de ' + D.itens.length + '</div><small class="fraco">' + c.tirados + ' tirado(s) · ' + c.duvidas + ' em dúvida</small></div>' +
        '<div><span class="rotulo">Prazo · a partir da assinatura</span><div class="total-valor num">' + (c.semanasTotal ? semanas(c.semanasTotal) : '—') + '</div><small class="fraco">' + (c.recesso ? 'com 2 semanas de recesso de fim de ano · ' : '') + (c.semanasTotal !== c.semanasCheias ? 'de ' + semanas(c.semanasCheias) + ' com tudo incluído' : 'com tudo incluído') + '</small></div>' +
      '</div>' +
      '<ul class="total-lista">' + c.ordem.map(function (k) { var s = c.subs[k]; return '<li><b>' + esc(s.nome) + ':</b> ' + linhaSub(s) + '</li>'; }).join('') + '</ul>' +
      '<ul class="total-lista">' +
        '<li><b>Etapas:</b> ' + c.etapas.map(function (e) { return 'etapa ' + e.etapa + ' · ' + esc(e.nome) + ' (' + e.prazo + ')'; }).join('; ') + '.</li>' +
        (c.recesso ? '<li><b>Recesso de fim de ano:</b> ' + C.textoRecesso(c.recesso, c.etapas) + '. Exemplo: assinando até 16/10/2026, início em 19/10/2026 e recesso de 21/12 a 01/01.</li>' : '') +
        (c.recalc.length ? '<li><b>Lotes com itens tirados (' + c.recalc.length + '):</b> ' + c.recalc.map(esc).join(', ') + '.' + (V ? ' O preço dos itens tirados já foi descontado.' : '') + ' O lote continua no prazo.</li>' : '') +
        (c.duvidas ? '<li><b>' + c.duvidas + ' item(ns) em dúvida</b> contam como incluídos.</li>' : '') +
        (V ? '' : '<li><b>Valores:</b> sob consulta.</li>') +
      '</ul></section>';
  }

  // ---------- desenho ----------
  function itemHTML(i) {
    var st = M.status[i.n] || '', nota = M.notas[i.n] || '', tela = TELAS[String(i.n)];
    var opcoes = i.obrigatorio ? ['incluir', 'duvida'] : ['incluir', 'duvida', 'tirar']; // obrigatório não tem "Tirar"
    var P = V && A.precos(), pr = P && P.itens[i.n];
    return '<div class="item-esc' + (st ? ' st-' + st : '') + '" id="item-' + i.n + '" data-n="' + i.n + '">' +
      '<input type="checkbox" aria-label="Marcar o item ' + i.n + '"' + (M.marcados[i.n] ? ' checked' : '') + ' data-acao="marcar">' +
      '<div class="cab-item"><span class="num-item">' + i.n + '</span><span class="nome-item">' + esc(i.nome) + '</span><span class="selos">' +
        (i.sempre ? '<span class="item" title="Sempre ligado">🔒 sempre ligado</span>' : '') + (i.consumo ? '<span class="item" title="IA por consumo">💲 IA por consumo</span>' : '') +
        (i.obrigatorio ? '<span class="item" title="Obrigatório: não pode ser tirado">obrigatório</span>' : '') +
        (i.terceiros ? '<span class="item" title="Depende de certificado, plataforma externa ou aprovação de loja">terceiros</span>' : '') +
        (i.juridico ? A.juridico('depende do parecer jurídico') : '') +
        (LOTE[i.lote].proposta ? '<span class="item item-proposta">proposta</span>' : '') + '</span>' +
        (pr ? '<span class="preco-item' + (st === 'tirar' ? ' tirado' : '') + '">' + reais(pr) + '</span>' : '') + '</div>' +
      '<div class="desc">' + esc(i.desc) + '</div>' +
      '<div class="ferramentas"><span class="rapida" role="group" aria-label="Marcação rápida">' + opcoes.map(function (k) {
          return '<button type="button" data-acao="status" data-st="' + k + '" aria-pressed="' + (st === k) + '">' + ST_NOME[k] + '</button>';
        }).join('') + '</span>' +
        '<button type="button" class="mini-botao' + (nota.trim() ? ' tem-nota' : '') + '" data-acao="nota">' + (nota.trim() ? 'Anotação ✓' : 'Anotar') + '</button>' +
        (tela ? '<a class="mini-botao" href="../' + tela + '" target="_blank" rel="noopener" data-leva-estilo>Ver na tela ›</a>' : '') + '</div>' +
      (notaAberta[i.n] ? '<textarea class="campo" data-acao="texto-nota" placeholder="Anotação sobre o item ' + i.n + '"></textarea>' : '') +
      '</div>';
  }
  function desenhar() {
    var h = '', proj = 0, sub = '', total = 0, c = conta(); V = c.valores || null; botaoPrecos();
    D.lotes.forEach(function (l) {
      var its = D.itens.filter(function (i) { return i.lote === l.id && passa(i); }); if (!its.length) return;
      total += its.length;
      if (l.projeto !== proj) {
        proj = l.projeto;
        h += '<h2 class="titulo-projeto">' + esc(D.projetos[proj]) + '</h2>';
      }
      if (l.sub !== sub) {
        sub = l.sub; var sp = D.subprojetos[sub] || {};
        h += '<p class="titulo-sub"><b>' + esc(sub === 'P1' ? sp.desc : sp.nome) + '</b> · ' + linhaSub(c.subs[sub]) + '</p>';
      }
      var parc = l.projeto === 1 ? '' : loteParcial(l.id);
      h += '<section class="cartao lote"><div class="lote-cab"><h3>' + esc(l.nome) + (l.antigo ? ' <small class="fraco">antes ' + esc(l.antigo) + '</small>' : '') + '</h3><div style="display:flex;gap:6px;flex-wrap:wrap">' +
        chipsLote(l) + (parc ? '<span class="recalcular">' + parc + '</span>' : '') + '</div></div>' +
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
    return '- ' + i.n + ' · ' + i.nome + ' (lote ' + l.nome + ')' + (nota ? '\n  Anotação: ' + nota.replace(/\n+/g, ' ') : '');
  }
  function resumo() {
    var grupo = function (t, f) { var l = D.itens.filter(f); return t + ' (' + l.length + ')\n' + (l.length ? l.map(linha).join('\n') : '- nenhum') + '\n'; };
    var rec = D.lotes.map(function (l) { var p = l.projeto === 1 ? '' : loteParcial(l.id); return p ? '- ' + l.nome + ': ' + p : ''; }).filter(Boolean);
    var c = conta(), tot = 'ITENS E PRAZO\n- Itens incluídos: ' + c.incluidos + ' de ' + D.itens.length + ' (' + c.tirados + ' tirados, ' + c.duvidas + ' em dúvida)\n' +
      c.ordem.map(function (k) { var s = c.subs[k]; return '- ' + s.nome + ': ' + linhaSub(s) + '\n'; }).join('') +
      '- Prazo, a partir da assinatura: ' + (c.semanasTotal ? semanas(c.semanasTotal) : '—') + (c.recesso ? ' (com 2 semanas de recesso de fim de ano)' : '') + (c.semanasTotal !== c.semanasCheias ? ' (de ' + semanas(c.semanasCheias) + ' com tudo incluído)' : '') + '\n' +
      c.etapas.map(function (e) { return '- Etapa ' + e.etapa + ' · ' + e.nome + ': ' + e.prazo + '\n'; }).join('') +
      (c.recesso ? '- Recesso de fim de ano: ' + C.textoRecesso(c.recesso, c.etapas) + '\n' : '') + '\n';
    return 'Reunião com o Dr. André · Clínica Evoluir\nEscopo versão ' + D.versao + ' (' + D.atualizado + ')\n\n' +
      grupo('INCLUIR', function (i) { return M.status[i.n] === 'incluir'; }) + '\n' +
      grupo('DÚVIDAS', function (i) { return M.status[i.n] === 'duvida'; }) + '\n' +
      grupo('TIRAR', function (i) { return M.status[i.n] === 'tirar'; }) + '\n' +
      grupo('MARCADOS SEM DECISÃO', function (i) { return M.marcados[i.n] && !M.status[i.n]; }) + '\n' +
      grupo('ANOTAÇÕES EM ITENS SEM DECISÃO', function (i) { return (M.notas[i.n] || '').trim() && !M.status[i.n] && !M.marcados[i.n]; }) + '\n' +
      'LOTES COM ITENS TIRADOS (' + rec.length + ')\n' + (rec.length ? rec.join('\n') : '- nenhum') + '\n\n' + tot +
      (V ? 'VALORES (preço de cada item; o que foi tirado já está descontado)\n- Implantação dos Projetos 2 e 3: ' + reais(V.implantacao) + (V.implantacao !== V.cheio ? ' (de ' + reais(V.cheio) + ' com tudo)' : '') + '\n' +
        '- Desconto pelo valor: ' + Math.round(V.desconto * 100) + '% · com desconto: ' + reais(V.comDesconto) + '\n- À vista em dinheiro ou cripto: ' + reais(V.avista) + '\n' +
        '- Mensalidade: ' + reais(V.mensal) + ' + IA por consumo\n- Projeto 1: ' + reais(V.p1.implantacao) + ' + ' + reais(V.p1.mensal) + ' por mês (fora do desconto)\n' +
        '- Com o Projeto 1: ' + reais(V.comP1) + ' com desconto · ' + reais(V.avistaComP1) + ' à vista · ' + reais(V.mensalComP1) + ' por mês'
        : 'Valores: sob consulta.');
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
      mostrarResumo(t, ok); if (ok) { avisoCurto('Resumo copiado.'); A.log('resumo-copiado', {}); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { avisoCurto('Resumo copiado.'); A.log('resumo-copiado', {}); mostrarResumo(t, true); }, semAPI);
    else semAPI();
  });
  $('limpar').addEventListener('click', function () {
    if (!confirm('Voltar ao padrão (todos os itens em "incluir") e apagar as anotações deste aparelho?')) return;
    M = padrao(); notaAberta = {}; salvar(); desenhar(); A.log('escopo-limpo', {});
  });

  // ---------- Salvar e enviar à RXSync (cada envio vira uma versão nova no banco; nada fica só lá: o aparelho continua com tudo) ----------
  var URL_SALVAR = 'https://n8n.rxsync.com.br/webhook/demo-salvar';
  function desligados() { return D.itens.filter(function (i) { return M.status[i.n] === 'tirar'; }).map(function (i) { return i.n; }); }
  function ultimoEnvio() { try { return localStorage.getItem(CHAVE + '-enviado') || ''; } catch (e) { return ''; } }
  function mostrarEnvio() { var u = ultimoEnvio(); $('salvo').textContent = u ? 'Salvo e enviado em ' + u : ''; }
  // Os valores só vão no total quando quem salva é o Admin com os preços liberados.
  function totalEnviado(c) {
    var t = { itens_incluidos: c.incluidos, itens_tirados: c.tirados, duvidas: c.duvidas, lotes_com_itens_tirados: c.recalc, semanas: c.semanasTotal, semanas_com_tudo: c.semanasCheias,
      recesso: c.recesso ? C.textoRecesso(c.recesso, c.etapas) : '',
      subprojetos: c.ordem.reduce(function (o, k) { var x = c.subs[k]; o[k] = { itens: x.incluidos, de: x.total, tirados: x.tirados, semanas: x.semanas }; return o; }, {}) };
    var v = A.usuario() === 'admin' && c.valores;
    if (v) t.valores = { implantacao: v.implantacao, cheio: v.cheio, desconto: v.desconto, com_desconto: v.comDesconto, a_vista: v.avista, mensal: v.mensal,
      com_p1: v.comP1, a_vista_com_p1: v.avistaComP1, mensal_com_p1: v.mensalComP1,
      subprojetos: Object.keys(v.subs).reduce(function (o, k) { o[k] = v.subs[k]; return o; }, {}) };
    return t;
  }
  // Admin: esconde ou libera os preços com um toque (vale para a demo toda neste aparelho, como o controle da home).
  function botaoPrecos() {
    var b = $('precos'); if (!b) return;
    b.hidden = A.usuario() !== 'admin';
    b.textContent = A.precosLiberados() ? 'Esconder preços' : 'Liberar preços';
  }
  $('precos').addEventListener('click', function () {
    var sim = !A.precosLiberados(); A.liberarPrecos(sim); desenhar(); avisoCurto(sim ? 'Preços liberados.' : 'Preços escondidos.');
  });
  $('salvar').addEventListener('click', function () {
    var b = $('salvar'), c = conta();
    var corpo = JSON.stringify({ tipo: 'escopo', usuario: A.usuario(), aparelho: A.aparelho(), sessao: A.sessao(), versao: D.versao,
      marcacoes: { status: M.status, marcados: M.marcados }, anotacoes: M.notas, desligados: desligados(),
      total: totalEnviado(c) });
    b.disabled = true; b.textContent = 'Enviando…';
    function fim(ok) {
      b.disabled = false; b.textContent = 'Salvar e enviar à RXSync';
      var agora = A.datas.agora(), quando = A.datas.dma(agora) + ' às ' + A.datas.hm(agora);
      A.log('escopo-salvo', { ok: ok, desligados: desligados().length });
      if (ok) { try { localStorage.setItem(CHAVE + '-enviado', quando); } catch (e) { /* idem */ } mostrarEnvio(); avisoCurto('Salvo e enviado à RXSync em ' + quando + '.'); }
      else avisoCurto('Não foi possível enviar agora. As marcações continuam salvas neste aparelho; tente de novo.');
    }
    try {
      fetch(URL_SALVAR, { method: 'POST', body: corpo, mode: 'cors', credentials: 'omit' })
        .then(function (r) { return r.json(); }).then(function (j) { fim(!!(j && j.ok)); }, function () { fim(false); });
    } catch (e) { fim(false); }
  });
  mostrarEnvio();

  // ---------- ações ----------
  $('lista').addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]'); if (!el) return;
    var n = +el.closest('.item-esc').dataset.n, a = el.dataset.acao;
    if (a === 'status' && el.dataset.st === 'tirar' && (D.itens.filter(function (i) { return i.n === n; })[0] || {}).obrigatorio) return;
    if (a === 'status') { var de = M.status[n] || ''; M.status[n] = M.status[n] === el.dataset.st ? '' : el.dataset.st; if (!M.status[n]) delete M.status[n]; A.log('escopo-marcacao', { item: n, de: de, para: M.status[n] || '' }); salvar(); desenhar(); }
    if (a === 'nota') { notaAberta[n] = !notaAberta[n]; desenhar(); var t = document.querySelector('.item-esc[data-n="' + n + '"] textarea'); if (t) t.focus(); }
  });
  $('lista').addEventListener('change', function (ev) {
    if (ev.target.dataset.acao !== 'marcar') return;
    var n = +ev.target.closest('.item-esc').dataset.n; if (ev.target.checked) M.marcados[n] = true; else delete M.marcados[n]; A.log('escopo-marcado', { item: n, marcado: ev.target.checked }); salvar(); contador();
  });
  // Anotação registrada quando sai do campo (não a cada letra).
  $('lista').addEventListener('focusout', function (ev) {
    if (!ev.target.dataset || ev.target.dataset.acao !== 'texto-nota') return;
    var n = +ev.target.closest('.item-esc').dataset.n; A.log('escopo-anotacao', { item: n, texto: (M.notas[n] || '').slice(0, 300) });
  });
  $('lista').addEventListener('input', function (ev) {
    if (ev.target.dataset.acao !== 'texto-nota') return;
    var n = +ev.target.closest('.item-esc').dataset.n, v = ev.target.value; if (v.trim()) M.notas[n] = v.slice(0, 2000); else delete M.notas[n]; salvar(); contador();
    var b = ev.target.closest('.item-esc').querySelector('[data-acao="nota"]'); b.classList.toggle('tem-nota', !!v.trim()); b.textContent = v.trim() ? 'Anotação ✓' : 'Anotar';
  });
  ['busca', 'f-lote', 'f-situacao'].forEach(function (id) { $(id).addEventListener('input', desenhar); });
  $('f-projeto').addEventListener('input', function () { opcoesLote(); desenhar(); });
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
