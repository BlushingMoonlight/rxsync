// Central RXSync: testa pela tela a aba Prospecção › Conversas (DEC-098), com o servidor SIMULADO (scripts/central_simulado.mjs):
//   1. as conversas aparecem inteiras, com o resultado, e os filtros vão para o servidor;
//   2. o "Sugerir melhorias" saiu (rxsync-sistema DEC-211): nenhum botão nem aviso dele.
// Uso (precisa do Playwright): node scripts/central_conversas.mjs
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };

const conversa = (id, nome, resultado, msgs) => ({ lead_id: id, nome, nicho: 'dentista', cidade: 'Curitiba', campanha_id: 'CMP-0001', conjunto_id: 'CJ-0001', anuncio_id: 'AN-0001',
  situacao: resultado, resultado, ultimo_contato_em: '2026-10-15T12:00:00Z', ia_mensagens: 1, passou_para_voce: false,
  mensagens: msgs.map(([direcao, autor, texto], k) => ({ direcao, autor, texto, quando: '2026-10-15T1' + k + ':00:00Z', prompt_id: autor === 'ia' ? 7 : null })) });
const respostas = {
  prosp_conversas: () => ({ ok: true, total: 2, pagina: 0, versoes_prompt: [{ prompt_id: 7, desde: '2026-10-10T10:00:00Z', respostas: 12 }],
    conversas: [conversa('PX-AAAA1', 'Clínica Sorriso', 'recusou', [['saiu', 'disparo', 'Oi! Vi a Clínica Sorriso no Maps.'], ['entrou', 'lead', 'Não, obrigado.']]),
                conversa('PX-AAAA2', 'Odonto Centro', 'parou', [['saiu', 'disparo', 'Oi!'], ['entrou', 'lead', 'Quanto custa?'], ['saiu', 'ia', 'O Essencial custa R$ 299 por mês.']])] })
};

const site = await servirSite(); const browser = await abrirNavegador();
const page = await browser.newPage({ viewport: { width: 1180, height: 860 } }); page.setDefaultTimeout(8000);
const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
const chamadas = [];
await entrar(page, site.base, CHAVES_LIGADAS(), chamadas, respostas);

// 1. as conversas
await page.evaluate(() => { location.hash = 'prospeccao/conversas'; });
await page.getByText('Quanto custa?').waitFor();
ok(await page.locator('.p-bolha').count() === 5, 'as conversas aparecem inteiras (5 mensagens em 2 conversas)');
ok(await page.getByText('recusou', { exact: true }).count() >= 1 && await page.getByText('parou', { exact: true }).count() >= 1, 'cada conversa com o resultado');
await page.getByRole('button', { name: 'Recusou' }).click();
await page.waitForFunction(() => true);
await page.locator('select[aria-label="Campanha"]').selectOption('CMP-0001');
await page.waitForFunction(() => document.querySelectorAll('.p-bolha').length > 0);
await page.waitForTimeout(300);
const ultima = chamadas.filter(c => c.acao === 'prosp_conversas').pop();
ok(ultima && ultima.dados.resultado === 'recusou' && ultima.dados.campanha_id === 'CMP-0001', 'os filtros (resultado e campanha) vão para o servidor');
ok(await page.getByRole('button', { name: 'Sugerir melhorias' }).count() === 0 && await page.getByText('travado').count() === 0, 'sem o "Sugerir melhorias" (DEC-211)');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: revisar conversas, sem o "Sugerir melhorias".');
process.exit(falhas ? 1 : 0);
