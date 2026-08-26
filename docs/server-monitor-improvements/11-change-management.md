# 11. 変更管理プロセス（設計サンプル）

> **反映状況**
>
> server-monitor 側には、この設計書のうち PR テンプレート、Change request Issue、
> Evidence capture Issue、[変更管理ミニ運用](https://github.com/ns7jp/server-monitor/blob/main/docs/change-management.md)
> という**もっと軽い版**だけを実際に実装しています。以下の内容の大半（CAB、変更窓・凍結期間、
> 自動変更ログ、ITIL 対応表など）は書籍・公式ドキュメントを読んで設計した学習用のサンプルであり、
> 実際に運用したことはありません。

## 1. 背景・課題

server-monitor には「障害対応の手順」（[今後の興味リスト](../roadmap/README.md)）はあるが、
「平常時の設定変更をどう記録し、戻せるようにするか」が最初は決まっていなかった。

| 現状の課題 | リスク |
| --- | --- |
| 設定変更が記録されない | 障害発生時、直前の変更が原因か特定できない |
| ロールバック計画が無いまま変更 | 失敗時に手作業で戻すしかない |
| 変更レビューが属人化 | 「とりあえず動いたから OK」が積み重なる |

## 2. 実際に実装した範囲（軽量版）

個人ラボなので、承認会議や専任の承認者は置かず、PR と Issue だけで完結させる。

- 影響が小さい変更（ドキュメント修正、表示調整など） → PR テンプレートに確認結果を書く
- 影響が大きい変更（監視設定、Ansible、Terraform など） → 先に Change request Issue を作り、
  影響範囲・検証・ロールバック方法を書いてから着手する
- 秘密値やセキュリティに関わる緊急の修正 → 先に直し、事後に Issue へ時系列を残す

実装の詳細は [server-monitor 側の変更管理ミニ運用](https://github.com/ns7jp/server-monitor/blob/main/docs/change-management.md)
を参照。

## 3. ここから先は設計サンプル（未実装）

以下は、チーム規模が大きくなった場合の発展形として調べて書いたものであり、
個人ラボの現状には過剰な内容だと認識している。

- **変更の種別分け**: ITIL の「標準変更・通常変更・緊急変更」という考え方を参考に、
  影響度に応じてレビューの重さを変える設計。CAB（変更諮問委員会）のような会議体は
  個人ラボには不要なため、PR レビューに置き換える案。
- **変更窓・凍結期間**: 実施してよい曜日・時間帯や、年末年始などの凍結期間を決めておく設計。
- **変更後レビュー（PIR）**: 実施後に想定通りだったかを振り返るテンプレート。

これらは、複数人のチームや本番相当の環境を運用することになった際に、
必要な部分だけを取り入れる想定でいる。

## 4. インシデント対応との連動（設計）

障害から出た恒久対策は、次回同じ手順を再現できるよう、必ず通常の変更（PR）として
実施する、という考え方。「次回は気を付けます」で終わらせないための仕組み。

## 5. 関連設計書・ADR

- [04 SLO 設計](./04-slo-design.md) — エラーバジェット消費で変更を控える判断につなげる案
- [今後の興味リスト（インシデント対応プロセス）](../roadmap/README.md) — 恒久対策の実施先
- [ADR-0004 Ansible 採用](../adr/0004-ansible-for-config.md)
- [ADR-0005 Terraform 採用](../adr/0005-terraform-for-iac.md)

## 6. 参考

- [ITIL 4 Foundation: Change Enablement](https://www.axelos.com/certifications/itil-service-management/itil-4-foundation)
- [Google SRE Book — Chapter 16: Tracking Outages](https://sre.google/sre-book/tracking-outages/)
