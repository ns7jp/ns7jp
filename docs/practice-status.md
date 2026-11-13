# 実習状況と次の確認

[プロフィール](../README.md) ／ [採用ご担当者さまへ](./overview-for-recruiters.md) ／ [学びと失敗の記録](../LEARNINGS.md)

**確認状況：2026-11-05 時点。** 本人が手元の VM で行った操作と、次に取り組む確認をまとめています。

## 10/31：Nginx の停止・手動復旧

`ubuntu-practice01` の app / nginx の最小構成で、AI の案内を受けて本人が停止・手動復旧を1回操作しました。HTTP 200 → 接続失敗（curl 終了 7）→ HTTP 200 と、停止中の app healthy を本人提供画面で確認しました。理由の説明を受けた後に、停止対象と復旧判断の根拠を回答しました。

独力の原因特定・ライブデモ全体の合格には数えていません。原画像・生ログはリポジトリ未収録です。

[操作結果](https://github.com/ns7jp/server/blob/92609440727e6351a551da54e6d640a707902f0d/docs/evidence/2026-10-31-ubuntu-practice01-guided-recovery.md)

### 再起動後の2サービス確認

同日の再接続後には、Docker active・app healthy・nginx 稼働・HTTP 200・curl 終了 0 を確認しました。起動時刻から約9分後の観測で、復帰所要時間や監視全体、24時間稼働は評価していません。

再起動前ログ末尾の表示と再接続後の画面を比較し、起動時刻の更新・前後の HTTP 200・curl 終了 0 を確認しました。原ログは本人の手元に保管し、ハッシュ表示は確認、再計算・全文照合は未実施です。

[再起動後の2サービス確認](https://github.com/ns7jp/server/blob/44d672ac2c160dbcd5907c21d935cc74e449d8e6/docs/evidence/2026-10-31-ubuntu-practice01-reboot-check.md)

## 11/5：追加実習と次の予定

本人の環境を利用できず、追加の実習は未実施です。環境を利用できるようになってから、[小さな構成の確認](./demo-script.md#本人による小さな構成の確認)で、通信経路・確認の目的・復旧の根拠を自分の言葉で説明する練習に取り組みます。その後、同じ環境で監視検知・通知受信・復旧までを通して確認します。

独力での原因特定・再構築・説明は未確認です。公開済みの動画は保存画面の証跡リプレイで、実操作の連続録画ではありません。

### 採録計画と記入用紙

本人の次の実行は、既存の[採録計画](./evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)にまとめています。[初期構築の記入用結果票](https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-10-25-independent-rerun-ubuntu-initial-build.md)は準備済みですが、**下書き・NOT RUN** です。[ライブデモの記録用紙](./evidence/templates/linux-live-demo.md)も、実施後に本人が記入します。

## 検証範囲の読み方

- **実装済み**：コード・文書がある状態です。
- **実測済み**：実行結果がある状態です。記録ごとに日時・環境・実施者・確認範囲が異なり、別々の演習を合算して全構成の合格とは扱いません。
- **未実施（NOT RUN）**：実行結果がない状態です。

本人による監視から実通知・復旧までの一連の検証、24時間以上の稼働、別 VM への復元、AWS の実構築は未完了です。AI が直接操作した記録は本人の操作経験に含めません。

Ubuntu の監視・ログ検索、Ansible の再実行、AD の2台構成、CI の結果と個別の判定は、[代表実績と証拠](./evidence/featured-evidence.md)と[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)から確認できます。文書・コード生成を含む[AI 支援の内訳](./resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)も公開しています。
