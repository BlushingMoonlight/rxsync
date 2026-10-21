// App do paciente da demonstração (DEC-125): itens 1 a 38 do escopo. Paciente de mentira.
// Tudo o que a pessoa faz aqui fica só na memória da página (some ao recarregar); o servidor recebe só o registro de uso
// que já existe (telas, toques e as perguntas dos chats). Cada botão mostra um resultado simulado.
// Regras fixas: o app não calcula dose (a picadinha mostra o que a equipe cadastrou, sem números); o assistente nunca
// diagnostica nem receita; a resposta da equipe no chat chega citada, entre aspas e sem alteração.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const ic = (n, t, c) => window.DEMO_ICONE(n, t, c);
  const raiz = document.getElementById('raiz');
  const PACIENTE = 'Mariana';
  const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',');
  const milhar = v => Math.round(v).toLocaleString('pt-BR');

  // ---------------------------------------------------------------- o dia da paciente (só na memória)
  const META = { kcal: 1600, prot: 110, agua: 8 };
  const est = {
    pilha: [], aba: 'inicio', aceite: false,
    pontos: 46, kcal: 860, prot: 48, agua: 4,
    refeicao: 'Almoço', comidas: [{ nome: 'Ovos mexidos e pão integral', refeicao: 'Café da manhã', kcal: 340, prot: 20 }],
    feitos: {},   // registros do dia: { sono: 'Bem', ... }
    pesos: [78.4, 77.9, 77.1, 76.6, 76.2, 75.4], local: 'Abdômen direito', localEscolhido: 'Abdômen esquerdo', proxima: 'Sexta, às 8h', aplicada: false,
    tomou: {}, lidos: {}, presenca: false, busca: '', alimento: null, porcao: 1, foto: null, lendo: false, sobe: null
  };
  // Cada registro: a confirmação "✓" na tela (com os pontos) e os pontos do dia.
  const ganhar = (pts, texto) => { est.pontos = Math.min(100, est.pontos + pts); DEMO.confirmar(texto, '+' + pts + ' pontos'); };

  // Alimentos de exemplo (valores aproximados, por porção). Só para a demonstração.
  const ALIMENTOS = [
    { nome: 'Arroz branco', porcao: '4 colheres de sopa', kcal: 128, prot: 2.5, carb: 28, gord: 0.2 },
    { nome: 'Feijão carioca', porcao: '1 concha', kcal: 76, prot: 4.8, carb: 13.6, gord: 0.5 },
    { nome: 'Peito de frango grelhado', porcao: '1 filé médio', kcal: 159, prot: 32, carb: 0, gord: 2.5 },
    { nome: 'Ovo cozido', porcao: '1 unidade', kcal: 73, prot: 6.3, carb: 0.6, gord: 5 },
    { nome: 'Pão integral', porcao: '1 fatia', kcal: 63, prot: 2.4, carb: 11, gord: 0.9 },
    { nome: 'Banana prata', porcao: '1 unidade', kcal: 59, prot: 0.8, carb: 15.6, gord: 0.1 },
    { nome: 'Iogurte natural', porcao: '1 pote', kcal: 105, prot: 6.5, carb: 8, gord: 5.4 },
    { nome: 'Salada de folhas', porcao: '1 prato', kcal: 8, prot: 0.7, carb: 1.3, gord: 0.1 }
  ];
  const PORCOES = [[0.5, 'Meia'], [1, '1'], [1.5, '1 e meia'], [2, '2']];

  // ---------------------------------------------------------------- peças
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'linha-h cab-cartao' }, el('h2', { class: 'cresce', text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const caixaIc = (n, extra) => el('span', { class: 'caixa-ic' + (extra ? ' ' + extra : ''), 'aria-hidden': 'true' }, ic(n));
  const linhaIr = (icone, titulo, sub, tela, n) => el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => abrir(tela) },
    caixaIc(icone), el('span', { class: 'cresce' }, el('span', { class: 't1', text: titulo }), sub ? el('span', { class: 't2', text: sub }) : null),
    n ? el('span', { class: 'item-num', text: 'item ' + n, 'aria-hidden': 'true' }) : null, ic('seta', 'p')));
  const barra = (valor, max, rotulo) => { const b = el('div', { class: 'barra', role: 'img', 'aria-label': rotulo }); const i = el('i'); i.style.transform = 'scaleX(' + Math.min(1, Math.max(0, valor / max)) + ')'; b.append(i); return b; };
  const svg = (tag, at) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
  // Cabeçalho das abas: título grande e o perfil no canto (o "Mais" virou a tela do perfil).
  const cabAba = (titulo, antes, ...marcadores) => el('header', { class: 'cab-app' },
    el('div', { class: 'cresce' }, antes ? el('p', { class: 'sobretitulo', text: antes }) : null, el('h1', { text: titulo }), marcadores.length ? el('div', { class: 'marcadores' }, marcadores.map(item)) : null),
    el('button', { type: 'button', class: 'botao-perfil', 'aria-label': 'Abrir o perfil e mais opções', onclick: () => irAba('mais') }, PACIENTE[0]));
  // Os 3 anéis do dia (calorias, proteína e água). Movimento só com rotate e opacity; o anel que acabou de mudar "sobe".
  function aneis() {
    const v = [[est.kcal, META.kcal, 'kcal'], [est.prot, META.prot, 'prot'], [est.agua, META.agua, 'agua']];
    const s = svg('svg', { viewBox: '0 0 160 160', class: 'aneis', role: 'img',
      'aria-label': 'Calorias ' + milhar(est.kcal) + ' de ' + milhar(META.kcal) + ' kcal; proteína ' + Math.round(est.prot) + ' de ' + META.prot + ' g; água ' + est.agua + ' de ' + META.agua + ' copos.' });
    v.forEach(([val, max, k], i) => {
      const r = 70 - i * 19;
      s.append(svg('circle', { cx: 80, cy: 80, r, class: 'trilho' }));
      const g = svg('g', { class: 'a' + i + (est.sobe === k ? ' sobe' : '') });
      const pct = Math.min(100, Math.max(0.5, val / max * 100));
      g.append(svg('circle', { cx: 80, cy: 80, r, class: 'a' + i, pathLength: 100, 'stroke-dasharray': pct + ' 100', 'stroke-linecap': 'round', transform: 'rotate(-90 80 80)' }));
      s.append(g);
    });
    est.sobe = null;
    return s;
  }
  function resumoDia() {
    const faltaProt = Math.round(META.prot - est.prot), faltaAgua = META.agua - est.agua;
    if (faltaProt > 0) return 'Faltam ' + faltaProt + ' g de proteína hoje.';
    if (faltaAgua > 0) return 'Proteína em dia. Faltam ' + faltaAgua + (faltaAgua === 1 ? ' copo' : ' copos') + ' de água.';
    return 'Metas do dia cumpridas. Muito bem!';
  }
  const metrica = (icone, rotulo, conteudo, sub, onclick, extra) => el(onclick ? 'button' : 'div', { type: onclick ? 'button' : null, class: 'metrica' + (extra ? ' ' + extra : ''), onclick },
    el('span', { class: 'cab-m' }, ic(icone, 'p'), rotulo), conteudo, sub ? el('span', { class: 'sub-m', text: sub }) : null);
  // Grupo de escolha única: devolve { no, valor() }.
  function escolha(opcoes, rotulo, inicial) {
    let valor = inicial || '';
    const g = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': rotulo });
    const desenhar = () => trocar(g, opcoes.map(o => el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(valor === o), 'aria-pressed': String(valor === o),
      onclick: () => { valor = o; desenhar(); } }, valor === o ? ic('check', 'p') : null, o)));
    desenhar();
    return { no: g, valor: () => valor };
  }
  const dados = pares => el('dl', { class: 'nutri' }, pares.map(([k, v]) => [el('dt', { text: k }), el('dd', {}, v)]));
  const feito = (k, texto) => est.feitos[k] ? el('p', { class: 'feito-hoje' }, ic('check', 'p'), ' ' + (texto || 'Registrado hoje: ') + est.feitos[k]) : null;
  const explica = texto => el('p', { class: 'aviso info peq', role: 'status', text: texto });
  // Um registro simples: escolhas + "Registrar"; ao registrar, guarda na memória, soma pontos e volta para Registrar.
  function registro(chave, titulo, n, grupos, rotuloBotao) {
    const gs = grupos.map(([pergunta, ops]) => [pergunta, escolha(ops, pergunta, '')]);
    const erro = el('p', { class: 'erro', role: 'alert' });
    return [cartao(titulo, n, feito(chave), ...gs.map(([p, g]) => [el('p', { class: 'rot', text: p }), g.no]), erro,
      el('button', { type: 'button', class: 'botao', onclick: () => {
        const v = gs.map(([, g]) => g.valor());
        if (v.some(x => !x)) { erro.textContent = 'Escolha uma opção em cada pergunta.'; return; }
        est.feitos[chave] = v.join(' · '); ganhar(5, titulo + ' registrado.'); voltar();
      } }, rotuloBotao || 'Registrar'))];
  }

  // ---------------------------------------------------------------- telas
  const TELAS = {
    'boas-vindas': () => {
      const ok = el('button', { type: 'button', class: 'botao', disabled: true, onclick: () => irAba('inicio') }, 'Começar');
      return [el('div', { class: 'bv pilha' },
        el('div', { class: 'selo grande', 'aria-hidden': 'true', text: DEMO.iniciais(DEMO.dados.clinica) }),
        el('h1', { text: 'Bem-vinda, ' + PACIENTE + '!' }),
        el('p', {}, 'Você entrou pelo link que a clínica mandou no WhatsApp. Sem senha. ', item(1)),
        cartao('Antes de começar', 4, el('p', { class: 'peq', text: 'Aqui você registra o seu dia para a equipe acompanhar. Algumas respostas vêm de uma inteligência artificial que segue as orientações da equipe. Ela não diagnostica nem receita.' }),
          el('label', { class: 'aceite' }, el('input', { type: 'checkbox', onchange: e => { est.aceite = e.target.checked; ok.disabled = !est.aceite; } }), 'Li e aceito o termo de uso')),
        ok)];
    },
    inicio: () => {
      const h = new Date().getHours(), saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
      const data = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
      const SEMANA = [['S', 92], ['T', 88], ['Q', 74], ['Q', est.pontos], ['S', 0], ['S', 0], ['D', 0]];
      return [
        cabAba(saudacao + ', ' + PACIENTE, data, 2, 6),
        el('section', { class: 'cartao heroi elevado', 'aria-label': 'Metas do dia' },
          el('div', { class: 'cab-cartao' }, el('p', { class: 'sobretitulo cresce', text: 'Metas do dia' }), item(9)),
          el('div', { class: 'heroi-topo' }, aneis(),
            el('ul', { class: 'legenda-aneis' },
              [['Calorias', milhar(est.kcal), ' de ' + milhar(META.kcal) + ' kcal'], ['Proteína', Math.round(est.prot), ' de ' + META.prot + ' g'], ['Água', est.agua, ' de ' + META.agua + ' copos']].map(([r, v, de], i) =>
                el('li', { class: 'meta' }, el('span', { class: 'ponto a' + i, 'aria-hidden': 'true' }), el('span', { class: 'rotulo', text: r }), el('span', { class: 'valor' }, String(v), el('small', { text: de })))))),
          el('p', { class: 'resumo-dia' }, ic('info'), resumoDia()),
          el('div', { class: 'botoes' },
            el('button', { type: 'button', class: 'botao', onclick: () => abrirRefeicao() }, ic('mais'), 'Registrar refeição'),
            el('button', { type: 'button', class: 'botao sec', onclick: () => { est.agua = Math.min(12, est.agua + 1); est.sobe = 'agua'; ganhar(2, 'Copo de água registrado'); desenharTela('inicio'); } }, ic('gota'), '1 copo de água')),
          el('p', { class: 'mudo peq', text: 'Metas definidas pela equipe da clínica.' })),
        el('div', { class: 'metricas' },
          metrica('medalha', 'Pontos de hoje', el('span', { class: 'numero grande-num' }, String(est.pontos), el('small', { text: ' de 100' })), null, () => abrir('conquistas')),
          metrica('lua', 'Sono', est.feitos.sono ? el('span', { class: 'grande-txt', text: est.feitos.sono.split(' · ')[0] }) : el('span', { class: 'acao-m' }, 'Registrar', ic('seta', 'p')), est.feitos.sono ? est.feitos.sono.split(' · ')[1] : 'Como você dormiu?', () => { est.aba = 'registrar'; abrir('sono'); }),
          metrica('seringa', 'Próxima aplicação', el('span', { class: 'grande-txt', text: est.proxima }), est.aplicada ? 'Registrada nesta semana' : 'Em 3 dias', () => irAba('picadinha')),
          metrica('balanca', 'Peso', el('span', { class: 'numero' }, fmt(est.pesos[est.pesos.length - 1]), el('small', { text: 'kg' })), fmt(est.pesos[est.pesos.length - 1] - est.pesos[0]).replace('-', '−') + ' kg desde o início', () => irAba('evolucao'))),
        el('section', { class: 'cartao' }, el('div', { class: 'cab-cartao' }, el('h2', { text: 'Sua semana' }), item(35)),
          el('div', { class: 'semana-barras', role: 'img', 'aria-label': 'Pontos por dia nesta semana: segunda 92, terça 88, quarta 74, hoje ' + est.pontos + '.' },
            SEMANA.map(([d, v], i) => { const c = el('i'); c.style.transform = 'scaleY(' + (v / 100) + ')'; return el('div', { class: 'dia-b' + (i === 3 ? ' hoje' : ''), 'aria-hidden': 'true' }, el('span', { class: 'coluna' }, v ? c : null), el('span', { class: 'letra', text: d })); })),
          el('div', { class: 'tendencias' }, el('div', { class: 'bloco' }, el('strong', { text: '5 dias' }), el('span', { text: 'seguidos registrando' })),
            el('div', { class: 'bloco' }, el('strong', { text: '92 g' }), el('span', { text: 'de proteína por dia, em média' })))),
        cartao('Próxima consulta', 28, el('p', { text: 'Retorno com ' + DEMO.nomeMedico() }), el('p', { class: 'mudo peq', text: 'Terça, às 14h' + (DEMO.dados.cidade ? ' · ' + DEMO.dados.cidade : '') })),
        cartao('Recado da clínica', 29, el('p', { text: 'Traga os exames de sangue no retorno.' }))];
    },
    registrar: () => {
      const lad = (icone, titulo, sub, acao, n, feito) => el('button', { type: 'button', class: 'ladrilho linha-app', onclick: acao },
        el('span', { class: 'linha-h' }, caixaIc(icone), el('span', { class: 'cresce' }), n ? el('span', { class: 'item-num', text: 'item ' + n, 'aria-hidden': 'true' }) : null),
        el('span', { class: 't1', text: titulo }), el('span', { class: 't2' + (feito ? ' feito' : ''), text: sub || 'Registrar' }));
      return [cabAba('Registrar', 'O que aconteceu hoje?'),
        el('div', { class: 'ladrilhos' },
          lad('prato', 'Refeição', est.comidas.length + (est.comidas.length === 1 ? ' registrada hoje' : ' registradas hoje'), () => abrirRefeicao(), 7, true),
          lad('gota', 'Água', est.agua + ' de ' + META.agua + ' copos', () => abrir('agua'), 11, est.agua > 0),
          lad('lua', 'Sono', est.feitos.sono, () => abrir('sono'), 12, !!est.feitos.sono), lad('corrida', 'Atividade física', est.feitos.atividade, () => abrir('atividade'), 13, !!est.feitos.atividade),
          lad('sorriso', 'Humor', est.feitos.humor, () => abrir('humor'), 14, !!est.feitos.humor), lad('maca', 'Fome e saciedade', est.feitos.fome, () => abrir('fome'), 15, !!est.feitos.fome),
          lad('onda', 'Intestino', est.feitos.intestino, () => abrir('intestino'), 16, !!est.feitos.intestino), lad('pilula', 'Remédios e vitaminas', Object.keys(est.tomou).length + ' de 2 tomados', () => abrir('remedios'), 18, Object.keys(est.tomou).length > 0),
          lad('notas', 'Outros registros', est.feitos.outros || 'Álcool, tabaco e ciclo', () => abrir('outros'), 17, !!est.feitos.outros), lad('livro', 'Plano alimentar', 'O cardápio da equipe', () => abrir('plano'), 10)),
        el('p', { class: 'mudo peq', text: 'Cada registro soma pontos e aparece na ficha que a equipe acompanha.' })];
    },

    plano: () => [cartao('Plano alimentar', 10, el('p', { class: 'mudo peq', text: 'Montado pela equipe da clínica.' }),
      el('ul', { class: 'plano' }, [['Café da manhã', 'Ovos mexidos, pão integral e fruta', 'Pode trocar por: iogurte natural com aveia'], ['Almoço', 'Arroz, feijão, frango e salada', 'Pode trocar por: peixe no lugar do frango'],
        ['Lanche', 'Fruta e castanhas', 'Pode trocar por: queijo branco'], ['Jantar', 'Omelete com legumes', 'Pode trocar por: sopa de legumes com frango']].map(([r, c, t]) => el('li', {}, el('strong', { text: r }), el('span', { text: c }), el('span', { class: 'mudo peq', text: t })))))],
    agua: () => {
      const somar = n => { est.agua = Math.min(12, est.agua + n); ganhar(2, n === 1 ? 'Copo registrado.' : 'Garrafa registrada.'); desenharTela('agua'); };
      return [cartao('Água', 11, el('p', { class: 'grande-num', text: est.agua + ' de ' + META.agua + ' copos' }), barra(est.agua, META.agua, est.agua + ' de ' + META.agua + ' copos'),
        el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao', onclick: () => somar(1) }, ic('gota', 'p'), '1 copo'), el('button', { type: 'button', class: 'botao sec', onclick: () => somar(2) }, ic('gota', 'p'), '1 garrafa (2 copos)')),
        est.agua >= META.agua ? el('p', { class: 'feito-hoje' }, ic('check', 'p'), ' Meta de água do dia cumprida.') : null)];
    },
    sono: () => registro('sono', 'Sono', 12, [['Quantas horas você dormiu?', ['Menos de 5h', '5 a 6h', '7 a 8h', 'Mais de 8h']], ['Como dormiu?', ['Mal', 'Mais ou menos', 'Bem']]]),
    atividade: () => registro('atividade', 'Atividade física', 13, [['O que você fez?', ['Caminhada', 'Musculação', 'Bicicleta', 'Outra']], ['Por quanto tempo?', ['15 min', '30 min', '45 min', '1 hora']]]),
    humor: () => registro('humor', 'Humor', 14, [['Como você está hoje?', ['Mal', 'Mais ou menos', 'Bem', 'Muito bem']]]),
    fome: () => registro('fome', 'Fome e saciedade', 15, [['Antes do almoço', ['Pouca fome', 'Fome normal', 'Muita fome']], ['Depois do almoço', ['Ainda com fome', 'Satisfeita', 'Cheia demais']]]),
    intestino: () => [...registro('intestino', 'Intestino', 16, [['Como está hoje?', ['Normal', 'Preso', 'Solto']]]), el('p', { class: 'mudo peq', text: 'Preso por 3 dias seguidos: a equipe recebe um aviso.' })],
    outros: () => [...registro('outros', 'Outros registros', 17, [['Álcool', ['Não bebi', '1 dose', '2 ou mais']], ['Tabaco', ['Não fumei', 'Fumei']], ['Ciclo menstrual', ['Sem sangramento', 'Menstruada']]]),
      el('p', { class: 'mudo peq', text: 'Só a equipe vê estes registros.' })],
    remedios: () => [cartao('Remédios e vitaminas', 18, el('ul', { class: 'lista-simples' }, [['vitd', 'Vitamina D', '1 cápsula no almoço'], ['omega', 'Ômega 3', '1 cápsula no jantar']].map(([k, n, q]) => el('li', {},
      el('span', { class: 'cresce' }, el('strong', { text: n }), el('br'), el('span', { class: 'mudo peq', text: q })),
      est.tomou[k] ? el('span', { class: 'etq ok' }, ic('check', 'p'), 'Tomei às ' + est.tomou[k]) : el('button', { type: 'button', class: 'botao sec', onclick: () => { const d = new Date(); est.tomou[k] = d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0'); ganhar(2, n + ' registrado.'); desenharTela('remedios'); } }, 'Tomei')))),
      el('p', { class: 'mudo peq', text: 'A lista é da equipe. O app só registra o "tomei".' }))],

    // ---- picadinha: o que a equipe cadastrou (sem números de dose), o lembrete, o rodízio e os sintomas
    picadinha: () => {
      const sint = escolha(['Bem', 'Enjoo leve', 'Enjoo forte', 'Dor no local', 'Tontura'], 'Como você se sente', '');
      const resultado = el('div', { role: 'status' });
      const travado = r => el('span', { class: 'travado' }, ic('cadeado', 'p'), r);
      return [
        cartao('Picadinha', 23, el('p', { class: 'mudo peq', text: 'Cadastrado e conferido pela equipe.' }),
          dados([['Medicamento', travado('Medicamento cadastrado pela equipe')], ['Dose', travado('Preenchido pela equipe')], ['Concentração', travado('Preenchido pela equipe')],
            ['Volume', travado('Preenchido pela equipe')], ['Frequência', '1 vez por semana']]),
          explica('O app mostra o que a equipe cadastrou. Ele não calcula nem muda dose.')),
        cartao('Próxima aplicação', 24, el('p', { class: 'grande-txt', text: est.proxima }), el('p', { class: 'mudo peq', text: est.aplicada ? 'Lembrete marcado para o dia e a hora.' : 'Você recebe um lembrete no dia e na hora.' })),
        cartao('Onde aplicar', 25, el('p', { class: 'mudo peq', text: 'Última: ' + est.local.toLowerCase() + '. Sugerido: ' + est.localEscolhido.toLowerCase() + '.' }), mapaCorpo()),
        cartao('Como se sentiu', [26, 27], sint.no, el('p', { class: 'mudo peq', text: 'A clínica escolhe os sintomas que avisam a enfermagem na hora (aqui, enjoo forte).' }), resultado,
          el('button', { type: 'button', class: 'botao', onclick: () => {
            const s = sint.valor() || 'Bem';
            est.local = est.localEscolhido; est.localEscolhido = est.local === 'Abdômen esquerdo' ? 'Coxa direita' : 'Abdômen esquerdo'; est.proxima = 'Sexta que vem, às 8h'; est.aplicada = true;
            ganhar(5, 'Aplicação registrada.');
            desenharTela('picadinha');
            if (s === 'Enjoo forte') DEMO.janela('Aplicação registrada', el('p', { text: 'A enfermagem da clínica recebeu um aviso sobre o enjoo forte e vai entrar em contato.' }), el('p', { class: 'mudo peq', text: 'Na demonstração, o aviso é simulado.' }));
          } }, 'Registrar aplicação'))];
    },
    evolucao: () => [
      cartao('Gráficos de evolução', 20, grafico(est.pesos, 'Peso de ' + fmt(est.pesos[0]) + ' para ' + fmt(est.pesos[est.pesos.length - 1]) + ' kg'),
        el('p', { class: 'mudo peq', text: 'Peso nos últimos registros: ' + fmt(est.pesos[0]) + ' → ' + fmt(est.pesos[est.pesos.length - 1]) + ' kg.' }),
        el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao sec', onclick: () => abrir('medidas') }, ic('balanca', 'p'), 'Registrar peso'), el('button', { type: 'button', class: 'botao sec', onclick: () => abrir('fotos') }, ic('camera', 'p'), 'Fotos de progresso'))),
      cartao('Avaliação da consulta', 21, el('p', { class: 'mudo peq', text: 'Medido na clínica, separado do que você registra.' }),
        dados([['Peso', '75,8 kg'], ['Gordura', '31%'], ['Massa muscular', '27,4 kg'], ['Cintura', '86 cm']]))],
    medidas: () => {
      const peso = el('input', { class: 'entrada', id: 'peso', inputmode: 'decimal', value: fmt(est.pesos[est.pesos.length - 1] - 0.3) });
      const erro = el('p', { class: 'erro', role: 'alert' });
      return [cartao('Peso e medidas', 19, el('label', { class: 'campo', for: 'peso' }, el('span', { text: 'Peso (kg)' }), peso),
        el('label', { class: 'campo' }, el('span', { text: 'Cintura (cm)' }), el('input', { class: 'entrada', inputmode: 'decimal', value: '85' })), erro,
        el('button', { type: 'button', class: 'botao', onclick: () => {
          const v = Number(peso.value.replace(',', '.'));
          if (!(v > 30 && v < 300)) { erro.textContent = 'Confira o peso.'; return; }
          est.pesos.push(v); ganhar(5, 'Peso registrado.'); voltar();
        } }, 'Registrar'))];
    },
    fotos: () => { const r = el('div'); return [cartao('Fotos de progresso', 22, el('p', { class: 'mudo peq', text: 'Só você e a equipe veem.' }),
      el('div', { class: 'fotos' }, el('div', { class: 'foto' }, ic('camera', 'g'), 'Antes'), el('div', { class: 'foto' }, ic('camera', 'g'), 'Agora')), r,
      el('button', { type: 'button', class: 'botao', onclick: () => trocar(r, explica('No app de verdade, abre a câmera ou a galeria. A foto vai para a sua ficha na clínica.')) }, 'Adicionar foto'))]; },

    // ---- mais
    mais: () => [el('h1', { text: 'Perfil e mais' }), el('ul', { class: 'lista-app' },
      linhaIr('usuario', 'Perfil e objetivo', null, 'perfil', 5), linhaIr('calendario', 'Minhas consultas', null, 'consultas', 28), linhaIr('megafone', 'Avisos da clínica', null, 'avisos', 29),
      linhaIr('sino', 'Lembretes', null, 'lembretes', 30), linhaIr('livro', 'Conteúdo da clínica', null, 'conteudo', 31), linhaIr('clipe', 'Enviar exames', null, 'exames', 32),
      linhaIr('pessoas', 'Equipe e contatos', null, 'equipe', 33), linhaIr('conversa', 'Chat com a equipe', null, 'chat-equipe', 34), linhaIr('medalha', 'Conquistas', null, 'conquistas', 35),
      linhaIr('pergunta', 'Assistente de dúvidas', null, 'assistente', 36), linhaIr('cadeado', 'Meus dados', null, 'meus-dados', 37), linhaIr('texto', 'Leitura confortável', null, 'leitura', 38)),
      cartao('Ícone na tela do celular', 3, el('p', { class: 'peq', text: 'No navegador, toque em Compartilhar e depois em "Adicionar à Tela de Início". O app vira um ícone com a marca da clínica.' }))],
    perfil: () => [cartao('Perfil e objetivo', 5, dados([['Altura', '1,64 m'], ['Peso inicial', '78,4 kg'], ['Objetivo', 'Perder gordura e ter mais disposição'], ['Fase', 'Adaptação (o médico define)']]))],
    consultas: () => [cartao('Minhas consultas', 28, el('ul', { class: 'lista-simples' },
      el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: 'Terça, às 14h' }), el('br'), el('span', { class: 'mudo peq', text: 'Retorno com ' + DEMO.nomeMedico() })),
        est.presenca ? el('span', { class: 'etq ok' }, ic('check', 'p'), 'Presença confirmada') : el('button', { type: 'button', class: 'botao sec', onclick: () => { est.presenca = true; DEMO.rapida('Presença confirmada. A clínica foi avisada.'); desenharTela('consultas'); } }, 'Confirmar presença')),
      el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: 'Daqui a um mês' }), el('br'), el('span', { class: 'mudo peq', text: 'Avaliação com a nutricionista' })))))],
    avisos: () => [cartao('Avisos da clínica', 29, el('ul', { class: 'lista-simples' }, [['exames', 'Traga os exames de sangue no retorno.'], ['feriado', 'A clínica fecha no feriado de sexta.']].map(([k, t]) => el('li', {},
      el('span', { class: 'cresce', text: t }), est.lidos[k] ? el('span', { class: 'etq', text: 'Lido' }) : el('button', { type: 'button', class: 'botao sec', onclick: () => { est.lidos[k] = true; desenharTela('avisos'); } }, 'Marcar como lido')))))],
    lembretes: () => [cartao('Lembretes', 30, el('ul', { class: 'lista-simples' }, [['Refeições', '8h, 12h, 16h e 20h'], ['Água', 'A cada 2 horas'], ['Remédios', '12h e 20h'], ['Aplicação', 'Sexta, às 8h'], ['Consulta', 'Na véspera']].map(([a, b]) =>
      el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: a }), el('br'), el('span', { class: 'mudo peq', text: b })),
        el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': 'true', 'aria-label': 'Lembrete de ' + a.toLowerCase(), onclick: e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(on)); DEMO.rapida('Lembrete de ' + a.toLowerCase() + (on ? ' ligado.' : ' desligado.')); } })))))],
    conteudo: () => { const r = el('div'); return [cartao('Conteúdo da clínica', 31, el('ul', { class: 'lista-app' }, [['Vídeo', 'Como montar o prato', 'Metade do prato com legumes, um quarto com proteína e um quarto com arroz, feijão ou batata.'],
      ['Artigo', 'Proteína em cada refeição', 'Ovos, frango, peixe, iogurte e feijão ajudam a manter a massa muscular.'], ['Receita', 'Omelete de forno com legumes', '4 ovos, legumes picados e queijo branco. Forno médio até dourar.']].map(([tipo, t, d]) =>
      el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => trocar(r, cartao(t, null, el('p', { class: 'mudo peq', text: tipo + ' da equipe' }), el('p', { text: d }))) },
        caixaIc(tipo === 'Vídeo' ? 'camera' : 'livro'), el('span', { class: 'cresce' }, el('span', { class: 't1', text: t }), el('span', { class: 't2', text: tipo })), ic('seta', 'p')))))), r]; },
    exames: () => { const r = el('div'); return [cartao('Enviar exames', 32, el('p', { class: 'mudo peq', text: 'Foto ou PDF do exame vai direto para a sua ficha.' }), r,
      el('button', { type: 'button', class: 'botao', onclick: () => trocar(r, explica('No app de verdade, abre os arquivos do celular. O exame chega na ficha e a equipe vê na central.')) }, ic('clipe', 'p'), 'Escolher arquivo'))]; },
    equipe: () => [cartao('Equipe e contatos', 33, el('ul', { class: 'lista-simples' }, [[DEMO.nomeMedico(), DEMO.dados.especialidade], ['Nutricionista Paula', 'Plano alimentar'], ['Enfermeira Carla', 'Aplicações e sintomas'], ['Recepção', 'Consultas e horários']].map(([n, f]) =>
      el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: n }), el('br'), el('span', { class: 'mudo peq', text: f })), el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Escrever para ' + n, onclick: () => abrir('chat-equipe') }, 'Escrever')))))],
    'chat-equipe': () => chat('equipe', 34, 'Chat com a equipe', 'Escreva para a equipe da clínica.'),
    assistente: () => chat('ia', 36, 'Assistente de dúvidas', 'Pergunte sobre as orientações da sua equipe.'),
    conquistas: () => [cartao('Conquistas', 35, el('ul', { class: 'lista-simples' }, [['fogo', '5 dias seguidos registrando'], ['gota', 'Meta de água em 3 dias da semana'], ['medalha', 'Primeira semana completa']].map(([i, t]) =>
      el('li', {}, caixaIc(i, 'peq'), el('span', { class: 'cresce', text: t })))), el('p', { class: 'mudo peq', text: 'Pontos de hoje: ' + est.pontos + ' de 100.' }))],
    'meus-dados': () => { const r = el('div'); return [cartao('Meus dados', 37, el('p', { class: 'peq', text: 'Baixe o que você registrou ou peça a exclusão dos seus dados (LGPD).' }), r,
      el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao', onclick: () => trocar(r, explica('No app de verdade, você recebe um arquivo com tudo o que registrou.')) }, 'Baixar meus dados'),
        el('button', { type: 'button', class: 'botao sec', onclick: () => trocar(r, explica('No app de verdade, o pedido vai para a clínica, que confirma e apaga os dados.')) }, 'Pedir a exclusão')))]; },
    leitura: () => [cartao('Leitura confortável', 38, el('div', { class: 'botoes' },
      el('button', { type: 'button', class: 'botao sec', 'aria-pressed': String(document.documentElement.dataset.tema === 'escuro'), onclick: e => { const h = document.documentElement; h.dataset.tema = h.dataset.tema === 'escuro' ? '' : 'escuro'; e.currentTarget.setAttribute('aria-pressed', String(h.dataset.tema === 'escuro')); } }, ic('lua', 'p'), 'Modo escuro'),
      el('button', { type: 'button', class: 'botao sec', 'aria-pressed': String(document.documentElement.dataset.letra === 'grande'), onclick: e => { const h = document.documentElement; h.dataset.letra = h.dataset.letra === 'grande' ? '' : 'grande'; e.currentTarget.setAttribute('aria-pressed', String(h.dataset.letra === 'grande')); } }, ic('texto', 'p'), 'Letra grande')))]
  };
  const NOMES = { refeicao: 'Refeição', buscar: 'Buscar alimento', alimento: 'Alimento', foto: 'Foto do prato', codigo: 'Código de barras', plano: 'Plano alimentar', agua: 'Água', sono: 'Sono',
    atividade: 'Atividade física', humor: 'Humor', fome: 'Fome e saciedade', intestino: 'Intestino', outros: 'Outros registros', remedios: 'Remédios e vitaminas', medidas: 'Peso e medidas',
    fotos: 'Fotos de progresso', perfil: 'Perfil', consultas: 'Consultas', avisos: 'Avisos', lembretes: 'Lembretes', conteudo: 'Conteúdo', exames: 'Exames', equipe: 'Equipe',
    'chat-equipe': 'Chat com a equipe', assistente: 'Assistente', conquistas: 'Conquistas', 'meus-dados': 'Meus dados', leitura: 'Leitura' };

  // ---------------------------------------------------------------- folha de refeição: buscar, foto e código de barras
  // Tocar → escolher → "Registrar no …" → a confirmação → o anel sobe na tela Hoje.
  const sem = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const REFEICOES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'];
  function abrirRefeicao(vista) {
    const f = DEMO.folha({ titulo: 'Registrar refeição', dentro: document.querySelector('.celular') || undefined, foco: vista === 'foto' || vista === 'codigo' ? '.corpo-folha .botao' : '#busca-alimento',
      aoFechar: () => DEMO.tela(est.pilha[est.pilha.length - 1] || est.aba) });
    const ir = { busca: vistaBusca, foto: vistaFoto, codigo: vistaCodigo, alimento: vistaAlimento };
    function vistaBusca() {
      DEMO.tela('buscar');
      const seg = el('div', { class: 'seg largo', role: 'radiogroup', 'aria-label': 'Qual refeição' });
      const desenharSeg = () => trocar(seg, REFEICOES.map(r => el('button', { type: 'button', role: 'radio', 'aria-checked': String(est.refeicao === r), 'aria-pressed': String(est.refeicao === r),
        onclick: () => { est.refeicao = r; desenharSeg(); } }, r)));
      desenharSeg();
      const campo = el('input', { class: 'entrada', type: 'search', id: 'busca-alimento', placeholder: 'Buscar alimento', autocomplete: 'off', enterkeyhint: 'search', value: est.busca, 'aria-label': 'Buscar alimento' });
      const lista = el('ul', { class: 'busca-res', 'aria-live': 'polite' });
      const achar = () => {
        const q = sem(campo.value.trim()); est.busca = campo.value;
        const achados = ALIMENTOS.filter(a => !q || sem(a.nome).includes(q));
        trocar(lista, achados.length ? achados.map(a => el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => { est.alimento = a; est.porcao = 1; f.trocar(a.nome, vistaAlimento(), () => f.trocar('Registrar refeição', vistaBusca())); } },
          caixaIc('prato'), el('span', { class: 'cresce' }, el('span', { class: 't1', text: a.nome }), el('span', { class: 't2', text: a.porcao })), el('span', { class: 'mudo peq tab', text: a.kcal + ' kcal' }), ic('seta', 'p'))))
          : el('li', {}, el('div', { class: 'vazio' }, ilustracaoVazia(), el('p', { text: 'Nada com esse nome por aqui.' }), el('p', { class: 'peq', text: 'Na demonstração, tente "arroz" ou "frango".' }))));
      };
      campo.addEventListener('input', achar); achar();
      return [el('div', { class: 'linha-h' }, el('p', { class: 'mudo peq cresce', text: 'Escolha a refeição e o alimento.' }), item(7)), seg,
        el('div', { class: 'busca-campo' }, ic('busca'), campo),
        el('div', { class: 'atalhos' }, el('button', { type: 'button', class: 'botao sec', onclick: () => f.trocar('Foto do prato', vistaFoto(), () => f.trocar('Registrar refeição', vistaBusca())) }, ic('camera'), 'Foto do prato'),
          el('button', { type: 'button', class: 'botao sec', onclick: () => f.trocar('Código de barras', vistaCodigo(), () => f.trocar('Registrar refeição', vistaBusca())) }, ic('barras'), 'Código de barras')),
        lista,
        est.comidas.length ? el('section', { class: 'pilha' }, el('p', { class: 'sobretitulo', text: 'Hoje' }), el('ul', { class: 'lista-hoje' }, est.comidas.map(c => el('li', {},
          el('span', { class: 'cresce' }, el('strong', { text: c.refeicao }), el('br'), el('span', { class: 'peq mudo', text: c.nome })), el('span', { class: 'peq tab', text: milhar(c.kcal) + ' kcal' }))))) : null];
    }
    function vistaAlimento() {
      DEMO.tela('alimento');
      const a = est.alimento || ALIMENTOS[0];
      const kcal = el('span', { class: 'numero' }), out = el('output', { 'aria-live': 'polite' });
      const MAC = [['prot', 'Proteínas', 40, ''], ['carb', 'Carboidratos', 60, ' carb'], ['gord', 'Gorduras', 30, ' gord']];
      const linhas = MAC.map(([k, n, ref, cls]) => { const v = el('span', { class: 'val-m' }), b = el('div', { class: 'barra', 'aria-hidden': 'true' }, el('i')); return [k, ref, v, b, el('div', { class: 'macro' + cls }, el('span', { class: 'nome-m', text: n }), v, b)]; });
      const botao = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => registrarComida([{ ...a, kcal: a.kcal * est.porcao, prot: a.prot * est.porcao }], f) });
      const atualizar = () => {
        trocar(kcal, milhar(a.kcal * est.porcao), el('small', { text: 'kcal' }));
        trocar(out, (est.porcao === 0.5 ? 'Meia porção' : fmt(est.porcao) + (est.porcao === 1 ? ' porção' : ' porções')));
        for (const [k, ref, v, b] of linhas) { v.textContent = fmt(a[k] * est.porcao) + ' g'; b.firstChild.style.transform = 'scaleX(' + Math.min(1, a[k] * est.porcao / ref) + ')'; }
        menos.disabled = est.porcao <= 0.5; mais.disabled = est.porcao >= 4;
        botao.textContent = 'Registrar no ' + est.refeicao.toLowerCase();
      };
      const passo = d => { est.porcao = Math.min(4, Math.max(0.5, est.porcao + d)); atualizar(); };
      const menos = el('button', { type: 'button', 'aria-label': 'Menos meia porção', onclick: () => passo(-0.5) }, ic('fechar', 'p'));
      menos.replaceChildren(svgMenos());
      const mais = el('button', { type: 'button', 'aria-label': 'Mais meia porção', onclick: () => passo(0.5) }, ic('mais', 'p'));
      atualizar();
      return [el('div', { class: 'linha-h' }, el('p', { class: 'mudo peq cresce', text: 'Porção: ' + a.porcao + '. Valores de exemplo.' }), item(8)),
        el('div', { class: 'det-num' }, kcal),
        el('div', { class: 'macros', role: 'group', 'aria-label': 'Nutrientes' }, linhas.map(x => x[4])),
        el('div', { class: 'porcao-linha' }, el('span', { class: 'rot', text: 'Quanto você comeu?' }), el('div', { class: 'passo' }, menos, out, mais)),
        botao];
    }
    function vistaFoto() {
      DEMO.tela('foto');
      if (!est.foto) {
        const area = el('div', { class: 'foto-leitura' }, caixaIc('camera', 'grande'), el('p', { text: 'Aponte a câmera para o prato.' }));
        const tirar = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
          tirar.disabled = true; trocar(area, el('div', { class: 'esqueleto', role: 'status', 'aria-label': 'Lendo a foto' }, el('i'), el('i', { class: 'curto' }), el('i')), el('p', { text: 'Lendo a foto…' }));
          setTimeout(() => { est.foto = [ALIMENTOS[0], ALIMENTOS[1], ALIMENTOS[2], ALIMENTOS[7]].map(x => ({ ...x, marcado: true })); f.trocar('Encontrei no prato', vistaFoto(), () => f.trocar('Registrar refeição', vistaBusca())); }, 1000);
        } }, ic('camera'), 'Tirar a foto');
        return [el('div', { class: 'linha-h' }, el('p', { class: 'mudo peq cresce', text: 'Na demonstração, a câmera não abre: a leitura é simulada.' }), item(7)), area, tirar];
      }
      const total = () => est.foto.filter(x => x.marcado);
      const rotulo = () => 'Registrar ' + total().length + (total().length === 1 ? ' alimento' : ' alimentos');
      const botao = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => { if (total().length) registrarComida(total(), f); } }, rotulo());
      return [el('p', { class: 'mudo peq', text: 'Confira e tire o que não comeu.' }),
        el('ul', { class: 'lista-simples' }, est.foto.map(x => el('li', {}, el('label', { class: 'marcar' }, el('input', { type: 'checkbox', checked: x.marcado, onchange: e => { x.marcado = e.target.checked; botao.textContent = rotulo(); botao.disabled = !total().length; } }),
          el('span', { class: 'cresce', text: x.nome }), el('span', { class: 'mudo peq tab', text: x.kcal + ' kcal' }))))), botao,
        el('button', { type: 'button', class: 'botao leve', onclick: () => { est.foto = null; f.trocar('Foto do prato', vistaFoto(), () => f.trocar('Registrar refeição', vistaBusca())); } }, 'Tirar outra foto')];
    }
    function vistaCodigo() {
      DEMO.tela('codigo');
      const area = el('div', { class: 'foto-leitura' }, caixaIc('barras', 'grande'), el('p', { text: 'Aponte a câmera para o código de barras.' }));
      const ler = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
        ler.disabled = true; trocar(area, el('div', { class: 'esqueleto', role: 'status', 'aria-label': 'Lendo o código' }, el('i'), el('i', { class: 'curto' })), el('p', { text: 'Lendo o código…' }));
        setTimeout(() => { est.alimento = { nome: 'Iogurte natural integral (produto de exemplo)', porcao: '1 pote', kcal: 105, prot: 6.5, carb: 8, gord: 5.4 }; est.porcao = 1;
          f.trocar('Iogurte natural integral', vistaAlimento(), () => f.trocar('Registrar refeição', vistaBusca())); }, 1000);
      } }, ic('barras'), 'Ler o código');
      return [el('p', { class: 'mudo peq', text: 'Na demonstração, a leitura é simulada.' }), area, ler];
    }
    const v = ir[vista] ? vista : 'busca';
    f.trocar(v === 'foto' ? 'Foto do prato' : v === 'codigo' ? 'Código de barras' : 'Registrar refeição', ir[v](), v === 'busca' ? null : () => f.trocar('Registrar refeição', vistaBusca()));
    return f;
  }
  const svgMenos = () => { const s = ic('mais', 'p'); s.firstChild.setAttribute('d', 'M5 12h14'); return s; };
  // Ilustração simples para os estados vazios (traço na cor da clínica).
  function ilustracaoVazia() {
    const s = svg('svg', { viewBox: '0 0 120 80', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' });
    s.append(svg('ellipse', { cx: 60, cy: 52, rx: 40, ry: 12, opacity: '.35' }), svg('path', { d: 'M28 50a32 32 0 0 1 64 0' }), svg('path', { d: 'M52 30l6 6 12-12', 'stroke-width': '2.5' }), svg('circle', { cx: 98, cy: 18, r: 3, opacity: '.5' }), svg('circle', { cx: 18, cy: 26, r: 2, opacity: '.5' }));
    return s;
  }
  function registrarComida(lista, f) {
    for (const c of lista) { est.kcal += c.kcal; est.prot += c.prot; est.comidas.push({ nome: c.nome, refeicao: est.refeicao, kcal: c.kcal, prot: c.prot }); }
    est.busca = ''; est.foto = null; est.sobe = est.prot < META.prot ? 'prot' : 'kcal';
    f.fechar(() => { ganhar(5, lista.length > 1 ? lista.length + ' alimentos registrados' : 'Registrado no ' + est.refeicao.toLowerCase()); irAba('inicio'); });
  }
  // Mapa do corpo (frente): abdômen, coxas e braços. A última aplicação aparece riscada; a sugerida, na cor da clínica.
  function mapaCorpo() {
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 200 260'); s.setAttribute('class', 'corpo'); s.setAttribute('role', 'img');
    s.setAttribute('aria-label', 'Mapa do corpo. Última aplicação: ' + est.local.toLowerCase() + '. Sugerido: ' + est.localEscolhido.toLowerCase() + '.');
    const forma = (tag, at) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); s.append(e); return e; };
    forma('circle', { cx: 100, cy: 24, r: 16, class: 'silhueta' });
    forma('rect', { x: 66, y: 44, width: 68, height: 104, rx: 18, class: 'silhueta' });
    forma('rect', { x: 40, y: 48, width: 20, height: 92, rx: 10, class: 'silhueta' });
    forma('rect', { x: 140, y: 48, width: 20, height: 92, rx: 10, class: 'silhueta' });
    forma('rect', { x: 70, y: 150, width: 26, height: 102, rx: 12, class: 'silhueta' });
    forma('rect', { x: 104, y: 150, width: 26, height: 102, rx: 12, class: 'silhueta' });
    // Lados como o paciente vê o próprio corpo de frente (o lado direito dele fica à esquerda da imagem).
    const LOCAIS = { 'Braço direito': [50, 80], 'Braço esquerdo': [150, 80], 'Abdômen direito': [86, 112], 'Abdômen esquerdo': [114, 112], 'Coxa direita': [83, 185], 'Coxa esquerda': [117, 185] };
    for (const [nome, [x, y]] of Object.entries(LOCAIS)) {
      const cls = nome === est.localEscolhido ? 'local sugerido' : nome === est.local ? 'local ultimo' : 'local';
      forma('circle', { cx: x, cy: y, r: 9, class: cls });
    }
    const legenda = el('div', { class: 'legenda' }, el('span', { class: 'leg sugerido' }, 'Sugerido: ' + est.localEscolhido.toLowerCase()), el('span', { class: 'leg ultimo' }, 'Última: ' + est.local.toLowerCase()));
    const escolher = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Onde vai aplicar' }, Object.keys(LOCAIS).map(n => el('button', { type: 'button', class: 'chip', role: 'radio',
      'aria-checked': String(n === est.localEscolhido), 'aria-pressed': String(n === est.localEscolhido), disabled: n === est.local,
      onclick: () => { est.localEscolhido = n; desenharTela('picadinha'); } }, n === est.localEscolhido ? ic('check', 'p') : null, n)));
    return el('div', { class: 'mapa' }, s, legenda, el('p', { class: 'rot', text: 'Onde vai aplicar desta vez?' }), escolher);
  }
  function grafico(v, rotulo) {
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), min = Math.min(...v) - 0.5, max = Math.max(...v) + 0.5;
    s.setAttribute('viewBox', '0 0 300 120'); s.setAttribute('class', 'grafico'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo);
    const pts = v.map((x, i) => [10 + i * (280 / (v.length - 1)), 110 - (x - min) / (max - min) * 100]);
    const p = document.createElementNS(ns, 'polyline'); p.setAttribute('points', pts.map(x => x.join(',')).join(' ')); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '3'); s.append(p);
    for (const [x, y] of pts) { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '4'); c.setAttribute('fill', 'currentColor'); s.append(c); }
    return s;
  }
  // Chats de exemplo: nenhuma IA de verdade; a resposta é pronta. A pergunta vai para o registro da demonstração.
  const conversas = { ia: [], equipe: [] };
  function chat(qual, n, titulo, ajuda) {
    const inicio = qual === 'ia' ? 'Oi, ' + PACIENTE + '! Respondo com base nas orientações da sua equipe. Não faço diagnóstico nem receito.' : 'Enfermeira Carla: “Oi, ' + PACIENTE + '! Pode escrever aqui suas dúvidas sobre a aplicação.”';
    const lista = el('div', { class: 'conversa', 'aria-live': 'polite' }, bolha('outro', inicio), conversas[qual].map(([q, t]) => bolha(q, t)));
    const campo = el('input', { class: 'entrada', id: 'msg-' + qual, maxlength: '300', autocomplete: 'off', placeholder: 'Escreva sua mensagem', 'aria-label': 'Mensagem' });
    const enviar = e => {
      e.preventDefault(); const t = campo.value.trim(); if (!t) return;
      conversas[qual].push(['eu', t]); lista.append(bolha('eu', t)); campo.value = '';
      DEMO.evento('pergunta', { chat: qual, texto: t.slice(0, 300) });
      const resp = qual === 'ia'
        ? 'Pela orientação da sua equipe: mantenha os registros do dia e leve essa dúvida ao retorno. Se algo mudou no tratamento ou você sentiu algo diferente, fale com a equipe no chat.'
        : 'Enfermeira Carla: “Recebi, ' + PACIENTE + '. Vejo com a equipe e te respondo hoje.”';
      setTimeout(() => { conversas[qual].push(['outro', resp]); lista.append(bolha('outro', resp)); }, 700);
    };
    return [cartao(titulo, n, el('p', { class: 'mudo peq', text: ajuda }), lista,
      el('p', { class: 'mudo peq', text: qual === 'ia' ? 'Na demonstração, as respostas são exemplos prontos. Não escreva dados de pacientes.' : 'A resposta da equipe chega igual, entre aspas, sem alteração. Na demonstração, ela é um exemplo pronto.' }),
      el('form', { class: 'enviar-msg', onsubmit: enviar }, campo, el('button', { class: 'botao', type: 'submit', 'aria-label': 'Enviar mensagem' }, ic('enviar', 'p'), 'Enviar')))];
  }
  const bolha = (quem, texto) => el('div', { class: 'bolha ' + quem, text: texto });

  // ---------------------------------------------------------------- navegação (dentro da página; o # guarda o código)
  // 4 abas na barra de vidro; o perfil fica no canto de cada aba (o antigo "Mais").
  const ABAS = [['inicio', 'Hoje', 'hoje'], ['registrar', 'Registrar', 'registrar'], ['picadinha', 'Picadinha', 'seringa'], ['evolucao', 'Evolução', 'grafico']];
  function irAba(aba) { est.aba = aba; est.pilha = []; desenhar(aba); }
  function abrir(tela) { est.pilha.push(tela); desenhar(tela); }
  function voltar() { est.pilha.pop(); desenhar(est.pilha[est.pilha.length - 1] || est.aba); }
  function desenharTela(tela) { desenhar(tela, true); }
  // Troca de tela com transição; a primeira tela e as atualizações da mesma tela, direto.
  function desenhar(tela, mesma) {
    if (mesma || !document.querySelector('.celular')) montarTela(tela, mesma); else DEMO.transicao(() => montarTela(tela, mesma));
  }
  function montarTela(tela, mesma) {
    const rolagemAntes = document.querySelector('.rolagem');
    const topoAntes = mesma ? (rolagemAntes ? rolagemAntes.scrollTop : 0) : 0;
    const corpo = TELAS[tela] ? TELAS[tela]() : TELAS.inicio();
    const sub = est.pilha.length > 0;
    const telaApp = el('main', { class: 'tela-app', id: 'conteudo', tabindex: '-1' },
      sub ? el('div', { class: 'cab-sub' }, el('button', { type: 'button', class: 'botao sec quadrado pilula', 'aria-label': 'Voltar', onclick: voltar }, ic('voltar')), el('strong', { class: 'cresce', text: NOMES[tela] || '' })) : null, corpo);
    const abas = tela === 'boas-vindas' ? null : el('nav', { class: 'abas-app vidro', 'aria-label': 'Partes do app' }, ABAS.map(([k, n, i]) => {
      const ativa = est.aba === k;
      return el('button', { type: 'button', 'aria-current': ativa ? 'page' : null, onclick: () => irAba(k) }, ic(i, null, ativa), n);
    }));
    const rolagem = el('div', { class: 'rolagem' }, telaApp);
    const outras = () => [el('a', { class: 'botao sec', href: DEMO.link('central') }, 'Ver a central do médico'), el('a', { class: 'botao sec', href: DEMO.link('escopo') }, 'Montar o escopo'), DEMO.botaoConversar('leve')];
    const ladoEsq = el('aside', { class: 'lado-app esq', 'aria-label': 'Como usar' }, el('p', { class: 'sobretitulo', text: 'App do paciente' }), el('h2', { text: 'Toque como se fosse a ' + PACIENTE + '.' }),
      el('p', { class: 'dica' }, caixaIc('prato', 'peq'), 'Registre uma refeição e veja o anel do dia subir.'),
      el('p', { class: 'dica' }, caixaIc('seringa', 'peq'), 'Na picadinha, o que é da equipe vem travado.'),
      el('p', { class: 'dica' }, caixaIc('lista', 'peq'), 'Os marcadores "item" levam ao escopo.'));
    const ladoDir = el('aside', { class: 'lado-app dir', 'aria-label': 'Outras partes' }, el('p', { class: 'sobretitulo', text: 'Continue por aqui' }), el('div', { class: 'pilha' }, outras()));
    trocar(raiz, DEMO.topo('App do paciente · demonstração', 'entrada'),
      el('div', { class: 'palco' }, ladoEsq, el('div', { class: 'celular' }, rolagem, abas), ladoDir),
      DEMO.embed ? null : el('div', { class: 'rodape-demo so-estreito' }, outras()));
    DEMO.tela(tela);
    if (!mesma) window.scrollTo(0, 0);
    rolagem.scrollTop = topoAntes;
  }

  DEMO.iniciar({ pagina: 'app', raiz, montar: d => {
    document.title = 'App do paciente · ' + d.clinica;
    const pedida = DEMO.extra.tela;
    const REGISTRAR = ['plano', 'agua', 'sono', 'atividade', 'humor', 'fome', 'intestino', 'outros', 'remedios'];
    const FOLHA = { refeicao: 'busca', buscar: 'busca', alimento: 'busca', foto: 'foto', codigo: 'codigo' };
    if (FOLHA[pedida]) { irAba('inicio'); abrirRefeicao(FOLHA[pedida]); }
    else if (pedida && TELAS[pedida] && pedida !== 'boas-vindas') {
      if (['inicio', 'registrar', 'picadinha', 'evolucao', 'mais'].includes(pedida)) irAba(pedida);
      else { est.aba = REGISTRAR.includes(pedida) ? 'registrar' : ['medidas', 'fotos'].includes(pedida) ? 'evolucao' : 'mais'; abrir(pedida); }
    } else desenhar('boas-vindas');
  } });
})();
