/**
 * O `TextDecoder` do React Native/Expo não suporta "utf-16le", e o h3-js (emscripten) cria
 * `new TextDecoder("utf-16le")` ao carregar — o que lança `RangeError: Unknown encoding`.
 * Este complemento adiciona só o utf-16le; as demais codificações continuam no decodificador nativo.
 * Precisa ser importado antes do h3-js (ver lib/h3/cells.ts).
 */
const NativeTextDecoder = globalThis.TextDecoder;

function supportsEncoding(label: string) {
  try {
    new NativeTextDecoder(label);
    return true;
  } catch {
    return false;
  }
}

class Utf16LeDecoder {
  readonly encoding = 'utf-16le';
  readonly fatal = false;
  readonly ignoreBOM = false;

  decode(input?: ArrayBuffer | ArrayBufferView) {
    if (!input) return '';
    const bytes = ArrayBuffer.isView(input)
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input);
    let result = '';
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      result += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
    }
    return result;
  }
}

if (NativeTextDecoder && !supportsEncoding('utf-16le')) {
  function TextDecoderWithUtf16(label = 'utf-8', options?: TextDecoderOptions) {
    const normalized = String(label).trim().toLowerCase();
    if (normalized === 'utf-16le' || normalized === 'utf-16') return new Utf16LeDecoder();
    return new NativeTextDecoder(label, options);
  }
  TextDecoderWithUtf16.prototype = NativeTextDecoder.prototype;
  globalThis.TextDecoder = TextDecoderWithUtf16 as unknown as typeof TextDecoder;
}

export {};
