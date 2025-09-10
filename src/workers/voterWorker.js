/* global self */

self.onmessage = async (event) => {
  try {
    const voters = event.data || [];
    const batchSize = 1000;
    for (let i = 0; i < voters.length; i += batchSize) {
      const chunk = voters.slice(i, i + batchSize);
      self.postMessage({ type: "STORE_BATCH", data: chunk });
      // Give event loop a breath to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }
    self.postMessage({ type: "DONE", total: voters.length });
  } catch (e) {
    self.postMessage({ type: "ERROR", message: e?.message || "Worker error" });
  }
};


