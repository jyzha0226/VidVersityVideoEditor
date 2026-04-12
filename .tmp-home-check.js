var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var ReactVersion = "18.3.1";
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactCurrentDispatcher = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactCurrentBatchConfig = {
          transition: null
        };
        var ReactCurrentActQueue = {
          current: null,
          // Used to reproduce behavior of `batchedUpdates` in legacy mode.
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false
        };
        var ReactCurrentOwner = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactDebugCurrentFrame = {};
        var currentExtraStackFrame = null;
        function setExtraStackFrame(stack) {
          {
            currentExtraStackFrame = stack;
          }
        }
        {
          ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
            {
              currentExtraStackFrame = stack;
            }
          };
          ReactDebugCurrentFrame.getCurrentStack = null;
          ReactDebugCurrentFrame.getStackAddendum = function() {
            var stack = "";
            if (currentExtraStackFrame) {
              stack += currentExtraStackFrame;
            }
            var impl = ReactDebugCurrentFrame.getCurrentStack;
            if (impl) {
              stack += impl() || "";
            }
            return stack;
          };
        }
        var enableScopeAPI = false;
        var enableCacheElement = false;
        var enableTransitionTracing = false;
        var enableLegacyHidden = false;
        var enableDebugTracing = false;
        var ReactSharedInternals = {
          ReactCurrentDispatcher,
          ReactCurrentBatchConfig,
          ReactCurrentOwner
        };
        {
          ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
          ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
        }
        function warn(format) {
          {
            {
              for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }
              printWarning("warn", format, args);
            }
          }
        }
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var didWarnStateUpdateForUnmountedComponent = {};
        function warnNoop(publicInstance, callerName) {
          {
            var _constructor = publicInstance.constructor;
            var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
            var warningKey = componentName + "." + callerName;
            if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
              return;
            }
            error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, componentName);
            didWarnStateUpdateForUnmountedComponent[warningKey] = true;
          }
        }
        var ReactNoopUpdateQueue = {
          /**
           * Checks whether or not this composite component is mounted.
           * @param {ReactClass} publicInstance The instance we want to test.
           * @return {boolean} True if mounted, false otherwise.
           * @protected
           * @final
           */
          isMounted: function(publicInstance) {
            return false;
          },
          /**
           * Forces an update. This should only be invoked when it is known with
           * certainty that we are **not** in a DOM transaction.
           *
           * You may want to call this when you know that some deeper aspect of the
           * component's state has changed but `setState` was not called.
           *
           * This will not invoke `shouldComponentUpdate`, but it will invoke
           * `componentWillUpdate` and `componentDidUpdate`.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueForceUpdate: function(publicInstance, callback, callerName) {
            warnNoop(publicInstance, "forceUpdate");
          },
          /**
           * Replaces all of the state. Always use this or `setState` to mutate state.
           * You should treat `this.state` as immutable.
           *
           * There is no guarantee that `this.state` will be immediately updated, so
           * accessing `this.state` after calling this method may return the old value.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} completeState Next state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
            warnNoop(publicInstance, "replaceState");
          },
          /**
           * Sets a subset of the state. This only exists because _pendingState is
           * internal. This provides a merging strategy that is not available to deep
           * properties which is confusing. TODO: Expose pendingState or don't use it
           * during the merge.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} partialState Next partial state to be merged with state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} Name of the calling function in the public API.
           * @internal
           */
          enqueueSetState: function(publicInstance, partialState, callback, callerName) {
            warnNoop(publicInstance, "setState");
          }
        };
        var assign = Object.assign;
        var emptyObject = {};
        {
          Object.freeze(emptyObject);
        }
        function Component4(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        Component4.prototype.isReactComponent = {};
        Component4.prototype.setState = function(partialState, callback) {
          if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null) {
            throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
          }
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component4.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        {
          var deprecatedAPIs = {
            isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
            replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
          };
          var defineDeprecationWarning = function(methodName, info) {
            Object.defineProperty(Component4.prototype, methodName, {
              get: function() {
                warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
                return void 0;
              }
            });
          };
          for (var fnName in deprecatedAPIs) {
            if (deprecatedAPIs.hasOwnProperty(fnName)) {
              defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
            }
          }
        }
        function ComponentDummy() {
        }
        ComponentDummy.prototype = Component4.prototype;
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
        pureComponentPrototype.constructor = PureComponent;
        assign(pureComponentPrototype, Component4.prototype);
        pureComponentPrototype.isPureReactComponent = true;
        function createRef() {
          var refObject = {
            current: null
          };
          {
            Object.seal(refObject);
          }
          return refObject;
        }
        var isArrayImpl = Array.isArray;
        function isArray(a) {
          return isArrayImpl(a);
        }
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          var warnAboutAccessingKey = function() {
            {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function defineRefPropWarningGetter(props, displayName) {
          var warnAboutAccessingRef = function() {
            {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, "ref", {
            get: warnAboutAccessingRef,
            configurable: true
          });
        }
        function warnIfStringRefCannotBeAutoConverted(config) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
              var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        var ReactElement = function(type, key, ref, self, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function createElement13(type, config, children) {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          var self = null;
          var source = null;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              {
                warnIfStringRefCannotBeAutoConverted(config);
              }
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            self = config.__self === void 0 ? null : config.__self;
            source = config.__source === void 0 ? null : config.__source;
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            {
              if (Object.freeze) {
                Object.freeze(childArray);
              }
            }
            props.children = childArray;
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === void 0) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          {
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
          }
          return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
          return newElement;
        }
        function cloneElement2(element, config, children) {
          if (element === null || element === void 0) {
            throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
          }
          var propName;
          var props = assign({}, element.props);
          var key = element.key;
          var ref = element.ref;
          var self = element._self;
          var source = element._source;
          var owner = element._owner;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              owner = ReactCurrentOwner.current;
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            var defaultProps;
            if (element.type && element.type.defaultProps) {
              defaultProps = element.type.defaultProps;
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                if (config[propName] === void 0 && defaultProps !== void 0) {
                  props[propName] = defaultProps[propName];
                } else {
                  props[propName] = config[propName];
                }
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
          }
          return ReactElement(element.type, key, ref, self, source, owner, props);
        }
        function isValidElement2(object) {
          return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        var SEPARATOR = ".";
        var SUBSEPARATOR = ":";
        function escape(key) {
          var escapeRegex = /[=:]/g;
          var escaperLookup = {
            "=": "=0",
            ":": "=2"
          };
          var escapedString = key.replace(escapeRegex, function(match) {
            return escaperLookup[match];
          });
          return "$" + escapedString;
        }
        var didWarnAboutMaps = false;
        var userProvidedKeyEscapeRegex = /\/+/g;
        function escapeUserProvidedKey(text) {
          return text.replace(userProvidedKeyEscapeRegex, "$&/");
        }
        function getElementKey(element, index) {
          if (typeof element === "object" && element !== null && element.key != null) {
            {
              checkKeyStringCoercion(element.key);
            }
            return escape("" + element.key);
          }
          return index.toString(36);
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if (type === "undefined" || type === "boolean") {
            children = null;
          }
          var invokeCallback = false;
          if (children === null) {
            invokeCallback = true;
          } else {
            switch (type) {
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                }
            }
          }
          if (invokeCallback) {
            var _child = children;
            var mappedChild = callback(_child);
            var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
            if (isArray(mappedChild)) {
              var escapedChildKey = "";
              if (childKey != null) {
                escapedChildKey = escapeUserProvidedKey(childKey) + "/";
              }
              mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                return c;
              });
            } else if (mappedChild != null) {
              if (isValidElement2(mappedChild)) {
                {
                  if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
                    checkKeyStringCoercion(mappedChild.key);
                  }
                }
                mappedChild = cloneAndReplaceKey(
                  mappedChild,
                  // Keep both the (mapped) and old keys if they differ, just as
                  // traverseAllChildren used to do for objects as children
                  escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                  (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                    // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                    // eslint-disable-next-line react-internal/safe-string-coercion
                    escapeUserProvidedKey("" + mappedChild.key) + "/"
                  ) : "") + childKey
                );
              }
              array.push(mappedChild);
            }
            return 1;
          }
          var child;
          var nextName;
          var subtreeCount = 0;
          var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              child = children[i];
              nextName = nextNamePrefix + getElementKey(child, i);
              subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
            }
          } else {
            var iteratorFn = getIteratorFn(children);
            if (typeof iteratorFn === "function") {
              var iterableChildren = children;
              {
                if (iteratorFn === iterableChildren.entries) {
                  if (!didWarnAboutMaps) {
                    warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
              var iterator = iteratorFn.call(iterableChildren);
              var step;
              var ii = 0;
              while (!(step = iterator.next()).done) {
                child = step.value;
                nextName = nextNamePrefix + getElementKey(child, ii++);
                subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
              }
            } else if (type === "object") {
              var childrenString = String(children);
              throw new Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
            }
          }
          return subtreeCount;
        }
        function mapChildren(children, func, context) {
          if (children == null) {
            return children;
          }
          var result = [];
          var count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function countChildren(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        }
        function forEachChildren(children, forEachFunc, forEachContext) {
          mapChildren(children, function() {
            forEachFunc.apply(this, arguments);
          }, forEachContext);
        }
        function toArray(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        }
        function onlyChild(children) {
          if (!isValidElement2(children)) {
            throw new Error("React.Children.only expected to receive a single React element child.");
          }
          return children;
        }
        function createContext6(defaultValue) {
          var context = {
            $$typeof: REACT_CONTEXT_TYPE,
            // As a workaround to support multiple concurrent renderers, we categorize
            // some renderers as primary and others as secondary. We only expect
            // there to be two concurrent renderers at most: React Native (primary) and
            // Fabric (secondary); React DOM (primary) and React ART (secondary).
            // Secondary renderers store their context values on separate fields.
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            // Used to track how many concurrent renderers this context currently
            // supports within in a single renderer. Such as parallel server rendering.
            _threadCount: 0,
            // These are circular
            Provider: null,
            Consumer: null,
            // Add these to use same hidden class in VM as ServerContext
            _defaultValue: null,
            _globalName: null
          };
          context.Provider = {
            $$typeof: REACT_PROVIDER_TYPE,
            _context: context
          };
          var hasWarnedAboutUsingNestedContextConsumers = false;
          var hasWarnedAboutUsingConsumerProvider = false;
          var hasWarnedAboutDisplayNameOnConsumer = false;
          {
            var Consumer = {
              $$typeof: REACT_CONTEXT_TYPE,
              _context: context
            };
            Object.defineProperties(Consumer, {
              Provider: {
                get: function() {
                  if (!hasWarnedAboutUsingConsumerProvider) {
                    hasWarnedAboutUsingConsumerProvider = true;
                    error("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                  }
                  return context.Provider;
                },
                set: function(_Provider) {
                  context.Provider = _Provider;
                }
              },
              _currentValue: {
                get: function() {
                  return context._currentValue;
                },
                set: function(_currentValue) {
                  context._currentValue = _currentValue;
                }
              },
              _currentValue2: {
                get: function() {
                  return context._currentValue2;
                },
                set: function(_currentValue2) {
                  context._currentValue2 = _currentValue2;
                }
              },
              _threadCount: {
                get: function() {
                  return context._threadCount;
                },
                set: function(_threadCount) {
                  context._threadCount = _threadCount;
                }
              },
              Consumer: {
                get: function() {
                  if (!hasWarnedAboutUsingNestedContextConsumers) {
                    hasWarnedAboutUsingNestedContextConsumers = true;
                    error("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                  }
                  return context.Consumer;
                }
              },
              displayName: {
                get: function() {
                  return context.displayName;
                },
                set: function(displayName) {
                  if (!hasWarnedAboutDisplayNameOnConsumer) {
                    warn("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                    hasWarnedAboutDisplayNameOnConsumer = true;
                  }
                }
              }
            });
            context.Consumer = Consumer;
          }
          {
            context._currentRenderer = null;
            context._currentRenderer2 = null;
          }
          return context;
        }
        var Uninitialized = -1;
        var Pending = 0;
        var Resolved = 1;
        var Rejected = 2;
        function lazyInitializer(payload) {
          if (payload._status === Uninitialized) {
            var ctor = payload._result;
            var thenable = ctor();
            thenable.then(function(moduleObject2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var resolved = payload;
                resolved._status = Resolved;
                resolved._result = moduleObject2;
              }
            }, function(error2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var rejected = payload;
                rejected._status = Rejected;
                rejected._result = error2;
              }
            });
            if (payload._status === Uninitialized) {
              var pending = payload;
              pending._status = Pending;
              pending._result = thenable;
            }
          }
          if (payload._status === Resolved) {
            var moduleObject = payload._result;
            {
              if (moduleObject === void 0) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", moduleObject);
              }
            }
            {
              if (!("default" in moduleObject)) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
              }
            }
            return moduleObject.default;
          } else {
            throw payload._result;
          }
        }
        function lazy(ctor) {
          var payload = {
            // We use these fields to store the result.
            _status: Uninitialized,
            _result: ctor
          };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: payload,
            _init: lazyInitializer
          };
          {
            var defaultProps;
            var propTypes;
            Object.defineProperties(lazyType, {
              defaultProps: {
                configurable: true,
                get: function() {
                  return defaultProps;
                },
                set: function(newDefaultProps) {
                  error("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  defaultProps = newDefaultProps;
                  Object.defineProperty(lazyType, "defaultProps", {
                    enumerable: true
                  });
                }
              },
              propTypes: {
                configurable: true,
                get: function() {
                  return propTypes;
                },
                set: function(newPropTypes) {
                  error("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  propTypes = newPropTypes;
                  Object.defineProperty(lazyType, "propTypes", {
                    enumerable: true
                  });
                }
              }
            });
          }
          return lazyType;
        }
        function forwardRef5(render) {
          {
            if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
              error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
            } else if (typeof render !== "function") {
              error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
            } else {
              if (render.length !== 0 && render.length !== 2) {
                error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
              }
            }
            if (render != null) {
              if (render.defaultProps != null || render.propTypes != null) {
                error("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
              }
            }
          }
          var elementType = {
            $$typeof: REACT_FORWARD_REF_TYPE,
            render
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!render.name && !render.displayName) {
                  render.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        var REACT_MODULE_REFERENCE;
        {
          REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
        }
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
            // types supported by any Flight configuration anywhere since
            // we don't know which Flight build this will end up being used
            // with.
            type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
              return true;
            }
          }
          return false;
        }
        function memo2(type, compare) {
          {
            if (!isValidElementType(type)) {
              error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
            }
          }
          var elementType = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: compare === void 0 ? null : compare
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!type.name && !type.displayName) {
                  type.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        function resolveDispatcher() {
          var dispatcher = ReactCurrentDispatcher.current;
          {
            if (dispatcher === null) {
              error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
            }
          }
          return dispatcher;
        }
        function useContext7(Context) {
          var dispatcher = resolveDispatcher();
          {
            if (Context._context !== void 0) {
              var realContext = Context._context;
              if (realContext.Consumer === Context) {
                error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
              } else if (realContext.Provider === Context) {
                error("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
              }
            }
          }
          return dispatcher.useContext(Context);
        }
        function useState7(initialState) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useState(initialState);
        }
        function useReducer(reducer, initialArg, init) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useReducer(reducer, initialArg, init);
        }
        function useRef6(initialValue) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useRef(initialValue);
        }
        function useEffect8(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useEffect(create, deps);
        }
        function useInsertionEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useInsertionEffect(create, deps);
        }
        function useLayoutEffect4(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useLayoutEffect(create, deps);
        }
        function useCallback4(callback, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useCallback(callback, deps);
        }
        function useMemo7(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useMemo(create, deps);
        }
        function useImperativeHandle2(ref, create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useImperativeHandle(ref, create, deps);
        }
        function useDebugValue(value, formatterFn) {
          {
            var dispatcher = resolveDispatcher();
            return dispatcher.useDebugValue(value, formatterFn);
          }
        }
        function useTransition() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useTransition();
        }
        function useDeferredValue(value) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useDeferredValue(value);
        }
        function useId2() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useId();
        }
        function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        }
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher$1.current;
            ReactCurrentDispatcher$1.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher$1.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component5) {
          var prototype = Component5.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        function setCurrentlyValidatingElement$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              setExtraStackFrame(stack);
            } else {
              setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function getDeclarationErrorAddendum() {
          if (ReactCurrentOwner.current) {
            var name = getComponentNameFromType(ReactCurrentOwner.current.type);
            if (name) {
              return "\n\nCheck the render method of `" + name + "`.";
            }
          }
          return "";
        }
        function getSourceInfoErrorAddendum(source) {
          if (source !== void 0) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, "");
            var lineNumber = source.lineNumber;
            return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
          }
          return "";
        }
        function getSourceInfoErrorAddendumForProps(elementProps) {
          if (elementProps !== null && elementProps !== void 0) {
            return getSourceInfoErrorAddendum(elementProps.__source);
          }
          return "";
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          var info = getDeclarationErrorAddendum();
          if (!info) {
            var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
            if (parentName) {
              info = "\n\nCheck the top-level render call using <" + parentName + ">.";
            }
          }
          return info;
        }
        function validateExplicitKey(element, parentType) {
          if (!element._store || element._store.validated || element.key != null) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = "";
          if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
            childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
          }
          {
            setCurrentlyValidatingElement$1(element);
            error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          if (typeof node !== "object") {
            return;
          }
          if (isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement2(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement2(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === "function") {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement2(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.$$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentNameFromType(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentNameFromType(type);
              error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement$1(fragment);
              error("Invalid attribute `ref` supplied to `React.Fragment`.");
              setCurrentlyValidatingElement$1(null);
            }
          }
        }
        function createElementWithValidation(type, props, children) {
          var validType = isValidElementType(type);
          if (!validType) {
            var info = "";
            if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
              info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendumForProps(props);
            if (sourceInfo) {
              info += sourceInfo;
            } else {
              info += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = "null";
            } else if (isArray(type)) {
              typeString = "array";
            } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
              typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
              info = " Did you accidentally export a JSX literal instead of a component?";
            } else {
              typeString = typeof type;
            }
            {
              error("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
            }
          }
          var element = createElement13.apply(this, arguments);
          if (element == null) {
            return element;
          }
          if (validType) {
            for (var i = 2; i < arguments.length; i++) {
              validateChildKeys(arguments[i], type);
            }
          }
          if (type === REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
        var didWarnAboutDeprecatedCreateFactory = false;
        function createFactoryWithValidation(type) {
          var validatedFactory = createElementWithValidation.bind(null, type);
          validatedFactory.type = type;
          {
            if (!didWarnAboutDeprecatedCreateFactory) {
              didWarnAboutDeprecatedCreateFactory = true;
              warn("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
            }
            Object.defineProperty(validatedFactory, "type", {
              enumerable: false,
              get: function() {
                warn("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                Object.defineProperty(this, "type", {
                  value: type
                });
                return type;
              }
            });
          }
          return validatedFactory;
        }
        function cloneElementWithValidation(element, props, children) {
          var newElement = cloneElement2.apply(this, arguments);
          for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], newElement.type);
          }
          validatePropTypes(newElement);
          return newElement;
        }
        function startTransition3(scope, options) {
          var prevTransition = ReactCurrentBatchConfig.transition;
          ReactCurrentBatchConfig.transition = {};
          var currentTransition = ReactCurrentBatchConfig.transition;
          {
            ReactCurrentBatchConfig.transition._updatedFibers = /* @__PURE__ */ new Set();
          }
          try {
            scope();
          } finally {
            ReactCurrentBatchConfig.transition = prevTransition;
            {
              if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                if (updatedFibersCount > 10) {
                  warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                }
                currentTransition._updatedFibers.clear();
              }
            }
          }
        }
        var didWarnAboutMessageChannel = false;
        var enqueueTaskImpl = null;
        function enqueueTask(task) {
          if (enqueueTaskImpl === null) {
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              var nodeRequire = module && module[requireString];
              enqueueTaskImpl = nodeRequire.call(module, "timers").setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                {
                  if (didWarnAboutMessageChannel === false) {
                    didWarnAboutMessageChannel = true;
                    if (typeof MessageChannel === "undefined") {
                      error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning.");
                    }
                  }
                }
                var channel = new MessageChannel();
                channel.port1.onmessage = callback;
                channel.port2.postMessage(void 0);
              };
            }
          }
          return enqueueTaskImpl(task);
        }
        var actScopeDepth = 0;
        var didWarnNoAwaitAct = false;
        function act(callback) {
          {
            var prevActScopeDepth = actScopeDepth;
            actScopeDepth++;
            if (ReactCurrentActQueue.current === null) {
              ReactCurrentActQueue.current = [];
            }
            var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
            var result;
            try {
              ReactCurrentActQueue.isBatchingLegacy = true;
              result = callback();
              if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
                var queue = ReactCurrentActQueue.current;
                if (queue !== null) {
                  ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                  flushActQueue(queue);
                }
              }
            } catch (error2) {
              popActScope(prevActScopeDepth);
              throw error2;
            } finally {
              ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
            }
            if (result !== null && typeof result === "object" && typeof result.then === "function") {
              var thenableResult = result;
              var wasAwaited = false;
              var thenable = {
                then: function(resolve, reject) {
                  wasAwaited = true;
                  thenableResult.then(function(returnValue2) {
                    popActScope(prevActScopeDepth);
                    if (actScopeDepth === 0) {
                      recursivelyFlushAsyncActWork(returnValue2, resolve, reject);
                    } else {
                      resolve(returnValue2);
                    }
                  }, function(error2) {
                    popActScope(prevActScopeDepth);
                    reject(error2);
                  });
                }
              };
              {
                if (!didWarnNoAwaitAct && typeof Promise !== "undefined") {
                  Promise.resolve().then(function() {
                  }).then(function() {
                    if (!wasAwaited) {
                      didWarnNoAwaitAct = true;
                      error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);");
                    }
                  });
                }
              }
              return thenable;
            } else {
              var returnValue = result;
              popActScope(prevActScopeDepth);
              if (actScopeDepth === 0) {
                var _queue = ReactCurrentActQueue.current;
                if (_queue !== null) {
                  flushActQueue(_queue);
                  ReactCurrentActQueue.current = null;
                }
                var _thenable = {
                  then: function(resolve, reject) {
                    if (ReactCurrentActQueue.current === null) {
                      ReactCurrentActQueue.current = [];
                      recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    } else {
                      resolve(returnValue);
                    }
                  }
                };
                return _thenable;
              } else {
                var _thenable2 = {
                  then: function(resolve, reject) {
                    resolve(returnValue);
                  }
                };
                return _thenable2;
              }
            }
          }
        }
        function popActScope(prevActScopeDepth) {
          {
            if (prevActScopeDepth !== actScopeDepth - 1) {
              error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
            }
            actScopeDepth = prevActScopeDepth;
          }
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          {
            var queue = ReactCurrentActQueue.current;
            if (queue !== null) {
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  if (queue.length === 0) {
                    ReactCurrentActQueue.current = null;
                    resolve(returnValue);
                  } else {
                    recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                  }
                });
              } catch (error2) {
                reject(error2);
              }
            } else {
              resolve(returnValue);
            }
          }
        }
        var isFlushing = false;
        function flushActQueue(queue) {
          {
            if (!isFlushing) {
              isFlushing = true;
              var i = 0;
              try {
                for (; i < queue.length; i++) {
                  var callback = queue[i];
                  do {
                    callback = callback(true);
                  } while (callback !== null);
                }
                queue.length = 0;
              } catch (error2) {
                queue = queue.slice(i + 1);
                throw error2;
              } finally {
                isFlushing = false;
              }
            }
          }
        }
        var createElement$1 = createElementWithValidation;
        var cloneElement$1 = cloneElementWithValidation;
        var createFactory = createFactoryWithValidation;
        var Children2 = {
          map: mapChildren,
          forEach: forEachChildren,
          count: countChildren,
          toArray,
          only: onlyChild
        };
        exports.Children = Children2;
        exports.Component = Component4;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.Profiler = REACT_PROFILER_TYPE;
        exports.PureComponent = PureComponent;
        exports.StrictMode = REACT_STRICT_MODE_TYPE;
        exports.Suspense = REACT_SUSPENSE_TYPE;
        exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
        exports.act = act;
        exports.cloneElement = cloneElement$1;
        exports.createContext = createContext6;
        exports.createElement = createElement$1;
        exports.createFactory = createFactory;
        exports.createRef = createRef;
        exports.forwardRef = forwardRef5;
        exports.isValidElement = isValidElement2;
        exports.lazy = lazy;
        exports.memo = memo2;
        exports.startTransition = startTransition3;
        exports.unstable_act = act;
        exports.useCallback = useCallback4;
        exports.useContext = useContext7;
        exports.useDebugValue = useDebugValue;
        exports.useDeferredValue = useDeferredValue;
        exports.useEffect = useEffect8;
        exports.useId = useId2;
        exports.useImperativeHandle = useImperativeHandle2;
        exports.useInsertionEffect = useInsertionEffect;
        exports.useLayoutEffect = useLayoutEffect4;
        exports.useMemo = useMemo7;
        exports.useReducer = useReducer;
        exports.useRef = useRef6;
        exports.useState = useState7;
        exports.useSyncExternalStore = useSyncExternalStore;
        exports.useTransition = useTransition;
        exports.version = ReactVersion;
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// src/pages/Home.tsx
var import_react4 = __toESM(require_react());

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var import_react2 = __toESM(require_react());

// node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};

// node_modules/lucide-react/dist/esm/Icon.js
var import_react = __toESM(require_react());

// node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/lucide-react/dist/esm/Icon.js
var Icon = (0, import_react.forwardRef)(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => {
    return (0, import_react.createElement)(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component4 = (0, import_react2.forwardRef)(
    ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component4.displayName = toPascalCase(iconName);
  return Component4;
};

// node_modules/lucide-react/dist/esm/icons/bell.js
var __iconNode = [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ]
];
var Bell = createLucideIcon("bell", __iconNode);

// node_modules/lucide-react/dist/esm/icons/captions.js
var __iconNode2 = [
  ["rect", { width: "18", height: "14", x: "3", y: "5", rx: "2", ry: "2", key: "12ruh7" }],
  ["path", { d: "M7 15h4M15 15h2M7 11h2M13 11h4", key: "1ueiar" }]
];
var Captions = createLucideIcon("captions", __iconNode2);

// node_modules/lucide-react/dist/esm/icons/circle-help.js
var __iconNode3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
var CircleHelp = createLucideIcon("circle-help", __iconNode3);

// node_modules/lucide-react/dist/esm/icons/clapperboard.js
var __iconNode4 = [
  [
    "path",
    { d: "M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z", key: "1tn4o7" }
  ],
  ["path", { d: "m6.2 5.3 3.1 3.9", key: "iuk76l" }],
  ["path", { d: "m12.4 3.4 3.1 4", key: "6hsd6n" }],
  ["path", { d: "M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z", key: "ltgou9" }]
];
var Clapperboard = createLucideIcon("clapperboard", __iconNode4);

// node_modules/lucide-react/dist/esm/icons/files.js
var __iconNode5 = [
  ["path", { d: "M20 7h-3a2 2 0 0 1-2-2V2", key: "x099mo" }],
  ["path", { d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z", key: "18t6ie" }],
  ["path", { d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8", key: "1nja0z" }]
];
var Files = createLucideIcon("files", __iconNode5);

// node_modules/lucide-react/dist/esm/icons/folder-archive.js
var __iconNode6 = [
  ["circle", { cx: "15", cy: "19", r: "2", key: "u2pros" }],
  [
    "path",
    {
      d: "M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1",
      key: "1jj40k"
    }
  ],
  ["path", { d: "M15 11v-1", key: "cntcp" }],
  ["path", { d: "M15 17v-2", key: "1279jj" }]
];
var FolderArchive = createLucideIcon("folder-archive", __iconNode6);

// node_modules/lucide-react/dist/esm/icons/mic.js
var __iconNode7 = [
  ["path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z", key: "131961" }],
  ["path", { d: "M19 10v2a7 7 0 0 1-14 0v-2", key: "1vc78b" }],
  ["line", { x1: "12", x2: "12", y1: "19", y2: "22", key: "x3vr5v" }]
];
var Mic = createLucideIcon("mic", __iconNode7);

// node_modules/lucide-react/dist/esm/icons/moon.js
var __iconNode8 = [
  ["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z", key: "a7tn18" }]
];
var Moon = createLucideIcon("moon", __iconNode8);

// node_modules/lucide-react/dist/esm/icons/panel-right-close.js
var __iconNode9 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M15 3v18", key: "14nvp0" }],
  ["path", { d: "m8 9 3 3-3 3", key: "12hl5m" }]
];
var PanelRightClose = createLucideIcon("panel-right-close", __iconNode9);

// node_modules/lucide-react/dist/esm/icons/panel-right-open.js
var __iconNode10 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M15 3v18", key: "14nvp0" }],
  ["path", { d: "m10 15-3-3 3-3", key: "1pgupc" }]
];
var PanelRightOpen = createLucideIcon("panel-right-open", __iconNode10);

// node_modules/lucide-react/dist/esm/icons/pause.js
var __iconNode11 = [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
];
var Pause = createLucideIcon("pause", __iconNode11);

// node_modules/lucide-react/dist/esm/icons/play.js
var __iconNode12 = [["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]];
var Play = createLucideIcon("play", __iconNode12);

// node_modules/lucide-react/dist/esm/icons/plus.js
var __iconNode13 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
var Plus = createLucideIcon("plus", __iconNode13);

// node_modules/lucide-react/dist/esm/icons/rotate-ccw.js
var __iconNode14 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
];
var RotateCcw = createLucideIcon("rotate-ccw", __iconNode14);

// node_modules/lucide-react/dist/esm/icons/save.js
var __iconNode15 = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
var Save = createLucideIcon("save", __iconNode15);

// node_modules/lucide-react/dist/esm/icons/scissors.js
var __iconNode16 = [
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M8.12 8.12 12 12", key: "1alkpv" }],
  ["path", { d: "M20 4 8.12 15.88", key: "xgtan2" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["path", { d: "M14.8 14.8 20 20", key: "ptml3r" }]
];
var Scissors = createLucideIcon("scissors", __iconNode16);

// node_modules/lucide-react/dist/esm/icons/send.js
var __iconNode17 = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
var Send = createLucideIcon("send", __iconNode17);

// node_modules/lucide-react/dist/esm/icons/skip-back.js
var __iconNode18 = [
  ["polygon", { points: "19 20 9 12 19 4 19 20", key: "o2sva" }],
  ["line", { x1: "5", x2: "5", y1: "19", y2: "5", key: "1ocqjk" }]
];
var SkipBack = createLucideIcon("skip-back", __iconNode18);

// node_modules/lucide-react/dist/esm/icons/skip-forward.js
var __iconNode19 = [
  ["polygon", { points: "5 4 15 12 5 20 5 4", key: "16p6eg" }],
  ["line", { x1: "19", x2: "19", y1: "5", y2: "19", key: "futhcm" }]
];
var SkipForward = createLucideIcon("skip-forward", __iconNode19);

// node_modules/lucide-react/dist/esm/icons/sparkles.js
var __iconNode20 = [
  [
    "path",
    {
      d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      key: "4pj2yx"
    }
  ],
  ["path", { d: "M20 3v4", key: "1olli1" }],
  ["path", { d: "M22 5h-4", key: "1gvqau" }],
  ["path", { d: "M4 17v2", key: "vumght" }],
  ["path", { d: "M5 18H3", key: "zchphs" }]
];
var Sparkles = createLucideIcon("sparkles", __iconNode20);

// node_modules/lucide-react/dist/esm/icons/split.js
var __iconNode21 = [
  ["path", { d: "M16 3h5v5", key: "1806ms" }],
  ["path", { d: "M8 3H3v5", key: "15dfkv" }],
  ["path", { d: "M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3", key: "1qrqzj" }],
  ["path", { d: "m15 9 6-6", key: "ko1vev" }]
];
var Split = createLucideIcon("split", __iconNode21);

// node_modules/lucide-react/dist/esm/icons/sun.js
var __iconNode22 = [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M12 2v2", key: "tus03m" }],
  ["path", { d: "M12 20v2", key: "1lh1kg" }],
  ["path", { d: "m4.93 4.93 1.41 1.41", key: "149t6j" }],
  ["path", { d: "m17.66 17.66 1.41 1.41", key: "ptbguv" }],
  ["path", { d: "M2 12h2", key: "1t8f8n" }],
  ["path", { d: "M20 12h2", key: "1q8mjw" }],
  ["path", { d: "m6.34 17.66-1.41 1.41", key: "1m8zz5" }],
  ["path", { d: "m19.07 4.93-1.41 1.41", key: "1shlcs" }]
];
var Sun = createLucideIcon("sun", __iconNode22);

// node_modules/lucide-react/dist/esm/icons/trash-2.js
var __iconNode23 = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
var Trash2 = createLucideIcon("trash-2", __iconNode23);

// node_modules/lucide-react/dist/esm/icons/upload.js
var __iconNode24 = [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
];
var Upload = createLucideIcon("upload", __iconNode24);

// node_modules/lucide-react/dist/esm/icons/zoom-in.js
var __iconNode25 = [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65", key: "13gj7c" }],
  ["line", { x1: "11", x2: "11", y1: "8", y2: "14", key: "1vmskp" }],
  ["line", { x1: "8", x2: "14", y1: "11", y2: "11", key: "durymu" }]
];
var ZoomIn = createLucideIcon("zoom-in", __iconNode25);

// node_modules/lucide-react/dist/esm/icons/zoom-out.js
var __iconNode26 = [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65", key: "13gj7c" }],
  ["line", { x1: "8", x2: "14", y1: "11", y2: "11", key: "durymu" }]
];
var ZoomOut = createLucideIcon("zoom-out", __iconNode26);

// node_modules/react-router/dist/development/chunk-UVKPFVEO.mjs
var React = __toESM(require_react(), 1);
var React2 = __toESM(require_react(), 1);
var React3 = __toESM(require_react(), 1);
var React4 = __toESM(require_react(), 1);
var React9 = __toESM(require_react(), 1);
var React8 = __toESM(require_react(), 1);
var React7 = __toESM(require_react(), 1);
var React6 = __toESM(require_react(), 1);
var React5 = __toESM(require_react(), 1);
var React10 = __toESM(require_react(), 1);
var React11 = __toESM(require_react(), 1);
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
function warning(cond, message) {
  if (!cond) {
    if (typeof console !== "undefined") console.warn(message);
    try {
      throw new Error(message);
    } catch (e) {
    }
  }
}
function createPath({
  pathname = "/",
  search = "",
  hash = ""
}) {
  if (search && search !== "?")
    pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#")
    pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}
function parsePath(path) {
  let parsedPath = {};
  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substring(hashIndex);
      path = path.substring(0, hashIndex);
    }
    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substring(searchIndex);
      path = path.substring(0, searchIndex);
    }
    if (path) {
      parsedPath.pathname = path;
    }
  }
  return parsedPath;
}
var _map;
_map = /* @__PURE__ */ new WeakMap();
function matchRoutes(routes, locationArg, basename = "/") {
  return matchRoutesImpl(routes, locationArg, basename, false);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
  let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
  let pathname = stripBasename(location.pathname || "/", basename);
  if (pathname == null) {
    return null;
  }
  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);
  let matches = null;
  for (let i = 0; matches == null && i < branches.length; ++i) {
    let decoded = decodePath(pathname);
    matches = matchRouteBranch(
      branches[i],
      decoded,
      allowPartial
    );
  }
  return matches;
}
function convertRouteMatchToUiMatch(match, loaderData) {
  let { route, pathname, params } = match;
  return {
    id: route.id,
    pathname,
    params,
    data: loaderData[route.id],
    loaderData: loaderData[route.id],
    handle: route.handle
  };
}
function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "", _hasParentOptionalSegments = false) {
  let flattenRoute = (route, index, hasParentOptionalSegments = _hasParentOptionalSegments, relativePath) => {
    let meta = {
      relativePath: relativePath === void 0 ? route.path || "" : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route
    };
    if (meta.relativePath.startsWith("/")) {
      if (!meta.relativePath.startsWith(parentPath) && hasParentOptionalSegments) {
        return;
      }
      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`
      );
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }
    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);
    if (route.children && route.children.length > 0) {
      invariant(
        // Our types know better, but runtime JS may not!
        // @ts-expect-error
        route.index !== true,
        `Index routes must not have child routes. Please remove all child routes from route path "${path}".`
      );
      flattenRoutes(
        route.children,
        branches,
        routesMeta,
        path,
        hasParentOptionalSegments
      );
    }
    if (route.path == null && !route.index) {
      return;
    }
    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta
    });
  };
  routes.forEach((route, index) => {
    if (route.path === "" || !route.path?.includes("?")) {
      flattenRoute(route, index);
    } else {
      for (let exploded of explodeOptionalSegments(route.path)) {
        flattenRoute(route, index, true, exploded);
      }
    }
  });
  return branches;
}
function explodeOptionalSegments(path) {
  let segments = path.split("/");
  if (segments.length === 0) return [];
  let [first, ...rest] = segments;
  let isOptional = first.endsWith("?");
  let required = first.replace(/\?$/, "");
  if (rest.length === 0) {
    return isOptional ? [required, ""] : [required];
  }
  let restExploded = explodeOptionalSegments(rest.join("/"));
  let result = [];
  result.push(
    ...restExploded.map(
      (subpath) => subpath === "" ? required : [required, subpath].join("/")
    )
  );
  if (isOptional) {
    result.push(...restExploded);
  }
  return result.map(
    (exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded
  );
}
function rankRouteBranches(branches) {
  branches.sort(
    (a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(
      a.routesMeta.map((meta) => meta.childrenIndex),
      b.routesMeta.map((meta) => meta.childrenIndex)
    )
  );
}
var paramRe = /^:[\w-]+$/;
var dynamicSegmentValue = 3;
var indexRouteValue = 2;
var emptySegmentValue = 1;
var staticSegmentValue = 10;
var splatPenalty = -2;
var isSplat = (s) => s === "*";
function computeScore(path, index) {
  let segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }
  if (index) {
    initialScore += indexRouteValue;
  }
  return segments.filter((s) => !isSplat(s)).reduce(
    (score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue),
    initialScore
  );
}
function compareIndexes(a, b) {
  let siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
  return siblings ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    a[a.length - 1] - b[b.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function matchRouteBranch(branch, pathname, allowPartial = false) {
  let { routesMeta } = branch;
  let matchedParams = {};
  let matchedPathname = "/";
  let matches = [];
  for (let i = 0; i < routesMeta.length; ++i) {
    let meta = routesMeta[i];
    let end = i === routesMeta.length - 1;
    let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
    let match = matchPath(
      { path: meta.relativePath, caseSensitive: meta.caseSensitive, end },
      remainingPathname
    );
    let route = meta.route;
    if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) {
      match = matchPath(
        {
          path: meta.relativePath,
          caseSensitive: meta.caseSensitive,
          end: false
        },
        remainingPathname
      );
    }
    if (!match) {
      return null;
    }
    Object.assign(matchedParams, match.params);
    matches.push({
      // TODO: Can this as be avoided?
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: normalizePathname(
        joinPaths([matchedPathname, match.pathnameBase])
      ),
      route
    });
    if (match.pathnameBase !== "/") {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }
  return matches;
}
function matchPath(pattern, pathname) {
  if (typeof pattern === "string") {
    pattern = { path: pattern, caseSensitive: false, end: true };
  }
  let [matcher, compiledParams] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end
  );
  let match = pathname.match(matcher);
  if (!match) return null;
  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params = compiledParams.reduce(
    (memo2, { paramName, isOptional }, index) => {
      if (paramName === "*") {
        let splatValue = captureGroups[index] || "";
        pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
      }
      const value = captureGroups[index];
      if (isOptional && !value) {
        memo2[paramName] = void 0;
      } else {
        memo2[paramName] = (value || "").replace(/%2F/g, "/");
      }
      return memo2;
    },
    {}
  );
  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}
function compilePath(path, caseSensitive = false, end = true) {
  warning(
    path === "*" || !path.endsWith("*") || path.endsWith("/*"),
    `Route path "${path}" will be treated as if it were "${path.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${path.replace(/\*$/, "/*")}".`
  );
  let params = [];
  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(
    /\/:([\w-]+)(\?)?/g,
    (match, paramName, isOptional, index, str) => {
      params.push({ paramName, isOptional: isOptional != null });
      if (isOptional) {
        let nextChar = str.charAt(index + match.length);
        if (nextChar && nextChar !== "/") {
          return "/([^\\/]*)";
        }
        return "(?:/([^\\/]*))?";
      }
      return "/([^\\/]+)";
    }
  ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
  if (path.endsWith("*")) {
    params.push({ paramName: "*" });
    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
  } else if (end) {
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    regexpSource += "(?:(?=\\/|$))";
  } else {
  }
  let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
  return [matcher, params];
}
function decodePath(value) {
  try {
    return value.split("/").map((v) => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
  } catch (error) {
    warning(
      false,
      `The URL path "${value}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${error}).`
    );
    return value;
  }
}
function stripBasename(pathname, basename) {
  if (basename === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }
  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
  let nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return null;
  }
  return pathname.slice(startIndex) || "/";
}
var ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function resolvePath(to, fromPathname = "/") {
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;
  let pathname;
  if (toPathname) {
    toPathname = toPathname.replace(/\/\/+/g, "/");
    if (toPathname.startsWith("/")) {
      pathname = resolvePathname(toPathname.substring(1), "/");
    } else {
      pathname = resolvePathname(toPathname, fromPathname);
    }
  } else {
    pathname = fromPathname;
  }
  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}
function resolvePathname(relativePath, fromPathname) {
  let segments = fromPathname.replace(/\/+$/, "").split("/");
  let relativeSegments = relativePath.split("/");
  relativeSegments.forEach((segment) => {
    if (segment === "..") {
      if (segments.length > 1) segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });
  return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
  return `Cannot include a '${char}' character in a manually specified \`to.${field}\` field [${JSON.stringify(
    path
  )}].  Please separate it out to the \`to.${dest}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function getPathContributingMatches(matches) {
  return matches.filter(
    (match, index) => index === 0 || match.route.path && match.route.path.length > 0
  );
}
function getResolveToMatches(matches) {
  let pathMatches = getPathContributingMatches(matches);
  return pathMatches.map(
    (match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase
  );
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative = false) {
  let to;
  if (typeof toArg === "string") {
    to = parsePath(toArg);
  } else {
    to = { ...toArg };
    invariant(
      !to.pathname || !to.pathname.includes("?"),
      getInvalidPathError("?", "pathname", "search", to)
    );
    invariant(
      !to.pathname || !to.pathname.includes("#"),
      getInvalidPathError("#", "pathname", "hash", to)
    );
    invariant(
      !to.search || !to.search.includes("#"),
      getInvalidPathError("#", "search", "hash", to)
    );
  }
  let isEmptyPath = toArg === "" || to.pathname === "";
  let toPathname = isEmptyPath ? "/" : to.pathname;
  let from;
  if (toPathname == null) {
    from = locationPathname;
  } else {
    let routePathnameIndex = routePathnames.length - 1;
    if (!isPathRelative && toPathname.startsWith("..")) {
      let toSegments = toPathname.split("/");
      while (toSegments[0] === "..") {
        toSegments.shift();
        routePathnameIndex -= 1;
      }
      to.pathname = toSegments.join("/");
    }
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
  }
  let path = resolvePath(to, from);
  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
    path.pathname += "/";
  }
  return path;
}
var joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
var normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
var normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
var normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
var ErrorResponseImpl = class {
  constructor(status, statusText, data2, internal = false) {
    this.status = status;
    this.statusText = statusText || "";
    this.internal = internal;
    if (data2 instanceof Error) {
      this.data = data2.toString();
      this.error = data2;
    } else {
      this.data = data2;
    }
  }
};
function isRouteErrorResponse(error) {
  return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
function getRoutePattern(matches) {
  return matches.map((m) => m.route.path).filter(Boolean).join("/").replace(/\/\/*/g, "/") || "/";
}
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
function parseToInfo(_to, basename) {
  let to = _to;
  if (typeof to !== "string" || !ABSOLUTE_URL_REGEX.test(to)) {
    return {
      absoluteURL: void 0,
      isExternal: false,
      to
    };
  }
  let absoluteURL = to;
  let isExternal = false;
  if (isBrowser) {
    try {
      let currentUrl = new URL(window.location.href);
      let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
      let path = stripBasename(targetUrl.pathname, basename);
      if (targetUrl.origin === currentUrl.origin && path != null) {
        to = path + targetUrl.search + targetUrl.hash;
      } else {
        isExternal = true;
      }
    } catch (e) {
      warning(
        false,
        `<Link to="${to}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`
      );
    }
  }
  return {
    absoluteURL,
    isExternal,
    to
  };
}
var UninstrumentedSymbol = Symbol("Uninstrumented");
var objectProtoNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var validMutationMethodsArr = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE"
];
var validMutationMethods = new Set(
  validMutationMethodsArr
);
var validRequestMethodsArr = [
  "GET",
  ...validMutationMethodsArr
];
var validRequestMethods = new Set(validRequestMethodsArr);
var ResetLoaderDataSymbol = Symbol("ResetLoaderData");
var DataRouterContext = React.createContext(null);
DataRouterContext.displayName = "DataRouter";
var DataRouterStateContext = React.createContext(null);
DataRouterStateContext.displayName = "DataRouterState";
var RSCRouterContext = React.createContext(false);
var ViewTransitionContext = React.createContext({
  isTransitioning: false
});
ViewTransitionContext.displayName = "ViewTransition";
var FetchersContext = React.createContext(
  /* @__PURE__ */ new Map()
);
FetchersContext.displayName = "Fetchers";
var AwaitContext = React.createContext(null);
AwaitContext.displayName = "Await";
var NavigationContext = React.createContext(
  null
);
NavigationContext.displayName = "Navigation";
var LocationContext = React.createContext(
  null
);
LocationContext.displayName = "Location";
var RouteContext = React.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false
});
RouteContext.displayName = "Route";
var RouteErrorContext = React.createContext(null);
RouteErrorContext.displayName = "RouteError";
var ENABLE_DEV_WARNINGS = true;
var ERROR_DIGEST_BASE = "REACT_ROUTER_ERROR";
var ERROR_DIGEST_REDIRECT = "REDIRECT";
var ERROR_DIGEST_ROUTE_ERROR_RESPONSE = "ROUTE_ERROR_RESPONSE";
function decodeRedirectErrorDigest(digest) {
  if (digest.startsWith(`${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:{`)) {
    try {
      let parsed = JSON.parse(digest.slice(28));
      if (typeof parsed === "object" && parsed && typeof parsed.status === "number" && typeof parsed.statusText === "string" && typeof parsed.location === "string" && typeof parsed.reloadDocument === "boolean" && typeof parsed.replace === "boolean") {
        return parsed;
      }
    } catch {
    }
  }
}
function decodeRouteErrorResponseDigest(digest) {
  if (digest.startsWith(
    `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_ROUTE_ERROR_RESPONSE}:{`
  )) {
    try {
      let parsed = JSON.parse(digest.slice(40));
      if (typeof parsed === "object" && parsed && typeof parsed.status === "number" && typeof parsed.statusText === "string") {
        return new ErrorResponseImpl(
          parsed.status,
          parsed.statusText,
          parsed.data
        );
      }
    } catch {
    }
  }
}
function useHref(to, { relative } = {}) {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`
  );
  let { basename, navigator } = React2.useContext(NavigationContext);
  let { hash, pathname, search } = useResolvedPath(to, { relative });
  let joinedPathname = pathname;
  if (basename !== "/") {
    joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
  }
  return navigator.createHref({ pathname: joinedPathname, search, hash });
}
function useInRouterContext() {
  return React2.useContext(LocationContext) != null;
}
function useLocation() {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useLocation() may be used only in the context of a <Router> component.`
  );
  return React2.useContext(LocationContext).location;
}
var navigateEffectWarning = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
function useIsomorphicLayoutEffect(cb) {
  let isStatic = React2.useContext(NavigationContext).static;
  if (!isStatic) {
    React2.useLayoutEffect(cb);
  }
}
function useNavigate() {
  let { isDataRoute } = React2.useContext(RouteContext);
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useNavigate() may be used only in the context of a <Router> component.`
  );
  let dataRouterContext = React2.useContext(DataRouterContext);
  let { basename, navigator } = React2.useContext(NavigationContext);
  let { matches } = React2.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
  let activeRef = React2.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = React2.useCallback(
    (to, options = {}) => {
      warning(activeRef.current, navigateEffectWarning);
      if (!activeRef.current) return;
      if (typeof to === "number") {
        navigator.go(to);
        return;
      }
      let path = resolveTo(
        to,
        JSON.parse(routePathnamesJson),
        locationPathname,
        options.relative === "path"
      );
      if (dataRouterContext == null && basename !== "/") {
        path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
      }
      (!!options.replace ? navigator.replace : navigator.push)(
        path,
        options.state,
        options
      );
    },
    [
      basename,
      navigator,
      routePathnamesJson,
      locationPathname,
      dataRouterContext
    ]
  );
  return navigate;
}
var OutletContext = React2.createContext(null);
function useResolvedPath(to, { relative } = {}) {
  let { matches } = React2.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
  return React2.useMemo(
    () => resolveTo(
      to,
      JSON.parse(routePathnamesJson),
      locationPathname,
      relative === "path"
    ),
    [to, routePathnamesJson, locationPathname, relative]
  );
}
function useRoutesImpl(routes, locationArg, dataRouterOpts) {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );
  let { navigator } = React2.useContext(NavigationContext);
  let { matches: parentMatches } = React2.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  let parentPathname = routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  let parentRoute = routeMatch && routeMatch.route;
  if (ENABLE_DEV_WARNINGS) {
    let parentPath = parentRoute && parentRoute.path || "";
    warningOnce(
      parentPathname,
      !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${parentPathname}" (under <Route path="${parentPath}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${parentPath}"> to <Route path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`
    );
  }
  let locationFromContext = useLocation();
  let location;
  if (locationArg) {
    let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    invariant(
      parentPathnameBase === "/" || parsedLocationArg.pathname?.startsWith(parentPathnameBase),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${parentPathnameBase}" but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`
    );
    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }
  let pathname = location.pathname || "/";
  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }
  let matches = matchRoutes(routes, { pathname: remainingPathname });
  if (ENABLE_DEV_WARNINGS) {
    warning(
      parentRoute || matches != null,
      `No routes matched location "${location.pathname}${location.search}${location.hash}" `
    );
    warning(
      matches == null || matches[matches.length - 1].route.element !== void 0 || matches[matches.length - 1].route.Component !== void 0 || matches[matches.length - 1].route.lazy !== void 0,
      `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
    );
  }
  let renderedMatches = _renderMatches(
    matches && matches.map(
      (match) => Object.assign({}, match, {
        params: Object.assign({}, parentParams, match.params),
        pathname: joinPaths([
          parentPathnameBase,
          // Re-encode pathnames that were decoded inside matchRoutes.
          // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
          // `new URL()` internally and we need to prevent it from treating
          // them as separators
          navigator.encodeLocation ? navigator.encodeLocation(
            match.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
          ).pathname : match.pathname
        ]),
        pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([
          parentPathnameBase,
          // Re-encode pathnames that were decoded inside matchRoutes
          // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
          // `new URL()` internally and we need to prevent it from treating
          // them as separators
          navigator.encodeLocation ? navigator.encodeLocation(
            match.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
          ).pathname : match.pathnameBase
        ])
      })
    ),
    parentMatches,
    dataRouterOpts
  );
  if (locationArg && renderedMatches) {
    return /* @__PURE__ */ React2.createElement(
      LocationContext.Provider,
      {
        value: {
          location: {
            pathname: "/",
            search: "",
            hash: "",
            state: null,
            key: "default",
            unstable_mask: void 0,
            ...location
          },
          navigationType: "POP"
          /* Pop */
        }
      },
      renderedMatches
    );
  }
  return renderedMatches;
}
function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
  let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };
  let devInfo = null;
  if (ENABLE_DEV_WARNINGS) {
    console.error(
      "Error handled by React Router default ErrorBoundary:",
      error
    );
    devInfo = /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("p", null, "\u{1F4BF} Hey developer \u{1F44B}"), /* @__PURE__ */ React2.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ React2.createElement("code", { style: codeStyles }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ React2.createElement("code", { style: codeStyles }, "errorElement"), " prop on your route."));
  }
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ React2.createElement("h3", { style: { fontStyle: "italic" } }, message), stack ? /* @__PURE__ */ React2.createElement("pre", { style: preStyles }, stack) : null, devInfo);
}
var defaultErrorElement = /* @__PURE__ */ React2.createElement(DefaultErrorComponent, null);
var RenderErrorBoundary = class extends React2.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error
    };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation
      };
    }
    return {
      error: props.error !== void 0 ? props.error : state.error,
      location: state.location,
      revalidation: props.revalidation || state.revalidation
    };
  }
  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error(
        "React Router caught the following error during render",
        error
      );
    }
  }
  render() {
    let error = this.state.error;
    if (this.context && typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
      const decoded = decodeRouteErrorResponseDigest(error.digest);
      if (decoded) error = decoded;
    }
    let result = error !== void 0 ? /* @__PURE__ */ React2.createElement(RouteContext.Provider, { value: this.props.routeContext }, /* @__PURE__ */ React2.createElement(
      RouteErrorContext.Provider,
      {
        value: error,
        children: this.props.component
      }
    )) : this.props.children;
    if (this.context) {
      return /* @__PURE__ */ React2.createElement(RSCErrorHandler, { error }, result);
    }
    return result;
  }
};
RenderErrorBoundary.contextType = RSCRouterContext;
var errorRedirectHandledMap = /* @__PURE__ */ new WeakMap();
function RSCErrorHandler({
  children,
  error
}) {
  let { basename } = React2.useContext(NavigationContext);
  if (typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
    let redirect2 = decodeRedirectErrorDigest(error.digest);
    if (redirect2) {
      let existingRedirect = errorRedirectHandledMap.get(error);
      if (existingRedirect) throw existingRedirect;
      let parsed = parseToInfo(redirect2.location, basename);
      if (isBrowser && !errorRedirectHandledMap.get(error)) {
        if (parsed.isExternal || redirect2.reloadDocument) {
          window.location.href = parsed.absoluteURL || parsed.to;
        } else {
          const redirectPromise = Promise.resolve().then(
            () => window.__reactRouterDataRouter.navigate(parsed.to, {
              replace: redirect2.replace
            })
          );
          errorRedirectHandledMap.set(error, redirectPromise);
          throw redirectPromise;
        }
      }
      return /* @__PURE__ */ React2.createElement(
        "meta",
        {
          httpEquiv: "refresh",
          content: `0;url=${parsed.absoluteURL || parsed.to}`
        }
      );
    }
  }
  return children;
}
function RenderedRoute({ routeContext, match, children }) {
  let dataRouterContext = React2.useContext(DataRouterContext);
  if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }
  return /* @__PURE__ */ React2.createElement(RouteContext.Provider, { value: routeContext }, children);
}
function _renderMatches(matches, parentMatches = [], dataRouterOpts) {
  let dataRouterState = dataRouterOpts?.state;
  if (matches == null) {
    if (!dataRouterState) {
      return null;
    }
    if (dataRouterState.errors) {
      matches = dataRouterState.matches;
    } else if (parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
      matches = dataRouterState.matches;
    } else {
      return null;
    }
  }
  let renderedMatches = matches;
  let errors = dataRouterState?.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex(
      (m) => m.route.id && errors?.[m.route.id] !== void 0
    );
    invariant(
      errorIndex >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(
        errors
      ).join(",")}`
    );
    renderedMatches = renderedMatches.slice(
      0,
      Math.min(renderedMatches.length, errorIndex + 1)
    );
  }
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterOpts && dataRouterState) {
    renderFallback = dataRouterState.renderFallback;
    for (let i = 0; i < renderedMatches.length; i++) {
      let match = renderedMatches[i];
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i;
      }
      if (match.route.id) {
        let { loaderData, errors: errors2 } = dataRouterState;
        let needsToRunLoader = match.route.loader && !loaderData.hasOwnProperty(match.route.id) && (!errors2 || errors2[match.route.id] === void 0);
        if (match.route.lazy || needsToRunLoader) {
          if (dataRouterOpts.isStatic) {
            renderFallback = true;
          }
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }
  let onErrorHandler = dataRouterOpts?.onError;
  let onError = dataRouterState && onErrorHandler ? (error, errorInfo) => {
    onErrorHandler(error, {
      location: dataRouterState.location,
      params: dataRouterState.matches?.[0]?.params ?? {},
      unstable_pattern: getRoutePattern(dataRouterState.matches),
      errorInfo
    });
  } : void 0;
  return renderedMatches.reduceRight(
    (outlet, match, index) => {
      let error;
      let shouldRenderHydrateFallback = false;
      let errorElement = null;
      let hydrateFallbackElement = null;
      if (dataRouterState) {
        error = errors && match.route.id ? errors[match.route.id] : void 0;
        errorElement = match.route.errorElement || defaultErrorElement;
        if (renderFallback) {
          if (fallbackIndex < 0 && index === 0) {
            warningOnce(
              "route-fallback",
              false,
              "No `HydrateFallback` element provided to render during initial hydration"
            );
            shouldRenderHydrateFallback = true;
            hydrateFallbackElement = null;
          } else if (fallbackIndex === index) {
            shouldRenderHydrateFallback = true;
            hydrateFallbackElement = match.route.hydrateFallbackElement || null;
          }
        }
      }
      let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
      let getChildren = () => {
        let children;
        if (error) {
          children = errorElement;
        } else if (shouldRenderHydrateFallback) {
          children = hydrateFallbackElement;
        } else if (match.route.Component) {
          children = /* @__PURE__ */ React2.createElement(match.route.Component, null);
        } else if (match.route.element) {
          children = match.route.element;
        } else {
          children = outlet;
        }
        return /* @__PURE__ */ React2.createElement(
          RenderedRoute,
          {
            match,
            routeContext: {
              outlet,
              matches: matches2,
              isDataRoute: dataRouterState != null
            },
            children
          }
        );
      };
      return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ React2.createElement(
        RenderErrorBoundary,
        {
          location: dataRouterState.location,
          revalidation: dataRouterState.revalidation,
          component: errorElement,
          error,
          children: getChildren(),
          routeContext: { outlet: null, matches: matches2, isDataRoute: true },
          onError
        }
      ) : getChildren();
    },
    null
  );
}
function getDataRouterConsoleError(hookName) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useDataRouterContext(hookName) {
  let ctx = React2.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError(hookName));
  return ctx;
}
function useDataRouterState(hookName) {
  let state = React2.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError(hookName));
  return state;
}
function useRouteContext(hookName) {
  let route = React2.useContext(RouteContext);
  invariant(route, getDataRouterConsoleError(hookName));
  return route;
}
function useCurrentRouteId(hookName) {
  let route = useRouteContext(hookName);
  let thisRoute = route.matches[route.matches.length - 1];
  invariant(
    thisRoute.route.id,
    `${hookName} can only be used on routes that contain a unique "id"`
  );
  return thisRoute.route.id;
}
function useRouteId() {
  return useCurrentRouteId(
    "useRouteId"
    /* UseRouteId */
  );
}
function useNavigation() {
  let state = useDataRouterState(
    "useNavigation"
    /* UseNavigation */
  );
  return state.navigation;
}
function useMatches() {
  let { matches, loaderData } = useDataRouterState(
    "useMatches"
    /* UseMatches */
  );
  return React2.useMemo(
    () => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)),
    [matches, loaderData]
  );
}
function useRouteError() {
  let error = React2.useContext(RouteErrorContext);
  let state = useDataRouterState(
    "useRouteError"
    /* UseRouteError */
  );
  let routeId = useCurrentRouteId(
    "useRouteError"
    /* UseRouteError */
  );
  if (error !== void 0) {
    return error;
  }
  return state.errors?.[routeId];
}
function useNavigateStable() {
  let { router } = useDataRouterContext(
    "useNavigate"
    /* UseNavigateStable */
  );
  let id = useCurrentRouteId(
    "useNavigate"
    /* UseNavigateStable */
  );
  let activeRef = React2.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = React2.useCallback(
    async (to, options = {}) => {
      warning(activeRef.current, navigateEffectWarning);
      if (!activeRef.current) return;
      if (typeof to === "number") {
        await router.navigate(to);
      } else {
        await router.navigate(to, { fromRouteId: id, ...options });
      }
    },
    [router, id]
  );
  return navigate;
}
var alreadyWarned = {};
function warningOnce(key, cond, message) {
  if (!cond && !alreadyWarned[key]) {
    alreadyWarned[key] = true;
    warning(false, message);
  }
}
var USE_OPTIMISTIC = "useOptimistic";
var useOptimisticImpl = React3[USE_OPTIMISTIC];
var MemoizedDataRoutes = React3.memo(DataRoutes);
function DataRoutes({
  routes,
  future,
  state,
  isStatic,
  onError
}) {
  return useRoutesImpl(routes, void 0, { state, isStatic, onError, future });
}
function Router({
  basename: basenameProp = "/",
  children = null,
  location: locationProp,
  navigationType = "POP",
  navigator,
  static: staticProp = false,
  unstable_useTransitions
}) {
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`
  );
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = React3.useMemo(
    () => ({
      basename,
      navigator,
      static: staticProp,
      unstable_useTransitions,
      future: {}
    }),
    [basename, navigator, staticProp, unstable_useTransitions]
  );
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }
  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default",
    unstable_mask
  } = locationProp;
  let locationContext = React3.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);
    if (trailingPathname == null) {
      return null;
    }
    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key,
        unstable_mask
      },
      navigationType
    };
  }, [
    basename,
    pathname,
    search,
    hash,
    state,
    key,
    navigationType,
    unstable_mask
  ]);
  warning(
    locationContext != null,
    `<Router basename="${basename}"> is not able to match the URL "${pathname}${search}${hash}" because it does not start with the basename, so the <Router> won't render anything.`
  );
  if (locationContext == null) {
    return null;
  }
  return /* @__PURE__ */ React3.createElement(NavigationContext.Provider, { value: navigationContext }, /* @__PURE__ */ React3.createElement(LocationContext.Provider, { children, value: locationContext }));
}
var defaultMethod = "get";
var defaultEncType = "application/x-www-form-urlencoded";
function isHtmlElement(object) {
  return typeof HTMLElement !== "undefined" && object instanceof HTMLElement;
}
function isButtonElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}
function isFormElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}
function isInputElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
  return event.button === 0 && // Ignore everything but left clicks
  (!target || target === "_self") && // Let browser handle "target=_blank" etc.
  !isModifiedEvent(event);
}
var _formDataSupportsSubmitter = null;
function isFormDataSubmitterSupported() {
  if (_formDataSupportsSubmitter === null) {
    try {
      new FormData(
        document.createElement("form"),
        // @ts-expect-error if FormData supports the submitter parameter, this will throw
        0
      );
      _formDataSupportsSubmitter = false;
    } catch (e) {
      _formDataSupportsSubmitter = true;
    }
  }
  return _formDataSupportsSubmitter;
}
var supportedFormEncTypes = /* @__PURE__ */ new Set([
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
]);
function getFormEncType(encType) {
  if (encType != null && !supportedFormEncTypes.has(encType)) {
    warning(
      false,
      `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${defaultEncType}"`
    );
    return null;
  }
  return encType;
}
function getFormSubmissionInfo(target, basename) {
  let method;
  let action;
  let encType;
  let formData;
  let body;
  if (isFormElement(target)) {
    let attr = target.getAttribute("action");
    action = attr ? stripBasename(attr, basename) : null;
    method = target.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(target);
  } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
    let form = target.form;
    if (form == null) {
      throw new Error(
        `Cannot submit a <button> or <input type="submit"> without a <form>`
      );
    }
    let attr = target.getAttribute("formaction") || form.getAttribute("action");
    action = attr ? stripBasename(attr, basename) : null;
    method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(form, target);
    if (!isFormDataSubmitterSupported()) {
      let { name, type, value } = target;
      if (type === "image") {
        let prefix = name ? `${name}.` : "";
        formData.append(`${prefix}x`, "0");
        formData.append(`${prefix}y`, "0");
      } else if (name) {
        formData.append(name, value);
      }
    }
  } else if (isHtmlElement(target)) {
    throw new Error(
      `Cannot submit element that is not <form>, <button>, or <input type="submit|image">`
    );
  } else {
    method = defaultMethod;
    action = null;
    encType = defaultEncType;
    body = target;
  }
  if (formData && encType === "text/plain") {
    body = formData;
    formData = void 0;
  }
  return { action, method: method.toLowerCase(), encType, formData, body };
}
var objectProtoNames2 = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var ESCAPE_LOOKUP = {
  "&": "\\u0026",
  ">": "\\u003e",
  "<": "\\u003c",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var ESCAPE_REGEX = /[&><\u2028\u2029]/g;
function escapeHtml(html) {
  return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}
function invariant2(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
var SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");
function singleFetchUrl(reqUrl, basename, trailingSlashAware, extension) {
  let url = typeof reqUrl === "string" ? new URL(
    reqUrl,
    // This can be called during the SSR flow via PrefetchPageLinksImpl so
    // don't assume window is available
    typeof window === "undefined" ? "server://singlefetch/" : window.location.origin
  ) : reqUrl;
  if (trailingSlashAware) {
    if (url.pathname.endsWith("/")) {
      url.pathname = `${url.pathname}_.${extension}`;
    } else {
      url.pathname = `${url.pathname}.${extension}`;
    }
  } else {
    if (url.pathname === "/") {
      url.pathname = `_root.${extension}`;
    } else if (basename && stripBasename(url.pathname, basename) === "/") {
      url.pathname = `${basename.replace(/\/$/, "")}/_root.${extension}`;
    } else {
      url.pathname = `${url.pathname.replace(/\/$/, "")}.${extension}`;
    }
  }
  return url;
}
async function loadRouteModule(route, routeModulesCache) {
  if (route.id in routeModulesCache) {
    return routeModulesCache[route.id];
  }
  try {
    let routeModule = await import(
      /* @vite-ignore */
      /* webpackIgnore: true */
      route.module
    );
    routeModulesCache[route.id] = routeModule;
    return routeModule;
  } catch (error) {
    console.error(
      `Error loading route module \`${route.module}\`, reloading page...`
    );
    console.error(error);
    if (window.__reactRouterContext && window.__reactRouterContext.isSpaMode && // @ts-expect-error
    import.meta.hot) {
      throw error;
    }
    window.location.reload();
    return new Promise(() => {
    });
  }
}
function isPageLinkDescriptor(object) {
  return object != null && typeof object.page === "string";
}
function isHtmlLinkDescriptor(object) {
  if (object == null) {
    return false;
  }
  if (object.href == null) {
    return object.rel === "preload" && typeof object.imageSrcSet === "string" && typeof object.imageSizes === "string";
  }
  return typeof object.rel === "string" && typeof object.href === "string";
}
async function getKeyedPrefetchLinks(matches, manifest, routeModules) {
  let links = await Promise.all(
    matches.map(async (match) => {
      let route = manifest.routes[match.route.id];
      if (route) {
        let mod = await loadRouteModule(route, routeModules);
        return mod.links ? mod.links() : [];
      }
      return [];
    })
  );
  return dedupeLinkDescriptors(
    links.flat(1).filter(isHtmlLinkDescriptor).filter((link) => link.rel === "stylesheet" || link.rel === "preload").map(
      (link) => link.rel === "stylesheet" ? { ...link, rel: "prefetch", as: "style" } : { ...link, rel: "prefetch" }
    )
  );
}
function getNewMatchesForLinks(page, nextMatches, currentMatches, manifest, location, mode) {
  let isNew = (match, index) => {
    if (!currentMatches[index]) return true;
    return match.route.id !== currentMatches[index].route.id;
  };
  let matchPathChanged = (match, index) => {
    return (
      // param change, /users/123 -> /users/456
      currentMatches[index].pathname !== match.pathname || // splat param changed, which is not present in match.path
      // e.g. /files/images/avatar.jpg -> files/finances.xls
      currentMatches[index].route.path?.endsWith("*") && currentMatches[index].params["*"] !== match.params["*"]
    );
  };
  if (mode === "assets") {
    return nextMatches.filter(
      (match, index) => isNew(match, index) || matchPathChanged(match, index)
    );
  }
  if (mode === "data") {
    return nextMatches.filter((match, index) => {
      let manifestRoute = manifest.routes[match.route.id];
      if (!manifestRoute || !manifestRoute.hasLoader) {
        return false;
      }
      if (isNew(match, index) || matchPathChanged(match, index)) {
        return true;
      }
      if (match.route.shouldRevalidate) {
        let routeChoice = match.route.shouldRevalidate({
          currentUrl: new URL(
            location.pathname + location.search + location.hash,
            window.origin
          ),
          currentParams: currentMatches[0]?.params || {},
          nextUrl: new URL(page, window.origin),
          nextParams: match.params,
          defaultShouldRevalidate: true
        });
        if (typeof routeChoice === "boolean") {
          return routeChoice;
        }
      }
      return true;
    });
  }
  return [];
}
function getModuleLinkHrefs(matches, manifest, { includeHydrateFallback } = {}) {
  return dedupeHrefs(
    matches.map((match) => {
      let route = manifest.routes[match.route.id];
      if (!route) return [];
      let hrefs = [route.module];
      if (route.clientActionModule) {
        hrefs = hrefs.concat(route.clientActionModule);
      }
      if (route.clientLoaderModule) {
        hrefs = hrefs.concat(route.clientLoaderModule);
      }
      if (includeHydrateFallback && route.hydrateFallbackModule) {
        hrefs = hrefs.concat(route.hydrateFallbackModule);
      }
      if (route.imports) {
        hrefs = hrefs.concat(route.imports);
      }
      return hrefs;
    }).flat(1)
  );
}
function dedupeHrefs(hrefs) {
  return [...new Set(hrefs)];
}
function sortKeys(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}
function dedupeLinkDescriptors(descriptors, preloads) {
  let set = /* @__PURE__ */ new Set();
  let preloadsSet = new Set(preloads);
  return descriptors.reduce((deduped, descriptor) => {
    let alreadyModulePreload = preloads && !isPageLinkDescriptor(descriptor) && descriptor.as === "script" && descriptor.href && preloadsSet.has(descriptor.href);
    if (alreadyModulePreload) {
      return deduped;
    }
    let key = JSON.stringify(sortKeys(descriptor));
    if (!set.has(key)) {
      set.add(key);
      deduped.push({ key, link: descriptor });
    }
    return deduped;
  }, []);
}
function useDataRouterContext2() {
  let context = React8.useContext(DataRouterContext);
  invariant2(
    context,
    "You must render this element inside a <DataRouterContext.Provider> element"
  );
  return context;
}
function useDataRouterStateContext() {
  let context = React8.useContext(DataRouterStateContext);
  invariant2(
    context,
    "You must render this element inside a <DataRouterStateContext.Provider> element"
  );
  return context;
}
var FrameworkContext = React8.createContext(void 0);
FrameworkContext.displayName = "FrameworkContext";
function useFrameworkContext() {
  let context = React8.useContext(FrameworkContext);
  invariant2(
    context,
    "You must render this element inside a <HydratedRouter> element"
  );
  return context;
}
function usePrefetchBehavior(prefetch, theirElementProps) {
  let frameworkContext = React8.useContext(FrameworkContext);
  let [maybePrefetch, setMaybePrefetch] = React8.useState(false);
  let [shouldPrefetch, setShouldPrefetch] = React8.useState(false);
  let { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } = theirElementProps;
  let ref = React8.useRef(null);
  React8.useEffect(() => {
    if (prefetch === "render") {
      setShouldPrefetch(true);
    }
    if (prefetch === "viewport") {
      let callback = (entries) => {
        entries.forEach((entry) => {
          setShouldPrefetch(entry.isIntersecting);
        });
      };
      let observer = new IntersectionObserver(callback, { threshold: 0.5 });
      if (ref.current) observer.observe(ref.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [prefetch]);
  React8.useEffect(() => {
    if (maybePrefetch) {
      let id = setTimeout(() => {
        setShouldPrefetch(true);
      }, 100);
      return () => {
        clearTimeout(id);
      };
    }
  }, [maybePrefetch]);
  let setIntent = () => {
    setMaybePrefetch(true);
  };
  let cancelIntent = () => {
    setMaybePrefetch(false);
    setShouldPrefetch(false);
  };
  if (!frameworkContext) {
    return [false, ref, {}];
  }
  if (prefetch !== "intent") {
    return [shouldPrefetch, ref, {}];
  }
  return [
    shouldPrefetch,
    ref,
    {
      onFocus: composeEventHandlers(onFocus, setIntent),
      onBlur: composeEventHandlers(onBlur, cancelIntent),
      onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
      onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
      onTouchStart: composeEventHandlers(onTouchStart, setIntent)
    }
  ];
}
function composeEventHandlers(theirHandler, ourHandler) {
  return (event) => {
    theirHandler && theirHandler(event);
    if (!event.defaultPrevented) {
      ourHandler(event);
    }
  };
}
function PrefetchPageLinks({ page, ...linkProps }) {
  let { router } = useDataRouterContext2();
  let matches = React8.useMemo(
    () => matchRoutes(router.routes, page, router.basename),
    [router.routes, page, router.basename]
  );
  if (!matches) {
    return null;
  }
  return /* @__PURE__ */ React8.createElement(PrefetchPageLinksImpl, { page, matches, ...linkProps });
}
function useKeyedPrefetchLinks(matches) {
  let { manifest, routeModules } = useFrameworkContext();
  let [keyedPrefetchLinks, setKeyedPrefetchLinks] = React8.useState([]);
  React8.useEffect(() => {
    let interrupted = false;
    void getKeyedPrefetchLinks(matches, manifest, routeModules).then(
      (links) => {
        if (!interrupted) {
          setKeyedPrefetchLinks(links);
        }
      }
    );
    return () => {
      interrupted = true;
    };
  }, [matches, manifest, routeModules]);
  return keyedPrefetchLinks;
}
function PrefetchPageLinksImpl({
  page,
  matches: nextMatches,
  ...linkProps
}) {
  let location = useLocation();
  let { future, manifest, routeModules } = useFrameworkContext();
  let { basename } = useDataRouterContext2();
  let { loaderData, matches } = useDataRouterStateContext();
  let newMatchesForData = React8.useMemo(
    () => getNewMatchesForLinks(
      page,
      nextMatches,
      matches,
      manifest,
      location,
      "data"
    ),
    [page, nextMatches, matches, manifest, location]
  );
  let newMatchesForAssets = React8.useMemo(
    () => getNewMatchesForLinks(
      page,
      nextMatches,
      matches,
      manifest,
      location,
      "assets"
    ),
    [page, nextMatches, matches, manifest, location]
  );
  let dataHrefs = React8.useMemo(() => {
    if (page === location.pathname + location.search + location.hash) {
      return [];
    }
    let routesParams = /* @__PURE__ */ new Set();
    let foundOptOutRoute = false;
    nextMatches.forEach((m) => {
      let manifestRoute = manifest.routes[m.route.id];
      if (!manifestRoute || !manifestRoute.hasLoader) {
        return;
      }
      if (!newMatchesForData.some((m2) => m2.route.id === m.route.id) && m.route.id in loaderData && routeModules[m.route.id]?.shouldRevalidate) {
        foundOptOutRoute = true;
      } else if (manifestRoute.hasClientLoader) {
        foundOptOutRoute = true;
      } else {
        routesParams.add(m.route.id);
      }
    });
    if (routesParams.size === 0) {
      return [];
    }
    let url = singleFetchUrl(
      page,
      basename,
      future.unstable_trailingSlashAwareDataRequests,
      "data"
    );
    if (foundOptOutRoute && routesParams.size > 0) {
      url.searchParams.set(
        "_routes",
        nextMatches.filter((m) => routesParams.has(m.route.id)).map((m) => m.route.id).join(",")
      );
    }
    return [url.pathname + url.search];
  }, [
    basename,
    future.unstable_trailingSlashAwareDataRequests,
    loaderData,
    location,
    manifest,
    newMatchesForData,
    nextMatches,
    page,
    routeModules
  ]);
  let moduleHrefs = React8.useMemo(
    () => getModuleLinkHrefs(newMatchesForAssets, manifest),
    [newMatchesForAssets, manifest]
  );
  let keyedPrefetchLinks = useKeyedPrefetchLinks(newMatchesForAssets);
  return /* @__PURE__ */ React8.createElement(React8.Fragment, null, dataHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "prefetch", as: "fetch", href, ...linkProps })), moduleHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "modulepreload", href, ...linkProps })), keyedPrefetchLinks.map(({ key, link }) => (
    // these don't spread `linkProps` because they are full link descriptors
    // already with their own props
    /* @__PURE__ */ React8.createElement(
      "link",
      {
        key,
        nonce: linkProps.nonce,
        ...link,
        crossOrigin: link.crossOrigin ?? linkProps.crossOrigin
      }
    )
  )));
}
function mergeRefs(...refs) {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        ref.current = value;
      }
    });
  };
}
var isBrowser2 = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
try {
  if (isBrowser2) {
    window.__reactRouterVersion = // @ts-expect-error
    "7.13.2";
  }
} catch (e) {
}
function HistoryRouter({
  basename,
  children,
  history,
  unstable_useTransitions
}) {
  let [state, setStateImpl] = React10.useState({
    action: history.action,
    location: history.location
  });
  let setState = React10.useCallback(
    (newState) => {
      if (unstable_useTransitions === false) {
        setStateImpl(newState);
      } else {
        React10.startTransition(() => setStateImpl(newState));
      }
    },
    [unstable_useTransitions]
  );
  React10.useLayoutEffect(() => history.listen(setState), [history, setState]);
  return /* @__PURE__ */ React10.createElement(
    Router,
    {
      basename,
      children,
      location: state.location,
      navigationType: state.action,
      navigator: history,
      unstable_useTransitions
    }
  );
}
HistoryRouter.displayName = "unstable_HistoryRouter";
var ABSOLUTE_URL_REGEX2 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
var Link = React10.forwardRef(
  function LinkWithRef({
    onClick,
    discover = "render",
    prefetch = "none",
    relative,
    reloadDocument,
    replace: replace2,
    unstable_mask,
    state,
    target,
    to,
    preventScrollReset,
    viewTransition,
    unstable_defaultShouldRevalidate,
    ...rest
  }, forwardedRef) {
    let { basename, navigator, unstable_useTransitions } = React10.useContext(NavigationContext);
    let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX2.test(to);
    let parsed = parseToInfo(to, basename);
    to = parsed.to;
    let href = useHref(to, { relative });
    let location = useLocation();
    let maskedHref = null;
    if (unstable_mask) {
      let resolved = resolveTo(
        unstable_mask,
        [],
        location.unstable_mask ? location.unstable_mask.pathname : "/",
        true
      );
      if (basename !== "/") {
        resolved.pathname = resolved.pathname === "/" ? basename : joinPaths([basename, resolved.pathname]);
      }
      maskedHref = navigator.createHref(resolved);
    }
    let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(
      prefetch,
      rest
    );
    let internalOnClick = useLinkClickHandler(to, {
      replace: replace2,
      unstable_mask,
      state,
      target,
      preventScrollReset,
      relative,
      viewTransition,
      unstable_defaultShouldRevalidate,
      unstable_useTransitions
    });
    function handleClick(event) {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) {
        internalOnClick(event);
      }
    }
    let isSpaLink = !(parsed.isExternal || reloadDocument);
    let link = (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      /* @__PURE__ */ React10.createElement(
        "a",
        {
          ...rest,
          ...prefetchHandlers,
          href: (isSpaLink ? maskedHref : void 0) || parsed.absoluteURL || href,
          onClick: isSpaLink ? handleClick : onClick,
          ref: mergeRefs(forwardedRef, prefetchRef),
          target,
          "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
        }
      )
    );
    return shouldPrefetch && !isAbsolute ? /* @__PURE__ */ React10.createElement(React10.Fragment, null, link, /* @__PURE__ */ React10.createElement(PrefetchPageLinks, { page: href })) : link;
  }
);
Link.displayName = "Link";
var NavLink = React10.forwardRef(
  function NavLinkWithRef({
    "aria-current": ariaCurrentProp = "page",
    caseSensitive = false,
    className: classNameProp = "",
    end = false,
    style: styleProp,
    to,
    viewTransition,
    children,
    ...rest
  }, ref) {
    let path = useResolvedPath(to, { relative: rest.relative });
    let location = useLocation();
    let routerState = React10.useContext(DataRouterStateContext);
    let { navigator, basename } = React10.useContext(NavigationContext);
    let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useViewTransitionState(path) && viewTransition === true;
    let toPathname = navigator.encodeLocation ? navigator.encodeLocation(path).pathname : path.pathname;
    let locationPathname = location.pathname;
    let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
    if (!caseSensitive) {
      locationPathname = locationPathname.toLowerCase();
      nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
      toPathname = toPathname.toLowerCase();
    }
    if (nextLocationPathname && basename) {
      nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
    }
    const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
    let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
    let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
    let renderProps = {
      isActive,
      isPending,
      isTransitioning
    };
    let ariaCurrent = isActive ? ariaCurrentProp : void 0;
    let className;
    if (typeof classNameProp === "function") {
      className = classNameProp(renderProps);
    } else {
      className = [
        classNameProp,
        isActive ? "active" : null,
        isPending ? "pending" : null,
        isTransitioning ? "transitioning" : null
      ].filter(Boolean).join(" ");
    }
    let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
    return /* @__PURE__ */ React10.createElement(
      Link,
      {
        ...rest,
        "aria-current": ariaCurrent,
        className,
        ref,
        style,
        to,
        viewTransition
      },
      typeof children === "function" ? children(renderProps) : children
    );
  }
);
NavLink.displayName = "NavLink";
var Form = React10.forwardRef(
  ({
    discover = "render",
    fetcherKey,
    navigate,
    reloadDocument,
    replace: replace2,
    state,
    method = defaultMethod,
    action,
    onSubmit,
    relative,
    preventScrollReset,
    viewTransition,
    unstable_defaultShouldRevalidate,
    ...props
  }, forwardedRef) => {
    let { unstable_useTransitions } = React10.useContext(NavigationContext);
    let submit = useSubmit();
    let formAction = useFormAction(action, { relative });
    let formMethod = method.toLowerCase() === "get" ? "get" : "post";
    let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX2.test(action);
    let submitHandler = (event) => {
      onSubmit && onSubmit(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      let submitter = event.nativeEvent.submitter;
      let submitMethod = submitter?.getAttribute("formmethod") || method;
      let doSubmit = () => submit(submitter || event.currentTarget, {
        fetcherKey,
        method: submitMethod,
        navigate,
        replace: replace2,
        state,
        relative,
        preventScrollReset,
        viewTransition,
        unstable_defaultShouldRevalidate
      });
      if (unstable_useTransitions && navigate !== false) {
        React10.startTransition(() => doSubmit());
      } else {
        doSubmit();
      }
    };
    return /* @__PURE__ */ React10.createElement(
      "form",
      {
        ref: forwardedRef,
        method: formMethod,
        action: formAction,
        onSubmit: reloadDocument ? onSubmit : submitHandler,
        ...props,
        "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
      }
    );
  }
);
Form.displayName = "Form";
function ScrollRestoration({
  getKey,
  storageKey,
  ...props
}) {
  let remixContext = React10.useContext(FrameworkContext);
  let { basename } = React10.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  useScrollRestoration({ getKey, storageKey });
  let ssrKey = React10.useMemo(
    () => {
      if (!remixContext || !getKey) return null;
      let userKey = getScrollRestorationKey(
        location,
        matches,
        basename,
        getKey
      );
      return userKey !== location.key ? userKey : null;
    },
    // Nah, we only need this the first time for the SSR render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  if (!remixContext || remixContext.isSpaMode) {
    return null;
  }
  let restoreScroll = ((storageKey2, restoreKey) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(storageKey2) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem(storageKey2);
    }
  }).toString();
  return /* @__PURE__ */ React10.createElement(
    "script",
    {
      ...props,
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: {
        __html: `(${restoreScroll})(${escapeHtml(
          JSON.stringify(storageKey || SCROLL_RESTORATION_STORAGE_KEY)
        )}, ${escapeHtml(JSON.stringify(ssrKey))})`
      }
    }
  );
}
ScrollRestoration.displayName = "ScrollRestoration";
function getDataRouterConsoleError2(hookName) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useDataRouterContext3(hookName) {
  let ctx = React10.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError2(hookName));
  return ctx;
}
function useDataRouterState2(hookName) {
  let state = React10.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError2(hookName));
  return state;
}
function useLinkClickHandler(to, {
  target,
  replace: replaceProp,
  unstable_mask,
  state,
  preventScrollReset,
  relative,
  viewTransition,
  unstable_defaultShouldRevalidate,
  unstable_useTransitions
} = {}) {
  let navigate = useNavigate();
  let location = useLocation();
  let path = useResolvedPath(to, { relative });
  return React10.useCallback(
    (event) => {
      if (shouldProcessLinkClick(event, target)) {
        event.preventDefault();
        let replace2 = replaceProp !== void 0 ? replaceProp : createPath(location) === createPath(path);
        let doNavigate = () => navigate(to, {
          replace: replace2,
          unstable_mask,
          state,
          preventScrollReset,
          relative,
          viewTransition,
          unstable_defaultShouldRevalidate
        });
        if (unstable_useTransitions) {
          React10.startTransition(() => doNavigate());
        } else {
          doNavigate();
        }
      }
    },
    [
      location,
      navigate,
      path,
      replaceProp,
      unstable_mask,
      state,
      target,
      to,
      preventScrollReset,
      relative,
      viewTransition,
      unstable_defaultShouldRevalidate,
      unstable_useTransitions
    ]
  );
}
var fetcherId = 0;
var getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
function useSubmit() {
  let { router } = useDataRouterContext3(
    "useSubmit"
    /* UseSubmit */
  );
  let { basename } = React10.useContext(NavigationContext);
  let currentRouteId = useRouteId();
  let routerFetch = router.fetch;
  let routerNavigate = router.navigate;
  return React10.useCallback(
    async (target, options = {}) => {
      let { action, method, encType, formData, body } = getFormSubmissionInfo(
        target,
        basename
      );
      if (options.navigate === false) {
        let key = options.fetcherKey || getUniqueFetcherId();
        await routerFetch(key, currentRouteId, options.action || action, {
          unstable_defaultShouldRevalidate: options.unstable_defaultShouldRevalidate,
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || method,
          formEncType: options.encType || encType,
          flushSync: options.flushSync
        });
      } else {
        await routerNavigate(options.action || action, {
          unstable_defaultShouldRevalidate: options.unstable_defaultShouldRevalidate,
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || method,
          formEncType: options.encType || encType,
          replace: options.replace,
          state: options.state,
          fromRouteId: currentRouteId,
          flushSync: options.flushSync,
          viewTransition: options.viewTransition
        });
      }
    },
    [routerFetch, routerNavigate, basename, currentRouteId]
  );
}
function useFormAction(action, { relative } = {}) {
  let { basename } = React10.useContext(NavigationContext);
  let routeContext = React10.useContext(RouteContext);
  invariant(routeContext, "useFormAction must be used inside a RouteContext");
  let [match] = routeContext.matches.slice(-1);
  let path = { ...useResolvedPath(action ? action : ".", { relative }) };
  let location = useLocation();
  if (action == null) {
    path.search = location.search;
    let params = new URLSearchParams(path.search);
    let indexValues = params.getAll("index");
    let hasNakedIndexParam = indexValues.some((v) => v === "");
    if (hasNakedIndexParam) {
      params.delete("index");
      indexValues.filter((v) => v).forEach((v) => params.append("index", v));
      let qs = params.toString();
      path.search = qs ? `?${qs}` : "";
    }
  }
  if ((!action || action === ".") && match.route.index) {
    path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
  }
  if (basename !== "/") {
    path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  }
  return createPath(path);
}
var SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
var savedScrollPositions = {};
function getScrollRestorationKey(location, matches, basename, getKey) {
  let key = null;
  if (getKey) {
    if (basename !== "/") {
      key = getKey(
        {
          ...location,
          pathname: stripBasename(location.pathname, basename) || location.pathname
        },
        matches
      );
    } else {
      key = getKey(location, matches);
    }
  }
  if (key == null) {
    key = location.key;
  }
  return key;
}
function useScrollRestoration({
  getKey,
  storageKey
} = {}) {
  let { router } = useDataRouterContext3(
    "useScrollRestoration"
    /* UseScrollRestoration */
  );
  let { restoreScrollPosition, preventScrollReset } = useDataRouterState2(
    "useScrollRestoration"
    /* UseScrollRestoration */
  );
  let { basename } = React10.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  let navigation = useNavigation();
  React10.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);
  usePageHide(
    React10.useCallback(() => {
      if (navigation.state === "idle") {
        let key = getScrollRestorationKey(location, matches, basename, getKey);
        savedScrollPositions[key] = window.scrollY;
      }
      try {
        sessionStorage.setItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY,
          JSON.stringify(savedScrollPositions)
        );
      } catch (error) {
        warning(
          false,
          `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`
        );
      }
      window.history.scrollRestoration = "auto";
    }, [navigation.state, getKey, basename, location, matches, storageKey])
  );
  if (typeof document !== "undefined") {
    React10.useLayoutEffect(() => {
      try {
        let sessionPositions = sessionStorage.getItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY
        );
        if (sessionPositions) {
          savedScrollPositions = JSON.parse(sessionPositions);
        }
      } catch (e) {
      }
    }, [storageKey]);
    React10.useLayoutEffect(() => {
      let disableScrollRestoration = router?.enableScrollRestoration(
        savedScrollPositions,
        () => window.scrollY,
        getKey ? (location2, matches2) => getScrollRestorationKey(location2, matches2, basename, getKey) : void 0
      );
      return () => disableScrollRestoration && disableScrollRestoration();
    }, [router, basename, getKey]);
    React10.useLayoutEffect(() => {
      if (restoreScrollPosition === false) {
        return;
      }
      if (typeof restoreScrollPosition === "number") {
        window.scrollTo(0, restoreScrollPosition);
        return;
      }
      try {
        if (location.hash) {
          let el = document.getElementById(
            decodeURIComponent(location.hash.slice(1))
          );
          if (el) {
            el.scrollIntoView();
            return;
          }
        }
      } catch {
        warning(
          false,
          `"${location.hash.slice(
            1
          )}" is not a decodable element ID. The view will not scroll to it.`
        );
      }
      if (preventScrollReset === true) {
        return;
      }
      window.scrollTo(0, 0);
    }, [location, restoreScrollPosition, preventScrollReset]);
  }
}
function usePageHide(callback, options) {
  let { capture } = options || {};
  React10.useEffect(() => {
    let opts = capture != null ? { capture } : void 0;
    window.addEventListener("pagehide", callback, opts);
    return () => {
      window.removeEventListener("pagehide", callback, opts);
    };
  }, [callback, capture]);
}
function useViewTransitionState(to, { relative } = {}) {
  let vtContext = React10.useContext(ViewTransitionContext);
  invariant(
    vtContext != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?"
  );
  let { basename } = useDataRouterContext3(
    "useViewTransitionState"
    /* useViewTransitionState */
  );
  let path = useResolvedPath(to, { relative });
  if (!vtContext.isTransitioning) {
    return false;
  }
  let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
  let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
  return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
}

// src/theme/ThemeProvider.tsx
var import_react3 = __toESM(require_react());
var ThemeContext = (0, import_react3.createContext)(void 0);
function useTheme() {
  const ctx = (0, import_react3.useContext)(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

// src/subtitles/export.ts
function formatTime(seconds, millisecondSeparator) {
  const totalMs = Math.max(0, Math.floor(seconds * 1e3));
  const hours = Math.floor(totalMs / 36e5);
  const minutes = Math.floor(totalMs % 36e5 / 6e4);
  const secs = Math.floor(totalMs % 6e4 / 1e3);
  const ms = totalMs % 1e3;
  const pad = (n, size) => n.toString().padStart(size, "0");
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}${millisecondSeparator}${pad(ms, 3)}`;
}
function sanitizeBaseName(baseName) {
  return baseName.trim().replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_") || "subtitles";
}
function buildSrtFromSubtitles(segments) {
  return segments.map((segment, index) => {
    const start = formatTime(segment.start, ",");
    const end = formatTime(segment.end, ",");
    const text = segment.text && segment.text.trim().length > 0 ? segment.text.trim() : "...";
    return `${index + 1}
${start} --> ${end}
${text}`;
  }).join("\n\n");
}
function buildVttFromSubtitles(segments) {
  const body = segments.map((segment, index) => {
    const start = formatTime(segment.start, ".");
    const end = formatTime(segment.end, ".");
    const text = segment.text && segment.text.trim().length > 0 ? segment.text.trim() : "...";
    return `${index + 1}
${start} --> ${end}
${text}`;
  }).join("\n\n");
  return `WEBVTT

${body}`;
}
function remapSubtitlesToEditedTimeline(subtitles, segments) {
  if (subtitles.length === 0 || segments.length === 0) {
    return [];
  }
  const remapped = [];
  let outputOffset = 0;
  segments.forEach((segment) => {
    const segmentDuration = segment.end - segment.start;
    if (segmentDuration <= 0) {
      return;
    }
    subtitles.forEach((subtitle, index) => {
      const overlapStart = Math.max(segment.start, subtitle.start);
      const overlapEnd = Math.min(segment.end, subtitle.end);
      if (overlapEnd <= overlapStart) {
        return;
      }
      remapped.push({
        id: `${subtitle.id || `subtitle-${index}`}-${segment.id}-${overlapStart.toFixed(3)}`,
        start: outputOffset + (overlapStart - segment.start),
        end: outputOffset + (overlapEnd - segment.start),
        text: subtitle.text
      });
    });
    outputOffset += segmentDuration;
  });
  return remapped.filter((segment) => segment.end - segment.start >= 0.05);
}
function downloadSubtitleFile(segments, baseName, format) {
  const safeBaseName = sanitizeBaseName(baseName);
  const content = format === "srt" ? buildSrtFromSubtitles(segments) : buildVttFromSubtitles(segments);
  const mimeType = format === "srt" ? "application/x-subrip;charset=utf-8" : "text/vtt;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeBaseName}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// src/subtitles/api.ts
var DEFAULT_SUBTITLE_API_URL = "http://localhost:8787";
function resolveSubtitleApiUrl() {
  const configured = globalThis.__VIDVERSITY_SUBTITLE_API__;
  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, "");
  }
  return DEFAULT_SUBTITLE_API_URL;
}
function normalizeSegments(segments) {
  if (!segments || segments.length === 0) {
    return [];
  }
  return segments.map((segment, index) => ({
    id: segment.id?.trim() || `segment-${index}`,
    start: Number(segment.start ?? 0),
    end: Number(segment.end ?? 0),
    text: segment.text?.trim() ?? ""
  })).filter(
    (segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end > segment.start
  );
}
function normalizeAudioActivitySegments(segments) {
  if (!segments || segments.length === 0) {
    return [];
  }
  return segments.map((segment) => ({
    start: Number(segment.start_time ?? 0),
    end: Number(segment.end_time ?? 0),
    label: segment.label?.trim() || "silence",
    confidence: segment.confidence == null ? null : Number(segment.confidence)
  })).filter(
    (segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end > segment.start
  );
}
function normalizeEditorSegments(segments) {
  if (!segments || segments.length === 0) {
    return [];
  }
  return segments.map((segment, index) => ({
    id: Number(segment.id ?? index + 1),
    label: segment.label?.trim() || `Clip ${index + 1}`,
    start: Number(segment.start ?? 0),
    end: Number(segment.end ?? 0)
  })).filter(
    (segment) => Number.isFinite(segment.id) && Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end > segment.start
  );
}
function normalizeEditorSession(payload) {
  const segments = normalizeEditorSegments(payload?.segments);
  return {
    sessionId: `${payload?.sessionId ?? ""}`,
    duration: Number(payload?.duration ?? 0),
    selectedSegmentId: payload?.selectedSegmentId == null ? segments[0]?.id ?? null : Number(payload.selectedSegmentId),
    segments
  };
}
async function generateSubtitlesFromVideo(file, options) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const searchParams = new URLSearchParams();
  searchParams.set("model", options.model);
  if (options.language && options.language !== "auto") {
    searchParams.set("language", options.language);
  }
  const response = await fetch(
    `${apiBaseUrl}/api/subtitles/generate?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name)
      },
      body: file
    }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error || "Subtitle generation failed. Check that the local Faster-Whisper service is running."
    );
  }
  const segments = normalizeSegments(payload?.segments);
  if (segments.length === 0) {
    throw new Error("No subtitle segments were returned for this video.");
  }
  return segments;
}
async function detectSilenceFromVideo(file, options) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const searchParams = new URLSearchParams();
  if (options?.noiseThresholdDb != null) {
    searchParams.set("noiseThresholdDb", `${options.noiseThresholdDb}`);
  }
  if (options?.minSilenceDuration != null) {
    searchParams.set("minSilenceDuration", `${options.minSilenceDuration}`);
  }
  if (options?.minSegmentDuration != null) {
    searchParams.set("minSegmentDuration", `${options.minSegmentDuration}`);
  }
  const suffix = searchParams.toString();
  const response = await fetch(
    `${apiBaseUrl}/api/audio/detect-silence${suffix ? `?${suffix}` : ""}`,
    {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name)
      },
      body: file
    }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error || "Silence detection failed. Check that the local backend and FFmpeg are available."
    );
  }
  return {
    audioDuration: Number(payload?.audioDuration ?? 0),
    silenceSegments: normalizeAudioActivitySegments(payload?.silenceSegments),
    speechSegments: normalizeAudioActivitySegments(payload?.speechSegments).map(
      (segment) => ({ ...segment, label: "speech" })
    )
  };
}
async function createEditorSessionFromVideo(file) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const response = await fetch(`${apiBaseUrl}/api/editor/session`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name)
    },
    body: file
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error || "Could not create an editor session for this video."
    );
  }
  const session = normalizeEditorSession(payload);
  if (!session.sessionId || session.segments.length === 0) {
    throw new Error("Editor session was created without any clip segments.");
  }
  return session;
}
async function replaceEditorSessionSegments(sessionId, segments, selectedSegmentId) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const response = await fetch(`${apiBaseUrl}/api/editor/session/replace`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId,
      selectedSegmentId,
      segments
    })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error || "Could not update the editor session."
    );
  }
  return normalizeEditorSession(payload);
}
async function splitEditorSessionAtTime(sessionId, segmentId, splitTime) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const response = await fetch(`${apiBaseUrl}/api/editor/split`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId,
      segmentId,
      splitTime
    })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error || "Could not split the selected clip."
    );
  }
  return normalizeEditorSession(payload);
}
async function exportEditorSessionVideo(sessionId) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const response = await fetch(`${apiBaseUrl}/api/editor/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sessionId })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error || "Could not export the edited video."
    );
  }
  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition") || "";
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  const fileName = match?.[1] || "vidversity-edited.mp4";
  return { blob, fileName };
}
async function appendVideoToEditorSession(sessionId, file) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const encodedSessionId = encodeURIComponent(sessionId);
  const response = await fetch(
    `${apiBaseUrl}/api/editor/append?sessionId=${encodedSessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name)
      },
      body: file
    }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error || "Could not append the uploaded video to the editor timeline."
    );
  }
  return normalizeEditorSession(payload);
}
async function downloadEditorSessionSourceFile(sessionId) {
  const apiBaseUrl = resolveSubtitleApiUrl();
  const encodedSessionId = encodeURIComponent(sessionId);
  const response = await fetch(
    `${apiBaseUrl}/api/editor/source?sessionId=${encodedSessionId}`
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error || "Could not load the current editor source media."
    );
  }
  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition") || "";
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  const fileName = match?.[1] || "vidversity-editor-source.mp4";
  return new File([blob], fileName, {
    type: blob.type || "video/mp4"
  });
}

// src/subtitles/import.ts
function parseTimestamp(raw) {
  const normalized = raw.trim().replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((value) => !Number.isFinite(value))) {
    return null;
  }
  if (numbers.length === 2) {
    const [minutes2, seconds2] = numbers;
    return minutes2 * 60 + seconds2;
  }
  const [hours, minutes, seconds] = numbers;
  return hours * 3600 + minutes * 60 + seconds;
}
function normalizeSubtitleText(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).join(" ").trim();
}
function parseSubtitleContent(content) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const cleaned = normalized.startsWith("WEBVTT") ? normalized.replace(/^WEBVTT[^\n]*\n+/i, "") : normalized;
  const blocks = cleaned.split(/\n{2,}/);
  const segments = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      continue;
    }
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) {
      continue;
    }
    const [rawStart, rawEnd] = lines[timeLineIndex].split("-->").map((part) => part.trim());
    const start = parseTimestamp(rawStart);
    const end = parseTimestamp(rawEnd);
    if (start == null || end == null || end <= start) {
      continue;
    }
    const text = normalizeSubtitleText(lines.slice(timeLineIndex + 1).join("\n"));
    segments.push({
      id: `imported-${segments.length}`,
      start,
      end,
      text: text || "..."
    });
  }
  return segments;
}
async function importSubtitlesFromFile(file) {
  const content = await file.text();
  const segments = parseSubtitleContent(content);
  if (segments.length === 0) {
    throw new Error("No valid subtitle cues were found in that file.");
  }
  return segments;
}

// src/pages/Home.tsx
var CUT_RANGE_MIN_GAP = 0.1;
var AI_SUGGESTIONS = [
  {
    id: "scene-1",
    label: "Scene change",
    timeRange: "00:12 - 00:18",
    description: "Scene change detected between introduction and slides.",
    startTime: 12
  },
  {
    id: "silence-1",
    label: "Silence segment",
    timeRange: "04:05 - 04:20",
    description: "Long silence with no speech detected.",
    startTime: 245
  },
  {
    id: "transcript-1",
    label: "Transcript-based",
    timeRange: "15:00 - 15:30",
    description: "Repeated explanation that may be shortened.",
    startTime: 900
  }
];
var AI_QUICK_ACTIONS = [
  "Split the video into chapters",
  "Trim the first 10 seconds",
  "Find the cleanest opening sentence",
  "Remove long pauses across the edit",
  "Rewrite subtitles for readability"
];
function formatClock(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
function formatTransportClock(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toFixed(1).padStart(4, "0")}`;
}
function formatEditableTimestamp(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(safeSeconds % 3600 / 60);
  const remainingSeconds = safeSeconds - hours * 3600 - minutes * 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toFixed(1).padStart(4, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toFixed(1).padStart(4, "0")}`;
}
function parseEditableTimestamp(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length === 1) {
    const secondsOnly = Number(parts[0]);
    return Number.isFinite(secondsOnly) ? Math.max(0, secondsOnly) : null;
  }
  if (parts.length === 2) {
    const minutes2 = Number(parts[0]);
    const seconds2 = Number(parts[1]);
    if (!Number.isFinite(minutes2) || !Number.isFinite(seconds2)) {
      return null;
    }
    return Math.max(0, minutes2 * 60 + seconds2);
  }
  if (parts.length !== 3) {
    return null;
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }
  return Math.max(0, hours * 3600 + minutes * 60 + seconds);
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function getTimelineTimestampStyle(ratio) {
  const safeRatio = clamp(ratio, 0, 1);
  if (safeRatio <= 0.06) {
    return { left: "8px", transform: "none" };
  }
  if (safeRatio >= 0.94) {
    return { left: "calc(100% - 8px)", transform: "translateX(-100%)" };
  }
  return { left: `${safeRatio * 100}%`, transform: "translateX(-50%)" };
}
function ToolbarButton({
  label,
  tooltip,
  guidedMode,
  isDark,
  onClick,
  icon: Icon2,
  disabled = false,
  danger = false,
  tone = "editor"
}) {
  const styles = danger ? isDark ? "text-[#ff8f9a] hover:bg-[#2a1820]" : "text-[#a23535] hover:bg-[#fff1f1]" : tone === "workspace" ? isDark ? "text-[#ff7ac8] hover:bg-[#2a1730] hover:text-[#ffb3de]" : "text-[#c2187a] hover:bg-[#fff0f8] hover:text-[#a20f66]" : tone === "global" ? isDark ? "text-[#d6deec] hover:bg-[#22314a] hover:text-[#f2f6ff]" : "text-[#5b687c] hover:bg-[#f2f4f6] hover:text-[#37465d]" : isDark ? "text-[#8bb8ff] hover:bg-[#182238] hover:text-[#cfe3ff]" : "text-[#003fb1] hover:bg-[#eef3ff] hover:text-[#00308a]";
  return /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      className: `group relative flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`
    },
    /* @__PURE__ */ import_react4.default.createElement(Icon2, { className: "h-3.5 w-3.5" }),
    /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-[8px] font-bold uppercase tracking-[0.18em]" }, label),
    guidedMode && /* @__PURE__ */ import_react4.default.createElement(
      "div",
      {
        className: `pointer-events-none absolute -top-[102px] left-1/2 z-20 hidden w-44 -translate-x-1/2 rounded-2xl border p-3 text-left shadow-xl group-hover:block ${isDark ? "border-[#31415a] bg-[#111827]" : "border-[#d4dcff] bg-white"}`
      },
      /* @__PURE__ */ import_react4.default.createElement(
        "p",
        {
          className: `text-[9px] font-extrabold uppercase tracking-[0.2em] ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}`
        },
        "Guided Tip"
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "p",
        {
          className: `mt-1 text-[11px] leading-4 ${isDark ? "text-[#edf2ff]" : "text-[#191c1e]"}`
        },
        tooltip
      )
    )
  );
}
async function waitForEvent(target, eventName) {
  return new Promise((resolve) => {
    const handler = (event) => {
      target.removeEventListener(eventName, handler);
      resolve(event);
    };
    target.addEventListener(eventName, handler);
  });
}
async function generateTimelineThumbnails(videoUrl, duration) {
  if (!videoUrl || duration <= 0) return [];
  const frameCount = clamp(Math.round(duration / 8), 8, 18);
  const captureVideo = document.createElement("video");
  captureVideo.src = videoUrl;
  captureVideo.muted = true;
  captureVideo.playsInline = true;
  captureVideo.crossOrigin = "anonymous";
  if (captureVideo.readyState < 1) {
    await waitForEvent(captureVideo, "loadedmetadata");
  }
  const width = 160;
  const aspectRatio = captureVideo.videoWidth > 0 && captureVideo.videoHeight > 0 ? captureVideo.videoWidth / captureVideo.videoHeight : 16 / 9;
  const height = Math.max(90, Math.round(width / aspectRatio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return [];
  const frames = [];
  for (let index = 0; index < frameCount; index += 1) {
    const time = frameCount === 1 ? 0 : duration * index / Math.max(frameCount - 1, 1);
    captureVideo.currentTime = clamp(time, 0, Math.max(duration - 0.05, 0));
    await waitForEvent(captureVideo, "seeked");
    context.drawImage(captureVideo, 0, 0, width, height);
    frames.push({
      id: `thumb-${index}-${time.toFixed(2)}`,
      src: canvas.toDataURL("image/jpeg", 0.72),
      time
    });
  }
  captureVideo.src = "";
  return frames;
}
async function generateWaveformSamples(videoUrl) {
  if (!videoUrl) return [];
  try {
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new window.AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channelData = Array.from(
      { length: audioBuffer.numberOfChannels },
      (_, index) => audioBuffer.getChannelData(index)
    );
    const sampleCount = 160;
    const blockSize = Math.max(1, Math.floor(audioBuffer.length / sampleCount));
    const filteredData = Array.from({ length: sampleCount }, (_, index) => {
      let peak = 0;
      const start = index * blockSize;
      const end = Math.min(start + blockSize, audioBuffer.length);
      for (const data2 of channelData) {
        for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
          peak = Math.max(peak, Math.abs(data2[sampleIndex]));
        }
      }
      return peak;
    });
    const max = Math.max(...filteredData, 1e-3);
    const normalized = filteredData.map((value) => {
      const scaled = Math.sqrt(value / max);
      return clamp(scaled, 0.04, 1);
    });
    await audioContext.close();
    return normalized;
  } catch {
    return [];
  }
}
var VideoPreviewPanel = (0, import_react4.forwardRef)(
  function VideoPreviewPanelInner({
    videoUrl: externalVideoUrl,
    subtitles,
    onLoadedMetadata,
    onTimeUpdate,
    onPlaybackStateChange,
    onVideoSourceChange,
    onVideoFileChange
  }, ref) {
    const [videoUrl, setVideoUrl] = (0, import_react4.useState)(null);
    const fileInputRef = (0, import_react4.useRef)(null);
    const subtitleTrackUrlRef = (0, import_react4.useRef)(null);
    const videoRef = (0, import_react4.useRef)(null);
    (0, import_react4.useEffect)(() => {
      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
        if (subtitleTrackUrlRef.current) {
          URL.revokeObjectURL(subtitleTrackUrlRef.current);
        }
      };
    }, [videoUrl]);
    (0, import_react4.useEffect)(() => {
      if (subtitleTrackUrlRef.current) {
        URL.revokeObjectURL(subtitleTrackUrlRef.current);
        subtitleTrackUrlRef.current = null;
      }
      if (subtitles.length === 0) {
        return;
      }
      const blob = new Blob([buildVttFromSubtitles(subtitles)], {
        type: "text/vtt"
      });
      subtitleTrackUrlRef.current = URL.createObjectURL(blob);
    }, [subtitles]);
    (0, import_react4.useImperativeHandle)(
      ref,
      () => ({
        seekTo: (timeInSeconds) => {
          if (!videoRef.current) return;
          const nextTime = Math.max(0, timeInSeconds);
          videoRef.current.currentTime = nextTime;
          onTimeUpdate(nextTime);
        },
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        play: () => {
          if (!videoRef.current) return;
          void videoRef.current.play();
        },
        pause: () => {
          videoRef.current?.pause();
        },
        stepFrame: (direction) => {
          if (!videoRef.current) return;
          const frameStep = 1 / 30;
          const nextTime = Math.max(
            0,
            videoRef.current.currentTime + direction * frameStep
          );
          videoRef.current.pause();
          videoRef.current.currentTime = nextTime;
          onPlaybackStateChange(false);
          onTimeUpdate(nextTime);
        }
      }),
      [onPlaybackStateChange, onTimeUpdate]
    );
    (0, import_react4.useEffect)(() => {
      if (!externalVideoUrl || externalVideoUrl === videoUrl) return;
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(externalVideoUrl);
      onTimeUpdate(0);
      onPlaybackStateChange(false);
      onVideoSourceChange(externalVideoUrl);
    }, [
      externalVideoUrl,
      onPlaybackStateChange,
      onTimeUpdate,
      onVideoSourceChange,
      videoUrl
    ]);
    const handleFileChange = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      const nextUrl = URL.createObjectURL(file);
      setVideoUrl(nextUrl);
      onTimeUpdate(0);
      onPlaybackStateChange(false);
      onVideoSourceChange(nextUrl);
      onVideoFileChange(file);
    };
    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };
    return /* @__PURE__ */ import_react4.default.createElement("section", { className: "flex flex-1 min-h-0 w-full items-center justify-center px-4 py-4 xl:px-6 xl:py-5" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "relative w-full max-w-[900px] overflow-hidden rounded-[24px] bg-black shadow-[0_20px_60px_rgba(15,23,42,0.24)]" }, videoUrl ? /* @__PURE__ */ import_react4.default.createElement(
      "video",
      {
        ref: videoRef,
        className: "aspect-video max-h-[42vh] w-full bg-black object-contain",
        src: videoUrl,
        playsInline: true,
        onLoadedMetadata: (event) => {
          const nextDuration = event.currentTarget.duration;
          event.currentTarget.currentTime = 0;
          onTimeUpdate(0);
          onLoadedMetadata(nextDuration);
        },
        onTimeUpdate: (event) => {
          const nextTime = event.currentTarget.currentTime;
          onTimeUpdate(nextTime);
        },
        onPlay: () => {
          onPlaybackStateChange(true);
        },
        onPause: () => {
          onPlaybackStateChange(false);
        },
        onEnded: () => {
          onPlaybackStateChange(false);
        }
      },
      subtitleTrackUrlRef.current && /* @__PURE__ */ import_react4.default.createElement(
        "track",
        {
          key: subtitleTrackUrlRef.current,
          default: true,
          kind: "subtitles",
          label: "Subtitles",
          src: subtitleTrackUrlRef.current,
          srcLang: "en"
        }
      )
    ) : /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        type: "button",
        onClick: handleUploadClick,
        className: "relative aspect-video max-h-[42vh] w-full overflow-hidden bg-black text-left transition hover:bg-[#05070b]",
        "aria-label": "Upload video"
      },
      /* @__PURE__ */ import_react4.default.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-4 text-white" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "flex h-20 w-20 items-center justify-center rounded-full bg-white/18 backdrop-blur-md transition hover:bg-white/24" }, /* @__PURE__ */ import_react4.default.createElement(Upload, { className: "h-9 w-9 text-white" })), /* @__PURE__ */ import_react4.default.createElement("div", { className: "text-center" }, /* @__PURE__ */ import_react4.default.createElement("p", { className: "mt-2 text-sm text-white/70" }, "Upload a local video to start editing in this workspace.")))
    )), /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        ref: fileInputRef,
        accept: "video/*",
        className: "hidden",
        type: "file",
        onChange: handleFileChange
      }
    ));
  }
);
function createInitialSegments(duration) {
  const safeDuration = Math.max(1, duration || 180);
  return [{ id: 1, label: "Clip 1", start: 0, end: safeDuration }];
}
function createSilenceSegmentKey(start, end, index) {
  return `${index}:${start.toFixed(3)}:${end.toFixed(3)}`;
}
async function createFileFromVideoUrl(videoUrl) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error("Could not load the selected draft video into the editor.");
  }
  const blob = await response.blob();
  const contentType = blob.type || "video/mp4";
  const extension = contentType.split("/")[1] || "mp4";
  return new File([blob], `draft-video.${extension}`, {
    type: contentType
  });
}
function normalizeCutRange(start, end, editedDuration) {
  const safeDuration = Math.max(editedDuration, CUT_RANGE_MIN_GAP);
  const clampedStart = clamp(
    start,
    0,
    Math.max(0, safeDuration - CUT_RANGE_MIN_GAP)
  );
  const clampedEnd = clamp(end, clampedStart + CUT_RANGE_MIN_GAP, safeDuration);
  return {
    start: clampedStart,
    end: clampedEnd
  };
}
function cutSegmentsToEditedRange(segments, cutStart, cutEnd) {
  if (segments.length === 0) {
    return [];
  }
  let editedOffset = 0;
  const nextSegments = [];
  segments.forEach((segment) => {
    const segmentDuration = Math.max(0, segment.end - segment.start);
    const editedSegmentStart = editedOffset;
    const editedSegmentEnd = editedOffset + segmentDuration;
    const overlapStart = Math.max(cutStart, editedSegmentStart);
    const overlapEnd = Math.min(cutEnd, editedSegmentEnd);
    if (overlapEnd - overlapStart >= CUT_RANGE_MIN_GAP) {
      const sourceStart = segment.start + (overlapStart - editedSegmentStart);
      const sourceEnd = segment.start + (overlapEnd - editedSegmentStart);
      nextSegments.push({
        id: nextSegments.length + 1,
        label: `Clip ${nextSegments.length + 1}`,
        start: sourceStart,
        end: sourceEnd
      });
    }
    editedOffset = editedSegmentEnd;
  });
  return nextSegments;
}
function getSegmentTimelineFrames(thumbnails, segment) {
  if (thumbnails.length === 0) return [];
  const frames = thumbnails.filter(
    (thumbnail) => thumbnail.time >= segment.start && thumbnail.time < segment.end
  );
  if (frames.length > 0) {
    return frames;
  }
  const nearest = thumbnails.reduce((closest, thumbnail) => {
    if (closest == null) return thumbnail;
    const thumbnailDistance = Math.min(
      Math.abs(thumbnail.time - segment.start),
      Math.abs(thumbnail.time - segment.end)
    );
    const closestDistance = Math.min(
      Math.abs(closest.time - segment.start),
      Math.abs(closest.time - segment.end)
    );
    return thumbnailDistance < closestDistance ? thumbnail : closest;
  }, null);
  return nearest ? [nearest] : [];
}
function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const preloadedVideoUrl = location.state?.preloadedVideoUrl ?? null;
  const [videoDuration, setVideoDuration] = (0, import_react4.useState)(null);
  const [videoSourceUrl, setVideoSourceUrl] = (0, import_react4.useState)(null);
  const [selectedVideoFile, setSelectedVideoFile] = (0, import_react4.useState)(null);
  const [currentTime, setCurrentTime] = (0, import_react4.useState)(0);
  const [isPlaying, setIsPlaying] = (0, import_react4.useState)(false);
  const [guidedMode, setGuidedMode] = (0, import_react4.useState)(true);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = (0, import_react4.useState)(false);
  const [aiPromptDraft, setAiPromptDraft] = (0, import_react4.useState)("");
  const [aiMessages, setAiMessages] = (0, import_react4.useState)([
    {
      id: "assistant-seed",
      role: "assistant",
      text: "AI actions will appear here once the backend is connected. For now, suggestion chips can prefill a request and Send stores it in this workspace panel."
    }
  ]);
  const [subtitleSegments, setSubtitleSegments] = (0, import_react4.useState)([]);
  const [subtitleStatus, setSubtitleStatus] = (0, import_react4.useState)("idle");
  const [subtitleError, setSubtitleError] = (0, import_react4.useState)(null);
  const [silenceStatus, setSilenceStatus] = (0, import_react4.useState)("idle");
  const [silenceError, setSilenceError] = (0, import_react4.useState)(null);
  const [silenceSegments, setSilenceSegments] = (0, import_react4.useState)([]);
  const [selectedSilenceSegmentKeys, setSelectedSilenceSegmentKeys] = (0, import_react4.useState)(
    []
  );
  const [stagedSilenceSegmentKeys, setStagedSilenceSegmentKeys] = (0, import_react4.useState)([]);
  const [silenceNotice, setSilenceNotice] = (0, import_react4.useState)(null);
  const [rightPanelView, setRightPanelView] = (0, import_react4.useState)("ai");
  const [subtitleEntryStatus, setSubtitleEntryStatus] = (0, import_react4.useState)("idle");
  const [subtitleTimingDrafts, setSubtitleTimingDrafts] = (0, import_react4.useState)({});
  const [sceneStatus, setSceneStatus] = (0, import_react4.useState)("idle");
  const [segments, setSegments] = (0, import_react4.useState)(createInitialSegments(180));
  const [selectedId, setSelectedId] = (0, import_react4.useState)(1);
  const [editorSessionId, setEditorSessionId] = (0, import_react4.useState)(null);
  const [editorStatus, setEditorStatus] = (0, import_react4.useState)("idle");
  const [editorError, setEditorError] = (0, import_react4.useState)(null);
  const [exportStatus, setExportStatus] = (0, import_react4.useState)("idle");
  const [exportError, setExportError] = (0, import_react4.useState)(null);
  const [appendStatus, setAppendStatus] = (0, import_react4.useState)("idle");
  const [timelineThumbnails, setTimelineThumbnails] = (0, import_react4.useState)([]);
  const [waveformSamples, setWaveformSamples] = (0, import_react4.useState)([]);
  const [timelineMediaReady, setTimelineMediaReady] = (0, import_react4.useState)(false);
  const [isTimelineDragging, setIsTimelineDragging] = (0, import_react4.useState)(false);
  const [activeCutHandle, setActiveCutHandle] = (0, import_react4.useState)(null);
  const [timelineZoom, setTimelineZoom] = (0, import_react4.useState)(1);
  const [history, setHistory] = (0, import_react4.useState)([]);
  const [cutRange, setCutRange] = (0, import_react4.useState)({
    start: 0,
    end: 180
  });
  const videoPreviewRef = (0, import_react4.useRef)(null);
  const timelineTrackRef = (0, import_react4.useRef)(null);
  const subtitleUploadInputRef = (0, import_react4.useRef)(null);
  const appendVideoInputRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    if (!videoDuration || videoDuration <= 0) return;
    if (editorSessionId) return;
    setSegments(createInitialSegments(videoDuration));
    setSelectedId(1);
    setHistory([]);
    setEditorError(null);
    setExportStatus("idle");
    setExportError(null);
    setSilenceStatus("idle");
    setSilenceError(null);
    setSilenceSegments([]);
    setSelectedSilenceSegmentKeys([]);
    setStagedSilenceSegmentKeys([]);
    setSilenceNotice(null);
  }, [editorSessionId, videoDuration]);
  (0, import_react4.useEffect)(() => {
    if (!preloadedVideoUrl) {
      return;
    }
    setSelectedVideoFile(null);
    setEditorSessionId(null);
    setEditorStatus("idle");
    setEditorError(null);
    setExportStatus("idle");
    setExportError(null);
    setSilenceSegments([]);
    setSelectedSilenceSegmentKeys([]);
    setStagedSilenceSegmentKeys([]);
    setSilenceStatus("idle");
    setSilenceError(null);
    setSilenceNotice(null);
    setCutRange({
      start: 0,
      end: 180
    });
  }, [preloadedVideoUrl]);
  (0, import_react4.useEffect)(() => {
    let cancelled = false;
    if (!videoSourceUrl || !videoDuration || videoDuration <= 0) {
      setTimelineThumbnails([]);
      setWaveformSamples([]);
      setTimelineMediaReady(false);
      setCurrentTime(0);
      return;
    }
    setTimelineMediaReady(false);
    void (async () => {
      const [frames, waveform] = await Promise.all([
        generateTimelineThumbnails(videoSourceUrl, videoDuration),
        generateWaveformSamples(videoSourceUrl)
      ]);
      if (cancelled) return;
      setTimelineThumbnails(frames);
      setWaveformSamples(waveform);
      setTimelineMediaReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [videoDuration, videoSourceUrl]);
  (0, import_react4.useEffect)(() => {
    if (!editorSessionId || segments.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        setEditorStatus("syncing");
        await replaceEditorSessionSegments(editorSessionId, segments, selectedId);
        if (!cancelled) {
          setEditorStatus("ready");
          setEditorError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setEditorStatus("error");
          setEditorError(
            error instanceof Error ? error.message : "Could not sync the editor timeline."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editorSessionId, segments, selectedId]);
  const selectedSegment = segments.find((segment) => segment.id === selectedId) ?? segments[0] ?? null;
  const selectedIndex = selectedSegment ? segments.findIndex((segment) => segment.id === selectedSegment.id) : -1;
  const canMergeWithNext = selectedIndex >= 0 && selectedIndex < segments.length - 1;
  const totalDuration = videoDuration && videoDuration > 0 ? videoDuration : segments.length > 0 ? segments[segments.length - 1].end : 180;
  const editedDuration = Math.max(
    0,
    segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0)
  );
  const normalizedCutRange = normalizeCutRange(
    cutRange.start,
    cutRange.end,
    editedDuration
  );
  const cutRangeStartRatio = editedDuration > 0 ? normalizedCutRange.start / editedDuration : 0;
  const cutRangeEndRatio = editedDuration > 0 ? normalizedCutRange.end / editedDuration : 1;
  const timelinePlayheadSegmentIndex = segments.findIndex(
    (segment) => currentTime >= segment.start && currentTime <= segment.end
  );
  const activeTimelineSegmentIndex = timelinePlayheadSegmentIndex >= 0 ? timelinePlayheadSegmentIndex : selectedIndex;
  const activeTimelineSegment = activeTimelineSegmentIndex >= 0 ? segments[activeTimelineSegmentIndex] : null;
  const activeTimelineSegmentOffset = activeTimelineSegmentIndex > 0 ? segments.slice(0, activeTimelineSegmentIndex).reduce((sum, segment) => sum + (segment.end - segment.start), 0) : 0;
  const timelinePlayheadEditedTime = activeTimelineSegment ? clamp(
    activeTimelineSegmentOffset + clamp(
      currentTime - activeTimelineSegment.start,
      0,
      Math.max(activeTimelineSegment.end - activeTimelineSegment.start, 0)
    ),
    0,
    editedDuration
  ) : 0;
  const timelinePlayheadRatio = editedDuration > 0 ? clamp(timelinePlayheadEditedTime / editedDuration, 0, 1) : 0;
  const silenceReviewItems = silenceSegments.map((segment, index) => ({
    ...segment,
    key: createSilenceSegmentKey(segment.start, segment.end, index),
    index
  }));
  const selectedSilenceCount = silenceReviewItems.filter(
    (segment) => selectedSilenceSegmentKeys.includes(segment.key)
  ).length;
  const stagedSilenceCount = silenceReviewItems.filter(
    (segment) => stagedSilenceSegmentKeys.includes(segment.key)
  ).length;
  const hasUnsavedChanges = Boolean(selectedVideoFile || videoSourceUrl || preloadedVideoUrl) && (history.length > 0 || Boolean(editorSessionId) || subtitleSegments.length > 0 || silenceSegments.length > 0 || stagedSilenceSegmentKeys.length > 0);
  const captureEditorState = () => ({
    segments: segments.map((segment) => ({ ...segment })),
    selectedId,
    subtitleSegments: subtitleSegments.map((segment) => ({ ...segment }))
  });
  const pushHistory = () => {
    setHistory((prev) => [...prev.slice(-29), captureEditorState()]);
  };
  const confirmDiscardChanges = () => {
    if (!hasUnsavedChanges) {
      return true;
    }
    return window.confirm(
      "You have unsaved changes in the editor. If you leave now, those changes will be lost."
    );
  };
  const ensureVideoFile = async () => {
    if (selectedVideoFile) {
      return selectedVideoFile;
    }
    const sourceUrl = videoSourceUrl || preloadedVideoUrl;
    if (!sourceUrl) {
      return null;
    }
    try {
      const file = await createFileFromVideoUrl(sourceUrl);
      setSelectedVideoFile(file);
      return file;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not prepare the selected video for editing.";
      setSubtitleError(message);
      setSilenceError(message);
      setEditorError(message);
      return null;
    }
  };
  const resetWorkspaceForNewSource = () => {
    setEditorSessionId(null);
    setEditorStatus("idle");
    setEditorError(null);
    setSubtitleSegments([]);
    setSubtitleStatus("idle");
    setSubtitleError(null);
    setSubtitleTimingDrafts({});
    setSilenceStatus("idle");
    setSilenceError(null);
    setSilenceSegments([]);
    setSelectedSilenceSegmentKeys([]);
    setStagedSilenceSegmentKeys([]);
    setSilenceNotice(null);
    setRightPanelView("ai");
    setHistory([]);
    setCutRange({
      start: 0,
      end: Math.max(CUT_RANGE_MIN_GAP, editedDuration || videoDuration || 180)
    });
  };
  const handleUndo = async () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setSegments(previous.segments);
    setSelectedId(previous.selectedId);
    setSubtitleSegments(previous.subtitleSegments);
    if (!editorSessionId) return;
    try {
      setEditorStatus("syncing");
      const session = await replaceEditorSessionSegments(
        editorSessionId,
        previous.segments,
        previous.selectedId
      );
      setSegments(session.segments);
      setSelectedId(session.selectedSegmentId ?? previous.selectedId);
      setEditorStatus("ready");
      setEditorError(null);
    } catch (error) {
      setEditorStatus("error");
      setEditorError(
        error instanceof Error ? error.message : "Could not restore the previous editor state."
      );
    }
  };
  const handleSeek = (timeInSeconds) => {
    const safeTime = Math.max(0, Math.min(timeInSeconds, totalDuration));
    const containingSegment = segments.find(
      (segment) => safeTime >= segment.start && safeTime <= segment.end
    );
    if (containingSegment) {
      setSelectedId(containingSegment.id);
    }
    videoPreviewRef.current?.seekTo(safeTime);
    setCurrentTime(safeTime);
  };
  const seekEditedTimelineToTime = (editedTime) => {
    if (segments.length === 0 || editedDuration <= 0) {
      handleSeek(editedTime);
      return;
    }
    const safeEditedTime = clamp(editedTime, 0, editedDuration);
    let consumedDuration = 0;
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const segmentDuration = Math.max(segment.end - segment.start, 0);
      const nextConsumedDuration = consumedDuration + segmentDuration;
      if (safeEditedTime <= nextConsumedDuration || index === segments.length - 1) {
        const nextTime = segment.start + clamp(safeEditedTime - consumedDuration, 0, Math.max(segmentDuration, 0));
        handleSeek(nextTime);
        return;
      }
      consumedDuration = nextConsumedDuration;
    }
  };
  const seekTimelineFromClientX = (clientX) => {
    if (!timelineTrackRef.current) return;
    const bounds = timelineTrackRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1);
    if (segments.length === 0 || editedDuration <= 0) {
      handleSeek(ratio * totalDuration);
      return;
    }
    seekEditedTimelineToTime(ratio * editedDuration);
  };
  const handleOpenCutPanel = () => {
    setRightPanelView("cut");
    setIsRightPanelCollapsed(false);
    setEditorError(null);
    setCutRange(normalizedCutRange);
  };
  const handleGenerateSubtitles = async () => {
    const videoFile = await ensureVideoFile();
    if (!videoFile) {
      setSubtitleStatus("error");
      setSubtitleError("Upload a local video file before generating subtitles.");
      return false;
    }
    pushHistory();
    setSubtitleStatus("processing");
    setSubtitleError(null);
    try {
      const generated = await generateSubtitlesFromVideo(videoFile, {
        model: "tiny.en",
        language: "en"
      });
      setSubtitleSegments(generated);
      setSubtitleTimingDrafts({});
      setSubtitleStatus("success");
      setRightPanelView("subtitles");
      setIsRightPanelCollapsed(false);
      return true;
    } catch (error) {
      setSubtitleStatus("error");
      setSubtitleError(
        error instanceof Error ? error.message : "Subtitle generation failed unexpectedly."
      );
      return false;
    }
  };
  const handleRemoveSilence = async () => {
    setRightPanelView("silence");
    setIsRightPanelCollapsed(false);
    const videoFile = await ensureVideoFile();
    if (!videoFile) {
      setSilenceStatus("error");
      setSilenceError(
        "Upload a local video file before running silence detection."
      );
      return;
    }
    setSilenceStatus("processing");
    setSilenceError(null);
    setSilenceNotice(null);
    try {
      const detection = await detectSilenceFromVideo(videoFile, {
        noiseThresholdDb: -35,
        minSilenceDuration: 0.6,
        minSegmentDuration: 0.25
      });
      const nextSilenceSegments = detection.silenceSegments;
      setSilenceSegments(nextSilenceSegments);
      setSelectedSilenceSegmentKeys(
        nextSilenceSegments.map(
          (segment, index) => createSilenceSegmentKey(segment.start, segment.end, index)
        )
      );
      setStagedSilenceSegmentKeys([]);
      setSilenceStatus("success");
      setSilenceNotice(
        nextSilenceSegments.length > 0 ? "Review the detected silence ranges, then stage the ones you want the backend editor to remove later." : "No long silence ranges were detected in this pass."
      );
    } catch (error) {
      setSilenceStatus("error");
      setSilenceError(
        error instanceof Error ? error.message : "Silence detection failed unexpectedly."
      );
    }
  };
  const handleOpenAIPanel = () => {
    setRightPanelView("ai");
    setIsRightPanelCollapsed(false);
  };
  const handleOpenSubtitlesPanel = () => {
    setRightPanelView("subtitles");
    setIsRightPanelCollapsed(false);
    setSubtitleError(null);
  };
  const handleOpenScenesPanel = () => {
    setRightPanelView("scenes");
    setIsRightPanelCollapsed(false);
    setSceneStatus("pending");
  };
  const handleToggleSilenceSelection = (key) => {
    setSelectedSilenceSegmentKeys(
      (prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };
  const handleSelectAllSilences = () => {
    setSelectedSilenceSegmentKeys(silenceReviewItems.map((segment) => segment.key));
    setSilenceError(null);
  };
  const handleClearSelectedSilences = () => {
    setSelectedSilenceSegmentKeys([]);
    setSilenceError(null);
  };
  const handleApplySelectedSilences = () => {
    if (selectedSilenceSegmentKeys.length === 0) {
      setSilenceError(
        "Select at least one silence range to stage it for backend removal."
      );
      return;
    }
    setSilenceError(null);
    setStagedSilenceSegmentKeys([...selectedSilenceSegmentKeys]);
    setSilenceNotice(
      `${selectedSilenceSegmentKeys.length} silence range${selectedSilenceSegmentKeys.length === 1 ? "" : "s"} staged for future backend removal. This does not edit playback or media yet.`
    );
  };
  const updateCutHandle = (handle, editedTime) => {
    setCutRange((prev) => {
      const currentRange = normalizeCutRange(prev.start, prev.end, editedDuration);
      if (handle === "start") {
        return {
          start: clamp(
            editedTime,
            0,
            Math.max(0, currentRange.end - CUT_RANGE_MIN_GAP)
          ),
          end: currentRange.end
        };
      }
      return {
        start: currentRange.start,
        end: clamp(
          editedTime,
          currentRange.start + CUT_RANGE_MIN_GAP,
          Math.max(editedDuration, CUT_RANGE_MIN_GAP)
        )
      };
    });
  };
  const updateCutHandleFromClientX = (handle, clientX) => {
    if (!timelineTrackRef.current || editedDuration <= 0) return;
    const bounds = timelineTrackRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1);
    updateCutHandle(handle, ratio * editedDuration);
  };
  const beginCutTimelineInteraction = (clientX) => {
    if (!timelineTrackRef.current || editedDuration <= 0) return;
    const bounds = timelineTrackRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1);
    const editedTime = ratio * editedDuration;
    const nextHandle = Math.abs(editedTime - normalizedCutRange.start) <= Math.abs(editedTime - normalizedCutRange.end) ? "start" : "end";
    setActiveCutHandle(nextHandle);
    updateCutHandle(nextHandle, editedTime);
  };
  const handleCutVideo = () => {
    if (segments.length === 0) {
      setEditorError("Upload a video before cutting the timeline.");
      return;
    }
    const nextSegments = cutSegmentsToEditedRange(
      segments,
      normalizedCutRange.start,
      normalizedCutRange.end
    );
    if (nextSegments.length === 0) {
      setEditorError(
        "Move the cut handles so the kept range includes part of the timeline."
      );
      return;
    }
    pushHistory();
    setEditorError(null);
    setSegments(nextSegments);
    setSelectedId(nextSegments[0].id);
    setCutRange({
      start: 0,
      end: nextSegments.reduce(
        (sum, segment) => sum + (segment.end - segment.start),
        0
      )
    });
    videoPreviewRef.current?.seekTo(nextSegments[0].start);
    setCurrentTime(nextSegments[0].start);
  };
  const ensureEditorSession = async () => {
    const videoFile = await ensureVideoFile();
    if (!videoFile) {
      setEditorStatus("error");
      setEditorError("Upload a local video file to use real split editing.");
      return null;
    }
    if (editorSessionId) {
      return {
        sessionId: editorSessionId,
        duration: videoDuration ?? totalDuration,
        selectedSegmentId: selectedId,
        segments
      };
    }
    try {
      setEditorStatus("syncing");
      const session = await createEditorSessionFromVideo(videoFile);
      setEditorSessionId(session.sessionId);
      setSegments(session.segments);
      setSelectedId(session.selectedSegmentId ?? session.segments[0]?.id ?? 1);
      setEditorStatus("ready");
      setEditorError(null);
      return session;
    } catch (error) {
      setEditorStatus("error");
      setEditorError(
        error instanceof Error ? error.message : "Could not create an editor session for this video."
      );
      return null;
    }
  };
  const handleSplitAtPlayhead = async () => {
    if (!selectedSegment) return;
    const playhead = currentTime;
    const minGap = 1;
    if (playhead <= selectedSegment.start + minGap || playhead >= selectedSegment.end - minGap) {
      return;
    }
    const session = await ensureEditorSession();
    if (!session) return;
    try {
      setEditorStatus("syncing");
      const previousState = captureEditorState();
      const nextSession = await splitEditorSessionAtTime(
        session.sessionId,
        selectedSegment.id,
        playhead
      );
      setHistory((prev) => [...prev.slice(-29), previousState]);
      setSegments(nextSession.segments);
      setSelectedId(
        nextSession.selectedSegmentId ?? nextSession.segments[0]?.id ?? selectedSegment.id
      );
      setEditorStatus("ready");
      setEditorError(null);
      handleSeek(playhead);
    } catch (error) {
      setEditorStatus("error");
      setEditorError(
        error instanceof Error ? error.message : "Could not split the selected clip."
      );
    }
  };
  const handleTrimStart = () => {
    if (!selectedSegment) return;
    const playhead = currentTime;
    if (playhead <= selectedSegment.start || playhead >= selectedSegment.end - 1) {
      return;
    }
    pushHistory();
    setSegments(
      (prev) => prev.map(
        (segment) => segment.id === selectedSegment.id ? { ...segment, start: playhead } : segment
      )
    );
    handleSeek(playhead);
  };
  const handleTrimEnd = () => {
    if (!selectedSegment) return;
    const playhead = currentTime;
    if (playhead >= selectedSegment.end || playhead <= selectedSegment.start + 1) {
      return;
    }
    pushHistory();
    setSegments(
      (prev) => prev.map(
        (segment) => segment.id === selectedSegment.id ? { ...segment, end: playhead } : segment
      )
    );
    handleSeek(playhead);
  };
  const handleMergeWithNext = () => {
    if (!selectedSegment || !canMergeWithNext) return;
    pushHistory();
    setSegments((prev) => {
      const index = prev.findIndex((segment) => segment.id === selectedSegment.id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const currentSegment = prev[index];
      const nextSegment = prev[index + 1];
      const mergedSegment = {
        id: Date.now(),
        label: `${currentSegment.label} + ${nextSegment.label}`,
        start: currentSegment.start,
        end: nextSegment.end
      };
      const copy = [...prev];
      copy.splice(index, 2, mergedSegment);
      setSelectedId(mergedSegment.id);
      return copy;
    });
    handleSeek(selectedSegment.start);
  };
  const handleDeleteSelectedClip = () => {
    if (!selectedSegment) return;
    pushHistory();
    setSegments((prev) => {
      const index = prev.findIndex((segment) => segment.id === selectedSegment.id);
      const filtered = prev.filter((segment) => segment.id !== selectedSegment.id);
      if (filtered.length === 0) {
        setSelectedId(0);
        return [];
      }
      const nextIndex = Math.min(index, filtered.length - 1);
      const nextSegment = filtered[nextIndex];
      setSelectedId(nextSegment.id);
      handleSeek(nextSegment.start);
      return filtered;
    });
  };
  const handleUpdateSubtitle = (updated) => {
    pushHistory();
    setSubtitleError(null);
    setSubtitleSegments(
      (prev) => prev.map((segment) => segment.id === updated.id ? updated : segment)
    );
  };
  const handleDeleteSubtitle = (id) => {
    pushHistory();
    setSubtitleError(null);
    setSubtitleSegments((prev) => prev.filter((segment) => segment.id !== id));
    setSubtitleTimingDrafts((prev) => {
      const next = { ...prev };
      delete next[`${id}:start`];
      delete next[`${id}:end`];
      return next;
    });
  };
  const handleUpdateSubtitleTiming = (segment, field, nextValue) => {
    const normalizedValue = Math.max(0, nextValue);
    const minimumGap = 0.1;
    const updatedSegment = field === "start" ? {
      ...segment,
      start: Math.min(normalizedValue, Math.max(0, segment.end - minimumGap))
    } : {
      ...segment,
      end: Math.max(normalizedValue, segment.start + minimumGap)
    };
    handleUpdateSubtitle(updatedSegment);
  };
  const getSubtitleTimingDraft = (segment, field) => subtitleTimingDrafts[`${segment.id}:${field}`] ?? formatEditableTimestamp(segment[field]);
  const handleSubtitleTimingDraftChange = (segmentId, field, value) => {
    setSubtitleTimingDrafts((prev) => ({
      ...prev,
      [`${segmentId}:${field}`]: value
    }));
  };
  const handleSubtitleTimingDraftCommit = (segment, field) => {
    const key = `${segment.id}:${field}`;
    const draft = subtitleTimingDrafts[key];
    const parsed = parseEditableTimestamp(draft ?? formatEditableTimestamp(segment[field]));
    if (parsed == null) {
      setSubtitleError(
        "Use subtitle times in mm:ss.s or hh:mm:ss.s format, for example 01:23.4 or 01:02:03.4."
      );
      setSubtitleTimingDrafts((prev) => ({
        ...prev,
        [key]: formatEditableTimestamp(segment[field])
      }));
      return;
    }
    setSubtitleError(null);
    handleUpdateSubtitleTiming(segment, field, parsed);
    setSubtitleTimingDrafts((prev) => ({
      ...prev,
      [key]: formatEditableTimestamp(
        field === "start" ? Math.min(parsed, Math.max(0, segment.end - 0.1)) : Math.max(parsed, segment.start + 0.1)
      )
    }));
  };
  const handleExportSubtitle = (format) => {
    if (subtitleSegments.length === 0) return;
    const baseName = selectedVideoFile?.name || "vidversity-subtitles";
    downloadSubtitleFile(subtitleSegments, baseName, format);
  };
  const handleRemoveSubtitles = () => {
    pushHistory();
    setSubtitleSegments([]);
    setSubtitleStatus("idle");
    setSubtitleError(null);
    setSubtitleTimingDrafts({});
    setSubtitleEntryStatus("idle");
  };
  const handleGenerateSubtitlesFromPanel = async () => {
    setSubtitleEntryStatus("generating");
    const didSucceed = await handleGenerateSubtitles();
    if (didSucceed) {
      setSubtitleEntryStatus("success");
      window.setTimeout(() => {
        setSubtitleEntryStatus("idle");
      }, 700);
    } else {
      setSubtitleEntryStatus("idle");
    }
  };
  const handleExportVideo = async () => {
    const session = await ensureEditorSession();
    if (!session) return;
    try {
      setExportStatus("processing");
      setExportError(null);
      await replaceEditorSessionSegments(session.sessionId, segments, selectedId);
      const rendered = await exportEditorSessionVideo(session.sessionId);
      const url = URL.createObjectURL(rendered.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = rendered.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (subtitleSegments.length > 0) {
        const remappedSubtitles = remapSubtitlesToEditedTimeline(
          subtitleSegments,
          segments
        );
        if (remappedSubtitles.length > 0) {
          const baseName = rendered.fileName.replace(/\.mp4$/i, "");
          downloadSubtitleFile(remappedSubtitles, baseName, "srt");
        }
      }
      setExportStatus("idle");
    } catch (error) {
      setExportStatus("error");
      setExportError(
        error instanceof Error ? error.message : "Could not export the edited video."
      );
    }
  };
  const handleSubtitleUploadClick = () => {
    subtitleUploadInputRef.current?.click();
  };
  const handleAppendVideoClick = () => {
    appendVideoInputRef.current?.click();
  };
  const handleAppendVideoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const session = await ensureEditorSession();
    if (!session) return;
    try {
      setAppendStatus("processing");
      setEditorStatus("syncing");
      setEditorError(null);
      const nextSession = await appendVideoToEditorSession(session.sessionId, file);
      const combinedFile = await downloadEditorSessionSourceFile(nextSession.sessionId);
      const combinedUrl = URL.createObjectURL(combinedFile);
      setSelectedVideoFile(combinedFile);
      setVideoSourceUrl(combinedUrl);
      setVideoDuration(nextSession.duration);
      setCutRange({
        start: 0,
        end: Math.max(CUT_RANGE_MIN_GAP, nextSession.duration)
      });
      setCurrentTime(0);
      setSegments(nextSession.segments);
      setSelectedId(
        nextSession.selectedSegmentId ?? nextSession.segments.at(-1)?.id ?? selectedId
      );
      setEditorSessionId(nextSession.sessionId);
      setEditorStatus("ready");
      setIsPlaying(false);
      setHistory([]);
      setSubtitleSegments([]);
      setSubtitleStatus("idle");
      setSubtitleError(null);
      setSubtitleTimingDrafts({});
      setSilenceStatus("idle");
      setSilenceError(null);
      setSilenceSegments([]);
      setSelectedSilenceSegmentKeys([]);
      setStagedSilenceSegmentKeys([]);
      setSilenceNotice(
        `${file.name} was added to the end of the current timeline. Regenerate subtitles or silence detection if you want those tools to include the new clip.`
      );
      setRightPanelView("ai");
      videoPreviewRef.current?.pause();
      videoPreviewRef.current?.seekTo(0);
    } catch (error) {
      setEditorStatus("error");
      setEditorError(
        error instanceof Error ? error.message : "Could not add the uploaded video to the current timeline."
      );
    } finally {
      setAppendStatus("idle");
    }
  };
  const handleSubtitleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSubtitleEntryStatus("uploading");
    setSubtitleError(null);
    try {
      const importedSegments = await importSubtitlesFromFile(file);
      pushHistory();
      setSubtitleSegments(importedSegments);
      setSubtitleStatus("success");
      setSubtitleTimingDrafts({});
      setSubtitleEntryStatus("success");
      setRightPanelView("subtitles");
      setIsRightPanelCollapsed(false);
      window.setTimeout(() => {
        setSubtitleEntryStatus("idle");
      }, 700);
    } catch (error) {
      setSubtitleStatus("error");
      setSubtitleEntryStatus("idle");
      setSubtitleError(
        error instanceof Error ? error.message : "Subtitle upload failed unexpectedly."
      );
    }
  };
  const handlePreviewSuggestion = (suggestionId) => {
    const suggestion = AI_SUGGESTIONS.find((item) => item.id === suggestionId);
    if (!suggestion) return;
    handleSeek(suggestion.startTime);
  };
  const handleTogglePlayback = () => {
    if (!videoPreviewRef.current) return;
    if (isPlaying) {
      videoPreviewRef.current.pause();
    } else {
      if (selectedSegment) {
        const currentPreviewTime = videoPreviewRef.current.getCurrentTime();
        const clipEndBoundary = Math.max(
          selectedSegment.start,
          selectedSegment.end - 0.05
        );
        if (currentPreviewTime < selectedSegment.start || currentPreviewTime >= clipEndBoundary) {
          videoPreviewRef.current.seekTo(selectedSegment.start);
          setCurrentTime(selectedSegment.start);
        }
      }
      videoPreviewRef.current.play();
    }
  };
  const handleStepFrame = (direction) => {
    videoPreviewRef.current?.stepFrame(direction);
  };
  (0, import_react4.useEffect)(() => {
    if (!isPlaying || !selectedSegment || !videoPreviewRef.current) return;
    const clipEndBoundary = Math.max(
      selectedSegment.start,
      selectedSegment.end - 0.05
    );
    if (currentTime < clipEndBoundary) {
      return;
    }
    videoPreviewRef.current.pause();
    videoPreviewRef.current.seekTo(clipEndBoundary);
    setCurrentTime(clipEndBoundary);
  }, [currentTime, isPlaying, selectedSegment]);
  (0, import_react4.useEffect)(() => {
    if (!hasUnsavedChanges) {
      return;
    }
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  const handleTimelineZoom = (direction) => {
    setTimelineZoom((prev) => clamp(prev + direction * 0.5, 1, 4));
  };
  const handleSendAIPrompt = () => {
    const trimmed = aiPromptDraft.trim();
    if (!trimmed) return;
    setAiMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed
      }
    ]);
    setAiPromptDraft("");
  };
  (0, import_react4.useEffect)(() => {
    if (!isTimelineDragging) return;
    const handlePointerMove = (event) => {
      seekTimelineFromClientX(event.clientX);
    };
    const handlePointerUp = () => {
      setIsTimelineDragging(false);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isTimelineDragging, totalDuration]);
  (0, import_react4.useEffect)(() => {
    if (!activeCutHandle) return;
    const handlePointerMove = (event) => {
      updateCutHandleFromClientX(activeCutHandle, event.clientX);
    };
    const handlePointerUp = () => {
      setActiveCutHandle(null);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeCutHandle, editedDuration]);
  (0, import_react4.useEffect)(() => {
    setCutRange((prev) => normalizeCutRange(prev.start, prev.end, editedDuration));
  }, [editedDuration]);
  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
  const navLinkClass = ({ isActive }) => `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive ? isDark ? "bg-[#182238] text-[#8bb8ff] font-semibold shadow-sm" : "bg-white text-[#003fb1] font-semibold shadow-sm" : isDark ? "text-[#9fb0ca] hover:bg-[#182238] hover:text-[#8bb8ff]" : "text-[#57657a] hover:bg-white hover:text-[#003fb1]"}`;
  const timeMarkers = (0, import_react4.useMemo)(
    () => Array.from(
      { length: 6 },
      (_, index) => formatClock(editedDuration / 5 * index)
    ),
    [editedDuration]
  );
  return /* @__PURE__ */ import_react4.default.createElement(
    "div",
    {
      className: `h-screen overflow-hidden font-sans transition-colors ${isDark ? "bg-[#0b1220] text-[#edf2ff]" : "bg-[#f7f9fb] text-[#191c1e]"}`
    },
    exportStatus === "processing" ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "fixed inset-0 z-[120] flex items-center justify-center bg-[#0b1220]/55 px-4 backdrop-blur-sm" }, /* @__PURE__ */ import_react4.default.createElement(
      "div",
      {
        className: `w-full max-w-sm rounded-[28px] border px-6 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${isDark ? "border-[#31415a] bg-[#111827] text-[#edf2ff]" : "border-[#d9dde5] bg-white text-[#191c1e]"}`
      },
      /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(26,86,219,0.12)]" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#1a56db] border-t-transparent" })),
      /* @__PURE__ */ import_react4.default.createElement(
        "h2",
        {
          className: `mt-4 text-[15px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}`
        },
        "Rendering Video"
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "p",
        {
          className: `mt-3 text-sm leading-6 ${isDark ? "text-[#c6d3eb]" : "text-[#515f74]"}`
        },
        "VidVersity is processing your current clip timeline. Your download will start automatically when the render finishes."
      )
    )) : null,
    appendStatus === "processing" ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "fixed inset-0 z-[120] flex items-center justify-center bg-[#0b1220]/55 px-4 backdrop-blur-sm" }, /* @__PURE__ */ import_react4.default.createElement(
      "div",
      {
        className: `w-full max-w-sm rounded-[28px] border px-6 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${isDark ? "border-[#31415a] bg-[#111827] text-[#edf2ff]" : "border-[#d9dde5] bg-white text-[#191c1e]"}`
      },
      /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(222,52,171,0.12)]" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#de34ab] border-t-transparent" })),
      /* @__PURE__ */ import_react4.default.createElement(
        "h2",
        {
          className: `mt-4 text-[15px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-[#ff9dd7]" : "text-[#c2187a]"}`
        },
        "Processing Video"
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "p",
        {
          className: `mt-3 text-sm leading-6 ${isDark ? "text-[#c6d3eb]" : "text-[#515f74]"}`
        },
        "VidVersity is adding the uploaded video to the end of your current timeline. This can take a moment for larger files."
      )
    )) : null,
    /* @__PURE__ */ import_react4.default.createElement("header", { className: "sticky top-0 z-40 flex items-center justify-between gap-4 bg-[#de34ab] px-5 py-3 text-white shadow-[0_12px_40px_rgba(222,52,171,0.28)]" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-8" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "font-['Manrope'] text-xl font-extrabold tracking-[-0.04em]" }, "Vidversity")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setGuidedMode((prev) => !prev),
        className: "flex items-center gap-3 rounded-full bg-white/18 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] backdrop-blur"
      },
      /* @__PURE__ */ import_react4.default.createElement("span", null, "Guided Mode"),
      /* @__PURE__ */ import_react4.default.createElement(
        "span",
        {
          className: `relative h-5 w-10 rounded-full transition ${guidedMode ? "bg-[#1a56db]" : "bg-white/35"}`
        },
        /* @__PURE__ */ import_react4.default.createElement(
          "span",
          {
            className: `absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${guidedMode ? "left-[22px]" : "left-0.5"}`
          }
        )
      )
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        type: "button",
        onClick: toggleTheme,
        className: "rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24",
        title: "Toggle theme"
      },
      theme === "dark" ? /* @__PURE__ */ import_react4.default.createElement(Moon, { className: "h-4 w-4" }) : /* @__PURE__ */ import_react4.default.createElement(Sun, { className: "h-4 w-4" })
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        type: "button",
        className: "rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
      },
      /* @__PURE__ */ import_react4.default.createElement(CircleHelp, { className: "h-4 w-4" })
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        type: "button",
        className: "relative rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
      },
      /* @__PURE__ */ import_react4.default.createElement(Bell, { className: "h-4 w-4" }),
      /* @__PURE__ */ import_react4.default.createElement("span", { className: "absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" })
    ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/25 bg-white/20 font-semibold" }, "NR"))),
    /* @__PURE__ */ import_react4.default.createElement(
      "div",
      {
        className: `grid h-[calc(100vh-68px)] grid-cols-1 overflow-hidden ${isRightPanelCollapsed ? "xl:grid-cols-[248px_minmax(0,1fr)_72px]" : "xl:grid-cols-[248px_minmax(0,1fr)_340px]"} ${isDark ? "bg-[#0b1220]" : "bg-[#f7f9fb]"}`
      },
      /* @__PURE__ */ import_react4.default.createElement(
        "input",
        {
          ref: subtitleUploadInputRef,
          type: "file",
          accept: ".srt,.vtt,text/vtt,application/x-subrip,text/plain",
          className: "hidden",
          onChange: handleSubtitleFileSelected
        }
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "input",
        {
          ref: appendVideoInputRef,
          type: "file",
          accept: "video/*",
          className: "hidden",
          onChange: handleAppendVideoSelected
        }
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "aside",
        {
          className: `hidden min-h-0 overflow-hidden border-r px-4 py-4 xl:flex xl:flex-col xl:justify-between ${isDark ? "border-[#243149] bg-[#121a2b]" : "border-[#d9dde5] bg-[#f2f4f6]"}`
        },
        /* @__PURE__ */ import_react4.default.createElement("div", { className: "space-y-5" }, /* @__PURE__ */ import_react4.default.createElement("nav", { className: "space-y-1 text-sm" }, /* @__PURE__ */ import_react4.default.createElement(
          NavLink,
          {
            to: "/drafts",
            className: navLinkClass,
            onClick: (event) => {
              if (!confirmDiscardChanges()) {
                event.preventDefault();
              }
            }
          },
          /* @__PURE__ */ import_react4.default.createElement(Files, { className: "h-4 w-4" }),
          "Drafts"
        ), /* @__PURE__ */ import_react4.default.createElement(
          NavLink,
          {
            to: "/archive",
            className: navLinkClass,
            onClick: (event) => {
              if (!confirmDiscardChanges()) {
                event.preventDefault();
              }
            }
          },
          /* @__PURE__ */ import_react4.default.createElement(FolderArchive, { className: "h-4 w-4" }),
          "Archive"
        ), /* @__PURE__ */ import_react4.default.createElement(
          NavLink,
          {
            to: "/",
            end: true,
            className: navLinkClass,
            onClick: (event) => {
              if (!confirmDiscardChanges()) {
                event.preventDefault();
              }
            }
          },
          /* @__PURE__ */ import_react4.default.createElement(Clapperboard, { className: "h-4 w-4" }),
          "Editor"
        )), /* @__PURE__ */ import_react4.default.createElement(
          "div",
          {
            className: `rounded-[20px] border px-4 py-4 ${isDark ? "border-[#243149] bg-[#0f172a]" : "border-[#e3e7ee] bg-white"}`
          },
          /* @__PURE__ */ import_react4.default.createElement(
            "p",
            {
              className: `text-[11px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}`
            },
            "Session Status"
          ),
          /* @__PURE__ */ import_react4.default.createElement("div", { className: "mt-3 space-y-3" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center justify-between text-[12px]" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#9fb0ca]" : "text-[#57657a]" }, "Video loaded"), /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#edf2ff]" : "text-[#191c1e]" }, selectedVideoFile || videoSourceUrl ? "Ready" : "Waiting")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center justify-between text-[12px]" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#9fb0ca]" : "text-[#57657a]" }, "Subtitles"), /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#edf2ff]" : "text-[#191c1e]" }, subtitleSegments.length > 0 ? `${subtitleSegments.length} loaded` : subtitleStatus === "processing" ? "Processing" : "Not added")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center justify-between text-[12px]" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#9fb0ca]" : "text-[#57657a]" }, "Silence cleanup"), /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#edf2ff]" : "text-[#191c1e]" }, silenceStatus === "processing" ? "Analyzing" : silenceStatus === "success" ? `${selectedSilenceCount}/${silenceSegments.length} selected` : "Ready")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center justify-between text-[12px]" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#9fb0ca]" : "text-[#57657a]" }, "Guided mode"), /* @__PURE__ */ import_react4.default.createElement("span", { className: isDark ? "text-[#edf2ff]" : "text-[#191c1e]" }, guidedMode ? "On" : "Off")))
        )),
        /* @__PURE__ */ import_react4.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react4.default.createElement(
          "button",
          {
            type: "button",
            className: `flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${isDark ? "border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]" : "border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]"}`
          },
          /* @__PURE__ */ import_react4.default.createElement(Save, { className: "h-4 w-4" }),
          "Save Draft"
        ), /* @__PURE__ */ import_react4.default.createElement(
          "button",
          {
            type: "button",
            className: `flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${isDark ? "border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]" : "border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]"}`
          },
          /* @__PURE__ */ import_react4.default.createElement(FolderArchive, { className: "h-4 w-4" }),
          "Archive Video"
        ), /* @__PURE__ */ import_react4.default.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              void handleExportVideo();
            },
            disabled: exportStatus === "processing" || editorStatus === "syncing" || !selectedVideoFile && !editorSessionId,
            className: "w-full rounded-xl bg-gradient-to-r from-[#003fb1] to-[#1a56db] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,63,177,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          },
          exportStatus === "processing" ? "Rendering..." : "Export Video"
        ))
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "main",
        {
          className: `min-h-0 min-w-0 overflow-y-auto overflow-x-hidden ${isDark ? "bg-[#0b1220]" : "bg-[#f7f9fb]"}`
        },
        /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto flex min-h-full w-full max-w-[1120px] flex-col px-3 py-3 xl:px-4 xl:py-4" }, /* @__PURE__ */ import_react4.default.createElement(
          "div",
          {
            className: `flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#d9dde5] bg-white"}`
          },
          /* @__PURE__ */ import_react4.default.createElement(
            VideoPreviewPanel,
            {
              ref: videoPreviewRef,
              videoUrl: videoSourceUrl ?? preloadedVideoUrl,
              subtitles: subtitleSegments,
              onLoadedMetadata: (duration) => {
                setVideoDuration(duration);
                setCutRange({
                  start: 0,
                  end: Math.max(CUT_RANGE_MIN_GAP, duration)
                });
              },
              onPlaybackStateChange: setIsPlaying,
              onTimeUpdate: setCurrentTime,
              onVideoSourceChange: setVideoSourceUrl,
              onVideoFileChange: (file) => {
                setSelectedVideoFile(file);
                resetWorkspaceForNewSource();
              }
            }
          ),
          /* @__PURE__ */ import_react4.default.createElement(
            "section",
            {
              className: `mt-auto border-t ${isDark ? "border-[#243149] bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]" : "border-[#e3e7ee] bg-[linear-gradient(180deg,#fbfcfd_0%,#f3f6f9_100%)]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto w-full max-w-[1040px] px-4 py-3" }, /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                className: `rounded-[24px] border px-4 py-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${isDark ? "border-[#243149] bg-[#0f172a]" : "border-[#d9dde5] bg-white"}`
              },
              /* @__PURE__ */ import_react4.default.createElement(
                "div",
                {
                  className: `mb-2.5 flex flex-wrap items-center justify-center gap-3 border-b pb-2.5 ${isDark ? "border-[#243149]" : "border-[#edf0f4]"}`
                },
                /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStepFrame(-1),
                    className: `flex h-8 w-8 items-center justify-center rounded-full transition ${isDark ? "bg-[#1e293b] text-[#c6d3eb] hover:bg-[#263244] hover:text-[#8bb8ff]" : "bg-[#f2f4f6] text-[#515f74] hover:bg-[#e7ebf2] hover:text-[#003fb1]"}`
                  },
                  /* @__PURE__ */ import_react4.default.createElement(SkipBack, { className: "h-3.5 w-3.5" })
                ), /* @__PURE__ */ import_react4.default.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: handleTogglePlayback,
                    className: `flex h-10 w-10 items-center justify-center rounded-full transition ${isDark ? "bg-[#1b3566] text-[#9ec5ff] hover:bg-[#234178]" : "bg-[#eef3ff] text-[#003fb1] hover:bg-[#dfe8ff]"}`
                  },
                  isPlaying ? /* @__PURE__ */ import_react4.default.createElement(Pause, { className: "h-4.5 w-4.5 fill-current" }) : /* @__PURE__ */ import_react4.default.createElement(Play, { className: "ml-0.5 h-4.5 w-4.5 fill-current" })
                ), /* @__PURE__ */ import_react4.default.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleStepFrame(1),
                    className: `flex h-8 w-8 items-center justify-center rounded-full transition ${isDark ? "bg-[#1e293b] text-[#c6d3eb] hover:bg-[#263244] hover:text-[#8bb8ff]" : "bg-[#f2f4f6] text-[#515f74] hover:bg-[#e7ebf2] hover:text-[#003fb1]"}`
                  },
                  /* @__PURE__ */ import_react4.default.createElement(SkipForward, { className: "h-3.5 w-3.5" })
                ), /* @__PURE__ */ import_react4.default.createElement(
                  "div",
                  {
                    className: `ml-1.5 text-[12px] font-semibold ${isDark ? "text-[#c6d3eb]" : "text-[#515f74]"}`
                  },
                  formatTransportClock(currentTime),
                  " /",
                  " ",
                  formatTransportClock(totalDuration)
                )),
                /* @__PURE__ */ import_react4.default.createElement(
                  "div",
                  {
                    className: `flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${isDark ? "border-[#243149] bg-[#111b2d]" : "border-[#e3e7ee] bg-[#f8fafc]"}`
                  },
                  /* @__PURE__ */ import_react4.default.createElement(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleTimelineZoom(-1),
                      disabled: timelineZoom <= 1,
                      className: `flex h-7 w-7 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "text-[#c6d3eb] hover:bg-[#182238] hover:text-[#8bb8ff]" : "text-[#515f74] hover:bg-white hover:text-[#003fb1]"}`
                    },
                    /* @__PURE__ */ import_react4.default.createElement(ZoomOut, { className: "h-3.5 w-3.5" })
                  ),
                  /* @__PURE__ */ import_react4.default.createElement(
                    "span",
                    {
                      className: `min-w-[44px] text-center text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? "text-[#8fa2c2]" : "text-[#637287]"}`
                    },
                    timelineZoom.toFixed(1),
                    "x"
                  ),
                  /* @__PURE__ */ import_react4.default.createElement(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleTimelineZoom(1),
                      disabled: timelineZoom >= 4,
                      className: `flex h-7 w-7 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "text-[#c6d3eb] hover:bg-[#182238] hover:text-[#8bb8ff]" : "text-[#515f74] hover:bg-white hover:text-[#003fb1]"}`
                    },
                    /* @__PURE__ */ import_react4.default.createElement(ZoomIn, { className: "h-3.5 w-3.5" })
                  )
                )
              ),
              /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-center justify-center gap-1.5" }, /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Cut",
                  tooltip: "Open cut mode to keep only the region between two timeline playheads.",
                  guidedMode,
                  isDark,
                  onClick: handleOpenCutPanel,
                  icon: Scissors,
                  tone: "editor"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Split",
                  tooltip: "Split the selected clip at the playhead.",
                  guidedMode,
                  isDark,
                  onClick: handleSplitAtPlayhead,
                  icon: Split,
                  tone: "editor"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Merge",
                  tooltip: "Merge the selected clips into a single clip.",
                  guidedMode,
                  isDark,
                  onClick: handleMergeWithNext,
                  icon: Clapperboard,
                  disabled: !canMergeWithNext,
                  tone: "editor"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Delete",
                  tooltip: "Delete the selected clip from the timeline.",
                  guidedMode,
                  isDark,
                  onClick: handleDeleteSelectedClip,
                  icon: Trash2,
                  disabled: !selectedSegment,
                  danger: true
                }
              ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-1 h-8 w-px rounded-full bg-[#d9dde5] dark:bg-[#31415a]" }), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Add Video",
                  tooltip: "Add another video to the end of the timeline.",
                  guidedMode,
                  isDark,
                  onClick: handleAppendVideoClick,
                  icon: Plus,
                  disabled: appendStatus === "processing" || exportStatus === "processing" || editorStatus === "syncing" || !selectedVideoFile && !videoSourceUrl && !preloadedVideoUrl,
                  tone: "workspace"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Subtitles",
                  tooltip: subtitleSegments.length > 0 ? "Open subtitles to review and edit your captions." : "Open subtitles to generate or add captions.",
                  guidedMode,
                  isDark,
                  onClick: handleOpenSubtitlesPanel,
                  icon: Captions,
                  disabled: subtitleStatus === "processing",
                  tone: "workspace"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Silencer",
                  tooltip: "Find silent parts you may want to remove.",
                  guidedMode,
                  isDark,
                  onClick: handleRemoveSilence,
                  icon: Mic,
                  disabled: silenceStatus === "processing",
                  tone: "workspace"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Scenes",
                  tooltip: "Review scene changes and split points.",
                  guidedMode,
                  isDark,
                  onClick: handleOpenScenesPanel,
                  icon: Clapperboard,
                  tone: "workspace"
                }
              ), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "AI",
                  tooltip: "Open AI tools for editing help.",
                  guidedMode,
                  isDark,
                  onClick: handleOpenAIPanel,
                  icon: Sparkles,
                  tone: "workspace"
                }
              ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-1 h-8 w-px rounded-full bg-[#d9dde5] dark:bg-[#31415a]" }), /* @__PURE__ */ import_react4.default.createElement(
                ToolbarButton,
                {
                  label: "Undo",
                  tooltip: "Undo your last change.",
                  guidedMode,
                  isDark,
                  onClick: handleUndo,
                  icon: RotateCcw,
                  disabled: history.length === 0,
                  tone: "global"
                }
              ))
            )),
            subtitleError ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto w-full max-w-[1040px] px-4 pb-4" }, /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                className: `max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]" : "border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]"}`
              },
              subtitleError
            )) : null,
            silenceError ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto w-full max-w-[1040px] px-4 pb-4" }, /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                className: `max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]" : "border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]"}`
              },
              silenceError
            )) : null,
            editorError ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto w-full max-w-[1040px] px-4 pb-4" }, /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                className: `max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]" : "border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]"}`
              },
              editorError
            )) : null,
            exportError ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto w-full max-w-[1040px] px-4 pb-4" }, /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                className: `max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]" : "border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]"}`
              },
              exportError
            )) : null,
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto w-full max-w-[1040px] px-4 pb-4" }, /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                className: `rounded-[24px] border px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${isDark ? "border-[#243149] bg-[#0f172a]" : "border-[#d9dde5] bg-white"}`
              },
              /* @__PURE__ */ import_react4.default.createElement("div", { className: "overflow-x-auto pb-1" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "relative min-w-full", style: { width: `${timelineZoom * 100}%` } }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react4.default.createElement(
                "div",
                {
                  ref: timelineTrackRef,
                  className: "relative",
                  onPointerDown: (event) => {
                    if (rightPanelView === "cut") return;
                    seekTimelineFromClientX(event.clientX);
                    setIsTimelineDragging(true);
                  }
                },
                /* @__PURE__ */ import_react4.default.createElement(
                  "div",
                  {
                    className: `relative flex min-h-[84px] items-stretch overflow-hidden rounded-2xl border ${isDark ? "border-[#2b3950] bg-[#1a2435]" : "border-[#dfe5ec] bg-[#eff3f8]"}`
                  },
                  segments.map((segment) => {
                    const duration = Math.max(0.1, segment.end - segment.start);
                    const isSelected = selectedId === segment.id;
                    const segmentFrames = getSegmentTimelineFrames(
                      timelineThumbnails,
                      segment
                    );
                    return /* @__PURE__ */ import_react4.default.createElement(
                      "button",
                      {
                        key: segment.id,
                        type: "button",
                        onPointerDown: (event) => {
                          if (rightPanelView === "cut") {
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                          }
                          event.stopPropagation();
                          const bounds = event.currentTarget.getBoundingClientRect();
                          const ratio = clamp(
                            (event.clientX - bounds.left) / bounds.width,
                            0,
                            1
                          );
                          const nextTime = segment.start + (segment.end - segment.start) * ratio;
                          setSelectedId(segment.id);
                          handleSeek(nextTime);
                          setIsTimelineDragging(true);
                        },
                        style: { flexGrow: duration, flexBasis: 0 },
                        className: `relative flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-xl border text-left transition ${isSelected ? isDark ? "border-[#8bb8ff] bg-[#1f4da0] text-white" : "border-[#003fb1] bg-[#1a56db] text-white" : isDark ? "border-[#344561] bg-[#101a2a] text-[#d6deec] hover:border-[#8bb8ff]" : "border-[#c9d5e8] bg-white text-[#233147] hover:border-[#1a56db]"}`
                      },
                      /* @__PURE__ */ import_react4.default.createElement("div", { className: "absolute inset-0" }, timelineMediaReady && segmentFrames.length > 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex h-full w-full" }, segmentFrames.map((thumbnail) => /* @__PURE__ */ import_react4.default.createElement(
                        "div",
                        {
                          key: `${segment.id}-${thumbnail.id}`,
                          className: "relative h-full flex-1 overflow-hidden border-r border-white/15 last:border-r-0"
                        },
                        /* @__PURE__ */ import_react4.default.createElement(
                          "img",
                          {
                            src: thumbnail.src,
                            alt: `Frame at ${formatClock(thumbnail.time)}`,
                            className: "h-full w-full object-cover"
                          }
                        )
                      ))) : /* @__PURE__ */ import_react4.default.createElement(
                        "div",
                        {
                          className: `h-full w-full ${isDark ? "bg-[linear-gradient(90deg,#182234_0%,#223047_100%)]" : "bg-[linear-gradient(90deg,#e7ebf0_0%,#dfe5ec_100%)]"}`
                        }
                      ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.62))]" })),
                      /* @__PURE__ */ import_react4.default.createElement("div", { className: "relative z-10 px-3 py-2" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "block truncate pl-2 text-[10px] font-bold uppercase tracking-[0.18em]" }, segment.label), /* @__PURE__ */ import_react4.default.createElement(
                        "span",
                        {
                          className: `block pl-2 text-[11px] ${isSelected ? "text-white/90" : isDark ? "text-[#d6deec]" : "text-white/95"}`
                        },
                        "Source ",
                        formatClock(segment.start),
                        " - ",
                        formatClock(segment.end)
                      ))
                    );
                  }),
                  rightPanelView !== "cut" && editedDuration > 0 && activeTimelineSegment ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "pointer-events-none absolute inset-0 z-20" }, /* @__PURE__ */ import_react4.default.createElement(
                    "span",
                    {
                      className: "absolute inset-y-1 w-0.5 -translate-x-1/2 bg-[#de34ab]",
                      style: { left: `${timelinePlayheadRatio * 100}%` }
                    }
                  ), /* @__PURE__ */ import_react4.default.createElement(
                    "span",
                    {
                      className: "absolute top-1 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[8px] border-x-transparent border-b-[#de34ab]",
                      style: { left: `${timelinePlayheadRatio * 100}%` }
                    }
                  ), /* @__PURE__ */ import_react4.default.createElement(
                    "span",
                    {
                      className: "absolute bottom-7 rounded-full bg-[#111827] px-2 py-0.5 text-[9px] font-mono text-white shadow-sm",
                      style: getTimelineTimestampStyle(timelinePlayheadRatio)
                    },
                    formatEditableTimestamp(timelinePlayheadEditedTime)
                  )) : null,
                  rightPanelView === "cut" && editedDuration > 0 ? /* @__PURE__ */ import_react4.default.createElement(
                    "div",
                    {
                      className: "absolute inset-0 z-30",
                      onPointerDown: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        beginCutTimelineInteraction(event.clientX);
                      }
                    },
                    /* @__PURE__ */ import_react4.default.createElement(
                      "div",
                      {
                        className: "absolute inset-y-0 left-0 bg-[#0b1220]/30",
                        style: { width: `${cutRangeStartRatio * 100}%` }
                      }
                    ),
                    /* @__PURE__ */ import_react4.default.createElement(
                      "div",
                      {
                        className: "absolute inset-y-0 bg-[#de34ab]/14",
                        style: {
                          left: `${cutRangeStartRatio * 100}%`,
                          width: `${Math.max(
                            0,
                            (cutRangeEndRatio - cutRangeStartRatio) * 100
                          )}%`
                        }
                      }
                    ),
                    /* @__PURE__ */ import_react4.default.createElement(
                      "div",
                      {
                        className: "absolute inset-y-0 right-0 bg-[#0b1220]/30",
                        style: {
                          width: `${Math.max(0, (1 - cutRangeEndRatio) * 100)}%`
                        }
                      }
                    ),
                    [
                      ["start", normalizedCutRange.start],
                      ["end", normalizedCutRange.end]
                    ].map(([handle, value]) => {
                      const handleRatio = handle === "start" ? cutRangeStartRatio : cutRangeEndRatio;
                      return /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, { key: handle }, /* @__PURE__ */ import_react4.default.createElement(
                        "button",
                        {
                          type: "button",
                          onPointerDown: (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setActiveCutHandle(handle);
                            updateCutHandleFromClientX(handle, event.clientX);
                          },
                          className: "absolute inset-y-0 z-40 -translate-x-1/2 cursor-ew-resize",
                          style: { left: `${handleRatio * 100}%` },
                          "aria-label": `${handle} cut playhead`
                        },
                        /* @__PURE__ */ import_react4.default.createElement("span", { className: "absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[#de34ab]" }),
                        /* @__PURE__ */ import_react4.default.createElement("span", { className: "absolute bottom-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#de34ab] shadow-[0_8px_20px_rgba(222,52,171,0.24)]" })
                      ), /* @__PURE__ */ import_react4.default.createElement(
                        "span",
                        {
                          className: "pointer-events-none absolute bottom-7 z-40 rounded-full bg-[#111827] px-2 py-0.5 text-[9px] font-mono text-white shadow-sm",
                          style: getTimelineTimestampStyle(handleRatio)
                        },
                        formatEditableTimestamp(value)
                      ));
                    })
                  ) : null
                )
              )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "pt-1" }, /* @__PURE__ */ import_react4.default.createElement(
                "div",
                {
                  className: `mb-1 flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#8fa2c2]" : "text-[#637287]"}`
                },
                /* @__PURE__ */ import_react4.default.createElement("span", null, segments.length, " clip", segments.length === 1 ? "" : "s"),
                /* @__PURE__ */ import_react4.default.createElement("span", null, editorStatus === "syncing" ? "Syncing editor" : editorSessionId ? "Editor session active" : selectedVideoFile ? "Ready to create editor session" : "Upload a local video to edit")
              ), /* @__PURE__ */ import_react4.default.createElement(
                "div",
                {
                  className: `mb-1 flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#8fa2c2]" : "text-[#637287]"}`
                },
                /* @__PURE__ */ import_react4.default.createElement("span", null, "Edited Timeline"),
                /* @__PURE__ */ import_react4.default.createElement("span", null, formatClock(editedDuration))
              ), /* @__PURE__ */ import_react4.default.createElement(
                "div",
                {
                  className: `flex justify-between px-2 text-[9px] font-mono ${isDark ? "text-[#8fa2c2]" : "text-[#737686]"}`
                },
                timeMarkers.map((marker) => /* @__PURE__ */ import_react4.default.createElement("span", { key: marker }, marker))
              ))))
            ))
          )
        ))
      ),
      /* @__PURE__ */ import_react4.default.createElement(
        "aside",
        {
          className: `hidden min-h-0 overflow-hidden border-l px-4 py-4 xl:flex xl:flex-col ${isDark ? "border-[#243149] bg-[#121a2b]" : "border-[#d9dde5] bg-white"}`
        },
        /* @__PURE__ */ import_react4.default.createElement("div", { className: "mb-3 flex items-center justify-between gap-2" }, !isRightPanelCollapsed ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-2" }, rightPanelView === "cut" ? /* @__PURE__ */ import_react4.default.createElement(Scissors, { className: `h-4 w-4 ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}` }) : rightPanelView === "silence" ? /* @__PURE__ */ import_react4.default.createElement(Mic, { className: `h-4 w-4 ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}` }) : rightPanelView === "scenes" ? /* @__PURE__ */ import_react4.default.createElement(Clapperboard, { className: `h-4 w-4 ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}` }) : rightPanelView === "subtitles" ? /* @__PURE__ */ import_react4.default.createElement(Captions, { className: `h-4 w-4 ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}` }) : /* @__PURE__ */ import_react4.default.createElement(Sparkles, { className: `h-4 w-4 ${isDark ? "text-[#8bb8ff]" : "text-[#003fb1]"}` }), /* @__PURE__ */ import_react4.default.createElement(
          "h2",
          {
            className: `text-[12px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#c6d3eb]" : "text-[#515f74]"}`
          },
          rightPanelView === "cut" ? "Cut Workspace" : rightPanelView === "silence" ? "Silence Review" : rightPanelView === "scenes" ? "Scene Review" : rightPanelView === "subtitles" ? "Subtitles" : "AI Workspace"
        )) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#003fb1] dark:bg-[#1b3566] dark:text-[#9ec5ff]" }, /* @__PURE__ */ import_react4.default.createElement(Sparkles, { className: "h-4 w-4" })), /* @__PURE__ */ import_react4.default.createElement(
          "button",
          {
            type: "button",
            onClick: () => setIsRightPanelCollapsed((prev) => !prev),
            className: `flex h-10 w-10 items-center justify-center rounded-2xl border transition ${isDark ? "border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:bg-[#182238]" : "border-[#d9dde5] bg-[#fbfcfd] text-[#515f74] hover:bg-white"}`,
            title: isRightPanelCollapsed ? "Expand right panel" : "Collapse right panel"
          },
          isRightPanelCollapsed ? /* @__PURE__ */ import_react4.default.createElement(PanelRightOpen, { className: "h-4 w-4" }) : /* @__PURE__ */ import_react4.default.createElement(PanelRightClose, { className: "h-4 w-4" })
        )),
        isRightPanelCollapsed ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col items-center justify-between py-2" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "writing-mode-vertical text-center [writing-mode:vertical-rl]" }, /* @__PURE__ */ import_react4.default.createElement(
          "span",
          {
            className: `text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-[#8fa2c2]" : "text-[#737686]"}`
          },
          rightPanelView === "cut" ? "Cut Workspace" : rightPanelView === "silence" ? "Silence Review" : rightPanelView === "scenes" ? "Scene Review" : rightPanelView === "subtitles" ? "Subtitles" : "AI Workspace"
        )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "space-y-2" }, (rightPanelView === "cut" ? ["Cut", "Keep", "Range"] : rightPanelView === "silence" ? ["Silence", "Review", "Timeline"] : rightPanelView === "scenes" ? ["Scenes", "Review", "Split"] : rightPanelView === "subtitles" ? ["Subtitles", "Review", "Export"] : ["Chapters", "Trim", "Captions"]).map((item) => /* @__PURE__ */ import_react4.default.createElement(
          "div",
          {
            key: item,
            className: `rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${isDark ? "bg-[#111827] text-[#8fa2c2]" : "bg-[#f2f4f6] text-[#637287]"}`
          },
          item
        )))) : /* @__PURE__ */ import_react4.default.createElement(
          "div",
          {
            className: `flex min-h-0 flex-1 flex-col rounded-[22px] border p-4 ${isDark ? "border-[#31415a] bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]" : "border-[#d9dde5] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fb_100%)]"}`
          },
          rightPanelView === "cut" ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border p-2 ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#e3e7ee] bg-[#fbfcfd]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleCutVideo,
                disabled: segments.length === 0 || editedDuration <= CUT_RANGE_MIN_GAP,
                className: "flex h-9 w-full items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Cut Video"
            )
          ), /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#243149] bg-[#111827] text-[#9fb0ca]" : "border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]"}`
            },
            "Drag the two playheads on the timeline to keep only the section between them. Everything outside that range will be removed from the edit."
          ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border px-4 py-3 ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#e3e7ee] bg-[#fbfcfd]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement(
              "span",
              {
                className: `block text-[9px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-[#8fa2c2]" : "text-[#637287]"}`
              },
              "Keep From"
            ),
            /* @__PURE__ */ import_react4.default.createElement(
              "span",
              {
                className: `mt-2 block text-[14px] font-semibold ${isDark ? "text-[#e5edf9]" : "text-[#233147]"}`
              },
              formatEditableTimestamp(normalizedCutRange.start)
            )
          ), /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border px-4 py-3 ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#e3e7ee] bg-[#fbfcfd]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement(
              "span",
              {
                className: `block text-[9px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-[#8fa2c2]" : "text-[#637287]"}`
              },
              "Keep To"
            ),
            /* @__PURE__ */ import_react4.default.createElement(
              "span",
              {
                className: `mt-2 block text-[14px] font-semibold ${isDark ? "text-[#e5edf9]" : "text-[#233147]"}`
              },
              formatEditableTimestamp(normalizedCutRange.end)
            )
          )), /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mt-4 rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${isDark ? "border-[#31415a] bg-[#111827] text-[#8fa2c2]" : "border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]"}`
            },
            "Remaining edited length:",
            " ",
            formatEditableTimestamp(
              Math.max(
                CUT_RANGE_MIN_GAP,
                normalizedCutRange.end - normalizedCutRange.start
              )
            )
          )) : rightPanelView === "silence" ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border p-2 ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#e3e7ee] bg-[#fbfcfd]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: () => {
                  void handleRemoveSilence();
                },
                disabled: silenceStatus === "processing",
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Detect Again"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleSelectAllSilences,
                disabled: silenceReviewItems.length === 0,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Select All"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleClearSelectedSilences,
                disabled: selectedSilenceSegmentKeys.length === 0,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Clear"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleApplySelectedSilences,
                disabled: selectedSilenceSegmentKeys.length === 0,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Apply"
            ))
          ), silenceError ? /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]" : "border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]"}`
            },
            silenceError
          ) : null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, silenceStatus === "processing" ? /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border px-5 py-5 text-[12px] leading-6 ${isDark ? "border-[#243149] bg-[#111827] text-[#9fb0ca]" : "border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]"}`
            },
            "Analyzing the uploaded video for long silence ranges..."
          ) : silenceSegments.length === 0 ? /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${isDark ? "border-[#31415a] bg-[#111827] text-[#8fa2c2]" : "border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]"}`
            },
            "No silence ranges to review yet. Upload a local video and run Remove silence to populate this panel."
          ) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "space-y-3 overflow-y-auto pr-1" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#243149] bg-[#111827] text-[#9fb0ca]" : "border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ import_react4.default.createElement("span", null, selectedSilenceCount, " of ", silenceReviewItems.length, " selected"), /* @__PURE__ */ import_react4.default.createElement("span", null, stagedSilenceCount > 0 ? `${stagedSilenceCount} staged for future removal` : "Analysis only, not applied yet"))
          ), silenceReviewItems.map((segment) => {
            const isSelected = selectedSilenceSegmentKeys.includes(segment.key);
            const isStaged = stagedSilenceSegmentKeys.includes(segment.key);
            return /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                key: segment.key,
                className: `rounded-2xl border p-4 shadow-sm transition ${isSelected ? isDark ? "border-[#4b6388] bg-[#131f33]" : "border-[#7aa4ff] bg-[#f6f9ff]" : isDark ? "border-[#31415a] bg-[#111827]" : "border-[#d9dde5] bg-[#fbfcfd]"}`
              },
              /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
                "span",
                {
                  className: `rounded-full px-2.5 py-1 text-[10px] font-mono ${isDark ? "bg-[#1e293b] text-[#c6d3eb]" : "bg-[#f2f4f6] text-[#515f74]"}`
                },
                formatEditableTimestamp(segment.start),
                " -",
                " ",
                formatEditableTimestamp(segment.end)
              ), /* @__PURE__ */ import_react4.default.createElement(
                "span",
                {
                  className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? "bg-[#24141a] text-[#ffb8c0]" : "bg-[#fff3f4] text-[#a23535]"}`
                },
                "Silence ",
                segment.index + 1
              ), isStaged ? /* @__PURE__ */ import_react4.default.createElement(
                "span",
                {
                  className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? "bg-[#1b3566] text-[#9ec5ff]" : "bg-[#eef3ff] text-[#003fb1]"}`
                },
                "Staged"
              ) : null), /* @__PURE__ */ import_react4.default.createElement(
                "p",
                {
                  className: `mt-2 text-[12px] leading-5 ${isDark ? "text-[#c6d3eb]" : "text-[#515f74]"}`
                },
                "Duration: ",
                (segment.end - segment.start).toFixed(1),
                "s",
                " \xB7 ",
                isSelected ? "Selected for future removal" : "Excluded from the staged set"
              )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => handleToggleSilenceSelection(segment.key),
                  className: `rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${isSelected ? isDark ? "border-[#4b6388] bg-[#182238] text-[#9ec5ff]" : "border-[#7aa4ff] bg-[#eef3ff] text-[#003fb1]" : isDark ? "border-[#31415a] text-[#c6d3eb]" : "border-[#d9dde5] text-[#515f74]"}`
                },
                isSelected ? "Selected" : "Select"
              ), /* @__PURE__ */ import_react4.default.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => handleSeek(segment.start),
                  className: "rounded-full bg-[#003fb1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                },
                "Go to"
              )))
            );
          })))) : rightPanelView === "scenes" ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border p-2 ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#e3e7ee] bg-[#fbfcfd]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleOpenScenesPanel,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition"
              },
              "Detect Scenes"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                disabled: true,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Add Scene"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                disabled: true,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Edit Scenes"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                disabled: true,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Implement"
            ))
          ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#243149] bg-[#111827] text-[#9fb0ca]" : "border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]"}`
            },
            sceneStatus === "pending" ? "Scene review UI is ready. Once backend detection is implemented, detected scene timestamps will appear here for review, editing, and split actions." : "Open Detect scenes to start reviewing scene boundaries."
          ), /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${isDark ? "border-[#31415a] bg-[#111827] text-[#8fa2c2]" : "border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement("p", null, "No scene timestamps are available yet."),
            /* @__PURE__ */ import_react4.default.createElement("p", { className: "mt-3" }, "This panel will eventually show:"),
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "mt-3 space-y-3" }, [
              "Detected scene time ranges with Go to controls",
              "Editable scene labels and boundary timestamps",
              "An Implement action to split the video by scene boundaries"
            ].map((item) => /* @__PURE__ */ import_react4.default.createElement(
              "div",
              {
                key: item,
                className: `rounded-2xl border px-4 py-3 ${isDark ? "border-[#243149] bg-[#0f172a]" : "border-[#e3e7ee] bg-white"}`
              },
              item
            )))
          ))) : rightPanelView === "subtitles" ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border p-2 ${isDark ? "border-[#243149] bg-[#111827]" : "border-[#e3e7ee] bg-[#fbfcfd]"}`
            },
            subtitleSegments.length === 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleSubtitleUploadClick,
                disabled: subtitleEntryStatus !== "idle",
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Add Subtitles"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: () => {
                  void handleGenerateSubtitlesFromPanel();
                },
                disabled: subtitleEntryStatus !== "idle",
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Generate"
            )) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleSubtitleUploadClick,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition"
              },
              "Replace"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleRemoveSubtitles,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition"
              },
              "Remove"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: () => handleExportSubtitle("srt"),
                disabled: subtitleSegments.length === 0,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Export SRT"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: () => handleExportSubtitle("vtt"),
                disabled: subtitleSegments.length === 0,
                className: "flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              },
              "Export VTT"
            ))
          ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, subtitleError ? /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]" : "border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]"}`
            },
            subtitleError
          ) : null, subtitleSegments.length === 0 ? /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${isDark ? "border-[#243149] bg-[#111827] text-[#9fb0ca]" : "border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]"}`
            },
            subtitleEntryStatus === "uploading" ? "Uploading subtitles into the current edit..." : subtitleEntryStatus === "generating" ? "Generating subtitles from the uploaded video..." : subtitleEntryStatus === "success" ? "Subtitles are ready." : "Choose Generate to create subtitles from the current video, or Add Subtitles to import an .srt or .vtt file."
          ), /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${isDark ? "border-[#31415a] bg-[#111827] text-[#8fa2c2]" : "border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]"}`
            },
            "No subtitles are available yet. Use this panel to generate a new subtitle pass or add an existing subtitle file without leaving the editor."
          )) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "space-y-3 overflow-y-auto pr-1" }, subtitleSegments.map((segment) => /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              key: segment.id,
              className: `rounded-2xl border p-4 shadow-sm ${isDark ? "border-[#31415a] bg-[#111827]" : "border-[#d9dde5] bg-[#fbfcfd]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-center gap-3" }, /* @__PURE__ */ import_react4.default.createElement(
              "span",
              {
                className: `rounded-full px-2.5 py-1 text-[10px] font-mono ${isDark ? "bg-[#1e293b] text-[#c6d3eb]" : "bg-[#f2f4f6] text-[#515f74]"}`
              },
              formatClock(segment.start),
              " - ",
              formatClock(segment.end)
            ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ import_react4.default.createElement("label", { className: "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#8fa2c2]" }, /* @__PURE__ */ import_react4.default.createElement("span", null, "Start"), /* @__PURE__ */ import_react4.default.createElement(
              "input",
              {
                type: "text",
                inputMode: "decimal",
                value: getSubtitleTimingDraft(segment, "start"),
                onChange: (event) => handleSubtitleTimingDraftChange(
                  segment.id,
                  "start",
                  event.target.value
                ),
                onBlur: () => handleSubtitleTimingDraftCommit(segment, "start"),
                onKeyDown: (event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                },
                className: `w-20 rounded-full border px-2 py-1 text-[11px] font-medium outline-none transition ${isDark ? "border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa]" : "border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db]"}`
              }
            )), /* @__PURE__ */ import_react4.default.createElement("label", { className: "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#8fa2c2]" }, /* @__PURE__ */ import_react4.default.createElement("span", null, "End"), /* @__PURE__ */ import_react4.default.createElement(
              "input",
              {
                type: "text",
                inputMode: "decimal",
                value: getSubtitleTimingDraft(segment, "end"),
                onChange: (event) => handleSubtitleTimingDraftChange(
                  segment.id,
                  "end",
                  event.target.value
                ),
                onBlur: () => handleSubtitleTimingDraftCommit(segment, "end"),
                onKeyDown: (event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                },
                className: `w-20 rounded-full border px-2 py-1 text-[11px] font-medium outline-none transition ${isDark ? "border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa]" : "border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db]"}`
              }
            )))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: () => handleSeek(segment.start),
                className: "rounded-full bg-[#003fb1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
              },
              "Go to"
            ), /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: () => handleDeleteSubtitle(segment.id),
                className: `rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? "border-[#6f3a45] text-[#ff8f9a]" : "border-[#f0b8b8] text-[#a23535]"}`
              },
              "Delete"
            ))),
            /* @__PURE__ */ import_react4.default.createElement(
              "textarea",
              {
                value: segment.text,
                onChange: (event) => handleUpdateSubtitle({
                  ...segment,
                  text: event.target.value
                }),
                className: `mt-3 min-h-[88px] w-full resize-none rounded-2xl border px-3 py-3 text-[12px] leading-5 outline-none transition ${isDark ? "border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa] focus:bg-[#111827]" : "border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db] focus:bg-white"}`
              }
            )
          ))))) : /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "mb-4 flex items-center gap-3" }, /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-[#1b3566] text-[#9ec5ff]" : "bg-[#eef3ff] text-[#003fb1]"}`
            },
            /* @__PURE__ */ import_react4.default.createElement(Send, { className: "h-5 w-5" })
          )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "mb-4 flex flex-wrap gap-2" }, AI_QUICK_ACTIONS.map((item) => /* @__PURE__ */ import_react4.default.createElement(
            "button",
            {
              key: item,
              type: "button",
              onClick: () => setAiPromptDraft(item),
              className: `rounded-full border px-3 py-2 text-left text-[12px] transition ${isDark ? "border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:border-[#4b6388] hover:bg-[#131f33]" : "border-[#d9dde5] bg-white text-[#515f74] hover:border-[#7aa4ff] hover:bg-[#f6f9ff]"}`
            },
            item
          ))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex-1 space-y-3 overflow-y-auto pr-1" }, aiMessages.map((message) => /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              key: message.id,
              className: `max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-5 ${message.role === "user" ? isDark ? "ml-auto bg-[#1b3566] text-[#edf2ff]" : "ml-auto bg-[#eef3ff] text-[#003fb1]" : isDark ? "bg-[#111827] text-[#c6d3eb]" : "bg-white text-[#515f74]"}`
            },
            message.text
          ))), /* @__PURE__ */ import_react4.default.createElement(
            "div",
            {
              className: `mt-4 flex items-end gap-2 rounded-2xl border px-3 py-3 ${isDark ? "border-[#31415a] bg-[#111827]" : "border-[#d9dde5] bg-white"}`
            },
            /* @__PURE__ */ import_react4.default.createElement(
              "textarea",
              {
                value: aiPromptDraft,
                onChange: (event) => setAiPromptDraft(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendAIPrompt();
                  }
                },
                placeholder: "Ask AI to edit...",
                className: `min-h-[72px] flex-1 resize-none bg-transparent text-[12px] leading-5 outline-none ${isDark ? "text-[#edf2ff] placeholder:text-[#71839d]" : "text-[#191c1e] placeholder:text-[#9aa3b2]"}`
              }
            ),
            /* @__PURE__ */ import_react4.default.createElement(
              "button",
              {
                type: "button",
                onClick: handleSendAIPrompt,
                disabled: aiPromptDraft.trim().length === 0,
                className: `flex h-11 w-11 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-[#1b3566] text-[#edf2ff] hover:bg-[#234178]" : "bg-[#003fb1] text-white hover:bg-[#1a56db]"}`,
                title: "Send AI prompt"
              },
              /* @__PURE__ */ import_react4.default.createElement(Send, { className: "h-4 w-4" })
            )
          )))
        )
      )
    )
  );
}
export {
  HomePage as default
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/bell.js:
lucide-react/dist/esm/icons/captions.js:
lucide-react/dist/esm/icons/circle-help.js:
lucide-react/dist/esm/icons/clapperboard.js:
lucide-react/dist/esm/icons/files.js:
lucide-react/dist/esm/icons/folder-archive.js:
lucide-react/dist/esm/icons/mic.js:
lucide-react/dist/esm/icons/moon.js:
lucide-react/dist/esm/icons/panel-right-close.js:
lucide-react/dist/esm/icons/panel-right-open.js:
lucide-react/dist/esm/icons/pause.js:
lucide-react/dist/esm/icons/play.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/rotate-ccw.js:
lucide-react/dist/esm/icons/save.js:
lucide-react/dist/esm/icons/scissors.js:
lucide-react/dist/esm/icons/send.js:
lucide-react/dist/esm/icons/skip-back.js:
lucide-react/dist/esm/icons/skip-forward.js:
lucide-react/dist/esm/icons/sparkles.js:
lucide-react/dist/esm/icons/split.js:
lucide-react/dist/esm/icons/sun.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/upload.js:
lucide-react/dist/esm/icons/zoom-in.js:
lucide-react/dist/esm/icons/zoom-out.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.503.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

react-router/dist/development/chunk-UVKPFVEO.mjs:
react-router/dist/development/index.mjs:
  (**
   * react-router v7.13.2
   *
   * Copyright (c) Remix Software Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE.md file in the root directory of this source tree.
   *
   * @license MIT
   *)
*/
