const express = require('express')
const app = express();
const logger = require('morgan');
const helmet = require('helmet')
const bodyParser = require('body-parser');
const secureEnv = require('secure-env');
const cors = require('cors');
const methodOverride = require('method-override');
const addRequestId = require('express-request-id')();
const utility = require('./utility/utilities');
const session = require('./utility/session');
process.env.GLOBAL_DIR = __dirname;
process.env.DEBUG = 'true'

process.env = (process.env.NODE_ENV == 'prod') ? secureEnv({ secret: process.env.ENVPASSPROD, path: __dirname + '/.env.prod.enc' }) : process.env;
if (process.env.NODE_ENV != 'prod')
    require('custom-env').env(process.env.NODE_ENV, __dirname);

utility.print(process.env.APP_ENV);

const corsOptions = {
    origin: (process.env.APP_ENV != 'dev') ? (origin, callback) => {
        if (process.env.CORS.indexOf(origin) !== -1 || !origin) callback(null, true)
        else callback(new Error('Not Allowed by CORS policy'), false)
    } : '*'
}

app.use(methodOverride());
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(helmet());
app.disable('x-powered-by');
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(addRequestId);

app.use((req, res, next) => {
    req.start = Date.now();
    if(req.method === 'OPTIONS') {
        res.end();
    } else {
        next();
    }
});

app.use('/api/ecommerce-module', session.validation, require('./routes/ecommerce-module'));
app.use('/api', session.validation, require('./routes/ccbp'));
app.use('/', session.validation, require('./routes/ccbp-public'));
app.use(express.static(__dirname + '/public'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404);
    res.json({
        success: false,
        message: "Resource not found"
    })
    
});

module.exports = app;

