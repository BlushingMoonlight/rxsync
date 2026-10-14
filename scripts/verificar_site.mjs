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
    if (/localStorage\s*\./.test(s)) erro(`${arq}: a sessão não pode ir para o localStorage`);
    if (/\.innerHTML\s*=/.test(s)) erro(`${arq}: use textContent (innerHTML deixa o texto do servidor virar código)`);
  }
}
for (const f of todos.filter(f => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { erro(`${f}: JSON inválido`); } }
console.log(erros ? `${erros} problema(s).` : `Tudo certo (${htmls.length} páginas).`);
process.exit(erros ? 1 : 0);
