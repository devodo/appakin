#!/bin/bash

curl -H "Content-Type:application/json" -X POST http://localhost:3003/admin/task/rebuild_cluster_index
echo ''
