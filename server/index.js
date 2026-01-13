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

// Polyfill fetch for Node.js 16 (fetch is not available natively)
const fetch = require('node-fetch');
const db = require("../models/index.js");
const PORT = process.env.PORT || 3001;
const gakc_ranks = require('./ranks/gakc.js');
const macc_ranks = require('./ranks/macc.js');
const gacc_ranks = require('./ranks/gacc.js');
const nftStories = require('./data/nft-stories.json');

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

//MACC
app.get("/api/macc/ranks/:id", function (req, res) {
  let token = req.params.id;
  try {
    token = token.toString();
    kitten_rank = macc_ranks[token];
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


// API endpoint to fetch Grandpa Coin price in ETH (avoids CORS issues)
app.get("/api/grandpa-price", async (req, res) => {
  try {
    const GRANDPA_COIN_ADDRESS = "0x20BFd82E6AD6A39cf4bD1F803e662FC065cD3d5F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    // Try Uniswap V3 subgraph
    const subgraphQuery = `
      {
        pools(
          where: {
            or: [
              {token0: "${WETH_ADDRESS}", token1: "${GRANDPA_COIN_ADDRESS.toLowerCase()}"},
              {token0: "${GRANDPA_COIN_ADDRESS.toLowerCase()}", token1: "${WETH_ADDRESS}"}
            ]
          },
          orderBy: totalValueLockedUSD,
          orderDirection: desc,
          first: 1
        ) {
          token0 {
            id
          }
          token1 {
            id
          }
          token0Price
          token1Price
        }
      }
    `;
    
    const subgraphResponse = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: subgraphQuery })
    });
    
    const result = await subgraphResponse.json();
    if (result.data && result.data.pools && result.data.pools.length > 0) {
      const pool = result.data.pools[0];
      let priceInETH;
      
      // Check which token is ETH (WETH address)
      if (pool.token0.id.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
        // ETH is token0, so token0Price is ETH per GRANDPA
        // We need GRANDPA per ETH, which is 1/token0Price
        priceInETH = 1 / parseFloat(pool.token0Price);
      } else {
        // ETH is token1, so token1Price is GRANDPA per ETH
        priceInETH = parseFloat(pool.token1Price);
      }
      
      if (priceInETH && !isNaN(priceInETH) && isFinite(priceInETH)) {
        return res.json({ priceInETH });
      }
    }
    
    // Fallback: Try CoinGecko
    const coingeckoResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${GRANDPA_COIN_ADDRESS}&vs_currencies=eth`
    );
    const coingeckoData = await coingeckoResponse.json();
    
    if (coingeckoData[GRANDPA_COIN_ADDRESS.toLowerCase()] && coingeckoData[GRANDPA_COIN_ADDRESS.toLowerCase()].eth) {
      return res.json({ priceInETH: coingeckoData[GRANDPA_COIN_ADDRESS.toLowerCase()].eth });
    }
    
    return res.status(404).json({ error: 'Price not found' });
  } catch (error) {
    console.error('Error fetching Grandpa Coin price:', error);
    return res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// API endpoint to fetch NFT metadata from OpenSea
app.post("/api/nft-metadata", async (req, res) => {
  try {
    const { contractAddress, tokenId } = req.body;
    
    if (!contractAddress || tokenId === undefined) {
      return res.status(400).json({ error: 'contractAddress and tokenId are required' });
    }
    
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || "23d5bad506884e4bb45477a239944d3e";
    const url = `https://api.opensea.io/api/v2/metadata/ethereum/${contractAddress}/${tokenId}`;
    
    const response = await fetch(url, {
      headers: {
        "accept": "*/*",
        "x-api-key": OPENSEA_API_KEY
      }
    });
    
    if (!response.ok) {
      // If 404 or other error, return null metadata instead of error
      if (response.status === 404) {
        return res.json({ 
          contractAddress, 
          tokenId, 
          metadata: null,
          error: 'NFT metadata not found'
        });
      }
      throw new Error(`OpenSea API error: ${response.status}`);
    }
    
    const metadata = await response.json();
    return res.json({ 
      contractAddress, 
      tokenId, 
      metadata 
    });
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch NFT metadata',
      details: error.message 
    });
  }
});

// Endpoint to fetch sender addresses for NFTs using Moralis API
app.post("/api/nft-senders", async (req, res) => {
  try {
    const { nfts, countryClubAddress } = req.body; // Array of {collection, tokenId, joinedAt}
    
    if (!Array.isArray(nfts) || nfts.length === 0) {
      return res.status(400).json({ error: 'nfts array is required' });
    }
    
    if (!countryClubAddress) {
      return res.status(400).json({ error: 'countryClubAddress is required' });
    }
    
    const COUNTRY_CLUB_ADDRESS = countryClubAddress.toLowerCase();
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "YOUR_API_KEY";
    
    const results = {};
    
    // Query transfers for each NFT using Moralis API
    for (const nft of nfts) {
      try {
        const collection = nft.collection.toLowerCase();
        const tokenId = nft.tokenId;
        
        // Moralis API endpoint for NFT transfers
        const url = `https://deep-index.moralis.io/api/v2.2/nft/${collection}/${tokenId}/transfers?chain=eth&format=decimal&limit=25&order=DESC`;
        
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "X-API-Key": MORALIS_API_KEY
          }
        });
        
        if (!response.ok) {
          console.error(`Moralis API error for ${collection}/${tokenId}: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        // Find the transfer where to_address matches Country Club
        const transferToCountryClub = data.result?.find(transfer => 
          transfer.to_address?.toLowerCase() === COUNTRY_CLUB_ADDRESS
        );
        
        if (transferToCountryClub) {
          const key = `${collection}-${tokenId}`;
          results[key] = {
            collection: collection,
            tokenId: tokenId,
            sender: transferToCountryClub.from_address,
            senderLabel: transferToCountryClub.from_address_label,
            senderEntity: transferToCountryClub.from_address_entity,
            transactionHash: transferToCountryClub.transaction_hash,
            blockNumber: transferToCountryClub.block_number,
            blockTimestamp: transferToCountryClub.block_timestamp
          };
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching transfers for NFT ${nft.collection}/${nft.tokenId}:`, error);
        // Continue with other NFTs
      }
    }
    
    return res.json({ results });
  } catch (error) {
    console.error('Error in NFT senders fetch:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch NFT senders',
      details: error.message 
    });
  }
});

// Batch endpoint to fetch multiple NFT metadata
app.post("/api/nft-metadata-batch", async (req, res) => {
  try {
    const { nfts } = req.body; // Array of {contractAddress, tokenId}
    
    if (!Array.isArray(nfts) || nfts.length === 0) {
      return res.status(400).json({ error: 'nfts array is required' });
    }
    
    // Limit batch size to avoid overwhelming the API
    const maxBatchSize = 20;
    const nftsToFetch = nfts.slice(0, maxBatchSize);
    
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || "23d5bad506884e4bb45477a239944d3e";
    const results = [];
    
    // Fetch metadata for each NFT (with rate limiting consideration)
    for (const nft of nftsToFetch) {
      try {
        // Use OpenSea metadata API - returns image URL directly in "image" field
        const metadataUrl = `https://api.opensea.io/api/v2/metadata/ethereum/${nft.contractAddress}/${nft.tokenId}`;
        const response = await fetch(metadataUrl, {
          headers: {
            "accept": "*/*",
            "x-api-key": OPENSEA_API_KEY
          }
        });
        
        if (response.ok) {
          const metadata = await response.json();
          // OpenSea metadata API returns: { name, image, description, traits, ... }
          // The image field contains the direct URL
          results.push({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            metadata: {
              image: metadata.image || null,
              name: metadata.name || null
            }
          });
        } else {
          console.error(`OpenSea API error for ${nft.contractAddress}/${nft.tokenId}: ${response.status} ${response.statusText}`);
          results.push({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            metadata: null,
            error: `HTTP ${response.status}`
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching metadata for ${nft.contractAddress}/${nft.tokenId}:`, error);
        results.push({
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          metadata: null,
          error: error.message
        });
      }
    }
    
    return res.json({ results });
  } catch (error) {
    console.error('Error in batch NFT metadata fetch:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch NFT metadata',
      details: error.message 
    });
  }
});

// API endpoint to fetch GACC floor price from OpenSea
app.get("/api/gacc-floor-price", async (req, res) => {
  try {
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || "23d5bad506884e4bb45477a239944d3e";
    const GACC_COLLECTION_ADDRESS = "0x4B103d07C18798365946E76845EDC6b565779402";
    
    // Try collection stats endpoint with different slugs
    const collectionSlugs = [
      'grandpaapecountryclub'
    ];
    
    for (const slug of collectionSlugs) {
      try {
        const url = `https://api.opensea.io/api/v2/collections/${slug}/stats`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'x-api-key': OPENSEA_API_KEY
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Floor price is in data.total.floor_price based on OpenSea API response structure
          if (data.total && data.total.floor_price !== undefined && data.total.floor_price !== null) {
            return res.json({ 
              floorPrice: parseFloat(data.total.floor_price),
              source: 'opensea_stats'
            });
          }
        } else {
          const errorText = await response.text();
          console.error(`OpenSea API error for ${slug}: ${response.status} ${response.statusText}`, errorText);
        }
      } catch (err) {
        console.error(`Error fetching floor price for slug ${slug}:`, err);
        continue;
      }
    }
    
    // Fallback: Try using the contract address with listings endpoint
    try {
      const listingsUrl = `https://api.opensea.io/api/v2/orders/ethereum/seaport/listings?asset_contract_address=${GACC_COLLECTION_ADDRESS}&order_by=eth_price&order_direction=asc&limit=1`;
      const listingsResponse = await fetch(listingsUrl, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': OPENSEA_API_KEY
        }
      });
      
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        if (listingsData.orders && listingsData.orders.length > 0) {
          const order = listingsData.orders[0];
          // Extract ETH price from the order
          if (order.current_price) {
            const priceInWei = order.current_price;
            const priceInEth = parseFloat(priceInWei) / 1e18;
            return res.json({ 
              floorPrice: priceInEth,
              source: 'opensea_listings'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching floor price from listings:', err);
    }
    
    return res.status(404).json({ error: 'Floor price not found' });
  } catch (error) {
    console.error('Error fetching floor price:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch floor price',
      details: error.message 
    });
  }
});

// NFT Stories endpoints
app.get("/api/nft-stories", (_req, res) => {
  try {
    // Convert object to array and sort by tokenId
    const storiesArray = Object.values(nftStories).sort((a, b) =>
      parseInt(a.tokenId) - parseInt(b.tokenId)
    );

    return res.json({
      success: true,
      stories: storiesArray
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stories',
      details: error.message
    });
  }
});

app.get("/api/nft-stories/:tokenId", (req, res) => {
  try {
    const { tokenId } = req.params;
    const story = nftStories[tokenId];

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found for this token ID'
      });
    }

    return res.json({
      success: true,
      story: story
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch story',
      details: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "/client/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
