const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let res = [];
    fs.readdirSync(dir).forEach(f => {
        let fPath = path.join(dir, f);
        if (fs.statSync(fPath).isDirectory()) {
            res.push(...getFiles(fPath));
        } else if (fPath.match(/\.(js|jsx)$/)) {
            res.push(fPath);
        }
    });
    return res;
}

const files = getFiles('src');
let deps = new Set();
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    // regex for imports: from "package-name" or from 'package-name'
    const matches = content.matchAll(/from\s+['"]([a-z@][^'"]+)['"]/gi);
    for (const m of matches) {
        let dep = m[1];
        if (!dep.startsWith('@/') && !dep.startsWith('./') && !dep.startsWith('../')) {
            // keep only the top level package name, e.g. @radix-ui/react-toast -> @radix-ui/react-toast, lucide-react/icons -> lucide-react
            if(dep.startsWith('@')) {
                dep = dep.split('/').slice(0,2).join('/');
            } else {
                dep = dep.split('/')[0];
            }
            deps.add(dep);
        }
    }
});

// filter out node built-ins or react things we already have
const pkg = JSON.parse(fs.readFileSync('package.json'));
const currentDeps = { ...pkg.dependencies, ...pkg.devDependencies };
const missing = Array.from(deps).filter(d => !currentDeps[d]);

console.log(missing.join(' '));
