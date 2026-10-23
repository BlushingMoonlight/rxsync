// ---------------------------------------------------------------- IA da Central: o assistente ao lado e as propostas (DEC-145)
// O assistente só lê pelas telas da Central (sem o "nunca") e só PROPÕE: nada muda sem o Confirmar daqui, que roda a ação
// pela rx_central como o botão da tela (mesmo nível e mesmas chaves, DEC-085).
// - iPad deitado e computador (1180 px ou mais): painel à direita, a tela de trás continua à vista (o menu recolhe).
// - iPad em pé e celular: a mesma conversa em tela cheia, com "Fechar".
// A conversa fica SÓ na memória da página: some ao recarregar, em "Nova conversa" e ao sair (nada no armazenamento do
// navegador). O texto da IA vira só texto (textContent), nunca HTML nem link.
ICONES.assistente = 'M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5zM9 10.5h.01M12 10.5h.01M15 10.5h.01';
ICONES.metricas = 'M4 17a8 8 0 1 1 16 0M12 17l4-5M4 20h16';
// O 06 faz até 4 rodadas com a OpenAI, de até 60 segundos cada (até uns 4 minutos); a página espera isso com folga.
const ESPERA_ASSISTENTE = 270000;
const MSG_SEM_RESPOSTA = 'O assistente não respondeu agora. Tente de novo.';
const ia = { aberto: false, falas: [], esperando: false, desde: 0, rascunho: '', menuAntes: null, relogio: null };
const largoAssistente = () => matchMedia('(min-width: 1180px)').matches;

function esquecerAssistente() { ia.falas = []; ia.rascunho = ''; ia.esperando = false; fecharAssistente(); }
function alternarAssistente() { if (ia.aberto) fecharAssistente(); else abrirAssistente(); }
// texto: começa o campo com ele (o "Perguntar ao assistente" da ficha da clínica).
function abrirAssistente(texto) {
  if (!ligada('tela_assistente')) return;
  if (texto && !ia.esperando) ia.rascunho = texto;
  if (!ia.aberto) {
    ia.aberto = true;
    // No painel ao lado, o menu recolhe para sobrar espaço para a tela; ao fechar, volta como estava.
    if (largoAssistente() && !est.recolhida) { ia.menuAntes = false; est.recolhida = true; $('app').classList.add('recolhida'); montarNav(); }
    $('app').classList.add('com-assistente'); $('assistente').hidden = false;
    ia.relogio = setInterval(tiqueAssistente, 1000);
  }
  desenharAssistente();
  const b = $('btn-assistente'); if (b) b.setAttribute('aria-expanded', 'true');
  setTimeout(() => { const t = $('ia-texto'); if (t && !t.disabled) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 30);
}
function fecharAssistente() {
  if (!ia.aberto) return;
  ia.aberto = false;
  clearInterval(ia.relogio);
  $('app').classList.remove('com-assistente'); $('assistente').hidden = true; trocar($('assistente'));
  if (ia.menuAntes === false) { est.recolhida = false; $('app').classList.remove('recolhida'); ia.menuAntes = null; montarNav(); }
  const b = $('btn-assistente'); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ia.aberto && !$('camada').firstChild) fecharAssistente(); });

// A cada segundo: o tempo do "Pensando…" e as propostas que venceram (30 minutos).
function tiqueAssistente() {
  const t = $('ia-tempo');
  if (t && ia.esperando) { const s = Math.floor((Date.now() - ia.desde) / 1000); t.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  let mudou = false;
  for (const f of ia.falas) for (const p of f.propostas || []) if (p.estado === 'aberta' && p.vence_em && Date.now() > Date.parse(p.vence_em)) { p.estado = 'vencida'; mudou = true; }
  if (mudou) desenharFalas();
}

function desenharAssistente() {
  const a = $('assistente');
  const texto = el('textarea', { class: 'entrada', id: 'ia-texto', rows: '3', maxlength: '500', autocomplete: 'off', 'aria-describedby': 'ia-conta', placeholder: 'Pergunte sobre as clínicas, o dinheiro, o uso ou a prospecção…', value: ia.rascunho });
  texto.value = ia.rascunho;
  const conta = el('span', { class: 'ajuda', id: 'ia-conta', text: ia.rascunho.length + '/500' });
  texto.addEventListener('input', () => { ia.rascunho = texto.value; conta.textContent = texto.value.length + '/500'; });
  texto.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); enviarPergunta(); } });
  const form = el('form', { class: 'ia-form', onsubmit: e => { e.preventDefault(); enviarPergunta(); } },
    el('label', { class: 'campo', for: 'ia-texto' }, el('span', { class: 'rot', text: 'Sua pergunta' }), texto, conta),
    el('div', { class: 'acoes' }, el('button', { class: 'btn pri', type: 'submit', id: 'ia-enviar', text: 'Enviar' })));
  trocar(a,
    el('div', { class: 'ia-cab' }, el('span', { class: 'icone-caixa' }, icone('assistente')), el('div', { class: 'texto' }, el('h2', { text: 'Assistente' }), el('p', { class: 'mudo peq', text: 'IA da Central' })),
      el('button', { class: 'btn-ic', type: 'button', id: 'ia-nova', 'aria-label': 'Nova conversa', title: 'Nova conversa', onclick: () => { ia.falas = []; ia.rascunho = ''; desenharAssistente(); } }, icone('atualizar')),
      el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar o assistente', onclick: fecharAssistente }, icone('fechar'))),
    el('p', { class: 'ia-aviso' }, icone('cadeado', 'p'), el('span', { text: 'Usa a OpenAI. Nunca recebe CPF, CNPJ, senhas, chaves, dados de pacientes nem o texto das conversas; e-mails e telefones vão mascarados. Nada muda sem você tocar em Confirmar.' })),
    el('div', { class: 'ia-falas', id: 'ia-falas', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversa com o assistente' }),
    el('div', { class: 'ia-pensando', id: 'ia-pensando', role: 'status' }),
    form);
  desenharFalas();
}
function desenharFalas() {
  const lista = $('ia-falas'); if (!lista) return;
  trocar(lista, ia.falas.length ? ia.falas.map(fala) : el('div', { class: 'ia-vazio' }, el('p', { class: 'mudo', text: 'Exemplos:' }),
    el('ul', {}, ['Quantas clínicas estão no ar e quanto entra por mês?', 'Quais testes grátis terminam nesta semana?', 'Como está a prospecção hoje?'].map(t => el('li', {},
      el('button', { class: 'ia-exemplo', type: 'button', text: t, onclick: () => { ia.rascunho = t; const x = $('ia-texto'); if (x && !x.disabled) { x.value = t; x.focus(); x.dispatchEvent(new Event('input')); } } }))))));
  const p = $('ia-pensando');
  trocar(p, ia.esperando ? [el('span', { class: 'ia-ponto', 'aria-hidden': 'true' }), el('span', { text: 'Pensando… pode levar até uns 4 minutos.' }), el('span', { class: 'mudo num', id: 'ia-tempo', 'aria-hidden': 'true', text: '0:00' })] : []);
  const t = $('ia-texto'), b = $('ia-enviar'), n = $('ia-nova');
  if (t) t.disabled = ia.esperando; if (b) b.disabled = ia.esperando; if (n) n.disabled = ia.esperando;
  lista.scrollTop = lista.scrollHeight;
}
const horaCurta = d => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function fala(f) {
  const quem = f.papel === 'jean' ? 'Você' : 'Assistente';
  return el('div', { class: 'ia-fala ' + f.papel },
    el('div', { class: 'ia-quem mudo peq' }, el('span', { class: 'forte', text: f.papel === 'erro' ? 'Assistente' : quem }), ' · ' + horaCurta(f.hora)),
    f.papel === 'erro' ? el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', { text: f.texto })) : textoIa(f.texto),
    (f.propostas || []).map(cartaoProposta));
}
// Só texto: as quebras de linha viram parágrafos e as linhas com "- " ou "• " viram tópicos. Nada vira HTML nem link.
function textoIa(t) {
  const caixa = el('div', { class: 'ia-texto' }); let lista = null;
  for (const linha of String(t || '').split('\n')) {
    const m = linha.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (m) { if (!lista) { lista = el('ul'); caixa.append(lista); } lista.append(el('li', { text: m[1] })); }
    else { lista = null; if (linha.trim()) caixa.append(el('p', { text: linha })); }
  }
  return caixa;
}

async function enviarPergunta() {
  const texto = String(ia.rascunho || '').trim();
  if (ia.esperando || !texto) { const t = $('ia-texto'); if (t && !texto) t.focus(); return; }
  // As últimas 6 falas vão junto (o servidor corta em 1.000 letras cada e mascara).
  const historico = ia.falas.filter(f => f.papel === 'jean' || f.papel === 'assistente').slice(-6).map(f => ({ papel: f.papel, texto: String(f.texto).slice(0, 1000) }));
  ia.falas.push({ papel: 'jean', texto, hora: new Date() });
  ia.rascunho = ''; const t = $('ia-texto'); if (t) { t.value = ''; t.dispatchEvent(new Event('input')); }
  ia.esperando = true; ia.desde = Date.now();
  desenharFalas();
  const r = await chamar('assistente_perguntar', { texto, historico }, { limite: ESPERA_ASSISTENTE, mensagemLimite: MSG_SEM_RESPOSTA });
  ia.esperando = false;
  if (r.ok) ia.falas.push({ papel: 'assistente', texto: String(r.texto || ''), hora: new Date(), propostas: (r.propostas || []).map(p => ({ ...p, estado: 'aberta' })) });
  else {
    ia.falas.push({ papel: 'erro', texto: r.tempo_esgotado ? MSG_SEM_RESPOSTA : (r.mensagem || MSG_SEM_RESPOSTA), hora: new Date() });
    if (r.desligada) { est.chaves.tela_assistente = 'NAO'; montarNav(); }
  }
  if (!ia.aberto) { rapida(r.ok ? 'O assistente respondeu.' : 'O assistente não respondeu.', () => abrirAssistente()); return; }
  desenharFalas();
  const x = $('ia-texto'); if (x) x.focus();
}

// ---------- propostas: Agora × Depois, Confirmar (nível da ação) e Descartar
const ROT_PROPOSTA = { dias: 'Dias a mais', data: 'Data', valor: 'Valor', plano: 'Plano', motivo: 'Motivo', combinado: 'Combinado', recurso: 'Recurso', ate: 'Até',
  suspensao_motivo: 'Motivo da suspensão', id: 'Código', tipo: 'Tipo', nome: 'Nome', situacao: 'Situação', ativo: 'Assistente atendendo', cancelar_em: 'Cancelamento' };
const textoValor = v => v == null || v === '' ? '' : typeof v === 'boolean' ? (v ? 'sim' : 'não') : typeof v === 'object' ? JSON.stringify(v) : String(v);
const nomeCampo = k => ROTULOS[k] || NOME_CHAVE[k] || ROT_PROPOSTA[k] || String(k).replace(/_/g, ' ');
function linhasProposta(p) {
  const a = p.antes || {}, d = p.depois || {};
  if (p.acao === 'ligar_chave') return [[nomeCampo(d.chave), a.valor === 'SIM' ? 'ligada' : 'desligada', d.valor === 'SIM' ? 'ligada' : 'desligada']];
  const ca = a.campos || {}, cd = d.campos || {}, linhas = [];
  for (const k of new Set([...Object.keys(ca), ...Object.keys(cd)])) linhas.push([nomeCampo(k), textoValor(ca[k]), textoValor(cd[k])]);
  for (const k of Object.keys(d)) if (!['campos', 'cliente_id'].includes(k)) linhas.push([nomeCampo(k), textoValor(a[k]), textoValor(d[k])]);
  return linhas;
}
const ESTADO_PROPOSTA = { aberta: null, confirmada: ['confirmada', 'ok'], descartada: ['descartada', ''], vencida: ['vencida', 'atencao'] };
function cartaoProposta(p) {
  const a = p.antes || {}, linhas = linhasProposta(p), nivel = Number(p.nivel) || 2, st = ESTADO_PROPOSTA[p.estado];
  return el('section', { class: 'ia-proposta' + (p.estado !== 'aberta' ? ' fechada' : ''), 'aria-label': 'Proposta ' + p.id },
    el('div', { class: 'ia-proposta-cab' }, el('span', { class: 'nivel' + (nivel === 3 ? ' n3' : ''), text: 'Proposta · nível ' + nivel }), st ? etq(st[0], st[1]) : null),
    el('p', { class: 'forte', text: p.resumo || 'Mudança proposta' }),
    a.clinica ? el('p', { class: 'mudo peq', text: a.clinica + (a.situacao ? ' · ' + a.situacao : '') + (a.plano ? ' · ' + a.plano : '') }) : null,
    linhas.length ? tabelaAntesDepois(linhas) : null,
    p.estado === 'aberta' ? [el('p', { class: 'mudo peq', text: 'Vence às ' + (p.vence_em ? horaCurta(new Date(p.vence_em)) : '—') + '. ' + (nivel === 3 ? 'Pede o nome para confirmar.' : nivel === 2 ? 'Pede a confirmação.' : 'Só roda com o seu toque em Confirmar.') }),
      el('div', { class: 'acoes' }, btn('Descartar', () => descartarProposta(p), 'sec'), btn('Confirmar', () => confirmarProposta(p), nivel === 3 ? 'perigo' : 'pri'))]
      : p.estado === 'confirmada' && p.registro ? el('div', { class: 'acoes' }, btn('Desfazer', () => desfazer(p.registro), 'sec')) : null);
}
// Confirmar: roda pela rx_central com o nível da proposta. Nível 1 = o próprio toque em Confirmar no cartão; 2 = a janela
// com Agora × Depois; 3 = também o nome. Se o servidor pedir mais, pergunta de novo uma vez, como o fazer.
async function confirmarProposta(p, nivelPedido) {
  const nivel = nivelPedido || Number(p.nivel) || 2;
  const v = await pedirAcao('proposta_confirmar', { proposta_id: String(p.id) }, { nivel, titulo: p.resumo || 'Confirmar a proposta', linhas: linhasProposta(p), nome: p.nome_nivel3,
    rotuloNome: p.acao === 'ligar_chave' || /^prosp_/.test(p.acao) ? 'o nome' : 'o nome da clínica',
    texto: 'Proposta do assistente. Roda como o botão da tela, com o mesmo nível, e fica no registro com "via assistente".' });
  if (!v) return;
  const r = await chamar('proposta_confirmar', v);
  if (!r.ok && r.nivel > nivel && !nivelPedido) return confirmarProposta(p, r.nivel);
  if (!r.ok) {
    if (/vencida/.test(r.mensagem || '')) p.estado = 'vencida'; else if (/descartada/.test(r.mensagem || '')) p.estado = 'descartada'; else if (/confirmada/.test(r.mensagem || '')) p.estado = 'confirmada';
    desenharFalas(); rapida(r.mensagem || 'Não consegui.'); return;
  }
  p.estado = 'confirmada'; p.registro = r.pode_desfazer && r.registro_id ? r.registro_id : null;
  desenharFalas();
  if (p.acao === 'ligar_chave') await carregarConfig();
  est.clientes = null; await rotear();
  rapida(r.aviso_email || r.mensagem || 'Feito.', p.registro ? () => desfazer(p.registro) : null);
}
async function descartarProposta(p) {
  const r = await chamar('proposta_descartar', { proposta_id: String(p.id) });
  if (r.ok || /já foi/.test(r.mensagem || '')) p.estado = r.ok ? 'descartada' : /vencida/.test(r.mensagem) ? 'vencida' : p.estado;
  desenharFalas();
  rapida(r.ok ? 'Proposta descartada.' : (r.mensagem || 'Não consegui.'));
}

// ---------------------------------------------------------------- Análise › Métricas (DEC-146)
TELAS.metricas = async c => {
  topo('Métricas', [['Análise'], ['Métricas']]);
  const r = await chamar('metricas'); if (falhou(c, r, 'Métricas')) return;
  const d = r.dados || {}, m = d.mrr || {}, can = d.cancelamentos_mes || {}, conv = d.conversao_teste_90d || {}, ci = d.custo_ia_mes || {}, uso = d.uso_ia_central_mes || {};
  const regra = t => t ? el('p', { class: 'mudo peq', text: t }) : null;
  const tok = x => x ? `${fmtNum(x.tokens_entrada)} de entrada · ${fmtNum(x.tokens_saida)} de saída` : '—';
  trocar(c, cabecalho('Métricas', 'os números do mês, sem a clínica interna'), el('div', { class: 'pilha' },
    el('div', { class: 'kpis' }, kpi('MRR', fmtReal(m.total), 'receita recorrente do mês'), kpi('Pagantes no ar', fmtNum(d.pagantes_no_ar)),
      kpi('Ticket médio', d.ticket_medio == null ? '—' : fmtReal(d.ticket_medio), 'MRR ÷ pagantes'), kpi('Cancelamentos do mês', fmtNum(can.clinicas), fmtReal(can.receita_perdida) + ' perdidos')),
    el('div', { class: 'grade-2 iguais' },
      cartao('MRR por tipo', null, corpo(dados([['Mensal', fmtReal(m.mensal)], ['Anual parcelado', fmtReal(m.anual_parcelado)], ['Anual à vista (÷ 12)', fmtReal(m.anual_a_vista_mes)], ['Total', fmtReal(m.total)]]), regra(m.regra))),
      cartao('Teste grátis e go-live (90 dias)', null, corpo(dados([['Testes começados', fmtNum(conv.testes)], ['Viraram contrato', fmtNum(conv.viraram_contrato)],
        ['Conversão', conv.percentual == null ? '—' : String(conv.percentual).replace('.', ',') + '%'], ['Dias até o go-live (média)', d.dias_ate_go_live_90d == null ? '—' : String(d.dias_ate_go_live_90d).replace('.', ',')]]),
        regra(conv.regra), regra(can.regra)))),
    cartao(ci.nome || 'Custo de IA (Central e prospecção)', ci.preco_preenchido ? null : etq('sem o preço', 'atencao'), corpo(
      el('div', { class: 'grade-2 iguais' },
        dados([['Central (assistente)', tok(ci.central) + (ci.preco_preenchido ? ' · ' + fmtReal((ci.central || {}).reais) : '')],
          ['Prospecção', tok(ci.prospeccao) + (ci.preco_preenchido ? ' · ' + fmtReal((ci.prospeccao || {}).reais) : '')], ['Total do mês', ci.preco_preenchido ? fmtReal(ci.total_reais) : '—']]),
        el('div', { class: 'cartao kpi ia-mensagens' }, el('div', { class: 'rot', text: 'Mensagens do atendimento no mês' }), el('div', { class: 'val num', text: fmtNum(ci.mensagens_atendimento_mes) }),
          el('div', { class: 'var', text: 'todas as clínicas; fora do custo acima' }))),
      el('div', { class: 'aviso info mt' }, icone('info'), el('div', { text: ci.aviso || 'O atendimento das clínicas não entra: o banco só conta as mensagens, não os tokens.' })),
      ci.preco_preenchido ? null : el('div', { class: 'aviso atencao mt' }, icone('alerta'), el('div', {}, 'Preencha o preço por mil tokens (entrada e saída) em Prospecção › Custos para ver o custo em reais.',
        ligada('tela_prospeccao') ? [' ', el('a', { href: '#prospeccao/custos', text: 'Abrir Custos' })] : null)))),
    cartao('Uso do assistente no mês', null, corpo(dados([['Perguntas', fmtNum(uso.perguntas)], ['Propostas', fmtNum(uso.propostas)], ['Confirmadas', fmtNum(uso.confirmadas)]])))));
};
