// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Weave6Pass.sol";

contract Weave6GenesisPass is Weave6Pass {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  address constant validator = 0x4f8e1B8a9C0b481f9153eE8b5D0F010846e5F4AC;

  struct Proof {
    address whitelistUser;
    uint256 chainId;
    uint256 salt;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  constructor(address gov_, uint256 startTimestamp_, uint256 endTimestamp_) Weave6Pass(gov_, startTimestamp_, endTimestamp_, 299, "Weave6 Genesis Pass", "WGP") {}

  function mintGenesisPass(bytes memory proof) public {
    require(startTimestamp < block.timestamp, "WGP: mint not started");
    require(block.timestamp < endTimestamp, "WGP: mint has been finished");
    require(!minted[msg.sender], "WGP: can only mint one genesis pass");
    require(_tokenIds.current() < maxSupply, "WGP: all minted");
    isValidProof(proof);
    _tokenIds.increment();
    uint256 tokenId = _tokenIds.current();
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, "ipfs://QmPW4wPKNi6Ws4opemcTYb3hwrxk16RTiSaH9sPQh7aug2");
    minted[msg.sender] = true;
    totalSupply += 1;
  }

  /// @param proof proof of whitelist
  function canMint(address user, bytes memory proof) public view returns (bool) {
    return !minted[user] && startTimestamp < block.timestamp && block.timestamp < endTimestamp && _tokenIds.current() < maxSupply && isValidProof(proof);
  }

  function isValidProof(bytes memory proof) public view returns (bool) {
    Proof memory p = abi.decode(proof, (Proof));
    require(msg.sender == p.whitelistUser, "WGP: not withelist user");
    require(block.chainid == p.chainId, "WGP: wrong chainid");
    bytes32 hashData = keccak256(abi.encode(p.whitelistUser, p.chainId, p.salt));
    bytes32 md = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hashData));
    address signer = ecrecover(md, p.v, p.r, p.s);
    require(signer == validator, "WGP: wrong signer");

    return true;
  }
}
