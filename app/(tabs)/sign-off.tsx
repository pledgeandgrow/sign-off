import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignOffScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

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
            Gérez votre héritage numérique et vos dernières volontés
          </Text>
        </View>

        {/* Configure Sign-off Button */}
        <TouchableOpacity
          style={[styles.configureButton, { 
            backgroundColor: colors.purple.primary,
            borderColor: colors.purple.secondary
          }]}
          onPress={() => router.push('/signoff' as any)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#FFFFFF" />
          <View style={styles.configureButtonContent}>
            <Text style={styles.configureButtonTitle}>Configurer Sign-off</Text>
            <Text style={styles.configureButtonSubtitle}>
              Choisissez votre méthode de détection
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* View Inheritance Plans Button */}
        <TouchableOpacity
          style={[styles.inheritancePlanButton, { 
            backgroundColor: colors.purple.primary,
            borderColor: colors.purple.secondary
          }]}
          onPress={() => router.push('/inheritance' as any)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#FFFFFF" />
          <View style={styles.inheritancePlanContent}>
            <Text style={styles.inheritancePlanTitle}>Voir les Plans d'Héritage</Text>
            <Text style={styles.inheritancePlanSubtitle}>
              Gérez vos plans de succession numérique
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  inheritancePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inheritancePlanContent: {
    flex: 1,
    marginLeft: 16,
  },
  inheritancePlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inheritancePlanSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  configureButtonContent: {
    flex: 1,
    marginLeft: 16,
  },
  configureButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  configureButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default SignOffScreen;
