
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const functions = getFunctions(auth.app, 'southamerica-east1');

export async function concluirServico(contratacaoId) {
  const funcao = httpsCallable(functions, 'concluirContratacao');

  return funcao({ contratacaoId });
}

export async function enviarAvaliacao({
  contratacaoId,
  estrelas,
  comentario,
}) {
  const funcao = httpsCallable(functions, 'avaliarServico');

  return funcao({
    contratacaoId,
    estrelas,
    comentario,
  });
}
