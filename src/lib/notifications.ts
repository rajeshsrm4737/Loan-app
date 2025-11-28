import { supabase } from './supabase';

export type NotificationType = 'due_alert' | 'payment_confirmed' | 'loan_approved' | 'loan_rejected' | 'general';

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface TemplateVariables {
  [key: string]: string | number;
}

export async function createNotification(data: NotificationData): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      sent_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

export async function getNotificationTemplate(type: NotificationType) {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('type', type)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template;

  Object.keys(variables).forEach((key) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(variables[key]));
  });

  return result;
}

export async function sendNotificationFromTemplate(
  userId: string,
  type: NotificationType,
  variables: TemplateVariables
): Promise<void> {
  try {
    const template = await getNotificationTemplate(type);

    if (!template) {
      console.error(`Template not found for type: ${type}`);
      return;
    }

    const title = replaceTemplateVariables(template.subject, variables);
    const message = replaceTemplateVariables(template.in_app_body, variables);

    await createNotification({
      userId,
      type,
      title,
      message,
      metadata: { variables },
    });

    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (userData) {
      const emailBody = replaceTemplateVariables(template.email_body, {
        ...variables,
        user_name: userData.full_name,
      });

      await queueEmail(userData.email, title, emailBody);
    }

    await sendPushNotification(userId, title, replaceTemplateVariables(template.push_body, variables));
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

export async function queueEmail(toEmail: string, subject: string, body: string): Promise<void> {
  try {
    const { error } = await supabase.from('email_queue').insert({
      to_email: toEmail,
      subject,
      body,
      status: 'pending',
    });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to queue email:', err);
  }
}

export async function sendPushNotification(userId: string, title: string, body: string): Promise<void> {
  try {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    for (const sub of subscriptions) {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;

          await registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          });
        }
      } catch (err) {
        console.error('Push notification failed for subscription:', sub.id, err);
      }
    }
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}
