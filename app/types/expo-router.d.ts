import { LinkProps as OriginalLinkProps } from 'expo-router';

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      // Auth routes
      'sign-in': undefined;
      'sign-up': undefined;
      recovery: undefined;
      
      // Main app routes
      '(tabs)': undefined;
      '(tabs)/explore': undefined;
      // Add other routes as needed
    }
  }
}

declare module 'expo-router' {
  export interface LinkProps extends Omit<OriginalLinkProps, 'href'> {
    href: keyof ReactNavigation.RootParamList | string;
  }
}
