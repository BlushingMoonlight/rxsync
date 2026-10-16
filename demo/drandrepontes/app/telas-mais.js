/* App do paciente · telas que não estão nos prints (perfil, assistente, consultas, avisos, comunidade, conteúdo,
   primeiro acesso...). Continuam acessíveis pelo Início ("Mais no app"), pelo cabeçalho (perfil e avisos) e pelas outras telas,
   agora com o cabeçalho e o visual da AG Melhor Versão. */
(function () {
  'use strict';
  var P = window.APP, A = P.A, E = P.E, T = P.TELAS, br = P.br, cartao = P.cartao, ficha = P.ficha, linMenu = P.linMenu, esc = P.esc;
  var PACIENTE = P.PACIENTE, EQUIPE = P.EQUIPE;
  function escala(n, nomes, sel, acao, classe) {
    var h = '<div class="escala ' + (classe || '') + '" style="--n:' + n + '">';
    for (var i = 0; i < n; i++) h += '<button type="button" data-acao="' + acao + '" data-v="' + i + '" class="' + (sel === i ? 'sel' : '') + '">' + (nomes ? nomes[i] : i) + '</button>';
    return h + '</div>';
  }
  function opcoes(lista, acao, sel) {
    return '<div class="opcoes">' + lista.map(function (t, i) { return '<button type="button" data-acao="' + acao + '" data-v="' + i + '" class="' + ((sel || []).indexOf(i) >= 0 ? 'sel' : '') + '">' + t + '</button>'; }).join('') + '</div>';
  }
  function botaoSalvar(texto, msg) { return P.salvar(texto || 'Salvar registro', msg || 'Registrado. Obrigada!'); }
  function avatar(p, t) { return '<span class="avatar" style="background:' + p.cor + (t ? ';width:' + t + 'px;height:' + t + 'px' : '') + '">' + p.ini + '</span>'; }

  // ---------- peças das telas ----------
  function meta(nome, v, alvo, u, cor) {
    return '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><b>' + nome + '</b><span class="num mudo">' + br(v) + ' / ' + br(alvo) + ' ' + u + '</span></div>' +
      '<div class="barra" style="--cor:' + cor + '"><i style="width:' + Math.min(100, Math.round(v / alvo * 100)) + '%"></i></div></div>';
  }
  function campoNum(rotulo, v) { return '<label style="display:grid;gap:4px"><span class="rotulo">' + rotulo + '</span><input class="campo num" inputmode="decimal" value="' + v + '"></label>'; }
  function tomar(nome, quando, feito) {
    return '<div class="lin-menu">' + A.bolha('pilula', 'var(--c3)') + '<span class="meio"><b>' + nome + '</b><small>' + quando + '</small></span><button type="button" class="chip" data-acao="tomei" style="' + (feito ? 'color:var(--ok)' : '') + '">' + (feito ? '✓ tomei' : 'tomei') + '</button></div>';
  }
  function habito(t, quem, feito) {
    return '<div class="lin-menu">' + A.bolha('trofeu', feito ? 'var(--ok)' : 'var(--texto-3)') + '<span class="meio"><b>' + t + '</b><small>pedido por ' + quem + '</small></span><button type="button" class="chave' + (feito ? ' on' : '') + '" data-acao="chave"></button></div>';
  }
  function doc(t, s) { return '<div class="lin-menu">' + A.bolha('documento', 'var(--c3)') + '<span class="meio"><b>' + t + '</b><small>' + s + '</small></span>' + A.ic('download', 'fraco') + '</div>'; }
  function grupo(t, l) {
    return '<div><span class="rotulo" style="display:block;margin:4px 4px 8px">' + t + '</span><div class="cartao lista-menu" style="padding:4px 16px">' +
      l.map(function (x) { return linMenu(x[0], x[1], x[2], x[3], x[4], x[5]); }).join('') + '</div></div>';
  }

  T.alimento = function () {
    var g = E.porcao, f = g / 170;
    return P.cab('alimento', 'Iogurte natural integral', 'Confira antes de somar ao dia.', A.item([108, 109, 110, 111])) +
      cartao('<div class="linha-ic">' + A.bolha('barras', 'var(--c3)') + '<div class="meio"><b>Lido pelo código de barras</b><div class="fraco" style="font-size:12px">7890000000000 · produto de exemplo</div></div></div>') +
      cartao('<div class="cartao-titulo"><h3>O que tem</h3>' + A.item(109) + '</div>' +
        '<table class="tabela"><tr><td>Calorias</td><td>' + br(110 * f) + ' kcal</td></tr><tr><td>Proteínas</td><td>' + br(6.8 * f, 1) + ' g</td></tr>' +
        '<tr><td>Carboidratos</td><td>' + br(8.2 * f, 1) + ' g</td></tr><tr><td>Gorduras</td><td>' + br(5.4 * f, 1) + ' g</td></tr><tr><td>Fibras</td><td>0 g</td></tr></table>') +
      cartao('<div class="cartao-titulo"><h3>Quanto você comeu</h3>' + A.item(110) + '</div>' +
        opcoes(['Pote inteiro (170 g)', 'Meio pote', '100 g', '250 g'], 'porcao', [{ 170: 0, 85: 1, 100: 2, 250: 3 }[g]])) +
      '<button class="botao botao-cheio" type="button" data-acao="somar">Aceitar e somar ao dia</button>' +
      '<p class="nota-ficha">' + A.item(111) + ' Os valores entram no seu dia e no seu perfil.</p>';
  };

  T.sintomas = function () {
    return P.cab('sintomas', 'Sintomas e efeitos', 'Conte como se sentiu depois da aplicação.', A.item([128, 129])) +
      cartao('<div class="cartao-titulo"><h3>O que você está sentindo?</h3></div>' + opcoes(['Náusea', 'Enjoo', 'Vômito', 'Intestino preso', 'Diarreia', 'Azia', 'Tontura', 'Dor no local', 'Cansaço'], 'marca', [0])) +
      cartao('<div class="cartao-titulo"><h3>Intensidade</h3></div>' + escala(3, ['Leve', 'Média', 'Forte'], 1, 'marca')) +
      cartao('<div class="linha-ic">' + A.bolha('alerta', 'var(--alerta)') + '<p class="meio" style="font-size:13.5px">Sintomas marcados pela clínica como importantes <b>avisam a enfermagem na hora</b> ' + A.item(129) + '.</p></div>') +
      '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="Registrado. A Thaís (enfermagem) foi avisada.">Registrar e avisar a equipe</button>' +
      '<p class="fraco" style="font-size:12px;text-align:center">O app não avalia sintomas. Em caso de urgência, ligue 192.</p>' + ficha();
  };

  T.ciclo = function () {
    var d = '';
    for (var i = 1; i <= 28; i++) d += '<span style="display:grid;place-items:center;height:30px;border-radius:9px;font-size:12px;font-weight:600;' + (i <= 5 ? 'background:color-mix(in srgb,var(--c6) 22%,transparent);color:var(--c6)' : (i >= 12 && i <= 16 ? 'background:color-mix(in srgb,var(--c3) 16%,transparent)' : 'background:var(--superficie-2)')) + (i === 9 ? ';outline:2px solid var(--primaria)' : '') + '">' + i + '</span>';
    return P.cab('ciclo', 'Ciclo menstrual', 'Quando se aplica a você.', A.item(154)) +
      cartao('<span class="rotulo">Dia 9 do ciclo</span><h2 style="font-size:22px;margin:4px 0">Próxima menstruação em ~19 dias</h2><p class="mudo" style="font-size:13px">Estimativa a partir dos seus registros. Não é método contraceptivo.</p>') +
      cartao('<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">' + d + '</div>' +
        '<div style="display:flex;gap:14px;margin-top:10px;font-size:12px" class="mudo"><span><span class="ponto" style="background:var(--c6)"></span> menstruação</span><span><span class="ponto" style="background:var(--c3)"></span> período fértil estimado</span></div>') +
      cartao('<div class="cartao-titulo"><h3>Hoje</h3></div>' + opcoes(['Sem sintomas', 'Cólica', 'Inchaço', 'Mais fome', 'Irritação'], 'marca', [0])) + botaoSalvar() + ficha();
  };

  T.ia = function () {
    if (!E.chat) E.chat = [['ela', 'Oi, Mariana! Sou a assistente da AG Melhor Versão. Respondo com base nas orientações do Dr. André e da equipe. Não faço diagnóstico nem mudo seu tratamento. Como posso ajudar?']];
    return P.cab('ia', 'Assistente da clínica', 'Dúvidas do dia a dia, com base nas orientações da equipe.', A.item([143, 144]) + A.item([163, 164]) + A.juridico()) +
      '<div class="canal" role="group" style="justify-self:start"><button type="button" class="ativo" data-acao="canal">No app</button><button type="button" data-acao="canal">No WhatsApp</button></div>' +
      '<div class="chat" id="chat">' + E.chat.map(function (m) { return '<div class="msg ' + m[0] + '">' + m[1] + (m[2] ? '<small>' + m[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="opcoes">' + ['Posso comer pão à noite?', 'Estou enjoada', 'Posso aumentar a dose?', 'Esqueci a picadinha'].map(function (t) { return '<button type="button" data-acao="perguntar" data-v="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
      '<div class="digitar"><input class="campo" id="pergunta" placeholder="Escreva sua dúvida" autocomplete="off"><button class="botao" type="button" data-acao="perguntar-campo" aria-label="Enviar">' + A.ic('enviar') + '</button></div>' +
      '<p class="fraco" style="font-size:11.5px;text-align:center">Respostas simuladas para a prévia. Tudo fica registrado na sua ficha ' + A.item(48) + '.</p>';
  };

  T.avisos = function () {
    var l = [['Dr. André', 'Lembrete: traga seus exames de sangue na consulta de {wl:u+5}, {d:u+5}.', 'hoje {h:-70}', 131], ['AG Melhor Versão', 'Nova receita no app: omelete de forno com legumes.', 'ontem', 133],
      ['Lembrete', 'Hora da água! Você está em 1,6 L de 2,5 L.', 'ontem 15:00', 132], ['Thaís (enfermagem)', '"Oi Mariana, tudo bem depois da aplicação?"', '{ws:-4} 10:22', 60]];
    return P.cab('avisos', 'Avisos', 'Recados da equipe e lembretes.', A.item([131, 132])) + l.map(function (a) {
      return cartao('<div class="linha-ic">' + A.bolha(a[3] === 132 ? 'relogio' : 'sino', 'var(--c3)') + '<div class="meio"><b>' + a[0] + '</b> <span class="fraco" style="font-size:12px">' + a[2] + '</span><p class="mudo" style="font-size:13.5px">' + a[1] + '</p></div>' + A.item(a[3]) + '</div>');
    }).join('');
  };

  T.consultas = function () {
    var slots = ['{Ws:u+5}, {d:u+5} · 09:30', '{Ws:u+6}, {d:u+6} · 14:00', '{Ws:u+7}, {d:u+7} · 10:30', '{Ws:u+8}, {d:u+8} · 08:30'];
    return P.cab('consultas', 'Minhas consultas', 'Agende, confirme ou remarque.', A.item(130) + A.item(158)) +
      cartao('<span class="rotulo">Próxima</span><h2 style="font-size:21px;margin:4px 0">' + E.consulta + '</h2><p class="mudo">Retorno com o Dr. André · presencial · AG Melhor Versão</p>' +
        '<div class="acoes" style="margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="Presença confirmada. Até lá!">Confirmar presença</button><button class="botao botao-claro" type="button" data-acao="remarcar">Remarcar</button></div>' +
        '<div id="slots" class="' + (E.slot === 'abrir' ? '' : 'oculto') + '" style="margin-top:12px"><span class="rotulo">Horários livres do Dr. André</span>' +
        '<div class="opcoes" style="margin-top:6px">' + slots.map(function (s) { return '<button type="button" data-acao="slot" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div></div>') +
      cartao('<div class="cartao-titulo"><h3>Marcar outra</h3></div>' + opcoes(['Nutrição · Felipe', 'Psicologia · Maria Clara', 'Aplicação · enfermagem', 'Bioimpedância'], 'marca', []) +
        '<button class="botao botao-claro botao-cheio" type="button" style="margin-top:12px" data-acao="aviso" data-msg="Pedido enviado. A clínica confirma pelo WhatsApp.">Ver horários</button>') +
      cartao('<div class="cartao-titulo"><h3>Anteriores</h3></div><table class="tabela"><tr><td>Retorno · Dr. André</td><td>{d:-21}</td></tr><tr><td>Nutrição · Felipe</td><td>{d:-28}</td></tr><tr><td>Primeira consulta · Dr. André</td><td>{d:-42}</td></tr></table>');
  };

  T.comunidade = function () {
    return P.cab('comunidade', 'Comunidade', 'Desafios e conquistas do grupo.', A.item([139, 140])) +
      cartao('<div class="cartao-titulo"><h3>Desafio do grupo: 10 mil passos</h3>' + A.item(140) + '</div><table class="tabela"><tr><td>1 · Rafa P.</td><td>61.200</td></tr><tr><td>2 · Lu S.</td><td>58.900</td></tr><tr><td>3 · Você</td><td>44.940</td></tr><tr><td>4 · Bia N.</td><td>39.010</td></tr></table>') +
      ['Lu S. completou 14 dias seguidos registrando', 'Rafa P. bateu a meta de proteína a semana toda', 'Bia N. ganhou o selo "Hidratada"'].map(function (t, i) {
        return cartao('<div class="linha-ic"><span class="avatar" style="background:var(--c' + (i + 1) + ')">' + t.slice(0, 1) + t.split(' ')[1].slice(0, 1) + '</span><div class="meio">' + t + '<div class="fraco" style="font-size:12px">❤ ' + (12 - i * 3) + ' · 💬 ' + (4 - i) + '</div></div></div>');
      }).join('') + '<p class="fraco" style="font-size:12px;text-align:center">Você aparece com apelido. Dados de saúde só com a sua autorização.</p>';
  };

  T.conquistas = function () {
    var s = [['Primeira semana', 1], ['Hidratada', 1], ['7 dias seguidos', 1], ['Proteína em dia', 0], ['30 dias', 0], ['−5 kg', 1]];
    return P.cab('conquistas', 'Metas e conquistas', 'Sua sequência e as metas da semana.', A.item([137, 138])) +
      cartao('<div style="display:flex;align-items:center;gap:16px">' + A.anel({ tamanho: 86, espessura: 8, valor: 9 / 14, cor: 'var(--c2)', centro: '<div class="num" style="font-size:22px;font-weight:700">9</div>' }) +
        '<div><span class="rotulo">Sequência</span><h3>9 dias seguidos registrando</h3><p class="mudo" style="font-size:13px">Recorde: 14 dias</p></div></div>') +
      cartao('<div class="cartao-titulo"><h3>Metas da semana</h3>' + A.item(137) + '</div>' + meta('Registrar o almoço', 4, 7, 'dias', 'var(--c1)') + '<div style="height:10px"></div>' + meta('Caminhar 30 min', 3, 5, 'vezes', 'var(--c5)')) +
      '<div class="fotos">' + s.map(function (x) { return '<div class="foto" style="aspect-ratio:1;' + (x[1] ? '' : 'opacity:.45') + '">' + A.bolha('trofeu', x[1] ? 'var(--c2)' : 'var(--texto-3)') + '<span style="padding:0 6px">' + x[0] + '</span></div>'; }).join('') + '</div>';
  };

  T.fotos = function () {
    return P.cab('fotos', 'Fotos de progresso', 'Privadas: só você e o médico.', A.item(122)) +
      cartao('<div class="linha-ic">' + A.bolha('cadeado', 'var(--c4)') + '<p class="meio" style="font-size:13.5px">Privadas. Só você e o Dr. André veem. Ficam fora da galeria do celular.</p></div>') +
      '<div class="fotos">' + ['{d:-42} · frente', '{d:-42} · lado', '{d:-42} · costas', '{d:0} · frente', '{d:0} · lado', '+ Nova'].map(function (t) { return '<div class="foto">' + (t === '+ Nova' ? A.ic('camera') : A.ic('perfil')) + '<span>' + t + '</span></div>'; }).join('') + '</div>';
  };

  T.documentos = function () {
    return P.cab('documentos', 'Relatórios e exames', 'PDFs da ficha e seus exames.', A.item([121, 136])) +
      cartao('<div class="cartao-titulo"><h3>Da clínica</h3>' + A.item(121) + '</div><div class="lista-menu" style="padding:0">' +
        doc('Ficha da consulta · {d:-21}', 'PDF com a balança anexada') + doc('Plano alimentar · Felipe', 'PDF · válido até {d:+28}') + doc('Receita · Dr. André', 'PDF assinado') + '</div>') +
      cartao('<div class="cartao-titulo"><h3>Meus exames</h3>' + A.item(136) + '</div><div class="lista-menu" style="padding:0">' + doc('Hemograma · {d:-8}', 'enviado por você') + '</div>' +
        '<div class="acoes" style="margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="Exame enviado para a sua ficha.">' + A.ic('camera') + 'Fotografar exame</button><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="PDF enviado para a sua ficha.">Enviar PDF</button></div>');
  };

  T.chat = function () {
    if (!E.chatEquipe) E.chatEquipe = [['eu', 'Thaís, tive um pouco de enjoo ontem depois da aplicação. É normal?', '{ws:-4} 09:40'],
      ['ela', '<blockquote>Thaís, tive um pouco de enjoo ontem depois da aplicação. É normal?</blockquote>"Oi Mariana! Pode acontecer nos primeiros dias. Coma devagar, em porções menores, e me avise se piorar ou se vomitar."<small>Thaís · enfermagem · enviado pela clínica, sem alteração</small>', 'seg 10:22']];
    return P.cab('chat', 'Equipe da clínica', 'A resposta chega citada, entre aspas e sem alteração.', A.item([58, 59, 60]) + A.item(157)) +
      '<p class="fraco" style="font-size:12px">A IA encaminha para a pessoa certa. A resposta chega citada, entre aspas e sem alteração.</p>' +
      '<div class="chat">' + E.chatEquipe.map(function (m) { return '<div class="msg ' + m[0] + '">' + m[1] + (m[0] === 'eu' && m[2] ? '<small>' + m[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="digitar"><input class="campo" id="msg-equipe" placeholder="Escreva para a equipe" autocomplete="off"><button class="botao" type="button" data-acao="enviar-equipe" aria-label="Enviar">' + A.ic('enviar') + '</button></div>';
  };

  T.perfil = function () {
    return P.topoApp('inicio') + '<div class="titulo-bloco"><h1 class="titulo-pagina">Meu perfil</h1><p class="subtitulo">Sua conta, metas e privacidade</p></div>' +
      cartao('<div class="linha-ic">' + A.ilu('avatar', 60) +
        '<div class="meio"><h3 style="font-size:18px">' + PACIENTE.completo + '</h3><div class="fraco" style="font-size:12.5px">' + PACIENTE.id + ' · paciente desde {a:-42}</div><div style="margin-top:6px"><span class="chip" style="padding:4px 9px">' + PACIENTE.fase + '</span></div></div></div>' +
        '<p class="fraco" style="font-size:12px;margin-top:10px">' + A.ic('escudo') + ' Tudo sincronizado. O app funciona sem internet e envia quando o sinal volta ' + A.item(100) + '</p>') +
      grupo('Saúde', [
        ['corpo', 'perfil', 'var(--c1)', 'Perfil corporal', 'altura, biotipo, objetivo', A.item(96)],
        ['metas', 'trofeu', 'var(--c2)', 'Metas e hábitos da equipe', 'o que a clínica pediu para você', A.item(112) + A.item(161)],
        ['conquistas', 'trofeu', 'var(--c5)', 'Conquistas e sequência', '9 dias seguidos', A.item([137, 138])],
        ['documentos', 'documento', 'var(--c3)', 'Relatórios e exames', '', A.item([121, 136])],
        ['fotos', 'camera', 'var(--c4)', 'Fotos de progresso', 'privadas', A.item(122)]]) +
      grupo('App', [
        ['lembretes', 'relogio', 'var(--c3)', 'Lembretes', 'água, remédios, picadinha, registros', A.item(132) + A.item(160)],
        ['integracoes', 'link', 'var(--c1)', 'Apple Saúde, Google e balança', 'passos, sono e peso', A.item(162) + A.item(119)],
        ['acessibilidade', 'letra', 'var(--c4)', 'Letra grande e modo escuro', '', A.item(105)],
        ['pagamentos', 'cartao', 'var(--c5)', 'Pagamentos', 'Pix e cartão', A.item(159)]]) +
      grupo('Privacidade e conta', [
        ['dados', 'cadeado', 'var(--c6)', 'Meus dados (LGPD)', 'baixar ou pedir exclusão', A.item(98)],
        ['consentimento', 'escudo', 'var(--c1)', 'Termo de uso e aviso de IA', 'aceito em {a:-42}', A.item(97)],
        ['tour', 'ia', 'var(--c2)', 'Rever o tutorial', '', A.item(99)],
        ['entrar', 'link', 'var(--c3)', 'Como se entra no app', 'link mágico, sem senha', A.item([92, 93, 95])]]) +
      '<div style="display:grid;gap:8px;justify-items:center;padding:4px 0"><div class="lojas"><span class="chip">' + A.item(141) + ' App Store · em breve</span><span class="chip">' + A.item(142) + ' Google Play · em breve</span></div>' +
      '<div class="fraco" style="font-size:11.5px">Hoje: instale pelo Safari › Compartilhar › Adicionar à Tela de Início ' + A.item(94) + '</div></div>';
  };

  T.corpo = function () {
    return P.cab('corpo', 'Perfil corporal', 'Seus dados de partida.', A.item(96)) +
      cartao('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + campoNum('Altura (cm)', '165') + campoNum('Peso inicial (kg)', '84,0') + campoNum('Cintura inicial (cm)', '94') + campoNum('Idade', '41') + '</div>') +
      cartao('<div class="cartao-titulo"><h3>Biotipo</h3></div>' + opcoes(['Ectomorfo', 'Mesomorfo', 'Endomorfo'], 'marca', [2])) +
      cartao('<div class="cartao-titulo"><h3>Objetivo</h3></div>' + opcoes(['Perder peso', 'Ganhar massa', 'Manter', 'Saúde em geral'], 'marca', [0])) +
      cartao('<div class="cartao-titulo"><h3>Fase do acompanhamento</h3>' + A.item(155) + '</div>' + opcoes(['1 · Início', '2 · Perda de peso', '3 · Desmame', '4 · Manutenção'], 'marca', [1]) +
        '<p class="fraco" style="font-size:12px;margin-top:8px">Definida pelo Dr. André. Muda o que o app pede e lembra.</p>') + botaoSalvar('Salvar');
  };

  T.metas = function () {
    return P.cab('metas', 'Metas e hábitos', 'O que a equipe combinou com você.', A.item(112) + A.item(161)) +
      cartao('<div class="cartao-titulo"><h3>Metas do dia</h3>' + A.item(112) + '</div>' + meta('Calorias', E.kcal, 1600, 'kcal', 'var(--c2)') + '<div style="height:10px"></div>' + meta('Proteína', E.prot, 110, 'g', 'var(--c1)') + '<div style="height:10px"></div>' + meta('Água', E.agua, 2500, 'ml', 'var(--c3)')) +
      cartao('<div class="cartao-titulo"><h3>Hábitos pedidos pela equipe</h3></div><div class="lista-menu" style="padding:0">' +
        habito('Caminhar 30 min, 5 vezes por semana', 'Dr. André', true) + habito('Proteína em todas as refeições', 'Felipe', true) + habito('Respirar 5 min antes de dormir', 'Maria Clara', false) + habito('Dormir antes das 23h30', 'Dr. André', false) + '</div>');
  };

  T.lembretes = function () {
    var l = [['Água', 'a cada 2 h, das 8h às 20h', 1], ['Remédios', 'na hora de cada um', 1], ['Picadinha', 'quinta 07:00 e 08:00', 1], ['Registrar refeições', '12:30 e 20:00', 1], ['Humor', '21:00', 0], ['Consulta', '1 dia antes', 1]];
    return P.cab('lembretes', 'Lembretes', 'Você liga e desliga quando quiser.', A.item(132) + A.item(160)) + cartao('<div class="lista-menu" style="padding:0">' + l.map(function (x) {
      return '<div class="lin-menu">' + A.bolha('relogio', 'var(--c3)') + '<span class="meio"><b>' + x[0] + '</b><small>' + x[1] + '</small></span><button type="button" class="chave' + (x[2] ? ' on' : '') + '" data-acao="chave" aria-label="Ligar ou desligar"></button></div>';
    }).join('') + '</div>');
  };

  T.integracoes = function () {
    return P.cab('integracoes', 'Apple Saúde, Google e balança', 'Passos e sono entram sozinhos, com a sua autorização.', A.item(162) + A.item(119)) +
      cartao('<div class="lista-menu" style="padding:0">' +
        '<div class="lin-menu">' + A.bolha('atividade', 'var(--c6)') + '<span class="meio"><b>Apple Saúde</b><small>passos e sono · ligado</small></span><button type="button" class="chave on" data-acao="chave"></button></div>' +
        '<div class="lin-menu">' + A.bolha('globo', 'var(--c3)') + '<span class="meio"><b>Google (Health Connect)</b><small>para Android</small></span><button type="button" class="chave" data-acao="chave"></button></div>' +
        '<div class="lin-menu">' + A.bolha('balanca', 'var(--c1)') + '<span class="meio"><b>Balança Anovator da clínica</b><small>o peso entra sozinho a cada consulta</small></span>' + A.item(119) + '</div></div>') +
      '<p class="fraco" style="font-size:12px;text-align:center">Você escolhe o que compartilhar e pode desligar quando quiser.</p>';
  };

  T.acessibilidade = function () {
    var escuro = A.estilo() === 'clean-escuro';
    return P.cab('acessibilidade', 'Letra grande e modo escuro', 'Para ler com conforto.', A.item(105)) +
      cartao('<div class="lista-menu" style="padding:0">' +
        '<div class="lin-menu">' + A.bolha('letra', 'var(--c4)') + '<span class="meio"><b>Letra grande</b><small>aumenta o texto do app todo</small></span><button type="button" class="chave' + (E.letra ? ' on' : '') + '" data-acao="letra"></button></div>' +
        '<div class="lin-menu">' + A.bolha('sono', 'var(--c3)') + '<span class="meio"><b>Modo escuro</b><small>mais confortável à noite</small></span><button type="button" class="chave' + (escuro ? ' on' : '') + '" data-acao="escuro"></button></div></div>') +
      cartao('<span class="rotulo">Exemplo</span><p style="margin-top:6px">Olá, Mariana! Este é o tamanho do texto com a opção escolhida.</p>');
  };

  T.pagamentos = function () {
    return P.cab('pagamentos', 'Pagamentos', 'Pix e cartão.', A.item(159) + A.item(87)) +
      cartao('<span class="rotulo">Em aberto</span><h2 style="font-size:24px;margin:4px 0" class="num">R$ 650,00</h2><p class="mudo">Programa trimestral · parcela 2 de 3 · vence {d:+7} (valores de exemplo)</p>' +
        '<div class="acoes" style="margin-top:12px"><button class="botao" type="button" data-acao="aviso" data-msg="Pix copia e cola copiado (exemplo).">Pagar com Pix</button><button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Abre o pagamento com cartão (exemplo).">' + A.ic('cartao') + 'Cartão</button></div>', 'cartao-destaque') +
      cartao('<div class="cartao-titulo"><h3>Pagos</h3></div><table class="tabela"><tr><td>Parcela 1 de 3 · Pix</td><td>R$ 650,00</td></tr><tr><td>Consulta inicial · cartão</td><td>R$ 450,00</td></tr></table>') +
      '<p class="fraco" style="font-size:12px;text-align:center">Recibos no e-mail. Dúvidas: Emanuele (financeiro).</p>';
  };

  T.dados = function () {
    return P.cab('dados', 'Meus dados (LGPD)', 'Seus dados são seus.', A.item(98)) +
      cartao('<p style="font-size:14px">Seus dados são seus. Você pode baixar uma cópia de tudo o que registrou ou pedir a exclusão da conta.</p>') +
      '<button class="botao botao-cheio" type="button" data-acao="aviso" data-msg="Pedido registrado. O arquivo chega no seu e-mail (exemplo).">' + A.ic('download') + 'Baixar meus dados</button>' +
      '<button class="botao botao-claro botao-cheio" type="button" data-acao="aviso" data-msg="Pedido de exclusão enviado à clínica (exemplo).">Pedir exclusão da conta</button>' +
      '<p class="fraco" style="font-size:12px;text-align:center">Alguns dados da ficha a clínica precisa guardar por lei; nesse caso, ela explica o motivo e o prazo.</p>';
  };

  T.entrar = function () {
    return '<div class="entrar">' + A.logo({ tamanho: 96 }) +
      '<div><h1 style="font-size:24px">Bem-vinda à AG Melhor Versão</h1><p class="mudo" style="margin-top:6px">Sua conta foi criada quando você agendou. Não precisa de cadastro nem de senha.</p></div>' +
      '<div class="cartao" style="width:100%;text-align:left"><div class="linha-ic">' + A.bolha('whatsapp', 'var(--c1)') + '<div class="meio"><b>Link de acesso</b><div class="fraco" style="font-size:12.5px">enviado ao seu WhatsApp (11) 9····-··77</div></div></div></div>' +
      '<a class="botao sem-sublinhado" href="#consentimento">Entrar pelo link</a>' +
      '<button class="botao botao-claro" type="button" data-acao="aviso" data-msg="Link enviado para o seu e-mail (exemplo).">Receber por e-mail</button>' +
      '<div class="itens" style="justify-content:center">' + A.item(92) + A.item(93) + A.item(95) + '</div></div>';
  };

  T.consentimento = function () {
    var c = E.check;
    return '<div class="entrar" style="text-align:left;justify-items:stretch">' + '<div class="passos"><i></i><i class="at"></i><i></i></div>' +
      '<h1 style="font-size:22px;text-align:center">Antes de começar</h1>' +
      '<div class="cartao" style="display:grid;gap:12px">' +
        '<button type="button" class="check' + (c[0] ? ' on' : '') + '" data-acao="check" data-v="0"><i></i><span>Li e aceito o <b>termo de uso</b> e a <b>política de privacidade</b> da AG Melhor Versão.</span></button>' +
        '<button type="button" class="check' + (c[1] ? ' on' : '') + '" data-acao="check" data-v="1"><i></i><span>Entendi que a assistente do app é uma <b>inteligência artificial</b>: ela não faz diagnóstico, não prescreve e chama a equipe quando precisa.</span></button>' +
        '<button type="button" class="check' + (c[2] ? ' on' : '') + '" data-acao="check" data-v="2"><i></i><span>Autorizo o uso dos meus registros pela equipe que cuida de mim.</span></button>' +
      '</div>' +
      '<a class="botao sem-sublinhado" href="#tour"' + (c[0] && c[1] && c[2] ? '' : ' style="opacity:.45;pointer-events:none"') + '>Aceitar e continuar</a>' +
      '<p class="fraco" style="font-size:12px;text-align:center">O aceite fica registrado com data e hora. ' + A.item(97) + '</p></div>';
  };

  T.tour = function () {
    return '<div class="entrar">' + '<div class="passos"><i></i><i></i><i class="at"></i></div>' +
      A.bolha('ia', 'var(--primaria)') + '<h1 style="font-size:22px">Seu acompanhamento num só lugar</h1>' +
      '<div class="cartao" style="display:grid;gap:12px;text-align:left;width:100%">' +
        '<div class="linha-ic">' + A.bolha('prato', 'var(--c2)') + '<span class="meio">Registre refeições com uma foto</span></div>' +
        '<div class="linha-ic">' + A.bolha('seringa', 'var(--c1)') + '<span class="meio">Veja a picadinha conferida pela clínica</span></div>' +
        '<div class="linha-ic">' + A.bolha('chat', 'var(--c3)') + '<span class="meio">Fale com a equipe e tire dúvidas</span></div>' +
        '<div class="linha-ic">' + A.bolha('evolucao', 'var(--c4)') + '<span class="meio">Acompanhe sua evolução</span></div>' +
      '</div><a class="botao sem-sublinhado" href="#inicio">Começar</a>' + '<div>' + A.item(99) + '</div></div>';
  };
})();
