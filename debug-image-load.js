/**
 * 이미지 로딩 디버그 스크립트
 * 브라우저 콘솔에서 실행하여 이미지 로딩 문제 파악
 */

// 이미지 로딩 테스트
function testImageLoading() {
  console.log('=========== IPFS 이미지 로딩 디버그 테스트 ===========');
  
  // IPFS URL 예시 (RewardsDashboard에서 사용하는 형식)
  const ipfsUrls = [
    'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/nft-123.png',
    'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/nft-456.png'
  ];
  
  // 게이트웨이 URL 변환
  const personalGateway = 'https://tesola.mypinata.cloud/ipfs/';
  const otherGateways = [
    'https://nftstorage.link/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ];
  
  // 각 IPFS URL로 테스트
  ipfsUrls.forEach((ipfsUrl, index) => {
    console.log(`\n테스트 #${index + 1}: ${ipfsUrl}`);
    
    // CID 추출
    const cid = ipfsUrl.replace('ipfs://', '').split('/')[0];
    const path = ipfsUrl.replace(`ipfs://${cid}`, '');
    
    console.log(`추출된 CID: ${cid}`);
    console.log(`추출된 경로: ${path}`);
    
    // 게이트웨이 URL로 변환
    const gatewayUrl = `${personalGateway}${cid}${path}`;
    console.log(`게이트웨이 URL: ${gatewayUrl}`);
    
    // 이미지 로드 테스트
    testLoadImage(ipfsUrl, 'IPFS 프로토콜');
    testLoadImage(gatewayUrl, '게이트웨이');
    
    // 백업 게이트웨이도 테스트
    otherGateways.forEach((gateway, gwIndex) => {
      const backupUrl = `${gateway}${cid}${path}`;
      testLoadImage(backupUrl, `백업 게이트웨이 ${gwIndex + 1}`);
    });
  });
}

// 실제 이미지 로드 테스트
function testLoadImage(url, type) {
  const img = new Image();
  
  img.onload = function() {
    console.log(`✅ ${type} loaded successfully: ${url} (size: ${img.width}x${img.height})`);
  };
  
  img.onerror = function() {
    console.error(`❌ ${type} load failed: ${url}`);
  };
  
  // 캐시 방지
  img.src = url + '?nocache=' + Date.now();
}

// 실행
console.log('이미지 로딩 테스트를 시작합니다...');
testImageLoading();

// 교차 출처 정책 문제 확인
console.log('\nChecking CORS policy:');
fetch('https://tesola.mypinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/test', { mode: 'cors' })
  .then(response => {
    console.log('Gateway CORS status:', response.status, response.statusText);
  })
  .catch(error => {
    console.error('Gateway CORS error:', error);
  });

// 사용자 안내 메시지
console.log('\n이 스크립트는 브라우저에서 IPFS 이미지 로딩 문제를 진단합니다.');
console.log('Check error messages in the console window.');