'use strict';

const Beam = require('../');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Connection', () => {

    describe('connect()', () => {

        it('uses tls', async () => {

            const tlsOptions = {
                key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0UqyXDCqWDKpoNQQK/fdr0OkG4gW6DUafxdufH9GmkX/zoKz\ng/SFLrPipzSGINKWtyMvo7mPjXqqVgE10LDI3VFV8IR6fnART+AF8CW5HMBPGt/s\nfQW4W4puvBHkBxWSW1EvbecgNEIS9hTGvHXkFzm4xJ2e9DHp2xoVAjREC73B7JbF\nhc5ZGGchKw+CFmAiNysU0DmBgQcac0eg2pWoT+YGmTeQj6sRXO67n2xy/hA1DuN6\nA4WBK3wM3O4BnTG0dNbWUEbe7yAbV5gEyq57GhJIeYxRvveVDaX90LoAqM4cUH06\n6rciON0UbDHV2LP/JaH5jzBjUyCnKLLo5snlbwIDAQABAoIBAQDJm7YC3pJJUcxb\nc8x8PlHbUkJUjxzZ5MW4Zb71yLkfRYzsxrTcyQA+g+QzA4KtPY8XrZpnkgm51M8e\n+B16AcIMiBxMC6HgCF503i16LyyJiKrrDYfGy2rTK6AOJQHO3TXWJ3eT3BAGpxuS\n12K2Cq6EvQLCy79iJm7Ks+5G6EggMZPfCVdEhffRm2Epl4T7LpIAqWiUDcDfS05n\nNNfAGxxvALPn+D+kzcSF6hpmCVrFVTf9ouhvnr+0DpIIVPwSK/REAF3Ux5SQvFuL\njPmh3bGwfRtcC5d21QNrHdoBVSN2UBLmbHUpBUcOBI8FyivAWJhRfKnhTvXMFG8L\nwaXB51IZAoGBAP/E3uz6zCyN7l2j09wmbyNOi1AKvr1WSmuBJveITouwblnRSdvc\nsYm4YYE0Vb94AG4n7JIfZLKtTN0xvnCo8tYjrdwMJyGfEfMGCQQ9MpOBXAkVVZvP\ne2k4zHNNsfvSc38UNSt7K0HkVuH5BkRBQeskcsyMeu0qK4wQwdtiCoBDAoGBANF7\nFMppYxSW4ir7Jvkh0P8bP/Z7AtaSmkX7iMmUYT+gMFB5EKqFTQjNQgSJxS/uHVDE\nSC5co8WGHnRk7YH2Pp+Ty1fHfXNWyoOOzNEWvg6CFeMHW2o+/qZd4Z5Fep6qCLaa\nFvzWWC2S5YslEaaP8DQ74aAX4o+/TECrxi0z2lllAoGAdRB6qCSyRsI/k4Rkd6Lv\nw00z3lLMsoRIU6QtXaZ5rN335Awyrfr5F3vYxPZbOOOH7uM/GDJeOJmxUJxv+cia\nPQDflpPJZU4VPRJKFjKcb38JzO6C3Gm+po5kpXGuQQA19LgfDeO2DNaiHZOJFrx3\nm1R3Zr/1k491lwokcHETNVkCgYBPLjrZl6Q/8BhlLrG4kbOx+dbfj/euq5NsyHsX\n1uI7bo1Una5TBjfsD8nYdUr3pwWltcui2pl83Ak+7bdo3G8nWnIOJ/WfVzsNJzj7\n/6CvUzR6sBk5u739nJbfgFutBZBtlSkDQPHrqA7j3Ysibl3ZIJlULjMRKrnj6Ans\npCDwkQKBgQCM7gu3p7veYwCZaxqDMz5/GGFUB1My7sK0hcT7/oH61yw3O8pOekee\nuctI1R3NOudn1cs5TAy/aypgLDYTUGQTiBRILeMiZnOrvQQB9cEf7TFgDoRNCcDs\nV/ZWiegVB/WY7H0BkCekuq5bHwjgtJTpvHGqQ9YD7RhE8RSYOhdQ/Q==\n-----END RSA PRIVATE KEY-----\n',
                cert: '-----BEGIN CERTIFICATE-----\nMIIDBjCCAe4CCQDvLNml6smHlTANBgkqhkiG9w0BAQUFADBFMQswCQYDVQQGEwJV\nUzETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0\ncyBQdHkgTHRkMB4XDTE0MDEyNTIxMjIxOFoXDTE1MDEyNTIxMjIxOFowRTELMAkG\nA1UEBhMCVVMxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0\nIFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\nANFKslwwqlgyqaDUECv33a9DpBuIFug1Gn8Xbnx/RppF/86Cs4P0hS6z4qc0hiDS\nlrcjL6O5j416qlYBNdCwyN1RVfCEen5wEU/gBfAluRzATxrf7H0FuFuKbrwR5AcV\nkltRL23nIDRCEvYUxrx15Bc5uMSdnvQx6dsaFQI0RAu9weyWxYXOWRhnISsPghZg\nIjcrFNA5gYEHGnNHoNqVqE/mBpk3kI+rEVzuu59scv4QNQ7jegOFgSt8DNzuAZ0x\ntHTW1lBG3u8gG1eYBMquexoSSHmMUb73lQ2l/dC6AKjOHFB9Ouq3IjjdFGwx1diz\n/yWh+Y8wY1Mgpyiy6ObJ5W8CAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAoSc6Skb4\ng1e0ZqPKXBV2qbx7hlqIyYpubCl1rDiEdVzqYYZEwmst36fJRRrVaFuAM/1DYAmT\nWMhU+yTfA+vCS4tql9b9zUhPw/IDHpBDWyR01spoZFBF/hE1MGNpCSXXsAbmCiVf\naxrIgR2DNketbDxkQx671KwF1+1JOMo9ffXp+OhuRo5NaGIxhTsZ+f/MA4y084Aj\nDI39av50sTRTWWShlN+J7PtdQVA5SZD97oYbeUeL7gI18kAJww9eUdmT0nEjcwKs\nxsQT1fyKbo7AlZBY4KSlUMuGnn0VnAsB9b+LxtXlDfnjyM8bVQx1uAfRo0DO8p/5\n3J5DTjAU55deBQ==\n-----END CERTIFICATE-----\n'
            };

            const server = Hapi.server({ tls: tlsOptions });

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return 'hello';
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000, secure: true });
            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 200);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('uses mutual tls', async () => {

            const tlsOptions = {
                requestCert: true,
                ca: '-----BEGIN CERTIFICATE-----\nMIIE6DCCAtACCQD9u9fszaMrczANBgkqhkiG9w0BAQsFADA2MRIwEAYDVQQDDAls\nb2NhbGhvc3QxIDAeBgNVBAoMF0NsaWVudCBDZXJ0aWZpY2F0ZSBEZW1vMB4XDTIw\nMDQxNjIyMDU0MVoXDTMwMDQxNDIyMDU0MVowNjESMBAGA1UEAwwJbG9jYWxob3N0\nMSAwHgYDVQQKDBdDbGllbnQgQ2VydGlmaWNhdGUgRGVtbzCCAiIwDQYJKoZIhvcN\nAQEBBQADggIPADCCAgoCggIBAL7caoTmSVbmrfCHcL0SYkbFZl12H/rjiJ9VoeTt\nrBeLfk1vdoWrSwoX16azg/x7JpCYrQMI23dkK9qjFVxB/l3hPrxAedMa2ly3WZaQ\ntcdBMwD8oq8ajb0Pbbpm55A78SFLkKR4xO2rRpUk6UQe6m72xtkkEqfFEAKnzqzB\n52IbvTbSp7pJ+O1/AK5ZrJpxp5HClaZfNQeGQsogGGBmzP8Hs3qyE/934BTJXJt/\ndCeFbjqEVD7gJyMPs+GXK9Jcu7HxNujHOPnhUKpiRLzROYEiUGFs9O7yqefcafz6\nPp8IZcQW4HzZFL/19znLHWL1T3NKkI6icb9ShAj+e6XYp23brnLHTZV7xL/b7q3T\n7xjlTk2TWpi2UqPJgIzs0lwvhv67Re1gBnHHHEx9qKcgWd7vl1CiEONynw6sDBwf\nSjoMjJlfXAjJ0M74IsCsPAXcxGbDxMIOStwtFR7XgZNw5U6uXhHRQuz16fjE5Orx\nVWdd8i/JLxs6QRRVFIywnTfr/tmw7FJKD8dV6W69ukLxcQms7yDD0/D+RH/gRU/H\nlIJ9Pja9bP5T/eqcBD7pFfIK1fmOo4vMXCNuom0uCIqCXRUv9AHrVvpweIaJdInE\nFZVbAPZJ3yFwOJRGGH7Bt5NNhW0BHl/ohmjRvthefm7OyF0S9Stczqp/l0L/Anr/\nR/y5AgMBAAEwDQYJKoZIhvcNAQELBQADggIBAEX+kkUqsD2qBWstbIL6nY+AnlBq\nV5LpEtq+o3TQlsgCjc7esRjaY0h+Z8n+vVF+SkCoMtLsuTBM8Xcv1Nw7evBmIpRp\nOCFcek8IO7iOqn5yd6NTfmEJkIh6OO5AO6no6LbVXXnTUt8h0RqjItLeg5/E+54C\n3YTbp9VtSsZWWdIOBbvrs0nsDgKGH0x/Jn/SDxqa8Izv2r9aikRLWhJBl2J27oXt\n0Hbmqz1lDd/OJ0XyyXoD6KSKDvYUKzaLXD7MqxKxiZ+0q6LL1mDlsWawJorP8ZQQ\n4lNtKliUFUqTx1LJdN2xIq9SEeHGhc0svowHxFfD07UOVGij59SC+BuCr2S6aF23\nO0NidBKsH+xolDVkRwb1Zl9QDYfyogUYGm7zV2XXB3NE0xxbmWMG5IoQpXAeyvmp\nxdcj+Y8gIqU2rOyrXMzeiD0MRGQeJglAU605/fCnhXdY6T3oTrS8GcqEkCcL5QMD\nijq8oyz+ycNlHJNed9V50fF6zyV0aWPaz45Q+RWLo7Rif8Uk0bNjp8WvA+XZ2Iha\nn9N0VfitCGlYIJnsilw/wBc0KnjLTWj7Z7PuLetalTwYzAPgkBL+EwdSgFZ6kCoA\n2cLhQkMYG6dJm4rSPohHxqOGO38MXQVE1VDL96VjW1UnokOuWMRUtyyrtSm/fYEh\nVt2Fctlh563BLgCy\n-----END CERTIFICATE-----\n',
                key: '-----BEGIN PRIVATE KEY-----\n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\nc334e/Fwgs4SMNGj226AGxTHyY6vlu4=\n-----END PRIVATE KEY-----\n',
                cert: '-----BEGIN CERTIFICATE-----\nMIIE6DCCAtACCQD9u9fszaMrczANBgkqhkiG9w0BAQsFADA2MRIwEAYDVQQDDAls\nb2NhbGhvc3QxIDAeBgNVBAoMF0NsaWVudCBDZXJ0aWZpY2F0ZSBEZW1vMB4XDTIw\nMDQxNjIyMDU0MVoXDTMwMDQxNDIyMDU0MVowNjESMBAGA1UEAwwJbG9jYWxob3N0\nMSAwHgYDVQQKDBdDbGllbnQgQ2VydGlmaWNhdGUgRGVtbzCCAiIwDQYJKoZIhvcN\nAQEBBQADggIPADCCAgoCggIBAL7caoTmSVbmrfCHcL0SYkbFZl12H/rjiJ9VoeTt\nrBeLfk1vdoWrSwoX16azg/x7JpCYrQMI23dkK9qjFVxB/l3hPrxAedMa2ly3WZaQ\ntcdBMwD8oq8ajb0Pbbpm55A78SFLkKR4xO2rRpUk6UQe6m72xtkkEqfFEAKnzqzB\n52IbvTbSp7pJ+O1/AK5ZrJpxp5HClaZfNQeGQsogGGBmzP8Hs3qyE/934BTJXJt/\ndCeFbjqEVD7gJyMPs+GXK9Jcu7HxNujHOPnhUKpiRLzROYEiUGFs9O7yqefcafz6\nPp8IZcQW4HzZFL/19znLHWL1T3NKkI6icb9ShAj+e6XYp23brnLHTZV7xL/b7q3T\n7xjlTk2TWpi2UqPJgIzs0lwvhv67Re1gBnHHHEx9qKcgWd7vl1CiEONynw6sDBwf\nSjoMjJlfXAjJ0M74IsCsPAXcxGbDxMIOStwtFR7XgZNw5U6uXhHRQuz16fjE5Orx\nVWdd8i/JLxs6QRRVFIywnTfr/tmw7FJKD8dV6W69ukLxcQms7yDD0/D+RH/gRU/H\nlIJ9Pja9bP5T/eqcBD7pFfIK1fmOo4vMXCNuom0uCIqCXRUv9AHrVvpweIaJdInE\nFZVbAPZJ3yFwOJRGGH7Bt5NNhW0BHl/ohmjRvthefm7OyF0S9Stczqp/l0L/Anr/\nR/y5AgMBAAEwDQYJKoZIhvcNAQELBQADggIBAEX+kkUqsD2qBWstbIL6nY+AnlBq\nV5LpEtq+o3TQlsgCjc7esRjaY0h+Z8n+vVF+SkCoMtLsuTBM8Xcv1Nw7evBmIpRp\nOCFcek8IO7iOqn5yd6NTfmEJkIh6OO5AO6no6LbVXXnTUt8h0RqjItLeg5/E+54C\n3YTbp9VtSsZWWdIOBbvrs0nsDgKGH0x/Jn/SDxqa8Izv2r9aikRLWhJBl2J27oXt\n0Hbmqz1lDd/OJ0XyyXoD6KSKDvYUKzaLXD7MqxKxiZ+0q6LL1mDlsWawJorP8ZQQ\n4lNtKliUFUqTx1LJdN2xIq9SEeHGhc0svowHxFfD07UOVGij59SC+BuCr2S6aF23\nO0NidBKsH+xolDVkRwb1Zl9QDYfyogUYGm7zV2XXB3NE0xxbmWMG5IoQpXAeyvmp\nxdcj+Y8gIqU2rOyrXMzeiD0MRGQeJglAU605/fCnhXdY6T3oTrS8GcqEkCcL5QMD\nijq8oyz+ycNlHJNed9V50fF6zyV0aWPaz45Q+RWLo7Rif8Uk0bNjp8WvA+XZ2Iha\nn9N0VfitCGlYIJnsilw/wBc0KnjLTWj7Z7PuLetalTwYzAPgkBL+EwdSgFZ6kCoA\n2cLhQkMYG6dJm4rSPohHxqOGO38MXQVE1VDL96VjW1UnokOuWMRUtyyrtSm/fYEh\nVt2Fctlh563BLgCy\n-----END CERTIFICATE-----\n'
            };

            const server = Hapi.server({ tls: tlsOptions });

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
                secure: { // `secure` is backwards compatible and will honor a boolean, or it will honor a `tls.createSecureContext` options object.
                    ca: tlsOptions.ca,
                    cert: '-----BEGIN CERTIFICATE-----\nMIIEuzCCAqMCAQEwDQYJKoZIhvcNAQEFBQAwNjESMBAGA1UEAwwJbG9jYWxob3N0\nMSAwHgYDVQQKDBdDbGllbnQgQ2VydGlmaWNhdGUgRGVtbzAeFw0yMDA0MTYyMjE1\nNTFaFw0zMDA0MTQyMjE1NTFaMBExDzANBgNVBAMMBkNsaWVudDCCAiIwDQYJKoZI\nhvcNAQEBBQADggIPADCCAgoCggIBALUL80miECHE3ruOxvd59vkC3UjFpu5wRMnY\nabmrLWy5nig9JvdZRaJIiCHyizY5xki+DXNUIkiOmK8DocMjw7YhYz1HB1Hxpdlk\nm1gWYV9Jv3j+ZhciUuyz5Mkxf8KZOjMFdGw6x8EOBptLcM5OLgx6qVTXbdGZCxKi\n3a9ncVd2GRfseGIQK8tcXPy4ovXhgLZqxAhZZ1T8M4u/elWg6io4z5a1cgIDvdgK\nXsrSUvOrCAa9Alldhg1n+E9GyKFjtatnS7dEr/sqHK/gp8YjLQzd1+ROPVdofJ2I\nsVKX4RRAPg/GQoXMOOScPqzDDXdhnpYhek4loU/E5mfTDNQ+NbGGGRXYo/qrgRvA\nYcgaF0pXurPKIjpjuhVY7NbaaKbAiEbXUyEIBonIuNCtQ+1kPswGu3kU9qB9NNfL\ngQ0uHFjliCljqD/0jtpFH3VvQ1+/u8PVKRqViteqnMqXdqjJ/hcMW1eJJbzCDd4z\nxs2OswOugqYTRvXJl1fkHD2dHR+AHiUgPFZ6pzi03OBDVZ5AGLMVG5t/mceNWIJD\n0Krz2EAXoyiJKRiLBW1xByw/yCE9Avro9IKiYo5+Hd5yu61zadRN82drEiYX60w2\nEjmyoLt0r+a3yrCwx7xChNJOzJc5FTxftM/7JFW1oh0pt2fNnpECjIz5iCEQGIlj\ntL6KAktDAgMBAAEwDQYJKoZIhvcNAQEFBQADggIBALxfVb1RNWjWDUuuJ5r+1KBF\nsQOavPwonOCOzXAIGu2of6owLIznR9LPxtXCMxVhM4Hct3lis+zIRZ+45Qk7+Fg7\nE1u0PaBioy4K8mrqw25jY97m5xXy+0Fqi18hoFfKFhqC0N4TyUOU5zEUHB2dv7zD\nUU+bBjLU+Lh02GrteTxOOqJ5Q3+j4M8oI9ffLg22WEnqnBlVjRJsS1U26Lsyj0Wc\nol3PWbII71B9Cx96c0PuRlN4kObQzWjEEfDLbxEIzqh43ducmlVgYNnKzRotkMU6\ngf9Vhgshuh9QGFHBpvFwluHqw9KG0ojsyAkuXQ7qAhikrfNa06faOROTRSjDJR4u\ngvGLu2WfNEnH4SHFzcoD6ULvWA+6Mgs1EAB6yWsd5K9HUJyEUg/TtaJMAZ1rYU7j\nSXsnppIigW+stMwRd2y+coKMxuTUU+WFkN7BZ5/E0nnXWSFP9MCFzV/PSA11zPMc\nDhobCP6T/jCZnCSo08JEe7tDNpSS1Ma1t4FrX7TWnt8AVDNX68h4GsFm0CkxsMMZ\nFuUWxcXNwnl4HutzPIyjBnVFIrDiYqFzJnnoNTnQTqsSYKG6dH8/Hmb9fWaZJAGr\nCl5fJW3ERXGBAROFjviCPenr1ULIxkIAYa5NUy2quAzJ9prn7mlMmeSvBSbaB51a\n4YJsuMhXVuXjMclEggjJ\n-----END CERTIFICATE-----\n',
                    key: '-----BEGIN PRIVATE KEY-----\n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\nRKP+DXM4dXxk7bC1mMVV9HvCUhB1zxD5\n-----END PRIVATE KEY-----\n'
                }
            });

            const result = await beam.execute();
            expect(result.requests.max).to.be.between(60, 90);
            expect(result.latency.max).to.be.between(100, 300);
            expect(result.throughput.max).to.be.between(10000, 16000);
            expect(result.duration).to.be.between(1000, 1050);

            await server.stop();
        });

        it('handles connection timeout', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(110);
                    return null;
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000, timeout: 100 });
            const result = await beam.execute();
            expect(result.requests.max).to.equal(0);

            await server.stop();
        });

        it('handles connection error', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: async () => {

                    await Hoek.wait(500);
                    return null;
                }
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000, pipelines: 10 });
            const pending = beam.execute();

            await Hoek.wait();
            beam._connections[0]._connection.emit('close', true);

            const result = await pending;
            expect(result.totals.errors).to.equal(10);

            await server.stop();
        });
    });

    describe('end()', () => {

        it('does not reconnect', async () => {

            const server = Hapi.server();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, h) => h.abandon
            });

            await server.start();

            const beam = new Beam({ port: server.info.port, duration: 1000, timeout: 100, connections: 2 });
            const pending = beam.execute();

            beam._connections[0].end();

            const result = await pending;
            expect(result.totals.timeouts).to.equal(9);

            await server.stop();
        });
    });
});
