import React, { useState } from 'react';
import { ActivityIndicator, View, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface EditProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ onSuccess, onCancel }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.user_metadata?.first_name || '',
    lastName: user?.lastName || user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
  });

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Informations personnelles</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form Content */}
      <View style={styles.formContent}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Prénom *</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Votre prénom"
              autoCapitalize="words"
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nom *</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Votre nom"
              autoCapitalize="words"
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Adresse email</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.disabledInput, { 
                backgroundColor: colors.backgroundTertiary,
                borderColor: colors.border,
                color: colors.textSecondary
              }]}
              value={formData.email}
              editable={false}
              selectTextOnFocus={false}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Contactez le support pour modifier votre email
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
              editable={!loading}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { 
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'rgba(139, 92, 246, 0.2)'
        }]}>
          <MaterialIcons name="info" size={20} color={colors.purple.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Vos informations personnelles sont utilisées pour personnaliser votre expérience et assurer la sécurité de votre compte.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, { 
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border
            }]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { backgroundColor: colors.purple.primary },
              loading && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  formContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
