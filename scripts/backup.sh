#!/bin/bash

TIMESTAMP=$(date +"%F-%H%M%S")
BACKUP_DIR="/tmp/mongo_backup_$TIMESTAMP"
BUCKET_NAME="todo-db-backups"
ARCHIVE_NAME="backup-$TIMESTAMP.tar.gz"

mkdir -p $BACKUP_DIR

mongodump --out=$BACKUP_DIR

tar -czf /tmp/$ARCHIVE_NAME -C $BACKUP_DIR .

aws s3 cp /tmp/$ARCHIVE_NAME s3://$BUCKET_NAME/backups/

rm -rf $BACKUP_DIR /tmp/$ARCHIVE_NAME

# Retention Policy
aws s3 ls s3://$BUCKET_NAME/backups/ | awk '{print $4}' | grep backup | sort -r | tail -n +8 | xargs -I {} aws s3 rm s3://$BUCKET_NAME/backups/{}

# Notify Admin
./scripts/notify.sh "$BREVO_API_KEY" "$ADMIN_EMAIL" "✅ Database Backup Successful" "Database backed up at $TIMESTAMP"