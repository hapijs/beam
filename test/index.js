'use strict';

const Beam = require('../');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Beam', () => {

    it('defaults to port 80 (http)', () => {

        const beam = new Beam();
        expect(beam.settings.port).to.equal(80);
    });

    it('defaults to port 443 (https)', () => {

        const beam = new Beam({ secure: true });
        expect(beam.settings.port).to.equal(443);
    });

    describe('execute()', () => {

        it('measures server performance', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000 });
            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('handles server disconnects', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, h) => {

                    request.raw.req.socket.end();
                    return h.abandon;
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000 });
            const result = await beam.execute();
            expect(result.requests.max).to.equal(0);

            await server.stop();
        });

        it('measures POST', async () => {

            const server = Hapi.server();

            server.route({
                method: 'POST',
                path: '/',
                handler: async (request) => {

                    await Hoek.wait(110);
                    return null;
                }
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                script: [
                    {
                        method: 'POST'
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(9000, 12000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('measures POST with payload', async () => {

            const server = Hapi.server();

            server.route({
                method: 'POST',
                path: '/',
                handler: async (request) => {

                    await Hoek.wait(110);
                    expect(request.payload).to.equal('hello');
                    return request.payload;
                }
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                script: [
                    {
                        method: 'POST',
                        body: 'hello',
                        headers: {
                            'Content-Type': 'text/plain'
                        }
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('closes connection after each request', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                script: [
                    {
                        headers: {
                            Connection: 'close'
                        }
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('resets connection after each request', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                script: [
                    {
                        path: '/'
                    },
                    {
                        action: 'reset'
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('sets custom host header', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async (request) => {

                    await Hoek.wait(110);
                    expect(request.headers.host).to.equal('example.com:1234');
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                script: [
                    {
                        headers: {
                            host: 'example.com:1234'
                        }
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('measures server performance (2 routes)', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/1',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            server.route({
                method: 'GET',
                path: '/2',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                script: [
                    {
                        path: '/1'
                    },
                    {
                        path: '/2'
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('measures server performance (wait command)', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/1',
                handler: () => null
            });

            server.route({
                method: 'GET',
                path: '/2',
                handler: () => null
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                timeout: 100,
                connections: 1,
                script: [
                    {
                        path: '/1'
                    },
                    {
                        action: 'wait',
                        msec: 500
                    },
                    {
                        path: '/2'
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.equal(3);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('measures server performance (wait command with pipelines)', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/1',
                handler: () => null
            });

            await server.start();

            const beam = new Beam({
                port: server.info.port,
                duration: 1000,
                connections: 1,
                pipelines: 5,
                script: [
                    {
                        path: '/1'
                    },
                    {
                        path: '/1'
                    },
                    {
                        path: '/1'
                    },
                    {
                        path: '/1'
                    },
                    {
                        path: '/1'
                    },
                    {
                        action: 'wait',
                        msec: 500
                    }
                ]
            });

            const result = await beam.execute();
            expect(result.requests.max).to.equal(10);
            expect(result.duration).to.be.about(1000, 50);

            await server.stop();
        });

        it('tracks progress', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000, sample: 100 });

            const progress = [];
            beam.events.on('progress', (update) => progress.push(update));

            const result = await beam.execute();
            expect(result.requests.max).to.equal(10);

            for (const tick of progress) {
                tick.percent = Math.floor(tick.percent * 10) / 10;
            }

            expect(progress).to.equal([
                { percent: 0.1, rps: 0 },
                { percent: 0.2, rps: 100 },
                { percent: 0.3, rps: 100 },
                { percent: 0.4, rps: 100 },
                { percent: 0.5, rps: 100 },
                { percent: 0.6, rps: 100 },
                { percent: 0.7, rps: 100 },
                { percent: 0.8, rps: 100 },
                { percent: 0.9, rps: 100 },
                { percent: 1, rps: 100 }
            ]);

            await server.stop();
        });
    });

    describe('stop()', () => {

        it('stops execution', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000, sample: 100 });
            const pending = beam.execute();
            await Hoek.wait(500);
            beam.stop();

            const result = await pending;
            expect(result.requests.max).to.equal(10);
            expect(result.duration).to.be.between(500, 550);

            await server.stop();
        });
    });
});
