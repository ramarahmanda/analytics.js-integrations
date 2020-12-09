'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var { Firehose } = require('@aws-sdk/client-firehose');
/**
 * Expose `AWSFirehose`.
 */

var AWSFirehose = (module.exports = integration('AWS Firehose')
  .global('awsFirehose')
  .option('accessKeyId', '')
  .option('secretAccessKey', '')
  .option('region','')
  .option('deliveryStreamName','')
);

/**
 * Initialize.
 *
 * @api public
 */

AWSFirehose.prototype.initialize = function() {
  var opts = setOpts(this.options);
  window.awsFirehose = window.awsFirehose || new Firehose(opts);
  this.load()
  this.ready()
};

/**
 * Loaded?
 *
 * @return {Boolean}
 * @api private
 */

AWSFirehose.prototype.loaded = function() {
  return is.object(window.awsFirehose);
};

/**
 * Track.
 *
 * @api public
 * @param {Facade} track
 */

AWSFirehose.prototype.track = function(track) {
  if (!window.awsFirehose) return
  if (!this.options.deliveryStreamName) return
  window.awsFirehose.putRecord({
    DeliveryStreamName: this.options.deliveryStreamName,
    Record: {
        Data: Buffer.from(JSON.stringify(track.json()), 'utf8'),
    }
})
};

/**
 * Revarruct Firehose configuration object from options
 *
 * @opts Object
 */

function setOpts({accessKeyId, secretAccessKey, region }) {
  return {
    credentials:{
      accessKeyId,
      secretAccessKey
  },
  region
  };
}
