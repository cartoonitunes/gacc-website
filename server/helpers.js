const db = require("../models/index.js");

const get_metadata = (token) => {
    db.Tokens.findOne({ where: { token: token } }).then( (obj) => {
      let ret = {};
      if (obj) {
        if (obj.claimed === true) {
          db.RevealedMetadata.findOne({ where: { token: token } }).then((
            md
          ) => {
              return md.dataValues.metadata
          });
        } else {
            db.HiddendMetadata.findOne({ where: { token: token } }).then((
              md
          ) => {
              return md.dataValues.metadata
          });
        }
      }
      return ret;
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

  module.exports = { get_metadata, claim_token}