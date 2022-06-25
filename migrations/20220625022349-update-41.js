'use strict';

var metadata = [{token: "41", metadata: {"name": "Mutant Grandpa #41", "attributes": [{"trait_type": "Background", "value": "M1 Purple"}, {"trait_type": "Fur", "value": "M1 White"}, {"trait_type": "Clothes", "value": "M1 Blue Plaid Short Sleeve Shirt"}, {"trait_type": "Eyes", "value": "M1 Potter"}, {"trait_type": "Mouth", "value": "M1 Mr Chip"}, {"trait_type": "Headwear", "value": "M1 Fedora"}, {"trait_type": "Earring", "value": "M1 None"}], "image": "https://ipfs.io/ipfs/QmQ5iC4trtqQ6P8qK2n2aWGe2MQzV8rMebuPBp8oRyJU3u", "image_url": "https://ipfs.io/ipfs/QmQ5iC4trtqQ6P8qK2n2aWGe2MQzV8rMebuPBp8oRyJU3u"},createdAt: new Date(),updatedAt: new Date()}]

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
