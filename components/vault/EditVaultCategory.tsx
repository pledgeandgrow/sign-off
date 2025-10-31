import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VaultCategory } from '@/types/vault';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface EditVaultCategoryProps {
  currentCategory: VaultCategory;
  onSave: (category: VaultCategory) => void;
  onCancel: () => void;
}

const categoryOptions: { value: VaultCategory; label: string; icon: string; description: string }[] = [
  {
    value: 'delete_after_death',
    label: 'Supprimer après la mort',
    icon: 'delete',
    description: 'Les données seront automatiquement supprimées après votre décès'
  },
  {
    value: 'share_after_death',
    label: 'Partager après la mort',
    icon: 'share-variant',
    description: 'Les données seront partagées avec vos héritiers après votre décès'
  },
  {
    value: 'handle_after_death',
    label: 'Gérer après la mort',
    icon: 'account-check',
    description: 'Vos héritiers pourront gérer ces données après votre décès'
  },
  {
    value: 'sign_off_after_death',
    label: 'Sign-off après la mort',
    icon: 'shield-lock',
    description: 'Nécessite une validation spéciale pour accéder après votre décès'
  },
];

export const EditVaultCategory: React.FC<EditVaultCategoryProps> = ({
  currentCategory,
  onSave,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory>(currentCategory);

  const handleSave = () => {
    onSave(selectedCategory);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Modifier la catégorie
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choisissez comment ce coffre-fort sera géré après votre décès
        </Text>
      </View>

      {/* Category Options */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {categoryOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.categoryCard,
              {
                backgroundColor: selectedCategory === option.value
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: selectedCategory === option.value
                  ? colors.purple.primary
                  : 'rgba(255, 255, 255, 0.1)',
              },
            ]}
            onPress={() => setSelectedCategory(option.value)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryContent}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: selectedCategory === option.value
                      ? colors.purple.primary
                      : 'rgba(139, 92, 246, 0.2)',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={24}
                  color={selectedCategory === option.value ? '#FFFFFF' : colors.purple.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.categoryLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              {selectedCategory === option.value && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={colors.purple.primary}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, { backgroundColor: colors.purple.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Enregistrer</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  categoryCard: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    padding: 16,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditVaultCategory;
