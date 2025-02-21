/**
 * useFirestoreCollections - A Vue composable for reactive Firestore collections
 * with automatic handling of Firebase Authentication lifecycle.
 *
 * This package expects Firebase to be initialized in your project before using this composable.
 * Make sure you call Firebase's initializeApp() with your config before using this package.
 *
 * Dependencies: Vue 3, Firebase 9+
 */

import { ref } from 'vue'
import { getFirestore, collection, onSnapshot } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Retrieve the default Firestore and Auth instances from the default Firebase app.
// Ensure that Firebase is already initialized in your consuming project.
const db = getFirestore()
const auth = getAuth()

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
 */
function subscribeToCollection(name) {
  if (!collectionsState[name]) {
    // Create reactive references for:
    // - data: to hold the documents,
    // - loading: to indicate if data is being fetched,
    // - error: to capture any errors.
    const data = ref([])
    const loading = ref(true)
    const error = ref(null)

    // Variable to store the Firestore snapshot unsubscribe function.
    let unsubscribeSnapshot = null

    // Listen for authentication state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // When the user is authenticated and there's no active subscription,
        // subscribe to the Firestore collection.
        if (!unsubscribeSnapshot) {
          // Set loading to true in case we're re-subscribing.
          loading.value = true
          const colRef = collection(db, name)
          unsubscribeSnapshot = onSnapshot(
            colRef,
            (snapshot) => {
              // Update reactive data with the latest snapshot documents.
              data.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
              loading.value = false
              error.value = null // Clear any previous error.
            },
            (err) => {
              // If an error occurs, update the error state and stop loading.
              error.value = err
              loading.value = false
            }
          )
        }
      } else {
        // When the user signs out, unsubscribe from the Firestore collection.
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot()
          unsubscribeSnapshot = null
        }
        // Clear data and set an error indicating the user is not authenticated.
        data.value = []
        error.value = new Error('User not authenticated')
        loading.value = false
      }
    })

    // Save the reactive state and the auth unsubscribe function for this collection.
    collectionsState[name] = {
      data,
      loading,
      error,
      unsubscribeAuth
    }
  }
}

/**
 * useFirestoreCollections
 *
 * Main composable that accepts an array of Firestore collection names and returns
 * an object mapping each name to its reactive state (data, loading, and error).
 *
 * @param {string[]} collectionNames - An array of Firestore collection names.
 * @returns {Object} An object containing the reactive state for each collection.
 */
export function useFirestoreCollections(collectionNames = []) {
  // Initialize subscriptions for each collection name provided.
  collectionNames.forEach(name => subscribeToCollection(name))

  // Construct an object to expose the reactive states.
  const result = {}
  collectionNames.forEach(name => {
    result[name] = {
      data: collectionsState[name].data,
      loading: collectionsState[name].loading,
      error: collectionsState[name].error
    }
  })

  return result
}