# CryptoDev Project

## Whitelist
CryptoDev Whitelist gives early supporters access to my collection, this website allows the first 10 users  to go and enter into the whitelist for free.
Frontend: https://crypto-dev-whitelist-frontend.vercel.app/

## NFT Collection
The CryptoDev NFT Collection is a collection of 20 NFT and each one of them are unique. User's will be able to mint only 1 NFT with one transaction. Whitelisted users, will have a 5 min presale period before the actual sale where they are guaranteed 1 NFT per transaction.
Frontend: https://crypto-dev-nft-collection-frontend-4fb9.vercel.app/


## CryptoDev ICO
CryptoDev ICO lauches a token called Crypto Dev. The token will be given out for free to all our NFT holders, and allow those who dont have the NFTs to buy them for ETH. There is a max of 10,000 CD tokens. Every Crypto Dev NFT holder will get 10 tokens for free but they would have to pay the gas fees. The price of one CD at the time of ICO will be 0.001 ether.

## CryptoDev DAO
CryptoDev DAO allows NFT holders to create and vote on proposals to use that ETH for purchasing other NFTs from an NFT marketplace, and speculate on price. Anyone with a CryptoDevs NFT can create a proposal to purchase a different NFT from an NFT marketplace. Everyone with a CryptoDevs NFT can vote for or against the active proposals. Each NFT counts as one vote for each proposal. Voter cannot vote multiple times on the same proposal with the same NFT. If majority of the voters vote for the proposal by the deadline, the NFT purchase is automatically executed.

***

## Quickstart

```
git clone https://github.com/LegatoReign/Crypto-Raffle
cd Crypto-Raffle
yarn
```
# Usage

Deploy:

```
yarn hardhat deploy
```

## Testing

```
yarn hardhat test
```

### Test Coverage

```
yarn hardhat coverage
```

# Deployment to a testnet or mainnet

1. Setup environment variabltes

You'll want to set your `GOERLI_RPC_URL` and `PRIVATE_KEY` as environment variables. You can add them to a `.env` file, similar to what you see in `.env.example`.

- `PRIVATE_KEY`: The private key of your account (like from [metamask](https://metamask.io/)). **NOTE:** FOR DEVELOPMENT, PLEASE USE A KEY THAT DOESN'T HAVE ANY REAL FUNDS ASSOCIATED WITH IT.
  - You can [learn how to export it here](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key).
- `GOERLI_RPC_URL`: This is url of the goerli testnet node you're working with. You can get setup with one for free from [Alchemy](https://alchemy.com/?a=673c802981)

2. Get testnet ETH

Head over to [faucets.chain.link](https://faucets.chain.link/) and get some tesnet ETH & LINK. You should see the ETH and LINK show up in your metamask. [You can read more on setting up your wallet with LINK.](https://docs.chain.link/docs/deploy-your-first-contract/#install-and-fund-your-metamask-wallet)


3. Deploy

In your `helper-hardhat-config.js` add your `subscriptionId` under the section of the chainId you're using (aka, if you're deploying to goerli, add your `subscriptionId` in the `subscriptionId` field under the `4` section.)

Then run:
```
yarn hardhat deploy --network goerli
```

And copy / remember the contract address. 

## Estimate gas

You can estimate how much gas things cost by running:

```
yarn hardhat test
```

And you'll see and output file called `gas-report.txt`

### Estimate gas cost in USD

To get a USD estimation of gas cost, you'll need a `COINMARKETCAP_API_KEY` environment variable. You can get one for free from [CoinMarketCap](https://pro.coinmarketcap.com/signup). 

Then, uncomment the line `coinmarketcap: COINMARKETCAP_API_KEY,` in `hardhat.config.js` to get the USD estimation. Just note, everytime you run your tests it will use an API call, so it might make sense to have using coinmarketcap disabled until you need it. You can disable it by just commenting the line back out. 


## Verify on etherscan

If you deploy to a testnet or mainnet, you can verify it if you get an [API Key](https://etherscan.io/myapikey) from Etherscan and set it as an environemnt variable named `ETHERSCAN_API_KEY`. You can pop it into your `.env` file as seen in the `.env.example`.

In it's current state, if you have your api key set, it will auto verify goerli contracts!

However, you can manual verify with:

```
yarn hardhat verify --constructor-args arguments.js DEPLOYED_CONTRACT_ADDRESS
```

# Happy Coding !
