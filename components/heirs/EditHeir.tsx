
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Heir, HeirFormData } from '../../types/heir';

interface EditHeirProps {
  heir: Heir;
  onSave: (data: HeirFormData & { id: string }) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  existingHeirs: Heir[];
}

const EditHeir: React.FC<EditHeirProps> = ({
  heir,
  onSave,
  onCancel,
  onDelete,
  existingHeirs,
}) => {
  const [formData, setFormData] = useState<HeirFormData>({
    name: heir.name,
    email: heir.email,
    phone: heir.phone,
    relationship: heir.relationship
  });

  useEffect(() => {
    setFormData({
      name: heir.name,
      email: heir.email,
      phone: heir.phone,
      relationship: heir.relationship
    });
  }, [heir]);

  const handleInputChange = (field: keyof HeirFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const { name, email, phone, relationship } = formData;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return false;
    }
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return false;
    }
    
    if (!relationship.trim()) {
      Alert.alert('Error', 'Please specify the relationship');
      return false;
    }
    
    return true;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        id: heir.id,
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Heir',
      `Are you sure you want to remove ${heir.name} as an heir?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(heir.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="John Doe"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            value={formData.relationship}
            onChangeText={(text) => handleInputChange('relationship', text)}
            placeholder="e.g., Spouse, Child, Sibling"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Heir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 16,
    color: '#111827',
    height: 48,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 16,
    color: '#111827',
    height: 48,
  },
  percentageSuffix: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  percentageInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { EditHeir };