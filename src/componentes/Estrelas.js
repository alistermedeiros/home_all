
import { StyleSheet, Text, View } from 'react-native';

export default function Estrelas({ valor = 0 }) {
  const quantidade = Math.max(
    0,
    Math.min(5, Math.round(Number(valor) || 0))
  );

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((estrela) => (
        <Text key={estrela} style={styles.estrela}>
          {estrela <= quantidade ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estrela: {
    color: '#F5A623',
    fontSize: 17,
    marginRight: 2,
  },
});
