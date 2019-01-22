const express = require('express');
const helmet = require('helmet');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);

const knexConfig = require('../knexfile.js');

const server = express();

const db = knex(knexConfig.development);

const sessionConfig = {
    name: 'sessionID', //default is 'sid' but reveals use of library
    secret: 'joqiej;lksdjgons302w3nr#$TN#$0nn23r',
    cookie: {
        maxAge: 1000 * 60 * 10, //10mins
        secure: false //only send the cookie over https -should be TRUE FOR PRODUCTION
    },
    httpOnly: true, //js cant touch this cookie
    resave: false, 
    saveUninitialized: false,
    store: new KnexSessionStore({
        tablename: 'sessions',
        sidfieldname: 'sid',
        knex: db,
        createtable: true,
        clearInterval: 1000*60*30, //every 1/2 hour => clear out expired sessions
    })
}

server.use(helmet());
server.use(express.json());
server.use(session(sessionConfig));

server.get('/', (req,res) => {
    res.status(200).json('API is running... go catch it!')
})

module.exports = server;