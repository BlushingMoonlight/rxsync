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
    pesos: [78.4, 78.1, 77.9, 77.8, 77.5, 77.4, 77.1, 77.0, 76.8, 76.6, 76.5, 76.2, 76.0, 75.9, 75.6, 75.4], periodo: '3 meses', ponto: null, local: 'Abdômen direito', localEscolhido: 'Abdômen esquerdo', proxima: 'Sexta, às 8h', aplicada: false,
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

  // ---------------------------------------------------------------- peças
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'linha-h cab-cartao' }, el('h2', { class: 'cresce', text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const caixaIc = (n, extra) => el('span', { class: 'caixa-ic' + (extra ? ' ' + extra : ''), 'aria-hidden': 'true' }, ic(n));
  const linhaIr = (icone, titulo, sub, tela, n) => el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => abrir(tela) },
    caixaIc(icone), el('span', { class: 'cresce' }, el('span', { class: 't1', text: titulo }), sub ? el('span', { class: 't2', text: sub }) : null),
    n ? el('span', { class: 'item-num', text: 'item ' + n, 'aria-hidden': 'true' }) : null, ic('seta', 'p')));
  const grupoLista = (titulo, linhas) => el('section', { class: 'pilha grupo-lista' }, el('p', { class: 'sobretitulo', text: titulo }),
    el('ul', { class: 'lista-app' }, linhas.map(([i, t, sub, tela, n]) => linhaIr(i, t, sub, tela, n))));
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
  // ---------------------------------------------------------------- registros em folhas: tocar → escolher → "Registrar" → a confirmação
  const atual = () => est.pilha[est.pilha.length - 1] || est.aba;
  const folhaApp = (titulo, conteudo, tela) => { if (tela) DEMO.tela(tela); return DEMO.folha({ titulo, conteudo, dentro: document.querySelector('.celular') || undefined, aoFechar: () => DEMO.tela(atual()) }); };
  const marcador = (...ns) => el('div', { class: 'linha-h' }, el('span', { class: 'cresce' }), ns.map(item));
  const REGISTROS = {
    sono: ['Sono', 12, [['Quantas horas você dormiu?', ['Menos de 5h', '5 a 6h', '7 a 8h', 'Mais de 8h']], ['Como dormiu?', ['Mal', 'Mais ou menos', 'Bem']]]],
    atividade: ['Atividade física', 13, [['O que você fez?', ['Caminhada', 'Musculação', 'Bicicleta', 'Outra']], ['Por quanto tempo?', ['15 min', '30 min', '45 min', '1 hora']]]],
    humor: ['Humor', 14, [['Como você está hoje?', ['Mal', 'Mais ou menos', 'Bem', 'Muito bem']]]],
    fome: ['Fome e saciedade', 15, [['Antes do almoço', ['Pouca fome', 'Fome normal', 'Muita fome']], ['Depois do almoço', ['Ainda com fome', 'Satisfeita', 'Cheia demais']]]],
    intestino: ['Intestino', 16, [['Como está hoje?', ['Normal', 'Preso', 'Solto']]], 'Preso por 3 dias seguidos: a equipe recebe um aviso.'],
    outros: ['Outros registros', 17, [['Álcool', ['Não bebi', '1 dose', '2 ou mais']], ['Tabaco', ['Não fumei', 'Fumei']], ['Ciclo menstrual', ['Sem sangramento', 'Menstruada']]], 'Só a equipe vê estes registros.']
  };
  function abrirRegistro(chave) {
    const [titulo, n, grupos, nota] = REGISTROS[chave];
    const gs = grupos.map(([pergunta, ops]) => [pergunta, escolha(ops, pergunta, '')]);
    const erro = el('p', { class: 'erro', role: 'alert' });
    let f;
    const botao = el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
      const v = gs.map(([, g]) => g.valor());
      if (v.some(x => !x)) { erro.textContent = 'Escolha uma opção em cada pergunta.'; return; }
      est.feitos[chave] = v.join(' · ');
      f.fechar(() => { ganhar(5, titulo + ' registrado'); desenharTela(atual()); });
    } }, 'Registrar');
    f = folhaApp(titulo, [marcador(n), feito(chave), gs.map(([p, g]) => el('div', { class: 'pilha' }, el('p', { class: 'rot', text: p }), g.no)), nota ? el('p', { class: 'mudo peq', text: nota }) : null, erro, botao], chave);
  }
  const FOLHAS = {
    agua: () => {
      let f;
      const somar = n => { est.agua = Math.min(12, est.agua + n); est.sobe = 'agua'; f.fechar(() => { ganhar(2, n === 1 ? 'Copo registrado' : 'Garrafa registrada'); desenharTela(atual()); }); };
      f = folhaApp('Água', [marcador(11), el('p', { class: 'numero grande-num' }, String(est.agua), el('small', { text: ' de ' + META.agua + ' copos' })), barra(est.agua, META.agua, est.agua + ' de ' + META.agua + ' copos'),
        el('div', { class: 'atalhos' }, el('button', { type: 'button', class: 'botao', onclick: () => somar(1) }, ic('gota', 'p'), '1 copo'), el('button', { type: 'button', class: 'botao sec', onclick: () => somar(2) }, ic('gota', 'p'), '1 garrafa (2 copos)')),
        est.agua >= META.agua ? el('p', { class: 'feito-hoje' }, ic('check', 'p'), ' Meta de água do dia cumprida.') : el('p', { class: 'mudo peq', text: 'Meta da equipe: ' + META.agua + ' copos por dia.' })], 'agua');
    },
    remedios: () => {
      const f = folhaApp('Remédios e vitaminas', [], 'remedios');
      const corpo = () => [marcador(18), el('ul', { class: 'lista-hoje' }, [['vitd', 'Vitamina D', '1 cápsula no almoço'], ['omega', 'Ômega 3', '1 cápsula no jantar']].map(([k, n, q]) => el('li', {},
        el('span', { class: 'cresce' }, el('strong', { text: n }), el('br'), el('span', { class: 'mudo peq', text: q })),
        est.tomou[k] ? el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Tomei às ' + est.tomou[k]) : el('button', { type: 'button', class: 'botao sec', onclick: () => {
          const d = new Date(); est.tomou[k] = d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0'); est.pontos = Math.min(100, est.pontos + 2); DEMO.confirmar(n + ' registrado', '+2 pontos'); f.trocar('Remédios e vitaminas', corpo()); desenharTela(atual()); } }, 'Tomei')))),
        el('p', { class: 'mudo peq', text: 'A lista é da equipe. O app só registra o "tomei".' })];
      f.trocar('Remédios e vitaminas', corpo());
    },
    plano: () => folhaApp('Plano alimentar', [el('div', { class: 'linha-h' }, el('p', { class: 'mudo peq cresce', text: 'Montado pela equipe da clínica.' }), item(10)),
      el('ul', { class: 'lista-hoje plano-l' }, [['Café da manhã', 'Ovos mexidos, pão integral e fruta', 'Pode trocar por: iogurte natural com aveia'], ['Almoço', 'Arroz, feijão, frango e salada', 'Pode trocar por: peixe no lugar do frango'],
        ['Lanche', 'Fruta e castanhas', 'Pode trocar por: queijo branco'], ['Jantar', 'Omelete com legumes', 'Pode trocar por: sopa de legumes com frango']].map(([r, c, t]) => el('li', {},
          el('span', { class: 'cresce' }, el('span', { class: 'sobretitulo', text: r }), el('strong', { class: 'bloco-t', text: c }), el('span', { class: 'mudo peq', text: t })))))], 'plano'),
    medidas: () => {
      const peso = el('input', { class: 'entrada', id: 'peso', inputmode: 'decimal', value: fmt(est.pesos[est.pesos.length - 1] - 0.3) });
      const erro = el('p', { class: 'erro', role: 'alert' });
      let f;
      f = folhaApp('Peso e medidas', [marcador(19), el('label', { class: 'campo', for: 'peso' }, el('span', { text: 'Peso (kg)' }), peso),
        el('label', { class: 'campo', for: 'cintura' }, el('span', { text: 'Cintura (cm)' }), el('input', { class: 'entrada', id: 'cintura', inputmode: 'decimal', value: '85' })), erro,
        el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
          const v = Number(peso.value.replace(',', '.'));
          if (!(v > 30 && v < 300)) { erro.textContent = 'Confira o peso.'; return; }
          est.pesos.push(v); est.ponto = null; f.fechar(() => { ganhar(5, 'Peso registrado'); desenharTela(atual()); });
        } }, 'Registrar')], 'medidas');
    },
    fotos: () => { const r = el('div'); folhaApp('Fotos de progresso', [marcador(22), el('p', { class: 'mudo peq', text: 'Só você e a equipe veem.' }),
      el('div', { class: 'fotos' }, el('div', { class: 'foto' }, ic('camera', 'g'), 'Antes'), el('div', { class: 'foto' }, ic('camera', 'g'), 'Agora')), r,
      el('button', { type: 'button', class: 'botao grande cheio', onclick: () => trocar(r, explica('No app de verdade, abre a câmera ou a galeria. A foto vai para a sua ficha na clínica.')) }, 'Adicionar foto')], 'fotos'); }
  };
  const abrirFolha = k => REGISTROS[k] ? abrirRegistro(k) : FOLHAS[k] ? FOLHAS[k]() : k === 'refeicao' ? abrirRefeicao() : abrir(k);

  // Contagem até a próxima aplicação (sexta, 8h; depois de registrar, a sexta seguinte).
  function faltaAplicacao() {
    const agora = new Date(), alvo = new Date(agora); alvo.setHours(8, 0, 0, 0);
    alvo.setDate(alvo.getDate() + ((5 - agora.getDay() + 7) % 7)); if (alvo <= agora) alvo.setDate(alvo.getDate() + 7);
    if (est.aplicada) alvo.setDate(alvo.getDate() + 7);
    const h = Math.round((alvo - agora) / 36e5), d = Math.floor(h / 24), r = h % 24;
    return 'Faltam ' + (d ? d + (d === 1 ? ' dia' : ' dias') + (r ? ' e ' + r + ' h' : '') : r + ' h');
  }

  // ---------------------------------------------------------------- telas
  const TELAS = {
    'boas-vindas': () => {
      const ok = el('button', { type: 'button', class: 'botao grande cheio', disabled: true, onclick: () => irAba('inicio') }, 'Começar');
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
          metrica('lua', 'Sono', est.feitos.sono ? el('span', { class: 'grande-txt', text: est.feitos.sono.split(' · ')[0] }) : el('span', { class: 'acao-m' }, 'Registrar', ic('seta', 'p')), est.feitos.sono ? est.feitos.sono.split(' · ')[1] : 'Como você dormiu?', () => abrirRegistro('sono')),
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
          lad('gota', 'Água', est.agua + ' de ' + META.agua + ' copos', () => abrirFolha('agua'), 11, est.agua > 0),
          lad('lua', 'Sono', est.feitos.sono, () => abrirFolha('sono'), 12, !!est.feitos.sono), lad('corrida', 'Atividade física', est.feitos.atividade, () => abrirFolha('atividade'), 13, !!est.feitos.atividade),
          lad('sorriso', 'Humor', est.feitos.humor, () => abrirFolha('humor'), 14, !!est.feitos.humor), lad('maca', 'Fome e saciedade', est.feitos.fome, () => abrirFolha('fome'), 15, !!est.feitos.fome),
          lad('onda', 'Intestino', est.feitos.intestino, () => abrirFolha('intestino'), 16, !!est.feitos.intestino), lad('pilula', 'Remédios e vitaminas', Object.keys(est.tomou).length + ' de 2 tomados', () => abrirFolha('remedios'), 18, Object.keys(est.tomou).length > 0),
          lad('notas', 'Outros registros', est.feitos.outros || 'Álcool, tabaco e ciclo', () => abrirFolha('outros'), 17, !!est.feitos.outros), lad('livro', 'Plano alimentar', 'O cardápio da equipe', () => abrirFolha('plano'), 10)),
        el('p', { class: 'mudo peq', text: 'Cada registro soma pontos e aparece na ficha que a equipe acompanha.' })];
    },

    // ---- picadinha: o que a equipe cadastrou (sem números de dose), a contagem, o rodízio e os sintomas
    picadinha: () => {
      const sint = escolha(['Bem', 'Enjoo leve', 'Enjoo forte', 'Dor no local', 'Tontura'], 'Como você se sente', '');
      const travado = (rotulo, texto) => el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: rotulo }), el('span', { class: 'travado' }, ic('cadeado', 'p'), texto));
      return [
        cabAba('Picadinha', 'Acompanhada pela equipe', 23),
        el('section', { class: 'cartao heroi-pic elevado', 'aria-label': 'Próxima aplicação' },
          el('div', { class: 'cab-cartao' }, el('p', { class: 'sobretitulo cresce', text: 'Próxima aplicação' }), item(24)),
          el('p', { class: 'quando-pic', text: est.proxima }),
          el('p', { class: 'falta-pic' }, ic('relogio', 'p'), faltaAplicacao()),
          el('p', { class: 'mudo peq', text: est.aplicada ? 'Aplicação desta semana registrada. O lembrete já está marcado.' : 'Você recebe um lembrete no dia e na hora.' })),
        el('section', { class: 'cartao' }, el('div', { class: 'cab-cartao' }, el('h2', { text: 'Prescrição' }), el('span', { class: 'estado-tag ok' }, ic('check', 'p'), 'Conferida')),
          el('ul', { class: 'travados' }, travado('Medicamento', 'Medicamento cadastrado pela equipe'), travado('Dose', 'Preenchido pela equipe'), travado('Concentração', 'Preenchido pela equipe'),
            travado('Volume', 'Preenchido pela equipe'), el('li', { class: 'campo-travado' }, el('span', { class: 'rot', text: 'Frequência' }), el('strong', { text: '1 vez por semana' }))),
          explica('O app mostra o que a equipe cadastrou. Ele não calcula nem muda dose.')),
        cartao('Onde aplicar', 25, mapaCorpo()),
        cartao('Como se sentiu', [26, 27], sint.no, el('p', { class: 'mudo peq', text: 'A clínica escolhe os sintomas que avisam a enfermagem na hora (aqui, enjoo forte).' }),
          el('button', { type: 'button', class: 'botao grande cheio', onclick: () => {
            const s = sint.valor() || 'Bem';
            est.local = est.localEscolhido; est.localEscolhido = est.local === 'Abdômen esquerdo' ? 'Coxa direita' : 'Abdômen esquerdo'; est.proxima = 'Sexta que vem, às 8h'; est.aplicada = true;
            ganhar(5, 'Aplicação registrada');
            desenharTela('picadinha');
            if (s === 'Enjoo forte') setTimeout(() => DEMO.janela('Aplicação registrada', el('p', { text: 'A enfermagem da clínica recebeu um aviso sobre o enjoo forte e vai entrar em contato.' }), el('p', { class: 'mudo peq', text: 'Na demonstração, o aviso é simulado.' })), 700);
          } }, 'Registrar aplicação'))];
    },
    // ---- evolução: gráfico de linha (área suave, faixa da meta, ponto atual), tocar num ponto mostra o valor
    evolucao: () => {
      const PER = [['1 mês', 5], ['3 meses', 13], ['Tudo', est.pesos.length]];
      const n = Math.min(est.pesos.length, (PER.find(p => p[0] === est.periodo) || PER[2])[1]);
      const serie = est.pesos.slice(-n), inicio = est.pesos.length - n;
      const seg = el('div', { class: 'seg largo', role: 'radiogroup', 'aria-label': 'Período' }, PER.map(([r]) => el('button', { type: 'button', role: 'radio', 'aria-checked': String(est.periodo === r), 'aria-pressed': String(est.periodo === r),
        onclick: () => { est.periodo = r; est.ponto = null; desenharTela('evolucao'); } }, r)));
      const total = est.pesos[est.pesos.length - 1] - est.pesos[0];
      return [
        cabAba('Evolução', 'Seu peso, semana a semana', 20),
        el('section', { class: 'cartao elevado evolucao' }, seg, graficoEvolucao(serie, inicio),
          el('div', { class: 'tendencias' }, el('div', { class: 'bloco' }, el('strong', { text: fmt(total).replace('-', '−') + ' kg' }), el('span', { text: 'desde o início' })),
            el('div', { class: 'bloco' }, el('strong', { text: '72 a 73 kg' }), el('span', { text: 'faixa da meta, definida pela equipe' }))),
          el('div', { class: 'atalhos' }, el('button', { type: 'button', class: 'botao', onclick: () => abrirFolha('medidas') }, ic('balanca', 'p'), 'Registrar peso'),
            el('button', { type: 'button', class: 'botao sec', onclick: () => abrirFolha('fotos') }, ic('camera', 'p'), 'Fotos'))),
        cartao('Avaliação da consulta', 21, el('p', { class: 'mudo peq', text: 'Medido na clínica, separado do que você registra.' }),
          el('div', { class: 'blocos-2' }, [['Peso', '75,8', 'kg'], ['Gordura', '31', '%'], ['Massa muscular', '27,4', 'kg'], ['Cintura', '86', 'cm']].map(([r, v, u]) =>
            el('div', { class: 'bloco' }, el('span', { class: 'rot', text: r }), el('span', { class: 'numero med' }, v, el('small', { text: u }))))))];
    },

    // ---- mais
    mais: () => [
      el('header', { class: 'cab-app' }, el('div', { class: 'cresce' }, el('p', { class: 'sobretitulo', text: 'Perfil e mais' }), el('h1', { text: 'Você' }))),
      el('section', { class: 'cartao perfil-cab' }, el('div', { class: 'linha-h' }, el('span', { class: 'avatar grande', 'aria-hidden': 'true', text: 'MA' }),
          el('div', { class: 'cresce' }, el('h2', { text: PACIENTE + ' Alves' }), el('p', { class: 'mudo peq', text: 'Com ' + DEMO.nomeMedico().trim() + ' · fase de adaptação' })), item(5)),
        el('div', { class: 'blocos-2' }, [['Altura', '1,64', 'm'], ['Peso inicial', fmt(est.pesos[0]), 'kg']].map(([r, v, u]) => el('div', { class: 'bloco' }, el('span', { class: 'rot', text: r }), el('span', { class: 'numero med' }, v, el('small', { text: u }))))),
        el('p', { class: 'peq' }, el('strong', { text: 'Objetivo: ' }), 'perder gordura e ter mais disposição.')),
      grupoLista('Com a clínica', [['calendario', 'Minhas consultas', 'Terça, às 14h', 'consultas', 28], ['megafone', 'Avisos da clínica', '2 avisos', 'avisos', 29], ['conversa', 'Chat com a equipe', null, 'chat-equipe', 34],
        ['pessoas', 'Equipe e contatos', null, 'equipe', 33], ['livro', 'Conteúdo da clínica', null, 'conteudo', 31], ['clipe', 'Enviar exames', null, 'exames', 32]]),
      grupoLista('Para você', [['sino', 'Lembretes', null, 'lembretes', 30], ['medalha', 'Conquistas', '5 dias seguidos', 'conquistas', 35], ['pergunta', 'Assistente de dúvidas', null, 'assistente', 36]]),
      grupoLista('Sua conta', [['texto', 'Leitura confortável', 'Tema escuro e letra grande', 'leitura', 38], ['cadeado', 'Meus dados', null, 'meus-dados', 37]]),
      cartao('Ícone na tela do celular', 3, el('p', { class: 'peq', text: 'No navegador, toque em Compartilhar e depois em "Adicionar à Tela de Início". O app vira um ícone com a marca da clínica.' }))],
    perfil: () => [cartao('Perfil e objetivo', 5, dados([['Altura', '1,64 m'], ['Peso inicial', fmt(est.pesos[0]) + ' kg'], ['Objetivo', 'Perder gordura e ter mais disposição'], ['Fase', 'Adaptação (o médico define)']]))],
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
    leitura: () => {
      const chave = (rotulo, ligado, fn) => el('li', {}, el('span', { class: 'cresce', text: rotulo }), el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': String(ligado), 'aria-label': rotulo,
        onclick: e => { fn(); setTimeout(() => desenharTela('leitura'), 30); } }));
      return [cartao('Leitura confortável', 38, el('ul', { class: 'lista-simples' },
        chave('Tema escuro', DEMO.escuro(), () => DEMO.trocarTema()),
        chave('Letra grande', document.documentElement.dataset.letra === 'grande', () => { const h = document.documentElement; h.dataset.letra = h.dataset.letra === 'grande' ? '' : 'grande'; })),
        el('p', { class: 'mudo peq', text: 'O tema escuro também segue o celular, sozinho.' }))];
    }
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
  // Mapa do corpo (frente), como a pessoa vê o próprio corpo: o lado direito dela fica à esquerda da imagem.
  // A última aplicação aparece cheia e cinza; a sugerida, na cor da clínica, com um halo.
  function mapaCorpo() {
    const s = svg('svg', { viewBox: '0 0 200 316', class: 'corpo', role: 'img', 'aria-label': 'Mapa do corpo, de frente. Última aplicação: ' + est.local.toLowerCase() + '. Sugerido: ' + est.localEscolhido.toLowerCase() + '.' });
    const membro = d => [svg('path', { d, class: 'membro-borda' }), svg('path', { d, class: 'membro' })];
    s.append(...membro('M66 86 Q52 96 48 124 L40 182'), ...membro('M134 86 Q148 96 152 124 L160 182'), ...membro('M88 196 L84 300'), ...membro('M112 196 L116 300'));
    s.append(svg('path', { d: 'M100 70 C82 70 66 76 62 92 L60 150 Q60 186 76 200 L124 200 Q140 186 140 150 L138 92 C134 76 118 70 100 70Z', class: 'silhueta' }),
      svg('rect', { x: 92, y: 56, width: 16, height: 18, rx: 6, class: 'silhueta' }), svg('ellipse', { cx: 100, cy: 36, rx: 20, ry: 24, class: 'silhueta' }));
    const LOCAIS = { 'Braço direito': [51, 132], 'Braço esquerdo': [149, 132], 'Abdômen direito': [86, 150], 'Abdômen esquerdo': [114, 150], 'Coxa direita': [86, 236], 'Coxa esquerda': [114, 236] };
    for (const [nome, [x, y]] of Object.entries(LOCAIS)) {
      const cls = nome === est.localEscolhido ? 'local sugerido' : nome === est.local ? 'local ultimo' : 'local';
      if (nome === est.localEscolhido) s.append(svg('circle', { cx: x, cy: y, r: 16, class: 'halo-local' }));
      s.append(svg('circle', { cx: x, cy: y, r: 8, class: cls }));
    }
    const legenda = el('div', { class: 'legenda' }, el('span', { class: 'leg sugerido' }, 'Sugerido: ' + est.localEscolhido.toLowerCase()), el('span', { class: 'leg ultimo' }, 'Última: ' + est.local.toLowerCase()));
    const escolher = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Onde vai aplicar' }, Object.keys(LOCAIS).map(n => el('button', { type: 'button', class: 'chip', role: 'radio',
      'aria-checked': String(n === est.localEscolhido), 'aria-pressed': String(n === est.localEscolhido), disabled: n === est.local,
      onclick: () => { est.localEscolhido = n; desenharTela('picadinha'); } }, n === est.localEscolhido ? ic('check', 'p') : null, n)));
    return el('div', { class: 'mapa' }, el('p', { class: 'mudo peq', text: 'Última: ' + est.local.toLowerCase() + '. Sugerido: ' + est.localEscolhido.toLowerCase() + '.' }), s, legenda, el('p', { class: 'rot', text: 'Onde vai aplicar desta vez?' }), escolher);
  }
  // Gráfico da evolução: área suave, a faixa da meta, o ponto escolhido em destaque. Tocar (ou o controle deslizante) mostra o valor.
  function graficoEvolucao(v, inicio) {
    const W = 340, H = 190, B = 26, metaMin = 72, metaMax = 73;
    const min = Math.min(metaMin, ...v) - 0.6, max = Math.max(...v) + 0.6;
    const x = i => v.length === 1 ? W / 2 : 14 + i * (W - 28) / (v.length - 1), y = val => 12 + (max - val) / (max - min) * (H - B - 12);
    const sel = est.ponto == null || est.ponto >= v.length ? v.length - 1 : est.ponto;
    const rotulo = i => inicio + i === est.pesos.length - 1 ? 'Hoje' : 'Semana ' + (inicio + i + 1);
    const leitura = el('div', { class: 'leitura-graf', 'aria-live': 'polite' });
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Peso de ' + fmt(v[0]) + ' para ' + fmt(v[v.length - 1]) + ' kg. Faixa da meta: 72 a 73 kg.' });
    const desenhar = i => {
      trocar(leitura, el('span', { class: 'numero' }, fmt(v[i]), el('small', { text: 'kg' })), el('span', { class: 'mudo peq', text: rotulo(i) }));
      s.replaceChildren();
      const pts = v.map((val, k) => [x(k), y(val)]);
      s.append(svg('path', { d: 'M' + pts.map(p => p.join(' ')).join(' L') + ' L' + x(v.length - 1) + ' ' + (H - B) + ' L' + x(0) + ' ' + (H - B) + 'Z', class: 'area' }));
      s.append(svg('rect', { x: 0, y: y(metaMax), width: W, height: y(metaMin) - y(metaMax), class: 'faixa-meta', rx: 6 }));
      const t = svg('text', { x: 6, y: y(metaMax) - 5, class: 'eixo' }); t.textContent = 'faixa da meta'; s.append(t);
      s.append(svg('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'traco' }));
      s.append(svg('line', { x1: pts[i][0], x2: pts[i][0], y1: 8, y2: H - B, class: 'guia' }));
      s.append(svg('circle', { cx: pts[i][0], cy: pts[i][1], r: 10, class: 'halo' }), svg('circle', { cx: pts[i][0], cy: pts[i][1], r: 5, class: 'atual' }));
      [0, v.length - 1].forEach(k => { const e = svg('text', { x: x(k), y: H - 6, class: 'eixo', 'text-anchor': k ? 'end' : 'start' }); e.textContent = rotulo(k); s.append(e); });
      faixa.value = String(i); faixa.setAttribute('aria-valuetext', rotulo(i) + ': ' + fmt(v[i]) + ' kg');
    };
    const faixa = el('input', { type: 'range', class: 'faixa-pontos', min: '0', max: String(v.length - 1), step: '1', value: String(sel), 'aria-label': 'Escolher a semana no gráfico' });
    faixa.addEventListener('input', () => { est.ponto = Number(faixa.value); desenhar(est.ponto); });
    s.addEventListener('pointerdown', e => { const r = s.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W; let m = 0; v.forEach((_, k) => { if (Math.abs(x(k) - px) < Math.abs(x(m) - px)) m = k; }); est.ponto = m; desenhar(m); });
    desenhar(sel);
    return el('div', { class: 'graf-evolucao' }, leitura, s, faixa);
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
    const FOLHA = { refeicao: 'busca', buscar: 'busca', alimento: 'busca', foto: 'foto', codigo: 'codigo' };
    if (FOLHA[pedida]) { irAba('inicio'); abrirRefeicao(FOLHA[pedida]); }
    else if (REGISTROS[pedida] || FOLHAS[pedida]) { irAba(['medidas', 'fotos'].includes(pedida) ? 'evolucao' : 'registrar'); abrirFolha(pedida); }
    else if (pedida && TELAS[pedida] && pedida !== 'boas-vindas') {
      if (['inicio', 'registrar', 'picadinha', 'evolucao', 'mais'].includes(pedida)) irAba(pedida);
      else { est.aba = 'mais'; abrir(pedida); }
    } else desenhar('boas-vindas');
  } });
})();
