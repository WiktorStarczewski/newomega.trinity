import { ethers, BigNumber } from 'ethers';
import _ from 'underscore';


const GAS_BUFFER = 50000;
const FALLBACK_ESTIMATE = 600000;

export class FastProvider extends ethers.providers.InfuraProvider {
    async estimateGas(tx) {
        let gas;
        try {
            gas = await super.estimateGas(tx);
        } catch (error) {
            _.isFunction(this._newOmegaGasEstimated) && this._newOmegaGasEstimated(FALLBACK_ESTIMATE);
            return BigNumber.from(FALLBACK_ESTIMATE);
        }
        _.isFunction(this._newOmegaGasEstimated) && this._newOmegaGasEstimated(gas.toNumber());
        return gas.add(GAS_BUFFER);
    }
}
