# さくらのVPSデプロイ手順（実行用）

## 接続情報
- **ユーザー名**: ubuntu
- **パスワード**: sakura.ubuntu1127
- **ホスト名**: sakuraubuntu
- **IPアドレス**: [さくらのコントロールパネルで確認]

## ステップ1: IPアドレスの確認

さくらのコントロールパネルでVPSのIPアドレスを確認してください。

## ステップ2: SSH接続

PowerShellで以下のコマンドを実行：

```powershell
ssh ubuntu@sakuraubuntu
```

または、IPアドレスが分かっている場合：

```powershell
ssh ubuntu@[IPアドレス]
```

パスワード: `sakura.ubuntu1127`

## ステップ3: VPS上でのセットアップ

SSH接続後、以下のコマンドを順番に実行：

```bash
# 1. システムを更新
sudo apt update && sudo apt upgrade -y

# 2. Node.js 18.xをインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Gitをインストール
sudo apt install git -y

# 4. PM2をインストール
sudo npm install -g pm2

# 5. デプロイディレクトリを作成
mkdir -p ~/www
cd ~/www
```

## ステップ4: GitHubからデプロイ

```bash
# GitHubリポジトリをクローン（リポジトリURLを入力）
git clone https://github.com/[ユーザー名]/[リポジトリ名].git .

# 依存関係をインストール
npm install --production

# フロントエンドをビルド
npm run build

# データベースを初期化
npm run init-db

# ログディレクトリを作成
mkdir -p logs

# .htaccessを設定
cp .htaccess.example .htaccess

# PM2でアプリケーションを起動
pm2 start ecosystem.config.js

# 自動起動を設定
pm2 startup
pm2 save

# ステータス確認
pm2 status
```

## ステップ5: ファイアウォールの設定

```bash
# ポート3001を開放
sudo ufw allow 3001/tcp

# ファイアウォールを有効化
sudo ufw enable
```

## 動作確認

ブラウザで `http://[IPアドレス]:3001` にアクセス

