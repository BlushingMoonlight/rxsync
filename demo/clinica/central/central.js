// Central do médico da demonstração (DEC-125): itens 39 a 46 do escopo. Pacientes de mentira; tudo fica na memória da página.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const ic = (n, t) => window.DEMO_ICONE(n, t);
  const raiz = document.getElementById('raiz');
  const PACIENTES = [
    { id: 1, nome: 'Mariana Alves', adesao: 92, peso: -3.0, ultimo: 'hoje, 8h40', alertas: [], fase: 'Adaptação' },
    { id: 2, nome: 'João Pereira', adesao: 48, peso: -0.6, ultimo: 'há 4 dias', alertas: ['Parou de registrar'], fase: 'Manutenção' },
    { id: 3, nome: 'Beatriz Lima', adesao: 81, peso: -1.8, ultimo: 'ontem, 21h', alertas: ['Relatou enjoo forte'], fase: 'Adaptação' },
    { id: 4, nome: 'Carlos Souza', adesao: 67, peso: 0.4, ultimo: 'hoje, 7h15', alertas: ['Perdeu a meta de proteína'], fase: 'Ajuste' },
    { id: 5, nome: 'Fernanda Rocha', adesao: 95, peso: -2.2, ultimo: 'hoje, 9h02', alertas: [], fase: 'Manutenção' },
    { id: 6, nome: 'Ricardo Nunes', adesao: 74, peso: -1.1, ultimo: 'ontem, 19h', alertas: [], fase: 'Adaptação' },
    { id: 7, nome: 'Luana Martins', adesao: 88, peso: -2.7, ultimo: 'hoje, 6h50', alertas: [], fase: 'Ajuste' },
    { id: 8, nome: 'Paulo Henrique', adesao: 55, peso: -0.2, ultimo: 'há 2 dias', alertas: ['Intestino preso há 3 dias'], fase: 'Adaptação' }
  ];
  const ABAS = [['pacientes', 'Pacientes'], ['alertas', 'Alertas'], ['metas', 'Metas e plano'], ['picadinha', 'Picadinha'], ['avisos', 'Avisos e conteúdo'], ['funcoes', 'Funções do app']];
  const est = { aba: 'pacientes', paciente: null };
  const fmtPeso = v => (v > 0 ? '+' : '') + String(v).replace('.', ',') + ' kg';
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'linha-h cab-cartao' }, el('h2', { class: 'cresce', text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const tomAdesao = a => a >= 80 ? 'ok' : a >= 60 ? 'atencao' : 'perigo';

  const linhaPaciente = p => el('li', {}, el('button', { type: 'button', class: 'linha-pac', onclick: () => abrirFicha(p.id) },
    el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
    el('span', { class: 'cresce' }, el('span', { class: 't1', text: p.nome }), el('span', { class: 't2', text: 'último registro ' + p.ultimo + ' · ' + fmtPeso(p.peso) + ' na semana · ' + p.fase })),
    p.alertas.length ? el('span', { class: 'etq perigo', text: p.alertas.length + ' alerta' }) : null,
    el('span', { class: 'etq ' + tomAdesao(p.adesao), text: p.adesao + '% de adesão' })));

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
    pacientes: () => [cartao('Pacientes da semana', 39,
      el('p', { class: 'mudo peq', text: 'Hoje: 3 consultas' + (DEMO.dados.cidade ? ' presenciais em ' + DEMO.dados.cidade : ' presenciais') + ' e 1 por vídeo.' }),
      el('div', { class: 'kpis' }, kpi('No app', '8'), kpi('Adesão média', '75%'), kpi('Com alerta', '4')),
      el('ul', { class: 'lista-pac' }, PACIENTES.map(linhaPaciente)))],
    alertas: () => [cartao('Alertas', 40, el('p', { class: 'mudo peq', text: 'Toque para abrir a ficha do paciente.' }),
      el('ul', { class: 'lista-pac' }, PACIENTES.filter(p => p.alertas.length).map(p => el('li', {}, el('button', { type: 'button', class: 'linha-pac', onclick: () => abrirFicha(p.id) },
        el('span', { class: 'avatar alerta', 'aria-hidden': 'true' }, ic('alerta')), el('span', { class: 'cresce' }, el('span', { class: 't1', text: p.alertas[0] }), el('span', { class: 't2', text: p.nome + ' · ' + p.ultimo })),
        ic('seta', 'p'))))))],
    metas: () => {
      const r = status(), m = mem.metas[mem.metasPac] || { kcal: '1600', prot: '110', agua: '8' };
      const pac = el('select', { class: 'entrada', id: 'metas-paciente', onchange: e => { mem.metasPac = Number(e.target.value); desenhar(true); } }, PACIENTES.map(p => el('option', { value: p.id, text: p.nome, selected: p.id === mem.metasPac })));
      const kcal = campo('Calorias por dia (kcal)', m.kcal, 'm-kcal'), prot = campo('Proteína por dia (g)', m.prot, 'm-prot'), agua = campo('Água (copos)', m.agua, 'm-agua');
      const nome = () => PACIENTES.find(p => p.id === mem.metasPac).nome;
      return [cartao('Metas e plano alimentar', 43, el('p', { class: 'mudo peq', text: 'A equipe define. O paciente vê no app.' }),
        el('label', { class: 'campo', for: 'metas-paciente' }, el('span', { text: 'Paciente' }), pac),
        el('div', { class: 'form-2' }, kcal[0], prot[0], agua[0]),
        el('label', { class: 'campo' }, el('span', { text: 'Plano alimentar' }), el('textarea', { class: 'entrada', rows: '4' }, 'Café: ovos mexidos, pão integral e fruta.\nAlmoço: arroz, feijão, frango e salada.')),
        r, el('button', { type: 'button', class: 'botao', onclick: () => {
          mem.metas[mem.metasPac] = { kcal: kcal[1].value, prot: prot[1].value, agua: agua[1].value };
          ok(r, 'Enviado ao app de ' + nome() + '. As metas novas já aparecem na tela inicial dela.');
        } }, ic('enviar', 'p'), 'Enviar ao app'))];
    },
    picadinha: () => {
      const r = status();
      const pac = el('select', { class: 'entrada', id: 'presc-paciente' }, PACIENTES.map(p => el('option', { value: p.nome, text: p.nome })));
      const travado = t => el('span', { class: 'travado' }, ic('cadeado', 'p'), t);
      return [cartao('Prescrição da picadinha', 44, el('p', { class: 'mudo peq', text: 'A equipe cadastra o que o médico prescreveu. A enfermagem confere antes de aparecer no app. O app não calcula nem muda dose.' }),
        el('ul', { class: 'lista-pac' }, mem.prescricoes.map(x => el('li', {}, el('div', { class: 'linha-pac' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(x.nome) }),
          el('span', { class: 'cresce' }, el('span', { class: 't1', text: x.nome }), el('span', { class: 't2', text: 'Medicamento cadastrado pela equipe · 1 vez por semana' })),
          x.conferida ? el('span', { class: 'etq ok' }, ic('check', 'p'), 'Conferida') : [el('span', { class: 'etq atencao', text: 'Esperando a conferência' }),
            el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Conferir a prescrição de ' + x.nome, onclick: () => { x.conferida = true; desenhar(true); DEMO.rapida('Conferida. Agora aparece no app de ' + x.nome + '.'); } }, 'Conferir')]))))),
      cartao('Cadastrar prescrição', null, el('label', { class: 'campo', for: 'presc-paciente' }, el('span', { text: 'Paciente' }), pac),
        dados([['Medicamento', travado('Escolhido pela equipe')], ['Dose', travado('A equipe preenche')], ['Concentração', travado('A equipe preenche')], ['Volume', travado('A equipe preenche')], ['Frequência', '1 vez por semana']]),
        el('p', { class: 'mudo peq', text: 'Na demonstração, estes campos ficam travados.' }), r,
        el('button', { type: 'button', class: 'botao', onclick: () => {
          mem.prescricoes.push({ id: Date.now(), nome: pac.value, conferida: false }); desenhar(true);
          DEMO.rapida('Prescrição de ' + pac.value + ' cadastrada. Agora a enfermagem confere.');
        } }, 'Cadastrar prescrição'))];
    },
    avisos: () => {
      const para = chips(['Um paciente', 'Um grupo', 'Todos os pacientes']), texto = el('textarea', { class: 'entrada', id: 'recado-texto', rows: '3', maxlength: '300' }, 'Traga os exames de sangue no retorno.');
      const erro = el('p', { class: 'erro', role: 'alert' });
      return [cartao('Avisos e conteúdo', 45, el('p', { class: 'rot', text: 'Para quem?' }), para.no,
        el('label', { class: 'campo', for: 'recado-texto' }, el('span', { text: 'Recado' }), texto), erro,
        el('button', { type: 'button', class: 'botao', onclick: () => {
          if (!texto.value.trim()) { erro.textContent = 'Escreva o recado.'; return; }
          const quem = para.valor() === 'Um paciente' ? 'Mariana Alves' : para.valor() === 'Um grupo' ? 'Grupo "Adaptação" (4 pacientes)' : 'Todos os pacientes (8)';
          mem.recados.unshift({ para: quem, texto: texto.value.trim().slice(0, 300), quando: 'agora' }); desenhar(true); DEMO.rapida('Recado enviado: ' + quem + '.');
        } }, ic('enviar', 'p'), 'Enviar recado')),
      cartao('Recados enviados', null, el('ul', { class: 'lista-simples' }, mem.recados.map(x => el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: x.para }), el('br'), el('span', { class: 'peq', text: x.texto })), el('span', { class: 'mudo peq', text: x.quando }))))),
      cartao('Conteúdo da clínica', null, el('ul', { class: 'lista-simples' }, ['Vídeo: como montar o prato', 'Artigo: proteína em cada refeição', 'Receita: omelete de forno com legumes'].map(t => el('li', { text: t }))))];
    },
    funcoes: () => [cartao('Funções do app', 46, el('p', { class: 'mudo peq', text: 'A clínica liga e desliga cada parte do app.' }),
      el('ul', { class: 'lista-simples' }, Object.entries(mem.funcoes).map(([n, lig]) => el('li', {}, el('span', { class: 'cresce', text: n }),
        el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': String(lig), 'aria-label': n, onclick: e => { mem.funcoes[n] = !mem.funcoes[n]; e.currentTarget.setAttribute('aria-checked', String(mem.funcoes[n]));
          DEMO.rapida(n + (mem.funcoes[n] ? ': aparece no app.' : ': some do app.')); } })))))]
  };
  function kpi(r, v) { return el('div', { class: 'kpi' }, el('span', { class: 'mudo peq', text: r }), el('strong', { text: v })); }
  function campo(r, v, id) { const i = el('input', { class: 'entrada', id, inputmode: 'numeric', value: v }); return [el('label', { class: 'campo', for: id }, el('span', { text: r }), i), i]; }
  function chips(op) { let valor = op[op.length - 1]; const g = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Para quem' });
    const d = () => trocar(g, op.map(o => el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(o === valor), 'aria-pressed': String(o === valor), onclick: () => { valor = o; d(); } }, o === valor ? ic('check', 'p') : null, o)));
    d(); return { no: g, valor: () => valor }; }
  function dados(pares) { return el('dl', { class: 'nutri' }, pares.map(([k, v]) => [el('dt', { text: k }), el('dd', {}, v)])); }

  // Ficha do app: a linha do tempo (41) e a evolução (42).
  function ficha(p) {
    const pesos = [78.4, 77.9, 77.1, 76.6, 76.2, 75.4].map(x => +(x + (p.id - 1) * 2.3).toFixed(1));
    return [el('button', { type: 'button', class: 'botao sec', onclick: () => { est.paciente = null; desenhar(); } }, ic('voltar', 'p'), 'Voltar aos pacientes'),
      el('div', { class: 'linha-h' }, el('span', { class: 'avatar grande', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
        el('div', { class: 'cresce' }, el('h1', { text: p.nome }), el('p', { class: 'mudo peq', text: 'Fase: ' + p.fase + ' · adesão ' + p.adesao + '%' }))),
      p.alertas.length ? el('p', { class: 'aviso linha-h' }, ic('alerta', 'p'), p.alertas.join(' · ')) : null,
      cartao('Ficha do app', 41, el('ol', { class: 'tempo' }, [['hoje, 8h40', 'Café da manhã · 1 porção · 380 kcal'], ['hoje, 8h10', 'Humor: bem · "dormi bem"'], ['ontem, 21h', 'Aplicação · abdômen esquerdo · sem sintomas'],
        ['ontem, 19h', 'Caminhada · 30 min'], ['ontem, 14h', 'Água · 6 copos'], ['ontem, 12h30', 'Almoço · foto do prato']].map(([q, o]) => el('li', {}, el('span', { class: 'mudo peq', text: q }), el('span', { text: o }))))),
      cartao('Evolução do paciente', 42, grafico(pesos, 'Peso de ' + pesos[0] + ' para ' + pesos[pesos.length - 1] + ' kg'),
        el('dl', { class: 'nutri' }, [['Peso', String(pesos[pesos.length - 1]).replace('.', ',') + ' kg'], ['Variação', fmtPeso(+(pesos[pesos.length - 1] - pesos[0]).toFixed(1))], ['Cintura', (86 + p.id) + ' cm']].map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])))];
  }
  function grafico(v, rotulo) {
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), min = Math.min(...v) - 0.5, max = Math.max(...v) + 0.5;
    s.setAttribute('viewBox', '0 0 300 120'); s.setAttribute('class', 'grafico'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo);
    const p = document.createElementNS(ns, 'polyline'); p.setAttribute('points', v.map((x, i) => (10 + i * 56) + ',' + (110 - (x - min) / (max - min) * 100)).join(' '));
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '3'); s.append(p); return s;
  }
  function abrirFicha(id) { est.paciente = id; desenhar(); }
  function irAba(a) { est.aba = a; est.paciente = null; desenhar(); }
  function desenhar(mesma) {
    const p = PACIENTES.find(x => x.id === est.paciente);
    const corpo = p ? ficha(p) : TELAS[est.aba]();
    trocar(raiz, DEMO.topo(DEMO.nomeMedico() + ' · ' + (DEMO.dados.especialidade || ''), 'entrada'),
      el('div', { class: 'central' },
        el('nav', { class: 'abas-central', 'aria-label': 'Partes da central' }, ABAS.map(([k, n]) => el('button', { type: 'button', 'aria-current': !p && est.aba === k ? 'page' : null, onclick: () => irAba(k) }, n))),
        el('main', { class: 'pilha conteudo-central', id: 'conteudo', tabindex: '-1' }, corpo)),
      el('div', { class: 'rodape-demo' }, el('a', { class: 'botao sec', href: DEMO.link('app') }, 'Ver o app do paciente'), el('a', { class: 'botao sec', href: DEMO.link('escopo') }, 'Montar o escopo'), DEMO.botaoConversar('leve')));
    DEMO.tela(p ? 'ficha' : est.aba);
    if (!mesma) window.scrollTo(0, 0);
  }
  DEMO.iniciar({ pagina: 'central', raiz, montar: d => {
    document.title = 'Central do médico · ' + d.clinica;
    const pedida = DEMO.extra.tela;
    if (pedida === 'ficha') est.paciente = 1; else if (TELAS[pedida]) est.aba = pedida;
    desenhar();
  } });
})();
