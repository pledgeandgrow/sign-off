import { VaultItem, VaultItemType } from '@/types/vault';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';



type VaultItemFormData = {
  title: string;
  type: VaultItemType;
  metadata: Record<string, any>;
  isEncrypted: boolean;
  encryptedFields: string[];
  tags: string[];
};

type ItemTypeConfig = {
  type: VaultItemType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

interface VaultItemFormProps {
  onSave: (data: VaultItemFormData) => void;
  onCancel: () => void;
  initialData?: Partial<VaultItem>;
  isSubmitting?: boolean;
}

const ITEM_TYPES: ItemTypeConfig[] = [
  { type: 'password', label: 'Password', icon: 'lock' },
  { type: 'note', label: 'Note', icon: 'sticky-note-2' },
  { type: 'crypto', label: 'Crypto', icon: 'currency-bitcoin' },
  { type: 'bank', label: 'Bank', icon: 'account-balance' },
  { type: 'document', label: 'Document', icon: 'description' },
  { type: 'video', label: 'Video', icon: 'videocam' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'other', label: 'Other', icon: 'more-horiz' }
];

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 64) / 3; // 16px padding on each side, 16px gap between items

const getDefaultMetadata = (type: VaultItemType): Record<string, any> => {
  switch (type) {
    case 'password':
      return { username: '', password: '', url: '' };
    case 'note':
      return { content: '' };
    case 'crypto':
      return { walletAddress: '', privateKey: '', network: '' };
    case 'bank':
      return { accountNumber: '', routingNumber: '', accountType: '' };
    default:
      return {};
  }
};

const AddItem: React.FC<VaultItemFormProps> = ({
  onSave,
  onCancel,
  initialData = {},
  isSubmitting = false
}) => {
  // Keyboard visibility state is kept for potential future use
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [formData, setFormData] = useState<VaultItemFormData>(() => ({
    title: initialData.title || '',
    type: initialData.type || 'note',
    metadata: { ...getDefaultMetadata(initialData.type || 'note'), ...(initialData.metadata || {}) },
    isEncrypted: initialData.isEncrypted !== undefined ? initialData.isEncrypted : true,
    encryptedFields: initialData.encryptedFields || [],
    tags: initialData.tags || [],
  }));

  const isFormValid = useCallback((): boolean => {
    return formData.title.trim().length > 0;
  }, [formData.title]);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  }, []);



  const handleSubmit = useCallback(() => {
    if (!isFormValid()) return;
    
    // Validate required fields based on item type
    const validationErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      validationErrors.title = 'Title is required';
    }
    
    if (formData.type === 'password' && !formData.metadata?.password) {
      validationErrors.password = 'Password is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      // Set errors if any
      return;
    }
    
    onSave(formData);
  }, [formData, isFormValid, onSave]);

  const renderMetadataFields = () => {
    switch (formData.type) {
      case 'password':
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username/Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.metadata?.username || ''}
                  onChangeText={(text) => handleMetadataChange('username', text)}
                  placeholder="Enter username or email"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.metadata?.password || ''}
                  onChangeText={(text) => handleMetadataChange('password', text)}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Website URL (optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.metadata?.url || ''}
                  onChangeText={(text) => handleMetadataChange('url', text)}
                  placeholder="https://example.com"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => (
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
        disabled={!isFormValid()}
        style={styles.submitButton}
      >
        {initialData?.id ? 'Update' : 'Create'}
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {initialData?.id ? 'Edit Item' : 'Add New Item'}
          </Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
            onPress={() => setActiveTab('preview')}
          >
            <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'details' ? (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Item Type</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeScroll}
                  contentContainerStyle={styles.typeScrollContent}
                >
                  {ITEM_TYPES.map((itemType) => (
                    <TouchableOpacity
                      key={itemType.type}
                      style={[
                        styles.typeButton,
                        formData.type === itemType.type && styles.typeButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          type: itemType.type,
                          metadata: getDefaultMetadata(itemType.type),
                        })
                      }
                    >
                      <View
                        style={[
                          styles.typeIconContainer,
                          formData.type === itemType.type && styles.typeIconContainerActive,
                        ]}
                      >
                        <MaterialIcons
                          name={itemType.icon}
                          size={20}
                          color={formData.type === itemType.type ? '#000' : '#666'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.typeLabel,
                          formData.type === itemType.type && styles.typeLabelActive,
                        ]}
                      >
                        {itemType.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Enter item title"
                    placeholderTextColor="#999"
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {renderMetadataFields()}

              <View style={styles.formGroup}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>
                    Encrypt this item
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      formData.isEncrypted && styles.toggleActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        isEncrypted: !formData.isEncrypted,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        formData.isEncrypted && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.toggleDescription}>
                  {formData.isEncrypted
                    ? 'This item will be encrypted for security.'
                    : 'This item will be stored without encryption (not recommended for sensitive data).'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewIcon}>
                    <MaterialIcons 
                      name={ITEM_TYPES.find(t => t.type === formData.type)?.icon || 'help-outline'} 
                      size={24} 
                      color="#000" 
                    />
                  </View>
                  <Text style={styles.previewName}>
                    {formData.title || 'Item Title'}
                  </Text>
                </View>
                <View style={styles.previewContent}>
                  {Object.entries(formData.metadata).map(([key, value]) => (
                    <View key={key} style={styles.previewRow}>
                      <Text style={styles.previewLabel}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}:
                      </Text>
                      <Text style={styles.previewValue} numberOfLines={1}>
                        {value || 'Not set'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {renderFooter()}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Tabs
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    color: '#666',
    fontWeight: '400',
  },
  activeTab: {
    borderBottomColor: '#4F46E5',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  
  // Scroll content
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  
  // Type selection
  typeScroll: {
    marginBottom: 16,
  },
  typeScrollContent: {
    paddingHorizontal: 16,
  },
  typeButton: {
    width: ITEM_WIDTH,
    marginRight: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C7D2FE',
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconContainerActive: {
    backgroundColor: '#EEF2FF',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  
  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#4F46E5',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
    fontWeight: '400',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
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
  previewContainer: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  previewContent: {
    paddingTop: 8,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  previewLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
  },
  previewValue: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
});

export { AddItem };
