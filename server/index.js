const {
  wlMerkleTree,
  wlFreeMerkleTree,
  wlFreeMultiMerkleTree,
  wlMultiMerkleTree,
} = require("./merkle.js");
const keccak256 = require("keccak256");
const Web3 = require('web3')
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const abi = require("./abi/mutantAbi.json");
require("dotenv").config();
const db = require("../models/index.js");
const PORT = process.env.PORT || 3001;

const app = express();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/api/proof", (req, res) => {
  try {
    const address = req.body.address;
    const wlType = req.body.wlType;
    let hashedAddress = keccak256(address);
    let proof = [];
    if (wlType === "MULTI") {
      proof = wlMultiMerkleTree.getHexProof(hashedAddress);
    }
    if (wlType === "WL") {
      proof = wlMerkleTree.getHexProof(hashedAddress);
    }
    if (wlType === "FREE") {
      proof = wlFreeMerkleTree.getHexProof(hashedAddress);
    }
    if (wlType === "FREE_MULTI") {
      proof = wlFreeMultiMerkleTree.getHexProof(hashedAddress);
    }
    if (!proof) {
      res.status(422);
      res.send("Failed attempt");
    } else {
      res.status(200);
      res.send(proof);
    }
  } catch (err) {
    console.log(err);
    res.status(422);
    res.send("Something went wrong!");
  }
});

app.get("/api/metadata/:id", function (req, res) {
  let token = req.params.id;
  db.Tokens.findOne({ where: { token: token } }).then((obj) => {
    let ret = {};
    if (obj) {
      if (obj.claimed === true) {
        db.RevealedMetadata.findOne({ where: { token: token } }).then((md) => {
          ret = md.dataValues.metadata;
          res.send(ret);
          res.status(200);
        });
      } else {
        db.HiddenMetadata.findOne({ where: { token: token } }).then((md) => {
          ret = md.dataValues.metadata;
          res.send(ret);
          res.status(200);
        });
      }
    }
  });
});

app.post("/api/claim_token", (req, res) => {
  try {
    const address = req.body.address;
    let token = req.body.token;
    token = token.toString();
    try {
        let intToken = parseInt(token);
        let isnum = /^\d+$/.test(token);
        if (intToken > 15020 || intToken < 0 || !isnum) {
            return res.status(404).send({
                success: false,
                msg: 'Invalid token id'
              });
        }
    }
    catch {
        return res.status(404).send({
            success: false,
            msg: 'Invalid token id'
          });
    }
    try {
      db.Tokens.findOne({ where: { token: token } }).then(function (obj) {
        if (obj) {
          if (obj.claimed === false) {
            const web3 = new Web3(
                new Web3.providers.HttpProvider(
                  process.env.INFURA_URL
                )
              )
            const contract = new web3.eth.Contract(abi, process.env.REACT_APP_MACC_ADDRESS);
            contract.methods.ownerOf(token).call().then( (owner) => {
                if (owner !== '0x0000000000000000000000000000000000000000') {
                    obj.claimed = true;
                    obj.address = address;
                    obj.save();
                    return res.status(200).send({
                        success: true,
                        msg: `Token ${token} claimed by ${address}`
                      });
                }
                else {
                    return res.status(404).send({
                        success: false,
                        msg: 'This token does not exist yet!'
                      });
                }
            })
            .catch((err) => {
                return res.status(404).send({
                    success: false,
                    msg: 'This token does not exist yet!'
                  });
            });
          } else {
            return res.status(200).send({
                success: false,
                msg: `Token was already claimed!`
              });
          }
        }
      });
    } catch (err) {
      console.log(err);
      return res.status(422).send({
        success: false,
        msg: "Something went wrong!"
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(422).send({
        success: false,
        msg: "Something went wrong!"
      });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "/client/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
