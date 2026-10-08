# Instruções para o Claude neste repositório

- Site público da RXSync (GitHub Pages, domínio em `CNAME`). Tudo aqui é público: nunca coloque token, senha ou dado de cliente.
- O dono (Luan) trabalha só pelo iPad. Toda entrega é um **pull request** em português, com resumo do que muda e o que conferir. Nunca faça merge nem push direto na `main`.
- Webhooks do n8n: `https://rxsync-n8n-e38038-187-127-49-110.sslip.io/webhook/...` (cabeçalho `x-rxsync-origem: rxsync-site-2026`). Os workflows ficam em `BlushingMoonlight/rxsync-sistema`; mudança que envolve site e n8n vira um pull request em cada repositório, avisando a ordem do Merge.
- O favicon é `assets/favicon-rxsync.png.PNG` (o nome tem a extensão dupla mesmo).
- Ao mudar `privacidade.html` ou `termos/`, atualize a versão e a data no próprio documento.
- Antes de abrir o PR: `node scripts/verificar_site.mjs`.
