const { network } = require('hardhat')
const { nftCollectionContract } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  const nftMarketplace = await deploy('NFTMarketplace', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  })

  const nftMarketplaceAddress = nftMarketplace.address

  log('-----------------------------------------')
  log(`NFTMarketplace Contract deployed at: ${nftMarketplace.address}`)
  log('-----------------------------------------')

  //Verify the deployment
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(nftMarketplace.address, [])
    log('-----------------------------------------')
    log('Contract verified succesfully')
    log('-----------------------------------------')
  }

  //Args
  const args = [nftMarketplaceAddress, nftCollectionContract]

  const cryptoDevDao = await deploy('CryptoDevDAO', {
    from: deployer,
    args: args,
    log: true,
    value: ethers.utils.parseEther('1'),
    waitConfirmations: network.config.blockConfirmation || 1,
  })

  log('-----------------------------------------')
  log(`CryptoDevDAO Contract deployed at: ${cryptoDevDao.address}`)
  log('-----------------------------------------')

  //Verify Contract
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(cryptoDevDao.address, args)
    log('-----------------------------------------')
    log('Contract verified succesfully')
    log('-----------------------------------------')
  }
}

module.exports.tags = ['all', 'cryptoDevDao']
