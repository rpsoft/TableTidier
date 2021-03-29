#!/bin/bash
pg_dump --host localhost --port 5432 --username "postgres" --role "postgres" --no-password  --format plain --encoding UTF8 --verbose --file $1 "ihw_annotator"
