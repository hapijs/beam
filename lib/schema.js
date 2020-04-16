'use strict';

const Joi = require('@hapi/joi');


const internals = {};


internals.defaults = {
    request: {
        method: 'GET',
        path: '/',
        headers: {},
        body: Buffer.alloc(0)
    }
};


internals.command = Joi.alternatives([
    {
        action: Joi.valid('wait').required(),
        msec: Joi.number().integer().min(1).required()
    },
    {
        action: Joi.valid('reset').required()
    }
]);


internals.request = Joi.object({
    method: Joi.string().valid('GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH').default('GET'),
    path: Joi.string().default('/'),
    headers: Joi.object().default({}),
    body: Joi.alternatives(Joi.binary(), Joi.string()).default('')
});


internals.script = Joi.array()
    .items(internals.request, internals.command)
    .min(1)
    .default([internals.defaults.request]);


exports.options = Joi.object({
    secure: [Joi.boolean().default(false), Joi.object().default(false)],
    port: Joi.number().integer().min(1),
    hostname: Joi.string().default('localhost'),
    script: internals.script,
    duration: Joi.number().integer().min(1).default(10000),
    connections: Joi.number().integer().min(1).default(10),
    pipelines: Joi.number().integer().min(1).default(1),
    timeout: Joi.number().integer().min(100).default(10 * 1000),
    sample: Joi.number().integer().min(100).default(1000),

    percentiles: Joi.array().items(Joi.number().positive()).min(1).default([50, 75, 90, 99, 99.9, 99.99, 99.999])
});
