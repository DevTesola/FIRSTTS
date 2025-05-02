// pages/api/debug-program.js
import { Connection, PublicKey } from '@solana/web3.js';
import idl from '../../idl/nft_staking.json';

const { Program, AnchorProvider } = require('@coral-xyz/anchor');

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = 'CnpcsE2eJSfULpikfkbdd31wo6WeoL2jw8YyKSWG3Cfu';

export default async function handler(req, res) {
  try {
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Create Anchor provider and program
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // Create a dummy wallet for provider (since we're only reading)
    const dummyWallet = {
      publicKey: new PublicKey("11111111111111111111111111111111"),
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };
    
    const provider = new AnchorProvider(
      connection, 
      dummyWallet, 
      { commitment: 'confirmed' }
    );
    
    // 시그해시 계산 함수
    const crypto = require('crypto');
    function calculateDiscriminator(nameString) {
      return Buffer.from(crypto.createHash('sha256').update(nameString).digest()).slice(0, 8);
    }
    
    // 가능한 모든 시그해시 후보 생성
    const generateAllCandidates = (instrName) => {
      // 기본 형식
      const snakeCase = instrName.replace(/(?:^|\.?)([A-Z])/g, (_, x) => '_' + x.toLowerCase()).replace(/^_/, '');
      const camelCase = instrName;
      
      // 다양한 가능한 형식의 명령어 이름
      const candidates = [
        `global:${snakeCase}`,
        `global::${snakeCase}`,
        snakeCase,
        camelCase,
        instrName.toLowerCase(),
        `${camelCase}`,
        `global:${camelCase}`,
        `nft_staking:${snakeCase}`,
        `nft_staking::${snakeCase}`,
        `nft_staking:${camelCase}`,
      ];
      
      // 각 후보에 대한 시그해시 계산
      return candidates.map(name => {
        const discriminator = calculateDiscriminator(name);
        return {
          name,
          discriminator: Array.from(discriminator),
          discriminatorHex: discriminator.toString('hex')
        };
      });
    };
    
    // Initialize the program with the IDL
    const program = new Program(idl, programId, provider);
    
    // 모든 명령어에 대한 세부 정보 추출
    const instructionDetails = [];
    
    for (const instr of idl.instructions) {
      try {
        // 앵커 내부 함수를 사용한 시그해시 계산 (가능한 경우)
        let anchorDiscriminator;
        try {
          anchorDiscriminator = Buffer.from(await program._coder.instruction.hashInstruction(instr.name));
        } catch (e) {
          console.log(`앵커 시그해시 계산 실패 (${instr.name}):`, e.message);
          anchorDiscriminator = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
        }
        
        // 모든 가능한 시그해시 후보 생성
        const allCandidates = generateAllCandidates(instr.name);
        
        // 명령어별 상세 정보
        instructionDetails.push({
          name: instr.name,
          anchorDiscriminator: Array.from(anchorDiscriminator),
          anchorDiscriminatorHex: anchorDiscriminator.toString('hex'),
          allCandidates: allCandidates,
          accountsCount: instr.accounts?.length || 0,
          args: instr.args.map(arg => ({ name: arg.name, type: arg.type }))
        });
      } catch (err) {
        console.error(`명령어 ${instr.name} 처리 중 오류:`, err);
        instructionDetails.push({
          name: instr.name, 
          error: err.message
        });
      }
    }
    
    // Get program details
    const programInfo = {
      programId: programId.toString(),
      instructions: Object.keys(program.instruction || {}),
      accounts: Object.keys(program.account || {}),
      idlMetadata: idl.metadata,
      idlInstructions: instructionDetails,
      customData: {
        stakeNftMethodName: idl.instructions.find(ix => ix.name === 'stakeNft') ? 'stakeNft' : undefined
      }
    };
    
    return res.status(200).json({
      success: true,
      programInfo
    });
  } catch (error) {
    console.error('Error debugging program:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}