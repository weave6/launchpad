// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Weave6Pass is Ownable, ERC721URIStorage {
  uint256 public startTimestamp;
  uint256 public endTimestamp;
  uint256 public totalSupply;
  uint256 public totalBurned;
  uint256 public maxSupply;
  address public gov;
  //if the address has minted the pass
  mapping(address => bool) public minted;

  //Events
  event IncreacedMaxSupply(uint256 increment);
  event NewStartTimestamp(uint256 startTimestamp);
  event NewEndTimestamp(uint256 endTimestamp);
  event NewGov(address gov);

  modifier onlyGov {
    require(msg.sender == gov, "Weave6Pass: caller is not gov");
    _;
  }

  constructor(address gov_, uint256 startTimestamp_, uint256 endTimestamp_, uint256 maxSupply_, string memory name_, string memory symbol_)ERC721(name_, symbol_) {
    gov = gov_;
    startTimestamp = startTimestamp_;
    endTimestamp = endTimestamp_;
    maxSupply = maxSupply_;
  }

  /// @param tokenId the tokenId send to burn
  function burn(uint256 tokenId) public {
    require(_ownerOf(tokenId) == msg.sender, "Weave6Pass: caller is not the token owner");
    _burn(tokenId);
    totalSupply -= 1;
    totalBurned += 1;
  }

  /// @param startTimestamp_ the new timestamp for starting mint
  function setStartTime(uint256 startTimestamp_) public onlyOwner {
    startTimestamp = startTimestamp_;
    emit NewStartTimestamp(startTimestamp_);
  }

  /// @param endTimestamp_ the New timestamp for ending mining
  function setEndTime(uint256 endTimestamp_) public onlyOwner {
    endTimestamp = endTimestamp_;
    emit NewEndTimestamp(endTimestamp_);
  }

  function setGov(address newGov) public onlyOwner {
    gov = newGov;
    emit NewGov(newGov);
  }

  /// @param increment the New timestamp for ending mining
  function increaceMaxSupply(uint256 increment) public onlyOwner {
    maxSupply += increment;
    emit IncreacedMaxSupply(increment);
  }

  function withdraw() public onlyGov {
    uint256 balance = address(this).balance;
    payable(msg.sender).transfer(balance);
  }
}
