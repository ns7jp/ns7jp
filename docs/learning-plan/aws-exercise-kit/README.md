# AWS 基礎構築演習 実施キット（Terraform）

> **状態: 未使用の雛形（2026-08-31 に AI 支援セッションで作成）。**
> このキットを置いただけでは [11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md) の実施ステータスは変わらない。
> 実施ステータスは、本人の AWS アカウントで実際に `apply` → 動作確認 → `destroy` まで通した後、
> [11 章の手順](../11-aws-foundational-exercise-design.md#11-実施ステータスと次のアクション)に従って本人が更新する。

## これは何か

[11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md) §5「Terraform化」が、実施時に
`learning-plan/aws-exercise-kit/` として新規作成すると定めていたディレクトリです。設計書 §2〜§3（要件・
パラメータシート）と §5 のコード例（抜粋）に書かれている仕様を、そのまま実行できる完全な Terraform コード
として起こしたものです。新しい設計判断は加えていません。

- ネットワーク（VPC・パブリックサブネット・IGW・ルートテーブル）
- セキュリティグループ（80 番のみ許可、22 番は開けない。接続は SSM Session Manager のみ）
- IAM ロール／インスタンスプロファイル（`AmazonSSMManagedInstanceCore` のみ付与、長期アクセスキーは使わない）
- EC2 インスタンス（Ubuntu 24.04 LTS、`t2.micro`、IMDSv2 必須、gp3 8GB 暗号化）

を、設計書 §5 の `Plan: 8 to add` に対応する構成としてコード化しています。

**含まれないもの**（[11 §4](../11-aws-foundational-exercise-design.md#4-構築手順書前半コンソールでの手動構築) A-1〜A-3 の通り、コンソールでの手動作業のまま）:

- ルートユーザーの MFA 設定
- IAM Identity Center の有効化・ユーザー作成
- AWS Budgets の予算アラート設定（**`apply` の前に必ず先に設定してください**）
- Nginx の導入（B-8 の通り、`apply` 後に SSM Session Manager で手作業インストール。意図的に自動化していません）

## 使い方の想定順序

1. [11 §4](../11-aws-foundational-exercise-design.md#4-構築手順書前半コンソールでの手動構築) A-1〜A-3（ルート MFA・IAM Identity Center・**予算アラート**）を先にコンソールで実施する
2. `aws configure sso` でプロファイル `lab-aws`（`variables.tf` の既定値）を作成する
3. このディレクトリで `terraform init` → `terraform plan`（8 種類前後のリソースが追加されることを確認）
4. 内容を確認したうえで `terraform apply`
5. [checklist.md](./checklist.md) に沿って SSM 接続・Nginx 導入・動作確認（[11 §5](../11-aws-foundational-exercise-design.md#5-terraform化後半適用と削除まで実行) B-8〜B-10）
6. [7 章 試験項目書](../11-aws-foundational-exercise-design.md#7-試験項目書)・[6 章 障害演習](../11-aws-foundational-exercise-design.md#6-障害演習検知から復旧まで)を実施
7. **必ず `terraform destroy` まで実施してから終了する**（[9 章の課金ストップ基準](../11-aws-foundational-exercise-design.md#9-実施タイムテーブルと中断基準)）
   - 有料 VPS を契約せず、この無料利用枠の EC2 で [13 恒久ホスト構築演習](../13-persistent-host-exercise-design.md)の
     目的（再起動後の永続性・24/72 時間稼働）も一緒に満たしたい場合は、`destroy`する前に
     [persistence-addon.md](./persistence-addon.md) を実施する
8. 完了後、[11 章](../11-aws-foundational-exercise-design.md#11-実施ステータスと次のアクション)の手順で STATUS.md・証跡採録チェックリスト・資格ロードマップを更新する

## 未検証の範囲

このキット自体は、この AI 支援セッションの実行環境に AWS アカウント・認証情報が無いため、
**`terraform apply` を一度も実行して確認していません。**

- `terraform fmt -check` は通過を確認しました（構文・整形エラーなし）
- `terraform validate` は、この環境のネットワークポリシーが `registry.terraform.io` への到達を許可していないため
  実行できませんでした。**`terraform init` → `terraform validate` を、ご自身の環境で `apply` の前に必ず実施してください**
- Ubuntu 24.04 LTS の AMI 検索フィルタ（`ubuntu/images/hvm-ssd*/ubuntu-noble-24.04-amd64-server-*`）は
  Canonical の公表命名規則に基づく一般的なパターンですが、実際に対象リージョンで AMI が 1 件だけヒットするかは未確認です
- IAM ロール・セキュリティグループの権限が実際に「SSM 接続はできるが SSH は届かない」という意図通りに動くかは、
  実機での確認（[7 章](../11-aws-foundational-exercise-design.md#7-試験項目書) T-02・T-09）が必要です

実施して差分（実バグ・パラメータの誤り等）が見つかった場合は、[phase1-kit](../phase1-kit/README.md) の
「未検証の範囲」と同じ扱いで、このファイルと [LEARNINGS.md](../../../LEARNINGS.md) に記録してください。

## 関連ドキュメント

- [11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md)
- [persistence-addon.md（この EC2 で 13 番の目的も無料枠内で兼ねる場合の追加手順）](./persistence-addon.md)
- [証跡採録チェックリスト](../../evidence-capture-checklist.md)
- [資格取得ロードマップ](../../certifications/roadmap.md)
