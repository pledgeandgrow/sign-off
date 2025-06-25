import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SignOffScreen = () => {
  const router = useRouter();

  const handleSignOff = () => {
    // TODO: Implement sign-off logic
    console.log('Sign-off initiated');
    // This would trigger the sign-off process
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Sign Off</Text>
          <Text style={styles.subtitle}>
            Set up your final wishes and digital legacy
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="warning" size={24} color="#FF9500" />
            <Text style={styles.cardTitle}>Important Notice</Text>
          </View>
          <Text style={styles.cardText}>
            This action will initiate the sign-off process. Make sure you have completed all necessary preparations before proceeding.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Sign-Off Plan</Text>
          
          <View style={styles.planItem}>
            <MaterialCommunityIcons name="account-group" size={20} color="#4CAF50" />
            <Text style={styles.planText}>Heirs Notified: 0 selected</Text>
          </View>
          
          <View style={styles.planItem}>
            <MaterialIcons name="lock" size={20} color="#2196F3" />
            <Text style={styles.planText}>Documents Secured: 0 items</Text>
          </View>
          
          <View style={styles.planItem}>
            <MaterialIcons name="message" size={20} color="#9C27B0" />
            <Text style={styles.planText}>Final Message: Not set</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.signOffButton}
          onPress={handleSignOff}
        >
          <Text style={styles.signOffButtonText}>Initiate Sign-Off</Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.setupButton}
          onPress={() => router.push('/(tabs)/vaults')}
        >
          <Text style={styles.setupButtonText}>Set Up Sign-Off Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  planText: {
    fontSize: 15,
    color: '#000',
    marginLeft: 12,
  },
  signOffButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signOffButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  setupButton: {
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  setupButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignOffScreen;
