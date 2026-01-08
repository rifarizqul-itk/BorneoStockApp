import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Perlu: npx expo install expo-linear-gradient

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header dengan Gradient agar Terasa Premium */}
      <View style={styles.headerContainer}>
        <Text style={styles.brandTitle}>BORNEO</Text>
        <Text style={styles.brandSubtitle}>Specialis Ponsel</Text>
      </View>

      <View style={styles.content}>
        {/* Ringkasan Stok dalam Bentuk Card */}
        <View style={styles.summaryRow}>
          <View style={[styles.card, styles.shadow]}>
            <Text style={styles.cardLabel}>Total Stok</Text>
            <Text style={styles.cardValue}>1,240</Text>
          </View>
          <View style={[styles.card, styles.shadow, { borderLeftColor: '#FF3B30', borderLeftWidth: 5 }]}>
            <Text style={styles.cardLabel}>Stok Habis</Text>
            <Text style={[styles.cardValue, { color: '#FF3B30' }]}>12</Text>
          </View>
        </View>

        {/* Menu Utama dengan Icon Besar */}
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.shadow]} 
          onPress={() => router.push('/scan' as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#1A73E8' }]}>
            <Ionicons name="barcode-outline" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.menuTitle}>Scan Barcode</Text>
            <Text style={styles.menuDesc}>Input atau cari barang via kamera</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.shadow]} 
          onPress={() => router.push('/inventory' as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#34A853' }]}>
            <Ionicons name="cube-outline" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.menuTitle}>Manajemen Stok</Text>
            <Text style={styles.menuDesc}>Lihat dan edit semua data barang</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerContainer: { 
    backgroundColor: '#1A73E8', 
    paddingTop: 60, 
    paddingBottom: 40, 
    paddingHorizontal: 25,
    borderBottomRightRadius: 50 
  },
  brandTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandSubtitle: { fontSize: 16, color: '#E0E0E0', fontWeight: '500' },
  content: { paddingHorizontal: 20, marginTop: -30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  card: { 
    backgroundColor: '#fff', 
    width: '47%', 
    padding: 15, 
    borderRadius: 15, 
  },
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  menuItem: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 15 
  },
  iconCircle: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  menuDesc: { fontSize: 12, color: '#888' }
});