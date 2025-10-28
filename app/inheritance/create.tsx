import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useVault } from '@/contexts/VaultContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createInheritancePlan, getHeirsDecrypted, linkHeirsToPlan, createHeirVaultAccess } from '@/lib/services/inheritanceService';
import { canPerformAction } from '@/lib/services/subscriptionService';
import { HeirDecrypted } from '@/types/heir';

export default function CreateInheritancePlanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { vaults } = useVault();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heirs, setHeirs] = useState<HeirDecrypted[]>([]);
  
  // Form state
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<'full_access' | 'partial_access' | 'view_only' | 'destroy'>('full_access');
  const [selectedVaults, setSelectedVaults] = useState<string[]>([]);
  const [selectedHeirs, setSelectedHeirs] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Load heirs with decrypted data (no encryption for now, so pass empty string)
      const heirsData = await getHeirsDecrypted(user.id, '');
      setHeirs(heirsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load heirs');
    } finally {
      setLoading(false);
    }
  };

  const toggleVault = (vaultId: string) => {
    setSelectedVaults(prev =>
      prev.includes(vaultId)
        ? prev.filter(id => id !== vaultId)
        : [...prev, vaultId]
    );
  };

  const toggleHeir = (heirId: string) => {
    setSelectedHeirs(prev =>
      prev.includes(heirId)
        ? prev.filter(id => id !== heirId)
        : [...prev, heirId]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    if (!planName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de plan');
      return;
    }

    if (selectedVaults.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un coffre-fort');
      return;
    }

    if (selectedHeirs.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un héritier');
      return;
    }

    // Check if user can create inheritance plan (free tier limit)
    const { allowed, reason } = await canPerformAction(user.id, 'create_inheritance_plan');
    if (!allowed) {
      Alert.alert(
        'Limite atteinte',
        reason,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Passer au Premium', onPress: () => {
            router.back();
          }}
        ]
      );
      return;
    }

    try {
      setSaving(true);

      // Step 1: Create the inheritance plan (no encryption for now)
      // Note: Activation is now controlled by global user settings, not per-plan
      const plan = await createInheritancePlan(
        user.id,
        {
          plan_name: planName,
          plan_type: planType,
          instructions_encrypted: instructions, // Plain text for now
          is_active: true,
        },
        '' // No public key for now
      );

      // Step 2: Link selected heirs to this plan
      await linkHeirsToPlan(plan.id, selectedHeirs);

      // Step 3: Create heir_vault_access records for each heir-vault combination
      // Permissions based on plan type
      const permissions = {
        can_view: true,
        can_export: planType === 'full_access' || planType === 'partial_access',
        can_edit: planType === 'full_access',
      };

      await createHeirVaultAccess(selectedHeirs, selectedVaults, permissions);

      Alert.alert('Success', 'Inheritance plan created successfully with heir access configured');
      router.back();
    } catch (error) {
      console.error('Error creating plan:', error);
      Alert.alert('Error', 'Failed to create inheritance plan: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Create Inheritance Plan' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Create Inheritance Plan',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ padding: 8, marginLeft: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={[styles.headerInfo, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
          <MaterialCommunityIcons name="information" size={20} color={colors.purple.primary} />
          <Text style={[styles.headerInfoText, { color: colors.text }]}>
            Créez un plan pour gérer l'accès à vos coffres-forts après votre décès. Le déclenchement est contrôlé par vos paramètres globaux.
          </Text>
        </View>

        {/* Plan Name */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <MaterialCommunityIcons name="file-document-edit" size={18} color={colors.purple.primary} /> Nom du Plan
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
            value={planName}
            onChangeText={setPlanName}
            placeholder="Ex: Plan familial principal"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Plan Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <MaterialCommunityIcons name="shield-key" size={18} color={colors.purple.primary} /> Type d'Accès
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Définissez le niveau d'accès pour vos héritiers
          </Text>
          {[
            { value: 'full_access', label: 'Accès Complet', icon: 'key', desc: 'Voir, exporter et modifier' },
            { value: 'partial_access', label: 'Accès Partiel', icon: 'key-outline', desc: 'Voir et exporter uniquement' },
            { value: 'view_only', label: 'Lecture Seule', icon: 'eye', desc: 'Voir uniquement' },
            { value: 'destroy', label: 'Détruire', icon: 'delete-forever', desc: 'Supprimer toutes les données' }
          ].map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.optionCard,
                { 
                  borderColor: planType === type.value ? colors.purple.primary : colors.border,
                  backgroundColor: planType === type.value ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderWidth: planType === type.value ? 2 : 1,
                }
              ]}
              onPress={() => setPlanType(type.value as any)}
            >
              <View style={[styles.optionIcon, { backgroundColor: planType === type.value ? colors.purple.primary + '20' : 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={24}
                  color={planType === type.value ? colors.purple.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{type.label}</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{type.desc}</Text>
              </View>
              <MaterialCommunityIcons
                name={planType === type.value ? 'radiobox-marked' : 'radiobox-blank'}
                size={24}
                color={planType === type.value ? colors.purple.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Select Vaults */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <MaterialCommunityIcons name="lock-open" size={18} color={colors.purple.primary} /> Coffres-forts ({selectedVaults.length} sélectionné{selectedVaults.length !== 1 ? 's' : ''})
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choisissez les coffres auxquels vos héritiers auront accès
          </Text>
          <View style={[styles.infoCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: colors.purple.primary }]}>
            <MaterialCommunityIcons name="information" size={16} color={colors.purple.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Seuls les coffres "Partager après la mort" et "Gérer après la mort" peuvent être ajoutés aux plans d'héritage
            </Text>
          </View>
          {(() => {
            // Filter vaults: only share_after_death and handle_after_death
            const eligibleVaults = vaults.filter(v => 
              v.category === 'share_after_death' || v.category === 'handle_after_death'
            );
            
            return eligibleVaults.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                <MaterialCommunityIcons name="lock-alert" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucun coffre-fort éligible
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Créez un coffre "Partager après la mort" ou "Gérer après la mort"
                </Text>
              </View>
            ) : (
              eligibleVaults.map((vault) => (
                <TouchableOpacity
                  key={vault.id}
                  style={[
                    styles.checkboxItem,
                    { borderColor: colors.border },
                    selectedVaults.includes(vault.id) && { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: colors.purple.primary }
                  ]}
                  onPress={() => toggleVault(vault.id)}
                >
                  <MaterialCommunityIcons
                    name={selectedVaults.includes(vault.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={selectedVaults.includes(vault.id) ? colors.purple.primary : colors.textSecondary}
                  />
                  <View style={styles.checkboxContent}>
                    <Text style={[styles.checkboxTitle, { color: colors.text }]}>{vault.name}</Text>
                    <View style={styles.vaultMeta}>
                      <View style={[styles.categoryBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                        <Text style={[styles.categoryBadgeText, { color: colors.purple.primary }]}>
                          {vault.category === 'share_after_death' ? 'Partager' : 'Gérer'}
                        </Text>
                      </View>
                      <Text style={[styles.checkboxSubtitle, { color: colors.textSecondary }]}>
                        {vault.items?.length || 0} items
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            );
          })()}
        </View>

        {/* Select Heirs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <MaterialCommunityIcons name="account-group" size={18} color={colors.purple.primary} /> Héritiers ({selectedHeirs.length} sélectionné{selectedHeirs.length !== 1 ? 's' : ''})
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Sélectionnez les bénéficiaires de ce plan
          </Text>
          {heirs.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account-plus" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun héritier disponible
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Ajoutez un héritier d'abord
              </Text>
            </View>
          ) : (
            heirs.map((heir) => (
              <TouchableOpacity
                key={heir.id}
                style={[
                  styles.checkboxItem,
                  { borderColor: colors.border },
                  selectedHeirs.includes(heir.id) && { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: colors.purple.primary }
                ]}
                onPress={() => toggleHeir(heir.id)}
              >
                <MaterialCommunityIcons
                  name={selectedHeirs.includes(heir.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={selectedHeirs.includes(heir.id) ? colors.purple.primary : colors.textSecondary}
                />
                <View style={styles.checkboxContent}>
                  <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                    {heir.full_name || 'Unnamed Heir'}
                  </Text>
                  <Text style={[styles.checkboxSubtitle, { color: colors.textSecondary }]}>
                    {heir.email || 'No email'} • {heir.relationship || 'No relationship'} • {heir.access_level}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <MaterialCommunityIcons name="message-text" size={18} color={colors.purple.primary} /> Instructions
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Message pour vos héritiers (optionnel)
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Ex: Mes identifiants bancaires sont dans le coffre 'Finances'..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { 
            backgroundColor: colors.purple.primary,
            opacity: saving ? 0.7 : 1,
            shadowColor: colors.purple.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={[styles.saveButtonText, { marginLeft: 12 }]}>Création en cours...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Créer le Plan d'Héritage</Text>
            </>
          )}
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
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  headerInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkboxContent: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  checkboxSubtitle: {
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  vaultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
