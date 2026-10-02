import { Tabs } from 'expo-router/js-tabs';

import { colors } from '@/theme/colors';

// Tab bar provisória: na Fase 3 do todo vira uma TabBar 100% custom (ícones SVG próprios).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
        tabBarIconStyle: { display: 'none' },
        tabBarIcon: () => null,
      }}>
      <Tabs.Screen name="index" options={{ title: 'MAP' }} />
      <Tabs.Screen name="collection" options={{ title: 'CARDS' }} />
      <Tabs.Screen name="trades" options={{ title: 'TRADES' }} />
      <Tabs.Screen name="achievements" options={{ title: 'ACHIEVE' }} />
      <Tabs.Screen name="profile" options={{ title: 'PROFILE' }} />
    </Tabs>
  );
}
