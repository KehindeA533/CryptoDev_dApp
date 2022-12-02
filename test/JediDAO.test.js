const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')

describe('Jedi DAO Unit Tests', () => {
  let deployer,
    cryptoDevDao,
    nftCollection,
    nftMarketplace,
    nftPrice,
    basicNftTwo
  const TOKEN_ID = 0

  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(['all'])
    cryptoDevDao = await ethers.getContract('CryptoDevDAO', deployer)
    nftMarketplace = await ethers.getContract('NFTMarketplace', deployer)
    nftCollection = await ethers.getContract('NFTCollection', deployer)
    nftPrice = await nftCollection.getPrice()

    await nftCollection.startPresale()

    // increase the time by 5 minutes
    await network.provider.send('evm_increaseTime', [300])
    await network.provider.send('evm_mine', [])

    //Get NFT from nftCollection contract
    await nftCollection.mint({ value: nftPrice })
  })

  //createProposal
  describe('createProposal', async () => {
    it('Fails if not a CryptoDev NFT owner', async () => {
      const user = await ethers.getSigners()
      const userToCryptoDevDao = cryptoDevDao.connect(user[1])
      await expect(
        userToCryptoDevDao.createProposal(TOKEN_ID)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'nftHolderOnly_NotADAOMember'
      )
    })
    it('Fails if NFT is not for sale', async () => {
      const NFTPRICE = await nftMarketplace.getNFTPrice()
      await nftMarketplace.purchase(TOKEN_ID, { value: NFTPRICE })
      await expect(
        cryptoDevDao.createProposal(TOKEN_ID)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'createProposal_NFTNotForSale'
      )
    })
    it('Intializes the NFT tokenID correctly', async () => {
      await cryptoDevDao.createProposal(TOKEN_ID)
      const nftTokenID = await cryptoDevDao.getProposalNftTokenId(TOKEN_ID)

      assert.equal(nftTokenID, TOKEN_ID)
    })
    it('Intializes the deadline correctly', async () => {
      await cryptoDevDao.createProposal(TOKEN_ID)

      const blockNum = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(blockNum)
      const timestamp = block.timestamp
      const expectedDeadline = timestamp + 300

      const deadline = await cryptoDevDao.getProposalDeadline(TOKEN_ID)

      assert.equal(deadline.toNumber(), expectedDeadline)
    })
    it('increments the numProposals correctly', async () => {
      await cryptoDevDao.createProposal(TOKEN_ID)
      const numProposals = await cryptoDevDao.getNumProposals()
      assert.equal(numProposals, 1)
    })
    it('returns the numProposals correctly', async () => {
      const expectedReturnValue = await cryptoDevDao.callStatic.createProposal(
        TOKEN_ID
      )

      assert.equal(expectedReturnValue.toNumber(), 0)
    })
  })

  //voteOnProposal
  describe('voteOnProposal', async () => {
    it('Fails if not a CryptoDev NFT owner', async () => {
      const user = await ethers.getSigners()
      const userToCryptoDevDao = cryptoDevDao.connect(user[1])
      await cryptoDevDao.createProposal(TOKEN_ID)
      await expect(
        userToCryptoDevDao.voteOnProposal(TOKEN_ID, 0)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'nftHolderOnly_NotADAOMember'
      )
    })
    it('Fails if specified proposal has ended already', async () => {
      await cryptoDevDao.createProposal(TOKEN_ID)

      //increase the time by 5 minutes
      await network.provider.send('evm_increaseTime', [300])
      await network.provider.send('evm_mine', [])

      await expect(
        cryptoDevDao.voteOnProposal(TOKEN_ID, 0)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'activeProposalOnly_DeadlineExceeded'
      )
    })
    it('Intializes the NFT balance correctly', async () => {
      //Get NFT from nftCollection contract
      await nftCollection.mint({ value: nftPrice })

      await cryptoDevDao.createProposal(TOKEN_ID)
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)
      const nftBalance = await nftCollection.balanceOf(deployer)
      assert.equal(nftBalance.toNumber(), 2)
    })
    it('Fails if user already voted', async () => {
      await cryptoDevDao.createProposal(TOKEN_ID)
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)

      await expect(
        cryptoDevDao.voteOnProposal(TOKEN_ID, 0)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'voteOnProposal_AlreadyVoted'
      )
    })
    it('increments the yayVotes & NayVotes correctly', async () => {
      const user = await ethers.getSigners()

      //User connect to nftCollection contract
      const userToNftCollection = nftCollection.connect(user[1])

      //user mint NFT from nftCollection contract
      await userToNftCollection.mint({ value: nftPrice })

      //User connect to CryptoDevDao contract
      const userToCryptoDevDao = cryptoDevDao.connect(user[1])

      //deployer creates proposal from CryptoDevDao contract
      await cryptoDevDao.createProposal(TOKEN_ID)

      //deployer votes yay on proposal
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)

      //user votes nay on proposal
      await userToCryptoDevDao.voteOnProposal(TOKEN_ID, 1)

      const yayVotes = await cryptoDevDao.getProposalYayVotes(TOKEN_ID)
      const nayVotes = await cryptoDevDao.getProposalNayVotes(TOKEN_ID)

      assert.equal(yayVotes, 1)
      assert.equal(nayVotes, 1)
    })
  })

  //   //excuteProposal
  describe('excuteProposal', async () => {
    it('Fails if not a CryptoDev NFT owner', async () => {
      const user = await ethers.getSigners()
      const userToCryptoDevDao = cryptoDevDao.connect(user[1])
      await cryptoDevDao.createProposal(TOKEN_ID)
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)
      await expect(
        userToCryptoDevDao.executeProposal(TOKEN_ID)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'nftHolderOnly_NotADAOMember'
      )
    })
    it('Fails if the proposal dealine hasnt been reached yet', async () => {
      //deployer creates proposal from CryptoDevDao contract
      await cryptoDevDao.createProposal(TOKEN_ID)

      //deployer votes yay on proposal
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)

      await expect(
        cryptoDevDao.executeProposal(TOKEN_ID)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'inactiveProposalOnly_DeadlineNotExceeded'
      )
    })
    it('Fails if the proposal has already been executed', async () => {
      // deployer creates proposal from CryptoDevDao contract
      await cryptoDevDao.createProposal(TOKEN_ID)

      //deployer votes yay on proposal
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)

      //increase the time by 5 minutes
      await network.provider.send('evm_increaseTime', [300])
      await network.provider.send('evm_mine', [])

      await cryptoDevDao.executeProposal(TOKEN_ID)

      await expect(
        cryptoDevDao.executeProposal(TOKEN_ID)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'inactiveProposalOnly_ProposalAlreadyExecuted'
      )
    })
    it('Fails if not enough eth in treasury', async () => {
      // deployer creates proposal from CryptoDevDao contract
      await cryptoDevDao.createProposal(TOKEN_ID)

      //deployer votes yay on proposal
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)

      //increase the time by 5 minutes
      await network.provider.send('evm_increaseTime', [300])
      await network.provider.send('evm_mine', [])

      await cryptoDevDao.withdrawEther()

      await expect(
        cryptoDevDao.executeProposal(TOKEN_ID)
      ).to.be.revertedWithCustomError(
        cryptoDevDao,
        'excuteProposal_NotEnoughFunds'
      )
    })
    it('If the proposal has more YAY votes than NAY votes then purchase the NFT from the NFTMarketplace', async () => {
      // deployer creates proposal from CryptoDevDao contract
      await cryptoDevDao.createProposal(TOKEN_ID)

      //deployer votes yay on proposal
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 0)

      //increase the time by 5 minutes
      await network.provider.send('evm_increaseTime', [300])
      await network.provider.send('evm_mine', [])

      await cryptoDevDao.executeProposal(TOKEN_ID)

      const nftPurchased = await nftMarketplace.available(TOKEN_ID)

      assert(!nftPurchased)
    })
    it('If the proposal has more NAY votes than YAY votes then No NFT is purchase', async () => {
      // deployer creates proposal from CryptoDevDao contract
      await cryptoDevDao.createProposal(TOKEN_ID)

      //deployer votes yay on proposal
      await cryptoDevDao.voteOnProposal(TOKEN_ID, 1)

      //increase the time by 5 minutes
      await network.provider.send('evm_increaseTime', [300])
      await network.provider.send('evm_mine', [])

      await cryptoDevDao.executeProposal(TOKEN_ID)

      const nftPurchased = await nftMarketplace.available(TOKEN_ID)

      assert(nftPurchased)
    })
  })

  //   //withdrawEther
  describe('withdrawEther', async () => {
    it('withdraws Ethers', async () => {
      //Get deployer account balnce before withdrawal
      const deployerBalanceBefore = await ethers.provider.getBalance(deployer)
      const contractBalanceBefore = await ethers.provider.getBalance(
        cryptoDevDao.address
      )

      const txResponse = await cryptoDevDao.withdrawEther()
      const transactionReceipt = await txResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      //Get deployer account balnce after withdrawal
      const deployerBalanceAfter = await ethers.provider.getBalance(deployer)

      assert.equal(
        deployerBalanceAfter.add(gasCost).toString(),
        contractBalanceBefore.add(deployerBalanceBefore).toString()
      )
    })
  })
})
