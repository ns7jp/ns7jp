# 構築・移行・戻し・変更前確認の実行計画テンプレート

[PJ02](../stages/02-design-plan.md) / [PJ03](../stages/03-readiness.md) / [案件運用の入口](../README.md)

実案件では組織が許可した非公開管理先へ保存します。この様式の完成は本番実行許可ではありません。秘密値は本文に記載せず、権限のある人が取得できる管理先の参照だけを残します。未設定は`NOT SET`、未確認は`未確認`、未実施は`NOT RUN`です。

## 1. 対象と版

| 項目 | 計画欄 |
| --- | --- |
| 案件ID / 種別（training / work） | NOT SET |
| 計画版 / 作成日 / 主担当 | NOT SET |
| 有効なPJ01・PJ02の参照 | NOT SET |
| 変更ID / 変更目的 | NOT SET |
| 対象環境・ホスト識別 | NOT SET |
| 実行端末 / 対象inventoryの参照 | NOT SET |
| 変更前の完全なGit SHA | NOT SET |
| 変更後の完全なGit SHA | NOT SET |
| 変更前後の設定版・パラメータ版 | NOT SET |
| 構築・移行・試験・復元手順の版 | NOT SET |
| 対象サービス・ポート・データ | NOT SET |
| 変更しない範囲 | NOT SET |

## 2. PJ02-C2 構築・移行・戻し・データ保護の計画

### 作業手順

| STEP-ID | 前提・先行STEP | 実行場所・対象 | 操作・手順参照 | 期待結果 | 上限・中止条件 | 戻しSTEP | 採録先 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-001 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

### 移行とデータ保護

| 項目 | 計画欄 |
| --- | --- |
| 移行の有無と根拠 | 未確認 |
| 書き込み停止・取得時点・差分同期 | NOT SET |
| バックアップ方式・保管先・保持 | NOT SET |
| 復元先ID・元対象と別である確認 | NOT SET |
| 必要容量 / 実容量 / 余裕 | NOT SET |
| 秘密値・認証・鍵の取得経路 | NOT SET |
| 切替と利用者視点の確認 | NOT SET |
| 後戻りできない地点・互換性の制約 | 未確認 |
| 失う可能性のあるデータ・時間幅 | 未確認 |
| 元対象を保持・隔離する方法 | NOT SET |

### 戻し計画

| 対象 | 正常状態の識別 | 戻し手順・版 | 依存・前提 | 確認方法 | 実測・根拠 |
| --- | --- | --- | --- | --- | --- |
| コード | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN |
| 設定 | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN |
| データ | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN |
| 接続経路 | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN |

## 3. PJ02-C3 作業分担・日程・レビューと実行場所を確定

| 役割 | 担当ID | 当日の対応時間 | 通常・緊急経路 | 代理 | 実確認参照 |
| --- | --- | --- | --- | --- | --- |
| 作業者 | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |
| 当日の確認者 | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |
| technical | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |
| change | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |
| 利用者・運用窓口 | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |

| レビュー指摘ID | 対象版・STEP | 必須修正・確認待ち・提案 | 対応と新しい版 | 担当・期限 | 再確認記録 |
| --- | --- | --- | --- | --- | --- |
| REVIEW-001 | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |

## 4. PJ03-C1 必須試験と実復元の結果

試験の正本は[要件対応表](requirements-trace.md)です。結果を二重管理せず、ここには参照と集計の時点を残します。

| 項目 | 結果・参照 |
| --- | --- |
| 実施した検証環境・対象版 | NOT RUN |
| 必須試験総数 / PASS / FAIL / BLOCKED / NOT RUN | NOT SET |
| 最新のTEST・EVID一覧と集計日時 | NOT SET |
| 復元元ID・取得時点・ハッシュ・容量 | NOT RUN |
| 実際の復元先ID・元との分離 | NOT RUN |
| 復元開始・終了時刻 / 測定区間 | NOT RUN |
| 復元コマンド結果・内容比較・利用確認 | NOT RUN |
| 計画RTO・RPO / 実測結果と環境差 | NOT SET |
| 本番との差・追加検証・未確認事項の参照 | 未確認 |

## 5. PJ03-C2 対象・変更窓・中止閾値・戻しと連絡

### 時間割

日付とタイムゾーンを必ず付けます。日をまたぐ場合は終了日の記入も必要です。

| 区分 | 開始予定 | 終了予定 | 所要時間の根拠 | 担当 | 完了の確認 |
| --- | --- | --- | --- | --- | --- |
| 事前確認・開始連絡 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 変更適用 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 事後試験・観測 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 続行・戻し判断 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 戻しと戻した後の確認 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| 終了報告 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

| 窓と判断期限 | 計画欄 |
| --- | --- |
| 変更窓の開始 / 終了 / タイムゾーン | NOT SET |
| 許容停止時間と受領者の合意 | NOT SET |
| 戻しの見込み時間と実測根拠 | NOT SET |
| 戻した後の確認時間 | NOT SET |
| 合意した余裕 | NOT SET |
| 最終判断期限と計算根拠 | NOT SET |
| 判断者不通の場合の動き | NOT SET |

### 中止条件

| 条件ID | 観測する対象・指標 | 具体的な閾値・時間上限 | 中止後の動き | 判断者・連絡先 | 根拠 |
| --- | --- | --- | --- | --- | --- |
| STOP-001 対象・版の不一致 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| STOP-002 認証・公開の異常 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| STOP-003 データ整合の異常 | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |
| STOP-004 時間超過・復旧見込み | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET |

### 連絡

| 場面 | 伝える内容 | 送る担当 | 相手・経路 | 不通時の扱い | 実確認参照 |
| --- | --- | --- | --- | --- | --- |
| 開始 | 対象、版、窓、影響 | NOT SET | NOT SET | NOT SET | 未確認 |
| 判断点 | 実績、残時間、次の判断 | NOT SET | NOT SET | NOT SET | 未確認 |
| 異常・中止 | 症状、影響、保存した証跡、判断 | NOT SET | NOT SET | NOT SET | 未確認 |
| 終了 | 結果、残リスク、次担当 | NOT SET | NOT SET | NOT SET | 未確認 |

## 6. PJ03-C3 残リスク・未解決事項と変更承認

| RISK-ID | 内容・影響 | 観測方法 | 対処・限界 | 担当・解消期限 | 受容の判断者・範囲・日時 | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-001 | NOT SET | NOT SET | NOT SET | NOT SET | NOT RUN | 未確認 |

| 変更責任者の実判断 | 記入欄 |
| --- | --- |
| 組織の変更申請・承認記録の参照 | NOT SET |
| 実際の確認者ID / change役割・権限の確認 | 未確認 |
| 承認対象ホスト・変更前後SHA・設定版・手順版 | NOT SET |
| 承認対象の作業日時・変更窓 | NOT SET |
| 最新の条件記録・証跡集合 | NOT SET |
| 判断・条件・承認日時 | NOT RUN |
| 条件変更時の再確認・承認失効の扱い | NOT SET |

## 7. 工程の判定と更新履歴

| 条件 | 結果 | 最新証跡・対象版 |
| --- | --- | --- |
| PJ02-C2 | NOT RUN | NOT SET |
| PJ02-C3 | NOT RUN | NOT SET |
| PJ03-C1 | NOT RUN | NOT SET |
| PJ03-C2 | NOT RUN | NOT SET |
| PJ03-C3 | NOT RUN | NOT SET |

| 更新日時 | 変更理由 | 旧対象・旧版・元期限 | 新対象・新版・新期限 | 影響する試験・承認 | 判断記録 |
| --- | --- | --- | --- | --- | --- |
| NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | 未確認 |

この計画は当日の実行ログではありません。作業開始後は承認された版と照合し、実際の操作・結果・判断をPJ04の実行記録へ追記します。架空の時刻、試験成功、承認を実績欄へコピーしません。
