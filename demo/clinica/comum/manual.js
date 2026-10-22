// Demonstração por link (DEC-125): o MAPA COMPLETO do app do paciente e da central da equipe, numa fonte só.
// Daqui saem o Manual (manual/), os fluxogramas (comum/fluxos.js) e o tutorial de primeiro acesso (comum/tutorial.js).
// Cada tela: o que é, para quem, o que dá para fazer (passo a passo), de onde vêm os dados, o que acontece do outro lado
// (entre o app e a central), os itens do escopo e o porquê; e os elementos (cartões, botões, campos, folhas) e os estados (vazio,
// carregando, erro). "tela" é a mesma chave dos links da demonstração (…&tela=…): o teste confere que todas existem.
(function () {
  'use strict';
  // e(tipo, nome, o que faz): tipo = cartão, botão, campo, folha, aba, lista, gráfico, interruptor, aviso.
  const e = (tipo, nome, desc) => ({ tipo, nome, desc });
  // s(estado, quando aparece): estado = vazio, carregando, erro, pronto.
  const s = (estado, desc) => ({ estado, desc });

  const APP = [
    { tela: 'boas-vindas', titulo: 'Boas-vindas e aceite', para: 'Paciente, no primeiro acesso',
      oque: 'A primeira tela do app: a marca da clínica, o aviso do que é feito por inteligência artificial e o aceite do termo de uso.',
      passos: ['Abra o link que a clínica mandou (não tem senha).', 'Leia o aviso "Antes de começar".', 'Marque "Li e aceito o termo de uso".', 'Toque em "Começar": o app abre na tela Hoje.'],
      dados: ['Nome e cor da clínica: do cadastro da clínica.', 'Data do primeiro acesso: do cadastro do paciente.'],
      outroLado: 'O aceite fica registrado na ficha do paciente, com data e hora.',
      porque: 'O paciente entra sem senha e sabe, antes de tudo, o que é automático e o que é da equipe.',
      itens: [1, 4], palavras: 'entrar link senha aceite termo primeiro acesso começar',
      elementos: [e('cartão', 'Antes de começar', 'O aviso sobre a IA: ela não diagnostica nem receita.'), e('campo', 'Li e aceito o termo de uso', 'Caixa de marcar; sem ela, "Começar" fica desligado.'), e('botão', 'Começar', 'Abre a tela Hoje.')],
      estados: [s('erro', '"Começar" fica desligado até o aceite.')] },
    { tela: 'inicio', titulo: 'Hoje', para: 'Paciente',
      oque: 'O resumo do dia: os anéis de calorias, proteína e água com as metas, o que falta, os pontos, o sono, a próxima aplicação, o peso, a proteína dos 7 dias anteriores, a próxima consulta e o último recado.',
      passos: ['Veja os 3 anéis e a frase "Faltam N g de proteína hoje".', 'Toque em "Registrar refeição" para abrir a folha de refeição.', 'Toque em "+250 mL de água" para somar um copo.', 'Toque num cartão (Sono, Próxima aplicação, Peso, Pontos) para ir à tela dele.', 'O botão com as suas iniciais, no canto de cima, abre o perfil; o "?" mostra de novo o tutorial.'],
      dados: ['Metas: definidas pela nutricionista (ou pelo médico) na central, com quem e quando.', 'Consumo do dia: a soma do que o paciente registrou hoje.', 'Peso: a última pesagem (do paciente ou da clínica).', 'Consulta e recado: da agenda e dos recados da central.'],
      outroLado: 'Tudo o que o paciente registra aqui aparece na ficha dele na central ("Hoje, até agora" e linha do tempo). Meta mudada na central muda os anéis na hora.',
      porque: 'Em um olhar, o paciente sabe o que falta no dia e o que vem a seguir.',
      itens: [2, 6, 9, 28, 29, 35, 50], palavras: 'hoje inicio início anéis metas proteína calorias água resumo dia tutorial ajuda',
      elementos: [e('botão', '?', 'Mostra de novo o tutorial do primeiro acesso.'), e('cartão', 'Metas do dia', 'Anéis de calorias, proteína e água, com a meta e a origem.'), e('botão', 'Registrar refeição', 'Abre a folha de refeição.'), e('botão', '+250 mL de água', 'Soma um copo na hora.'),
        e('cartão', 'Pontos de hoje', 'Soma dos registros do dia.'), e('cartão', 'Sono', 'O último registro de sono ou "Registrar".'), e('cartão', 'Próxima aplicação', 'Dia, hora e quanto falta.'), e('cartão', 'Peso', 'A última pesagem e a variação desde o início.'),
        e('gráfico', 'Proteína nos 7 dias anteriores', 'Uma barra por dia; as que chegaram perto da meta ficam na cor da clínica.'), e('cartão', 'Próxima consulta', 'Data, hora, com quem e onde.'), e('cartão', 'Recado da clínica', 'O recado mais novo, com quem mandou e quando.')],
      estados: [s('vazio', 'Sem registros no dia, os anéis ficam vazios e a frase diz quanto falta.'), s('pronto', 'Metas cumpridas: "Metas do dia cumpridas".')] },
    { tela: 'refeicao', titulo: 'Registrar refeição (folha)', para: 'Paciente',
      oque: 'A folha que sobe de baixo para registrar o que comeu: escolher a refeição, buscar o alimento, ajustar a porção ou usar a foto do prato e o código de barras.',
      passos: ['Escolha a refeição (café da manhã, almoço, lanche ou jantar).', 'Digite no campo "Buscar alimento": a lista filtra na hora.', 'Toque no alimento para ver as calorias, as proteínas, os carboidratos e as gorduras.', 'Ajuste a porção no − e no +.', 'Toque em "Registrar no …": aparece a confirmação e o anel do dia sobe.', 'Ou toque em "Foto do prato" (a leitura é simulada) ou "Código de barras".'],
      dados: ['Alimentos e nutrientes por porção: tabela de exemplo da demonstração.'],
      outroLado: 'A refeição entra na linha do tempo da ficha e soma em "Hoje, até agora" na central.',
      porque: 'Registrar comida tem de ser rápido, ou o paciente desiste.',
      itens: [7, 8], palavras: 'refeição comida alimento buscar porção foto prato código barras registrar comer almoço café jantar lanche',
      elementos: [e('campo', 'Qual refeição', 'Controle de 4 opções.'), e('campo', 'Buscar alimento', 'Filtra a lista enquanto digita.'), e('lista', 'Resultados', 'Alimento, porção e calorias.'), e('botão', 'Foto do prato', 'Simula a leitura da foto.'), e('botão', 'Código de barras', 'Simula a leitura do código.'),
        e('campo', 'Quanto você comeu?', 'Porção no − e no +, de meia em meia.'), e('botão', 'Registrar no …', 'Grava e fecha a folha.'), e('lista', 'Hoje', 'As refeições já registradas, com a hora.')],
      estados: [s('vazio', 'Busca sem resultado: "Nada com esse nome por aqui".'), s('carregando', 'Lendo a foto ou o código: blocos cinzas por 1 segundo.')] },
    { tela: 'registrar', titulo: 'Registrar', para: 'Paciente',
      oque: 'Todos os registros do dia em blocos: refeição, água, sono, atividade, humor, fome, intestino, remédios, outros registros e o plano alimentar.',
      passos: ['Toque no bloco do que quer registrar: abre uma folha.', 'Escolha as opções e toque em "Registrar".', 'O bloco passa a mostrar o que foi registrado.'],
      dados: ['O que já foi registrado hoje.', 'Os blocos que aparecem dependem das funções ligadas pela clínica na central.'],
      outroLado: 'Cada registro entra na linha do tempo da ficha. Desligar uma função na central tira o bloco daqui.',
      porque: 'Um lugar só para tudo o que o paciente registra no dia.',
      itens: [7, 10, 11, 12, 13, 14, 15, 16, 17, 18], palavras: 'registrar registro blocos diário',
      elementos: [e('cartão', 'Blocos de registro', 'Ícone, nome e o que já foi registrado hoje (em verde).')],
      estados: [s('vazio', 'Sem registro: o bloco mostra "Registrar".')] },
    { tela: 'agua', titulo: 'Água (folha)', para: 'Paciente',
      oque: 'Soma a água do dia em mL.', passos: ['Toque em "1 copo (250 mL)" ou "1 garrafa (500 mL)".', 'A folha fecha, aparece a confirmação e o anel de água sobe.'],
      dados: ['Meta de água: definida pela equipe (em mL).'], outroLado: 'O total do dia aparece em "Hoje, até agora" e na linha do tempo da ficha.',
      porque: 'Hidratação ajuda com a náusea e com o intestino.', itens: [11], palavras: 'água beber copo garrafa ml hidratação',
      elementos: [e('botão', '1 copo (250 mL)', 'Soma 250 mL.'), e('botão', '1 garrafa (500 mL)', 'Soma 500 mL.')], estados: [s('pronto', 'Meta cumprida: aviso em verde.')] },
    { tela: 'sono', titulo: 'Sono (folha)', para: 'Paciente', oque: 'Quantas horas dormiu e como dormiu.',
      passos: ['Escolha as horas e como dormiu.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente.'], outroLado: 'Aparece na linha do tempo da ficha.',
      porque: 'Sono ruim aumenta a fome e atrapalha a adesão.', itens: [12], palavras: 'sono dormir dormiu horas noite',
      elementos: [e('campo', 'Quantas horas você dormiu?', 'Uma opção.'), e('campo', 'Como dormiu?', 'Uma opção.'), e('botão', 'Registrar', 'Grava e fecha.')], estados: [s('erro', 'Sem escolher: "Escolha uma opção em cada pergunta".')] },
    { tela: 'atividade', titulo: 'Atividade física (folha)', para: 'Paciente', oque: 'O que fez e por quanto tempo.',
      passos: ['Escolha a atividade e o tempo.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente.'], outroLado: 'Aparece na linha do tempo da ficha.',
      porque: 'Atividade ajuda a preservar a massa muscular durante a perda de peso.', itens: [13], palavras: 'atividade exercício caminhada musculação academia',
      elementos: [e('campo', 'O que você fez?', 'Uma opção.'), e('campo', 'Por quanto tempo?', 'Uma opção.')], estados: [s('erro', 'Sem escolher: pede a escolha.')] },
    { tela: 'humor', titulo: 'Humor (folha)', para: 'Paciente', oque: 'Como está hoje.',
      passos: ['Escolha como está.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente.'], outroLado: 'Aparece na linha do tempo da ficha.',
      porque: 'Humor baixo costuma vir antes de largar o acompanhamento.', itens: [14], palavras: 'humor sentimento ânimo',
      elementos: [e('campo', 'Como você está hoje?', 'Uma opção.')], estados: [s('erro', 'Sem escolher: pede a escolha.')] },
    { tela: 'fome', titulo: 'Fome e saciedade (folha)', para: 'Paciente', oque: 'A fome antes e depois do almoço.',
      passos: ['Escolha a fome antes e depois do almoço.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente.'], outroLado: 'Aparece na linha do tempo da ficha.',
      porque: 'Mostra o efeito do tratamento no apetite.', itens: [15], palavras: 'fome saciedade apetite',
      elementos: [e('campo', 'Antes do almoço', 'Uma opção.'), e('campo', 'Depois do almoço', 'Uma opção.')], estados: [s('erro', 'Sem escolher: pede a escolha.')] },
    { tela: 'intestino', titulo: 'Intestino (folha)', para: 'Paciente', oque: 'Como está o intestino hoje.',
      passos: ['Escolha normal, preso ou solto.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente.'],
      outroLado: 'Aparece na linha do tempo. "Preso" 3 dias seguidos vira Atenção na central.', porque: 'Efeito colateral comum, que a equipe precisa saber cedo.', itens: [16], palavras: 'intestino preso solto evacuar',
      elementos: [e('campo', 'Como está hoje?', 'Uma opção.')], estados: [s('erro', 'Sem escolher: pede a escolha.')] },
    { tela: 'outros', titulo: 'Outros registros (folha)', para: 'Paciente', oque: 'Álcool, tabaco e ciclo menstrual.',
      passos: ['Escolha uma opção em cada pergunta.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente; só a equipe vê.'], outroLado: 'Aparece na linha do tempo da ficha.',
      porque: 'Contexto que muda a leitura dos outros registros.', itens: [17], palavras: 'álcool bebida tabaco cigarro ciclo menstruação',
      elementos: [e('campo', 'Álcool, Tabaco, Ciclo menstrual', 'Uma opção em cada.')], estados: [s('erro', 'Sem escolher: pede a escolha.')] },
    { tela: 'remedios', titulo: 'Remédios e vitaminas (folha)', para: 'Paciente', oque: 'A lista da equipe, com o "tomei".',
      passos: ['Toque em "Tomei" no remédio que tomou.', 'Ele passa a mostrar a hora.'], dados: ['Lista: cadastrada pela equipe. "Tomei": do paciente.'], outroLado: 'O "tomei" aparece na linha do tempo da ficha.',
      porque: 'Adesão aos suplementos combinados.', itens: [18], palavras: 'remédio vitamina suplemento tomei comprimido',
      elementos: [e('lista', 'Remédios', 'Nome, quando tomar e "Tomei".')], estados: [s('pronto', 'Tomado: "Tomei hoje, às …".')] },
    { tela: 'plano', titulo: 'Plano alimentar (folha)', para: 'Paciente', oque: 'O cardápio e as substituições da nutricionista.',
      passos: ['Abra pelo bloco "Plano alimentar" em Registrar.', 'Leia cada refeição e as trocas.'], dados: ['Montado pela nutricionista, com a data.'], outroLado: 'A equipe edita em Metas e plano, na central.',
      porque: 'O paciente consulta o plano sem precisar de papel.', itens: [10], palavras: 'plano alimentar cardápio dieta substituição troca',
      elementos: [e('lista', 'Refeições', 'O que comer e o que pode trocar.')], estados: [] },
    { tela: 'aplicacoes', titulo: 'Aplicações', para: 'Paciente',
      oque: 'A próxima aplicação com a contagem, a prescrição travada (o app não mostra nem calcula dose), o mapa do corpo para o rodízio e como se sentiu.',
      passos: ['Veja quando é a próxima aplicação e quanto falta.', 'Confira a prescrição: os campos são da equipe, com o cadeado.', 'No mapa, veja onde foi a última e escolha o local desta vez (o último não pode repetir).', 'Escolha como se sentiu e toque em "Registrar aplicação".'],
      dados: ['Prescrição: cadastrada pelo médico e conferida pela enfermagem (com quem e quando).', 'Última aplicação e local: do histórico do paciente.'],
      outroLado: 'A aplicação aparece na ficha. Enjoo forte vira Alerta na triagem da central. A conferência da prescrição feita na central aparece aqui.',
      porque: 'Seguir o esquema e o rodízio, e avisar a equipe na hora quando algo não vai bem.',
      itens: [23, 24, 25, 26, 27], palavras: 'aplicação aplicar injeção caneta prescrição rodízio local sintoma enjoo',
      elementos: [e('cartão', 'Próxima aplicação', 'Dia, hora e contagem.'), e('cartão', 'Prescrição', 'Campos travados e a origem.'), e('aviso', 'Renovação', 'Uma renovação esperando a conferência.'),
        e('gráfico', 'Mapa do corpo', 'O último local e o escolhido.'), e('campo', 'Onde vai aplicar desta vez?', 'Uma opção; o último fica desligado.'), e('campo', 'Como se sentiu', 'Uma opção.'), e('botão', 'Registrar aplicação', 'Grava e muda a próxima.')],
      estados: [s('pronto', 'Depois de registrar, a próxima é 7 dias depois.'), s('erro', 'Enjoo forte: aviso de que a enfermagem foi chamada.')] },
    { tela: 'evolucao', titulo: 'Evolução', para: 'Paciente',
      oque: 'O gráfico do peso semana a semana, com a faixa da meta, e a avaliação feita na clínica (balança e bioimpedância).',
      passos: ['Escolha 1 mês, 3 meses ou tudo.', 'Toque num ponto do gráfico (ou use o controle embaixo) para ver o peso daquele dia e de onde veio.', 'Toque em "Registrar peso" para somar uma pesagem.'],
      dados: ['Pesagens: do paciente (casa) e da clínica (consultas), marcadas diferente.', 'Faixa da meta: definida pelo médico.', 'Bioimpedância: medida na clínica, com a data.'],
      outroLado: 'O peso registrado aparece na ficha, na lista e no gráfico da central.',
      porque: 'Ver a tendência, não só o número do dia.', itens: [19, 20, 21, 22], palavras: 'evolução peso gráfico pesagem balança bioimpedância gordura músculo cintura medidas',
      elementos: [e('campo', 'Período', '1 mês, 3 meses ou tudo.'), e('gráfico', 'Peso', 'Área, faixa da meta e ponto escolhido.'), e('campo', 'Controle do gráfico', 'Escolhe a pesagem pelo teclado.'), e('botão', 'Registrar peso', 'Abre a folha de peso.'), e('botão', 'Fotos', 'Abre as fotos de progresso.'), e('lista', 'Avaliação na clínica', 'Tabela com as datas.')],
      estados: [] },
    { tela: 'medidas', titulo: 'Peso (folha)', para: 'Paciente', oque: 'Registrar o peso de hoje.',
      passos: ['Digite o peso em kg.', 'Toque em "Registrar".'], dados: ['Registrado pelo paciente.'], outroLado: 'Entra no gráfico e na ficha da central.',
      porque: 'Pesagem semanal, sempre do mesmo jeito.', itens: [19], palavras: 'peso pesar balança registrar peso kg',
      elementos: [e('campo', 'Peso de hoje (kg)', 'Número com vírgula.')], estados: [s('erro', 'Peso fora do normal: "Confira o peso".')] },
    { tela: 'fotos', titulo: 'Fotos de progresso (folha)', para: 'Paciente', oque: 'Antes e agora, vistas só pelo paciente e pela equipe.',
      passos: ['Toque em "Adicionar foto" (na demonstração, a câmera não abre).'], dados: ['Fotos do paciente.'], outroLado: 'Vão para a ficha na clínica.',
      porque: 'A mudança aparece também no espelho, não só na balança.', itens: [22], palavras: 'foto fotos progresso antes depois',
      elementos: [e('botão', 'Adicionar foto', 'Explica o que acontece no app de verdade.')], estados: [] },
    { tela: 'mais', titulo: 'Perfil e mais', para: 'Paciente', oque: 'Os dados do paciente e tudo o que não é do dia a dia: consultas, avisos, chat, equipe, conteúdo, exames, lembretes, conquistas, assistente, leitura e meus dados.',
      passos: ['Toque nas suas iniciais, no canto de cima do app.', 'Escolha o que quer abrir.'], dados: ['Altura, peso inicial, objetivo e fase: do cadastro na clínica.'], outroLado: 'A fase é definida pelo médico na central.',
      porque: 'As abas de baixo ficam só para o dia a dia.', itens: [3, 5], palavras: 'perfil mais menu configurações objetivo fase altura',
      elementos: [e('cartão', 'Perfil', 'Nome, médico, altura, peso inicial, objetivo e fase.'), e('lista', 'Com a clínica, Para você, Sua conta', 'Atalhos para cada tela.'), e('cartão', 'Ícone na tela do celular', 'Como colocar o app na tela inicial.')], estados: [] },
    { tela: 'perfil', titulo: 'Perfil e objetivo', para: 'Paciente', oque: 'Os dados do acompanhamento.', passos: ['Abra pelo perfil.'], dados: ['Do cadastro e da primeira consulta.'], outroLado: 'Iguais aos da ficha na central.',
      porque: 'O paciente sabe de onde partiu e para onde vai.', itens: [5], palavras: 'perfil objetivo altura peso inicial', elementos: [e('lista', 'Dados', 'Altura, peso inicial, objetivo e fase.')], estados: [] },
    { tela: 'consultas', titulo: 'Minhas consultas', para: 'Paciente', oque: 'As próximas consultas, com quem e como.',
      passos: ['Veja a data e a hora.', 'Toque em "Confirmar presença".'], dados: ['Agenda da clínica.'], outroLado: 'A presença confirmada aparece na ficha e na agenda da central.',
      porque: 'Menos falta e menos ligação da recepção.', itens: [28], palavras: 'consulta retorno agenda presença confirmar horário',
      elementos: [e('lista', 'Consultas', 'Data, tipo, com quem e onde.'), e('botão', 'Confirmar presença', 'Avisa a clínica.')], estados: [s('pronto', '"Presença confirmada".')] },
    { tela: 'avisos', titulo: 'Avisos da clínica', para: 'Paciente', oque: 'Os recados da clínica, com quem mandou e quando.',
      passos: ['Leia o recado.', 'Toque em "Marcar como lido".'], dados: ['Recados enviados pela central.'], outroLado: 'Recado enviado na central aparece aqui na hora.',
      porque: 'Recado da clínica num lugar só, sem se perder no WhatsApp.', itens: [29], palavras: 'aviso recado mensagem clínica', elementos: [e('lista', 'Recados', 'Texto, quem e quando.'), e('botão', 'Marcar como lido', '')], estados: [] },
    { tela: 'lembretes', titulo: 'Lembretes', para: 'Paciente', oque: 'Os lembretes de refeições, água, remédios, aplicação e consulta.',
      passos: ['Ligue ou desligue cada lembrete.'], dados: ['Horários da equipe; a aplicação e a consulta vêm da agenda.'], outroLado: '—',
      porque: 'O paciente escolhe o que quer receber.', itens: [30], palavras: 'lembrete notificação aviso horário', elementos: [e('interruptor', 'Cada lembrete', 'Liga ou desliga.')], estados: [] },
    { tela: 'conteudo', titulo: 'Conteúdo da clínica', para: 'Paciente', oque: 'Vídeos, artigos e receitas da equipe.',
      passos: ['Toque num conteúdo para ler.'], dados: ['Cadastrado pela equipe.'], outroLado: 'A mesma lista aparece em Avisos e conteúdo, na central.',
      porque: 'Educação do paciente com a voz da clínica.', itens: [31], palavras: 'conteúdo vídeo artigo receita', elementos: [e('lista', 'Conteúdo', 'Tipo e título.')], estados: [] },
    { tela: 'exames', titulo: 'Enviar exames', para: 'Paciente', oque: 'Mandar a foto ou o PDF de um exame.',
      passos: ['Toque em "Escolher arquivo" (na demonstração, vai um arquivo de exemplo).'], dados: ['Arquivo do paciente.'], outroLado: 'O exame aparece na linha do tempo da ficha.',
      porque: 'Os exames chegam antes do retorno.', itens: [32], palavras: 'exame sangue arquivo pdf enviar', elementos: [e('botão', 'Escolher arquivo', '')], estados: [s('pronto', 'Explica o que acontece no app de verdade.')] },
    { tela: 'equipe', titulo: 'Equipe e contatos', para: 'Paciente', oque: 'Quem é quem na equipe e para que serve cada um.',
      passos: ['Toque em "Escrever" para abrir o chat.'], dados: ['Cadastro da equipe.'], outroLado: '—', porque: 'O paciente sabe com quem falar.', itens: [33], palavras: 'equipe contato médico nutricionista enfermeira recepção',
      elementos: [e('lista', 'Equipe', 'Nome e função.')], estados: [] },
    { tela: 'chat-equipe', titulo: 'Chat com a equipe', para: 'Paciente', oque: 'Conversa com a enfermagem. A resposta da equipe chega citada, entre aspas e sem alteração.',
      passos: ['Escreva a mensagem.', 'Toque em "Enviar".'], dados: ['Mensagens do paciente e da equipe.'], outroLado: 'A mensagem vira um item na ficha (sem o texto).',
      porque: 'Dúvida resolvida com quem acompanha.', itens: [34], palavras: 'chat conversa mensagem enfermagem equipe falar', elementos: [e('campo', 'Mensagem', ''), e('botão', 'Enviar', '')], estados: [] },
    { tela: 'assistente', titulo: 'Assistente de dúvidas', para: 'Paciente', oque: 'Responde dúvidas de uso do app (a partir deste manual) e orienta a partir das orientações da equipe. Não diagnostica nem receita.',
      passos: ['Escreva a dúvida (ex.: "como registro a água?").', 'Toque em "Enviar": a resposta traz os passos e a tela.'], dados: ['Este manual e as orientações da equipe.'], outroLado: 'A pergunta entra no registro de uso da demonstração.',
      porque: 'Ajuda na hora, sem esperar a equipe.', itens: [36, 49], palavras: 'assistente dúvida ajuda pergunta ia', elementos: [e('campo', 'Mensagem', ''), e('botão', 'Enviar', '')], estados: [] },
    { tela: 'conquistas', titulo: 'Conquistas', para: 'Paciente', oque: 'Os dias com registro, a meta de água e as aplicações, com a regra dos pontos.',
      passos: ['Abra pelo cartão "Pontos de hoje".'], dados: ['Calculado dos registros.'], outroLado: 'Os pontos não vão para a central.', porque: 'Motivação.', itens: [35], palavras: 'conquista pontos medalha',
      elementos: [e('lista', 'Conquistas', ''), e('aviso', 'Regra dos pontos', 'Refeição 5, copo 2, outro registro 5, remédio 2.')], estados: [] },
    { tela: 'meus-dados', titulo: 'Meus dados', para: 'Paciente', oque: 'Baixar o que registrou ou pedir a exclusão (LGPD).',
      passos: ['Toque em "Baixar meus dados" ou "Pedir a exclusão".'], dados: ['Tudo o que o paciente registrou.'], outroLado: 'O pedido de exclusão vai para a clínica.', porque: 'Direito do paciente.', itens: [37], palavras: 'dados lgpd baixar excluir privacidade',
      elementos: [e('botão', 'Baixar meus dados', ''), e('botão', 'Pedir a exclusão', '')], estados: [] },
    { tela: 'leitura', titulo: 'Leitura confortável', para: 'Paciente', oque: 'Tema escuro e letra grande.', passos: ['Ligue o tema escuro ou a letra grande.'], dados: ['—'], outroLado: '—',
      porque: 'Ler bem em qualquer luz e idade.', itens: [38], palavras: 'tema escuro letra grande leitura', elementos: [e('interruptor', 'Tema escuro', ''), e('interruptor', 'Letra grande', '')], estados: [] }
  ];

  const CENTRAL = [
    { tela: 'hoje', titulo: 'Hoje (triagem e pacientes)', para: 'Médico e equipe',
      oque: 'O começo do dia: quantos pacientes, a média de dias com registro, quem precisa de atenção hoje e por quê, a agenda de hoje e a lista de pacientes com o estado de cada um.',
      passos: ['Leia "Precisa da sua atenção hoje": cada cartão diz o motivo e a regra.', 'Use "Ligar" (simulado), "Ver ficha" ou "Marcar como visto".', 'Abra "Como o estado é calculado" para ver as regras.', 'Toque num paciente da lista para abrir a ficha (no iPad e no computador, ela abre ao lado).', 'O "?" no topo mostra de novo o tutorial.'],
      dados: ['Estado de cada paciente: calculado dos registros, pela regra.', 'Agenda: da recepção.', 'Peso e dias com registro: do app.'],
      outroLado: 'Um sintoma de alerta ou 3 dias sem registro no app colocam o paciente aqui na hora.',
      porque: 'A equipe começa pelo que importa, sem abrir paciente por paciente.',
      itens: [39, 40, 51], palavras: 'triagem atenção alerta pacientes lista estado agenda hoje tutorial ajuda',
      elementos: [e('botão', '?', 'Mostra de novo o tutorial do primeiro acesso.'), e('cartão', 'Indicadores', 'No app, Registros (média de dias), Pedem atenção.'), e('cartão', 'Precisa da sua atenção hoje', 'Motivo, regra e ações.'), e('botão', 'Ligar', 'Simulado, sem número.'), e('botão', 'Ver ficha', 'Abre a ficha.'), e('botão', 'Marcar como visto', 'Tira da triagem; o estado continua.'),
        e('cartão', 'Agenda de hoje', 'Hora, paciente, tipo e modo.'), e('lista', 'Pacientes da semana', 'Peso, variação, dias com registro e estado.'), e('aviso', 'Como o estado é calculado', 'As regras.')],
      estados: [s('vazio', 'Triagem vazia: "Tudo visto por hoje".')] },
    { tela: 'ficha', titulo: 'Ficha do paciente', para: 'Médico e equipe',
      oque: 'Tudo de um paciente: o estado com o porquê, o dia de hoje até agora, a semana, o tratamento (metas, prescrição, aplicação, consulta), a evolução do peso e a linha do tempo por dia.',
      passos: ['Abra pela triagem ("Ver ficha") ou pela lista.', 'Leia o estado e o porquê.', 'Toque em "Editar metas": a folha abre ao lado; salve e o app muda.', 'Desça até a linha do tempo para ver cada registro, com a origem.'],
      dados: ['Registros do app (paciente), medidas da clínica, metas (nutricionista ou médico), prescrição (médico e enfermagem), agenda (recepção).'],
      outroLado: 'Metas salvas aqui mudam os anéis do app. Tudo o que o paciente registra aparece aqui.',
      porque: 'Decidir com o quadro inteiro, sabendo de onde veio cada número.',
      itens: [41, 42, 43], palavras: 'ficha paciente linha do tempo evolução metas editar tratamento',
      elementos: [e('cartão', 'Cabeçalho', 'Nome, fase, desde quando e o estado.'), e('aviso', 'Porquê', 'O motivo do estado.'), e('botão', 'Editar metas', 'Abre a folha lateral.'), e('folha', 'Metas de …', 'Calorias, proteína e água.'),
        e('cartão', 'Hoje, até agora', 'Consumo do dia contra a meta.'), e('cartão', 'Semana', 'Peso, última pesagem, registros, proteína média.'), e('cartão', 'Tratamento', 'Metas, prescrição, aplicação e próxima consulta.'), e('gráfico', 'Evolução do peso', 'Com a faixa da meta e os pontos da clínica.'), e('lista', 'Ficha do app', 'Linha do tempo por dia.')],
      estados: [s('erro', 'Metas fora do plausível: "Confira as metas".')] },
    { tela: 'metas', titulo: 'Metas e plano', para: 'Nutricionista e médico', oque: 'As metas de calorias, proteína e água e o plano alimentar de cada paciente.',
      passos: ['Escolha o paciente.', 'Mude as metas e o plano.', 'Toque em "Enviar ao app".'], dados: ['Metas atuais, com quem definiu e quando.'],
      outroLado: 'O app mostra as metas novas na tela Hoje, com "definidas por … hoje".', porque: 'Metas da equipe chegam ao paciente sem retrabalho.', itens: [43], palavras: 'metas plano alimentar calorias proteína água nutricionista',
      elementos: [e('campo', 'Paciente', ''), e('campo', 'Calorias, Proteína, Água', 'Números inteiros.'), e('campo', 'Plano alimentar', ''), e('botão', 'Enviar ao app', ''), e('cartão', 'Como aparece no app', '')], estados: [s('erro', 'Metas fora do plausível: "Confira as metas".')] },
    { tela: 'aplicacoes', titulo: 'Aplicações (prescrições)', para: 'Médico e enfermagem', oque: 'As prescrições cadastradas e a conferência da enfermagem antes de aparecer no app. Nenhum número de dose na demonstração.',
      passos: ['Veja as prescrições esperando a conferência.', 'Toque em "Conferir".', 'Para cadastrar, escolha o paciente e toque em "Cadastrar prescrição" (os campos ficam travados na demonstração).'],
      dados: ['Prescrições cadastradas pela equipe.'], outroLado: 'Conferida, a prescrição aparece no app como "conferida pela enfermeira … hoje".', porque: 'Dupla checagem antes de chegar ao paciente.', itens: [44], palavras: 'prescrição conferir enfermagem aplicação cadastrar',
      elementos: [e('lista', 'Prescrições', 'Paciente, tipo, quando e o estado.'), e('botão', 'Conferir', ''), e('campo', 'Cadastrar prescrição', 'Paciente e campos travados.')], estados: [s('pronto', '"Conferida hoje, às …".')] },
    { tela: 'avisos', titulo: 'Avisos e conteúdo', para: 'Recepção e equipe', oque: 'Recados para um paciente, um grupo ou todos, e o conteúdo da clínica.',
      passos: ['Escolha para quem.', 'Escreva o recado.', 'Toque em "Enviar recado".'], dados: ['Recados enviados e o conteúdo da clínica.'],
      outroLado: 'O recado aparece no app de quem é do grupo (Hoje e Avisos).', porque: 'Comunicação em massa sem lista de transmissão.', itens: [45], palavras: 'recado aviso mensagem grupo todos conteúdo',
      elementos: [e('campo', 'Para quem?', 'Um paciente, um grupo ou todos.'), e('campo', 'Recado', ''), e('botão', 'Enviar recado', ''), e('lista', 'Recados enviados', ''), e('lista', 'Conteúdo da clínica', '')], estados: [s('erro', 'Sem texto: "Escreva o recado".')] },
    { tela: 'funcoes', titulo: 'Funções do app', para: 'Clínica', oque: 'Liga e desliga cada parte do app.',
      passos: ['Toque no interruptor da função.'], dados: ['As funções ligadas.'], outroLado: 'Desligada, a parte some do app na hora (blocos, abas e atalhos).', porque: 'Cada clínica usa o que faz sentido para ela.', itens: [46], palavras: 'funções ligar desligar módulos app',
      elementos: [e('interruptor', 'Cada função', '')], estados: [] }
  ];

  // Regras que aparecem nas telas (as mesmas de comum/dados.js).
  const REGRAS = [
    { nome: 'Estado do paciente', texto: 'Alerta: sintoma marcado pela clínica (enjoo forte) nas últimas 48 h, ou nenhum registro há 3 dias ou mais. Atenção: proteína abaixo de 70% da meta nos 3 dias anteriores, intestino "preso" 3 dias seguidos, ou registros em 4 dias ou menos dos 7 anteriores. Em dia: nenhuma das anteriores.', onde: 'central' },
    { nome: 'Registros (adesão)', texto: 'Dias com pelo menos um registro no app, nos 7 dias anteriores a hoje (n de 7).', onde: 'central' },
    { nome: 'Pontos do dia', texto: 'Refeição 5, cada copo de água 2, cada outro registro 5, cada remédio 2 (até 100). Só no app.', onde: 'app' },
    { nome: 'Metas', texto: 'Definidas pela nutricionista (ou pelo médico na central), com quem e quando; o app mostra a origem.', onde: 'app' }
  ];

  // Fluxogramas: etapas na ordem; lado = app | central | regra | pessoa. "tela" leva ao lugar da etapa.
  const FLUXOS = [
    { id: 'registro', titulo: 'Do registro à ação', resumo: 'O que o paciente registra vira estado e, se for o caso, ação da equipe.', etapas: [
      { lado: 'app', texto: 'O paciente registra (refeição, água, sono, aplicação…)', parte: 'app', tela: 'registrar' },
      { lado: 'central', texto: 'Entra na ficha: linha do tempo e "Hoje, até agora"', parte: 'central', tela: 'ficha' },
      { lado: 'regra', texto: 'A regra recalcula o estado: Em dia, Atenção ou Alerta', parte: 'central', tela: 'hoje', seta: 'na hora' },
      { lado: 'central', texto: 'Atenção ou Alerta: aparece em "Precisa da sua atenção hoje", com o porquê', parte: 'central', tela: 'hoje', seta: 'se a regra disparar' },
      { lado: 'pessoa', texto: 'A equipe age: liga, abre a ficha ou marca como visto', parte: 'central', tela: 'hoje' }] },
    { id: 'aplicacao', titulo: 'Aplicação', resumo: 'Da prescrição ao alerta, com a dupla checagem.', etapas: [
      { lado: 'central', texto: 'O médico cadastra a prescrição (sem dose na demonstração)', parte: 'central', tela: 'aplicacoes' },
      { lado: 'pessoa', texto: 'A enfermagem confere', parte: 'central', tela: 'aplicacoes', seta: 'antes de ir ao app' },
      { lado: 'app', texto: 'O app mostra a prescrição travada, com quem conferiu e quando', parte: 'app', tela: 'aplicacoes' },
      { lado: 'app', texto: 'O paciente registra a aplicação: local (rodízio) e como se sentiu', parte: 'app', tela: 'aplicacoes' },
      { lado: 'regra', texto: 'Sintoma marcado pela clínica (enjoo forte)?', parte: 'central', tela: 'hoje', seta: 'se sim' },
      { lado: 'central', texto: 'Alerta na triagem e aviso à enfermagem', parte: 'central', tela: 'hoje' },
      { lado: 'pessoa', texto: 'A enfermagem liga para o paciente', parte: 'central', tela: 'ficha' }] },
    { id: 'metas', titulo: 'Metas e plano', resumo: 'A meta da equipe vira o anel do paciente e volta como dado.', etapas: [
      { lado: 'central', texto: 'A nutricionista (ou o médico) define as metas e o plano', parte: 'central', tela: 'metas' },
      { lado: 'app', texto: 'O app mostra os anéis, com quem definiu e quando', parte: 'app', tela: 'inicio', seta: 'na hora' },
      { lado: 'app', texto: 'O paciente registra refeições e água', parte: 'app', tela: 'refeicao' },
      { lado: 'central', texto: 'A ficha mostra o consumo do dia contra a meta e a média da semana', parte: 'central', tela: 'ficha' },
      { lado: 'regra', texto: 'Proteína abaixo de 70% da meta 3 dias seguidos vira Atenção', parte: 'central', tela: 'hoje' }] },
    { id: 'consultas', titulo: 'Consultas e presença', resumo: 'A agenda é uma só para o app e a central.', etapas: [
      { lado: 'pessoa', texto: 'A recepção marca a consulta na agenda', parte: 'central', tela: 'hoje' },
      { lado: 'app', texto: 'O app mostra a próxima consulta e lembra na véspera', parte: 'app', tela: 'consultas' },
      { lado: 'app', texto: 'O paciente confirma a presença', parte: 'app', tela: 'consultas' },
      { lado: 'central', texto: 'A ficha mostra "presença confirmada"; no dia, a consulta entra em "Hoje: N consultas"', parte: 'central', tela: 'ficha' }] },
    { id: 'recados', titulo: 'Recados', resumo: 'Um recado da clínica chega a quem precisa.', etapas: [
      { lado: 'central', texto: 'A equipe escreve o recado e escolhe para quem', parte: 'central', tela: 'avisos' },
      { lado: 'app', texto: 'O recado aparece em Hoje e em Avisos, com quem mandou e quando', parte: 'app', tela: 'avisos', seta: 'na hora' },
      { lado: 'app', texto: 'O paciente marca como lido', parte: 'app', tela: 'avisos' }] }
  ];

  // Tutorial de primeiro acesso (balões). alvo: seletor dentro do produto; o primeiro que existir na tela.
  const TUTORIAL = {
    app: [
      { alvo: '.v-app .barra-app', titulo: 'O app da sua clínica', texto: 'Com o nome e a cor da clínica. O paciente entra pelo link, sem senha.' },
      { alvo: '.v-app .heroi', titulo: 'Metas do dia', texto: 'Calorias, proteína e água, com as metas da equipe. A frase diz o que falta.' },
      { alvo: '.v-app .heroi .botoes .botao', titulo: 'Registrar é rápido', texto: 'Uma folha sobe, o paciente escolhe e registra. O anel sobe na hora.' },
      { alvo: '.v-app .abas-app', titulo: 'As quatro abas', texto: 'Hoje, Registrar, Aplicações e Evolução. Tudo o que o paciente usa todo dia.' },
      { alvo: '.v-app .botao-perfil', titulo: 'Perfil e o resto', texto: 'Consultas, avisos, chat, equipe, conteúdo, exames e mais.' },
      { alvo: '.v-app .botao-ajuda', titulo: 'Ajuda quando quiser', texto: 'Este tutorial volta por aqui. O manual completo está em "Manual", na faixa de cima.' }],
    central: [
      { alvo: '.v-central .saudacao', titulo: 'O seu dia', texto: 'A data e as consultas de hoje, contadas da agenda.' },
      { alvo: '.v-central .triagem', titulo: 'Precisa da sua atenção hoje', texto: 'Quem precisa de atenção e por quê, com Ligar, Ver ficha e Marcar como visto.' },
      { alvo: '.v-central .regras', titulo: 'A regra é visível', texto: 'Em dia, Atenção e Alerta seguem regras claras. Toque para ver.' },
      { alvo: '.v-central .lista-pac .linha-pac', titulo: 'Pacientes', texto: 'Cada linha: peso, variação, dias com registro e o estado. Toque para abrir a ficha.' },
      { alvo: '.v-central .barra-abas', titulo: 'As partes da central', texto: 'Metas e plano, Aplicações, Avisos e conteúdo e Funções do app.' },
      { alvo: '.v-central .botao-ajuda', titulo: 'Ajuda quando quiser', texto: 'Este tutorial volta por aqui. O manual completo está em "Manual", na faixa de cima.' }]
  };

  window.DEMO_MANUAL = {
    partes: { app: { titulo: 'App do paciente', telas: APP }, central: { titulo: 'Central da equipe', telas: CENTRAL } },
    REGRAS, FLUXOS, TUTORIAL,
    // Busca simples (o manual e a ajuda do assistente usam a mesma): devolve as telas que mais combinam com a pergunta.
    // Só conta a tela que tem uma das palavras no título ou nas palavras-chave (o resto só desempata).
    buscar(texto, parte) {
      const sem = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const termos = sem(texto).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['como', 'para', 'que', 'uma', 'onde', 'qual', 'faco', 'fazer', 'meu', 'minha', 'esta', 'isso', 'tem'].includes(w));
      const lista = (parte ? [parte] : ['app', 'central']).flatMap(p => this.partes[p].telas.map(t => ({ ...t, parte: p })));
      return lista.map(t => {
        const base = sem([t.titulo, t.palavras, t.oque].join(' '));
        const forte = termos.filter(w => sem(t.palavras).includes(w) || sem(t.titulo).includes(w)).length;
        const pts = termos.reduce((n, w) => n + (sem(t.palavras).includes(w) ? 3 : 0) + (sem(t.titulo).includes(w) ? 2 : 0) + (base.includes(w) ? 1 : 0), 0);
        return { t, pts: forte ? pts : 0 };
      }).filter(x => x.pts > 0).sort((a, b) => b.pts - a.pts).map(x => x.t);
    }
  };
})();
