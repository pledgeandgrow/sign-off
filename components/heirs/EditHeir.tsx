
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
    relationship: heir.relationship,
    percentage: heir.percentage,
  });

  useEffect(() => {
    setFormData({
      name: heir.name,
      email: heir.email,
      phone: heir.phone,
      relationship: heir.relationship,
      percentage: heir.percentage,
    });
  }, [heir]);

  // Calculate remaining percentage that can be allocated
  const totalAllocatedPercentage = existingHeirs
    .filter((h) => h.id !== heir.id)
    .reduce((sum, h) => sum + h.percentage, 0);
  
  const remainingPercentage = 100 - totalAllocatedPercentage;
  const maxPercentage = remainingPercentage + heir.percentage;

  const handleInputChange = (field: keyof HeirFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const { name, email, phone, relationship, percentage } = formData;
    
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
    
    if (isNaN(Number(percentage)) || Number(percentage) <= 0 || Number(percentage) > 100) {
      Alert.alert('Error', 'Please enter a valid percentage between 1 and 100');
      return false;
    }
    
    const otherHeirs = existingHeirs.filter(h => h.id !== heir.id);
    const totalAllocated = otherHeirs.reduce((sum, h) => sum + h.percentage, 0);
    const totalPercentage = totalAllocated + Number(percentage);
    
    if (totalPercentage > 100) {
      Alert.alert('Error', `Total percentage cannot exceed 100%. Current total would be ${totalPercentage}%`);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Heir</Text>
      </View>

      <View style={styles.form}>
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
        <View style={styles.formGroup}>
          <Text style={styles.label}>Percentage Allocation</Text>
          <View style={styles.percentageContainer}>
            <TextInput
              style={styles.percentageInput}
              value={formData.percentage.toString()}
              onChangeText={(text) => handleInputChange('percentage', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={styles.percentageSuffix}>%</Text>
          </View>
          <Text style={styles.percentageInfo}>
            Maximum allocation available: {maxPercentage}%
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'black',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: 'black',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  percentageInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: 'black',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  percentageSuffix: {
    fontSize: 16,
    color: '#666',
    width: 40,
  },
  percentageInfo: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#333',
  },
  deleteButtonText: {
    color: '#fff',
  },
});

export { EditHeir };