export type RootStackParamList = {
  // Auth routes
  'sign-in': undefined;
  'sign-up': undefined;
  'recovery': undefined;
  
  // Main app routes
  '(tabs)': undefined;
  '(tabs)/explore': undefined;
  
  // Other routes
  '+not-found': undefined;
};

// This allows us to use the routes in our components
declare global {
  namespace ReactNavigation {
    type RootParamList = RootStackParamList;
  }
}
