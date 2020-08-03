'use strict';

const Validate = require('@hapi/validate');


const internals = {};


internals.defaults = {
    request: {
        method: 'GET',
        path: '/',
        headers: {},
        body: Buffer.alloc(0)
    }
};


internals.command = Validate.alternatives([
    {
        action: Validate.valid('wait').required(),
        msec: Validate.number().integer().min(1).required()
    },
    {
        action: Validate.valid('reset').required()
    }
]);


internals.request = Validate.object({
    method: Validate.string().valid('GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH').default('GET'),
    path: Validate.string().default('/'),
    headers: Validate.object().default({}),
    body: Validate.alternatives(Validate.binary(), Validate.string()).default('')
});


internals.script = Validate.array()
    .items(internals.request, internals.command)
    .min(1)
    .default([internals.defaults.request]);


exports.options = Validate.object({
    secure: Validate.boolean().default(false),
    port: Validate.number().integer().min(1),
    hostname: Validate.string().default('localhost'),
    script: internals.script,
    duration: Validate.number().integer().min(1).default(10000),
    connections: Validate.number().integer().min(1).default(10),
    pipelines: Validate.number().integer().min(1).default(1),
    timeout: Validate.number().integer().min(100).default(10 * 1000),
    sample: Validate.number().integer().min(100).default(1000),

    percentiles: Validate.array().items(Validate.number().positive()).min(1).default([50, 75, 90, 99, 99.9, 99.99, 99.999])
});
