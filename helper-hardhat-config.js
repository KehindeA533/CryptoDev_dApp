const { ethers } = require('hardhat')

const networkConfig = {
  31337: {
    name: 'hardhat',
  },
  5: {
    name: 'goerli',
  },
}

// Address of the whitelist contract
const whitelistContract = '0x6c5c4C02a9cdcb8e5F6612c3812B1a0f1a55886f'

// URL from where we can extract the metadata for a Crypto Dev NFT
const metadataURL =
  'https://crypto-dev-nft-collection-frontend-4fb9.vercel.app/api/'

// Address of the NTF-CollectionContract contract
const nftCollectionContract = '0x5c416F3b3A312355436797602641429cfb38861c'

const developmentChains = ['hardhat', 'localhost']

module.exports = {
  networkConfig,
  developmentChains,
  whitelistContract,
  metadataURL,
  nftCollectionContract,
}
