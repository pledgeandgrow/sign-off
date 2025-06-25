import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { VaultCategory } from '@/types/vault';
import { Button } from '../ui/Button';

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

export const VaultForm: React.FC<VaultFormProps> = ({
  initialData = {},
  onSubmit,
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
      <ScrollView style={styles.scrollView}>
        <Text style={styles.label}>Vault Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter vault name"
          placeholderTextColor="#999"
          autoFocus
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Enter a description for this vault"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryButton,
                formData.category === cat.value && styles.categoryButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, category: cat.value as VaultCategory })}
            >
              <Text
                style={[
                  styles.categoryLabel,
                  formData.category === cat.value && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
              <Text style={styles.categoryDescription}>{cat.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={!formData.name.trim() || isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
        >
          {isSubmitting ? 'Creating...' : 'Create Vault'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  scrollView: {
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
