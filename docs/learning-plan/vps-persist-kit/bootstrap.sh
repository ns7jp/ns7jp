#!/usr/bin/env bash
# lab-persist01 bootstrap
#
# 13-persistent-host-exercise-design.md の §4.2・4.4・4.6・4.8・4.10 のうち、
# 対話操作を含まない・冪等な手順だけを自動化したスクリプト。新しい設計判断は加えていない。
#
# 前提:
#   - 4.3（作業用ユーザー作成）と 4.5（SSH公開鍵ログイン確認・パスワード認証禁止）が
#     終わっていること（このスクリプトは opsadmin 等、sudo 権限を持つ一般ユーザーで実行する）
#   - このスクリプトはこの AI 支援セッションでは実行・検証していません（README.md 参照）
#
# 対象外（このスクリプトの後、手作業で行うこと）:
#   - 4.7 ドメインの DNS 設定（レジストラ管理画面での操作）
#   - 4.9 Let's Encrypt 証明書の取得（certbot のメール入力・規約同意が対話式）
#   - 4.11 再起動試験、5章の試験項目書
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "root ではなく、4.3 で作成した sudo 権限を持つ一般ユーザーで実行してください" >&2
  exit 1
fi

echo "== 4.2 ホスト名・タイムゾーン・ロケール・NTP =="
sudo hostnamectl set-hostname lab-persist01
sudo timedatectl set-timezone Asia/Tokyo
sudo localectl set-locale LANG=ja_JP.UTF-8
if [ "$(timedatectl show --property=NTPSynchronized --value)" != "yes" ]; then
  echo "警告: NTP同期がまだ完了していません（数分後に timedatectl show --property=NTPSynchronized --value で再確認してください）" >&2
fi

echo "== 4.4 パッケージ更新・自動セキュリティ更新・fail2ban =="
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get full-upgrade -y
sudo apt-get install -y unattended-upgrades fail2ban nginx
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== 4.6 ufw（ファイアウォール） =="
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "== 4.8 Nginx 最小ページ・ヘルスチェック =="
# 設計書は既存の default サーバーブロックに location を追記する手順だが、
# 冪等に再実行できるよう、専用の site 設定ファイルを作り default を無効化する形に変更している
# （挙動は同一。設計書との差分として明記する）。
sudo mkdir -p /var/www/lab-persist01
echo "lab-persist01" | sudo tee /var/www/lab-persist01/index.html >/dev/null

sudo tee /etc/nginx/sites-available/lab-persist01.conf >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/lab-persist01;

    location /healthz {
        return 200 "ok";
        add_header Content-Type text/plain;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/lab-persist01.conf /etc/nginx/sites-enabled/lab-persist01.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "== 4.10 heartbeat タイマー =="
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

echo "== 完了 =="
echo "確認: curl -s http://<VPS_GLOBAL_IP>/healthz  (この時点では http のみ。HTTPS化は4.9で対応)"
echo "次の手作業: 4.7 DNSのAレコード設定 → 4.9 certbotでのTLS証明書取得 → 4.11 再起動試験"
