# Como trabalhar neste repositório

Regras curtas para manter o projeto consistente. Visão de produto, decisões
fechadas e identidade visual ficam no [CLAUDE.md](./CLAUDE.md); aqui fica o
**como** do dia a dia.

## Fluxo

1. Nada vai direto para o `main`. Todo trabalho nasce em um branch e entra por PR.
2. Um PR resolve **uma coisa**. Se a descrição precisa de "e também", são dois PRs.
3. O PR só entra com CI verde (lint, testes, build) e com os comentários do bot
   de revisão respondidos: corrigidos ou recusados com motivo.
4. Merge por **squash**. O título do PR vira a mensagem do commit no `main`.

## Nome de branch

```
<tipo>/<descricao-curta-em-kebab-case>
```

| Tipo       | Quando usar                                     | Exemplo                         |
| ---------- | ----------------------------------------------- | ------------------------------- |
| `feat`     | Funcionalidade nova visível ao usuário          | `feat/silhueta-de-escala`       |
| `fix`      | Correção de bug                                 | `fix/cota-altura-no-quadro`     |
| `refactor` | Mudança interna sem alterar comportamento       | `refactor/geometria-unica`      |
| `perf`     | Ganho de desempenho                             | `perf/code-split-do-viewer`     |
| `test`     | Só testes                                       | `test/bordas-do-doorfit`        |
| `docs`     | Só documentação                                 | `docs/regras-do-repositorio`    |
| `chore`    | Dependências, configuração, tarefas de build    | `chore/atualiza-three`          |
| `ci`       | Pipeline e automações                           | `ci/cache-do-npm`               |

Sem acento, sem maiúscula, sem número de ticket solto. Até ~40 caracteres.

## Commits

```
<tipo>: <descrição no presente, minúscula, sem ponto final>

<corpo opcional: o porquê, não o quê>
```

- Mesmos tipos da tabela acima.
- Em português, como o histórico do projeto: `feat: modo 'passa na porta?' com veredito compartilhável`.
- Título com até 72 caracteres.
- Commits pequenos dentro do branch são bem-vindos; o squash limpa o `main`.

## Pull request

**Título:** no formato de commit (`feat: silhueta humana de escala no viewer`).

**Descrição:** o repositório tem um modelo em
[`.github/pull_request_template.md`](./.github/pull_request_template.md). Preencha
todas as seções; se uma não se aplica, escreva "não se aplica" em vez de apagar.

- **O que muda:** duas ou três frases para quem não viu o código.
- **Por quê:** a dor ou a decisão que motivou.
- **Como testar:** passos que outra pessoa consegue repetir, com URL quando houver
  (ex.: `/?movel=sofa&porta=70`).
- **Evidência:** print ou vídeo curto para qualquer mudança visual, em desktop e celular.
- **Riscos:** o que pode quebrar e o que não foi testado (ex.: "AR não testado em iPhone").

Tamanho-alvo: até ~400 linhas alteradas, sem contar lockfile. Acima disso, divida.

## Código

### Nomes

| O quê                              | Padrão                   | Exemplo                          |
| ---------------------------------- | ------------------------ | -------------------------------- |
| Variáveis e funções                | `camelCase`              | `computeCameraPose`              |
| Booleanos                          | prefixo `is/has/should/can` | `isArQuickLookSupported`      |
| Componentes, tipos, interfaces     | `PascalCase`             | `FurnitureViewer`, `DimensionsCm`|
| Constantes                         | `UPPER_SNAKE_CASE`       | `MIN_CAMERA_DISTANCE`            |
| Hooks                              | `use` + `camelCase`      | `useAnimatedDimensions`          |
| Arquivo de componente              | `PascalCase.tsx`         | `DoorCheck.tsx`                  |
| Arquivo de utilitário/hook/catálogo| `camelCase.ts`           | `doorFit.ts`, `sofa.ts`          |
| Classes CSS                        | BEM                      | `.door-check__badge--fits`       |

Identificadores em **inglês**; texto de interface, comentários e commits em **português**.
Também em inglês: nomes de teste, rotas de `api/` e variáveis de ambiente. A exceção é o
que a pessoa vê no link compartilhado (`?movel=fogao&l=60&porta=80`), que fica em português.

### Pastas

- `components/<função>/`: uma pasta por função da interface (`photo-model`, `ad-measures`,
  `door-check`…). Peça genérica, sem regra de negócio, vai em `components/ui/`.
- `hooks/`: estado e fluxos dos componentes.
- `services/`: tudo que fala com a rede (rotas de `api/`, anti-robô, Analytics).
- `utils/`: funções sem rede, de preferência puras e com teste.

### Unidades (a regra que mais causa bug)

- Interface e URL trabalham em **centímetros**; 3D e AR trabalham em **metros**.
- A unidade vai no nome: `widthCm`, `heightM`. Nunca um `width` solto.
- Conversão só pelas funções de `src/utils/units.ts`.

### Estilo

- TypeScript estrito. Sem `any`; `readonly` em props e tipos de dados.
- **Imutabilidade:** nunca mutar entrada; devolver objeto novo.
- Funções com até ~50 linhas, arquivos com até ~400 (800 é o teto).
- Sem número mágico: toda proporção, limite ou tempo vira constante nomeada.
- Retorno antecipado em vez de `if` aninhado.
- Erro nunca é engolido: trata, mostra mensagem útil ou propaga.
- Comentário explica o **porquê** (regra de produto, limitação do Safari), não o que a linha faz.
- Sem `console.log` esquecido.

### 3D e catálogo de móveis

- Todo móvel é uma lista de peças de `parts.ts` (`box`, `roundedBox`, `cylinder`),
  derivadas **só** das medidas totais por proporções nomeadas.
- **Escala real é sagrada:** a caixa envolvente do modelo tem de bater com as
  medidas digitadas. Os testes de `catalog.test.ts` garantem isso; móvel novo
  entra no catálogo e passa nesses testes sem alterá-los.
- Viewer e AR usam a mesma geometria (`partGeometry.ts`). Não criar caminho paralelo.
- Material novo entra na paleta `MATERIALS`, não solto no arquivo do móvel.

### Interface

- Cores, raios e fontes vêm dos tokens em `:root` (`src/styles/base.css`). Nada de cor
  fixa em componente.
- Estilo: um arquivo por área da interface em `src/styles/`, importado em
  `src/index.css` na ordem da cascata (`tool-mobile.css` por último).
- Componente não usa classe de outro componente. O que é comum vira classe genérica:
  `.button` (e `--primary`, `--quiet`, `--large`…), `.panel-section`, `.file-input`, `.slider`.
- A identidade é a "estúdio" descrita no CLAUDE.md: branco sobre grafite, a única
  cor é a luz quente (`--color-light`); verde, âmbar e vermelho só no veredito.
  Sem azul e sem fundo claro. Números com `tabular-nums`.
- Toda tela nova funciona em 375 px de largura, sem rolagem horizontal.
- Elemento interativo é `<button>` ou `<a>`, com rótulo acessível e foco visível.

## Testes

- Lógica pura (unidades, validação, URL, porta, layout de móvel) tem teste em
  `__tests__/` ao lado do código, em `src/` e em `api/_lib/`.
- Estrutura Arrange / Act / Assert e nome em inglês que descreve o comportamento:
  `test('rejects a width above the limit', ...)`.
- Bug corrigido ganha um teste que falhava antes da correção.
- Antes de abrir o PR:

```bash
npm run lint && npm test && npm run build
```

## Revisão automática

Os PRs são revisados pelo [CodeRabbit](https://coderabbit.ai), gratuito em
repositório público. A configuração está em [`.coderabbit.yaml`](./.coderabbit.yaml).

- Comentário **Major/Critical**: corrige antes do merge ou responde por que não se aplica.
- Comentário **Minor/Nitpick**: a critério de quem abriu o PR.
- Para conversar com o bot no PR: `@coderabbitai` seguido da pergunta.
- O bot erra. Discordar com argumento é parte do processo; ignorar em silêncio não é.

## Segurança

- Nenhum segredo no repositório. O site é estático; as chaves pagas ficam só nas
  funções de `api/`, em variáveis de ambiente cujo nome entra no `.env.example`.
- Renomear rota ou variável de ambiente exige trocar o nome na Vercel antes do
  deploy: sem isso, a função passa a usar o padrão ou responde "indisponível".
- Dependência nova só quando poucas linhas não resolvem; registre o motivo no PR.
