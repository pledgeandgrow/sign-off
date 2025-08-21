import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const SignOffScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handleSignOff = () => {
    Alert.alert(
      'Confirmation Sign-off',
      'Êtes-vous absolument sûr de vouloir initier le processus de sign-off ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement sign-off logic
            console.log('Sign-off confirmed');
            Alert.alert('Sign-off initié', 'Le processus de sign-off a été lancé avec succès.');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Mock data - in real app, this would come from context/state
  const signOffStats = {
    heirsCount: 2,
    vaultsCount: 3,
    documentsCount: 12,
    finalMessage: 'Message final configuré',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Sign-off</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Configurez vos dernières volontés et votre héritage numérique
          </Text>
        </View>

        {/* Warning Card */}
        <View style={[styles.warningCard, { 
          backgroundColor: 'rgba(255, 149, 0, 0.1)',
          borderColor: 'rgba(255, 149, 0, 0.3)'
        }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="warning" size={24} color="#FF9500" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Avis Important</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Cette action initiera le processus de sign-off. Assurez-vous d'avoir complété toutes les préparations nécessaires avant de continuer.
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vue d'ensemble de votre plan
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.purple.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{signOffStats.heirsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Héritiers</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <MaterialIcons name="lock" size={20} color={colors.purple.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{signOffStats.vaultsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coffres-forts</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <MaterialIcons name="description" size={20} color={colors.purple.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{signOffStats.documentsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Documents</Text>
            </View>
          </View>
        </View>

        {/* Sign-off Plan Details */}
        <View style={[styles.planSection, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Détails de votre plan Sign-off
          </Text>
          
          <View style={styles.planItem}>
            <View style={[styles.planIcon, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
              <MaterialCommunityIcons name="account-group" size={20} color="#4CAF50" />
            </View>
            <View style={styles.planContent}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Héritiers notifiés</Text>
              <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                {signOffStats.heirsCount} héritiers sélectionnés
              </Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
          
          <View style={styles.planItem}>
            <View style={[styles.planIcon, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
              <MaterialIcons name="lock" size={20} color="#2196F3" />
            </View>
            <View style={styles.planContent}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Documents sécurisés</Text>
              <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                {signOffStats.documentsCount} éléments protégés
              </Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
          
          <View style={styles.planItem}>
            <View style={[styles.planIcon, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
              <MaterialIcons name="message" size={20} color="#9C27B0" />
            </View>
            <View style={styles.planContent}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Message final</Text>
              <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
                {signOffStats.finalMessage}
              </Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.signOffButton, { backgroundColor: colors.error }]}
            onPress={handleSignOff}
            activeOpacity={0.8}
          >
            <MaterialIcons name="power-settings-new" size={20} color="white" />
            <Text style={styles.signOffButtonText}>Initier le Sign-off</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.setupButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}
            onPress={() => router.push('/(tabs)/vaults')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="settings" size={20} color={colors.purple.primary} />
            <Text style={[styles.setupButtonText, { color: colors.text }]}>
              Configurer le plan Sign-off
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Pour éviter que le contenu soit caché par la tab bar
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  warningCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  planSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: 14,
  },
  actionButtons: {
    gap: 12,
  },
  signOffButton: {
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signOffButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  setupButton: {
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SignOffScreen;
