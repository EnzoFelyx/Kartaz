// @colyseus/sdk importa "ws" (WebSocket do Node), mas no app usa o WebSocket global do React Native.
// O Metro redireciona "ws" para cá (metro.config.js) para não puxar módulos do Node ("stream" etc.).
module.exports = globalThis.WebSocket;
