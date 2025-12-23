# VPS上での作業手順

## 現在の状況

VPSにログイン済み（`root@tk2-222-20611`）のようです。
VPS上では、`sakura-vps` というホスト名は使用できません。これはローカルマシン（Windows）のSSH設定です。

## VPS上での作業

VPS上では、直接コマンドを実行できます。別のサーバーに接続する必要はありません。

### 現在のユーザーを確認

```bash
whoami
```

### ubuntuユーザーに切り替え（推奨）

```bash
# ubuntuユーザーに切り替え
su - ubuntu

# または、sudo権限でコマンドを実行
sudo su - ubuntu
```

## デプロイ作業の開始

### ステップ1: ubuntuユーザーで作業

```bash
# ubuntuユーザーに切り替え
su - ubuntu
# パスワード: sakura.ubuntu1127
```

### ステップ2: システムを更新

```bash
sudo apt update && sudo apt upgrade -y
```

### ステップ3: Node.jsをインストール

```bash
# Node.js 18.xをインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョンを確認
node --version
npm --version
```

### ステップ4: Gitをインストール

```bash
sudo apt install git -y
git --version
```

### ステップ5: PM2をインストール

```bash
sudo npm install -g pm2
pm2 --version
```

### ステップ6: デプロイディレクトリを作成

```bash
mkdir -p ~/www
cd ~/www
```

### ステップ7: GitHubからクローン

```bash
# GitHubリポジトリをクローン
git clone https://github.com/jasminetea-hub/FIM-system.git .

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
```

### ステップ8: PM2でアプリケーションを起動

```bash
# PM2でアプリケーションを起動
pm2 start ecosystem.config.js

# 自動起動を設定
pm2 startup
# 表示されたコマンドを実行（sudoが必要な場合があります）

pm2 save

# ステータス確認
pm2 status
```

### ステップ9: ファイアウォールの設定

```bash
# ポート3001を開放
sudo ufw allow 3001/tcp

# ファイアウォールを有効化
sudo ufw enable

# 状態を確認
sudo ufw status
```

## 動作確認

ブラウザで以下のURLにアクセス：

```
http://160.16.92.115:3001
```

## 注意事項

- VPS上では、`sakura-vps` というホスト名は使用できません
- 直接IPアドレス（`160.16.92.115`）を使用してください
- または、`localhost` を使用してください

## トラブルシューティング

### Node.jsのインストールに失敗する場合

```bash
# 古いNode.jsを削除
sudo apt remove nodejs npm -y
sudo apt autoremove -y

# 再度インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2が起動しない場合

```bash
# ログを確認
pm2 logs fim-prediction --lines 50

# エラーの詳細を確認
pm2 describe fim-prediction

# 手動で起動してエラーを確認
cd ~/www
node server.js
```

