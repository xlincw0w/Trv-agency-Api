// Différente importation de bibliothéque nécessaire

const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex');
const cors = require('cors');
const crypto = require('crypto-js');
const port = process.env.PORT || 3010;

// Clé secréte du ciffrement symétrique des données grace a l'algorithme AES
var secretAESkey = 'secretkey';

// Rattachement a la BDD 
const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'tagency'
    }
});

// Initialisation d'une instance express
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Handler de type 'GET' au niveau 'root'
app.get('/', (req, res) => {
    res.json('This is working');
})

// Handler de type 'POST' au niveau '/owner'
app.post('/owner', (req, res) => {
    // Mise en miniscule
    for (element in req.body) {
        if (typeof(req.body[element]) === "string")
        req.body[element] = req.body[element].toLowerCase() ;
    }
   
    const { nom, prenom, email, hotel, description, adresse, pays, region, nc, cs, cd, ct } = req.body;

    // INSERT INTO hotels
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

// Handler de type 'POST' au niveau '/search'
app.post('/search', (req, res) => {
    // Mise en miniscule
    let { destination } = req.body;
    destination = destination.toLowerCase(); 

    // SELECT FROM hotels
    db.select('*').from('hotels').orderBy('prixsimple')
    .where({
        confirmed: true,
        pays: destination
    })
    .orWhere({
        confirmed: true,
        region: destination
    }).then(data => {
        res.json(data);
    }).catch(err => res.status(400).send('Error Searching through database'));
})

// Handler de type 'POST' au niveau '/reservation'
app.post('/reservation', (req, res) => {
    // Mise en miniscule
    for (element in req.body) {
        if (typeof(req.body[element]) === "string")
        req.body[element] = req.body[element].toLowerCase() ;
    }

    const { id_hotel, nom_cli, prenom_cli, email_cli, date_debut, date_fin, type_chambre } = req.body;

    // INSERT INTO reservation
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

// Handler de type 'POST' au niveau '/admin'
app.post('/admin', (req, res) => {

    const { username, aesEncryptedPassword } = req.body;

    // SELECT FROM admin
    db('admin').select('*').where({
        username: username,
    }).then(data => row(data))
    .catch(err => res.json({connected: false}));

    const row = (data) => {

    // Décryptage du password crypté avec AES et l'authentifier grace a SHA256
    let bytes = crypto.AES.decrypt(aesEncryptedPassword, secretAESkey);
    let password = bytes.toString(crypto.enc.Utf8);
    hashed_password = crypto.SHA256(password).toString();
    
    // Test d'authetification
    if (hashed_password == data[0].hashed_password) res.json({connected: true});
    else res.json({connected: false})
    }
})

// Handler de type 'GET' au niveau '/unconfirmed'
app.get('/unconfirmed', (req, res) => {

    // SELECT FROM hotels
    db('hotels').select('*').where({
        confirmed: false
    }).then(data => res.json(data))
    .catch(err => res.status(400).send('erreur'));
})

// Handler de type 'POST' au niveau '/confirm'
app.post('/confirm', (req, res) => {
    const { id, confirmed } = req.body;

    // Assure la confirmation ou le rejet des hotels (Coté administration)
    if (confirmed) {
        db('hotels')
        .update({
          confirmed: true,
        })
        .where({ id: id })
        .then(console.log);
    } else {
        db('hotels')
        .where({ id: id })
        .del()
        .then(console.log);
    }
})

// Lancement initial du server
app.listen(port, () => {
    console.log('Server running');
})