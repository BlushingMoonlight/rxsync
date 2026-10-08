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
for (const f of todos.filter(f => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { erro(`${f}: JSON inválido`); } }
console.log(erros ? `${erros} problema(s).` : `Tudo certo (${htmls.length} páginas).`);
process.exit(erros ? 1 : 0);
