# AWS 基礎構築演習 実施キット（Terraform）

> **状態: 未使用の雛形（2026-08-31 に AI 支援セッションで作成）。**
> このキットを置いただけでは [11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md) の実施ステータスは変わらない。
> 実施ステータスは、本人の AWS アカウントで実際に `apply` → 動作確認 → `destroy` まで通した後、
> [11 章の手順](../11-aws-foundational-exercise-design.md#11-実施ステータスと次のアクション)に従って本人が更新する。

## これは何か

一言でいうと、**AWS のコンソール画面をクリックして 1 つずつ作る代わりに、「どんな構成を作るか」を設定ファイルに
書いておき、コマンドで作成し、コマンドでまとめて削除できるようにしたもの**です。この「設定ファイルに書いて
コマンドで実行する」ためのツールが Terraform で、`terraform apply` で作成、`terraform destroy` でこのコードが
作った分をまとめて削除します。学習用途では、演習の後に消し残しが出にくく、消し忘れによる課金を防ぎやすいことが
利点です。

位置付けとしては、[11 AWS基礎構築演習設計](../11-aws-foundational-exercise-design.md) §5「Terraform化」が、実施時に
`learning-plan/aws-exercise-kit/` として新規作成すると定めていたディレクトリです。設計書 §2〜§3（要件・
パラメータシート）と §5 のコード例（抜粋）に書かれている仕様を、そのまま実行できる完全な Terraform コード
として起こしたものです。新しい設計判断は加えていません。

- ネットワーク（VPC・パブリックサブネット・IGW・ルートテーブル）
- セキュリティグループ（80 番のみ許可、22 番は開けない。接続は SSM Session Manager のみ）
- IAM ロール／インスタンスプロファイル（`AmazonSSMManagedInstanceCore` のみ付与、長期アクセスキーは使わない）
- EC2 インスタンス（Ubuntu 24.04 LTS、`t2.micro`、IMDSv2 必須、gp3 8GB 暗号化）

を、設計書 §5 の `Plan: 8 to add` に対応する構成としてコード化しています。`Plan: 8 to add` は `terraform plan` の
出力に現れる行で、「これから 8 個のリソースを追加します」という意味です。ただし設計書 §5 B-6 が「実際の内訳は
資源分割により前後する」と注記しているとおり、この数字は目安であり、表示される個数が 8 と完全に一致しなくても
異常ではありません（下の「使い方の想定順序」3 の「8 種類前後」も同じ理由です）。

### なぜこの構成なのか（1 行で説明できるようにしておく）

次の 3 点には、それぞれ避けたい事故があります。

- **22 番（SSH）を開けない**: インターネットに向けて開いた 22 番ポートは、無差別なログイン試行の対象になり続けます。代わりに SSM Session Manager（AWS 側の窓口を経由してサーバーの中に入る仕組み。サーバー側から AWS へつなぎに行くので、外から入るための穴を開けなくてよい）だけを使うので、SSH の鍵もパスワードも管理せずに済みます
- **長期アクセスキーを使わない**: IAM ロールを EC2 に紐付けると、期限付きの資格情報が自動で配られ、自動で入れ替わります。ファイルに書き置いた長期キーが流出する、という事故そのものが起きようのない状態にできます
- **IMDSv2 必須**: EC2 が自分自身の情報（紐付いた IAM ロールの一時資格情報を含む）を取りに行く内部の窓口を、先にトークンを取ってからでないと使えない方式に限定する設定です。アプリの不具合や誤設定を経由してこの窓口の中身を外部に持ち出される事故を防ぎます

**含まれないもの**（[11 §4](../11-aws-foundational-exercise-design.md#4-構築手順書前半コンソールでの手動構築) A-1〜A-3 の通り、コンソールでの手動作業のまま）:

- ルートユーザーの MFA 設定
- IAM Identity Center の有効化・ユーザー作成
- AWS Budgets の予算アラート設定（**`apply` の前に必ず先に設定してください**）
- Nginx の導入（B-8 の通り、`apply` 後に SSM Session Manager で手作業インストール。意図的に自動化していません）

## 使い方の想定順序

1. [11 §4](../11-aws-foundational-exercise-design.md#4-構築手順書前半コンソールでの手動構築) A-1〜A-3（ルート MFA・IAM Identity Center・**予算アラート**）を先にコンソールで実施する。
   IAM Identity Center の権限セット（カスタム許可セット）は [iam-identity-center-permission-set.json](./iam-identity-center-permission-set.json) をそのまま貼り付けられる
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

## `iam-identity-center-permission-set.json` について

[11 §2](../11-aws-foundational-exercise-design.md#2-要件と基本設計)が定める「VPC・EC2・IAM（ロール操作限定）・
CloudWatch・SNS・Budgets に絞ったカスタム許可セット」を、IAM Identity Center の Permission set にそのまま
貼り付けられる形にしたインラインポリシーです。`AdministratorAccess` は使わず、かつ IAM ユーザー・グループ・
他人の権限を変更する操作は許可していません（EC2 インスタンスにアタッチする IAM ロールの作成・削除に必要な
範囲のみ）。実運用のような最小権限まで絞り込んだものではなく、この演習が触る範囲を大まかに区切ったものである
点に注意してください。

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
