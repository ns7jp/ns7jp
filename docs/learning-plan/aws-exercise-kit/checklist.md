# AWS 基礎構築演習 実施チェックリスト（正本ではない）

正本は [11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md)。このチェックリストは実施中に
開いておく進捗確認用の補助であり、詳細な想定結果・判定は必ず設計書側を参照する。

## 事前（コンソール）

- [ ] A-1 ルートユーザーに MFA を設定した
- [ ] A-2 IAM Identity Center を有効化し、本人用ユーザーを作成した
- [ ] A-3 AWS Budgets で月額 1,000 円の予算アラートを設定した（**apply より前に必須**）
- [ ] `aws configure sso` でプロファイル `lab-aws` を作成した

## Terraform（このキット）

- [ ] `terraform init`
- [ ] `terraform validate`（このキットのREADMEの通り、この AI 支援セッションでは未実施）
- [ ] `terraform plan` の出力を読み、追加のみで変更・削除が 0 件であることを確認した
- [ ] 内容を理解した上で `terraform apply` を実行した（`yes` を入力する前に plan を読み直す）
- [ ] `terraform output` で `instance_id` / `public_ip` / `ssm_connect_command` を確認した

## 動作確認（B-8〜B-10）

- [ ] `ssm_connect_command` の出力で SSM Session Manager 接続ができた
- [ ] セッション内で `sudo apt update && sudo apt install -y nginx` を実行した
- [ ] ブラウザ / `curl` で `healthcheck_url` に `200` が返ることを確認した
- [ ] 変更なしで 2 回目の `terraform apply` を実行し、`No changes` を確認した（冪等性）
- [ ] `variables.tf` の値を 1 か所変更し `terraform plan` で差分のみが出ることを確認した

## 障害演習・試験（6 章・7 章）

- [ ] AWS-1（CPU アラーム、実際に発火）を実施し、検知〜復旧の所要時間を記録した
- [ ] AWS-2（システム状態チェック、疑似演習）を実施した。**「実際の障害」と混同しない**
- [ ] [7 章 試験項目書](../11-aws-foundational-exercise-design.md#7-試験項目書) T-01〜T-13 を実施した

## 終了処理（最優先）

- [ ] （13 番の目的も兼ねる場合のみ）[persistence-addon.md](./persistence-addon.md) の再起動試験・24/72 時間チェックまで実施した
- [ ] `terraform destroy` を実行し `Destroy complete!` を確認した
- [ ] コンソールで VPC・EC2・IAM ロールに残骸が無いことを目視確認した
- [ ] 翌日、Cost Explorer で実費（T-13）を確認し記録した
- [ ] [11 章](../11-aws-foundational-exercise-design.md#11-実施ステータスと次のアクション)に沿って STATUS.md・証跡採録チェックリスト・資格ロードマップを更新した
