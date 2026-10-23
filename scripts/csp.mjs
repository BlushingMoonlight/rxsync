// Regra de segurança do navegador (CSP) das páginas do site, com o resumo (SHA-256) de cada <script> e <style> da página.
// A Central tem a dela (scripts/central_csp.mjs, gravada pelo central_montar.mjs).
// Quem usa: scripts/verificar_site.mjs (confere) e este arquivo (grava). Depois de mudar o script ou o estilo de uma
// página da lista, rode: node scripts/csp.mjs
import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
export const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io';
// O que cada página pode carregar além do próprio script e estilo:
// - painel: o gráfico e as fontes do próprio site, o QR do WhatsApp (data:), a lista de municípios ('self') e o n8n.
export const PAGINAS = {
  'autoedicao.html': { script: "'self'", estilo: "'self'", img: "'self' data:", connect: `'self' ${N8N}` },
};
export const META_CSP = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/;
const resumo = t => `'sha256-${crypto.createHash('sha256').update(t, 'utf8').digest('base64')}'`;
const blocos = (html, tag) => [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map(m => resumo(m[1]));
export function cspPagina(html, p) {
  const fontes = (tag, extra) => [...blocos(html, tag), extra].filter(Boolean).join(' ') || "'none'";
  return `default-src 'none'; script-src ${fontes('script', p.script)}; style-src ${fontes('style', p.estilo)}; font-src 'self'; `
    + `img-src ${p.img}; connect-src ${p.connect}; base-uri 'none'; form-action 'none'`;
}

// node scripts/csp.mjs: grava a regra certa em cada página da lista (logo depois do <meta charset>).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [arq, p] of Object.entries(PAGINAS)) {
    const f = path.join(raiz, arq); let s = fs.readFileSync(f, 'utf8');
    const meta = `<meta http-equiv="Content-Security-Policy" content="${cspPagina(s, p)}">`;
    s = META_CSP.test(s) ? s.replace(META_CSP, meta) : s.replace(/(<meta charset="UTF-8">\n)/i, `$1${meta}\n`);
    if (!META_CSP.test(s)) { console.log(`${arq}: não achei o <meta charset> para pôr a regra`); process.exit(1); }
    fs.writeFileSync(f, s); console.log(`${arq}: regra gravada`);
  }
}
