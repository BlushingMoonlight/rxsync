// Escopo da demonstração (DEC-125): o médico marca Quero, Não preciso ou Tenho dúvida em cada um dos 46 itens e envia
// para a RXSync. As escolhas ficam no servidor (vale a última, de qualquer aparelho); sem valores e sem datas de entrega.
(function () {
  'use strict';
  const { el, trocar } = DEMO;
  const raiz = document.getElementById('raiz');
  const OPCOES = [['quero', 'Quero'], ['nao_preciso', 'Não preciso'], ['duvida', 'Tenho dúvida']];
  const est = { escolhas: {}, pendentes: {}, timer: 0 };
  const contagem = el('div', { class: 'contagem', 'aria-live': 'polite' });

  function contar() {
    const v = Object.values(est.escolhas), n = k => v.filter(x => x.e === k).length;
    trocar(contagem, el('span', { class: 'etq ok', text: n('quero') + ' quero' }), el('span', { class: 'etq atencao', text: n('duvida') + ' com dúvida' }), el('span', { class: 'etq', text: n('nao_preciso') + ' não preciso' }));
  }
  // Grava as escolhas mudadas 1,5 segundo depois do último toque (um pedido só para vários toques seguidos).
  function guardar(n) {
    est.pendentes[n] = est.escolhas[n];
    clearTimeout(est.timer);
    est.timer = setTimeout(async () => {
      const escolhas = est.pendentes; est.pendentes = {};
      const r = await DEMO.pedir({ tipo: 'escopo', escolhas });
      if (!r.ok) { Object.assign(est.pendentes, escolhas); DEMO.rapida(DEMO.mensagemErro(r)); }
    }, 1500);
  }
  function cartaoItem(i) {
    const atual = () => est.escolhas[i.n] || { e: '', n: '' };
    const botoes = el('div', { class: 'opcoes', role: 'group', 'aria-label': 'Escolha para o item ' + i.n });
    const desenharBotoes = () => trocar(botoes, OPCOES.map(([k, rot]) => el('button', { type: 'button', class: 'opcao ' + k, 'aria-pressed': String(atual().e === k), onclick: () => {
      const e = atual().e === k ? '' : k; est.escolhas[i.n] = { ...atual(), e }; desenharBotoes(); contar(); guardar(i.n); DEMO.evento('marcou', { item: i.n, e: e || 'nada' }); } }, atual().e === k ? window.DEMO_ICONE('check', 'p') : null, rot)));
    desenharBotoes();
    const nota = el('textarea', { class: 'entrada', id: 'nota-' + i.n, maxlength: '500', rows: '2', value: atual().n || '' });
    nota.addEventListener('change', () => { est.escolhas[i.n] = { ...atual(), n: nota.value.trim() }; guardar(i.n); });
    const campoNota = el('label', { class: 'campo', for: 'nota-' + i.n, hidden: !atual().n }, el('span', { text: 'Anotação (opcional)' }), nota);
    return el('article', { class: 'cartao item-escopo', id: 'item-' + i.n },
      el('div', { class: 'linha-h' }, el('span', { class: 'num', text: i.n }), el('h3', { class: 'cresce', text: i.t })),
      el('p', { class: 'mudo peq', text: i.d }), botoes, campoNota,
      el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao leve', 'aria-expanded': String(!campoNota.hidden), onclick: e => { campoNota.hidden = !campoNota.hidden; e.currentTarget.setAttribute('aria-expanded', String(!campoNota.hidden)); if (!campoNota.hidden) nota.focus(); } }, 'Anotação'),
        el('a', { class: 'botao leve', href: DEMO.link(i.onde[0], { tela: i.onde[1], item: i.n }) }, 'Ver na tela ›')));
  }
  async function enviar(b) {
    if (DEMO.ver) { DEMO.rapida('Modo "ver como o médico vê": nada é enviado.'); return; }
    b.disabled = true; clearTimeout(est.timer);
    const r = await DEMO.pedir({ tipo: 'escopo', escolhas: est.escolhas, enviar: true });
    b.disabled = false;
    if (!r.ok) { DEMO.rapida(DEMO.mensagemErro(r)); return; }
    est.pendentes = {};
    DEMO.janela('Escopo enviado', el('p', { text: 'Pronto: o Jean recebe o seu escopo agora e te chama para conversar.' }), el('p', { class: 'mudo peq', text: 'Você pode mudar as escolhas e enviar de novo quando quiser.' }));
  }
  DEMO.iniciar({ pagina: 'escopo', raiz, montar: d => {
    document.title = 'Escopo · ' + d.clinica;
    for (const [k, v] of Object.entries(d.escopo || {})) est.escolhas[k] = { e: v.e || '', n: v.n || '' };
    const itens = window.DEMO_ITENS || [];
    const grupo = (titulo, lista) => el('section', { class: 'pilha' }, el('h2', { text: titulo }), lista.map(cartaoItem));
    const btnEnviar = el('button', { type: 'button', class: 'botao', onclick: e => enviar(e.currentTarget) }, 'Enviar para a RXSync');
    trocar(raiz, DEMO.topo('Escopo · demonstração', 'entrada'),
      el('main', { class: 'pagina' },
        el('header', { class: 'pilha' }, el('h1', { text: 'Escopo do app · ' + d.clinica }), el('p', { class: 'mudo', text: 'Preparado para ' + DEMO.nomeMedico() + '. Marque cada item e envie para a RXSync. "Ver na tela" mostra o item na demonstração.' }),
          d.escopo_enviado_em ? el('p', { class: 'aviso info peq', text: 'Você já enviou este escopo. Pode mudar e enviar de novo quando quiser.' }) : null),
        el('div', { class: 'barra-escopo' }, contagem, btnEnviar),
        grupo('App do paciente', itens.filter(i => i.onde[0] === 'app')),
        grupo('Central do médico', itens.filter(i => i.onde[0] === 'central')),
        el('section', { class: 'cartao fim-escopo' }, el('h2', { text: 'Pronto?' }), el('p', { class: 'mudo', text: 'Envie o escopo para a RXSync. Prefere falar antes? Toque em "Quero conversar".' }),
          el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao', onclick: e => enviar(e.currentTarget) }, 'Enviar para a RXSync'), DEMO.botaoConversar('sec')))));
    contar();
    DEMO.tela('escopo');
    if (DEMO.extra.item) { const a = document.getElementById('item-' + Number(DEMO.extra.item)); if (a) { a.classList.add('destaque'); a.scrollIntoView({ block: 'center' }); } }
  } });
})();
