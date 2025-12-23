# さくらのVPSへの接続方法

Windowsのターミナル（PowerShell）からさくらのVPSにSSH接続する方法です。

## 基本的な接続方法

### SSH接続コマンド

```powershell
ssh [ユーザー名]@[サーバーIPアドレスまたはホスト名]
```

例：
```powershell
ssh username@123.45.67.89
```

または、ホスト名を使用する場合：
```powershell
ssh username@example.com
```

### 初回接続時

初回接続時は、サーバーのフィンガープリントを確認するプロンプトが表示されます：

```
The authenticity of host '123.45.67.89 (123.45.67.89)' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

`yes`と入力してEnterキーを押してください。

### パスワード認証

パスワードを求められたら、VPSのパスワードを入力します（入力中は表示されません）。

## SSH鍵認証の設定（推奨）

パスワード認証よりも安全なSSH鍵認証を設定することを推奨します。

### 1. SSH鍵ペアの生成（まだ持っていない場合）

```powershell
# SSH鍵を生成（既に存在する場合はスキップ）
ssh-keygen -t ed25519 -C "your_email@example.com"

# または、RSA鍵を使用する場合
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

プロンプトが表示されたら：
- ファイルの保存場所: Enterキーでデフォルト（`C:\Users\[ユーザー名]\.ssh\id_ed25519`）
- パスフレーズ: 設定するかEnterキーでスキップ

### 2. 公開鍵をVPSにコピー

#### 方法A: ssh-copy-idを使用（Windowsでは利用できない場合があります）

```powershell
# Windowsでは直接使えない場合があるので、方法Bを使用
```

#### 方法B: 手動でコピー

```powershell
# 公開鍵の内容を表示
cat ~/.ssh/id_ed25519.pub

# または
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

表示された公開鍵をコピーして、VPSに接続後：

```bash
# VPSに接続
ssh username@123.45.67.89

# VPS上で実行
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "コピーした公開鍵の内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 方法C: PowerShellで自動コピー

```powershell
# 公開鍵の内容を取得してVPSに追加
$publicKey = Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
ssh username@123.45.67.89 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 3. SSH鍵認証で接続

設定後は、パスワードなしで接続できるようになります：

```powershell
ssh username@123.45.67.89
```

## SSH設定ファイルの作成（オプション）

よく接続するVPSの設定を保存しておくと便利です。

### 1. SSH設定ファイルを作成

```powershell
# 設定ファイルが存在しない場合は作成
if (-not (Test-Path $env:USERPROFILE\.ssh\config)) {
    New-Item -ItemType File -Path $env:USERPROFILE\.ssh\config
}
```

### 2. 設定を追加

```powershell
# 設定ファイルを編集
notepad $env:USERPROFILE\.ssh\config
```

以下のような内容を追加：

```
Host sakura-vps
    HostName 123.45.67.89
    User username
    Port 22
    IdentityFile ~/.ssh/id_ed25519
```

### 3. 簡単に接続

設定後は、ホスト名だけで接続できます：

```powershell
ssh sakura-vps
```

## よく使うSSHコマンド

### ファイルのコピー（SCP）

```powershell
# ローカルからVPSへファイルをコピー
scp file.txt username@123.45.67.89:/home/username/

# VPSからローカルへファイルをコピー
scp username@123.45.67.89:/home/username/file.txt ./

# ディレクトリごとコピー
scp -r ./dist username@123.45.67.89:/home/username/www/
```

### リモートコマンドの実行

```powershell
# VPS上でコマンドを実行（接続せずに）
ssh username@123.45.67.89 "ls -la"

# 複数のコマンドを実行
ssh username@123.45.67.89 "cd /home/username/www && git pull && npm run build"
```

### ポートフォワーディング

```powershell
# ローカルポート3001をVPSの3001ポートに転送
ssh -L 3001:localhost:3001 username@123.45.67.89
```

## トラブルシューティング

### 接続がタイムアウトする

1. ファイアウォールの設定を確認
2. VPSのIPアドレスが正しいか確認
3. ポート番号が正しいか確認（デフォルトは22）

### パスワードが正しくない

1. パスワードを再確認
2. 大文字・小文字を確認
3. さくらのコントロールパネルでパスワードをリセット

### 権限エラー（Permission denied）

1. SSH鍵の権限を確認
2. VPS側の`~/.ssh/authorized_keys`の権限を確認（600である必要があります）

### 接続が遅い

1. DNSの設定を確認
2. 接続先のサーバーが遠い場合、時間がかかることがあります

## セキュリティの推奨事項

1. **SSH鍵認証を使用**: パスワード認証よりも安全です
2. **パスフレーズを設定**: SSH鍵にパスフレーズを設定することを推奨します
3. **ポート番号を変更**: デフォルトの22番ポートを変更することを検討してください
4. **ファイアウォールの設定**: 必要なIPアドレスのみアクセスを許可

## さくらのVPSでのデプロイ

VPSに接続後、GitHub経由でデプロイする場合：

```bash
# VPSに接続
ssh username@123.45.67.89

# デプロイ先ディレクトリに移動
cd /home/username/www

# GitHubからクローン（初回のみ）
git clone https://github.com/[ユーザー名]/[リポジトリ名].git .

# または、既存のリポジトリを更新
git pull origin main

# デプロイスクリプトを実行
./deploy-server.sh
```

詳細は [`docs/GitHub経由デプロイ手順.md`](GitHub経由デプロイ手順.md) を参照してください。

