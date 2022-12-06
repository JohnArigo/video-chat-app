import firebase from "firebase/app";
import "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.FIRE_KEY,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
};

// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
//@ts-ignore
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
//@ts-ignore
const firestore = firebase.firestore();
//find public IP/NAT type
//use STUN server from google
//init webrtc

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
      ],
    },
  ],
  iceCandidatepoolSize: 10,
};
export { firestore, servers };
