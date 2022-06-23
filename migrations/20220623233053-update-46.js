'use strict';

var metadata = [{token: "46", metadata: {"name": "Mutant Grandpa #46", "attributes": [{"trait_type": "Background", "value": "M1 Aquamarine"}, {"trait_type": "Fur", "value": "M1 Diamond"}, {"trait_type": "Clothes", "value": "M1 Chain"}, {"trait_type": "Eyes", "value": "M1 Irritated"}, {"trait_type": "Mouth", "value": "M1 Grin"}, {"trait_type": "Headwear", "value": "M1 Chef Hat"}, {"trait_type": "Earring", "value": "M1 Gold Hoop"}], "image": "https://ipfs.io/ipfs/QmWHn4gEUpN266fgb61zgCMbLL6ijYHaNVZX1kXj6ETg79", "image_url": "https://ipfs.io/ipfs/QmWHn4gEUpN266fgb61zgCMbLL6ijYHaNVZX1kXj6ETg79"},createdAt: new Date(),updatedAt: new Date()}]

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
