// Get user's voting history for meme contest
import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { SAMPLE_MEMES } from '../../../utils/constants'; // 실제 환경에서는 샘플 데이터 대신 온체인 데이터 사용
import { STAKING_PROGRAM_ADDRESS } from '../../../utils/staking';
import { DISCRIMINATORS } from '../../../utils/staking-helpers/constants.js';
import { parseMemeVoteInfo } from '../../../utils/staking-helpers/buffer-parser.js';

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 투표 정보를 위한 시드
const MEME_VOTE_SEED = Buffer.from([109, 101, 109, 101, 95, 118, 111, 116, 101]); // "meme_vote"

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * 사용자의 밈 콘테스트 투표 이력을 가져오는 API 엔드포인트
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
export default async function handler(req, res) {
  // GET 메소드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ success: false, error: 'Wallet address is required' });
  }

  try {
    // 지갑 주소 유효성 검증
    let userWallet;
    try {
      userWallet = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }

    // 실제 구현에서는 온체인에서 투표 이력 가져오기
    // 예를 들어:
    // 1. 프로그램 ID로 관련 투표 계정 조회
    // 2. 해당 지갑 주소가 투표한 밈 ID 필터링

    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 1. 오프체인 기록에서 투표 이력 확인 (Supabase)
    const { data: dbVotes, error: dbError } = await supabase
      .from('contest_votes')
      .select('meme_id, voting_power_used, status')
      .eq('wallet_address', wallet)
      .eq('status', 'confirmed');
      
    if (dbError) {
      console.error("투표 이력 조회 중 DB 오류:", dbError);
    }
    
    // 2. 온체인 기록에서 투표 이력 확인
    const votedMemes = [];
    const onchainVotedMemes = [];
    
    // SAMPLE_MEMES 배열의 모든 밈을 순회하며 온체인에서 사용자 투표 기록 조회
    for (const meme of SAMPLE_MEMES) {
      // 사용자의 투표 PDA 계산
      const [voteInfoPDA] = PublicKey.findProgramAddressSync(
        [MEME_VOTE_SEED, new PublicKey(meme.publicKey).toBuffer(), userWallet.toBuffer()],
        programId
      );
      
      try {
        // 계정 정보 조회
        const accountInfo = await connection.getAccountInfo(voteInfoPDA);
        if (accountInfo) {
          try {
            // 투표 데이터 상세 파싱 (가능한 경우)
            const voteInfo = parseMemeVoteInfo(accountInfo.data, DISCRIMINATORS.MEME_VOTE);
            onchainVotedMemes.push(meme.id);
            console.log(`Found vote for meme ${meme.id}, voting power: ${voteInfo.votingPower}, timestamp: ${voteInfo.timestamp}`);
          } catch (parseError) {
            // 파싱 실패시에도 투표는 존재하므로 기록
            console.error("투표 데이터 파싱 오류:", parseError);
            onchainVotedMemes.push(meme.id);
          }
        }
      } catch (error) {
        console.error(`온체인 밈 투표 상태 확인 중 오류 (${meme.id}):`, error);
      }
    }
    
    // 3. 온체인 및 오프체인 데이터 병합
    if (dbVotes && dbVotes.length > 0) {
      const dbMemeIds = dbVotes.map(vote => vote.meme_id);
      // 두 소스의 투표 이력 합치기 (중복 제거)
      votedMemes.push(...new Set([...onchainVotedMemes, ...dbMemeIds]));
    } else {
      // DB에 데이터가 없으면 온체인 데이터만 사용
      votedMemes.push(...onchainVotedMemes);
    }
    
    // 4. 사용자의 현재 투표권 계산
    let totalVotingPower = 0;
    try {
      // 스테이킹된 NFT 기반 투표권 계산 로직 (실제 코드에서는 다른 함수에서 구현)
      const { calculateVotingPower } = require('../../../utils/staking-helpers/governance-helpers');
      totalVotingPower = await calculateVotingPower(programId, userWallet, connection);
    } catch (error) {
      console.error("투표권 계산 중 오류:", error);
      // 오류 발생 시 기본값 설정
      totalVotingPower = 5;
    }
    
    // 5. 사용한 투표권 계산 (오프체인 데이터 기반)
    let usedVotingPower = 0;
    if (dbVotes && dbVotes.length > 0) {
      usedVotingPower = dbVotes.reduce((sum, vote) => sum + (vote.voting_power_used || 1), 0);
    } else {
      // 기본적으로 투표당 1표로 계산
      usedVotingPower = votedMemes.length;
    }

    return res.status(200).json({
      success: true,
      votedMemes,
      votingPowerTotal: totalVotingPower,
      votingPowerUsed: usedVotingPower,
      votingPowerLeft: Math.max(0, totalVotingPower - usedVotingPower)
    });
  } catch (error) {
    console.error('Error fetching voting history:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch voting history' });
  }
}