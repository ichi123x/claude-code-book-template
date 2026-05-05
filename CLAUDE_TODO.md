---
description: タスク管理アプリのAPI・データモデル・フロントエンド状態。server.js または todo.html を編集するときに参照する。
globs:
  - "server.js"
  - "todo.html"
  - "tasks.db"
alwaysApply: false
---

# タスク管理アプリ

## ファイル

- `todo.html` — React（UMD + Babel standalone）によるフロントエンド、ビルド不要
- `server.js` — Express + better-sqlite3 による REST API サーバー
- `tasks.db` — SQLite データベース（自動生成）

## 起動

```bash
node server.js        # localhost:3000
# アクセス: http://localhost:3000/todo.html
```

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
