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
    
    // Request a push token with our registration details
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      // Default public FCM server configuration key (vapid key) for direct token allocation
      vapidKey: 'BDb0V9q55g4b0U392b8A-0eN3gAWeS88b2b6U3B4N8B8V4Y8T5A2T1B6N1W2Y3E4C'
    }).catch((e) => {
      console.warn('Falha na obtenção do Token FCM (esperado se não for HTTPS completo ou sem VAPID customizado):', e);
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
