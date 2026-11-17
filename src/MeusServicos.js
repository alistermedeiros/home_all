
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from './AuthContext';
import { CORES } from './cores';
import { db } from './firebase';

const ABAS = [
  { id: 'solicitacoes', titulo: 'Solicitações' },
  { id: 'andamento', titulo: 'Em andamento' },
  { id: 'anuncios', titulo: 'Anúncios' },
  { id: 'historico', titulo: 'Histórico' },
];

const STATUS_LABEL = {
  solicitada: 'Pendente',
  aceita: 'Em andamento',
  concluida: 'Concluído',
  recusada: 'Recusado',
};

export default function MeusServicos({ navigation }) {
  const { usuario } = useAuth();

  const [aba, setAba] = useState('solicitacoes');
  const [servicos, setServicos] = useState([]);
  const [contratacoes, setContratacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario?.uid) {
      setCarregando(false);
      return;
    }

    const q = query(
      collection(db, 'servicos'),
      where('prestadorId', '==', usuario.uid)
    );

    return onSnapshot(
      q,
      snapshot => {
        setServicos(snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })));
      },
      erro => {
        console.log('Erro ao carregar anúncios:', erro);
        Alert.alert('Erro', 'Não foi possível carregar seus anúncios.');
      }
    );
  }, [usuario?.uid]);

  useEffect(() => {
    if (!usuario?.uid) {
      setCarregando(false);
      return;
    }

    const q = query(
      collection(db, 'contratacoes'),
      where('prestadorId', '==', usuario.uid)
    );

    return onSnapshot(
      q,
      async snapshot => {
        try {
          const lista = await Promise.all(
            snapshot.docs.map(async item => {
              const dados = item.data();
              let tituloServico = 'Serviço solicitado';
              let nomeCliente = 'Cliente';

              try {
                if (dados.servicoId) {
                  const servicoSnap = await getDoc(
                    doc(db, 'servicos', dados.servicoId)
                  );

                  if (servicoSnap.exists()) {
                    tituloServico =
                      servicoSnap.data().titulo || tituloServico;
                  }
                }

                if (dados.clienteId) {
                  const clienteSnap = await getDoc(
                    doc(db, 'usuarios', dados.clienteId)
                  );

                  if (clienteSnap.exists()) {
                    const cliente = clienteSnap.data();

                    nomeCliente =
                      cliente.nome ||
                      cliente.nomeCompleto ||
                      cliente.name ||
                      'Cliente';
                  }
                }
              } catch (erro) {
                console.log('Erro ao buscar dados relacionados:', erro);
              }

              return {
                id: item.id,
                ...dados,
                tituloServico,
                nomeCliente,
              };
            })
          );

          setContratacoes(lista);
        } catch (erro) {
          console.log('Erro ao processar contratações:', erro);
          Alert.alert('Erro', 'Não foi possível carregar as contratações.');
        } finally {
          setCarregando(false);
        }
      },
      erro => {
        console.log('Erro ao carregar contratações:', erro);
        setCarregando(false);
        Alert.alert('Erro', 'Não foi possível carregar as contratações.');
      }
    );
  }, [usuario?.uid]);

  async function atualizarContratacao(item, novoStatus) {
    try {
      const referencia = doc(db, 'contratacoes', item.id);
      const atual = await getDoc(referencia);

      if (!atual.exists()) {
        Alert.alert('Aviso', 'Contratação não encontrada.');
        return;
      }

      const dados = atual.data();

      if (dados.prestadorId !== usuario?.uid) {
        Alert.alert('Erro', 'Esta contratação não pertence a você.');
        return;
      }

      if (dados.status !== item.status) {
        Alert.alert('Aviso', 'A contratação já foi atualizada. Atualize a tela.');
        return;
      }

      const transicoes = {
        solicitada: ['aceita', 'recusada'],
        aceita: ['concluida'],
      };

      if (!transicoes[dados.status]?.includes(novoStatus)) {
        Alert.alert('Erro', 'Esta alteração de status não é permitida.');
        return;
      }

      await updateDoc(referencia, {
        status: novoStatus,
        atualizadoEm: serverTimestamp(),
      });

      const mensagens = {
        aceita: 'Solicitação aceita com sucesso!',
        recusada: 'Solicitação recusada.',
        concluida: 'Serviço marcado como concluído!',
      };

      Alert.alert('Sucesso', mensagens[novoStatus]);
    } catch (erro) {
      console.log('Erro ao atualizar contratação:', erro);

      Alert.alert(
        'Erro',
        `${erro.code || 'Erro'}: ${erro.message || 'Não foi possível atualizar.'}`
      );
    }
  }

  function confirmarAcao(item, status) {
    const textos = {
      aceita: {
        titulo: 'Aceitar serviço',
        mensagem: 'Deseja aceitar esta solicitação?',
        botao: 'Aceitar',
      },
      recusada: {
        titulo: 'Recusar serviço',
        mensagem: 'Deseja realmente recusar esta solicitação?',
        botao: 'Recusar',
      },
      concluida: {
        titulo: 'Concluir serviço',
        mensagem: 'Confirma que realizou este serviço?',
        botao: 'Confirmar conclusão',
      },
    };

    const config = textos[status];

    Alert.alert(config.titulo, config.mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: config.botao,
        style: status === 'recusada' ? 'destructive' : 'default',
        onPress: () => atualizarContratacao(item, status),
      },
    ]);
  }

  async function alterarStatus(item) {
    try {
      await updateDoc(doc(db, 'servicos', item.id), {
        ativo: !item.ativo,
      });
    } catch (erro) {
      console.log('Erro ao alterar anúncio:', erro);
      Alert.alert('Erro', 'Não foi possível alterar o anúncio.');
    }
  }

  function excluir(item) {
    Alert.alert(
      'Excluir anúncio',
      'Deseja realmente excluir este serviço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'servicos', item.id));
            } catch (erro) {
              console.log('Erro ao excluir:', erro);
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  }

  function abrirMenuAnuncio(item) {
    Alert.alert('Gerenciar anúncio', item.titulo || 'Serviço', [
      {
        text: item.ativo ? 'Desativar anúncio' : 'Ativar anúncio',
        onPress: () => alterarStatus(item),
      },
      {
        text: 'Editar anúncio',
        onPress: () =>
          navigation.navigate('CadastroServico', { editar: item }),
      },
      {
        text: 'Excluir anúncio',
        style: 'destructive',
        onPress: () => excluir(item),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  const solicitacoes = contratacoes.filter(
    item => item.status === 'solicitada'
  );

  const andamento = contratacoes.filter(
    item => item.status === 'aceita'
  );

  const historico = contratacoes.filter(
    item => ['concluida', 'recusada'].includes(item.status)
  );

  const contagens = {
    solicitacoes: solicitacoes.length,
    andamento: andamento.length,
    anuncios: servicos.length,
    historico: historico.length,
  };

  let listaAtual = [];

  if (aba === 'solicitacoes') listaAtual = solicitacoes;
  if (aba === 'andamento') listaAtual = andamento;
  if (aba === 'historico') listaAtual = historico;
  if (aba === 'anuncios') listaAtual = servicos;

  const mensagensVazias = {
    solicitacoes: 'Quando um cliente solicitar um serviço, ele aparecerá aqui.',
    andamento: 'Você não tem serviços em andamento no momento.',
    historico: 'Seus serviços concluídos e recusados aparecerão aqui.',
    anuncios: 'Você ainda não publicou nenhum serviço.',
  };

  function renderContratacao({ item }) {
    const statusColor =
      item.status === 'aceita'
        ? '#2878C8'
        : item.status === 'concluida'
          ? '#239765'
          : item.status === 'recusada'
            ? '#D9534F'
            : '#B7791F';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopo}>
          <View style={styles.cardTituloArea}>
            <Text style={styles.nome}>{item.tituloServico}</Text>
            <Text style={styles.cliente}>
              Cliente: {item.nomeCliente}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${statusColor}18` },
            ]}
          >
            <View
              style={[
                styles.statusPonto,
                { backgroundColor: statusColor },
              ]}
            />

            <Text style={[styles.statusTexto, { color: statusColor }]}>
              {STATUS_LABEL[item.status] || item.status}
            </Text>
          </View>
        </View>

        {item.status === 'solicitada' && (
          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.botaoAceitar}
              onPress={() => confirmarAcao(item, 'aceita')}
              activeOpacity={0.85}
            >
              <Text style={styles.textoBotaoPrincipal}>Aceitar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoRecusar}
              onPress={() => confirmarAcao(item, 'recusada')}
              activeOpacity={0.85}
            >
              <Text style={styles.textoBotaoSecundario}>Recusar</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'aceita' && (
          <TouchableOpacity
            style={styles.botaoConcluir}
            onPress={() => confirmarAcao(item, 'concluida')}
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotaoPrincipal}>
              ✓ Confirmar conclusão
            </Text>
          </TouchableOpacity>
        )}

        {item.status === 'concluida' && (
          <Text style={styles.notaCard}>
            Serviço concluído. Aguardando avaliação do cliente.
          </Text>
        )}
      </View>
    );
  }

  function renderAnuncio({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTopo}>
          <View style={styles.cardTituloArea}>
            <Text style={styles.nome}>{item.titulo}</Text>

            {!!item.categoria && (
              <Text style={styles.categoria}>{item.categoria}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.menuBotao}
            onPress={() => abrirMenuAnuncio(item)}
            accessibilityRole="button"
            accessibilityLabel={`Gerenciar anúncio ${item.titulo}`}
          >
            <Text style={styles.menuTexto}>•••</Text>
          </TouchableOpacity>
        </View>

        {!!(item.bairro || item.cidade) && (
          <Text style={styles.local}>
            {item.bairro ? `${item.bairro}` : ''}
            {item.bairro && item.cidade ? ' · ' : ''}
            {item.cidade || ''}
          </Text>
        )}

        <View style={styles.anuncioRodape}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: item.ativo ? '#E8F6EF' : '#FCEEEE',
              },
            ]}
          >
            <View
              style={[
                styles.statusPonto,
                {
                  backgroundColor: item.ativo ? '#239765' : '#D9534F',
                },
              ]}
            />

            <Text
              style={[
                styles.statusTexto,
                { color: item.ativo ? '#239765' : '#D9534F' },
              ]}
            >
              {item.ativo ? 'Publicado' : 'Desativado'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => abrirMenuAnuncio(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.linkGerenciar}>Gerenciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
      >
        <View style={styles.cabecalho}>
          <View>
            <Text style={styles.titulo}>Meus serviços</Text>
            <Text style={styles.subtitulo}>
              Gerencie seus trabalhos
            </Text>
          </View>
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>
              {contagens.solicitacoes}
            </Text>
            <Text style={styles.resumoLabel}>Solicitações</Text>
          </View>

          <View style={styles.resumoDivisor} />

          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>
              {contagens.andamento}
            </Text>
            <Text style={styles.resumoLabel}>Em andamento</Text>
          </View>

          <View style={styles.resumoDivisor} />

          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>
              {contagens.anuncios}
            </Text>
            <Text style={styles.resumoLabel}>Anúncios</Text>
          </View>
        </View>

        <View style={styles.abas}>
          {ABAS.map(item => {
            const ativa = aba === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.aba, ativa && styles.abaAtiva]}
                onPress={() => setAba(item.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoAba,
                    ativa && styles.textoAbaAtiva,
                  ]}
                >
                  {item.titulo}
                </Text>

                <View
                  style={[
                    styles.contadorAba,
                    ativa && styles.contadorAbaAtivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.contadorTexto,
                      ativa && styles.contadorTextoAtivo,
                    ]}
                  >
                    {contagens[item.id]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.secaoCabecalho}>
          <Text style={styles.secaoTitulo}>
            {ABAS.find(item => item.id === aba)?.titulo}
          </Text>

          {aba === 'anuncios' && (
            <TouchableOpacity
              style={styles.adicionar}
              onPress={() => navigation.navigate('CadastroServico')}
              activeOpacity={0.85}
            >
              <Text style={styles.adicionarTexto}>＋ Novo</Text>
            </TouchableOpacity>
          )}
        </View>

        {carregando ? (
          <View style={styles.carregando}>
            <ActivityIndicator
              size="small"
              color={CORES.primaria}
            />
            <Text style={styles.vazio}>
              Carregando seus serviços...
            </Text>
          </View>
        ) : listaAtual.length === 0 ? (
          <View style={styles.vazioCard}>
            <View style={styles.vazioIcone}>
              <Text style={styles.vazioIconeTexto}>◇</Text>
            </View>

            <Text style={styles.vazioTitulo}>
              Nada por aqui ainda
            </Text>

            <Text style={styles.vazioDescricao}>
              {mensagensVazias[aba]}
            </Text>

            {aba === 'anuncios' && (
              <TouchableOpacity
                style={styles.botaoVazio}
                onPress={() => navigation.navigate('CadastroServico')}
                activeOpacity={0.85}
              >
                <Text style={styles.textoBotaoPrincipal}>
                  Publicar serviço
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={listaAtual}
            keyExtractor={item => item.id}
            renderItem={
              aba === 'anuncios'
                ? renderAnuncio
                : renderContratacao
            }
            scrollEnabled={false}
            contentContainerStyle={styles.lista}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  conteudo: {
    padding: 18,
    paddingBottom: 36,
  },

  cabecalho: {
    marginTop: 12,
    marginBottom: 20,
  },

  titulo: {
    fontSize: 27,
    fontWeight: '800',
    color: CORES.escura,
    letterSpacing: -0.6,
  },

  subtitulo: {
    color: '#858B96',
    fontSize: 14,
    marginTop: 5,
  },

  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 8,
    marginBottom: 22,
    elevation: 2,
    shadowColor: '#172033',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },

  resumoItem: {
    flex: 1,
    alignItems: 'center',
  },

  resumoNumero: {
    fontSize: 23,
    fontWeight: '800',
    color: CORES.escura,
  },

  resumoLabel: {
    color: '#858B96',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  resumoDivisor: {
    width: 1,
    height: 34,
    backgroundColor: '#ECEEF1',
  },

  abas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },

  aba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EAECF0',
  },

  abaAtiva: {
    backgroundColor: CORES.primaria,
  },

  textoAba: {
    color: '#687080',
    fontSize: 12,
    fontWeight: '700',
  },

  textoAbaAtiva: {
    color: '#FFFFFF',
  },

  contadorAba: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  contadorAbaAtivo: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  contadorTexto: {
    color: '#687080',
    fontSize: 10,
    fontWeight: '800',
  },

  contadorTextoAtivo: {
    color: '#FFFFFF',
  },

  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  secaoTitulo: {
    color: CORES.escura,
    fontSize: 18,
    fontWeight: '800',
  },

  adicionar: {
    backgroundColor: CORES.primaria,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 9,
  },

  adicionarTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  lista: {
    paddingBottom: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F3',
    elevation: 1,
    shadowColor: '#172033',
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },

  cardTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  cardTituloArea: {
    flex: 1,
  },

  nome: {
    color: CORES.escura,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },

  cliente: {
    color: '#858B96',
    fontSize: 12,
    marginTop: 6,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 20,
    gap: 6,
  },

  statusPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusTexto: {
    fontSize: 10,
    fontWeight: '800',
  },

  acoes: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },

  botaoAceitar: {
    flex: 1,
    backgroundColor: CORES.primaria,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },

  botaoRecusar: {
    flex: 1,
    backgroundColor: '#F2F3F5',
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },

  textoBotaoPrincipal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  textoBotaoSecundario: {
    color: '#626B79',
    fontSize: 12,
    fontWeight: '800',
  },

  botaoConcluir: {
    backgroundColor: CORES.primaria,
    padding: 13,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 15,
  },

  notaCard: {
    color: '#858B96',
    fontSize: 12,
    marginTop: 13,
  },

  categoria: {
    color: CORES.primaria,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  local: {
    color: '#858B96',
    fontSize: 12,
    marginTop: 12,
  },

  anuncioRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },

  menuBotao: {
    width: 34,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F7',
  },

  menuTexto: {
    color: '#687080',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  linkGerenciar: {
    color: CORES.primaria,
    fontSize: 12,
    fontWeight: '800',
  },

  carregando: {
    alignItems: 'center',
    paddingVertical: 42,
    gap: 10,
  },

  vazio: {
    color: '#858B96',
    fontSize: 13,
    textAlign: 'center',
  },

  vazioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF0F3',
  },

  vazioIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  vazioIconeTexto: {
    color: CORES.primaria,
    fontSize: 27,
    fontWeight: '700',
  },

  vazioTitulo: {
    color: CORES.escura,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 7,
  },

  vazioDescricao: {
    color: '#858B96',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  botaoVazio: {
    backgroundColor: CORES.primaria,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 18,
  },
});
