# Cabe na Sala 🛋️

Digite as medidas de um móvel (ou cole o anúncio, ou envie a foto) e veja se ele
cabe na sua casa: em 3D com as medidas certas e, no iPhone, em AR no tamanho
real. Sem app e sem login.

No ar em [cabenasala.com](https://cabenasala.com).

> Visão completa, regras de produto e milestones: [CLAUDE.md](./CLAUDE.md)
>
> Regras de código, branches, commits e PRs: [CONTRIBUTING.md](./CONTRIBUTING.md)

## O que já existe

- Ferramenta com 8 móveis gerados por código (fogão, sofá, geladeira,
  guarda-roupa, cama, mesa, rack, quadro) que esticam na medida digitada.
- Veredito "passa na porta?" e link compartilhável com móvel, medidas e porta.
- AR Quick Look no iPhone (USDZ gerado no navegador, escala travada).
- Foto do anúncio → modelo 3D do produto real, esticado até as medidas digitadas.
- Medidas lidas do texto ou do print do anúncio.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
```

O site é estático, com três funções de servidor na Vercel (`api/`), que existem
só para guardar chaves pagas fora do navegador:

| Rota             | O que faz                                        | Chave           |
| ---------------- | ------------------------------------------------ | --------------- |
| `/api/model3d`   | Foto do anúncio → modelo 3D (fal.ai)             | `FAL_KEY`       |
| `/api/measures`  | Medidas lidas do anúncio (Claude)                | `ANTHROPIC_API_KEY` |

Sem as chaves, cada rota responde "indisponível" e o resto do site funciona.
Para usá-las no dev, copie `.env.example` para `.env.local` e preencha. Em deploy,
as rotas se recusam a rodar sem o Redis e o anti-robô configurados.

## Scripts

| Script              | O que faz                                              |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Servidor de desenvolvimento (com as rotas de `api/`)   |
| `npm run dev:https` | O mesmo em HTTPS, para testar fluxos do iPhone         |
| `npm test`          | Testes unitários (Vitest)                              |
| `npm run lint`      | Lint (oxlint)                                          |
| `npm run build`     | Typecheck + build de produção                          |
| `npm run preview`   | Serve o build com os cabeçalhos de segurança da Vercel |

## Estrutura

```
api/                 # Funções de servidor (uma por rota) e _lib/ com o que elas compartilham
src/
├── pages/           # LandingPage e ToolPage
├── components/      # Uma pasta por função da interface:
│   ├── tool/        #   peças da página da ferramenta (palco, cabeçalho, alça, atalhos, seletor)
│   ├── form/        #   formulário de medidas
│   ├── furniture/   #   catálogo paramétrico, peças, modelo da foto (scanned/)
│   ├── viewer/      #   cena 3D da ferramenta
│   ├── photo-model/ #   foto do anúncio → modelo 3D
│   ├── ad-measures/ #   medidas pelo anúncio
│   ├── door-check/  #   "passa na porta?"
│   ├── share/       #   enviar para quem decide junto
│   ├── ar/          #   AR Quick Look e saídas de quem não tem AR
│   ├── landing/     #   scrollytelling da landing
│   └── ui/          #   peças genéricas (campo de arquivo)
├── hooks/           # Estado e fluxos (seleção do móvel, foto → 3D, régua da sala…)
├── services/        # Tudo que fala com a rede: rotas do site, anti-robô, Analytics
├── utils/           # Funções puras: unidades, validação, URL, porta, geometria da foto
├── styles/          # Um arquivo por área da interface; index.css define a ordem
├── types/           # Tipos compartilhados
└── constants/       # Limites de medida
```

Regra de ouro do projeto: **unidade interna é metro** (a interface fala em cm e
converte na borda). Escala real é sagrada.
