/**
 * IDL 문제 해결 유틸리티
 *
 * NFT 스테이킹 시스템에서 발생하는 다음 오류들을 해결:
 * 1. TypeError: Cannot read properties of undefined (reading 'size')
 * 2. Cannot use 'in' operator to search for 'vec' in pubkey
 * 3. AccountNotInitialized (Error Code: 3012)
 */

const fs = require('fs');
const path = require('path');
const { prepareIdlForAnchor } = require('./shared/utils/idl-helper');

// 원본 IDL 파일 경로
const idlPath = path.join(__dirname, 'idl', 'nft_staking.json');
// 수정된 IDL 파일 경로
const updatedIdlPath = path.join(__dirname, 'idl', 'nft_staking_updated.json');

/**
 * IDL 문제를 해결하고 새 파일로 저장
 */
async function fixIdlIssues() {
  try {
    // 1. 원본 IDL 파일 읽기
    console.log(`원본 IDL 파일 읽는 중: ${idlPath}`);
    const idlContent = fs.readFileSync(idlPath, 'utf8');
    const idl = JSON.parse(idlContent);

    // 2. 향상된 IDL 헬퍼 사용하여 모든 문제 해결
    console.log('IDL 헬퍼를 사용하여 IDL 문제 해결 중...');
    const preparedIdl = prepareIdlForAnchor(idl);

    // 3. 결과 저장
    console.log(`수정된 IDL 저장 중: ${updatedIdlPath}`);
    fs.writeFileSync(
      updatedIdlPath,
      JSON.stringify(preparedIdl, null, 2)
    );

    console.log('IDL 문제 해결 완료');
    return preparedIdl;
  } catch (error) {
    console.error('IDL 문제 해결 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  fixIdlIssues()
    .then(() => {
      console.log('✅ IDL 문제 수정 완료');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ IDL 문제 수정 중 오류 발생:', err);
      process.exit(1);
    });
}

module.exports = {
  fixIdlIssues
};