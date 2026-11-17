
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    where,
} from 'firebase/firestore';

import { useAuth } from './AuthContext';
import Estrelas from './componentes/Estrelas';
import { CORES } from './cores';
import { adicionarFavorito } from './Favoritos';
import { db } from './firebase';

export default function DetalhesServico({ route, navigation }) {
  const { servicoId } = route.params;
  const { usuario } = useAuth();

  const [servico, setServico] = useState(null);
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0);

  useEffect(() => {
    async function carregar() {
      try {
        const snapshot = await getDoc(doc(db, 'servicos', servicoId));

        if (snapshot.exists()) {
          setServico({ id: snapshot.id, ...snapshot.data() });
        }
      } catch (erro) {
        console.log('Erro ao carregar serviço:', erro);
        Alert.alert('Erro', 'Não foi possível carregar o serviço.');
      }
    }

    carregar();
  }, [servicoId]);

  // Busca as avaliações do serviço em tempo real
  useEffect(() => {
    if (!servicoId) return;

    const q = query(
      collection(db, 'avaliacoes'),
      where('servicoId', '==', servicoId)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const notas = snapshot.docs
          .map(d => Number(d.data().nota))
          .filter(nota => Number.isFinite(nota) && nota >= 1 && nota <= 5);

        const total = notas.length;
        const media = total
          ? notas.reduce((soma, nota) => soma + nota, 0) / total
          : 0;

        setTotalAvaliacoes(total);
        setMediaAvaliacoes(media);
      },
      erro => {
        console.log('Erro ao carregar avaliações:', erro);
      }
    );

    return unsubscribe;
  }, [servicoId]);

  async function favoritar() {
    if (!usuario?.uid) {
      return Alert.alert('Atenção', 'Faça login para favoritar.');
    }

    try {
      await adicionarFavorito({
        usuarioId: usuario.uid,
        servico,
      });

      Alert.alert('Sucesso', 'Serviço adicionado aos favoritos.');
    } catch (erro) {
      console.log('Erro ao favoritar:', erro);
      Alert.alert('Erro', 'Não foi possível adicionar aos favoritos.');
    }
  }

  async function solicitar() {
    if (!usuario?.uid) {
      return Alert.alert('Atenção', 'Faça login para solicitar.');
    }

    if (servico.prestadorId === usuario.uid) {
      return Alert.alert(
        'Atenção',
        'Você não pode contratar seu próprio serviço.'
      );
    }

    try {
      const q = query(
        collection(db, 'contratacoes'),
        where('clienteId', '==', usuario.uid),
        where('servicoId', '==', servico.id)
      );

      const resultado = await getDocs(q);

      const existente = resultado.docs.find(item =>
        ['solicitada', 'aceita'].includes(item.data().status)
      );

      if (existente) {
        return Alert.alert(
          'Solicitação existente',
          'Você já possui uma solicitação ativa para este serviço.'
        );
      }

      await addDoc(collection(db, 'contratacoes'), {
        clienteId: usuario.uid,
        prestadorId: servico.prestadorId,
        servicoId: servico.id,
        status: 'solicitada',
        criadoEm: serverTimestamp(),
      });

      Alert.alert(
        'Sucesso',
        'Sua solicitação foi enviada ao profissional!'
      );
    } catch (erro) {
      console.log('Erro ao solicitar:', erro);

      Alert.alert(
        'Erro',
        'Não foi possível enviar sua solicitação.'
      );
    }
  }

  if (!servico) {
    return (
      <View style={styles.container}>
        <Text>Carregando serviço...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {servico.imagens?.[0] && (
        <Image
          source={{ uri: servico.imagens[0] }}
          style={styles.imagem}
        />
      )}

      <Text style={styles.titulo}>{servico.titulo}</Text>
      <Text style={styles.categoria}>{servico.categoria}</Text>

      <Text style={styles.preco}>
        {servico.preco
          ? `R$ ${Number(servico.preco).toFixed(2)}`
          : 'Preço a combinar'}
      </Text>

      <Text style={styles.descricao}>{servico.descricao}</Text>

      <Text style={styles.secao}>Localização</Text>
      <Text style={styles.local}>
        📍 {servico.bairro}, {servico.cidade}
      </Text>

      <Text style={styles.secao}>Profissional</Text>
      <Text style={styles.nome}>
        {servico.nomePrestador || 'Profissional AIKO'}
      </Text>

      <View style={styles.avaliacao}>
        <Estrelas valor={Math.round(mediaAvaliacoes)} />
        <Text style={{ color: '#777' }}>
          {totalAvaliacoes} avaliações
        </Text>
      </View>

      <TouchableOpacity
        style={styles.botaoSecundario}
        onPress={() =>
          navigation.navigate('Avaliacoes', {
            prestadorId: servico.prestadorId,
            servicoId: servico.id,
          })
        }
      >
        <Text style={styles.textoSecundario}>Ver avaliações</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.favorito}
        onPress={favoritar}
      >
        <Text style={styles.textoFavorito}>
          ♡ Adicionar aos favoritos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        onPress={solicitar}
      >
        <Text style={styles.textoBotao}>Solicitar serviço</Text>
      </TouchableOpacity>

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    padding: 20,
  },
  imagem: {
    width: '100%',
    height: 230,
    borderRadius: 15,
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: CORES.escura,
    marginTop: 20,
  },
  categoria: {
    color: CORES.primaria,
    marginTop: 8,
  },
  preco: {
    fontSize: 21,
    fontWeight: 'bold',
    color: CORES.escura,
    marginTop: 15,
  },
  descricao: {
    color: '#555',
    lineHeight: 24,
    marginTop: 18,
  },
  secao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.escura,
    marginTop: 25,
  },
  local: {
    color: '#555',
    marginTop: 10,
  },
  nome: {
    color: CORES.escura,
    fontWeight: 'bold',
    marginTop: 10,
  },
  avaliacao: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  botao: {
    backgroundColor: CORES.primaria,
    padding: 17,
    borderRadius: 12,
    marginTop: 13,
  },
  textoBotao: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  favorito: {
    padding: 15,
    backgroundColor: '#E6F3F4',
    borderRadius: 12,
    marginTop: 15,
  },
  textoFavorito: {
    textAlign: 'center',
    color: CORES.escura,
    fontWeight: 'bold',
  },
  botaoSecundario: {
    padding: 12,
    borderWidth: 1,
    borderColor: CORES.primaria,
    borderRadius: 10,
    marginTop: 15,
  },
  textoSecundario: {
    textAlign: 'center',
    color: CORES.primaria,
  },
});
