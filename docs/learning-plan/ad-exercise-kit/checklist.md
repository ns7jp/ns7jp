# 08 AD構築演習 実施チェックリスト（進捗管理用）

> **これは正本ではない。** コマンド・想定結果・判定基準は必ず
> [08 AD構築演習設計](../08-ad-exercise-design.md) 本体を見る。
> このチェックリストは、作業中に長い設計書を都度スクロールしなくて済むように
> 節番号だけを並べた進捗管理用の要約であり、内容が食い違った場合は
> **設計書側を正とする**（[STATUS.md §0 ルール 8「正本を決め、他は同期先とする」](../../../STATUS.md#0-更新の運用ルール2026-07-03-制定)と同じ考え方）。
>
> このチェックリスト自体は 2026-08-26 に AI 支援セッションで作成した未使用の雛形であり、
> チェックを入れた実績はまだ無い。実際にチェックを入れるのは実施した本人。

## 0. 事前準備

- [ ] [windows-ad-lab.md §4](../../evidence/templates/windows-ad-lab.md#4-greenfield-ad-ds--dns-forest-の構築)でフォレスト昇格済み（ADLAB-DC1 稼働中）
- [ ] [windows-ad-lab.md §7.2](../../evidence/templates/windows-ad-lab.md#72-ou--group--test-user-の安全な作成)でラボ OU（`PortfolioLab`）・グループ（`pf-ops-readers`）・ユーザー（`pf-user01`）作成済み
- [ ] [windows-ad-lab.md §9](../../evidence/templates/windows-ad-lab.md#9-dns-障害注入から-domain-参加復旧まで)でクライアント（ADLAB-CLI1）がドメイン参加済み
- [ ] DC 昇格時の DSRM 管理者パスワードを本人が安全に保管・入力できる
- [ ] ADLAB-DC1 へ追加仮想ディスク（20 GB 以上）を Hyper-V 側で取り付け済み（未初期化のままでよい）
- [ ] `hyperv/00-checkpoint-helpers.ps1` を dot-source し `New-AdLabCheckpoint -Name before-ad-design` を実行

## 1. 構築（4 章 構築手順書）

- [ ] [4.1 作業前確認](../08-ad-exercise-design.md#41-作業前確認)
- [ ] `scripts/01-ou-and-groups.ps1`（[4.2 OU 階層](../08-ad-exercise-design.md#42-ou-階層の作成)、[4.3 グループ](../08-ad-exercise-design.md#43-グループの作成とネストagdlp)、[4.4 オブジェクト移動](../08-ad-exercise-design.md#44-既存オブジェクトの新-ou-への移動)）
- [ ] `scripts/02-gpo-setup.ps1`（[4.5 GPO 作成](../08-ad-exercise-design.md#45-gpo-の作成と設定)、[4.6 リンク（DC 側）](../08-ad-exercise-design.md#46-gpo-のリンクとクライアント側の適用確認)）
- [ ] `scripts/02b-client-verify-gpo.ps1`（ADLAB-CLI1 側、4.6 クライアント側の適用確認・4.6-7 の手動確認）
- [ ] `scripts/03-password-policy-and-pso.ps1`（[4.7 パスワードポリシー・PSO](../08-ad-exercise-design.md#47-パスワードロックアウトポリシーの確認と-pso-の作成)）
- [ ] `scripts/04-fsmo-and-health-check.ps1`（[4.8 FSMO・ヘルスチェック](../08-ad-exercise-design.md#48-fsmo-ロールとヘルスチェック)。T-24/T-25 も続けて行うなら `-InjectDnsFault`）
- [ ] `scripts/05-system-state-backup.ps1`（[4.9 追加ディスク・バックアップ](../08-ad-exercise-design.md#49-追加ディスクとシステム状態バックアップ)）
- [ ] `hyperv/00-checkpoint-helpers.ps1` の `New-AdLabCheckpoint -Name ad-backup-taken` を実行
- [ ] [4.11 作業後確認](../08-ad-exercise-design.md#411-作業後確認)

## 2. 試験（5 章 試験項目書、T-01〜T-23）

正常系・単体・結合・総合（[03 §4 の異常系 3 割以上](../03-build-process.md#異常系を必ず入れる理由)の原則どおり、全 26 件中 8 件が異常系）:

- [ ] T-01〜T-12（[単体試験](../08-ad-exercise-design.md#5-試験項目書)、OU・グループ・GPO・PSO・FSMO・バックアップの確認）
- [ ] T-13〜T-16（結合試験、GPO 適用・AGDLP 経由の権限付与・PSO 実効値）
- [ ] T-17〜T-18（総合試験、DC/クライアント再起動後の保持確認）
- [ ] T-19〜T-20（異常系、OU 削除保護・ロックアウトしきい値超過）
- [ ] T-21（異常系、PSO 優先順位の競合。競合確認用の 2 つ目の PSO は試験後に削除する）
- [ ] T-22〜T-23（異常系、GPO 誤リンクの検知と復旧・存在しない OU へのリンク失敗確認）
- [ ] T-24〜T-25（異常系、DC 側 DNS 障害の検知と復旧。`scripts/04-fsmo-and-health-check.ps1 -InjectDnsFault` で実施）

## 3. 権威復元演習（4.10、T-26）— 別セッション推奨

**この節は DSRM への再起動を 2 回伴う、本演習で最もリスクが高い区分。開始前に
`ad-backup-taken` チェックポイントと DSRM パスワードを再確認すること。**

- [ ] `scripts/06a-restore-drill-pre-dsrm.ps1`（テストオブジェクト作成 → 再バックアップ → 誤削除 → DSRM 再起動）
- [ ] DSRM でローカル `.\Administrator`（DSRM パスワード）でサインイン
- [ ] `scripts/06b-restore-drill-in-dsrm.ps1 -BackupVersion <06a で控えたバージョン識別子>`（非権威復元 → 権威復元マーキング → 通常起動へ復帰）
- [ ] ドメインアカウントでサインイン
- [ ] `scripts/06c-restore-drill-post-dsrm.ps1`（復旧確認、T-26 に対応）
- [ ] `hyperv/00-checkpoint-helpers.ps1` の `New-AdLabCheckpoint -Name ad-design-complete` を実行

## 4. 完了後の更新（8 章）

詳細は [8 章 実施ステータスと次のアクション](../08-ad-exercise-design.md#8-実施ステータスと次のアクション)を参照。

- [ ] [evidence-template.md](./evidence-template.md) に実測結果を記入
- [ ] [7 章 証跡採録計画](../08-ad-exercise-design.md#7-証跡採録計画)のとおり windows-ad-lab.md のコピーへ統合する
- [ ] [08-ad-exercise-design.md 5 章](../08-ad-exercise-design.md#5-試験項目書)の実測結果欄を埋めるか、実施記録ファイルへのリンクを追加
- [ ] [08-ad-exercise-design.md 8 章](../08-ad-exercise-design.md#8-実施ステータスと次のアクション)の「現在の状態」を実機実施済みの内容に更新
- [ ] [STATUS.md](../../../STATUS.md) の該当セクションを更新
- [ ] [学習プラン README](../README.md) の 08 に関する記述を更新
- [ ] [志望トラックと証跡の対応](../../target-roles.md)優先 3（IT サポート・社内 SE 補助）の Windows 実機出力欄を更新
- [ ] 詰まった箇所は本人が [LEARNINGS.md](../../../LEARNINGS.md) に記録する（AI は代筆しない）

## タイムテーブルの目安

詳細は [6 章 実施タイムテーブルと中断基準](../08-ad-exercise-design.md#6-実施タイムテーブルと中断基準)を参照。
中断基準（30 分ルール、DSRM 関連の慎重な扱い）は必ず先に読む。権威復元演習（4.10）は
別セッションに分けることを前提に時間割を組んでいる。
