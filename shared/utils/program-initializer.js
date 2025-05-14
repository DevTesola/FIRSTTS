/**
 * Anchor 프로그램 초기화 유틸리티
 * 
 * 이 모듈은 Anchor 프로그램 인스턴스를 생성하는 안정적인 방법을 제공합니다.
 * 다음 문제들을 해결합니다:
 * 1. AccountNotInitialized (Error Code: 3012)
 * 2. Cannot read properties of undefined (reading 'size')
 * 3. Cannot use 'in' operator to search for 'vec' in pubkey
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import originalIdl from '../../idl/nft_staking.json';
import updatedIdl from '../../idl/nft_staking_updated.json';

// 기본 Solana RPC 엔드포인트
const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// NFT 스테이킹 프로그램 ID
const STAKING_PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

/**
 * Anchor 프로그램 인스턴스 생성
 * 
 * @param {Object} options - 초기화 옵션
 * @param {Connection} options.connection - Solana 연결 객체 (선택 사항)
 * @param {object} options.wallet - 지갑 객체 (선택 사항)
 * @param {Object} options.provider - 사용자 지정 AnchorProvider (선택 사항)
 * @param {boolean} options.useUpdatedIdl - 수정된 IDL 사용 여부 (기본값: true)
 * @param {boolean} options.enableLogs - 로깅 활성화 여부 (기본값: false)
 * @returns {Object} Anchor 프로그램 객체 또는 오류가 발생한 경우 null
 */
export function initializeStakingProgram(options = {}) {
  const {
    connection: providedConnection,
    wallet,
    provider: customProvider,
    useUpdatedIdl = true,
    enableLogs = false
  } = options;
  
  try {
    // 기본 연결 생성 또는 제공된 연결 사용
    const connection = providedConnection || new Connection(DEFAULT_RPC_ENDPOINT, 'confirmed');
    
    // 프로바이더 설정
    let provider;
    if (customProvider) {
      provider = customProvider;
    } else if (wallet) {
      // 지갑이 제공된 경우, AnchorProvider 생성
      provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );
    } else {
      // 읽기 전용 프로바이더 생성
      provider = new AnchorProvider(
        connection,
        {
          publicKey: PublicKey.default,
          signTransaction: () => Promise.reject(new Error('No wallet provided')),
          signAllTransactions: () => Promise.reject(new Error('No wallet provided')),
        },
        AnchorProvider.defaultOptions()
      );
    }
    
    // 프로그램 ID 생성
    const programId = new PublicKey(STAKING_PROGRAM_ID);
    
    // 올바른 IDL 선택
    const idl = useUpdatedIdl ? updatedIdl : originalIdl;
    
    if (enableLogs) {
      console.log('Anchor 프로그램 초기화 중:', {
        programId: programId.toString(),
        useUpdatedIdl,
        accountTypes: idl.accounts ? idl.accounts.length : 0
      });
    }
    
    // 프로그램 생성
    const program = new Program(idl, programId, provider);
    
    if (enableLogs) {
      console.log('Anchor 프로그램 성공적으로 초기화됨');
      console.log('사용 가능한 인스트럭션:', Object.keys(program.methods));
    }
    
    return program;
  } catch (error) {
    console.error('Anchor 프로그램 초기화 오류:', error);
    
    // 자세한 오류 정보 로깅
    if (error.message.includes('size')) {
      console.error('계정 크기 문제 발생. useUpdatedIdl=true 옵션으로 다시 시도하세요.');
    } else if (error.message.includes('vec') && error.message.includes('pubkey')) {
      console.error('PublicKey 벡터 타입 문제 발생. useUpdatedIdl=true 옵션으로 다시 시도하세요.');
    }
    
    return null;
  }
}

/**
 * 토큰 계정 초기화 상태 확인
 * 
 * @param {Connection} connection - Solana 연결 객체
 * @param {PublicKey} walletPubkey - 지갑 퍼블릭 키
 * @param {PublicKey} mintPubkey - NFT 민트 퍼블릭 키
 * @returns {Promise<boolean>} 토큰 계정이 초기화되어 있으면 true, 아니면 false
 */
export async function checkTokenAccountInitialized(connection, walletPubkey, mintPubkey) {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { mint: mintPubkey }
    );
    
    if (tokenAccounts.value.length === 0) {
      return false;
    }
    
    for (const tokenAccount of tokenAccounts.value) {
      const accountInfo = tokenAccount.account.data.parsed.info;
      
      // 올바른 소유자와 민트를 가진 계정이 있고, 잔액이 1인지 확인
      if (
        accountInfo.owner === walletPubkey.toString() &&
        accountInfo.mint === mintPubkey.toString() &&
        parseFloat(accountInfo.tokenAmount.uiAmount) === 1
      ) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('토큰 계정 초기화 상태 확인 중 오류:', error);
    return false;
  }
}

export default {
  initializeStakingProgram,
  checkTokenAccountInitialized
};