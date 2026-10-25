// Painel da clínica: monta painel/index.html a partir das partes em painel/fonte/ (rxsync-sistema DEC-156), como a Central.
// - estilo: assets/ancora/tokens.css (o único arquivo de cores e tamanhos) e depois os .css da fonte, em ordem de nome;
// - código: todos os .js em ordem de nome, dentro do único <script> (numa função, com 'use strict');
// - regra de segurança (CSP): resumo SHA-256 do <script> e do <style> (scripts/csp.mjs, PAGINAS['painel/index.html']).
// Rode depois de mudar qualquer parte: node scripts/painel_montar.mjs (o verificar_site.mjs confere).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { cspPagina, PAGINAS } from './csp.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FONTE = path.join(RAIZ, 'painel', 'fonte');
export const TOKENS = path.join(RAIZ, 'assets', 'ancora', 'tokens.css');
export const DESTINO = path.join(RAIZ, 'painel', 'index.html');

export function montar() {
  const ler = f => fs.readFileSync(path.isAbsolute(f) ? f : path.join(FONTE, f), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  const lista = ext => fs.readdirSync(FONTE).filter(f => f.endsWith(ext)).sort();
  const css = [ler(TOKENS), ...lista('.css').map(ler)].join('\n');
  const js = "'use strict';\n(function () {\n" + lista('.js').map(f => '// ==== ' + f + '\n' + ler(f)).join('\n\n') + '\n})();';
  for (const [nome, txt] of [['estilo', css], ['código', js]]) if (/<\/(script|style)/i.test(txt)) throw new Error(`O ${nome} do painel não pode conter "</script" nem "</style".`);
  let html = ler('pagina.html') + '\n';
  html = html.replace('{{CSS}}', () => css).replace('{{JS}}', () => js);
  // A fonte, aberta sozinha, não roda nada (default-src 'none'); no painel montado, a regra vira a de verdade.
  return html.replace("default-src 'none'; {{CSP}}", () => cspPagina(html, PAGINAS['painel/index.html']));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  fs.writeFileSync(DESTINO, montar());
  console.log('painel/index.html montado a partir de painel/fonte/.');
}
