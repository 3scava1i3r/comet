import "B_cometSummarization.spec"
import "erc20.spec"


using SymbolicBaseToken as _baseToken 


methods {
    //temporary under approximations
    isInAsset(uint16 assetsIn, uint8 assetOffset) => CONSTANT;
    latestRoundData() returns uint256 => CONSTANT;

    //todo - move to setup?
    isBorrowCollateralized(address) returns bool envfree
    getUserCollateralBalance(address,address) returns uint128 envfree

    baseToken() returns address envfree
    getTotalSupplyBase() returns (uint104) envfree
    getTotalBorrowBase() returns (uint104) envfree 
    getTotalsSupplyAsset(address asset) returns (uint128) envfree  
    getReserves() returns (int) envfree
    _baseToken.balanceOf(address account) returns (uint256) envfree
}

definition similarFunctions(method f) returns bool =    
            f.selector == withdraw(address,uint256).selector ||
            f.selector == withdrawTo(address,address,uint).selector ||
            f.selector == transfer(address,address,uint).selector ||
            f.selector == supplyTo(address,address,uint).selector ||
            f.selector == supply(address,uint).selector ;




ghost mathint sumUserBasicPrinciple  {
	init_state axiom sumUserBasicPrinciple==0; 
}

ghost mapping( address => mathint) sumBalancePerAssert {
    init_state axiom forall address t. sumBalancePerAssert[t]==0;
}


hook Sstore userBasic[KEY address a].principal int104 balance
    (int104 old_balance) STORAGE {
  sumUserBasicPrinciple  = sumUserBasicPrinciple +
      to_mathint(balance) - to_mathint(old_balance);
}

hook Sstore userCollateral[KEY address account][KEY address t].balance  uint128 balance (uint128 old_balance) STORAGE {
    sumBalancePerAssert[t] = sumBalancePerAssert[t] - old_balance + balance;
}

rule whoChangedMyGhost(method f) {
	mathint before = sumUserBasicPrinciple;
	env e;
	calldataarg args;
	f(e,args);
	mathint after = sumUserBasicPrinciple;
	assert( before == after);
}


rule whoChangedSumBalancePerAssert(method f, address t) {
	mathint before = sumBalancePerAssert[t];
	env e;
	calldataarg args;
	f(e,args);
	mathint after = sumBalancePerAssert[t];
	assert( before == after);
}
/*

Description: 
        Summary of balances (base):
formula: 
        sum(userBasic[u].principal) == totalsBasic.totalSupplyBase - totalsBasic.totalBorrowBase
status:

*/
invariant totalBaseToken() 
	sumUserBasicPrinciple == to_mathint(getTotalSupplyBase()) - to_mathint(getTotalBorrowBase()) filtered { f-> !similarFunctions(f) && !f.isView }
{
    preserved {
        simplifiedAssumptions();
    }
}

rule test(mathint before, mathint after) 
    {
        require before == sumUserBasicPrinciple; 
        require ( before == to_mathint(getTotalSupplyBase()) - to_mathint(getTotalBorrowBase())) ;
        env e;
        calldataarg args;
        withdrawTo(e,args);
        require after == sumUserBasicPrinciple; 
        assert ( after == to_mathint(getTotalSupplyBase()) - to_mathint (getTotalBorrowBase())) ;
    }

/* 
 Description :  
        The sum of collateral per asset over all users is equal to total collateral of asset:

formula : 
        sum(userCollateral[u][asset].balance) == totalsCollateral[asset].totalSupplyAsset

 status : proved 
 link https://vaas-stg.certora.com/output/23658/c653b4018c776983368a?anonymousKey=ed01d8a8a20618fae0c3e40f1e1e3a99c2a253e8
*/
invariant totalCollateralPerAsset(address asset) 
    sumBalancePerAssert[asset] == getTotalsSupplyAsset(asset)     
    {
        preserved {
            simplifiedAssumptions();
        }
    }

function simplifiedAssumptions() {
    env e;
    require getTotalBaseSupplyIndex(e) == baseIndexScale(e);
    require getTotalBaseBorrowIndex(e) == baseIndexScale(e);
}

rule withdraw_all_balance(){
    env e;
    simplifiedAssumptions();
    uint256 balance = _baseToken.balanceOf(currentContract);
    withdraw(e,e.msg.sender,balance);
    assert false;
}

invariant no_reserves_zero_balance()
getReserves() == 0 <=> _baseToken.balanceOf(currentContract) == 0
    {
        preserved {
            simplifiedAssumptions();
        }
    }
