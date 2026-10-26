// ---------------------------------------------------------------- Pacientes (molde B; plano Gestão). No Essencial, só o convite, onde a aba seria usada.
// O servidor (workflow 24, rx_paciente_painel) também recusa no Essencial. Respostas: { ok, data } com o data do banco.
const PAC = { busca: '', filtro: 'todos', pagina: 0, total: 0, itens: [], seq: 0, sujo: true, aviso: '', atual: null };
const PAC_FRASE = 'O paciente pediu para voltar a receber os avisos';
const PAC_ERROS = { nome: 'Escreva o nome do paciente (até 120 letras).', telefone: 'Informe o telefone com DDD (ex.: 48 99999-0000).', email: 'Confira o e-mail.', nascimento: 'Confira a data de nascimento.',
  observacao: 'A observação pode ter até 300 letras.', nao_encontrado: 'Esse paciente não existe mais (pode ter sido juntado a outro ou excluído).', plano: 'O cadastro de pacientes faz parte do plano Gestão Inteligente.',
  frase: 'A frase de confirmação não confere.', dados: 'Confira os dados e tente de novo.', interno: 'Não consegui agora. Tente de novo em instantes.' };
const PAC_OBS_AVISO = 'Só informação administrativa (ex.: prefere a manhã, convênio, precisa de acessibilidade). Nunca escreva sintomas, diagnóstico, exames ou tratamento: a ficha clínica não fica aqui.';
const pacErro = r => (r && (r.mensagem || PAC_ERROS[r.erro])) || PAC_ERROS.interno;
const pacReservio = () => ligado('func_reservio');
function pacDig(t) { let d = String(t || '').replace(/\D/g, ''); if (d.length >= 12 && d.slice(0, 2) === '55') d = d.slice(2); return d; }
function pacTel(t) { const d = pacDig(t); if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7); if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6); return t || ''; }
// Mesmo telefone para a assistente: DDD + 8 últimos dígitos (como todo o sistema).
function pacMesmoTel(a, b) { const x = pacDig(a), y = pacDig(b); return x.length >= 10 && y.length >= 10 && x.slice(0, 2) + x.slice(-8) === y.slice(0, 2) + y.slice(-8); }
function pacNasc(d) {
  const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return '';
  const hoje = new Date(), idade = hoje.getFullYear() - +m[1] - ((hoje.getMonth() + 1 < +m[2] || (hoje.getMonth() + 1 === +m[2] && hoje.getDate() < +m[3])) ? 1 : 0);
  return m[3] + '/' + m[2] + '/' + m[1] + ' (' + idade + (idade === 1 ? ' ano)' : ' anos)');
}
function pacOrigem(p) {
  if (p.origem === 'planilha') return 'Importado da planilha' + (p.importado_em ? ' em ' + fmtDia(p.importado_em) : '');
  if (p.origem === 'reservio_clientes') return 'Importado do Reservio' + (p.importado_em ? ' em ' + fmtDia(p.importado_em) : '');
  if (p.origem === 'painel') return 'Cadastrado no painel';
  return '';
}
const VOLTA_PAC = ['pacientes', 'Pacientes'];
tela('pacientes', {
  montar: () => sem('pacientes') ? pacVitrine() : [cabTela('Pacientes', { acao: acaoPrincipal('Novo paciente', () => pacForm(null), 'soma', 'pacNovo'), mais: { lista: [['Organizar: duplicados e importação', 'ajustes', () => ir('pacientes/organizar')]] } }),
    el('div', { id: 'pacConteudo' }, pacControles(), el('div', { class: 'lado-a-lado' }, el('div', {}, el('p', { class: 'mudo peq bloco num', id: 'pacTotal' }), el('div', { id: 'pacLista' }, el('div', { class: 'cartao' }, esqueleto())),
      el('div', { class: 'pilha' }, el('button', { class: 'btn sec plena', type: 'button', id: 'pacMais', hidden: true, text: 'Mostrar mais 50', onclick: () => { PAC.pagina += 1; pacListaCarregar(true); } }))),
      el('div', { class: 'item-lado', id: 'pacLado', hidden: true })))],
  entrar: () => { if (sem('pacientes')) return; if (PAC.sujo) pacListaCarregar(false); else pacListaRender(); }
});
function pacVitrine() {
  return [cabTela('Pacientes'), el('div', { id: 'pacUpsell', class: 'cartao pad molde-f' }, el('p', {}, el('span', { class: 'selo-plano', text: 'Plano Gestão Inteligente' })),
    el('h2', { class: 'tit-bloco pilha', text: 'Todos os seus pacientes num lugar só' }),
    el('p', { class: 'mudo', text: 'Encontre qualquer paciente pelo nome, pelo telefone ou pelo código, veja as consultas dele e mantenha o cadastro em ordem.' }),
    el('ul', { class: 'pilha' }, ['Busca pelo nome, pelo final do telefone ou pelo código do paciente', 'Ficha com e-mail, data de nascimento e as consultas futuras e passadas', 'Junta os cadastros repetidos da mesma pessoa',
      'Marca quem não quer receber avisos e exclui a pedido do paciente', 'Traz os pacientes do sistema que você usa hoje, por planilha, sem duplicar'].map(t => el('li', { text: t }))),
    ehDono() ? el('div', { class: 'pilha' }, btn('Conhecer o plano Gestão Inteligente', () => ir('conta/assinatura'), 'pri plena')) : null,
    el('p', { class: 'dica', text: 'No seu plano, a assistente continua reconhecendo os pacientes, e eles aparecem nas consultas da Agenda.' })), el('div', { id: 'pacConteudo', hidden: true })];
}
function pacControles() {
  const busca = el('input', { class: 'entrada cresce', type: 'search', id: 'pacBusca', enterkeyhint: 'search', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Buscar paciente', 'aria-label': 'Buscar paciente' });
  let tm = null;
  busca.addEventListener('input', () => { const v = busca.value.trim(); clearTimeout(tm); tm = setTimeout(() => { if (v === PAC.busca || v.length === 1) return; PAC.busca = v; pacListaCarregar(false); }, 350); });   // uma letra só traria quase todos
  busca.addEventListener('keydown', e => { if (e.key === 'Enter') busca.blur(); });
  const fil = el('select', { class: 'entrada', id: 'pacFiltro', 'aria-label': 'Filtrar pacientes' }, [['todos', 'Todos'], ['sem_conversa', 'Sem conversa'], ['importados_sem_conversa', 'Importados sem conversa'], ['nao_contatar', 'Não contatar']].map(([v, t]) => el('option', { value: v, text: t })));
  fil.addEventListener('change', () => { PAC.filtro = fil.value; pacListaCarregar(false); });
  return [el('div', { class: 'controles' }, busca, fil), el('p', { class: 'dica bloco', text: 'Pelo nome (com ou sem acento), pelo final do telefone ou pelo código (P-…).' })];
}
function pacListaCarregar(maisUma) {
  const seq = ++PAC.seq, lista = $('pacLista'); if (!lista) return;
  if (!maisUma) { PAC.pagina = 0; PAC.itens = []; trocar(lista, el('div', { class: 'cartao' }, esqueleto())); $('pacTotal').textContent = ''; }
  $('pacMais').hidden = true;
  p24('paciente_listar', { busca: PAC.busca, filtro: PAC.filtro, pagina: PAC.pagina }).then(d => {
    if (seq !== PAC.seq) return;   // chegou a resposta de uma busca antiga
    if (!d.ok) { trocar(lista, aviso('perigo', pacErro(d))); return; }
    PAC.sujo = false; PAC.total = d.total || 0; PAC.itens = PAC.itens.concat(d.pacientes || []); pacListaRender();
  }).catch(() => { if (seq === PAC.seq) trocar(lista, aviso('perigo', PAC_ERROS.interno)); });
}
function pacLinha(p, atual) {
  const tags = [];
  if (p.nao_contatar_em) tags.push(etq('Não contatar', 'perigo', 'proibido'));
  if (!p.conversou_em) tags.push(etq('Sem conversa', 'atencao'));
  if (p.importado_em) tags.push(etq('Importado', ''));
  return el('button', { class: 'linha' + (atual ? ' selecionada' : ''), type: 'button', 'data-ir': 'pacientes/ficha/' + p.paciente_id }, el('span', { class: 'av', text: iniciais(p.nome) }),
    el('span', { class: 'tx' }, el('span', { class: 't1', text: p.nome }), el('span', { class: 't2', text: [pacTel(p.telefone), p.proxima_consulta ? 'Próxima: ' + fmt(p.proxima_consulta) : p.ultima_consulta ? 'Última: ' + fmtDia(p.ultima_consulta) : null].filter(Boolean).join(' · ') }),
      tags.length ? el('span', { class: 'etqs' }, tags) : null), el('span', { class: 'seta' }, icone('seta')));
}
function pacListaRender() {
  const lista = $('pacLista'); if (!lista) return;
  $('pacTotal').textContent = PAC.total === 1 ? '1 paciente' : PAC.total.toLocaleString('pt-BR') + ' pacientes';
  if (!PAC.itens.length) trocar(lista, el('div', { class: 'cartao' }, vazio(PAC.busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente aqui ainda', PAC.busca ? 'Confira a busca ou tente só um pedaço do nome.' : 'Os pacientes aparecem quando conversam com a assistente, marcam consulta ou são cadastrados em "Novo paciente".')));
  else trocar(lista, el('div', { class: 'lista' }, PAC.itens.map(p => pacLinha(p))));
  $('pacMais').hidden = PAC.itens.length >= PAC.total;
}
// ---------------------------------------------------------------- a ficha (molde C): nome, telefone e código · consultas · não contatar · juntar · excluir (no fim)
tela('pacientes/ficha', {
  montar: () => [el('button', { class: 'voltar', type: 'button', 'data-ir': 'pacientes' }, icone('voltar'), 'Pacientes'), el('div', { class: 'lado-a-lado' }, el('div', { class: 'so-largo', id: 'pacFichaLista' }), el('div', { id: 'pacFicha' }))],
  entrar: id => pacFichaAbrir(id)
});
function pacFichaAbrir(id) {
  if (sem('pacientes')) { ir('pacientes'); return; }
  const box = $('pacFicha'); trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  p24('paciente_ver', { paciente_id: id }).then(d => {
    if (!d.ok) { trocar(box, aviso('perigo', pacErro(d))); return; }
    PAC.atual = d;
    if (d.juntado_de) history.replaceState(null, '', '#pacientes/ficha/' + d.paciente.paciente_id);   // o código juntado leva a quem ficou
    pacFichaRender(d);
  }).catch(() => trocar(box, aviso('perigo', PAC_ERROS.interno)));
  const l = $('pacFichaLista'); if (l && PAC.itens.length) trocar(l, el('div', { class: 'lista' }, PAC.itens.map(p => pacLinha(p, p.paciente_id === id))));
}
function pacFichaRender(d) {
  const p = d.paciente, box = $('pacFicha');
  const consultas = (titulo, lista, extra) => [el('h2', { class: 'tit-bloco' }, titulo, extra ? el('span', { class: 'extra', text: extra }) : null),
    el('div', { class: 'lista bloco' }, lista.length ? lista.map(c => el('div', { class: 'linha' }, el('span', { class: 'tx' }, el('span', { class: 't1', text: fmtQuando(c.inicio) }),
      el('span', { class: 't2', text: [c.tipo || c.servico, c.medico, c.status === 'cancelado' ? 'cancelada' : c.presenca_confirmada ? 'confirmou presença' : '', c.criado_por === 'ia' ? 'marcada pela assistente' : '', c.pesquisa_nota != null ? 'nota ' + c.pesquisa_nota : ''].filter(Boolean).join(' · ') })),
      c.status === 'cancelado' ? etq('Cancelada', 'perigo') : null)) : el('div', { class: 'vazio', text: 'Nenhuma.' }))];
  const dups = d.possiveis_duplicados || [], tp = d.total_passadas || 0, np = (d.consultas_passadas || []).length;
  trocar(box, PAC.aviso ? aviso('ok', PAC.aviso) : null, d.juntado_de ? aviso('', 'O código ' + d.juntado_de + ' foi juntado a este paciente.') : null,
    el('div', { class: 'item-cab' }, el('span', { class: 'av', text: iniciais(p.nome) }), el('div', { class: 'tx' }, el('h2', { class: 'titulo', text: p.nome }),
      el('div', { class: 'etqs' }, etq(p.paciente_id, ''), pacOrigem(p) ? etq(pacOrigem(p), '') : null))),
    !p.conversou_em ? aviso('atencao', 'Ainda não conversou no WhatsApp: não recebe mensagens automáticas até escrever para a clínica.') : null,
    p.nao_contatar_em ? aviso('perigo', 'Pediu para não receber avisos de retorno, convites para voltar nem o convite do Google (desde ' + fmtDia(p.nao_contatar_em) + '). Os lembretes de consultas marcadas continuam.') : null,
    el('div', { class: 'acoes-rapidas' }, btn('Editar', () => pacForm(p), 'sec', 'notas'), btn('Juntar com outro', () => pacJuntarBuscar(p), 'sec', 'duplicados'),
      el('a', { class: 'btn sec', href: zap(p.telefone), target: '_blank', rel: 'noopener' }, icone('zap', 'p'), 'WhatsApp')),
    el('div', { class: 'cartao bloco' }, el('dl', { class: 'dados' }, [['Telefone', pacTel(p.telefone)], ['E-mail', p.email], ['Nascimento', pacNasc(p.data_nascimento)], ['Última consulta', d.ultima_consulta ? fmtDia(d.ultima_consulta) : ''],
      ['Observação', p.observacao], ['No cadastro desde', fmtDia(p.criado_em)]].map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v || '—' })]))),
    el('p', { class: 'dica bloco', text: 'Observação: ' + PAC_OBS_AVISO }),
    consultas('Próximas consultas', d.consultas_futuras || []), consultas('Consultas passadas', d.consultas_passadas || [], tp > np ? 'as ' + np + ' mais recentes de ' + tp : ''),
    dups.length ? [el('h2', { class: 'tit-bloco', text: 'Possíveis duplicados' }), el('div', { class: 'lista bloco', id: 'pacDupFicha' }, dups.map(q => el('button', { class: 'linha', type: 'button', onclick: () => pacJuntarConfirmar(p, q) },
      el('span', { class: 'av', text: iniciais(q.nome) }), el('span', { class: 'tx' }, el('span', { class: 't1', text: q.nome }), el('span', { class: 't2', text: pacTel(q.telefone) + ' · ' + (q.mesmo_telefone ? 'mesmo telefone' : 'outro telefone') })), el('span', { class: 'valor', text: 'Juntar' }))))] : null,
    el('div', { class: 'cartao campos bloco' }, el('div', { class: 'chave-linha' }, el('div', { class: 'tx' }, el('div', { class: 't1', text: 'Avisos que a clínica inicia' }),
      el('p', { class: 'dica', text: p.nao_contatar_em ? 'Não recebe avisos de retorno, convites para voltar nem o convite do Google.' : 'Recebe os avisos de retorno, os convites para voltar e o convite do Google, quando ligados.' })),
      btn(p.nao_contatar_em ? 'Voltar a enviar avisos' : 'Não quer receber avisos', () => pacNaoContatar(p), 'sec'))),
    el('div', { class: 'perigo-zona', id: 'pacAcaoArea' }, el('p', { class: 'legenda', text: 'Excluir a pedido do paciente (LGPD)' }), btn('Excluir paciente', () => pacExcluir(p), 'perigo-sec plena')));
  PAC.aviso = '';
}
// Juntar: 1) achar o outro cadastro; 2) escolher quem fica; 3) confirmar (nível 2, mostra qual fica e qual sai).
function pacJuntarBuscar(p) {
  const inp = el('input', { class: 'entrada', type: 'search', id: 'pacJuntarBusca', placeholder: 'Nome, final do telefone ou código', autocomplete: 'off' });
  const res = el('div', { 'aria-live': 'polite' });
  const f = folha('Juntar com outro paciente', el('div', {}, el('p', { class: 'mudo bloco', text: 'Use quando os dois cadastros forem a mesma pessoa. Busque o outro cadastro:' }), inp, el('div', { class: 'pilha' }, res)), { foco: '#pacJuntarBusca' });
  let tm = null, seq = 0;
  inp.addEventListener('input', () => {
    const v = inp.value.trim(); clearTimeout(tm); if (v.length < 2) { trocar(res); return; }
    tm = setTimeout(() => { const s = ++seq; p24('paciente_listar', { busca: v, filtro: 'todos', pagina: 0 }).then(d => {
      if (s !== seq) return;
      const lst = (d.pacientes || []).filter(q => q.paciente_id !== p.paciente_id);
      trocar(res, lst.length ? el('div', { class: 'lista' }, lst.slice(0, 10).map(q => el('button', { class: 'linha', type: 'button', onclick: () => { f.fechar(); pacJuntarConfirmar(p, q); } },
        el('span', { class: 'av', text: iniciais(q.nome) }), el('span', { class: 'tx' }, el('span', { class: 't1', text: q.nome }), el('span', { class: 't2', text: pacTel(q.telefone) + ' · ' + q.paciente_id }))))) : vazio(null, 'Nenhum outro paciente encontrado.'));
    }).catch(() => trocar(res, aviso('perigo', PAC_ERROS.interno))); }, 350);
  });
}
function pacJuntarConfirmar(a, b) {
  const nome = 'pacFica' + Date.now(), avisoTel = el('div');
  const opc = [a, b].map((q, i) => el('label', { class: 'marcar pc-escolha' }, el('input', { type: 'radio', name: nome, value: q.paciente_id, checked: i === 0 }), el('span', {}, el('strong', { text: q.nome }), el('br'), el('span', { class: 'mudo peq num', text: pacTel(q.telefone) + ' · ' + q.paciente_id }))));
  const quem = () => { const fica = opc[0].querySelector('input').checked ? a : b; return [fica, fica === a ? b : a]; };
  const atualizar = () => { const [fica, sai] = quem(); trocar(avisoTel, pacMesmoTel(a.telefone, b.telefone) ? null : aviso('atencao', 'Os telefones são diferentes. Fica o telefone de ' + fica.nome + ' (' + pacTel(fica.telefone) + '); o ' + pacTel(sai.telefone) + ' deixa de ser reconhecido pela assistente.' + (pacReservio() ? ' Se a clínica usa o Reservio, junte também lá.' : ''))); };
  opc.forEach(o => o.querySelector('input').addEventListener('change', atualizar)); atualizar();
  const ok = el('button', { class: 'btn pri', type: 'button', text: 'Juntar', id: 'pacJuntarOk' });
  const f = folha('Qual cadastro fica?', el('div', { id: 'pacJuntar' }, el('p', { class: 'mudo bloco', text: 'As consultas, as respostas da pré-consulta e os avisos de quem sai passam para quem fica. O que estiver vazio em quem fica (e-mail, nascimento, observação) é completado com o de quem sai, e o código de quem sai continua levando a quem fica.' }),
    el('div', { class: 'opcoes' }, opc), avisoTel), { pe: [btn('Cancelar', () => f.fechar(), 'sec'), ok] });
  ok.addEventListener('click', async () => {
    const [fica, sai] = quem();
    if (!(await confirmar({ titulo: 'Juntar os dois cadastros?', texto: ['Fica: ' + fica.nome + ' (' + fica.paciente_id + ').', 'Sai: ' + sai.nome + ' (' + sai.paciente_id + ').', 'Não dá para desfazer.'], botao: 'Juntar' }))) return;
    ok.disabled = true;
    p24('paciente_juntar', { fica: fica.paciente_id, sai: sai.paciente_id }).then(r => {
      ok.disabled = false;
      if (!r.ok) { rapida(pacErro(r)); return; }
      f.fechar(); PAC.sujo = true;
      PAC.aviso = 'Cadastros juntados. ' + (r.consultas ? r.consultas + (r.consultas === 1 ? ' consulta passou' : ' consultas passaram') + ' para este paciente. ' : '')
        + (r.telefone_descartado ? 'O telefone ' + pacTel(sai.telefone) + ' deixou de ser reconhecido: a assistente só reconhece o telefone deste cadastro. Se a pessoa ainda usa aquele número, edite o telefone.' : '');
      if (location.hash === '#pacientes/ficha/' + fica.paciente_id) pacFichaAbrir(fica.paciente_id); else ir('pacientes/ficha/' + fica.paciente_id);
    }).catch(() => { ok.disabled = false; rapida(PAC_ERROS.interno); });
  });
}
// Não contatar: marcar é nível 2; voltar a enviar exige a frase exata (nível 3, o servidor confere).
async function pacNaoContatar(p) {
  if (!p.nao_contatar_em) {
    if (!(await confirmar({ titulo: 'Não enviar mais avisos?', texto: ['Marca que ' + p.nome + ' não quer receber avisos de retorno, convites para voltar nem o convite do Google. Vale para todos os pacientes deste telefone.', 'Os lembretes de consultas marcadas continuam.'], botao: 'Marcar' }))) return;
    p24('paciente_nao_contatar', { paciente_id: p.paciente_id, marcar: true }).then(r => {
      if (!r.ok) { rapida(pacErro(r)); return; }
      PAC.sujo = true; PAC.aviso = 'Marcado: não recebe mais avisos' + (r.pacientes > 1 ? ' (vale para os ' + r.pacientes + ' pacientes deste telefone).' : '.'); pacFichaAbrir(p.paciente_id);
    }).catch(() => rapida(PAC_ERROS.interno));
    return;
  }
  if (!(await confirmar({ titulo: 'Voltar a enviar avisos', texto: 'Só faça isso se o próprio paciente pediu.', frase: PAC_FRASE, botao: 'Voltar a enviar avisos', nivel: 3 }))) return;
  p24('paciente_nao_contatar', { paciente_id: p.paciente_id, marcar: false, frase: PAC_FRASE }).then(r => {
    if (!r.ok) { rapida(pacErro(r)); return; }
    PAC.sujo = true; PAC.aviso = 'Pronto: volta a receber os avisos' + (r.pacientes > 1 ? ' (vale para os ' + r.pacientes + ' pacientes deste telefone).' : '.'); pacFichaAbrir(p.paciente_id);
  }).catch(() => rapida(PAC_ERROS.interno));
}
// Excluir (pedido do paciente, LGPD): nível 3, digitar o nome. Com consulta futura, o servidor recusa.
async function pacExcluir(p) {
  const textos = ['Use só quando o próprio paciente pedir (LGPD). O cadastro é apagado; as consultas passadas ficam na agenda como "Paciente excluído", sem nome, telefone nem resumo.',
    'Saem também as respostas da pré-consulta, o lugar na lista de espera e os documentos lidos desse telefone (se nenhum outro paciente usa o número). A conversa continua no WhatsApp da clínica. Não dá para desfazer.',
    pacReservio() ? 'A clínica usa o Reservio: exclua o paciente também lá, senão a próxima sincronização pode trazê-lo de volta.' : null];
  if (!(await confirmar({ titulo: 'Excluir ' + p.nome + '?', texto: textos, frase: p.nome, botao: 'Excluir', perigo: true, nivel: 3 }))) return;
  p24('paciente_excluir', { paciente_id: p.paciente_id, confirmar: true }).then(r => {
    if (!r.ok && r.erro === 'consulta_futura') {
      const n = r.consultas_futuras || 1;
      anexar($('pacAcaoArea'), aviso('perigo', p.nome + ' tem ' + n + (n === 1 ? ' consulta futura marcada' : ' consultas futuras marcadas') + '. Cancele na Agenda antes de excluir. ', el('button', { class: 'link', type: 'button', 'data-ir': 'agenda', text: 'Abrir a Agenda' })));
      return;
    }
    if (!r.ok) { rapida(pacErro(r)); return; }
    PAC.sujo = true;
    rapida('Paciente excluído.' + (r.consultas_anonimizadas ? ' ' + pl(r.consultas_anonimizadas, 'consulta ficou', 'consultas ficaram') + ' como "Paciente excluído".' : '') + (r.documentos_mantidos ? ' Os documentos desse telefone ficaram, porque outro paciente usa o mesmo número.' : ''), { ms: 7000 });
    ir('pacientes');
  }).catch(() => rapida(PAC_ERROS.interno));
}
// Novo paciente e editar a ficha (folha H). Duplicado: "Abrir o que já existe".
function pacForm(p) {
  const campo = (k, rot, tipo, val, extra) => {
    extra = extra || {};
    const i = el(tipo === 'textarea' ? 'textarea' : 'input', { class: 'entrada', id: 'pacF_' + k, type: tipo === 'textarea' ? null : tipo, value: tipo === 'textarea' ? null : (val || ''), maxlength: extra.max ? String(extra.max) : null, placeholder: extra.ph || null, ...(extra.attrs || {}) });
    if (tipo === 'textarea') i.value = val || '';
    return [el('div', { class: 'campo' }, el('label', { for: 'pacF_' + k, text: rot }), extra.hint ? el('p', { class: 'dica', text: extra.hint }) : null, i), i];
  };
  const [cNome, nome] = campo('nome', 'Nome completo', 'text', p && p.nome, { max: 120, ph: 'Ana Souza', attrs: { autocomplete: 'off', autocapitalize: 'words' } });
  const [cTel, tel] = campo('telefone', 'Telefone com DDD', 'tel', p && pacTel(p.telefone), { max: 25, ph: '(48) 99999-0000', hint: 'É por ele que a assistente reconhece o paciente no WhatsApp.', attrs: { inputmode: 'tel', autocomplete: 'off' } });
  const [cEmail, email] = campo('email', 'E-mail', 'email', p && p.email, { max: 120, ph: 'ana@exemplo.com', attrs: { inputmode: 'email', autocapitalize: 'off', autocomplete: 'off' } });
  const [cNasc, nasc] = campo('data_nascimento', 'Data de nascimento', 'date', p && p.data_nascimento ? String(p.data_nascimento).slice(0, 10) : '', { attrs: { max: new Date().toISOString().slice(0, 10), min: '1900-01-01' } });
  const [cObs, obs] = campo('observacao', 'Observação', 'textarea', p && p.observacao, { max: 300, hint: PAC_OBS_AVISO, ph: 'Prefere horários pela manhã' });
  const erro = el('div', { 'aria-live': 'polite' });
  const salvar = el('button', { class: 'btn pri', type: 'button', text: p ? 'Salvar' : 'Cadastrar paciente', id: 'pacSalvar' });
  const f = folha(p ? 'Editar paciente' : 'Novo paciente', el('div', { class: 'form', id: 'pacForm' }, erro, cNome, cTel, cEmail, cNasc, cObs,
    p && pacReservio() ? el('p', { class: 'dica', text: 'A clínica usa o Reservio: se mudar o nome ou o telefone, mude também lá.' }) : null,
    p ? el('p', { class: 'dica', text: 'Ao mudar o nome ou o telefone, as consultas futuras deste paciente passam a usar os novos; as passadas ficam como estão.' }) : null),
  { pe: [btn('Cancelar', () => f.fechar(), 'sec'), salvar], foco: '#pacF_nome' });
  salvar.addEventListener('click', () => {
    trocar(erro);
    const dados = { nome: nome.value, telefone: tel.value, email: email.value, data_nascimento: nasc.value, observacao: obs.value };
    if (p) dados.paciente_id = p.paciente_id;
    if (!dados.nome.trim()) { trocar(erro, aviso('perigo', PAC_ERROS.nome)); nome.focus(); return; }
    if (pacDig(dados.telefone).length < 10) { trocar(erro, aviso('perigo', PAC_ERROS.telefone)); tel.focus(); return; }
    salvar.disabled = true;
    p24('paciente_salvar', dados).then(r => {
      salvar.disabled = false;
      if (!r.ok && r.erro === 'duplicado') { trocar(erro, aviso('atencao', 'Já existe um paciente com esse nome e esse telefone. ', el('button', { class: 'link', type: 'button', 'data-ir': 'pacientes/ficha/' + r.paciente_id_existente, text: 'Abrir o que já existe' }), p ? ' (se for a mesma pessoa, junte os dois pela ficha).' : '')); return; }
      if (!r.ok) { trocar(erro, aviso('perigo', pacErro(r))); const c = { nascimento: nasc, nome, telefone: tel, email, observacao: obs }[r.erro]; if (c) c.focus(); return; }
      f.limpar(); f.fechar(); PAC.sujo = true;
      PAC.aviso = p ? 'Salvo.' + (r.consultas_futuras_atualizadas ? ' ' + r.consultas_futuras_atualizadas + (r.consultas_futuras_atualizadas === 1 ? ' consulta futura passou' : ' consultas futuras passaram') + ' a usar o nome e o telefone novos.' : '') : 'Paciente cadastrado.';
      if (location.hash === '#pacientes/ficha/' + r.paciente_id) pacFichaAbrir(r.paciente_id); else ir('pacientes/ficha/' + r.paciente_id);
    }).catch(() => { salvar.disabled = false; trocar(erro, aviso('perigo', PAC_ERROS.interno)); });
  });
}
// ---------------------------------------------------------------- Pacientes › Organizar (D): duplicados, importar e importações
tela('pacientes/organizar', {
  montar: () => [cabTela('Organizar', { voltar: VOLTA_PAC }), el('div', { class: 'lista' }, linhaLink('Possíveis duplicados', 'Cadastros com o mesmo nome', 'pacientes/duplicados', 'duplicados'),
    linhaLink('Importar pacientes', 'De uma planilha CSV, em 4 passos', 'pacientes/importar', 'importar'), linhaLink('Importações', 'Ver e desfazer em até 7 dias', 'pacientes/importacoes', 'notas'))]
});
const VOLTA_ORG = ['pacientes/organizar', 'Organizar'];
tela('pacientes/duplicados', {
  montar: () => [cabTela('Possíveis duplicados', { voltar: VOLTA_ORG, sub: 'Cadastros com o mesmo nome (sem contar acento, maiúsculas e espaços). Junte quando forem a mesma pessoa; mãe e filha com o mesmo nome continuam separadas.' }), el('div', { id: 'pacDup' })],
  entrar: () => pacDupCarregar()
});
function pacDupCarregar() {
  const box = $('pacDup'); trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  p24('paciente_duplicados', {}).then(d => {
    if (!d.ok) { trocar(box, aviso('perigo', pacErro(d))); return; }
    const gs = d.grupos || [];
    if (!gs.length) { trocar(box, el('div', { class: 'cartao' }, vazio('Nenhum duplicado encontrado', 'Não há dois cadastros com o mesmo nome.'))); return; }
    trocar(box, el('p', { class: 'mudo peq bloco', text: gs.length === 1 ? '1 grupo' : gs.length + ' grupos' + (gs.length >= 200 ? ' (os 200 primeiros, em ordem alfabética)' : '') }),
      gs.map(g => el('div', { class: 'bloco pc-painel' }, el('h2', { class: 'tit-bloco' }, g.nome, etq(g.mesmo_telefone ? 'mesmo telefone' : 'telefones diferentes', g.mesmo_telefone ? 'atencao' : '')),
        el('div', { class: 'lista' }, (g.pacientes || []).map(q => el('button', { class: 'linha', type: 'button', 'data-ir': 'pacientes/ficha/' + q.paciente_id }, el('span', { class: 'av', text: iniciais(q.nome) }),
          el('span', { class: 'tx' }, el('span', { class: 't1', text: q.nome }), el('span', { class: 't2', text: [pacTel(q.telefone), q.paciente_id, pacOrigem(q)].filter(Boolean).join(' · ') })), el('span', { class: 'seta' }, icone('seta'))))),
        (g.pacientes || []).length === 2 ? el('div', { class: 'pilha' }, btn('Juntar estes dois', () => pacJuntarConfirmar(g.pacientes[0], g.pacientes[1]), 'sec plena')) : el('p', { class: 'dica', text: 'Abra cada cadastro para juntar dois de cada vez.' }))));
  }).catch(() => trocar(box, aviso('perigo', PAC_ERROS.interno)));
}
// ---------------------------------------------------------------- importar pacientes (molde F): lido e limpo AQUI; só nome, telefone, e-mail, nascimento e observação vão ao servidor
const IMP_LOTE = 500, IMP_MAX = 20000;
const IMP_CAMPOS = [{ k: 'nome', rot: 'Nome', obrig: true }, { k: 'sobrenome', rot: 'Sobrenome (se vier separado)' }, { k: 'telefone', rot: 'Telefone', obrig: true }, { k: 'email', rot: 'E-mail' }, { k: 'nascimento', rot: 'Nascimento' }, { k: 'observacao', rot: 'Observação' }];
const IMP_NOMES = { nome: ['nome', 'nome completo', 'nome do paciente', 'paciente', 'cliente', 'nome do cliente', 'name', 'full name', 'client', 'client name', 'customer', 'customer name', 'first name', 'primeiro nome'],
  sobrenome: ['sobrenome', 'ultimo nome', 'last name', 'surname'], telefone: ['telefone', 'celular', 'whatsapp', 'fone', 'telefone celular', 'telefone 1', 'tel', 'phone', 'phone number', 'mobile', 'mobile phone', 'cell', 'telephone'],
  email: ['email', 'e-mail', 'e mail', 'mail', 'endereco de email', 'email address'], nascimento: ['nascimento', 'data de nascimento', 'data nascimento', 'dt nascimento', 'aniversario', 'birth date', 'birthdate', 'date of birth', 'birthday', 'dob'],
  observacao: ['observacao', 'observacoes', 'obs', 'nota', 'notas', 'anotacao', 'anotacoes', 'comentario', 'comentarios', 'note', 'notes', 'comment', 'comments'] };
let IMP = null;
tela('pacientes/importar', {
  montar: () => [cabTela('Importar pacientes', { voltar: VOLTA_ORG, sub: 'Traga os pacientes do Reservio ou de outro sistema por uma planilha CSV. Você vê uma prévia antes de gravar, e quem já está cadastrado não é duplicado.' }), el('div', { class: 'molde-f', id: 'impTela' })],
  entrar: () => { if (sem('pacientes')) { ir('pacientes'); return; } if (!IMP) impInicio(); }
});
function impTela(passo) { const t = $('impTela'); trocar(t, passosF('impPassos', ['Arquivo', 'Colunas', 'Prévia', 'Importar'], passo)); return t; }
function impMapaAuto(cab) {
  const mapa = {}, usados = {};
  IMP_CAMPOS.forEach(f => {
    // A observação NUNCA é escolhida sozinha: pode ter conteúdo clínico. Só entra se a clínica escolher a coluna.
    if (f.k === 'observacao') { mapa[f.k] = -1; return; }
    const nomes = IMP_NOMES[f.k] || [];
    let i = cab.findIndex((h, j) => !usados[j] && nomes.includes(impSem(h)));
    if (i < 0) i = cab.findIndex((h, j) => { const x = impSem(h); return !usados[j] && x && nomes.some(n => n.length > 3 && x.includes(n)); });
    mapa[f.k] = i; if (i >= 0) usados[i] = true;
  });
  if (mapa.sobrenome >= 0 && mapa.nome < 0) { mapa.nome = mapa.sobrenome; mapa.sobrenome = -1; }
  return mapa;
}
function impChaveTel(d) { const x = d.length >= 12 && d.slice(0, 2) === '55' ? d.slice(2) : d; return x.slice(0, 2) + x.slice(-8); }
// Datas: dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa, dd/mm/aa, aaaa-mm-dd. "" = vazio; null = inválida.
function impData(t) {
  const v = String(t || '').trim(); if (!v) return '';
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/), a, me, d;
  if (m) { a = +m[1]; me = +m[2]; d = +m[3]; }
  else if ((m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})(\s|$|T)/))) { d = +m[1]; me = +m[2]; a = +m[3]; if (m[3].length === 2) { const aa = new Date().getFullYear() % 100; a += a > aa ? 1900 : 2000; } }
  else return null;
  const dt = new Date(Date.UTC(a, me - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== me - 1 || dt.getUTCDate() !== d || a < 1900 || dt.getTime() > Date.now()) return null;
  return a + '-' + String(me).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
const impCol = (r, k) => IMP.mapa[k] >= 0 ? String(r[IMP.mapa[k]] == null ? '' : r[IMP.mapa[k]]).trim() : '';
function impPreparar() {
  const validas = [], erros = [], vistos = {}; let repetidas = 0;
  IMP.dados.forEach((r, i) => {
    const linha = i + 2; if (!r.some(x => String(x).trim())) return;
    const nome = (impCol(r, 'nome') + ' ' + impCol(r, 'sobrenome')).replace(/\s+/g, ' ').trim().slice(0, 120), tel = impTel(impCol(r, 'telefone')), email = impCol(r, 'email').toLowerCase(), nasc = impData(impCol(r, 'nascimento'));
    const motivo = !nome ? 'sem nome' : !impTelOk(tel) ? 'telefone sem DDD' : (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ? 'e-mail inválido' : nasc === null ? 'data de nascimento inválida' : '';
    if (motivo) { erros.push({ linha, motivo }); return; }
    const k = impChaveTel(tel) + '|' + impSem(nome); if (vistos[k]) { repetidas++; return; } vistos[k] = true;
    validas.push({ linha: String(linha), nome, telefone: tel, email, nascimento: nasc, observacao: impCol(r, 'observacao').slice(0, 300) });
  });
  IMP.validas = validas; IMP.erros = erros; IMP.repetidas = repetidas;
}
function impInicio() {
  IMP = null; const t = impTela(1), msg = el('div', { 'aria-live': 'polite' });
  const inp = el('input', { type: 'file', id: 'impArquivo', accept: '.csv,.txt,.xlsx,.xls,.numbers,text/csv,text/plain,text/comma-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  inp.addEventListener('change', () => impLerArquivo(inp, msg, IMP_MAX, (f, linhas, sep) => { const cab = linhas[0].map(h => String(h).trim()); IMP = { arquivo: f.name, sep, cab, dados: linhas.slice(1), mapa: impMapaAuto(cab) }; impColunas(); }));
  anexar(t, el('label', { class: 'arquivo cartao' }, icone('importar', 'g'), el('strong', { text: 'Escolher a planilha (CSV)' }), el('span', { class: 'mudo peq', text: 'No iPad e no iPhone, abre o app Arquivos.' }), inp, el('span', { class: 'btn pri', text: 'Escolher arquivo' })),
    el('div', { class: 'pilha' }, aviso('', 'Como exportar: no Reservio (ou no seu sistema), exporte a lista de clientes. Se vier em Excel (.xlsx), abra no app Numbers, toque em ⋯ › Exportar › CSV e escolha o arquivo exportado aqui. A planilha precisa ter o nome e o telefone com DDD de cada paciente; a primeira linha deve ser a dos títulos das colunas.')),
    el('p', { class: 'dica', text: 'O arquivo é lido aqui no seu aparelho. Só o nome, o telefone, o e-mail, o nascimento e a observação de cada paciente vão para a RXSync; as outras colunas (CPF, endereço etc.) ficam só no aparelho. Até ' + IMP_MAX.toLocaleString('pt-BR') + ' linhas por arquivo.' }), msg);
}
function impColunas() {
  const t = impTela(2), nao = el('p', { class: 'dica' }), am = el('div', { class: 'cartao rolar-x' }), erro = el('div', { 'aria-live': 'polite' }), avObs = aviso('atencao', 'Só importe se essa coluna tiver informação administrativa (ex.: "prefere manhã", "convênio X"). Nada clínico: diagnóstico, alergia, medicamento ou queixa.');
  avObs.id = 'impAvisoObs'; avObs.hidden = IMP.mapa.observacao < 0;
  const amostra = () => {
    const usadas = IMP_CAMPOS.map(f => IMP.mapa[f.k]), fora = IMP.cab.filter((h, i) => !usadas.includes(i));
    nao.textContent = fora.length ? 'Ficam só no aparelho (não são enviadas): ' + fora.map(h => h || 'coluna sem título').join(', ') + '.' : '';
    trocar(am, el('table', { class: 'tabela-amostra' }, el('tr', {}, ['Linha', 'Nome', 'Telefone', 'E-mail', 'Nascimento', 'Observação'].map(x => el('th', { text: x }))),
      IMP.dados.slice(0, 5).map((r, i) => { const n = impData(impCol(r, 'nascimento'));
        return el('tr', {}, [String(i + 2), (impCol(r, 'nome') + ' ' + impCol(r, 'sobrenome')).trim(), pacTel(impTel(impCol(r, 'telefone'))) || impTel(impCol(r, 'telefone')), impCol(r, 'email').toLowerCase(), n ? n.split('-').reverse().join('/') : (n === null ? 'inválida' : ''), impCol(r, 'observacao')].map(x => el('td', { text: x || '—' }))); })));
  };
  anexar(t, el('p', { class: 'mudo bloco', text: 'Arquivo ' + IMP.arquivo + ': ' + IMP.dados.length.toLocaleString('pt-BR') + (IMP.dados.length === 1 ? ' linha' : ' linhas') + '. Confira de qual coluna vem cada informação.' }),
    el('div', { class: 'cartao pad mapa-colunas' }, IMP_CAMPOS.map(f => {
      const s = el('select', { class: 'entrada', id: 'impCol_' + f.k }, el('option', { value: '-1', text: f.obrig ? 'Escolha a coluna' : f.k === 'observacao' ? 'Não importar' : 'Não usar' }), IMP.cab.map((h, i) => el('option', { value: String(i), text: h || 'Coluna ' + (i + 1) })));
      s.value = String(IMP.mapa[f.k]); s.addEventListener('change', () => { IMP.mapa[f.k] = +s.value; if (f.k === 'observacao') avObs.hidden = IMP.mapa.observacao < 0; amostra(); });
      return [el('label', { for: 'impCol_' + f.k }, f.rot + (f.obrig ? ' *' : ''), s), f.k === 'observacao' ? avObs : null];
    })), nao, el('h2', { class: 'tit-bloco pilha', text: 'Como vai ficar (5 primeiras linhas)' }), am, erro,
    el('div', { class: 'pilha' }, btn('Ver a prévia', () => { trocar(erro); if (IMP.mapa.nome < 0 || IMP.mapa.telefone < 0) { trocar(erro, aviso('perigo', 'Escolha as colunas do nome e do telefone.')); return; } impPrevia(); }, 'pri plena'), btn('Escolher outro arquivo', impInicio, 'sec plena')));
  amostra();
}
function impLotes(gravar, aoAvancar) {
  const lotes = []; for (let i = 0; i < IMP.validas.length; i += IMP_LOTE) lotes.push(IMP.validas.slice(i, i + IMP_LOTE));
  let tot = { novos: 0, existentes: 0, completados: 0, parecidos: 0, repetidas: 0, erros: 0, lista_erros: [] }, k = gravar ? (IMP.proximo || 0) : 0;
  if (gravar && IMP.totGravacao) tot = IMP.totGravacao;
  const um = () => {
    if (k >= lotes.length) return Promise.resolve(tot);
    aoAvancar(k, lotes.length);
    const dados = { origem: 'planilha', gravar, linhas: lotes[k] }; if (gravar && IMP.importacao_id) dados.importacao_id = String(IMP.importacao_id);
    return p24('paciente_importar', dados).then(r => {
      if (!r.ok) { const e = new Error('servidor'); e.r = r; throw e; }
      ['novos', 'existentes', 'completados', 'parecidos', 'repetidas', 'erros'].forEach(x => { tot[x] += r[x] || 0; }); (r.lista_erros || []).forEach(x => tot.lista_erros.push(x));
      if (gravar) { IMP.importacao_id = IMP.importacao_id || r.importacao_id; IMP.proximo = k + 1; IMP.totGravacao = tot; }
      k++; return um();
    });
  };
  return lotes.length ? um() : Promise.resolve(tot);
}
const impErrosTodos = tot => IMP.erros.map(e => ({ linha: e.linha, motivo: e.motivo })).concat((tot.lista_erros || []).map(e => ({ linha: +e.linha, motivo: e.motivo }))).sort((a, b) => a.linha - b.linha);
function impPrevia() {
  impPreparar(); delete IMP.importacao_id; delete IMP.proximo; delete IMP.totGravacao;   // prévia nova = importação nova
  const t = impTela(3), barra = el('div', { class: 'barra-prog' }, el('i')), st = el('p', { class: 'dica', 'aria-live': 'polite' });
  anexar(t, el('p', { class: 'mudo', text: 'Conferindo ' + IMP.validas.length.toLocaleString('pt-BR') + ' pacientes com o cadastro da clínica. Nada é gravado nesta etapa.' }), barra, st);
  impLotes(false, (k, n) => { largura(barra.firstChild, k / n * 100); st.textContent = 'Lote ' + (k + 1) + ' de ' + n + '…'; }).then(tot => { IMP.previa = tot; impConfirmar(); })
    .catch(e => anexar(t, aviso('perigo', (e && e.r && pacErro(e.r)) || PAC_ERROS.interno), btn('Tentar de novo', impPrevia, 'pri plena')));
}
function impListaErros(erros) {
  if (!erros.length) return null;
  return [el('h2', { class: 'tit-bloco pilha' }, 'Linhas com erro', el('span', { class: 'extra', text: erros.length > 100 ? 'as 100 primeiras de ' + erros.length.toLocaleString('pt-BR') : '' })),
    el('div', { class: 'lista' }, erros.slice(0, 100).map(e => el('div', { class: 'linha' }, el('span', { class: 'tx' }, el('span', { class: 't1', text: 'Linha ' + e.linha }), el('span', { class: 't2', text: e.motivo }))))),
    el('div', { class: 'pilha' }, btn('Baixar as linhas com erro (CSV)', () => impBaixarCsv(IMP.cab, IMP.dados, erros, 'linhas-com-erro-' + String(IMP.arquivo || 'planilha').replace(/\.[^.]+$/, '') + '.csv'), 'sec plena')),
    el('p', { class: 'dica', text: 'Essas linhas não são importadas. Corrija na planilha e importe só elas depois, se quiser.' })];
}
function impConfirmar() {
  const p = IMP.previa, t = impTela(3), erros = impErrosTodos(p), det = [];
  if (p.existentes) det.push('Os já cadastrados (mesmo nome, sem contar acento, e mesmo telefone) não são duplicados: só completamos o e-mail, o nascimento e a observação que estiverem vazios.');
  if (p.parecidos) det.push('Os que têm o telefone de outro paciente com outro nome (por exemplo, mãe e filho) entram como pacientes novos; confira depois em Possíveis duplicados.');
  if (IMP.mapa.observacao >= 0) { const n = IMP.validas.filter(v => v.observacao).length; det.push(n === 1 ? '1 linha tem observação preenchida (vai ser importada). Confira se é só informação administrativa.' : n + ' linhas têm observação preenchida (vão ser importadas). Confira se é só informação administrativa.'); }
  if (IMP.repetidas + p.repetidas) det.push(pl(IMP.repetidas + p.repetidas, 'linha repetida', 'linhas repetidas') + ' no próprio arquivo ' + (IMP.repetidas + p.repetidas === 1 ? 'ficou' : 'ficaram') + ' de fora.');
  anexar(t, el('div', { class: 'numeros bloco' }, numeroGrande('pacientes novos', p.novos), numeroGrande('já cadastrados', p.existentes), numeroGrande('com o telefone de outro paciente', p.parecidos), numeroGrande('com erro', erros.length)),
    det.map(x => el('p', { class: 'dica', text: x })), impListaErros(erros));
  if (!p.novos && !p.existentes) { anexar(t, el('div', { class: 'pilha' }, aviso('atencao', 'Não há nenhum paciente para importar neste arquivo.'), btn('Escolher outro arquivo', impInicio, 'sec plena'))); return; }
  const cb = el('input', { type: 'checkbox' });
  const texto = p.novos ? 'Importar ' + p.novos.toLocaleString('pt-BR') + (p.novos === 1 ? ' paciente' : ' pacientes') : 'Completar ' + pl(p.existentes, 'cadastro', 'cadastros');
  const ir1 = btn(texto, async () => {
    if (!cb.checked) return;
    if (!(await confirmar({ titulo: texto + '?', texto: ['Os pacientes importados não recebem nenhuma mensagem automática até escreverem para a clínica no WhatsApp.', 'Dá para desfazer em até 7 dias, em Pacientes › Organizar › Importações.'], botao: texto }))) return;
    impGravar();
  }, 'pri plena', null, { disabled: true });
  cb.addEventListener('change', () => { ir1.disabled = !cb.checked; });
  anexar(t, el('div', { class: 'pilha' }, aviso('atencao', 'Os pacientes importados não recebem nenhuma mensagem automática (aviso de retorno, convite para voltar, convite do Google, lembretes) até escreverem para a clínica no WhatsApp.'),
    IMP.mapa.observacao >= 0 ? aviso('', 'A observação é só administrativa. Se a planilha tiver sintomas, diagnóstico ou tratamento nessa coluna, volte e marque Observação como "Não importar".') : null,
    el('label', { class: 'marcar' }, cb, el('span', { text: 'Confirmo que a clínica tem autorização para guardar esses dados dos pacientes (LGPD).' })), ir1, btn('Voltar às colunas', impColunas, 'sec plena')));
}
function impGravar() {
  const t = impTela(4), barra = el('div', { class: 'barra-prog' }, el('i')), st = el('p', { class: 'dica', 'aria-live': 'polite' });
  anexar(t, el('p', { class: 'mudo', text: 'Importando. Deixe esta tela aberta até terminar.' }), barra, st);
  impLotes(true, (k, n) => { largura(barra.firstChild, k / n * 100); st.textContent = 'Lote ' + (k + 1) + ' de ' + n + '…'; }).then(tot => {
    PAC.sujo = true;
    const t2 = impTela(5);
    anexar(t2, aviso('ok', 'Importação concluída.'), el('div', { class: 'numeros bloco' }, numeroGrande('pacientes novos', tot.novos), numeroGrande('já cadastrados', tot.existentes), numeroGrande('cadastros completados', tot.completados), numeroGrande('com erro (não importados)', impErrosTodos(tot).length)),
      el('div', { class: 'pilha' }, btn('Ver pacientes importados', () => { PAC.filtro = 'importados_sem_conversa'; PAC.busca = ''; PAC.sujo = true; const fl = $('pacFiltro'); if (fl) fl.value = PAC.filtro; const b = $('pacBusca'); if (b) b.value = ''; ir('pacientes'); }, 'pri plena'),
        btn('Desfazer importação', () => impDesfazer({ id: IMP.importacao_id, completados: tot.completados }, () => impInicio()), 'perigo-sec plena'), btn('Importar outro arquivo', impInicio, 'sec plena')));
  }).catch(e => {
    const r = e && e.r;
    if (r && r.erro === 'limite') { anexar(t, aviso('perigo', 'A clínica chegou ao limite de 50.000 pacientes. Fale com a RXSync.')); return; }
    anexar(t, aviso('perigo', 'A importação parou no lote ' + ((IMP.proximo || 0) + 1) + '. ' + ((r && pacErro(r)) || 'Verifique a internet.') + ' O que já foi gravado está salvo; tentar de novo continua de onde parou, sem duplicar.'), btn('Tentar de novo', impGravar, 'pri plena'));
  });
}
async function impDesfazer(imp, depois) {
  const textos = ['Saem os pacientes criados por ela que ainda não têm consulta, não conversaram com a clínica e não foram editados. Os que já tinham consulta, conversa ou edição ficam.',
    imp.completados === 1 ? 'O paciente que já existia e foi completado (e-mail, nascimento, observação) não volta atrás.' : imp.completados ? 'Os ' + imp.completados + ' pacientes que já existiam e foram completados não voltam atrás.' : 'Os pacientes que já existiam e foram completados não voltam atrás.'];
  if (!(await confirmar({ titulo: 'Desfazer esta importação?', texto: textos, botao: 'Desfazer importação', perigo: true }))) return;
  p24('paciente_importacao_desfazer', { importacao_id: String(imp.id) }).then(r => {
    if (!r.ok) { rapida(r.erro === 'prazo' ? 'Essa importação já foi desfeita ou passou dos 7 dias.' : pacErro(r)); return; }
    PAC.sujo = true;
    rapida('Importação desfeita: ' + pl(r.removidos, 'paciente removido', 'pacientes removidos') + '.' + (r.mantidos ? ' ' + r.mantidos + ' ficaram porque já têm consulta, conversa ou edição.' : '') + (r.completados_mantidos ? ' ' + (r.completados_mantidos === 1 ? '1 cadastro completado continua como está.' : r.completados_mantidos + ' cadastros completados continuam como estão.') : ''), { ms: 9000 });
    if (depois) depois();
  }).catch(() => rapida(PAC_ERROS.interno));
}
tela('pacientes/importacoes', {
  montar: () => [cabTela('Importações', { voltar: VOLTA_ORG, sub: 'As 10 últimas. Dá para desfazer uma importação em até 7 dias.' }), el('div', { id: 'impLista' })],
  entrar: () => impListaCarregar()
});
function impListaCarregar() {
  const box = $('impLista'); trocar(box, el('div', { class: 'cartao' }, esqueleto()));
  p24('paciente_importacoes', {}).then(d => {
    if (!d.ok) { trocar(box, aviso('perigo', pacErro(d))); return; }
    const l = d.importacoes || [];
    if (!l.length) { trocar(box, el('div', { class: 'cartao' }, vazio('Nenhuma importação ainda', null, btn('Importar pacientes', () => ir('pacientes/importar'), 'sec')))); return; }
    trocar(box, el('div', { class: 'lista' }, l.map(i => el('div', { class: 'linha' }, el('span', { class: 'tx' }, el('span', { class: 't1' }, fmtQuando(i.criado_em) + ' ', etq(i.origem === 'planilha' ? 'Planilha' : 'Reservio', '')),
      el('span', { class: 't2', text: [pl(i.novos, 'novo', 'novos'), pl(i.existentes, 'já cadastrado', 'já cadastrados'), pl(i.completados, 'completado', 'completados'), i.erros + ' com erro'].join(' · ') }),
      el('span', { class: 't2', text: i.desfeita_em ? 'Desfeita em ' + fmtQuando(i.desfeita_em) + '.' : i.pode_desfazer ? 'Desfazer até ' + fmtDia(new Date(new Date(i.criado_em).getTime() + 7 * 86400000).toISOString()) + '. Os que já existiam e foram completados não voltam atrás.' : 'Passou o prazo de 7 dias para desfazer.' })),
    !i.desfeita_em && i.pode_desfazer ? btn('Desfazer', () => impDesfazer({ id: i.id, completados: i.completados }, impListaCarregar), 'perigo-sec') : null))));
  }).catch(() => trocar(box, aviso('perigo', PAC_ERROS.interno)));
}
