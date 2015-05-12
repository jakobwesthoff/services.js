import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import FactoryFunctionFactoryCreator from "../../Library/FactoryCreator/FactoryFunction.js";

describe("ClassFactoryCreator", function() {
    var creator;
    var blueprint;
    var container;
    var Container = sinon.spy(function() {
        this.get = sinon.stub();
    });

    beforeEach(function() {
        blueprint = sinon.stub();
        creator = new FactoryFunctionFactoryCreator();
        container = new Container();
    });

    it("should handle definitions with 'factory' attribute", function() {
        var definition = Immutable.fromJS({
            "factory": blueprint
        });
        expect(creator.canHandle(definition), "to equal", true);
    });

    it("should not handle definitions without 'factory' attribute", function() {
        var definition = Immutable.fromJS({
            "somethingElse": function() {}
        });
        expect(creator.canHandle(definition), "to equal", false);
    });

    it("should reuse factory return value by default", function() {
        blueprint = sinon.spy(function() {return {}});
        var definition = Immutable.fromJS({
            "factory": blueprint,
            "arguments": []
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instanceOne = factory(container);
        var instanceTwo = factory(container);

        expect(instanceOne, "to be", instanceTwo);
    });

    it("should reuse factory return value with isSingleton=true", function() {
        blueprint = sinon.spy(function() {return {}});
        var definition = Immutable.fromJS({
            "factory": blueprint,
            "arguments": []
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instanceOne = factory(container);
        var instanceTwo = factory(container);

        expect(instanceOne, "to be", instanceTwo);
    });

    it("should recall factory function each time with isSingleton=false", function() {
        blueprint = sinon.spy(function() {return {}});
        var definition = Immutable.fromJS({
            "factory": blueprint,
            "arguments": [],
            "isSingleton": false
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instanceOne = factory(container);
        var instanceTwo = factory(container);

        expect(instanceOne, "not to be", instanceTwo);
    });

    it("should fetch dependencies from container", function() {
        var definition = Immutable.fromJS({
            "factory": blueprint,
            "arguments": ["b", "c"]
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instance = factory(container);

        expect(container.get, "was called twice");
        expect(container.get, "was called with", "b");
        expect(container.get, "was called with", "c");
    });

    it("should inject dependencies into factory in right order", function() {
        var definition = Immutable.fromJS({
            "factory": blueprint,
            "arguments": ["d", "c", "b"]
        });

        container.get
            .withArgs("b").returns("dependency b")
            .withArgs("c").returns("dependency c")
            .withArgs("d").returns("dependency d");

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instance = factory(container);

        expect(blueprint, "was called once");
        expect(blueprint, "was called with", "dependency d", "dependency c", "dependency b");
    });

    it("should inject container if no arguments were given", function() {
        var definition = Immutable.fromJS({
            "factory": blueprint,
            "arguments": []
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instance = factory(container);

        expect(blueprint, "was called once");
        expect(blueprint, "was called with", container);
    });
});
