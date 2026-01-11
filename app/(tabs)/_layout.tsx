import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: Colors.primary, // #f7bd1a
      tabBarInactiveTintColor: Colors.text.secondary, // #9e9e9e
      tabBarStyle: { 
        backgroundColor: Colors.background.dark, // #141414
        borderTopWidth: 0,
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      },
      tabBarLabelStyle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
      },
      headerShown: false,
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