import { Tabs } from 'expo-router/js-tabs';

import { TabBar, TabIcon } from '@/components/tab-bar';
import { colors } from '@/theme/colors';

// `title` não aparece na barra (só ícones); é usado como label de acessibilidade.
// Ícones sempre em outline (vazados), inclusive na aba ativa.
export default function TabsLayout() {
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
          title: 'Map',
          tabBarIcon: (props) => (
            <TabIcon ios="map" android="map" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: (props) => (
            <TabIcon
              ios="rectangle.stack"
              android="style"
              {...props}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
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
          title: 'Trades',
          tabBarIcon: (props) => (
            <TabIcon ios="arrow.left.arrow.right" android="swap_horiz" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
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
