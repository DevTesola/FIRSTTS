# TESOLA 프로젝트

## 폰트 문제 해결하기

이 프로젝트에서는 Orbitron 폰트를 전체적으로 적용하기 위해 다음과 같은 방법을 사용합니다:

1. CSS를 통한 방법:
   - `/public/essential-font-fix.css` 파일에 모든 폰트 관련 스타일이 통합되어 있습니다.
   - 로컬 폰트 파일을 사용하여 웹폰트 로딩 문제를 방지합니다.
   - DM Sans 폰트를 Orbitron으로 재정의하여 지갑 어댑터 문제를 해결합니다.

2. JavaScript를 통한 방법:
   - `/public/essential-font-fix.js` 파일에 모든 폰트 관련 스크립트가 통합되어 있습니다.
   - DM Sans 폰트 로딩을 차단하고 Orbitron으로 대체합니다.
   - 지갑 어댑터 요소에 인라인 스타일로 폰트를 적용합니다.
   - 새로운 요소가 추가될 때를 감지해서 폰트를 적용합니다.

3. 직접 패치:
   - `scripts/simple-patch-wallet.js` 파일이 npm 스크립트 실행 시 
     지갑 어댑터 CSS 파일을 직접 패치합니다.
   - DM Sans 폰트를 Orbitron으로 변경합니다.

## 주의 사항

폰트 관련 파일들은 모두 정리되어 `/public/essential-font-fix.css`와 `/public/essential-font-fix.js`로 
통합되었습니다.

## 시작하기

개발 서버를 실행합니다:

```bash
npm run dev
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
