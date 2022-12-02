const { verify } = require('../utils/verify')
const { network } = require('hardhat')
const { whitelistContract, metadataURL } = require('../helper-hardhat-config')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  //Args
  const args = [metadataURL, whitelistContract]

  const nftCollection = await deploy('NFTCollection', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })

  log('---------------------------------------------------------------')
  log('Contract NFTCollection deployed to:', nftCollection.address)
  log('---------------------------------------------------------------')

  // Verify the deployment
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(nftCollection.address, args)
  }

  log('-----------------------------------------')
}

module.exports.tags = ['all', 'nftCollection']
