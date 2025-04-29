// pages/api/ipfs/[...path].js
/**
 * IPFS 프록시 API 라우트
 * 
 * 이 API 라우트는 모든 IPFS 요청을 내부적으로 처리하여 CORS 문제를 해결합니다.
 * 클라이언트는 항상 이 라우트를 통해 IPFS 리소스에 접근합니다.
 */

import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

// 개인 IPFS 게이트웨이 URL
const CUSTOM_IPFS_GATEWAY = process.env.NEXT_PUBLIC_CUSTOM_IPFS_GATEWAY || "https://tesola.mypinata.cloud";

export default async function handler(req, res) {
  // CORS 헤더 설정 - 본인 도메인에 맞게 조정하세요
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청에 대한 응답
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // GET 메소드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // URL에서 경로 추출
    const { path } = req.query;
    
    // CID와 파일 경로 구성
    const ipfsPath = path.join('/');
    
    // 완전한 IPFS URL 구성
    const fullUrl = `${CUSTOM_IPFS_GATEWAY}/ipfs/${ipfsPath}`;
    
    console.log(`Proxying IPFS request to: ${fullUrl}`);
    
    // IPFS 게이트웨이에서 리소스 가져오기
    const ipfsResponse = await fetch(fullUrl, {
      headers: {
        'Accept': req.headers['accept'] || '*/*',
        'User-Agent': 'IPFSProxy/1.0'
      }
    });
    
    if (!ipfsResponse.ok) {
      console.error(`IPFS gateway error: ${ipfsResponse.status} ${ipfsResponse.statusText}`);
      return res.status(ipfsResponse.status).json({ 
        error: `IPFS gateway error: ${ipfsResponse.statusText}` 
      });
    }
    
    // 컨텐츠 타입 결정
    const contentType = ipfsResponse.headers.get('content-type') || 'application/octet-stream';
    
    // 응답 헤더 설정
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1년 캐싱
    
    // 스트림 방식으로 응답 전송
    const buffer = await ipfsResponse.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('IPFS proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}