# SSH鍵認証設定手順

さくらのVPSでパスワード認証が無効になっている場合の対処方法です。

## 方法1: さくらのコントロールパネルでSSH鍵を設定（推奨）

### ステップ1: さくらのコントロールパネルにログイン

1. さくらのコントロールパネルにアクセス
2. VPSの管理画面を開く

### ステップ2: SSH鍵を生成またはアップロード

さくらのコントロールパネルで：
1. 「SSH鍵」または「鍵管理」のセクションを開く
2. 新しいSSH鍵を生成するか、既存の公開鍵をアップロード
3. 生成された鍵をダウンロード（秘密鍵）

### ステップ3: ローカルでSSH鍵を設定

WindowsのPowerShellで：

```powershell
# .sshディレクトリが存在しない場合は作成
if (-not (Test-Path $env:USERPROFILE\.ssh)) {
    New-Item -ItemType Directory -Path $env:USERPROFILE\.ssh
}

# ダウンロードした秘密鍵を .ssh ディレクトリにコピー
# 例: C:\Users\Kmuto\.ssh\sakura_vps_key

# 鍵の権限を設定（Windowsでは不要ですが、念のため）
icacls $env:USERPROFILE\.ssh\sakura_vps_key /inheritance:r
icacls $env:USERPROFILE\.ssh\sakura_vps_key /grant:r "$env:USERNAME:(R)"
```

### ステップ4: SSH接続

```powershell
# 秘密鍵を指定して接続
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

---

## 方法2: ローカルでSSH鍵を生成してVPSに登録

### ステップ1: SSH鍵ペアを生成

PowerShellで：

```powershell
# SSH鍵を生成
ssh-keygen -t ed25519 -C "sakura-vps" -f $env:USERPROFILE\.ssh\sakura_vps_key

# パスフレーズを設定するか、Enterキーでスキップ
```

### ステップ2: 公開鍵の内容を表示

```powershell
# 公開鍵の内容を表示
Get-Content $env:USERPROFILE\.ssh\sakura_vps_key.pub
```

### ステップ3: さくらのコントロールパネルで公開鍵を登録

1. さくらのコントロールパネルにログイン
2. VPSの管理画面で「SSH鍵」セクションを開く
3. 表示された公開鍵の内容をコピーして登録

### ステップ4: SSH接続

```powershell
# 秘密鍵を指定して接続
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

---

## 方法3: さくらのコントロールパネルでパスワード認証を有効化

### ステップ1: コントロールパネルで設定を変更

1. さくらのコントロールパネルにログイン
2. VPSの管理画面を開く
3. 「セキュリティ設定」または「SSH設定」を開く
4. 「パスワード認証を許可」を有効化
5. 設定を保存

### ステップ2: VPSを再起動（必要に応じて）

コントロールパネルからVPSを再起動します。

### ステップ3: SSH接続

```powershell
ssh ubuntu@160.16.92.115
```

パスワード: `sakura.ubuntu1127`

---

## 方法4: さくらのVNCコンソールを使用

### ステップ1: VNCコンソールにアクセス

1. さくらのコントロールパネルにログイン
2. VPSの管理画面で「VNCコンソール」を開く
3. ブラウザ上でVPSに直接アクセス

### ステップ2: VNCコンソールでSSH設定を変更

VNCコンソールでログイン後：

```bash
# SSH設定ファイルを編集
sudo nano /etc/ssh/sshd_config

# 以下の行を探して変更
# PasswordAuthentication no  →  PasswordAuthentication yes

# SSHサービスを再起動
sudo systemctl restart sshd
```

### ステップ3: SSH接続

```powershell
ssh ubuntu@160.16.92.115
```

---

## 推奨される方法

**方法1（さくらのコントロールパネルでSSH鍵を設定）** が最も安全で推奨されます。

## トラブルシューティング

### SSH鍵の権限エラー

```powershell
# Windowsでは通常問題ありませんが、念のため確認
icacls $env:USERPROFILE\.ssh\sakura_vps_key
```

### 接続がタイムアウトする

1. ファイアウォールでSSHポート（22）が開放されているか確認
2. さくらのコントロールパネルでVPSの状態を確認
3. IPアドレスが正しいか確認: `160.16.92.115`

### パスワード認証が有効にならない

VNCコンソールから直接設定を変更してください。

