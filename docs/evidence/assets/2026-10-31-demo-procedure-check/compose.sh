#!/usr/bin/env bash
set -euo pipefail
export MONITOR_PORT=18080 PROMETHEUS_PORT=19090 ALERTMANAGER_PORT=19093
exec env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock compose --project-name ns7jp-demo-check-20261031 -f /workspace/server/compose.yaml -f /workspace/server/compose.e2e.yaml -f /tmp/ns7jp-demo-check-20261031/compose.check.json "$@"
