// ---------------------------------------------------------------- notificações e instalar (#225, DEC-181)
// O app autenticador saiu (DEC-186): o código de entrada chega no e-mail de cadastro. As notificações chegam sem
// conteúdo: o service worker (central/sw.js) pergunta só os números (push_resumo) e mostra "Alertas: 1 aviso novo".
const ehInstalado = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const ehIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const B64 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, ch => ch.charCodeAt(0)); };
const chaveAleatoria = () => { const a = new Uint8Array(32); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
// A chave da inscrição fica no próprio aparelho (IndexedDB), para o service worker perguntar o que há de novo.
function guardarInscricao(dados) {
  return new Promise(ok => { try { const q = indexedDB.open('rxsync-central', 1); q.onupgradeneeded = () => q.result.createObjectStore('push');
    q.onsuccess = () => { const tx = q.result.transaction('push', 'readwrite'); dados ? tx.objectStore('push').put(dados, 'inscricao') : tx.objectStore('push').delete('inscricao'); tx.oncomplete = () => ok(true); tx.onerror = () => ok(false); };
    q.onerror = () => ok(false); } catch (e) { ok(false); } });
}
function passosInstalar(onde) {
  return el('ol', { class: 'passos-instalar' },
    el('li', { text: 'Abra ' + onde + ' no Safari.' }),
    el('li', { text: 'Toque no botão Compartilhar (o quadrado com a seta para cima, no alto da tela).' }),
    el('li', { text: 'Role e toque em "Adicionar à Tela de Início".' }),
    el('li', { text: 'Toque em "Adicionar".' }),
    el('li', { text: 'Feche o Safari e abra pelo ícone novo da Tela de Início.' }),
    el('li', { text: 'Dentro do app, toque em "Ativar notificações" e depois em "Permitir".' }));
}
// Hoje: o cartão "Instale a Central", só no navegador (no app instalado, não aparece), no fim de Hoje, depois do que precisa
// de atenção (auditoria de 01/11/2026, FD-26). "Agora não" vale 30 dias neste aparelho (FD-02).
const instalarAdiado = () => { if (est.instalarDepois) return true; try { return Date.now() - Number(localStorage.getItem('central_instalar_depois') || 0) < 30 * 86400000; } catch (e) { return false; } };
function cartaoInstalar() {
  if (ehInstalado() || instalarAdiado()) return null;
  const box = cartao('Instale a Central', null, corpo(el('p', { class: 'mudo', text: 'Instalada, ela abre como um app e pode mandar notificações dos avisos.' }),
    ehIOS() ? passosInstalar('a Central') : el('p', { class: 'mudo', text: 'No Chrome, use o menu do navegador e "Instalar app".' }),
    el('div', { class: 'acoes' }, btn('Agora não', () => { est.instalarDepois = true; try { localStorage.setItem('central_instalar_depois', String(Date.now())); } catch (e) {} box.remove(); }, 'fant'))));
  return box;
}
// Segurança: notificações neste aparelho (só no app instalado; no iPad, iPadOS 16.4 ou mais novo) e o "Mandar alerta de
// teste" (antes no fim de Avisos, onde ninguém achava: auditoria de 01/11/2026, FD-23). O teste vale também sem o app: o
// e-mail dos urgentes chega do mesmo jeito.
const alertaTeste = () => btn('Mandar alerta de teste', async () => { const x = await chamar('aviso_teste'); rapida(x.mensagem || (x.ok ? 'Alerta de teste enviado.' : 'Não consegui.')); }, 'sec');
async function cartaoNotificacoes() {
  const cx = corpo();
  const pronto = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!ehInstalado() || !pronto) {
    trocar(cx, el('p', { class: 'mudo', text: 'As notificações só funcionam com a Central instalada (no iPad, iPadOS 16.4 ou mais novo). Para instalar:' }), passosInstalar('a Central'),
      el('p', { class: 'mudo', text: '"Mandar alerta de teste" manda um alerta para Avisos, para o e-mail de cadastro e, com a Central instalada, como notificação.' }), el('div', { class: 'acoes' }, alertaTeste()));
    return cartao('Notificações neste aparelho', null, cx);
  }
  const reg = await navigator.serviceWorker.register('/central/sw.js', { scope: '/central/' });
  const sub = await reg.pushManager.getSubscription();
  const k = await chamar('push_chave', { endpoint: sub ? sub.endpoint : '' });
  const marcados = new Set(k.assuntos && k.assuntos.length ? k.assuntos : ['alertas', 'falhas', 'clientes', 'financeiro', 'vendas', 'suporte']);
  const caixas = el('div', { class: 'filtros opcoes-assuntos', role: 'group', 'aria-label': 'Assuntos que notificam' }, CATEGORIAS.map(a => el('button', { type: 'button', 'data-assunto': a,
    'aria-pressed': String(marcados.has(a)), onclick: e => e.currentTarget.setAttribute('aria-pressed', String(e.currentTarget.getAttribute('aria-pressed') !== 'true')) }, NOME_ASSUNTO[a] || a)));
  const assuntos = () => [...caixas.querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.assunto);
  const ligar = async () => {
    if (!k.ok) { rapida(k.mensagem || 'As notificações ainda não estão prontas. Tente de novo em 1 hora.'); return; }
    const p = await Notification.requestPermission(); if (p !== 'granted') { rapida('Sem permissão. No iPad: Ajustes › Notificações › Central RXSync.'); return; }
    const s = sub || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: B64(k.publica) });
    const chave = chaveAleatoria();
    const x = await chamar('push_inscrever', { endpoint: s.endpoint, chave, assuntos: assuntos() });
    if (x.ok) await guardarInscricao({ endpoint: s.endpoint, chave });
    rapida(x.mensagem || (x.ok ? 'Notificações ligadas.' : 'Não consegui.')); rotear();
  };
  trocar(cx, el('p', { class: 'mudo', text: k.inscrito ? 'Ligadas neste aparelho. Escolha os assuntos e toque em "Salvar".' : 'Escolha os assuntos e toque em "Ativar notificações". O iPad pede a permissão uma vez.' }), caixas,
    el('div', { class: 'acoes' }, btn(k.inscrito ? 'Salvar' : 'Ativar notificações', ligar, 'pri'), alertaTeste(),
      k.inscrito ? btn('Desligar neste aparelho', async () => { const x = await chamar('push_sair', { endpoint: sub ? sub.endpoint : '' }); if (sub) await sub.unsubscribe(); await guardarInscricao(null); rapida(x.mensagem || 'Desligadas.'); rotear(); }, 'perigo-sec') : null));
  return cartao('Notificações neste aparelho', null, cx);
}
