
import { useState } from 'react';

import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    addDoc,
    collection,
    serverTimestamp,
} from 'firebase/firestore';

import { useAuth } from './AuthContext';
import { CATEGORIAS, CORES } from './cores';
import { db } from './firebase';

export default function CadastroServico({ navigation }) {
  const { usuario } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (
      !titulo.trim() ||
      !categoria ||
      !descricao.trim() ||
      !cidade.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Preencha título, categoria, descrição e cidade.'
      );
      return;
    }

    try {
      setSalvando(true);

      await addDoc(collection(db, 'servicos'), {
        prestadorId: usuario.uid,
        nomePrestador: usuario.nome,
        titulo,
        categoria,
        descricao,
        preco: preco ? Number(preco.replace(',', '.')) : null,
        cidade,
        bairro,
        endereco,
        latitude: null,
        longitude: null,
        imagens: [],
        ativo: true,
        mediaAvaliacoes: 0,
        totalAvaliacoes: 0,
        criadoEm: serverTimestamp(),
      });

      Alert.alert(
        'Sucesso!',
        'Seu serviço foi publicado.',
        [{
          text: 'OK',
          onPress: () => navigation.goBack(),
        }]
      );
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Oferecer serviço</Text>

      <Text style={styles.label}>Nome do serviço *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Pintura residencial"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={styles.label}>Categoria *</Text>

      <View style={styles.categorias}>
        {CATEGORIAS.map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setCategoria(item)}
            style={[
              styles.categoria,
              categoria === item && styles.selecionada,
            ]}
          >
            <Text style={{
              color: categoria === item
                ? '#fff'
                : CORES.escura
            }}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descrição *</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Descreva os serviços oferecidos..."
        multiline
        value={descricao}
        onChangeText={setDescricao}
      />

      <Text style={styles.label}>Preço (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 150,00"
        keyboardType="decimal-pad"
        value={preco}
        onChangeText={setPreco}
      />

      <Text style={styles.secao}>Localização do serviço</Text>

      <Text style={styles.label}>Cidade *</Text>
      <TextInput
        style={styles.input}
        placeholder="Cidade"
        value={cidade}
        onChangeText={setCidade}
      />

      <Text style={styles.label}>Bairro</Text>
      <TextInput
        style={styles.input}
        placeholder="Bairro"
        value={bairro}
        onChangeText={setBairro}
      />

      <Text style={styles.label}>Endereço ou região atendida</Text>
      <TextInput
        style={styles.input}
        placeholder="Rua, número ou região"
        value={endereco}
        onChangeText={setEndereco}
      />

      <TouchableOpacity
        style={styles.botaoGPS}
        onPress={() => navigation.navigate('Localizacao', {
          selecionarServico: true,
        })}
      >
        <Text style={styles.botaoGPSTexto}>
          📍 Selecionar localização pelo GPS
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        disabled={salvando}
        onPress={salvar}
      >
        <Text style={styles.botaoTexto}>
          {salvando ? 'Publicando...' : 'Publicar serviço'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    padding: 20,
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: CORES.escura,
    marginVertical: 20,
  },
  label: {
    fontWeight: '600',
    color: CORES.escura,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 11,
    padding: 15,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  multiline: {
    height: 110,
    textAlignVertical: 'top',
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoria: {
    backgroundColor: '#fff',
    padding: 11,
    borderRadius: 9,
  },
  selecionada: {
    backgroundColor: CORES.primaria,
  },
  secao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.escura,
    marginTop: 28,
  },
  botaoGPS: {
    padding: 15,
    backgroundColor: '#E2F3F4',
    borderRadius: 10,
    marginTop: 15,
  },
  botaoGPSTexto: {
    color: CORES.escura,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  botao: {
    backgroundColor: CORES.primaria,
    padding: 17,
    borderRadius: 12,
    marginTop: 25,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
