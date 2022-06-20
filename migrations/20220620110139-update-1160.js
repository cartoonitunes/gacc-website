'use strict';

var metadata = [{token: "1160", metadata: {"name": "Mutant Grandpa #1160", "attributes": [{"trait_type": "Background", "value": "M2 Pink"}, {"trait_type": "Fur", "value": "M2 Gold"}, {"trait_type": "Clothes", "value": "M2 None"}, {"trait_type": "Eyes", "value": "M2 Demon"}, {"trait_type": "Mouth", "value": "M2 Vampire"}, {"trait_type": "Headwear", "value": "M2 King's Crown"}, {"trait_type": "Earring", "value": "M2 Gold Stud"}], "image": "https://ipfs.io/ipfs/QmSSoYFbS4BJ1DndKrUEEe8yF8T3qNbgSvtmtBXZzLYbh6", "image_url": "https://ipfs.io/ipfs/QmSSoYFbS4BJ1DndKrUEEe8yF8T3qNbgSvtmtBXZzLYbh6"},createdAt: new Date(),updatedAt: new Date()}]

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
