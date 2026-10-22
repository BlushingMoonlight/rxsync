// Manual de uso (proposta, ao lado do escopo): dois manuais, "App do paciente" e "Central da equipe", e os fluxogramas,
// todos gerados de comum/manual.js. Busca, sumário e "Ver na tela" (abre a tela certa na demonstração).
// O registro de uso vai como a página "escopo" (o servidor só conhece entrada, app, central e escopo), telas manual-*.
(function () {
  'use strict';
  const { el, trocar } = DEMO;
  const ic = (n, t) => window.DEMO_ICONE(n, t || 'p');
  const raiz = document.getElementById('raiz');
  const MAN = window.DEMO_MANUAL;
  const ABAS = [['app', 'App do paciente'], ['central', 'Central da equipe'], ['fluxos', 'Fluxogramas']];
  const est = { aba: ABAS.some(a => a[0] === DEMO.extra.tela) ? DEMO.extra.tela : 'app', busca: '' };
  const itemT = n => ((window.DEMO_ITENS || []).find(x => x.n === n) || { t: '' }).t;
  const ancora = (parte, tela) => 'man-' + parte + '-' + tela;

  const verNaTela = (parte, tela) => el('a', { class: 'botao suave pilula ver-tela', href: DEMO.link(parte, { tela }) }, ic('olho'), 'Ver na tela');
  function secaoTela(t, parte) {
    const bloco = (titulo, ...c) => el('div', { class: 'man-bloco' }, el('h4', { text: titulo }), c);
    return el('section', { class: 'man-tela', id: ancora(parte, t.tela), 'data-tela': t.tela, 'data-parte': parte },
      el('header', { class: 'man-cab' }, el('div', { class: 'cresce' }, el('p', { class: 'sobretitulo', text: (est.busca ? MAN.partes[parte].titulo + ' · ' : '') + 'Quem usa: ' + t.para }), el('h3', { text: t.titulo })), verNaTela(parte, t.tela)),
      el('p', { text: t.oque }),
      bloco('Passo a passo', el('ol', { class: 'man-passos' }, t.passos.map(p => el('li', { text: p })))),
      el('div', { class: 'man-duas' },
        bloco('De onde vêm os dados', el('ul', {}, t.dados.map(d => el('li', { text: d })))),
        bloco(parte === 'app' ? 'O que acontece na central' : 'O que acontece no app', el('p', { text: t.outroLado }))),
      bloco('Por quê', el('p', { text: t.porque })),
      t.elementos.length ? el('details', { class: 'man-det' }, el('summary', {}, 'O que tem na tela (' + t.elementos.length + ')'),
        el('dl', { class: 'man-elementos' }, t.elementos.map(x => [el('dt', {}, el('span', { class: 'etiqueta', text: x.tipo }), x.nome), el('dd', { text: x.desc || '—' })]))) : null,
      t.estados.length ? el('div', { class: 'man-estados' }, t.estados.map(x => el('p', { class: 'peq' }, el('strong', { text: maiuscula(x.estado) + ': ' }), x.desc))) : null,
      el('p', { class: 'man-itens mini mudo' }, 'Itens do escopo: ', t.itens.map((n, k) => [k ? ', ' : '', el('a', { href: DEMO.link('escopo', { item: n }), text: n + ' ' + itemT(n) })])));
  }
  const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

  function manual(parte) {
    const telas = MAN.partes[parte].telas;
    const regras = MAN.REGRAS.filter(r => r.onde === parte);
    return [
      // Sumário: aberto no computador (coluna fixa ao lado); fechado no celular e no iPad, para não empurrar o manual.
      el('details', { class: 'sumario cartao', open: innerWidth >= 1000 }, el('summary', {}, el('span', { class: 'sobretitulo', text: 'Sumário · ' + telas.length + (parte === 'app' ? ' telas do app' : ' telas da central') })),
        el('ol', {}, telas.map(t => el('li', {}, el('button', { type: 'button', class: 'link-sumario', onclick: () => irPara(ancora(parte, t.tela)) }, t.titulo))),
          regras.length ? el('li', {}, el('button', { type: 'button', class: 'link-sumario', onclick: () => irPara('man-regras-' + parte) }, 'Regras')) : null)),
      el('div', { class: 'man-telas' }, telas.map(t => secaoTela(t, parte)),
        regras.length ? el('section', { class: 'man-tela', id: 'man-regras-' + parte }, el('h3', { text: 'Regras' }), regras.map(r => el('div', { class: 'man-bloco' }, el('h4', { text: r.nome }), el('p', { text: r.texto })))) : null)];
  }
  function fluxos() {
    return el('div', { class: 'grade-fluxos' }, MAN.FLUXOS.map(f => window.DEMO_FLUXOS.desenhar(f)));
  }
  function resultados() {
    const achados = MAN.buscar(est.busca);
    return el('div', { class: 'man-telas' },
      el('p', { class: 'mudo', role: 'status', text: achados.length ? achados.length + (achados.length === 1 ? ' tela encontrada' : ' telas encontradas') + ' para "' + est.busca + '".' : 'Nada encontrado para "' + est.busca + '". Tente outra palavra, como água, metas ou recado.' }),
      achados.map(t => secaoTela(t, t.parte)));
  }
  function irPara(id) { const a = document.getElementById(id); if (a) { a.scrollIntoView({ block: 'start' }); const h = a.querySelector('h3'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } } }

  let conteudo, abas;
  function desenhar() {
    trocar(abas, ABAS.map(([k, n]) => el('button', { type: 'button', 'aria-pressed': String(!est.busca && est.aba === k), onclick: () => { est.aba = k; est.busca = ''; campo.value = ''; desenhar(); } }, n)));
    trocar(conteudo, est.busca ? resultados() : est.aba === 'fluxos' ? fluxos() : manual(est.aba));
    DEMO.tela(est.busca ? 'manual-busca' : 'manual-' + est.aba);
  }
  let espera = 0;
  const campo = el('input', { type: 'search', class: 'entrada', id: 'busca-manual', placeholder: 'Ex.: água, metas, recado', autocomplete: 'off' });
  campo.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => { est.busca = campo.value.trim(); desenhar(); }, 200); });

  DEMO.iniciar({ pagina: 'manual', raiz, montar: d => {
    document.title = 'Manual · ' + d.clinica;
    conteudo = el('div', { class: 'man-conteudo' });
    abas = el('div', { class: 'seg largo abas-manual', role: 'group', 'aria-label': 'Parte do manual' });
    trocar(raiz, DEMO.faixaDemo('manual', null, { semItens: true }),
      el('main', { class: 'pagina pagina-escopo pagina-manual' },
        el('article', { class: 'documento' },
          el('header', { class: 'cab-doc' }, el('p', { class: 'sobretitulo', text: 'Manual de uso' }), el('h1', { text: 'Como usar o app e a central · ' + d.clinica }),
            el('dl', { class: 'meta-doc' }, el('dt', { text: 'Telas' }), el('dd', { text: MAN.partes.app.telas.length + ' do app · ' + MAN.partes.central.telas.length + ' da central (contando as folhas)' }), el('dt', { text: 'Fluxogramas' }), el('dd', { text: String(MAN.FLUXOS.length) })),
            el('p', { class: 'mudo', text: 'Cada tela: o que é, para quem, o passo a passo, de onde vêm os dados, o que acontece do outro lado e por quê. "Ver na tela" abre a tela na demonstração. O mesmo manual responde às dúvidas no assistente do app.' })),
          el('div', { class: 'man-ferramentas' }, el('label', { class: 'campo', for: 'busca-manual' }, el('span', { text: 'Buscar no manual' }), el('div', { class: 'busca-campo' }, ic('busca', null), campo)), abas),
          conteudo)));
    desenhar();
  } });
})();
