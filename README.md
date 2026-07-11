# Cabe na Sala 🛋️

Digite as medidas de um móvel e veja se ele cabe na sua casa — em tamanho real,
via AR, antes de comprar. Sem app, sem login, sem backend.

> Visão completa, regras de produto e milestones: [CLAUDE.md](./CLAUDE.md)

## Status

**Milestone 1 (atual):** inputs de largura × altura × profundidade + fogão 3D
gerado por código, esticando em tempo real no desktop.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| Script          | O que faz                          |
| --------------- | ---------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento (HMR)  |
| `npm test`      | Testes unitários (Vitest)          |
| `npm run lint`  | Lint (oxlint)                      |
| `npm run build` | Typecheck + build de produção      |

## Estrutura

```
src/
├── types/         # Interfaces compartilhadas (DimensionsCm, DimensionsMeters…)
├── constants/     # Limites de medida e defaults (fogão 4 bocas)
├── utils/         # Funções puras: conversão cm↔m, validação de input
├── hooks/         # useDimensionsForm (estado do form), useAnimatedDimensions (3D)
└── components/
    ├── form/      # DimensionsForm, DimensionInput
    ├── viewer/    # FurnitureViewer (Canvas, luzes, grade, câmera)
    └── furniture/ # StoveModel + stoveLayout (geometria paramétrica pura)
```

Regra de ouro do projeto: **unidade interna é metro** (a UI fala em cm e
converte na borda). Escala real é sagrada.
