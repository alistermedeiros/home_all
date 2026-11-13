
import { useState } from 'react';

import {
    Alert,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import * as Location from 'expo-location';

import {
    doc,
    updateDoc,
} from 'firebase/firestore';

import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { db } from './firebase';

export default function Localizacao({ navigation, route }) {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(false);

  async function obterGPS() {
    try {
      setCarregando(true);

      const permissao =
        await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Autorize o acesso à localização.'
        );
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({});

      const endereco = await Location.reverseGeocodeAsync({
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
      });

      const local = endereco[0];

      if (route.params?.selecionarServico) {
        navigation.navigate({
          name: 'CadastroServico',
          params: {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
            cidade: local?.city || local?.subregion || '',
            bairro: local?.district || '',
            endereco: local?.street || '',
          },
          merge: true,
        });
      } else {
        await updateDoc(doc(db, 'usuarios', usuario.uid), {
          cidade: local?.city || local?.subregion || '',
          bairro: local?.district || '',
          endereco: local?.street || '',
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        });

        Alert.alert('Sucesso', 'Localização atualizada!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: CORES.fundo,
      padding: 25,
      justifyContent: 'center',
    }}>
      <Text style={{
        fontSize: 25,
        fontWeight: 'bold',
        color: CORES.escura,
      }}>
        Sua localização
      </Text>

      <Text style={{ marginVertical: 15, color: '#777' }}>
        Utilize o GPS para encontrar serviços próximos
        ou informar onde você atende.
      </Text>

      <TouchableOpacity
        onPress={obterGPS}
        style={{
          backgroundColor: CORES.primaria,
          padding: 17,
          borderRadius: 12,
        }}
      >
        <Text style={{
          color: '#fff',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          {carregando
            ? 'Obtendo localização...'
            : '📍 Usar minha localização'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
