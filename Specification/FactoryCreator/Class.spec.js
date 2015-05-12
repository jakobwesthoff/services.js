import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import ClassFactoryCreator from "../../Library/FactoryCreator/Class";

describe("ClassFactoryCreator", function() {
    var creator;
    var Blueprint;
    var container;
    var Container = sinon.spy(function() {
        this.get = sinon.stub();
    });

    beforeEach(function() {
        Blueprint = sinon.spy();
        creator = new ClassFactoryCreator();
        container = new Container();
    });

    it("should handle definitions with 'class' attribute", function() {
        var definition = Immutable.fromJS({
            "class": Blueprint
        });
        expect(creator.canHandle(definition), "to equal", true);
    });

    it("should not handle definitions without 'class' attribute", function() {
        var definition = Immutable.fromJS({
            "somethingElse": function() {}
        });
        expect(creator.canHandle(definition), "to equal", false);
    });

    it("should create new instances each time the factory is called by default", function() {
        var definition = Immutable.fromJS({
            "class": Blueprint,
            "arguments": []
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instanceOne = factory(container);
        var instanceTwo = factory(container);

        expect(instanceOne, "to be a", Blueprint);
        expect(instanceTwo, "to be a", Blueprint);

        expect(instanceOne, "not to be", instanceTwo);
    });

    it("should create new instances each time the factory is called with isSingleton=false", function() {
        var definition = Immutable.fromJS({
            "class": Blueprint,
            "arguments": [],
            "isSingleton": false
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instanceOne = factory(container);
        var instanceTwo = factory(container);

        expect(instanceOne, "to be a", Blueprint);
        expect(instanceTwo, "to be a", Blueprint);

        expect(instanceOne, "not to be", instanceTwo);
    });

    it("should reuse instance each time the factory is called with isSingleton=true", function() {
        var definition = Immutable.fromJS({
            "class": Blueprint,
            "arguments": [],
            "isSingleton": true
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instanceOne = factory(container);
        var instanceTwo = factory(container);

        expect(instanceOne, "to be a", Blueprint);
        expect(instanceTwo, "to be a", Blueprint);

        expect(instanceOne, "to be", instanceTwo);
    });

    it("should fetch dependencies from container", function() {
        var definition = Immutable.fromJS({
            "class": Blueprint,
            "arguments": ["b", "c"]
        });

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instance = factory(container);

        expect(container.get, "was called twice");
        expect(container.get, "was called with", "b");
        expect(container.get, "was called with", "c");
    });

    it("should inject dependencies into class in right order", function() {
        var definition = Immutable.fromJS({
            "class": Blueprint,
            "arguments": ["d", "c", "b"]
        });

        container.get
            .withArgs("b").returns("dependency b")
            .withArgs("c").returns("dependency c")
            .withArgs("d").returns("dependency d");

        var enrichedFactory = creator.create(definition);
        var factory = enrichedFactory.get("factory");

        var instance = factory(container);

        expect(Blueprint, "was called once");
        expect(Blueprint, "was called with", "dependency d", "dependency c", "dependency b");
    });
});
