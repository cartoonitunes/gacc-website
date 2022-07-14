'use strict';

var metadata = [{token: "43", metadata: {"name": "Mutant Grandpa #43", "attributes": [{"trait_type": "Background", "value": "M1 Yellow"}, {"trait_type": "Fur", "value": "M1 Black"}, {"trait_type": "Clothes", "value": "M1 Zipper Hoodie"}, {"trait_type": "Eyes", "value": "M1 Irritated"}, {"trait_type": "Mouth", "value": "M1 Sheriff"}, {"trait_type": "Headwear", "value": "M1 Navy Backwards Snapback"}], "image": "https://ipfs.io/ipfs/QmfA3FQskc3cyKWLYDiFRR9nioCavidBHyQ5WhoTsy6RTL", "image_url": "https://ipfs.io/ipfs/QmfA3FQskc3cyKWLYDiFRR9nioCavidBHyQ5WhoTsy6RTL"},createdAt: new Date(),updatedAt: new Date()}]

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('RevealedMetadata', metadata, {}, { metadata: { type: new Sequelize.JSON() }} )
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
