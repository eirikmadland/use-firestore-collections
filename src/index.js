/**
 * useFirestoreCollections - A Vue composable for reactive Firestore collections
 * with automatic handling of Firebase Authentication lifecycle.
 *
 * This package expects Firebase to be initialized in your project or passed in.
 *
 * Dependencies: Vue 3, Firebase 9+
 */

import { ref } from 'vue'
import { getFirestore, collection, onSnapshot } from 'firebase/firestore'
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
 */
function subscribeToCollection(name, firebaseAppInstance) {
  if (!collectionsState[name]) {
    // Ensure Firebase is initialized (or get the passed instance)
    const app = ensureFirebaseInitialized(firebaseAppInstance);
    // Lazily get Firestore and Auth instances from the provided app.
    const db = getFirestore(app);
    const auth = getAuth(app);

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
          const colRef = collection(db, name);
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

    collectionsState[name] = {
      data,
      loading,
      error,
      unsubscribeAuth
    };
  }
}

/**
 * useFirestoreCollections
 *
 * Main composable that accepts an array of Firestore collection names and an optional Firebase app instance.
 *
 * @param {string[]} collectionNames - An array of Firestore collection names.
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @returns {Object} An object containing the reactive state for each collection.
 */
export function useFirestoreCollections(collectionNames = [], firebaseAppInstance) {
  collectionNames.forEach(name => subscribeToCollection(name, firebaseAppInstance));

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
