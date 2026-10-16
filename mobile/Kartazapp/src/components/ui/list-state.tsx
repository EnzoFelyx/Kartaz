import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type ListStateProps = {
  loading?: boolean;
  /** Falhou ao carregar: mostra o aviso e "Tentar novamente" (se houver `onRetry`). */
  error?: boolean;
  onRetry?: () => void;
  /** Texto da lista vazia (carregou, mas não há itens). */
  emptyText: string;
};

/**
 * Conteúdo de uma lista sem itens (`ListEmptyComponent`): carregando, erro com "Tentar novamente"
 * ou o texto de lista vazia — o mesmo visual em todas as listas do app.
 */
export function ListState({ loading = false, error = false, onRetry, emptyText }: ListStateProps) {
  const { t } = useTranslation();

  if (loading) return <ActivityIndicator color={colors.primary} style={styles.loading} />;

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.text}>{t('common.loadError')}</Text>
        {onRetry && (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return <Text style={styles.text}>{emptyText}</Text>;
}

/** Rodapé da lista enquanto a próxima página carrega ("Carregando mais..."). */
export function ListLoadingMore() {
  const { t } = useTranslation();
  return (
    <View style={styles.footer}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.footerText}>{t('cards.loadingMore')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  loading: {
    marginTop: 32,
  },
  error: {
    alignItems: 'center',
    gap: 16,
  },
  text: {
    marginTop: 24,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryPressed: {
    transform: [{ scale: 0.97 }],
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
