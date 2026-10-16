/* ERP completo: agenda (188 a 190), financeiro (196 a 200, com 87 a 89, 178 e 179) e estoque (91, 174 e 201).
   Dados de exemplo fictícios; tudo funciona só na memória (recarregar volta ao começo). Texto digitado é sempre escapado.
   O sistema não calcula dose: a baixa do estoque usa o kit que a clínica define para cada procedimento.
   Recibo não substitui nota fiscal (a emissão de nota fiscal fica fora deste projeto). */
(function () {
  'use strict';
  var P = window.PAINEL, A = P.A, T = P.TELAS, QUEM = P.QUEM, F = P.F, E = P.E;
  var cartao = P.cartao, titulo = P.titulo, cab = P.cab, kpi = P.kpi, lista = P.lista, lin = P.lin, esc = P.esc, reais = P.reais;
  function pacNome(n) { return P.PACIENTES.filter(function (p) { return p.nome === n; })[0]; }
  function nome(id) { return P.pac(id).nome; }
  function curto(k) { return P.EQUIPE[k].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André'); }
  function botao(texto, acao, v, claro, extra) { return '<button type="button" class="botao' + (claro ? ' botao-claro' : '') + '" data-e="' + acao + '" data-v="' + (v == null ? '' : esc(v)) + '"' + (extra || '') + '>' + texto + '</button>'; }
  function peq(texto, acao, v, claro, extra) { return botao(texto, acao, v, claro, ' style="height:34px;padding:0 12px;font-size:12.5px"' + (extra || '')); }
  function opcoes(l, sel) { return l.map(function (x) { var v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join(''); }
  function campo(rot, html) { return '<label><span class="rotulo">' + rot + '</span>' + html + '</label>'; }
  function folha(tit, corpo, aoSalvar, botaoTexto) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">' + tit + '</h2>' + corpo +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;flex-wrap:wrap"><button type="button" class="botao botao-claro" data-fechar>' + (aoSalvar ? 'Cancelar' : 'Fechar') + '</button>' + (aoSalvar ? '<button type="submit" class="botao">' + (botaoTexto || 'Salvar') + '</button>' : '') + '</div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) { ev.preventDefault(); if (aoSalvar && aoSalvar(new FormData(ev.target), f) !== false) f.remove(); });
    return f;
  }
  function numero(t) { var v = parseFloat(String(t).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isFinite(v) ? v : NaN; }
  function linhaTempo(id, tipo, texto, det) { if (P.linhaPaciente && id) P.linhaPaciente(id).unshift(['{d:0}', 'agora', tipo, texto, det || curto(QUEM)]); }
  function abas(lista, atual) { return '<div class="abas-tela abas-area">' + lista.map(function (a) { return '<a href="#' + a[0] + '" class="' + (a[0] === atual ? 'ativo' : '') + '">' + a[1] + '</a>'; }).join('') + '</div>'; }
  var DT = A.datas, DATAS = P.SEM.dias.map(DT.dm);
  var DIAS_SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var PROFS = ['Dr. André', 'Felipe', 'Maria Clara', 'Enfermagem'];

  // ======================= AGENDA (188, 189, 190) =======================
  var ABAS_AGENDA = [['agenda', 'Semana'], ['agenda-salas', 'Salas e equipamentos'], ['agenda-bloqueios', 'Bloqueios e férias'], ['agenda-recorrentes', 'Consultas recorrentes']];
  P.abasAgenda = function (id) { return abas(ABAS_AGENDA, id); };

  var RECURSOS = [['c1', 'Consultório 1'], ['c2', 'Consultório 2'], ['psi', 'Sala de psicologia'], ['apl', 'Sala de aplicação'], ['bal', 'Balança de bioimpedância']];
  function nomeRec(id) { return RECURSOS.filter(function (r) { return r[0] === id; })[0][1]; }
  // A sala sai do tipo de consulta (a clínica configura); a equipe pode trocar.
  function recursos(ev) {
    var t = ev.tipo || '', l;
    if (ev.sala) l = [ev.sala];
    else if (/^Nutri/.test(t)) l = ['c2'];
    else if (/^Psico/.test(t)) l = ['psi'];
    else if (/^Aplica|^Bioimp/.test(t)) l = ['apl'];
    else l = [ev.prof === 'Felipe' ? 'c2' : 'c1'];
    if (/^Bioimp/.test(t)) l = l.concat(['bal']);
    return l;
  }
  // Bloqueios de exemplo em volta do dia de referência, sem cair em cima das consultas de exemplo:
  // férias do Felipe nos dois últimos dias livres da semana e congresso do Dr. André numa tarde livre.
  function livreDe(prof, d, h1, h2) { return !P.FERIADO[d] && d !== P.REF && !E.eventos.some(function (e) { return e.prof === prof && e.dia === d && e.slot >= h1 && e.slot < h2; }); }
  function bloqueiosDeExemplo() {
    var l = [], de = -1, ate = -1, d;
    for (d = 3; d >= 0 && de < 0; d--) if (livreDe('Felipe', d, 0, 20) && livreDe('Felipe', d + 1, 0, 20)) { de = d; ate = d + 1; }
    for (d = 4; d >= 0 && de < 0; d--) if (livreDe('Felipe', d, 0, 20)) { de = d; ate = d; }
    if (de >= 0) l.push({ id: 1, prof: 'Felipe', de: de, ate: ate, h1: 0, h2: 20, motivo: 'Férias' });
    var a = [P.diaDe(1), P.diaDe(2), P.diaDe(3)].filter(function (x) { return livreDe('Dr. André', x, 16, 20); })[0];
    if (a != null) l.push({ id: 2, prof: 'Dr. André', de: a, ate: a, h1: 16, h2: 20, motivo: 'Congresso' });
    return l;
  }
  // Próximas 4 datas de uma série semanal (dow: 1 = segunda ... 5 = sexta), a partir de amanhã.
  function proximasDe(dow, passo) { var x = DT.somaDias(DT.hoje(), 1); while (x.getDay() !== dow) x = DT.somaDias(x, 1); return [0, 1, 2, 3].map(function (i) { return DT.dm(DT.somaDias(x, i * passo)); }); }
  function diasFelipe() { var b = AG.bloqueios.filter(function (x) { return x.prof === 'Felipe'; })[0]; if (!b) return ''; var t = []; for (var d = b.de; d <= b.ate; d++) t.push(DT.semLongo(P.SEM.dias[d])); return t.join(' e na '); }
  var AG = {
    reservas: [{ id: 1, dia: 3, slot: 16, rec: 'c2', motivo: 'Reunião de equipe' }, { id: 2, dia: 2, slot: 0, rec: 'bal', motivo: 'Calibração da balança' }],
    proxReserva: 3, diaSalas: P.REF,
    bloqueios: bloqueiosDeExemplo(),
    proxBloq: 3,
    series: [{ id: 1, pac: 'Mariana Lopes', tipo: 'Aplicação na clínica', prof: 'Enfermagem', dow: 4, slot: 0, passo: 7, vezes: 12, criada: '{d:-28}', proximas: proximasDe(4, 7) }],
    proxSerie: 2,
    rec: { pac: 'Carlos Menezes', tipo: 'Aplicação na clínica', prof: 'Enfermagem', dow: 3, slot: 13, passo: 7, vezes: 8 }
  };
  function bloqueiosEm(dia, slot, prof) { return AG.bloqueios.filter(function (b) { return (!prof || b.prof === prof) && dia >= b.de && dia <= b.ate && slot >= b.h1 && slot < b.h2; }); }
  function diaInteiro(b) { return b.h1 === 0 && b.h2 >= 20; }
  P.conflito = function (dia, slot, ev) {
    var b = bloqueiosEm(dia, slot, ev.prof)[0];
    if (b) return 'Horário bloqueado para ' + ev.prof + ': ' + b.motivo.toLowerCase() + '.';
    var outros = E.eventos.filter(function (e) { return e.dia === dia && e.slot === slot && e.id !== ev.id; });
    var mesmo = outros.filter(function (e) { return e.prof === ev.prof; })[0];
    if (mesmo) return ev.prof + ' já tem consulta nesse horário (' + mesmo.pac + ').';
    var meus = recursos(ev);
    for (var i = 0; i < outros.length; i++) {
      var r = recursos(outros[i]).filter(function (x) { return meus.indexOf(x) >= 0; })[0];
      if (r) return nomeRec(r) + ' já está reservado(a) nesse horário (' + outros[i].pac + ').';
    }
    var res = AG.reservas.filter(function (x) { return x.dia === dia && x.slot === slot && meus.indexOf(x.rec) >= 0; })[0];
    if (res) return nomeRec(res.rec) + ' reservado(a) nesse horário: ' + res.motivo + '.';
    return '';
  };
  P.chipDia = function (d, filtro) {
    return AG.bloqueios.filter(function (b) { return diaInteiro(b) && d >= b.de && d <= b.ate && (!filtro || filtro === b.prof); })
      .map(function (b) { return '<div class="chip-bloq">' + esc(b.prof) + ' · ' + esc(b.motivo.toLowerCase()) + '</div>'; }).join('');
  };
  P.marcaVaga = function (d, s, filtro) {
    var l = bloqueiosEm(d, s, filtro || null).filter(function (b) { return filtro || !diaInteiro(b); });
    if (!l.length) return null;
    var b = l[0], primeiro = s === b.h1;
    return { cls: 'bloq-prof', titulo: b.prof + ' · ' + b.motivo, html: primeiro ? '<span class="marca-bloq">' + esc(b.prof) + ' · ' + esc(b.motivo) + '</span>' : '' };
  };
  P.notaMarcar = function () { return 'A sala sai do tipo de consulta ' + A.item(188) + ' e o valor, da tabela de preços ' + A.item(196) + '.'; };

  T['agenda-salas'] = function () {
    var d = AG.diaSalas, evs = E.eventos.filter(function (e) { return e.dia === d; });
    var linhas = '';
    P.HORAS.forEach(function (h, s) {
      linhas += '<tr><td class="num fraco">' + h + '</td>' + RECURSOS.map(function (r) {
        var e = evs.filter(function (x) { return x.slot === s && recursos(x).indexOf(r[0]) >= 0; })[0];
        var res = AG.reservas.filter(function (x) { return x.dia === d && x.slot === s && x.rec === r[0]; })[0];
        if (e) return '<td><button type="button" class="reserva ev" data-e="trocar-sala" data-v="' + e.id + '" style="--cor:var(--c1)"><b>' + esc(e.pac) + '</b><span>' + esc(e.tipo.split(' · ')[0]) + ' · ' + esc(e.prof) + '</span></button></td>';
        if (res) return '<td><div class="reserva manual"><b>' + esc(res.motivo) + '</b><button type="button" data-e="reserva-tirar" data-v="' + res.id + '" aria-label="Tirar reserva">✕</button></div></td>';
        return '<td><button type="button" class="reserva livre" data-e="reservar" data-v="' + r[0] + ':' + s + '" aria-label="Reservar ' + r[1] + ' às ' + h + '">+</button></td>';
      }).join('') + '</tr>';
    });
    return cab('Salas e equipamentos', 'Cada consulta reserva a sala (e o equipamento) que o tipo pede. Dois atendimentos nunca usam a mesma sala no mesmo horário.', A.item(188)) + P.abasAgenda('agenda-salas') +
      '<div class="abas-tela">' + [1, 2, 3, 4].map(function (i) { return '<button type="button" data-e="dia-salas" data-v="' + i + '" class="' + (i === d ? 'ativo' : '') + '">' + P.DIAS[i] + '</button>'; }).join('') + '</div>' +
      '<div class="grade">' +
        cartao('<div class="rolar-x"><table class="tabela-larga tabela-salas"><tr><th></th>' + RECURSOS.map(function (r) { return '<th>' + r[1] + '</th>'; }).join('') + '</tr>' + linhas + '</table></div>' +
          '<p class="nota" style="margin-top:8px">Toque numa consulta para trocar de sala; toque no "+" para reservar a sala para outra coisa (reunião, limpeza, manutenção).</p>', 's12') +
        cartao(titulo('Sala de cada tipo', A.item(188)) + lista([
          lin('', '<b>Primeira consulta e retorno</b><div class="fraco">Consultório 1 (Dr. André) · Consultório 2 (Felipe)</div>'),
          lin('', '<b>Nutrição</b><div class="fraco">Consultório 2</div>'),
          lin('', '<b>Psicologia</b><div class="fraco">Sala de psicologia</div>'),
          lin('', '<b>Aplicação na clínica</b><div class="fraco">Sala de aplicação</div>'),
          lin('', '<b>Bioimpedância</b><div class="fraco">Sala de aplicação + balança</div>')]) +
          '<p class="nota" style="margin-top:8px">A clínica configura. A IA marca respeitando as mesmas salas.</p>', 's12') +
      '</div>';
  };

  T['agenda-bloqueios'] = function () {
    return cab('Bloqueios e férias', 'Horários bloqueados e férias de cada profissional. A IA e a equipe não marcam nesses horários.', A.item(189)) + P.abasAgenda('agenda-bloqueios') +
      '<div class="grade">' +
        cartao(titulo('Bloqueios desta semana', A.item(189)) + (AG.bloqueios.length ? lista(AG.bloqueios.map(function (b) {
          var quando = (b.de === b.ate ? P.DIAS[b.de] : P.DIAS[b.de] + ' a ' + P.DIAS[b.ate]) + (diaInteiro(b) ? ' · dia inteiro' : ' · ' + P.HORAS[b.h1] + ' às ' + (P.HORAS[b.h2] || '18:00'));
          return lin(A.bolha(/f[ée]rias/i.test(b.motivo) ? 'calendario' : 'cadeado', 'var(--c4)'), '<b>' + esc(b.prof) + ' · ' + esc(b.motivo) + '</b><div class="fraco">' + quando + '</div>', peq('Tirar', 'bloq-tirar', b.id, true));
        })) : '<p class="mudo">Nenhum bloqueio.</p>') +
          '<div style="margin-top:12px">' + botao(A.ic('mais') + 'Novo bloqueio', 'bloq-novo') + '</div>', 's7') +
        cartao(titulo('Como a IA responde', A.item([189, 4])) +
          '<div class="msg ela previa"><blockquote>Tem horário com o Felipe na ' + (diasFelipe().split(' e ')[0] || 'quinta') + '?</blockquote>"' + (diasFelipe() ? 'O Felipe está de férias na ' + diasFelipe() + '.' : 'O Felipe não atende nesse dia.') + ' Posso marcar na ' + P.nomeDia(P.diaDe(1)).toLowerCase() + ', às 10:00, ou com ele na semana que vem."<small>IA da clínica · simulado</small></div>' +
          '<p class="nota" style="margin-top:8px">O horário bloqueado some das opções que a IA oferece e aparece riscado na agenda.</p>', 's5') +
      '</div>';
  };

  // Datas reais para as séries, a partir da segunda-feira da semana mostrada; feriados nacionais pulados com sugestão do próximo dia útil.
  var dd = DT.dm;
  function datasSerie(r) {
    var dt = new Date(P.SEM.dias[0]); while (dt.getDay() !== r.dow) dt.setDate(dt.getDate() + 1);
    var out = [];
    for (var i = 0; i < r.vezes; i++) {
      var x = new Date(dt); x.setDate(dt.getDate() + i * r.passo);
      var s = dd(x), idx = DATAS.indexOf(s), st = 'livre', obs = '';
      if (DT.feriado(x)) { var y = DT.somaUteis(x, 1); st = 'feriado'; obs = DT.feriado(x) + ' · sugerir ' + DIAS_SEM[y.getDay()] + ' ' + dd(y); }
      else if (idx >= 0) { var c = P.conflito(idx, r.slot, { id: 0, pac: r.pac, tipo: r.tipo, prof: r.prof }); if (c) { st = 'ocupado'; obs = c; } }
      out.push({ data: DIAS_SEM[x.getDay()] + ' ' + s, s: s, idx: idx, st: st, obs: obs });
    }
    return out;
  }
  T['agenda-recorrentes'] = function () {
    var r = AG.rec, datas = datasSerie(r), livres = datas.filter(function (x) { return x.st === 'livre'; }).length;
    var ST = { livre: ['st-ok', 'livre'], feriado: ['st-al', 'feriado'], ocupado: ['st-pe', 'ocupado'] };
    return cab('Consultas recorrentes', 'Consultas que se repetem (como a aplicação semanal) marcadas de uma vez.', A.item(190)) + P.abasAgenda('agenda-recorrentes') +
      '<div class="grade">' +
        cartao(titulo('Nova série', A.item(190)) +
          '<div class="form-serie">' +
            campo('Paciente', '<select class="campo" data-e-mudar="rec" data-v="pac">' + opcoes(P.PACIENTES.map(function (p) { return p.nome; }), r.pac) + '</select>') +
            campo('Tipo', '<select class="campo" data-e-mudar="rec" data-v="tipo">' + opcoes(['Aplicação na clínica', 'Retorno', 'Nutrição', 'Psicologia', 'Bioimpedância'], r.tipo) + '</select>') +
            campo('Profissional', '<select class="campo" data-e-mudar="rec" data-v="prof">' + opcoes(PROFS, r.prof) + '</select>') +
            campo('Dia da semana', '<select class="campo" data-e-mudar="rec" data-v="dow">' + opcoes([[1, 'Segunda'], [2, 'Terça'], [3, 'Quarta'], [4, 'Quinta'], [5, 'Sexta']], r.dow) + '</select>') +
            campo('Hora', '<select class="campo" data-e-mudar="rec" data-v="slot">' + opcoes(P.HORAS.map(function (h, i) { return [i, h]; }), r.slot) + '</select>') +
            campo('Repetir', '<select class="campo" data-e-mudar="rec" data-v="passo">' + opcoes([[7, 'Toda semana'], [14, 'A cada 2 semanas'], [28, 'A cada 4 semanas']], r.passo) + '</select>') +
            campo('Quantas vezes', '<select class="campo" data-e-mudar="rec" data-v="vezes">' + opcoes([4, 8, 12], r.vezes) + '</select>') +
          '</div>' +
          '<div class="rolar-x" style="margin-top:12px"><table class="tabela-larga"><tr><th>Data</th><th>Hora</th><th>Situação</th></tr>' + datas.map(function (x) {
            return '<tr><td class="num">' + x.data + '</td><td class="num">' + P.HORAS[r.slot] + '</td><td><span class="status ' + ST[x.st][0] + '">' + ST[x.st][1] + '</span>' + (x.obs ? ' <span class="fraco" style="font-size:12px">' + esc(x.obs) + '</span>' : '') + '</td></tr>';
          }).join('') + '</table></div>' +
          '<div style="margin-top:12px">' + botao('Marcar as ' + livres + ' datas livres', 'serie-marcar', '', false, livres ? '' : ' disabled') + '</div>', 's7') +
        cartao(titulo('Séries ativas', A.item(190)) + lista(AG.series.map(function (x) {
          return lin(A.bolha('calendario', 'var(--c3)'), '<b>' + esc(x.pac) + '</b><div class="fraco">' + esc(x.tipo) + ' · ' + esc(x.prof) + ' · ' + DIAS_SEM[x.dow].toLowerCase() + ' ' + P.HORAS[x.slot] + ' · ' + ({ 7: 'toda semana', 14: 'a cada 2 semanas', 28: 'a cada 4 semanas' })[x.passo] + ' · ' + x.vezes + ' vezes</div><div class="fraco">Próximas: ' + x.proximas.join(', ') + '</div>');
        })) + '<p class="nota" style="margin-top:8px">O paciente recebe o lembrete de cada data ' + A.item(6) + '. Feriados e bloqueios são pulados, com sugestão de outra data.</p>', 's5') +
      '</div>';
  };

  // ======================= FINANCEIRO (196 a 200) =======================
  var ABAS_FIN = [['financeiro', 'Visão geral'], ['fin-precos', 'Preços'], ['fin-planos', 'Planos e pacotes'], ['emanuele-receber', 'A receber e recibos'], ['fin-caixa', 'Caixa do dia'],
    ['emanuele-pagar', 'A pagar e fluxo'], ['emanuele-repasse', 'Repasse'], ['fin-relatorios', 'Relatórios']];
  P.abasFin = function (id) { return abas(ABAS_FIN, id); };
  P.menuPai = function (id) {
    if (ABAS_FIN.some(function (a) { return a[0] === id; })) return 'financeiro';
    if (id.indexOf('agenda-') === 0 && id !== 'agenda-ia') return 'agenda';
    return '';
  };

  var FIN = {
    precos: [{ id: 'pc', nome: 'Primeira consulta', tipo: 'Primeira consulta', valor: 450 }, { id: 'rt', nome: 'Retorno', tipo: 'Retorno', valor: 300 },
      { id: 'nu', nome: 'Consulta de nutrição', tipo: 'Nutrição', valor: 250 }, { id: 'ps', nome: 'Sessão de psicologia', tipo: 'Psicologia', valor: 220 },
      { id: 'ap', nome: 'Aplicação na clínica', tipo: 'Aplicação na clínica', valor: 100 }, { id: 'bi', nome: 'Bioimpedância', tipo: 'Bioimpedância', valor: 90 }],
    planos: [{ id: 'tri', nome: 'Programa trimestral', parcelas: 3, parcela: 650, inclui: { 'Retorno': 3, 'Nutrição': 3, 'Aplicação na clínica': 12, 'Bioimpedância': 3 } },
      { id: 'sem', nome: 'Programa semestral', parcelas: 6, parcela: 600, inclui: { 'Retorno': 6, 'Nutrição': 6, 'Aplicação na clínica': 24, 'Bioimpedância': 6 } },
      { id: 'psi', nome: 'Pacote de psicologia', parcelas: 1, parcela: 650, inclui: { 'Psicologia': 4 } }],
    contratos: [
      { id: 1, pac: 'P-DEMO7', plano: 'tri', inicio: '{d:-42}', pagas: 1, uso: { 'Retorno': 2, 'Nutrição': 1, 'Aplicação na clínica': 7, 'Bioimpedância': 2 } },
      { id: 2, pac: 'P-DEMO5', plano: 'sem', inicio: '{d:-90}', pagas: 3, uso: { 'Retorno': 3, 'Nutrição': 2, 'Aplicação na clínica': 11, 'Bioimpedância': 3 } },
      { id: 3, pac: 'P-DEMO2', plano: 'tri', inicio: '{d:-104}', pagas: 3, uso: { 'Retorno': 3, 'Nutrição': 3, 'Aplicação na clínica': 12, 'Bioimpedância': 3 } },
      { id: 4, pac: 'P-DEMO3', plano: 'psi', inicio: '{d:-12}', pagas: 0, uso: { 'Psicologia': 1 } }],
    proxContrato: 5, proxReceber: 100, proxRecibo: 1043,
    caixa: { aberto: true, por: 'Elenice', hora: '{h:-95}', inicial: 200, movs: [
      { hora: '{h:-45}', pac: 'P-DEMO2', desc: 'Retorno', forma: 'Pix', valor: 300, recibo: 1041 },
      { hora: '{h:-28}', pac: 'P-DEMO5', desc: 'Bioimpedância (fora do plano)', forma: 'Cartão de débito', valor: 90, recibo: 1042 }], fechamento: null }
  };
  var FORMAS = ['Dinheiro', 'Pix', 'Cartão de débito', 'Cartão de crédito'];
  function preco(tipo) { var p = FIN.precos.filter(function (x) { return tipo.indexOf(x.tipo) === 0; })[0]; return p ? p.valor : 0; }
  function plano(id) { return FIN.planos.filter(function (x) { return x.id === id; })[0]; }
  function contratoCom(pac, servico) {
    return FIN.contratos.filter(function (c) { var pl = plano(c.plano), tot = pl.inclui[servico]; return c.pac === pac && tot && (c.uso[servico] || 0) < tot; })[0];
  }
  function servicoDe(tipo) { var p = FIN.precos.filter(function (x) { return tipo.indexOf(x.tipo) === 0; })[0]; return p ? (p.tipo === 'Primeira consulta' ? 'Primeira consulta' : p.tipo) : tipo; }
  // Item 196: ao marcar, a agenda usa a tabela de preços (ou o plano, se o paciente tiver).
  P.aoMarcar = function (ev) {
    var p = pacNome(ev.pac); if (!p) return '';
    var serv = servicoDe(ev.tipo), c = contratoCom(p.id, serv);
    if (c) { c.uso[serv] = (c.uso[serv] || 0) + 1; return ' Coberta pelo ' + plano(c.plano).nome.toLowerCase() + ' (' + c.uso[serv] + ' de ' + plano(c.plano).inclui[serv] + ').'; }
    var v = preco(ev.tipo); if (!v) return '';
    F.receber.push({ id: FIN.proxReceber++, pac: p.id, desc: ev.tipo.split(' · ')[0] + ' · ' + DATAS[ev.dia], valor: v, venc: DATAS[ev.dia], st: 'aberto' });
    return ' Cobrança de ' + reais(v) + ' gerada pela tabela de preços.';
  };
  function aberto(r) { return r.st !== 'pago'; }
  function somaR(f) { return F.receber.filter(f).reduce(function (s, r) { return s + r.valor; }, 0); }
  function saidas() { return F.pagar.reduce(function (s, p) { return s + p.valor; }, 0); }
  function entradas() { return F.recebidoMes + somaR(aberto); }

  T.financeiro = function () {
    var atraso = F.receber.filter(function (r) { return r.st === 'atraso'; });
    var alem = FIN.contratos.filter(function (c) { return pctUso(c) > pctPago(c) + 10; });
    var caixaHoje = FIN.caixa.movs.reduce(function (s, m) { return s + m.valor; }, 0);
    return cab('Financeiro', 'Preços, planos, cobranças, recibos, caixa, contas a pagar, repasses e relatórios. Valores de exemplo.', A.item([87, 196, 197, 198, 199, 200, 178, 179])) + P.abasFin('financeiro') +
      '<div class="kpis">' + kpi('Recebido no mês', reais(F.recebidoMes), 'Pix, cartão e dinheiro', 'sobe') + kpi('A receber', reais(somaR(function (r) { return r.st === 'aberto'; })), 'em aberto', '') +
        kpi('Em atraso', reais(somaR(function (r) { return r.st === 'atraso'; })), atraso.length + ' cobrança(s)', atraso.length ? 'desce' : 'sobe') + kpi('Saldo previsto', reais(entradas() - saidas()), '{m:0}', entradas() >= saidas() ? 'sobe' : 'desce') +
        kpi('Caixa de hoje', reais(caixaHoje), FIN.caixa.aberto ? 'aberto por ' + FIN.caixa.por : 'fechado', '') + '</div>' +
      '<div class="grade">' +
        cartao(titulo('Pede atenção', A.item([89, 197, 91])) + (atencao(atraso, alem) || '<p class="mudo">Nada pendente.</p>'), 's6') +
        cartao(titulo('Resultado de {m:0}', A.item(200)) + barras([['Entradas', entradas(), ''], ['Saídas', saidas(), 'opacity:.55']]) +
          '<p style="margin-top:10px">Resultado previsto: <b class="num">' + reais(entradas() - saidas()) + '</b></p><p class="nota">Entradas = recebido + a receber. Saídas = despesas do mês. <a href="#fin-relatorios">Relatórios</a></p>', 's6') +
      '</div>';
  };
  function atencao(atraso, alem) {
    return (atraso.length ? '<div class="alerta-lin" style="--cor:var(--perigo)">' + A.bolha('moeda', 'var(--perigo)') + '<div><b>' + atraso.length + ' cobrança(s) em atraso</b><div class="fraco" style="font-size:12.5px">' + atraso.map(function (r) { return nome(r.pac); }).join(', ') + ' · <a href="#emanuele-receber">ver</a></div></div></div>' : '') +
          alem.map(function (c) { return '<div class="alerta-lin" style="--cor:var(--alerta)">' + A.bolha('cartao', 'var(--alerta)') + '<div><b>' + nome(c.pac) + ' usou ' + pctUso(c) + '% do plano e pagou ' + pctPago(c) + '%</b><div class="fraco" style="font-size:12.5px">' + plano(c.plano).nome + ' · <a href="#fin-planos">ver</a></div></div></div>'; }).join('') +
          (P.estoqueTotal() < 6 ? '<div class="alerta-lin" style="--cor:var(--alerta)">' + A.bolha('pilula', 'var(--alerta)') + '<div><b>Estoque baixo: ' + P.estoqueTotal() + ' frascos</b><div class="fraco" style="font-size:12.5px">mínimo 6 · <a href="#estoque">ver estoque</a></div></div></div>' : '');
  }
  function barras(l) {
    var max = Math.max.apply(null, l.map(function (x) { return x[1]; })) || 1;
    return '<div class="barras">' + l.map(function (x) { return '<div class="lin"><span>' + x[0] + '</span><span class="trilho"><i style="width:' + Math.round(x[1] / max * 100) + '%;' + x[2] + '"></i></span><span class="val">' + reais(x[1]) + '</span></div>'; }).join('') + '</div>';
  }

  // 196 · Tabela de preços
  T['fin-precos'] = function () {
    return cab('Tabela de preços', 'Preço de cada consulta, procedimento e aplicação. A agenda e as cobranças usam esta tabela.', A.item([196, 2])) + P.abasFin('fin-precos') +
      '<div class="grade">' +
        cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Serviço</th><th>Preço (R$)</th></tr>' + FIN.precos.map(function (p) {
          return '<tr><td><b>' + esc(p.nome) + '</b></td><td><input class="campo campo-mini campo-preco" inputmode="decimal" data-e-mudar="preco" data-v="' + p.id + '" value="' + p.valor + '" aria-label="Preço de ' + esc(p.nome) + '"></td></tr>';
        }).join('') + '</table></div><div style="margin-top:12px">' + botao(A.ic('mais') + 'Novo serviço', 'preco-novo', '', true) + '</div>', 's7') +
        cartao(titulo('Onde o preço aparece', A.item(196)) + lista([
          lin(A.bolha('calendario', 'var(--c1)'), 'Ao marcar na agenda, a cobrança nasce com o preço da tabela (ou entra no plano do paciente).'),
          lin(A.bolha('whatsapp', 'var(--c3)'), 'A IA responde preços com esta tabela ' + A.item(2) + '.'),
          lin(A.bolha('moeda', 'var(--c5)'), 'O caixa do dia usa a tabela para pagamentos avulsos ' + A.item(199) + '.')]), 's5') +
      '</div>';
  };

  // 197 · Planos e pacotes
  var PLURAL = { 'Retorno': 'retornos', 'Nutrição': 'consultas de nutrição', 'Aplicação na clínica': 'aplicações na clínica', 'Bioimpedância': 'bioimpedâncias', 'Psicologia': 'sessões de psicologia' };
  function totalInclui(pl) { return Object.keys(pl.inclui).reduce(function (s, k) { return s + pl.inclui[k]; }, 0); }
  function totalUso(c) { return Object.keys(c.uso).reduce(function (s, k) { return s + c.uso[k]; }, 0); }
  function pctUso(c) { return Math.round(totalUso(c) / totalInclui(plano(c.plano)) * 100); }
  function pctPago(c) { return Math.round(c.pagas / plano(c.plano).parcelas * 100); }
  T['fin-planos'] = function () {
    return cab('Planos e pacotes', 'Tratamentos vendidos em parcelas, acompanhando o que já foi usado e o que já foi pago.', A.item(197)) + P.abasFin('fin-planos') +
      '<div class="grade">' +
        cartao(titulo('Planos da clínica', A.item(197)) + lista(FIN.planos.map(function (pl) {
          return lin(A.bolha('cartao', 'var(--c5)'), '<b>' + pl.nome + '</b><div class="fraco">' + pl.parcelas + 'x ' + reais(pl.parcela) + ' · ' + Object.keys(pl.inclui).map(function (k) { return pl.inclui[k] + ' ' + (PLURAL[k] || k.toLowerCase()); }).join(', ') + '</div>');
        })) + '<div style="margin-top:12px">' + botao(A.ic('mais') + 'Vender plano', 'plano-vender') + '</div>', 's5') +
        cartao(titulo('Planos dos pacientes', A.item(197)) + lista(FIN.contratos.map(function (c) {
          var pl = plano(c.plano), u = pctUso(c), pg = pctPago(c);
          return '<div class="contrato"><div class="linha-ic"><div class="meio"><b>' + nome(c.pac) + '</b> <span class="idp">' + c.pac + '</span><div class="fraco">' + pl.nome + ' · desde ' + c.inicio + '</div></div>' +
            (u > pg + 10 ? '<span class="status st-al">usou mais do que pagou</span>' : u >= 100 && pg >= 100 ? '<span class="status st-ok">concluído</span>' : '<span class="status st-in">em andamento</span>') + '</div>' +
            '<div class="uso"><span>Pago</span><div class="barra" style="--cor:var(--ok)"><i style="width:' + pg + '%"></i></div><span class="num">' + c.pagas + '/' + pl.parcelas + '</span></div>' +
            Object.keys(pl.inclui).map(function (k) { var x = c.uso[k] || 0, t = pl.inclui[k]; return '<div class="uso"><span>' + k + '</span><div class="barra" style="--cor:var(--primaria)"><i style="width:' + Math.round(x / t * 100) + '%"></i></div><span class="num">' + x + '/' + t + '</span></div>'; }).join('') + '</div>';
        })) + '<p class="nota" style="margin-top:8px">O uso sobe sozinho: ao marcar uma consulta do plano e ao registrar uma aplicação ' + A.item(201) + '.</p>', 's7') +
      '</div>';
  };

  // 198 · Recibos
  P.reciboBtn = function (r) { return '<span class="status st-ok">pago · ' + esc(r.forma || 'Pix') + '</span> ' + peq('Recibo', 'recibo', 'r:' + r.id, true); };
  function reciboDe(v) {
    var x = v.split(':');
    if (x[0] === 'r') { var r = F.receber.filter(function (y) { return String(y.id) === x[1]; })[0]; if (!r.recibo) r.recibo = FIN.proxRecibo++; return { n: r.recibo, pac: r.pac, desc: r.desc, valor: r.valor, forma: r.forma || 'Pix', data: r.pagoEm || '{d:0}' }; }
    var m = FIN.caixa.movs[+x[1]]; return { n: m.recibo, pac: m.pac, desc: m.desc, valor: m.valor, forma: m.forma, data: '{d:0}' };
  }
  function mostrarRecibo(v) {
    var r = reciboDe(v), p = P.pac(r.pac);
    var f = folha('Recibo nº ' + r.n,
      '<div class="documento"><b>AG Melhor Versão</b> · CNPJ 00.000.000/0001-00 (exemplo)<br><br>Recebemos de <b>' + esc(p.nome) + '</b> (' + p.id + ') a quantia de <b>' + reais(r.valor) + '</b>, referente a ' + esc(r.desc) + ', paga em ' + esc(r.forma.toLowerCase()) + ' em ' + r.data + '/2026.<br><br>AG Melhor Versão · recibo gerado pelo sistema</div>' +
      '<p class="nota">O recibo não substitui a nota fiscal; a emissão de nota fiscal fica fora deste projeto.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + botao(A.ic('whatsapp') + 'Enviar pelo WhatsApp', 'recibo-enviar', r.pac + ':whatsapp:' + r.n) + botao(A.ic('chat') + 'Enviar pelo app', 'recibo-enviar', r.pac + ':app:' + r.n, true) + botao(A.ic('download') + 'PDF', 'aviso', 'PDF do recibo gerado (simulado).', true) + '</div>');
    return f;
  }

  // 199 · Caixa do dia
  T['fin-caixa'] = function () {
    var c = FIN.caixa, por = {};
    FORMAS.forEach(function (f) { por[f] = 0; }); c.movs.forEach(function (m) { por[m.forma] += m.valor; });
    var total = c.movs.reduce(function (s, m) { return s + m.valor; }, 0), gaveta = c.inicial + por.Dinheiro;
    return cab('Caixa do dia', 'Abertura e fechamento do caixa da recepção, com as formas de pagamento. {Wl:0}, {d:0}.', A.item([199, 198])) + (QUEM === 'elenice' ? '' : P.abasFin('fin-caixa')) +
      '<div class="kpis">' + kpi('Situação', c.aberto ? 'Aberto' : 'Fechado', c.aberto ? 'por ' + c.por + ' às ' + c.hora : 'às ' + c.fechamento.hora, c.aberto ? 'sobe' : '') +
        FORMAS.map(function (f) { return kpi(f, reais(por[f]), c.movs.filter(function (m) { return m.forma === f; }).length + ' pagamento(s)', ''); }).join('') + '</div>' +
      '<div class="grade">' +
        cartao(titulo('Pagamentos de hoje', A.item([199, 198])) +
          (c.movs.length ? '<div class="rolar-x"><table class="tabela-larga"><tr><th>Hora</th><th>Paciente</th><th>O quê</th><th>Forma</th><th>Valor</th><th></th></tr>' + c.movs.map(function (m, i) {
            return '<tr><td class="num">' + m.hora + '</td><td><b>' + nome(m.pac) + '</b></td><td>' + esc(m.desc) + '</td><td>' + m.forma + '</td><td class="num">' + reais(m.valor) + '</td><td>' + peq('Recibo', 'recibo', 'm:' + i, true) + '</td></tr>';
          }).join('') + '<tr><td></td><td colspan="3"><b>Total</b></td><td class="num"><b>' + reais(total) + '</b></td><td></td></tr></table></div>' : '<p class="mudo">Nenhum pagamento ainda.</p>') +
          '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' + botao(A.ic('moeda') + 'Receber pagamento', 'caixa-receber', '', false, c.aberto ? '' : ' disabled') + '</div>', 's8') +
        cartao(titulo(c.aberto ? 'Fechar o caixa' : 'Caixa fechado', A.item(199)) +
          lista([lin('', 'Troco de abertura', '<span class="num">' + reais(c.inicial) + '</span>'), lin('', 'Dinheiro recebido', '<span class="num">' + reais(por.Dinheiro) + '</span>'), lin('', '<b>Esperado na gaveta</b>', '<b class="num">' + reais(gaveta) + '</b>')]) +
          (c.aberto ? '<div style="margin-top:12px">' + botao('Fechar o caixa', 'caixa-fechar', '', true) + '</div>'
            : '<div class="alerta-lin" style="--cor:' + (c.fechamento.dif ? 'var(--alerta)' : 'var(--ok)') + ';margin-top:12px">' + A.bolha('moeda', c.fechamento.dif ? 'var(--alerta)' : 'var(--ok)') + '<div><b>Contado: ' + reais(c.fechamento.contado) + '</b><div class="fraco" style="font-size:12.5px">' + (c.fechamento.dif ? 'Diferença de ' + reais(c.fechamento.dif) + ' registrada' : 'Sem diferença') + ' · fechado por ' + esc(c.fechamento.por) + '</div></div></div>') +
          '<p class="nota" style="margin-top:8px">Pix e cartão entram no relatório do dia; o dinheiro é conferido na gaveta.</p>', 's4') +
      '</div>';
  };

  // 200 · Relatórios
  var PROCED = [['Primeira consulta', 'Dr. André', 18, 8100], ['Retorno', 'Dr. André', 101, 30300], ['Consulta de nutrição', 'Felipe', 52, 19760], ['Sessão de psicologia', 'Maria Clara', 36, 23400],
    ['Aplicação na clínica', 'Enfermagem', 91, 9100], ['Bioimpedância', 'Enfermagem', 30, 2700]];
  T['fin-relatorios'] = function () {
    var porProf = {}; PROCED.forEach(function (x) { porProf[x[1]] = (porProf[x[1]] || 0) + x[3]; });
    var prod = PROCED.reduce(function (s, x) { return s + x[3]; }, 0);
    return cab('Relatórios e resultado do mês', 'Produção por profissional e por procedimento, e o resultado simples de {m:0}. Valores de exemplo.', A.item([200, 179])) + P.abasFin('fin-relatorios') +
      '<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kpi('Produção do mês', reais(prod), 'o que foi atendido', '') + kpi('Entradas − saídas', reais(entradas() - saidas()), 'resultado previsto', entradas() >= saidas() ? 'sobe' : 'desce') + kpi('Ticket médio', reais(Math.round(prod / PROCED.reduce(function (s, x) { return s + x[2]; }, 0))), 'por atendimento', '') + '</div>' +
      '<div class="grade">' +
        cartao(titulo('Por profissional', A.item([200, 179])) + barras(Object.keys(porProf).map(function (k) { return [k, porProf[k], '']; })), 's6') +
        cartao(titulo('Resultado de {m:0}', A.item(200)) + barras([['Entradas', entradas(), ''], ['Saídas', saidas(), 'opacity:.55']]) +
          '<p style="margin-top:10px">Resultado: <b class="num">' + reais(entradas() - saidas()) + '</b></p><p class="nota">Entradas = recebido + a receber; saídas = despesas do mês ' + A.item(178) + '.</p>', 's6') +
        cartao(titulo('Por procedimento', A.item(200)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Procedimento</th><th>Profissional</th><th>Atendimentos</th><th>Produção</th></tr>' +
          PROCED.map(function (x) { return '<tr><td><b>' + x[0] + '</b></td><td>' + x[1] + '</td><td class="num">' + x[2] + '</td><td class="num">' + reais(x[3]) + '</td></tr>'; }).join('') + '</table></div>' +
          '<div style="margin-top:12px">' + botao(A.ic('download') + 'Baixar planilha (CSV)', 'csv', '', true) + '</div>', 's12') +
      '</div>';
  };

  // ======================= ESTOQUE (91, 174, 201) =======================
  var EST = {
    materiais: [{ nome: 'Seringa de insulina', qtd: 38, min: 20 }, { nome: 'Agulha para caneta', qtd: 14, min: 20 }, { nome: 'Algodão (bola)', qtd: 220, min: 100 }, { nome: 'Álcool 70% (sachê)', qtd: 90, min: 50 }, { nome: 'Curativo redondo', qtd: 60, min: 30 }],
    kit: [['Seringa de insulina', 1], ['Agulha para caneta', 1], ['Algodão (bola)', 2], ['Álcool 70% (sachê)', 1], ['Curativo redondo', 1]],
    movs: [['{d:0} {h:-65}', 'saída', '1 frasco (lote L2309A) + kit de aplicação', 'Aplicação de Beatriz Nogueira · Eduarda'], ['{d:-12} 10:00', 'entrada', '20 frascos (lote L2309A)', 'Compra do fornecedor'], ['{d:-12} 10:05', 'entrada', '200 seringas, 100 agulhas', 'Compra do fornecedor']]
  };
  function material(n) { return EST.materiais.filter(function (m) { return m.nome === n; })[0]; }
  // Item 201: cada aplicação registrada tira do estoque o frasco e o kit; e conta no plano do paciente (197).
  P.aoAplicar = function (pac, lote) {
    EST.kit.forEach(function (k) { var m = material(k[0]); if (m) m.qtd = Math.max(0, m.qtd - k[1]); });
    EST.movs.unshift(['{d:0} ' + new Date().toTimeString().slice(0, 5), 'saída', '1 frasco (lote ' + esc(lote) + ') + kit de aplicação', 'Aplicação de ' + nome(pac) + ' · ' + curto(QUEM === 'andre' ? 'eduarda' : QUEM)]);
    var extra = ' Baixa automática do kit.';
    var c = contratoCom(pac, 'Aplicação na clínica');
    if (c) { c.uso['Aplicação na clínica'] = (c.uso['Aplicação na clínica'] || 0) + 1; extra += ' Plano: ' + c.uso['Aplicação na clínica'] + ' de ' + plano(c.plano).inclui['Aplicação na clínica'] + ' aplicações.'; }
    return extra;
  };
  T.estoque = function () {
    var baixos = EST.materiais.filter(function (m) { return m.qtd < m.min; }), vence = F.lotes.filter(function (l) { return l.dias <= 30 && l.qtd > 0; });
    return cab('Estoque', 'Frascos por lote e validade, materiais, e a baixa automática a cada aplicação registrada.', A.item([91, 174, 201])) +
      '<div class="kpis">' + kpi('Frascos', P.estoqueTotal(), 'mínimo 6', P.estoqueTotal() < 6 ? 'desce' : 'sobe') + kpi('Lotes perto de vencer', vence.length, 'em até 30 dias', vence.length ? 'desce' : 'sobe') +
        kpi('Materiais abaixo do mínimo', baixos.length, baixos.map(function (m) { return m.nome.toLowerCase(); }).join(', ') || 'nenhum', baixos.length ? 'desce' : 'sobe') + '</div>' +
      '<div class="grade">' +
        cartao(titulo('Frascos por lote', A.item([91, 174])) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Lote</th><th>Validade</th><th>Frascos</th><th></th></tr>' +
          F.lotes.map(function (l) { return '<tr><td class="num"><b>' + esc(l.lote) + '</b></td><td class="num">' + esc(l.val) + '</td><td class="num">' + l.qtd + '</td><td>' + (l.dias <= 30 ? '<span class="status st-al">vence em ' + l.dias + ' dias · usar primeiro</span>' : '<span class="status st-ok">ok</span>') + '</td></tr>'; }).join('') +
          '</table></div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="botao" data-f="lote-novo" data-v="">Entrada de frascos</button>' + botao('Entrada de material', 'material-entrada', '', true) + '</div>', 's6') +
        cartao(titulo('Materiais', A.item(201)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Material</th><th>Quantidade</th><th>Mínimo</th><th></th></tr>' +
          EST.materiais.map(function (m) { return '<tr><td><b>' + esc(m.nome) + '</b></td><td class="num">' + m.qtd + '</td><td class="num">' + m.min + '</td><td>' + (m.qtd < m.min ? '<span class="status st-al">repor</span>' : '<span class="status st-ok">ok</span>') + '</td></tr>'; }).join('') + '</table></div>', 's6') +
        cartao(titulo('Baixa automática', A.item(201)) +
          '<p class="mudo" style="font-size:13.5px">Quando a enfermagem registra uma aplicação, sai do estoque 1 frasco do lote escolhido (o que vence primeiro aparece no topo) e o kit que a clínica definiu:</p>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + EST.kit.map(function (k) { return '<span class="chip">' + k[1] + ' ' + esc(k[0].toLowerCase()) + '</span>'; }).join('') + '</div>' +
          '<p class="nota" style="margin-top:8px">O kit é definido pela clínica. O sistema não calcula dose.</p>' +
          '<div style="margin-top:10px"><a class="botao botao-claro" href="?quem=eduarda&amp;e=' + A.estilo() + '#edu-aplicacoes" style="text-decoration:none">' + A.ic('seringa') + 'Registrar uma aplicação (como Eduarda)</a></div>', 's6') +
        cartao(titulo('Movimentações', A.item([91, 201])) + lista(EST.movs.slice(0, 8).map(function (m) {
          return lin('<span class="status ' + (m[1] === 'entrada' ? 'st-ok' : 'st-in') + '">' + m[1] + '</span>', '<b>' + m[2] + '</b><div class="fraco">' + m[3] + '</div>', '<span class="num fraco" style="font-size:12px">' + m[0] + '</span>');
        })), 's6') +
      '</div>';
  };

  // Elenice (recepção) abre o caixa pelo próprio menu.
  if (P.meuMenu.elenice) P.meuMenu.elenice.push(['fin-caixa', 'Caixa do dia', 'moeda']);

  // ======================= ações =======================
  var AC = {
    'dia-salas': function (v) { AG.diaSalas = +v; P.render(true); },
    'reservar': function (v) {
      var x = v.split(':');
      folha('Reservar ' + nomeRec(x[0]), '<p class="mudo">' + P.DIAS[AG.diaSalas] + ' às ' + P.HORAS[+x[1]] + '</p>' + campo('Para quê', '<input class="campo" name="m" placeholder="Ex.: Limpeza, reunião, manutenção" maxlength="40">'), function (d) {
        var m = String(d.get('m') || '').trim().slice(0, 40); if (!m) return false;
        AG.reservas.push({ id: AG.proxReserva++, dia: AG.diaSalas, slot: +x[1], rec: x[0], motivo: m }); P.render(true); P.avisoCurto('Reservado. A agenda e a IA não usam esse horário.');
      }, 'Reservar');
    },
    'reserva-tirar': function (v) { AG.reservas = AG.reservas.filter(function (r) { return r.id !== +v; }); P.render(true); },
    'trocar-sala': function (v) {
      var ev = E.eventos.filter(function (e) { return e.id === +v; })[0];
      var salas = RECURSOS.filter(function (r) { return r[0] !== 'bal'; });
      folha('Sala de ' + esc(ev.pac), '<p class="mudo">' + esc(ev.tipo.split(' · ')[0]) + ' · ' + esc(ev.prof) + ' · ' + P.DIAS[ev.dia] + ' às ' + P.HORAS[ev.slot] + '</p>' +
        campo('Sala', '<select class="campo" name="s">' + opcoes(salas, recursos(ev)[0]) + '</select>'), function (d) {
        var antes = ev.sala; ev.sala = d.get('s');
        var c = P.conflito(ev.dia, ev.slot, ev); if (c) { ev.sala = antes; P.avisoCurto(c); return false; }
        P.render(true); P.avisoCurto('Sala trocada para ' + nomeRec(ev.sala) + '.');
      }, 'Trocar');
    },
    'bloq-tirar': function (v) { AG.bloqueios = AG.bloqueios.filter(function (b) { return b.id !== +v; }); P.render(true); },
    'bloq-novo': function () {
      var dias = [1, 2, 3, 4].map(function (i) { return [i, P.DIAS[i]]; });
      folha('Novo bloqueio', campo('Profissional', '<select class="campo" name="prof">' + opcoes(PROFS) + '</select>') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campo('De', '<select class="campo" name="de">' + opcoes(dias, 2) + '</select>') + campo('Até', '<select class="campo" name="ate">' + opcoes(dias, 2) + '</select>') + '</div>' +
        '<label class="confirma" style="margin-top:4px"><input type="checkbox" name="inteiro" checked> Dia inteiro</label>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campo('Das', '<select class="campo" name="h1">' + opcoes(P.HORAS.map(function (h, i) { return [i, h]; }), 0) + '</select>') + campo('Às', '<select class="campo" name="h2">' + opcoes(P.HORAS.map(function (h, i) { return [i + 1, P.HORAS[i + 1] || '18:00']; }), 20) + '</select>') + '</div>' +
        campo('Motivo', '<input class="campo" name="m" placeholder="Ex.: Férias, congresso, curso" maxlength="30">'), function (d) {
        var m = String(d.get('m') || '').trim().slice(0, 30), de = +d.get('de'), ate = +d.get('ate'), h1 = d.get('inteiro') ? 0 : +d.get('h1'), h2 = d.get('inteiro') ? 20 : +d.get('h2');
        if (!m) { P.avisoCurto('Escreva o motivo.'); return false; }
        if (ate < de || h2 <= h1) { P.avisoCurto('Confira as datas e os horários.'); return false; }
        var b = { id: AG.proxBloq++, prof: d.get('prof'), de: de, ate: ate, h1: h1, h2: h2, motivo: m };
        var choque = E.eventos.filter(function (e) { return e.prof === b.prof && e.dia >= de && e.dia <= ate && e.slot >= h1 && e.slot < h2; });
        AG.bloqueios.push(b); P.render(true);
        P.avisoCurto(choque.length ? 'Bloqueio criado. ' + choque.length + ' consulta(s) nesse período para remarcar: ' + choque.map(function (e) { return e.pac; }).join(', ') + '.' : 'Bloqueio criado. A IA não oferece mais esses horários.');
      }, 'Bloquear');
    },
    'serie-marcar': function () {
      var r = AG.rec, datas = datasSerie(r), livres = datas.filter(function (x) { return x.st === 'livre'; });
      livres.forEach(function (x) { if (x.idx >= 0) E.eventos.push({ id: E.proxId++, dia: x.idx, slot: r.slot, pac: r.pac, tipo: r.tipo, prof: r.prof }); });
      AG.series.push({ id: AG.proxSerie++, pac: r.pac, tipo: r.tipo, prof: r.prof, dow: r.dow, slot: r.slot, passo: r.passo, vezes: livres.length, criada: '{d:0}', proximas: livres.slice(0, 4).map(function (x) { return x.s; }) });
      var p = pacNome(r.pac); linhaTempo(p && p.id, 'consulta', 'Série marcada: ' + r.tipo + ', ' + livres.length + ' datas', r.prof);
      P.render(true); P.avisoCurto(livres.length + ' consultas marcadas. As desta semana já estão na agenda.');
    },
    'preco-novo': function () {
      folha('Novo serviço', campo('Nome', '<input class="campo" name="n" placeholder="Ex.: Avaliação física" maxlength="40">') + campo('Preço (R$)', '<input class="campo" name="v" inputmode="decimal" value="150">'), function (d) {
        var n = String(d.get('n') || '').trim().slice(0, 40), v = numero(d.get('v')); if (!n || !(v > 0)) return false;
        FIN.precos.push({ id: 'x' + FIN.precos.length, nome: n, tipo: n, valor: v }); P.render(true);
      }, 'Incluir');
    },
    'plano-vender': function () {
      folha('Vender plano', campo('Paciente', '<select class="campo" name="pac">' + opcoes(P.PACIENTES.map(function (p) { return [p.id, p.nome + ' · ' + p.id]; }), 'P-DEMO9') + '</select>') +
        campo('Plano', '<select class="campo" name="pl">' + opcoes(FIN.planos.map(function (p) { return [p.id, p.nome + ' · ' + p.parcelas + 'x ' + reais(p.parcela)]; })) + '</select>'), function (d) {
        var pl = plano(d.get('pl')), pac = d.get('pac'), uso = {};
        Object.keys(pl.inclui).forEach(function (k) { uso[k] = 0; });
        FIN.contratos.unshift({ id: FIN.proxContrato++, pac: pac, plano: pl.id, inicio: '{d:0}', pagas: 0, uso: uso });
        var meses = [0, 1, 2, 3, 4, 5].map(function (i) { var h = DT.hoje(); return DT.dm(new Date(h.getFullYear(), h.getMonth() + i, Math.min(h.getDate(), 28))); });
        for (var i = 0; i < pl.parcelas; i++) F.receber.push({ id: FIN.proxReceber++, pac: pac, desc: pl.nome + ' · parcela ' + (i + 1) + '/' + pl.parcelas, valor: pl.parcela, venc: meses[i], st: 'aberto' });
        linhaTempo(pac, 'pagamento', pl.nome + ' contratado · ' + pl.parcelas + 'x ' + reais(pl.parcela));
        P.render(true); P.avisoCurto(pl.nome + ' vendido. ' + pl.parcelas + ' parcela(s) entraram em "A receber".');
      }, 'Vender');
    },
    'recibo': function (v) { mostrarRecibo(v); },
    'recibo-enviar': function (v, el) {
      var x = v.split(':'); linhaTempo(x[0], 'pagamento', 'Recibo nº ' + x[2] + ' enviado pelo ' + (x[1] === 'app' ? 'app' : 'WhatsApp'));
      var f = el.closest('.folha-fundo'); if (f) f.remove(); P.avisoCurto('Recibo enviado pelo ' + (x[1] === 'app' ? 'app' : 'WhatsApp') + ' (simulado).');
    },
    'caixa-receber': function () {
      var abertos = F.receber.filter(aberto);
      folha('Receber pagamento',
        campo('O que está sendo pago', '<select class="campo" name="o"><optgroup label="Cobranças em aberto">' + abertos.map(function (r) { return '<option value="r:' + r.id + '">' + esc(nome(r.pac) + ' · ' + r.desc + ' · ' + reais(r.valor)) + '</option>'; }).join('') + '</optgroup>' +
          '<optgroup label="Avulso (tabela de preços)">' + FIN.precos.map(function (p) { return '<option value="p:' + p.id + '">' + esc(p.nome + ' · ' + reais(p.valor)) + '</option>'; }).join('') + '</optgroup></select>') +
        campo('Paciente (para avulso)', '<select class="campo" name="pac">' + opcoes(P.PACIENTES.map(function (p) { return [p.id, p.nome]; })) + '</select>') +
        campo('Forma de pagamento', '<select class="campo" name="forma">' + opcoes(FORMAS, 'Pix') + '</select>'), function (d) {
        var o = String(d.get('o')).split(':'), forma = d.get('forma'), mov;
        if (o[0] === 'r') {
          var r = F.receber.filter(function (y) { return String(y.id) === o[1]; })[0]; r.st = 'pago'; r.forma = forma; r.pagoEm = '{d:0}'; r.recibo = FIN.proxRecibo++;
          F.recebidoMes += r.valor; mov = { pac: r.pac, desc: r.desc, valor: r.valor, recibo: r.recibo };
          var c = FIN.contratos.filter(function (k) { return k.pac === r.pac && r.desc.indexOf(plano(k.plano).nome) === 0; })[0]; if (c) c.pagas = Math.min(plano(c.plano).parcelas, c.pagas + 1);
        } else {
          var p = FIN.precos.filter(function (y) { return y.id === o[1]; })[0]; F.recebidoMes += p.valor;
          mov = { pac: d.get('pac'), desc: p.nome, valor: p.valor, recibo: FIN.proxRecibo++ };
        }
        mov.hora = new Date().toTimeString().slice(0, 5); mov.forma = forma; FIN.caixa.movs.push(mov);
        linhaTempo(mov.pac, 'pagamento', esc(mov.desc) + ' pago · ' + forma + ' · ' + reais(mov.valor), 'recibo nº ' + mov.recibo);
        P.render(true); P.avisoCurto('Recebido: ' + reais(mov.valor) + ' em ' + forma.toLowerCase() + '. Recibo nº ' + mov.recibo + ' pronto.');
      }, 'Receber');
    },
    'caixa-fechar': function () {
      var c = FIN.caixa, din = c.movs.filter(function (m) { return m.forma === 'Dinheiro'; }).reduce(function (s, m) { return s + m.valor; }, 0), esperado = c.inicial + din;
      folha('Fechar o caixa', '<p class="mudo">Esperado na gaveta: <b>' + reais(esperado) + '</b></p>' + campo('Dinheiro contado (R$)', '<input class="campo" name="v" inputmode="decimal" value="' + esperado + '">'), function (d) {
        var v = numero(d.get('v')); if (!(v >= 0)) return false;
        c.aberto = false; c.fechamento = { hora: new Date().toTimeString().slice(0, 5), contado: v, dif: Math.round((v - esperado) * 100) / 100, por: curto(QUEM) };
        P.render(true); P.avisoCurto('Caixa fechado.' + (c.fechamento.dif ? ' Diferença registrada.' : ' Sem diferença.'));
      }, 'Fechar');
    },
    'csv': function () {
      var l = [['Procedimento', 'Profissional', 'Atendimentos', 'Produção (R$)']].concat(PROCED.map(function (x) { return [x[0], x[1], x[2], x[3]]; }));
      var csv = '﻿' + l.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'relatorio-' + DT.mes(DT.hoje()) + '-exemplo.csv';
      document.body.appendChild(a); a.click(); a.remove(); P.avisoCurto('Planilha baixada (dados de exemplo).');
    },
    'material-entrada': function () {
      folha('Entrada de material', campo('Material', '<select class="campo" name="m">' + opcoes(EST.materiais.map(function (m) { return m.nome; })) + '</select>') + campo('Quantidade', '<input class="campo" name="q" inputmode="numeric" value="100">'), function (d) {
        var q = parseInt(d.get('q'), 10), m = material(d.get('m')); if (!(q > 0) || !m) return false;
        m.qtd += q; EST.movs.unshift(['{d:0} ' + new Date().toTimeString().slice(0, 5), 'entrada', q + ' ' + esc(m.nome.toLowerCase()), 'Entrada manual · ' + curto(QUEM)]); P.render(true);
      }, 'Registrar');
    },
    'aviso': function (v) { P.avisoCurto(v); }
  };
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-e]'); if (!el || !AC[el.dataset.e] || el.disabled) return;
    ev.preventDefault(); AC[el.dataset.e](el.dataset.v, el);
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, m = t.dataset && t.dataset.eMudar; if (!m) return;
    if (m === 'rec') { var k = t.dataset.v; AG.rec[k] = /^(dow|slot|passo|vezes)$/.test(k) ? +t.value : t.value; P.render(true); }
    if (m === 'preco') {
      var v = numero(t.value), p = FIN.precos.filter(function (x) { return x.id === t.dataset.v; })[0];
      if (!(v > 0)) { t.value = p.valor; P.avisoCurto('Preço inválido.'); return; }
      p.valor = v; P.avisoCurto(p.nome + ': ' + reais(v) + '. Vale para as próximas cobranças.');
    }
  });
})();
