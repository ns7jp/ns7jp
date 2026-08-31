# オプション: この EC2 で 13 番（恒久ホスト構築演習）の目的も兼ねる

> **状態: 未使用の雛形（2026-08-31 に AI 支援セッションで作成、未実施）。**
> [11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md)は「`apply`→`destroy`まで一度回し切る」ことが目的で、
> [13 恒久ホスト構築演習設計](../13-persistent-host-exercise-design.md)は「独立ホストを継続稼働させる」ことが目的の別演習です
> （[13 §2「11との違い」](../13-persistent-host-exercise-design.md#11awsとの違い)参照）。
> 本ドキュメントは、**有料 VPS を契約せず AWS の無料利用枠だけで 13 の目的（再起動後の永続性・24/72 時間稼働・
> 実インターネット越しの host 側ファイアウォール）も満たしたい場合**の、非公式な代替ルートです。
> 新しい設計判断ではなく、11 のコードに手を加えず「`destroy`する前に追加でやること」を書いたものです。

## 前提

- [checklist.md](./checklist.md) の B-1〜B-10（`apply`〜冪等性確認）まで完了していること
- **B-11（`terraform destroy`）はまだ実行しないこと**
- 無料利用枠の範囲を超えないよう、[README](./README.md)の通り事前に AWS Budgets の予算アラートを設定済みであること

## 11 の設計との差分

| 項目 | 11 の設計 | 13 を兼ねる場合の追加 |
| --- | --- | --- |
| セキュリティグループ | 80 番のみ許可、22 番は開けない | **443 番を追加**（TLS 用。22 番は開けたままにしない） |
| ドメイン | 使わない（`main.tf` にコード化なし） | 使わない。**EC2 が自動で払い出すパブリック DNS 名**（`ec2-<IP>.<region>.compute.amazonaws.com` 形式。`terraform output public_ip` の逆引きやコンソールで確認）をそのまま使う |
| ホスト側ファイアウォール | 無し（AWS セキュリティグループのみに依存） | `ufw` + `fail2ban` を追加導入（13 §4.6 相当） |
| TLS | 対象外 | Let's Encrypt（`certbot`）を追加。**独自ドメインでなくても、AWS のパブリック DNS 名に対して取得できる**（自分がそのサーバーを管理していることを HTTP-01 チャレンジで証明できれば、ドメインの取得元は問われない） |
| 接続 | SSM Session Manager のみ | 変更なし（引き続き SSM のみ。22 番は開けない） |
| 終了 | `apply` 後すぐ `destroy` | 再起動試験・24/72 時間チェックの後に `destroy`（付録参照） |

## 手順

### 1. セキュリティグループに 443 番を追加

`main.tf` は変更せず、CLI か AWS コンソールで一時的に追加する（11 の Terraform コードの「80 番のみ」という設計を壊さないため）。

```sh
SG_ID=$(terraform output -raw instance_id | xargs -I{} aws ec2 describe-instances --instance-ids {} --profile lab-aws --query "Reservations[0].Instances[0].SecurityGroups[0].GroupId" --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --profile lab-aws
```

### 2. パブリック DNS 名を確認

```sh
INSTANCE_ID=$(terraform output -raw instance_id)
aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --profile lab-aws \
  --query "Reservations[0].Instances[0].PublicDnsName" --output text
```

以降、このコマンドの出力（例: `ec2-XX-XX-XX-XX.ap-northeast-1.compute.amazonaws.com`）を `<EC2_PUBLIC_DNS>` として使う。

### 3. SSM Session Manager で接続し、host 側の強化・TLS・heartbeat を設定

`ssm_connect_command`（`terraform output ssm_connect_command`）で接続したセッション内で実行する。
中身は [vps-persist-kit/bootstrap.sh](../vps-persist-kit/bootstrap.sh) の 4.6・4.10 相当 + `certbot` を SSM 用にまとめたもの。

```sh
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y ufw fail2ban certbot python3-certbot-nginx

# ufw（セキュリティグループと二重に絞る。host側でも22番は開けない）
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# TLS証明書の取得（独自ドメインの代わりにAWSのパブリックDNS名を使う）
sudo certbot --nginx -d <EC2_PUBLIC_DNS> --non-interactive --agree-tos -m <あなたのメールアドレス>
sudo certbot renew --dry-run

# heartbeat タイマー(13 §4.10 と同じ内容)
sudo tee /usr/local/bin/lab-heartbeat.sh >/dev/null <<'EOF'
#!/bin/sh
date >> /var/log/lab-heartbeat.log
EOF
sudo chmod +x /usr/local/bin/lab-heartbeat.sh
sudo tee /etc/systemd/system/lab-heartbeat.service >/dev/null <<'EOF'
[Unit]
Description=lab heartbeat

[Service]
Type=oneshot
ExecStart=/usr/local/bin/lab-heartbeat.sh
EOF
sudo tee /etc/systemd/system/lab-heartbeat.timer >/dev/null <<'EOF'
[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now lab-heartbeat.timer
sudo systemctl start lab-heartbeat.service
```

### 4. 動作確認

```sh
curl -I https://<EC2_PUBLIC_DNS>/
```

`200`・有効な証明書チェーンが返ることを確認する。

### 5. 再起動試験（13 §4.11 相当）

```sh
aws ec2 reboot-instances --instance-ids "$INSTANCE_ID" --profile lab-aws
```

数分待ってから、`ssm_connect_command` で再接続し、`systemctl is-enabled ufw fail2ban nginx lab-heartbeat.timer` と `systemctl is-active` が全て復帰していること、`curl -I https://<EC2_PUBLIC_DNS>/` が `200` を返すことを確認する。

### 6. 24 時間後・72 時間後チェック（13 §5 T-16・T-17 相当）

[13 の実施タイムテーブル](../13-persistent-host-exercise-design.md#実施タイムテーブル複数日程)と同じ間隔で、手元 PC から `curl -I https://<EC2_PUBLIC_DNS>/` を実行し、SSM 越しに `/var/log/lab-heartbeat.log` の最新行と `fail2ban-client status sshd`（総当たり検知件数。今回は 22 番を閉じているので基本的に 0 件のはず）を確認する。

**この 2 回のチェックのために、EC2 を起動したまま数日間放置することになる。無料利用枠内でも、AWS Budgets のアラートが届いていないか毎回確認すること。**

## 終了処理

72 時間チェックまで終わったら、通常の [checklist.md](./checklist.md) の「終了処理」（B-11 `terraform destroy`〜）に戻る。
443 番のルールは Terraform 管理外で追加したものなので、セキュリティグループごと `destroy` されれば一緒に消える（個別の削除操作は不要）。

## 未検証の範囲

このドキュメントの手順は、この AI 支援セッションには AWS アカウントが無いため**一度も実行して確認していません**。
特に、AWS のパブリック DNS 名に対する `certbot --nginx` の成功可否・EC2 再起動後もパブリック DNS 名が変わらないか
（Elastic IP を使わない設計のため、通常は変わらないはずだが未確認）は、実施時に注意して確認してください。
差分が見つかった場合は、[phase1-kit](../phase1-kit/README.md) と同じ扱いで LEARNINGS.md に記録してください。
