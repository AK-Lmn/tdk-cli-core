# Run your app without Docker

A simple app does not need Docker or Tilt. Give each service a `command` in its `service.json`, and `flisk up` starts the services as local processes on your machine. All you need is the `flisk` CLI and your app's own runtime, such as Node.js, Python, Go or Bun.

Use this for the apps an AI coding agent builds first: an API, a website, a worker. Use [the Docker + Tilt path](quickstart.md) when you need a database, gateway routing, or the same container you will deploy.

## Example: an API and a website

```text
my-app/
├── api/
│   ├── server.js
│   └── service.json
└── web/
    ├── server.js
    └── service.json
```

`api/service.json`:

```json
{
  "$schema": "https://flisk.sh/schema.service.json",
  "schemaVersion": 1,
  "appName": "api",
  "appType": "backend",
  "command": "node server.js",
  "port": 4000,
  "healthCheckPath": "/health"
}
```

`web/service.json`:

```json
{
  "$schema": "https://flisk.sh/schema.service.json",
  "schemaVersion": 1,
  "appName": "web",
  "appType": "frontend",
  "command": "node server.js",
  "port": 3000,
  "dependsOn": ["api"],
  "env": { "API_URL": "http://localhost:4000" }
}
```

Start it from `my-app/`:

```bash
flisk up
```

```text
Created .flisk/project.json (this directory is now a Flisk project)
Starting 2 services as local processes (no Docker, no Tilt)...
  - api: node server.js
  - web: node server.js (after api)
api | [flisk] started: node server.js (pid 41210)
api | api listening on port 4000
api | [flisk] ready
web | [flisk] started: node server.js (pid 41214)
web | website listening on port 3000
web | [flisk] ready
Flisk is up (local processes, no Docker).
Services:
  ✓ api → http://localhost:4000 (health: http://localhost:4000/health)
  ✓ web → http://localhost:3000
Stop: Ctrl+C here, or flisk down from another terminal
Logs: flisk logs --service <name>, or .flisk/native/logs/<service>.log
```

`flisk up` stays in the foreground, like `tilt up` does. Press Ctrl+C to stop every service, or run `flisk down` from another terminal. A working copy of this example is the [`tests/fixtures/unopinionated`](../tests/fixtures/unopinionated) fixture.

## The service contract

| Field | Required | What it does |
| --- | --- | --- |
| `appName` | yes | The service name, used in `dependsOn`, logs and `--only`. |
| `appType` | yes | What the service is: `backend`, `frontend`, `worker`, `mcp`, `agent` or `bring-your-own`. The Docker port ranges do not apply to a local process. |
| `schemaVersion` | yes | `1`. `flisk up` still starts a service without it and tells you how to add it. |
| `command` | yes | A shell command, run from the service directory. It is what makes the service a local process. |
| `port` | no | The port the service listens on. Flisk passes it as `PORT`, waits for it to answer, and prints `http://localhost:<port>`. |
| `healthCheckPath` | no | A path such as `/health`. Flisk waits until `http://localhost:<port><path>` answers below 400 before it starts the services that depend on this one. |
| `env` | no | Extra environment variables. Values may use `${VAR}` or `${VAR:-default}` from the project `.env` or your shell. |
| `dependsOn` | no | Services that must be ready first. Each name must be another service with a `command`. |
| `restart` | no | `"no"` turns off the restart on exit. |

A service has exactly one runtime source: a `command`, or a container (`image`, `dockerfile`, or a Dockerfile Flisk generates). A service that declares `command` together with `image` or `dockerfile` is refused, and the error names the service.

`stack` is optional. Set it if you want to start a group with `flisk up <stack>`.

`dev.command` is a different field: it is the development command inside a container Flisk generates for languages such as Python. It does not make a service run without Docker.

## What `flisk up` does

- **Order.** It starts services in `dependsOn` order. A service starts once every service it depends on is ready. Ready means the health URL answers; without `healthCheckPath`, that the port accepts connections; without a port, that the process is still running after a second. It waits up to 60 seconds per service.
- **Logs.** Each line of output is prefixed with the service name. Lines are also written, with a timestamp, to `.flisk/native/logs/<service>.log`, which is what `flisk logs` reads.
- **Restarts.** A process that exits is started again after 1 second, then 2, 4, 8. After five quick exits in a row Flisk stops restarting it and says so. Set `"restart": "no"` for a one-shot job.
- **Checks before it starts.** It refuses to start when a command's program is not installed, a port is already in use (it names the process that holds it), two services share a port, or a `dependsOn` name is not a service with a command.
- **Nothing generated.** It writes `.flisk/project.json` the first time, plus `.flisk/native/` for logs and the process list (that folder ignores itself in git). No Dockerfile, Compose file, Tiltfile, Vite or TypeScript config.

## Other commands

| Command | With local processes |
| --- | --- |
| `flisk up --dry-run` | Shows the services, their commands and the start order. |
| `flisk up --only web` | Starts `web` and what it depends on. |
| `flisk up --json` | Prints one JSON line when every service is ready, with `"runtime": "native"` and each service's URL. |
| `flisk down` | Stops every service, dependents first, and frees the ports. |
| `flisk status` | Shows each service as ready, restarting, or not running. |
| `flisk logs --service api --tail 50` | Recent output, merged across services in time order. `--since 5m` works too. |
| `flisk doctor` | Checks only what the services need: their programs are installed, their `dependsOn` and ports are valid, and running services answer. It does not check Docker, Compose, Tilt or the gateway ports. |

## When you need Docker

Remove `command` and use the [Docker + Tilt path](quickstart.md) for:

- a database such as Postgres, or other shared infrastructure (`dependsOn: ["postgres"]` is refused here);
- one gateway URL for every service, with routing by host and path (Traefik);
- running the same container image you deploy;
- live update inside containers, generated API clients, and the other generated files.

One project cannot mix the two yet: if some services declare `command` and others do not, `flisk up` stops and lists both groups. For live reload without Docker, use your runtime's own watch mode in the command, for example `node --watch server.js`, `bun --watch server.ts` or `uvicorn main:app --reload`.

Native Windows is not supported; use WSL2, as for the Docker path.
