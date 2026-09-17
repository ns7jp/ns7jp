# 初期保守・運用移管台帳テンプレート

[PJ06 初期保守・運用移管](../stages/06-support.md) / [案件の入口](../README.md)

案件の非公開記録先に複製します。監視、問い合わせ、障害、変更、残課題の正本と関連IDを結びます。顧客の名前、構成、ログ、秘密を公開リポジトリに保存しません。

初期値は`NOT SET`または`NOT RUN`です。未観測を正常、未確認を0件、期限経過を保守完了として扱いません。

## 1. 保守の識別と合意条件

| 項目 | 記録 |
| --- | --- |
| 案件ID / 区分 training または work | NOT SET |
| 案件名・文書ID・版 | NOT SET |
| 対象hostname・VM/資産識別 | NOT SET |
| 配置SHA・設定版・文書版 | NOT SET |
| PJ05の受領・保守開始条件の参照 | NOT SET |
| 案件主担当 / 運用受領者 | NOT SET |
| 一次受付 / 障害判断 / 変更承認の責任者 | NOT SET |
| 開始日時・起点・タイムゾーン | NOT SET |
| 元の終了予定 / 最新予定 | NOT SET |
| 対応時間・休日・時間外窓口 | NOT SET |
| 対象範囲・除外範囲 | NOT SET |
| 初動・報告・復旧の目標と根拠 | NOT SET |
| 保守終了・運用移管の条件 | NOT SET |
| 期間・費用等の変更を確認する担当 | NOT SET |

実案件の期間と対応目標は合意した条件を使います。DEMO-Aの架空の練習条件や既存製品の既定値を契約上の約束へ置き換えません。

## 2. PJ06-C1 観測計画

| 項目 | 採録元・方法 | 周期・予定時刻 | 正常・異常・欠測の条件 | 担当 | 記録先・保持 |
| --- | --- | --- | --- | --- | --- |
| 利用者応答・内容 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| サービス・依存先 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 監視データ・通知経路 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 容量・エラー・変化 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| バックアップ鮮度・最終成功 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 問い合わせ受付先 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

| 自動採録の確認項目 | 実結果・証跡 |
| --- | --- |
| 対象・権限・採録先が承認範囲か | NOT RUN |
| 手動点検と採録結果が一致するか | NOT RUN |
| 採録器が停止したとき分かるか | NOT RUN |
| 必須項目がSKIPされていないか | NOT RUN |

## 3. 日次観測記録

| 予定日時 | 実施日時・実経過 | 対象版・変更 | 利用者応答 | 監視・通知 | 容量・ログ | backup最終成功 | 結果 | 証跡 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT SET |

実施した日ごとに行を追加します。必要な期間に対する実際の開始・終了時刻を記録し、7回の採録を7日連続観測とは書きません。

### 問い合わせ窓口の確認

| 確認予定/実施日時 | 確認した受付先・範囲 | 新規件数 | 未処理件数 | 期限接近 | 関連受付ID | 未確認の範囲 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET / NOT RUN | NOT SET | 未確認 | 未確認 | 未確認 | NOT SET | NOT SET |

受付先を調べていなければ0件とは書きません。複数窓口がある場合は確認できた窓口と範囲を残します。

## 4. 欠測・延長履歴

| 欠測ID | 予定日時 | 気付いた日時 | 未確認の期間・項目 | 理由・影響 | 補足できる原記録 | 次の確認・担当 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT RUN | NOT SET | NOT SET | NOT SET | NOT SET |

| 元の終了予定 | 直前の予定 | 新しい予定 | 超過・変更理由 | 残る観測 | 判断者・根拠 |
| --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

後日の正常性を過去の欠測期間へ当てはめません。既存ログで補足した場合は、その記録が確認できる範囲と限界を書きます。

## 5. PJ06-C2 受付・障害・変更・残課題

| 受付ID・種類 | 受付/発生/検知日時 | 申告内容・利用者影響 | 対象・版 | 優先度の根拠 | 担当・責任者 | 次回報告・期限 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT RUN | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

種類は問合せ、障害、残課題、変更提案を区別します。原因と責任が不明なら調査中と記録し、断定しません。

### 調査・対処のタイムライン

| 関連ID・日時 | 観測・証跡 | 仮説 | 次の検査 | 実結果 | 判断・承認 | 担当 |
| --- | --- | --- | --- | --- | --- | --- |
| NOT SET / NOT RUN | NOT RUN | NOT SET | NOT SET | NOT RUN | NOT SET | NOT SET |

| 復旧・完了の確認 | 記録 |
| --- | --- |
| 復旧操作と承認範囲 | NOT SET |
| 暫定復旧日時・利用者確認 | NOT RUN |
| データ・監視・通知収束 | NOT RUN |
| 原因確定または未確定の範囲 | NOT SET |
| 恒久対処・再試験・完了確認 | NOT RUN |
| 発生から/検知からの実測時間 | NOT RUN |
| 中止・エスカレーション判断 | NOT SET |

### 変更と課題の移管

| 課題/変更ID | 元の範囲との関係 | 採否・承認状態 | 内容・影響・回避策 | 担当・期限 | 移管先 | 受領日時・証拠 | 終了条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | NOT SET |

担当者名だけを入力して移管完了にしません。同じ障害の再発は、新しい発生記録を残し前回へ関連付けます。

## 6. PJ06-C3 運用担当の実操作

| 操作 | 対象・権限・影響 | 実行した運用担当 | 日時 | 期待結果 | 実結果 | 質問・補足 | 証跡 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 対象確認・接続 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |
| 日次点検・ログ | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |
| backup・復旧情報確認 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |
| 合意した一次対応操作 | NOT SET | NOT SET | NOT RUN | NOT SET | NOT RUN | NOT SET | NOT SET |

| 不足・修正内容 | 修正版・権限変更 | 再操作した人・日時 | 結果・証跡 |
| --- | --- | --- | --- |
| NOT SET | NOT SET | NOT RUN | NOT RUN |

資料を送っただけでは実操作を記録しません。修正後に再実施した結果を追加し、最初の失敗や補足を消しません。

## 7. 運用範囲と移管判断

| 項目 | 記録 |
| --- | --- |
| 移管する版・対象・文書 | NOT SET |
| 運用担当が自分で行う範囲 | NOT SET |
| 中止・エスカレーション条件と連絡先 | NOT SET |
| 対応時間・終了後の一次窓口 | NOT SET |
| 残課題と受領の確認 | NOT SET |
| 合意した観測期間の充足・不足 | NOT RUN |
| 欠測の扱いと追加観測 | NOT SET |
| 初期保守終了の条件・根拠 | NOT SET |
| 運用受領者の移管可否・日時 | NOT RUN |
| 案件責任者等の期間終了判断 | NOT SET |
| PJ07へ渡す一時権限と継続権限 | NOT SET |

必要な運用アクセスが確認できる前に、一時作業者の経路を機械的に削除しません。用途不明のサービス資格情報は管理者へ確認します。

## 8. 工数・期間の比較

| WBS-ID・区分 | 元見積 | 最新見積 | 実作業 | 待機 | 手戻り | 残時間 | 差異の理由 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 点検 | NOT SET | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET | NOT SET |
| 問合せ・障害 | NOT SET | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET | NOT SET |
| 変更・残課題 | NOT SET | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET | NOT SET |
| 教育・移管 | NOT SET | NOT SET | NOT RUN | NOT RUN | NOT RUN | NOT SET | NOT SET |

金額への換算、期間延長の費用、無償・有償の扱いは合意条件を担当者へ確認します。

## 9. 工程確認

- [ ] 観測した範囲と欠測を区別している。
- [ ] 問い合わせ件数は確認した窓口の記録に基づく。
- [ ] 障害・変更・残課題に担当、期限、次の判断がある。
- [ ] 運用担当の実操作と修正後の再確認がある。
- [ ] 未完了項目の受領と、保守終了条件を確認した。

| 項目 | 記録 |
| --- | --- |
| PJ06-C1 / C2 / C3の実施記録参照 | NOT SET |
| operations確認者ID・役割 | NOT SET |
| 最新証跡との対応・確認日時 | NOT SET |
| PJ07へ渡す資料・未完了・窓口 | NOT SET |

台帳の記録方法は[ツール操作](../tracker-guide.md)を参照します。
