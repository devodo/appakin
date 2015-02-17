#!/bin/bash

curl -H "Content-Type:application/json" -d '{"appId": '"$1"'}' -X POST http://localhost:3002/admin/search/cluster/index_app
