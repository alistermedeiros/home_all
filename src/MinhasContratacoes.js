
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuth } from './AuthContext';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';

import { auth, db } from './firebase';

// Mascara o e-mail no estilo Shopee
function mascararEmail(email) {
    if (!email || !email.includes('@')) {
        return null;
    }

    const [usuario, dominio] = email.split('@');
    const parteVisivel = usuario.slice(0, 2);

    return `${parteVisivel}***@${dominio}`;
}

export default function MinhasContratacoes() {
    const { usuario } = useAuth();

    const [contratacoes, setContratacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [contratacaoSelecionada, setContratacaoSelecionada] = useState(null);
    const [nota, setNota] = useState(5);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        carregarContratacoes();
    }, [usuario]);

    async function carregarContratacoes() {
        if (!usuario?.uid) {
            setCarregando(false);
            return;
        }

        try {
            setCarregando(true);

            const q = query(
                collection(db, 'contratacoes'),
                where('clienteId', '==', usuario.uid)
            );

            const resultado = await getDocs(q);

            const lista = await Promise.all(
                resultado.docs.map(async (contratacaoDoc) => {
                    const dados = contratacaoDoc.data();

                    let servico = {};
                    let prestador = {};
                    let avaliacao = null;

                    if (dados.servicoId) {
                        const servicoRef = doc(db, 'servicos', dados.servicoId);
                        const servicoSnap = await getDoc(servicoRef);

                        if (servicoSnap.exists()) {
                            servico = servicoSnap.data();
                        }
                    }

                    if (dados.prestadorId) {
                        const prestadorRef = doc(
                            db,
                            'usuarios',
                            dados.prestadorId
                        );

                        const prestadorSnap = await getDoc(prestadorRef);

                        if (prestadorSnap.exists()) {
                            prestador = prestadorSnap.data();
                        }
                    }

                    const avaliacaoRef = doc(
                        db,
                        'avaliacoes',
                        contratacaoDoc.id
                    );

                    const avaliacaoSnap = await getDoc(avaliacaoRef);

                    if (avaliacaoSnap.exists()) {
                        avaliacao = avaliacaoSnap.data();
                    }

                    return {
                        id: contratacaoDoc.id,
                        ...dados,
                        servico,
                        prestador,
                        avaliacao,
                    };
                })
            );

            setContratacoes(lista);
        } catch (error) {
            console.log('Erro ao carregar contratações:', error);
            Alert.alert(
                'Erro',
                'Não foi possível carregar suas contratações.'
            );
        } finally {
            setCarregando(false);
        }
    }

    async function enviarAvaliacao() {
        if (!contratacaoSelecionada) return;

        if (!comentario.trim()) {
            Alert.alert(
                'Atenção',
                'Escreva um comentário sobre o serviço.'
            );
            return;
        }

        if (!usuario?.uid) {
            Alert.alert(
                'Erro',
                'Não foi possível identificar sua conta.'
            );
            return;
        }

        try {
            setEnviando(true);

            const contratacao = contratacaoSelecionada;
            const email = auth.currentUser?.email;

            if (!email) {
                Alert.alert(
                    'E-mail não encontrado',
                    'Não foi possível identificar o e-mail da sua conta no Firebase Authentication.'
                );
                return;
            }

            const emailMascarado = mascararEmail(email);

            if (!emailMascarado) {
                Alert.alert(
                    'Erro',
                    'Não foi possível mascarar o e-mail da sua conta.'
                );
                return;
            }

            const avaliacaoRef = doc(
                db,
                'avaliacoes',
                contratacao.id
            );

            await setDoc(avaliacaoRef, {
                contratacaoId: contratacao.id,
                servicoId: contratacao.servicoId,
                prestadorId: contratacao.prestadorId,
                clienteId: usuario.uid,
                emailClienteMascarado: emailMascarado,
                nota: nota,
                comentario: comentario.trim(),
                criadoEm: serverTimestamp(),
            });

            Alert.alert(
                'Sucesso!',
                'Sua avaliação foi enviada.'
            );

            setContratacaoSelecionada(null);
            setComentario('');
            setNota(5);

            await carregarContratacoes();

        } catch (error) {
            console.log('Erro ao enviar avaliação:', error);

            Alert.alert(
                'Erro',
                'Não foi possível enviar sua avaliação. Verifique as permissões do Firebase.'
            );
        } finally {
            setEnviando(false);
        }
    }

    function renderEstrelas(selecionada, somenteLeitura = false) {
        return (
            <View style={styles.estrelas}>
                {[1, 2, 3, 4, 5].map((estrela) => (
                    <TouchableOpacity
                        key={estrela}
                        disabled={somenteLeitura}
                        onPress={() => setNota(estrela)}
                    >
                        <Text
                            style={[
                                styles.estrela,
                                estrela <= selecionada && styles.estrelaAtiva,
                            ]}
                        >
                            ★
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    function nomeServico(item) {
        return (
            item.servico?.titulo ||
            item.servico?.nome ||
            'Serviço contratado'
        );
    }

    function nomePrestador(item) {
        return (
            item.prestador?.nome ||
            item.prestador?.nomeCompleto ||
            'Prestador'
        );
    }

    function renderItem({ item }) {
        const concluida = item.status === 'concluida';
        const avaliada = !!item.avaliacao;

        return (
            <View style={styles.card}>
                <View style={styles.cardTopo}>
                    <View style={styles.info}>
                        <Text style={styles.servico}>
                            {nomeServico(item)}
                        </Text>

                        <Text style={styles.prestador}>
                            Prestador: {nomePrestador(item)}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.status,
                            concluida
                                ? styles.statusConcluido
                                : styles.statusOutro,
                        ]}
                    >
                        <Text style={styles.statusTexto}>
                            {item.status || 'Em andamento'}
                        </Text>
                    </View>
                </View>

                {item.servico?.preco != null && (
                    <Text style={styles.preco}>
                        R$ {Number(item.servico.preco).toFixed(2).replace('.', ',')}
                    </Text>
                )}

                {avaliada ? (
                    <View style={styles.avaliacaoExistente}>
                        <Text style={styles.avaliacaoTitulo}>
                            Sua avaliação
                        </Text>

                        {renderEstrelas(item.avaliacao.nota, true)}

                        <Text style={styles.comentarioExistente}>
                            "{item.avaliacao.comentario}"
                        </Text>

                        <Text style={styles.avaliado}>
                            <Text>✓ </Text>
                            Você já avaliou este serviço
                        </Text>
                    </View>
                ) : concluida ? (
                    contratacaoSelecionada?.id === item.id ? (
                        <View style={styles.formulario}>
                            <Text style={styles.formTitulo}>
                                Avalie este serviço
                            </Text>

                            <Text style={styles.label}>
                                Sua nota
                            </Text>

                            {renderEstrelas(nota)}

                            <Text style={styles.label}>
                                Seu comentário
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Conte como foi sua experiência..."
                                placeholderTextColor="#999"
                                multiline
                                value={comentario}
                                onChangeText={setComentario}
                                maxLength={500}
                                textAlignVertical="top"
                                returnKeyType="default"
                            />

                            <Text style={styles.contador}>
                                {comentario.length}/500
                            </Text>

                            <View style={styles.acoes}>
                                <TouchableOpacity
                                    style={styles.botaoCancelar}
                                    onPress={() => {
                                        setContratacaoSelecionada(null);
                                        setComentario('');
                                        setNota(5);
                                    }}
                                >
                                    <Text style={styles.textoCancelar}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.botaoEnviar}
                                    onPress={enviarAvaliacao}
                                    disabled={enviando}
                                >
                                    {enviando ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.textoEnviar}>
                                            Enviar avaliação
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.botaoAvaliar}
                            onPress={() => {
                                setContratacaoSelecionada(item);
                                setNota(5);
                                setComentario('');
                            }}
                        >
                            <Text style={styles.textoBotaoAvaliar}>
                                ★ Avaliar serviço
                            </Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <Text style={styles.aguardando}>
                        Você poderá avaliar quando o serviço for concluído.
                    </Text>
                )}
            </View>
        );
    }

    if (carregando) {
        return (
            <View style={styles.carregando}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.carregandoTexto}>
                    Carregando contratações...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <View style={styles.container}>
                <Text style={styles.titulo}>
                    Minhas Contratações
                </Text>

                <Text style={styles.subtitulo}>
                    Acompanhe seus serviços e avalie sua experiência.
                </Text>

                <FlatList
                    data={contratacoes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    refreshing={carregando}
                    onRefresh={carregarContratacoes}
                    ListEmptyComponent={
                        <View style={styles.vazio}>
                            <Text style={styles.iconeVazio}>📋</Text>
                            <Text style={styles.vazioTitulo}>
                                Nenhuma contratação encontrada
                            </Text>
                            <Text style={styles.vazioTexto}>
                                Quando você contratar um serviço, ele aparecerá aqui.
                            </Text>
                        </View>
                    }
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FB',
        paddingTop: 20,
    },
    titulo: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#172033',
        marginHorizontal: 20,
    },
    subtitulo: {
        fontSize: 14,
        color: '#778197',
        marginHorizontal: 20,
        marginTop: 6,
        marginBottom: 18,
    },
    lista: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 17,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E9EDF4',
    },
    cardTopo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    info: {
        flex: 1,
        paddingRight: 8,
    },
    servico: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#172033',
    },
    prestador: {
        fontSize: 13,
        color: '#778197',
        marginTop: 6,
    },
    status: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusConcluido: {
        backgroundColor: '#DCFCE7',
    },
    statusOutro: {
        backgroundColor: '#EEF2FF',
    },
    statusTexto: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#334155',
        textTransform: 'capitalize',
    },
    preco: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2563EB',
        marginTop: 12,
    },
    botaoAvaliar: {
        backgroundColor: '#2563EB',
        borderRadius: 10,
        padding: 13,
        alignItems: 'center',
        marginTop: 17,
    },
    textoBotaoAvaliar: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    aguardando: {
        color: '#8A94A6',
        fontSize: 12,
        marginTop: 16,
    },
    avaliacaoExistente: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 13,
        marginTop: 17,
    },
    avaliacaoTitulo: {
        color: '#172033',
        fontWeight: 'bold',
        fontSize: 14,
    },
    estrelas: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 9,
    },
    estrela: {
        fontSize: 30,
        color: '#D1D5DB',
        marginRight: 5,
    },
    estrelaAtiva: {
        color: '#F59E0B',
    },
    comentarioExistente: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 20,
        marginTop: 3,
    },
    avaliado: {
        color: '#16A34A',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 12,
    },
    formulario: {
        borderTopWidth: 1,
        borderTopColor: '#EDF0F5',
        marginTop: 17,
        paddingTop: 15,
    },
    formTitulo: {
        color: '#172033',
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    label: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
        marginTop: 8,
    },
    input: {
        minHeight: 105,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        color: '#172033',
        fontSize: 14,
        backgroundColor: '#FFFFFF',
    },
    contador: {
        color: '#94A3B8',
        fontSize: 11,
        textAlign: 'right',
        marginTop: 5,
    },
    acoes: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    botaoCancelar: {
        flex: 1,
        padding: 13,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    textoCancelar: {
        color: '#475569',
        fontWeight: 'bold',
    },
    botaoEnviar: {
        flex: 1.5,
        padding: 13,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#2563EB',
    },
    textoEnviar: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    carregando: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FB',
    },
    carregandoTexto: {
        color: '#778197',
        marginTop: 12,
    },
    vazio: {
        alignItems: 'center',
        padding: 35,
        marginTop: 40,
    },
    iconeVazio: {
        fontSize: 45,
        marginBottom: 12,
    },
    vazioTitulo: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#172033',
        textAlign: 'center',
    },
    vazioTexto: {
        fontSize: 13,
        color: '#778197',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});
