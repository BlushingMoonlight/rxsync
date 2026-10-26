# RXSync — site

O site público da RXSync (rxsync.com.br), publicado pelo GitHub Pages a partir da `main`.
Os workflows do n8n e o banco ficam no repositório privado `rxsync-sistema`.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | página inicial, com o mini teste da assistente |
| `contratar.html` | contratação e teste grátis |
| `onboarding.html` | formulário de implantação do cliente |
| `conectar.html` | conexão do WhatsApp da clínica |
| `painel/` | painel da clínica (montado de `painel/fonte/`) |
| `autoedicao.html` | endereço antigo do painel: leva para `painel/` |
| `conta-excluir.html` | confirmação do pedido de exclusão da conta |
| `teste.html` | conversa de teste com a assistente |
| `central/` | área administrativa da RXSync (com login; montada de `central/fonte/`) |
| `demo/` | demonstrações do produto |
| `404.html` | página "não encontrada" |
| `privacidade.html`, `termos/` | documentos legais |
| `assets/` | o visual (`ancora/`: cores e tamanhos), ícones (`icones/`), logo dos e-mails (`email/`), imagens, fontes e a lista de municípios (feriados) |
| `scripts/` | conferências e testes que o GitHub roda em cada pull request |

## No dia a dia

1. O Claude abre um **pull request** com as mudanças e a explicação.
2. O GitHub confere links, imagens, endereços, a regra de segurança, os ícones e o visual de cada página e roda os testes
   de tela, no Chrome e no Safari (✓ verde no pull request).
3. Você revisa e clica em **Merge**.
4. Em 1 ou 2 minutos o site está atualizado.

Para desfazer: no pull request, botão **Revert**, e depois Merge do pull request de reversão.

## Regra de segurança das páginas

Cada página tem a regra de segurança do navegador (CSP) no começo do arquivo: ela diz de onde a página pode carregar
scripts, estilos, imagens e conexões. A lista fica em `scripts/csp.mjs` (a Central tem a dela, em `scripts/central_csp.mjs`).
Depois de mudar o script ou o estilo de uma página, rode `node scripts/csp.mjs`. O GitHub recusa a página sem a regra
ou com a regra desatualizada, e os testes de tela abrem cada página com a regra ligada.

## Pendências, decisões e mapa

Tudo neste repositório é público, inclusive Issues, PRs, `README.md` e `CLAUDE.md` (o GitHub Pages publica o repositório
inteiro). Por isso:

- **Issues ficam no repositório privado `rxsync-sistema`**, mesmo as corrigidas aqui. As Issues deste repositório estão
  desligadas.
- **Decisões** ficam no registro do `rxsync-sistema` (`docs/decisoes.md`).
- **Mapa** do site e do painel fica no `rxsync-sistema` (`docs/mapa/site.md` e `docs/mapa/painel.md`). PR que muda uma
  página atualiza o mapa num PR de lá, com a ordem do Merge.
- **Falha de segurança:** ver [SECURITY.md](SECURITY.md).
