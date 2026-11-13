
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import {
    addDoc,
    collection,
    deleteDoc, getDocs,
    onSnapshot,
    query, where
} from 'firebase/firestore';

import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { db } from './firebase';

export default function Favoritos({ navigation }) {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    if (!usuario?.uid) return;

    const q = query(
      collection(db, 'favoritos'),
      where('clienteId', '==', usuario.uid)
    );

    return onSnapshot(q, snapshot => {
      setFavoritos(snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });
  }, [usuario?.uid]);

  async function remover(item) {
    try {
      await deleteDoc(
        require('firebase/firestore').doc(db, 'favoritos', item.id)
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível remover o favorito.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus favoritos</Text>

      <FlatList
        data={favoritos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('DetalhesServico', {
                servicoId: item.servicoId,
              })}
            >
              <Text style={styles.nome}>{item.titulo || 'Serviço favorito'}</Text>
              <Text style={styles.local}>
                {item.cidade || 'Localização não informada'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => remover(item)}>
              <Text style={styles.remover}>♥</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Você ainda não possui favoritos.
          </Text>
        }
      />
    </View>
  );
}

export const adicionarFavorito = async ({
  usuarioId,
  servico,
}) => {
  const q = query(
    collection(db, 'favoritos'),
    where('clienteId', '==', usuarioId),
    where('servicoId', '==', servico.id)
  );

  const existente = await getDocs(q);

  if (!existente.empty) return;

  await addDoc(collection(db, 'favoritos'), {
    clienteId: usuarioId,
    prestadorId: servico.prestadorId,
    servicoId: servico.id,
    titulo: servico.titulo,
    cidade: servico.cidade || '',
    criadoEm: new Date(),
  });
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: CORES.fundo },
  titulo: {
    fontSize: 24, fontWeight: 'bold',
    color: CORES.escura, marginVertical: 20,
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 17,
    borderRadius: 13, marginBottom: 12,
  },
  nome: { color: CORES.escura, fontWeight: 'bold', fontSize: 16 },
  local: { color: '#777', marginTop: 5 },
  remover: { color: '#E05252', fontSize: 25 },
  vazio: { textAlign: 'center', marginTop: 40, color: '#777' },
});
