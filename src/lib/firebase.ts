import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Preenchemos quase tudo usando os dados do seu google-services.json
// Falta apenas o appId que você pega na aba Geral das configurações
const firebaseConfig = {
  apiKey: "AIzaSyCHLEdpyKfYOvhIQsmhVzEx6-DZcRIDnLk",
  authDomain: "wizzapp-8648c.firebaseapp.com",
  projectId: "wizzapp-8648c",
  storageBucket: "wizzapp-8648c.firebasestorage.app",
  messagingSenderId: "828474339544",
  appId: "1:828474339544:web:6611c31c1834f4176e67ad"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Cloud Messaging
export const messaging = getMessaging(app);

// A chave VAPID que extraí do seu Print
export const VAPID_KEY = "BEOcHKK9AJAx7X9OhWiNUeF7xgD6PlMOrvBVs7DbGNKY4tuY-AZIbwDOKYAWOAJbDK-xjOEbPGDvrT37RFPzQR4";

export { getToken, onMessage };
