
import { useEffect, useState } from 'react';
import {
    FlatList, StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    collection,
    onSnapshot,
    query, where,
} from 'firebase/firestore';

import Estrelas from './componentes/Estrelas';
import { CORES } from './cores';
import { db } from './firebase';

export default function Avaliacoes({ route }) {
  const { prestadorId, servicoId } = route.params;

  const [avaliacoes, setAvaliacoes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'avaliacoes'),
      where('prestadorId', '==', prestadorId),
      where('servicoId', '==', servicoId)
    );

    return onSnapshot(q, snapshot => {
      setAvaliacoes(snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });
  }, [prestadorId, servicoId]);

  const media = avaliacoes.length
    ? avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Avaliações</Text>

      <View style={styles.resumo}>
        <Text style={styles.media}>{media.toFixed(1)}</Text>
        <Estrelas valor={Math.round(media)} tamanho={24} />
        <Text style={styles.total}>
          {avaliacoes.length} avaliações
        </Text>
      </View>

      <FlatList
        data={avaliacoes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>
              {item.nomeCliente || 'Cliente AIKO'}
            </Text>

            <Estrelas valor={item.estrelas} />

            <Text style={styles.comentario}>
              {item.comentario}
            </Text>

            <Text style={styles.data}>
              Avaliação de contratação concluída
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Este profissional ainda não possui avaliações.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: CORES.fundo },
  titulo: { fontSize: 25, fontWeight: 'bold', color: CORES.escura, marginVertical: 15 },
  resumo: { backgroundColor: '#fff', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  media: { fontSize: 40, fontWeight: 'bold', color: CORES.escura },
  total: { color: '#777', marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 13, marginBottom: 12 },
  nome: { fontWeight: 'bold', color: CORES.escura, marginBottom: 8 },
  comentario: { color: '#555', marginTop: 10, lineHeight: 22 },
  data: { color: '#999', fontSize: 11, marginTop: 12 },
  vazio: { textAlign: 'center', color: '#777', marginTop: 25 },
});
