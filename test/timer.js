'use strict';

const Code = require('@hapi/code');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');
const Teamwork = require('@hapi/teamwork');

const Timer = require('../lib/timer');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Timer', () => {

    describe('reset()', () => {

        it('restarts timer after expires', async () => {

            let x = 0;
            const timer = new Timer.Resettable(() => ++x, 50);

            await Hoek.wait(60);
            expect(x).to.equal(1);

            timer.reset();

            await Hoek.wait(60);
            expect(x).to.equal(2);
        });

        it('waits for time remaining after reset', async () => {

            const team = new Teamwork.Team();
            const timer = new Timer.Resettable(() => team.attend(), 50);

            await Hoek.wait(20);
            const now = Date.now();
            timer.reset();

            await team.work;
            expect(Date.now() - now).to.be.below(60);
        });
    });
});
