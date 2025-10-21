import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { HeirFormData } from '@/types/heir';
import { AccessLevelType } from '@/types/database.types';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface HeirFormProps {
  initialData?: Partial<HeirFormData>;
  onSubmit: (data: HeirFormData) => void;
  onCancel: () => void;
  inheritancePlanId?: string | null;
}

export const HeirForm: React.FC<HeirFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  inheritancePlanId,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [formData, setFormData] = useState<HeirFormData>({
    full_name_encrypted: initialData?.full_name_encrypted || '',
    email_encrypted: initialData?.email_encrypted || '',
    phone_encrypted: initialData?.phone_encrypted || '',
    relationship_encrypted: initialData?.relationship_encrypted || '',
    access_level: initialData?.access_level || 'view',
    inheritance_plan_id: inheritancePlanId || initialData?.inheritance_plan_id || null,
    heir_user_id: initialData?.heir_user_id || null,
    heir_public_key: initialData?.heir_public_key || null,
    notify_on_activation: initialData?.notify_on_activation ?? true,
    notification_delay_days: initialData?.notification_delay_days || 0,
    is_active: initialData?.is_active ?? true,
  });

  const handleInputChange = (field: keyof HeirFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.full_name_encrypted.trim()) {
      Alert.alert('Error', 'Please enter the heir\'s full name');
      return false;
    }

    if (!formData.email_encrypted.trim() || !/^\S+@\S+\.\S+$/.test(formData.email_encrypted)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (formData.notification_delay_days < 0) {
      Alert.alert('Error', 'Notification delay cannot be negative');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations Personnelles</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nom Complet *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: colors.text }]}
            value={formData.full_name_encrypted}
            onChangeText={(text) => handleInputChange('full_name_encrypted', text)}
            placeholder="Jean Dupont"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: colors.text }]}
            value={formData.email_encrypted}
            onChangeText={(text) => handleInputChange('email_encrypted', text)}
            placeholder="jean@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Numéro de Téléphone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: colors.text }]}
            value={formData.phone_encrypted || ''}
            onChangeText={(text) => handleInputChange('phone_encrypted', text || null)}
            placeholder="+33 6 12 34 56 78"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Relation</Text>
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: colors.text }]}
            value={formData.relationship_encrypted || ''}
            onChangeText={(text) => handleInputChange('relationship_encrypted', text || null)}
            placeholder="Ex: Conjoint, Enfant, Ami"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.cancelButton, { borderColor: 'rgba(255, 255, 255, 0.1)' }]} onPress={onCancel}>
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.purple.primary }]} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>
            {initialData ? 'Mettre à Jour' : 'Ajouter'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
