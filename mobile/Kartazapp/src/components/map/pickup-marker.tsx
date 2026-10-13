import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

type PickupMarkerProps = {
  latitude: number;
  longitude: number;
  /** Tamanho (px) do ícone: a view do marcador tem exatamente esse tamanho. */
  size: number;
  icon: ReactNode;
  accessibilityLabel: string;
};

/**
 * Item coletável da sala (moeda, bateria) parado na coordenada dele — nunca muda de lugar, a chave
 * de quem usa é o id do item. Some quando sai do estado da sala.
 * O mapa desenha o marcador como imagem: com `tracksViewChanges` desligado cedo ele congelava o SVG
 * ainda pela metade (ícone meio transparente, principalmente no primeiro load). Como cada sala tem
 * no máximo uma moeda e uma bateria, o marcador fica sempre redesenhando.
 */
export function PickupMarker({ latitude, longitude, size, icon, accessibilityLabel }: PickupMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges
      zIndex={1}
      accessibilityLabel={accessibilityLabel}>
      <View style={[styles.container, { width: size, height: size }]} collapsable={false}>
        {icon}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
