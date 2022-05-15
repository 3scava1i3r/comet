import { DeploymentManager } from '../../plugins/deployment_manager/DeploymentManager';
import {
  Comet__factory,
  Comet,
  CometExt__factory,
  CometExt,
  CometFactory__factory,
  CometFactory,
  FaucetToken__factory,
  FaucetToken,
  GovernorSimple,
  GovernorSimple__factory,
  SimplePriceFeed,
  SimplePriceFeed__factory,
  SimpleTimelock,
  SimpleTimelock__factory,
  TransparentUpgradeableProxy,
  TransparentUpgradeableProxy__factory,
  Configurator,
  Configurator__factory,
  CometProxyAdmin,
  CometProxyAdmin__factory,
  TransparentUpgradeableConfiguratorProxy,
  TransparentUpgradeableConfiguratorProxy__factory,
  ProxyAdmin,
} from '../../build/types';
import { ConfigurationStruct } from '../../build/types/Comet';
import { ExtConfigurationStruct } from '../../build/types/CometExt';
export { Comet } from '../../build/types';
import { DeployedContracts, DeployProxyOption, ProtocolConfiguration } from './index';

async function makeToken(
  deploymentManager: DeploymentManager,
  amount: number,
  name: string,
  decimals: number,
  symbol: string
): Promise<FaucetToken> {
  return await deploymentManager.deploy<
    FaucetToken,
    FaucetToken__factory,
    [string, string, number, string]
  >('test/FaucetToken.sol', [
    (BigInt(amount) * 10n ** BigInt(decimals)).toString(),
    name,
    decimals,
    symbol,
  ]);
}

async function makePriceFeed(
  deploymentManager: DeploymentManager,
  initialPrice: number,
  decimals: number
): Promise<SimplePriceFeed> {
  return await deploymentManager.deploy<
    SimplePriceFeed,
    SimplePriceFeed__factory,
    [number, number]
  >('test/SimplePriceFeed.sol', [initialPrice * 1e8, decimals]);
}

// TODO: Support configurable assets as well?
export async function deployDevelopmentComet(
  deploymentManager: DeploymentManager,
  deployProxy: DeployProxyOption = { deployCometProxy: true, deployConfiguratorProxy: true },
  configurationOverrides: ProtocolConfiguration = {}
): Promise<DeployedContracts> {
  const signers = await deploymentManager.hre.ethers.getSigners();
  const admin = await signers[0].getAddress();

  let dai = await makeToken(deploymentManager, 1000000, 'DAI', 18, 'DAI');
  let gold = await makeToken(deploymentManager, 2000000, 'GOLD', 8, 'GOLD');
  let silver = await makeToken(deploymentManager, 3000000, 'SILVER', 10, 'SILVER');

  let daiPriceFeed = await makePriceFeed(deploymentManager, 1, 8);
  let goldPriceFeed = await makePriceFeed(deploymentManager, 0.5, 8);
  let silverPriceFeed = await makePriceFeed(deploymentManager, 0.05, 8);

  let assetConfig0 = {
    asset: gold.address,
    priceFeed: goldPriceFeed.address,
    decimals: (8).toString(),
    borrowCollateralFactor: (0.9e18).toString(),
    liquidateCollateralFactor: (1e18).toString(),
    liquidationFactor: (0.95e18).toString(),
    supplyCap: (1000000e8).toString(),
  };

  let assetConfig1 = {
    asset: silver.address,
    priceFeed: silverPriceFeed.address,
    decimals: (10).toString(),
    borrowCollateralFactor: (0.4e18).toString(),
    liquidateCollateralFactor: (0.5e18).toString(),
    liquidationFactor: (0.9e18).toString(),
    supplyCap: (500000e10).toString(),
  };

  const governorSimple = await deploymentManager.deploy<GovernorSimple, GovernorSimple__factory, []>(
    'test/GovernorSimple.sol',
    []
  );

  let timelock = await deploymentManager.deploy<SimpleTimelock, SimpleTimelock__factory, [string]>(
    'test/SimpleTimelock.sol',
    [governorSimple.address]
  );

  // Initialize the storage of GovernorSimple
  await governorSimple.initialize(timelock.address, [admin]);

  const {
    symbol,
    governor,
    pauseGuardian,
    baseToken,
    baseTokenPriceFeed,
    kink,
    perYearInterestRateSlopeLow,
    perYearInterestRateSlopeHigh,
    perYearInterestRateBase,
    reserveRate,
    storeFrontPriceFactor,
    trackingIndexScale,
    baseTrackingSupplySpeed,
    baseTrackingBorrowSpeed,
    baseMinForRewards,
    baseBorrowMin,
    targetReserves,
    assetConfigs,
  } = {
    ...{
      symbol: '📈BASE',
      governor: timelock.address,
      pauseGuardian: await signers[1].getAddress(),
      baseToken: dai.address,
      baseTokenPriceFeed: daiPriceFeed.address,
      kink: (0.8e18).toString(),
      perYearInterestRateBase: (0.005e18).toString(),
      perYearInterestRateSlopeLow: (0.1e18).toString(),
      perYearInterestRateSlopeHigh: (3e18).toString(),
      reserveRate: (0.1e18).toString(),
      storeFrontPriceFactor: (0.95e18).toString(),
      trackingIndexScale: (1e15).toString(), // XXX add 'exp' to scen framework?
      baseTrackingSupplySpeed: 0, // XXX
      baseTrackingBorrowSpeed: 0, // XXX
      baseMinForRewards: 1, // XXX
      baseBorrowMin: (1e18).toString(),
      targetReserves: 0, // XXX
      assetConfigs: [assetConfig0, assetConfig1],
    },
    ...configurationOverrides,
  };

  const extConfiguration = {
    symbol32: deploymentManager.hre.ethers.utils.formatBytes32String(symbol),
  };
  const cometExt = await deploymentManager.deploy<CometExt, CometExt__factory, [ExtConfigurationStruct]>(
    'CometExt.sol',
    [extConfiguration]
  );

  const configuration = {
    governor,
    pauseGuardian,
    baseToken,
    baseTokenPriceFeed,
    extensionDelegate: cometExt.address,
    kink,
    perYearInterestRateSlopeLow,
    perYearInterestRateSlopeHigh,
    perYearInterestRateBase,
    reserveRate,
    storeFrontPriceFactor,
    trackingIndexScale,
    baseTrackingSupplySpeed,
    baseTrackingBorrowSpeed,
    baseMinForRewards,
    baseBorrowMin,
    targetReserves,
    assetConfigs,
  };
  const comet = await deploymentManager.deploy<Comet, Comet__factory, [ConfigurationStruct]>(
    'Comet.sol',
    [configuration]
  );

  const cometFactory = await deploymentManager.deploy<CometFactory, CometFactory__factory, []>(
    'CometFactory.sol',
    []
  );

  const configurator = await deploymentManager.deploy<Configurator, Configurator__factory, []>(
    'Configurator.sol',
    []
  );

  /* === Proxies === */

  let updatedRoots = await deploymentManager.getRoots();
  let cometProxy = null;
  let configuratorProxy = null;
  let proxyAdmin = null;

  // If we are deploying new proxies for both Comet and Configurator, we will also deploy a new ProxyAdmin
  // because this is most likely going to be a completely fresh deployment.
  // Note: If this assumption is incorrect, we should probably add a third option in `DeployProxyOption` to
  //       specify if a new CometProxyAdmin should be deployed.
  if (deployProxy.deployCometProxy && deployProxy.deployConfiguratorProxy) {
    let proxyAdminArgs: [] = [];
    proxyAdmin = await deploymentManager.deploy<CometProxyAdmin, CometProxyAdmin__factory, []>(
      'CometProxyAdmin.sol',
      proxyAdminArgs
    );
    await proxyAdmin.transferOwnership(timelock.address);
  } else {
    // We don't want to be using a new ProxyAdmin/Timelock if we are not deploying both proxies
    proxyAdmin = await deploymentManager.contract('cometAdmin') as ProxyAdmin;
    timelock = await deploymentManager.contract('timelock') as SimpleTimelock;
  }

  if (deployProxy.deployConfiguratorProxy) {
    // Configuration proxy
    configuratorProxy = await deploymentManager.deploy<
      TransparentUpgradeableConfiguratorProxy,
      TransparentUpgradeableConfiguratorProxy__factory,
      [string, string, string]
    >('TransparentUpgradeableConfiguratorProxy.sol', [
      configurator.address,
      proxyAdmin.address,
      (await configurator.populateTransaction.initialize(timelock.address, cometFactory.address, configuration)).data, // new time lock is set, which we don't want
    ]);

    updatedRoots.set('configurator', configuratorProxy.address);
  }

  if (deployProxy.deployCometProxy) {
    // Comet proxy
    cometProxy = await deploymentManager.deploy<
      TransparentUpgradeableProxy,
      TransparentUpgradeableProxy__factory,
      [string, string, string]
    >('vendor/proxy/transparent/TransparentUpgradeableProxy.sol', [
      comet.address,
      proxyAdmin.address,
      (await comet.populateTransaction.initializeStorage()).data,
    ]);

    updatedRoots.set('comet', cometProxy.address);
  }

  await deploymentManager.putRoots(updatedRoots);
  await deploymentManager.spider();

  return {
    comet,
    cometProxy,
    configuratorProxy,
    timelock,
    governor: governorSimple,
    tokens: [dai, gold, silver],
  };
}
