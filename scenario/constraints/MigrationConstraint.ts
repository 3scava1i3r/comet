import { Constraint, Solution, World, debug } from '../../plugins/scenario';
import { CometContext } from '../context/CometContext';
import { Requirements } from './Requirements';
import { Migration, loadMigrations } from '../../plugins/deployment_manager/Migration';
import { modifiedPaths, subsets } from '../utils';

async function getMigrations<T>(context: CometContext, requirements: Requirements): Promise<Migration<T>[]> {
  // TODO: make this configurable from cli params/env var?
  const network = context.deploymentManager.network;
  const deployment = context.deploymentManager.deployment;
  const pattern = new RegExp(`deployments/${network}/${deployment}/migrations/.*.ts`);
  return await loadMigrations((await modifiedPaths(pattern)).map(p => '../../' + p));
}

async function asyncFilter<T>(els: T[], f: (T) => Promise<boolean>): Promise<T[]> {
  let filterResults = await Promise.all(els.map((el) => f(el)));
  return els.filter((el, i) => filterResults[i]);
}

export class MigrationConstraint<T extends CometContext, R extends Requirements> implements Constraint<T, R> {
  async solve(requirements: R, context: T, world: World) {
    const label = `[${world.base.name}] {MigrationConstraint}`;
    const solutions: Solution<T>[] = [];

    for (const migrationList of subsets(await getMigrations(context, requirements))) {
      solutions.push(async function (ctx: T): Promise<T> {
        const governor = await ctx.getGovernor();
        const proposer = await ctx.getProposer();

        // Make proposer the default signer
        ctx.deploymentManager._signers.unshift(proposer);

        migrationList.sort((a, b) => a.name.localeCompare(b.name))
        debug(`${label} Running scenario with migrations: ${JSON.stringify(migrationList.map((m) => m.name))}`);
        for (const migration of migrationList) {
          const artifact = await migration.actions.prepare(ctx.deploymentManager);
          debug(`${label} Prepared migration ${migration.name}.\n  Artifact\n-------\n\n${JSON.stringify(artifact, null, 2)}\n-------\n`);
          // XXX enact will take the 'gov' deployment manager instead of the 'local' one
          await migration.actions.enact(ctx.deploymentManager, artifact);
          debug(`${label} Enacted migration ${migration.name}`);
        }

        // Remove proposer from signers
        ctx.deploymentManager._signers.shift();

        return ctx;
      });
    }

    return solutions;
  }

  async check(requirements: R, context: T, world: World) {
    return; // XXX
  }
}
