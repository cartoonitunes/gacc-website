const { wlMerkleTree, wlFreeMerkleTree, wlMultiMerkleTree } = require('./merkle.js')
const keccak256 = require("keccak256")
const path = require('path');
const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config()

const PORT = process.env.PORT || 3001;

const app = express();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/client/build/index.html'));
});
  

app.post('/api/proof', (req, res) => {
    try {
        const address = req.body.address;
        const wlType = req.body.wlType;
        let hashedAddress = keccak256(address)
        let proof = []
        if (wlType === 'MULTI') {
            proof = wlMultiMerkleTree.getHexProof(hashedAddress)
        }
        if (wlType === 'WL') {
            proof = wlMerkleTree.getHexProof(hashedAddress)
        }
        if (wlType === 'FREE') {
            proof = wlFreeMerkleTree.getHexProof(hashedAddress)
        }
        console.log(proof)
        if (!proof) {
            res.status(422)
            res.send('Failed attempt')
        }
        else {
            res.status(200)
            res.send(proof)
        }
    }
    catch (err) {
        console.log(err)
        res.status(422)
        res.send('Something went wrong!');
    }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});