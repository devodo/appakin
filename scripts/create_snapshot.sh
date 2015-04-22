#!/bin/bash

curl -H "Content-Type:application/json" -d '{"batchSize": '"$1"'}' -X POST http://localhost:3006/index/app/snapshot

