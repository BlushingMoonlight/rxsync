// ---------------------------------------------------------------- abertura
// Sem link e sem sessão: a entrada. Com a sessão, pergunta antes ao 29 (termos_estado): no fim do contrato, só a tela de baixar.
function mostrarErro(msg) {
  $('carregando').hidden = true; $('app').hidden = true;
  trocar($('erro'), el('div', { class: 'cartao', role: 'main' }, el('h1', { text: 'Não foi possível abrir o painel' }), el('p', { class: 'mudo', text: msg }),
    el('div', { class: 'pilha' }, el('a', { class: 'btn sec plena', href: location.pathname, text: 'Entrar com e-mail e senha' }))));
  $('erro').hidden = false;
}
function abrirPainel(termos) {
  c24('abrir').then(resp => {
    $('carregando').hidden = true;
    if (!resp.ok) { if (!resp.entrar) mostrarErro(resp.mensagem || 'O painel não abriu. Entre de novo com o e-mail e a senha.'); return; }
    // Papel, plano e recursos vêm do servidor (DEC-063, DEC-115); quem recusa de verdade é o banco.
    PAPEL = resp.papel === 'equipe' ? 'equipe' : 'dono';
    document.body.classList.toggle('papel-equipe', PAPEL === 'equipe');
    Object.assign(RO, resp.somenteLeitura || {});
    CAMPOS.forEach(c => { let v = (resp.editaveis || {})[c.key]; if (v == null) v = ''; if (c.key === 'fuso_horario' && !v) v = 'America/Sao_Paulo'; VAL[c.key] = String(v); });
    REC = resp.recursos && typeof resp.recursos === 'object' ? resp.recursos : null;
    if (!REC) { // servidor antigo, sem "recursos": a regra de antes, pelo nome do plano
      const g = !/^essencial/i.test(String(RO.plano || '')) && !!RO.plano;
      REC = {}; GESTAO.forEach(k => { REC[k] = g; });
    }
    if (resp.limite_catalogo) LIMITE_CATALOGO = resp.limite_catalogo;
    CONTA = resp.conta || {};
    aplicarFuso(VAL.fuso_horario);
    document.querySelectorAll('[data-nome-clinica]').forEach(x => { x.textContent = VAL.nome_exibicao || 'Sua clínica'; });
    montarNav();
    $('app').hidden = false;
    if (sessao) termosConferir(termos);
    pausaCarregar(); agCarregar(); gradeCarregar();
    if (!sem('medicos')) medCarregar();
    faixasAtualizar(); estadoMostrar();
    rotear();
  }).catch(() => { $('carregando').hidden = true; mostrarErro('Sem conexão. Confira a internet e abra o painel de novo.'); });
}
if (!token && !sessao) entradaAbrir();
else if (sessao) c29('termos_estado').then(r => { if (r && r.so_baixar === true) fimContratoMostrar(r.papel); else abrirPainel(r); });
else abrirPainel(null);
