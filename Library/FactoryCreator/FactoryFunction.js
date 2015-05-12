import Immutable from "immutable";
import SingletonStorage from "./SingletonStorage";

class FactoryFunctionFactoryBuilder {
    canHandle(definition) {
        return definition.get("factory") !== undefined;
    }

    create(definition) {
        var factoryFn = definition.get("factory");
        return Immutable.fromJS({
            meta: {
                dependencies: definition.get("arguments")
            },
            factory: function(container) {
                if (definition.get("arguments").size === 0) {
                    return factoryFn(container);
                } else {
                    var dependencies = definition.get("arguments").map(
                        dependencyName => container.get(dependencyName)
                    );
                    return factoryFn(...dependencies);
                }
            }
        });
    }
}

export default SingletonStorage(FactoryFunctionFactoryBuilder, true);