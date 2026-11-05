# 島田則幸 (Noriyuki Shimada)

## 未経験からインフラエンジニアへ

第一志望は **Linux サーバーの構築・運用を担うインフラエンジニア**です。まずは手順書と確認者のある基礎業務（IT 事務・キッティング、監視・運用の補助）から経験を積み、将来はサーバー構築・運用を担当したいと考えています。Windows Server / Active Directory も学習しています。

**現況（2026-11-05 本人確認）**：2026 年 10 月 7 日から IT 企業でトライアル就労・社内研修中です。勤務開始時期は相談となります。

| 目的 | 開くページ |
| --- | --- |
| 志望・現況・できることを短く読む | [採用ご担当者さま向けページ](./docs/overview-for-recruiters.md) |
| 原画像・ログと確認範囲を見る | [代表実績と証拠](./docs/evidence/featured-evidence.md) |
| 経歴・資格・応募条件を見る | [職務経歴書](./docs/resume.md)・[スキルシート](./docs/skill-sheet.md) |
| 学びと失敗の記録を読む | [LEARNINGS.md](./LEARNINGS.md) |

## まず見ていただきたい 3 本

主作品は **[サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)** です。以下は手元の Hyper-V VM で、**AI の手順案内を受けて本人が操作・確認した個人学習**です。独力での原因特定・再現を示す記録とは区別しています。

### 1. Ubuntu：SSH の設定不備から復旧を確認

- **課題**：意図的に入れた SSH の設定不備を見つけ、安全に接続できる状態へ戻す。
- **本人の確認**：構文検査、設定復元、鍵接続とサーバー状態の確認を操作。
- **判断の根拠**：`sshd -t` の終了コードが 255 → 0 となり、別途 SSH 鍵接続も確認。
- **結果**：対象の設定不備から復旧。全21項目の内訳と未確認範囲は[初期構築の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md)に掲載。

### 2. Active Directory：バックアップ時点へ戻ったことを確認

- **課題**：System State バックアップから復元できるかを確かめる。
- **本人の確認**：バックアップ後に目印の OU を作り、復元後にその有無を確認。
- **判断の根拠**：目印の OU が消え、バックアップ時点へ戻ったことを確認。
- **結果**：復元処理 15 分 29 秒、復旧全体は約 40 分。起動設定の解除漏れによるやり直しと、翌日判明した SYSVOL 欠損も[復元の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-ad-restore-drill.md)に掲載。

### 3. WSUS：試験の失敗を調べ、手順を修正

- **課題**：更新承認の試験が期待結果を満たさなかった理由を調べる。
- **本人の確認**：AI の案内で承認件数とルールの分類・製品設定を照合。
- **判断の根拠**：分類・製品が 0 件のルールでは、絞り込みなしとして全対象へ適用されることを確認。
- **結果**：手順書を修正。0 件になった操作の特定と通し再試験は未完了のため、元の試験判定は **FAIL** のまま。[原因調査の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)

## 主な実測結果

Ubuntu の監視・ログ検索、Ansible の再実行、AD の2台構成、CI の結果は[代表実績と証拠](./docs/evidence/featured-evidence.md)と[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)から確認できます。

現在の VM では、10/31 に AI の案内を受けて Nginx の停止・手動復旧を1回操作し、HTTP 200 → 接続失敗 → HTTP 200 を確認しました。説明後に停止対象と復旧判断の根拠を回答しています。[操作結果](https://github.com/ns7jp/server/blob/92609440727e6351a551da54e6d640a707902f0d/docs/evidence/2026-10-31-ubuntu-practice01-guided-recovery.md)・[再起動後の2サービス確認](https://github.com/ns7jp/server/blob/44d672ac2c160dbcd5907c21d935cc74e449d8e6/docs/evidence/2026-10-31-ubuntu-practice01-reboot-check.md)。11/5 は本人の環境を利用できないため、追加の実習は未実施です。環境を利用できるようになってから、この小さな構成で通信経路・確認の目的・復旧の根拠を本人が説明する練習に取り組みます。

## 何を作ったか

アプリの稼働環境と、数値・ログを集めて異常を見つける監視基盤を組み合わせました。

[![利用者からNginx・アプリへの要求、Prometheusからの数値取得、Grafanaの表示、AlloyからLokiへのログ送信、Alertmanagerへの警告の流れ](./docs/images/architecture-overview.svg)](./docs/images/architecture-overview.svg)

構成と各技術の役割は[構成図](./docs/architecture-diagram.md)、採用理由は[設計判断](./docs/adr/README.md)にまとめています。

## 経験・資格

製造・物流を中心に約15年。作業を計測して動線と手順を改善し、1日約1時間の作業短縮につなげました。[業務改善レポート](./docs/business-improvement/picking-improvement.md)

2026年7月に派遣会社へ入社し、7/21〜9/15に IT 企業でインフラ研修、10/7から別の IT 企業でトライアル就労・社内研修に取り組んでいます。Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級、IT パスポートを取得。基本情報技術者を学習中です。[職務経歴書](./docs/resume.md)・[資格取得ロードマップ](./docs/certifications/roadmap.md)

## この資料の読み方

### 3 つの前提（AI の利用を含む）

1. **個人の学習・検証です。** 顧客環境での構築・運用の実務経験を示すものではありません。
2. **記録ごとに日時・環境・実施者・確認範囲が異なります。** 個別の演習を合算して、全構成の合格とは扱いません。
3. **AI（Claude・Codex）を文書・コードの生成と操作の案内に使っています。** AI が直接操作した記録は本人の操作経験に含めません。本人の独力再現・説明は未確認です。[支援の内訳](./docs/resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)

「実装済み」はコード・文書がある状態、「実測済み」は実行結果がある状態、「未実施（NOT RUN）」は結果がない状態です。本人による監視から実通知・復旧までの一連の検証、24時間以上の稼働、別 VM への復元、AWS の実構築は未完了です。各項目の実施・合否と確認範囲は[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)にあります。

その他の学習用リポジトリは[作品案内](./docs/github-profile-cleanup.md#主作品と副作品)をご覧ください。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
