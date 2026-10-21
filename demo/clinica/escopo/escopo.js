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
    trocar(contagem, el('strong', { class: 'tab', text: n('quero') + ' quero' }), el('span', { 'aria-hidden': 'true', text: ' · ' }), el('span', { class: 'tab', text: n('duvida') + (n('duvida') === 1 ? ' dúvida' : ' dúvidas') }),
      el('span', { 'aria-hidden': 'true', text: ' · ' }), el('span', { class: 'tab', text: n('nao_preciso') + ' não preciso' }));
    GRUPOS.forEach(contarGrupo);
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
  // Grupos (dobráveis), com a contagem do que já foi marcado em cada um.
  const GRUPOS = [['Entrada e tela Hoje', 1, 6], ['Registros do dia', 7, 19], ['Evolução', 20, 22], ['Picadinha', 23, 27], ['Clínica e contato', 28, 34], ['Extras do app', 35, 38], ['Central do médico', 39, 46]];
  const contadores = {};
  function contarGrupo(g) {
    const [, a, b] = g, total = b - a + 1, feitos = Object.entries(est.escolhas).filter(([n, v]) => +n >= a && +n <= b && v.e).length;
    if (contadores[a]) contadores[a].textContent = feitos + ' de ' + total + ' marcados';
  }
  function cartaoItem(i) {
    const atual = () => est.escolhas[i.n] || { e: '', n: '' };
    const botoes = el('div', { class: 'seg largo opcoes', role: 'group', 'aria-label': 'Escolha para o item ' + i.n });
    const desenharBotoes = () => trocar(botoes, OPCOES.map(([k, rot]) => el('button', { type: 'button', class: 'opcao ' + k, 'aria-pressed': String(atual().e === k), onclick: () => {
      const e = atual().e === k ? '' : k; est.escolhas[i.n] = { ...atual(), e }; desenharBotoes(); contar(); guardar(i.n); DEMO.evento('marcou', { item: i.n, e: e || 'nada' }); } },
      atual().e === k ? window.DEMO_ICONE(k === 'quero' ? 'check' : k === 'duvida' ? 'pergunta' : 'fechar', 'p') : null, rot)));
    desenharBotoes();
    const nota = el('textarea', { class: 'entrada', id: 'nota-' + i.n, maxlength: '500', rows: '2', value: atual().n || '' });
    nota.addEventListener('change', () => { est.escolhas[i.n] = { ...atual(), n: nota.value.trim() }; guardar(i.n); });
    const campoNota = el('label', { class: 'campo', for: 'nota-' + i.n, hidden: !atual().n }, el('span', { text: 'Anotação (opcional)' }), nota);
    return el('article', { class: 'item-escopo', id: 'item-' + i.n },
      el('div', { class: 'linha-h cab-item' }, el('span', { class: 'num tab', text: i.n }), el('div', { class: 'cresce' }, el('h3', { text: i.t }), el('p', { class: 'mudo peq', text: i.d }))),
      botoes, campoNota,
      el('div', { class: 'acoes-item' }, el('button', { type: 'button', class: 'botao leve', 'aria-expanded': String(!campoNota.hidden), onclick: e => { campoNota.hidden = !campoNota.hidden; e.currentTarget.setAttribute('aria-expanded', String(!campoNota.hidden)); if (!campoNota.hidden) nota.focus(); } }, window.DEMO_ICONE('editar', 'p'), 'Anotação'),
        el('a', { class: 'botao leve', href: DEMO.link(i.onde[0], { tela: i.onde[1], item: i.n }) }, window.DEMO_ICONE('olho', 'p'), 'Ver na tela')));
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
    const itens = window.DEMO_ITENS || [], pedido = Number(DEMO.extra.item) || 0;
    const grupo = (g, k) => {
      const [titulo, a, b] = g;
      contadores[a] = el('span', { class: 'mini mudo tab' });
      const aberto = pedido ? pedido >= a && pedido <= b : k === 0;
      const det = el('details', { class: 'grupo-escopo cartao', open: aberto },
        el('summary', {}, el('span', { class: 'cresce' }, el('h2', { text: titulo }), contadores[a]), el('span', { class: 'seta-g', 'aria-hidden': 'true' }, window.DEMO_ICONE('seta', 'p'))),
        el('div', { class: 'itens-grupo' }, itens.filter(i => i.n >= a && i.n <= b).map(cartaoItem)));
      return det;
    };
    const btnEnviar = el('button', { type: 'button', class: 'botao', onclick: e => enviar(e.currentTarget) }, window.DEMO_ICONE('enviar', 'p'), 'Enviar para a RXSync');
    trocar(raiz, DEMO.topo('Escopo · demonstração', 'entrada', null, { semItens: true }),
      el('main', { class: 'pagina pagina-escopo' },
        el('header', { class: 'pilha cab-escopo' }, el('p', { class: 'sobretitulo', text: 'Escopo do app' }), el('h1', { text: 'Marque o que entra no app da sua clínica.' }),
          el('p', { class: 'mudo', text: 'Para cada item: Quero, Não preciso ou Tenho dúvida. "Ver na tela" mostra o item na demonstração. As escolhas ficam guardadas sozinhas.' }),
          d.escopo_enviado_em ? el('p', { class: 'aviso info peq' }, window.DEMO_ICONE('check', 'p'), 'Você já enviou este escopo. Pode mudar e enviar de novo quando quiser.') : null),
        el('div', { class: 'grupos' }, GRUPOS.map(grupo)),
        el('section', { class: 'cartao fim-escopo' }, el('h2', { text: 'Pronto?' }), el('p', { class: 'mudo', text: 'Envie o escopo para a RXSync. Prefere falar antes? Toque em "Quero conversar".' }),
          el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao', onclick: e => enviar(e.currentTarget) }, 'Enviar para a RXSync'), DEMO.botaoConversar('sec')))),
      el('div', { class: 'barra-escopo vidro' }, el('div', { class: 'dentro' }, contagem, btnEnviar)));
    contar();
    DEMO.tela('escopo');
    if (pedido) { const a = document.getElementById('item-' + pedido); if (a) { a.classList.add('destaque'); a.scrollIntoView({ block: 'center' }); } }
  } });
})();
