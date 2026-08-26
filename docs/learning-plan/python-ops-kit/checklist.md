# 07 Python 運用自動化演習 実施チェックリスト（進捗管理用）

> **これは正本ではない。** コマンド・想定結果・判定基準は必ず
> [07 Python 運用自動化演習設計](../07-python-ops-automation-exercise-design.md) 本体を見る。
> このチェックリストは、作業中に長い設計書を都度スクロールしなくて済むように
> 節番号だけを並べた進捗管理用の要約であり、内容が食い違った場合は
> **設計書側を正とする**（[STATUS.md §0 ルール 8「正本を決め、他は同期先とする」](../../../STATUS.md#0-更新の運用ルール2026-07-03-制定)と同じ考え方）。
>
> このチェックリスト自体は 2026-08-26 に AI 支援セッションで作成した未使用の雛形であり、
> チェックを入れた実績はまだ無い。実際にチェックを入れるのは実施した本人。
>
> Linux 側（`TRL-`/`TBK-`/`TCK-` の一部）は、[07 章の付録](../07-python-ops-automation-exercise-design.md#付録この作業環境での実行記録)のとおり
> この AI 支援セッションの作業環境（lab-base01 実機ではない）でロジックを検証済み。実機での
> 再実施が必要な項目には「(付録で検証済み)」と付記した。それ以外（`TW-` 全件、Windows 側の
> 構築手順、定期実行そのもの）はすべて未実施。

## 0. 事前準備

- [ ] lab-base01 が [05 Phase 1 演習設計](../05-phase1-exercise-design.md)（または [phase1-kit](../phase1-kit/README.md)）で構築済み
- [ ] Hyper-V: `hyperv/00-create-lab-winops1-switch.ps1` を実行し `lab-winops-internal`（192.168.58.0/24）を作成済み
- [ ] [1 章 前提条件](../07-python-ops-automation-exercise-design.md#前提条件)を満たしている（Windows ラボが lab-base01 と別セグメント、両ホストに Python 3.12 以降）
- [ ] 両ホストのスナップショット/チェックポイント取得（[4.1-3](../07-python-ops-automation-exercise-design.md#41-作業前確認共通)）

## 1. 構築（4 章 構築手順書）

### 1.1 routine.py

- [ ] Linux（[4.2 章](../07-python-ops-automation-exercise-design.md#42-routinepylinux-lab-base01)）: `linux/routine/routine.py`・`routine.yaml` を配置し手順1〜13を実施
- [ ] Windows（[4.3 章](../07-python-ops-automation-exercise-design.md#43-routinepywindows-lab-winops1)）: `hyperv/01-create-lab-winops1-vm.ps1` で VM 作成後、`windows/routine/*` を配置し W-1〜W-11 を実施。W-8 は `windows/register-tasks/register-routine-task.ps1` を使う

### 1.2 backup.py

- [ ] Linux（[4.4 章](../07-python-ops-automation-exercise-design.md#44-backuppylinux--windows-共通コアと-os-別実装)）: `linux/backup-tool/*` を配置し手順1〜9を実施
- [ ] Windows（同章）: `windows/backup-tool/*` を配置し手順10〜18を実施。手順16は `windows/register-tasks/register-backup-task.ps1` を使う

### 1.3 check.py

- [ ] Linux（[4.5 章](../07-python-ops-automation-exercise-design.md#45-checkpylinux--windows-共通)）: `linux/check/*` を配置し L-1〜L-12 を実施
- [ ] Windows（同章）: `windows/check/*` を配置し W-1〜W-8 を実施。W-6 は `windows/register-tasks/register-check-task.ps1` を使う
- [ ] ダミー HTTP 対象の準備（H-1〜H-4、[同章](../07-python-ops-automation-exercise-design.md#ダミー-http-対象の準備check_http-の試験に必要)）

### 1.4 相互確認・作業後確認・チェックポイント

- [ ] [4.6 章 定期実行登録のまとめと相互確認](../07-python-ops-automation-exercise-design.md#46-定期実行登録のまとめと相互確認)
- [ ] [4.7 章 作業後確認](../07-python-ops-automation-exercise-design.md#47-作業後確認)
- [ ] `hyperv/02-checkpoint-helpers.ps1` の `New-Winops1Checkpoint -Name base-clean` を実行

## 2. 試験（5 章 試験項目書）

正常系・単体・結合（[03 §4 の異常系 3 割以上](../03-build-process.md#異常系を必ず入れる理由)の原則どおり、各表の約半数が異常系）:

- [ ] TRL-01〜06（[5.1 章](../07-python-ops-automation-exercise-design.md#51-routinepylinux)、単体・結合。TRL-01〜05 は付録で検証済み、TRL-06 は systemd timer の実機確認が必要）
- [ ] TW-01〜06（[5.2 章](../07-python-ops-automation-exercise-design.md#52-routinepywindows)、単体・結合。全件未実施）
- [ ] TBK-01〜06（[5.3 章](../07-python-ops-automation-exercise-design.md#53-backuppy)、単体・結合・総合。TBK-01〜04・06 は付録で検証済み〈TBK-06 は手動起動版〉、TBK-05 は systemd timer の実機確認が必要）
- [ ] TCK-01〜08（[5.4 章](../07-python-ops-automation-exercise-design.md#54-checkpylinux--windows-共通)、単体・結合。TCK-01〜06 は付録で検証済み〈TCK-05 は条件不成立・コード動作は正常〉、TCK-07〜08 は定期実行の実機確認が必要）

異常系に入る前:

- [ ] `hyperv/02-checkpoint-helpers.ps1` の `New-Winops1Checkpoint -Name before-drill` を実行（LAB-WINOPS1）。lab-base01 側も同様の一時チェックポイントを取得する

異常系（[03 §4 の異常系 3 割以上](../03-build-process.md#異常系を必ず入れる理由)の原則どおり全体の約47%）:

- [ ] TRL-07〜12（付録で検証済み。実機での再現確認が必要）
- [ ] TW-07〜11（全件未実施。TW-09 は Security ログの権限確認、TW-11 はロック機構が未実装であることの確認）
- [ ] TBK-07〜12（付録で検証済み。TBK-08 は root/Administrator では再現しないため非管理者アカウントでの再実行が必要）
- [ ] TCK-09〜14（付録で検証済み）
- [ ] T-05 / TCK-05 実施時のみ `hyperv/03-enable-external-nat.ps1` → 確認後 `hyperv/04-disable-external-nat.ps1`
- [ ] 異常系の後始末（ダミーファイル削除、退避ファイルの復元、ロックファイル・chattr 属性の解除等）

## 3. 完了後の更新（8 章）

詳細は [8 章 実施ステータスと次のアクション](../07-python-ops-automation-exercise-design.md#8-実施ステータスと次のアクション)を参照。

- [ ] [evidence-template.md](./evidence-template.md) に実測結果を記入し、[7 章 証跡採録計画](../07-python-ops-automation-exercise-design.md#7-証跡採録計画)の保管先へ配置
- [ ] [07 章 5 章 試験項目書](../07-python-ops-automation-exercise-design.md#5-試験項目書)の実測結果欄を埋めるか、実施記録ファイルへのリンクを追加
- [ ] [07 章 8 章](../07-python-ops-automation-exercise-design.md#8-実施ステータスと次のアクション)の「現在の状態」を実機実施済みの内容に更新
- [ ] [STATUS.md](../../../STATUS.md) の該当セクションを更新
- [ ] [学習プラン README](../README.md) の Phase 5 に関する記述を更新
- [ ] [志望トラックと証跡の対応](../../target-roles.md)優先 3（IT サポート・社内 SE 補助）の Windows 実機出力欄を更新
- [ ] 詰まった箇所は本人が [LEARNINGS.md](../../../LEARNINGS.md) に記録する（AI は代筆しない）

## タイムテーブルの目安

詳細は [6 章 実施タイムテーブルと中断基準](../07-python-ops-automation-exercise-design.md#6-実施タイムテーブルと中断基準)を参照。中断基準（Windows VM セットアップ1時間ルール、環境トラブル30分ルール、7:15打ち切り）は必ず先に読む。lab-base01 側は付録の実行結果を出発点にできるため、実機での構築・単体試験は目安より短縮できる可能性がある。
