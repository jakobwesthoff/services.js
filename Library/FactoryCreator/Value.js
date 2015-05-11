import Immutable from "immutable";

export default class ValueFactoryCreator {
    canHandle(definition) {
        return definition.get("value") !== undefined;
    }

    create(definition) {
        var value = definition.get("value");
        return Immutable.fromJS({
            meta: {
                dependencies: []
            },
            solution: function(container) {
                return value;
            }
        });
    }
}