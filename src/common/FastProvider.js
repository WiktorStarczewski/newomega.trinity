import { ethers, BigNumber } from 'ethers';
import _ from 'underscore';


const GAS_BUFFER = 50000;
const FALLBACK_ESTIMATE = 600000;

export class FastInfuraProvider extends ethers.providers.InfuraProvider {
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

export class FastJsonRpcProvider extends ethers.providers.JsonRpcProvider {
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

    async getGasPrice() {
        return BigNumber.from(1000000000); // 1gwei for ElaEth
    }
}
