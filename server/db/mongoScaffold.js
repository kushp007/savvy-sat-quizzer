/**
 * MongoDB scaffold — not wired into the quiz yet.
 *
 * Intended stack: React (Vite) + Express (this repo's `server/index.js`) + MongoDB + OpenAI.
 *
 * To use later:
 * 1. `npm install mongodb` (or `mongoose`) in the project root.
 * 2. Add `MONGODB_URI` to `.env`.
 * 3. Import and call `connectMongo()` before starting Express, or in a separate worker.
 * 4. Persist generated questions, user sessions, or scores as needed.
 */

// Example (uncomment when ready):
// import { MongoClient } from 'mongodb';
//
// let client;
// export async function connectMongo() {
//   const uri = process.env.MONGODB_URI;
//   if (!uri) throw new Error('MONGODB_URI is not set');
//   client = new MongoClient(uri);
//   await client.connect();
//   return client.db(process.env.MONGODB_DB || 'sat_quizzer');
// }

export {};
