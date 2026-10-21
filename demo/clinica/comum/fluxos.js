// Fluxogramas gerados do manual (comum/manual.js), em SVG feito aqui (sem biblioteca), com as cores do tema (claro e
// escuro) e legíveis no celular: as etapas em coluna, uma embaixo da outra, cada uma com o lado (App, Central, Regra,
// Equipe) e um link para a tela. Embaixo, o mesmo fluxo em texto (para o leitor de tela e para quem prefere ler).
(function () {
  'use strict';
  const { el } = DEMO;
  const NS = 'http://www.w3.org/2000/svg';
  const LADO = { app: 'App do paciente', central: 'Central da equipe', regra: 'Regra', pessoa: 'Equipe', ia: 'IA' };
  const W = 340, X = 8, LARG = W - 2 * X, LINHA = 19, GAP = 46, CAR = 38;
  function svg(tag, atr, texto) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(atr || {})) if (v != null) e.setAttribute(k, v);
    if (texto != null) e.textContent = texto;
    return e;
  }
  // Quebra o texto em linhas de até CAR caracteres (sem cortar palavra).
  function quebrar(t) {
    const linhas = []; let l = '';
    for (const w of String(t).split(/\s+/)) { if ((l + ' ' + w).trim().length > CAR && l) { linhas.push(l); l = w; } else l = (l + ' ' + w).trim(); }
    if (l) linhas.push(l);
    return linhas;
  }
  // fluxo: { id, titulo, resumo, etapas: [{ lado, texto, parte, tela, seta }] }
  function desenhar(fluxo) {
    let y = 4;
    const g = svg('g');
    fluxo.etapas.forEach((et, i) => {
      if (i > 0) {
        const y0 = y, y1 = y + GAP - 6;
        g.append(svg('line', { x1: W / 2, y1: y0 + 4, x2: W / 2, y2: y1 - 6, class: 'fx-seta' }), svg('path', { d: `M${W / 2 - 6} ${y1 - 10} L${W / 2} ${y1 - 2} L${W / 2 + 6} ${y1 - 10}`, class: 'fx-ponta' }));
        if (et.seta) g.append(svg('text', { x: W / 2 + 12, y: y0 + GAP / 2 + 4, class: 'fx-rot-seta' }, et.seta));
        y += GAP;
      }
      const linhas = quebrar(et.texto), alto = 40 + linhas.length * LINHA;
      const no = svg('a', { href: DEMO.link(et.parte, { tela: et.tela }), class: 'fx-no fx-' + et.lado, 'aria-label': 'Etapa ' + (i + 1) + ', ' + (LADO[et.lado] || '') + ': ' + et.texto + '. Ver na tela' });
      no.append(svg('rect', { x: X, y, width: LARG, height: alto, rx: 14, class: 'fx-caixa' }), svg('rect', { x: X, y, width: 6, height: alto, rx: 3, class: 'fx-faixa' }),
        svg('text', { x: X + 20, y: y + 22, class: 'fx-lado' }, (i + 1) + ' · ' + (LADO[et.lado] || '').toUpperCase()));
      const t = svg('text', { x: X + 20, y: y + 44, class: 'fx-texto' });
      linhas.forEach((l, k) => t.append(svg('tspan', { x: X + 20, dy: k ? LINHA : 0 }, l)));
      no.append(t, svg('path', { d: `M${W - 30} ${y + alto / 2 - 5} l5 5 l-5 5`, class: 'fx-ir' }));
      g.append(no);
      y += alto;
    });
    const s = svg('svg', { viewBox: `0 0 ${W} ${y + 4}`, class: 'fluxograma', role: 'group', 'aria-labelledby': 'fx-t-' + fluxo.id });
    s.append(g);
    const lista = el('ol', { class: 'fx-lista' }, fluxo.etapas.map(et => el('li', {}, el('strong', { text: (LADO[et.lado] || '') + ': ' }), et.texto, et.seta ? el('span', { class: 'mudo', text: ' (' + et.seta + ')' }) : null, ' ',
      el('a', { href: DEMO.link(et.parte, { tela: et.tela }) }, 'Ver na tela'))));
    return el('figure', { class: 'fluxo cartao', id: 'fluxo-' + fluxo.id, 'data-fluxo': fluxo.id },
      el('figcaption', {}, el('h3', { id: 'fx-t-' + fluxo.id, text: fluxo.titulo }), el('p', { class: 'mudo peq', text: fluxo.resumo })),
      el('div', { class: 'fx-legenda', 'aria-hidden': 'true' }, [...new Set(fluxo.etapas.map(e => e.lado))].map(l => el('span', { class: 'fx-l fx-' + l, text: LADO[l] }))),
      s, el('details', { class: 'fx-texto-alt' }, el('summary', {}, 'O mesmo fluxo em texto'), lista));
  }
  window.DEMO_FLUXOS = { desenhar, LADO };
})();
