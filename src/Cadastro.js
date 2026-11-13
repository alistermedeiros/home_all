
import { useState } from 'react';
import {
    Alert, ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity
} from 'react-native';
import { useAuth } from './AuthContext';
import { CORES } from './cores';

export default function Cadastro({ navigation }) {
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  async function registrar() {
    if (!nome.trim() || !email.trim() || !senha) {
  return Alert.alert(
    'Atenção',
    'Preencha os campos obrigatórios.'
  );
}

    if (senha.length < 6) {
      return Alert.alert('Senha inválida', 'Use pelo menos 6 caracteres.');
    }

    if (senha !== confirmar) {
      return Alert.alert('Atenção', 'As senhas não coincidem.');
    }

    try {
      setLoading(true);
      await cadastrar({ nome, email, telefone, senha });
    } catch (error) {
  console.log('Erro no cadastro:', error);

  const mensagens = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/weak-password': 'A senha é muito fraca.',
    'auth/network-request-failed': 'Verifique sua conexão com a internet.',
  };

  Alert.alert(
    'Erro ao cadastrar',
    mensagens[error.code] || 'Não foi possível criar sua conta.'
  );
} finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>AIKO</Text>
      <Text style={styles.sub}>HOME SERVICE</Text>
      <Text style={styles.titulo}>Crie sua conta</Text>
      <Text style={styles.descricao}>
        Encontre profissionais ou ofereça seus serviços.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        keyboardType="phone-pad"
        value={telefone}
        onChangeText={setTelefone}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirmar}
        onChangeText={setConfirmar}
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={registrar}
        disabled={loading}
      >
        <Text style={styles.botaoTexto}>
          {loading ? 'Cadastrando...' : 'Criar conta'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tenho uma conta. Entrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: CORES.fundo,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: CORES.primaria,
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    color: CORES.escura,
    letterSpacing: 3,
    marginBottom: 35,
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: CORES.escura,
  },
  descricao: {
    color: '#777',
    marginVertical: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 13,
    borderWidth: 1,
    borderColor: CORES.borda,
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
  link: {
    textAlign: 'center',
    color: CORES.escura,
    marginTop: 25,
  },
});
