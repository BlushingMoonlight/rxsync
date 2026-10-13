/* Fluxo do sistema: o caminho de uso do sistema real, do WhatsApp da clínica ao painel, ao app e à cobrança.
   Mapa geral (3 blocos ligados pelo ID do paciente), legenda, índice e 8 etapas em trilho. Os números são marcadores
   do escopo (A.item): tocar abre o balão com a explicação e o "Ver no escopo". Esta página nunca mostra preço. */
(function () {
  'use strict';
  var A = window.AG, esc = A.esc;
  // Subprojetos: nome curto e cor (variáveis do estilo atual, então combinam com cada estilo).
  var SUB = {
    P1: ['Projeto 1 · Atendimento', 'var(--c3)'],
    ERP: ['ERP · Operação', 'var(--c1)'],
    CRM: ['CRM · Relacionamento', 'var(--c5)'],
    CDX: ['CDX · Consultório Digital', 'var(--c4)'],
    APP: ['App do paciente', 'var(--c6)']
  };
  // Passo: [quem, subprojeto, o que acontece, detalhe, itens, em teste final, desvios [[se, então, itens]]]
  var ETAPAS = [
    ['Primeiro contato e agendamento', 'O paciente escreve no WhatsApp da clínica, a qualquer hora. A IA atende, entende o que ele precisa e marca a consulta.', [
      ['Paciente', 'P1', 'Manda mensagem no WhatsApp da clínica', '', [1]],
      ['IA', 'P1', 'Reconhece quem é pelo telefone ou cria o ID do paciente', 'Quem volta é chamado pelo nome e não repete os dados.', [14, 15, 16, 17], true],
      ['IA', 'P1', 'Responde dúvidas sobre a clínica e lê fotos e PDFs', 'Preços, procedimentos, endereço, preparo, pedidos de exame.', [2, 3, 11], false, [
        ['Assunto sensível ou o paciente pede', 'A IA chama a equipe e avisa o paciente.', [10]],
        ['Dúvida de nutrição, enfermagem, financeiro ou médica', 'Vai para a pessoa da área (veja "Dúvidas para a equipe").', [57, 58]]]],
      ['IA', 'P1', 'Identifica o tipo de consulta e o médico', 'Confirma com o paciente antes de seguir.', [22, 23, 24, 25]],
      ['IA', 'P1', 'Faz as perguntas da pré-consulta', 'As perguntas que a clínica definiu para aquele tipo de consulta.', [28, 29, 30]],
      ['IA', 'P1', 'Oferece horários e marca a consulta', 'Primeiro os horários colados aos já marcados, sem impedir outra escolha. Feriados bloqueados.', [4, 8, 18, 19, 20, 21, 26]],
      ['Sistema', 'P1', 'Avisa a clínica e o painel', 'Resumo de 2 a 4 frases sobre o motivo da consulta e aviso do agendamento ao painel.', [5, 31], true],
      ['IA', 'P1', 'Manda lembretes e cuida da fila de espera', 'Se alguém cancela, o horário vai para quem está na fila.', [6, 7]]]],
    ['Antes da consulta', 'O agendamento chega ao painel da clínica. A ficha e a conta do app são criadas sozinhas.', [
      ['Sistema', 'ERP', 'A consulta aparece na agenda do painel', 'Por dia, semana e médico, com salas e equipamentos.', [50, 51, 188, 189, 190]],
      ['Sistema', 'CDX', 'A ficha do paciente é criada pelo ID', 'Com as respostas da pré-consulta anexadas.', [63, 66]],
      ['Sistema', 'APP', 'A conta do app é criada e o link chega pelo WhatsApp', 'O paciente entra pelo link, sem senha, aceita o termo e é avisado de que conversa com uma IA.', [92, 93, 97]],
      ['Médico', 'CDX', 'Recebe o resumo pré-consulta', 'O que o paciente registrou desde a última vez: peso, adesão, sintomas e aplicações.', [71, 135]],
      ['Recepção', 'ERP', 'Marca a chegada e recebe o paciente', 'O painel mostra quem espera e há quanto tempo; aniversários e primeiras consultas do dia.', [176, 177]]]],
    ['Na consulta', 'A equipe de saúde trabalha no Consultório Digital, com tudo do paciente numa tela.', [
      ['Sistema', 'CDX', 'A balança manda peso e medidas para a ficha', 'Sem digitação, com gráfico da evolução.', [72, 73]],
      ['Médico', 'CDX', 'Abre a Central do paciente e preenche a ficha', 'Linha do tempo única: consultas, app, balança, exames, conversas e pagamentos. Toda alteração vira versão nova.', [64, 65, 191]],
      ['Médico', 'CDX', 'Usa a Central do médico', 'Transcrição com aceite do paciente, resumo de exames e documentos para revisar. A interpretação e a prescrição são sempre do médico.', [165, 166, 167, 192, 193]],
      ['Médico', 'CDX', 'Assina documentos e emite a receita', 'Com certificado digital e plataforma de receita certificada.', [194, 195]],
      ['Equipe', 'CDX', 'Cada área registra a sua parte', 'Sinais vitais na enfermagem, modelos de plano na nutrição, escalas e prontuário com sigilo na psicologia.', [171, 172, 173, 175]],
      ['Enfermagem', 'ERP', 'Registra a aplicação na clínica', 'Lote e validade do frasco; o estoque baixa sozinho e avisa quando está acabando.', [90, 91, 174, 201]]]],
    ['Depois da consulta', 'O paciente recebe o que precisa e a clínica cobra, sem trabalho manual.', [
      ['Sistema', 'CDX', 'O PDF da ficha chega ao paciente pelo WhatsApp', 'Com a marca da clínica e as partes que o médico escolheu. Fica guardado no app.', [74, 75, 76, 121]],
      ['Sistema', 'ERP', 'Cobra a consulta ou o programa', 'Link de Pix ou cartão pelo WhatsApp, lembrete antes e depois do vencimento, recibo.', [87, 88, 89, 196, 197, 198]],
      ['IA', 'P1', 'Pede a avaliação da consulta', 'Nota e comentário pelo WhatsApp e convite para avaliar no Google, para todos os atendidos.', [39, 40], true]]],
    ['No dia a dia, pelo app', 'Entre as consultas, o paciente registra a rotina no app e a equipe acompanha pelo painel.', [
      ['Paciente', 'APP', 'Registra refeições, água, sono, atividade e humor', 'Foto do prato, código de barras ou busca; metas e plano alimentar definidos pela equipe.', [101, 102, 103, 106, 107, 108, 112, 113, 114, 115, 116, 117]],
      ['Paciente', 'APP', 'Registra medidas, fome, intestino e ciclo', 'Com gráficos de evolução e fotos de progresso privadas.', [118, 120, 122, 150, 151, 154]],
      ['Paciente', 'APP', 'Faz a aplicação com a picadinha', 'O app mostra o que a clínica conferiu, sem calcular nada; lembrete e rodízio do local.', [124, 125, 126, 127], false, [
        ['Sintoma importante depois da aplicação', 'A enfermagem é avisada na hora.', [128, 129]]]],
      ['Paciente', 'APP', 'Tira dúvidas no app', 'A IA responde só com as orientações escritas pela equipe e chama a equipe quando precisa. A resposta da equipe chega entre aspas, sem alteração.', [157, 143, 163, 164]],
      ['Sistema', 'APP', 'Tudo vai para a ficha e para a visão do médico', 'Quem parou de registrar ou relatou sintoma aparece nos alertas.', [134, 135, 136]],
      ['Médico', 'APP', 'Manda avisos e conteúdo', 'Para um paciente, um grupo ou todos; vídeos, artigos e receitas por área.', [131, 132, 133]]]],
    ['Dúvidas para a equipe', 'O que a IA não resolve vai para a pessoa certa, e a resposta volta ao paciente sem alteração.', [
      ['IA', 'CRM', 'Percebe o assunto e encaminha para a área', 'Nutrição, enfermagem, financeiro ou médico, com o nome e o ID do paciente.', [57, 58, 59]],
      ['Profissional', 'CRM', 'Responde pelo WhatsApp dele', 'A resposta chega ao paciente pelo WhatsApp da clínica, entre aspas e sem alteração.', [60, 35], false, [
        ['Ninguém responde no prazo', 'O caso sobe de nível até chegar ao dono.', [61]],
        ['A equipe quer assumir a conversa', 'Assume no lugar da IA e devolve quando terminar.', [84, 85, 86]]]],
      ['Equipe', 'CRM', 'Acompanha os casos e conversa entre si', 'Painel de casos, canais, mensagens diretas, menção com @ e tarefa delegada pela conversa.', [62, 202, 203, 204, 205, 206]],
      ['Sistema', 'CRM', 'Avisos vão primeiro para a equipe do paciente', 'Cada profissional vê primeiro os pacientes de quem cuida.', [207, 208, 209]]]],
    ['Relacionamento e retorno', 'A clínica não perde paciente por esquecimento.', [
      ['IA', 'P1', 'Avisa quando o retorno venceu e oferece horários', '', [37], true],
      ['IA', 'P1', 'Convida quem sumiu a voltar', 'Depois do tempo que a clínica definir.', [38], true],
      ['Equipe', 'CRM', 'Trabalha o funil e as campanhas', 'Origem do contato, etapas, etiquetas, modelos de mensagem, campanhas e indicações.', [68, 180, 181, 183, 184, 185, 186, 187]],
      ['Equipe', 'CRM', 'Cuida das tarefas e retornos com prazo', 'Ligar, mandar orçamento, lembrar retorno, com responsável.', [182]]]],
    ['Gestão da clínica', 'O dono e a equipe acompanham a operação, e a RXSync cobra a mensalidade e a IA pelo uso.', [
      ['Equipe', 'ERP', 'Cada pessoa entra no próprio painel', 'Login por link no e-mail, perfil de acesso e menu da função; o dono vê tudo.', [43, 44, 168, 169]],
      ['Equipe', 'ERP', 'Pergunta e pede à IA da equipe', '"Quem faltou esta semana?", "marca a Maria na quinta às 10h". Com manual e ajuda pela IA.', [77, 78, 79, 80, 81, 82, 170]],
      ['Dono', 'ERP', 'Acompanha indicadores e o financeiro', 'Agendamentos, faltas, conversão, adesão; caixa do dia, contas a pagar, repasse e resultado do mês.', [56, 178, 179, 199, 200]],
      ['Dono', 'ERP', 'Liga e desliga cada função', 'Por clínica e, quando fizer sentido, por médico.', [12, 52, 53, 54, 55]],
      ['Sistema', 'ERP', 'Mede o uso de IA e cobra junto com a mensalidade', 'Por função, profissional e paciente; teto mensal com avisos em 80% e 100%. A IA é cobrada só da clínica, nunca do paciente.', [145, 146, 147, 148]],
      ['Sistema', 'ERP', 'Protege e guarda os dados da clínica', 'Servidor próprio, backup diário, registro de acessos e das respostas da IA, exportação total a qualquer momento.', [41, 42, 45, 46, 47, 48, 49]]]]
  ];

  // Marcadores em grupos de até 4 números, para caber no celular sem rolagem lateral.
  function marcadores(l) {
    var h = '';
    for (var i = 0; i < l.length; i += 4) h += A.item(l.slice(i, i + 4));
    return '<span class="itens">' + h + '</span>';
  }
  function etiquetaSub(s) { return '<span class="sub-f" style="--cor:' + SUB[s][1] + '"><i class="ponto"></i>' + SUB[s][0] + '</span>'; }

  document.getElementById('logo').innerHTML = A.logo({ tamanho: 64 });

  // Mapa geral: os 3 projetos ligados pelo ID do paciente (item 14).
  function bloco(cor, rotulo, titulo, texto, extra) {
    return '<div class="bloco-f" style="--cor:' + cor + '"><span class="rotulo">' + rotulo + '</span><h2>' + titulo + '</h2><p class="mudo">' + texto + '</p>' + (extra || '') + '</div>';
  }
  function ligacao(texto) { return '<div class="liga-f" aria-label="Ligação: ' + texto + '"><span class="seta">⇄</span><span>' + texto + '</span></div>'; }
  document.getElementById('mapa').innerHTML = '<div class="cartao mapa-f">' +
    '<div class="id-f"><span><b>ID do paciente</b> · liga os três blocos: o mesmo paciente no WhatsApp, no painel e no app</span>' + marcadores([14]) + '</div>' +
    '<div class="blocos-f">' +
    bloco(SUB.P1[1], 'Projeto 1', 'Atendimento RXSync', 'IA no WhatsApp da clínica: atende, tira dúvidas, marca e lembra.') +
    ligacao('API da RXSync') +
    bloco('var(--primaria)', 'Projeto 2', 'Painel da clínica', 'Onde a equipe trabalha.', '<div class="partes-f">' + ['ERP', 'CRM', 'CDX'].map(etiquetaSub).join('') + '</div>') +
    ligacao('sincroniza') +
    bloco(SUB.APP[1], 'Projeto 3', 'App do paciente', 'A rotina do paciente entre as consultas, ligada à ficha.') +
    '</div></div>';

  document.getElementById('legenda').innerHTML = '<span class="rotulo">Cores</span><div class="legenda-lista">' + Object.keys(SUB).map(etiquetaSub).join('') + '</div>';

  document.getElementById('indice').innerHTML = '<span class="rotulo">Etapas</span><ol>' + ETAPAS.map(function (e, i) {
    return '<li><a href="#etapa-' + (i + 1) + '"><span class="num">' + (i + 1) + '</span>' + esc(e[0]) + '</a></li>';
  }).join('') + '</ol>';

  document.getElementById('etapas').innerHTML = ETAPAS.map(function (e, i) {
    return '<section class="etapa-f" id="etapa-' + (i + 1) + '"><header><span class="num numero-etapa">' + (i + 1) + '</span><div><h2>' + esc(e[0]) + '</h2><p class="mudo">' + esc(e[1]) + '</p></div></header>' +
      '<ol class="trilho-f">' + e[2].map(function (p) {
        return '<li class="passo-f" style="--cor:' + SUB[p[1]][1] + '"><div class="cartao">' +
          '<div class="passo-cab"><span class="quem-f">' + esc(p[0]) + '</span>' + etiquetaSub(p[1]) + (p[5] ? '<span class="teste-f">pronto, em teste final</span>' : '') + '</div>' +
          '<h3>' + esc(p[2]) + '</h3>' + (p[3] ? '<p class="mudo">' + esc(p[3]) + '</p>' : '') +
          (p[6] || []).map(function (d) { return '<div class="se-f"><b>Se:</b> ' + esc(d[0]) + ' <span aria-hidden="true">→</span> ' + esc(d[1]) + ' ' + marcadores(d[2]) + '</div>'; }).join('') +
          marcadores(p[4]) + '</div></li>';
      }).join('') + '</ol></section>';
  }).join('');
})();
