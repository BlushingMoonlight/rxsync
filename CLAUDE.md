# Instruções para o Claude neste repositório

- Site público da RXSync (GitHub Pages, domínio em `CNAME`). Tudo aqui é público: nunca coloque token, senha ou dado de cliente.
- O dono (Jean) trabalha só pelo iPad. Toda entrega é um **pull request** em português, com resumo do que muda e o que conferir. Nunca faça merge nem push direto na `main`.
- Webhooks do n8n: `https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/...` (cabeçalho `x-rxsync-origem: rxsync-site-2026`). Os workflows ficam em `BlushingMoonlight/rxsync-sistema`; mudança que envolve site e n8n vira um pull request em cada repositório, avisando a ordem do Merge.
- O favicon é `assets/favicon-rxsync.png.PNG` (o nome tem a extensão dupla mesmo).
- Ao mudar `privacidade.html` ou `termos/`, atualize a versão e a data no próprio documento.
- Issues e decisões: nunca abra Issue aqui (tudo é público). Pendências ficam nas Issues do `rxsync-sistema`, e decisões no `docs/decisoes.md` de lá. No PR, cite a Issue como `BlushingMoonlight/rxsync-sistema#NN`.
- Mapa: todo PR que mudar uma página do site ou do painel atualiza o mapa num PR no `rxsync-sistema` (`docs/mapa/`), com a ordem do Merge.
- O GitHub Pages publica o repositório inteiro, inclusive este arquivo e o `README.md`: não escreva neles nada interno (arquitetura, falhas abertas, clientes).
- PR: use o modelo `.github/pull_request_template.md`.
- Antes de abrir o PR: `node scripts/verificar_site.mjs`.
