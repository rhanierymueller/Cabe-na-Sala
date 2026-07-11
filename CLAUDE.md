# Cabe na Sala 🛋️

## Visão

Site (não app) onde qualquer pessoa digita as medidas de um móvel/eletrodoméstico
(sofá, fogão, geladeira, guarda-roupa, cama, mesa, TV) e o visualiza **em tamanho
real na própria casa via AR** pela câmera do celular, antes de comprar.

Dor que resolve: comprar móvel que não cabe (ou não passa na porta). Compra cara,
devolução é pesadelo, e ninguém atende quem compra fora de catálogo fechado
(OLX, Marketplace, lojas diversas).

Diferencial vs. IKEA Place / Amazon "ver no quarto": **agnóstico de loja**
(qualquer móvel de qualquer lugar, inclusive usados), **sem app** (abre por link),
**funciona no iPhone** (Quick Look) e no Android (WebXR).

## Regras de produto (decididas — não reabrir sem motivo forte)

- **Escala real é sagrada.** Gesto de pinça/escala DESABILITADO no AR
  (Quick Look: desabilitar via parâmetro; WebXR: simplesmente não implementar).
  Para "mudar o tamanho", o usuário edita as medidas e o modelo regenera.
- Mover (arrastar) e girar (dois dedos) no chão: liberados.
- Objeto sempre ancorado no chão detectado, nunca flutuando.
- Sem colisão com paredes (limitação aceita) — compensar exibindo as **medidas
  flutuando sobre o objeto** em AR (ex.: setas com "75 cm").
- **Sem login.** Persistência futura via localStorage se necessário.
- **Sem backend.** Site 100% estático. Custo de operação ~R$0.
- Modelos 3D **gerados por código** (caixas estilizadas com encosto/pés etc.),
  para esticar limpo em qualquer medida. Assets low-poly CC0 (Kenney, Quaternius,
  Poly Haven) só como polimento futuro — modelo artístico deforma ao esticar.
- Unidade interna: **metros** (bug clássico: cm vs m → móvel gigante/minúsculo).
- Zero anúncio dentro da experiência 3D/AR. Anúncio só em páginas de conteúdo,
  discreto, e só quando houver tráfego.

## Stack

- Vite + React + **TypeScript** (preferência forte do dev: tudo em TS)
- Three.js (ou React Three Fiber) para o 3D
- Framer Motion para UI/motion (site precisa parecer premium: transições fluidas,
  móvel "cresce" animado quando as medidas mudam, dark mode)
- AR:
  - **Android/Chrome:** WebXR (hit-test em plano do chão + anchors + gestos)
  - **iPhone:** exportar USDZ no navegador (Three.js `USDZExporter`) e abrir via
    **AR Quick Look** (link `rel="ar"`), com escala travada
  - Fallback universal: `<model-viewer>` para visualização 3D fora de AR
- Deploy: Vercel ou Cloudflare Pages (plano free)
- Dev sem Android físico: Immersive Web Emulator (extensão Chrome da Meta);
  validação em aparelho real depois (Samsung Remote Test Lab / celular emprestado)

## Monetização (escada — implementar nessa ordem)

1. **Afiliado (principal):** Amazon / Magalu / Mercado Livre.
   - Nível 1 (MVP): link de busca pré-filtrada com a medida
     (ex.: "fogão 4 bocas 60cm") + código de afiliado. Template de URL.
   - Nível 2: mini-catálogo curado em JSON estático (15-20 modelos por categoria
     com medidas) → "esses 4 fogões cabem no seu espaço".
   - Cenário de ouro: móvel testado NÃO coube → recomendar alternativas que cabem.
2. Anúncios discretos em páginas de conteúdo (só com volume).
3. Parceria direta com loja média.
4. **Prêmio final:** white-label B2B — loja embute o "ver na minha casa" e paga
   mensalidade.

## Distribuição (70% do trabalho — o código é só 30%)

- **SEO é o canal principal:** uma página por móvel respondendo buscas reais
  ("medidas sofá 3 lugares", "medidas fogão 4 bocas", "geladeira não passa na
  porta"), com a ferramenta como clímax da página. Páginas de conteúdo podem ir
  ao ar ANTES da ferramenta ficar pronta.
- TikTok/Reels de dor doméstica ("comprou e não passou na porta? 🤡") demonstrando
  a ferramenta em 10s.
- Loop social embutido: botão "enviar para..." após visualizar (decisão de móvel
  é quase sempre em dupla).
- Fase 2: extensão de navegador que detecta medidas na página da loja e adiciona
  botão "ver na minha casa".
- Domínio: registrar `cabenasala.com.br` cedo (Registro.br, ~R$40/ano — único
  custo do projeto).

## Milestones (pequenos de propósito — o objetivo nº 1 é TERMINAR)

1. **[AGORA]** Página com inputs largura × altura × profundidade + móvel 3D
   gerado por código esticando em tempo real na tela (desktop, sem AR ainda).
   Caso de teste oficial: o fogão que o dev vai comprar.
2. Galeria de formas (sofá, fogão, geladeira, guarda-roupa, cama, mesa, TV por
   polegadas) com medidas padrão pré-preenchidas.
3. Exportação USDZ + botão AR Quick Look (iPhone do dev = aparelho de teste).
4. WebXR no Android (hit-test, ancorar, arrastar, girar) + medidas flutuantes.
5. Botões de afiliado nível 1 (links de busca com medida).
6. Deploy na Vercel + primeiras páginas de SEO.

## Contexto do dev (para calibrar as respostas)

- ~9 anos de experiência; forte em TypeScript, React, C#/.NET; conhece Three.js
  superficialmente; primeira vez com WebXR/AR.
- Padrão a combater: abandonar projetos no meio. Este projeto foi escolhido
  deliberadamente por ser pequeno, terminável, custo zero e sem dependência de
  sorte viral. **Sugerir sempre o próximo passo menor possível; evitar expandir
  escopo antes do deploy do milestone atual.**
- Tem Mac + iPhone; NÃO tem Android físico (usar emulador/test lab).
- Decisões acima já passaram por longa discussão (competição, iPhone vs Android,
  monetização, distribuição). Não reabrir debates resolvidos; foco em executar.
