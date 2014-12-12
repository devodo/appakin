#!/bin/bash

curl -H "Content-Type:application/json" -d '{"batchSize": 1000}' -X POST http://localhost:3002/admin/appstore/refresh_next_app_batch