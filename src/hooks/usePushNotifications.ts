import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { messaging, getToken, onMessage, VAPID_KEY } from '../lib/firebase';

export function usePushNotifications() {
  const { currentUser } = useAppStore();

  useEffect(() => {
    if (!currentUser.id) return;

    if (Capacitor.isNativePlatform()) {
      registerNativePush();
    } else {
      registerWebPush();
    }
  }, [currentUser.id]);

  const registerWebPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          console.log('Web FCM Token:', token);
          await supabase.from('profiles').update({ fcm_token: token }).eq('id', currentUser.id);
        }

        onMessage(messaging, (payload: any) => {
          console.log('Mensagem recebida no Web com o app aberto:', payload);
          // O service worker lida com o background
        });
      }
    } catch (err) {
      console.error('Erro ao registrar Web Push:', err);
    }
  };

  const registerNativePush = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token) => {
        console.log('Native FCM Token:', token.value);
        await supabase.from('profiles').update({ fcm_token: token.value }).eq('id', currentUser.id);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notificação recebida com o app aberto (Native):', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Notificação clicada:', notification);
      });
    } catch (e) {
      console.error('PushNotifications não suportado neste ambiente', e);
    }
  };
}
