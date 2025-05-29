#!/bin/bash

CURRENT=$(cat /opt/todo/current || echo "blue")

if [ "$CURRENT" == "blue" ]; then
  NEW=green
  OLD=blue
  NEW_PORT=3001
else
  NEW=blue
  OLD=green
  NEW_PORT=3000
fi

cd todo-devops-suite
git pull origin main
sudo docker-compose build $NEW
sudo docker-compose up -d $NEW

sleep 10

nc -zv localhost $NEW_PORT
if [ $? -eq 0 ]; then
  sudo docker-compose stop $OLD
  echo $NEW > /opt/todo/current
  echo "🚀 Switched to $NEW"
  ./scripts/notify.sh "$BREVO_API_KEY" "$ADMIN_EMAIL" "✅ Deployment Success" "New version deployed"
else
  echo "❌ New version failed. Keeping $OLD"
  sudo docker-compose stop $NEW
  ./scripts/notify.sh "$BREVO_API_KEY" "$ADMIN_EMAIL" "❌ Deployment Failed" "Rolling back"
  exit 1
fi