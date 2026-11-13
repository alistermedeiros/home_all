
import {
    FlatList, StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';

import { CATEGORIAS, CORES } from './cores';

const icones = ['🧱','🎨','💡','🚰','🌳','🧹','🪚','🛠️','❄️','🔧'];

export default function Categorias({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Todas as categorias</Text>

      <FlatList
        data={CATEGORIAS}
        numColumns={2}
        keyExtractor={item => item}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Buscar', {
              categoria: item,
            })}
          >
            <Text style={styles.icone}>{icones[index]}</Text>
            <Text style={styles.nome}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo, padding: 18 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: CORES.escura, marginVertical: 20 },
  card: {
    flex: 1, backgroundColor: '#fff', margin: 6,
    padding: 22, borderRadius: 14, alignItems: 'center',
  },
  icone: { fontSize: 32 },
  nome: { color: CORES.escura, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
});
