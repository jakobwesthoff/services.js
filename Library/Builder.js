import Immutable, {List, Map, Seq} from "immutable";
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

        var configuration = this.mergeServiceConfigurations(configurations);
        // TODO: Introduce variable processing in the future
        return this.extractImmutableServiceDefinitions(configuration);
    }

    extractImmutableServiceDefinitions(configuration) {
        var services = configuration.services;

        // Only convert the first level of each service definition to immutable Map + some specially treeted properties.
        var conversionWhitelist = {
            "arguments": "toList"
        };

        var immutableServices = (new Map()).withMutations(servicesMap => {
            var serviceNames = Object.keys(services);
            serviceNames.forEach(serviceName => {
                var definition = services[serviceName];
                servicesMap.set(serviceName, (new Map()).withMutations(definitionMap => {
                    Object.keys(definition).forEach(definitionKey => {
                        var definitionValue = definition[definitionKey];
                        if (conversionWhitelist[definitionKey] !== undefined) {
                            definitionMap.set(definitionKey, (new Seq(definitionValue))[conversionWhitelist[definitionKey]]());
                        } else {
                            definitionMap.set(definitionKey, definitionValue);
                        }
                    });
                }));
            });
        });

        return immutableServices;
    };

    mergeServiceConfigurations(configurations) {
        // Isolate all needed first level elements
        var neededKeys = new Set();
        configurations.forEach(
            configuration => Object.keys(configuration).forEach(
                key => neededKeys.add(key)
            )
        );

        // Merge all first level keys into each other
        var mergedConfiguration = {};
        for(let key of neededKeys) {
            let configurationsWithKey = configurations
                .filter(configuration => configuration.hasOwnProperty(key))
                .map(configuration => configuration[key]);

            mergedConfiguration[key] = Object.assign({}, ...configurationsWithKey);
        }

        return mergedConfiguration;
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
