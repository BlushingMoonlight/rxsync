// Guias do site (rxsync-sistema, decisão da seção Guias): monta as páginas a partir das fontes em guias/_fonte/.
// - guias/_fonte/<endereço>.md: um guia por arquivo, com o cabeçalho (entre as linhas ---) e o texto, que usa as peças
//   pelo nome (:::nome … :::). A pasta começa com "_", e o GitHub Pages (Jekyll) não publica pasta assim: as fontes não
//   viram página. O molde (topo, rodapé e as 10 peças) é o guias/_fonte/molde.html.
// - gera guias/<endereço>/index.html de cada fonte e, com pelo menos um guia publicado, guias/index.html (a página Guias);
// - atualiza o sitemap.xml (só os guias publicados, com a data de revisão) e o link "Guias" no menu e no rodapé do
//   index.html (só com pelo menos um guia publicado);
// - rascunho (rascunho: sim): a página é gerada com noindex e fica fora do sitemap, da página Guias e dos relacionados;
// - nenhum JavaScript nos guias: o índice do celular e o menu usam <details>; a regra de segurança (CSP) é a do
//   scripts/csp.mjs, sem script nenhum.
// Rode depois de mudar uma fonte, o molde ou o guias.css: node scripts/guias_montar.mjs (o verificar_site.mjs confere).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { cspPagina, PAGINA_GUIA } from './csp.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PASTA = path.join(RAIZ, 'guias');
export const FONTE = path.join(PASTA, '_fonte');
export const MOLDE = path.join(FONTE, 'molde.html');
export const SITE = 'https://rxsync.com.br';
// Os temas da página Guias, na ordem em que aparecem (o id vira a âncora: /guias/#agenda-e-faltas).
export const TEMAS = { atendimento: ['atendimento', 'Atendimento'], agenda: ['agenda-e-faltas', 'Agenda e faltas'], regras: ['regras-e-dados', 'Regras e dados'] };
const CAMPOS = ['titulo', 'descricao', 'endereco', 'tema', 'pesquisa-alvo', 'publicado-em', 'revisado-em', 'rascunho'];
const PECAS = ['resposta-curta', 'na-rxsync', 'passos', 'tabela', 'aviso', 'modelo-de-mensagem', 'imagem', 'perguntas', 'chamada', 'cartao-de-guia'];

// ---------------------------------------------------------------- texto
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Dentro do texto: **negrito** e [texto](endereço). O endereço é do próprio site (/…) ou https.
function inline(t) {
  return esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\[\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
      const u = url.replace(/&amp;/g, '&');
      if (!/^(\/|https:\/\/|mailto:)/.test(u)) throw new Error(`link "${url}": só endereço do site (/…), https:// ou mailto:`);
      return `<a href="${esc(u)}">${txt}</a>`;
    });
}
const textoPuro = t => String(t).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\[\]]+)\]\([^)]*\)/g, '$1').trim();
export const ancora = t => textoPuro(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao';
const data = iso => iso.split('-').reverse().join('/');
// A origem do clique (o cadastro aceita só letras minúsculas, números e "_", até 30): guia_<endereço com "_">.
export const origemParam = end => ('guia_' + end.replace(/-/g, '_')).slice(0, 30);
const linkTeste = origem => `/contratar.html?plano=gestao&amp;ciclo=mensal&amp;origem=${origem}`;

// ---------------------------------------------------------------- fontes
export function lerCabecalho(txt, arq) {
  const m = txt.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${arq}: falta o cabeçalho entre as linhas ---`);
  const cab = { perguntas: [], relacionados: [] }; let lista = null;
  for (const linha of m[1].split('\n')) {
    if (!linha.trim()) continue;
    let k;
    if ((k = linha.match(/^  - (\w[\w-]*):\s*(.*)$/)) && lista) { lista.push({ [k[1]]: k[2].trim() }); continue; }
    if ((k = linha.match(/^    (\w[\w-]*):\s*(.*)$/)) && lista && lista.length) { lista[lista.length - 1][k[1]] = k[2].trim(); continue; }
    if (!(k = linha.match(/^([a-z][\w-]*):\s*(.*)$/))) throw new Error(`${arq}: linha do cabeçalho que não entendi: "${linha}"`);
    const [, chave, valor] = k; lista = null;
    if (chave === 'perguntas') { if (valor) throw new Error(`${arq}: perguntas vêm em linhas "  - pergunta:" e "    resposta:"`); lista = cab.perguntas; }
    else if (chave === 'relacionados') cab.relacionados = valor.split(',').map(s => s.trim()).filter(Boolean);
    else cab[chave] = valor.trim();
  }
  for (const c of CAMPOS) if (!cab[c]) throw new Error(`${arq}: falta "${c}" no cabeçalho`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cab.endereco) || cab.endereco.length > 60) throw new Error(`${arq}: endereço "${cab.endereco}": só letras minúsculas, números e "-", até 60`);
  if (path.basename(arq) !== cab.endereco + '.md') throw new Error(`${arq}: o arquivo precisa se chamar ${cab.endereco}.md (o endereço)`);
  if (!TEMAS[cab.tema]) throw new Error(`${arq}: tema "${cab.tema}" não existe (${Object.keys(TEMAS).join(', ')})`);
  for (const c of ['publicado-em', 'revisado-em']) if (!/^\d{4}-\d{2}-\d{2}$/.test(cab[c]) || isNaN(Date.parse(cab[c]))) throw new Error(`${arq}: ${c} no formato AAAA-MM-DD`);
  if (cab['revisado-em'] < cab['publicado-em']) throw new Error(`${arq}: revisado-em antes de publicado-em`);
  if (!/^(sim|não|nao)$/.test(cab.rascunho)) throw new Error(`${arq}: rascunho: sim ou não`);
  for (const p of cab.perguntas) if (!p.pergunta || !p.resposta) throw new Error(`${arq}: toda pergunta precisa de "pergunta" e "resposta"`);
  cab.rascunho = cab.rascunho === 'sim';
  return { cab, corpo: m[2] };
}
export function lerFontes() {
  const guias = fs.readdirSync(FONTE).filter(f => f.endsWith('.md') && !/^LEIA-ME/i.test(f)).sort()
    .map(f => ({ arquivo: path.join('guias', '_fonte', f), ...lerCabecalho(fs.readFileSync(path.join(FONTE, f), 'utf8'), f) }));
  const vistos = new Map();
  for (const g of guias) {
    const o = origemParam(g.cab.endereco);
    if (vistos.has(o)) throw new Error(`${g.arquivo}: a origem do clique (${o}) fica igual à de ${vistos.get(o)}; encurte um dos endereços`);
    vistos.set(o, g.arquivo);
  }
  return guias;
}
export function lerMolde() {
  const s = fs.readFileSync(MOLDE, 'utf8').replace(/\r\n/g, '\n');
  const fim = s.indexOf('</html>') + '</html>'.length;
  const pecas = {};
  for (const m of s.slice(fim).matchAll(/<!-- peça: ([a-z-]+) -->\n([\s\S]*?)\n<!-- \/peça -->/g)) pecas[m[1]] = m[2];
  for (const p of [...PECAS, 'pagina-guia', 'pagina-guias', 'tema', 'faixa-rascunho', 'pergunta', 'relacionados']) if (!pecas[p]) throw new Error(`guias/_fonte/molde.html: falta a peça ${p}`);
  return { pagina: s.slice(0, fim) + '\n', pecas };
}
// Troca os {{NOME}}; a linha que só tem um {{NOME}} vazio sai inteira (o "Guias" sem guia publicado, a faixa do rascunho).
const preencher = (t, v) => t.replace(/^[ \t]*\{\{([A-Z_]+)\}\}\n/gm, (m, k) => (k in v && v[k] === '' ? '' : m))
  .replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!(k in v)) throw new Error(`molde: {{${k}}} sem valor`); return v[k]; });

// ---------------------------------------------------------------- o texto do guia (Markdown curto + as peças)
function blocos(texto) {   // parágrafos, listas, ## e ###; devolve HTML e os ## (para o índice)
  const h2 = [], saida = []; let par = [], lista = null;
  const fecharPar = () => { if (par.length) saida.push(`<p>${inline(par.join(' '))}</p>`); par = []; };
  const fecharLista = () => { if (lista) saida.push(`<${lista.tag}>${lista.itens.map(i => `<li>${inline(i)}</li>`).join('')}</${lista.tag}>`); lista = null; };
  for (const linha of texto.split('\n')) {
    let m;
    if (!linha.trim()) { fecharPar(); fecharLista(); continue; }
    if ((m = linha.match(/^(##|###) (.+)$/))) {
      fecharPar(); fecharLista();
      const id = ancora(m[2]);
      if (m[1] === '##') { h2.push({ id, texto: textoPuro(m[2]) }); saida.push(`<h2 id="${id}">${inline(m[2])}</h2>`); } else saida.push(`<h3>${inline(m[2])}</h3>`);
    } else if ((m = linha.match(/^(-|\d+\.) (.+)$/))) {
      fecharPar(); const tag = m[1] === '-' ? 'ul' : 'ol';
      if (lista && lista.tag !== tag) fecharLista();
      if (!lista) lista = { tag, itens: [] };
      lista.itens.push(m[2]);
    } else if (/^#/.test(linha)) throw new Error(`"${linha}": o título do guia vem do cabeçalho; no texto, só ## e ###`);
    else { fecharLista(); par.push(linha.trim()); }
  }
  fecharPar(); fecharLista();
  return { html: saida.join('\n'), h2 };
}
function tabela(linhas) {
  const cel = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const rs = linhas.filter(l => l.trim());
  if (rs.length < 3 || !/^\|?\s*:?-{3,}/.test(rs[1])) throw new Error('tabela: a primeira linha são os títulos, a segunda "| --- |" e depois as linhas');
  const cab = cel(rs[0]);
  const corpo = rs.slice(2).map(cel);
  if (corpo.some(r => r.length !== cab.length)) throw new Error('tabela: toda linha precisa do mesmo número de colunas');
  return `<thead><tr>${cab.map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${corpo.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
// Uma página de guia. todos: os guias (com rascunho); publicados: os que aparecem para quem não é rascunho.
function paginaGuia(g, ctx) {
  const { cab } = g, { pecas } = ctx.molde;
  const ve = outro => ctx.visiveis.has(outro) || (cab.rascunho && ctx.porEndereco.has(outro));   // um rascunho mostra rascunhos (para conferir)
  const cartao = end => {
    const o = ctx.porEndereco.get(end);
    if (!o) throw new Error(`${g.arquivo}: cartão para o guia "${end}", que não existe`);
    return preencher(pecas['cartao-de-guia'], { ENDERECO: end, TEMA_NOME: esc(TEMAS[o.cab.tema][1]), TITULO: esc(o.cab.titulo), DESCRICAO: esc(o.cab.descricao) });
  };
  const origem = 'guia-' + cab.endereco, link = linkTeste(origemParam(cab.endereco));
  const usadas = new Set(), h2 = [], partes = [];
  const linhas = g.corpo.replace(/\r\n/g, '\n').split('\n');
  let solto = [];
  const soltar = () => { if (solto.length) { const b = blocos(solto.join('\n')); partes.push(b.html); h2.push(...b.h2); } solto = []; };
  for (let i = 0; i < linhas.length; i++) {
    const m = linhas[i].match(/^:::([a-z-]+)(?: (.+))?$/);
    if (!m) { if (/^:::/.test(linhas[i])) throw new Error(`${g.arquivo}: linha "${linhas[i]}": abra a peça com ":::nome" e feche com ":::"`); solto.push(linhas[i]); continue; }
    soltar();
    const [, nome, arg = ''] = m;
    if (!PECAS.includes(nome)) throw new Error(`${g.arquivo}: a peça "${nome}" não existe (${PECAS.join(', ')})`);
    const dentro = []; i++;
    while (i < linhas.length && linhas[i] !== ':::') dentro.push(linhas[i++]);
    if (i >= linhas.length) throw new Error(`${g.arquivo}: a peça "${nome}" não foi fechada com ":::"`);
    usadas.add(nome);
    const txt = dentro.join('\n').trim(), arg2 = arg.trim();
    const exige = (c, o) => { if (!c) throw new Error(`${g.arquivo}: peça ${nome}: ${o}`); };
    if (['resposta-curta', 'na-rxsync', 'aviso'].includes(nome)) { exige(txt, 'falta o texto'); partes.push(preencher(pecas[nome], { TEXTO: blocos(txt).html })); }
    else if (nome === 'passos') {
      const itens = dentro.filter(l => l.trim()).map(l => { const k = l.match(/^(?:-|\d+\.) (.+)$/); exige(k, 'cada passo numa linha começando com "- "'); return k[1]; });
      exige(itens.length >= 2, 'pelo menos 2 passos');
      partes.push(preencher(pecas.passos, { ITENS: itens.map(t => `<li>${inline(t)}</li>`).join('') }));
    } else if (nome === 'tabela') { exige(arg2, 'a legenda vem depois do nome (:::tabela Legenda)'); partes.push(preencher(pecas.tabela, { LEGENDA: esc(textoPuro(arg2)), TABELA: tabela(dentro) })); }
    else if (nome === 'modelo-de-mensagem') { exige(arg2 && txt, 'a legenda depois do nome e o texto da mensagem dentro'); partes.push(preencher(pecas[nome], { LEGENDA: esc(textoPuro(arg2)), TEXTO: txt.split(/\n\s*\n/).map(p => `<p>${p.split('\n').map(inline).join('<br>')}</p>`).join('') })); }
    else if (nome === 'imagem') {
      const v = Object.fromEntries(dentro.filter(l => l.trim()).map(l => { const k = l.match(/^(\w+):\s*(.+)$/); exige(k, 'linhas "src:", "alt:", "legenda:", "largura:" e "altura:"'); return [k[1], k[2].trim()]; }));
      exige(v.src && /^\/[\w./-]+\.(png|jpg|jpeg|webp|svg)$/.test(v.src), 'src: um arquivo de imagem do site (/…)');
      exige(fs.existsSync(path.join(RAIZ, v.src)), `src: ${v.src} não existe`);
      exige(v.alt, 'alt: o que a imagem mostra'); exige(v.legenda, 'legenda:'); exige(/^\d+$/.test(v.largura || '') && /^\d+$/.test(v.altura || ''), 'largura: e altura: em pixels');
      partes.push(preencher(pecas.imagem, { SRC: esc(v.src), ALT: esc(textoPuro(v.alt)), LEGENDA: inline(v.legenda), LARGURA: v.largura, ALTURA: v.altura }));
    } else if (nome === 'perguntas') {
      exige(!txt, 'as perguntas vêm do cabeçalho (perguntas:); a peça fica vazia'); exige(cab.perguntas.length, 'faltam as perguntas no cabeçalho');
      h2.push({ id: 'perguntas', texto: 'Perguntas frequentes' });
      partes.push(preencher(pecas.perguntas, { ITENS: cab.perguntas.map(p => preencher(pecas.pergunta, { PERGUNTA: esc(p.pergunta), RESPOSTA: esc(p.resposta) })).join('') }));
    } else if (nome === 'chamada') {
      exige(!txt, 'o texto da chamada vem do cabeçalho (chamada-titulo e chamada-texto); a peça fica vazia');
      partes.push(preencher(pecas.chamada, { TITULO: esc(cab['chamada-titulo'] || 'Veja a assistente atender no WhatsApp da sua clínica'), TEXTO: esc(cab['chamada-texto'] || 'Ela responde, marca e lembra as consultas. Você acompanha tudo pelo painel.'), LINK_TESTE: link, ORIGEM: origem }));
    } else if (nome === 'cartao-de-guia') {
      exige(arg2 && !txt, 'o endereço do guia vem depois do nome (:::cartao-de-guia endereço)');
      exige(ve(arg2), `o guia "${arg2}" é rascunho ou não existe`);
      partes.push(`<div class="cartoes">${cartao(arg2)}</div>`);
    }
  }
  soltar();
  if (cab.perguntas.length && !usadas.has('perguntas')) throw new Error(`${g.arquivo}: há perguntas no cabeçalho, mas falta a peça :::perguntas (o Google só aceita as perguntas que aparecem na página)`);
  if (!usadas.has('chamada')) throw new Error(`${g.arquivo}: falta a peça :::chamada`);
  if (new Set(h2.map(h => h.id)).size !== h2.length) throw new Error(`${g.arquivo}: dois títulos ## iguais (a âncora do índice fica repetida)`);
  const rel = cab.relacionados.filter(ve);
  for (const r of cab.relacionados) if (!ctx.porEndereco.has(r)) throw new Error(`${g.arquivo}: relacionado "${r}" não existe`);
  const url = `${SITE}/guias/${cab.endereco}/`;
  const dados = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: textoPuro(cab.titulo), description: textoPuro(cab.descricao), datePublished: cab['publicado-em'], dateModified: cab['revisado-em'], inLanguage: 'pt-BR',
      image: `${SITE}/assets/og-rxsync.png`, mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'RXSync', url: SITE + '/' },
      publisher: { '@type': 'Organization', name: 'RXSync', url: SITE + '/', logo: { '@type': 'ImageObject', url: `${SITE}/assets/icones/rxsync-512.png` } } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guias', item: `${SITE}/guias/` },
      { '@type': 'ListItem', position: 2, name: textoPuro(cab.titulo), item: url }] },
    ...(cab.perguntas.length ? [{ '@type': 'FAQPage', mainEntity: cab.perguntas.map(p => ({ '@type': 'Question', name: p.pergunta, acceptedAnswer: { '@type': 'Answer', text: p.resposta } })) }] : [])] };
  const indice = h2.map(h => `<li><a href="#${h.id}">${esc(h.texto)}</a></li>`).join('');
  const conteudo = preencher(pecas['pagina-guia'], {
    CAMINHO_GUIAS: ctx.temPublicado ? '<a href="/guias/">Guias</a>' : 'Guias', TITULO: esc(cab.titulo), FAIXA_RASCUNHO: cab.rascunho ? pecas['faixa-rascunho'] : '',
    INDICE: indice, PUBLICADO_ISO: cab['publicado-em'], PUBLICADO: data(cab['publicado-em']), REVISADO_ISO: cab['revisado-em'], REVISADO: data(cab['revisado-em']),
    CORPO: partes.join('\n'), RELACIONADOS: rel.length ? preencher(pecas.relacionados, { CARTOES: rel.map(cartao).join('') }) : '', LINK_TESTE: link, ORIGEM: origem });
  return pagina(ctx, { TITULO_PAGINA: esc(textoPuro(cab.titulo)) + ' | Guias RXSync', TITULO: esc(textoPuro(cab.titulo)), DESCRICAO: esc(textoPuro(cab.descricao)), ROBOTS: cab.rascunho ? 'noindex, nofollow' : 'index, follow',
    URL: url, OG_TIPO: 'article', DADOS: dados, CONTEUDO: conteudo });
}
function pagina(ctx, v) {
  const html = preencher(ctx.molde.pagina, { ...v, DADOS_ESTRUTURADOS: `<script type="application/ld+json">${JSON.stringify(v.DADOS).replace(/</g, '\\u003c')}</script>`,
    MENU_GUIAS: ctx.temPublicado ? '<a href="/guias/">Guias</a>' : '', RODAPE_GUIAS: ctx.temPublicado ? '<li><a href="/guias/">Guias</a></li>' : '', CSP: '{{CSP}}' });
  return html.replace("default-src 'none'; {{CSP}}", () => cspPagina(html, PAGINA_GUIA));
}
function paginaGuias(ctx) {
  const { pecas } = ctx.molde;
  const temas = Object.entries(TEMAS).map(([k, [id, nome]]) => ({ id, nome, guias: ctx.lista.filter(g => g.cab.tema === k) })).filter(t => t.guias.length);
  const cartao = g => preencher(pecas['cartao-de-guia'], { ENDERECO: g.cab.endereco, TEMA_NOME: esc(TEMAS[g.cab.tema][1]), TITULO: esc(g.cab.titulo), DESCRICAO: esc(g.cab.descricao) });
  const conteudo = preencher(pecas['pagina-guias'], {
    TEMAS_LINKS: temas.map(t => `<li><a href="#${t.id}">${esc(t.nome)}</a></li>`).join(''),
    TEMAS: temas.map(t => preencher(pecas.tema, { TEMA_ID: t.id, TEMA_NOME: esc(t.nome), CARTOES: t.guias.map(cartao).join('') })).join('\n'),
    CHAMADA: preencher(pecas.chamada, { TITULO: 'Veja a assistente atender no WhatsApp da sua clínica', TEXTO: 'Ela responde, marca e lembra as consultas. Você acompanha tudo pelo painel.', LINK_TESTE: linkTeste('guias'), ORIGEM: 'guias' }) });
  const url = `${SITE}/guias/`;
  const dados = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: 'Guias', url, inLanguage: 'pt-BR', description: 'Guias da RXSync sobre o atendimento da clínica pelo WhatsApp, a agenda e as regras.' },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Guias', item: url }] }] };
  return pagina(ctx, { TITULO_PAGINA: 'Guias | RXSync', TITULO: 'Guias da RXSync', DESCRICAO: 'Como organizar o atendimento da clínica pelo WhatsApp, a agenda e as regras, em textos curtos e com fonte.',
    ROBOTS: 'index, follow', URL: url, OG_TIPO: 'website', DADOS: dados, CONTEUDO: conteudo });
}

// ---------------------------------------------------------------- sitemap e menu do site
export function sitemapCom(atual, lista) {
  const fora = atual.replace(/\r\n/g, '\n').replace(/  <url>\n    <loc>https:\/\/rxsync\.com\.br\/guias\/[\s\S]*?<\/url>\n/g, '');
  if (!lista.length) return fora;
  const url = (loc, mod, freq, pri) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>\n`;
  const maisNova = lista.map(g => g.cab['revisado-em']).sort().pop();
  const novos = url(`${SITE}/guias/`, maisNova, 'weekly', '0.6') + lista.map(g => url(`${SITE}/guias/${g.cab.endereco}/`, g.cab['revisado-em'], 'monthly', '0.6')).join('');
  return fora.replace('</urlset>', novos + '</urlset>');
}
// O link "Guias" no menu, no menu do celular e no rodapé da página inicial: só com pelo menos um guia publicado.
export function menuSiteCom(html, tem) {
  let s = html.replace(/\n[^\n]*data-guias[^\n]*(?=\n)/g, '');
  if (!tem) return s;
  const por = (depois, novo) => { if (!s.includes(depois)) throw new Error(`index.html: não achei "${depois.trim()}" para pôr o link "Guias"`); s = s.replace(depois, depois + '\n' + novo); };
  // No computador, o menu da página inicial já ocupa a largura toda em 1024 px: o "Guias" entra a partir de 1280 px, com
  // um pouco menos de espaço entre os itens (no celular e no rodapé, sempre).
  if (!s.includes('\n</head>')) throw new Error('index.html: não achei o </head>');
  s = s.replace('\n</head>', '\n<style data-guias>.nav a[data-guias] { display: none; } @media (min-width: 1280px) { .nav a[data-guias] { display: inline-block; } .nav a { padding-left: 9px; padding-right: 9px; } }</style>\n</head>');
  por('      <a href="#duvidas">Dúvidas</a>', '      <a href="/guias/" data-guias>Guias</a>');
  por('    <a class="item" href="#duvidas">Dúvidas</a>', '    <a class="item" href="/guias/" data-guias>Guias</a>');
  por('          <li><a href="#duvidas">Dúvidas</a></li>', '          <li data-guias><a href="/guias/">Guias</a></li>');
  return s;
}

// ---------------------------------------------------------------- montar tudo
// previa: trata os rascunhos como publicados (só para o teste de tela ver a página Guias e o menu; nada é gravado).
export function montar({ previa = false } = {}) {
  const molde = lerMolde(), guias = lerFontes();
  const lista = guias.filter(g => previa || !g.cab.rascunho);
  const ctx = { molde, lista, temPublicado: lista.length > 0, visiveis: new Set(lista.map(g => g.cab.endereco)), porEndereco: new Map(guias.map(g => [g.cab.endereco, g])) };
  const arquivos = {};
  for (const g of guias) arquivos[`guias/${g.cab.endereco}/index.html`] = paginaGuia(previa ? { ...g, cab: { ...g.cab, rascunho: false } } : g, ctx);
  if (lista.length) arquivos['guias/index.html'] = paginaGuias(ctx);
  arquivos['sitemap.xml'] = sitemapCom(fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8'), lista);
  arquivos['index.html'] = menuSiteCom(fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8'), lista.length > 0);
  return { arquivos, guias, publicados: lista };
}
// As páginas de guia que existem no repositório (para achar as que sobraram sem fonte).
export const paginasExistentes = () => !fs.existsSync(PASTA) ? [] : fs.readdirSync(PASTA, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(PASTA, d.name, 'index.html'))).map(d => `guias/${d.name}/index.html`)
  .concat(fs.existsSync(path.join(PASTA, 'index.html')) ? ['guias/index.html'] : []);

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { arquivos, guias, publicados } = montar();
  for (const f of paginasExistentes()) if (!arquivos[f]) {   // guia que saiu (só o que este montador gerou)
    const s = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    if (s.includes('/assets/ancora/guias.css')) { fs.rmSync(path.join(RAIZ, f)); try { fs.rmdirSync(path.dirname(path.join(RAIZ, f))); } catch {} console.log(`${f}: apagado (sem fonte)`); }
  }
  for (const [f, s] of Object.entries(arquivos)) {
    const alvo = path.join(RAIZ, f); fs.mkdirSync(path.dirname(alvo), { recursive: true });
    if (!fs.existsSync(alvo) || fs.readFileSync(alvo, 'utf8') !== s) { fs.writeFileSync(alvo, s); console.log(`${f}: gravado`); }
  }
  console.log(`Guias: ${guias.length} fonte(s), ${publicados.length} publicado(s).`);
}
