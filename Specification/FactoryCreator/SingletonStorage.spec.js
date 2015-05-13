import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import SingletonStorage from "../../Library/FactoryCreator/SingletonStorage";

describe("SingletonStorage", function() {
    var FactoryCreator, factoryCreatorInstance = null;
    beforeEach(function() {
        FactoryCreator = sinon.spy(function() {
            this.canHandle = sinon.stub();
            this.create = sinon.stub();
            factoryCreatorInstance = this;
        });
    });

    it("should wrap FactoryCreator upon construction", function() {
        var WrappedFactoryCreator = SingletonStorage(FactoryCreator);
        expect(FactoryCreator, "was not called");

        var creator = new WrappedFactoryCreator();
        expect(FactoryCreator, "was called");
    });

    it("should proxy canHandle calls", function() {
        var WrappedFactoryCreator = SingletonStorage(FactoryCreator);
        var creator = new WrappedFactoryCreator();

        var map = new Map({});
        creator.canHandle(map);

        expect(factoryCreatorInstance.canHandle, "was called once");
        expect(factoryCreatorInstance.canHandle, "was called with", map);
    });

    it("should proxy create calls", function() {
        var WrappedFactoryCreator = SingletonStorage(FactoryCreator);
        var creator = new WrappedFactoryCreator();
        factoryCreatorInstance.create.returns(Immutable.fromJS({
            meta: {dependencies: []},
            factory: function() {}
        }));

        var map = new Map({});
        creator.create(map);

        expect(factoryCreatorInstance.create, "was called once");
        expect(factoryCreatorInstance.create, "was called with", map);
    });

    describe("SingletonHandling", function() {
        var counter;
        beforeEach(function() {
            counter = 0;
            FactoryCreator = sinon.spy(function() {
                this.create = sinon.spy(function() {
                    return Immutable.fromJS({
                        meta: {
                            dependencies: ["b", "c", "d"]
                        },
                        factory: function() {
                            return counter++;
                        }
                    })
                });
                factoryCreatorInstance = this;
            });

        });

        it("should proxy create calls during create not once the factory is called", function() {
            var WrappedFactoryCreator = SingletonStorage(FactoryCreator);
            var creator = new WrappedFactoryCreator();

            var map = new Map({});
            var enrichedFactory = creator.create(map);
            var factory = enrichedFactory.get("factory");

            factory();
            factory();

            expect(factoryCreatorInstance.create, "was called once");
            expect(factoryCreatorInstance.create, "was called with", map);
        });

        it("should proxy meta information", function() {
            var WrappedFactoryCreator = SingletonStorage(FactoryCreator);
            var creator = new WrappedFactoryCreator();

            var map = new Map({});
            var enrichedFactory = creator.create(map);

            expect(enrichedFactory.get("meta").toJS(), "to equal", {dependencies: ["b", "c", "d"]});
        });

        [
            {definition: {}, expected: [0, 1, 2]},
            {definition: {isSingleton: true}, expected: [0, 0, 0]},
            {definition: {isSingleton: false}, expected: [0, 1, 2]},
            {definition: {isSingleton: null}, expected: [0, 1, 2]}
        ].forEach(data => {
            it(`should call factory based on isSingleton with unset default (${JSON.stringify(data)})`, function() {
                var WrappedFactoryCreator = SingletonStorage(FactoryCreator);
                var creator = new WrappedFactoryCreator();

                var definition = Immutable.fromJS(data.definition);
                var enrichedFactory = creator.create(definition);
                var factory = enrichedFactory.get("factory");

                var result = [factory(), factory(), factory()];

                expect(result, "to equal", data.expected);
            });

            it(`should call factory based on isSingleton with default set to false (${JSON.stringify(data)})`, function() {
                var WrappedFactoryCreator = SingletonStorage(FactoryCreator, false);
                var creator = new WrappedFactoryCreator();

                var definition = Immutable.fromJS(data.definition);
                var enrichedFactory = creator.create(definition);
                var factory = enrichedFactory.get("factory");

                var result = [factory(), factory(), factory()];

                expect(result, "to equal", data.expected);
            });
        });

        [
            {definition: {}, expected: [0, 0, 0]},
            {definition: {isSingleton: true}, expected: [0, 0, 0]},
            {definition: {isSingleton: false}, expected: [0, 1, 2]},
            {definition: {isSingleton: null}, expected: [0, 1, 2]}
        ].forEach(data => {
            it(`should call factory based on isSingleton with default set to true(${JSON.stringify(data)})`, function() {
                var WrappedFactoryCreator = SingletonStorage(FactoryCreator, true);
                var creator = new WrappedFactoryCreator();

                var definition = Immutable.fromJS(data.definition);
                var enrichedFactory = creator.create(definition);
                var factory = enrichedFactory.get("factory");

                var result = [factory(), factory(), factory()];

                expect(result, "to equal", data.expected);
            });
        });
    });
});