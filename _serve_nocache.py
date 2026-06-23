"""Static file server that disables caching.

`python -m http.server` sends no Cache-Control, so browsers apply heuristic
freshness and serve stale JS/CSS across rapid reloads — which silently makes the
self-test harnesses verify OLD code. This server sends no-store on every response
so every harness run reflects the current source on disk.

Usage: python _serve_nocache.py [port]   (default 8137)
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8137


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    with Server(('', PORT), NoCacheHandler) as httpd:
        print('No-cache server on http://localhost:%d' % PORT)
        httpd.serve_forever()
