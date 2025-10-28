import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VaultCategory } from '@/types/vault';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type VaultFormData = {
  name: string;
  description: string;
  category: VaultCategory;
};



const CATEGORIES = [
  {
    value: 'delete_after_death',
    label: 'Supprimer après la mort',
    description: 'Fichiers locaux qui seront automatiquement supprimés',
    icon: 'delete',
  },
  {
    value: 'share_after_death',
    label: 'Partager après la mort',
    description: 'Informations à partager avec vos héritiers',
    icon: 'share-variant',
  },
  {
    value: 'handle_after_death',
    label: 'Gérer après la mort',
    description: 'Tâches pour quelqu’un de confiance',
    icon: 'account-check',
  },
  {
    value: 'sign_off_after_death',
    label: 'Sign-off après la mort',
    description: 'Notre équipe gère votre empreinte numérique',
    icon: 'shield-lock',
  },
] as const;

export const AddVault: React.FC<{
  initialData?: Partial<VaultFormData>;
  onSave: (vault: VaultFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}> = ({
  initialData = {},
  onSave: onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [formData, setFormData] = useState<VaultFormData>({
    name: '',
    description: '',
    category: 'share_after_death',
    ...initialData,
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }
    
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {initialData?.name ? 'Éditer le coffre-fort' : 'Nouveau coffre-fort'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Créez un espace sécurisé pour vos données
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nom du coffre-fort</Text>
          <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <MaterialCommunityIcons name="lock" size={20} color={colors.purple.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Mon coffre-fort"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description (optionnel)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Décrivez le contenu de ce coffre-fort..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              blurOnSubmit={true}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: formData.category === cat.value ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: formData.category === cat.value ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)'
                  }
                ]}
                onPress={() => setFormData({ ...formData, category: cat.value as VaultCategory })}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={20} color={colors.purple.primary} />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>{cat.label}</Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>{cat.description}</Text>
                </View>
                {formData.category === cat.value && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <TouchableOpacity 
          style={[styles.cancelButton, { borderColor: 'rgba(255, 255, 255, 0.2)' }]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: colors.purple.primary },
            (!formData.name.trim() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!formData.name.trim() || isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Création...' : (initialData?.name ? 'Mettre à jour' : 'Créer')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 16,
  },
  textAreaContainer: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {
        paddingBottom: 34,
      },
    }),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
