import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VaultCategory } from '@/types/vault';
import { Button } from '../ui/Button';
import { Text as CustomText } from '../ui/Text';

type VaultFormData = {
  name: string;
  description: string;
  category: VaultCategory;
};

type VaultFormProps = {
  initialData?: Partial<VaultFormData>;
  onSubmit: (vault: VaultFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const CATEGORIES = [
  {
    value: 'delete_after_death',
    label: 'Delete After Death',
    description: 'Local files that will be automatically deleted after your passing',
  },
  {
    value: 'share_after_death',
    label: 'Share After Death',
    description: 'Information to be shared with your heirs after verification',
  },
  {
    value: 'handle_after_death',
    label: 'Handle After Death',
    description: 'Tasks for someone you trust to manage after your passing',
  },
  {
    value: 'sign_off_after_death',
    label: 'Sign Off After Death (Premium)',
    description: 'Our team will handle removing your digital footprint',
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Vault Name</CustomText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter vault name"
              placeholderTextColor="#999"
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Description (Optional)</CustomText>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter a description for this vault"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              blurOnSubmit={true}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Category</CustomText>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  formData.category === cat.value && styles.categoryButtonActive
                ]}
                onPress={() => setFormData({ ...formData, category: cat.value as VaultCategory })}
              >
                <View style={styles.categoryContent}>
                  <CustomText style={styles.categoryLabel}>{cat.label}</CustomText>
                  <CustomText style={styles.categoryDescription}>{cat.description}</CustomText>
                </View>
                {formData.category === cat.value && (
                  <MaterialIcons name="check-circle" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          variant="outline" 
          onPress={onCancel} 
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button 
          onPress={handleSubmit} 
          disabled={!formData.name.trim() || isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
        >
          {initialData?.name ? 'Update Vault' : 'Create Vault'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    color: '#000',
    padding: 16,
    height: 52,
    fontFamily: 'Inter-Regular',
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  categoriesContainer: {
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    borderColor: '#000',
    backgroundColor: '#F5F5F5',
  },
  categoryContent: {
    flex: 1,
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        paddingBottom: 34, // Add extra padding for iPhone home indicator
      },
    }),
  },
  cancelButton: {
    flex: 1,
    marginRight: 12,
  },
  submitButton: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: 'black',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    color: 'black',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonActive: {
    borderColor: 'black',
    backgroundColor: '#f0f0f0',
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginBottom: 4,
  },
  categoryLabelActive: {
    color: '#1976d2',
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5B4FC',
    opacity: 0.7,
  },
  buttonText: {
    color: 'black',
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#374151',
  },
  submitButtonText: {
    color: 'white',
  },
});
