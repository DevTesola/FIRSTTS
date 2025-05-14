// pages/api/contest/submitMeme.js
// 밈 컨테스트 제출 API 엔드포인트
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS 
} from '../../../utils/staking';

import { 
  calculateVotingPower,
  getUserGovernanceSummary 
} from '../../../utils/staking-helpers/governance-helpers.js';

import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler.js';

// 밈 제출에 필요한 임의의 식별자 (실제로는 IDL에서 가져옴)
const SUBMIT_MEME_DISCRIMINATOR = [21, 172, 163, 92, 221, 25, 178, 17];

// IPFS 데이터용 시드
const MEME_SEED = Buffer.from([109, 101, 109, 101, 95, 115, 117, 98, 109, 105, 115, 115, 105, 111, 110]); // "meme_submission"

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
    const { wallet, title, description, ipfsHash } = req.body;
    
    if (!wallet || !title || !ipfsHash) {
      return res.status(400).json({ 
        error: 'Wallet address, title, and IPFS hash are required',
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
    
    // IPFS 해시 유효성 검사 (간단한 검사)
    if (!ipfsHash.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-zA-Z0-9]{55})$/)) {
      return res.status(400).json({ 
        error: 'Invalid IPFS hash format',
        success: false 
      });
    }
    
    // 제출 자격 확인을 위한 투표력 계산
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 거버넌스 요약 정보 가져오기 (투표력 포함)
    const governanceSummary = await getUserGovernanceSummary(programId, walletPubkey, connection);
    
    // 최소 요구 투표력 (NFT 1개)
    const MINIMUM_VOTING_POWER = 1;
    
    if (governanceSummary.votingPower < MINIMUM_VOTING_POWER) {
      return res.status(400).json({
        error: '최소 1개의 스테이킹된 NFT가 필요합니다',
        votingPower: governanceSummary.votingPower,
        success: false
      });
    }
    
    // 밈 제출 PDA (사용자당 하나의 밈만 가능)
    const [memePDA] = PublicKey.findProgramAddressSync(
      [MEME_SEED, walletPubkey.toBuffer()],
      programId
    );
    
    // 트랜잭션 생성
    const transaction = new Transaction();
    
    // 메타데이터 구성 (타이틀 + 설명)
    const titleBuffer = Buffer.from(title.slice(0, 50)); // 최대 50자 제한
    const descriptionBuffer = Buffer.from(description ? description.slice(0, 200) : ""); // 최대 200자 제한
    const ipfsHashBuffer = Buffer.from(ipfsHash);
    
    // 명령어 데이터 구성
    const dataSize = SUBMIT_MEME_DISCRIMINATOR.length + 4 + titleBuffer.length + 4 + descriptionBuffer.length + 4 + ipfsHashBuffer.length;
    const data = Buffer.alloc(dataSize);
    let offset = 0;
    
    // Discriminator 쓰기
    Buffer.from(SUBMIT_MEME_DISCRIMINATOR).copy(data, offset);
    offset += SUBMIT_MEME_DISCRIMINATOR.length;
    
    // 타이틀 쓰기 (길이 + 문자열)
    data.writeUInt32LE(titleBuffer.length, offset);
    offset += 4;
    titleBuffer.copy(data, offset);
    offset += titleBuffer.length;
    
    // 설명 쓰기 (길이 + 문자열)
    data.writeUInt32LE(descriptionBuffer.length, offset);
    offset += 4;
    descriptionBuffer.copy(data, offset);
    offset += descriptionBuffer.length;
    
    // IPFS 해시 쓰기 (길이 + 문자열)
    data.writeUInt32LE(ipfsHashBuffer.length, offset);
    offset += 4;
    ipfsHashBuffer.copy(data, offset);
    
    // 계정 배열 구성
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },     // submitter
      { pubkey: memePDA, isSigner: false, isWritable: true },         // meme PDA
      { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false } // system_program
    ];
    
    // 명령어 생성
    const submitMemeInstruction = new TransactionInstruction({
      keys: accounts,
      programId,
      data: data
    });
    
    // 트랜잭션에 명령어 추가
    transaction.add(submitMemeInstruction);
    
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
      votingPower: governanceSummary.votingPower,
      transactionExpiry: lastValidBlockHeight + 150,
      memePDA: memePDA.toString()
    });
  } catch (error) {
    console.error('밈 제출 트랜잭션 생성 중 오류:', error);
    return res.status(500).json({ 
      error: '밈 제출 트랜잭션 생성 실패: ' + getErrorMessage(error),
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}