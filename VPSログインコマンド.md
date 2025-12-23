# VPSログインコマンド

## 接続情報
- **IPアドレス**: 160.16.92.115
- **ユーザー名**: ubuntu
- **パスワード**: sakura.ubuntu1127

## 方法1: SSH鍵を使用して接続（推奨）

### 基本的なコマンド

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

### SSH設定ファイルを使用（簡単）

SSH設定ファイルを作成：

```powershell
# 設定ファイルが存在しない場合は作成
if (-not (Test-Path $env:USERPROFILE\.ssh\config)) {
    New-Item -ItemType File -Path $env:USERPROFILE\.ssh\config
}

# 設定ファイルを編集
notepad $env:USERPROFILE\.ssh\config
```

以下の内容を追加：

```
Host sakura-vps
    HostName 160.16.92.115
    User ubuntu
    IdentityFile ~/.ssh/sakura_vps_key
```

その後、以下のコマンドで簡単に接続：

```powershell
ssh sakura-vps
```

## 方法2: パスワード認証で接続

パスワード認証が有効になっている場合：

```powershell
ssh ubuntu@160.16.92.115
```

パスワードを求められたら: `sakura.ubuntu1127`

## 方法3: 直接IPアドレスで接続

```powershell
ssh ubuntu@160.16.92.115
```

## 接続確認

接続が成功すると、以下のようなプロンプトが表示されます：

```
ubuntu@ubuntu:~$
```

## よく使うコマンド

### 接続後、現在のディレクトリを確認

```bash
pwd
```

### ホームディレクトリに移動

```bash
cd ~
```

### システム情報を確認

```bash
uname -a
lsb_release -a
```

### 接続を切断

```bash
exit
```

または `Ctrl + D`

## トラブルシューティング

### 接続できない場合

1. **IPアドレスを確認**: `160.16.92.115`
2. **ファイアウォールを確認**: SSHポート（22）が開放されているか
3. **VPSの状態を確認**: さくらのコントロールパネルでVPSが起動しているか確認

### パスワード認証が拒否される場合

SSH鍵認証を使用するか、VNCコンソールからパスワード認証を有効化してください。

### SSH鍵のパスが見つからない場合

```powershell
# SSH鍵の場所を確認
Get-ChildItem $env:USERPROFILE\.ssh\sakura_vps_key*
```

## 次のステップ

接続が成功したら、`VPSデプロイ実行コマンド.md` の手順に従ってデプロイを進めてください。

