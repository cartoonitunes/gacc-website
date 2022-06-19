const {
  wlMerkleTree,
  wlFreeMerkleTree,
  wlFreeMultiMerkleTree,
  wlMultiMerkleTree,
} = require("./merkle.js");
const keccak256 = require("keccak256");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "/client/build/index.html"));
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

function get_metadata(token) {
  db.Token.findOne({ where: { token: token } }).then(function (obj) {
    // update
    if (obj) {
      if (obj.claimed === true) {
        db.RevealedMetadata.findOne({ where: { token: token } }).then(function (
          obj
        ) {
          if (obj) return obj.metadata;
        });
      } else {
        db.HiddendMetadata.findOne({ where: { token: token } }).then(function (
          obj
        ) {
          if (obj) return obj.metadata;
        });
      }
    }
    return {};
  });
}

function claim_token(address, token) {
  db.Token.findOne({ where: { token: token } }).then(function (obj) {
    if (obj) {
      if (obj.claimed === false) {
        obj.claimed = true;
        obj.address = address;
        obj.save();
      }
    }
  });
  return db.Claim.findOne({ where: condition }).then(function (obj) {
    // update
    if (obj) return obj.update(values);
    // insert
    return db.Claim.create(values);
  });
}

app.get("/api/metadata/:id", function (req, res) {
  return get_metadata(req.params.id);
});

app.post("/api/claim_token", (req, res) => {
  try {
    const address = req.body.address;
    const token = req.body.apeIds;
    try {
      claim_token(address, token);
    } catch (err) {
      console.log(err);
      res.status(422);
      res.send("Something went wrong!");
    }
    res.status(200);
    res.send(`Token ${token} claimed by ${address}`);
  } catch (err) {
    console.log(err);
    res.status(422);
    res.send("Something went wrong!");
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
