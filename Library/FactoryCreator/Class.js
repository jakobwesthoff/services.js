import Immutable from "immutable";
import SingletonStorage from "./SingletonStorage";

class ClassFactoryCreator {
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

export default SingletonStorage(ClassFactoryCreator, false);