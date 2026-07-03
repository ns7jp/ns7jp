# ADR-0008: 認証を Basic → OIDC SSO へ段階移行

- **Status**: Accepted（v1.0 = Basic、v2.0 で OIDC へ）
- **Date**: 2026-01-25
- **Deciders**: ns7jp（個人ポートフォリオ）

---

## 1. Context

server-monitor の Web UI（Flask ダッシュボード / Prometheus / Grafana）に **認証** を付与する必要がある。

最初から SSO（OIDC）を組むか、軽量な Basic 認証から始めて段階移行するかを決定する。

---

## 2. Decision

**v1.0 では Nginx Basic 認証 + metrics 用 Bearer Token** を採用する。
**v2.0（AWS 移行）と同時に OIDC SSO へ移行する**。理由は「AWS IAM Identity Center」「Google Workspace」など、SSO 提供側が AWS と統合済みであり、移行コストが最小になるタイミングだから。
（**2026-07 追記**：v2.0 の OIDC 移行先は **Keycloak / Authentik + oauth2-proxy** を第一候補へ見直した。§7 参照）

---

## 3. Alternatives

| 選択肢 | 評価 | 不採用理由 |
| --- | --- | --- |
| **最初から OIDC SSO** | 退職者管理が容易、本格的 | IdP（Google Workspace / Auth0 / AWS IAM Identity Center）の初期セットアップが重い、個人ポートフォリオで過剰（2026-07 追記：自己ホスト IdP なら Keycloak / Authentik が無料で構築可能。§7） |
| **Basic 認証で固定運用** | 簡単 | 退職時の取り残し、複数人運用時の共有秘密問題 |
| **OAuth2 Proxy + GitHub** | GitHub 連携で軽量 | GitHub 個人アカウント依存になり、組織管理が難しい |
| **クライアント証明書（mTLS）** | 強固 | 証明書配布・更新の運用が個人で重い |
| **VPN 経由でのアクセス + 認証なし** | ネットワーク層で守る | 「アプリの認証は不要」と誤解されやすい、職務分離違反になりうる |

---

## 4. Decision Rationale

### 4.1 段階的アプローチの利点

「最初から SSO」を採用しなかった理由：

1. **個人運用の規模**：v1.0 段階では利用者が自分 1 人。Basic 認証で十分な統制
2. **IdP のセットアップコスト**：個人で Google Workspace / Auth0 を契約するのは費用対効果が悪い
3. **学習段階の集中**：v1.0 では「監視を組み立てる」に集中、認証連携は v2 で集中して学ぶ
4. **AWS 移行と同時に IAM Identity Center を入れる**：AWS 化と同時なら IdP の準備コストが「セット」になる（2026-07 追記：カスタムアプリ連携は SAML 2.0 経由のため、ラボの OIDC IdP は Keycloak へ見直し。§7）

### 4.2 v1.0 段階の補強策

Basic 認証だけでは弱いため、以下で補強：

- **TLS 必須**：Basic 認証は平文なので TLS 終端が前提
- **`metrics` 用 Bearer Token を別チャネル**：Prometheus からのスクレイプは Bearer Token、人間は Basic と分離
- **パスワード強度**：`pwgen -s 24 1` で 24 文字ランダム
- **アクセスログ**：認証失敗は Loki に集約し、しきい値でアラート（[09 §4](../server-monitor-improvements/09-security-operations.md)）

### 4.3 v2.0 での移行戦略

| 対象 | 移行方法 |
| --- | --- |
| Grafana | OIDC Generic OAuth 設定（[09 §6](../server-monitor-improvements/09-security-operations.md)） |
| Flask アプリ | `authlib` で OIDC クライアント実装 |
| Prometheus / Alertmanager | リバースプロキシ（oauth2-proxy）経由 |
| SSH | AWS SSM Session Manager で **SSH 鍵レス化** |

---

## 5. ID ライフサイクル設計

詳細は [16 ID 運用](../roadmap/16-identity-operations.md) に記載。本 ADR では決定事項のみ。

| ライフサイクル | v1.0 | v2.0 |
| --- | --- | --- |
| 入社 | Basic 認証パスワード手動配布 | IdP のグループに追加 → 全サービス即時利用可 |
| 異動 | Vault 上のパスワード変更通知 | IdP のグループ変更 → 権限自動連動 |
| 退職 | Basic 認証エントリ削除 | IdP からの除外 → 全サービス即時遮断 |

---

## 6. Consequences

### 6.1 良い影響

- **段階移行の経験そのものがポートフォリオ**：「最初から完璧を目指さず、段階的にセキュリティを強化した」という設計判断が説明できる
- **v1 の運用負荷が軽い**：本格 SSO が要らない規模を直視できる
- **v2 でまとめて学べる**：OIDC、IdP、グループマッピング、SCIM を一気に体得

### 6.2 悪い影響・制約

- **v1.0 段階のセキュリティ評価は低い**：採用面接で「現段階は Basic 認証です」と説明する必要
- **段階移行で過渡期の混乱**：v2.0 移行時に Basic ユーザーと OIDC ユーザーが並存する期間の管理計画が必要
- **シークレット管理の継続**：v1.0 で Ansible Vault → v2.0 で AWS Secrets Manager への移行も同期実施

### 6.3 リスク低減策

- v1.0 でも **「OIDC 移行が前提」** を README に明示し、本気の本番運用と混同されないようにする
- 監査ログ（[09 §4](../server-monitor-improvements/09-security-operations.md)）で Basic 認証の失敗を可視化、攻撃検知の最低ラインを担保

---

## 7. 2026-07 追記（決定の見直し）

Status は Accepted のまま、**v2.0 の OIDC 移行先の選定** を見直した。
決定本体（v1.0 Basic → v2.0 OIDC SSO の段階移行）は変更しない。

- **トリガー**：AWS IAM Identity Center はカスタムアプリ向けに汎用 OAuth2 / OIDC
  エンドポイントを公開しておらず、カスタムアプリ連携は SAML 2.0 経由となる。
  Grafana の Generic OAuth と直接統合する当初想定は成立しない
- **見直し内容**：v2.0 の OIDC 移行先は **Keycloak / Authentik（自己ホスト・無料・
  実構築可能）+ oauth2-proxy** を第一候補とする。Grafana は Generic OAuth で Keycloak と
  統合し（[09 §6](../server-monitor-improvements/09-security-operations.md)）、
  Prometheus / Alertmanager は oauth2-proxy 経由とする
- **IAM Identity Center の位置付け**：組織導入時の選択肢として注記に降格。
  AWS アカウントアクセス（Console / CLI）の統合には引き続き有力で、カスタムアプリとは
  SAML 2.0 で連携する（[16 §3](../roadmap/16-identity-operations.md)）

---

## 8. 参考

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Grafana OIDC Documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [oauth2-proxy Documentation](https://oauth2-proxy.github.io/oauth2-proxy/)
- [AWS IAM Identity Center](https://aws.amazon.com/iam/identity-center/)
