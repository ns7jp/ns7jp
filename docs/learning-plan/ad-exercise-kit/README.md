# 08 AD構築演習 実施キット（Hyper-V / Windows Server 向け）

> **状態: 一部は AI 支援セッションの作業環境で構文検証済み、実行そのものは未実施の雛形
> （2026-08-26 に AI 支援セッションで作成）。**
> このキットを置いただけでは [08 AD構築演習設計](../08-ad-exercise-design.md)の実施ステータスは
> 変わらない。実施ステータスは、本人が実機（Hyper-V 上の ADLAB-DC1、windows-ad-lab.md §4・§7・§9 済み）
> で 4 章を実際に通した後、[8 章の手順](../08-ad-exercise-design.md#8-実施ステータスと次のアクション)に
> 従って更新する。

## これは何か

[08 AD構築演習設計](../08-ad-exercise-design.md)の 4 章（構築手順書）は、コマンドと想定結果を
表形式で具体化した設計書だが、実際の実行には次が必要でこの AI 支援セッションからは到達できない。

1. **Hyper-V ホストと、その上で稼働する ADLAB-DC1（`windows-ad-lab.md` §4 でフォレスト昇格済み）**。
   この AI 支援セッションの実行環境には Hyper-V が無く、実機 VM の作成・OS インストール・
   AD DS 昇格ができない（[phase1-kit](../phase1-kit/README.md)・[python-ops-kit](../python-ops-kit/README.md)と
   同じ制約）。
2. **`ActiveDirectory` / `GroupPolicy` PowerShell モジュール**。これらは Windows Server の RSAT 機能
   （AD DS 昇格時に導入される）であり、Linux 上の PowerShell 7 には存在しない。

一方、この AI 支援セッションには **PowerShell 7（Core、`v7.4.6`）を公式 GitHub Releases から
tar.gz で導入**でき、[`windows-ps-kit`](../windows-ps-kit/README.md)が使ったのと同じ方法で
**全 11 本の `.ps1` ファイルを `[System.Management.Automation.Language.Parser]::ParseFile()` で
構文検証**した（後述）。`ActiveDirectory`/`GroupPolicy` に依存する cmdlet 呼び出しそのものは
実行できていないが、構文エラー・括弧の対応漏れ・引数の並び間違いは検出できる検証段階である。

このディレクトリは、実施そのものを代行するのではなく、**実施時にコピー&ペーストの手間と
タイプミスを減らすための補助ファイル**を集めたものである。[08 章 4 章 構築手順書](../08-ad-exercise-design.md#4-構築手順書)の
記述をコマンド単位で自動化・省略するものではなく、各スクリプトは 4 章の該当節をそのまま
関数・スクリプト化したものである。

## 実行済み範囲の検証方法

Linux コンテナへ PowerShell 7.4.6（公式 tar.gz、GitHub Releases から取得）を展開して実行した。

1. **構文検証**: 11 本すべてのスクリプトを `[System.Management.Automation.Language.Parser]::ParseFile()`
   でパースし、構文エラーが無いことを確認した。UTF-8 BOM 付与の**前後両方**で再検証している
   （後述「発見した不具合」の教訓のとおり、BOM 付与そのものが構文を壊していないことを確認するため）。
2. **ネイティブコマンドへの引数展開の実機テスト**: `wbadmin` 等の実体は無いが、PowerShell の
   トークン化の挙動そのものは Linux 上の PowerShell 7 でも Windows と同じである。`Write-Output` を
   `wbadmin` の代わりに使い、変数展開を含む引数がコマンドへ何個の引数として渡るかを実際に確認した
   （後述「発見した不具合」参照）。
3. **ntdsutil への標準入力パイプの疎通確認**: `ntdsutil` の代わりに `cat` を使い、here-string で
   組み立てたコマンド列が意図どおりの行に分解されて渡ることを確認した。

`PSScriptAnalyzer` によるリンティングは、この環境からインストール済み PowerShell 7 に
`PSGallery` リポジトリが未登録で到達できなかったため実施していない
（[windows-ps-kit README](../windows-ps-kit/README.md#実行済み範囲の検証方法)と同じ制約）。

## 未実行範囲の検証方法

`ActiveDirectory`/`GroupPolicy` モジュール、`dcdiag`/`repadmin`/`netdom`/`wbadmin`/`ntdsutil`/`bcdedit`
の実体、Hyper-V の `Checkpoint-VM` 系コマンドレットは、いずれもこの環境には存在しないため
**一度も実行していない**。構文検証（上記）を行っただけで、cmdlet の実際の戻り値・エラーメッセージ・
Windows Server バージョン差は未検証（[phase1-kit README の未検証の範囲](../phase1-kit/README.md#未検証の範囲)と
同じ制約）。

## 発見した不具合（構文検証の過程で）

**`wbadmin` へのネイティブコマンド引数展開で、ドライブレターのトークン化に問題を発見した。**
`-backupTarget:${DriveLetter}:` のように、波かっこで囲んだ変数参照の直後にコロンを続けて
ネイティブコマンドの**引用符なし引数**として書くと、PowerShell はこれを `-backupTarget:` と
`E:` の**2 個の引数**に分割してしまう（実際に `Write-Output` で代替実行して確認した）。

```powershell
# 事故になる書き方（2 引数に分割される）
wbadmin start systemstatebackup -backupTarget:${DriveLetter}: -quiet

# 正しい書き方（変数展開を先に文字列として組み立ててから渡す）
$backupTargetArg = "-backupTarget:${DriveLetter}:"
wbadmin start systemstatebackup $backupTargetArg -quiet
```

[08 AD構築演習設計](../08-ad-exercise-design.md)本体のコマンド例（`E:` という固定のドライブレター
を直接書いている箇所）はこの問題の影響を受けない（変数展開を伴わないため）。影響があったのは、
このキットで**パラメータ化**した `05-system-state-backup.ps1`・`06a-restore-drill-pre-dsrm.ps1`・
`06b-restore-drill-in-dsrm.ps1` の 3 本のみで、いずれも上記の書き方へ修正済みである。

## 中身

| ファイル / ディレクトリ | 対応する設計書の節 | 用途 | この環境での状態 |
| --- | --- | --- | --- |
| [`checklist.md`](./checklist.md) | 4〜8 章 | 実施中に開いておく進捗チェックリスト（正本ではない） | — |
| [`evidence-template.md`](./evidence-template.md) | 5・7 章 | 実測結果・エビデンスの記入用テンプレート | — |
| `hyperv/00-checkpoint-helpers.ps1` | [4.1-5・4.9-6・4.11-5](../08-ad-exercise-design.md#41-作業前確認) | ADLAB-DC1 のチェックポイント作成・復元・一覧 | 構文検証済み |
| `scripts/01-ou-and-groups.ps1` | [4.2〜4.4](../08-ad-exercise-design.md#42-ou-階層の作成) | OU 階層・AGDLP グループ・既存オブジェクトの移動 | 構文検証済み |
| `scripts/02-gpo-setup.ps1` | [4.5〜4.6（DC 側）](../08-ad-exercise-design.md#45-gpo-の作成と設定) | GPO 作成・レジストリ値設定・リンク | 構文検証済み |
| `scripts/02b-client-verify-gpo.ps1` | [4.6（クライアント側）](../08-ad-exercise-design.md#46-gpo-のリンクとクライアント側の適用確認) | ADLAB-CLI1 での `gpupdate`/`gpresult`/RSoP 確認 | 構文検証済み |
| `scripts/03-password-policy-and-pso.ps1` | [4.7](../08-ad-exercise-design.md#47-パスワードロックアウトポリシーの確認と-pso-の作成) | 既定パスワードポリシー確認・PSO 作成 | 構文検証済み |
| `scripts/04-fsmo-and-health-check.ps1` | [4.8](../08-ad-exercise-design.md#48-fsmo-ロールとヘルスチェック) | FSMO 確認・`dcdiag`/`repadmin`（`-InjectDnsFault` で T-24/T-25 も実施可） | 構文検証済み |
| `scripts/05-system-state-backup.ps1` | [4.9](../08-ad-exercise-design.md#49-追加ディスクとシステム状態バックアップ) | 追加ディスク初期化・システム状態バックアップ取得 | 構文検証済み（`wbadmin` 引数展開の不具合を修正済み） |
| `scripts/06a-restore-drill-pre-dsrm.ps1` | [4.10-1〜4.10-4](../08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧) | テストオブジェクト作成・再バックアップ・誤削除・DSRM 再起動 | 構文検証済み（同上） |
| `scripts/06b-restore-drill-in-dsrm.ps1` | [4.10-5〜4.10-7](../08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧) | DSRM 内での非権威復元・権威復元マーキング・通常起動へ復帰 | 構文検証済み（同上、`ntdsutil` パイプ疎通確認済み） |
| `scripts/06c-restore-drill-post-dsrm.ps1` | [4.10-8](../08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧) | 通常起動後の復旧確認 | 構文検証済み |
| `scripts/07-rollback.ps1` | [4.12](../08-ad-exercise-design.md#412-切り戻し手順) | GPO リンク解除・PSO 削除（既定）、OU 削除（`-RemoveOrganizationalUnits` 指定時） | 構文検証済み |

## 使い方の想定順序

1. [windows-ad-lab.md §4・§7・§9](../../evidence/templates/windows-ad-lab.md)が完了済みであることを確認する
   （ADLAB-DC1 稼働中、ラボ OU・グループ・ユーザー作成済み、クライアント ADLAB-CLI1 がドメイン参加済み）
2. Hyper-V ホストで `hyperv/00-checkpoint-helpers.ps1` を dot-source し、`before-ad-design` を取得する
3. ADLAB-DC1 の管理者 PowerShell で `scripts/01-ou-and-groups.ps1` → `scripts/02-gpo-setup.ps1` の順に実行する
4. ADLAB-CLI1 の管理者 PowerShell で `scripts/02b-client-verify-gpo.ps1` を実行する
5. ADLAB-DC1 側へ戻り `scripts/03-password-policy-and-pso.ps1` → `scripts/04-fsmo-and-health-check.ps1`
   （DNS 障害注入まで行うなら `-InjectDnsFault`）→ `scripts/05-system-state-backup.ps1` の順に実行する
6. `hyperv/00-checkpoint-helpers.ps1` で `ad-backup-taken` を取得する
7. `checklist.md` を開きながら [5 章 試験項目書](../08-ad-exercise-design.md#5-試験項目書)の T-01〜T-23 を実施する
8. **別セッションで**（[1 章の想定所要時間](../08-ad-exercise-design.md#想定所要時間)のとおり）
   `scripts/06a-restore-drill-pre-dsrm.ps1` → DSRM でサインイン → `scripts/06b-restore-drill-in-dsrm.ps1`
   （`-BackupVersion` に 06a で控えたバージョン識別子を指定）→ 通常起動 →
   `scripts/06c-restore-drill-post-dsrm.ps1` の順に実行し、T-26 を実施する
9. `hyperv/00-checkpoint-helpers.ps1` で `ad-design-complete` を取得する
10. `evidence-template.md` に実測結果を記入し、[7 章 証跡採録計画](../08-ad-exercise-design.md#7-証跡採録計画)の
    とおり windows-ad-lab.md のコピーへ統合する
11. 完了後、[8 章](../08-ad-exercise-design.md#8-実施ステータスと次のアクション)のとおり STATUS.md・
    学習プラン README を更新する

## このキットに含まれないもの

- Windows Server 評価版の ISO そのもの、Hyper-V VM の新規作成（[windows-ad-lab.md](../../evidence/templates/windows-ad-lab.md)・
  [phase1-kit](../phase1-kit/README.md)と同じ理由で、セットアップの自動化は意図的に含めていない）
- フォレスト昇格・最小 OU/グループ/ユーザー作成・クライアントのドメイン参加そのもの
  （[windows-ad-lab.md §4・§7・§9](../../evidence/templates/windows-ad-lab.md)を使う）
- 実施結果そのもの（本人が実機で実施して記入する）

## 未検証の範囲

`ActiveDirectory`/`GroupPolicy` モジュール、`dcdiag`/`repadmin`/`netdom`/`wbadmin`/`ntdsutil`/`bcdedit`、
Hyper-V の `Checkpoint-VM` 系コマンドレットは、Windows 実行環境にも Hyper-V ホストへのアクセスにも
この AI 支援セッションからは到達できないため、**一度も実行していない**。構文検証（上記）は行ったが、
実際の挙動・戻り値の型・エラーメッセージ・Windows/Hyper-V のバージョン差は未検証
（[phase1-kit README の未検証の範囲](../phase1-kit/README.md#未検証の範囲)と同じ制約）。

特に、次の 3 点は構文としては妥当でも実機での挙動が未確認であるため、実施時は注意して見ること。

- `06a`/`06b` の DSRM 再起動・DSRM サインイン・`ntdsutil` の権威復元マーキングは、[独立レビューで
  手順の順序自体は Microsoft の一次情報と突き合わせて確認済み](../08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧)
  だが、このキットのスクリプトとしての実行は未検証
- `04-fsmo-and-health-check.ps1` の `-InjectDnsFault` は DNS Server サービスを実際に停止する。
  単一 DC ラボでは名前解決全体が一時的に止まるため、実施前に必ずチェックポイントを取得すること
- `07-rollback.ps1` の `-RemoveOrganizationalUnits` は削除保護を解除したうえで OU を削除する。
  対象がラボ OU 配下であることを実行前に目視で確認すること

実施時に画面の表記やエラーが実際と異なる場合は、実際の表記を優先し、差分を本人が
[LEARNINGS.md](../../../LEARNINGS.md) へ残す。
