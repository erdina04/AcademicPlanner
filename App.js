import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import CourseSchedule from './src/screens/CourseSchedule';
import Assignments from './src/screens/Assignments';
import GradeCalculator from './src/screens/GradeCalculator';
import Reminders from './src/screens/Reminders';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => {
            const icons = {
              Schedule: 'calendar',
              Assignments: 'list',
              Grades: 'calculator',
              Reminders: 'alarm'
            };
            return (
              <Ionicons
                name={icons[route.name]}
                size={24}
                color={focused ? '#28a745' : '#666'}
              />
            );
          },
          tabBarActiveTintColor: '#28a745',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8
          },
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#fff',
        })}
      >
        <Tab.Screen name="Schedule" component={CourseSchedule} />
        <Tab.Screen name="Assignments" component={Assignments} />
        <Tab.Screen name="Grades" component={GradeCalculator} />
        <Tab.Screen name="Reminders" component={Reminders} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}