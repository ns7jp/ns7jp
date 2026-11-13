# 島田則幸 (Noriyuki Shimada)

**Linux サーバーの構築・運用を担うインフラエンジニアを志望しています。** 手順書と確認者のある基礎業務から経験を積みたいと考えています。

**現況（2026-11-05 本人確認）**：10/7 から IT 企業でトライアル就労・社内研修中。勤務開始時期は相談となります。

## 主作品：サーバー構築・監視ラボ

**[server](https://github.com/ns7jp/server)** で、Linux 上のアプリ稼働、数値・ログの監視、Windows Server / AD の構築・復旧を学んでいます。

[![利用者からNginx・アプリへの要求、Prometheusによる数値取得、Grafanaの表示、Alloy・Lokiによるログ収集、Alertmanagerへの警告の流れ](./docs/images/architecture-overview.svg)](./docs/architecture-diagram.md)

図は実装した構成です。確認済みの範囲は演習ごとに異なり、全構成の一連の検証は未完了です。[設計判断](./docs/adr/README.md)

<!-- markdownlint-disable-next-line MD033 -->
<a id="主な実測結果"></a>

## まず見ていただきたい 3 本

以下は、**AI の手順案内を受けて本人が VM を操作・確認した個人学習**です。

- **Ubuntu：SSH の設定不備から復旧** — 設定を復元し、`sshd -t` の終了コード 255 → 0 と鍵接続の成功を確認。[記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md)
- **AD：バックアップ時点への復元を確認** — 復元後に目印の OU が消えたことを確認。翌日 SYSVOL 欠損が判明し、修正手順の実機検証は未完了。[記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-ad-restore-drill.md)
- **WSUS：承認試験の失敗を調べ、手順を修正** — 分類・製品が 0 件だと全対象に適用されることを確認。0 件になった操作は未特定、通し再試験は未実施で、判定は **FAIL** のまま。[記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)

## 経験・資格

製造・物流を中心に約15年。動線と手順の改善で、1日約1時間の作業短縮につなげました。[業務改善レポート](./docs/business-improvement/picking-improvement.md)

IT パスポート、Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級を取得。基本情報技術者を学習中です。

## 詳しく見る

| 知りたいこと | 開くページ |
| --- | --- |
| 職歴・応募条件 | [採用ご担当者さまへ](./docs/overview-for-recruiters.md)・[職務経歴書](./docs/resume.md)・[スキルシート](./docs/skill-sheet.md) |
| 原画像・確認範囲 | [代表実績と証拠](./docs/evidence/featured-evidence.md) |
| 実習の状況・学習記録 | [実習状況と次の確認](./docs/practice-status.md)・[学びと失敗の記録](./LEARNINGS.md) |
| その他の作品 | [作品案内](./docs/github-profile-cleanup.md#主作品と副作品) |

<!-- markdownlint-disable-next-line MD033 -->
<a id="3-つの前提ai-の利用を含む"></a>

## この資料の読み方

文書・コードの生成にも AI を利用しています。**本人の独力再現・説明は未確認**で、AI が直接操作した記録は本人の操作経験に含めません。顧客環境での実務経験を示すものではありません。[AI 支援の内訳](./docs/resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)・[検証範囲の読み方](./docs/practice-status.md#検証範囲の読み方)

## Contact

[net7jp@gmail.com](mailto:net7jp@gmail.com) ／ [GitHub](https://github.com/ns7jp)
