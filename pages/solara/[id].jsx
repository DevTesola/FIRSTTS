import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function NFTViewer() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (id) {
      const jsonUrl =
        `https://ipfs.io/ipfs/bafybeidqncesx63zh3czbtukj2vhzukagedgqofapejqzmwymm4plcvmfq/${String(
          id
        ).padStart(4, "0")}.json`;
      fetch(jsonUrl)
        .then((res) => res.json())
        .then(setData)
        .catch(console.error);
    }
  }, [id]);

  if (!data)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading NFT info...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-6">
      <button
        onClick={() => navigator.clipboard.writeText(window.location.href)}
        className="mint-button"
      >
        Copy share link
      </button>
      <div className="card p-8">
        <h1 className="text-4xl font-bold mb-4 neon-text">{data.name}</h1>
        {data.image && (
          <img
            src={data.image.startsWith("ipfs://")
              ? data.image.replace("ipfs://", "https://ipfs.io/ipfs/")
              : data.image}
            alt={data.name}
            className="mb-4 rounded-lg"
          />
        )}
        <p className="mb-4">{data.lore}</p>
      </div>
    </div>
  );
}
