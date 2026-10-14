// Central RXSync: recalcula a regra de segurança (CSP) de central/index.html com o resumo (SHA-256) do <script> e do
// <style> da página. Rode depois de mudar a página: node scripts/central_csp.mjs (o verificar_site.mjs confere).
import fs from 'node:fs'; import crypto from 'node:crypto';
export const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io';
export function cspCentral(html) {
  const h = re => 'sha256-' + crypto.createHash('sha256').update((html.match(re) || [, ''])[1], 'utf8').digest('base64');
  return `default-src 'none'; script-src '${h(/<script>([\s\S]*?)<\/script>/)}'; style-src '${h(/<style>([\s\S]*?)<\/style>/)}'; `
    + `font-src 'self'; img-src 'self' data:; connect-src ${N8N}; manifest-src 'self'; base-uri 'none'; form-action 'none'`;
}
if (process.argv[1] && process.argv[1].endsWith('central_csp.mjs')) {
  const arq = 'central/index.html'; let s = fs.readFileSync(arq, 'utf8');
  s = s.replace(/(<meta http-equiv="Content-Security-Policy" content=")[^"]*(">)/, (_, a, b) => a + cspCentral(s) + b);
  fs.writeFileSync(arq, s); console.log('CSP atualizada.');
}
