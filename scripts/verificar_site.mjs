// Conferência do site em todo pull request: links e imagens internos existem, JSON válido,
// todas as páginas apontam para o mesmo n8n e nenhuma aponta para endereço de teste.
import fs from 'node:fs'; import path from 'node:path';
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io';
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
        'prosp_publico_salvar', 'prosp_publico_renomear', 'prosp_publico_duplicar', 'prosp_publico_contato_marcar'],
      2: ['situacao_pausar', 'situacao_retomar', 'situacao_reativar', 'cancelamento_desfazer', 'link_painel_reenviar', 'link_conectar_reenviar', 'reenviar_onboarding', 'recurso_liberar', 'recurso_revogar',
        'cliente_editar_empresa', 'chave_api_criar', 'aviso_destino_definir', 'aviso_destino_desligar', 'desfazer', 'sair_todos', 'aparelho_esquecer',
        'prosp_ligar', 'prosp_apagar_rascunho', 'prosp_numero_criar', 'prosp_numero_qr', 'prosp_numero_desconectar', 'prosp_numero_webhook', 'prosp_numero_teto', 'prosp_buscar_agora', 'prosp_leads_aprovar_todos', 'prosp_lead_nao_contatar', 'prosp_lead_devolver', 'prosp_exportar',
        'prosp_publico_buscar', 'prosp_publico_contatos_lote', 'prosp_publico_arquivar', 'prosp_creditos_teto_salvar', 'prosp_sugerir'],
      3: ['plano_trocar', 'situacao_suspender', 'cancelamento_agendar', 'preco_especial', 'cobranca_proxima_data', 'cobranca_vencimento', 'implantacao_isentar', 'pagamento_receber_dinheiro',
        'teste_estender', 'link_painel_novo', 'chave_api_revogar', 'cobranca_teste_definir', 'prosp_encerrar', 'prosp_numero_apagar'] };
    const conhecidas = new Set(Object.values(NIVEIS).flat());
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
// Painel (autoedicao.html): o que a clínica pode usar vem de "recursos" do servidor (DEC-063), não do nome do plano.
{
  const arq = 'autoedicao.html';
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
    for (const m of s.matchAll(/fetch\((\w+_?WEBHOOK|WEBHOOK)[^;]*?headers:\s*([^,]+),/g)) if (m[1] !== 'ENTRADA_WEBHOOK' && m[2].trim() !== 'cab()') erro(`${arq}: o pedido ao ${m[1]} precisa levar a sessão do painel (headers: cab())`);
    if ((s.match(/headers: cab\(\)/g) || []).length < 5) erro(`${arq}: os 5 endpoints do painel (24, 13, 32, 12 e 23) precisam de headers: cab()`);
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
  // autoedicao.html: a tabela da aba Assinatura.
  const a = ler('autoedicao.html');
  for (const k of planos) {
    const m = a.match(new RegExp(k + ':\\s*\\{[^}]*?mensal:\\s*"([\\d.,]+)",\\s*parcelado:\\s*"([\\d.,]+)",\\s*avista:\\s*"([\\d.,]+)"'));
    if (!m) { erro(`autoedicao.html: não achei os preços de ${k} em ASSIN_PRECOS`); continue; }
    confere('autoedicao.html', m[1], P[k].mensal, `a mensalidade do ${k}`); confere('autoedicao.html', m[2], P[k].parcelado, `o anual em 12x do ${k}`); confere('autoedicao.html', m[3], P[k].avista, `o anual à vista do ${k}`);
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
  for (const m of ix.matchAll(/"price":\s*"([\d.]+)"/g)) if (!planos.some(k => m[1] === P[k].mensal + '.00')) erro(`index.html: o preço ${m[1]} do JSON-LD não é uma mensalidade oficial (rxsync-sistema#79)`);
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
for (const f of todos.filter(f => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { erro(`${f}: JSON inválido`); } }
console.log(erros ? `${erros} problema(s).` : `Tudo certo (${htmls.length} páginas).`);
process.exit(erros ? 1 : 0);
