import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'button'
  | 'caption'
  | 'overline';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  subtitle1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  subtitle2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
  overline: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
};

const weightMap = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const Text: React.FC<TextProps> = ({
  variant = 'body1',
  color,
  align = 'left',
  weight = 'normal',
  style,
  children,
  numberOfLines,
  ellipsizeMode,
  selectable = false,
  ...rest
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const textColor = color || colors.text;

  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        {
          color: textColor,
          textAlign: align,
          fontWeight: weightMap[weight],
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      selectable={selectable}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});


