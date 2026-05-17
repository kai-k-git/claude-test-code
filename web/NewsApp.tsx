import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RefreshCw, Settings, Sun, Moon, AlertCircle, Loader2,
  ChevronUp, ChevronDown, X, Key, Search, Check, Newspaper,
  Plus, Trash2, Eye, EyeOff, Save as SaveIcon, ExternalLink,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
  enabled: boolean;
  order: number;
}

interface AppSettings {
  apiKey: string;
  model: string;
  useWebSearch: boolean;
  darkMode: boolean;
  categories: Category[];
}

interface CategoryState {
  loading: boolean;
  content: string;
  error: string;
  lastUpdated: string;
}

declare global {
  interface Window {
    claude?: {
      complete: (prompt: string) => Promise<string>;
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Default Categories (same as WPF version)
// ─────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'weather-transport',
    name: '天気・交通',
    icon: '🌤️',
    description: '藤沢・戸塚の天気と小田急線情報',
    enabled: true,
    order: 0,
    prompt: `今日の以下の情報を日本語で提供してください。今日の日付（{today}）を明示してください。

## 1. 藤沢市の天気（今日・明日）
気温（最高・最低）、降水確率、天気の概要、服装のアドバイス

## 2. 横浜市戸塚区の天気（今日・明日）
気温（最高・最低）、降水確率、天気の概要、傘が必要かどうか

## 3. 小田急線の運行状況
現在の遅延・運休情報。問題がなければ「平常運転」と明記。

## 4. 六会日大前駅（相模大野方面）の時刻表
現在時刻の前後1時間の出発時刻を一覧で。急行・各停の区別も記載。

専門用語を避け、誰でもわかりやすい表現で説明してください。`,
  },
  {
    id: 'local-life',
    name: '地域・生活',
    icon: '🏠',
    description: '藤沢市のごみ収集情報',
    enabled: true,
    order: 1,
    prompt: `藤沢市の明日（{today}の翌日）のごみ収集情報を教えてください。

## 明日出せるごみの種類
- 地区・収集区域ごとのごみの種類
- 特別回収（粗大ごみ等）の情報
- 出し忘れやすいポイントや注意事項

## 分別のポイント
初めて藤沢市に住んだ人でもわかるよう、各ごみの具体的な分別方法を簡潔に。

情報源（藤沢市公式サイト等）も明記してください。`,
  },
  {
    id: 'events',
    name: 'イベント',
    icon: '🎉',
    description: '神奈川・東京の週末イベント',
    enabled: true,
    order: 2,
    prompt: `神奈川県・東京都で今後1週間以内（{today}から1週間）に開催される、20〜30代が楽しめるイベントを10件程度紹介してください。

各イベントについて以下の形式で：

**イベント名**
- 日時：
- 場所：（アクセスも簡単に）
- 料金：
- こんな人におすすめ：
- 一言説明：

ジャンルが偏らないよう、音楽・アート・グルメ・アウトドア・ワークショップ・地域祭から幅広く選んでください。
無料または低価格のものを優先的に。`,
  },
  {
    id: 'tech-gadget',
    name: 'テクノロジー',
    icon: '💻',
    description: '最新ガジェット・ツールのニュース',
    enabled: true,
    order: 3,
    prompt: `最新の便利なガジェット・ツール・アプリのニュースを7〜10件紹介してください。

各ニュースについて以下の形式で：

**製品・サービス名**
- カテゴリ：（スマートフォン/PC周辺機器/アプリ/AI/家電 等）
- 何ができる：（一般の人が理解できる言葉で）
- どんな人に便利：
- 価格・入手方法：（わかれば）
- 注目ポイント：

専門家でなくても「これは便利そう！」と思えるような説明を心がけてください。
日本で入手・利用できるものを優先してください。`,
  },
  {
    id: 'travel-deals',
    name: '旅行・お得情報',
    icon: '✈️',
    description: '国内旅行のお得情報',
    enabled: true,
    order: 4,
    prompt: `国内旅行のお得情報を教えてください。今日は{today}です。

## ANAのお得な航空券情報
現在販売中のセール・割引航空券。出発地（羽田・成田・横浜近辺）から行けるお得な路線。

## 季節のおすすめ旅行先（今の時期）
今の時期に行くと特に良い国内旅行先を3〜5箇所。
- おすすめ理由（見どころ・食べ物・気候）
- 予算の目安
- 神奈川からのアクセス

## 旅行のお得テクニック
今知っておくべき旅行割引・キャンペーン・予約のコツ。

旅行経験が少ない人でもわかりやすい説明で。`,
  },
  {
    id: 'sports',
    name: 'スポーツ',
    icon: '⚾',
    description: '大谷翔平・中日ドラゴンズの最新情報',
    enabled: true,
    order: 5,
    prompt: `以下のスポーツ情報を最新情報で教えてください（今日の日付：{today}）。

## 大谷翔平 最新情報
- 今日または最新の試合結果
- 打撃成績：打率、本塁打、打点、出塁率
- 投球成績（登板した場合）：勝敗、防御率、奪三振
- 今シーズンの累計成績
- 特筆すべき活躍やニュース

## 中日ドラゴンズ 最新情報
- 最新の試合結果（対戦相手、スコア、勝敗投手）
- 現在のシーズン成績（勝敗、勝率）
- セ・リーグ順位表
- 注目選手の活躍

野球を詳しく知らない人でも楽しめるよう、成績の意味を簡単に補足説明してください。
例：「打率.300」→「10回打席に立ったら3回ヒットを打つペース（かなり優秀）」`,
  },
  {
    id: 'japan-stocks',
    name: '国内株式',
    icon: '📈',
    description: '日本株の時価総額上位と注目銘柄',
    enabled: true,
    order: 6,
    prompt: `今日（{today}）の日本株式市場の情報を教えてください。

## 日本 時価総額トップ10の株価変動
表形式で：企業名 | 株価 | 前日比 | 変動率(%) | 時価総額

## 今日の注目銘柄 10選（変動率が大きかった銘柄）
各銘柄について：

**企業名（証券コード）**
- 本日の株価変動：○円（+/-○%）
- 事業内容：（中学生でもわかる言葉で）
- 技術的な強み・競争優位性：
- 株価が動いた主な理由：
- 投資初心者へのひとこと：

## 本日の市場サマリー
- 日経平均の動き
- 市場全体のムード（好調/軟調の理由）

「株価が上がるとはどういうことか」がわかるよう、初心者向けの補足も適宜入れてください。`,
  },
  {
    id: 'us-stocks',
    name: '米国株式',
    icon: '🗽',
    description: '米国株の時価総額上位と注目銘柄',
    enabled: true,
    order: 7,
    prompt: `今日（{today}）の米国株式市場の情報を日本語で教えてください。

## 米国 時価総額トップ10の株価変動
表形式で：企業名 | 株価(USD) | 前日比 | 変動率(%) | 日本円換算目安

## 今日の注目銘柄 10選（変動率が大きかった銘柄）
各銘柄について：

**企業名（ティッカーシンボル）**
- 本日の株価変動：$○（+/-○%）
- 日本でも知られているか（知名度）：
- 事業内容：（中学生でもわかる言葉で）
- 技術的な強み・競争優位性：
- 株価が動いた主な理由：
- 日本株との関連性（もしあれば）：

## 本日の市場サマリー
- ダウ平均・ナスダック・S&P500の動き
- 市場全体のムードと主なニュース
- 為替（円ドル）の動向

すべて日本語で回答してください。`,
  },
];

const STORAGE_KEY = 'news-app-settings-v1';

// ─────────────────────────────────────────────────────────────
// Markdown Renderer (lightweight, no external deps)
// ─────────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    const candidates = [
      boldMatch && { type: 'bold', idx: boldMatch.index!, full: boldMatch[0], text: boldMatch[1] },
      codeMatch && { type: 'code', idx: codeMatch.index!, full: codeMatch[0], text: codeMatch[1] },
      linkMatch && { type: 'link', idx: linkMatch.index!, full: linkMatch[0], text: linkMatch[1], url: (linkMatch as any)[2] },
    ].filter(Boolean) as Array<{ type: string; idx: number; full: string; text: string; url?: string }>;

    if (candidates.length === 0) {
      nodes.push(<span key={key++}>{remaining}</span>);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const first = candidates[0];

    if (first.idx > 0) {
      nodes.push(<span key={key++}>{remaining.slice(0, first.idx)}</span>);
    }

    if (first.type === 'bold') {
      nodes.push(
        <strong key={key++} className="font-semibold text-amber-700 dark:text-amber-300">
          {first.text}
        </strong>
      );
    } else if (first.type === 'code') {
      nodes.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[0.85em]">
          {first.text}
        </code>
      );
    } else if (first.type === 'link') {
      nodes.push(
        <a
          key={key++}
          href={first.url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
        >
          {first.text}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }

    remaining = remaining.slice(first.idx + first.full.length);
  }

  return nodes;
}

function MarkdownView({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split('\n');
    const out: React.ReactNode[] = [];
    let para: string[] = [];
    let tableRows: string[][] = [];
    let inTable = false;

    const flushPara = () => {
      if (para.length > 0) {
        out.push(
          <p key={`p-${out.length}`} className="my-2 leading-relaxed">
            {para.map((l, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {renderInline(l)}
              </React.Fragment>
            ))}
          </p>
        );
        para = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const [header, ...rest] = tableRows;
        out.push(
          <div key={`tbl-${out.length}`} className="my-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  {header.map((cell, i) => (
                    <th
                      key={i}
                      className="text-left px-3 py-2 border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rest.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (const raw of lines) {
      const line = raw.trimEnd();

      // Table detection
      if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
        flushPara();
        // skip separator row like |---|---|
        if (line.replace(/\|/g, '').replace(/-/g, '').replace(/:/g, '').trim() === '') {
          inTable = true;
          continue;
        }
        const cells = line.slice(1, -1).split('|').map((c) => c.trim());
        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith('## ')) {
        flushPara();
        out.push(
          <h2
            key={`h2-${out.length}`}
            className="text-lg font-bold mt-6 mb-2 pb-1 border-b border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
          >
            {renderInline(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushPara();
        out.push(
          <h3 key={`h3-${out.length}`} className="text-base font-semibold mt-4 mb-1 text-blue-600 dark:text-blue-300">
            {renderInline(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        flushPara();
        out.push(
          <h4 key={`h4-${out.length}`} className="text-sm font-semibold mt-3 mb-1">
            {renderInline(line.slice(5))}
          </h4>
        );
      } else if (line.startsWith('# ')) {
        flushPara();
        out.push(
          <h1 key={`h1-${out.length}`} className="text-xl font-bold mt-6 mb-2">
            {renderInline(line.slice(2))}
          </h1>
        );
      } else if (/^(\s*)[-*] /.test(line)) {
        flushPara();
        const m = line.match(/^(\s*)[-*] (.*)/)!;
        const indent = m[1].length;
        out.push(
          <div
            key={`li-${out.length}`}
            className="flex gap-2 my-0.5"
            style={{ marginLeft: `${indent * 8 + 8}px` }}
          >
            <span className="text-blue-500 dark:text-blue-400 select-none">•</span>
            <span className="flex-1">{renderInline(m[2])}</span>
          </div>
        );
      } else if (/^\d+\. /.test(line)) {
        flushPara();
        const m = line.match(/^(\d+)\. (.*)/)!;
        out.push(
          <div key={`ol-${out.length}`} className="flex gap-2 my-0.5 ml-2">
            <span className="font-semibold text-blue-600 dark:text-blue-400 select-none">{m[1]}.</span>
            <span className="flex-1">{renderInline(m[2])}</span>
          </div>
        );
      } else if (line.trim() === '') {
        flushPara();
      } else {
        para.push(line);
      }
    }

    flushTable();
    flushPara();
    return out;
  }, [text]);

  return <div className="text-[15px] text-slate-800 dark:text-slate-100">{blocks}</div>;
}

// ─────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────
function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppSettings;
      // Re-merge default prompts in case they were updated
      const cats = parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES;
      return { ...defaultSettings(), ...parsed, categories: cats };
    }
  } catch {}
  return defaultSettings();
}

function defaultSettings(): AppSettings {
  return {
    apiKey: '',
    model: 'claude-opus-4-5',
    useWebSearch: true,
    darkMode: false,
    categories: DEFAULT_CATEGORIES,
  };
}

function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// Claude API
// ─────────────────────────────────────────────────────────────
async function fetchFromClaude(
  prompt: string,
  settings: AppSettings,
  signal?: AbortSignal
): Promise<string> {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const resolved = prompt.replace(/\{today\}/g, today);

  // Path A: Direct Anthropic API (if user provided key) — supports web_search
  if (settings.apiKey) {
    const body: any = {
      model: settings.model,
      max_tokens: 4096,
      system:
        'あなたは日本語で情報を提供するニュースアシスタントです。マークダウン形式で見やすく整理し、専門用語は平易な補足説明と共に使ってください。',
      messages: [{ role: 'user', content: resolved }],
    };
    if (settings.useWebSearch) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    if (settings.useWebSearch) headers['anthropic-beta'] = 'web-search-2025-03-05';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || `APIエラー (${res.status})`);
    }
    const text = (data.content || [])
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n');
    return text || '（応答が空でした）';
  }

  // Path B: window.claude.complete() — no setup needed, no web search
  if (typeof window !== 'undefined' && window.claude?.complete) {
    const augmented = `${resolved}\n\n（注：Web検索は利用できません。学習データの範囲で、今の時期に該当しそうな一般的な情報を提供してください。具体的な日付の最新情報が必要な項目は「最新情報を取得するには設定からAPIキーを登録してください」と案内してください。）`;
    return await window.claude.complete(augmented);
  }

  throw new Error(
    'Claude APIが利用できません。Claude.ai Artifact上で実行するか、設定画面でAPIキーを登録してください。'
  );
}

// ─────────────────────────────────────────────────────────────
// Settings Modal
// ─────────────────────────────────────────────────────────────
function SettingsModal({
  initial,
  onClose,
  onSave,
}: {
  initial: AppSettings;
  onClose: () => void;
  onSave: (s: AppSettings) => void;
}) {
  const [draft, setDraft] = useState<AppSettings>(() => ({
    ...initial,
    categories: initial.categories.map((c) => ({ ...c })),
  }));
  const [showKey, setShowKey] = useState(false);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...draft.categories];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((c, i) => (c.order = i));
    setDraft({ ...draft, categories: next });
  };

  const toggleEnabled = (id: string) => {
    setDraft({
      ...draft,
      categories: draft.categories.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  const resetCategories = () => {
    if (confirm('カテゴリをデフォルトに戻しますか？プロンプトのカスタマイズは失われます。')) {
      setDraft({ ...draft, categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">設定</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Claude APIキー（オプション）
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              未入力でも動作します（Claude.ai内蔵モデル使用）。
              <br />
              APIキーを入れると <strong>Web検索による最新情報取得</strong> が可能になります。
              キーは
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline mx-1"
              >
                Anthropic Console
              </a>
              で取得できます。ブラウザのlocalStorageに保存されます。
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-semibold mb-2">使用モデル</label>
            <select
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
            >
              <option value="claude-opus-4-5">claude-opus-4-5（高精度・遅い）</option>
              <option value="claude-sonnet-4-5">claude-sonnet-4-5（バランス型）</option>
              <option value="claude-haiku-4-5">claude-haiku-4-5（高速・低コスト）</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              APIキーを使う場合のみ有効。
            </p>
          </div>

          {/* Web Search */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.useWebSearch}
              onChange={(e) => setDraft({ ...draft, useWebSearch: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600"
            />
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                Web検索を使用する
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                APIキー利用時に最新情報を取得（OFFだと学習データのみ）。
              </p>
            </div>
          </label>

          {/* Dark mode */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.darkMode}
              onChange={(e) => setDraft({ ...draft, darkMode: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="font-semibold text-sm">ダークモード</span>
          </label>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">表示カテゴリ</label>
              <button
                onClick={resetCategories}
                className="text-xs text-slate-500 hover:text-red-500 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                デフォルトに戻す
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              チェックで表示／非表示。矢印で並び替え。
            </p>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-200 dark:divide-slate-700">
              {draft.categories.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    onChange={() => toggleEnabled(c.id)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-lg">{c.icon}</span>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === draft.categories.length - 1}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1.5"
          >
            <SaveIcon className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
export default function NewsApp() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [states, setStates] = useState<Record<string, CategoryState>>({});
  const [selectedId, setSelectedId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [globalRefreshing, setGlobalRefreshing] = useState(false);
  const abortsRef = useRef<Record<string, AbortController>>({});

  const visibleCategories = useMemo(
    () => settings.categories.filter((c) => c.enabled).sort((a, b) => a.order - b.order),
    [settings.categories]
  );

  // Initial selection
  useEffect(() => {
    if (!selectedId && visibleCategories.length > 0) {
      setSelectedId(visibleCategories[0].id);
    } else if (selectedId && !visibleCategories.find((c) => c.id === selectedId)) {
      setSelectedId(visibleCategories[0]?.id || '');
    }
  }, [visibleCategories, selectedId]);

  // Persist
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Apply dark class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings.darkMode]);

  const setCategoryState = (id: string, patch: Partial<CategoryState>) => {
    setStates((prev) => ({
      ...prev,
      [id]: { loading: false, content: '', error: '', lastUpdated: '', ...prev[id], ...patch },
    }));
  };

  const refreshCategory = async (cat: Category) => {
    abortsRef.current[cat.id]?.abort();
    const ac = new AbortController();
    abortsRef.current[cat.id] = ac;

    setCategoryState(cat.id, { loading: true, error: '' });
    try {
      const content = await fetchFromClaude(cat.prompt, settings, ac.signal);
      setCategoryState(cat.id, {
        loading: false,
        content,
        error: '',
        lastUpdated: new Date().toLocaleString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setCategoryState(cat.id, {
        loading: false,
        error: e?.message || String(e),
      });
    }
  };

  const refreshAll = async () => {
    setGlobalRefreshing(true);
    for (const cat of visibleCategories) {
      await refreshCategory(cat);
    }
    setGlobalRefreshing(false);
  };

  const selected = visibleCategories.find((c) => c.id === selectedId);
  const selectedState = selected ? states[selected.id] : undefined;

  return (
    <div className={settings.darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h1 className="font-bold text-lg">マイニュース</h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {settings.apiKey ? '🔍 Web検索モード' : '⚡ クイックモード'}
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {visibleCategories.map((cat) => {
              const st = states[cat.id];
              const isSelected = cat.id === selectedId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedId(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{cat.name}</div>
                    {st?.lastUpdated && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {st.lastUpdated} 更新
                      </div>
                    )}
                  </div>
                  {st?.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                  ) : st?.error ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  ) : st?.content ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={refreshAll}
              disabled={globalRefreshing}
              className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5"
            >
              {globalRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              全カテゴリ更新
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm inline-flex items-center justify-center gap-1"
              >
                {settings.darkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5" /> Light
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm inline-flex items-center justify-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                設定
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Header */}
              <header className="px-7 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selected.icon}</span>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selected.description}
                  </p>
                </div>
                <button
                  onClick={() => refreshCategory(selected)}
                  disabled={selectedState?.loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm inline-flex items-center gap-1.5"
                >
                  {selectedState?.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  更新
                </button>
              </header>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-7 py-6">
                {selectedState?.loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                    <p className="text-base">Claudeが情報を収集中です...</p>
                    {settings.apiKey && settings.useWebSearch && (
                      <p className="text-xs mt-1.5">Web検索を実行中。少しお待ちください。</p>
                    )}
                  </div>
                ) : selectedState?.error ? (
                  <div className="max-w-2xl mx-auto rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                          エラーが発生しました
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-200 break-all">
                          {selectedState.error}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-3 opacity-80">
                          ヒント：設定でAPIキーの確認、または Claude.ai Artifact 内で実行しているか確認してください。
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedState?.content ? (
                  <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
                    <MarkdownView text={selectedState.content} />
                  </article>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-base mb-1">まだ情報を取得していません</p>
                    <p className="text-sm">「更新」ボタンを押して情報を取得してください</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Newspaper className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-base mb-1">表示するカテゴリがありません</p>
              <button
                onClick={() => setShowSettings(true)}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                設定を開く
              </button>
            </div>
          )}
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            initial={settings}
            onClose={() => setShowSettings(false)}
            onSave={(s) => {
              setSettings(s);
              setShowSettings(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
