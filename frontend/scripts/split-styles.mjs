import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const sourcePath = path.resolve('src/App.css');
const source = fs.readFileSync(sourcePath, 'utf8');
const headers = [...source.matchAll(/\/\* ===== (.*?) ===== \*\//g)];
const sections = new Map();

for (let index = 0; index < headers.length; index += 1) {
  const start = headers[index].index + headers[index][0].length;
  const end = headers[index + 1]?.index ?? source.length;
  sections.set(headers[index][1], source.slice(start, end));
}

const targets = {
  'components/Navbar/NavbarStyles.module.css': { root: '.root', owner: 'navbar', sections: ['NAVBAR', 'RESPONSIVE'] },
  'components/Footer/FooterStyles.module.css': { root: '.root', owner: 'footer', sections: ['FOOTER', 'RESPONSIVE'] },
  'components/RoomModal/RoomModalStyles.module.css': { root: '.root', owner: 'modal-overlay', sections: ['ROOM MODAL', 'LOADING', 'RESPONSIVE'] },
  'pages/Home/HomeStyles.module.css': { root: '.root', owner: 'home-page', sections: ['HERO', 'STATS', 'AMENITIES', 'TESTIMONIALS', 'CTA', 'RESPONSIVE'] },
  'pages/Rooms/RoomsStyles.module.css': { root: '.root', owner: 'rooms-page', sections: ['ROOM CARDS', 'FILTERS', 'ROOMS PAGE', 'RESPONSIVE'] },
  'pages/Login/LoginStyles.module.css': { root: '.root', owner: 'auth-page', sections: ['AUTH PAGES', 'LOADING', 'RESPONSIVE'] },
  'pages/Register/RegisterStyles.module.css': { root: '.root', owner: 'auth-page', sections: ['AUTH PAGES', 'LOADING', 'RESPONSIVE'] },
  'pages/UserDashboard/UserDashboardStyles.module.css': { root: '.root', owner: 'dashboard-page', sections: ['DASHBOARD', 'TABLES', 'PROFILE', 'PAYMENT', 'EMPTY STATE', 'LOADING', 'RESPONSIVE'] },
  'pages/AdminDashboard/AdminDashboardStyles.module.css': { root: '.root', owner: 'admin-page', sections: ['ADMIN', 'TABLES', 'EMPTY STATE', 'LOADING', 'RESPONSIVE'] },
  'pages/NotFound/NotFoundStyles.module.css': { root: '.root', owner: 'not-found-page', sections: ['NOT FOUND'] },
};

function scopeRules(node, rootSelector, ownerClass) {
  for (const child of [...(node.nodes ?? [])]) {
    if (child.type === 'rule') {
      child.selector = child.selectors
        .map((selector) => {
          const globalSelector = selector.replace(/\.([\w-]+)/g, ':global(.$1)');
          if (selector.startsWith(`.${ownerClass}`)) {
            return globalSelector.replace(`:global(.${ownerClass})`, `${rootSelector}:global(.${ownerClass})`);
          }
          return `${rootSelector} ${globalSelector}`;
        })
        .join(', ');
    } else if (child.nodes) {
      scopeRules(child, rootSelector, ownerClass);
    }
  }
}

const outputs = {};
for (const [relativePath, target] of Object.entries(targets)) {
  const stylesheet = postcss.parse(`${target.root} { }\n`);
  for (const section of target.sections) {
    const content = sections.get(section);
    if (!content) continue;
    const fragment = postcss.parse(content);
    scopeRules(fragment, target.root, target.owner);
    stylesheet.append(fragment.nodes);
  }

  outputs[relativePath] = stylesheet.toString();
}

console.log(JSON.stringify(outputs));
