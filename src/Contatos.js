
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

import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { db } from './firebase';

export default function Contatos() {
  const { usuario } = useAuth();
  const [enviados, setEnviados] = useState([]);
  const [recebidos, setRecebidos] = useState([]);

  useEffect(() => {
    if (!usuario?.uid) return;

    const q1 = query(
      collection(db, 'contratacoes'),
      where('clienteId', '==', usuario.uid)
    );

    const q2 = query(
      collection(db, 'contratacoes'),
      where('prestadorId', '==', usuario.uid)
    );

    const unsub1 = onSnapshot(q1, snap => {
      setEnviados(snap.docs.map(d => ({
        id: d.id, ...d.data(),
      })));
    });

    const unsub2 = onSnapshot(q2, snap => {
      setRecebidos(snap.docs.map(d => ({
        id: d.id, ...d.data(),
      })));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [usuario?.uid]);

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.nome}>
          Serviço: {item.servicoTitulo || item.servicoId}
        </Text>
        <Text style={styles.status}>
          Status: {item.status}
        </Text>
        <Text style={styles.data}>
          Solicitação registrada no AIKO
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus contatos</Text>

      <Text style={styles.secao}>Solicitações enviadas</Text>
      <FlatList
        data={enviados}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma solicitação enviada.</Text>
        }
      />

      <Text style={styles.secao}>Solicitações recebidas</Text>
      <FlatList
        data={recebidos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma solicitação recebida.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo, padding: 18 },
  titulo: { fontSize: 25, fontWeight: 'bold', color: CORES.escura, marginVertical: 15 },
  secao: { fontSize: 17, fontWeight: 'bold', color: CORES.primaria, marginVertical: 12 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  nome: { color: CORES.escura, fontWeight: 'bold' },
  status: { color: CORES.primaria, marginTop: 7 },
  data: { color: '#888', fontSize: 11, marginTop: 5 },
  vazio: { color: '#888', marginBottom: 12 },
});
