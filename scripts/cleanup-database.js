// Database Cleanup Script
// 데이터베이스 정리 및 민팅 카운트 고정을 위한 스크립트

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: './.env.development.local' });

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // 서비스 키 필요 (PUBLIC KEY 아님)
);

// 실행할 정리 작업을 선택하는 함수
async function cleanup(operation) {
  console.log(`Starting cleanup operation: ${operation}`);
  
  try {
    switch (operation) {
      case 'count':
        await countRecords();
        break;
      case 'remove-pending':
        await removePendingRecords();
        break;
      case 'reset-available':
        await resetAvailableRecords();
        break;
      case 'fix-presale':
        await fixPresaleRecords();
        break;
      case 'full-reset':
        await fullReset();
        break;
      default:
        console.log('Available operations:');
        console.log('- count: Count records by status');
        console.log('- remove-pending: Remove pending records older than 1 hour');
        console.log('- reset-available: Reset available records status');
        console.log('- fix-presale: Mark presale records properly');
        console.log('- full-reset: Full database reset (DANGEROUS!)');
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

// 레코드 수 계산 함수
async function countRecords() {
  // 상태별 레코드 수 계산
  const { data: statusCounts, error: statusError } = await supabase.rpc('count_records_by_status');
  
  if (statusError) {
    console.error('Error counting records by status:', statusError);
    return;
  }
  
  console.log('Records by status:');
  console.table(statusCounts);
  
  // 전체 레코드 수
  const { count: totalCount, error: countError } = await supabase
    .from('minted_nfts')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting total records:', countError);
    return;
  }
  
  console.log(`Total records: ${totalCount}`);
  
  // 프리세일 레코드 수
  const { count: presaleCount, error: presaleError } = await supabase
    .from('minted_nfts')
    .select('*', { count: 'exact', head: true })
    .eq('is_presale', true);
    
  if (presaleError) {
    console.error('Error counting presale records:', presaleError);
    return;
  }
  
  console.log(`Presale records: ${presaleCount}`);
  
  // Completed NFT 수 (실제 민팅된 NFT)
  const { count: completedCount, error: completedError } = await supabase
    .from('minted_nfts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .not('mint_index', 'is', null)
    .or('is_presale.eq.false,is_presale.is.null');
    
  if (completedError) {
    console.error('Error counting completed NFTs:', completedError);
    return;
  }
  
  console.log(`Completed NFTs: ${completedCount}`);
}

// 오래된 pending 레코드 제거
async function removePendingRecords() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  // pending 상태이고 1시간 이상 지난 레코드 삭제
  const { data, error } = await supabase
    .from('minted_nfts')
    .update({
      status: 'available',
      wallet: 'none',
      lock_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('status', 'pending')
    .lt('updated_at', oneHourAgo);
    
  if (error) {
    console.error('Error removing pending records:', error);
    return;
  }
  
  console.log(`Reset ${data?.length || 0} pending records to available`);
}

// available 레코드 초기화
async function resetAvailableRecords() {
  // available 상태인 레코드 초기화
  const { data, error } = await supabase
    .from('minted_nfts')
    .update({
      wallet: 'none',
      lock_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('status', 'available');
    
  if (error) {
    console.error('Error resetting available records:', error);
    return;
  }
  
  console.log(`Reset ${data?.length || 0} available records`);
}

// 프리세일 레코드 처리
async function fixPresaleRecords() {
  // mint_index가 null인 레코드를 프리세일로 표시
  const { data, error } = await supabase
    .from('minted_nfts')
    .update({
      is_presale: true,
      updated_at: new Date().toISOString()
    })
    .is('mint_index', null);
    
  if (error) {
    console.error('Error fixing presale records:', error);
    return;
  }
  
  console.log(`Marked ${data?.length || 0} records as presale`);
}

// 전체 데이터베이스 초기화 (위험!)
async function fullReset() {
  console.log('WARNING: This will reset the entire database!');
  console.log('Are you sure? This action cannot be undone.');
  console.log('To continue, uncomment the code in this function.');
  
  // 안전을 위해 코드를 주석 처리함 - 필요한 경우 아래 코드를 주석 해제
  /*
  // 테이블 초기화
  const { error: truncateError } = await supabase.rpc('truncate_minted_nfts');
  
  if (truncateError) {
    console.error('Error truncating table:', truncateError);
    return;
  }
  
  console.log('Table truncated successfully');
  
  // 기본 데이터 추가
  const { error: insertError } = await supabase.rpc('initialize_minted_nfts');
  
  if (insertError) {
    console.error('Error initializing table:', insertError);
    return;
  }
  
  console.log('Table initialized with 1000 available NFTs');
  */
}

// 명령행 인수로 실행할 작업 가져오기
const operation = process.argv[2];
cleanup(operation);