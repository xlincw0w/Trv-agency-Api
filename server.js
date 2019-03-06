const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex');
const cors = require('cors');
const port = process.env.PORT || 3010;

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
        req.body[element] = req.body[element].toLowerCase() ;
    }
   
    const { nom, prenom, email, hotel, description, adresse, pays, region, nc, cs, cd, ct } = req.body;

    db('hotels').insert({
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
    db.select('*').from('hotels').orderBy('prixsimple', 'desc').where({
        pays: destination
    }).orWhere({
        region: destination
    }).then(data => {
        res.json(data);
    }).catch(err => res.status(400).send('Error Searching through database'));
})

app.listen(port, () => {
    console.log('Server running');
})