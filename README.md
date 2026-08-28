# DomineAqui — Gerador de PDF Acadêmico de APGs

Aplicação web (React + Vite) para montar e exportar PDFs acadêmicos premium das
APGs de Medicina, com capas em verde-escuro, sumários clicáveis, tipografia ABNT
e identidade da marca **DomineAqui**.

## Como rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
```

Para gerar a versão de produção: `npm run build` e `npm run preview`.

## Como as APGs são guardadas

O acervo é **compartilhado**: fica no MongoDB Atlas, atrás das funções em `/api`
(senha única em `APP_PASSWORD`). Três garantias que valem conhecer:

- **Imagens ficam em documentos próprios** (coleção `blobs`), fora da APG. Um
  documento de APG com várias fotos embutidas estourava o limite de 4,5 MB por
  requisição da Vercel e o de 16 MB por documento do MongoDB — a gravação era
  recusada e as imagens sumiam. Agora cada figura sobe sozinha, em uma
  requisição pequena, e é baixada só quando é necessária.
- **Cópia local em IndexedDB.** Tudo o que você escreve é gravado primeiro no
  navegador, e as imagens ficam em cache por conteúdo. Se a internet cair, o
  servidor der erro ou a aba fechar, o trabalho reaparece ao abrir o app e sobe
  sozinho quando dá.
- **Nada de edição que "volta".** Cada APG é salva sozinha, com repetição
  automática enquanto não chega ao servidor; e a leitura periódica que traz as
  mudanças da outra pessoa nunca sobrescreve uma APG com edição pendente, salvamento
  em andamento, ou salvamento concluído depois que aquela leitura começou.

Documentos antigos (com as imagens embutidas) são convertidos sozinhos, aos
poucos, na primeira vez que o acervo é carregado — não é preciso fazer nada.

> As fontes embutidas no PDF já estão geradas em `src/pdf/fonts/vfs.ts`. Só é
> preciso rodar `npm run build:fonts` se quiser regenerá-las.

## Estrutura do código

| Módulo | Responsabilidade |
| --- | --- |
| `src/parser/objectivesParser.ts` | Faz o parsing do bloco de **Objetivos** colado |
| `src/parser/contentParser.ts` | Faz o parsing do **Conteúdo** (tópicos, imagens, tabelas) |
| `src/pdf/generatePdf.ts` | Monta o documento (capas, sumários, conteúdo) com pdfmake |
| `src/pdf/richText.ts` | Formatação inline + fallback de símbolos (→, μ, ≈, Greek…) |
| `src/components/*` | Editor, barra de ferramentas, gerenciador de imagens, preview |
| `src/state/store.tsx` | Estado + sincronização (fila de gravação, mirror local, merge) |
| `src/state/blobs.ts` | Imagens fora do documento da APG (cache por revisão) |
| `api/*` | Funções serverless: `/api/state`, `/api/apgs`, `/api/blobs`, `/api/theme` |

## Como escrever o conteúdo

**Objetivos** — cole o bloco como está:

```
Objetivo Geral 1
Integrar a célula humana aos níveis de organização biológica do organismo
Objetivos Específicos
1. Compreender a hierarquia estrutural
Definir os níveis de organização biológica...
2. Relacionar a célula aos tecidos
...
```

**Conteúdo / sumário** — hierarquia:

```
PARTE 1 Anatomia do tórax     ← nível 1
1.1 Parede torácica           ← nível 2
1.1.2 Músculos intercostais   ← nível 3
Texto comum vira parágrafo.
```

**Imagens** — envie no gerenciador e insira o token numa linha:

```
[[img:img1]]
[[img:img1|Legenda opcional da figura]]
```

**Tabelas** — use o bloco `[tabela]` (células separadas por `|`):

```
[tabela] Eucariótica vs. Procariótica
Característica | Procariótica | Eucariótica
Núcleo | Ausente | Presente
[/tabela]
```

> Também funciona colar tabelas separadas por TAB (como ao copiar do Word/web):
> duas ou mais linhas seguidas com células separadas por TAB viram uma tabela
> automaticamente, com a primeira linha como cabeçalho.

### Tabela "achatada" (colada do chat, sem separadores)

Quando você cola uma tabela direto de um chat, os separadores se perdem e tudo
vira um texto corrido. Para esse caso, use `[tabela:N]`, onde **N = número de
colunas**, e cole o texto corrido na linha de dentro:

```
[tabela:2] Tabela-síntese de altíssimo rendimento
Arco aórticoDerivado definitivo principal1ºRegride (...)2ºRegride (...)...
[/tabela]
```

O parser reconstrói as células nas transições típicas de uma nova célula
(minúscula/pontuação → Maiúscula, letra → número, sigla → Palavra, etc.) e
agrupa em linhas de N colunas (a 1ª linha vira o cabeçalho). É uma recuperação
heurística: se alguma célula sair errada, basta separar manualmente com `|`.

**Formatação (modo "Word")** — selecione o texto e use a barra de ferramentas, ou
escreva as marcações direto:

```
[b]negrito[/b]   [i]itálico[/i]   [u]sublinhado[/u]
[c=#b00020]texto colorido[/c]     [h=#FFF3A0]marca-texto[/h]
```

**Símbolos** (→, μ, ≈, ≤, °, α…) podem ser digitados ou inseridos pelo menu
"Símbolo" — são renderizados com fonte de fallback de cobertura ampla.

## Exportação

- **PDF consolidado** com todas as APGs (ordenadas por período e número).
- **PDF por período** (botões "Período N").
- Numeração de páginas e aviso de direitos autorais em todas as páginas.
