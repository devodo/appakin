#!/bin/bash

curl -H "Content-Type:application/json" -d '{"seedCategoryId": '"$1"'}' -X POST http://localhost:3002/admin/task/rebuild_seed_category
