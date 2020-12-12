const glob = require("glob");
const fs = require("fs");

module.exports = function inventoryClasses(addon) {
  const { ignoreClasses } = addon.readConfig();
  const pathForJsFiles = getPathForJsFiles(addon);

  const jsFiles = glob.sync(`${pathForJsFiles}/**/*.js`);
  const classNames = jsFiles
    .map((file) => {
      const content = fs.readFileSync(file, { encoding: "utf-8" });
      return getClassNameFromFile(content);
    })
    .filter((name) => name && !ignoreClasses.includes(name));

  return classNames;
};

function getPathForJsFiles(addon) {
  let isSelf = addon.parent.name() === addon.name;
  let parentIsAddon = addon.parent.isEmberCLIAddon();
  if (isSelf) {
    return "tests/dummy/app";
  } else if (parentIsAddon) {
    return `${addon.parent.root}/addon`;
  } else {
    let appTree = addon.app.trees.app;
    return appTree._directoryPath || appTree;
  }
}

function getClassNameFromFile(fileContents) {
  const _export_default_class = "export default class ";
  const classNameIndex = fileContents.indexOf(_export_default_class);
  if (classNameIndex === -1) return false;

  const classNameStart = classNameIndex + _export_default_class.length;
  const classNameLength = fileContents.slice(classNameStart).indexOf(" ");
  return fileContents.slice(classNameStart, classNameStart + classNameLength);
}
