// Os prints da página do painel (/painel-da-clinica/, rxsync-sistema DEC-199): fotos do próprio painel (painel/index.html),
// com o servidor SIMULADO aqui e uma clínica inventada ("Clínica Exemplo"). Nada sai para a internet e nenhum dado é de
// cliente: os nomes são abreviados ("Ana R."), os e-mails ficam num domínio que não existe (clinica.exemplo) e todo
// telefone que aparece na tela é mascarado antes da foto ("(48) 9••••-1234").
// Grava assets/painel-da-clinica/<nome>-1x.webp e -2x.webp (WebP feito pelo próprio Chrome, sem programa a instalar) e o
// prints.json, com o resumo (SHA-256) do painel/index.html: o verificar_site.mjs avisa quando o painel mudar depois dos
// prints. Quando o painel mudar: node scripts/painel_prints.mjs (e confira as fotos no PR).
// É uma ferramenta, não um teste (fica na lista FERRAMENTAS do testes_tela.mjs).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { abrirNavegador, servirSite } from './central_simulado.mjs';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'assets', 'painel-da-clinica');
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/';
// O dia das fotos: quarta, 04/11/2026, 9h30, no fuso da clínica (as fotos não mudam com o dia em que o script roda).
const AGORA = new Date('2026-11-04T09:30:00-03:00');
const em = (dia, h, m = 0) => new Date(Date.UTC(2026, 10, dia, h + 3, m)).toISOString();   // dia de novembro, hora de Brasília
const tel = i => '489' + String(87652318 + i * 1379).slice(0, 8);   // só para o painel montar a tela: a foto mostra mascarado

// ---------------------------------------------------------------- a clínica inventada
const NOMES = ['Ana R.', 'Bruno C.', 'Carla M.', 'Diego F.', 'Elisa P.', 'Fábio N.', 'Gabriela L.', 'Henrique A.', 'Isabel T.', 'João V.', 'Larissa S.', 'Marcos D.'];
const MEDICOS = [{ id: 1, nome: 'Dra. Clara' }, { id: 2, nome: 'Dr. Rui' }];
const TIPOS = { 1: [{ id: 11, nome: 'Primeira consulta', duracao_min: 50, ativo: true, link_pagamento: '', valor: null }, { id: 12, nome: 'Retorno', duracao_min: 30, ativo: true, link_pagamento: 'https://pagamento.clinica.exemplo/retorno', valor: null }],
  2: [{ id: 21, nome: 'Consulta', duracao_min: 40, ativo: true, link_pagamento: '', valor: null }] };
const AGENDA = [];
let id = 100;
for (const dia of [2, 3, 4, 5, 6]) for (const [h, m, i] of [[8, 0, 0], [9, 0, 1], [10, 0, 2], [11, 0, 3], [14, 0, 4], [15, 0, 5], [16, 0, 6]]) {
  if ((dia + i) % 4 === 3) continue;   // a agenda cheia, com alguns horários livres
  if (dia === 6 && h < 12) continue;   // sexta de manhã livre: é o horário que o chat da página bloqueia
  const k = (dia * 3 + i) % NOMES.length, med = MEDICOS[(dia + i) % 2];
  AGENDA.push({ id: id++, nome_paciente: NOMES[k], telefone_paciente: tel(k), servico: i % 3 === 0 ? 'Retorno' : 'Consulta', inicio: em(dia, h, m), fim: em(dia, h, m + (med.id === 1 ? 50 : 40)),
    status: 'agendado', visto: !(dia === 4 && i < 2), criado_por: i % 2 ? 'ia' : 'manual', presenca: dia === 4 && i < 4 ? 'confirmada' : null, medico_id: med.id, pago_em: i % 3 === 1 ? em(dia - 1, 18) : null });
}
const SERIE = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.UTC(2026, 9, 6 + i)); const sem = d.getUTCDay(); return { dia: d.toISOString().slice(0, 10), ia: [0, 4, 5, 3, 4, 3, 1][sem], manual: [0, 2, 1, 2, 1, 2, 0][sem] }; });
const IND = { atual: { conversas: 312, agendadas_ia: 74, agendadas_manual: 41, taxa_agendamento: 24, tempo_resposta_seg: 8, com_lembrete: 96, presenca_confirmada: 84, canceladas: 9, chegaram: 88, faltaram: 6, taxa_faltas: 6, fila_entradas: 12, vagas_repostas: 5 },
  anterior: { conversas: 281, agendadas_ia: 63, agendadas_manual: 44, taxa_agendamento: 22, tempo_resposta_seg: 11, com_lembrete: 90, presenca_confirmada: 73, canceladas: 12, taxa_faltas: 8, fila_entradas: 9, vagas_repostas: 3 },
  serie: SERIE, semana: [1, 22, 26, 24, 21, 19, 3], hora: [0, 0, 0, 0, 0, 0, 0, 2, 9, 14, 12, 8, 4, 6, 11, 13, 10, 7, 5, 6, 8, 4, 2, 1],
  pesquisa: { enviadas: 60, respondidas: 41, media: 9.1, nps: 72, detratores: 2 }, tem_fila: true };
const CHAMADOS = [{ id: 1, nome_paciente: 'Marta S.', telefone: tel(20), motivo: 'Pediu para falar com uma pessoa', urgente: false, criado_em: em(4, 9, 5) }];
const PACIENTES = NOMES.map((n, i) => ({ paciente_id: 'PAC-' + String(1040 + i), nome: n, telefone: tel(i), ultima_consulta: em(10 + (i % 20), 10).replace('2026-11', '2026-10'), proxima_consulta: i % 3 ? em(5 + (i % 3), 9) : null, conversou_em: em(3, 12) }));
const EQUIPE = { ok: true, limite: 3, pessoas: [{ id: 1, email: 'clara@clinica.exemplo', papel: 'dono', situacao: 'ativa' }, { id: 2, email: 'recepcao@clinica.exemplo', papel: 'equipe', situacao: 'ativa', ultimo_acesso: '04/11/2026 08:40' }, { id: 3, email: 'financeiro@clinica.exemplo', papel: 'equipe', situacao: 'ativa', ultimo_acesso: '03/11/2026 17:10' }] };
const EDITAVEIS = { nome_exibicao: 'Clínica Exemplo', fuso_horario: 'America/Sao_Paulo', assistente_dono_ativa: 'SIM', func_pagamento_link: 'SIM', func_medicos: 'SIM', func_fila: 'SIM',
  pagamento_link: 'https://pagamento.clinica.exemplo/consulta', pagamento_texto: 'Aceitamos Pix ou cartão.',
  politica_precos: 'Primeira consulta: R$ 380. Retorno em até 30 dias: sem custo. Consulta com o Dr. Rui: R$ 320.',
  formas_pagamento: 'Pix, cartão de crédito em até 3 vezes e débito. O pagamento é feito na recepção ou pelo link enviado depois de marcar.',
  convenios_parcerias: 'Atendemos dois convênios, com guia autorizada antes da consulta. Pergunte o seu convênio pelo WhatsApp.',
  politica_agendamento: 'Desmarque com 24 horas de antecedência. Tolerância de 15 minutos de atraso. Primeira consulta: chegue 10 minutos antes.' };
const RECURSOS = Object.fromEntries(['documentos', 'fila', 'pesquisa', 'reconhecer', 'tipo_visita', 'empilhamento', 'preconsulta', 'medicos', 'relacionamento', 'assistente_dono', 'pacientes'].map(k => [k, true]));

function responder(caminho, b) {
  const d = b.dados || {};
  if (caminho === 'painel-entrada') {
    if (b.acao === 'tour_ler') return { ok: true, tour: { '*': 'pulado' } };
    if (b.acao === 'equipe_listar') return EQUIPE;
    return b.acao === 'termos_estado' ? { ok: true, pendente: false, papel: 'dono' } : { ok: true };
  }
  if (caminho === 'pagamento-clinica') return { ok: true, situacao: { conectado: false } };
  if (caminho === 'integracao-agenda') return { ok: true, conectado: false, plataformas: { reservio: 'Reservio' } };
  if (caminho === 'assistente-dono') return { ok: true, resposta: 'ok' };
  if (caminho !== 'autoedicao') return { ok: true, data: [] };
  switch (b.acao) {
    case 'abrir': return { ok: true, papel: 'dono', editaveis: EDITAVEIS, somenteLeitura: { plano: 'Gestão Inteligente' }, recursos: RECURSOS, limite_catalogo: 2000, conta: { situacao: '', no_ar: true } };
    case 'agenda_listar': return { ok: true, data: d.nao_pagas ? [] : AGENDA };
    case 'agenda_chamados': return { ok: true, data: CHAMADOS };
    case 'indicadores': return { ok: true, data: IND };
    case 'agenda_medicos_listar': return { ok: true, data: { modo_medicos: true, funcoes_padrao: { paga_consultorio: false }, medicos: MEDICOS.map(m => ({ ...m, ativo: true, funcoes: {}, tipos: TIPOS[m.id], grade: [{ dia: 1, inicio: '08:00', fim: '17:00' }], consultas_futuras: 12 })) } };
    case 'agenda_grade_listar': return { ok: true, data: [1, 2, 3, 4, 5].flatMap(dia => [{ dia, inicio: '08:00', fim: '12:00' }, { dia, inicio: '14:00', fim: '18:00' }]) };
    case 'paciente_listar': return { ok: true, data: { ok: true, total: PACIENTES.length, pacientes: PACIENTES } };
    default: return { ok: true, data: [] };
  }
}

// Todo telefone que aparece na tela vira "(48) 9••••-1234" antes da foto (nem o inventado aparece inteiro).
function mascarar() {
  const re = /\(?\b(\d{2})\)?[\s.-]?(9?)\d{4}[\s.-]?(\d{4})\b/g;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) if (re.test(n.nodeValue)) { re.lastIndex = 0; n.nodeValue = n.nodeValue.replace(re, (_, ddd, nove, fim) => `(${ddd}) ${nove ? '9' : ''}••••-${fim}`); }
  document.querySelectorAll('input, textarea').forEach(i => { if (re.test(i.value)) { re.lastIndex = 0; i.value = i.value.replace(re, (_, ddd, nove, fim) => `(${ddd}) ${nove ? '9' : ''}••••-${fim}`); } });
}

// Os prints: o nome do arquivo, a tela, a largura da tela, a altura da foto (em pontos de tela) e o que fazer antes.
const PRINTS = [
  { nome: 'hoje-celular', rota: 'hoje', largura: 390, altura: 844, alt: 'Tela Hoje do painel no celular: Precisa de você, com um pedido de pessoa, e as consultas do dia' },
  { nome: 'agenda-ipad', rota: 'agenda', largura: 820, altura: 1000, alt: 'Agenda do painel no iPad: a semana com as consultas de dois médicos, o filtro por médico e o botão Nova consulta' },
  { nome: 'precisa-de-voce', rota: 'hoje', largura: 390, altura: 844, alt: 'Bloco Precisa de você em Hoje: um paciente que pediu para falar com uma pessoa, com os botões Abrir no WhatsApp e Resolvido' },
  { nome: 'agenda-celular', rota: 'agenda', largura: 390, altura: 844, antes: async p => { const v = p.locator('#calVisao'); if (await v.count()) await v.selectOption('dia'); }, alt: 'Agenda do painel no celular: as consultas do dia, de quem a assistente marcou e de quem a equipe marcou' },
  { nome: 'assistente-valores', rota: 'assistente/valores', largura: 390, altura: 844, alt: 'Tela Assistente, Valores, convênios e regras: os preços, as formas de pagamento e os convênios que a assistente usa nas respostas' },
  { nome: 'resultados', rota: 'resultados', largura: 390, altura: 844, alt: 'Tela Resultados do painel: conversas, consultas marcadas pela assistente e pela equipe e a comparação com o período anterior' },
  { nome: 'pacientes', rota: 'pacientes', largura: 390, altura: 844, alt: 'Tela Pacientes: a busca e a lista de pacientes com a próxima consulta, com os telefones escondidos' },
  { nome: 'equipe', rota: 'conta/equipe', largura: 390, altura: 844, alt: 'Tela Equipe: o dono e duas pessoas da equipe, cada uma com o próprio e-mail' },
  { nome: 'receber', rota: 'agenda/horarios/pagamento', largura: 390, altura: 844, rolar: '#pagEscolhaTit', alt: 'Tela Receber dos pacientes: a escolha entre Meus links de pagamento e Asaas da clínica, o link da clínica e o link de cada tipo de consulta' }
];

const site = await servirSite(); const browser = await abrirNavegador();
fs.mkdirSync(SAIDA, { recursive: true });
const gerados = [];
for (const pr of PRINTS) {
  const ctx = await browser.newContext({ viewport: { width: pr.largura, height: pr.altura }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await ctx.clock.setFixedTime(AGORA);
  await ctx.addInitScript(() => { try { sessionStorage.setItem('painel_sessao', 'e'.repeat(64)); localStorage.setItem('painel_instalar_depois', String(Date.now())); } catch (e) { /* nada */ } });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
    const q = r.request(); if (!q.url().startsWith(N8N)) return r.abort();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    let b = {}; try { b = JSON.parse(q.postData() || '{}'); } catch { /* corpo vazio */ }
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(responder(q.url().slice(N8N.length), b)) });
  });
  const p = await ctx.newPage(); p.setDefaultTimeout(10000);
  await p.goto(site.base + '/painel/#' + pr.rota); await p.locator('#app').waitFor({ state: 'visible' });
  await p.waitForTimeout(1200); if (pr.antes) { await pr.antes(p); await p.waitForTimeout(600); }
  await p.evaluate(mascarar);
  await p.evaluate(sel => { const e = sel && document.querySelector(sel); if (e) { const cab = document.querySelector('.topo, header'); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - (cab ? cab.offsetHeight : 0) - 16); } else window.scrollTo(0, 0); }, pr.rolar || null);
  await p.waitForTimeout(300);
  const png = await p.screenshot({ type: 'png' });
  // PNG → WebP em duas larguras (2x, a da foto; 1x, a metade), pelo canvas do próprio Chrome.
  const conv = await p.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const sai = escala => { const c = document.createElement('canvas'); c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height); return [c.width, c.height, c.toDataURL('image/webp', 0.82).split(',')[1]]; };
    return { x2: sai(1), x1: sai(0.5) };
  }, png.toString('base64'));
  for (const [k, [w, h, b64]] of Object.entries(conv)) fs.writeFileSync(path.join(SAIDA, `${pr.nome}-${k.slice(1)}x.webp`), Buffer.from(b64, 'base64'));
  gerados.push({ nome: pr.nome, tela: pr.rota, largura: conv.x1[0], altura: conv.x1[1], alt: pr.alt });
  console.log(`✓ ${pr.nome}: ${conv.x1[0]}×${conv.x1[1]} (1x) e ${conv.x2[0]}×${conv.x2[1]} (2x)`);
  await ctx.close();
}
await browser.close(); site.fechar();
const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(RAIZ, 'painel', 'index.html'))).digest('hex');
fs.writeFileSync(path.join(SAIDA, 'prints.json'), JSON.stringify({ _sobre: 'Gerado por node scripts/painel_prints.mjs. painel_sha256 é o painel/index.html do dia dos prints: o verificar_site.mjs avisa quando o painel mudar.', painel_sha256: hash, prints: gerados }, null, 2) + '\n');
console.log(`Prints gravados em assets/painel-da-clinica/ (${gerados.length}).`);
