import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// 파일 경로 검증 유틸리티 함수
const isValidFilePath = (filePath) => {
  // 경로 주입 취약점 방지
  const normalizedPath = path.normalize(filePath);
  // 절대 경로가 아닌지 확인
  if (path.isAbsolute(normalizedPath)) return false;
  // 상위 디렉토리 참조 방지
  if (normalizedPath.includes('..')) return false;
  return true;
};

// 세션 토큰 생성 함수
const generateSessionToken = (tapeId, userAgent, timestamp) => {
  const secret = process.env.AUDIO_SECRET || 'tesola-audio-secret-key';
  const data = `${tapeId}-${userAgent}-${timestamp}-${secret}`;
  return createHash('sha256').update(data).digest('hex');
};

// 토큰 검증 함수
const verifyToken = (token, tapeId, userAgent, timestamp) => {
  const expectedToken = generateSessionToken(tapeId, userAgent, timestamp);
  // 토큰 만료 시간 검사 (10분)
  const now = Date.now();
  const tokenTime = parseInt(timestamp);
  const isExpired = now - tokenTime > 10 * 60 * 1000; 
  
  return token === expectedToken && !isExpired;
};

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { tapeId, token, timestamp, segment } = req.query;
    
    // 필수 파라미터 검증
    if (!tapeId || !token || !timestamp || !segment) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    
    // 토큰 검증
    const userAgent = req.headers['user-agent'] || '';
    if (!verifyToken(token, tapeId, userAgent, timestamp)) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    
    // 테이프 ID 검증
    const validTapeIds = ['devtape', 'futuretape1', 'futuretape2', 'futuretape3'];
    if (!validTapeIds.includes(tapeId)) {
      res.status(400).json({ error: 'Invalid tape ID' });
      return;
    }
    
    // 세그먼트 번호 검증
    const segmentNum = parseInt(segment);
    if (isNaN(segmentNum) || segmentNum < 0 || segmentNum > 999) {
      res.status(400).json({ error: 'Invalid segment number' });
      return;
    }
    
    // 세그먼트 파일 경로 구성
    const segmentFileName = `segment${segmentNum.toString().padStart(3, '0')}.ts`;
    const segmentPath = path.join(process.cwd(), 'public', 'audio-segments', tapeId, segmentFileName);
    
    // 경로 검증
    if (!isValidFilePath(path.relative(process.cwd(), segmentPath))) {
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(segmentPath)) {
      // devtape 파일 존재 여부를 특별히 검사하여 아직 세그먼트가 생성되지 않았으면 원본을 제공
      if (tapeId === 'devtape' && segmentNum === 0) {
        const originalFile = path.join(process.cwd(), 'public', 'sounds', 'devtape.mp3');
        
        if (!fs.existsSync(originalFile)) {
          res.status(404).json({ error: 'Audio file not found' });
          return;
        }
        
        // 원본 MP3 스트리밍
        const stat = fs.statSync(originalFile);
        const fileSize = stat.size;
        const range = req.headers.range;
        
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(originalFile, { start, end });
          
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline', // 다운로드 방지
            'Cache-Control': 'private, max-age=0, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          
          file.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline', // 다운로드 방지
            'Cache-Control': 'private, max-age=0, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          
          fs.createReadStream(originalFile).pipe(res);
        }
      } else {
        res.status(404).json({ error: 'Segment not found' });
      }
      return;
    }
    
    // 세그먼트 스트리밍
    const stat = fs.statSync(segmentPath);
    
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'video/mp2t', // MPEG-2 Transport Stream
      'Content-Disposition': 'inline', // 다운로드 방지
      'Cache-Control': 'private, max-age=300', // 짧은 캐싱만 허용
      'X-Frame-Options': 'DENY', // iframe 방지
    });
    
    const readStream = fs.createReadStream(segmentPath);
    readStream.pipe(res);
    
  } catch (error) {
    console.error('Audio streaming error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}