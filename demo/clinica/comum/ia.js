// IA SIMULADA da demonstração (nenhum serviço é chamado): as respostas saem de comum/dados.js e do manual
// (comum/manual.js). Três partes, com as mesmas regras fixas:
// - nunca diagnostica, nunca prescreve, nunca fala de dose (pedido de dose é recusado e vai para a tela certa);
// - um sinal de alerta vai para a equipe (enfermagem avisada e o paciente na triagem da central);
// - toda resposta e toda ação entram no Registro da IA (na central);
// 1. IA do paciente ("personal"): cobra com tato (check-in, proteína, água, véspera e depois da aplicação, dias sem
//    registro, parabéns), no horário e na intensidade que o paciente escolhe, no app ou num canal de mensagens
//    simulado (com o consentimento e o SAIR); o médico escolhe o que ela cobra e o tom, por paciente ou para todos;
// 2. IA da central: responde sobre um paciente ou todos, sempre com "de onde veio", e faz mudanças (metas, recado,
//    marcar visto, funções do app, a IA do paciente) só depois do "Confirmar", com o antes e o depois;
// 3. consumo em créditos de IA (nunca em reais): sobe quando o médico usa as IAs na demonstração.
// Tudo fica na memória da página (some ao recarregar).
(function () {
  'use strict';
  const M = window.DEMO_MODELO;
  const sem = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const agoraReal = () => new Date();
  const mariana = M.mariana;

  // ---------------------------------------------------------------- IA do paciente: o que ela cobra, o tom e as escolhas do paciente
  const TEMAS = [['checkin', 'Check-in da manhã'], ['proteina', 'Proteína no fim da tarde'], ['agua', 'Água'], ['vespera', 'Véspera da aplicação'],
    ['posAplicacao', 'Como se sentiu depois da aplicação'], ['semRegistro', '2 dias sem registro'], ['parabens', 'Parabéns pelos marcos']];
  const TONS = [['acolhedor', 'Acolhedor'], ['direto', 'Direto'], ['animado', 'Animado']];
  const todosTemas = () => Object.fromEntries(TEMAS.map(([k]) => [k, true]));
  // Definido pelo médico na central: para todos e, se quiser, por paciente.
  const config = { todos: { temas: todosTemas(), tom: 'acolhedor', por: '', em: null }, porPaciente: {} };
  const configDe = id => config.porPaciente[id] || config.todos;
  // Escolhido pelo paciente no app (a Mariana, na demonstração).
  const pref = { silencio: [22, 7], intensidade: 'moderada', pausa: '', canal: 'app', consentimento: null };
  const INTENSIDADE = { leve: ['checkin', 'vespera', 'posAplicacao', 'semRegistro', 'parabens'], moderada: TEMAS.map(t => t[0]), intensa: TEMAS.map(t => t[0]) };
  const HORA_TEMA = { checkin: 8, proteina: 17, agua: 15, vespera: 19, posAplicacao: 10, semRegistro: 18, parabens: 20 };
  const noSilencio = h => { const [de, ate] = pref.silencio; return de > ate ? (h >= de || h < ate) : (h >= de && h < ate); };

  // A mensagem de cada tema, no tom escolhido. Nenhuma fala de dose; a comida sugerida é a do plano da nutricionista.
  function mensagem(tema, p) {
    p = p || mariana;
    const tom = configDe(p.id).tom, nome = p.primeiro, c = M.consumoHoje(p);
    const falta = Math.max(0, Math.round(p.metas.prot - c.prot)), ap = p.aplicacoes ? M.aplicacao(p) : null;
    const T = {
      checkin: { acolhedor: 'Bom dia, ' + nome + '! Como você dormiu? Quando puder, registre o sono e o café da manhã.', direto: 'Bom dia, ' + nome + '. Registre o sono e o café da manhã.', animado: 'Bom dia, ' + nome + '! Dia novo começando: conta como você dormiu?' },
      proteina: { acolhedor: falta ? 'Faltam ' + falta + ' g de proteína hoje. No seu plano, o lanche da tarde pode ter iogurte natural ou ovo cozido.' : 'Você já chegou na meta de proteína de hoje. Que bom!',
        direto: falta ? 'Faltam ' + falta + ' g de proteína. Plano: iogurte natural ou ovo cozido no lanche.' : 'Meta de proteína de hoje cumprida.', animado: falta ? 'Faltam só ' + falta + ' g de proteína! Um iogurte natural no lanche já ajuda.' : 'Meta de proteína batida hoje!' },
      agua: { acolhedor: 'Você está com ' + M.inteiro(c.agua) + ' de ' + M.inteiro(p.metas.agua) + ' mL de água hoje. Um copo agora ajuda.', direto: 'Água: ' + M.inteiro(c.agua) + ' de ' + M.inteiro(p.metas.agua) + ' mL. Beba um copo.', animado: M.inteiro(c.agua) + ' de ' + M.inteiro(p.metas.agua) + ' mL de água! Bora mais um copo?' },
      vespera: { acolhedor: 'Amanhã é dia da aplicação' + (ap ? ', às ' + M.hora(ap.proxima) : '') + '. O último local foi ' + (ap ? ap.ultima.local.toLowerCase() : 'registrado no app') + '; escolha outro no app.', direto: 'Aplicação amanhã' + (ap ? ' às ' + M.hora(ap.proxima) : '') + '. Troque o local (o último foi ' + (ap ? ap.ultima.local.toLowerCase() : '—') + ').', animado: 'Amanhã tem aplicação! Lembre de trocar o local: o último foi ' + (ap ? ap.ultima.local.toLowerCase() : '—') + '.' },
      posAplicacao: { acolhedor: 'Como você se sentiu depois da última aplicação? Se tiver enjoo forte, me conte: a enfermagem é avisada.', direto: 'Como se sentiu depois da aplicação? Enjoo forte avisa a enfermagem.', animado: 'E aí, como foi depois da aplicação? Se algo não estiver bem, a enfermagem fica sabendo.' },
      semRegistro: { acolhedor: 'Faz 2 dias sem registro. Está tudo bem? Um registro rápido já ajuda a equipe a te acompanhar.', direto: '2 dias sem registro. Registre o dia de hoje.', animado: 'Sentimos sua falta por aqui! Um registro rápido hoje?' },
      parabens: { acolhedor: M.dias7(p) + ' de 7 dias com registro na semana. Isso ajuda muito o seu acompanhamento!', direto: M.dias7(p) + ' de 7 dias com registro. Continue assim.', animado: M.dias7(p) + ' de 7 dias com registro! Que semana!' }
    };
    return (T[tema] || T.checkin)[tom];
  }
  // As mensagens planejadas para hoje: só os temas ligados pela equipe e pela intensidade; no silêncio, ficam para depois.
  function planoHoje() {
    if (pref.pausa) return [];
    const temas = INTENSIDADE[pref.intensidade].filter(k => configDe(mariana.id).temas[k]);
    const lista = temas.filter(k => k !== 'semRegistro').map(k => {
      let h = HORA_TEMA[k]; const adiada = noSilencio(h); if (adiada) h = pref.silencio[1];
      return { tema: k, titulo: TEMAS.find(t => t[0] === k)[1], h, adiada, texto: mensagem(k) };
    });
    if (pref.intensidade === 'intensa' && configDe(mariana.id).temas.agua) lista.push({ tema: 'agua', titulo: 'Água (reforço)', h: 11, adiada: noSilencio(11), texto: mensagem('agua') });
    return lista.sort((a, b) => a.h - b.h);
  }

  // ---------------------------------------------------------------- registro da IA e consumo (créditos)
  const registro = [];
  function registrar(ia, tipo, texto, extra) { registro.unshift({ quando: agoraReal(), ia, tipo, texto, ...(extra || {}) }); }
  // Alguns registros de antes de hoje, para a lista não começar vazia.
  [[2, 'paciente', 'lembrete', 'Lembrete de água enviado no app.', 7], [5, 'paciente', 'lembrete', 'Parabéns pelos 7 de 7 dias com registro.', 5], [26, 'paciente', 'lembrete', 'Check-in da manhã no app.', 1],
    [27, 'central', 'resposta', 'Respondeu "quem está abaixo da meta de proteína?" (1 paciente).', null]].forEach(([h, ia, tipo, texto, pid]) =>
    registro.push({ quando: new Date(M.agora.getTime() - h * 36e5), ia, tipo, texto, paciente: pid ? M.pac(pid).nome : '', quem: ia === 'central' ? 'equipe' : '' }));

  const FUNCOES_IA = [['app', 'IA do paciente no app', 'pacientes', 2], ['whatsapp', 'IA do paciente no WhatsApp', 'pacientes', 3], ['foto', 'Foto do prato', 'pacientes', 5],
    ['central', 'IA da central', 'equipe', 4], ['resumo', 'Resumos', 'equipe', 6]];
  // O mês até hoje: perto dos 80% do teto, para o aviso aparecer quando o médico usar as IAs.
  const consumo = {
    teto: 10000, aoAtingir: 'pausar', pausada: false, avisou: { 80: false, 100: false },
    porFuncao: { app: 3120, whatsapp: 1890, foto: 1260, central: 1258, resumo: 462 },
    porPaciente: { 1: 1240, 3: 1105, 7: 980, 6: 905, 4: 760, 5: 640, 8: 420, 2: 220 },
    meses: [6120, 7480, 8260, 9050, 9630]
  };
  const total = () => Object.values(consumo.porFuncao).reduce((s, x) => s + x, 0);
  const pct = () => Math.round(total() / consumo.teto * 1000) / 10;
  // Gasta créditos de uma função. Devolve false se o teto pausou a IA.
  function gastar(funcao, pacienteId) {
    if (consumo.pausada) return false;
    const f = FUNCOES_IA.find(x => x[0] === funcao); if (!f) return true;
    consumo.porFuncao[funcao] += f[3];
    if (pacienteId && f[2] === 'pacientes') consumo.porPaciente[pacienteId] = (consumo.porPaciente[pacienteId] || 0) + f[3];
    conferirTeto();
    return true;
  }
  function conferirTeto() {
    const t = total();
    if (t >= consumo.teto * 0.8 && !consumo.avisou[80]) { consumo.avisou[80] = true; registrar('central', 'consumo', 'Aviso: 80% do teto de créditos de IA do mês.'); }
    if (t >= consumo.teto && !consumo.avisou[100]) {
      consumo.avisou[100] = true;
      if (consumo.aoAtingir === 'pausar') consumo.pausada = true;
      registrar('central', 'consumo', 'Teto do mês atingido: ' + (consumo.aoAtingir === 'pausar' ? 'as IAs foram pausadas.' : 'as IAs continuam (o excedente entra na cobrança do mês).'));
    }
    if (t < consumo.teto) { consumo.pausada = false; consumo.avisou[100] = false; }
    if (t < consumo.teto * 0.8) consumo.avisou[80] = false;
  }
  function mudarTeto(teto, aoAtingir) {
    if (teto) consumo.teto = teto;
    if (aoAtingir) { consumo.aoAtingir = aoAtingir; if (aoAtingir === 'continuar') consumo.pausada = false; else if (total() >= consumo.teto) consumo.pausada = true; }
    consumo.avisou[100] = consumo.avisou[100] && total() >= consumo.teto;
    conferirTeto(); M.mudou();
  }
  const PAUSADA = 'As IAs estão pausadas: o teto de créditos do mês foi atingido. A clínica pode continuar em Consumo de IA.';

  // ---------------------------------------------------------------- respostas: regras comuns
  const DOSE = /\bdos[ea]s?\b|\bdosagem|\bmg\b|\bmcg\b|\bui\b|quanto (devo |eu )?(aplic|tom)|aumenta\w* (a |o )?(dose|remedio|medicamento|caneta)|diminui\w* (a |o )?(dose|remedio|medicamento|caneta)|trocar (o |de )?(remedio|medicamento)|\breceit(e|ar|ou)\b|prescrev|prescric|diagnost/;
  const URGENTE = /falta de ar|desmai|dor (muito )?forte|dor no peito|vomit|sangr|alergia|inchac|enjoo forte|febre/;
  // Orientações da equipe (o que a IA do paciente pode repetir), com a origem.
  const ORIENTACOES = [
    [/proteina|ovo|iogurte|frango|carne|peixe/, 'Inclua uma proteína em cada refeição: ovos, frango, peixe, iogurte natural ou feijão. A sua meta é de ' + mariana.metas.prot + ' g por dia.', 'plano alimentar da nutricionista ' + M.EQUIPE.nutri],
    [/enjoo|nausea|enjoad/, 'Coma devagar, em porções menores, e evite frituras. Se o enjoo ficar forte, me conte: a enfermagem é avisada.', 'orientação da enfermagem (' + M.EQUIPE.enf + ')'],
    [/intestino|preso|prisao de ventre/, 'Beba água ao longo do dia e coma legumes e frutas com casca. Se ficar preso 3 dias seguidos, a equipe é avisada.', 'orientação da nutricionista ' + M.EQUIPE.nutri],
    [/exercicio|atividade|caminhada|academia|musculacao/, 'Atividade ajuda a manter a massa muscular. Registre o que fizer e combine a intensidade com a equipe.', 'orientação da equipe'],
    [/doce|chocolate|sobremesa|fim de semana|festa|alcool|cerveja|vinho/, 'Pode acontecer: registre o que comeu e volte ao plano na próxima refeição. Se tiver dúvida, leve ao retorno.', 'plano alimentar da nutricionista ' + M.EQUIPE.nutri]
  ];
  const semDose = 'Dose, diagnóstico e mudança no tratamento são decisões da sua equipe, e eu não respondo sobre isso. Leve a dúvida ao chat com a equipe ou ao retorno.';

  // ---------------------------------------------------------------- 1. IA do paciente (app ou mensagens)
  // Devolve { texto, origem, ir: [tela, rótulo], alerta }.
  function responderPaciente(texto, canal) {
    canal = canal === 'whatsapp' ? 'whatsapp' : 'app';
    const t = sem(texto), p = mariana;
    if (!gastar(canal, p.id)) return { texto: PAUSADA };
    let r;
    if (URGENTE.test(t)) {
      p.sintoma = { nome: /enjoo|vomit/.test(t) ? 'Enjoo forte' : 'Sintoma de alerta', quando: agoraReal() };
      r = { texto: 'Avisei a enfermagem agora. Se for forte ou piorar, procure atendimento de urgência. A equipe vai falar com você.', origem: 'regra da clínica: sintoma de alerta avisa a enfermagem', ir: ['chat-equipe', 'Abrir o chat com a equipe'], alerta: true };
      registrar('paciente', 'alerta', 'Sinal de alerta na conversa: avisou a enfermagem e colocou na triagem.', { paciente: p.nome, canal });
    } else if (DOSE.test(t)) {
      r = { texto: semDose, origem: 'regra fixa: a IA não fala de dose nem de tratamento', ir: ['chat-equipe', 'Abrir o chat com a equipe'] };
    } else {
      const o = ORIENTACOES.find(x => x[0].test(t));
      const [m] = window.DEMO_MANUAL.buscar(texto, 'app').filter(x => !['boas-vindas', 'assistente', 'personal', 'whatsapp'].includes(x.tela));
      // "Como registro…", "onde vejo…": o manual vem antes das orientações ("o que como…" é orientação).
      if (/\b(como|onde)\b.*\b(registr|abr|mud|escolh|ver|vejo|acho|uso|confirm|envi|marc|lig)/.test(t) && m) {
        const nome = m.titulo.replace(/ \(folha\)$/, '');
        r = { texto: nome + ': ' + m.passos.map((x, i) => (i + 1) + '. ' + x).join(' '), origem: 'manual do app', ir: [m.tela, 'Abrir ' + nome] };
      } else if (o) r = { texto: o[1], origem: o[2] };
      else if (m) { const nome = m.titulo.replace(/ \(folha\)$/, ''); r = { texto: nome + ': ' + m.passos.map((x, i) => (i + 1) + '. ' + x).join(' '), origem: 'manual do app', ir: [m.tela, 'Abrir ' + nome] }; }
      else r = { texto: 'Pela orientação da sua equipe: mantenha os registros do dia e leve essa dúvida ao retorno. Se algo mudou no tratamento ou você sentiu algo diferente, fale com a equipe no chat.', origem: 'orientação geral da equipe' };
    }
    if (!r.alerta) registrar('paciente', 'resposta', 'Respondeu uma dúvida (' + r.origem + ').', { paciente: p.nome, canal });
    M.mudou();
    return r;
  }
  // Um lembrete do personal (o "ver um exemplo" do app): gasta créditos e entra no registro.
  function lembrete(tema) {
    if (!gastar(pref.canal, mariana.id)) return null;
    const texto = mensagem(tema);
    registrar('paciente', 'lembrete', TEMAS.find(t => t[0] === tema)[1] + ' enviado ' + (pref.canal === 'whatsapp' ? 'no WhatsApp' : 'no app') + '.', { paciente: mariana.nome, canal: pref.canal });
    return texto;
  }
  function mudarPref(campo, valor) {
    const antes = rotPref(campo); pref[campo] = valor;
    if (campo === 'canal' && valor === 'whatsapp' && !pref.consentimento) pref.consentimento = agoraReal();
    registrar('paciente', 'preferencia', 'A paciente mudou ' + NOMES_PREF[campo] + ': ' + antes + ' → ' + rotPref(campo) + '.', { paciente: mariana.nome });
    M.mudou();
  }
  const NOMES_PREF = { silencio: 'o horário de silêncio', intensidade: 'a intensidade', pausa: 'a pausa', canal: 'o canal' };
  function rotPref(c) {
    if (c === 'silencio') return 'das ' + pref.silencio[0] + 'h às ' + pref.silencio[1] + 'h';
    if (c === 'pausa') return pref.pausa === 'hoje' ? 'pausado hoje' : pref.pausa === 'semana' ? 'pausado por 7 dias' : 'sem pausa';
    if (c === 'canal') return pref.canal === 'whatsapp' ? 'WhatsApp' : 'no app';
    return pref[c];
  }
  // "SAIR" no canal de mensagens: para tudo e volta para o app.
  function sair() {
    pref.canal = 'app'; pref.consentimento = null;
    registrar('paciente', 'preferencia', 'A paciente respondeu SAIR: as mensagens pararam; o personal segue só no app.', { paciente: mariana.nome, canal: 'whatsapp' });
    M.mudou();
  }

  // ---------------------------------------------------------------- 2. IA da central
  const pacienteNo = t => M.pacientes.find(p => t.includes(sem(p.nome))) || M.pacientes.find(p => new RegExp('\\b' + sem(p.primeiro) + '\\b').test(t));
  const FUNC_PAL = { refeicoes: /refeic|plano alimentar/, basicos: /agua|sono|atividade/, bemestar: /humor|fome|intestino/, outros: /alcool|tabaco|ciclo|outros registros/, aplicacoes: /aplicac/,
    fotos: /foto/, chat: /chat/, assistente: /assistente/, conquistas: /conquista|pontos/, personal: /personal|ia do paciente/ };
  const linhaPac = (p, detalhe) => ({ id: p.id, nome: p.nome, detalhe });
  // Variação de peso em ~30 dias (da pesagem de um mês atrás, ou da primeira, até a última).
  function perda30(p) {
    const u = M.pesoAtual(p), lim = new Date(u.quando.getTime() - 30 * 864e5);
    const ant = [...p.pesagens].reverse().find(x => x.quando <= lim) || p.pesagens[0];
    return +(u.kg - ant.kg).toFixed(1);
  }
  // Devolve { texto, origem, lista: [{ id, nome, detalhe }], acao, ir: [tela, rótulo], parte }.
  function responderCentral(texto) {
    const t = sem(texto), p = pacienteNo(t), medico = M.medico();
    const resumo = /resum/.test(t);
    if (!gastar(resumo ? 'resumo' : 'central')) return { texto: PAUSADA };
    let r;
    // "Como cadastro uma prescrição?" é dúvida de uso (vai para o manual); dose e mudança no tratamento, nunca.
    const usoPrescricao = /\b(como|onde)\b/.test(t) && /prescri/.test(t) && !/dos[ea]|\bmg\b|aument|diminu|mud|troc|ajust|suspend/.test(t);
    if (!usoPrescricao && (DOSE.test(t) || /medicament|medicac|remedio|tratamento/.test(t) && /(mud|troc|aument|diminu|suspend|ajust|par[ae])/.test(t))) {
      r = { texto: 'Isso é decisão sua; abra a prescrição. Eu não sugiro, não calculo e não mudo dose nem tratamento.', origem: 'regra fixa da IA da central', ir: ['aplicacoes', 'Abrir Aplicações'] };
    } else if ((r = acaoDe(t, p, texto))) {
      // proposta: só muda depois do "Confirmar"
    } else if (/(nao|sem) (registr|anot)|parou de registrar|sem registro/.test(t)) {
      const n = Number((t.match(/(\d+)\s*dias?/) || [])[1]) || 3;
      const lista = M.pacientes.filter(x => (M.agora - M.ultimoRegistro(x)) / 864e5 >= n);
      r = { texto: lista.length ? lista.length + (lista.length === 1 ? ' paciente sem registro' : ' pacientes sem registro') + ' há ' + n + ' dias ou mais.' : 'Ninguém está sem registro há ' + n + ' dias ou mais.',
        lista: lista.map(x => linhaPac(x, 'último registro ' + M.quando(M.ultimoRegistro(x)))), origem: 'registros do app (último registro de cada paciente)' };
    } else if (/abaixo da meta|meta de proteina|pouca proteina|proteina baixa/.test(t)) {
      const lista = M.pacientes.filter(x => x.protBaixa3 || M.media7(x, 'prot') < x.metas.prot * 0.9);
      r = { texto: lista.length + (lista.length === 1 ? ' paciente abaixo' : ' pacientes abaixo') + ' da meta de proteína (média dos 7 dias anteriores).',
        lista: lista.map(x => linhaPac(x, M.media7(x, 'prot') + ' de ' + x.metas.prot + ' g por dia')), origem: 'refeições registradas no app e metas da equipe (média dos 7 dias anteriores)' };
    } else if (/media|perda de peso|perderam|emagrec/.test(t) && !p) {
      const v = M.pacientes.map(perda30), med = v.reduce((s, x) => s + x, 0) / v.length;
      r = { texto: 'Variação média de peso nos últimos 30 dias: ' + M.sinal(med, 1) + ' kg (' + v.length + ' pacientes).', lista: M.pacientes.map((x, i) => linhaPac(x, M.sinal(v[i], 1) + ' kg em 30 dias')),
        origem: 'pesagens (do paciente e da clínica): a última contra a de 30 dias antes' };
    } else if (/alerta|atencao|triagem|preocup/.test(t) && !p) {
      const lista = M.pacientes.filter(x => M.estado(x).nivel !== 'ok');
      r = { texto: lista.length + ' pacientes pedem atenção hoje.', lista: lista.map(x => linhaPac(x, M.estado(x).titulo)), origem: 'regra do estado (Como o estado é calculado)' };
    } else if (p) {
      const e = M.estado(p), c = M.consumoHoje(p), cons = M.proximaConsulta(p), ap = p.aplicacoes ? M.aplicacao(p) : null;
      const partes = [(e.nivel === 'ok' ? 'Em dia' : e.nivel === 'alerta' ? 'Alerta' : 'Atenção') + ': ' + e.porque,
        'Peso ' + M.fmt(M.pesoAtual(p).kg, 1) + ' kg (' + M.sinal(M.variacaoTotal(p), 1) + ' kg desde o início, ' + M.sinal(perda30(p), 1) + ' kg em 30 dias).',
        'Registrou em ' + M.dias7(p) + ' dos 7 dias anteriores; proteína média de ' + M.media7(p, 'prot') + ' de ' + p.metas.prot + ' g.',
        'Hoje: ' + M.inteiro(c.kcal) + ' kcal, ' + M.fmt(c.prot) + ' g de proteína e ' + M.inteiro(c.agua) + ' mL de água.',
        ap ? 'Próxima aplicação ' + M.quando(ap.proxima) + '.' : '', cons ? 'Próxima consulta ' + M.quando(cons.quando) + '.' : ''];
      r = { texto: (resumo ? 'Resumo da semana de ' + p.nome + '. ' : p.nome + '. ') + partes.filter(Boolean).join(' '), lista: [linhaPac(p, 'abrir a ficha')],
        origem: 'ficha do paciente: registros do app, pesagens, metas da equipe, agenda e prescrição' };
    } else {
      // A central pergunta mais sobre a central: o manual dela primeiro, depois o do app.
      const [m] = window.DEMO_MANUAL.buscar(texto, 'central').concat(window.DEMO_MANUAL.buscar(texto, 'app'));
      if (m) { const nome = m.titulo.replace(/ \(folha\)$/, ''); r = { texto: nome + ' (' + (m.parte === 'app' ? 'app do paciente' : 'central') + '): ' + m.passos.map((x, i) => (i + 1) + '. ' + x).join(' '), origem: 'manual de uso', ir: [m.tela, 'Abrir ' + nome], parte: m.parte }; }
      else r = { texto: 'Não entendi. Tente: "quem não registrou há 3 dias?", "como está a Mariana?", "mude a meta de proteína da Mariana para 110" ou "como envio um recado?".', origem: '' };
    }
    if (!r.acao) registrar('central', 'resposta', 'Respondeu "' + texto.trim().slice(0, 80) + '"' + (r.origem ? ' (de: ' + r.origem + ')' : '') + '.', { quem: medico, paciente: p ? p.nome : '' });
    return r;
  }
  // Entende um pedido de mudança e devolve a proposta (antes e depois); nada muda antes do "Confirmar".
  function acaoDe(t, p, original) {
    const quer = /\b(mud|alter|ajust|defin|coloq|pon|troc|aument|diminu|suba|baixe|ligu|liga|deslig|ativ|desativ|mand|envi|marc|marq|configur|deix|pausa|pare)/.test(t);
    if (!quer) return null;
    // Meta: "mude a meta de proteína da Mariana para 110"
    const mm = t.match(/meta (?:de |da |do )?(proteina|calorias?|kcal|agua)[^\d]*(\d[\d.]*)/);
    if (mm && p) {
      const campo = /prot/.test(mm[1]) ? 'prot' : /agua/.test(mm[1]) ? 'agua' : 'kcal', valor = Number(mm[2].replace(/\./g, ''));
      const u = { prot: 'g', kcal: 'kcal', agua: 'mL' }[campo], nome = { prot: 'Meta de proteína', kcal: 'Meta de calorias', agua: 'Meta de água' }[campo];
      const lim = { prot: [30, 300], kcal: [800, 4000], agua: [500, 5000] }[campo];
      if (!(valor >= lim[0] && valor <= lim[1])) return { texto: 'Esse valor está fora do plausível (' + nome.toLowerCase() + ': de ' + lim[0] + ' a ' + lim[1] + ' ' + u + '). Nada foi mudado.', origem: 'mesma conferência da tela de metas' };
      return proposta('meta', p, nome + ' de ' + p.nome, M.inteiro(p.metas[campo]) + ' ' + u, M.inteiro(valor) + ' ' + u, 'No app, a tela Hoje mostra a meta nova, "definida por ' + M.medico() + ' hoje".', { campo, valor });
    }
    // Recado: "mande um recado para a Mariana: texto"
    if (/recado|mensagem|aviso|avise/.test(t) && (p || /todos/.test(t))) {
      const m = original.match(/[:"“](.+?)["”]?$/); const txt = m ? m[1].trim() : '';
      if (!txt) return { texto: 'Qual é o recado? Escreva depois de dois-pontos, por exemplo: "mande um recado para a Mariana: traga os exames no retorno".', origem: '' };
      const para = p ? p.nome : 'Todos os pacientes (' + M.pacientes.length + ')';
      return proposta('recado', p, 'Recado para ' + para, 'nenhum recado novo', '"' + txt.slice(0, 300) + '"', 'Aparece no app de quem recebe (Hoje e Avisos), com "de ' + M.medico() + '".', { texto: txt.slice(0, 300), ids: p ? [p.id] : M.pacientes.map(x => x.id), para });
    }
    // Marcar como visto
    if (/vist/.test(t) && p) return proposta('visto', p, p.nome + ' na triagem', M.vistos[p.id] ? 'já marcado como visto' : 'em "Precisa da sua atenção hoje"', 'marcado como visto (sai da triagem; o estado continua)', 'Só na central.', {});
    // IA do paciente: tom e temas
    const tom = TONS.find(([k, n]) => t.includes(sem(n)) || t.includes(k));
    const tema = TEMAS.find(([k, n]) => t.includes(sem(n)) || (k === 'agua' && /lembrete de agua|cobrar agua|sobre agua/.test(t)) || (k === 'proteina' && /lembrete de proteina|cobrar proteina/.test(t)) || (k === 'checkin' && /check-?in/.test(t)) || (k === 'parabens' && /parabens/.test(t)));
    if ((/personal|ia do paciente|ia da|ia de|lembrete|cobr|tom/.test(t)) && (tom || tema)) {
      const c = configDe(p ? p.id : 0), quem = p ? p.nome : 'todos os pacientes';
      if (tom) return proposta('iaTom', p, 'Tom da IA do paciente (' + quem + ')', TONS.find(x => x[0] === c.tom)[1], tom[1], 'O personal do app passa a falar no tom novo.', { tom: tom[0] });
      const liga = !/deslig|desativ|pare|tire|sem /.test(t);
      return proposta('iaTema', p, '"' + tema[1] + '" na IA do paciente (' + quem + ')', c.temas[tema[0]] ? 'ligado' : 'desligado', liga ? 'ligado' : 'desligado', 'O personal do app ' + (liga ? 'passa a mandar' : 'para de mandar') + ' esse lembrete.', { tema: tema[0], liga });
    }
    // Funções do app
    const f = Object.keys(FUNC_PAL).find(k => FUNC_PAL[k].test(t));
    if (f && /lig|deslig|ativ|desativ/.test(t)) {
      const liga = !/deslig|desativ/.test(t), n = M.funcoes[f][0];
      return proposta('funcao', null, 'Função do app: ' + n, M.funcoes[f][1] ? 'ligada' : 'desligada', liga ? 'ligada' : 'desligada', liga ? 'Aparece no app de todos os pacientes.' : 'Some do app de todos os pacientes na hora.', { funcao: f, liga });
    }
    return null;
  }
  function proposta(tipo, p, oque, antes, depois, outroLado, dados) {
    return { texto: 'Posso fazer esta mudança. Confira e confirme:', acao: { tipo, paciente: p ? p.id : null, oque, antes, depois, outroLado, dados }, origem: 'pedido de ' + M.medico() };
  }
  // Aplica a proposta (depois do "Confirmar"). Devolve o texto do resultado.
  function aplicar(a) {
    const p = a.paciente ? M.pac(a.paciente) : null, d = a.dados, medico = M.medico();
    if (a.tipo === 'meta') p.metas = { ...p.metas, [d.campo]: d.valor, por: medico, cargo: '', em: agoraReal() };
    else if (a.tipo === 'recado') M.recados.unshift({ ids: d.ids, para: d.para, de: medico, texto: d.texto, quando: agoraReal(), lido: false });
    else if (a.tipo === 'visto') M.vistos[p.id] = true;
    else if (a.tipo === 'funcao') M.funcoes[d.funcao][1] = d.liga;
    else if (a.tipo === 'iaTom' || a.tipo === 'iaTema') {
      const base = configDe(p ? p.id : 0), nova = { temas: { ...base.temas }, tom: base.tom, por: medico, em: agoraReal() };
      if (a.tipo === 'iaTom') nova.tom = d.tom; else nova.temas[d.tema] = d.liga;
      if (p) config.porPaciente[p.id] = nova; else { config.todos = nova; }
    }
    registrar('central', 'acao', a.oque + ': ' + a.antes + ' → ' + a.depois + '.', { quem: medico, paciente: p ? p.nome : '', antes: a.antes, depois: a.depois, confirmado: true });
    M.mudou();
    return 'Feito. ' + a.outroLado;
  }
  // Configuração da IA do paciente pela tela da central (sem a conversa).
  function configurar(pid, nova) {
    const antes = configDe(pid || 0), quem = pid ? M.pac(pid).nome : 'todos os pacientes';
    const desc = c => TONS.find(x => x[0] === c.tom)[1] + ', ' + TEMAS.filter(([k]) => c.temas[k]).length + ' de ' + TEMAS.length + ' lembretes';
    const c = { temas: { ...nova.temas }, tom: nova.tom, por: M.medico(), em: agoraReal() };
    if (pid) config.porPaciente[pid] = c; else config.todos = c;
    registrar('central', 'config', 'IA do paciente (' + quem + '): ' + desc(antes) + ' → ' + desc(c) + '.', { quem: M.medico(), paciente: pid ? M.pac(pid).nome : '' });
    M.mudou();
  }
  function voltarParaTodos(pid) { delete config.porPaciente[pid]; registrar('central', 'config', 'IA do paciente (' + M.pac(pid).nome + '): volta a seguir a configuração de todos.', { quem: M.medico(), paciente: M.pac(pid).nome }); M.mudou(); }

  window.DEMO_IA = {
    TEMAS, TONS, FUNCOES_IA, config, configDe, pref, mensagem, planoHoje, responderPaciente, lembrete, mudarPref, rotPref, sair, noSilencio,
    responderCentral, aplicar, configurar, voltarParaTodos, registro, registrar, consumo, total, pct, gastar, mudarTeto,
    SUGESTOES_CENTRAL: ['Quem não registrou há 3 dias?', 'Como está a Mariana?', 'Quem está abaixo da meta de proteína?', 'Média de perda de peso do mês', 'Mude a meta de proteína da Mariana para 110', 'Como envio um recado?'],
    SUGESTOES_PACIENTE: ['Como registro a água?', 'O que como para bater a proteína?', 'Estou com enjoo, o que faço?']
  };
})();
