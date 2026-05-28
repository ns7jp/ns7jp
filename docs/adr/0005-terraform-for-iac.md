# ADR-0005: IaC に Terraform を採用

- **Status**: Accepted（実装は v2.0 で予定）
- **Date**: 2026-04-05
- **Deciders**: ns7jp（個人ポートフォリオ）

---

## 1. Context

v2.0 で server-monitor を AWS へ移行するにあたり、インフラ構築を **コード化（IaC）** する必要がある。

「マネジメントコンソールで作りました」では再現性が無く、ポートフォリオ訴求としても弱い。

---

## 2. Decision

**HashiCorp Terraform** を採用する（[03 設計書](../server-monitor-improvements/03-terraform-aws.md)）。

State は S3 + DynamoDB Lock（後述）。モジュール構造は `network / compute / monitoring / iam` で分割する。

---

## 3. Alternatives

| 選択肢 | 評価 | 不採用理由 |
| --- | --- | --- |
| **AWS CloudFormation** | AWS 純正、ロールバックが堅牢 | AWS 固有でマルチクラウド時に詰む、構文が冗長、求人ニーズで Terraform に劣後 |
| **AWS CDK（TypeScript / Python）** | プログラム言語で書ける | プログラム的抽象化の自由度が高すぎて、純粋な「宣言」より読みにくくなりがち。学習段階では HCL の方が「インフラを宣言する感覚」を掴みやすい |
| **Pulumi** | プログラム言語、マルチクラウド | Terraform よりコミュニティが小さい、求人マッチで弱い |
| **OpenTofu**（Terraform フォーク） | OSS ライセンス、Terraform 互換 | 採用しても良いが、現時点では Terraform Registry / ドキュメントの揃いで本家を選択。**将来切替の余地あり** |
| **手動 + ドキュメント化** | 学習コスト最小 | IaC の意義そのものを放棄、不採用 |

---

## 4. Decision Rationale

### 4.1 なぜ Terraform か

1. **求人マッチ**：「Terraform 経験」は AWS インフラ求人で最頻出キーワード
2. **マルチクラウド経験への布石**：将来 GCP / Azure / オンプレも触る場合に同じツールで通用
3. **教材の豊富さ**：日本語書籍、AWS公式ハンズオン、HashiCorp Learn が揃っている
4. **State という概念の学習価値**：「現在のあるべき姿」をコードで持つ思想は、宣言型インフラ理解の核
5. **Ansible との役割分担の明確さ**（[ADR-0004](./0004-ansible-for-config.md) 参照）

### 4.2 OpenTofu との関係

2023 年の Terraform ライセンス変更後、OpenTofu がフォークされた。本ポートフォリオでは：

- **学習・採用面接アピール**：Terraform の方が圧倒的に通りが良い
- **コード互換**：プロバイダブロックは互換、将来 OpenTofu 移行は容易
- **判断保留**：商用案件で OpenTofu 指定があれば即対応可能と回答

---

## 5. State 管理の決定

| 項目 | 採用 | 不採用 |
| --- | --- | --- |
| Backend | S3（リージョン：ap-northeast-1） | local（壊れたら復旧不能） |
| Lock | DynamoDB（state ファイル単位） | なし（複数人で同時 apply 時に破損） |
| 暗号化 | KMS Customer Managed Key | デフォルトの SSE-S3（監査で弱い） |
| バージョニング | S3 Versioning + MFA Delete | バージョニング無し |
| State 分割 | env 別 + 機能別（4 モジュール） | 巨大 monolith state |

---

## 6. CI/CD への組込み

| ステージ | 内容 |
| --- | --- |
| PR 作成 | `terraform fmt -check` / `terraform validate` / `tfsec` / `checkov` |
| PR レビュー | `terraform plan` の結果を PR コメントに自動投稿 |
| Merge | 手動承認（Issue / Slack）後に `terraform apply` |
| State Drift | 週次で `terraform plan` をスケジュール実行、差分があれば Slack 通知 |

→ [09 §3 セキュリティ CI](../server-monitor-improvements/09-security-operations.md) と統合運用。

---

## 7. Consequences

### 7.1 良い影響

- **「マネコンで作りました」の卒業**：採用面接で IaC 経験として語れる
- **環境間の一貫性**：dev / staging / prod を同じコードで再現可能
- **コードレビュー可**：インフラ変更が Pull Request の議論対象になる
- **災害復旧の保証**：State さえ残れば、AWS アカウントを失っても再構築可能

### 7.2 悪い影響・制約

- **学習コスト**：HCL、モジュール設計、State 設計、Provider 仕様の習得が必要
- **State 破損リスク**：Lock を取らない / 手作業で AWS を変更するとドリフト発生
- **モジュール設計の難しさ**：抽象化しすぎると読みにくく、しなさすぎるとコピペになる
- **「terraform apply で全部消える」事故**：レビューと minimal blast radius を運用で担保

### 7.3 リスク低減策

- `prevent_destroy` lifecycle ルールを重要リソース（S3 / KMS / DB）に付与
- `terraform plan` の出力を PR でレビュー必須
- 商用導入時は **Terraform Cloud / Atlantis / Spacelift** などの GitOps 系を導入

---

## 8. 参考

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [HashiCorp Learn — Terraform](https://developer.hashicorp.com/terraform/tutorials)
- [Yevgeniy Brikman, "Terraform: Up & Running"](https://www.terraformupandrunning.com/)
