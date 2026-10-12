/* Painel de cada profissional (itens 168 e 169, e lote R8 · Rotinas por função, 171 a 179).
   Proposta baseada na rotina de cada função numa clínica de emagrecimento com acompanhamento multiprofissional.
   Dados de exemplo fictícios; as ações funcionam só na memória (recarregar volta ao começo).
   Regras fixas: o sistema não calcula dose (só mostra o que foi prescrito e conferido); a IA não diagnostica
   nem prescreve; as anotações da psicologia (172) só aparecem para a psicóloga. */
(function () {
  'use strict';
  var P = window.PAINEL, A = P.A, T = P.TELAS, QUEM = P.QUEM;
  var cartao = P.cartao, titulo = P.titulo, cab = P.cab, kpi = P.kpi, lista = P.lista, lin = P.lin, esc = P.esc;
  function nome(id) { return P.pac(id).nome; }
  function prop() { return A.item([168]) + A.proposta(); }
  function br(n) { return Number(n).toLocaleString('pt-BR'); }
  function reais(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function botao(texto, acao, v, claro) { return '<button type="button" class="botao' + (claro ? ' botao-claro' : '') + '" data-f="' + acao + '" data-v="' + (v == null ? '' : v) + '" style="height:34px;padding:0 12px;font-size:12.5px">' + texto + '</button>'; }
  function opcoesPac(ids, sel) { return ids.map(function (id) { return '<option value="' + id + '"' + (id === sel ? ' selected' : '') + '>' + nome(id) + ' · ' + id + '</option>'; }).join(''); }
  function atalhos(l) {
    return '<div class="grade">' + l.map(function (x) {
      return '<a class="cartao s4" href="#' + x[0] + '" style="text-decoration:none;color:inherit"><div class="linha-ic">' + A.bolha(x[1], x[2]) + '<div class="meio"><b>' + x[3] + '</b><div class="fraco" style="font-size:12.5px">' + x[4] + '</div></div>' + A.ic('seta', 'fraco') + '</div><div style="margin-top:8px">' + x[5] + '</div></a>';
    }).join('') + '</div>';
  }
  function cabProf(k, sub, itens) {
    var p = P.EQUIPE[k];
    return '<div class="cabeca"><div class="linha-ic">' + P.pessoa(p, 52) + '<div><h1>' + p.nome + '</h1><p class="sub">' + p.papel + ' · ' + sub + '</p><div class="itens">' + (itens || '') + prop() + '</div></div></div></div>';
  }

  // Janela simples com formulário. campos: HTML; aoSalvar(FormData). O texto digitado é escapado onde aparece.
  function folha(tit, campos, aoSalvar, botaoTexto) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">' + tit + '</h2>' + campos +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">' + (botaoTexto || 'Salvar') + '</button></div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) { ev.preventDefault(); if (aoSalvar(new FormData(ev.target)) !== false) f.remove(); });
    var c = f.querySelector('input,textarea,select'); if (c) c.focus();
  }
  function campo(rot, html) { return '<label><span class="rotulo">' + rot + '</span>' + html + '</label>'; }

  // ---------- dados de exemplo ----------
  var F = {
    // Felipe · nutrição
    alimentos: [['Ovos mexidos (2 un.)', 180, 12], ['Pão integral (1 fatia)', 70, 3], ['Iogurte natural (170 g)', 110, 7], ['Aveia (2 col.)', 75, 3], ['Frango grelhado (120 g)', 200, 37],
      ['Arroz (4 col.)', 160, 3], ['Feijão (1 concha)', 100, 7], ['Salada à vontade', 30, 1], ['Fruta (1 un.)', 70, 1], ['Castanhas (10 un.)', 90, 2], ['Omelete de legumes (2 ovos)', 220, 14],
      ['Peixe assado (120 g)', 170, 30], ['Batata-doce (1 média)', 115, 2], ['Queijo branco (2 fatias)', 100, 9], ['Sopa de legumes com frango', 210, 18]],
    refeicoes: ['Café da manhã', 'Lanche', 'Almoço', 'Lanche da tarde', 'Jantar'],
    modelos: [
      { nome: '1.600 kcal · 5 refeições', ref: [[0, 1], [8, 9], [7, 4, 5, 6], [2, 3], [10]] },
      { nome: '1.400 kcal · leve à noite', ref: [[2, 3], [8], [7, 11, 12], [13], [14]] },
      { nome: '1.800 kcal · treino à tarde', ref: [[0, 1, 8], [9, 2], [7, 4, 5, 6], [12, 13], [11, 7]] }],
    planoPac: 'P-DEMO4', plano: null, meta: 1600, metaProt: 110, enviado: {},
    nutri: ['P-DEMO4', 'P-DEM11', 'P-DEMO7', 'P-DEMO2', 'P-DEMO1', 'P-DEM12'],
    adesao: { 'P-DEMO4': [21, 62, '{d:-5}'], 'P-DEM11': [80, 91, 'hoje'], 'P-DEMO7': [82, 75, 'hoje'], 'P-DEMO2': [91, 96, 'hoje'], 'P-DEMO1': [0, 0, '{d:-212}'], 'P-DEM12': [58, 70, 'ontem'] },
    evolucoesNutri: [['P-DEM11', '{d:-7}', 'Primeira consulta de nutrição. Trabalha à noite; plano com jantar leve.']],
    // Maria Clara · psicologia
    humor: { 'P-DEMO3': [1, 1, 0, 1, 2, 1, 1], 'P-DEM12': [2, 1, 1, 1, 2, 1, 1], 'P-DEMO7': [3, 3, 2, 3, 4, 3, 3], 'P-DEMO5': [2, 2, 3, 2, 2, 3, 2], 'P-DEMO2': [4, 3, 4, 4, 3, 4, 4] },
    sessoes: [{ id: 1, hora: '11:00', pac: 'P-DEMO3', tipo: 'presencial', st: 'agendada' }, { id: 2, hora: '16:00', pac: 'P-DEM11', tipo: 'on-line', st: 'agendada' }, { id: 3, hora: '{h:-80}', pac: 'P-DEM12', tipo: 'presencial', st: 'realizada' }],
    prontuario: { 'P-DEMO3': [['{d:-9}', 'Relata comer à noite quando ansiosa. Combinado registro de fome no app.']], 'P-DEM12': [['{d:0}', 'Sessão de acolhimento; objetivos do acompanhamento definidos.']] },
    escalas: ['Escala de humor', 'Escala de ansiedade', 'Escala de compulsão alimentar'],
    respostas: [['P-DEMO3', 'Escala de compulsão alimentar', '{d:-8}', 21, 'acima do ponto de corte definido pela clínica'], ['P-DEMO3', 'Escala de humor', '{d:-8}', 12, 'dentro do esperado'], ['P-DEM12', 'Escala de ansiedade', '{d:-3}', 9, 'dentro do esperado'], ['P-DEMO7', 'Escala de humor', '{d:-12}', 6, 'dentro do esperado']],
    enviadas: [['P-DEM11', 'Escala de compulsão alimentar', 'enviada hoje']],
    // Thaís e Eduarda · enfermagem
    prescricoes: [{ id: 1, pac: 'P-DEMO9', med: 'Medicação semanal (exemplo)', un: '5', ml: '0,05', freq: 'semanal · quinta, 08:00', st: 'pendente', marcas: [0, 0, 0] },
      { id: 2, pac: 'P-DEM12', med: 'Medicação semanal (exemplo)', un: '10', ml: '0,10', freq: 'semanal · segunda, 07:00', st: 'pendente', marcas: [0, 0, 0] },
      { id: 3, pac: 'P-DEMO7', med: 'Medicação semanal (exemplo)', un: '10', ml: '0,10', freq: 'semanal · quinta, 08:00', st: 'conferida', por: 'Thaís · {d:-5}', marcas: [1, 1, 1] }],
    alertas: [{ id: 1, pac: 'P-DEMO5', txt: 'Náusea forte 2 dias depois da aplicação', quando: 'hoje {h:-98}', st: 'aberto' },
      { id: 2, pac: 'P-DEM12', txt: 'Perda de 2,4 kg em 7 dias', quando: 'ontem 18:10', st: 'aberto' },
      { id: 3, pac: 'P-DEMO7', txt: 'Enjoo leve depois da aplicação', quando: '{d:-12}', st: 'resolvido', nota: 'Orientada a comer em porções menores.' }],
    sinais: [['P-DEMO5', '{d:0} {h:-45}', '132/86', 78, 104, 'Eduarda'], ['P-DEMO7', '{d:-5} 10:40', '118/76', 72, 92, 'Thaís']],
    locais: ['Abdômen, lado esquerdo', 'Abdômen, lado direito', 'Abdômen inferior esquerdo', 'Abdômen inferior direito', 'Coxa esquerda', 'Coxa direita', 'Braço esquerdo', 'Braço direito'],
    rodizio: { 'P-DEMO7': ['Abdômen, lado esquerdo', 'Abdômen, lado direito', 'Coxa esquerda'], 'P-DEMO5': ['Abdômen, lado direito', 'Abdômen, lado direito', 'Coxa direita'], 'P-DEMO2': ['Coxa direita', 'Coxa esquerda', 'Abdômen, lado esquerdo'] },
    lotes: [{ lote: 'L2309A', val: '{a:+23}', dias: 23, qtd: 3 }, { lote: 'L2310B', val: '{a:+130}', dias: 130, qtd: 1 }],
    aplicacoes: [{ id: 1, hora: '{h:-65}', pac: 'P-DEMO2', st: 'feita', local: 'Coxa direita', lote: 'L2309A' }, { id: 2, hora: '10:30', pac: 'P-DEMO7', st: 'agendada' }, { id: 3, hora: '14:00', pac: 'P-DEMO5', st: 'agendada' }],
    bio: [{ id: 1, hora: '{h:-50}', pac: 'P-DEMO5', st: 'importada', v: '101,2 kg · 39,8% gordura' }, { id: 2, hora: '09:00', pac: 'P-DEMO9', st: 'agendada' }, { id: 3, hora: '15:30', pac: 'P-DEM11', st: 'agendada' }],
    // Emanuele · financeiro
    receber: [{ id: 1, pac: 'P-DEMO7', desc: 'Programa · parcela 2/3', valor: 650, venc: '{d:+7}', st: 'aberto' }, { id: 2, pac: 'P-DEMO3', desc: 'Psicologia · {m:0}', valor: 650, venc: '{d:-8}', st: 'atraso' },
      { id: 3, pac: 'P-DEMO8', desc: 'Retorno', valor: 650, venc: '{d:-15}', st: 'atraso' }, { id: 4, pac: 'P-DEMO2', desc: 'Programa · parcela 3/3', valor: 650, venc: '{d:-3}', st: 'pago' },
      { id: 5, pac: 'P-DEM11', desc: 'Primeira consulta de nutrição', valor: 380, venc: '{d:+4}', st: 'aberto' }, { id: 6, pac: 'P-DEMO9', desc: 'Primeira consulta', valor: 450, venc: '{d:0}', st: 'aberto' }],
    recebidoMes: 48250,
    pagar: [{ id: 1, desc: 'Aluguel', cat: 'Estrutura', valor: 8500, venc: '{d:+2}', st: 'aberto' }, { id: 2, desc: 'Medicação (fornecedor)', cat: 'Medicação', valor: 12400, venc: '{d:+7}', st: 'aberto' },
      { id: 3, desc: 'Energia', cat: 'Estrutura', valor: 1150, venc: '{d:+5}', st: 'aberto' }, { id: 4, desc: 'Material de enfermagem', cat: 'Materiais', valor: 900, venc: '{d:-1}', st: 'pago' },
      { id: 5, desc: 'Equipe (folha)', cat: 'Pessoal', valor: 28000, venc: '{d:+23}', st: 'aberto' }],
    proxPagar: 6,
    repasse: [{ prof: 'Dr. André', atend: 64, prod: 38400, regra: 1, st: 'aberto' }, { prof: 'Felipe', atend: 52, prod: 19760, regra: .5, st: 'aberto' },
      { prof: 'Maria Clara', atend: 36, prod: 23400, regra: .6, st: 'aberto' }, { prof: 'Enfermagem', atend: 118, prod: 11800, regra: .3, st: 'aberto' }],
    // Elenice · recepção
    chegada: {}, // preenchido abaixo, pela agenda de hoje
    confirmar: [{ id: 1, pac: 'P-DEMO4', hora: '{ws:u+1} 10:00', prof: 'Felipe', st: 'pendente' }, { id: 2, pac: 'P-DEM11', hora: '{ws:u+1} 09:30', prof: 'Felipe', st: 'pendente' },
      { id: 3, pac: 'P-DEMO8', hora: '{ws:u+2} 12:00', prof: 'Dr. André', st: 'pendente' }, { id: 4, pac: 'P-DEM12', hora: '{ws:u+1} 14:00', prof: 'Dr. André', st: 'confirmada' }],
    fila: [{ id: 1, pac: 'P-DEM10', pref: 'manhãs', prof: 'Dr. André' }, { id: 2, pac: 'P-DEMO6', pref: 'qualquer horário', prof: 'Dr. André' }, { id: 3, pac: 'P-DEMO1', pref: 'sexta', prof: 'Felipe' }],
    aniversarios: [{ pac: 'P-DEMO2', data: 'hoje', idade: 30, st: '' }, { pac: 'P-DEMO5', data: '{wl:+2}, {d:+2}', idade: 53, st: '' }, { pac: 'P-DEM12', data: '{wl:+4}, {d:+4}', idade: 51, st: '' }],
    boasVindas: [{ pac: 'P-DEMO9', hora: 'hoje 09:00', st: '' }, { pac: 'P-DEMO6', hora: '{ws:u+3} 09:00', st: '' }]
  };
  F.plano = F.modelos[0].ref.map(function (r) { return r.slice(); });
  // recepção de hoje: a partir da agenda ({wl:0}, {d:0})
  // A recepção segue a hora real: cada consulta começa uns 25 minutos depois do horário marcado (agenda atrasada de exemplo).
  var DT = A.datas;
  function agoraHM() { return DT.hm(DT.agora()); }
  function hmDe(min) { return DT.hm(new Date(2000, 0, 1, 0, min)); }
  (function () {
    var n = P.SEM.hoje === P.REF ? DT.agora().getHours() * 60 + DT.agora().getMinutes() : -1;
    P.E.eventos.filter(function (e) { return e.dia === P.REF; }).forEach(function (e) {
      var s0 = 8 * 60 + e.slot * 30;
      F.chegada[e.id] = n < 0 ? { st: 'aguardando' } : n >= s0 + 65 ? { st: 'finalizado', hora: hmDe(s0 - 8) } : n >= s0 + 25 ? { st: 'atendimento', hora: hmDe(s0 - 6) } : n >= s0 - 25 ? { st: 'chegou', hora: hmDe(Math.min(s0 - 2, n)) } : { st: 'aguardando' };
    });
  })();
  function minutos(h) { var a = agoraHM().split(':'), b = h.split(':'); return (a[0] * 60 + +a[1]) - (b[0] * 60 + +b[1]); }

  function totais() {
    var k = 0, p = 0; F.plano.forEach(function (r) { r.forEach(function (i) { k += F.alimentos[i][1]; p += F.alimentos[i][2]; }); }); return [k, p];
  }

  // ======================= FELIPE · NUTRIÇÃO =======================
  T['prof-felipe'] = function () {
    var semReg = F.nutri.filter(function (id) { return F.adesao[id][0] < 40; });
    return cabProf('felipe', 'planos alimentares, adesão ao diário e consultas de nutrição.', A.item([113, 112, 134]) ) +
      '<div class="kpis">' + kpi('Em acompanhamento', F.nutri.length, 'com plano ativo', '') + kpi('Registraram hoje', '4', 'pelo menos 1 refeição', '') + kpi('Proteína média', '84%', 'da meta na semana', 'sobe') +
        kpi('Sem registrar', semReg.length, 'há 3 dias ou mais', 'desce') + kpi('Consultas hoje', '2', '10:00 e 15:30', '') + '</div>' +
      atalhos([['felipe-plano', 'prato', 'var(--c2)', 'Montar plano alimentar', 'a partir de um modelo, com metas', A.item([113, 112, 175])],
        ['felipe-adesao', 'evolucao', 'var(--c1)', 'Adesão dos pacientes', 'quem registra e quem parou', A.item([134, 135, 171])],
        ['felipe-modelos', 'revista', 'var(--c3)', 'Modelos de plano', F.modelos.length + ' modelos', A.item(175)],
        ['felipe-consulta', 'documento', 'var(--c4)', 'Registrar consulta', 'evolução de nutrição na ficha', A.item([64, 72])],
        ['agenda', 'calendario', 'var(--c5)', 'Agenda', 'minhas consultas da semana', A.item(50)],
        ['casos', 'chat', 'var(--c6)', 'Perguntas dos pacientes', '2 em nutrição', A.item([57, 58, 60])]]) +
      cartao(titulo('Precisam de atenção', A.item(135)) + lista(semReg.map(function (id) {
        return lin(A.bolha('alerta', 'var(--alerta)'), '<b>' + nome(id) + '</b> <span class="idp">' + id + '</span><div class="fraco" style="font-size:12px">registrou em ' + F.adesao[id][0] + '% dos dias · último registro ' + F.adesao[id][2] + '</div>', botao('Mandar mensagem', 'msg-pac', id, true));
      })));
  };
  T['felipe-plano'] = function () {
    var t = totais();
    return cab('Montar plano alimentar', 'O plano vai para o app do paciente ao lado do diário. Valores dos alimentos de exemplo.', A.item([113, 112, 175])) +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">' + campo('Paciente', '<select class="campo" data-f-mudar="plano-pac" style="min-width:240px">' + opcoesPac(F.nutri, F.planoPac) + '</select>') +
        campo('Começar do modelo ' + A.item(175), '<select class="campo" data-f-mudar="plano-modelo" style="min-width:240px"><option value="">escolha um modelo</option>' + F.modelos.map(function (m, i) { return '<option value="' + i + '">' + esc(m.nome) + '</option>'; }).join('') + '</select>') + '</div>' +
      '<div class="grade">' +
        '<div class="s8 pilha">' + F.refeicoes.map(function (r, ri) {
          return cartao(titulo(r) + lista(F.plano[ri].map(function (ai, pos) {
            var a = F.alimentos[ai];
            return lin('', a[0], '<span class="num fraco" style="font-size:12.5px">' + a[1] + ' kcal · ' + a[2] + ' g</span> <button type="button" data-f="plano-tirar" data-v="' + ri + ':' + pos + '" aria-label="Tirar" style="padding:4px 8px">✕</button>');
          })) + '<div style="display:flex;gap:8px;margin-top:8px"><select class="campo" data-ref="' + ri + '" style="flex:1"><option value="">acrescentar alimento</option>' + F.alimentos.map(function (a, i) { return '<option value="' + i + '">' + a[0] + '</option>'; }).join('') + '</select>' + botao('Acrescentar', 'plano-por', ri, true) + '</div>');
        }).join('') + '</div>' +
        '<div class="s4 pilha">' + cartao(titulo('Metas do dia', A.item(112)) +
          '<div><div style="display:flex;justify-content:space-between;font-size:13px"><b>Calorias</b><span class="num">' + br(t[0]) + ' / ' + br(F.meta) + ' kcal</span></div><div class="barra" style="--cor:' + (t[0] > F.meta * 1.05 ? 'var(--alerta)' : 'var(--c2)') + ';margin-top:5px"><i style="width:' + Math.min(100, Math.round(t[0] / F.meta * 100)) + '%"></i></div></div>' +
          '<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>Proteína</b><span class="num">' + t[1] + ' / ' + F.metaProt + ' g</span></div><div class="barra" style="--cor:var(--c1);margin-top:5px"><i style="width:' + Math.min(100, Math.round(t[1] / F.metaProt * 100)) + '%"></i></div></div>' +
          '<p class="nota" style="margin-top:10px">A soma é dos alimentos do plano (valores de exemplo). As metas são do nutricionista.</p>') +
          cartao('<div class="pilha">' + botao('Enviar ao app de ' + nome(F.planoPac).split(' ')[0], 'plano-enviar', '') + botao('Salvar como modelo', 'plano-modelo-salvar', '', true) +
            (F.enviado[F.planoPac] ? '<span class="status st-ok">enviado ao app ' + F.enviado[F.planoPac] + '</span>' : '') + '</div>') + '</div>' +
      '</div>';
  };
  T['felipe-adesao'] = function () {
    return cab('Adesão dos pacientes', 'O que os pacientes de nutrição registraram no app nos últimos 7 dias.', A.item([134, 135, 106, 112])) +
      cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Dias com registro</th><th>Proteína (meta)</th><th>Último registro</th><th></th></tr>' +
        F.nutri.map(function (id) {
          var a = F.adesao[id];
          return '<tr><td><b>' + nome(id) + '</b> <span class="idp">' + id + '</span></td><td style="min-width:140px"><div class="barra" style="--cor:' + (a[0] < 40 ? 'var(--alerta)' : 'var(--ok)') + '"><i style="width:' + a[0] + '%"></i></div><span class="nota">' + a[0] + '%</span></td>' +
            '<td class="num">' + a[1] + '%</td><td class="num">' + a[2] + '</td><td>' + botao('Mensagem', 'msg-pac', id, true) + '</td></tr>';
        }).join('') + '</table></div>') +
      cartao(titulo('Escala de compulsão alimentar', A.item(171)) + lista(F.respostas.filter(function (r) { return r[1] === 'Escala de compulsão alimentar'; }).map(function (r) {
        return lin('', '<b>' + nome(r[0]) + '</b> · ' + r[2] + ' · pontuação <span class="num">' + r[3] + '</span>', '<span class="status ' + (/acima/.test(r[4]) ? 'st-al' : 'st-ok') + '">' + r[4] + '</span>');
      })) + '<p class="nota" style="margin-top:8px">Respondida pelo paciente no app; o ponto de corte é o definido pela clínica. As escalas serão conferidas quanto a licença e regras de uso antes de implantar.</p>');
  };
  T['felipe-modelos'] = function () {
    return cab('Modelos de plano', 'A biblioteca do nutricionista para montar planos mais rápido.', A.item([175, 113])) +
      '<div class="grade">' + F.modelos.map(function (m, i) {
        var k = 0, p = 0; m.ref.forEach(function (r) { r.forEach(function (a) { k += F.alimentos[a][1]; p += F.alimentos[a][2]; }); });
        return cartao('<span class="rotulo">Modelo</span><h3 style="font-size:16px;margin:4px 0">' + esc(m.nome) + '</h3><p class="mudo" style="font-size:13px">' + br(k) + ' kcal · ' + p + ' g de proteína · ' + m.ref.length + ' refeições</p>' +
          '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' + botao('Usar num plano', 'modelo-usar', i) + botao('Duplicar', 'modelo-duplicar', i, true) + '</div>', 's4');
      }).join('') + '</div>';
  };
  T['felipe-consulta'] = function () {
    return cab('Registrar consulta de nutrição', 'A evolução entra na ficha do paciente, com as medidas da balança.', A.item([64, 65, 72])) +
      '<div class="duas">' + cartao(titulo('Nova evolução') + '<form data-f-form="nutri-evolucao" class="pilha">' +
        campo('Paciente', '<select class="campo" name="pac">' + opcoesPac(F.nutri, 'P-DEMO4') + '</select>') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campo('Peso (kg)', '<input class="campo" name="peso" inputmode="decimal" value="93,4">') + campo('Cintura (cm)', '<input class="campo" name="cintura" inputmode="decimal" value="102">') + '</div>' +
        campo('Recordatório e conduta', '<textarea class="campo" name="texto" placeholder="O que comeu ontem; o que muda no plano"></textarea>') +
        '<button class="botao" type="submit">Salvar na ficha</button></form>') +
      cartao(titulo('Evoluções registradas', A.item(65)) + lista(F.evolucoesNutri.map(function (e) { return lin('<span class="num">' + e[1] + '</span>', '<b>' + nome(e[0]) + '</b><div class="mudo" style="font-size:13px">' + e[2] + '</div>'); }))) + '</div>';
  };

  // ======================= MARIA CLARA · PSICOLOGIA =======================
  var HUMOR = ['😞', '😕', '😐', '🙂', '😄'];
  T['prof-mariaclara'] = function () {
    var baixo = Object.keys(F.humor).filter(function (id) { return F.humor[id].filter(function (v) { return v <= 1; }).length >= 3; });
    return cabProf('mariaclara', 'sessões, humor dos pacientes, prontuário com sigilo e questionários.', A.item([117, 171, 172])) +
      '<div class="kpis">' + kpi('Sessões hoje', F.sessoes.filter(function (s) { return s.st !== 'realizada'; }).length, 'a fazer', '') + kpi('Humor baixo', baixo.length, '3 dias ou mais', 'desce') +
        kpi('Questionários', F.enviadas.length, 'aguardando resposta', '') + kpi('Notas sinalizadas', '1', 'nota de humor', '') + kpi('Pacientes', Object.keys(F.humor).length, 'em acompanhamento', '') + '</div>' +
      atalhos([['mc-sessoes', 'calendario', 'var(--c6)', 'Sessões', 'agenda de hoje e registro', A.item([50, 172])],
        ['mc-humor', 'humor', 'var(--c4)', 'Humor dos pacientes', 'última semana', A.item(117)],
        ['mc-prontuario', 'cadeado', 'var(--c1)', 'Prontuário de psicologia', 'só você vê as anotações', A.item(172)],
        ['mc-questionarios', 'documento', 'var(--c3)', 'Questionários', 'enviar e ver resultados', A.item(171)]]);
  };
  T['mc-humor'] = function () {
    var dias = ['qua', 'qui', 'sex', 'sáb', 'dom', 'seg', 'ter'];
    return cab('Humor dos pacientes', 'O humor que cada paciente registrou no app, dia a dia. É um registro do paciente, não uma avaliação.', A.item([117, 134])) +
      cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th>' + dias.map(function (d) { return '<th style="text-align:center">' + d + '</th>'; }).join('') + '<th>Atenção</th></tr>' +
        Object.keys(F.humor).map(function (id) {
          var h = F.humor[id], baixo = h.filter(function (v) { return v <= 1; }).length >= 3;
          return '<tr><td><b>' + nome(id) + '</b> <span class="idp">' + id + '</span></td>' + h.map(function (v) { return '<td style="text-align:center;font-size:20px;background:color-mix(in srgb,var(--c6) ' + (4 - v) * 8 + '%,transparent)">' + HUMOR[v] + '</td>'; }).join('') +
            '<td>' + (baixo ? '<span class="status st-al">humor baixo há 3+ dias</span>' : '<span class="fraco">—</span>') + '</td></tr>';
        }).join('') + '</table></div>') +
      cartao(titulo('Nota sinalizada', A.item(117)) + lin(A.bolha('alerta', 'var(--alerta)'), '<b>Paula Freitas</b> · ontem 22:14<div class="mudo" style="font-size:13px">"Dia difícil, comi demais de novo." (nota do app)</div>', botao('Mandar mensagem', 'msg-pac', 'P-DEMO3', true)));
  };
  T['mc-sessoes'] = function () {
    return cab('Sessões', 'Hoje, {wl:0}, {d:0}. Ao marcar como realizada, registre a evolução: ela vai para o prontuário com sigilo.', A.item([50, 172])) +
      cartao(lista(F.sessoes.map(function (s) {
        return lin('<span class="hora num">' + s.hora + '</span>', '<b>' + nome(s.pac) + '</b> <span class="idp">' + s.pac + '</span><div class="fraco" style="font-size:12px">' + s.tipo + '</div>',
          s.st === 'realizada' ? '<span class="status st-ok">realizada</span>' : (QUEM === 'mariaclara' ? botao('Marcar realizada', 'sessao-feita', s.id) : '<span class="status st-in">agendada</span>'));
      }))) + '<p class="nota">' + A.ic('cadeado') + ' A evolução da sessão só é lida pela psicóloga ' + A.item(172) + '. Para o resto da equipe aparece "sessão realizada".</p>';
  };
  T['mc-prontuario'] = function () {
    var ids = Object.keys(F.prontuario);
    if (QUEM !== 'mariaclara') {
      return cab('Prontuário de psicologia', 'Conteúdo restrito à psicóloga (exigência do Conselho de Psicologia).', A.item(172)) +
        cartao('<div class="linha-ic">' + A.bolha('cadeado', 'var(--c6)') + '<div class="meio"><b>Acesso restrito</b><div class="mudo" style="font-size:13px">Só a Maria Clara lê as anotações. Aqui aparece apenas que a sessão aconteceu.</div></div></div>') +
        cartao(lista(ids.map(function (id) { return lin('', '<b>' + nome(id) + '</b> <span class="idp">' + id + '</span>', '<span class="status st-ok">sessão realizada · ' + F.prontuario[id][F.prontuario[id].length - 1][0] + '</span>'); })));
    }
    return cab('Prontuário de psicologia', 'Só você vê estas anotações. A equipe vê apenas "sessão realizada".', A.item(172)) +
      '<div class="grade">' + ids.map(function (id) {
        return cartao(titulo(nome(id) + ' <span class="idp">' + id + '</span>', A.ic('cadeado')) + lista(F.prontuario[id].map(function (n) { return lin('<span class="num">' + n[0] + '</span>', '<div style="font-size:13.5px">' + n[1] + '</div>'); })) +
          '<div style="margin-top:10px">' + botao('Nova anotação', 'pront-nova', id, true) + '</div>', 's6');
      }).join('') + '</div>';
  };
  T['mc-questionarios'] = function () {
    return cab('Questionários', 'Escalas respondidas pelo paciente no app. Elas serão conferidas quanto a licença e regras de uso antes de implantar.', A.item(171)) +
      '<div class="duas">' + cartao(titulo('Enviar questionário') + '<form data-f-form="enviar-escala" class="pilha">' +
          campo('Paciente', '<select class="campo" name="pac">' + opcoesPac(Object.keys(F.humor).concat(['P-DEM11']), 'P-DEMO7') + '</select>') +
          campo('Escala', '<select class="campo" name="escala">' + F.escalas.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select>') +
          '<button class="botao" type="submit">Enviar ao app</button></form>' +
          '<div style="margin-top:12px">' + lista(F.enviadas.map(function (e) { return lin('', '<b>' + nome(e[0]) + '</b> · ' + e[1], '<span class="status st-in">' + e[2] + '</span>'); })) + '</div>') +
        cartao(titulo('Resultados') + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Escala</th><th>Data</th><th>Pontos</th><th></th></tr>' +
          F.respostas.map(function (r) { return '<tr><td><b>' + nome(r[0]) + '</b></td><td>' + r[1] + '</td><td class="num">' + r[2] + '</td><td class="num">' + r[3] + '</td><td><span class="status ' + (/acima/.test(r[4]) ? 'st-al' : 'st-ok') + '">' + r[4] + '</span></td></tr>'; }).join('') +
          '</table></div><p class="nota" style="margin-top:8px">A pontuação não é diagnóstico; a interpretação é da psicóloga.</p>') + '</div>';
  };

  // ======================= THAÍS · ENFERMEIRA =======================
  T['prof-thais'] = function () {
    var pend = F.prescricoes.filter(function (p) { return p.st === 'pendente'; }).length, al = F.alertas.filter(function (a) { return a.st === 'aberto'; }).length;
    return cabProf('thais', 'confere as prescrições da picadinha, cuida dos alertas de sintomas e dos sinais vitais.', A.item([125, 129, 173])) +
      '<div class="kpis">' + kpi('A conferir', pend, 'prescrições novas', pend ? 'desce' : 'sobe') + kpi('Alertas abertos', al, 'sintomas do app', al ? 'desce' : 'sobe') + kpi('Aplicações hoje', F.aplicacoes.length, 'na clínica', '') +
        kpi('Rodízio fora do padrão', '1', 'mesmo local 2 vezes', '') + kpi('Casos de enfermagem', '2', '1 atrasado', 'desce') + '</div>' +
      atalhos([['thais-conferir', 'escudo', 'var(--c1)', 'Conferir prescrições', pend + ' pendentes', A.item([124, 125])],
        ['thais-alertas', 'alerta', 'var(--perigo)', 'Alertas de sintomas', al + ' abertos', A.item([128, 129])],
        ['sinais', 'atividade', 'var(--c3)', 'Sinais vitais', 'registrar e ver histórico', A.item(173)],
        ['thais-rodizio', 'seringa', 'var(--c4)', 'Rodízio dos locais', 'onde cada paciente aplicou', A.item(127)],
        ['edu-estoque', 'pilula', 'var(--c5)', 'Estoque e lotes', 'validade dos frascos', A.item([91, 174])],
        ['casos', 'chat', 'var(--c6)', 'Casos de enfermagem', '1 atrasado', A.item([62, 61])]]);
  };
  T['thais-conferir'] = function () {
    var CHK = ['Unidades conferem com a receita do Dr. André', 'Volume em ml confere com a receita', 'Paciente orientado sobre aplicação e rodízio'];
    return cab('Conferir prescrições', 'A prescrição só aparece no app depois de conferida. O sistema não calcula dose: mostra o que o médico prescreveu.', A.item([124, 125])) +
      '<div class="grade">' + F.prescricoes.map(function (p) {
        var ok = p.marcas.every(Boolean);
        return cartao(titulo(nome(p.pac) + ' <span class="idp">' + p.pac + '</span>', p.st === 'conferida' ? '<span class="status st-ok">conferida · ' + p.por + '</span>' : p.st === 'devolvida' ? '<span class="status st-al">devolvida ao Dr. André</span>' : '<span class="status st-in">a conferir</span>') +
          '<p class="mudo" style="font-size:13px">' + p.med + ' · ' + p.freq + ' · prescrita pelo Dr. André</p>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0"><div class="caso"><span class="fraco" style="font-size:12px">Na seringa</span><span class="num">' + p.un + ' un.</span></div><div class="caso"><span class="fraco" style="font-size:12px">Volume</span><span class="num">' + p.ml + ' ml</span></div></div>' +
          (p.st === 'pendente' ? '<div class="pilha">' + CHK.map(function (c, i) { return '<label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" data-f-marca="' + p.id + ':' + i + '"' + (p.marcas[i] ? ' checked' : '') + '> ' + c + '</label>'; }).join('') + '</div>' +
            '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="botao" data-f="conferir" data-v="' + p.id + '" style="height:34px;padding:0 12px;font-size:12.5px' + (ok ? '' : ';opacity:.45;pointer-events:none') + '">Conferir e liberar no app</button>' + botao('Devolver ao Dr. André', 'devolver', p.id, true) + '</div>' : ''), 's4');
      }).join('') + '</div>';
  };
  T['thais-alertas'] = function () {
    return cab('Alertas de sintomas', 'Sintomas marcados pela clínica como importantes chegam aqui na hora.', A.item([128, 129, 135])) +
      cartao(lista(F.alertas.map(function (a) {
        var stt = a.st === 'aberto' ? '<span class="status st-pe">aberto</span>' : a.st === 'medico' ? '<span class="status st-al">com o Dr. André</span>' : '<span class="status st-ok">resolvido</span>';
        return lin(A.bolha('alerta', a.st === 'aberto' ? 'var(--perigo)' : 'var(--texto-3)'), '<b>' + nome(a.pac) + '</b> <span class="idp">' + a.pac + '</span> · ' + a.quando + '<div class="mudo" style="font-size:13px">' + a.txt + '</div>' + (a.nota ? '<div class="fraco" style="font-size:12px">Registro: ' + a.nota + '</div>' : ''),
          stt + (a.st === 'aberto' ? ' ' + botao('Liguei e orientei', 'alerta-ok', a.id, true) + ' ' + botao('Passar ao Dr. André', 'alerta-medico', a.id, true) : ''));
      }))) + '<p class="nota">A orientação segue o protocolo da clínica. O sistema não avalia sintomas.</p>';
  };
  T['sinais'] = function () {
    return cab('Sinais vitais', 'Registrados pela enfermagem na ficha. O limite de alerta é o definido pela clínica (exemplo: pressão a partir de 140/90).', A.item([173, 64])) +
      '<div class="duas">' + cartao(titulo('Registrar') + '<form data-f-form="sinais" class="pilha">' +
          campo('Paciente', '<select class="campo" name="pac">' + opcoesPac(['P-DEMO9', 'P-DEMO7', 'P-DEMO5', 'P-DEM12', 'P-DEM11'], 'P-DEMO9') + '</select>') +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' + campo('Pressão', '<input class="campo" name="pa" value="124/82">') + campo('Freq. cardíaca', '<input class="campo" name="fc" inputmode="numeric" value="76">') + campo('Glicemia', '<input class="campo" name="gl" inputmode="numeric" value="98">') + '</div>' +
          '<button class="botao" type="submit">Salvar na ficha</button></form>') +
        cartao(titulo('Histórico', A.item(173)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Quando</th><th>Pressão</th><th>FC</th><th>Glicemia</th><th>Quem</th></tr>' +
          F.sinais.map(function (s) {
            var pa = String(s[2]).split('/'), alto = +pa[0] >= 140 || +pa[1] >= 90;
            return '<tr><td><b>' + nome(s[0]) + '</b></td><td class="num">' + s[1] + '</td><td class="num">' + esc(s[2]) + (alto ? ' <span class="status st-al">acima do limite da clínica · avisar o médico</span>' : '') + '</td><td class="num">' + esc(s[3]) + '</td><td class="num">' + esc(s[4]) + '</td><td>' + s[5] + '</td></tr>';
          }).join('') + '</table></div>') + '</div>';
  };
  T['thais-rodizio'] = function () {
    return cab('Rodízio dos locais', 'Os 3 últimos locais de aplicação de cada paciente, do app e da clínica.', A.item([127, 90])) +
      cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>Última</th><th>Penúltima</th><th>Antepenúltima</th><th></th></tr>' +
        Object.keys(F.rodizio).map(function (id) {
          var r = F.rodizio[id], rep = r[0] === r[1];
          return '<tr><td><b>' + nome(id) + '</b></td><td>' + r.join('</td><td>') + '</td><td>' + (rep ? '<span class="status st-al">mesmo local 2 vezes</span> ' + botao('Orientar', 'msg-pac', id, true) : '<span class="status st-ok">ok</span>') + '</td></tr>';
        }).join('') + '</table></div>');
  };

  // ======================= EDUARDA · TÉCNICA DE ENFERMAGEM =======================
  function estoqueTotal() { return F.lotes.reduce(function (s, l) { return s + l.qtd; }, 0); }
  // Para o erp.js (agenda, financeiro e estoque completos), carregado depois deste arquivo.
  P.F = F; P.estoqueTotal = estoqueTotal; P.reais = reais;
  T['prof-eduarda'] = function () {
    var feitas = F.aplicacoes.filter(function (a) { return a.st === 'feita'; }).length;
    return cabProf('eduarda', 'aplicações, bioimpedância, sinais vitais e estoque.', A.item([90, 72, 173, 174])) +
      '<div class="kpis">' + kpi('Aplicações hoje', feitas + ' de ' + F.aplicacoes.length, 'registradas', '') + kpi('Bioimpedâncias', F.bio.filter(function (b) { return b.st === 'importada'; }).length + ' de ' + F.bio.length, 'importadas', '') +
        kpi('Frascos', estoqueTotal(), 'mínimo 6', estoqueTotal() < 6 ? 'desce' : 'sobe') + kpi('Lote perto de vencer', '1', 'em 23 dias', 'desce') + kpi('Sinais vitais', '2', 'primeiras consultas', '') + '</div>' +
      atalhos([['edu-aplicacoes', 'seringa', 'var(--c1)', 'Aplicações de hoje', 'local, lote e validade', A.item([90, 127, 174])],
        ['edu-bio', 'balanca', 'var(--c3)', 'Bioimpedância', 'importar da balança', A.item([72, 73, 119])],
        ['sinais', 'atividade', 'var(--c6)', 'Sinais vitais', 'pressão, frequência e glicemia', A.item(173)],
        ['edu-estoque', 'pilula', 'var(--c5)', 'Estoque e lotes', 'entrada e validade', A.item([91, 174])]]);
  };
  T['edu-aplicacoes'] = function () {
    return cab('Aplicações de hoje', 'A instrução é a conferida pela Thaís. O sistema não calcula dose. Cada aplicação guarda o local, o lote e a validade.', A.item([90, 125, 127, 174])) +
      cartao(lista(F.aplicacoes.map(function (a) {
        return lin('<span class="hora num">' + a.hora + '</span>', '<b>' + nome(a.pac) + '</b> <span class="idp">' + a.pac + '</span>' + (a.st === 'feita' ? '<div class="fraco" style="font-size:12px">' + a.local + ' · lote ' + a.lote + '</div>' : '<div class="fraco" style="font-size:12px">última: ' + (F.rodizio[a.pac] ? F.rodizio[a.pac][0] : '—') + '</div>'),
          a.st === 'feita' ? '<span class="status st-ok">registrada</span>' : botao('Registrar aplicação', 'aplicar', a.id));
      })));
  };
  T['edu-bio'] = function () {
    return cab('Bioimpedância', 'A balança Anovator manda as medidas para a ficha, marcadas como "medido na clínica".', A.item([72, 73, 119])) +
      cartao(lista(F.bio.map(function (b) {
        return lin('<span class="hora num">' + b.hora + '</span>', '<b>' + nome(b.pac) + '</b> <span class="idp">' + b.pac + '</span>' + (b.v ? '<div class="fraco" style="font-size:12px">' + b.v + '</div>' : ''),
          b.st === 'importada' ? '<span class="status st-ok">na ficha</span>' : botao('Importar da balança', 'bio', b.id));
      })));
  };
  T['edu-estoque'] = function () {
    return cab('Estoque e lotes', 'Frascos por lote, com validade. Avisa quando o estoque fica baixo ou um lote está perto de vencer.', A.item([91, 174])) +
      '<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kpi('Frascos', estoqueTotal(), 'mínimo 6', estoqueTotal() < 6 ? 'desce' : 'sobe') + kpi('Lotes', F.lotes.length, 'em uso', '') + kpi('Perto de vencer', F.lotes.filter(function (l) { return l.dias <= 30; }).length, 'em até 30 dias', 'desce') + '</div>' +
      cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Lote</th><th>Validade</th><th>Frascos</th><th></th></tr>' +
        F.lotes.map(function (l) { return '<tr><td class="num"><b>' + esc(l.lote) + '</b></td><td class="num">' + esc(l.val) + '</td><td class="num">' + l.qtd + '</td><td>' + (l.dias <= 30 ? '<span class="status st-al">vence em ' + l.dias + ' dias · usar primeiro</span>' : '<span class="status st-ok">ok</span>') + '</td></tr>'; }).join('') +
        '</table></div><div style="margin-top:12px">' + botao('Registrar entrada', 'lote-novo', '') + '</div>');
  };

  // ======================= EMANUELE · ADMINISTRATIVO E FINANCEIRO =======================
  function soma(l, f) { return l.filter(f).reduce(function (s, x) { return s + x.valor; }, 0); }
  T['prof-emanuele'] = function () {
    var atraso = F.receber.filter(function (r) { return r.st === 'atraso'; });
    return cabProf('emanuele', 'cobranças, contas a pagar, fluxo de caixa, repasses e consumo de IA.', A.item([87, 178, 179, 146])) +
      '<div class="kpis">' + kpi('Recebido no mês', reais(F.recebidoMes), '+12% vs. {m:-1}', 'sobe') + kpi('A receber', reais(soma(F.receber, function (r) { return r.st === 'aberto'; })), 'em aberto', '') +
        kpi('Em atraso', reais(soma(atraso, function () { return true; })), atraso.length + ' pacientes', atraso.length ? 'desce' : 'sobe') + kpi('A pagar', reais(soma(F.pagar, function (p) { return p.st === 'aberto'; })), 'até {d:+23}', '') + kpi('Consumo de IA', '53%', 'do teto', '') + '</div>' +
      atalhos([['emanuele-receber', 'moeda', 'var(--c1)', 'Contas a receber', 'cobrar, lembrar e dar baixa', A.item([87, 88, 89])],
        ['emanuele-pagar', 'cartao', 'var(--c5)', 'Contas a pagar e caixa', 'despesas e saldo previsto', A.item(178)],
        ['emanuele-repasse', 'equipe', 'var(--c3)', 'Repasse por profissional', 'produção e repasse do mês', A.item(179)],
        ['consumo', 'evolucao', 'var(--c4)', 'Consumo de IA', 'teto, avisos e fatura', A.item([146, 147, 148])],
        ['financeiro', 'pilula', 'var(--c6)', 'Estoque', 'frascos e aplicações', A.item([90, 91])],
        ['funil', 'funil', 'var(--c2)', 'Funil', 'novos contatos e agendados', A.item(68)]]);
  };
  T['emanuele-receber'] = function () {
    var ST = { aberto: ['st-in', 'em aberto'], atraso: ['st-pe', 'em atraso'], pago: ['st-ok', 'pago'] };
    return cab('Contas a receber', 'Cobranças dos pacientes por Pix ou cartão, com lembrete antes e depois do vencimento. Valores de exemplo.', A.item([87, 88, 89, 198])) + (P.abasFin ? P.abasFin('emanuele-receber') : '') +
      '<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kpi('Recebido no mês', reais(F.recebidoMes), 'Pix, cartão e boleto', 'sobe') + kpi('Em aberto', reais(soma(F.receber, function (r) { return r.st === 'aberto'; })), '', '') + kpi('Em atraso', reais(soma(F.receber, function (r) { return r.st === 'atraso'; })), '', 'desce') + '</div>' +
      cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Paciente</th><th>O quê</th><th>Valor</th><th>Vence</th><th>Situação</th><th></th></tr>' +
        F.receber.map(function (r) {
          return '<tr><td><b>' + nome(r.pac) + '</b></td><td>' + r.desc + '</td><td class="num">' + reais(r.valor) + '</td><td class="num">' + r.venc + '</td><td><span class="status ' + ST[r.st][0] + '">' + ST[r.st][1] + '</span></td><td style="white-space:nowrap">' +
            (r.st === 'pago' ? (P.reciboBtn ? P.reciboBtn(r) : '') : botao('Link de pagamento', 'cobrar', r.id, true) + ' ' + botao('Lembrete', 'lembrar', r.id, true) + ' ' + botao('Recebido', 'recebido', r.id)) + '</td></tr>';
        }).join('') + '</table></div>');
  };
  T['emanuele-pagar'] = function () {
    var entra = F.recebidoMes + soma(F.receber, function (r) { return r.st !== 'pago'; }), sai = soma(F.pagar, function () { return true; }), max = Math.max(entra, sai);
    return cab('Contas a pagar e fluxo de caixa', 'Amplia o ERP: além de cobrar os pacientes, as despesas da clínica e o saldo previsto do mês. Valores de exemplo.', A.item(178)) + (P.abasFin ? P.abasFin('emanuele-pagar') : '') +
      '<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kpi('Entradas do mês', reais(entra), 'recebido + a receber', 'sobe') + kpi('Saídas do mês', reais(sai), 'pagas + a pagar', '') + kpi('Saldo previsto', reais(entra - sai), '{m:0}', entra - sai >= 0 ? 'sobe' : 'desce') + '</div>' +
      '<div class="grade">' +
        cartao(titulo('Despesas', A.item(178)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Despesa</th><th>Categoria</th><th>Valor</th><th>Vence</th><th></th></tr>' +
          F.pagar.map(function (p) { return '<tr><td><b>' + esc(p.desc) + '</b></td><td>' + esc(p.cat) + '</td><td class="num">' + reais(p.valor) + '</td><td class="num">' + esc(p.venc) + '</td><td>' + (p.st === 'pago' ? '<span class="status st-ok">paga</span>' : botao('Paga', 'pagar', p.id)) + '</td></tr>'; }).join('') +
          '</table></div><div style="margin-top:12px">' + botao('Nova despesa', 'despesa-nova', '') + '</div>', 's7') +
        cartao(titulo('Fluxo de caixa de {m:0}', A.item(178)) + '<div class="barras">' +
          '<div class="lin"><span>Entradas</span><span class="trilho"><i style="width:' + Math.round(entra / max * 100) + '%"></i></span><span class="val">' + reais(entra) + '</span></div>' +
          '<div class="lin"><span>Saídas</span><span class="trilho"><i style="width:' + Math.round(sai / max * 100) + '%;opacity:.55"></i></span><span class="val">' + reais(sai) + '</span></div></div>' +
          '<p class="nota" style="margin-top:10px">Entradas = recebido no mês + cobranças em aberto. Saídas = despesas pagas + a pagar.</p>', 's5') +
      '</div>';
  };
  T['emanuele-repasse'] = function () {
    return cab('Repasse por profissional', 'Produção do mês e repasse conforme a regra combinada com a clínica (regras de exemplo).', A.item(179)) + (P.abasFin ? P.abasFin('emanuele-repasse') : '') +
      cartao('<div class="rolar-x"><table class="tabela-larga"><tr><th>Profissional</th><th>Atendimentos</th><th>Produção</th><th>Regra</th><th>Repasse</th><th></th></tr>' +
        F.repasse.map(function (r, i) {
          return '<tr><td><b>' + r.prof + '</b></td><td class="num">' + r.atend + '</td><td class="num">' + reais(r.prod) + '</td><td>' + (r.regra === 1 ? 'sócio · sem repasse' : Math.round(r.regra * 100) + '% da produção') + '</td><td class="num">' + (r.regra === 1 ? '—' : reais(r.prod * r.regra)) + '</td><td>' +
            (r.regra === 1 ? '' : r.st === 'fechado' ? '<span class="status st-ok">fechado</span>' : botao('Fechar {m:0}', 'repasse', i)) + '</td></tr>';
        }).join('') + '</table></div>');
  };

  // ======================= ELENICE · CONCIERGE =======================
  function hojeEventos() { return P.E.eventos.filter(function (e) { return e.dia === P.REF; }).sort(function (a, b) { return a.slot - b.slot; }); }
  T['prof-elenice'] = function () {
    var ev = hojeEventos(), esperando = ev.filter(function (e) { return (F.chegada[e.id] || {}).st === 'chegou'; });
    return cabProf('elenice', 'recepção, confirmações, encaixes, aniversários e boas-vindas.', A.item([176, 6, 7, 177])) +
      '<div class="kpis">' + kpi('Agora', agoraHM(), '{wl:0}, {d:0}', '') + kpi('Esperando', esperando.length, esperando.length ? 'há ' + minutos(F.chegada[esperando[0].id].hora) + ' min' : 'ninguém', esperando.length ? 'desce' : 'sobe') +
        kpi('Sem confirmar', F.confirmar.filter(function (c) { return c.st === 'pendente'; }).length, '{wl:u+1} e {wl:u+2}', '') + kpi('Fila de espera', F.fila.length, 'para encaixes', '') + kpi('Aniversários', F.aniversarios.length, 'na semana', '') + '</div>' +
      atalhos([['ele-recepcao', 'pacientes', 'var(--c1)', 'Recepção', 'chegadas e tempo de espera', A.item(176)],
        ['ele-confirmar', 'whatsapp', 'var(--c3)', 'Confirmações', 'quem ainda não confirmou', A.item([6, 51])],
        ['ele-encaixe', 'calendario', 'var(--c5)', 'Encaixes e fila', 'horários livres e fila de espera', A.item([7, 51])],
        ['ele-aniversarios', 'trofeu', 'var(--c2)', 'Aniversários e boas-vindas', 'para cumprimentar e receber', A.item(177)],
        ['relacionamento', 'sino', 'var(--c6)', 'Avaliações', 'pesquisa e Google', A.item([39, 40])],
        ['conversas', 'chat', 'var(--c4)', 'Caixa de conversas', 'assumir e devolver à IA', A.item([84, 85])]]);
  };
  T['ele-recepcao'] = function () {
    var ST = { aguardando: ['st-in', 'a caminho'], chegou: ['st-al', 'esperando'], atendimento: ['st-ok', 'em atendimento'], finalizado: ['st-ok', 'finalizado'] };
    return cab('Recepção', 'Agora: ' + agoraHM() + '. Marque a chegada, chame para o atendimento e finalize. O tempo de espera conta a partir da chegada.', A.item(176)) +
      cartao(lista(hojeEventos().map(function (e) {
        var c = F.chegada[e.id] || { st: 'aguardando' }, p = P.PACIENTES.filter(function (x) { return x.nome === e.pac; })[0] || { id: '' };
        var espera = c.st === 'chegou' ? ' · <b style="color:' + (minutos(c.hora) > 15 ? 'var(--perigo)' : 'inherit') + '">esperando há ' + minutos(c.hora) + ' min</b>' : '';
        var acao = c.st === 'aguardando' ? botao('Chegou', 'chegou', e.id) : c.st === 'chegou' ? botao('Chamar', 'chamar', e.id) : c.st === 'atendimento' ? botao('Finalizar', 'finalizar', e.id, true) : '';
        return lin('<span class="hora num">' + P.HORAS[e.slot] + '</span>', '<b>' + e.pac + '</b> <span class="idp">' + p.id + '</span><div class="fraco" style="font-size:12px">' + e.tipo + ' · ' + e.prof + (c.hora ? ' · chegou ' + c.hora : '') + espera + '</div>', '<span class="status ' + ST[c.st][0] + '">' + ST[c.st][1] + '</span> ' + acao);
      })));
  };
  T['ele-confirmar'] = function () {
    return cab('Confirmações', 'Consultas de {wl:u+1} e {wl:u+2}. A mensagem sai pelo WhatsApp da clínica.', A.item([6, 51])) +
      cartao(lista(F.confirmar.map(function (c) {
        return lin('<span class="hora num">' + c.hora + '</span>', '<b>' + nome(c.pac) + '</b> <span class="idp">' + c.pac + '</span><div class="fraco" style="font-size:12px">' + c.prof + '</div>',
          c.st === 'confirmada' ? '<span class="status st-ok">confirmada</span>' : botao('Mandar mensagem', 'confirmar-msg', c.id, true) + ' ' + botao('Confirmou', 'confirmou', c.id) + ' <a class="botao botao-claro" href="#agenda" style="height:34px;padding:0 12px;font-size:12.5px;text-decoration:none">Remarcar</a>');
      })));
  };
  T['ele-encaixe'] = function () {
    var livres = [];
    var dE = P.diaDe(1);
    for (var s = 8; s < 18; s++) if (!P.E.eventos.some(function (e) { return e.dia === dE && e.slot === s; })) livres.push(s);
    return cab('Encaixes e fila de espera', 'Horários livres de ' + P.nomeDia(dE).toLowerCase() + ', à tarde. Ao encaixar, a consulta entra na agenda.', A.item([7, 51])) +
      '<div class="duas">' + cartao(titulo('Fila de espera', A.item(7)) + lista(F.fila.map(function (f) {
          return lin('', '<b>' + nome(f.pac) + '</b> <span class="idp">' + f.pac + '</span><div class="fraco" style="font-size:12px">prefere ' + f.pref + ' · ' + f.prof + '</div>', botao('Encaixar', 'encaixar', f.id));
        })) + (F.fila.length ? '' : '<p class="mudo">Fila vazia.</p>')) +
        cartao(titulo('Livres ' + P.nomeDia(P.diaDe(1)).split(',')[0].toLowerCase() + ' à tarde') + '<div class="opcoes">' + livres.map(function (s) { return '<span class="chip">' + P.HORAS[s] + '</span>'; }).join('') + '</div><a class="botao botao-claro" href="#agenda" style="margin-top:12px;text-decoration:none">Abrir a agenda</a>') + '</div>';
  };
  T['ele-aniversarios'] = function () {
    return cab('Aniversários e boas-vindas', 'Para cumprimentar os aniversariantes e receber quem vem pela primeira vez.', A.item(177)) +
      '<div class="duas">' + cartao(titulo('Aniversariantes da semana') + lista(F.aniversarios.map(function (a, i) {
          return lin(A.bolha('trofeu', 'var(--c2)'), '<b>' + nome(a.pac) + '</b> · ' + a.idade + ' anos<div class="fraco" style="font-size:12px">' + a.data + '</div>', a.st ? '<span class="status st-ok">parabéns enviado</span>' : botao('Mandar parabéns', 'parabens', i, true));
        }))) +
        cartao(titulo('Primeiras consultas') + lista(F.boasVindas.map(function (b, i) {
          return lin(A.bolha('perfil', 'var(--c1)'), '<b>' + nome(b.pac) + '</b><div class="fraco" style="font-size:12px">' + b.hora + ' · boas-vindas, tour e pré-consulta</div>', b.st ? '<span class="status st-ok">recebida</span>' : botao('Boas-vindas feitas', 'boasvindas', i, true));
        }))) + '</div>';
  };

  // ---------- menu "Meu painel" de cada função ----------
  P.meuMenu.felipe = [['prof-felipe', 'Meu dia', 'inicio'], ['felipe-plano', 'Montar plano alimentar', 'prato'], ['felipe-adesao', 'Adesão dos pacientes', 'evolucao'], ['felipe-modelos', 'Modelos de plano', 'revista'], ['felipe-consulta', 'Registrar consulta', 'documento']];
  P.meuMenu.mariaclara = [['prof-mariaclara', 'Meu dia', 'inicio'], ['mc-sessoes', 'Sessões', 'calendario'], ['mc-humor', 'Humor dos pacientes', 'humor'], ['mc-prontuario', 'Prontuário (sigilo)', 'cadeado'], ['mc-questionarios', 'Questionários', 'documento']];
  P.meuMenu.thais = [['prof-thais', 'Meu dia', 'inicio'], ['thais-conferir', 'Conferir prescrições', 'escudo'], ['thais-alertas', 'Alertas de sintomas', 'alerta'], ['sinais', 'Sinais vitais', 'atividade'], ['thais-rodizio', 'Rodízio', 'seringa'], ['edu-estoque', 'Estoque e lotes', 'pilula']];
  P.meuMenu.eduarda = [['prof-eduarda', 'Meu dia', 'inicio'], ['edu-aplicacoes', 'Aplicações', 'seringa'], ['edu-bio', 'Bioimpedância', 'balanca'], ['sinais', 'Sinais vitais', 'atividade'], ['edu-estoque', 'Estoque e lotes', 'pilula']];
  P.meuMenu.emanuele = [['prof-emanuele', 'Meu dia', 'inicio'], ['emanuele-receber', 'Contas a receber', 'moeda'], ['emanuele-pagar', 'Contas a pagar e caixa', 'cartao'], ['emanuele-repasse', 'Repasse', 'equipe']];
  P.meuMenu.elenice = [['prof-elenice', 'Meu dia', 'inicio'], ['ele-recepcao', 'Recepção', 'pacientes'], ['ele-confirmar', 'Confirmações', 'whatsapp'], ['ele-encaixe', 'Encaixes e fila', 'calendario'], ['ele-aniversarios', 'Aniversários e boas-vindas', 'trofeu']];

  // ---------- ações ----------
  function achar(l, id) { return l.filter(function (x) { return String(x.id) === String(id); })[0]; }
  var AC = {
    'msg-pac': function (v) {
      folha('Mensagem para ' + nome(v), campo('Texto', '<textarea class="campo" name="t">Oi, ' + nome(v).split(' ')[0] + '! Tudo bem? Senti sua falta nos registros. Posso ajudar em algo?</textarea>'),
        function () { P.avisoCurto('Mensagem enviada a ' + nome(v) + ' pelo WhatsApp da clínica (simulado).'); }, 'Enviar');
    },
    'plano-tirar': function (v) { var x = v.split(':'); F.plano[+x[0]].splice(+x[1], 1); },
    'plano-por': function (v, el) { var s = document.querySelector('select[data-ref="' + v + '"]'); if (s && s.value !== '') F.plano[+v].push(+s.value); else return P.avisoCurto('Escolha um alimento.'); },
    'plano-enviar': function () { F.enviado[F.planoPac] = 'hoje ' + agoraHM(); P.avisoCurto('Plano enviado ao app de ' + nome(F.planoPac) + '. Ele vê ao lado do diário.'); },
    'plano-modelo-salvar': function () {
      folha('Salvar como modelo', campo('Nome do modelo', '<input class="campo" name="n" value="Meu modelo ' + (F.modelos.length + 1) + '">'), function (d) {
        F.modelos.push({ nome: String(d.get('n') || 'Modelo').slice(0, 60), ref: F.plano.map(function (r) { return r.slice(); }) }); P.avisoCurto('Modelo salvo.'); P.render(true);
      });
    },
    'modelo-usar': function (v) { F.plano = F.modelos[+v].ref.map(function (r) { return r.slice(); }); location.hash = '#felipe-plano'; },
    'modelo-duplicar': function (v) { var m = F.modelos[+v]; F.modelos.push({ nome: m.nome + ' (cópia)', ref: m.ref.map(function (r) { return r.slice(); }) }); P.avisoCurto('Modelo duplicado.'); },
    'sessao-feita': function (v) {
      var s = achar(F.sessoes, v);
      folha('Sessão de ' + nome(s.pac), '<p class="nota">' + A.ic('cadeado') + ' A evolução fica no prontuário de psicologia e só a psicóloga lê ' + A.item(172) + '.</p>' + campo('Evolução da sessão', '<textarea class="campo" name="t" placeholder="Anotações da sessão"></textarea>'), function (d) {
        s.st = 'realizada'; var t = String(d.get('t') || '').trim();
        if (t) (F.prontuario[s.pac] = F.prontuario[s.pac] || []).push(['{d:0}', esc(t)]);
        P.avisoCurto('Sessão realizada. A equipe vê só "sessão realizada".'); P.render(true);
      }, 'Marcar realizada');
    },
    'pront-nova': function (v) {
      folha('Anotação · ' + nome(v), campo('Texto', '<textarea class="campo" name="t"></textarea>'), function (d) { var t = String(d.get('t') || '').trim(); if (!t) return false; F.prontuario[v].push(['{d:0}', esc(t)]); P.render(true); });
    },
    'conferir': function (v) { var p = achar(F.prescricoes, v); p.st = 'conferida'; p.por = 'Thaís · {d:0}'; P.avisoCurto('Conferida. A instrução aparece no app de ' + nome(p.pac) + '.'); },
    'devolver': function (v) {
      var p = achar(F.prescricoes, v);
      folha('Devolver ao Dr. André', campo('O que não confere', '<textarea class="campo" name="t" placeholder="Ex.: unidades diferentes da receita"></textarea>'), function () { p.st = 'devolvida'; P.avisoCurto('Devolvida ao Dr. André. Não aparece no app até ser corrigida.'); P.render(true); }, 'Devolver');
    },
    'alerta-ok': function (v) {
      var a = achar(F.alertas, v);
      folha('Registro do contato', campo('O que foi orientado', '<textarea class="campo" name="t" placeholder="Segundo o protocolo da clínica"></textarea>'), function (d) { a.st = 'resolvido'; a.nota = esc(String(d.get('t') || 'Contato feito.').slice(0, 300)); P.render(true); });
    },
    'alerta-medico': function (v) { achar(F.alertas, v).st = 'medico'; P.avisoCurto('Passado ao Dr. André com o histórico do paciente.'); },
    'aplicar': function (v) {
      var a = achar(F.aplicacoes, v);
      folha('Registrar aplicação · ' + nome(a.pac),
        '<p class="nota">Instrução conferida pela Thaís. O sistema não calcula dose.</p>' +
        campo('Local ' + A.item(127), '<select class="campo" name="local">' + F.locais.map(function (l) { return '<option' + (F.rodizio[a.pac] && F.rodizio[a.pac][0] === l ? ' disabled' : '') + '>' + l + '</option>'; }).join('') + '</select>') +
        campo('Lote ' + A.item(174), '<select class="campo" name="lote">' + F.lotes.filter(function (l) { return l.qtd > 0; }).map(function (l) { return '<option value="' + esc(l.lote) + '">' + esc(l.lote) + ' · validade ' + esc(l.val) + ' · ' + l.qtd + ' frasco(s)</option>'; }).join('') + '</select>'),
        function (d) {
          var lt = F.lotes.filter(function (l) { return l.lote === d.get('lote'); })[0]; if (!lt) return false;
          a.st = 'feita'; a.local = d.get('local'); a.lote = lt.lote; lt.qtd -= 1;
          (F.rodizio[a.pac] = F.rodizio[a.pac] || []).unshift(a.local); F.rodizio[a.pac] = F.rodizio[a.pac].slice(0, 3);
          var extra = P.aoAplicar ? P.aoAplicar(a.pac, lt.lote) : '';
          P.avisoCurto('Aplicação registrada: ' + a.local + ', lote ' + lt.lote + '. Estoque: ' + estoqueTotal() + ' frascos.' + (extra || '')); P.render(true);
        }, 'Registrar');
    },
    'bio': function (v) { var b = achar(F.bio, v); b.st = 'importada'; b.v = b.pac === 'P-DEMO9' ? '84,0 kg · 38,1% gordura' : '72,5 kg · 33,0% gordura'; P.avisoCurto('Medidas importadas da balança para a ficha.'); },
    'lote-novo': function () {
      folha('Entrada de frascos', '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campo('Lote', '<input class="campo" name="lote" value="L2311C">') + campo('Validade', '<input class="campo" name="val" value="{a:+199}">') + '</div>' + campo('Frascos', '<input class="campo" name="qtd" inputmode="numeric" value="10">'),
        function (d) { var q = parseInt(d.get('qtd'), 10); if (!(q > 0)) return false; F.lotes.push({ lote: String(d.get('lote')).slice(0, 20), val: String(d.get('val')).slice(0, 12), dias: 200, qtd: q }); P.avisoCurto('Entrada registrada: ' + q + ' frascos.'); P.render(true); });
    },
    'cobrar': function (v) { P.avisoCurto('Link de Pix e cartão enviado a ' + nome(achar(F.receber, v).pac) + ' pelo WhatsApp (simulado).'); },
    'lembrar': function (v) { P.avisoCurto('Lembrete de pagamento enviado a ' + nome(achar(F.receber, v).pac) + ' (simulado).'); },
    'recebido': function (v) { var r = achar(F.receber, v); r.st = 'pago'; r.forma = r.forma || 'Pix'; r.pagoEm = '{d:0}'; F.recebidoMes += r.valor; P.avisoCurto('Baixa feita: ' + reais(r.valor) + ' de ' + nome(r.pac) + '.'); },
    'pagar': function (v) { achar(F.pagar, v).st = 'pago'; },
    'despesa-nova': function () {
      folha('Nova despesa', campo('Despesa', '<input class="campo" name="desc" placeholder="Ex.: manutenção do ar">') + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campo('Valor (R$)', '<input class="campo" name="valor" inputmode="decimal" value="500">') + campo('Vence', '<input class="campo" name="venc" value="{d:+12}">') + '</div>' +
        campo('Categoria', '<select class="campo" name="cat"><option>Estrutura</option><option>Medicação</option><option>Materiais</option><option>Pessoal</option><option>Outros</option></select>'),
        function (d) { var v = parseFloat(String(d.get('valor')).replace('.', '').replace(',', '.')); var desc = String(d.get('desc') || '').trim(); if (!desc || !(v > 0)) return false;
          F.pagar.push({ id: F.proxPagar++, desc: desc.slice(0, 60), cat: d.get('cat'), valor: v, venc: String(d.get('venc')).slice(0, 10), st: 'aberto' }); P.avisoCurto('Despesa incluída no fluxo de caixa.'); P.render(true); });
    },
    'repasse': function (v) { F.repasse[+v].st = 'fechado'; P.avisoCurto('Repasse de {m:0} fechado para ' + F.repasse[+v].prof + '.'); },
    'chegou': function (v) { F.chegada[v] = { st: 'chegou', hora: agoraHM() }; P.avisoCurto('Chegada registrada às ' + agoraHM() + '.'); },
    'chamar': function (v) { F.chegada[v].st = 'atendimento'; },
    'finalizar': function (v) { F.chegada[v].st = 'finalizado'; },
    'confirmar-msg': function (v) { P.avisoCurto('Mensagem de confirmação enviada a ' + nome(achar(F.confirmar, v).pac) + ' (simulado).'); },
    'confirmou': function (v) { achar(F.confirmar, v).st = 'confirmada'; },
    'encaixar': function (v) {
      var f = achar(F.fila, v), livres = [];
      var quemAtende = f.prof === 'Felipe' ? 'Felipe' : 'Dr. André', dE = P.diaDe(1);
      for (var s = 8; s < 18; s++) {
        var teste = { id: 0, dia: dE, slot: s, pac: nome(f.pac), tipo: 'Retorno · 30 min', prof: quemAtende };
        if (P.conflito ? !P.conflito(dE, s, teste) : !P.E.eventos.some(function (e) { return e.dia === dE && e.slot === s; })) livres.push(s);
      }
      folha('Encaixar ' + nome(f.pac), campo('Horário (' + P.nomeDia(dE).toLowerCase() + ')', '<select class="campo" name="slot">' + livres.map(function (s) { return '<option value="' + s + '">' + P.HORAS[s] + '</option>'; }).join('') + '</select>'), function (d) {
        var s = +d.get('slot');
        P.E.eventos.push({ id: P.E.proxId++, dia: dE, slot: s, pac: nome(f.pac), tipo: 'Retorno · 30 min', prof: f.prof === 'Felipe' ? 'Felipe' : 'Dr. André' });
        F.fila = F.fila.filter(function (x) { return x !== f; });
        P.avisoCurto(nome(f.pac) + ' encaixada ' + P.nomeDia(dE).split(',')[0].toLowerCase() + ' às ' + P.HORAS[s] + '. Já está na agenda.'); P.render(true);
      }, 'Encaixar');
    },
    'parabens': function (v) { F.aniversarios[+v].st = 'ok'; P.avisoCurto('Mensagem de parabéns enviada (simulado).'); },
    'boasvindas': function (v) { F.boasVindas[+v].st = 'ok'; }
  };
  var SEM_RENDER = { 'msg-pac': 1, 'plano-modelo-salvar': 1, 'sessao-feita': 1, 'pront-nova': 1, 'devolver': 1, 'alerta-ok': 1, 'aplicar': 1, 'lote-novo': 1, 'despesa-nova': 1, 'encaixar': 1, 'cobrar': 1, 'lembrar': 1, 'confirmar-msg': 1, 'modelo-usar': 1 };
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-f]'); if (!el || !AC[el.dataset.f]) return;
    AC[el.dataset.f](el.dataset.v, el);
    if (!SEM_RENDER[el.dataset.f]) P.render(true);
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.fMarca) { var x = t.dataset.fMarca.split(':'), p = achar(F.prescricoes, x[0]); p.marcas[+x[1]] = t.checked ? 1 : 0; P.render(true); return; }
    if (t.dataset && t.dataset.fMudar === 'plano-pac') { F.planoPac = t.value; P.render(true); return; }
    if (t.dataset && t.dataset.fMudar === 'plano-modelo' && t.value !== '') { F.plano = F.modelos[+t.value].ref.map(function (r) { return r.slice(); }); P.avisoCurto('Plano começado do modelo "' + F.modelos[+t.value].nome + '".'); P.render(true); }
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('[data-f-form]'); if (!f) return; ev.preventDefault();
    var d = new FormData(f), tipo = f.dataset.fForm;
    if (tipo === 'nutri-evolucao') { var t = String(d.get('texto') || '').trim() || 'Consulta registrada.'; F.evolucoesNutri.unshift([d.get('pac'), '{d:0}', 'Peso ' + esc(d.get('peso')) + ' kg · cintura ' + esc(d.get('cintura')) + ' cm. ' + esc(t)]); P.avisoCurto('Evolução salva na ficha (nova versão).'); }
    if (tipo === 'enviar-escala') { F.enviadas.unshift([d.get('pac'), d.get('escala'), 'enviada agora']); P.avisoCurto('Questionário enviado ao app de ' + nome(d.get('pac')) + '.'); }
    if (tipo === 'sinais') { F.sinais.unshift([d.get('pac'), '{d:0} ' + agoraHM(), String(d.get('pa')).slice(0, 9), String(d.get('fc')).slice(0, 4), String(d.get('gl')).slice(0, 4), P.EQUIPE[QUEM === 'eduarda' ? 'eduarda' : 'thais'].nome]); P.avisoCurto('Sinais vitais salvos na ficha.'); }
    P.render(true);
  });
})();
