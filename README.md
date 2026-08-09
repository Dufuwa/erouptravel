# 2027 中歐旅行

旅伴共同編輯的行程工作台，涵蓋 17 天逐日行程、城市、景點、交通、住宿、票券與行前待辦。介面以繁體中文及手機優先設計，支援 Google 登入、Firestore 權限與受信任裝置離線唯讀。

## 技術

- Next.js App Router、TypeScript、Tailwind CSS
- Firebase Authentication、Cloud Firestore、Security Rules
- Vitest、Firebase Emulator、Playwright、GitHub Actions
- Vercel 部署與 PWA manifest／service worker

## 本機啟動

```bash
npm install
npm run dev
```

未設定 Firebase 時會使用本機展示模式，資料保存在瀏覽器 localStorage。複製 `.env.example` 為 `.env.local` 並填入 Firebase Web App 設定後，會自動切換為 Firebase 模式。

## Firebase 設定

1. 建立 Firebase 專案及 Web App，Firestore 地區選擇 `asia-east1`。
2. Authentication 啟用 Google provider。
3. 將 Firebase Web 設定填入 `.env.local`。
4. 以 Firebase CLI 部署規則：`npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <project-id>`。
5. 執行 `gcloud auth application-default login` 後執行 `npm run seed`；CI 或無互動環境也可暫時設定 `FIREBASE_SERVICE_ACCOUNT_JSON`。
6. 將 Vercel production domain 加入 Firebase Authentication Authorized domains。

Service account JSON 僅用於一次性匯入，禁止提交或放入前端／Vercel。

## 品質檢查

```bash
npm run lint
npm run typecheck
npm test
npm run test:rules
npm run build
npm run test:e2e
```

Firestore Rules 測試需要 Java，並由 Firebase Emulator 自動啟動。
