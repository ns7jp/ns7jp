# lab-base01 / LAB-WINOPS1 07 Python 運用自動化演習 実施記録（未記入テンプレート）

> **これは未記入のテンプレートであり、実施記録ではない。** 2026-08-26 に AI 支援セッションで
> 雛形として用意した。手順・期待結果の正本は
> [07 Python 運用自動化演習設計](../07-python-ops-automation-exercise-design.md) であり、このファイルには
> **転記しない**（内容が食い違うと二重管理になるため）。ここに書くのは実測結果・判定・実施日時・
> エビデンスへのリンクだけにする。
>
> [07 章の付録](../07-python-ops-automation-exercise-design.md#付録この作業環境での実行記録)に記載の
> Linux 側の実行結果は、**lab-base01 実機ではなくこの AI 支援セッション自身の作業環境（コンテナ）**での
> ものであり、このファイルが対象とする「実機での実施記録」とは別物である。実機で再実施した結果を
> このファイルに書くこと。
>
> 記入し終えたら、[7 章 証跡採録計画](../07-python-ops-automation-exercise-design.md#7-証跡採録計画)の方針どおり、
> Linux 側の作業ログは `server-monitor` の `docs/drills/logs/` へ、Windows 側は raw transcript を
> リポジトリ外（`Documents\portfolio-evidence-private`）へ保存し、マスク済みコピーだけを本リポジトリの
> `docs/evidence/` へ置く。マスキングは [証跡採録チェックリストの鉄則](../../evidence-capture-checklist.md#マスキングと記録の鉄則)に従う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| 実施者 | （記入） |
| 実施日時（開始・終了、JST） | （記入） |
| 対象ホスト | lab-base01 / LAB-WINOPS1 |
| 実行環境（仮想化基盤） | （記入。例: Hyper-V、Windows 11 Pro のビルド番号） |
| ホスト PC の OS / バージョン | （記入） |
| Windows Server 2022 評価版 ISO ファイル名・入手元 | （記入） |
| lab-base01 ゲスト OS 版数（`uname -r`） | （記入） |
| LAB-WINOPS1 ゲスト OS 版数（`[System.Environment]::OSVersion`） | （記入） |
| 参照した設計書のバージョン | [07-python-ops-automation-exercise-design.md](../07-python-ops-automation-exercise-design.md) 最終更新 2026-08-26 時点 |

## 構築（4 章）実施ログ

手順の内容・コマンド・想定結果は [4 章 構築手順書](../07-python-ops-automation-exercise-design.md#4-構築手順書)を参照。ここには結果だけを書く。

| 手順 No | 対象 | 結果（OK / NG） | 実施時刻 | 備考 |
| --- | --- | --- | --- | --- |
| 4.1-1〜4.1-3 作業前確認 | 共通 | | | |
| 4.2 手順1〜13 | routine.py（Linux） | | | |
| 4.3 W-1〜W-11 | routine.py（Windows） | | | |
| 4.4 手順1〜9 | backup.py（Linux） | | | |
| 4.4 手順10〜18 | backup.py（Windows） | | | |
| 4.5 L-1〜L-12 | check.py（Linux） | | | |
| 4.5 W-1〜W-8 | check.py（Windows） | | | |
| 4.6 定期実行登録の相互確認 | 共通 | | | |
| 4.7 作業後確認 | 共通 | | | |

## 試験項目書 実測結果

観点・前提条件・手順・期待結果は [5 章 試験項目書](../07-python-ops-automation-exercise-design.md#5-試験項目書)を参照。

### 5.1 routine.py（Linux）

| No | 実測結果 | 判定（PASS / FAIL / NOT RUN） | エビデンス | 実施日時 |
| --- | --- | --- | --- | --- |
| TRL-01 | | | | |
| TRL-02 | | | | |
| TRL-03 | | | | |
| TRL-04 | | | | |
| TRL-05 | | | | |
| TRL-06 | | | | |
| TRL-07 | | | | |
| TRL-08 | | | | |
| TRL-09 | | | | |
| TRL-10 | | | | |
| TRL-11 | | | | |
| TRL-12 | | | | |

### 5.2 routine.py（Windows）

| No | 実測結果 | 判定（PASS / FAIL / NOT RUN） | エビデンス | 実施日時 |
| --- | --- | --- | --- | --- |
| TW-01 | | | | |
| TW-02 | | | | |
| TW-03 | | | | |
| TW-04 | | | | |
| TW-05 | | | | |
| TW-06 | | | | |
| TW-07 | | | | |
| TW-08 | | | | |
| TW-09 | | | | |
| TW-10 | | | | |
| TW-11 | | | | |

### 5.3 backup.py

| No | 実測結果 | 判定（PASS / FAIL / NOT RUN） | エビデンス | 実施日時 |
| --- | --- | --- | --- | --- |
| TBK-01 | | | | |
| TBK-02 | | | | |
| TBK-03 | | | | |
| TBK-04 | | | | |
| TBK-05 | | | | |
| TBK-06 | | | | |
| TBK-07 | | | | |
| TBK-08 | | | | |
| TBK-09 | | | | |
| TBK-10 | | | | |
| TBK-11 | | | | |
| TBK-12 | | | | |

### 5.4 check.py（Linux / Windows 共通）

| No | 実測結果 | 判定（PASS / FAIL / NOT RUN） | エビデンス | 実施日時 |
| --- | --- | --- | --- | --- |
| TCK-01 | | | | |
| TCK-02 | | | | |
| TCK-03 | | | | |
| TCK-04 | | | | |
| TCK-05 | | | | |
| TCK-06 | | | | |
| TCK-07 | | | | |
| TCK-08 | | | | |
| TCK-09 | | | | |
| TCK-10 | | | | |
| TCK-11 | | | | |
| TCK-12 | | | | |
| TCK-13 | | | | |
| TCK-14 | | | | |

エビデンスのファイル名は [7 章の命名規則](../07-python-ops-automation-exercise-design.md#7-証跡採録計画)（`<試験No>_<対象>_<日付>.<拡張子>`）に従う。

## GUI 証跡（スクリーンショット）チェックリスト

- [ ] LAB-WINOPS1 VM 設定画面（vCPU 2 / メモリ 4GB / ディスク 40GB が確認できるもの）
- [ ] LAB-WINOPS1 Windows Server 2022 評価版セットアップ完了画面
- [ ] チェックポイント一覧（`base-clean` を含む）
- [ ] タスクスケジューラの登録内容（`NS7JP_RoutineCheck` / `ConfigBackup` / `MonitoringCheckPy` の `State`/`Last Result`）
- [ ] systemd timer 一覧（`systemctl list-timers` の routine-dryrun / backup-config / check-py）

## 切り戻し実施記録（4.8 章）

詳細は [4.8 章 切り戻し手順](../07-python-ops-automation-exercise-design.md#48-切り戻し手順)を参照。

| 項目 | 内容 |
| --- | --- |
| 実施したか | （Yes / No） |
| 判断基準に該当した項目 | （記入） |
| 切り戻し所要時間（実測） | （記入） |

## 発見した事実（症状 → 原因 → 対処）

設計書どおりに進まなかった箇所があれば、事実だけをここに残す。
**「学び」の言語化は本人が [LEARNINGS.md](../../../LEARNINGS.md) に書く（AI は代筆しない、[STATUS.md §0 ルール 7](../../../STATUS.md#0-更新の運用ルール2026-07-03-制定)）。**

| # | 症状 | 原因 | 対処 |
| --- | --- | --- | --- |
| | | | |

## 完了後に更新するもの

[8 章](../07-python-ops-automation-exercise-design.md#8-実施ステータスと次のアクション)のとおり。[checklist.md の 3 節](./checklist.md#3-完了後の更新8-章)も参照。

- [ ] [STATUS.md](../../../STATUS.md) の該当セクション
- [ ] [学習プラン README](../README.md) の Phase 5 に関する記述
- [ ] [02 フェーズ別カリキュラム W18 の記述](../02-curriculum.md#w18-シェルスクリプトによる定型化)欄からのリンク
- [ ] [志望トラックと証跡の対応](../../target-roles.md)優先 3（IT サポート・社内 SE 補助）の Windows 実機出力欄
- [ ] [07-python-ops-automation-exercise-design.md 5 章](../07-python-ops-automation-exercise-design.md#5-試験項目書)の実測結果欄、またはこのファイルへのリンク
