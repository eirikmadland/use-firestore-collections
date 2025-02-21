# use-firestore-collections

A Vue 3 composable for reactive Firestore collections with automatic handling of Firebase Authentication lifecycle.

## Features

- **Reactive Data:** Automatically updates when Firestore collections change.
- **Authentication Handling:** Subscribes/unsubscribes based on Firebase Auth state.
- **Simple API:** Exposes an easy-to-use interface with `data`, `loading`, and `error` states.

## Installation

Install the package via npm:

```bash
npm install use-firestore-collections
```

> **Note:** This package requires that you have [Vue 3](https://v3.vuejs.org/) and [Firebase v9+](https://firebase.google.com/docs/web/modular-upgrade) set up and initialized in your project.

## Usage

First, ensure Firebase is initialized in your project (using `initializeApp` with your Firebase config) **before** using this composable.

Then, in your Vue component:

```vue
<script setup>
import { useFirestoreCollections } from 'use-firestore-collections'

// Subscribe to Firestore collections (for example, 'users' and 'posts')
const { users, posts } = useFirestoreCollections(['users', 'posts'])
</script>

<template>
  <div>
    <section>
      <h2>Users</h2>
      <div v-if="users.loading">Loading users...</div>
      <div v-else-if="users.error">Error: {{ users.error.message }}</div>
      <ul v-else>
        <li v-for="user in users.data" :key="user.id">{{ user.name }}</li>
      </ul>
    </section>
    <section>
      <h2>Posts</h2>
      <div v-if="posts.loading">Loading posts...</div>
      <div v-else-if="posts.error">Error: {{ posts.error.message }}</div>
      <ul v-else>
        <li v-for="post in posts.data" :key="post.id">{{ post.title }}</li>
      </ul>
    </section>
  </div>
</template>
```

## API

### `useFirestoreCollections(collectionNames: string[])`

Accepts an array of Firestore collection names and returns an object mapping each collection name to its reactive state.

#### Parameters

- **`collectionNames`**: `string[]`  
  An array of Firestore collection names to subscribe to.

#### Returns

An object where each key is a collection name and its value is an object containing:

- **`data`**: An array of documents from the Firestore collection.
- **`loading`**: A boolean indicating if the data is currently being fetched.
- **`error`**: An error object if an error occurred during the subscription, or `null` otherwise.

## Contributing

Contributions are welcome! If you’d like to contribute:

1. **Fork the Repository:**  
   Create your own fork of the project.
2. **Create a New Branch:**  
   Use a descriptive branch name for your feature or bug fix.
3. **Commit Your Changes:**  
   Ensure your commit messages are clear.
4. **Open a Pull Request:**  
   Submit a pull request with a detailed description of your changes.

For any issues or feature requests, please open an issue on the [GitHub repository](https://github.com/eirikmadland/use-firestore-collections).

## License

This project is licensed under the MIT License.

### MIT License

```
MIT License

Copyright (c) 2025 Eirik Madland

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```