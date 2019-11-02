'use strict';

const HdrHistogram = require('hdr-histogram-js');
const Hoek = require('@hapi/hoek');
const Joi = require('@hapi/joi');
const Podium = require('@hapi/podium');
const Teamwork = require('@hapi/teamwork');

const Connection = require('./connection');
const Schema = require('./schema');


const internals = {};


module.exports = internals.Beam = class {

    constructor(options = {}) {

        this.settings = Joi.attempt(Hoek.clone(options), Schema.options);
        this.settings.port = this.settings.port || (this.settings.secure ? 443 : 80);

        this.events = new Podium(['progress']);

        this._prepare();
    }

    _prepare() {

        const host = `${this.settings.hostname}:${this.settings.port}`;

        for (const request of this.settings.script) {

            if (request.action) {
                continue;
            }

            // Normalize payload

            if (typeof request.body === 'string') {
                request.body = Buffer.from(request.body);
            }

            // Normalize header names (lowercase)

            const headerNames = Object.keys(request.headers);
            const headers = {};
            for (const name of headerNames) {
                headers[name.toLowerCase()] = request.headers[name];
            }

            if (request.body.length) {
                headers['content-length'] = request.body.length.toString();
            }

            headers.host = headers.host || host;
            headers.connection = headers.connection || 'keep-alive';
            request.headers = headers;
        }
    }

    execute() {

        // Create connections

        this._initialize();
        this._connect();

        // Duration timer

        const start = Date.now();
        const timer = setTimeout(() => this.stop(), this.settings.duration);

        // Sample timer

        const team = new Teamwork();

        const tick = (percent) => {

            if (this.events.hasListeners('progress')) {
                const rps = this._responses.maxValue / this.settings.sample * 1000;
                this.events.emit('progress', { percent, rps });
            }
        };

        const sample = () => {

            this._responses.recordValue(this._counters.responses);
            this._throughput.recordValue(this._counters.bytes);
            this._counters.responses = 0;
            this._counters.bytes = 0;

            if (!this._stop) {
                tick((Date.now() - start) / this.settings.duration);
                return;
            }

            tick(1);

            clearTimeout(timer);
            clearInterval(interval);
            for (const connection of this._connections) {
                connection.end();
            }

            team.attend(this._results());
        };

        const interval = setInterval(sample, this.settings.sample);

        return team.work;
    }

    _initialize() {

        this._latencies = HdrHistogram.build({
            bitBucketSize: 64,
            highestTrackableValue: 10000,
            numberOfSignificantValueDigits: 5
        });

        this._responses = HdrHistogram.build({
            bitBucketSize: 64,
            highestTrackableValue: 1000000,
            numberOfSignificantValueDigits: 3
        });

        this._throughput = HdrHistogram.build({
            bitBucketSize: 64,
            highestTrackableValue: 100000000000,
            numberOfSignificantValueDigits: 1
        });

        this._counters = {

            // Per sample

            responses: 0,
            bytes: 0,

            // Entire session

            statusCodes: {}
        };

        this._startTime = Date.now();
        this._stop = false;
    }

    _connect() {

        const connections = [];
        let count = this.settings.connections;

        const onResponse = ({ statusCode, bytes, msec }) => {

            this._counters.statusCodes[statusCode] = this._counters.statusCodes[statusCode] || 0;
            this._counters.statusCodes[statusCode] += 1;

            ++this._counters.responses;
            this._counters.bytes += bytes;
            this._latencies.recordValue(msec);
        };

        const onEnd = () => {

            --count;
            if (!count) {
                this._finishTime = Date.now();
                this.stop();
            }
        };

        for (let i = 0; i < count; ++i) {
            const connection = new Connection(this.settings);
            connection.events.on('response', onResponse);
            connection.events.on('end', onEnd);
            connections.push(connection);
        }

        for (const connection of connections) {
            connection.connect();
        }

        this._connections = connections;
    }

    stop() {

        this._stop = true;
    }

    _results() {

        // Collect connections counters

        let bytes = 0;
        let errors = 0;
        let requests = 0;
        let timeouts = 0;

        for (const connection of this._connections) {
            bytes += connection.counters.bytes;
            errors += connection.counters.errors;
            requests += connection.counters.requests;
            timeouts += connection.counters.timeouts;
        }

        // Prepare results

        const result = {
            settings: this.settings,
            duration: this._finishTime - this._startTime,
            start: this._startTime,
            finish: this._finishTime,

            requests: this._histogram(this._responses),
            latency: this._histogram(this._latencies, { percentiles: true }),
            throughput: this._histogram(this._throughput),

            totals: {
                bytes,
                errors,
                requests,
                timeouts,
                codes: this._counters.statusCodes
            }
        };

        for (const key of ['requests', 'latency', 'throughput']) {
            if (result[key].min === Number.MAX_SAFE_INTEGER) {
                result[key].min = 0;
            }
        }

        return result;
    }

    _histogram(hist, options = {}) {

        const result = {
            mean: internals.round(hist.getMean(), 2),
            stddev: internals.round(hist.getStdDeviation(), 2),
            min: hist.minNonZeroValue,
            max: hist.maxValue
        };

        if (options.percentiles) {
            result.percentiles = {};
            for (const perc of this.settings.percentiles) {
                result.percentiles[perc] = hist.getValueAtPercentile(perc);
            }
        }

        return result;
    }
};


internals.round = function (value, precision) {

    const digits = Math.pow(10, precision);
    return Math.round(value * digits) / digits;
};
