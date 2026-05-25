import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nomame_md";

let _client = null;
let _db = null;

export async function connectDB() {
  if (_db) return _db;
  _client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await _client.connect();
  _db = _client.db();
  console.log("✅ [MongoDB] Connected to:", MONGO_URI.replace(/\/\/.*@/, "//***@"));

  await _db.collection("sessions").createIndex({ numero: 1 }, { unique: true });
  await _db.collection("sessions").createIndex({ status: 1 });

  return _db;
}

export function getDB() {
  if (!_db) throw new Error("DB not connected yet. Call connectDB() first.");
  return _db;
}

export const Sessions = {
  /** Upsert a session record */
  async save(numero, data) {
    const db = getDB();
    await db.collection("sessions").updateOne(
      { numero },
      {
        $set: {
          numero,
          ...data,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  },

  /** Get one session by numero */
  async get(numero) {
    return getDB().collection("sessions").findOne({ numero });
  },

  /** Get all sessions with a given status (or all if omitted) */
  async getAll(filter = {}) {
    return getDB().collection("sessions").find(filter).toArray();
  },

  /** Update status field */
  async setStatus(numero, status) {
    await getDB().collection("sessions").updateOne(
      { numero },
      { $set: { status, updatedAt: new Date() } }
    );
  },

  /** Mark session as validated (persists after restart) */
  async validate(numero) {
    await this.setStatus(numero, "validated");
  },

  /** Delete a session */
  async delete(numero) {
    await getDB().collection("sessions").deleteOne({ numero });
  },

  /** Store per-session config (owner, mode, etc.) */
  async saveConfig(numero, config) {
    await getDB().collection("sessions").updateOne(
      { numero },
      { $set: { config, updatedAt: new Date() } },
      { upsert: true }
    );
  },

  /** Retrieve per-session config */
  async getConfig(numero) {
    const doc = await this.get(numero);
    return doc?.config || { owner: numero, mode: "public" };
  },
};

export const Creds = {
  async save(numero, credsJson) {
    await getDB().collection("creds").updateOne(
      { numero },
      { $set: { numero, data: credsJson, savedAt: new Date() } },
      { upsert: true }
    );
  },

  async get(numero) {
    const doc = await getDB().collection("creds").findOne({ numero });
    return doc?.data || null;
  },

  async delete(numero) {
    await getDB().collection("creds").deleteOne({ numero });
  },
};
