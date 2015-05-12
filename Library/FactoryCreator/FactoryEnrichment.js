import Immutable, {Map} from "immutable";

export default function FactoryEnrichment(FactoryCreator) {
    return class Enrichment {
        constructor(...args) {
            this.factoryCreator = new FactoryCreator(...args);
        }
        canHandle(definition) {
            return this.factoryCreator.canHandle(definition);
        }

        create(definition) {
            var factory = this.factoryCreator.create(definition);
            return new Map({
                meta: new Map({
                    dependencies: definition.get("arguments")
                }),
                factory
            });
        }
    }
}