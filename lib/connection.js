'use strict';

const Net = require('net');
const Tls = require('tls');

const Hoek = require('@hapi/hoek');
const HttpParserJs = require('http-parser-js');
const Podium = require('@hapi/podium');

const Timer = require('./timer');


const internals = {
    crlf: Buffer.from('\r\n'),
    events: Podium.validate(['response', 'end'])
};


module.exports = internals.Connection = class {

    constructor(options) {

        this.settings = options;
        this.events = new Podium(internals.events);

        this.counters = {
            requests: 0,
            errors: 0,
            timeouts: 0,
            bytes: 0
        };

        // Timers

        this._timer = null;
        this._wait = null;

        // Prepare buffers

        this._script = this.settings.script.map((request) => {

            if (request.action) {
                return request;
            }

            const start = `${request.method} ${request.path} HTTP/1.1\r\n`;
            const headers = Object.keys(request.headers).map((key) => `${key}: ${request.headers[key]}`).join('\r\n');
            const message = Buffer.from(start + headers + '\r\n\r\n');

            if (!request.body.length) {
                return message;
            }

            return Buffer.concat([message, request.body, internals.crlf]);
        });

        this._queue = this._script.slice();

        // Response state

        this._processing = false;
        this._pending = [];
        this._response = {
            bytes: 0,
            statusCode: null
        };

        // Setup HTTP response parser

        this._parser = this._generateParser();
    }

    connect() {

        this._connection = this.settings.secure ? Tls.connect(this.settings.port, this.settings.hostname, { rejectUnauthorized: false }) : Net.connect(this.settings.port, this.settings.hostname);
        this._connection.on('error', Hoek.ignore);

        this._connection.on('data', (chunk) => {

            this._response.bytes += chunk.length;
            this._parser.execute(chunk);
        });

        this._connection.on('close', (errors) => {

            if (errors) {
                this.counters.errors += this._pending.length;
                this._pending.length = 0;
            }

            this._reset();
        });

        // Requests timeout

        const timeout = () => {

            if (!this._pending.length) {
                return;
            }

            this.counters.timeouts += this._pending.length;
            this._pending.length = 0;

            this._reset();
        };

        this._timer = new Timer.Resettable(timeout, this.settings.timeout);

        // Starts sending requests

        this._step();
    }

    _generateParser() {

        const parser = new HttpParserJs.HTTPParser(HttpParserJs.HTTPParser.RESPONSE);

        parser[HttpParserJs.HTTPParser.kOnHeaders] = Hoek.ignore;
        parser[HttpParserJs.HTTPParser.kOnBody] = Hoek.ignore;

        parser[HttpParserJs.HTTPParser.kOnHeadersComplete] = (headers) => {

            this._response.statusCode = headers.statusCode;
        };

        parser[HttpParserJs.HTTPParser.kOnMessageComplete] = () => {

            const pending = this._pending.shift();
            const end = process.hrtime(pending.start);
            const msec = end[0] * 1e3 + end[1] / 1e6;

            this.counters.bytes += this._response.bytes;
            const stats = {
                statusCode: this._response.statusCode,
                bytes: this._response.bytes,
                msec
            };

            this._response.bytes = 0;
            this._response.statusCode = null;

            this.events.emit('response', stats);
            this._step();
        };

        return parser;
    }

    async _step() {

        if (this._processing ||
            this._pending.length >= this.settings.pipelines) {

            return;
        }

        this._processing = true;

        // Fetch next script item

        const item = this._queue.shift();
        if (!this._queue.length) {
            this._queue = this._script.slice();
        }

        if (Buffer.isBuffer(item)) {

            // Send next request

            ++this.counters.requests;
            this._pending.push({ start: process.hrtime(), buffer: item });

            this._connection.write(item);
            this._timer.reset();
        }
        else {
            switch (item.action) {

                case 'wait':                                    // Script pause
                    this._wait = Timer.wait(item.msec);
                    await this._wait;
                    this._wait = null;
                    break;

                case 'reset':                                   // Connection reset
                    this._reset();
                    break;
            }
        }

        // Process next request

        this._processing = false;
        this._step();
    }

    _destroy() {

        this._timer.clear();

        if (this._wait) {
            this._wait.clear();
            this._wait = null;
        }

        if (this._connection) {
            this._connection.removeAllListeners('data');
            this._connection.removeAllListeners('close');
            this._connection.destroy();
            this._connection = null;
        }
    }

    _reset() {

        for (const item of this._pending) {
            this._queue.unshift(item.buffer);
        }

        this._pending = [];
        this._response.bytes = 0;
        this._response.statusCode = null;

        this._destroy();
        this.connect();
    }

    end() {

        this._parser[HttpParserJs.HTTPParser.kOnMessageComplete] = Hoek.ignore;
        this._destroy();

        this.events.emit('end');
    }
};
