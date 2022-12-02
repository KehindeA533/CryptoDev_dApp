// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/*//////////////////////////////////////////////////////////////   
                            Imports
//////////////////////////////////////////////////////////////*/
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './IWhitelist.sol';

/*//////////////////////////////////////////////////////////////   
                            Custom Errors
//////////////////////////////////////////////////////////////*/

error presaleMint_PresaleHasNotStarted();
error presaleMint_NotOnWhitelist();
error presaleMint_ExceededMaximumSupply();
error presaleMint_NotEnoughETHSent();
error mint_PresaleHasNotEnded();
error mint_NotEnoughETHSent();
error mint_ExceededMaximumSupply();
error withdraw_FailedToSendEther();

/// @title NFT collection
/// @author Kehinde A.
/// @notice This contract is for creating a 20 "Crypto Dev" NFT's and each one of them will be unique. User's will beable to mint only 1 NFT with one transaction. Whitelisted users, should have a 5 min presale period before the actual sale where they are guaranteed 1 NFT per transaction.
/// @dev All function calls are currently implemented without side effects
contract NFTCollection is ERC721Enumerable, Ownable {
    /*//////////////////////////////////////////////////////////////   
                            State variables
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string private s_baseToknURI;

    // PRICE is the price of one Crypto Dev NFT
    uint256 private constant PRICE = 0.01 ether;

    //s_paused is used to pause the contract in case of an emergency
    bool private s_paused;

    // max number of CryptoDevs NFT
    uint256 private constant MAXTOKENIDS = 20;

    // total number of tokenIds minted
    uint256 private s_tokenIds;

    // Whitelist contract instance
    IWhitelist whitelist;

    // boolean to keep track of whether presale started or not
    bool public s_presaleStarted;

    // timestamp for when presale would end
    uint256 public s_presaleEnded;

    /*//////////////////////////////////////////////////////////////   
                            Modifier
    //////////////////////////////////////////////////////////////*/
    //Update revert to an if statemnet and add to testing !!
    modifier onlyWhenNotPaused() {
        require(!s_paused, 'Contract currently paused');
        _;
    }

    /*//////////////////////////////////////////////////////////////   
                            Constructor Function
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
     * name in our case is `Crypto Devs` and symbol is `CD`.
     * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
     * It also initializes an instance of whitelist interface.
     */
    constructor(
        string memory baseURI,
        address whitelistAddress
    ) ERC721('Crypto Devs', 'CD') {
        s_baseToknURI = baseURI;
        whitelist = IWhitelist(whitelistAddress);
    }

    /*//////////////////////////////////////////////////////////////   
                        Function
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev startPresale starts a presale for the whitelisted addresses
     */
    function startPresale() public onlyOwner {
        s_presaleStarted = true;
        s_presaleEnded = block.timestamp + 5 minutes; // Set presaleEnded time as current timestamp + 5 minutes
    }

    /**
     * @dev presaleMint allows a user to mint one NFT per transaction during the presale.
     */
    function presaleMint() public payable onlyWhenNotPaused {
        if (!(s_presaleStarted) || (block.timestamp > s_presaleEnded)) {
            revert presaleMint_PresaleHasNotStarted();
        }
        if (!(whitelist.getWhitelistedAddresses(msg.sender))) {
            revert presaleMint_NotOnWhitelist();
        }
        // 3 >= 2
        if (s_tokenIds >= MAXTOKENIDS) {
            revert presaleMint_ExceededMaximumSupply();
        }
        if (msg.value < PRICE) {
            revert presaleMint_NotEnoughETHSent();
        }
        s_tokenIds += 1;
        _safeMint(msg.sender, s_tokenIds);
    }

    /**
     * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
     */
    function mint() public payable onlyWhenNotPaused {
        if (!(s_presaleStarted) || (block.timestamp < s_presaleEnded)) {
            revert mint_PresaleHasNotEnded();
        }
        if (s_tokenIds >= MAXTOKENIDS) {
            revert mint_ExceededMaximumSupply();
        }
        if (msg.value < PRICE) {
            revert mint_NotEnoughETHSent();
        }
        s_tokenIds += 1;
        _safeMint(msg.sender, s_tokenIds);
    }

    /**
     * @dev _baseURI overides the Openzeppelin's ERC721 implementation which by default
     * returned an empty string for the baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return s_baseToknURI;
    }

    /**
     * @dev setPaused makes the contract paused or unpaused
     */
    function setPasued(bool status) public onlyOwner {
        s_paused = status;
    }

    /**
     * @dev withdraw sends all the ether in the contract
     * to the owner of the contract
     */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}('');
        if (!sent) {
            revert withdraw_FailedToSendEther();
        }
    }

    receive() external payable {}

    fallback() external payable {}

    /*//////////////////////////////////////////////////////////////   
                            View / Pure Functions
    //////////////////////////////////////////////////////////////*/
    function getPrice() public pure returns (uint256) {
        return PRICE;
    }

    function getPausedState() public view returns (bool) {
        return s_paused;
    }

    function getMaxTokenIds() public pure returns (uint256) {
        return MAXTOKENIDS;
    }

    function getTokenIds() public view returns (uint256) {
        return s_tokenIds;
    }

    function getpresaleState() public view returns (bool) {
        return s_presaleStarted;
    }

    function getpresaleEnded() public view returns (uint256) {
        return s_presaleEnded;
    }

    function getContractBalance() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function getBaseURI() public view returns (string memory) {
        return s_baseToknURI;
    }
}

// ---------------------------------------------------------------
// Contract NFTCollection deployed to: 0x5c416F3b3A312355436797602641429cfb38861c
// ---------------------------------------------------------------

// Successfully verified contract NFTCollection on Etherscan.
// https://goerli.etherscan.io/address/0x5b96E3f80C7adedcf915250Aa0084114E2C0D8b0#code
