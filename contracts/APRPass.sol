// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Weave6Pass.sol";

contract APRPass is Ownable, ERC721URIStorage, Weave6Pass {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  uint256 public constant APR_PRICE = 2e17; //0.2BNB

  constructor(address gov_, uint256 startTimestamp_, uint256 endTimestamp_) Weave6Pass(gov_, startTimestamp_, endTimestamp_, 10000, "APR Rewards Pass", "WARP") {}

  function mintWAPRPass() public payable {
    require(startTimestamp < block.timestamp, "WAPR: mint not started");
    require(block.timestamp < endTimestamp, "WAPR: mint has been finished");
    require(!minted[msg.sender], "WAPR: only mint one pass");
    require(APR_PRICE == msg.value, "WAPR: payment value must be equal to price");
    require(_tokenIds.current() < maxSupply, "WAPR: all minted");
    _tokenIds.increment();
    uint256 tokenId = _tokenIds.current();
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, "ipfs://QmT3SUftGv99YqLEReSsPp5ajeLZK6uJ7KLGKunyPfDFkv");
    minted[msg.sender] = true;
    totalSupply += 1;
  }

  /// @param user who want to mint the pass
  function canMint(address user) public view returns (bool) {
    return !minted[user] && startTimestamp < block.timestamp && block.timestamp < endTimestamp && _tokenIds.current() < maxSupply;
  }
}
