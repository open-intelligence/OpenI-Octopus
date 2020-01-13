'use strict';

const path = require('path');
const sleep = require('mz-modules/sleep');
const AUTH_RETRIES = Symbol('authenticateRetries');

module.exports = app => {
  const defaultConfig = {
    delegate: 'model',
    baseDir: 'model',
    logging(...args) {
      // if benchmark enabled, log used
      const used = typeof args[1] === 'number' ? `(${args[1]}ms)` : '';
      app.logger.info('[egg-sequelize]%s %s', used, args[0]);
    },
    host: 'localhost',
    port: 3306,
    username: 'root',
    benchmark: true,
    define: {
      freezeTableName: false,
      underscored: true,
    },
  };

  const config = app.config.sequelize;
  // support customize sequelize
  app.Sequelize = config.Sequelize || require('sequelize');

  const databases = [];
  if (!config.datasources) {
    databases.push(loadDatabase(Object.assign({}, defaultConfig, config)));
  } else {
    config.datasources.forEach(datasource => {
      databases.push(loadDatabase(Object.assign({}, defaultConfig, datasource)));
    });
  }

  app.beforeStart(async () => {
    await Promise.all(databases.map(database => authenticate(database)));
  });

  /**
   * @override
   * load databse to app[config.delegate
   * @param {Object} config config for load
   *   - delegate: load model to app[delegate]
   *   - baeDir: where model located
   *   - other sequelize configures(databasem username, password, etc...)
   * @return {Object} sequelize instance
   */
  function loadDatabase(config = {}) {
    if (typeof config.ignore === 'string' || Array.isArray(config.ignore)) {
      app.deprecate(`[egg-sequelize] if you want to exclude ${config.ignore} when load models, please set to config.sequelize.exclude instead of config.sequelize.ignore`);
      config.exclude = config.ignore;
      delete config.ignore;
    }

    const sequelize = new app.Sequelize(config.database, config.username, config.password, config);

    const delegate = config.delegate.split('.');
    const len = delegate.length;

    let model = app;
    let context = app.context;
    for (let i = 0; i < len - 1; i++) {
      model = model[delegate[i]] = model[delegate[i]] || {};
      context = context[delegate[i]] = context[delegate[i]] || {};
    }

    if (model[delegate[len - 1]]) {
      throw new Error(`[egg-sequelize] app[${config.delegate}] is already defined`);
    }

    Object.defineProperty(model, delegate[len - 1], {
      value: sequelize,
      writable: false,
      configurable: true,
    });

    const DELEGATE = Symbol(`context#sequelize_${config.delegate}`);
    Object.defineProperty(context, delegate[len - 1], {
      get() {
        // context.model is different with app.model
        // so we can change the properties of ctx.model.xxx
        if (!this[DELEGATE]) this[DELEGATE] = Object.create(model[delegate[len - 1]]);
        return this[DELEGATE];
      },
      configurable: true,
    });

    // override start
    // const modelDir = path.join(app.baseDir, 'app', config.baseDir);
    //
    // const models = [];
    // const target = Symbol(config.delegate);
    //
    // app.loader.loadToApp(modelDir, target, {
    //   caseStyle: 'upper',
    //   ignore: config.exclude,
    //   filter(model) {
    //     if (!model || !model.sequelize) return false;
    //     models.push(model);
    //     return true;
    //   },
    //   initializer(factory) {
    //     if (typeof factory === 'function') {
    //       return factory(app, sequelize);
    //     }
    //   },
    // });

    // override
    const modelDirs = app.loader
      .getLoadUnitsWithoutPlugins()
      .map(unit => path.join(unit.path, 'app', config.baseDir));

    // override
    let models = [];
    const target = Symbol(config.delegate);

    app.loader.loadToApp(modelDirs, target, {
      caseStyle: 'upper',
      ignore: config.exclude,
      filter(model) {
        if (!model || !model.sequelize) return false;
        // override
        // if called "define" multiple times for the same modelName
        // https://github.com/sequelize/sequelize/blob/149e0c76d444eddfda7963a27b701ad7aa855f78/lib/model.js#L970
        if ((model.sequelize.modelManager.models.length -1) != models.length){
          models = models.filter(m => m.name !== model.name);
        }
        models.push(model);
        return true;
      },
      initializer(factory) {
        if (typeof factory === 'function') {
          return factory(app, sequelize);
        }
      },
    });
    // override end

    Object.assign(model[delegate[len - 1]], app[target]);

    models.forEach(model => {
      typeof model.associate === 'function' && model.associate();
    });

    return model[delegate[len - 1]];
  }

  /**
   * Authenticate to test Database connection.
   *
   * This method will retry 3 times when database connect fail in temporary, to avoid Egg start failed.
   * @param {Application} database instance of sequelize
   */
  async function authenticate(database) {
    database[AUTH_RETRIES] = database[AUTH_RETRIES] || 0;

    try {
      await database.authenticate();
    } catch (e) {
      if (e.name !== 'SequelizeConnectionRefusedError') throw e;
      if (app.model[AUTH_RETRIES] >= 3) throw e;

      // sleep 2s to retry, max 3 times
      database[AUTH_RETRIES] += 1;
      app.logger.warn(`Sequelize Error: ${e.message}, sleep 2 seconds to retry...`);
      await sleep(2000);
      await authenticate(database);
    }
  }
};
