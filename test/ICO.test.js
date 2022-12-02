// const { expect, assert } = require('chai')
// const { getNamedAccounts, deployments, ethers } = require('hardhat')

// describe('ICO Unit Testing', () => {
//   let deployer, ico, nftCollection, tokenPrice, nftPrice
//   beforeEach(async () => {
//     deployer = (await getNamedAccounts()).deployer
//     await deployments.fixture(['all'])
//     ico = await ethers.getContract('ICO', deployer)
//     nftCollection = await ethers.getContract('NFTCollection', deployer)
//     tokenPrice = await ico.getTokenPrice()
//     nftPrice = await nftCollection.getPrice()
//   })

//   //mint
//   describe('mint', async () => {
//     it('Fails if not enough ETH is sent', async () => {
//       await expect(ico.mint(1)).to.be.revertedWithCustomError(
//         ico,
//         'mint_NotEnoughETHSent'
//       )
//     })
//     it('Fails if CryptoDevTokens attempts to go over max', async () => {
//       const maxTotalSupply = await ico.getMaxTotalSupply()
//       const requiredAmount = tokenPrice * maxTotalSupply
//       ico.mint(10000, { value: requiredAmount })

//       await expect(
//         ico.mint(1, { value: tokenPrice })
//       ).to.be.revertedWithCustomError(ico, 'mint_ExceedsTheMaxTotalSupply')
//     })
//   })

//   //   //claim
//   describe('claim', async () => {
//     it('Fails if you do not own any CryptoDev NFT', async () => {
//       await expect(ico.claim()).to.be.revertedWithCustomError(
//         ico,
//         'claim_NoNFTOwned'
//       )
//     })
//     it('Crypto Dev NFT holder should get 10 tokens for free per NFT', async () => {
//       await nftCollection.startPresale()

//       // increase the time by 5 minutes
//       await network.provider.send('evm_increaseTime', [300])
//       await network.provider.send('evm_mine', [])

//       //Get NFT from nftCollection contract
//       await nftCollection.mint({ value: nftPrice })

//       //Claim 10 token with nft
//       await ico.claim()

//       //Get current amount of token owned
//       const balance = await ico.balanceOf(deployer)

//       const tokenPerNFT = await ico.getNumOfTokenPerNFT()

//       assert.equal(balance.toString(), tokenPerNFT.toString())
//     })
//     it('Fails if you try to claim tokens with the same NFT twice', async () => {
//       await nftCollection.startPresale()

//       // increase the time by 5 minutes
//       await network.provider.send('evm_increaseTime', [300])
//       await network.provider.send('evm_mine', [])

//       //Get NFT from nftCollection contract
//       await nftCollection.mint({ value: nftPrice })

//       //Claim 10 token with nft
//       await ico.claim()

//       await expect(ico.claim()).to.be.revertedWithCustomError(
//         ico,
//         'claim_TokensAlreadyClaim'
//       )
//     })
//   })

//   //   //withdraw
//   describe('withdraw', async () => {
//     it('sends money to owner', async () => {
//       const user = await ethers.getSigners()
//       const deployerBalanceBefore = await ethers.provider.getBalance(deployer)
//       const userConnectToICO = ico.connect(user[1])

//       //start NFT Collection Presale
//       await nftCollection.startPresale()

//       // increase the time by 5 minutes
//       await network.provider.send('evm_increaseTime', [300])
//       await network.provider.send('evm_mine', [])

//       userConnectToICO.mint(1, { value: tokenPrice })

//       await ico.withdraw()

//       const deployerBalanceAfter = await ethers.provider.getBalance(deployer)

//       const BalanceBefore = ethers.utils.formatEther(deployerBalanceBefore)
//       const BalanceAfter = ethers.utils.formatEther(deployerBalanceAfter)

//       assert(BalanceBefore > BalanceAfter)
//     })
//   })
// })
