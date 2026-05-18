from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs
import json
import os
import re
import uuid


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
MESSAGES_FILE = DATA_DIR / "messages.ndjson"
MAX_BODY_BYTES = 30 * 1024
PORT = int(os.environ.get("PORT", "3000"))
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

CONTROL_CHARS_RE = re.compile(r"[\x00-\x1f\x7f]")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def clean_text(value, max_length):
    text = str(value or "")
    text = CONTROL_CHARS_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_length]


def clean_message(value, max_length):
    text = str(value or "")
    text = text.replace("\x00", "").replace("\r\n", "\n").strip()
    return text[:max_length]


def validate_contact(payload):
    contact = {
        "name": clean_text(payload.get("name"), 80),
        "email": clean_text(payload.get("email"), 120).lower(),
        "subject": clean_text(payload.get("subject"), 140),
        "service": clean_text(payload.get("service"), 80),
        "message": clean_message(payload.get("message"), 3000),
    }

    if len(contact["name"]) < 2:
        return None, "Name must be at least 2 characters long."

    if not EMAIL_RE.match(contact["email"]):
        return None, "Please enter a valid email address."

    if len(contact["message"]) < 10:
        return None, "Message must be at least 10 characters long."

    return contact, None


def save_contact(contact):
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    record = {
        "id": str(uuid.uuid4()),
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        **contact,
    }

    with MESSAGES_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(record, ensure_ascii=False) + "\n")

    return record


class PortfolioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
            self.end_headers()
            return

        self.send_error(404, "Not found")

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json(
                200,
                {
                    "ok": True,
                    "service": "ashwan-portfolio-backend",
                    "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                },
            )
            return

        if self.path.startswith("/api/"):
            self.send_json(404, {"ok": False, "error": "Route not found."})
            return

        super().do_GET()

    def do_POST(self):
        if self.path != "/api/contact":
            self.send_json(404, {"ok": False, "error": "Route not found."})
            return

        try:
            payload = self.read_payload()
            contact, error = validate_contact(payload)

            if error:
                self.send_json(400, {"ok": False, "error": error})
                return

            saved = save_contact(contact)
            print(f"[contact] {saved['createdAt']} {saved['name']} <{saved['email']}>")

            self.send_json(
                201,
                {
                    "ok": True,
                    "id": saved["id"],
                    "message": "Message received successfully.",
                },
            )
        except ValueError as error:
            self.send_json(400, {"ok": False, "error": str(error)})
        except Exception:
            self.send_json(500, {"ok": False, "error": "Server error. Please try again later."})
            raise

    def read_payload(self):
        content_length = int(self.headers.get("Content-Length", "0"))

        if content_length > MAX_BODY_BYTES:
            raise ValueError("Request body too large.")

        raw_body = self.rfile.read(content_length).decode("utf-8") if content_length else ""
        content_type = self.headers.get("Content-Type", "")

        if not raw_body:
            return {}

        if "application/json" in content_type:
            try:
                return json.loads(raw_body)
            except json.JSONDecodeError as error:
                raise ValueError("Invalid JSON body.") from error

        if "application/x-www-form-urlencoded" in content_type:
            return {key: values[0] if values else "" for key, values in parse_qs(raw_body).items()}

        return {}


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", PORT), PortfolioHandler)
    print(f"Portfolio backend running at http://localhost:{PORT}")
    server.serve_forever()
