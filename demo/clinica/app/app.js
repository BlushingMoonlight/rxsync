// App do paciente da demonstração (DEC-125): itens 1 a 38 do escopo. Paciente de mentira, nada é guardado.
// Regras fixas: o app não calcula dose (a picadinha mostra o que a equipe cadastrou); o assistente nunca diagnostica nem
// prescreve; a resposta da equipe no chat chega citada, entre aspas e sem alteração.
(function () {
  'use strict';
  const { el, trocar, item } = DEMO;
  const raiz = document.getElementById('raiz');
  const PACIENTE = 'Mariana';
  const est = { pilha: [], aba: 'inicio', agua: 4, aceite: false };
  const ABAS = [['inicio', 'Início', '🏠'], ['registrar', 'Registrar', '➕'], ['picadinha', 'Picadinha', '💉'], ['evolucao', 'Evolução', '📈'], ['mais', 'Mais', '☰']];
  const naoGuarda = () => DEMO.rapida('Na demonstração, nada é guardado.');

  // ---------------------------------------------------------------- peças
  const cartao = (titulo, itens, ...filhos) => el('section', { class: 'cartao' },
    titulo ? el('div', { class: 'linha-h cab-cartao' }, el('h2', { class: 'cresce', text: titulo }), [].concat(itens || []).map(item)) : null, ...filhos);
  const linhaIr = (icone, titulo, sub, tela, n) => el('li', {}, el('button', { type: 'button', class: 'linha-app', onclick: () => abrir(tela) },
    el('span', { class: 'ic', 'aria-hidden': 'true', text: icone }), el('span', { class: 'cresce' }, el('span', { class: 't1', text: titulo }), sub ? el('span', { class: 't2', text: sub }) : null),
    n ? el('span', { class: 'item-num', text: 'item ' + n, 'aria-hidden': 'true' }) : null, el('span', { 'aria-hidden': 'true', text: '›' })));
  const barra = (valor, max, rotulo) => { const b = el('div', { class: 'barra', role: 'img', 'aria-label': rotulo }); const i = el('i'); i.style.width = Math.min(100, Math.round(valor / max * 100)) + '%'; b.append(i); return b; };
  const chips = (opcoes, rotulo) => { const g = el('div', { class: 'chips', role: 'group', 'aria-label': rotulo });
    opcoes.forEach(o => g.append(el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: e => { g.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === e.currentTarget))); } }, o))); return g; };
  const salvar = (texto) => el('button', { type: 'button', class: 'botao', onclick: naoGuarda }, texto || 'Salvar');

  // ---------------------------------------------------------------- telas
  const TELAS = {
    'boas-vindas': () => [el('div', { class: 'bv pilha' },
      el('div', { class: 'selo grande', 'aria-hidden': 'true', text: DEMO.iniciais(DEMO.dados.clinica) }),
      el('h1', { text: 'Bem-vinda, ' + PACIENTE + '!' }),
      el('p', {}, 'Você entrou pelo link que a clínica ', el('strong', { text: DEMO.dados.clinica }), ' mandou no WhatsApp, sem senha. ', item(1)),
      cartao('Antes de começar', 4, el('p', { class: 'peq', text: 'Este app registra o seu dia a dia para a equipe acompanhar o tratamento. Algumas respostas são feitas por inteligência artificial e sempre a partir das orientações da equipe: ela não diagnostica nem receita.' }),
        el('label', { class: 'aceite' }, el('input', { type: 'checkbox', onchange: e => { est.aceite = e.target.checked; ok.disabled = !est.aceite; } }), ' Li e aceito o termo de uso')),
      (ok = el('button', { type: 'button', class: 'botao', disabled: true, onclick: () => irAba('inicio') }, 'Começar')))],
    inicio: () => [
      el('div', { class: 'ola' }, el('p', { class: 'mudo peq', text: 'Bom dia,' }), el('h1', { text: PACIENTE }), item(2), item(6)),
      el('div', { class: 'semana', role: 'list', 'aria-label': 'Semana' }, ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => el('span', { role: 'listitem', class: 'dia' + (i < 3 ? ' feito' : i === 3 ? ' hoje' : ''), text: d }))),
      cartao('Pontos de hoje', null, el('p', { class: 'grande-num', text: '64 de 100' }), barra(64, 100, '64 de 100 pontos')),
      cartao('Metas do dia', 9,
        el('div', { class: 'meta' }, el('span', { text: 'Calorias' }), el('span', { class: 'mudo', text: '1.120 de 1.600 kcal' })), barra(1120, 1600, '1.120 de 1.600 kcal'),
        el('div', { class: 'meta' }, el('span', { text: 'Proteína' }), el('span', { class: 'mudo', text: '62 de 110 g' })), barra(62, 110, '62 de 110 g'),
        el('div', { class: 'meta' }, el('span', { text: 'Água' }), el('span', { class: 'mudo', text: est.agua + ' de 8 copos' })), barra(est.agua, 8, est.agua + ' de 8 copos'),
        el('p', { class: 'mudo peq', text: 'As metas são definidas pela equipe da clínica.' })),
      cartao('Próxima consulta', 28, el('p', { text: 'Retorno com ' + DEMO.nomeMedico() }), el('p', { class: 'mudo peq', text: 'Terça, às 14h' + (DEMO.dados.cidade ? ' · ' + DEMO.dados.cidade : '') })),
      cartao('Recado da clínica', 29, el('p', { class: 'peq', text: 'Lembre de trazer os exames de sangue no retorno.' })),
      cartao('Conquistas', 35, el('p', { class: 'peq', text: '🔥 5 dias seguidos registrando' }))],
    registrar: () => [el('h1', { text: 'Registrar' }), el('ul', { class: 'lista-app' },
      linhaIr('🍽️', 'Refeição', 'busca, foto ou código de barras', 'refeicao', 7), linhaIr('📋', 'Plano alimentar', 'o cardápio da equipe', 'plano', 10),
      linhaIr('💧', 'Água', est.agua + ' copos hoje', 'agua', 11), linhaIr('😴', 'Sono', null, 'sono', 12), linhaIr('🏃', 'Atividade física', null, 'atividade', 13),
      linhaIr('🙂', 'Humor', null, 'humor', 14), linhaIr('🍎', 'Fome e saciedade', null, 'fome', 15), linhaIr('🚻', 'Intestino', null, 'intestino', 16),
      linhaIr('🗒️', 'Outros registros', 'álcool, tabaco e ciclo', 'outros', 17), linhaIr('💊', 'Remédios e vitaminas', null, 'remedios', 18))],
    refeicao: () => [cartao('Registrar refeição', [7, 8],
        el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao sec', onclick: naoGuarda }, '🔎 Buscar alimento'), el('button', { type: 'button', class: 'botao sec', onclick: naoGuarda }, '📷 Foto do prato'),
          el('button', { type: 'button', class: 'botao sec', onclick: naoGuarda }, '▦ Código de barras'))),
      cartao('Almoço · arroz, feijão e frango', null, el('p', { class: 'mudo peq', text: 'Quanto você comeu?' }), chips(['Meia porção', '1 porção', '1 e meia'], 'Porção'),
        el('dl', { class: 'nutri' }, [['Calorias', '520 kcal'], ['Proteínas', '38 g'], ['Carboidratos', '58 g'], ['Gorduras', '14 g']].map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])), salvar('Registrar'))],
    plano: () => [cartao('Plano alimentar', 10, el('p', { class: 'mudo peq', text: 'Montado pela equipe da clínica.' }),
      el('ul', { class: 'plano' }, [['Café da manhã', 'Ovos mexidos, pão integral e fruta', 'troca: iogurte natural com aveia'], ['Almoço', 'Arroz, feijão, frango e salada', 'troca: peixe no lugar do frango'],
        ['Lanche', 'Fruta e castanhas', 'troca: queijo branco'], ['Jantar', 'Omelete com legumes', 'troca: sopa de legumes com frango']].map(([r, c, t]) => el('li', {}, el('strong', { text: r }), el('span', { text: c }), el('span', { class: 'mudo peq', text: t })))))],
    agua: () => { const n = el('p', { class: 'grande-num', text: est.agua + ' copos' }); return [cartao('Água', 11, n, el('div', { class: 'botoes' },
      el('button', { type: 'button', class: 'botao', onclick: () => { est.agua = Math.min(12, est.agua + 1); n.textContent = est.agua + ' copos'; } }, '+ 1 copo (250 ml)'),
      el('button', { type: 'button', class: 'botao sec', onclick: () => { est.agua = Math.min(12, est.agua + 2); n.textContent = est.agua + ' copos'; } }, '+ 1 garrafa (500 ml)')))]; },
    sono: () => [cartao('Sono', 12, el('p', { class: 'mudo peq', text: 'Quantas horas você dormiu?' }), chips(['Menos de 5h', '5 a 6h', '7 a 8h', 'Mais de 8h'], 'Horas'),
      el('p', { class: 'mudo peq', text: 'Como dormiu?' }), chips(['Mal', 'Mais ou menos', 'Bem'], 'Como dormiu'), salvar())],
    atividade: () => [cartao('Atividade física', 13, chips(['Caminhada', 'Musculação', 'Bicicleta', 'Outra'], 'Tipo'), el('p', { class: 'mudo peq', text: 'Duração' }), chips(['15 min', '30 min', '45 min', '1 hora'], 'Duração'), salvar())],
    humor: () => [cartao('Humor', 14, chips(['😞', '😐', '🙂', '😄'], 'Como você se sente'), el('label', { class: 'campo' }, el('span', { text: 'Quer anotar algo?' }), el('textarea', { class: 'entrada', rows: '2' })), salvar())],
    fome: () => [cartao('Fome e saciedade', 15, el('p', { class: 'mudo peq', text: 'Antes do almoço' }), chips(['Pouca fome', 'Fome normal', 'Muita fome'], 'Antes'),
      el('p', { class: 'mudo peq', text: 'Depois do almoço' }), chips(['Ainda com fome', 'Satisfeita', 'Cheia demais'], 'Depois'), salvar())],
    intestino: () => [cartao('Intestino', 16, chips(['Normal', 'Preso', 'Solto'], 'Como está'), el('p', { class: 'mudo peq', text: 'Se ficar preso por 3 dias, a equipe recebe um aviso.' }), salvar())],
    outros: () => [cartao('Outros registros', 17, el('p', { class: 'mudo peq', text: 'Vistos só pela equipe.' }), el('p', { class: 'peq', text: 'Álcool' }), chips(['Não bebi', '1 dose', '2 ou mais'], 'Álcool'),
      el('p', { class: 'peq', text: 'Tabaco' }), chips(['Não fumei', 'Fumei'], 'Tabaco'), el('p', { class: 'peq', text: 'Ciclo menstrual' }), chips(['Sem sangramento', 'Menstruada'], 'Ciclo'), salvar())],
    remedios: () => [cartao('Remédios e vitaminas', 18, el('ul', { class: 'lista-simples' }, ['Vitamina D · 1 cápsula no almoço', 'Ômega 3 · 1 cápsula no jantar'].map(r => el('li', {}, el('span', { class: 'cresce', text: r }),
      el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: e => e.currentTarget.setAttribute('aria-pressed', 'true') }, 'Tomei')))))],
    picadinha: () => [
      cartao('Picadinha', 23, el('p', { class: 'mudo peq', text: 'O que a equipe cadastrou para você:' }),
        el('dl', { class: 'nutri' }, [['Medicamento', 'Medicamento A (exemplo)'], ['Dose', 'a cadastrada pela equipe'], ['Volume', 'o cadastrado pela equipe'], ['Frequência', '1 vez por semana']].map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
        el('p', { class: 'aviso info peq', text: 'O app mostra exatamente o que a equipe cadastrou e conferiu. Ele não calcula nem muda dose.' })),
      cartao('Próxima aplicação', 24, el('p', { text: 'Sexta, às 8h' }), el('p', { class: 'mudo peq', text: 'Você recebe um lembrete no dia e na hora.' })),
      cartao('Rodízio do local', 25, el('p', { class: 'mudo peq', text: 'Da última vez: abdômen, lado direito. Que tal o esquerdo?' }),
        chips(['Abdômen esquerdo', 'Abdômen direito', 'Coxa esquerda', 'Coxa direita', 'Braço esquerdo', 'Braço direito'], 'Local da aplicação')),
      cartao('Como se sentiu', [26, 27], chips(['Bem', 'Enjoo leve', 'Enjoo forte', 'Dor no local', 'Tontura'], 'Sintomas'),
        el('p', { class: 'mudo peq', text: 'Os sintomas que a clínica marcar (como enjoo forte) avisam a enfermagem na hora.' }), salvar('Registrar aplicação'))],
    evolucao: () => [
      cartao('Gráficos de evolução', 20, grafico([78.4, 77.9, 77.1, 76.6, 76.2, 75.4], 'Peso de 78,4 kg para 75,4 kg em 6 registros'), el('p', { class: 'mudo peq', text: 'Peso (kg) nos últimos registros' }),
        el('div', { class: 'botoes' }, el('button', { type: 'button', class: 'botao sec', onclick: () => abrir('medidas') }, 'Atualizar peso e medidas'), el('button', { type: 'button', class: 'botao sec', onclick: () => abrir('fotos') }, 'Fotos de progresso'))),
      cartao('Avaliação da consulta', 21, el('p', { class: 'mudo peq', text: 'Medido na clínica (separado do que você registra)' }),
        el('dl', { class: 'nutri' }, [['Peso', '75,8 kg'], ['Gordura', '31%'], ['Massa muscular', '27,4 kg'], ['Cintura', '86 cm']].map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])))],
    medidas: () => [cartao('Peso e medidas', 19, el('label', { class: 'campo' }, el('span', { text: 'Peso (kg)' }), el('input', { class: 'entrada', inputmode: 'decimal', value: '75,4' })),
      el('label', { class: 'campo' }, el('span', { text: 'Cintura (cm)' }), el('input', { class: 'entrada', inputmode: 'decimal', value: '86' })), salvar())],
    fotos: () => [cartao('Fotos de progresso', 22, el('p', { class: 'mudo peq', text: 'Vistas só por você e pela equipe.' }),
      el('div', { class: 'fotos' }, el('div', { class: 'foto', text: 'Antes' }), el('div', { class: 'foto', text: 'Agora' })), salvar('Adicionar foto'))],
    mais: () => [el('h1', { text: 'Mais' }), el('ul', { class: 'lista-app' },
      linhaIr('👤', 'Perfil e objetivo', null, 'perfil', 5), linhaIr('📅', 'Minhas consultas', null, 'consultas', 28), linhaIr('📣', 'Avisos da clínica', null, 'avisos', 29),
      linhaIr('⏰', 'Lembretes', null, 'lembretes', 30), linhaIr('📚', 'Conteúdo da clínica', null, 'conteudo', 31), linhaIr('🧾', 'Enviar exames', null, 'exames', 32),
      linhaIr('👩‍⚕️', 'Equipe e contatos', null, 'equipe', 33), linhaIr('💬', 'Chat com a equipe', null, 'chat-equipe', 34), linhaIr('🏅', 'Conquistas', null, 'conquistas', 35),
      linhaIr('🤖', 'Assistente de dúvidas', null, 'assistente', 36), linhaIr('🔐', 'Meus dados', null, 'meus-dados', 37), linhaIr('🔠', 'Leitura confortável', null, 'leitura', 38)),
      cartao('Ícone na tela do celular', 3, el('p', { class: 'peq', text: 'No navegador, toque em Compartilhar › Adicionar à Tela de Início. O app vira um ícone com a marca da clínica.' }))],
    perfil: () => [cartao('Perfil e objetivo', 5, el('dl', { class: 'nutri' }, [['Altura', '1,64 m'], ['Peso inicial', '78,4 kg'], ['Objetivo', 'Perder gordura e ganhar disposição'], ['Fase', 'Adaptação (definida pelo médico)']].map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])))],
    consultas: () => [cartao('Minhas consultas', 28, el('ul', { class: 'lista-simples' }, ['Terça, às 14h · retorno com ' + DEMO.nomeMedico(), 'Em 30 dias · avaliação com a nutricionista'].map(t => el('li', { text: t }))))],
    avisos: () => [cartao('Avisos da clínica', 29, el('ul', { class: 'lista-simples' }, ['Lembre de trazer os exames de sangue no retorno.', 'A clínica estará fechada no feriado de sexta.'].map(t => el('li', { text: t }))))],
    lembretes: () => [cartao('Lembretes', 30, el('ul', { class: 'lista-simples' }, [['Refeições', '8h, 12h, 16h e 20h'], ['Água', 'a cada 2 horas'], ['Remédios', '12h e 20h'], ['Aplicação', 'sexta, às 8h'], ['Consulta', 'na véspera']].map(([a, b]) =>
      el('li', {}, el('span', { class: 'cresce', text: a + ' · ' + b }), el('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', 'aria-label': 'Lembrete de ' + a, onclick: e => e.currentTarget.setAttribute('aria-pressed', String(e.currentTarget.getAttribute('aria-pressed') !== 'true')) }, 'Ligado')))))],
    conteudo: () => [cartao('Conteúdo da clínica', 31, chips(['Alimentação', 'Exercício', 'Receitas', 'Sono'], 'Área'),
      el('ul', { class: 'lista-simples' }, ['Vídeo: como montar o prato', 'Artigo: proteína em cada refeição', 'Receita: omelete de forno com legumes'].map(t => el('li', { text: t }))))],
    exames: () => [cartao('Enviar exames', 32, el('p', { class: 'mudo peq', text: 'Foto ou PDF vai direto para a sua ficha na clínica.' }), salvar('📎 Escolher arquivo'))],
    equipe: () => [cartao('Equipe e contatos', 33, el('ul', { class: 'lista-simples' }, [DEMO.nomeMedico() + ' · ' + DEMO.dados.especialidade, 'Nutricionista Paula · plano alimentar', 'Enfermeira Carla · aplicações e sintomas', 'Recepção · consultas e horários'].map(t => el('li', { text: t }))))],
    'chat-equipe': () => chat('equipe', 34, 'Chat com a equipe', 'Escreva para a equipe da clínica.'),
    assistente: () => chat('ia', 36, 'Assistente de dúvidas', 'Pergunte sobre as orientações da sua equipe.'),
    conquistas: () => [cartao('Conquistas', 35, el('ul', { class: 'lista-simples' }, ['🔥 5 dias seguidos registrando', '💧 Meta de água 3 dias na semana', '🏅 Selo: primeira semana completa'].map(t => el('li', { text: t }))))],
    'meus-dados': () => [cartao('Meus dados', 37, el('p', { class: 'peq', text: 'Você pode baixar tudo o que registrou ou pedir a exclusão dos seus dados (LGPD).' }),
      el('div', { class: 'botoes' }, salvar('Baixar meus dados'), el('button', { type: 'button', class: 'botao sec', onclick: naoGuarda }, 'Pedir a exclusão')))],
    leitura: () => [cartao('Leitura confortável', 38, el('div', { class: 'botoes' },
      el('button', { type: 'button', class: 'botao sec', onclick: () => { const h = document.documentElement; h.dataset.tema = h.dataset.tema === 'escuro' ? '' : 'escuro'; } }, 'Modo escuro'),
      el('button', { type: 'button', class: 'botao sec', onclick: () => { const h = document.documentElement; h.dataset.letra = h.dataset.letra === 'grande' ? '' : 'grande'; } }, 'Letra grande')))]
  };
  let ok;
  const NOMES = { refeicao: 'Refeição', plano: 'Plano alimentar', agua: 'Água', sono: 'Sono', atividade: 'Atividade física', humor: 'Humor', fome: 'Fome e saciedade', intestino: 'Intestino', outros: 'Outros registros',
    remedios: 'Remédios e vitaminas', medidas: 'Peso e medidas', fotos: 'Fotos de progresso', perfil: 'Perfil', consultas: 'Consultas', avisos: 'Avisos', lembretes: 'Lembretes', conteudo: 'Conteúdo',
    exames: 'Exames', equipe: 'Equipe', 'chat-equipe': 'Chat com a equipe', assistente: 'Assistente', conquistas: 'Conquistas', 'meus-dados': 'Meus dados', leitura: 'Leitura' };

  // Gráfico simples (SVG) do peso.
  function grafico(v, rotulo) {
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), min = Math.min(...v) - 0.5, max = Math.max(...v) + 0.5;
    s.setAttribute('viewBox', '0 0 300 120'); s.setAttribute('class', 'grafico'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo);
    const pts = v.map((x, i) => [10 + i * (280 / (v.length - 1)), 110 - (x - min) / (max - min) * 100]);
    const p = document.createElementNS(ns, 'polyline'); p.setAttribute('points', pts.map(x => x.join(',')).join(' ')); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '3'); s.append(p);
    for (const [x, y] of pts) { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '4'); c.setAttribute('fill', 'currentColor'); s.append(c); }
    return s;
  }
  // Chats de exemplo: nenhuma IA de verdade; a resposta é pronta. A pergunta vai para o registro da demonstração.
  function chat(qual, n, titulo, ajuda) {
    const lista = el('div', { class: 'conversa', 'aria-live': 'polite' }, qual === 'ia'
      ? bolha('outro', 'Oi, ' + PACIENTE + '! Respondo a partir das orientações da sua equipe. Não faço diagnóstico nem receito: dúvidas sobre o tratamento vão para a equipe.')
      : bolha('outro', 'Enfermeira Carla: “Oi, ' + PACIENTE + '! Qualquer dúvida sobre a aplicação, é só escrever aqui.”'));
    const campo = el('input', { class: 'entrada', id: 'msg-' + qual, maxlength: '300', autocomplete: 'off', placeholder: 'Escreva sua mensagem', 'aria-label': 'Mensagem' });
    const enviar = e => {
      e.preventDefault(); const t = campo.value.trim(); if (!t) return;
      lista.append(bolha('eu', t)); campo.value = '';
      DEMO.evento('pergunta', { chat: qual, texto: t.slice(0, 300) });
      setTimeout(() => lista.append(qual === 'ia'
        ? bolha('outro', 'Pela orientação da sua equipe: mantenha os registros do dia e leve essa dúvida ao retorno. Se algo mudou no tratamento ou você sentiu algo diferente, fale com a equipe pelo chat. (Na demonstração, esta resposta é um exemplo.)')
        : bolha('outro', 'Enfermeira Carla: “Recebi, ' + PACIENTE + '. Vou ver com a equipe e te respondo ainda hoje.”')), 700);
    };
    return [cartao(titulo, n, el('p', { class: 'mudo peq', text: ajuda }), lista,
      el('p', { class: 'mudo peq', text: qual === 'ia' ? 'Demonstração: as respostas são exemplos prontos. Não escreva dados de pacientes.' : 'A resposta da equipe chega igual, entre aspas e sem alteração. Na demonstração, ela é um exemplo pronto.' }),
      el('form', { class: 'enviar-msg', onsubmit: enviar }, campo, el('button', { class: 'botao', type: 'submit' }, 'Enviar')))];
  }
  const bolha = (quem, texto) => el('div', { class: 'bolha ' + quem, text: texto });

  // ---------------------------------------------------------------- navegação (dentro da página; o # guarda o código)
  function irAba(aba) { est.aba = aba; est.pilha = []; desenhar(aba); }
  function abrir(tela) { est.pilha.push(tela); desenhar(tela); }
  function voltar() { est.pilha.pop(); desenhar(est.pilha[est.pilha.length - 1] || est.aba); }
  function desenhar(tela) {
    const corpo = TELAS[tela] ? TELAS[tela]() : TELAS.inicio();
    const sub = est.pilha.length > 0;
    const telaApp = el('main', { class: 'tela-app', id: 'conteudo', tabindex: '-1' },
      sub ? el('div', { class: 'cab-sub' }, el('button', { type: 'button', class: 'botao sec', onclick: voltar, 'aria-label': 'Voltar' }, '‹ Voltar'), el('strong', { text: NOMES[tela] || '' })) : null, corpo);
    const abas = tela === 'boas-vindas' ? null : el('nav', { class: 'abas-app', 'aria-label': 'Partes do app' }, ABAS.map(([k, n, ic]) =>
      el('button', { type: 'button', 'aria-current': est.aba === k && !sub ? 'page' : null, onclick: () => irAba(k) }, el('span', { 'aria-hidden': 'true', text: ic }), n)));
    trocar(raiz, DEMO.topo('App do paciente · demonstração', 'entrada'), el('div', { class: 'celular' }, telaApp, abas),
      el('div', { class: 'rodape-demo' }, el('a', { class: 'botao sec', href: DEMO.link('central') }, 'Ver a central do médico'), el('a', { class: 'botao sec', href: DEMO.link('escopo') }, 'Montar o escopo'), DEMO.botaoConversar('leve')));
    DEMO.tela(tela);
    window.scrollTo(0, 0);
  }

  DEMO.iniciar({ pagina: 'app', raiz, montar: d => {
    document.title = 'App do paciente · ' + d.clinica;
    const pedida = DEMO.extra.tela;
    const abaDe = { inicio: 1, registrar: 1, picadinha: 1, evolucao: 1, mais: 1 };
    if (pedida && TELAS[pedida] && pedida !== 'boas-vindas') {
      if (abaDe[pedida]) irAba(pedida);
      else { est.aba = ['refeicao', 'plano', 'agua', 'sono', 'atividade', 'humor', 'fome', 'intestino', 'outros', 'remedios'].includes(pedida) ? 'registrar' : ['medidas', 'fotos'].includes(pedida) ? 'evolucao' : 'mais'; abrir(pedida); }
    } else desenhar('boas-vindas');
  } });
})();
