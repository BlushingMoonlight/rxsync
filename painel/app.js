// Painel: instalar o app e ativar as notificações de "Precisam de você" (rxsync-sistema #225, itens 27 e 28; DEC-178 e
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
      if (x && x.ok) { await guardar({ endpoint: s.endpoint, chave }); box.replaceChildren(); }
      rapida((x && x.mensagem) || 'Não consegui ligar agora.');
    } catch (e) { rapida('Não consegui ligar as notificações neste aparelho.'); }
  }
  function hoje(box) {
    if (!box || depois) return;
    box.replaceChildren();
    if (!instalado()) {
      box.append(el('div', { class: 'cartao pad bloco', id: 'appInstalar' }, el('p', { class: 'tit-bloco', text: 'Instale o painel no seu aparelho' }),
        el('p', { class: 'mudo', text: 'Instalado, ele abre como um app e avisa quando um paciente precisa de você.' }),
        ehIOS ? passos() : el('p', { class: 'mudo', text: 'No Chrome, use o menu do navegador e "Instalar app".' }),
        el('div', { class: 'pilha' }, btn('Agora não', () => { depois = true; box.replaceChildren(); }, 'fant'))));
      return;
    }
    if (!pronto || !P.comSessao() || Notification.permission === 'granted') return;
    box.append(el('div', { class: 'cartao pad bloco', id: 'appNotificacoes' }, el('p', { class: 'tit-bloco', text: 'Avisos de "Precisam de você" neste aparelho' }),
      el('p', { class: 'mudo', text: 'Quando um paciente pedir uma pessoa ou tiver urgência, o aparelho avisa (sem o nome do paciente). Para desligar depois: Ajustes do aparelho › Notificações › RXSync.' }),
      el('div', { class: 'pilha' }, btn('Ativar notificações', () => ativar(box), 'pri'), btn('Agora não', () => { depois = true; box.replaceChildren(); }, 'fant'))));
  }
  window.rxApp = Object.freeze({ hoje });
  const b = document.getElementById('appCartao'); if (b) hoje(b);
})();
