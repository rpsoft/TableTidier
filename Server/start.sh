#!/bin/bash

SESSION=$USER

#Import configurations from config.json.
export API_PORT=$(cat config.json | jq '.api_port')
export API_BASE=$(cat config.json | jq '.api_base_url')
export API_DOMAIN=$(cat config.json | jq '.api_host')

export UI_PORT=$(cat config.json | jq '.ui_port')
export UI_DOMAIN=$(cat config.json | jq '.ui_host')

node build/index.js
