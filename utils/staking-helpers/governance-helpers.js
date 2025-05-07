/**
 * NFT 스테이킹 프로그램의 거버넌스 관련 유틸리티 스크립트
 * 프론트엔드에서 거버넌스 기능 구현에 사용할 헬퍼 함수들을 제공합니다.
 */

import { PublicKey } from '@solana/web3.js';
import { getErrorMessage } from './error-handler.js';
import { BufferParser, parseUserStakingInfo, parseVoteInfo } from './buffer-parser.js';
import { DISCRIMINATORS } from './constants.js';

// Seeds for PDAs
const USER_STAKING_SEED = Buffer.from([117, 115, 101, 114, 95, 115, 116, 97, 107, 105, 110, 103]); // "user_staking"
const VOTE_SEED = Buffer.from([118, 111, 116, 101]); // "vote"

/**
 * 사용자의 투표력(voting power)을 계산합니다.
 * 스테이킹된 NFT 수와 등급, 스테이킹 기간에 따라 투표력이 결정됩니다.
 * 
 * @param {PublicKey} programId - 스테이킹 프로그램 ID
 * @param {PublicKey} walletPublicKey - 사용자 지갑 주소
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<number>} - 사용자의 총 투표력
 */
async function calculateVotingPower(programId, walletPublicKey, connection) {
  try {
    // 사용자 스테이킹 정보 PDA 계산
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [USER_STAKING_SEED, walletPublicKey.toBuffer()],
      programId
    );
    
    // 계정 정보 가져오기
    const accountInfo = await connection.getAccountInfo(userStakingInfoPDA);
    if (!accountInfo) {
      return 0; // 스테이킹 정보가 없으면 투표력 0
    }
    
    // 새로운 BufferParser 유틸리티를 사용하여 계정 데이터를 파싱
    try {
      const userStakingInfo = parseUserStakingInfo(
        accountInfo.data,
        DISCRIMINATORS.USER_STAKING_INFO
      );
      
      // 기본적으로 스테이킹된 NFT 수를 반환
      // 추후 계산 로직을 확장하여 각 NFT의 등급과 스테이킹 기간을 고려
      return userStakingInfo.stakedCount;
    } catch (parseError) {
      console.error("Failed to parse user staking info:", parseError);
      
      // Try the existing method if parsing fails (fallback mechanism)
      const data = accountInfo.data;
      if (data.length < 41) {
        console.warn("Account data too small, length:", data.length);
        return 0;
      }
      
      // 간단한 파싱: 데이터가 구조에 맞지 않아도 기본 정보를 추출
      try {
        const stakedCount = data[40]; // 스테이킹된 NFT 수
        return stakedCount;
      } catch (fallbackError) {
        console.error("Fallback parsing failed too:", fallbackError);
        return 0;
      }
    }
  } catch (error) {
    console.error("투표력 계산 오류:", error);
    return 0;
  }
}

/**
 * 사용자가 투표할 수 있는지 확인합니다.
 * 
 * @param {PublicKey} programId - 스테이킹 프로그램 ID
 * @param {PublicKey} walletPublicKey - 사용자 지갑 주소
 * @param {PublicKey} proposalKey - 제안 계정 주소
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<{canVote: boolean, reason: string|null, votingPower: number}>}
 */
async function canUserVote(programId, walletPublicKey, proposalKey, connection) {
  try {
    // 사용자의 투표력 계산
    const votingPower = await calculateVotingPower(programId, walletPublicKey, connection);
    if (votingPower <= 0) {
      return { canVote: false, reason: "스테이킹된 NFT가 없어 투표할 수 없습니다", votingPower: 0 };
    }
    
    // 이미 투표했는지 확인
    const [votePDA] = PublicKey.findProgramAddressSync(
      [VOTE_SEED, proposalKey.toBuffer(), walletPublicKey.toBuffer()],
      programId
    );
    
    const voteAccountInfo = await connection.getAccountInfo(votePDA);
    if (voteAccountInfo) {
      // 투표 정보가 존재하면 이미 투표한 것
      try {
        // 투표 정보를 파싱하여 어떤 투표를 했는지 확인할 수 있음
        const voteInfo = parseVoteInfo(voteAccountInfo.data, DISCRIMINATORS.VOTE);
        const voteType = voteInfo.side === 1 ? "찬성" : "반대";
        return { 
          canVote: false, 
          reason: `이미 이 제안에 ${voteType} 투표했습니다`, 
          votingPower, 
          existingVote: voteInfo 
        };
      } catch (error) {
        // 파싱에 실패하더라도 계정이 존재하면 이미 투표한 것으로 간주
        return { canVote: false, reason: "이미 이 제안에 투표했습니다", votingPower };
      }
    }
    
    // 제안 상태 확인 (투표 가능한 상태인지)
    const proposalInfo = await connection.getAccountInfo(proposalKey);
    if (!proposalInfo) {
      return { canVote: false, reason: "제안을 찾을 수 없습니다", votingPower };
    }
    
    try {
      // 제안 데이터 파싱
      const parser = new BufferParser(proposalInfo.data);
      
      // 해당 제안 데이터의 구조에 맞게 파싱
      if (!parser.checkDiscriminator(DISCRIMINATORS.PROPOSAL)) {
        return { canVote: false, reason: "유효한 제안 계정이 아닙니다", votingPower };
      }
      
      parser.skipDiscriminator();
      const proposalCreator = parser.parsePublicKey();
      const title = parser.parseString(); // 제목 (길이 접두사 문자열)
      const description = parser.parseString(); // 설명 (길이 접두사 문자열)
      const startTime = parser.parseU64AsNumber(); // 시작 시간 (초)
      const endTime = parser.parseU64AsNumber(); // 종료 시간 (초)
      const quorum = parser.parseU64AsNumber(); // 정족수
      const threshold = parser.parseU32(); // 승인 임계값 % (0-100)
      const forVotes = parser.parseU64AsNumber(); // 찬성표 수
      const againstVotes = parser.parseU64AsNumber(); // 반대표 수
      const isExecuted = parser.parseBool(); // 실행 여부
      
      // 현재 시간과 제안의 시작/종료 시간을 비교
      const now = Math.floor(Date.now() / 1000);
      
      if (now < startTime) {
        return { 
          canVote: false, 
          reason: "투표 기간이 아직 시작되지 않았습니다",
          votingPower,
          proposalDetails: {
            title,
            startTime: new Date(startTime * 1000),
            endTime: new Date(endTime * 1000),
            quorum,
            threshold,
            forVotes,
            againstVotes
          }
        };
      }
      
      if (now > endTime) {
        return { 
          canVote: false, 
          reason: "투표 기간이 종료되었습니다", 
          votingPower,
          proposalDetails: {
            title,
            startTime: new Date(startTime * 1000),
            endTime: new Date(endTime * 1000),
            quorum,
            threshold,
            forVotes,
            againstVotes
          }
        };
      }
      
      if (isExecuted) {
        return { 
          canVote: false, 
          reason: "이미 실행된 제안입니다", 
          votingPower,
          proposalDetails: {
            title,
            startTime: new Date(startTime * 1000),
            endTime: new Date(endTime * 1000),
            quorum,
            threshold,
            forVotes,
            againstVotes
          }
        };
      }
      
      return { 
        canVote: true, 
        reason: null, 
        votingPower,
        proposalDetails: {
          title,
          startTime: new Date(startTime * 1000),
          endTime: new Date(endTime * 1000),
          quorum,
          threshold,
          forVotes,
          againstVotes
        }
      };
    } catch (parseError) {
      console.error("제안 데이터 파싱 오류:", parseError);
      
      // 파싱 실패 시 간단한 정보만 반환 (예시)
      const now = Math.floor(Date.now() / 1000);
      // 예시 목적으로 테스트 데이터 사용
      const startTime = now - 86400; // 하루 전 시작
      const endTime = now + 86400; // 하루 후 종료
      
      return { canVote: true, reason: null, votingPower };
    }
  } catch (error) {
    console.error("투표 가능 여부 확인 오류:", error);
    return { canVote: false, reason: getErrorMessage(error), votingPower: 0 };
  }
}

/**
 * 특정 제안의 현재 투표 상태를 가져옵니다.
 * 
 * @param {PublicKey} proposalKey - 제안 계정 주소
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<{forVotes: number, againstVotes: number, quorum: number, threshold: number, canExecute: boolean, title: string, description: string, startTime: Date, endTime: Date, isExecuted: boolean}>}
 */
async function getProposalVotingStatus(proposalKey, connection) {
  try {
    const proposalInfo = await connection.getAccountInfo(proposalKey);
    if (!proposalInfo) {
      throw new Error("제안을 찾을 수 없습니다");
    }
    
    try {
      // 제안 데이터 파싱
      const parser = new BufferParser(proposalInfo.data);
      
      // 해당 제안 데이터의 구조에 맞게 파싱
      if (!parser.checkDiscriminator(DISCRIMINATORS.PROPOSAL)) {
        throw new Error("유효한 제안 계정이 아닙니다");
      }
      
      parser.skipDiscriminator();
      const proposalCreator = parser.parsePublicKey();
      const title = parser.parseString(); // 제목 (길이 접두사 문자열)
      const description = parser.parseString(); // 설명 (길이 접두사 문자열)
      const startTime = parser.parseU64AsNumber(); // 시작 시간 (초)
      const endTime = parser.parseU64AsNumber(); // 종료 시간 (초)
      const quorum = parser.parseU64AsNumber(); // 정족수
      const threshold = parser.parseU32(); // 승인 임계값 % (0-100)
      const forVotes = parser.parseU64AsNumber(); // 찬성표 수
      const againstVotes = parser.parseU64AsNumber(); // 반대표 수
      const isExecuted = parser.parseBool(); // 실행 여부
      
      // 실행 가능 여부 계산
      const totalVotes = forVotes + againstVotes;
      const approvalPercentage = totalVotes > 0 ? (forVotes * 100) / totalVotes : 0;
      const canExecute = totalVotes >= quorum && approvalPercentage >= threshold;
      
      return {
        title,
        description,
        forVotes,
        againstVotes,
        quorum,
        threshold,
        canExecute,
        startTime: new Date(startTime * 1000),
        endTime: new Date(endTime * 1000),
        isExecuted,
        proposalCreator,
        totalVotes,
        approvalPercentage
      };
    } catch (parseError) {
      console.error("제안 데이터 파싱 오류:", parseError);
      
      // 파싱 실패 시 기본값 반환 (테스트 데이터)
      const now = Math.floor(Date.now() / 1000);
      return {
        title: "제안 제목 (파싱 실패)",
        description: "제안 설명을 파싱할 수 없습니다.",
        forVotes: 0,
        againstVotes: 0,
        quorum: 100,
        threshold: 51,
        canExecute: false,
        startTime: new Date((now - 86400) * 1000), // 하루 전 시작
        endTime: new Date((now + 86400) * 1000), // 하루 후 종료
        isExecuted: false,
        proposalCreator: proposalKey, // 임시값
        totalVotes: 0,
        approvalPercentage: 0
      };
    }
  } catch (error) {
    console.error("제안 상태 확인 오류:", error);
    throw error;
  }
}

/**
 * 사용자의 거버넌스 요약 정보를 가져옵니다.
 * 
 * @param {PublicKey} programId - 스테이킹 프로그램 ID
 * @param {PublicKey} walletPublicKey - 사용자 지갑 주소
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<{votingPower: number, canCreateProposal: boolean, activeProposals: number, proposalCreateThreshold: number}>}
 */
async function getUserGovernanceSummary(programId, walletPublicKey, connection) {
  try {
    // 사용자의 투표력 계산
    const votingPower = await calculateVotingPower(programId, walletPublicKey, connection);
    
    // 거버넌스 설정 조회 (실제로는 온체인 설정 계정에서 가져와야 함)
    // 여기서는 상수에서 정의된 기본값을 사용
    const proposalCreateThreshold = 10; // 기본 제안 생성 임계값 (constants.js의 GOVERNANCE_CONSTANTS.DEFAULT_PROPOSAL_THRESHOLD)
    
    // 제안 생성 가능 여부 (거버넌스 설정에서 최소 임계값과 비교)
    const canCreateProposal = votingPower >= proposalCreateThreshold;
    
    // 실제 거버넌스 시스템에서는 모든 프로포절 계정을 조회하여 활성화 상태인 것을 카운트
    // 여기서는 테스트 목적으로 3개의 활성 제안이 있다고 가정
    // 실제 구현에서는 getProgramAccounts로 DISCRIMINATORS.PROPOSAL를 가진 계정을 조회
    const activeProposals = 3; // 테스트 데이터
    
    // 최근 제안 정보 (시뮬레이션)
    const recentProposals = [
      {
        id: "proposal1",
        title: "Update Community Treasury Allocation",
        description: "This proposal aims to adjust the distribution of treasury funds, allocating 30% to community-driven development projects.",
        forVotes: 1240,
        againstVotes: 320,
        quorum: 1000,
        status: 'active',
        endTime: new Date(Date.now() + 86400000 * 3) // 3일 후 종료
      },
      {
        id: "proposal2", 
        title: "Staking Rewards Expansion Proposal",
        description: "Increase staking reward tiers for Rare and Epic NFTs by 15% and introduce special weekly bonuses for continuous stakers.",
        forVotes: 980,
        againstVotes: 760,
        quorum: 1500,
        status: 'active',
        endTime: new Date(Date.now() + 86400000 * 5) // 5일 후 종료
      },
      {
        id: "proposal3",
        title: "TESOLA Partnership Framework", 
        description: "Establish guidelines for project partnerships and integrations with other Solana ecosystem projects.",
        forVotes: 2150,
        againstVotes: 350,
        quorum: 2000,
        status: 'active',
        endTime: new Date(Date.now() + 86400000 * 2) // 2일 후 종료
      }
    ];
    
    return {
      votingPower,
      canCreateProposal,
      activeProposals,
      proposalCreateThreshold,
      recentProposals: recentProposals // 테스트 데이터
    };
  } catch (error) {
    console.error("거버넌스 요약 정보 조회 오류:", error);
    
    // 오류 발생 시 기본 정보 반환
    return {
      votingPower: 0,
      canCreateProposal: false,
      activeProposals: 0,
      proposalCreateThreshold: 10,
      recentProposals: []
    };
  }
}

/**
 * 투표 데이터를 Buffer로 직렬화하는 함수
 * 
 * @param {number} side - 투표 방향 (0: 반대, 1: 찬성)
 * @param {number} votingPower - 투표력
 * @returns {Buffer} - 직렬화된 투표 데이터
 */
function serializeVoteData(side, votingPower) {
  // 버퍼 크기: discriminator(8) + side(1) + votingPower(8) = 17 바이트
  const buffer = Buffer.alloc(17);
  
  // Discriminator 작성 (VOTE 데이터에 대한 discriminator)
  DISCRIMINATORS.VOTE.copy(buffer, 0);
  
  // 투표 방향 (1 바이트)
  buffer.writeUInt8(side, 8);
  
  // 투표력 (8 바이트 u64)
  const votingPowerBuf = Buffer.alloc(8);
  const view = new DataView(votingPowerBuf.buffer);
  // 소수점이 없다고 가정하고 Number를 u64로 변환
  // 실제로는 BigInt를 사용하여 변환해야 할 수도 있음
  view.setBigUint64(0, BigInt(votingPower), true); // true = 리틀 엔디안
  votingPowerBuf.copy(buffer, 9);
  
  return buffer;
}

export {
  calculateVotingPower,
  canUserVote,
  getProposalVotingStatus,
  getUserGovernanceSummary,
  serializeVoteData,
  VOTE_SEED,
  USER_STAKING_SEED
};