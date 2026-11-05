"""Canonical visible terminology after generation; preserve identifiers and math."""
from html.parser import HTMLParser
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]

def terminology(text):
    def word(match):
        original = match[0]
        replacement = 'additives' if original.lower().endswith('s') else 'additive'
        return replacement.upper() if original.isupper() else replacement.capitalize() if original[0].isupper() else replacement
    return re.sub(r'\bstocks?\b', word, text, flags=re.I).replace('Additive is the vial concentration', 'Additive concentration is the vial concentration').replace('Edit additives', 'Edit additive concentrations')

class VisibleTerms(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.lines = [0]
        for match in re.finditer('\n', source): self.lines.append(match.end())
        self.edits = []
        self.skip = 0
        self.feed(source)
    def source_offset(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
        raw = self.get_starttag_text()
        def attribute(match):
            return match[1] + match[2] + terminology(match[3]) + match[2]
        updated = re.sub(r'((?:aria-label|title|placeholder)\s*=\s*)([\x22\x27])(.*?)\2', attribute, raw, flags=re.S)
        if updated != raw: self.edits.append((self.source_offset(), self.source_offset() + len(raw), updated))
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip -= 1
    def handle_data(self, data):
        if self.skip: return
        updated = terminology(data)
        if updated != data: self.edits.append((self.source_offset(), self.source_offset() + len(data), updated))
    def render(self):
        result = self.source
        for start, end, updated in sorted(self.edits, reverse=True): result = result[:start] + updated + result[end:]
        return re.sub(r'[ \t]+\n', '\n', result)

if __name__ in ('__main__', '<run_path>'):
    for page in (ROOT / 'dist').glob('*.html'):
        source = page.read_text()
        page.write_text(VisibleTerms(source).render())
