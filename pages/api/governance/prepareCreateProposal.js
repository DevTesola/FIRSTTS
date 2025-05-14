// pages/api/governance/prepareCreateProposal.js
// 새로운 제안 생성 트랜잭션을 준비하는 API 엔드포인트
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, Keypair } from '@solana/web3.js';
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

// 식별자
import { DISCRIMINATORS } from '../../../utils/staking-helpers/constants.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// 제안 ID 순차적으로 생성을 위한 카운터 (실제로는 DB나 온체인에서 관리)
// 간단한 구현을 위해 메모리에 저장 (서버 재시작 시 초기화됨)
let nextProposalId = Math.floor(Date.now() / 1000); // Unix timestamp로 초기화

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, title, description } = req.body;
    
    if (!wallet || !title || !description) {
      return res.status(400).json({ 
        error: 'Wallet address, title, and description are required',
        success: false 
      });
    }
    
    if (title.length > 100) {
      return res.status(400).json({ 
        error: 'Title must be less than 100 characters',
        success: false 
      });
    }
    
    if (description.length > 1000) {
      return res.status(400).json({ 
        error: 'Description must be less than 1000 characters',
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
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 투표력 계산
    const votingPower = await calculateVotingPower(programId, walletPubkey, connection);
    
    // 제안 생성 임계값 (일반적으로 거버넌스 설정에서 조회)
    const proposalCreateThreshold = 10; // 예시 값
    
    if (votingPower < proposalCreateThreshold) {
      return res.status(400).json({ 
        error: `Insufficient voting power. Required: ${proposalCreateThreshold}, Current: ${votingPower}`,
        votingPower,
        proposalCreateThreshold,
        success: false 
      });
    }
    
    // 새 제안 계정을 위한 키페어 생성
    const proposalKeypair = Keypair.generate();
    
    // 사용자 스테이킹 정보 PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );
    
    // 거버넌스 설정 계정 (이 예제에서는 하드코딩, 실제로는 PDA나 다른 방식으로 조회)
    const governanceSettingsKey = new PublicKey('5ZLH7FGCXLPZveEf3AoQKJpnYF2LzUcJccW3y15DiprA');
    
    // 제안 ID 생성 (순차적 ID 사용)
    const proposalId = nextProposalId++;
    
    // 계정 배열 구성
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },           // proposer
      { pubkey: proposalKeypair.publicKey, isSigner: true, isWritable: true }, // proposal (새로 생성)
      { pubkey: governanceSettingsKey, isSigner: false, isWritable: false }, // governance_settings
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: false },    // user_staking_info
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // system_program
    ];
    
    // 명령어 데이터 구성
    // 1. discriminator (8 bytes)
    // 2. proposal_id (8 bytes - u64)
    // 3. title (string - length prefix + chars)
    // 4. description (string - length prefix + chars)
    
    // 문자열 데이터의 길이 계산
    const titleBuffer = Buffer.from(title);
    const descriptionBuffer = Buffer.from(description);
    
    // 데이터 길이 계산: discriminator(8) + proposal_id(8) + title(4+length) + description(4+length)
    const dataSize = 8 + 8 + 4 + titleBuffer.length + 4 + descriptionBuffer.length;
    const data = Buffer.alloc(dataSize);
    
    // discriminator 쓰기
    DISCRIMINATORS.PROPOSAL.copy(data, 0);
    
    let offset = 8;
    
    // proposal_id 쓰기 (u64)
    const proposalIdBuf = Buffer.alloc(8);
    proposalIdBuf.writeBigUInt64LE(BigInt(proposalId), 0);
    proposalIdBuf.copy(data, offset);
    offset += 8;
    
    // title 쓰기 (string - 길이 접두사 + 문자열)
    data.writeUInt32LE(titleBuffer.length, offset);
    offset += 4;
    titleBuffer.copy(data, offset);
    offset += titleBuffer.length;
    
    // description 쓰기 (string - 길이 접두사 + 문자열)
    data.writeUInt32LE(descriptionBuffer.length, offset);
    offset += 4;
    descriptionBuffer.copy(data, offset);
    
    // 명령어 생성
    const createProposalInstruction = new TransactionInstruction({
      keys: accounts,
      programId,
      data: data
    });
    
    // 트랜잭션 생성 및 명령어 추가
    const transaction = new Transaction();
    transaction.add(createProposalInstruction);
    
    // 블록해시 가져오기
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 트랜잭션 속성 설정
    transaction.feePayer = walletPubkey;
    transaction.recentBlockhash = blockhash;
    
    // 제안 계정 서명 추가
    transaction.partialSign(proposalKeypair);
    
    // 직렬화
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    
    // Supabase에 제안 데이터 임시 저장 (선택적)
    try {
      const { data: proposalRecord, error } = await supabase
        .from('governance_proposals')
        .insert([
          {
            proposal_id: proposalId.toString(),
            proposal_pubkey: proposalKeypair.publicKey.toString(),
            title,
            description,
            creator: wallet,
            status: 'pending', // 트랜잭션이 처리되면 'active'로 업데이트
            created_at: new Date().toISOString()
          }
        ]);
        
      if (error) {
        console.error('제안 데이터 저장 실패:', error);
      }
    } catch (dbError) {
      console.error('Supabase 저장 오류:', dbError);
      // 데이터베이스 저장 실패는 트랜잭션 생성에 영향을 주지 않으므로 진행
    }
    
    // 응답
    return res.status(200).json({
      success: true,
      transactionBase64: serializedTransaction.toString('base64'),
      proposalPublicKey: proposalKeypair.publicKey.toString(),
      proposalId: proposalId.toString(),
      transactionExpiry: lastValidBlockHeight + 150,
      votingPower
    });
  } catch (error) {
    console.error('제안 생성 트랜잭션 준비 중 오류:', error);
    return res.status(500).json({ 
      error: '제안 생성 트랜잭션 준비 실패: ' + getErrorMessage(error),
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}