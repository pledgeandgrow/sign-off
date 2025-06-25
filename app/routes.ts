// This file defines all the routes in your app
export const ROUTES = {
  // Auth routes
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
  RECOVERY: 'recovery',
  
  // Main app routes
  HOME: '/(tabs)',
  EXPLORE: '/(tabs)/explore',
  
  // Other routes
  NOT_FOUND: '+not-found',
} as const;

export type AppRoute = keyof typeof ROUTES;

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      [ROUTES.SIGN_IN]: undefined;
      [ROUTES.SIGN_UP]: undefined;
      [ROUTES.RECOVERY]: undefined;
      [ROUTES.HOME]: undefined;
      [ROUTES.EXPLORE]: undefined;
      [ROUTES.NOT_FOUND]: undefined;
    }
  }
}

export function getRoute(route: AppRoute, params?: Record<string, string>): string {
  let path = `/${ROUTES[route]}`;
  
  // Replace route params if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  
  return path;
}
