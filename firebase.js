// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDj0Q6vHW-SvUtEcIiDOIlGEM2w34aWwsg",
  authDomain: "inventory-management-98398.firebaseapp.com",
  projectId: "inventory-management-98398",
  storageBucket: "inventory-management-98398.appspot.com",
  messagingSenderId: "742462545671",
  appId: "1:742462545671:web:8a1fd6af0388de8bfbefa2",
  measurementId: "G-5Z6N5XLWVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export {firestore}