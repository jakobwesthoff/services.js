import Immutable, {List, Map} from "immutable";
import Container from "./Container.js";

import ValueFactoryCreator from "./FactoryCreator/Value";

export class Builder {
    constructor(factoryCreators = [
        new ValueFactoryCreator()
    ]) {
        this.factoryCreators = factoryCreators;
    }

    build(configurations) {
        if (!configurations.constructor || configurations.constructor !== [].constructor) {
            configurations = [configurations];
        }

        return new Container(
            this.buildFactories(
                this.preprocessConfigurations(
                    configurations
                )
            )
        );
    }

    preprocessConfigurations(configurations) {
        var immutableServiceDefinitions = this.createImmutableServiceDefinitions(configurations);
        var definitions = this.mergeServiceDefinitions(immutableServiceDefinitions);
        return definitions;
    }

    createImmutableServiceDefinitions(serviceDeclarations) {
        return serviceDeclarations.map(
            declaration => Immutable.fromJS(declaration.services)
        );
    };

    mergeServiceDefinitions(serviceDefinitionsArray) {
        var firstMap = serviceDefinitionsArray.shift();
        if (serviceDefinitionsArray.length > 0) {
            return firstMap.merge(...serviceDefinitionsArray);
        } else {
            return firstMap;
        }
    }

    buildFactories(serviceDefinitions) {
        var enrichedFactories = serviceDefinitions.map(definition => {
            var factoryCreator = this.findFactoryCreatorForDefinition(definition);
            return factoryCreator.create(definition);
        });

        this.testFactories(enrichedFactories);

        return this.stripEnrichedFactories(enrichedFactories);
    }

    findFactoryCreatorForDefinition(definition) {
        var factoryCreator = this.factoryCreators.find(
            factoryCreator => factoryCreator.canHandle(definition)
        );

        if (factoryCreator === undefined) {
            throw new Error(`No FactoryCreator could be found to handle this service definition:\n${JSON.stringify(definition.toObject(), null, 4)}`);
        }

        return factoryCreator;
    }

    testFactories(enrichedFactories) {
        enrichedFactories.forEach((solution, name) => {
            this.testFactoryDoesNotContainCycle(enrichedFactories, name, solution);
        });
    }

    testFactoryDoesNotContainCycle(enrichedFactories, name, factory, path = new List(), seen = new Map()) {
        if (seen.get(name) !== undefined)  {
            throw new Error(`Dependency Cycle detected: ${path.toArray().join(" -> ")} -> ${name}`);
        }

        seen = seen.set(name, true);
        path = path.push(name);

        factory.getIn(["meta", "dependencies"]).forEach(dependency => {
            var dependentFactory = enrichedFactories.get(dependency);
            if (dependentFactory === undefined) {
                throw new Error(`Could not satisfy dependency for ${name}. Dependency ${dependency} is not defined.`);
            }

            this.testFactoryDoesNotContainCycle(enrichedFactories, dependency, dependentFactory, path, seen);
        });
    }

    stripEnrichedFactories(enrichedFactories) {
        return enrichedFactories.map(enrichedFactory => enrichedFactory.get("factory"));
    }
}
