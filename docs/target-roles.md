# 志望トラックと証跡の対応

第一志望は **インフラエンジニア（Linux サーバー設計・構築）**です。現在は、手順書と確認者のある基礎業務（IT 事務・キッティング、監視・運用の補助）から経験を積む段階です。

主作品は [server](https://github.com/ns7jp/server) です。下表の順位は学習・作品の提示順であり、各業務を独力で担当できるという意味ではありません。

## 優先順位

本人実習は AI の手順案内を受けて VM を操作した記録です。9 月は Hyper-V、11 月の下表の記録は KVM 環境です。CI や AI が直接実行した記録は、本人の操作経験に含めません。

<!-- markdownlint-disable-next-line MD033 -->
<a id="応募先別の最短導線"></a>

| 優先 | 応募分野・入口として想定する業務 | 最初に見る証拠と確認範囲 |
| --- | --- | --- |
| 1 | Linux：初期設定・構築補助、試験・手順更新 | [9/7〜8 の Ubuntu 初期構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md)。固定 IP・SSH・UFW 等を手作業で設定。監視全体を含む新規ホストの構築・再起動・受け入れは未完了 |
| 1b | Windows Server / AD：構築・試験・復元の補助 | [9/1〜8 の実習一覧](./resume-evidence.md#windows-server--ad-の構築試験2026-09-0108手元の-hyper-v)。AD 必須 31 項目 PASS、2 台目 DC・FSMO 奪取。復元は OU の状態を確認したが翌日 SYSVOL 欠損が判明し、修正手順の実機検証は未完了。WSUS は **FAIL**、分類・製品が 0 件になった操作は未特定、通し再試験は未実施 |
| 2 | 監視・運用：監視確認、一次切り分け・定型作業の補助 | [11/5 の監視・通知・手動復旧](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-11-05-kvm-monitoring-notification.md)。本人操作で同一構成の監視値 1→0→1 とローカル通知 FIRING / RESOLVED を確認。原画像・受信 JSON は未収録。Slack 等の外部通知・長期稼働は未確認 |
| 2b | データセンター現地作業：現物管理・棚卸しの補助 | [物流経験との対応](./career-bridge.md#28-現物スキルの転用物流現場--データセンター現地作業デスクワーク適応)。重量物取扱い・現物管理の経験はあるが、ラックマウント・配線の実技は未着手 |
| 3 | IT サポート・社内 SE 補助：問い合わせ、キッティング、棚卸し | [AD・クライアント連携と GPO](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-11-10-kvm-ad-client-access-gpo.md)（11/10 記録整理、実施日時未採録）。本人操作で部署別共有・ドライブ配布・異動後の切替等を画面確認。原画像・生ログは未収録、全運用試験の完了ではない |
| 3b | ヘルプデスク：電話・チャットの一次受付、報告 | [前職の業務改善レポート](./business-improvement/picking-improvement.md)。困りごとの数値化と上長への報告経験。想定問答・エスカレーション記録の練習は未着手 |
| 発展 | Cloud / IaC：将来の構築補助 | [AWS / Terraform の設計](./server-monitor-improvements/03-terraform-aws.md)。コードは `validate` / `fmt` まで。実 AWS の `plan / apply / destroy`・費用・復元の実測は未実施 |
| 発展 | アプリ基盤 / DB：将来の 3 層構築・復元試験 | [3 層ラボ](https://github.com/ns7jp/server/tree/main/labs/three-tier)。切り分け・DB 復元は AI 支援セッションの環境での実行で、本人 VM では未実施 |

## 現時点の境界

`server` は単一ホスト中心の学習ラボです。実務でのサーバー構築・大規模運用・本番冗長化の実績ではありません。**本人の独力再現・初見障害の原因特定は未確認**です。

- **RHEL 系**：9/4 に再利用 AlmaLinux VM で基盤設定と Docker 導入を確認。新規 VM の最小公開・監視全体の `site.yml` 適用は未実施です。
- **CI・障害ラボ**：使い捨て runner の Full-stack E2E 23 項目 PASS は、独立した管理端末・引き渡し先ホストの検証ではありません。B-1〜B-4（LVM・3 層・DB・L2/L3）は AI 支援環境での実行で、本人 VM での再実行は未実施。VLAN の 3 項目は未検証です。
- **Windows / AD**：組織環境への導入、24 / 72 時間稼働、サイト間複製、電源断からの復旧は未確認です。11 月の KVM 実習は別環境の部分確認で、9 月の復元・WSUS の判定を上書きしません。

過去の環境別結果は[実習と技術経験の詳細](./resume-evidence.md)、実装済み・実測済み・未実施の区別と当時の計画は[実習状況の整理](./practice-status.md)（2026-11-05 本人確認）へまとめています。後続の本人実習と確認範囲は、[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)をご覧ください。

## AI 支援の範囲と、自分で書いた部分

文書・コードの生成に AI を使っています。AI が直接操作した 9/27〜28 の新ラボ、研修の AD 名前解決障害の代筆記録、[LEARNINGS.md](../LEARNINGS.md) の執筆区分は、[AI 支援の内訳](./ai-usage.md)をご覧ください。面接では本人の記録を起点に、説明できる範囲を確認いただくことを想定しています。

## 関連ドキュメント

[採用ご担当者さまへ](./overview-for-recruiters.md) ／ [職務経歴書](./resume.md) ／ [プロフィール](../README.md)
