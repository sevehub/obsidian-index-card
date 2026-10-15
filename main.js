const { Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder } = require('obsidian');

const DEFAULTS = {
  root: '30_Zettelkasten',
  max: 20,
  template: '{{date}}\n{{ordinal}}\n{{week}}\n\n'
};

function pad(n) {
  return String(n).padStart(2, '0');
}

// The three dates of a day: ISO date, ordinal (day of year / days in year), ISO week date.
function stamps(d) {
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  const doy = Math.round((Date.UTC(y, m, day) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const dow = (d.getDay() + 6) % 7;                         // Monday = 0
  const thu = new Date(Date.UTC(y, m, day + 3 - dow));      // Thursday of this ISO week
  const isoYear = thu.getUTCFullYear();
  const week = Math.floor((thu - Date.UTC(isoYear, 0, 1)) / 864e5 / 7) + 1;
  return {
    date: y + '-' + pad(m + 1) + '-' + pad(day),
    ordinal: doy + '/' + (leap ? 366 : 365),
    week: isoYear + '-W' + pad(week) + '-' + (dow + 1)
  };
}

class IndexCardSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Root folder')
      .setDesc('Folder that contains the node folders N1 to N8.')
      .addText(text => text
        .setPlaceholder(DEFAULTS.root)
        .setValue(this.plugin.settings.root)
        .onChange(async value => {
          this.plugin.settings.root = value.trim().replace(/^\/+|\/+$/g, '') || DEFAULTS.root;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Cards per node')
      .setDesc('Highest card number in a node. The default is 20.')
      .addText(text => text
        .setPlaceholder(String(DEFAULTS.max))
        .setValue(String(this.plugin.settings.max))
        .onChange(async value => {
          const n = parseInt(value, 10);
          if (n >= 1 && n <= 999) {
            this.plugin.settings.max = n;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Note template')
      .setDesc('Text of a new card note. Placeholders: {{date}} 2026-10-14, {{ordinal}} 287/365, {{week}} 2026-W42-3 (the last number is the weekday, 1 for Monday).')
      .addTextArea(area => area
        .setValue(this.plugin.settings.template)
        .onChange(async value => {
          this.plugin.settings.template = value;
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = class IndexCardPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new IndexCardSettingTab(this.app, this));

    this.addCommand({
      id: 'new-card',
      name: 'New card (next free number in this node)',
      callback: () => this.newCard(this.nodeFolder())
    });
    this.addCommand({
      id: 'other-side',
      name: 'Open or create the other side of this card',
      callback: () => this.otherSide()
    });
    this.addRibbonIcon('file-plus', 'New card', () => this.newCard(this.nodeFolder()));
    this.addRibbonIcon('arrow-left-right', 'Other side of this card', () => this.otherSide());

    // Right-click on a node folder, on a card in the file explorer or tab, and inside a card.
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (file instanceof TFolder && this.isNode(file)) {
        menu.addItem(item => item.setTitle('New card').setIcon('file-plus').onClick(() => this.newCard(file)));
      } else if (file instanceof TFile && this.isCard(file)) {
        this.addSideItem(menu, file);
      }
    }));
    this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor, view) => {
      if (view && view.file && this.isCard(view.file)) this.addSideItem(menu, view.file);
    }));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
  }

  saveSettings() {
    return this.saveData(this.settings);
  }

  // The template with the three dates of today filled in.
  render(day) {
    const s = stamps(day || new Date());
    return this.settings.template
      .replace(/\{\{date\}\}/g, s.date)
      .replace(/\{\{ordinal\}\}/g, s.ordinal)
      .replace(/\{\{week\}\}/g, s.week);
  }

  isNode(folder) {
    return !!folder.parent && folder.parent.path === this.settings.root && /^N[1-8]$/.test(folder.name);
  }

  isCard(file) {
    return file.extension === 'md' && !!file.parent && this.isNode(file.parent) && /^N[1-8]-\d+[FR]$/.test(file.basename);
  }

  // N1-3F gives N1-3R and the other way round.
  otherName(file) {
    const m = /^(N[1-8]-\d+)([FR])$/.exec(file.basename);
    return m[1] + (m[2] === 'F' ? 'R' : 'F');
  }

  addSideItem(menu, file) {
    menu.addItem(item => item
      .setTitle('Open ' + this.otherName(file))
      .setIcon('arrow-left-right')
      .onClick(() => this.otherSide(file)));
  }

  // The node folder of the active note, or null (with a notice).
  nodeFolder() {
    const file = this.app.workspace.getActiveFile();
    let dir = file && file.parent;
    while (dir && !this.isNode(dir)) dir = dir.parent;
    if (!dir) new Notice('Open a note inside ' + this.settings.root + '/N1 to N8 first.');
    return dir;
  }

  // Creates N<node>-<lowest free number>F.md and opens it.
  async newCard(folder) {
    if (!folder) return;
    const node = folder.name, vault = this.app.vault, max = this.settings.max;
    for (let c = 1; c <= max; c++) {
      const front = `${folder.path}/${node}-${c}F.md`;
      const back = `${folder.path}/${node}-${c}R.md`;
      if (vault.getAbstractFileByPath(front) || vault.getAbstractFileByPath(back)) continue;
      const file = await vault.create(front, this.render());
      await this.app.workspace.getLeaf(false).openFile(file);
      return;
    }
    new Notice(node + ' has no free card number (1 to ' + max + ').');
  }

  // From N1-3F open N1-3R, and the other way round; the note is created when missing.
  async otherSide(file) {
    file = file || this.app.workspace.getActiveFile();
    const m = file && /^(N[1-8]-\d+)([FR])$/.exec(file.basename);
    if (!m) { new Notice('The active note is not a card, for example N1-3F.'); return; }
    const path = `${file.parent.path}/${m[1]}${m[2] === 'F' ? 'R' : 'F'}.md`;
    let other = this.app.vault.getAbstractFileByPath(path);
    if (!other) other = await this.app.vault.create(path, this.render());
    await this.app.workspace.getLeaf(false).openFile(other);
  }
};





