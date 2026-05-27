# server-monitor 改善計画 一覧

[server-monitor](https://github.com/ns7jp/server-monitor) リポジトリに対して着手予定の改善を、設計書として先行整備したものです。
本リポジトリ（プロフィール）上で設計を固めてから、server-monitor 側で実装します。

---

## 改善テーマ一覧

### 運用基盤の強化（v1.1 〜 v2.0 実装対象）

| # | テーマ | 目的 | 想定工数 | 優先度 |
| --- | --- | --- | --- | --- |
| 01 | [Loki + Promtail によるログ集約](./01-loki-log-aggregation.md) | メトリクスとログを同一ダッシュボードで可視化 | 約 2 週間 | 高 |
| 02 | [Ansible による構成管理自動化](./02-ansible-automation.md) | 手順書をコード化し、再現性と移植性を確保 | 約 3 週間 | 高 |
| 03 | [AWS + Terraform 化](./03-terraform-aws.md) | クラウド + IaC への移行（学習要素を兼ねる） | 約 4 週間 | 中 |
| 04 | [SLO / SLI / エラーバジェット設計](./04-slo-design.md) | 「何を守るか」を数値で定義し、運用品質を可視化 | 約 1 週間 | 中 |
| 05 | [バックアップ・復旧演習](./05-backup-recovery-drill.md) | 設計だけでなく実演し、復旧手順を実証 | 約 1 週間 | 中 |
| 06 | [分散トレーシング（Tempo + OpenTelemetry）](./06-observability-traces.md) | 可観測性の三本柱（Metrics / Logs / **Traces**）を完成 | 約 2 週間 | 中 |
| 07 | [インシデント対応プロセス・ポストモーテム](./07-incident-response.md) | 障害から「組織として学ぶ仕組み」を整備 | 約 1 週間 | 高 |
| 09 | [セキュリティ運用プロセス](./09-security-operations.md) | 設定だけでなく運用継続できるセキュリティへ | 約 2 週間 | 中 |

### 学習ロードマップ寄り（実装は中長期）

| # | テーマ | 目的 | 想定期間 | 優先度 |
| --- | --- | --- | --- | --- |
| 08 | [Kubernetes / EKS 発展計画](./08-kubernetes-roadmap.md) | CKAD / CKA と連動した段階的 K8s 習得 | 5 か月（学習） | 低（中長期） |

合計：実装系（01〜07, 09）で約 16 週間（並列実施で 12 週間想定）。08 は資格学習と連動して 2027 年以降。

---

## 全体ロードマップ

```mermaid
gantt
    title server-monitor 改善ロードマップ
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section v1.1 ログ + 三本柱
    01. Loki 設計           :done, l1, 2026-05-27, 3d
    01. 実装・検証          :active, l2, after l1, 11d
    06. Tempo 設計          :tr1, after l2, 3d
    06. 実装・検証          :tr2, after tr1, 11d

    section v1.2 自動化
    02. Ansible 設計        :a1, after tr2, 5d
    02. 実装・検証          :a2, after a1, 16d

    section v1.3 運用品質
    04. SLO 設計            :s1, after a2, 7d
    07. インシデント対応    :ir1, after s1, 5d
    05. 復旧演習            :b1, after ir1, 7d
    09. セキュリティ運用    :se1, after b1, 10d

    section v2.0 クラウド
    03. Terraform 設計      :t1, after se1, 7d
    03. 実装・検証          :t2, after t1, 21d

    section v3.0 学習トラック
    08. K8s Phase 1-2 学習  :k1, 2027-04-01, 60d
    08. K8s Phase 3-4 学習  :k2, after k1, 90d
```

---

## 各テーマ間の依存関係

```mermaid
flowchart LR
    L[01. Loki<br/>ログ集約] --> S[04. SLO 設計]
    L --> Tr[06. Tempo<br/>トレース]
    Tr --> S
    A[02. Ansible<br/>構成管理] --> T[03. Terraform<br/>AWS 化]
    S --> IR[07. インシデント<br/>対応]
    IR --> B[05. 復旧演習]
    L --> T
    A --> B
    A --> Sec[09. セキュリティ<br/>運用]
    Sec --> T
    T --> K[08. Kubernetes<br/>発展計画]
```

- **Loki → SLO**：ログ由来の SLI（エラー率）を測るために Loki が先
- **Loki → Tempo**：Trace から Log への相関ジャンプを使うため、ログ集約が先
- **Tempo → SLO**：レイテンシ SLI の調査を Exemplars でトレースに繋ぐため
- **Ansible → Terraform**：OS 内の構成を Ansible で完全自動化してから AWS にコピーする
- **SLO → インシデント対応**：Sev 判定の数値根拠（バーンレート）として SLO が必要
- **インシデント対応 → 復旧演習**：演習の振り返りで初回ポストモーテムを生む流れ
- **Ansible → セキュリティ運用**：パッチ管理の実体が Ansible にあるため
- **Terraform → Kubernetes**：VM ベース AWS 環境を理解してから EKS に進む

---

## 関連ドキュメント

- [アーキテクチャ図（現状 / 将来構想）](../architecture-diagram.md)
- [資格取得ロードマップ](../certifications/roadmap.md)
