// Central do médico da demonstração (DEC-125): itens 39 a 46 do escopo. Pacientes de mentira; tudo fica na memória da página.
// A aba Hoje começa pela triagem ("Precisa da sua atenção hoje"); no iPad e no computador, lista e ficha lado a lado.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const ic = (n, t) => window.DEMO_ICONE(n, t);
  const raiz = document.getElementById('raiz');
  // estado: alerta (vermelho), atencao (âmbar) ou ok; sempre com ícone e texto.
  const PACIENTES = [
    { id: 1, nome: 'Mariana Alves', adesao: 92, peso: -3.0, ultimo: 'hoje, 8h40', alertas: [], fase: 'Adaptação', estado: 'ok' },
    { id: 2, nome: 'João Pereira', adesao: 48, peso: -0.6, ultimo: 'há 4 dias', alertas: ['Parou de registrar'], motivo: 'Último registro há 4 dias. Antes, registrava todo dia.', fase: 'Manutenção', estado: 'alerta' },
    { id: 3, nome: 'Beatriz Lima', adesao: 81, peso: -1.8, ultimo: 'ontem, 21h', alertas: ['Relatou enjoo forte'], motivo: 'Depois da aplicação de ontem. A enfermagem já recebeu o aviso.', fase: 'Adaptação', estado: 'alerta' },
    { id: 4, nome: 'Carlos Souza', adesao: 67, peso: 0.4, ultimo: 'hoje, 7h15', alertas: ['Perdeu a meta de proteína'], motivo: '3 dias seguidos abaixo da meta.', fase: 'Ajuste', estado: 'atencao' },
    { id: 5, nome: 'Fernanda Rocha', adesao: 95, peso: -2.2, ultimo: 'hoje, 9h02', alertas: [], fase: 'Manutenção', estado: 'ok' },
    { id: 6, nome: 'Ricardo Nunes', adesao: 74, peso: -1.1, ultimo: 'ontem, 19h', alertas: [], fase: 'Adaptação', estado: 'ok' },
    { id: 7, nome: 'Luana Martins', adesao: 88, peso: -2.7, ultimo: 'hoje, 6h50', alertas: [], fase: 'Ajuste', estado: 'ok' },
    { id: 8, nome: 'Paulo Henrique', adesao: 55, peso: -0.2, ultimo: 'há 2 dias', alertas: ['Intestino preso há 3 dias'], motivo: 'Registrado 3 dias seguidos como "preso".', fase: 'Adaptação', estado: 'atencao' }
  ];
  const ABAS = [['hoje', 'Hoje'], ['metas', 'Metas e plano'], ['picadinha', 'Picadinha'], ['avisos', 'Avisos e conteúdo'], ['funcoes', 'Funções do app']];
  const est = { aba: 'hoje', paciente: null, ficha: false, vistos: {} };
  const fmtPeso = v => (v > 0 ? '+' : v < 0 ? '−' : '') + String(Math.abs(v)).replace('.', ',') + ' kg';
  const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',');
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'cab-cartao' }, el('h2', { text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const ESTADO = { ok: ['check', 'Em dia'], atencao: ['relogio', 'Atenção'], alerta: ['alerta', 'Alerta'] };
  const etiqueta = e => el('span', { class: 'estado-tag ' + e }, ic(ESTADO[e][0], 'p'), ESTADO[e][1]);
  // Peso semana a semana (de mentira): do início até hoje, com a variação da semana no fim.
  const pesosDe = p => { const ini = 78.4 + (p.id - 1) * 2.3, fim = ini + p.peso * 2.5, ruido = [0, .25, -.1, .2, -.05, 0];
    return ruido.map((r, i) => +(ini + (fim - ini) * i / 5 + r).toFixed(1)); };
  const svg = (tag, at) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
  function linhaFina(v) {
    const s = svg('svg', { viewBox: '0 0 64 24', class: 'linha-fina', 'aria-hidden': 'true' }), min = Math.min(...v), max = Math.max(...v), d = max - min || 1;
    const pts = v.map((x, i) => [2 + i * 60 / (v.length - 1), 21 - (x - min) / d * 18]);
    s.append(svg('polyline', { points: pts.map(x => x.join(',')).join(' '), fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const u = pts[pts.length - 1]; s.append(svg('circle', { cx: u[0], cy: u[1], r: 2.5, fill: 'currentColor' }));
    return s;
  }
  const adesao = a => el('span', { class: 'adesao', title: 'Adesão' }, el('span', { class: 'mini-barra', 'aria-hidden': 'true' }, (() => { const i = el('i'); i.style.transform = 'scaleX(' + a / 100 + ')'; return i; })()), el('span', { class: 'tab', text: a + '%' }));

  const linhaPaciente = p => el('li', {}, el('button', { type: 'button', class: 'linha-pac', 'aria-current': est.paciente === p.id && dividido() ? 'true' : null, onclick: () => abrirFicha(p.id),
    'aria-label': p.nome + ', ' + ESTADO[p.estado][1].toLowerCase() + ', adesão ' + p.adesao + '%, ' + fmtPeso(p.peso) + ' na semana' },
    el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
    el('span', { class: 'cresce', 'aria-hidden': 'true' }, el('span', { class: 't1', text: p.nome }), el('span', { class: 't2', text: p.fase + ' · ' + p.ultimo }),
      el('span', { class: 'dados-linha' }, el('span', { class: 'spark' }, linhaFina(pesosDe(p)), el('span', { class: 'tab', text: fmtPeso(p.peso) })), adesao(p.adesao))),
    el('span', { 'aria-hidden': 'true' }, etiqueta(p.estado))));

  // Triagem: o motivo e as ações de um toque (Ligar é simulado: nenhum número aparece).
  const naTriagem = () => PACIENTES.filter(p => p.alertas.length && !est.vistos[p.id]).sort((a, b) => (a.estado === 'alerta' ? 0 : 1) - (b.estado === 'alerta' ? 0 : 1));
  function triagem() {
    const lista = naTriagem();
    return el('section', { class: 'cartao triagem', 'aria-labelledby': 'tit-triagem' },
      el('div', { class: 'cab-cartao' }, el('h2', { id: 'tit-triagem' }, 'Precisa da sua atenção hoje'), el('span', { class: 'contador tab', text: String(lista.length) }), item(40)),
      lista.length ? el('ul', { class: 'lista-triagem' }, lista.map(p => el('li', { class: 'alerta-card ' + p.estado },
        el('div', { class: 'linha-h' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
          el('div', { class: 'cresce' }, el('p', { class: 't1', text: p.alertas[0] }), el('p', { class: 't2', text: p.nome + ' · ' + p.ultimo })), etiqueta(p.estado)),
        el('p', { class: 'motivo', text: p.motivo }),
        el('div', { class: 'acoes' },
          el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Ligar para ' + p.nome, onclick: () => DEMO.rapida('Na demonstração, a ligação para ' + p.nome.split(' ')[0] + ' é simulada.') }, ic('telefone', 'p'), 'Ligar'),
          el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Ver a ficha de ' + p.nome, onclick: () => abrirFicha(p.id) }, ic('ficha', 'p'), 'Ver ficha'),
          el('button', { type: 'button', class: 'botao leve', 'aria-label': 'Marcar ' + p.nome + ' como visto', onclick: () => { est.vistos[p.id] = true; DEMO.rapida(p.nome.split(' ')[0] + ': marcado como visto.'); desenhar(true); } }, ic('check', 'p'), 'Marcar como visto')))))
        : el('div', { class: 'vazio' }, ilustracao(), el('p', { class: 't1', text: 'Tudo visto por hoje.' }), el('p', { class: 'peq', text: 'Quando algo pedir sua atenção, aparece aqui.' })));
  }
  function ilustracao() {
    const s = svg('svg', { viewBox: '0 0 120 80', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    s.append(svg('rect', { x: 30, y: 14, width: 60, height: 52, rx: 12, opacity: '.4' }), svg('path', { d: 'M46 40l9 9 19-19', 'stroke-width': '3' }), svg('circle', { cx: 100, cy: 20, r: 3, opacity: '.5' }), svg('circle', { cx: 18, cy: 58, r: 2, opacity: '.5' }));
    return s;
  }

  // O que a equipe faz aqui fica só na memória da página (some ao recarregar). Cada botão mostra o resultado.
  const mem = {
    metas: { 1: { kcal: '1600', prot: '110', agua: '8' } }, metasPac: 1, enviadoMetas: '',
    prescricoes: [{ id: 1, nome: 'Mariana Alves', conferida: true }, { id: 2, nome: 'Beatriz Lima', conferida: false }, { id: 3, nome: 'Luana Martins', conferida: true }],
    recados: [{ para: 'Todos os pacientes', texto: 'A clínica fecha no feriado de sexta.', quando: 'ontem' }],
    funcoes: { 'Refeições e plano alimentar': true, 'Água, sono e atividade': true, 'Humor, fome e intestino': true, 'Outros registros (álcool, tabaco e ciclo)': false, 'Picadinha': true,
      'Fotos de progresso': true, 'Chat com a equipe': true, 'Assistente de dúvidas': false, 'Conquistas': true }
  };
  const status = () => el('div', { role: 'status', class: 'resultado' });
  const ok = (onde, texto) => trocar(onde, el('p', { class: 'feito-hoje' }, ic('check', 'p'), ' ' + texto));
  const TELAS = {
    hoje: () => {
      const lista = [
        el('div', { class: 'kpis' }, kpi('No app', '8', 'pacientes'), kpi('Adesão média', '75%', 'nesta semana'), kpi('Pedem atenção', String(naTriagem().length), 'hoje')),
        triagem(),
        cartao('Pacientes da semana', 39, el('ul', { class: 'lista-pac' }, PACIENTES.map(linhaPaciente)))];
      if (!dividido()) return lista;
      const p = PACIENTES.find(x => x.id === est.paciente) || PACIENTES[0];
      return [el('div', { class: 'dividido' }, el('div', { class: 'pilha-g coluna-lista' }, lista), el('div', { class: 'coluna-ficha', 'aria-label': 'Ficha de ' + p.nome, role: 'region' }, ficha(p)))];
    },
    metas: () => {
      const r = status(), m = mem.metas[mem.metasPac] || { kcal: '1600', prot: '110', agua: '8' };
      const pac = el('select', { class: 'entrada', id: 'metas-paciente', onchange: e => { mem.metasPac = Number(e.target.value); desenhar(true); } }, PACIENTES.map(p => el('option', { value: p.id, text: p.nome, selected: p.id === mem.metasPac })));
      const kcal = campo('Calorias por dia (kcal)', m.kcal, 'm-kcal'), prot = campo('Proteína por dia (g)', m.prot, 'm-prot'), agua = campo('Água (copos)', m.agua, 'm-agua');
      const nome = () => PACIENTES.find(p => p.id === mem.metasPac).nome;
      return [el('div', { class: 'duas-colunas' },
        cartao('Metas e plano alimentar', 43, el('p', { class: 'mudo peq', text: 'A equipe define. O paciente vê no app, na tela Hoje.' }),
          el('label', { class: 'campo', for: 'metas-paciente' }, el('span', { text: 'Paciente' }), pac),
          el('div', { class: 'form-2' }, kcal[0], prot[0], agua[0]),
          el('label', { class: 'campo', for: 'm-plano' }, el('span', { text: 'Plano alimentar' }), el('textarea', { class: 'entrada', id: 'm-plano', rows: '4' }, 'Café: ovos mexidos, pão integral e fruta.\nAlmoço: arroz, feijão, frango e salada.')),
          r, el('button', { type: 'button', class: 'botao', onclick: () => {
            mem.metas[mem.metasPac] = { kcal: kcal[1].value, prot: prot[1].value, agua: agua[1].value };
            ok(r, 'Enviado ao app de ' + nome() + '. As metas novas já aparecem na tela Hoje.'); DEMO.confirmar('Metas enviadas');
          } }, ic('enviar', 'p'), 'Enviar ao app')),
        el('aside', { class: 'cartao como-ve' }, el('p', { class: 'sobretitulo', text: 'Como aparece no app' }),
          el('ul', { class: 'lista-simples' }, [['fogo', 'Calorias', m.kcal + ' kcal'], ['prato', 'Proteína', m.prot + ' g'], ['gota', 'Água', m.agua + ' copos']].map(([i, t, v]) =>
            el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(i, 'p')), el('span', { class: 'cresce', text: t }), el('strong', { class: 'tab', text: v })))),
          el('p', { class: 'mudo peq', text: 'Os anéis da tela Hoje do paciente usam estas metas.' })))];
    },
    picadinha: () => {
      const r = status();
      const pac = el('select', { class: 'entrada', id: 'presc-paciente' }, PACIENTES.map(p => el('option', { value: p.nome, text: p.nome })));
      const travado = (rot, t) => el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: rot }), el('span', { class: 'travado' }, ic('cadeado', 'p'), t));
      return [el('div', { class: 'duas-colunas' },
        cartao('Prescrição da picadinha', 44, el('p', { class: 'mudo peq', text: 'A equipe cadastra o que o médico prescreveu. A enfermagem confere antes de aparecer no app. O app não calcula nem muda dose.' }),
          el('ul', { class: 'lista-pac' }, mem.prescricoes.map(x => el('li', {}, el('div', { class: 'linha-pac' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(x.nome) }),
            el('span', { class: 'cresce' }, el('span', { class: 't1', text: x.nome }), el('span', { class: 't2', text: 'Medicamento cadastrado pela equipe · 1 vez por semana' })),
            x.conferida ? el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Conferida') : el('span', { class: 'linha-h acoes-presc' }, el('span', { class: 'estado-tag atencao' }, ic('relogio', 'p'), 'Esperando a conferência'),
              el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Conferir a prescrição de ' + x.nome, onclick: () => { x.conferida = true; desenhar(true); DEMO.confirmar('Conferida', 'Agora aparece no app de ' + x.nome.split(' ')[0]); } }, 'Conferir'))))))),
        cartao('Cadastrar prescrição', null, el('label', { class: 'campo', for: 'presc-paciente' }, el('span', { text: 'Paciente' }), pac),
          el('ul', { class: 'travados' }, travado('Medicamento', 'Escolhido pela equipe'), travado('Dose', 'A equipe preenche'), travado('Concentração', 'A equipe preenche'), travado('Volume', 'A equipe preenche'),
            el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: 'Frequência' }), el('strong', { text: '1 vez por semana' }))),
          el('p', { class: 'mudo peq', text: 'Na demonstração, estes campos ficam travados.' }), r,
          el('button', { type: 'button', class: 'botao', onclick: () => {
            mem.prescricoes.push({ id: Date.now(), nome: pac.value, conferida: false }); desenhar(true);
            DEMO.rapida('Prescrição de ' + pac.value + ' cadastrada. Agora a enfermagem confere.');
          } }, 'Cadastrar prescrição')))];
    },
    avisos: () => {
      const para = chips(['Um paciente', 'Um grupo', 'Todos os pacientes']), texto = el('textarea', { class: 'entrada', id: 'recado-texto', rows: '3', maxlength: '300' }, 'Traga os exames de sangue no retorno.');
      const erro = el('p', { class: 'erro', role: 'alert' });
      return [el('div', { class: 'duas-colunas' },
        cartao('Avisos e conteúdo', 45, el('p', { class: 'rot', text: 'Para quem?' }), para.no,
          el('label', { class: 'campo', for: 'recado-texto' }, el('span', { text: 'Recado' }), texto), erro,
          el('button', { type: 'button', class: 'botao', onclick: () => {
            if (!texto.value.trim()) { erro.textContent = 'Escreva o recado.'; return; }
            const quem = para.valor() === 'Um paciente' ? 'Mariana Alves' : para.valor() === 'Um grupo' ? 'Grupo "Adaptação" (4 pacientes)' : 'Todos os pacientes (8)';
            mem.recados.unshift({ para: quem, texto: texto.value.trim().slice(0, 300), quando: 'agora' }); desenhar(true); DEMO.confirmar('Recado enviado', quem);
          } }, ic('enviar', 'p'), 'Enviar recado')),
        el('div', { class: 'pilha-g' },
          cartao('Recados enviados', null, el('ul', { class: 'lista-simples' }, mem.recados.map(x => el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic('megafone', 'p')),
            el('span', { class: 'cresce' }, el('strong', { text: x.para }), el('br'), el('span', { class: 'peq mudo', text: x.texto })), el('span', { class: 'mudo peq', text: x.quando }))))),
          cartao('Conteúdo da clínica', null, el('ul', { class: 'lista-simples' }, [['camera', 'Vídeo', 'Como montar o prato'], ['livro', 'Artigo', 'Proteína em cada refeição'], ['prato', 'Receita', 'Omelete de forno com legumes']].map(([i, t, d]) =>
            el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(i, 'p')), el('span', { class: 'cresce' }, el('strong', { text: d }), el('br'), el('span', { class: 'peq mudo', text: t }))))))))];
    },
    funcoes: () => {
      const ICONES = { 'Refeições e plano alimentar': 'prato', 'Água, sono e atividade': 'gota', 'Humor, fome e intestino': 'sorriso', 'Outros registros (álcool, tabaco e ciclo)': 'notas', 'Picadinha': 'seringa',
        'Fotos de progresso': 'camera', 'Chat com a equipe': 'conversa', 'Assistente de dúvidas': 'pergunta', 'Conquistas': 'medalha' };
      const ligadas = Object.values(mem.funcoes).filter(Boolean).length;
      return [cartao('Funções do app', 46, el('p', { class: 'mudo peq', text: 'A clínica liga e desliga cada parte do app. ' + ligadas + ' de ' + Object.keys(mem.funcoes).length + ' ligadas.' }),
        el('ul', { class: 'lista-simples funcoes' }, Object.entries(mem.funcoes).map(([n, lig]) => el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(ICONES[n] || 'info', 'p')), el('span', { class: 'cresce', text: n }),
          el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': String(lig), 'aria-label': n, onclick: () => { mem.funcoes[n] = !mem.funcoes[n]; desenhar(true);
            DEMO.rapida(n + (mem.funcoes[n] ? ': aparece no app.' : ': some do app.')); } })))))];
    }
  };
  function kpi(r, v, sub) { return el('div', { class: 'kpi' }, el('span', { class: 'rot', text: r }), el('strong', { class: 'numero', text: v }), sub ? el('span', { class: 'mini mudo', text: sub }) : null); }
  function campo(r, v, id) { const i = el('input', { class: 'entrada', id, inputmode: 'numeric', value: v }); return [el('label', { class: 'campo', for: id }, el('span', { text: r }), i), i]; }
  function chips(op) { let valor = op[op.length - 1]; const g = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Para quem' });
    g.className = 'seg'; const d = () => trocar(g, op.map(o => el('button', { type: 'button', role: 'radio', 'aria-checked': String(o === valor), 'aria-pressed': String(o === valor), onclick: () => { valor = o; d(); } }, o === valor ? ic('check', 'p') : null, o)));
    d(); return { no: g, valor: () => valor }; }
  function dados(pares) { return el('dl', { class: 'nutri' }, pares.map(([k, v]) => [el('dt', { text: k }), el('dd', {}, v)])); }

  // Ficha: cabeçalho, a semana em blocos, a evolução (42) e a linha do tempo por dia (41). Metas numa folha ao lado.
  function ficha(p) {
    const pesos = pesosDe(p), m = mem.metas[p.id] || { kcal: '1600', prot: '110', agua: '8' };
    const DIAS = [['Hoje', [['prato', '8h40', 'Café da manhã', '1 porção · 380 kcal'], ['sorriso', '8h10', 'Humor: bem', '"Dormi bem"']]],
      ['Ontem', [['seringa', '21h', 'Aplicação', 'Abdômen esquerdo · sem sintomas'], ['corrida', '19h', 'Caminhada', '30 min'], ['gota', '14h', 'Água', '6 copos'], ['camera', '12h30', 'Almoço', 'Foto do prato']]]];
    return [
      !dividido() ? el('button', { type: 'button', class: 'botao sec pilula', onclick: () => { est.ficha = false; desenhar(); } }, ic('voltar', 'p'), 'Pacientes') : null,
      el('section', { class: 'cartao cab-ficha' },
        el('div', { class: 'linha-h' }, el('span', { class: 'avatar grande', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
          el('div', { class: 'cresce' }, el(dividido() ? 'h2' : 'h1', { class: 'nome-ficha', text: p.nome }), el('p', { class: 'mudo peq', text: 'Fase: ' + p.fase + ' · último registro ' + p.ultimo })), etiqueta(p.estado)),
        p.alertas.length ? el('p', { class: 'aviso' + (p.estado === 'alerta' ? ' perigo' : '') }, ic('alerta', 'p'), el('span', {}, el('strong', { text: p.alertas[0] + '. ' }), p.motivo || '')) : null,
        el('div', { class: 'botoes' },
          el('button', { type: 'button', class: 'botao', onclick: () => editarMetas(p) }, ic('editar', 'p'), 'Editar metas'),
          el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Ligar para ' + p.nome, onclick: () => DEMO.rapida('Na demonstração, a ligação para ' + p.nome.split(' ')[0] + ' é simulada.') }, ic('telefone', 'p'), 'Ligar'))),
      el('section', { class: 'blocos-semana', 'aria-label': 'Resumo da semana' },
        bloco('Peso', fmt(pesos[pesos.length - 1]), 'kg', fmtPeso(p.peso) + ' na semana'),
        bloco('Adesão', String(p.adesao), '%', p.adesao >= 80 ? 'acima da média' : 'abaixo da média'),
        bloco('Proteína', String(Math.round(Number(m.prot) * (p.adesao / 100) * 0.95)), 'g/dia', 'meta: ' + m.prot + ' g'),
        bloco('Água', String(Math.max(3, Math.round(Number(m.agua) * p.adesao / 110))), 'copos', 'meta: ' + m.agua)),
      cartao('Evolução do peso', 42, grafico(pesos, 'Peso de ' + fmt(pesos[0]) + ' para ' + fmt(pesos[pesos.length - 1]) + ' kg nos últimos registros'),
        el('p', { class: 'mudo peq', text: 'Um ponto por semana · cintura ' + (86 + p.id) + ' cm' })),
      cartao('Ficha do app', 41, DIAS.map(([dia, itens]) => el('div', { class: 'dia-tempo' }, el('p', { class: 'sobretitulo', text: dia }),
        el('ol', { class: 'tempo' }, itens.map(([i, h, t, d]) => el('li', {}, el('span', { class: 'caixa-ic peq', 'aria-hidden': 'true' }, ic(i, 'p')),
          el('span', { class: 'cresce' }, el('span', { class: 't1', text: t }), el('span', { class: 't2', text: d })), el('time', { class: 'mudo peq tab', text: h })))))))];
  }
  const bloco = (r, v, un, sub) => el('div', { class: 'bloco-s' }, el('span', { class: 'rot', text: r }), el('span', { class: 'numero' }, v, el('small', { text: un })), el('span', { class: 'mini mudo', text: sub }));
  function editarMetas(p) {
    const m = mem.metas[p.id] || { kcal: '1600', prot: '110', agua: '8' };
    const kcal = campo('Calorias por dia (kcal)', m.kcal, 'f-kcal'), prot = campo('Proteína por dia (g)', m.prot, 'f-prot'), agua = campo('Água (copos por dia)', m.agua, 'f-agua');
    const f = DEMO.folha({ titulo: 'Metas de ' + p.nome.split(' ')[0], lateral: true, conteudo: [
      el('p', { class: 'mudo peq', text: 'A equipe define. ' + p.nome.split(' ')[0] + ' vê no app, na tela Hoje.' }), item(43), kcal[0], prot[0], agua[0],
      el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
        mem.metas[p.id] = { kcal: kcal[1].value, prot: prot[1].value, agua: agua[1].value };
        f.fechar(() => { DEMO.confirmar('Metas enviadas', 'Já aparecem no app de ' + p.nome.split(' ')[0]); desenhar(true); });
      } }, ic('enviar', 'p'), 'Salvar e enviar ao app')] });
  }
  // Gráfico de linha: área suave, faixa da meta e o ponto atual em destaque. O texto alternativo diz os números.
  function grafico(v, rotulo) {
    const W = 480, H = 180, min = Math.min(...v) - 1, max = Math.max(...v) + 0.6, x = i => 16 + i * (W - 32) / (v.length - 1), y = val => 16 + (max - val) / (max - min) * (H - 40);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': rotulo });
    const alvo = v[0] - 4;
    if (alvo > min) s.append(svg('rect', { x: 16, y: y(alvo + 0.5), width: W - 32, height: Math.max(4, y(alvo - 0.5) - y(alvo + 0.5)), class: 'faixa-meta', rx: 4 }));
    for (let i = 0; i < 3; i++) s.append(svg('line', { x1: 16, x2: W - 16, y1: 16 + i * (H - 40) / 2, y2: 16 + i * (H - 40) / 2, class: 'grade' }));
    const pts = v.map((val, i) => [x(i), y(val)]);
    s.append(svg('path', { d: 'M' + pts.map(p => p.join(' ')).join(' L') + ' L' + x(v.length - 1) + ' ' + (H - 24) + ' L16 ' + (H - 24) + 'Z', class: 'area' }));
    s.append(svg('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'traco' }));
    const u = pts[pts.length - 1]; s.append(svg('circle', { cx: u[0], cy: u[1], r: 9, class: 'halo' }), svg('circle', { cx: u[0], cy: u[1], r: 4.5, class: 'atual' }));
    v.forEach((_, i) => { const t = svg('text', { x: x(i), y: H - 6, class: 'eixo', 'text-anchor': 'middle' }); t.textContent = 'S' + (i + 1); s.append(t); });
    return s;
  }
  // Lista e ficha lado a lado a partir de 768 px (iPad e computador).
  const dividido = () => innerWidth >= 768;
  function abrirFicha(id) { est.paciente = id; est.aba = 'hoje'; est.ficha = true; desenhar(dividido()); if (dividido()) { const c = raiz.querySelector('.coluna-ficha'); if (c) c.scrollIntoView({ block: 'nearest' }); } }
  function irAba(a) { est.aba = a; est.ficha = false; DEMO.transicao(() => desenhar()); }
  let largura = innerWidth;
  addEventListener('resize', () => { if ((innerWidth >= 768) !== (largura >= 768)) { largura = innerWidth; if (DEMO.dados) desenhar(true); } largura = innerWidth; });
  function desenhar(mesma) {
    const p = PACIENTES.find(x => x.id === est.paciente);
    const soFicha = est.ficha && p && !dividido();
    const corpo = soFicha ? ficha(p) : TELAS[est.aba]();
    const d = DEMO.dados, nome = DEMO.nomeMedico().trim();
    const hora = new Date().getHours(), saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const dataHoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    trocar(raiz, DEMO.topo(nome + ' · ' + (d.especialidade || ''), 'entrada', el('a', { class: 'botao suave pilula so-largo', href: DEMO.link('app') }, ic('celular', 'p'), 'App do paciente')),
      el('div', { class: 'central' },
        soFicha ? null : el('div', { class: 'saudacao' }, el('p', { class: 'sobretitulo', text: dataHoje }), el('h1', { text: saud + ', ' + nome + '.' }),
          el('p', { class: 'mudo', text: 'Hoje: 3 consultas presenciais' + (d.cidade ? ' em ' + d.cidade : '') + ' e 1 por vídeo.' })),
        el('nav', { class: 'barra-abas vidro', 'aria-label': 'Partes da central' }, el('div', { class: 'seg' }, ABAS.map(([k, n]) => el('button', { type: 'button', 'aria-current': !soFicha && est.aba === k ? 'page' : null, onclick: () => irAba(k) }, n)))),
        el('main', { class: 'pilha-g conteudo-central', id: 'conteudo', tabindex: '-1' }, corpo)),
      el('div', { class: 'rodape-demo' }, el('a', { class: 'botao sec', href: DEMO.link('app') }, 'Ver o app do paciente'), el('a', { class: 'botao sec', href: DEMO.link('escopo') }, 'Montar o escopo'), DEMO.botaoConversar('leve')));
    DEMO.tela(soFicha || (est.ficha && dividido()) ? 'ficha' : est.aba);
    const ativa = raiz.querySelector('.barra-abas [aria-current="page"]'); if (ativa) ativa.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (!mesma) window.scrollTo(0, 0);
  }
  DEMO.iniciar({ pagina: 'central', raiz, montar: d => {
    document.title = 'Central do médico · ' + d.clinica;
    const pedida = DEMO.extra.tela;
    est.paciente = naTriagem()[0].id;
    if (pedida === 'ficha') { est.paciente = 1; est.ficha = true; } else if (TELAS[pedida]) est.aba = pedida;
    desenhar();
  } });
})();
