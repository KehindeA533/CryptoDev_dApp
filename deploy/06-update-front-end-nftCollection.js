const { ethers } = require('hardhat')
const fs = require('fs')

const FRONTEND_ADDRESSES_FILE =
  '../Crypto Dev/frontend/nft_collection/constants/contractAddress.json'

const FRONTEND_ABI_FILE =
  '../Crypto Dev/frontend/nft_collection/constants/abi.json'

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log('Updating frontend...')
    updateContractAddresses()
    updateAbi()
    console.log('Front end written!')
  }
}

async function updateAbi() {
  const nftCollection = await ethers.getContract('NFTCollection')
  fs.writeFileSync(
    FRONTEND_ABI_FILE,
    nftCollection.interface.format(ethers.utils.FormatTypes.json)
  )
}

async function updateContractAddresses() {
  const nftCollection = await ethers.getContract('NFTCollection')
  const chainId = network.config.chainId.toString()
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, 'utf8')
  )

  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(nftCollection.address)) {
      currentAddresses[chainId].push(nftCollection.address)
    }
  } else {
    currentAddresses[chainId] = [nftCollection.address]
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ['all', 'frontendNFT']
