#!/bin/bash

curl -H "Content-Type:application/json" -d '{"numToKeep": '"$1"'}' -X DELETE http://localhost:3006/index/app/snapshots

