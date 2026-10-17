// ---------------------------------------------------------------- entrada (DEC-062, sem mudança de lógica)
// E-mail (só o nome de usuário; quem confere é o servidor) + senha → o código de 6 dígitos vai para o Telegram do Jean
// (nunca para esta página) → código. "Criar senha" e "Esqueci a senha" usam o mesmo código no Telegram.
function telaEntrada(...filhos) { $('app').hidden = true; $('entrada').hidden = false; trocar($('entrada-corpo'), ...filhos); const i = $('entrada-corpo').querySelector('input:not([hidden])'); if (i) i.focus(); }
const msgErro = () => el('p', { class: 'erro', role: 'alert' });
const soDigitos = v => String(v || '').replace(/\D/g, '');
const campoE = (rot, input) => el('label', { class: 'campo' }, el('span', { class: 'rot', text: rot }), input);
const campoEmail = valor => el('input', { class: 'entrada', type: 'email', inputmode: 'email', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true, enterkeyhint: 'next', value: valor || null });
const campoCodigo = () => el('input', { class: 'entrada codigo', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', pattern: '[0-9]*', required: true, enterkeyhint: 'go' });
async function entrada(mensagem) {
  const r = await chamar('estado');
  if (r.ok && r.tem_senha === false) return pedirCodigoSenha(true, mensagem);
  // Face ID (DEC-095): o servidor diz se dá (o n8n tem o crypto); o aparelho precisa ter passkey. Nada fica guardado aqui.
  est.faceId = !!(r.ok && r.face_id && temFaceId());
  if (est.faceId) return telaFaceId(mensagem);
  formEntrada(mensagem || (r.ok ? '' : r.mensagem));
}
// ---------------------------------------------------------------- Face ID (passkey; DEC-095)
// A passkey é do domínio rxsync.com.br e fica no aparelho (e nas Chaves do iCloud); o banco guarda só a chave pública.
// A assinatura é conferida no servidor (workflow 04). Nada do Face ID vai para o localStorage nem para o sessionStorage.
const temFaceId = () => !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.get && navigator.credentials.create);
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = t => Uint8Array.from(atob(String(t).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(t).length + 3) % 4)), c => c.charCodeAt(0));
function telaFaceId(mensagem) {
  const erro = msgErro(); erro.textContent = mensagem || '';
  const botao = el('button', { class: 'btn pri plena', type: 'button', text: 'Entrar com Face ID', onclick: () => entrarFaceId(botao, erro) });
  telaEntrada(el('div', {}, el('h2', { text: 'Entrar' }), el('p', { class: 'mudo', text: 'Use o Face ID deste aparelho. Ele vale 30 dias sem uso (90 dias no máximo).' }), erro, botao,
    el('div', { class: 'acoes' }, el('button', { class: 'btn sec plena', type: 'button', text: 'Entrar com senha e código', onclick: () => formEntrada('') }))));
  botao.focus();
}
async function entrarFaceId(botao, erro) {
  botao.disabled = true; erro.textContent = '';
  try {
    const d = await chamar('retomar_desafio');
    if (!d.ok || !d.desafio) { erro.textContent = d.mensagem || 'Não consegui pedir o Face ID.'; return; }
    let cred;
    try { cred = await navigator.credentials.get({ publicKey: { challenge: deB64u(d.desafio), rpId: d.rp_id, userVerification: 'required', timeout: 60000 } }); }
    catch (e) { erro.textContent = 'O Face ID não foi feito. Tente de novo ou entre com a senha e o código.'; return; }
    const a = cred.response;
    const r = await chamar('retomar', { credencial_id: b64u(cred.rawId), client_data: b64u(a.clientDataJSON), authenticator_data: b64u(a.authenticatorData), assinatura: b64u(a.signature) });
    if (r.ok && r.sessao) { guardarSessao(r.sessao); est.entrouFaceId = true; return abrirApp(); }
    if (r.sem_face_id) return formEntrada(r.mensagem);
    erro.textContent = r.mensagem || 'Não consegui entrar.';
  } finally { if (botao.isConnected) botao.disabled = false; }
}
// Ativar neste aparelho: logo depois da entrada com senha + código (a senha precisa ser das últimas 12 horas).
async function ativarFaceId() {
  const d = await chamar('aparelho_desafio');
  if (!d.ok || !d.desafio) { if (d.mensagem) rapida(d.mensagem); return false; }
  let cred;
  try {
    cred = await navigator.credentials.create({ publicKey: { challenge: deB64u(d.desafio), rp: { id: d.rp_id, name: d.rp_nome },
      user: { id: deB64u(d.usuario_id), name: d.usuario_nome, displayName: d.usuario_nome }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', requireResidentKey: true, userVerification: 'required' }, attestation: 'none', timeout: 60000 } });
  } catch (e) { rapida('O Face ID não foi ativado.'); return false; }
  const a = cred.response;
  if (typeof a.getPublicKey !== 'function' || typeof a.getAuthenticatorData !== 'function' || !a.getPublicKey()) { rapida('Este aparelho não aceita o Face ID aqui. Continue com a senha e o código.'); return false; }
  const r = await chamar('aparelho_ativar', { credencial_id: b64u(cred.rawId), client_data: b64u(a.clientDataJSON), authenticator_data: b64u(a.getAuthenticatorData()), chave_publica: b64u(a.getPublicKey()) });
  rapida(r.ok ? 'Face ID ativado neste aparelho. Aviso no Telegram.' : (r.mensagem || 'Não consegui ativar o Face ID.'));
  return !!r.ok;
}
function ofertarFaceId() {
  if (!est.faceId || est.entrouFaceId) return;
  const fechar = janela(el('div', { class: 'janela', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tit-faceid' }, el('div', { class: 'alca', 'aria-hidden': 'true' }),
    el('div', { class: 'cab' }, el('div', { class: 'texto' }, el('h2', { id: 'tit-faceid', text: 'Entrar pelo Face ID da próxima vez?' }))),
    el('div', { class: 'corpo' }, el('p', { class: 'mudo', text: 'Da próxima vez, a Central pede só o seu rosto (vale 30 dias sem uso, 90 no máximo). A senha e o código no Telegram continuam para um aparelho novo. As confirmações de nível 3 pedem a senha de novo depois de 12 horas.' })),
    el('div', { class: 'pe' }, btn('Agora não', () => fechar(), 'sec'), btn('Ativar o Face ID', async () => { fechar(); await ativarFaceId(); }, 'pri'))));
}
function formEntrada(mensagem, emailAntes) {
  const email = campoEmail(emailAntes);
  const senha = el('input', { class: 'entrada', type: 'password', autocomplete: 'current-password', required: true, enterkeyhint: 'go' });
  const erro = msgErro(); erro.textContent = mensagem || '';
  const botao = el('button', { class: 'btn pri plena', type: 'submit', text: 'Continuar' });
  const enviar = async e => {
    e.preventDefault(); botao.disabled = true; erro.textContent = '';
    const r = await chamar('entrar', { email: email.value.trim(), senha: senha.value }); botao.disabled = false;
    if (r.ok && r.desafio) return formCodigo(r.desafio, r.mensagem, email.value.trim());
    if (r.criar_senha) return pedirCodigoSenha(true, r.mensagem);
    erro.textContent = r.mensagem || 'Não consegui entrar.'; senha.value = ''; senha.focus();
  };
  telaEntrada(el('form', { onsubmit: enviar }, el('h2', { text: 'Entrar' }), campoE('E-mail', email), campoE('Senha', senha), erro, botao,
    el('div', { class: 'acoes' }, el('button', { class: 'btn sec plena', type: 'button', text: 'Esqueci a senha', onclick: () => pedirCodigoSenha(false, '', email.value.trim()) }))));
}
// "Mandar outro código" só libera depois de 1 minuto (o servidor também limita).
function esperarUmMinuto(b, texto) {
  let falta = 60; b.disabled = true; b.textContent = `${texto} (${falta} s)`;
  const t = setInterval(() => { falta--; if (!b.isConnected) return clearInterval(t); if (falta <= 0) { clearInterval(t); b.disabled = false; b.textContent = texto; } else b.textContent = `${texto} (${falta} s)`; }, 1000);
}
function formCodigo(desafio, aviso, email) {
  const codigo = campoCodigo();
  const erro = msgErro(); const botao = el('button', { class: 'btn pri plena', type: 'submit', text: 'Entrar' });
  const outro = el('button', { class: 'btn sec plena', type: 'button', text: 'Mandar outro código', onclick: () => formEntrada('Digite a senha de novo para receber outro código.', email) });
  const enviar = async e => {
    e.preventDefault(); const c = soDigitos(codigo.value); if (c.length !== 6) { codigo.focus(); return; }
    botao.disabled = true; erro.textContent = '';
    const r = await chamar('entrar_codigo', { desafio, codigo: c }); botao.disabled = false;
    if (r.ok && r.sessao) { guardarSessao(r.sessao); est.entrouFaceId = false; await abrirApp(); return ofertarFaceId(); }
    if (r.recomecar) return formEntrada(r.mensagem, email);
    erro.textContent = r.mensagem || 'Não consegui entrar.'; codigo.value = ''; codigo.focus();
  };
  telaEntrada(el('form', { onsubmit: enviar }, el('h2', { text: 'Código no Telegram' }),
    el('p', { class: 'mudo', text: aviso || 'Mandei um código de 6 dígitos no seu Telegram. Ele vale 10 minutos.' }),
    campoE('Código de 6 dígitos', codigo), erro, botao,
    el('div', { class: 'acoes' }, outro, el('button', { class: 'btn sec plena', type: 'button', text: 'Voltar', onclick: () => formEntrada('', email) }))));
  esperarUmMinuto(outro, 'Mandar outro código');
}
// Primeira senha (primeira = true) ou "Esqueci a senha": o código vai para o Telegram.
function pedirCodigoSenha(primeira, mensagem, emailAntes) {
  const email = campoEmail(emailAntes);
  const erro = msgErro(); erro.textContent = mensagem || '';
  const botao = el('button', { class: 'btn pri plena', type: 'submit', text: 'Mandar código no Telegram' });
  const enviar = async e => {
    e.preventDefault(); botao.disabled = true; erro.textContent = '';
    const r = await chamar('senha_pedir', { email: email.value.trim() }); botao.disabled = false;
    if (r.ok && r.desafio) return formSenhaNova(r.desafio, r.mensagem, primeira, email.value.trim());
    erro.textContent = r.mensagem || 'Não consegui.';
  };
  telaEntrada(el('form', { onsubmit: enviar }, el('h2', { text: primeira ? 'Criar senha' : 'Esqueci a senha' }),
    el('p', { class: 'mudo', text: primeira ? 'A Central ainda não tem senha. Digite o seu e-mail: um código de 6 dígitos vai para o seu Telegram (vale 10 minutos).'
      : 'Digite o seu e-mail: um código de 6 dígitos vai para o seu Telegram (vale 10 minutos). Com ele, você cria uma senha nova.' }),
    campoE('E-mail', email), erro, botao,
    primeira ? null : el('div', { class: 'acoes' }, el('button', { class: 'btn sec plena', type: 'button', text: 'Voltar', onclick: () => formEntrada('', email.value.trim()) }))));
}
function formSenhaNova(desafio, aviso, primeira, email) {
  // O e-mail vai num campo escondido só para o iPad guardar a senha nova junto com ele.
  const usuario = el('input', { type: 'email', autocomplete: 'username', value: email || null, readonly: true, hidden: true });
  const codigo = campoCodigo(); codigo.setAttribute('enterkeyhint', 'next');
  const s1 = el('input', { class: 'entrada', type: 'password', autocomplete: 'new-password', minlength: '12', required: true, enterkeyhint: 'next' });
  const s2 = el('input', { class: 'entrada', type: 'password', autocomplete: 'new-password', minlength: '12', required: true, enterkeyhint: 'done' });
  const erro = msgErro(); const botao = el('button', { class: 'btn pri plena', type: 'submit', text: 'Salvar e entrar' });
  const enviar = async e => {
    e.preventDefault(); erro.textContent = '';
    const c = soDigitos(codigo.value); if (c.length !== 6) { erro.textContent = 'Digite o código de 6 dígitos do Telegram.'; codigo.focus(); return; }
    if (s1.value.length < 12) { erro.textContent = 'Use pelo menos 12 caracteres.'; s1.focus(); return; }
    if (s1.value !== s2.value) { erro.textContent = 'As duas senhas não são iguais.'; s2.focus(); return; }
    botao.disabled = true; const r = await chamar('senha_nova', { desafio, codigo: c, senha: s1.value }); botao.disabled = false;
    if (r.ok && r.sessao) { guardarSessao(r.sessao); est.entrouFaceId = false; rapida(primeira ? 'Senha criada.' : 'Senha trocada. Os outros aparelhos saíram da Central.'); return abrirApp(); }
    if (r.recomecar) return pedirCodigoSenha(primeira, r.mensagem, email);
    erro.textContent = r.mensagem || 'Não consegui.'; codigo.value = ''; codigo.focus();
  };
  telaEntrada(el('form', { onsubmit: enviar }, usuario, el('h2', { text: primeira ? 'Criar senha' : 'Senha nova' }),
    el('p', { class: 'mudo', text: aviso || 'Se o e-mail estiver certo, o código chega no seu Telegram em instantes. Ele vale 10 minutos.' }),
    campoE('Código de 6 dígitos (no Telegram)', codigo), campoE('Senha nova (12 caracteres ou mais)', s1), campoE('Repita a senha', s2), erro, botao,
    el('p', { class: 'mudo peq mt', text: 'Ao salvar, todos os outros aparelhos saem da Central e chega um aviso no Telegram.' }),
    el('div', { class: 'acoes' }, el('button', { class: 'btn sec plena', type: 'button', text: 'Voltar', onclick: () => primeira ? pedirCodigoSenha(true, '', email) : formEntrada('', email) }))));
}
async function carregarConfig() {
  const r = await chamar('config');
  if (!r.ok) return r;
  est.chaves = Object.fromEntries((r.chaves || []).map(k => [k.chave, k.valor]));
  est.listaChaves = r.chaves || [];
  est.niveis = r.niveis || { acoes: {} };
  est.prospMotor = r.prosp_motor || null;   // sinal de vida do 52 e do 53 (DEC-087)
  return r;
}
async function abrirApp() {
  const r = await carregarConfig();
  if (!r.ok) return entrada(r.mensagem);
  est.clientes = null;
  $('entrada').hidden = true; $('app').hidden = false; montarNav(); rotear();
}
async function sair() { await chamar('sair'); guardarSessao(''); est.clientes = null; entrada('Você saiu.'); }
