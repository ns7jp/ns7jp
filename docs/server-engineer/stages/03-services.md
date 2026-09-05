# SE03 Web・アプリ・DBをつなぐ — 応答の中身まで確かめる

[育成システムの入口](../README.md) / [評価手順](../assessment.md) / [前: ネットワーク](02-network.md) / [次: 設計と試験](04-design.md)

Webは通信の入口、APは処理を行うアプリ、DBはデータの保存先です。受付が開いていても、処理担当や保管庫が使えるとは限りません。この段階では、入口からの応答、認証、TLS、層間接続、DB権限、復元を個別に確かめます。

前提はSE02合格、破棄できる専用Ubuntu 24.04 VM、Docker EngineとCompose plugin、Git、Python 3、curl、OpenSSLです。目安はW9〜W12。**以下は作成した手順であり、この変更で実機動作を検証したものではありません。** 実行時のOS、Docker版、教材Git SHA、所要時間、支援量を自分で記録します。

| 条件 | 必要な実行 | 合格にできない代用品 |
| --- | --- | --- |
| SE03-C1 | 最小Web構成の応答・認証・停止と再開 | コードがあるだけ、画面だけ |
| SE03-C2 | TLSの名前・信頼・有効期限と逆プロキシ | 検証を無効にしたcurlだけ |
| SE03-C3 | 3層の接続とDB最小権限 | 全権限の初期ユーザーで動いただけ |
| SE03-C4 | 別DBへ復元、データ一致、復元時間の実測 | バックアップファイルを作っただけ |

## 実行場所と軽量ルート

このページでは**Ubuntu VM内のBash**を使います。最初に実装リポジトリを取得し、既に取得済みならその場所へ移動します。

```bash
git clone https://github.com/ns7jp/server.git
cd server
git rev-parse HEAD
git status --short --branch
bash scripts/learning/check-prerequisites.sh
docker info
docker compose version
```

Git取得や基本ツール導入がまだなら、[既存の初心者向け学習ガイド「実行場所と準備」](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)を先に実施します。Docker操作権限の不足は、公式の導入後設定で解決します。Docker socketを誰でも書ける権限に変更しません。

| ルート | 動かす構成 | 実施順序と記録する範囲 |
| --- | --- | --- |
| VMを3台用意できる | 既存W9〜W12のVM別Web/AP/DB | 本文で観測方法を学び、[既存カリキュラム](../../learning-plan/02-curriculum.md)と[構築文書](../../learning-plan/03-build-process.md)でVM別に再構築 |
| 1台で進める | 1台VM内の既存3層コンテナラボ | C1の2サービス→停止→C2のTLS→停止→C3/C4の3層。監視全体を同時起動しない |

軽量ルートも3層の役割、通信、DB権限、論理復元を学べます。ただし、コンテナの実行を「3台のVMへOSを導入・構築した」と記録しません。SE03は`runtime`条件なのでコンテナの証跡を使えますが、SE01、SE02、SE05以降の`vm`条件をコンテナだけで埋めることはできません。

RAMや空き容量の保証値はありません。開始前と起動後に`free -h`と`df -h`を取り、メモリ不足・空き容量不足が出たら同時起動を減らし、原因を記録します。既存ラボは固定のComposeプロジェクト名・ネットワーク名・volume名を使うため、**同じDocker daemonで同名ラボを並行実行しません**。

以下の`.artifacts/`は`server`側の既存のGit除外先です。個人ログ、鍵、dump、演習用overrideはここへ置きます。新しい教材を含む`ns7jp`側の台帳保存先とは別物です。

## SE03-C1 最小Web構成の応答・認証・停止と再開を確認する

正本は[既存の初心者向け学習ガイド Step 1〜5](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)です。

1. Step 1で`compose.yaml`、アプリ、Nginx設定を開き、「ブラウザ→Nginx→app」の図を描きます。Nginxは入口、appは応答を作る処理です。
2. Step 2のPython確認を実施します。単体テスト成功はDocker稼働やOS構築の証拠とは分けます。
3. Step 3-1に従って、初回だけ`.env`と用途別の秘密ファイルを作ります。既存ファイルがあれば再生成せず、既存設定を確認します。秘密値の全文を学習ログへ表示しません。
4. 同じ`server`直下で2サービスだけ起動します。

```bash
docker compose config --quiet
docker compose up -d --build app nginx
docker compose ps --all app nginx
curl --max-time 5 -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/healthz
curl --max-time 5 -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/
curl --max-time 5 -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/metrics
curl --max-time 5 -sS --user monitor -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/stats
```

最後のコマンドはパスワードを対話入力します。既存ガイドに従い、ローカルのエディターで確認して入力します。コマンド引数、画面共有、録画、ログへ秘密値を出しません。初期ユーザー名を変更した場合は`monitor`も実際の設定に合わせます。

| 試験 | 標準設定での期待結果 | 確認の意味 |
| --- | --- | --- |
| `/healthz` | 200 | 応答可能である |
| `/`に認証なし | 401 | 認証が要求される |
| `/metrics`にトークンなし | 401 | 数値取得にも認証が要求される |
| `/api/stats`に正しい認証 | 200 | 認証後に処理できる |

HTTPコードを観測するcurlには`-f`を付けていないため、curlの終了コード0だけでHTTP成功と判定しません。401はこの負の試験では期待する応答です。接続不能時の`000`はHTTP応答ではありません。

続いて状態とログを保存し、Nginxだけを計画停止して、同じhealth確認を繰り返します。

```bash
docker compose logs --tail=50 app nginx
docker compose stop nginx
docker compose ps --all app nginx
curl --max-time 5 -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/healthz
docker compose start nginx
curl --max-time 5 -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/healthz
```

「応答→接続不能→応答」を自分で観測したら、停止対象と再開操作を説明します。これは**手動で計画停止・再開した実績**であり、自動復旧やホスト復元とは記録しません。戻らない場合は`ps`、`logs`、設定構文の順に調べ、秘密値の作り直しで対処しません。

## SE03-C2 TLSの名前・信頼・有効期限と逆プロキシを試験する

TLSは通信の暗号化と改ざん検知を行い、証明書は接続先の名前を確認するために使います。暗号化されたこと、正しい名前であること、信頼できる証明書であることは分けて試験します。

既存の[TLS設定例](https://github.com/ns7jp/server/blob/main/deploy/nginx/server-monitor-tls.conf.example)を読みます。その例はホスト上のNginxを想定しています。ここでは本体の`app`へつなぐ**loopback限定の追加Nginx**で練習し、ホストの`/etc/nginx`やOS全体の信頼ストアを変更しません。実ドメインのDNS登録、公的CAの発行・更新は後続の恒久ホスト課題です。

### 1. 新規の演習フォルダと短期証明書を用意する

実行場所は`server`直下です。`.artifacts/se03-tls`が既に存在する場合は以下の作成ブロックを実行せず、前回のファイルを確認して続きから進めます。

```bash
git check-ignore .artifacts/se03-tls/server.key
test ! -e .artifacts/se03-tls
```

Git除外が確認でき、2行目が終了コード0のときだけ初回作成します。

```bash
umask 077
mkdir -p .artifacts/se03-tls
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 2 \
  -keyout .artifacts/se03-tls/server.key \
  -out .artifacts/se03-tls/server.crt \
  -subj '/CN=se03.local.test' \
  -addext 'subjectAltName=DNS:se03.local.test'
```

`-nodes`はこの演習用秘密鍵を暗号化せず保存する指定です。Git除外とファイル権限を維持し、鍵の内容は公開しません。証明書は2日間だけ有効で、OSへの恒久登録は行いません。

### 2. 追加サービスを定義する

以下を`.artifacts/se03-tls/default.conf`へ保存します。

```nginx
server {
    listen 8443 ssl;
    server_name se03.local.test;
    ssl_certificate /etc/nginx/se03/server.crt;
    ssl_certificate_key /etc/nginx/se03/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://app:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

次を`.artifacts/se03-tls/compose.yml`へ保存します。相対volumeパスは、最初の`-f compose.yaml`がある**server直下**から解決されます。`frontend`はappとの内部通信、既存の`host-access`はホストの公開ポートへ届く経路です。両方に接続し、公開先はloopbackだけに限定します。

```yaml
services:
  se03-tls:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8443:8443"
    volumes:
      - ./.artifacts/se03-tls/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./.artifacts/se03-tls/server.crt:/etc/nginx/se03/server.crt:ro
      - ./.artifacts/se03-tls/server.key:/etc/nginx/se03/server.key:ro
    networks:
      - frontend
      - host-access
    depends_on:
      app:
        condition: service_healthy
```

```bash
docker compose -f compose.yaml -f .artifacts/se03-tls/compose.yml config --quiet
docker compose -f compose.yaml -f .artifacts/se03-tls/compose.yml up -d se03-tls
docker compose -f compose.yaml -f .artifacts/se03-tls/compose.yml exec -T se03-tls nginx -t
```

### 3. 成功・名前不一致・信頼不足を比較する

```bash
curl --noproxy '*' --max-time 5 --fail --show-error \
  --cacert .artifacts/se03-tls/server.crt \
  --resolve se03.local.test:8443:127.0.0.1 \
  https://se03.local.test:8443/healthz
```

期待結果はTLS検証が成功し、appのhealth応答が返ることです。`--resolve`はこのcurlだけの名前とIPの対応、`--cacert`はこのcurlだけで信頼する証明書です。全PCのDNSやCAを変更しません。

次は意図した負の試験です。`--cacert`を外すと自己署名証明書の信頼不足、名前を変えると証明書との名前不一致で失敗することを確認します。

```bash
curl --noproxy '*' --max-time 5 --show-error \
  --resolve se03.local.test:8443:127.0.0.1 \
  https://se03.local.test:8443/healthz
printf '信頼不足の終了コード=%s\n' "$?"
curl --noproxy '*' --max-time 5 --show-error \
  --cacert .artifacts/se03-tls/server.crt \
  --resolve wrong.local.test:8443:127.0.0.1 \
  https://wrong.local.test:8443/healthz
printf '名前不一致の終了コード=%s\n' "$?"
```

通常はいずれもcurlの証明書検証エラーになります。実際の終了コードとエラー理由を保存します。接続拒否や名前解決失敗を証明書の負の試験成功として扱いません。`-k`で検証を無効化した結果は合格証跡に使いません。

```bash
openssl x509 -in .artifacts/se03-tls/server.crt -noout -subject -issuer -dates -ext subjectAltName
openssl x509 -in .artifacts/se03-tls/server.crt -noout -checkend 0
openssl x509 -in .artifacts/se03-tls/server.crt -noout -checkend 259200
printf '3日後の期限判定=%s\n' "$?"
```

発行直後なら現在有効の判定は成功し、3日後も有効かの判定は失敗します。これは期限前の検知練習であり、実際に時計を進めたり、実期限切れ障害を観測したりしたことにはしません。OSの時刻を変更しないでください。

**障害・戻し方:** Nginx構文不正は`nginx -t`、502はappの状態とログ、証明書エラーは名前・信頼・有効期間を調べます。作った2ファイルだけを修正します。C2の終了後は両方のcomposeファイルを指定して停止し、volumeを残します。

```bash
docker compose -f compose.yaml -f .artifacts/se03-tls/compose.yml down
```

## SE03-C3 3層の接続とDB最小権限を試験する

### 1. 既存の3層ラボを1台VMで起動する

正本は[3層ラボREADME](https://github.com/ns7jp/server/blob/main/labs/three-tier/README.md)と[compose.yaml](https://github.com/ns7jp/server/blob/main/labs/three-tier/compose.yaml)です。監視ラーニングパスでは発展課題として紹介されていますが、この育成ルートではSE01〜SE02とC1を前提として、C3の題材に使います。

```bash
cd labs/three-tier
docker compose config --quiet
docker compose up -d --build
docker compose ps --all
docker compose exec -T client curl --max-time 5 -fsS http://web/
docker compose exec -T client curl --max-time 5 -i http://web/web-healthz
docker compose exec -T client curl --max-time 5 -i http://web/healthz
docker compose exec -T client curl --max-time 5 -i http://web/readyz
docker compose exec -T client curl --max-time 5 -sS http://web/api/items/count
```

このラボはホスト側へWebポートを公開しません。VMのブラウザで`localhost:80`を開くのではなく、同じラボの`client`コンテナから`web`へ問い合わせます。初回はDB初期化とイメージ構築を待ち、`ps`と`logs --tail=50 web ap db`を確認します。

| 経路 | 実装上の接続 | 観測 |
| --- | --- | --- |
| client→web | dmz、HTTP 80 | `/web-healthz`はWebだけの生存 |
| web→ap | app-tier、HTTP 8000 | `/healthz`はAPの生存 |
| ap→db | db-tier、TCP 5432 | `/readyz`はDB接続を含む可否 |
| web→db | webはdb-tierへ未参加 | 直接到達が拒否されることを確認 |

新規volumeなら初期データは5行です。既存volumeで件数が違う場合、削除して数を合わせず、既存のデータと前回実施を確認します。到達性は診断用コンテナで確認します。

```bash
docker compose exec -T netprobe-ap sh -c 'command -v nc; nc -z -w 2 db 5432'
docker compose exec -T netprobe-web sh -c 'command -v nc; nc -z -w 2 172.29.30.30 5432'
printf 'WebからDBへの終了コード=%s\n' "$?"
```

期待はAP側の成功とWeb側の失敗です。`nc`自体が無い場合は検査不足であり、遮断成功ではありません。Web側は固定IPへの検査なので、DNS未解決だけで失敗していないことも確認できます。ここでの固定IPはこのラボのcomposeに記載した専用ネットワーク内だけの値です。

既存の故障演習`bash run-drill.sh`は、DB停止、AP停止、経路切断を自動実行する教材です。実行前にREADMEとスクリプトを読み、使い捨てデータと専用環境であることを確認します。実行する場合は**次の最小権限への変更前**に行います。出力される日付付きログは同日の再実行で上書きされるため、各試行後すぐ個人記録へ保存します。スクリプトが答えまで実行する結果は、独立した未知障害評価と分けます。

### 2. DBの実行ユーザーを管理ユーザーから分ける

現行ラボの`POSTGRES_USER=app`は、PostgreSQLコンテナを初期化する管理ユーザーです。名前がappでも、最小権限のアプリ用ユーザーとは限りません。次で実際の権限を読みます。

```bash
docker compose exec -T db psql -U app -d inventory -c '\du app'
```

ここでは学習用の新しい`se03_app`を作ります。事前に`\du se03_app`で同名roleがないことを確認し、あれば上書きせず前回設定を見ます。現在のAPコードはSELECTとINSERTを使うため、その表と連番だけの必要権限を与えます。

```bash
docker compose exec db psql -U app -d inventory
```

開いたpsqlで1文ずつ実行します。`\password`はパスワードを画面へ表示せず入力するためのpsql命令です。

```sql
CREATE ROLE se03_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
\password se03_app
GRANT CONNECT ON DATABASE inventory TO se03_app;
GRANT USAGE ON SCHEMA public TO se03_app;
GRANT SELECT, INSERT ON TABLE public.items TO se03_app;
GRANT USAGE, SELECT ON SEQUENCE public.items_id_seq TO se03_app;
\du se03_app
\q
```

この学習専用パスワードを他のシステムで再利用しません。次にそのroleで対話接続し、許可と拒否を試します。

```bash
docker compose exec db psql -h 127.0.0.1 -U se03_app -d inventory -W
```

```sql
SELECT current_user, current_database();
SELECT count(*) FROM public.items;
BEGIN;
INSERT INTO public.items (sku, name, quantity) VALUES ('SE03-ROLE-TEST', 'permission practice', 1);
ROLLBACK;
BEGIN;
UPDATE public.items SET quantity = quantity WHERE false;
ROLLBACK;
BEGIN;
CREATE TABLE public.se03_permission_probe (id integer);
ROLLBACK;
\q
```

期待結果は`current_user=se03_app`、SELECTとINSERTの成功、UPDATEとCREATE TABLEの権限拒否です。各試験はROLLBACKでデータや表を残しません。serialの採番はROLLBACKで戻らないため、IDの欠番はデータ消失と混同しません。拒否試験が成功してしまった場合は、role継承・PUBLIC権限・所有者を調べ、最小権限を合格にしません。

### 3. AP自身がそのroleを使うことを確認する

`server`の`.artifacts/se03-db-role.yml`をエディターで作ります。今のカレントディレクトリは`labs/three-tier`なので、パスは`../../.artifacts/se03-db-role.yml`です。これは既存のcomposeファイルへ必要な値だけを重ねる設定です。

```yaml
services:
  ap:
    environment:
      THREE_TIER_DB_USER: se03_app
      THREE_TIER_DB_PASSWORD: ${SE03_DB_PASSWORD:?学習用パスワードを設定してください}
```

同じBashで、先ほど設定した学習用パスワードを非表示で読み込みます。

```bash
se03_switch_role() {
  read -r -s -p 'se03_appの学習用パスワード: ' SE03_DB_PASSWORD || return
  printf '\n'
  export SE03_DB_PASSWORD
  docker compose -f compose.yaml -f ../../.artifacts/se03-db-role.yml config --quiet || return
  docker compose down || return
  docker compose -f compose.yaml -f ../../.artifacts/se03-db-role.yml up -d --build || return
  docker compose exec -T ap python -c 'from app import _connect; c=_connect(); print(c.execute("SELECT current_user, current_database()").fetchone()); c.close()' || return
  docker compose exec -T client curl --max-time 5 -fsS http://web/readyz || return
  docker compose exec -T client curl --max-time 5 -fsS http://web/api/items/count || return
}
se03_switch_role
```

関数内の`|| return`は、そのコマンドが失敗したら関数をそこで終了する指定です。設定検証に失敗した場合は、既存ラボを停止する`down`へ進みません。最後の関数呼び出しが非ゼロで終わった場合は、出力を保存して原因を確認します。

AP内の接続が`se03_app`と`inventory`を示し、readyとデータ取得が成功すれば切替の根拠になります。一度停止して全サービスを作り直すのは、APとnetwork namespaceを共有する診断用コンテナも同じ構成へ揃えるためです。`down`に`-v`を付けないので、DBのvolumeと作成したroleを保持します。Composeの設定全文や`docker inspect`の環境変数一覧には秘密値が含まれるため、提出ログへ出しません。この環境変数方式は専用ラボの補習用で、実ホストの秘密値配布設計を満たすものではありません。

**失敗・戻し方:** `permission denied`なら権限、認証エラーならroleと入力値、接続不能ならDBとネットワークを分けます。原因を記録した後、元の初期ユーザーに戻す必要がある場合は、このラボで`docker compose down`、続いて`docker compose -f compose.yaml up -d --build`を実行して既存定義へ戻します。戻した状態を最小権限達成とはしません。学習中は通常の再適用でroleが元へ戻らないよう、以後のAP変更にはoverrideを指定します。

## SE03-C4 別DBへ復元してデータ一致と実測復旧時間を確認する

バックアップは保存、復元は保存した内容を使える状態へ戻す操作です。既存の[復元ドリル](https://github.com/ns7jp/server/blob/main/labs/three-tier/run-restore-drill.sh)は**同じDBの表を壊して戻す**演習なので、それだけでは本条件の「別DB」を満たしません。ここでは元のinventoryを残し、同じ学習用DBコンテナ内の別名DBへ復元します。別ホストへの復旧とは記録しません。

### 1. 対象と比較基準を保存する

実行場所は引き続き`server/labs/three-tier`です。この間は自分やスクリプトからデータを追加・変更せず、別のドリルを並行実行しません。ダミーデータだけを使います。以下の3つのブロックは同じBashセッションで順に実行します。各関数は失敗するとそこで終了し、完了フラグが揃わない後続処理も拒否します。フラグを手でtrueに変更しません。

```bash
se03_backup() {
  SE03_BACKUP_READY=false
  SE03_RESTORE_READY=false
  umask 077
  SE03_RUN="$(date -u +%Y%m%d%H%M%S)" || return
  SE03_RESTORE_DB="se03_restore_${SE03_RUN}"
  SE03_ARCHIVE="$PWD/../../.artifacts/se03-restore-${SE03_RUN}"
  mkdir "$SE03_ARCHIVE" || return
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U app -d inventory \
    -c 'SELECT current_database(), current_user;' || return
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U app -d inventory \
    -c 'COPY (SELECT id, sku, name, quantity, created_at FROM public.items ORDER BY id) TO STDOUT WITH CSV' \
    > "$SE03_ARCHIVE/source.csv" || return
  docker compose exec -T db pg_dump -U app -d inventory --format=custom \
    > "$SE03_ARCHIVE/inventory.dump" || return
  test -s "$SE03_ARCHIVE/inventory.dump" || return
  sha256sum "$SE03_ARCHIVE/inventory.dump" "$SE03_ARCHIVE/source.csv" \
    > "$SE03_ARCHIVE/backup.sha256" || return
  cat "$SE03_ARCHIVE/backup.sha256" || return
  SE03_BACKUP_READY=true
}
se03_backup
```

source.csvは順序を固定した内容比較の基準です。dumpのハッシュはバックアップファイル自体の識別であり、DBの復元成功を意味しません。pg_dumpが失敗した場合、途中まで書かれたファイルが残っても完了フラグはfalseのままなので、復元は開始できません。初回で`.artifacts`が無い場合は先に`server`直下に作り、Git除外を確認します。保存フォルダ名が既に存在して`mkdir`が失敗した場合は、既存証跡を上書きせず新しい試行名で開始します。

### 2. 新規の別DBへ復元する

```bash
se03_restore() {
  SE03_RESTORE_READY=false
  [ "${SE03_BACKUP_READY:-false}" = true ] || {
    printf '中止: このセッションのバックアップが完了していません。\n' >&2
    return 1
  }
  [ "${SE03_RESTORE_DB:-}" = "se03_restore_${SE03_RUN}" ] || return 1
  sha256sum --check "$SE03_ARCHIVE/backup.sha256" || return
  docker compose exec -T db createdb -U app "$SE03_RESTORE_DB" || return
  SE03_START_NS="$(python3 -c 'import time; print(time.monotonic_ns())')" || return
  if docker compose exec -T db pg_restore --exit-on-error --no-owner --no-privileges \
    -U app -d "$SE03_RESTORE_DB" < "$SE03_ARCHIVE/inventory.dump"; then
    SE03_RESTORE_RC=0
  else
    SE03_RESTORE_RC=$?
    printf '中止: pg_restore終了コード=%s。部分復元を合格にしません。\n' "$SE03_RESTORE_RC" >&2
    return "$SE03_RESTORE_RC"
  fi
  SE03_END_NS="$(python3 -c 'import time; print(time.monotonic_ns())')" || return
  printf '復元先=%s / pg_restore終了コード=%s\n' "$SE03_RESTORE_DB" "$SE03_RESTORE_RC"
  python3 - "$SE03_START_NS" "$SE03_END_NS" <<'PY'
import sys
elapsed = (int(sys.argv[2]) - int(sys.argv[1])) / 1_000_000_000
print(f"復元操作の実測経過時間: {elapsed:.3f} 秒")
PY
  SE03_TIMING_RC=$?
  [ "$SE03_TIMING_RC" -eq 0 ] || return "$SE03_TIMING_RC"
  SE03_RESTORE_READY=true
}
se03_restore
```

createdbが失敗した場合は関数を終了し、既存の同名DBへ復元しません。`pg_restore`が非ゼロなら、部分的な復元を合格にせずエラーを保存し、後続の比較も拒否します。時計取得・時間計算に失敗した場合も完了フラグを付けません。DB作成後の失敗は、部分DBを残して記録し、別の試行名で最初からやり直します。`--exit-on-error`は最初の復元エラーで停止する指定、`--no-owner --no-privileges`は元の所有者・権限をコピーせずにデータ復元を確かめる指定です。実際の移行では別途所有者と権限を設計します。

ここでの秒数は、復元直前・直後の時計取得を含む**復元操作の経過時間**です。障害の検知、判断、連絡、アプリ切替を含むサービス全体の復旧時間ではありません。RTOは本来「何分以内に戻すか」という目標です。計画のRTOと今回の実測時間を別欄にし、他の環境やデータ量へ一般化しません。

### 3. 別名と内容を検証する

```bash
se03_compare() {
  [ "${SE03_RESTORE_READY:-false}" = true ] || {
    printf '中止: 復元と時間計測が完了していません。\n' >&2
    return 1
  }
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U app -d "$SE03_RESTORE_DB" \
    -c 'SELECT current_database(), count(*) FROM public.items;' || return
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U app -d "$SE03_RESTORE_DB" \
    -c 'COPY (SELECT id, sku, name, quantity, created_at FROM public.items ORDER BY id) TO STDOUT WITH CSV' \
    > "$SE03_ARCHIVE/restored.csv" || return
  sha256sum "$SE03_ARCHIVE/source.csv" "$SE03_ARCHIVE/restored.csv" || return
  if cmp "$SE03_ARCHIVE/source.csv" "$SE03_ARCHIVE/restored.csv"; then
    printf '内容比較の終了コード=0\n'
  else
    SE03_COMPARE_RC=$?
    printf '内容比較の終了コード=%s。内容一致とは判定しません。\n' "$SE03_COMPARE_RC" >&2
    return "$SE03_COMPARE_RC"
  fi
  docker compose exec -T client curl --max-time 5 -fsS http://web/readyz || return
}
se03_compare
```

期待はDB名が元の`inventory`と異なり、pg_restoreとcmpの終了コードが0、元アプリのreadyも成功することです。件数だけ同じでも、skuや数量が違えば不合格です。最終curlは**元アプリが壊れていない**確認であり、復元DBへAPを切り替えた証拠ではありません。

### 4. 結果と範囲を記録する

| 欄 | 残す内容 |
| --- | --- |
| 元DB / 復元DB | 別名であること、どちらのホスト・コンテナか |
| バックアップ | UTC日時、方式、SHA-256、サイズ、対象データ量 |
| 復元 | 実行コマンド、終了コード、実測時間の開始点と終了点 |
| データ比較 | 件数、順序を固定したCSV、ハッシュ、cmp結果 |
| 未実施 | 別ホスト復旧、APの接続先切替、PITR、遠隔地保管など |
| 失敗・再試験 | 部分復元、原因、修正、別の試行での結果 |

復元先DBは評価が終わるまで残して構いません。失敗したDBを元のinventoryへ上書きして合わせたり、volumeを丸ごと削除したりしません。再試験は別の新規DB名を使って追記します。終了時は、このラボのディレクトリで`docker compose down`を使い、volumeとdumpを保持します。不要になった演習DBや専用volumeの削除は、対象名・採録済み証跡・他用途なしを確認してから[ラボREADMEの後始末](https://github.com/ns7jp/server/blob/main/labs/three-tier/README.md)へ進みます。日常の停止に`down -v`は使いません。

```bash
docker compose down
unset SE03_DB_PASSWORD
```

## 提出・説明・補習

- [ ] C1: 応答・未認証の拒否・正しい認証・停止・再開を同じ対象で記録した。
- [ ] C2: TLS成功、信頼不足、名前不一致、有効期間、プロキシ先の応答を区別した。
- [ ] C3: 層ごとの応答、APからDBへの許可とWebからの拒否、専用roleの許可・拒否、AP自身の実ユーザーを示した。
- [ ] C4: 元DBと異なるDB名、pg_restoreの成功、内容一致、測定区間と秒数がある。
- [ ] 証跡原本を保存し、公開する写しから秘密値・鍵・私的情報を除いた。鍵・dumpを教材PRへ含めていない。
- [ ] [個人台帳](../tracker-guide.md)へUTC時刻、教材SHA、実行環境、支援量、セッションを付けて登録する。実行していない欄はNOT RUNを維持する。

| 自分の言葉で答える問題 | 解答の観点 | 補習先 |
| --- | --- | --- |
| healthzが200でも業務処理が失敗する理由は | プロセス生存とDBなど依存先の可否は違う。readyzと実データの要求も確認する | C3の3種類のhealthを比較 |
| 証明書のエラーを`-k`で避けたら合格か | 名前・信頼の確認を省略しただけであり、検証していない | C2の3つのcurlを再比較 |
| なぜappという名前だけで最小権限と言えないか | roleの実権限が必要。初期化ユーザーは管理権限を持ちうる | C3の`\du`と拒否試験 |
| バックアップファイルと復元後データのハッシュは同じになるか | ファイル形式が違う。dumpは自身の識別、データは同一形式に整えて比較する | C4のsource.csv/restored.csv |
| 0.1秒の復元を別案件のRTOに採用できるか | データ量、環境、検知・判断・切替時間が違う。目標と測定値を分ける | C4の測定範囲表 |
| 1台VMの3層コンテナで何をまだ示していないか | VM3台のOS導入、物理ネットワーク、別ホスト復元、冗長化など | 本文のルート表と[評価手順](../assessment.md) |

コマンドをコピーして動いた段階では、資料を見ながら「どの層で、何を確認したか」を説明する練習を追加します。資料やAIの支援を使うことはできますが、その支援を隠して独立実施と記録しません。次の[SE04](04-design.md)で、今回の実構成と試験を要件・設計・引き渡し文書につなぎます。
