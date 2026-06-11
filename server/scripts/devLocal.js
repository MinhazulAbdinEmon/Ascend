// Development without MongoDB Atlas: starts a REAL local MongoDB
// (managed by mongodb-memory-server) with data persisted to server/.data,
// then boots the normal API server against it.
//
// Run with: npm run dev:local
// Your users/skills/tasks survive restarts - delete server/.data to wipe them.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: {
    dbPath, // persist data here instead of a temp dir
    storageEngine: 'wiredTiger',
    port: 27017,
  },
});

// Set MONGO_URI BEFORE the server loads its .env -
// dotenv never overrides variables that are already set.
process.env.MONGO_URI = mongod.getUri('ascend');
console.log(`✓ Local MongoDB running (data persists in server/.data)`);

await import('../src/server.js');
