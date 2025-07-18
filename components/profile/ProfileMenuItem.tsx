import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Switch, 
  I18nManager,
  StyleProp,
  ViewStyle,
  TextStyle,
  SwitchProps
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/ui/Text';

interface ProfileMenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  showSwitch?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  labelStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  rightContent?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  switchProps?: Partial<SwitchProps>;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  icon,
  label,
  onPress,
  showChevron = true,
  showSwitch = false,
  value = false,
  onValueChange = () => {},
  labelStyle,
  iconColor,
  rightContent,
  containerStyle,
  switchProps,
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const isRTL = I18nManager.isRTL;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!showSwitch) {
      onPress();
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        style={[
          styles.container,
          { 
            backgroundColor: '#ffffff',
            borderBottomColor: '#f0f0f0',
          },
          containerStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.leftContent}>
          <View 
            style={[
              styles.iconContainer, 
              { 
                backgroundColor: '#000000',
                borderRadius: 8,
              }
            ]}
          >
            <MaterialIcons 
              name={icon as any} 
              size={22} 
              color="#ffffff"
              style={{ opacity: 0.9 }}
            />
          </View>
          <Text 
            style={[
              styles.label, 
              { color: '#000000' },
              labelStyle
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>

        <View style={styles.rightContent}>
          {rightContent}
          {showChevron && !showSwitch && (
            <MaterialIcons 
              name={isRTL ? 'chevron-left' : 'chevron-right'} 
              size={24} 
              color={theme.colors.textSecondary}
              style={{ opacity: 0.5 }}
            />
          )}
          {showSwitch && (
            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{ 
                false: theme.colors.border, 
                true: `${theme.colors.primary}80`,
              }}
              thumbColor="white"
              ios_backgroundColor={theme.colors.border}
              {...switchProps}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
