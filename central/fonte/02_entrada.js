// ---------------------------------------------------------------- entrada (DEC-062, sem mudança de lógica)
// E-mail (só o nome de usuário; quem confere é o servidor) + senha → o código de 6 dígitos vai para o Telegram do Jean
// (nunca para esta página) → código. "Criar senha" e "Esqueci a senha" usam o mesmo código no Telegram.
function telaEntrada(...filhos) { $('app').hidden = true; $('entrada').hidden = false; trocar($('entrada-corpo'), ...filhos); const i = $('entrada-corpo').querySelector('input:not([hidden])'); if (i) i.focus(); }
const msgErro = () => el('p', { class: 'erro', role: 'alert' });
const soDigitos = v => String(v || '').replace(/\D/g, '');
const campoE = (rot, input) => el('label', { class: 'campo' }, el('span', { class: 'rot', text: rot }), input);
const campoEmail = valor => el('input', { class: 'entrada', type: 'email', inputmode: 'email', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true, enterkeyhint: 'next', value: valor || null });
const campoCodigo = () => el('input', { class: 'entrada codigo', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', pattern: '[0-9]*', required: true, enterkeyhint: 'go' });
// ---------------------------------------------------------------- aparelho lembrado (DEC-109, no lugar do Face ID)
// Depois da senha + código (ou da senha nova), o servidor manda uma lembrança (64 letras) que fica no localStorage deste
// aparelho ('central_lembranca'); o banco guarda só o SHA-256. Ela muda a cada uso, vale 30 dias sem uso e 90 no
// máximo. "Sair" e "Sair de todos" a esquecem. No localStorage, só ela e a aparência.
function lembrancaLer() { try { return localStorage.getItem('central_lembranca') || ''; } catch (e) { return ''; } }
function lembrancaGuardar(v) { try { if (v) localStorage.setItem('central_lembranca', v); else localStorage.removeItem('central_lembranca'); } catch (e) {} }
// A página guardou a lembrança nova: avisa o servidor (fim da folga de 24 horas da anterior).
async function lembrancaNova(v) { if (!/^[0-9a-f]{64}$/.test(v || '')) return; lembrancaGuardar(v); await chamar('lembranca_usada', { lembranca: v }); }
let ultimaRetomada = 0;
async function entrada(mensagem) {
  esquecerAssistente();   // a conversa com o assistente some ao sair (DEC-145)
  const r = await chamar('estado');
  if (r.ok && r.tem_senha === false) { lembrancaGuardar(''); return pedirCodigoSenha(true, mensagem); }
  // Aparelho lembrado: entra direto (no máximo uma tentativa por minuto, para nunca ficar em volta).
  const lem = lembrancaLer();
  if (lem && !/^[0-9a-f]{64}$/.test(lem)) lembrancaGuardar('');
  if (/^[0-9a-f]{64}$/.test(lem) && Date.now() - ultimaRetomada > 60000) {
    ultimaRetomada = Date.now();
    const x = await chamar('retomar', { lembranca: lem });
    if (x.ok && x.sessao) { guardarSessao(x.sessao); await lembrancaNova(x.lembranca); return abrirApp(); }
    if (x.esquecer) lembrancaGuardar('');
    return formEntrada(x.mensagem || mensagem || '');
  }
  formEntrada(mensagem || (r.ok ? '' : r.mensagem));
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
    if (r.ok && r.sessao) { guardarSessao(r.sessao); await lembrancaNova(r.lembranca); return abrirApp(); }   // já lembra o aparelho, sem perguntar
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
    if (r.ok && r.sessao) { guardarSessao(r.sessao); await lembrancaNova(r.lembranca); rapida(primeira ? 'Senha criada.' : 'Senha trocada. Os outros aparelhos saíram da Central.'); return abrirApp(); }
    if (r.recomecar) return pedirCodigoSenha(primeira, r.mensagem, email);
    erro.textContent = r.mensagem || 'Não consegui.'; codigo.value = ''; codigo.focus();
  };
  telaEntrada(el('form', { onsubmit: enviar }, usuario, el('h2', { text: primeira ? 'Criar senha' : 'Senha nova' }),
    el('p', { class: 'mudo', text: aviso || 'Se o e-mail estiver certo, o código chega no seu Telegram em instantes. Ele vale 10 minutos.' }),
    campoE('Código de 6 dígitos (no Telegram)', codigo), campoE('Senha nova (12 caracteres ou mais)', s1), campoE('Repita a senha', s2), erro, botao,
    el('p', { class: 'mudo peq mt', text: 'Ao salvar, todos os outros aparelhos saem da Central (e deixam de ser lembrados) e chega um aviso no Telegram.' }),
    el('div', { class: 'acoes' }, el('button', { class: 'btn sec plena', type: 'button', text: 'Voltar', onclick: () => primeira ? pedirCodigoSenha(true, '', email) : formEntrada('', email) }))));
}
async function carregarConfig() {
  const r = await chamar('config');
  if (!r.ok) return r;
  est.chaves = Object.fromEntries((r.chaves || []).map(k => [k.chave, k.valor]));
  est.listaChaves = r.chaves || [];
  est.niveis = r.niveis || { acoes: {} };
  est.prospMotor = r.prosp_motor || null;   // sinal de vida do 52 e do 53 (DEC-087)
  if (!ligada('tela_assistente')) fecharAssistente();
  return r;
}
async function abrirApp() {
  const r = await carregarConfig();
  if (!r.ok) return entrada(r.mensagem);
  est.clientes = null;
  $('entrada').hidden = true; $('app').hidden = false; montarNav(); rotear();
}
// Sair esquece também este aparelho: da próxima vez, senha + código.
async function sair() { await chamar('sair', { esquecer: true, lembranca: lembrancaLer() }); lembrancaGuardar(''); guardarSessao(''); est.clientes = null; entrada('Você saiu.'); }
