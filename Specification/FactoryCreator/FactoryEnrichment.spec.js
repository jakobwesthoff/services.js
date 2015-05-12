import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import FactoryEnrichment from "../../Library/FactoryCreator/FactoryEnrichment";

describe("FactoryEnrichment", function() {
    var FactoryCreator, factoryCreatorInstance = null;
    beforeEach(function() {
        FactoryCreator = sinon.spy(function() {
            this.canHandle = sinon.stub();
            this.create = sinon.stub();
            factoryCreatorInstance = this;
        });
    });

    it("should wrap FactoryCreator upon construction", function() {
        var WrappedFactoryCreator = FactoryEnrichment(FactoryCreator);
        expect(FactoryCreator, "was not called");

        var creator = new WrappedFactoryCreator();
        expect(FactoryCreator, "was called");
    });

    it("should proxy canHandle calls", function() {
        var WrappedFactoryCreator = FactoryEnrichment(FactoryCreator);
        var creator = new WrappedFactoryCreator();

        var map = new Map({});
        creator.canHandle(map);

        expect(factoryCreatorInstance.canHandle, "was called once");
        expect(factoryCreatorInstance.canHandle, "was called with", map);
    });

    it("should proxy create calls", function() {
        var WrappedFactoryCreator = FactoryEnrichment(FactoryCreator);
        var creator = new WrappedFactoryCreator();
        factoryCreatorInstance.create.returns(function() {});

        var map = new Map({});
        creator.create(map);

        expect(factoryCreatorInstance.create, "was called once");
        expect(factoryCreatorInstance.create, "was called with", map);
    });

    it("should enrich factories", function() {
        var WrappedFactoryCreator = FactoryEnrichment(FactoryCreator);
        var creator = new WrappedFactoryCreator();
        var factory = function() {};
        factoryCreatorInstance.create.returns(factory);;

        var args = new List(["a", "b", "c"]);
        var enrichedFactory = creator.create(new Map({arguments: args}));

        expect(enrichedFactory, "to be a", Map);
        expect(enrichedFactory.getIn(["meta", "dependencies"]), "to be", args);
        expect(enrichedFactory.get("factory"), "to be", factory);
    });

    it("should enrich factories without arguments", function() {
        var WrappedFactoryCreator = FactoryEnrichment(FactoryCreator);
        var creator = new WrappedFactoryCreator();
        var factory = function() {};
        factoryCreatorInstance.create.returns(factory);;

        var args = new List([]);
        var enrichedFactory = creator.create(new Map({arguments: args}));

        expect(enrichedFactory, "to be a", Map);
        expect(enrichedFactory.getIn(["meta", "dependencies"]), "to be", args);
        expect(enrichedFactory.get("factory"), "to be", factory);
    });
});