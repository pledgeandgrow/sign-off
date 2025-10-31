/**
 * MOCK In-App Purchase Service
 * 
 * Ce fichier est un mock temporaire pour que le code compile.
 * Une fois expo-in-app-purchases installé, renommez inAppPurchaseService.ts.backup
 * en inAppPurchaseService.ts et supprimez ce fichier.
 * 
 * INSTALLATION:
 * Ouvrez PowerShell en tant qu'administrateur et exécutez:
 * Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
 * 
 * Puis dans votre terminal normal:
 * npm install --save expo-in-app-purchases --legacy-peer-deps
 */

import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: Platform.select({
    ios: 'com.signoff.premium.monthly',
    android: 'premium_monthly',
  }) as string,
  PREMIUM_YEARLY: Platform.select({
    ios: 'com.signoff.premium.yearly',
    android: 'premium_yearly',
  }) as string,
};

export interface PurchaseProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: 'subscription' | 'consumable';
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  productId?: string;
  error?: string;
}

export async function initializeIAP(): Promise<{ success: boolean; error?: string }> {
  console.warn('⚠️ Using MOCK IAP Service - Install expo-in-app-purchases first');
  return { success: false, error: 'IAP not installed. Please install expo-in-app-purchases package.' };
}

export async function disconnectIAP(): Promise<void> {
  console.log('MOCK: IAP disconnected');
}

export async function getProducts(): Promise<PurchaseProduct[]> {
  console.warn('⚠️ Using MOCK IAP Service - Returning mock products');
  
  // Return mock products for UI testing
  return [
    {
      productId: PRODUCT_IDS.PREMIUM_MONTHLY,
      title: 'Premium Mensuel',
      description: 'Abonnement premium mensuel',
      price: '10,00 €',
      priceAmountMicros: 10000000,
      priceCurrencyCode: 'EUR',
      type: 'subscription',
    },
    {
      productId: PRODUCT_IDS.PREMIUM_YEARLY,
      title: 'Premium Annuel',
      description: 'Abonnement premium annuel',
      price: '100,00 €',
      priceAmountMicros: 100000000,
      priceCurrencyCode: 'EUR',
      type: 'subscription',
    },
  ];
}

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  console.warn('⚠️ Using MOCK IAP Service - Purchase not available');
  return { 
    success: false, 
    error: 'IAP not installed. Please install expo-in-app-purchases package.' 
  };
}

export async function restorePurchases(): Promise<{
  success: boolean;
  purchases: any[];
  error?: string;
}> {
  console.warn('⚠️ Using MOCK IAP Service - Restore not available');
  return { success: false, purchases: [], error: 'IAP not installed' };
}

export async function verifyPurchase(
  userId: string,
  transactionId: string,
  productId: string,
  receiptData: string
): Promise<{ success: boolean; error?: string }> {
  console.warn('⚠️ Using MOCK IAP Service - Verification not available');
  return { success: false, error: 'IAP not installed' };
}

export async function completePurchaseFlow(
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  console.warn('⚠️ Using MOCK IAP Service - Purchase flow not available');
  return { 
    success: false, 
    error: 'Les achats in-app ne sont pas encore configurés. Veuillez installer expo-in-app-purchases.' 
  };
}

export async function checkSubscriptionStatus(userId: string): Promise<{
  isActive: boolean;
  expiresAt?: Date;
  productId?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return { isActive: false };
    }
    
    const expiresAt = (data as any).current_period_end ? new Date((data as any).current_period_end) : undefined;
    const isActive = expiresAt ? expiresAt > new Date() : false;
    
    return {
      isActive,
      expiresAt,
      productId: (data as any).store_product_id,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isActive: false };
  }
}

export async function cancelSubscription(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
