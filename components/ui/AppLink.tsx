import { Link as ExpoLink, LinkProps } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

type AppLinkProps = Omit<LinkProps, 'href'> & {
  children: ReactNode;
  href: string;
  style?: any;
};

export function AppLink({ children, href, style, ...props }: AppLinkProps) {
  return (
    <ExpoLink 
      href={href as any} 
      style={[styles.link, style]}
      {...props}
    >
      <Text style={styles.text}>{children}</Text>
    </ExpoLink>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: 16,
  },
  text: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
