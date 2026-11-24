
import { useEffect, useState } from 'react';

import {
    Image,
    ScrollView,
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

import { useAuth } from './AuthContext';
import Estrelas from './componentes/Estrelas';
import { CATEGORIAS, CORES } from './cores';
import { db } from './firebase';

// Imagens ilustrativas para cada categoria
const IMAGENS_CATEGORIAS = {
  'Pedreiro':
    'https://loremflickr.com/400/500/bricklayer,construction?lock=101',

  'Pintor':
    'https://loremflickr.com/400/500/house,painter,painting?lock=102',

  'Eletricista':
    'https://loremflickr.com/400/500/electrician,electrical?lock=103',

  'Encanador':
    'https://loremflickr.com/400/500/plumber,plumbing?lock=104',

  'Jardineiro':
    'https://loremflickr.com/400/500/gardener,garden?lock=105',

  'Diarista':
    'https://loremflickr.com/400/500/house,cleaning?lock=106',

  'Marceneiro':
    'https://loremflickr.com/400/500/carpenter,woodworking?lock=107',

  'Montador de móveis':
    'https://loremflickr.com/400/500/furniture,assembly?lock=108',

  'Ar-condicionado':
    'https://loremflickr.com/400/500/air,conditioning,technician?lock=109',

  'Outros':
    'https://loremflickr.com/400/500/handyman,home,repair?lock=110',
};

// Ícones para usar caso não exista imagem
const ICONES_CATEGORIAS = {
  'Pedreiro': '🧱',
  'Pintor': '🎨',
  'Eletricista': '💡',
  'Encanador': '🚰',
  'Jardineiro': '🌳',
  'Diarista': '🧹',
  'Marceneiro': '🪚',
  'Montador de móveis': '🛠️',
  'Ar-condicionado': '❄️',
  'Outros': '🔧',
};

export default function Home({ navigation }) {
  const { usuario } = useAuth();
  const [imagensComErro, setImagensComErro] = useState({});
  const [servicos, setServicos] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
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
          snapshot.docs.map(item => ({
            id: item.id,
            ...item.data(),
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

  // Filtra os serviços
  const filtrados = servicos.filter(item => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      (item.titulo || '').toLowerCase().includes(texto) ||
      (item.categoria || '').toLowerCase().includes(texto) ||
      (item.cidade || '').toLowerCase().includes(texto);

    const correspondeCategoria =
      !categoria || item.categoria === categoria;

    return correspondeBusca && correspondeCategoria;
  });

  // Obtém a imagem correspondente à categoria
  const obterImagemCategoria = categoriaServico => {
    const categoriaEncontrada = CATEGORIAS.find(
      item =>
        item.toLowerCase() ===
        (categoriaServico || '').toLowerCase()
    );

    return IMAGENS_CATEGORIAS[categoriaEncontrada];
  };

  // Obtém o ícone correspondente à categoria
  const obterIconeCategoria = categoriaServico => {
    const categoriaEncontrada = CATEGORIAS.find(
      item =>
        item.toLowerCase() ===
        (categoriaServico || '').toLowerCase()
    );

    return ICONES_CATEGORIAS[categoriaEncontrada] || '🛠️';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>AIKO</Text>
          <Text style={styles.subLogo}>HOME SERVICE</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Perfil')}
        >
          <Text style={styles.avatar}>
            {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.boasVindas}>
        <Text style={styles.titulo}>
          Olá, {usuario?.nome?.split(' ')[0] || 'Usuário'}!
        </Text>

        <Text style={styles.subtitulo}>
          O que você precisa hoje?
        </Text>
      </View>

      <TouchableOpacity
        style={styles.localizacao}
        onPress={() => navigation.navigate('Localizacao')}
      >
        <Text style={{ fontSize: 20 }}>📍</Text>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Sua localização</Text>

          <Text style={styles.valor}>
            {usuario?.cidade || 'Adicionar localização'}
          </Text>
        </View>

        <Text style={{ color: CORES.primaria }}>›</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.busca}
        placeholder="🔎  Qual serviço você procura?"
        placeholderTextColor={CORES.textoSecundario}
        value={busca}
        onChangeText={setBusca}
      />

      <View style={styles.tituloLinha}>
        <Text style={styles.tituloSecao}>Categorias</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Categorias')}
        >
          <Text style={styles.link}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {CATEGORIAS.map((item, index) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoria,
              categoria === item && styles.categoriaAtiva,
            ]}
            onPress={() =>
              setCategoria(categoria === item ? '' : item)
            }
          >
            <Text style={styles.emoji}>
              {[
                '🧱',
                '🎨',
                '💡',
                '🚰',
                '🌳',
                '🧹',
                '🪚',
                '🛠️',
                '❄️',
                '🔧',
              ][index]}
            </Text>

            <Text style={styles.nomeCategoria}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitulo}>
            É profissional?
          </Text>

          <Text style={styles.bannerTexto}>
            Divulgue seus serviços e encontre novos clientes!
          </Text>

          <TouchableOpacity
            style={styles.botaoBanner}
            onPress={() =>
              navigation.navigate('CadastroServico')
            }
          >
            <Text style={styles.botaoBannerTexto}>
              Oferecer serviço +
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 45 }}>🛠️</Text>
      </View>

      <View style={styles.tituloLinha}>
        <Text style={styles.tituloSecao}>
          Serviços disponíveis
        </Text>

        <Text style={styles.contador}>
          {filtrados.length} encontrados
        </Text>
      </View>

      {filtrados.map(item => {
        const avaliacao = resumoAvaliacoes[item.id];
        const media = avaliacao?.media || 0;
        const total = avaliacao?.total || 0;

        // Prioriza a imagem ilustrativa da categoria
        const imagemCategoria = obterImagemCategoria(
          item.categoria
        );

        // Usa a foto cadastrada pelo prestador como alternativa
        const imagemServico =
          imagemCategoria || item.imagens?.[0];

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('DetalhesServico', {
                servicoId: item.id,
              })
            }
          >
            {imagemServico && !imagensComErro[item.id] ? (
  <Image
    source={{ uri: imagemServico }}
    style={styles.foto}
    resizeMode="cover"
    onError={() => {
      setImagensComErro(prev => ({
        ...prev,
        [item.id]: true,
      }));
    }}
  />
) : (
  <View style={styles.fotoVazia}>
    <Text style={{ fontSize: 40 }}>
      {obterIconeCategoria(item.categoria)}
    </Text>
    <Text style={styles.nomeCategoria}>
      {item.categoria}
    </Text>
  </View>
)}

            <View style={styles.cardConteudo}>
              <Text style={styles.cardTitulo}>
                {item.titulo}
              </Text>

              <Text style={styles.cardDescricao}>
                {item.categoria}
              </Text>

              <Text style={styles.cardLocal}>
                📍 {item.bairro || ''} {item.cidade || ''}
              </Text>

              <View style={styles.avaliacao}>
                <Estrelas valor={Math.round(media)} />

                <Text style={styles.totalAvaliacoes}>
                  {total} avaliações
                </Text>
              </View>

              <Text style={styles.preco}>
                {item.preco
                  ? `A partir de R$ ${Number(item.preco).toFixed(2)}`
                  : 'Consultar preço'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {filtrados.length === 0 && (
        <Text style={styles.vazio}>
          Nenhum serviço encontrado.
        </Text>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
  },

  logo: {
    fontSize: 29,
    fontWeight: '900',
    color: CORES.primaria,
  },

  subLogo: {
    fontSize: 10,
    color: CORES.escura,
    letterSpacing: 2,
  },

  avatar: {
    backgroundColor: CORES.primaria,
    color: '#fff',
    width: 43,
    height: 43,
    borderRadius: 25,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    overflow: 'hidden',
  },

  boasVindas: {
    marginTop: 28,
    marginBottom: 20,
  },

  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: CORES.escura,
  },

  subtitulo: {
    color: CORES.textoSecundario,
    marginTop: 5,
  },

  localizacao: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },

  label: {
    color: CORES.textoSecundario,
    fontSize: 11,
  },

  valor: {
    color: CORES.escura,
    fontWeight: 'bold',
    marginTop: 3,
  },

  busca: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 13,
    marginBottom: 25,
    color: CORES.texto,
  },

  tituloLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },

  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.escura,
  },

  link: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },

  categoria: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 13,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 90,
  },

  categoriaAtiva: {
    backgroundColor: '#D9F0F1',
    borderColor: CORES.primaria,
    borderWidth: 1,
  },

  emoji: {
    fontSize: 27,
  },

  nomeCategoria: {
    fontSize: 11,
    marginTop: 8,
    color: CORES.escura,
    textAlign: 'center',
  },

  banner: {
    backgroundColor: CORES.escura,
    borderRadius: 17,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },

  bannerTitulo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
  },

  bannerTexto: {
    color: '#DDECEF',
    fontSize: 12,
    marginTop: 7,
    marginBottom: 14,
    maxWidth: 220,
  },

  botaoBanner: {
    backgroundColor: CORES.destaque,
    padding: 11,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },

  botaoBannerTexto: {
    color: CORES.escura,
    fontWeight: 'bold',
    fontSize: 12,
  },

  contador: {
    color: CORES.textoSecundario,
    fontSize: 11,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 13,
    flexDirection: 'row',
    gap: 13,
  },

  foto: {
    width: 105,
    height: 125,
    borderRadius: 11,
    backgroundColor: '#E6F2F3',
  },

  fotoVazia: {
    width: 105,
    height: 125,
    borderRadius: 11,
    backgroundColor: '#E6F2F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardConteudo: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },

  cardTitulo: {
    fontSize: 15,
    color: CORES.escura,
    fontWeight: 'bold',
  },

  cardDescricao: {
    color: CORES.primaria,
    fontSize: 12,
  },

  cardLocal: {
    color: CORES.textoSecundario,
    fontSize: 11,
  },

  avaliacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  totalAvaliacoes: {
    color: CORES.textoSecundario,
    fontSize: 10,
  },

  preco: {
    color: CORES.escura,
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 3,
  },

  vazio: {
    textAlign: 'center',
    padding: 30,
    color: CORES.textoSecundario,
  },
});
