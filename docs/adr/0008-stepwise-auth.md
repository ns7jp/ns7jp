# ADR-0008: 認証を Basic → OIDC SSO へ段階移行

- **Status**: Accepted（v1.0 = Basic、v2.0 で OIDC へ）
- **Date**: 2026-01-25
- **Deciders**: ns7jp（個人ポートフォリオ）

> 公式ドキュメントや技術記事を調べて書いた学習目的の判断記録であり、
> 実務でのID管理・チーム意思決定の経験に基づくものではない。
> 代替案の比較も、深く使い込んだ上での判断ではなく、調べた範囲での判断である。

---

## 1. Context

server-monitor の Web UI（Flask ダッシュボード / Prometheus / Grafana）に認証を付ける必要がある。最初から SSO（OIDC）を組むか、軽量な Basic 認証から始めて段階的に移行するかを決める。

---

## 2. Decision

**v1.0 では Nginx Basic 認証 + metrics 用 Bearer Token** を採用する。**v2.0（AWS 移行）と同時に OIDC SSO へ移行する**（**2026-07 追記**：移行先を Keycloak / Authentik + oauth2-proxy に見直し。§6 参照）。

---

## 3. 他に見た選択肢

- **最初から OIDC SSO**: 退職者管理などは容易だが、IdP の初期セットアップが個人ポートフォリオには重すぎるため見送った
- **Basic 認証のみで固定運用**: 簡単だが、複数人で使う想定になると認証情報の共有・漏えいリスクが増える
- **OAuth2 Proxy + GitHub**: 手軽だが GitHub 個人アカウントに依存してしまう
- **クライアント証明書（mTLS）**: 強固だが、証明書の配布・更新を個人で運用するのは負荷が大きい
- **VPN 経由 + アプリ側の認証なし**: ネットワークだけに頼ると「アプリの認証は不要」と誤解されやすいため見送った

---

## 4. v1.0 の補強策

Basic 認証だけでは弱いため、以下で補強している。

- TLS を必須にする（Basic 認証は平文のため）
- Prometheus からのスクレイプは metrics 用の Bearer Token を別に使う
- パスワードは `pwgen -s 24 1` で生成
- 認証失敗は Loki に集約し、しきい値でアラートする（[09 セキュリティ運用](../roadmap/09-security-operations.md)）

---

## 5. Consequences

- v1.0 は自分 1 人での利用なので Basic 認証でも実用上は足りるが、複数人利用や本番相当の運用には向かない、という前提を README に明示している
- v2.0 で OIDC / IdP / グループマッピングをまとめて学ぶ計画にした
- アカウントの作成・変更・削除のやり方は v1.0（手動）と v2.0（IdP 側で一元管理）で変わる予定。詳細は [16 ID 運用](../roadmap/16-identity-operations.md)

---

## 6. 2026-07 追記（決定の見直し）

Status は Accepted のまま、v2.0 の OIDC 移行先を見直した。決定本体（v1.0 Basic → v2.0 OIDC SSO の段階移行）は変更しない。

- **きっかけ**：AWS IAM Identity Center はカスタムアプリ向けの汎用 OAuth2 / OIDC エンドポイントを公開しておらず、カスタムアプリ連携は SAML 2.0 経由になる。Grafana の Generic OAuth と直接統合する当初想定は成立しなかった
- **見直し内容**：v2.0 の OIDC 移行先は **Keycloak / Authentik（自己ホスト・無料）+ oauth2-proxy** を第一候補にする。Grafana は Generic OAuth で Keycloak と統合し（[09 §6](../roadmap/09-security-operations.md)）、Prometheus / Alertmanager は oauth2-proxy 経由にする
- **IAM Identity Center の位置付け**：AWS アカウント自体（Console / CLI）の管理には引き続き使う想定だが、カスタムアプリとの連携は選択肢の一つに降格した（[16 §3](../roadmap/16-identity-operations.md)）

---

## 7. 参考

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Grafana OIDC Documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [oauth2-proxy Documentation](https://oauth2-proxy.github.io/oauth2-proxy/)
- [AWS IAM Identity Center](https://aws.amazon.com/iam/identity-center/)
