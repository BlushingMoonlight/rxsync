// ---------------------------------------------------------------- app autenticador, notificações e instalar (#225, DEC-180 e DEC-181)
// O código de entrada vem do app autenticador (app Senhas do iPad), conferido no banco. As notificações chegam sem
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
// Hoje: o cartão "Instalar a Central", só no navegador (no app instalado, não aparece). "Agora não" vale até fechar a Central (só na memória).
function cartaoInstalar() {
  if (ehInstalado() || est.instalarDepois) return null;
  const box = cartao('Instale a Central no iPad', null, corpo(el('p', { class: 'mudo', text: 'Instalada, ela abre como um app e pode mandar notificações dos avisos.' }),
    ehIOS() ? passosInstalar('a Central') : el('p', { class: 'mudo', text: 'No Chrome, use o menu do navegador e "Instalar app".' }),
    el('div', { class: 'acoes' }, btn('Agora não', () => { est.instalarDepois = true; box.remove(); }, 'fant'))));
  return box;
}
// Segurança: a entrada pelo app autenticador.
async function cartaoApp() {
  const r = await chamar('totp_estado');
  const cx = corpo();
  const mostrarCodigos = (codigos, msg) => trocar(cx, el('p', { class: 'mudo', text: msg }),
    el('p', { class: 'tit-peq', text: 'Códigos de recuperação (cada um vale uma vez; guarde fora do iPad, em papel):' }),
    el('ol', { class: 'codigos-rec' }, (codigos || []).map(k => el('li', { text: k }))),
    el('div', { class: 'acoes' }, btn('Copiar os códigos', () => { navigator.clipboard && navigator.clipboard.writeText((codigos || []).join('\n')); rapida('Códigos copiados.'); }, 'sec'), btn('Já guardei', () => rotear(), 'pri')));
  const pedirSenhaE = async (acao, titulo) => {
    const v = await pedirAcao(acao, {}, { nivel: 1, titulo, campos: [{ k: 'senha', rot: 'Sua senha da Central', tipo: 'password' }], botao: 'Continuar' });
    return v ? chamar(acao, { senha: v.senha }) : null;
  };
  if (r.ok && r.ativo) {
    trocar(cx, el('p', { class: 'mudo', text: 'O código de entrada vem do app autenticador' + (r.ativado_em ? ' desde ' + fmtHora(r.ativado_em) : '') + '. Códigos de recuperação que ainda valem: ' + (r.recuperacao_restantes || 0) + '.' }),
      el('div', { class: 'acoes' }, btn('Gerar códigos de recuperação novos', async () => { const x = await pedirSenhaE('totp_codigos_novos', 'Gerar códigos novos'); if (x && x.ok) mostrarCodigos(x.codigos, x.mensagem); else if (x) rapida(x.mensagem || 'Não consegui.'); }, 'sec')));
  } else {
    trocar(cx, el('p', { class: 'mudo', text: 'Hoje o código de entrada chega pelo Telegram. Ative o app autenticador (o app Senhas do iPad) e o código passa a vir dele.' }),
      el('div', { class: 'acoes' }, btn('Ativar o app autenticador', async () => {
        const x = await pedirSenhaE('totp_iniciar', 'Ativar o app autenticador'); if (!x) return; if (!x.ok) { rapida(x.mensagem || 'Não consegui.'); return; }
        const codigo = el('input', { class: 'entrada codigo', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', 'aria-label': 'Código de 6 dígitos do app' });
        const erro = el('p', { class: 'erro', role: 'alert' });
        trocar(cx, el('ol', { class: 'passos-instalar' },
            el('li', {}, 'Toque em ', el('a', { href: x.otpauth, text: 'Abrir no app Senhas' }), '. No iPad, o app Senhas abre e pergunta onde guardar o código de verificação; escolha "RXSync Central".'),
            el('li', { text: 'Se o app não abrir, no app Senhas toque em "Códigos" › "+" e digite esta chave: ' + x.segredo }),
            el('li', { text: 'Digite aqui o código de 6 dígitos que o app mostra.' })),
          el('label', { class: 'campo' }, el('span', { class: 'rot', text: 'Código de 6 dígitos' }), codigo), erro,
          el('div', { class: 'acoes' }, btn('Confirmar', async () => {
            const y = await chamar('totp_ativar', { codigo: soDigitos(codigo.value) });
            if (y.ok) mostrarCodigos(y.codigos, y.mensagem); else { erro.textContent = y.mensagem || 'Código errado. Confira no app e digite de novo.'; codigo.value = ''; codigo.focus(); }
          }, 'pri')));
        codigo.focus();
      }, 'pri')));
  }
  return cartao('Entrada pelo app autenticador', null, cx);
}
// Segurança: notificações neste aparelho (só no app instalado; no iPad, iPadOS 16.4 ou mais novo).
async function cartaoNotificacoes() {
  const cx = corpo();
  const pronto = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!ehInstalado() || !pronto) {
    trocar(cx, el('p', { class: 'mudo', text: 'As notificações só funcionam com a Central instalada (no iPad, iPadOS 16.4 ou mais novo). Para instalar:' }), passosInstalar('a Central'));
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
    el('div', { class: 'acoes' }, btn(k.inscrito ? 'Salvar' : 'Ativar notificações', ligar, 'pri'),
      k.inscrito ? btn('Desligar neste aparelho', async () => { const x = await chamar('push_sair', { endpoint: sub ? sub.endpoint : '' }); if (sub) await sub.unsubscribe(); await guardarInscricao(null); rapida(x.mensagem || 'Desligadas.'); rotear(); }, 'perigo-sec') : null));
  return cartao('Notificações neste aparelho', null, cx);
}
