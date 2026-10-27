// ---------------------------------------------------------------- assistente de gestão (workflow 13): painel lateral, aberto pelo ícone do alto
// O mesmo assistente responde no WhatsApp pelos números autorizados. Mexer na agenda: ele mostra o que vai fazer e pede a confirmação na conversa.
const CHAT = { hist: [], ocupado: false, pronto: false };
const CHAT_SUGESTOES = ['Como está minha agenda hoje?', 'Quem vem amanhã?', 'Quantas consultas a IA marcou esta semana?', 'Chegou algum documento de paciente?', 'Bloqueia sexta à tarde', 'Quarta não vou mais atender de manhã'];
let chatFecharJanela = null;
function chatBalao(de, texto) {
  const b = el('div', { class: 'balao' + (de === 'dono' ? ' eu' : '') });
  // o negrito do WhatsApp (*texto*) vira negrito; o resto é texto puro
  String(texto).split(/(\*[^*\n]+\*)/).forEach(p => { if (/^\*[^*\n]+\*$/.test(p)) b.append(el('strong', { text: p.slice(1, -1) })); else if (p) b.append(document.createTextNode(p)); });
  const m = $('chatMsgs'); m.append(b); m.scrollTop = m.scrollHeight;
  return b;
}
function chatAbrir() {
  const p = $('painelChat');
  const cab = el('div', { class: 'cab-chat' }, el('h2', { id: 'chatTitulo', text: 'Assistente de gestão' }),
    el('button', { class: 'btn-ic', type: 'button', 'aria-label': 'Fechar', onclick: chatFechar }, icone('fechar')));
  if (sem('assistente_dono')) {
    trocar(p, cab, el('div', { class: 'corpo-chat' }, travaPlano('Pergunte pela agenda, pelos resultados e pelos documentos, e peça para marcar, remarcar ou bloquear horários, aqui ou no seu WhatsApp.')));
  } else if (!ligado('assistente_dono_ativa')) {
    trocar(p, cab, el('div', { class: 'corpo-chat' }, el('p', { class: 'mudo', text: 'O assistente de gestão está desligado.' }),
      ehDono() ? btn('Ligar em Conta › Assistente de gestão', null, 'pri', null, { 'data-ir': 'conta/gestao' }) : el('p', { class: 'dica', text: 'Só o dono da conta liga o assistente.' })));
    CHAT.pronto = false;
  } else if (!CHAT.pronto) {
    CHAT.pronto = true; CHAT.hist = [];
    const txt = el('textarea', { class: 'entrada', id: 'chatTexto', rows: '1', 'aria-label': 'Sua pergunta', placeholder: 'Pergunte ou peça algo', enterkeyhint: 'send' });
    txt.addEventListener('input', () => cresce(txt));
    txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatEnviar(); } });
    trocar(p, cab, el('p', { class: 'dica pad-x', text: 'Também no seu WhatsApp, pelos números autorizados.' }),
      el('div', { class: 'chat-msgs', id: 'chatMsgs', role: 'log', 'aria-live': 'polite' }),
      el('div', { class: 'chat-sug', id: 'chatSugestoes' }, CHAT_SUGESTOES.map(t => el('button', { type: 'button', text: t, onclick: () => { txt.value = t; chatEnviar(); } }))),
      el('div', { class: 'chat-in' }, txt, el('button', { class: 'btn pri', type: 'button', id: 'chatEnviar', text: 'Enviar', onclick: chatEnviar })));
    chatBalao('assistente', 'Oi! Pergunte sobre a agenda, os resultados ou os documentos dos pacientes.' + (ligado('dono_pode_editar') ? ' Também posso marcar, remarcar e bloquear horários. Sempre mostro o que vou fazer e peço sua confirmação antes.' : ''));
  }
  p.hidden = false;
  const origem = document.activeElement;
  const tecla = e => { if (e.key === 'Escape' && !JANELAS.length) { e.preventDefault(); chatFechar(); } };
  document.addEventListener('keydown', tecla);
  chatFecharJanela = () => { document.removeEventListener('keydown', tecla); if (origem && origem.isConnected) origem.focus(); };
  if (!p.contains(document.activeElement)) { const f = $('chatTexto') || p.querySelector('button'); if (f) f.focus(); }
}
function chatFechar() {
  $('painelChat').hidden = true;
  if (chatFecharJanela) { const f = chatFecharJanela; chatFecharJanela = null; f(); }
}
// S11 (rxsync-sistema#203): quando o assistente pergunta "Confirma?", um cartão com "Confirmar" e "Não" manda a resposta
// por você (a confirmação continua sendo a próxima mensagem, como no WhatsApp). Depois de mudar algo, o workflow 13 diz o
// que mudou (só o que deu certo), num cartão, e o painel recarrega só a parte que mudou.
function chatConfirmacao() {
  const botoes = [];
  const responder = t => { botoes.forEach(b => { b.disabled = true; }); const c = $('chatTexto'); if (c) { c.value = t; chatEnviar(); } };
  botoes.push(btn('Confirmar', () => responder('Sim, confirmo.'), 'pri', 'ok'), btn('Não', () => responder('Não, deixa como está.'), 'sec', 'fechar'));
  const cartao = el('div', { class: 'chat-cartao', role: 'group', 'aria-label': 'Confirmar a mudança' }, el('div', { class: 'linha-botoes' }, botoes));
  const m = $('chatMsgs'); m.append(cartao); m.scrollTop = m.scrollHeight;
}
function chatMudou(lista) {
  const cartao = el('div', { class: 'chat-cartao' }, el('p', { class: 'legenda', text: 'O que mudou' }), el('ul', {}, lista.map(t => el('li', {}, icone('ok', 'p'), ' ' + t))));
  const m = $('chatMsgs'); m.append(cartao); m.scrollTop = m.scrollHeight;
}
function chatEnviar() {
  const caixa = $('chatTexto'), txt = caixa.value.trim();
  if (!txt || CHAT.ocupado) return;
  CHAT.ocupado = true; $('chatEnviar').disabled = true; caixa.value = ''; cresce(caixa);
  trocar($('chatSugestoes'));
  chatBalao('dono', txt);
  const espera = chatBalao('assistente', 'digitando…');
  const historico = CHAT.hist.slice(-12);
  CHAT.hist.push({ de: 'dono', texto: txt });
  c13(txt, historico).then(r => {
    espera.remove();
    const resp = (r && r.resposta) || 'Não consegui responder agora. Tente de novo em instantes.';
    chatBalao('assistente', resp); CHAT.hist.push({ de: 'assistente', texto: resp });
    document.querySelectorAll('#chatMsgs .chat-cartao button').forEach(b => { b.disabled = true; });
    const mudou = r && Array.isArray(r.mudou) ? r.mudou : null, areas = r && Array.isArray(r.areas) ? r.areas : [];
    if (mudou && mudou.length) chatMudou(mudou);
    if (r && r.confirmar === true) chatConfirmacao();
    // recarrega o que mudou (o servidor antigo não manda "mudou": aí recarrega a agenda e a grade, como antes)
    if (!mudou || areas.includes('agenda')) {
      const antes = JSON.stringify((AG.dados || []).map(a => [a.id, a.inicio, a.status]));
      Promise.resolve(agCarregar()).then(() => { if (JSON.stringify((AG.dados || []).map(a => [a.id, a.inicio, a.status])) !== antes) rapida('A agenda foi atualizada.'); }).catch(() => {});
    }
    if (!mudou || areas.includes('grade')) gradeCarregar();
    if (TELAS.resultados && TELAS.resultados.sec && !TELAS.resultados.sec.hidden) resultadosCarregar();
  }).catch(() => { espera.remove(); chatBalao('assistente', 'Sem conexão agora. Sua mensagem não foi enviada; tente de novo.'); })
    .then(() => { CHAT.ocupado = false; $('chatEnviar').disabled = false; caixa.focus(); });
}
