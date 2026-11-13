
import { Text, View } from 'react-native';
import { CORES } from '../cores';

export default function Estrelas({
  valor = 0,
  tamanho = 18,
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((estrela) => (
        <Text
          key={estrela}
          style={{
            color: estrela <= valor
              ? CORES.destaque
              : '#D9DEE3',
            fontSize: tamanho,
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}
