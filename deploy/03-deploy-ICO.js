const { network } = require('hardhat')
const { nftCollectionContract } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  const args = [nftCollectionContract]

  //deploy contract
  const ico = await deploy('ICO', {
    from: deployer,
    args: args,
    log: true,
  })

  log('-----------------------------------------')
  log(`Contract ICO deployed at: ${ico.address}`)
  log('-----------------------------------------')

  //verify Contract
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(ico.address, args)
    log('-----------------------------------------')
    log('Contract verified succesfully')
    log('-----------------------------------------')
  }
}

module.exports.tags = ['all', 'ico']
