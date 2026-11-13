

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Ionicons } from '@expo/vector-icons';

import Avaliacoes from './Avaliacoes';
import Busca from './Busca';
import CadastroServico from './CadastroServico';
import Categorias from './Categorias';
import Contatos from './Contatos';
import DetalhesServico from './DetalhesServico';
import Favoritos from './Favoritos';
import Home from './Home';
import Localizacao from './Localizacao';
import MeusServicos from './MeusServicos';
import Perfil from './Perfil';

import { CORES } from './cores';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MenuPrincipal() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: CORES.primaria,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
  height: 120,
  paddingBottom: 12,
  paddingTop: 8,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#EEEEEE',
  elevation: 10,
},

tabBarItemStyle: {
  justifyContent: 'center',
  alignItems: 'center',
},

tabBarLabelStyle: {
  fontSize: 11,
  fontWeight: '600',
  marginBottom: 2,
},
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Inicio: 'home-outline',
            Buscar: 'search-outline',
            Favoritos: 'heart-outline',
            Servicos: 'briefcase-outline',
            Perfil: 'person-outline',
          };

          return (
            <Ionicons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Inicio" component={Home} />
      <Tab.Screen name="Buscar" component={Busca} />
      <Tab.Screen name="Favoritos" component={Favoritos} />
      <Tab.Screen name="Servicos" component={MeusServicos} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
}

export default function Navegacao() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Principal"
        component={MenuPrincipal}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CadastroServico"
        component={CadastroServico}
        options={{ title: 'Oferecer serviço' }}
      />

      <Stack.Screen
        name="DetalhesServico"
        component={DetalhesServico}
        options={{ title: 'Detalhes do serviço' }}
      />

      <Stack.Screen
        name="Localizacao"
        component={Localizacao}
        options={{ title: 'Localização' }}
      />

      <Stack.Screen
        name="Avaliacoes"
        component={Avaliacoes}
        options={{ title: 'Avaliações' }}
      />

      <Stack.Screen
        name="Contatos"
        component={Contatos}
        options={{ title: 'Contatos' }}
      />

      <Stack.Screen
        name="Categorias"
        component={Categorias}
        options={{ title: 'Categorias' }}
      />
    </Stack.Navigator>
  );
}
