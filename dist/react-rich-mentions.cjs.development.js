'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var noop = function noop() {};

var initialContext = {
  getTransformedValue: function getTransformedValue() {
    return '';
  },
  insertFragment: noop,
  setValue: noop,
  activeSearch: '',
  inputElement: null,
  setInputElement: noop,
  selectItem: noop,
  setActiveItemIndex: noop,
  opened: null,
  index: 0,
  loading: false,
  results: [],
  closeAutocomplete: noop,
  openAutocomplete: noop,
  onBeforeChanges: noop,
  onKeyDown: noop,
  onChanges: noop,
  fixed: true,
  setPositionFixed: noop
};
var RichMentionsContext = /*#__PURE__*/React.createContext(initialContext);

function RichMentionsInput(_ref) {
  var defaultValue = _ref.defaultValue,
      singleLine = _ref.singleLine,
      onEnter = _ref.onEnter,
      divAttributes = _objectWithoutPropertiesLoose(_ref, ["defaultValue", "singleLine", "onEnter"]);

  var ref = React.useRef(null);

  var _useContext = React.useContext(RichMentionsContext),
      setInputElement = _useContext.setInputElement,
      onBeforeChanges = _useContext.onBeforeChanges,
      onKeyDown = _useContext.onKeyDown,
      onChanges = _useContext.onChanges,
      getInitialHTML = _useContext.getInitialHTML,
      opened = _useContext.opened;

  if (ref.current === null && defaultValue && getInitialHTML) {
    ref.current = getInitialHTML(defaultValue);
  }

  {
    // @ts-ignore
    divAttributes['data-cy'] = 'input';
  }

  var mergeOnKeyDown = function mergeOnKeyDown(event) {
    if (event.key === 'Enter') {
      if (onEnter && !opened) {
        //Because the updates, has to be applied for the event to get the correct value
        //TODO: Better handling
        setTimeout(function () {
          onEnter();
        }, 200);
      }

      if (singleLine) {
        event.preventDefault();
      }
    }

    onKeyDown(event);

    if (divAttributes.onKeyDown) {
      divAttributes.onKeyDown(event);
    }
  };

  var onInput = function onInput(event) {
    if (divAttributes.onInput) {
      divAttributes.onInput(event);
    }

    onChanges(event);
  };

  var onBeforeInput = function onBeforeInput(event) {
    onBeforeChanges(event);

    if (divAttributes.onBeforeInput) {
      divAttributes.onBeforeInput(event);
    }
  };

  var style = {
    outline: 0
  };

  if (singleLine) {
    style = _extends({}, style, {
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    });
  }

  return React__default.createElement("div", Object.assign({
    ref: setInputElement
  }, divAttributes, {
    contentEditable: true,
    onBeforeInput: onBeforeInput,
    onKeyDown: mergeOnKeyDown,
    onInput: onInput,
    dangerouslySetInnerHTML: {
      __html: ref.current || ''
    },
    style: style
  }));
}

function nodeToHtmlElement(node) {
  return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
}

function getFragment(node) {
  var element = nodeToHtmlElement(node);
  return element && element.hasAttribute('data-rich-mentions') ? element : null;
}

function setCursorPosition(element, position) {
  var selection = document.getSelection();
  var range = document.createRange();
  range.setStart(element, position);
  range.collapse(true);

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function escapeFragmentWithValue(element, text, position) {
  if (position === void 0) {
    position = 'after';
  }

  var textNode = document.createTextNode(text.replace(/\s/g, "\xA0"));
  var parent = element.parentElement;

  if (parent) {
    if (position === 'after') {
      parent.insertBefore(textNode, element.nextSibling);
    } else {
      parent.insertBefore(textNode, element);
    }

    setCursorPosition(textNode, text.length);
  }
}

function fixCursorInsertion(event, selection) {
  if (event.defaultPrevented) {
    return;
  } // @ts-ignore


  var insertion = event.data;
  var container = event.currentTarget;

  for (var i = 0; i < selection.rangeCount; i++) {
    var range = selection.getRangeAt(i); // Same element

    if (range.startContainer === range.endContainer) {
      var element = nodeToHtmlElement(range.startContainer);

      if (!container.contains(element)) {
        continue;
      } // If outside pending fragment, insert char inside


      if (range.startContainer instanceof Text && range.startOffset === 0) {
        var previousChild = range.startContainer.previousSibling;
        var previousElement = range.startContainer.previousElementSibling;

        if (previousChild && previousElement && previousChild === previousElement && previousElement.hasAttribute('data-rich-mentions') && !previousElement.hasAttribute('data-integrity')) {
          previousElement.appendChild(document.createTextNode(insertion));
          event.preventDefault();
          continue;
        }
      } // TODO range.endContainer


      if (!element || container === element || !element.hasAttribute('data-rich-mentions')) {
        continue;
      } // At first position of fragment, move before it


      if (range.endOffset === 0) {
        escapeFragmentWithValue(element, insertion, 'before');
        event.preventDefault();
        continue;
      }

      var isFinal = element.hasAttribute('data-integrity');
      var text = element.textContent || ''; // Move outside final fragment

      if (isFinal && range.startOffset === text.length) {
        escapeFragmentWithValue(element, insertion, 'after');
        event.preventDefault();
        continue;
      }
    }
  }
}

function deleteSelection(selection, event) {
  var deleted = false;
  var lastDeletedRange = null;

  for (var i = 0; i < selection.rangeCount; ++i) {
    var range = selection.getRangeAt(i);

    if (range.startContainer !== range.endContainer || range.startOffset !== range.endOffset) {
      deleted = true;
      lastDeletedRange = range;
      range.deleteContents();
    }
  } // @ts-ignore


  if (event != null && event.data && lastDeletedRange) {
    // @ts-ignore
    var textNode = document.createTextNode(event.data);
    lastDeletedRange.insertNode(textNode);
    setCursorPosition(textNode, 1);
    event.preventDefault();
  }

  return deleted;
}

function transformFinalFragment(span, ref, config) {
  var content = ref.replace(config.match, config.matchDisplay).replace(/\s/g, "\xA0");
  span.textContent = content;
  span.setAttribute('data-rich-mentions', ref);
  span.setAttribute('spellcheck', 'false');

  {
    span.setAttribute('data-cy', 'final');
  }

  if (config.customizeFragment) {
    config.customizeFragment(span, true);
  }

  span.setAttribute('data-integrity', span.innerHTML);

  if (span.parentElement) {
    // TODO only if no space after
    var textNode = document.createTextNode("\xA0");
    span.parentElement.insertBefore(textNode, span.nextSibling);
    setCursorPosition(textNode, 1);
  }
}

function removeBrokenFragments(inputElement, configs) {
  Array.from(inputElement.children).forEach(function fixBrokenElement(element, index) {
    var parent = element.parentElement; // Replace BR with div>br
    // There is a bug on chrome occuring when the cursor is just after a br, the selection is broken and
    // we can't locate its position. By moving them inside a div it fixes the problem

    if (element instanceof HTMLBRElement) {
      if (parent.children.length !== 1 && index !== parent.children.length - 1) {
        var div = document.createElement('div');
        parent.insertBefore(div, element);
        div.appendChild(element);
      }

      return;
    }

    if (element instanceof HTMLDivElement && !element.attributes.length) {
      Array.from(element.children).forEach(fixBrokenElement);
      return;
    }

    var text = element.textContent || ''; // Fixes a Chrome bug:
    // - Add a span with color on a contenteditable.
    // - Remove the span with backspace.
    // - Type text.
    // Chrome will try to restore the style by adding a <font> with specific styles.

    if (!(element instanceof Text) && !element.hasAttribute('data-rich-mentions')) {
      parent.insertBefore(document.createTextNode(text), element);
      parent.removeChild(element);
      return;
    } // On final fragments, avoid edition.
    // The data-integrity attribute contains the original fragment content.
    // If it does not match, just remove the entire fragment.


    if (element.hasAttribute('data-integrity')) {
      // final fragment, if not valid remove it completely
      if (element.getAttribute('data-integrity') !== element.innerHTML) {
        parent.removeChild(element);
      }

      return;
    } // If we have a pending fragment that is now invalid since the last (let
    // say you just removed the '@' from it, then we can safely extract the
    // text, remove the fragment, and insert the text back without it.


    var isValid = configs.some(function (cfg) {
      return text.match(cfg.query);
    });

    if (!isValid) {
      parent.insertBefore(document.createTextNode(text), element.nextSibling);
      parent.removeChild(element);
    }
  });
}

var isSpace = function isSpace(_char) {
  return /(\u00A0|\s)/.test(_char);
};

var needSpaceBefore = function needSpaceBefore(text, offset, node, defaultValue) {
  if (offset > 0) {
    return !isSpace(text.charAt(offset - 1));
  } // Do not add space if the previous element is a block adding a line break


  if (['DIV', 'BR'].includes(node.nodeName)) {
    return false;
  }

  if (node.previousSibling) {
    // TODO get first previous element with text
    var prevText = node.previousSibling.textContent || '';
    return !!prevText.length && !isSpace(prevText.charAt(prevText.length - 1));
  }

  return defaultValue;
};

var needSpaceAfter = function needSpaceAfter(text, offset, node) {
  if (offset < text.length) {
    return !isSpace(text.charAt(text.length - 1));
  }

  if (!node.nextSibling) {
    return true;
  }

  var nextText = node.nextSibling.textContent || ''; // TODO get first next fragment with content...

  return !nextText.length || !isSpace(nextText.charAt(0));
};

function insertFragment(ref, customFragment, configs, inputElement) {
  var config = configs.find(function (cfg) {
    return ref.match(cfg.match);
  }); // inputElement was removed from DOM for some reasons

  if (!inputElement || !config && !customFragment) {
    return;
  }

  var insertAfterNode = null;
  var insertBeforeNode = null;
  var addSpaceBefore = false;
  var addSpaceAfter = false;
  var selection = document.getSelection(); // Is selection inside inputElement ?
  // (avoid inserting fragments on other parts of the website)

  if (selection && selection.anchorNode && inputElement.contains(selection.anchorNode)) {
    var node = selection.anchorNode,
        offset = selection.anchorOffset;
    var fragment = getFragment(node); // Avoid problem with text selection
    // Just delete it before processing

    deleteSelection(selection); // If we are at the fragment end when inserting content, we have to
    // change the cursor position to be at first position on the next one.
    // If the next fragment does not exist, add a new one.
    // <span>"text"|<span>   -> <span>"text"</span>"|"

    if (fragment && offset === (node.textContent || '').length) {
      if (!fragment.nextSibling) {
        inputElement.insertBefore(document.createTextNode(''), null);
      }

      node = fragment.nextSibling;
      offset = 0;
      fragment = null;
    }

    if (fragment) {
      // Final fragment can't be edited
      // Just remove it and add the insertion just after.
      if (fragment.hasAttribute('data-integrity')) {
        var _fragment$parentEleme;

        insertBeforeNode = fragment.nextSibling;
        (_fragment$parentEleme = fragment.parentElement) == null ? void 0 : _fragment$parentEleme.removeChild(fragment);
      } else {
        var text = node.textContent || ''; // In this case, we are in the middle of a pending fragment.
        // <span>@vin|ce</span> -> <span>@vin</span>" [insertion] "ce"

        if (offset > 0 && offset < text.length) {
          var firstPart = text.substr(0, offset);
          var secondPart = text.substr(offset);
          var subFragment = document.createTextNode(secondPart);
          inputElement.insertBefore(subFragment, fragment.nextSibling);
          node.textContent = firstPart;
          addSpaceBefore = true;
          insertBeforeNode = subFragment;
        }

        addSpaceBefore = needSpaceBefore(text, offset, node, addSpaceBefore);
        addSpaceAfter = needSpaceAfter(text, offset, node);
      }
    } else {
      // Text inside the contenteditable (not nested)
      var _text = node.textContent || ''; // If we are at the first position in a fragment, we need to insert the new
      // fragment before it, not after.


      if (offset > 0) {
        insertAfterNode = node;
      } else {
        // If next block is <div><br/></div> we have to replace it to a single <div></div>
        var element = node;

        if (!_text && element.nodeName === 'DIV' && !element.attributes.length && element.childNodes.length === 1 && element.firstElementChild instanceof HTMLBRElement) {
          if (element.previousSibling instanceof HTMLDivElement) {
            insertBeforeNode = node;
            element.removeChild(element.firstElementChild);
          } else {
            insertAfterNode = node;
            element.removeChild(element.firstElementChild);
          }
        } else {
          insertBeforeNode = node;
        }
      } // In this case, we need to add the insertion at the center of a TextNode.
      // Let say we have "hello|world", as you can't add span inside TextNode, we have
      // to split it in two differents nodes : "Hello" and "world", and insert the span
      // between them.


      if (offset > 0 && offset < _text.length) {
        var _node$parentElement;

        var _firstPart = _text.substr(0, offset);

        var _secondPart = _text.substr(offset);

        _text = _firstPart;
        node.textContent = _firstPart;
        (_node$parentElement = node.parentElement) == null ? void 0 : _node$parentElement.insertBefore(document.createTextNode(_secondPart), node.nextSibling);
      }

      addSpaceBefore = needSpaceBefore(_text, offset, node, addSpaceBefore);
      addSpaceAfter = needSpaceAfter(_text, offset, node);
    }
  } else {
    // Can't find the selection, let's just insert the fragment at the
    // end of the div[contenteditable]
    var _text2 = inputElement.textContent || '';

    addSpaceAfter = true;
    addSpaceBefore = !isSpace(_text2.charAt(_text2.length - 1));
  } // Create fragment


  var span = document.createElement('span');

  if (config) {
    transformFinalFragment(span, ref, config);
  } else if (customFragment) {
    span.appendChild(customFragment);
    span.setAttribute('data-rich-mentions', ref);
    span.setAttribute('data-integrity', span.innerHTML);
    span.setAttribute('spellcheck', 'false');

    {
      span.setAttribute('data-cy', 'final');
    }
  } // Insert it at chosen position


  if (insertAfterNode && insertAfterNode !== inputElement) {
    var _insertAfterNode$pare;

    (_insertAfterNode$pare = insertAfterNode.parentElement) == null ? void 0 : _insertAfterNode$pare.insertBefore(span, insertAfterNode.nextSibling);
  } else if (insertBeforeNode && insertBeforeNode !== inputElement) {
    var _insertBeforeNode$par;

    (_insertBeforeNode$par = insertBeforeNode.parentElement) == null ? void 0 : _insertBeforeNode$par.insertBefore(span, insertBeforeNode);
  } else {
    inputElement.appendChild(span);
  } // Insert space before if needed


  if (addSpaceBefore) {
    var _span$parentElement;

    var space = document.createTextNode("\xA0");
    (_span$parentElement = span.parentElement) == null ? void 0 : _span$parentElement.insertBefore(space, span);
  } // Insert space after if needed


  if (addSpaceAfter) {
    var _span$parentElement2;

    var _space = document.createTextNode("\xA0");

    (_span$parentElement2 = span.parentElement) == null ? void 0 : _span$parentElement2.insertBefore(_space, span.nextSibling);
  } // Set cursor position (always true)


  if (span.nextSibling) {
    setCursorPosition(span.nextSibling, addSpaceAfter ? 1 : 0);
  } // If the user is selecting text and some parts of fragment, we need to be sure to delete it correctly
  // Ex where "[" and "]" are the start and ending of text selection:
  // input: "he[llo <span>@vin]ce</span>"
  // output: "he @insertedfragment <span>ce</span>"
  // In this case, the fragment "ce" need to be deleted.


  removeBrokenFragments(inputElement, configs);
}

function getTransformedValue(inputElement) {
  if (!inputElement || inputElement.innerHTML === '<br>') {
    return '';
  }

  var brCharacter = "_br_" + Date.now() + "_";
  var brMatcher = new RegExp("\\n?" + brCharacter + "\\n?", 'g');
  return Array.from(inputElement.childNodes).map(function (el) {
    return getNodeContent(el, brCharacter);
  }).join('').replace(/\u00A0/g, ' ') // Replace back insecable spaces
  .replace(/\n{2,}/g, '\n') // Following lines are considered as one in HTML
  .replace(brMatcher, '\n') // Replace <br/> to line break
  .trim();
}

function getNodeContent(element, brCharacter) {
  if (element instanceof Text) {
    return element.textContent || '';
  }

  if (element instanceof HTMLBRElement) {
    return brCharacter;
  }

  if (element instanceof Element) {
    var richValue = element.getAttribute('data-rich-mentions');

    if (richValue) {
      return richValue;
    }

    var _char = element instanceof HTMLDivElement ? '\n' : '';

    var result = Array.from(element.childNodes).map(function (el) {
      return getNodeContent(el, brCharacter);
    }).join('');
    return "" + _char + result + _char;
  }

  return '';
}

function handleFragmentEscape(event, _ref, configs) {
  var anchorNode = _ref.anchorNode;

  if (event.defaultPrevented || !anchorNode) {
    return;
  }

  var element = getFragment(anchorNode);

  if (element) {
    // @ts-ignore
    var insertion = event.data;
    var newText = element.textContent + insertion;
    var isValid = configs.some(function (cfg) {
      var matches = newText.match(cfg.query);
      return matches && matches[0] === matches.input;
    });

    if (!isValid) {
      event.preventDefault();
      escapeFragmentWithValue(element, insertion);
    }
  }
}

function handleFragmentCreation(event, selection, configs, ctx) {
  var anchorNode = selection.anchorNode,
      anchorOffset = selection.anchorOffset;

  if (event.defaultPrevented || !anchorNode || getFragment(anchorNode)) {
    return;
  } // @ts-ignore Find a property type instead of React.FormEvent<HTMLDivElement> ?


  var insertion = event.data;
  var fragmentText = anchorNode.textContent || ''; // Build new text fragment with insertion

  var text = fragmentText.substr(0, anchorOffset) + insertion + fragmentText.substr(anchorOffset); // No match

  var config = configs.find(function (cfg) {
    return text.match(cfg.query);
  });

  if (!config) {
    return;
  }

  var matches = text.match(config.query);
  var index = matches.index || 0;
  var textBeforeQuery = text.substr(0, index); // Do nothing if there is a valid character before.
  // Do nothing if the range overflow the fragment position

  if (textBeforeQuery.length && !/\W$/.test(textBeforeQuery) || anchorOffset < index || anchorOffset >= index + matches[0].length) {
    return;
  }

  anchorNode.textContent = textBeforeQuery;
  var fragment = document.createElement('span');
  var textQuery = matches[0].substr(0, anchorOffset - index + insertion.length);
  var afterInsertion = text.substr(index + textQuery.length);
  fragment.setAttribute('data-rich-mentions', '');
  fragment.setAttribute('spellcheck', 'false');

  {
    fragment.setAttribute('data-cy', 'pending');
  }

  fragment.textContent = textQuery;

  if (config.customizeFragment) {
    config.customizeFragment(fragment, false);
  }

  var after = document.createTextNode(/^\s/.test(afterInsertion) ? afterInsertion : ' ' + afterInsertion);
  var isContainer = event.currentTarget === anchorNode;
  var parent = isContainer ? anchorNode : anchorNode.parentElement;

  if (parent) {
    if (isContainer) {
      parent.appendChild(fragment);
      parent.appendChild(after);
    } else {
      parent.insertBefore(after, anchorNode.nextSibling);
      parent.insertBefore(fragment, anchorNode.nextSibling);
    }
  }

  event.preventDefault();
  setCursorPosition(fragment.childNodes[0], anchorOffset - textBeforeQuery.length + 1);
  ctx.openAutocomplete(fragment, textQuery, config);
}

var removeIfFinalFragment = function removeIfFinalFragment(node, container) {
  var element = nodeToHtmlElement(node);

  if (!container.contains(element) || container === element) {
    return;
  }

  if (element && element.hasAttribute('data-integrity')) {
    container.removeChild(element);
  }
};

function handleFragmentDeletion(event, selection) {
  if (event.defaultPrevented) {
    return;
  }

  var container = event.currentTarget;

  for (var i = 0; i < selection.rangeCount; i++) {
    var range = selection.getRangeAt(i);
    removeIfFinalFragment(range.startContainer, container);
    removeIfFinalFragment(range.endContainer, container);
  }
}

function replaceSpacesWithInsecableSpaces(text) {
  var div = document.createElement('div');
  div.innerHTML = text;

  function recursiveSpaceReplacer(element) {
    Array.from(element.childNodes).forEach(function (element) {
      if (element instanceof Text && element.nodeValue) {
        element.nodeValue = element.nodeValue.replace(/( |\t)/g, "\xA0");
      } else if (element instanceof HTMLElement) {
        recursiveSpaceReplacer(element);

        if (element.hasAttribute('data-rich-mentions') && !element.hasAttribute('data-integrity')) {
          element.setAttribute('data-integrity', element.innerHTML);
        }
      }
    });
  }

  recursiveSpaceReplacer(div);
  return div.innerHTML;
}

function getConfigsInitialValue(configs) {
  return function (text) {
    // This replace all fragment "<@vince|U515>" to html ones based on your configs
    var formattedTextWithHtml = configs.reduce(function (acc, config) {
      return acc.replace(config.match, function ($0) {
        var span = document.createElement('span');
        transformFinalFragment(span, $0, config);
        return span.outerHTML;
      });
    }, text); // We replace all text spaces with unbreakable ones to avoid problem with contenteditable.
    // Currently, contenteditable remove multiple space but we want to keep it.

    return replaceSpacesWithInsecableSpaces(formattedTextWithHtml);
  };
}

function RichMentionsProvider(_ref) {
  var children = _ref.children,
      configs = _ref.configs,
      getContext = _ref.getContext,
      onUpdate = _ref.onUpdate,
      _ref$getInitialHTML = _ref.getInitialHTML,
      getInitialHTML = _ref$getInitialHTML === void 0 ? getConfigsInitialValue(configs) : _ref$getInitialHTML;
  // The reference to always have function context working
  var ref = React.useRef(_extends({}, initialContext, {
    getInitialHTML: getInitialHTML,
    setPositionFixed: setPositionFixed,
    setInputElement: setInputElement,
    selectItem: selectItem,
    onBeforeChanges: onBeforeChanges,
    onChanges: onChanges,
    onKeyDown: onKeyDown,
    closeAutocomplete: closeAutocomplete,
    openAutocomplete: openAutocomplete,
    setActiveItemIndex: setActiveItemIndex,
    getTransformedValue: getTransformedValue$1,
    insertFragment: insertFragment$1,
    setValue: setValue
  })); // The state to controls react rendering

  var _useState = React.useState(ref.current),
      __ctx__ = _useState[0],
      setState = _useState[1];

  var updateState = function updateState(data) {
    ref.current = _extends({}, ref.current, data);
    setState(ref.current);
  }; // Listen for selection change to open/close the autocomplete modal


  React.useEffect(function () {
    document.addEventListener('selectionchange', onSelectionChange, false);
    return function () {
      document.removeEventListener('selectionchange', onSelectionChange, false);
    };
  }); // Expose reference with new context

  React.useEffect(function () {
    if (typeof getContext === 'function') {
      getContext(__ctx__);
    } else if (typeof getContext === 'object') {
      getContext.current = __ctx__;
    }
  }, [getContext, __ctx__]);
  /**
   * Listener to update autocomplete css fixed position
   * Helpful if you have an input fixed at the top/bottom of your website.
   *
   * @param {boolean} fixed Is input element position fixed ? Help to set correct autocomplete position
   * @returns {void}
   */

  function setPositionFixed(fixed) {
    updateState({
      fixed: fixed
    });
  }
  /**
   * Listener to set new inputElement.
   * Should be used only by the <InputElement /> to mount/unmount itself
   *
   * @param {HTMLDivElement | null} inputElement input element
   * @returns {void}
   */


  function setInputElement(inputElement) {
    updateState({
      inputElement: inputElement
    });
  }
  /**
   * Called by the autocomplete to select an item.
   * It will transform the current pending fragment to a final one and
   * reset the autocomplete
   *
   * @param {TMentionItem} item The item from autocomplete to select
   * @returns {void}
   */


  function selectItem(item) {
    var opened = ref.current.opened;

    if (opened != null && opened.element) {
      transformFinalFragment(opened.element, item.ref, opened.config);
    }

    updateState({
      index: 0,
      results: [],
      opened: null,
      loading: false,
      activeSearch: ''
    });
  }
  /**
   * Bounded to input.onBeforeInput event.
   * Will help to insert/delete/escape fragment before it already happens to avoid a flash
   *
   * @param {FormEvent<HTMLDivElement>} event
   * @returns {void}
   */


  function onBeforeChanges(event) {
    var selection = document.getSelection();

    if (!selection || !selection.anchorNode) {
      return;
    } // If there is text selection, delete it.
    // We need to do it manually because of the preventDefault() :'(
    // Update 'text' variable as the content could be updated


    if (deleteSelection(selection, event)) {
      selection = document.getSelection();

      if (!selection || !selection.anchorNode) {
        return;
      }
    }

    fixCursorInsertion(event, selection);
    handleFragmentDeletion(event, selection);
    handleFragmentEscape(event, selection, configs);
    handleFragmentCreation(event, selection, configs, ref.current);
    removeBrokenFragments(event.currentTarget, configs);
  }
  /**
   * Will handle document.onSelectionChange event
   * In this case, just to know if wha have focus on a fragment to open/close the autocomplete
   *
   * @returns {void}
   */


  function onSelectionChange() {
    var _ref$current = ref.current,
        inputElement = _ref$current.inputElement,
        opened = _ref$current.opened,
        closeAutocomplete = _ref$current.closeAutocomplete,
        openAutocomplete = _ref$current.openAutocomplete,
        getTransformedValue = _ref$current.getTransformedValue;
    var selection = document.getSelection();
    var fragment = (selection == null ? void 0 : selection.anchorNode) && (getFragment(selection.anchorNode) || selection.anchorOffset === 0 && selection.anchorNode.previousSibling && getFragment(selection.anchorNode.previousSibling));
    var shouldOpened = fragment && !fragment.hasAttribute('data-integrity') && inputElement && inputElement.contains(fragment);

    if (opened && !shouldOpened) {
      closeAutocomplete();
    } else if (shouldOpened && fragment && (!opened || opened.element !== fragment)) {
      var text = fragment.textContent || '';
      var config = configs.find(function (cfg) {
        return text.match(cfg.query);
      });

      if (config) {
        openAutocomplete(fragment, text, config);
      }
    }

    onUpdate && onUpdate(getTransformedValue());
  }
  /**
   * Handle input.onChange event
   * This part is just to remove broken fragment (let say you removed the "@" of a mention) and to
   * Open/Close autocomplete based on the new cursor position.
   *
   * @param {FormEvent<HTMLDivElement>} event
   * @returns {void}
   */


  function onChanges() {
    var _ref$current2 = ref.current,
        inputElement = _ref$current2.inputElement,
        openAutocomplete = _ref$current2.openAutocomplete,
        closeAutocomplete = _ref$current2.closeAutocomplete;
    var selection = document.getSelection();

    if (inputElement) {
      removeBrokenFragments(inputElement, configs);
    } // Autocomplete


    var fragment = (selection == null ? void 0 : selection.anchorNode) && getFragment(selection.anchorNode);

    if (fragment && !fragment.hasAttribute('data-integrity')) {
      var text = fragment.textContent || '';
      var config = configs.find(function (cfg) {
        return text.match(cfg.query);
      });

      if (config) {
        openAutocomplete(fragment, text, config);
      }
    } else if (ref.current.opened) {
      closeAutocomplete();
    }

    onUpdate && onUpdate(getTransformedValue$1());
  }
  /**
   * Handle input.onKeyDown event
   * Just to manage the selected item on the autocomplete if opened
   *
   * @param {KeyboardEvent<HTMLDivElement>} event
   * @returns {void}
   */


  function onKeyDown(event) {
    var _ref$current3 = ref.current,
        opened = _ref$current3.opened,
        results = _ref$current3.results,
        index = _ref$current3.index,
        selectItem = _ref$current3.selectItem,
        closeAutocomplete = _ref$current3.closeAutocomplete;

    if (!opened || !results.length) {
      return;
    }

    switch (event.keyCode) {
      case 40:
        // down
        event.preventDefault();
        updateState({
          index: Math.min(index + 1, results.length - 1)
        });
        break;

      case 38:
        // up
        event.preventDefault();
        updateState({
          index: Math.max(index - 1, 0)
        });
        break;

      case 9: // tab

      case 13:
        // enter
        if (results[index]) {
          event.preventDefault();
          selectItem(results[index]);
        }

        break;

      case 27:
        // escape
        closeAutocomplete();
        break;
    }
  }
  /**
   * Public method to close the autocomplete
   *
   * @returns {void}
   */


  function closeAutocomplete() {
    updateState({
      opened: null,
      loading: false,
      results: [],
      index: 0,
      activeSearch: ''
    });
  }
  /*
  function getCaretCoordinates() {
    let x = 0,
      y = 0;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(true);
        const rect = range.getClientRects()[0];
        if (rect) {
          x = rect.left;
          y = rect.top;
        }
      }
    }
    return { x, y };
  }
     */

  /**
   * Public method to open the autocomplete
   *
   * @param {HTMLElement} node Selected fragment where to open the autocomplete (for position)
   * @param {string} text The fragment text we are autocompleting for
   * @param {TMentionConfig} config The config object linked to the mention
   * @returns {void}
   */


  function openAutocomplete(node, text, config) {
    //const fixed = ref.current.fixed;
    //const rect = { top: 0, right: 0, bottom: 0, left: 0 };
    var nodeRect = node.getBoundingClientRect();
    var parentRect = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }; //node.getBoundingClientRect();
    //const rects = node.getClientRects();

    if (ref.current.inputElement) {
      parentRect = ref.current.inputElement.getBoundingClientRect();
    } //const caretPos = getCaretCoordinates();


    var x = nodeRect.right - parentRect.left;
    var y = nodeRect.bottom - parentRect.top;
    /*rect.top = nodeRect.top;
    rect.right = nodeRect.right;
    rect.bottom = nodeRect.bottom;
    rect.left = nodeRect.left;
         // Substract based on relative parent if not position:fixed
    if (!fixed && node.offsetParent) {
      const parentRect = node.offsetParent.getBoundingClientRect();
      rect.top -= parentRect.top;
      rect.right = rect.right - parentRect.right + parentRect.width;
      rect.left -= parentRect.left;
      rect.bottom = rect.bottom - parentRect.bottom + parentRect.height;
    }
         // TODO ELEMENT_WIDTH and ELEMENT_HEIGHT from Input Autocomplete element
    const ELEMENT_WIDTH = 200;
    const ELEMENT_HEIGHT = 300;
         // TODO calculate overflow
    const overflowX = nodeRect.left + 10 + ELEMENT_WIDTH - window.innerWidth;
    const overflowY = nodeRect.bottom + ELEMENT_HEIGHT - window.innerHeight;
         const x = 200; //overflowX > 0 ? rect.right + 15 : rect.left - 3;
    const y = 10;//overflowY > 0 ? rect.top - 3 : rect.bottom + 3;
    */

    updateState({
      loading: true,
      index: 0,
      opened: {
        config: config,
        fixed: true,
        bottom: true,
        right: true,
        element: node,
        x: x,
        y: y
      },
      activeSearch: text
    });

    var onResolve = function onResolve(results) {
      var _ref$current$opened;

      if (results === void 0) {
        results = [];
      }

      if (((_ref$current$opened = ref.current.opened) == null ? void 0 : _ref$current$opened.element) === node) {
        updateState({
          results: results,
          loading: false
        });
      }
    };

    var p = config.onMention(text, onResolve);

    if (p instanceof Promise) {
      p.then(onResolve, onResolve);
    } else if (p instanceof Array) {
      onResolve(p);
    }
  }
  /**
   * Just set the active item in the autocomplete based on the index.
   * Will work only if autocomplete is already opened
   *
   * @param {number} index The active element in autocomplete to hover
   * @returns {void}
   */


  function setActiveItemIndex(index) {
    updateState({
      index: index
    });
  }
  /**
   * Transform input html content to usable text by transforming the
   * fragments to valid text and erasing all invalid fragments.
   *
   * @returns {string}
   */


  function getTransformedValue$1() {
    return getTransformedValue(ref.current.inputElement);
  }
  /**
   * Helper to be able to insert a fragment "<@test|U211212>" inside the text
   *
   * @param {string} code The code to insert as fragment (preprocess by configs). Ex: "<@test|U211212>"
   * @param {HTMLElement?} element (optional) the html element to insert
   * @returns {void}
   */


  function insertFragment$1(code, element) {
    if (element === void 0) {
      element = null;
    }

    insertFragment(code, element, configs, ref.current.inputElement);
  }
  /**
   * Helper to be able to change the input content externaly
   *
   * @param {string} text The text to insert
   * @returns {void}
   */


  function setValue(text) {
    var _ref$current4 = ref.current,
        inputElement = _ref$current4.inputElement,
        closeAutocomplete = _ref$current4.closeAutocomplete;

    if (inputElement) {
      inputElement.innerHTML = getInitialHTML(text);
      removeBrokenFragments(inputElement, configs);
    }

    closeAutocomplete();
  }

  return React__default.createElement(RichMentionsContext.Provider, {
    value: __ctx__
  }, children);
}

function RichMentionsAutocomplete(_ref) {
  var _ref$fixed = _ref.fixed,
      fixed = _ref$fixed === void 0 ? true : _ref$fixed,
      className = _ref.className,
      itemClassName = _ref.itemClassName,
      selectedItemClassName = _ref.selectedItemClassName;

  var _useContext = React.useContext(RichMentionsContext),
      opened = _useContext.opened,
      index = _useContext.index,
      results = _useContext.results,
      setActiveItemIndex = _useContext.setActiveItemIndex,
      selectItem = _useContext.selectItem,
      setPositionFixed = _useContext.setPositionFixed;

  var onSelectItem = function onSelectItem(item) {
    return function () {
      return selectItem(item);
    };
  };

  var onHoverItem = function onHoverItem(index) {
    return function () {
      return setActiveItemIndex(index);
    };
  };

  var divAttributes =  {
    'data-cy': 'autocomplete'
  } ;
  var itemAttributes =  {
    'data-cy': 'autocomplete_item'
  } ;
  React.useEffect(function () {
    setPositionFixed(fixed);
  }, [fixed, setPositionFixed]);
  return opened && results.length ? React__default.createElement("div", Object.assign({}, divAttributes, {
    className: "" + className,
    style: {
      position: fixed ? 'fixed' : 'absolute',
      left: opened.x + 'px',
      top: opened.y + 'px'
    }
  }), React__default.createElement("div", {
    className: "autocomplete-list",
    style: {
      bottom: opened.bottom ? '0px' : 'auto',
      right: opened.right ? '0px' : 'auto'
    }
  }, results.map(function (item, i) {
    return React__default.createElement("button", Object.assign({
      className: itemClassName + " " + (i === index ? selectedItemClassName : ''),
      type: "button",
      key: item.ref,
      onClick: onSelectItem(item),
      onMouseOver: onHoverItem(index)
    }, itemAttributes), item.name);
  }))) : null;
}

exports.RichMentionsAutocomplete = RichMentionsAutocomplete;
exports.RichMentionsContext = RichMentionsContext;
exports.RichMentionsInput = RichMentionsInput;
exports.RichMentionsProvider = RichMentionsProvider;
exports.initialContext = initialContext;
//# sourceMappingURL=react-rich-mentions.cjs.development.js.map
