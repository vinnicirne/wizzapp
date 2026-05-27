// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBrPsBhVcE1RViGVX4_crerwMmu9suO_dw",
  authDomain: "wizzapp-8648c.firebaseapp.com",
  projectId: "wizzapp-8648c",
  storageBucket: "wizzapp-8648c.firebasestorage.app",
  messagingSenderId: "828474339544",
  appId: "COLE_O_APP_ID_AQUI" 
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
