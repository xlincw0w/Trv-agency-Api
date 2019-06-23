const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex');
const cors = require('cors');
const crypto = require('crypto-js');
const port = process.env.PORT || 3010;

var secretAESkey = 'secretkey';

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'tagency'
    }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json('This is working');
})

app.post('/owner', (req, res) => {
    for (element in req.body) {
        if (typeof(req.body[element]) === "string")
        req.body[element] = req.body[element].toLowerCase() ;
    }
   
    const { nom, prenom, email, hotel, description, adresse, pays, region, nc, cs, cd, ct } = req.body;

    db('hotels').insert({
        confirmed: false,
        nom: nom,
        prenom: prenom,
        email: email,
        hotel: hotel,
        description: description,
        adresse: adresse,
        pays: pays,
        region: region,
        n_chambre: nc,          
        prixsimple: cs,
        prixdouble: cd,
        prixtriple: ct
    }).then(console.log)
    .catch(err => res.status(400).send('Error Connecting to database'));
    res.json("Insertion to database done");
})

app.post('/search', (req, res) => {
    let { destination } = req.body;
    destination = destination.toLowerCase(); 
    db.select('*').from('hotels').orderBy('prixsimple').where({
        pays: destination
    }).orWhere({
        region: destination
    }).then(data => {
        res.json(data);
    }).catch(err => res.status(400).send('Error Searching through database'));
})

app.post('/reservation', (req, res) => {
    for (element in req.body) {
        if (typeof(req.body[element]) === "string")
        req.body[element] = req.body[element].toLowerCase() ;
    }

    const { id_hotel, nom_cli, prenom_cli, email_cli, date_debut, date_fin, type_chambre } = req.body;

    db('reservation').insert({
        id_hotel:id_hotel,
        nom_cli: nom_cli, 
        prenom_cli: prenom_cli,
        email_cli: email_cli,
        date_debut: date_debut,
        date_fin: date_fin,
        type_chambre: type_chambre,
    }).then(console.log)
    .catch(err => res.status(400).send('Error Connecting to database'));
    res.json("Insertion to database done");

})

app.post('/admin', (req, res) => {

    const { username, aesEncryptedPassword } = req.body;

    db('admin').select('*').where({
        username: username,
    }).then(data => row(data))
    .catch(err => res.json({connected: false}));

    const row = (data) => {

    let bytes = crypto.AES.decrypt(aesEncryptedPassword, secretAESkey);
    let password = bytes.toString(crypto.enc.Utf8);
    hashed_password = crypto.SHA256(password).toString();
    
    if (hashed_password == data[0].hashed_password) res.json({connected: true});
    else res.json({connected: false})
    }
})

app.get('/unconfirmed', (req, res) => {
    db('hotels').select('*').where({
        confirmed: false
    }).then(data => res.json(data))
    .catch(err => res.status(400).send('erreur'));
})

app.post('/confirm', (req, res) => {
    const { id, confirmed } = req.body;

    if (confirmed) {
        console.log(id);
        db('hotels')
        .where({ id: id })
        .update({
          confirmed: true,
        })
    } else {
        console.log(id)
    }
})

app.listen(port, () => {
    console.log('Server running');
})