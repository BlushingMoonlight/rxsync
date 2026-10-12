/* Questionário do Dr. André: 30 perguntas aprovadas pelo Jean. As respostas ficam salvas neste aparelho enquanto a pessoa responde; "Enviar respostas" manda uma
   versão nova para o datalog da RXSync (cada envio vira uma versão; nada é apagado). */
(function () {
  'use strict';
  var A = window.AG, esc = A.esc, DT = A.datas;
  var URL_SALVAR = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/demo-salvar';
  // [assunto, [número, pergunta, opções (se houver)]]
  var GRUPOS = [
    ['Clínica e equipe', [
      [1, 'Quantos médicos e profissionais trabalham na clínica? Quem é o Diretor Técnico?'],
      [2, 'Quais tipos de consulta cada profissional faz, e quanto dura cada um?'],
      [3, 'Quais áreas recebem encaminhamentos, quem responde por cada uma e em quanto tempo deve responder?'],
      [4, 'Quem da equipe vai usar o painel, e o que cada pessoa pode ver?'],
      [5, 'Hoje a equipe conversa entre si por onde (grupo de WhatsApp, outro)?'],
      [6, 'Cada paciente tem profissionais fixos (médico, nutricionista, psicóloga)?']]],
    ['Agenda e atendimento', [
      [7, 'Qual o horário de atendimento, e quem cuida do WhatsApp fora dele?'],
      [8, 'Usa Reservio ou outra agenda hoje?'],
      [9, 'Qual a antecedência mínima e o intervalo entre consultas? Quer o empilhamento de pacientes ligado?'],
      [10, 'Que perguntas a IA deve fazer antes de confirmar cada tipo de consulta, e qual o prazo de retorno de cada uma?'],
      [11, 'Há assuntos que a IA nunca deve tratar, ou palavras que nunca deve usar?']]],
    ['Ficha e dados', [
      [12, 'Qual prontuário usa hoje? Quer trazer o histórico para a ficha nova?'],
      [13, 'Que informações a ficha precisa ter, além das padrão?'],
      [14, 'Quantos pacientes ativos a clínica tem hoje, e quantos novos chegam por mês?'],
      [15, 'Qual o modelo da balança Anovator? Já tem acesso à API, e quem é o contato?']]],
    ['Financeiro e estoque', [
      [16, 'Atende algum convênio ou é só particular?', ['Só particular', 'Atende convênio']],
      [17, 'Como cobra hoje (consultas, programas, pacotes) e com qual meio de pagamento?'],
      [18, 'Quais medicações são aplicadas na clínica, por quem, e como o estoque é controlado hoje?']]],
    ['App do paciente', [
      [19, 'Quantos pacientes usariam o app? Qual o nome, a logo e as cores?'],
      [20, 'Quem define as metas de calorias e proteína? O nutricionista já entrega plano alimentar, e em que formato?'],
      [21, 'Quais medicações a picadinha deve cobrir, e quais sintomas devem gerar alerta para a enfermagem?'],
      [22, 'Já tem conteúdos (vídeos, artigos, receitas)? Quer comunidade entre pacientes, e quem modera?']]],
    ['IA', [
      [23, 'Qual o teto mensal de gasto com IA, e ao atingir o teto: pausar ou continuar?', ['Pausar', 'Continuar']],
      [24, 'Quais funções com IA quer ligadas desde o início (foto do prato, chat da equipe, resumo pré-consulta, assistente)?']]],
    ['Preferências', [
      [25, 'Qual estilo de design você prefere para o app e o painel?', ['Clean claro', 'Clean escuro', 'Couro', 'Cyber']],
      [26, 'A IA que acompanha o paciente deve conversar pelo app (notificação) ou pelo WhatsApp?', ['Pelo app (notificação)', 'Pelo WhatsApp', 'Pelos dois']]]],
    ['Jurídico e projeto', [
      [27, 'A clínica tem advogado ou encarregado de dados (LGPD)? Já usa termo de consentimento com os pacientes?'],
      [28, 'Qual o prazo ideal para começar a usar, e quem será o contato do dia a dia?'],
      [29, 'Quem assina o contrato? Prefere pagamento à vista ou por fase?', ['À vista', 'Por fase']],
      [30, 'Aceitaria ser apresentada como caso de sucesso da RXSync?', ['Sim', 'Não', 'Prefiro conversar']]]]
  ];
  var TOTAL = 30;
  var CHAVE = 'ag-questionario-' + (A.usuario() || 'sem-usuario');
  var R = {};
  try { R = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { R = {}; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(R)); } catch (e) { /* aparelho sem armazenamento: só na memória */ } }
  function respondida(n) { var r = R[n]; return !!(r && ((r.texto || '').trim() || r.opcao)); }

  document.getElementById('logo').innerHTML = A.logo({ tamanho: 64 });
  var h = '';
  GRUPOS.forEach(function (g) {
    h += '<fieldset class="grupo-q"><legend>' + g[0] + '</legend>' + g[1].map(function (q) {
      var r = R[q[0]] || {};
      return '<div class="pergunta" data-n="' + q[0] + '"><label for="q' + q[0] + '"><span class="num">' + q[0] + '</span> ' + q[1] + '</label>' +
        (q[2] ? '<div class="opcoes-q" role="radiogroup">' + q[2].map(function (o) { return '<label class="chip"><input type="radio" name="o' + q[0] + '" value="' + esc(o) + '"' + (r.opcao === o ? ' checked' : '') + '> ' + esc(o) + '</label>'; }).join('') + '</div>' : '') +
        '<textarea class="campo" id="q' + q[0] + '" data-n="' + q[0] + '" placeholder="' + (q[2] ? 'Comentário (opcional)' : 'Sua resposta') + '" maxlength="2000"></textarea></div>';
    }).join('') + '</fieldset>';
  });
  var form = document.getElementById('perguntas');
  form.innerHTML = h;
  // O texto já digitado volta pelo .value (nunca como HTML).
  form.querySelectorAll('textarea[data-n]').forEach(function (t) { t.value = (R[t.dataset.n] || {}).texto || ''; });

  function progresso() {
    var n = 0; for (var i = 1; i <= TOTAL; i++) if (respondida(i)) n++;
    document.getElementById('barra').style.width = Math.round(n / TOTAL * 100) + '%';
    document.getElementById('contagem').textContent = n + ' de ' + TOTAL + ' respondidas';
    var e = ''; try { e = localStorage.getItem(CHAVE + '-enviado') || ''; } catch (x) { e = ''; }
    document.getElementById('enviado').textContent = e ? 'Enviado em ' + e : '';
  }
  form.addEventListener('input', function (ev) {
    var t = ev.target, n;
    if (t.matches('textarea[data-n]')) { n = t.dataset.n; R[n] = R[n] || {}; R[n].texto = t.value.slice(0, 2000); }
    else if (t.type === 'radio') { n = t.name.slice(1); R[n] = R[n] || {}; R[n].opcao = t.value; }
    else return;
    guardar(); progresso();
  });
  form.addEventListener('change', function (ev) { if (ev.target.type === 'radio') { var n = ev.target.name.slice(1); R[n] = R[n] || {}; R[n].opcao = ev.target.value; guardar(); progresso(); } });
  // Registro: só que a pergunta foi respondida (o texto vai junto no envio).
  form.addEventListener('focusout', function (ev) { if (ev.target.matches('textarea[data-n]') && respondida(ev.target.dataset.n)) A.log('questionario-resposta', { pergunta: +ev.target.dataset.n }); });

  document.getElementById('enviar').addEventListener('click', function () {
    var b = this, respostas = {};
    GRUPOS.forEach(function (g) { g[1].forEach(function (q) { if (respondida(q[0])) respostas[q[0]] = { pergunta: q[1], opcao: R[q[0]].opcao || '', texto: (R[q[0]].texto || '').trim() }; }); });
    if (!Object.keys(respostas).length) { aviso('Responda pelo menos uma pergunta antes de enviar.'); return; }
    b.disabled = true; b.textContent = 'Enviando…';
    function fim(ok) {
      b.disabled = false; b.textContent = 'Enviar respostas';
      var agora = DT.agora(), quando = DT.dma(agora) + ' às ' + DT.hm(agora);
      A.log('questionario-enviado', { ok: ok, respondidas: Object.keys(respostas).length });
      if (ok) { try { localStorage.setItem(CHAVE + '-enviado', quando); } catch (e) { /* idem */ } progresso(); aviso('Enviado em ' + quando + '. Obrigado!'); }
      else aviso('Não foi possível enviar agora. Suas respostas continuam salvas neste aparelho; tente de novo.');
    }
    try {
      fetch(URL_SALVAR, { method: 'POST', mode: 'cors', credentials: 'omit', body: JSON.stringify({ tipo: 'questionario', usuario: A.usuario(), aparelho: A.aparelho(), sessao: A.sessao(), respostas: respostas }) })
        .then(function (r) { return r.json(); }).then(function (j) { fim(!!(j && j.ok)); }, function () { fim(false); });
    } catch (e) { fim(false); }
  });
  function aviso(m) { var v = document.querySelector('.aviso-curto'); if (v) v.remove(); v = document.createElement('div'); v.className = 'aviso-curto'; v.textContent = m; document.body.appendChild(v); setTimeout(function () { v.remove(); }, 3200); }
  progresso();
})();
