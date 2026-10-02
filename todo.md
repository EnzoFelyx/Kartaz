# GoRocketLeague Mobile — TODO

Guia de construção do app em Expo, fase a fase. Cada fase tem um critério "Pronto quando".
Referências: PROJECT_CONTEXT.md (regras/comportamento) · UI_REACT_para_referencia/src/App.tsx e index.css (visual).

Regras gerais
- Sem bibliotecas de **componentes prontos**. Todo componente visual é construído do zero.
- Bibliotecas de **estilo** são permitidas: **NativeWind (Tailwind)** é o padrão de estilização, via `className`.
- Primitivas permitidas: react-native-svg, expo-linear-gradient, expo-blur, react-native-reanimated (+ módulos do SDK Expo: expo-router, expo-font, expo-splash-screen, safe-area-context).
- Estado global com **Zustand** (uma store por domínio). Context API só para providers do app (bootstrap/injeção), nunca para estado de jogo.
- **Paleta principal = tokens do `@theme` de `UI_REACT_para_referencia/src/index.css`**, com os mesmos nomes. Nenhuma cor fora do tema.
- Nenhuma cor, fonte, espaçamento ou número de balanceamento hardcoded em tela: tokens em src/theme, expostos ao Tailwind via tailwind.config; balanceamento em config (mock remoto).
- Lógica de jogo sensível é do servidor: o app só exibe e envia intenções. Enquanto não há backend, mocks com o mesmo formato dos contratos da API.
- Sem marcas oficiais FIFA/World Cup; nomes/imagens de jogadores são placeholders.

## Fase 0.1 — Projeto base
- [ ] Criar o app dentro de `mobile/` (rodar na raiz `Kartaz/`, com a pasta `mobile/` vazia):
  ```bash
  npx create-expo-app@latest mobile
  cd mobile
  npx expo start
  ```
  O template padrão já vem com TypeScript e Expo Router.
- [ ] Limpar o boilerplate do template: `npm run reset-project` (se existir no template) e apagar telas, componentes e assets de exemplo que sobrarem
- [ ] TypeScript strict + alias de import `@/` → `src/` (tsconfig.json)
- [ ] app.json: nome, slug, scheme, userInterfaceStyle "dark", cor de fundo #080b14, orientação portrait
- [ ] Criar a estrutura de pastas (ver abaixo), com um `index.ts` vazio onde fizer sentido
- [ ] Lint/format: ESLint do Expo (`npx expo lint`) + Prettier, com scripts no package.json
Pronto quando: app abre no Expo Go/simulador numa tela vazia, sem warnings, com a estrutura de pastas criada.

### Estrutura de pastas
```text
mobile/
├── app/                        # rotas (Expo Router)
│   ├── _layout.tsx             # root: fontes, global.css, safe area, hidratação das stores
│   ├── index.tsx               # gate: splash → onboarding → tabs
│   ├── onboarding.tsx
│   ├── _sandbox.tsx            # vitrine de componentes (só em dev)
│   ├── (tabs)/
│   │   ├── _layout.tsx         # TabBar custom
│   │   ├── map.tsx
│   │   ├── collection.tsx
│   │   ├── trades.tsx
│   │   ├── achievements.tsx
│   │   └── profile.tsx
│   ├── card/[id].tsx           # Card Details
│   ├── trade/new.tsx           # Create Trade
│   ├── profile/edit.tsx        # Edit Profile / Settings
│   └── card-reveal.tsx         # modal
├── assets/
│   ├── fonts/                  # Exo 2, Rajdhani, JetBrains Mono (.ttf)
│   ├── icons/                  # SVGs próprios
│   └── images/                 # ícone do app, splash
├── src/
│   ├── theme/                  # colors, fonts, gradients, shadows, index.ts (fonte única do tema)
│   ├── components/
│   │   ├── ui/                 # componentes base (Text, Button, GlassView, Chip, ProgressBar…)
│   │   ├── game/               # componentes de jogo (CardFace, HudPanel, ScanButton…)
│   │   └── icons/              # ícones SVG como componentes
│   ├── features/               # lógica e subcomponentes de cada tela
│   │   ├── map/
│   │   ├── collection/
│   │   ├── trades/
│   │   ├── achievements/
│   │   └── profile/
│   ├── stores/                 # Zustand (player, collection, trades, settings, onboarding)
│   ├── services/               # "API" (mock agora, backend depois)
│   ├── mocks/                  # dados fictícios no formato dos contratos
│   ├── types/                  # tipos de domínio (Card, Nation, TradeOffer…)
│   ├── hooks/                  # hooks derivados (useFuel, useLevelProgress…)
│   ├── animations/             # animações reanimated reutilizáveis
│   ├── config/                 # gameConfig (mock da config remota)
│   └── utils/                  # helpers puros (formatação, cálculo de progresso)
├── global.css                  # @tailwind base/components/utilities
├── tailwind.config.js          # lê cores de src/theme/colors.ts
├── babel.config.js
├── metro.config.js
├── nativewind-env.d.ts
├── app.json
└── tsconfig.json
```

## Fase 0.2 — Instalação das dependências
> Usar `npx expo install` para libs nativas (escolhe a versão compatível com o SDK). Antes de instalar o NativeWind, conferir na doc oficial qual versão combina com o SDK atual (Tailwind v3 ou v4) e ajustar os comandos.

- [ ] Primitivas visuais e animação:
  ```bash
  npx expo install react-native-svg expo-linear-gradient expo-blur react-native-reanimated
  ```
  Conferir se a versão do Reanimated pede `react-native-worklets` e plugin no babel.
- [ ] Fontes e splash (se o template não trouxer):
  ```bash
  npx expo install expo-font expo-splash-screen
  ```
- [ ] Estilo — NativeWind + Tailwind:
  ```bash
  npx expo install nativewind react-native-safe-area-context
  npm install -D tailwindcss prettier-plugin-tailwindcss
  npx tailwindcss init
  ```
  Configurar: `tailwind.config.js` (preset nativewind, `content` em `app/**` e `src/**`) · `global.css` importado em `app/_layout.tsx` · `babel.config.js` (`jsxImportSource: "nativewind"` + `nativewind/babel`) · `metro.config.js` (`withNativeWind`) · `nativewind-env.d.ts` para tipar `className`
- [ ] Estado e persistência:
  ```bash
  npm install zustand
  npx expo install @react-native-async-storage/async-storage
  ```
- [ ] Rodar `npx expo-doctor` e limpar cache (`npx expo start -c`)
Pronto quando: uma classe Tailwind padrão (ex.: `<View className="flex-1 bg-black" />`) funciona, uma store Zustand de teste funciona e o `expo-doctor` não aponta problemas.

## Fase 1 — Design System (tema Tailwind + fontes)
- [ ] Paleta principal = bloco `@theme` de UI_REACT_para_referencia/src/index.css, nomes idênticos:

  | token                 | valor                  |
  |-----------------------|------------------------|
  | background            | #080b14                |
  | foreground            | #e8eaf0                |
  | card                  | #0f1520                |
  | card-foreground       | #e8eaf0                |
  | primary               | #00d4ff                |
  | primary-foreground    | #080b14                |
  | secondary             | #1a2235                |
  | secondary-foreground  | #a0aec0                |
  | muted                 | #111827                |
  | muted-foreground      | #6b7280                |
  | accent                | #ff6b00                |
  | accent-foreground     | #ffffff                |
  | border                | rgba(0, 212, 255, 0.12)|
  | ring                  | #00d4ff                |
  | radius                | 12px                   |

- [ ] Cores complementares (já usadas nas classes/keyframes do index.css e no App.tsx): deep #040710 · gold #ffd700 · progress-end #0088ff · fuel-end #ffaa00 · success #22c55e · danger #ef4444
- [ ] Raridades + glow: common #6b7280 · rare #3b82f6 · epic #8b5cf6 · legendary #ffd700
- [ ] src/theme/colors.ts como **fonte única**; tailwind.config.js importa dele em `theme.extend.colors`
      → classes `bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `bg-rarity-epic`…; valores crus seguem disponíveis para SVG, gradientes e reanimated
- [ ] Fontes locais via expo-font: Exo 2 (display), Rajdhani (body), JetBrains Mono (mono), pesos 400–900; segurar splash até carregar
- [ ] `fontFamily` no tailwind: display / body / mono — no RN cada peso é uma família (ex.: `font-display-black`, `font-mono-bold`)
- [ ] `borderRadius.DEFAULT = 12px` (`--radius`); usar escala padrão do Tailwind para spacing e fontSize (incluir tamanhos 8–10px usados no protótipo)
- [ ] gradients.ts: progress (#00d4ff→#0088ff), fuel (#ff6b00→#ffaa00), card face, holographic
- [ ] shadows/glow.ts: neon, fire, gold (iOS shadow + Android elevation/fallback)
- [ ] Mapear utilitárias do index.css → implementação RN (NativeWind não cobre blur, gradiente, text-shadow e sombra colorida de forma uniforme):

  | index.css                                   | no app                          |
  |---------------------------------------------|---------------------------------|
  | .glass / .glass-strong                      | GlassView (expo-blur)           |
  | .neon-border                                | variante de Surface             |
  | .neon-text / .fire-text / .gold-text        | variantes de Text               |
  | .progress-bar / .fuel-bar / .card-holographic | LinearGradient                |
  | .map-grid                                   | SVG                             |
  | .tab-active                                 | estado da TabBar                |

- [ ] Keyframes do index.css → animações reanimated na Fase 2: pulse-glow, scan-line, ping-signal, card-reveal, float, shimmer, orbit, bar-fill
- [ ] Exportar tudo por src/theme/index.ts
Pronto quando: tela de debug "/_sandbox" mostra paleta (via classes Tailwind), tipografia e gradientes.

## Fase 2 — Componentes base (src/components/ui), do zero
Estilo via `className` (NativeWind) com variantes por prop; `style` só para o que o Tailwind não cobre (glow, textShadow, valores animados).
- [ ] Text (variantes do tema; neon/fire/gold via textShadow)
- [ ] Screen (safe area + fundo) e ScreenHeader (título, subtítulo mono, botão voltar, ação à direita)
- [ ] GlassView (expo-blur + borda; variantes glass / glass-strong; fallback Android)
- [ ] NeonBorder / Surface (card com borda e glow configuráveis)
- [ ] Button: primary (sólido ciano), outline neon, ghost, danger, success; estados pressed/disabled/loading; scale ao pressionar
- [ ] IconButton (quadrado 36px, borda neon — botão "‹" voltar, toggles)
- [ ] Chip / FilterPill (selecionado/não selecionado, cor custom)
- [ ] Badge (RarityBadge baseado nele)
- [ ] ProgressBar (gradiente, glow, animação de preenchimento) e StatBar (label + barra + valor)
- [ ] Toggle (switch próprio animado)
- [ ] TextField e TextArea (contador de caracteres, caret ciano)
- [ ] SegmentedControl (Public/Friends/Private, grid/list, abas internas)
- [ ] KeyValueRow (linhas "CARD INFO"/resumos)
- [ ] Icon set em SVG próprio (substitui emojis do protótipo): map, cards, trades, trophy, user, search, radar, fuel, rocket, back, check, close, edit, grid, list, lock, bell, globe
- [ ] Animações reutilizáveis (reanimated): pulseGlow, float, ping, shimmer, orbit, barFill, cardReveal (rotateY), scanLine
- [ ] Rota de sandbox listando todos os componentes
Pronto quando: todos os componentes aparecem no sandbox em todos os estados.

## Fase 3 — Navegação (Expo Router)
- [ ] app/_layout.tsx: providers (fontes, safe area, global.css, bootstrap e hidratação das stores Zustand — estado do jogador NÃO fica em Context), Stack raiz sem header nativo
- [ ] Gate inicial: splash → onboarding (1ª vez) → tabs
- [ ] app/(tabs)/_layout.tsx com TabBar 100% custom (glass-strong, 64px, ícone + label mono, indicador superior ciano com glow): map · collection · trades · achievements · profile
- [ ] Rotas de stack (tela cheia, sem tab bar): card/[id] · trade/new · profile/edit
- [ ] Rota modal: card-reveal (presentation transparentModal)
- [ ] Transições (fade/slide) e back no Android
- [ ] Cada rota renderiza um placeholder com o título
Pronto quando: dá para navegar por todas as rotas, ida e volta, com a tab bar custom.

## Fase 4 — Tipos, mocks, serviços e stores (Zustand)
- [ ] src/types: Edition, Nation, Player, Card (serial/1000, rarity, status), OwnedCard, TradeOffer + TradeItem (status open/accepted/declined/cancelled/expired), Achievement + UserAchievement, Mission, Profile (xp, level, fuel, fuelMax, settings), GameConfig, DetectionResult
- [ ] src/mocks: dados realistas e fictícios (seleções, jogadores, cartas, trades, conquistas, perfil)
- [ ] src/services/*: funções async que simulam a API (latência, erros aleatórios opcionais) — mapService.detect(center, zoom), collect, trades, profile, achievements
- [ ] src/config/gameConfig.ts (mock da config remota): fuel por km, custos de teleporte, regen, custos de scan, XP
- [ ] Stores **Zustand** em src/stores (uma por domínio):
      usePlayerStore (xp, level, fuel, fuelMax) · useCollectionStore · useTradeStore · useSettingsStore (notificações, localização, tema) · useOnboardingStore
- [ ] Middleware `persist` + AsyncStorage para settings e onboarding
- [ ] Actions das stores chamam src/services (mock); a store só reflete a resposta do "servidor", nunca decide regra de jogo
- [ ] Consumir sempre via selectors (ex.: `usePlayerStore(s => s.fuel)`) para evitar re-render
- [ ] Hooks derivados das stores: useFuel (regen visual), useLevelProgress, useCollectionProgress (por seleção)
Pronto quando: telas placeholder leem dados mockados via stores Zustand.

## Fase 5 — Componentes de jogo (src/components/game)
- [ ] CardFace (normal/compact): posição, nome, seleção, rating, badge, área de arte com grid + shimmer, stats
- [ ] CardListRow
- [ ] UndiscoveredCard (grid e lista, borda tracejada)
- [ ] HudPanel: nível, barra de XP, foguete flutuando; FuelGauge com aviso LOW
- [ ] SignalMarker (ping pulsante / descoberto)
- [ ] ScanButton (circular 80px, estados idle/scanning/disabled)
- [ ] TradeCardMini, TradeOfferCard (expansível com Accept/Decline), TradeSummary (⇌ FOR)
- [ ] AchievementRow (bloqueada/desbloqueada em dourado)
- [ ] StepProgress (wizard de 3 passos)
- [ ] Avatar (com glow) e AvatarPicker
Pronto quando: todos aparecem no sandbox com dados mock.

## Fase 6 — Telas individuais (uma por vez)
### 6.1 Splash / Loading
- [ ] Logo + animação de foguete; carrega estado do jogador; transição para onboarding/tabs
### 6.2 Onboarding (não existe no protótipo — usar o mesmo design system)
- [ ] 3 passos: Explore · Collect · Fuel & Rocket → "Start Exploration"; flag "já viu" persistida via useOnboardingStore (persist)
### 6.3 Map (principal)
- [ ] Fundo do mapa estilizado (SVG + grid, como no protótipo) — mapa real fica para a fase 8
- [ ] HUD topo (XP/Level + Fuel), sinais pulsantes
- [ ] Fluxo do PROJECT_CONTEXT: sinal → carta detectável pulsando → painel "Unknown card detected" → Scan Area → animação de scan → abre card-reveal
- [ ] Gesto de arrastar consumindo Fuel (valor vindo de config); bloquear sem Fuel
### 6.4 Card Reveal (modal)
- [ ] Carta vira (rotateY), revela jogador, seleção, serial, raridade, Fuel gasto, XP ganho → "Collect Card"
### 6.5 Collection
- [ ] Header com contagem, toggle grid/list, filtros
- [ ] Abas All Cards / By Nation (progresso ex. 12/26) / Rarity
- [ ] Seção de não descobertas
### 6.6 Card Details
- [ ] Hero com anéis e glow da raridade, stats, Card Info (serial, data de coleta), Legend
- [ ] Ações Offer Trade (abre trade/new com a carta pré-selecionada) e Favorite
### 6.7 Trades
- [ ] Abas Open Trades / My Trades; card de oferta expansível; botão + NEW
### 6.8 Create Trade (wizard)
- [ ] Passo 1: cartas oferecidas (seleção múltipla — NxN) · Passo 2: cartas desejadas/filtros · Passo 3: revisão + aviso de bloqueio (escrow) → tela "Trade posted"
### 6.9 Achievements
- [ ] Progresso geral + lista com recompensas XP/Fuel
- [ ] Missões diárias (2–3) — ⚠️ sem design no protótipo, compor com componentes existentes
### 6.10 Profile
- [ ] Hero (avatar, nickname, stats), seleções, carta em destaque, atalhos de configurações
### 6.11 Edit Profile / Settings
- [ ] Avatar, username, bio, região, privacidade, toggles de notificações / localização / tema; danger zone
Pronto quando (por tela): visual bate com o protótipo e todos os estados mock funcionam.

## Fase 7 — Estados obrigatórios e polimento
- [ ] Coleção vazia
- [ ] Sem Fuel: "Not enough fuel to launch your rocket" + indicação de recarga
- [ ] Loadings animados (scan, foguete, radar) e skeleton com shimmer
- [ ] Erro de rede com retry
- [ ] Acessibilidade (labels, áreas de toque ≥ 44px, contraste), safe areas, teclado
- [ ] Testar em iOS e Android (blur, sombras e fontes se comportam diferente)

## Fase 8 — Bloqueado por decisão (não iniciar sem confirmação)
- [ ] Biblioteca de mapa real (MapLibre ou react-native-maps — exige dev build)
- [ ] Backend (Supabase ou NestJS) e troca dos mocks pelos serviços reais
- [ ] Localização em background + notificações (feature opcional)

## ⚠️ Divergências protótipo × PROJECT_CONTEXT (decidir antes da tela)
- Carta: protótipo usa rating/SPD/PWR/BST; contexto exige serial (400/1000) e data de coleta → manter stats?
- Raridade: protótipo tem 4 níveis; contexto ainda não definiu o que torna uma carta rara
- Fuel: protótipo mostra % e "-12% por scan"; contexto usa valor absoluto (máx. 100, cresce com nível)
- Scan: protótipo é um botão global; contexto exige carta detectável por raio + zoom antes do Scan Area
- Collection: protótipo filtra por raridade; contexto pede abas All / By Nation / Rarity
- Trades: protótipo é 1x1 com "wanted" por filtro; contexto prevê NxN com cartas específicas e abas Open / My Trades
- Profile: protótipo tem game mode, região e privacidade; contexto pede notificações, localização e tema
- Splash, Onboarding e Missões não têm design no protótipo
