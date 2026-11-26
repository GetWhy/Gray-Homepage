#!/usr/bin/env python3
"""生成霞鹜文楷的页面字符子集（woff2）。

页面用到的汉字是有限的，把 24MB 的完整字体裁成只含这些字，体积能降到一两百 KB。
代价是：以后往 data/links.js 里加了新的汉字（新站点名等），字体里缺这些字时会回退到
系统字体，观感不一致。加完新站点后重新跑一次本脚本即可。

用法：
    python scripts/build-font-subset.py [字体文件路径]

字体文件下载地址（约 24MB）：
    https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Regular.ttf
"""

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ["index.html", "data/links.js", "assets/app.js", "assets/shelf3d.js"]
OUTPUT = ROOT / "assets/vendor/lxgw-wenkai-subset.woff2"

# 兜底补上常用标点，避免界面里的符号缺字
EXTRA = "·—…“”‘’《》〈〉【】（）！？：；、，。％＋－×÷°±→←↑↓↗↘　"

DEFAULT_FONT = pathlib.Path("/tmp/lxgw/LXGWWenKai-Regular.ttf")


def collect_chars() -> str:
    chars = set()
    for rel in SOURCES:
        path = ROOT / rel
        if not path.exists():
            continue
        for ch in path.read_text(encoding="utf-8"):
            if ord(ch) >= 0x20:
                chars.add(ch)
    chars.update(EXTRA)
    return "".join(sorted(chars))


def main() -> int:
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_FONT
    if not src.exists():
        print(f"找不到字体文件：{src}")
        print("请先下载：https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Regular.ttf")
        return 1

    chars = collect_chars()
    text_file = ROOT / "scripts/.subset-chars.txt"
    text_file.write_text(chars, encoding="utf-8")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(src),
        f"--text-file={text_file}",
        "--flavor=woff2",
        f"--output-file={OUTPUT}",
        "--layout-features=kern,ccmp,locl,mark,mkmk,vert,vrt2",
        "--name-IDs=1,2,3,4,5,6",
        "--drop-tables+=DSIG",
    ]
    subprocess.run(cmd, check=True)

    print(f"字符数：{len(chars)}")
    print(f"输出：{OUTPUT.relative_to(ROOT)}  {OUTPUT.stat().st_size / 1024:.0f} KB")
    text_file.unlink()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
