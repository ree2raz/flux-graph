.PHONY: dev install test

# Start frontend (:3000) and backend (:8000) together.
# Ctrl-C kills both.
dev:
	@trap 'kill 0' INT; \
	(cd backend && uv run uvicorn main:app --reload 2>&1 | sed 's/^/[backend] /') & \
	(cd frontend && npm start 2>&1 | sed 's/^/[frontend] /') & \
	wait

# Install all dependencies.
install:
	cd frontend && npm install
	cd backend && uv sync

# Run all tests (backend pytest + frontend Jest).
test:
	cd backend && uv run pytest test_main.py -v
	cd frontend && CI=true npm test -- --forceExit
