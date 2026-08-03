import os
import sys

# Vercel's Python runtime needs backend/ on sys.path to resolve `import main`
# from this repo-root api/ entrypoint (same workaround automation-template
# uses, adapted for our layout where main.py lives in ../backend).
sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
)

from main import app  # noqa: E402,F401
