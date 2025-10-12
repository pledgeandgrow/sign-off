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
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { InheritancePlanFormData } from '@/types/heir';
import { InheritancePlanType, ActivationMethodType } from '@/types/database.types';

interface InheritancePlanFormProps {
  initialData?: Partial<InheritancePlanFormData>;
  onSubmit: (data: InheritancePlanFormData) => void;
  onCancel: () => void;
}

export const InheritancePlanForm: React.FC<InheritancePlanFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<InheritancePlanFormData>({
    plan_name: initialData?.plan_name || '',
    plan_type: initialData?.plan_type || 'partial_access',
    activation_method: initialData?.activation_method || 'inactivity',
    scheduled_date: initialData?.scheduled_date || null,
    instructions_encrypted: initialData?.instructions_encrypted || '',
    is_active: initialData?.is_active ?? true,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleInputChange = (field: keyof InheritancePlanFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('scheduled_date', selectedDate.toISOString());
    }
  };

  const validateForm = (): boolean => {
    if (!formData.plan_name.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return false;
    }

    if (formData.activation_method === 'scheduled' && !formData.scheduled_date) {
      Alert.alert('Error', 'Please select a scheduled date for this activation method');
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Plan Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.plan_name}
            onChangeText={(text) => handleInputChange('plan_name', text)}
            placeholder="My Inheritance Plan"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Plan Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.plan_type}
              onValueChange={(value) => handleInputChange('plan_type', value as InheritancePlanType)}
              style={styles.picker}
            >
              <Picker.Item label="Full Access - Complete access to all data" value="full_access" />
              <Picker.Item label="Partial Access - Limited access to selected items" value="partial_access" />
              <Picker.Item label="View Only - Read-only access" value="view_only" />
              <Picker.Item label="Destroy - Delete all data" value="destroy" />
            </Picker>
          </View>
          <Text style={styles.hint}>
            {formData.plan_type === 'full_access' && 'Heirs will have complete access to all vaults and items'}
            {formData.plan_type === 'partial_access' && 'Heirs will only access items you specifically grant'}
            {formData.plan_type === 'view_only' && 'Heirs can view but not modify or export data'}
            {formData.plan_type === 'destroy' && 'All data will be permanently deleted upon activation'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activation Method</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Trigger Method *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.activation_method}
              onValueChange={(value) => {
                handleInputChange('activation_method', value as ActivationMethodType);
                if (value !== 'scheduled') {
                  handleInputChange('scheduled_date', null);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Inactivity - After period of no activity" value="inactivity" />
              <Picker.Item label="Death Certificate - Upon verified death" value="death_certificate" />
              <Picker.Item label="Manual Trigger - Manually activated" value="manual_trigger" />
              <Picker.Item label="Scheduled - On specific date" value="scheduled" />
            </Picker>
          </View>
          <Text style={styles.hint}>
            {formData.activation_method === 'inactivity' && 'Plan activates after extended period of inactivity'}
            {formData.activation_method === 'death_certificate' && 'Requires verified death certificate'}
            {formData.activation_method === 'manual_trigger' && 'You or trusted contact can trigger manually'}
            {formData.activation_method === 'scheduled' && 'Activates automatically on specified date'}
          </Text>
        </View>

        {formData.activation_method === 'scheduled' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Scheduled Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formData.scheduled_date
                  ? new Date(formData.scheduled_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select Date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.scheduled_date ? new Date(formData.scheduled_date) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions for Heirs</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Special Instructions (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.instructions_encrypted || ''}
            onChangeText={(text) => handleInputChange('instructions_encrypted', text || null)}
            placeholder="Enter any special instructions or messages for your heirs..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            These instructions will be encrypted and only visible to heirs upon plan activation
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>

        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Active</Text>
              <Text style={styles.hint}>Inactive plans will not be triggered</Text>
            </View>
            <Switch
              value={formData.is_active}
              onValueChange={(value) => handleInputChange('is_active', value)}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={formData.is_active ? '#fff' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>
            {initialData ? 'Update Plan' : 'Create Plan'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 120,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
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
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    minWidth: 120,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
