import { MongoClient } from 'mongodb';

let cachedDb = null;

export async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(process.env.DATABASE_URL);
    const db = client.db();

    cachedDb = { client, db };
    return cachedDb;
} 