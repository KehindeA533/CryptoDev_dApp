// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

/*//////////////////////////////////////////////////////////////   
                            Imports
//////////////////////////////////////////////////////////////*/
import '@openzeppelin/contracts/access/Ownable.sol';
import './INFTMarketplace.sol';
import './INFTCollection.sol';

/*//////////////////////////////////////////////////////////////   
                            Custom Errors
//////////////////////////////////////////////////////////////*/
error nftHolderOnly_NotADAOMember();
error createProposal_NFTNotForSale();
error activeProposalOnly_DeadlineExceeded();
error voteOnProposal_AlreadyVoted();
error inactiveProposalOnly_DeadlineNotExceeded();
error inactiveProposalOnly_ProposalAlreadyExecuted();
error excuteProposal_NotEnoughFunds();
error withdraw_FailedToSendEther();

/// @title Crypto Dev DAO
/// @author Kehinde A.
/// @notice A Crypto Dev DAO. Anyone with a CryptoDevs NFT can create a proposal to purchase a different NFT from an NFT marketplace. Everyone with a CryptoDevs NFT can vote for or against the active proposals. Each NFT counts as one vote for each proposal. If majority of the voters vote for the proposal by the deadline, the NFT purchase is automatically executed.
contract CryptoDevDAO is Ownable {
    /*//////////////////////////////////////////////////////////////   
                            State Variables
    //////////////////////////////////////////////////////////////*/
    //possible options for a vote
    enum Vote {
        YAY, // YAY = 0
        NAY // NAY = 1
    }

    /// @notice Create a struct named Proposal containing all relevant information
    struct Proposal {
        // nftTokenId - the tokenID of the NFT to purchase from FakeNFTMarketplace if the proposal passes
        uint256 nftTokenId;
        // deadline - the UNIX timestamp until which this proposal is active. Proposal can be executed after the deadline has been exceeded.
        uint256 deadline;
        // yayVotes - number of yay votes for this proposal
        uint256 yayVotes;
        // nayVotes - number of nay votes for this proposal
        uint256 nayVotes;
        // executed - whether or not this proposal has been executed yet. Cannot be executed before the deadline has been exceeded.
        bool executed;
        // voters - a mapping of CryptoDevsNFT tokenIDs to booleans indicating whether that NFT has already been used to cast a vote or not
        mapping(uint256 => bool) voters;
    }

    // Create a mapping of ID to Proposal
    mapping(uint256 => Proposal) public proposals; //Private ??

    // Number of proposals that have been created
    uint256 private numProposals;

    //Initializing NFTmarketplace contract
    INFTMarketplace nftMarketplace;

    //Initializing NFTmarketplace contract
    INFTCollection cryptoDevsNFT;

    /*//////////////////////////////////////////////////////////////   
                            Modifier
    //////////////////////////////////////////////////////////////*/
    // Create a modifier which only allows a function to be
    // called by someone who owns at least 1 CryptoDevsNFT
    modifier nftHolderOnly() {
        if (cryptoDevsNFT.balanceOf(msg.sender) <= 0) {
            revert nftHolderOnly_NotADAOMember();
        }
        _;
    }

    modifier activeProposalOnly(uint256 proposalIndex) {
        if (proposals[proposalIndex].deadline <= block.timestamp) {
            revert activeProposalOnly_DeadlineExceeded();
        }
        _;
    }

    // Create a modifier which only allows a function to be
    // called if the given proposals' deadline HAS been exceeded
    // and if the proposal has not yet been executed
    modifier inactiveProposalOnly(uint256 proposalIndex) {
        if (proposals[proposalIndex].deadline > block.timestamp) {
            revert inactiveProposalOnly_DeadlineNotExceeded();
        }
        if (proposals[proposalIndex].executed != false) {
            revert inactiveProposalOnly_ProposalAlreadyExecuted();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////   
                            Constructor Functions
    //////////////////////////////////////////////////////////////*/

    // Create a payable constructor which initializes the contract
    // instances for FakeNFTMarketplace and CryptoDevsNFT
    constructor(address _nftMarketplace, address _cryptoDevsNFT) payable {
        nftMarketplace = INFTMarketplace(_nftMarketplace);
        cryptoDevsNFT = INFTCollection(_cryptoDevsNFT);
    }

    /*//////////////////////////////////////////////////////////////   
                            Functions
    //////////////////////////////////////////////////////////////*/
    /// @dev createProposal allows a CryptoDevsNFT holder to create a new proposal in the DAO
    /// @param _nftTokenId - the tokenID of the NFT to be purchased from FakeNFTMarketplace if this proposal passes
    /// @return Returns the proposal index for the newly created proposal
    function createProposal(
        uint256 _nftTokenId
    ) external nftHolderOnly returns (uint256) {
        if (!(nftMarketplace.available(_nftTokenId))) {
            // Check to see if desired NFT is avaiable
            revert createProposal_NFTNotForSale();
        }
        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;

        //Set the proposal's voting deadline to be (current time + 5 minutes)
        proposal.deadline = block.timestamp + 5 minutes;

        numProposals++;

        return numProposals - 1;
    }

    /// @dev voteOnProposal allows a CryptoDevsNFT holder to cast their vote on an active proposal
    /// @param proposalIndex - the index of the proposal to vote on in the proposals array
    /// @param vote - the type of vote they want to cast
    function voteOnProposal(
        uint256 proposalIndex,
        Vote vote
    ) external nftHolderOnly activeProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];

        uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);
        uint256 numVotes;

        // Calculate how many NFTs are owned by the voter
        // that haven't already been used for voting on this proposal
        for (uint256 i; i < voterNFTBalance; ++i) {
            uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
            if (proposal.voters[tokenId] == false) {
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }

        if (numVotes <= 0) {
            revert voteOnProposal_AlreadyVoted();
        }

        //increments the yayVotes & NayVotes
        if (vote == Vote.YAY) {
            proposal.yayVotes += numVotes;
        } else {
            proposal.nayVotes += numVotes;
        }
    }

    /// @dev executeProposal allows any CryptoDevsNFT holder to execute a proposal after it's deadline has been exceeded
    /// @param proposalIndex - the index of the proposal to execute in the proposals array
    function executeProposal(
        uint256 proposalIndex
    ) external nftHolderOnly inactiveProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];

        // If the proposal has more YAY votes than NAY votes
        // purchase the NFT from the FakeNFTMarketplace
        if (proposal.yayVotes > proposal.nayVotes) {
            uint256 nftPrice = nftMarketplace.getNFTPrice();
            if (address(this).balance < nftPrice) {
                revert excuteProposal_NotEnoughFunds();
            }
            nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    /// @dev withdrawEther allows the contract owner (deployer) to withdraw the ETH from the contract
    function withdrawEther() external onlyOwner {
        uint256 amount = address(this).balance;
        (bool sent, ) = owner().call{value: amount}('');
        if (!sent) {
            revert withdraw_FailedToSendEther();
        }
    }

    // The following two functions allow the contract to accept ETH deposits
    // directly from a wallet without calling a function
    receive() external payable {}

    fallback() external payable {}

    //Sell function

    /*//////////////////////////////////////////////////////////////   
                        Getter Functions
    //////////////////////////////////////////////////////////////*/
    function getNumProposals() external view returns (uint256) {
        return numProposals;
    }

    function getProposalNftTokenId(
        uint256 _nftTokenId
    ) external view returns (uint256) {
        Proposal storage proposal = proposals[_nftTokenId];
        return proposal.nftTokenId;
    }

    function getProposalDeadline(
        uint256 _nftTokenId
    ) external view returns (uint256) {
        Proposal storage proposal = proposals[_nftTokenId];
        return proposal.deadline;
    }

    function getProposalYayVotes(
        uint256 _nftTokenId
    ) external view returns (uint256) {
        Proposal storage proposal = proposals[_nftTokenId];
        return proposal.yayVotes;
    }

    function getProposalNayVotes(
        uint256 _nftTokenId
    ) external view returns (uint256) {
        Proposal storage proposal = proposals[_nftTokenId];
        return proposal.nayVotes;
    }

    function getProposalExecuted(
        uint256 _nftTokenId
    ) external view returns (bool) {
        Proposal storage proposal = proposals[_nftTokenId];
        return proposal.executed;
    }

    function getProposalVoters(
        uint256 _nftTokenId,
        uint256 index
    ) external view returns (bool) {
        Proposal storage proposal = proposals[_nftTokenId];
        return proposal.voters[index];
    }
}

// //NFTMarketplace
// -----------------------------------------
// NFTMarketplace Contract deployed at: 0x6f7F7A6832DDEC5e753c059dC955cD729D237705
// -----------------------------------------

// Successfully verified contract NFTMarketplace on Etherscan.
// https://goerli.etherscan.io/address/0x6f7F7A6832DDEC5e753c059dC955cD729D237705#code

// //DAO
// -----------------------------------------
// CryptoDevDAO Contract deployed at: 0x8f9B9c016b5a6294d3a5053bDf01d81e12a513D9
// -----------------------------------------
// Successfully verified contract CryptoDevDAO on Etherscan.
// https://goerli.etherscan.io/address/0x8f9B9c016b5a6294d3a5053bDf01d81e12a513D9#code
// -----------------------------------------
