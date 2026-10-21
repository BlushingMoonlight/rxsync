// Entrada da demonstração (DEC-125): o nome do médico e da clínica e os três caminhos.
(function () {
  'use strict';
  const { el, trocar } = DEMO;
  const raiz = document.getElementById('raiz');
  DEMO.iniciar({ pagina: 'entrada', raiz, montar: d => {
    document.title = 'Demonstração · ' + d.clinica;
    const porta = (titulo, texto, pagina, marca) => el('a', { class: 'cartao porta', href: DEMO.link(pagina) },
      el('span', { class: 'porta-marca', 'aria-hidden': 'true', text: marca }), el('h2', { text: titulo }), el('p', { class: 'mudo', text: texto }), el('span', { class: 'porta-ir', text: 'Abrir ›' }));
    trocar(raiz, DEMO.topo('Demonstração preparada pela RXSync'),
      el('main', { class: 'pagina' },
        el('section', { class: 'boas-vindas pilha' },
          el('h1', { text: 'Olá, ' + d.tratamento + ' ' + String(d.medico || '').split(' ')[0] + '.' }),
          el('p', {}, 'Preparamos esta demonstração com o nome da sua clínica, ', el('strong', { text: d.clinica }), ': o app que seus pacientes usam e a central onde você acompanha cada um.'),
          el('p', { class: 'mudo peq', text: 'Os pacientes são de mentira. Toque nos marcadores "item N" para ver o item no escopo.' })),
        el('nav', { class: 'portas', 'aria-label': 'Partes da demonstração' },
          porta('Ver o app do paciente', 'Registros do dia, picadinha, evolução, consultas e os chats.', 'app', '📱'),
          porta('Ver a central do médico', 'Pacientes da semana, alertas, a ficha do app e as metas.', 'central', '🩺'),
          porta('Montar o escopo', 'Marque o que você quer, o que não precisa e o que tem dúvida, e envie para a RXSync.', 'escopo', '✅')),
        el('footer', { class: 'rodape-demo' }, el('p', { class: 'mudo', text: 'Quer falar sobre o app para a sua clínica?' }), DEMO.botaoConversar(),
          el('p', { class: 'mudo peq' }, 'RXSync · ', el('a', { href: DEMO.raizSite() + 'privacidade.html#demonstracao' }, 'Privacidade')))));
    DEMO.tela('inicio');
  } });
})();
