import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { CardsIcon } from '@/components/icons/cards-icon';
import { TabBar, TabIcon } from '@/components/tab-bar';
import { colors } from '@/theme/colors';

// `title` não aparece na barra (só ícones); é usado como label de acessibilidade.
// Ícones sempre em outline (vazados), inclusive na aba ativa.
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabs.map'),
          tabBarIcon: (props) => (
            <TabIcon ios="map" android="map" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t('tabs.collection'),
          // Ícone próprio (SVG): nenhum SF Symbol tem a carta inclinada do protótipo.
          tabBarIcon: ({ color, size }) => <CardsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t('tabs.achievements'),
          tabBarIcon: (props) => (
            <TabIcon
              ios="trophy"
              android="emoji_events"
              {...props}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: t('tabs.trades'),
          tabBarIcon: (props) => (
            <TabIcon ios="arrow.left.arrow.right" android="swap_horiz" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: (props) => (
            <TabIcon
              ios="person.crop.circle"
              android="account_circle"
              {...props}
            />
          ),
        }}
      />
    </Tabs>
  );
}
