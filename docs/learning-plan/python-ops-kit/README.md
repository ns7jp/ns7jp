# 07 Python 運用自動化演習 実施キット（Windows / Hyper-V 向け）

> **状態: 未使用の雛形（2026-08-26 に AI 支援セッションで作成）。**
> このキットを置いただけでは [07 Python 運用自動化演習設計](../07-python-ops-automation-exercise-design.md)の
> 実施ステータスは変わらない。実施ステータスは、lab-base01 / LAB-WINOPS1 という実機の上で
> 4〜5 章を実際に通した後、本人が
> [8 章の手順](../07-python-ops-automation-exercise-design.md#8-実施ステータスと次のアクション)に従って更新する。

## これは何か

[07 Python 運用自動化演習設計](../07-python-ops-automation-exercise-design.md)の `routine.py` / `backup.py` /
`check.py` のうち、**Linux 側のロジックはこの AI 支援セッションの作業環境（Ubuntu 24.04 コンテナ）上で
実際に動かして確認済み**（[同ドキュメントの付録](../07-python-ops-automation-exercise-design.md#付録この作業環境での実行記録)）。
しかし次の2点はこのセッションでは実施できない。

1. **Windows 側の実行**: この AI 支援セッションには Windows 実行環境が無いため、`routine_windows.py` /
   `backup_windows.py` / タスクスケジューラ登録 / PowerShell（`Get-WinEvent` 呼び出しを含む）は
   一度も実行していない。構文と Linux 実装との対応関係を目視で確認したのみ。
2. **lab-base01 / LAB-WINOPS1 という実機（VM）での実行**: この AI 支援セッションの実行環境には
   Hyper-V が無く、実機 VM の作成・OS インストールができない（[05 Phase 1 演習設計](../05-phase1-exercise-design.md)の
   [phase1-kit](../phase1-kit/README.md)と同じ制約）。付録で実行した Linux 側の検証も、
   lab-base01 実機ではなくこの AI 支援セッション自身のコンテナ上での実行である。

lab-base01・LAB-WINOPS1 を動かす Hyper-V ホスト（物理 PC）自体にも、Windows 10 または 11 の
Pro・Enterprise・Education のいずれかが必要である。Home エディションでは Hyper-V 自体を有効化できない。

このディレクトリは、実施そのものを代行するのではなく、**実施時にコピー&ペーストの手間と
タイプミスを減らすための補助ファイル**を集めたものである。[07 章 4 章 構築手順書](../07-python-ops-automation-exercise-design.md#4-構築手順書)の
記述をコマンド単位で自動化・省略するものではない。

### このキットで新たに行ったファイル分割について

一言でいうと、**07 章が 1 ファイルにまとめて載せているコードを、07 章の表が本来示している複数ファイル構成に、
このキットで分けた**、というだけの話である。処理そのものを新しく作り直したわけではない。

- 07 章の「ファイル/関数構成」表が示す構成: `backup_common.py`（OS 共通の処理）/ `backup_linux.py`（Linux 固有の
  アーカイブ生成）/ `backup_windows.py`（Windows 固有のアーカイブ生成）/ `backup.py`（コマンドとして実行する入口）、
  および Windows 側の `routine_common.py`（OS 共通の処理）/ `routine_windows.py`（Windows 固有の本体）
- 07 章の中核コード例（[4.4 章](../07-python-ops-automation-exercise-design.md#44-backuppylinux--windows-共通コアと-os-別実装)の
  `backup.py`、[4.3 章](../07-python-ops-automation-exercise-design.md#43-routinepywindows-lab-winops1)の
  `routine_windows.py`）: 可読性のため、上記を 1 ファイルにまとめた形で載せている
- このキット: 前者の複数ファイル構成に分割して配置した（07 章のコード例が省略していた argparse の CLI 部分だけは、
  実際に動かせるよう `backup.py` に補ってある）

分割後の **Linux 側**（`linux/backup-tool/*`・`linux/routine/routine.py`・`linux/check/check.py`）は、
この AI 支援セッションの作業環境（Python 3.12.3 の venv）で分割済みファイル構成のまま実際に動かし、
次を確認した（lab-base01 実機ではなく、このセッション自身のコンテナ上での実行。07 章の付録が対象とする
正式な TRL/TBK/TCK 試験 ID の再実施ではなく、キット化後の疎通確認という位置付け）。

- `backup.py backup` → `backup.py restore` の往復でアーカイブが作成され、復元先が `diff -r` で元データと完全一致
- `check.py` の 6 チェック（cpu/memory/disk/http/tls_cert/log_errors）がすべて正常に実行され、
  `tls_cert` は付録と同じく `example.com` の実際の証明書残日数が閾値未満のため `WARNING`（コード動作は正常）
- `routine.py` の `check_disk_usage()` とドライラン `cleanup()`（`--apply` 無し）が正しく動作

**Windows 側**（`windows/` 配下）は、この AI 支援セッションには Windows 実行環境が無いため、
分割後・分割前を問わず一度も実行していない。構文と Linux 実装との対応関係を目視で確認したのみ。

## 中身

| ファイル / ディレクトリ | 対応する設計書の節 | 用途 |
| --- | --- | --- |
| [`checklist.md`](./checklist.md) | 4〜8 章 | 実施中に開いておく進捗チェックリスト（正本ではない） |
| [`evidence-template.md`](./evidence-template.md) | 5・7 章 | 実測結果・エビデンスの記入用テンプレート |
| `linux/routine/routine.py`, `routine.yaml` | [4.2 章](../07-python-ops-automation-exercise-design.md#42-routinepylinux-lab-base01) | lab-base01 配置用。ロジックは付録で実行確認済み |
| `linux/backup-tool/backup_common.py`, `backup_linux.py`, `backup.py`, `backup_config.yaml` | [4.4 章](../07-python-ops-automation-exercise-design.md#44-backuppylinux--windows-共通コアと-os-別実装) | lab-base01 配置用。このキットでの分割構成のまま疎通確認済み（backup→restore 往復、上記注記参照） |
| `linux/check/check.py`, `check.yaml` | [4.5 章](../07-python-ops-automation-exercise-design.md#45-checkpylinux--windows-共通) | lab-base01 配置用。OS 非依存の単一ファイル |
| `linux/systemd/*.service`, `*.timer` | 4.2・4.4・4.5 章 各構築手順書 | systemd unit 一式（routine-dryrun / backup-config / check-py） |
| `windows/routine/routine_common.py`, `routine_windows.py`, `config.example.yml` | [4.3 章](../07-python-ops-automation-exercise-design.md#43-routinepywindows-lab-winops1) | LAB-WINOPS1 配置用。**未実行**（上記注記参照） |
| `windows/backup-tool/backup_common.py`, `backup_windows.py`, `backup.py`, `backup_config.yaml` | [4.4 章](../07-python-ops-automation-exercise-design.md#44-backuppylinux--windows-共通コアと-os-別実装) | LAB-WINOPS1 配置用。**未実行** |
| `windows/check/check.py`, `check.yaml` | [4.5 章](../07-python-ops-automation-exercise-design.md#45-checkpylinux--windows-共通) | LAB-WINOPS1 配置用。`check.py` 自体は Linux 版と同一内容（OS 非依存） |
| `windows/register-tasks/*.ps1` | 4.3・4.4・4.5 章 各構築手順書 | タスクスケジューラ登録スクリプト（`schtasks` / `Register-ScheduledTask`）。**未実行** |
| `hyperv/00-create-lab-winops1-switch.ps1` | [1 章 前提条件](../07-python-ops-automation-exercise-design.md#前提条件) | LAB-WINOPS1 専用 Internal スイッチ作成（lab-base01 とは別セグメント）。**未実行** |
| `hyperv/01-create-lab-winops1-vm.ps1` | [3.1 章](../07-python-ops-automation-exercise-design.md#31-lab-winops1新規ホストの基本情報) | LAB-WINOPS1 VM 新規作成（OS インストール自体は手作業）。**未実行** |
| `hyperv/02-checkpoint-helpers.ps1` | [4.1 章](../07-python-ops-automation-exercise-design.md#41-作業前確認共通) | チェックポイントの作成・復元・一覧の関数。**未実行** |
| `hyperv/03-enable-external-nat.ps1` / `04-disable-external-nat.ps1` | [1 章 前提条件](../07-python-ops-automation-exercise-design.md#前提条件) | T-05 / TCK-05（TLS 証明書チェック正常系）のためだけの外部疎通の一時追加・撤去。**未実行** |

## 使い方の想定順序

> **実行ポリシーに関する注記**: Windows の既定の実行ポリシーでは `.ps1` の実行がブロックされることがある。
> `hyperv/*.ps1` や `windows/register-tasks/*.ps1` を実行する前に、管理者権限の PowerShell で次を一度実行しておく。
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

1. Hyper-V ホスト（Windows PC）で PowerShell を管理者として開き、`hyperv/00-create-lab-winops1-switch.ps1` →
   `hyperv/01-create-lab-winops1-vm.ps1` を実行する（lab-base01 側は既に [phase1-kit](../phase1-kit/README.md)で
   構築済みの前提。未構築なら先にそちらを実施する）
2. Hyper-V マネージャーから VM に接続し、Windows Server 2022 評価版のセットアップを手作業で進める
   （[3.1 章](../07-python-ops-automation-exercise-design.md#31-lab-winops1新規ホストの基本情報)、standalone・workgroup のまま）
3. `checklist.md` を開きながら、[4.1 章 作業前確認](../07-python-ops-automation-exercise-design.md#41-作業前確認共通)から
   順に進める。lab-base01 側は付録の実行結果を出発点にできるが、実機での再実施が必要
4. `linux/` 配下のファイルは lab-base01 へ、`windows/` 配下のファイルは LAB-WINOPS1 へそれぞれコピーする
5. `. .\hyperv\02-checkpoint-helpers.ps1` と、先頭にピリオドと半角スペースを置いて実行し（dot-source。
   スクリプト内で定義した関数を今の PowerShell に残す読み込み方）、`New-Winops1Checkpoint -Name base-clean` で
   LAB-WINOPS1 のチェックポイント（VM のその時点の状態を丸ごと保存したもの）`base-clean` を作る
6. [5 章 試験項目書](../07-python-ops-automation-exercise-design.md#5-試験項目書)を実施し、`evidence-template.md` に
   実測結果を記入する。T-05 / TCK-05 のときだけ `hyperv/03-enable-external-nat.ps1` →
   （確認後）`hyperv/04-disable-external-nat.ps1` を使う
7. 完了後、[8 章](../07-python-ops-automation-exercise-design.md#8-実施ステータスと次のアクション)のとおり
   STATUS.md・学習プラン・志望トラックと証跡の対応を更新する

## このキットに含まれないもの

- Windows Server 2022 評価版の ISO そのもの（Microsoft 評価版センターから取得する）
- Windows セットアップの自動化（[05 の phase1-kit](../phase1-kit/README.md)の Subiquity と同じ理由で、
  意図的に手作業のままにしてある）
- 実施結果そのもの（本人が実機で実施して記入する）

## 未検証の範囲

`windows/` 配下と `hyperv/*.ps1` は、Windows 実行環境にも Hyper-V ホストへのアクセスにもこの AI 支援セッションからは
到達できないため、**一度も実行していない**。Python の構文・PowerShell の構文は目視で確認したが、実際の挙動・
エラーメッセージ・Windows/Hyper-V のバージョン差は未検証（[phase1-kit README の未検証の範囲](../phase1-kit/README.md#未検証の範囲)と
同じ制約）。

`linux/` 配下のファイルは、上記「このキットで新たに行ったファイル分割について」のとおり、
このキットでの分割構成のまま AI 支援セッションの作業環境（コンテナ）で疎通確認済みだが、これは
**lab-base01 実機での実行ではない**。systemd timer による定期実行そのもの（`RuntimeDirectory` を含む
実際の unit 登録・発火）、`opsadmin`/`svc-monitor` という専用アカウントでの実行、[07 章 5 章](../07-python-ops-automation-exercise-design.md#5-試験項目書)の
正式な TRL/TBK/TCK 試験 ID としての採録は、いずれもまだ行っていない。

実施時に画面の表記やエラーが異なる場合は、実際の表記を優先し、差分を本人が [LEARNINGS.md](../../../LEARNINGS.md) へ残す。
