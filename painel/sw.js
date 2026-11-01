// Service worker do painel (rxsync-sistema #225, DEC-181): a notificação de "Precisam de você" chega SEM conteúdo; aqui
// o servidor é perguntado só pelo número de chamados abertos (push_resumo, com a chave desta inscrição, guardada no
// IndexedDB do aparelho; nunca a sessão). Nenhum dado do paciente. Tocar abre Hoje.
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/painel-entrada';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
const ler = () => new Promise(ok => { try { const q = indexedDB.open('rxsync-painel', 1); q.onupgradeneeded = () => q.result.createObjectStore('push');
  q.onsuccess = () => { const g = q.result.transaction('push').objectStore('push').get('inscricao'); g.onsuccess = () => ok(g.result || null); g.onerror = () => ok(null); }; q.onerror = () => ok(null); } catch (e) { ok(null); } });
self.addEventListener('push', e => e.waitUntil((async () => {
  let corpo = 'Um paciente precisa de você.', n = 0;
  try {
    const s = await ler();
    if (s) {
      const r = await fetch(N8N, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-rxsync-origem': 'rxsync-site-2026' }, body: JSON.stringify({ acao: 'push_resumo', dados: { endpoint: s.endpoint, chave: s.chave } }), credentials: 'omit' });
      const j = await r.json(); n = Number(j && j.chamados) || 0;
      if (n > 1) corpo = n + ' pacientes precisam de você.';
    }
  } catch (e) { /* fica a frase geral */ }
  try { if (self.navigator.setAppBadge) n ? await self.navigator.setAppBadge(n) : await self.navigator.clearAppBadge(); } catch (e) { /* sem número no ícone */ }
  await self.registration.showNotification('RXSync', { body: corpo, tag: 'precisam', icon: '/assets/icones/rxsync-192.png', data: { url: '/painel/#hoje' } });
})()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    for (const c of l) if (c.url.includes('/painel/')) { c.navigate('/painel/#hoje'); return c.focus(); }
    return self.clients.openWindow('/painel/#hoje');
  }));
});
