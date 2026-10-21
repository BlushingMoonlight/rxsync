// Ícones da demonstração (DEC-125): um conjunto só, de traço arredondado (1,75 numa grade de 24), na cor do texto ou da
// clínica (currentColor). As abas do app têm a versão cheia, para a aba ativa.
(function () {
  'use strict';
  const P = {
    casa: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
    mais: 'M12 5v14M5 12h14',
    seringa: 'M17 3l4 4M15 5l4 4M7.5 12.5l4 4M18 6l-9.5 9.5-3 .5.5-3L15.5 3.5M5 19l-2 2',
    grafico: 'M4 20h16M6 16l4-5 3 3 5-7',
    menu: 'M4 7h16M4 12h16M4 17h16',
    prato: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    livro: 'M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
    gota: 'M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5',
    lua: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5',
    corrida: 'M13.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M9 21l2.5-5 2.5 2v3M7 11l3-3 4 1 2.5 3.5H20M11.5 16l1-4.5',
    sorriso: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01',
    maca: 'M12 7c-2-2-6.5-1.5-6.5 3.5 0 4.5 3 9 6.5 9s6.5-4.5 6.5-9C18.5 5.5 14 5 12 7M12 7c0-2 1-3.5 2.5-4',
    onda: 'M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0',
    notas: 'M6 3.5h9l3 3V20.5H6zM9 10h6M9 13.5h6M9 17h4',
    pilula: 'M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7zM7.5 10.5l6 6',
    balanca: 'M4.5 4.5h15v15h-15zM9 9a4 4 0 0 1 6 0l-2 3',
    camera: 'M4 8h3l2-2.5h6L17 8h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
    usuario: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20a7 7 0 0 1 14 0',
    calendario: 'M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4',
    megafone: 'M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1M16 8.5a5 5 0 0 1 0 7',
    sino: 'M6.5 9a5.5 5.5 0 1 1 11 0c0 6 2.5 8 2.5 8h-16s2.5-2 2.5-8M10 20.5h4',
    clipe: 'M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8',
    pessoas: 'M15.5 19v-1.2A3.8 3.8 0 0 0 11.7 14H7.3a3.8 3.8 0 0 0-3.8 3.8V19M9.5 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5M20.5 19v-1.2a3.8 3.8 0 0 0-2.8-3.6M15.5 4.2a3.25 3.25 0 0 1 0 6.1',
    conversa: 'M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-4.5 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M8 9.5h8M8 12.5h5',
    medalha: 'M12 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M8.5 10.8 6 3h4l2 4 2-4h4l-2.5 7.8',
    pergunta: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
    cadeado: 'M6.5 11h11v9h-11zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    texto: 'M4 7V5h11v2M9.5 5v14M7.5 19h4M14 12v-1.5h6V12M17 10.5V19M15.5 19h3',
    celular: 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5M11 17.5h2',
    busca: 'M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6M20 20l-4.4-4.4',
    barras: 'M4 5v14M7 5v14M10.5 5v14M13 5v14M16.5 5v14M20 5v14',
    fogo: 'M12 21c3.9 0 6.5-2.6 6.5-6.3 0-3.7-3-6.2-4.5-9.2-1 2.6-2.4 3.6-3.5 4.2.2-1.6-.3-3-1.3-4.2C7.4 8 5.5 10.6 5.5 14.7 5.5 18.4 8.1 21 12 21',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    voltar: 'M15 6l-6 6 6 6',
    seta: 'M9 6l6 6-6 6',
    estetoscopio: 'M6 3.5v5a4.5 4.5 0 0 0 9 0v-5M10.5 13v2.5a4.5 4.5 0 0 0 9 0V13M19.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
    lista: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5l1 1 2-2M4.5 12l1 1 2-2M4.5 17.5l1 1 2-2',
    alerta: 'M12 4 2.8 19.5h18.4zM12 10v4M12 17h.01',
    enviar: 'M4 12 20 4l-6 16-3-7z',
    chave: 'M3.5 12a3.5 3.5 0 0 1 3.5-3.5h10a3.5 3.5 0 0 1 0 7H7A3.5 3.5 0 0 1 3.5 12M7 12h.01',
    fechar: 'M6 6l12 12M18 6 6 18',
    info: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 11v5M12 8h.01',
    hoje: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
    registrar: 'M8.5 3.5h7a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5M12 8.5v7M8.5 12h7',
    sol: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
    telefone: 'M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2',
    olho: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    ficha: 'M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5M9 3.5v2h6v-2M9 11h6M9 15h4',
    editar: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
    paleta: 'M12 20.5a8.5 8.5 0 1 1 8.5-8.5c0 2.2-1.8 3.5-3.6 3.5h-1.6a1.8 1.8 0 0 0-1.3 3c.5.6.1 2-2 2M7.5 12h.01M9.5 8h.01M14.5 8h.01',
    relogio: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 7.5V12l3 2'
  };
  // Versão cheia (aba ativa): a forma preenchida e o detalhe vazado na cor do fundo.
  const CHEIO = {
    hoje: ['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7'],
    registrar: ['M8.5 3.5h7a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5', 'M12 8.5v7M8.5 12h7'],
    seringa: ['M15.5 3.5 18 6l-9.5 9.5-3 .5.5-3z', 'M9.5 10.5l1.5 1.5', 'M17 3l4 4M5 19l-2 2'],
    grafico: ['M6 16l4-5 3 3 5-7v13H6z', null, 'M4 20h16'],
    usuario: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20a7 7 0 0 1 14 0z']
  };
  // icone('gota', 'g') → <svg class="ic g"> (p = 16, normal = 20, g = 24 px); icone('hoje', 'g', true) → versão cheia.
  window.DEMO_ICONE = function (nome, tam, cheio) {
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('class', 'ic' + (tam ? ' ' + tam : '')); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.75'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    const caminho = (d, extra) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); for (const [k, v] of Object.entries(extra || {})) p.setAttribute(k, v); s.append(p); };
    const c = cheio && CHEIO[nome];
    if (!c) { caminho(P[nome] || P.info); return s; }
    caminho(c[0], { fill: 'currentColor' });
    if (c[1]) caminho(c[1], { class: 'vazado' });
    if (c[2]) caminho(c[2]);
    return s;
  };
})();
