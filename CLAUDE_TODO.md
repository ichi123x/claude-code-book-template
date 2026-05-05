---
description: タスク管理アプリのAPI・データモデル・フロントエンド状態・tt CLI。server.js / todo.html / tt.js を編集するときに参照する。
globs:
  - "server.js"
  - "todo.html"
  - "tasks.db"
  - "tt.js"
alwaysApply: false
---

# タスク管理アプリ

## ファイル

- `todo.html` — React（UMD + Babel standalone）によるフロントエンド、ビルド不要
- `server.js` — Express + better-sqlite3 による REST API サーバー
- `tt.js` — CLI ツール（`tt` コマンド）、better-sqlite3 に直接アクセス
- `tasks.db` — SQLite データベース（自動生成、server.js と tt.js で共有）

## 起動

```bash
node server.js        # localhost:3000
# アクセス: http://localhost:3000/todo.html
```

## tt CLI

```bash
npm link                                      # 初回のみ（tt コマンドを登録）
tt add "タスク名" [-p high|medium|low] [-d YYYY-MM-DD]
tt next   # スコア最上位のタスクを1件表示
tt done   # next タスクを完了し、次のタスクを提示
tt ls     # 未完了タスクをスコア順に一覧表示
```

**スコアリングルール**

| 要素 | ルール |
|------|--------|
| 優先度 | high=100 / medium=50 / low=10 |
| 経過日数 | +2/日 |
| 締め切り | 3日以内=+50 / 超過=+200 |

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/tasks` | タスク一覧（作成日降順） |
| POST | `/api/tasks` | タスク追加（`{ text, priority }`） |
| PATCH | `/api/tasks/:id` | 部分更新（`done` / `text` / `priority`） |
| DELETE | `/api/tasks/:id` | タスク削除 |

## データモデル

```sql
tasks(id, text, done, priority, created_at)
-- priority: 'high' | 'medium' | 'low'  DEFAULT 'medium'
```

## フロントエンドの状態

- `tasks` — サーバーから取得したタスク配列
- `filter` — 完了状態フィルター（'すべて' / '未完了' / '完了'）
- `priorityFilter` — 優先度フィルター（'all' / 'high' / 'medium' / 'low'）
- `editingId` — インライン編集中のタスク ID（ダブルクリックで起動）

## 優先度

バッジをクリックすると `high → medium → low → high` でサイクル。
フィルターバーで優先度別に絞り込み可能（完了状態フィルターと組み合わせ可）。
