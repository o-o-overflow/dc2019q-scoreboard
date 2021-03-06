from contextlib import contextmanager
import base64
import copy
import json
import logging
import os

import boto3
import psycopg2


LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)


def api_response(status_code=200, message=None, log_message=True):
    body = {"success": status_code < 400}
    logged = False
    if message:
        if not log_message:
            log_body = body.copy()
            log_body["message_size"] = len(json.dumps(message))
            LOGGER.info(log_body)
            logged = True
        body["message"] = message

    if not logged:
        LOGGER.info(body)
    return {
        "body": json.dumps(body),
        "headers": {"Access-Control-Allow-Origin": "*"},
        "statusCode": status_code,
    }


def decrypt_secrets():
    session = boto3.session.Session()
    kms = session.client("kms")
    data = base64.b64decode(os.getenv("SECRETS"))
    return json.loads(kms.decrypt(CiphertextBlob=data)["Plaintext"].decode("utf-8"))


def log_request(data):
    data = copy.deepcopy(data)
    if "password" in data and isinstance(data["password"], str):
        data["password"] = "<password len={}>".format(len(data["password"]))
    LOGGER.info(data)


def parse_json_request(event, min_body_size=2, max_body_size=512):
    headers = event.get("headers", {})
    content_type = ""
    for header in headers:
        if header.lower() == "content-type":
            content_type = headers[header]
            break
    if (
        content_type.lower() != "application/json"
        or not min_body_size <= len(event["body"]) <= max_body_size
    ):
        return None
    try:
        return json.loads(event["body"])
    except Exception:
        return None


@contextmanager
def psql_connection(db_password, db_username):
    psql = psycopg2.connect(
        dbname="scoreboard",
        host=os.getenv("DB_HOST"),
        password=db_password,
        user=db_username,
    )
    try:
        yield psql
    finally:
        psql.close()


def send_email(from_email, to_email, subject, body, stage="dev"):
    if stage != "prod":
        # Only send actual emails in the prod stage.
        to_email = "team+{}@oooverflow.io".format(stage)
        subject = "[Stage: {}] {}".format(stage, subject)

    client = boto3.client("ses", region_name="us-east-1")
    try:
        return client.send_email(
            Destination={"ToAddresses": [to_email]},
            Message={"Body": {"Text": {"Data": body}}, "Subject": {"Data": subject}},
            Source=from_email,
        )
    except client.exceptions.MessageRejected:
        LOGGER.exception("failed to send email to {}".format(to_email))
        body = "Email failed to send. Please forward to {}. Thanks!\n\n{}".format(
            to_email, body
        )

    return client.send_email(
        Destination={"ToAddresses": ["team@oooverflow.io"]},
        Message={"Body": {"Text": {"Data": body}}, "Subject": {"Data": subject}},
        Source=from_email,
    )
