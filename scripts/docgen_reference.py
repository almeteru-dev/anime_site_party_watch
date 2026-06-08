#!/usr/bin/env python3

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "codebase"

EXCLUDE_DIRS = {
    ".git",
    ".next",
    ".turbo",
    "node_modules",
    "dist",
    "build",
    "public",
    "favicons-na",
    "ent",
}


def is_excluded(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


GO_FUNC_RE = re.compile(r"^func\s+(\([^\)]*\)\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(", re.MULTILINE)

TS_EXPORT_FN_RE = re.compile(r"^export\s+(async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", re.MULTILINE)
TS_FN_RE = re.compile(r"^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", re.MULTILINE)
TS_EXPORT_CONST_COMPONENT_RE = re.compile(
    r"^export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\(|function|async\s+\(|async\s+function)",
    re.MULTILINE,
)


@dataclass(frozen=True)
class FileSymbols:
    relpath: str
    kind: str
    symbols: list[str]


def iter_source_files() -> Iterable[Path]:
    roots = [
        ROOT / "backend" / "cmd",
        ROOT / "backend" / "internal",
        ROOT / "backend" / "migrations",
        ROOT / "frontend" / "app",
        ROOT / "frontend" / "components",
        ROOT / "frontend" / "lib",
        ROOT / "frontend" / "contexts",
    ]
    for base in roots:
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if not p.is_file():
                continue
            if is_excluded(p):
                continue
            if p.suffix.lower() not in {".go", ".ts", ".tsx", ".sql"}:
                continue
            yield p


def extract_symbols(path: Path) -> FileSymbols:
    rel = path.relative_to(ROOT).as_posix()
    suf = path.suffix.lower()
    text = path.read_text(encoding="utf-8", errors="replace")

    if suf == ".go":
        symbols = [m.group(2) for m in GO_FUNC_RE.finditer(text)]
        return FileSymbols(rel, "go", sorted(set(symbols)))

    if suf in {".ts", ".tsx"}:
        symbols = []
        symbols += [m.group(2) for m in TS_EXPORT_FN_RE.finditer(text)]
        symbols += [m.group(1) for m in TS_EXPORT_CONST_COMPONENT_RE.finditer(text)]
        symbols += [m.group(1) for m in TS_FN_RE.finditer(text)]
        return FileSymbols(rel, "ts", sorted(set(symbols)))

    if suf == ".sql":
        stmts = []
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("--"):
                continue
            if line.upper().startswith("CREATE TABLE"):
                stmts.append(line)
            elif line.upper().startswith("ALTER TABLE"):
                stmts.append(line)
        return FileSymbols(rel, "sql", stmts[:30])

    return FileSymbols(rel, "other", [])


def render(files: list[FileSymbols], lang: str) -> str:
    if lang == "en":
        title = "# Codebase Reference (Auto-generated)"
        note = (
            "This file is auto-generated. It lists source files and detected functions/components. "
            "Deep human-written descriptions are added separately over time."
        )
        file_word = "File"
        symbols_word = "Symbols"
    else:
        title = "# Справочник кодовой базы (Авто-генерация)"
        note = (
            "Этот файл сгенерирован автоматически. Он перечисляет исходники и найденные функции/компоненты. "
            "Подробные описания дописываются отдельно по мере готовности."
        )
        file_word = "Файл"
        symbols_word = "Символы"

    lines: list[str] = [title, "", note, ""]

    by_kind: dict[str, list[FileSymbols]] = {}
    for f in files:
        by_kind.setdefault(f.kind, []).append(f)

    for kind in ("go", "ts", "sql"):
        items = sorted(by_kind.get(kind, []), key=lambda x: x.relpath)
        if not items:
            continue
        lines.append(f"## {kind.upper()}")
        for it in items:
            lines.append(f"### {file_word}: `{it.relpath}`")
            if it.symbols:
                lines.append(f"- {symbols_word}: " + ", ".join(f"`{s}`" for s in it.symbols))
            else:
                lines.append(f"- {symbols_word}: (none detected)")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    files = [extract_symbols(p) for p in iter_source_files()]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "reference.en.md").write_text(render(files, "en"), encoding="utf-8")
    (OUT_DIR / "reference.ru.md").write_text(render(files, "ru"), encoding="utf-8")


if __name__ == "__main__":
    main()

