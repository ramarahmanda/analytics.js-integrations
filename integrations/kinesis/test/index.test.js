'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var AWSFirehose = require('../lib/');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var faker = require('faker')

describe('AWS Firehose', function() {
  var analytics;
  var awsFirehose;
  var options = {
    accessKeyId:faker.random.uuid(),
    secretAccessKey:faker.random.uuid(),
    region:faker.address.country(),
    deliveryStreamName: faker.company.companySuffix()
  };
  var firehoseConfig = {
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey:options.secretAccessKey,
    },
    region: options.region
  }

  beforeEach(function() {
    analytics = new Analytics();
    awsFirehose = new AWSFirehose(options);
    analytics.use(AWSFirehose);
    analytics.use(tester);
    analytics.add(awsFirehose);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    awsFirehose.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      AWSFirehose,
      integration('AWS Firehose')
        .global('awsFirehose')
        .option('accessKeyId', '')
        .option('secretAccessKey', '')
        .option('region','')
        .option('deliveryStreamName','')
    );
  });

  describe('before loading', function() {
    describe('#initialize', function() {
      beforeEach(function() {
        analytics.stub(awsFirehose, 'load');
      });

      afterEach(function() {
        delete window.awsFirehose;
      });

      it('should configure awsFirehose', async function() {
        analytics.assert(window.awsFirehose == null);
        analytics.initialize();
        const config = window.awsFirehose.config
        analytics.deepEqual(firehoseConfig, {
          credentials: await config.credentials(),
          region: await config.region()
        });
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(awsFirehose.load);
      });
    });

    describe('#loaded', function() {
      it('should check for window.awsFirehose', function() {
        analytics.assert(!awsFirehose.loaded());
        window.awsFirehose = awsFirehose;
        analytics.assert(awsFirehose.loaded());
      });
    });
  });

  describe('track', function() {
    it('should track data', function() {
      analytics.initialize()
      analytics.track('data')
    });
  });
});
