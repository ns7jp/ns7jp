# 学習台帳の使い方

この台帳は「実施したこと」「証跡」「評価」を分けて残す道具です。教材を読んだだけ、自動テストが通っただけで学習者の合格にはしません。開始時は32条件と8段階のすべてが **NOT RUN（未実施）** です。

教材の入口は [育成システム](README.md)、能力IDの正本は [curriculum.json](curriculum.json)、評価者の手順は [評価手順](assessment.md) です。既存の著者のポートフォリオやCI結果を、学習者本人の実施証跡として転記しません。

## 1. 準備と保存場所

Node.js 22以上とGitを用意して、このリポジトリのルートで実行します。追加のnpmパッケージは不要です。CLI自体はネットワーク通信、VM作成、学習用コマンドの実行を行いません。

```powershell
node --version
git rev-parse HEAD
node scripts/server-engineer.mjs --help
node scripts/server-engineer.mjs check
node scripts/server-engineer.mjs init --learner learner01
node scripts/server-engineer.mjs report --learner learner01
```

`learner01` は例です。本人用に小文字の英数字、`_`、`-`からなる1〜64文字のIDを決めます。学習者、セッション、評価者のIDは同じ形式です。Windowsの予約名は使えません。`init` は既存台帳を上書きしません。

| 保存物 | 場所と意味 |
| --- | --- |
| 個人台帳 | `.local/server-engineer/learner01/progress.json`。試行と評価を追記 |
| 添付証跡 | 同じフォルダの `evidence/<UUID>.bin`。元ファイルの内容を複製 |
| 整理前の提出物 | 例: `.local/server-engineer/learner01/incoming/`。本人が用意 |
| 公開教材 | `docs/server-engineer/`。個人の実施記録を入れない |

`.local/` はGitの管理対象から除外します。公開リポジトリへ個人台帳や証跡を追加しません。バックアップが必要なら個人台帳フォルダ全体を本人の非公開の保管先へコピーします。JSONだけでは添付証跡の検証・復元はできません。OSのアクセス権は利用環境の設定にも依存します。

## 2. 実作業をしてから証跡を用意する

教材の手順を自分の隔離した演習環境で実施します。コマンド、出力、対象、時刻、期待結果、実際の結果、失敗、未確認部分を記録してください。ログ中のパスワード、秘密鍵、トークン、実在の顧客情報などを除去したコピーを台帳へ添付します。除去した箇所は `[REDACTED]` 等で示し、結果の意味が変わらない範囲で残します。

```powershell
New-Item -ItemType Directory -Force -Path .local/server-engineer/learner01/incoming
```

上のコマンドは提出先フォルダを作るだけです。実施結果や合格証跡は生成しません。以下は、本人が実際の実施ログ `se00-c1.txt` をその中へ保存した後に使う例です。記載値を実際の対象・セッション・結果へ置き換えます。

```powershell
node scripts/server-engineer.mjs record `
  --learner learner01 `
  --criterion SE00-C1 `
  --result PASS `
  --evidence .local/server-engineer/learner01/incoming/se00-c1.txt `
  --sanitized `
  --environment vm `
  --target "lab-web-01 / 自分の検証VM / OSと版は証跡内に記録" `
  --assistance guided `
  --session orientation-day1 `
  --note "実行場所・対象を説明した。期待結果、実測、未確認部分は添付ログに記載。"
```

これはPowerShellの例です。行末のバッククォートの後に空白を付けません。macOS/Linuxでは1行にまとめるか、行継続記号を `\` に置き換えます。

`--sanitized` は本人が秘密情報を除去済みと申告するフラグです。自動検出・マスキングは行いません。入力はリポジトリ配下の相対パスに限り、`..`、絶対パス、シンボリックリンク、ジャンクション、代替データストリームは拒否します。証跡は10MiB以下の通常ファイルで、空ファイル・空白だけのファイルは受け付けません。外部のログは確認・秘匿化してから、このリポジトリの `.local/` 配下へコピーしてください。

## 3. 結果・環境・支援量を正しく選ぶ

| 項目 | 値 | 記録する意味 |
| --- | --- | --- |
| 結果 | `PASS` | 当該条件の試験を実施し、期待結果を満たしたという本人の記録 |
| 結果 | `FAIL` | 試験したが期待結果を満たさない。原因未確定でも失敗を残す |
| 結果 | `BLOCKED` | 環境・権限・依存作業等により実施を進められない |
| 未記録 | `NOT RUN` | 実施記録がない。CLIの結果値として手入力しない |
| 環境 | `desk` / `local` | 机上検討／ホスト上の文書・コード作業。実行環境必須条件には充当しない |
| 環境 | `container` | コンテナでの実サービス実行。runtime条件を満たせる |
| 環境 | `vm` / `physical` / `cloud` | VM／物理機／クラウド上のOS実行。vm条件を満たせる |
| 支援 | `guided` | 手順や他人の助言に従った |
| 支援 | `ai` | AIから実作業の操作指示を受けた |
| 支援 | `independent` | 本人が判断した。公式資料と自作手順書の参照は可 |

`any` 条件はすべての環境を受け付けます。`runtime` 条件は `container/vm/physical/cloud`、`vm` 条件は `vm/physical/cloud` が必要です。`cloud` はクラウドVM等でOSの実行を観察した場合を指し、マネージドサービスの画面を見ただけではありません。

失敗・停止にも理由や観測内容の証跡ファイルを添付します。後から成功した場合は同じ能力IDで `record` をもう一度実行します。履歴を消さず、**後から追記された試行**を最新として判定します。古い実施日時のログを後日取り込んだ場合も、最後に追記したものが最新の判定対象です。過去ログの大量取り込みは順序を確認してください。

`PASS` と記録しても、要求環境や自立条件を満たさなければ段階は `REQUIREMENTS NOT MET` です。本人の結果と段階の判定を分けて表示します。

## 4. 実施日時と教材の版

試行には `recordedAt`（登録時刻）と `performedAt`（実施時刻）を別々に保存します。省略時の実施時刻は登録時刻です。既存ログの取り込みでは、本当の実施時刻をUTCで指定します。

```text
--performed-at 2026-09-04T03:00:00.000Z
--revision <実施時に用いた教材の完全なGit SHA>
```

日本時間12:00はUTC03:00です。UTC形式は `YYYY-MM-DDTHH:mm:ssZ` または `YYYY-MM-DDTHH:mm:ss.sssZ`。存在しない日付、時差のない曖昧な日時、未来の実施時刻を拒否します。日付を変えて合格条件を満たしたことにしません。

`--revision` を省略すると、教材フォルダがGitリポジトリのルートと一致することを確認してから、現在の `git rev-parse --verify HEAD` の完全SHAを保存します。過去ログでは実施時の40桁または64桁の小文字16進SHAを指定してください。Git管理外や、別のリポジトリ内へZIP・フォルダコピーを展開した場合は明示指定が必要です。親リポジトリのSHAを教材版として流用しません。指定SHAの形式を検査しますが、コミットの存在やその版で実施した事実は認証しません。未コミットの教材で実施した場合は、その差分を証跡に添付し、`--note` に未コミット差分があることを明記します。

SE07-C1とSE07-C2は、最新試行の **UTC日付とセッションIDの両方が異なる** 必要があります。日付だけ、セッション名だけを変えても満たせません。実際に別日に条件変更した再構築を行い、そのログを添付します。単にUTCの境界をまたいだことが再構築や自立性の証明になるわけではなく、評価者が内容も確認します。

## 5. 人による評価を記録する

同一段階の4条件が最新試行でPASSとなり、要求環境・支援量・前提段階を満たすと `READY FOR REVIEW` です。これだけでは段階のPASSにはなりません。本人以外の評価者が [評価手順](assessment.md) に従って、実演・説明・証跡を実際に確認します。

観察後、評価者ID、承認または差戻し、観察内容、秘匿化した評価記録を登録します。以下は評価者 `reviewer01` が実際に評価して記録を作った後の例です。

```powershell
node scripts/server-engineer.mjs review `
  --learner learner01 `
  --stage SE00 `
  --reviewer reviewer01 `
  --decision APPROVE `
  --evidence .local/server-engineer/learner01/incoming/se00-review.txt `
  --sanitized `
  --note "評価者が実際に確認した対象・問い・再実施・判断理由を記載する。"
```

実際の観察記録に置き換えてください。評価者不在なら `READY FOR REVIEW` のまま保持します。評価者の代わりにAIが名前を作り、承認を登録してはいけません。本人と同じ評価者IDをツールは拒否しますが、別IDが本当に別人かを認証する機能はありません。本人の学習記録と人による評価の申告を管理する仕組みです。

差戻しは `--decision REJECT` にし、観察した不足、補習先、再評価で見る内容を記録します。過去の差戻しは残ります。条件を満たした後に新たな観察を行い、承認を追記してください。

評価は登録時点の4件の試行IDに結び付きます。同じ条件を再実施すると、以前の承認は新しい試行に引き継がれません。最新が失敗なら `FAIL`、再び全条件を満たせば `READY FOR REVIEW` となり、再評価が必要です。前提段階のPASSが失われれば、後続段階も `WAITING PREREQUISITE` になります。

## 6. 日々の確認と週次レビュー

```powershell
node scripts/server-engineer.mjs report --learner learner01
node scripts/server-engineer.mjs check --learner learner01
node scripts/server-engineer.mjs report --learner learner01 --json
```

`report` は全段階、最新の条件結果、未充足の理由、次の行動を表示します。`--json` は他のローカル集計に渡すための形式です。未実施をゼロ点や合格に置き換えません。

`check` は教材の8ファイル・32能力ID・前提順序を検査します。`--learner` を付けると、さらに個人台帳の形式、既知ID、時刻、評価の結び付き、添付ファイルの存在・サイズ・SHA-256を検査します。`report` と追記時も、添付済み証跡の整合性を検査します。SHA不一致の台帳で判定を進めません。

週次には、最初の未合格段階から、直近の失敗、未実施、待ち理由、評価者待ちを確認します。「次に行う一つの試験」「利用する環境」「補習する理由」「次回確認日」を日誌へ書きます。本人が未実施の作業を予定だけでPASSへ更新しません。

## 7. エラーから戻る

| 表示例 | 対応 |
| --- | --- |
| `Unknown criterion` | [curriculum.json](curriculum.json) のSE能力IDを確認。既存計画のG番号は使わない |
| `Missing file` / `Empty evidence` | 実際のログを用意し、相対パスを確認。架空の出力で埋めない |
| `Evidence changed` | 台帳の添付コピーが変更されている。非公開バックアップから一致する原本を復元し、変更理由を記録。新しいSHAへ書き換えて整合性だけを取り繕わない |
| `Self-review forbidden` | 本人以外の実際の評価者を待つ。別名で自己承認しない |
| `WAITING PREREQUISITE` | 前提段階の未実施・失敗・評価待ちを解消する |
| `Earlier review is stale` | 最新試行を人が確認して新しい評価を記録する |
| `Curriculum changed` | 旧台帳と教材版を保存し、条件変更を比較して明示的な移行を設計する。この版は自動移行しない |
| `Ledger is locked` | 他の書込みの終了を待つ。異常終了時は利用中プロセスがないことを確認し、対象学習者の `write.lock` のみ取り除いて再試行 |
| `Ledger would exceed 10 MiB` | 現行台帳を保存したまま、履歴のアーカイブと明示的な移行を設計する。容量超過で現行台帳を上書きしない |
| `Cannot read Git HEAD` | Gitの導入・リポジトリを確認。既存ログなら実際の完全SHAを `--revision` で指定 |

JSONを手作業で編集して過去の失敗や日付を変えず、訂正理由を付けて再実施・追記します。保存は一時ファイルと置換で行い、書込みロックで同時更新を止めます。ただし、この版は電子署名、改ざん不能な外部台帳、利用者認証ではありません。元ファイルとJSONの両方を書き換えられる人に対する真正性保証はありません。

## 8. ツール自体の検証

```powershell
node --test tests/server-engineer.test.mjs
node scripts/server-engineer.mjs check
```

テストは一時フォルダの架空の **テスト用データ** で、未実施初期化、経路制限、証跡改変、自己評価拒否、評価失効、前提段階、環境差、自立条件、別日・別セッションを検査します。学習者の個人台帳を埋めず、VM操作や学習者の技能試験も実行しません。テスト成功は台帳ツールの動作確認であり、学習者の演習完了とは別の証拠です。
