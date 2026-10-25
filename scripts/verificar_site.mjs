// Conferência do site em todo pull request: links e imagens internos existem, JSON válido,
// todas as páginas apontam para o mesmo n8n e nenhuma aponta para endereço de teste.
import fs from 'node:fs'; import path from 'node:path';
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io';
const LIMITE_PAINEL_KB = 400;
let erros = 0; const erro = m => { erros++; console.log('::error::' + m); };
const todos = [];
(function andar(d) { for (const f of fs.readdirSync(d)) { if (f.startsWith('.') || f === 'node_modules' || f === 'scripts') continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? andar(p) : todos.push(p); } })('.');
const htmls = todos.filter(f => f.endsWith('.html'));
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  if (!/<title>[^<]+<\/title>/i.test(s)) erro(`${f}: página sem <title>`);
  for (const m of s.matchAll(/\b(?:href|src)\s*=\s*"([^"]+)"/gi)) {
    let u = m[1].trim();
    if (!u || /^(https?:|mailto:|tel:|#|javascript:|data:|\/\/|\{|\$)/i.test(u) || /['+]/.test(u) || u.includes('${')) continue;
    u = u.split('#')[0].split('?')[0]; if (!u) continue;
    let alvo = u.startsWith('/') ? path.join('.', u) : path.join(path.dirname(f), u);
    try { alvo = decodeURIComponent(alvo); } catch {}
    if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html');
    if (!fs.existsSync(alvo) && !fs.existsSync(alvo + '.html')) erro(`${f}: link para "${m[1]}", que não existe no repositório`);
  }
  for (const m of s.matchAll(/https?:\/\/[a-z0-9.-]*sslip\.io/gi)) if (m[0] !== N8N) erro(`${f}: aponta para outro n8n (${m[0]})`);
  if (/https?:\/\/(localhost|127\.0\.0\.1)/i.test(s)) erro(`${f}: tem endereço de teste (localhost)`);
}
// Central RXSync (central/): sem nada de fora, noindex e a CSP com o resumo certo do script e do estilo.
{
  const { cspCentral, N8N: N8N_CENTRAL } = await import('./central_csp.mjs');
  const arq = 'central/index.html';
  if (fs.existsSync(arq)) {
    const s = fs.readFileSync(arq, 'utf8');
    if (!/<meta name="robots" content="noindex, nofollow">/.test(s)) erro(`${arq}: falta noindex`);
    const csp = (s.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/) || [])[1];
    if (!csp) erro(`${arq}: falta a CSP`);
    else if (csp !== cspCentral(s)) erro(`${arq}: a CSP não bate com o script ou o estilo da página (rode node scripts/central_csp.mjs)`);
    if (N8N_CENTRAL !== N8N) erro('scripts/central_csp.mjs: endereço do n8n diferente do verificar_site.mjs');
    if ((s.match(/<script/g) || []).length !== 1) erro(`${arq}: só pode ter um <script>, dentro da página`);
    for (const m of s.matchAll(/\b(?:src|href)\s*=\s*"(https?:[^"]*)"/gi)) erro(`${arq}: carrega coisa de fora (${m[1]})`);
    if (/style="/.test(s)) erro(`${arq}: atributo style= é bloqueado pela CSP; use uma classe`);
    // Ícones: todo <svg> de ícone tem a classe "icone", e a regra dela tem tamanho fixo de até 48 px.
    // A foto de todas as telas (scripts/central_telas.mjs) confere o mesmo na página de verdade.
    const regra = (s.match(/svg\.icone\s*\{([^}]*)\}/) || [])[1] || '';
    const px = k => Number(((regra.match(new RegExp('(?:^|;)\\s*' + k + '\\s*:\\s*(\\d+)px')) || [])[1]) || 0);
    if (!px('width') || !px('height') || px('width') > 48 || px('height') > 48) erro(`${arq}: os ícones precisam de tamanho fixo de até 48 px (regra svg.icone)`);
    if (!/createElementNS\('http:\/\/www\.w3\.org\/2000\/svg', 'svg'\); s\.setAttribute\('class', 'icone'( \+ [^)]*)?\)/.test(s)) erro(`${arq}: a função icone() precisa pôr a classe "icone" no <svg>`);
    // localStorage: só a aparência (automática, clara ou escura, 'central_aparencia', DEC-067) e a lembrança do aparelho
    // ('central_lembranca', DEC-109; o banco guarda só o SHA-256). Nada mais da Central fica no aparelho.
    for (const m of s.matchAll(/localStorage\s*\.\s*(\w+)\s*\(\s*([^,)]*)/g)) if (!['getItem', 'setItem', 'removeItem'].includes(m[1]) || !["'central_aparencia'", "'central_lembranca'"].includes(m[2].trim())) erro(`${arq}: só a aparência e a lembrança do aparelho podem ir para o localStorage (achei ${m[0]})`);
    if (/localStorage\s*\[|localStorage\s*\.\s*(?!getItem|setItem|removeItem)\w/.test(s)) erro(`${arq}: localStorage só com getItem, setItem ou removeItem da aparência e da lembrança`);
    // A lembrança só é gravada se tiver o formato do servidor (64 letras de 0-9a-f) e só sai da página pelo retomar,
    // pelo lembranca_usada e pelo sair (para ser esquecida).
    if (!/lembrancaNova\(v\) \{ if \(!\/\^\[0-9a-f\]\{64\}\$\/\.test\(v \|\| ''\)\) return;/.test(s)) erro(`${arq}: a lembrança do aparelho só é guardada com o formato do servidor (64 letras de 0-9a-f)`);
    // Dados sensíveis (CPF, CNPJ, e-mail, telefone) nunca ficam no navegador: só a sessão vai para o sessionStorage.
    for (const m of s.matchAll(/sessionStorage\.setItem\(\s*([^,)]*)/g)) if (m[1].trim() !== "'central_sessao'") erro(`${arq}: só a sessão pode ir para o sessionStorage (achei ${m[1].trim()})`);
    if (/indexedDB|document\.cookie|caches\.open/.test(s)) erro(`${arq}: nada da Central fica no navegador (indexedDB, cookie ou cache)`);
    // Ficha da clínica (DEC-065): CPF e CNPJ só nos "Dados protegidos", pedidos na hora pela ação cliente_sensivel
    // e marcados com data-sensivel (somem quando a Central vai para o fundo).
    if (!/chamar\('cliente_sensivel'/.test(s) || !/'data-sensivel'/.test(s) || !/querySelectorAll\('\[data-sensivel\]'\)/.test(s)) erro(`${arq}: faltam os dados protegidos (cliente_sensivel com data-sensivel, escondidos ao sair da tela)`);
    // Página montada (DEC-068): central/index.html é exatamente o que o central_montar.mjs gera a partir de central/fonte/.
    try { const { montar } = await import('./central_montar.mjs'); if (montar() !== s) erro(`${arq}: diferente do que central/fonte/ monta (rode node scripts/central_montar.mjs e não edite a página à mão)`); }
    catch (e) { erro(`central/fonte: não consegui montar a Central (${e.message})`); }
    // Toda ação de edição tem nível no servidor (sql/030, sql/031 e sql/036, rx_central_niveis). Ação nova precisa entrar lá e aqui.
    // ligar_chave: um toque (DEC-066); as chaves do motor da prospecção sobem para 2 ou 3 ao ligar (rx_central, sql/031).
    const NIVEIS = { 1: ['cliente_editar_assistente', 'cliente_editar_configuracoes', 'cliente_editar_recursos', 'editar_limites', 'franquia_aviso_registrar', 'chave_api_limites', 'asaas_foto_atualizar', 'ligar_chave',
        'prosp_campanha_salvar', 'prosp_conjunto_salvar', 'prosp_anuncio_salvar', 'prosp_duplicar', 'prosp_regra_salvar', 'prosp_regra_ligar', 'prosp_anotar', 'prosp_custos_salvar', 'prosp_relatorio_salvar', 'prosp_numero_situacao', 'prosp_lead_aprovar', 'prosp_lead_marcar', 'prosp_lead_assumir',
        'prosp_publico_salvar', 'prosp_publico_renomear', 'prosp_publico_duplicar', 'prosp_publico_contato_marcar',
        'dem_criar', 'dem_desativar', 'dem_reativar', 'dem_ver'],
      2: ['situacao_pausar', 'situacao_retomar', 'situacao_reativar', 'cancelamento_desfazer', 'link_painel_reenviar', 'link_conectar_reenviar', 'reenviar_onboarding', 'recurso_liberar', 'recurso_revogar',
        'cliente_editar_empresa', 'chave_api_criar', 'aviso_destino_definir', 'aviso_destino_desligar', 'desfazer', 'sair_todos', 'aparelho_esquecer',
        'prosp_ligar', 'prosp_apagar_rascunho', 'prosp_numero_criar', 'prosp_numero_qr', 'prosp_numero_desconectar', 'prosp_numero_webhook', 'prosp_numero_teto', 'prosp_buscar_agora', 'prosp_leads_aprovar_todos', 'prosp_lead_nao_contatar', 'prosp_lead_devolver', 'prosp_exportar',
        'prosp_publico_buscar', 'prosp_publico_contatos_lote', 'prosp_publico_arquivar', 'prosp_creditos_teto_salvar', 'prosp_sugerir',
        'dem_editar', 'conversas_enviar'],
      3: ['plano_trocar', 'situacao_suspender', 'cancelamento_agendar', 'preco_especial', 'cobranca_proxima_data', 'cobranca_vencimento', 'implantacao_isentar', 'pagamento_receber_dinheiro',
        'teste_estender', 'link_painel_novo', 'chave_api_revogar', 'cobranca_teste_definir', 'prosp_encerrar', 'prosp_numero_apagar',
        'dem_apagar'] };
    // proposta_confirmar (IA da Central, sql/061, DEC-145): o nível é o da ação proposta, que o servidor manda com a proposta.
    const conhecidas = new Set([...Object.values(NIVEIS).flat(), 'proposta_confirmar']);
    // O assistente espera as 4 rodadas do 06 (até 60 segundos cada) com folga, e só então diz que não respondeu.
    const espera = Number((s.match(/const ESPERA_ASSISTENTE = (\d+);/) || [])[1]);
    if (!(espera >= 240000 && espera <= 300000)) erro(`${arq}: ESPERA_ASSISTENTE precisa ficar entre 4 e 5 minutos (o 06 faz até 4 rodadas de 60 segundos)`);
    if (!/limite: ESPERA_ASSISTENTE/.test(s) || !s.includes("'O assistente não respondeu agora. Tente de novo.'")) erro(`${arq}: a pergunta ao assistente precisa usar o limite ESPERA_ASSISTENTE e a mensagem de "não respondeu"`);
    for (const m of s.matchAll(/\b(?:fazer|pedirAcao)\(\s*'([a-z_]+)'/g)) if (!conhecidas.has(m[1])) erro(`${arq}: a ação ${m[1]} não tem nível (sql/030); ponha em rx_central_niveis() e na lista do verificar_site.mjs`);
    for (const m of s.matchAll(/\bformGrupo\([^;]*?, '([a-z_]+)', '/g)) if (!conhecidas.has(m[1])) erro(`${arq}: a ação ${m[1]} não tem nível (sql/030)`);
    for (const m of s.matchAll(/\b(?:fazer|pedirAcao)\(\s*([^'\s][^,)]*)/g)) if (!/^(acao|a|x\.acao|op\.acao)$/.test(m[1].trim())) erro(`${arq}: chame fazer/pedirAcao com o nome da ação escrito ('...'), para o verificar conferir o nível (achei ${m[1].trim()})`);
    if (/\.innerHTML\s*=/.test(s)) erro(`${arq}: use textContent (innerHTML deixa o texto do servidor virar código)`);
    // Sem Face ID (DEC-109, substitui a DEC-095): nada de passkey nem das ações dela na página.
    if (/navigator\.credentials|PublicKeyCredential|retomar_desafio|aparelho_desafio|aparelho_ativar/.test(s)) erro(`${arq}: a Central não usa mais Face ID (passkey); a entrada lembrada é pela lembrança do aparelho (DEC-109)`);
    // Entrada da Central: e-mail + senha + código no Telegram. Nada de app autenticador, e nenhum endereço de e-mail
    // escrito na página (o e-mail do administrador fica só no servidor).
    if (/otpauth:|totp|base32|app Senhas/i.test(s)) erro(`${arq}: a Central não usa mais app autenticador (otpauth, TOTP ou "app Senhas" na página)`);
    for (const m of s.matchAll(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi)) erro(`${arq}: tem um endereço de e-mail escrito na página (${m[0]}); ele fica só no servidor`);
  }
}
// Páginas com a regra de segurança do navegador (CSP) gravada pelo scripts/csp.mjs: a regra bate com o script e o
// estilo da página, e nada que a regra bloquearia (atributo style= ou on…= no HTML ou nas marcas montadas pelo código).
{
  const { PAGINAS, cspPagina, META_CSP, N8N: N8N_CSP } = await import('./csp.mjs');
  if (N8N_CSP !== N8N) erro('scripts/csp.mjs: endereço do n8n diferente do verificar_site.mjs');
  const ESTILO_LIVRE = /^(index\.html|teste\.html|termos\/2026-10-v[1-6]\.html)$/;
  for (const [arq, p] of Object.entries(PAGINAS)) {
    const s = fs.readFileSync(arq, 'utf8');
    const csp = (s.match(META_CSP) || [])[1];
    if (!csp) erro(`${arq}: falta a regra de segurança (rode node scripts/csp.mjs)`);
    else if (csp !== cspPagina(s, p)) erro(`${arq}: a regra de segurança não bate com o script ou o estilo da página (rode node scripts/csp.mjs)`);
    if (s.search(META_CSP) > s.search(/<(script|style|link)\b/)) erro(`${arq}: a regra de segurança precisa vir antes de qualquer <script>, <style> ou <link>`);
    // <script>: dentro da página, um arquivo do próprio site ou os dados estruturados (application/ld+json, que não rodam).
    for (const m of s.matchAll(/<script\b([^>]*)>/g)) {
      const at = m[1].trim(), src = (at.match(/\bsrc="([^"]*)"/) || [])[1];
      if (!at || at === 'type="application/ld+json"') continue;
      if (!src || /^(https?:)?\/\//i.test(src)) erro(`${arq}: <script ${at}>: só um arquivo do próprio site (ou o código dentro da página)`);
      else if (!/vendor\//.test(src)) {
        const js = fs.readFileSync(src.startsWith('/') ? '.' + src : path.join(path.dirname(arq), src), 'utf8');
        if (/\sstyle\s*=\s*\\?["']/.test(js)) erro(`${src} (usado em ${arq}): monta marca com style=, que a regra de segurança bloqueia; use uma classe`);
        if (/<[a-z][^<>]*\son[a-z]+\s*=\s*\\?["']/i.test(js)) erro(`${src} (usado em ${arq}): monta marca com on…=, que a regra de segurança bloqueia; use addEventListener`);
      }
    }
    // Estilo livre ('unsafe-inline'): só nas páginas com o chat dentro e nos Termos antigos (v1 a v6), que não mudam.
    if (p.estiloLivre && !ESTILO_LIVRE.test(arq)) erro(`${arq}: estilo livre ('unsafe-inline') só no index.html, no teste.html e nos Termos v1 a v6`);
    if (p.atributoEstilo && !/^termos\/2026-10-v[1-6]\.html$/.test(arq)) erro(`${arq}: style= no HTML só nos Termos v1 a v6, que não mudam`);
    if (/script-src[^;]*'unsafe-(inline|eval)'/.test(csp || '')) erro(`${arq}: script nunca com 'unsafe-inline' nem 'unsafe-eval'`);
    if (!p.atributoEstilo && /\sstyle\s*=\s*["']/.test(s)) erro(`${arq}: atributo style= é bloqueado pela regra de segurança; use uma classe`);
    if (/<[a-z][^<>]*\son[a-z]+\s*=\s*["']/i.test(s)) erro(`${arq}: atributo on…= (onclick etc.) é bloqueado pela regra de segurança; use addEventListener`);
    if (/javascript:/i.test(s)) erro(`${arq}: link javascript: é bloqueado pela regra de segurança`);
  }
}
// Nenhuma página publicada sem a regra de segurança: as da lista do scripts/csp.mjs, a Central (a dela) e as fontes da
// Central e do painel (que não rodam nada sozinhas). Exceção: a demonstração antiga, que não recebe mais mudanças; só as páginas que
// existem hoje nela (uma página nova ali também precisa da regra).
{
  const { PAGINAS } = await import('./csp.mjs');
  const ANTIGA = 'demo/drandrepontes/';
  const ANTIGA_PAGINAS = ['app/clean/index.html', 'app/couro/index.html', 'app/cyber/index.html', 'app/index.html', 'datalog/index.html', 'escopo/index.html',
    'escopo/resumo/index.html', 'fluxo/index.html', 'index.html', 'painel/clean/index.html', 'painel/couro/index.html', 'painel/cyber/index.html', 'painel/index.html',
    'questionario/index.html'].map(f => ANTIGA + f);
  for (const f of htmls.map(h => h.split(path.sep).join('/').replace(/^\.\//, ''))) {
    if (PAGINAS[f] || f === 'central/index.html' || ANTIGA_PAGINAS.includes(f)) continue;
    if (f === 'painel/fonte/pagina.html') { if (!/<meta http-equiv="Content-Security-Policy" content="default-src 'none'; \{\{CSP\}\}">/.test(fs.readFileSync(f, 'utf8'))) erro(`${f}: a fonte do painel precisa da regra default-src 'none' (que a montagem troca pela de verdade)`); continue; }
    if (f === 'central/fonte/pagina.html') { if (!/<meta http-equiv="Content-Security-Policy" content="default-src 'none'; \{\{CSP\}\}">/.test(fs.readFileSync(f, 'utf8'))) erro(`${f}: a fonte da Central precisa da regra default-src 'none' (que a montagem troca pela de verdade)`); continue; }
    erro(`${f}: página sem a regra de segurança; ponha na lista PAGINAS do scripts/csp.mjs e rode node scripts/csp.mjs`);
  }
  for (const f of ANTIGA_PAGINAS) if (!fs.existsSync(f)) erro(`${f}: saiu da demonstração antiga; tire da lista ANTIGA_PAGINAS do verificar_site.mjs`);
}
// Painel (autoedicao.html e o novo, painel/index.html, DEC-156): o que a clínica pode usar vem de "recursos" do servidor
// (DEC-063), não do nome do plano.
for (const arq of ['autoedicao.html', 'painel/index.html']) {
  const novo = arq === 'painel/index.html';
  if (fs.existsSync(arq)) {
    const s = fs.readFileSync(arq, 'utf8');
    if (!/resp\.recursos/.test(s)) erro(`${arq}: o painel precisa ler "recursos" da resposta do abrir (DEC-063)`);
    if ((s.match(/\/\^essencial\//g) || []).length > 1) erro(`${arq}: o plano só pode ser conferido pelo nome na regra de reserva (servidor sem "recursos")`);
    if (/PLANO_ESSENCIAL/.test(s)) erro(`${arq}: PLANO_ESSENCIAL voltou; use sem("recurso")`);
    // Entrada com e-mail e senha (DEC-097): no navegador, só a sessão (sessionStorage 'painel_sessao', some ao fechar a aba)
    // e a lembrança do aparelho (localStorage 'painel_lembranca'); todo pedido ao n8n leva a sessão pelo cabeçalho (cab());
    // a página não monta mais link com o token nem pede o "reenviar o link".
    for (const m of s.matchAll(/localStorage\s*\.\s*(\w+)\s*\(\s*([^,)]*)/g)) if (!['getItem', 'setItem', 'removeItem'].includes(m[1]) || m[2].trim() !== "'painel_lembranca'") erro(`${arq}: só a lembrança do aparelho pode ir para o localStorage (achei ${m[0]})`);
    for (const m of s.matchAll(/sessionStorage\s*\.\s*(\w+)\s*\(\s*([^,)]*)/g)) if (!['getItem', 'setItem', 'removeItem'].includes(m[1]) || m[2].trim() !== "'painel_sessao'") erro(`${arq}: só a sessão pode ir para o sessionStorage (achei ${m[0]})`);
    if (/indexedDB|document\.cookie|caches\.open|(?:local|session)Storage\s*\[/.test(s)) erro(`${arq}: nada além da sessão e da lembrança fica no navegador`);
    if (!novo) {
      for (const m of s.matchAll(/fetch\((\w+_?WEBHOOK|WEBHOOK)[^;]*?headers:\s*([^,]+),/g)) if (m[1] !== 'ENTRADA_WEBHOOK' && m[2].trim() !== 'cab()') erro(`${arq}: o pedido ao ${m[1]} precisa levar a sessão do painel (headers: cab())`);
      if ((s.match(/headers: cab\(\)/g) || []).length < 5) erro(`${arq}: os 5 endpoints do painel (24, 13, 32, 12 e 23) precisam de headers: cab()`);
    } else {
      // O painel novo fala com o n8n por um lugar só (pedir), sempre com cab(); o outro fetch é a lista de municípios do site.
      const fetches = [...s.matchAll(/\bfetch\(([^,)]*)/g)].map(m => m[1].trim());
      if (fetches.filter(f => f === 'url').length !== 1 || !/fetch\(url, \{ method: 'POST', headers: cab\(/.test(s)) erro(`${arq}: todo pedido ao n8n passa pelo pedir(), com headers: cab() (a sessão do painel)`);
      for (const f of fetches) if (f !== 'url' && !/^'\/assets\//.test(f)) erro(`${arq}: fetch(${f}): fora do pedir(), só arquivo do próprio site (/assets/)`);
      if (!/<meta name="robots" content="noindex, nofollow">/.test(s)) erro(`${arq}: falta noindex`);
      // Página montada (DEC-156): painel/index.html é exatamente o que o painel_montar.mjs gera a partir de painel/fonte/ e
      // do assets/ancora/tokens.css (o arquivo único de cores e tamanhos).
      try { const { montar } = await import('./painel_montar.mjs'); if (montar() !== s) erro(`${arq}: diferente do que painel/fonte/ monta (rode node scripts/painel_montar.mjs e não edite a página à mão)`); }
      catch (e) { erro(`painel/fonte: não consegui montar o painel (${e.message})`); }
      // Peso: o painel antigo tem 405 KB num arquivo só; o novo não pode passar de 400 KB (rxsync-sistema docs/front/plano.md).
      const kb = Buffer.byteLength(s, 'utf8') / 1024;
      if (kb > LIMITE_PAINEL_KB) erro(`${arq}: ${kb.toFixed(0)} KB, acima do limite de ${LIMITE_PAINEL_KB} KB (rxsync-sistema docs/front/plano.md)`);
      // Regras da P12 (rxsync-sistema docs/mapa/painel-novo.md, seção 11), lidas no estilo do painel (tokens + fontes):
      const estilo = ['assets/ancora/tokens.css', ...fs.readdirSync('painel/fonte').filter(x => x.endsWith('.css')).map(x => 'painel/fonte/' + x)]
        .map(f => fs.readFileSync(f, 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
      const regras = [...estilo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), dec: m[2] }));
      const p12 = m => erro(`painel (estilo): ${m} (P12, rxsync-sistema docs/mapa/painel-novo.md, seção 11)`);
      for (const c of ['#B4741A', '#5E676E']) if (new RegExp(c, 'i').test(estilo + s)) p12(`a cor ${c} saiu da paleta`);
      if (/figtree/i.test(estilo) || /figtree/i.test(s.replace(/<style>[\s\S]*?<\/style>/, ''))) p12('Figtree é a letra do site; o painel usa Inter');
      for (const r of regras) {
        for (const m of r.dec.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) if (+m[1] < 12) p12(`${r.sel}: texto de ${m[1]} px (mínimo 12)`);
        for (const m of r.dec.matchAll(/font-weight:\s*(\w+)/g)) if (m[1] === 'bold' || m[1] === 'bolder' || +m[1] > 600) p12(`${r.sel}: peso ${m[1]} (máximo 600)`);
        for (const m of r.dec.matchAll(/box-shadow:\s*([^;]+)/g)) if (!/^(none|var\(--sombra-(menu|janela)\))$/.test(m[1].trim())) p12(`${r.sel}: sombra ${m[1].trim()} (só var(--sombra-menu) ou var(--sombra-janela), em menu, janela e folha)`);
        for (const m of r.dec.matchAll(/(?:transition|animation)(?:-duration)?:\s*([^;]+)/g)) for (const t of m[1].matchAll(/(\d+(?:\.\d+)?)(ms|s)\b|var\((--[\w-]+)\)/g)) {
          const ms = t[3] ? (t[3] === '--mov' ? 200 : t[3] === '--mov-salvo' && /salvo/.test(r.sel) ? 0 : 9999) : t[2] === 's' ? +t[1] * 1000 : +t[1];
          if (ms > 300 && !/!important/.test(m[1])) p12(`${r.sel}: animação de ${t[0]} (máximo 300 ms; o "Salvo" usa var(--mov-salvo))`);
        }
        if (/\.entrada|input|select|textarea/.test(r.sel) && /var\(--borda\)/.test(r.dec)) p12(`${r.sel}: campo com a borda clara (#E3E7E8); use var(--borda-campo), de 3:1`);
      }
      if (/prefers-color-scheme/.test(estilo)) p12('o escuro só vale pela escolha da pessoa (data-tema), nunca pelo aparelho');
      if (!/prefers-reduced-motion:\s*reduce/.test(estilo)) p12('falta a regra de "Reduzir movimento"');
      if (!/body\s*\{[^}]*font-variant-numeric:\s*tabular-nums/.test(estilo)) p12('os números precisam de largura fixa (font-variant-numeric: tabular-nums no body)');
      // Cores e tamanhos só no assets/ancora/tokens.css: nas fontes do painel, nenhuma cor solta (#abc, rgb()).
      for (const f of fs.readdirSync('painel/fonte').filter(x => /\.(css|js)$/.test(x) && x !== '00_cinza.css')) {
        const t = fs.readFileSync(path.join('painel/fonte', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
        for (const m of t.matchAll(/#[0-9a-fA-F]{3,8}\b(?![\w-])|rgba?\([^)]*\)/g)) if (!/^#(FFFFFF|fff)$/i.test(m[0]) || f.endsWith('.js')) erro(`painel/fonte/${f}: cor solta ${m[0]}; use uma variável do assets/ancora/tokens.css`);
      }
    }
    if (/autoedicao\.html\?t=|chamar\("reenviar"/.test(s)) erro(`${arq}: o painel não monta mais link com o token nem pede o "reenviar" (DEC-097)`);
  }
}
// Preços (BlushingMoonlight/rxsync-sistema#79): o index.html, o contratar.html e o painel mostram os preços da cópia
// oficial (scripts/precos_oficiais.json, que espelha a tabela precos do banco).
{
  const P = JSON.parse(fs.readFileSync('scripts/precos_oficiais.json', 'utf8'));
  const num = t => Number(String(t).replace(/\./g, '').replace(',', '.'));
  const br = n => n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const planos = ['essencial', 'gestao'];
  const ler = f => fs.readFileSync(f, 'utf8');
  const confere = (f, achou, esperado, oque) => { if (String(achou) !== String(esperado)) erro(`${f}: ${oque} é ${achou}, mas o preço oficial é ${esperado} (scripts/precos_oficiais.json, rxsync-sistema#79)`); };
  // Taxa de implantação: toda menção "R$ NNN de implantação" e o valor_setup do mensal.
  for (const f of ['index.html', 'contratar.html']) for (const m of ler(f).matchAll(/R\$\s*([\d.]+)\s+de implantação/g)) confere(f, m[1], P.implantacao, 'a implantação');
  confere('contratar.html', (ler('contratar.html').match(/valor_setup:\s*ciclo === 'mensal' \? '([\d.]+)'/) || [])[1], P.implantacao, 'o valor_setup do mensal');
  // contratar.html: o objeto PLANOS.
  const c = ler('contratar.html');
  for (const k of planos) {
    const m = c.match(new RegExp(k + ":\\s*\\{[^}]*?mensal:\\s*'?([\\d.,]+)'?,\\s*anual12:\\s*'([\\d.,]+)',\\s*anualTotal:\\s*'([\\d.,]+)',\\s*avista:\\s*'([\\d.,]+)'"));
    if (!m) { erro(`contratar.html: não achei os preços de ${k} no objeto PLANOS`); continue; }
    confere('contratar.html', m[1], P[k].mensal, `a mensalidade do ${k}`); confere('contratar.html', m[2], P[k].parcelado, `o anual em 12x do ${k}`);
    confere('contratar.html', m[3], br(num(P[k].parcelado) * 12), `o total do anual em 12x do ${k}`); confere('contratar.html', m[4], P[k].avista, `o anual à vista do ${k}`);
  }
  // autoedicao.html e o painel novo: a tabela da aba Assinatura (Conta › Plano e pagamento).
  for (const f of ['autoedicao.html', 'painel/index.html']) {
  const a = ler(f);
  for (const k of planos) {
    const m = a.match(new RegExp(k + ':\\s*\\{[^}]*?mensal:\\s*"([\\d.,]+)",\\s*parcelado:\\s*"([\\d.,]+)",\\s*avista:\\s*"([\\d.,]+)"'));
    if (!m) { erro(`${f}: não achei os preços de ${k} em ASSIN_PRECOS`); continue; }
    confere(f, m[1], P[k].mensal, `a mensalidade do ${k}`); confere(f, m[2], P[k].parcelado, `o anual em 12x do ${k}`); confere(f, m[3], P[k].avista, `o anual à vista do ${k}`);
  }
  }
  // index.html: os cards (mensal e 12x), o "à vista" do texto e o preço do JSON-LD.
  const ix = ler('index.html');
  const pares = [...ix.matchAll(/data-mensal="(\d+)" data-anual="([\d,]+)"/g)].map(m => m[1] + '|' + m[2]);
  for (const k of planos) if (!pares.includes(P[k].mensal + '|' + P[k].parcelado)) erro(`index.html: o card do ${k} não mostra R$ ${P[k].mensal} e 12x de R$ ${P[k].parcelado} (rxsync-sistema#79)`);
  for (const p of pares) if (!planos.some(k => p === P[k].mensal + '|' + P[k].parcelado)) erro(`index.html: card com preço que não é oficial (${p.replace('|', ' / ')}; rxsync-sistema#79)`);
  for (const m of ix.matchAll(/12x de R\$ ([\d,]+) ou R\$ ([\d.]+) à vista/g)) { const k = planos.find(k => P[k].parcelado === m[1]); if (!k) erro(`index.html: 12x de R$ ${m[1]} não é oficial`); else confere('index.html', m[2], P[k].avista.replace(/,00$/, ''), `o à vista do ${k}`); }
  // Calculadora da página: "O plano Essencial custa R$ NNN por mês" e a conta Math.ceil(NNN / valor).
  for (const m of ix.matchAll(/Essencial custa R\$ (\d+) por mês/g)) confere('index.html', m[1], P.essencial.mensal, 'o preço da calculadora');
  for (const m of ix.matchAll(/Math\.ceil\((\d+) \/ val\)/g)) confere('index.html', m[1], P.essencial.mensal, 'a conta da calculadora');
  // JSON-LD (rxsync-sistema DEC-117): só as mensalidades, o anual à vista e a implantação oficiais.
  const precoLd = t => num(t).toFixed(2);
  const oficiaisLd = new Set([...planos.flatMap(k => [precoLd(P[k].mensal), precoLd(P[k].avista)]), precoLd(P.implantacao)]);
  for (const m of ix.matchAll(/"price":\s*"([\d.]+)"/g)) if (!oficiaisLd.has(m[1])) erro(`index.html: o preço ${m[1]} do JSON-LD não é um preço oficial (rxsync-sistema#79)`);
  for (const m of ix.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { erro(`index.html: JSON-LD inválido (${e.message})`); } }
}
// Fontes no próprio site (rxsync-sistema DEC-117): nenhuma página chama o Google Fonts, e todo arquivo citado no
// assets/fontes/fontes.css existe.
{
  for (const f of todos.filter(f => /\.(html|css|js)$/.test(f))) if (/fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(f, 'utf8'))) erro(`${f}: carrega fonte do Google; use /assets/fontes/fontes.css (DEC-117)`);
  const css = 'assets/fontes/fontes.css';
  if (!fs.existsSync(css)) erro(`${css}: não existe`);
  else for (const m of fs.readFileSync(css, 'utf8').matchAll(/url\('([^']+)'\)/g)) if (!fs.existsSync(path.join('.', m[1]))) erro(`${css}: a fonte ${m[1]} não existe`);
}
// Bibliotecas no próprio site (rxsync-sistema#104; Política, seção 9): nenhuma página fora da demo/ carrega script de
// CDN (cdnjs, jsDelivr, unpkg). O Chart.js do painel fica em assets/vendor/.
{
  for (const f of todos.filter(f => /\.(html|js)$/.test(f) && !f.startsWith('demo' + path.sep) && !f.startsWith('demo/') && !f.startsWith('scripts'))) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/https?:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)[^"'\s]*/g)) erro(`${f}: carrega ${m[0]} de fora; guarde a biblioteca em assets/vendor/ (rxsync-sistema#104)`);
  }
}
// Política de Privacidade (rxsync-sistema DEC-143): a versão do selo, a do texto e a primeira do histórico são a mesma; e
// as promessas sem prova não voltam ao texto antes de existirem (o histórico de versões fica de fora).
{
  const pol = fs.readFileSync('privacidade.html', 'utf8');
  const selo = (pol.match(/>Versão (\d{4}-\d{2}-v\d+)<\/span>/) || [])[1], texto = (pol.match(/<p><strong>Versão (\d{4}-\d{2}-v\d+)<\/strong>/) || [])[1],
    hist = (pol.match(/<li><strong>(\d{4}-\d{2}-v\d+)<\/strong>, vigente/) || [])[1];
  if (!selo || selo !== texto || texto !== hist) erro(`privacidade.html: a versão do selo (${selo}), a do texto (${texto}) e a primeira do histórico (${hist}) têm de ser a mesma`);
  const corpoPol = pol.replace(/<li><strong>\d{4}-\d{2}-v\d+<\/strong>, vigente[\s\S]*?<\/li>/g, '');
  for (const frase of ['cópias de segurança criptografadas', 'sem exposição à rede pública', 'separado do de testes', 'termo de confidencialidade', 'Cópias de segurança (backup)', 'Quero conversar',
    'menor privilégio', 'Expurgados automaticamente após a resolução do atendimento', 'backup diário', 'atualização periódica'])
    if (corpoPol.includes(frase)) erro(`privacidade.html: "${frase}" voltou ao texto (sem prova ou fora do produto; rxsync-sistema#101, DEC-143)`);
}
// Página da exclusão da conta (rxsync-sistema DEC-114): noindex, nada de fora além do n8n, sem Google Analytics nem
// chat, e nada guardado no navegador (o link do e-mail fica só na memória da página).
{
  const arq = 'conta-excluir.html';
  if (!fs.existsSync(arq)) erro(`${arq}: não existe`);
  else {
    const s = fs.readFileSync(arq, 'utf8');
    if (!/<meta name="robots" content="noindex, nofollow">/.test(s)) erro(`${arq}: falta noindex`);
    if (/consentimento\.js|googletagmanager|gtag\(|chatwoot/i.test(s)) erro(`${arq}: sem Google Analytics e sem chat`);
    for (const m of s.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) erro(`${arq}: script de fora não pode (${m[1]})`);
    if (/localStorage|sessionStorage|indexedDB|document\.cookie/.test(s)) erro(`${arq}: nada pode ficar guardado no navegador`);
    if (!/conta_exclusao_ver/.test(s) || !/conta_exclusao_confirmar/.test(s)) erro(`${arq}: precisa de conta_exclusao_ver (ao abrir) e conta_exclusao_confirmar (no botão)`);
  }
  for (const f of ['conectar.html', 'autoedicao.html', 'onboarding.html', 'teste.html']) if (fs.existsSync(f) && !/<meta name="robots" content="noindex/.test(fs.readFileSync(f, 'utf8'))) erro(`${f}: falta noindex (página de cliente, DEC-117)`);
}
// Termos vigentes (rxsync-sistema#103): a Política e as outras páginas citam a versão mais nova dos Termos (o maior
// termos/AAAA-MM-vN.html). Só avisa (não bloqueia): dá para publicar os Termos novos antes de trocar os links. O histórico
// de versões da Política (os <li> que começam com a versão em negrito) fica de fora.
let avisosTermos = 0;
{
  const versoes = fs.existsSync('termos') ? fs.readdirSync('termos').map(f => (f.match(/^(\d{4}-\d{2})-v(\d+)\.html$/) || []).slice(1)).filter(x => x.length) : [];
  const nova = versoes.sort((a, b) => Number(a[1]) - Number(b[1]) || a[0].localeCompare(b[0])).pop();
  if (nova) {
    const vigente = `${nova[0]}-v${nova[1]}`;
    for (const f of htmls.filter(f => !f.startsWith('termos' + path.sep))) {
      const s = fs.readFileSync(f, 'utf8').replace(/<li><strong>\d{4}-\d{2}-v\d+<\/strong>[\s\S]*?<\/li>/g, '');
      const citadas = new Set([...s.matchAll(/termos\/(\d{4}-\d{2}-v\d+)\.html/g)].map(m => m[1]));
      for (const m of s.matchAll(/\b(?:VERSAO|VERSAO_TERMOS|TERMOS_ASAAS)\s*=\s*["'](\d{4}-\d{2}-v\d+)["']/g)) citadas.add(m[1]);
      for (const v of citadas) if (v !== vigente) { avisosTermos++; console.log(`::warning title=Termos::${f} cita os Termos ${v}, mas a versão mais nova é ${vigente} (rxsync-sistema#103).`); }
    }
  }
}
if (avisosTermos) console.log(`⚠️ ${avisosTermos} citação(ões) de Termos que não são a versão mais nova (só aviso, não bloqueia).`);
// Demonstração por link (demo/clinica/, DEC-125; ajuste C do plano): nenhum preço, prazo de projeto ou valor, nada da
// demonstração do Dr. André, noindex, nenhum WhatsApp nem telefone, e os itens iguais aos da Central (numerados de 1 em diante, sem buraco, até 99:
// o workflow 43 aceita itens de 1 a 99).
{
  const pasta = path.join('demo', 'clinica');
  const arqs = todos.filter(f => f.startsWith(pasta + path.sep) && /\.(html|js|css)$/.test(f));
  if (fs.existsSync(pasta) && !arqs.length) erro(`${pasta}: sem arquivos`);
  const PROIBIDOS = [[/R\$\s*\d/, 'valor em reais'], [/\bpreços?\b/i, '"preço"'], [/\bmensalidades?\b/i, '"mensalidade"'], [/\bparcelas?\b/i, '"parcela"'],
    [/\b\d+\s+semanas?\b/i, 'prazo em semanas'], [/prazo de entrega/i, '"prazo de entrega"'], [/dias [úu]teis/i, '"dias úteis"'],
    [/\bAndr[ée](?![a-zà-ÿ])/i, 'André'], [/\bPontes\b/, 'Pontes'], [/Gon[çc]alves/i, 'Gonçalves'], [/Melhor Vers[ãa]o/i, '"Melhor Versão"'], [/Evoluir/i, 'Evoluir'], [/drandre/i, 'drandre'], [/\bAG\./, 'AG.'],
    [/wa\.me|api\.whatsapp|whatsapp:\/\/|\btel:/i, 'link de WhatsApp ou telefone'],
    // Rodada de melhoria: nenhum beco sem saída (todo botão mostra um resultado) e ícones em SVG, não emojis.
    [/nada (é|e) guardado/i, '"nada é guardado" (todo botão mostra um resultado simulado)'],
    // Revisão da demonstração: cobrança dita de um jeito estranho para o médico (o consumo fala só em créditos de IA).
    [/nunca em reais|\bexcedente\b|entra na cobran[çc]a/i, 'texto de cobrança estranho para o médico (fale só em créditos de IA)'], [/\p{Extended_Pictographic}/u, 'emoji (use os ícones de comum/icones.js)']];
  // Única exceção: a frase do consumo de IA, sem valor ("cobrados à parte, pelo uso, junto com a mensalidade"; PR da IA).
  const FRASE_CONSUMO = /cobrad[oa]s? à parte, pelo uso, junto com a mensalidade/gi;
  for (const f of arqs) {
    const s = fs.readFileSync(f, 'utf8').replace(FRASE_CONSUMO, '');
    for (const [re, nome] of PROIBIDOS) { const m = s.match(re); if (m) erro(`${f}: ${nome} não pode aparecer na demonstração (achei "${m[0]}")`); }
    if (f.endsWith('.html') && !/<meta name="robots" content="noindex, nofollow">/.test(s)) erro(`${f}: falta noindex`);
    if (f.endsWith('.html') && /googletagmanager|gtag\(|chatwoot|consentimento\.js/i.test(s)) erro(`${f}: sem Google Analytics e sem chat na demonstração`);
  }
  const itensArq = path.join(pasta, 'escopo', 'itens.js'), centralArq = path.join('central', 'fonte', '09_demonstracoes.js');
  if (fs.existsSync(itensArq) && fs.existsSync(centralArq)) {
    const demo = [...fs.readFileSync(itensArq, 'utf8').matchAll(/\{ n: (\d+), t: '((?:[^'\\]|\\.)*)'/g)].map(m => [Number(m[1]), m[2].replace(/\\'/g, "'")]);
    const central = [...((fs.readFileSync(centralArq, 'utf8').match(/const DEM_ITENS = \[([\s\S]*?)\];/) || [])[1] || '').matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
    if (demo.length < 46 || demo.length > 99 || demo.some(([n], i) => n !== i + 1)) erro(`${itensArq}: os itens são numerados de 1 em diante, sem buraco (de 46 a 99 itens; achei ${demo.length})`);
    if (JSON.stringify(demo.map(x => x[1])) !== JSON.stringify(central)) erro(`${itensArq}: os títulos não batem com os da Central (${centralArq}, DEM_ITENS)`);
  }
  if (fs.existsSync('sitemap.xml') && /demo\/clinica/.test(fs.readFileSync('sitemap.xml', 'utf8'))) erro('sitemap.xml: a demonstração por link fica fora do sitemap');
}
// O site é público: nenhum número de achado de auditoria no código, nos comentários ou nos testes (os detalhes ficam no
// repositório privado).
for (const f of [...todos.filter(f => /\.(html|css|js|mjs|md|xml|txt)$/.test(f)), ...fs.readdirSync('scripts').map(f => path.join('scripts', f))]) {
  const m = fs.readFileSync(f, 'utf8').match(/\bN-[0-9]{2,3}\b/);
  if (m) erro(`${f}: cita um número de achado (${m[0]}); o site é público, deixe os detalhes no PR do sistema`);
}
for (const f of todos.filter(f => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { erro(`${f}: JSON inválido`); } }
console.log(erros ? `${erros} problema(s).` : `Tudo certo (${htmls.length} páginas).`);
process.exit(erros ? 1 : 0);
