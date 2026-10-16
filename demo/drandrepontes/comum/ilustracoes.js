/* AG Melhor Versão · ilustrações próprias em SVG, no espírito "massinha" dos prints de referência:
   formas arredondadas, gradientes suaves, verde floresta, creme e dourado. Uma biblioteca só, usada pelo app e pelo painel.
   AG.ilu('copo', 64) devolve o <svg>. Os gradientes ficam num <svg> escondido no começo da página (ids agi-*).
   Desenhos próprios (não são cópia das imagens dos prints). */
(function () {
  'use strict';
  var A = window.AG || (window.AG = {});

  // ---------- gradientes comuns ----------
  function lin(id, x2, y2, stops) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' + paradas(stops) + '</linearGradient>'; }
  function rad(id, cx, cy, r, stops) { return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' + paradas(stops) + '</radialGradient>'; }
  function paradas(l) { return l.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join(''); }
  var DEFS =
    rad('agi-verde', '.32', '.26', '.85', [[0, '#8fb581'], [0.42, '#4d7b47'], [1, '#22462a']]) +
    lin('agi-verde-l', '.4', '1', [[0, '#6f9a64'], [0.5, '#3f6c40'], [1, '#23472a']]) +
    rad('agi-verde-claro', '.35', '.3', '.8', [[0, '#d9e8cc'], [1, '#9cbd8c']]) +
    rad('agi-creme', '.32', '.26', '.9', [[0, '#fffdf7'], [0.55, '#f3e4c7'], [1, '#d8bd8e']]) +
    lin('agi-creme-l', '.3', '1', [[0, '#fffaf0'], [0.6, '#f1e1c3'], [1, '#dcc196']]) +
    rad('agi-dourado', '.35', '.3', '.85', [[0, '#fbe8b8'], [0.5, '#e0b268'], [1, '#a9772f']]) +
    lin('agi-vidro', '1', '0', [[0, '#dfeadb', 0.75], [0.25, '#ffffff', 0.9], [0.7, '#e3ecdc', 0.6], [1, '#b8cdb0', 0.75]]) +
    lin('agi-agua', '0', '1', [[0, '#d4e6c8', 0.95], [1, '#98bb88', 0.95]]) +
    rad('agi-laranja', '.4', '.65', '.8', [[0, '#ffe7a0'], [0.45, '#f6a640'], [1, '#d9532b']]) +
    rad('agi-marrom', '.32', '.28', '.85', [[0, '#e7ab76'], [0.5, '#b8743f'], [1, '#7a4421']]) +
    rad('agi-pele', '.34', '.28', '.85', [[0, '#fff6e3'], [0.55, '#f4dcb6'], [1, '#d9b183']]) +
    rad('agi-vermelho', '.35', '.3', '.85', [[0, '#f59a87'], [0.5, '#cc4a3b'], [1, '#86241f']]) +
    rad('agi-amarelo', '.35', '.3', '.85', [[0, '#fff3bf'], [0.5, '#f4c95a'], [1, '#cf8f22']]) +
    rad('agi-rosa', '.35', '.3', '.85', [[0, '#ffd2c4'], [1, '#e7836a']]) +
    rad('agi-cinza', '.35', '.3', '.9', [[0, '#ffffff'], [1, '#d6d2c6']]) +
    rad('agi-sombra', '.5', '.5', '.5', [[0, '#5a4220', 0.32], [1, '#5a4220', 0]]) +
    rad('agi-brilho', '.5', '.5', '.5', [[0, '#ffffff', 0.9], [1, '#ffffff', 0]]);

  function montarDefs() {
    if (document.getElementById('agi-defs') || !document.body) return;
    var d = document.createElement('div');
    d.id = 'agi-defs'; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0" focusable="false"><defs>' + DEFS + '</defs></svg>';
    document.body.insertBefore(d, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarDefs); else montarDefs();

  // ---------- peças ----------
  var VE = 'url(#agi-verde)', VL = 'url(#agi-verde-l)', CR = 'url(#agi-creme)', CL = 'url(#agi-creme-l)', DO = 'url(#agi-dourado)', VI = 'url(#agi-vidro)';
  var TRACO = '#24452a', MAR = 'url(#agi-marrom)';
  function sombra(cx, cy, rx) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + Math.max(3, rx * 0.16) + '" fill="url(#agi-sombra)"/>'; }
  function brilho(cx, cy, rx, ry, rot) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#agi-brilho)"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>'; }
  function estrela(cx, cy, r) { var k = r * 0.28; return '<path d="M' + cx + ' ' + (cy - r) + 'Q' + (cx + k) + ' ' + (cy - k) + ' ' + (cx + r) + ' ' + cy + 'Q' + (cx + k) + ' ' + (cy + k) + ' ' + cx + ' ' + (cy + r) + 'Q' + (cx - k) + ' ' + (cy + k) + ' ' + (cx - r) + ' ' + cy + 'Q' + (cx - k) + ' ' + (cy - k) + ' ' + cx + ' ' + (cy - r) + 'Z" fill="' + DO + '"/>'; }
  function check(d, w, cor) { return '<path d="' + d + '" fill="none" stroke="' + (cor || TRACO) + '" stroke-width="' + (w || 6) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function seta(x, y, cima, cor) {
    var c = cor || DO;
    return cima ? '<path d="M' + x + ' ' + (y - 12) + 'l11 12h-6v12h-10v-12h-6z" fill="' + c + '"/>' : '<path d="M' + x + ' ' + (y + 12) + 'l11-12h-6v-12h-10v12h-6z" fill="' + c + '"/>';
  }
  function mais(x, y, r, cor) { var w = r * 0.42; return '<path d="M' + (x - w / 2) + ' ' + (y - r) + 'h' + w + 'v' + (r - w / 2) + 'h' + (r - w / 2) + 'v' + w + 'h-' + (r - w / 2) + 'v' + (r - w / 2) + 'h-' + w + 'v-' + (r - w / 2) + 'h-' + (r - w / 2) + 'v-' + w + 'h' + (r - w / 2) + 'z" fill="' + (cor || DO) + '" stroke="#fff" stroke-opacity=".35"/>'; }
  function rosto(olhos, boca, extra) {
    return sombra(50, 92, 30) + '<circle cx="50" cy="50" r="38" fill="url(#agi-pele)"/>' + brilho(36, 30, 14, 8, -30) + (extra || '') +
      '<g fill="none" stroke="' + TRACO + '" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">' + olhos + boca + '</g>';
  }
  function prato(miolo, r) {
    r = r || 40;
    return sombra(50, 86, r) + '<ellipse cx="50" cy="62" rx="' + r + '" ry="' + r * 0.5 + '" fill="url(#agi-cinza)"/><ellipse cx="50" cy="60" rx="' + (r - 7) + '" ry="' + (r * 0.5 - 4) + '" fill="#fbf8f0" stroke="#e6dfcf" stroke-width="1"/>' + miolo;
  }
  function folha(x, y, rot, esc) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + (esc || 1) + ')" d="M0 0C4-8 14-10 18-8C16-2 8 4 0 0Z" fill="' + VE + '"/>'; }
  function tomate(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#agi-vermelho)"/><circle cx="' + (x - r * .35) + '" cy="' + (y - r * .35) + '" r="' + r * .25 + '" fill="#fff" opacity=".5"/>'; }
  function ovo(x, y, s) { s = s || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse rx="11" ry="9" fill="url(#agi-cinza)"/><circle cx="1" cy="-1" r="5" fill="url(#agi-amarelo)"/></g>'; }
  function frango(x, y, s, rot) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || -12) + ') scale(' + s + ')"><path d="M-18-6C-10-12 10-12 18-6C20 2 16 9 0 10C-16 9-20 2-18-6Z" fill="url(#agi-amarelo)"/>' +
      '<path d="M-12-6l-3 12M-5-8l-3 16M2-9l-3 18M9-8l-3 16M15-6l-2 10" stroke="#9a5a26" stroke-width="2.2" stroke-linecap="round" opacity=".75"/></g>';
  }
  function moranguinho(x, y, r) { return '<path transform="translate(' + x + ' ' + y + ')" d="M0 ' + r + 'C' + (-r * 1.2) + ' ' + r * 0.2 + ' ' + (-r) + ' ' + (-r) + ' 0 ' + (-r * .7) + 'C' + r + ' ' + (-r) + ' ' + r * 1.2 + ' ' + r * .2 + ' 0 ' + r + 'Z" fill="url(#agi-vermelho)"/><path transform="translate(' + x + ' ' + y + ')" d="M-4 ' + (-r * .7) + 'l4-4 4 4z" fill="#4d7b47"/>'; }
  function livro(cor, x, y) {
    return '<g transform="translate(' + (x || 0) + ' ' + (y || 0) + ')"><path d="M18 22h50a6 6 0 0 1 6 6v54a6 6 0 0 1-6 6H18z" fill="' + VE + '"/><path d="M26 16h46a6 6 0 0 1 6 6v54a6 6 0 0 1-6 6H26z" fill="' + (cor || CR) + '"/>' +
      '<path d="M26 16h6v66h-6z" fill="#e2cfaa"/><path d="M40 26h28M40 32h20" stroke="' + DO + '" stroke-width="3" stroke-linecap="round"/></g>';
  }

  // ---------- desenhos (viewBox 0 0 100 100) ----------
  var D = {
    // hidratação
    copo: function () {
      return sombra(50, 92, 30) + '<path d="M22 16h56l-6 70a5 5 0 0 1-5 4H33a5 5 0 0 1-5-4z" fill="' + VI + '" stroke="#b7ccae" stroke-width="1.2"/>' +
        '<path d="M25.5 44h49l-3.6 42a5 5 0 0 1-5 4H34a5 5 0 0 1-5-4z" fill="url(#agi-agua)"/><ellipse cx="50" cy="44" rx="24.5" ry="3.8" fill="#e2efd9"/>' +
        '<ellipse cx="50" cy="16" rx="28" ry="4" fill="none" stroke="#c6d8bc" stroke-width="1.6"/><path d="M30 24l3 56" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".75"/>';
    },
    'copo-gota': function () { return '<g transform="translate(-6 0)">' + D.copo() + '</g><path d="M86 52c-5 7-8 11-8 15a8 8 0 0 0 16 0c0-4-3-8-8-15z" fill="' + VI + '" stroke="#b7ccae"/>' + brilho(83, 64, 2, 4); },
    'copo-grande': function () {
      return sombra(50, 93, 26) + '<path d="M27 8h46l-5 79a5 5 0 0 1-5 5H37a5 5 0 0 1-5-5z" fill="' + VI + '" stroke="#b7ccae" stroke-width="1.2"/>' +
        '<path d="M29.5 34h41l-3.4 53a5 5 0 0 1-5 5H38a5 5 0 0 1-5-5z" fill="url(#agi-agua)"/><ellipse cx="50" cy="34" rx="20.5" ry="3.4" fill="#e2efd9"/>' +
        '<ellipse cx="50" cy="8" rx="23" ry="3.6" fill="none" stroke="#c6d8bc" stroke-width="1.6"/><path d="M34 14l3 70" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>';
    },
    garrafinha: function () {
      return sombra(48, 93, 24) + '<path d="M60 22c14 0 16 10 16 16" fill="none" stroke="' + TRACO + '" stroke-width="5" stroke-linecap="round"/>' +
        '<rect x="28" y="28" width="40" height="64" rx="12" fill="' + VI + '" stroke="#b7ccae" stroke-width="1.2"/><rect x="30" y="46" width="36" height="44" rx="10" fill="url(#agi-agua)"/>' +
        '<rect x="33" y="12" width="30" height="18" rx="6" fill="' + VE + '"/><rect x="38" y="6" width="20" height="9" rx="4" fill="' + VE + '"/>' +
        '<path d="M36 34v50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M56 56h6M56 64h6M56 72h6" stroke="#8fae82" stroke-width="1.6" stroke-linecap="round"/>';
    },
    'copo-doutor': function () {
      return sombra(46, 93, 26) + '<path d="M66 40h8a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10h-8" fill="none" stroke="' + TRACO + '" stroke-width="7"/>' +
        '<path d="M24 26h44l-4 62a5 5 0 0 1-5 4H33a5 5 0 0 1-5-4z" fill="' + VE + '"/><rect x="22" y="18" width="48" height="11" rx="5" fill="' + CR + '"/>' +
        '<path d="M52 18l8-16" stroke="' + DO + '" stroke-width="4" stroke-linecap="round"/><path d="M31 34l3 46" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>';
    },
    gota: function () { return sombra(50, 92, 24) + '<path d="M50 8C38 28 24 44 24 60a26 26 0 0 0 52 0C76 44 62 28 50 8z" fill="' + VE + '"/>' + brilho(40, 52, 6, 12, 20); },
    'gota-mais': function () { return D.gota() + mais(72, 72, 15); },
    // sono, atividade
    lua: function () {
      return sombra(46, 92, 28) + '<path d="M58 12A38 38 0 1 0 84 70 30 30 0 0 1 58 12z" fill="' + VE + '"/>' + brilho(28, 42, 7, 14, 20) + estrela(74, 30, 14);
    },
    tenis: function () {
      return sombra(50, 86, 40) + '<path d="M10 70c0-10 4-22 12-28l12-8c4 6 12 10 22 8l8-4c8 6 18 12 26 16 6 3 6 16 0 18H14c-3 0-4-1-4-2z" fill="' + VE + '"/>' +
        '<path d="M8 72h84c1 6-2 10-8 10H14c-4 0-6-4-6-10z" fill="' + CR + '"/><path d="M38 40l10 2M42 34l10 2M47 28l9 3M52 46l9-1" stroke="#f3e4c7" stroke-width="3.4" stroke-linecap="round"/>' + brilho(28, 52, 8, 4, -20);
    },
    'tenis-corrida': function () { return '<g transform="translate(8 0)">' + D.tenis() + '</g><path d="M4 44h18M0 54h14M6 64h12" stroke="' + DO + '" stroke-width="4" stroke-linecap="round"/>'; },
    haltere: function () {
      return sombra(50, 84, 40) + '<rect x="28" y="44" width="44" height="10" rx="5" fill="' + CR + '"/>' +
        '<rect x="12" y="28" width="18" height="44" rx="8" fill="' + VE + '"/><rect x="70" y="28" width="18" height="44" rx="8" fill="' + VE + '"/>' +
        '<rect x="4" y="36" width="10" height="28" rx="5" fill="' + VE + '"/><rect x="86" y="36" width="10" height="28" rx="5" fill="' + VE + '"/>' + brilho(18, 38, 3, 8) + brilho(76, 38, 3, 8);
    },
    bicicleta: function () {
      return sombra(50, 88, 42) + '<circle cx="24" cy="64" r="18" fill="none" stroke="url(#agi-creme-l)" stroke-width="7"/><circle cx="76" cy="64" r="18" fill="none" stroke="url(#agi-creme-l)" stroke-width="7"/>' +
        '<path d="M24 64l16-26h30l6 26M40 38l12 26h0l18-26M52 64L24 64M36 30h12M70 38l-4-10h8" fill="none" stroke="' + TRACO + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="52" cy="64" r="4" fill="' + DO + '"/>';
    },
    oculos: function () {
      return sombra(50, 82, 40) + '<path d="M6 46c0-8 6-12 12-12h64c6 0 12 4 12 12" fill="none" stroke="' + TRACO + '" stroke-width="5"/>' +
        '<rect x="8" y="34" width="38" height="32" rx="16" fill="' + VE + '"/><rect x="54" y="34" width="38" height="32" rx="16" fill="' + VE + '"/>' +
        '<rect x="14" y="40" width="26" height="20" rx="10" fill="url(#agi-verde-claro)"/><rect x="60" y="40" width="26" height="20" rx="10" fill="url(#agi-verde-claro)"/><rect x="44" y="44" width="12" height="6" rx="3" fill="' + VE + '"/>' + brilho(22, 46, 5, 3) + brilho(68, 46, 5, 3);
    },
    'pessoa-ativa': function () {
      return sombra(46, 92, 26) + '<circle cx="54" cy="18" r="10" fill="' + VE + '"/>' +
        '<path d="M50 32l-8 24 14 10-6 22M44 56l-16 24M48 38l-18 6M52 36l14 14 14-4" fill="none" stroke="url(#agi-verde-l)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' + estrela(80, 18, 11);
    },
    // fome, intestino
    estomago: function () {
      return sombra(50, 92, 32) + '<path d="M30 6h14v16c0 6 5 9 13 9 17 0 29 12 29 29 0 19-15 31-34 31-9 0-15-3-21-1l-8 4c-5 2-9-3-6-7l6-8c4-6 2-12 2-21 0-9 5-15 5-23z" fill="' + VE + '"/>' + brilho(36, 28, 3, 10) + brilho(62, 44, 10, 4, -20) +
        '<circle cx="60" cy="64" r="16" fill="' + CR + '" stroke="#d9c39a" stroke-width="2"/><path d="M49 66a11 11 0 0 1 22 0" fill="none" stroke="#c9a063" stroke-width="2" stroke-dasharray="2 3"/><path d="M60 66l7-8" stroke="' + TRACO + '" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="66" r="3" fill="' + TRACO + '"/>';
    },
    intestino: function () {
      var grosso = 'M28 80V36a12 12 0 0 1 12-12h20a12 12 0 0 1 12 12v42', fino = 'M40 38h20a6 6 0 0 1 0 12H40a6 6 0 0 0 0 12h20a6 6 0 0 1 0 12H46';
      return sombra(50, 92, 30) + '<path d="M8 50h8M84 50h8M14 20l6 6M86 20l-6 6M14 80l6-6M86 80l-6-6" stroke="' + VE + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="' + grosso + '" fill="none" stroke="#d2b688" stroke-width="15" stroke-linecap="round"/><path d="' + grosso + '" fill="none" stroke="url(#agi-creme-l)" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="' + fino + '" fill="none" stroke="#d2b688" stroke-width="10" stroke-linecap="round"/><path d="' + fino + '" fill="none" stroke="#f6ead2" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M72 78c0 6-2 10-6 12" fill="none" stroke="' + VE + '" stroke-width="7" stroke-linecap="round"/><path d="M28 28c-2-8 2-14 8-16" fill="none" stroke="' + VE + '" stroke-width="7" stroke-linecap="round"/>' + brilho(36, 30, 6, 2.5);
    },
    // calendário, medicamentos, picadinha
    calendario: function () {
      return sombra(50, 92, 32) + '<rect x="16" y="20" width="68" height="66" rx="12" fill="' + CR + '"/><path d="M16 34a12 12 0 0 1 12-14h44a12 12 0 0 1 12 14z" fill="' + VE + '"/>' +
        '<rect x="30" y="10" width="8" height="18" rx="4" fill="' + VE + '"/><rect x="62" y="10" width="8" height="18" rx="4" fill="' + VE + '"/>' +
        '<path d="M28 46h8M46 46h8M64 46h8M28 58h8M46 58h8" stroke="#e2cfaa" stroke-width="5" stroke-linecap="round"/>' + check('M40 68l8 8 16-18', 7);
    },
    medicamentos: function () {
      return '<g transform="translate(14 -6) scale(.86)">' + D.calendario() + '</g>' +
        '<g transform="rotate(-30 34 74)">' + sombra(34, 90, 22) + '<rect x="10" y="62" width="48" height="22" rx="11" fill="' + CR + '"/><path d="M34 62h13a11 11 0 0 1 0 22H34z" fill="' + VE + '"/>' + brilho(22, 67, 8, 2.5) + '</g>';
    },
    seringa: function () {
      return '<g transform="translate(26 4) scale(.74)">' + D.calendario() + '</g>' +
        '<g transform="rotate(42 40 52)"><rect x="32" y="2" width="16" height="6" rx="3" fill="' + VE + '"/><rect x="37" y="8" width="6" height="16" fill="' + VE + '"/>' +
        '<rect x="26" y="22" width="28" height="7" rx="3" fill="' + VE + '"/><rect x="30" y="28" width="20" height="50" rx="5" fill="' + VI + '" stroke="#b7ccae"/>' +
        '<rect x="32" y="46" width="16" height="30" rx="3" fill="url(#agi-verde-claro)"/><path d="M33 36h6M33 44h6M33 52h6M33 60h6M33 68h6" stroke="#24452a" stroke-width="1.4"/>' +
        '<rect x="34" y="78" width="12" height="6" rx="2" fill="' + DO + '"/><path d="M40 84v16" stroke="#9b8f7a" stroke-width="2.2" stroke-linecap="round"/></g>';
    },
    caneta: function () {
      return sombra(50, 90, 30) + '<g transform="rotate(-40 50 50)"><rect x="40" y="2" width="20" height="26" rx="8" fill="' + VE + '"/><rect x="38" y="24" width="24" height="56" rx="10" fill="' + CR + '"/>' +
        '<rect x="44" y="40" width="12" height="18" rx="4" fill="#d9e8cc" stroke="#9cbd8c"/><rect x="38" y="66" width="24" height="10" fill="' + DO + '"/><rect x="42" y="80" width="16" height="12" rx="5" fill="' + VE + '"/>' + brilho(44, 50, 2, 14) + '</g>';
    },
    frasco: function () {
      return sombra(50, 92, 22) + '<rect x="34" y="8" width="32" height="12" rx="4" fill="' + VE + '"/><rect x="38" y="18" width="24" height="8" fill="#c7b796"/>' +
        '<path d="M32 30c0-4 4-6 8-6h20c4 0 8 2 8 6v56a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" fill="' + CL + '"/><rect x="32" y="44" width="36" height="28" fill="' + DO + '"/><rect x="38" y="52" width="24" height="12" rx="3" fill="#fbf3df"/>' + brilho(38, 40, 2, 14);
    },
    // livros e revistas
    livros: function () { return sombra(50, 92, 34) + '<g transform="translate(-6 0)">' + livro(CR) + '</g>'; },
    'livro-aberto': function () {
      return sombra(50, 86, 38) + '<path d="M8 40c14-4 28-2 42 6 14-8 28-10 42-6v40c-14-4-28-2-42 6-14-8-28-10-42-6z" fill="' + VE + '"/>' +
        '<path d="M12 36c12-3 26-1 38 6v40c-12-7-26-9-38-6zM88 36c-12-3-26-1-38 6v40c12-7 26-9 38-6z" fill="' + CR + '"/><path d="M50 18v10M38 22l4 8M62 22l-4 8" stroke="' + DO + '" stroke-width="3.4" stroke-linecap="round"/>';
    },
    'revista-nutri': function () { return D.livros() + '<g transform="translate(30 38) scale(.55)">' + prato(frango(50, 56, 1.1) + folha(26, 56, -30, 1.2) + folha(30, 50, -70, 1.1) + tomate(70, 62, 6)) + '</g>'; },
    'revista-psico': function () {
      return D.livros() + '<g transform="translate(36 34)"><path d="M10 8c4-6 14-6 16-2 6-2 14 2 12 10 6 4 4 14-2 16-2 6-10 8-14 4-6 4-14 0-14-6-6-2-8-10-2-14-2-4 0-8 4-8z" fill="url(#agi-pele)"/>' +
        '<path d="M18 10c2 4-2 6 0 10M28 12c-2 4 2 8-2 12" fill="none" stroke="#d1a676" stroke-width="2" stroke-linecap="round"/><rect x="30" y="24" width="20" height="14" rx="6" fill="' + VE + '"/><circle cx="35" cy="31" r="1.6" fill="#fff"/><circle cx="40" cy="31" r="1.6" fill="#fff"/><circle cx="45" cy="31" r="1.6" fill="#fff"/></g>';
    },
    'revista-medica': function () {
      return D.livros() + '<g transform="translate(34 30)" fill="none" stroke-linecap="round"><path d="M8 4v12a10 10 0 0 0 20 0V4" stroke="' + DO + '" stroke-width="3.4"/><path d="M18 26v8a12 12 0 0 0 24 0v-6" stroke="' + TRACO + '" stroke-width="3.4"/><circle cx="42" cy="24" r="6" fill="' + DO + '" stroke="none"/><circle cx="42" cy="24" r="2.5" fill="#fbf3df" stroke="none"/></g>';
    },
    // humor
    'rosto-0': function () { return rosto('<path d="M30 40l12 4M70 40l-12 4"/><path d="M33 52q5-4 10 0M57 52q5-4 10 0"/>', '<path d="M36 72q14-12 28 0"/>'); },
    'rosto-1': function () { return rosto('<path d="M32 40l8-3M68 40l-8-3"/><circle cx="38" cy="50" r="1.6" fill="#24452a"/><circle cx="62" cy="50" r="1.6" fill="#24452a"/>', '<path d="M39 70q11-8 22 0"/>'); },
    'rosto-2': function () { return rosto('<circle cx="38" cy="47" r="1.8" fill="#24452a"/><circle cx="62" cy="47" r="1.8" fill="#24452a"/>', '<path d="M39 66h22"/>'); },
    'rosto-3': function () { return rosto('<path d="M31 50q6-7 12 0M57 50q6-7 12 0"/>', '<path d="M37 62q13 12 26 0"/>'); },
    'rosto-4': function () { return rosto('<path d="M30 48q7-8 14 0M56 48q7-8 14 0"/>', '<path d="M34 60q16 16 32 0z" fill="#24452a"/>', '<circle cx="28" cy="60" r="5" fill="#f2b8a0" opacity=".55"/><circle cx="72" cy="60" r="5" fill="#f2b8a0" opacity=".55"/>'); },
    cansado: function () { return rosto('<path d="M31 48q6 5 12 0M57 48q6 5 12 0"/>', '<path d="M40 68q10-5 20 0"/>'); },
    // comida
    'prato-cafe': function () {
      return prato('<path d="M16 56c-2-12 6-16 14-16s14 6 12 16z" fill="url(#agi-marrom)"/><path d="M18 50c2-6 8-8 12-8" stroke="#f0c79a" stroke-width="2" fill="none"/>' + ovo(56, 62, 1.1) + ovo(72, 58) +
        '<g transform="translate(62 18)"><path d="M0 4h24l-3 20a4 4 0 0 1-4 3H7a4 4 0 0 1-4-3z" fill="' + CR + '"/><ellipse cx="12" cy="5" rx="11" ry="3" fill="#5a3418"/><path d="M24 9c6 0 6 9 0 9" fill="none" stroke="#dcc196" stroke-width="3"/></g>');
    },
    'prato-almoco': function () {
      return prato('<ellipse cx="34" cy="56" rx="14" ry="9" fill="#fffaf0" stroke="#efe5d2"/><circle cx="30" cy="54" r="1" fill="#e8dcc4"/><circle cx="36" cy="58" r="1" fill="#e8dcc4"/>' +
        '<ellipse cx="50" cy="48" rx="12" ry="7" fill="#6b3a22"/><circle cx="46" cy="47" r="2" fill="#8a4c2c"/><circle cx="52" cy="49" r="2" fill="#8a4c2c"/>' + frango(56, 64, .95, -8) +
        folha(66, 50, -40, 1.1) + folha(70, 46, -90, 1.1) + folha(74, 54, 10, 1) + tomate(78, 58, 5) + tomate(70, 60, 4));
    },
    tigela: function () {
      return sombra(50, 88, 34) + '<path d="M14 46h72c0 22-16 38-36 38S14 68 14 46z" fill="url(#agi-cinza)"/><ellipse cx="50" cy="46" rx="36" ry="10" fill="#fdfbf6" stroke="#e6dfcf"/>' +
        moranguinho(36, 42, 7) + moranguinho(52, 38, 7) + '<ellipse cx="64" cy="44" rx="8" ry="5" fill="#fff1c2" stroke="#e8d59c"/><circle cx="44" cy="46" r="4" fill="#5a6fb0"/><circle cx="58" cy="48" r="3.5" fill="#4a5e9e"/><path d="M28 48l6-2M70 46l-4-3" stroke="#c48a4a" stroke-width="3" stroke-linecap="round"/>';
    },
    'prato-proteina': function () { return prato(frango(40, 56, 1.15, -10) + ovo(66, 60, 1.15) + folha(56, 44, -60, 1.1) + folha(60, 48, -10)); },
    'prato-pouco': function () { return prato(tomate(46, 58, 5) + folha(52, 56, -30, .9) + folha(42, 54, -120, .8), 32); },
    'prato-medio': function () { return prato(frango(44, 58, .9, -8) + folha(60, 52, -40) + tomate(62, 60, 4.5) + '<ellipse cx="34" cy="54" rx="9" ry="6" fill="#fffaf0" stroke="#efe5d2"/>', 36); },
    'prato-grande': function () {
      return prato('<path d="M24 54c4-10 22-12 30-4 6 6 0 16-12 16-12 0-20-4-18-12z" fill="url(#agi-marrom)"/><path d="M30 54l12-4M32 60l14-6" stroke="#5a2f15" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
        '<ellipse cx="66" cy="54" rx="12" ry="7" fill="#fffaf0" stroke="#efe5d2"/>' + folha(58, 64, -10) + folha(66, 66, 20) + tomate(74, 64, 4.5) + '<ellipse cx="46" cy="44" rx="8" ry="5" fill="#6b3a22"/>');
    },
    'prato-dia': function () { return '<path d="M8 20v24M4 20v12a4 4 0 0 0 8 0V20M8 44v40" stroke="' + TRACO + '" stroke-width="3.5" stroke-linecap="round" fill="none"/><g transform="translate(8 0) scale(.92)">' + D['prato-proteina']() + '<circle cx="34" cy="48" r="6" fill="' + VE + '"/><circle cx="40" cy="44" r="5" fill="' + VE + '"/></g>'; },
    prancheta: function () {
      return sombra(50, 92, 30) + '<rect x="18" y="14" width="60" height="76" rx="10" fill="' + CR + '"/><rect x="34" y="8" width="28" height="14" rx="6" fill="' + VE + '"/>' +
        check('M28 36l4 4 7-8', 4.4) + check('M28 54l4 4 7-8', 4.4) + check('M28 72l4 4 7-8', 4.4) + '<path d="M46 38h22M46 56h22M46 74h16" stroke="#d6bc8e" stroke-width="4" stroke-linecap="round"/>';
    },
    'prancheta-prato': function () { return '<g transform="translate(-6 -2) scale(.9)">' + D.prancheta() + '</g><g transform="translate(36 44) scale(.6)">' + D['prato-almoco']() + '</g>'; },
    fogo: function () {
      return sombra(50, 92, 22) + '<path d="M50 6c4 14 20 22 20 44 0 18-10 34-20 34S28 70 30 52c1-10 6-14 8-20 4 6 6 10 10 12 4-12 2-26 2-38z" fill="url(#agi-laranja)"/>' +
        '<path d="M50 50c4 6 8 10 8 18a8 8 0 0 1-16 0c0-6 4-10 8-18z" fill="#ffe7a0"/>';
    },
    camera: function () {
      return sombra(50, 90, 36) + '<rect x="12" y="28" width="76" height="56" rx="16" fill="' + VE + '"/><rect x="34" y="18" width="32" height="16" rx="6" fill="' + VE + '"/><rect x="18" y="30" width="12" height="6" rx="3" fill="' + CR + '"/>' +
        '<circle cx="50" cy="56" r="20" fill="' + CR + '"/><circle cx="50" cy="56" r="12" fill="' + VE + '"/>' + brilho(44, 50, 4, 3) + brilho(26, 42, 8, 3);
    },
    'codigo-barras': function () {
      var b = '', x = 28, w = [3, 1.5, 4, 2, 1.5, 3, 1.5, 4, 2, 3, 1.5, 3];
      w.forEach(function (k) { b += '<rect x="' + x + '" y="34" width="' + k + '" height="32" fill="' + TRACO + '"/>'; x += k + 2.2; });
      return '<path d="M14 30v-8a8 8 0 0 1 8-8h8M70 14h8a8 8 0 0 1 8 8v8M86 70v8a8 8 0 0 1-8 8h-8M30 86h-8a8 8 0 0 1-8-8v-8" fill="none" stroke="' + DO + '" stroke-width="6" stroke-linecap="round"/>' + b;
    },
    lapis: function () {
      return sombra(40, 92, 22) + '<g transform="rotate(38 50 50)"><rect x="42" y="2" width="16" height="10" rx="5" fill="' + CR + '"/><rect x="42" y="10" width="16" height="6" fill="' + DO + '"/><rect x="42" y="16" width="16" height="58" fill="' + VE + '"/>' +
        '<path d="M42 74h16l-8 22z" fill="' + CR + '"/><path d="M47 89h6l-3 7z" fill="' + TRACO + '"/>' + brilho(46, 40, 1.6, 18) + '</g>';
    },
    // álcool e tabaco
    cerveja: function () {
      return sombra(50, 92, 36) + '<rect x="12" y="26" width="30" height="62" rx="7" fill="' + VE + '"/><rect x="14" y="20" width="26" height="8" rx="3" fill="#c7cfc1"/><path d="M17 34v46" stroke="#fff" stroke-width="2.4" opacity=".35" stroke-linecap="round"/>' +
        '<path d="M50 30h34l-3 54a5 5 0 0 1-5 4H58a5 5 0 0 1-5-4z" fill="url(#agi-amarelo)"/><path d="M48 24c0-6 6-8 10-6 2-4 10-4 12 0 4-2 12 0 12 6v8H48z" fill="#fffaf0"/><path d="M56 40l2 40" stroke="#fff" stroke-width="2.4" opacity=".5" stroke-linecap="round"/>';
    },
    vinho: function () {
      return sombra(50, 93, 22) + '<path d="M30 10h40c2 22-4 40-20 40S28 32 30 10z" fill="' + VI + '" stroke="#c6d8bc"/><path d="M31 26h38c-2 14-8 22-19 22S32 40 31 26z" fill="url(#agi-vermelho)"/>' +
        '<path d="M48 50h4v34h-4z" fill="#dfe8da"/><ellipse cx="50" cy="88" rx="16" ry="4" fill="#dfe8da" stroke="#c6d8bc"/>' + brilho(38, 26, 2.4, 10);
    },
    espumante: function () {
      return sombra(50, 93, 18) + '<path d="M38 6h24l-2 40c-1 6-5 8-10 8s-9-2-10-8z" fill="' + VI + '" stroke="#c6d8bc"/><path d="M39 16h22l-1.6 30c-1 5-4 6-9.4 6s-8.4-1-9.4-6z" fill="url(#agi-amarelo)" opacity=".85"/>' +
        '<circle cx="46" cy="32" r="1.3" fill="#fff"/><circle cx="53" cy="24" r="1.3" fill="#fff"/><circle cx="50" cy="40" r="1.1" fill="#fff"/><path d="M48 54h4v30h-4z" fill="#dfe8da"/><ellipse cx="50" cy="88" rx="14" ry="3.6" fill="#dfe8da" stroke="#c6d8bc"/>';
    },
    destilado: function () {
      return sombra(50, 90, 32) + '<path d="M20 30h60l-5 52a6 6 0 0 1-6 5H31a6 6 0 0 1-6-5z" fill="' + VI + '" stroke="#c6d8bc"/><path d="M22 52h56l-3 30a6 6 0 0 1-6 5H31a6 6 0 0 1-6-5z" fill="url(#agi-laranja)" opacity=".9"/>' +
        '<rect x="32" y="40" width="16" height="16" rx="3" fill="#ffffff" opacity=".7" transform="rotate(-12 40 48)"/><rect x="50" y="44" width="15" height="15" rx="3" fill="#ffffff" opacity=".65" transform="rotate(10 57 51)"/><path d="M28 36l2 44" stroke="#fff" stroke-width="2.6" opacity=".7" stroke-linecap="round"/>';
    },
    drink: function () {
      return sombra(50, 93, 24) + '<path d="M28 14h44l-4 72a5 5 0 0 1-5 4H37a5 5 0 0 1-5-4z" fill="' + VI + '" stroke="#c6d8bc"/><path d="M29.4 30h41.2l-3.4 56a5 5 0 0 1-5 4H37.8a5 5 0 0 1-5-4z" fill="url(#agi-amarelo)" opacity=".7"/>' +
        '<rect x="36" y="34" width="13" height="13" rx="3" fill="#fff" opacity=".75"/><rect x="51" y="44" width="12" height="12" rx="3" fill="#fff" opacity=".7"/><rect x="38" y="58" width="12" height="12" rx="3" fill="#fff" opacity=".6"/>' +
        '<path d="M56 4l-6 40" stroke="' + VE + '" stroke-width="3.4" stroke-linecap="round"/>';
    },
    garrafa: function () {
      return sombra(50, 93, 20) + '<path d="M44 6h12v20c0 4 12 10 12 22v38a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V48c0-12 12-18 12-22z" fill="' + VE + '"/><rect x="42" y="4" width="16" height="8" rx="2" fill="#1a3420"/>' +
        '<rect x="34" y="54" width="32" height="24" rx="3" fill="' + CR + '"/>' + brilho(38, 46, 2, 10);
    },
    'taca-branco': function () {
      return sombra(50, 93, 22) + '<path d="M30 10h40c2 22-4 40-20 40S28 32 30 10z" fill="' + VI + '" stroke="#c6d8bc"/><path d="M31 26h38c-2 14-8 22-19 22S32 40 31 26z" fill="url(#agi-amarelo)"/>' +
        '<path d="M48 50h4v34h-4z" fill="#dfe8da"/><ellipse cx="50" cy="88" rx="16" ry="4" fill="#dfe8da" stroke="#c6d8bc"/>' + brilho(38, 26, 2.4, 10);
    },
    cigarro: function () {
      return sombra(50, 82, 40) + '<g transform="rotate(-14 50 60)"><rect x="8" y="52" width="62" height="14" rx="5" fill="url(#agi-cinza)"/><rect x="66" y="52" width="24" height="14" rx="5" fill="url(#agi-laranja)"/>' +
        '<rect x="8" y="52" width="6" height="14" rx="3" fill="#8a8a8a"/><path d="M76 56v6M82 55v8" stroke="#a7652c" stroke-width="1.2" opacity=".6"/></g>';
    },
    vape: function () {
      return sombra(50, 93, 18) + '<rect x="36" y="20" width="28" height="70" rx="10" fill="' + VE + '"/><rect x="42" y="6" width="16" height="18" rx="4" fill="#1d2b20"/><rect x="40" y="40" width="20" height="4" rx="2" fill="' + CR + '" opacity=".7"/><circle cx="50" cy="76" r="3" fill="' + DO + '"/>' + brilho(42, 52, 2, 16);
    },
    tabaco: function () { return '<g transform="translate(-10 18) scale(.7)">' + D.cigarro() + '</g><g transform="translate(34 4) scale(.84)">' + D.vape() + '</g>'; },
    'prancheta-sub': function () { return D.prancheta(); },
    // evolução
    musculo: function () {
      return sombra(50, 92, 34) + '<rect x="18" y="58" width="66" height="24" rx="12" fill="' + VE + '"/><rect x="16" y="22" width="22" height="52" rx="11" fill="' + VE + '"/>' +
        '<circle cx="27" cy="20" r="13" fill="' + VE + '"/><ellipse cx="54" cy="58" rx="20" ry="16" fill="' + VE + '"/>' + brilho(50, 50, 9, 5, -15) + brilho(22, 40, 2.5, 10) + seta(82, 26, true);
    },
    gordura: function () {
      var g = '', b = [[30, 50, 14], [50, 40, 15], [66, 54, 14], [44, 60, 14], [26, 68, 11], [58, 70, 12], [40, 28, 11]];
      b.forEach(function (c) { g += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + CR + '" stroke="#e1c99c" stroke-width=".8"/>' + brilho(c[0] - c[2] * .3, c[1] - c[2] * .35, c[2] * .35, c[2] * .2); });
      return sombra(46, 90, 34) + g + '<g transform="translate(6 30)">' + seta(76, 40, false, VE) + '</g>';
    },
    corpo: function () {
      return sombra(50, 94, 30) + '<path d="M18 12c12 5 52 5 64 0-1 16-9 24-9 36 0 10 6 18 6 30 0 9-10 15-29 15s-29-6-29-15c0-12 6-20 6-30 0-12-8-20-9-36z" fill="url(#agi-pele)"/>' +
        '<path d="M50 30v8" stroke="#d9b183" stroke-width="2" stroke-linecap="round"/><ellipse cx="50" cy="64" rx="17" ry="14" fill="url(#agi-laranja)" opacity=".85"/><circle cx="44" cy="60" r="4" fill="#ffe7a0" opacity=".7"/><circle cx="55" cy="68" r="4" fill="#ffe7a0" opacity=".6"/><circle cx="57" cy="58" r="3" fill="#ffe7a0" opacity=".6"/>' + brilho(32, 30, 5, 10);
    },
    // equipe e contatos
    whatsapp: function () {
      return sombra(50, 94, 40) + '<rect x="6" y="8" width="88" height="80" rx="24" fill="' + VE + '"/>' + brilho(28, 22, 16, 6) +
        '<path d="M50 22a26 26 0 0 0-22 40l-4 14 14-4a26 26 0 1 0 12-50z" fill="none" stroke="#f6ebd4" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M42 38c-2 0-4 2-3 6 2 7 8 13 15 15 4 1 6-1 6-3l-1-3-5-2-2 3c-4-2-6-4-8-8l3-2-2-5z" fill="#f6ebd4"/>';
    },
    instagram: function () {
      return '<rect x="8" y="8" width="84" height="84" rx="24" fill="' + VE + '"/>' + brilho(28, 22, 14, 5) + '<rect x="26" y="26" width="48" height="48" rx="14" fill="none" stroke="#f6ebd4" stroke-width="6"/><circle cx="50" cy="50" r="11" fill="none" stroke="#f6ebd4" stroke-width="6"/><circle cx="64" cy="36" r="3.6" fill="#f6ebd4"/>';
    },
    facebook: function () {
      return '<rect x="8" y="8" width="84" height="84" rx="24" fill="' + VE + '"/>' + brilho(28, 22, 14, 5) + '<path d="M56 84V56h9l2-11H56v-7c0-3 1-5 5-5h6V23c-2 0-6-1-10-1-9 0-14 5-14 14v9h-9v11h9v28z" fill="#f6ebd4"/>';
    },
    avatar: function () {
      return '<circle cx="50" cy="50" r="46" fill="url(#agi-creme)" stroke="#ecdcbb" stroke-width="2"/><circle cx="50" cy="40" r="15" fill="#d5b78c"/><path d="M22 80c4-16 14-22 28-22s24 6 28 22a40 40 0 0 1-56 0z" fill="#d5b78c"/>' + brilho(36, 22, 14, 6, -20);
    },
    cerebro: function () { return D['revista-psico'](); },
    estrela: function () { return estrela(50, 50, 40); },
    // escala de formatos das fezes (desenho próprio, sem rótulo de escala clínica)
    'fezes-1': function () { return sombra(50, 76, 40) + [[24, 58, 9], [44, 52, 10], [64, 58, 9], [34, 70, 8], [56, 70, 8], [76, 66, 7]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + MAR + '"/>'; }).join(''); },
    'fezes-2': function () { var g = ''; for (var i = 0; i < 7; i++) g += '<circle cx="' + (18 + i * 10.5) + '" cy="' + (60 - Math.sin(i / 6 * Math.PI) * 6 + (i % 2 ? 3 : -2)) + '" r="' + (9 + (i % 3)) + '" fill="' + MAR + '"/>'; return sombra(50, 76, 40) + g; },
    'fezes-3': function () { return sombra(50, 74, 42) + '<path d="M10 62c0-10 10-16 40-16s40 6 40 16-10 12-40 12S10 72 10 62z" fill="' + MAR + '"/><path d="M26 50l4 10M44 48l-2 9M60 49l4 9M76 52l-3 8M36 66l3 5M66 66l-2 5" stroke="#6a3a1c" stroke-width="2.4" stroke-linecap="round"/>' + brilho(40, 54, 14, 3); },
    'fezes-4': function () { return sombra(50, 74, 42) + '<path d="M8 66c0-12 14-22 42-22 22 0 42 4 42 14 0 8-8 12-20 10-12-2-14-4-24 0-12 4-22 8-30 6-6-2-10-4-10-8z" fill="' + MAR + '"/>' + brilho(44, 52, 18, 4, -4); },
    'fezes-5': function () { return sombra(50, 76, 40) + [[24, 62, 12, 8], [48, 56, 11, 7], [70, 62, 12, 8], [38, 72, 9, 6], [60, 74, 8, 5]].map(function (c) { return '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="' + c[3] + '" fill="' + MAR + '"/>'; }).join(''); },
    'fezes-6': function () {
      var g = '', p = [[24, 66], [32, 58], [42, 64], [50, 54], [58, 62], [66, 56], [74, 66], [36, 70], [52, 70], [64, 70], [46, 60], [60, 48], [40, 50]];
      p.forEach(function (c, i) { g += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + (6 + i % 3) + '" ry="' + (4 + i % 2) + '" fill="' + MAR + '"/>'; });
      return sombra(50, 76, 40) + g;
    },
    'fezes-7': function () { return '<path d="M8 66c4-10 18-8 26-12 10-4 18-2 26 2 10 4 18 0 26 4 8 6 2 16-10 16-10 0-16 4-30 2-14-2-24 2-32-2-6-2-8-6-6-10z" fill="url(#agi-amarelo)" opacity=".75"/><ellipse cx="80" cy="58" rx="5" ry="3" fill="url(#agi-amarelo)" opacity=".7"/>' + brilho(40, 62, 14, 3); }
  };

  // AG.ilu(nome, tamanho, classe) → <svg>. Nome desconhecido: um círculo creme (nunca quebra a tela).
  function ilu(nome, tamanho, classe) {
    var t = tamanho || 64, f = D[nome];
    return '<svg class="ilu ' + (classe || '') + '" width="' + t + '" height="' + t + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      (f ? f() : '<circle cx="50" cy="50" r="40" fill="' + CR + '"/>') + '</svg>';
  }
  A.ilu = ilu;
  A.iluNomes = Object.keys(D);
})();
