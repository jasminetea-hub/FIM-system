# SSH接続手順（さくらのVPS）

## 現在の状況

SSH鍵を生成しました。次に、公開鍵をさくらのVPSに登録する必要があります。

## 方法A: さくらのコントロールパネルで公開鍵を登録（推奨）

### ステップ1: 公開鍵の内容をコピー

上記で表示された公開鍵の内容をコピーしてください。

### ステップ2: さくらのコントロールパネルで登録

1. さくらのコントロールパネルにログイン
2. VPSの管理画面を開く
3. 「SSH鍵」または「鍵管理」のセクションを開く
4. 公開鍵を登録

### ステップ3: SSH接続

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

---

## 方法B: VNCコンソールを使用して公開鍵を登録

### ステップ1: VNCコンソールにアクセス

1. さくらのコントロールパネルにログイン
2. VPSの管理画面で「VNCコンソール」を開く
3. ブラウザ上でVPSに直接アクセス

### ステップ2: VNCコンソールでログイン

ユーザー名: `ubuntu`
パスワード: `sakura.ubuntu1127`

### ステップ3: 公開鍵を登録

VNCコンソールで以下のコマンドを実行：

```bash
# .sshディレクトリを作成
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 公開鍵を追加（[公開鍵の内容]を実際の公開鍵に置き換え）
echo "[公開鍵の内容]" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### ステップ4: SSH接続

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

---

## 方法C: パスワード認証を有効化

### ステップ1: VNCコンソールでSSH設定を変更

VNCコンソールでログイン後：

```bash
# SSH設定ファイルを編集
sudo nano /etc/ssh/sshd_config

# 以下の行を探して変更
# PasswordAuthentication no  →  PasswordAuthentication yes
# または、行がコメントアウトされている場合は、コメントを外す

# SSHサービスを再起動
sudo systemctl restart sshd
```

### ステップ2: SSH接続

```powershell
ssh ubuntu@160.16.92.115
```

パスワード: `sakura.ubuntu1127`

---

## 推奨される方法

**方法A（さくらのコントロールパネルで公開鍵を登録）** が最も簡単で安全です。

公開鍵の登録が完了したら、以下のコマンドで接続できます：

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

