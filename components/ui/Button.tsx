import { useTheme } from '@/contexts/ThemeContext';
import React, { forwardRef, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  /** Button text or content */
  children: ReactNode | ((state: { pressed: boolean }) => ReactNode);
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Custom styles */
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** Custom text styles */
  textStyle?: StyleProp<TextStyle>;
  /** Icon to display before the text */
  leftIcon?: ReactNode;
  /** Icon to display after the text */
  rightIcon?: ReactNode;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Make button full width */
  fullWidth?: boolean;
  /** Custom border radius */
  borderRadius?: number;
  /** Disable the button */
  disabled?: boolean;
}

/**
 * A customizable button component with multiple variants and states
 */
const Button = forwardRef<View, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  borderRadius,
  loadingComponent,
  disabled = false,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const isDisabled = disabled || loading;

  // Button variants with proper typing
  type VariantStyle = {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  };

  const variantStyles: Record<ButtonVariant, VariantStyle> = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    secondary: {
      backgroundColor: colors.gray200,
      borderColor: colors.gray200,
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
      borderWidth: 1,
    },
  };

  // Text colors for variants with proper typing
  const textColors: Record<ButtonVariant, string> = {
    primary: colors.background,
    secondary: colors.text,
    outline: colors.primary,
    ghost: colors.primary,
    danger: colors.background,
  };

  // Button sizes with proper typing
  type SizeStyle = {
    paddingVertical: number;
    paddingHorizontal: number;
    minHeight: number;
  };

  const sizes: Record<ButtonSize, SizeStyle> = {
    sm: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      minHeight: 32,
    },
    md: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 40,
    },
    lg: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      minHeight: 48,
    },
  };

  // Text sizes with proper typing
  const textSizes: Record<ButtonSize, number> = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  // Icon sizes with proper typing
  const iconSizes: Record<ButtonSize, number> = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  // Get button styles based on state
  const getButtonStyle = (pressed: boolean): ViewStyle => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizes[size];
    
    return {
      ...styles.button,
      backgroundColor: variantStyle.backgroundColor,
      borderColor: variantStyle.borderColor,
      borderWidth: variantStyle.borderWidth,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      minHeight: sizeStyle.minHeight,
      opacity: isDisabled ? 0.6 : (pressed ? 0.8 : 1),
      width: fullWidth ? '100%' : undefined,
      borderRadius: borderRadius ?? 8,
    };
  };

  const textStyleComposed: TextStyle = {
    ...styles.text,
    color: textColors[variant],
    fontSize: textSizes[size],
    marginLeft: leftIcon ? 8 : 0,
    marginRight: rightIcon ? 8 : 0,
    ...(textStyle as object),
  };

  const renderContent = (pressed: boolean) => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={textColors[variant]} 
          />
          {typeof children === 'function' ? (
            children({ pressed })
          ) : (
            <Text style={textStyleComposed}>
              {children}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.buttonContent}>
        {leftIcon && (
          <View style={[styles.iconLeft, { width: iconSizes[size], height: iconSizes[size] }]}>
            {leftIcon}
          </View>
        )}
        {typeof children === 'function' ? (
          children({ pressed })
        ) : (
          <Text style={textStyleComposed}>
            {children}
          </Text>
        )}
        {rightIcon && (
          <View style={[styles.iconRight, { width: iconSizes[size], height: iconSizes[size] }]}>
            {rightIcon}
          </View>
        )}
      </View>
    );
  };

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      style={(state) => {
        const buttonStyle = getButtonStyle(state.pressed);
        const customStyle = typeof style === 'function' 
          ? style(state) 
          : style;
        return [buttonStyle, customStyle];
      }}
      {...props}
    >
      {(state) => renderContent(state.pressed)}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export { Button };
