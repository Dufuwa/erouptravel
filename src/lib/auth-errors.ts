const messages: Record<string, string> = {
  "auth/popup-blocked": "瀏覽器阻擋了 Google 登入視窗。請允許彈出式視窗，並使用 Safari 或 Chrome 重新登入。",
  "auth/popup-closed-by-user": "Google 登入視窗已關閉，尚未完成登入。",
  "auth/cancelled-popup-request": "已有另一個登入視窗開啟，請關閉後再試一次。",
  "auth/unauthorized-domain": "目前網址尚未獲得 Firebase 登入授權。",
  "auth/network-request-failed": "網路連線異常，請確認連線後再試一次。",
  "auth/account-exists-with-different-credential": "這個 Email 已使用其他登入方式註冊。",
};

export function getAuthErrorMessage(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return (code && messages[code]) ?? "Google 登入失敗。請使用 Safari 或 Chrome 開啟網站後再試一次。";
}
