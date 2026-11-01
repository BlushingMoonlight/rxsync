// Painel: Assistente › O que ela sabe › Perguntas frequentes (rxsync-sistema sql/076, S2). Arquivo à parte (DEC-178 e a
// decisão FD-21 da auditoria de 01/11/2026: o painel fica abaixo de 400 KB), carregado pelo painel na primeira vez que a
// página abre. Usa só o que o painel expõe em window.rxPainel.
// Desenho (auditoria de 01/11/2026, FD-14 e FD-15): o mesmo das "Perguntas antes de agendar": a lista das perguntas e cada
// uma numa folha (molde H) com "Salvar"; "Adicionar pergunta" abre a folha vazia. Salvar grava a lista inteira de uma vez
// (faq_salvar), como antes; os limites (20 perguntas, 200 e 800 letras) vêm do servidor, que confere de novo.
(function () {
  'use strict';
  const P = window.rxPainel; if (!P) return;
  const { el, btn, d24, rapida, folha, confirmar, aviso, vazio, esqueleto, trocar, cresce, icone } = P;
  const F = { itens: null, antigas: 0, limite: 20, lp: 200, lr: 800, box: null };
  const curto = t => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > 90 ? t.slice(0, 89) + '…' : t; };
  const lista = () => F.itens.map(x => ({ id: x.id || '', pergunta: x.pergunta, resposta: x.resposta }));

  function carregar() {
    d24('faq_listar').then(r => {
      r = r || {};
      F.itens = (r.itens || []).map(x => ({ id: x.id, pergunta: x.pergunta || '', resposta: x.resposta || '' }));
      F.antigas = Number(r.antigas) || 0; F.limite = Number(r.limite) || 20; F.lp = Number(r.limite_pergunta) || 200; F.lr = Number(r.limite_resposta) || 800;
      P.faqContar(F.itens.length); render();
    }).catch(() => { if (F.box) trocar(F.box, el('div', { class: 'cartao' }, vazio(null, 'As perguntas não carregaram agora. Tente de novo em instantes.'))); });
  }
  function render() {
    const box = F.box; if (!box || !box.isConnected || !F.itens) return;
    const cheio = F.itens.length >= F.limite;
    trocar(box,
      F.antigas ? aviso('', F.antigas === 1 ? 'Há 1 pergunta antiga que a assistente também usa e que só a RXSync muda.' : 'Há ' + F.antigas + ' perguntas antigas que a assistente também usa e que só a RXSync muda.') : null,
      F.itens.length ? el('div', { class: 'lista bloco', id: 'faqLista' }, F.itens.map((f, i) => el('button', { class: 'linha', type: 'button', 'data-faq': String(i), onclick: () => editar(i) },
        el('span', { class: 'tx' }, el('span', { class: 't1', text: f.pergunta }), el('span', { class: 't2', text: curto(f.resposta) })), el('span', { class: 'seta' }, icone('seta')))))
        : el('div', { class: 'cartao bloco' }, vazio(null, 'Nenhuma pergunta ainda.')),
      el('p', { class: 'legenda', text: F.itens.length + ' de ' + F.limite + ' perguntas.' }),
      el('div', { class: 'pilha' }, btn('Adicionar pergunta', () => editar(-1), 'sec', 'soma', { id: 'faqAdicionar', disabled: cheio })));
  }
  async function gravar(itens, b) {
    if (b) b.disabled = true;
    try {
      const x = await d24('faq_salvar', { itens });
      if (x && x.ok) { rapida('Perguntas salvas. A assistente já usa as novas respostas.'); carregar(); return true; }
      rapida((x && x.mensagem) || 'Não consegui salvar. Tente de novo.', { ms: 9000 });
    } catch (e) { rapida('Não consegui salvar. Tente de novo.'); }
    if (b) b.disabled = false;
    return false;
  }
  // Uma pergunta na folha (molde H): os dois campos, "Salvar" e, para a que já existe, "Remover esta pergunta" no fim.
  function editar(i) {
    const f = i >= 0 ? F.itens[i] : { id: '', pergunta: '', resposta: '' };
    const p = el('input', { class: 'entrada', id: 'faqP', maxlength: String(F.lp), autocomplete: 'off', placeholder: 'Vocês atendem no mesmo dia?' });
    const r = el('textarea', { class: 'entrada', id: 'faqR', maxlength: String(F.lr), rows: '4', placeholder: 'A resposta que a assistente vai dar.' });
    const cont = el('div', { class: 'contagem', 'aria-live': 'polite' });
    const contar = () => { cont.textContent = r.value.length + ' de ' + F.lr; };
    p.value = f.pergunta; r.value = f.resposta; contar();
    r.addEventListener('input', () => { cresce(r); contar(); }); setTimeout(() => cresce(r), 0);
    let g = null;
    const salvar = btn('Salvar', async ev => {
      const pq = p.value.trim(), rs = r.value.trim();
      if (!pq) { p.focus(); rapida('Escreva a pergunta.'); return; }
      if (!rs) { r.focus(); rapida('Toda pergunta precisa de uma resposta.'); return; }
      const itens = lista(); const nova = { id: f.id || '', pergunta: pq, resposta: rs };
      if (i >= 0) itens[i] = nova; else itens.push(nova);
      if (await gravar(itens, ev.currentTarget)) { g.limpar(); g.fechar(); }
    }, 'pri', 'ok', { id: 'faqSalvar' });
    const remover = i >= 0 ? btn('Remover esta pergunta', async ev => {
      if (!(await confirmar({ titulo: 'Remover a pergunta?', texto: 'A assistente deixa de usar esta pergunta e a resposta. Dá para escrever de novo depois.', botao: 'Remover', perigo: true }))) return;
      if (await gravar(lista().filter((_, k) => k !== i), ev.currentTarget)) { g.limpar(); g.fechar(); }
    }, 'perigo-sec plena') : null;
    g = folha(i >= 0 ? 'Pergunta ' + (i + 1) : 'Nova pergunta', el('div', { class: 'form' },
      el('div', { class: 'campo' }, el('label', { for: 'faqP', text: 'Pergunta' }), p),
      el('div', { class: 'campo' }, el('label', { for: 'faqR', text: 'Resposta' }), r, cont),
      remover ? el('div', { class: 'perigo-zona' }, remover) : null), { id: 'faqFolha', pe: [salvar] });
  }
  window.rxFaq = Object.freeze({ entrar: box => { F.box = box; trocar(box, el('div', { class: 'cartao' }, esqueleto())); carregar(); } });
})();
