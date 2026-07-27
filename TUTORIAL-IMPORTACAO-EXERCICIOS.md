# Tutorial de Importação de Exercícios — Guia para LLM

Este documento ensina uma **LLM** (ChatGPT, Claude, Gemini, etc.) a gerar uma
**lista de exercícios** no formato de texto que o **DomineAqui – Gerador de PDF de APGs**
importa. Cole este guia inteiro como instrução para a LLM e peça as questões.

---

## 1. Objetivo

Produzir um **texto puro** (não JSON, não tabela) que descreve uma lista de questões
— objetivas e/ou discursivas — com gabarito e comentário, pronto para colar no campo
**"Lista de Exercícios → ⇪ Importar / Exportar"** do aplicativo.

A LLM deve devolver **apenas o texto no formato abaixo**, sem explicações extras,
sem ```cercas de código```, sem comentários fora do padrão.

---

## 2. Formato (regras exatas)

Cada questão é um bloco. Os blocos são separados por **uma linha em branco**.

```
N. <enunciado da questão>
img: <URL da imagem> | <legenda opcional>
A) <alternativa A>
B) <alternativa B>
C) <alternativa C>
D) <alternativa D>
Gabarito: <LETRA>
Comentário: <explicação da resposta>
```

### Regras linha a linha

| Elemento      | Como escrever                                   | Obrigatório? |
|---------------|-------------------------------------------------|--------------|
| Início da questão | `N.` ou `N)` seguido do enunciado (ex.: `1. Texto…`) | **Sim** |
| Imagem        | `img: URL` ou `img: URL | legenda`              | Não |
| Alternativas  | `A)` `B)` `C)` `D)`… (letras A a H)             | Só em objetivas |
| Gabarito      | `Gabarito: B` (a LETRA correta)                 | Recomendado |
| Comentário    | `Comentário: <texto>`                           | Recomendado |

### Como o tipo da questão é decidido

- **Tem alternativas (`A)`, `B)`…)** → questão **objetiva**. O `Gabarito:` deve ser a **letra** correta.
- **Não tem alternativas** → questão **discursiva**. O `Gabarito:` é a **resposta-modelo esperada** (texto livre).

---

## 3. Detalhes importantes

1. **Numeração:** comece em `1.` e siga em ordem. (Se a numeração ficar fora de ordem,
   o app renumera automaticamente — mas mantenha em ordem por clareza.)
2. **Enunciado em várias linhas:** pode quebrar o enunciado em linhas seguidas; elas
   continuam fazendo parte do enunciado até aparecer uma alternativa, `img:`,
   `Gabarito:` ou `Comentário:`.
3. **Alternativas:** mínimo 2, máximo 8 (A–H). Use sempre `A)`, `B)`… nessa ordem.
4. **Gabarito objetivo:** use **apenas a letra** (`Gabarito: C`). Não escreva o texto da alternativa.
5. **Comentário:** uma linha só (sem quebras). Explique por que a resposta está correta.
6. **Imagem por URL:** use uma URL pública e direta para um arquivo de imagem
   (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`). A legenda após `|` é opcional.
   - Alternativa aceita: markdown de imagem `![legenda](URL)`.
   - Imagens enviadas por upload **não** são representadas neste texto (só URLs).
7. **Formatação de texto (opcional):** o app aceita marcações inline no enunciado,
   alternativas, gabarito e comentário:
   - `[b]negrito[/b]`, `[i]itálico[/i]`, `[u]sublinhado[/u]`, `[s]tachado[/s]`
   - `[c=#1B4332]cor do texto[/c]`, `[h=#FFF3A0]marca-texto[/h]`
   Use com moderação; texto comum funciona perfeitamente.
8. **Nada de JSON / tabelas / cabeçalhos extras.** O título `# Lista de Exercícios`
   no topo é opcional e ignorado na importação.

---

## 4. Exemplos

### 4.1 Questão objetiva simples

```
1. Qual é a principal função das hemácias no organismo humano?
A) Coagulação sanguínea
B) Transporte de oxigênio
C) Defesa contra patógenos
D) Produção de anticorpos
Gabarito: B
Comentário: As hemácias contêm hemoglobina, proteína responsável por ligar e transportar o O₂ dos pulmões aos tecidos.
```

### 4.2 Questão objetiva com imagem

```
2. A figura mostra um corte histológico. Qual tecido está em destaque?
img: https://exemplo.com/histologia.png | Corte histológico corado em HE
A) Tecido epitelial simples
B) Tecido conjuntivo denso
C) Tecido muscular liso
D) Tecido nervoso
Gabarito: C
Comentário: As fibras alongadas com núcleo central único são características do músculo liso.
```

### 4.3 Questão discursiva

```
3. Explique o mecanismo da ventilação pulmonar durante a inspiração.
Gabarito: Espera-se que o aluno descreva a contração do diafragma e dos intercostais externos, o aumento do volume da caixa torácica e a queda da pressão intrapulmonar (Lei de Boyle), levando à entrada de ar.
Comentário: Avaliar se o aluno relaciona variação de volume com variação de pressão.
```

### 4.4 Lista completa (pronta para colar)

```
# Lista de Exercícios

1. Qual é a principal função das hemácias no organismo humano?
A) Coagulação sanguínea
B) Transporte de oxigênio
C) Defesa contra patógenos
D) Produção de anticorpos
Gabarito: B
Comentário: As hemácias contêm hemoglobina, que transporta O₂ aos tecidos.

2. Sobre o ciclo cardíaco, assinale a alternativa correta.
A) A sístole corresponde ao relaxamento ventricular
B) A diástole corresponde à contração ventricular
C) Na sístole ocorre a ejeção do sangue dos ventrículos
D) A diástole esvazia completamente os átrios
Gabarito: C
Comentário: Sístole = contração e ejeção; diástole = relaxamento e enchimento.

3. Explique a Lei de Frank-Starling do coração.
Gabarito: Quanto maior o retorno venoso (pré-carga), maior o estiramento das fibras e maior a força de contração, aumentando o débito sistólico.
Comentário: Relaciona pré-carga, estiramento das fibras e débito cardíaco.
```

---

## 5. Prompt sugerido para a LLM

> Gere uma lista de **{N}** questões de **{tema}** para uma APG de Medicina, no formato
> de importação do DomineAqui descrito acima. Misture **{X} objetivas** (4 alternativas
> A–D, uma correta) e **{Y} discursivas**. Para cada questão, inclua `Gabarito:` e
> `Comentário:`. Responda **somente** com o texto no formato, sem comentários adicionais
> e sem cercas de código.

Substitua `{N}`, `{tema}`, `{X}` e `{Y}` pelos valores desejados.

---

## 6. Checklist de validação (antes de colar)

- [ ] Cada questão começa com `N.` e há **uma linha em branco** entre questões.
- [ ] Objetivas têm `A)`, `B)`… e `Gabarito:` com **uma letra**.
- [ ] Discursivas **não** têm alternativas; `Gabarito:` é texto-modelo.
- [ ] `Comentário:` está em **uma única linha**.
- [ ] URLs de imagem (se houver) são diretas e públicas.
- [ ] Sem JSON, sem tabelas, sem ```cercas```.

> Importou e algo ficou estranho? Use **Exportar atuais (copiar)** no app para ver como
> o texto canônico fica e ajustar o padrão.
