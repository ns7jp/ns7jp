#!/usr/bin/env python3
"""Disposable loopback HTTP/change/restore rehearsal; standard library only."""

import hashlib
import json
import platform
import sys
import tempfile
import threading
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    report = {
        "schema_version": 1,
        "case": "training-linux-web-01",
        "performed_at": datetime.now(timezone.utc).isoformat(),
        "actor": "AI-assisted execution; not learner assessment",
        "environment": {
            "system": platform.system(),
            "release": platform.release(),
            "python": platform.python_version(),
        },
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "scope": "temporary directory; Python HTTP server; IPv4 loopback only",
        "checks": [],
        "not_run": ["VM provisioning", "Ansible", "Docker", "systemd",
                    "firewall", "reboot", "long-term monitoring",
                    "human acceptance", "PJ stage approval"],
    }

    def check(check_id, expected, actual):
        report["checks"].append({"id": check_id, "expected": expected,
                                 "actual": actual,
                                 "result": "PASS" if expected == actual else "FAIL"})

    opener = build_opener(ProxyHandler({}))
    server = None
    worker = None
    root = None
    try:
        with tempfile.TemporaryDirectory(prefix="training-linux-web-") as folder:
            root = Path(folder)
            web = root / "web"
            web.mkdir()
            page = web / "index.html"
            original = b"training-linux-web-01: version 1\n"
            candidate = b"training-linux-web-01: version 2\n"
            page.write_bytes(original)
            backup = root / "index.backup"
            backup.write_bytes(page.read_bytes())
            server = ThreadingHTTPServer(
                ("127.0.0.1", 0), partial(QuietHandler, directory=str(web)))
            server.timeout = 2
            worker = threading.Thread(target=server.serve_forever, daemon=True)
            worker.start()
            url = "http://127.0.0.1:%d" % server.server_address[1]

            def get(resource="/"):
                with opener.open(url + resource, timeout=3) as response:
                    return response.status, response.read()

            check("T01-loopback-bind", "127.0.0.1", server.server_address[0])
            status, body = get()
            check("T02-http-initial", [200, original.decode()], [status, body.decode()])
            missing_status = None
            try:
                get("/missing")
            except HTTPError as error:
                missing_status = error.code
                error.close()
            check("T03-missing-resource", 404, missing_status)
            original_hash = hashlib.sha256(original).hexdigest()
            check("T04-backup-integrity", original_hash,
                  hashlib.sha256(backup.read_bytes()).hexdigest())
            page.write_bytes(candidate)
            status, body = get()
            check("T05-change-visible", [200, candidate.decode()], [status, body.decode()])
            page.write_bytes(backup.read_bytes())
            status, body = get()
            check("T06-restore-http", [200, original.decode()], [status, body.decode()])
            check("T07-restore-integrity", original_hash,
                  hashlib.sha256(page.read_bytes()).hexdigest())
            server.shutdown()
            server.server_close()
            worker.join(timeout=3)
            check("T08-worker-stopped", False, worker.is_alive())
            unreachable = False
            try:
                get()
            except (URLError, TimeoutError, ConnectionError):
                unreachable = True
            check("T09-service-stopped", True, unreachable)
        check("T10-temporary-files-removed", False, root.exists())
    except Exception as error:
        # Do not print exception messages containing local user paths.
        report["error_type"] = type(error).__name__
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()
        if worker is not None:
            worker.join(timeout=3)
        report["finished_at"] = datetime.now(timezone.utc).isoformat()
        report["result"] = "PASS" if (
            "error_type" not in report and len(report["checks"]) == 10
            and all(item["result"] == "PASS" for item in report["checks"])
        ) else "FAIL"
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["result"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
