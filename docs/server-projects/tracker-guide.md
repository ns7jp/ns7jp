# 案件台帳の操作

[案件運用の入口](README.md) / [日々の運営](operations.md) / [工程と確認役の正本](workflow.json)

この台帳は、案件の未実施、実施記録、人による確認、未完作業を分けて管理します。`training` は架空演習、`work` は組織が許可した実案件です。育成のSE台帳とは独立しており、学習修了から受注、本番権限、検収を推定しません。CLIはファイルを記録・検査し、顧客への送信、見積の送付、サーバー操作、契約、請求、入金処理は行いません。

## 1. 実行場所と空の案件作成

Node.js 22以上を用意し、`ns7jp`リポジトリのルートで実行します。追加のnpmパッケージは不要です。以下はフォルダと空の架空案件を作る例であり、完了条件や承認を作りません。期日は例のまま約束せず、本人が決めた日へ置き換えてください。

```powershell
node --version
node scripts/server-projects.mjs --help
node scripts/server-projects.mjs check
node scripts/server-projects.mjs init `
  --project demo-a `
  --title "研修用監視VM1台" `
  --owner learner `
  --mode training `
  --priority 2 `
  --due 2026-09-30
node scripts/server-projects.mjs report --project demo-a
```

作成直後は8工程・24条件すべて `NOT RUN`、作業は0件、承認は0件です。`init`は既存案件を上書きしません。`mode`、案件ID、主担当、初期優先度、元期限は作成時の情報として保持します。現在の優先度と作業ごとの担当は、後述のコマンドで履歴を残して変更できます。この版には案件ID・案件主担当・modeを変更するコマンドはありません。別案件への転記や主担当変更が必要なら、既存の記録を保全して明示的な移行を設計してください。

| 項目 | 規則 |
| --- | --- |
| 案件、担当者、確認者、作業ID | 小文字の英数字、`_`、`-`。1〜64文字。Windowsの予約名は不可 |
| 優先度 | `1`が最優先、`2`が通常、`3`が低い。自動で変更しない |
| 期日 | `YYYY-MM-DD`。この版はUTC暦日で期限超過を比較する |
| 工数 | 時間単位の数値。見積は正数。0.5や1.25も可。1項目100万時間以下 |
| 実施時刻 | UTCの`YYYY-MM-DDTHH:mm:ssZ`またはミリ秒3桁を含む形式。未来は禁止 |

期日はそのUTC日の終了までを期限とし、翌UTC日から超過1日と数えます。組織が日本時間17:00等を約束している場合、その正確な締切を原本と作業記録へ残してください。この日付だけの台帳表示を変更窓の時刻管理に使いません。

## 2. 非公開の保存場所

| 保存物 | 場所 |
| --- | --- |
| 案件の正本 | `.local/server-projects/demo-a/project.json` |
| 添付証跡のコピー | 同じ案件フォルダの`evidence/<UUID>.bin` |
| 登録前の資料 | 例：リポジトリ直下の`.local/project-incoming/demo-a/` |

`.local/`はGitの管理対象から除外します。実案件は、まず組織が許可した管理場所・端末・アクセス権で扱えることを確認します。ローカル保存やGit除外があるだけで実顧客情報の持ち出し許可にはなりません。顧客情報、実構成、秘密鍵、パスワード、トークン、生ログを公開教材のPRに含めないでください。

```powershell
New-Item -ItemType Directory -Force -Path .local/project-incoming/demo-a
git check-ignore .local/server-projects/demo-a/project.json
```

`.local/server-projects/`直下は案件IDのフォルダ専用です。共通のincomingやバックアップフォルダをそこへ作ると、`board`は「台帳のない案件」としてエラーにします。登録前の資料は上の例のように外側へ分けます。

証跡は10MiB以下の通常ファイルで、空ファイル・空白だけの内容は受け付けません。リポジトリからの相対パスに限定し、絶対パス、`..`、シンボリックリンク、ジャンクション、代替データストリームは拒否します。組織の原本を読み、必要な範囲を秘匿化して許可された提出用コピーを用意します。ツールは自動マスキングしません。

バックアップは案件フォルダ全体を非公開の保管先へコピーします。JSONだけでは添付ファイルを復元できません。OS側の利用者認証・アクセス権・バックアップ運用は別途必要です。

## 3. 条件を実施してから記録する

`record`は既存の証跡をコピーし、SHA-256、対象、支援量、実施時刻、登録時刻、イベント番号を残します。実施前の予定や雛形をPASSへ変換しません。`--target`には対象環境、対象名、対象版を記載し、`--note`には机上確認・検証環境の実測・本番実作業のどれか、観察した事実、未確認を明記します。

以下は、PJ00-C1の実際の確認を終え、秘匿化した`pj00-c1.md`を本人が保存した後の書式例です。架空の成功ログを生成するコマンドではありません。結果、対象、説明を実施内容へ置き換えます。

```powershell
node scripts/server-projects.mjs record `
  --project demo-a `
  --criterion PJ00-C1 `
  --result PASS `
  --target "架空演習・机上確認 / 依頼票の対象版を記載" `
  --assistance guided `
  --evidence .local/project-incoming/demo-a/pj00-c1.md `
  --sanitized `
  --note "確認した目的、窓口、対象、情報区分を添付。未確認は別欄に記載。"
```

| 値 | 用途 |
| --- | --- |
| `PASS` | その条件を実施し、期待結果を満たしたという担当側の記録 |
| `FAIL` | 実施したが期待結果を満たさない。観察内容と原因・次の確認を残す |
| `BLOCKED` | 権限、依存作業、環境等が不足し進められない。理由の資料を添付する |
| `guided` | 手順・他人の助言あり |
| `ai` | AIから操作や判断の指示を受けた |
| `independent` | 本人が判断。必要な公式資料や組織の手順は参照可能 |

`--sanitized`は秘密情報の除去済みという入力者の申告です。roleやmodeと同様、申告の事実をツールが認証するものではありません。`training`の本番工程は本番を想定した演習であり、実本番の構築実績として記載しません。

過去の実ログを後日登録する場合は、次のように実施UTC時刻を指定します。省略すると登録時刻を実施時刻として使います。

```text
--performed-at 2026-09-01T03:00:00.000Z
```

訂正・再実施は同じ能力IDで追記します。判定に使う「最新」は登録順です。後から過去ログを追加した場合もその記録が最新になり、当該工程と後続工程の旧承認が失効します。古いFAILやBLOCKEDを消さず、訂正理由と次の試行を残してください。

## 4. 作業分解、依存関係、残時間

各作業はPJ工程に結び付きます。受付資料の不足確認、見積の前提確認、検証、移行、引き渡し等を、担当・成果物・完了判断が分かる単位へ分けます。作業IDは案件内で一意です。

```powershell
node scripts/server-projects.mjs task-add `
  --project demo-a --task intake-check --stage PJ00 `
  --title "依頼目的と窓口の未確認事項を整理する" `
  --owner learner --hours 1.5 --due 2026-09-12
node scripts/server-projects.mjs task-add `
  --project demo-a --task scope-draft --stage PJ01 `
  --title "確認済みの受付内容から要件案を作る" `
  --owner learner --hours 3 --due 2026-09-15 `
  --depends intake-check
```

依存先は先に登録した、同じ工程または前の工程の作業に限ります。複数は`--depends task-a,task-b`と指定します。未登録の作業、循環、同じ依存先の重複、後工程への依存を拒否します。記載した見積は初期値として残り、進行後は残時間を更新します。実績工数の自動計測ではありません。実際に費やした時間や見積との差は案件の工数記録へ別に記載します。

```powershell
node scripts/server-projects.mjs task-update `
  --project demo-a --task intake-check --state DOING `
  --remaining 1 --reason "着手済み。未回答の確認事項に必要な残時間を見直した。"
node scripts/server-projects.mjs task-update `
  --project demo-a --task intake-check --state BLOCKED `
  --remaining 1 --reason "窓口への確認待ち。次回確認日と担当は日誌に記載。"
```

`TODO`は未着手、`DOING`は作業中、`BLOCKED`は阻害あり、`DONE`は完了です。未完作業の残時間は正数、DONEは0を要求します。残時間が不明な場合、0で埋めず、担当者が暫定見積を整理して根拠・不確実性を記録します。

完了登録には既存の完了証跡が必須です。以下は作業を完了し、成果物の確認記録を保存した後だけ実行します。

```powershell
node scripts/server-projects.mjs task-update `
  --project demo-a --task intake-check --state DONE `
  --remaining 0 --reason "作業の完了条件と成果物を実際に確認した。" `
  --evidence .local/project-incoming/demo-a/intake-check-result.md `
  --sanitized
```

依存元がすべてDONEでなければ後続作業をDOINGにもDONEにもできません。未完作業が一つでも残る工程は承認できません。作業の追加・更新はその工程と後続工程の旧承認を失効させます。条件記録がPASSでも、作業が終わるまで工程は `OPEN TASKS` です。

DONE作業を再開するとき、DONEまたはDOINGの依存先があれば、先に依存先を逆順にTODOかBLOCKEDへ戻します。他の人の作業をツールが自動で未完へ変更することはありません。本人が理由と残時間を記録して順に更新し、依存元を再び完了してから後続へ着手します。作業削除や依存先編集のコマンドはこの版にはありません。採用済みの範囲縮小で作業が不要になった場合は、後述の取下げ記録を使い、DONEと偽って除外しません。

作業担当の変更が実際に決まった場合は、旧担当・新担当・理由を残します。案件の主担当は変えません。この変更も該当工程と後続工程の旧承認を失効させます。

```powershell
node scripts/server-projects.mjs task-reassign `
  --project demo-a --task scope-draft --owner worker02 `
  --reason "当人同士で確認した担当交代の理由と引継ぎ内容を記載する。"
```

### 採用した範囲縮小で作業を取り下げる

未完作業が不要になった場合は、案件主担当とは別のsponsor役が実際に確認した根拠を付けて取り下げます。提案中には実行しません。

```powershell
node scripts/server-projects.mjs task-withdraw `
  --project demo-a --task scope-draft `
  --reviewer reviewer01 --role sponsor `
  --reason "採用された範囲縮小と、この未完作業を取り下げる判断の根拠を記載する。" `
  --evidence .local/project-incoming/demo-a/task-withdrawal.md `
  --sanitized
```

状態は成功のDONEとは異なる `WITHDRAWN` となり、残時間は0になります。変更前の状態・残時間・担当・初期見積と履歴は残ります。その作業に依存する、まだWITHDRAWNでない作業があれば取り下げできません。計画を見直し、依存先から逆順に取り下げ、必要な代替作業を新しいIDで登録します。WITHDRAWNを新規作業の依存元にはできません。

DONEの実績を取り下げて消す操作、WITHDRAWNの再開・担当変更・期限変更は拒否します。取り下げは案件取消とは別です。当該工程以降の旧承認が失効し、すべての条件に取下げイベント後の新たな確認記録が必要です。範囲縮小を記録しただけで、古い条件結果のまま終結することはできません。

## 5. 確認役のレビュー

全3条件の最新記録がPASS、当該工程の未完作業が0、全先行工程が有効なPASSなら `READY FOR REVIEW` です。これだけでは工程PASSになりません。実際に確認した人の記録を添付します。

| 工程 | 必要な`--role` | 確認対象 |
| --- | --- | --- |
| PJ00、PJ01、PJ07 | `sponsor` | 案件の担当可否、合意範囲、終結 |
| PJ02 | `technical` | 設計と技術上の実行計画 |
| PJ03、PJ04 | `change` | 対象版の変更判断、作業結果 |
| PJ05 | `customer` | 合意した受入・引き渡し |
| PJ06 | `operations` | 運用側の受領と残課題 |

確認者IDは主担当IDと異なる必要があります。実案件では所属組織が定めた確認権限を持つ人の実記録を使います。演習ではその役割を引き受けた他の人の観察記録を使います。自分の別名やAIが作った架空の確認者で承認してはいけません。

```powershell
node scripts/server-projects.mjs review `
  --project demo-a --stage PJ00 `
  --reviewer reviewer01 --role sponsor --decision APPROVE `
  --evidence .local/project-incoming/demo-a/pj00-review.md `
  --sanitized `
  --note "実際に確認した版、観察した内容、判断理由、残事項を記載する。"
```

上の記入例を、実際の確認後に使います。未確認ならREADY FOR REVIEWのまま待ちます。差戻しは`--decision REJECT`とし、修正条件を記録します。REJECTは履歴に残り、新たな確認と承認が必要です。

承認は次の三つへ結び付きます。

1. その工程の最新3件の条件記録ID。
2. その工程の条件・作業・採用変更を反映した改訂状態。
3. **すべての先行工程**の有効な承認ID。

先行工程を再承認しただけでも承認IDが変わり、後続の旧承認を使い回せません。修正後は前から順に再確認します。PJ03の表示上のPASSを実システムの本番実行許可として扱わず、変更窓、対象版、実権限、当日の条件を組織の手続きで確認してください。

## 6. 採用した変更で旧承認を失効させる

提案中の変更は[日々の運営](operations.md)の変更票に採否待ちとして置きます。採用していない案で現行版を自動変更しません。採用した変更について、最初に影響する工程を選び、その工程以降の承認を失効させます。

```powershell
node scripts/server-projects.mjs invalidate `
  --project demo-a --from PJ02 `
  --reason "採用が確認された変更の範囲と、設計から見直す理由を記載する。" `
  --evidence .local/project-incoming/demo-a/adopted-change.md `
  --sanitized
```

この操作は採否の決定を代行しません。旧条件記録と承認を削除せず残し、旧承認を無効にします。指定工程と後続工程のすべての条件について、この失効イベントより後の新しい確認記録が必要です。旧PASSが残っていても `NEEDS RECHECK` となり、そのまま再承認できません。影響する条件は実際に再実施して追記し、影響しない条件も、その判断を新たに確認した根拠を添付して記録します。実作業を自動で再実施したことにも、新しい本番作業を許可したことにもなりません。

## 7. 保留・再開・取消・期限変更

```powershell
node scripts/server-projects.mjs hold --project demo-a `
  --reason "必要な前提が未確定。確認担当、次回確認日、再開条件は保留票に記載。"
node scripts/server-projects.mjs resume --project demo-a `
  --reason "再開条件を実際に確認。確認した資料と日付を記載。"
```

保留中は `ON HOLD` と表示し、条件記録、レビュー、作業の追加・更新・担当変更・取下げ、採用変更の反映を止めます。再開、取消、理由を伴う期限変更・優先度変更は可能です。保留しても過去の期限超過、DOING状態、残作業量は消しません。

取消が決まった場合は、処置と残事項を組織の手順で整理してから登録します。

```powershell
node scripts/server-projects.mjs cancel --project demo-a `
  --reason "実際の取消判断、根拠、保管・残事項の担当を記載する。"
```

取消は `CANCELLED` で、成功完了ではありません。この版では取消後の追記・再開はできません。取消記録を保全し、再開が別案件として決まった場合は別IDで作成して旧案件との関係を記録します。

期日変更は過去の超過を消さず追記します。案件全体の変更は`--task`なし、作業だけの変更は`--task`付きです。

```powershell
node scripts/server-projects.mjs reschedule `
  --project demo-a --due 2026-11-07 `
  --reason "新期限が合意された根拠と変更理由を記載する。"
node scripts/server-projects.mjs reschedule `
  --project demo-a --task scope-draft --due 2026-09-18 `
  --reason "依存条件と担当者の見通しを確認して変更した。"
```

イベントには元期限、変更直前の期限、新期限、変更時点での旧期限の超過日数、理由、UTC登録時刻を残します。案件全体の期日変更はPJ01以降、作業期日変更はその作業の工程以降の承認を失効させます。CLIが新期限を顧客や担当者へ約束することはありません。変更前に必要な合意を取ります。

## 8. 複数案件の確認

```powershell
node scripts/server-projects.mjs report --project demo-a
node scripts/server-projects.mjs board --capacity 20 --wip-limit 2
node scripts/server-projects.mjs report --project demo-a --json
node scripts/server-projects.mjs board --json
```

`report`は次の工程資料、未充足条件、未完作業、現期限・元期限、作業ごとの担当と残時間を表示します。`board`は優先度、現期限、案件IDの順に並べ、全案件を表示します。

案件間の並び順を見直した場合は、初期優先度と変更前の優先度を残して更新できます。

```powershell
node scripts/server-projects.mjs reprioritize `
  --project demo-a --priority 1 `
  --reason "週次確認で案件の並び順を変更した理由を記載する。"
```

並び順だけの変更では工程承認を失効させません。変更窓、納期、対象範囲、担当との約束も変わる場合は、別途必要な合意を取り、`reschedule`、`task-reassign`、`invalidate`を使って影響を反映します。優先度だけを上げて新たな約束をしたことにはなりません。

| 表示 | 意味 |
| --- | --- |
| DOING合計 | 未完案件にある作業中タスク数。保留案件のDOINGも含める |
| WIP参考 | 同時進行数を検討する参考。既定2。超過しても勝手に作業を止めたり移したりしない |
| 残作業総量 | 未完案件の全期間の残時間。保留を含み、取消・完了案件を除く |
| capacity参考 | 本人が渡した週の計画枠。任意。今週へ配分した工数や実績ではない |

例えば全期間の残作業が60時間、週capacityが20時間でも、「今週300%稼働」とは表示しません。残作業には来週以降や保留中も含まれます。今週どの作業へ何時間配るかは、期限、依存、他の仕事、割込みの余白を見て本人が[週次の運営](operations.md)で決めます。見積と残時間は自己申告であり、作業が未登録なら総量も不足します。

全工程が現在有効なPASS、未完作業が0なら `COMPLETED` です。作業のDONEと、承認された取下げのWITHDRAWNは未完集計から除き、別の件数と状態で表示します。条件の再記録、採用変更、追加作業で要件が変われば再びACTIVEになり、必要な再確認が残ります。完了表示が請求、入金、契約の終了を自動で確定するわけではありません。

## 9. 検査と障害への対応

```powershell
node scripts/server-projects.mjs check
node scripts/server-projects.mjs check --project demo-a
node --test tests/server-projects.test.mjs
```

`check`単独は工程定義・8文書・24条件IDを検査します。`--project`付きでは、さらにJSONの厳密な構造、連続するイベント番号、時刻順、既知のID、当時の前提条件、最新証跡と全先行承認の結び付き、ファイルの存在・サイズ・SHA-256を確認します。`report`、`board`、追記前にも証跡を検査し、壊れた案件を無視して残作業0と集計しません。

| エラー | 戻り方 |
| --- | --- |
| `Missing file` / `Empty evidence` | 実際の資料と相対パスを確認。結果を作って埋めない |
| `Evidence changed` | 保存したコピーが変更された。非公開バックアップと原本を照合し、一致する証跡を復元。JSONのSHAだけを書き換えない |
| `Required review role` / `Self-review forbidden` | 指定工程の実際の確認役を待つ。別名で自己承認しない |
| `OPEN TASKS` | 当該工程の未完作業を確認。完了なら根拠を添付。採用した範囲縮小なら実際の確認者と取下げ根拠を記録する |
| `WAITING PREREQUISITE` / 旧承認失効 | 前の工程から最新状態を人が再確認して承認する |
| `NEEDS RECHECK` | 採用変更で見直す工程の全条件に、失効イベント後の確認記録を残してから再承認する |
| `Reopen DONE dependants first` | DONE/DOINGの依存先を逆順にTODO/BLOCKEDへ戻し、理由と残時間を残してから依存元を再開する |
| `Withdraw all non-WITHDRAWN dependants first` | 計画変更を確認し、依存先から逆順に取下げ・代替作業の登録を行う |
| `Project is locked` | 他の書込み終了を待つ。異常終了なら実行中プロセスがないことを確認し、該当案件の`write.lock`だけを取り除く |
| `Workflow changed` | 旧台帳と旧定義を保全し、影響と明示的な移行を設計する。この版は自動移行しない |
| `Ledger would exceed 10 MiB` | 現行台帳を維持し、アーカイブ・移行を設計する。旧履歴を無断削除しない |

保存は排他ロック、追加イベント、一時ファイルからの置換を使います。CLIには過去イベントの削除・上書き操作がありません。ただし、ファイルを編集できる人がJSONと証跡の両方を変更した場合まで検出する電子署名・本人認証システムではありません。mode、支援量、対象、確認役、合意内容の真実性は組織と実際の確認者の責任範囲です。

テストは専用一時フォルダの架空データで台帳機能を検査し、実顧客や本番サーバーへアクセスしません。テスト成功と、案件の実施・検収・保守完了を分けて扱います。
