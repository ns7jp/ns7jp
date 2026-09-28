# スキルシート（SES 形式・要約） — 島田則幸

案件との照合用の 1 枚版です。詳しい説明と根拠は[職務経歴書・スキルシート](./resume.md)にあります。

文書更新: 2026-09-28

## 基本情報

| 項目 | 内容 |
| --- | --- |
| 希望職種 | Linux サーバー構築・運用（Windows Server / AD にも対応）。入口として監視・運用、応募先によっては IT サポート・社内 SE 補助も可 |
| 稼働開始 | すぐに開始できます（求職中） |
| 勤務地 | 東京都内通勤可能圏 |
| 雇用形態 | 正社員志望。SES 可 |
| シフト | 24/365 監視業務のシフト勤務（夜勤を含む）に対応可能 |
| 資格 | Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級、IT パスポート。LinuC-1 101 を次に受験予定 |
| IT の実務経験 | なし（研修と個人学習のみ） |

## 経歴（IT 関連）

区分は「研修」（トライアル就業先での研修）と「個人学習」（手元の VM での学習。AI の手順案内を受けて私が操作）の 2 つです。○ は、その工程を経験したことを表します。

| 期間 | 区分 | 内容 | OS | ミドルウェア・ツール | 構築 | 単体試験 | 障害・復旧の演習 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026/07〜09/15 | 研修 | Windows Server・Linux サーバーの構築、利用者アカウントと権限の管理 | Windows Server 2022、Linux | Active Directory、Hyper-V、DHCP、SSH、Apache、Zabbix、Ansible、Docker | ○ | — | — |
| 2026/09/01〜08 | 個人学習 | AD の構築・試験、System State 復元、2 台目の DC と複製、FSMO 役割の奪取、WSUS の構築 | Windows Server 2022 | AD DS、DNS、GPO、WSUS、Windows Server バックアップ、PowerShell | ○ | ○ | ○ |
| 2026/09/04〜15 | 個人学習 | Ubuntu Server の初期構築（固定 IP・SSH 鍵認証・UFW・時刻同期・自動更新）、LVM のオンライン拡張、Docker での監視構成、Ansible・Git の練習 | Ubuntu 24.04、AlmaLinux 9 | OpenSSH、UFW、systemd-timesyncd・chrony（Ansible で適用）、LVM、Docker Compose、Nginx、Prometheus、Grafana、Loki、Ansible、Git | ○ | ○ | ○ |
| 2025/10〜2026/01 | 職業訓練 | 情報処理（Python エンジニア）コース | — | Python、Flask、PHP、MySQL、HTML / CSS / JavaScript | — | — | — |

- 設計書・手順書・試験仕様書は、AI 支援で作成した学習用の文書です。設計工程の実務経験には数えていません。
- AI を使わずに再現した記録はまだありません。AI 支援の範囲は[職務経歴書 §4-b](./resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)にあります。
- 各記録の日時・環境・判定は、主作品の[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)にあります。

## 前職

製造・物流を中心に約 15 年（在庫管理、ピッキング、入出庫、現場の業務改善）。作業時間の計測をもとに、1 日約 1 時間の作業短縮を提案・定着させました（[業務改善レポート](./business-improvement/picking-improvement.md)）。
