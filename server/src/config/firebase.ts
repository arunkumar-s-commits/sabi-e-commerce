import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized using inline service account JSON.');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin SDK initialized using application default credentials.');
  } else {
    // Development Mock/Fallback setup if credentials aren't provided yet
    console.warn(
      'WARNING: Firebase configurations not found. Running in Development Fallback Mode.'
    );
    // Initialize with a dummy config for structural verification
    admin.initializeApp({
      projectId: 'sabi-return-gifts-mock',
    });
  }

  db = admin.firestore();
  auth = admin.auth();
  
  // Set Firestore settings
  db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // Fallback to avoid process crash
  db = {} as admin.firestore.Firestore;
  auth = {} as admin.auth.Auth;
}

export { db, auth, admin };
