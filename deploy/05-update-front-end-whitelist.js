const { ethers } = require('hardhat')
const fs = require('fs')

const FRONTEND_ADDRESSES_FILE =
  '../Crypto Dev/frontend/whitelist/constants/contractAddress.json'

const FRONTEND_ABI_FILE = '../Crypto Dev/frontend/whitelist/constants/abi.json'

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log('Updating frontend...')
    updateContractAddresses()
    updateAbi()
    console.log('Front end written!')
  }
}

async function updateAbi() {
  const whitelist = await ethers.getContract('Whitelist')
  fs.writeFileSync(
    FRONTEND_ABI_FILE,
    whitelist.interface.format(ethers.utils.FormatTypes.json)
  )
}

async function updateContractAddresses() {
  const whitelist = await ethers.getContract('Whitelist')
  const chainId = network.config.chainId.toString()
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, 'utf8')
  )

  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(whitelist.address)) {
      currentAddresses[chainId].push(whitelist.address)
    }
  } else {
    currentAddresses[chainId] = [whitelist.address]
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ['all', 'frontend']
