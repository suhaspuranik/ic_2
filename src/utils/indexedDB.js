import { openDB } from "idb";

export const initDB = async () => {
  return openDB("VoterDB", 5, {
    upgrade(db, oldVersion) {
      // Ensure voters store exists with voter_id as the key
      if (!db.objectStoreNames.contains("voters")) {
        db.createObjectStore("voters", { keyPath: "voter_id" });
      }
      // Lightweight meta store for timestamps and cache metadata
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
      }
      // If upgrading from legacy versions that created and wiped stores, keep data intact going forward
    },
  });
};

export const clearVotersStore = async (db) => {
  const tx = db.transaction("voters", "readwrite");
  await tx.store.clear();
  await tx.done;
};

export const addBatchToDB = async (db, batch) => {
  const tx = db.transaction("voters", "readwrite");
  let idx = 0;
  const ts = Date.now();
  for (const voter of batch) {
    const normalized = { ...voter };
    // Normalize schema variations
    if (!normalized.voter_first_middle_name && normalized.voter_firstname) {
      normalized.voter_first_middle_name = normalized.voter_firstname;
    }
    if (normalized.voter_last_name === undefined && normalized.voter_lastname) {
      normalized.voter_last_name = normalized.voter_lastname;
    }
    if (normalized.relation_type && normalized.relation_type.length === 1) {
      // Optional: expand single-letter relation codes if needed later
    }
    // Ensure voter_id exists since it is the key now (use epic as fallback)
    if (!normalized.voter_id) {
      normalized.voter_id =
        normalized.voterId ||
        normalized.voterID ||
        normalized.id ||
        normalized.epic_number ||
        `auto_${ts}_${idx}`;
    }
    idx += 1;
    await tx.store.put(normalized);
  }
  await tx.done;
};

export const getVotersByPage = async (db, page, pageSize) => {
  const tx = db.transaction("voters", "readonly");
  const store = tx.store;
  const allKeys = await store.getAllKeys();
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const keys = allKeys.slice(start, end);
  const voters = await Promise.all(keys.map((key) => store.get(key)));
  await tx.done;
  return voters.filter(Boolean);
};

export const getVotersCount = async (db) => {
  const tx = db.transaction("voters", "readonly");
  const count = await tx.store.count();
  await tx.done;
  return count;
};

export const getMetaValue = async (db, key) => {
  const tx = db.transaction("meta", "readonly");
  const val = await tx.store.get(key);
  await tx.done;
  return val;
};

export const setMetaValue = async (db, key, value) => {
  const tx = db.transaction("meta", "readwrite");
  await tx.store.put(value, key);
  await tx.done;
};


