"use strict";

var metadata = [
  {
    token: "5000",
    metadata: {
      name: "Mutant Grandpa #5000",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Grandpa Mojo Jojo" }
      ],
      image:
        "https://ipfs.io/ipfs/QmNftxUsPiEGbZDwKNbp5Nc3HwipvnnSwyH6r9Ydq5Nm4U",
      image_url:
        "https://ipfs.io/ipfs/QmNftxUsPiEGbZDwKNbp5Nc3HwipvnnSwyH6r9Ydq5Nm4U",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    token: "5004",
    metadata: {
      name: "Mutant Grandpa #5004",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Grandpa Curious George" }
      ],
      image:
        "https://ipfs.io/ipfs/QmWgM5sxx74sWeW5bzb1UP2TnFE1HmwsuyZCZhDMnLr8mZ",
      image_url:
        "https://ipfs.io/ipfs/QmWgM5sxx74sWeW5bzb1UP2TnFE1HmwsuyZCZhDMnLr8mZ",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    token: "5006",
    metadata: {
      name: "Mutant Grandpa #5006",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Grandpa Great Ape Vegeta" }
      ],
      image:
        "https://ipfs.io/ipfs/Qmf2MvRggqxNe91XJF1RiZm8wCau1eF6FvkwPYd1vrq2LS",
      image_url:
        "https://ipfs.io/ipfs/Qmf2MvRggqxNe91XJF1RiZm8wCau1eF6FvkwPYd1vrq2LS",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    token: "5014",
    metadata: {
      name: "Mutant Grandpa #5014",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Grandpa Boots" }
      ],
      image:
        "https://ipfs.io/ipfs/QmbdVsauEvFqDi2VL6d5Sqdr8rfQCXKCmJ3WaSHgUKVzbM",
      image_url:
        "https://ipfs.io/ipfs/QmbdVsauEvFqDi2VL6d5Sqdr8rfQCXKCmJ3WaSHgUKVzbM",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    token: "5312",
    metadata: {
      name: "Mutant Grandpa #5312",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Anime Grandpa" }
      ],
      image:
        "https://ipfs.io/ipfs/QmQ1Lksuc19qj79AzxJhBs7v1AgwBNBKYDBBxfMYhry18t",
      image_url:
        "https://ipfs.io/ipfs/QmQ1Lksuc19qj79AzxJhBs7v1AgwBNBKYDBBxfMYhry18t",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    token: "6152",
    metadata: {
      name: "Mutant Grandpa #6152",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Super Grandpa" }
      ],
      image:
        "https://ipfs.io/ipfs/QmapEMtbFDaMyWg3s4xFFo1dPv85cXYGHGNMp8VJaGRwSW",
      image_url:
        "https://ipfs.io/ipfs/QmapEMtbFDaMyWg3s4xFFo1dPv85cXYGHGNMp8VJaGRwSW",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    token: "12534",
    metadata: {
      name: "Mutant Grandpa #12534",
      attributes: [
        { trait_type: "Legendary Grandpa", value: "Mega Stoner Grandpa" }
      ],
      image:
        "https://ipfs.io/ipfs/QmT8tg965zdQtf4vCuFyw4JbWZnXT3j5Lox61XjJCm8hXS",
      image_url:
        "https://ipfs.io/ipfs/QmT8tg965zdQtf4vCuFyw4JbWZnXT3j5Lox61XjJCm8hXS",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      "RevealedMetadata",
      metadata,
      {},
      { metadata: { type: new Sequelize.JSON() } }
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
