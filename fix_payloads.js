const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.resolve('d:/cleclo folder/admin/app');

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/{ approve: true }/g, '{ isApproved: true }');
    content = content.replace(/{ suspend: true }/g, '{ suspended: true }');
    content = content.replace(/{ suspend: !vendor.isBlocked }/g, '{ suspended: !vendor.isBlocked }');
    content = content.replace(/{ isBlocked: !user.isBlocked }/g, '{ blocked: !user.isBlocked }');
    content = content.replace(/{ isBlocked: !rider.isBlocked }/g, '{ blocked: !rider.isBlocked }');
    content = content.replace(/{ isBlocked: !r.isBlocked }/g, '{ blocked: !r.isBlocked }');
    content = content.replace(/{ isBlocked:/g, '{ blocked:');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', Math.abs(content.length - original.length), 'chars in', filePath);
    }
  }
});
console.log('Done mapping boolean payloads.');
