const {MerkleTree} = require("merkletreejs")
const keccak256 = require("keccak256")

let wl = ["0xBa7d775926E96407108a589a453A27257E78E541","0xF66Ac2C80AaeFF89b081Ff911E80E7DAEB9D0af6"]
let leaves = wl.map(addr => keccak256(addr))
let wlMerkleTree = new MerkleTree(leaves, keccak256, {sortPairs: true})

let wlFree = ["0xc6ec5EB6a989aB8C3D26343F71a86fde504C5Ad1"]
let freeLeaves = wlFree.map(addr => keccak256(addr))
let wlFreeMerkleTree = new MerkleTree(freeLeaves, keccak256, {sortPairs: true})


let wlMulti = ["0x52CF679Dd12a8A6C8C035A18515434EC98Aa07Ab"]
let multiLeaves = wlMulti.map(addr => keccak256(addr))
let wlMultiMerkleTree = new MerkleTree(multiLeaves, keccak256, {sortPairs: true})

module.exports = {wlFreeMerkleTree, wlMerkleTree, wlMultiMerkleTree}