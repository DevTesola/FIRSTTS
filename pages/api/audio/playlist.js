import { createHash } from 'crypto';

// 세션 토큰 생성 함수
const generateSessionToken = (tapeId, userAgent, timestamp) => {
  const secret = process.env.AUDIO_SECRET || 'tesola-audio-secret-key';
  const data = `${tapeId}-${userAgent}-${timestamp}-${secret}`;
  return createHash('sha256').update(data).digest('hex');
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
    const { tapeId } = req.query;
    
    // 필수 파라미터 검증
    if (!tapeId) {
      res.status(400).json({ error: 'Missing required parameter: tapeId' });
      return;
    }
    
    // 테이프 ID 검증
    const validTapeIds = ['devtape', 'futuretape1', 'futuretape2', 'futuretape3'];
    if (!validTapeIds.includes(tapeId)) {
      res.status(400).json({ error: 'Invalid tape ID' });
      return;
    }
    
    // 현재 타임스탬프 생성
    const timestamp = Date.now().toString();
    
    // 사용자 에이전트 정보
    const userAgent = req.headers['user-agent'] || '';
    
    // 인증 토큰 생성
    const token = generateSessionToken(tapeId, userAgent, timestamp);
    
    // 샘플 HLS 플레이리스트 생성
    // 실제 프로덕션에서는 FFmpeg로 미리 생성된 세그먼트와 플레이리스트를 사용해야 합니다
    const segments = 12; // 가정: 각 테이프는 12개의 세그먼트로 구성
    
    // HLS 매니페스트 생성
    let m3u8Content = '#EXTM3U\n';
    m3u8Content += '#EXT-X-VERSION:3\n';
    m3u8Content += '#EXT-X-TARGETDURATION:10\n'; // 각 세그먼트는 약 10초
    m3u8Content += '#EXT-X-MEDIA-SEQUENCE:0\n';
    
    // 현재는 devtape만 구현되어 있고 실제 세그먼트가 없으므로 하나의 전체 파일로 처리
    if (tapeId === 'devtape') {
      m3u8Content += '#EXTINF:323.8,\n'; // devtape.mp3 길이 (약 5분 24초)
      m3u8Content += `/api/audio/stream?tapeId=${tapeId}&token=${token}&timestamp=${timestamp}&segment=0\n`;
    } else {
      // 다른 테이프는 아직 구현되지 않음
      m3u8Content += '#EXTINF:10,\n';
      m3u8Content += `/api/audio/stream?tapeId=${tapeId}&token=${token}&timestamp=${timestamp}&segment=0\n`;
      m3u8Content += '#EXT-X-ENDLIST\n';
    }
    
    // 응답 설정
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Content-Disposition', 'inline'); // 다운로드 방지
    res.setHeader('Cache-Control', 'private, max-age=0, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).send(m3u8Content);
    
  } catch (error) {
    console.error('Audio playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}