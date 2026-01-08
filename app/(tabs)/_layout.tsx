import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#f7bd1a', 
      tabBarInactiveTintColor: '#888',
      tabBarStyle: { backgroundColor: '#000000' },
      headerStyle: { backgroundColor: '#000000' },
      headerTintColor: '#f7bd1a',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      {/* Tab lainnya tetap sama */}
    </Tabs>
  );
}