// Central RXSync: regra de segurança (CSP) de central/index.html com o resumo (SHA-256) do <script> e do <style>.
// Quem usa: scripts/central_montar.mjs (monta a página) e scripts/verificar_site.mjs (confere).
import crypto from 'node:crypto';
export const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io';
export function cspCentral(html) {
  const h = re => 'sha256-' + crypto.createHash('sha256').update((html.match(re) || [, ''])[1], 'utf8').digest('base64');
  return `default-src 'none'; script-src '${h(/<script>([\s\S]*?)<\/script>/)}'; style-src '${h(/<style>([\s\S]*?)<\/style>/)}'; `
    + `font-src 'self'; img-src 'self' data:; connect-src ${N8N}; manifest-src 'self'; base-uri 'none'; form-action 'none'`;
}
