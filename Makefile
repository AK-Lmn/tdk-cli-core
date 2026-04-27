# Beauty CRM - Makefile
# Common development tasks

.PHONY: help test-tilt-engine test test-coverage lint

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Testing targets
test-tilt-engine: ## Run tilt-engine test suite
	@echo "🧪 Running tilt-engine tests..."
	pytest tests/tilt-engine/ -v --tb=short

test-tilt-engine-coverage: ## Run tilt-engine tests with coverage report
	@echo "🧪 Running tilt-engine tests with coverage..."
	pytest tests/tilt-engine/ -v --cov=tests/tilt-engine --cov-report=term-missing --cov-report=html

test: ## Run all tests
	@echo "🧪 Running all tests..."
	pytest tests/ -v --tb=short

test-coverage: ## Run all tests with coverage
	@echo "🧪 Running all tests with coverage..."
	pytest tests/ -v --cov --cov-report=term-missing --cov-report=html

# Test categories
test-snapshot: ## Run snapshot tests only
	pytest tests/tilt-engine/test_snapshot_*.py -v -m snapshot

test-daemon: ## Run daemon tests only
	pytest tests/tilt-engine/test_daemon_*.py -v -m daemon

test-health: ## Run health check tests only
	pytest tests/tilt-engine/test_health_*.py -v -m health

test-ide: ## Run IDE component tests only
	pytest tests/tilt-engine/test_*.py -v -m ide

test-safety: ## Run safety guard tests only
	pytest tests/tilt-engine/test_*prune*.py tests/tilt-engine/test_*alias*.py -v -m safety

test-cache: ## Run registry cache tests only
	pytest tests/tilt-engine/test_cache_*.py -v -m cache
