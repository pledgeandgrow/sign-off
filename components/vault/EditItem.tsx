import React, { useState } from 'react';
import { VaultItem, VaultItemType } from '@/types/vault';
import { View, TextInput, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

type EditItemProps = {
  item: VaultItem;
  onSave: (updatedItem: VaultItem) => void;
  onCancel: () => void;
};

export const EditItem: React.FC<EditItemProps> = ({
  item,
  onSave,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<VaultItem>(item);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      // Handle validation error
      return;
    }
    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      flex: 1,
    } as ViewStyle,
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    } as ViewStyle & TextStyle,
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 16,
    } as ViewStyle,
    label: {
      marginBottom: 8,
      fontSize: 16,
      color: theme.colors.text,
    } as TextStyle,
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
        placeholder="Enter title"
        placeholderTextColor={theme.colors.muted}
      />

      <Text style={styles.label}>Type</Text>
      <TextInput
        style={styles.input}
        value={formData.type}
        editable={false}
      />

      {/* Metadata fields based on item type */}
      {Object.entries(formData.metadata || {}).map(([key, value]) => (
        <View key={key}>
          <Text style={styles.label}>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
          </Text>
          <TextInput
            style={styles.input}
            value={String(value)}
            onChangeText={(text) => handleMetadataChange(key, text)}
            secureTextEntry={key.toLowerCase().includes('password')}
          />
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <Button variant="outline" onPress={onCancel}>
          Cancel
        </Button>
        <Button onPress={handleSubmit}>
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
};
