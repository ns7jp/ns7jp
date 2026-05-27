# 02. Ansible による構成管理自動化

> 状態更新（2026-05-27）: roles / playbooks と通常 CI の構文検証は
> [server-monitor](https://github.com/ns7jp/server-monitor) に実装済みである。
> 冪等性を含む full `molecule test` は手動 workflow の実行結果が採録されるまで未実測として扱う。

## 1. 背景・課題

現状の server-monitor は構築手順を `docs/deployment.md` に手順書として書いている。
これは「1 台立てる」には十分だが、以下のような場面で限界がある。

| 場面 | 手順書の限界 |
| --- | --- |
| 同じ構成を 2 台目に立てる | 手順を 1 行ずつ実行するためミスが入りやすい |
| OS バージョンが変わった | 差分を手順書に反映する更新コストが高い |
| 設定の現状確認 | 現状の設定値が手順書通りか分からない |
| 災害復旧 | 復旧時に「最新の手順書」が無い可能性がある |

Ansible 化により、**構成を「コード」として宣言** し、`ansible-playbook` 1 コマンドで再現できるようにする。

---

## 2. 採用技術

### なぜ Ansible か

| 候補 | 採用判断 | 理由 |
| --- | --- | --- |
| **Ansible** | ◎ 採用 | エージェントレス（SSH のみ）、YAML で読みやすい、学習コスト低 |
| Chef / Puppet | × | エージェント常駐、学習コスト高、現場での採用例が減少傾向 |
| シェルスクリプト | × | 冪等性確保が困難、エラーハンドリングが煩雑 |
| Pulumi / Terraform で OS 設定 | △ | Terraform はクラウドリソース管理に専念、OS 設定は Ansible が適切 |

---

## 3. ディレクトリ構成

```text
server-monitor/
├── ansible/
│   ├── ansible.cfg
│   ├── inventory/
│   │   ├── production.yml
│   │   └── staging.yml
│   ├── group_vars/
│   │   ├── all.yml
│   │   └── monitor.yml
│   ├── host_vars/
│   │   └── monitor-01.yml
│   ├── playbooks/
│   │   ├── site.yml
│   │   ├── bootstrap.yml
│   │   ├── deploy.yml
│   │   └── verify.yml
│   ├── roles/
│   │   ├── common/         # OS 共通設定
│   │   ├── docker/         # Docker / Compose
│   │   ├── nginx/          # Nginx + TLS
│   │   ├── monitoring/     # Prometheus / Grafana / Loki
│   │   ├── app/            # Flask Dashboard
│   │   └── backup/         # バックアップスクリプト
│   └── requirements.yml    # Galaxy / Collections
└── docs/
    └── deployment-ansible.md
```

---

## 4. ロール設計

### 4.1 ロール責務マトリクス

| ロール | 責務 | 主なタスク |
| --- | --- | --- |
| `common` | OS 共通設定 | タイムゾーン、NTP、SSH 鍵、firewall、unattended-upgrades |
| `docker` | Docker 環境 | Docker CE、docker-compose プラグイン、daemon 設定 |
| `nginx` | リバースプロキシ | パッケージ導入、サイト設定、TLS 証明書（Let's Encrypt） |
| `monitoring` | 監視スタック | Prometheus / Grafana / Loki / Alertmanager のコンテナ起動 |
| `app` | アプリ配備 | アプリイメージ pull、シークレット注入、systemd 設定 |
| `backup` | バックアップ | スナップショット取得、S3 連携、ローテーション |

### 4.2 サンプル playbook：`site.yml`

```yaml
---
- name: Common configuration for all servers
  hosts: all
  become: true
  roles:
    - common

- name: Configure monitoring servers
  hosts: monitor
  become: true
  roles:
    - docker
    - nginx
    - monitoring
    - app
    - backup
```

### 4.3 サンプル role：`common/tasks/main.yml`

```yaml
---
- name: Set timezone to Asia/Tokyo
  community.general.timezone:
    name: Asia/Tokyo

- name: Ensure required packages are installed
  ansible.builtin.apt:
    name:
      - curl
      - git
      - unattended-upgrades
      - ufw
      - chrony
    state: present
    update_cache: true

- name: Configure UFW default policies
  community.general.ufw:
    state: enabled
    policy: deny
    direction: incoming

- name: Allow SSH (rate-limited)
  community.general.ufw:
    rule: limit
    port: 22
    proto: tcp

- name: Allow HTTPS
  community.general.ufw:
    rule: allow
    port: 443
    proto: tcp

- name: Disable root SSH login
  ansible.builtin.lineinfile:
    path: /etc/ssh/sshd_config
    regexp: '^#?PermitRootLogin'
    line: 'PermitRootLogin no'
  notify: Restart sshd

- name: Enable unattended-upgrades for security
  ansible.builtin.copy:
    dest: /etc/apt/apt.conf.d/20auto-upgrades
    content: |
      APT::Periodic::Update-Package-Lists "1";
      APT::Periodic::Unattended-Upgrade "1";
    mode: '0644'
```

### 4.4 シークレット管理

- Ansible Vault で機密情報（Basic 認証パスワード、API キー）を暗号化
- vault パスワードは `ansible/.vault_pass` に保存（`.gitignore` 対象）
- CI からは GitHub Secrets 経由で vault パスワードを供給

```bash
# 暗号化
ansible-vault encrypt group_vars/all/vault.yml

# 編集
ansible-vault edit group_vars/all/vault.yml
```

---

## 5. 検証戦略

### 5.1 ローカル検証：Molecule

各ロールに Molecule テストを付ける。

```text
roles/common/
├── tasks/
├── handlers/
└── molecule/
    └── default/
        ├── molecule.yml
        ├── converge.yml
        └── verify.yml
```

| テスト項目 | 検証ツール |
| --- | --- |
| 構文 | `ansible-lint` |
| 冪等性 | Molecule の `idempotence` ステップ |
| 期待状態 | `verify.yml` で `ansible.builtin.assert` |

### 5.2 CI（GitHub Actions）

```yaml
name: ansible-ci
on:
  push:
    paths:
      - 'ansible/**'
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install ansible ansible-lint molecule molecule-plugins[docker]
      - name: Lint
        run: ansible-lint ansible/

  molecule:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        role: [common, docker, nginx, monitoring]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install ansible molecule molecule-plugins[docker]
      - name: Molecule test
        run: |
          cd ansible/roles/${{ matrix.role }}
          molecule test
```

### 5.3 本番デプロイフロー

```mermaid
flowchart LR
    Dev[ローカル<br/>編集] --> PR[Pull Request]
    PR --> Lint[ansible-lint]
    Lint --> Mole[Molecule テスト]
    Mole --> Review[コードレビュー]
    Review --> Merge[main へ merge]
    Merge --> Stg[staging へ自動デプロイ]
    Stg --> Smoke[スモークテスト]
    Smoke --> Manual[手動承認]
    Manual --> Prod[production へデプロイ]
```

---

## 6. 段階的移行（既存環境からの切替）

1. **既存環境の状態をスナップショット**（設定ファイルを git 管理）
2. **Ansible playbook を書きながら、ステージング環境で再構築**
3. **ステージングと本番の `diff` を取り、差異をゼロに**
4. 本番に対しては最初は `--check --diff` モードで実行
5. 問題なければ実適用、以後は手動変更を禁止

---

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 既存環境との差異で予期せぬ変更 | `--check --diff` で事前差分確認、本番には段階適用 |
| Vault パスワード紛失 | パスワードマネージャー保管 + 1Password などで複数人共有 |
| Ansible バージョン依存 | `requirements.yml` でバージョンピン留め、CI で同バージョン検証 |
| 冪等でないタスクの混入 | Molecule の idempotence テストで検出 |

---

## 8. 完了条件（Definition of Done）

- [ ] `ansible/` ディレクトリ配下に全ロールが揃っている
- [ ] `ansible-playbook -i inventory/staging.yml playbooks/site.yml` で 0 台から構築可能
- [ ] 2 回連続実行で `changed=0` になる（冪等性）
- [ ] CI で lint + molecule が緑
- [ ] `docs/deployment-ansible.md` に Ansible 版手順を記載
- [ ] 旧手順書（`deployment.md`）に「Ansible 版へ移行済み」の注記を追加

---

## 9. 参考

- [Ansible Documentation](https://docs.ansible.com/)
- [Molecule Documentation](https://ansible.readthedocs.io/projects/molecule/)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html)
