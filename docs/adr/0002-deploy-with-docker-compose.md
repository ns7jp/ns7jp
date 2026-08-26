# ADR-0002: v1 デプロイ方式に Docker Compose を採用

- **Status**: Accepted（v3.0 で Kubernetes へ発展予定）
- **Date**: 2026-01-15
- **Deciders**: ns7jp（個人ポートフォリオ）

> 公式ドキュメントや技術記事を調べて書いた学習目的の判断記録であり、
> 実務でのデプロイ運用・チーム意思決定の経験に基づくものではない。
> 代替案の比較も、深く使い込んだ上での判断ではなく、調べた範囲での判断である。

---

## 1. Context

server-monitor v1.0 のデプロイ方式を決定する必要があった。

単一ホストで完結し「これが動いているサーバーです」と面接で提示できること、設定がコード化され再現できること、コンテナの基本概念（イメージ / ボリューム / ネットワーク）を体得できることを重視した。

---

## 2. Decision

**Docker Compose** を採用する。`docker-compose.yml` で全コンテナ（Flask アプリ / Prometheus / Grafana / Alertmanager / node-exporter / Nginx）を宣言的に管理する。

将来的に Ansible（[02](../server-monitor-improvements/02-ansible-automation.md)）→ Terraform / AWS（[03](../server-monitor-improvements/03-terraform-aws.md)）→ Kubernetes / EKS（[今後の興味リスト](../roadmap/README.md)）と段階的に発展させる。

---

## 3. 他に見た選択肢

- **ベアメタル / systemd**: Linux の学習にはなるが再現性が低く、設定が手順書のままになる
- **Kubernetes（minikube / kind / k3s）**: 学習コストが大きく、v1 段階では「監視そのもの」の学習に集中したいため見送った（v3 で対応予定）
- **Docker Swarm / Nomad**: 主流が Kubernetes に移っており、学習投資対効果が低いと判断した

---

## 4. Consequences

- `docker-compose.yml` を読めば全構成が分かり、`git clone && docker compose up -d` で再現できる
- コンテナ間ネットワークやボリュームなど、Kubernetes の Deployment / Service にも通じる概念を最小構成で学べた
- シングルホストのため HA / オートスケールはできず、本番運用としては未熟な構成である

---

## 5. 参考

- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [12-Factor App](https://12factor.net/)
- [Kelsey Hightower, "Kubernetes The Hard Way"](https://github.com/kelseyhightower/kubernetes-the-hard-way)（v3 で予定）
