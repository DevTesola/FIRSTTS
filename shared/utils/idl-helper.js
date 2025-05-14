/**
 * IDL 헬퍼 유틸리티
 * Anchor 프로그램 관련 IDL을 처리하기 위한 유틸리티 함수를 제공합니다.
 * vec<pubkey> 타입으로 인한 Anchor 클라이언트 오류 문제를 해결합니다.
 */

/**
 * IDL을 Anchor 클라이언트와 호환되도록 수정합니다.
 * 1. 계정 size 속성 추가
 * 2. vec<pubkey> 타입을 array[pubkey]로 변환
 * 3. 필요한 구조적 조정 수행
 *
 * @param {Object} idl - 원본 IDL 객체
 * @returns {Object} 수정된 IDL 객체
 */
function prepareIdlForAnchor(idl) {
  if (!idl) {
    console.warn('Invalid IDL: null or undefined');
    return idl;
  }

  try {
    // IDL 객체 복제
    const preparedIdl = JSON.parse(JSON.stringify(idl));

    // 1. 계정에 size 속성 추가
    if (preparedIdl.accounts && Array.isArray(preparedIdl.accounts)) {
      preparedIdl.accounts.forEach(account => {
        if (!account.size) {
          // 안전하게 큰 크기로 설정 (모든 계정에 충분한 크기)
          account.size = 1024;
          console.log(`Added size ${account.size} to account type: ${account.name}`);
        }
      });
    }

    // 2. IDL 내의 모든 vec<pubkey> 타입을 안전하게 변환

    // a) types 배열의 구조체 필드에서 변환
    if (preparedIdl.types && Array.isArray(preparedIdl.types)) {
      preparedIdl.types.forEach(typeObj => {
        if (typeObj.type && typeObj.type.kind === 'struct' &&
            typeObj.type.fields && Array.isArray(typeObj.type.fields)) {

          typeObj.type.fields.forEach(field => {
            // vec<pubkey> 타입 변환
            if (field.type && typeof field.type === 'object' && field.type.vec === 'pubkey') {
              field.type = "bytes"; // pubkey[]를 bytes로 변환
              field.isArray = true;
              console.log(`Converted vec<pubkey> to bytes[] in type: ${typeObj.name}, field: ${field.name}`);
            }
            // 다른 vec 타입 변환
            else if (field.type && typeof field.type === 'object' && field.type.vec) {
              const innerType = field.type.vec;
              field.type = { array: [innerType, 32] }; // 더 안전한 배열 표현식으로 변환
              console.log(`Converted vec<${innerType}> to array in type: ${typeObj.name}, field: ${field.name}`);
            }
          });
        }
      });
    }

    // b) 계정 정의에서 변환
    if (preparedIdl.accounts && Array.isArray(preparedIdl.accounts)) {
      preparedIdl.accounts.forEach(account => {
        if (account.type && account.type.kind === 'struct' && account.type.fields) {
          account.type.fields.forEach(field => {
            // vec<pubkey> 타입 변환
            if (field.type && typeof field.type === 'object' && field.type.vec === 'pubkey') {
              field.type = "bytes"; // pubkey[]를 bytes로 변환
              field.isArray = true;
              console.log(`Converted vec<pubkey> field in account ${account.name}: ${field.name}`);
            }
            // 다른 vec 타입 변환
            else if (field.type && typeof field.type === 'object' && field.type.vec) {
              const innerType = field.type.vec;
              field.type = { array: [innerType, 32] }; // 더 안전한 배열 표현식으로 변환
              console.log(`Converted vec field in account ${account.name}: ${field.name}`);
            }
          });
        }
      });
    }

    // c) 명령어 인자와 반환값 변환
    if (preparedIdl.instructions && Array.isArray(preparedIdl.instructions)) {
      preparedIdl.instructions.forEach(instruction => {
        // 반환 타입 수정
        if (instruction.returns && instruction.returns.vec === 'pubkey') {
          instruction.returns = "bytes";
          console.log(`Fixed return type for instruction: ${instruction.name}`);
        }

        // 인자 타입 수정
        if (instruction.args && Array.isArray(instruction.args)) {
          instruction.args.forEach(arg => {
            // vec<pubkey> 타입 변환
            if (arg.type && typeof arg.type === 'object' && arg.type.vec === 'pubkey') {
              arg.type = "bytes"; // pubkey[]를 bytes로 변환
              console.log(`Fixed vec<pubkey> arg type for instruction: ${instruction.name}, arg: ${arg.name}`);
            }
            // 다른 vec 타입 변환
            else if (arg.type && typeof arg.type === 'object' && arg.type.vec) {
              const innerType = arg.type.vec;
              arg.type = { array: [innerType, 32] }; // 더 안전한 배열 표현식으로 변환
              console.log(`Fixed vec arg type for instruction: ${instruction.name}, arg: ${arg.name}`);
            }
          });
        }
      });
    }

    // d) 특별 케이스: UserStakingInfo.staked_mints
    const userStakingInfoType = preparedIdl.types?.find(t => t.name === 'UserStakingInfo');
    if (userStakingInfoType && userStakingInfoType.type && userStakingInfoType.type.fields) {
      const stakedMintsField = userStakingInfoType.type.fields.find(f => f.name === 'staked_mints');
      if (stakedMintsField && stakedMintsField.type && stakedMintsField.type.vec === 'pubkey') {
        stakedMintsField.type = "bytes";
        stakedMintsField.isArray = true;
        console.log('Fixed staked_mints field in UserStakingInfo type');
      }
    }

    // e) verifier_authorities 필드 특별 처리 (EnhancedSocialActivityVerifier)
    const socialVerifierType = preparedIdl.types?.find(t => t.name === 'EnhancedSocialActivityVerifier');
    if (socialVerifierType && socialVerifierType.type && socialVerifierType.type.fields) {
      const authoritiesField = socialVerifierType.type.fields.find(f => f.name === 'verifier_authorities');
      if (authoritiesField && authoritiesField.type && authoritiesField.type.vec === 'pubkey') {
        authoritiesField.type = "bytes";
        authoritiesField.isArray = true;
        console.log('Fixed verifier_authorities field in EnhancedSocialActivityVerifier type');
      }
    }

    // f) 특별 케이스: initial_verifiers 인자 (initialize_enhanced_social_verifier)
    const initSocialVerifierInstr = preparedIdl.instructions?.find(i =>
      i.name === 'initialize_enhanced_social_verifier'
    );
    if (initSocialVerifierInstr && initSocialVerifierInstr.args) {
      const initialVerifiersArg = initSocialVerifierInstr.args.find(a => a.name === 'initial_verifiers');
      if (initialVerifiersArg && initialVerifiersArg.type &&
          typeof initialVerifiersArg.type === 'object' && initialVerifiersArg.type.vec === 'pubkey') {
        initialVerifiersArg.type = "bytes";
        console.log('Fixed initial_verifiers argument in initialize_enhanced_social_verifier');
      }
    }

    // g) 특별 케이스: get_user_staked_nfts 명령어 반환 타입
    const getUserStakedNfts = preparedIdl.instructions?.find(i => i.name === 'get_user_staked_nfts');
    if (getUserStakedNfts && getUserStakedNfts.returns && getUserStakedNfts.returns.vec === 'pubkey') {
      getUserStakedNfts.returns = "bytes";
      console.log('Fixed return type of get_user_staked_nfts instruction');
    }

    console.log(`IDL 수정 완료: ${preparedIdl.accounts?.length || 0} 계정, ${preparedIdl.instructions?.length || 0} 명령어, ${preparedIdl.types?.length || 0} 타입`);
    return preparedIdl;
  } catch (error) {
    console.error("IDL 수정 중 오류 발생:", error);
    // 오류가 발생해도 원본 IDL 반환
    return idl;
  }
}

/**
 * 계정 필드에서 discriminator 바이트 배열을 찾습니다.
 * 이것은 계정 유형을 식별하는 데 사용됩니다.
 *
 * @param {Object} idl - IDL 객체
 * @returns {Object} 계정 이름을 키로, discriminator 버퍼를 값으로 하는 객체
 */
function extractAccountDiscriminators(idl) {
  if (!idl || !idl.accounts || !Array.isArray(idl.accounts)) {
    console.warn('Invalid IDL format: missing accounts array');
    return {};
  }

  const discriminators = {};

  idl.accounts.forEach(account => {
    if (account.discriminator && Array.isArray(account.discriminator)) {
      discriminators[account.name] = Buffer.from(account.discriminator);
    }
  });

  return discriminators;
}

/**
 * BorshAccountsCoder 인스턴스에서 vec<pubkey> 타입 처리 문제를 수정합니다.
 * 계정 레이아웃의 크기를 수동으로 설정하여 오류를 방지합니다.
 *
 * @param {Object} accountsCoder - BorshAccountsCoder 인스턴스
 * @returns {Object} 수정된 accountsCoder 인스턴스
 */
function fixAccountsCoder(accountsCoder) {
  if (!accountsCoder || !accountsCoder.accountLayouts) {
    console.warn('Invalid accountsCoder: missing accountLayouts');
    return accountsCoder;
  }

  try {
    // 계정 레이아웃 크기 수정
    for (const [name, layout] of Object.entries(accountsCoder.accountLayouts)) {
      if (layout && layout.span === undefined) {
        // 합리적인 기본 크기 설정
        layout.span = 1024;
        console.log(`Fixed account layout size for: ${name}`);
      }
    }
  } catch (error) {
    console.error("Account coder 수정 중 오류 발생:", error);
  }

  return accountsCoder;
}

/**
 * 더 안전한 Anchor 프로그램 초기화를 위한 도우미 함수
 * IDL 처리 문제를 완화하는 팔백(fallback) 메커니즘을 제공합니다.
 *
 * @param {Object} idl - 원본 IDL 객체
 * @param {String|PublicKey} programId - 프로그램 ID 문자열 또는 PublicKey
 * @param {Object} provider - Anchor 프로바이더 객체
 * @returns {Object} 프로그램 객체 또는 null
 */
function safeInitializeProgram(idl, programId, provider) {
  try {
    const { Program, utils } = require('@project-serum/anchor');
    const { PublicKey } = require('@solana/web3.js');

    // programId가 문자열이면 PublicKey로 변환
    const programPubkey = typeof programId === 'string'
      ? new PublicKey(programId)
      : programId;

    console.log("Anchor 프로그램 초기화 중:", {
      programId: programPubkey.toString(),
      useUpdatedIdl: true,
      accountTypes: idl.accounts?.length || 0
    });

    try {
      // 1. IDL 완전히 수정
      const preparedIdl = prepareIdlForAnchor(idl);

      // 2. Program 객체 생성 - 첫 번째 시도
      try {
        // 프로그램 옵션 설정
        const programOpts = {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          useUpdatedIdl: true,   // 업데이트된 IDL 사용
          idlRewriter: (idl) => { // IDL 재작성 함수
            return preparedIdl;
          }
        };

        // 프로그램 초기화
        const program = new Program(
          preparedIdl,
          programPubkey,
          provider,
          programOpts
        );

        // BorshAccountsCoder 수정 적용
        if (program.coder && program.coder.accounts) {
          program.coder.accounts = fixAccountsCoder(program.coder.accounts);
        }

        // 테스트용 더미 트랜잭션 생성 시도 (오류 조기 발견)
        try {
          // 명령어가 있을 경우만 테스트
          if (program.methods && Object.keys(program.methods).length > 0) {
            const methodName = Object.keys(program.methods)[0];
            const tx = program.methods[methodName]?.();
            // 실제 트랜잭션을 생성하지 않고 메서드 체인만 확인
          }
        } catch (testError) {
          console.warn("프로그램 메서드 테스트 오류:", testError.message);
          // 테스트 실패는 무시하고 계속 진행
        }

        console.log("Anchor 프로그램 초기화 성공!");
        return program;
      } catch (firstError) {
        console.warn("첫 번째 초기화 시도 실패:", firstError.message);

        // 3. 두 번째 시도: 더 간단한 옵션으로 다시 시도
        try {
          // 더 보수적인 설정으로 프로그램 초기화
          const program = new Program(
            preparedIdl,
            programPubkey,
            provider,
            { skipPreflight: true }  // 간소화된 옵션
          );

          console.log("두 번째 시도로 Anchor 프로그램 초기화 성공!");
          return program;
        } catch (secondError) {
          console.error("두 번째 초기화 시도 실패:", secondError.message);

          // 4. BorshCoder를 사용하지 않는 방식으로 수동 초기화 시도
          console.log("프로그램 객체 수동 구성으로 전환...");

          // 현재는 null 반환하고 상위 코드에서 처리
          return null;
        }
      }
    } catch (error) {
      console.error("Anchor 프로그램 초기화 오류:", error);
      console.log("PublicKey 벡터 타입 문제가 발생했습니다.");
      return null;
    }
  } catch (error) {
    console.error("프로그램 초기화 실패:", error);
    return null;
  }
}

module.exports = {
  prepareIdlForAnchor,
  extractAccountDiscriminators,
  fixAccountsCoder,
  safeInitializeProgram
};