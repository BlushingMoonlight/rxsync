# Instruções para o Claude neste repositório

## Método de produto (obrigatório)

Antes de qualquer mudança de tela, botão, texto ou função nova, leia o método completo no `docs/front/metodo.md` do
`rxsync-sistema` e siga os 3 passos, nesta ordem: o fluxo das informações (o que a pessoa precisa, em que ordem, onde é
o lugar natural, quantos toques), o encaixe (árvore, molde, nomes do dicionário) e só então o visual Âncora.
**Primeiro o fluxo, depois o design; o PR mostra a árvore e os toques** (seção "Fluxo e design" do modelo de PR).

- Fluxo: uma ação principal por tela; o que precisa de ação antes da informação; um aviso por vez; o raro longe do uso
  diário (no ⋯ ou nos ajustes) e o perigoso no fim; até 3 ações rápidas no item; no máximo 2 níveis abaixo da seção;
  nada usado toda semana escondido em "Mais"; níveis de confirmação de 0 a 3, nunca o `confirm()` do navegador.
- Disposição: abas só para visões do mesmo conteúdo, nunca para assuntos diferentes; sempre um "‹ Voltar" visível fora
  do primeiro nível; página de ajuste com um assunto só e até cerca de 2 telas de rolagem no celular; agrupar por espaço,
  cartão só quando o espaço não basta e nunca cartão dentro de cartão; formulário em uma coluna; um jeito de salvar por
  seção; densidade igual dentro da mesma tela.
- Site: não usa os moldes do painel; segue a ordem de página de venda (promessa, prova, como funciona, preço, perguntas,
  chamada final), com uma chamada só por página.
- Linguagem do CFM em todo texto do site, do painel e dos e-mails: nada de "melhor", "garante", "100%",
  "nunca erra", "substitui a secretária", "sem risco de bloqueio", "aprovado pelo CFM" nem promessa de resultado
  ("reduz X% das faltas"); diga o que a clínica pode fazer. Os Termos e a Política, que são texto jurídico, ficam de fora.
- Texto: o mesmo nome do botão e do dicionário, sem jargão; caminho escrito existe como toque (veja "Caminhos"); versão
  escrita igual à do link.
- Design: cores e tamanhos só do `assets/ancora/tokens.css`; pesos até 600; sem sombra de cartão nem degradê; branco
  predominante; celular 390, iPad 820 e 1024 px sem rolar para o lado; contraste de 4,5:1, nada abaixo de 12 px e alvos
  de 44 px; números tabulares e alinhados; gráficos de barra ou linha, nunca pizza; estado sempre com cor, ícone e
  palavra; animação curta (até 300 ms; 150 a 250 ms no painel), desligada com "Reduzir movimento".
- O `verificar_site.mjs` bloqueia cor nova e tamanho novo fora dos tokens, caminho que não existe, as palavras proibidas
  do CFM no site e no painel e gráfico de pizza, e avisa quando o PR
  muda tela sem "Fluxo e design"; o `painel_alcance.mjs` avisa quando uma tela tem mais de uma ação principal ou um item
  tem mais de 3 ações rápidas.

## O resto

- Site público da RXSync (GitHub Pages, domínio em `CNAME`). Tudo aqui é público: nunca coloque token, senha ou dado de cliente.
- O dono (Jean) trabalha só pelo iPad. Toda entrega é um **pull request** em português, com resumo do que muda e o que conferir. Nunca faça merge nem push direto na `main`.
- Webhooks do n8n: `https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/...` (cabeçalho `x-rxsync-origem: rxsync-site-2026`). Os workflows ficam em `BlushingMoonlight/rxsync-sistema`; mudança que envolve site e n8n vira um pull request em cada repositório, avisando a ordem do Merge.
- Os ícones ficam em `assets/icones/` (`rxsync-32.png`, `rxsync-180.png` para a Tela de Início, `rxsync-192.png` e `rxsync-512.png`), gerados do logo `assets/logo-rxsync.png`. O logo dos e-mails é `assets/email/rxsync-email.png`. Toda página precisa de favicon, ícone da Tela de Início e `theme-color` branco; as públicas, também da prévia de compartilhamento (o `verificar_site.mjs` confere).
- Visual: o Âncora. As cores e os tamanhos de todas as telas ficam só em `assets/ancora/tokens.css`; as páginas do site usam também `assets/ancora/site.css` (depois do estilo de cada página). Branco predominante, Inter (Figtree só nos títulos do site), pesos até 600, sem sombra de cartão nem degradê, escuro só pela escolha da pessoa.
- O painel da clínica é o `painel/` (fontes em `painel/fonte/`, montado por `node scripts/painel_montar.mjs`). A Central é a `central/` (fontes em `central/fonte/`, `node scripts/central_montar.mjs`). Nunca edite `painel/index.html` nem `central/index.html` à mão.
- Guias (`guias/`): a fonte de cada guia é um Markdown em `guias/_fonte/` (pasta que o GitHub Pages não publica; como escrever no `guias/_fonte/LEIA-ME.md`), montado por `node scripts/guias_montar.mjs` com o `guias/_fonte/molde.html` e o `assets/ancora/guias.css`. Nunca edite `guias/*/index.html` à mão. Um PR por guia; endereço publicado nunca muda; rascunho fica com noindex e fora do sitemap; nenhum JavaScript nos guias. O `verificar_site.mjs` confere e o `guias_telas.mjs` testa.
- Testes: `node scripts/testes_tela.mjs` (todos, no Chrome; `NAVEGADOR=webkit` roda no motor do Safari, e o GitHub roda os `painel_` também nele). O `verificar_site.mjs` também confere a CSP de cada página (`scripts/csp.mjs`), a identidade, o limite de 400 KB do painel, as regras da P12 no estilo do painel e da Central e o singular e plural dos textos da Central.
- Ao mudar `privacidade.html` ou `termos/`, atualize a versão e a data no próprio documento.
- Issues e decisões: nunca abra Issue aqui (tudo é público). Pendências ficam nas Issues do `rxsync-sistema`, e decisões no `docs/decisoes.md` de lá. No PR, cite a Issue como `BlushingMoonlight/rxsync-sistema#NN`.
- Mapa: todo PR que mudar uma página do site ou do painel atualiza o mapa num PR no `rxsync-sistema` (`docs/mapa/`), com a ordem do Merge.
- O GitHub Pages publica o repositório inteiro, inclusive este arquivo e o `README.md`: não escreva neles nada interno (arquitetura, falhas abertas, clientes).
- PR: use o modelo `.github/pull_request_template.md`.
- Caminhos: antes de passar um caminho ao Jean ou a uma clínica ("Agenda › Ajustes da agenda › Feriados"), confira que ele existe como toque. A lista é a `scripts/caminhos_validos.json`, gravada pelo `node scripts/painel_alcance.mjs --gravar` (o teste que chega a cada tela só tocando, em 360, 820 e 1280 px); o `verificar_site.mjs` acusa caminho escrito que não existe, também na descrição do PR. Nome de botão vai entre aspas no fim e é conferido: a lista guarda os botões de cada tela (e o catálogo dos campos do painel, com o lugar de cada um). Mudou uma tela, um botão, um campo ou um nome do painel ou da Central: grave a lista de novo e copie para o `scripts/` do `rxsync-sistema` no PR de lá.
- Antes de abrir o PR: `node scripts/verificar_site.mjs`.
