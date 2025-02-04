const { getLogs } = require('../helper/cache/getLogs')
const { sumTokens2 } = require('../helper/unwrapLPs')

const assetListedEvent = "event Asset_Listed(address indexed asset_source, bytes32 indexed vega_asset_id, uint256 nonce)"
const BigNumber = require("bignumber.js");

const config = {
  ethereum: { bridge: '0x124Dd8a6044ef048614AEA0AAC86643a8Ae1312D', 
  fromBlock: 15263615, 
  vega: '0xcb84d72e61e383767c4dfeb2d8ff7f4fb89abc6e', 
  stakingContract: '0x195064D33f09e0c42cF98E665D9506e0dC17de68', 
  assetPool: '0xF0f0FcDA832415b935802c6dAD0a6dA2c7EAed8f',

  vestingContract: '0x23d1bFE8fA50a167816fBD79D7932577c06011f4' },
}

const contractAbis = {
  "totalStaked": "function total_staked() view returns (uint256)",
  "balanceOf": "function balanceOf(address account) view returns (uint256)"
}

module.exports = {
};

Object.keys(config).forEach(chain => {
  const { bridge, fromBlock, vega, stakingContract, assetPool, vestingContract } = config[chain]
  module.exports[chain] = {
    tvl: async (_, _b, _cb, { api, }) => {
      const logs = await getLogs({
        api,
        target: bridge,
        topics: ['0x4180d77d05ff0d31650c548c23f2de07a3da3ad42e3dd6edd817b438a150452e'],
        eventAbi: assetListedEvent,
        onlyArgs: true,
        fromBlock,
      })
      const blacklistedTokens = []
      if (vega) blacklistedTokens.push(vega)
      return sumTokens2({ api, blacklistedTokens, owner: assetPool, tokens: logs.map(i => i.asset_source) })
    },
    //staking: staking(stakingContract, vega)
    staking: async (_, _b, cb, { chain, block, api } = {}) => { 

      const vegaStakedInVesting = await api.call({ 
        abi: contractAbis.totalStaked, 
        target: vestingContract 
      })

      const vegaStakedInStaking = await api.call({
        abi: contractAbis.balanceOf,
        target: vega,
        params: stakingContract
      })

      return {
        '0xcb84d72e61e383767c4dfeb2d8ff7f4fb89abc6e': BigNumber(vegaStakedInVesting).plus(BigNumber(vegaStakedInStaking)).toFixed(0)
      }
      
    }
  }

})

