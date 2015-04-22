#!/bin/bash

curl -H "Content-Type:application/json" -d '{"snapshot": "'"$1"'"}' -X POST http://localhost:3006/index/app/restore

