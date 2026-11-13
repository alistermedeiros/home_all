
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
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    updateDoc,
    where
} from 'firebase/firestore';

import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { db } from './firebase';

export default function MeusServicos({ navigation }) {
  const { usuario } = useAuth();
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    if (!usuario?.uid) return;

    const q = query(
      collection(db, 'servicos'),
      where('prestadorId', '==', usuario.uid)
    );

    return onSnapshot(q, snapshot => {
      setServicos(snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });
  }, [usuario?.uid]);

  async function alterarStatus(item) {
    try {
      await updateDoc(doc(db, 'servicos', item.id), {
        ativo: !item.ativo,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o serviço.');
    }
  }

  function excluir(item) {
    Alert.alert(
      'Excluir serviço',
      'Deseja realmente excluir este anúncio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'servicos', item.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus serviços</Text>

      <TouchableOpacity
        style={styles.adicionar}
        onPress={() => navigation.navigate('CadastroServico')}
      >
        <Text style={styles.adicionarTexto}>+ Publicar novo serviço</Text>
      </TouchableOpacity>

      <FlatList
        data={servicos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.titulo}</Text>
            <Text style={styles.categoria}>{item.categoria}</Text>
            <Text style={styles.local}>
              📍 {item.bairro} - {item.cidade}
            </Text>

            <Text style={{
              color: item.ativo ? '#28A36A' : '#E05252',
              marginVertical: 8,
            }}>
              {item.ativo ? '● Publicado' : '● Desativado'}
            </Text>

            <View style={styles.acoes}>
              <TouchableOpacity onPress={() => alterarStatus(item)}>
                <Text style={styles.acao}>
                  {item.ativo ? 'Desativar' : 'Ativar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('CadastroServico', {
                  editar: item,
                })}
              >
                <Text style={styles.acao}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => excluir(item)}>
                <Text style={[styles.acao, { color: '#E05252' }]}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Você ainda não publicou serviços.
          </Text>
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
  adicionar: {
    backgroundColor: CORES.primaria,
    padding: 15, borderRadius: 12, marginBottom: 18,
  },
  adicionarTexto: {
    color: '#fff', textAlign: 'center', fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff', padding: 17,
    borderRadius: 13, marginBottom: 13,
  },
  nome: { fontSize: 17, fontWeight: 'bold', color: CORES.escura },
  categoria: { color: CORES.primaria, marginTop: 5 },
  local: { color: '#777', marginTop: 8 },
  acoes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  acao: { color: CORES.primaria, fontWeight: 'bold' },
  vazio: { textAlign: 'center', marginTop: 30, color: '#777' },
});
