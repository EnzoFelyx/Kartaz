# Kartaz

Jogo mobile de exploração de mapa com cartas colecionáveis de futebol. O jogador navega por um mapa-múndi virtual, encontra cartas numeradas de jogadores, monta a sua coleção e acompanha quantas cópias de cada carta já foram encontradas no mundo.

Projeto de estudo e portfólio, feito com React Native (Expo) e um backend Node.js.

**© 2026 Enzo Felix ([@EnzoFelyx](https://github.com/EnzoFelyx)).** Código aberto sob a licença [MIT](LICENSE): pode usar e modificar, desde que **mantenha os créditos ao autor**. Veja [Licença e autoria](#licença-e-autoria).

> ⚠️ **Projeto sem fins comerciais e sem vínculo oficial.** Leia o [Aviso legal](#aviso-legal) antes de usar ou redistribuir qualquer parte deste repositório.

---

## Funcionalidades

- **Catálogo de cartas** em grade, lista e por seleção, com busca e paginação. Os dados vêm de um banco SQLite local, então o catálogo abre na hora e funciona offline.
- **Detalhes da carta**: atributos, cartas similares, cópia do usuário (serial, data e local da coleta) e descoberta global (quantas cópias já foram encontradas).
- **Minha coleção** e **cópias encontradas**, consumindo a API com paginação, sessão de convidado e renovação automática do token.
- **Sincronização** da base local com o servidor (versão da base e progresso das cartas), feita em segundo plano.
- Mapa com Google Maps, HUD de combustível e radar, e interface em português, inglês e espanhol.

## Tecnologias

| Parte | Principais tecnologias |
|---|---|
| App (`mobile/Kartazapp`) | Expo SDK 57, React Native, Expo Router, TanStack Query, expo-sqlite, Reanimated, React Native Skia, react-native-svg, react-native-maps, i18next |
| Backend (não incluído neste repositório) | Node.js, Fastify, Colyseus, Prisma, PostgreSQL |

## Estrutura

```
mobile/Kartazapp/          App Expo (código em src/, assets em assets/)
UI_REACT_para_referencia/  Protótipo de interface (React + Vite) usado como referência visual
PROJECT_CONTEXT.md         Regras de jogo e decisões do projeto
```

---

## Como rodar

### 1. Backend

O app usa o backend **Go Rocket League**, da Rocketseat ([rocketseat-education/go-rocket-league-backend](https://github.com/rocketseat-education/go-rocket-league-backend)). Ele não está neste repositório: siga o README do projeto original para instalar e rodar, com um PostgreSQL e um `.env` contendo pelo menos `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` e `ADMIN_API_TOKEN`.

### 2. Base de jogadores

**Este repositório não inclui nenhuma base de jogadores.** O app espera o arquivo `mobile/Kartazapp/assets/data/players-initial.json.gz`, que fica no `.gitignore`. Para gerá-lo:

1. Importe os jogadores no backend pela rota admin `POST /admin/players/import-csv`, usando um CSV que você tenha direito de usar.
2. Gere a versão exportada: `POST /admin/players/generate-version`. O backend cria `data/versions/players-<versão>.json.gz`.
3. Copie para o app, a partir de `mobile/Kartazapp`: `npm run seed:copy`.

Mais detalhes em [`mobile/Kartazapp/assets/data/README.md`](mobile/Kartazapp/assets/data/README.md).

### 3. App

```bash
cd mobile/Kartazapp
npm install
cp .env.example .env.local   # preencha as variáveis
npx expo run:ios             # ou: npx expo run:android
```

Variáveis do `.env.local`:

| Variável | Para que serve |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Chave do Google Maps (mapa) |
| `EXPO_PUBLIC_API_BASE_URL` | Endereço do backend. Em desenvolvimento, `localhost` é trocado sozinho pelo IP do computador, para funcionar no celular |
| `EXPO_PUBLIC_ADMIN_API_KEY` | Igual ao `ADMIN_API_TOKEN` do backend. **Só para desenvolvimento**: variáveis `EXPO_PUBLIC_*` vão embutidas no app |
| `EXPO_PUBLIC_PLAYER_IMAGE_BASE_URL` | Opcional. Servidor de fotos dos jogadores (`<base>/p<id>.webp`). Sem valor, as cartas mostram o fundo padrão. **Use apenas imagens que você tenha direito de usar** |

---

## Aviso legal

- **Sem fins comerciais.** Kartaz é um projeto de estudo e portfólio. Não é vendido, não tem anúncios nem compras e não gera receita.
- **Sem afiliação.** Este projeto **não é afiliado, patrocinado nem endossado** pela Electronic Arts (EA), EA SPORTS FC, FIFA, FIFPRO, nenhuma liga, nenhum clube, nenhuma seleção nem nenhum jogador.
- **Marcas e nomes.** Nomes de jogadores, clubes, seleções e competições, além de marcas como EA SPORTS FC e FIFA, pertencem aos respectivos titulares. Aparecem aqui só para identificar os elementos do jogo, sem sugerir parceria.
- **Dados e imagens não são distribuídos.** Este repositório **não contém** a base de jogadores (nomes, avaliações, atributos) nem fotos de jogadores, e o código não aponta para nenhuma fonte de imagens de terceiros. Quem rodar o projeto é responsável por usar apenas dados e imagens que tenha direito de usar.
- **Material do curso.** Partes do projeto vêm do material do curso da Rocketseat (veja [Créditos](#créditos)) e continuam pertencendo aos seus autores.
- **Remoção de conteúdo.** Se você é titular de algum direito e quer que algo seja removido ou ajustado, abra uma [issue](https://github.com/EnzoFelyx/Kartaz/issues) que eu atendo prontamente.

## Créditos

**Autor:** Enzo Felix ([@EnzoFelyx](https://github.com/EnzoFelyx)). Concepção, design do jogo e desenvolvimento do app Kartaz.

**[Rocketseat](https://www.rocketseat.com.br)**, pelo curso e pelo projeto **Go Rocket League**, base deste trabalho:
- Backend [go-rocket-league-backend](https://github.com/rocketseat-education/go-rocket-league-backend) (API, autenticação, cartas e sincronização), não incluído neste repositório. Usado com uma pequena modificação local: sync incremental do progresso das cartas.
- Projeto mobile das aulas, do qual foram portados e adaptados:
  - a base local SQLite (`src/lib/db`) e a importação inicial (`src/lib/sync/seedFromBundle.ts`);
  - a sincronização com o servidor (`src/lib/sync/players-sync.ts`);
  - o card do modo grade, a arte da carta com o brilho de carregamento e a animação de entrada da tela de detalhes;
  - o mapeamento de nomes de países para bandeiras em emoji (`src/utils/flags.ts`).
- Imagens de fundo das cartas: `assets/images/bg-card.png` e `assets/images/bg-card-details.png`.

**Protótipo de interface:** criado no [Figma Make](https://www.figma.com/make/) (pasta `UI_REACT_para_referencia`) e usado como referência visual.

**Bandeiras:** emojis do padrão Unicode, exibidos com a fonte do sistema.

**Mapa:** [Google Maps Platform](https://developers.google.com/maps), via `react-native-maps`, sujeito aos [Termos de Serviço do Google Maps](https://cloud.google.com/maps-platform/terms). A atribuição do Google aparece no próprio mapa.

### Bibliotecas de código aberto

O app foi criado com `create-expo-app` e usa, entre outras:

| Biblioteca | Licença |
|---|---|
| [Expo](https://github.com/expo/expo) e módulos `expo-*` (router, sqlite, image, secure-store…) | MIT |
| [React Native](https://github.com/facebook/react-native) | MIT |
| [TanStack Query](https://github.com/TanStack/query) | MIT |
| [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) e [Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) | MIT |
| [React Native Skia](https://github.com/Shopify/react-native-skia) | MIT |
| [react-native-svg](https://github.com/software-mansion/react-native-svg) | MIT |
| [react-native-maps](https://github.com/react-native-maps/react-native-maps) | MIT |
| [i18next](https://github.com/i18next/i18next) e [react-i18next](https://github.com/i18next/react-i18next) | MIT |
| [pako](https://github.com/nodeca/pako) | MIT e Zlib |

O backend da Rocketseat usa, entre outras, Fastify (MIT), Colyseus (MIT), Prisma (Apache-2.0) e PostgreSQL (PostgreSQL License).

Cada biblioteca continua sob a sua própria licença. Os arquivos do modelo inicial do `create-expo-app` seguem sob a licença MIT da Expo, em [`mobile/Kartazapp/LICENSE-expo-template`](mobile/Kartazapp/LICENSE-expo-template).

---

## Licença e autoria

**© 2026 Enzo Felix.** Licenciado sob a [licença MIT](LICENSE).

Kartaz (código, design de jogo, regras, textos e interface) foi criado por **Enzo Felix** ([@EnzoFelyx](https://github.com/EnzoFelyx)). Você pode usar, copiar, modificar e distribuir este código, inclusive em projetos comerciais, **desde que mantenha o aviso de copyright e o texto da licença MIT** em todas as cópias ou partes substanciais. Se usar este projeto como base, um link para este repositório é muito bem-vindo.

A licença MIT vale apenas para o trabalho original do autor. O conteúdo de terceiros listado em [Créditos](#créditos) (material da Rocketseat, modelo do Expo, bibliotecas e nomes, marcas e dados de jogadores, clubes e competições) não é coberto por ela e continua pertencendo aos seus titulares.

Texto completo em [`LICENSE`](LICENSE).
