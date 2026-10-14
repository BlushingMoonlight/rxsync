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
| `autoedicao.html` | painel do cliente |
| `teste.html` | conversa de teste com a assistente |
| `privacidade.html`, `termos/` | documentos legais |
| `assets/` | imagens e a lista de municípios (feriados) |

## No dia a dia

1. O Claude abre um **pull request** com as mudanças e a explicação.
2. O GitHub confere links, imagens e endereços (✓ verde no pull request).
3. Você revisa e clica em **Merge**.
4. Em 1 ou 2 minutos o site está atualizado.

Para desfazer: no pull request, botão **Revert**, e depois Merge do pull request de reversão.

## Pendências, decisões e mapa

Tudo neste repositório é público, inclusive Issues, PRs, `README.md` e `CLAUDE.md` (o GitHub Pages publica o repositório
inteiro). Por isso:

- **Issues ficam no repositório privado `rxsync-sistema`**, mesmo as corrigidas aqui. As Issues deste repositório estão
  desligadas.
- **Decisões** ficam no registro do `rxsync-sistema` (`docs/decisoes.md`).
- **Mapa** do site e do painel fica no `rxsync-sistema` (`docs/mapa/site.md` e `docs/mapa/painel.md`). PR que muda uma
  página atualiza o mapa num PR de lá, com a ordem do Merge.
- **Falha de segurança:** ver [SECURITY.md](SECURITY.md).
