const admin = require('firebase-admin');
const path = require('path');

let db;

const initializeFirebase = () => {
  try {
    // Try to load service account key
    let serviceAccount;
    
    // Check if running with environment variables (preferred method)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
      serviceAccount = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };
      console.log('📝 Using Firebase credentials from environment variables');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Use custom service account file path from environment variable
      serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    } else {
      // Development - use default service account file
      const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
      serviceAccount = require(serviceAccountPath);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    db = admin.firestore();
    console.log('✅ Firebase initialized successfully');
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('📝 Please ensure you have:');
    console.log('   1. Set Firebase environment variables in .env file');
    console.log('   2. Or set FIREBASE_SERVICE_ACCOUNT_PATH to your JSON file');
    console.log('   3. Or added serviceAccountKey.json to server/src/config/');
    process.exit(1);
  }
};

const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

const getAuth = () => {
  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};