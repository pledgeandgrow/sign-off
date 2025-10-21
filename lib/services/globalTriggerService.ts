import { supabase } from '@/lib/supabase';

export type GlobalTriggerMethod = 
  | 'inactivity' 
  | 'death_certificate' 
  | 'trusted_contact' 
  | 'heir_notification' 
  | 'scheduled_date' 
  | 'manual_trigger';

export interface GlobalTriggerSettings {
  method: GlobalTriggerMethod;
  settings?: {
    days?: number;
    contactEmail?: string;
    contactName?: string;
    date?: string;
  };
}

/**
 * Save global trigger method and settings for a user
 * This will apply to ALL active inheritance plans
 */
export async function saveGlobalTrigger(
  userId: string,
  method: GlobalTriggerMethod,
  settings?: any
): Promise<void> {
  try {
    // Update user's global trigger settings
    const { error: userError } = await supabase
      .from('users')
      .update({
        global_trigger_method: method,
        global_trigger_settings: settings || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error saving global trigger to users table:', userError);
      throw userError;
    }

    console.log('Global trigger saved successfully:', { method, settings });
  } catch (error) {
    console.error('Error in saveGlobalTrigger:', error);
    throw error;
  }
}

/**
 * Get global trigger settings for a user
 */
export async function getGlobalTrigger(
  userId: string
): Promise<GlobalTriggerSettings | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('global_trigger_method, global_trigger_settings')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching global trigger:', error);
      return null;
    }

    if (!data?.global_trigger_method) {
      return null;
    }

    return {
      method: data.global_trigger_method as GlobalTriggerMethod,
      settings: data.global_trigger_settings || {},
    };
  } catch (error) {
    console.error('Error in getGlobalTrigger:', error);
    return null;
  }
}

/**
 * Apply global trigger to all active inheritance plans
 * This creates inheritance_triggers records for each active plan
 */
export async function applyGlobalTriggerToPlans(
  userId: string,
  triggerReason: string
): Promise<void> {
  try {
    // Get all active inheritance plans for the user
    const { data: plans, error: plansError } = await supabase
      .from('inheritance_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (plansError) {
      console.error('Error fetching active plans:', plansError);
      throw plansError;
    }

    if (!plans || plans.length === 0) {
      console.log('No active plans to trigger');
      return;
    }

    // Get global trigger settings
    const globalTrigger = await getGlobalTrigger(userId);
    if (!globalTrigger) {
      throw new Error('No global trigger configured');
    }

    // Create trigger records for all active plans
    const triggerRecords = plans.map(plan => ({
      inheritance_plan_id: plan.id,
      user_id: userId,
      trigger_reason: triggerReason,
      trigger_metadata: {
        global_trigger_method: globalTrigger.method,
        global_trigger_settings: globalTrigger.settings,
        triggered_at: new Date().toISOString(),
      },
      status: 'pending',
      requires_verification: globalTrigger.method === 'death_certificate',
    }));

    const { error: triggersError } = await supabase
      .from('inheritance_triggers')
      .insert(triggerRecords);

    if (triggersError) {
      console.error('Error creating trigger records:', triggersError);
      throw triggersError;
    }

    console.log(`Global trigger applied to ${plans.length} active plans`);
  } catch (error) {
    console.error('Error in applyGlobalTriggerToPlans:', error);
    throw error;
  }
}

/**
 * Check if global trigger conditions are met
 * This would be called by a background job/cron
 */
export async function checkGlobalTriggerConditions(userId: string): Promise<boolean> {
  try {
    const globalTrigger = await getGlobalTrigger(userId);
    if (!globalTrigger) {
      return false;
    }

    const { method, settings } = globalTrigger;

    switch (method) {
      case 'inactivity':
        // Check last login date
        const { data: userData } = await supabase
          .from('users')
          .select('last_login_at')
          .eq('id', userId)
          .single();

        if (userData?.last_login_at) {
          const lastLogin = new Date(userData.last_login_at);
          const daysSinceLogin = Math.floor(
            (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceLogin >= (settings?.days || 90);
        }
        break;

      case 'scheduled_date':
        // Check if scheduled date has passed
        if (settings?.date) {
          const scheduledDate = new Date(settings.date);
          return Date.now() >= scheduledDate.getTime();
        }
        break;

      case 'manual_trigger':
        // Manual trigger is handled separately
        return false;

      default:
        return false;
    }

    return false;
  } catch (error) {
    console.error('Error checking trigger conditions:', error);
    return false;
  }
}
