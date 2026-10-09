const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite importar o seed de jogadores (assets/data/players-initial.json.gz) como asset.
config.resolver.assetExts.push('gz');

// Pacotes de Node trocados por versões do app. "ws": o @colyseus/sdk importa, mas usa o WebSocket global.
const shims = {
  ws: path.resolve(__dirname, 'src/shims/ws.js'),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (shims[moduleName]) return { type: 'sourceFile', filePath: shims[moduleName] };
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
