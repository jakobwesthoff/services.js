# Services.js

[![Build Status](https://travis-ci.org/jakobwesthoff/services.js.svg?branch=master)](https://travis-ci.org/jakobwesthoff/services.js) [![Semver](http://img.shields.io/SemVer/2.0.0.png)](http://semver.org/spec/v2.0.0.html) [![npm version](https://badge.fury.io/js/services.js.svg)](http://badge.fury.io/js/services.js)  [![Dependencies](https://david-dm.org/jakobwesthoff/services.js.svg)](https://david-dm.org/jakobwesthoff/services.js) [![Development Dependencies](https://david-dm.org/jakobwesthoff/services.js/dev-status.svg)](https://david-dm.org/jakobwesthoff/services.js#info=devDependencies)

`Services.js` is an opinionated [Dependency Injection Container](http://en.wikipedia.org/wiki/Dependency_injection) for JavaScript using explicit service declarations. It is designed to work inside browsers (ran through a build tool like [browserify](http://browserify.org/) or [webpack](http://webpack.github.io/)) as well as in [nodejs](https://nodejs.org/) based environments.

## Getting Started (tl;dr)

Using `Services.js` is quite easy. Install `services.js` using npm and load the
dependency using `require` or utilizing your browser build tool of choice:

```bash
    npm install --save services.js
```

```javascript
    var Services = require("services.js");

    var builder = new Services.Builder();
    var container = builder.build([servicesConfig, ...]);
    
    var app = container.get("application");

    app.run();
```

Once your required the library you need to instantiate a new `Builder`, which
will parse and handle your service definitions given to the `Builder#build`
method. Once finished you will get back a fully configured dependency injection
container, which you might use to query for any dependency. Usually this will
be the entry point of your application. Once you have that just kick of this
entry point and the container will already have taken care of correctly wiring
up all your different components fitting them into each other based on your
configuration, which look something like this:

```javascript
{
    "services": {
        "application": {
            "class": require("my_application_class"),
            "arguments": [
                "serviceA",
                "serviceB"
            ],
        },
        "serviceA": {
            "class": require("my_service_a"),
            "arguments": [
                "someStaticValue"
            ]
        },
        "serviceB" {
            "factory": function(container) {
                //... some weird stuff needed to construct serviceB
            }
        },
        "someStaticValue": {
            "value": "Some static value, might be a string or an object, or whatever ;)"
        }
    }
}
```

This little example should provide you with the needed information to get
going. At least you should be able to realize if `Services.js` is the probably
the right tool for the job, or specifically for your problem. For details take
a look at the other sections of this document.


## Why another [IoC](http://en.wikipedia.org/wiki/Inversion_of_control) container?

`Services.js` has a different approach then most DICs available for JavaScript.
It does not try to automatically extract dependencies using constructor
parameters (even though this could be implemented for it quite easily). Neither
does it use dependent service declarations on the services itself, like for
example the famous angularjs DIC does.

It uses a different approach, which has been inspired by frameworks like
[Symfony](http://symfony.com/); one or more dedicated service declaration
files. This allows to not only inject dependencies by name, but to easily
inject different services with the same interface in different situations.

### Why would you want to do that?

An example says more than thousand words. Therefore imagine the following
scenario:

You have two different views onto the same data. One of your views needs to
always show the last 3 entries of some information, while the needs to show the
last 500 entries of the same information. The 3 entry view needs to be highly
accurate, while the other view needs less accuracy and may be out of date
a little. Therefore you have two implementations of your `DataGateway`, one
which provides most recent entries, while the other implements intelligent
caching to be faster and less harmful for your servers. If you would have
annotated both of your views (or Stores, or whatever layer you might put
between that) to just use a `DataGateway` your DIC would not know that each of
them needs a different one. You would have to name the dependencies
differently, like `CachedDataGateway` and `DirectDataGateway`. However, what if
you later on were able to optimize your storage layer, or might have
overestimated the load, which the accurate data polling has. To switch your big
view from the `CachedDataGateway` to the `DirectDataGateway` you would need to
edit this view in order to change the dependency. But one of the whole points
of IoC is that you don't need to do that in order wire your components
differently. An external services file helps you fix this problem easily.

```javascript
class LittleView {
    constructor(DataGateway) {
        ...
    }
}

class BigView {
    constructor(DataGateway) {
        ...
    }
}

```

Both your views just specify they want something resembling the DataGateway
interface. Next is your `services.json`

```javascript
{
    "services": {
        "DirectDataGateway": {
            "class": ...
            ...
        },

        "CachedDataGateway": {
            "class": ...
            ...
        },

        "BigView": {
            "class": ...
            "arguments": [
                "CachedDataGateway"
            ]
        },

        "LittleView": {
            "class": ...
            "arguments": [
                "DirectDataGateway"
            ]
        }
    }
}
```

The external definition allows for easily swapping out dependencies for each
other as long as they have the same interface without touching the different
components at all. Besides the usual `class` based dependencies there are
different ones as well like static `value` or `factory methods`. See the
section about `FactoryCreators` for more details about the ones shipped as well
as rolling your own.

## API

### Builder

Processing always starts with a `Builder`. The `Builder` is the component,
which processes your configuration data to create a services `Container` out of
it.

```javascript
var Services = require("@jakobwesthoff/services.js");

var builder = new Services.Builder();
```

#### Builder#construct([factoryCreator, ...]?)

The `Builder` constructor takes an optional array of `FactoryCreator`
instances, which will be used to create factory functions for all the different
services and dependencies defined. If no array is provided the default
configuration of `FactoryCreators` will automatically be used. In most
situations this is what you want to do.

```javascript
var builder = new Services.Builder([
    new Services.ClassFactoryCreator(),
    new Services.FactoryFunctionFactoryCreator(),
    new Services.ValueFactoryCreator(),
    ...
]);
```

The most common reason to specify the `FactoryCreators` on your own is to
utilize specialized implementations of those you might have done for your
project. If you want your own in conjunction with the defaults don't forget to
specify those as well. A look into the `constructor` of `Library/Builder.js`
will tell you which ones are the default.

#### Builder#build([configuration, ...])

The `Builder#build` method is the main entry point into the `Builder`. It
basically converts your service definitions into a configured `Container`,
which may then used to retrieve any defined dependency, while ensuring it is
correctly wired up.

```javascript
    var serviceConfiguration = require("services.js");
    var container = builder.build([serviceConfiguration]);
```

All given configurations will be merged, where each following
configuration supersedes the one before it. This allows for easy overrides
based on certain environments (eg. Production vs. Development or Server- vs.
Client-Side). Details on the configuration syntax itself can be found in the
section `Service Configuration`.

### Container

A `Container` is returned by the `Builder#build` method. It can not be manually
instantiated or otherwise manipulated. It basically is just a processed
version of your service configuration, which allows easy and fast access to
each correctly wired up dependency.

#### Container#get(serviceName)

Once a `Container` instance has been build any service may be retrieved from it
using its `get` method. The needed `serviceName` is the same one used inside
your service definition.

```javascript
var app = container.get("Application");
app.run();
```

In most situations your application has one or a small number of entry points.
Usually it is enough to retrieve this entry point and simply run it. The service
container will take care of instantiating and wiring up all services from this
point on according to your configuration.

## Service Configuration

Each and every used service needs to be configured inside at least one service
configuration. A `Service Configuration` is a simple JavaScript object
structure of the following form:

```javascript
{
    "services": {
        "serviceA": {
            ...
        },
        "serviceB": {
            ...
        }, 
        ...
    }
}
```

Each key inside the `services` object represents and names one service, which
further on is configured using a set of key values pairs itself. Which keys are
treated inside a service is determined by the `FactoryCreator` used to build
it. `FactoryCreators` usually are selected based on a specifically named `key`.
The `ClassFactoryCreator` for example is triggered by the existence of the
`class` key, while the `ValueFactoryCreator` is triggered by the `value` key.

Let's assume you want to define a **Class** as a dependency, it would look like
this:

```javascript
"MyUltraCoolClass": {
    "class": require("some/path/to/my/ultra/cool/class"),
    "arguments": [
        "someServiceA",
        "someServiceB",
        ...
    ],
    "isSingleton": true
}
```

The `class` key tells the `Builder` to utilize the `ClassFactoryCreator` for
the handling of this service, which, as the name suggests, handles classes.

The class may be provided any way: by using `require` in a corresponding
environment, by using the dependency injected by AMD (require.js), by utilizing
an `import` statement (ES6) or by using any other means to get it into the
context. The provided structure just needs to be the corresponding contructor
function you want to handle as a service.

### arguments

Every service may have an `arguments` key, which contains an array with zero or
more entries. Those entries are `strings` specifying which other services
should be injected into this one. The services are injected in the same order
they are specified in this array.

Mostly all `FactoryCreators` handle those arguments, while some might decide to
simply ignore them, like the `ValueFactoryCreator` where further services
simply don't make sense.

### isSingleton

A lot of `FactoryCreators` support the `isSingleton` key, which specifies, if
a service should be instantiated anew each time it is needed somewhere, or if
the same instance should be used over and over.

Different `FactoryCreators` have different defaults here. They always assume
the most common use case as default. The `ClassFactoryCreator` for example
treats services not as a singleton by default and will instantiate them each
time anew, while the `FactoryFunctionFactoryCreator` treats a factory function
as singleton by default and will only call it once, storing its result.

The `ValueFactoryCreator` ignores this option all together, as it always
returns the same static value.

### other

Other specialized `FactoryCreators` may take arbitrary options to provide for
proper configurability.

## FactoryCreators

`FactoryCreator` implementations are one of the integral parts of
`Services.js`. Different `FactoryCreator`s allow for different kinds of service
definitions. Essentially each implementation parses a single service definition
and returns a factory function, which is then used by the configured container
to create and manage any requested dependency.

`FactoryCreator`s are constructor functions (classes), which need to provide
the following methods: 

**FactoryCreator#canHandle(definition)**: Return `true` or `false` based on the
fact, if the given service `definition` can be handled by this specific
implementation.

**FactoryCreator#create(definition)**: Return an `Immutable.Map`, which needs
to have the following structure:

```javascript
{
    meta: {
        dependencies: [
            ...
        ]
    },
    factory: function(container) {...}
}
```

All inner structures are supposed to be `Immutable` data structures (Lists and
Maps). The `dependencies` list is a simple list of strings containing all the
dependencies, which need to be provided by the container, once the service is
built. Usually this is the same list of dependencies (`arguments`) provided in
the given `definition`. The `factory` function is an arbitrary JavaScript
function, which will be called each time the service is needed. It is provided
with the configured container and has to return the service in question.

### ValueFactoryCreator

The `ValueFactoryCreator` is used every time a service definition does contain
the `value` key. It ensures that the given value is provided as service, every
time it is requested. It does neither handle `dependencies` nor `isSingleton`,
as there is nothing to handle for a static value.

Values can be of any kind: Boolean, Number, String, Object, Array, Function,
...

```javascript
"myServiceName": {
    value: {
        my: "static",
        configuration: "object"
    }
}

"myOtherServiceName": {
    value: require("React");
}
```

### ClassFactoryCreator

The `ClassFactoryCreator` is used in cases, where constructor functions
(classes) need to be instantiated to be provided by the container. It is
automatically used if a services has a `class` key. The value for this key is
supposed to be the corresponding constructor function.

By default each time the dependency is needed a new instance will be created.
The constructor will be called with all the defined `arguments` in the given
order.

If `isSingleton` is set to `true`, the class will only be instantiated once and
later on reused.

### FactoryFunctionFactoryCreator

The `FactoryFunctionFactoryCreator` is the most flexible, but therefore most
configuration intensive `FactoryCreator`. It is triggered by the existence of
the `factory` key inside the given definition.

The `factory` value is supposed to be a function. This function will be called
each time the requested service is needed. It will be provided with all the
specified `arguments` in the given order. It is supposed to return the fully
configured service, which is then to be used. This may of course be any data
type.

If no arguments are specified the `factory` function is given the configured
`container` instance, which allows for highly dynamic services.

By default the `factory` function is only called once. Its return value is
stored and reused every time the service is requested. To always call the
`factory` function, when the service is needed set `isSingleton` to `false`.
