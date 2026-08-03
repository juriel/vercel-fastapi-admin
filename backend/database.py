import os

from dotenv import load_dotenv

load_dotenv(override=True)

DATABASE_URL = os.environ["DATABASE_URL"]
