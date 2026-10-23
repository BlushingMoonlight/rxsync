// Roda todos os testes de tela (scripts/*.mjs que abrem o navegador, com o n8n simulado), um por vez, e mostra quais
// passaram. Os que fotografam as telas rodam sem fotos. Quem usa: o GitHub em todo pull request (conferir.yml) e quem
// quiser rodar todos aqui. Uso (precisa do Playwright): node scripts/testes_tela.mjs
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const PASTA = path.dirname(fileURLToPath(import.meta.url));
// Ferramentas (não são testes): o servidor simulado, as regras de segurança, a montagem da Central e as conferências.
const FERRAMENTAS = ['central_simulado.mjs', 'central_csp.mjs', 'central_montar.mjs', 'csp.mjs', 'verificar_site.mjs', 'testes_tela.mjs'];
const SEM_FOTOS = ['central_telas.mjs', 'demo_clinica_telas.mjs'];
const testes = fs.readdirSync(PASTA).filter(f => f.endsWith('.mjs') && !FERRAMENTAS.includes(f)).sort();
const rodar = f => new Promise(ok => {
  const inicio = Date.now(); let saida = '';
  const p = spawn(process.execPath, [path.join(PASTA, f), ...(SEM_FOTOS.includes(f) ? ['-', 'sem-fotos'] : [])], { cwd: path.join(PASTA, '..') });
  p.stdout.on('data', d => { saida += d; }); p.stderr.on('data', d => { saida += d; });
  p.on('close', codigo => ok({ f, codigo, saida, s: Math.round((Date.now() - inicio) / 1000) }));
});
const falhas = [];
for (const f of testes) {
  const r = await rodar(f);
  console.log(`${r.codigo === 0 ? '✓' : '✗'} ${f} (${r.s} s)`);
  if (r.codigo !== 0) { falhas.push(f); console.log(r.saida.split('\n').filter(l => !l.startsWith('✓')).slice(-15).map(l => '    ' + l).join('\n')); }
}
console.log(falhas.length ? `::error::${falhas.length} de ${testes.length} teste(s) de tela falharam: ${falhas.join(', ')}` : `Tudo certo: ${testes.length} testes de tela.`);
process.exit(falhas.length ? 1 : 0);
