// Load modules
const Hapi = require('hapi');
const Vision = require('vision');
const Path = require('path');
const Handlebars = require('handlebars');

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

internals.main = async () => {

    // Use Port 3000 unless we get an environment variable telling us otherwise
    // See https://docs.microsoft.com/en-gb/azure/app-service/app-service-web-get-started-nodejs
    const server = Hapi.Server({ port: process.env.PORT || 3000 });

    await server.register(Vision);

    server.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: `templates/${internals.templatePath}`
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });
    server.route({ method: 'GET', path: '/healthz', handler: healthzHandler });

    await server.start();
    console.log('Server is running at ' + server.info.uri);
};


internals.main();
