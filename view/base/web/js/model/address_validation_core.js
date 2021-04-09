/**
 * Taxjar_SalesTax
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 *
 * @category   Taxjar
 * @package    Taxjar_SalesTax
 * @copyright  Copyright (c) 2017 TaxJar. TaxJar is a trademark of TPS Unlimited, Inc. (http://www.taxjar.com)
 * @license    http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 */

define([
    'ko',
    'jquery'
],
function (ko, $) {
    'use strict';

    return {
        suggestedAddresses: ko.observable([]),
        activeAddress: {},
        validatedAddress: {},
        isRefresh: false,

        getAddressValidationUrl: function () {
            return '/rest/V1/Taxjar/address_validation/';
        },

        getSuggestedAddresses: function (addr, onDone, onFail) {
            var self = this;

            // Skip if non-US shipping address
            if (addr && addr.country_id !== 'US') {
                self.updateSuggestedAddresses([]);

                if (typeof onFail === 'function') {
                    onFail('NON_US_SHIPPING_ADDRESS');
                }
                return;
            }

            if (addr && addr.street && addr.city && addr.region_id) {
                var formattedAddr = self.formatAddress(addr);

                // Skip if already suggested
                if (self.addressMatches(formattedAddr, this.activeAddress)) {
                    if (typeof onFail === 'function') {
                        onFail('ADDRESS_ALREADY_VALIDATED');
                    }
                    return;
                }

                if (self.isSuggestedAddress(addr)) {
                    return;
                }

                $.ajax({
                    type: 'POST',
                    url: this.getAddressValidationUrl(),
                    data: JSON.stringify($.extend({}, {form_key: window.FORM_KEY}, formattedAddr)),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        // Intentionally empty to prevent the form_key from being appended to the body of the request
                    }
                }).done(function (response) {
                    self.activeAddress = formattedAddr;
                    self.validatedAddress = formattedAddr;
                    self.updateSuggestedAddresses(response);
                    self.isRefresh = true;

                    if (typeof onDone === 'function') {
                        onDone(response);
                    }
                }).fail(function (response) {
                    if (typeof onFail === 'function') {
                        onFail(response);
                    }
                });
            } else {
                if (typeof onFail === 'function') {
                    onFail('MISSING_ADDRESS_FIELDS');
                }
            }
        },

        isSuggestedAddress: function (address) {
            var self = this;
            var isSuggested = false;
            var suggestedAddresses = this.suggestedAddresses();
            suggestedAddresses.forEach(function(suggestedAddress, index) {
                if (self.addressMatches(self.formatAddress(address), self.formatSuggestedAddress(suggestedAddress.address))) {
                    isSuggested = true;
                }
            });
            return isSuggested;
        },

        updateSuggestedAddresses: function (addr) {
            this.suggestedAddresses(addr);
        },

        formatAddress: function (address) {
            var formattedAddress = {
                'street0': address.street[0],
                'city': address.city,
                'region': address.region_id,
                'country': address.country_id,
                'postcode': address.postcode
            };
            return formattedAddress;
        },

        formatSuggestedAddress: function (suggestedAddress) {
            var formattedAddress = {
                'street0': suggestedAddress.street[0],
                'city': suggestedAddress.city,
                'region': suggestedAddress.regionId,
                'country': suggestedAddress.countryId,
                'postcode': suggestedAddress.postcode
            };
            return formattedAddress;
        },

        addressMatches: function (address, addressToCompare) {
            console.log(JSON.stringify(address));
            console.log(JSON.stringify(addressToCompare));
            return JSON.stringify(address) === JSON.stringify(addressToCompare);
        }
    };
});
