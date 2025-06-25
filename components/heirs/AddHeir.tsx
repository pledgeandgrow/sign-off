import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

import { HeirFormData } from '../../types/heir';

interface AddHeirProps {
  onSubmit: (data: HeirFormData) => void;
  onCancel: () => void;
  existingHeirs: { percentage: number }[];
}

interface AddHeirProps {
  onSubmit: (data: HeirFormData) => void;
  onCancel: () => void;
  existingHeirs: { percentage: number }[];
}

const AddHeir = ({ onSubmit, onCancel, existingHeirs }: AddHeirProps) => {
  const [formData, setFormData] = useState<HeirFormData>({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    percentage: 0,
  });

  const totalAllocatedPercentage = existingHeirs.reduce(
    (sum, heir) => sum + heir.percentage,
    0
  );
  const remainingPercentage = 100 - totalAllocatedPercentage;

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
    
    const totalPercentage = existingHeirs.reduce((sum, heir) => sum + heir.percentage, 0) + Number(percentage);
    if (totalPercentage > 100) {
      Alert.alert('Error', `Total percentage cannot exceed 100%. Current total would be ${totalPercentage}%`);
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
    <ScrollView style={styles.container}>
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
        <View style={styles.percentageHeader}>
          <Text style={styles.label}>Percentage</Text>
          <Text style={styles.percentageRemaining}>
            {remainingPercentage}% remaining
          </Text>
        </View>
        <View style={styles.percentageInputContainer}>
          <TextInput
            style={[styles.input, styles.percentageInput]}
            value={formData.percentage ? formData.percentage.toString() : ''}
            onChangeText={(text) => {
              const value = parseInt(text, 10) || 0;
              handleInputChange('percentage', value);
            }}
            placeholder="0"
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.percentageSymbol}>%</Text>
        </View>
        <Text style={styles.hintText}>
          Enter a value between 1 and {remainingPercentage}%
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSubmit}
        >
          <Text style={styles.saveButtonText}>Save Heir</Text>
        </TouchableOpacity>
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
  formGroup: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'black',
    marginBottom: 16,
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
  percentageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  percentageRemaining: {
    fontSize: 12,
    color: '#666666',
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  percentageSymbol: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#e0e0e0',
    color: '#666666',
  },
  hintText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'black',
    minWidth: 120,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export { AddHeir };
