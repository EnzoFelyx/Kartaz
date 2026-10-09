import { Client } from '@colyseus/sdk';

import { apiConfig } from '@/lib/api/config';

/** O Colyseus responde na mesma porta do backend (HTTP + WebSocket em :3000). */
export const colyseusClient = new Client(apiConfig.baseUrl);
