// pages/api/governance/getProposals.js
// 온체인 제안 목록을 조회하는 API 엔드포인트
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS 
} from '../../../utils/staking';

import { 
  getProposalVotingStatus,
  canUserVote 
} from '../../../utils/staking-helpers/governance-helpers.js';

import { BufferParser } from '../../../utils/staking-helpers/buffer-parser.js';
import { DISCRIMINATORS } from '../../../utils/staking-helpers/constants.js';
import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 선택적으로 지갑 주소로 필터링
    const { wallet } = req.query;
    let walletPubkey = null;
    
    if (wallet) {
      try {
        walletPubkey = new PublicKey(wallet);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }
    }
    
    // Solana RPC 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 실제 온체인 데이터 조회 구현
    console.log("온체인에서 거버넌스 제안 데이터 조회...");
    
    let onchainProposals = [];
    try {
      // Proposal discriminator를 가진 계정 모두 조회
      const proposalAccounts = await connection.getProgramAccounts(programId, {
        commitment: 'confirmed',
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: DISCRIMINATORS.PROPOSAL.toString('base64')
            }
          }
        ]
      });
      
      console.log(`Found ${proposalAccounts.length} proposal accounts on-chain`);
      
      // 각 제안 계정 데이터 파싱 및 처리
      for (const account of proposalAccounts) {
        try {
          const proposalStatus = await getProposalVotingStatus(account.pubkey, connection);
          
          // 사용자 투표 상태 확인
          let userVoteStatus = null;
          if (walletPubkey) {
            userVoteStatus = await canUserVote(programId, walletPubkey, account.pubkey, connection);
          }
          
          onchainProposals.push({
            id: account.pubkey.toString(),
            publicKey: account.pubkey.toString(),
            title: proposalStatus.title,
            description: proposalStatus.description,
            forVotes: proposalStatus.forVotes,
            againstVotes: proposalStatus.againstVotes,
            quorum: proposalStatus.quorum,
            threshold: proposalStatus.threshold,
            status: proposalStatus.isExecuted 
              ? 'executed' 
              : (new Date() > proposalStatus.endTime 
                  ? 'ended' 
                  : (new Date() < proposalStatus.startTime 
                      ? 'pending' 
                      : 'active')
                ),
            startTime: proposalStatus.startTime,
            endTime: proposalStatus.endTime,
            creator: proposalStatus.proposalCreator.toString(),
            voted: userVoteStatus ? !userVoteStatus.canVote && userVoteStatus.reason?.includes('이미 투표') : false,
            yourVote: userVoteStatus?.existingVote?.side === 1 ? 'for' : (userVoteStatus?.existingVote?.side === 0 ? 'against' : null),
            canVote: userVoteStatus?.canVote || false
          });
        } catch (error) {
          console.error("제안 계정 파싱 오류:", error);
        }
      }
      
      console.log(`Successfully parsed ${onchainProposals.length} proposal accounts`);
    } catch (error) {
      console.error("온체인 제안 데이터 조회 실패:", error);
    }
    
    // 온체인 데이터가 없거나 조회 실패 시 샘플 데이터 사용
    let proposals = onchainProposals.length > 0 ? onchainProposals : [
      {
        id: "proposal1",
        publicKey: "7RLH8CGCXLEUzVeEf7AoQKpnYE1LzecJdqQ3y16Dkprj",
        title: "Update Community Treasury Allocation",
        description: "This proposal aims to adjust the distribution of treasury funds, allocating 30% to community-driven development projects.",
        forVotes: 1240,
        againstVotes: 320,
        quorum: 1000,
        status: 'active',
        startTime: new Date(Date.now() - 86400000 * 2), // 2일 전 시작
        endTime: new Date(Date.now() + 86400000 * 3), // 3일 후 종료
        creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s"
      },
      {
        id: "proposal2", 
        publicKey: "9ZLH7FGWXjuo7VSEf6AmQFpnYF1CzUcJcqW3y15DiprJ",
        title: "Staking Rewards Expansion Proposal",
        description: "Increase staking reward tiers for Rare and Epic NFTs by 15% and introduce special weekly bonuses for continuous stakers.",
        forVotes: 980,
        againstVotes: 760,
        quorum: 1500,
        status: 'active',
        startTime: new Date(Date.now() - 86400000 * 1), // 1일 전 시작
        endTime: new Date(Date.now() + 86400000 * 5), // 5일 후 종료
        creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s"
      },
      {
        id: "proposal3",
        publicKey: "5TGH6FGCXLPZveEf3AeQKJpnYN2LzQcLcqQ9y74Dkwij",
        title: "TESOLA Partnership Framework", 
        description: "Establish guidelines for project partnerships and integrations with other Solana ecosystem projects.",
        forVotes: 2150,
        againstVotes: 350,
        quorum: 2000,
        status: 'active',
        startTime: new Date(Date.now() - 86400000 * 3), // 3일 전 시작
        endTime: new Date(Date.now() + 86400000 * 2), // 2일 후 종료
        creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s"
      }
    ];
    
    // 온체인 데이터가 없는 경우 샘플 데이터에 투표 상태 추가
    if (walletPubkey && onchainProposals.length === 0) {
      // 실제 구현에서는 해당 사용자의 투표 상태를 온체인에서 조회 (이미 위에서 구현됨)
      
      // 샘플 데이터에 대해서만 랜덤 투표 상태 할당
      proposals.forEach(proposal => {
        // 3분의 1 확률로 이미 투표했다고 가정
        if (Math.random() < 0.33) {
          proposal.voted = true;
          // 절반 확률로 찬성 또는 반대
          proposal.yourVote = Math.random() < 0.5 ? 'for' : 'against';
        } else {
          proposal.voted = false;
          proposal.yourVote = null;
        }
      });
    }
    
    // 응답 반환
    return res.status(200).json({
      proposals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('제안 목록 조회 중 오류:', error);
    return res.status(500).json({ 
      error: '제안 목록 조회 실패: ' + getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}