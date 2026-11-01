// Painel: instalar o app e ativar as notificações de "Precisa de você" (rxsync-sistema #225, itens 27 e 28; DEC-178 e
// DEC-181). Arquivo à parte, carregado só depois de o painel abrir (o painel cabe em 400 KB). Só usa o que o painel
// expõe em window.rxPainel. A notificação chega sem conteúdo; o service worker (painel/sw.js) pergunta só o número de
// chamados abertos e mostra "Um paciente precisa de você" (sem dado do paciente).
(function () {
  'use strict';
  const P = window.rxPainel; if (!P) return;
  const { el, btn, c29, rapida } = P;
  const instalado = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const pronto = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  let depois = false;
  const B64 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  const chaveAleatoria = () => { const a = new Uint8Array(32); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const guardar = dados => new Promise(ok => { try { const q = indexedDB.open('rxsync-painel', 1); q.onupgradeneeded = () => q.result.createObjectStore('push');
    q.onsuccess = () => { const tx = q.result.transaction('push', 'readwrite'); tx.objectStore('push').put(dados, 'inscricao'); tx.oncomplete = () => ok(true); tx.onerror = () => ok(false); }; q.onerror = () => ok(false); } catch (e) { ok(false); } });
  const passos = () => el('ol', { class: 'passos-instalar' },
    el('li', { text: 'Abra o painel no Safari.' }),
    el('li', { text: 'Toque no botão Compartilhar (o quadrado com a seta para cima, no alto da tela).' }),
    el('li', { text: 'Role e toque em "Adicionar à Tela de Início".' }),
    el('li', { text: 'Toque em "Adicionar".' }),
    el('li', { text: 'Feche o Safari e abra pelo ícone novo da Tela de Início.' }),
    el('li', { text: 'Dentro do app, toque em "Ativar notificações" e depois em "Permitir".' }));
  async function ativar(box) {
    try {
      const reg = await navigator.serviceWorker.register('/painel/sw.js', { scope: '/painel/' });
      const k = await c29('push_chave', {});
      if (!k || !k.ok) { rapida((k && k.mensagem) || 'As notificações ainda não estão prontas. Tente de novo mais tarde.'); return; }
      if (await Notification.requestPermission() !== 'granted') { rapida('Sem permissão. No iPad: Ajustes › Notificações › RXSync.'); return; }
      const s = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: B64(k.publica) });
      const chave = chaveAleatoria();
      const x = await c29('push_inscrever', { endpoint: s.endpoint, chave });
      if (x && x.ok) { await guardar({ endpoint: s.endpoint, chave }); mostrar(box, []); }
      rapida((x && x.mensagem) || 'Não consegui ligar agora.');
    } catch (e) { rapida('Não consegui ligar as notificações neste aparelho.'); }
  }
  // "Agora não" vale 30 dias neste aparelho (auditoria de 01/11/2026, FD-02); sem armazenamento, vale até fechar o painel.
  const DEPOIS = 'rx_app_depois', DIAS30 = 30 * 86400000;
  const adiado = () => { if (depois) return true; try { return Date.now() - Number(localStorage.getItem(DEPOIS) || 0) < DIAS30; } catch (e) { return false; } };
  const adiar = () => { depois = true; try { localStorage.setItem(DEPOIS, String(Date.now())); } catch (e) {} };
  // Uma linha (nos primeiros passos ou no bloco "Neste aparelho", no fim de Hoje) que abre a folha (molde H): nunca um cartão
  // no alto de Hoje (FD-01).
  const linha = (id, t1, t2, abrir) => el('button', { class: 'linha', type: 'button', id, onclick: abrir },
    el('span', { class: 'ic' }, P.icone('sino')), el('span', { class: 'tx' }, el('span', { class: 't1', text: t1 }), el('span', { class: 't2', text: t2 })), el('span', { class: 'seta' }, P.icone('seta')));
  function mostrar(box, filhos) { box.replaceChildren(...filhos); const b = box.closest('#appBloco'); if (b) b.hidden = !box.childElementCount; }
  function hoje(box) {
    if (!box) return;
    mostrar(box, []);
    if (adiado()) return;
    const agoraNao = g => btn('Agora não', () => { adiar(); g.fechar(); mostrar(box, []); }, 'fant');
    if (!instalado()) {
      mostrar(box, [linha('appInstalar', 'Instalar o painel', 'Abre como um app e avisa quando um paciente precisa de você', () => {
        let g = null; g = P.folha('Instalar o painel', el('div', {}, el('p', { class: 'mudo', text: 'Instalado, ele abre como um app e avisa quando um paciente precisa de você.' }),
          ehIOS ? passos() : el('p', { class: 'mudo', text: 'No Chrome, use o menu do navegador e "Instalar app".' })), { id: 'appFolha', pe: [btn('Fechar', () => g.fechar(), 'sec'), agoraNao({ fechar: () => g.fechar() })] });
      })]);
      return;
    }
    if (!pronto || !P.comSessao() || Notification.permission === 'granted') return;
    mostrar(box, [linha('appNotificacoes', 'Ativar notificações', 'Quando um paciente pedir uma pessoa ou tiver urgência', () => {
      let g = null; g = P.folha('Notificações de "Precisa de você"', el('p', { class: 'mudo', text: 'Quando um paciente pedir uma pessoa ou tiver urgência, o aparelho avisa (sem o nome do paciente). Para desligar depois: Ajustes do aparelho › Notificações › RXSync.' }),
        { id: 'appFolha', pe: [btn('Ativar notificações', () => { g.fechar(); ativar(box); }, 'pri'), agoraNao({ fechar: () => g.fechar() })] });
    })]);
  }
  window.rxApp = Object.freeze({ hoje });
  const b = document.getElementById('appCartao'); if (b) hoje(b);
})();
