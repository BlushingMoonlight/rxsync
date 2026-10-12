/* Página do datalog (sem link em lugar nenhum). Pede a chave de leitura do banco (fica salva só neste aparelho)
   e mostra, por usuário (André · Convidado · Admin): aparelhos e IPs, sessões, tempo por página e por tela,
   telas mais vistas, botões mais tocados, escopos salvos (com o que mudou), respostas do questionário, perguntas nos
   chats e a linha do tempo de cada sessão. Horários no fuso de São Paulo (gravados assim no banco).
   Tudo o que veio dos usuários é mostrado como texto (escapado). */
(function () {
  'use strict';
  var A = window.AG, esc = A.esc;
  var URL_VER = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demo-log-ver';
  var CHAVE = 'ag-datalog-chave', USUARIOS = [['andre', 'Dr. André'], ['convidado', 'Convidado'], ['admin', 'Admin (Jean)'], ['outro', 'Outros']];
  var $ = function (id) { return document.getElementById(id); };
  var dados = null, aba = 'andre';
  function lerChave() { try { return localStorage.getItem(CHAVE) || ''; } catch (e) { return ''; } }
  function gravarChave(v) { try { if (v) localStorage.setItem(CHAVE, v); else localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ } }
  // 'AAAA-MM-DD HH:MM:SS' → 'DD/MM HH:MM'
  function dh(t) { var m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/); return m ? m[3] + '/' + m[2] + ' ' + m[4] + ':' + m[5] : esc(t); }
  function ms(t) { var m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : 0; }
  function dur(seg) { seg = Math.max(0, Math.round(seg)); var h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60), s = seg % 60; return (h ? h + ' h ' : '') + (h || m ? m + ' min ' : '') + (h ? '' : s + ' s'); }
  function contar(l, chave) { var o = {}; l.forEach(function (x) { var k = chave(x); if (k) o[k] = (o[k] || 0) + 1; }); return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); }
  function somar(l, chave, valor) { var o = {}; l.forEach(function (x) { var k = chave(x); if (k) o[k] = (o[k] || 0) + valor(x); }); return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); }
  function tabela(cab, linhas) { return linhas.length ? '<div class="rolar-x"><table class="tabela-larga"><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' + linhas.map(function (l) { return '<tr>' + l.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' : '<p class="mudo">Nada ainda.</p>'; }
  function bloco(t, corpo) { return '<section class="cartao bloco-dl"><h2>' + t + '</h2>' + corpo + '</section>'; }
  function det(e) { var d = e[9] || {}; return d; }
  function resumoDetalhe(e) {
    var d = det(e), a = e[8];
    if (a === 'saiu-tela' || a === 'saiu-pagina') return 'ficou ' + dur(d.seg || 0);
    if (a === 'pergunta') return '"' + esc(d.texto || '') + '" · ' + esc(d.chat || '');
    if (a === 'tocou' || a === 'tocou-marcador') return esc(d.texto || '') + (d.link ? ' → ' + esc(d.link) : '');
    if (a === 'estilo') return esc(d.estilo || '');
    if (a === 'escopo-marcacao') return 'item ' + esc(d.item) + ': ' + esc(d.de || 'sem marcação') + ' → ' + esc(d.para || 'sem marcação');
    if (a === 'escopo-anotacao') return 'item ' + esc(d.item) + ': "' + esc(d.texto || '') + '"';
    if (a === 'abriu-pagina') return esc(d.endereco || '');
    var s = JSON.stringify(d); return s === '{}' ? '' : esc(s.slice(0, 160));
  }

  function carregar(chave) {
    $('estado').textContent = 'Carregando…';
    fetch(URL_VER, { headers: { 'x-demo-chave': chave }, mode: 'cors', credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.dados) { $('estado').textContent = 'Chave não aceita. Confira a chave e tente de novo.'; gravarChave(''); $('esquecer').hidden = true; return; }
        gravarChave(chave); dados = j.dados; $('esquecer').hidden = false; $('form-chave').chave.value = '';
        $('estado').textContent = 'Atualizado em ' + dh(dados.agora) + ' (horário de São Paulo). ' + dados.eventos.length + ' eventos.';
        desenhar();
      }, function () { $('estado').textContent = 'Não foi possível buscar agora. Tente de novo em instantes.'; });
  }
  function desenhar() {
    var ev = dados.eventos, presentes = USUARIOS.filter(function (u) { return u[0] !== 'outro' || ev.some(function (e) { return e[2] === 'outro'; }); });
    $('abas').hidden = false;
    $('abas').innerHTML = presentes.map(function (u) { var n = ev.filter(function (e) { return e[2] === u[0]; }).length; return '<button type="button" data-aba="' + u[0] + '" class="' + (aba === u[0] ? 'ativo' : '') + '">' + u[1] + ' <span class="fraco">' + n + '</span></button>'; }).join('') +
      '<button type="button" id="atualizar">Atualizar</button>';
    var meus = ev.filter(function (e) { return e[2] === aba; });
    var h = '';
    // Aparelhos e IPs
    var aparelhos = {}; meus.forEach(function (e) { var a = aparelhos[e[3]] = aparelhos[e[3]] || { ips: {}, sessoes: {}, ini: e[1], fim: e[1] }; a.ips[e[5]] = 1; a.sessoes[e[4]] = 1; if (e[1] < a.ini) a.ini = e[1]; if (e[1] > a.fim) a.fim = e[1]; });
    var disp = {}; (dados.dispositivos || []).forEach(function (d) { disp[d.aparelho] = d; });
    h += bloco('Aparelhos e IPs', tabela(['Aparelho', 'Navegador', 'IPs', 'Visitas (sessões)', 'Primeira vez', 'Última vez'], Object.keys(aparelhos).map(function (k) {
      var a = aparelhos[k]; return ['<span class="idp">' + esc(k.slice(0, 8)) + '</span>', esc(((disp[k] || {}).navegador || '').slice(0, 90)), Object.keys(a.ips).filter(Boolean).map(esc).join('<br>'), Object.keys(a.sessoes).length, dh(a.ini), dh(a.fim)];
    })));
    // Sessões
    var sess = {}; meus.forEach(function (e) { var s = sess[e[4]] = sess[e[4]] || { ev: [], ap: e[3], ip: e[5] }; s.ev.push(e); });
    var lista = Object.keys(sess).map(function (k) { var l = sess[k].ev; return { id: k, ev: l, ap: sess[k].ap, ip: sess[k].ip, ini: l[0][1], fim: l[l.length - 1][1] }; }).sort(function (a, b) { return a.ini < b.ini ? 1 : -1; });
    h += bloco('Sessões', tabela(['Início', 'Fim', 'Duração', 'Aparelho', 'IP', 'Páginas', 'Eventos'], lista.map(function (s) {
      var pags = {}; s.ev.forEach(function (e) { pags[e[6]] = 1; });
      return [dh(s.ini), dh(s.fim), dur((ms(s.fim) - ms(s.ini)) / 1000), '<span class="idp">' + esc(s.ap.slice(0, 8)) + '</span>', esc(s.ip), Object.keys(pags).map(esc).join(', '), s.ev.length];
    })));
    // Tempo por página e por tela, telas mais vistas
    var porPagina = somar(meus.filter(function (e) { return e[8] === 'saiu-pagina'; }), function (e) { return e[6]; }, function (e) { return +(det(e).seg || 0); });
    var porTela = somar(meus.filter(function (e) { return e[8] === 'saiu-tela'; }), function (e) { return e[6] + ' · ' + (e[7] || 'início'); }, function (e) { return +(det(e).seg || 0); });
    var vistas = contar(meus.filter(function (e) { return e[8] === 'abriu-tela'; }), function (e) { return e[6] + ' · ' + (e[7] || 'início'); });
    h += '<div class="grade-dl">' +
      bloco('Tempo por página', tabela(['Página', 'Tempo'], porPagina.map(function (x) { return [esc(x[0]), dur(x[1])]; }))) +
      bloco('Telas mais vistas', tabela(['Tela', 'Vezes'], vistas.slice(0, 25).map(function (x) { return [esc(x[0]), x[1]]; }))) + '</div>' +
      bloco('Tempo por tela', tabela(['Tela', 'Tempo'], porTela.slice(0, 40).map(function (x) { return [esc(x[0]), dur(x[1])]; })));
    // Botões mais tocados
    var toques = contar(meus.filter(function (e) { return e[8] === 'tocou' || e[8] === 'tocou-marcador'; }), function (e) { return e[6] + ' · ' + (det(e).texto || det(e).itens || '(sem texto)'); });
    h += bloco('Botões mais tocados', tabela(['Botão (página · texto)', 'Toques'], toques.slice(0, 40).map(function (x) { return [esc(x[0]), x[1]]; })));
    // Escopos salvos, com o que mudou da versão anterior
    var esc0 = (dados.escopo || []).filter(function (s) { return s.usuario === aba; });
    h += bloco('Escopos salvos', esc0.length ? esc0.map(function (s, i) {
      var ant = esc0[i - 1], st = (s.marcacoes && s.marcacoes.status) || {}, stA = ant ? ((ant.marcacoes && ant.marcacoes.status) || {}) : null, mud = [];
      if (stA) Object.keys(Object.assign({}, st, stA)).forEach(function (n) { if ((st[n] || '') !== (stA[n] || '')) mud.push('item ' + esc(n) + ': ' + esc(stA[n] || 'sem marcação') + ' → ' + esc(st[n] || 'sem marcação')); });
      var no = s.anotacoes || {}, noA = ant ? (ant.anotacoes || {}) : {};
      Object.keys(no).forEach(function (n) { if (no[n] !== noA[n]) mud.push('anotação no item ' + esc(n) + ': "' + esc(String(no[n]).slice(0, 200)) + '"'); });
      var t = s.total || {};
      return '<details class="versao"' + (i === esc0.length - 1 ? ' open' : '') + '><summary><b>Versão ' + (i + 1) + '</b> · ' + dh(s.quando) + ' · escopo v' + esc(s.versao) + ' · ' + (s.desligados || []).length + ' itens tirados' +
        (t.semanas != null ? ' · prazo ' + esc(String(t.semanas).replace('.', ',')) + ' semanas' : '') +
        (t.itens_incluidos != null ? ' · ' + esc(t.itens_incluidos) + ' itens incluídos' : '') + '</summary>' +
        (ant ? (mud.length ? '<ul>' + mud.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>' : '<p class="mudo">Nada mudou em relação à versão anterior.</p>') : '<p class="mudo">Primeira versão. Itens tirados: ' + ((s.desligados || []).map(esc).join(', ') || 'nenhum') + '.</p>') + '</details>';
    }).join('') : '<p class="mudo">Nenhum escopo salvo.</p>');
    // Questionário
    var resp = (dados.respostas || []).filter(function (r) { return r.usuario === aba; });
    h += bloco('Respostas do questionário', resp.length ? resp.map(function (r, i) {
      var l = Object.keys(r.respostas || {}).sort(function (a, b) { return a - b; });
      return '<details class="versao"' + (i === resp.length - 1 ? ' open' : '') + '><summary><b>Envio ' + (i + 1) + '</b> · ' + dh(r.quando) + ' · ' + l.length + ' respostas</summary><ol class="respostas-dl">' + l.map(function (n) {
        var x = r.respostas[n] || {}; return '<li value="' + esc(n) + '"><b>' + esc(x.pergunta || '') + '</b><div>' + (x.opcao ? '<span class="chip">' + esc(x.opcao) + '</span> ' : '') + esc(x.texto || '') + '</div></li>';
      }).join('') + '</ol></details>';
    }).join('') : '<p class="mudo">Nenhum envio.</p>');
    // Perguntas nos chats
    var perg = meus.filter(function (e) { return e[8] === 'pergunta'; }).reverse();
    h += bloco('Perguntas nos chats', tabela(['Quando', 'Chat', 'Pergunta'], perg.map(function (e) { return [dh(e[1]), esc(det(e).chat || ''), esc(det(e).texto || '')]; })));
    // Mudanças no escopo (eventos)
    var mudEsc = meus.filter(function (e) { return /^escopo-|^resumo-|^precos-|^senha-|^orcamento-/.test(e[8]); }).reverse();
    h += bloco('Mudanças no escopo', tabela(['Quando', 'O quê', 'Detalhe'], mudEsc.slice(0, 200).map(function (e) { return [dh(e[1]), esc(e[8]), resumoDetalhe(e)]; })));
    // Linha do tempo de cada sessão
    h += bloco('Linha do tempo de cada sessão', lista.length ? lista.map(function (s, i) {
      return '<details class="versao"' + (i === 0 ? ' open' : '') + '><summary><b>' + dh(s.ini) + '</b> · ' + dur((ms(s.fim) - ms(s.ini)) / 1000) + ' · ' + s.ev.length + ' eventos</summary>' +
        tabela(['Hora', 'Página · tela', 'Ação', 'Detalhe'], s.ev.map(function (e) { return [dh(e[1]).slice(6), esc(e[6] + (e[7] ? ' · ' + e[7] : '')), esc(e[8]), resumoDetalhe(e)]; })) + '</details>';
    }).join('') : '<p class="mudo">Nenhuma sessão.</p>');
    $('conteudo').innerHTML = h;
  }
  $('form-chave').addEventListener('submit', function (ev) { ev.preventDefault(); var c = String(this.chave.value || '').trim(); if (c) carregar(c); });
  $('esquecer').addEventListener('click', function () { gravarChave(''); dados = null; $('conteudo').innerHTML = ''; $('abas').hidden = true; this.hidden = true; $('estado').textContent = 'Chave esquecida neste aparelho.'; });
  $('abas').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'atualizar') { carregar(lerChave()); return; }
    aba = b.dataset.aba; desenhar();
  });
  if (lerChave()) carregar(lerChave());
})();
