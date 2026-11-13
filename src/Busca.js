
import { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import {
    collection,
    onSnapshot,
    query, where
} from 'firebase/firestore';

import Estrelas from './componentes/Estrelas';
import { CORES } from './cores';
import { db } from './firebase';

export default function Busca({ navigation }) {
  const [texto, setTexto] = useState('');
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'servicos'),
      where('ativo', '==', true)
    );

    return onSnapshot(q, snapshot => {
      setServicos(snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });
  }, []);

  const resultados = servicos.filter(item =>
    `${item.titulo} ${item.categoria} ${item.cidade} ${item.bairro}`
      .toLowerCase()
      .includes(texto.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Buscar serviços</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite o serviço ou cidade..."
        value={texto}
        onChangeText={setTexto}
      />

      <FlatList
        data={resultados}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DetalhesServico', {
              servicoId: item.id,
            })}
          >
            <Text style={styles.nome}>{item.titulo}</Text>
            <Text style={styles.categoria}>{item.categoria}</Text>
            <Text style={styles.local}>
              📍 {item.bairro} - {item.cidade}
            </Text>
            <Estrelas valor={Math.round(item.mediaAvaliacoes || 0)} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum serviço encontrado.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: CORES.fundo },
  titulo: {
    fontSize: 24, fontWeight: 'bold',
    color: CORES.escura, marginVertical: 20,
  },
  input: {
    backgroundColor: '#fff', padding: 16,
    borderRadius: 12, marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff', padding: 17,
    borderRadius: 13, marginBottom: 12,
  },
  nome: { fontSize: 17, fontWeight: 'bold', color: CORES.escura },
  categoria: { color: CORES.primaria, marginTop: 5 },
  local: { color: '#777', marginVertical: 8 },
  vazio: { textAlign: 'center', marginTop: 40, color: '#777' },
});
