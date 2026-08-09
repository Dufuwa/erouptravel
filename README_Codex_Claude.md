# 2027 Central Europe Travel — Initial Data Pack

這個資料包可直接放進 Next.js 專案的 `src/data` 與 `src/types` 使用。

## 檔案

- `types.ts`：核心 TypeScript 型別
- `trip.ts`：17 天完整行程
- `todos.ts`：行前待辦追蹤資料
- `bookings.ts`：住宿、交通、票券資料

## 建議放置位置

```text
src/
  data/
    trip.ts
    todos.ts
    bookings.ts
  types/
    types.ts
```

若採上述路徑，請把資料檔中的 import：

```ts
import type { Trip } from "./types";
```

改成：

```ts
import type { Trip } from "@/types/types";
```

其他檔案同理。

## 目前資料狀態

- 國際機票：已購買
- 其他住宿／交通／票券：預設尚未完成
- 布達佩斯：3 晚
- 維也納：4 晚
- 湖區：St. Wolfgang 1 晚＋Gosau 2 晚
- 夏夫堡登山火車與 Hallstatt 鹽礦需等 2027 春季營運資訊後再確認

## 建議下一步

1. 建立 `tripStore.ts`
2. 將 todo status、visited places、notes 寫入 localStorage
3. 以 `trip.days` 建立 Today View / Timeline
4. 以 `mapQuery` 產生 Google Maps Deep Link
5. 以 `bookingId` / `ticketId` 串接住宿、交通、票券卡片
6. 之後訂到實際飯店／車票／票券時，只需更新 `bookings.ts`

## Google Maps Deep Link

```ts
export function buildGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
```

若未來補上經緯度，優先使用 `latitude,longitude`。

## 注意

這份資料以目前已確認的行程為基礎。時間尚未固定的景點故意不填具體時刻，避免前端把暫定時間誤顯示成正式預約時間。