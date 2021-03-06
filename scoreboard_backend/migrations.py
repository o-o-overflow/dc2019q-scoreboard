import logging

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

MIGRATIONS = [
    (
        "CREATE TABLE users ("
        "id serial PRIMARY KEY, "
        "date_created timestamp with time zone NOT NULL, "
        "date_confirmed timestamp with time zone NULL, "
        "email varchar(320) NOT NULL, "
        "password char(60) NOT NULL, "
        "team_name varchar(80) NOT NULL, "
        "ctf_time_team_id integer NULL);"
    ),
    "CREATE UNIQUE INDEX users_lower_email on users (lower(email));",
    "CREATE UNIQUE INDEX users_lower_team_name on users (lower(team_name));",
    (
        "CREATE TABLE challenges ("
        "id varchar(16) PRIMARY KEY, "
        "date_created timestamp with time zone NOT NULL, "
        "name varchar(160) NOT NULL, "
        "description text, "
        "category_id integer NOT NULL);"
    ),
    (
        "CREATE TABLE categories ("
        "id serial PRIMARY KEY, "
        "date_created timestamp with time zone NOT NULL, "
        "name varchar(80) NOT NULL);"
    ),
    (
        "ALTER TABLE challenges ADD CONSTRAINT fk_challenges_to_categories "
        "FOREIGN KEY (category_id) REFERENCES categories(id);"
    ),
    (
        "CREATE TABLE confirmations ("
        "id char(36) PRIMARY KEY, "
        "user_id integer NOT NULL UNIQUE);"
    ),
    (
        "ALTER TABLE confirmations ADD CONSTRAINT fk_confirmations_to_users "
        "FOREIGN KEY (user_id) REFERENCES users(id);"
    ),
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    (
        "CREATE TABLE submissions ("
        "id serial PRIMARY KEY, "
        "date_created timestamp with time zone NOT NULL, "
        "user_id integer NOT NULL REFERENCES users, "
        "challenge_id varchar(16)  NOT NULL REFERENCES challenges, "
        "flag varchar(160) NOT NULL);"
    ),
    "ALTER TABLE users ADD date_last_submitted timestamp with time zone;",
    "CREATE INDEX users_last_submitted ON users (date_last_submitted);",
    "ALTER TABLE challenges ADD flag_hash char(64) NOT NULL;",
    (
        "CREATE TABLE unopened_challenges ("
        "id varchar(16) PRIMARY KEY, "
        "date_created timestamp with time zone NOT NULL, "
        "name varchar(160) NOT NULL, "
        "description text, "
        "category_id integer NOT NULL REFERENCES categories, "
        "flag_hash char(64) NOT NULL);"
    ),
    (
        "CREATE TABLE solves ("
        "date_created timestamp with time zone NOT NULL, "
        "challenge_id varchar(16) NOT NULL REFERENCES challenges, "
        "user_id integer NOT NULL REFERENCES users, "
        "PRIMARY KEY(challenge_id, user_id));"
    ),
    "ALTER TABLE challenges ADD tags text NOT NULL;",
    "ALTER TABLE unopened_challenges ADD tags text NOT NULL;",
    "ALTER TABLE challenges ALTER COLUMN id TYPE varchar(32);",
    "ALTER TABLE unopened_challenges ALTER COLUMN id TYPE varchar(32);",
    "ALTER TABLE submissions ALTER COLUMN challenge_id TYPE varchar(32);",
    "ALTER TABLE solves ALTER COLUMN challenge_id TYPE varchar(32);",
    "CREATE INDEX submissions_challenge_id_user_id ON submissions (challenge_id, user_id);",
    "CREATE INDEX submissions_date_created ON submissions (date_created);",
    "ALTER TABLE users DROP COLUMN date_last_submitted;",
]


def latest_migration(psql):
    with psql.cursor() as cursor:
        LOGGER.info("Create schema_migrations if necessary")
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations ( "
            "id integer PRIMARY KEY, "
            "date_applied timestamp with time zone NOT NULL);"
        )
        LOGGER.info("Find latest migration")
        cursor.execute("SELECT id from schema_migrations ORDER BY id DESC LIMIT 1;")
        return (cursor.fetchone() or (-1,))[0]


def reset(psql):
    with psql.cursor() as cursor:
        LOGGER.info("DROP TABLEs")
        cursor.execute(
            "DROP TABLE IF EXISTS categories, challenges, "
            "confirmations, schema_migrations, solves, "
            "submissions, unopened_challenges, users;"
        )


def run_migrations(psql, reset_db):
    if reset_db:
        reset(psql)
    last = latest_migration(psql)
    if last + 1 >= len(MIGRATIONS):
        return last
    with psql.cursor() as cursor:
        for i, migration in enumerate(MIGRATIONS[last + 1 :]):
            LOGGER.info("up: {}".format(migration))
            cursor.execute(migration)
            cursor.execute(
                "INSERT INTO schema_migrations VALUES (%s, now());", (last + 1 + i,)
            )
    return last + 1 + i
