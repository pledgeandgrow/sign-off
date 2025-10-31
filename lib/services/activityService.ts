import { supabase } from '@/lib/supabase';

export type ActivityType = 'vault' | 'heir' | 'security' | 'inheritance' | 'document';

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Get recent activities for a user
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 10
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  return data || [];
}

/**
 * Log a new activity
 */
export async function logActivity(
  userId: string,
  activityType: ActivityType,
  title: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: activityType,
        title,
        description,
        metadata,
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Get activity icon based on type
 */
export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'vault':
      return 'lock';
    case 'heir':
      return 'account-plus';
    case 'security':
      return 'shield-check';
    case 'inheritance':
      return 'file-document-multiple';
    case 'document':
      return 'file-document';
    default:
      return 'alert-circle';
  }
}

/**
 * Format activity time (relative)
 */
export function formatActivityTime(createdAt: string): string {
  const now = new Date();
  const activityDate = new Date(createdAt);
  const diffInMs = now.getTime() - activityDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'À l\'instant';
  } else if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  } else if (diffInDays === 1) {
    return 'Il y a 1j';
  } else if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`;
  } else {
    return activityDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}
