// Load modules
const Hapi = require('hapi');
const Vision = require('vision');
const Path = require('path');
const Handlebars = require('handlebars');
const RandomJs = require('random-js');
const Joi = require('joi');
const Inert = require('inert');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');

var random = new RandomJs.Random();

// Declare internals
const internals = {
    templatePath: 'basic'
};

const today = new Date();
internals.thisYear = today.getFullYear();
internals.loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";


const rootHandler = (request, h) => {

    const relativePath = Path.relative(`${__dirname}/../..`, `${__dirname}/templates/${internals.templatePath}`);

    return h.view('index', {
        title: 'Weather Balloon',
        page_title: 'Weather Balloon',
        page_lead: 'This is the basic starter site',
        page_content: internals.loremIpsum.repeat(3),
        year: internals.thisYear
    });
};

const healthzHandler = (request, h) => {
    return {
        status: 'healthy'
    };
};

const randomNumberListSchema = Joi.object({
    values: Joi.array().items(Joi.number()).required().description('The list of randomly generated numbers'),
    start: Joi.number().required(),
    end: Joi.number().required(),
    count: Joi.number().required()
});

const apiRandomHandler = (request, h) => {

    var start = request.query.start;
    var end = request.query.end;
    var count = request.query.count;
    var values = [];

    Array.from({ length: count }).forEach(() => {
        values.push(random.integer(start, end));
    });

    return {
        values: values,
        start: start,
        end: end,
        count: count
    };
};

internals.main = async () => {

    // Use Port 3000 unless we get an environment variable telling us otherwise
    // See https://docs.microsoft.com/en-gb/azure/app-service/app-service-web-get-started-nodejs
    const server = Hapi.Server({ port: process.env.PORT || 3000 });

    await server.register(Vision);

    const swaggerOptions = {
        info: {
            title: 'WB JS Site Documentation',
            version: Pack.version,
        },
    };

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);


    server.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: `templates/${internals.templatePath}`
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });
    server.route({ method: 'GET', path: '/healthz', handler: healthzHandler });
    server.route({
        method: 'GET',
        path: '/api/random',
        handler: apiRandomHandler,
        options: {
            tags: ['api'],
            description: 'Get random numbers',
            notes: 'Returns a list of random numbers.',
            validate: {
                query: {
                    start: Joi.number().positive().min(1).max(9998).default(1).integer().optional().description('The start of the range from which to generate random numbers'),
                    end: Joi.number().positive().min(2).max(9999).default(100).integer().optional().description('The end of the range from which to generate random numbers'),
                    count: Joi.number().min(1).max(10).default(1).integer().optional().description('The number of random numbers to return')
                }
            },
            response: {
                sample: 20,
                schema: randomNumberListSchema
            }
        }
    });

await server.start();
console.log('Server is running at ' + server.info.uri);
};


internals.main();
