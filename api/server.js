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

server.post('/api/register', (req,res) => {
    const userInfo = req.body;
    userInfo.password = bcrypt.hashSync(userInfo.password,12);

    db('users').insert(userInfo)
        .then(ids => {
            res.status(201).json(ids);
        })
        .catch(err=>res.status(500).json({message: 'error', error: err}))
})

server.post('/api/login', (req,res) => {

    db('users').where({username: req.body.username}).first()
    .then(user => {
        if(user && bcrypt.compareSync(req.body.password,user.password)){
            //session cookie!
            req.session.user = user;
            res.status(200).json({message: `welcome ${user.name}!`})
        }
        else{
            res.status(401).json({message: `you shall not pass!`})
        }})
        .catch(err => res.status(500).json({error: err}))
})

function requiresLogin(req,res,next) {
    if(req.session && req.session.user){
        next();
    }
    else{
        res.status(401).json({message: `not logged in...`})
    }
}

server.get('/api/users',requiresLogin, (req,res) => {
    db('users').then(users => {
        res.status(200).json(users)
    })
    .catch(err => res.status(500).json({error: err}))
})


server.get('/api/logout', (req, res) => {
    if(req.session){
        req.session.destroy(err => {
            if(err){
                res.status(500).send('you can never leave')
            }
            else {
                res.status(200).send('bye bye')
                // kills cookie on servers end, but client will still send a req.session if request is repeated even after deleted on server side. will continue to see 'bye bye' here as opposed to the 'logged out already' being triggered.  once cookie on client side is deleted, 'logged out already' will trigger
            }
        });
    }
    else{
        res.json({message: 'logged out already'})
    }
});


module.exports = server;