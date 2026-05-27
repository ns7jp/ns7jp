# ADR-0002: v1 デプロイ方式に Docker Compose を採用

- **Status**: Accepted（v3.0 で Kubernetes へ発展予定）
- **Date**: 2026-01-15
- **Deciders**: ns7jp（個人ポートフォリオ）

---

## 1. Context

server-monitor v1.0 のデプロイ方式を決定する必要があった。

**要件：**

- 単一ホストで完結し、面接で「これが動いているサーバーです」と即時提示できる
- 設定がコード化されており、再現可能
- 学習者として、コンテナの基本概念（イメージ / ボリューム / ネットワーク / 環境変数）を体得できる
- 将来 Kubernetes へスムーズに移行できる経路がある

---

## 2. Decision

**Docker Compose** を採用する。`docker-compose.yml` で全コンテナ（Flask アプリ / Prometheus / Grafana / Alertmanager / node-exporter / Nginx）を宣言的に管理する。

将来的に Ansible（[02](../server-monitor-improvements/02-ansible-automation.md)）→ Terraform / AWS（[03](../server-monitor-improvements/03-terraform-aws.md)）→ Kubernetes / EKS（[08](../server-monitor-improvements/08-kubernetes-roadmap.md)）と段階的に発展させる。

---

## 3. Alternatives

| 選択肢 | 評価 | 不採用理由（v1 段階） |
| --- | --- | --- |
| **ベアメタル / systemd** | 学習価値は高い（Linux 知識）、最小依存 | 再現性が低く、ホスト OS への依存が強い。設定が手順書化される（コード化されない） |
| **Kubernetes（minikube / kind / k3s）** | モダン、求人多 | 学習コストが大きく、最初に詰まりやすい。v1 時点では「監視そのもの」の学習に集中したい。v3 で本格対応予定 |
| **Nomad + Consul** | シンプル、HashiCorp スタック統一 | 国内案件で出現頻度が低い、求人マッチに弱い |
| **Docker Swarm** | Compose ファイルを流用可、簡易クラスタ | Kubernetes に主流が移っており、学習投資対効果が低い |
| **Podman + systemd quadlet** | rootless、依存軽 | Docker Compose の体験から離れ、教材が少ない |

---

## 4. Consequences

### 4.1 良い影響

- **コード化された配備**：`docker-compose.yml` を読めば全構成が分かる
- **再現性**：`git clone && docker compose up -d` で他環境にも再現
- **学習段階に最適**：コンテナ間ネットワーク、ボリューム、依存関係を最小サンプルで理解
- **ステップアップ経路が明確**：Compose の概念は K8s の Deployment / Service / Volume にほぼマッピングできる
- **コスト**：個人 VM 1 台（月 1000 円程度）で完結

### 4.2 悪い影響・制約

- **シングルホスト**：HA / オートスケール / ローリングアップデートができない
- **本番運用としては未熟**：再起動戦略、ヘルスチェック、シークレット管理など Kubernetes ほど洗練されていない
- **Compose 独自構文**：K8s への移行時に書き直しが必要（ただし概念は再利用可）

### 4.3 段階的脱却シナリオ

| ステージ | 内容 |
| --- | --- |
| v1.0（現状） | Docker Compose 単一ホスト |
| v1.2 | Ansible で Compose 起動を冪等化 |
| v2.0 | AWS EC2（2 AZ）+ ALB + Ansible deploy |
| v3.0 | EKS（Helm + kube-prometheus-stack）へ移行 |

各段階で「**学習が前段階に積み上がる**」ように設計されている（[08](../server-monitor-improvements/08-kubernetes-roadmap.md) 参照）。

---

## 5. 参考

- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [12-Factor App](https://12factor.net/)
- [Kelsey Hightower, "Kubernetes The Hard Way"](https://github.com/kelseyhightower/kubernetes-the-hard-way)（v3 で予定）
