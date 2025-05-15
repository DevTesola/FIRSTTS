-- 상태별 레코드 수 카운트 함수
CREATE OR REPLACE FUNCTION count_records_by_status()
RETURNS TABLE (status text, count bigint) 
LANGUAGE sql
AS $$
  SELECT status, COUNT(*) 
  FROM minted_nfts 
  GROUP BY status 
  ORDER BY count DESC;
$$;

-- 테이블 초기화 함수
CREATE OR REPLACE FUNCTION truncate_minted_nfts()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 기존 레코드 삭제
  DELETE FROM minted_nfts WHERE status <> 'completed' OR is_presale = true;
END;
$$;

-- 테이블 초기화 및 기본 데이터 추가 함수
CREATE OR REPLACE FUNCTION initialize_minted_nfts()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completed_count integer;
BEGIN
  -- 이미 완료된 NFT 수 계산
  SELECT COUNT(*) INTO completed_count 
  FROM minted_nfts 
  WHERE status = 'completed' AND (is_presale = false OR is_presale IS NULL);
  
  -- 완료된 NFT 인덱스만 보호하고 나머지는 삭제
  WITH existing_indices AS (
    SELECT mint_index 
    FROM minted_nfts 
    WHERE status = 'completed' AND (is_presale = false OR is_presale IS NULL)
  )
  DELETE FROM minted_nfts 
  WHERE mint_index IS NOT NULL 
    AND mint_index NOT IN (SELECT mint_index FROM existing_indices);
  
  -- 새로운 available 레코드 추가
  WITH existing_indices AS (
    SELECT mint_index 
    FROM minted_nfts 
    WHERE status = 'completed' AND (is_presale = false OR is_presale IS NULL)
  ),
  sequence AS (
    SELECT generate_series(0, 999) AS idx
  )
  INSERT INTO minted_nfts (mint_index, wallet, status, updated_at)
  SELECT 
    s.idx, 
    'none', 
    'available',
    CURRENT_TIMESTAMP
  FROM sequence s
  WHERE NOT EXISTS (
    SELECT 1 
    FROM existing_indices e 
    WHERE e.mint_index = s.idx
  );
  
  -- 결과 로그
  RAISE NOTICE 'Initialized minted_nfts table with % completed NFTs and % available NFTs', 
    completed_count, 
    1000 - completed_count;
END;
$$;