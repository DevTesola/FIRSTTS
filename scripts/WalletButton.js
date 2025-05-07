"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export const WalletButton = (props) => {
  const [mounted, setMounted] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { select, connect, disconnect, connected, publicKey, wallet } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSelectWallet = async (walletName) => {
    try {
      console.log(`지갑 선택: ${walletName}`);
      // 지갑 이름을 어댑터 식별자에 매핑
      const walletAdapterName = walletName === "Phantom" ? "Phantom" : "Solflare";
      select(walletAdapterName);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 지연 시간 증가
      if (!wallet) {
        throw new Error("지갑이 선택되지 않았습니다.");
      }
      console.log("선택된 지갑:", wallet.name);
      console.log("지갑 연결 중...");
      await connect();
      console.log("지갑 연결 성공!");
      setShowOptions(false);
    } catch (err) {
      console.error("지갑 연결 실패:", err);
      alert(`지갑 연결 오류: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log("지갑 연결 해제 중...");
      await disconnect();
      setShowOptions(false);
    } catch (err) {
      console.error("지갑 연결 해제 실패:", err);
      alert(`지갑 연결 해제 오류: ${err.message}`);
    }
  };

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      alert("지갑 주소가 복사되었습니다!");
    }
  };

  return (
    <div className="relative">
      <button
        className={props.className || "wallet-adapter-button"}
        onClick={() => setShowOptions(!showOptions)}
        style={{
          backgroundColor: "purple",
          color: "white",
          padding: "10px 20px",
          borderRadius: "5px",
          display: "inline-block",
          cursor: "pointer",
          zIndex: 50,
          position: "relative",
        }}
      >
        {connected ? "지갑 옵션" : "지갑 선택"}
      </button>
      {showOptions && (
  <div
    className="absolute top-full left-0 mt-2 bg-gray-900 text-white rounded-xl shadow-2xl z-50 border border-gray-600 transform transition-all duration-300 ease-in-out scale-95 hover:scale-100 opacity-0 animate-fade-in"
    style={{
      minWidth: "220px",
      background: "linear-gradient(145deg, #1a1a1a, #2a2a2a)",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.7)",
    }}
  >
    {!connected ? (
      <>
        <button
          className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
          onClick={() => handleSelectWallet("Phantom")}
        >
          <img src="/phantom-logo.png" alt="Phantom Logo" className="w-6 h-6" />
          <span>Phantom</span>
        </button>
        <button
          className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
          onClick={() => handleSelectWallet("Solflare")}
        >
          <img src="/solflare-logo.png" alt="Solflare Logo" className="w-6 h-6" />
          <span>Solflare</span>
        </button>
      </>
    ) : (
            <>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setShowOptions(true)}
              >
                지갑 변경
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200"
                onClick={handleDisconnect}
              >
                연결 해제
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors duration-200"
                onClick={handleCopyAddress}
              >
                지갑 주소 복사
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};