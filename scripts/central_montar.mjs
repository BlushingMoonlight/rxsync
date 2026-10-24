// Central RXSync: monta central/index.html a partir das partes em central/fonte/ (DEC-068).
// - estilo: todos os .css em ordem de nome, dentro do único <style>;
// - código: todos os .js em ordem de nome, dentro do único <script> (numa função, com 'use strict');
// - regra de segurança (CSP): resumo SHA-256 do <script> e do <style> (scripts/central_csp.mjs).
// Rode depois de mudar qualquer parte: node scripts/central_montar.mjs (o verificar_site.mjs confere).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { cspCentral } from './central_csp.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FONTE = path.join(RAIZ, 'central', 'fonte');
export const DESTINO = path.join(RAIZ, 'central', 'index.html');

export function montar() {
  const ler = f => fs.readFileSync(path.join(FONTE, f), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  const lista = ext => fs.readdirSync(FONTE).filter(f => f.endsWith(ext)).sort();
  const css = lista('.css').map(ler).join('\n');
  const js = "'use strict';\n(function () {\n" + lista('.js').map(f => '// ==== ' + f + '\n' + ler(f)).join('\n\n') + '\n})();';
  for (const [nome, txt] of [['estilo', css], ['código', js]]) if (/<\/(script|style)/i.test(txt)) throw new Error(`O ${nome} da Central não pode conter "</script" nem "</style".`);
  let html = ler('pagina.html') + '\n';
  html = html.replace('{{CSS}}', () => css).replace('{{JS}}', () => js);
  // A fonte, aberta sozinha, não roda nada (default-src 'none'); na Central montada, a regra vira a de verdade.
  return html.replace("default-src 'none'; {{CSP}}", () => cspCentral(html));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  fs.writeFileSync(DESTINO, montar());
  console.log('central/index.html montada a partir de central/fonte/.');
}
