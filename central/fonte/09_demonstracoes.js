// ---------------------------------------------------------------- Marketing › Demonstrações (sql/056, DEC-125)
// Um link de demonstração por clínica (rxsync.com.br/demo/clinica/#CODIGO): criar, mandar pelo WhatsApp do Jean e ver o
// uso (visitas, telas, toques, perguntas, escopo marcado e "Quero conversar"). Sem telefone do médico: o link vai pela
// mensagem que o Jean copia. A anotação e a mensagem só aparecem aqui; a demonstração recebe só o que vai na tela.
ICONES.demonstracao = 'M3.5 5.5h17v11h-17zM8.5 20h7M12 16.5V20M10 8.5l4.5 2.5-4.5 2.5z';
ICONES.copiar = 'M8.5 8.5h11v11h-11zM15.5 8.5v-4h-11v11h4';

const DEM_SIT = { nunca_abriu: ['nunca abriu', 'atencao'], abriu: ['abriu', 'info'], ativo_hoje: ['ativo hoje', 'ok'], desativado: ['desativado', ''], vencido: ['vencido', ''] };
const etqDem = s => { const [t, tom] = DEM_SIT[s] || [s || '—', '']; return etq(t, tom); };
const DEM_FILTROS = [['todos', 'Todos'], ['nunca_abriu', 'Nunca abriu'], ['abriu', 'Abriu'], ['ativo_hoje', 'Ativo hoje'], ['inativos', 'Desativados e vencidos']];
const DEM_CORES = [['verde', 'Verde'], ['azul', 'Azul'], ['petroleo', 'Petróleo'], ['vinho', 'Vinho'], ['roxo', 'Roxo'], ['grafite', 'Grafite']];
const DEM_ESPEC = ['Endocrinologia', 'Nutrologia', 'Medicina do esporte', 'Clínica geral', 'Nutrição'];
const DEM_ESCOLHA = { quero: ['Quero', 'ok'], duvida: ['Tenho dúvida', 'atencao'], nao_preciso: ['Não preciso', ''] };
const DEM_PAGINA = { entrada: 'Entrada', app: 'App do paciente', central: 'Central do médico', escopo: 'Escopo' };
const DEM_APARELHO = { celular: ['celular', 'celulares'], tablet: ['tablet', 'tablets'], computador: ['computador', 'computadores'] };
// Os 46 itens do escopo da demonstração (a mesma numeração de demo/clinica/escopo/itens.js; o verificar_site.mjs confere).
const DEM_ITENS = ['Entrar pelo link', 'Marca da clínica', 'Ícone na tela do celular', 'Boas-vindas e aceite', 'Perfil e objetivo', 'Tela inicial', 'Registrar refeição',
  'Porção e nutrientes', 'Metas do dia', 'Plano alimentar', 'Água', 'Sono', 'Atividade física', 'Humor', 'Fome e saciedade', 'Intestino', 'Outros registros', 'Remédios e vitaminas',
  'Peso e medidas', 'Gráficos de evolução', 'Avaliação da consulta', 'Fotos de progresso', 'Picadinha', 'Lembrete da aplicação', 'Rodízio do local', 'Como se sentiu',
  'Sintomas que avisam a equipe', 'Minhas consultas', 'Avisos da clínica', 'Lembretes', 'Conteúdo da clínica', 'Enviar exames', 'Equipe e contatos', 'Chat com a equipe', 'Conquistas',
  'Assistente de dúvidas', 'Meus dados', 'Leitura confortável', 'Pacientes da semana', 'Alertas', 'Ficha do app', 'Evolução do paciente', 'Metas e plano alimentar',
  'Prescrição da picadinha', 'Avisos e conteúdo', 'Funções do app'];
const nomeItem = n => DEM_ITENS[n - 1] ? `${n}. ${DEM_ITENS[n - 1]}` : 'Item ' + n;
const irD = (...partes) => ir(['demonstracoes', ...partes.filter(x => x != null && x !== '').map(x => encodeURIComponent(x))].join('/'));
const minutos = s => { const m = Math.round((Number(s) || 0) / 60); return m < 1 ? 'menos de 1 min' : fmtNum(m) + ' min'; };
const avatarDem = l => el('span', { class: 'avatar dem-cor-' + (l.cor || 'grafite'), text: iniciais(l.clinica), 'aria-hidden': 'true' });
est.demFiltro = null;
est.demVer = null; // o último "Ver como o médico vê" (link de 15 minutos), só na memória

async function copiar(texto, ok) {
  try { await navigator.clipboard.writeText(texto); rapida(ok || 'Copiado.'); } catch (e) { rapida('Não consegui copiar: selecione e copie à mão.'); }
}

TELAS.demonstracoes = async (c, [parte, a, b]) => {
  if (!ligada('tela_demonstracoes')) { topo('Demonstrações', [['Marketing'], ['Demonstrações']]); falhou(c, { desligada: true, chave: 'tela_demonstracoes' }, 'Demonstrações'); return; }
  if (parte === 'novo') return dForm(c, null);
  if (parte === 'link' && b === 'editar') return dEditar(c, a);
  if (parte === 'link') return dLink(c, a);
  if (parte === 'visita') return dVisita(c, a, b);
  return dLista(c);
};

// Aviso quando os links estão desligados (chave demo_links): a demonstração mostra "não está mais ativo" a todos.
function avisoLinksDesligados() {
  if (ligada('demo_links')) return null;
  return el('div', { class: 'aviso atencao' }, icone('alerta'), el('div', {}, el('b', { text: 'Os links estão desligados. ' }),
    ligada('demo_politica_v17') ? 'Quem abrir vê "não está mais ativo". Ligue em Ajustes da Central (Links de demonstração).'
      : 'Quem abrir vê "não está mais ativo". Eles só ligam depois da Política v17 publicada (chave só por PR).'));
}

// ---------- lista
async function dLista(c) {
  topo('Demonstrações', [['Marketing'], ['Demonstrações']]);
  est.demFiltro = est.demFiltro || { filtro: 'todos', busca: '', pagina: 1 };
  const f = est.demFiltro;
  const r = await chamar('dem_lista', { filtro: f.filtro, busca: f.busca, pagina: f.pagina }); if (falhou(c, r, 'Demonstrações')) return;
  const ct = r.contagem || {}, total = r.total || 0, paginas = Math.max(1, Math.ceil(total / 50)), editar = ligada('editar_demonstracoes');
  const busca = el('input', { class: 'entrada', type: 'search', placeholder: 'Clínica, médico, cidade ou PX-…', 'aria-label': 'Buscar link', autocomplete: 'off', enterkeyhint: 'search', value: f.busca || null });
  const buscar = () => { f.busca = busca.value.trim(); f.pagina = 1; rotear(); };
  busca.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } });
  const linha = l => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irD('link', l.id) }, avatarDem(l),
    el('div', { class: 'cresce' }, el('div', { class: 't1', text: l.clinica }),
      el('div', { class: 't2', text: [`DEM-${l.id}`, `${l.tratamento} ${l.medico}`, l.especialidade, l.cidade, l.lead_codigo,
        l.ultimo_acesso ? 'último acesso ' + fmtHora(l.ultimo_acesso) : 'criado em ' + fmtData(l.criada_em), fmtNum(l.visitas) + ' visita(s)'].filter(Boolean).join(' · ') })),
    el('div', { class: 'direita' }, l.conversar_em ? etq('quer conversar', 'atencao', true) : null, etqDem(l.situacao)), icone('seta')));
  trocar(c, cabecalho('Demonstrações', 'um link por clínica: o app e a central de exemplo com o nome dela', editar ? btn('Novo link', () => irD('novo'), 'pri', 'mais_um') : null),
    el('div', { class: 'pilha' }, avisoLinksDesligados(),
      el('div', { class: 'filtros', role: 'toolbar', 'aria-label': 'Situação do link' }, DEM_FILTROS.map(([k, nome]) => el('button', { type: 'button', 'aria-pressed': String(f.filtro === k),
        onclick: () => { f.filtro = k; f.pagina = 1; rotear(); } }, nome, el('span', { class: 'n', text: fmtNum(ct[k]) })))),
      el('div', { class: 'p-busca' }, busca, btn('Buscar', buscar, 'sec', 'busca')),
      cartao(null, null, (r.links || []).length ? el('ul', { class: 'lista' }, r.links.map(linha))
        : vazio(ct.todos ? 'Nenhum link com esse filtro.' : 'Nenhum link ainda. Crie o primeiro com o nome da clínica e do médico.', 'demonstracao')),
      paginas > 1 ? el('div', { class: 'acoes' }, f.pagina > 1 ? btn('Anteriores', () => { f.pagina--; rotear(); }, 'sec') : null, el('span', { class: 'mudo peq p-pagina', text: `página ${f.pagina} de ${paginas}` }),
        f.pagina < paginas ? btn('Próximos', () => { f.pagina++; rotear(); }, 'sec') : null) : null));
}

// ---------- formulário (criar e editar): os mesmos campos; a validade é em dias ao criar e em data ao editar
function camposDem(l) {
  const v = l || {};
  const entrada = (k, rot, props, ajuda) => { const i = el('input', { class: 'entrada', id: 'd-' + k, autocomplete: 'off', spellcheck: 'false', value: v[k] == null ? null : String(v[k]), ...props });
    return [i, el('label', { class: 'campo', for: 'd-' + k }, el('span', { class: 'rot', text: rot }), i, ajuda ? el('span', { class: 'ajuda', text: ajuda }) : null)]; };
  const [clinica, cClinica] = entrada('clinica', 'Nome da clínica', { maxlength: '60', required: true }, 'Aparece no app, na central e no escopo da demonstração.');
  const trat = el('select', { class: 'entrada', id: 'd-tratamento' }, ['Dr.', 'Dra.'].map(t => el('option', { value: t, text: t, selected: (v.tratamento || 'Dr.') === t })));
  const [medico, cMedico] = entrada('medico', 'Nome do médico', { maxlength: '60', required: true });
  const outra = v.especialidade && !DEM_ESPEC.includes(v.especialidade);
  const espSel = el('select', { class: 'entrada', id: 'd-especialidade' }, [...DEM_ESPEC.map(e => el('option', { value: e, text: e, selected: v.especialidade === e })),
    el('option', { value: '', text: 'Outra (escrever)', selected: outra })]);
  const espOutra = el('input', { class: 'entrada', id: 'd-especialidade-outra', maxlength: '40', autocomplete: 'off', value: outra ? v.especialidade : null, 'aria-label': 'Outra especialidade' });
  const cOutra = el('label', { class: 'campo', for: 'd-especialidade-outra', hidden: !outra }, el('span', { class: 'rot', text: 'Qual especialidade' }), espOutra);
  espSel.addEventListener('change', () => { cOutra.hidden = espSel.value !== ''; if (!cOutra.hidden) espOutra.focus(); });
  const [cidade, cCidade] = entrada('cidade', 'Cidade (opcional)', { maxlength: '40' }, 'Aparece nos exemplos de consulta.');
  let cor = v.cor || 'verde';
  const cores = el('div', { class: 'dem-cores', role: 'radiogroup', 'aria-label': 'Cor da clínica' }, DEM_CORES.map(([k, nome]) => el('button', { type: 'button', role: 'radio', class: 'dem-cor',
    'aria-checked': String(cor === k), 'aria-label': nome, title: nome, onclick: e => { cor = k; cores.querySelectorAll('[role=radio]').forEach(x => x.setAttribute('aria-checked', String(x === e.currentTarget))); } },
    el('span', { class: 'dem-amostra dem-cor-' + k, 'aria-hidden': 'true' }), el('span', { text: nome }))));
  const validade = l ? el('input', { class: 'entrada', id: 'd-valida_ate', type: 'date', min: hojeISO(), value: v.valida_ate || null })
    : el('input', { class: 'entrada', id: 'd-dias', type: 'number', inputmode: 'numeric', min: '1', max: '365', value: '60' });
  const [lead, cLead] = entrada('lead_codigo', 'Lead da prospecção (opcional)', { maxlength: '8', placeholder: 'PX-…', autocapitalize: 'characters' }, 'Liga a demonstração ao lead: só o código, nunca o telefone.');
  const anotacao = el('textarea', { class: 'entrada', id: 'd-anotacao', rows: '3', maxlength: '1000', autocomplete: 'off', value: v.anotacao || '' });
  const mensagem = el('textarea', { class: 'entrada', id: 'd-mensagem', rows: '4', maxlength: '1000', autocomplete: 'off', value: l && l.mensagem_editada ? l.mensagem : '' });
  const ler = () => ({ clinica: clinica.value.trim(), tratamento: trat.value, medico: medico.value.trim(), especialidade: (espSel.value || espOutra.value).trim(),
    cidade: cidade.value.trim(), cor, lead_codigo: lead.value.trim().toUpperCase(), anotacao: anotacao.value.trim(), mensagem: mensagem.value.trim(),
    ...(l ? { valida_ate: validade.value } : { dias: validade.value.trim() }) });
  const conferir = x => !x.clinica ? 'Preencha o nome da clínica.' : !x.medico ? 'Preencha o nome do médico.' : !x.especialidade ? 'Escolha ou escreva a especialidade.'
    : x.lead_codigo && !/^PX-[ACDEFGHJKMNPQRTUVWXY3479]{5}$/.test(x.lead_codigo) ? 'O lead é "PX-" e 5 letras (ou deixe vazio).'
    : l ? (!/^\d{4}-\d{2}-\d{2}$/.test(x.valida_ate) || x.valida_ate < hojeISO() ? 'A validade precisa ser hoje ou depois.' : '')
    : (!/^\d{1,3}$/.test(x.dias) || +x.dias < 1 || +x.dias > 365 ? 'A validade vai de 1 a 365 dias.' : '');
  const campos = el('div', {},
    el('div', { class: 'form-2' }, cClinica, el('label', { class: 'campo', for: 'd-tratamento' }, el('span', { class: 'rot', text: 'Tratamento' }), trat)),
    el('div', { class: 'form-2' }, cMedico, el('label', { class: 'campo', for: 'd-especialidade' }, el('span', { class: 'rot', text: 'Especialidade' }), espSel)), cOutra,
    el('div', { class: 'form-2' }, cCidade, el('label', { class: 'campo', for: validade.id }, el('span', { class: 'rot', text: l ? 'Válido até' : 'Validade (dias)' }), validade,
      el('span', { class: 'ajuda', text: l ? 'Depois desse dia, o link mostra "não está mais ativo".' : 'Padrão: 60 dias. Depois, o link mostra "não está mais ativo".' }))),
    el('div', { class: 'campo' }, el('span', { class: 'rot', id: 'rot-cor', text: 'Cor da clínica' }), cores, el('span', { class: 'ajuda', text: 'Sem logo: o app mostra o nome e as iniciais nesta cor.' })),
    cLead,
    el('label', { class: 'campo', for: 'd-anotacao' }, el('span', { class: 'rot', text: 'Anotação (só você vê)' }), anotacao),
    el('label', { class: 'campo', for: 'd-mensagem' }, el('span', { class: 'rot', text: 'Mensagem do WhatsApp (opcional)' }), mensagem,
      el('span', { class: 'ajuda', text: 'Vazio: a mensagem pronta, com o nome do médico, da clínica e o link.' })));
  return { campos, ler, conferir };
}
function dForm(c) {
  topo('Novo link', [['Demonstrações', 'demonstracoes'], ['Novo link']], 'demonstracoes');
  if (!ligada('editar_demonstracoes')) { falhou(c, { desligada: true, chave: 'editar_demonstracoes' }, 'Novo link'); return; }
  const f = camposDem(null), erro = el('p', { class: 'erro', role: 'alert' });
  const criar = async () => {
    erro.textContent = ''; const x = f.ler(), problema = f.conferir(x);
    if (problema) { erro.textContent = problema; return; }
    await fazer('dem_criar', { campos: x }, { erro: r => { erro.textContent = r.mensagem || 'Não consegui criar.'; }, silencioso: true,
      depois: async r => { est.demNovo = r.id; irD('link', r.id); } });
  };
  trocar(c, cabecalho('Novo link', 'a demonstração com o nome e a cor da clínica'),
    el('div', { class: 'pilha' }, avisoLinksDesligados(), cartao(null, null, el('div', { class: 'corpo p-topo-form' }, f.campos, erro, el('div', { class: 'acoes' }, btn('Criar o link', criar, 'pri', 'link'), btn('Cancelar', () => irD(), 'sec'))))));
}
async function dEditar(c, id) {
  const r = await chamar('dem_link', { id });
  const l = r.ok ? r.link : null;
  topo(l ? 'Editar · ' + l.clinica : 'Editar', [['Demonstrações', 'demonstracoes'], [l ? l.clinica : 'Link', 'demonstracoes/link/' + id], ['Editar']], 'demonstracoes/link/' + id);
  if (falhou(c, r, 'Editar')) return;
  if (!ligada('editar_demonstracoes')) { falhou(c, { desligada: true, chave: 'editar_demonstracoes' }, 'Editar'); return; }
  const f = camposDem(l), erro = el('p', { class: 'erro', role: 'alert' });
  const salvar = async () => {
    erro.textContent = ''; const x = f.ler(), problema = f.conferir(x);
    if (problema) { erro.textContent = problema; return; }
    const ROT = { clinica: 'Clínica', tratamento: 'Tratamento', medico: 'Médico', especialidade: 'Especialidade', cidade: 'Cidade', cor: 'Cor', lead_codigo: 'Lead', valida_ate: 'Válido até', anotacao: 'Anotação', mensagem: 'Mensagem' };
    const antes = { ...l, lead_codigo: l.lead_codigo || '', mensagem: l.mensagem_editada ? l.mensagem : '' };
    const linhas = Object.keys(ROT).filter(k => String(antes[k] ?? '') !== String(x[k] ?? '')).map(k => [ROT[k], k === 'valida_ate' ? fmtData(antes[k]) : antes[k], k === 'valida_ate' ? fmtData(x[k]) : x[k]]);
    if (!linhas.length) { erro.textContent = 'Nada mudou.'; return; }
    await fazer('dem_editar', { id: l.id, campos: x }, { titulo: 'Editar o link de ' + l.clinica, linhas, rotuloNivel: 'muda o que o médico vê', ok: 'Salvo.',
      erro: x2 => { erro.textContent = x2.mensagem || 'Não consegui salvar.'; }, depois: () => irD('link', l.id) });
  };
  trocar(c, cabecalho('Editar', `DEM-${l.id} · ${l.clinica}`),
    el('div', { class: 'pilha' }, cartao(null, null, el('div', { class: 'corpo p-topo-form' }, f.campos, erro, el('div', { class: 'acoes' }, btn('Salvar', salvar, 'pri'), btn('Cancelar', () => irD('link', l.id), 'sec'))))));
}

// ---------- um link: o endereço, a mensagem e o uso
async function dLink(c, id) {
  const r = await chamar('dem_link', { id });
  const l = r.ok ? r.link : null;
  topo(l ? l.clinica : 'Link', [['Demonstrações', 'demonstracoes'], [l ? l.clinica : 'Link']], 'demonstracoes');
  if (falhou(c, r, 'Link')) return;
  const u = r.uso || {}, editar = ligada('editar_demonstracoes'), novo = est.demNovo === l.id;
  est.demNovo = null;
  const inativo = l.situacao === 'desativado' || l.situacao === 'vencido';
  const recarregar = () => rotear();
  const desativar = () => fazer('dem_desativar', { id: l.id }, { silencioso: true, depois: async () => { await recarregar(); rapida('Link desativado.', reativar); } });
  const reativar = () => fazer('dem_reativar', { id: l.id }, { ok: 'Link ativo de novo.', depois: recarregar });
  const ver = () => fazer('dem_ver', { id: l.id }, { silencioso: true, depois: async x => { est.demVer = { id: l.id, endereco: x.endereco, ate: Date.now() + 15 * 60e3 }; await recarregar(); } });
  const apagar = () => fazer('dem_apagar', { id: l.id }, { titulo: 'Apagar o link de ' + l.clinica, nome: l.clinica, rotuloNome: 'o nome da clínica do link', rotuloNivel: 'apaga para sempre',
    texto: 'Apaga o link e todo o uso dele (visitas, telas, escopo e pedidos). Quem abrir vê "não está mais ativo". O registro da Central guarda só que foi apagado.', botao: 'Apagar',
    ok: 'Link apagado.', depois: () => irD() });
  const verAgora = est.demVer && est.demVer.id === l.id && est.demVer.ate > Date.now() ? est.demVer : null;
  const aparelhos = Object.entries(u.aparelhos || {}).map(([t, n]) => fmtNum(n) + ' ' + ((DEM_APARELHO[t] || [t, t])[n > 1 ? 1 : 0])).join(', ');
  const esc = u.escopo || [], conta = k => esc.filter(x => x.escolha === k).length;
  const envios = u.envios || [], conversas = envios.filter(e => e.tipo === 'conversar'), escopoEnvios = envios.filter(e => e.tipo === 'escopo');
  const listaOu = (itens, vazioTxt, fn) => itens.length ? el('ul', { class: 'lista' }, itens.map(fn)) : vazio(vazioTxt, 'info');
  const linhaSimples = (t1, t2, dir) => el('li', {}, el('div', { class: 'linha' }, el('div', { class: 'cresce' }, el('div', { class: 't1', text: t1 }), t2 ? el('div', { class: 't2', text: t2 }) : null), dir ? el('div', { class: 'direita' }, dir) : null));
  trocar(c, cabecalho(l.clinica, `DEM-${l.id} · ${l.tratamento} ${l.medico} · ${l.especialidade}`, etqDem(l.situacao)),
    el('div', { class: 'pilha' }, avisoLinksDesligados(),
      novo ? el('div', { class: 'aviso info', role: 'status' }, icone('ok'), el('div', {}, el('b', { text: 'Link pronto. ' }), 'Copie a mensagem e mande pelo seu WhatsApp. O Telegram avisa quando o médico abrir.')) : null,
      inativo ? el('div', { class: 'aviso atencao' }, icone('info'), el('div', { text: l.situacao === 'vencido' ? `Venceu em ${fmtData(l.valida_ate)}: quem abrir vê "não está mais ativo". Mude a validade em Editar.`
        : `Desativado em ${fmtData(l.desativada_em)}: quem abrir vê "não está mais ativo".` + (l.tentou_inativo_em ? ` Última tentativa de abrir: ${fmtHora(l.tentou_inativo_em)}.` : '') })) : null,
      cartao('Link', null, corpo(el('div', { class: 'segredo dem-endereco', text: l.endereco }),
        el('div', { class: 'acoes' }, btn('Copiar a mensagem', () => copiar(l.mensagem, 'Mensagem copiada. Cole no WhatsApp do médico.'), 'pri', 'copiar'), btn('Copiar o link', () => copiar(l.endereco, 'Link copiado.'), 'sec', 'link'),
          editar && !inativo ? (verAgora ? el('a', { class: 'btn sec', href: verAgora.endereco, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir como o médico vê') : btn('Ver como o médico vê', ver, 'sec')) : null),
        verAgora ? el('p', { class: 'mudo peq', text: 'Abre sem contar visita e sem avisar no Telegram. Vale 15 minutos.' }) : null,
        el('p', { class: 'rot-mensagem mudo peq', text: l.mensagem_editada ? 'Mensagem do WhatsApp (a sua):' : 'Mensagem do WhatsApp (a pronta; mude em Editar):' }),
        el('p', { class: 'dem-mensagem', text: l.mensagem }),
        editar ? el('div', { class: 'acoes' }, btn('Editar', () => irD('link', l.id, 'editar'), 'sec'),
          l.situacao === 'desativado' ? btn('Reativar', reativar, 'sec') : !inativo ? btn('Desativar', desativar, 'sec') : null,
          btn('Apagar', apagar, 'perigo-sec')) : null)),
      el('div', { class: 'kpis' }, kpi('Visitas', fmtNum(l.visitas), l.primeiro_acesso ? 'a primeira em ' + fmtHora(l.primeiro_acesso) : 'nunca abriu'),
        kpi('Tempo total', minutos(u.segundos)), kpi('Aparelhos', aparelhos || '—'), kpi('Último acesso', l.ultimo_acesso ? fmtHora(l.ultimo_acesso) : '—')),
      cartao('Quero conversar', conversas.length ? etq(fmtNum(conversas.length) + ' pedido(s)', 'atencao', true) : null,
        listaOu(conversas, 'O médico ainda não pediu para conversar.', e => linhaSimples((e.conteudo || {}).texto || '(sem texto)', fmtHora(e.quando)))),
      cartao('Escopo', escopoEnvios.length ? etq('enviado ' + fmtHora(escopoEnvios[0].quando), 'ok', true) : null,
        esc.length ? el('div', { class: 'corpo etqs' }, etq(fmtNum(conta('quero')) + ' quero', 'ok', true), etq(fmtNum(conta('duvida')) + ' com dúvida', 'atencao', true), etq(fmtNum(conta('nao_preciso')) + ' não preciso', '', true)) : null,
        listaOu(esc, 'Nada marcado no escopo ainda.', x => linhaSimples(nomeItem(x.item), [x.nota, 'marcado ' + fmtHora(x.atualizado_em)].filter(Boolean).join(' · '),
          x.escolha ? etq((DEM_ESCOLHA[x.escolha] || [x.escolha])[0], (DEM_ESCOLHA[x.escolha] || [])[1]) : null))),
      cartao('Telas mais vistas', null, listaOu(u.telas || [], 'Nenhuma tela vista ainda.', t => linhaSimples((DEM_PAGINA[t.pagina] || t.pagina) + (t.tela ? ' › ' + t.tela : ''), fmtNum(t.vezes) + ' vez(es) · ' + minutos(t.segundos)))),
      cartao('O que mais tocou', null, listaOu(u.toques || [], 'Nenhum toque registrado ainda.', t => linhaSimples(t.alvo, (DEM_PAGINA[t.pagina] || t.pagina) + ' · ' + fmtNum(t.vezes) + ' vez(es)'))),
      cartao('Perguntas nos chats', null, listaOu(u.perguntas || [], 'Nenhuma pergunta nos chats de exemplo.', p => linhaSimples(p.texto || '', (p.chat === 'equipe' ? 'chat com a equipe' : 'assistente do app') + ' · ' + fmtHora(p.quando)))),
      cartao('Visitas', null, listaOu(u.visitas || [], 'Nenhuma visita ainda.', v => el('li', {}, el('button', { class: 'linha', type: 'button', onclick: () => irD('visita', l.id, v.id) },
        el('span', { class: 'icone-caixa' }, icone(v.tipo_aparelho === 'computador' ? 'demonstracao' : 'telefone')),
        el('div', { class: 'cresce' }, el('div', { class: 't1', text: fmtHora(v.inicio) + ' · ' + minutos(v.segundos) }),
          el('div', { class: 't2', text: [(DEM_APARELHO[v.tipo_aparelho] || [v.tipo_aparelho])[0], v.navegador, 'aparelho ' + v.aparelho + '…', fmtNum(v.eventos) + ' evento(s)'].filter(Boolean).join(' · ') })), icone('seta'))))),
      cartao('Sobre o link', null, corpo(dados([['Criado em', fmtHora(l.criada_em)], ['Válido até', fmtData(l.valida_ate)], ['Cidade', l.cidade], ['Cor', (DEM_CORES.find(x => x[0] === l.cor) || [0, l.cor])[1]],
        ['Lead da prospecção', l.lead_codigo], ['Anotação', l.anotacao]])))));
}

// ---------- uma visita, evento por evento
async function dVisita(c, linkId, visitaId) {
  const r = await chamar('dem_visita', { id: visitaId });
  topo('Visita', [['Demonstrações', 'demonstracoes'], ['Link', 'demonstracoes/link/' + linkId], ['Visita']], 'demonstracoes/link/' + linkId);
  if (falhou(c, r, 'Visita')) return;
  const resumo = d => { if (!d || typeof d !== 'object') return ''; return Object.entries(d).map(([k, v]) => k === 's' ? minutos(v) : typeof v === 'object' ? '' : String(v)).filter(Boolean).join(' · '); };
  const evs = r.eventos || [];
  trocar(c, cabecalho('Visita', `${fmtNum(evs.length)} evento(s), na ordem`),
    el('div', { class: 'pilha' }, cartao(null, null, evs.length ? el('ul', { class: 'lista' }, evs.map(e => el('li', {}, el('div', { class: 'linha' },
      el('div', { class: 'cresce' }, el('div', { class: 't1', text: (DEM_PAGINA[e.pagina] || e.pagina) + (e.tela ? ' › ' + e.tela : '') + ' · ' + e.acao }),
        el('div', { class: 't2', text: [fmtHora(e.quando), resumo(e.detalhe)].filter(Boolean).join(' · ') })))))) : vazio('Nenhum evento nesta visita.', 'info'))));
}
