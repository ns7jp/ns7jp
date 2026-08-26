# Phase 1 演習 実施キット（Hyper-V 向け）

> **状態: 未使用の雛形（2026-08-26 に AI 支援セッションで作成）。**
> このキットを置いただけでは [05 Phase 1 演習設計](../05-phase1-exercise-design.md)の実施ステータスは変わらない。
> 実施ステータスは、空の VM への Ubuntu Server 24.04 の実インストールと 4〜5 章を実際に通した後、
> 本人が [8 章の手順](../05-phase1-exercise-design.md#8-実施ステータスと次のアクション)に従って更新する。

## これは何か

[05 Phase 1 演習設計](../05-phase1-exercise-design.md)は空の VM から `lab-base01` を構築する演習の設計書だが、
実際の VM 作成・OS インストールは Hyper-V を持つ本人の PC でしか行えない
（この AI 支援セッションの実行環境には KVM/qemu が無く、VirtualBox/Hyper-V での実機 VM 作成ができない）。

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

1. Hyper-V ホスト（Windows PC）で PowerShell を管理者として開き、`hyperv/00-create-internal-switch.ps1` → `hyperv/01-create-vm.ps1` を実行する
2. Hyper-V マネージャーから VM に接続し、Subiquity インストーラで OS を手作業でインストールする（[4 章 構築手順書](../05-phase1-exercise-design.md#4-構築手順書)の 3-1〜3-3。SSH 鍵は取り込まない）
3. `checklist.md` を開きながら、[4 章 構築手順書](../05-phase1-exercise-design.md#4-構築手順書)を上から実施する。`netplan/` と `sshd/` のファイルはこの過程でゲスト側にコピーする
4. `hyperv/02-checkpoint-helpers.ps1` を dot-source して `key-login-ok` / `base-clean` / `before-drill` を取得する
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
