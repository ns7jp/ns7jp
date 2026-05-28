# アーキテクチャ決定記録（ADR）

> **本ドキュメントの位置付け**
>
> ポートフォリオで採用している主要な技術選定について、**「なぜそれを選んだか」「他に何を比較したか」「どんなトレードオフを呑んだか」** を記録します。
> 「動くものを作れる」だけでなく、**判断の根拠を言語化できる** ことを示すのが目的です。

---

## ADR とは

[Michael Nygard 形式](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) の軽量フォーマットを採用します。

| 項目 | 内容 |
| --- | --- |
| Status | Proposed / Accepted / Deprecated / Superseded |
| Context | なぜこの決定が必要だったか |
| Decision | 何を決めたか |
| Alternatives | 他に検討した選択肢 |
| Consequences | 良い影響・悪い影響・将来の制約 |

---

## ADR 一覧

| # | タイトル | Status | 関連設計書 |
| --- | --- | --- | --- |
| [0001](./0001-monitoring-stack.md) | 監視スタックに Prometheus + Grafana を採用 | Accepted | [構成図](../architecture-diagram.md) |
| [0002](./0002-deploy-with-docker-compose.md) | v1 デプロイ方式に Docker Compose を採用 | Accepted | [08 K8s ロードマップ](../server-monitor-improvements/08-kubernetes-roadmap.md) |
| [0003](./0003-loki-for-logs.md) | ログ集約に Loki を採用 | Accepted | [01 Loki](../server-monitor-improvements/01-loki-log-aggregation.md) |
| [0004](./0004-ansible-for-config.md) | 構成管理に Ansible を採用 | Accepted | [02 Ansible](../server-monitor-improvements/02-ansible-automation.md) |
| [0005](./0005-terraform-for-iac.md) | IaC に Terraform を採用 | Accepted | [03 Terraform/AWS](../server-monitor-improvements/03-terraform-aws.md) |
| [0006](./0006-self-host-monitoring.md) | 監視は自前運用（SaaS にしない） | Accepted | [13 FinOps](../server-monitor-improvements/13-finops.md) |
| [0007](./0007-slack-notifications.md) | 通知チャネルに Slack を採用 | Accepted | [07 インシデント対応](../server-monitor-improvements/07-incident-response.md) |
| [0008](./0008-stepwise-auth.md) | 認証を Basic → OIDC SSO へ段階移行 | Accepted | [09 セキュリティ運用](../server-monitor-improvements/09-security-operations.md) [16 ID 運用](../server-monitor-improvements/16-identity-operations.md) |

---

## 運用ルール

- 新規 ADR は 4 桁連番でファイル名を付与（例：`0009-xxx.md`）
- 一度 Accepted になった ADR は **削除せず** 、Superseded として更新履歴を残す
- 大きな技術選定（DB、認証、デプロイ方式、監視ツール）の追加・変更時は必ず ADR を起こす
- 設計書（`server-monitor-improvements/`）から ADR へリンクし、「決定の根拠」を辿れるようにする

---

## なぜ ADR を書くか（個人の動機）

製造・物流の現場で 10 年以上働いた経験から、**「決めた人がいなくなると、なぜそうなっているか誰も説明できない」** 状況の怖さを学びました。

例：「この棚配置は誰が決めたんですか？」「分かりません。前任者がそうしていたので…」

この状況をインフラ運用で繰り返さないため、**判断の根拠を残す習慣** を最初から組み込んでいます。
