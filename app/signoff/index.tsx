import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getInheritancePlans } from '@/lib/services/inheritanceService';
import { saveGlobalTrigger, getGlobalTrigger, GlobalTriggerMethod } from '@/lib/services/globalTriggerService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import DateTimePicker from '@react-native-community/datetimepicker';

const DETECTION_METHODS = [
  {
    id: 'inactivity',
    title: 'Inactivité prolongée',
    description: 'Détection après X jours sans connexion',
    icon: 'clock-outline',
    color: '#3B82F6',
  },
  {
    id: 'death_certificate',
    title: 'Certificat de décès',
    description: 'Vérification par document officiel',
    icon: 'file-document',
    color: '#10B981',
  },
  {
    id: 'trusted_contact',
    title: 'Contact de confiance',
    description: 'Notification par une personne de confiance',
    icon: 'account-check',
    color: '#8B5CF6',
  },
  {
    id: 'heir_notification',
    title: 'Notifications aux héritiers',
    description: 'Alerte automatique envoyée aux héritiers',
    icon: 'bell-alert',
    color: '#EF4444',
  },
  {
    id: 'scheduled_date',
    title: 'Date programmée',
    description: 'Activation à une date spécifique',
    icon: 'calendar',
    color: '#F59E0B',
  },
  {
    id: 'manual_trigger',
    title: 'Déclenchement manuel',
    description: 'Activation manuelle par vous-même',
    icon: 'hand-back-right',
    color: '#EC4899',
  },
];

export default function SignOffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [isLoading, setIsLoading] = useState(true);
  const [inheritancePlanId, setInheritancePlanId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  // Method-specific settings
  const [inactivityDays, setInactivityDays] = useState('90');
  const [trustedContactEmail, setTrustedContactEmail] = useState('');
  const [trustedContactName, setTrustedContactName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load inheritance plans
      const plans = await getInheritancePlans(user.id);
      if (plans && plans.length > 0) {
        // Use the first active plan or the first plan
        const activePlan = plans.find(p => p.is_active) || plans[0];
        setInheritancePlanId(activePlan.id);
      }
      
      // Load saved global trigger settings
      const globalTrigger = await getGlobalTrigger(user.id);
      if (globalTrigger) {
        setSelectedMethod(globalTrigger.method);
        
        // Load method-specific settings
        if (globalTrigger.settings) {
          if (globalTrigger.settings.days) {
            setInactivityDays(globalTrigger.settings.days.toString());
          }
          if (globalTrigger.settings.contactEmail) {
            setTrustedContactEmail(globalTrigger.settings.contactEmail);
          }
          if (globalTrigger.settings.contactName) {
            setTrustedContactName(globalTrigger.settings.contactName);
          }
          if (globalTrigger.settings.date) {
            setScheduledDate(new Date(globalTrigger.settings.date));
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Échec du chargement des paramètres');
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleSaveMethod = async () => {
    if (!selectedMethod || !user) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de déclenchement');
      return;
    }

    // Validate method-specific settings
    if (selectedMethod === 'inactivity' && (!inactivityDays || parseInt(inactivityDays) < 1)) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de jours valide');
      return;
    }
    if (selectedMethod === 'trusted_contact' && (!trustedContactEmail || !trustedContactName)) {
      Alert.alert('Erreur', 'Veuillez renseigner le nom et l\'email du contact de confiance');
      return;
    }

    try {
      // Prepare settings object
      const settings: any = {};
      if (selectedMethod === 'inactivity') {
        settings.days = parseInt(inactivityDays);
      } else if (selectedMethod === 'trusted_contact') {
        settings.contactEmail = trustedContactEmail;
        settings.contactName = trustedContactName;
      } else if (selectedMethod === 'scheduled_date') {
        settings.date = scheduledDate.toISOString();
      }

      // Save global trigger method to Supabase
      await saveGlobalTrigger(user.id, selectedMethod as GlobalTriggerMethod, settings);

      Alert.alert(
        'Déclencheur Global Enregistré',
        `La méthode "${DETECTION_METHODS.find(m => m.id === selectedMethod)?.title}" s'appliquera à tous vos plans d'héritage actifs.`,
        [
          { 
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving global trigger:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'enregistrer le déclencheur global. Veuillez réessayer.'
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: 'Sign-Off Settings',
            headerBackTitle: 'Back',
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Déclencheur Global',
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Déclencheur Global</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Configuration globale pour tous vos plans d'héritage
          </Text>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { 
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={24} color="#3B82F6" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Déclencheur Global</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Cette méthode s'appliquera à TOUS vos plans d'héritage. Une fois déclenchée, tous vos plans actifs seront exécutés automatiquement.
          </Text>
        </View>

        {/* Detection Methods */}
        <View style={styles.methodsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Méthode de Déclenchement Global
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary, marginBottom: 16 }]}>
            Choisissez comment votre décès sera détecté pour activer automatiquement tous vos plans d'héritage
          </Text>
          
          {DETECTION_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: selectedMethod === method.id ? method.color : 'rgba(255, 255, 255, 0.1)',
                  borderWidth: selectedMethod === method.id ? 2 : 1,
                }
              ]}
              onPress={() => handleMethodSelect(method.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                <MaterialCommunityIcons name={method.icon as any} size={24} color={method.color} />
              </View>
              <View style={styles.methodContent}>
                <Text style={[styles.methodTitle, { color: colors.text }]}>{method.title}</Text>
                <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>
                  {method.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={selectedMethod === method.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={24}
                color={selectedMethod === method.id ? method.color : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Method-specific Configuration */}
        {selectedMethod === 'inactivity' && (
          <View style={[styles.configCard, { 
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)'
          }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Configuration de l'inactivité</Text>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Nombre de jours sans connexion</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: colors.text
              }]}
              value={inactivityDays}
              onChangeText={setInactivityDays}
              keyboardType="number-pad"
              placeholder="90"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.configHint, { color: colors.textSecondary }]}>
              Après {inactivityDays || '90'} jours sans connexion, vos plans d'héritage seront activés
            </Text>
          </View>
        )}

        {selectedMethod === 'trusted_contact' && (
          <View style={[styles.configCard, { 
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: 'rgba(139, 92, 246, 0.3)'
          }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Contact de confiance</Text>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Nom du contact</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: colors.text
              }]}
              value={trustedContactName}
              onChangeText={setTrustedContactName}
              placeholder="Jean Dupont"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.configLabel, { color: colors.textSecondary, marginTop: 12 }]}>Email du contact</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: colors.text
              }]}
              value={trustedContactEmail}
              onChangeText={setTrustedContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="contact@example.com"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.configHint, { color: colors.textSecondary }]}>
              Cette personne pourra signaler votre décès pour activer vos plans
            </Text>
          </View>
        )}

        {selectedMethod === 'scheduled_date' && (
          <View style={[styles.configCard, { 
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.3)'
          }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Date programmée</Text>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Date d'activation</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={colors.text} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {scheduledDate.toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setScheduledDate(date);
                }}
                minimumDate={new Date()}
              />
            )}
            <Text style={[styles.configHint, { color: colors.textSecondary }]}>
              Vos plans seront activés automatiquement à cette date
            </Text>
          </View>
        )}

        {selectedMethod === 'death_certificate' && (
          <View style={[styles.configCard, { 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.3)'
          }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Certificat de décès</Text>
            <Text style={[styles.configDescription, { color: colors.textSecondary }]}>
              Vos héritiers devront fournir un certificat de décès officiel pour activer les plans d'héritage. Le document sera vérifié avant l'activation.
            </Text>
          </View>
        )}

        {selectedMethod === 'heir_notification' && (
          <View style={[styles.configCard, { 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Notifications aux héritiers</Text>
            <Text style={[styles.configDescription, { color: colors.textSecondary }]}>
              Des notifications seront envoyées régulièrement à vos héritiers. Si vous ne répondez pas après plusieurs tentatives, les plans seront activés.
            </Text>
          </View>
        )}

        {selectedMethod === 'manual_trigger' && (
          <View style={[styles.configCard, { 
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderColor: 'rgba(236, 72, 153, 0.3)'
          }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Déclenchement manuel</Text>
            <Text style={[styles.configDescription, { color: colors.textSecondary }]}>
              Vous pourrez activer manuellement vos plans d'héritage quand vous le souhaitez. Cette option est utile pour les situations prévues.
            </Text>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.purple.primary, opacity: selectedMethod ? 1 : 0.5 }]}
          onPress={handleSaveMethod}
          activeOpacity={0.8}
          disabled={!selectedMethod}
        >
          <MaterialIcons name="check" size={20} color="white" />
          <Text style={styles.saveButtonText}>Enregistrer le Déclencheur Global</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  methodsSection: {
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  configCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  configDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  configHint: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 40,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
