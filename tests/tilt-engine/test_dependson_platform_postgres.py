"""
dependsOn starting shared platform Postgres (openspec/changes/dependson-starts-platform-postgres).

Executes the real Starlark through Tilt's interpreter (`tilt alpha tiltfile-result`)
instead of inspecting source text, plus source-text guards for the force-start path.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

pytestmark = [
    pytest.mark.generator,
    pytest.mark.skipif(shutil.which("tilt") is None, reason="tilt CLI not installed"),
]

REPO_ROOT = Path(__file__).resolve().parents[2]
ORCHESTRATOR_DIR = REPO_ROOT / "engine" / "topologies" / "tilt" / "resources" / "orchestrator"
INFRA_LOADER = REPO_ROOT / "engine" / "topologies" / "tilt" / "resources" / "infra-loader.star"
RESULT_MARKER = "Error in fail: RESULT"


def run_starlark(tmp_path: Path, body: str) -> dict:
    """Run `body` in a Tiltfile; `body` must assign a dict to `r`. `@ORCHESTRATOR` is the orchestrator module dir."""
    tiltfile = tmp_path / "Tiltfile"
    tiltfile.write_text(
        body.replace("@ORCHESTRATOR", str(ORCHESTRATOR_DIR))
        + "\nfail('RESULT' + encode_json(r))\n"
    )
    proc = subprocess.run(
        ["tilt", "alpha", "tiltfile-result", "-f", str(tiltfile)],
        capture_output=True,
        text=True,
        timeout=180,
    )
    output = proc.stdout + proc.stderr
    assert RESULT_MARKER in output, output[-3000:]
    return json.loads(output.split(RESULT_MARKER, 1)[1].strip())


def _run_resolve(tmp_path: Path, dep_name: str, all_services_map: dict | None = None) -> str:
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'resolve_dependency_to_resource')\n"
        f"r = {{'resolved': resolve_dependency_to_resource({dep_name!r}, {all_services_map or {}!r})}}\n",
    )
    return result["resolved"]


def test_resolve_postgres_maps_to_postgres_not_yaml(tmp_path):
    assert _run_resolve(tmp_path, "postgres") == "postgres"


def test_resolve_database_management_maps_to_postgres(tmp_path):
    assert _run_resolve(tmp_path, "database-management") == "postgres"


def test_resolve_typo_does_not_map_to_postgres(tmp_path):
    for typo in ("postgress", "Postgres", "postgresql"):
        resolved = _run_resolve(tmp_path, typo)
        assert resolved != "postgres", typo
        assert resolved == typo + "-yaml", (typo, resolved)


def test_resolve_feature_on_still_maps_via_public_resolve(tmp_path):
    """Resolution special-case applies in BOTH feature states; public helper is the same path."""
    # all_services_map contains the names as services so fallthrough would be different
    all_services_map = {
        "postgres-yaml": {"name": "something", "resources": [{"name": "postgres"}]},
        "database-management-yaml": {"name": "something", "resources": [{"name": "postgres"}]},
    }
    assert _run_resolve(tmp_path, "postgres", all_services_map) == "postgres"
    assert _run_resolve(tmp_path, "database-management", all_services_map) == "postgres"


def test_mixed_depends_on_list_both_resolve_to_one_postgres(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'resolve_manifest_dependency_names')\n"
        "manifest = {'dependsOn': ['postgres', 'database-management']}\n"
        "r = {'names': resolve_manifest_dependency_names(manifest, {})}\n",
    )
    assert result["names"] == ["postgres"]


def test_public_helpers_exported(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', "
        "'SHARED_POSTGRES_DEPENDENCY_NAMES', 'is_shared_platform_postgres_dependency', "
        "'manifest_needs_shared_platform_postgres')\n"
        "r = {"
        "'names': SHARED_POSTGRES_DEPENDENCY_NAMES, "
        "'is_postgres': is_shared_platform_postgres_dependency('postgres'), "
        "'is_dm': is_shared_platform_postgres_dependency('database-management'), "
        "'is_typo': is_shared_platform_postgres_dependency('postgress'), "
        "'manifest_true': manifest_needs_shared_platform_postgres({'dependsOn': ['postgres']}), "
        "'manifest_dm': manifest_needs_shared_platform_postgres({'dependsOn': ['database-management']}), "
        "'manifest_false': manifest_needs_shared_platform_postgres({'dependsOn': ['other']}), "
        "'manifest_empty': manifest_needs_shared_platform_postgres({'dependsOn': []}), "
        "'manifest_missing': manifest_needs_shared_platform_postgres({}), "
        "'manifest_none': manifest_needs_shared_platform_postgres(None), "
        "}\n",
    )
    assert result["names"] == ["postgres", "database-management"]
    assert result["is_postgres"] is True
    assert result["is_dm"] is True
    assert result["is_typo"] is False
    assert result["manifest_true"] is True
    assert result["manifest_dm"] is True
    assert result["manifest_false"] is False
    assert result["manifest_empty"] is False
    assert result["manifest_missing"] is False
    assert result["manifest_none"] is False


def _make_should_enable(enabled: set[str]):
    """Starlark factory: a should_enable(name) that returns name in enabled."""
    return (
        "def make_should_enable(enabled_set):\n"
        "    def should_enable(name):\n"
        "        return name in enabled_set\n"
        "    return should_enable\n"
    )


def test_build_infra_dependencies_feature_off_has_no_postgres(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_infra_dependencies')\n"
        + _make_should_enable(set())
        + "should_enable = make_should_enable(set())\n"
        "r = {'deps': build_infra_dependencies('svc', should_enable, {}, False)}\n",
    )
    assert result["deps"] == []


def test_build_infra_dependencies_feature_on_has_postgres(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_infra_dependencies')\n"
        + _make_should_enable({"database-management"})
        + "should_enable = make_should_enable(set(['database-management']))\n"
        "r = {'deps': build_infra_dependencies('svc', should_enable, {}, False)}\n",
    )
    assert result["deps"] == ["postgres"]


def test_build_resource_deps_feature_off_depends_on_postgres_has_edge(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_resource_deps')\n"
        "res = {'name': 'svc-api'}\n"
        "manifest = {'dependsOn': ['postgres']}\n"
        "r = {'deps': build_resource_deps(res, 'svc-api', manifest, {}, [], {}, {}, None, {})}\n",
    )
    assert result["deps"] == ["postgres"]


def test_build_resource_deps_feature_off_depends_on_database_management_has_edge(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_resource_deps')\n"
        "res = {'name': 'svc-api'}\n"
        "manifest = {'dependsOn': ['database-management']}\n"
        "r = {'deps': build_resource_deps(res, 'svc-api', manifest, {}, [], {}, {}, None, {})}\n",
    )
    assert result["deps"] == ["postgres"]


def test_build_resource_deps_feature_on_depends_on_exactly_one_postgres(tmp_path):
    """Feature already adds postgres via _build_infra_dependencies; dependsOn must not double it."""
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_resource_deps')\n"
        "res = {'name': 'svc-api'}\n"
        "manifest = {'dependsOn': ['postgres']}\n"
        "r = {'deps': build_resource_deps(res, 'svc-api', manifest, {}, ['postgres'], {}, {}, None, {})}\n",
    )
    assert result["deps"] == ["postgres"]
    assert result["deps"].count("postgres") == 1


def test_build_resource_deps_feature_on_depends_on_dm_exactly_one_postgres(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_resource_deps')\n"
        "res = {'name': 'svc-api'}\n"
        "manifest = {'dependsOn': ['database-management']}\n"
        "r = {'deps': build_resource_deps(res, 'svc-api', manifest, {}, ['postgres'], {}, {}, None, {})}\n",
    )
    assert result["deps"] == ["postgres"]
    assert result["deps"].count("postgres") == 1


def test_build_resource_deps_no_edge_when_neither_feature_nor_dependency(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_resource_deps')\n"
        "res = {'name': 'svc-api'}\n"
        "manifest = {'dependsOn': []}\n"
        "r = {'deps': build_resource_deps(res, 'svc-api', manifest, {}, [], {}, {}, None, {})}\n",
    )
    assert result["deps"] == []


def test_build_resource_deps_mixed_names_single_postgres_edge(tmp_path):
    result = run_starlark(
        tmp_path,
        "load('@ORCHESTRATOR/apply_compose_resource_registration.star', 'build_resource_deps')\n"
        "res = {'name': 'svc-api'}\n"
        "manifest = {'dependsOn': ['postgres', 'database-management']}\n"
        "r = {'deps': build_resource_deps(res, 'svc-api', manifest, {}, [], {}, {}, None, {})}\n",
    )
    assert result["deps"].count("postgres") == 1


# --- Source-text guards (no tilt required for the file reads; still skipped with tilt mark above
# only when we want consistency — these use Path directly so they run without tilt too). ---


def test_source_force_start_platform_postgres_exists_and_does_not_load_messaging():
    """force_start_platform_postgres must exist; the force path must not register messaging/kafka/etc."""
    source = INFRA_LOADER.read_text()
    assert "def force_start_platform_postgres(" in source
    assert "force_start_postgres = force_start_platform_postgres" in source
    assert "_POSTGRES_REGISTERED" in source
    start_idx = source.find("def force_start_platform_postgres(")
    register_idx = source.find("def _register_platform_postgres(")
    load_idx = source.find("def _load_database_management(")
    assert start_idx != -1 and register_idx != -1 and load_idx != -1
    force_region = source[register_idx:load_idx]
    # Actual resource registrations forbidden on the force path (docstrings may mention them).
    for forbidden in (
        "dc_resource('nats'",
        "dc_resource('kafka'",
        "dc_resource('redis'",
        "dc_resource('zookeeper'",
        "dc_resource('provision-db",
        "dc_resource('prisma",
        "messaging_compose",
        "should_enable('debezium')",
    ):
        assert forbidden not in force_region, forbidden
    # Feature-on path still registers postgres via the same helper.
    db_body = source[load_idx : source.find("def _load_infisical", load_idx)]
    assert "_register_platform_postgres" in db_body


def test_source_no_circular_load_from_infra_loader_to_apply_compose():
    """infra-loader.star must not load apply_compose_resource_registration (circular load guard)."""
    source = INFRA_LOADER.read_text()
    assert "apply_compose_resource_registration" not in source
    assert "apply_compose" not in source


def test_source_apply_compose_loads_infra_loader_via_top_level_path():
    apply_source = (ORCHESTRATOR_DIR / "apply_compose_resource_registration.star").read_text()
    assert "load('../infra-loader.star', 'Infra')" in apply_source
