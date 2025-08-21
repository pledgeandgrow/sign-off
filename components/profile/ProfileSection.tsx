import React from 'react';
import { 
  View, 
  StyleSheet, 
  StyleProp, 
  ViewStyle, 
  TextStyle,
  TouchableWithoutFeedback,
  ViewProps,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text } from '@/components/ui/Text';

interface ProfileSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  hideSeparator?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  headerRight?: React.ReactNode;
  onHeaderPress?: () => void;
}

type ChildWithStyle = React.ReactElement<{ style?: StyleProp<ViewStyle> }>;

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  children,
  style,
  contentContainerStyle,
  hideSeparator = false,
  titleStyle,
  headerRight,
  onHeaderPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const renderHeader = () => {
    if (!title && !headerRight) return null;
    
    const headerContent = (
      <>
        {title && (
          <Text 
            style={[
              styles.title,
              { 
                color: colors.textSecondary,
              },
              titleStyle,
            ]}
            variant="caption"
            weight="medium"
            numberOfLines={1}
          >
            {title.toUpperCase()}
          </Text>
        )}
        {headerRight && (
          <View style={styles.headerRight}>
            {headerRight}
          </View>
        )}
      </>
    );

    if (onHeaderPress) {
      return (
        <TouchableWithoutFeedback onPress={onHeaderPress}>
          <View style={styles.header}>
            {headerContent}
          </View>
        </TouchableWithoutFeedback>
      );
    }

    return <View style={styles.header}>{headerContent}</View>;
  };
  
  const renderChildren = () => {
    try {
      return React.Children.map(children, (child, index) => {
        if (!React.isValidElement<ViewProps>(child)) {
          return child;
        }
        
        const isLast = index === React.Children.count(children) - 1;
        const childStyle = [
          child.props.style,
          !isLast && !hideSeparator && { 
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          },
        ];
        
        return React.cloneElement(child as ChildWithStyle, { 
          style: childStyle,
        });
      });
    } catch (error) {
      console.error('Error rendering ProfileSection children:', error);
      return children;
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        style,
      ]}
    >
      {renderHeader()}
      <View 
        style={[
          styles.content,
          contentContainerStyle,
        ]}
      >
        {renderChildren()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    marginLeft: 8,
  },
  content: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 0,
  }
});
