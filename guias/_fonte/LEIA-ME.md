# Fontes dos guias

Esta pasta começa com "_", e o GitHub Pages não publica pasta assim: nada daqui vira página (nem este arquivo).
As páginas são montadas por `node scripts/guias_montar.mjs` e conferidas pelo `node scripts/verificar_site.mjs`.

## Um guia = um arquivo

`<endereço>.md`, com o cabeçalho entre as linhas `---` e depois o texto.

```
---
titulo: Título, com a pergunta que a pessoa digita no Google
descricao: Uma frase para o Google e para a prévia do link
endereco: o-endereco-do-guia        (vira /guias/o-endereco-do-guia/; depois de publicado, nunca muda)
tema: atendimento | agenda | regras
pesquisa-alvo: o que a pessoa digita no Google
publicado-em: AAAA-MM-DD
revisado-em: AAAA-MM-DD             (troque a cada revisão; com mais de 6 meses, o verificar avisa)
rascunho: sim | não                 (sim: página com noindex, fora do sitemap, da página Guias e dos relacionados)
relacionados: outro-guia, mais-um   (viram os cartões de "Leia também")
perguntas:
  - pergunta: Pergunta frequente?
    resposta: Resposta curta (a mesma aparece na página e nos dados estruturados)
chamada-titulo: (opcional) o título da chamada
chamada-texto: (opcional) o texto da chamada
---
```

## O texto

- `## Título de seção` (entra no índice) e `### Subtítulo`; parágrafos separados por uma linha em branco; listas com `- `.
- `**negrito**` e `[texto](/endereço-do-site)` ou `[texto](https://…)`.
- Todo número precisa da fonte no mesmo trecho: `(fonte: Nome, ano)` ou `[fonte: Nome, ano](https://…)`.
- Nada de "melhor", "garante" ou "100%". Nada de assunto clínico.

## As 10 peças

Cada peça abre com `:::nome` e fecha com `:::`, sozinhos na linha.

| Peça | Como usar |
|---|---|
| `:::resposta-curta` | a resposta em 2 ou 3 frases, logo no começo |
| `:::na-rxsync` | como a RXSync faz isso |
| `:::passos` | uma linha `- ` por passo |
| `:::tabela Legenda` | tabela com `\|`; a fonte dos números pode ir na legenda |
| `:::aviso` | o cuidado que a clínica precisa ter |
| `:::modelo-de-mensagem Legenda` | o texto da mensagem para copiar |
| `:::imagem` | linhas `src:` (arquivo do site), `alt:`, `legenda:`, `largura:` e `altura:` |
| `:::perguntas` | vazia: usa as perguntas do cabeçalho |
| `:::chamada` | vazia: o botão "Testar 7 dias grátis", com a origem do clique `guia-<endereço>` |
| `:::cartao-de-guia endereço` | o cartão de outro guia publicado |

O `exemplo.md` (rascunho) usa as 10 peças e sai quando o primeiro guia de verdade for publicado.
O topo, o rodapé e o HTML de cada peça ficam no `molde.html`; o estilo, no `assets/ancora/guias.css`.
