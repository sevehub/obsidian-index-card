# Obsidian Index Card

Creates index card notes named like the printed reference of the companion paper notebook: https://a.co/d/0cKYW36C . For example `N1-3F` (front) and `N1-3R` (reverse), so that new notes never start as "Untitled".

The plugin expects this layout: `30_Zettelkasten/N1` to `30_Zettelkasten/N8`, eight node folders with cards numbered 1 to 20.

## Commands

- **New card (next free number in this node)**: creates the lowest free card of the node of the active note, for example `N1-3F.md`, and opens it. Also available as a ribbon icon and in the right-click menu of the `N1` to `N8` folders.
- **Open or create the other side of this card**: from `N1-3F` opens `N1-3R`, and the other way round. The note is created when it is missing.

Assign hotkeys under Settings > Hotkeys.

## Install

Clone the repository into `<vault>/.obsidian/plugins/`, then enable **Index Card** under Settings > Community plugins (Restricted mode must be off).

## Settings in the code

The root folder and the number of cards per node are constants at the top of `main.js` (`ROOT = '30_Zettelkasten'`, `MAX = 20`).

## Status

Version 0.1.0. Written without a build step (plain CommonJS). Not yet tested at scale.

## License

MIT
