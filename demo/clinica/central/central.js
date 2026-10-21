// Central do médico da demonstração (DEC-125): itens 39 a 46 do escopo. Pacientes de mentira.
// Os dados vêm de comum/dados.js, a mesma fonte do app: o que a Mariana registra no app aparece aqui na mesma visita
// (linha do tempo, consumo do dia, alertas), e o que a equipe faz aqui (metas, conferência da prescrição, recados,
// funções) aparece no app. Tudo fica na memória da página.
// A aba Hoje começa pela triagem ("Precisa da sua atenção hoje"); no iPad e no computador, lista e ficha lado a lado.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const M = window.DEMO_MODELO;
  const ic = (n, t) => window.DEMO_ICONE(n, t);
  const fmt = M.fmt, inteiro = M.inteiro;
  let raiz = null;
  const ABAS = [['hoje', 'Hoje'], ['metas', 'Metas e plano'], ['aplicacoes', 'Aplicações'], ['avisos', 'Avisos e conteúdo'], ['funcoes', 'Funções do app']];
  const est = { aba: 'hoje', paciente: null, ficha: false, vistos: {}, metasPac: 1 };
  const nomeDe = id => M.pac(id).nome;
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'cab-cartao' }, el('h2', { text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const origem = texto => el('p', { class: 'origem' }, ic('info', 'p'), texto);
  const ESTADO = { ok: ['check', 'Em dia'], atencao: ['relogio', 'Atenção'], alerta: ['alerta', 'Alerta'] };
  const etiqueta = e => el('span', { class: 'estado-tag ' + e }, ic(ESTADO[e][0], 'p'), ESTADO[e][1]);
  const svg = (tag, at) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
  const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);
  function linhaFina(v) {
    const s = svg('svg', { viewBox: '0 0 64 24', class: 'linha-fina', 'aria-hidden': 'true' }), min = Math.min(...v), max = Math.max(...v), d = max - min || 1;
    const pts = v.map((x, i) => [2 + i * 60 / (v.length - 1), 21 - (x - min) / d * 18]);
    s.append(svg('polyline', { points: pts.map(x => x.join(',')).join(' '), fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const u = pts[pts.length - 1]; s.append(svg('circle', { cx: u[0], cy: u[1], r: 2.5, fill: 'currentColor' }));
    return s;
  }
  const adesao = d => el('span', { class: 'adesao', title: 'Dias com registro nos 7 dias anteriores' }, el('span', { class: 'mini-barra', 'aria-hidden': 'true' }, (() => { const i = el('i'); i.style.transform = 'scaleX(' + d / 7 + ')'; return i; })()), el('span', { class: 'tab', text: d + '/7 dias' }));

  const linhaPaciente = p => {
    const e = M.estado(p), pes = p.pesagens.slice(-6).map(x => x.kg);
    return el('li', {}, el('button', { type: 'button', class: 'linha-pac', 'data-paciente': p.id, 'aria-current': est.paciente === p.id && dividido() ? 'true' : null, onclick: () => abrirFicha(p.id),
      'aria-label': p.nome + ', ' + ESTADO[e.nivel][1].toLowerCase() + ', registrou em ' + M.dias7(p) + ' dos 7 dias anteriores, ' + M.sinal(M.variacaoSemana(p), 1) + ' kg na última pesagem' },
      el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
      el('span', { class: 'cresce', 'aria-hidden': 'true' }, el('span', { class: 't1', text: p.nome }), el('span', { class: 't2', text: p.fase + ' · último registro ' + M.quando(M.ultimoRegistro(p)) }),
        el('span', { class: 'dados-linha' }, el('span', { class: 'spark' }, linhaFina(pes), el('span', { class: 'tab', text: M.sinal(M.variacaoSemana(p), 1) + ' kg' })), adesao(M.dias7(p)))),
      el('span', { 'aria-hidden': 'true' }, etiqueta(e.nivel))));
  };

  // Triagem: o motivo (com a regra) e as ações de um toque (Ligar é simulado: nenhum número aparece).
  const naTriagem = () => M.pacientes.filter(p => M.estado(p).nivel !== 'ok' && !est.vistos[p.id]).sort((a, b) => (M.estado(a).nivel === 'alerta' ? 0 : 1) - (M.estado(b).nivel === 'alerta' ? 0 : 1));
  function triagem() {
    const lista = naTriagem();
    return el('section', { class: 'cartao triagem', 'aria-labelledby': 'tit-triagem' },
      el('div', { class: 'cab-cartao' }, el('h2', { id: 'tit-triagem' }, 'Precisa da sua atenção hoje'), el('span', { class: 'contador tab', text: String(lista.length) }), item(40)),
      lista.length ? el('ul', { class: 'lista-triagem' }, lista.map(p => { const e = M.estado(p); return el('li', { class: 'alerta-card ' + e.nivel, 'data-paciente': p.id },
        el('div', { class: 'linha-h' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
          el('div', { class: 'cresce' }, el('p', { class: 't1', text: e.titulo }), el('p', { class: 't2', text: p.nome + ' · último registro ' + M.quando(M.ultimoRegistro(p)) })), etiqueta(e.nivel)),
        el('p', { class: 'motivo', text: e.porque }),
        el('div', { class: 'acoes' },
          el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Ligar para ' + p.nome, onclick: () => DEMO.rapida('Na demonstração, a ligação para ' + p.primeiro + ' é simulada.') }, ic('telefone', 'p'), 'Ligar'),
          el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Ver a ficha de ' + p.nome, onclick: () => abrirFicha(p.id) }, ic('ficha', 'p'), 'Ver ficha'),
          el('button', { type: 'button', class: 'botao leve', 'aria-label': 'Marcar ' + p.nome + ' como visto', onclick: () => { est.vistos[p.id] = true; DEMO.rapida(p.primeiro + ': marcado como visto. O estado continua na lista.'); desenhar(true); } }, ic('check', 'p'), 'Marcar como visto'))); }))
        : el('div', { class: 'vazio' }, ilustracao(), el('p', { class: 't1', text: 'Tudo visto por hoje.' }), el('p', { class: 'peq', text: 'Quando algo pedir sua atenção, aparece aqui.' })));
  }
  function ilustracao() {
    const s = svg('svg', { viewBox: '0 0 120 80', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    s.append(svg('rect', { x: 30, y: 14, width: 60, height: 52, rx: 12, opacity: '.4' }), svg('path', { d: 'M46 40l9 9 19-19', 'stroke-width': '3' }), svg('circle', { cx: 100, cy: 20, r: 3, opacity: '.5' }), svg('circle', { cx: 18, cy: 58, r: 2, opacity: '.5' }));
    return s;
  }
  const agendaHoje = () => M.agenda.filter(a => M.dia(a.quando) === 'hoje').sort((a, b) => a.quando - b.quando);
  function resumoAgenda() {
    const h = agendaHoje(), pres = h.filter(a => a.modo === 'presencial').length, vid = h.length - pres;
    if (!h.length) return 'Hoje: nenhuma consulta na agenda.';
    return 'Hoje: ' + h.length + (h.length === 1 ? ' consulta' : ' consultas') + ' (' + [pres ? pres + (pres === 1 ? ' presencial' : ' presenciais') : '', vid ? vid + ' por vídeo' : ''].filter(Boolean).join(' e ') + ').';
  }

  const status = () => el('div', { role: 'status', class: 'resultado' });
  const ok = (onde, texto) => trocar(onde, el('p', { class: 'feito-hoje' }, ic('check', 'p'), ' ' + texto));
  const TELAS = {
    hoje: () => {
      const d7 = M.pacientes.map(M.dias7), ag = agendaHoje();
      const lista = [
        el('div', { class: 'kpis' }, kpi('No app', String(M.pacientes.length), 'pacientes'), kpi('Registros', fmt(M.media(d7)), 'de 7 dias, em média'), kpi('Pedem atenção', String(naTriagem().length), 'hoje')),
        triagem(),
        cartao('Agenda de hoje', null, ag.length ? el('ul', { class: 'lista-simples' }, ag.map(a => el('li', {}, el('strong', { class: 'tab hora-ag', text: M.hora(a.quando) }),
          el('span', { class: 'cresce' }, el('span', { text: nomeDe(a.paciente) }), el('br'), el('span', { class: 'mudo peq', text: a.tipo + ' · ' + a.modo })), a.quando < new Date() ? el('span', { class: 'mudo peq', text: 'atendido' }) : null)))
          : el('p', { class: 'mudo', text: 'Nenhuma consulta hoje.' })),
        cartao('Pacientes da semana', 39, el('details', { class: 'regras' }, el('summary', {}, ic('info', 'p'), 'Como o estado é calculado'),
            el('ul', {}, M.REGRAS.map(([n, t]) => el('li', {}, etiqueta(n), ' ', t)), el('li', {}, etiqueta('ok'), ' Nenhuma das regras acima.')),
            el('p', { class: 'mudo peq', text: 'Registros: dias com pelo menos um registro no app nos 7 dias anteriores a hoje.' })),
          el('ul', { class: 'lista-pac' }, M.pacientes.map(linhaPaciente)))];
      if (!dividido()) return lista;
      const p = M.pac(est.paciente) || M.pacientes[0];
      return [el('div', { class: 'dividido' }, el('div', { class: 'pilha-g coluna-lista' }, lista), el('div', { class: 'coluna-ficha', 'aria-label': 'Ficha de ' + p.nome, role: 'region' }, ficha(p)))];
    },
    metas: () => {
      const r = status(), p = M.pac(est.metasPac), mt = p.metas;
      const pac = el('select', { class: 'entrada', id: 'metas-paciente', onchange: e => { est.metasPac = Number(e.target.value); desenhar(true); } }, M.pacientes.map(x => el('option', { value: x.id, text: x.nome, selected: x.id === est.metasPac })));
      const kcal = campo('Calorias por dia (kcal)', mt.kcal, 'm-kcal'), prot = campo('Proteína por dia (g)', mt.prot, 'm-prot'), agua = campo('Água por dia (mL)', mt.agua, 'm-agua');
      return [el('div', { class: 'duas-colunas' },
        cartao('Metas e plano alimentar', 43, el('p', { class: 'mudo peq', text: 'A equipe define. O paciente vê no app, na tela Hoje, com quem definiu e quando.' }),
          el('label', { class: 'campo', for: 'metas-paciente' }, el('span', { text: 'Paciente' }), pac),
          el('div', { class: 'form-2' }, kcal[0], prot[0], agua[0]),
          el('label', { class: 'campo', for: 'm-plano' }, el('span', { text: 'Plano alimentar' }), el('textarea', { class: 'entrada', id: 'm-plano', rows: '4' }, 'Café: ovos mexidos, pão integral e fruta.\nAlmoço: arroz, feijão, frango e salada.')),
          r, el('button', { type: 'button', class: 'botao', onclick: () => {
            if (!salvarMetas(p, kcal[1].value, prot[1].value, agua[1].value, r)) return;
            ok(r, 'Enviado ao app de ' + p.nome + '. As metas novas já aparecem na tela Hoje.'); DEMO.confirmar('Metas enviadas');
          } }, ic('enviar', 'p'), 'Enviar ao app')),
        el('aside', { class: 'cartao como-ve' }, el('p', { class: 'sobretitulo', text: 'Como aparece no app' }),
          el('ul', { class: 'lista-simples' }, [['fogo', 'Calorias', inteiro(mt.kcal) + ' kcal'], ['prato', 'Proteína', mt.prot + ' g'], ['gota', 'Água', inteiro(mt.agua) + ' mL']].map(([i, t, v]) =>
            el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(i, 'p')), el('span', { class: 'cresce', text: t }), el('strong', { class: 'tab', text: v })))),
          origem('Definidas ' + M.autorMetas(p) + ' ' + M.dia(mt.em) + '. Os anéis da tela Hoje usam estas metas.')))];
    },
    aplicacoes: () => {
      const r = status();
      const pac = el('select', { class: 'entrada', id: 'presc-paciente' }, M.pacientes.map(p => el('option', { value: p.nome, text: p.nome })));
      const travado = (rot, t) => el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: rot }), el('span', { class: 'travado' }, ic('cadeado', 'p'), t));
      return [el('div', { class: 'duas-colunas' },
        cartao('Prescrição das aplicações', 44, el('p', { class: 'mudo peq', text: 'A equipe cadastra o que o médico prescreveu. A enfermagem confere antes de aparecer no app. O app não calcula nem muda dose.' }),
          el('ul', { class: 'lista-pac' }, M.prescricoes.map(x => el('li', {}, el('div', { class: 'linha-pac' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(nomeDe(x.paciente)) }),
            el('span', { class: 'cresce' }, el('span', { class: 't1', text: nomeDe(x.paciente) }), el('span', { class: 't2', text: x.tipo + ' · cadastrada ' + M.quando(x.cadastrada) + ' · 1 vez por semana' })),
            x.conferida ? el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Conferida ' + M.quando(x.conferida)) : el('span', { class: 'linha-h acoes-presc' }, el('span', { class: 'estado-tag atencao' }, ic('relogio', 'p'), 'Esperando a conferência'),
              el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Conferir a prescrição de ' + nomeDe(x.paciente), onclick: () => {
                x.conferida = new Date();
                if (x.paciente === 1) M.mariana.prescricao.renovacao.conferida = x.conferida;
                desenhar(true); DEMO.confirmar('Conferida', 'Agora aparece no app de ' + M.pac(x.paciente).primeiro); } }, 'Conferir'))))))),
        cartao('Cadastrar prescrição', null, el('label', { class: 'campo', for: 'presc-paciente' }, el('span', { text: 'Paciente' }), pac),
          el('ul', { class: 'travados' }, travado('Medicamento', 'Escolhido pela equipe'), travado('Dose', 'A equipe preenche'), travado('Concentração', 'A equipe preenche'), travado('Volume', 'A equipe preenche'),
            el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: 'Frequência' }), el('strong', { text: '1 vez por semana' }))),
          el('p', { class: 'mudo peq', text: 'Na demonstração, estes campos ficam travados.' }), r,
          el('button', { type: 'button', class: 'botao', onclick: () => {
            const p = M.pacientes.find(x => x.nome === pac.value);
            M.prescricoes.unshift({ paciente: p.id, tipo: 'Nova prescrição', cadastrada: new Date(), conferida: null }); desenhar(true);
            DEMO.rapida('Prescrição de ' + p.nome + ' cadastrada. Agora a enfermagem confere.');
          } }, 'Cadastrar prescrição')))];
    },
    avisos: () => {
      const grupo = M.pacientes.filter(p => p.fase === 'Perda de peso');
      const para = chips(['Um paciente', 'Um grupo', 'Todos os pacientes']), texto = el('textarea', { class: 'entrada', id: 'recado-texto', rows: '3', maxlength: '300' }, 'Traga os exames de sangue no retorno.');
      const erro = el('p', { class: 'erro', role: 'alert' });
      return [el('div', { class: 'duas-colunas' },
        cartao('Avisos e conteúdo', 45, el('p', { class: 'rot', text: 'Para quem?' }), para.no,
          el('p', { class: 'mudo peq', text: 'Um paciente: Mariana Alves. Um grupo: fase "perda de peso" (' + grupo.length + ' pacientes). Todos: ' + M.pacientes.length + ' pacientes.' }),
          el('label', { class: 'campo', for: 'recado-texto' }, el('span', { text: 'Recado' }), texto), erro,
          el('button', { type: 'button', class: 'botao', onclick: () => {
            if (!texto.value.trim()) { erro.textContent = 'Escreva o recado.'; return; }
            const v = para.valor(), ids = v === 'Um paciente' ? [1] : v === 'Um grupo' ? grupo.map(p => p.id) : M.pacientes.map(p => p.id);
            const quem = v === 'Um paciente' ? 'Mariana Alves' : v === 'Um grupo' ? 'Grupo "Perda de peso" (' + grupo.length + ' pacientes)' : 'Todos os pacientes (' + M.pacientes.length + ')';
            M.recados.unshift({ ids, para: quem, de: M.medico(), texto: texto.value.trim().slice(0, 300), quando: new Date(), lido: false }); desenhar(true); DEMO.confirmar('Recado enviado', quem);
          } }, ic('enviar', 'p'), 'Enviar recado')),
        el('div', { class: 'pilha-g' },
          cartao('Recados enviados', null, el('ul', { class: 'lista-simples' }, M.recados.slice().sort((a, b) => b.quando - a.quando).map(x => el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic('megafone', 'p')),
            el('span', { class: 'cresce' }, el('strong', { text: x.para }), el('br'), el('span', { class: 'peq mudo', text: x.texto })), el('span', { class: 'mudo peq', text: M.quando(x.quando) + ' · ' + x.de }))))),
          cartao('Conteúdo da clínica', null, el('ul', { class: 'lista-simples' }, M.CONTEUDO.map(([i, t, d]) =>
            el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(i, 'p')), el('span', { class: 'cresce' }, el('strong', { text: d }), el('br'), el('span', { class: 'peq mudo', text: t + ' · aparece no app, em Conteúdo da clínica' }))))))))];
    },
    funcoes: () => {
      const ICONES = { refeicoes: 'prato', basicos: 'gota', bemestar: 'sorriso', outros: 'notas', aplicacoes: 'seringa', fotos: 'camera', chat: 'conversa', assistente: 'pergunta', conquistas: 'medalha' };
      const ligadas = Object.values(M.funcoes).filter(f => f[1]).length;
      return [cartao('Funções do app', 46, el('p', { class: 'mudo peq', text: 'A clínica liga e desliga cada parte do app. ' + ligadas + ' de ' + Object.keys(M.funcoes).length + ' ligadas. Desligada, a parte some do app na hora.' }),
        el('ul', { class: 'lista-simples funcoes' }, Object.entries(M.funcoes).map(([k, [n, lig]]) => el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(ICONES[k] || 'info', 'p')), el('span', { class: 'cresce', text: n }),
          el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': String(lig), 'aria-label': n, onclick: () => { M.funcoes[k][1] = !M.funcoes[k][1]; desenhar(true);
            DEMO.rapida(n + (M.funcoes[k][1] ? ': aparece no app.' : ': some do app.')); } })))))];
    }
  };
  TELAS.picadinha = TELAS.aplicacoes;   // links antigos (…&tela=picadinha)
  function kpi(r, v, sub) { return el('div', { class: 'kpi' }, el('span', { class: 'rot', text: r }), el('strong', { class: 'numero', text: v }), sub ? el('span', { class: 'mini mudo', text: sub }) : null); }
  function campo(r, v, id) { const i = el('input', { class: 'entrada', id, inputmode: 'numeric', value: String(v) }); return [el('label', { class: 'campo', for: id }, el('span', { text: r }), i), i]; }
  function chips(op) { let valor = op[op.length - 1]; const g = el('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Para quem' });
    const d = () => trocar(g, op.map(o => el('button', { type: 'button', role: 'radio', 'aria-checked': String(o === valor), 'aria-pressed': String(o === valor), onclick: () => { valor = o; d(); } }, o === valor ? ic('check', 'p') : null, o)));
    d(); return { no: g, valor: () => valor }; }
  // Metas novas: números inteiros e plausíveis; quem salva é o médico da demonstração, hoje.
  function salvarMetas(p, kcal, prot, agua, erroEm) {
    const n = v => Number(String(v).replace(/\D/g, ''));
    const k = n(kcal), pr = n(prot), ag = n(agua);
    if (!(k >= 800 && k <= 4000 && pr >= 30 && pr <= 300 && ag >= 500 && ag <= 5000)) { if (erroEm) trocar(erroEm, el('p', { class: 'erro', text: 'Confira as metas: calorias de 800 a 4.000 kcal, proteína de 30 a 300 g e água de 500 a 5.000 mL.' })); return false; }
    p.metas = { kcal: k, prot: pr, agua: ag, por: M.medico(), cargo: '', em: new Date() };
    return true;
  }

  // Ficha: estado com o porquê, o dia de hoje, a semana, metas, prescrição, consulta, evolução e linha do tempo por dia.
  function ficha(p) {
    const e = M.estado(p), c = M.consumoHoje(p), pe = M.pesoAtual(p), cons = M.proximaConsulta(p), presc = M.prescricoes.find(x => x.paciente === p.id);
    const titulo = dividido() ? 'h2' : 'h1';
    const dias = {};
    for (const x of M.linhaDoTempo(p)) { const k = M.quando(x.quando, true); (dias[k] = dias[k] || []).push(x); }
    const ORIGEM = { paciente: 'registrado pelo paciente', clinica: 'medido na clínica' };
    return [
      !dividido() ? el('button', { type: 'button', class: 'botao sec pilula', onclick: () => { est.ficha = false; desenhar(); } }, ic('voltar', 'p'), 'Pacientes') : null,
      el('section', { class: 'cartao cab-ficha' },
        el('div', { class: 'linha-h' }, el('span', { class: 'avatar grande', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
          el('div', { class: 'cresce' }, el(titulo, { class: 'nome-ficha', text: p.nome }), el('p', { class: 'mudo peq', text: 'Fase: ' + p.fase.toLowerCase() + ' (desde ' + M.ddmm(p.faseEm) + ') · em acompanhamento desde ' + M.dataLonga(p.inicio) })), etiqueta(e.nivel)),
        el('p', { class: 'aviso porque ' + e.nivel }, ic(ESTADO[e.nivel][0], 'p'), el('span', {}, el('strong', { text: (e.nivel === 'ok' ? 'Em dia. ' : e.titulo + '. ') }), e.porque)),
        el('div', { class: 'botoes' },
          el('button', { type: 'button', class: 'botao', onclick: () => editarMetas(p) }, ic('editar', 'p'), 'Editar metas'),
          el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Ligar para ' + p.nome, onclick: () => DEMO.rapida('Na demonstração, a ligação para ' + p.primeiro + ' é simulada.') }, ic('telefone', 'p'), 'Ligar'))),
      el('section', { class: 'cartao hoje-ficha', 'data-paciente': p.id }, el('div', { class: 'cab-cartao' }, el('h2', { text: 'Hoje, até agora' })),
        el('div', { class: 'blocos-semana' },
          bloco('Calorias', inteiro(c.kcal), 'kcal', 'meta: ' + inteiro(p.metas.kcal) + ' kcal', 'kcal'),
          bloco('Proteína', fmt(c.prot), 'g', 'meta: ' + p.metas.prot + ' g', 'prot'),
          bloco('Água', inteiro(c.agua), 'mL', 'meta: ' + inteiro(p.metas.agua) + ' mL', 'agua'),
          bloco('Último registro', maiuscula(M.quando(M.ultimoRegistro(p))), '', 'no app')),
        origem('Registrado pelo paciente no app. Metas definidas ' + M.autorMetas(p) + ' ' + M.dia(p.metas.em) + '.')),
      el('section', { class: 'blocos-semana', 'aria-label': 'Resumo da semana' },
        bloco('Peso', fmt(pe.kg, 1), 'kg', ORIGEM[pe.origem] + ' ' + M.quando(pe.quando), 'peso'),
        bloco('Última pesagem', M.sinal(M.variacaoSemana(p), 1), 'kg', 'em relação à anterior'),
        bloco('Registros', String(M.dias7(p)), 'de 7 dias', 'nos 7 dias anteriores'),
        bloco('Proteína', String(M.media7(p, 'prot')), 'g/dia', 'média dos 7 dias anteriores')),
      el('section', { class: 'cartao' }, el('div', { class: 'cab-cartao' }, el('h2', { text: 'Tratamento' })),
        el('dl', { class: 'dados' },
          el('dt', { text: 'Metas' }), el('dd', { text: inteiro(p.metas.kcal) + ' kcal · ' + p.metas.prot + ' g de proteína · ' + inteiro(p.metas.agua) + ' mL de água (' + M.autorMetas(p) + ', ' + M.dia(p.metas.em) + ')' }),
          el('dt', { text: 'Prescrição' }), el('dd', { text: p.id === 1 ? (M.mariana.prescricao.renovacao.conferida ? 'Renovação conferida pela enfermeira ' + M.EQUIPE.enf + ' ' + M.quando(M.mariana.prescricao.renovacao.conferida) : 'Conferida em ' + M.ddmm(M.mariana.prescricao.conferida) + '; renovação esperando a conferência')
            : presc ? (presc.conferida ? 'Conferida ' + M.quando(presc.conferida) : presc.tipo + ' esperando a conferência') : 'Conferida pela enfermagem' }),
          p.id === 1 ? [el('dt', { text: 'Aplicação' }), el('dd', { text: 'Última ' + M.quando(M.aplicacao(p).ultima.quando) + ' (' + M.aplicacao(p).ultima.local.toLowerCase() + '); próxima ' + M.quando(M.aplicacao(p).proxima) })] : null,
          el('dt', { text: 'Próxima consulta' }), el('dd', { text: cons ? maiuscula(M.quando(cons.quando)) + ' · ' + cons.tipo.toLowerCase() + ' · ' + cons.modo + (cons.presenca && p.id === 1 ? ' · presença confirmada pelo app' : '') : 'Sem consulta marcada' }))),
      cartao('Evolução do peso', 42, grafico(p), p.bio ? tabelaBio(p) : null,
        origem(p.faixaPeso ? 'Faixa da meta: ' + p.faixaPeso[0] + ' a ' + p.faixaPeso[1] + ' kg (definida ' + M.dia(p.faixaEm) + '). Pontos com borda: medidos na clínica.' : 'Pesagens semanais registradas pelo paciente; a primeira foi medida na clínica.')),
      cartao('Ficha do app', 41, Object.entries(dias).map(([dia, itens]) => el('div', { class: 'dia-tempo' }, el('p', { class: 'sobretitulo', text: dia }),
        el('ol', { class: 'tempo' }, itens.map(x => el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(x.icone, 'p')),
          el('span', { class: 'cresce' }, el('span', { class: 't1', text: x.titulo }), el('span', { class: 't2', text: x.detalhe + ' · ' + (ORIGEM[x.origem] || x.origem) })), el('time', { class: 'mudo peq tab', text: M.hora(x.quando) })))))))];
  }
  const bloco = (r, v, un, sub, chave) => el('div', { class: 'bloco-s', 'data-bloco': chave || null }, el('span', { class: 'rot', text: r }), el('span', { class: 'numero' }, v, un ? el('small', { text: un }) : null), el('span', { class: 'mini mudo', text: sub }));
  function tabelaBio(p) {
    const [b1, b2] = p.bio;
    return el('table', { class: 'tabela-bio' }, el('caption', { text: 'Medido na clínica (balança e bioimpedância)' }),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: '' }), el('th', { scope: 'col', text: M.ddmm(b1.quando) }), el('th', { scope: 'col', text: M.ddmm(b2.quando) }))),
      el('tbody', {}, [['Peso', 'peso', 'kg'], ['Gordura corporal', 'gordura', '%'], ['Massa muscular', 'musculo', 'kg'], ['Cintura', 'cintura', 'cm']].map(([r, k, u]) =>
        el('tr', {}, el('th', { scope: 'row', text: r }), el('td', { class: 'tab', text: fmt(b1[k], k === 'cintura' ? 0 : 1) + ' ' + u }), el('td', { class: 'tab', text: fmt(b2[k], k === 'cintura' ? 0 : 1) + ' ' + u })))));
  }
  function editarMetas(p) {
    const mt = p.metas, r = el('div', { role: 'alert' });
    const kcal = campo('Calorias por dia (kcal)', mt.kcal, 'f-kcal'), prot = campo('Proteína por dia (g)', mt.prot, 'f-prot'), agua = campo('Água por dia (mL)', mt.agua, 'f-agua');
    const f = DEMO.folha({ titulo: 'Metas de ' + p.primeiro, lateral: true, dentro: raiz, conteudo: [
      el('p', { class: 'mudo peq', text: 'Hoje: definidas ' + M.autorMetas(p) + ' ' + M.dia(mt.em) + '. ' + p.primeiro + ' vê no app, na tela Hoje.' }), item(43), kcal[0], prot[0], agua[0], r,
      el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
        if (!salvarMetas(p, kcal[1].value, prot[1].value, agua[1].value, r)) return;
        f.fechar(() => { DEMO.confirmar('Metas enviadas', 'Já aparecem no app de ' + p.primeiro); desenhar(true); });
      } }, ic('enviar', 'p'), 'Salvar e enviar ao app')] });
  }
  // Gráfico de linha: área suave, faixa da meta (quando houver) e o ponto atual em destaque. O texto alternativo diz os números.
  function grafico(p) {
    const v = p.pesagens.slice(-13), W = 480, H = 180, kg = v.map(x => x.kg);
    const fx = p.faixaPeso || null;
    const min = Math.min(...kg, fx ? fx[0] : Infinity) - 0.8, max = Math.max(...kg) + 0.6, x = i => 16 + i * (W - 32) / (v.length - 1), y = val => 16 + (max - val) / (max - min) * (H - 40);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Peso de ' + fmt(kg[0], 1) + ' kg em ' + M.ddmm(v[0].quando) + ' para ' + fmt(kg[kg.length - 1], 1) + ' kg em ' + M.ddmm(v[v.length - 1].quando) + '.' });
    for (let i = 0; i < 3; i++) s.append(svg('line', { x1: 16, x2: W - 16, y1: 16 + i * (H - 40) / 2, y2: 16 + i * (H - 40) / 2, class: 'grade' }));
    const pts = kg.map((val, i) => [x(i), y(val)]);
    s.append(svg('path', { d: 'M' + pts.map(q => q.join(' ')).join(' L') + ' L' + x(v.length - 1) + ' ' + (H - 24) + ' L16 ' + (H - 24) + 'Z', class: 'area' }));
    if (fx) s.append(svg('rect', { x: 16, y: y(fx[1]), width: W - 32, height: y(fx[0]) - y(fx[1]), class: 'faixa-meta', rx: 4 }));
    s.append(svg('polyline', { points: pts.map(q => q.join(',')).join(' '), class: 'traco' }));
    v.forEach((q, i) => { if (q.origem === 'clinica') s.append(svg('circle', { cx: pts[i][0], cy: pts[i][1], r: 4, class: 'ponto-clinica' })); });
    const u = pts[pts.length - 1]; s.append(svg('circle', { cx: u[0], cy: u[1], r: 9, class: 'halo' }), svg('circle', { cx: u[0], cy: u[1], r: 4.5, class: 'atual' }));
    [0, v.length - 1].forEach(i => { const t = svg('text', { x: x(i), y: H - 6, class: 'eixo', 'text-anchor': i ? 'end' : 'start' }); t.textContent = M.ddmm(v[i].quando); s.append(t); });
    return s;
  }
  // Lista e ficha lado a lado a partir de 768 px (iPad e computador).
  const dividido = () => innerWidth >= 768;
  function abrirFicha(id) { est.paciente = id; est.aba = 'hoje'; est.ficha = true; desenhar(dividido()); if (dividido()) { const c = raiz.querySelector('.coluna-ficha'); if (c) c.scrollIntoView({ block: 'nearest' }); } }
  function irAba(a) { est.aba = a === 'picadinha' ? 'aplicacoes' : a; est.ficha = false; DEMO.transicao(() => desenhar()); }
  let largura = innerWidth;
  addEventListener('resize', () => { if ((innerWidth >= 768) !== (largura >= 768) && raiz && raiz.isConnected) desenhar(true); largura = innerWidth; });
  function desenhar(mesma) {
    const p = M.pac(est.paciente);
    const soFicha = est.ficha && p && !dividido();
    const corpo = soFicha ? ficha(p) : TELAS[est.aba]();
    const nome = M.medico();
    const hora = new Date().getHours(), saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const dataHoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    trocar(raiz,
      el('header', { class: 'barra-central vidro' }, el('div', { class: 'dentro' }, el('span', { class: 'selo', 'aria-hidden': 'true', text: DEMO.iniciais(DEMO.dados.clinica) }),
        el('div', { class: 'cresce' }, el('div', { class: 'nome', text: DEMO.dados.clinica }), el('div', { class: 'sub', text: 'Central da equipe' })),
        el('span', { class: 'avatar', title: nome, 'aria-label': 'Conectado como ' + nome, role: 'img', text: DEMO.iniciais(DEMO.dados.medico) }))),
      el('div', { class: 'central' },
        soFicha ? null : el('div', { class: 'saudacao' }, el('p', { class: 'sobretitulo', text: dataHoje }), el('h1', { text: saud + ', ' + nome + '.' }), el('p', { class: 'mudo', text: resumoAgenda() })),
        el('nav', { class: 'barra-abas vidro', 'aria-label': 'Partes da central' }, el('div', { class: 'seg' }, ABAS.map(([k, n]) => el('button', { type: 'button', 'aria-current': !soFicha && est.aba === k ? 'page' : null, onclick: () => irAba(k) }, n)))),
        el('main', { class: 'pilha-g conteudo-central', id: 'conteudo', tabindex: '-1' }, corpo)));
    DEMO.tela(soFicha || (est.ficha && dividido()) ? 'ficha' : est.aba);
    const ativa = raiz.querySelector('.barra-abas [aria-current="page"]'); if (ativa) ativa.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (!mesma) window.scrollTo(0, 0);
  }

  // Montado pela página do produto (comum/produto.js). pedida: a tela do link (…&tela=…), só na primeira vez.
  window.DEMO_CENTRAL = {
    montar(onde, pedida) {
      raiz = onde;
      if (pedida != null) {
        est.paciente = (naTriagem()[0] || M.pacientes[0]).id;
        if (pedida === 'ficha') { est.paciente = 1; est.ficha = true; } else if (pedida === 'alertas' || pedida === 'pacientes') est.aba = 'hoje'; else if (TELAS[pedida]) est.aba = pedida === 'picadinha' ? 'aplicacoes' : pedida;
      } else if (est.paciente == null) est.paciente = (naTriagem()[0] || M.pacientes[0]).id;
      desenhar();
    },
    // Para o caminho "abrir a ficha da Mariana" vindo de outro lugar da demonstração.
    abrirFicha
  };
})();
