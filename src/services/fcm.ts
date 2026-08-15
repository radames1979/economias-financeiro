import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Registers user's FCM Push Notification token and binds it to their Firestore user profile.
 */
export const registerFCMToken = async (userId: string): Promise<string | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Workers ou navigator não estão disponíveis.');
    return null;
  }

  try {
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log('Firebase Messaging não é suportado neste navegador.');
      return null;
    }

    // Register active Firebase Messaging service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    }).catch(err => {
      console.warn('Service Worker FCM não pôde ser registrado:', err);
      return null;
    });

    if (!registration) return null;

    const messaging = getMessaging();
    
    // Check if custom VAPID key is provided in environment variables
    const customVapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY;
    const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
      serviceWorkerRegistration: registration,
    };
    
    // Valid standard Web Push VAPID keys are base64url strings of at least 80 chars
    if (typeof customVapidKey === 'string' && customVapidKey.trim().length > 50) {
      tokenOptions.vapidKey = customVapidKey.trim();
    }

    // Request a push token with our registration details
    const token = await getToken(messaging, tokenOptions).catch((e) => {
      console.warn('FCM Push token indisponível neste ambiente ou sem VAPID key:', e?.message || e);
      return null;
    });

    if (token) {
      console.log('FCM Token carregado:', token);
      
      // Persist the token to Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmRegisteredAt: new Date().toISOString(),
        pushEnabled: true
      }).catch(err => {
        console.error('Erro ao salvar token de push no perfil do usuário:', err);
      });
      return token;
    }

    return null;
  } catch (error) {
    console.error('Erro geral ao inicializar notificações push:', error);
    return null;
  }
};
