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

### Project

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



[configuration](https://db-migrate.readthedocs.io/en/latest/Getting%20Started/configuration/)
