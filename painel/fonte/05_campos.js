// ---------------------------------------------------------------- campos: editam no lugar e salvam ao sair (regra 3)
// Ligar o que manda mensagem a quem não pediu é nível 2; desligar é sempre um toque (regra 1).
const LIGAR_NIVEL2 = { pesquisa_ativa: 'A assistente passa a mandar a pesquisa de satisfação depois das consultas, e o convite para avaliar a clínica no Google.',
  func_retorno: 'A assistente passa a escrever, sem o paciente pedir, para quem passou do prazo de retorno.',
  func_reativacao: 'A assistente passa a escrever, sem o paciente pedir, para quem não volta há um tempo.' };
// Qual recurso destrava cada campo do Gestão (o mesmo que o servidor confere ao salvar).
const CAMPO_RECURSO = { pesquisa_ativa: 'pesquisa', pesquisa_horas: 'pesquisa', link_avaliacao_google: 'pesquisa', func_empilhamento: 'empilhamento',
  assistente_dono_ativa: 'assistente_dono', dono_whatsapp: 'assistente_dono', dono_pode_editar: 'assistente_dono', briefing_horario: 'assistente_dono', briefing_dias: 'assistente_dono',
  func_documentos: 'documentos', func_fila: 'fila', func_reconhecer: 'reconhecer', func_tipo_visita: 'tipo_visita', func_preconsulta: 'preconsulta', func_medicos: 'medicos',
  func_retorno: 'relacionamento', retorno_prazo_dias: 'relacionamento', func_reativacao: 'relacionamento', reativacao_dias: 'relacionamento', relac_limite_dia: 'relacionamento' };
const GESTAO = ['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'];
// Só o dono muda (DEC-115): a equipe vê travado. Quem recusa de verdade é o banco.
const SO_DONO = ['email', 'telefone', 'numero_reserva', 'resp_tecnico_nome', 'resp_tecnico_conselho', 'assistente_dono_ativa', 'dono_whatsapp', 'dono_pode_editar', 'briefing_horario', 'briefing_dias'];
const campoDef = k => CAMPOS.find(c => c.key === k);
const travadoPlano = k => { const c = campoDef(k), rk = CAMPO_RECURSO[k]; return !!(c && c.gestao) && (rk ? sem(rk) : GESTAO.some(sem)); };
const travadoPapel = k => PAPEL === 'equipe' && SO_DONO.includes(k);
const AO_SALVAR = [];   // quem precisa saber que um campo mudou (resumos dos índices, agenda, chat)
const sujos = {};

function estadoCampo(k, txt, tipo) {
  document.querySelectorAll('[data-estado-campo="' + k + '"]').forEach(s => {
    trocar(s, tipo === 'salvo' ? icone('ok', 'p') : null, txt || '');
    s.className = 'estado-campo' + (tipo ? ' ' + tipo : '');
    clearTimeout(s._t); if (tipo === 'salvo') s._t = setTimeout(() => { trocar(s); s.className = 'estado-campo'; }, 3000);
  });
}
// Salva um campo. op.desfazer: mostra "Ligado · Desfazer" (chaves). Devolve true/false.
async function salvarCampo(k, valor, op) {
  op = op || {};
  if (VAL[k] === valor && !op.forcar) return true;
  const antes = VAL[k] == null ? '' : VAL[k];
  estadoCampo(k, 'Salvando…');
  let r;
  try { r = await c24('salvar', { [k]: valor }); } catch (e) { estadoCampo(k, 'Não foi salvo: sem conexão. Tente de novo.', 'erro'); return false; }
  if (!r.ok) { estadoCampo(k, 'Não foi salvo. ' + (r.mensagem || 'Confira o campo.'), 'erro'); sincronizarCampo(k); return false; }
  VAL[k] = valor; delete sujos[k];
  estadoCampo(k, 'Salvo', 'salvo');
  if (r.mensagem && r.mensagem !== 'Salvo!') rapida(r.mensagem);
  else if (op.desfazer) rapida((valor === 'SIM' ? 'Ligado' : 'Desligado') + ': ' + op.desfazer, { desfazer: () => salvarCampo(k, antes).then(() => sincronizarCampo(k)) });
  if (k === 'fuso_horario') aplicarFuso(valor);
  dependenciasAplicar(); AO_SALVAR.forEach(f => { try { f(k, valor); } catch (e) {} });
  return true;
}
// Antes de testar a assistente: salva o que estiver sendo digitado.
async function salvarPendentes() {
  const ks = Object.keys(sujos); if (!ks.length) return true;
  const dados = {}; ks.forEach(k => { dados[k] = sujos[k]; });
  const r = await c24('salvar', dados).catch(() => ({ ok: false }));
  if (!r.ok) return false;
  ks.forEach(k => { VAL[k] = dados[k]; delete sujos[k]; estadoCampo(k, 'Salvo', 'salvo'); });
  return true;
}
function sincronizarCampo(k) { document.querySelectorAll('[data-campo="' + k + '"]').forEach(x => { if (x._sinc) x._sinc(); }); }
function dependenciasAplicar() {
  document.querySelectorAll('[data-depende]').forEach(d => {
    const ks = d.getAttribute('data-depende').split(',');
    d.classList.toggle('oculto', !ks.some(ligado));
  });
}
function contar(k, i, cont) {
  const lim = k === 'catalogo_de_vendas' ? LIMITE_CATALOGO : LIMITES_CAMPOS[k]; if (!lim || !cont) return;
  const n = i.value.length;
  cont.classList.toggle('estourou', n > lim);
  cont.textContent = k === 'catalogo_de_vendas' ? n + ' de ' + lim + ' caracteres do seu plano'
    : n > lim ? 'Passou do limite de ' + lim + ' caracteres (tem ' + n + '). A assistente só lê o começo: encurte o texto.' : (n >= lim * 0.7 ? n + ' de ' + lim + ' caracteres' : '');
}
// Uma escolha: até 5 opções curtas, botões lado a lado; mais (ou longas), uma lista.
const opcoesCurtas = c => (c.opcoes || []).length <= 5 && (c.opcoes || []).reduce((n, o) => n + o[1].length, 0) <= 44;
function escolhaEl(c, desabilitar) {
  const id = 'campo_' + c.key, ops = c.opcoes || [];
  const curtas = opcoesCurtas(c);
  const valor = () => (VAL[c.key] == null ? '' : String(VAL[c.key])) || (c.key === 'fuso_horario' ? 'America/Sao_Paulo' : '');
  if (curtas) {
    const hid = el('input', { type: 'hidden', id, 'data-campo': c.key });
    const g = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'rot_' + c.key }, ops.map(([v, t]) => el('button', { type: 'button', 'data-v': v, text: t, disabled: desabilitar,
      onclick: () => { hid.value = v; sinc(); salvarCampo(c.key, v); } })));
    const sinc = () => { hid.value = hid.value || valor(); g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === hid.value))); };
    hid._sinc = () => { hid.value = valor(); sinc(); }; hid._sinc();
    return el('div', {}, hid, g);
  }
  const s = el('select', { class: 'entrada', id, 'data-campo': c.key, disabled: desabilitar }, ops.map(([v, t]) => el('option', { value: v, text: t })));
  s._sinc = () => { s.value = valor(); }; s._sinc();
  s.addEventListener('change', () => salvarCampo(c.key, s.value));
  return s;
}
// Várias escolhas (os horários dos lembretes): caixas de marcar; salva na hora.
function multiEl(c, desabilitar) {
  const id = 'campo_' + c.key, hid = el('input', { type: 'hidden', id, 'data-campo': c.key });
  const cbs = (c.opcoes || []).map(([v, t]) => { const cb = el('input', { type: 'checkbox', value: v, disabled: desabilitar }); return [cb, el('label', { class: 'marcar' }, cb, el('span', { text: t }))]; });
  const sel = () => { const v = String(VAL[c.key] || '').trim(); return v && v !== 'nao' ? v.split(',') : (c.padrao || []); };
  hid._sinc = () => { const s = sel(); hid.value = s.join(','); cbs.forEach(([cb]) => { cb.checked = s.includes(cb.value); }); }; hid._sinc();
  cbs.forEach(([cb]) => cb.addEventListener('change', () => {
    const marcados = cbs.filter(([x]) => x.checked).map(([x]) => x.value);
    if (!marcados.length) { cb.checked = true; rapida('Escolha pelo menos um horário. Para não mandar lembretes, desligue a chave acima.'); return; }
    hid.value = marcados.join(','); salvarCampo(c.key, hid.value);
  }));
  return el('div', { class: 'opcoes', role: 'group', 'aria-labelledby': 'rot_' + c.key }, hid, cbs.map(x => x[1]));
}
// Liga/desliga (52 × 32): aplica na hora, com "Ligado · Desfazer" por 6 segundos.
function chaveEl(k, rotulo, op) {
  op = op || {};
  const hid = el('input', { type: 'hidden', id: op.semId ? null : 'campo_' + k, 'data-campo': k });
  const sw = el('button', { type: 'button', class: 'chave', role: 'switch', 'aria-checked': 'false', 'aria-label': rotulo, disabled: !!op.desabilitar });
  const sinc = () => { const v = op.valor ? op.valor() : ligado(k); hid.value = v ? 'SIM' : ''; sw.setAttribute('aria-checked', String(!!v)); };
  hid._sinc = sinc; sinc();
  sw.addEventListener('click', async () => {
    const ligar = sw.getAttribute('aria-checked') !== 'true';
    if (ligar && LIGAR_NIVEL2[k] && !(await confirmar({ titulo: 'Ligar: ' + rotulo + '?', texto: [LIGAR_NIVEL2[k], 'Mensagens que a clínica inicia podem aumentar o risco de o WhatsApp restringir o número; use com moderação. Desligar é um toque.'], botao: 'Ligar' }))) return;
    sw.classList.add('ocupada'); sw.disabled = true;
    const ok = op.aoMudar ? await op.aoMudar(ligar) : await salvarCampo(k, ligar ? 'SIM' : '', { desfazer: rotulo });
    sw.classList.remove('ocupada'); sw.disabled = !!op.desabilitar;
    if (!ok) rapida('Não foi salvo. Tente de novo.');
    sinc();
  });
  return { hid, sw };
}
// Um campo pronto: rótulo, "Salvando… / Salvo", dica, entrada e contador. Recurso de outro plano: travado (sem esconder).
function campoEl(k, op) {
  op = op || {};
  const c = campoDef(k); if (!c) return null;
  const travado = travadoPlano(k) || travadoPapel(k) || !!op.desabilitar;
  const estado = el('span', { class: 'estado-campo', 'data-estado-campo': k, 'aria-live': 'polite' });
  const selo = travadoPlano(k) ? el('span', { class: 'selo-plano' }, icone('cadeado', 'p'), 'Gestão') : null;
  let caixa;
  if (c.tipo === 'switch') {
    const { hid, sw } = chaveEl(k, c.label, { desabilitar: travado });
    caixa = el('div', { class: 'chave-linha', id: 'fld_' + k }, el('div', { class: 'tx' }, el('div', { class: 't1', id: 'rot_' + k }, c.label, selo, estado),
      c.hint ? el('p', { class: 'dica', text: c.hint }) : null, c.aviso ? el('p', { class: 'dica', text: c.aviso }) : null), sw, hid);
  } else {
    let input;
    if (c.tipo === 'select') input = escolhaEl(c, travado);
    else if (c.tipo === 'multi') input = multiEl(c, travado);
    else {
      const area = c.tipo === 'textarea' || c.tipo === 'textarea_limite';
      input = el(area ? 'textarea' : 'input', { class: 'entrada', id: 'campo_' + k, 'data-campo': k, disabled: travado, placeholder: c.ph || null, rows: area ? '3' : null,
        maxlength: LIMITES_CAMPOS[k] ? String(LIMITES_CAMPOS[k]) : null, type: area ? null : (c.tipo === 'tel' ? 'tel' : 'text'),
        inputmode: c.tipo === 'number' ? 'numeric' : c.tipo === 'tel' ? 'tel' : k === 'email' ? 'email' : /link|https/.test(k) ? 'url' : null, autocomplete: k === 'email' ? 'email' : 'off' });
      input._sinc = () => { input.value = VAL[k] == null ? '' : VAL[k]; if (area) setTimeout(() => cresce(input), 0); contar(k, input, cont); };
      input.addEventListener('input', () => { if (input.value !== (VAL[k] || '')) sujos[k] = input.value; else delete sujos[k]; if (area) cresce(input); contar(k, input, cont); });
      input.addEventListener('blur', () => { if (input.value !== (VAL[k] == null ? '' : VAL[k])) salvarCampo(k, input.value); });
    }
    const unidade = c.tipo === 'number' && /_min$/.test(k) ? ' (minutos)' : c.tipo === 'number' && /_h$/.test(k) ? ' (horas)' : c.tipo === 'number' && /_dias$/.test(k) ? ' (dias)' : '';
    const cont = LIMITES_CAMPOS[k] || k === 'catalogo_de_vendas' ? el('div', { class: 'contagem', 'aria-live': 'polite' }) : null;
    const rot = c.tipo === 'multi' || (c.tipo === 'select' && opcoesCurtas(c)) ? el('span', { class: 'rot', id: 'rot_' + k, text: c.label + unidade }) : el('label', { for: 'campo_' + k, id: 'rot_' + k, text: c.label + unidade });
    caixa = el('div', { class: 'campo', id: 'fld_' + k }, el('div', { class: 'rot-linha' }, rot, selo, estado), c.hint ? el('p', { class: 'dica', text: c.hint }) : null, input, cont);
    if (input._sinc) input._sinc();
  }
  if (c.depende) { caixa.classList.add('dependente'); caixa.setAttribute('data-depende', [].concat(c.depende).join(',')); }
  return caixa;
}
// Um bloco de campos (dentro de um cartão), com a trava do plano uma vez por bloco e o "Só o dono muda" uma vez no topo.
function blocoCampos(chaves, op) {
  op = op || {};
  const ks = chaves.filter(k => campoDef(k));
  const plano = ks.some(travadoPlano), papel = ks.some(travadoPapel);
  return [papel ? aviso('', 'Só o dono da conta muda ' + (op.oQue || 'estes campos') + '.') : null,
    plano ? travaPlano(op.beneficio) : null,
    el('div', { class: 'cartao campos' }, ks.map(k => campoEl(k)))];
}
// Recurso de outro plano: fica travado no lugar, com o benefício uma vez por bloco (regra 10).
function travaPlano(beneficio) {
  return el('div', { class: 'trava' }, icone('cadeado'), el('div', { class: 'tx' }, el('strong', { text: 'Recurso do plano Gestão Inteligente. ' }),
    beneficio || 'Com ele, a assistente faz mais pela clínica.', el('div', {}, ehDono() ? btn('Conhecer o plano Gestão', () => ir('conta/assinatura'), 'sec') : null)));
}
function aplicarFuso(v) { if (!v || v === TZ) return; TZ = v; if (typeof calRef !== 'undefined') { calRef = hojeLocal(); agCarregar(); } }
