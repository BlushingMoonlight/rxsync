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
    // localStorage: só a aparência (automática, clara ou escura), pela chave 'central_aparencia' (DEC-067).
    for (const m of s.matchAll(/localStorage\s*\.\s*(\w+)\s*\(\s*([^,)]*)/g)) if (!['getItem', 'setItem', 'removeItem'].includes(m[1]) || m[2].trim() !== "'central_aparencia'") erro(`${arq}: só a aparência pode ir para o localStorage (achei ${m[0]})`);
    if (/localStorage\s*\[|localStorage\s*\.\s*(?!getItem|setItem|removeItem)\w/.test(s)) erro(`${arq}: localStorage só com getItem, setItem ou removeItem da aparência`);
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
        'cliente_editar_empresa', 'chave_api_criar', 'aviso_destino_definir', 'aviso_destino_desligar', 'desfazer', 'sair_todos',
        'prosp_ligar', 'prosp_apagar_rascunho', 'prosp_numero_criar', 'prosp_numero_qr', 'prosp_numero_desconectar', 'prosp_numero_webhook', 'prosp_numero_teto', 'prosp_buscar_agora', 'prosp_leads_aprovar_todos', 'prosp_lead_nao_contatar', 'prosp_lead_devolver', 'prosp_exportar',
        'prosp_publico_buscar', 'prosp_publico_contatos_lote', 'prosp_publico_arquivar', 'prosp_creditos_teto_salvar'],
      3: ['plano_trocar', 'situacao_suspender', 'cancelamento_agendar', 'preco_especial', 'cobranca_proxima_data', 'cobranca_vencimento', 'implantacao_isentar', 'pagamento_receber_dinheiro',
        'teste_estender', 'link_painel_novo', 'chave_api_revogar', 'cobranca_teste_definir', 'prosp_encerrar', 'prosp_numero_apagar'] };
    const conhecidas = new Set(Object.values(NIVEIS).flat());
    for (const m of s.matchAll(/\b(?:fazer|pedirAcao)\(\s*'([a-z_]+)'/g)) if (!conhecidas.has(m[1])) erro(`${arq}: a ação ${m[1]} não tem nível (sql/030); ponha em rx_central_niveis() e na lista do verificar_site.mjs`);
    for (const m of s.matchAll(/\bformGrupo\([^;]*?, '([a-z_]+)', '/g)) if (!conhecidas.has(m[1])) erro(`${arq}: a ação ${m[1]} não tem nível (sql/030)`);
    for (const m of s.matchAll(/\b(?:fazer|pedirAcao)\(\s*([^'\s][^,)]*)/g)) if (!/^(acao|a|x\.acao|op\.acao)$/.test(m[1].trim())) erro(`${arq}: chame fazer/pedirAcao com o nome da ação escrito ('...'), para o verificar conferir o nível (achei ${m[1].trim()})`);
    if (/\.innerHTML\s*=/.test(s)) erro(`${arq}: use textContent (innerHTML deixa o texto do servidor virar código)`);
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
  }
}
for (const f of todos.filter(f => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { erro(`${f}: JSON inválido`); } }
console.log(erros ? `${erros} problema(s).` : `Tudo certo (${htmls.length} páginas).`);
process.exit(erros ? 1 : 0);
