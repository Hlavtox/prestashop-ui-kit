var Translator = require('../utils/Translator.js');

/**
 * When there's only one file it displays name. However if there are more files it displays the text, which is retrieved
 * by pluralisation rules according to file count.
 *
 * @param {object} files
 * @param {string} multipleFilesPluralisedMessage - message can be separated by pipelines
 * @param {string} locale - ISO 639-1 format locale
 * @returns {string}
 * @private
 */
var getTextByFilesCount = function (files, multipleFilesPluralisedMessage, locale) {
  var filesCount = files.length;
  if (filesCount === 1) {
    return files[0].name;
  }

  var translator = new Translator();

  return translator.transChoice(
    multipleFilesPluralisedMessage,
    filesCount,
    {
      count: filesCount,
    },
    locale,
  );
};

/**
 * Event listener for file import event - can be executed within selecting the files or
 * just by drag and drop action applied.
 */
var initInputFileChangeEvent = function () {
  jQuery('.custom-file-input').on('change', function () {
    var $input = jQuery(this);
    var files = $input[0].files;
    var $label = $input.next('label');

    $label.text(
      getTextByFilesCount(files, $input.attr('data-multiple-files-text'), $input.attr('data-locale')),
    );
  });
};

module.exports = initInputFileChangeEvent;
