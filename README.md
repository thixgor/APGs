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
| `src/state/*` | Estado das APGs + tema (acervo compartilhado no MongoDB Atlas) |
| `api/*` | Funções serverless da Vercel que servem o acervo |

## Como o acervo é sincronizado

O acervo é **compartilhado**: fica no MongoDB Atlas e é servido pelas funções em
`api/`. Quem entra com a senha compartilhada vê e edita os mesmos dados.

Uma função da Vercel não pode receber nem devolver mais que ~4,5 MB. Como cada
APG carrega suas imagens em base64, mandar o acervo inteiro numa resposta só
passou a estourar esse limite (todo request virava erro 500). Por isso a
transferência é dividida em três tamanhos:

| Endpoint | O que trafega | Tamanho |
| --- | --- | --- |
| `GET /api/state?manifest=1` | índice: `id` + `updatedAt` de cada APG, e o tema | centenas de bytes |
| `GET /api/apgs?ids=…` | o texto das APGs, em lotes | dezenas de KB |
| `GET /api/assets?keys=…` | as imagens, uma a uma | algumas centenas de KB cada |

Cada imagem vira um documento próprio na coleção `assets`, e a APG guarda só uma
assinatura (`sig`) do conteúdo. Com isso:

- a verificação a cada 7 s baixa só o índice, e só rebaixa as APGs cujo
  `updatedAt` mudou — antes ela rebaixava o acervo inteiro, imagens e tudo;
- uma imagem que não mudou é baixada uma vez por sessão (cache por `sig`);
- salvar uma APG envia só as imagens que você trocou;
- nenhuma APG esbarra no limite de 16 MB por documento do Mongo.

APGs salvas antes dessa divisão continuam com as imagens embutidas e são lidas
normalmente — elas migram para a coleção `assets` no próximo salvamento.

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
