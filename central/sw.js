// Service worker da Central (rxsync-sistema #225, DEC-181). A notificação chega SEM conteúdo; aqui a Central é perguntada
// só pelos números (push_resumo, com a chave desta inscrição, guardada no IndexedDB do aparelho; nunca a sessão) e a
// notificação é mostrada. Se a pergunta falhar, uma frase geral. Tocar abre Avisos.
const N8N = 'https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/central';
const NOMES = { alertas: 'Alertas', falhas: 'Falhas', clientes: 'Clientes', financeiro: 'Financeiro', vendas: 'Vendas', suporte: 'Suporte', painel: 'Painel', sistema: 'Sistema', entradas: 'Entradas', avx: 'AVX' };
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
const ler = () => new Promise(ok => { try { const q = indexedDB.open('rxsync-central', 1); q.onupgradeneeded = () => q.result.createObjectStore('push');
  q.onsuccess = () => { const g = q.result.transaction('push').objectStore('push').get('inscricao'); g.onsuccess = () => ok(g.result || null); g.onerror = () => ok(null); }; q.onerror = () => ok(null); } catch (e) { ok(null); } });
self.addEventListener('push', e => e.waitUntil((async () => {
  let corpo = 'Há avisos novos na Central.', n = 0;
  try {
    const s = await ler();
    if (s) {
      const r = await fetch(N8N, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-rxsync-origem': 'rxsync-site-2026' }, body: JSON.stringify({ acao: 'push_resumo', dados: { endpoint: s.endpoint, chave: s.chave } }), credentials: 'omit' });
      const j = await r.json();
      if (j && j.ok) {
        n = Number(j.nao_lidos) || 0;
        const partes = Object.entries(j.por_assunto || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => (NOMES[k] || k) + ': ' + v + (v === 1 ? ' aviso novo' : ' avisos novos'));
        if (partes.length) corpo = partes.slice(0, 3).join(' · ');
      }
    }
  } catch (e) { /* fica a frase geral */ }
  try { if (self.navigator.setAppBadge) n ? await self.navigator.setAppBadge(n) : await self.navigator.clearAppBadge(); } catch (e) { /* sem número no ícone */ }
  await self.registration.showNotification('Central RXSync', { body: corpo, tag: 'avisos', icon: '/assets/icones/rxsync-192.png', data: { url: '/central/#avisos' } });
})()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    for (const c of l) if (c.url.includes('/central/')) { c.navigate('/central/#avisos'); return c.focus(); }
    return self.clients.openWindow('/central/#avisos');
  }));
});
