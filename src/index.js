/**
 * use-firestoreCollections - A Vue composable for reactive Firestore collections
 * with automatic handling of Firebase Authentication lifecycle.
 *
 * This package expects Firebase to be initialized in your project or passed in.
 *
 * Dependencies: Vue 3, Firebase 9+
 */

import { ref } from 'vue'
import { getFirestore, collection, onSnapshot, Firestore } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getApps } from 'firebase/app'

/**
 * ensureFirebaseInitialized
 *
 * Checks if a Firebase app is available. If an instance is provided,
 * it returns that. Otherwise, it returns the first initialized app.
 *
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @returns {object} The Firebase app instance.
 * @throws {Error} If no Firebase app is initialized.
 */
function ensureFirebaseInitialized(firebaseAppInstance) {
  const app = firebaseAppInstance || (getApps().length ? getApps()[0] : null);
  if (!app) {
    throw new Error('No Firebase App initialized. Please call initializeApp() before using this composable, or pass the firebase app instance as a parameter.');
  }
  return app;
}

// Object to store the state for each subscribed Firestore collection.
// This ensures each collection is only subscribed once (singleton pattern).
const collectionsState = {}

/**
 * subscribeToCollection
 *
 * Sets up a Firestore subscription for the specified collection name and listens
 * for Firebase Auth state changes to handle subscription lifecycle automatically.
 *
 * @param {string} name - The Firestore collection name.
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @param {object} firestoreInstance - Optional Firestore instance.
 */
function subscribeToCollection(name, firebaseAppInstance, firestoreInstance) {
  if (!collectionsState[name]) {
    // Ensure Firebase is initialized (or get the passed instance)
    const app = ensureFirebaseInitialized(firebaseAppInstance);
    // Use the provided Firestore instance if available; otherwise, get it from the app.
    const db = firestoreInstance || getFirestore(app);
    const auth = getAuth(app);

    // Extended logging to inspect the Firestore instance.
    console.log('Using Firestore instance:', db);
    console.log('db constructor:', db?.constructor?.name);
    console.log('db instanceof Firestore:', db instanceof Firestore);
    console.log('db is instance of Object:', db instanceof Object);

    // Create reactive references.
    const data = ref([]);
    const loading = ref(true);
    const error = ref(null);

    // Variable to store the Firestore snapshot unsubscribe function.
    let unsubscribeSnapshot = null;

    // Listen for authentication state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!unsubscribeSnapshot) {
          loading.value = true;
          console.log('About to call collection() with db:', db, 'and collection name:', name);
          try {
            const colRef = collection(db, name);
            console.log('Obtained colRef:', colRef);
            unsubscribeSnapshot = onSnapshot(
              colRef,
              (snapshot) => {
                data.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                loading.value = false;
                error.value = null;
              },
              (err) => {
                error.value = err;
                loading.value = false;
              }
            );
          } catch (e) {
            console.error('Error when calling collection(db, name):', e);
          }
        }
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        data.value = [];
        error.value = new Error('User not authenticated');
        loading.value = false;
      }
    });

    // Store the reactive state and the auth unsubscribe function.
    collectionsState[name] = { data, loading, error, unsubscribeAuth };
  }
}

/**
 * useFirestoreCollections
 *
 * Main composable that accepts an array of Firestore collection names and optional Firebase
 * app and Firestore instances, and returns an object mapping each name to its reactive state.
 *
 * @param {string[]} collectionNames - An array of Firestore collection names.
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @param {object} firestoreInstance - Optional Firestore instance.
 * @returns {Object} An object containing the reactive state for each collection.
 */
export function useFirestoreCollections(collectionNames = [], firebaseAppInstance, firestoreInstance) {
  collectionNames.forEach(name => subscribeToCollection(name, firebaseAppInstance, firestoreInstance));

  const result = {};
  collectionNames.forEach(name => {
    result[name] = {
      data: collectionsState[name].data,
      loading: collectionsState[name].loading,
      error: collectionsState[name].error
    };
  });

  return result;
}