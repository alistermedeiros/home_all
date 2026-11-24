
import { NavigationContainer } from '@react-navigation/native';
import {
    Image,
    StyleSheet,
    View,
} from 'react-native';

import { AuthProvider, useAuth } from './src/AuthContext';
import Navegacao from './src/Navegacao';
import NavegacaoAuth from './src/NavegacaoAuth';

function Aplicativo() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <Image
          source={require('./assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
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

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  logo: {
    width: 300,
    height: 300,
  },
});
