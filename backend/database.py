import os

from dotenv import load_dotenv

load_dotenv(override=True)

DATABASE_URL = os.environ["DATABASE_URL"]

# The app is built against psycopg (v3, see requirements.txt) but a bare
# "postgresql://" URL makes SQLAlchemy default to psycopg2, which isn't
# installed - normalize so either form works regardless of how it's written
# in .env.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]
