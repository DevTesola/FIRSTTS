import { useEffect } from "react";
import { useRouter } from "next/router";
import FallbackLoading from "../components/FallbackLoading";

// 접속 시 landing 페이지로 리다이렉트
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // 랜딩 페이지로 리다이렉트
    router.replace("/landing");
  }, [router]);

  return <FallbackLoading message="Loading TESOLA experience..." />;
}