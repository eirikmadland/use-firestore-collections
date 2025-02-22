/**
 * use-firestore-collections - A Vue 3 composable for reactive Firestore collections
 * with automatic handling of Firebase Authentication lifecycle.
 *
 * This library assumes Firebase is already initialized in your project,
 * but allows you to pass in your initialized Firebase app, Firestore, and Auth instances.
 *
 * Usage example:
 * 
 * import { useFirestoreCollections } from 'use-firestore-collections';
 * import { app as firebaseApp, db, auth } from './firebase'; // your firebase.js exports
 * 
 * const { users, posts } = useFirestoreCollections(
 *   ['users', 'posts'],
 *   firebaseApp, // optional; defaults to the default app
 *   db,          // optional; defaults to getFirestore(firebaseApp)
 *   auth         // optional; defaults to getAuth(firebaseApp)
 * );
 *
 * Each collection subscription returns reactive properties: data, loading, and error.
 *
 * Version: 1.0.8
 *
 * Peer Dependencies: Vue 3, Firebase (^9.0.0 || ^11.0.0)
 */

import { ref } from 'vue';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getApps } from 'firebase/app';

/**
 * ensureFirebaseInitialized
 *
 * Checks if a Firebase app is available. If an instance is provided, returns that.
 * Otherwise, returns the first initialized app.
 *
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @returns {object} The Firebase app instance.
 * @throws {Error} If no Firebase app is initialized.
 */
function ensureFirebaseInitialized(firebaseAppInstance) {
  const app = firebaseAppInstance || (getApps().length ? getApps()[0] : null);
  if (!app) {
    throw new Error(
      'No Firebase App initialized. Please call initializeApp() before using this composable, or pass the firebase app instance as a parameter.'
    );
  }
  return app;
}

// Global store for collection subscriptions
const collectionsState = {};

/**
 * subscribeToCollection
 *
 * Subscribes to a Firestore collection and sets up a reactive state that updates
 * automatically. Manages authentication state changes to start or stop the subscription.
 *
 * @param {string} name - The Firestore collection name.
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @param {object} firestoreInstance - Optional Firestore instance.
 * @param {object} authInstance - Optional Auth instance.
 */
function subscribeToCollection(name, firebaseAppInstance, firestoreInstance, authInstance) {
  if (!collectionsState[name]) {
    // Ensure Firebase is initialized.
    const app = ensureFirebaseInitialized(firebaseAppInstance);
    // Use provided Firestore instance if available; otherwise, get it from the app.
    const db = firestoreInstance || getFirestore(app);
    // Use provided Auth instance if available; otherwise, get it from the app.
    const auth = authInstance || getAuth(app);

    console.log('Using Firestore instance:', db);
    console.log('db constructor:', db?.constructor?.name);
    console.log('db is instance of Object:', db instanceof Object);

    // Create reactive references.
    const data = ref([]);
    const loading = ref(true);
    const error = ref(null);

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

    // Save the reactive state and unsubscribe function.
    collectionsState[name] = { data, loading, error, unsubscribeAuth };
  }
}

/**
 * useFirestoreCollections
 *
 * Main composable function. Accepts an array of collection names and optional
 * Firebase app, Firestore, and Auth instances, and returns an object mapping each
 * collection name to its reactive state.
 *
 * @param {string[]} collectionNames - An array of Firestore collection names.
 * @param {object} firebaseAppInstance - Optional Firebase app instance.
 * @param {object} firestoreInstance - Optional Firestore instance.
 * @param {object} authInstance - Optional Auth instance.
 * @returns {Object} An object mapping each collection name to a reactive state object with properties: data, loading, error.
 */
export function useFirestoreCollections(
  collectionNames = [],
  firebaseAppInstance,
  firestoreInstance,
  authInstance
) {
  collectionNames.forEach(name =>
    subscribeToCollection(name, firebaseAppInstance, firestoreInstance, authInstance)
  );

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
