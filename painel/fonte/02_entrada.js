// ---------------------------------------------------------------- entrada (DEC-097, workflow 29)
// E-mail + senha + código no e-mail. A sessão fica só nesta aba; "Lembrar este aparelho" guarda só a lembrança, que muda
// a cada uso. O link antigo (?t=) ainda abre o painel, com a faixa "Crie sua senha", até a clínica criar a senha.
const ENT = { desafio: '', modo: '', lembrar: false };
const ENT_TELAS = ['entEntrar', 'entCodigo', 'entPedir', 'entNova'];
function entMsg(t, erro) { const m = $('entMsg'); m.textContent = t || ''; m.className = 'msg' + (erro ? ' erro' : ''); }
function entTela(id, titulo, sub, msg, erro) {
  ENT_TELAS.forEach(t => { $(t).hidden = t !== id; });
  $('entTitulo').textContent = titulo; $('entSub').textContent = sub;
  entMsg(msg || '', erro);
  // o cursor vai já para o primeiro campo, e nunca sai de um campo que a pessoa já começou a usar
  const p = $(id).querySelector('input'); if (p && !$(id).contains(document.activeElement)) { try { p.focus(); } catch (e) {} }
}
function entOcupado(form, sim) { form.querySelectorAll('button, input').forEach(x => { x.disabled = sim; }); }
function entInicio(msg, erro) { entTela('entEntrar', 'Entrar no painel', 'Com o e-mail e a senha da clínica. Depois, um código chega no e-mail.', msg, erro); }
function entNovaTela(msg, termos) {
  ['entCodNova', 'entSenhaNova', 'entSenhaNova2'].forEach(k => { $(k).value = ''; });
  $('entTermosRot').hidden = !termos; $('entTermos').checked = false;
  entTela('entNova', ENT.modo === 'esqueci' ? 'Trocar a senha' : 'Criar a senha', 'Digite o código do e-mail e escolha a senha.', msg);
}
// Entrou: guarda a sessão (só nesta aba) e a lembrança (se houver) e abre o painel sem o ?t= no endereço.
function entEntrou(r) {
  sessaoGuardar(r.sessao);
  const fim = () => { location.replace(location.pathname); };
  if (r.lembranca) { lembrancaGuardar(r.lembranca); sessao = r.sessao; c29('lembranca_usada', { lembranca: r.lembranca }).then(fim, fim); }
  else fim();
}
function entradaMostrar(msg, erro) {
  $('carregando').hidden = true; $('app').hidden = true; $('entrada').hidden = false;
  entInicio(msg, erro);
}
function entradaAbrir() {
  const avisoH = location.hash === '#venceu' ? 'Sua entrada venceu. Entre de novo.' : location.hash === '#link' ? 'Este link não vale mais. Entre com o e-mail e a senha (no primeiro acesso, toque em "Criar senha").' : '';
  if (location.hash) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  const lem = lembrancaLer();
  if (!/^[0-9a-f]{64}$/.test(lem)) { if (lem) lembrancaGuardar(''); entradaMostrar(avisoH, !!avisoH); return; }
  c29('retomar', { lembranca: lem }).then(r => {
    if (r && r.ok && r.sessao) { entEntrou(r); return; }
    if (r && r.esquecer) lembrancaGuardar('');
    entradaMostrar((r && r.mensagem) || avisoH, true);
  });
}
$('entEntrar').addEventListener('submit', ev => {
  ev.preventDefault();
  const f = $('entEntrar'), email = $('entEmail').value.trim(), senha = $('entSenha').value;
  if (!email || !senha) { entMsg('Digite o e-mail e a senha.', true); return; }
  entOcupado(f, true); entMsg('Conferindo…');
  c29('entrar', { email, senha }).then(r => {
    entOcupado(f, false);
    if (!r.ok || !r.desafio) { entMsg(r.mensagem || 'Não consegui entrar.', true); return; }
    ENT.desafio = r.desafio; ENT.lembrar = $('entLembrar').checked; $('entSenha').value = ''; $('entCod').value = '';
    entTela('entCodigo', 'Código no e-mail', 'Para confirmar que é você.', r.mensagem);
  });
});
$('entCodigo').addEventListener('submit', ev => {
  ev.preventDefault();
  const f = $('entCodigo'), cod = $('entCod').value.replace(/\D/g, '');
  if (cod.length !== 6) { entMsg('O código tem 6 dígitos.', true); return; }
  entOcupado(f, true); entMsg('Conferindo…');
  c29('entrar_codigo', { desafio: ENT.desafio, codigo: cod, lembrar: ENT.lembrar }).then(r => {
    entOcupado(f, false);
    if (r.ok && r.sessao) { entMsg('Pronto! Abrindo o painel…'); entEntrou(r); return; }
    if (r.recomecar) { entInicio(r.mensagem, true); return; }
    entMsg(r.mensagem || 'O código não conferiu.', true);
  });
});
document.querySelectorAll('[data-ent]').forEach(b => b.addEventListener('click', () => {
  const o = b.getAttribute('data-ent');
  if (o === 'voltar') {
    if (ENT.modo === 'link') { $('entrada').hidden = true; $('app').hidden = false; ENT.modo = ''; return; }
    entInicio(''); return;
  }
  ENT.modo = o; $('entEmailPedir').value = $('entEmail').value.trim();
  entTela('entPedir', o === 'criar' ? 'Criar a senha' : 'Esqueci a senha', 'Um código de 6 dígitos vai para o e-mail da clínica.', '');
}));
$('entPedir').addEventListener('submit', ev => {
  ev.preventDefault();
  const f = $('entPedir'), email = $('entEmailPedir').value.trim();
  if (!email) { entMsg('Digite o e-mail.', true); return; }
  entOcupado(f, true); entMsg('Mandando…');
  c29('senha_pedir', { email }).then(r => {
    entOcupado(f, false);
    if (!r.ok || !r.desafio) { entMsg(r.mensagem || 'Não consegui mandar o código.', true); return; }
    ENT.desafio = r.desafio;
    entNovaTela(r.mensagem, ENT.modo === 'criar' || r.primeira === true);
  });
});
$('entNova').addEventListener('submit', ev => {
  ev.preventDefault();
  const f = $('entNova'), cod = $('entCodNova').value.replace(/\D/g, ''), s1 = $('entSenhaNova').value, s2 = $('entSenhaNova2').value;
  if (cod.length !== 6) { entMsg('O código tem 6 dígitos.', true); return; }
  if (s1.length < 10) { entMsg('A senha precisa ter pelo menos 10 caracteres.', true); return; }
  if (s1 !== s2) { entMsg('As duas senhas não são iguais.', true); return; }
  if (!$('entTermosRot').hidden && !$('entTermos').checked) { entMsg('Marque que leu e aceita os Termos de Uso.', true); return; }
  entOcupado(f, true); entMsg('Salvando…');
  c29('senha_nova', { desafio: ENT.desafio, codigo: cod, senha: s1, aceite_termos: !$('entTermosRot').hidden && $('entTermos').checked,
    versao_termos: VERSAO_TERMOS, lembrar: $('entLembrarNova').checked }).then(r => {
    entOcupado(f, false);
    if (r.ok && r.sessao) { entMsg('Senha salva! Abrindo o painel…'); entEntrou(r); return; }
    if (r.termos) { $('entTermosRot').hidden = false; entMsg(r.mensagem, true); return; }
    if (r.recomecar) { if (ENT.modo === 'link') { entNovaTela(r.mensagem + ' Toque em Voltar e em "Criar minha senha" de novo.', true); return; } entInicio(r.mensagem, true); return; }
    entMsg(r.mensagem || 'Não consegui salvar a senha.', true);
  });
});
// Faixa "Crie sua senha" (link antigo): o código vai para o e-mail do cadastro da clínica do link.
function criarSenhaPeloLink(b) {
  b.disabled = true;
  c29('senha_pedir_link', { token }).then(r => {
    b.disabled = false;
    if (!r.ok || !r.desafio) { rapida(r.mensagem || 'Não consegui mandar o código.'); return; }
    ENT.desafio = r.desafio; ENT.modo = 'link';
    $('app').hidden = true; $('entrada').hidden = false; window.scrollTo(0, 0);
    entNovaTela(r.mensagem, true);
  });
}
// Sair: encerra a sessão e esquece este aparelho (na próxima vez, e-mail, senha e código).
function sairPainel(b) {
  const fim = () => { sessaoGuardar(''); lembrancaGuardar(''); location.replace(location.pathname); };
  const lem = lembrancaLer();
  if (b) b.disabled = true;
  if (!sessao) { fim(); return; }
  c29('sair', { esquecer: true, lembranca: lem }).then(fim, fim);
}
