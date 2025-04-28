// preload-json-and-images.cjs
const fetch = require("node-fetch");

const JSON_CID = "bafybeidqncesx63zh3czbtukj2vhzukagedgqofapejqzmwymm4plcvmfq";
const IMG_CID = "bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike";
const BASE_URL = "https://ipfs.io/ipfs";

(async () => {
  for (let i = 1; i <= 1000; i++) {
    const id = String(i).padStart(4, "0");
    const jsonUrl = `${BASE_URL}/${JSON_CID}/${id}.json`;
    const imgUrl = `${BASE_URL}/${IMG_CID}/${id}.png`;

    try {
      const jsonRes = await fetch(jsonUrl);
      console.log(`[JSON] ${id} - ${jsonRes.status}`);
    } catch (err) {
      console.error(`[JSON] ${id} - ❌`, err.message);
    }

    try {
      const imgRes = await fetch(imgUrl);
      console.log(`[IMG ] ${id} - ${imgRes.status}`);
    } catch (err) {
      console.error(`[IMG ] ${id} - ❌`, err.message);
    }
  }
})();
