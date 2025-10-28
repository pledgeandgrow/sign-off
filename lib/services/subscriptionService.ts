import { supabase } from '@/lib/supabase';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

export interface UserSubscription {
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at?: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  square_subscription_id?: string;
  square_customer_id?: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Check if user has active premium subscription
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error checking premium status:', error);
      return false;
    }

    // Check if premium and active
    if (data.subscription_tier !== 'premium') {
      return false;
    }

    if (data.subscription_status !== 'active') {
      return false;
    }

    // Check if not expired
    if (data.subscription_expires_at) {
      const expiresAt = new Date(data.subscription_expires_at);
      if (expiresAt < new Date()) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Exception in isPremiumUser:', error);
    return false;
  }
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error getting subscription:', error);
      return null;
    }

    return data as UserSubscription;
  } catch (error) {
    console.error('Exception in getUserSubscription:', error);
    return null;
  }
}

/**
 * Get subscription record from subscriptions table
 */
export async function getSubscriptionRecord(userId: string): Promise<SubscriptionRecord | null> {
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
      return null;
    }

    return data as SubscriptionRecord;
  } catch (error) {
    console.error('Exception in getSubscriptionRecord:', error);
    return null;
  }
}

/**
 * Activate premium subscription
 * Called when Square webhook confirms payment
 */
export async function activatePremiumSubscription(
  userId: string,
  squareSubscriptionId: string,
  squareCustomerId: string,
  periodEnd: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user subscription status
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'premium',
        subscription_status: 'active',
        subscription_expires_at: periodEnd.toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user subscription:', userError);
      return { success: false, error: userError.message };
    }

    // Create or update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        square_subscription_id: squareSubscriptionId,
        square_customer_id: squareCustomerId,
        plan_name: 'Premium',
        amount: 10.00,
        currency: 'EUR',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      }, {
        onConflict: 'square_subscription_id'
      });

    if (subError) {
      console.error('Error creating subscription record:', subError);
      return { success: false, error: subError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in activatePremiumSubscription:', error);
    return { success: false, error: 'Failed to activate subscription' };
  }
}

/**
 * Cancel premium subscription
 * Called when Square webhook confirms cancellation
 */
export async function cancelPremiumSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user subscription status
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_status: 'cancelled',
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error cancelling user subscription:', userError);
      return { success: false, error: userError.message };
    }

    // Update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (subError) {
      console.error('Error updating subscription record:', subError);
      return { success: false, error: subError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in cancelPremiumSubscription:', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
}

/**
 * Handle payment failure (past due)
 */
export async function handlePaymentFailure(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating subscription to past_due:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in handlePaymentFailure:', error);
    return { success: false, error: 'Failed to handle payment failure' };
  }
}

/**
 * Log Square webhook event
 */
export async function logPaymentEvent(
  squareEventId: string,
  eventType: string,
  eventData: any,
  userId?: string,
  subscriptionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_events')
      .insert({
        square_event_id: squareEventId,
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        subscription_id: subscriptionId,
        processed: false,
      });

    if (error) {
      console.error('Error logging payment event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in logPaymentEvent:', error);
    return { success: false, error: 'Failed to log event' };
  }
}

/**
 * Mark payment event as processed
 */
export async function markEventProcessed(
  eventId: string,
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('square_event_id', eventId);

    if (error) {
      console.error('Error marking event as processed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in markEventProcessed:', error);
    return { success: false, error: 'Failed to mark event' };
  }
}

/**
 * Get subscription limits based on tier
 */
export function getSubscriptionLimits(tier: SubscriptionTier) {
  if (tier === 'premium') {
    return {
      maxVaults: Infinity,
      maxHeirs: Infinity,
      maxItemsPerVault: Infinity,
      maxInheritancePlans: Infinity,
      features: {
        encryption: true,
        twoFactor: true,
        inheritance: true,
        sharing: true,
        advancedSecurity: true,
      }
    };
  }

  // Free tier limits
  return {
    maxVaults: 3,
    maxHeirs: 3,
    maxItemsPerVault: 50,
    maxInheritancePlans: 1,
    features: {
      encryption: true,
      twoFactor: false,
      inheritance: true,
      sharing: false,
      advancedSecurity: false,
    }
  };
}

/**
 * Check if user can perform action based on subscription
 */
export async function canPerformAction(
  userId: string,
  action: 'create_vault' | 'add_heir' | 'add_item' | 'create_inheritance_plan'
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, reason: 'Unable to verify subscription' };
    }

    const limits = getSubscriptionLimits(subscription.subscription_tier);

    // Premium users can do everything
    if (subscription.subscription_tier === 'premium' && subscription.subscription_status === 'active') {
      return { allowed: true };
    }

    // Check free tier limits
    if (action === 'create_vault') {
      const { count } = await supabase
        .from('vaults')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= limits.maxVaults) {
        return { allowed: false, reason: `Offre gratuite limitée à ${limits.maxVaults} coffres-forts. Passez au Premium pour des coffres illimités.` };
      }
    }

    if (action === 'add_heir') {
      const { count } = await supabase
        .from('heirs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= limits.maxHeirs) {
        return { allowed: false, reason: `Offre gratuite limitée à ${limits.maxHeirs} héritiers. Passez au Premium pour des héritiers illimités.` };
      }
    }

    if (action === 'create_inheritance_plan') {
      const { count } = await supabase
        .from('inheritance_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= limits.maxInheritancePlans) {
        return { allowed: false, reason: `Offre gratuite limitée à ${limits.maxInheritancePlans} plan d'héritage. Passez au Premium pour des plans illimités.` };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Exception in canPerformAction:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
}
