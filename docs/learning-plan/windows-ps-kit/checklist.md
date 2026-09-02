# 06 Windows/PowerShell 演習 実施チェックリスト（進捗管理用）

> **これは正本ではない。** コマンド・想定結果・判定基準は必ず
> [06 シェルスクリプト演習設計](../06-shell-scripting-exercise-design.md) 本体を見る。
> このチェックリストは、作業中に長い設計書を都度スクロールしなくて済むように
> 節番号だけを並べた進捗管理用の要約であり、内容が食い違った場合は
> **設計書側を正とする**（[STATUS.md §0 ルール 8](../../../STATUS.md#0-更新の運用ルール2026-07-03-制定)と同じ考え方）。
>
> このチェックリスト自体は 2026-08-26 に AI 支援セッションで作成した。4.1・4.2・4.3 演習A の
> チェック項目は AI 支援セッションの Linux コンテナ上（Windows 実機ではない）で実施済みだが、
> 実機での再実施はまだ無い。4.3 演習B 以降・4.4 は未使用の雛形で、チェックを入れた実績はまだ無い。

## 0. 事前準備

- [ ] [1 章 前提条件](../06-shell-scripting-exercise-design.md#前提条件)を満たしている（Windows 11 または Windows Server 評価版、[01 学習環境 §6](../01-environment.md#6-windows-server-の学習環境任意)）
- [ ] PowerShell のバージョンを確認済み（演習C・演習D はバージョン依存の制約があるため、[06 文書 4.3 演習C-1 の版制約](../06-shell-scripting-exercise-design.md#演習-c-1-イベントログの操作)を先に読む）

## 1. Level 1・Level 2（4.1・4.2）

- [x]（AI 支援セッション・Linux コンテナで実施済み）L1-1〜L1-5 の全ハンズオン
- [x]（同上）L2-1〜L2-5 の全ハンズオン（L2-2 は `Get-Service` が Linux 版 PowerShell 7 に存在しないため `Get-Item` で代替）
- [ ] 実機（Windows）で L1-1〜L1-5・L2-1〜L2-5 を再実施し、差分があれば記録する

## 2. 演習A `Backup-Rotate.ps1`（4.3）

- [x]（AI 支援セッション・Linux コンテナで実施済み）A-1 圧縮バックアップ（展開して元と一致することを確認）
- [x]（同上）A-2 世代管理（Keep を超えた分だけ削除されることを確認）
- [x]（同上）A-3 排他制御（2 重起動時に 2 つ目が拒否されることを確認）
- [x]（同上）A-4 ログ記録（transcript の記録、異常系での transcript 終了と Mutex 解放を確認）
- [ ] 実機（Windows）で A-1〜A-4 を再実施し、差分があれば記録する

## 3. 演習B・演習C（4.3、サービス・イベントログ）

- [ ] S-1〜S-5（サービス操作、単体の Windows 端末）
- [ ] E-1〜E-4（イベントログ操作。Windows PowerShell 5.1 が前提。[版制約](../06-shell-scripting-exercise-design.md#演習-c-1-イベントログの操作)を参照）
- [ ] E-5（サービス異常のイベント記録への応用）

## 4. 演習C（フラッグシップ）`Invoke-EnvironmentCheck.ps1`（4.3）

- [ ] C-1 骨組み（パラメータ未指定時の停止）
- [ ] C-2 ディスク使用率チェック（`flagship/Invoke-EnvironmentCheck.ps1` の `Test-DiskUsage` はこの AI 支援セッションで Linux コンテナ上、単体関数として実行確認済み。Windows 実機でスクリプト全体として動くかは未確認）
- [ ] C-3 サービス稼働チェック（`Get-Service` 依存、未実行）
- [ ] C-4 証明書残日数チェック（`Cert:` ドライブ依存、未実行）
- [ ] C-5 ログとサマリ集約
- [ ] C-6 イベントログへの記録（`Write-EventLog` 依存、未実行）
- [ ] C-7 終了コード決定
- [ ] C-8 タスクスケジューラ登録（`register-task/Register-EnvironmentCheckTask.ps1`、未実行）
- [ ] T-01〜T-14（試験項目書、[06 文書](../06-shell-scripting-exercise-design.md#試験項目書)）

## 5. AD ラボドメインの構築（前提、Level 4 開始前）

- [ ] [Windows / AD 公開再現ラボ §4](../../evidence/templates/windows-ad-lab.md#4-greenfield-ad-ds--dns-forest-の構築)の Greenfield 手順でラボドメイン（`ad.example.test` / `ADLAB`）を構築済み
- [ ] ラボ専用 OU（`PortfolioLab`）・接頭辞（`pf-`）を作成済み

## 6. 演習D（4.4、AD 基礎操作）

- [ ] D-1 ドメイン・OU の確認
- [ ] D-2 ユーザーの読み取り（`-SearchBase` の指定漏れを実演）
- [ ] D-3 ユーザーの作成
- [ ] D-4 グループへの追加（`Add-ADGroupMember` の重複エラーと `Get-ADGroupMember` 事前確認）
- [ ] D-5 OU 間の移動

## 7. 演習E（フラッグシップ）`New-LabUserBatch.ps1`（4.4）

- [ ] E-1 骨組み・CSV 読み込み（`flagship/New-LabUserBatch.ps1` の列検証・接頭辞判定・グループ名導出ロジックはこの AI 支援セッションで Linux コンテナ上、AD 非依存部分のみ実行確認済み。`sample-data/new-lab-users.csv` を使用）
- [ ] E-2 事前確認（fail-closed、`Get-ADDomain` 依存、未実行）
- [ ] E-3 重複確認（`Get-ADUser` 依存、未実行）
- [ ] E-4 ユーザー作成（`New-ADUser` 依存、未実行）
- [ ] E-5 グループ追加（`Add-ADGroupMember` 依存、未実行）
- [ ] E-6 結果サマリと棚卸し（`Get-ADUser` の 90 日未ログイン抽出、未実行）
- [ ] T-01〜T-12（試験項目書、[06 文書](../06-shell-scripting-exercise-design.md#試験項目書-2)）

## 8. 完了後の更新（8 章）

詳細は [06 文書 8 章 実施ステータスと次のアクション](../06-shell-scripting-exercise-design.md#8-実施ステータスと次のアクション)を参照。

- [ ] [evidence-template.md](./evidence-template.md) に実測結果を記入し、[7 章 証跡採録計画](../06-shell-scripting-exercise-design.md#7-証跡採録計画)の保管先へ配置
- [ ] [06-shell-scripting-exercise-design.md](../06-shell-scripting-exercise-design.md)の各試験項目書の実測結果欄を埋めるか、実施記録ファイルへのリンクを追加
- [ ] [STATUS.md](../../../STATUS.md)を更新
- [ ] [02 フェーズ別カリキュラム W4 / W18](../02-curriculum.md#w4-ディスクファイルシステムシェルスクリプト)からリンク
- [ ] 詰まった箇所は本人が [LEARNINGS.md](../../../LEARNINGS.md) に記録する（AI は代筆しない）

## タイムテーブルの目安

詳細は [06 文書 6 章 実施タイムテーブルと中断基準](../06-shell-scripting-exercise-design.md#6-実施タイムテーブルと中断基準)を参照。Windows セッション 1（Level 1〜3）・Windows セッション 2（Level 4・AD）に分かれる。
