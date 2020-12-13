const glob = require("glob");
const fs = require("fs");

const { parse } = require("@babel/parser");
const { visit } = require("ast-types");

module.exports = function inventoryClasses(addon) {
  const pathForJsFiles = getPathForJsFiles(addon);

  const jsFiles = glob.sync(`${pathForJsFiles}/**/*.{js,ts}`);
  const classNames = jsFiles
    .map((file) => {
      const content = fs.readFileSync(file, { encoding: "utf-8" });
      return getClassNamesFromFile(content);
    })
    .reduce((acc, val) => acc.concat(val), []); // flatten

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

function getClassNamesFromFile(fileContents) {
  let classNames = [];
  let parserOptions = {
    sourceType: "module",
    plugins: [
      "classProperties",
      "asyncGenerators",
      "dynamicImport",
      "decorators-legacy",
      "classPrivateProperties",
      "classPrivateMethods",
      "nullishCoalescingOperator",
      "optionalChaining",
      "typescript",
      "objectRestSpread",
    ],
  };
  let ast = parse(fileContents, parserOptions);
  visit(ast, {
    visitClassDeclaration({ node }) {
      if (node.id && node.id.name) {
        classNames.push(node.id.name);
      }
      return false; // do not traverse sub-tree
    },
  });
  return classNames;
}
