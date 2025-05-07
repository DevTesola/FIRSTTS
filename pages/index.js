import { useEffect } from "react";
import { useRouter } from "next/router";
import FallbackLoading from "../components/FallbackLoading";

// 기존 홈페이지를 "home"으로 이동
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // 랜딩 페이지로 리다이렉트
    router.replace("/home");
  }, [router]);

  return <FallbackLoading message="Loading TESOLA experience..." />;
}