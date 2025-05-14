// pages/api/governance/prepareVote.js
// 제안에 대한 투표 트랜잭션을 준비하는 API 엔드포인트
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS, 
} from '../../../utils/staking';

import { 
  canUserVote,
  serializeVoteData,
  VOTE_SEED,
  USER_STAKING_SEED
} from '../../../utils/staking-helpers/governance-helpers.js';

import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler.js';

// 식별자
import { DISCRIMINATORS } from '../../../utils/staking-helpers/constants.js';

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
    const { wallet, proposalPublicKey, support } = req.body;
    
    if (!wallet || !proposalPublicKey) {
      return res.status(400).json({ 
        error: 'Wallet address and proposal public key are required',
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
    
    // 제안 ID 유효성 검사
    let proposalPubkey;
    try {
      proposalPubkey = new PublicKey(proposalPublicKey);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid proposal public key format',
        success: false 
      });
    }
    
    // support 값이 boolean인지 확인
    if (typeof support !== 'boolean') {
      return res.status(400).json({ 
        error: 'Support must be a boolean value',
        success: false 
      });
    }
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 투표 가능 여부 확인
    const voteCheck = await canUserVote(programId, walletPubkey, proposalPubkey, connection);
    
    if (!voteCheck.canVote) {
      return res.status(400).json({ 
        error: voteCheck.reason || 'Cannot vote on this proposal',
        votingPower: voteCheck.votingPower,
        success: false 
      });
    }
    
    // 트랜잭션 생성
    const transaction = new Transaction();
    
    // 사용자 스테이킹 정보 PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );
    
    // 투표 계정 PDA
    const [votePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(VOTE_SEED), proposalPubkey.toBuffer(), walletPubkey.toBuffer()],
      programId
    );
    
    // 계정 배열 구성
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },     // voter
      { pubkey: proposalPubkey, isSigner: false, isWritable: true },  // proposal
      { pubkey: votePDA, isSigner: false, isWritable: true },         // vote (PDA)
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: false }, // user_staking_info
      { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false } // system_program
    ];
    
    // 명령어 데이터 구성
    // 실제 구현에서는 serializeVoteData 함수를 사용할 수 있음
    const data = Buffer.alloc(8 + 1); // discriminator + 1 byte for boolean
    DISCRIMINATORS.VOTE.copy(data, 0);
    data.writeUInt8(support ? 1 : 0, 8); // write boolean as 1 or 0
    
    // 명령어 생성
    const castVoteInstruction = new TransactionInstruction({
      keys: accounts,
      programId,
      data: data
    });
    
    // 트랜잭션에 명령어 추가
    transaction.add(castVoteInstruction);
    
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
    
    // 응답
    return res.status(200).json({
      success: true,
      transactionBase64: serializedTransaction.toString('base64'),
      votingPower: voteCheck.votingPower,
      transactionExpiry: lastValidBlockHeight + 150,
      support: support
    });
  } catch (error) {
    console.error('투표 트랜잭션 생성 중 오류:', error);
    return res.status(500).json({ 
      error: '투표 트랜잭션 생성 실패: ' + getErrorMessage(error),
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}