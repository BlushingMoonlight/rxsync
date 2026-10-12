// Gera escopo/dados.js a partir do escopo oficial, para a página "Escopo do projeto" da demonstração.
// Fonte dos itens 41 a 179 e dos preços por lote: rxsync-enterprise-evoluir/docs/escopo.md.
// Fonte dos nomes e descrições dos itens 1 a 40: rxsync-sistema/docs/projeto-1-gestao-inteligente.md
// (o escopo.md só traz a tabela de lotes do Projeto 1 e aponta para esse arquivo).
// Nunca lê docs/interno.
//
// Uso (na pasta do repositório rxsync, com os outros dois repositórios ao lado):
//   node demo/drandrepontes/escopo/gerar_dados.mjs ../rxsync-enterprise-evoluir/docs/escopo.md ../rxsync-sistema/docs/projeto-1-gestao-inteligente.md
import fs from 'node:fs';
import path from 'node:path';

const [arqEscopo, arqP1] = process.argv.slice(2);
if (!arqEscopo || !arqP1) { console.error('Informe o escopo.md e o projeto-1-gestao-inteligente.md'); process.exit(1); }
if ([arqEscopo, arqP1].some(a => /interno/i.test(a))) { console.error('docs/interno nunca entra na demonstração.'); process.exit(1); }
const escopo = fs.readFileSync(arqEscopo, 'utf8');
const p1 = fs.readFileSync(arqP1, 'utf8');
const versao = (escopo.match(/\*\*Versão do escopo:\*\*\s*(\d+)/) || [])[1] || '?';
const atualizado = (escopo.match(/\*\*Atualizado em:\*\*\s*([\d/]+)/) || [])[1] || '';

const limpa = t => t.replace(/\*\*/g, '').replace(/~~/g, '').replace(/`/g, '').trim();
function marcas(resto) {
  return { sempre: resto.includes('🔒'), consumo: resto.includes('💲'), desc: limpa(resto.replace(/^[^—]*—\s*/, '')) };
}
const itens = [], lotes = [];

// ---------- Projeto 1 (itens 1 a 40) ----------
let lote = null;
for (const linha of p1.split('\n')) {
  const h = linha.match(/^## (Já funciona hoje.*|Lote \d+ — .*)$/);
  if (h) {
    const nome = limpa(h[1]).replace(/\s*\(itens.*\)$/, '');
    lote = { id: 'P1-' + (nome.match(/^Lote (\d+)/) ? 'L' + nome.match(/^Lote (\d+)/)[1] : 'HOJE'), projeto: 1, nome, preco: 'Projeto 1: R$ 999 de implantação · R$ 599 por mês', proposta: false, nota: '' };
    lotes.push(lote); continue;
  }
  if (/^## /.test(linha)) { lote = null; continue; }
  const m = lote && linha.match(/^- (~~)?\*\*(\d+) · ([^*]+)\*\*(~~)?\s*(.*)$/);
  if (m) {
    const k = marcas(m[5]);
    itens.push({ n: +m[2], nome: limpa(m[3]), desc: k.desc, lote: lote.id, sempre: k.sempre, consumo: k.consumo, fora: !!m[1] });
  }
}

// ---------- Projetos 2 e 3 (itens 41 a 179) ----------
let projeto = 0, secao = '', precoSecao = '', proposta = false; lote = null;
for (const linha of escopo.split('\n')) {
  const p = linha.match(/^# Projeto (\d)/); if (p) { projeto = +p[1]; lote = null; secao = ''; precoSecao = ''; proposta = false; continue; }
  if (projeto < 2) continue;
  const s = linha.match(/^## (.*)$/);
  if (s) {
    secao = limpa(s[1]); proposta = /^Propostas/.test(secao);
    precoSecao = (secao.match(/·\s*(R\$ [\d.]+)$/) || [])[1] ? 'parte da ' + secao.replace(/\s*—.*$/, '').toLowerCase() + ' · ' + secao.match(/·\s*(R\$ [\d.]+)$/)[1] : '';
    lote = null; continue;
  }
  const l = linha.match(/^### Lote (\w+) — (.*)$/);
  if (l) {
    const partes = limpa(l[2]).split(' · ');
    const nome = partes[0], resto = partes.slice(1).join(' · ');
    const ehProposta = proposta || /Proposta/.test(resto);
    const preco = ehProposta ? 'Proposta · preço a definir' : (resto || precoSecao || '');
    lote = { id: l[1], projeto, nome: 'Lote ' + l[1] + ' — ' + nome, secao, preco, proposta: ehProposta, nota: '' };
    lotes.push(lote); continue;
  }
  const nota = lote && linha.match(/^\*([^*].*)\*$/);
  if (nota) { lote.nota = limpa(nota[1]); continue; }
  const m = lote && linha.match(/^- \*\*(\d+) · ([^*]+)\*\*\s*(.*)$/);
  if (m) {
    const k = marcas(m[3]);
    itens.push({ n: +m[1], nome: limpa(m[2]), desc: k.desc, lote: lote.id, sempre: k.sempre, consumo: k.consumo, fora: false });
  }
}

// ---------- conferências ----------
itens.sort((a, b) => a.n - b.n);
const nums = itens.map(i => i.n), falta = [], rep = [];
const max = Math.max(...nums);
for (let n = 1; n <= max; n++) { const c = nums.filter(x => x === n).length; if (!c) falta.push(n); if (c > 1) rep.push(n); }
if (falta.length || rep.length) { console.error('Numeração com problema. Faltam:', falta, 'Repetidos:', rep); process.exit(1); }
for (const i of itens) i.juridico = /parecer jurídico/i.test(i.desc + ' ' + (lotes.find(l => l.id === i.lote).nota || '')) || [143, 144].includes(i.n);

const PROJETOS = { 1: 'Projeto 1 · Gestão Inteligente', 2: 'Projeto 2 · Gestão interna (CRM e ERP)', 3: 'Projeto 3 · App do paciente' };
const saida = '// GERADO por gerar_dados.mjs a partir do docs/escopo.md (versão ' + versao + ', ' + atualizado + ') e do projeto-1-gestao-inteligente.md.\n' +
  '// Não edite à mão: rode o gerador de novo quando o escopo mudar (veja o cabeçalho do gerar_dados.mjs).\n' +
  'window.ESCOPO = ' + JSON.stringify({ versao, atualizado, projetos: PROJETOS, lotes, itens }, null, 0).replace(/},{/g, '},\n{') + ';\n';
const destino = path.join(path.dirname(new URL(import.meta.url).pathname), 'dados.js');
fs.writeFileSync(destino, saida);
console.log(`dados.js gerado: versão ${versao}, ${itens.length} itens (1 a ${max}), ${lotes.length} lotes.`);
