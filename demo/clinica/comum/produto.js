// O app do paciente e a central do médico rodam na MESMA página (app/ e central/ carregam os mesmos arquivos): assim, o
// que a pessoa faz num aparece no outro na mesma visita, sem guardar nada no aparelho. A faixa da demonstração troca
// de um para o outro sem recarregar; o endereço muda junto (…/app/ ou …/central/), para o link continuar certo.
// Cada página carrega só o produto em que abre; o outro (o .js e o .css) vem na primeira troca pela faixa. Os dados
// (comum/dados.js) são os mesmos, então nada se perde na troca.
(function () {
  'use strict';
  const { el, trocar } = DEMO;
  const raiz = document.getElementById('raiz');
  const inicial = document.body.dataset.inicio === 'central' ? 'central' : 'app';
  const NOME = { app: 'App do paciente', central: 'Central do médico' };
  const faixa = el('div', { class: 'lugar-faixa' }), palco = el('div', { class: 'lugar-produto' });
  let atual = null;
  const ARQUIVOS = { app: ['../app/app.css', '../app/app.js'], central: ['../central/central.css', '../central/central.js'] };
  const pronto = v => v === 'app' ? window.DEMO_APP : window.DEMO_CENTRAL;
  const carregar = v => Promise.all(ARQUIVOS[v].map(src => new Promise((ok, erro) => {
    const e = src.endsWith('.css') ? el('link', { rel: 'stylesheet', href: src }) : el('script', { src });
    e.onload = ok; e.onerror = erro; document.head.append(e);
  })));
  async function trocarVista(v, primeira) {
    if (v === atual) return;
    // Só espera quando precisa carregar (a primeira montagem é na hora: o destaque do &item=N vem logo depois).
    if (!pronto(v)) { try { await carregar(v); } catch (e) { DEMO.rapida('Não consegui abrir agora. Confira a internet e tente de novo.'); return; } if (v === atual) return; }
    atual = v;
    DEMO.mudarPagina(v);
    if (!primeira) { DEMO.marcarVisto(v); try { history.replaceState(null, '', DEMO.link(v)); } catch (e) { /* segue sem trocar o endereço */ } }
    document.title = NOME[v] + ' · ' + DEMO.dados.clinica;
    document.documentElement.dataset.vista = v;
    trocar(faixa, DEMO.faixaDemo(v, trocarVista));
    const onde = el('div', { class: v === 'app' ? 'v-app' : 'v-central' });
    const montar = () => { trocar(palco, onde); (v === 'app' ? window.DEMO_APP : window.DEMO_CENTRAL).montar(onde, primeira ? (DEMO.extra.tela || '') : null); };
    if (primeira) montar(); else DEMO.transicao(() => { montar(); window.scrollTo(0, 0); });
  }
  DEMO.iniciar({ pagina: inicial, raiz, montar: () => { trocar(raiz, faixa, palco); trocarVista(inicial, true); } });
})();
