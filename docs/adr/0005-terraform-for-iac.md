# ADR-0005: IaC に Terraform を採用

- **Status**: Accepted（実装は v2.0 で予定）
- **Date**: 2026-04-05
- **Deciders**: ns7jp（個人ポートフォリオ）

> 公式ドキュメントや技術記事を調べて書いた学習目的の判断記録であり、
> 実務での AWS 運用・チーム意思決定の経験に基づくものではない。
> 代替案の比較も、深く使い込んだ上での判断ではなく、調べた範囲での判断である。

---

## 1. Context

v2.0 で server-monitor を AWS へ移行するにあたり、インフラ構築を **コード化（IaC）** する必要がある。

「マネジメントコンソールで作りました」では再現性が無く、ポートフォリオ訴求としても弱い。

---

## 2. Decision

**HashiCorp Terraform** を採用する（[03 設計書](../server-monitor-improvements/03-terraform-aws.md)）。

State は S3 に置く（**2026-07 追記：ロック方式を見直し、§6 参照**）。モジュールは `network / compute / monitoring / iam` で分ける。

---

## 3. 他に見た選択肢

- **AWS CloudFormation**: AWS 純正だが、教材・求人情報の多さで Terraform を優先した
- **Pulumi / AWS CDK**: プログラミング言語で書けるが、学習段階では宣言型の HCL の方が理解しやすいと感じた
- **OpenTofu**（Terraform のフォーク）: OSS ライセンスだが、現時点では Terraform 本家の方がドキュメント・Registry が揃っている（将来切り替える可能性はある）

深い比較検討というより、「教材が多く独学しやすいか」を基準に選んだ。

---

## 4. State 管理

| 項目 | 内容 |
| --- | --- |
| Backend | S3（ap-northeast-1） |
| Lock | 2026-07 に S3 ネイティブロックへ変更（§6） |
| 暗号化 | KMS で暗号化 |
| バージョニング | S3 Versioning を有効化 |
| State 分割 | 環境別 + 機能別（4 モジュール） |

---

## 5. CI への組込み（予定・未実装）

| ステージ | 内容 |
| --- | --- |
| PR 作成 | `terraform fmt -check` / `terraform validate` / セキュリティスキャン |
| PR レビュー | `terraform plan` の結果を PR コメントに自動投稿 |
| Merge | Issue / Slack の通知内容を自分で確認してから `terraform apply` |

---

## 6. Consequences

- **良い影響**: コードとして残るので、同じ構成を何度でも再現できる。変更を Pull Request 単位で見直せる
- **悪い影響・注意点**: HCL やモジュール設計、State の扱いを覚える必要がある。Lock を取らずに手作業で AWS を変更すると state とズレる
- **対策**: 重要リソースには `prevent_destroy` を設定し、`terraform plan` の内容を確認してから apply する

---

## 7. 2026-07 追記（見直し）

- **State ロック**: Terraform 1.11 で S3 backend 自体のロック機能（`use_lockfile`）が使えるようになったため、別途 DynamoDB テーブルを用意する方式から切り替えた（実装は [03 §5.3](../server-monitor-improvements/03-terraform-aws.md)）
- **セキュリティスキャン**: `tfsec` がメンテナンスモードになったため、後継の Trivy への切り替えを検討中（server-monitor 側では現状 tfsec がまだ動いている）

---

## 8. 参考

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [HashiCorp Learn — Terraform](https://developer.hashicorp.com/terraform/tutorials)
