import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { inflate } from 'pako';
import {
  initPlayersDb,
  getLocalPlayersVersion,
  setLocalPlayersVersion,
  upsertPlayers,
} from '@/lib/db/playersDb';
import type { PlayerRow } from '@/types/player';

const BATCH_SIZE = 500;

/** Versão atribuída após importar o bundle (depois o sync do servidor pode atualizar). */
export const BUNDLED_VERSION = 1;

/**
 * Carrega o arquivo NDJSON gzip embutido no app (assets/data/players-initial.json.gz),
 * descompacta, importa no SQLite e define a versão local como BUNDLED_VERSION.
 * Só faz algo se a versão local for 0.
 * Retorna true se importou, false se já tinha dados ou se falhou.
 */
export async function seedFromBundleIfNeeded(): Promise<{
  seeded: boolean;
  imported: number;
  error?: string;
}> {
  initPlayersDb();
  if (getLocalPlayersVersion() !== 0) {
    return { seeded: false, imported: 0 };
  }

  try {
    const asset = Asset.fromModule(
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- asset precisa de require para o Metro empacotar
      require('../../../assets/data/players-initial.json.gz')
    );
    await asset.downloadAsync();
    if (!asset.localUri) {
      return { seeded: false, imported: 0, error: 'Asset has no localUri' };
    }

    const file = new FileSystem.File(asset.localUri);
    const base64 = await file.base64();
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const inflated = inflate(bytes);
    const text = new TextDecoder('utf-8').decode(inflated);
    const lines = text.split('\n').filter((line) => line.trim());
    const rows: PlayerRow[] = [];
    for (const line of lines) {
      try {
        const row = JSON.parse(line) as PlayerRow;
        if (row && typeof row.id === 'number') {
          rows.push(row);
        }
      } catch {
        // skip invalid lines
      }
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      upsertPlayers(batch);
    }

    setLocalPlayersVersion(BUNDLED_VERSION);
    return { seeded: true, imported: rows.length };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { seeded: false, imported: 0, error };
  }
}
