const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Whitelist Uint Tests', () => {
      let whitelist, deployer

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(['all'])
        whitelist = await ethers.getContract('Whitelist', deployer)
      })

      // Test Constructor
      describe('Constructor', async () => {
        it('Initializes the maxWhitelistedAddresses correctly', async () => {
          const maxWhitelistedAddresses =
            await whitelist.getMaxWhitelistedAddresses()

          assert.equal(maxWhitelistedAddresses.toString(), '10')
        })
      })
      describe('addAddressToWhitelist', async () => {
        it('Fails if the user has already been whitelisted', async () => {
          await whitelist.addAddressToWhitelist()

          await expect(
            whitelist.addAddressToWhitelist()
          ).to.be.revertedWithCustomError(
            whitelist,
            'addAddressToWhitelist_SenderAlreadyWhitelisted'
          )
        })
        it('Fails if WhitelistedAddresses attempts to go over max', async () => {
          //Conect 10 additional users accounts to contract
          const additionalUser = 10
          const startingUserIndex = 1 // deployer = 0

          const accounts = await ethers.getSigners()

          for (
            let i = startingUserIndex;
            i <= startingUserIndex + additionalUser;
            i++
          ) {
            const userAddToWhitelist = whitelist.connect(accounts[i])
            await userAddToWhitelist.addAddressToWhitelist()
          }

          await expect(
            whitelist.addAddressToWhitelist()
          ).to.be.revertedWithCustomError(
            whitelist,
            'addAddressToWhitelist_AddressesLimitReached'
          )
        })
        it('returns true if address is add to the whitelistedAddress array', async () => {
          await whitelist.addAddressToWhitelist()

          const expectedAddresses = await whitelist.getWhitelistedAddresses(
            deployer
          )

          assert(expectedAddresses)
        })
        it('Number of whitelisted addresses is updated', async () => {
          await whitelist.addAddressToWhitelist()

          const numAddressesWhitelisted =
            await whitelist.getNumAddressesWhitelisted()

          assert(numAddressesWhitelisted.toString(), '1')
        })
      })
    })
