# GoRocketLeague — Contexto do Projeto

> Documento de referência para a IA do editor de código. Descreve o produto, as regras de jogo, as decisões já tomadas e o que ainda está em aberto.
> **Parte visual:** o código HTML/React exportado do Figma, importado neste workspace, é a **fonte da verdade para layout, cores, tipografia e componentes**. Este documento cobre o comportamento, as regras e a arquitetura.

---

## 1. Visão geral

GoRocketLeague é um jogo mobile de exploração de mapa, no estilo Pokémon GO, **sem AR** e **sem exigir deslocamento físico**. O jogador navega virtualmente por um mapa-múndi, encontra cartas colecionáveis de jogadores das seleções da Copa do Mundo 2026, monta sua coleção e troca cartas com outros jogadores.

- Plataforma: React Native (iOS e Android).
- Tema: futebol + foguete + exploração espacial.
- Idioma da UI no protótipo: inglês.

### Números base
| Item | Valor |
|---|---|
| Seleções | 48 |
| Jogadores | ~1.250 |
| Cópias por jogador | 1.000, numeradas (ex.: `400/1000`) |
| Total de cartas | ~1.250.000 |
| Raio de ação por carta | 200 m a 1 km |

Cada carta é **única**: jogador + número serial. Uma carta tem no máximo um dono por vez.

---

## 2. Escopo do MVP

**O MVP é o sistema completo, com parâmetros controlados.** Não dividir em fases de funcionalidade.

Entra no MVP:
- Mapa global com cartas distribuídas apenas em terra firme
- Descoberta por raio + zoom
- Cartas únicas serializadas das 48 seleções
- Coleção organizada por seleção
- Trocas entre jogadores
- XP, nível, conquistas e troféus
- Rocket Fuel (custo de navegação) e teleporte entre zonas
- Missões diárias simples

Fora do MVP:
- Monetização de qualquer tipo (a arquitetura deve permitir, mas desligada)
- Marketplace com moeda, leilões
- Eventos sazonais complexos
- Cartas animadas / VFX avançados
- Ranqueadas, clãs

**Ambiente de desenvolvimento:** usa-se um território pequeno com poucas cartas para testes. O algoritmo de distribuição é o **mesmo** de produção; muda apenas a configuração (área, quantidade, pesos).

---

## 3. Regras de jogo

### 3.1 Descoberta de cartas
- Uma carta só é detectável quando o **centro da visão do mapa está dentro do raio da carta** e o **zoom está no nível exigido** por aquela carta.
- Fluxo: sinal sutil no mapa → carta detectável pulsando (sem revelar o jogador) → painel "Unknown card detected" → **Scan Area** → animação de scan e revelação → **Collect Card**.
- A revelação mostra: jogador, seleção, serial, raridade, Fuel gasto e XP ganho.

### 3.2 Distribuição e spawn
- **A localização física não é o eixo do jogo.** A densidade de cartas acompanha o **interesse dos jogadores no mapa virtual**, não a população real.
- O mundo é dividido em **células** (geohash ou quadtree, a definir). Cada célula mantém métricas:
  ```ts
  type Cell = {
    cellId: string;
    activeCards: number;
    collectedLastHour: number;
    visitsLastHour: number;
    heatScore: number; // navegação, zooms, coletas, tempo parado
  };
  ```
- Modelo híbrido de spawn (valores iniciais, ajustáveis): ~60% em células de interesse médio, ~25% em células frias (incentivo à exploração), ~15% em células quentes.
- Cartas nascem em **clusters de 3 a 10**, com raios e zooms variados.
- Nem todas as cartas existem no mapa ao mesmo tempo. Existe um **pool global**; só uma parte fica ativa (ex.: 50k–150k). Cartas não coletadas podem **expirar e voltar ao pool**. Liberação em ondas para o mapa não esvaziar.
- Todos os parâmetros de balanceamento ficam **no servidor**, ajustáveis sem update do app.

### 3.3 Rocket Fuel e navegação
- Mover o mapa consome **Fuel**. O Fuel também funciona como proteção contra varredura sistemática do mapa.
- **Navegação local** (arrastar/scroll): consumo proporcional à distância virtual (valor inicial: 1 fuel ≈ 2 km).
- **Teleporte entre zonas**, custo fixo (valores iniciais): mesmo país 10, entre países 25, entre continentes 50. Teleporte **não revela cartas**.
- Recarga (sem pagamento):
  - Regeneração passiva (inicial: máx. 100, +1 a cada 5 min)
  - Recompensas de gameplay (coletar carta, completar seleção, conquistas)
  - 2–3 missões diárias simples (coletar, trocar, explorar) → Fuel + XP
  - Capacidade máxima de Fuel cresce com o nível
- Estado sem Fuel: mensagem "Not enough fuel to launch your rocket" e indicação de recarga.

### 3.4 Trocas
- Troca direta **1x1 ou NxN**, sem moeda, sem leilão.
- Cartas oferecidas ficam **bloqueadas (escrow)** enquanto a proposta está aberta; não podem estar em duas propostas ao mesmo tempo.
- Aceitação troca os donos em **uma única transação atômica**.
- Cooldown por troca. Notificação ao criador quando a proposta é aceita ou recusada.

### 3.5 Progressão
- XP por coleta, trocas, missões e conquistas; nível derivado do XP.
- Conquistas com progresso (ex.: First Card, Complete a Nation, Legendary Hunter), recompensando XP + Fuel.
- Coleção mostra progresso por seleção (ex.: `12/26`).

### 3.6 Localização física (feature secundária, opcional)
- O jogador pode ativar localização em background e receber **notificação** ao entrar fisicamente no raio de uma carta. Não é mecânica central e fica desligada por padrão.

---

## 4. Estrutura do app

Navegação principal com bottom tabs:

```
[ Map ] [ Collection ] [ Trades ] [ Achievements ] [ Profile ]
```

| Tela | Resumo |
|---|---|
| Splash / Loading | Logo, animação de foguete, carrega estado do jogador |
| Onboarding | 3 passos: Explore, Collect, Fuel & Rocket → "Start Exploration" |
| **Map** (principal) | Mapa fullscreen dark; HUD com Fuel, XP/Level, notificações; sinais de cartas; painel de detecção + Scan Area |
| Card Reveal (modal) | Scan, carta vira, revela dados, Collect Card |
| Collection | Abas All Cards / By Nation / Rarity; progresso por seleção |
| Card Details | Carta em destaque, serial, data de coleta; Offer Trade, Favorite |
| Trades | Abas Open Trades / My Trades |
| Create Trade | Escolher cartas oferecidas → cartas desejadas → confirmar |
| Achievements | Lista com progresso e recompensas |
| Profile | Avatar, nickname, nível, estatísticas; configurações (notificações, localização, tema) |

Estados obrigatórios: coleção vazia, sem Fuel, loading animado (scan, foguete, radar), erros de rede.

Identidade visual: dark mode padrão; verde/amarelo (futebol) + azul/roxo (espaço); visual de jogo mobile. Detalhes exatos: seguir o código do design importado.

---

## 5. Princípios de arquitetura (obrigatórios)

1. **Servidor autoritativo.** Descoberta, coleta, consumo de Fuel, trocas, XP e conquistas são decididos e validados no backend. O app só exibe e envia intenções.
2. **O cliente nunca recebe coordenadas de cartas.** O app envia centro da visão + zoom; o servidor responde apenas o que é detectável naquele ponto, ou sinais agregados (calor por região) sem posição exata.
3. **Validação de navegação no servidor:** consumo de Fuel, zoom mínimo, tamanho máximo da viewport, rate limit e detecção de deslocamentos impossíveis entre requisições.
4. **Coleta atômica:** duas pessoas não podem coletar a mesma carta (ex.: `UPDATE ... WHERE owner_id IS NULL`).
5. **Configuração remota** para todos os números de balanceamento (spawn, Fuel, cooldowns, XP).
6. **Logs e métricas desde o início** (coletas, navegação, trocas, uso de Fuel) para balancear.
7. **Monetização preparada, não implementada:** modelar Fuel e boosts de forma que itens pagos possam ser adicionados depois, sem nenhum fluxo de pagamento no MVP.
8. **Edição/temporada como entidade.** A Copa 2026 terminou em 19/07/2026; o produto é a coleção da Copa 2026, mas o modelo deve suportar edições futuras.

---

## 6. Modelo de dados (rascunho)

Entidades principais, sujeitas a revisão:

- `editions` — edição/temporada (ex.: World Cup 2026)
- `nations` — seleções (edition_id, nome, código, bandeira)
- `players` — jogadores (nation_id, nome, posição, número)
- `cards` — cópias únicas (player_id, serial 1–1000, rarity, status: `pool | active | collected | expired`, geom, radius_m, required_zoom, owner_id, spawned_at, expires_at)
- `card_ownership_history` — histórico de donos
- `cells` — métricas por célula (ver seção 3.2)
- `users` / `profiles` — nickname, avatar, xp, level, fuel, fuel_max, fuel_updated_at, settings
- `fuel_events` — gastos e ganhos de Fuel
- `trade_offers` — criador, status (`open | accepted | declined | cancelled | expired`), timestamps
- `trade_items` — cartas oferecidas e pedidas de cada proposta
- `achievements` / `user_achievements`
- `missions` / `user_missions` — missões diárias
- `xp_events`
- `game_config` — parâmetros de balanceamento

---

## 7. Stack técnica

| Camada | Status |
|---|---|
| App em React Native | **Decidido** |
| Expo | Proposta, a confirmar |
| Mapa: MapLibre (`@maplibre/maplibre-react-native`) ou `react-native-maps` | Proposta, a confirmar |
| Navegação: React Navigation (bottom tabs + stacks + modal) | Proposta, a confirmar |
| Backend: Supabase (Postgres + PostGIS, Auth, Realtime, Edge Functions) ou Node/NestJS + Postgres/PostGIS | Proposta, a confirmar |
| Consultas geográficas com PostGIS (`ST_DWithin`, índice GiST) | Proposta |

Enquanto não houver confirmação, não assumir a stack da coluna "Proposta"; perguntar antes de adicionar dependências estruturais.

---

## 8. Pendências

- Modelo matemático de consumo de Fuel e estados do jogador (idle, moving, teleport)
- Números finais de spawn: células, densidade, thresholds, tamanho do pool ativo
- Relação raridade × raio × zoom
- Definição de raridade (se todas as cartas têm 1.000 cópias, o que torna uma mais rara)
- Geohash vs quadtree/grid fixo
- Schema final do banco e anti-cheat detalhado
- **Licenciamento:** nomes e imagens de jogadores, escudos e marcas FIFA/World Cup são protegidos. Até haver definição, usar dados de exemplo/placeholder e não embutir marcas oficiais no código.

---

## 9. Orientações para a IA do editor

- Seguir o design importado para qualquer decisão visual; não inventar novos estilos.
- Componentes em TypeScript, funcionais, reutilizáveis; tokens de cor/tipografia centralizados a partir do design.
- Nunca implementar lógica de jogo sensível apenas no cliente (ver seção 5).
- Números de balanceamento vêm de configuração, nunca hardcoded em telas.
- Usar dados mockados realistas enquanto o backend não existir, com a mesma forma dos contratos da API.
- Em caso de dúvida sobre regra de jogo não coberta aqui, perguntar em vez de assumir.
