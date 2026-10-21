// App do paciente da demonstração (DEC-125): itens 1 a 38 do escopo. Paciente de mentira (Mariana).
// Os dados vêm de comum/dados.js, a mesma fonte da central: o que a pessoa registra aqui aparece na ficha da central na
// mesma visita, e o que a central muda (metas, conferência da prescrição, recados, funções) aparece aqui.
// Tudo fica na memória da página (some ao recarregar); o servidor recebe só o registro de uso que já existe.
// Regras fixas: o app não calcula dose (as aplicações mostram o que a equipe cadastrou, sem números); o assistente nunca
// diagnostica nem receita; a resposta da equipe no chat chega citada, entre aspas e sem alteração.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const M = window.DEMO_MODELO, m = M.mariana;
  const ic = (n, t, c) => window.DEMO_ICONE(n, t, c);
  const fmt = M.fmt, inteiro = M.inteiro;
  let raiz = null;
  const PACIENTE = m.primeiro;
  const est = { pilha: [], aba: 'inicio', aceite: false, refeicao: 'Almoço', busca: '', alimento: null, porcao: 1, foto: null, sobe: null, periodo: '3 meses', ponto: null, localEscolhido: null, lidos: {} };
  const confirmar = (texto, pts) => DEMO.confirmar(texto, pts ? '+' + pts + ' pontos' : null);
  const agoraReal = () => new Date();
  const registroHoje = k => m.registros.filter(r => r.chave === k).slice(-1)[0];
  const quem = c => c === 'medico' ? M.medico() : c === 'nutri' ? 'a nutricionista ' + M.EQUIPE.nutri : c;

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

  // ---------------------------------------------------------------- peças
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'linha-h cab-cartao' }, el('h2', { class: 'cresce', text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const caixaIc = (n, extra) => el('span', { class: 'caixa-ic' + (extra ? ' ' + extra : ''), 'aria-hidden': 'true' }, ic(n));
  const origem = texto => el('p', { class: 'origem' }, ic('info', 'p'), texto);
  const linhaIr = (icone, titulo, sub, tela, n) => el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => abrir(tela) },
    caixaIc(icone), el('span', { class: 'cresce' }, el('span', { class: 't1', text: titulo }), sub ? el('span', { class: 't2', text: sub }) : null),
    n ? el('span', { class: 'item-num', text: 'item ' + n, 'aria-hidden': 'true' }) : null, ic('seta', 'p')));
  const grupoLista = (titulo, linhas) => el('section', { class: 'pilha grupo-lista' }, el('p', { class: 'sobretitulo', text: titulo }),
    el('ul', { class: 'lista-app' }, linhas.filter(Boolean).map(([i, t, sub, tela, n]) => linhaIr(i, t, sub, tela, n))));
  const barra = (valor, max, rotulo) => { const b = el('div', { class: 'barra', role: 'img', 'aria-label': rotulo }); const i = el('i'); i.style.transform = 'scaleX(' + Math.min(1, Math.max(0, valor / max)) + ')'; b.append(i); return b; };
  const svg = (tag, at) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
  const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);
  // Cabeçalho das abas: título grande (a marca da clínica e o perfil ficam na barra de cima do app).
  const cabAba = (titulo, antes, ...marcadores) => el('header', { class: 'cab-app' },
    el('div', { class: 'cresce' }, antes ? el('p', { class: 'sobretitulo', text: antes }) : null, el('h1', { text: titulo }), marcadores.length ? el('div', { class: 'marcadores' }, marcadores.map(item)) : null));
  // Os 3 anéis do dia (calorias, proteína e água). Movimento só com rotate e opacity; o anel que acabou de mudar "sobe".
  function aneis(c) {
    const v = [[c.kcal, m.metas.kcal, 'kcal'], [c.prot, m.metas.prot, 'prot'], [c.agua, m.metas.agua, 'agua']];
    const s = svg('svg', { viewBox: '0 0 160 160', class: 'aneis', role: 'img',
      'aria-label': 'Calorias ' + inteiro(c.kcal) + ' de ' + inteiro(m.metas.kcal) + ' kcal; proteína ' + fmt(c.prot) + ' de ' + m.metas.prot + ' g; água ' + inteiro(c.agua) + ' de ' + inteiro(m.metas.agua) + ' mL.' });
    v.forEach(([val, max, k], i) => {
      const r = 70 - i * 19;
      s.append(svg('circle', { cx: 80, cy: 80, r, class: 'trilho' }));
      const g = svg('g', { class: 'a' + i + (est.sobe === k ? ' sobe' : '') });
      g.append(svg('circle', { cx: 80, cy: 80, r, class: 'a' + i, pathLength: 100, 'stroke-dasharray': Math.min(100, Math.max(0.5, val / max * 100)) + ' 100', 'stroke-linecap': 'round', transform: 'rotate(-90 80 80)' }));
      s.append(g);
    });
    est.sobe = null;
    return s;
  }
  function resumoDia(c) {
    const faltaProt = Math.round(m.metas.prot - c.prot), faltaAgua = m.metas.agua - c.agua;
    if (faltaProt > 0) return 'Faltam ' + faltaProt + ' g de proteína hoje.';
    if (faltaAgua > 0) return 'Proteína em dia. Faltam ' + inteiro(faltaAgua) + ' mL de água.';
    return 'Metas do dia cumpridas. Muito bem!';
  }
  const metrica = (icone, rotulo, conteudo, sub, onclick) => el(onclick ? 'button' : 'div', { type: onclick ? 'button' : null, class: 'metrica', onclick },
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
  const explica = texto => el('p', { class: 'aviso info peq', role: 'status', text: texto });
  // Algo que não entra nas contas do dia (aplicação, peso, exame, chat) vai para a linha do tempo da ficha.
  const naFicha = (icone, titulo, detalhe, pontos) => m.linha.push({ quando: agoraReal(), icone, titulo, detalhe, origem: 'paciente', pontos: pontos || 0 });

  // ---------------------------------------------------------------- registros em folhas: tocar → escolher → "Registrar" → a confirmação
  const atual = () => est.pilha[est.pilha.length - 1] || est.aba;
  const folhaApp = (titulo, conteudo, tela) => { if (tela) DEMO.tela(tela); return DEMO.folha({ titulo, conteudo, dentro: raiz.querySelector('.celular') || undefined, aoFechar: () => DEMO.tela(atual()) }); };
  const marcador = (...ns) => el('div', { class: 'linha-h' }, el('span', { class: 'cresce' }), ns.map(item));
  const REGISTROS = {
    sono: ['Sono', 12, 'basicos', [['Quantas horas você dormiu?', ['Menos de 5h', '5 a 6h', '7 a 8h', 'Mais de 8h']], ['Como dormiu?', ['Mal', 'Mais ou menos', 'Bem']]]],
    atividade: ['Atividade física', 13, 'basicos', [['O que você fez?', ['Caminhada', 'Musculação', 'Bicicleta', 'Outra']], ['Por quanto tempo?', ['15 min', '30 min', '45 min', '1 hora']]]],
    humor: ['Humor', 14, 'bemestar', [['Como você está hoje?', ['Mal', 'Mais ou menos', 'Bem', 'Muito bem']]]],
    fome: ['Fome e saciedade', 15, 'bemestar', [['Antes do almoço', ['Pouca fome', 'Fome normal', 'Muita fome']], ['Depois do almoço', ['Ainda com fome', 'Satisfeita', 'Cheia demais']]]],
    intestino: ['Intestino', 16, 'bemestar', [['Como está hoje?', ['Normal', 'Preso', 'Solto']]], 'Preso por 3 dias seguidos: a equipe recebe um aviso.'],
    outros: ['Outros registros', 17, 'outros', [['Álcool', ['Não bebi', '1 dose', '2 ou mais']], ['Tabaco', ['Não fumei', 'Fumei']], ['Ciclo menstrual', ['Sem sangramento', 'Menstruada']]], 'Só a equipe vê estes registros.']
  };
  function abrirRegistro(chave) {
    const [titulo, n, , grupos, nota] = REGISTROS[chave];
    const gs = grupos.map(([pergunta, ops]) => [pergunta, escolha(ops, pergunta, '')]);
    const erro = el('p', { class: 'erro', role: 'alert' });
    const feito = registroHoje(chave);
    let f;
    const botao = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
      const v = gs.map(([, g]) => g.valor());
      if (v.some(x => !x)) { erro.textContent = 'Escolha uma opção em cada pergunta.'; return; }
      m.registros.push({ chave, titulo, valor: v.join(' · '), quando: agoraReal() });
      f.fechar(() => { confirmar(titulo + ' registrado', 5); desenharTela(atual()); });
    } }, 'Registrar');
    f = folhaApp(titulo, [marcador(n), feito ? el('p', { class: 'feito-hoje' }, ic('check', 'p'), ' Registrado ' + M.quando(feito.quando) + ': ' + feito.valor) : null,
      gs.map(([p, g]) => el('div', { class: 'pilha' }, el('p', { class: 'rot', text: p }), g.no)), nota ? el('p', { class: 'mudo peq', text: nota }) : null, erro, botao], chave);
  }
  const FOLHAS = {
    agua: () => {
      let f;
      const c = M.consumoHoje(m);
      const somar = ml => { m.agua.push({ quando: agoraReal(), ml }); est.sobe = 'agua'; f.fechar(() => { confirmar(inteiro(ml) + ' mL de água registrados', ml / 125); desenharTela(atual()); }); };
      f = folhaApp('Água', [marcador(11), el('p', { class: 'numero grande-num' }, inteiro(c.agua), el('small', { text: ' de ' + inteiro(m.metas.agua) + ' mL' })), barra(c.agua, m.metas.agua, inteiro(c.agua) + ' de ' + inteiro(m.metas.agua) + ' mL'),
        el('div', { class: 'atalhos' }, el('button', { type: 'button', class: 'botao', onclick: () => somar(250) }, ic('gota', 'p'), '1 copo (250 mL)'), el('button', { type: 'button', class: 'botao sec', onclick: () => somar(500) }, ic('gota', 'p'), '1 garrafa (500 mL)')),
        origem('Meta de ' + inteiro(m.metas.agua) + ' mL por dia, definida ' + M.autorMetas(m) + ' ' + M.dia(m.metas.em) + '.')], 'agua');
    },
    remedios: () => {
      const f = folhaApp('Remédios e vitaminas', [], 'remedios');
      const corpo = () => [marcador(18), el('ul', { class: 'lista-hoje' }, m.remedios.map(x => el('li', {},
        el('span', { class: 'cresce' }, el('strong', { text: x.nome }), el('br'), el('span', { class: 'mudo peq', text: x.quando })),
        x.tomou ? el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Tomei ' + M.quando(x.tomou)) : el('button', { type: 'button', class: 'botao sec', onclick: () => {
          x.tomou = agoraReal(); confirmar(x.nome + ' registrado', 2); f.trocar('Remédios e vitaminas', corpo()); desenharTela(atual()); } }, 'Tomei')))),
        el('p', { class: 'mudo peq', text: 'A lista é da equipe. O app só registra o "tomei".' })];
      f.trocar('Remédios e vitaminas', corpo());
    },
    plano: () => folhaApp('Plano alimentar', [el('div', { class: 'linha-h' }, el('p', { class: 'mudo peq cresce', text: 'Montado pela nutricionista ' + M.EQUIPE.nutri + ' em ' + M.ddmm(m.bio[1].quando) + '.' }), item(10)),
      el('ul', { class: 'lista-hoje plano-l' }, [['Café da manhã', 'Ovos mexidos, pão integral e fruta', 'Pode trocar por: iogurte natural com aveia'], ['Almoço', 'Arroz, feijão, frango e salada', 'Pode trocar por: peixe no lugar do frango'],
        ['Lanche', 'Fruta e castanhas', 'Pode trocar por: queijo branco'], ['Jantar', 'Omelete com legumes', 'Pode trocar por: sopa de legumes com frango']].map(([r, c, t]) => el('li', {},
          el('span', { class: 'cresce' }, el('span', { class: 'sobretitulo', text: r }), el('strong', { class: 'bloco-t', text: c }), el('span', { class: 'mudo peq', text: t })))))], 'plano'),
    medidas: () => {
      const peso = el('input', { class: 'entrada', id: 'peso', inputmode: 'decimal', value: fmt(M.pesoAtual(m).kg - 0.2, 1) });
      const erro = el('p', { class: 'erro', role: 'alert' });
      let f;
      f = folhaApp('Peso', [marcador(19), el('label', { class: 'campo', for: 'peso' }, el('span', { text: 'Peso de hoje (kg)' }), peso),
        el('p', { class: 'mudo peq', text: 'Pese-se de manhã, em jejum, sempre na mesma balança. Nos dias de consulta, vale o peso medido na clínica.' }), erro,
        el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
          const v = Number(peso.value.replace(',', '.'));
          if (!(v > 30 && v < 300)) { erro.textContent = 'Confira o peso.'; return; }
          m.pesagens.push({ quando: agoraReal(), kg: +v.toFixed(1), origem: 'paciente' }); est.ponto = null;
          f.fechar(() => { confirmar('Peso registrado', 5); m.linha.push({ quando: agoraReal(), icone: 'balanca', titulo: 'Peso', detalhe: fmt(v, 1) + ' kg', origem: 'paciente', pontos: 5, oculto: true }); desenharTela(atual()); });
        } }, 'Registrar')], 'medidas');
    },
    fotos: () => { const r = el('div'); folhaApp('Fotos de progresso', [marcador(22), el('p', { class: 'mudo peq', text: 'Só você e a equipe veem.' }),
      el('div', { class: 'fotos' }, el('div', { class: 'foto' }, ic('camera', 'g'), 'Antes'), el('div', { class: 'foto' }, ic('camera', 'g'), 'Agora')), r,
      el('button', { type: 'button', class: 'botao grande cheio', onclick: () => trocar(r, explica('No app de verdade, abre a câmera ou a galeria. A foto vai para a sua ficha na clínica.')) }, 'Adicionar foto')], 'fotos'); }
  };
  const abrirFolha = k => REGISTROS[k] ? abrirRegistro(k) : FOLHAS[k] ? FOLHAS[k]() : k === 'refeicao' ? abrirRefeicao() : abrir(k);

  // ---------------------------------------------------------------- telas
  const TELAS = {
    'boas-vindas': () => {
      const ok = el('button', { type: 'button', class: 'botao grande cheio', disabled: true, onclick: () => irAba('inicio') }, 'Começar');
      return [el('div', { class: 'bv pilha' },
        el('div', { class: 'selo grande', 'aria-hidden': 'true', text: DEMO.iniciais(DEMO.dados.clinica) }),
        el('p', { class: 'sobretitulo', text: 'Primeiro acesso · ' + M.ddmm(m.inicio) }),
        el('h1', { text: 'Bem-vinda, ' + PACIENTE + '!' }),
        el('p', {}, 'Você entrou pelo link que a clínica mandou no WhatsApp. Sem senha. ', item(1)),
        cartao('Antes de começar', 4, el('p', { class: 'peq', text: 'Aqui você registra o seu dia para a equipe acompanhar. Algumas respostas vêm de uma inteligência artificial que segue as orientações da equipe. Ela não diagnostica nem receita.' }),
          el('label', { class: 'aceite' }, el('input', { type: 'checkbox', onchange: e => { est.aceite = e.target.checked; ok.disabled = !est.aceite; } }), 'Li e aceito o termo de uso')),
        ok)];
    },
    inicio: () => {
      const agora = new Date(), h = agora.getHours(), saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
      const data = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(agora);
      const c = M.consumoHoje(m), ap = M.aplicacao(m), pe = M.pesoAtual(m), cons = M.proximaConsulta(m), rec = M.recadosDe(1)[0];
      const sono = registroHoje('sono');
      const dias = Array.from({ length: 7 }, (_, i) => M.em(i - 7));
      const mediaProt = Math.round(M.media(m.semana.prot));
      return [
        cabAba(saudacao + ', ' + PACIENTE, data, 2, 6),
        el('section', { class: 'cartao heroi elevado', 'aria-label': 'Metas do dia' },
          el('div', { class: 'cab-cartao' }, el('p', { class: 'sobretitulo cresce', text: 'Metas do dia' }), item(9)),
          el('div', { class: 'heroi-topo' }, aneis(c),
            el('ul', { class: 'legenda-aneis' },
              [['Calorias', inteiro(c.kcal), ' de ' + inteiro(m.metas.kcal) + ' kcal'], ['Proteína', fmt(c.prot), ' de ' + m.metas.prot + ' g'], ['Água', inteiro(c.agua), ' de ' + inteiro(m.metas.agua) + ' mL']].map(([r, v, de], i) =>
                el('li', { class: 'meta', 'data-meta': ['kcal', 'prot', 'agua'][i] }, el('span', { class: 'ponto a' + i, 'aria-hidden': 'true' }), el('span', { class: 'rotulo', text: r }), el('span', { class: 'valor' }, v, el('small', { text: de })))))),
          el('p', { class: 'resumo-dia' }, ic('info'), resumoDia(c)),
          el('div', { class: 'botoes' },
            M.funcaoLigada('refeicoes') ? el('button', { type: 'button', class: 'botao', onclick: () => abrirRefeicao() }, ic('mais'), 'Registrar refeição') : null,
            M.funcaoLigada('basicos') ? el('button', { type: 'button', class: 'botao sec', onclick: () => { m.agua.push({ quando: agoraReal(), ml: 250 }); est.sobe = 'agua'; confirmar('250 mL de água registrados', 2); desenharTela('inicio'); } }, ic('gota'), '+250 mL de água') : null),
          origem('Metas definidas ' + M.autorMetas(m) + ' ' + M.dia(m.metas.em) + '. Conta só o que você registrou hoje.')),
        el('div', { class: 'metricas' },
          M.funcaoLigada('conquistas') ? metrica('medalha', 'Pontos de hoje', el('span', { class: 'numero grande-num' }, String(M.pontos(m)), el('small', { text: ' de 100' })), 'Cada registro soma pontos', () => abrir('conquistas')) : null,
          M.funcaoLigada('basicos') ? metrica('lua', 'Sono', sono ? el('span', { class: 'grande-txt', text: sono.valor.split(' · ')[0] }) : el('span', { class: 'acao-m' }, 'Registrar', ic('seta', 'p')), sono ? sono.valor.split(' · ')[1] + ' · ' + M.quando(sono.quando) : 'Como você dormiu?', () => abrirRegistro('sono')) : null,
          M.funcaoLigada('aplicacoes') ? metrica('seringa', 'Próxima aplicação', el('span', { class: 'grande-txt', text: maiuscula(M.quando(ap.proxima)) }), ap.falta, () => irAba('aplicacoes')) : null,
          metrica('balanca', 'Peso', el('span', { class: 'numero' }, fmt(pe.kg, 1), el('small', { text: 'kg' })), M.sinal(M.variacaoTotal(m), 1) + ' kg desde ' + M.ddmm(m.inicio), () => irAba('evolucao'))),
        el('section', { class: 'cartao' }, el('div', { class: 'cab-cartao' }, el('h2', { text: 'Proteína nos 7 dias anteriores' }), item(35)),
          el('div', { class: 'semana-barras', role: 'img', 'aria-label': 'Proteína por dia: ' + m.semana.prot.map((v, i) => M.DIAS[dias[i].getDay()] + ' ' + v + ' g').join(', ') + '. Meta: ' + m.metas.prot + ' g.' },
            m.semana.prot.map((v, i) => { const col = el('i'); col.style.transform = 'scaleY(' + Math.min(1, v / (m.metas.prot * 1.2)) + ')'; return el('div', { class: 'dia-b' + (v >= m.metas.prot * 0.9 ? ' hoje' : ''), 'aria-hidden': 'true' }, el('span', { class: 'coluna' }, col), el('span', { class: 'letra', text: M.DIAS[dias[i].getDay()].charAt(0).toUpperCase() })); })),
          el('div', { class: 'tendencias' }, el('div', { class: 'bloco' }, el('strong', { text: m.semana.comRegistro + ' de 7 dias' }), el('span', { text: 'com registro' })),
            el('div', { class: 'bloco' }, el('strong', { text: mediaProt + ' g/dia' }), el('span', { text: 'de proteína, em média (meta: ' + m.metas.prot + ' g)' })))),
        cons ? cartao('Próxima consulta', 28, el('p', { class: 'grande-txt', text: maiuscula(M.quando(cons.quando)) }),
          el('p', { class: 'mudo peq', text: cons.tipo + ' com ' + quem(cons.com) + ' · ' + cons.modo + (DEMO.dados.cidade && cons.modo === 'presencial' ? ', em ' + DEMO.dados.cidade : '') + (cons.presenca ? ' · presença confirmada' : '') })) : null,
        rec ? cartao('Recado da clínica', 29, el('p', { text: rec.texto }), el('p', { class: 'mudo peq', text: 'De ' + rec.de + ', ' + M.quando(rec.quando) + '.' })) : null];
    },
    registrar: () => {
      const lad = (icone, titulo, sub, acao, n, feito) => el('button', { type: 'button', class: 'ladrilho linha-app', onclick: acao },
        el('span', { class: 'linha-h' }, caixaIc(icone), el('span', { class: 'cresce' }), n ? el('span', { class: 'item-num', text: 'item ' + n, 'aria-hidden': 'true' }) : null),
        el('span', { class: 't1', text: titulo }), el('span', { class: 't2' + (feito ? ' feito' : ''), text: sub || 'Registrar' }));
      const reg = (k, icone) => { const r = registroHoje(k); return M.funcaoLigada(REGISTROS[k][2]) ? lad(icone, REGISTROS[k][0], r ? r.valor : (k === 'outros' ? 'Álcool, tabaco e ciclo' : null), () => abrirFolha(k), REGISTROS[k][1], !!r) : null; };
      const c = M.consumoHoje(m), tomados = m.remedios.filter(x => x.tomou).length;
      return [cabAba('Registrar', 'O que aconteceu hoje?'),
        el('div', { class: 'ladrilhos' },
          M.funcaoLigada('refeicoes') ? lad('prato', 'Refeição', m.refeicoes.length + (m.refeicoes.length === 1 ? ' registrada hoje' : ' registradas hoje'), () => abrirRefeicao(), 7, m.refeicoes.length > 0) : null,
          M.funcaoLigada('basicos') ? lad('gota', 'Água', inteiro(c.agua) + ' de ' + inteiro(m.metas.agua) + ' mL', () => abrirFolha('agua'), 11, c.agua > 0) : null,
          reg('sono', 'lua'), reg('atividade', 'corrida'), reg('humor', 'sorriso'), reg('fome', 'maca'), reg('intestino', 'onda'),
          lad('pilula', 'Remédios e vitaminas', tomados + ' de ' + m.remedios.length + ' tomados', () => abrirFolha('remedios'), 18, tomados > 0),
          reg('outros', 'notas'), M.funcaoLigada('refeicoes') ? lad('livro', 'Plano alimentar', 'O cardápio da nutricionista', () => abrirFolha('plano'), 10) : null),
        el('p', { class: 'mudo peq', text: 'Cada registro soma pontos e aparece na ficha que a equipe acompanha.' })];
    },

    // ---- aplicações: o que a equipe cadastrou (sem números de dose), a contagem, o rodízio e os sintomas
    aplicacoes: () => {
      const ap = M.aplicacao(m), p = m.prescricao, ren = p.renovacao;
      if (!est.localEscolhido || est.localEscolhido === ap.ultima.local) est.localEscolhido = ap.sugerido;
      const sint = escolha(['Bem', 'Enjoo leve', 'Enjoo forte', 'Dor no local', 'Tontura'], 'Como você se sente', '');
      const travado = (rotulo, texto) => el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: rotulo }), el('span', { class: 'travado' }, ic('cadeado', 'p'), texto));
      const conferida = ren.conferida || p.conferida;
      return [
        cabAba('Aplicações', 'Acompanhadas pela equipe', 23),
        el('section', { class: 'cartao heroi-pic elevado', 'aria-label': 'Próxima aplicação' },
          el('div', { class: 'cab-cartao' }, el('p', { class: 'sobretitulo cresce', text: 'Próxima aplicação' }), item(24)),
          el('p', { class: 'quando-pic', text: maiuscula(M.quando(ap.proxima)) }),
          el('p', { class: 'falta-pic' }, ic('relogio', 'p'), ap.falta),
          el('p', { class: 'mudo peq', text: 'Última: ' + M.quando(ap.ultima.quando) + ', ' + ap.ultima.local.toLowerCase() + (ap.ultima.sintoma === 'Bem' ? ', sem sintomas.' : ', ' + ap.ultima.sintoma.toLowerCase() + '.') + ' Você recebe um lembrete no dia e na hora.' })),
        el('section', { class: 'cartao' }, el('div', { class: 'cab-cartao' }, el('h2', { text: 'Prescrição' }), el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Conferida')),
          el('ul', { class: 'travados' }, travado('Medicamento', 'Medicamento cadastrado pela equipe'), travado('Dose', 'Preenchido pela equipe'), travado('Concentração', 'Preenchido pela equipe'),
            travado('Volume', 'Preenchido pela equipe'), el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: 'Frequência' }), el('strong', { text: '1 vez por semana' }))),
          origem(ren.conferida ? 'Renovação cadastrada por ' + M.medico() + ' e conferida pela ' + M.EQUIPE.enfCargo + ' ' + M.EQUIPE.enf + ' ' + M.quando(ren.conferida) + '.'
            : 'Cadastrada por ' + M.medico() + ' em ' + M.ddmm(p.cadastrada) + ' e conferida pela ' + M.EQUIPE.enfCargo + ' ' + M.EQUIPE.enf + ' em ' + M.ddmm(conferida) + '.'),
          !ren.conferida ? el('p', { class: 'aviso info peq' }, ic('relogio', 'p'), 'A equipe cadastrou uma renovação ' + M.quando(ren.cadastrada) + '. Ela aparece aqui depois que a enfermagem conferir. Até lá, vale a prescrição acima.') : null,
          explica('O app mostra o que a equipe cadastrou. Ele não calcula nem muda dose.')),
        cartao('Onde aplicar', 25, mapaCorpo(ap)),
        cartao('Como se sentiu', [26, 27], sint.no, el('p', { class: 'mudo peq', text: 'A clínica escolhe os sintomas que avisam a enfermagem na hora (aqui, enjoo forte).' }),
          el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
            const s = sint.valor() || 'Bem', local = est.localEscolhido;
            m.aplicacoes.push({ quando: agoraReal(), local, sintoma: s });
            m.proximoLocal = M.LOCAIS[(M.LOCAIS.indexOf(local) + 1) % M.LOCAIS.length]; est.localEscolhido = null;
            if (s === 'Enjoo forte') m.sintoma = { nome: 'Enjoo forte', quando: agoraReal() };
            m.linha.push({ quando: agoraReal(), icone: 'seringa', titulo: 'Aplicação', detalhe: local + ' · ' + (s === 'Bem' ? 'sem sintomas' : s.toLowerCase()), origem: 'paciente', pontos: 5, oculto: true });
            confirmar('Aplicação registrada', 5);
            desenharTela('aplicacoes');
            if (s === 'Enjoo forte') setTimeout(() => DEMO.janela('Aplicação registrada', el('p', { text: 'A enfermagem da clínica recebeu um aviso sobre o enjoo forte e vai entrar em contato.' }), el('p', { class: 'mudo peq', text: 'O aviso também aparece na central, em "Precisa da sua atenção hoje".' })), 700);
          } }, 'Registrar aplicação'),
          el('p', { class: 'mudo peq', text: 'Na demonstração, registra como se a aplicação fosse agora.' }))];
    },
    // ---- evolução: gráfico de linha (área suave, faixa da meta, ponto atual), tocar num ponto mostra o valor
    evolucao: () => {
      const todas = m.pesagens, PER = [['1 mês', 5], ['3 meses', 13], ['Tudo', todas.length]];
      const n = Math.min(todas.length, (PER.find(p => p[0] === est.periodo) || PER[2])[1]);
      const serie = todas.slice(-n);
      const seg = el('div', { class: 'seg largo', role: 'radiogroup', 'aria-label': 'Período' }, PER.map(([r]) => el('button', { type: 'button', role: 'radio', 'aria-checked': String(est.periodo === r), 'aria-pressed': String(est.periodo === r),
        onclick: () => { est.periodo = r; est.ponto = null; desenharTela('evolucao'); } }, r)));
      const [b1, b2] = m.bio;
      return [
        cabAba('Evolução', 'Seu peso, semana a semana', 20),
        el('section', { class: 'cartao elevado evolucao' }, seg, graficoEvolucao(serie),
          el('div', { class: 'tendencias' }, el('div', { class: 'bloco' }, el('strong', { text: M.sinal(M.variacaoTotal(m), 1) + ' kg' }), el('span', { text: 'desde ' + M.ddmm(m.inicio) + ' (' + fmt(Math.abs(M.variacaoTotal(m)) / todas[0].kg * 100) + '% do peso inicial)' })),
            el('div', { class: 'bloco' }, el('strong', { text: M.sinal(M.variacaoSemana(m), 1) + ' kg' }), el('span', { text: 'na última pesagem' }))),
          origem('Faixa da meta: ' + m.faixaPeso[0] + ' a ' + m.faixaPeso[1] + ' kg, definida por ' + M.medico() + ' em ' + M.ddmm(m.faixaEm) + '. Pontos cheios: registrados por você; pontos com borda: medidos na clínica.'),
          el('div', { class: 'atalhos' }, el('button', { type: 'button', class: 'botao', onclick: () => abrirFolha('medidas') }, ic('balanca', 'p'), 'Registrar peso'),
            M.funcaoLigada('fotos') ? el('button', { type: 'button', class: 'botao sec', onclick: () => abrirFolha('fotos') }, ic('camera', 'p'), 'Fotos') : null)),
        cartao('Avaliação na clínica', 21, el('p', { class: 'mudo peq', text: 'Medido na clínica (balança e bioimpedância), separado do que você registra.' }),
          el('table', { class: 'tabela-bio' }, el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: '' }), el('th', { scope: 'col', text: M.ddmm(b1.quando) }), el('th', { scope: 'col', text: M.ddmm(b2.quando) }))),
            el('tbody', {}, [['Peso', 'peso', 'kg'], ['Gordura corporal', 'gordura', '%'], ['Massa muscular', 'musculo', 'kg'], ['Cintura', 'cintura', 'cm']].map(([r, k, u]) =>
              el('tr', {}, el('th', { scope: 'row', text: r }), el('td', { class: 'tab', text: fmt(b1[k], k === 'cintura' ? 0 : 1) + ' ' + u }), el('td', { class: 'tab', text: fmt(b2[k], k === 'cintura' ? 0 : 1) + ' ' + u }))))))];
    },

    // ---- perfil (o antigo "Mais")
    mais: () => {
      const cons = M.proximaConsulta(m), recs = M.recadosDe(1);
      return [
        el('header', { class: 'cab-app' }, el('div', { class: 'cresce' }, el('p', { class: 'sobretitulo', text: 'Perfil e mais' }), el('h1', { text: 'Você' }))),
        el('section', { class: 'cartao perfil-cab' }, el('div', { class: 'linha-h' }, el('span', { class: 'avatar grande', 'aria-hidden': 'true', text: DEMO.iniciais(m.nome) }),
            el('div', { class: 'cresce' }, el('h2', { text: m.nome }), el('p', { class: 'mudo peq', text: 'Com ' + M.medico() + ' desde ' + M.dataLonga(m.inicio) })), item(5)),
          el('div', { class: 'blocos-2' }, [['Altura', fmt(m.altura * 100, 0), 'cm'], ['Peso inicial', fmt(m.pesagens[0].kg, 1), 'kg']].map(([r, v, u]) => el('div', { class: 'bloco' }, el('span', { class: 'rot', text: r }), el('span', { class: 'numero med' }, v, el('small', { text: u }))))),
          el('p', { class: 'peq' }, el('strong', { text: 'Objetivo: ' }), m.objetivo.toLowerCase() + '.'),
          el('p', { class: 'peq' }, el('strong', { text: 'Fase: ' }), m.fase.toLowerCase() + ' (definida por ' + M.medico() + ' em ' + M.ddmm(m.faseEm) + ').')),
        grupoLista('Com a clínica', [['calendario', 'Minhas consultas', cons ? maiuscula(M.quando(cons.quando)) : null, 'consultas', 28], ['megafone', 'Avisos da clínica', recs.length + (recs.length === 1 ? ' aviso' : ' avisos'), 'avisos', 29],
          M.funcaoLigada('chat') ? ['conversa', 'Chat com a equipe', null, 'chat-equipe', 34] : null, ['pessoas', 'Equipe e contatos', null, 'equipe', 33], ['livro', 'Conteúdo da clínica', null, 'conteudo', 31], ['clipe', 'Enviar exames', null, 'exames', 32]]),
        grupoLista('Para você', [['sino', 'Lembretes', null, 'lembretes', 30], M.funcaoLigada('conquistas') ? ['medalha', 'Conquistas', M.pontos(m) + ' pontos hoje', 'conquistas', 35] : null, M.funcaoLigada('assistente') ? ['pergunta', 'Assistente de dúvidas', null, 'assistente', 36] : null]),
        grupoLista('Sua conta', [['texto', 'Leitura confortável', 'Tema escuro e letra grande', 'leitura', 38], ['cadeado', 'Meus dados', null, 'meus-dados', 37]]),
        cartao('Ícone na tela do celular', 3, el('p', { class: 'peq', text: 'No navegador, toque em Compartilhar e depois em "Adicionar à Tela de Início". O app vira um ícone com a marca da clínica.' }))];
    },
    perfil: () => [cartao('Perfil e objetivo', 5, dados([['Altura', String(m.altura).replace('.', ',') + ' m'], ['Peso inicial', fmt(m.pesagens[0].kg, 1) + ' kg (medido na clínica em ' + M.ddmm(m.inicio) + ')'], ['Objetivo', m.objetivo], ['Fase', m.fase + ' (definida por ' + M.medico() + ')']]))],
    consultas: () => [cartao('Minhas consultas', 28, el('ul', { class: 'lista-simples' }, m.consultas.filter(c => c.quando > new Date()).map(c => el('li', {},
      el('span', { class: 'cresce' }, el('strong', { text: maiuscula(M.quando(c.quando)) }), el('br'), el('span', { class: 'mudo peq', text: c.tipo + ' com ' + quem(c.com) + ' · ' + c.modo })),
      c.presenca ? el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Presença confirmada') : el('button', { type: 'button', class: 'botao sec', onclick: () => {
        c.presenca = true; m.linha.push({ quando: agoraReal(), icone: 'calendario', titulo: 'Presença confirmada', detalhe: c.tipo + ' de ' + M.quando(c.quando), origem: 'paciente' });
        DEMO.rapida('Presença confirmada. A recepção vê na central.'); desenharTela('consultas'); } }, 'Confirmar presença')))),
      origem('Os horários são da agenda da clínica. Para remarcar, fale com a recepção.'))],
    avisos: () => [cartao('Avisos da clínica', 29, el('ul', { class: 'lista-simples' }, M.recadosDe(1).map(r => el('li', {},
      el('span', { class: 'cresce' }, el('span', { text: r.texto }), el('br'), el('span', { class: 'mudo peq', text: 'De ' + r.de + ', ' + M.quando(r.quando) })),
      r.lido ? el('span', { class: 'etq', text: 'Lido' }) : el('button', { type: 'button', class: 'botao sec', onclick: () => { r.lido = true; desenharTela('avisos'); } }, 'Marcar como lido')))))],
    lembretes: () => { const ap = M.aplicacao(m), cons = M.proximaConsulta(m);
      return [cartao('Lembretes', 30, el('ul', { class: 'lista-simples' }, [['Refeições', '8h, 12h, 16h e 20h'], ['Água', 'A cada 2 horas, das 8h às 20h'], ['Remédios', '12h e 20h'],
        ['Aplicação', M.DIAS[ap.proxima.getDay()] + ', às 8h'], ['Consulta', cons ? 'Na véspera (' + M.quando(new Date(cons.quando.getTime() - 864e5), true) + ')' : 'Na véspera']].map(([a, b]) =>
        el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: a }), el('br'), el('span', { class: 'mudo peq', text: b })),
          el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': 'true', 'aria-label': 'Lembrete de ' + a.toLowerCase(), onclick: e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(on)); DEMO.rapida('Lembrete de ' + a.toLowerCase() + (on ? ' ligado.' : ' desligado.')); } })))))]; },
    conteudo: () => { const r = el('div'); return [cartao('Conteúdo da clínica', 31, el('ul', { class: 'lista-app' }, M.CONTEUDO.map(([i, tipo, t, d]) =>
      el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => trocar(r, cartao(t, null, el('p', { class: 'mudo peq', text: tipo + ' da equipe' }), el('p', { text: d }))) },
        caixaIc(i), el('span', { class: 'cresce' }, el('span', { class: 't1', text: t }), el('span', { class: 't2', text: tipo })), ic('seta', 'p')))))), r]; },
    exames: () => { const r = el('div'); return [cartao('Enviar exames', 32, el('p', { class: 'mudo peq', text: 'Foto ou PDF do exame vai direto para a sua ficha.' }), r,
      el('button', { type: 'button', class: 'botao', onclick: () => { naFicha('clipe', 'Exame enviado', 'Arquivo de exemplo (exames de sangue)'); trocar(r, explica('Exame de exemplo enviado. No app de verdade, abre os arquivos do celular; a equipe vê o exame na sua ficha.')); } }, ic('clipe', 'p'), 'Escolher arquivo'))]; },
    equipe: () => [cartao('Equipe e contatos', 33, el('ul', { class: 'lista-simples' }, [[M.medico(), DEMO.dados.especialidade || 'Médico'], [M.EQUIPE.nutri, 'Nutricionista · plano alimentar e metas'], [M.EQUIPE.enf, 'Enfermeira · aplicações e sintomas'], [M.EQUIPE.recepcao, 'Consultas e horários']].map(([n, f]) =>
      el('li', {}, el('span', { class: 'cresce' }, el('strong', { text: n }), el('br'), el('span', { class: 'mudo peq', text: f })), M.funcaoLigada('chat') ? el('button', { type: 'button', class: 'botao sec', 'aria-label': 'Escrever para ' + n, onclick: () => abrir('chat-equipe') }, 'Escrever') : null))))],
    'chat-equipe': () => chat('equipe', 34, 'Chat com a equipe', 'Escreva para a equipe da clínica.'),
    assistente: () => chat('ia', 36, 'Assistente de dúvidas', 'Pergunte sobre as orientações da sua equipe.'),
    conquistas: () => [cartao('Conquistas', 35, el('ul', { class: 'lista-simples' }, [['fogo', m.semana.comRegistro + ' de 7 dias com registro'], ['gota', 'Meta de água em ' + m.semana.agua.filter(v => v >= m.metas.agua).length + ' dos 7 dias anteriores'], ['medalha', 'Todas as aplicações registradas desde ' + M.ddmm(m.inicio)]].map(([i, t]) =>
      el('li', {}, caixaIc(i, 'peq'), el('span', { class: 'cresce', text: t })))), origem('Pontos de hoje: ' + M.pontos(m) + ' de 100. Refeição vale 5, cada copo de água 2, cada outro registro 5, cada remédio 2.'))],
    'meus-dados': () => { const r = el('div'); return [cartao('Meus dados', 37, el('p', { class: 'peq', text: 'Baixe o que você registrou ou peça a exclusão dos seus dados (LGPD).' }), r,
      el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao', onclick: () => trocar(r, explica('No app de verdade, você recebe um arquivo com tudo o que registrou.')) }, 'Baixar meus dados'),
        el('button', { type: 'button', class: 'botao sec', onclick: () => trocar(r, explica('No app de verdade, o pedido vai para a clínica, que confirma e apaga os dados.')) }, 'Pedir a exclusão')))]; },
    leitura: () => {
      const chave = (rotulo, ligado, fn) => el('li', {}, el('span', { class: 'cresce', text: rotulo }), el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': String(ligado), 'aria-label': rotulo,
        onclick: () => { fn(); setTimeout(() => desenharTela('leitura'), 30); } }));
      return [cartao('Leitura confortável', 38, el('ul', { class: 'lista-simples' },
        chave('Tema escuro', DEMO.escuro(), () => DEMO.trocarTema()),
        chave('Letra grande', document.documentElement.dataset.letra === 'grande', () => { const h = document.documentElement; h.dataset.letra = h.dataset.letra === 'grande' ? '' : 'grande'; })),
        el('p', { class: 'mudo peq', text: 'O tema escuro também segue o celular, sozinho.' }))];
    }
  };
  TELAS.picadinha = TELAS.aplicacoes;   // links antigos (…&tela=picadinha)
  const NOMES = { plano: 'Plano alimentar', perfil: 'Perfil', consultas: 'Consultas', avisos: 'Avisos', lembretes: 'Lembretes', conteudo: 'Conteúdo', exames: 'Exames', equipe: 'Equipe',
    'chat-equipe': 'Chat com a equipe', assistente: 'Assistente', conquistas: 'Conquistas', 'meus-dados': 'Meus dados', leitura: 'Leitura' };

  // ---------------------------------------------------------------- folha de refeição: buscar, foto e código de barras
  // Tocar → escolher → "Registrar no …" → a confirmação → o anel sobe na tela Hoje (e a refeição entra na ficha da central).
  const sem = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const REFEICOES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'];
  function abrirRefeicao(vista) {
    const f = DEMO.folha({ titulo: 'Registrar refeição', dentro: raiz.querySelector('.celular') || undefined, foco: vista === 'foto' || vista === 'codigo' ? '.corpo-folha .botao' : '#busca-alimento',
      aoFechar: () => DEMO.tela(atual()) });
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
        m.refeicoes.length ? el('section', { class: 'pilha' }, el('p', { class: 'sobretitulo', text: 'Hoje' }), el('ul', { class: 'lista-hoje' }, m.refeicoes.map(c => el('li', {},
          el('span', { class: 'cresce' }, el('strong', { text: c.refeicao }), el('span', { class: 'peq mudo', text: ' · ' + M.hora(c.quando) }), el('br'), el('span', { class: 'peq mudo', text: c.nome })),
          el('span', { class: 'peq tab', text: inteiro(c.kcal) + ' kcal' }))))) : null];
    }
    function vistaAlimento() {
      DEMO.tela('alimento');
      const a = est.alimento || ALIMENTOS[0];
      const kcal = el('span', { class: 'numero' }), out = el('output', { 'aria-live': 'polite' });
      const MAC = [['prot', 'Proteínas', 40, ''], ['carb', 'Carboidratos', 60, ' carb'], ['gord', 'Gorduras', 30, ' gord']];
      const linhas = MAC.map(([k, n, ref, cls]) => { const v = el('span', { class: 'val-m' }), b = el('div', { class: 'barra', 'aria-hidden': 'true' }, el('i')); return [k, ref, v, b, el('div', { class: 'macro' + cls }, el('span', { class: 'nome-m', text: n }), v, b)]; });
      const botao = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => registrarComida([{ ...a, kcal: a.kcal * est.porcao, prot: a.prot * est.porcao }], f) });
      const atualizar = () => {
        trocar(kcal, inteiro(a.kcal * est.porcao), el('small', { text: 'kcal' }));
        trocar(out, (est.porcao === 0.5 ? 'Meia porção' : fmt(est.porcao) + (est.porcao === 1 ? ' porção' : ' porções')));
        for (const [k, ref, v, b] of linhas) { v.textContent = fmt(a[k] * est.porcao) + ' g'; b.firstChild.style.transform = 'scaleX(' + Math.min(1, a[k] * est.porcao / ref) + ')'; }
        menos.disabled = est.porcao <= 0.5; mais.disabled = est.porcao >= 4;
        botao.textContent = 'Registrar no ' + est.refeicao.toLowerCase();
      };
      const passo = d => { est.porcao = Math.min(4, Math.max(0.5, est.porcao + d)); atualizar(); };
      const menos = el('button', { type: 'button', 'aria-label': 'Menos meia porção', onclick: () => passo(-0.5) }, svgMenos());
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
    const quando = agoraReal();
    for (const c of lista) m.refeicoes.push({ quando, refeicao: est.refeicao, nome: c.nome, kcal: Math.round(c.kcal), prot: +c.prot.toFixed(1) });
    est.busca = ''; est.foto = null; est.sobe = M.consumoHoje(m).prot < m.metas.prot ? 'prot' : 'kcal';
    f.fechar(() => { confirmar(lista.length > 1 ? lista.length + ' alimentos registrados' : 'Registrado no ' + est.refeicao.toLowerCase(), 5 * lista.length); irAba('inicio'); });
  }
  // Mapa do corpo (frente), como a pessoa vê o próprio corpo: o lado direito dela fica à esquerda da imagem.
  // A última aplicação aparece cheia e cinza; a sugerida, na cor da clínica, com um halo.
  function mapaCorpo(ap) {
    const ultimo = ap.ultima.local;
    const s = svg('svg', { viewBox: '0 0 200 316', class: 'corpo', role: 'img', 'aria-label': 'Mapa do corpo, de frente. Última aplicação: ' + ultimo.toLowerCase() + '. Escolhido: ' + est.localEscolhido.toLowerCase() + '.' });
    const membro = d => [svg('path', { d, class: 'membro-borda' }), svg('path', { d, class: 'membro' })];
    s.append(...membro('M66 86 Q52 96 48 124 L40 182'), ...membro('M134 86 Q148 96 152 124 L160 182'), ...membro('M88 196 L84 300'), ...membro('M112 196 L116 300'));
    s.append(svg('path', { d: 'M100 70 C82 70 66 76 62 92 L60 150 Q60 186 76 200 L124 200 Q140 186 140 150 L138 92 C134 76 118 70 100 70Z', class: 'silhueta' }),
      svg('rect', { x: 92, y: 56, width: 16, height: 18, rx: 6, class: 'silhueta' }), svg('ellipse', { cx: 100, cy: 36, rx: 20, ry: 24, class: 'silhueta' }));
    const PONTOS = { 'Braço direito': [51, 132], 'Braço esquerdo': [149, 132], 'Abdômen direito': [86, 150], 'Abdômen esquerdo': [114, 150], 'Coxa direita': [86, 236], 'Coxa esquerda': [114, 236] };
    for (const [nome, [x, y]] of Object.entries(PONTOS)) {
      const cls = nome === est.localEscolhido ? 'local sugerido' : nome === ultimo ? 'local ultimo' : 'local';
      if (nome === est.localEscolhido) s.append(svg('circle', { cx: x, cy: y, r: 16, class: 'halo-local' }));
      s.append(svg('circle', { cx: x, cy: y, r: 8, class: cls }));
    }
    const legenda = el('div', { class: 'legenda' }, el('span', { class: 'leg sugerido' }, 'Desta vez: ' + est.localEscolhido.toLowerCase()), el('span', { class: 'leg ultimo' }, 'Última: ' + ultimo.toLowerCase()));
    const escolher = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Onde vai aplicar' }, M.LOCAIS.map(n => el('button', { type: 'button', class: 'chip', role: 'radio',
      'aria-checked': String(n === est.localEscolhido), 'aria-pressed': String(n === est.localEscolhido), disabled: n === ultimo,
      onclick: () => { est.localEscolhido = n; desenharTela('aplicacoes'); } }, n === est.localEscolhido ? ic('check', 'p') : null, n)));
    return el('div', { class: 'mapa' }, el('p', { class: 'mudo peq', text: 'Última: ' + ultimo.toLowerCase() + '. Sugerido pelo rodízio: ' + ap.sugerido.toLowerCase() + '.' }), s, legenda, el('p', { class: 'rot', text: 'Onde vai aplicar desta vez?' }), escolher);
  }
  // Gráfico da evolução: área suave, a faixa da meta, o ponto escolhido em destaque. Tocar (ou o controle deslizante) mostra o valor.
  function graficoEvolucao(v) {
    const W = 340, H = 190, B = 26, [metaMin, metaMax] = m.faixaPeso;
    const min = Math.min(metaMin, ...v.map(p => p.kg)) - 0.6, max = Math.max(...v.map(p => p.kg)) + 0.6;
    const x = i => v.length === 1 ? W / 2 : 14 + i * (W - 28) / (v.length - 1), y = val => 12 + (max - val) / (max - min) * (H - B - 12);
    const sel = est.ponto == null || est.ponto >= v.length ? v.length - 1 : est.ponto;
    const rotulo = i => maiuscula(M.quando(v[i].quando, true));
    const leitura = el('div', { class: 'leitura-graf', 'aria-live': 'polite' });
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Peso de ' + fmt(v[0].kg, 1) + ' para ' + fmt(v[v.length - 1].kg, 1) + ' kg. Faixa da meta: ' + metaMin + ' a ' + metaMax + ' kg.' });
    const desenhar = i => {
      trocar(leitura, el('span', { class: 'numero' }, fmt(v[i].kg, 1), el('small', { text: 'kg' })),
        el('span', { class: 'mudo peq', text: (v[i].origem === 'clinica' ? 'medido na clínica, ' : 'registrado por você, ') + M.quando(v[i].quando) }));
      s.replaceChildren();
      const pts = v.map((p, k) => [x(k), y(p.kg)]);
      s.append(svg('path', { d: 'M' + pts.map(p => p.join(' ')).join(' L') + ' L' + x(v.length - 1) + ' ' + (H - B) + ' L' + x(0) + ' ' + (H - B) + 'Z', class: 'area' }));
      s.append(svg('rect', { x: 0, y: y(metaMax), width: W, height: y(metaMin) - y(metaMax), class: 'faixa-meta', rx: 6 }));
      const t = svg('text', { x: 6, y: y(metaMax) - 5, class: 'eixo' }); t.textContent = 'faixa da meta'; s.append(t);
      s.append(svg('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'traco' }));
      v.forEach((p, k) => { if (p.origem === 'clinica') s.append(svg('circle', { cx: pts[k][0], cy: pts[k][1], r: 4, class: 'ponto-clinica' })); });
      s.append(svg('line', { x1: pts[i][0], x2: pts[i][0], y1: 8, y2: H - B, class: 'guia' }));
      s.append(svg('circle', { cx: pts[i][0], cy: pts[i][1], r: 10, class: 'halo' }), svg('circle', { cx: pts[i][0], cy: pts[i][1], r: 5, class: 'atual' }));
      [0, v.length - 1].forEach(k => { const e = svg('text', { x: x(k), y: H - 6, class: 'eixo', 'text-anchor': k ? 'end' : 'start' }); e.textContent = M.ddmm(v[k].quando); s.append(e); });
      faixa.value = String(i); faixa.setAttribute('aria-valuetext', rotulo(i) + ': ' + fmt(v[i].kg, 1) + ' kg');
    };
    const faixa = el('input', { type: 'range', class: 'faixa-pontos', min: '0', max: String(v.length - 1), step: '1', value: String(sel), 'aria-label': 'Escolher a pesagem no gráfico' });
    faixa.addEventListener('input', () => { est.ponto = Number(faixa.value); desenhar(est.ponto); });
    s.addEventListener('pointerdown', e => { const r = s.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W; let k0 = 0; v.forEach((_, k) => { if (Math.abs(x(k) - px) < Math.abs(x(k0) - px)) k0 = k; }); est.ponto = k0; desenhar(k0); });
    desenhar(sel);
    return el('div', { class: 'graf-evolucao' }, leitura, s, faixa);
  }
  // Chats de exemplo: nenhuma IA de verdade; a resposta é pronta. A pergunta vai para o registro da demonstração.
  const conversas = { ia: [], equipe: [] };
  function chat(qual, n, titulo, ajuda) {
    const inicio = qual === 'ia' ? 'Oi, ' + PACIENTE + '! Respondo com base nas orientações da sua equipe. Não faço diagnóstico nem receito.' : 'Enfermeira ' + M.EQUIPE.enf.split(' ')[0] + ': “Oi, ' + PACIENTE + '! Pode escrever aqui suas dúvidas sobre a aplicação.”';
    const lista = el('div', { class: 'conversa', 'aria-live': 'polite' }, bolha('outro', inicio), conversas[qual].map(([q, t]) => bolha(q, t)));
    const campo = el('input', { class: 'entrada', id: 'msg-' + qual, maxlength: '300', autocomplete: 'off', placeholder: 'Escreva sua mensagem', 'aria-label': 'Mensagem' });
    const enviar = e => {
      e.preventDefault(); const t = campo.value.trim(); if (!t) return;
      conversas[qual].push(['eu', t]); lista.append(bolha('eu', t)); campo.value = '';
      DEMO.evento('pergunta', { chat: qual, texto: t.slice(0, 300) });
      if (qual === 'equipe') naFicha('conversa', 'Mensagem no chat', 'Para a equipe');
      const resp = qual === 'ia'
        ? 'Pela orientação da sua equipe: mantenha os registros do dia e leve essa dúvida ao retorno. Se algo mudou no tratamento ou você sentiu algo diferente, fale com a equipe no chat.'
        : 'Enfermeira ' + M.EQUIPE.enf.split(' ')[0] + ': “Recebi, ' + PACIENTE + '. Vejo com a equipe e te respondo hoje.”';
      setTimeout(() => { conversas[qual].push(['outro', resp]); lista.append(bolha('outro', resp)); }, 700);
    };
    return [cartao(titulo, n, el('p', { class: 'mudo peq', text: ajuda }), lista,
      el('p', { class: 'mudo peq', text: qual === 'ia' ? 'Na demonstração, as respostas são exemplos prontos. Não escreva dados de pacientes.' : 'A resposta da equipe chega igual, entre aspas, sem alteração. Na demonstração, ela é um exemplo pronto.' }),
      el('form', { class: 'enviar-msg', onsubmit: enviar }, campo, el('button', { class: 'botao', type: 'submit', 'aria-label': 'Enviar mensagem' }, ic('enviar', 'p'), 'Enviar')))];
  }
  const bolha = (quem, texto) => el('div', { class: 'bolha ' + quem, text: texto });

  // ---------------------------------------------------------------- navegação (dentro da página; o # guarda o código)
  // Barra de cima do app (a marca da clínica e o perfil) e 4 abas na barra de vidro embaixo.
  const abas = () => [['inicio', 'Hoje', 'hoje'], ['registrar', 'Registrar', 'registrar'], M.funcaoLigada('aplicacoes') ? ['aplicacoes', 'Aplicações', 'seringa'] : null, ['evolucao', 'Evolução', 'grafico']].filter(Boolean);
  function irAba(aba) { est.aba = aba === 'picadinha' ? 'aplicacoes' : aba; est.pilha = []; desenhar(est.aba); }
  function abrir(tela) { est.pilha.push(tela); desenhar(tela); }
  function voltar() { est.pilha.pop(); desenhar(est.pilha[est.pilha.length - 1] || est.aba); }
  function desenharTela(tela) { desenhar(tela, true); }
  // Troca de tela com transição; a primeira tela e as atualizações da mesma tela, direto.
  function desenhar(tela, mesma) {
    if (mesma || !raiz.querySelector('.celular')) montarTela(tela, mesma); else DEMO.transicao(() => montarTela(tela, mesma));
  }
  function montarTela(tela, mesma) {
    const rolagemAntes = raiz.querySelector('.rolagem');
    const topoAntes = mesma ? (rolagemAntes ? rolagemAntes.scrollTop : 0) : 0;
    const corpo = TELAS[tela] ? TELAS[tela]() : TELAS.inicio();
    const sub = est.pilha.length > 0;
    const barraApp = tela === 'boas-vindas' ? null : el('div', { class: 'barra-app' }, el('span', { class: 'selo peq-selo', 'aria-hidden': 'true', text: DEMO.iniciais(DEMO.dados.clinica) }),
      el('span', { class: 'cresce nome-app', text: DEMO.dados.clinica }),
      el('button', { type: 'button', class: 'botao-perfil', 'aria-label': 'Abrir o perfil e mais opções', 'aria-current': est.aba === 'mais' && !sub ? 'page' : null, onclick: () => irAba('mais') }, DEMO.iniciais(m.nome)));
    const telaApp = el('main', { class: 'tela-app', id: 'conteudo', tabindex: '-1' },
      sub ? el('div', { class: 'cab-sub' }, el('button', { type: 'button', class: 'botao sec quadrado pilula', 'aria-label': 'Voltar', onclick: voltar }, ic('voltar')), el('strong', { class: 'cresce', text: NOMES[tela] || '' })) : null, corpo);
    const nav = tela === 'boas-vindas' ? null : el('nav', { class: 'abas-app vidro', 'aria-label': 'Partes do app' }, abas().map(([k, n, i]) => {
      const ativa = est.aba === k;
      return el('button', { type: 'button', 'aria-current': ativa ? 'page' : null, onclick: () => irAba(k) }, ic(i, null, ativa), n);
    }));
    const rolagem = el('div', { class: 'rolagem' }, barraApp, telaApp);
    trocar(raiz, el('div', { class: 'palco' }, el('div', { class: 'celular' }, rolagem, nav)));
    DEMO.tela(tela === 'picadinha' ? 'aplicacoes' : tela);
    if (!mesma) window.scrollTo(0, 0);
    rolagem.scrollTop = topoAntes;
  }

  // Montado pela página do produto (comum/produto.js). pedida: a tela do link (…&tela=…), só na primeira vez.
  window.DEMO_APP = {
    montar(onde, pedida) {
      raiz = onde;
      if (pedida == null) { desenhar(est.pilha.length ? est.pilha[est.pilha.length - 1] : est.aba === 'inicio' && !est.aceite && !est.visto ? 'boas-vindas' : est.aba, true); est.visto = true; return; }
      est.visto = true;
      const FOLHA = { refeicao: 'busca', buscar: 'busca', alimento: 'busca', foto: 'foto', codigo: 'codigo' };
      if (FOLHA[pedida]) { irAba('inicio'); abrirRefeicao(FOLHA[pedida]); }
      else if (REGISTROS[pedida] || FOLHAS[pedida]) { irAba(['medidas', 'fotos'].includes(pedida) ? 'evolucao' : 'registrar'); abrirFolha(pedida); }
      else if (pedida && TELAS[pedida] && pedida !== 'boas-vindas') {
        if (['inicio', 'registrar', 'aplicacoes', 'picadinha', 'evolucao', 'mais'].includes(pedida)) irAba(pedida);
        else { est.aba = 'mais'; abrir(pedida); }
      } else montarTela('boas-vindas');
    }
  };
})();
