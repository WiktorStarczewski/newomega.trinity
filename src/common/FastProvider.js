import { ethers } from 'ethers';


const GAS_BUFFER = 20000;

export class FastProvider extends ethers.providers.InfuraProvider {
    async estimateGas(tx) {
        const gas = await super.estimateGas(tx);
        return gas.add(GAS_BUFFER);
    }
}
