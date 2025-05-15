# Coming Soon Pages: Implementation Steps

This guide provides step-by-step instructions for implementing the Coming Soon pages feature in your TESOLA project.

## Current Implementation Status

**Current Implementation Status: Option D (Direct Component Replacement) Applied**

**현재 구현 상태: Option D (직접 컴포넌트 교체 방식) 적용됨**

Original component files have been directly modified to redirect to Coming Soon pages:

원본 컴포넌트 파일이 직접 수정되어 Coming Soon 페이지로 리다이렉트됩니다:

1. Original File Backups (원본 파일 백업): 
   - `/components/MintSection.jsx.original` - Original minting button component (민팅 버튼 컴포넌트 원본)
   - `/components/presale/PresaleSection.jsx.original` - Original presale button component (프리세일 버튼 컴포넌트 원본)
   - `/components/presale/PresalePage.jsx.original` - Original presale page component (프리세일 페이지 컴포넌트 원본)
   - `/components/Layout.jsx.original` - Original social links component (소셜 링크 컴포넌트 원본)

2. Coming Soon Redirects Applied (Coming Soon 리다이렉트 적용):
   - `MintSection.jsx` → Redirects to Coming Soon page when MINT NOW button is clicked
   - `PresaleSection.jsx` → Redirects to Coming Soon page when Buy TESOLA Tokens button is clicked
   - `PresalePage.jsx` → Redirects to Coming Soon page when Buy TESOLA Tokens button is clicked
   - `Layout.jsx` → Redirects to Coming Soon page when Discord and GitHub links are clicked

3. To restore original functionality, run the following commands (원래 기능으로 복원하려면 다음 명령어를 실행하세요):
   ```bash
   cp /home/tesola/ttss/tesolafixjs/components/MintSection.jsx.original /home/tesola/ttss/tesolafixjs/components/MintSection.jsx
   cp /home/tesola/ttss/tesolafixjs/components/presale/PresaleSection.jsx.original /home/tesola/ttss/tesolafixjs/components/presale/PresaleSection.jsx
   cp /home/tesola/ttss/tesolafixjs/components/presale/PresalePage.jsx.original /home/tesola/ttss/tesolafixjs/components/presale/PresalePage.jsx
   cp /home/tesola/ttss/tesolafixjs/components/Layout.jsx.original /home/tesola/ttss/tesolafixjs/components/Layout.jsx
   ```

## Alternative Implementation Options

These are alternative implementation methods that are not currently used but are kept for reference.

아래는 다른 방식의 구현 방법들로, 현재는 사용하지 않지만 참고용으로 남겨둡니다.

### Option A: Full Page Replacement

First, back up the original files we'll be modifying:

```bash
cp /home/tesola/ttss/tesolafixjs/pages/nft.js /home/tesola/ttss/tesolafixjs/pages/nft.js.bak
cp /home/tesola/ttss/tesolafixjs/pages/presale.js /home/tesola/ttss/tesolafixjs/pages/presale.js.bak
```

Copy content from example pages to original page files:

```bash
cp /home/tesola/ttss/tesolafixjs/pages/nft-coming-soon.js /home/tesola/ttss/tesolafixjs/pages/nft.js
cp /home/tesola/ttss/tesolafixjs/pages/presale-coming-soon.js /home/tesola/ttss/tesolafixjs/pages/presale.js
```

### Option B: Modify Imports in Existing Files

Edit the import statements in the original files:

1. In `/pages/nft.js`, change:
   ```javascript
   import HomePage from "../components/HomePage";
   import Layout from "../components/Layout";
   ```
   to:
   ```javascript
   import HomePage from "../components/wrappers/HomePageWithComingSoonMint";
   import Layout from "../components/wrappers/LayoutWithSocialLinks";
   ```

2. In `/pages/presale.js`, change:
   ```javascript
   import PresalePage from "../components/presale/PresalePage";
   import Layout from "../components/Layout";
   ```
   to:
   ```javascript
   import PresalePage from "../components/wrappers/PresalePageWithComingSoon";
   import Layout from "../components/wrappers/LayoutWithSocialLinks";
   ```

### Option C: Use the Component Override Approach

In `/pages/_app.js`, add:

```javascript
import { MintSection, PresaleSection, SocialLinksWrapper } from './coming-soon-implementation';

// Then in your Component, wrap <Component {...pageProps} /> with:
<SocialLinksWrapper>
  <Component {...pageProps} />
</SocialLinksWrapper>
```

## Testing the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the redirects by:
   - Navigating to `/nft` and clicking the mint button
   - Navigating to `/presale` and clicking the buy TESOLA button
   - Clicking any Discord or GitHub links in the footer

3. Each action should redirect to the appropriate Coming Soon page.

## More Information

For detailed documentation on how the Coming Soon pages work, please refer to:

- `COMING_SOON_IMPLEMENTATION.md` - Complete implementation guide with details
- `/components/wrappers/README.md` - Documentation for wrapper components
- `/pages/coming-soon-implementation.js` - Code documentation for implementation

## Support

If you encounter any issues with the implementation, please contact the development team.