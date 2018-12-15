// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies
// const util = require('util');
const winston = require('winston');
// const config = require('./index');
const launcherConfig = require('./launcher');
const logger = require('./logger');


const LogFormatter = function (options) {
    const timestamp = options.timestamp();
    const level = options.level.toUpperCase();
    const message = options.message || '';
    let module = 'default';
    if (options.meta && options.meta.module) {
        module = options.meta.module;
    }
    const formatted = `[${timestamp}] [${level}] ${module} - `;
    if (options.colorize) {
        const colorStr = winston.config.colorize(options.level, formatted);
        return `${colorStr}${message}`;
    }
    return `${formatted}${message}`;
};

const transportConsole = new winston.transports.Console({
    json: false,
    prettyPrint:true,
    colorize: true,
    level:'debug',
    timestamp: () => new Date().toISOString(),
    formatter: LogFormatter,
});

const debugTransportFile = new winston.transports.File({
    name: 'full',
    filename: `${launcherConfig.hdfsUri}/logs/debug.log`,
    json: true,
    level:'debug',
    maxsize: 1024 * 1024 * 10, // 10MB
    maxFiles: 10,
    zippedArchive: true
});

const operationTransportFile = new winston.transports.File({
    name: 'service',
    filename: './operation.log',
    json: true,
    level:'debug',
    maxsize: 512 ,
    maxFiles: 2,
    zippedArchive: true
});

winston.loggers.add('operation', {
    transports: [
        transportConsole,
        operationTransportFile
    ],
});

const operationLog = winston.loggers.get('operation');

const getOperationLogger = (module) => {
    return {
        info: (...args) => {
        const meta = { module };
        const fullParams = args.concat(meta);
        operationLog.info.apply(operationLog, fullParams);
    },
    warn: (...args) => {
        const meta = { module };
        const fullParams = args.concat(meta);
        operationLog.warn.apply(operationLog, fullParams);
    },
    error: (...args) => {
        const meta = { module };
        const fullParams = args.concat(meta);
        operationLog.error.apply(operationLog, fullParams);
    }
};
};

// module exports
module.exports = getOperationLogger;
