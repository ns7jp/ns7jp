# 作業結果票テンプレート

[PJ04 本番作業・結果確認](../stages/04-execution.md) / [案件の入口](../README.md)

案件の非公開記録先へ複製し、実作業で得た情報だけを記入します。この原本を実案件の結果で上書きしません。顧客秘密、実接続情報、生ログを公開リポジトリへ保存しません。

`NOT SET`は未確定、`NOT RUN`は未実施です。条件判定に使う実施結果はPASS・FAIL・BLOCKEDで、未実施の項目はNOT RUNのままです。空欄・欠測を成功や0へ変えません。

## 1. 案件・作業の識別

| 項目 | 記録 |
| --- | --- |
| 案件ID / 区分 training または work | NOT SET |
| 案件名 | NOT SET |
| 文書ID / 版 / 更新者 | NOT SET |
| 変更ID / WBS-ID | NOT SET |
| 作業目的・対象範囲 | NOT SET |
| 対象環境・hostname・VM/資産識別 | NOT SET |
| 管理端末・接続経路 | NOT SET |
| 作業者 / 確認者 / 変更責任者 | NOT SET |
| 元の予定 / 最新予定 / タイムゾーン | NOT SET |
| 実開始 / 実終了 | NOT RUN |
| 関連要件・設計・試験・証跡 | NOT SET |

案件内IDの架空例はDEMO-A-REQ-001、DEMO-A-DES-001、DEMO-A-TEST-001、DEMO-A-EVID-001、DEMO-A-WBS-001、DEMO-A-CHG-001です。工程条件PJ04-C1〜C3とは別に管理します。

## 2. PJ04-C1 承認と直前照合

| 照合項目 | 承認された値・条件 | 直前の実値 | 判定 | 証跡 |
| --- | --- | --- | --- | --- |
| hostnameとVM/資産識別 | NOT SET | NOT RUN | NOT RUN | NOT SET |
| 環境・IP・接続経路 | NOT SET | NOT RUN | NOT RUN | NOT SET |
| ソースの40桁SHA | NOT SET | NOT RUN | NOT RUN | NOT SET |
| 配置物・イメージ・設定ハッシュ | NOT SET | NOT RUN | NOT RUN | NOT SET |
| inventory・ローカル上書き | NOT SET | NOT RUN | NOT RUN | NOT SET |
| 作業窓・停止上限 | NOT SET | NOT RUN | NOT RUN | NOT SET |
| 戻し版・復元ポイント | NOT SET | NOT RUN | NOT RUN | NOT SET |
| 代替接続・権限 | NOT SET | NOT RUN | NOT RUN | NOT SET |

| 承認・開始判断 | 記録 |
| --- | --- |
| PJ03の確認者・日時・根拠 | NOT SET |
| 承認対象の証跡・版 | NOT SET |
| 承認の条件・有効な時間 | NOT SET |
| 不一致と解消方法 | NOT SET |
| 直前確認の実施者・確認者・日時 | NOT RUN |
| 開始可否・判断者・根拠 | NOT SET |

hostname、SHA、設定のいずれかが違えば、その理由と再確認を残します。未コミット差分がある場合は、その差分を保存し、SHAだけで配置状態を再現できるとは扱いません。

## 3. 変更前の状態と戻し準備

| 項目 | 取得方法・対象 | 実際の状態 | 証跡 |
| --- | --- | --- | --- |
| 利用者応答・内容 | NOT SET | NOT RUN | NOT SET |
| サービス・待受・依存先 | NOT SET | NOT RUN | NOT SET |
| 監視・通知・抑止の状態 | NOT SET | NOT RUN | NOT SET |
| 容量・直近エラー | NOT SET | NOT RUN | NOT SET |
| バックアップ日時・対象・読取可否 | NOT SET | NOT RUN | NOT SET |
| 必要な戻し時間・最終開始時刻 | NOT SET | NOT RUN | NOT SET |
| 作業前からの異常・制約 | NOT SET | NOT RUN | NOT SET |

バックアップ、秘密値の保管場所、認証情報の内容を混ぜません。秘密値は本文へ書かず、正規の取得担当と参照経路だけを記録します。

## 4. PJ04-C2 実作業タイムライン

| 手順・WBS-ID | 実行場所・対象 | 実開始–終了 | 実操作・入力 | 期待結果 | 出力・終了コード | 判定 | 証跡 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT RUN | NOT RUN | NOT SET | NOT RUN | NOT RUN | NOT SET |

各操作を行う前に期待結果を確定します。出力が違った行はFAILまたはBLOCKEDとし、後から成功した再試行を別の行に追加します。

### チェックポイントと残時間

| 判断時刻 | 完了手順 | 未完了・依存 | 残時間見込み | 戻し時間 | 継続/中止/戻し | 判断者・根拠 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT RUN | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

### 計画と実行の差分

| 差分ID | 計画値・手順 | 実値・実操作 | 影響 | 対処・承認経路 | 関連変更ID |
| --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT RUN | NOT SET | NOT SET | NOT SET |

### 障害と連絡

| 障害ID | 発生/検知時刻 | 症状・確認した影響 | 実施済み対処 | 次の確認・報告時刻 | 担当 |
| --- | --- | --- | --- | --- | --- |
| NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET | NOT SET |

| 連絡区分 | 発信者・宛先 | 時刻 | 内容・原記録 | 送信/受信確認 |
| --- | --- | --- | --- | --- |
| 開始 | NOT SET | NOT RUN | NOT SET | NOT RUN |
| 異常・途中判断 | NOT SET | NOT RUN | NOT SET | NOT RUN |
| 終了・次工程 | NOT SET | NOT RUN | NOT SET | NOT RUN |

演習の下書きは未送信と記録します。宛先名を記入しただけで送信済みにしません。

## 5. PJ04-C3 必須事後試験

| 要件ID | 試験ID・必須/任意 | 対象hostname・版 | 期待結果 | 実結果 | 判定 | 実施者・日時 | 証跡 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET |

| 試験集計 | 対象数 | PASS | FAIL | BLOCKED | NOT RUN |
| --- | --- | --- | --- | --- | --- |
| 必須 | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| 任意 | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

件数は個別結果から数えます。必須のFAIL・BLOCKED・NOT RUNがあれば成功完了にしません。別ホスト・別版の結果を合算しません。

## 6. 戻し判断と最終状態

| 項目 | 記録 |
| --- | --- |
| 判断が必要になった理由・時刻 | NOT SET |
| 継続 / 戻し / 保留 / 障害移行 | NOT SET |
| 判断者・承認された操作範囲 | NOT SET |
| 戻し対象版・設定・データ | NOT SET |
| 戻し実開始・終了・所要時間 | NOT RUN |
| 戻しの実操作と証跡 | NOT RUN |
| 戻し後の利用者応答・データ・監視 | NOT RUN |
| 最終稼働版・hostname・構成差分 | NOT RUN |
| 一時許可・テストデータ・抑止の後処理 | NOT RUN |

戻しが成功しても、新しい変更が成功したとは書きません。未承認差分が残る場合は最終状態を記録して再確認へ回します。

## 7. 工数と残課題

| WBS-ID | 元見積幅 | 最新見積 | 実作業 | 待機 | 手戻り | 残時間 | 差異の理由 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET | NOT SET |

| 課題・リスクID | 内容・影響 | 次の作業 | 担当 | 元期限/最新期限 | 移管先・受領 | 完了確認条件 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

## 8. 結果報告と工程確認

| 項目 | 記録 |
| --- | --- |
| 変更結果：成功/失敗/切戻し/中断等 | NOT RUN |
| 利用者にとっての最終状態 | NOT RUN |
| 確認済み範囲・未確認範囲 | NOT SET |
| 次工程へ渡す版・資料・窓口 | NOT SET |
| 変更責任者の確認者ID・役割 | NOT SET |
| 確認日時・最新証跡との対応 | NOT SET |
| PJ04-C1 / C2 / C3の実施記録参照 | NOT SET |
| 次の判断・担当・期限 | NOT SET |

- [ ] 承認対象と実対象・版・設定を照合した。
- [ ] 失敗、差分、未実施、戻し結果を保存した。
- [ ] 必須試験の結果と集計が一致している。
- [ ] 残課題と次の担当が明確である。
- [ ] 変更責任者の確認が実際の最新結果に結び付いている。

記録後の台帳操作は[ツール操作](../tracker-guide.md)に従います。条件記録を更新した場合は、失効した確認を再取得します。
