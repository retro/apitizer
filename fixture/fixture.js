/*!
 * CanJS - 2.1.1
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Fri, 06 Jun 2014 22:21:43 GMT
 * Licensed MIT
 * Includes: can/util/object/object.js,can/util/fixture/fixture.js
 * Download from: http://bitbuilder.herokuapp.com/can.custom.js?configuration=jquery&plugins=can%2Futil%2Fobject%2Fobject.js&plugins=can%2Futil%2Ffixture%2Ffixture.js
 */
(function(undefined) {

    var can = {};
    // ## can/util/can.js
    var __m4 = (function() {

        // An empty function useful for where you need a dummy callback.
        can.k = function() {};

        can.isDeferred = function(obj) {
            var isFunction = this.isFunction;
            // Returns `true` if something looks like a deferred.
            return obj && isFunction(obj.then) && isFunction(obj.pipe);
        };

        var cid = 0;
        can.cid = function(object, name) {
            if (!object._cid) {
                cid++;
                object._cid = (name || '') + cid;
            }
            return object._cid;
        };
        can.VERSION = '@EDGE';

        can.simpleExtend = function(d, s) {
            for (var prop in s) {
                d[prop] = s[prop];
            }
            return d;
        };

        can.frag = function(item) {
            var frag;
            if (!item || typeof item === "string") {
                frag = can.buildFragment(item == null ? "" : "" + item, document.body);
                // If we have an empty frag...
                if (!frag.childNodes.length) {
                    frag.appendChild(document.createTextNode(''));
                }
                return frag;
            } else if (item.nodeType === 11) {
                return item;
            } else if (typeof item.nodeType === "number") {
                frag = document.createDocumentFragment();
                frag.appendChild(item);
                return frag;
            } else if (typeof item.length === "number") {
                frag = document.createDocumentFragment();
                can.each(item, function(item) {
                    frag.appendChild(can.frag(item));
                });
                return frag;
            } else {
                frag = can.buildFragment("" + item, document.body);
                // If we have an empty frag...
                if (!frag.childNodes.length) {
                    frag.appendChild(document.createTextNode(''));
                }
                return frag;
            }
        };

        // this is here in case can.compute hasn't loaded
        can.__reading = function() {};

        return can;
    })();

    // ## can/util/attr/attr.js
    var __m5 = (function(can) {

        // Acts as a polyfill for setImmediate which only works in IE 10+. Needed to make
        // the triggering of `attributes` event async.
        var setImmediate = window.setImmediate || function(cb) {
                return setTimeout(cb, 0);
            },
            attr = {
                // This property lets us know if the browser supports mutation observers.
                // If they are supported then that will be setup in can/util/jquery and those native events will be used to inform observers of attribute changes.
                // Otherwise this module handles triggering an `attributes` event on the element.
                MutationObserver: window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,


                map: {
                    "class": "className",
                    "value": "value",
                    "innerText": "innerText",
                    "textContent": "textContent",
                    "checked": true,
                    "disabled": true,
                    "readonly": true,
                    "required": true,
                    // For the `src` attribute we are using a setter function to prevent values such as an empty string or null from being set.
                    // An `img` tag attempts to fetch the `src` when it is set, so we need to prevent that from happening by removing the attribute instead.
                    src: function(el, val) {
                        if (val == null || val === "") {
                            el.removeAttribute("src");
                            return null;
                        } else {
                            el.setAttribute("src", val);
                            return val;
                        }
                    },
                    style: function(el, val) {
                        return el.style.cssText = val || "";
                    }
                },
                // These are elements whos default value we should set.
                defaultValue: ["input", "textarea"],
                // ## attr.set
                // Set the value an attribute on an element.
                set: function(el, attrName, val) {
                    var oldValue;
                    // In order to later trigger an event we need to compare the new value to the old value, so here we go ahead and retrieve the old value for browsers that don't have native MutationObservers.
                    if (!attr.MutationObserver) {
                        oldValue = attr.get(el, attrName);
                    }

                    var tagName = el.nodeName.toString()
                        .toLowerCase(),
                        prop = attr.map[attrName],
                        newValue;

                    // Using the property of `attr.map`, go through and check if the property is a function, and if so call it. Then check if the property is `true`, and if so set the value to `true`, also making sure to set `defaultChecked` to `true` for elements of `attr.defaultValue`. We always set the value to true because for these boolean properties, setting them to false would be the same as removing the attribute.
                    // For all other attributes use `setAttribute` to set the new value.
                    if (typeof prop === "function") {
                        newValue = prop(el, val);
                    } else if (prop === true) {
                        newValue = el[attrName] = true;

                        if (attrName === "checked" && el.type === "radio") {
                            if (can.inArray(tagName, attr.defaultValue) >= 0) {
                                el.defaultChecked = true;
                            }
                        }

                    } else if (prop) {
                        newValue = el[prop] = val;
                        if (prop === "value" && can.inArray(tagName, attr.defaultValue) >= 0) {
                            el.defaultValue = val;
                        }
                    } else {
                        el.setAttribute(attrName, val);
                        newValue = val;
                    }

                    // Now that the value has been set, for browsers without MutationObservers, check to see that value has changed and if so trigger the "attributes" event on the element.
                    if (!attr.MutationObserver && newValue !== oldValue) {
                        attr.trigger(el, attrName, oldValue);
                    }
                },
                // ## attr.trigger
                // Used to trigger an "attributes" event on an element. Checks to make sure that someone is listening for the event and then queues a function to be called asynchronously using `setImmediate.
                trigger: function(el, attrName, oldValue) {
                    if (can.data(can.$(el), "canHasAttributesBindings")) {
                        return setImmediate(function() {
                            can.trigger(el, {
                                    type: "attributes",
                                    attributeName: attrName,
                                    target: el,
                                    oldValue: oldValue,
                                    bubbles: false
                                }, []);
                        });
                    }
                },
                // ## attr.get
                // Gets the value of an attribute. First checks to see if the property is a string on `attr.map` and if so returns the value from the element's property. Otherwise uses `getAttribute` to retrieve the value.
                get: function(el, attrName) {
                    var prop = attr.map[attrName];
                    if (typeof prop === "string" && el[prop]) {
                        return el[prop];
                    }

                    return el.getAttribute(attrName);
                },
                // ## attr.remove
                // Removes an attribute from an element. Works by using the `attr.map` to see if the attribute is a special type of property. If the property is a function then the fuction is called with `undefined` as the value. If the property is `true` then the attribute is set to false. If the property is a string then the attribute is set to an empty string. Otherwise `removeAttribute` is used.
                // If the attribute previously had a value and the browser doesn't support MutationObservers we then trigger an "attributes" event.
                remove: function(el, attrName) {
                    var oldValue;
                    if (!attr.MutationObserver) {
                        oldValue = attr.get(el, attrName);
                    }

                    var setter = attr.map[attrName];
                    if (typeof setter === "function") {
                        setter(el, undefined);
                    }
                    if (setter === true) {
                        el[attrName] = false;
                    } else if (typeof setter === "string") {
                        el[setter] = "";
                    } else {
                        el.removeAttribute(attrName);
                    }
                    if (!attr.MutationObserver && oldValue != null) {
                        attr.trigger(el, attrName, oldValue);
                    }

                },
                // ## attr.has
                // Checks if an element contains an attribute.
                // For browsers that support `hasAttribute`, creates a function that calls hasAttribute, otherwise creates a function that uses `getAttribute` to check that the attribute is not null.
                has: (function() {
                    var el = document.createElement('div');
                    if (el.hasAttribute) {
                        return function(el, name) {
                            return el.hasAttribute(name);
                        };
                    } else {
                        return function(el, name) {
                            return el.getAttribute(name) !== null;
                        };
                    }
                })()
            };

        return attr;

    })(__m4);

    // ## can/event/event.js
    var __m6 = (function(can) {
        // ## can.event.addEvent
        // Adds a basic event listener to an object.
        // This consists of storing a cache of event listeners on each object,
        // that are iterated through later when events are dispatched.

        can.addEvent = function(event, handler) {
            // Initialize event cache.
            var allEvents = this.__bindEvents || (this.__bindEvents = {}),
                eventList = allEvents[event] || (allEvents[event] = []);

            // Add the event
            eventList.push({
                    handler: handler,
                    name: event
                });
            return this;
        };

        // ## can.event.listenTo
        // Listens to an event without know how bind is implemented.
        // The primary use for this is to listen to another's objects event while 
        // tracking events on the local object (similar to namespacing).
        // The API was heavily influenced by BackboneJS: http://backbonejs.org/

        can.listenTo = function(other, event, handler) {
            // Initialize event cache
            var idedEvents = this.__listenToEvents;
            if (!idedEvents) {
                idedEvents = this.__listenToEvents = {};
            }

            // Identify the other object
            var otherId = can.cid(other);
            var othersEvents = idedEvents[otherId];

            // Create a local event cache
            if (!othersEvents) {
                othersEvents = idedEvents[otherId] = {
                    obj: other,
                    events: {}
                };
            }
            var eventsEvents = othersEvents.events[event];
            if (!eventsEvents) {
                eventsEvents = othersEvents.events[event] = [];
            }

            // Add the event, both locally and to the other object
            eventsEvents.push(handler);
            can.bind.call(other, event, handler);
        };

        // ## can.event.stopListening
        // Stops listening for events on other objects

        can.stopListening = function(other, event, handler) {
            var idedEvents = this.__listenToEvents,
                iterIdedEvents = idedEvents,
                i = 0;
            if (!idedEvents) {
                return this;
            }
            if (other) {
                var othercid = can.cid(other);
                (iterIdedEvents = {})[othercid] = idedEvents[othercid];
                // you might be trying to listen to something that is not there
                if (!idedEvents[othercid]) {
                    return this;
                }
            }

            // Clean up events on the other object
            for (var cid in iterIdedEvents) {
                var othersEvents = iterIdedEvents[cid],
                    eventsEvents;
                other = idedEvents[cid].obj;

                // Find the cache of events
                if (!event) {
                    eventsEvents = othersEvents.events;
                } else {
                    (eventsEvents = {})[event] = othersEvents.events[event];
                }

                // Unbind event handlers, both locally and on the other object
                for (var eventName in eventsEvents) {
                    var handlers = eventsEvents[eventName] || [];
                    i = 0;
                    while (i < handlers.length) {
                        if (handler && handler === handlers[i] || !handler) {
                            can.unbind.call(other, eventName, handlers[i]);
                            handlers.splice(i, 1);
                        } else {
                            i++;
                        }
                    }
                    // no more handlers?
                    if (!handlers.length) {
                        delete othersEvents.events[eventName];
                    }
                }
                if (can.isEmptyObject(othersEvents.events)) {
                    delete idedEvents[cid];
                }
            }
            return this;
        };

        // ## can.event.removeEvent
        // Removes a basic event listener from an object.
        // This removes event handlers from the cache of listened events.

        can.removeEvent = function(event, fn, __validate) {
            if (!this.__bindEvents) {
                return this;
            }
            var events = this.__bindEvents[event] || [],
                i = 0,
                ev, isFunction = typeof fn === 'function';
            while (i < events.length) {
                ev = events[i];
                // Determine whether this event handler is "equivalent" to the one requested
                // Generally this requires the same event/function, but a validation function 
                // can be included for extra conditions. This is used in some plugins like `can/event/namespace`.
                if (__validate ? __validate(ev, event, fn) : isFunction && ev.handler === fn || !isFunction && (ev.cid === fn || !fn)) {
                    events.splice(i, 1);
                } else {
                    i++;
                }
            }
            return this;
        };

        // ## can.event.dispatch
        // Dispatches/triggers a basic event on an object.

        can.dispatch = function(event, args) {
            var events = this.__bindEvents;
            if (!events) {
                return;
            }

            // Initialize the event object
            if (typeof event === 'string') {
                event = {
                    type: event
                };
            }

            // Grab event listeners
            var eventName = event.type,
                handlers = (events[eventName] || []).slice(0);

            // Execute handlers listening for this event.
            args = [event].concat(args || []);
            for (var i = 0, len = handlers.length; i < len; i++) {
                handlers[i].handler.apply(this, args);
            }

            return event;
        };

        // ## can.event.one
        // Adds a basic event listener that listens to an event once and only once.

        can.one = function(event, handler) {
            // Unbind the listener after it has been executed
            var one = function() {
                can.unbind.call(this, event, one);
                return handler.apply(this, arguments);
            };

            // Bind the altered listener
            can.bind.call(this, event, one);
            return this;
        };

        // ## can.event
        // Create and export the `can.event` mixin
        can.event = {
            // Event method aliases

            on: function() {
                if (arguments.length === 0 && can.Control && this instanceof can.Control) {
                    return can.Control.prototype.on.call(this);
                } else {
                    return can.addEvent.apply(this, arguments);
                }
            },


            off: function() {
                if (arguments.length === 0 && can.Control && this instanceof can.Control) {
                    return can.Control.prototype.off.call(this);
                } else {
                    return can.removeEvent.apply(this, arguments);
                }
            },


            bind: can.addEvent,

            unbind: can.removeEvent,

            delegate: function(selector, event, handler) {
                return can.addEvent.call(event, handler);
            },

            undelegate: function(selector, event, handler) {
                return can.removeEvent.call(event, handler);
            },

            trigger: can.dispatch,

            // Normal can/event methods
            one: can.one,
            addEvent: can.addEvent,
            removeEvent: can.removeEvent,
            listenTo: can.listenTo,
            stopListening: can.stopListening,
            dispatch: can.dispatch
        };

        return can.event;
    })(__m4);

    // ## can/util/array/each.js
    var __m7 = (function(can) {

        // The following is from jQuery
        var isArrayLike = function(obj) {
            var length = obj.length;
            return typeof arr !== "function" &&
            (length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj);
        };

        can.each = function(elements, callback, context) {
            var i = 0,
                key,
                len,
                item;
            if (elements) {
                if (isArrayLike(elements)) {
                    if (can.List && elements instanceof can.List) {
                        for (len = elements.attr("length"); i < len; i++) {
                            item = elements.attr(i);
                            if (callback.call(context || item, item, i, elements) === false) {
                                break;
                            }
                        }
                    } else {
                        for (len = elements.length; i < len; i++) {
                            item = elements[i];
                            if (callback.call(context || item, item, i, elements) === false) {
                                break;
                            }
                        }
                    }

                } else if (typeof elements === "object") {

                    if (can.Map && elements instanceof can.Map || elements === can.route) {
                        var keys = can.Map.keys(elements);
                        for (i = 0, len = keys.length; i < len; i++) {
                            key = keys[i];
                            item = elements.attr(key);
                            if (callback.call(context || item, item, key, elements) === false) {
                                break;
                            }
                        }
                    } else {
                        for (key in elements) {
                            if (elements.hasOwnProperty(key) && callback.call(context || elements[key], elements[key], key, elements) === false) {
                                break;
                            }
                        }
                    }

                }
            }
            return elements;
        };
        return can;
    })(__m4);

    // ## can/util/inserted/inserted.js
    var __m8 = (function(can) {
        can.inserted = function(elems) {
            // Turn the `elems` property into an array to prevent mutations from changing the looping.
            elems = can.makeArray(elems);
            var inDocument = false,
                // Gets the `doc` to use as a reference for finding out whether the element is in the document.
                doc = can.$(document.contains ? document : document.body),
                children;
            // Go through `elems` and trigger the `inserted` event.
            // If the first element is not in the document (a Document Fragment) it will exit the function. If it is in the document it sets the `inDocument` flag to true. This means that we only check for the first element and either exit the function or start triggering "inserted" for child elements.
            for (var i = 0, elem;
                (elem = elems[i]) !== undefined; i++) {
                if (!inDocument) {
                    if (elem.getElementsByTagName) {
                        if (can.has(doc, elem)
                            .length) {
                            inDocument = true;
                        } else {
                            return;
                        }
                    } else {
                        continue;
                    }
                }

                // If we've found an element in the document then we can now trigger **"inserted"** for `elem` and all of its children. We are using `getElementsByTagName("*")` so that we grab all of the descendant nodes.
                if (inDocument && elem.getElementsByTagName) {
                    children = can.makeArray(elem.getElementsByTagName("*"));
                    can.trigger(elem, "inserted", [], false);
                    for (var j = 0, child;
                        (child = children[j]) !== undefined; j++) {
                        can.trigger(child, "inserted", [], false);
                    }
                }
            }
        };

        // ## can.appendChild
        // Used to append a node to an element and trigger the "inserted" event on all of the newly inserted children. Since `can.inserted` takes an array we convert the child to an array, or in the case of a DocumentFragment we first convert the childNodes to an array and call inserted on those.
        can.appendChild = function(el, child) {
            var children;
            if (child.nodeType === 11) {
                children = can.makeArray(child.childNodes);
            } else {
                children = [child];
            }
            el.appendChild(child);
            can.inserted(children);
        };

        // ## can.insertBefore
        // Like can.appendChild, used to insert a node to an element before a reference node and then trigger the "inserted" event.
        can.insertBefore = function(el, child, ref) {
            var children;
            if (child.nodeType === 11) {
                children = can.makeArray(child.childNodes);
            } else {
                children = [child];
            }
            el.insertBefore(child, ref);
            can.inserted(children);
        };
    })(__m4);

    // ## can/util/jquery/jquery.js
    var __m2 = (function($, can, attr, event) {
        var isBindableElement = function(node) {
            // In IE8 window.window !== window.window, so we allow == here.

            return (node.nodeName && (node.nodeType === 1 || node.nodeType === 9)) || node == window;
        };
        // _jQuery node list._
        $.extend(can, $, {
                trigger: function(obj, event, args, bubbles) {
                    if (isBindableElement(obj)) {
                        $.event.trigger(event, args, obj, !bubbles);
                    } else if (obj.trigger) {
                        obj.trigger(event, args);
                    } else {
                        if (typeof event === 'string') {
                            event = {
                                type: event
                            };
                        }
                        event.target = event.target || obj;
                        can.dispatch.call(obj, event, args);
                    }
                },
                event: can.event,
                addEvent: can.addEvent,
                removeEvent: can.removeEvent,
                buildFragment: function(elems, context) {
                    // Check if this has any html nodes on our own.
                    var ret;
                    elems = [elems];
                    // Set context per 1.8 logic
                    context = context || document;
                    context = !context.nodeType && context[0] || context;
                    context = context.ownerDocument || context;
                    ret = $.buildFragment(elems, context);
                    return ret.cacheable ? $.clone(ret.fragment) : ret.fragment || ret;
                },
                $: $,
                each: can.each,
                bind: function(ev, cb) {
                    // If we can bind to it...
                    if (this.bind && this.bind !== can.bind) {
                        this.bind(ev, cb);
                    } else if (isBindableElement(this)) {
                        $.event.add(this, ev, cb);
                    } else {
                        // Make it bind-able...
                        can.addEvent.call(this, ev, cb);
                    }
                    return this;
                },
                unbind: function(ev, cb) {
                    // If we can bind to it...
                    if (this.unbind && this.unbind !== can.unbind) {
                        this.unbind(ev, cb);
                    } else if (isBindableElement(this)) {
                        $.event.remove(this, ev, cb);
                    } else {
                        // Make it bind-able...
                        can.removeEvent.call(this, ev, cb);
                    }
                    return this;
                },
                delegate: function(selector, ev, cb) {
                    if (this.delegate) {
                        this.delegate(selector, ev, cb);
                    } else if (isBindableElement(this)) {
                        $(this)
                            .delegate(selector, ev, cb);
                    } else {
                        // make it bind-able ...
                        can.bind.call(this, ev, cb);
                    }
                    return this;
                },
                undelegate: function(selector, ev, cb) {
                    if (this.undelegate) {
                        this.undelegate(selector, ev, cb);
                    } else if (isBindableElement(this)) {
                        $(this)
                            .undelegate(selector, ev, cb);
                    } else {
                        can.unbind.call(this, ev, cb);
                    }
                    return this;
                },
                proxy: function(fn, context) {
                    return function() {
                        return fn.apply(context, arguments);
                    };
                },
                attr: attr
            });
        // Wrap binding functions.

        // Aliases
        can.on = can.bind;
        can.off = can.unbind;
        // Wrap modifier functions.
        $.each([
                'append',
                'filter',
                'addClass',
                'remove',
                'data',
                'get',
                'has'
            ], function(i, name) {
                can[name] = function(wrapped) {
                    return wrapped[name].apply(wrapped, can.makeArray(arguments)
                        .slice(1));
                };
            });
        // Memory safe destruction.
        var oldClean = $.cleanData;
        $.cleanData = function(elems) {
            $.each(elems, function(i, elem) {
                if (elem) {
                    can.trigger(elem, 'removed', [], false);
                }
            });
            oldClean(elems);
        };
        var oldDomManip = $.fn.domManip,
            cbIndex;
        // feature detect which domManip we are using
        $.fn.domManip = function(args, cb1, cb2) {
            for (var i = 1; i < arguments.length; i++) {
                if (typeof arguments[i] === 'function') {
                    cbIndex = i;
                    break;
                }
            }
            return oldDomManip.apply(this, arguments);
        };
        $(document.createElement("div"))
            .append(document.createElement("div"));

        $.fn.domManip = (cbIndex === 2 ? function(args, table, callback) {
            return oldDomManip.call(this, args, table, function(elem) {
                var elems;
                if (elem.nodeType === 11) {
                    elems = can.makeArray(elem.childNodes);
                }
                var ret = callback.apply(this, arguments);
                can.inserted(elems ? elems : [elem]);
                return ret;
            });
        } : function(args, callback) {
            return oldDomManip.call(this, args, function(elem) {
                var elems;
                if (elem.nodeType === 11) {
                    elems = can.makeArray(elem.childNodes);
                }
                var ret = callback.apply(this, arguments);
                can.inserted(elems ? elems : [elem]);
                return ret;
            });
        });

        if (!can.attr.MutationObserver) {
            // handle via calls to attr
            var oldAttr = $.attr;
            $.attr = function(el, attrName) {
                var oldValue, newValue;
                if (arguments.length >= 3) {
                    oldValue = oldAttr.call(this, el, attrName);
                }
                var res = oldAttr.apply(this, arguments);
                if (arguments.length >= 3) {
                    newValue = oldAttr.call(this, el, attrName);
                }
                if (newValue !== oldValue) {
                    can.attr.trigger(el, attrName, oldValue);
                }
                return res;
            };
            var oldRemove = $.removeAttr;
            $.removeAttr = function(el, attrName) {
                var oldValue = oldAttr.call(this, el, attrName),
                    res = oldRemove.apply(this, arguments);

                if (oldValue != null) {
                    can.attr.trigger(el, attrName, oldValue);
                }
                return res;
            };
            $.event.special.attributes = {
                setup: function() {
                    can.data(can.$(this), "canHasAttributesBindings", true);
                },
                teardown: function() {
                    $.removeData(this, "canHasAttributesBindings");
                }
            };
        } else {
            // setup a special events
            $.event.special.attributes = {
                setup: function() {
                    var self = this;
                    var observer = new can.attr.MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            var copy = can.simpleExtend({}, mutation);
                            can.trigger(self, copy, []);
                        });

                    });
                    observer.observe(this, {
                            attributes: true,
                            attributeOldValue: true
                        });
                    can.data(can.$(this), "canAttributesObserver", observer);
                },
                teardown: function() {
                    can.data(can.$(this), "canAttributesObserver")
                        .disconnect();
                    $.removeData(this, "canAttributesObserver");

                }
            };
        }

        // ## Fix build fragment.
        // In IE8, we can pass jQuery a fragment and it removes newlines.
        // This checks for that and replaces can.buildFragment with something
        // that if only a single text node is returned, returns a fragment with
        // a text node that is set to the content.
        (function() {

            var text = "<-\n>",
                frag = can.buildFragment(text, document);
            if (text !== frag.childNodes[0].nodeValue) {

                var oldBuildFragment = can.buildFragment;
                can.buildFragment = function(content, context) {
                    var res = oldBuildFragment(content, context);
                    if (res.childNodes.length === 1 && res.childNodes[0].nodeType === 3) {
                        res.childNodes[0].nodeValue = content;
                    }
                    return res;
                };

            }



        })();

        $.event.special.inserted = {};
        $.event.special.removed = {};
        return can;
    })(jQuery, __m4, __m5, __m6, __m7, __m8);

    // ## can/util/object/object.js
    var __m1 = (function(can) {
        var isArray = can.isArray;

        can.Object = {};

        var same = can.Object.same = function(a, b, compares, aParent, bParent, deep) {
            var aType = typeof a,
                aArray = isArray(a),
                comparesType = typeof compares,
                compare;
            if (comparesType === 'string' || compares === null) {
                compares = compareMethods[compares];
                comparesType = 'function';
            }
            if (comparesType === 'function') {
                return compares(a, b, aParent, bParent);
            }
            compares = compares || {};
            if (a === null || b === null) {
                return a === b;
            }
            if (a instanceof Date || b instanceof Date) {
                return a === b;
            }
            if (deep === -1) {
                return aType === 'object' || a === b;
            }
            if (aType !== typeof b || aArray !== isArray(b)) {
                return false;
            }
            if (a === b) {
                return true;
            }
            if (aArray) {
                if (a.length !== b.length) {
                    return false;
                }
                for (var i = 0; i < a.length; i++) {
                    compare = compares[i] === undefined ? compares['*'] : compares[i];
                    if (!same(a[i], b[i], a, b, compare)) {
                        return false;
                    }
                }
                return true;
            } else if (aType === 'object' || aType === 'function') {
                var bCopy = can.extend({}, b);
                for (var prop in a) {
                    compare = compares[prop] === undefined ? compares['*'] : compares[prop];
                    if (!same(a[prop], b[prop], compare, a, b, deep === false ? -1 : undefined)) {
                        return false;
                    }
                    delete bCopy[prop];
                }
                // go through bCopy props ... if there is no compare .. return false
                for (prop in bCopy) {
                    if (compares[prop] === undefined || !same(undefined, b[prop], compares[prop], a, b, deep === false ? -1 : undefined)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

        can.Object.subsets = function(checkSet, sets, compares) {
            var len = sets.length,
                subsets = [];
            for (var i = 0; i < len; i++) {
                //check this subset
                var set = sets[i];
                if (can.Object.subset(checkSet, set, compares)) {
                    subsets.push(set);
                }
            }
            return subsets;
        };

        can.Object.subset = function(subset, set, compares) {
            // go through set {type: 'folder'} and make sure every property
            // is in subset {type: 'folder', parentId :5}
            // then make sure that set has fewer properties
            // make sure we are only checking 'important' properties
            // in subset (ones that have to have a value)
            compares = compares || {};
            for (var prop in set) {
                if (!same(subset[prop], set[prop], compares[prop], subset, set)) {
                    return false;
                }
            }
            return true;
        };
        var compareMethods = {
            'null': function() {
                return true;
            },
            i: function(a, b) {
                return ('' + a)
                    .toLowerCase() === ('' + b)
                    .toLowerCase();
            },
            eq: function(a, b) {
                return a === b;
            },
            similar: function(a, b) {

                return a == b;
            }
        };
        compareMethods.eqeq = compareMethods.similar;
        return can.Object;
    })(__m2);

    // ## can/util/string/string.js
    var __m10 = (function(can) {
        // ##string.js
        // _Miscellaneous string utility functions._  
        // Several of the methods in this plugin use code adapated from Prototype
        // Prototype JavaScript framework, version 1.6.0.1.
        // © 2005-2007 Sam Stephenson
        var strUndHash = /_|-/,
            strColons = /\=\=/,
            strWords = /([A-Z]+)([A-Z][a-z])/g,
            strLowUp = /([a-z\d])([A-Z])/g,
            strDash = /([a-z\d])([A-Z])/g,
            strReplacer = /\{([^\}]+)\}/g,
            strQuote = /"/g,
            strSingleQuote = /'/g,
            strHyphenMatch = /-+(.)?/g,
            strCamelMatch = /[a-z][A-Z]/g,
            // Returns the `prop` property from `obj`.
            // If `add` is true and `prop` doesn't exist in `obj`, create it as an
            // empty object.
            getNext = function(obj, prop, add) {
                var result = obj[prop];
                if (result === undefined && add === true) {
                    result = obj[prop] = {};
                }
                return result;
            },
            // Returns `true` if the object can have properties (no `null`s).
            isContainer = function(current) {
                return /^f|^o/.test(typeof current);
            }, convertBadValues = function(content) {
                // Convert bad values into empty strings
                var isInvalid = content === null || content === undefined || isNaN(content) && '' + content === 'NaN';
                return '' + (isInvalid ? '' : content);
            };
        can.extend(can, {
                esc: function(content) {
                    return convertBadValues(content)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(strQuote, '&#34;')
                        .replace(strSingleQuote, '&#39;');
                },
                getObject: function(name, roots, add) {
                    // The parts of the name we are looking up
                    // `['App','Models','Recipe']`
                    var parts = name ? name.split('.') : [],
                        length = parts.length,
                        current, r = 0,
                        i, container, rootsLength;
                    // Make sure roots is an `array`.
                    roots = can.isArray(roots) ? roots : [roots || window];
                    rootsLength = roots.length;
                    if (!length) {
                        return roots[0];
                    }
                    // For each root, mark it as current.
                    for (r; r < rootsLength; r++) {
                        current = roots[r];
                        container = undefined;
                        // Walk current to the 2nd to last object or until there
                        // is not a container.
                        for (i = 0; i < length && isContainer(current); i++) {
                            container = current;
                            current = getNext(container, parts[i]);
                        }
                        // If we found property break cycle
                        if (container !== undefined && current !== undefined) {
                            break;
                        }
                    }
                    // Remove property from found container
                    if (add === false && current !== undefined) {
                        delete container[parts[i - 1]];
                    }
                    // When adding property add it to the first root
                    if (add === true && current === undefined) {
                        current = roots[0];
                        for (i = 0; i < length && isContainer(current); i++) {
                            current = getNext(current, parts[i], true);
                        }
                    }
                    return current;
                },
                capitalize: function(s, cache) {
                    // Used to make newId.
                    return s.charAt(0)
                        .toUpperCase() + s.slice(1);
                },
                camelize: function(str) {
                    return convertBadValues(str)
                        .replace(strHyphenMatch, function(match, chr) {
                            return chr ? chr.toUpperCase() : '';
                        });
                },
                hyphenate: function(str) {
                    return convertBadValues(str)
                        .replace(strCamelMatch, function(str, offset) {
                            return str.charAt(0) + '-' + str.charAt(1)
                                .toLowerCase();
                        });
                },
                underscore: function(s) {
                    return s.replace(strColons, '/')
                        .replace(strWords, '$1_$2')
                        .replace(strLowUp, '$1_$2')
                        .replace(strDash, '_')
                        .toLowerCase();
                },
                sub: function(str, data, remove) {
                    var obs = [];
                    str = str || '';
                    obs.push(str.replace(strReplacer, function(whole, inside) {
                                // Convert inside to type.
                                var ob = can.getObject(inside, data, remove === true ? false : undefined);
                                if (ob === undefined || ob === null) {
                                    obs = null;
                                    return '';
                                }
                                // If a container, push into objs (which will return objects found).
                                if (isContainer(ob) && obs) {
                                    obs.push(ob);
                                    return '';
                                }
                                return '' + ob;
                            }));
                    return obs === null ? obs : obs.length <= 1 ? obs[0] : obs;
                },
                replacer: strReplacer,
                undHash: strUndHash
            });
        return can;
    })(__m2);

    // ## can/util/fixture/fixture.js
    var __m9 = (function(can) {
        // can.fixture relies on can.Object in order to work and needs to be
        // included before can.fixture in order to use it, otherwise it'll error.
        if (!can.Object) {
            throw new Error('can.fixture depends on can.Object. Please include it before can.fixture.');
        }

        // Get the URL from old Steal root, new Steal config or can.fixture.rootUrl
        var getUrl = function(url) {
            if (typeof steal !== 'undefined') {
                if (can.isFunction(steal.config)) {
                    return steal.config()
                        .root.mapJoin(url)
                        .toString();
                }
                return steal.root.join(url)
                    .toString();
            }
            return (can.fixture.rootUrl || '') + url;
        };

        // Manipulates the AJAX prefilter to identify whether or not we should
        // manipulate the AJAX call to change the URL to a static file or call
        // a function for a dynamic fixture.
        var updateSettings = function(settings, originalOptions) {
            if (!can.fixture.on) {
                return;
            }

            // A simple wrapper for logging fixture.js.
            var log = function() {

            };

            // We always need the type which can also be called method, default to GET
            settings.type = settings.type || settings.method || 'GET';

            // add the fixture option if programmed in
            var data = overwrite(settings);

            // If there is not a fixture for this AJAX request, do nothing.
            if (!settings.fixture) {
                if (window.location.protocol === "file:") {
                    log("ajax request to " + settings.url + ", no fixture found");
                }
                return;
            }

            // If the fixture already exists on can.fixture, update the fixture option
            if (typeof settings.fixture === "string" && can.fixture[settings.fixture]) {
                settings.fixture = can.fixture[settings.fixture];
            }

            // If the fixture setting is a string, we just change the URL of the
            // AJAX call to the fixture URL.
            if (typeof settings.fixture === "string") {
                var url = settings.fixture;

                // If the URL starts with //, we need to update the URL to become
                // the full path.
                if (/^\/\//.test(url)) {
                    // this lets us use rootUrl w/o having steal...
                    url = getUrl(settings.fixture.substr(2));
                }

                if (data) {
                    // Template static fixture URLs
                    url = can.sub(url, data);
                }

                delete settings.fixture;



                // Override the AJAX settings, changing the URL to the fixture file,
                // removing the data, and changing the type to GET.
                settings.url = url;
                settings.data = null;
                settings.type = "GET";
                if (!settings.error) {
                    // If no error handling is provided, we provide one and throw an
                    // error.
                    settings.error = function(xhr, error, message) {
                        throw "fixtures.js Error " + error + " " + message;
                    };
                }
                // Otherwise, it is a function and we add the fixture data type so the
                // fixture transport will handle it.
            } else {


                // TODO: make everything go here for timing and other fun stuff
                // add to settings data from fixture ...
                if (settings.dataTypes) {
                    settings.dataTypes.splice(0, 0, "fixture");
                }

                if (data && originalOptions) {
                    originalOptions.data = originalOptions.data || {};
                    can.extend(originalOptions.data, data);
                }
            }
        },
            // A helper function that takes what's called with response
            // and moves some common args around to make it easier to call
            extractResponse = function(status, statusText, responses, headers) {
                // if we get response(RESPONSES, HEADERS)
                if (typeof status !== "number") {
                    headers = statusText;
                    responses = status;
                    statusText = "success";
                    status = 200;
                }
                // if we get response(200, RESPONSES, HEADERS)
                if (typeof statusText !== "string") {
                    headers = responses;
                    responses = statusText;
                    statusText = "success";
                }
                if (status >= 400 && status <= 599) {
                    this.dataType = "text";
                }
                return [status, statusText, extractResponses(this, responses), headers];
            },
            // If we get data instead of responses, make sure we provide a response
            // type that matches the first datatype (typically JSON)
            extractResponses = function(settings, responses) {
                var next = settings.dataTypes ? settings.dataTypes[0] : (settings.dataType || 'json');
                if (!responses || !responses[next]) {
                    var tmp = {};
                    tmp[next] = responses;
                    responses = tmp;
                }
                return responses;
            };

        // Set up prefiltering and transmission handling in order to actually power
        // can.fixture. This is handled two different ways, depending on whether or
        // not CanJS is using jQuery or not.

        // If we are using jQuery, we have access to ajaxPrefilter and ajaxTransport
        if (can.ajaxPrefilter && can.ajaxTransport) {

            // the pre-filter needs to re-route the url
            can.ajaxPrefilter(updateSettings);

            can.ajaxTransport("fixture", function(s, original) {
                // remove the fixture from the datatype
                s.dataTypes.shift();

                //we'll return the result of the next data type
                var timeout, stopped = false;

                return {
                    send: function(headers, callback) {
                        // we'll immediately wait the delay time for all fixtures
                        timeout = setTimeout(function() {
                            // if the user wants to call success on their own, we allow it ...
                            var success = function() {
                                if (stopped === false) {
                                    callback.apply(null, extractResponse.apply(s, arguments));
                                }
                            },
                                // get the result form the fixture
                                result = s.fixture(original, success, headers, s);
                            if (result !== undefined) {
                                // Run the callback as a 200 success and with the results with the correct dataType
                                callback(200, "success", extractResponses(s, result), {});
                            }
                        }, can.fixture.delay);
                    },
                    abort: function() {
                        stopped = true;
                        clearTimeout(timeout);
                    }
                };
            });
            // If we are not using jQuery, we don't have access to those nice ajaxPrefilter
            // and ajaxTransport functions, so we need to monkey patch can.ajax.
        } else {
            var AJAX = can.ajax;
            can.ajax = function(settings) {
                updateSettings(settings, settings);

                // If the call is a fixture call, we run the same type of code as we would
                // with jQuery's ajaxTransport.
                if (settings.fixture) {
                    var timeout, deferred = new can.Deferred(),
                        stopped = false;

                    //TODO this should work with response
                    deferred.getResponseHeader = function() {};

                    // Call success or fail after deferred resolves
                    deferred.then(settings.success, settings.fail);

                    // Abort should stop the timeout and calling the success callback
                    deferred.abort = function() {
                        clearTimeout(timeout);
                        stopped = true;
                        deferred.reject(deferred);
                    };
                    // set a timeout that simulates making a request ....
                    timeout = setTimeout(function() {
                        // if the user wants to call success on their own, we allow it ...
                        var success = function() {
                            var response = extractResponse.apply(settings, arguments),
                                status = response[0];

                            if ((status >= 200 && status < 300 || status === 304) && stopped === false) {
                                deferred.resolve(response[2][settings.dataType]);
                            } else {
                                // TODO probably resolve better
                                deferred.reject(deferred, 'error', response[1]);
                            }
                        },
                            // Get the results from the fixture.
                            result = settings.fixture(settings, success, settings.headers, settings);
                        if (result !== undefined) {
                            // Resolve with fixture results
                            deferred.resolve(result);
                        }
                    }, can.fixture.delay);

                    return deferred;
                    // Otherwise just run a normal can.ajax call.
                } else {
                    return AJAX(settings);
                }
            };
        }

        // A list of 'overwrite' settings objects
        var overwrites = [],
            // Finds and returns the index of an overwrite function
            find = function(settings, exact) {
                for (var i = 0; i < overwrites.length; i++) {
                    if ($fixture._similar(settings, overwrites[i], exact)) {
                        return i;
                    }
                }
                return -1;
            },
            // Overwrites the settings fixture if an overwrite matches
            overwrite = function(settings) {
                var index = find(settings);
                if (index > -1) {
                    settings.fixture = overwrites[index].fixture;
                    return $fixture._getData(overwrites[index].url, settings.url);
                }

            },
            // Attemps to guess where the id is in an AJAX call's URL and returns it.
            getId = function(settings) {
                var id = settings.data.id;

                if (id === undefined && typeof settings.data === "number") {
                    id = settings.data;
                }

                // Parses the URL looking for all digits
                if (id === undefined) {
                    // Set id equal to the value
                    settings.url.replace(/\/(\d+)(\/|$|\.)/g, function(all, num) {
                        id = num;
                    });
                }

                if (id === undefined) {
                    // If that doesn't work Parses the URL looking for all words
                    id = settings.url.replace(/\/(\w+)(\/|$|\.)/g, function(all, num) {
                        // As long as num isn't the word "update", set id equal to the value
                        if (num !== 'update') {
                            id = num;
                        }
                    });
                }

                if (id === undefined) {
                    // If id is still not set, a random number is guessed.
                    id = Math.round(Math.random() * 1000);
                }

                return id;
            };

        // ## can.fixture
        // Simulates AJAX requests.
        var $fixture = can.fixture = function(settings, fixture) {
            // If fixture is provided, set up a new fixture.
            if (fixture !== undefined) {
                if (typeof settings === 'string') {
                    // Match URL if it has GET, POST, PUT, or DELETE.
                    var matches = settings.match(/(GET|POST|PUT|DELETE) (.+)/i);
                    // If not, we don't set the type, which eventually defaults to GET
                    if (!matches) {
                        settings = {
                            url: settings
                        };
                        // If it does match, we split the URL in half and create an object with
                        // each half as the url and type properties.
                    } else {
                        settings = {
                            url: matches[2],
                            type: matches[1]
                        };
                    }
                }

                // Check if the same fixture was previously added, if so, we remove it
                // from our array of fixture overwrites.
                var index = find(settings, !! fixture);
                if (index > -1) {
                    overwrites.splice(index, 1);
                }
                if (fixture == null) {
                    return;
                }
                settings.fixture = fixture;
                overwrites.push(settings);
                // If a fixture isn't provided, we assume that settings is
                // an array of fixtures, and we should iterate over it, and set up
                // the new fixtures.
            } else {
                can.each(settings, function(fixture, url) {
                    $fixture(url, fixture);
                });
            }
        };
        var replacer = can.replacer;

        can.extend(can.fixture, {
                // Find an overwrite, given some ajax settings.
                _similar: function(settings, overwrite, exact) {
                    if (exact) {
                        return can.Object.same(settings, overwrite, {
                                fixture: null
                            });
                    } else {
                        return can.Object.subset(settings, overwrite, can.fixture._compare);
                    }
                },
                // Comparator object used to find a similar overwrite.
                _compare: {
                    url: function(a, b) {
                        return !!$fixture._getData(b, a);
                    },
                    fixture: null,
                    type: "i"
                },
                // Returns data from a url, given a fixtue URL. For example, given
                // "todo/{id}" and "todo/5", it will return an object with an id property
                // equal to 5.
                _getData: function(fixtureUrl, url) {
                    var order = [],
                        // Sanitizes fixture URL
                        fixtureUrlAdjusted = fixtureUrl.replace('.', '\\.')
                            .replace('?', '\\?'),
                        // Creates a regular expression out of the adjusted fixture URL and
                        // runs it on the URL we passed in.
                        res = new RegExp(fixtureUrlAdjusted.replace(replacer, function(whole, part) {
                                    order.push(part);
                                    return "([^\/]+)";
                                }) + "$")
                            .exec(url),
                        data = {};

                    // If there were no matches, return null;
                    if (!res) {
                        return null;
                    }

                    // Shift off the URL and just keep the data.
                    res.shift();
                    can.each(order, function(name) {
                        // Add data from regular expression onto data object.
                        data[name] = res.shift();
                    });
                    return data;
                },
                // ## can.fixture.store
                // Make a store of objects to use when making requests against fixtures.
                store: function(count, make, filter) {


                    // the currentId to use when a new instance is created.
                    var currentId = 0,
                        findOne = function(id) {
                            for (var i = 0; i < items.length; i++) {
                                if (id == items[i].id) {
                                    return items[i];
                                }
                            }
                        },
                        methods = {},
                        types,
                        items,
                        reset;

                    if (can.isArray(count) && typeof count[0] === "string") {
                        types = count;
                        count = make;
                        make = filter;
                        filter = arguments[3];
                    } else if (typeof count === "string") {
                        types = [count + "s", count];
                        count = make;
                        make = filter;
                        filter = arguments[3];
                    }


                    if (typeof count === "number") {
                        items = [];
                        reset = function() {
                            items = [];
                            for (var i = 0; i < (count); i++) {
                                //call back provided make
                                var item = make(i, items);

                                if (!item.id) {
                                    item.id = i;
                                }
                                currentId = Math.max(item.id + 1, currentId + 1) || items.length;
                                items.push(item);
                            }
                            if (can.isArray(types)) {
                                can.fixture["~" + types[0]] = items;
                                can.fixture["-" + types[0]] = methods.findAll;
                                can.fixture["-" + types[1]] = methods.findOne;
                                can.fixture["-" + types[1] + "Update"] = methods.update;
                                can.fixture["-" + types[1] + "Destroy"] = methods.destroy;
                                can.fixture["-" + types[1] + "Create"] = methods.create;
                            }
                        };
                    } else {
                        filter = make;
                        var initialItems = count;
                        reset = function() {
                            items = initialItems.slice(0);
                        };
                    }


                    // make all items
                    can.extend(methods, {
                            findAll: function(request) {
                                request = request || {};
                                //copy array of items
                                var retArr = items.slice(0);
                                request.data = request.data || {};
                                //sort using order
                                //order looks like ["age ASC","gender DESC"]
                                can.each((request.data.order || [])
                                    .slice(0)
                                    .reverse(), function(name) {
                                        var split = name.split(" ");
                                        retArr = retArr.sort(function(a, b) {
                                            if (split[1].toUpperCase() !== "ASC") {
                                                if (a[split[0]] < b[split[0]]) {
                                                    return 1;
                                                } else if (a[split[0]] === b[split[0]]) {
                                                    return 0;
                                                } else {
                                                    return -1;
                                                }
                                            } else {
                                                if (a[split[0]] < b[split[0]]) {
                                                    return -1;
                                                } else if (a[split[0]] === b[split[0]]) {
                                                    return 0;
                                                } else {
                                                    return 1;
                                                }
                                            }
                                        });
                                    });

                                //group is just like a sort
                                can.each((request.data.group || [])
                                    .slice(0)
                                    .reverse(), function(name) {
                                        var split = name.split(" ");
                                        retArr = retArr.sort(function(a, b) {
                                            return a[split[0]] > b[split[0]];
                                        });
                                    });

                                var offset = parseInt(request.data.offset, 10) || 0,
                                    limit = parseInt(request.data.limit, 10) || (items.length - offset),
                                    i = 0;

                                //filter results if someone added an attr like parentId
                                for (var param in request.data) {
                                    i = 0;
                                    if (request.data[param] !== undefined && // don't do this if the value of the param is null (ignore it)
                                        (param.indexOf("Id") !== -1 || param.indexOf("_id") !== -1)) {
                                        while (i < retArr.length) {
                                            if (request.data[param] != retArr[i][param]) { // jshint eqeqeq: false
                                                retArr.splice(i, 1);
                                            } else {
                                                i++;
                                            }
                                        }
                                    }
                                }

                                if (typeof filter === "function") {
                                    i = 0;
                                    while (i < retArr.length) {
                                        if (!filter(retArr[i], request)) {
                                            retArr.splice(i, 1);
                                        } else {
                                            i++;
                                        }
                                    }
                                } else if (typeof filter === "object") {
                                    i = 0;
                                    while (i < retArr.length) {
                                        if (!can.Object.subset(retArr[i], request.data, filter)) {
                                            retArr.splice(i, 1);
                                        } else {
                                            i++;
                                        }
                                    }
                                }

                                // Return the data spliced with limit and offset, along with related values
                                // (e.g. count, limit, offset)
                                return {
                                    "count": retArr.length,
                                    "limit": request.data.limit,
                                    "offset": request.data.offset,
                                    "data": retArr.slice(offset, offset + limit)
                                };
                            },


                            findOne: function(request, response) {
                                var item = findOne(getId(request));

                                if (typeof item === "undefined") {
                                    return response(404, 'Requested resource not found');
                                }

                                response(item);
                            },
                            // ## fixtureStore.update
                            // Simulates a can.Model.update to a fixture
                            update: function(request, response) {
                                var id = getId(request),
                                    item = findOne(id);

                                if (typeof item === "undefined") {
                                    return response(404, 'Requested resource not found');
                                }

                                // TODO: make it work with non-linear ids ..
                                can.extend(item, request.data);
                                response({
                                        id: id
                                    }, {
                                        location: request.url || "/" + getId(request)
                                    });
                            },


                            destroy: function(request, response) {
                                var id = getId(request),
                                    item = findOne(id);

                                if (typeof item === "undefined") {
                                    return response(404, 'Requested resource not found');
                                }

                                for (var i = 0; i < items.length; i++) {
                                    if (items[i].id == id) { // jshint eqeqeq: false
                                        items.splice(i, 1);
                                        break;
                                    }
                                }

                                // TODO: make it work with non-linear ids ..
                                return {};
                            },

                            // ## fixtureStore.create
                            // Simulates a can.Model.create to a fixture
                            create: function(settings, response) {
                                var item = make(items.length, items);

                                can.extend(item, settings.data);

                                // If an ID wasn't passed into the request, we give the item
                                // a unique ID.
                                if (!item.id) {
                                    item.id = currentId++;
                                }

                                // Push the new item into the store.
                                items.push(item);
                                response({
                                        id: item.id
                                    }, {
                                        location: settings.url + "/" + item.id
                                    });
                            }
                        });
                    reset();
                    // if we have types given add them to can.fixture

                    return can.extend({
                            getId: getId,
                            find: function(settings) {
                                return findOne(getId(settings));
                            },
                            reset: reset
                        }, methods);
                },
                rand: function randomize(arr, min, max) {
                    if (typeof arr === 'number') {
                        if (typeof min === 'number') {
                            return arr + Math.floor(Math.random() * (min - arr));
                        } else {
                            return Math.floor(Math.random() * arr);
                        }

                    }
                    var rand = randomize;
                    // get a random set
                    if (min === undefined) {
                        return rand(arr, rand(arr.length + 1));
                    }
                    // get a random selection of arr
                    var res = [];
                    arr = arr.slice(0);
                    // set max
                    if (!max) {
                        max = min;
                    }
                    //random max
                    max = min + Math.round(rand(max - min));
                    for (var i = 0; i < max; i++) {
                        res.push(arr.splice(rand(arr.length), 1)[0]);
                    }
                    return res;
                },
                xhr: function(xhr) {
                    return can.extend({}, {
                            abort: can.noop,
                            getAllResponseHeaders: function() {
                                return "";
                            },
                            getResponseHeader: function() {
                                return "";
                            },
                            open: can.noop,
                            overrideMimeType: can.noop,
                            readyState: 4,
                            responseText: "",
                            responseXML: null,
                            send: can.noop,
                            setRequestHeader: can.noop,
                            status: 200,
                            statusText: "OK"
                        }, xhr);
                },
                on: true
            });

        // ## can.fixture.delay
        // The delay, in milliseconds, between an AJAX request being made and when
        // the success callback gets called.
        can.fixture.delay = 200;

        // ## can.fixture.rootUrl
        // The root URL which fixtures will use.
        can.fixture.rootUrl = getUrl('');

        can.fixture["-handleFunction"] = function(settings) {
            if (typeof settings.fixture === "string" && can.fixture[settings.fixture]) {
                settings.fixture = can.fixture[settings.fixture];
            }
            if (typeof settings.fixture === "function") {
                setTimeout(function() {
                    if (settings.success) {
                        settings.success.apply(null, settings.fixture(settings, "success"));
                    }
                    if (settings.complete) {
                        settings.complete.apply(null, settings.fixture(settings, "complete"));
                    }
                }, can.fixture.delay);
                return true;
            }
            return false;
        };

        //Expose this for fixture debugging
        can.fixture.overwrites = overwrites;
        can.fixture.make = can.fixture.store;
        return can.fixture;
    })(__m2, __m10, __m1);

    window.fixture = __m4.fixture;
})();