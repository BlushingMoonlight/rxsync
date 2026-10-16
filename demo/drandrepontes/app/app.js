/* App do paciente · núcleo. Cada tela é uma função em APP.TELAS e abre por #tela (ex.: #agua).
   As telas ficam em telas-dia.js, telas-registros.js, telas-evolucao.js e telas-mais.js.
   Visual: identidade da AG Melhor Versão (prints de referência do Dr. André).
   Dados de exemplo fictícios. A IA é simulada (respostas prontas): nunca diagnostica nem prescreve,
   e o app nunca calcula dose (dose, concentração e UI aparecem só como "Preenchida pela equipe"). */
(function () {
  'use strict';
  var A = window.AG;
  var PACIENTE = { nome: 'Mariana', completo: 'Mariana Lopes', id: 'P-DEMO7', fase: 'Fase 2 · Perda de peso' };
  // Equipe dos prints. "Solicitar contato" leva ao WhatsApp da clínica, pela área (nunca ao número pessoal de alguém).
  var EQUIPE = [
    { id: 'andre', nome: 'Doutor André Pontes Gonçalves', curto: 'Dr. André', papel: 'Médico', desc: 'Acompanhamento médico e evolução do tratamento', area: 'Atendimento médico', ini: 'AG', cor: 'var(--c1)' },
    { id: 'emanuele', nome: 'Emanuele', papel: 'Administrativo e financeiro', desc: 'Atendimento administrativo e assuntos financeiros', area: 'Administrativo e financeiro', ini: 'EM', cor: 'var(--c5)' },
    { id: 'felipe', nome: 'Felipe', papel: 'Nutricionista', desc: 'Plano alimentar e acompanhamento nutricional', area: 'Nutrição', ini: 'FE', cor: 'var(--c2)' },
    { id: 'mariaclara', nome: 'Maria Clara', papel: 'Psicóloga', desc: 'Apoio emocional e mudanças de hábitos', area: 'Psicologia', ini: 'MC', cor: 'var(--c6)' },
    { id: 'eduarda', nome: 'Eduarda', papel: 'Técnica de enfermagem', desc: 'Apoio nos procedimentos e cuidados do acompanhamento', area: 'Enfermagem', ini: 'ED', cor: 'var(--c4)' },
    { id: 'thais', nome: 'Thaís', papel: 'Enfermeira', desc: 'Orientações de enfermagem e acompanhamento dos cuidados', area: 'Enfermagem', ini: 'TH', cor: 'var(--c3)' },
    { id: 'elenice', nome: 'Elenice', papel: 'Concierge', desc: 'Acolhimento e cuidado com seu conforto durante a visita', area: 'Recepção', ini: 'EL', cor: 'var(--c1)', conhecer: true }
  ];
  var TODA_EQUIPE = [['Marketing', 'Jesse, Mi e Luiz'], ['Jurídico', 'Philipe'], ['Limpeza e cuidado com o ambiente', 'Claudia']];

  // Estado da demonstração (só na memória: recarregar volta ao começo).
  var E = {
    kcal: 1250, prot: 65, metaProt: 90, metaAgua: 4000, humor: 3, letra: false, porcao: 170, local: null, slot: null,
    consulta: '{Wl:u+5}, {d:u+5} · 09:30', chat: null, chatEquipe: null, check: [false, false, false], diaOff: 0, periodo: 2,
    esc: {}, multi: { emocoes: [0, 1] }, aberto: { mounjaro: true, b12: true, 'pl-0': true, 'pl-1': true, 'pl-2': true }, num: { sonoH: 7, sonoM: 30, evac: 1, ativMin: 30, volume: 350, qtd: 3, peso: 78.6 },
    agua: [['08:00', 'garrafinha', 'Garrafinha', 500], ['09:30', 'copo-grande', 'Copo grande', 300], ['11:00', 'copo', 'Copo de água', 200], ['12:30', 'copo-doutor', 'Copo do Doutor', 1200], ['15:00', 'copo', 'Copo de água', 200], ['17:00', 'copo', 'Água', 100]],
    atividades: [['haltere', 'Musculação', 30, 'Moderada'], ['bicicleta', 'Bicicleta', 20, 'Leve']],
    bebidas: [['cerveja', 'Cerveja', 700, '2 latas de 350 ml'], ['vinho', 'Vinho', 150, '1 taça']],
    tabaco: [['cigarro', 'Cigarro', '3 unidades', '16:00'], ['vape', 'Cigarro eletrônico', '1 sessão', '18:00']],
    revCat: 0
  };

  var ABAS = [
    { id: 'inicio', nome: 'Início', ic: 'inicio' },
    { id: 'evolucao', nome: 'Evolução', ic: 'evolucao' },
    { id: 'equipe', nome: 'Equipe', ic: 'pessoas' }
  ];
  // Cada tela interna diz de qual tela ela vem (para a aba acesa e o "‹ Voltar").
  var PAI = {
    alimentacao: 'inicio', alimento: 'alimentacao', plano: 'inicio', revistas: 'inicio', revista: 'revistas', agua: 'inicio', sono: 'inicio', humor: 'inicio',
    atividade: 'inicio', fome: 'inicio', intestino: 'inicio', alcool: 'inicio', substancias: 'inicio', medicamentos: 'inicio', picadinha: 'inicio', sintomas: 'picadinha',
    ciclo: 'inicio', medidas: 'evolucao', ia: 'inicio', avisos: 'inicio', consultas: 'inicio', comunidade: 'inicio',
    conquistas: 'perfil', chat: 'equipe', fotos: 'evolucao', documentos: 'evolucao', perfil: 'inicio', corpo: 'perfil',
    metas: 'perfil', lembretes: 'perfil', integracoes: 'perfil', pagamentos: 'perfil', dados: 'perfil', acessibilidade: 'perfil',
    entrar: 'perfil', consentimento: 'perfil', tour: 'perfil'
  };
  var SEM_BARRA = { entrar: 1, consentimento: 1, tour: 1 };
  var TELAS = {};

  // ---------- peças ----------
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function br(n, d) { return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function cartao(c, classe) { return '<section class="cartao ' + (classe || '') + '">' + c + '</section>'; }
  // Cabeçalho de toda tela: "‹ Voltar", logo, "AG Melhor Versão" / "Doutor André Pontes Gonçalves" e o selo bege.
  function topoApp(voltar) {
    return '<header class="cab-app">' + (voltar ? '<a class="voltar-txt" href="#' + voltar + '">' + A.ic('voltar') + 'Voltar</a>' : '') + A.logo({ tamanho: 48 }) +
      '<div class="marca"><b>AG Melhor Versão</b><small>Doutor André Pontes Gonçalves</small></div><span class="selo-bege">Prévia · dados de exemplo</span></header>';
  }
  // Cabeçalho + título grande + subtítulo cinza-azulado + marcadores do escopo.
  function cab(id, titulo, subtitulo, itens) {
    return topoApp(PAI[id] || (id === 'inicio' ? '' : 'inicio')) +
      '<div class="titulo-bloco"><h1 class="titulo-pagina">' + titulo + '</h1>' + (subtitulo ? '<p class="subtitulo">' + subtitulo + '</p>' : '') + '</div>' +
      (itens ? '<div class="cab-itens">' + itens + '</div>' : '');
  }
  function ficha() { return '<p class="nota-ficha">' + A.ic('documento') + 'Vai para a sua ficha na clínica ' + A.item(134) + '</p>'; }
  function linMenu(href, ic, cor, titulo, sub, itens, ilu) {
    return '<a class="lin-menu" href="#' + href + '">' + (ilu ? A.ilu(ilu, 40) : A.bolha(ic, cor)) + '<span class="meio"><b>' + titulo + '</b><small>' + (sub || '') + '</small></span>' +
      (itens ? '<span class="itens">' + itens + '</span>' : '') + A.ic('seta', 'fraco') + '</a>';
  }
  // Pílulas de uma escolha só (grupo guardado em E.esc). padrao: índice escolhido quando ainda não há escolha.
  function pil(grupo, lista, padrao, classe, n) {
    var sel = E.esc[grupo] == null ? padrao : E.esc[grupo];
    return '<div class="pilulas ' + (classe || '') + '" style="--n:' + (n || lista.length) + '" role="group">' + lista.map(function (t, i) {
      return '<button type="button" data-acao="esc" data-g="' + grupo + '" data-v="' + i + '" class="' + (sel === i ? 'sel' : '') + '" aria-pressed="' + (sel === i) + '">' + t + '</button>';
    }).join('') + '</div>';
  }
  function escolhido(grupo, padrao) { return E.esc[grupo] == null ? padrao : E.esc[grupo]; }
  // Opções em cartão com ilustração. lista: [ilustração, texto].
  function cartoes(grupo, lista, padrao, n, tam) {
    var sel = escolhido(grupo, padrao);
    return '<div class="opcoes-cartao" style="--n:' + (n || 3) + '">' + lista.map(function (o, i) {
      return '<button type="button" data-acao="esc" data-g="' + grupo + '" data-v="' + i + '" class="' + (sel === i ? 'sel' : '') + '" aria-pressed="' + (sel === i) + '">' + A.ilu(o[0], tam || 64) + '<span>' + o[1] + '</span></button>';
    }).join('') + '</div>';
  }
  // Data: "Hoje, 16 de outubro" (com ‹ › para trocar o dia, ou ⌄).
  function nomeDia(off) {
    var DT = A.datas, d = DT.somaDias(DT.hoje(), off);
    return (off === 0 ? 'Hoje' : off === -1 ? 'Ontem' : DT.cap(DT.semCurto(d))) + ', ' + d.getDate() + ' de ' + DT.mes(d);
  }
  function dataCartao(setas, texto) {
    if (setas) return '<div class="data-cartao centro"><button type="button" class="seta-data" data-acao="dia" data-v="-1" aria-label="Dia anterior">‹</button>' +
      '<span class="meio">' + (setas === 'cal' ? A.ic('calendario') + ' ' : '') + (texto || nomeDia(E.diaOff)) + '</span><button type="button" class="seta-data" data-acao="dia" data-v="1" aria-label="Próximo dia"' + (E.diaOff >= 0 ? ' disabled style="opacity:.3"' : '') + '>›</button></div>';
    return '<button type="button" class="data-cartao" data-acao="aviso" data-msg="Escolha o dia no calendário (exemplo).">' + A.ic('calendario') + '<span class="meio">' + (texto || nomeDia(0)) + '</span>' + A.ic('baixo') + '</button>';
  }
  function passo(chave, texto, rotulo) {
    return '<div class="passo" role="group" aria-label="' + (rotulo || 'Quantidade') + '"><button type="button" data-acao="passo" data-k="' + chave + '" data-v="-1" aria-label="Menos">−</button><output>' + texto + '</output><button type="button" data-acao="passo" data-k="' + chave + '" data-v="1" aria-label="Mais">+</button></div>';
  }
  function salvar(texto, msg) { return '<button class="botao salvar" type="button" data-acao="aviso" data-msg="' + (msg || 'Registro salvo. Obrigada!') + '">' + (texto || 'Salvar meu registro') + '<span class="seta-fim">›</span></button>'; }
  function botaoVerde(texto, acao, extra) { return '<button class="botao salvar" type="button" data-acao="' + acao + '"' + (extra || '') + '>' + texto + '<span class="seta-fim">›</span></button>'; }
  // Contato: sempre o WhatsApp da clínica, pela área (nunca o número pessoal de alguém).
  function contato(texto, area, classe) {
    return '<button type="button" class="botao-contato ' + (classe || '') + '" data-acao="whats" data-area="' + (area || 'Atendimento') + '">' + A.ic('fone') + '<span>' + texto + '</span>' + A.ic('seta') + '</button>';
  }
  function reg(ilu, titulo, sub, extra, editar) {
    return '<div class="reg">' + (ilu ? A.ilu(ilu, 40) : '') + '<div class="meio"><b>' + titulo + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>' + (extra || '') +
      (editar ? '<button type="button" class="editar" data-acao="aviso" data-msg="Edição do registro (exemplo).">' + A.ic('lapis') + 'Editar</button><button type="button" class="lixo" data-acao="del" data-k="' + editar[0] + '" data-v="' + editar[1] + '" aria-label="Apagar">' + A.ic('lixo') + '</button>' : '') + '</div>';
  }
  function regLink(ilu, data, texto, href, msg) {
    return '<a class="reg" href="' + (href || '#') + '"' + (msg ? ' data-acao="aviso" data-msg="' + msg + '"' : '') + '>' + A.ilu(ilu, 34) + '<div class="meio hist-dia"><b>' + data + '</b><span>' + texto + '</span></div>' + A.ic('seta') + '</a>';
  }
  function aviso(t, classe) { return '<p class="aviso-info ' + (classe || '') + '">' + t + '</p>'; }
  function obs(titulo, ph) { return '<div class="bloco"><h3>' + (titulo || 'Quer acrescentar algo?') + ' <span class="fraco">(opcional)</span></h3><textarea class="campo" placeholder="' + (ph || 'Conte como foi seu dia...') + '"></textarea></div>'; }
  function cadeado(t) { return '<span class="cadeado">' + A.ic('cadeado') + (t || 'Preenchida pela equipe') + '</span>'; }
  function rotEquipe(t) { return '<span class="rot-equipe">' + A.ic('pessoas') + (t || 'Acompanhado pela equipe') + '</span>'; }

  // Gráfico de linha de uma série só (o título diz o que é). Toque num ponto para ler o valor.
  function grafico(id, valores, rotulos, unidade, casas, opc) {
    opc = opc || {};
    var w = 320, h = 150, pe = 26, pd = 14, pt = 22, pb = 22, n = valores.length;
    var min = opc.min != null ? opc.min : Math.min.apply(null, valores), max = opc.max != null ? opc.max : Math.max.apply(null, valores);
    if (opc.min == null) { var folga = (max - min) * 0.15 || 1; min -= folga; max += folga; }
    var x = function (i) { return pe + 8 + i * (w - pe - pd - 16) / Math.max(1, n - 1); };
    var y = function (v) { return pt + (max - v) * (h - pt - pb) / (max - min); };
    var linha = valores.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var area = linha + ' L' + x(n - 1).toFixed(1) + ' ' + (h - pb) + ' L' + x(0).toFixed(1) + ' ' + (h - pb) + ' Z';
    var u = n - 1, s = '<div class="grafico" data-grafico="' + id + '" data-unidade="' + unidade + '" data-casas="' + (casas || 0) + '">' +
      (opc.leitura === false ? '' : '<div class="leitura"><span class="num" data-leitura>' + br(valores[u], casas) + '</span><span class="mudo" data-leitura-rot>' + unidade + ' · ' + rotulos[u] + '</span></div>') +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Gráfico">';
    (opc.ticks || []).forEach(function (t) { s += '<line class="guia" x1="' + pe + '" x2="' + (w - pd) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/><text x="' + (pe - 4) + '" y="' + (y(t) + 3).toFixed(1) + '" text-anchor="end">' + t + '</text>'; });
    if (opc.ticks) s += '<text x="' + (pe - 4) + '" y="10" text-anchor="end">' + unidade + '</text>';
    s += '<line class="eixo" x1="' + pe + '" x2="' + (w - pd) + '" y1="' + (h - pb) + '" y2="' + (h - pb) + '"/><path class="area" d="' + area + '"/><path class="serie" d="' + linha + '"/>';
    valores.forEach(function (v, i) {
      var mostra = n <= 4 || i === 0 || i === u || i === Math.floor(u / 2);
      if (opc.ticks && n <= 4) s += '<line class="guia" x1="' + x(i).toFixed(1) + '" x2="' + x(i).toFixed(1) + '" y1="' + y(v).toFixed(1) + '" y2="' + (h - pb) + '"/>';
      s += '<circle class="ponto' + (i === u ? ' sel' : '') + '" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="5"/>' +
        '<rect class="alvo" data-i="' + i + '" data-v="' + v + '" data-r="' + rotulos[i] + '" x="' + (x(i) - 14).toFixed(1) + '" y="0" width="28" height="' + h + '"/>';
      if (opc.valores && mostra) s += '<text class="forte" x="' + x(i).toFixed(1) + '" y="' + (y(v) - 10).toFixed(1) + '" text-anchor="middle">' + br(v, casas) + '</text>';
      if (mostra) s += '<text x="' + x(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle">' + rotulos[i] + '</text>';
    });
    return s + '</svg></div>';
  }

  // ---------- IA simulada ----------
  // Respostas prontas. Nunca diagnostica, nunca fala de dose; quando é com a equipe, chama a equipe.
  function respostaIA(t) {
    t = t.toLowerCase();
    if (/dose|aument|diminu|unidade|quanto apli/.test(t)) return ['Não posso orientar sobre dose: isso é só com o Dr. André. Encaminhei sua pergunta para ele e para a enfermagem. A resposta chega aqui, citada e sem alteração.', 'equipe avisada · Thaís e Dr. André'];
    if (/enjo|náus|nause|vômit|vomit|dor|tontu|mal/.test(t)) return ['Sinto muito que você não esteja bem. Eu não avalio sintomas, mas registrei no seu diário e avisei a enfermagem (Thaís). Se piorar, tiver vômitos seguidos ou dor forte, procure atendimento ou ligue 192.', 'registrado na ficha · enfermagem avisada'];
    if (/esqueci|perdi|atras/.test(t)) return ['Obrigada por avisar. O que fazer depende da orientação da clínica, então chamei a enfermagem para te responder. Enquanto isso, não aplique uma dose extra por conta própria.', 'enfermagem avisada'];
    if (/pão|pao|comer|aliment|doce|jantar/.test(t)) return ['Pelo seu plano do Felipe, no jantar a sugestão é frango com legumes ou sopa com frango. Pão à noite não está no plano; se quiser trocar, posso pedir ao Felipe uma substituição.', 'com base no plano alimentar'];
    return ['Anotei. Vou responder com base nas orientações da sua equipe. Se for algo que só a equipe pode responder, eu encaminho para a pessoa certa.', ''];
  }

  // ---------- ações ----------
  function avisoCurto(msg) {
    var ap = document.querySelector('.aparelho'), v = ap.querySelector('.aviso-curto');
    if (v) v.remove();
    v = document.createElement('div'); v.className = 'aviso-curto'; v.setAttribute('role', 'status'); v.textContent = A.datas.trocar(msg); ap.appendChild(v);
    clearTimeout(avisoCurto.t); avisoCurto.t = setTimeout(function () { v.remove(); }, 2800);
  }
  function perguntar(t) {
    if (!t) return;
    A.log('pergunta', { chat: 'assistente do app', texto: String(t).slice(0, 500) });
    E.chat.push(['eu', esc(t)]);
    render(true);
    setTimeout(function () { var r = respostaIA(t); E.chat.push(['ela', r[0], r[1]]); render(true); rolarFim(); }, 700);
    rolarFim();
  }
  function rolarFim() { var r = document.getElementById('rolagem'); r.scrollTop = r.scrollHeight; }
  function hora() { return A.datas.hm(A.datas.agora()); }
  // Ações próprias de cada tela (registradas pelos arquivos de telas).
  var ACOES = {};

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]');
    if (!el) {
      var alvo = ev.target.closest('.grafico .alvo');
      if (alvo) {
        var g = alvo.closest('.grafico'), l = g.querySelector('[data-leitura]');
        if (l) { l.textContent = br(Number(alvo.dataset.v), Number(g.dataset.casas)); g.querySelector('[data-leitura-rot]').textContent = g.dataset.unidade + ' · ' + alvo.dataset.r; }
        g.querySelectorAll('.ponto').forEach(function (p, i) { p.classList.toggle('sel', String(i) === alvo.dataset.i); });
      }
      return;
    }
    var a = el.dataset.acao, v = el.dataset.v, k = el.dataset.k;
    if (ACOES[a]) { ev.preventDefault(); ACOES[a](el, v, k); return; }
    if (a === 'aviso') { if (el.tagName !== 'A') ev.preventDefault(); else if (el.getAttribute('href') === '#') ev.preventDefault(); avisoCurto(el.dataset.msg); return; }
    if (a === 'esc') { E.esc[el.dataset.g] = Number(v); render(true); return; }
    if (a === 'multi') { var m = E.multi[k] || (E.multi[k] = []), i = m.indexOf(Number(v)); if (i >= 0) m.splice(i, 1); else m.push(Number(v)); render(true); return; }
    if (a === 'abre') { E.aberto[k] = !E.aberto[k]; render(true); return; }
    if (a === 'dia') { E.diaOff = Math.min(0, E.diaOff + Number(v)); render(true); return; }
    if (a === 'whats') { avisoCurto('Abre o WhatsApp da clínica (' + el.dataset.area + ') com a mensagem pronta. Nunca o número pessoal de alguém da equipe.'); return; }
    if (a === 'del') { var lista = E[k]; if (lista) { lista.splice(Number(v), 1); render(true); avisoCurto('Registro apagado.'); } return; }
    if (a === 'marca') { var pai = el.parentNode; if (pai.classList.contains('escala')) pai.querySelectorAll('.sel').forEach(function (x) { if (x !== el) x.classList.remove('sel'); }); el.classList.toggle('sel'); return; }
    if (a === 'canal') { el.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('ativo', b === el); }); avisoCurto(el.textContent.indexOf('WhatsApp') >= 0 ? 'A assistente passa a falar com você pelo WhatsApp.' : 'A assistente fala com você por notificação e chat no app.'); return; }
    if (a === 'porcao') { E.porcao = [170, 85, 100, 250][Number(v)]; render(true); return; }
    if (a === 'somar') { var f = E.porcao / 170; E.kcal += Math.round(110 * f); E.prot += Math.round(6.8 * f); avisoCurto('Somado ao dia: +' + Math.round(110 * f) + ' kcal, +' + Math.round(6.8 * f) + ' g de proteína.'); location.hash = '#alimentacao'; return; }
    if (a === 'remarcar') { E.slot = E.slot === 'abrir' ? null : 'abrir'; render(true); return; }
    if (a === 'slot') { E.consulta = v.replace(/^(Seg|Ter|Qua|Qui|Sex),/, function (x, d) { return { Seg: 'Segunda', Ter: 'Terça', Qua: 'Quarta', Qui: 'Quinta', Sex: 'Sexta' }[d] + ','; }); E.slot = null; render(true); avisoCurto('Consulta remarcada para ' + v + '.'); return; }
    if (a === 'local') { E.local = v; render(true); avisoCurto('Local de hoje marcado.'); return; }
    if (a === 'chave') { el.classList.toggle('on'); return; }
    if (a === 'tomei') { el.textContent = '✓ Tomei'; el.classList.add('verde'); return; }
    if (a === 'letra') { E.letra = !E.letra; document.documentElement.dataset.letra = E.letra ? 'grande' : ''; render(true); return; }
    if (a === 'escuro') { A.aplicarEstilo(A.estilo() === 'clean-escuro' ? 'clean-claro' : 'clean-escuro', true); render(true); return; }
    if (a === 'check') { E.check[Number(v)] = !E.check[Number(v)]; render(true); return; }
    if (a === 'perguntar') { perguntar(v); return; }
    if (a === 'perguntar-campo') { var c = document.getElementById('pergunta'); perguntar(c.value.trim()); return; }
    if (a === 'enviar-equipe') {
      var msg = document.getElementById('msg-equipe'), t = msg.value.trim(); if (!t) return;
      A.log('pergunta', { chat: 'equipe (app)', texto: String(t).slice(0, 500) });
      E.chatEquipe.push(['eu', esc(t), 'agora']); render(true); rolarFim(); avisoCurto('Enviado. A IA encaminhou para a pessoa certa da equipe.'); return;
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    if (ev.target.id === 'pergunta') perguntar(ev.target.value.trim());
    if (ev.target.id === 'msg-equipe') document.querySelector('[data-acao="enviar-equipe"]').click();
  });

  function emBreve() { return cab('x', 'Tela não encontrada') + '<div class="em-breve"><p class="mudo">Esta tela não existe.</p><a class="botao sem-sublinhado" href="#inicio">Voltar ao início</a></div>'; }

  function render(manter) {
    var id = (location.hash || '#inicio').slice(1).split('?')[0] || 'inicio';
    var el = document.getElementById('tela'), rol = document.getElementById('rolagem'), y = rol.scrollTop;
    el.innerHTML = TELAS[id] ? TELAS[id]() : emBreve();
    el.className = 'tela' + (manter ? '' : ' entra');
    // aba acesa: a da própria tela ou a do primeiro "pai" que for aba
    var aba = id; while (PAI[aba] && ABAS.every(function (x) { return x.id !== aba; })) aba = PAI[aba];
    document.querySelectorAll('.aba').forEach(function (b) { var at = b.dataset.tela === aba; b.classList.toggle('ativa', at); if (at) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    document.body.classList.toggle('sem-barra', !!SEM_BARRA[id]);
    rol.scrollTop = manter ? y : 0;
  }

  function montar() {
    document.getElementById('abas').innerHTML = ABAS.map(function (a) {
      return '<a class="aba" href="#' + a.id + '" data-tela="' + a.id + '">' + A.ic(a.ic) + '<span>' + a.nome + '</span></a>';
    }).join('');
    // Balão da assistente em todas as telas (itens 143 e 163): mesmas respostas prontas e mesmas regras do #ia.
    A.balao({ dentro: document.querySelector('.aparelho'), titulo: 'Assistente da AG Melhor Versão', sub: 'IA · não substitui a equipe',
      itens: A.item([143, 163]) + A.juridico('depende do parecer jurídico'),
      saudacao: 'Oi, Mariana! Respondo com base nas orientações do Dr. André e da equipe. Não faço diagnóstico, não prescrevo e não falo de dose.',
      sugestoes: ['Posso comer pão à noite?', 'Estou enjoada', 'Posso aumentar a dose?'], responder: respostaIA });
    window.addEventListener('hashchange', function () { render(false); });
    document.addEventListener('estilo', function () { if ((location.hash || '').slice(1) === 'acessibilidade') render(true); });
    render(false);
  }

  window.APP = {
    A: A, E: E, PACIENTE: PACIENTE, EQUIPE: EQUIPE, TODA_EQUIPE: TODA_EQUIPE, TELAS: TELAS, PAI: PAI, ACOES: ACOES,
    esc: esc, br: br, cartao: cartao, cab: cab, topoApp: topoApp, ficha: ficha, linMenu: linMenu, pil: pil, escolhido: escolhido, cartoes: cartoes,
    dataCartao: dataCartao, nomeDia: nomeDia, passo: passo, salvar: salvar, botaoVerde: botaoVerde, contato: contato, reg: reg, regLink: regLink, aviso: aviso, obs: obs,
    cadeado: cadeado, rotEquipe: rotEquipe, grafico: grafico, avisoCurto: avisoCurto, render: render, hora: hora
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else setTimeout(montar, 0);
})();
