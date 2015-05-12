import Immutable from "immutable";
import SingletonStorage from "./SingletonStorage";
import FactoryEnrichment from "./FactoryEnrichment";

class ClassFactoryBuilder {
    canHandle(definition) {
        return definition.get("class") !== undefined;
    }

    create(definition) {
        var Class = definition.get("class");
        return Immutable.fromJS({
            meta: {
                dependencies: definition.get("arguments")
            },
            factory: function(container) {
                var dependencies = definition.get("arguments").map(
                    dependencyName => container.get(dependencyName)
                );
                return new Class(...dependencies);
            }
        });
    }
}

export default SingletonStorage(ClassFactoryBuilder, false);