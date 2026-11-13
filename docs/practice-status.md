# 実習状況と次の確認

[プロフィール](../README.md) ／ [採用ご担当者さまへ](./overview-for-recruiters.md) ／ [学びと失敗の記録](../LEARNINGS.md)

**公開済み証跡に基づく状況（2026-11-13 整理）。** AI の手順案内を受けた本人操作と、残る確認をまとめています。操作日と記録整理日、異なる環境の結果を分けて記載します。

<!-- markdownlint-disable-next-line MD033 -->
<a id="115追加実習と次の予定"></a>

## 11/5：KVM での監視・ローカル通知・手動復旧

KVM 上の Ubuntu VM で、AI の案内に沿って本人が **7サービスの部分構成**を操作しました。同じ構成で監視の正常確認・停止時の変化、app 停止による **FIRING 受信 → 手動復旧 → RESOLVED 受信**を確認し、最後に app healthy・HTTP 200・監視値の復帰を確認しています。通知先は同じ VM 内の webhook-sink で、Slack・メールへの外部配信ではありません。[操作と確認範囲](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-11-05-kvm-monitoring-notification.md)

原画像・生ログ・受信 JSON はリポジトリ未収録です。受信履歴の保存終了0は画面で確認しましたが、内容の取得・照合は未実施です。独力再現、通知遅延・復旧所要時間の評価、全構成の受け入れには数えません。

同日の後続実習では、Grafana の数値表示と目印付き Nginx ログの Loki 検索を確認しました。最後に10サービス Up・app healthy を確認していますが、上の7サービスでの通知試験と合算して、全機能の合格とは扱いません。[表示・検索と本人回答](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-11-05-kvm-grafana-loki-practice.md)

## 続く本人実習の記録

| 記録日・整理日 | 確認したことと範囲 |
| --- | --- |
| [11/6：Nginx 停止・手動復旧](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-11-06-nginx-guided-recovery.md) | HTTP 200 → 接続失敗 → 再開直後の終了52 → 再確認で200を確認。本人の説明と AI の補足を分けて記録。実機日時・仮想化方式・コード版は未採録で、11/5と同一環境とは断定しない |
| [11/10記録整理：AD・クライアント連携と GPO](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-11-10-kvm-ad-client-access-gpo.md) | 旧 Hyper-V ラボとは別の KVM 環境で、ドメイン参加、部署別共有の作成・読取りと他部署拒否、ドライブ配布・異動後の切替等を画面確認。操作の正確な実施日時は未採録。全運用試験の完了ではない |

いずれも AI の案内に沿った本人操作で、原画像・生ログはリポジトリ未収録です。9月の AD 復元後の SYSVOL 欠損・修正手順の検証未完了や、WSUS の総合 **FAIL**・通し再試験未実施を、別環境の結果で上書きしません。

## 10/31：Nginx の停止・手動復旧

`ubuntu-practice01` の app / nginx の最小構成で、AI の案内を受けて本人が停止・手動復旧を1回操作しました。HTTP 200 → 接続失敗（curl 終了 7）→ HTTP 200 と、停止中の app healthy を本人提供画面で確認しました。理由の説明を受けた後に、停止対象と復旧判断の根拠を回答しました。

独力の原因特定・ライブデモ全体の合格には数えていません。原画像・生ログはリポジトリ未収録です。

[操作結果](https://github.com/ns7jp/server/blob/92609440727e6351a551da54e6d640a707902f0d/docs/evidence/2026-10-31-ubuntu-practice01-guided-recovery.md)

### 再起動後の2サービス確認

同日の再接続後には、Docker active・app healthy・nginx 稼働・HTTP 200・curl 終了 0 を確認しました。起動時刻から約9分後の観測で、復帰所要時間や監視全体、24時間稼働は評価していません。

再起動前ログ末尾の表示と再接続後の画面を比較し、起動時刻の更新・前後の HTTP 200・curl 終了 0 を確認しました。原ログは本人の手元に保管し、ハッシュ表示は確認、再計算・全文照合は未実施です。

[再起動後の2サービス確認](https://github.com/ns7jp/server/blob/44d672ac2c160dbcd5907c21d935cc74e449d8e6/docs/evidence/2026-10-31-ubuntu-practice01-reboot-check.md)

## 次に確認すること

11/5 の従来の計画では対象 VM を利用できず未実施と記載していました。上記の KVM 本人実習は後続の証跡として分けています。[小さな構成の確認](./demo-script.md#本人による小さな構成の確認)では、参照した手順・実結果・判断理由・AI に相談した箇所を本人が残し、説明できる範囲を確かめます。

独力での原因特定・再構築・説明は未確認です。公開済みの動画は保存画面の証跡リプレイで、実操作の連続録画ではありません。

次回は一つの小構成で、停止前の予想、選んだ確認コマンドと理由、正常・停止中・復旧後の実出力を[短い結果票](./evidence/templates/linux-live-demo.md)に残します。実行日時・対象版も同時に採録します。11/5 の通知履歴など過去の原資料が残っている場合は、内容と由来を確認した公開用コピーを当時の記録へ添えます。残っていない資料は新しい実行結果で埋めず、別の日付で再実施します。

クラウド応募向けの追加実習には、[既存の EC2 1 台の採録手順](https://github.com/ns7jp/aws/blob/main/evidence/level02/README.md)を使います。実 AWS での構築・疎通・削除・残存確認・費用確認は **NOT RUN** です。アカウントへの認証、費用上限、終了時刻が揃ってから実施し、後日の費用確認まで結果を分けて残します。

### 採録計画と記入用紙

本人の次の実行は、既存の[採録計画](./evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)にまとめています。[初期構築の記入用結果票](https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-10-25-independent-rerun-ubuntu-initial-build.md)は準備済みですが、**下書き・NOT RUN** です。[ライブデモの記録用紙](./evidence/templates/linux-live-demo.md)も、実施後に本人が記入します。

## 検証範囲の読み方

- **実装済み**：コード・文書がある状態です。
- **実測済み**：実行結果がある状態です。記録ごとに日時・環境・実施者・確認範囲が異なり、別々の演習を合算して全構成の合格とは扱いません。
- **未実施（NOT RUN）**：実行結果がない状態です。

11/5 に本人が確認した通知は、7サービスの部分構成でのローカル受信です。Slack・メール等の外部通知、OS再起動後の全構成復帰・受け入れ、24時間以上の稼働、別 VM への復元、AWS の実構築は未完了です。AI が直接操作した記録は本人の操作経験に含めません。

Ubuntu の監視・ログ検索、Ansible の再実行、AD の2台構成、CI の結果と個別の判定は、[代表実績と証拠](./evidence/featured-evidence.md)と[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)から確認できます。文書・コード生成を含む[AI 支援の内訳](./resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)も公開しています。
