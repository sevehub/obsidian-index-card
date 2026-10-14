const { Plugin, Notice, TFolder } = require('obsidian');

const ROOT = '30_Zettelkasten';
const MAX = 20;

module.exports = class IndexCardPlugin extends Plugin {
  onload() {
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
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (file instanceof TFolder && this.isNode(file)) {
        menu.addItem(item => item.setTitle('New card').setIcon('file-plus').onClick(() => this.newCard(file)));
      }
    }));
  }

  isNode(folder) {
    return !!folder.parent && folder.parent.path === ROOT && /^N[1-8]$/.test(folder.name);
  }

  // The node folder of the active note, or null (with a notice).
  nodeFolder() {
    const file = this.app.workspace.getActiveFile();
    let dir = file && file.parent;
    while (dir && !this.isNode(dir)) dir = dir.parent;
    if (!dir) new Notice('Open a note inside ' + ROOT + '/N1 to N8 first.');
    return dir;
  }

  // Creates N<node>-<lowest free number>F.md and opens it.
  async newCard(folder) {
    if (!folder) return;
    const node = folder.name, vault = this.app.vault;
    for (let c = 1; c <= MAX; c++) {
      const front = `${folder.path}/${node}-${c}F.md`;
      const back = `${folder.path}/${node}-${c}R.md`;
      if (vault.getAbstractFileByPath(front) || vault.getAbstractFileByPath(back)) continue;
      const file = await vault.create(front, '');
      await this.app.workspace.getLeaf(false).openFile(file);
      return;
    }
    new Notice(node + ' has no free card number (1 to ' + MAX + ').');
  }

  // From N1-3F open N1-3R, and the other way round; the note is created when missing.
  async otherSide() {
    const file = this.app.workspace.getActiveFile();
    const m = file && /^(N[1-8]-\d+)([FR])$/.exec(file.basename);
    if (!m) { new Notice('The active note is not a card, for example N1-3F.'); return; }
    const path = `${file.parent.path}/${m[1]}${m[2] === 'F' ? 'R' : 'F'}.md`;
    let other = this.app.vault.getAbstractFileByPath(path);
    if (!other) other = await this.app.vault.create(path, '');
    await this.app.workspace.getLeaf(false).openFile(other);
  }
};
