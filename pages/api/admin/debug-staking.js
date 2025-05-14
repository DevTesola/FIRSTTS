// pages/api/admin/debug-staking.js
// 스테이킹 디버깅을 위한 관리자 API
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, STAKE_SEED, USER_STAKING_SEED } from '../../../utils/staking-helpers/constants';
import { createClient } from '@supabase/supabase-js';

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
    // Simple admin check - in production use a proper auth mechanism
    const { admin_key } = req.headers;
    if (admin_key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, wallet, mintAddress } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 여러 액션에 따른 기능 구현
    switch (action) {
      case 'check_staking_info': {
        if (!mintAddress) {
          return res.status(400).json({ error: 'Mint address is required' });
        }

        // Convert to PublicKey
        let mintPubkey;
        try {
          mintPubkey = new PublicKey(mintAddress);
        } catch (err) {
          return res.status(400).json({ error: 'Invalid mint address format' });
        }

        // Find the stake info PDA
        const programId = new PublicKey(PROGRAM_ID);
        const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
          programId
        );

        console.log('Checking stake info PDA:', stakeInfoPDA.toString());

        // Get account info
        const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
        
        if (!stakeInfoAccount) {
          return res.status(404).json({
            success: false,
            error: 'Stake info account does not exist on-chain',
            pda: stakeInfoPDA.toString()
          });
        }

        // Get the account data
        return res.status(200).json({
          success: true,
          stakeInfo: {
            address: stakeInfoPDA.toString(),
            exists: true,
            owner: stakeInfoAccount.owner.toString(),
            isOwnedByProgram: stakeInfoAccount.owner.equals(programId),
            lamports: stakeInfoAccount.lamports,
            dataSize: stakeInfoAccount.data.length,
            data: {
              // Include first 16 bytes for debugging/discriminator verification
              dataStart: Array.from(stakeInfoAccount.data.slice(0, 16))
            }
          }
        });
      }

      case 'check_user_staking_info': {
        if (!wallet) {
          return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Convert to PublicKey
        let walletPubkey;
        try {
          walletPubkey = new PublicKey(wallet);
        } catch (err) {
          return res.status(400).json({ error: 'Invalid wallet address format' });
        }

        // Find the user staking info PDA
        const programId = new PublicKey(PROGRAM_ID);
        const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
          programId
        );

        console.log('Checking user staking info PDA:', userStakingInfoPDA.toString());

        // Get account info
        const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
        
        if (!userStakingInfoAccount) {
          return res.status(404).json({
            success: false,
            error: 'User staking info account does not exist on-chain',
            pda: userStakingInfoPDA.toString()
          });
        }

        // 온체인 계정 데이터와 데이터베이스 기록 비교
        const { data: stakingRecords, error: dbError } = await supabase
          .from('nft_staking')
          .select('*')
          .eq('wallet_address', wallet)
          .eq('status', 'staked');
        
        if (dbError) {
          console.error('Error fetching staking records:', dbError);
        }

        return res.status(200).json({
          success: true,
          userStakingInfo: {
            address: userStakingInfoPDA.toString(),
            exists: true,
            owner: userStakingInfoAccount.owner.toString(),
            isOwnedByProgram: userStakingInfoAccount.owner.equals(programId),
            lamports: userStakingInfoAccount.lamports,
            dataSize: userStakingInfoAccount.data.length,
            data: {
              // Include first 16 bytes for debugging/discriminator verification
              dataStart: Array.from(userStakingInfoAccount.data.slice(0, 16))
            }
          },
          databaseRecords: stakingRecords || []
        });
      }

      case 'list_staked_nfts': {
        // 데이터베이스에서 모든 스테이킹된 NFT 목록 가져오기
        const { data: stakedNfts, error: dbError } = await supabase
          .from('nft_staking')
          .select('*')
          .eq('status', 'staked')
          .order('staked_at', { ascending: false })
          .limit(10);  // 최근 10개만 가져오기
        
        if (dbError) {
          console.error('Error fetching staked NFTs:', dbError);
          return res.status(500).json({ error: 'Failed to fetch staked NFTs' });
        }

        // 각 NFT에 대해 온체인 상태 확인 (많은 요청이 발생할 수 있어 프로덕션에서는 주의)
        const programId = new PublicKey(PROGRAM_ID);
        const enhancedResults = await Promise.all(stakedNfts.map(async (nft) => {
          try {
            const mintPubkey = new PublicKey(nft.mint_address);
            const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
              [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
              programId
            );
            
            const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
            
            return {
              ...nft,
              onchain_status: {
                pda: stakeInfoPDA.toString(),
                exists: !!stakeInfoAccount,
                owner: stakeInfoAccount ? stakeInfoAccount.owner.toString() : null,
                isOwnedByProgram: stakeInfoAccount ? stakeInfoAccount.owner.equals(programId) : false
              }
            };
          } catch (err) {
            console.error(`Error checking stake info for NFT ${nft.mint_address}:`, err);
            return {
              ...nft,
              onchain_status: {
                pda: 'error',
                error: err.message
              }
            };
          }
        }));

        return res.status(200).json({
          success: true,
          stakedNfts: enhancedResults
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('디버깅 API 오류:', error);
    return res.status(500).json({ 
      error: '디버깅 작업 실패: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}