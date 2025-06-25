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
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();
  
  const renderHeader = () => {
    if (!title && !headerRight) return null;
    
    const headerContent = (
      <>
        {title && (
          <Text 
            style={[
              styles.title,
              { 
                color: '#000000',
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
            borderBottomColor: theme.colors.border,
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
          backgroundColor: '#ffffff',
          borderColor: '#f0f0f0',
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
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    marginLeft: 8,
  },
  content: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    paddingHorizontal: 0,
  }
});
