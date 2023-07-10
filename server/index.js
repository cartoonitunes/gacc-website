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
const abiKitten = require("./abi/kittenAbi.json");
require("dotenv").config();
const db = require("../models/index.js");
const PORT = process.env.PORT || 3001;
const gakc_ranks = require('./ranks/gakc.js');
const gacc_ranks = require('./ranks/gacc.js');

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
    else {
      res.send('The token does not exist');
      res.status(404);
    }
  })
  .catch(err => {
    res.send('The token does not exist');
    res.status(404);
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

//GACC
app.get("/api/gacc/ranks/:id", function (req, res) {
  let token = req.params.id;
  try {
    token = token.toString();
    gacc_rank = gacc_ranks[token];
    return res.status(200).send({
      success: true,
      rank: gacc_rank
    });
  }
  catch {
    return res.status(422).send({
      success: false,
      rank: null
    });
  }
});

//Kittens
app.get("/api/kittens/ranks/:id", function (req, res) {
  let token = req.params.id;
  try {
    token = token.toString();
    kitten_rank = gakc_ranks[token];
    return res.status(200).send({
      success: true,
      rank: kitten_rank
    });
  }
  catch {
    return res.status(422).send({
      success: false,
      rank: null
    });
  }
});

app.get("/api/kittens/metadata/:id", function (req, res) {
  let token = req.params.id;
  db.Kittens.findOne({ where: { token: token } }).then((obj) => {
    let ret = {};
    if (obj) {
      if (obj.claimed === true) {
        db.RevealedKittenMetadata.findOne({ where: { token: token } }).then((md) => {
          ret = md.dataValues.metadata;
          res.send(ret);
          res.status(200);
        });
      } else {
        db.HiddenKittenMetadata.findOne({ where: { token: token } }).then((md) => {
          ret = md.dataValues.metadata;
          res.send(ret);
          res.status(200);
        });
      }
    }
    else {
      res.send('The token does not exist');
      res.status(404);
    }
  })
  .catch(err => {
    res.send('The token does not exist');
    res.status(404);
  });
});

app.post("/api/kittens/claim_tokens", async (req, res) => {
  const address = req.body.address;
  let tokens = req.body.tokens;
  let flippable = true;
  tokens = tokens.map(Number);
  let isnum = !tokens.some(isNaN);
  if (tokens.some((e) => e < 0) || tokens.some((e) => e > 2221) || !isnum) {
    flippable = false;
    return res.status(404).send({
      success: false,
      msg: 'Invalid token IDs'
    });
  }
  let kittens = await db.Kittens.findAll({ where: { token: tokens.map(String), claimed: false } });
  const web3 = new Web3(new Web3.providers.HttpProvider("https://eth-mainnet.g.alchemy.com/v2/ls-qujtks-A7Y49bcM0skuS1IyENmpUY"));
  const contract = new web3.eth.Contract(abiKitten, "0xb73B1335C1f14ECCD0D6787490bCe85e1af62378");
  const promises = kittens.map(async (kitten) => {
    try{
      await contract.methods.ownerOf(parseInt(kitten.token)).call();
    }
    catch(e){
      flippable = false;
      return res.status(404).send({
        success: false,
        msg:`GAKC #${parseInt(kitten.token)} does not exist yet!`
      });
    }
    });

  try {
    await Promise.all(promises);

  if (flippable !== false) {
    if (kittens.length > 0) {
      await db.Kittens.update({claimed:true, address:address}, {where: { token: tokens.map(String), claimed: false }}).then( function() {
        return res.status(200).send({
          success: true,
          msg: `The requested kittens have been claimed by ${address}`
        });
      })
      .catch(err => {
        return res.status(500).send({
          success: false,
          msg: 'Something went wrong updating the metadata'
        });
      });
    }
    else {
      return res.status(200).send({
        success: true,
        msg: `All of the requested kittens have already been claimed.`
      });
    }
  }
  }
  catch {}
  
});


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "/client/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
