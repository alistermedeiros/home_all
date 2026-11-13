

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Cadastro from './Cadastro';
import Login from './Login';

const Stack = createNativeStackNavigator();

export default function NavegacaoAuth() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
      />

      <Stack.Screen
        name="Cadastro"
        component={Cadastro}
      />
    </Stack.Navigator>
  );
}
