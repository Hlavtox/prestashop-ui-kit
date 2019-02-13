/*!
 *  Lang.js for Laravel localization in JavaScript.
 *
 *  @version 1.1.12
 *  @license MIT https://github.com/rmariuzzo/Lang.js/blob/master/LICENSE
 *  @site    https://github.com/rmariuzzo/Lang.js
 *  @author  Rubens Mariuzzo <rubens@mariuzzo.com>
 */

(function (root, factory) {
  'use strict';
  module.exports = factory();
}(this, function () {
  'use strict';

  function convertNumber(str) {
    if (str === '-Inf') {
      return -Infinity;
    } else if (str === '+Inf' || str === 'Inf' || str === '*') {
      return Infinity;
    }
    return parseInt(str, 10);
  }

  // Derived from: https://github.com/symfony/translation/blob/460390765eb7bb9338a4a323b8a4e815a47541ba/Interval.php
  var intervalRegexp = /^({\s*(\-?\d+(\.\d+)?[\s*,\s*\-?\d+(\.\d+)?]*)\s*})|([\[\]])\s*(-Inf|\*|\-?\d+(\.\d+)?)\s*,\s*(\+?Inf|\*|\-?\d+(\.\d+)?)\s*([\[\]])$/;
  var anyIntervalRegexp = /({\s*(\-?\d+(\.\d+)?[\s*,\s*\-?\d+(\.\d+)?]*)\s*})|([\[\]])\s*(-Inf|\*|\-?\d+(\.\d+)?)\s*,\s*(\+?Inf|\*|\-?\d+(\.\d+)?)\s*([\[\]])/;

  // Default options //

  var defaults = {
    locale: 'en'/** The default locale if not set. */
  };

  // Constructor //
  var LangPluralization = function () {};

  /**
   * Gets the plural or singular form of the message specified based on an integer value.
   *
   * @param message {string} The key of the message.
   * @param count {number} The number of elements.
   * @param replacements {object} The replacements to be done in the message.
   * @param locale {string} The locale to use, if not passed use the default locale.
   *
   * @return {string} The translation message according to an integer value.
   */
  LangPluralization.prototype.transChoice = function (message, number, replacements, locale) {
    // Set default values for parameters replace and locale
    replacements = typeof replacements !== 'undefined'
      ? replacements
      : {};

    // The count must be replaced if found in the message
    replacements.count = number;

    // Separate the plural from the singular, if any
    var messageParts = message.split('|');

    // Get the explicit rules, If any
    var explicitRules = [];

    for (var i = 0; i < messageParts.length; i++) {
      messageParts[i] = messageParts[i].trim();

      if (anyIntervalRegexp.test(messageParts[i])) {
        var messageSpaceSplit = messageParts[i].split(/\s/);
        explicitRules.push(messageSpaceSplit.shift());
        messageParts[i] = messageSpaceSplit.join(' ');
      }
    }


    // Check if there's only one message
    if (messageParts.length === 1) {
      // Nothing to do here
      return message;
    }

    // Check the explicit rules
    for (var j = 0; j < explicitRules.length; j++) {
      if (this._testInterval(number, explicitRules[j])) {
        return messageParts[j];
      }
    }

    locale = locale || defaults.locale;
    var pluralForm = this._getPluralForm(number, locale);

    return messageParts[pluralForm];
  };

  /**
   * Sort replacement keys by length in descending order.
   *
   * @param a {string} Replacement key
   * @param b {string} Sibling replacement key
   * @return {number}
   * @private
   */
  LangPluralization.prototype._sortReplacementKeys = function (a, b) {
    return b.length - a.length;
  };

  /**
   * Apply replacements to a string message containing placeholders.
   *
   * @param message {string} The text message.
   * @param replacements {object} The replacements to be done in the message.
   *
   * @return {string} The string message with replacements applied.
   */
  LangPluralization.prototype._applyReplacements = function (message, replacements) {
    var keys = Object.keys(replacements).sort(this._sortReplacementKeys);

    keys.forEach(function (replace) {
      message = message.replace(new RegExp(':' + replace, 'gi'), function (match) {
        var value = replacements[replace];

        // Capitalize all characters.
        var allCaps = match === match.toUpperCase();
        if (allCaps) {
          return value.toUpperCase();
        }

        // Capitalize first letter.
        var firstCap = match === match.replace(/\w/i, function (letter) {
          return letter.toUpperCase();
        });
        if (firstCap) {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }

        return value;
      });
    });
    return message;
  };

  /**
   * Checks if the given `count` is within the interval defined by the {string} `interval`
   *
   * @param  count     {int}    The amount of items.
   * @param  interval  {string} The interval to be compared with the count.
   * @return {boolean}          Returns true if count is within interval; false otherwise.
   */
  LangPluralization.prototype._testInterval = function (count, interval) {
    /**
     * From the Symfony\Component\Translation\Interval Docs
     *
     * Tests if a given number belongs to a given math interval.
     *
     * An interval can represent a finite set of numbers:
     *
     *  {1,2,3,4}
     *
     * An interval can represent numbers between two numbers:
     *
     *  [1, +Inf]
     *  ]-1,2[
     *
     * The left delimiter can be [ (inclusive) or ] (exclusive).
     * The right delimiter can be [ (exclusive) or ] (inclusive).
     * Beside numbers, you can use -Inf and +Inf for the infinite.
     */

    if (typeof interval !== 'string') {
      throw 'Invalid interval: should be a string.';
    }

    interval = interval.trim();

    var matches = interval.match(intervalRegexp);
    if (!matches) {
      throw 'Invalid interval: ' + interval;
    }

    if (matches[2]) {
      var items = matches[2].split(',');
      for (var i = 0; i < items.length; i++) {
        if (parseInt(items[i], 10) === count) {
          return true;
        }
      }
    } else {
      // Remove falsy values.
      matches = matches.filter(function (match) {
        return !!match;
      });

      var leftDelimiter = matches[1];
      var leftNumber = convertNumber(matches[2]);
      if (leftNumber === Infinity) {
        leftNumber = -Infinity;
      }
      var rightNumber = convertNumber(matches[3]);
      var rightDelimiter = matches[4];

      return (leftDelimiter === '[' ? count >= leftNumber : count > leftNumber)
        && (rightDelimiter === ']' ? count <= rightNumber : count < rightNumber);
    }

    return false;
  };

  /**
   * Returns the plural position to use for the given locale and number.
   *
   * The plural rules are derived from code of the Zend Framework (2010-09-25),
   * which is subject to the new BSD license (http://framework.zend.com/license/new-bsd).
   * Copyright (c) 2005-2010 Zend Technologies USA Inc. (http://www.zend.com)
   *
   * @param {Number} count
   * @param {String} locale
   * @return {Number}
   */
  LangPluralization.prototype._getPluralForm = function (count, locale) {
    switch (locale) {
    case 'az':
    case 'bo':
    case 'dz':
    case 'id':
    case 'ja':
    case 'jv':
    case 'ka':
    case 'km':
    case 'kn':
    case 'ko':
    case 'ms':
    case 'th':
    case 'tr':
    case 'vi':
    case 'zh':
      return 0;

    case 'af':
    case 'bn':
    case 'bg':
    case 'ca':
    case 'da':
    case 'de':
    case 'el':
    case 'en':
    case 'eo':
    case 'es':
    case 'et':
    case 'eu':
    case 'fa':
    case 'fi':
    case 'fo':
    case 'fur':
    case 'fy':
    case 'gl':
    case 'gu':
    case 'ha':
    case 'he':
    case 'hu':
    case 'is':
    case 'it':
    case 'ku':
    case 'lb':
    case 'ml':
    case 'mn':
    case 'mr':
    case 'nah':
    case 'nb':
    case 'ne':
    case 'nl':
    case 'nn':
    case 'no':
    case 'om':
    case 'or':
    case 'pa':
    case 'pap':
    case 'ps':
    case 'pt':
    case 'so':
    case 'sq':
    case 'sv':
    case 'sw':
    case 'ta':
    case 'te':
    case 'tk':
    case 'ur':
    case 'zu':
      return (count == 1)
        ? 0
        : 1;

    case 'am':
    case 'bh':
    case 'fil':
    case 'fr':
    case 'gun':
    case 'hi':
    case 'hy':
    case 'ln':
    case 'mg':
    case 'nso':
    case 'xbr':
    case 'ti':
    case 'wa':
      return ((count === 0) || (count === 1))
        ? 0
        : 1;

    case 'be':
    case 'bs':
    case 'hr':
    case 'ru':
    case 'sr':
    case 'uk':
      return ((count % 10 == 1) && (count % 100 != 11))
        ? 0
        : (((count % 10 >= 2) && (count % 10 <= 4) && ((count % 100 < 10) || (count % 100 >= 20)))
          ? 1
          : 2);

    case 'cs':
    case 'sk':
      return (count == 1)
        ? 0
        : (((count >= 2) && (count <= 4))
          ? 1
          : 2);

    case 'ga':
      return (count == 1)
        ? 0
        : ((count == 2)
          ? 1
          : 2);

    case 'lt':
      return ((count % 10 == 1) && (count % 100 != 11))
        ? 0
        : (((count % 10 >= 2) && ((count % 100 < 10) || (count % 100 >= 20)))
          ? 1
          : 2);

    case 'sl':
      return (count % 100 == 1)
        ? 0
        : ((count % 100 == 2)
          ? 1
          : (((count % 100 == 3) || (count % 100 == 4))
            ? 2
            : 3));

    case 'mk':
      return (count % 10 == 1)
        ? 0
        : 1;

    case 'mt':
      return (count == 1)
        ? 0
        : (((count === 0) || ((count % 100 > 1) && (count % 100 < 11)))
          ? 1
          : (((count % 100 > 10) && (count % 100 < 20))
            ? 2
            : 3));

    case 'lv':
      return (count === 0)
        ? 0
        : (((count % 10 == 1) && (count % 100 != 11))
          ? 1
          : 2);

    case 'pl':
      return (count == 1)
        ? 0
        : (((count % 10 >= 2) && (count % 10 <= 4) && ((count % 100 < 12) || (count % 100 > 14)))
          ? 1
          : 2);

    case 'cy':
      return (count == 1)
        ? 0
        : ((count == 2)
          ? 1
          : (((count == 8) || (count == 11))
            ? 2
            : 3));

    case 'ro':
      return (count == 1)
        ? 0
        : (((count === 0) || ((count % 100 > 0) && (count % 100 < 20)))
          ? 1
          : 2);

    case 'ar':
      return (count === 0)
        ? 0
        : ((count == 1)
          ? 1
          : ((count == 2)
            ? 2
            : (((count % 100 >= 3) && (count % 100 <= 10))
              ? 3
              : (((count % 100 >= 11) && (count % 100 <= 99))
                ? 4
                : 5))));

    default:
      return 0;
    }
  };

  return LangPluralization;
}));
