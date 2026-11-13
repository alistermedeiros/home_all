import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from './src/AuthContext';
import Navegacao from './src/Navegacao';
import NavegacaoAuth from './src/NavegacaoAuth';
import { CORES } from './src/cores';

function Aplicativo() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: CORES.fundo,
      }}>
        <ActivityIndicator
          size="large"
          color={CORES.primaria}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {usuario ? <Navegacao /> : <NavegacaoAuth />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Aplicativo />
    </AuthProvider>
  );
}