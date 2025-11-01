import json
import sys
sys.stdout.reconfigure(encoding='utf-8')
from collections import OrderedDict
from typing import Any

def extract_paths(obj: Any, prefix: str = "", depth: int = 0):
    paths = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            paths.extend(extract_paths(v, new_prefix, depth + 1))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            new_prefix = f"{prefix}[{i}]"
            paths.extend(extract_paths(item, new_prefix, depth + 1))
    else:
        paths.append({
            "path": prefix,
            "type": type(obj).__name__,
            "sample": str(obj)[:120],  # grab a short sample
            "depth": depth
        })
    return paths


def summarize_structure(paths):
    summary = OrderedDict()
    for p in paths:
        root_key = p["path"].split(".")[0].split("[")[0]
        summary.setdefault(root_key, {"count": 0, "examples": []})
        summary[root_key]["count"] += 1
        if len(summary[root_key]["examples"]) < 3:
            summary[root_key]["examples"].append(p["path"])
    return summary


if __name__ == "__main__":
    with open("data/inspection.json") as f:
        data = json.load(f)

    all_paths = extract_paths(data)

    print("Extracted JSON Structure:\n")
    for p in all_paths:
        print(f"{p['path']} ({p['type']}) → Sample: {p['sample']}")

    print("\n Summary by Root Section:\n")
    summary = summarize_structure(all_paths)
    for key, val in summary.items():
        print(f"{key}: {val['count']} fields")
        for ex in val["examples"]:
            print(f"   ↳ {ex}")
