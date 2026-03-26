# ゲーミングPC セールサーチ

予算を設定するだけで、楽天市場のセール中ゲーミングPCをリアルタイム検索できるWebサービスです。  
**利用者はURLを開くだけ。インストール不要・登録不要。**

---

## 構成

```
gamerig-finder/
├── public/
│   └── index.html        # フロントエンド（静的ファイル）
├── api/
│   └── search.js         # Vercelサーバーレス関数（APIキーを隠すプロキシ）
└── vercel.json           # Vercel設定
```

---

## デプロイ手順（所要時間：約10分）

### 1. 楽天APIキーの取得（無料）

1. [https://webservice.rakuten.co.jp/](https://webservice.rakuten.co.jp/) にアクセス
2. 楽天IDでログイン（楽天アカウントがあればすぐOK）
3. 「アプリ登録」でアプリ名・URLなど適当に入力して登録
4. 発行された **Application ID** をコピーしておく

### 2. GitHubにアップロード

1. [https://github.com/new](https://github.com/new) で新しいリポジトリを作成（公開/非公開どちらでもOK）
2. このフォルダ内のファイルをすべてアップロード

```bash
# コマンドラインの場合
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/gamerig-finder.git
git push -u origin main
```

### 3. Vercelにデプロイ（無料）

1. [https://vercel.com/](https://vercel.com/) にGitHubアカウントでログイン
2. 「New Project」→ 先ほどのリポジトリを選択 → 「Deploy」
3. デプロイ完了後、**「Settings」→「Environment Variables」** で以下を追加：

| Key | Value |
|-----|-------|
| `RAKUTEN_APP_ID` | 手順1で取得したApplication ID |

4. 「Redeploy」ボタンで再デプロイして完了

**発行されたURL（例：`https://gamerig-finder.vercel.app`）を共有するだけで誰でも利用できます。**

---

## 費用

| 項目 | 費用 |
|------|------|
| 楽天API | 完全無料・無制限 |
| Vercel（Hobbyプラン） | 無料（個人利用の範囲内） |
| 独自ドメイン | 任意（なくてもOK） |

---

## 利用規約・注意事項

- 楽天Web Service利用規約に従って使用してください
- 商用利用の場合は楽天の規約を確認してください
- 価格・在庫情報は楽天市場の商品ページで必ずご確認ください

---

## ローカルで試す場合

Vercel CLIが必要です：

```bash
npm i -g vercel
vercel dev
```

`.env.local` ファイルを作成してAPIキーを設定：
```
RAKUTEN_APP_ID=あなたのApplication ID
```
