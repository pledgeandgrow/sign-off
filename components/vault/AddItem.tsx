import { VaultItem, VaultItemType } from '@/types/vault';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile, formatFileSize } from '@/lib/services/fileUploadService';

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
  icon: string;
};

interface VaultItemFormProps {
  onSave: (data: VaultItemFormData) => void;
  onCancel: () => void;
  initialData?: Partial<VaultItem>;
  isSubmitting?: boolean;
  vaultId: string;
}

const ITEM_TYPES: ItemTypeConfig[] = [
  { type: 'password', label: 'Mot de passe', icon: 'key-variant' },
  { type: 'note', label: 'Note', icon: 'note-text' },
  { type: 'crypto', label: 'Crypto', icon: 'bitcoin' },
  { type: 'bank', label: 'Banque', icon: 'bank' },
  { type: 'document', label: 'Document', icon: 'file-document' },
  { type: 'video', label: 'Vidéo', icon: 'video' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'other', label: 'Autre', icon: 'dots-horizontal' }
];

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
    case 'document':
    case 'image':
    case 'video':
      return { fileName: '', fileUrl: '', fileSize: '', description: '' };
    case 'other':
      return { field1: '', field2: '', notes: '' };
    default:
      return {};
  }
};

const AddItem: React.FC<VaultItemFormProps> = ({
  onSave,
  onCancel,
  initialData = {},
  isSubmitting = false,
  vaultId
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [formData, setFormData] = useState<VaultItemFormData>(() => ({
    title: initialData.title || '',
    type: initialData.type || 'password',
    metadata: { ...getDefaultMetadata(initialData.type || 'password'), ...(initialData.metadata || {}) },
    isEncrypted: initialData.isEncrypted !== undefined ? initialData.isEncrypted : true,
    encryptedFields: initialData.encryptedFields || [],
    tags: initialData.tags || [],
  }));

  const isFormValid = useCallback((): boolean => {
    if (!formData.title.trim()) return false;
    
    // Type-specific validation
    switch (formData.type) {
      case 'password':
        return !!(formData.metadata as any).password;
      case 'note':
        return !!(formData.metadata as any).content;
      case 'crypto':
        return !!(formData.metadata as any).walletAddress;
      case 'bank':
        return !!(formData.metadata as any).accountNumber;
      case 'document':
      case 'image':
      case 'video':
        // Require file upload for these types
        return !!(formData.metadata as any).fileUrl;
      default:
        return true;
    }
  }, [formData]);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  }, []);

  const handleFileSelect = useCallback((event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
      // Set file name automatically
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          fileName: file.name
        }
      }));
    }
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !user) {
      setUploadError('Aucun fichier sélectionné');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // If editing and there's an old file, delete it first
      const oldFileUrl = (formData.metadata as any).fileUrl;
      console.log('🔍 Checking for old file...', { oldFileUrl });
      
      if (oldFileUrl && typeof oldFileUrl === 'string') {
        try {
          console.log('🗑️ Deleting old file before upload...');
          console.log('Old file URL:', oldFileUrl);
          
          // Extract file path from URL
          // URL format: https://xxx.supabase.co/storage/v1/object/sign/vault-files/userId/vaultId/filename?token=xxx
          let fullPath = '';
          
          // Method 1: Extract from signed URL
          if (oldFileUrl.includes('/object/sign/vault-files/')) {
            const match = oldFileUrl.match(/\/object\/sign\/vault-files\/(.+?)(\?|$)/);
            if (match && match[1]) {
              fullPath = match[1];
            }
          }
          
          // Method 2: Extract from public URL
          if (!fullPath && oldFileUrl.includes('/vault-files/')) {
            const urlParts = oldFileUrl.split('/');
            const pathIndex = urlParts.findIndex((part: string) => part === 'vault-files');
            if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
              const pathParts = urlParts.slice(pathIndex + 1);
              fullPath = pathParts.join('/').split('?')[0]; // Remove query params
            }
          }
          
          if (fullPath) {
            console.log('📂 Extracted file path:', fullPath);
            
            const { supabase } = await import('@/lib/supabase');
            const { error: deleteError } = await supabase.storage
              .from('vault-files')
              .remove([fullPath]);
            
            if (deleteError) {
              console.error('❌ Error deleting old file:', deleteError);
              // Don't throw, continue with upload
            } else {
              console.log('✅ Old file deleted successfully:', fullPath);
            }
          } else {
            console.warn('⚠️ Could not extract file path from URL');
          }
        } catch (deleteErr) {
          console.error('❌ Error processing old file deletion:', deleteErr);
          // Don't throw, continue with upload
        }
      } else {
        console.log('ℹ️ No old file to delete (new item or no file)');
      }

      // Upload new file
      const result = await uploadFile(user.id, vaultId, selectedFile, selectedFile.name);

      if (result.success && result.url && result.size !== undefined) {
        // Update metadata with file URL and size
        setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            fileUrl: result.url,
            fileSize: formatFileSize(result.size!),
            fileSizeBytes: result.size
          }
        }));
        setUploadError('');
      } else {
        setUploadError('Échec de l\'upload du fichier');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, user, vaultId, formData.metadata]);

  const handleSubmit = useCallback(() => {
    if (!isFormValid()) return;
    onSave(formData);
  }, [formData, isFormValid, onSave]);

  const renderMetadataFields = () => {
    switch (formData.type) {
      case 'password':
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nom d'utilisateur / Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.username || ''}
                  onChangeText={(text) => handleMetadataChange('username', text)}
                  placeholder="Entrez votre nom d'utilisateur"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.password || ''}
                  onChangeText={(text) => handleMetadataChange('password', text)}
                  placeholder="Entrez le mot de passe"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>URL du site (optionnel)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="web" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.url || ''}
                  onChangeText={(text) => handleMetadataChange('url', text)}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          </>
        );
      case 'note':
        return (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Contenu</Text>
            <View style={[styles.textAreaWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                value={formData.metadata?.content || ''}
                onChangeText={(text) => handleMetadataChange('content', text)}
                placeholder="Entrez votre note..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        );
      case 'crypto':
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Adresse du portefeuille</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="wallet" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.walletAddress || ''}
                  onChangeText={(text) => handleMetadataChange('walletAddress', text)}
                  placeholder="0x..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Clé privée</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="key" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.privateKey || ''}
                  onChangeText={(text) => handleMetadataChange('privateKey', text)}
                  placeholder="Entrez la clé privée"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Réseau / Blockchain</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="network" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.network || ''}
                  onChangeText={(text) => handleMetadataChange('network', text)}
                  placeholder="Bitcoin, Ethereum, etc."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </>
        );
      case 'bank':
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Numéro de compte</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="credit-card" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.accountNumber || ''}
                  onChangeText={(text) => handleMetadataChange('accountNumber', text)}
                  placeholder="Entrez le numéro de compte"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Code banque / IBAN</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="bank" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.routingNumber || ''}
                  onChangeText={(text) => handleMetadataChange('routingNumber', text)}
                  placeholder="Code banque ou IBAN"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Type de compte</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="format-list-bulleted-type" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.accountType || ''}
                  onChangeText={(text) => handleMetadataChange('accountType', text)}
                  placeholder="Courant, Épargne, etc."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </>
        );
      case 'document':
      case 'image':
      case 'video':
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Fichier <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              
              {/* File upload button */}
              {!formData.metadata?.fileUrl && (
                <View>
                  <input
                    ref={fileInputRef as any}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept={
                      formData.type === 'image' ? 'image/*' :
                      formData.type === 'video' ? 'video/*' :
                      '.pdf,.doc,.docx'
                    }
                  />
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.purple.primary }]}
                    onPress={() => fileInputRef.current?.click()}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="cloud-upload" size={20} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText} numberOfLines={1} ellipsizeMode="middle">
                      {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                    </Text>
                  </TouchableOpacity>
                  
                  {selectedFile && !isUploading && (
                    <TouchableOpacity
                      style={[styles.uploadButton, styles.uploadActionButton, { backgroundColor: '#10B981', marginTop: 12 }]}
                      onPress={handleFileUpload}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="upload" size={20} color="#FFFFFF" />
                      <Text style={styles.uploadButtonText}>Uploader le fichier</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isUploading && (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color={colors.purple.primary} />
                      <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
                        Upload en cours...
                      </Text>
                    </View>
                  )}
                  
                  {uploadError && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={styles.errorText}>{uploadError}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Display uploaded file info */}
              {formData.metadata?.fileUrl && (
                <View style={[styles.uploadedFileCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <View style={styles.uploadedFileHeader}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                    <View style={styles.uploadedFileInfo}>
                      <Text style={[styles.uploadedFileName, { color: colors.text }]}>
                        {formData.metadata?.fileName}
                      </Text>
                      <Text style={[styles.uploadedFileSize, { color: colors.textSecondary }]}>
                        {formData.metadata?.fileSize}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setFormData(prev => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            fileUrl: '',
                            fileSize: '',
                            fileSizeBytes: undefined
                          }
                        }));
                        setSelectedFile(null);
                      }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description (optionnel)</Text>
              <View style={[styles.textAreaWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  value={formData.metadata?.description || ''}
                  onChangeText={(text) => handleMetadataChange('description', text)}
                  placeholder="Description du fichier..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </>
        );
      case 'other':
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Champ 1</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="text" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.field1 || ''}
                  onChangeText={(text) => handleMetadataChange('field1', text)}
                  placeholder="Valeur"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Champ 2</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <MaterialCommunityIcons name="text" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.metadata?.field2 || ''}
                  onChangeText={(text) => handleMetadataChange('field2', text)}
                  placeholder="Valeur"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
              <View style={[styles.textAreaWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  value={formData.metadata?.notes || ''}
                  onChangeText={(text) => handleMetadataChange('notes', text)}
                  placeholder="Notes additionnelles..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {initialData?.id ? 'Modifier l\'élément' : 'Nouvel élément'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Type d'élément</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.typeScroll}
          >
            {ITEM_TYPES.map((itemType) => (
              <TouchableOpacity
                key={itemType.type}
                style={[
                  styles.typeButton,
                  { 
                    backgroundColor: formData.type === itemType.type ? colors.purple.primary : 'rgba(255, 255, 255, 0.05)',
                    borderColor: formData.type === itemType.type ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)'
                  }
                ]}
                onPress={() =>
                  setFormData({
                    ...formData,
                    type: itemType.type,
                    metadata: getDefaultMetadata(itemType.type),
                  })
                }
              >
                <MaterialCommunityIcons
                  name={itemType.icon as any}
                  size={20}
                  color={formData.type === itemType.type ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: formData.type === itemType.type ? '#FFFFFF' : colors.textSecondary }
                  ]}
                >
                  {itemType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Titre</Text>
            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <MaterialCommunityIcons name="text" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Entrez un titre"
                placeholderTextColor={colors.textSecondary}
                autoCorrect={false}
                autoCapitalize="words"
              />
            </View>
          </View>

          {renderMetadataFields()}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            { backgroundColor: colors.purple.primary },
            !isFormValid() && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
            {initialData?.id ? 'Mettre à jour' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  textAreaWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  textArea: {
    fontSize: 16,
    minHeight: 120,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadActionButton: {
    marginTop: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  uploadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  uploadedFileCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  uploadedFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadedFileInfo: {
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadedFileSize: {
    fontSize: 14,
  },
});

export { AddItem };
