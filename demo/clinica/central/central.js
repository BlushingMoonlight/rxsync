// Central do médico da demonstração (DEC-125): itens 39 a 46 do escopo. Pacientes de mentira, nada é guardado.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const raiz = document.getElementById('raiz');
  const naoGuarda = () => DEMO.rapida('Na demonstração, nada é guardado.');
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

  const TELAS = {
    pacientes: () => [cartao('Pacientes da semana', 39,
      el('p', { class: 'mudo peq', text: 'Hoje: 3 consultas' + (DEMO.dados.cidade ? ' presenciais em ' + DEMO.dados.cidade : ' presenciais') + ' e 1 por vídeo.' }),
      el('div', { class: 'kpis' }, kpi('Pacientes no app', '8'), kpi('Adesão média', '75%'), kpi('Com alerta', '4')),
      el('ul', { class: 'lista-pac' }, PACIENTES.map(linhaPaciente)))],
    alertas: () => [cartao('Alertas', 40, el('ul', { class: 'lista-pac' }, PACIENTES.filter(p => p.alertas.length).map(p => el('li', {}, el('button', { type: 'button', class: 'linha-pac', onclick: () => abrirFicha(p.id) },
      el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }), el('span', { class: 'cresce' }, el('span', { class: 't1', text: p.alertas[0] }), el('span', { class: 't2', text: p.nome + ' · ' + p.ultimo })),
      el('span', { class: 'etq perigo', text: 'ver' }))))))],
    metas: () => [cartao('Metas e plano alimentar', 43, el('p', { class: 'mudo peq', text: 'A equipe define; chega ao app do paciente.' }),
      el('label', { class: 'campo' }, el('span', { text: 'Paciente' }), el('select', { class: 'entrada' }, PACIENTES.map(p => el('option', { text: p.nome })))),
      el('div', { class: 'form-2' }, campo('Calorias por dia (kcal)', '1600'), campo('Proteína por dia (g)', '110'), campo('Água (copos)', '8')),
      el('label', { class: 'campo' }, el('span', { text: 'Plano alimentar' }), el('textarea', { class: 'entrada', rows: '4' }, 'Café: ovos mexidos, pão integral e fruta.\nAlmoço: arroz, feijão, frango e salada.')),
      el('button', { type: 'button', class: 'botao', onclick: naoGuarda }, 'Enviar ao app'))],
    picadinha: () => [cartao('Prescrição da picadinha', 44, el('p', { class: 'mudo peq', text: 'A equipe cadastra o que foi prescrito; a enfermagem confere antes de aparecer no app. O app não calcula nem muda dose.' }),
      el('ul', { class: 'lista-pac' }, [['Mariana Alves', 'conferida pela enfermagem', 'ok'], ['Beatriz Lima', 'esperando a conferência', 'atencao'], ['Luana Martins', 'conferida pela enfermagem', 'ok']].map(([n, s, tom]) =>
        el('li', {}, el('div', { class: 'linha-pac' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: DEMO.iniciais(n) }),
          el('span', { class: 'cresce' }, el('span', { class: 't1', text: n }), el('span', { class: 't2', text: 'Medicamento A · dose e volume como prescritos · 1 vez por semana' })),
          tom === 'ok' ? el('span', { class: 'etq ok', text: s }) : el('button', { type: 'button', class: 'botao sec', onclick: naoGuarda }, 'Conferir'))))),
      el('button', { type: 'button', class: 'botao', onclick: naoGuarda }, 'Cadastrar prescrição'))],
    avisos: () => [cartao('Avisos e conteúdo', 45, el('p', { class: 'mudo peq', text: 'Para quem?' }), chips(['Um paciente', 'Um grupo', 'Todos']),
      el('label', { class: 'campo' }, el('span', { text: 'Recado' }), el('textarea', { class: 'entrada', rows: '3' }, 'A clínica estará fechada no feriado de sexta.')),
      el('button', { type: 'button', class: 'botao', onclick: naoGuarda }, 'Enviar recado'),
      el('h3', { class: 'mt', text: 'Conteúdo da clínica' }), el('ul', { class: 'lista-simples' }, ['Vídeo: como montar o prato', 'Artigo: proteína em cada refeição', 'Receita: omelete de forno com legumes'].map(t => el('li', { text: t }))))],
    funcoes: () => [cartao('Funções do app', 46, el('p', { class: 'mudo peq', text: 'A clínica liga e desliga cada parte do app.' }),
      el('ul', { class: 'lista-simples' }, [['Refeições e plano alimentar', true], ['Água, sono e atividade', true], ['Humor, fome e intestino', true], ['Outros registros (álcool, tabaco e ciclo)', false], ['Picadinha', true],
        ['Fotos de progresso', true], ['Chat com a equipe', true], ['Assistente de dúvidas', false], ['Conquistas', true]].map(([n, lig]) => el('li', {}, el('span', { class: 'cresce', text: n }),
        el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': String(lig), 'aria-label': n, onclick: e => e.currentTarget.setAttribute('aria-checked', String(e.currentTarget.getAttribute('aria-checked') !== 'true')) })))))]
  };
  function kpi(r, v) { return el('div', { class: 'kpi' }, el('span', { class: 'mudo peq', text: r }), el('strong', { text: v })); }
  function campo(r, v) { return el('label', { class: 'campo' }, el('span', { text: r }), el('input', { class: 'entrada', inputmode: 'numeric', value: v })); }
  function chips(op) { const g = el('div', { class: 'chips', role: 'group', 'aria-label': 'Para quem' }); op.forEach((o, i) => g.append(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(i === 0),
    onclick: e => g.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === e.currentTarget))) }, o))); return g; }

  // Ficha do app: a linha do tempo (41) e a evolução (42).
  function ficha(p) {
    const pesos = [78.4, 77.9, 77.1, 76.6, 76.2, 75.4].map(x => +(x + (p.id - 1) * 2.3).toFixed(1));
    return [el('button', { type: 'button', class: 'botao sec', onclick: () => { est.paciente = null; desenhar(); } }, '‹ Voltar aos pacientes'),
      el('div', { class: 'linha-h' }, el('span', { class: 'avatar grande', 'aria-hidden': 'true', text: DEMO.iniciais(p.nome) }),
        el('div', { class: 'cresce' }, el('h1', { text: p.nome }), el('p', { class: 'mudo peq', text: 'Fase: ' + p.fase + ' · adesão ' + p.adesao + '%' }))),
      p.alertas.length ? el('p', { class: 'aviso', text: '⚠ ' + p.alertas.join(' · ') }) : null,
      cartao('Ficha do app', 41, el('ol', { class: 'tempo' }, [['hoje, 8h40', 'Café da manhã · 1 porção · 380 kcal'], ['hoje, 8h10', 'Humor 🙂 · "dormi bem"'], ['ontem, 21h', 'Aplicação · abdômen esquerdo · sem sintomas'],
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
  function desenhar() {
    const p = PACIENTES.find(x => x.id === est.paciente);
    const corpo = p ? ficha(p) : TELAS[est.aba]();
    trocar(raiz, DEMO.topo(DEMO.nomeMedico() + ' · ' + (DEMO.dados.especialidade || ''), 'entrada'),
      el('div', { class: 'central' },
        el('nav', { class: 'abas-central', 'aria-label': 'Partes da central' }, ABAS.map(([k, n]) => el('button', { type: 'button', 'aria-current': !p && est.aba === k ? 'page' : null, onclick: () => irAba(k) }, n))),
        el('main', { class: 'pilha conteudo-central', id: 'conteudo', tabindex: '-1' }, corpo)),
      el('div', { class: 'rodape-demo' }, el('a', { class: 'botao sec', href: DEMO.link('app') }, 'Ver o app do paciente'), el('a', { class: 'botao sec', href: DEMO.link('escopo') }, 'Montar o escopo'), DEMO.botaoConversar('leve')));
    DEMO.tela(p ? 'ficha' : est.aba);
    window.scrollTo(0, 0);
  }
  DEMO.iniciar({ pagina: 'central', raiz, montar: d => {
    document.title = 'Central do médico · ' + d.clinica;
    const pedida = DEMO.extra.tela;
    if (pedida === 'ficha') est.paciente = 1; else if (TELAS[pedida]) est.aba = pedida;
    desenhar();
  } });
})();
