"""Fill the generated parts of index.html and index.pt.html from the thesis bibliography.

    python scripts/build_page.py /path/to/FWI/overleaf-projects/proposal/references.bib

For every <a class="cite" data-cite="key"> in a page, the link text becomes the
author-year label of that bib entry, and the bibliography between the
<!-- references:start --> and <!-- references:end --> markers lists every cited entry,
with the sections that cite it. Nothing is typed by hand: an entry whose bib notes
carry `% VERIFY` or `SECONDARY` (fields not checked against the publisher record)
is marked with a dagger. A cited key missing from the bibliography is an error.
"""
import html
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "index.pt.html"]
FIELDS = ("author", "title", "year", "journal", "booktitle", "volume", "number", "pages", "doi")
ACCENTS = {"'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃", "c": "̧"}
CITE = re.compile(r'(<a class="cite" href="#([\w-]+)" data-cite="\2">)\(([^<]*)\)(</a>)')
CITED_IN = {"index.html": "Cited in", "index.pt.html": "Citado em"}
UNVERIFIED = {"index.html": "fields not yet checked against the publisher record",
              "index.pt.html": "campos ainda não conferidos com o registro da editora"}


def latex_to_text(value: str) -> str:
    def accent(m):
        return unicodedata.normalize("NFC", m.group(2) + ACCENTS[m.group(1)])
    value = re.sub(r"\{?\\([`'^\"~c])\{?\s*(\w)\}?\}?", accent, value)
    value = value.replace("\\&", "&").replace("--", "–").replace("~", " ")
    return re.sub(r"[{}]", "", value).strip()


def parse_bib(text: str) -> dict:
    entries = {}
    for chunk in re.split(r"\n(?=@)", text):
        head = re.match(r"@(\w+)\{([^,\s]+),", chunk)
        if not head:
            continue
        end = chunk.index("\n}")
        body, notes = chunk[:end], chunk[end:]
        fields = {}
        for name in FIELDS:
            m = re.search(rf"\b{name}\s*=\s*\{{((?:[^{{}}]|\{{(?:[^{{}}]|\{{[^{{}}]*\}})*\}})*)\}}", body)
            if m:
                fields[name] = latex_to_text(m.group(1))
        fields["verified"] = "% VERIFY" not in notes and "SECONDARY" not in notes
        entries[head.group(2)] = fields
    return entries


def surnames(entry: dict) -> list:
    return [a.split(",")[0].strip() if "," in a else a.split()[-1] for a in entry["author"].split(" and ")]


def label(entry: dict) -> str:
    names = surnames(entry)
    who = names[0] if len(names) == 1 else f"{names[0]} & {names[1]}" if len(names) == 2 else f"{names[0]} et al."
    return f"{who}, {entry['year']}"


def initials(first: str) -> str:
    return " ".join(p[0] + "." for p in re.split(r"[\s.]+", first) if p)


def authors(entry: dict) -> str:
    out = []
    for a in entry["author"].split(" and "):
        last, _, first = a.partition(",")
        out.append(f"{last.strip()}, {initials(first)}" if first else a.strip())
    return ", ".join(out)


def reference(key: str, entry: dict, sections: list, page: str) -> str:
    e = {k: html.escape(v) for k, v in entry.items() if isinstance(v, str)}
    venue = e.get("journal") or e.get("booktitle", "")
    arxiv = re.search(r"arXiv:(\S+)", venue)
    detail = ""
    if e.get("volume"):
        detail += f" {e['volume']}" + (f"({e['number']})" if e.get("number") else "")
    if e.get("pages"):
        detail += ("," if detail else "") + (" pp." if not e.get("journal") else "") + f" {e['pages']}"
    if e.get("doi"):
        link = f' <a href="https://doi.org/{e["doi"]}">doi:{e["doi"]}</a>'
    elif arxiv:
        link = f' <a href="https://arxiv.org/abs/{arxiv.group(1)}">arXiv:{arxiv.group(1)}</a>'
    else:
        link = ""
    dagger = "" if entry["verified"] else f' <span class="unverified" title="{UNVERIFIED[page]}">†</span>'
    where = ", ".join(f'<a href="#{sid}">{title}</a>' for sid, title in sections)
    return (f'          <li id="{key}">\n'
            f"            {authors(entry)} ({e['year']}). {e['title']}. <em>{venue}</em>{detail}.{link}{dagger}\n"
            f'            <span class="cited-on">{CITED_IN[page]}: {where}</span>\n'
            f"          </li>")


def render(page: str, bib: dict) -> str:
    text = (ROOT / page).read_text()
    missing = sorted({m.group(2) for m in CITE.finditer(text)} - bib.keys())
    if missing:
        sys.exit(f"{page}: keys not in the bibliography: {missing}")
    text = CITE.sub(lambda m: f"{m.group(1)}({html.escape(label(bib[m.group(2)]), quote=False)}){m.group(4)}", text)
    cited = {}
    for sec in re.finditer(r'<details class="section" id="([\w-]+)">\s*<summary><h2 class="section-title">([^<]+)</h2>(.*?)</details>', text, re.S):
        for m in CITE.finditer(sec.group(3)):
            places = cited.setdefault(m.group(2), [])
            if (sec.group(1), sec.group(2)) not in places:
                places.append((sec.group(1), sec.group(2)))
    order = sorted(cited, key=lambda k: (surnames(bib[k])[0].lower(), bib[k]["year"]))
    items = "\n".join(reference(k, bib[k], cited[k], page) for k in order)
    block = f'<!-- references:start -->\n        <ol class="bibliography">\n{items}\n        </ol>\n        <!-- references:end -->'
    return re.sub(r"<!-- references:start -->.*?<!-- references:end -->", lambda _: block, text, flags=re.S)


def main() -> None:
    bib = parse_bib(Path(sys.argv[1]).read_text())
    for page in PAGES:
        if (ROOT / page).exists():
            (ROOT / page).write_text(render(page, bib))
            print(f"{page}: built")


if __name__ == "__main__":
    main()
