#!/usr/bin/env python3

with open('/home/tesola/tesolafixjs/utils/mediaUtils.js', 'r') as file:
    content = file.read()

# 모든 isStakingComponent 정의를 업데이트합니다
updated_content = content.replace(
    "(options.__source.includes('StakedNFTCard') || \n         options.__source.includes('NFTGallery') || \n         options.__source.includes('staking'))",
    "(options.__source.includes('StakedNFTCard') || \n         options.__source.includes('NFTGallery') || \n         options.__source.includes('Leaderboard') || \n         options.__source.includes('staking'))"
)

updated_content = updated_content.replace(
    "(options.__source.includes('StakedNFTCard') || \n            options.__source.includes('NFTGallery') || \n            options.__source.includes('staking'))",
    "(options.__source.includes('StakedNFTCard') || \n            options.__source.includes('NFTGallery') || \n            options.__source.includes('Leaderboard') || \n            options.__source.includes('staking'))"
)

with open('/home/tesola/tesolafixjs/utils/mediaUtils.js', 'w') as file:
    file.write(updated_content)

print("mediaUtils.js 파일이 성공적으로 업데이트되었습니다.")