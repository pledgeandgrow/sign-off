import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VaultItem, VaultItemType, VaultItemMetadata } from '@/types/vault';


type VaultItemFormData = {
  title: string;
  type: VaultItemType;
  metadata: VaultItemMetadata;
};

type VaultItemFormProps = {
  initialData?: Partial<VaultItem>;
  onSubmit: (data: VaultItemFormData) => void;
  onCancel: () => void;
};

const itemTypes: { value: VaultItemType; label: string; icon: string }[] = [
  { value: 'password', label: 'Password', icon: 'key' },
  { value: 'document', label: 'Document', icon: 'description' },
  { value: 'video', label: 'Video', icon: 'videocam' },
  { value: 'image', label: 'Image', icon: 'image' },
  { value: 'note', label: 'Note', icon: 'note' },
  { value: 'crypto', label: 'Crypto', icon: 'currency-btc' },
  { value: 'bank', label: 'Bank', icon: 'account-balance' },
  { value: 'other', label: 'Other', icon: 'more-horiz' },
];

export const VaultItemForm: React.FC<VaultItemFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
}) => {
  // Using light theme with black text and white background
  const [formData, setFormData] = useState<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt' | 'isEncrypted' | 'encryptedFields'>>(() => ({
    title: '',
    type: 'password',
    metadata: {},
    tags: [],
    ...initialData,
  }));
  
  // Always use light theme with white background and black text/icons
  const theme = {
    background: 'white',
    text: 'black',
    border: '#e0e0e0',
    icon: 'black',
    subtext: 'rgba(0, 0, 0, 0.7)',
    inputBackground: 'white',
    inputBorder: '#e0e0e0',
    inputText: 'black',
    buttonBackground: 'white',
    buttonText: 'black',
    buttonBorder: '#e0e0e0',
  };

  const handleSubmit = useCallback(() => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    onSubmit({
      title: formData.title.trim(),
      type: formData.type,
      metadata: formData.metadata,
    });
  }, [formData, onSubmit]);

  const renderMetadataFields = () => {
    switch (formData.type) {
      case 'password':
        return (
          <>
            <Text style={styles.label}>Username/Email</Text>
            <TextInput
              style={styles.input}
              value={(formData.metadata as any).username || ''}
              onChangeText={(text) => 
                setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, username: text }
                }))
              }
              placeholder="Enter username or email"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={(formData.metadata as any).password || ''}
              onChangeText={(text) => 
                setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, password: text }
                }))
              }
              placeholder="Enter password"
              secureTextEntry
            />
            <Text style={styles.label}>URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={(formData.metadata as any).url || ''}
              onChangeText={(text) => 
                setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, url: text }
                }))
              }
              placeholder="https://example.com"
              autoCapitalize="none"
              keyboardType="url"
            />
          </>
        );
      // Add cases for other item types as needed
      default:
        return (
          <Text style={styles.placeholderText}>
            Additional fields for {formData.type} items will be added here.
          </Text>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
      >
        <View style={styles.formGroup}>
          <Text style={[
              styles.label,
              { color: theme.text }
          ]}>
            Item Type
          </Text>
          <View style={styles.typeSelector}>
            {itemTypes.map((itemType) => (
              <TouchableOpacity
                key={itemType.value}
                style={[
                  styles.typeButton,
                  formData.type === itemType.value && styles.typeButtonSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type: itemType.value }))}
              >
                <MaterialIcons 
                  name={itemType.icon as any} 
                  size={20} 
                  color={theme.icon}
                />
                <Text 
                  style={[
                    styles.typeButtonText,
                    { color: theme.text },
                    formData.type === itemType.value && styles.typeButtonTextSelected,
                  ]}
                >
                  {itemType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={[
              styles.label,
              { color: theme.text }
          ]}>
            Title
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Enter item title"
            placeholderTextColor={theme.subtext}
            autoCapitalize="words"
          />
        </View>
        {renderMetadataFields()}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[
            styles.button,
            {
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            },
          ]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.button, 
            {
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            },
            !formData.title.trim() && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!formData.title.trim()}
        >
          <Text style={styles.buttonText}>
            {initialData?.id ? 'Update Item' : 'Add Item'}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonSelected: {
    backgroundColor: '#f5f5f5',
    borderColor: '#bdbdbd',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  typeButtonTextSelected: {
    color: 'black',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
  },
  cancelButton: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
