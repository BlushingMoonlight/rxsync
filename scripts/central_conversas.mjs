// Central RXSync: testa pela tela a aba Prospecção › Conversas (DEC-098), com o servidor SIMULADO (scripts/central_simulado.mjs):
//   1. as conversas aparecem inteiras, com o resultado, e os filtros vão para o servidor;
//   2. com as sugestões travadas (chave prosp_politica_sugestoes), não há botão de pedir, só o aviso;
//   3. liberadas: "Sugerir melhorias" pede a confirmação (nível 2) e a quantidade, mostra o diagnóstico, as sugestões e o
//      texto novo; "Usar este texto" abre o editor da campanha com o texto no campo, sem salvar sozinho.
// Uso (precisa do Playwright): node scripts/central_conversas.mjs
import { abrirNavegador, servirSite, entrar, CHAVES_LIGADAS } from './central_simulado.mjs';
let falhas = 0; const ok = (c, m) => { if (!c) { console.log('✗ ' + m); falhas++; } else console.log('✓ ' + m); return c; };

const TEXTO_NOVO = 'Você é a assistente virtual da RXSync. Fale curto e, quando perguntarem o preço, fale do teste grátis de 7 dias e mande o link.';
const estado = { liberadas: false };
const conversa = (id, nome, resultado, msgs) => ({ lead_id: id, nome, nicho: 'dentista', cidade: 'Curitiba', campanha_id: 'CMP-0001', conjunto_id: 'CJ-0001', anuncio_id: 'AN-0001',
  situacao: resultado, resultado, ultimo_contato_em: '2026-10-15T12:00:00Z', ia_mensagens: 1, passou_para_voce: false,
  mensagens: msgs.map(([direcao, autor, texto], k) => ({ direcao, autor, texto, quando: '2026-10-15T1' + k + ':00:00Z', prompt_id: autor === 'ia' ? 7 : null })) });
const respostas = {
  prosp_conversas: () => ({ ok: true, total: 2, pagina: 0, sugestoes_liberadas: estado.liberadas, versoes_prompt: [{ prompt_id: 7, desde: '2026-10-10T10:00:00Z', respostas: 12 }],
    conversas: [conversa('PX-AAAA1', 'Clínica Sorriso', 'recusou', [['saiu', 'disparo', 'Oi! Vi a Clínica Sorriso no Maps.'], ['entrou', 'lead', 'Não, obrigado.']]),
                conversa('PX-AAAA2', 'Odonto Centro', 'parou', [['saiu', 'disparo', 'Oi!'], ['entrou', 'lead', 'Quanto custa?'], ['saiu', 'ia', 'O Essencial custa R$ 299 por mês.']])] }),
  prosp_sugerir: d => d.confirmacao === 'CONFIRMAR' ? { ok: true, conversas: 2, diagnostico: 'Quem pergunta o preço some depois da resposta.',
    sugestoes: [{ onde: 'preço', antes: '', depois: 'Fale do teste grátis antes do valor.', porque: 'Reduz a objeção de preço.' }], texto_novo: TEXTO_NOVO, aviso: null }
    : { ok: false, nivel: 2, mensagem: 'Confirme.' }
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
await page.getByText('travado').waitFor();
const ultima = chamadas.filter(c => c.acao === 'prosp_conversas').pop();
ok(ultima && ultima.dados.resultado === 'recusou' && ultima.dados.campanha_id === 'CMP-0001', 'os filtros (resultado e campanha) vão para o servidor');
ok(await page.getByRole('button', { name: 'Sugerir melhorias' }).count() === 0, 'sugestões travadas: só o aviso, sem o botão');

// 2. liberadas: pedir, ver e usar
estado.liberadas = true;
await page.locator('select[aria-label="Período"]').selectOption('90');
await page.getByRole('button', { name: 'Sugerir melhorias' }).click();
await page.locator('#c-quantidade').fill('15');
await page.getByRole('button', { name: 'Pedir sugestões' }).click();
await page.getByText('Quem pergunta o preço some').waitFor();
const pedido = chamadas.filter(c => c.acao === 'prosp_sugerir').pop();
ok(pedido && pedido.dados.confirmacao === 'CONFIRMAR' && pedido.dados.quantidade === '15' && pedido.dados.campanha_id === 'CMP-0001' && pedido.dados.dias === '90',
  'Sugerir melhorias: nível 2 com a quantidade e o filtro');
ok(await page.getByText('Fale do teste grátis antes do valor.').count() === 1, 'mostra as sugestões com o depois e o porquê');
await page.getByRole('button', { name: 'Usar este texto' }).click();
await page.waitForFunction(t => { const c = document.getElementById('p-ia-prompt_texto'); return c && c.value === t; }, TEXTO_NOVO);
ok(!chamadas.some(c => c.acao === 'prosp_campanha_salvar'), '"Usar este texto" põe o texto no editor da campanha e não salva sozinho');
ok(!erros.length, 'sem erro de script na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
await browser.close(); site.fechar();
console.log(falhas ? `${falhas} falha(s).` : 'Tudo certo: revisar conversas, sugestões travadas e liberadas, e "Usar este texto".');
process.exit(falhas ? 1 : 0);
