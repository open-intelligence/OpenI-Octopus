'use strict';
const path = require('path');

module.exports = app => {
  const componentPaths = app.loader.getLoadUnitsWithoutPlugins().map(unit => path.join(unit.path, 'app/component'));;
  app.loader.loadToApp(componentPaths, 'component', {
    override: false,
    call: true,
    match: ['*/index.(js|ts)'],
    caseStyle:function(filepath){
      const properties = filepath.substring(0, filepath.lastIndexOf('.')).split('/');
      let fullProperties = properties.map(property => {
        if (!/^[a-z][a-z0-9_-]*$/i.test(property)) {
          throw new Error(`${property} is not match 'a-z0-9_-' in ${filepath}`);
        }

        return property.replace(/[_-][a-z]/ig, s => s.substring(1).toUpperCase());
      });
      fullProperties.pop();
      return fullProperties
    }
  });
};
