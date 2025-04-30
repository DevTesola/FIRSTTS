import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 프리세일 설정 가져오기
export async function getPresaleSettings() {
  const { data, error } = await supabase
    .from('presale_settings')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();
    
  if (error) throw error;
  return data;
}

// 프리세일 활성화 상태 확인
export async function isPresaleActive() {
  const settings = await getPresaleSettings();
  const now = new Date();
  
  return settings.is_active && 
         now >= new Date(settings.start_time) && 
         now <= new Date(settings.end_time);
}

// 화이트리스트 확인 함수
export async function isWalletWhitelisted(walletAddress) {
  const { data, error } = await supabase
    .from('presale_whitelist')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
    
  if (error) return false;
  return !!data;
}

// 지갑별 민팅 수량 확인
export async function getWalletMintCount(walletAddress) {
  const { data, error } = await supabase
    .from('minted_nfts')
    .select('count')
    .eq('wallet', walletAddress)
    .eq('is_presale', true);
    
  if (error) return 0;
  return data[0]?.count || 0;
}