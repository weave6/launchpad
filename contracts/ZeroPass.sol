// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Weave6Pass.sol";

contract ZeroPass is Weave6Pass {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor(address gov_, uint256 startTimestamp_, uint256 endTimestamp_) Weave6Pass(gov_, startTimestamp_, endTimestamp_, 30000, "Zero Fee Pass", "WZFP") {

  }

  function mintZeroPass() public {
    require(startTimestamp < block.timestamp, "WZFP: mint not started");
    require(block.timestamp < endTimestamp, "WZFP: mint has been finished");
    require(!minted[msg.sender], "WZFP: You can only mint one pass");
    require(_tokenIds.current() < maxSupply, "WZFP: all minted");
    _tokenIds.increment();
    uint256 tokenId = _tokenIds.current();
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, "ipfs://QmbciSAv42ze7zVYnbVJaWtagRvDniVQn9rMrh4YyoT9Ki");
    minted[msg.sender] = true;
    totalSupply += 1;
  }

  /// @param user who want to mint the pass
  function canMint(address user) public view returns (bool) {
    return !minted[user] 
      && startTimestamp < block.timestamp 
      && block.timestamp < endTimestamp  
      && _tokenIds.current() < maxSupply;
  }
}
