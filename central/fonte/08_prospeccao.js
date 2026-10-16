// ---------------------------------------------------------------- Marketing › Prospecção (sql/031 e sql/032; DEC-069 a DEC-082)
// Gerenciador no jeito do Meta Ads: Campanha › Conjunto › Anúncio, com interruptor em cada camada (pausar = um toque;
// ligar pede o nível do servidor). Números de WhatsApp com o QR SÓ na tela (nunca guardado no navegador nem no endereço),
// leads e conversas (o telefone só com os 4 últimos dígitos), buscas, relatórios com margem de erro, regras e custos.
// Toda trava é conferida no servidor; a página só mostra (e as travas que ela mostra vêm de "travas" do servidor).
ICONES.prospeccao = 'M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12';
ICONES.telefone = 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5M11 17.5h2';
ICONES.conversa = 'M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-4.5 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M8 9.5h8M8 12.5h5';
ICONES.mais_um = 'M12 5v14M5 12h14';

const P_ABAS = [['', 'Campanhas'], ['numeros', 'Números'], ['leads', 'Leads'], ['relatorios', 'Relatórios'], ['buscas', 'Buscas'], ['regras', 'Regras'], ['custos', 'Custos']];
const P_SIT = { rascunho: ['rascunho', ''], ativa: ['ativa', 'ok'], ativo: ['ativo', 'ok'], pausada: ['pausada', 'atencao'], pausado: ['pausado', 'atencao'], cortado: ['cortado pela regra', 'perigo'],
  encerrada: ['encerrada', ''], encerrado: ['encerrado', ''] };
const etqSit = s => { const [t, tom] = P_SIT[s] || [s || '—', '']; return etq(t, tom); };
const P_NUM = { novo: ['novo', ''], aguardando_qr: ['esperando o código', 'atencao'], conectado: ['conectado', 'ok'], desconectado: ['desconectado', 'perigo'], banido: ['provável bloqueio', 'perigo'], apagado: ['apagado', ''] };
const etqNum = s => { const [t, tom] = P_NUM[s] || [s || '—', '']; return etq(t, tom); };
const P_LEAD = { para_aprovar: ['Para aprovar', 'atencao'], na_fila: ['Na fila', 'info'], enviado: ['Enviado', ''], respondeu: ['Respondeu', 'info'], positivo: ['Positivo', 'ok'], com_voce: ['Com você', 'atencao'],
  cadastrou: ['Cadastrou', 'ok'], cliente: ['Cliente', 'ok'], recusou: ['Recusou', ''], saiu: ['Saiu (não contatar)', 'perigo'], sem_whatsapp: ['Sem WhatsApp', ''], falhou: ['Falhou', 'perigo'], descartado: ['Descartado', ''] };
const etqLead = s => { const [t, tom] = P_LEAD[s] || [s || '—', '']; return etq(t, tom); };
const P_NOME = { campanha: 'campanha', conjunto: 'conjunto', anuncio: 'anúncio' };
const pct = v => v == null ? '—' : String(v).replace('.', ',') + '%';
const irP = (...partes) => ir(['prospeccao', ...partes.filter(x => x != null && x !== '').map(x => encodeURIComponent(x))].join('/'));
const ativo = s => s === 'ativa' || s === 'ativo';
est.prosp = null; // a última tela inicial (árvore de campanhas e números), só na memória

function abasP(atual) {
  return el('div', { class: 'abas abas-p', role: 'tablist', 'aria-label': 'Partes da prospecção' }, P_ABAS.map(([k, n]) => el('button', { role: 'tab', type: 'button', 'aria-selected': String(atual === k), onclick: () => irP(k) }, n)));
}
async function arvoreP(forcar) {
  if (est.prosp && !forcar) return est.prosp;
  const r = await chamar('prosp_inicio');
  if (r.ok) est.prosp = r.dados;
  return r.ok ? est.prosp : null;
}
const nomeP = (tipo, id) => {
  const a = est.prosp; if (!a || !id) return id || '—';
  for (const c of a.campanhas || []) { if (tipo === 'campanha' && c.id === id) return c.nome; for (const j of c.conjuntos || []) { if (tipo === 'conjunto' && j.id === id) return j.nome;
    for (const n of j.anuncios || []) if (tipo === 'anuncio' && n.id === id) return n.nome; } }
  if (tipo === 'numero') { const n = (a.numeros || []).find(x => String(x.id) === String(id)); if (n) return n.instancia; }
  return id;
};
const conjuntosP = () => (est.prosp && est.prosp.campanhas || []).flatMap(c => (c.conjuntos || []).map(j => ({ ...j, campanha: c })));

// Interruptor de uma camada (ou de um número): pausar é um toque, ligar pede o nível; encerrado não tem interruptor.
function interruptorP(tipo, o) {
  if (/^encerrad/.test(o.situacao)) return etqSit(o.situacao);
  const ligado = tipo === 'numero' ? !!o.ligado : ativo(o.situacao);
  const nome = tipo === 'numero' ? o.instancia : o.nome;
  return el('button', { class: 'toggle', type: 'button', role: 'switch', 'aria-checked': String(ligado), 'aria-label': (ligado ? 'Pausar ' : 'Ligar ') + nome, onclick: async e => {
    const t = e.currentTarget; const valor = ligado ? 'NAO' : 'SIM'; t.setAttribute('aria-checked', String(!ligado));
    const r = await fazer('prosp_ligar', { tipo, id: o.id, valor }, { titulo: (valor === 'SIM' ? 'Ligar ' : 'Pausar ') + (tipo === 'numero' ? 'o número ' : 'o ' + P_NOME[tipo] + ' ') + nome,
      nome, rotuloNome: tipo === 'numero' ? 'o nome da instância' : 'o nome da ' + P_NOME[tipo], rotuloNivel: 'manda mensagens de verdade',
      linhas: [['Situação', tipo === 'numero' ? (ligado ? 'ligado' : 'pausado') : (P_SIT[o.situacao] || [o.situacao])[0], valor === 'SIM' ? (tipo === 'campanha' ? 'ativa' : tipo === 'numero' ? 'ligado' : 'ativo') : 'pausado']],
      texto: valor === 'SIM' ? (tipo === 'campanha' ? 'Os conjuntos ativos dela começam a buscar e a enviar (com as chaves ligadas e dentro das travas).' : 'Volta a valer no próximo lote.') : null,
      depois: async () => { est.prosp = null; await rotear(); } });
    if (!r) t.setAttribute('aria-checked', String(ligado));
    else if (valor === 'NAO') rapida('Pausado.', () => fazer('prosp_ligar', { tipo, id: o.id, valor: 'SIM' }, { titulo: 'Ligar de novo: ' + nome, nome, rotuloNome: 'o nome', linhas: [['Situação', 'pausado', 'ligado']], depois: async () => { est.prosp = null; await rotear(); } }));
  } });
}

// ---------------------------------------------------------------- telas
TELAS.prospeccao = async (c, [parte, a, b]) => {
  parte = parte || '';
  const telasP = { '': pInicio, campanha: pObjeto, conjunto: pObjeto, anuncio: pObjeto, numeros: pNumeros, leads: pLeads, lead: pLead, relatorios: pRelatorios, buscas: pBuscas, regras: pRegras, custos: pCustos };
  const fn = telasP[parte] || pInicio;
  if (!ligada('tela_prospeccao')) { topo('Prospecção', [['Marketing'], ['Prospecção']]); falhou(c, { desligada: true, chave: 'tela_prospeccao' }, 'Prospecção'); return; }
  await fn(c, parte, a, b);
};

// ---------- sinal de vida do 52 e do 53 (DEC-087): o banco segura o disparo sem eles (DEC-083)
const P_MOTOR = { '52': ['Respostas e IA', 'a cada 15 minutos; parado depois de 30'], '53': ['Rotinas e medição', 'todo dia às 3h40; parado depois de 48 horas'] };
function textoParado(p) { return `o workflow ${p.workflow} (${p.nome || P_MOTOR[p.workflow][0]}) ${p.desde ? 'não roda desde ' + fmtHora(p.desde) : 'ainda não rodou'}`; }
function avisoMotor(m) {
  if (!m || !m.segurado) return null;
  return el('div', { class: 'aviso perigo', role: 'alert' }, icone('alerta'),
    el('div', {}, el('b', { text: 'Disparo parado: ' }), (m.parados || []).map(textoParado).join(' e ') + '. Nada sai até ele voltar a rodar.'));
}
function cartaoMotor(m) {
  if (!m) return null;
  const parado = w => (m.parados || []).some(p => p.workflow === w);
  const linha = (w, em) => el('li', {}, el('div', { class: 'linha' }, el('span', { class: 'icone-caixa' }, icone('relogio')),
    el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${w} · ${P_MOTOR[w][0]}` }),
      el('div', { class: 't2', text: (em ? 'rodou pela última vez ' + fmtHora(em) : 'ainda não rodou') + ' · ' + P_MOTOR[w][1] })),
    el('div', { class: 'direita' }, etq(parado(w) ? 'parado' : 'rodando', parado(w) ? (m.disparo_ligado ? 'perigo' : 'atencao') : 'ok'))));
  const aviso = avisoMotor(m);
  return cartao('Sinal de vida', etq(m.segurado ? 'disparo parado' : m.disparo_ligado ? 'disparo saindo' : 'disparo desligado', m.segurado ? 'perigo' : m.disparo_ligado ? 'ok' : '', true),
    aviso ? corpo(aviso) : null, el('ul', { class: 'lista' }, linha('52', m.sinal_52), linha('53', m.sinal_53)));
}

async function pInicio(c) {
  topo('Prospecção', [['Marketing'], ['Prospecção']]);
  const r = await chamar('prosp_inicio'); if (falhou(c, r, 'Prospecção')) return;
  est.prosp = r.dados;
  const d = r.dados, res = d.resultados || {}, ch = d.chaves || {}, editar = ligada('editar_prospeccao');
  const soma = k => (res.ultimos_7_dias || []).reduce((s, x) => s + (Number((x.numeros || {})[k]) || 0), 0);
  const att = [];
  if (res.para_aprovar) att.push(['atencao', `${fmtNum(res.para_aprovar)} lead(s) para aprovar`, 'Antes de entrar na fila', () => ir('prospeccao/leads/para_aprovar')]);
  if (res.com_voce) att.push(['atencao', `${fmtNum(res.com_voce)} conversa(s) com você`, 'A IA parou: responda pelo celular do número', () => ir('prospeccao/leads/com_voce')]);
  const motor = res.motor || null;
  if (motor && motor.segurado) att.push(['critico', 'Disparo parado', (motor.parados || []).map(textoParado).join(' e ').replace(/^o/, 'O'), null]);
  if (res.avisos_na_fila) att.push(['info', `${fmtNum(res.avisos_na_fila)} aviso(s) esperando o Telegram`, 'O workflow 54 manda a cada 5 minutos', null]);
  for (const n of (d.numeros || []).filter(n => ['desconectado', 'banido'].includes(n.situacao))) att.push(['critico', `Número ${n.instancia} ${(P_NUM[n.situacao] || [n.situacao])[0]}`, 'Os conjuntos dele pausaram sozinhos', () => irP('numeros')]);
  const disparo = ch.prosp_disparo === 'SIM' && motor && motor.segurado ? ['disparo parado', 'perigo'] : ch.prosp_disparo === 'SIM' ? ['disparo ligado', 'ok'] : ch.prosp_politica_v10 === 'SIM' && ch.prosp_balanceamento === 'SIM' ? ['disparo desligado', ''] : ['disparo travado (Política v10 e balanceamento)', 'atencao'];
  const campanhas = d.campanhas || [];
  // Uma camada: a linha (abre a camada) e, ao lado, o interruptor.
  const camada = (tipo, o, t2, ic, extra) => el('div', { class: 'p-camada' + (extra ? ' ' + extra : '') },
    el('button', { class: 'linha', type: 'button', onclick: () => irP(tipo, o.id) }, ic ? el('span', { class: 'icone-caixa' }, icone(ic)) : null,
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: o.nome }), el('div', { class: 't2', text: t2 })), el('div', { class: 'direita' }, etqSit(o.situacao))),
    editar ? el('div', { class: 'p-chave' }, interruptorP(tipo, o)) : null);
  const novoBtn = (texto, tipo, pai) => el('li', {}, el('div', { class: 'p-novo' }, btn(texto, () => irP(tipo, 'novo', pai), 'fant', 'mais_um')));
  const anuncios = j => el('ul', { class: 'lista p-filhos p-anuncios' },
    (j.anuncios || []).map(n => el('li', {}, camada('anuncio', n, `${n.id} · versão ${n.versao}${n.pausa_motivo ? ' · ' + n.pausa_motivo : ''}`))),
    editar && !/^encerrad/.test(j.situacao) ? novoBtn('Novo anúncio', 'anuncio', j.id) : null);
  const conjuntos = cp => el('ul', { class: 'lista p-filhos' },
    (cp.conjuntos || []).map(j => el('li', {}, camada('conjunto', j, `${j.id} · ${j.numero ? j.numero.instancia : 'sem número'}${j.pausa_motivo ? ' · ' + j.pausa_motivo : ''}`), anuncios(j))),
    editar && !/^encerrad/.test(cp.situacao) ? novoBtn('Novo conjunto', 'conjunto', cp.id) : null);
  const arvore = campanhas.length
    ? campanhas.map(cp => cartao(null, null, camada('campanha', cp, `${cp.id} · versão ${cp.versao} · ${fmtNum((cp.conjuntos || []).length)} conjunto(s)`, 'prospeccao', 'p-campanha'), conjuntos(cp)))
    : [cartao(null, null, vazio('Nenhuma campanha ainda. Crie a primeira: campanha (marca, produto e IA) › conjunto (busca, número, entrega) › anúncios (as mensagens, sorteadas entre os leads).', 'prospeccao'))];
  trocar(c, cabecalho('Prospecção', 'campanha › conjunto › anúncio', editar ? btn('Nova campanha', () => irP('campanha', 'novo'), 'pri', 'mais_um') : null),
    el('div', { class: 'pilha' }, abasP(''),
      el('div', { class: 'etqs' }, etq(disparo[0], disparo[1]), etq(ch.prosp_busca === 'SIM' ? 'busca ligada' : 'busca desligada', ch.prosp_busca === 'SIM' ? 'ok' : ''),
        etq(ch.prosp_ia === 'SIM' ? 'IA ligada' : 'IA desligada', ch.prosp_ia === 'SIM' ? 'ok' : ''), etq(fmtNum(d.nao_contatar) + ' no "não contatar"', '', true)),
      el('div', { class: 'kpis' }, kpi('Abordagens (7 dias)', fmtNum(soma('enviados'))), kpi('Responderam', fmtNum(soma('responderam'))), kpi('Positivas', fmtNum(soma('positivas'))), kpi('Cadastros', fmtNum(soma('cadastros')))),
      att.length ? cartao('Precisa da sua atenção', null, el('ul', { class: 'lista' }, att.map(([prior, t, s, fn]) => el('li', {}, el(fn ? 'button' : 'div', { class: 'linha', type: fn ? 'button' : null, onclick: fn || null },
        el('span', { class: 'prior ' + prior, 'aria-hidden': 'true' }), el('div', { class: 'cresce' }, el('div', { class: 't1', text: t }), el('div', { class: 't2', text: s })), fn ? icone('seta') : null))))) : null,
      cartaoMotor(motor),
      editar ? null : nota('Criar, editar, ligar e pausar estão desligados (editar_prospeccao).', true),
      ...arvore));
}

// ---------- editor de uma camada (campanha, conjunto ou anúncio)
// Campos: [caminho na configuração, rótulo, tipo, extra]. Tipos: texto, longo, num, lista (um por linha), sel, simnao, data, dias, janelas.
const SIMNAO = [['true', 'Sim'], ['false', 'Não']];
const DIAS_SEM = [['seg', 'seg'], ['ter', 'ter'], ['qua', 'qua'], ['qui', 'qui'], ['sex', 'sex']];
const FUSOS = ['America/Sao_Paulo', 'America/Manaus', 'America/Cuiaba', 'America/Campo_Grande', 'America/Porto_Velho', 'America/Boa_Vista', 'America/Rio_Branco', 'America/Belem',
  'America/Fortaleza', 'America/Recife', 'America/Bahia', 'America/Maceio', 'America/Araguaina', 'America/Noronha'].map(f => [f, f.replace('America/', '').replace('_', ' ')]);
const ESQUEMA = {
  campanha: [
    ['Marca e produto', [['marca', 'Marca (vai na mensagem)', 'texto', { ajuda: 'até 40 letras; use {marca} no anúncio' }], ['produto', 'O que a IA conta sobre o produto', 'longo', { ajuda: '20 a 1.500 letras' }],
      ['objetivo', 'Objetivo (decide o vencedor)', 'sel', { op: [['resposta', 'Resposta'], ['positiva', 'Resposta positiva'], ['cadastro', 'Cadastro'], ['pagamento', 'Pagamento']] }],
      ['link_agenda', 'Link da sua agenda (opcional)', 'texto', { ajuda: 'começa com https://' }]]],
    ['Orçamento e datas', [['orcamento_msgs_dia', 'Mensagens por dia (campanha)', 'num', { ajuda: 'o teto de cada número vale por cima' }], ['limite_total', 'Limite total de mensagens', 'num', { ajuda: '0 = sem limite' }],
      ['creditos_mes', 'Créditos do SerpAPI no mês', 'num'], ['inicio', 'Começa em', 'data'], ['fim', 'Termina em', 'data'], ['atribuicao_dias', 'Janela de atribuição (dias)', 'num', { ajuda: 'cadastro conta até N dias depois da 1ª mensagem' }]]],
    ['IA de resposta', [['ia.ligada', 'IA ligada nesta campanha', 'simnao'], ['ia.tom', 'Tom', 'texto'], ['ia.objetivo_texto', 'Objetivo da conversa', 'texto'], ['ia.objecoes', 'Como responder às objeções', 'lista'],
      ['ia.passar_para_voce', 'Quando passar para você', 'texto'], ['ia.nunca_dizer', 'Nunca dizer (os fixos ficam)', 'lista'], ['ia.regras_escrita', 'Regras de escrita', 'lista'],
      ['ia.tamanho_max', 'Tamanho máximo da resposta (letras)', 'num', { trava: 'resposta_max' }], ['ia.max_mensagens', 'Mensagens da IA antes de passar para você', 'num', { trava: 'ia_mensagens_max' }],
      ['ia.hora_inicio', 'IA responde a partir de (hora)', 'num', { trava: 'ia_hora_inicio_min', min: true }], ['ia.hora_fim', 'IA responde até (hora)', 'num', { trava: 'ia_hora_fim_max' }],
      ['ia.palavras_saida', 'Palavras de saída a mais (as 6 fixas ficam)', 'lista']]],
    ['Avisos no Telegram (só códigos)', [['ia.avisar.fechou', 'Quer contratar', 'simnao'], ['ia.avisar.interessado', 'Mostrou interesse', 'simnao'], ['ia.avisar.pediu_voce', 'Pediu você', 'simnao'],
      ['ia.avisar.recusou', 'Recusou', 'simnao'], ['ia.avisar.saiu', 'Pediu para sair', 'simnao']]]],
  conjunto: [
    ['Busca no Google Maps', [['busca.termos', 'Termos (um por linha)', 'lista', { ajuda: 'ex.: dentista' }], ['busca.lugares', 'Cidades ou bairros (um por linha)', 'lista'], ['busca.coordenadas', 'Coordenadas (opcional)', 'texto', { ajuda: '-25.43,-49.27' }],
      ['busca.zoom', 'Zoom (10 cidade a 18 quarteirão)', 'num'], ['busca.paginas', 'Páginas por busca', 'num', { trava: 'paginas_max' }], ['busca.creditos_busca', 'Créditos por busca', 'num'],
      ['busca.repetir.tipo', 'Repetir', 'sel', { op: [['uma_vez', 'Uma vez'], ['semanal', 'Toda semana']] }], ['busca.repetir.dia_semana', 'Dia da semana', 'sel', { op: DIAS_SEM }], ['busca.repetir.hora', 'A partir das (hora)', 'num'],
      ['busca.nao_repetir_dias', 'Não repetir o mesmo termo e lugar (dias)', 'num']]],
    ['Filtros', [['busca.nota_min', 'Nota mínima', 'num'], ['busca.nota_max', 'Nota máxima', 'num'], ['busca.sem_nota', 'Sem nota', 'sel', { op: [['descartar', 'Descartar'], ['aceitar', 'Aceitar']] }],
      ['busca.avaliacoes_min', 'Avaliações mínimas', 'num'], ['busca.categorias_aceitas', 'Só estas categorias (vazio = todas)', 'lista'], ['busca.categorias_excluidas', 'Nunca estas categorias', 'lista'],
      ['busca.palavras_excluem', 'Palavras que excluem', 'lista'], ['busca.tem_site', 'Tem site', 'sel', { op: [['tanto_faz', 'Tanto faz'], ['sim', 'Sim'], ['nao', 'Não']] }],
      ['busca.so_celular', 'Só celular', 'simnao'], ['busca.aceitar_wame', 'Aceitar o link wa.me do Maps', 'simnao'], ['busca.so_aberto', 'Só negócio aberto', 'simnao']]],
    ['Qualificação', [['qualificacao.pesos.nota', 'Peso da nota', 'num'], ['qualificacao.pesos.avaliacoes', 'Peso das avaliações', 'num'], ['qualificacao.pesos.categoria', 'Peso da categoria', 'num'],
      ['qualificacao.pesos.site', 'Peso do site', 'num'], ['qualificacao.pesos.origem', 'Peso da origem do telefone', 'num'], ['qualificacao.pontos_min', 'Pontuação mínima (0 a 100)', 'num'],
      ['qualificacao.revisao_manual', 'Aprovar cada lead antes da fila', 'simnao'], ['qualificacao.revisar_numero', 'Número antigo (sem o 9)', 'sel', { op: [['whatsapp', 'Conferir no WhatsApp'], ['manual', 'Eu aprovo'], ['descartar', 'Descartar']] }]]],
    ['Exclusões', [['exclusoes.outra_campanha_dias', 'Abordado por outra campanha há menos de (dias)', 'num', { trava: 'outra_campanha_dias_min', min: true }], ['exclusoes.redes_palavras', 'Palavras de rede', 'lista'],
      ['exclusoes.rede_min_enderecos', 'Mesmo nome em N endereços = rede', 'num'], ['exclusoes.concorrentes', 'Concorrentes (nome ou site)', 'lista']]],
    ['Entrega', [['entrega.dias', 'Dias', 'dias'], ['entrega.janelas', 'Janelas', 'janelas', { ajuda: 'ex.: 09:00-11:30, 14:00-17:30 (dentro de 8h–18h)' }], ['entrega.fuso', 'Fuso', 'sel', { op: FUSOS }],
      ['entrega.teto_dia', 'Teto do conjunto por dia', 'num', { trava: 'teto_numero_dia' }], ['entrega.lote', 'Mensagens por lote', 'num', { trava: 'lote_max' }],
      ['entrega.pausa_min_s', 'Pausa mínima entre lotes (s)', 'num', { trava: 'pausa_min_s', min: true }], ['entrega.pausa_max_s', 'Pausa máxima entre lotes (s)', 'num'],
      ['entrega.ordem', 'Ordem', 'sel', { op: [['pontuacao', 'Maior pontuação primeiro'], ['sorteio', 'Sorteio']] }], ['entrega.tentativas', 'Tentativas se falhar', 'num', { trava: 'tentativas_max' }],
      ['entrega.intervalo_tentativa_dias', 'Tentar de novo depois de (dias úteis)', 'num']]],
    ['Frequência e aprendizado', [['frequencia.max_mensagens', 'Mensagens por lead (abordagem + follow-ups)', 'num', { trava: 'frequencia_max' }],
      ['frequencia.intervalo_dias_uteis', 'Dias úteis entre mensagens ao mesmo lead', 'num', { trava: 'intervalo_lead_dias_uteis', min: true }], ['aprendizado_min', 'Fase de aprendizado (envios por anúncio)', 'num']]]],
  anuncio: [
    ['Mensagem', [['abordagem', 'Primeira mensagem', 'longo', { ajuda: 'campos: {nome} {cidade} {bairro} {nicho} {marca}; diga "assistente virtual", a marca e de onde veio o contato (Google Maps)', previa: true }],
      ['tamanho_max', 'Tamanho máximo com o texto de saída', 'num', { trava: 'mensagem_max' }], ['texto_saida', 'Texto de saída (precisa ter SAIR)', 'texto'],
      ['texto_confirmacao', 'Confirmação quando pedem para sair', 'longo'], ['palavras_proibidas', 'Palavras proibidas a mais', 'lista']]],
    ['Follow-ups (no máximo 2)', [['followups.0.dias_uteis', '1º follow-up: depois de (dias úteis)', 'num'], ['followups.0.texto', '1º follow-up: texto', 'longo'],
      ['followups.1.dias_uteis', '2º follow-up: depois de (dias úteis)', 'num'], ['followups.1.texto', '2º follow-up: texto', 'longo']]],
    ['IA (opcional)', [['prompt_proprio', 'Prompt próprio deste anúncio (vazio = o da campanha)', 'longo', { ajuda: '50 a 8.000 letras; as regras fixas (assistente virtual, preços, SAIR) entram sempre' }]]]]
};
const pegar = (o, cam) => cam.split('.').reduce((x, k) => x == null ? undefined : x[k], o);
function colocar(o, cam, v) { const ks = cam.split('.'); let x = o; ks.slice(0, -1).forEach((k, i) => { if (x[k] == null) x[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; x = x[k]; }); x[ks[ks.length - 1]] = v; }
const paraTexto = (tipo, v) => v == null ? '' : tipo === 'lista' ? (Array.isArray(v) ? v.join('\n') : String(v)) : tipo === 'janelas' ? (Array.isArray(v) ? v.map(j => (j || []).join('-')).join(', ') : '')
  : tipo === 'simnao' ? String(v === true || v === 'true') : String(v);
function deTexto(tipo, t) {
  if (tipo === 'num') { const n = Number(String(t).replace(',', '.')); return t === '' || isNaN(n) ? t : n; }
  if (tipo === 'lista') return String(t).split('\n').map(x => x.trim()).filter(Boolean);
  if (tipo === 'janelas') return String(t).split(',').map(x => x.trim()).filter(Boolean).map(x => x.split(/\s*[-–]\s*/));
  if (tipo === 'simnao') return t === 'true';
  return t;
}
// Prévia do anúncio: a mensagem como o lead vai ver, com um negócio de exemplo, e o que a revisão automática confere.
function previaAnuncio(insAbord, insSaida, insTam, marca) {
  const caixa = el('div', { class: 'p-previa', 'aria-live': 'polite' });
  const desenhar = () => {
    const t = String(insAbord.value || '').replace(/\{nome\}/g, 'Clínica Exemplo').replace(/\{cidade\}/g, 'Curitiba').replace(/\{bairro\}/g, 'Batel').replace(/\{nicho\}/g, 'dentista').replace(/\{marca\}/g, marca || 'RXSync');
    const total = t.trim().length + 2 + String(insSaida.value || '').trim().length, max = Number(insTam.value) || 400, baixo = semAcento(insAbord.value);
    const itens = [['Diz que é a assistente virtual', /assistente virtual/.test(baixo)], ['Diz de onde veio o contato (Google Maps)', /google|maps/.test(baixo)],
      ['Tem a marca', /\{marca\}/.test(insAbord.value) || (marca && baixo.includes(semAcento(marca)))], ['O texto de saída tem SAIR', /\bSAIR\b/.test(insSaida.value || '')], [`Tamanho: ${total} de ${max} letras`, total <= max]];
    trocar(caixa, el('div', { class: 'p-bolha saiu' }, el('p', { text: t || '(a mensagem aparece aqui)' }), el('p', { class: 'mudo', text: insSaida.value || '' })),
      el('ul', { class: 'p-confere' }, itens.map(([txt, bom]) => el('li', { class: bom ? 'ok' : 'falta' }, icone(bom ? 'ok' : 'alerta', 'p'), el('span', { text: (bom ? '' : 'Falta: ') + txt })))));
  };
  [insAbord, insSaida, insTam].forEach(i => i.addEventListener('input', desenhar)); desenhar();
  return caixa;
}
async function pObjeto(c, tipo, id, pai) {
  const novo = !id || id === 'novo';
  const r = await chamar('prosp_objeto', { tipo, id: novo ? '' : id });
  const titulo = novo ? 'Nov' + (tipo === 'campanha' ? 'a campanha' : 'o ' + P_NOME[tipo]) : (r.ok && r.dados.objeto ? r.dados.objeto.nome : P_NOME[tipo]);
  topo(titulo, [['Prospecção', 'prospeccao'], [titulo]], 'prospeccao');
  if (falhou(c, r, titulo)) return;
  await arvoreP();
  const d = r.dados, o = d.objeto, cfg = d.config || {}, t = d.travas || {}, editar = ligada('editar_prospeccao') && !(o && /^encerrad/.test(o.situacao));
  const paiId = o ? o.pai : pai;
  // A marca da campanha entra na prévia do anúncio (a revisão automática do servidor confere de novo).
  let marca = '';
  if (tipo === 'anuncio') { const j = conjuntosP().find(x => x.id === paiId); if (j) { const rc = await chamar('prosp_objeto', { tipo: 'campanha', id: j.campanha.id }); marca = rc.ok && rc.dados.config ? rc.dados.config.marca || '' : ''; } }
  const ins = {}; const erro = el('div', { class: 'erro', role: 'alert' });
  const nomeIn = el('input', { class: 'entrada', id: 'p-nome', autocomplete: 'off', value: o ? o.nome : null, maxlength: '80' });
  const numeroSel = tipo === 'conjunto' ? el('select', { class: 'entrada', id: 'p-numero' }, el('option', { value: '', text: '(nenhum ainda)' }),
    ((est.prosp && est.prosp.numeros) || []).map(n => el('option', { value: String(n.id), text: `${n.instancia} · ${n.nome} (${(P_NUM[n.situacao] || [n.situacao])[0]})`, selected: o && String(o.numero_id) === String(n.id) }))) : null;
  const campo = ([cam, rot, tp, ex]) => {
    ex = ex || {}; const idc = 'p-' + cam.replace(/\./g, '-'); const v = paraTexto(tp, pegar(cfg, cam)); let i;
    if (tp === 'sel' || tp === 'simnao') i = el('select', { class: 'entrada', id: idc, disabled: !editar }, (tp === 'simnao' ? SIMNAO : ex.op).map(([val, txt]) => el('option', { value: val, text: txt, selected: v === val })));
    else if (tp === 'longo' || tp === 'lista') i = el('textarea', { class: 'entrada', id: idc, rows: tp === 'lista' ? '3' : '4', autocomplete: 'off', value: v, disabled: !editar });
    else if (tp === 'dias') {
      const marcados = new Set(pegar(cfg, cam) || []);
      i = el('div', { class: 'filtros p-dias', role: 'group', 'aria-label': rot, id: idc }, DIAS_SEM.map(([val, txt]) => el('button', { type: 'button', 'aria-pressed': String(marcados.has(val)), disabled: !editar,
        onclick: e => e.currentTarget.setAttribute('aria-pressed', String(e.currentTarget.getAttribute('aria-pressed') !== 'true')) }, txt)));
      i.lerValor = () => [...i.querySelectorAll('button')].filter(b => b.getAttribute('aria-pressed') === 'true').map((b, k) => b.textContent);
    } else i = el('input', { class: 'entrada', id: idc, type: tp === 'data' ? 'date' : 'text', inputmode: tp === 'num' ? 'decimal' : null, autocomplete: 'off', spellcheck: 'false', value: v || null, disabled: !editar });
    ins[cam] = { i, tp, rot };
    const trava = ex.trava && t[ex.trava] != null ? (ex.min ? 'mínimo ' : 'até ') + t[ex.trava] + ' (trava)' : '';
    const ajuda = [ex.ajuda, trava].filter(Boolean).join(' · ');
    return el('label', { class: 'campo' + (tp === 'longo' || tp === 'lista' ? ' largo' : ''), for: tp === 'dias' ? null : idc }, el('span', { class: 'rot', text: rot }), i, ajuda ? el('span', { class: 'ajuda', text: ajuda }) : null);
  };
  const blocos = ESQUEMA[tipo].map(([nomeBloco, campos], k) => el('details', { class: 'grupo', open: k === 0 || null }, el('summary', { text: nomeBloco }),
    el('div', { class: 'corpo-grupo' }, el('div', { class: 'form-2' }, campos.map(campo)))));
  const prev = tipo === 'anuncio' ? previaAnuncio(ins.abordagem.i, ins.texto_saida.i, ins.tamanho_max.i, marca) : null;
  if (prev) blocos[0].querySelector('.corpo-grupo').append(el('h3', { text: 'Como o lead vai ver' }), prev);
  const ler = () => {
    const nova = JSON.parse(JSON.stringify(cfg)), linhas = [];
    for (const [cam, { i, tp, rot }] of Object.entries(ins)) {
      const val = tp === 'dias' ? i.lerValor() : deTexto(tp, i.value.trim ? i.value.trim() : i.value);
      const antes = pegar(cfg, cam);
      if (JSON.stringify(val) !== JSON.stringify(antes == null ? (tp === 'lista' || tp === 'dias' ? [] : '') : antes)) { colocar(nova, cam, val); linhas.push([rot, paraTexto(tp, antes), paraTexto(tp, val)]); }
    }
    // Follow-up vazio sai da lista (o servidor recusa follow-up sem texto).
    if (Array.isArray(nova.followups)) nova.followups = nova.followups.filter(f => f && String(f.texto || '').trim());
    return { nova, linhas };
  };
  const salvar = async e => {
    e.preventDefault(); erro.textContent = '';
    const nome = nomeIn.value.trim(); if (nome.length < 3) { erro.textContent = 'Nome: de 3 a 80 letras.'; nomeIn.focus(); return; }
    const { nova, linhas } = ler();
    if (o && nome !== o.nome) linhas.unshift(['Nome', o.nome, nome]);
    const trocaNumero = tipo === 'conjunto' && o && o.numero_id != null && String(o.numero_id) !== numeroSel.value;
    if (tipo === 'conjunto' && o && String(o.numero_id == null ? '' : o.numero_id) !== numeroSel.value) linhas.push(['Número de WhatsApp', nomeP('numero', o.numero_id), numeroSel.value ? nomeP('numero', numeroSel.value) : '(nenhum)']);
    if (o && !linhas.length) { rapida('Nada mudou.'); return; }
    const dados = { id: o ? o.id : '', nome, config: nova, ...(tipo === 'conjunto' ? { numero_id: numeroSel.value } : {}), ...(o ? {} : tipo === 'conjunto' ? { campanha_id: paiId } : tipo === 'anuncio' ? { conjunto_id: paiId } : {}) };
    const nivel = trocaNumero ? 3 : o && ativo(o.situacao) ? 2 : 1;
    const acao = { campanha: 'prosp_campanha_salvar', conjunto: 'prosp_conjunto_salvar', anuncio: 'prosp_anuncio_salvar' }[tipo];
    const op = { titulo: 'Salvar ' + (o ? o.nome : nome), nivel, linhas, nome: o ? o.nome : nome, rotuloNome: 'o nome do conjunto', rotuloNivel: 'troca o número que envia',
      texto: nivel >= 2 ? 'Vira a versão nova: os próximos envios usam a configuração nova (os leads já sorteados continuam presos à versão deles).' : null,
      erro: x => { erro.textContent = x.mensagem || 'Não consegui salvar.'; },
      depois: x => { est.prosp = null; if (!o) irP(tipo, x.id); else rotear(); } };
    if (acao === 'prosp_campanha_salvar') await fazer('prosp_campanha_salvar', dados, op);
    else if (acao === 'prosp_conjunto_salvar') await fazer('prosp_conjunto_salvar', dados, op);
    else await fazer('prosp_anuncio_salvar', dados, op);
  };
  const versoes = (d.versoes || []);
  const acoesObj = o && editar ? el('div', { class: 'acoes' },
    btn('Duplicar', () => fazer('prosp_duplicar', { tipo, id: o.id }, { ok: 'Cópia criada em rascunho.', depois: x => { est.prosp = null; irP(tipo, x.id); } }), 'sec'),
    o.situacao === 'rascunho' ? btn('Apagar o rascunho', () => fazer('prosp_apagar_rascunho', { tipo, id: o.id }, { titulo: 'Apagar o rascunho ' + o.nome, linhas: [['Rascunho', o.nome, '(apagado)']], botao: 'Apagar', perigo: true, ok: 'Rascunho apagado.', depois: () => { est.prosp = null; ir('prospeccao'); } }), 'perigo-sec') : null,
    btn('Encerrar', () => fazer('prosp_encerrar', { tipo, id: o.id }, { titulo: 'Encerrar ' + o.nome, nome: o.nome, rotuloNome: 'o nome da ' + P_NOME[tipo], rotuloNivel: 'não volta', botao: 'Encerrar',
      texto: tipo === 'campanha' ? 'Encerra a campanha com os conjuntos e anúncios dela. Não volta: para usar de novo, duplique.' : 'Não volta: para usar de novo, duplique.', ok: 'Encerrado.', depois: () => { est.prosp = null; ir('prospeccao'); } }), 'perigo-sec')) : null;
  trocar(c, cabecalho(titulo, (P_NOME[tipo] || tipo) + (o ? ` · ${o.id} · versão ${o.versao}` : ' nova'), o ? etqSit(o.situacao) : null),
    el('div', { class: 'pilha' },
      o && o.pausa_motivo ? el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', { text: 'Pausado sozinho: ' + o.pausa_motivo })) : null,
      editar ? null : nota(o && /^encerrad/.test(o.situacao) ? 'Encerrado: só leitura. Para usar de novo, duplique.' : 'Editar está desligado (editar_prospeccao).', !o || !/^encerrad/.test(o.situacao)),
      el('form', { class: 'cartao', onsubmit: salvar, novalidate: true }, el('div', { class: 'corpo p-topo-form' },
        el('div', { class: 'form-2' }, el('label', { class: 'campo', for: 'p-nome' }, el('span', { class: 'rot', text: 'Nome' }), nomeIn),
          numeroSel ? el('label', { class: 'campo', for: 'p-numero' }, el('span', { class: 'rot', text: 'Número de WhatsApp que envia' }), numeroSel, el('span', { class: 'ajuda', text: 'trocar o número de um conjunto = nível 3' })) : null)),
        ...blocos, el('div', { class: 'corpo' }, erro, editar ? el('div', { class: 'acoes' }, el('button', { class: 'btn pri', type: 'submit', text: o ? 'Salvar a versão nova' : 'Criar' })) : null)),
      acoesObj ? cartao('Mais', null, corpo(acoesObj)) : null,
      versoes.length ? cartao('Versões', el('span', { class: 'mudo peq', text: 'cada salvar cria uma versão (nunca editada)' }), el('ul', { class: 'lista' }, versoes.map(v => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => verVersao(tipo, o.id, v.versao) },
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: 'Versão ' + v.versao }), el('div', { class: 't2', text: `${fmtHora(v.criada_em)}${v.criada_por ? ' · ' + v.criada_por : ''}${v.motivo ? ' · ' + v.motivo : ''}` })), icone('seta')))))) : null));
}
async function verVersao(tipo, id, versao) {
  const r = await chamar('prosp_historico', { tipo, id, versao });
  if (!r.ok) { rapida(r.mensagem || 'Não consegui.'); return; }
  const m = r.dados.mudancas || [];
  const txt = v => v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  const fechar = janela(el('div', { class: 'janela', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-versao' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-versao', text: 'Versão ' + versao + ': o que mudou' })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    el('div', { class: 'corpo' }, m.length ? el('table', { class: 'ad' }, el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: 'Campo' }), el('th', { scope: 'col', text: 'Antes' }), el('th', { scope: 'col', text: 'Depois' }))),
      el('tbody', {}, m.map(([k, a, dpois]) => el('tr', {}, el('th', { scope: 'row', text: k }), el('td', { text: txt(a) || '(vazio)' }), el('td', { class: 'depois', text: txt(dpois) || '(vazio)' }))))) : vazio('Primeira versão (nada antes).', 'info')),
    el('div', { class: 'pe' }, btn('Fechar', () => fechar(), 'sec'))));
}

// ---------- Números de WhatsApp (o QR só na tela)
async function pNumeros(c) {
  topo('Números de WhatsApp', [['Prospecção', 'prospeccao'], ['Números']], 'prospeccao');
  const r = await chamar('prosp_numeros'); if (falhou(c, r, 'Números de WhatsApp')) return;
  const nums = r.dados.numeros || [], t = r.dados.travas || {}, editar = ligada('editar_numeros_prospeccao');
  const criar = () => fazer('prosp_numero_criar', {}, { titulo: 'Novo número de prospecção', texto: 'Cria a instância "prospec-…" na Evolution (a mesma das clínicas, DEC-071) e mostra o código para ler no celular do chip novo.',
    campos: [{ k: 'nome', rot: 'Nome (ex.: Prospecção 1)', obrig: true, minimo: 3, erro: 'Nome: de 3 a 40 letras.' }], ok: 'Número criado.',
    silencioso: true, depois: async x => { await rotear(); if (x.qr) mostrarQR(x.numero || {}, x.qr); else rapida('Criado. Toque em "Mostrar o código" para conectar.'); } });
  const linha = n => {
    const acoes = [];
    if (editar && n.situacao !== 'apagado') {
      if (['novo', 'aguardando_qr', 'desconectado'].includes(n.situacao)) acoes.push(btn('Mostrar o código', () => pedirQR(n), 'pri'));
      acoes.push(btn('Situação agora', () => fazer('prosp_numero_situacao', { id: n.id }, { ok: 'Perguntei à Evolution.', depois: async x => { await rotear(); rapida('Situação: ' + ((P_NUM[x.situacao] || [x.situacao || 'sem resposta'])[0])); } }), 'sec'));
      acoes.push(btn('Teto', () => fazer('prosp_numero_teto', { id: n.id }, { titulo: 'Teto do número ' + n.instancia, ok: 'Teto mudado.', texto: 'Vazio = só o aquecimento (10, 20, 30 e 40 por dia nas 4 primeiras semanas).',
        campos: [{ k: 'teto', rot: 'Mensagens por dia (1 a ' + (t.teto_numero_dia || 40) + ')', inputmode: 'numeric', valor: n.teto_dia == null ? '' : String(n.teto_dia) }] }), 'sec'));
      if (n.situacao === 'conectado') acoes.push(btn('Desconectar', () => fazer('prosp_numero_desconectar', { id: n.id }, { titulo: 'Desconectar ' + n.instancia, linhas: [['Situação', 'conectado', 'desconectado']], perigo: true, botao: 'Desconectar', ok: 'Desconectado.',
        texto: 'Os conjuntos que usam este número pausam. Para voltar, leia o código de novo.' }), 'perigo-sec'));
      if (n.situacao !== 'novo') acoes.push(btn('Webhook de novo', () => fazer('prosp_numero_webhook', { id: n.id }, { titulo: 'Configurar o webhook de ' + n.instancia, texto: 'Gera um segredo novo e aponta os eventos para o workflow 52.', ok: 'Webhook configurado.' }), 'sec'));
      acoes.push(btn('Apagar', () => fazer('prosp_numero_apagar', { id: n.id }, { titulo: 'Apagar ' + n.instancia, nome: n.instancia, rotuloNome: 'o nome da instância', rotuloNivel: 'não volta', botao: 'Apagar o número', ok: 'Apagado.',
        texto: 'Apaga a instância na Evolution. Os conjuntos que usam este número ficam pausados. Não volta.', linhas: [['Instância', n.instancia, '(apagada)']] }), 'perigo-sec'));
    }
    return cartao(null, null, el('div', { class: 'linha' }, el('span', { class: 'icone-caixa' }, icone('telefone')),
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${n.instancia} · ${n.nome}` }),
        el('div', { class: 't2', text: `teto hoje ${fmtNum(n.teto_hoje)}${n.teto_dia ? ' (próprio ' + n.teto_dia + ')' : ''} · aquecimento desde ${n.aquecimento_inicio ? fmtData(n.aquecimento_inicio) : '—'} · conferido ${fmtHora(n.verificado_em)}` }),
        el('div', { class: 't2', text: `token da instância: ${n.token_aceito === true ? 'aceito' : n.token_aceito === false ? 'RECUSADO (decida a alternativa, DEC-071)' : 'ainda não testado'}` + ((n.conjuntos || []).length ? ' · conjuntos: ' + n.conjuntos.map(j => j.nome).join(', ') : '') })),
      el('div', { class: 'direita' }, etqNum(n.situacao), editar && n.situacao === 'conectado' ? interruptorP('numero', n) : null)),
      acoes.length ? el('div', { class: 'corpo acoes' }, acoes) : null);
  };
  trocar(c, cabecalho('Números de WhatsApp', 'só instâncias "prospec-…" (as das clínicas nunca aparecem aqui)', editar && nums.filter(n => n.situacao !== 'apagado').length < 5 ? btn('Novo número', criar, 'pri', 'mais_um') : null),
    el('div', { class: 'pilha' }, abasP('numeros'),
      el('div', { class: 'aviso info' }, icone('info'), el('div', {}, el('b', { text: 'Aquecimento: ' }), `${(t.aquecimento || [10, 20, 30, 40]).join(', ')} mensagens por dia nas 4 primeiras semanas; no máximo ${t.teto_numero_hora || 10} por hora. Um número começa pausado: ligue quando quiser.`)),
      editar ? null : nota('Conectar, desconectar e apagar estão desligados (editar_numeros_prospeccao).', true),
      ...(nums.length ? nums.map(linha) : [cartao(null, null, vazio('Nenhum número de prospecção ainda. Use um chip só para isso.', 'telefone'))])));
}
// Pede o código (nível 2) e mostra na janela. Enquanto ela está aberta, pergunta a situação a cada 10 segundos (até 2 minutos).
function pedirQR(n) {
  return fazer('prosp_numero_qr', { id: n.id }, { titulo: 'Conectar ' + n.instancia, texto: 'Mostra o código para ler no celular do chip: WhatsApp › Aparelhos conectados › Conectar um aparelho.', botao: 'Mostrar o código', silencioso: true,
    depois: x => { if (x.qr) mostrarQR(x.numero || n, x.qr); else rapida('A Evolution não devolveu o código. Tente de novo em instantes.'); } });
}
// O QR existe só nesta janela: não vai para o armazenamento do navegador, o endereço ou o registro, e some ao fechar ou
// quando a Central vai para o fundo.
function mostrarQR(n, qr) {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(qr || ''))) { rapida('Código inválido.'); return; }
  let vezes = 0, timer = null;
  const img = el('img', { class: 'p-qr', alt: 'Código para conectar o WhatsApp do número ' + (n.instancia || ''), width: '264', height: '264' }); img.src = qr;
  const situ = el('p', { class: 'mudo peq', role: 'status', text: 'Esperando a leitura…' });
  const parar = () => { clearInterval(timer); timer = null; img.removeAttribute('src'); img.remove(); est.qrFechar = null; };
  const fechar = janela(el('div', { class: 'janela', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-qr' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-qr', text: 'Conectar ' + (n.instancia || 'o número') })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    el('div', { class: 'corpo p-qr-corpo' }, el('ol', { class: 'p-passos-qr' }, el('li', { text: 'No celular do chip, abra o WhatsApp.' }), el('li', { text: 'Aparelhos conectados › Conectar um aparelho.' }), el('li', { text: 'Aponte a câmera para o código.' })),
      img, situ, el('p', { class: 'mudo peq', text: 'O código vale poucos segundos e só aparece aqui (não fica guardado).' })),
    el('div', { class: 'pe' }, btn('Fechar', () => fechar(), 'sec'), btn('Mostrar outro código', () => { fechar(); pedirQR(n); }, 'pri'))), { aoFechar: () => { parar(); rotear(); } });
  est.qrFechar = fechar;
  timer = setInterval(async () => {
    vezes++; if (vezes > 12) { clearInterval(timer); situ.textContent = 'Não vi a leitura. Toque em "Mostrar outro código".'; return; }
    const x = await chamar('prosp_numero_situacao', { id: n.id });
    if (x.ok && x.situacao === 'conectado') { situ.textContent = 'Conectado.'; fechar(); rapida('Número ' + (n.instancia || '') + ' conectado. Ele começa pausado: ligue quando quiser.'); }
  }, 10000);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && est.qrFechar) est.qrFechar(); });

// ---------- Leads
const SIT_LEADS = ['para_aprovar', 'na_fila', 'enviado', 'respondeu', 'positivo', 'com_voce', 'cadastrou', 'cliente', 'recusou', 'saiu', 'sem_whatsapp', 'falhou', 'descartado'];
async function pLeads(c, parte, sit) {
  topo('Leads', [['Prospecção', 'prospeccao'], ['Leads']], 'prospeccao');
  await arvoreP();
  sit = SIT_LEADS.includes(sit) ? sit : '';
  est.leadsFiltro = est.leadsFiltro || { conjunto_id: '', busca: '', pagina: 1 };
  const f = est.leadsFiltro;
  const r = await chamar('prosp_leads', { situacao: sit, conjunto_id: f.conjunto_id, busca: f.busca, pagina: f.pagina }); if (falhou(c, r, 'Leads')) return;
  const d = r.dados, ps = d.por_situacao || {}, editar = ligada('editar_prospeccao');
  const selCj = el('select', { class: 'entrada', 'aria-label': 'Conjunto', onchange: e => { f.conjunto_id = e.target.value; f.pagina = 1; rotear(); } }, el('option', { value: '', text: 'Todos os conjuntos' }),
    conjuntosP().map(j => el('option', { value: j.id, text: `${j.campanha.nome} › ${j.nome}`, selected: f.conjunto_id === j.id })));
  const busca = el('input', { class: 'entrada', type: 'search', placeholder: 'Nome, cidade, bairro ou PX-…', 'aria-label': 'Buscar lead', autocomplete: 'off', enterkeyhint: 'search', value: f.busca || null });
  busca.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); f.busca = busca.value.trim(); f.pagina = 1; rotear(); } });
  const total = d.total || 0, paginas = Math.max(1, Math.ceil(total / 50));
  const exportar = () => fazer('prosp_exportar', { conjunto_id: f.conjunto_id, situacao: sit }, { titulo: 'Exportar os leads (CSV)', texto: 'O arquivo sai SEM telefone (DEC-079). Fica no registro da Central.', botao: 'Exportar',
    depois: x => { baixar(x.arquivo || 'leads.csv', x.csv || ''); } , ok: 'Arquivo pronto.' });
  trocar(c, cabecalho('Leads', `${fmtNum(total)} lead(s)${sit ? ' · ' + P_LEAD[sit][0] : ''}`, btn('Exportar CSV', exportar, 'sec')),
    el('div', { class: 'pilha' }, abasP('leads'),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Situação' }, el('button', { type: 'button', 'aria-pressed': String(!sit), onclick: () => { f.pagina = 1; ir('prospeccao/leads'); } }, 'Todos'),
        SIT_LEADS.filter(k => ps[k] || k === sit).map(k => el('button', { type: 'button', 'aria-pressed': String(sit === k), onclick: () => { f.pagina = 1; ir('prospeccao/leads/' + k); } }, P_LEAD[k][0], el('span', { class: 'n', text: ps[k] || 0 })))),
      el('div', { class: 'form-2' }, selCj, el('div', { class: 'p-busca' }, busca, btn('Buscar', () => { f.busca = busca.value.trim(); f.pagina = 1; rotear(); }, 'sec', 'busca'))),
      editar && f.conjunto_id && ps.para_aprovar ? el('div', { class: 'acoes' }, btn(`Aprovar os ${fmtNum(ps.para_aprovar)} "para aprovar" deste conjunto`, () => fazer('prosp_leads_aprovar_todos', { conjunto_id: f.conjunto_id },
        { titulo: 'Aprovar todos do conjunto ' + nomeP('conjunto', f.conjunto_id), linhas: [['Para aprovar', fmtNum(ps.para_aprovar), '0 (todos na fila)']], ok: 'Aprovados.' }), 'sec', 'ok')) : null,
      cartao(null, null, (d.leads || []).length ? el('ul', { class: 'lista' }, d.leads.map(l => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irP('lead', l.id) },
        el('span', { class: 'avatar ' + ((P_LEAD[l.situacao] || [])[1] || ''), text: iniciais(l.nome), 'aria-hidden': 'true' }),
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: l.nome || l.id }), el('div', { class: 't2', text: [l.id, [l.cidade, l.bairro].filter(Boolean).join(' · '), l.nicho, l.nota != null ? '★ ' + String(l.nota).replace('.', ',') : null, l.pontos + ' pontos', l.telefone_fim].filter(Boolean).join(' · ') })),
        el('div', { class: 'direita' }, etqLead(l.situacao)), icone('seta'))))) : vazio('Nenhum lead com esse filtro.', 'clientes')),
      paginas > 1 ? el('div', { class: 'acoes' }, f.pagina > 1 ? btn('Anteriores', () => { f.pagina--; rotear(); }, 'sec') : null, el('span', { class: 'mudo peq p-pagina', text: `página ${f.pagina} de ${paginas}` }),
        f.pagina < paginas ? btn('Próximos', () => { f.pagina++; rotear(); }, 'sec') : null) : null));
}
function baixar(nome, texto) {
  const a = el('a', { download: nome, class: 'sr' }); const url = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' }));
  a.href = url; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ---------- Um lead: dados, funil e conversa
const FUNIL = [['enviada', 'Enviada'], ['entregue', 'Entregue'], ['lida', 'Lida'], ['respondeu', 'Respondeu'], ['positiva', 'Positiva'], ['pediu_link', 'Pediu o link ou você'], ['abriu_link', 'Abriu o link'],
  ['cadastrou', 'Cadastrou'], ['pagou', 'Pagou']];
const AUTOR = { disparo: 'Abordagem', followup: 'Follow-up', ia: 'IA', voce: 'Você', lead: 'Lead', sistema: 'Confirmação' };
async function pLead(c, parte, id) {
  const r = await chamar('prosp_lead', { id });
  const l = r.ok ? r.dados.lead : null;
  topo(l ? l.nome || l.id : 'Lead', [['Prospecção', 'prospeccao'], ['Leads', 'prospeccao/leads'], [l ? l.id : 'Lead']], 'prospeccao/leads');
  if (falhou(c, r, 'Lead')) return;
  const ms = r.dados.mensagens || [], fu = l.funil || {}, editar = ligada('editar_prospeccao');
  const recarregar = () => rotear();
  const acoes = [];
  if (editar) {
    if (l.situacao === 'para_aprovar') { acoes.push(btn('Aprovar', () => fazer('prosp_lead_aprovar', { id: l.id, valor: 'SIM' }, { ok: 'Na fila.', depois: recarregar }), 'pri', 'ok'));
      acoes.push(btn('Descartar', () => fazer('prosp_lead_aprovar', { id: l.id, valor: 'NAO' }, { ok: 'Descartado.', depois: recarregar }), 'sec')); }
    if (['enviado', 'respondeu', 'positivo'].includes(l.situacao) && !l.assumido_em) acoes.push(btn('Assumir a conversa', () => fazer('prosp_lead_assumir', { id: l.id }, { depois: recarregar }), 'pri', 'conversa'));
    if (l.situacao === 'com_voce' || l.assumido_em) acoes.push(btn('Devolver à IA', () => fazer('prosp_lead_devolver', { id: l.id }, { titulo: 'Devolver a conversa à IA', linhas: [['Conversa', 'com você', 'com a IA (na próxima mensagem do lead)']], depois: recarregar }), 'sec'));
    if (!['saiu', 'cliente'].includes(l.situacao)) acoes.push(btn('Marcar', () => fazer('prosp_lead_marcar', { id: l.id }, { titulo: 'Marcar o lead ' + l.id,
      campos: [{ k: 'situacao', rot: 'Situação', opcoes: [['positivo', 'Positivo'], ['recusou', 'Recusou'], ['cadastrou', 'Cadastrou'], ['com_voce', 'Com você']] }], ok: 'Marcado.', depois: recarregar }), 'sec'));
    if (l.situacao !== 'saiu') acoes.push(btn('Não contatar', () => fazer('prosp_lead_nao_contatar', { id: l.id }, { titulo: 'Não contatar ' + (l.nome || l.id), perigo: true, botao: 'Não contatar',
      linhas: [['Este número', 'pode receber', 'nunca mais, em nenhuma campanha']], texto: 'Guarda só o resumo do telefone (DEC-073). Os dados do lead saem em 30 dias.', ok: 'Não contatar.', depois: recarregar }), 'perigo-sec'));
  }
  trocar(c, cabecalho(l.nome || l.id, `${l.id} · ${nomeP('campanha', l.campanha_id)} › ${nomeP('conjunto', l.conjunto_id)}${l.anuncio_id ? ' › ' + nomeP('anuncio', l.anuncio_id) : ''}`, etqLead(l.situacao)),
    el('div', { class: 'pilha' },
      l.situacao === 'com_voce' ? el('div', { class: 'aviso atencao' }, icone('conversa'), el('div', {}, el('b', { text: 'A conversa é sua. ' }), 'A IA e os follow-ups pararam. Responda pelo celular do número ' + (l.numero || '') + '.')) : null,
      acoes.length ? el('div', { class: 'acoes' }, acoes) : null,
      el('div', { class: 'grade-2' },
        cartao('Conversa', el('span', { class: 'mudo peq', text: fmtNum(ms.length) + ' mensagem(ns)' }), ms.length ? el('ol', { class: 'p-conversa' }, ms.map(m => el('li', { class: 'p-bolha ' + (m.direcao === 'entrou' ? 'entrou' : 'saiu') },
          el('div', { class: 'p-quem', text: (AUTOR[m.autor] || m.autor) + ' · ' + fmtHora(m.criada_em) }), el('p', { text: m.texto == null ? '(texto apagado no prazo de guarda)' : m.texto }),
          m.direcao === 'saiu' ? el('div', { class: 'p-quem', text: m.situacao === 'falhou' ? 'não saiu' + (m.erro ? ' (' + m.erro + ')' : '') : m.situacao === 'pendente' ? 'saindo…' : m.lida_em ? 'lida' : m.entregue_em ? 'entregue' : 'enviada' }) : null))) : vazio('Nenhuma mensagem ainda.', 'conversa')),
        el('div', { class: 'pilha' },
          cartao('Funil', null, corpo(el('div', { class: 'passos' }, FUNIL.map(([k, n]) => el('div', { class: 'passo' + (fu[k] ? '' : ' depois') }, el('span', { class: 'bola' }, icone(fu[k] ? 'ok' : 'relogio', 'p')),
            el('div', {}, el('div', { class: 'forte', text: n }), el('div', { class: 'mudo peq', text: fu[k] ? fmtHora(fu[k]) : '—' }))))),
            fu.saiu || fu.recusou ? el('p', { class: 'mudo peq mt', text: fu.saiu ? 'Pediu para sair em ' + fmtHora(fu.saiu) : 'Recusou em ' + fmtHora(fu.recusou) }) : null)),
          cartao('Dados do Maps', null, corpo(dados([['Cidade', [l.cidade, l.bairro].filter(Boolean).join(' · ')], ['Nicho', l.nicho], ['Categoria', l.categoria], ['Nota', l.nota == null ? '' : String(l.nota).replace('.', ',') + ' (' + fmtNum(l.avaliacoes) + ' avaliações)'],
            ['Pontos', String(l.pontos)], ['Telefone', l.telefone_fim + (l.numero_revisar ? ' (número antigo, conferido no WhatsApp)' : '')], ['Origem do telefone', l.origem_telefone === 'wame' ? 'link wa.me do Maps' : 'Maps'],
            ['Número que abordou', l.numero], ['Mensagens enviadas', fmtNum(l.mensagens_enviadas)], ['Mensagens da IA', fmtNum(l.ia_mensagens)], ['Próximo envio', l.proximo_envio_em ? fmtHora(l.proximo_envio_em) : ''],
            ['Cliente', l.cliente_id], ['Achado em', fmtData(l.criado_em)], ['Sai em', fmtData(l.apagar_em)]])))))));
}

// ---------- Relatórios (DEC-082): taxas com margem de erro, custos, vencedor por conjunto, classificações e anotações
const VISOES = { desempenho: ['enviados', 'entrega', 'resposta', 'positiva', 'cadastros', 'saida'], funil: ['enviados', 'entregues', 'lidos', 'responderam', 'positivas', 'pediram_link', 'abriram_link', 'cadastros', 'pagamentos'],
  custos: ['enviados', 'custo', 'por_resposta', 'por_positiva', 'por_cadastro', 'mensagens_ia'] };
const COLUNAS = { enviados: 'Enviadas', entregues: 'Entregues', lidos: 'Lidas', responderam: 'Respostas', positivas: 'Positivas', pediram_link: 'Pediram link', abriram_link: 'Abriram link', cadastros: 'Cadastros',
  pagamentos: 'Pagamentos', mensagens_ia: 'Mensagens da IA', entrega: 'Entrega', resposta: 'Resposta', positiva: 'Positiva', saida: 'Saída', custo: 'Custo', por_resposta: 'Por resposta', por_positiva: 'Por positiva', por_cadastro: 'Por cadastro' };
const DETALHES = [['', 'Sem detalhar'], ['dia', 'Dia'], ['hora', 'Hora da 1ª mensagem'], ['dia_semana', 'Dia da semana'], ['nicho', 'Nicho'], ['cidade', 'Cidade'], ['faixa_nota', 'Faixa da nota'], ['categoria', 'Categoria']];
const DIAS_NOMES = { 1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sábado', 7: 'domingo' };
const ETAPAS = { so_leu: 'só leu', respondeu_curto: 'respondeu curto', conversou: 'conversou', interessado: 'interessado', pediu_link: 'pediu o link', cadastrou: 'cadastrou', recusou: 'recusou', saiu: 'saiu',
  preco: 'preço', ja_tem_secretaria: 'já tem secretária', ja_tem_sistema: 'já tem sistema', sem_tempo: 'sem tempo', desconfianca_ia: 'desconfia de IA', pouco_paciente: 'poucos pacientes', nao_decide: 'não é quem decide',
  momento_ruim: 'momento ruim', outro: 'outro', nao_precisa: 'não precisa', ja_tem_solucao: 'já tem solução', nao_gosta_de_ia: 'não gosta de IA', nao_e_o_responsavel: 'não é o responsável', sem_interesse: 'sem interesse' };
// Barra de proporção (neutra: maior não quer dizer ruim, ao contrário da barra da franquia).
const barraP = (v, max) => { const b = el('div', { class: 'uso', role: 'img', 'aria-label': fmtNum(v) + ' de ' + fmtNum(max) }); const i = el('i'); i.style.width = Math.round(v / Math.max(1, max) * 100) + '%'; b.append(i); return b; };
async function pRelatorios(c) {
  topo('Relatórios', [['Prospecção', 'prospeccao'], ['Relatórios']], 'prospeccao');
  await arvoreP();
  est.relP = est.relP || { dias: 30, nivel: 'anuncio', detalhar: '', conjunto_id: '', visao: '' };
  const f = est.relP;
  const r = await chamar('prosp_relatorio', { de: somaDias(hojeISO(), 1 - f.dias), nivel: f.nivel, detalhar: f.detalhar, conjunto_id: f.conjunto_id });
  if (falhou(c, r, 'Relatórios')) return;
  const d = r.dados;
  const visao = f.visao || ((d.colunas_salvas || {})['Padrão'] || {}).visao || 'desempenho';
  const cols = VISOES[visao] || VISOES.desempenho;
  const valor = (x, k) => { const n = x.numeros || {}, t = x.taxas || {}, cu = x.custos || {};
    if (k === 'entrega' || k === 'saida') return pct(t[k]);
    if (k === 'resposta' || k === 'positiva') return t[k] == null ? '—' : pct(t[k]) + (t[k + '_margem'] != null ? ' ± ' + String(t[k + '_margem']).replace('.', ',') : '');
    if (k === 'custo') return fmtReal(cu.total); if (/^por_/.test(k)) return cu[k] == null ? '—' : fmtReal(cu[k]);
    return fmtNum(n[k]); };
  const nomeLinha = x => { const base = d.nivel === 'numero' ? nomeP('numero', x.chave) : nomeP(d.nivel, x.chave);
    if (!d.detalhar) return base; const v = d.detalhar === 'dia_semana' ? DIAS_NOMES[x.valor] || x.valor : d.detalhar === 'hora' ? x.valor + 'h' : d.detalhar === 'dia' ? fmtData(x.valor) : x.valor; return base + ' · ' + v; };
  const filtro = (rot, atual, opcoes, mudar) => el('label', { class: 'campo' }, el('span', { class: 'rot', text: rot }),
    el('select', { class: 'entrada', onchange: e => { mudar(e.target.value); rotear(); } }, opcoes.map(([v, t]) => el('option', { value: v, text: t, selected: String(atual) === v }))));
  const venc = d.vencedores || [];
  const SITV = { vencedor: ['vencedor', 'ok'], empate: ['ainda empatados', 'atencao'], aprendendo: ['aprendendo', 'info'], um_anuncio: ['um anúncio só', ''] };
  const cls = d.classificacao || {};
  const barras = obj => { const ent = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...ent.map(e => e[1]));
    return ent.length ? el('ul', { class: 'lista' }, ent.map(([k, v]) => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: ETAPAS[k] || k.replace(/_/g, ' ') }), barraP(v, max)), el('div', { class: 'direita' }, el('span', { class: 'mudo num', text: fmtNum(v) })))))) : vazio('Nenhuma conversa classificada no período.', 'conversa'); };
  trocar(c, cabecalho('Relatórios', `${fmtData(d.de)} a ${fmtData(d.ate)} · margem de erro de 95%`, btn('Anotar', () => fazer('prosp_anotar', { campanha_id: '' }, { titulo: 'Anotar na linha do tempo',
      campos: [{ k: 'dia', rot: 'Dia', tipo: 'date', valor: hojeISO(), obrig: true }, { k: 'texto', rot: 'O que aconteceu (ex.: troquei o anúncio B)', longo: true, obrig: true, minimo: 3, max: 500 }], ok: 'Anotado.' }), 'sec')),
    el('div', { class: 'pilha' }, abasP('relatorios'),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Período' }, [7, 30, 90].map(n => el('button', { type: 'button', 'aria-pressed': String(f.dias === n), onclick: () => { f.dias = n; rotear(); } }, n + ' dias'))),
      el('div', { class: 'form-2 p-filtros' }, filtro('Nível', f.nivel, [['campanha', 'Campanha'], ['conjunto', 'Conjunto'], ['anuncio', 'Anúncio'], ['numero', 'Número']], v => { f.nivel = v; }),
        filtro('Detalhar por', f.detalhar, DETALHES, v => { f.detalhar = v; }),
        filtro('Conjunto', f.conjunto_id, [['', 'Todos'], ...conjuntosP().map(j => [j.id, j.campanha.nome + ' › ' + j.nome])], v => { f.conjunto_id = v; })),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Colunas' }, Object.keys(VISOES).map(v => el('button', { type: 'button', 'aria-pressed': String(visao === v), onclick: () => { f.visao = v; rotear(); } }, { desempenho: 'Desempenho', funil: 'Funil', custos: 'Custos' }[v])),
        btn('Guardar como padrão', () => fazer('prosp_relatorio_salvar', { nome: 'Padrão', config: { visao } }, { ok: 'Visão guardada (no servidor, não no navegador).' }), 'fant')),
      cartao(null, null, (d.linhas || []).length ? el('div', { class: 'tabela-rolagem', tabindex: '0', 'aria-label': 'Tabela do relatório (role para o lado)' }, el('table', { class: 'dados-t' },
        el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: { campanha: 'Campanha', conjunto: 'Conjunto', anuncio: 'Anúncio', numero: 'Número' }[d.nivel] }), cols.map(k => el('th', { scope: 'col', text: COLUNAS[k] })))),
        el('tbody', {}, d.linhas.map(x => el('tr', {}, el('th', { scope: 'row', text: nomeLinha(x) }), cols.map(k => el('td', { class: 'num', text: valor(x, k) }))))))) : vazio('Nada no período ainda (nenhuma mensagem saiu).', 'agregados')),
      el('p', { class: 'mudo peq', text: '"12% ± 4" quer dizer: com 95% de confiança, a taxa de verdade está entre 8% e 16%. Com poucos envios, a margem é grande: não decida por ela.' }),
      el('div', { class: 'grade-2 iguais' },
        cartao('Vencedor de cada conjunto', el('span', { class: 'mudo peq', text: 'pelo objetivo da campanha' }), venc.length ? el('ul', { class: 'lista' }, venc.map(v => el('li', {}, el('div', { class: 'linha' },
          el('div', { class: 'cresce' }, el('div', { class: 't1', text: nomeP('conjunto', v.conjunto_id) }),
            el('div', { class: 't2', text: v.segundo ? `${nomeP('anuncio', v.primeiro)} ${pct(v.taxa_primeiro)} (${fmtNum(v.envios_primeiro)}) × ${nomeP('anuncio', v.segundo)} ${pct(v.taxa_segundo)} (${fmtNum(v.envios_segundo)})${v.p != null ? ' · p = ' + String(v.p).replace('.', ',') : ''}`
              : 'Só um anúncio ativo: ligue outro para comparar.' }),
            v.situacao !== 'vencedor' && v.faltam ? el('div', { class: 't2', text: `faltam cerca de ${fmtNum(v.faltam)} envios por anúncio para decidir` }) : null),
          el('div', { class: 'direita' }, etq(...(SITV[v.situacao] || [v.situacao, ''])))))) ) : vazio('Sem anúncios com envios no período.', 'agregados')),
        cartao('Linha do tempo', null, (d.anotacoes || []).length ? el('ul', { class: 'lista' }, d.anotacoes.map(a => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: a.texto }), el('div', { class: 't2', text: fmtData(a.dia) + (a.campanha_id ? ' · ' + nomeP('campanha', a.campanha_id) : '') })))))) : vazio('Nenhuma anotação no período.', 'relogio'))),
      el('div', { class: 'grade-2 iguais' }, cartao('Onde as conversas pararam', el('span', { class: 'mudo peq', text: 'sem telefone, nome ou código' }), barras(cls.etapas)),
        cartao('Objeções e motivos da recusa', null, barras({ ...(cls.objecoes || {}), ...Object.fromEntries(Object.entries(cls.motivos_recusa || {}).map(([k, v]) => ['recusa: ' + (ETAPAS[k] || k.replace(/_/g, ' ')), v])) })))));
}

// ---------- Buscas
async function pBuscas(c) {
  topo('Buscas', [['Prospecção', 'prospeccao'], ['Buscas']], 'prospeccao');
  await arvoreP();
  const r = await chamar('prosp_buscas'); if (falhou(c, r, 'Buscas')) return;
  const d = r.dados, editar = ligada('editar_prospeccao');
  const cjs = conjuntosP().filter(j => !/^encerrad/.test(j.situacao));
  const buscar = () => fazer('prosp_buscar_agora', {}, { titulo: 'Buscar agora', texto: 'Uma busca por termo × lugar do conjunto entra na fila; o workflow 50 traz uma página a cada 5 minutos e gasta créditos do SerpAPI.',
    campos: [{ k: 'conjunto_id', rot: 'Conjunto', opcoes: cjs.map(j => [j.id, j.campanha.nome + ' › ' + j.nome]) }], botao: 'Buscar' });
  const SITB = { pedida: ['na fila', 'info'], rodando: ['buscando', 'atencao'], feita: ['feita', 'ok'], falhou: ['falhou', 'perigo'] };
  const MOTIVOS = { achados: 'achados', novos: 'novos', fixo: 'telefone fixo', invalido: 'sem telefone', revisar: 'número antigo', fechado: 'fechado', nota: 'nota', avaliacoes: 'avaliações', categoria: 'categoria',
    palavra: 'palavra', site: 'site', rede: 'rede', concorrente: 'concorrente', repetido: 'repetido', ja_na_base: 'já na base', cliente: 'cliente', demonstracao: 'pediu demonstração', nao_contatar: 'não contatar',
    abordado: 'outra campanha', pontos: 'pontuação baixa', sem_creditos: 'sem créditos', paginas_com_erro: 'erro' };
  trocar(c, cabecalho('Buscas', 'Google Maps pelo SerpAPI · uma página por rodada', editar && d.busca_ligada && cjs.length ? btn('Buscar agora', buscar, 'pri', 'busca') : null),
    el('div', { class: 'pilha' }, abasP('buscas'),
      d.busca_ligada ? null : el('div', { class: 'aviso info' }, icone('info'), el('div', {}, 'A busca está desligada (chave "Busca no Google Maps" em ', el('a', { href: '#ajustes', text: 'Ajustes' }), '). Nada gasta créditos.')),
      (d.creditos_mes || []).length ? el('div', { class: 'kpis' }, d.creditos_mes.map(x => kpi(nomeP('campanha', x.campanha_id), `${fmtNum(x.gastos)} de ${fmtNum(x.limite)}`, 'créditos no mês', barraUso(x.gastos, x.limite)))) : null,
      cartao('Últimas buscas', null, (d.buscas || []).length ? el('ul', { class: 'lista' }, d.buscas.map(b => el('li', {}, el('div', { class: 'linha' },
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${b.termo}${b.lugar ? ' em ' + b.lugar : ''}` }),
          el('div', { class: 't2', text: `${nomeP('conjunto', b.conjunto_id)} · ${fmtHora(b.pedida_em)} · ${fmtNum(b.paginas_feitas)} de ${fmtNum(b.paginas)} página(s) · ${fmtNum(b.creditos)} crédito(s)` }),
          Object.keys(b.contagens || {}).length ? el('div', { class: 't2', text: Object.entries(b.contagens).map(([k, v]) => `${MOTIVOS[k] || k} ${v}`).join(' · ') }) : null),
        el('div', { class: 'direita' }, etq(...(SITB[b.situacao] || [b.situacao, '']))))))) : vazio('Nenhuma busca ainda.', 'busca'))));
}

// ---------- Regras automáticas (nunca aumentam nada; as fixas não mudam)
const METRICAS = [['pare', '"Pare" (pediu para sair) %'], ['recusa', 'Recusa %'], ['sem_entrega', 'Sem entrega %'], ['falhas_seguidas', 'Falhas seguidas'], ['resposta', 'Resposta %'], ['positiva', 'Positiva %'],
  ['custo_resposta', 'Custo por resposta (R$)'], ['custo_cadastro', 'Custo por cadastro (R$)']];
const NIVEIS_R = [['anuncio', 'Anúncio'], ['conjunto', 'Conjunto'], ['campanha', 'Campanha'], ['numero', 'Número']];
const ACOES_R = [['pausar', 'Pausar (anúncio: cortar)'], ['reduzir', 'Reduzir o teto pela metade'], ['avisar', 'Só avisar']];
async function pRegras(c) {
  topo('Regras', [['Prospecção', 'prospeccao'], ['Regras']], 'prospeccao');
  const r = await chamar('prosp_regras'); if (falhou(c, r, 'Regras')) return;
  const regras = r.dados.regras || [], editar = ligada('editar_prospeccao');
  const nomeM = k => (METRICAS.find(m => m[0] === k) || [k, k === 'desconectado' ? 'Número caiu' : k])[1];
  const form = g => fazer('prosp_regra_salvar', g ? { id: g.id } : {}, { titulo: g ? 'Mudar a regra ' + g.id : 'Nova regra', ok: 'Regra salva.',
    texto: 'SE a métrica passar do valor (depois de N envios) ENTÃO pausar, reduzir ou avisar. Nunca aumenta nada. Age no máximo uma vez por dia em cada alvo.',
    campos: [{ k: 'nivel', rot: 'Onde mede', opcoes: NIVEIS_R, valor: g ? g.nivel : 'anuncio' }, { k: 'alvo_id', rot: 'Só este código (vazio = todos)', valor: g ? g.alvo_id : '', ph: 'AN-0001' },
      { k: 'metrica', rot: 'Métrica', opcoes: METRICAS, valor: g ? g.metrica : 'recusa' }, { k: 'operador', rot: 'Quando', opcoes: [['>', 'passar de'], ['<', 'ficar abaixo de']], valor: g ? g.operador : '>' },
      { k: 'valor', rot: 'Valor', inputmode: 'decimal', valor: g ? String(g.valor) : '', obrig: true }, { k: 'depois_de', rot: 'Depois de N envios', inputmode: 'numeric', valor: g ? String(g.depois_de) : '30' },
      { k: 'janela_dias', rot: 'Nos últimos N dias (0 = desde o começo)', inputmode: 'numeric', valor: g ? String(g.janela_dias) : '7' }, { k: 'acao', rot: 'Então', opcoes: ACOES_R, valor: g ? g.acao : 'avisar' }] });
  trocar(c, cabecalho('Regras automáticas', 'nunca aumentam nada · as fixas de segurança não mudam', editar ? btn('Nova regra', () => form(null), 'pri', 'mais_um') : null),
    el('div', { class: 'pilha' }, abasP('regras'),
      cartao(null, null, el('ul', { class: 'lista' }, regras.map(g => el('li', {}, el('div', { class: 'linha' },
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${nomeM(g.metrica)} ${g.operador === '>' ? 'passar de' : 'abaixo de'} ${String(g.valor).replace('.', ',')}` }),
          el('div', { class: 't2', text: `${(NIVEIS_R.find(n => n[0] === g.nivel) || [, g.nivel])[1]}${g.alvo_id ? ' ' + g.alvo_id : ' (todos)'} · depois de ${fmtNum(g.depois_de)} envios · ${g.janela_dias ? g.janela_dias + ' dias' : 'desde o começo'} · ${(ACOES_R.find(a => a[0] === g.acao) || [, g.acao])[1]} · agiu ${fmtNum(g.disparos_30d)}× em 30 dias` })),
        el('div', { class: 'direita' }, g.fixa ? etq('fixa', 'info') : null, !g.fixa && editar ? btn('Mudar', () => form(g), 'sec') : null,
          !g.fixa && editar ? el('button', { class: 'toggle', type: 'button', role: 'switch', 'aria-checked': String(!!g.ligada), 'aria-label': (g.ligada ? 'Desligar' : 'Ligar') + ' a regra ' + g.id,
            onclick: async e => { const t = e.currentTarget; t.setAttribute('aria-checked', String(!g.ligada));
              const x = await fazer('prosp_regra_ligar', { id: g.id, valor: g.ligada ? 'NAO' : 'SIM' }, { titulo: 'Desligar a regra ' + g.id, linhas: [['Regra', 'ligada', 'desligada']], ok: g.ligada ? 'Regra desligada.' : 'Regra ligada.' });
              if (!x) t.setAttribute('aria-checked', String(!!g.ligada)); } }) : g.fixa ? null : etq(g.ligada ? 'ligada' : 'desligada', g.ligada ? 'ok' : ''))))))),
      el('p', { class: 'mudo peq', text: 'As fixas: "pare" acima de 5% depois de 20 envios corta o anúncio; "pare" acima de 3% em 7 dias reduz o número; número caiu pausa tudo o que usa ele; 5 falhas seguidas pausam o conjunto.' })));
}

// ---------- Custos (para custo por resposta, positiva e cadastro)
const CUSTOS = [['preco_credito_serpapi', 'Preço de 1 crédito do SerpAPI (R$)'], ['preco_mil_tokens_entrada', 'OpenAI: 1.000 tokens de entrada (R$)'], ['preco_mil_tokens_saida', 'OpenAI: 1.000 tokens de saída (R$)'],
  ['fixo_mensal', 'Fixo por mês (chip, plano do SerpAPI…) (R$)']];
async function pCustos(c) {
  topo('Custos', [['Prospecção', 'prospeccao'], ['Custos']], 'prospeccao');
  const r = await chamar('prosp_inicio'); if (falhou(c, r, 'Custos')) return;
  est.prosp = r.dados;
  const atuais = ((r.dados.resultados || {}).custos) || null, editar = ligada('editar_prospeccao');
  const ins = {}; const erro = el('p', { class: 'erro', role: 'alert' });
  const campos = CUSTOS.map(([k, rot]) => { const v = atuais && atuais[k] ? atuais[k] : {};
    ins[k] = { valor: el('input', { class: 'entrada', id: 'cu-' + k, inputmode: 'decimal', autocomplete: 'off', value: v.valor != null ? String(v.valor).replace('.', ',') : null, disabled: !editar }),
      descricao: el('input', { class: 'entrada', id: 'cu-d-' + k, autocomplete: 'off', value: v.descricao || null, placeholder: 'de onde vem (opcional)', disabled: !editar }) };
    return el('div', { class: 'p-custo' }, el('label', { class: 'campo', for: 'cu-' + k }, el('span', { class: 'rot', text: rot }), ins[k].valor), el('label', { class: 'campo', for: 'cu-d-' + k }, el('span', { class: 'rot', text: 'Descrição' }), ins[k].descricao)); });
  const salvar = async e => {
    e.preventDefault(); erro.textContent = '';
    const itens = CUSTOS.filter(([k]) => ins[k].valor.value.trim() !== '').map(([k]) => ({ tipo: k, valor: ins[k].valor.value.trim().replace(/\./g, '').replace(',', '.'), descricao: ins[k].descricao.value.trim() }));
    if (!itens.length) { erro.textContent = 'Preencha pelo menos um valor.'; return; }
    if (itens.some(x => isNaN(Number(x.valor)) || Number(x.valor) < 0)) { erro.textContent = 'Valor em reais, como 0,05.'; return; }
    await fazer('prosp_custos_salvar', { itens }, { ok: 'Custos salvos.', erro: x => { erro.textContent = x.mensagem || 'Não consegui.'; } });
  };
  trocar(c, cabecalho('Custos', 'entram no relatório: custo por resposta, positiva e cadastro'),
    el('div', { class: 'pilha' }, abasP('custos'),
      atuais ? null : nota('Os valores guardados aparecem aqui depois do sql/033 (rxsync-sistema). Salvar já funciona.'),
      el('form', { class: 'cartao', onsubmit: salvar }, el('div', { class: 'corpo p-topo-form' }, campos, erro, editar ? el('button', { class: 'btn pri', type: 'submit', text: 'Salvar' }) : nota('Editar está desligado (editar_prospeccao).', true)))));
}
