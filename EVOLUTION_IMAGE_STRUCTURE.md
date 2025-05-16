# Evolution Image Structure

이 문서는 SOLARA NFT Evolution 시스템의 이미지 구조를 설명합니다.

## 폴더 구조

```
public/
└── zz/              # 진화 시스템 이미지 폴더
    ├── 0011.png     # SOLARA #011 카드 형태
    ├── 0011z.jpg    # SOLARA #011 진화형
    ├── 0012.png     # SOLARA #012 카드 형태
    ├── 0012z.jpg    # SOLARA #012 진화형
    ├── 0467.png     # SOLARA #467 카드 형태
    ├── 0467z.jpg    # SOLARA #467 진화형
    ├── 0932.png     # SOLARA #932 카드 형태
    ├── 0932z.jpg    # SOLARA #932 진화형
    ├── 0873.png     # SOLARA #873 카드 형태 (전설 - 그림)
    ├── 0873z.jpg    # SOLARA #873 진화형 (전설 - 그림)
    ├── 0873.mp4     # SOLARA #873 카드 형태 (전설 - 영상)
    └── 0873z.mp4    # SOLARA #873 진화형 (전설 - 영상) [확대 효과 적용]
```

## 명명 규칙

- **카드 형태**: 숫자만 (`0011.png`)
- **진화 형태**: 숫자 + 'z' (`0011z.jpg`)
- **형식**: 카드는 PNG, 진화형은 JPG

## 진화 과정

1. 사용자가 NFT를 획득 (카드 형태로 시작)
2. 스테이킹과 TESOLA 토큰 축적
3. Evolution 시스템 활성화
4. 카드에서 실물 SOLARA로 변환

## 특징

- 진화 전: 정적인 카드 디자인
- 진화 후: 생동감 있는 캐릭터 형태
- 진화는 영구적이며 되돌릴 수 없음
- 진화된 NFT는 더 많은 보상과 혜택 제공

## 구현 예시

```javascript
// 진화 전 이미지 경로
const cardImage = `/nft-previews/${nftId}.png`;

// 진화 후 이미지 경로
const evolvedImage = `/zz/${nftId}z.png`;

// 진화 상태에 따른 이미지 선택
const displayImage = isEvolved ? evolvedImage : cardImage;
```

## 향후 계획

- 동적 애니메이션 추가
- 진화 애니메이션 효과
- 레어리티별 특수 진화 형태
- 시즌별 특별 진화 스킨