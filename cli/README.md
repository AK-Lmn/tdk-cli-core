# TDK CLI

Command line interface for the Tilt Development Kit (TDK).

## Installation

```bash
npm install -g @tdk/cli
```

## Usage

```bash
# Start services
tdk up

# Start specific services
tdk up salon-management-backend identity-management-backend

# Stop services
tdk down

# Check status
tdk status

# List all services
tdk list

# Initialize a new service
tdk init

# Watch mode
tdk watch

# Interactive UI
tdk ui
```

## Commands

- `up [services...]` - Start services via Tilt
- `down` - Stop all services
- `status` - Show service status
- `list` - List all available services
- `init` - Initialize a new service
- `watch` - Watch mode for development
- `ui` - Interactive terminal UI

## License

MIT
