

import { Server } from '@hapi/hapi'

import { log } from './log'

const Joi = require('joi')

import * as schema from './server/schema'

import { join } from 'path'

const Inert = require('@hapi/inert');

const Vision = require('@hapi/vision');

const HapiSwagger = require('hapi-swagger');

const Pack = require('../package');

import { load } from './server/handlers'

import { register as prometheus } from './metrics'

import { plugin as socketio } from './socket.io/plugin'

const handlers = load(join(__dirname, './server/handlers'))

export async function buildServer(): Server {

  const server = new Server({
    host: process.env.HOST || "0.0.0.0",
    port: process.env.PORT || 8000,
    routes: {
      cors: true,
      validate: {
        options: {
          stripUnknown: true
        }
      }
    }
  });

  await server.register(socketio);

  server.route({
    method: 'GET',
    path: '/metrics',
    handler: async (req, h) => {
      return h.response(await prometheus.metrics())
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/rankings',
    handler: handlers.Rankings.index,
    options: {
      description: 'Rank content by difficulty in a given time period',
      tags: ['api', 'rankings'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          rankings: Joi.any().required()
        })
      },
      validate: {
        query: Joi.object({
          start_date: Joi.number().optional().description('unix timestamp'),
          end_date: Joi.number().optional().description('unix timestamp'),
          tag: Joi.string().optional()
        }).optional()
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/rankings/images',
    handler: handlers.Rankings.images,
    options: {
      description: 'Rank image content by difficulty in a given time period',
      tags: ['api', 'rankings', 'images'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          rankings: Joi.any().required()
        })
      },
      validate: {
        query: Joi.object({
          start_date: Joi.number().optional().description('unix timestamp'),
          end_date: Joi.number().optional().description('unix timestamp'),
          tag: Joi.string().optional()
        }).optional()
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/rankings/tags',
    handler: handlers.Rankings.tags,
    options: {
      description: 'Return rank of tags ie baes, askbitcoin, etc',
      tags: ['api', 'rankings'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          rankings: Joi.any().required()
        })
      },
      validate: {
        query: Joi.object({
          start_date: Joi.number().optional().description('unix timestamp'),
          end_date: Joi.number().optional().description('unix timestamp')
        })
      }
    }
  })


  server.route({
    method: 'POST',
    path: '/api/v1/boost/jobs',
    handler: handlers.BoostJobs.create,
    options: {
      description: 'Submit Bitcoin Transactions Containing Boost Jobs To Index',
      notes: 'Receives boost job transactions in hex form and indexes them if they are valid bitcoin transactions',
      tags: ['api', 'jobs'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          job: schema.Job
        })
      },
      validate: {
        payload: Joi.object({
          transaction: Joi.string().required()
        })
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/api/v1/boost/scripts',
    handler: handlers.Scripts.create,
    options: {
      description: 'Build Boost Job Bitcoin Script ASM from JSON',
      notes: 'Provide a Boost Job data structure and receive a boost job script in response. Useful for clients that do not want to include a boostpow sdk',
      tags: ['api', 'scripts'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          script: Joi.object({
            hex: Joi.string().required()
          }).label('BoostJobScript').required()
        })
      },
      validate: {
        payload: Joi.object({
          content: Joi.string().required(),
          diff: Joi.number().required(),
          category: Joi.string().optional(),
          tag: Joi.string().optional(),
          additionalData: Joi.string().optional(),
          userNonce: Joi.string().optional()
        })
      }
    }
  })


  server.route({
    method: 'GET',
    path: '/api/v1/boostpow/{tx_id}/new',
    handler: handlers.BoostJobs.build,
    options: {
      description: 'Create new Boost Pow job script for payment',
      tags: ['api', 'boostpow'],
      validate: {
        query: Joi.object({
          currency: Joi.string().default('USD').optional(),
          value: Joi.number().default(0.05).optional(),
          difficulty: Joi.number().optional(),
          category: Joi.string().optional(),
          tag: Joi.string().optional()
        }).label('NewBoostPowOptions'),
        params: Joi.object({
          tx_id: Joi.string().required()
        })
      },
      response: {
        failAction: 'log',
        schema: Joi.object({
          network: Joi.string().required(),
          outputs: Joi.array().items(Joi.object({
            script: Joi.string().required(),
            amount: Joi.number().integer().required()
          }).required().label('PaymentRequestOutput')).required(),
          creationTimestamp: Joi.number().integer().required(),
          expirationTimestamp: Joi.number().integer().required(),
          memo: Joi.string().optional(),
          paymentUrl: Joi.string().required(),
          merchantData: Joi.string().optional()
        })
          
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/api/v1/boost/proofs',
    handler: handlers.BoostWork.create,
    options: {
      description: 'Submit Bitcoin Transactions Containing Proof of Work for a Job',
      notes: 'When work is completed submit it here to be indexed. Accepts valid transactions which spend the work. The transaction may or may not be already broadcast to the Bitcoin network',
      tags: ['api', 'work'],
      response: {
        failAction: 'log'
      },
      validate: {
        payload: Joi.object({
          transaction: Joi.string().required()
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/proofs',
    handler: handlers.BoostWork.index,
    options: {
      description: 'List Boostpow Proofs',
      tags: ['api', 'work'],
      response: {
        failAction: 'log'
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/api/v1/boost/proofs/{txid}',
    handler: handlers.BoostWork.createByTxid,
    options: {
      description: 'Submit Bitcoin Transactions Containing Proof of Work for a Job',
      notes: 'When work is completed submit it here to be indexed. Accepts valid transactions which spend the work. The transaction may or may not be already broadcast to the Bitcoin network',
      tags: ['api', 'work'],
      validate: {
        params: Joi.object({
          txid: Joi.string().required()
        }).required()
      },
      response: {
        failAction: 'log'
      },
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/jobs',
    handler: handlers.BoostJobs.index,
    options: {
      description: 'List Available Jobs',
      notes: 'For miners looking to mine new jobs, list available jobs filtered by content, difficulty, reward, tag and category',
      tags: ['api', 'jobs'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          jobs: Joi.array().items(Joi.object({
            id: Joi.number(),
            content: Joi.string().required(),
            difficulty: Joi.number().required(),
            category: Joi.string().required(),
            tag: Joi.string().required(),
            additionalData: Joi.string().required(),
            userNonce: Joi.string().required(),
            vout: Joi.number().required(),
            value: Joi.number().required(),
            timestamp: Joi.date().required(),
            spent: Joi.boolean().required(),
            script: Joi.string().required(),
            spent_txid: Joi.string().optional(),
            spent_vout: Joi.number().optional(),
            createdAt: Joi.date().optional(),
            updatedAt: Joi.date().optional()
          }))
        })
      },
      validate: {
        query: Joi.object({
          content: Joi.string().optional(),
          tag: Joi.string().optional(),
          miner: Joi.string().optional(),
          limit: Joi.number().optional(),
          offset: Joi.number().optional()
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/work',
    handler: handlers.BoostWork.index,
    options: {
      description: 'List Completed Work',
      notes: 'List recently performed work (completed jobs) filtered by content, difficulty, reward, tag and category',
      tags: ['api', 'work'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          jobs: Joi.array().items(schema.Job)
        })
      },
      validate: {
        query: Joi.object({
          limit: Joi.number().optional(),
          tag: Joi.string().optional(),
          offset: Joi.number().optional(),
          start: Joi.number().optional(),
          end: Joi.number().optional()
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/boost/jobs/{txid}',
    handler: handlers.BoostJobs.show,
    options: {
      description: 'Get Job From Txid',
      notes: 'Get information about a job from a transaction id. Optionally postfix with _v0, _v1, etc to specify the output containing the job',
      tags: ['api', 'jobs'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          job: Joi.object({
            id: Joi.number().required()
          }).required()
        }).required()
      },
      validate: {
        params: Joi.object({
          txid: Joi.string().required()
        }).required()
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/api/v1/boost/jobs/{txid}',
    handler: handlers.BoostJobs.createByTxid,
    options: {
      description: 'Import Existing Job Transaction By Txid',
      notes: 'For any job that has not already been indexed by the system but has already been broadcast through the peer to peer network',
      tags: ['api', 'jobs'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          job: Joi.object({
            id: Joi.number().required()
          }).required()
        }).required()
      },
      validate: {
        params: Joi.object({
          txid: Joi.string().required()
        }).required()
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/spends/{output_txid}/{output_index}',
    handler: handlers.Spends.show,
    options: {
      description: 'Gets the transaction input for a given transaction output',
      notes: 'Gets the transaction input for a given transaction output',
      tags: ['api', 'spends'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          spent: Joi.boolean().required(),
          output: Joi.object({
            txid: Joi.string().required(),
            index: Joi.number().required()
          }).required(),
          input: Joi.object({
            txid: Joi.string().required(),
            index: Joi.number().required()
          }).optional()
        })
      },
      validate: {
        params: Joi.object({
          output_txid: Joi.string().required(),
          output_index: Joi.number().required()
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/tx/{txid}',
    handler: handlers.Transactions.show,
    options: {
      description: 'Get Bitcoin Transaction by Txid',
      notes: 'Returns the transaction in hex, json, and includes a merkleproof',
      tags: ['experimental', 'transactions'],
      response: {
        failAction: 'log',
        schema: Joi.object({
          txhex: Joi.string().required(),
          txjson: Joi.object().required(),
          merkleproof: Joi.object().required()
        })
      },
      validate: {
        params: Joi.object({
          txid: Joi.string().required()
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/utxos/{address}',
    handler: handlers.UnspentOutputs.index,
    options: {
      description: 'List Unspent Outputs For Address',
      tags: ['api', 'utxos'],
      response: {
        failAction: 'log'
      },
      validate: {
        params: Joi.object({
          address: Joi.string().required()
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/content/{txid}',
    handler: handlers.Content.show,
    options: {
      description: 'Get Metadata About Onchain Content by Txid',
      tags: ['api', 'content'],
      response: {
        failAction: 'log'
      },
      validate: {
        params: Joi.object({
          txid: Joi.string().required()
        })
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/api/v1/transactions',
    handler: handlers.Transactions.create,
    options: {
      description: 'Submit new, signed transactions to the network',
      tags: ['api', 'transactions'],
      validate: {
        failAction: 'log',
        payload: Joi.object({
          transaction: Joi.string().required()
        }).label('SubmitTransaction')
      },
      response: {
        failAction: 'log',
        schema: Joi.object({
          payment: Joi.string().required(),
          memo: Joi.string().optional(),
          error: Joi.number().optional()
        }).label('PaymentAck')
      }

    }
  })

  const swaggerOptions = {
    info: {
      title: 'Powco API Docs',
      version: Pack.version,
      description: 'Proof of Work Service Powered by Boost POW'
    },
    schemes: ['https'],
    host: 'pow.co',
    documentationPath: '/api',
    grouping: 'tags'
  }

  // Transform non-boom errors into boom ones
  server.ext('onPreResponse', (request, h) => {
    // Transform only server errors 
    if (request.response.isBoom) {

      log.error('hapi.error.response', request.response)

      const statusCode = request.response.output.statusCode || 500

      log.error('hapi.error.response', request.response)

      if (statusCode === 500) {

        const response = {
          statusCode,
          error: request.response.error || request.response.message,
          message: request.response.message
        }
  
        return h.response(response).code(statusCode)

      } else {
    
        return h.response(request.response.output).code(statusCode)

      }

    } else {
      // Otherwise just continue with previous response
      return h.continue

    }
    })
  

  await server.register([
      Inert,
      Vision,
      {
          plugin: HapiSwagger,
          options: swaggerOptions
      }
  ]);

  return server

}
