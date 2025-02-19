#!/bin/bash
if [ -n "$1" ]; then
  echo "Restoring $1"
  pg_restore --host localhost --port 5432 --username "postgres" --role "postgres" --no-password  --format plain --encoding UTF8 "ihw_annotator" < $1
else
  echo "File to restore not supplied."
fi

#createdb --host localhost --port 5432 --username "postgres" "ihw_annotator"
#psql --host localhost --port 5432 --username "postgres" -d "ihw_annotator" < backup.sql
