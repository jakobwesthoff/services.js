import Immutable, {Map, List} from "immutable";
import sinon from "sinon";
import expect from "unexpected";
import unexpectedSinon from "unexpected-sinon";
expect.installPlugin(unexpectedSinon);

import ValueFactoryCreator from "../../Library/FactoryCreator/Value";

describe("ValueFactoryCreator", function() {
    var creator;
    beforeEach(function() {
        creator = new ValueFactoryCreator();
    });

    it("should handle all entries with a 'value' property", function() {
        var definition = Immutable.fromJS({
            value: "something",
            foo: null,
            bar: true
        });

        expect(creator.canHandle(definition), "to equal", true);
    });

    it("should not handle entries without a 'value' property", function() {
        var definition = Immutable.fromJS({
            foo: null,
            bar: true
        });

        expect(creator.canHandle(definition), "to equal", false);
    });

    [
        "some string",
        423,
        true,
        null,
        undefined,
        [1,2,3],
        {a: "nice", little: {}, "with": "strings", and: 23, "in": "it"}
    ].forEach(value => {
        it(`should create a factory returning the given value (${JSON.stringify(value)})`, function() {
            var definition = new Map().set("value", value);

            var enrichedFactory = creator.create(definition);
            var factory = enrichedFactory.get("factory");

            expect(factory(), "to equal", value);
            // Ensure second call returns value as well
            expect(factory(), "to equal", value);
        });

        it(`should never create dependencies (${JSON.stringify(value)})`, function() {
            var definition = new Map().set("value", value);

            var enrichedFactory = creator.create(definition);
            expect(enrichedFactory.getIn(["meta", "dependencies"]).size, "to equal", 0);
        });
    });
});
