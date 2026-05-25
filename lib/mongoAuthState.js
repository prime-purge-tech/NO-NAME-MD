import {
  initAuthCreds,
  BufferJSON,
  proto,
} from "@whiskeysockets/baileys";
import { getDB } from "./db.js";

export async function useMongoAuthState(numero) {
  const collection = getDB().collection("auth_keys");

  async function readData(id) {
    try {
      const doc = await collection.findOne({ _id: `${numero}:${id}` });
      if (!doc?.data) return null;
      return JSON.parse(doc.data, BufferJSON.reviver);
    } catch {
      return null;
    }
  }

  async function writeData(id, value) {
    await collection.updateOne(
      { _id: `${numero}:${id}` },
      {
        $set: {
          _id: `${numero}:${id}`,
          numero,
          data: JSON.stringify(value, BufferJSON.replacer),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async function removeData(id) {
    await collection.deleteOne({ _id: `${numero}:${id}` });
  }

  async function clearAll() {
    await collection.deleteMany({ numero });
  }

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const dataId = `${category}-${id}`;
              if (value) tasks.push(writeData(dataId, value));
              else tasks.push(removeData(dataId));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData("creds", creds),
    clearAll,
  };
}
