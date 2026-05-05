---
description: ブロック崩しゲームのアーキテクチャと仕様。index.html または main.js を編集するときに参照する。
globs:
  - "index.html"
  - "main.js"
alwaysApply: false
---

# ブロック崩しゲーム

## ファイル

- `index.html` — canvas 要素とゲームの HTML
- `main.js` — 全ゲームロジック（単一モジュール、外部依存なし）

## 起動

```bash
npx serve .
# または
node server.js  # todo アプリと同居、localhost:3000
```

## アーキテクチャ

**ステートマシン** — `state` 変数がゲームループを制御:
- `idle` → `playing`（スペース/クリック）
- `playing` → `cleared`（全ブロック破壊）または `gameover`（ライフ消耗）
- `cleared` → `playing`（`nextLevel()` で次レベルへ）
- `gameover` → `playing`（`startGame()` でリスタート）

**ゲームループ** — `loop()` が `requestAnimationFrame` を毎フレーム呼び出し、`update()`（物理・衝突）→ `draw()`（canvas 描画）の順で実行。

**衝突判定** — ブロック衝突は AABB オーバーラップ比較（`overlapLeft/Right/Top/Bottom`）で反射軸を決定。パドル衝突はパドル中心からのヒット位置で角度を計算。

**レベル進行** — ボール速度はレベルに応じて増加: `3.5 + (level - 1) * 0.4`。ブロック配置は毎レベルリセット、スコアとライフは引き継ぎ。

**入力** — キーボード（`ArrowLeft`/`ArrowRight`/`a`/`d`/`Space`）、マウス（`mousemove`）、タッチ（`touchmove`）すべてが `paddleX` を更新またはステート遷移をトリガー。
