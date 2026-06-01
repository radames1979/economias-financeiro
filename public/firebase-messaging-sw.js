/*
  Firebase Cloud Messaging (FCM) Service Worker
  Provides background push notification handling.
*/
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDkkODcuX_4nk1QCKF2HQqBH6KHi9bKFP8",
  authDomain: "gen-lang-client-0355803978.firebaseapp.com",
  projectId: "gen-lang-client-0355803978",
  storageBucket: "gen-lang-client-0355803978.firebasestorage.app",
  messagingSenderId: "1061426677966",
  appId: "1:1061426677966:web:3aa6fd0b54e46c6b15e89f"
};

// Initialize helper
firebase.initializeApp(firebaseConfig);

try {
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Lembrete Financeiro';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Você tem uma atualização em suas contas.',
      icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.data?.tag || 'default-tag',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[firebase-messaging-sw.js] Messaging não suportado ou erro de inicialização:', e);
}
