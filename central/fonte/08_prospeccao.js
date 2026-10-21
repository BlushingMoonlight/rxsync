// ---------------------------------------------------------------- Marketing › Prospecção (sql/031 a sql/036; DEC-069 a DEC-088)
// Gerenciador no jeito do Meta Ads: Campanha › Conjunto › Anúncio, com interruptor em cada camada (pausar = um toque;
// ligar pede o nível do servidor). Números de WhatsApp com o QR SÓ na tela (nunca guardado no navegador nem no endereço),
// leads e conversas (o telefone só com os 4 últimos dígitos), buscas, relatórios com margem de erro, regras e custos.
// Públicos (sql/036, DEC-088): a busca e os contatos ficam no público; o conjunto escolhe públicos do mesmo fuso.
// Toda trava é conferida no servidor; a página só mostra (e as travas que ela mostra vêm de "travas" do servidor).
ICONES.prospeccao = 'M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12';
ICONES.telefone = 'M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5M11 17.5h2';
ICONES.conversa = 'M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-4.5 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M8 9.5h8M8 12.5h5';
ICONES.mais_um = 'M12 5v14M5 12h14';

const P_ABAS = [['', 'Campanhas'], ['publicos', 'Públicos'], ['numeros', 'Números'], ['leads', 'Leads'], ['conversas', 'Conversas'], ['relatorios', 'Relatórios'], ['buscas', 'Buscas'], ['regras', 'Regras'], ['custos', 'Custos']];
const P_SIT = { rascunho: ['rascunho', ''], ativa: ['ativa', 'ok'], ativo: ['ativo', 'ok'], pausada: ['pausada', 'atencao'], pausado: ['pausado', 'atencao'], cortado: ['cortado pela regra', 'perigo'],
  encerrada: ['encerrada', ''], encerrado: ['encerrado', ''], arquivado: ['arquivado', ''] };
const etqSit = s => { const [t, tom] = P_SIT[s] || [s || '—', '']; return etq(t, tom); };
const P_NUM = { novo: ['novo', ''], aguardando_qr: ['esperando o código', 'atencao'], conectado: ['conectado', 'ok'], desconectado: ['desconectado', 'perigo'], banido: ['provável bloqueio', 'perigo'], apagado: ['apagado', ''] };
const etqNum = s => { const [t, tom] = P_NUM[s] || [s || '—', '']; return etq(t, tom); };
const P_LEAD = { para_aprovar: ['Para aprovar', 'atencao'], na_fila: ['Na fila', 'info'], enviado: ['Enviado', ''], respondeu: ['Respondeu', 'info'], positivo: ['Positivo', 'ok'], com_voce: ['Com você', 'atencao'],
  cadastrou: ['Cadastrou', 'ok'], cliente: ['Cliente', 'ok'], recusou: ['Recusou', ''], saiu: ['Saiu (não contatar)', 'perigo'], sem_whatsapp: ['Sem WhatsApp', ''], falhou: ['Falhou', 'perigo'], descartado: ['Descartado', ''] };
const etqLead = s => { const [t, tom] = P_LEAD[s] || [s || '—', '']; return etq(t, tom); };
const P_NOME = { campanha: 'campanha', conjunto: 'conjunto', anuncio: 'anúncio', publico: 'público' };
const pct = v => v == null ? '—' : String(v).replace('.', ',') + '%';
const irP = (...partes) => ir(['prospeccao', ...partes.filter(x => x != null && x !== '').map(x => encodeURIComponent(x))].join('/'));
const ativo = s => s === 'ativa' || s === 'ativo';
est.prosp = null; // a última tela inicial (árvore de campanhas e números), só na memória
est.publicos = null; // a última lista de públicos (sql/036), só na memória

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
const nomePub = id => { const p = ((est.publicos && est.publicos.publicos) || []).find(x => x.id === id); return p ? p.nome : id || '(sem público)'; };
// Lista dos públicos (para o conjunto escolher e para os filtros de leads, relatórios e buscas).
async function publicosP(forcar) {
  if (est.publicos && !forcar) return est.publicos;
  const r = await chamar('prosp_publicos');
  if (r.ok) est.publicos = r.dados;
  return r.ok ? est.publicos : { publicos: [] };
}
const pubsAtivos = () => ((est.publicos && est.publicos.publicos) || []).filter(p => p.situacao === 'ativo');
const emUsoPub = p => !!p && (p.conjuntos || []).some(j => j.ativo);
// Grupo de fuso (a mesma regra de rx_prosp_fuso_grupo): o conjunto só usa públicos do fuso da entrega (DEC-088, opção A).
const fusoGrupo = f => f === 'America/Rio_Branco' ? '-5' : ['America/Manaus', 'America/Boa_Vista', 'America/Porto_Velho', 'America/Cuiaba', 'America/Campo_Grande'].includes(f) ? '-4' : f === 'America/Noronha' ? '-2' : '-3';
const NOMES_FUSO = { Sao_Paulo: 'São Paulo', Cuiaba: 'Cuiabá', Belem: 'Belém', Maceio: 'Maceió', Araguaina: 'Araguaína', Noronha: 'Fernando de Noronha' };
function fusoNome(f) { const k = String(f || 'America/Sao_Paulo').replace('America/', ''); return NOMES_FUSO[k] || k.replace(/_/g, ' '); }
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
  const telasP = { '': pInicio, campanha: pObjeto, conjunto: pObjeto, anuncio: pObjeto, publicos: pPublicos, publico: pPublico, numeros: pNumeros, leads: pLeads, lead: pLead, conversas: pConversas, relatorios: pRelatorios, buscas: pBuscas, regras: pRegras, custos: pCustos };
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
    (cp.conjuntos || []).map(j => el('li', {}, camada('conjunto', j, `${j.id} · ${j.numero ? j.numero.instancia : 'sem número'} · ${(j.publicos || []).length ? fmtNum(j.publicos.length) + ' público(s)' : 'sem público'}${j.pausa_motivo ? ' · ' + j.pausa_motivo : ''}`), anuncios(j))),
    editar && !/^encerrad/.test(cp.situacao) ? novoBtn('Novo conjunto', 'conjunto', cp.id) : null);
  const arvore = campanhas.length
    ? campanhas.map(cp => cartao(null, null, camada('campanha', cp, `${cp.id} · versão ${cp.versao} · ${fmtNum((cp.conjuntos || []).length)} conjunto(s)`, 'prospeccao', 'p-campanha'), conjuntos(cp)))
    : [cartao(null, null, vazio('Nenhuma campanha ainda. Crie a primeira: campanha (marca, produto e IA) › conjunto (públicos, número, entrega) › anúncios (as mensagens, sorteadas entre os leads).', 'prospeccao'))];
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
  'America/Fortaleza', 'America/Recife', 'America/Bahia', 'America/Maceio', 'America/Araguaina', 'America/Noronha'].map(f => [f, fusoNome(f)]);
const ESQUEMA = {
  campanha: [
    ['Marca e produto', [['marca', 'Marca (vai na mensagem)', 'texto', { ajuda: 'até 40 letras; use {marca} no anúncio' }], ['produto', 'O que a IA conta sobre o produto', 'longo', { ajuda: '20 a 1.500 letras' }],
      ['objetivo', 'Objetivo (decide o vencedor)', 'sel', { op: [['resposta', 'Resposta'], ['positiva', 'Resposta positiva'], ['cadastro', 'Cadastro'], ['pagamento', 'Pagamento']] }],
      ['link_agenda', 'Link da sua agenda (opcional)', 'texto', { ajuda: 'começa com https://' }]]],
    ['Orçamento e datas', [['orcamento_msgs_dia', 'Mensagens por dia (campanha)', 'num', { ajuda: 'o teto de cada número vale por cima' }], ['limite_total', 'Limite total de mensagens', 'num', { ajuda: '0 = sem limite' }],
      ['inicio', 'Começa em', 'data'], ['fim', 'Termina em', 'data'], ['atribuicao_dias', 'Janela de atribuição (dias)', 'num', { ajuda: 'cadastro conta até N dias depois da 1ª mensagem' }]]],
    ['IA de resposta', [['ia.ligada', 'IA ligada nesta campanha', 'simnao'], ['ia.tom', 'Tom', 'texto'], ['ia.objetivo_texto', 'Objetivo da conversa', 'texto'], ['ia.objecoes', 'Como responder às objeções', 'lista'],
      ['ia.passar_para_voce', 'Quando passar para você', 'texto'], ['ia.nunca_dizer', 'Nunca dizer (os fixos ficam)', 'lista'], ['ia.regras_escrita', 'Regras de escrita', 'lista'],
      ['ia.tamanho_max', 'Tamanho máximo da resposta (letras)', 'num', { trava: 'resposta_max' }], ['ia.max_mensagens', 'Mensagens da IA antes de passar para você', 'num', { trava: 'ia_mensagens_max' }],
      ['ia.hora_inicio', 'IA responde a partir de (hora)', 'num', { trava: 'ia_hora_inicio_min', min: true }], ['ia.hora_fim', 'IA responde até (hora)', 'num', { trava: 'ia_hora_fim_max' }],
      ['ia.palavras_saida', 'Palavras de saída a mais (as 6 fixas ficam)', 'lista']]],
    // Texto inteiro do prompt (sql/041, DEC-096): vazio = o texto montado pelos campos acima. As regras fixas entram sempre.
    ['Prompt da IA (texto inteiro)', [['ia.prompt_texto', 'Texto do prompt (vazio = o montado pelos campos de "IA de resposta")', 'longo',
      { ajuda: '50 a 8.000 letras; sem preço e sem link de fora. As regras fixas (assistente virtual, preços, link, SAIR e as marcas) entram sempre no fim. Um anúncio com prompt próprio usa o dele.', linhas: 14, comecar: true }]]],
    ['Avisos no Telegram (só códigos)', [['ia.avisar.fechou', 'Quer contratar', 'simnao'], ['ia.avisar.interessado', 'Mostrou interesse', 'simnao'], ['ia.avisar.pediu_voce', 'Pediu você', 'simnao'],
      ['ia.avisar.recusou', 'Recusou', 'simnao'], ['ia.avisar.saiu', 'Pediu para sair', 'simnao']]]],
  conjunto: [
    ['Públicos', [['publicos', 'Públicos que o conjunto usa (só do fuso da entrega)', 'publicos', { ajuda: 'até 10; pôr um público num conjunto ativo = nível 3' }]]],
    ['Exclusões', [['exclusoes.outra_campanha_dias', 'Abordado por outra campanha há menos de (dias)', 'num', { trava: 'outra_campanha_dias_min', min: true }]]],
    ['Entrega', [['entrega.dias', 'Dias', 'dias'], ['entrega.janelas', 'Janelas', 'janelas', { ajuda: 'ex.: 09:00-11:30, 14:00-17:30 (dentro de 8h–18h)' }], ['entrega.fuso', 'Fuso', 'sel', { op: FUSOS }],
      ['entrega.teto_dia', 'Teto do conjunto por dia', 'num', { trava: 'teto_numero_dia' }], ['entrega.lote', 'Mensagens por lote', 'num', { trava: 'lote_max' }],
      ['entrega.pausa_min_s', 'Pausa mínima entre lotes (s)', 'num', { trava: 'pausa_min_s', min: true }], ['entrega.pausa_max_s', 'Pausa máxima entre lotes (s)', 'num'],
      ['entrega.ordem', 'Ordem', 'sel', { op: [['pontuacao', 'Maior pontuação primeiro'], ['sorteio', 'Sorteio']] }], ['entrega.tentativas', 'Tentativas se falhar', 'num', { trava: 'tentativas_max' }],
      ['entrega.intervalo_tentativa_dias', 'Tentar de novo depois de (dias úteis)', 'num']]],
    ['Frequência e aprendizado', [['frequencia.max_mensagens', 'Mensagens por lead (abordagem + follow-ups)', 'num', { trava: 'frequencia_max' }],
      ['frequencia.intervalo_dias_uteis', 'Dias úteis entre mensagens ao mesmo lead', 'num', { trava: 'intervalo_lead_dias_uteis', min: true }], ['aprendizado_min', 'Fase de aprendizado (envios por anúncio)', 'num']]]],
  publico: [
    ['Busca no Google Maps', [['busca.termos', 'Termos (um por linha)', 'lista', { ajuda: 'ex.: dentista' }], ['busca.lugares', 'Cidades ou bairros (um por linha)', 'lista'], ['busca.coordenadas', 'Coordenadas (opcional)', 'texto', { ajuda: '-25.43,-49.27' }],
      ['busca.zoom', 'Zoom (10 cidade a 18 quarteirão)', 'num'], ['busca.paginas', 'Páginas por busca', 'num', { trava: 'paginas_max' }], ['busca.creditos_busca', 'Créditos por busca', 'num'],
      ['busca.repetir.tipo', 'Repetir', 'sel', { op: [['uma_vez', 'Uma vez'], ['semanal', 'Toda semana']] }], ['busca.repetir.dia_semana', 'Dia da semana', 'sel', { op: DIAS_SEM }], ['busca.repetir.hora', 'A partir das (hora)', 'num'],
      ['busca.nao_repetir_dias', 'Não repetir o mesmo termo e lugar (dias)', 'num']]],
    ['Filtros', [['busca.nota_min', 'Nota mínima', 'num'], ['busca.nota_max', 'Nota máxima', 'num'], ['busca.sem_nota', 'Sem nota', 'sel', { op: [['descartar', 'Descartar'], ['aceitar', 'Aceitar']] }],
      ['busca.avaliacoes_min', 'Avaliações mínimas', 'num'], ['busca.categorias_aceitas', 'Só estas categorias (vazio = todas)', 'lista'], ['busca.categorias_excluidas', 'Nunca estas categorias', 'lista'],
      ['busca.palavras_excluem', 'Palavras que excluem', 'lista'], ['busca.tem_site', 'Tem site', 'sel', { op: [['tanto_faz', 'Tanto faz'], ['sim', 'Sim'], ['nao', 'Não']] }],
      ['busca.so_celular', 'Só celular', 'simnao'], ['busca.aceitar_wame', 'Aceitar o link wa.me do Maps', 'simnao'], ['busca.so_aberto', 'Só negócio aberto', 'simnao']]],
    ['Fuso, créditos e contatos novos', [['fuso', 'Fuso (o público só junta cidades dele)', 'sel', { op: FUSOS }], ['creditos_mes', 'Créditos do SerpAPI no mês (este público)', 'num', { ajuda: 'o teto geral do mês vale por cima' }],
      ['novos_entram', 'Contatos novos entram', 'sel', { op: [['selecionados', 'Selecionados'], ['tirados', 'Tirados (eu ponho de volta)']], ajuda: 'com um conjunto ativo usando o público, entram sempre tirados' }]]],
    ['Qualificação', [['qualificacao.pesos.nota', 'Peso da nota', 'num'], ['qualificacao.pesos.avaliacoes', 'Peso das avaliações', 'num'], ['qualificacao.pesos.categoria', 'Peso da categoria', 'num'],
      ['qualificacao.pesos.site', 'Peso do site', 'num'], ['qualificacao.pesos.origem', 'Peso da origem do telefone', 'num'], ['qualificacao.pontos_min', 'Pontuação mínima (0 a 100)', 'num'],
      ['qualificacao.revisar_numero', 'Número antigo (sem o 9)', 'sel', { op: [['whatsapp', 'Conferir no WhatsApp'], ['manual', 'Deixar tirado (eu ponho de volta)'], ['descartar', 'Descartar']] }]]],
    ['Redes e concorrentes', [['exclusoes.redes_palavras', 'Palavras de rede', 'lista'], ['exclusoes.rede_min_enderecos', 'Mesmo nome em N endereços = rede', 'num'], ['exclusoes.concorrentes', 'Concorrentes (nome ou site)', 'lista']]]],
  anuncio: [
    ['Mensagem', [['abordagem', 'Primeira mensagem', 'longo', { ajuda: 'campos: {nome} {cidade} {bairro} {nicho} {marca}; diga "assistente virtual", a marca e de onde veio o contato (Google Maps)', previa: true }],
      ['tamanho_max', 'Tamanho máximo com o texto de saída', 'num', { trava: 'mensagem_max' }], ['texto_saida', 'Texto de saída (precisa ter SAIR)', 'texto'],
      ['texto_confirmacao', 'Confirmação quando pedem para sair', 'longo'], ['palavras_proibidas', 'Palavras proibidas a mais', 'lista']]],
    ['Follow-ups (no máximo 2)', [['followups.0.dias_uteis', '1º follow-up: depois de (dias úteis)', 'num'], ['followups.0.texto', '1º follow-up: texto', 'longo'],
      ['followups.1.dias_uteis', '2º follow-up: depois de (dias úteis)', 'num'], ['followups.1.texto', '2º follow-up: texto', 'longo']]],
    ['IA (opcional)', [['prompt_proprio', 'Prompt próprio deste anúncio (vazio = o da campanha)', 'longo', { ajuda: '50 a 8.000 letras; sem preço e sem link de fora; as regras fixas (assistente virtual, preços, SAIR) entram sempre', linhas: 10 }]]]]
};
const pegar = (o, cam) => cam.split('.').reduce((x, k) => x == null ? undefined : x[k], o);
function colocar(o, cam, v) { const ks = cam.split('.'); let x = o; ks.slice(0, -1).forEach((k, i) => { if (x[k] == null) x[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; x = x[k]; }); x[ks[ks.length - 1]] = v; }
const paraTexto = (tipo, v) => v == null ? '' : tipo === 'publicos' ? (Array.isArray(v) ? v.map(nomePub).join(', ') : '') : tipo === 'lista' ? (Array.isArray(v) ? v.join('\n') : String(v)) : tipo === 'janelas' ? (Array.isArray(v) ? v.map(j => (j || []).join('-')).join(', ') : '')
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
  if (tipo === 'publico') topo(titulo, [['Prospecção', 'prospeccao'], ['Públicos', 'prospeccao/publicos'], [titulo]], 'prospeccao/publicos');
  else topo(titulo, [['Prospecção', 'prospeccao'], [titulo]], 'prospeccao');
  if (falhou(c, r, titulo)) return;
  await arvoreP();
  if (tipo === 'conjunto' || tipo === 'publico') await publicosP(true);
  const d = r.dados, o = d.objeto, cfg = d.config || {}, t = d.travas || {}, editar = ligada('editar_prospeccao') && !(o && /^(encerrad|arquivad)/.test(o.situacao));
  const pubAqui = tipo === 'publico' && o ? (est.publicos.publicos || []).find(x => x.id === o.id) : null;
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
    else if (tp === 'longo' || tp === 'lista') i = el('textarea', { class: 'entrada' + (ex.linhas ? ' p-prompt-campo' : ''), id: idc, rows: String(ex.linhas || (tp === 'lista' ? 3 : 4)), maxlength: ex.linhas ? '8000' : null, autocomplete: 'off', value: v, disabled: !editar });
    else if (tp === 'dias') {
      const marcados = new Set(pegar(cfg, cam) || []);
      i = el('div', { class: 'filtros p-dias', role: 'group', 'aria-label': rot, id: idc }, DIAS_SEM.map(([val, txt]) => el('button', { type: 'button', 'aria-pressed': String(marcados.has(val)), disabled: !editar,
        onclick: e => e.currentTarget.setAttribute('aria-pressed', String(e.currentTarget.getAttribute('aria-pressed') !== 'true')) }, txt)));
      i.lerValor = () => [...i.querySelectorAll('button')].filter(b => b.getAttribute('aria-pressed') === 'true').map((b, k) => b.textContent);
    } else if (tp === 'publicos') {
      // Os públicos que o conjunto usa: um botão por público (ativo, ou já escolhido); de outro fuso não dá para escolher.
      const marcados = new Set(pegar(cfg, cam) || []);
      const opcoes = (est.publicos.publicos || []).filter(p => p.situacao === 'ativo' || marcados.has(p.id));
      i = el('div', { class: 'p-publicos', role: 'group', 'aria-label': rot, id: idc }, opcoes.length ? opcoes.map(p => el('button', { type: 'button', class: 'p-pub', 'aria-pressed': String(marcados.has(p.id)), 'data-id': p.id, 'data-fuso': p.fuso || '',
          onclick: e => e.currentTarget.setAttribute('aria-pressed', String(e.currentTarget.getAttribute('aria-pressed') !== 'true')) },
        el('span', { class: 't1', text: p.nome }), el('span', { class: 't2', text: `${p.id} · ${fusoNome(p.fuso)} · ${fmtNum((p.numeros || {}).disponiveis)} disponíveis${p.situacao === 'arquivado' ? ' · arquivado' : ''}` }))) : el('p', { class: 'mudo peq', text: 'Nenhum público ainda: crie em Prospecção › Públicos.' }));
      i.lerValor = () => [...i.querySelectorAll('button[aria-pressed="true"]')].map(b => b.dataset.id);
      i.conferirFuso = fuso => i.querySelectorAll('button').forEach(b => { const outro = fusoGrupo(b.dataset.fuso) !== fusoGrupo(fuso), marcado = b.getAttribute('aria-pressed') === 'true';
        b.disabled = !editar || (outro && !marcado); b.classList.toggle('outro-fuso', outro); b.title = outro ? 'Outro fuso: o conjunto só usa públicos do fuso da entrega' : ''; });
    } else i = el('input', { class: 'entrada', id: idc, type: tp === 'data' ? 'date' : 'text', inputmode: tp === 'num' ? 'decimal' : null, autocomplete: 'off', spellcheck: 'false', value: v || null, disabled: !editar });
    ins[cam] = { i, tp, rot };
    const trava = ex.trava && t[ex.trava] != null ? (ex.min ? 'mínimo ' : 'até ') + t[ex.trava] + ' (trava)' : '';
    const ajuda = [ex.ajuda, trava].filter(Boolean).join(' · ');
    if (tp === 'publicos') return el('div', { class: 'campo largo' }, el('span', { class: 'rot', text: rot }), i, ajuda ? el('span', { class: 'ajuda', text: ajuda }) : null);
    return el('label', { class: 'campo' + (tp === 'longo' || tp === 'lista' ? ' largo' : ''), for: tp === 'dias' ? null : idc }, el('span', { class: 'rot', text: rot }), i, ajuda ? el('span', { class: 'ajuda', text: ajuda }) : null);
  };
  const blocos = ESQUEMA[tipo].map(([nomeBloco, campos], k) => el('details', { class: 'grupo', open: k === 0 || null }, el('summary', { text: nomeBloco }),
    el('div', { class: 'corpo-grupo' }, el('div', { class: 'form-2' }, campos.map(campo)))));
  // O fuso da entrega decide quais públicos o conjunto pode escolher (conferido de novo no servidor).
  if (ins.publicos && ins['entrega.fuso']) { const f = ins['entrega.fuso'].i; ins.publicos.i.conferirFuso(f.value); f.addEventListener('change', () => ins.publicos.i.conferirFuso(f.value)); }
  const prev = tipo === 'anuncio' ? previaAnuncio(ins.abordagem.i, ins.texto_saida.i, ins.tamanho_max.i, marca) : null;
  // Prompt da IA (DEC-096): o alvo é a campanha (e o anúncio), com o que está na tela por cima do que foi salvo.
  const campanhaDoAlvo = tipo === 'campanha' ? (o && o.id) : tipo === 'anuncio' ? ((conjuntosP().find(x => x.id === paiId) || {}).campanha || {}).id : null;
  const alvoPrompt = () => {
    const { nova } = ler();
    return { campanha_id: campanhaDoAlvo, anuncio_id: tipo === 'anuncio' && o ? o.id : '',
      rascunho: tipo === 'campanha' ? { ia: { prompt_texto: (nova.ia || {}).prompt_texto || '' } } : tipo === 'anuncio' && o ? { prompt_proprio: nova.prompt_proprio || '' } : {} };
  };
  if (ins['ia.prompt_texto'] && editar && o) {
    const caixa = ins['ia.prompt_texto'].i;
    caixa.closest('.campo').append(el('div', { class: 'acoes' }, btn('Começar do texto atual', async () => {
      if (caixa.value.trim() && !confirm('Trocar o que está no campo pelo texto montado pelos campos de "IA de resposta"?')) return;
      const r = await chamar('prosp_prompt_ver', { campanha_id: o.id, rascunho: { ia: { prompt_texto: '' } } });
      if (!r.ok) { rapida(r.mensagem || 'Não consegui.'); return; }
      caixa.value = r.montado || ''; caixa.dispatchEvent(new Event('input')); caixa.focus();
    }, 'sec')));
  }
  // Sugerir melhorias (DEC-098): "Usar este texto" traz o texto novo para o campo; o Jean revisa e salva (vira versão nova).
  if (ins['ia.prompt_texto'] && editar && o && est.textoSugerido && est.textoSugerido.campanha_id === o.id) {
    const caixa = ins['ia.prompt_texto'].i, g = caixa.closest('details');
    caixa.value = est.textoSugerido.texto; est.textoSugerido = null; if (g) g.open = true;
    setTimeout(() => { caixa.scrollIntoView({ block: 'center' }); rapida('O texto sugerido está no campo "Texto do prompt". Revise e salve a versão nova.'); }, 50);
  }
  if (prev) blocos[0].querySelector('.corpo-grupo').append(el('h3', { text: 'Como o lead vai ver' }), prev);
  const ler = () => {
    const nova = JSON.parse(JSON.stringify(cfg)), linhas = [];
    for (const [cam, { i, tp, rot }] of Object.entries(ins)) {
      const val = tp === 'dias' || tp === 'publicos' ? i.lerValor() : deTexto(tp, i.value.trim ? i.value.trim() : i.value);
      const antes = pegar(cfg, cam);
      if (tp === 'publicos' && JSON.stringify([...val].sort()) === JSON.stringify([...(antes || [])].sort())) continue;
      if (JSON.stringify(val) !== JSON.stringify(antes == null ? (tp === 'lista' || tp === 'dias' || tp === 'publicos' ? [] : '') : antes)) { colocar(nova, cam, val); linhas.push([rot, paraTexto(tp, antes), paraTexto(tp, val)]); }
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
    // Público com só o nome trocado: renomear (não cria versão nova).
    if (tipo === 'publico' && o && linhas.length === 1 && linhas[0][0] === 'Nome') {
      await fazer('prosp_publico_renomear', { id: o.id, nome }, { ok: 'Nome trocado.', erro: x => { erro.textContent = x.mensagem || 'Não consegui.'; }, depois: () => { est.publicos = null; rotear(); } }); return;
    }
    // Pôr um público num conjunto ativo muda quem recebe mensagem: nível 3 (o nome do conjunto), como trocar o número.
    const pubNovo = tipo === 'conjunto' && o && ativo(o.situacao) && (nova.publicos || []).some(x => !(cfg.publicos || []).includes(x));
    const dados = { id: o ? o.id : '', nome, config: nova, ...(tipo === 'conjunto' ? { numero_id: numeroSel.value } : {}), ...(o ? {} : tipo === 'conjunto' ? { campanha_id: paiId } : tipo === 'anuncio' ? { conjunto_id: paiId } : {}) };
    const nivel = trocaNumero || pubNovo ? 3 : (o && ativo(o.situacao)) || emUsoPub(pubAqui) ? 2 : 1;
    const acao = { campanha: 'prosp_campanha_salvar', conjunto: 'prosp_conjunto_salvar', anuncio: 'prosp_anuncio_salvar', publico: 'prosp_publico_salvar' }[tipo];
    const op = { titulo: 'Salvar ' + (o ? o.nome : nome), nivel, linhas, nome: o ? o.nome : nome, rotuloNome: 'o nome do conjunto', rotuloNivel: trocaNumero ? 'troca o número que envia' : pubNovo ? 'muda quem recebe mensagem' : null,
      texto: tipo === 'publico' && nivel >= 2 ? 'Um conjunto ativo usa este público: as próximas buscas usam a configuração nova (os contatos já achados ficam).'
        : nivel >= 2 ? 'Vira a versão nova: os próximos envios usam a configuração nova (os leads já sorteados continuam presos à versão deles).' : null,
      erro: x => { erro.textContent = x.mensagem || 'Não consegui salvar.'; },
      depois: x => { est.prosp = null; est.publicos = null; if (!o) irP(tipo, x.id); else rotear(); } };
    if (acao === 'prosp_campanha_salvar') await fazer('prosp_campanha_salvar', dados, op);
    else if (acao === 'prosp_conjunto_salvar') await fazer('prosp_conjunto_salvar', dados, op);
    else if (acao === 'prosp_publico_salvar') await fazer('prosp_publico_salvar', dados, op);
    else await fazer('prosp_anuncio_salvar', dados, op);
  };
  const versoes = (d.versoes || []);
  const acoesObj = o && editar && tipo !== 'publico' ? el('div', { class: 'acoes' },
    btn('Duplicar', () => fazer('prosp_duplicar', { tipo, id: o.id }, { ok: 'Cópia criada em rascunho.', depois: x => { est.prosp = null; irP(tipo, x.id); } }), 'sec'),
    o.situacao === 'rascunho' ? btn('Apagar o rascunho', () => fazer('prosp_apagar_rascunho', { tipo, id: o.id }, { titulo: 'Apagar o rascunho ' + o.nome, linhas: [['Rascunho', o.nome, '(apagado)']], botao: 'Apagar', perigo: true, ok: 'Rascunho apagado.', depois: () => { est.prosp = null; ir('prospeccao'); } }), 'perigo-sec') : null,
    btn('Encerrar', () => fazer('prosp_encerrar', { tipo, id: o.id }, { titulo: 'Encerrar ' + o.nome, nome: o.nome, rotuloNome: 'o nome da ' + P_NOME[tipo], rotuloNivel: 'não volta', botao: 'Encerrar',
      texto: tipo === 'campanha' ? 'Encerra a campanha com os conjuntos e anúncios dela. Não volta: para usar de novo, duplique.' : 'Não volta: para usar de novo, duplique.', ok: 'Encerrado.', depois: () => { est.prosp = null; ir('prospeccao'); } }), 'perigo-sec')) : null;
  trocar(c, cabecalho(titulo, (P_NOME[tipo] || tipo) + (o ? ` · ${o.id} · versão ${o.versao}` : tipo === 'publico' ? ' novo' : ' nova'), o ? etqSit(o.situacao) : null),
    el('div', { class: 'pilha' }, tipo === 'publico' && o ? abasPub(o.id, 'configuracao') : null,
      tipo === 'publico' && emUsoPub(pubAqui) ? el('div', { class: 'aviso info' }, icone('info'), el('div', { text: 'Um conjunto ativo usa este público: salvar pede confirmação (nível 2), e os contatos novos entram tirados.' })) : null,
      tipo === 'publico' && !o ? nota('O público guarda a busca no Google Maps e os contatos achados. Depois de criar, escolha o público num conjunto do mesmo fuso.') : null,
      o && o.pausa_motivo ? el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', { text: 'Pausado sozinho: ' + o.pausa_motivo })) : null,
      editar ? null : nota(o && /^(encerrad|arquivad)/.test(o.situacao) ? (o.situacao === 'arquivado' ? 'Arquivado: só leitura. Desarquive para mudar.' : 'Encerrado: só leitura. Para usar de novo, duplique.') : 'Editar está desligado (editar_prospeccao).', !o || !/^(encerrad|arquivad)/.test(o.situacao)),
      el('form', { class: 'cartao', onsubmit: salvar, novalidate: true }, el('div', { class: 'corpo p-topo-form' },
        el('div', { class: 'form-2' }, el('label', { class: 'campo', for: 'p-nome' }, el('span', { class: 'rot', text: 'Nome' }), nomeIn),
          numeroSel ? el('label', { class: 'campo', for: 'p-numero' }, el('span', { class: 'rot', text: 'Número de WhatsApp que envia' }), numeroSel, el('span', { class: 'ajuda', text: 'trocar o número de um conjunto = nível 3' })) : null)),
        ...blocos, el('div', { class: 'corpo' }, erro, editar ? el('div', { class: 'acoes' }, el('button', { class: 'btn pri', type: 'submit', text: o ? 'Salvar a versão nova' : 'Criar' })) : null)),
      acoesObj ? cartao('Mais', null, corpo(acoesObj)) : null,
      campanhaDoAlvo && o && (tipo === 'campanha' || tipo === 'anuncio') ? cartao('Prompt da IA', el('span', { class: 'mudo peq', text: 'com o que está na tela, mesmo sem salvar' }),
        corpo(el('p', { class: 'mudo peq', text: 'O texto exato que vai para a OpenAI (as regras fixas travadas) e uma conversa de teste, sem WhatsApp e sem lead.' }),
          el('div', { class: 'acoes' }, btn('Ver prompt completo', () => verPrompt(alvoPrompt()), 'sec', 'info'),
            ligada('editar_prospeccao') ? btn('Testar conversa', () => testarConversa(alvoPrompt(), o.nome), 'sec', 'conversa') : null))) : null,
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

// ---------- Públicos (sql/036, DEC-088): a busca e os contatos, independentes da campanha (como no Meta Ads)
// Contato = um negócio achado na busca (o telefone só com os 4 últimos dígitos). Quem nunca recebeu mensagem sai 90 dias
// depois de encontrado. Tirar um contato é um toque; pôr de volta num público que um conjunto ativo usa pede o nível 2.
const SIT_CONTATO = { disponivel: ['disponível', 'ok'], tirado: ['tirado', ''], em_conjunto: ['em conjunto', 'info'], abordado: ['já abordado', ''], nao_contatar: ['não contatar', 'perigo'],
  cliente: ['já é cliente', 'perigo'], demonstracao: ['pediu demonstração', 'perigo'], orgao_publico: ['órgão público', 'perigo'] };
const BLOQUEADO = ['nao_contatar', 'cliente', 'demonstracao', 'orgao_publico'];
const FILTROS_PUB = [['', 'Todos', 'tamanho'], ['disponivel', 'Disponíveis', 'disponiveis'], ['tirado', 'Tirados', 'tirados'], ['em_conjunto', 'Em conjuntos', 'em_conjunto'], ['abordado', 'Já abordados', 'abordados'],
  ['bloqueado', 'Bloqueados', 'bloqueados'], ['expirando', 'Saem em até 7 dias', 'expiram_7d']];
const etqContato = s => { const [t, tom] = SIT_CONTATO[s] || [s || '—', '']; return etq(t, tom); };
function abasPub(id, atual) {
  return el('div', { class: 'abas', role: 'tablist', 'aria-label': 'Partes do público' }, [['', 'Contatos'], ['configuracao', 'Configuração']].map(([k, n]) =>
    el('button', { role: 'tab', type: 'button', 'aria-selected': String(atual === k), onclick: () => irP('publico', id, k) }, n)));
}
const resumoBusca = p => [(p.termos || []).join(', '), (p.lugares || []).length ? 'em ' + p.lugares.join(', ') : ''].filter(Boolean).join(' ') || 'sem busca';
async function pPublicos(c) {
  topo('Públicos', [['Prospecção', 'prospeccao'], ['Públicos']], 'prospeccao');
  await arvoreP();
  const d = await publicosP(true); if (!est.publicos) { falhou(c, { ok: false, mensagem: 'Não consegui ler os públicos.' }, 'Públicos'); return; }
  const editar = ligada('editar_prospeccao'), lista = d.publicos || [], cm = d.creditos_mes || {};
  const linha = p => { const n = p.numeros || {}, cj = p.conjuntos || [];
    return el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irP('publico', p.id) }, el('span', { class: 'icone-caixa' }, icone('clientes')),
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: p.nome }),
        el('div', { class: 't2', text: `${resumoBusca(p)} · ${fusoNome(p.fuso)}` }),
        el('div', { class: 't2', text: `${fmtNum(n.disponiveis)} disponíveis de ${fmtNum(n.tamanho)}${n.expiram_7d ? ' · ' + fmtNum(n.expiram_7d) + ' saem em até 7 dias' : ''} · ${cj.length ? 'usado por ' + cj.map(j => j.nome).join(', ') : 'nenhum conjunto usa'}` })),
      el('div', { class: 'direita' }, p.situacao === 'arquivado' ? etqSit('arquivado') : emUsoPub(p) ? etq('em uso', 'ok') : etq('sem conjunto ativo', '')), icone('seta'))); };
  trocar(c, cabecalho('Públicos', 'quem pode receber mensagem · cada conjunto escolhe os seus', editar ? btn('Novo público', () => irP('publico', 'novo'), 'pri', 'mais_um') : null),
    el('div', { class: 'pilha' }, abasP('publicos'),
      d.busca_ligada ? null : el('div', { class: 'aviso info' }, icone('info'), el('div', {}, 'A busca está desligada (chave "Busca no Google Maps" em ', el('a', { href: '#ajustes', text: 'Ajustes' }), '). Os públicos não buscam nem gastam créditos.')),
      el('div', { class: 'kpis' }, kpiTeto(cm, editar), kpi('Públicos', fmtNum(lista.filter(p => p.situacao === 'ativo').length), 'ativos'),
        kpi('Contatos disponíveis', fmtNum(lista.reduce((t, p) => t + (Number((p.numeros || {}).disponiveis) || 0), 0)), 'em todos os públicos')),
      editar ? null : nota('Criar, editar, tirar e pôr contatos de volta estão desligados (editar_prospeccao).', true),
      cartao(null, null, lista.length ? el('ul', { class: 'lista' }, lista.map(linha))
        : vazio('Nenhum público ainda. Crie o primeiro: a busca no Google Maps (termos, cidades e filtros) e os contatos achados ficam nele; depois, escolha o público num conjunto do mesmo fuso.', 'clientes')),
      el('p', { class: 'mudo peq', text: 'O mesmo contato pode estar em vários públicos, mas recebe mensagem de um conjunto só. Quem nunca recebeu mensagem sai 90 dias depois de encontrado (achar de novo não reinicia).' })));
}
async function pPublico(c, parte, id, sub) {
  if (!id || id === 'novo' || sub === 'configuracao') return pObjeto(c, 'publico', id || 'novo');
  est.pubFiltro = est.pubFiltro && est.pubFiltro.id === id ? est.pubFiltro : { id, filtro: '', busca: '', pagina: 1 };
  const f = est.pubFiltro;
  const r = await chamar('prosp_publico', { id, filtro: f.filtro, busca: f.busca, pagina: f.pagina });
  const o = r.ok ? r.dados.objeto : null, titulo = o ? o.nome : 'Público';
  topo(titulo, [['Prospecção', 'prospeccao'], ['Públicos', 'prospeccao/publicos'], [titulo]], 'prospeccao/publicos');
  if (falhou(c, r, titulo)) return;
  await arvoreP();
  const d = r.dados, n = d.numeros || {}, emUso = !!d.em_uso, editar = ligada('editar_prospeccao') && o.situacao !== 'arquivado', cr = d.creditos || {};
  const recarregar = async () => { est.publicos = null; await rotear(); };
  // Tirar (um toque) e pôr de volta (nível 2 quando um conjunto ativo usa o público) um contato.
  const marcar = async (ct, valor) => fazer('prosp_publico_contato_marcar', { id: o.id, contato_id: ct.id, valor }, { nivel: valor === 'SIM' && emUso ? 2 : 1,
    titulo: 'Pôr de volta: ' + ct.nome, rotuloNivel: 'pode receber mensagem', linhas: [['Contato', 'tirado', 'selecionado (pode receber mensagem)']],
    texto: 'Um conjunto ativo usa este público: o contato pode receber mensagem já no próximo lote.', ok: valor === 'NAO' ? 'Tirado.' : 'Posto de volta.', depois: recarregar });
  const chave = ct => {
    if (!editar || BLOQUEADO.includes(ct.situacao) || ct.lead) return null;
    const sel = !!ct.selecionado;
    return el('button', { class: 'toggle', type: 'button', role: 'switch', 'aria-checked': String(sel), 'aria-label': (sel ? 'Tirar ' : 'Pôr de volta ') + ct.nome, onclick: async e => {
      const t = e.currentTarget; t.setAttribute('aria-checked', String(!sel));
      const x = await marcar(ct, sel ? 'NAO' : 'SIM');
      if (!x) t.setAttribute('aria-checked', String(sel));
      else if (sel) rapida('Tirado.', () => marcar(ct, 'SIM'));
    } });
  };
  const sobre = ct => {
    if (ct.lead) return `virou lead ${ct.lead.id} (${nomeP('conjunto', ct.lead.conjunto_id)})`;
    const dias = Number(ct.expira_em_dias);
    return `encontrado em ${fmtData(ct.encontrado_em)} · ${dias <= 0 ? 'sai hoje' : 'sai em ' + fmtNum(dias) + ' dia(s)'}`;
  };
  const contatos = d.contatos || [];
  const total = (FILTROS_PUB.find(x => x[0] === f.filtro) || FILTROS_PUB[0])[2], qtd = Number(n[total]) || 0, paginas = Math.max(1, Math.ceil(qtd / 50));
  const busca = el('input', { class: 'entrada', type: 'search', placeholder: 'Nome, cidade ou bairro', 'aria-label': 'Buscar contato', autocomplete: 'off', enterkeyhint: 'search', value: f.busca || null });
  busca.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); f.busca = busca.value.trim(); f.pagina = 1; rotear(); } });
  const lote = valor => fazer('prosp_publico_contatos_lote', { id: o.id, valor, todos: true }, { titulo: valor === 'SIM' ? 'Selecionar todos de ' + o.nome : 'Tirar todos de ' + o.nome,
    rotuloNivel: valor === 'SIM' ? 'podem receber mensagem' : 'ninguém deste público recebe',
    linhas: valor === 'SIM' ? [['Tirados', fmtNum(n.tirados), '0 (os bloqueados para sempre continuam de fora)']] : [['Selecionados', fmtNum((Number(n.tamanho) || 0) - (Number(n.tirados) || 0)), '0 (os que já são leads seguem no conjunto)']],
    ok: 'Pronto.', depois: recarregar });
  const acoes = editar ? [
    ligada('prosp_busca') ? btn('Buscar de novo', () => fazer('prosp_publico_buscar', { id: o.id }, { titulo: 'Buscar de novo: ' + o.nome, botao: 'Buscar',
      texto: 'Cada termo × lugar entra na fila (pula o que foi buscado há menos de "não repetir"). Os contatos novos se juntam aos de agora; gasta créditos do SerpAPI.', depois: recarregar }), 'pri', 'busca') : null,
    btn('Selecionar todos', () => lote('SIM'), 'sec', 'ok'), btn('Tirar todos', () => lote('NAO'), 'sec'),
    btn('Duplicar', () => fazer('prosp_publico_duplicar', { id: o.id }, { ok: 'Cópia criada.', depois: x => { est.publicos = null; irP('publico', x.id); } }), 'sec')] : [];
  const arquivar = ligada('editar_prospeccao') ? btn(o.situacao === 'arquivado' ? 'Desarquivar' : 'Arquivar', () => fazer('prosp_publico_arquivar', { id: o.id, valor: o.situacao === 'arquivado' ? 'NAO' : 'SIM' },
    { titulo: (o.situacao === 'arquivado' ? 'Desarquivar ' : 'Arquivar ') + o.nome, linhas: [['Situação', o.situacao, o.situacao === 'arquivado' ? 'ativo' : 'arquivado']], botao: o.situacao === 'arquivado' ? 'Desarquivar' : 'Arquivar',
      texto: o.situacao === 'arquivado' ? 'O público volta a poder ser escolhido num conjunto.' : 'Não busca nem entrega mais. Os contatos seguem o prazo de 90 dias. Só dá para arquivar quando nenhum conjunto usa.', depois: recarregar }), o.situacao === 'arquivado' ? 'sec' : 'perigo-sec') : null;
  trocar(c, cabecalho(o.nome, `público · ${o.id} · versão ${o.versao}`, etqSit(o.situacao)),
    el('div', { class: 'pilha' }, abasPub(o.id, ''),
      emUso ? el('div', { class: 'aviso info' }, icone('info'), el('div', { text: 'Um conjunto ativo usa este público: os contatos novos entram tirados, e pôr um contato de volta pede confirmação (nível 2).' })) : null,
      el('div', { class: 'etqs' }, (d.conjuntos || []).length ? (d.conjuntos || []).map(j => etq('conjunto ' + j.nome + (j.ativo ? ' (ativo)' : ''), j.ativo ? 'ok' : '', true)) : etq('nenhum conjunto usa', '', true),
        etq(`${fmtNum(cr.gastos)} de ${fmtNum(cr.limite)} créditos no mês`, '', true)),
      el('div', { class: 'kpis' }, kpi('Contatos', fmtNum(n.tamanho)), kpi('Disponíveis', fmtNum(n.disponiveis), 'podem receber mensagem'), kpi('Em conjuntos', fmtNum(n.em_conjunto), 'já viraram lead'),
        kpi('Saem em até 7 dias', fmtNum(n.expiram_7d), n.expira_em_dias != null ? 'o primeiro em ' + fmtNum(n.expira_em_dias) + ' dia(s)' : 'prazo de 90 dias')),
      acoes.length ? el('div', { class: 'acoes' }, acoes) : null,
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Situação do contato' }, FILTROS_PUB.map(([k, nome, campo]) => el('button', { type: 'button', 'aria-pressed': String(f.filtro === k),
        onclick: () => { f.filtro = k; f.pagina = 1; rotear(); } }, nome, el('span', { class: 'n', text: fmtNum(n[campo]) })))),
      el('div', { class: 'p-busca' }, busca, btn('Buscar', () => { f.busca = busca.value.trim(); f.pagina = 1; rotear(); }, 'sec', 'busca')),
      cartao(null, null, contatos.length ? el('ul', { class: 'lista' }, contatos.map(ct => el('li', {}, el('div', { class: 'linha' },
        el('span', { class: 'avatar ' + ((SIT_CONTATO[ct.situacao] || [])[1] || ''), text: iniciais(ct.nome), 'aria-hidden': 'true' }),
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: ct.nome }),
          el('div', { class: 't2', text: [[ct.cidade, ct.bairro].filter(Boolean).join(' · '), ct.nicho, ct.nota != null ? '★ ' + String(ct.nota).replace('.', ',') : null, fmtNum(ct.pontos) + ' pontos', ct.telefone_fim].filter(Boolean).join(' · ') }),
          el('div', { class: 't2', text: sobre(ct) })),
        el('div', { class: 'direita' }, etqContato(ct.situacao), chave(ct)))))) : vazio(f.filtro || f.busca ? 'Nenhum contato com esse filtro.' : 'Nenhum contato ainda. Toque em "Buscar de novo" (com a busca ligada) ou espere a busca agendada.', 'clientes')),
      paginas > 1 ? el('div', { class: 'acoes' }, f.pagina > 1 ? btn('Anteriores', () => { f.pagina--; rotear(); }, 'sec') : null, el('span', { class: 'mudo peq p-pagina', text: `página ${f.pagina} de ${paginas}` }),
        f.pagina < paginas ? btn('Próximos', () => { f.pagina++; rotear(); }, 'sec') : null) : null,
      (d.buscas || []).length ? cartao('Últimas buscas deste público', null, el('ul', { class: 'lista' }, d.buscas.slice(0, 5).map(b => el('li', {}, el('div', { class: 'linha' },
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${b.termo}${b.lugar ? ' em ' + b.lugar : ''}` }),
          el('div', { class: 't2', text: `${fmtHora(b.pedida_em)} · ${fmtNum(b.creditos)} crédito(s)` + (Object.keys(b.contagens || {}).length ? ' · ' + Object.entries(b.contagens).map(([k, v]) => `${MOTIVOS[k] || k.replace(/_/g, ' ')} ${v}`).join(' · ') : '') })),
        el('div', { class: 'direita' }, etq(b.situacao === 'feita' ? 'feita' : b.situacao === 'falhou' ? 'falhou' : b.situacao === 'rodando' ? 'buscando' : 'na fila', b.situacao === 'feita' ? 'ok' : b.situacao === 'falhou' ? 'perigo' : 'info'))))))) : null,
      arquivar ? cartao('Mais', null, corpo(el('div', { class: 'acoes' }, arquivar))) : null,
      el('p', { class: 'mudo peq', text: 'O telefone aparece só com os 4 últimos dígitos. No envio, tudo é conferido de novo: "não contatar", clientes, demonstração, órgão público, 60 dias entre campanhas, prazo e fuso.' })));
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
  await arvoreP(); await publicosP();
  sit = SIT_LEADS.includes(sit) ? sit : '';
  est.leadsFiltro = est.leadsFiltro || { conjunto_id: '', publico_id: '', busca: '', pagina: 1 };
  const f = est.leadsFiltro;
  const r = await chamar('prosp_leads', { situacao: sit, conjunto_id: f.conjunto_id, publico_id: f.publico_id || '', busca: f.busca, pagina: f.pagina }); if (falhou(c, r, 'Leads')) return;
  const d = r.dados, ps = d.por_situacao || {}, editar = ligada('editar_prospeccao');
  const selCj = el('select', { class: 'entrada', 'aria-label': 'Conjunto', onchange: e => { f.conjunto_id = e.target.value; f.pagina = 1; rotear(); } }, el('option', { value: '', text: 'Todos os conjuntos' }),
    conjuntosP().map(j => el('option', { value: j.id, text: `${j.campanha.nome} › ${j.nome}`, selected: f.conjunto_id === j.id })));
  const selPb = el('select', { class: 'entrada', 'aria-label': 'Público', onchange: e => { f.publico_id = e.target.value; f.pagina = 1; rotear(); } }, el('option', { value: '', text: 'Todos os públicos' }),
    (est.publicos.publicos || []).map(p => el('option', { value: p.id, text: p.nome, selected: f.publico_id === p.id })));
  const busca = el('input', { class: 'entrada', type: 'search', placeholder: 'Nome, cidade, bairro ou PX-…', 'aria-label': 'Buscar lead', autocomplete: 'off', enterkeyhint: 'search', value: f.busca || null });
  busca.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); f.busca = busca.value.trim(); f.pagina = 1; rotear(); } });
  const total = d.total || 0, paginas = Math.max(1, Math.ceil(total / 50));
  const exportar = () => fazer('prosp_exportar', { conjunto_id: f.conjunto_id, situacao: sit }, { titulo: 'Exportar os leads (CSV)', texto: 'O arquivo sai SEM telefone (DEC-079). Fica no registro da Central.', botao: 'Exportar',
    depois: x => { baixar(x.arquivo || 'leads.csv', x.csv || ''); } , ok: 'Arquivo pronto.' });
  trocar(c, cabecalho('Leads', `${fmtNum(total)} lead(s)${sit ? ' · ' + P_LEAD[sit][0] : ''}`, btn('Exportar CSV', exportar, 'sec')),
    el('div', { class: 'pilha' }, abasP('leads'),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Situação' }, el('button', { type: 'button', 'aria-pressed': String(!sit), onclick: () => { f.pagina = 1; ir('prospeccao/leads'); } }, 'Todos'),
        SIT_LEADS.filter(k => ps[k] || k === sit).map(k => el('button', { type: 'button', 'aria-pressed': String(sit === k), onclick: () => { f.pagina = 1; ir('prospeccao/leads/' + k); } }, P_LEAD[k][0], el('span', { class: 'n', text: ps[k] || 0 })))),
      el('div', { class: 'form-2' }, selCj, selPb), el('div', { class: 'p-busca' }, busca, btn('Buscar', () => { f.busca = busca.value.trim(); f.pagina = 1; rotear(); }, 'sec', 'busca')),
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
  const r = await chamar('prosp_lead', { id }); await publicosP();
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
          m.direcao === 'saiu' ? el('div', { class: 'p-quem', text: m.situacao === 'falhou' ? 'não saiu' + (m.erro ? ' (' + m.erro + ')' : '') : m.situacao === 'pendente' ? 'saindo…' : m.lida_em ? 'lida' : m.entregue_em ? 'entregue' : 'enviada' }) : null,
          m.prompt_id ? el('button', { class: 'p-ver-prompt', type: 'button', text: 'ver o prompt que ela usou', onclick: () => verPromptUsado(m.prompt_id) }) : null))) : vazio('Nenhuma mensagem ainda.', 'conversa')),
        el('div', { class: 'pilha' },
          cartao('Funil', null, corpo(el('div', { class: 'passos' }, FUNIL.map(([k, n]) => el('div', { class: 'passo' + (fu[k] ? '' : ' depois') }, el('span', { class: 'bola' }, icone(fu[k] ? 'ok' : 'relogio', 'p')),
            el('div', {}, el('div', { class: 'forte', text: n }), el('div', { class: 'mudo peq', text: fu[k] ? fmtHora(fu[k]) : '—' }))))),
            fu.saiu || fu.recusou ? el('p', { class: 'mudo peq mt', text: fu.saiu ? 'Pediu para sair em ' + fmtHora(fu.saiu) : 'Recusou em ' + fmtHora(fu.recusou) }) : null)),
          cartao('Dados do Maps', null, corpo(dados([['Cidade', [l.cidade, l.bairro].filter(Boolean).join(' · ')], ['Nicho', l.nicho], ['Categoria', l.categoria], ['Nota', l.nota == null ? '' : String(l.nota).replace('.', ',') + ' (' + fmtNum(l.avaliacoes) + ' avaliações)'],
            ['Público', l.publico_id ? nomePub(l.publico_id) : ''], ['Pontos', String(l.pontos)], ['Telefone', l.telefone_fim + (l.numero_revisar ? ' (número antigo, conferido no WhatsApp)' : '')], ['Origem do telefone', l.origem_telefone === 'wame' ? 'link wa.me do Maps' : 'Maps'],
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
  await arvoreP(); await publicosP();
  est.relP = est.relP || { dias: 30, nivel: 'anuncio', detalhar: '', conjunto_id: '', publico_id: '', visao: '' };
  const f = est.relP;
  const r = await chamar('prosp_relatorio', { de: somaDias(hojeISO(), 1 - f.dias), nivel: f.nivel, detalhar: f.detalhar, conjunto_id: f.conjunto_id, publico_id: f.publico_id || '' });
  if (falhou(c, r, 'Relatórios')) return;
  const d = r.dados;
  const visao = f.visao || ((d.colunas_salvas || {})['Padrão'] || {}).visao || 'desempenho';
  const cols = VISOES[visao] || VISOES.desempenho;
  const valor = (x, k) => { const n = x.numeros || {}, t = x.taxas || {}, cu = x.custos || {};
    if (k === 'entrega' || k === 'saida') return pct(t[k]);
    if (k === 'resposta' || k === 'positiva') return t[k] == null ? '—' : pct(t[k]) + (t[k + '_margem'] != null ? ' ± ' + String(t[k + '_margem']).replace('.', ',') : '');
    if (k === 'custo') return fmtReal(cu.total); if (/^por_/.test(k)) return cu[k] == null ? '—' : fmtReal(cu[k]);
    return fmtNum(n[k]); };
  const nomeLinha = x => { const base = d.nivel === 'numero' ? nomeP('numero', x.chave) : d.nivel === 'publico' ? ((d.publicos || {})[x.chave] || (x.chave ? nomePub(x.chave) : '(sem público)')) : nomeP(d.nivel, x.chave);
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
      el('div', { class: 'form-2 p-filtros' }, filtro('Nível', f.nivel, [['campanha', 'Campanha'], ['conjunto', 'Conjunto'], ['anuncio', 'Anúncio'], ['publico', 'Público'], ['numero', 'Número']], v => { f.nivel = v; }),
        filtro('Detalhar por', f.detalhar, DETALHES, v => { f.detalhar = v; }),
        filtro('Conjunto', f.conjunto_id, [['', 'Todos'], ...conjuntosP().map(j => [j.id, j.campanha.nome + ' › ' + j.nome])], v => { f.conjunto_id = v; }),
        filtro('Público', f.publico_id || '', [['', 'Todos'], ...(est.publicos.publicos || []).map(p => [p.id, p.nome])], v => { f.publico_id = v; })),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Colunas' }, Object.keys(VISOES).map(v => el('button', { type: 'button', 'aria-pressed': String(visao === v), onclick: () => { f.visao = v; rotear(); } }, { desempenho: 'Desempenho', funil: 'Funil', custos: 'Custos' }[v])),
        btn('Guardar como padrão', () => fazer('prosp_relatorio_salvar', { nome: 'Padrão', config: { visao } }, { ok: 'Visão guardada (no servidor, não no navegador).' }), 'fant')),
      cartao(null, null, (d.linhas || []).length ? el('div', { class: 'tabela-rolagem', tabindex: '0', 'aria-label': 'Tabela do relatório (role para o lado)' }, el('table', { class: 'dados-t' },
        el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: { campanha: 'Campanha', conjunto: 'Conjunto', anuncio: 'Anúncio', publico: 'Público', numero: 'Número' }[d.nivel] }), cols.map(k => el('th', { scope: 'col', text: COLUNAS[k] })))),
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
  await arvoreP(); await publicosP();
  est.buscasFiltro = est.buscasFiltro || { publico_id: '' };
  const f = est.buscasFiltro;
  const r = await chamar('prosp_buscas', { publico_id: f.publico_id || '' }); if (falhou(c, r, 'Buscas')) return;
  const d = r.dados, editar = ligada('editar_prospeccao'), pbs = pubsAtivos(), tot = d.creditos_total || null;
  // sql/036: a busca é de um público (o workflow 50 traz uma página por rodada e gasta créditos do SerpAPI; DEC-124).
  const buscar = () => fazer('prosp_buscar_agora', {}, { titulo: 'Buscar agora', texto: 'Uma busca por termo × lugar do público entra na fila (pula o que foi buscado há menos de "não repetir"); o workflow 50 traz uma página por rodada e gasta créditos do SerpAPI.',
    campos: [{ k: 'publico_id', rot: 'Público', opcoes: pbs.map(p => [p.id, p.nome]) }], botao: 'Buscar' });
  const SITB = { pedida: ['na fila', 'info'], rodando: ['buscando', 'atencao'], feita: ['feita', 'ok'], falhou: ['falhou', 'perigo'] };
  const selPb = el('select', { class: 'entrada', 'aria-label': 'Público', onchange: e => { f.publico_id = e.target.value; rotear(); } }, el('option', { value: '', text: 'Todos os públicos' }),
    (est.publicos.publicos || []).map(p => el('option', { value: p.id, text: p.nome, selected: f.publico_id === p.id })));
  trocar(c, cabecalho('Buscas', 'Google Maps pelo SerpAPI · uma página por rodada', editar && d.busca_ligada && pbs.length ? btn('Buscar agora', buscar, 'pri', 'busca') : null),
    el('div', { class: 'pilha' }, abasP('buscas'),
      d.busca_ligada ? null : el('div', { class: 'aviso info' }, icone('info'), el('div', {}, 'A busca está desligada (chave "Busca no Google Maps" em ', el('a', { href: '#ajustes', text: 'Ajustes' }), '). Nada gasta créditos.')),
      tot || (d.creditos_mes || []).length ? el('div', { class: 'kpis' }, tot ? kpiTeto(tot, editar) : null,
        (d.creditos_mes || []).map(x => kpi(nomePub(x.publico_id), `${fmtNum(x.gastos)} de ${fmtNum(x.limite)}`, 'créditos no mês (este público)', barraUso(x.gastos, x.limite)))) : null,
      el('div', { class: 'form-2' }, selPb),
      cartao('Últimas buscas', null, (d.buscas || []).length ? el('ul', { class: 'lista' }, d.buscas.map(b => el('li', {}, el('div', { class: 'linha' },
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: `${b.termo}${b.lugar ? ' em ' + b.lugar : ''}` }),
          el('div', { class: 't2', text: `${b.publico_id ? nomePub(b.publico_id) : nomeP('conjunto', b.conjunto_id)} · ${fmtHora(b.pedida_em)} · ${fmtNum(b.paginas_feitas)} de ${fmtNum(b.paginas)} página(s) · ${fmtNum(b.creditos)} crédito(s)` }),
          Object.keys(b.contagens || {}).length ? el('div', { class: 't2', text: Object.entries(b.contagens).map(([k, v]) => `${MOTIVOS[k] || k.replace(/_/g, ' ')} ${v}`).join(' · ') }) : null),
        el('div', { class: 'direita' }, etq(...(SITB[b.situacao] || [b.situacao, '']))))))) : vazio('Nenhuma busca ainda.', 'busca'))));
}
// O que cada número das contagens da busca quer dizer (sql/032, sql/034 e sql/036).
const MOTIVOS = { achados: 'achados', novos: 'novos', ja_no_publico: 'já no público', de_outro_publico: 'de outro público', outro_fuso: 'outro fuso', fixo: 'telefone fixo', invalido: 'sem telefone',
  revisar: 'número antigo', fechado: 'fechado', nota: 'nota', avaliacoes: 'avaliações', categoria: 'categoria', palavra: 'palavra', site: 'site', rede: 'rede', concorrente: 'concorrente', repetido: 'repetido',
  ja_na_base: 'já na base', cliente: 'cliente', demonstracao: 'pediu demonstração', nao_contatar: 'não contatar', orgao_publico: 'órgão público', abordado: 'outra campanha', pontos: 'pontuação baixa',
  sem_creditos: 'sem créditos', paginas_com_erro: 'erro' };
// Teto geral de créditos do SerpAPI no mês (todos os públicos juntos; nível 2).
function kpiTeto(tot, editar) {
  const mudar = () => fazer('prosp_creditos_teto_salvar', {}, { titulo: 'Teto geral de créditos do SerpAPI no mês', texto: 'Vale para todos os públicos juntos, por cima do limite de cada um. De 0 a 20.000. A busca para quando chega no teto.',
    linhas: [['Teto do mês', fmtNum(tot.teto), '(o que você digitar)']], campos: [{ k: 'valor', rot: 'Créditos por mês', inputmode: 'numeric', valor: String(tot.teto == null ? '' : tot.teto), obrig: true, erro: 'Digite o teto (0 a 20.000).' }],
    ok: 'Teto mudado.', depois: async () => { est.publicos = null; await rotear(); } });
  return kpi('Teto geral do mês', `${fmtNum(tot.gastos)} de ${fmtNum(tot.teto)}`, 'créditos do SerpAPI, todos os públicos', el('div', { class: 'p-teto' }, barraUso(tot.gastos, tot.teto), editar ? btn('Mudar o teto', mudar, 'sec') : null));
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

// ---------- Prompt da IA: ver inteiro e testar a conversa (sql/041, DEC-096)
// Ver: a parte editável (do anúncio, da campanha ou montada pelos campos) e as regras fixas, travadas (o servidor sempre
// põe; a página nunca manda). Sem dado de lead: a 2ª mensagem aparece com marcas no lugar dos dados.
const ORIGEM_PROMPT = { anuncio: 'prompt próprio do anúncio', campanha: 'texto do prompt da campanha', montado: 'montado pelos campos de "IA de resposta"' };
const blocoPrompt = (titulo, texto, travado) => el('div', { class: 'p-prompt' + (travado ? ' travado' : '') }, el('div', { class: 'p-prompt-cab' }, travado ? icone('cadeado', 'p') : null, el('b', { text: titulo })), el('pre', { text: texto || '' }));
async function verPrompt(alvo) {
  const r = await chamar('prosp_prompt_ver', alvo);
  if (!r.ok) { rapida(r.mensagem || 'Não consegui.'); return; }
  const fechar = janela(el('div', { class: 'janela larga', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-prompt' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-prompt', text: 'Prompt completo' })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    el('div', { class: 'corpo' },
      el('p', { class: 'mudo peq', text: `Modelo ${r.modelo} · até ${fmtNum(r.max_tokens)} tokens na resposta · memória das últimas ${fmtNum(r.memoria)} mensagens da conversa.` }),
      blocoPrompt('1. Parte editável (' + (ORIGEM_PROMPT[r.editavel.origem] || r.editavel.origem) + ')', r.editavel.texto),
      blocoPrompt('2. Regras que nunca mudam (Política v10)', r.fixas, true),
      el('p', { class: 'mudo peq', text: r.aviso || '' }),
      blocoPrompt('3. Segunda mensagem: dados do contato (os dados de verdade entram no lugar das marcas)', r.contato_modelo, true),
      el('p', { class: 'mudo peq', text: 'Depois vêm as mensagens da conversa. Nada disso guarda telefone.' })),
    el('div', { class: 'pe' }, btn('Copiar o prompt', async () => { try { await navigator.clipboard.writeText(r.completo); rapida('Copiado.'); } catch (e) { rapida('Não consegui copiar.'); } }, 'sec'), btn('Fechar', () => fechar(), 'pri'))));
}
async function verPromptUsado(promptId) {
  const r = await chamar('prosp_prompt_texto', { prompt_id: promptId });
  if (!r.ok || !r.texto) { rapida(r.mensagem || 'Este prompt não está mais guardado.'); return; }
  const fechar = janela(el('div', { class: 'janela larga', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-prompt-usado' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-prompt-usado', text: 'Prompt que a resposta usou (nº ' + promptId + ')' })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    el('div', { class: 'corpo' }, blocoPrompt('Texto completo (com as regras fixas no fim)', r.texto)), el('div', { class: 'pe' }, btn('Fechar', () => fechar(), 'pri'))));
}
// Testar conversa: a mesma montagem e a mesma limpeza da resposta de verdade, pelo workflow 52; sem WhatsApp, sem lead.
// A conversa de teste fica só nesta janela (some ao fechar). Até 15 mensagens do contato e 100 respostas por dia.
const BARRADA = { diz_ser_pessoa: 'seria barrada: diz ser uma pessoa (a conversa passaria para você)', preco: 'seria barrada: preço fora dos oficiais (a conversa passaria para você)' };
function testarConversa(alvo, nome) {
  const hist = [];
  const nomeIn = el('input', { class: 'entrada', id: 't-nome', autocomplete: 'off', maxlength: '80', value: 'Clínica Exemplo' });
  const nichoIn = el('input', { class: 'entrada', id: 't-nicho', autocomplete: 'off', maxlength: '60', value: 'dentista' });
  const cidadeIn = el('input', { class: 'entrada', id: 't-cidade', autocomplete: 'off', maxlength: '60', value: 'Curitiba' });
  const msgIn = el('textarea', { class: 'entrada', id: 't-msg', rows: '2', maxlength: '600', autocomplete: 'off', placeholder: 'Escreva como o contato escreveria' });
  const lista = el('ol', { class: 'p-conversa p-teste', 'aria-live': 'polite' });
  const erro = el('p', { class: 'erro', role: 'alert' });
  const mandar = el('button', { class: 'btn pri', type: 'submit', text: 'Mandar' });
  const desenhar = () => trocar(lista, ...hist.map(m => el('li', { class: 'p-bolha ' + (m.role === 'user' ? 'entrou' : 'saiu') },
    el('div', { class: 'p-quem', text: m.role === 'user' ? 'Contato (teste)' : 'IA' + (m.marca ? ' · marca ' + m.marca : '') }), el('p', { text: m.content }),
    m.barrada ? el('div', { class: 'p-quem p-barrada', text: BARRADA[m.barrada] || 'seria barrada' }) : null)));
  const enviar = async e => {
    e.preventDefault(); erro.textContent = '';
    const t = msgIn.value.trim(); if (!t) { msgIn.focus(); return; }
    if (hist.filter(m => m.role === 'user').length >= 15) { erro.textContent = 'No máximo 15 mensagens do contato. Feche e comece outra conversa.'; return; }
    hist.push({ role: 'user', content: t }); msgIn.value = ''; desenhar(); mandar.disabled = true;
    const r = await chamar('prosp_simular', { ...alvo, contato: { nome: nomeIn.value.trim(), nicho: nichoIn.value.trim(), cidade: cidadeIn.value.trim() },
      historico: hist.slice(-30).map(m => ({ role: m.role, content: m.content })) });
    mandar.disabled = false;
    if (!r.ok) { hist.pop(); msgIn.value = t; desenhar(); erro.textContent = r.mensagem || 'Não consegui.'; return; }
    hist.push({ role: 'assistant', content: r.texto || '(resposta vazia)', marca: r.marca, barrada: r.barrada }); desenhar(); msgIn.focus();
  };
  const fechar = janela(el('form', { class: 'janela larga', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-teste', onsubmit: enviar }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-teste', text: 'Testar conversa · ' + nome })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    el('div', { class: 'corpo' }, el('p', { class: 'mudo peq', text: 'Usa o prompt que está na tela (mesmo sem salvar), a mesma montagem e a mesma limpeza das respostas de verdade. Nada vai para o WhatsApp e nada fica guardado além do registro.' }),
      el('div', { class: 'form-2' }, el('label', { class: 'campo', for: 't-nome' }, el('span', { class: 'rot', text: 'Negócio (de mentira)' }), nomeIn),
        el('label', { class: 'campo', for: 't-nicho' }, el('span', { class: 'rot', text: 'Nicho' }), nichoIn), el('label', { class: 'campo', for: 't-cidade' }, el('span', { class: 'rot', text: 'Cidade' }), cidadeIn)),
      lista, el('label', { class: 'campo', for: 't-msg' }, el('span', { class: 'rot', text: 'Mensagem do contato' }), msgIn), erro),
    el('div', { class: 'pe' }, btn('Limpar a conversa', () => { hist.length = 0; desenhar(); }, 'sec'), mandar)));
  desenhar();
}

// ---------- Conversas (sql/043, DEC-098): revisar as conversas e pedir sugestões de melhoria do prompt
// "Revisar conversas" só lê (o telefone nunca vem do servidor). "Sugerir melhorias" manda à IA as conversas encerradas do
// filtro LIMPAS no servidor (sem nome, telefone, código, nicho ou cidade do contato); a resposta só aparece aqui, e nada
// muda sozinho: "Usar este texto" abre o editor da campanha com o texto novo, e o Jean salva.
const RESULTADOS = [['', 'Todas'], ['recusou', 'Recusou'], ['saiu', 'Saiu'], ['com_voce', 'Com você'], ['cadastrou', 'Cadastrou'], ['parou', 'Parou (7 dias)']];
const P_RES = { recusou: ['recusou', ''], saiu: ['saiu', 'perigo'], com_voce: ['com você', 'atencao'], cadastrou: ['cadastrou', 'ok'], parou: ['parou', 'atencao'], em_andamento: ['em andamento', 'info'] };
const etqRes = s => { const [t, tom] = P_RES[s] || [s || '—', '']; return etq(t, tom); };
async function pConversas(c) {
  topo('Conversas', [['Prospecção', 'prospeccao'], ['Conversas']], 'prospeccao');
  await arvoreP();
  est.convP = est.convP || { resultado: '', campanha_id: '', conjunto_id: '', anuncio_id: '', prompt_id: '', dias: '30', pagina: 0 };
  const f = est.convP;
  const r = await chamar('prosp_conversas', f); if (falhou(c, r, 'Conversas')) return;
  const mudar = (k, v) => { f[k] = v; if (k === 'campanha_id') { f.conjunto_id = ''; f.anuncio_id = ''; f.prompt_id = ''; } if (k === 'conjunto_id') f.anuncio_id = ''; f.pagina = 0; rotear(); };
  const camps = (est.prosp && est.prosp.campanhas) || [];
  const cjs = conjuntosP().filter(j => !f.campanha_id || j.campanha.id === f.campanha_id);
  const ans = (cjs.find(j => j.id === f.conjunto_id) || {}).anuncios || [];
  const sel = (rot, k, opcoes) => el('select', { class: 'entrada', 'aria-label': rot, onchange: e => mudar(k, e.target.value) }, opcoes.map(([v, t]) => el('option', { value: v, text: t, selected: String(f[k]) === String(v) })));
  const total = r.total || 0, paginas = Math.max(1, Math.ceil(total / 20)), editar = ligada('editar_prospeccao');
  const sugerir = !f.campanha_id ? nota('Escolha uma campanha para pedir sugestões de melhoria do prompt dela.')
    : !r.sugestoes_liberadas ? el('div', { class: 'aviso info' }, icone('cadeado'), el('div', { text: '"Sugerir melhorias" está travado até a revisão do teste de balanceamento ser assinada (DEC-098). Revisar as conversas já funciona.' }))
    : editar ? el('div', { class: 'acoes' }, btn('Sugerir melhorias', () => fazer('prosp_sugerir', { ...f }, { titulo: 'Sugerir melhorias no prompt de ' + nomeP('campanha', f.campanha_id),
        texto: 'As últimas conversas encerradas deste filtro vão para a IA sem o nome, o telefone, o código, a cidade ou o nicho do contato (nome do negócio, telefones, e-mails e links viram marcas). Nada fica guardado e nada muda sozinho: você revisa e decide.',
        campos: [{ k: 'quantidade', rot: 'Quantas conversas (1 a 20)', tipo: 'number', inputmode: 'numeric', valor: 10, min: 1, max: 20 }], botao: 'Pedir sugestões', silencioso: true,
        depois: x => mostrarSugestoes(x, f.campanha_id) }), 'pri', 'info')) : null;
  trocar(c, cabecalho('Conversas', `${fmtNum(total)} conversa(s) respondida(s) · sem o telefone`),
    el('div', { class: 'pilha' }, abasP('conversas'),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Resultado' }, RESULTADOS.map(([k, n]) => el('button', { type: 'button', 'aria-pressed': String(f.resultado === k), onclick: () => mudar('resultado', k) }, n))),
      el('div', { class: 'form-2' }, sel('Campanha', 'campanha_id', [['', 'Todas as campanhas'], ...camps.map(x => [x.id, x.nome])]),
        sel('Conjunto', 'conjunto_id', [['', 'Todos os conjuntos'], ...cjs.map(j => [j.id, (f.campanha_id ? '' : j.campanha.nome + ' › ') + j.nome])]),
        sel('Anúncio', 'anuncio_id', [['', 'Todos os anúncios'], ...ans.map(a => [a.id, a.nome])]),
        sel('Período', 'dias', [['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias']]),
        sel('Versão do prompt', 'prompt_id', [['', 'Todas as versões do prompt'], ...(r.versoes_prompt || []).map(v => [String(v.prompt_id), `Prompt nº ${v.prompt_id} · desde ${fmtData(v.desde)} · ${fmtNum(v.respostas)} resposta(s)`])])),
      sugerir,
      (r.conversas || []).length ? r.conversas.map(cv => cartao(cv.nome || cv.lead_id, etqRes(cv.resultado),
        corpo(el('p', { class: 'mudo peq', text: [cv.lead_id, `${nomeP('campanha', cv.campanha_id)} › ${nomeP('conjunto', cv.conjunto_id)}${cv.anuncio_id ? ' › ' + nomeP('anuncio', cv.anuncio_id) : ''}`,
            [cv.cidade, cv.nicho].filter(Boolean).join(' · '), 'última mensagem ' + fmtHora(cv.ultimo_contato_em), fmtNum(cv.ia_mensagens) + ' da IA', cv.passou_para_voce ? 'passou para você' : null].filter(Boolean).join(' · ') }),
          el('ol', { class: 'p-conversa' }, (cv.mensagens || []).map(m => el('li', { class: 'p-bolha ' + (m.direcao === 'entrou' ? 'entrou' : 'saiu') },
            el('div', { class: 'p-quem', text: (AUTOR[m.autor] || m.autor) + ' · ' + fmtHora(m.quando) }), el('p', { text: m.texto }),
            m.prompt_id ? el('button', { class: 'p-ver-prompt', type: 'button', text: 'ver o prompt que ela usou', onclick: () => verPromptUsado(m.prompt_id) }) : null))),
          el('div', { class: 'acoes' }, btn('Abrir o lead', () => irP('lead', cv.lead_id), 'sec'))))) : cartao(null, null, vazio('Nenhuma conversa respondida com esse filtro.', 'conversa')),
      paginas > 1 ? el('div', { class: 'acoes' }, f.pagina > 0 ? btn('Anteriores', () => { f.pagina--; rotear(); }, 'sec') : null, el('span', { class: 'mudo peq p-pagina', text: `página ${f.pagina + 1} de ${paginas}` }),
        f.pagina + 1 < paginas ? btn('Próximas', () => { f.pagina++; rotear(); }, 'sec') : null) : null));
}
// A resposta da IA só aparece aqui (nada fica guardado no servidor nem no navegador).
function mostrarSugestoes(r, campanhaId) {
  const fechar = janela(el('div', { class: 'janela larga', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-sugestoes' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-sugestoes', text: 'Sugestões para o prompt' })), el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: () => fechar() }, icone('fechar'))),
    el('div', { class: 'corpo' },
      el('p', { class: 'mudo peq', text: `A partir de ${fmtNum(r.conversas)} conversa(s) encerrada(s), sem os dados dos contatos. Nada mudou: revise antes de usar.` }),
      r.diagnostico ? blocoPrompt('Diagnóstico', r.diagnostico) : null,
      (r.sugestoes || []).map((x, k) => el('div', { class: 'p-sugestao' }, el('h3', { text: (k + 1) + '. ' + (x.onde || 'Sugestão') }),
        x.antes ? blocoPrompt('Antes', x.antes) : null, blocoPrompt('Depois', x.depois), x.porque ? el('p', { class: 'mudo peq', text: 'Por quê: ' + x.porque }) : null)),
      r.aviso ? el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', { text: r.aviso + ' O editor vai recusar até você corrigir.' })) : null,
      r.texto_novo ? blocoPrompt('Texto novo da parte editável (as regras fixas continuam no fim)', r.texto_novo) : null),
    el('div', { class: 'pe' }, r.texto_novo ? btn('Copiar o texto', async () => { try { await navigator.clipboard.writeText(r.texto_novo); rapida('Copiado.'); } catch (e) { rapida('Não consegui copiar.'); } }, 'sec') : null,
      r.texto_novo && ligada('editar_prospeccao') ? btn('Usar este texto', () => { est.textoSugerido = { campanha_id: campanhaId, texto: r.texto_novo }; fechar(); irP('campanha', campanhaId); }, 'pri') : btn('Fechar', () => fechar(), 'pri'))));
}
