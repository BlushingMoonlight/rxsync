// Demonstração por link (DEC-125): a ÚNICA fonte dos dados de mentira, usada pelo app do paciente e pela central do
// médico. Nenhum número fica duplicado à mão nas telas: tudo sai daqui ou é calculado daqui.
// - As datas são relativas ao momento em que a página abre (hoje, ontem, a próxima aplicação, o retorno).
// - O que a pessoa faz no app ou na central muda estes dados na memória da página (some ao recarregar) e as duas
//   telas leem o mesmo objeto: o ciclo fecha na mesma visita. Nada daqui vai para o servidor nem fica no aparelho.
// - Pacientes de mentira. Nenhum número de dose: a prescrição só diz quem cadastrou e quem conferiu.
(function () {
  'use strict';
  const agora = new Date();
  const H = 36e5, DIA = 864e5;
  // Um dia relativo a hoje (0 = hoje, -1 = ontem, 6 = daqui a 6 dias), na hora pedida.
  const em = (dias, h, m) => { const d = new Date(agora); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + dias); d.setHours(h || 0, m || 0, 0, 0); return d; };
  const horasAtras = h => new Date(agora.getTime() - h * H);
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const dois = n => String(n).padStart(2, '0');
  const hora = d => d.getHours() + 'h' + (d.getMinutes() ? dois(d.getMinutes()) : '');
  const ddmm = d => dois(d.getDate()) + '/' + dois(d.getMonth() + 1);
  const dataLonga = d => ddmm(d) + '/' + d.getFullYear();
  const diasAtras = d => Math.round((em(0) - new Date(d).setHours(0, 0, 0, 0)) / DIA);
  // "hoje, 8h40", "ontem, 21h", "amanhã, 8h", "terça, 28/10, 14h" (futuro), "há 4 dias" ou "12/09" (passado).
  function quando(d, semHora) {
    const k = diasAtras(d), h = semHora ? '' : ', ' + hora(d);
    if (k === 0) return 'hoje' + h;
    if (k === 1) return 'ontem' + h;
    if (k === -1) return 'amanhã' + h;
    if (k < 0) return DIAS[d.getDay()] + ', ' + ddmm(d) + h;
    if (k < 7) return 'há ' + k + ' dias';
    return ddmm(d);
  }
  // fmt(76, 1) → "76,0" (kg sempre com uma casa); fmt(6.5) → "6,5"; fmt(20) → "20".
  const fmt = (v, casas) => (Math.round(v * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: casas === 1 ? 1 : 0, maximumFractionDigits: 1 });
  const inteiro = v => Math.round(v).toLocaleString('pt-BR');
  const sinal = (v, casas) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), casas);

  // ---------------------------------------------------------------- equipe da clínica (o médico vem do link)
  const EQUIPE = { nutri: 'Paula Reis', nutriCargo: 'nutricionista', enf: 'Carla Mendes', enfCargo: 'enfermeira', recepcao: 'Recepção' };

  // ---------------------------------------------------------------- Mariana, a paciente do app
  // Começou há 113 dias (primeira consulta, com bioimpedância). Pesa-se em casa toda semana, no mesmo dia, e registra no
  // app; nos dias de consulta, o peso é o da balança da clínica. Perda semanal entre 0,9 e 0,4 kg.
  const INICIO = -113;
  const PERDAS = [0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5, 0.4, 0.5, 0.5, 0.4, 0.4, 0.4, 0.4];
  const pesagens = [{ quando: em(INICIO, 9), kg: 84.0, origem: 'clinica' }];
  PERDAS.forEach((p, k) => pesagens.push({ quando: em(INICIO + 7 * (k + 1), 7, 10), kg: +(pesagens[k].kg - p).toFixed(1), origem: k + 1 === 12 ? 'clinica' : 'paciente' }));
  pesagens[12].quando = em(INICIO + 84, 9);   // retorno com bioimpedância: o peso é o da balança da clínica
  const CONSULTA_1 = em(INICIO, 9), CONSULTA_2 = em(INICIO + 28, 9), CONSULTA_3 = em(INICIO + 84, 9);
  const RETORNO = em(6, 14);
  // A aplicação é semanal, sempre no mesmo dia da semana, às 8h; a última foi há 6 dias e a próxima é amanhã.
  const LOCAIS = ['Abdômen direito', 'Abdômen esquerdo', 'Coxa direita', 'Coxa esquerda', 'Braço direito', 'Braço esquerdo'];
  const aplicacoes = [];
  for (let k = 0; k * 7 + INICIO + 2 <= -6; k++) aplicacoes.push({ quando: em(INICIO + 2 + 7 * k, 8), local: LOCAIS[k % 6], sintoma: k === 0 ? 'Enjoo leve' : 'Bem' });
  // O dia de hoje: só o que já passou da hora em que a página abriu.
  const ja = (h, m) => em(0, h, m) <= agora;
  const REFEICOES_HOJE = [[7, 30, 'Café da manhã', 'Ovos mexidos e pão integral', 340, 20], [10, 0, 'Lanche', 'Iogurte natural', 105, 6.5],
    [12, 40, 'Almoço', 'Arroz, feijão, frango e salada', 560, 44], [16, 0, 'Lanche', 'Fruta e castanhas', 190, 5]];
  const mariana = {
    id: 1, nome: 'Mariana Alves', primeiro: 'Mariana', altura: 1.64, objetivo: 'Perder gordura e ter mais disposição',
    inicio: CONSULTA_1, fase: 'Perda de peso', faseEm: CONSULTA_2,
    faixaPeso: [68, 70], faixaEm: CONSULTA_1,
    metas: { kcal: 1500, prot: 100, agua: 2000, por: EQUIPE.nutri, cargo: EQUIPE.nutriCargo, em: CONSULTA_3 },
    pesagens,
    bio: [{ quando: CONSULTA_1, peso: 84.0, gordura: 37.2, musculo: 28.3, cintura: 99 }, { quando: CONSULTA_3, peso: pesagens[12].kg, gordura: 34.0, musculo: 27.9, cintura: 92 }],
    refeicoes: REFEICOES_HOJE.filter(r => ja(r[0], r[1])).map(([h, m, refeicao, nome, kcal, prot]) => ({ quando: em(0, h, m), refeicao, nome, kcal, prot })),
    agua: [7, 9, 11, 13, 15, 17].filter(h => ja(h, 0)).map(h => ({ quando: em(0, h), ml: 250 })),
    registros: [],   // sono, humor, atividade… de hoje: { chave, titulo, valor, quando }
    remedios: [{ k: 'vitd', nome: 'Vitamina D', quando: '1 cápsula no almoço', tomou: ja(12, 50) ? em(0, 12, 50) : null }, { k: 'omega', nome: 'Ômega 3', quando: '1 cápsula no jantar', tomou: null }],
    // Os 7 dias anteriores a hoje (do mais antigo ao de ontem): todos com registro.
    semana: { prot: [96, 88, 102, 94, 85, 99, 91], kcal: [1480, 1390, 1550, 1460, 1320, 1510, 1430], agua: [2000, 1750, 2250, 1750, 2000, 1500, 2000], comRegistro: 7 },
    aplicacoes, proximoLocal: LOCAIS[aplicacoes.length % 6],
    prescricao: { cadastrada: CONSULTA_3, por: 'medico', conferida: em(INICIO + 85, 10), conferidaPor: EQUIPE.enf, renovacao: { cadastrada: em(0, 8, 0), conferida: null } },
    consultas: [{ quando: RETORNO, com: 'medico', tipo: 'Retorno', modo: 'presencial', presenca: false }, { quando: em(34, 10), com: 'nutri', tipo: 'Avaliação com a nutricionista', modo: 'presencial', presenca: false }],
    sintoma: null, intestino3: false, protBaixa3: false, ultimo: null, linha: []
  };
  if (ja(6, 50)) mariana.registros.push({ chave: 'sono', titulo: 'Sono', valor: '7 a 8h · Bem', quando: em(0, 6, 50) });
  if (ja(9, 0)) mariana.registros.push({ chave: 'humor', titulo: 'Humor', valor: 'Bem', quando: em(0, 9, 0) });

  // ---------------------------------------------------------------- os outros pacientes da central (menos detalhe)
  // dias7: dias com registro nos 7 dias anteriores a hoje. ultimoH: horas desde o último registro.
  // perda: kg por semana (positivo = perdeu); ultimaSemana: a variação da última semana, quando foge da média.
  const OUTROS = [
    { id: 2, nome: 'João Pereira', fase: 'Manutenção', inicioDias: 203, p0: 96.2, perda: 0.2, dias7: 3, ultimoH: 98, metas: [1800, 120, 2500], hoje: [0, 0, 0] },
    { id: 3, nome: 'Beatriz Lima', fase: 'Perda de peso', inicioDias: 70, p0: 88.5, perda: 0.6, dias7: 6, ultimoH: 22, metas: [1500, 100, 2000], hoje: [0, 0, 0], sintomaH: 22 },
    { id: 4, nome: 'Carlos Souza', fase: 'Início', inicioDias: 25, p0: 102.4, perda: 0.3, ultimaSemana: 0.2, dias7: 5, ultimoH: 3, metas: [1800, 130, 2500], hoje: [620, 31, 750], protBaixa3: true },
    { id: 5, nome: 'Fernanda Rocha', fase: 'Manutenção', inicioDias: 260, p0: 79.0, perda: 0.1, dias7: 7, ultimoH: 2, metas: [1600, 100, 2000], hoje: [910, 58, 1250] },
    { id: 6, nome: 'Ricardo Nunes', fase: 'Perda de peso', inicioDias: 98, p0: 110.0, perda: 0.7, dias7: 6, ultimoH: 20, metas: [1900, 140, 2500], hoje: [0, 0, 0] },
    { id: 7, nome: 'Luana Martins', fase: 'Perda de peso', inicioDias: 133, p0: 91.0, perda: 0.5, dias7: 7, ultimoH: 4, metas: [1500, 105, 2000], hoje: [720, 47, 1000] },
    { id: 8, nome: 'Paulo Henrique', fase: 'Início', inicioDias: 18, p0: 99.0, perda: 0.5, dias7: 4, ultimoH: 47, metas: [1800, 120, 2500], hoje: [0, 0, 0], intestino3: true }
  ];
  const RUIDO = [0, 0.2, -0.1, 0.1, -0.2, 0.1, 0, -0.1];
  const pacientes = [mariana].concat(OUTROS.map(o => {
    const n = Math.floor(o.inicioDias / 7), pes = [];
    for (let k = 0; k <= n; k++) pes.push({ quando: em(-o.inicioDias + 7 * k, 8), kg: +(o.p0 - o.perda * k + (k && k < n ? RUIDO[k % 8] : 0)).toFixed(1), origem: k ? 'paciente' : 'clinica' });
    if (o.ultimaSemana != null && n) pes[n].kg = +(pes[n - 1].kg + o.ultimaSemana).toFixed(1);
    return { id: o.id, nome: o.nome, primeiro: o.nome.split(' ')[0], inicio: em(-o.inicioDias, 9), fase: o.fase, faseEm: em(-Math.min(o.inicioDias, 30), 9), pesagens: pes,
      metas: { kcal: o.metas[0], prot: o.metas[1], agua: o.metas[2], por: EQUIPE.nutri, cargo: EQUIPE.nutriCargo, em: em(-Math.min(o.inicioDias, 30), 9) },
      hojeFixo: { kcal: o.hoje[0], prot: o.hoje[1], agua: o.hoje[2] }, dias7: o.dias7, ultimo: horasAtras(o.ultimoH),
      sintoma: o.sintomaH ? { nome: 'Enjoo forte', quando: horasAtras(o.sintomaH) } : null, protBaixa3: !!o.protBaixa3, intestino3: !!o.intestino3, linha: [], consultas: [] };
  }));
  const pac = id => pacientes.find(p => p.id === id);

  // ---------------------------------------------------------------- agenda, prescrições, recados, conteúdo e funções
  const agenda = [
    { quando: em(0, 9), paciente: 6, tipo: 'Retorno', modo: 'presencial' }, { quando: em(0, 10, 30), paciente: 7, tipo: 'Retorno', modo: 'por vídeo' },
    { quando: em(0, 15), paciente: 5, tipo: 'Retorno', modo: 'presencial' }, { quando: RETORNO, paciente: 1, tipo: 'Retorno', modo: 'presencial' }];
  for (const a of agenda) if (a.paciente !== 1) pac(a.paciente).consultas.push({ quando: a.quando, com: 'medico', tipo: a.tipo, modo: a.modo, presenca: true });
  const prescricoes = [
    { paciente: 1, tipo: 'Renovação', cadastrada: mariana.prescricao.renovacao.cadastrada, conferida: null },
    { paciente: 3, tipo: 'Primeira prescrição', cadastrada: em(-1, 16), conferida: null },
    { paciente: 7, tipo: 'Renovação', cadastrada: em(-11, 11), conferida: em(-10, 9, 30) }];
  const recados = [
    { ids: [1], para: 'Mariana Alves', de: EQUIPE.recepcao, texto: 'Traga os exames de sangue no retorno.', quando: em(-1, 17, 20), lido: false },
    { ids: pacientes.map(p => p.id), para: 'Todos os pacientes (8)', de: EQUIPE.recepcao, texto: 'Aos sábados, a clínica atende das 8h às 12h.', quando: em(-3, 10), lido: false }];
  const CONTEUDO = [['camera', 'Vídeo', 'Como montar o prato', 'Metade do prato com legumes, um quarto com proteína e um quarto com arroz, feijão ou batata.'],
    ['livro', 'Artigo', 'Proteína em cada refeição', 'Ovos, frango, peixe, iogurte e feijão ajudam a manter a massa muscular.'],
    ['prato', 'Receita', 'Omelete de forno com legumes', '4 ovos, legumes picados e queijo branco. Forno médio até dourar.']];
  // Funções do app que a clínica liga e desliga na central (desligada, some do app).
  const funcoes = { refeicoes: ['Refeições e plano alimentar', true], basicos: ['Água, sono e atividade', true], bemestar: ['Humor, fome e intestino', true],
    outros: ['Outros registros (álcool, tabaco e ciclo)', true], aplicacoes: ['Aplicações', true], fotos: ['Fotos de progresso', true], chat: ['Chat com a equipe', true],
    assistente: ['Assistente de dúvidas', true], conquistas: ['Conquistas', true] };

  // ---------------------------------------------------------------- contas (as duas telas usam as mesmas)
  const pesoAtual = p => p.pesagens[p.pesagens.length - 1];
  const variacaoSemana = p => { const n = p.pesagens.length; return n > 1 ? +(p.pesagens[n - 1].kg - p.pesagens[n - 2].kg).toFixed(1) : 0; };
  const variacaoTotal = p => +(pesoAtual(p).kg - p.pesagens[0].kg).toFixed(1);
  function consumoHoje(p) {
    if (p.id !== 1) return { ...p.hojeFixo };
    return { kcal: p.refeicoes.reduce((s, r) => s + r.kcal, 0), prot: p.refeicoes.reduce((s, r) => s + r.prot, 0), agua: p.agua.reduce((s, a) => s + a.ml, 0) };
  }
  const media = v => v.reduce((s, x) => s + x, 0) / v.length;
  const ultimoRegistro = p => {
    if (p.id !== 1) return p.ultimo;
    const tudo = [...p.refeicoes, ...p.agua, ...p.registros, ...p.linha].map(x => x.quando).filter(d => d <= new Date());
    return tudo.length ? new Date(Math.max(...tudo)) : em(-1, 21, 10);
  };
  const dias7 = p => p.id === 1 ? p.semana.comRegistro : p.dias7;
  // Médias dos 7 dias anteriores a hoje (dias completos). Mariana: do histórico; os outros: perto da meta, ou abaixo
  // dela quando a proteína está baixa.
  function media7(p, k) {
    if (p.id === 1) return Math.round(media(p.semana[k]));
    const f = k === 'prot' && p.protBaixa3 ? 0.62 : k === 'agua' ? 0.8 : 0.92;
    return k === 'agua' ? Math.round(p.metas.agua * f / 50) * 50 : Math.round(p.metas[k] * f);
  }
  // "hoje", "ontem" ou "em 22/09"; e quem definiu as metas ("pela nutricionista Paula Reis" ou "por Dra. Helena Prado").
  const dia = d => { const k = diasAtras(d); return k === 0 ? 'hoje' : k === 1 ? 'ontem' : 'em ' + ddmm(d); };
  const autorMetas = p => p.metas.cargo ? 'pela ' + p.metas.cargo + ' ' + p.metas.por : 'por ' + p.metas.por;
  // Estado do paciente: a regra é a mesma para todos e aparece na tela ("por quê").
  const REGRAS = [
    ['alerta', 'Sintoma que a clínica marcou como alerta (enjoo forte) nas últimas 48 h.'],
    ['alerta', 'Nenhum registro há 3 dias ou mais.'],
    ['atencao', 'Proteína abaixo de 70% da meta nos 3 dias anteriores.'],
    ['atencao', 'Intestino registrado como "preso" 3 dias seguidos.'],
    ['atencao', 'Registros em 4 dias ou menos, dos 7 dias anteriores.']];
  function estado(p) {
    const motivos = [], d7 = dias7(p), ult = ultimoRegistro(p), semReg = Math.floor((agora - ult) / DIA);
    if (p.sintoma && agora - p.sintoma.quando <= 48 * H) motivos.push(['alerta', 'Relatou ' + p.sintoma.nome.toLowerCase(), 'Depois da aplicação de ' + quando(p.sintoma.quando) + '. ' + REGRAS[0][1]]);
    if (semReg >= 3) motivos.push(['alerta', 'Sem registro há ' + semReg + ' dias', 'Último registro ' + quando(ult) + '. ' + REGRAS[1][1]]);
    if (p.protBaixa3) motivos.push(['atencao', 'Proteína abaixo da meta', 'Abaixo de 70% da meta de ' + p.metas.prot + ' g nos 3 dias anteriores.']);
    if (p.intestino3) motivos.push(['atencao', 'Intestino preso há 3 dias', 'Registrado como "preso" 3 dias seguidos.']);
    if (d7 <= 4) motivos.push(['atencao', 'Poucos registros', 'Registrou em ' + d7 + ' dos 7 dias anteriores.']);
    const nivel = motivos.some(m => m[0] === 'alerta') ? 'alerta' : motivos.length ? 'atencao' : 'ok';
    const porque = nivel === 'ok' ? 'Registrou em ' + d7 + ' dos 7 dias anteriores e não relatou sintoma de alerta.' : motivos.map(m => m[2]).join(' ');
    return { nivel, motivos, porque, titulo: motivos.length ? motivos[0][1] : 'Em dia' };
  }
  // Pontos do dia (só no app): refeição 5, cada copo 2, cada outro registro 5, cada remédio 2.
  function pontos(p) {
    const r = p.registros.length, rem = p.remedios.filter(x => x.tomou).length;
    return Math.min(100, p.refeicoes.length * 5 + p.agua.length * 2 + r * 5 + rem * 2 + p.linha.filter(x => x.pontos).reduce((s, x) => s + x.pontos, 0));
  }
  // A última e a próxima aplicação (a próxima é 7 dias depois da última, às 8h).
  function aplicacao(p) {
    const ult = p.aplicacoes[p.aplicacoes.length - 1], prox = new Date(ult.quando); prox.setDate(prox.getDate() + 7); prox.setHours(8, 0, 0, 0);
    const h = Math.max(0, Math.round((prox - agora) / H)), d = Math.floor(h / 24), r = h % 24;
    return { ultima: ult, proxima: prox, falta: 'Faltam ' + (d ? d + (d === 1 ? ' dia' : ' dias') + (r ? ' e ' + r + ' h' : '') : r + ' h'), sugerido: p.proximoLocal };
  }
  const proximaConsulta = p => p.consultas.filter(c => c.quando > agora).sort((a, b) => a.quando - b.quando)[0] || null;
  const recadosDe = id => recados.filter(r => r.ids.includes(id)).sort((a, b) => b.quando - a.quando);

  // Linha do tempo da ficha: tudo o que o paciente registrou e o que a clínica fez, do mais novo para o mais antigo.
  function linhaDoTempo(p) {
    const itens = [];
    if (p.id === 1) {
      p.refeicoes.forEach(r => itens.push({ quando: r.quando, icone: 'prato', titulo: r.refeicao, detalhe: r.nome + ' · ' + inteiro(r.kcal) + ' kcal · ' + fmt(r.prot) + ' g de proteína', origem: 'paciente' }));
      // Água: uma linha por dia, com o total até o último registro (os copos um a um ficam no app).
      const ja0 = new Date(), aguaHoje = p.agua.filter(a => a.quando <= ja0);
      if (aguaHoje.length) itens.push({ quando: aguaHoje[aguaHoje.length - 1].quando, icone: 'gota', titulo: 'Água', detalhe: inteiro(aguaHoje.reduce((t, a) => t + a.ml, 0)) + ' mL no dia (' + aguaHoje.length + (aguaHoje.length === 1 ? ' registro)' : ' registros)'), origem: 'paciente' });
      p.registros.forEach(r => itens.push({ quando: r.quando, icone: ICONE_REG[r.chave] || 'notas', titulo: r.titulo, detalhe: r.valor, origem: 'paciente' }));
      p.remedios.filter(x => x.tomou).forEach(x => itens.push({ quando: x.tomou, icone: 'pilula', titulo: x.nome, detalhe: 'Tomou', origem: 'paciente' }));
      const ap = p.aplicacoes[p.aplicacoes.length - 1];
      itens.push({ quando: ap.quando, icone: 'seringa', titulo: 'Aplicação', detalhe: ap.local + ' · ' + (ap.sintoma === 'Bem' ? 'sem sintomas' : ap.sintoma.toLowerCase()), origem: 'paciente' });
      const pe = pesoAtual(p); itens.push({ quando: pe.quando, icone: 'balanca', titulo: 'Peso', detalhe: fmt(pe.kg, 1) + ' kg', origem: pe.origem });
      p.linha.filter(x => !x.oculto).forEach(x => itens.push(x));
      p.aplicacoes.slice(0, -1).filter(a => diasAtras(a.quando) <= 7).forEach(a => itens.push({ quando: a.quando, icone: 'seringa', titulo: 'Aplicação', detalhe: a.local, origem: 'paciente' }));
    } else {
      const u = p.ultimo;
      itens.push({ quando: u, icone: 'prato', titulo: 'Refeição', detalhe: 'Registrada pelo paciente', origem: 'paciente' });
      if (p.sintoma) itens.push({ quando: p.sintoma.quando, icone: 'alerta', titulo: 'Sintoma depois da aplicação', detalhe: p.sintoma.nome, origem: 'paciente' });
      if (p.intestino3) itens.push({ quando: new Date(u.getTime() - 10 * 60e3), icone: 'onda', titulo: 'Intestino', detalhe: 'Preso (3º dia seguido)', origem: 'paciente' });
      const pe = pesoAtual(p); itens.push({ quando: pe.quando, icone: 'balanca', titulo: 'Peso', detalhe: fmt(pe.kg, 1) + ' kg', origem: pe.origem });
    }
    const ja = new Date();
    return itens.filter(x => x.quando <= ja).sort((a, b) => b.quando - a.quando);
  }
  const ICONE_REG = { sono: 'lua', atividade: 'corrida', humor: 'sorriso', fome: 'maca', intestino: 'onda', outros: 'notas' };

  // Avisa as telas abertas quando algo muda (as duas leem daqui de novo).
  const ouvintes = [];
  const mudou = () => ouvintes.forEach(f => { try { f(); } catch (e) { /* a outra tela não está montada */ } });

  window.DEMO_MODELO = {
    agora, em, quando, hora, ddmm, dataLonga, fmt, inteiro, sinal, DIAS,
    EQUIPE, LOCAIS, pacientes, pac, mariana, agenda, prescricoes, recados, CONTEUDO, funcoes, REGRAS,
    media7, dia, autorMetas, pesoAtual, variacaoSemana, variacaoTotal, consumoHoje, media, ultimoRegistro, dias7, estado, pontos, aplicacao, proximaConsulta, recadosDe, linhaDoTempo,
    medico: () => { const d = (window.DEMO && DEMO.dados) || {}; return ((d.tratamento || '') + ' ' + (d.medico || '')).trim(); },
    funcaoLigada: k => !funcoes[k] || funcoes[k][1],
    ouvir: f => ouvintes.push(f), mudou
  };
})();
