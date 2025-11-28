import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Bell, BellOff } from 'lucide-react';

export default function PushNotificationToggle() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    checkPushSupport();
    checkSubscriptionStatus();
  }, [user]);

  const checkPushSupport = () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!supported || !user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY ||
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYjEB6Hqg';

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      const subscriptionJson = subscription.toJSON();

      await supabase.from('push_subscriptions').insert({
        user_id: user?.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscriptionJson.keys?.p256dh || '',
        auth_key: subscriptionJson.keys?.auth || '',
      });

      setIsSubscribed(true);
      alert('Push notifications enabled successfully');
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      alert('Failed to enable push notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user?.id)
          .eq('endpoint', subscription.endpoint);

        setIsSubscribed(false);
        alert('Push notifications disabled');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      alert('Failed to disable push notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!supported) {
      alert('Push notifications are not supported in your browser');
      return;
    }

    if (isSubscribed) {
      await unsubscribeFromPush();
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush();
      } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
      }
    }
  };

  if (!supported) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-blue-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-800">Push Notifications</p>
            <p className="text-sm text-gray-600">
              {isSubscribed ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            isSubscribed
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
