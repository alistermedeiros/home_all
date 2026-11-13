
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';

import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

import { auth, db } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil(user) {
    const referencia = doc(db, 'usuarios', user.uid);

    const snapshot = await getDoc(referencia);

    if (snapshot.exists()) {
      return {
        uid: user.uid,
        email: user.email,
        nome: user.displayName || '',
        ...snapshot.data(),
      };
    }

    // Recupera usuários que já existem no Authentication,
    // mas ainda não possuem documento no Firestore.
    const dados = {
      nome: user.displayName || '',
      email: user.email || '',
      telefone: '',
      cidade: '',
      bairro: '',
      descricao: '',
      mediaAvaliacoes: 0,
      totalAvaliacoes: 0,
      criadoEm: serverTimestamp(),
    };

    await setDoc(referencia, dados);

    return {
      uid: user.uid,
      ...dados,
    };
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async user => {
        try {
          if (user) {
            const perfil = await carregarPerfil(user);
            setUsuario(perfil);
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.log('Erro ao carregar perfil:', error);
          setUsuario(null);
        } finally {
          setCarregando(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  async function cadastrar({
    nome,
    email,
    telefone,
    senha,
  }) {
    let user = auth.currentUser;

    if (!user) {
      const resultado = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      );

      user = resultado.user;
    }

    await updateProfile(user, {
      displayName: nome.trim(),
    });

    const dados = {
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      cidade: '',
      bairro: '',
      descricao: '',
      mediaAvaliacoes: 0,
      totalAvaliacoes: 0,
      criadoEm: serverTimestamp(),
    };

    await setDoc(
      doc(db, 'usuarios', user.uid),
      dados,
      { merge: true }
    );

    setUsuario({
      uid: user.uid,
      ...dados,
    });

    return true;
  }

  async function login(email, senha) {
    const resultado = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      senha
    );

    const perfil = await carregarPerfil(resultado.user);

    setUsuario(perfil);

    return true;
  }

  async function sair() {
    await signOut(auth);
    setUsuario(null);
  }

  async function atualizarUsuario(dados) {
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado.');
    }

    await setDoc(
      doc(db, 'usuarios', auth.currentUser.uid),
      dados,
      { merge: true }
    );

    setUsuario(prev => ({
      ...prev,
      ...dados,
    }));
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        cadastrar,
        login,
        sair,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
