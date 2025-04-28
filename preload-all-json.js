// preload-all-json.js
const fetch = require("node-fetch");

const CID = "bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu";
const BASE_URL = `https://ipfs.io/ipfs/${CID}`;

(async () => {
  for (let i = 1; i <= 1000; i++) {
    const filename = String(i).padStart(4, "0") + ".json";
    const url = `${BASE_URL}/${filename}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`✅ ${filename} - ${res.status}`);
      } else {
        console.warn(`⚠️ ${filename} - ${res.status}`);
      }
    } catch (err) {
      console.error(`❌ ${filename} - ${err.message}`);
    }
  }
})();
