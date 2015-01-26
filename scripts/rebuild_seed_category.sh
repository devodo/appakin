#!/bin/bash

curl -H "Content-Type:application/json" -d '{"seedCategoryId": 264}' -X POST http://localhost:3002/admin/task/rebuild_seed_category