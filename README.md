# 🟢🔵 じゃんけん 3D

Three.js で作った 3D リアルタイム じゃんけんアプリ。

## 特徴

- 2〜10人のリアルタイム対戦（各自のスマホ/PCから参加）
- **キャラクター3種類から選択**できる
  - 🐻 **もぐ** — 子供の頃、たったの銀貨5枚で実の父親に売られた 
  - 🐰 **ぴょん** — 親父は猿の頭蓋骨で酒を飲む
  - 🐱 **みぃ** — トラの乳を飲んで育った 
- プレイヤーごとに首巻きが違う色で、誰が誰か一目でわかる
- ファミマカラー（緑×青）× 洗練されたどうぶつの森風
- 芝生アリーナ、お花、流れる雲、やさしい太陽光
- スマホ対応

## ローカルで試す

```bash
npm install
npm start
```

http://localhost:3000 で動きます。別タブやスマホ（`http://<PCのIP>:3000`）から
同時に参加できます。

## Webに公開する

Node.js + WebSocket が動く無料ホスティングに置きます。

**おすすめ: Render.com**
1. このフォルダを GitHub にプッシュ
2. https://render.com で New Web Service → GitHub リポジトリ連携
3. Runtime: Node / Build: `npm install` / Start: `npm start` / Plan: **Free**
4. 数分で公開URL発行

その他: Railway、Fly.io、Glitch などでも動作します。

## ファイル構成

```
coffee-janken-3d/
├── package.json
├── server.js           # Express + Socket.IO (キャラクター情報も管理)
└── public/
    ├── index.html      # ホーム / HUD (キャラ選択UI)
    ├── style.css       # ファミマカラーのスタイル
    └── game.js         # Three.js 3Dシーン (3種類のキャラクター実装)
```

## キャラクター追加のやり方

1. `public/game.js` の `CHARACTER_PALETTE` に色を追加
2. `createAvatar()` の species 分岐に新しい分岐を追加
3. `public/index.html` に SVG プレビュー付きの `.character-card` を追加
4. `server.js` の `CHARACTERS` 配列にキー名を追加

## 遊び方

1. お名前を入力 → キャラクターを選ぶ（もぐ/ぴょん/みぃ）
2. 「あたらしい部屋を作る」→ 4桁コードを共有
3. みんな集まったらホストが「スタート」
4. グー/チョキ/パーを選択
5. 負けた手の人は脱落、最後まで残った1人がコーヒー係 ☕

Enjoy your coffee break! ☕
