// Entrada da demonstração (DEC-125): título com o nome do médico e da clínica, o app de verdade num celular na tela
// (iPad e computador), os três caminhos em blocos e o progresso desta aba ("App ✓ · Central ✓ · Escopo —").
(function () {
  'use strict';
  const { el, trocar } = DEMO;
  const ic = (n, t) => window.DEMO_ICONE(n, t);
  const raiz = document.getElementById('raiz');
  const PARTES = [['app', 'App'], ['central', 'Central'], ['escopo', 'Escopo']];
  function progresso() {
    const v = DEMO.vistos();
    const feitas = PARTES.filter(([k]) => v[k]).length;
    return el('div', { class: 'progresso', role: 'group', 'aria-label': 'Você já viu ' + feitas + ' de 3 partes' },
      el('span', { class: 'prog-txt', text: 'Você já viu ' + feitas + ' de 3' }),
      el('span', { class: 'prog-partes' }, PARTES.map(([k, n]) => el('span', { class: 'passo-p' + (v[k] ? ' feito' : '') },
        v[k] ? ic('check', 'p') : el('span', { class: 'bolinha', 'aria-hidden': 'true' }), n, el('span', { class: 'sr', text: v[k] ? ': visto' : ': ainda não' })))));
  }
  // Mini ilustrações dos blocos (só desenho; o texto ao lado diz o que é).
  const svg = (tag, at) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
  function miniAneis() {
    const s = svg('svg', { viewBox: '0 0 120 120', class: 'mini-aneis', 'aria-hidden': 'true' });
    [[50, 72, 'a0'], [36, 58, 'a1'], [22, 80, 'a2']].forEach(([r, p, c]) => {
      s.append(svg('circle', { cx: 60, cy: 60, r, class: 'trilho' }));
      s.append(svg('circle', { cx: 60, cy: 60, r, class: c, pathLength: 100, 'stroke-dasharray': p + ' 100', 'stroke-linecap': 'round', transform: 'rotate(-90 60 60)' }));
    });
    return s;
  }
  const miniLista = () => el('div', { class: 'mini-lista', 'aria-hidden': 'true' },
    [['alerta', 'Relatou enjoo forte'], ['atencao', 'Perdeu a meta de proteína'], ['ok', 'Em dia']].map(([e, t]) => el('span', { class: 'mini-linha' }, el('i', { class: 'pt ' + e }), t)));
  const miniEscopo = () => el('div', { class: 'mini-escopo', 'aria-hidden': 'true' }, el('span', { class: 'on' }, 'Quero'), el('span', {}, 'Não preciso'), el('span', {}, 'Dúvida'));

  DEMO.iniciar({ pagina: 'entrada', raiz, montar: d => {
    document.title = 'Demonstração · ' + d.clinica;
    const nome = (d.tratamento ? d.tratamento + ' ' : '') + String(d.medico || '').split(' ')[0];
    const porta = (pagina, titulo, texto, icone, mini, cls) => el('a', { class: 'bento-bloco ' + (cls || ''), href: DEMO.link(pagina) },
      el('span', { class: 'linha-h' }, el('span', { class: 'caixa-ic' }, ic(icone)), el('span', { class: 'cresce' }), el('span', { class: 'ir', 'aria-hidden': 'true' }, ic('seta', 'p'))),
      el('span', { class: 'bento-txt' }, el('h2', { text: titulo }), el('span', { class: 'mudo', text: texto })), mini);
    const destaque = (icone, titulo, texto) => el('div', { class: 'bento-bloco destaque-b' }, el('span', { class: 'caixa-ic peq' }, ic(icone, 'p')), el('h3', { text: titulo }), el('p', { class: 'mudo peq', text: texto }));
    const prog = el('div', { class: 'prog-lugar' }, progresso());
    addEventListener('storage', e => { if (e.key === 'demo_visto') trocar(prog, progresso()); });
    const celular = el('div', { class: 'aparelho', role: 'region', 'aria-label': 'O app do paciente funcionando. Toque para usar.' },
      el('div', { class: 'tela-aparelho' }, el('iframe', { title: 'App do paciente da ' + 'demonstração', src: DEMO.link('app', { embed: '1', tela: 'inicio' }), loading: 'lazy' })),
      el('p', { class: 'legenda-aparelho mini mudo' }, ic('info', 'p'), 'É o app de verdade. Toque para usar.'));
    trocar(raiz, DEMO.topo('Demonstração preparada pela RXSync', null, DEMO.botaoConversar('suave pilula conversar-topo')),
      el('main', { class: 'pagina pagina-entrada', id: 'conteudo' },
        el('section', { class: 'heroi-e' },
          el('div', { class: 'texto-heroi' },
            el('p', { class: 'sobretitulo', text: 'Demonstração preparada para você' }),
            el('h1', { class: 'titulo-display', text: nome + ', este app já está com a sua marca.' }),
            el('p', { class: 'marca-clinica' }, el('span', { class: 'selo', 'aria-hidden': 'true', text: DEMO.iniciais(d.clinica) }), el('span', { class: 'cresce', text: d.clinica })),
            el('p', { class: 'lead', text: 'O app que seus pacientes usam no dia a dia e a central onde você acompanha cada um, com o nome e a cor da sua clínica.' }),
            el('div', { class: 'botoes' }, el('a', { class: 'botao grande', href: DEMO.link('app') }, 'Abrir o app do paciente', ic('seta', 'p')),
              el('a', { class: 'botao sec grande', href: DEMO.link('central') }, 'Ver a central')),
            prog,
            el('p', { class: 'mudo peq', text: 'Os pacientes são de mentira. Os marcadores "item" levam ao item no escopo.' })),
          celular),
        el('nav', { class: 'bento', 'aria-label': 'Partes da demonstração' },
          porta('app', 'App do paciente', 'Registros do dia, picadinha, evolução, consultas e os chats.', 'celular', miniAneis(), 'grande revelar'),
          porta('central', 'Central do médico', 'Quem precisa da sua atenção hoje, a ficha e as metas.', 'estetoscopio', miniLista(), 'revelar'),
          porta('escopo', 'Montar o escopo', 'Marque o que você quer, o que não precisa e o que tem dúvida.', 'lista', miniEscopo(), 'revelar'),
          destaque('chave', 'Sem senha', 'O paciente entra pelo link que a clínica manda.'),
          destaque('cadeado', 'Nenhuma conta de dose', 'A picadinha mostra o que a equipe cadastrou, travado.'),
          destaque('paleta', 'Com a cara da clínica', 'O nome e a cor da clínica em todas as telas.')),
        el('footer', { class: 'rodape-demo' }, el('p', { class: 'mudo', text: 'Quer falar sobre o app para a sua clínica?' }), DEMO.botaoConversar(),
          el('p', { class: 'mudo peq', style: 'flex-basis:100%;text-align:center' }, 'RXSync · ', el('a', { href: DEMO.raizSite() + 'privacidade.html#demonstracao' }, 'Privacidade')))));
    DEMO.tela('inicio');
  } });
})();
