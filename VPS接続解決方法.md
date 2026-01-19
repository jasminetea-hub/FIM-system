# VPS接続解決方法

「Permission denied, please try again.」エラーが発生している場合の対処方法です。

## 現在の状況

パスワード認証が拒否されています。以下のいずれかの方法で解決できます。

## 方法1: VNCコンソールを使用（最も簡単）

### ステップ1: さくらのコントロールパネルでVNCコンソールを開く

1. さくらのコントロールパネルにログイン
2. VPSの管理画面を開く
3. 「VNCコンソール」または「コンソール」をクリック
4. ブラウザ上でVPSに直接アクセス

### ステップ2: VNCコンソールでログイン

- ユーザー名: `ubuntu` または `root`
- パスワード: `sakura.ubuntu1127`

### ステップ3: VNCコンソールからSSH設定を変更

ログイン後、以下のコマンドを実行：

```bash
# SSH設定ファイルを編集
sudo nano /etc/ssh/sshd_config
```

以下の行を探して変更：

```
# PasswordAuthentication no
```

を

```
PasswordAuthentication yes
```

に変更（コメントアウトを外す）

保存: `Ctrl + O`, `Enter`, `Ctrl + X`

### ステップ4: SSHサービスを再起動

```bash
sudo systemctl restart sshd
```

### ステップ5: WindowsからSSH接続

```powershell
ssh ubuntu@160.16.92.115
```

パスワード: `sakura.ubuntu1127`

---

## 方法2: SSH鍵認証を設定（推奨・安全）

### ステップ1: 公開鍵をコピー

既に生成済みの公開鍵：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG/+K8BMQNw+hZvqxAG7v9ANnTi4RzKPQF4sWCATipRh sakura-vps
```

### ステップ2: VNCコンソールで公開鍵を登録

VNCコンソールでログイン後：

```bash
# ubuntuユーザーに切り替え（rootでログインしている場合）
su - ubuntu
# パスワード: sakura.ubuntu1127

# .sshディレクトリを作成
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 公開鍵を追加
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG/+K8BMQNw+hZvqxAG7v9ANnTi4RzKPQF4sWCATipRh sakura-vps" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### ステップ3: WindowsからSSH鍵で接続

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

または、SSH設定を使用：

```powershell
ssh sakura-vps
```

---

## 方法3: さくらのコントロールパネルでSSH鍵を設定

### ステップ1: さくらのコントロールパネルでSSH鍵を登録

1. さくらのコントロールパネルにログイン
2. VPSの管理画面を開く
3. 「SSH鍵」または「鍵管理」セクションを開く
4. 公開鍵を登録

公開鍵の内容：
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG/+K8BMQNw+hZvqxAG7v9ANnTi4RzKPQF4sWCATipRh sakura-vps
```

### ステップ2: WindowsからSSH接続

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

---

## 推奨される手順

1. **まずVNCコンソールで接続**（最も確実）
2. VNCコンソールからパスワード認証を有効化
3. WindowsからSSH接続を確認
4. その後、SSH鍵認証を設定（セキュリティ向上）

## VNCコンソールでの作業手順（完全版）

VNCコンソールでログイン後、以下のコマンドを実行：

```bash
# 1. 現在のユーザーを確認
whoami

# 2. ubuntuユーザーが存在するか確認
id ubuntu

# 3. ubuntuユーザーが存在しない場合、作成
sudo useradd -m -s /bin/bash ubuntu
sudo passwd ubuntu
# パスワード: sakura.ubuntu1127
sudo usermod -aG sudo ubuntu

# 4. SSH設定を変更
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication yes に変更

# 5. SSHサービスを再起動
sudo systemctl restart sshd

# 6. ubuntuユーザーに切り替え
su - ubuntu
# パスワード: sakura.ubuntu1127

# 7. デプロイ作業を開始
cd ~
mkdir -p www
cd www
```

## 次のステップ

VPSに接続できたら、`docs/正規的なVPSデプロイ手順.md` の手順に従ってデプロイを進めてください。




