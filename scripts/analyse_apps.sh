#!/bin/bash

curl -H "Content-Type:application/json" -d '{"forceAll": '"$1"'}' -X POST http://localhost:3003/admin/analyse/apps
echo ''
