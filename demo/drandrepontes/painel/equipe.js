/* Comunicação interna e equipe do paciente (lote CRM-5, itens 202 a 209; proposta).
   Canais da equipe, mensagens diretas, menção com @, delegar tarefa pela conversa (vira tarefa do 182), conversa ligada
   ao ID do paciente (aparece na linha do tempo da Central do paciente, 191), equipe de cada paciente, avisos para quem
   cuida dele e o painel "Meus pacientes". Dados de exemplo; tudo só na memória. Texto digitado é sempre escapado.
   Sigilo da psicologia (172): mensagens marcadas como da psicologia só aparecem para a Maria Clara. */
(function () {
  'use strict';
  var P = window.PAINEL, A = P.A, T = P.TELAS, QUEM = P.QUEM, E = P.EQUIPE;
  var cartao = P.cartao, titulo = P.titulo, cab = P.cab, lista = P.lista, lin = P.lin, esc = P.esc;
  function nome(id) { return P.pac(id).nome; }
  function curto(k) { return E[k].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André'); }
  function botao(texto, acao, v, claro, extra) { return '<button type="button" class="botao' + (claro ? ' botao-claro' : '') + '" data-q="' + acao + '" data-v="' + (v == null ? '' : esc(v)) + '"' + (extra || '') + '>' + texto + '</button>'; }
  function peq(texto, acao, v, claro) { return botao(texto, acao, v, claro, ' style="height:32px;padding:0 10px;font-size:12px"'); }
  var PESSOAS = Object.keys(E);

  // ---------- 207 · Equipe de cada paciente (quem cuida de quem) ----------
  var EQ = {
    'P-DEMO7': ['andre', 'felipe', 'thais', 'eduarda'], 'P-DEMO5': ['andre', 'thais', 'eduarda'], 'P-DEMO9': ['andre', 'felipe'], 'P-DEMO4': ['felipe', 'elenice'],
    'P-DEMO2': ['andre', 'felipe'], 'P-DEMO3': ['andre', 'mariaclara', 'felipe'], 'P-DEMO6': ['elenice', 'emanuele'], 'P-DEMO8': ['andre', 'elenice'],
    'P-DEMO1': ['felipe'], 'P-DEM10': ['elenice'], 'P-DEM11': ['felipe', 'mariaclara'], 'P-DEM12': ['andre', 'mariaclara', 'thais']
  };
  function equipeDe(id) { return EQ[id] || []; }
  function chipsEquipe(id) {
    var l = equipeDe(id);
    return '<div class="equipe-chips">' + (l.length ? l.map(function (k) { return '<span class="chip">' + P.pessoa(E[k], 20) + ' ' + esc(curto(k)) + '</span>'; }).join('') : '<span class="fraco">sem equipe definida</span>') + '</div>';
  }
  // Para a Central do paciente (centrais.js).
  P.equipeDo = function (id) { return '<div style="margin-top:8px"><span class="rotulo">Equipe do paciente ' + A.item(207) + '</span>' + chipsEquipe(id) + '</div>'; };

  // ---------- 202 a 206 · Conversas da equipe ----------
  var CANAIS = [['geral', 'Geral', 'toda a equipe'], ['enfermagem', 'Enfermagem', 'aplicações e sintomas'], ['recepcao', 'Recepção', 'agenda e chegadas'], ['nutricao', 'Nutrição', 'planos e adesão']];
  // Mensagens: [id, conversa, quem, quando, texto, restrita (psicologia)]. conversa: c:canal, d:pessoa1-pessoa2, p:ID do paciente.
  var MSG = [
    [1, 'c:geral', 'elenice', '{h:-95}', 'Bom dia, equipe! Agenda de hoje confirmada. Duas primeiras consultas.', false],
    [2, 'c:geral', 'andre', '{h:-80}', '@thais o Carlos relatou náusea forte depois da aplicação. Você liga para ele?', false],
    [3, 'c:geral', 'thais', '{h:-74}', '@andre ligo agora e registro na ficha.', false],
    [4, 'c:enfermagem', 'eduarda', '{h:-60}', 'Estoque de frascos em 4. @emanuele dá para adiantar o pedido do fornecedor?', false],
    [5, 'c:enfermagem', 'emanuele', '{h:-52}', 'Pedido feito, chega {wl:u+2}.', false],
    [6, 'c:recepcao', 'elenice', '{h:-40}', 'Larissa chegou para a primeira consulta das 09:00.', false],
    [7, 'c:nutricao', 'felipe', '{d:-1} 17:40', 'Rodrigo está há 5 dias sem registrar. Vou mandar mensagem pelo app.', false],
    [8, 'p:P-DEMO7', 'felipe', '{d:-2} 15:10', 'Mariana pediu para trocar o jantar por algo mais leve. Ajustei o plano.', false],
    [9, 'p:P-DEMO7', 'andre', '{d:-1} 09:20', '@felipe ótimo. No retorno vemos a adesão de novo.', false],
    [10, 'p:P-DEMO3', 'mariaclara', '{d:-1} 19:05', 'Sessão de ontem: combinamos registrar a fome à noite. Detalhes no prontuário de psicologia.', true],
    [11, 'p:P-DEMO3', 'andre', '{d:-1} 20:00', '@mariaclara obrigado. Mantenho o plano até o retorno.', false],
    [12, 'd:andre-thais', 'thais', '{h:-30}', 'Dr. André, a prescrição da Larissa precisa da sua conferência antes de ir para o app.', false]
  ];
  var C = { conversa: 'c:geral', proxId: 13, vistas: {} };
  function idDireta(a, b) { return 'd:' + [a, b].sort().join('-'); }
  function podeVer(m) { return !m[5] || QUEM === 'mariaclara'; }
  function visivel(conv) { if (conv.indexOf('d:') === 0) return conv.slice(2).split('-').indexOf(QUEM) >= 0 || QUEM === 'andre'; return true; }
  function nomeConversa(conv) {
    if (conv.indexOf('c:') === 0) return '# ' + CANAIS.filter(function (c) { return 'c:' + c[0] === conv; })[0][1];
    if (conv.indexOf('p:') === 0) return nome(conv.slice(2)) + ' · ' + conv.slice(2);
    return conv.slice(2).split('-').map(curto).join(' e ');
  }
  // Texto com as menções destacadas (o texto já entra escapado).
  function comMencoes(t) {
    return esc(t).replace(/@([a-z]+)/g, function (s, k) { return E[k] ? '<span class="mencao' + (k === QUEM ? ' minha' : '') + '">@' + esc(curto(k)) + '</span>' : s; });
  }
  function mencoesPara(k) { return MSG.filter(function (m) { return podeVer(m) && visivel(m[1]) && m[4].indexOf('@' + k) >= 0 && m[2] !== k; }); }
  function naoVistas() { return mencoesPara(QUEM).filter(function (m) { return !C.vistas[m[0]]; }).length; }

  T['equipe-chat'] = function () {
    var conv = C.conversa, msgs = MSG.filter(function (m) { return m[1] === conv; });
    if (conv === 'mencoes') msgs = mencoesPara(QUEM);
    msgs.forEach(function (m) { if (m[4].indexOf('@' + QUEM) >= 0) C.vistas[m[0]] = 1; });
    var pacConv = PESSOAS.length && MSG.map(function (m) { return m[1]; }).filter(function (c, i, a) { return c.indexOf('p:') === 0 && a.indexOf(c) === i; });
    var diretas = PESSOAS.filter(function (k) { return k !== QUEM; });
    function item(id, rot, sub, extra) { return '<button type="button" class="conv' + (conv === id ? ' ativa' : '') + '" data-q="abrir" data-v="' + esc(id) + '"><b>' + rot + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + (extra || '') + '</button>'; }
    var pend = naoVistas();
    return cab('Comunicação da equipe', 'Canais, mensagens diretas e conversas ligadas ao paciente, dentro do painel. Proposta.', A.item([202, 203, 204, 205, 206]) + A.proposta()) +
      '<div class="chat-equipe">' +
        cartao('<div class="conv-lista">' +
          item('mencoes', '@ Minhas menções', 'quem citou você', pend ? '<span class="bolinha">' + pend + '</span>' : '') +
          '<span class="rotulo">Canais ' + A.item(202) + '</span>' + CANAIS.map(function (c) { return item('c:' + c[0], '# ' + c[1], c[2]); }).join('') +
          '<span class="rotulo">Mensagens diretas ' + A.item(203) + '</span>' + diretas.map(function (k) { return item(idDireta(QUEM, k), esc(curto(k)), E[k].papel); }).join('') +
          '<span class="rotulo">Pacientes ' + A.item(206) + '</span>' + pacConv.map(function (c) { return item(c, esc(nome(c.slice(2))), c.slice(2)); }).join('') +
        '</div>', 'conv-coluna') +
        cartao(titulo(conv === 'mencoes' ? '@ Minhas menções' : esc(nomeConversa(conv)), conv.indexOf('p:') === 0 ? A.item([206, 172]) : conv.indexOf('d:') === 0 ? A.item(203) : conv === 'mencoes' ? A.item(204) : A.item(202)) +
          (conv.indexOf('p:') === 0 ? '<p class="nota" style="margin-top:-6px">Ligada ao ' + conv.slice(2) + ': aparece na linha do tempo da <a href="#central-paciente" data-q="central" data-v="' + conv.slice(2) + '">Central do paciente</a>. Equipe: ' + equipeDe(conv.slice(2)).map(curto).join(', ') + '.</p>' : '') +
          '<div class="msgs-equipe" id="msgs-equipe">' + (msgs.length ? msgs.map(function (m) {
            if (!podeVer(m)) return '<div class="msg-eq restrita">' + P.pessoa(E[m[2]], 28) + '<div><b>' + esc(curto(m[2])) + '</b> <small class="fraco">' + m[3] + '</small><p>' + A.ic('cadeado') + ' Mensagem restrita à psicologia ' + A.item(172) + '</p></div></div>';
            return '<div class="msg-eq' + (m[4].indexOf('@' + QUEM) >= 0 ? ' me-cita' : '') + '">' + P.pessoa(E[m[2]], 28) + '<div class="meio"><b>' + esc(curto(m[2])) + '</b> <small class="fraco">' + m[3] + (conv === 'mencoes' ? ' · ' + esc(nomeConversa(m[1])) : '') + (m[5] ? ' · ' + A.ic('cadeado') + ' psicologia' : '') + '</small><p>' + comMencoes(m[4]) + '</p></div>' +
              peq('Delegar tarefa', 'delegar', m[0], true) + '</div>';
          }).join('') : '<p class="mudo">Nenhuma mensagem ainda.</p>') + '</div>' +
          (conv === 'mencoes' ? '' : '<div class="mencoes-rapidas"><span class="fraco" style="font-size:12px">Mencionar ' + A.item(204) + ':</span>' + PESSOAS.filter(function (k) { return k !== QUEM; }).map(function (k) { return '<button type="button" data-q="mencionar" data-v="' + k + '">@' + esc(curto(k)) + '</button>'; }).join('') + '</div>' +
            '<div class="digitar"><input class="campo" id="msg-equipe" placeholder="Escrever em ' + esc(nomeConversa(conv)) + '" autocomplete="off" maxlength="500"><button class="botao" type="button" data-q="enviar" aria-label="Enviar">' + A.ic('enviar') + '</button></div>' +
            (QUEM === 'mariaclara' && conv.indexOf('p:') === 0 ? '<label class="confirma" style="margin-top:6px"><input type="checkbox" id="msg-restrita"> Só para a psicologia ' + A.item(172) + '</label>' : '')), 'conv-principal') +
      '</div>';
  };

  // ---------- 207 e 208 · Equipe do paciente e avisos ----------
  var ALERTAS = [['P-DEMO5', 'Náusea forte depois da aplicação', 'thais'], ['P-DEM12', 'Perda de 2,4 kg em 7 dias', 'andre'], ['P-DEMO4', '5 dias sem registrar no app', 'felipe'], ['P-DEMO3', 'Humor baixo 3 dias seguidos', 'mariaclara']];
  var C2 = { editar: '' };
  function destino(a) {
    var eq = equipeDe(a[0]), area = a[2];
    var primeiro = eq.indexOf(area) >= 0 ? [area] : [];
    return primeiro.concat(eq.filter(function (k) { return k !== area; }));
  }
  T['equipe-paciente'] = function () {
    return cab('Equipe do paciente', 'Quem cuida de quem. Os avisos, os casos e as tarefas de cada paciente vão primeiro para a equipe dele. Proposta.', A.item([207, 208]) + A.proposta()) +
      '<div class="grade">' +
        cartao(titulo('Profissionais de cada paciente', A.item(207)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Equipe</th><th></th></tr>' +
          P.PACIENTES.map(function (p) {
            var ed = C2.editar === p.id;
            return '<tr><td><b>' + p.nome + '</b> <span class="idp">' + p.id + '</span></td><td>' + (ed ? '<div class="opcoes">' + PESSOAS.map(function (k) { return '<label class="chip"><input type="checkbox" data-q-equipe="' + p.id + '" value="' + k + '"' + (equipeDe(p.id).indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(curto(k)) + '</label>'; }).join('') + '</div>' : chipsEquipe(p.id)) + '</td><td>' +
              peq(ed ? 'Pronto' : 'Editar', 'editar', ed ? '' : p.id, !ed) + '</td></tr>';
          }).join('') + '</table></div>', 's7') +
        cartao(titulo('Avisos para a equipe do paciente', A.item(208)) + lista(ALERTAS.map(function (a) {
          var d = destino(a);
          return lin(A.bolha('alerta', 'var(--alerta)'), '<b>' + nome(a[0]) + '</b> <span class="idp">' + a[0] + '</span><div class="fraco">' + a[1] + '</div><div style="font-size:12.5px;margin-top:4px">vai para: ' +
            (d.length ? d.map(function (k, i) { return (i ? '' : '<b>') + esc(curto(k)) + (i ? '' : '</b>'); }).join(', ') : '<span class="fraco">ninguém na equipe: vai para o Dr. André</span>') + '</div>');
        })) + '<p class="nota" style="margin-top:8px">Primeiro quem é da área do aviso (enfermagem, nutrição, psicologia, médico) dentro da equipe do paciente; depois o resto da equipe. Os casos por área (59 a 62) continuam valendo.</p>', 's5') +
      '</div>';
  };

  // ---------- 209 · Meus pacientes ----------
  T['meus-pacientes'] = function () {
    var meus = P.PACIENTES.filter(function (p) { return equipeDe(p.id).indexOf(QUEM) >= 0; });
    return cab('Meus pacientes', curto(QUEM) + ' vê primeiro os pacientes de quem cuida. Proposta.', A.item([209, 207]) + A.proposta()) +
      cartao(meus.length ? '<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Situação</th><th>Último contato</th><th>Atenção</th><th>Equipe</th></tr>' +
        meus.map(function (p) {
          return '<tr class="clicavel" data-q="central" data-v="' + p.id + '"><td><b>' + p.nome + '</b> <span class="idp">' + p.id + '</span></td><td>' + P.st(p.status) + '</td><td class="num">' + p.ultimo + '</td><td>' +
            (p.alerta ? '<span class="status st-al">' + p.alerta + '</span>' : '<span class="fraco">—</span>') + '</td><td>' + chipsEquipe(p.id) + '</td></tr>';
        }).join('') + '</table></div><p class="nota" style="margin-top:8px">Toque num paciente para abrir a Central do paciente.</p>' : '<p class="mudo">Nenhum paciente na sua equipe ainda. Ajuste em <a href="#equipe-paciente">Equipe do paciente</a>.</p>');
  };

  // Conversas de paciente entram na linha do tempo da Central do paciente (206), respeitando o sigilo da psicologia.
  function diaRel(t) { var x = String(t).match(/\{d:([+-]?\d+)\}/); return x ? +x[1] : (t === 'agora' ? 0 : -9999); }
  function paraLinha(m) {
    if (!P.linhaPaciente || m[1].indexOf('p:') !== 0) return;
    var quando = String(m[3]).split(' '), dia = quando.length > 1 ? quando[0] : '{d:0}', hora = quando.length > 1 ? quando[1] : quando[0];
    var l = P.linhaPaciente(m[1].slice(2)), off = diaRel(dia), i = 0;
    while (i < l.length && diaRel(l[i][0]) >= off) i++;   // entra na ordem: depois do que é mais novo
    l.splice(i, 0, [dia, hora, 'conversa', podeVer(m) ? 'Conversa da equipe: "' + esc(m[4]) + '"' : 'Conversa da equipe restrita à psicologia', curto(m[2]) + ' · equipe']);
  }
  MSG.filter(function (m) { return m[1].indexOf('p:') === 0; }).forEach(paraLinha);

  // ---------- ações ----------
  function folha(tit, corpo, aoSalvar, botaoTexto) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">' + tit + '</h2>' + corpo +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">' + (botaoTexto || 'Salvar') + '</button></div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) { ev.preventDefault(); if (aoSalvar(new FormData(ev.target)) !== false) f.remove(); });
  }
  function opcoes(l, sel) { return l.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(sel) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); }
  function enviar() {
    var c = document.getElementById('msg-equipe'), t = String(c.value || '').trim().slice(0, 500); if (!t) return;
    var r = document.getElementById('msg-restrita'), m = [C.proxId++, C.conversa, QUEM, '{h:0}', t, !!(r && r.checked)];
    MSG.push(m); paraLinha(m);
    A.log('pergunta', { chat: 'comunicação da equipe · ' + nomeConversa(C.conversa), texto: t.slice(0, 500) });
    var men = (t.match(/@([a-z]+)/g) || []).map(function (s) { return s.slice(1); }).filter(function (k) { return E[k] && k !== QUEM; });
    P.render(true); var n = document.getElementById('msg-equipe'); if (n) n.focus();
    if (men.length) P.avisoCurto('Mensagem enviada. ' + men.map(curto).join(' e ') + ' recebe' + (men.length > 1 ? 'm' : '') + ' o aviso da menção.');
  }
  var AC = {
    abrir: function (v) { C.conversa = v; P.render(true); },
    central: function (v) { if (P.abrirPaciente) P.abrirPaciente(v); },
    mencionar: function (v) { var c = document.getElementById('msg-equipe'); if (!c) return; c.value = (c.value ? c.value.replace(/\s*$/, ' ') : '') + '@' + v + ' '; c.focus(); },
    enviar: enviar,
    delegar: function (v) {
      var m = MSG.filter(function (x) { return x[0] === +v; })[0]; if (!m) return;
      var men = (m[4].match(/@([a-z]+)/) || [])[1], pac = m[1].indexOf('p:') === 0 ? m[1].slice(2) : '';
      var texto = podeVer(m) ? m[4].replace(/@[a-z]+\s*/g, '').slice(0, 80) : 'Tarefa da conversa de ' + nome(pac);
      folha('Delegar tarefa ' + A.item(205), '<label><span class="rotulo">O que fazer</span><input class="campo" name="t" maxlength="80"></label>' +
        '<label><span class="rotulo">Responsável</span><select class="campo" name="resp">' + opcoes(PESSOAS.map(function (k) { return [k, curto(k) + ' · ' + E[k].papel]; }), E[men] ? men : (m[2] !== QUEM ? m[2] : QUEM)) + '</select></label>' +
        '<label><span class="rotulo">Paciente</span><select class="campo" name="pac">' + opcoes(P.PACIENTES.map(function (p) { return [p.id, p.nome + ' · ' + p.id]; }), pac || 'P-DEMO7') + '</select></label>' +
        '<label><span class="rotulo">Prazo</span><select class="campo" name="prazo">' + opcoes([0, 1, 2, 3, 7].map(function (n) { return [n, (n ? '' : 'hoje · ') + A.datas.dm(A.datas.somaDias(A.datas.hoje(), n))]; }), 1) + '</select></label>' +
        '<p class="nota">Vira uma tarefa com responsável e prazo na lista de tarefas ' + A.item(182) + '.</p>', function (d) {
        var t = String(d.get('t') || '').trim().slice(0, 80); if (!t) return false;
        if (P.crmNovaTarefa) P.crmNovaTarefa({ t: esc(t), pac: d.get('pac'), resp: d.get('resp'), prazo: +d.get('prazo') });
        MSG.push([C.proxId++, m[1], QUEM, '{h:0}', 'Tarefa criada para @' + d.get('resp') + ': ' + t + ' (até ' + A.datas.dm(A.datas.somaDias(A.datas.hoje(), +d.get('prazo'))) + ')', false]);
        P.render(true); P.avisoCurto('Tarefa criada para ' + curto(d.get('resp')) + '. Está em Tarefas e retornos.');
      }, 'Criar tarefa');
      var campo = document.querySelector('.folha input[name=t]'); if (campo) { campo.value = texto; campo.focus(); }
    },
    editar: function (v) { C2.editar = v; P.render(true); }
  };
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-q]'); if (!el || !AC[el.dataset.q]) return;
    ev.preventDefault(); AC[el.dataset.q](el.dataset.v, el);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.id === 'msg-equipe') { ev.preventDefault(); enviar(); } });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t.dataset || !t.dataset.qEquipe) return;
    var id = t.dataset.qEquipe, l = EQ[id] = (EQ[id] || []).filter(function (k) { return k !== t.value; });
    if (t.checked) l.push(t.value);
    EQ[id] = PESSOAS.filter(function (k) { return l.indexOf(k) >= 0; });
  });
})();
