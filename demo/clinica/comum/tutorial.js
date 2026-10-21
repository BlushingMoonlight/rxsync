// Tutorial de primeiro acesso (balões), um para o app e outro para a central. Os passos vêm do manual (comum/manual.js).
// - abre sozinho na 1ª vez que a pessoa vê a tela Hoje do app ou da central nesta página; o botão "?" do produto abre de novo;
// - não abre sozinho quando o link já leva a uma tela (…&tela=… ou &item=…) nem dentro da entrada (o celular embutido);
// - "já viu" fica só na memória da página (nada vai para o armazenamento do navegador); os toques nos botões contam
//   como qualquer toque ("tocou"), sem evento novo;
// - acessível: o balão é uma janela (foco preso nele), Esc = Pular, as setas trocam o passo e o leitor de tela ouve "N de M".
(function () {
  'use strict';
  const { el } = DEMO;
  const visto = { app: false, central: false };
  // O link que já leva a uma tela não abre o tutorial da parte em que a página começa.
  // "tutorial" é o "Ver na tela" dos itens do primeiro acesso: abre com o tutorial.
  if (DEMO.embed || ((DEMO.extra.tela || DEMO.extra.item) && DEMO.extra.tela !== 'tutorial')) visto[document.body.dataset.inicio === 'central' ? 'central' : 'app'] = true;
  let aberto = null;

  function abrir(parte) {
    if (aberto) aberto.fechar();
    visto[parte] = true;
    const passos = (window.DEMO_MANUAL.TUTORIAL[parte] || []).filter(p => achar(p.alvo));
    if (!passos.length) return;
    const origem = document.activeElement;
    let i = 0;
    const foco = el('div', { class: 'tut-foco', 'aria-hidden': 'true' });
    const conta = el('p', { class: 'tut-conta mini', id: 'tut-conta' });
    const titulo = el('h2', { id: 'tut-titulo' }), texto = el('p', { id: 'tut-texto' });
    const anterior = el('button', { type: 'button', class: 'botao sec', onclick: () => ir(i - 1) }, 'Anterior');
    const proximo = el('button', { type: 'button', class: 'botao', onclick: () => (i < passos.length - 1 ? ir(i + 1) : fechar()) });
    const pular = el('button', { type: 'button', class: 'botao leve tut-pular', onclick: () => fechar() }, 'Pular');
    const balao = el('div', { class: 'tut-balao', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tut-titulo', 'aria-describedby': 'tut-conta tut-texto', tabindex: '-1' },
      el('div', { class: 'tut-cab' }, conta, pular), titulo, texto, el('div', { class: 'tut-botoes' }, anterior, proximo));
    const capa = el('div', { class: 'tutorial', 'data-parte': parte }, el('div', { class: 'tut-veu', onclick: () => fechar() }), foco, balao);
    document.body.append(capa);
    document.documentElement.classList.add('com-tutorial');

    function posicionar() {
      const alvo = achar(passos[i].alvo); if (!alvo) return;
      const r = alvo.getBoundingClientRect(), m = 6, vw = innerWidth, vh = innerHeight;
      Object.assign(foco.style, { left: (r.left - m) + 'px', top: (r.top - m) + 'px', width: (r.width + 2 * m) + 'px', height: (r.height + 2 * m) + 'px' });
      const largura = Math.min(360, vw - 32);
      balao.style.width = largura + 'px';
      const alto = balao.offsetHeight;
      // Embaixo do destaque se couber; senão em cima; senão no pé da tela.
      let top = r.bottom + m + 12;
      if (top + alto > vh - 12) top = r.top - m - 12 - alto;
      if (top < 12) top = Math.max(12, vh - alto - 16);
      const left = Math.min(Math.max(16, r.left + r.width / 2 - largura / 2), vw - largura - 16);
      balao.style.top = top + 'px'; balao.style.left = left + 'px';
    }
    function ir(n) {
      if (n < 0 || n >= passos.length) return;
      i = n;
      const p = passos[i], alvo = achar(p.alvo);
      conta.textContent = (i + 1) + ' de ' + passos.length;
      titulo.textContent = p.titulo; texto.textContent = p.texto;
      anterior.disabled = i === 0;
      proximo.textContent = i === passos.length - 1 ? 'Concluir' : 'Próximo';
      if (alvo) alvo.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      posicionar();
      (i === 0 ? proximo : balao).focus({ preventScroll: true });
    }
    // Foco preso no balão: Tab e Shift+Tab giram entre os botões dele.
    function tecla(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(); return; }
      if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); if (i < passos.length - 1) ir(i + 1); return; }
      if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); ir(i - 1); return; }
      if (e.key !== 'Tab') return;
      const bts = [...balao.querySelectorAll('button:not([disabled])')];
      const a = bts.indexOf(document.activeElement);
      e.preventDefault();
      bts[(a + (e.shiftKey ? -1 : 1) + bts.length) % bts.length].focus();
    }
    const entrar = e => { if (!balao.contains(e.target)) proximo.focus({ preventScroll: true }); };
    document.addEventListener('keydown', tecla, true);
    document.addEventListener('focusin', entrar);
    addEventListener('resize', posicionar); addEventListener('scroll', posicionar, true);
    function fechar() {
      document.removeEventListener('keydown', tecla, true); document.removeEventListener('focusin', entrar);
      removeEventListener('resize', posicionar); removeEventListener('scroll', posicionar, true);
      capa.remove(); document.documentElement.classList.remove('com-tutorial'); aberto = null;
      const volta = document.querySelector('.v-' + parte + ' .botao-ajuda') || origem;
      if (volta && volta.isConnected) volta.focus({ preventScroll: true });
    }
    aberto = { fechar };
    ir(0);
  }
  // O primeiro elemento visível que combina com o seletor.
  function achar(sel) { return [...document.querySelectorAll(sel)].find(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) || null; }

  window.DEMO_TUTORIAL = {
    // Chamado pelo app (tela Hoje) e pela central (aba Hoje) ao montar: abre só na primeira vez.
    talvez(parte) { if (!visto[parte] && !aberto) { visto[parte] = true; abrir(parte); } },
    abrir,
    // O botão "?" no topo do produto.
    botao(parte) { return el('button', { type: 'button', class: 'botao-ajuda', 'aria-label': 'Ver o tutorial de novo', title: 'Tutorial', onclick: () => abrir(parte) }, '?'); },
    get aberto() { return !!aberto; }
  };
})();
