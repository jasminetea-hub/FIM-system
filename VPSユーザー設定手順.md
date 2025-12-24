# VPSユーザー設定手順

## 現在の状況

`su - ubuntu` でPermission deniedが発生しています。
rootユーザーで作業を進めるか、ubuntuユーザーを確認・作成する必要があります。

## 方法1: ubuntuユーザーの確認と作成

### ステップ1: ubuntuユーザーが存在するか確認

```bash
id ubuntu
```

### ステップ2: ubuntuユーザーが存在しない場合、作成

```bash
# ubuntuユーザーを作成
sudo useradd -m -s /bin/bash ubuntu

# パスワードを設定
sudo passwd ubuntu
# パスワード: sakura.ubuntu1127

# sudo権限を付与
sudo usermod -aG sudo ubuntu
```

### ステップ3: ubuntuユーザーに切り替え

```bash
su - ubuntu
# パスワード: sakura.ubuntu1127
```

## 方法2: rootユーザーで直接作業（簡単）

rootユーザーで作業を進めることもできます：

```bash
# 現在のユーザーを確認
whoami

# rootユーザーの場合は、そのまま作業を進められます
```

## 推奨: rootユーザーで作業を進める

rootユーザーでログインしている場合は、そのまま作業を進めることができます。
セキュリティ上、作業用のユーザーを作成することも推奨されますが、まずはデプロイを完了させることを優先します。

## rootユーザーでのデプロイ手順

### ステップ1: システムを更新

```bash
apt update && apt upgrade -y
```

### ステップ2: Node.jsをインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version
```

### ステップ3: GitとPM2をインストール

```bash
apt install git -y
npm install -g pm2
```

### ステップ4: デプロイディレクトリを作成

```bash
mkdir -p /home/ubuntu/www
cd /home/ubuntu/www
```

### ステップ5: GitHubからクローン

```bash
git clone https://github.com/jasminetea-hub/FIM-system.git .
```

### ステップ6: アプリケーションをセットアップ

```bash
npm install --production
npm run build
npm run init-db
mkdir -p logs
cp .htaccess.example .htaccess
```

### ステップ7: ファイルの所有者を変更（必要に応じて）

```bash
chown -R ubuntu:ubuntu /home/ubuntu/www
```

### ステップ8: ubuntuユーザーに切り替えてPM2で起動

```bash
# ubuntuユーザーが存在する場合
su - ubuntu
cd ~/www
pm2 start ecosystem.r.config.js
pm2 startup
pm2 save

# ubuntuユーザーが存在しない場合は、rootで実行
cd /home/ubuntu/www
pm2 start ecosystem.r.config.js
pm2 startup
pm2 save
```

### ステップ9: ファイアウォール設定

```bash
ufw allow 3001/tcp
ufw enable
ufw status
```

## トラブルシューティング

### ubuntuユーザーが存在しない場合

rootユーザーで作業を進めるか、上記の手順でubuntuユーザーを作成してください。

### パスワードが分からない場合

```bash
# rootユーザーでパスワードをリセット
passwd ubuntu
```

### sudo権限がない場合

rootユーザーで作業するか、sudo権限を付与：

```bash
usermod -aG sudo ubuntu
```

