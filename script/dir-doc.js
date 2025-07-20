var fs = require('fs');
var path = require('path');

function readDir(dir) {
    var res = [];
    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
        var filePath = path.join(dir, file);
        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            const children = readDir(filePath);
            if (children.length === 0) {
                res.push({
                    title: file,
                    path: filePath,
                    children: []
                });
            } else {
                res.push({
                    title: file,
                    path: filePath,
                    children: children
                });
            }
        } else {
            res.push({
                title: file,
                path: filePath,
                children: []
            });
        }
    });
    return res;
}

function generateMarkdown(tree, level = 0) {
    let md = '';
    tree.forEach(node => {
        let relativePath = path.relative(path.resolve(__dirname, '../doc'), node.path).replace(/\\/g, '/');
        relativePath = relativePath.replace(/ /g, '%20');
        if (node.children.length === 0) {
            md += '  '.repeat(level) + `- [${node.title}](${relativePath})\n`;
        } else {
            md += '  '.repeat(level) + `- ${node.title}\n`;
            md += generateMarkdown(node.children, level + 1);
        }
    });
    return md;
}

function main() {
    const docDir = path.resolve(__dirname, '../doc');
    const tree = readDir(docDir);
    const markdown = '# 目录结构\n\n' + generateMarkdown(tree);
    const readmePath = path.join(docDir, 'README.md');
    fs.writeFileSync(readmePath, markdown, 'utf-8');
    console.log('目录树已生成并写入 ' + readmePath);
}

main();