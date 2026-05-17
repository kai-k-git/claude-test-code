# 📰 マイニュース — パーソナルニュース収集アプリ

Claude APIを活用したC# WPFデスクトップアプリ。自分が興味を持つ情報をカテゴリ別に収集・表示します。

---

## 機能概要

### 必須機能
- **カテゴリ別情報収集** — Claude AIがWeb検索で最新情報を取得・要約
- **マークダウン表示** — 見やすい整形済みレイアウト
- **手動更新** — カテゴリ単位 / 全カテゴリ一括更新
- **設定管理** — APIキー・モデル選択・カテゴリの有効化/並び替え

### 便利機能
- **ダークモード切替** — サイドバーのトグルで即座に切替
- **カテゴリ並び替え** — 設定画面でボタン操作（↑↓）で並び替え
- **エラー表示** — API接続失敗時にわかりやすいメッセージ
- **最終更新時刻** — サイドバーに各カテゴリの更新時刻を表示

---

## 収集カテゴリ

| カテゴリ | 収集内容 |
|---------|---------|
| 🌤️ 天気・交通 | 藤沢市・戸塚区の天気、小田急線の遅延、六会日大前の時刻表 |
| 🏠 地域・生活 | 藤沢市の明日のごみ収集情報・分別方法 |
| 🎉 イベント | 神奈川・東京の20〜30代向け週末イベント10件 |
| 💻 テクノロジー | 最新ガジェット・ツール・アプリのニュース |
| ✈️ 旅行・お得情報 | ANAセール航空券、季節のおすすめ旅行先、旅行割引情報 |
| ⚾ スポーツ | 大谷翔平の成績、中日ドラゴンズの勝敗・順位 |
| 📈 国内株式 | 日本の時価総額TOP10 + 変動率が大きかった銘柄10選 |
| 🗽 米国株式 | 米国の時価総額TOP10 + 変動率が大きかった銘柄10選 |

---

## セットアップ

### 動作環境
- Windows 10/11
- .NET 8 SDK（https://dotnet.microsoft.com/download/dotnet/8.0）
- Claude APIキー（https://console.anthropic.com/）

### ビルド・起動

```bash
cd NewsApp
dotnet build
dotnet run
```

### 初回設定

1. アプリ起動後、左下の「⚙ 設定」をクリック
2. Claude APIキーを入力
3. 使用モデルを選択（推奨：`claude-opus-4-5`）
4. 「Web検索を使用する」にチェックを入れる
5. 「保存」をクリック
6. サイドバーでカテゴリを選択し「更新」ボタンを押す

---

## モデル選択ガイド

| モデル | 特徴 | 推奨用途 |
|-------|------|---------|
| `claude-opus-4-5` | 高精度・詳細な分析 | 株価・スポーツなど詳細が必要なカテゴリ |
| `claude-sonnet-4-5` | バランス型 | 日常的な利用全般 |
| `claude-haiku-4-5` | 高速・低コスト | 天気・交通など速報性重視 |

---

## プロジェクト構成

```
NewsApp/
├── Models/
│   ├── Category.cs           # カテゴリ定義 + デフォルトプロンプト
│   └── AppSettings.cs        # 設定の読み書き
├── ViewModels/
│   ├── MainViewModel.cs      # メイン画面のロジック
│   └── CategoryViewModel.cs  # カテゴリ単位のデータ管理
├── Services/
│   ├── ClaudeService.cs      # Claude API + Web検索
│   └── MarkdownRenderer.cs   # マークダウン→WPF FlowDocument変換
├── Views/
│   └── SettingsWindow.xaml   # 設定ダイアログ
├── Converters/
│   └── Converters.cs         # WPFバインディング用コンバーター
├── MainWindow.xaml           # メインUI
└── App.xaml                  # アプリリソース・テーマ
```

---

## カスタマイズ — カテゴリの追加

`Models/Category.cs` の `GetDefaults()` に追加するだけ：

```csharp
new()
{
    Id = "my-category",      // 一意なID
    Name = "カテゴリ名",
    Icon = "🔍",
    Description = "サイドバーに表示される説明",
    Prompt = "Claudeへの質問文（{today}で今日の日付を埋め込み可能）"
}
```

設定画面でカテゴリの有効/無効・並び順を変更できます。

---

## 技術スタック

- **言語**: C# 12 / .NET 8
- **UI**: WPF + ModernWpfUI（Fluent Design）
- **MVVM**: CommunityToolkit.Mvvm
- **AI**: Claude API（Anthropic）+ Web Search Tool
- **設定保存**: JSON（`%AppData%\NewsApp\settings.json`）
