
import { useState } from 'react';
import {
    Alert,
    ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { db } from './firebase';

export default function Perfil({ navigation }) {
  const { usuario, sair } = useAuth();

  const [nome, setNome] = useState(usuario?.nome || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [cidade, setCidade] = useState(usuario?.cidade || '');
  const [bairro, setBairro] = useState(usuario?.bairro || '');
  const [descricao, setDescricao] = useState(usuario?.descricao || '');

  async function salvar() {
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        nome, telefone, cidade, bairro, descricao,
      });

      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Meu perfil</Text>

      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>
          {nome.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.email}>{usuario?.email}</Text>

      {[
        ['Nome completo', nome, setNome],
        ['Telefone', telefone, setTelefone],
        ['Cidade', cidade, setCidade],
        ['Bairro', bairro, setBairro],
        ['Sobre mim', descricao, setDescricao],
      ].map(([label, value, setter]) => (
        <View key={label}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setter}
            multiline={label === 'Sobre mim'}
          />
        </View>
      ))}

      <TouchableOpacity
        style={styles.botao}
        onPress={salvar}
      >
        <Text style={styles.botaoTexto}>Salvar alterações</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoSecundario}
        onPress={() => navigation.navigate('Localizacao')}
      >
        <Text style={styles.secundarioTexto}>Atualizar localização GPS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoSair}
        onPress={() => Alert.alert(
          'Sair da conta',
          'Deseja sair?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', onPress: sair },
          ]
        )}
      >
        <Text style={{ color: '#E05252', textAlign: 'center' }}>
          Sair da conta
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo, padding: 20 },
  titulo: { fontSize: 25, color: CORES.escura, fontWeight: 'bold', marginVertical: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 50,
    backgroundColor: CORES.primaria,
    alignSelf: 'center', justifyContent: 'center',
  },
  avatarTexto: { color: '#fff', fontSize: 35, textAlign: 'center' },
  email: { textAlign: 'center', color: '#777', marginVertical: 15 },
  label: { color: CORES.escura, fontWeight: 'bold', marginTop: 15, marginBottom: 7 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: CORES.borda },
  botao: { backgroundColor: CORES.primaria, padding: 16, borderRadius: 11, marginTop: 25 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  botaoSecundario: { backgroundColor: '#E3F2F3', padding: 15, borderRadius: 11, marginTop: 12 },
  secundarioTexto: { color: CORES.escura, textAlign: 'center', fontWeight: 'bold' },
  botaoSair: { padding: 20 },
});
 