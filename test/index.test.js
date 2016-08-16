'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var FacebookPixel = require('../lib');

describe('Facebook Pixel', function() {
  var analytics;
  var facebookPixel;
  var options = {
    legacyEvents: {
      legacyEvent: 'asdFrkj'
    },
    standardEvents: {
      standardEvent: 'standard'
    },
    pixelId: '123123123',
    agent: 'test'
  };

  beforeEach(function() {
    analytics = new Analytics();
    facebookPixel = new FacebookPixel(options);
    analytics.use(FacebookPixel);
    analytics.use(tester);
    analytics.add(facebookPixel);
    analytics.identify('123', {
      name: 'Ash Ketchum',
      gender: 'Male',
      birthday: '01/13/1991',
      address: {
        city: 'Emerald',
        state: 'Kanto',
        postalCode: 123456
      }
    });
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    facebookPixel.reset();
    sandbox();
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(facebookPixel, 'load');
      analytics.initialize();
    });

    afterEach(function() {
      facebookPixel.reset();
    });

    describe('#initialize', function() {
      it('should call load on initialize', function() {
        analytics.called(facebookPixel.load);
      });

      it('should set the correct agent and version', function() {
        analytics.equal(window.fbq.agent, 'test');
        analytics.equal(window.fbq.version, '2.0');
      });

      it('should set disablePushState to true', function() {
        analytics.equal(window.fbq.disablePushState, true);
      });

      it('should create fbq object', function() {
        analytics.assert(window.fbq instanceof Function);
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.stub(window, 'fbq');
      analytics.initialize();
    });

    it('should load', function(done) {
      analytics.load(facebookPixel, done);
    });

    it('should call init with the user\'s traits', function() {
      analytics.called(
        window.fbq,
        'init',
        options.pixelId,
        {
          ct: 'emerald',
          db: '19910113',
          fn: 'ash',
          ge: 'm',
          ln: 'ketchum',
          st: 'kanto',
          zp: 123456
        }
      );
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      it('should track a pageview', function() {
        analytics.page();
        analytics.called(window.fbq, 'track', 'PageView');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'fbq');
      });

      describe('event not mapped to legacy or standard', function() {
        it('should send a "custom" event', function() {
          analytics.track('event');
          analytics.called(window.fbq, 'trackCustom', 'event');
        });

        it('should send a "custom" event and properties', function() {
          analytics.track('event', { property: true });
          analytics.called(window.fbq, 'trackCustom', 'event', { property: true });
        });

        it('should send properties correctly', function() {
          analytics.track('event', {
            currency: 'XXX',
            revenue: 13,
            property: true
          });
          analytics.called(window.fbq, 'trackCustom', 'event', {
            currency: 'XXX',
            value: '13.00',
            property: true
          });
        });
      });

      describe('event mapped to legacy', function() {
        it('should send a correctly mapped event', function() {
          analytics.track('legacyEvent');
          analytics.called(window.fbq, 'track', 'asdFrkj', {
            currency: 'USD',
            value: '0.00'
          });
        });

        it('should send an event and properties', function() {
          analytics.track('legacyEvent', { revenue: 10 });
          analytics.called(window.fbq, 'track', 'asdFrkj', {
            currency: 'USD',
            value: '10.00'
          });
        });

        it('should send only currency and revenue', function() {
          analytics.track('legacyEvent', { revenue: 13, property: true });
          analytics.called(window.fbq, 'track', 'asdFrkj', {
            currency: 'USD',
            value: '13.00'
          });
        });
      });

      describe('event mapped to standard', function() {
        it('should send a correctly mapped event — no required properties', function() {
          analytics.track('standardEvent');
          analytics.called(window.fbq, 'track', 'standard', {});
        });

        it('should send properties correctly', function() {
          analytics.track('standardEvent', {
            currency: 'XXX',
            revenue: 13,
            property: true
          });
          analytics.called(window.fbq, 'track', 'standard', {
            currency: 'XXX',
            value: '13.00',
            property: true
          });
        });
      });

      describe('segment ecommerce => FB product audiences', function() {
        it('Product List Viewed', function() {
          analytics.track('Product List Viewed', { category: 'Games' });
          analytics.called(window.fbq, 'track', 'ViewContent', {
            content_ids: ['Games'],
            content_type: 'product_group'
          });
        });

        it('Product Viewed', function() {
          analytics.track('Product Viewed', {
            id: '507f1f77bcf86cd799439011',
            currency: 'USD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298'
          });
          analytics.called(window.fbq, 'track', 'ViewContent', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          });
        });

        it('Adding to Cart', function() {
          analytics.track('Product Added', {
            id: '507f1f77bcf86cd799439011',
            currency: 'USD',
            quantity: 1,
            price: 24.75,
            name: 'my product',
            category: 'cat 1',
            sku: 'p-298'
          });
          analytics.called(window.fbq, 'track', 'AddToCart', {
            content_ids: ['507f1f77bcf86cd799439011'],
            content_type: 'product',
            content_name: 'my product',
            content_category: 'cat 1',
            currency: 'USD',
            value: '24.75'
          });
        });

        it('Completing an Order', function() {
          analytics.track('Order Completed', {
            products: [
              { id: '507f1f77bcf86cd799439011' },
              { id: '505bd76785ebb509fc183733' }
            ],
            currency: 'USD',
            total: 0.50
          });
          analytics.called(window.fbq, 'track', 'Purchase', {
            content_ids: ['507f1f77bcf86cd799439011', '505bd76785ebb509fc183733'],
            content_type: 'product',
            currency: 'USD',
            value: '0.50'
          });
        });

        it('Should send both pixel and standard event if mapped', function() {
          facebookPixel.options.legacyEvents = { 'Completed Order': '123456' };
          analytics.track('Completed Order', {
            products: [
              { id: '507f1f77bcf86cd799439011' },
              { id: '505bd76785ebb509fc183733' }
            ],
            currency: 'USD',
            total: 0.50
          });
          analytics.called(window.fbq, 'track', 'Purchase', {
            content_ids: ['507f1f77bcf86cd799439011', '505bd76785ebb509fc183733'],
            content_type: 'product',
            currency: 'USD',
            value: '0.50'
          });
          analytics.called(window.fbq, 'track', '123456', {
            currency: 'USD',
            value: '0.50'
          });
        });
      });
    });
  });
});