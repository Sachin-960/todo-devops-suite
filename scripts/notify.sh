#!/bin/bash

BREVO_API_KEY=$1
TO_EMAIL=$2
SUBJECT=$3
TEXT=$4

curl -X POST https://api.brevo.com/v3/smtp/email  \
  -H "accept: application/json" \
  -H "api-key: $BREVO_API_KEY" \
  -d '{
    "sender": {"name":"Todo App","email":"'"$SMTP_FROM"'"},
    "to": [{"email":"'"$TO_EMAIL"'"}],
    "subject":"'"$SUBJECT"'",
    "textContent":"'"$TEXT"'",
    "htmlContent":"<p>'"$TEXT"'</p>"
}'