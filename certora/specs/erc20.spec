// erc20 methods
methods {
    name()                                returns (string)  => DISPATCHER(true) 
    symbol()                              returns (string)  => DISPATCHER(true) 
    decimals()                            returns (string)  => DISPATCHER(true) 
    totalSupply()                         returns (uint256) => DISPATCHER(true) 
    balanceOf(address)                    returns (uint256) => DISPATCHER(true) 
    allowance(address,address)            returns (uint)    => DISPATCHER(true) 
    approve(address,uint256)              returns (bool)    => DISPATCHER(true) 
    transferAsset(address,uint256)             returns (bool)    => DISPATCHER(true) 
    transferAssetFrom(address,address,uint256) returns (bool)    => DISPATCHER(true) 
}