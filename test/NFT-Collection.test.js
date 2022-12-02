const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')
const { developmentChains, metadataURL } = require('../helper-hardhat-config')

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('NFTCollection Unit Tests', () => {
      let nftCollection, whitelist, deployer, nftPrice

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer // Global
        // const { deployer } = await getNamedAccounts() // Not Global
        await deployments.fixture(['all'])
        nftCollection = await ethers.getContract('NFTCollection', deployer)
        whitelist = await ethers.getContract('Whitelist', deployer)
        nftPrice = await nftCollection.getPrice()
      })

      //Test constructor
      describe('Constructor', async () => {
        it('Intializes the baseURI correctly', async () => {
          const baseURI = await nftCollection.getBaseURI()
          assert.equal(baseURI, metadataURL)
        })
        describe('startPresale', async () => {
          it('presaleStarted returns true when startPresale is called', async () => {
            await nftCollection.startPresale()
            const presaleStarted = await nftCollection.getpresaleState()
            assert(presaleStarted)
          })
          it('presaleEnded time is set correctly', async () => {
            await nftCollection.startPresale()
            const presaleEnded = await nftCollection.getpresaleEnded()

            // increase the time by 5 minutes
            await network.provider.send('evm_increaseTime', [300])
            await network.provider.send('evm_mine', [])

            //Get current timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber()
            const blockBefore = await ethers.provider.getBlock(blockNumBefore)
            const expectedTime = blockBefore.timestamp
            assert.equal(presaleEnded.toNumber(), expectedTime)
          })
          describe('presaleMint', async () => {
            it("Fails if presale hasn't started yet", async () => {
              await expect(
                nftCollection.presaleMint()
              ).to.be.revertedWithCustomError(
                nftCollection,
                'presaleMint_PresaleHasNotStarted'
              )
            })
            it('Fails if presale has eneded', async () => {
              await nftCollection.startPresale()

              // increase the time by 5 minutes
              await network.provider.send('evm_increaseTime', [300])
              await network.provider.send('evm_mine', [])
              await expect(
                nftCollection.presaleMint()
              ).to.be.revertedWithCustomError(
                nftCollection,
                'presaleMint_PresaleHasNotStarted'
              )
            })
            it('Fails if address isnt on whitelist', async () => {
              await nftCollection.startPresale()
              await expect(
                nftCollection.presaleMint({ value: nftPrice })
              ).to.be.revertedWithCustomError(
                nftCollection,
                'presaleMint_NotOnWhitelist'
              )
            })
            // it('Fails if tokenId attempts to go over max', async () => {
            //   await nftCollection.startPresale()
            //   const additionalUser = 11
            //   const startingUserIndex = 1 // deployer = 0
            //   const accounts = await ethers.getSigners()
            //   for (
            //     let i = startingUserIndex;
            //     i <= startingUserIndex + additionalUser;
            //     i++
            //   ) {
            //     //Add address to whitelist
            //     const userAddToWhitelist = whitelist.connect(accounts[i])
            //     await userAddToWhitelist.addAddressToWhitelist()

            //     //presaleMint
            //     const userAddToNFTCollection = nftCollection.connect(
            //       accounts[i]
            //     )
            //     await userAddToNFTCollection.presaleMint({ value: nftPrice })
            //   }

            //   const numOfTokens = await nftCollection.getTokenIds()
            //   console.log(numOfTokens.toNumber())
            // })
            it('fails if not enough ETH is sent', async () => {
              await whitelist.addAddressToWhitelist()
              await nftCollection.startPresale()
              await expect(
                nftCollection.presaleMint()
              ).to.be.revertedWithCustomError(
                nftCollection,
                'presaleMint_NotEnoughETHSent'
              )
            })
          })
          describe('mint', async () => {
            it('fails if presale hasnt ended yet', async () => {
              await nftCollection.startPresale()
              await expect(nftCollection.mint()).to.be.revertedWithCustomError(
                nftCollection,
                'mint_PresaleHasNotEnded'
              )
            })
            it('fails if presale hasnt started yet', async () => {
              // increase the time by 5 minutes
              await network.provider.send('evm_increaseTime', [300])
              await network.provider.send('evm_mine', [])

              await expect(nftCollection.mint()).to.be.revertedWithCustomError(
                nftCollection,
                'mint_PresaleHasNotEnded'
              )
            })
            it('Fails if tokenId attempts to go over max', async () => {
              await nftCollection.startPresale()

              // increase the time by 5 minutes
              await network.provider.send('evm_increaseTime', [300])
              await network.provider.send('evm_mine', [])

              for (let i = 1; i <= 20; i++) {
                await nftCollection.mint({ value: nftPrice })
              }

              await expect(nftCollection.mint()).to.be.revertedWithCustomError(
                nftCollection,
                'mint_ExceededMaximumSupply'
              )
            })
            it('fails if not enough ETH is sent', async () => {
              //Start presale
              await nftCollection.startPresale()

              // increase the time by 5 minutes presale has ended now
              await network.provider.send('evm_increaseTime', [300])
              await network.provider.send('evm_mine', [])

              await expect(nftCollection.mint()).to.be.revertedWithCustomError(
                nftCollection,
                'mint_NotEnoughETHSent'
              )
            })
          })
          describe('withdraw', async () => {
            it('sends money to owner *presale*', async () => {
              const accounts = await ethers.getSigners()
              const deployerBalanceBefore = await ethers.provider.getBalance(
                deployer
              )
              const whitelistUser = whitelist.connect(accounts[1])
              const nftCollectionUser = nftCollection.connect(accounts[1])

              await whitelistUser.addAddressToWhitelist()
              await nftCollection.startPresale()
              await nftCollectionUser.presaleMint({ value: nftPrice })

              const txResponse = await nftCollection.withdraw()
              const transactionReceipt = await txResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const deployerBalanceAfter = await ethers.provider.getBalance(
                deployer
              )

              assert.equal(
                deployerBalanceAfter.add(gasCost).toString(),
                deployerBalanceBefore.toString()
              )
            })
            it('sends money to owner *after presale*', async () => {
              const accounts = await ethers.getSigners()
              const deployerBalanceBefore = await ethers.provider.getBalance(
                deployer
              )
              const whitelistUser = whitelist.connect(accounts[1])
              const nftCollectionUser = nftCollection.connect(accounts[1])

              await whitelistUser.addAddressToWhitelist()
              await nftCollection.startPresale()

              await network.provider.send('evm_increaseTime', [300])
              await network.provider.send('evm_mine', [])

              await nftCollectionUser.mint({ value: nftPrice })

              const txResponse = await nftCollection.withdraw()
              const transactionReceipt = await txResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const deployerBalanceAfter = await ethers.provider.getBalance(
                deployer
              )

              assert.equal(
                deployerBalanceAfter.add(gasCost).toString(),
                deployerBalanceBefore.toString()
              )
            })
          })
        })
      })
    })
