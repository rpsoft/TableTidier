# TableTidier Server

Backend for Table Tidier

## Install

### Develoment environment
For development enviroment we use [Byobu](https://www.byobu.org).
> Install for other linux flavours or macos [https://www.byobu.org/downloads](https://www.byobu.org/downloads)

```bash
# Byobu is an enhancement for the GNU Screen terminal multiplexer
sudo apt install byobu
```

We use nodejs:

> Install [nodejs](https://nodejs.org/en/download/) or by [package manager](https://nodejs.org/en/download/package-manager/)

We need python and pandas module.

> Normally python comes with linux. If not please visit [python](https://docs.python.org/3/using/unix.html)

Install pandas:
```bash
# https://pandas.pydata.org/docs/getting_started/install.html
pip3 install pandas
```

Install sklearn:
```bash
pip3 install sklearn
```

### db migrate

Recreate db for development, testing and deployment.

The config file will be used by the migrations scripts.

> Config file 'Server/database.json':
```json
{
  "dev": {
    "driver": "sqlite3",
    "filename": "./dev.db"
  },
  "test": {
    "driver": "sqlite3",
    "filename": ":memory:"
  },
  "sqlite": {
    "driver": "sqlite3",
    "filename": "./dev.db"
  },
  "postgres": {
    "driver": "pg",
    "user": "admin",
    "password": "password",
    "host": "localhost",
    "database": "ihw_annotator_test",
    "port": "5432",
    "schema": "my_schema"
  }
}
```

> In case of change the sqlite filename, also change it at the 'package.json' create script

```bash
# Create DB
npm run db:create:pg
npm run db:create:sqlite

# populate db
npm run db:up:pg
npm run db:up:sqlite

# reset db
npm run db:reset:pg
npm run db:reset:sqlite

```

### Testing

> Config testing environment 'Server/.env':
```bash
CONFIG_PATH=/PATH/TO/TableTidier/Server
```

Run test scripts:
```bash
# Before run the test load migration db
npm run test:watch:pg
npm run test:watch:sqlite
```


## Project

Install node packages dependencies:

```bash
# Install Front-end dependencies
cd UI
npm install
cd ..

# Install Back-end dependencies
cd Server
npm ci install
```

> Create folders for uploads and tables

```bash
# Standard folders location:
#   /PROJECT/Server/
#     
cd Server
mkdir uploads HTML_STYLES HTML_TABLES HTML_TABLES_DELETED HTML_TABLES_OVERRIDE
```

Add config.json file. You can use the example file at ./Server/config_example.json.<br>
Edit config.json as necessary.

```bash
cp Server
# Use config_example.json as base for config.json
cp config_example.json config.json
# Edit config.json with your editor Example with nano
nano config.json
cd ..
```

Add a .env file with path to 'config.json' <br>
Example:
```
CONFIG_PATH=/home/rp/recreo/TableTidier/Server
```

## Run

To start the development version of the project:

```bash
cd Server

# Run gulp script to compile server in build folder
npm run gulpWatch

# add database.json
database.json

# Open Byobu development session
./startWork

```


## db-migrate

Database migration framework for node.js

```bash
# Create a new table with sql files
node node_modules/db-migrate/bin/db-migrate create:sqlite TABLE_NAME --sql-file
```

[configuration](https://db-migrate.readthedocs.io/en/latest/Getting%20Started/configuration/)
