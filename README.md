# Kartaz

Jogo mobile multiplayer de exploração no mapa com cartas colecionáveis de futebol, em React Native, com servidor autoritativo em tempo real (Colyseus + H3), arquitetura MVVM e regras de jogo em funções puras.

**Português** · [English](README.en.md) · [Como jogar](Como_jogar.md)

![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Reanimated](https://img.shields.io/badge/Reanimated-4.5-001A72)
![Colyseus](https://img.shields.io/badge/Colyseus-0.17-F0503C)
![H3](https://img.shields.io/badge/H3-4.5-1F7A8C)

> ⚠️ **Projeto didático, sem fins lucrativos.** As cartas usam nomes e imagens baseadas em fotos de **pessoas reais** (jogadores de futebol). Por isso o Kartaz existe apenas como projeto de estudo e portfólio: não é vendido, não tem anúncios nem compras reais, não gera receita e não será publicado em lojas. Leia o [Aviso legal](#aviso-legal).

## Demonstração

<a href="https://youtu.be/I-fDqdkY11U" title="Vídeo de demonstração do Kartaz no YouTube">
  <img src="https://img.youtube.com/vi/I-fDqdkY11U/hqdefault.jpg" alt="Vídeo de demonstração do Kartaz no YouTube" width="560">
</a>

▶️ [Assista no YouTube](https://youtu.be/I-fDqdkY11U): dois celulares jogando ao mesmo tempo, mostrando o mapa multiplayer, a disputa por cartas e as trocas em tempo real.

## Sobre o Projeto

Kartaz é um jogo no estilo Pokémon GO, sem realidade aumentada: o jogador "anda" arrastando o mapa, encontra cartas, moedas, baterias e bandeiras, monta a coleção, escala um time de 5 titulares e troca cartas com outros jogadores em tempo real.

- **Cartas únicas:** cada carta é uma cópia numerada de um jogador (`669 / 1000`), com no máximo um dono. O catálogo tem 1.000 jogadores.
- **Mapa vivo e compartilhado:** o mundo é dividido em células H3. Cada área tem a sua sala em tempo real, com os outros jogadores, os itens e uma bandeira de descoberta.
- **Economia no servidor:** energia, XP, nível, coletas, cartas e trocas são decididos pelo backend. O app só envia intenções.
- **Time com química:** bônus por titulares da mesma seleção e do mesmo clube, com um botão "Auto" que encontra a melhor escalação.
- **Trocas N × M** com aceite em transação atômica e notificação local.
- **Três idiomas:** português, inglês e espanhol.

As regras completas, do ponto de vista do jogador, estão em [Como jogar](Como_jogar.md).

O projeto foi um exercício deliberado de **multiplayer autoritativo no celular**. Um mapa com itens é simples enquanto existe um jogador só. Fica difícil quando várias pessoas olham para a mesma área ao mesmo tempo: todo mundo precisa ver as mesmas cartas, só uma pessoa pode pegar cada uma, e quem cruza de uma área para outra não pode cair num "buraco" sem sala. Quase todas as decisões abaixo saem desse problema.

## Stack

### App (`mobile/Kartazapp`)

| Tecnologia | Versão | Papel no projeto |
|------------|--------|------------------|
| React Native | 0.86 | Base do aplicativo |
| Expo | ~57.0.26 | Plataforma e build (Continuous Native Generation) |
| Expo Router | ~57.0.24 | Rotas por arquivo, com typed routes |
| TypeScript | ~6.0 | Tipagem estrita, incluindo o contrato entre View e ViewModel |
| React Compiler | — | Memoização automática |
| Reanimated | 4.5 | Animações na UI thread |
| React Native Skia / SVG | 2.6 / 15 | Brilhos, gradientes e arte das cartas |
| react-native-maps | 1.27 | Mapa Google com estilo escuro |
| TanStack Query | 5 | Dados da API REST, cache e paginação |
| @colyseus/sdk | 0.17 | Sala em tempo real |
| h3-js | 4.5 | Grade geográfica hexagonal |
| expo-sqlite | ~57.0 | Catálogo de jogadores offline |
| i18next | 26 | Português, inglês e espanhol |

### Backend (Rocketseat)

| Tecnologia | Papel no projeto |
|------------|------------------|
| Fastify | API REST (auth, usuário, jogadores, trocas, carteira, time) |
| Colyseus 0.17 | Salas em tempo real, uma por célula H3 |
| Prisma 7 + PostgreSQL | Persistência |
| h3-js | Salas, colisão e coleta |
| JWT próprio | Convidado, Google e Apple, com refresh token |

## Decisões Técnicas

### Uma sala por hexágono

O mundo é uma grade H3 em três resoluções, cada uma com um papel:

| Resolução | Papel |
|---|---|
| **8** | Sala Colyseus (a "área" do jogo) |
| **9** | Célula do jogador e visibilidade das cartas |
| **12** | Colisão: pegar um item é estar na mesma célula res 12 que ele |

O app conecta **só na sala da célula atual**. Nada de outras salas chega ao celular, então o tráfego não cresce com o tamanho do mundo. As salas vizinhas (anel k1) ficam em stand-by no servidor, prontas para a troca.

### Handoff entre salas sem "buraco"

Cruzar a borda de um hexágono é trocar de sala. Se o app saísse da antiga antes de entrar na nova, haveria um intervalo em que o jogador não existe em lugar nenhum. A ordem foi invertida: o servidor manda `changeRoom`, o app entra na nova sala e **só então** confirma `switchedRoom` na antiga.

```ts
// mobile/Kartazapp/src/hooks/use-cell-room/use-cell-room.ts
const changeRoom = useCallback(async (room: Room, message: ChangeRoomMessage) => {
  if (switchingRef.current) return;
  switchingRef.current = true;
  try {
    const next = await joinRef.current({ fuel: message.fuel, xp: message.xp, level: message.level });
    // Só libera a sala antiga depois de estar na nova (o servidor então remove o jogador dela).
    if (next) room.send('switchedRoom', { handoffId: message.handoffId });
  } finally {
    switchingRef.current = false;
  }
}, []);
```

Durante a troca, as duas salas ficam vivas por um instante. Por isso cada assinatura confere se ainda é a sala atual, para que um patch atrasado da sala antiga não sobrescreva o estado da nova:

```ts
room.onStateChange((state) => {
  if (roomRef.current !== room) return;
  applyState(state, room.sessionId, profileRef.current?.userId ?? '');
});
```

### Sorteio determinístico: todos veem as mesmas cartas

As cartas de cada área são sorteadas em janelas de 15 minutos. Em vez de guardar o resultado, o sorteio é **função da célula e da janela**: uma semente com os dois gera sempre o mesmo número, em qualquer instância do servidor.

```js
// backend/src/services/cellRoomCardService.js
function roomCardCountInWindow(roomCell, nowMs = Date.now()) {
  if (!roomCell) return 0;
  const roll = createSeededRng(`cardwindow:${String(roomCell)}:${currentCardWindow(nowMs)}`)();
  const tier = getCardSpawnConfig().roomCardCountChances.find(({ chance }) => roll < chance);
  return tier ? tier.count : 0;
}
```

As chances são acumuladas (≥1 carta 30%, ≥2 15%, ≥3 5%, 5 cartas 1%), então 70% das janelas ficam vazias, o que faz uma carta encontrada ter valor.

### Coleta atômica: só um dono por carta

Dois jogadores podem passar pela mesma carta no mesmo frame. A coleta não lê e depois escreve: ela é um único `updateMany` condicionado ao estado esperado. Se outra transação chegou antes, `count` volta 0 e o segundo jogador recebe `collectCardRejected`.

```js
// backend/src/colyseus/cards/cardRoomRuntime.js
const updated = await tx.instance.updateMany({
  where: {
    id: String(cardInstanceId),
    reservedByRoomId: String(room.roomId),
    ownerId: null,
    foundWhen: null,
  },
  data: {
    ownerId: String(user.id),
    reservedByRoomId: null,
    foundWhen: new Date(),
    foundWhereLat: Number(user.lat ?? 0),
    foundWhereLng: Number(user.lng ?? 0),
  },
});
```

A **reserva** da carta pela sala segue o mesmo padrão. Antes, várias salas sorteando ao mesmo tempo pegavam as mesmas cópias do pool, e a coleta falhava depois. Ao iniciar, o servidor também devolve ao pool as reservas de salas que não existem mais, senão essas cartas ficariam presas para sempre.

### Nível derivado, nunca armazenado

O nível não é uma coluna: é sempre calculado a partir do XP total, com uma curva de potência configurável por variável de ambiente.

```js
// backend/src/rules/levelRules.js
function xpToNextLevel(level) {
  const l = Math.max(1, Math.floor(Number(level) || 1));
  return Math.round((LEVEL_XP_BASE * l ** LEVEL_XP_EXPONENT) / 10) * 10;
}
```

Com os padrões (100 e 1,5): 1→2 = 100 XP, 5→6 = 1.120, 10→11 = 3.160. Mudar a curva rebalanceia todos os jogadores de uma vez, sem migração. O mesmo vale para os outros números do jogo: energia, radar, chances e preços têm padrão no código e podem ser trocados no `.env`.

### A melhor escalação por busca exaustiva podada

O overall do time é `soma × (1 + bônus%)`, e o bônus é cumulativo: cada seleção e cada clube com 2 ou mais titulares soma o seu. Isso faz o "pegar os 5 maiores" errar, porque um jogador mais fraco pode valer mais pela química. O botão "Auto" testa todas as combinações de 5, mas num conjunto podado: os 25 melhores no geral mais os melhores de cada seleção e de cada clube, com teto de 45 cartas.

```ts
// mobile/Kartazapp/src/lib/team/team-scoring.ts
/** Melhores no geral que entram na busca. */
const TOP_OVERALL = 25;
/** Por seleção e por clube, os melhores que entram (para achar combinações com bônus). */
const TOP_PER_GROUP = LINEUP_SIZE;
/** Teto da busca: C(45, 5) ≈ 1,2 milhão de combinações, rápido o bastante no aparelho. */
const MAX_POOL = 45;
```

A mesma função `computeTeamScore` existe no backend, que é quem salva o valor oficial. No app ela serve para o preview ao trocar titulares.

### Catálogo offline, progresso online

O catálogo de 1.000 jogadores vem num `.json.gz` embutido no app e é importado para SQLite na primeira abertura. A coleção abre na hora, com busca e filtros, sem rede. O app sincroniza a versão do catálogo a cada 6 horas e o progresso das cartas (quantas cópias já foram encontradas) a cada minuto.

### Um trade-off assumido

As regras que o app precisa conhecer (energia máxima, custo do radar, tabelas de bônus) estão **duplicadas** em `lib/game/rules.ts`, espelhando o backend. Funciona porque o servidor é sempre quem decide, então o pior caso de divergência é um preview errado, nunca uma regra burlada. Mesmo assim, é uma fonte de bug silenciosa. A correção certa é uma rota `/config` que o app lê ao iniciar, e ela está na lista de próximos passos.

## Como Rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) 20 ou superior
- [Docker](https://www.docker.com/) (para o PostgreSQL)
- [Xcode](https://developer.apple.com/xcode/) (iOS, apenas em macOS) ou [Android Studio](https://developer.android.com/studio)
- Uma chave do [Google Maps Platform](https://developers.google.com/maps)

### 1. Backend

O backend é o [go-rocket-league-backend](https://github.com/rocketseat-education/go-rocket-league-backend), da Rocketseat, e não faz parte deste repositório. Ele precisa de um PostgreSQL e de um `.env` com pelo menos `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` e `ADMIN_API_TOKEN`.

```bash
node --env-file=.env src/server.js
```

O Colyseus é dono da porta 3000 e repassa as requisições HTTP ao Fastify.

### 2. Base de jogadores

**Este repositório não inclui nenhuma base de jogadores nem fotos.** O app espera o arquivo `mobile/Kartazapp/assets/data/players-initial.json.gz`, que está no `.gitignore`. Para gerá-lo:

1. Importe os jogadores no backend pela rota admin `POST /admin/players/import-csv`, usando um CSV que você tenha direito de usar.
2. Gere a versão exportada: `POST /admin/players/generate-version`.
3. Copie para o app, a partir de `mobile/Kartazapp`: `npm run seed:copy`.

Mais detalhes em [`mobile/Kartazapp/assets/data/README.md`](mobile/Kartazapp/assets/data/README.md).

### 3. App

```bash
cd mobile/Kartazapp
npm install
cp .env.example .env.local   # preencha as variáveis
npx expo run:ios --device    # ou: npx expo run:android
```

| Variável | Para que serve |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Chave do Google Maps |
| `EXPO_PUBLIC_API_BASE_URL` | Endereço do backend. Em desenvolvimento, `localhost` é trocado sozinho pelo IP do computador, para funcionar no celular |
| `EXPO_PUBLIC_ADMIN_API_KEY` | Igual ao `ADMIN_API_TOKEN` do backend. **Só para desenvolvimento**: variáveis `EXPO_PUBLIC_*` vão embutidas no app |
| `EXPO_PUBLIC_PLAYER_IMAGE_BASE_URL` | Opcional. Servidor de fotos (`<base>/p<id>.webp`). Sem valor, as cartas mostram o fundo padrão. **Use apenas imagens que você tenha direito de usar** |
| `EXPO_PUBLIC_H3_RES_USER_CELL` / `EXPO_PUBLIC_H3_RES_ROOM_CELL` | Resoluções H3 (padrão 9 e 8), iguais às do backend |

O projeto usa build nativo (`expo run:*`), não Expo Go. As pastas `ios/` e `android/` são geradas: para aplicar mudanças do `app.config.ts`, apague a pasta e rode o build de novo. O app foi testado em iPhone com **conta gratuita da Apple**, por isso usa apenas notificações locais (sem push remoto).

## Arquitetura em Detalhe

### MVVM em todas as telas

As rotas em `src/app/` têm uma linha só e reexportam a tela:

```tsx
// src/app/(tabs)/map.tsx — o arquivo inteiro
export { default } from '@/screens/map';
```

Cada tela em `src/screens/<tela>/` é um trio:

- **`use-view-model.ts`:** estado, queries, mutations, regras, navegação e handlers. Sem JSX.
- **`view.tsx`:** só UI. Recebe tudo por props; não chama API, `router` nem `toast`.
- **`index.tsx`:** `const vm = useXViewModel(); return <XView {...vm} />`.

Componentes com lógica própria (modal de pack, modal de abastecer, filtros da coleção, card de proposta de troca, botões de login social) seguem o mesmo trio numa pasta. Componentes só visuais ficam num arquivo. O view model do mapa, que é o maior do app, foi dividido em hooks menores.

### Sala em tempo real como hook

`hooks/use-cell-room/` concentra tudo que é Colyseus:

| Arquivo | Responsabilidade |
|---|---|
| `use-cell-room.ts` | Conexão, handoff entre salas, reconexão com backoff (1 s → 15 s) e saída em segundo plano |
| `use-room-state.ts` | Estado visível da sala, com assinaturas para evitar re-render |
| `room-messages.ts` | Mensagens do servidor (pack, coleta, troca aceita, movimento recusado) |

As funções puras ficam em `lib/colyseus/cell-state.ts`. Pedidos com resposta (radar, compra de energia) passam por `room-request.ts`, um por vez, presos à sala em que foram enviados e com timeout de 10 s.

### Explore Mode

O Explore Mode liga com zoom ≥ 18. Só então o app conecta na sala, e arrastar o mapa vira andar: a posição do jogador é o centro da tela, e a distância andada gasta energia e dá XP no servidor. Com o zoom afastado, o mapa é livre, sem dados e sem gastar energia. Sem energia, o servidor responde `moveRejected` e o mapa volta para a última posição aceita.

### Nada de cor ou número solto

- **Cores** só de `src/theme/`. `base-colors.json` é lido pelo tema e pelo `app.config.ts` (splash e ícone Android), então o fundo é o mesmo da abertura até as telas.
- **`game-colors.ts`:** cores por raridade, classe de série, status de troca e dificuldade da área.
- **`lib/game/rules.ts`:** regras espelhadas do backend.
- **`lib/query/config.ts`** e **`lib/storage/keys.ts`:** `staleTime`, tamanho de página, debounce de busca e chaves do SecureStore.

<details>
<summary><b>Raridade e classe de série: dois eixos independentes</b></summary>

A **raridade** vem do jogador (overall): lendária ≥ 90, épica ≥ 87, rara ≥ 84, senão comum. A **classe de série** vem da cópia: a nº 1 e a última são **extreme** (dourada), as primeiras até max(3, 1% da tiragem) são **elite** (roxa), e o resto é **standard** (azul).

Por isso uma carta comum `1 / 1000` também é especial. A classe é calculada no servidor e define a borda, o selo e o brilho do `CardReveal`, o componente da carta virada com giro 3D.

</details>

<details>
<summary><b>Trocas atômicas</b></summary>

Uma proposta é N cartas minhas por M cartas de outro jogador, sem moeda, e passa pelos status `PENDING`, `ACCEPTED`, `DECLINED` e `CANCELLED`. Titulares não podem ser oferecidos.

O aceite troca todos os donos numa única transação. Quem propôs é avisado pela sala (`tradeAccepted` via `sendToUser`) e, se o app estava fechado, ele confere as trocas aceitas ao voltar, com um marcador de "visto" no SecureStore para não notificar duas vezes.

</details>

<details>
<summary><b>Packs liberados por movimento</b></summary>

O pack de boas-vindas (5 cartas, cria o time) e o diário (2 cartas a cada 24 h) não chegam ao entrar na sala, e sim **depois de andar 10 metros**. Assim o pack nunca aparece por cima da animação de entrada do mapa, e quem só abre o app sem jogar não recebe nada. O modal revela carta por carta.

</details>

<details>
<summary><b>Notificações sem push remoto</b></summary>

O plugin `expo-notifications` no `app.json` liga o entitlement `aps-environment`, que quebra o build numa conta gratuita da Apple. O `app.config.ts` tem um plugin próprio, `withoutRemotePush`, que remove essa permissão ao gerar o projeto iOS. O app usa apenas notificações locais.

</details>

<details>
<summary><b>Toast próprio</b></summary>

O sistema de toast tem variantes e gestos: arrastar para os lados ou para cima dispensa, puxar para baixo fixa. O estado fica numa store mínima em `lib/toast/`, chamada pelos view models e nunca pelas views.

</details>

## Estrutura do Projeto

```
Kartaz/
├── mobile/Kartazapp/          # App Expo
│   └── src/
│       ├── app/               # Rotas do Expo Router: (tabs), card/[id], trades/new...
│       ├── screens/           # Telas em MVVM (view model + view + index)
│       ├── components/        # Por domínio (cards, map, hud, team, trades...) e ui/
│       ├── hooks/             # queries/ (React Query), use-cell-room/ (Colyseus)
│       ├── lib/               # api, auth, colyseus, db (SQLite), game, h3, sync, team...
│       ├── theme/             # Cores, espaçamento, motion e estilos do mapa
│       └── i18n/              # pt, en, es
├── UI_REACT_para_referencia/  # Protótipo de interface usado como referência visual
├── Como_jogar.md / How_To_Play.md
└── LICENSE
```

O backend (`backend/`) é o projeto da Rocketseat e está no `.gitignore` deste repositório.

## Funcionalidades

- **Login** como convidado, com Google ou com Apple, e vínculo de conta depois
- **Onboarding** em carrossel na primeira abertura
- **Mapa multiplayer** com salas por hexágono, "Perto" (jogadores na área e vizinhas) e handoff entre salas
- **Explore Mode**: andar arrastando o mapa, com energia e XP calculados no servidor
- **Cartas no mapa** com sorteio determinístico por área a cada 15 minutos
- **Moedas e baterias** com coleta automática ao passar por cima
- **Bandeiras de descoberta**: o primeiro a chegar vira dono da área e ganha XP
- **Radar** pago com energia, que revela todas as cartas da área
- **Packs** de boas-vindas e diário, revelados carta por carta
- **Curva de nível** com nível derivado do XP
- **Coleção** offline em grade, lista ou por seleção, e **Minha Coleção** com filtros
- **Detalhe da carta** com estatísticas animadas, dados da cópia e descoberta global
- **Time de 5 titulares** com bônus de seleção e clube e escalação automática
- **Trocas N × M** com aceite atômico e notificação local
- **Perfil** com avatar, bio e estatísticas
- **i18n** em português, inglês e espanhol

## Próximos Passos

Lacunas conhecidas e ideias para o futuro:

- **Batalhas PvP entre jogadores.** O backend já tem a base (`BattleChallenge`, rotas `/battles` e `/battle-tiers`, configuração de batalha do time), mas o app ainda não tem tela. A ideia é desafiar outro jogador da mesma área e comparar os times, com o overall e a química decidindo o resultado e moedas ou XP como recompensa.
- **Validação de velocidade no servidor.** Hoje o servidor cobra energia pela distância, mas não limita a velocidade entre um movimento e outro. Um limite em metros por segundo impede atravessar salas rápido demais (com script ou com o dedo) para coletar itens, o que é essencial antes de abrir o jogo para mais pessoas.
- **Testes.** As funções puras (`cell-state`, `room-request`, `team-scoring`, `player-row-mapper`) já estão prontas para Jest com `jest-expo`.
- **Rota `/config`.** O backend manda as regras de jogo ao app, eliminando a duplicação em `lib/game/rules.ts`.
- **Conquistas e estatísticas reais.** Parte dos números do perfil e da aba Conquistas ainda é mock.
- **Missões diárias**, como fonte de energia e moedas para quem não tem bateria por perto, já que a recarga por tempo está desligada.
- **Ranking de times** no app. O backend já tem `/teams/leaderboard`.
- **Regras de negócio em `services/`** no backend, tirando a lógica que ainda está em `teamRoutes.js` e `userRoutes.js`.
- **Build Android** atualizado e distribuível.

## Aviso legal

- **Sem fins lucrativos, apenas didático.** Kartaz é um projeto de estudo e portfólio. Como usa nomes e imagens derivadas de fotos de **pessoas reais**, não é vendido, não tem anúncios nem compras reais, não gera receita e não será publicado em lojas de aplicativos. As "moedas" do jogo são fictícias.
- **Imagens.** As fotos dos jogadores são estilizadas com o modelo AnimeGANv2, cuja licença também é de uso não comercial. Nenhuma foto, original ou estilizada, está neste repositório.
- **Sem afiliação.** Este projeto **não é afiliado, patrocinado nem endossado** pela Electronic Arts (EA), EA SPORTS FC, FIFA, FIFPRO, nenhuma liga, nenhum clube, nenhuma seleção nem nenhum jogador.
- **Marcas e nomes.** Nomes de jogadores, clubes, seleções e competições pertencem aos respectivos titulares e aparecem aqui só para identificar os elementos do jogo, sem sugerir parceria.
- **Dados não são distribuídos.** Este repositório **não contém** a base de jogadores (nomes, avaliações, atributos). Quem rodar o projeto é responsável por usar apenas dados e imagens que tenha direito de usar.
- **Remoção de conteúdo.** Se você é titular de algum direito e quer que algo seja removido ou ajustado, abra uma [issue](https://github.com/EnzoFelyx/Kartaz/issues) que eu atendo prontamente.

## Créditos

**[Rocketseat](https://www.rocketseat.com.br)**, pelo curso e pelo projeto **Go Rocket League**, base deste trabalho:

- O backend [go-rocket-league-backend](https://github.com/rocketseat-education/go-rocket-league-backend), usado por este app.
- Do projeto mobile das aulas, foram portados e adaptados: a base local SQLite (`src/lib/db`) e a importação inicial (`src/lib/sync/seedFromBundle.ts`), a sincronização com o servidor (`src/lib/sync/players-sync.ts`), o card do modo grade, a arte da carta com o brilho de carregamento, a animação de entrada da tela de detalhes e o mapeamento de países para bandeiras em emoji (`src/utils/flags.ts`).
- Imagens de fundo das cartas: `assets/images/bg-card.png` e `assets/images/bg-card-details.png`.

**Protótipo de interface:** criado no [Figma Make](https://www.figma.com/make/) (pasta `UI_REACT_para_referencia`) e usado como referência visual.

**Mapa:** [Google Maps Platform](https://developers.google.com/maps), via `react-native-maps`, sujeito aos [Termos de Serviço do Google Maps](https://cloud.google.com/maps-platform/terms).

**Grade geográfica:** [H3](https://h3geo.org/), da Uber (Apache-2.0).

**Bandeiras:** emojis do padrão Unicode, exibidos com a fonte do sistema.

As bibliotecas usadas (Expo, React Native, TanStack Query, Reanimated, Gesture Handler, Skia, react-native-svg, react-native-maps, i18next, pako, Colyseus, Fastify) são MIT; Prisma e h3-js são Apache-2.0. Cada uma continua sob a sua própria licença. Os arquivos do modelo inicial do `create-expo-app` seguem sob a licença MIT da Expo, em [`mobile/Kartazapp/LICENSE-expo-template`](mobile/Kartazapp/LICENSE-expo-template).

## Licença

**© 2026 Enzo Felix.** Código licenciado sob a [licença MIT](LICENSE): você pode usar, copiar e modificar, **desde que mantenha o aviso de copyright e o texto da licença**. A licença vale apenas para o trabalho original do autor. O conteúdo de terceiros listado em [Créditos](#créditos) e os nomes, marcas, dados e imagens de jogadores, clubes e competições não são cobertos por ela.

## Autor

**Enzo Felix** — Mobile Developer

[GitHub](https://github.com/EnzoFelyx) · [LinkedIn](https://www.linkedin.com/in/enzofelyx/) · [enzofelyx@gmail.com](mailto:enzofelyx@gmail.com)

---

Desenvolvido a partir do projeto Go Rocket League, da [Rocketseat](https://www.rocketseat.com.br/).
