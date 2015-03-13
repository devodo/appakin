#!/bin/bash

curl -H "Content-Type:application/json" -d '{"fromDate": "'"$1"'"}' -X POST http://localhost:3002/admin/task/cluster_index_changed_apps
