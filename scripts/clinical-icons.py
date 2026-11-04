"""One decorative clinical icon family: 24-unit grid, rounded 1.5-unit strokes."""
ICONS = {
    'below': '<circle cx="12" cy="12" r="9"/><path d="M12 5v2M5 12h2M17 12h2M12 12l-4 3"/>',
    'gi': '<path d="M9 3h4v1c0 2 0 4 2 3 3-2 6 1 6 5 0 5-4 9-10 9-5 0-8-4-6-9 1-2 4-2 4-4V3Z"/><path d="M16 11c2 3 0 6-3 6"/>',
    'cardiac': '<path d="M20.3 5.7a4.8 4.8 0 0 0-6.8 0L12 7.2l-1.5-1.5a4.8 4.8 0 0 0-6.8 6.8L12 21l8.3-8.5a4.8 4.8 0 0 0 0-6.8Z"/><path d="M3 12h4l2-4 4 9 2-5h6"/>',
    'neuro': '<path d="M12 4c-2-3-6-1-6 2-3 0-4 4-2 6-2 3 0 6 3 6 0 3 3 4 5 2 2 2 5 1 5-2 3 0 5-3 3-6 2-2 1-6-2-6 0-3-4-5-6-2Z"/><path d="M12 4v16M7 8c2 0 2 2 2 3M6 15c2 0 3-1 3-3M17 8c-2 0-2 2-2 3M18 15c-2 0-3-1-3-3"/>',
    'lethal': '<path d="M10.3 4a2 2 0 0 1 3.4 0l8 14a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3l8-14Z"/><path d="M12 8v5M12 17h.01"/>',
}

def render_icon(key):
    return f'<svg class="clinical-icon" data-clinical-icon="{key}" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{ICONS[key]}</svg>'
