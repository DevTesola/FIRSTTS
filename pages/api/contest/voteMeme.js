// pages/api/contest/voteMeme.js
// 밈 컨테스트 투표 API 엔드포인트
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS 
} from '../../../utils/staking';

import { 
  calculateVotingPower,
  USER_STAKING_SEED
} from '../../../utils/staking-helpers/governance-helpers.js';

import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler.js';

// 밈 투표에 필요한 식별자
import { DISCRIMINATORS } from '../../../utils/staking-helpers/constants.js';

// 투표 정보를 위한 시드
const MEME_VOTE_SEED = Buffer.from([109, 101, 109, 101, 95, 118, 111, 116, 101]); // "meme_vote"

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 요청 파라미터 추출
    const { wallet, memePublicKey } = req.body;
    
    if (!wallet || !memePublicKey) {
      return res.status(400).json({ 
        error: 'Wallet address and meme public key are required',
        success: false 
      });
    }
    
    // 지갑 주소 유효성 검사
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        success: false 
      });
    }
    
    // 밈 PDA 유효성 검사
    let memePubkey;
    try {
      memePubkey = new PublicKey(memePublicKey);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid meme public key format',
        success: false 
      });
    }
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 투표력 계산
    const votingPower = await calculateVotingPower(programId, walletPubkey, connection);
    
    if (votingPower <= 0) {
      return res.status(400).json({ 
        error: '스테이킹된 NFT가 없어 투표할 수 없습니다',
        votingPower: 0,
        success: false 
      });
    }
    
    // 사용자의 투표 PDA 계산
    const [voteInfoPDA] = PublicKey.findProgramAddressSync(
      [MEME_VOTE_SEED, memePubkey.toBuffer(), walletPubkey.toBuffer()],
      programId
    );
    
    // 이미 투표했는지 확인 (온체인 검증)
    const voteAccountInfo = await connection.getAccountInfo(voteInfoPDA);
    
    // 오프체인 검증 (Supabase에서 투표 기록 확인)
    const { data: votingRecord, error: dbError } = await supabase
      .from('contest_votes')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('meme_id', memePublicKey)
      .maybeSingle();
    
    if (dbError) {
      console.error("투표 기록 확인 중 데이터베이스 오류:", dbError);
    }
    
    // 온체인 또는 오프체인에 투표 기록이 있으면 거부
    if (voteAccountInfo || votingRecord) {
      return res.status(400).json({
        error: '이미 이 밈에 투표했습니다',
        success: false
      });
    }
    
    // 사용자 스테이킹 정보 PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [USER_STAKING_SEED, walletPubkey.toBuffer()],
      programId
    );
    
    // 트랜잭션 생성
    const transaction = new Transaction();
    
    // 계정 배열 구성
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },     // voter
      { pubkey: memePubkey, isSigner: false, isWritable: true },      // meme account
      { pubkey: voteInfoPDA, isSigner: false, isWritable: true },     // vote info PDA
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: false }, // user staking info
      { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false } // system_program
    ];
    
    // 명령어 데이터는 단순히 discriminator만 포함
    const data = DISCRIMINATORS.MEME_VOTE;
    
    // 명령어 생성
    const voteMemeInstruction = new TransactionInstruction({
      keys: accounts,
      programId,
      data: data
    });
    
    // 트랜잭션에 명령어 추가
    transaction.add(voteMemeInstruction);
    
    // 블록해시 가져오기
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 트랜잭션 속성 설정
    transaction.feePayer = walletPubkey;
    transaction.recentBlockhash = blockhash;
    
    // 직렬화
    const serializedTransaction = transaction.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    // 투표 기록 생성 (오프체인 DB에 기록, 트랜잭션 실패에 대비)
    try {
      const { error: insertError } = await supabase
        .from('contest_votes')
        .insert({
          wallet_address: wallet,
          meme_id: memePublicKey,
          voting_power_used: 1, // 기본적으로 1표 사용
          transaction_signature: null, // 클라이언트에서 서명 후 업데이트 필요
          status: 'pending', // 트랜잭션 완료 후 'confirmed'로 업데이트
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("투표 기록 저장 중 오류:", insertError);
      }
    } catch (dbError) {
      console.error("투표 데이터베이스 작업 중 오류:", dbError);
      // 데이터베이스 오류가 있어도 트랜잭션은 계속 진행
    }
    
    // 응답
    return res.status(200).json({
      success: true,
      transactionBase64: serializedTransaction.toString('base64'),
      votingPower: votingPower,
      transactionExpiry: lastValidBlockHeight + 150
    });
  } catch (error) {
    console.error('밈 투표 트랜잭션 생성 중 오류:', error);
    return res.status(500).json({ 
      error: '밈 투표 트랜잭션 생성 실패: ' + getErrorMessage(error),
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}