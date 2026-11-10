// Conferência dos caminhos escritos (rxsync-sistema #219): todo "X › Y" que começa por uma área do painel ou da Central
// (Hoje, Agenda, Pacientes, Assistente, Conta; Clientes, Segurança…) tem de ser um caminho de toque que existe, ou o
// começo de um. A lista dos caminhos válidos é uma só, gravada pelo scripts/painel_alcance.mjs --gravar a partir do
// painel e da Central (scripts/caminhos_validos.json); o rxsync-sistema usa uma cópia dela no verificar.mjs.
// Quem usa: scripts/verificar_site.mjs (textos do site, do painel e da Central) e, no rxsync-sistema, scripts/verificar.mjs
// (e-mails e respostas do servidor). Este arquivo é igual nos dois repositórios.
// Como confere: a partir de cada "›", volta até o nome da área e anda pela lista, um pedaço por vez; em cada pedaço, vale
// o nome mais comprido entre os que existem ali (o texto pode seguir com ponto, vírgula ou outras palavras). O botão ⋯
// pode ser escrito "⋯", "⋯ Mais" ou "Mais"; um item do ⋯ pode ser escrito só até os dois-pontos ("Organizar" vale por
// "Organizar: duplicados e importação"); um pedaço entre parênteses vale por qualquer nome daquele lugar ("Clientes ›
// (a clínica) › …"); um pedaço entre aspas no fim é o nome de um botão daquela tela ("Segurança › "Sair de todos os
// aparelhos""). Com os botões gravados (a lista "botoes" do caminhos_validos.json), esse nome é conferido: tem de ser um
// botão, um link, uma aba ou uma chave daquela tela (maiúsculas, o ponto final e as reticências não contam).
// "Central › …" só vale com uma seção da Central logo depois. Linhas com a marca "caminhos-antigos" ficam
// de fora (as listas do que mudou de nome e os documentos históricos, que guardam os caminhos da época).
const normal = t => String(t || '').toLowerCase().replace(/[.…⋯!:]+$/, '').replace(/\s+/g, ' ').trim();
export function arvoreDosCaminhos(painel, central, botoes) {
  const raiz = new Map();
  const andar = cam => { let no = raiz; for (const parte of cam.split(' › ')) { if (!no.has(parte)) no.set(parte, new Map()); no = no.get(parte); } return no; };
  for (const cam of [...painel, ...central, ...central.map(c => 'Central › ' + c)]) andar(cam);
  if (botoes) {
    raiz.comBotoes = true;
    const por = (cam, lista) => { const no = andar(cam); no.botoes = no.botoes || new Set(); for (const b of lista) no.botoes.add(normal(b)); };
    for (const [cam, lista] of Object.entries(botoes.painel || {})) por(cam, lista);
    for (const [cam, lista] of Object.entries(botoes.central || {})) { por(cam, lista); por('Central › ' + cam, lista); }
  }
  return raiz;
}
// Devolve os caminhos escritos que não existem: [{ caminho, onde }] ("onde" é o pedaço que não bate).
export function caminhosQuebrados(texto, raiz) {
  const achados = [], vistos = new Set();
  // "caminhos-antigos" numa linha tira a linha; "caminhos-antigos: começo" e "caminhos-antigos: fim" tiram o trecho entre elas.
  let fora = false;
  const s = String(texto || '').split('\n').map(l => { if (l.includes('caminhos-antigos: começo')) { fora = true; return ''; } if (l.includes('caminhos-antigos: fim')) { fora = false; return ''; } return fora || l.includes('caminhos-antigos') ? '' : l; }).join('\n');
  const nomesRaiz = [...raiz.keys()].sort((a, b) => b.length - a.length);
  let i = s.indexOf('›');
  while (i >= 0) {
    // a área: o nome da raiz que termina logo antes do "›"
    const antes = s.slice(Math.max(0, i - 60), i).replace(/\s+$/, '');
    const area = nomesRaiz.find(n => antes.endsWith(n) && !/[\p{L}\p{N}]/u.test(antes.charAt(antes.length - n.length - 1) || ' '));
    if (!area) { i = s.indexOf('›', i + 1); continue; }
    let no = raiz.get(area), caminho = area, pos = i, quebrou = null, fimDoCaminho = i + 1;
    while (pos >= 0 && s[pos] === '›') {
      const resto = s.slice(pos + 1).replace(/^\s+/, ''), desloc = s.length - (pos + 1) - resto.length;
      const fim = n => !/[\p{L}\p{N}]/u.test(resto.charAt(n.length) || ' ');
      const mais = resto.match(/^⋯(\s+Mais)?/), coringa = resto.match(/^\([^)\n]{1,40}\)/);
      const aspas = resto.match(/^["“]([^"”\n]{1,80})["”]/);
      if (aspas || /^["“]/.test(resto)) {   // o nome de um botão, entre aspas: conferido quando a lista traz os botões
        if (aspas && raiz.comBotoes && !(no.botoes && no.botoes.has(normal(aspas[1]))) && ![...no.keys()].some(k => normal(k) === normal(aspas[1]) || normal(k.split(':')[0]) === normal(aspas[1]))) { quebrou = '"' + aspas[1] + '"'; caminho += ' › ' + quebrou; }
        break;
      }
      let filho = null, escrito = '';
      if (mais && no.has('Mais')) { filho = 'Mais'; escrito = mais[0]; }
      else if (coringa) { if (!no.size) break; filho = [...no.keys()][0]; escrito = coringa[0]; }   // a ficha de um cliente, de um paciente…
      else {
        const nomes = [...no.keys()].sort((a, b) => b.length - a.length);
        filho = nomes.find(n => resto.startsWith(n) && fim(n)) || null; escrito = filho || '';
        if (!filho) { const c = nomes.find(n => n.includes(':') && resto.startsWith(n.split(':')[0]) && fim(n.split(':')[0])); if (c) { filho = c; escrito = c.split(':')[0]; } }
      }
      if (!filho) { quebrou = (resto.match(/^[^.,;:!?)"”\n]{0,50}/) || [''])[0].trim(); caminho += ' › ' + quebrou; break; }
      caminho += ' › ' + escrito; no = no.get(filho);
      pos = pos + 1 + desloc + escrito.length; fimDoCaminho = pos;
      const depois = s.slice(pos).match(/^\s*›/);
      pos = depois ? pos + depois[0].length - 1 : -1;
    }
    if (quebrou !== null && !vistos.has(caminho)) { vistos.add(caminho); achados.push({ caminho, onde: quebrou }); }
    // Depois de um caminho, a busca segue do fim dele: um pedaço do meio com nome de área ("Prospecção › Mais › Buscas") não é outro caminho.
    const prox = Math.max(pos >= 0 ? pos + 1 : i + 1, fimDoCaminho);
    i = s.indexOf('›', Math.max(prox, i + 1));
  }
  return achados;
}
