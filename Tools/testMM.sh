#!/bin/bash
curl -d "input=placebo &args=-AsI+ --JSONn -E" -H "Content-Type: application/x-www-form-urlencoded" -X POST http://localhost:8080/form
