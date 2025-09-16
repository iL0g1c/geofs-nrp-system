"""Utilities for launching the development Express stack.

This module exposes :func:`launch_express_stack` which starts both the
Express API (``npm run dev``) and the BrowserSync proxy (``npm run ui``) and
keeps both processes alive until the user interrupts execution.  It aims to
be portable between Windows, macOS, and Linux by avoiding shell-specific
constructs and making sure the spawned processes are cleaned up on exit.
"""
from __future__ import annotations

import contextlib
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Iterable, Sequence


class ProcessLaunchError(RuntimeError):
    """Raised when one of the managed processes exits unexpectedly."""


REQUIRED_SCRIPTS: tuple[str, str] = ("dev", "ui")


@contextlib.contextmanager
def _managed_process(command: Sequence[str], cwd: Path):
    """Launch a subprocess and ensure it is terminated on exit.

    Parameters
    ----------
    command:
        Sequence describing the command and its arguments.  A sequence is used
        instead of a shell command string so the function behaves the same way
        on Unix-like systems and Windows.
    cwd:
        Directory from which the process should be launched.
    """

    process = subprocess.Popen(command, cwd=str(cwd))
    try:
        yield process
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def _ensure_npm_available() -> str:
    """Return the path to the `npm` executable or raise a helpful error."""

    npm_path = shutil.which("npm")
    if npm_path is None:
        raise FileNotFoundError(
            "npm was not found on your PATH. Install Node.js and make sure "
            "npm is available before launching the development stack."
        )
    return npm_path


def _has_required_scripts(package_file: Path) -> bool:
    """Return ``True`` if ``package.json`` contains the required scripts."""

    try:
        package_data = json.loads(package_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False

    scripts = package_data.get("scripts")
    if not isinstance(scripts, dict):
        return False

    return all(script in scripts for script in REQUIRED_SCRIPTS)


def _find_package_root(start: Path) -> Path | None:
    """Search ``start`` and its descendants for a matching ``package.json``."""

    if start.is_file():
        start = start.parent

    package_file = start / "package.json"
    if package_file.is_file() and _has_required_scripts(package_file):
        return start

    for nested_package in start.rglob("package.json"):
        if "node_modules" in nested_package.parts:
            continue
        if _has_required_scripts(nested_package):
            return nested_package.parent
    return None


def _resolve_project_root(project_root: Path | str | None) -> Path:
    """Determine the directory that contains the Express ``package.json``."""

    if project_root is not None:
        candidate = Path(project_root).expanduser().resolve()
        if candidate.is_file():
            candidate = candidate.parent
        if not candidate.exists():
            raise FileNotFoundError(f"{candidate} does not exist")
        found = _find_package_root(candidate)
        if found is None:
            raise FileNotFoundError(
                "Could not locate a package.json with the required scripts "
                f"under {candidate}."
            )
        return found

    search_roots = [Path.cwd(), Path(__file__).resolve().parent]
    seen: set[Path] = set()
    for root in search_roots:
        resolved = root.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        found = _find_package_root(resolved)
        if found is not None:
            return found

    search_list = ", ".join(str(root) for root in search_roots)
    raise FileNotFoundError(
        "Could not find a package.json containing the 'dev' and 'ui' scripts. "
        f"Searched: {search_list}. Provide the project_root argument to "
        "launch_express_stack() to specify the correct directory."
    )


def launch_express_stack(project_root: Path | str | None = None) -> None:
    """Start the Express development server and BrowserSync proxy.

    The function blocks until the user interrupts the process (for example,
    with ``Ctrl+C``).  If either subprocess exits before that happens, a
    :class:`ProcessLaunchError` is raised to signal that the stack is no longer
    running.

    Parameters
    ----------
    project_root:
        Directory that contains the ``package.json`` with the ``dev`` and ``ui``
        scripts.  If ``None``, the function searches from the current working
        directory and the location of this module.
    """

    npm_path = _ensure_npm_available()
    project_root = _resolve_project_root(project_root)

    commands: Iterable[Sequence[str]] = (
        (npm_path, "run", "dev"),
        (npm_path, "run", "ui"),
    )

    with contextlib.ExitStack() as stack:
        processes = [stack.enter_context(_managed_process(cmd, project_root)) for cmd in commands]
        script_names = ("npm run dev", "npm run ui")

        print(f"Launching development stack in {project_root}. Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
                for name, process in zip(script_names, processes):
                    exit_code = process.poll()
                    if exit_code is not None:
                        raise ProcessLaunchError(
                            f"{name} exited with status {exit_code}. Check its logs for details."
                        )
        except KeyboardInterrupt:
            print("\nStopping development stack…")


if __name__ == "__main__":
    try:
        launch_express_stack()
    except (FileNotFoundError, ProcessLaunchError) as exc:
        print(exc, file=sys.stderr)
        sys.exit(1)