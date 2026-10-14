# Obsidian Index Card

Creates index card notes named like the printed reference of the [companion paper notebook](https://a.co/d/0cKYW36C), for example `N1-3F` (front) and `N1-3R` (reverse), so that new notes never start as "Untitled". Each new note starts with three dates: ISO date, ordinal date and ISO week date.

The plugin expects eight node folders, `N1` to `N8`, inside a root folder (default `30_Zettelkasten`), with cards numbered 1 to 20 by default. Both defaults can be changed in the settings.

## Commands

- **New card (next free number in this node)**: creates the lowest free card of the node of the active note, for example `N1-3F.md`, and opens it. Also available as a ribbon icon and in the right-click menu of the `N1` to `N8` folders.
- **Open or create the other side of this card**: from `N1-3F` opens `N1-3R`, and the other way round. The note is created when it is missing.

Assign hotkeys under Settings > Hotkeys.

## Template

A new note starts with the dates of the day it is created, one per line:

```
2026-10-14
287/365
2026-W42-3
```

- ISO date: `YYYY-MM-DD`.
- Ordinal date: the day of the year over the days in that year (365 or 366).
- ISO week date: ISO year, week and weekday, with 1 for Monday. Around New Year the ISO year can differ from the calendar year: 1 January 2027 is `2026-W53-5`.

## Settings

Settings > Index Card:

- **Root folder**: the folder that contains the node folders `N1` to `N8`. Default `30_Zettelkasten`.
- **Cards per node**: the highest card number in a node. Default `20`.
- **Note template**: the text of a new card note. Placeholders: `{{date}}`, `{{ordinal}}` and `{{week}}`. The default puts the three dates on separate lines, followed by a blank line.

## Install

Clone the repository into the plugins folder of the vault. The folder must be named `index-card`, like the plugin id:

```
cd <vault>/.obsidian/plugins
git clone https://github.com/sevehub/obsidian-index-card index-card
```

Then enable **Index Card** under Settings > Community plugins (Restricted mode must be off).

Alternatively, download `main.js` and `manifest.json` from the latest release into `<vault>/.obsidian/plugins/index-card/`.

## Status

Version 0.1.1. Written without a build step (plain CommonJS). Not yet tested at scale.

## License

MIT


