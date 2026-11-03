// Painel: o tour guiado na primeira vez em cada tela (rxsync-sistema #225, item 23; DEC-178). Arquivo à parte, carregado
// só depois de o painel abrir. Usa só o que o painel expõe em window.rxPainel. O que a pessoa já viu fica no servidor, por
// pessoa (tour_ler e tour_marcar, workflow 29, sql/081), para valer em todos os aparelhos. Não bloqueia a tela: é um
// cartão no canto, com a área apontada contornada. "Continuar" passa para o próximo; "Ver depois" fecha e mostra de novo
// na próxima vez; "Pular" não mostra mais nenhum. "Rever o tour" (Conta › Ajuda) recomeça.
(function () {
  'use strict';
  const P = window.rxPainel; if (!P || !P.comSessao()) return;
  const { el, btn, c29 } = P;
  // Um tour por tarefa, na ordem do primeiro dia da clínica (rxsync-sistema DEC-191; antes, DEC-178 explicava a tela): Hoje
  // aponta para os "Primeiros passos"; cada passo leva à tela dele, com a parada daquela tarefa. Cada parada diz o que fazer.
  // O que está escrito no botão não precisa de parada. Cada passo: o que apontar e o texto.
  const PASSOS = {
    hoje: [['#hojePassos', 'Bem-vinda ao painel. Faltam 4 coisas para a assistente atender bem os seus pacientes. Vamos na ordem: toque na primeira.'],
      ['#btnEstadoIa', 'Agora o teste de verdade: do seu celular, mande "oi" para o WhatsApp da clínica. Em segundos ela responde, e aqui aparece "Atendendo".'],
      ['#hojeAtencao', 'Quando um paciente pede para falar com uma pessoa ou tem urgência, aparece aqui e no celular de avisos. Toque, resolva no WhatsApp e toque em "Resolvido".']],
    'conta/whatsapp': [['#zapNumero', 'Este é o WhatsApp que a assistente usa. Se ela parar de responder, toque em "Reconectar ou trocar o número" e leia o código com o celular da clínica, em Aparelhos conectados.']],
    'agenda/horarios/grade': [['#gradeBox', 'A assistente só marca dentro destes horários. Confira os dias e o intervalo de almoço. Feriados ficam em Agenda › Ajustes da agenda › Feriados.']],
    'assistente/automaticas': [['#fld_lembretes', 'Ligue os lembretes de consulta: o paciente recebe uma mensagem 24 horas e 2 horas antes, pedindo a confirmação. Isso ajuda a reduzir faltas.']],
    assistente: [['#blocoSabe', 'Tudo o que ela responde vem daqui: preços, convênios, endereço e as perguntas frequentes do seu formulário. Mudou algo na clínica? Mude aqui; vale na hora.']],
    agenda: [['#agNovoTopo, #agNovo', 'As consultas que ela marca aparecem sozinhas. Paciente ligou na recepção? Marque aqui.']],
    'conta/equipe': [['#btnEquipeConvidar', 'Por último, convide a secretária: ela entra com o e-mail dela e vê a agenda e os pacientes, sem a parte de plano e pagamento.']]
  };
  // O estilo do tour fica num arquivo à parte (painel/tour.css), para o painel caber em 400 KB.
  document.head.append(el('link', { rel: 'stylesheet', href: '/painel/tour.css' }));
  let estado = null, aberto = null, hojeAdiado = false;
  const tela = () => (location.hash.slice(1) || 'hoje').split('?')[0];
  const visivel = s => [...document.querySelectorAll(s)].find(e => e.offsetParent !== null && e.getBoundingClientRect().height > 0);
  function fechar() { if (!aberto) return; aberto.caixa.remove(); if (aberto.alvo) aberto.alvo.classList.remove('tour-alvo'); aberto = null; }
  function marcar(t, e) { estado = Object.assign({}, estado, { [t]: e }); c29('tour_marcar', { tela: t, estado: e }).catch(() => {}); }
  function mostrar(t, i) {
    fechar();
    const passos = (PASSOS[t] || []).filter(([s]) => visivel(s));
    if (!passos.length) return;
    const [s, texto] = passos[i], alvo = visivel(s), ultimo = i === passos.length - 1;
    alvo.classList.add('tour-alvo');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const caixa = el('div', { class: 'tour-cartao', role: 'dialog', 'aria-live': 'polite', 'aria-label': 'Tour do painel' },
      el('p', { class: 'mudo peq', text: 'Tour · ' + (i + 1) + ' de ' + passos.length }),
      el('p', { class: 'tour-texto', text: texto }),
      el('div', { class: 'tour-acoes' },
        btn(ultimo ? 'Entendi' : 'Continuar', () => { if (ultimo) { marcar(t, 'visto'); fechar(); } else mostrar(t, i + 1); }, 'pri'),
        btn('Ver depois', () => { marcar(t, 'depois'); fechar(); }, 'sec'),
        btn('Pular', () => { marcar('*', 'pulado'); fechar(); }, 'fant')));
    caixa.addEventListener('keydown', e => { if (e.key === 'Escape') { marcar(t, 'depois'); fechar(); } });
    document.body.append(caixa); aberto = { caixa, alvo };
    // O cartão nunca cobre a área apontada: se cobrir, vai para o alto da tela (auditoria de 01/11/2026, FD-01).
    setTimeout(() => { if (!aberto || aberto.caixa !== caixa) return; const r = alvo.getBoundingClientRect(), c = caixa.getBoundingClientRect();
      caixa.classList.toggle('em-cima', r.bottom > c.top && r.top < c.bottom); }, 450);
    caixa.querySelector('button').focus({ preventScroll: true });
  }
  function talvez() {
    fechar();
    const t = tela();
    if (!estado || estado['*'] === 'pulado' || !PASSOS[t] || estado[t] === 'visto') return;
    if (estado[t] === 'depois') { estado = Object.assign({}, estado); delete estado[t]; return; }   // "Ver depois": nesta abertura, não
    // Hoje com o cartão de estado (falta conectar, teste, pagar): a primeira vista é dele; o tour de Hoje fica para a próxima
    // vez que Hoje abrir (FD-01).
    if (t === 'hoje' && !hojeAdiado && document.getElementById('hojeEstado')) { hojeAdiado = true; return; }
    setTimeout(() => { if (tela() === t) mostrar(t, 0); }, 600);   // espera a tela montar
  }
  window.rxTour = Object.freeze({ rever: () => { c29('tour_marcar', { tela: '*', estado: 'rever' }).catch(() => {}); estado = {}; location.hash = 'hoje'; setTimeout(talvez, 50); } });
  c29('tour_ler', {}).then(r => { if (r && r.ok && r.tour && typeof r.tour === 'object') { estado = r.tour; talvez(); window.addEventListener('hashchange', talvez); } }).catch(() => {});
})();
