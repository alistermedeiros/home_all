
const { onCall, HttpsError } =
  require('firebase-functions/v2/https');

const { initializeApp } =
  require('firebase-admin/app');

const {
  getFirestore,
  FieldValue,
} = require('firebase-admin/firestore');

initializeApp();

const db = getFirestore();

// Confirmação de conclusão da contratação.
// Somente o prestador pode solicitar a conclusão,
// e somente após a solicitação ter sido aceita.

exports.concluirContratacao = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Faça login.');
  }

  const { contratacaoId } = request.data;

  if (!contratacaoId) {
    throw new HttpsError('invalid-argument', 'Contratação inválida.');
  }

  const ref = db.collection('contratacoes').doc(contratacaoId);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists) {
      throw new HttpsError('not-found', 'Contratação não encontrada.');
    }

    const dados = snap.data();

    if (dados.prestadorId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Acesso negado.');
    }

    if (dados.status !== 'aceita') {
      throw new HttpsError(
        'failed-precondition',
        'A contratação precisa estar aceita.'
      );
    }

    transaction.update(ref, {
      status: 'concluida',
      concluidaEm: FieldValue.serverTimestamp(),
    });
  });

  return { sucesso: true };
});

// Publicação de avaliação validada.

exports.avaliarServico = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Faça login.');
  }

  const {
    contratacaoId,
    estrelas,
    comentario,
  } = request.data;

  if (
    !contratacaoId ||
    !Number.isInteger(estrelas) ||
    estrelas < 1 ||
    estrelas > 5 ||
    typeof comentario !== 'string' ||
    comentario.trim().length < 3 ||
    comentario.trim().length > 1000
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Dados da avaliação inválidos.'
    );
  }

  const contratacaoRef = db
    .collection('contratacoes')
    .doc(contratacaoId);

  // O ID da avaliação é igual ao da contratação.
  // Isso impede avaliações duplicadas.
  const avaliacaoRef = db
    .collection('avaliacoes')
    .doc(contratacaoId);

  await db.runTransaction(async (transaction) => {
    const contratacao = await transaction.get(contratacaoRef);
    const avaliacao = await transaction.get(avaliacaoRef);

    if (!contratacao.exists) {
      throw new HttpsError('not-found', 'Contratação não encontrada.');
    }

    const dados = contratacao.data();

    if (dados.clienteId !== request.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'Somente o cliente pode avaliar.'
      );
    }

    if (dados.status !== 'concluida') {
      throw new HttpsError(
        'failed-precondition',
        'A contratação ainda não foi concluída.'
      );
    }

    if (avaliacao.exists) {
      throw new HttpsError(
        'already-exists',
        'Esta contratação já foi avaliada.'
      );
    }

    const prestadorRef = db
      .collection('usuarios')
      .doc(dados.prestadorId);

    const servicoRef = db
      .collection('servicos')
      .doc(dados.servicoId);

    const prestador = await transaction.get(prestadorRef);
    const servico = await transaction.get(servicoRef);

    if (!prestador.exists || !servico.exists) {
      throw new HttpsError(
        'not-found',
        'Profissional ou serviço não encontrado.'
      );
    }

    const perfil = prestador.data();

    const nomeCliente = request.auth.token.name || 'Cliente AIKO';

    transaction.create(avaliacaoRef, {
      clienteId: request.auth.uid,
      nomeCliente,
      prestadorId: dados.prestadorId,
      servicoId: dados.servicoId,
      contratacaoId,
      estrelas,
      comentario: comentario.trim(),
      criadoEm: FieldValue.serverTimestamp(),
    });

    const servicoData = servico.data();

    const totalAnterior = servicoData.totalAvaliacoes || 0;
    const mediaAnterior = servicoData.mediaAvaliacoes || 0;

    const novoTotal = totalAnterior + 1;

    const novaMedia =
      ((mediaAnterior * totalAnterior) + estrelas) / novoTotal;

    transaction.update(servicoRef, {
      totalAvaliacoes: novoTotal,
      mediaAvaliacoes: Number(novaMedia.toFixed(2)),
    });

    // Média geral do profissional.
    // Avaliações são vinculadas aos serviços publicados.
    const mediaPerfil = perfil.mediaAvaliacoes || 0;
    const totalPerfil = perfil.totalAvaliacoes || 0;

    const novoTotalPerfil = totalPerfil + 1;

    const novaMediaPerfil =
      ((mediaPerfil * totalPerfil) + estrelas) /
      novoTotalPerfil;

    transaction.update(prestadorRef, {
      totalAvaliacoes: novoTotalPerfil,
      mediaAvaliacoes: Number(novaMediaPerfil.toFixed(2)),
    });
  });

  return { sucesso: true };
});
