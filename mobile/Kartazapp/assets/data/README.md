# Base inicial de jogadores (bundled)

O app vem **de fábrica** com a base de jogadores já populada. O arquivo que faz isso é:

- **`players-initial.json.gz`** — NDJSON compactado (gzip), mesmo formato exportado pelo backend.

**Importante:** este arquivo precisa existir nesta pasta para o app compilar (o Metro inclui o asset no bundle). Se ainda não tiver o arquivo, use um dos métodos abaixo.

## Como gerar / obter o arquivo

1. No backend, após importar o CSV (ou quando quiser “congelar” a base para o app):
   - A rota admin gera automaticamente o arquivo em `data/versions/players-<version>.json.gz`.
2. Copie para esta pasta com o nome fixo `players-initial.json.gz`:
   ```bash
   # a partir da raiz do Kartaz (ajuste versão conforme o backend)
   cp backend/data/versions/players-1.json.gz mobile/Kartazapp/assets/data/players-initial.json.gz
   ```
   Ou, a partir da pasta do app:
   ```bash
   npm run seed:copy
   ```
   (O script `seed:copy` tenta copiar do backend; ajuste o caminho no `package.json` se precisar.)

Ou use o script do backend (se existir) que exporta a versão atual e coloque o resultado aqui.

## Comportamento no app

- **Primeira abertura**: se a versão local for 0, o app importa os dados deste arquivo para o SQLite e marca a versão como 1.
- **Depois**: o sync periódico chama a API e, se existir versão mais nova no servidor, baixa e atualiza a base local.

Assim o app funciona offline desde o primeiro uso e depois se mantém atualizado quando houver rede.
