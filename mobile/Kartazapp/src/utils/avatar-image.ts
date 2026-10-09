import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Lado da foto de perfil enviada: sobra para o círculo de 112pt mesmo em telas 3x. */
const AVATAR_SIZE = 512;
const AVATAR_COMPRESS = 0.8;

type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

/**
 * Reduz a foto escolhida para no máximo 512px (já vem quadrada do recorte) e salva em JPEG.
 * Uma foto da câmera do iPhone cai de vários MB para ~50–150 KB antes do upload.
 */
export async function prepareAvatarImage(image: PickedImage) {
  const context = ImageManipulator.manipulate(image.uri);
  // Só reduz: imagens menores que 512px não são ampliadas.
  if (image.width > AVATAR_SIZE || image.height > AVATAR_SIZE) {
    context.resize(image.width >= image.height ? { width: AVATAR_SIZE } : { height: AVATAR_SIZE });
  }
  const rendered = await context.renderAsync();
  try {
    const result = await rendered.saveAsync({ compress: AVATAR_COMPRESS, format: SaveFormat.JPEG });
    return { uri: result.uri };
  } finally {
    rendered.release();
    context.release();
  }
}
