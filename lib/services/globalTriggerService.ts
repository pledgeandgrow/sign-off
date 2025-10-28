import { supabase } from '@/lib/supabase';
import { notifyHeirs } from './heirNotificationService';

export type GlobalTriggerMethod = 
  | 'inactivity' 
  | 'death_certificate' 
  | 'manual_trigger' 
  | 'scheduled';

export interface GlobalTriggerSettings {
  global_trigger_method: GlobalTriggerMethod;
  global_trigger_settings: {
    inactivity_days?: number;
  };
  global_scheduled_date?: string | null;
  trusted_contact_email?: string | null;
  trusted_contact_phone?: string | null;
  last_activity?: string | null;
}

/**
 * Save global trigger method and settings for a user
 * This will apply to ALL active inheritance plans
 */
export async function saveGlobalTrigger(
  userId: string,
  settings: Partial<GlobalTriggerSettings>
): Promise<void> {
  try {
    const updateData: any = {};
    
    if (settings.global_trigger_method) {
      updateData.global_trigger_method = settings.global_trigger_method;
    }
    if (settings.global_trigger_settings) {
      updateData.global_trigger_settings = settings.global_trigger_settings;
    }
    if (settings.global_scheduled_date !== undefined) {
      updateData.global_scheduled_date = settings.global_scheduled_date;
    }
    if (settings.trusted_contact_email !== undefined) {
      updateData.trusted_contact_email = settings.trusted_contact_email;
    }
    if (settings.trusted_contact_phone !== undefined) {
      updateData.trusted_contact_phone = settings.trusted_contact_phone;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error saving global trigger:', error);
      throw error;
    }

    console.log('Global trigger saved successfully:', updateData);
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
      .select('global_trigger_method, global_trigger_settings, global_scheduled_date, trusted_contact_email, trusted_contact_phone, last_activity')
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
      global_trigger_method: data.global_trigger_method as GlobalTriggerMethod,
      global_trigger_settings: data.global_trigger_settings || { inactivity_days: 30 },
      global_scheduled_date: data.global_scheduled_date,
      trusted_contact_email: data.trusted_contact_email,
      trusted_contact_phone: data.trusted_contact_phone,
      last_activity: data.last_activity,
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
        global_trigger_method: globalTrigger.global_trigger_method,
        global_trigger_settings: globalTrigger.global_trigger_settings,
        triggered_at: new Date().toISOString(),
      },
      status: 'pending',
      requires_verification: globalTrigger.global_trigger_method === 'death_certificate',
    }));

    const { error: triggersError } = await supabase
      .from('inheritance_triggers')
      .insert(triggerRecords);

    if (triggersError) {
      console.error('Error creating trigger records:', triggersError);
      throw triggersError;
    }

    // Mark plans as triggered
    await supabase
      .from('inheritance_plans')
      .update({ 
        is_triggered: true, 
        triggered_at: new Date().toISOString() 
      })
      .in('id', plans.map(p => p.id));

    // Notify heirs
    await notifyHeirs(userId, plans.map(p => p.id));

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

    const { global_trigger_method, global_trigger_settings, global_scheduled_date, last_activity } = globalTrigger;

    switch (global_trigger_method) {
      case 'inactivity':
        // Check last activity date
        if (last_activity) {
          const lastActivityDate = new Date(last_activity);
          const daysSinceActivity = Math.floor(
            (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const threshold = global_trigger_settings?.inactivity_days || 30;
          return daysSinceActivity >= threshold;
        }
        break;

      case 'scheduled':
        // Check if scheduled date has passed
        if (global_scheduled_date) {
          const scheduledDate = new Date(global_scheduled_date);
          return Date.now() >= scheduledDate.getTime();
        }
        break;

      case 'manual_trigger':
        // Manual trigger is handled separately
        return false;

      case 'death_certificate':
        // Death certificate requires manual verification
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

/**
 * Update user's last activity timestamp
 * Call this on any significant user action
 */
export async function updateLastActivity(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last activity:', error);
      // Don't throw - activity tracking shouldn't break the app
    }
  } catch (error) {
    console.error('Error in updateLastActivity:', error);
    // Don't throw - activity tracking shouldn't break the app
  }
}
