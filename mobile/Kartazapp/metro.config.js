const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite importar o seed de jogadores (assets/data/players-initial.json.gz) como asset.
config.resolver.assetExts.push('gz');

module.exports = config;
