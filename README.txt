今彩539 智慧分析系統 V4
======================

保留 V3 功能，新增 Pilio 開獎列表的後端同步、Netlify Blobs 持久化資料庫。
來源：https://www.pilio.idv.tw/lto539/list.asp （第三方，非台灣彩券官方）

重要：本版不能只用 Netlify Drop 拖曳資料夾發布！
因為需要 Netlify Functions 與 Blobs，必須由 Git repository 建置，或使用 Netlify CLI deploy --build。

推薦部署步驟（Windows）：
1. 解壓縮整個 539-dashboard-v4 資料夾。
2. 建立 GitHub repository，將資料夾內 index.html、539_history.csv、package.json、netlify.toml 和 netlify/ 資料夾全部上傳到 repository 根目錄。
3. 登入 app.netlify.com → 選原有網站 snazzy-pegasus-16cbfa → Site configuration → Build & deploy → Continuous deployment → Link repository（介面可能略有不同）。
4. 選擇 GitHub repository；建置設定使用 netlify.toml，建置指令可填 npm install，Publish directory 為 .。
5. 部署後到 https://你的網址/.netlify/functions/draws 檢查是否回傳 JSON 中 ok:true 與 data.draws。
6. 回到網站，按「同步 Pilio 開獎資料」，確認最新日期及同步時間。

定時任務：UTC 13:30（台灣時間 21:30），每天一次。網站開啟時也會向資料服務查詢，後端資料超過6小時會嘗試重新抓取。
同步只擷取來源網站列表頁可見的期數；歷史資料以原有內建紀錄補足，未經逐筆官方驗證。
來源網站若封鎖機器請求、改版、限制擷取，會顯示同步失敗，不能保證每日成功。
請先確認來源網站的自動擷取使用條件；如不允許，應改用取得授權的來源。

本版程式尚未在實際 Netlify 帳戶完成端到端測試。號碼統計不代表未來中獎機率。
