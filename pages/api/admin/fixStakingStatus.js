// pages/api/admin/fixStakingStatus.js
// 스테이킹 상태 수정을 위한 관리자 API
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';
const STAKE_SEED = [115, 116, 97, 107, 101]; // "stake"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // 간단한 관리자 검증
  const { admin_key } = req.headers;
  if (admin_key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { stakingId, mintAddress, newStatus, checkOnchain } = req.body;
    
    if (!stakingId || !newStatus) {
      return res.status(400).json({ error: 'stakingId와 newStatus는 필수입니다' });
    }
    
    // 온체인 확인이 요청된 경우
    if (checkOnchain && mintAddress) {
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      const programId = new PublicKey(PROGRAM_ID);
      
      try {
        const mintPubkey = new PublicKey(mintAddress);
        const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
          programId
        );
        
        console.log(`Checking on-chain status for mint: ${mintAddress}`);
        console.log(`Stake info PDA: ${stakeInfoPDA.toString()}`);
        
        const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
        
        if (!stakeInfoAccount) {
          console.log('On-chain account does not exist');
        } else {
          console.log(`On-chain account exists, owner: ${stakeInfoAccount.owner.toString()}`);
          console.log(`Is owned by program: ${stakeInfoAccount.owner.equals(programId)}`);
          
          // 계정이 존재하고 프로그램이 소유하면 상태 변경 거부
          if (stakeInfoAccount.owner.equals(programId) && newStatus === 'failed') {
            return res.status(400).json({ 
              error: '온체인 계정이 올바르게 존재합니다. 상태를 failed로 변경할 수 없습니다.',
              onchainStatus: {
                exists: true,
                owner: stakeInfoAccount.owner.toString(),
                isOwnedByProgram: true,
                pda: stakeInfoPDA.toString()
              }
            });
          }
        }
      } catch (error) {
        console.error('온체인 상태 확인 중 오류:', error);
      }
    }
    
    // 데이터베이스 상태 업데이트
    const { data, error } = await supabase
      .from('nft_staking')
      .update({ status: newStatus })
      .eq('id', stakingId)
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ 
      success: true, 
      data,
      message: `스테이킹 ID ${stakingId}의 상태가 '${newStatus}'로 변경되었습니다.`
    });
  } catch (error) {
    console.error('스테이킹 상태 수정 중 오류:', error);
    return res.status(500).json({ error: error.message });
  }
}