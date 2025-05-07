// pages/api/contest/getContestMemes.js
// 밈 컨테스트 항목 조회 API 엔드포인트
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS 
} from '../../../utils/staking';

import { 
  BufferParser,
  parseMemeInfo,
  parseMemeVoteInfo
} from '../../../utils/staking-helpers/buffer-parser.js';

import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler.js';

// 밈 데이터의 discriminator
import { DISCRIMINATORS } from '../../../utils/staking-helpers/constants.js';

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// 샘플 밈 데이터 (실제 구현에서는 온체인에서 가져옴)
const SAMPLE_MEMES = [
  {
    id: "meme1",
    publicKey: "7RLH8CGCXLEUzVeEf7AoQKpnYE1LzecJdqQ3y16Dkprj",
    title: "When TESOLA Moons",
    description: "E-LON's face when TESOLA price goes to the moon",
    ipfsHash: "QmXHYBq9qrQpyPCzrPJiDJUPnQrRAHVLnvZ4TFJ8RdFYWS",
    imageUrl: "/nft-previews/0418.png",
    creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s",
    creatorDisplay: "DBtG...xz5s",
    votes: 1240,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "meme2",
    publicKey: "9ZLH7FGWXjuo7VSEf6AmQFpnYF1CzUcJcqW3y15DiprJ",
    title: "SOLARA's Cosmic Power",
    description: "SOLARA unleashing blockchain validation power",
    ipfsHash: "QmUHYnq9qrQpyPCzrPJiDJUPnQrRAHVLnvZ4TFJ8RdFZYU",
    imageUrl: "/nft-previews/0119.png",
    creator: "HirFHFrDy29ajuh5T1ALRFYmvrTkLvEjHGYNJTrJ3Sgz",
    creatorDisplay: "HirF...3Sgz",
    votes: 980,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "meme3",
    publicKey: "5TGH6FGCXLPZveEf3AeQKJpnYN2LzQcLcqQ9y74Dkwij",
    title: "Staking Intensifies",
    description: "How it feels to stake your SOLARA NFTs",
    ipfsHash: "QmTHYBq9qrQpyPCzrPJiDJUPnQrRAHVLnvZ4TFJ8RdFYQT",
    imageUrl: "/nft-previews/0171.png",
    creator: "EVK9UQS93bwsdbzrHWKZdoVpbnDhNBaLYSYJcJMhAGKj",
    creatorDisplay: "EVK9...AGKj",
    votes: 2150,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "meme4",
    publicKey: "4BGH6FGZXLQZveEf3AeQKLpnYN2LbQcLcqQ9y74Dkwij",
    title: "Diamond Hands",
    description: "HODLing TESOLA through the dip",
    ipfsHash: "QmPHYBq9qrQpyPCzrPJiDJUPnQrRAHVLnvZ4TFJ8RdFYOP",
    imageUrl: "/nft-previews/0327.png",
    creator: "J4zFgSkEtPBGJgcB8qPZKPD7JJBpKLX4HzHgxVD8io2e", 
    creatorDisplay: "J4zF...io2e",
    votes: 1650,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "meme5",
    publicKey: "3FFR6FGCXLPZveEf3AeQKJpnYN2LzQcLcqQ9y74Dkwij",
    title: "Cosmic Journey",
    description: "To the moon and beyond with TESOLA tokens",
    ipfsHash: "QmRHYBq9qrQpyPCzrPJiDJUPnQrRAHVLnvZ4TFJ8RdFYRQ",
    imageUrl: "/nft-previews/0579.png",
    creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s",
    creatorDisplay: "DBtG...xz5s",
    votes: 750,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

// 투표 정보를 위한 시드
const MEME_VOTE_SEED = Buffer.from([109, 101, 109, 101, 95, 118, 111, 116, 101]); // "meme_vote"

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 쿼리 파라미터 추출
    const { sortBy, wallet } = req.query;
    
    // 투표 상태 확인을 위한 지갑 주소 파싱 (선택 사항)
    let walletPubkey = null;
    if (wallet) {
      try {
        walletPubkey = new PublicKey(wallet);
      } catch (err) {
        return res.status(400).json({ 
          error: 'Invalid wallet address format',
          success: false 
        });
      }
    }
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 실제 온체인에서 모든 밈 계정을 가져옴
    console.log("온체인에서 밈 데이터 조회 시작...");
    let memes = [];
    
    try {
      // 프로그램 계정 중 MEME_ACCOUNT discriminator를 가진 계정 모두 조회
      const memeAccounts = await connection.getProgramAccounts(programId, {
        commitment: 'confirmed',
        filters: [
          { 
            memcmp: { 
              offset: 0, 
              bytes: DISCRIMINATORS.MEME_ACCOUNT.toString('base64')
            } 
          }
        ]
      });
      
      console.log(`Found ${memeAccounts.length} meme accounts on-chain`);
      
      // 각 계정 데이터 파싱
      for (const account of memeAccounts) {
        try {
          // 계정 데이터 파싱
          const memeData = parseMemeInfo(account.account.data, DISCRIMINATORS.MEME_ACCOUNT);
          
          // 표시 형식으로 변환
          const shortenedCreator = memeData.creator.toString();
          const creatorDisplay = `${shortenedCreator.slice(0, 4)}...${shortenedCreator.slice(-4)}`;
          
          // 밈 항목 생성
          memes.push({
            id: account.pubkey.toString(),
            publicKey: account.pubkey.toString(),
            title: memeData.title,
            description: memeData.description,
            ipfsHash: memeData.ipfsHash,
            creator: memeData.creator.toString(),
            creatorDisplay: creatorDisplay,
            votes: memeData.totalVotes,
            createdAt: memeData.createdAt.toISOString(),
            imageUrl: `/nft-previews/0${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 9) + 1}.png` // 테스트용 더미 이미지
          });
        } catch (error) {
          console.error("밈 계정 파싱 오류:", error);
        }
      }
      
      console.log(`Successfully parsed ${memes.length} meme accounts`);
      
      // 온체인 데이터를 가져오는데 실패하면 샘플 데이터로 대체
      if (memes.length === 0) {
        console.log("No memes found on-chain, using sample data");
        memes = [...SAMPLE_MEMES];
      }
    } catch (error) {
      console.error("온체인 밈 데이터 조회 실패:", error);
      console.log("Using sample data as fallback");
      memes = [...SAMPLE_MEMES];
    }
    
    // 정렬 (votes 또는 createdAt)
    if (sortBy === 'newest') {
      memes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // 기본적으로 votes 기준으로 정렬
      memes.sort((a, b) => b.votes - a.votes);
    }
    
    // 사용자의 투표 상태 확인 (지갑 주소가 제공된 경우)
    if (walletPubkey) {
      // 1. 온체인 투표 상태 확인
      for (const meme of memes) {
        try {
          const MEME_VOTE_SEED = Buffer.from([109, 101, 109, 101, 95, 118, 111, 116, 101]); // "meme_vote"
          const [voteInfoPDA] = PublicKey.findProgramAddressSync(
            [MEME_VOTE_SEED, new PublicKey(meme.publicKey).toBuffer(), walletPubkey.toBuffer()],
            programId
          );
          
          const voteAccountInfo = await connection.getAccountInfo(voteInfoPDA);
          meme.hasVoted = voteAccountInfo !== null;
        } catch (error) {
          console.error(`Error checking vote status for meme ${meme.id}:`, error);
          meme.hasVoted = false;
        }
      }
      
      // 2. 오프체인 투표 기록 확인 (Supabase)
      try {
        const { data: votingRecords, error: dbError } = await supabase
          .from('contest_votes')
          .select('meme_id, voting_power_used, status')
          .eq('wallet_address', wallet.toString());
          
        if (dbError) {
          console.error("투표 기록 조회 중 DB 오류:", dbError);
        } else if (votingRecords && votingRecords.length > 0) {
          // DB에 있는 투표 기록 반영
          for (const meme of memes) {
            const dbVote = votingRecords.find(v => v.meme_id === meme.publicKey);
            if (dbVote && (dbVote.status === 'confirmed' || dbVote.status === 'pending')) {
              meme.hasVoted = true;
              // 사용된 투표력 정보도 저장
              meme.votingPowerUsed = dbVote.voting_power_used || 1;
            }
          }
        }
      } catch (error) {
        console.error("오프체인 투표 기록 확인 중 오류:", error);
      }
    }
    
    // 각 밈에 대한 IPFS URL 생성
    memes = memes.map(meme => ({
      ...meme,
      ipfsUrl: `https://ipfs.io/ipfs/${meme.ipfsHash}`
    }));
    
    return res.status(200).json({
      success: true,
      memes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('밈 목록 조회 중 오류:', error);
    return res.status(500).json({ 
      error: '밈 목록 조회 실패: ' + getErrorMessage(error),
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}