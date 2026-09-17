# 検収・引き渡し票テンプレート

[PJ05 検収・引き渡し](../stages/05-acceptance.md) / [案件の入口](../README.md)

案件の非公開記録先に複製し、受領者と実際に確認した結果を記入します。原本や架空例から受領・検収・教育完了の実績を生成しません。顧客の契約・実構成・生ログ・秘密値を公開リポジトリへ保存しません。

`NOT SET`は未確定、`NOT RUN`は未実施です。受領者の未回答、条件付きの受領、保留、受領不可を成功検収へ読み替えません。

## 1. 対象と役割

| 項目 | 記録 |
| --- | --- |
| 案件ID / 区分 training または work | NOT SET |
| 案件名 / 文書ID / 版 | NOT SET |
| 合意資料の版・変更合意 | NOT SET |
| 対象範囲・対象外 | NOT SET |
| 対象hostname・VM/資産識別 | NOT SET |
| 最終配置SHA・設定版 | NOT SET |
| PJ04の作業結果・必須試験参照 | NOT SET |
| 案件主担当・技術確認者 | NOT SET |
| 受領者・判断範囲・権限確認の根拠 | NOT SET |
| 運用受領者・役割 | NOT SET |
| 契約・事務確認の担当 | NOT SET |
| 元の確認期限・最新予定・変更理由 | NOT SET |

案件内IDの架空例はDEMO-A-REQ-001、DEMO-A-TEST-001、DEMO-A-EVID-001です。工程条件PJ05-C1〜C3とは別の参照として使います。

## 2. PJ05-C1 受入の直前確認

| 項目 | 確認結果 | 証跡・確認者 |
| --- | --- | --- |
| PJ04の結果と現在の対象・版の一致 | NOT RUN | NOT SET |
| 必須試験の全結果と集計の一致 | NOT RUN | NOT SET |
| PJ04以後の変更・再試験の有無 | NOT RUN | NOT SET |
| 受入条件・対象外の読み合わせ | NOT RUN | NOT SET |
| 受領者の判断範囲 | NOT SET | NOT SET |
| 操作の影響・時間・中止・戻し方 | NOT SET | NOT SET |
| 実操作する人のアクセス | NOT RUN | NOT SET |

## 3. 受入試験と確認方法

| 要件ID | 試験ID・必須/任意 | 確認方法 | 実施者・立会者 | 日時 | 期待結果 | 実結果・判定 | 証跡 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET |

確認方法には「資料確認」「実行立会い」「受領者の実操作」等、実際に行った方法を書きます。ログを見た結果と、受領者自身が操作した結果を同じ扱いにしません。

| 必須試験の集計 | 対象数 | PASS | FAIL | BLOCKED | NOT RUN |
| --- | --- | --- | --- | --- | --- |
| 合意した対象版 | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

### 不一致と追加要望

| ID | 種類 | 事象・要件との関係 | 影響 | 対処/採否 | 担当・期限 | 再試験・受領 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET | 不具合/追加要望/問合せの区別は未確認 | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN |

合意済みの未達を、追加要望として範囲外へ移しません。受入条件を変える場合は元条件と結果を保存し、正式な変更経路と再評価へ結び付けます。

## 4. PJ05-C2 引き渡し物一覧

| 成果物 | 正本の保存先 | 版・対象 | 受け取る人 | 実際の確認日時 | 受領状態・不足 |
| --- | --- | --- | --- | --- | --- |
| 構成図・パラメータ | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 構成コード・配置版 | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 試験結果・作業結果 | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 日次点検・正常性確認 | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 起動・停止・復元・戻し | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 監視・通知・連絡経路 | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 変更・障害の扱い | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 残課題・制限・回避策 | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |
| 更新責任者・保存方針 | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |

## 5. アクセスの受領

| 用途・対象 | 必要な権限 | 正規の取得・失効経路 | 管理者 | 受領者の実接続 | 一時/継続 | 終了条件 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | NOT SET | NOT SET |

秘密値を本文、URL、コマンド引数、証跡に書きません。主担当のアカウントの貸与で受領者の接続確認を代替しません。運用移管後に不要となる一時権限はPJ07の終了対象へ関連付けます。

## 6. 教育と受領者の実操作

| 操作 | 対象・実行場所 | 実行した人 | 開始–終了 | 期待結果 | 実結果 | 口頭補足 | 証跡 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 対象確認・接続 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |
| 日次点検・利用者応答 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |
| ログ・バックアップ確認 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |
| 合意した操作1件 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |

| 質問・欠陥ID | 迷った内容 | 文書/環境の修正 | 修正版 | 再操作した人・日時 | 再確認結果 |
| --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | NOT RUN |

資料を渡しただけ、説明会に参加しただけの場合は実操作をNOT RUNで残します。補足して進められた場合は、必要だった補足を資料へ戻して再確認します。

## 7. 残事項の移管

| 課題ID | 内容・影響・回避策 | 必須/非必須 | 担当 | 元期限/最新期限 | 移管先 | 受領日時・根拠 | 終了条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | NOT SET |

担当者名の記入だけでは移管済みにしません。必須未達を残課題へ移しただけで、元の合意に対する成功へ変えません。

## 8. PJ05-C3 検収・受領の判断

| 項目 | 記録 |
| --- | --- |
| 判断：検収/条件付き受領/保留/受領不可/未回答 | NOT SET |
| 判断した人・役割・判断範囲 | NOT SET |
| 判断日時・タイムゾーン | NOT RUN |
| 対象範囲・対象版・確認した試験 | NOT SET |
| 条件・除外・残課題 | NOT SET |
| 判断の原記録・保存先 | NOT SET |
| 条件解除の担当・期限・確認者 | NOT SET |
| 必須条件の未達と次の対応 | NOT SET |

未回答を承諾と推定しません。契約上の取扱いが問題になる場合は、担当者・確認した根拠・次の判断を記録します。CLIは黙示検収や代理権を判断しません。

## 9. 保守開始と事務確認

| 項目 | 合意した条件 | 確認担当・根拠 | 現在の状態 |
| --- | --- | --- | --- |
| 保守の開始日時・起点 | NOT SET | NOT SET | 未確認 |
| 保守の期間・終了条件 | NOT SET | NOT SET | 未確認 |
| 対応時間・対象・除外 | NOT SET | NOT SET | 未確認 |
| 一次窓口・時間外・障害時 | NOT SET | NOT SET | 未確認 |
| 運用受領者と担当範囲 | NOT SET | NOT SET | 未確認 |
| 検収と請求手続の関係 | NOT SET | NOT SET | 未確認 |
| 金額 | 未記入 | NOT SET | 未確認 |
| 事務上の未完了・次の期限 | NOT SET | NOT SET | 未確認 |

金額や請求可能日を技術結果から推定しません。請求・支払の判断は契約・事務担当が確認します。

## 10. 工程確認と次工程

| 項目 | 記録 |
| --- | --- |
| 説明・試験・修正・待機の見積対実績 | NOT SET |
| PJ05-C1 / C2 / C3の実施記録参照 | NOT SET |
| 受領者 customer の確認者ID | NOT SET |
| 最新証跡との対応・確認日時 | NOT SET |
| PJ06へ渡す対象・期間・窓口・残課題 | NOT SET |

- [ ] 対象版と受入条件が一致している。
- [ ] 受領者の実操作、質問、修正と再確認が記録されている。
- [ ] 未回答・条件付き受領・必須未達を成功へ変えていない。
- [ ] 残事項は担当と期限、実際の受領がある。
- [ ] 保守開始条件と事務の未確認を分けている。

判定記録は[ツール操作](../tracker-guide.md)に従って添付し、実際の受領者の確認を記録します。
