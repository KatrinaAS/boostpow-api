
import models from '../../models';
import { buildServer } from '../../server'

import { expect, server } from '../utils'

describe("API Server Posting Transactions", () => {
  var server;
  after(async () => {
        await models.BoostJob.destroy({where: {}});
        await models.BoostWork.destroy({where: {}});
        await models.Event.destroy({where: {}});
    });
  before(async () => {

    server = await buildServer()

  })

  describe("POST /api/v1/boost/scripts", () => {

    it("should generate a boost job script", async () => {

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/boost/scripts',
        payload: {
          content:
              "00000000000000000000000000000000000000000068656c6c6f20776f726c64",
          diff: 157416.40184364,
          category: "00000132",
          tag: "00000000000000000000000000616e696d616c73",
          additionalData:
              "000000000000000000000000006164646974696f6e616c446174612068657265",
          userNonce: "913914e3"
        }
      })

      const script = '08626f6f7374706f7775040000013220646c726f77206f6c6c656800000000000000000000000000000000000000000004b3936a1a1400000000000000000000000000616e696d616c7304913914e320000000000000000000000000006164646974696f6e616c4461746120686572657e7c557a766b7e52796b557a8254887e557a8258887e7c7eaa7c6b7e7e7c8254887e6c7e7c8254887eaa01007e816c825488537f7681530121a5696b768100a0691d00000000000000000000000000000000000000000000000000000000007e6c539458959901007e819f6976a96c88ac'

      expect(response.statusCode).to.be.equal(201)

      expect(response.result.script.hex).to.be.equal(script)

    })
  })
  
  describe('GET /api/v1/tx/{txid}', () => {

    it('should return the tx hex, json, and merkle proof', async () => {

      const txid = 'c3040ff89cf83aeab9fa8628fd2cedd460df98ba6557ef6fa24263d6eab2378d'

      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/tx/${txid}`
      })

      const { txhex } = response.result

      expect(txhex).to.be.equal('0100000002e743157d509236ef2db041bb6416e73e6520e723838cdbf70cd424a34964915e000000006a47304402205d73349f32dff826bc9304be0eb40f53d53a5897d789f5afc39d05be10dbdbb20220791838109f4d63ee0defa433d728e346e7b4edd3526fe500b21ff600281a6f69412103a97e0e500e30f03366e17d0e755425064dea87fbc9b21d0ed01b3991c2f8d31affffffffde0a2abe189a16094890d18765bf3141db96a20917f4dfabd2c09a908098a572010000006a47304402202a774071d85fbffde1dc4c5988e9a08fcd4f393eae1a404d7850771dba29205b02202eb029a55adf3733104884c7f76b8e3358fe8bb382d069fa2b0a0771e2fffe4e41210290ee75158bcbb35fa585485e276484101eace4af3ed690e481cf8788deec26a9ffffffff02a086010000000000ad08626f6f7374706f7775044200000020f43b8239984bf22910c7c848e333d445878ed6fef17cc1bda2657ce608b053de04f6ff091d00048ccfbf0d007e7c557a766b7e52796b557a8254887e557a8258887e7c7eaa7c6b7e7e7c8254887e6c7e7c8254887eaa01007e816c825488537f7681530121a5696b768100a0691d00000000000000000000000000000000000000000000000000000000007e6c539458959901007e819f6976a96c88ac38d7ef0b000000001976a9140e235503de092a5a9ecf0b6b6f4e1bdff5e8cbcf88ac00000000')

    })

  })

})

