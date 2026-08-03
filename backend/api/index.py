import os
import sys

# Vercel's Python runtime needs backend/ on sys.path to resolve `import main`
# from this api/ entrypoint (see automation-template/backend/main.py for the
# same workaround).
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402,F401
