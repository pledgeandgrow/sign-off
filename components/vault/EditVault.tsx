import React, { useState } from 'react';
import { Vault } from '@/types/vault';
import { View, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

type EditVaultProps = {
  vault: Vault;
  onSave: (updatedVault: Vault) => void;
  onCancel: () => void;
};

// Categories are now managed by the parent component or API

export const EditVault: React.FC<EditVaultProps> = ({
  vault,
  onSave,
  onCancel,
}) => {
  useTheme(); // Theme context might be used by child components
  const [formData, setFormData] = useState<Vault>(vault);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'Vault name is required' });
      return;
    }
    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
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
    inputContainerError: {
      borderColor: '#FF3B30',
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
    errorText: {
      color: '#FF3B30',
      fontSize: 14,
      marginTop: 4,
      marginLeft: 4,
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
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vault Name</Text>
          <View style={[
            styles.inputContainer,
            errors.name && styles.inputContainerError
          ]}>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({});
              }}
              placeholder="Enter vault name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter vault description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              blurOnSubmit={true}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.category}
              editable={false}
            />
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
          style={styles.submitButton}
        >
          Save Changes
        </Button>
      </View>
    </View>
  );
};
