// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

/*//////////////////////////////////////////////////////////////   
                            Imports
//////////////////////////////////////////////////////////////*/

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './INFTCollection.sol';

/*//////////////////////////////////////////////////////////////   
                            Custom Errors
//////////////////////////////////////////////////////////////*/
error mint_NotEnoughETHSent();
error mint_ExceedsTheMaxTotalSupply();
error claim_NoNFTOwned();
error claim_TokensAlreadyClaim();
error withdraw_FailedToSendETH();

/// @title ICO
/// @author Kehinde A.
/// @notice A Crypto Dev Token. Token will be given out for free to all our NFT holders, and will be avaiable for purchase to other people to buy for ETH. There should be a max of 10,000 CD tokens. Every Crypto Dev NFT holder should get 10 tokens for free but they would have to pay the gas fees. The price of one CD at the time of ICO should be 0.001 ether.
contract ICO is ERC20, Ownable {
    /*//////////////////////////////////////////////////////////////   
                            Variables
    //////////////////////////////////////////////////////////////*/
    // Price of one Crypto Dev token
    uint256 private constant TOKENPRICE = 0.001 ether;

    uint256 private constant TOKENPERNFT = 10;

    // the max total supply is 10000 for Crypto Dev Tokens
    uint256 private constant MAXTOTALSUPPLY = 10000; //10000 * 10**18

    // CryptoDevsNFT contract instance
    INFTCollection CryptoDevsNFT;

    // Mapping to keep track of which tokenIds have been claimed
    mapping(uint256 => bool) private tokenIdsClaimed;

    /*//////////////////////////////////////////////////////////////   
                        Constructor Function
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev ERC20 constructor takes in a `name` and a `symbol`.
     * name in our case is `Crypto Devs Token` and symbol is `CD`.
     * Constructor for ICO initializes an instance of CryptoDevs interface.
     */
    constructor(address nftCollectionContract) ERC20('Crypto Dev Token', 'CD') {
        CryptoDevsNFT = INFTCollection(nftCollectionContract);
    }

    /*//////////////////////////////////////////////////////////////   
                            Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Mints `amount` number of CryptoDevTokens
     * Requirements:
     * - `msg.value` should be equal or greater than the tokenPrice * amount
     */
    function mint(uint256 amount) public payable {
        //the value of ether that should be equal or grater than TOKENPRICE * amount
        uint256 requiredAmount = TOKENPRICE * amount;

        if (msg.value < requiredAmount) {
            revert mint_NotEnoughETHSent();
        }

        // total tokens + amount <= 10000, otherwise revert the transaction
        uint256 amountWithDecimals = amount * 10 ** 18;

        if ((totalSupply() + amountWithDecimals) > MAXTOTALSUPPLY) {
            revert mint_ExceedsTheMaxTotalSupply();
        }

        // call the internal function from Openzeppelin's ERC20 contract
        _mint(msg.sender, amountWithDecimals);
    }

    /**
     * @dev Mints token based on the number of NFT's held by the sender
     * Requiremnt:
     * balance of Crypto Dev NFT's owned by the sender should be greater than 0
     * Token should have not been claimed for all the NFT's owned by the sneder
     */
    function claim() public {
        address sender = msg.sender;

        //Get the number of CryptoDev NFT's held by a given sender address
        uint256 balance = CryptoDevsNFT.balanceOf(sender);

        //If the balance is zero, revert the transaction
        if (balance <= 0) {
            revert claim_NoNFTOwned();
        }

        //amount keeps track of the number of unclaimed tokenIds
        uint256 amount = 0;

        //loop over the balance and get the token ID owned by "sender" at a given "index" of its token list
        for (uint256 i; i < balance; ++i) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);

            //If the tokenId has not been claimed, increase the amount
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        // If all the token Ids have been claimed, revert the transaction;
        if (amount <= 0) {
            revert claim_TokensAlreadyClaim();
        }
        // call the internal function from Openzeppelin's ERC20 contract
        // Mint (amount * 10) tokens for each NFT
        _mint(msg.sender, amount * TOKENPERNFT);
    }

    /**
     * @dev withdraws all ETH and token sent to the contract
     * Requirements:
     * wallet connected must be owner's address
     */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool success, ) = _owner.call{value: amount}('');
        if (!success) {
            revert withdraw_FailedToSendETH();
        }
    }

    /*//////////////////////////////////////////////////////////////   
                        View / Pure Functions
    //////////////////////////////////////////////////////////////*/
    function getTokenPrice() public pure returns (uint256) {
        return TOKENPRICE;
    }

    function getNumOfTokenPerNFT() public pure returns (uint256) {
        return TOKENPERNFT;
    }

    function getMaxTotalSupply() public pure returns (uint256) {
        return MAXTOTALSUPPLY;
    }

    function getAvaiableTokenId(uint256 num) public view returns (bool) {
        return tokenIdsClaimed[num];
    }
}


// -----------------------------------------
// Contract ICO deployed at: 0x2dCFD15490F94C6514943A6BF8bD51b98225A94B
// -----------------------------------------

// Successfully verified contract ICO on Etherscan.
// https://goerli.etherscan.io/address/0x2dCFD15490F94C6514943A6BF8bD51b98225A94B#code
