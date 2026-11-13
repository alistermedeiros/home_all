
import { useEffect, useState } from 'react';
import {
    Alert, Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import {
    addDoc, collection,
    doc, getDoc,
    serverTimestamp,
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

  useEffect(() => {
    async function carregar() {
      const snapshot = await getDoc(doc(db, 'servicos', servicoId));

      if (snapshot.exists()) {
        setServico({ id: snapshot.id, ...snapshot.data() });
      }
    }

    carregar();
  }, [servicoId]);

  async function favoritar() {
    try {
      await adicionarFavorito({
        usuarioId: usuario.uid,
        servico,
      });
      Alert.alert('Sucesso', 'Serviço adicionado aos favoritos.');
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar aos favoritos.');
    }
  }

  async function solicitar() {
    if (servico.prestadorId === usuario.uid) {
      return Alert.alert('Atenção', 'Você não pode contratar seu próprio serviço.');
    }

    try {
      await addDoc(collection(db, 'contratacoes'), {
        clienteId: usuario.uid,
        prestadorId: servico.prestadorId,
        servicoId: servico.id,
        status: 'solicitada',
        criadoEm: serverTimestamp(),
      });

      Alert.alert('Solicitação enviada', 'O profissional poderá acompanhar sua solicitação.');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a solicitação.');
    }
  }

  if (!servico) {
    return <View style={styles.container}>
      <Text>Carregando serviço...</Text>
    </View>;
  }

  return (
    <ScrollView style={styles.container}>
      {servico.imagens?.[0] && (
        <Image source={{ uri: servico.imagens[0] }} style={styles.imagem} />
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
      <Text style={styles.nome}>{servico.nomePrestador || 'Profissional AIKO'}</Text>

      <View style={styles.avaliacao}>
        <Estrelas valor={Math.round(servico.mediaAvaliacoes || 0)} />
        <Text style={{ color: '#777' }}>
          {servico.totalAvaliacoes || 0} avaliações
        </Text>
      </View>

      <TouchableOpacity
        style={styles.botaoSecundario}
        onPress={() => navigation.navigate('Avaliacoes', {
          prestadorId: servico.prestadorId,
          servicoId: servico.id,
        })}
      >
        <Text style={styles.textoSecundario}>Ver avaliações</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.favorito} onPress={favoritar}>
        <Text style={styles.textoFavorito}>♡ Adicionar aos favoritos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao} onPress={solicitar}>
        <Text style={styles.textoBotao}>Solicitar serviço</Text>
      </TouchableOpacity>

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo, padding: 20 },
  imagem: { width: '100%', height: 230, borderRadius: 15 },
  titulo: { fontSize: 25, fontWeight: 'bold', color: CORES.escura, marginTop: 20 },
  categoria: { color: CORES.primaria, marginTop: 8 },
  preco: { fontSize: 21, fontWeight: 'bold', color: CORES.escura, marginTop: 15 },
  descricao: { color: '#555', lineHeight: 24, marginTop: 18 },
  secao: { fontSize: 18, fontWeight: 'bold', color: CORES.escura, marginTop: 25 },
  local: { color: '#555', marginTop: 10 },
  nome: { color: CORES.escura, fontWeight: 'bold', marginTop: 10 },
  avaliacao: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  botao: { backgroundColor: CORES.primaria, padding: 17, borderRadius: 12, marginTop: 13 },
  textoBotao: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  favorito: { padding: 15, backgroundColor: '#E6F3F4', borderRadius: 12, marginTop: 15 },
  textoFavorito: { textAlign: 'center', color: CORES.escura, fontWeight: 'bold' },
  botaoSecundario: { padding: 12, borderWidth: 1, borderColor: CORES.primaria, borderRadius: 10, marginTop: 15 },
  textoSecundario: { textAlign: 'center', color: CORES.primaria },
});
