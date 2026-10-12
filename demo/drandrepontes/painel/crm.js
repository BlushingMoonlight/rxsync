/* CRM completo (itens 180 a 187): origem do contato, funil configurável, tarefas com prazo, histórico de interações
   (na Central do paciente), etiquetas e segmentos, modelos de mensagem, campanhas pelo WhatsApp e programa de indicação.
   Dados de exemplo fictícios; tudo funciona só na memória (recarregar volta ao começo). Texto digitado é sempre escapado.
   Campanhas: sempre com a opção SAIR, limite diário e o aviso do risco de bloqueio do número (item 186). */
(function () {
  'use strict';
  var P = window.PAINEL, A = P.A, T = P.TELAS, QUEM = P.QUEM;
  var cartao = P.cartao, titulo = P.titulo, cab = P.cab, kpi = P.kpi, lista = P.lista, lin = P.lin, esc = P.esc;
  function nome(id) { return P.pac(id).nome; }
  function primeiro(id) { return nome(id).split(' ')[0]; }
  function curto(k) { return P.EQUIPE[k].nome.replace('Dr. André Pontes Gonçalves', 'Dr. André'); }
  function botao(texto, acao, v, claro, extra) { return '<button type="button" class="botao' + (claro ? ' botao-claro' : '') + '" data-r="' + acao + '" data-v="' + (v == null ? '' : esc(v)) + '"' + (extra || '') + '>' + texto + '</button>'; }
  function peq(texto, acao, v, claro) { return botao(texto, acao, v, claro, ' style="height:34px;padding:0 12px;font-size:12.5px"'); }
  function opcoes(l, sel) { return l.map(function (x) { var v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join(''); }
  function campo(rot, html) { return '<label><span class="rotulo">' + rot + '</span>' + html + '</label>'; }
  function folha(tit, campos, aoSalvar, botaoTexto) {
    var f = document.createElement('div'); f.className = 'folha-fundo';
    f.innerHTML = '<form class="folha"><h2 style="font-size:20px">' + tit + '</h2>' + campos +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button type="button" class="botao botao-claro" data-fechar>Cancelar</button><button type="submit" class="botao">' + (botaoTexto || 'Salvar') + '</button></div></form>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-fechar')) f.remove(); });
    f.querySelector('form').addEventListener('submit', function (ev) { ev.preventDefault(); if (aoSalvar(new FormData(ev.target)) !== false) f.remove(); });
    var c = f.querySelector('input,textarea,select'); if (c) c.focus();
  }
  function linhaTempo(id, tipo, texto, det) { if (P.linhaPaciente) P.linhaPaciente(id).unshift(['13/10', 'agora', tipo, texto, det || curto(QUEM)]); }
  function dia(d) { var x = d.split('/'); return +x[1] * 100 + +x[0]; }
  var HOJE = dia('13/10');
  var IDS = P.PACIENTES.map(function (p) { return p.id; });

  // ---------- dados de exemplo ----------
  var ORIGENS = ['Instagram', 'Google', 'Indicação', 'Site', 'Outro'];
  // Contatos e pacientes do mês fora desta lista de exemplo (somados aos 12 contatos da demonstração).
  var BASE = { Instagram: [46, 8], Google: [29, 7], 'Indicação': [11, 6], Site: [10, 2], Outro: [5, 1] };
  var ORIGEM = { 'P-DEMO7': 'Instagram', 'P-DEMO5': 'Indicação', 'P-DEMO9': 'Instagram', 'P-DEMO4': 'Google', 'P-DEMO2': 'Indicação', 'P-DEMO3': 'Site',
    'P-DEMO6': 'Instagram', 'P-DEMO8': 'Google', 'P-DEMO1': 'Google', 'P-DEM10': 'Indicação', 'P-DEM11': 'Site', 'P-DEM12': 'Google' };
  var ETIQ = { 'P-DEMO7': ['Aplicação semanal', 'App ativo', 'Indicou alguém'], 'P-DEMO5': ['Aplicação semanal'], 'P-DEMO9': ['Primeira consulta'], 'P-DEMO4': ['Sumiu do app'],
    'P-DEMO2': ['Manutenção', 'Indicou alguém', 'App ativo'], 'P-DEMO3': ['Aniversário em outubro'], 'P-DEMO6': ['Orçamento enviado'], 'P-DEMO8': ['Manutenção', 'Sumiu do app'],
    'P-DEMO1': ['Sumiu do app', 'Indicou alguém'], 'P-DEM10': ['Orçamento enviado'], 'P-DEM11': ['Primeira consulta', 'Aniversário em outubro'], 'P-DEM12': ['Aplicação semanal', 'App ativo'] };
  var SAIU = { 'P-DEMO1': '02/06' };   // responderam SAIR: não recebem campanhas
  var VIROU = ['Agendado', 'Em tratamento', 'Retorno vencido', 'Inativo'];
  var BASE_FUNIL = P.FUNIL.slice();     // etapas que a agenda e o app usam: não somem nem mudam de nome nesta demonstração

  var R = {
    origemSel: '', funilEditar: false,
    tarefas: [
      { id: 1, t: 'Ligar para confirmar a primeira consulta', tipo: 'Ligar', pac: 'P-DEMO9', resp: 'elenice', prazo: '13/10', st: 'aberta' },
      { id: 2, t: 'Mandar orçamento do acompanhamento de 3 meses', tipo: 'Mandar orçamento', pac: 'P-DEM10', resp: 'emanuele', prazo: '13/10', st: 'aberta' },
      { id: 3, t: 'Lembrar o retorno vencido', tipo: 'Lembrar retorno', pac: 'P-DEMO8', resp: 'elenice', prazo: '10/10', st: 'aberta' },
      { id: 4, t: 'Conferir os exames enviados pelo app', tipo: 'Outro', pac: 'P-DEMO7', resp: 'andre', prazo: '14/10', st: 'aberta' },
      { id: 5, t: 'Ligar para saber como está a náusea', tipo: 'Ligar', pac: 'P-DEMO5', resp: 'thais', prazo: '13/10', st: 'aberta' },
      { id: 6, t: 'Enviar plano para quem trabalha à noite', tipo: 'Outro', pac: 'P-DEM11', resp: 'felipe', prazo: '15/10', st: 'aberta' },
      { id: 7, t: 'Reenviar o convite do app', tipo: 'Ligar', pac: 'P-DEM11', resp: 'elenice', prazo: '12/10', st: 'aberta' },
      { id: 8, t: 'Retomar o orçamento sem resposta', tipo: 'Mandar orçamento', pac: 'P-DEMO6', resp: 'emanuele', prazo: '16/10', st: 'aberta' },
      { id: 9, t: 'Agradecer a indicação do Lucas', tipo: 'Ligar', pac: 'P-DEMO2', resp: 'elenice', prazo: '11/10', st: 'feita' }],
    proxTarefa: 10, filtroTarefa: QUEM === 'andre' ? 'todas' : 'minhas',
    segmentos: [
      { nome: 'Sumiram do app', etiqueta: 'Sumiu do app', etapa: '', origem: '' },
      { nome: 'Orçamentos sem resposta', etiqueta: 'Orçamento enviado', etapa: 'Novo contato', origem: '' },
      { nome: 'Aniversariantes de outubro', etiqueta: 'Aniversário em outubro', etapa: '', origem: '' },
      { nome: 'Vieram do Instagram', etiqueta: '', etapa: '', origem: 'Instagram' }],
    filtro: { etiqueta: '', etapa: '', origem: '' }, etiqPac: 'P-DEMO7',
    modelos: [
      { nome: 'Retorno vencido', t: 'Oi, {nome}! Já passou o prazo do seu retorno com {profissional}. Quer que eu veja um horário para você?' },
      { nome: 'Orçamento', t: 'Oi, {nome}! Segue o orçamento do acompanhamento que conversamos. Qualquer dúvida, é só responder por aqui.' },
      { nome: 'Boas-vindas', t: 'Seja bem-vinda(o) à {clinica}, {nome}! Na sua primeira consulta, chegue 15 minutos antes.' },
      { nome: 'Convite para voltar', t: 'Oi, {nome}! Faz tempo que não nos vemos. Quando quiser retomar o acompanhamento, estamos aqui.' },
      { nome: 'Aniversário', t: 'Feliz aniversário, {nome}! Toda a equipe da {clinica} deseja um ano cheio de saúde.' },
      { nome: 'Agradecer indicação', t: '{nome}, muito obrigado pela indicação! Seu benefício já está separado aqui na clínica.' }],
    modeloSel: 0, modeloPac: 'P-DEMO8',
    camp: { seg: 0, modelo: 3, entendi: false },
    campanhas: [{ nome: 'Convite para voltar · Sumiram do app', data: '01/10', enviados: 24, responderam: 7, sairam: 1, st: 'concluída' }],
    beneficio: '1 bioimpedância grátis para quem indicou, depois que o indicado faz a primeira consulta.',
    indicacoes: [
      { id: 1, de: 'P-DEMO1', para: 'P-DEMO2', data: '20/03', st: 'beneficio' },
      { id: 2, de: 'P-DEMO7', para: 'P-DEMO5', data: '02/09', st: 'paciente' },
      { id: 3, de: 'P-DEMO2', para: 'P-DEM10', data: '09/10', st: 'contato' }],
    proxInd: 4
  };
  var ST_IND = { contato: ['Indicado em contato', 'st-in'], paciente: ['Virou paciente', 'st-al'], beneficio: ['Benefício entregue', 'st-ok'] };

  function etiquetas() { var t = {}; IDS.forEach(function (id) { (ETIQ[id] || []).forEach(function (e) { t[e] = 1; }); }); return Object.keys(t).sort(); }
  function noSegmento(s) {
    return P.PACIENTES.filter(function (p) {
      return (!s.etiqueta || (ETIQ[p.id] || []).indexOf(s.etiqueta) >= 0) && (!s.etapa || p.status === s.etapa) && (!s.origem || ORIGEM[p.id] === s.origem);
    });
  }
  function preencher(t, id) {
    var p = P.pac(id);
    return t.replace(/\{nome\}/g, primeiro(id)).replace(/\{profissional\}/g, p.prof === '—' ? 'a equipe' : p.prof).replace(/\{clinica\}/g, 'Clínica Evoluir');
  }
  function chipsEtiq(id, remover) {
    return (ETIQ[id] || []).map(function (e) { return '<span class="chip chip-etiqueta">' + esc(e) + (remover ? ' <button type="button" data-r="etiq-tirar" data-v="' + esc(e) + '" aria-label="Tirar etiqueta">✕</button>' : '') + '</span>'; }).join('');
  }

  // Peças usadas pela Central do paciente, pela Caixa de conversas e pela lista de pacientes.
  P.crm = {
    origem: function (id) { return ORIGEM[id] || '—'; },
    chips: function (id) {
      return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip">' + A.ic('link') + 'Origem: ' + esc(ORIGEM[id] || '—') + '</span>' + chipsEtiq(id) + (SAIU[id] ? '<span class="chip">saiu das campanhas</span>' : '') + '</div>';
    },
    etiquetas: function (id) { return chipsEtiq(id); },
    seletorModelo: function (id, alvo) {
      return '<label style="display:block"><span class="rotulo">Modelo de mensagem ' + A.item(185) + '</span><select class="campo" data-r-modelo="' + id + '"' + (alvo ? ' data-alvo="' + alvo + '"' : '') + '><option value="">Escrever do zero</option>' +
        R.modelos.map(function (m, i) { return '<option value="' + i + '">' + esc(m.nome) + '</option>'; }).join('') + '</select></label>';
    }
  };

  // ---------- 180 · Origem do contato ----------
  T['crm-origens'] = function () {
    var linhas = ORIGENS.map(function (o) {
      var meus = P.PACIENTES.filter(function (p) { return ORIGEM[p.id] === o; });
      var cont = BASE[o][0] + meus.length, pacs = BASE[o][1] + meus.filter(function (p) { return VIROU.indexOf(p.status) >= 0; }).length;
      return { o: o, cont: cont, pacs: pacs, taxa: cont ? Math.round(pacs / cont * 100) : 0 };
    });
    var tot = linhas.reduce(function (a, l) { return [a[0] + l.cont, a[1] + l.pacs]; }, [0, 0]);
    var max = Math.max.apply(null, linhas.map(function (l) { return l.cont; }));
    var lst = P.PACIENTES.filter(function (p) { return !R.origemSel || ORIGEM[p.id] === R.origemSel; });
    return cab('Origem dos contatos', 'De onde cada contato veio e quantos viraram pacientes. Outubro, dados de exemplo.', A.item(180)) +
      '<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + kpi('Contatos no mês', tot[0], 'todas as origens', '') + kpi('Viraram pacientes', tot[1], 'marcaram consulta', 'sobe') + kpi('Conversão', Math.round(tot[1] / tot[0] * 100) + '%', 'contato → paciente', '') + '</div>' +
      '<div class="grade">' +
        cartao(titulo('Por origem', A.item(180)) + '<div class="barras-origem">' + linhas.map(function (l) {
          return '<button type="button" class="barra-origem' + (R.origemSel === l.o ? ' sel' : '') + '" data-r="origem-sel" data-v="' + l.o + '"><span class="nome">' + l.o + '</span>' +
            '<span class="trilho"><i style="width:' + (l.cont / max * 100) + '%"></i><i class="pac" style="width:' + (l.pacs / max * 100) + '%"></i></span>' +
            '<span class="num">' + l.pacs + ' de ' + l.cont + ' · <b>' + l.taxa + '%</b></span></button>';
        }).join('') + '</div><p class="nota" style="margin-top:8px"><span class="ponto" style="background:color-mix(in srgb,var(--primaria) 30%,transparent)"></span> contatos · <span class="ponto" style="background:var(--primaria)"></span> viraram pacientes. Toque numa origem para filtrar a lista.</p>', 's7') +
        cartao(titulo('Como a origem é registrada', A.item([180, 14])) + lista([
          lin(A.bolha('ia', 'var(--c4)'), 'A IA pergunta "Como você conheceu a clínica?" no primeiro contato e guarda a resposta no ID.'),
          lin(A.bolha('link', 'var(--c2)'), 'Links do site e do Instagram já chegam marcados com a origem.'),
          lin(A.bolha('perfil', 'var(--c1)'), 'A equipe pode corrigir a origem na lista ao lado.')]), 's5') +
      '</div>' +
      cartao(titulo('Contatos' + (R.origemSel ? ' · ' + R.origemSel + ' <button type="button" data-r="origem-sel" data-v="" class="mini">limpar</button>' : ''), A.item(180)) +
        '<div class="rolar-x"><table class="tabela-larga"><tr><th>Contato</th><th>Etapa</th><th>Origem</th></tr>' + lst.map(function (p) {
          return '<tr><td><b>' + p.nome + '</b> <span class="idp">' + p.id + '</span></td><td>' + P.st(p.status) + '</td><td><select class="campo campo-mini" data-r-mudar="origem" data-v="' + p.id + '" aria-label="Origem de ' + p.nome + '">' + opcoes(ORIGENS, ORIGEM[p.id]) + '</select></td></tr>';
        }).join('') + '</table></div>');
  };

  // ---------- 181 · Funil configurável (substitui o funil simples; mantém arrastar e tocar) ----------
  T.funil = function () {
    var F = P.FUNIL, ed = R.funilEditar;
    return cab('Funil', ed ? 'Edite as etapas: incluir, renomear, mudar de lugar e excluir.' : 'Arraste o cartão para outra coluna (ou toque no cartão e depois na coluna).', A.item([181, 68, 180])) +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:center">' +
        (P.E.selCartao && !ed ? '<div class="dica" style="margin:0">' + A.ic('seta') + 'Toque na coluna de destino para mover ' + nome(P.E.selCartao) + '.</div>' : '<span></span>') +
        '<div style="display:flex;gap:8px">' + (ed ? botao(A.ic('mais') + 'Nova etapa', 'etapa-nova', '', true) + botao('Pronto', 'funil-editar') : botao(A.ic('engrenagem') + 'Editar etapas ' + A.item(181), 'funil-editar', '', true)) + '</div></div>' +
      '<div class="rolar-x"><div class="funil' + (ed ? ' editando' : '') + '" id="funil" style="grid-template-columns:repeat(' + F.length + ',minmax(200px,1fr));min-width:' + F.length * 212 + 'px">' + F.map(function (col, i) {
        var l = P.PACIENTES.filter(function (p) { return p.status === col; }), base = BASE_FUNIL.indexOf(col) >= 0;
        return '<div class="coluna" data-coluna="' + esc(col) + '"><h3>' + esc(col) + '<span class="num fraco">' + l.length + '</span></h3>' +
          (ed ? '<div class="etapa-ed">' + peq('◀', 'etapa-mover', i + ':-1', true) + peq('▶', 'etapa-mover', i + ':1', true) +
            (base ? '<span class="fraco" style="font-size:11.5px">etapa base</span>' : peq('Renomear', 'etapa-renomear', i, true) + peq('Excluir', 'etapa-excluir', i, true)) + '</div>' : '') +
          l.map(function (p) {
            return '<div class="ficha-cartao' + (P.E.selCartao === p.id ? ' sel' : '') + '" data-cartao="' + p.id + '"><b>' + p.nome + '</b><small>' + p.id + ' · ' + (p.prof === '—' ? 'sem profissional' : p.prof) + '</small>' +
              '<small>via ' + esc(ORIGEM[p.id] || '—') + '</small>' + (p.alerta ? '<span class="status st-al" style="justify-self:start">' + p.alerta + '</span>' : '') + '</div>';
          }).join('') + '</div>';
      }).join('') + '</div></div>' +
      '<p class="nota">As etapas base (do primeiro contato ao inativo) estão ligadas à agenda e ao app; a clínica inclui as suas entre elas, como "Orçamento enviado" ou "Avaliação marcada".</p>';
  };

  // ---------- 182 · Tarefas e retornos com prazo ----------
  T['crm-tarefas'] = function () {
    var f = R.filtroTarefa, todas = R.tarefas;
    function atrasada(t) { return t.st === 'aberta' && dia(t.prazo) < HOJE; }
    var l = todas.filter(function (t) {
      if (f === 'minhas') return t.resp === QUEM && t.st === 'aberta';
      if (f === 'atrasadas') return atrasada(t);
      if (f === 'feitas') return t.st === 'feita';
      return t.st === 'aberta';
    }).sort(function (a, b) { return dia(a.prazo) - dia(b.prazo); });
    var abas = [['minhas', 'Minhas (' + todas.filter(function (t) { return t.resp === QUEM && t.st === 'aberta'; }).length + ')'], ['todas', 'Todas abertas (' + todas.filter(function (t) { return t.st === 'aberta'; }).length + ')'],
      ['atrasadas', 'Atrasadas (' + todas.filter(atrasada).length + ')'], ['feitas', 'Feitas']];
    return cab('Tarefas e retornos', 'Ligar, mandar orçamento, lembrar retorno: cada tarefa tem responsável e prazo.', A.item(182)) +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><div class="abas-tela">' + abas.map(function (a) { return '<button type="button" data-r="tarefa-filtro" data-v="' + a[0] + '" class="' + (f === a[0] ? 'ativo' : '') + '">' + a[1] + '</button>'; }).join('') + '</div>' +
        botao(A.ic('mais') + 'Nova tarefa', 'tarefa-nova') + '</div>' +
      cartao(l.length ? lista(l.map(function (t) {
        var atr = atrasada(t), hoje = t.st === 'aberta' && dia(t.prazo) === HOJE;
        return lin(t.st === 'feita' ? A.bolha('trofeu', 'var(--ok)') : A.bolha(t.tipo === 'Ligar' ? 'telefone' : t.tipo === 'Mandar orçamento' ? 'moeda' : t.tipo === 'Lembrar retorno' ? 'calendario' : 'documento', atr ? 'var(--perigo)' : 'var(--c4)'),
          '<b>' + t.t + '</b><div class="fraco"><button type="button" class="link-pac" data-r="abrir-pac" data-v="' + t.pac + '">' + nome(t.pac) + '</button> <span class="idp">' + t.pac + '</span> · ' + curto(t.resp) + '</div>',
          '<div class="tarefa-acoes"><span class="status ' + (t.st === 'feita' ? 'st-ok">feita' : atr ? 'st-pe">atrasada · ' + t.prazo : hoje ? 'st-al">hoje' : 'st-in">até ' + t.prazo) + '</span>' + (t.st === 'aberta' ? ' ' + peq('Concluir', 'tarefa-feita', t.id) : '') + '</div>');
      })) : '<p class="mudo">Nenhuma tarefa aqui.</p>', 'tarefas') +
      '<p class="nota">Tarefa atrasada aparece em vermelho para quem é responsável e para o Dr. André. Ao concluir, ela entra na linha do tempo do paciente ' + A.item(183) + '.</p>';
  };

  // ---------- 184 · Etiquetas e segmentos ----------
  T['crm-segmentos'] = function () {
    var f = R.filtro, res = noSegmento(f), et = etiquetas();
    return cab('Etiquetas e segmentos', 'Etiquetas nos contatos e grupos salvos para filtrar e mandar mensagens.', A.item([184, 186])) +
      '<div class="grade">' +
        cartao(titulo('Montar um segmento', A.item(184)) +
          '<div class="filtros-seg">' + campo('Etiqueta', '<select class="campo" data-r-mudar="filtro" data-v="etiqueta"><option value="">Qualquer</option>' + opcoes(et, f.etiqueta) + '</select>') +
            campo('Etapa do funil', '<select class="campo" data-r-mudar="filtro" data-v="etapa"><option value="">Qualquer</option>' + opcoes(P.FUNIL, f.etapa) + '</select>') +
            campo('Origem', '<select class="campo" data-r-mudar="filtro" data-v="origem"><option value="">Qualquer</option>' + opcoes(ORIGENS, f.origem) + '</select>') + '</div>' +
          '<p style="margin:12px 0 6px"><b class="num">' + res.length + '</b> contato(s)</p>' +
          '<div class="lista">' + res.map(function (p) { return lin('', '<b>' + p.nome + '</b> <span class="idp">' + p.id + '</span><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">' + chipsEtiq(p.id) + '</div>', P.st(p.status)); }).join('') + '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + botao('Salvar segmento', 'seg-salvar', '', false, res.length ? '' : ' disabled') + '</div>', 's7') +
        cartao(titulo('Segmentos salvos', A.item(184)) + lista(R.segmentos.map(function (s, i) {
          var n = noSegmento(s).length, desc = [s.etiqueta && 'etiqueta "' + esc(s.etiqueta) + '"', s.etapa && 'etapa "' + esc(s.etapa) + '"', s.origem && 'origem ' + esc(s.origem)].filter(Boolean).join(' · ');
          return lin('', '<b>' + esc(s.nome) + '</b><div class="fraco">' + desc + '</div>', '<span class="num fraco">' + n + '</span> ' + peq('Ver', 'seg-ver', i, true) + ' ' + peq(A.ic('whatsapp') + 'Campanha', 'seg-campanha', i));
        })), 's5') +
        cartao(titulo('Etiquetas de um contato', A.item(184)) +
          '<select class="campo" data-r-mudar="etiq-pac" style="max-width:320px">' + opcoes(IDS.map(function (id) { return [id, nome(id) + ' · ' + id]; }), R.etiqPac) + '</select>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0">' + (chipsEtiq(R.etiqPac, true) || '<span class="fraco">Sem etiquetas.</span>') + '</div>' +
          '<div class="digitar"><input class="campo" id="etiq-nova" list="etiq-lista" placeholder="Nova etiqueta (ex.: Prefere manhã)" autocomplete="off" maxlength="30"><datalist id="etiq-lista">' + opcoes(et) + '</datalist>' +
          '<button class="botao" type="button" data-r="etiq-incluir" aria-label="Incluir etiqueta">' + A.ic('mais') + '</button></div>', 's12') +
      '</div>';
  };

  // ---------- 185 · Modelos de mensagem ----------
  T['crm-modelos'] = function () {
    var m = R.modelos[R.modeloSel];
    return cab('Modelos de mensagem', 'Textos prontos da clínica. O nome do paciente entra sozinho.', A.item(185)) +
      '<div class="grade">' +
        cartao(titulo('Modelos', A.item(185)) + lista(R.modelos.map(function (x, i) {
          return lin(A.bolha('chat', i === R.modeloSel ? 'var(--primaria)' : 'var(--c4)'), '<b>' + esc(x.nome) + '</b><div class="fraco duas-linhas">' + esc(x.t) + '</div>', peq(i === R.modeloSel ? 'Aberto' : 'Abrir', 'modelo-abrir', i, i !== R.modeloSel));
        })) + '<div style="margin-top:12px">' + botao(A.ic('mais') + 'Novo modelo', 'modelo-novo', '', true) + '</div>', 's5') +
        cartao(titulo('Editar · ' + esc(m.nome), A.item(185)) +
          campo('Nome', '<input class="campo" data-r-campo="modelo-nome" value="' + esc(m.nome) + '" maxlength="40">') +
          '<label style="display:block;margin-top:10px"><span class="rotulo">Texto</span><textarea class="campo" id="modelo-texto" data-r-campo="modelo-texto" style="height:120px">' + esc(m.t) + '</textarea></label>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="fraco" style="font-size:12.5px;align-self:center">Inserir:</span>' + ['{nome}', '{profissional}', '{clinica}'].map(function (v) { return peq(v, 'modelo-var', v, true); }).join('') + '</div>' +
          '<div style="margin-top:14px"><span class="rotulo">Como chega para</span> <select class="campo campo-mini" data-r-mudar="modelo-pac">' + opcoes(IDS.map(function (id) { return [id, nome(id)]; }), R.modeloPac) + '</select></div>' +
          '<div class="msg eu previa" id="modelo-previa" style="max-width:520px;margin-top:10px">' + esc(preencher(m.t, R.modeloPac)) + '<small>WhatsApp da clínica · prévia</small></div>' +
          '<p class="nota" style="margin-top:8px">Os modelos aparecem ao mandar mensagem na Central do paciente, na Caixa de conversas e nas campanhas.</p>', 's7') +
      '</div>';
  };

  // ---------- 186 · Campanhas pelo WhatsApp ----------
  T['crm-campanhas'] = function () {
    var c = R.camp, s = R.segmentos[c.seg], m = R.modelos[c.modelo], todos = noSegmento(s);
    var recebem = todos.filter(function (p) { return !SAIU[p.id]; }), fora = todos.length - recebem.length;
    var ex = recebem[0] ? recebem[0].id : null;
    return cab('Campanhas pelo WhatsApp', 'Uma mensagem para um segmento, sempre com a opção de sair da lista.', A.item([186, 184, 185])) +
      '<div class="alerta-lin" style="--cor:var(--alerta)">' + A.bolha('alerta', 'var(--alerta)') + '<div><b>Campanha aumenta o risco de bloqueio do número</b> ' + A.item(186) +
        '<div class="mudo" style="font-size:13px">Muitas mensagens iguais para quem não puxou conversa podem levar o WhatsApp a bloquear o número da clínica. Para campanhas, o ideal é o WhatsApp oficial da Meta. Aqui os envios saem aos poucos (até 30 por dia) e quem responde SAIR não recebe mais.</div></div></div>' +
      '<div class="grade">' +
        cartao(titulo('Nova campanha', A.item(186)) +
          campo('Segmento ' + A.item(184), '<select class="campo" data-r-mudar="camp-seg">' + opcoes(R.segmentos.map(function (x, i) { return [String(i), x.nome + ' (' + noSegmento(x).length + ')']; }), String(c.seg)) + '</select>') +
          '<div style="margin-top:10px">' + campo('Modelo ' + A.item(185), '<select class="campo" data-r-mudar="camp-modelo">' + opcoes(R.modelos.map(function (x, i) { return [String(i), x.nome]; }), String(c.modelo)) + '</select>') + '</div>' +
          '<p style="margin-top:12px"><b class="num">' + recebem.length + '</b> recebem' + (fora ? ' · <span class="fraco">' + fora + ' respondeu SAIR e fica de fora</span>' : '') + (recebem.length > 30 ? ' · <span class="fraco">sai em ' + Math.ceil(recebem.length / 30) + ' dias</span>' : '') + '</p>' +
          '<label class="confirma"><input type="checkbox" data-r-mudar="camp-entendi"' + (c.entendi ? ' checked' : '') + '> Entendi o risco de bloqueio do número</label>' +
          '<div style="margin-top:10px">' + botao(A.ic('whatsapp') + 'Enviar campanha', 'camp-enviar', '', false, c.entendi && recebem.length ? '' : ' disabled') + '</div>', 's6') +
        cartao(titulo('Prévia', A.item(185)) + (ex ? '<div class="msg eu previa" style="max-width:520px">' + esc(preencher(m.t, ex)) + '<br><br><span style="opacity:.8">Para não receber mais, responda SAIR.</span><small>para ' + nome(ex) + ' · prévia</small></div>' : '<p class="mudo">Ninguém neste segmento pode receber.</p>') +
          '<p class="nota" style="margin-top:8px">A frase do SAIR entra sozinha em toda campanha. Respostas chegam na Caixa de conversas.</p>', 's6') +
        cartao(titulo('Campanhas enviadas', A.item(186)) + '<div class="rolar-x"><table class="tabela-larga"><tr><th>Campanha</th><th>Data</th><th>Enviadas</th><th>Responderam</th><th>Saíram</th><th>Situação</th></tr>' +
          R.campanhas.map(function (x) { return '<tr><td><b>' + esc(x.nome) + '</b></td><td class="num">' + x.data + '</td><td class="num">' + x.enviados + '</td><td class="num">' + x.responderam + '</td><td class="num">' + x.sairam + '</td><td><span class="status ' + (x.st === 'concluída' ? 'st-ok' : 'st-in') + '">' + x.st + '</span></td></tr>'; }).join('') + '</table></div>', 's12') +
      '</div>';
  };

  // ---------- 187 · Programa de indicação ----------
  T['crm-indicacoes'] = function () {
    var rank = {};
    R.indicacoes.forEach(function (x) { rank[x.de] = (rank[x.de] || 0) + 1; });
    return cab('Programa de indicação', 'Quem indicou quem, com o benefício combinado pela clínica.', A.item([187, 180])) +
      '<div class="grade">' +
        cartao(titulo('Benefício da clínica', A.item(187)) +
          '<textarea class="campo" data-r-campo="beneficio" style="height:80px">' + esc(R.beneficio) + '</textarea>' +
          '<p class="nota" style="margin-top:6px">A clínica escreve o benefício; ele aparece para a equipe na hora de entregar.</p>', 's5') +
        cartao(titulo('Quem mais indica', A.item(187)) + lista(Object.keys(rank).sort(function (a, b) { return rank[b] - rank[a]; }).map(function (id) {
          return lin('<span class="pessoa" style="background:var(--c2)">' + nome(id).split(' ').map(function (x) { return x[0]; }).join('') + '</span>', '<b>' + nome(id) + '</b> <span class="idp">' + id + '</span>', '<span class="num">' + rank[id] + '</span>');
        })), 's7') +
        cartao(titulo('Indicações', A.item(187)) +
          '<div style="margin-bottom:10px">' + botao(A.ic('mais') + 'Registrar indicação', 'ind-nova', '', true) + '</div>' +
          '<div class="rolar-x"><table class="tabela-larga"><tr><th>Quem indicou</th><th>Indicado</th><th>Data</th><th>Situação</th><th></th></tr>' +
          R.indicacoes.map(function (x) {
            var s = ST_IND[x.st];
            return '<tr><td><b>' + nome(x.de) + '</b> <span class="idp">' + x.de + '</span></td><td>' + nome(x.para) + ' <span class="idp">' + x.para + '</span></td><td class="num">' + x.data + '</td><td><span class="status ' + s[1] + '">' + s[0] + '</span></td><td>' +
              (x.st === 'contato' ? peq('Virou paciente', 'ind-paciente', x.id, true) : x.st === 'paciente' ? peq('Entregar benefício', 'ind-beneficio', x.id) : '') + '</td></tr>';
          }).join('') + '</table></div>' +
          '<p class="nota" style="margin-top:8px">O contato indicado já chega com a origem "Indicação" ' + A.item(180) + '.</p>', 's12') +
      '</div>';
  };

  // ---------- ações ----------
  function abrir(hash) { if (location.hash === hash) P.render(false); else location.hash = hash; }
  var AC = {
    'abrir-pac': function (v) { P.abrirPaciente(v); },
    'origem-sel': function (v) { R.origemSel = v; P.render(true); },
    'funil-editar': function () { R.funilEditar = !R.funilEditar; P.E.selCartao = null; P.render(true); },
    'etapa-nova': function () {
      var F = P.FUNIL;
      folha('Nova etapa do funil', campo('Nome', '<input class="campo" name="n" placeholder="Ex.: Orçamento enviado" maxlength="28">') +
        campo('Depois de', '<select class="campo" name="pos">' + opcoes(F.map(function (x, i) { return [String(i), x]; }), '0') + '</select>'), function (d) {
        var n = String(d.get('n') || '').trim().slice(0, 28); if (!n) return false;
        if (F.indexOf(n) >= 0) { P.avisoCurto('Já existe uma etapa com esse nome.'); return false; }
        F.splice(+d.get('pos') + 1, 0, n); P.render(true); P.avisoCurto('Etapa "' + n + '" incluída.');
      }, 'Incluir');
    },
    'etapa-mover': function (v) {
      var F = P.FUNIL, x = v.split(':'), i = +x[0], j = i + +x[1]; if (j < 0 || j >= F.length) return;
      var t = F[i]; F[i] = F[j]; F[j] = t; P.render(true);
    },
    'etapa-renomear': function (v) {
      var F = P.FUNIL, velho = F[+v];
      folha('Renomear etapa', campo('Nome', '<input class="campo" name="n" value="' + esc(velho) + '" maxlength="28">'), function (d) {
        var n = String(d.get('n') || '').trim().slice(0, 28); if (!n || (n !== velho && F.indexOf(n) >= 0)) return false;
        F[+v] = n; P.PACIENTES.forEach(function (p) { if (p.status === velho) p.status = n; }); P.render(true);
      });
    },
    'etapa-excluir': function (v) {
      var F = P.FUNIL, n = F[+v];
      if (P.PACIENTES.some(function (p) { return p.status === n; })) { P.avisoCurto('Mova os contatos desta etapa antes de excluir.'); return; }
      F.splice(+v, 1); P.render(true); P.avisoCurto('Etapa "' + n + '" excluída.');
    },
    'tarefa-filtro': function (v) { R.filtroTarefa = v; P.render(true); },
    'tarefa-nova': function () {
      var datas = ['13/10', '14/10', '15/10', '16/10', '19/10', '20/10'];
      folha('Nova tarefa', campo('O que fazer', '<input class="campo" name="t" placeholder="Ex.: Ligar para saber se recebeu o orçamento" maxlength="80">') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campo('Tipo', '<select class="campo" name="tipo">' + opcoes(['Ligar', 'Mandar orçamento', 'Lembrar retorno', 'Outro']) + '</select>') + campo('Prazo', '<select class="campo" name="prazo">' + opcoes(datas, '14/10') + '</select>') + '</div>' +
        campo('Paciente', '<select class="campo" name="pac">' + opcoes(IDS.map(function (id) { return [id, nome(id) + ' · ' + id]; })) + '</select>') +
        campo('Responsável', '<select class="campo" name="resp">' + opcoes(Object.keys(P.EQUIPE).map(function (k) { return [k, curto(k) + ' · ' + P.EQUIPE[k].papel]; }), QUEM) + '</select>'), function (d) {
        var t = String(d.get('t') || '').trim(); if (!t) return false;
        R.tarefas.push({ id: R.proxTarefa++, t: esc(t.slice(0, 80)), tipo: d.get('tipo'), pac: d.get('pac'), resp: d.get('resp'), prazo: d.get('prazo'), st: 'aberta' });
        P.render(true); P.avisoCurto('Tarefa criada para ' + curto(d.get('resp')) + ', até ' + d.get('prazo') + '.');
      }, 'Criar');
    },
    'tarefa-feita': function (v) {
      var t = R.tarefas.filter(function (x) { return x.id === +v; })[0]; t.st = 'feita';
      linhaTempo(t.pac, 'interacao', 'Tarefa concluída: ' + t.t); P.render(true); P.avisoCurto('Tarefa concluída e registrada na linha do tempo.');
    },
    'seg-salvar': function () {
      var f = R.filtro;
      folha('Salvar segmento', campo('Nome do segmento', '<input class="campo" name="n" placeholder="Ex.: Manutenção que veio do Google" maxlength="40">'), function (d) {
        var n = String(d.get('n') || '').trim().slice(0, 40); if (!n) return false;
        R.segmentos.push({ nome: n, etiqueta: f.etiqueta, etapa: f.etapa, origem: f.origem }); P.render(true); P.avisoCurto('Segmento "' + n + '" salvo.');
      });
    },
    'seg-ver': function (v) { var s = R.segmentos[+v]; R.filtro = { etiqueta: s.etiqueta, etapa: s.etapa, origem: s.origem }; P.render(true); window.scrollTo(0, 0); },
    'seg-campanha': function (v) { R.camp.seg = +v; R.camp.entendi = false; abrir('#crm-campanhas'); },
    'etiq-tirar': function (v) { var l = ETIQ[R.etiqPac] || []; ETIQ[R.etiqPac] = l.filter(function (e) { return e !== v; }); P.render(true); },
    'etiq-incluir': function () {
      var c = document.getElementById('etiq-nova'), t = String(c.value || '').trim().slice(0, 30); if (!t) return;
      var l = ETIQ[R.etiqPac] = ETIQ[R.etiqPac] || []; if (l.indexOf(t) < 0) l.push(t); P.render(true);
    },
    'modelo-abrir': function (v) { R.modeloSel = +v; P.render(true); },
    'modelo-novo': function () { R.modelos.push({ nome: 'Novo modelo', t: 'Oi, {nome}! ' }); R.modeloSel = R.modelos.length - 1; P.render(true); var t = document.getElementById('modelo-texto'); if (t) t.focus(); },
    'modelo-var': function (v) {
      var t = document.getElementById('modelo-texto'), a = t.selectionStart, b = t.selectionEnd;
      t.value = t.value.slice(0, a) + v + t.value.slice(b); R.modelos[R.modeloSel].t = t.value; P.render(true);
    },
    'camp-enviar': function () {
      var c = R.camp, s = R.segmentos[c.seg], m = R.modelos[c.modelo], rec = noSegmento(s).filter(function (p) { return !SAIU[p.id]; });
      if (!c.entendi || !rec.length) return;
      R.campanhas.unshift({ nome: m.nome + ' · ' + s.nome, data: '13/10', enviados: rec.length, responderam: 0, sairam: 0, st: rec.length > 30 ? 'enviando · 30 por dia' : 'enviando' });
      rec.forEach(function (p) { linhaTempo(p.id, 'conversa', 'Campanha "' + esc(m.nome) + '" enviada pelo WhatsApp', 'com a opção SAIR'); });
      c.entendi = false; P.render(true); P.avisoCurto('Campanha enviada a ' + rec.length + ' contato(s), aos poucos (simulado).');
    },
    'ind-nova': function () {
      var ja = R.indicacoes.map(function (x) { return x.para; });
      var podem = IDS.filter(function (id) { return ja.indexOf(id) < 0; });
      folha('Registrar indicação', campo('Quem indicou', '<select class="campo" name="de">' + opcoes(IDS.filter(function (id) { return P.pac(id).status !== 'Novo contato'; }).map(function (id) { return [id, nome(id)]; })) + '</select>') +
        campo('Contato indicado', '<select class="campo" name="para">' + opcoes(podem.map(function (id) { return [id, nome(id) + ' · ' + P.pac(id).status]; })) + '</select>'), function (d) {
        var de = d.get('de'), para = d.get('para'); if (de === para) { P.avisoCurto('Quem indicou e o indicado precisam ser pessoas diferentes.'); return false; }
        var p = P.pac(para);
        R.indicacoes.push({ id: R.proxInd++, de: de, para: para, data: '13/10', st: VIROU.indexOf(p.status) >= 0 ? 'paciente' : 'contato' });
        ORIGEM[para] = 'Indicação'; linhaTempo(de, 'interacao', 'Indicou ' + nome(para)); P.render(true); P.avisoCurto('Indicação registrada. A origem de ' + primeiro(para) + ' agora é "Indicação".');
      }, 'Registrar');
    },
    'ind-paciente': function (v) { R.indicacoes.filter(function (x) { return x.id === +v; })[0].st = 'paciente'; P.render(true); },
    'ind-beneficio': function (v) {
      var x = R.indicacoes.filter(function (y) { return y.id === +v; })[0]; x.st = 'beneficio';
      linhaTempo(x.de, 'interacao', 'Benefício da indicação entregue: ' + esc(R.beneficio.slice(0, 120))); P.render(true); P.avisoCurto('Benefício entregue a ' + nome(x.de) + '.');
    }
  };
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-r]'); if (!el || !AC[el.dataset.r] || el.disabled) return;
    ev.preventDefault(); AC[el.dataset.r](el.dataset.v, el);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.id === 'etiq-nova') { ev.preventDefault(); AC['etiq-incluir'](); } });
  document.addEventListener('input', function (ev) {
    var k = ev.target.dataset && ev.target.dataset.rCampo; if (!k) return;
    var m = R.modelos[R.modeloSel];
    if (k === 'modelo-texto') { m.t = ev.target.value; var pv = document.getElementById('modelo-previa'); if (pv) pv.innerHTML = esc(preencher(m.t, R.modeloPac)) + '<small>WhatsApp da clínica · prévia</small>'; }
    if (k === 'modelo-nome') m.nome = ev.target.value.slice(0, 40);
    if (k === 'beneficio') R.beneficio = ev.target.value.slice(0, 200);
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, d = t.dataset || {};
    if (d.rModelo != null && d.rModelo !== '') {
      // Seletor de modelo (mensagem da Central do paciente ou Caixa de conversas): preenche o campo de texto.
      if (t.value === '') return;
      var alvo = d.alvo ? document.getElementById(d.alvo) : t.closest('form') && t.closest('form').querySelector('[name=t]');
      if (alvo) { alvo.value = preencher(R.modelos[+t.value].t, d.rModelo); alvo.focus(); }
      return;
    }
    var m = d.rMudar; if (!m) return;
    if (m === 'origem') ORIGEM[d.v] = t.value;
    if (m === 'filtro') R.filtro[d.v] = t.value;
    if (m === 'etiq-pac') R.etiqPac = t.value;
    if (m === 'modelo-pac') R.modeloPac = t.value;
    if (m === 'camp-seg') { R.camp.seg = +t.value; R.camp.entendi = false; }
    if (m === 'camp-modelo') R.camp.modelo = +t.value;
    if (m === 'camp-entendi') R.camp.entendi = t.checked;
    P.render(true);
  });
})();
