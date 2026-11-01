// Painel: o tour guiado na primeira vez em cada tela (rxsync-sistema #225, item 23; DEC-178). Arquivo à parte, carregado
// só depois de o painel abrir. Usa só o que o painel expõe em window.rxPainel. O que a pessoa já viu fica no servidor, por
// pessoa (tour_ler e tour_marcar, workflow 29, sql/081), para valer em todos os aparelhos. Não bloqueia a tela: é um
// cartão no canto, com a área apontada contornada. "Continuar" passa para o próximo; "Ver depois" fecha e mostra de novo
// na próxima vez; "Pular" não mostra mais nenhum. "Rever o tour" (Conta › Ajuda) recomeça.
(function () {
  'use strict';
  const P = window.rxPainel; if (!P || !P.comSessao()) return;
  const { el, btn, c29 } = P;
  // A ordem segue o primeiro dia da clínica (rxsync-sistema docs/mapa/jornadas.md). Cada passo: o que apontar e o texto.
  const PASSOS = {
    hoje: [['#btnEstadoIa', 'Aqui fica o estado da assistente: atendendo, pausada ou falta conectar o WhatsApp. Toque para testar, pausar ou retomar.'],
      ['#hojeAtencao', '"Precisa de você" junta o que espera a equipe: quem pediu uma pessoa, urgências, consultas novas e documentos.'],
      ['#hojeNumeros', 'Os números dos últimos 30 dias. "Ver resultados" abre os detalhes.'],
      ['#btnBusca', 'A lupa acha telas, pacientes e consultas.']],
    agenda: [['#agNovoTopo, #agNovo', '"Nova consulta" marca um horário pela equipe. A assistente marca sozinha pelo WhatsApp.'],
      ['#calViews, #calVisao', 'Escolha ver o dia, a semana ou a lista. Toque numa consulta para remarcar, cancelar ou marcar "Chegou".'],
      ['#agMais', 'Em "Mais": bloquear um horário, exportar a agenda e ver as canceladas.']],
    'agenda/horarios': [['#horIndice', 'Aqui ficam os horários de atendimento, as regras da agenda, os médicos e tipos de consulta, os feriados e o "Receber dos pacientes".']],
    assistente: [['#cardPausa', 'O estado da assistente, com "Testar a assistente" para conversar com ela como se fosse um paciente.'],
      ['#conteudo .bloco h2', 'Cada assunto abre uma página: o que ela sabe, como ela fala e o que ela pode fazer. As mudanças valem na hora.']],
    pacientes: [['#pacNovoTopo, #pacNovo', '"Novo paciente" cadastra alguém à mão; quem conversa com a assistente entra sozinho.'],
      ['#pacLista', 'Toque num paciente para ver as consultas e o contato.']],
    conta: [['#listaConta', 'Plano e pagamento, WhatsApp da clínica, equipe e os seus dados. Em Ajuda, "Rever o tour" mostra este tour de novo.']]
  };
  // O estilo do tour fica num arquivo à parte (painel/tour.css), para o painel caber em 400 KB.
  document.head.append(el('link', { rel: 'stylesheet', href: '/painel/tour.css' }));
  let estado = null, aberto = null;
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
    caixa.querySelector('button').focus({ preventScroll: true });
  }
  function talvez() {
    fechar();
    const t = tela();
    if (!estado || estado['*'] === 'pulado' || !PASSOS[t] || estado[t] === 'visto') return;
    if (estado[t] === 'depois') { estado = Object.assign({}, estado); delete estado[t]; return; }   // "Ver depois": nesta abertura, não
    setTimeout(() => { if (tela() === t) mostrar(t, 0); }, 600);   // espera a tela montar
  }
  window.rxTour = Object.freeze({ rever: () => { c29('tour_marcar', { tela: '*', estado: 'rever' }).catch(() => {}); estado = {}; location.hash = 'hoje'; setTimeout(talvez, 50); } });
  c29('tour_ler', {}).then(r => { if (r && r.ok && r.tour && typeof r.tour === 'object') { estado = r.tour; talvez(); window.addEventListener('hashchange', talvez); } }).catch(() => {});
})();
