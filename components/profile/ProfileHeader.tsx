import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  StyleProp,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/ui/Text';

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  onEditPress: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showEditButton?: boolean;
  onAvatarPress?: () => void;
  avatarSize?: number;
  showEmail?: boolean;
  showGradient?: boolean;
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  editButtonSize?: number;
  editButtonIconSize?: number;
  editButtonPosition?: { top?: number; right?: number; bottom?: number; left?: number };
  editButtonStyle?: StyleProp<ViewStyle>;
  avatarStyle?: StyleProp<ImageStyle>;
  avatarContainerStyle?: StyleProp<ViewStyle>;
  textContainerStyle?: StyleProp<ViewStyle>;
  nameStyle?: StyleProp<TextStyle>;
  emailStyle?: StyleProp<TextStyle>;
  renderCustomAvatar?: () => React.ReactNode;
  renderCustomEditButton?: () => React.ReactNode;
  testID?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  avatarUrl,
  onEditPress,
  loading = false,
  style,
  containerStyle,
  showEditButton = true,
  onAvatarPress,
  avatarSize = 100,
  showEmail = true,
  showGradient = true,
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
  editButtonSize = 40,
  editButtonIconSize = 20,
  editButtonPosition = { bottom: 0, right: 0 },
  editButtonStyle,
  avatarStyle,
  avatarContainerStyle,
  textContainerStyle,
  nameStyle,
  emailStyle,
  renderCustomAvatar,
  renderCustomEditButton,
  testID = 'profile-header',
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  
  const animatePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getInitials = () => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderAvatar = () => {
    if (renderCustomAvatar) {
      return renderCustomAvatar();
    }

    const avatarContent = avatarUrl ? (
      <Image 
        source={{ uri: avatarUrl }} 
        style={[
          styles.avatarImage, 
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          avatarStyle,
        ]} 
        resizeMode="cover"
        accessibilityLabel={`${name}'s profile picture`}
        testID="avatar-image"
      />
    ) : (
      <View 
        style={[
          styles.avatarFallback, 
          { 
            width: avatarSize, 
            height: avatarSize, 
            borderRadius: avatarSize / 2,
            backgroundColor: `${theme.colors.primary}20`,
          },
          avatarStyle,
        ]}
      >
        <Text 
          style={[
            styles.avatarText, 
            { 
              color: theme.colors.text,
              fontSize: avatarSize * 0.3,
            }
          ]}
          weight="bold"
          testID="avatar-initials"
        >
          {getInitials()}
        </Text>
      </View>
    );

    return (
      <Animated.View 
        style={[
          styles.avatarContainer,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
          avatarContainerStyle,
        ]}
      >
        <TouchableWithoutFeedback
          onPress={onAvatarPress || onEditPress}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          accessibilityRole="button"
          accessibilityLabel={onAvatarPress ? 'Change profile picture' : 'Edit profile'}
          testID="avatar-button"
        >
          <View>
            {avatarContent}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    );
  };

  const renderEditButton = () => {
    if (renderCustomEditButton) {
      return renderCustomEditButton();
    }

    if (!showEditButton) return null;

    return (
      <TouchableOpacity 
        style={[
          styles.editButton, 
          { 
            width: editButtonSize,
            height: editButtonSize,
            borderRadius: editButtonSize / 2,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.text,
            ...editButtonPosition,
          },
          editButtonStyle,
        ]} 
        onPress={onEditPress}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
        activeOpacity={0.8}
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
        accessibilityHint="Opens edit profile screen"
        testID="edit-button"
      >
        <MaterialIcons 
          name="edit" 
          size={editButtonIconSize} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
    );
  };

  const renderContent = () => (
    <View style={[styles.content, containerStyle]}>
      <View style={[styles.avatarWrapper, { marginTop: -avatarSize * 0.3 }]}>
        {renderAvatar()}
        {renderEditButton()}
      </View>
      
      <View style={[styles.textContainer, textContainerStyle]}>
        <Text 
          style={[
            styles.name, 
            { 
              color: '#000000',
            },
            nameStyle,
          ]}
          variant="h4"
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          testID="profile-name"
        >
          {name || 'User'}
        </Text>
        
        {showEmail && email && (
          <View style={styles.emailContainer}>
            <MaterialIcons 
              name="email" 
              size={16} 
              color="#000000" 
              style={styles.emailIcon}
              testID="email-icon"
            />
            <Text 
              style={[
                styles.email, 
                { 
                  color: '#000000',
                  opacity: 0.9,
                },
                emailStyle,
              ]}
              variant="body2"
              numberOfLines={1}
              ellipsizeMode="tail"
              testID="profile-email"
            >
              {email}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View 
        style={[
          styles.loadingContainer, 
          { backgroundColor: theme.colors.primary },
          style,
        ]}
        testID="loading-container"
      >
        <View style={styles.loadingContent}>
          <View 
            style={[
              styles.loadingAvatar, 
              { 
                width: avatarSize, 
                height: avatarSize, 
                borderRadius: avatarSize / 2,
                backgroundColor: theme.colors.gray200,
              }
            ]} 
          />
          <View style={styles.loadingTextContainer}>
            <View 
              style={[
                styles.loadingText, 
                { 
                  backgroundColor: theme.colors.gray200,
                  width: 120,
                  marginBottom: 8
                }
              ]} 
            />
            <View 
              style={[
                styles.loadingText, 
                { 
                  backgroundColor: theme.colors.gray200,
                  width: 160,
                  opacity: 0.7
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  }

  // Gradient props are now handled inline where needed

  return (
    <View style={[styles.container, style]} testID={testID}>
      {renderContent()}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
  },
  content: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emailIcon: {
    marginRight: 6,
    opacity: 0.8,
  },
  email: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingAvatar: {
    marginRight: 16,
  },
  loadingTextContainer: {
    flex: 1,
  },
  loadingText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
});
