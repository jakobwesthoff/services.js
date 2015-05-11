import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import Container from "../Library/Container";

describe("Container", function() {
    var container, factoryA, factoryB, serviceFactories;

    beforeEach(function() {
        factoryA = sinon.stub();
        factoryB = sinon.stub();
        serviceFactories = Immutable.fromJS({
            "a": factoryA,
            "b": factoryB
        });
        container = new Container(serviceFactories);
    });

    it("should take factories during construction", function() {
        expect(
            () => new Container(
                Immutable.fromJS({"foo": function(){}})
            ),
            "not to throw"
        );
    });

    it("should provide result of factory if dependency is requested", function() {
        var result = "yeah!";
        factoryA.returns(result);
        expect(container.get("a"), "to equal", result);
    });

    it("should provide itself to the called factory function", function() {
        container.get("b");
        expect(factoryB, "was always called with", container);
    });

    it("should throw an error if an invalid dependency was requested", function() {
        expect(() => container.get("c"), "to throw");
    });
});
