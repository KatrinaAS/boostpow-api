
import { expect } from '../utils'

import models  from '../../models'

describe("Boost Job Model", () => {
after(async () => {
        await models.BoostJob.destroy({where: {}});

    });
    it('should set the profitability automatically', async () => {

        const params = {
            content: '00000000000000000000000000000000000000000068656c6c6f20776f726c64',
            difficulty: 1,
            tag: 'askbitcoin',
            txid: '00000000000000000000000000000000000000000068656c6c6f20776f726c64',
            vout: 0,
            value: 100000000,
            timestamp: new Date(),
            script: '08626f6f7374706f7775040000013220646c726f77206f6c6c656800000000000000000000000000000000000000000004b3936a1a1400000000000000000000000000616e696d616c7304913914e320000000000000000000000000006164646974696f6e616c4461746120686572657e7c557a766b7e52796b557a8254887e557a8258887e7c7eaa7c6b7e7e7c8254887e6c7e7c8254887eaa01007e816c825488537f7681530121a5696b768100a0691d00000000000000000000000000000000000000000000000000000000007e6c539458959901007e819f6976a96c88ac'
        }

        const record = await models.BoostJob.create(params)

        expect(record.profitability).to.be.greaterThan(0)

    })

})