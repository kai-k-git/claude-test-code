# 📰 マイニュース (Web版)

Claude.ai Artifact上で **インストール不要** で直接動作するパーソナルニュース収集アプリ。

WPF版（`../NewsApp`）と同じ8カテゴリ・同じプロンプトをブラウザだけで実現します。

---

## 🚀 Claude.ai Artifactで動かす（最も簡単）

1. このディレクトリの **`NewsApp.tsx`** をすべてコピー
2. Claude.ai のチャット欄に下記のように依頼：

   ```
   このコードをそのままReact Artifactとして表示して：

   <ここに NewsApp.tsx の中身を貼り付け>
   ```

3. Claude が右側に Artifact プレビューを開きます
4. サイドバーでカテゴリを選び、**「更新」** ボタンをクリック

✅ **APIキー不要** — Artifact内蔵の `window.claude.complete()` で動作します
⚠️ ただしこのモードでは **Web検索が使えない** ため、最新情報ではなく学習データの範囲での回答になります

---

## 🌐 最新情報（Web検索）を使いたい場合

1. 設定画面（左下の ⚙ ボタン）を開く
2. **Anthropic APIキー** を入力（[コンソール](https://console.anthropic.com/) で取得）
3. **「Web検索を使用する」** にチェック
4. 「保存」→ 「更新」

これで Claude が `web_search` ツールで実際にネットを検索して最新情報を取得します。

> APIキーはお使いのブラウザの localStorage にのみ保存されます。サーバーには送信されません。

---

## 📦 ローカルで動かす（オプション）

Vite + React で起動する場合：

```bash
# 新規Viteプロジェクトを作成
npm create vite@latest news-app -- --template react-ts
cd news-app
npm install lucide-react

# NewsApp.tsx を src/App.tsx として配置
# tailwind を導入：
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# tailwind.config.js の content に './src/**/*.{ts,tsx}' を追加
# src/index.css に @tailwind base/components/utilities を追加

npm run dev
```

---

## ✨ 機能一覧

| 機能 | 説明 |
|------|------|
| 8カテゴリ | 天気・交通 / 地域 / イベント / テック / 旅行 / スポーツ / 国内株 / 米国株 |
| カテゴリ単位更新 | 各カテゴリの「更新」ボタン |
| 全カテゴリ一括更新 | サイドバー下の「全カテゴリ更新」 |
| ダークモード | サイドバー or 設定画面で切替 |
| カテゴリ並び替え | 設定画面の↑↓ボタン |
| カテゴリのON/OFF | 設定画面のチェックボックス |
| デフォルト復元 | 設定画面の「デフォルトに戻す」 |
| 状態表示 | サイドバーに更新中（スピナー）/ 完了（✓）/ エラー（赤丸）を表示 |
| マークダウン整形 | 見出し・リスト・表・太字・コードを綺麗にレンダリング |

---

## 🧩 カテゴリのカスタマイズ

`NewsApp.tsx` 冒頭の `DEFAULT_CATEGORIES` 配列を編集するだけ。

```ts
{
  id: 'my-category',           // 一意なID
  name: 'カテゴリ名',
  icon: '🔍',                  // 絵文字
  description: 'サイドバーに表示する説明',
  enabled: true,
  order: 8,
  prompt: 'Claudeへの質問文（{today} で今日の日付を埋め込み可能）',
}
```

---

## 🔧 技術スタック

- **React 18** + TypeScript
- **Tailwind CSS**（Claude Artifact組み込み）
- **lucide-react**（アイコン）
- **Anthropic API**（直接呼び出し / Web検索ツール対応）
- **window.claude.complete()**（Artifact用フォールバック）
- **localStorage**（設定永続化）
- **外部依存ゼロのマークダウンレンダラー**（軽量実装）
