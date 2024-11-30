import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs  } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "Your Key",
    authDomain: "tgtg-a6e6c.firebaseapp.com",
    projectId: "tgtg-a6e6c",
    storageBucket: "tgtg-a6e6c.firebasestorage.app",
    messagingSenderId: "957247169290",
    appId: "1:957247169290:web:840648ceebf1aaccc810f3"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  export async function AddItemToDB(path:string, jsonStr:string)
  {
    try 
    {
        const docRef = await addDoc(collection(db, path), {
            jsonStr: jsonStr
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
  }

  export async function GetItemFromDB(path:string)
  {
        const querySnapshot = await getDocs(collection(db, path));
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data()}`);
        });
  }