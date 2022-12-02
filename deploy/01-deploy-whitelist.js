const { verify } = require('../utils/verify')
const { network } = require('hardhat')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  //Args
  const maxWhitelistedAddresses = 10

  const args = [maxWhitelistedAddresses]

  const whitelist = await deploy('Whitelist', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })

  log('-----------------------------------------')
  log(`Contract whitelist deployed at: ${whitelist.address}`)
  log('-----------------------------------------')

  // Verify the deployment
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(whitelist.address, args)
  }

  log('-----------------------------------------')
}

module.exports.tags = ['all', 'whitelist']
