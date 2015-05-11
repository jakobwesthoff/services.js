import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);


import {Builder} from "../index";

describe("Builder", function () {
    it("should be constructable", function () {
        expect(() => new Builder(), "not to throw");
    });

    describe("Instance", function () {
        var builder;
        var factoryCreator;

        beforeEach(function () {
            builder = new Builder();
            var noop = function () {};
            factoryCreator = {canHandle: noop, create: noop};
        });

        it("should provide method 'create'", function () {
            expect(builder.build, "to be a function");
        });

        it("should take service configuration as input", function () {
            expect(() => {
                builder.build({services: {}});
            }, "not to throw");
        });

        it("should take array of service configurations as input", function () {
            expect(() => {
                builder.build([{services: {}}, {services: {}}]);
            }, "not to throw");
        });

        it("should use factoryCreator for service definition processing", function () {
            var mock = sinon.mock(factoryCreator);
            mock.expects("canHandle")
                .atLeast(1)
                .returns(true);

            mock.expects("create").once()
                .returns(
                Immutable.fromJS({
                    meta: {
                        dependencies: []
                    },
                    factory: function() {}
                })
            );

            var builder = new Builder([factoryCreator]);
            builder.build({
                services: {
                    "Foo": {}
                }
            });

            mock.verify();
        });

        it("should check dependency availability based on given meta data", function() {
            sinon.stub(factoryCreator);
            factoryCreator.canHandle.returns(true);
            factoryCreator.create.returns(Immutable.fromJS({
                meta: {
                    dependencies: [
                        "Bar"
                    ]
                },
                factory: function() {}
            }));

            var builder = new Builder([factoryCreator]);
            expect(() => builder.build({services: {
                Foo: {}
            }}), "to throw");
        });

        it("should check dependency availability for all services based on given meta data", function() {
            sinon.stub(factoryCreator);
            factoryCreator.canHandle.returns(true);
            factoryCreator.create.onCall(0).returns(Immutable.fromJS({
                meta: {
                    dependencies: [
                        "Bar"
                    ]
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(1).returns(Immutable.fromJS({
                meta: {
                    dependencies: [
                        "Baz"
                    ]
                },
                factory: function() {}
            }));

            var builder = new Builder([factoryCreator]);
            expect(() => builder.build({services: {
                Foo: {},
                Bar: {}
            }}), "to throw");
        });

        it("should check dependency availability based on multiple dependencies", function() {
            sinon.stub(factoryCreator);
            factoryCreator.canHandle.returns(true);
            factoryCreator.create.onCall(0).returns(Immutable.fromJS({
                meta: {
                    dependencies: []
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(1).returns(Immutable.fromJS({
                meta: {
                    dependencies: [
                        "Foo",
                        "Baz"
                    ]
                },
                factory: function() {}
            }));

            var builder = new Builder([factoryCreator]);
            expect(() => builder.build({services: {
                Foo: {},
                Bar: {}
            }}), "to throw");
        });

        it("should check for dependency cycles", function() {
            sinon.stub(factoryCreator);
            factoryCreator.canHandle.returns(true);
            factoryCreator.create.onCall(0).returns(Immutable.fromJS({
                meta: {
                    dependencies: ["b"]
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(1).returns(Immutable.fromJS({
                meta: {
                    dependencies: ["c"]
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(2).returns(Immutable.fromJS({
                meta: {
                    dependencies: ["a"]
                },
                factory: function() {}
            }));

            var builder = new Builder([factoryCreator]);
            expect(() => builder.build({services: {
                a: {},
                b: {},
                c: {}
            }}), "to throw");
        });

        it("should allow same dependencies in different paths", function() {
            sinon.stub(factoryCreator);
            factoryCreator.canHandle.returns(true);
            factoryCreator.create.onCall(0).returns(Immutable.fromJS({
                meta: {
                    dependencies: ["b", "c"]
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(1).returns(Immutable.fromJS({
                meta: {
                    dependencies: ["d"]
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(2).returns(Immutable.fromJS({
                meta: {
                    dependencies: ["d"]
                },
                factory: function() {}
            }));
            factoryCreator.create.onCall(3).returns(Immutable.fromJS({
                meta: {
                    dependencies: []
                },
                factory: function() {}
            }));

            var builder = new Builder([factoryCreator]);
            expect(() => builder.build({services: {
                a: {},
                b: {},
                c: {},
                d: {}
            }}), "not to throw");
        });
    });

});