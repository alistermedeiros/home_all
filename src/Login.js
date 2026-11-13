
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { auth } from './firebase';

export default function Login({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  
async function entrar() {
  if (!email.trim() || !senha) {
    Alert.alert(
      'Atenção',
      'Informe seu e-mail e sua senha.'
    );
    return;
  }

  try {
    setLoading(true);

    await login(email.trim(), senha);

    console.log('Login realizado com sucesso!');
  } catch (error) {
    console.log('Erro no login:', error.code, error.message);

    const mensagens = {
      'auth/invalid-credential':
        'E-mail ou senha incorretos.',

      'auth/user-not-found':
        'Usuário não encontrado.',

      'auth/wrong-password':
        'Senha incorreta.',

      'auth/invalid-email':
        'E-mail inválido.',

      'auth/network-request-failed':
        'Verifique sua conexão com a internet.',
    };

    Alert.alert(
      'Falha no login',
      mensagens[error.code] || error.message
    );
  } finally {
    setLoading(false);
  }
}


  async function recuperarSenha() {
    if (!email.trim()) {
      return Alert.alert('Informe seu e-mail primeiro.');
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Pronto', 'Verifique seu e-mail para redefinir a senha.');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>AIKO</Text>
      <Text style={styles.sub}>HOME SERVICE</Text>

      <Text style={styles.titulo}>Bem-vindo de volta!</Text>
      <Text style={styles.descricao}>
        Entre para encontrar ou oferecer serviços.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Seu e-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity onPress={recuperarSenha}>
        <Text style={styles.recuperar}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botao}
        onPress={entrar}
        disabled={loading}
      >
        <Text style={styles.botaoTexto}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.link}>Ainda não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: CORES.fundo,
  },
  logo: {
    fontSize: 50,
    color: CORES.primaria,
    fontWeight: '900',
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    color: CORES.escura,
    letterSpacing: 3,
    marginBottom: 45,
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
    marginTop: 15,
  },
  recuperar: {
    color: CORES.primaria,
    textAlign: 'right',
    marginTop: 15,
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
    marginTop: 25,
    color: CORES.escura,
  },
});
