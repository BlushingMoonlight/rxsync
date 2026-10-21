// Entrada da demonstração (DEC-125): o título com o nome do médico e da clínica e os três caminhos: o app do paciente e a
// central do médico (o produto) e, separado, o escopo (a proposta). No iPad e no computador, o app roda num celular na
// tela. O progresso ("Você já viu 1 de 3") fica só na memória da aba.
(function () {
  'use strict';
  const { el, trocar } = DEMO;
  const ic = (n, t) => window.DEMO_ICONE(n, t);
  const raiz = document.getElementById('raiz');
  const PARTES = [['app', 'App do paciente'], ['central', 'Central do médico'], ['escopo', 'Escopo']];
  function progresso() {
    const v = DEMO.vistos(), feitas = PARTES.filter(([k]) => v[k]).length;
    return el('div', { class: 'progresso', role: 'group', 'aria-label': 'Você já viu ' + feitas + ' de 3 partes' },
      el('span', { class: 'prog-txt', text: 'Você já viu ' + feitas + ' de 3' }),
      el('span', { class: 'prog-partes' }, PARTES.map(([k, n]) => el('span', { class: 'passo-p' + (v[k] ? ' feito' : '') },
        v[k] ? ic('check', 'p') : el('span', { class: 'bolinha', 'aria-hidden': 'true' }), n, el('span', { class: 'sr', text: v[k] ? ': visto' : ': ainda não' })))));
  }
  const svg = (tag, at) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
  function miniAneis() {
    const s = svg('svg', { viewBox: '0 0 120 120', class: 'mini-aneis', 'aria-hidden': 'true' });
    [[50, 80, 'a0'], [36, 76, 'a1'], [22, 75, 'a2']].forEach(([r, p, c]) => {
      s.append(svg('circle', { cx: 60, cy: 60, r, class: 'trilho' }));
      s.append(svg('circle', { cx: 60, cy: 60, r, class: c, pathLength: 100, 'stroke-dasharray': p + ' 100', 'stroke-linecap': 'round', transform: 'rotate(-90 60 60)' }));
    });
    return s;
  }
  const miniLista = () => el('div', { class: 'mini-lista', 'aria-hidden': 'true' },
    [['alerta', 'Relatou enjoo forte'], ['atencao', 'Proteína abaixo da meta'], ['ok', 'Em dia']].map(([e, t]) => el('span', { class: 'mini-linha' }, el('i', { class: 'pt ' + e }), t)));

  DEMO.iniciar({ pagina: 'entrada', raiz, montar: d => {
    document.title = 'Demonstração · ' + d.clinica;
    const nome = (d.tratamento ? d.tratamento + ' ' : '') + String(d.medico || '').split(' ')[0];
    const produto = (pagina, rotulo, titulo, texto, icone, mini) => el('a', { class: 'bento-bloco produto-b', href: DEMO.link(pagina) },
      el('span', { class: 'linha-h' }, el('span', { class: 'caixa-ic' }, ic(icone)), el('span', { class: 'sobretitulo cresce', text: rotulo }), el('span', { class: 'ir', 'aria-hidden': 'true' }, ic('seta', 'p'))),
      el('span', { class: 'bento-txt' }, el('h2', { text: titulo }), el('span', { class: 'mudo', text: texto })), mini);
    const prog = el('div', { class: 'prog-lugar' }, progresso());
    addEventListener('storage', e => { if (e.key === 'demo_visto') trocar(prog, progresso()); });
    const celular = el('div', { class: 'aparelho', role: 'region', 'aria-label': 'O app do paciente funcionando. Toque para usar.' },
      el('div', { class: 'tela-aparelho' }, el('iframe', { title: 'App do paciente', src: DEMO.link('app', { embed: '1', tela: 'inicio' }), loading: 'lazy' })),
      el('p', { class: 'legenda-aparelho mini mudo' }, ic('info', 'p'), 'É o app de verdade. Toque para usar.'));
    trocar(raiz, DEMO.faixaDemo('inicio'),
      el('main', { class: 'pagina pagina-entrada', id: 'conteudo' },
        el('section', { class: 'heroi-e' },
          el('div', { class: 'texto-heroi' },
            el('p', { class: 'sobretitulo', text: 'Demonstração preparada para você' }),
            el('h1', { class: 'titulo-display', text: nome + ', este app já está com a sua marca.' }),
            el('p', { class: 'marca-clinica' }, el('span', { class: 'selo', 'aria-hidden': 'true', text: DEMO.iniciais(d.clinica) }), el('span', { class: 'cresce', text: d.clinica })),
            el('p', { class: 'lead', text: 'Veja o app que seus pacientes usam no dia a dia e a central onde a equipe acompanha cada um. Depois, monte o escopo do que entra no app da sua clínica.' }),
            el('div', { class: 'botoes' }, el('a', { class: 'botao grande', href: DEMO.link('app') }, 'Abrir o app do paciente', ic('seta', 'p')),
              el('a', { class: 'botao sec grande', href: DEMO.link('central') }, 'Abrir a central do médico')),
            prog,
            el('p', { class: 'mudo peq', text: 'Os pacientes são de mentira. O app e a central mostram os mesmos dados: o que você fizer num aparece no outro.' })),
          celular),
        el('section', { class: 'caminhos', 'aria-labelledby': 'tit-produto' },
          el('h2', { class: 'sobretitulo', id: 'tit-produto', text: 'O produto' }),
          el('div', { class: 'bento' },
            produto('app', 'Para o paciente', 'App do paciente', 'Refeições, água, sono, aplicações, evolução, consultas e o chat com a equipe.', 'celular', miniAneis()),
            produto('central', 'Para a equipe', 'Central do médico', 'Quem precisa de atenção hoje e por quê, a ficha de cada paciente, as metas e as prescrições.', 'estetoscopio', miniLista()))),
        el('section', { class: 'caminho-escopo', 'aria-labelledby': 'tit-escopo' },
          el('h2', { class: 'sobretitulo', id: 'tit-escopo', text: 'A proposta' }),
          el('a', { class: 'documento-b', href: DEMO.link('escopo') },
            el('span', { class: 'folha-doc', 'aria-hidden': 'true' }, el('i'), el('i'), el('i', { class: 'curta' }), el('i'), el('i', { class: 'curta' })),
            el('span', { class: 'cresce' }, el('span', { class: 'sobretitulo', text: 'Escopo · 46 itens' }), el('strong', { class: 'titulo-doc', text: 'Monte o escopo do app da sua clínica' }),
              el('span', { class: 'mudo', text: 'Para cada item: Quero, Não preciso ou Tenho dúvida. As escolhas ficam guardadas e você envia para a RXSync quando quiser.' })),
            el('span', { class: 'ir', 'aria-hidden': 'true' }, ic('seta', 'p')))),
        el('footer', { class: 'rodape-demo' }, el('p', { class: 'mudo peq' }, 'RXSync · ', el('a', { href: DEMO.raizSite() + 'privacidade.html#demonstracao' }, 'Privacidade')))));
    DEMO.tela('inicio');
  } });
})();
