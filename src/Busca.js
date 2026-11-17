
import { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    collection,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore';

import Estrelas from './componentes/Estrelas';
import { CORES } from './cores';
import { db } from './firebase';

export default function Busca({ navigation, route }) {
  const categoria = route?.params?.categoria || '';

  const [texto, setTexto] = useState(categoria);
  const [servicos, setServicos] = useState([]);
  const [resumoAvaliacoes, setResumoAvaliacoes] = useState({});

  // Carrega os serviços ativos
  useEffect(() => {
    const q = query(
      collection(db, 'servicos'),
      where('ativo', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        setServicos(
          snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          }))
        );
      },
      erro => {
        console.log('Erro ao carregar serviços:', erro);
      }
    );

    return unsubscribe;
  }, []);

  // Carrega as avaliações e calcula a média de cada serviço
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'avaliacoes'),
      snapshot => {
        const agrupadas = {};

        snapshot.docs.forEach(d => {
          const avaliacao = d.data();
          const nota = Number(avaliacao.nota);
          const servicoId = avaliacao.servicoId;

          if (
            !servicoId ||
            !Number.isFinite(nota) ||
            nota < 1 ||
            nota > 5
          ) {
            return;
          }

          if (!agrupadas[servicoId]) {
            agrupadas[servicoId] = {
              soma: 0,
              total: 0,
            };
          }

          agrupadas[servicoId].soma += nota;
          agrupadas[servicoId].total += 1;
        });

        const resumo = {};

        Object.keys(agrupadas).forEach(servicoId => {
          const dados = agrupadas[servicoId];

          resumo[servicoId] = {
            media: dados.soma / dados.total,
            total: dados.total,
          };
        });

        setResumoAvaliacoes(resumo);
      },
      erro => {
        console.log('Erro ao carregar avaliações:', erro);
      }
    );

    return unsubscribe;
  }, []);

  const resultados = servicos.filter(item =>
    `${item.titulo || ''} ${item.categoria || ''} ${item.cidade || ''} ${item.bairro || ''}`
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
        renderItem={({ item }) => {
          const avaliacao = resumoAvaliacoes[item.id];
          const media = avaliacao?.media || 0;
          const total = avaliacao?.total || 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('DetalhesServico', {
                  servicoId: item.id,
                })
              }
            >
              <Text style={styles.nome}>{item.titulo}</Text>

              <Text style={styles.categoria}>
                {item.categoria}
              </Text>

              <Text style={styles.local}>
                📍 {item.bairro} - {item.cidade}
              </Text>

              <View style={styles.avaliacao}>
                <Estrelas valor={Math.round(media)} />

                <Text style={styles.total}>
                  {total} avaliações
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Nenhum serviço encontrado.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: CORES.fundo,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CORES.escura,
    marginVertical: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 17,
    borderRadius: 13,
    marginBottom: 12,
  },
  nome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: CORES.escura,
  },
  categoria: {
    color: CORES.primaria,
    marginTop: 5,
  },
  local: {
    color: '#777',
    marginVertical: 8,
  },
  avaliacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 5,
  },
  total: {
    color: '#777',
    fontSize: 12,
  },
  vazio: {
    textAlign: 'center',
    marginTop: 40,
    color: '#777',
  },
});
