'use strict';

const internals = {};


exports.Resettable = class {

    constructor(handler, timeout) {

        this._handler = handler;
        this._timeout = timeout;
        this._reset = null;

        this._start();
    }

    _start() {

        const method = () => {

            this._timer = null;

            if (this._reset) {
                const next = this._timeout - (exports.Resettable.now() - this._reset);
                this._reset = null;

                if (next > 0) {
                    this._timer = setTimeout(method, next);
                    return;
                }
            }

            this._handler();
        };

        this._timer = setTimeout(method, this._timeout);
    }

    reset() {

        if (this._timer) {
            this._reset = exports.Resettable.now();
        }
        else {
            this._start();
        }
    }

    clear() {

        clearTimeout(this._timer);
        this._timer = null;
    }

    static now() {

        const time = process.hrtime();
        return Math.floor(time[0] * 1000 + time[1] / 1000000);
    }
};


exports.wait = function (timeout) {

    let timer;
    const promise = new Promise((resolve) => {

        timer = setTimeout(resolve, timeout);
    });

    promise.clear = () => clearTimeout(timer);
    return promise;
};
