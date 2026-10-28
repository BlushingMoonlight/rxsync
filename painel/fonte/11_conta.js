// ---------------------------------------------------------------- Conta (molde D): Assinatura e WhatsApp · Pessoas · Dados e contrato · Ajuda · Sair · Excluir a conta
// O que a equipe não pode ver some (Plano, Equipe, Acessos, Baixar dados, Reconectar); o que ela vê mas não muda fica travado (DEC-115).
const VOLTA_CONTA = ['conta', 'Conta'];
tela('conta', {
  montar: () => [cabTela('Conta'), el('div', { id: 'listaConta' },
    el('div', { class: 'bloco' }, el('h2', { text: 'Assinatura e WhatsApp' }), el('div', { class: 'lista' }, ehDono() ? linhaLink('Plano e pagamento', 'Sua assinatura RXSync', 'conta/assinatura', 'cartao', RO.plano || null) : null,
      linhaLink('WhatsApp da clínica', 'O número que a assistente atende', 'conta/whatsapp', 'zap', foneBonito(RO.numero_whatsapp) || null))),
    el('div', { class: 'bloco' }, el('h2', { text: 'Pessoas' }), el('div', { class: 'lista' }, ehDono() ? linhaLink('Equipe', 'Quem mais entra no painel', 'conta/equipe', 'equipe') : null,
      ehDono() ? linhaLink('Acessos recentes', 'Quem entrou no painel e o que fez', 'conta/acessos', 'relogio') : null,
      linhaLink('Assistente de gestão', 'Seu assistente pessoal e o resumo do dia', 'conta/gestao', 'brilho', sem('assistente_dono') ? 'Plano Gestão' : ligado('assistente_dono_ativa') ? 'Ligado' : 'Desligado'))),
    el('div', { class: 'bloco' }, el('h2', { text: 'Dados e contrato' }), el('div', { class: 'lista' }, linhaLink('Contato e responsável técnico', 'E-mail, telefones e quem responde pelo conteúdo', 'conta/contato', 'conta'),
      linhaLink('Dados do contrato', 'Razão social, CNPJ e representante', 'conta/contrato', 'escudo'), ehDono() ? linhaLink('Baixar meus dados', 'A agenda e os pacientes em planilha', 'conta/dados', 'baixar') : null)),
    el('div', { class: 'bloco' }, el('h2', { text: 'Ajuda' }), el('div', { class: 'lista' },
      linhaLink('O que mudou no painel', 'Onde ficou cada coisa', 'conta/mudou', 'info'),
      el('a', { class: 'linha', href: 'mailto:contato@rxsync.com.br' }, el('span', { class: 'ic' }, icone('chat')), el('span', { class: 'tx' }, el('span', { class: 't1', text: 'Falar com a RXSync' }), el('span', { class: 't2', text: 'contato@rxsync.com.br' })), el('span', { class: 'seta' }, icone('seta'))),
      el('a', { class: 'linha', href: '/termos/' + VERSAO_TERMOS + '.html', target: '_blank', rel: 'noopener' }, el('span', { class: 'ic' }, icone('documento')), el('span', { class: 'tx' }, el('span', { class: 't1', text: 'Termos de Uso' })), el('span', { class: 'seta' }, icone('seta'))),
      el('a', { class: 'linha', href: '/privacidade.html', target: '_blank', rel: 'noopener' }, el('span', { class: 'ic' }, icone('escudo')), el('span', { class: 'tx' }, el('span', { class: 't1', text: 'Política de Privacidade' })), el('span', { class: 'seta' }, icone('seta')))))),
    el('div', { class: 'bloco' }, el('button', { class: 'btn sec plena', type: 'button', id: 'btnSair', onclick: e => sairPainel(e.currentTarget) }, icone('sair', 'p'), 'Sair do painel'),
      el('p', { class: 'legenda pilha', text: 'Sair encerra a sessão e esquece este aparelho: na próxima vez, o painel pede o e-mail, a senha e o código.' })),
    ehDono() ? el('div', { class: 'perigo-zona' }, btn('Cancelar e excluir a conta', () => ir('conta/assinatura'), 'perigo-sec plena')) : null]
});
const foneBonito = n => { const d = String(n || '').replace(/\D/g, ''); return d.length === 13 || d.length === 12 ? '+' + d.slice(0, 2) + ' (' + d.slice(2, 4) + ') ' + d.slice(4, -4) + '-' + d.slice(-4) : n; };

// ---------------------------------------------------------------- Plano e pagamento (o servidor cita "Conta › Plano e pagamento")
// Preços: cópia dos oficiais (tabela precos do banco; scripts/precos_oficiais.json). O servidor decide o valor de verdade.
const ASSIN_PRECOS = {
  essencial: { nome: "Essencial", mensal: "299", parcelado: "269,10", avista: "2.990,00",
    itens: ['Atendimento 24 horas por texto e áudio', 'Agenda da RXSync e integração com o Reservio', 'Lembretes com confirmação', 'Retomada de conversas paradas', 'Painel com resultados', 'Até 3 pessoas da equipe no painel', 'Instruções extras até 500 letras'] },
  gestao: { nome: "Gestão Inteligente", mensal: "599", parcelado: "539,10", avista: "5.990,00",
    itens: ['Tudo do Essencial', 'Lista de espera e avaliação no Google', 'Avisos de retorno e convite para quem sumiu', 'Agenda por profissional e perguntas antes de marcar', 'Leitura de fotos e PDFs e a aba Pacientes', 'Assistente de gestão', 'Instruções extras até 2.000 letras', 'Em implantação: integração com sistema de gestão e acompanhamento de orçamentos'] }
};
const assinSufixo = forma => forma === 'avista' ? '/ano' : '/mês';
const assinForma = forma => forma === 'avista' ? 'anual à vista' : forma === 'parcelado' ? 'anual em 12x' : 'mensal';
tela('conta/assinatura', {
  montar: () => [cabTela('Plano e pagamento', { voltar: VOLTA_CONTA }), el('div', { id: 'assinConteudo' }, el('div', { class: 'cartao' }, esqueleto()))],
  entrar: () => assinCarregar()
});
function assinCarregar() {
  const box = $('assinConteudo');
  if (!ehDono()) { trocar(box, aviso('', 'Plano e pagamento ficam só com o dono da conta.')); return; }
  if (!box.firstChild) trocar(box, el('div', { class: 'cartao' }, esqueleto()));   // ao voltar, o que já está na tela fica até chegar o novo
  c24('assinatura_ver', {}).then(r => { if (!r || !r.ok || !r.assinatura) throw new Error(); assinRender(r.assinatura); })
    .catch(() => trocar(box, el('div', { class: 'cartao' }, vazio('Não deu para carregar', 'A assinatura não carregou agora.', btn('Tentar de novo', assinCarregar, 'sec')))));
}
async function assinAcao(acao, dados, conf, b) {
  if (conf && !(await confirmar(conf))) return;
  if (b) b.disabled = true;
  c24(acao, dados || {}).then(r => {
    if (b) b.disabled = false;
    rapida((r && r.mensagem) || (r && r.ok ? 'Pronto!' : 'Não consegui concluir.'), { ms: 6000 });
    if (r && r.ok && r.recarregar_assinatura) { trocar($('assinConteudo'), el('div', { class: 'cartao' }, vazio(null, 'Gerando o seu pagamento… isso leva alguns segundos.'))); setTimeout(assinCarregar, 7000); }
    else if (r && r.ok) setTimeout(() => location.reload(), 1600);
  }).catch(() => { if (b) b.disabled = false; rapida('Erro de conexão. Tente de novo.'); });
}
function assinRender(a) {
  const SIT = { em_dia: ['Em dia', 'ok'], atrasada: ['Pagamento em atraso', 'atencao'], suspensa: ['Suspensa por falta de pagamento', 'perigo'], teste: ['Teste grátis', 'marca'], teste_encerrado: ['Teste encerrado', ''], cancelada: ['Cancelada', ''] };
  const sit = SIT[a.situacao] || SIT.em_dia, encerrada = a.situacao === 'cancelada' || a.situacao === 'teste_encerrado';
  const abertas = (a.abertas && a.abertas.length) ? a.abertas : (a.proxima ? [a.proxima] : []);
  const blocos = [el('div', { class: 'cartao pad bloco' }, el('div', { class: 'item-cab' }, el('div', { class: 'tx' }, el('p', { class: 'legenda', text: 'Sua assinatura RXSync' }), el('h2', { text: a.plano || '—' }),
    el('p', { class: 'mudo', text: 'R$ ' + (a.valor || '—') + assinSufixo(a.forma) + ' · ' + assinForma(a.forma) })), etq(sit[0], sit[1])),
    a.cancelar_em ? aviso('atencao', 'Cancelamento agendado para ' + a.cancelar_em + '. Até lá tudo funciona normalmente.') : null,
    a.situacao === 'teste' ? el('p', { class: 'dica', text: a.trial_fim ? 'O teste grátis vai até ' + a.trial_fim + '. Nada é cobrado sem você confirmar.' : 'Os 7 dias grátis começam quando a assistente entrar no ar, depois que você conectar o WhatsApp.' }) : null,
    a.situacao === 'teste_encerrado' ? el('p', { class: 'dica', text: 'O teste terminou e a assistente está parada. Pague abaixo para ela voltar ao ar.' }) : null)];
  abertas.forEach(p => blocos.push(el('div', { class: 'cartao pad bloco' }, el('p', { class: 'legenda', text: p.vencida ? 'Cobrança vencida' : 'Cobrança em aberto' }),
    el('p', { class: 'tit-bloco', text: 'R$ ' + p.valor + ' · ' + (p.vencida ? 'venceu em ' : 'vence em ') + p.vencimento }), p.descricao ? el('p', { class: 'mudo peq', text: p.descricao }) : null,
    p.link ? el('div', { class: 'pilha' }, el('a', { class: 'btn pri plena', href: p.link, target: '_blank', rel: 'noopener', text: 'Pagar agora' }), el('p', { class: 'dica', text: 'Pix, boleto ou cartão, na página segura do Asaas.' })) : null)));
  if (!abertas.length && a.proximo_vencimento) blocos.push(el('p', { class: 'mudo bloco', text: 'Próxima cobrança: ' + a.proximo_vencimento + '. O link chega por e-mail alguns dias antes.' }));
  if ((a.situacao === 'teste' || a.situacao === 'teste_encerrado') && !abertas.length && !a.cobranca_gerada) blocos.push(el('div', { class: 'cartao pad bloco' },
    el('p', { class: 'tit-bloco', text: a.situacao === 'teste' ? 'Gostou? Garanta a continuidade agora' : 'Quer reativar a assistente?' }),
    el('p', { class: 'mudo', text: 'Geramos o pagamento do plano ' + (a.plano || '') + ' (R$ ' + (a.valor || '—') + assinSufixo(a.forma) + (a.forma === 'mensal' ? ', mais a taxa de implantação de R$ 999, uma única vez' : '') + '). ' + (a.situacao === 'teste' && a.trial_fim ? 'O primeiro vencimento fica para o fim do teste, ' + a.trial_fim + ', e a assistente segue sem interrupção.' : 'Assim que o pagamento for confirmado, a assistente volta ao ar.') }),
    el('div', { class: 'pilha' }, btn(a.situacao === 'teste' ? 'Quero continuar: gerar pagamento' : 'Pagar o teste agora', ev => assinAcao('assinatura_pagar_teste', {}, { titulo: 'Gerar o pagamento agora?', texto: 'Para continuar com a RXSync depois do teste.', botao: 'Gerar pagamento' }, ev.currentTarget), 'pri plena'))));
  if (a.historico && a.historico.length) blocos.push(el('h2', { class: 'tit-bloco', text: 'Histórico de cobranças' }), el('div', { class: 'lista bloco' }, a.historico.map(x => el('div', { class: 'linha' },
    el('span', { class: 'tx' }, el('span', { class: 't1', text: x.vencimento + ' · R$ ' + x.valor }), el('span', { class: 't2', text: (x.descricao ? x.descricao + ' · ' : '') + x.status + (x.pago_em ? ' em ' + x.pago_em : '') })),
    x.link ? el('a', { class: 'btn fant', href: x.link, target: '_blank', rel: 'noopener', text: x.aberta ? 'Pagar' : 'Recibo' }) : null))));
  else if (a.asaas_ok === false) blocos.push(el('p', { class: 'dica bloco', text: 'O histórico de cobranças aparece aqui depois da primeira cobrança.' }));
  if (!encerrada && ASSIN_PRECOS[a.plano_chave]) blocos.push(el('h2', { class: 'tit-bloco', text: 'Mudar de plano' }), el('p', { class: 'dica bloco', text: 'O novo valor vale a partir da próxima cobrança em aberto. Sem nova taxa de implantação.' }),
    el('div', { class: 'duas-ipad bloco' }, ['essencial', 'gestao'].map(k => {
      const P = ASSIN_PRECOS[k], atual = k === a.plano_chave, bloqueado = a.cancelar_em || a.situacao === 'suspensa' || (a.forma !== 'mensal' && k === 'essencial');
      return el('div', { class: 'cartao pad bloco' + (atual ? ' selecionada' : '') }, el('p', { class: 'tit-bloco' }, P.nome, atual ? etq('Seu plano', 'marca') : null), el('p', { class: 'num', text: 'R$ ' + P[a.forma] + assinSufixo(a.forma) }),
        el('ul', { class: 'peq mudo' }, P.itens.map(i => el('li', { text: i }))),
        atual ? null : el('div', { class: 'pilha' }, btn('Mudar para ' + P.nome, ev => assinAcao('assinatura_trocar_plano', { plano: k }, { titulo: 'Mudar para o plano ' + P.nome + '?', texto: ['Hoje: R$ ' + (a.valor || '—') + assinSufixo(a.forma) + '. Depois: R$ ' + P[a.forma] + assinSufixo(a.forma) + ', a partir da próxima cobrança.'], botao: 'Mudar de plano' }, ev.currentTarget), 'sec plena', null, { disabled: !!bloqueado }),
          bloqueado ? el('p', { class: 'dica', text: a.situacao === 'suspensa' ? 'Regularize o pagamento para mudar de plano.' : a.cancelar_em ? 'Há um cancelamento agendado.' : 'No plano anual, a troca para um plano menor vale na renovação.' }) : null));
    })));
  if (!encerrada) {
    const ta = el('textarea', { class: 'entrada', id: 'assinPedido', rows: '2', maxlength: '500' });
    blocos.push(el('h2', { class: 'tit-bloco', text: 'Pedir mudança de ciclo ou outro ajuste' }), el('div', { class: 'cartao pad bloco form' }, el('div', { class: 'campo' }, el('label', { for: 'assinPedido', text: 'O que você precisa' }),
      el('p', { class: 'dica', text: 'Por exemplo: passar de mensal para anual. A nossa equipe fala com você.' }), ta),
      btn('Enviar pedido', ev => { if (!ta.value.trim()) { rapida('Escreva o que você precisa.'); return; } assinAcao('assinatura_pedido', { texto: ta.value }, null, ev.currentTarget); }, 'sec plena')));
    if (a.cancelar_em) blocos.push(el('div', { class: 'cartao pad bloco' }, el('p', { text: 'Seu cancelamento está agendado para ' + a.cancelar_em + '.' }),
      el('div', { class: 'pilha' }, btn('Desistir do cancelamento', ev => assinAcao('assinatura_desistir', {}, null, ev.currentTarget), 'pri plena'))));
    else {
      // Cancelar e excluir a conta (DEC-114): o servidor manda um link ao e-mail do dono; vale só quando ele confirma por lá.
      const teste = a.situacao === 'teste';
      blocos.push(el('div', { class: 'perigo-zona' },
        el('p', { class: 'mudo peq', text: teste ? 'O teste grátis é encerrado na hora e nada é cobrado. Os dados são apagados 15 dias depois.' : a.forma === 'mensal' ? 'Pelo contrato, o aviso é de 30 dias: a assistente funciona até lá e depois é desligada, sem novas cobranças. Os dados são apagados 15 dias depois. Você pode desistir até a data.' : 'Seu plano é anual, com permanência: o pedido vai para a nossa equipe, que fala com você sobre as condições.' }),
        el('p', { class: 'mudo peq bloco', text: 'Mandamos um link para o seu e-mail; o pedido só vale quando você confirmar por ele (24 horas). Antes, baixe a agenda e os pacientes em Conta › Baixar meus dados.' }),
        btn('Cancelar e excluir a conta', ev => contaExcluirPedir(ev.currentTarget), 'perigo-sec plena')));
    }
  }
  trocar($('assinConteudo'), blocos);
}
async function contaExcluirPedir(b) {
  if (!sessao) { rapida('Crie a senha do painel antes (a faixa no alto da tela).'); return; }
  if (!(await confirmar({ titulo: 'Mandar o link de cancelamento?', texto: ['Vai um link para o e-mail do dono da conta. Nada muda até você confirmar pelo link, em até 24 horas.'], botao: 'Mandar o link', perigo: true }))) return;
  b.disabled = true;
  const r = await c29('conta_exclusao_pedir'); b.disabled = false;
  if (r && r.sair) { location.reload(); return; }
  rapida((r && r.mensagem) || 'Não consegui agora. Tente de novo.', { ms: 7000 });
}

// ---------------------------------------------------------------- WhatsApp da clínica: o número e o Reconectar (molde F, código na tela, só com a sessão)
tela('conta/whatsapp', {
  montar: () => [cabTela('WhatsApp da clínica', { voltar: VOLTA_CONTA, sub: 'É o número em que a assistente atende os pacientes.' }),
    el('div', { class: 'cartao bloco' }, el('dl', { class: 'dados' }, el('dt', { text: 'Número' }), el('dd', { class: 'num', id: 'zapNumero', text: foneBonito(RO.numero_whatsapp) || 'Ainda não conectado' }))),
    ehDono() ? el('div', { class: 'molde-f', id: 'reconectarWrap' }, el('button', { class: 'btn sec plena', type: 'button', id: 'btnReconectar', onclick: reconectar }, icone('qr', 'p'), 'Reconectar ou trocar o número'),
      el('p', { class: 'dica', text: 'Use se a assistente parou de responder ou se a clínica trocou de número. O código aparece aqui mesmo, só com o WhatsApp desconectado. No celular da clínica, abra o WhatsApp › Aparelhos conectados › Conectar um aparelho e aponte a câmera para o código.' }),
      el('div', { class: 'cartao pad pilha', id: 'zapQrBox', hidden: true }, el('img', { class: 'qr', id: 'zapQrImg', alt: 'Código para conectar o WhatsApp', hidden: true }), el('p', { class: 'mudo', id: 'zapQrMsg', role: 'status', 'aria-live': 'polite' }))) : null]
});
let zapEspera = null;
function zapQr(r) {
  const img = $('zapQrImg'), msg = $('zapQrMsg');
  if (r && r.ok && r.status === 'conectado') { clearInterval(zapEspera); zapEspera = null; img.hidden = true; img.removeAttribute('src'); msg.textContent = 'WhatsApp conectado. A assistente volta a responder em instantes.'; $('btnReconectar').disabled = false; return; }
  if (r && r.ok && r.qr) { img.src = r.qr.indexOf('data:image') === 0 ? r.qr : 'data:image/png;base64,' + r.qr; img.hidden = false; msg.textContent = 'Aponte a câmera do WhatsApp da clínica para o código.'; return; }
  clearInterval(zapEspera); zapEspera = null; img.hidden = true; $('btnReconectar').disabled = false;
  msg.textContent = (r && r.mensagem) || 'Não consegui gerar o código. Tente de novo.';
}
// O código aparece aqui mesmo; a página confere a situação a cada 4 segundos, por até 3 minutos. Pelo link antigo, pede para criar a senha antes.
function reconectar() {
  if (!sessao) { rapida('Para reconectar, crie sua senha primeiro (a faixa no alto da tela).'); return; }
  let voltas = 0; const b = $('btnReconectar');
  b.disabled = true; $('zapQrBox').hidden = false; $('zapQrImg').hidden = true; $('zapQrMsg').textContent = 'Gerando o código…';
  c23('qr').then(r => {
    zapQr(r); if (!(r && r.ok && r.qr)) return;
    clearInterval(zapEspera);
    zapEspera = setInterval(() => { if (++voltas > 45) { zapQr({ ok: false, mensagem: 'O código expirou. Toque em Reconectar de novo.' }); return; } c23('status').then(zapQr).catch(() => {}); }, 4000);
  }).catch(() => zapQr({ ok: false, mensagem: 'Sem conexão. Tente de novo.' }));
}

// ---------------------------------------------------------------- Contato, Assistente de gestão, Dados do contrato (molde E)
tela('conta/contato', { montar: () => [cabTela('Contato e responsável técnico', { voltar: VOLTA_CONTA, sub: 'Quem responde pela clínica na RXSync e pelo conteúdo da assistente. Mudar o e-mail atualiza o cliente no Asaas.' }),
  blocoCampos(CAMPOS_DA('contato'), { oQue: 'o e-mail, os telefones e o responsável técnico' })] });
tela('conta/gestao', {
  montar: () => [cabTela('Assistente de gestão', { voltar: VOLTA_CONTA, sub: 'Pergunte sobre a agenda, os resultados e os documentos. Se você permitir, ele também marca, remarca, bloqueia horários ("dia 20 não vou atender"), muda a grade ("quarta não atendo mais de manhã"), atualiza o que a assistente diz aos pacientes ("a consulta agora custa R$ 380") e avisa os pacientes do dia ("vou atrasar 30 minutos").' }),
    blocoCampos(CAMPOS_DA('gestao'), { oQue: 'o assistente de gestão e os números autorizados', beneficio: 'Pergunte sobre a clínica e peça mudanças por aqui ou pelo seu WhatsApp, sem abrir o painel.' }),
    el('p', { class: 'legenda pilha', text: 'Até 60 perguntas por dia. Elas não contam na franquia de mensagens.' })],
  entrar: () => dependenciasAplicar()
});
const READONLY = [['razao_social', 'Razão social'], ['cnpj', 'CNPJ'], ['representante_nome', 'Representante'], ['representante_cpf', 'CPF do representante'], ['endereco_faturamento', 'Endereço de faturamento'], ['plano', 'Plano'], ['valor_mensal', 'Valor'], ['numero_whatsapp', 'WhatsApp que a assistente atende']];
// O que mudou no painel (entrega 3, a troca): onde ficou cada coisa do painel antigo. Nada muda no servidor.
// caminhos-antigos: começo (a primeira coluna são os nomes de antes; a segunda, conferida, fica na tela abaixo)
const MUDOU = [['Agenda › Integração', 'Agenda › Horários › Integração e planilhas', 'agenda/horarios/integracao'],
  ['Agenda › Horários (a página longa)', 'Agenda › Horários: uma página por assunto (horários de atendimento, regras, médicos, perguntas, feriados, receber dos pacientes)', 'agenda/horarios'],
  ['Funções da assistente', 'Assistente › O que ela faz', 'assistente/funcoes'],
  ['Agenda por médico', 'Agenda › Horários › Médicos e tipos, no alto', 'agenda/horarios/medicos'],
  ['"Bloquear feriados" e "Não atender em feriados"', 'Um controle só, em Agenda › Horários › Feriados', 'agenda/horarios/feriados'],
  ['Lembretes (a chave e os horários)', 'Um controle só, em Assistente › Mensagens automáticas', 'assistente/automaticas'],
  ['Agrupar pacientes', 'Agenda › Horários › Regras da agenda', 'agenda/horarios/regras'],
  ['Pacientes › importar e duplicados', 'Pacientes › ⋯ › Organizar', 'pacientes/organizar'],
  ['Resultados', 'Hoje › Ver resultados', 'resultados'],
  ['Assinatura', 'Conta › Plano e pagamento', 'conta/assinatura'],
  ['Agenda › Espera ("Fila de espera")', 'Agenda › Lista de espera', 'agenda/espera'],
  ['Escrever "BLOQUEIO" no serviço de uma consulta', 'Agenda › ⋯ Mais › Bloquear horário', 'agenda'],
  ['Conta › WhatsApp', 'Conta › Assinatura e WhatsApp › WhatsApp da clínica', 'conta/whatsapp'],
  ['Conta › Equipe e Acessos recentes', 'Conta › Pessoas', 'conta/equipe'],
  ['Conta › Baixar meus dados', 'Conta › Dados e contrato › Baixar meus dados', 'conta/dados']];
// caminhos-antigos: fim
tela('conta/mudou', { montar: () => [cabTela('O que mudou no painel', { voltar: VOLTA_CONTA, sub: 'O painel ganhou um visual novo e cada assunto ganhou a sua página. Nada mudou no que a assistente faz, nos dados nem nas senhas, e os links antigos do painel continuam abrindo.' }),
  el('div', { class: 'bloco' }, el('h2', { text: 'Para andar no painel' }), el('div', { class: 'cartao pad' }, el('ul', { class: 'lista-texto' },
    el('li', { text: 'No celular, as abas de baixo são Hoje, Agenda, Pacientes e Assistente; a Conta fica no ícone de pessoa, no alto. No iPad e no computador, o menu fica na lateral.' }),
    el('li', { text: 'O estado da assistente fica sempre no alto ("Atendendo"). Tocar nele mostra o que está acontecendo e os botões de pausar e testar.' }),
    el('li', { text: 'A lupa, no alto, acha qualquer tela pelo nome novo ou pelo antigo, e também pacientes e consultas.' }),
    el('li', { text: 'O assistente de gestão abre pelo ícone de conversa, no alto.' })))),
  el('div', { class: 'bloco' }, el('h2', { text: 'Onde ficou cada coisa' }), el('div', { class: 'lista', id: 'mudouLista' }, MUDOU.map(([antes, agora, rota]) => linhaLink(agora, 'Antes: ' + antes, rota))))] });
tela('conta/contrato', { montar: () => [cabTela('Dados do contrato', { voltar: VOLTA_CONTA, sub: 'Para mudar algum desses dados, fale com a RXSync.' }),
  el('div', { class: 'cartao', id: 'somenteLeitura' }, el('dl', { class: 'dados' }, READONLY.map(([k, r]) => [el('dt', { text: r }), el('dd', { text: (k === 'numero_whatsapp' ? foneBonito(RO[k]) : RO[k]) || '—' })])))] });

// ---------------------------------------------------------------- Equipe (B, só o dono): até 3 pessoas, cada uma com o próprio e-mail (DEC-115)
tela('conta/equipe', {
  montar: () => [cabTela('Equipe', { voltar: VOLTA_CONTA, sub: 'Convide até 3 pessoas da clínica. Cada uma entra com o próprio e-mail e a própria senha, e cuida da agenda, dos pacientes e das configurações da assistente. Plano e pagamento, equipe, exclusão da conta, os dados de contato e o assistente de gestão ficam só com você.' }),
    el('div', { id: 'equipeLista', class: 'bloco' }), el('div', { class: 'cartao pad form' }, el('div', { class: 'campo' }, el('label', { for: 'equipeEmail', text: 'E-mail da pessoa' }),
      el('input', { class: 'entrada', id: 'equipeEmail', type: 'text', inputmode: 'email', autocomplete: 'off', autocapitalize: 'off', maxlength: '160', placeholder: 'recepcao@suaclinica.com.br' }),
      el('p', { class: 'dica', text: 'Ela recebe um convite por e-mail e cria a senha em "Criar senha", com esse e-mail. O convite vale 7 dias. Um e-mail só entra no painel de uma clínica.' })),
      el('button', { class: 'btn pri plena', type: 'button', id: 'btnEquipeConvidar', text: 'Convidar', onclick: equipeConvidar }))],
  entrar: () => equipeCarregar()
});
function equipeCarregar() {
  const box = $('equipeLista'); trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  c29('equipe_listar').then(r => {
    if (r && r.sair) { location.reload(); return; }
    if (!r || !r.ok) { trocar(box, aviso('perigo', (r && r.mensagem) || 'Não consegui carregar a equipe agora.')); return; }
    const SIT = { ativa: '', convite: 'Convite enviado', convite_vencido: 'Convite vencido' };
    trocar(box, el('div', { class: 'lista' }, (r.pessoas || []).map(p => el('div', { class: 'linha' }, el('span', { class: 'av', text: String(p.email || '?').charAt(0).toUpperCase() }),
      el('span', { class: 'tx' }, el('span', { class: 't1 quebra', text: p.email }), el('span', { class: 't2', text: p.papel === 'dono' ? 'Dono da conta' : SIT[p.situacao] ? SIT[p.situacao] + (p.situacao === 'convite' && p.convite_ate ? ', vale até ' + p.convite_ate : '') : 'Equipe' + (p.ultimo_acesso ? ' · último acesso ' + p.ultimo_acesso : '') })),
      p.papel !== 'dono' ? btn('Remover', async ev => {
        const b = ev.currentTarget;
        if (!(await confirmar({ titulo: 'Remover da equipe?', texto: p.email + ' deixa de entrar no painel. Se estiver no painel agora, sai no próximo toque.', botao: 'Remover', perigo: true }))) return;
        b.disabled = true; c29('equipe_remover', { pessoa: String(p.id) }).then(x => { rapida((x && x.mensagem) || 'Pronto.'); equipeCarregar(); });
      }, 'perigo-sec') : null))));
  });
}
function equipeConvidar() {
  const i = $('equipeEmail'), e = i.value.trim().toLowerCase(), b = $('btnEquipeConvidar');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { rapida('Digite um e-mail válido.'); i.focus(); return; }
  b.disabled = true;
  c29('equipe_convidar', { email: e }).then(r => { b.disabled = false; rapida((r && r.mensagem) || 'Não consegui convidar agora.', { ms: 6000 }); if (r && r.ok) { i.value = ''; equipeCarregar(); } });
}
// ---------------------------------------------------------------- Acessos recentes (B, só o dono, sem o IP; DEC-136)
tela('conta/acessos', {
  montar: () => [cabTela('Acessos recentes', { voltar: VOLTA_CONTA, sub: 'As 100 entradas e ações mais recentes no painel: quando, o quê, quem (o dono ou uma pessoa da equipe) e o aparelho. Ficam guardadas por 12 meses. Se aparecer algo que ninguém da clínica fez, troque a senha em "Esqueci a senha" e responda um e-mail nosso.' }), el('div', { id: 'acessosLista' })],
  entrar: () => {
    const box = $('acessosLista'); trocar(box, el('div', { class: 'cartao' }, esqueleto()));
    c29('acessos_recentes').then(r => {
      if (r && r.sair) { location.reload(); return; }
      if (!r || !r.ok) { trocar(box, aviso('perigo', (r && r.mensagem) || 'Não consegui carregar os acessos agora.')); return; }
      const l = r.acessos || [], q = t => { const d = new Date(t); return isNaN(d) ? String(t || '') : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
      trocar(box, l.length ? el('div', { class: 'lista' }, l.map(a => el('div', { class: 'linha' }, el('span', { class: 'tx' }, el('span', { class: 't1', text: a.o_que || a.evento || '' }), el('span', { class: 't2', text: [q(a.quando), a.quem, a.aparelho].filter(Boolean).join(' · ') })))))
        : el('div', { class: 'cartao' }, vazio(null, 'Nenhum acesso registrado ainda.')));
    });
  }
});
// ---------------------------------------------------------------- Baixar meus dados: CSV montado no aparelho, em páginas de 2.000 linhas
const DADOS_COLUNAS = {
  agenda: [['codigo', 'Código'], ['inicio', 'Início'], ['fim', 'Fim'], ['situacao', 'Situação'], ['paciente', 'Paciente'], ['telefone', 'Telefone'], ['codigo_paciente', 'Código do paciente'], ['servico', 'Serviço'], ['medico', 'Médico'], ['observacoes', 'Observações'],
    ['presenca_confirmada', 'Presença confirmada'], ['paga_em', 'Paga em'], ['marcada_por', 'Marcada por'], ['criada_em', 'Criada em'], ['nota_pesquisa', 'Nota da pesquisa']],
  pacientes: [['codigo', 'Código'], ['nome', 'Nome'], ['telefone', 'Telefone'], ['email', 'E-mail'], ['nascimento', 'Nascimento'], ['observacao', 'Observação'], ['origem', 'Origem'], ['criado_em', 'Cadastrado em'], ['ultima_consulta', 'Última consulta'], ['nao_contatar_desde', 'Não contatar desde']]
};
function csvCelula(v) {
  let t = v === null || v === undefined ? '' : (v === true ? 'sim' : (v === false ? 'não' : String(v)));
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;   // a planilha não executa fórmula vinda de um campo
  return /[",;\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
async function dadosBaixar(parte, b, msg) {
  let linhas = [], pagina = 0;
  b.disabled = true; msg.textContent = 'Preparando a planilha…';
  try {
    for (;;) {
      const r = await c29('dados_exportar', { parte, pagina });
      if (r && r.sair) { location.reload(); return; }
      if (!r || !r.ok) throw new Error((r && r.mensagem) || 'Não consegui baixar agora.');
      linhas = linhas.concat(r.linhas || []); msg.textContent = 'Preparando a planilha… ' + pl(linhas.length, 'linha', 'linhas');
      if (!r.tem_mais) break; pagina++;
    }
    const cols = DADOS_COLUNAS[parte];
    baixarArquivo('﻿' + cols.map(c => csvCelula(c[1])).join(',') + '\r\n' + linhas.map(l => cols.map(c => csvCelula(l[c[0]])).join(',')).join('\r\n'), 'text/csv;charset=utf-8', 'rxsync-' + parte + '-' + new Date().toISOString().slice(0, 10) + '.csv');
    msg.textContent = 'Pronto: ' + pl(linhas.length, 'linha', 'linhas') + '.';
  } catch (e) { msg.textContent = ''; rapida(e.message, { ms: 6000 }); }
  b.disabled = false;
}
tela('conta/dados', {
  montar: () => [cabTela('Baixar meus dados', { voltar: VOLTA_CONTA, sub: 'Planilhas (CSV) com a agenda e os pacientes da clínica, montadas aqui no aparelho. Abrem no Numbers, no Excel e no Google Planilhas. Nada fica guardado no navegador.' }),
    el('div', { class: 'pilha molde-f' }, el('button', { class: 'btn sec plena', type: 'button', id: 'btnBaixarAgenda', text: 'Agenda (todas as consultas)', onclick: e => dadosBaixar('agenda', e.currentTarget, $('dadosMsg')) }),
      el('button', { class: 'btn sec plena', type: 'button', id: 'btnBaixarPacientes', text: 'Pacientes', onclick: e => dadosBaixar('pacientes', e.currentTarget, $('dadosMsg')) }),
      el('p', { class: 'mudo', id: 'dadosMsg', role: 'status', 'aria-live': 'polite' }),
      el('p', { class: 'dica', text: 'O histórico das conversas não entra aqui: ele vai por e-mail, a pedido (responda um e-mail nosso ou escreva para contato@rxsync.com.br). O arquivo chega direto no e-mail do cadastro, até 15 dias depois do encerramento (cláusula 19.2 dos Termos).' }))]
});
// Fim do contrato: o servidor avisa (so_baixar) e o painel mostra só baixar e sair, sem chamar o 24. A equipe só sai.
function fimContratoMostrar(papel) {
  $('carregando').hidden = true; $('app').hidden = true; $('fimContrato').hidden = false;
  const equipe = papel === 'equipe'; $('fimBaixar').hidden = equipe; $('fimEquipe').hidden = !equipe;
}
$('btnFimAgenda').addEventListener('click', () => dadosBaixar('agenda', $('btnFimAgenda'), $('fimMsg')));
$('btnFimPacientes').addEventListener('click', () => dadosBaixar('pacientes', $('btnFimPacientes'), $('fimMsg')));
$('btnFimSair').addEventListener('click', () => sairPainel($('btnFimSair')));
