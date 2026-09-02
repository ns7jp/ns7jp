# Phase 1 演習 実施キット（Hyper-V 向け）

> **状態: 未使用の雛形（2026-08-26 に AI 支援セッションで作成）。**
> このキットを置いただけでは [05 Phase 1 演習設計](../05-phase1-exercise-design.md)の実施ステータスは変わらない。
> 実施ステータスは、空の VM への Ubuntu Server 24.04 の実インストールと 4〜5 章を実際に通した後、
> 本人が [8 章の手順](../05-phase1-exercise-design.md#8-実施ステータスと次のアクション)に従って更新する。

## これは何か

[05 Phase 1 演習設計](../05-phase1-exercise-design.md)は空の VM から `lab-base01` を構築する演習の設計書だが、
実際の VM 作成・OS インストールは Hyper-V を持つ本人の PC でしか行えない
（この AI 支援セッションの実行環境には KVM/qemu が無く、VirtualBox/Hyper-V での実機 VM 作成ができない）。

Hyper-V ホスト（物理 PC）自体にも、Windows 10 または 11 の Pro・Enterprise・Education のいずれかが必要である。
Home エディションでは Hyper-V 自体を有効化できないため、このキットは前提として使えない。

このディレクトリは、実施そのものを代行するのではなく、**実施時にコピー&ペーストの手間と
タイプミスを減らすための補助ファイル**を集めたものである。設計書の記述をコマンド単位で
自動化・省略するものではない（特に OS インストール〈3-3〉は Subiquity インストーラを
手作業で進める設計のままにしてある。自動化すると、意図的に「SSH 鍵を後から登録する」
「パスワード認証が一時的に有効な状態を経験する」という演習の目的が失われるため）。

## 中身

| ファイル / ディレクトリ | 対応する設計書の節 | 用途 |
| --- | --- | --- |
| [`checklist.md`](./checklist.md) | 4〜8 章 | 実施中に開いておく進捗チェックリスト（正本ではない） |
| [`evidence-template.md`](./evidence-template.md) | 5・7 章 | 実測結果・エビデンスの記入用テンプレート |
| `netplan/60-lab-static.yaml` | [3-5](../05-phase1-exercise-design.md#3-5-固定-ip-の設定) | 固定 IP 設定ファイルそのもの |
| `netplan/61-lab-test.yaml` | [P-3 / 付録 A-3 Q-4](../05-phase1-exercise-design.md#5-試験項目書) | 検証用セグメント（T-09 / T-13）の IP 設定ファイル |
| `sshd/00-lab-hardening.conf` | [3-8](../05-phase1-exercise-design.md#3-8-パスワード認証root-ログインの禁止) | SSH 強化用ドロップイン設定ファイル |
| `hyperv/00-create-internal-switch.ps1` | [付録 A-2](../05-phase1-exercise-design.md#a-2-ホストオンリー相当のネットワーク) | ホストオンリー相当の Internal スイッチ作成 |
| `hyperv/01-create-vm.ps1` | [付録 A-1](../05-phase1-exercise-design.md#a-1-vm-作成) | VM 新規作成（OS インストール自体は手作業） |
| `hyperv/02-checkpoint-helpers.ps1` | [付録 A-4](../05-phase1-exercise-design.md#a-4-スナップショットチェックポイント) | チェックポイントの作成・復元・一覧の関数 |
| `hyperv/03-test-segment-setup.ps1` | [付録 A-3](../05-phase1-exercise-design.md#a-3-検証用セグメントの一時追加p-1p-7-の代替) | 検証用セグメントの一時追加 |
| `hyperv/04-test-segment-teardown.ps1` | 同上 | 検証用セグメントの撤去 |

## 使い方の想定順序

> **実行ポリシーに関する注記**: Windows の既定の実行ポリシーでは `.ps1` の実行がブロックされることがある。
> `hyperv/*.ps1` を実行する前に、管理者権限の PowerShell で次を一度実行しておく。
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

1. Hyper-V ホスト（Windows PC）で PowerShell を管理者として開き、`hyperv/00-create-internal-switch.ps1` → `hyperv/01-create-vm.ps1` を実行する
2. Hyper-V マネージャーから VM に接続し、Subiquity インストーラで OS を手作業でインストールする（[4 章 構築手順書](../05-phase1-exercise-design.md#4-構築手順書)の 3-1〜3-3。SSH 鍵は取り込まない）
3. `checklist.md` を開きながら、[4 章 構築手順書](../05-phase1-exercise-design.md#4-構築手順書)を上から実施する。`netplan/` と `sshd/` のファイルはこの過程でゲスト側にコピーする
4. `hyperv/02-checkpoint-helpers.ps1` を **dot-source** で読み込み、`New-LabCheckpoint -Name key-login-ok` の
   ように呼び出してチェックポイントを作る。取得するタイミングは `checklist.md` に従う（`key-login-ok` は
   3-7 の鍵ログイン確認後、`base-clean` は 3-11 の再起動試験後、`before-drill` は 5 章の異常系に入る前）
   - **チェックポイントとは**: VM のその時点の状態を丸ごと保存したもの（VirtualBox のスナップショット相当）。
     手順を壊しても `Restore-LabCheckpoint -Name base-clean` のようにして、そこまで戻してやり直せる
   - **dot-source とは**: `.\hyperv\02-checkpoint-helpers.ps1` と普通に実行すると、スクリプトの中で定義した
     関数は実行が終わった瞬間に消える。先頭にピリオドと半角スペースを置いて
     `. .\hyperv\02-checkpoint-helpers.ps1` と書くと、関数が今の PowerShell に残り、続けて手で呼び出せる。
     この読み込み方を dot-source と呼ぶ
5. [5 章 試験項目書](../05-phase1-exercise-design.md#5-試験項目書)を実施し、`evidence-template.md` に実測結果を記入する（異常系は `hyperv/03-test-segment-setup.ps1` / `04-test-segment-teardown.ps1` を使う）
6. 完了後、[8 章](../05-phase1-exercise-design.md#8-実施ステータスと次のアクション)のとおり STATUS.md・学習プラン・02 フェーズ別カリキュラムを更新する

## このキットに含まれないもの

- Ubuntu Server 24.04 LTS の ISO そのもの（[公式サイト](https://releases.ubuntu.com/24.04/)から取得し、SHA256 を確認する）
- Subiquity インストーラの自動化（意図的に手作業のままにしてある。理由は上記）
- 実施結果そのもの（本人が実機で実施して記入する）

## 未検証の範囲

このキット自体（特に `hyperv/*.ps1`）は、Hyper-V ホストへのアクセスが無いこの AI 支援セッションでは
一度も実行していない。PowerShell の構文は目視で確認したが、cmdlet の実際の挙動・エラーメッセージ・
Windows/Hyper-V のバージョン差は未検証（[付録 A の冒頭注記](../05-phase1-exercise-design.md#付録-a-hyper-v-版の差分)と同じ制約）。
実施時に画面の表記やエラーが異なる場合は、実際の表記を優先し、差分を本人が [LEARNINGS.md](../../../LEARNINGS.md) へ残す。

ただし、このうち `00-create-internal-switch.ps1` と `01-create-vm.ps1` の 2 本については、2026-08-26 に
本人の実機で初回実行を行っている。そこで見つかった不具合は次の
「[実機で見つかった不具合（修正済み）](#実機で見つかった不具合修正済み)」にまとめた。

## 実機で見つかった不具合（修正済み）

2026-08-26 に本人の実機（Hyper-V ホスト）で初めて実行したところ、`hyperv/*.ps1` に**実バグが 2 件**
見つかり、いずれも修正済みである。一言でいうと、(1) 失敗しているのに「成功しました」と表示されていた、
(2) 日本語コメントが文字化けして構文エラーになり、スクリプトがそもそも動かなかった、の 2 つ。

### 1. 失敗しても成功メッセージが出ていた（`00-create-internal-switch.ps1`）

`New-VMSwitch` が権限不足（`VirtualizationException`）で失敗しても、
PowerShell の既定動作（非終了エラー）のままだと後続の行がそのまま実行され、失敗したのに
成功したかのようなメッセージ（`スイッチ 'lab-internal'（Internal）を作成しました。`）が出ていた。
`hyperv/*.ps1` 全 5 本に `$ErrorActionPreference = 'Stop'` と `try/catch` を追加し、
実際の成否を判定してから成功メッセージを出すよう修正した。元の権限エラー自体（Hyper-V の
実行権限・グループ設定の問題）はスクリプトの不具合ではなく、実施者側の環境の問題として残っている。

### 2. 文字コードの違いでスクリプトを読み込めなかった（`01-create-vm.ps1`）

`hyperv/*.ps1` は UTF-8（BOM 無し）で保存されていたが、Windows PowerShell 5.1（Windows に最初から
入っている方の PowerShell。後から別途インストールする PowerShell 7／pwsh とは別物）は、BOM の無い
`.ps1` をシステムの ANSI コードページ（日本語 Windows では Shift-JIS）として読み込む。
BOM とは、そのファイルが UTF-8 であることを示す先頭 3 バイトの目印（`EF BB BF`）のことである。
そのため UTF-8 の日本語コメント・文字列がバイト単位で誤読され、文字化けだけでなく `"` の対応がずれて
`文字列に終端記号 " がありません` 等の構文エラーにまで発展していた。`hyperv/*.ps1` 全 5 本の
先頭に UTF-8 BOM を追加して修正した。`netplan/*.yaml` と `sshd/*.conf` は Linux
ゲスト側で消費されるファイルであり、BOM を付けると `netplan apply` や `sshd` の設定読み込みが
壊れる可能性があるため、意図的に対象外にしている。
