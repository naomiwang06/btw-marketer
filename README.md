# 不務正業行銷人

Naomi 放「工作以外作品」的個人網站：好玩的影片 / 圖片卡片牆，加上工具與提示詞分享。
純靜態網站（HTML + CSS + JS），沒有任何需要安裝或編譯的東西，部署在 GitHub Pages。

> **最重要的一件事：之後要改內容，只要改 `content.json` 這一個檔案，不用碰程式。**

---

## 一、第一次上線（只做一次）

1. 把這個專案推到你的 GitHub 儲存庫（repo）的 `main` 分支。
2. 到 GitHub 的 repo → **Settings → Pages** → **Build and deployment** 的 **Source** 選 **GitHub Actions**。
3. 之後每次 `main` 有更新，GitHub Actions 會自動檢查並部署，約 1 分鐘後生效。
   進度可以在 repo 的 **Actions** 分頁看到，網址在 Settings → Pages 最上方
   （通常是 `https://你的帳號.github.io/repo名稱/`）。

> 如果 Actions 顯示綠勾勾但網站沒更新，按 `Ctrl/Cmd + Shift + R` 強制重新整理。

## 二、怎麼改內容

在 GitHub 網頁上直接改就可以：打開 `content.json` → 右上角鉛筆圖示 ✏️ → 修改 → **Commit changes**。
（用 Pull Request 的話，合併進 `main` 後才會上線。）

### JSON 的小規則
- 每一筆資料都是 `{ ... }`，筆與筆之間要有**逗號**，但**最後一筆後面不能有逗號**。
- 文字一定要用**半形雙引號** `"..."`。
- 文字裡想換行，寫 `\n`；想出現雙引號，寫 `\"`。
- 寫壞了也不用怕：部署前會自動檢查，有錯會停在 Actions 並告訴你哪裡有問題，**不會把壞掉的網站放上去**。
- 也可以在電腦上先檢查：`node scripts/validate.mjs`

### 換首屏文字（網站名稱、自介）
```json
"hero": {
  "kicker": "BTW. by the way",
  "titleLines": ["不務正業", "行銷人"],
  "intro": "白天幫品牌想文案，下班幫自己亂搞——這裡是我不務正業的成果展。",
  "byline": "Naomi｜台灣自由接案行銷人"
}
```
- `intro` 就是那句**俏皮自介，目前是佔位文字，請改成你自己的**。
- `titleLines` 是標題，每個項目是一行（建議最多 2 行、每行 4～5 個字，手機版才不會爆）。

### 新增一個影片／好玩的東西
在 `works.items` 裡新增一筆。**只要貼網址，網站會自動判斷類型**：

| 你要放什麼 | 怎麼寫 |
|---|---|
| YouTube 影片 / Shorts | `"url": "https://www.youtube.com/watch?v=xxxx"`（`youtu.be/xxx`、`/shorts/xxx` 也可以） |
| Instagram 貼文 / Reels | `"url": "https://www.instagram.com/p/xxxx/"` 或 `/reel/xxxx/` |
| Threads 貼文 | `"url": "https://www.threads.com/@帳號/post/xxxx"` |
| 圖片 | 把圖放進 `assets/img/`，寫 `"image": "assets/img/檔名.jpg"`，建議加 `"alt"`（圖片說明） |
| 其他網頁 | 隨便貼網址，會變成連結卡片 |

完整範例：
```json
{
  "title": "這支影片的標題",
  "note": "一句話說明。",
  "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  "tags": ["影片", "搞笑"]
}
```

可選欄位：
- `tags`：小標籤，可以放多個。
- `cover`：自訂封面圖（YouTube / IG / Threads 點開前顯示的圖）。YouTube 預設會用影片縮圖。
- `ratio`：圖片卡片的比例，例如 `"4/5"`、`"1/1"`、`"16/9"`（想裁成固定比例才需要）。
- `linkLabel`：連結卡片上按鈕的文字。
- `embedHeight`：IG / Threads 嵌入的高度（像素），貼文被切到時調整，例如 `640`。
- `hidden`: `true`：先藏起來不顯示（做草稿用）。想發佈就改成 `false` 或整行刪掉。

卡片會依照檔案裡的順序顯示，**想讓新作品排最前面，就放在 `items` 最上面**。

> 影片與貼文都是「點一下才載入」，所以手機版不會一進頁面就卡住。
> IG / Threads 若是私人帳號或貼文已刪除，嵌入會顯示不出來，卡片上的「在 ○○ 開啟」連結仍然可以用。

### 新增工具
在 `tools.tools` 新增：
```json
{ "name": "工具名稱", "emoji": "🧰", "note": "一句話說明", "url": "https://...", "tag": "設計" }
```

### 新增提示詞
在 `tools.prompts` 新增（訪客可以一鍵複製）：
```json
{
  "title": "提示詞名稱",
  "note": "這個提示詞拿來做什麼",
  "tag": "文案",
  "prompt": "第一行\n第二行\n用 [方括號] 標出要讓人替換的地方"
}
```

### 換頁尾社群連結
`footer.socials` 裡把 `url` 換成你自己的網址就好，不想放的就整筆刪掉，也可以新增：
```json
{ "label": "Instagram", "icon": "📸", "url": "https://www.instagram.com/你的帳號" }
```
（`mailto:你的信箱` 可以做成寄信按鈕。目前的網址都是**佔位用**，記得換掉。）

### 換上方選單、各區塊標題
`nav` 是頁首選單，`works.title` / `tools.title` 等是各區塊的標題和說明，都在同一個檔案裡改。

## 三、其他想改的地方

| 想改什麼 | 去哪裡改 |
|---|---|
| 網站標題、搜尋結果的說明 | `content.json` 的 `site` |
| 分享到 FB / Threads / LINE 時的預覽圖與標題 | `index.html` 的 `og:` 開頭那幾行；預覽圖是 `assets/img/og.jpg`（建議 1200×630） |
| Logo、分頁小圖示 | 換掉 `assets/img/logo.webp`、`assets/img/favicon.png`（檔名保持一樣） |
| 顏色 | `assets/style.css` 最上面的 `--navy` / `--yellow` / `--cream`；背景切換的顏色在 `assets/main.js` 的 `THEMES` |
| 字體 | 預設用 Google Fonts 的「Huninn 粉圓」(標題) 與「Noto Sans TC」(內文)，在 `index.html` 的 `<link>` 與 `style.css` 的 `--font-*` |

## 四、在自己電腦預覽（選用）

因為網站會用 `fetch` 讀 `content.json`，**直接雙擊 `index.html` 會讀不到內容**，請用本機伺服器：

```bash
python3 -m http.server 8000
# 然後開 http://localhost:8000
```

## 五、專案結構

```
├── index.html            頁面骨架
├── content.json          ★ 所有內容都在這裡
├── assets/
│   ├── style.css         樣式
│   ├── main.js           讀取 content.json、產生頁面、GSAP 動態
│   ├── img/              logo 與你放的圖片
│   └── vendor/           GSAP 3.13 與 ScrollTrigger（已放在專案內，不依賴 CDN）
├── scripts/validate.mjs  檢查 content.json 的小工具
└── .github/workflows/    deploy.yml（自動部署）、check.yml（PR 時自動檢查）
```

### 動態效果

| 效果 | 實作 |
|---|---|
| 首屏標題逐字 text reveal | `main.js` 的 `initMotion()`，逐字遮罩 + GSAP timeline |
| 卡片 stagger 淡入 | `ScrollTrigger.batch()`，同時進入畫面的卡片會依序浮現 |
| 區塊切換背景色漸變 | 每個 `<section data-theme="…">` 進入畫面中線時，GSAP 補間 `<html>` 的背景與文字色 |
| 頁首 hide-on-scroll | 往下滑隱藏、往上滑出現（ScrollTrigger 的 `direction`） |
| 手機最佳化 | 只動 `transform` / `opacity`；`ignoreMobileResize` 避免網址列伸縮時抖動；影片貼文點擊才載入 |
| 無障礙 | 系統設定「減少動態效果」時，所有動畫關閉（內容直接顯示）；標題逐字拆開時保留完整的 aria-label |

## 授權與第三方

- GSAP 為 GreenSock 的 [Standard "no charge" license](https://gsap.com/standard-license/)，已內附於 `assets/vendor/`。
- 範例圖片（`sample-*.svg`）為自製，可隨意刪除，記得同時刪掉 `content.json` 裡引用它們的卡片。
