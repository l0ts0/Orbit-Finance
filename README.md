# Orbit Finance (No AI)

一個以 Supabase 為後端的個人資產與記帳儀表板。包含資產管理、交易記帳、自動化模擬與系統紀錄，提供基本 PWA 支援。

## 快速開始
- 安裝套件：`npm install`
- 設定 `.env.local`：
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- 啟動開發伺服器：`npm run dev`

## 部署到 Vercel
1. 將程式碼推送到 Git repository 並在 Vercel 建立專案。
2. 在 Vercel 專案的 Environment Variables 中設定 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`（Production / Preview 同步設定）。
3. 部署後即可使用，所有 API 呼叫與匯率/股價抓取都在前端完成，請留意瀏覽器 CORS/網路連線。

## Supabase 資料表對應
以下為程式碼預期的表結構（snake_case 欄位名稱）：
- `holdings`: `id`, `user_id`, `name`, `ticker`, `type`, `price`, `quantity`, `currency`, `color`, `bill_day`, `last_updated`
- `transactions`: `id`, `user_id`, `type`, `date`, `amount`, `category`, `note`, `source_asset_id`, `source_asset_name`
- `categories`: `id`, `user_id`, `label`, `icon`, `color`, `keywords` (json/array)
- `automations`: `id`, `user_id`, `name`, `type`, `amount`, `currency`, `day_of_month`, `category`, `transaction_type`, `target_asset_id`, `source_asset_id`, `invest_asset_id`, `active`, `last_run`
- `system_logs`: `id`, `user_id`, `date`, `title`, `description`, `status`, `amount`

> 提醒：自動化執行目前仍為前端觸發的模擬流程，會將結果、交易與日志同步到 Supabase；未登入時則僅在前端暫存。
